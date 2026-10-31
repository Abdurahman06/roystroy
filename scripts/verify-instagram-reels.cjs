const assert = require('node:assert/strict');
const { mkdir, writeFile } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const reels = require('../src/data/instagram-reels.json');
const sharp = require('sharp');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      const mediaRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('/instagram/') && request.url().endsWith('.mp4')) mediaRequests.push(request.url());
      });
      await page.route('https://tile.openstreetmap.org/**', route => route.abort());
      // Verify outgoing navigation without fetching Instagram during UI tests.
      await page.context().route('https://www.instagram.com/**', route => route.fulfill({
        status: 200, contentType: 'text/html', body: '<title>Reel destination test</title>',
      }));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      assert.equal(mediaRequests.length, 0, 'Reel videos must not load during the intro');
      await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
      await page.locator('#instagram').evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 80, behavior: 'instant' }));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('#instagram video')].some(v => v.currentTime > 0.1));
      await page.waitForTimeout(250);
      await page.screenshot({ path: `video-review/instagram-${width}.png` });
      assert.ok(await page.locator('#instagram').evaluate(el => el.scrollWidth <= innerWidth), 'Section fits viewport');
      const cards = page.locator('#instagram [data-reel]');
      assert.equal(await cards.count(), 4);
      for (const reel of reels) {
        const card = page.locator(`[data-reel="${reel.id}"]`);
        await card.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 130, behavior: 'instant' }));
        await page.waitForFunction(id => {
          const video = document.querySelector(`[data-reel="${id}"] video`);
          return video.readyState >= 2 && !video.paused && video.currentTime > 0;
        }, reel.id);
        const meta = await card.locator('video').evaluate(v => ({ muted: v.muted, loop: v.loop, inline: v.playsInline, duration: v.duration, width: v.videoWidth, error: v.error }));
        assert.ok(meta.muted && meta.loop && meta.inline && !meta.error);
        assert.ok(meta.duration <= 8.1 && meta.width <= 540);
        assert.equal(await card.locator('h3').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
        assert.ok(await card.locator('img').evaluate(el => el.complete && el.naturalWidth > 0));
        if (reel.instagramUrl) {
          assert.equal(await card.locator('a').getAttribute('href'), reel.instagramUrl);
          assert.equal(await card.locator('a').getAttribute('target'), '_blank');
          assert.match(await card.locator('a').getAttribute('rel'), /noopener/);
          const opened = page.waitForEvent('popup');
          await card.locator('a').click();
          const popup = await opened;
          await popup.waitForLoadState('domcontentloaded');
          assert.equal(popup.url(), reel.instagramUrl, 'Card opens its own reel, not the profile');
          await popup.close();
        } else {
          assert.equal(await card.locator('a').count(), 0, 'No fabricated reel destination before URL is supplied');
        }
        const before = await card.locator('video').screenshot();
        await page.waitForTimeout(250);
        const after = await card.locator('video').screenshot();
        assert.notDeepEqual(before, after, 'Preview pixels must move');
        const stats = await sharp(after).stats();
        assert.ok(stats.channels.slice(0, 3).some(c => c.stdev > 15), 'Actual video must be visible');
      }
      const first = page.locator('[data-reel="foundation"]');
      await first.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 130, behavior: 'instant' }));
      await page.waitForFunction(() => !document.querySelector('[data-reel="foundation"] video').paused);
      await first.getByRole('button', { name: /Приостановить/ }).click();
      assert.equal(await first.locator('video').evaluate(v => v.paused), true);
      const pausedTime = await first.locator('video').evaluate(v => v.currentTime);
      await page.waitForTimeout(250);
      assert.equal(await first.locator('video').evaluate(v => v.currentTime), pausedTime);
      await first.getByRole('button', { name: /Включить/ }).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.querySelector('[data-reel="foundation"] video').paused);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => [...document.querySelectorAll('#instagram video')].every(v => v.paused));
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForFunction(() => !document.querySelector('[data-reel="foundation"] video').paused);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => [...document.querySelectorAll('#instagram video')].every(v => v.paused));
      assert.deepEqual(errors, []);
      results.push({ width, passed: true });
      await page.close();
    }

    for (const mode of ['reduced-motion', 'save-data', 'failed-video', 'blocked-autoplay']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference' });
      await page.route('https://tile.openstreetmap.org/**', route => route.abort());
      if (mode === 'save-data') await page.addInitScript(() => {
        const connection = new EventTarget();
        connection.saveData = true;
        Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
      });
      if (mode === 'failed-video') await page.route('**/instagram/*.mp4', route => route.abort());
      if (mode === 'blocked-autoplay') await page.addInitScript(() => {
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          if (this.closest('#instagram') && !window.__allowPreview) return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
          return play.call(this);
        };
      });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
      const first = page.locator('[data-reel="foundation"]');
      await first.evaluate(el => window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 130, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('[data-reel="foundation"] img')?.naturalWidth > 0);
      await page.waitForTimeout(500);
      if (mode === 'failed-video') {
        assert.equal(await first.locator('video').evaluate(v => getComputedStyle(v).opacity), '0');
        assert.equal(await first.locator('img').evaluate(el => el.complete), true);
      } else {
        assert.equal(await first.locator('video').evaluate(v => v.paused), true);
        if (mode !== 'blocked-autoplay') assert.equal(await first.locator('video').getAttribute('src'), null, 'No automatic video download with reduced motion or data saver');
        if (mode === 'blocked-autoplay') await page.evaluate(() => { window.__allowPreview = true; });
        await first.getByRole('button', { name: /Включить/ }).click();
        await page.waitForFunction(() => document.querySelector('[data-reel="foundation"] video').currentTime > 0);
      }
      results.push({ mode, passed: true });
      await page.close();
    }
    await writeFile('video-review/instagram-reels-results.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
