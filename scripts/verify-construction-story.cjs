const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

function inverseSmoothstep(value) {
  let low = 0, high = 1;
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
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => [...document.querySelectorAll('#construction-film video')].every(video => Number.isFinite(video.duration)));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => scrollY === 0 && document.getElementById('construction-film').offsetHeight > innerHeight * 10);
      assert.equal(await page.locator('[data-current="true"]').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Обсудить проект', exact: true }).count(), 0, 'Hidden CTA must not be accessible');
      const blur = await page.locator('#construction-film video').first().evaluate(video => getComputedStyle(video).filter);
      assert.ok(blur.includes('blur(24px)'), 'Initial logo keeps its blurred background');
      await page.screenshot({ path: `video-review/story-logo-${viewport.width}.png` });
      const durations = await page.locator('#construction-film video').evaluateAll(videos => videos.map(video => video.duration));
      const total = durations.reduce((a, b) => a + b, 0);
      const rate = Number(await page.locator('#construction-film').getAttribute('data-film-rate'));
      const scrollTo = async (index, fraction = .5) => {
        const elapsed = durations.slice(0, index).reduce((a, b) => a + b, 0) + durations[index] * fraction;
        const y = viewport.height * (1 + total / rate * inverseSmoothstep(elapsed / total));
        await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
        await page.waitForFunction(index => {
          const article = document.querySelector(`[data-chapter="${index}"]`);
          return article.dataset.current === 'true' && Number(article.style.opacity) > .99;
        }, index);
        await page.waitForFunction(({ index, time }) => {
          const video = document.querySelectorAll('#construction-film video')[index];
          return video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - time) < .08;
        }, { index, time: durations[index] * fraction });
      };
      for (const index of [0, 1, 2, 3, 4, 2, 0, 4]) {
        await scrollTo(index);
        assert.equal(await page.locator('[data-current="true"]').count(), 1, 'Exactly one caption is readable');
        const article = page.locator(`[data-chapter="${index}"]`);
        const checks = await article.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const timeline = document.querySelector('ol[aria-label="Этапы строительства"]').getBoundingClientRect();
          const skip = document.querySelector('button[title="Пропустить анимацию (Enter)"]').getBoundingClientRect();
          const contentFits = [...element.querySelectorAll('h2, p, button')].every(child => child.scrollWidth <= child.clientWidth + 1);
          return { top: bounds.top, bottom: bounds.bottom, timelineTop: timeline.top, skipTop: skip.top, contentFits, inert: element.inert };
        });
        assert.ok(checks.top >= 0 && checks.bottom <= checks.timelineTop - 8 && checks.bottom <= checks.skipTop, JSON.stringify(checks));
        assert.ok(checks.contentFits && !checks.inert);
        assert.equal(await page.locator('#construction-film li[aria-current="step"]').count(), 1);
        await page.screenshot({ path: `video-review/story-stage-${index + 1}-${viewport.width}.png` });
      }
      await page.getByRole('button', { name: 'Обсудить проект', exact: true }).click();
      await page.getByRole('heading', { name: 'Обсудить проект виллы', exact: true }).waitFor();
      assert.ok(await page.locator('header').count());
      await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
      assert.equal(await page.locator('#construction-film > [aria-hidden]').evaluate(element => element.style.visibility), 'hidden');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await scrollTo(2);
      assert.equal(await page.locator('[data-chapter="2"] h2').evaluate(element => element.style.transform), 'translateY(0px)');
      assert.deepEqual(errors, []);
      console.log(`${viewport.width}x${viewport.height}: five captions, reverse scroll, layout, CTA, reduced motion OK`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
