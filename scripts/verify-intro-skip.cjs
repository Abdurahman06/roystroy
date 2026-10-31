const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const options of [
      { viewport: { width: 1440, height: 900 } },
      { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
    ]) {
      const page = await browser.newPage(options);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      // Skipping must also work before any video data has arrived.
      await page.route('**/animation-web/**/*.mp4', route => route.abort());
      const load = async () => {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
      };
      const checkExit = async () => {
        await page.waitForFunction(() => {
          const overlay = document.querySelector('#construction-film > [aria-hidden]');
          return document.querySelector('header') && overlay.style.visibility === 'hidden'
            && Math.abs(document.getElementById('3d-explorer').getBoundingClientRect().top) < 2;
        });
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H2');
      };

      await load();
      const button = page.getByRole('button', { name: 'Пропустить', exact: true });
      await button.screenshot({ path: `video-review/skip-button-${options.viewport.width}.png` });
      // Record frames to ensure the viewport jump happens under an opaque cover.
      await page.evaluate(() => {
        window.skipFrames = [];
        const sample = () => {
          const overlay = document.querySelector('#construction-film > [aria-hidden]');
          window.skipFrames.push({ y: scrollY, opacity: Number(getComputedStyle(overlay).opacity) });
          if (window.skipFrames.length < 180) window.skipSample = requestAnimationFrame(sample);
        };
        sample();
      });
      await button.click();
      await checkExit();
      const frames = await page.evaluate(() => {
        cancelAnimationFrame(window.skipSample);
        return window.skipFrames;
      });
      const jump = frames.findIndex((frame, index) => index > 0 && frame.y - frames[index - 1].y > 1000);
      if (options.reducedMotion !== 'reduce') {
        assert.ok(jump >= 0, 'Expected a single covered jump');
        assert.ok(frames[jump].opacity > 0.95, 'Scroll jump must be concealed');
      }
      await page.screenshot({ path: `video-review/skip-site-${options.viewport.width}.png` });
      const position = await page.evaluate(() => scrollY);
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => scrollY), position, 'Enter on the site must not restart skip');

      await load();
      await page.evaluate(() => window.scrollTo({ top: innerHeight * 3, behavior: 'instant' }));
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await checkExit();
      assert.deepEqual(errors, []);
      console.log(`${options.viewport.width}px ${options.reducedMotion || 'normal'}: click, Enter mid-intro, repeated Enter, unloaded videos and focus OK`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
