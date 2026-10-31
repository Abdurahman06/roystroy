const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require('sharp');

const regionName = 'Карта Крыма: города и районы работы';

async function openMap(page) {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('construction-film').offsetHeight > innerHeight * 10);
  assert.equal(await page.locator('.leaflet-tile').count(), 0, 'No tiles loaded during intro');
  await page.getByRole('button', { name: 'Пропустить', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#construction-film > [aria-hidden]').style.visibility === 'hidden');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; } nextjs-portal { display: none !important; }' });
  await page.getByRole('region', { name: regionName }).evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 110, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelectorAll('[data-location-id]').length === 6);
}

async function waitZoom(page, expected) {
  await page.waitForFunction(value => Number(document.querySelector('.leaflet-container').dataset.zoom) === value, expected);
}

(async () => {
  await mkdir('video-review', { recursive: true });
  // All automated map requests are mocked; live OSM is checked in the normal browser.
  const tile = await sharp({ create: { width: 256, height: 256, channels: 3, background: '#dfe8df' } }).png().toBuffer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [width, height] of [[1440, 1000], [768, 1024], [390, 844], [320, 812]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: tile }));
      await openMap(page);
      await page.waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length > 0);
      const map = page.getByRole('region', { name: regionName });
      const initialZoom = Number(await map.getAttribute('data-zoom'));
      assert.ok(await map.getByRole('link', { name: 'OpenStreetMap', exact: true }).isVisible());
      const cities = page.getByRole('group', { name: 'Города и районы', exact: true });
      for (const [city, id, title] of [
        ['Севастополь', 'sevastopol', 'Загородные дома'],
        ['Симферополь', 'simferopol', 'Дом в с. Мирное'],
        ['Судак & Новый Свет', 'sudak', 'Дом в Солнечной долине'],
      ]) {
        await cities.getByRole('button', { name: city, exact: true }).click();
        await waitZoom(page, 11);
        assert.equal(await page.locator(`[data-location-id="${id}"]`).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#map-location-details h3').innerText(), title);
      }
      assert.match(await page.getByRole('link', { name: 'Открыть выбранный город в OpenStreetMap' }).getAttribute('href'), /44\.8509.*34\.9762/);
      await page.getByRole('button', { name: 'Показать весь Крым', exact: true }).click();
      await waitZoom(page, initialZoom);
      await page.getByRole('button', { name: 'Приблизить карту', exact: true }).click();
      await waitZoom(page, initialZoom + 1);
      await page.getByRole('button', { name: 'Отдалить карту', exact: true }).click();
      await waitZoom(page, initialZoom);
      await page.locator('[data-location-id="simferopol"]').press('Enter');
      await waitZoom(page, 11);
      assert.equal(await cities.getByRole('button', { name: 'Симферополь', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: 'Показать весь Крым', exact: true }).click();
      await waitZoom(page, initialZoom);
      await page.locator('[data-location-id="sevastopol"]').press('Space');
      await waitZoom(page, 11);
      assert.equal(await cities.getByRole('button', { name: 'Севастополь', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: 'Показать весь Крым', exact: true }).click();
      await waitZoom(page, initialZoom);
      // Re-selecting the active city must focus it again after a manual reset.
      await cities.getByRole('button', { name: 'Севастополь', exact: true }).click();
      await waitZoom(page, 11);
      await page.getByRole('button', { name: 'Показать весь Крым', exact: true }).click();
      await waitZoom(page, initialZoom);
      await map.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 110, behavior: 'instant' }));
      const bounds = await map.boundingBox();
      const previousY = await page.evaluate(() => scrollY);
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 100);
      await page.mouse.wheel(0, 150);
      await page.waitForFunction(y => scrollY > y + 50, previousY);
      assert.equal(Number(await map.getAttribute('data-zoom')), initialZoom, 'Wheel scrolls page without zooming map');
      await map.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 110, behavior: 'instant' }));
      const paneBefore = await page.locator('.leaflet-map-pane').getAttribute('style');
      const area = await map.boundingBox();
      await page.mouse.move(area.x + 80, area.y + 100);
      await page.mouse.down();
      await page.mouse.move(area.x + 130, area.y + 100, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(previous => document.querySelector('.leaflet-map-pane').getAttribute('style') !== previous, paneBefore);
      await page.getByRole('button', { name: 'Показать весь Крым', exact: true }).click();
      await page.locator('#crimea-map').screenshot({ path: `video-review/map-mocked-${width}.png` });
      const overflow = await page.locator('#crimea-map').evaluate(root => [...root.querySelectorAll('h2, h3, p, button, a, span')].filter(el => {
        if (el.closest('.leaflet-pane')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1 || el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline');
      }).map(el => el.textContent));
      assert.deepEqual(overflow, [], `No text overflow at ${width}px`);
      assert.deepEqual(errors, [], 'No runtime errors');
      console.log(`${width}px: lazy load, city selection, keyboard, zoom, reset, wheel, drag, layout OK`);
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    let fail = true;
    await page.route('https://tile.openstreetmap.org/**', route => fail ? route.abort() : route.fulfill({ contentType: 'image/png', body: tile }));
    await openMap(page);
    await page.getByText('Не удалось загрузить карту', { exact: true }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length > 0);
    assert.equal(await page.getByText('Не удалось загрузить карту', { exact: true }).count(), 0);
    await page.getByRole('group', { name: 'Города и районы' }).getByRole('button', { name: 'Симферополь', exact: true }).click();
    await waitZoom(page, 11);
    assert.equal(await page.locator('.leaflet-container.leaflet-zoom-anim').count(), 0);
    console.log('Failed network, retry and reduced motion OK');
    await page.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
