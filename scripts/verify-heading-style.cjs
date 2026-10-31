const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
      await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('header') && document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
      await page.evaluate(() => document.fonts.ready);
      const headings = await page.locator('.concrete-section h2').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        const range = document.createRange();
        range.selectNodeContents(element);
        return {
          text: element.textContent.trim(), weight: style.fontWeight,
          fontStyle: style.fontStyle, color: style.color,
          overflow: Array.from(range.getClientRects()).some(rect => rect.right > innerWidth + 1 || rect.left < -1),
          spans: element.querySelectorAll('span').length,
        };
      }));
      assert.equal(headings.length, 7);
      for (const heading of headings) {
        assert.equal(heading.weight, '700', heading.text);
        assert.equal(heading.fontStyle, 'normal', heading.text);
        assert.equal(heading.spans, 0, heading.text);
        assert.equal(heading.overflow, false, `Overflow at ${width}px: ${heading.text}`);
        assert.equal(heading.color, 'rgb(32, 36, 40)', heading.text);
      }
      assert.equal(await page.getByText('Интерактивная WebGL-модель', { exact: true }).count(), 0);
      await page.screenshot({ path: `video-review/headings-3d-${width}.png` });
      await page.locator('#instagram').evaluate(element => window.scrollTo({ top: scrollY + element.getBoundingClientRect().top, behavior: 'instant' }));
      await page.screenshot({ path: `video-review/headings-instagram-${width}.png` });
      console.log(`${width}px: all seven headings have uniform styling, no overflowing text, no WebGL badge`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
