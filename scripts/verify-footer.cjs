const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require('sharp');

const origin = 'http://localhost:3000';

async function openSite(page) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
  await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
  await page.evaluate(() => document.fonts.ready);
  // Isolate footer screenshots from fixed navigation and development overlays.
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; } nextjs-portal { display: none !important; } header { visibility: hidden !important; }' });
}

async function showFooter(page) {
  await page.locator('footer').evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(value => {
    const v = value / 255;
    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

async function checkContrast(page, width) {
  const footer = page.locator('footer');
  const copy = await footer.evaluate(root => {
    const bounds = root.getBoundingClientRect();
    return [...root.querySelectorAll('p, h3, li, a[href^="tel:"], span')]
      .filter(el => !el.children.length)
      .map(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        return {
          text: el.textContent,
          color: getComputedStyle(el).color.match(/[\d.]+/g).slice(0, 3).map(Number),
          rects: [...range.getClientRects()].map(r => ({ x: r.x - bounds.x, y: r.y - bounds.y, width: r.width, height: r.height })),
        };
      });
  });
  // Preserve layout and measure the actual video/shade pixels behind each line.
  await footer.evaluate(root => { root.lastElementChild.style.opacity = '0'; });
  const background = await footer.screenshot({ path: `video-review/footer-background-${width}.png` });
  await footer.evaluate(root => { root.lastElementChild.style.opacity = ''; });
  const { data, info } = await sharp(background).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let minimum = Infinity;
  for (const item of copy) {
    let lightest = 0;
    for (const rect of item.rects) {
      for (let y = Math.max(0, Math.ceil(rect.y)); y < Math.min(info.height, rect.y + rect.height); y += 2) {
        for (let x = Math.max(0, Math.ceil(rect.x)); x < Math.min(info.width, rect.x + rect.width); x += 2) {
          const offset = (y * info.width + x) * info.channels;
          lightest = Math.max(lightest, luminance([...data.subarray(offset, offset + 3)]));
        }
      }
    }
    const contrast = (luminance(item.color) + .05) / (lightest + .05);
    minimum = Math.min(minimum, contrast);
    assert.ok(contrast >= 4.5, `${width}px contrast ${contrast.toFixed(2)}: ${JSON.stringify(item)}`);
  }
  return minimum.toFixed(2);
}

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [width, height] of [[1920, 1080], [1440, 900], [768, 1024], [390, 844], [320, 812]]) {
      if (process.env.FOOTER_WIDTH && width !== Number(process.env.FOOTER_WIDTH)) continue;
      const page = await browser.newPage({ viewport: { width, height } });
      const requests = [];
      const errors = [];
      page.on('request', req => { if (req.url().includes('/footer/')) requests.push(req.url()); });
      page.on('pageerror', error => errors.push(error.message));
      await openSite(page);
      assert.equal(requests.length, 0, 'Footer assets are not requested at the intro');
      await showFooter(page);
      const logo = page.locator('footer img[alt="Ройстрой"]');
      await logo.evaluate(el => el.decode());
      assert.ok(await logo.evaluate(el => el.naturalWidth > 0 && el.getAttribute('src').includes('logo-white.png')));
      const headerLogoWidth = await page.locator('header img[alt="Ройстрой"]').evaluate(el => el.getBoundingClientRect().width);
      assert.equal(await logo.evaluate(el => el.getBoundingClientRect().width), headerLogoWidth, 'Footer logo matches header sizing');
      assert.equal(await logo.locator('..').getAttribute('href'), '#');
      await page.waitForFunction(() => {
        const video = document.querySelector('footer video');
        return video.readyState >= 2 && !video.paused && video.currentTime > .1;
      });
      const video = page.locator('footer video');
      assert.ok(await video.evaluate(el => el.muted && el.loop && el.playsInline));
      const time = await video.evaluate(el => el.currentTime);
      await page.waitForTimeout(1000);
      assert.ok((await video.evaluate(el => el.currentTime)) > time + .4, 'Footage advances');
      await page.getByRole('button', { name: 'Приостановить фоновое видео', exact: true }).click();
      assert.ok(await video.evaluate(el => el.paused));
      await video.evaluate(el => { el.currentTime = 2; });
      await page.waitForFunction(() => !document.querySelector('footer video').seeking);
      await page.locator('footer').screenshot({ path: `video-review/footer-${width}.png` });
      const contrast = await checkContrast(page, width);
      const overflows = await page.locator('footer').evaluate(root => [...root.querySelectorAll('p, li, h3, a, button, span')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline';
      }).map(el => el.textContent));
      assert.deepEqual(overflows, [], 'Footer has no overflowing text');
      assert.ok(await page.locator('footer nav a').evaluateAll(links => links.every(link => document.getElementById(link.hash.slice(1)))));
      await page.getByRole('button', { name: 'Включить фоновое видео', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('footer video').paused);
      await page.evaluate(() => window.scrollTo({ top: document.querySelector('#engineering').offsetTop, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('footer video').paused);
      await showFooter(page);
      await page.waitForFunction(() => !document.querySelector('footer video').paused);
      assert.deepEqual(errors, [], 'No runtime errors');
      console.log(`${width}px: lazy load, playback, pause, resume, links, layout OK; minimum text contrast ${contrast}:1`);
      await page.close();
    }

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const reducedRequests = [];
    reduced.on('request', req => { if (req.url().includes('villa-loop.mp4')) reducedRequests.push(req.url()); });
    await openSite(reduced);
    await showFooter(reduced);
    await reduced.waitForFunction(() => document.querySelector('footer img')?.naturalWidth > 0);
    assert.equal(reducedRequests.length, 0, 'Reduced motion uses poster without downloading video');
    await reduced.locator('footer').screenshot({ path: 'video-review/footer-reduced-motion.png' });
    await reduced.getByRole('button', { name: 'Включить фоновое видео', exact: true }).click();
    await reduced.waitForFunction(() => document.querySelector('footer video').currentTime > .1);
    await reduced.close();

    const fallback = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await fallback.route('**/footer/villa-loop.mp4', route => route.abort());
    await openSite(fallback);
    await showFooter(fallback);
    await fallback.waitForFunction(() => document.querySelector('footer video')?.error && document.querySelector('footer img')?.naturalWidth > 0);
    await fallback.locator('footer').screenshot({ path: 'video-review/footer-video-fallback.png' });
    assert.equal(await fallback.locator('footer button').count(), 0);
    await fallback.close();
    console.log('Reduced motion, manual opt-in and failed-video poster fallback OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
