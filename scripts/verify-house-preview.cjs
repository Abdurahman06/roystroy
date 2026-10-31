const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const sharp = require('sharp');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function pixels(canvas) {
  return sharp(await canvas.screenshot()).resize(160, 120).removeAlpha().raw().toBuffer();
}
function difference(a, b) {
  return a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length;
}

(async () => {
  await mkdir('video-review', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 960 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') console.log('Browser:', message.text()); });
      const start = Date.now();
      await page.goto('http://localhost:3000/demo/house', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-ready="true"]').waitFor({ timeout: 90000 });
      console.log(`${width}px: ready in ${Date.now() - start}ms`);
      await page.waitForTimeout(1800);
      const canvas = page.locator('canvas');
      const initial = await pixels(canvas);
      assert.ok(Math.max(...initial) - Math.min(...initial) > 60, 'Canvas must contain visible geometry');
      await page.screenshot({ path: `video-review/house-day-${width}.png` });
      await page.getByRole('button', { name: 'Вечер', exact: true }).click();
      await page.waitForTimeout(1600);
      const dusk = await pixels(canvas);
      assert.ok(difference(initial, dusk) > 2, 'Sunset must change the image');
      await page.screenshot({ path: `video-review/house-evening-${width}.png` });
      await page.getByRole('button', { name: 'Ночь', exact: true }).click();
      await page.waitForTimeout(1600);
      assert.ok(difference(dusk, await pixels(canvas)) > 8, 'Night must change the image');
      await page.screenshot({ path: `video-review/house-night-${width}.png` });
      await page.getByRole('button', { name: 'День', exact: true }).click();
      await page.waitForTimeout(1500);
      await page.getByLabel('Кровля', { exact: true }).uncheck();
      await page.waitForTimeout(150);
      assert.ok(difference(initial, await pixels(canvas)) > .3, 'Roof visibility must change the image');
      await page.screenshot({ path: `video-review/house-no-roof-${width}.png` });
      await page.getByLabel('Кровля', { exact: true }).check();
      for (const label of ['Остекление', 'Участок']) {
        const before = await pixels(canvas);
        await page.getByLabel(label, { exact: true }).uncheck();
        assert.ok(difference(before, await pixels(canvas)) > .15, `${label} must change the image`);
        await page.getByLabel(label, { exact: true }).check();
      }
      await page.getByRole('button', { name: 'Сетка', exact: true }).click();
      assert.ok(difference(initial, await pixels(canvas)) > 1, 'Wireframe must change the image');
      await page.getByRole('button', { name: 'Фасад', exact: true }).click();
      const beforeRotation = await pixels(canvas);
      await page.getByRole('button', { name: 'Автооблёт', exact: true }).click();
      await page.waitForTimeout(1600);
      assert.ok(difference(beforeRotation, await pixels(canvas)) > .5, 'Orbit must move the model');
      await page.getByRole('button', { name: 'Остановить облёт', exact: true }).click();
      await page.getByRole('button', { name: 'Исходный ракурс', exact: true }).click();
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .72, box.y + box.height * .52, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(600);
      assert.ok(difference(beforeRotation, await pixels(canvas)) > 1, 'Dragging must rotate the model');
      await page.screenshot({ path: `video-review/house-rotated-${width}.png` });
      const beforeZoom = await pixels(canvas);
      await page.getByRole('button', { name: 'Приблизить', exact: true }).click();
      assert.ok(difference(beforeZoom, await pixels(canvas)) > .5, 'Zoom must move the camera');
      if (width === 1440) {
        await page.getByRole('button', { name: 'На весь экран', exact: true }).click();
        await page.waitForFunction(() => !!document.fullscreenElement);
        await page.getByRole('button', { name: 'Свернуть', exact: true }).click();
        await page.waitForFunction(() => !document.fullscreenElement);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      assert.ok(await page.locator('main button').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth + 1)), 'Button labels fit');
      assert.equal(await page.getByRole('link', { name: 'Основной сайт' }).getAttribute('href'), '/');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('[data-ready="true"]').waitFor();
      assert.equal(await canvas.count(), 1, 'Remount cleans up old canvas');
      assert.deepEqual(errors, []);
      console.log(`${width}px: lighting, roof, wireframe, orbit, drag, zoom, layout, reload OK`);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 320, height: 740 }, reducedMotion: 'reduce' });
    await page.route('**/models/exterior-preview.glb', route => route.abort());
    await page.goto('http://localhost:3000/demo/house');
    await page.getByText('Не удалось загрузить модель. Попробуйте ещё раз.', { exact: true }).waitFor();
    await page.unroute('**/models/exterior-preview.glb');
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await page.locator('[data-ready="true"]').waitFor();
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'video-review/house-small-mobile.png' });
    console.log('320px: error recovery, reduced motion and canvas cleanup OK');
    await page.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
