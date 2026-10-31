const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

function luminance(color) {
  const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const v = value / 255;
    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
      await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
      await page.evaluate(() => document.fonts.ready);
      const group = page.getByRole('group', { name: 'Направления работы', exact: true });
      const button = page.locator('#engineering-tab-machinery');
      const truck = page.locator('[data-machinery-truck]');
      await group.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      await button.click();
      await truck.evaluate(element => { const a = element.getAnimations()[0]; a.pause(); a.currentTime = 0; });
      await page.waitForTimeout(350);
      const start = await truck.boundingBox();
      await truck.evaluate(element => { element.getAnimations()[0].currentTime = 430; });
      const moving = await truck.boundingBox();
      assert.ok(moving.x > start.x + 5, `Truck moves right: ${start.x} -> ${moving.x}`);
      assert.deepEqual(await button.boundingBox(), box, 'Animation does not move the card');
      await group.screenshot({ path: `video-review/machinery-moving-${width}.png` });
      await truck.evaluate(element => { element.getAnimations()[0].currentTime = 700; });
      assert.ok((await truck.boundingBox()).x < start.x - 5, 'Truck re-enters from left');
      await button.click();
      assert.equal(await truck.evaluate(element => element.getAnimations().length), 1, 'Repeated click restarts one animation');
      await button.focus();
      await page.keyboard.press('Enter');
      assert.equal(await truck.evaluate(element => element.getAnimations().length), 1, 'Keyboard click restarts animation');
      await page.waitForFunction(() => document.querySelector('[data-machinery-truck]').getAnimations().length === 0);
      assert.ok(Math.abs((await truck.boundingBox()).x - start.x) < .1, 'Truck returns home');
      await group.screenshot({ path: `video-review/machinery-rest-${width}.png` });
      for (const id of ['seismic', 'relief', 'gost']) {
        const tab = page.locator(`#engineering-tab-${id}`);
        const icon = page.locator(`[data-engineering-icon="${id}"]`);
        const expected = id === 'relief' ? 1 : 2;
        const tabBounds = await tab.boundingBox();
        await tab.click();
        assert.equal(await icon.evaluate(el => el.getAnimations({ subtree: true }).length), expected);
        await icon.evaluate(el => el.getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = 0; }));
        const initialTransform = await icon.evaluate(el => getComputedStyle(el).transform);
        await icon.evaluate(el => el.getAnimations({ subtree: true }).forEach(a => { a.currentTime = 400; }));
        assert.notEqual(await icon.evaluate(el => getComputedStyle(el).transform), initialTransform, `${id} moves`);
        assert.deepEqual(await tab.boundingBox(), tabBounds, `${id} does not move its card`);
        if (id !== 'relief') {
          const path = icon.locator(id === 'gost' ? 'path:last-child' : 'path');
          await icon.evaluate(el => el.getAnimations({ subtree: true }).forEach(a => { a.currentTime = 200; }));
          const firstOffset = await path.evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset));
          await icon.evaluate(el => el.getAnimations({ subtree: true }).forEach(a => { a.currentTime = 650; }));
          assert.ok(await path.evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset)) < firstOffset, `${id} path is drawn`);
        }
        await group.screenshot({ path: `video-review/engineering-${id}-moving-${width}.png` });
        await tab.click();
        await tab.click();
        assert.equal(await icon.evaluate(el => el.getAnimations({ subtree: true }).length), expected, 'Rapid clicks restart instead of stacking');
        await tab.focus();
        await page.keyboard.press('Space');
        assert.equal(await icon.evaluate(el => el.getAnimations({ subtree: true }).length), expected, 'Keyboard activates icon motion');
        await page.waitForFunction(id => document.querySelector(`[data-engineering-icon="${id}"]`).getAnimations({ subtree: true }).length === 0, id);
        assert.equal(await icon.evaluate(el => getComputedStyle(el).transform), 'none', `${id} returns to its original state`);
        if (id !== 'relief') {
          assert.equal(await icon.locator('path:last-child').evaluate(el => getComputedStyle(el).strokeDasharray), 'none', 'No partial stroke remains');
        }
        await tab.click();
        await button.click();
        assert.equal(await icon.evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'Changing sections cancels every moving part');
      }
      for (const id of ['seismic', 'machinery', 'relief', 'gost']) {
        const tab = page.locator(`#engineering-tab-${id}`);
        await tab.click();
        await page.waitForTimeout(350);
        const colors = await tab.evaluate(element => ({
          background: getComputedStyle(element).backgroundColor,
          title: getComputedStyle(element.querySelector('h3')).color,
          description: getComputedStyle(element.querySelector('p')).color,
        }));
        for (const color of [colors.title, colors.description]) {
          assert.ok((luminance(color) + .05) / (luminance(colors.background) + .05) >= 4.5, JSON.stringify(colors));
        }
        assert.equal(await tab.getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#engineering-details').getAttribute('aria-labelledby'), `engineering-tab-${id}`);
      }
      assert.equal(await truck.evaluate(element => element.getAnimations().length), 0, 'Changing sections cancels animation');
      const overflow = await group.locator('button').evaluateAll(buttons => buttons.filter(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const box = element.getBoundingClientRect();
        return [...range.getClientRects()].some(rect => rect.width && (rect.right > box.right + 1 || rect.left < box.left - 1));
      }).map(element => element.id));
      assert.deepEqual(overflow, [], `Text overflows at ${width}px`);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const id of ['seismic', 'machinery', 'relief', 'gost']) {
        const tab = page.locator(`#engineering-tab-${id}`);
        await tab.click();
        assert.equal(await tab.locator('[data-engineering-icon]').evaluate(el => el.getAnimations({ subtree: true }).length), 0);
        assert.equal(await tab.getAttribute('aria-pressed'), 'true');
      }
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('#engineering-tab-gost').click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => [...document.querySelectorAll('[data-engineering-icon]')].every(el => el.getAnimations({ subtree: true }).length === 0));
      assert.deepEqual(errors, []);
      console.log(`${width}px: all four icon animations, stroke drawing, restart, keyboard, stable layout, contrast and reduced motion OK`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
