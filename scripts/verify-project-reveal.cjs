const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#projects article')?.style.opacity === '0');
      const cards = page.locator('#projects article');
      const before = await cards.evaluateAll(elements => elements.map(element => element.offsetHeight));
      await page.locator('#project-results').evaluate(element => window.scrollTo({
        top: scrollY + element.getBoundingClientRect().top - 60, behavior: 'instant',
      }));
      await page.waitForFunction(() => document.querySelector('#projects article').getAnimations().some(a => a.effect.getTiming().duration === 650));
      const timings = await cards.evaluateAll(elements => elements.flatMap(element => element.getAnimations()
        .filter(a => a.effect.getTiming().duration === 650).map(a => a.effect.getTiming().delay)));
      if (width === 1440) assert.deepEqual(timings, [0, 90, 180, 270]);
      await page.screenshot({ path: `video-review/project-reveal-in-motion-${width}.png` });
      for (let index = 0; index < 4; index++) {
        await cards.nth(index).evaluate(element => window.scrollTo({
          top: scrollY + element.getBoundingClientRect().top - 120, behavior: 'instant',
        }));
        await page.waitForFunction(index => {
          const card = document.querySelectorAll('#projects article')[index];
          return getComputedStyle(card).opacity === '1' && card.getAnimations().length === 0;
        }, index);
      }
      assert.deepEqual(await cards.evaluateAll(elements => elements.map(element => element.offsetHeight)), before);
      await page.locator('#projects').evaluate(element => window.scrollTo({
        top: scrollY + element.getBoundingClientRect().top - 60, behavior: 'instant',
      }));
      const tabs = page.locator('#projects [role="tab"]');
      const metrics = await tabs.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        const count = element.querySelector('span span');
        return { height: rect.height, x: rect.x, count: count.textContent,
          sameFont: getComputedStyle(count).fontFamily === getComputedStyle(element).fontFamily,
          fits: element.scrollWidth <= element.clientWidth };
      }));
      assert.deepEqual(metrics.map(item => item.count), ['4', '1', '2', '1']);
      assert.ok(metrics.every(item => item.height === 82 && item.sameFont && item.fits));
      assert.equal(new Set(metrics.map(item => item.x)).size, width === 1440 ? 4 : 2);
      await page.getByRole('tab', { name: 'Компактные дома', exact: true }).click();
      assert.equal(await cards.count(), 1);
      await page.getByRole('tab', { name: 'Компактные дома', exact: true }).press('ArrowRight');
      assert.equal(await cards.count(), 2);
      await page.getByRole('tab', { name: 'Частные и коммерческие', exact: true }).press('End');
      assert.equal(await cards.count(), 1);
      await page.getByRole('tab', { name: 'Сложные участки', exact: true }).press('Home');
      assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      assert.equal(await cards.count(), 4);
      assert.ok(await cards.evaluateAll(elements => elements.every(element => element.style.opacity !== '0')));
      await page.screenshot({ path: `video-review/catalog-keys-${width}.png` });
      await page.getByRole('button', { name: 'Подробнее', exact: true }).first().click();
      await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
      assert.ok(await cards.evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1')));
      assert.deepEqual(errors, []);
      console.log(`${width}px: scroll reveal, stable heights, filters, modal and reduced motion OK`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
