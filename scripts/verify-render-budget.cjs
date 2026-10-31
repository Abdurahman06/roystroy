const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require('sharp');

const baseline = process.env.PERF_BASELINE === '1';
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
      const errors = [];
      page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR:', error.message); });
      // This test does not exercise the map or fetch live OSM tiles.
      await page.route('https://tile.openstreetmap.org/**', route => route.abort());
      await page.addInitScript(() => {
        window.__renderWork = { draws: 0, introMutations: 0 };
        for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
          if (!type) continue;
          for (const method of ['drawElements', 'drawArrays']) {
            const original = type.prototype[method];
            type.prototype[method] = function (...args) {
              if (this.canvas.closest('[id="3d-explorer"]')) window.__renderWork.draws++;
              return original.apply(this, args);
            };
          }
        }
      });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      try {
        await page.waitForFunction(() => document.querySelector('#construction-film')?.offsetHeight > innerHeight * 10);
      } catch (error) {
        console.error(await page.evaluate(() => ({ height: document.querySelector('#construction-film')?.offsetHeight, viewport: innerHeight, text: document.body.innerText.slice(0, 1500) })));
        throw error;
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const sample = async () => {
        await page.evaluate(() => { window.__renderWork.draws = 0; window.__renderWork.introMutations = 0; });
        await page.waitForTimeout(700);
        return page.evaluate(() => ({ ...window.__renderWork }));
      };
      const duringIntro = await sample();
      if (!baseline) {
        assert.equal(await page.locator('[id="3d-explorer"] canvas').count(), 0, 'No WebGL initialization far below the intro');
        assert.equal(duringIntro.draws, 0, 'No offscreen WebGL drawing during the intro');
      }
      await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
      await page.locator('[id="3d-explorer"] canvas').waitFor();
      await page.waitForTimeout(1000);
      const visible = await sample();
      assert.ok(visible.draws > 0, 'Visible scene must animate');
      const canvas = page.locator('[id="3d-explorer"] canvas');
      const shotA = await canvas.screenshot({ path: `video-review/perf-${baseline ? 'before' : 'after'}-${viewport.width}.png` });
      const stats = await sharp(shotA).stats();
      assert.ok(stats.channels.slice(0, 3).some(channel => channel.stdev > 12), 'Canvas must contain a nonblank house scene');
      await page.waitForTimeout(400);
      const shotB = await canvas.screenshot();
      assert.notDeepEqual(shotA, shotB, 'Auto-rotation must change canvas pixels');

      if (!baseline) {
        const controls = [];
        for (const name of ['Фасад', 'Монолит 9 баллов', 'Чертеж (Сетка)']) {
          controls.push(await page.getByRole('button', { name, exact: true }).boundingBox());
        }
        for (const title of ['Солнечный полдень', 'Закат на ЮБК', 'Ночная архитектурная подсветка']) {
          controls.push(await page.getByTitle(title, { exact: true }).boundingBox());
        }
        for (let i = 0; i < controls.length; i++) {
          const a = controls[i];
          assert.ok(a && a.x >= 0 && a.x + a.width <= viewport.width + 1, 'Controls fit the viewport');
          for (let j = i + 1; j < controls.length; j++) {
            const b = controls[j];
            assert.ok(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1, '3D controls do not overlap');
          }
        }
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        assert.equal((await sample()).draws, 0, 'Hidden-document signal stops the render loop');
        await page.evaluate(() => {
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        assert.ok((await sample()).draws > 0, 'Visible-document signal resumes the render loop');
        for (const title of ['Солнечный полдень', 'Ночная архитектурная подсветка', 'Закат на ЮБК']) {
          await page.getByTitle(title, { exact: true }).click();
          await page.waitForTimeout(150);
          const shot = await canvas.screenshot();
          assert.notDeepEqual(shotA, shot, `Lighting responds: ${title}`);
        }
        for (const name of ['Монолит 9 баллов', 'Чертеж (Сетка)', 'Фасад']) {
          await page.getByRole('button', { name, exact: true }).click();
          await page.waitForTimeout(150);
          const modeStats = await sharp(await canvas.screenshot()).stats();
          assert.ok(modeStats.channels.slice(0, 3).some(channel => channel.stdev > 12), `Mode renders: ${name}`);
        }
        await page.getByRole('button', { name: 'Автооблет: Вкл', exact: true }).click();
        const beforeDrag = await canvas.screenshot();
        const box = await canvas.boundingBox();
        await page.mouse.move(box.x + box.width * .55, box.y + box.height * .4);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * .75, box.y + box.height * .4, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(300);
        assert.notDeepEqual(beforeDrag, await canvas.screenshot(), 'Manual orbit remains interactive');
        await page.getByTitle('Сбросить ракурс', { exact: true }).click();
      }

      await page.evaluate(() => {
        const film = document.querySelector('#construction-film');
        new MutationObserver(records => { window.__renderWork.introMutations += records.length; })
          .observe(film, { attributes: true, subtree: true });
        const section = document.querySelector('#calculator');
        window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: 'instant' });
      });
      await page.waitForTimeout(900);
      const offscreen = await sample();
      if (!baseline) {
        assert.equal(offscreen.draws, 0, 'No drawing after the 3D viewer leaves the viewport');
        const before = await page.evaluate(() => window.__renderWork.introMutations);
        await page.evaluate(() => window.scrollBy({ top: 80, behavior: 'instant' }));
        await page.waitForTimeout(300);
        const after = await page.evaluate(() => window.__renderWork.introMutations);
        assert.equal(after, before, 'Scrolling the site must not rewrite hidden intro styles');

        await page.locator('[id="3d-explorer"]').evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 200, behavior: 'instant' }));
        await page.waitForTimeout(500);
        assert.ok((await sample()).draws > 0, 'Scene resumes after returning');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(1000);
        assert.equal((await sample()).draws, 0, 'Reduced motion settles to a still scene');
        await page.getByTitle('Солнечный полдень', { exact: true }).click();
        await page.waitForTimeout(200);
        assert.ok((await sharp(await canvas.screenshot()).stats()).channels.some(channel => channel.stdev > 12));
      }
      assert.deepEqual(errors, [], 'No runtime errors');
      results.push({ viewport, duringIntro, visible, offscreen });
      console.log(JSON.stringify(results.at(-1)));
      await page.close();
    }
    await writeFile(`video-review/render-budget-${baseline ? 'before' : 'after'}.json`, JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
