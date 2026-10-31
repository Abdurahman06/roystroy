const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

function inverseSmoothstep(value) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (mid * mid * (3 - 2 * mid) < value) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => {
        const videos = [...document.querySelectorAll('#construction-film video')];
        return videos.length === 5 && videos.every(video => Number.isFinite(video.duration))
          && document.getElementById('construction-film').offsetHeight > window.innerHeight * 10;
      });
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      const durations = await page.locator('#construction-film video').evaluateAll(videos => videos.map(video => video.duration));
      assert.ok(durations.every(duration => Math.abs(duration - 121 / 24) < 0.05));
      const sources = await page.locator('#construction-film video').evaluateAll(videos => videos.map(video => video.currentSrc));
      assert.ok(sources.every(source => source.includes('/animation-web/clean-v1/')));
      await page.waitForFunction(() => document.querySelector('#construction-film video').readyState >= 2);
      await page.screenshot({ path: `video-review/clean-intro-${viewport.width}.png` });
      const total = durations.reduce((a, b) => a + b, 0);
      const filmRate = Number(await page.locator('#construction-film').getAttribute('data-film-rate'));

      for (const index of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
        const hashes = [];
        for (const fraction of [0.25, 0.75]) {
          const target = durations[index] * fraction;
          const elapsed = durations.slice(0, index).reduce((a, b) => a + b, 0) + target;
          const scroll = viewport.height * (1 + total / filmRate * inverseSmoothstep(elapsed / total));
          await page.evaluate(y => window.scrollTo(0, y), scroll);
          await page.waitForFunction(({ index, target }) => {
            const video = document.querySelectorAll('#construction-film video')[index];
            return video.style.visibility === 'visible' && !video.seeking && video.readyState >= 2 && Math.abs(video.currentTime - target) < 0.08;
          }, { index, target }, { timeout: 15000 }).catch(async error => {
            console.log(await page.evaluate(() => ({
              y: window.scrollY, height: document.getElementById('construction-film').offsetHeight,
              videos: [...document.querySelectorAll('#construction-film video')].map(v => ({
                time: v.currentTime, ready: v.readyState, seeking: v.seeking,
                visible: v.style.visibility, error: v.error?.message,
              })),
            })));
            throw error;
          });
          hashes.push(await page.locator('#construction-film video').nth(index).evaluate(video => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 18;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, 32, 18);
            return Array.from(context.getImageData(0, 0, 32, 18).data).reduce((hash, value) => (hash * 31 + value) >>> 0, 0);
          }));
        }
        assert.notEqual(hashes[0], hashes[1], `Frozen stage ${index + 1}`);
        console.log(`${viewport.width}px: stage ${index + 1} seeks and decodes`, hashes);
        if (index === 4) await page.screenshot({ path: `video-review/clean-final-${viewport.width}.png` });
      }
      await page.evaluate(() => window.scrollTo(0, document.getElementById('construction-film').offsetHeight));
      await page.waitForFunction(() => document.querySelector('header') !== null);
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}px: site exit OK; no page errors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
