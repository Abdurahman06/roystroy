const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto('http://localhost:3000/demo/filters', { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      for (const id of ['blueprint', 'console', 'facade', 'slider', 'mechanical', 'markup']) {
        const section = page.locator(`#${id}`);
        assert.equal(await section.getByRole('tab').count(), 4);
        for (const [label, count] of [['Компактные дома', 1], ['Частные и коммерческие', 2], ['Сложные участки', 1], ['Все', 4]]) {
          const tab = section.getByRole('tab', { name: label, exact: true });
          await tab.click();
          await page.waitForFunction(tabId => document.getElementById(tabId)?.getAttribute('aria-selected') === 'true', await tab.getAttribute('id'));
          assert.equal(await tab.getAttribute('aria-selected'), 'true');
          assert.equal(await section.locator('article').count(), count);
        }
        const tabs = section.getByRole('tab');
        await tabs.first().focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(tabId => document.getElementById(tabId)?.getAttribute('aria-selected') === 'true', `${id}-tab-compact`);
        assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
        await page.keyboard.press('End');
        await page.waitForFunction(tabId => document.getElementById(tabId)?.getAttribute('aria-selected') === 'true', `${id}-tab-complex`);
        assert.equal(await tabs.nth(3).getAttribute('aria-selected'), 'true');
        await page.keyboard.press('Home');
        await page.waitForFunction(tabId => document.getElementById(tabId)?.getAttribute('aria-selected') === 'true', `${id}-tab-all`);
        assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
        const overflow = await tabs.evaluateAll(elements => elements.some(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const box = element.getBoundingClientRect();
          return [...range.getClientRects()].some(rect => rect.width && (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1));
        }));
        assert.equal(overflow, false, `${id} labels overflow at ${width}px`);
        if (id === 'mechanical') {
          const heights = await tabs.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
          assert.ok(heights.every(height => Math.abs(height - 82) < 0.1), `Unexpected key heights at ${width}px: ${heights}`);
          assert.ok(await tabs.evaluateAll(elements => elements.every(element => {
            const top = element.querySelector('span[aria-hidden]');
            return top.querySelector('svg').getBoundingClientRect().width === 16
              && top.querySelector('span').getBoundingClientRect().width > 0
              && element.lastElementChild.getBoundingClientRect().height === 2;
          })), 'Original icons, counts and indicator must remain visible');
          if (width === 1440) assert.ok((await section.getByRole('tablist').boundingBox()).width <= 880);
        }
      }
      await page.evaluate(() => document.querySelectorAll('img').forEach(image => { image.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0), null, { timeout: 30000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.evaluate(() => Promise.allSettled(document.getAnimations().map(animation => animation.finished)));
      await page.screenshot({ path: `video-review/filter-demo-${width}.png`, fullPage: true });
      for (const id of ['slider', 'mechanical', 'markup']) {
        await page.locator(`#${id}`).screenshot({ path: `video-review/filter-demo-${id}-${width}.png` });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('#console').getByRole('tab', { name: 'Сложные участки', exact: true }).click();
      assert.equal(await page.locator('#console article').count(), 1);
      assert.deepEqual(errors, []);
      console.log(`${width}px: all six variants filter correctly; keyboard, imagery, text bounds and reduced motion OK`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
