/* Ройстрой — лендинг v2. Без фреймворков; Lenis опционален. */
(() => {
  'use strict';

  const CONFIG = {
    phone: '+79787529574',
    phoneHuman: '+7 978 752-95-74',
    // URL приёма заявок (Telegram-бот / CRM). Пока пусто — заявка уходит через мессенджер или звонок.
    leadEndpoint: '',
    // Номер счётчика Яндекс Метрики
    ymId: null,
  };
  const DATA = window.RS_DATA || { build: { frames: 0, chapters: [] }, objects: [] };

  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const small = () => innerWidth < 768;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasIO = 'IntersectionObserver' in window;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };
  const onVisible = (el, cb, margin = '0px') => {
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { rootMargin: margin }).observe(el);
  };
  const once = (el, cb, margin = '300px') => {
    if (!hasIO) { cb(); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); cb(); } }, { rootMargin: margin });
    io.observe(el);
  };

  /* ───────── аналитика и UTM ───────── */
  const goal = (name, params) => { try { if (CONFIG.ymId && typeof window.ym === 'function') window.ym(CONFIG.ymId, 'reachGoal', name, params); } catch (e) {} };
  document.addEventListener('click', e => { const el = e.target.closest('[data-goal]'); if (el) goal(el.dataset.goal); });
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];
  try { const q = new URLSearchParams(location.search); UTM_KEYS.forEach(k => { const v = q.get(k); if (v) store.set(k, v.slice(0, 200)); }); } catch (e) {}
  const utm = () => UTM_KEYS.reduce((o, k) => { const v = store.get(k); if (v) o[k] = v; return o; }, {});

  /* ───────── toast / copy ───────── */
  const toastEl = $('#toast'); let toastT;
  const toast = m => { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2400); };
  const copy = async (text, ok) => { try { await navigator.clipboard.writeText(text); toast(ok); return true; } catch (e) { toast('Выделите текст и скопируйте вручную'); return false; } };

  /* ───────── плавный скролл (только мышь) ───────── */
  let lenis = null;
  const startLenis = () => {
    if (reduce || touch || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.12, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.on('scroll', onScroll);
  };
  const scrollToY = y => { if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
  const scrollToEl = el => scrollToY(el.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(root).scrollPaddingTop) || 0));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    if (a.dataset.pkg) preselect(a.dataset.pkg);
    scrollToEl(el);
  });

  /* ───────── появление блоков ───────── */
  if (hasIO && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    $$('[data-rv]').forEach(el => io.observe(el));
  } else $$('[data-rv]').forEach(el => el.classList.add('in'));

  /* ───────── HERO ───────── */
  const hero = $('.hero'), heroVid = $('#heroVid');
  const heroImg = $('.hero-bg img');
  const showHero = () => hero.classList.add('in');
  if (heroImg.complete) requestAnimationFrame(showHero); else { heroImg.addEventListener('load', showHero, { once: true }); setTimeout(showHero, 1200); }
  const armHero = () => {
    if (reduce || saveData) return;
    heroVid.src = small() ? heroVid.dataset.srcM : heroVid.dataset.srcD;
    heroVid.preload = 'auto';
    heroVid.addEventListener('canplay', () => {
      const p = heroVid.play(); if (p) p.then(() => heroVid.classList.add('on')).catch(() => {});
    }, { once: true });
    heroVid.load();
    onVisible(hero, v => { if (!heroVid.classList.contains('on')) return; v ? heroVid.play().catch(() => {}) : heroVid.pause(); });
  };

  /* ───────── шапка и мобильная панель ───────── */
  const hdr = $('#hdr'), mbar = $('#mbar'), zones = $$('[data-hdr]'), quizSec = $('#quiz');
  let lastY = scrollY, ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    let mode = 'dark';
    for (const z of zones) { const r = z.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { mode = z.dataset.hdr; break; } }
    hdr.classList.toggle('solid', mode === 'light');
    hdr.classList.toggle('dark', mode === 'dark' && y > 20);
    const dy = y - lastY;
    if (Math.abs(dy) > 6) { hdr.classList.toggle('hide', dy > 0 && y > vh * 0.8); lastY = y; }
    const qr = quizSec.getBoundingClientRect();
    mbar.classList.toggle('on', y > vh * 0.6 && !(qr.top < vh * 0.7 && qr.bottom > vh * 0.3));
    updBuild(y, vh); updVilla(y, vh); updReel(y, vh);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, { passive: true });

  /* ───────── выбор анимации «Как строим»: villa | photos (data.js → buildMode) ───────── */
  const BUILD_MODE = ['photos', 'villa', 'reel'].includes(DATA.buildMode) ? DATA.buildMode : 'villa';
  $$('[data-build]').forEach(sec => { if (sec.dataset.build === BUILD_MODE) sec.id = 'build'; else sec.remove(); });
  let updBuild = () => {}, measure = () => {}, updVilla = () => {}, measureVilla = () => {}, updReel = () => {}, measureReel = () => {};

  /* ───────── BUILD: реальные кадры по скроллу ───────── */
  const build = $('[data-build="photos"]');
  if (build) {
  const bFrames = $('#bFrames');
  const B = DATA.build, N = B.frames;
  const chapters = B.chapters;
  const bTitle = $('#bTitle'), bText = $('#bText'), bChap = $('#bChap'), bRail = $('#bRail');
  const frames = [];
  for (let i = 0; i < N; i++) {
    const d = document.createElement('div');
    d.className = 'bf';
    const fg = document.createElement('img');
    fg.alt = ''; fg.decoding = 'async'; fg.className = 'fg';
    fg.style.objectPosition = (B.focus && B.focus[i]) || '50% 50%';
    d.appendChild(fg);
    bFrames.appendChild(d);
    frames.push({ el: d, img: fg, loaded: false });
  }
  bRail.style.setProperty('--n', chapters.length);
  chapters.forEach((c, k) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="t"><i></i></span><span>${c.title}</span>`;
    li.addEventListener('click', () => scrollToY(buildTop + buildH * (c.from + 0.3) / (N - 1)));
    bRail.appendChild(li);
  });
  const railBars = $$('.t i', bRail), railItems = $$('li', bRail);
  const fitFrame = f => {
    const img = f.img; if (!img.naturalWidth) return;
    const ia = img.naturalWidth / img.naturalHeight, va = innerWidth / innerHeight;
    const contain = (ia < 0.9 && va > 1.1) || ia > 2.0 && va < 1;
    if (contain && !f.bg) { const bg = document.createElement('img'); bg.className = 'bg'; bg.alt = ''; bg.src = img.src; f.el.insertBefore(bg, img); f.bg = bg; }
    f.el.classList.toggle('contain', contain);
  };
  const loadFrames = () => {
    const suf = small() ? '-s' : '';
    frames.forEach((f, i) => {
      if (f.loaded) return; f.loaded = true;
      f.img.src = B.path(i) + suf + '.webp';
      f.img.addEventListener('load', () => fitFrame(f), { once: true });
    });
  };
  frames[0].el.style.opacity = 1;
  once(build, loadFrames, '150%');
  let buildTop = 0, buildH = 1, curChap = -1, lastA = -1;
  measure = () => { buildTop = build.getBoundingClientRect().top + scrollY; buildH = Math.max(1, build.offsetHeight - innerHeight); frames.forEach(fitFrame); };
  const smooth = t => t * t * (3 - 2 * t);
  updBuild = function (y, vh) {
    if (y + vh < buildTop - vh || y > buildTop + buildH + vh) return;
    const p = clamp((y - buildTop) / buildH);
    const f = p * (N - 1);
    const a = Math.floor(f), b = Math.min(N - 1, a + 1), t = smooth(clamp((f - a - 0.2) / 0.6));
    if (a !== lastA) { frames.forEach((fr, i) => { if (i !== a && i !== b) fr.el.style.opacity = 0; }); lastA = a; }
    frames[a].el.style.opacity = 1; frames[a].el.style.zIndex = 1;
    if (b !== a) { frames[b].el.style.opacity = t.toFixed(3); frames[b].el.style.zIndex = 2; }
    const fi = Math.round(f);
    let c = 0; chapters.forEach((ch, k) => { if (fi >= ch.from) c = k; });
    if (c !== curChap) {
      curChap = c; bTitle.textContent = chapters[c].title; bText.textContent = chapters[c].text;
      bChap.classList.remove('swap'); void bChap.offsetWidth; bChap.classList.add('swap');
      railItems.forEach((li, k) => li.classList.toggle('on', k <= c));
    }
    chapters.forEach((ch, k) => {
      const end = k + 1 < chapters.length ? chapters[k + 1].from : N - 1;
      railBars[k].style.transform = `scaleX(${clamp((f - ch.from) / Math.max(1, end - ch.from)).toFixed(3)})`;
    });
  }
  $('#bSkip').addEventListener('click', () => scrollToEl($('#projects')));
  }

  /* ───────── BUILD: анимация виллы ───────── */
  const villa = $('[data-build="villa"]');
  if (villa) {
    const layers = $$('.vb-layer', villa), vids = layers.map(l => $('video', l));
    const chaps = $$('.vb-chapter', villa), vrail = $$('#vbRail li'), groups = $$('.vb-scheme .g', villa);
    const labels = ['Проект', 'Основание', 'Монолит', 'Коробка', 'Фасад'];
    const ready = vids.map(() => false), vLoad = $('#vbLoad'), vLoadT = $('span', vLoad);
    let stage = -1, active = false, vTop = 0, vH = 1, preloading = false;
    const setLoad = f => { vLoad.style.setProperty('--p', f.toFixed(3)); vLoadT.textContent = 'Загрузка видео ' + Math.round(f * 100) + '%'; };
    const playStage = i => {
      const L = layers[i], v = vids[i];
      if (stage !== i || !ready[i] || L.dataset.want !== '1') return;
      L.dataset.want = '';
      try { v.currentTime = 0; } catch (e) {}
      const pr = v.play();
      if (pr) pr.then(() => L.classList.remove('rest')).catch(() => L.classList.add('rest')); else L.classList.remove('rest');
    };
    const attach = (i, url) => new Promise(res => {
      const v = vids[i];
      const ok = () => { if (ready[i]) return; ready[i] = true; res(); playStage(i); };
      v.addEventListener('canplaythrough', ok, { once: true });
      v.addEventListener('error', () => res(), { once: true });
      v.preload = 'auto'; v.src = url; v.load();
      setTimeout(() => { if (!ready[i] && v.readyState >= 3) ok(); else if (!ready[i]) res(); }, 4000);
    });
    // все ролики целиком загружаются в память по порядку, чтобы проигрывание не ждало сети
    const preloadStages = async () => {
      if (preloading) return; preloading = true;
      if (saveData || reduce) { vLoad.classList.add('done'); return; }
      for (let i = 0; i < vids.length; i++) {
        const src = vids[i].dataset.src;
        try {
          const r = await fetch(src);
          if (!r.ok || !r.body) throw new Error('http ' + r.status);
          const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), chunks = [];
          let got = 0;
          for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; setLoad((i + (total ? got / total : 0.5)) / vids.length); }
          await attach(i, URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' })));
        } catch (e) { await attach(i, src); }
        setLoad((i + 1) / vids.length);
      }
      vLoad.classList.add('done');
    };
    const setStage = (i, dir) => {
      if (i === stage) return;
      stage = i;
      layers.forEach((l, k) => { l.classList.toggle('on', k === i); l.dataset.want = ''; });
      vids.forEach((v, k) => { if (k !== i && !v.paused) v.pause(); });
      const L = layers[i];
      vids[i].pause();
      L.classList.add('rest');
      if (dir > 0 && !reduce && !saveData) { L.dataset.want = '1'; playStage(i); }
      chaps.forEach((c, k) => { c.classList.toggle('on', k === i); c.classList.toggle('past', k < i); });
      vrail.forEach((r, k) => r.classList.toggle('on', k <= i));
      groups.forEach((g, k) => g.classList.toggle('on', k <= i));
      $('#vbNum').textContent = String(i + 1).padStart(2, '0');
      $('#vbStage').textContent = labels[i];
    };
    measureVilla = () => { vTop = villa.getBoundingClientRect().top + scrollY; vH = Math.max(1, villa.offsetHeight - innerHeight); };
    updVilla = (y, vh) => {
      const inView = y + vh > vTop && y < vTop + vH + vh;
      if (!inView) { if (active) { active = false; vids.forEach(v => v.pause()); } return; }
      if (!active) { active = true; preloadStages(); }
      const p = clamp((y - vTop) / vH);
      if (y > vTop - vh * 0.15) { const i = Math.min(4, Math.floor(p * 5)); setStage(i, stage === -1 || i > stage ? 1 : -1); }
      vrail.forEach((r, k) => { r.firstElementChild.firstElementChild.style.transform = `scaleX(${clamp(p * 5 - k).toFixed(3)})`; });
    };
    $('#vbSkip').addEventListener('click', () => scrollToEl($('#projects')));
    vrail.forEach(r => r.addEventListener('click', () => scrollToY(vTop + vH * (Number(r.dataset.go) + 0.08) / 5)));
    document.addEventListener('visibilitychange', () => { if (document.hidden) vids.forEach(v => v.pause()); });
    // начинаем загрузку роликов заранее, пока посетитель смотрит первый экран
    addEventListener('load', () => setTimeout(preloadStages, 2500));
    once(villa, preloadStages, '120%');
  }

  /* ───────── BUILD: showreel по скроллу ─────────
     Кадры скачиваются как сжатые JPEG (Blob, ~100 КБ). В ImageBitmap точно под размер canvas
     распаковываются в фоновом потоке только кадры рядом с текущей позицией; отрисовка — простое копирование. */
  const reelSec = $('[data-build="reel"]');
  if (reelSec) {
    const RD = DATA.reel, RN = RD.frames, RCH = RD.chapters;
    const cv = $('#rbCanvas'), cx = cv.getContext('2d', { alpha: false });
    const mob = small();
    const SRC_W = mob ? 960 : 1280, SRC_H = mob ? 540 : 720;
    const rsrc = i => `assets/reel/${mob ? 'm' : 'd'}/${String(i).padStart(3, '0')}.webp`;
    const blobs = new Array(RN), bmps = new Map(), pending = new Set();
    const hasBitmap = 'createImageBitmap' in window;
    const WIN = mob ? 16 : 18;
    let target = 0, cur = 0, rTop = 0, rH = 1, loop = 0, lastKey = '', got = 0, started = false, chap = -1, dir = 1, gen = 0;
    let crop = { sx: 0, sy: 0, sw: SRC_W, sh: SRC_H };
    const rLoad = $('#rbLoad'), rLoadT = $('span', rLoad), rChap = $('#rbChap');
    const rail = $('#rbRail'); rail.style.setProperty('--n', RCH.length);
    RCH.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="t"><i></i></span><span>${c.title}</span>`;
      li.addEventListener('click', () => scrollToY(rTop + rH * (c.from + 1) / (RN - 1)));
      rail.appendChild(li);
    });
    const railI = $$('li', rail), railB = $$('.t i', rail);

    // размер canvas: не больше исходного кадра, чтобы не гонять лишние пиксели
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = cv.clientWidth * dpr, h = cv.clientHeight * dpr;
      const s0 = Math.max(w / SRC_W, h / SRC_H);
      if (s0 > 1) { w /= s0; h /= s0; }
      w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
      if (cv.width === w && cv.height === h) return false;
      cv.width = w; cv.height = h;
      const s = Math.max(w / SRC_W, h / SRC_H), sw = w / s, sh = h / s;
      crop = { sx: (SRC_W - sw) / 2, sy: (SRC_H - sh) / 2, sw, sh };
      bmps.forEach(bm => bm.close && bm.close()); bmps.clear(); pending.clear(); gen++; lastKey = '';
      return true;
    };

    // загрузка сжатых кадров: сначала опорные, потом промежуточные
    const order = []; const seen = new Uint8Array(RN);
    [16, 8, 4, 2, 1].forEach(st => { for (let i = 0; i < RN; i += st) if (!seen[i]) { seen[i] = 1; order.push(i); } });
    if (!seen[RN - 1]) order.splice(1, 0, RN - 1);
    let oq = 0, inflight = 0;
    const pump = () => {
      while (inflight < 6 && oq < order.length) {
        const i = order[oq++]; inflight++;
        fetch(rsrc(i), { priority: 'low' }).then(r => (r.ok ? r.blob() : Promise.reject())).then(bl => { blobs[i] = bl; if (Math.abs(i - target) <= WIN) ensure(); })
          .catch(() => {}).finally(() => {
            inflight--; got++;
            rLoad.style.setProperty('--p', (got / RN).toFixed(3)); rLoadT.textContent = 'Загрузка ' + Math.round(got / RN * 100) + '%';
            if (got >= RN) rLoad.classList.add('done');
            pump();
          });
      }
    };
    const startLoad = () => { if (started) return; started = true; pump(); };

    // распаковка в ImageBitmap под размер canvas — вне главного потока
    const decode = i => {
      if (!blobs[i] || bmps.has(i) || pending.has(i) || !hasBitmap) return;
      pending.add(i); const g = gen;
      createImageBitmap(blobs[i], Math.round(crop.sx), Math.round(crop.sy), Math.round(crop.sw), Math.round(crop.sh), { resizeWidth: cv.width, resizeHeight: cv.height, resizeQuality: 'high' })
        .then(bm => { pending.delete(i); if (g !== gen) { bm.close && bm.close(); return; } bmps.set(i, bm); if (Math.abs(i - cur) < 2) { lastKey = ''; kick(); } })
        .catch(() => pending.delete(i));
    };
    const ensure = () => {
      const c = Math.round(target);
      for (let d = 0; d <= WIN; d++) { decode(clamp(c + d * dir, 0, RN - 1)); if (d <= WIN / 2) decode(clamp(c - d * dir, 0, RN - 1)); }
      bmps.forEach((bm, i) => { if (Math.abs(i - c) > WIN * 1.3 && Math.abs(i - cur) > WIN) { bm.close && bm.close(); bmps.delete(i); } });
    };
    // запасной путь для браузеров без createImageBitmap
    const imgs = new Map();
    const fallbackImg = i => { if (imgs.has(i) || !blobs[i]) return; const im = new Image(); im.src = URL.createObjectURL(blobs[i]); imgs.set(i, im); if (im.decode) im.decode().then(() => { lastKey = ''; kick(); }).catch(() => {}); };
    const getFrame = i => {
      if (hasBitmap) return bmps.get(i) || null;
      fallbackImg(i); const im = imgs.get(i); return im && im.complete && im.naturalWidth ? im : null;
    };
    const nearestFrame = i => { for (let d = 0; d < RN; d++) { if (i - d >= 0) { const a = getFrame(i - d); if (a) return [a, i - d]; } if (i + d < RN) { const b = getFrame(i + d); if (b) return [b, i + d]; } } return [null, -1]; };
    const blit = (src, alpha) => {
      cx.globalAlpha = alpha;
      if (src.width === cv.width && src.height === cv.height) cx.drawImage(src, 0, 0);
      else { const kx = src.width / SRC_W, ky = src.height / SRC_H; cx.drawImage(src, crop.sx * kx, crop.sy * ky, crop.sw * kx, crop.sh * ky, 0, 0, cv.width, cv.height); }
    };
    const draw = () => {
      // всегда один чёткий кадр: без наложения соседних кадров (оно давало «призраки» при облёте камеры)
      const a = Math.round(cur);
      const fa = getFrame(a);
      let key;
      if (fa) {
        key = 'f' + a;
        if (key === lastKey) return; lastKey = key;
        blit(fa, 1);
      } else {
        const [f, k] = nearestFrame(Math.round(cur)); if (!f) return;
        key = 'n' + k; if (key === lastKey) return; lastKey = key; blit(f, 1);
      }
      cx.globalAlpha = 1;
    };
    const tick = () => {
      const d = target - cur;
      cur = Math.abs(d) < 0.05 ? target : cur + d * (reduce ? 1 : (lenis ? 0.35 : 0.25));
      draw();
      loop = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    function kick() { if (!loop) loop = requestAnimationFrame(tick); }
    const setChap = f => {
      let c = 0; RCH.forEach((ch, k) => { if (f >= ch.from) c = k; });
      if (c !== chap) {
        chap = c; $('#rbN').textContent = String(c + 1).padStart(2, '0'); $('#rbTitle').textContent = RCH[c].title; $('#rbText').textContent = RCH[c].text;
        rChap.classList.remove('swap'); void rChap.offsetWidth; rChap.classList.add('swap');
        railI.forEach((li, k) => li.classList.toggle('on', k <= c));
      }
      RCH.forEach((ch, k) => { const end = k + 1 < RCH.length ? RCH[k + 1].from : RN - 1; railB[k].style.transform = `scaleX(${clamp((f - ch.from) / Math.max(1, end - ch.from)).toFixed(3)})`; });
    };
    let inReel = false;
    measureReel = () => { rTop = reelSec.getBoundingClientRect().top + scrollY; rH = Math.max(1, reelSec.offsetHeight - innerHeight); size(); ensure(); lastKey = ''; kick(); };
    updReel = (y, vh) => {
      const near = y + vh * 2.2 > rTop && y < rTop + rH + vh;
      const vis = y + vh > rTop && y < rTop + rH + vh;
      if (vis !== inReel) { inReel = vis; root.classList.toggle('in-reel', vis); }
      if (!near) return;
      startLoad();
      const nt = clamp((y - rTop) / rH) * (RN - 1);
      if (nt !== target) dir = nt > target ? 1 : -1;
      target = nt;
      setChap(target); ensure(); kick();
    };
    $('#rbSkip').addEventListener('click', () => scrollToEl($('#projects')));
    fetch(rsrc(0)).then(r => r.blob()).then(bl => { blobs[0] = bl; size(); decode(0); }).catch(() => {});
    addEventListener('load', () => setTimeout(startLoad, 1500));
  }

  /* ───────── ролики Instagram ───────── */
  $$('.reel video').forEach(v => once(v, () => {
    if (reduce || saveData) return;
    v.src = v.dataset.src; v.preload = 'auto';
    v.addEventListener('canplay', () => onVisible(v, vis => { if (vis) v.play().then(() => v.classList.add('on')).catch(() => {}); else v.pause(); }), { once: true });
    v.load();
  }, '200px'));

  /* ───────── PROJECTS ───────── */
  const ptabs = $$('.ptabs [role="tab"]');
  const selectP = tab => {
    ptabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
    goal('project_tab', { p: tab.textContent.trim() });
  };
  ptabs.forEach((t, i) => {
    t.addEventListener('click', () => selectP(t));
    t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = ptabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + ptabs.length) % ptabs.length]; n.focus(); selectP(n); } });
  });
  $$('.pp').forEach(pp => {
    const main = $('.pp-main', pp), mainImg = main && $('img', main);
    $$('.pp-thumbs button', pp).forEach(b => b.addEventListener('click', () => {
      $$('.pp-thumbs button', pp).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      mainImg.style.opacity = '0';
      const im = new Image();
      im.onload = () => { mainImg.src = b.dataset.src; mainImg.alt = $('img', b).alt; main.classList.toggle('contain', b.dataset.fit === 'contain'); mainImg.style.opacity = '1'; };
      im.src = b.dataset.src;
    }));
  });
  // слои бункера
  const bStage = $('#bunkerStage');
  $$('.layer-sw button').forEach(b => b.addEventListener('click', () => {
    $$('.layer-sw button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('img', bStage).forEach((im, k) => im.classList.toggle('on', k === +b.dataset.l));
  }));
  // планировка 94,5
  const planBox = $('#plan945');
  $('[data-open-plan]').addEventListener('click', e => {
    planBox.hidden = !planBox.hidden;
    e.currentTarget.textContent = planBox.hidden ? 'Планировка' : 'Скрыть планировку';
    if (!planBox.hidden) { planBox.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); goal('plan_open'); }
  });
  const ftabs = $$('.plan-tabs [role="tab"]'), rName = $('#rName'), rArea = $('#rArea'), rList = $('#rList');
  const showRoom = (panel, idx) => {
    const rooms = $$('.room', panel);
    rooms.forEach((r, i) => r.classList.toggle('on', i === idx));
    $$('li', rList).forEach((li, i) => li.classList.toggle('on', i === idx));
    const [n, a] = rooms[idx].dataset.r.split('|'); rName.textContent = n; rArea.textContent = a;
  };
  const selectF = tab => {
    ftabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
    const panel = $('#' + tab.getAttribute('aria-controls')), rooms = $$('.room', panel);
    rList.innerHTML = '';
    rooms.forEach((r, i) => {
      const [n, a] = r.dataset.r.split('|');
      const li = document.createElement('li'); li.tabIndex = 0;
      li.innerHTML = `<span>${n}</span><span>${a}</span>`;
      li.addEventListener('click', () => showRoom(panel, i));
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRoom(panel, i); } });
      rList.appendChild(li);
      if (!r.dataset.bound) { r.dataset.bound = 1; r.addEventListener('click', () => showRoom(panel, i)); r.addEventListener('mouseenter', () => showRoom(panel, i)); }
    });
    const area = r => parseFloat(r.dataset.r.split('|')[1].replace(',', '.'));
    showRoom(panel, rooms.reduce((m, r, i) => area(r) > area(rooms[m]) ? i : m, 0));
  };
  ftabs.forEach(t => t.addEventListener('click', () => selectF(t)));
  if (ftabs.length) selectF(ftabs[0]);

  /* ───────── НАШИ ОБЪЕКТЫ ───────── */
  const obTiles = $('#obTiles'), obView = $('#obView'), obStage = $('#obStage'), obImgs = $('#obImgs'), obBars = $('#obBars');
  const obPrev = $('#obPrev'), obNext = $('#obNext'), obCount = $('#obCount'), obSteps = $('#obSteps'), obPlay = $('#obPlay'), obPlayT = $('#obPlayT');
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MON_S = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const dParts = s => s.split('-').map(Number);
  const fmt = s => { const [y, m, d] = dParts(s); return `${d} ${MONTHS[m - 1]} ${y}`; };
  const fmtS = s => { const [y, m, d] = dParts(s); return `${d} ${MON_S[m - 1]} ${String(y).slice(2)}`; };
  const fmtM = s => { const [y, m] = dParts(s); return `${MONTHS_N[m - 1]} ${y}`; };
  const period = o => { return o.items.length + ' этапов'; const a = o.items[0][0], z = o.items[o.items.length - 1][0]; return a.slice(0, 7) === z.slice(0, 7) ? fmtM(a) : `${fmtM(a)} — ${fmtM(z)}`; };
  const imgPath = (o, i, suf) => `assets/${o.dir || 'obj'}/${o.id}-${i}${suf}.webp`;
  let ob = null, oi = 0, obT = null, bgb = null;
  const PLAY_MS = 1800;
  DATA.objects.forEach((o, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ob-tile'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
    const cover = o.video ? o.poster : imgPath(o, o.cover != null ? o.cover : o.items.length - 1, '-s');
    b.innerHTML = `<img src="${cover}" alt="" loading="lazy"><span class="bd">${o.video ? 'Видео' : o.items.length + ' фото'}</span><span class="tx"><b>${o.title}</b><small>${o.video ? o.kind : o.place}</small></span>`;
    b.addEventListener('click', () => { selectOb(k); goal('object_select', { o: o.title }); });
    obTiles.appendChild(b);
  });
  const stopOb = () => { clearTimeout(obT); obT = null; obView.classList.remove('playing'); obPlayT.textContent = 'Смотреть как таймлапс'; $('#obPlayI').setAttribute('href', '#i-play'); };
  const fitOb = im => { if (!im.naturalWidth) return; const ia = im.naturalWidth / im.naturalHeight, sa = obStage.clientWidth / obStage.clientHeight; im.classList.toggle('fit', Math.abs(Math.log(ia / sa)) > 0.38); };
  const showOb = i => {
    if (!ob || ob.video) return;
    const n = ob.items.length;
    oi = clamp(i, 0, n - 1);
    const imgs = $$('img.fg', obImgs);
    imgs.forEach((im, k) => { if (Math.abs(k - oi) <= 1 && !im.getAttribute('src')) im.src = im.dataset.src; im.classList.toggle('on', k === oi); });
    const cim = imgs[oi];
    const setBg = () => { if (bgb && imgs[oi] === cim) bgb.src = cim.currentSrc || cim.src; };
    cim.complete && cim.naturalWidth ? setBg() : cim.addEventListener('load', setBg, { once: true });
    $$('i', obBars).forEach((bar, k) => { bar.classList.toggle('done', k < oi); bar.classList.toggle('cur', k === oi); });
    if (obView.classList.contains('playing')) { const cur = $$('i', obBars)[oi]; cur.classList.remove('cur'); void cur.offsetWidth; cur.classList.add('cur'); }
    obCount.textContent = `${oi + 1} / ${n}`;
    obPrev.disabled = oi === 0; obNext.disabled = oi === n - 1;
    const it = ob.items[oi];
    $('#obDate').textContent = `Этап ${oi + 1} из ${n}`; $('#obStep').textContent = it[1];
    $$('li', obSteps).forEach((li, k) => { li.classList.toggle('past', k < oi); li.classList.toggle('cur', k === oi); });
    const curLi = $$('li', obSteps)[oi];
    if (curLi) { const box = obSteps, r = curLi.offsetLeft - box.offsetLeft, t = curLi.offsetTop - box.offsetTop;
      if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: r - 20, behavior: 'smooth' }); else box.scrollTo({ top: t - box.clientHeight / 2 + 20, behavior: 'smooth' }); }
  };
  function selectOb(k) {
    stopOb();
    ob = DATA.objects[k];
    $$('.ob-tile', obTiles).forEach((b, j) => b.setAttribute('aria-selected', String(j === k)));
    const tile = $$('.ob-tile', obTiles)[k];
    if (obTiles.scrollWidth > obTiles.clientWidth) obTiles.scrollTo({ left: tile.offsetLeft - obTiles.offsetLeft - 20, behavior: 'smooth' });
    $('#obKind').textContent = ob.kind; $('#obTitle').textContent = ob.title;
    obImgs.innerHTML = ''; obBars.innerHTML = ''; obSteps.innerHTML = '';
    bgb = document.createElement('img'); bgb.className = 'bgb'; bgb.alt = ''; obImgs.appendChild(bgb);
    const desc = $('#obDesc');
    obView.classList.toggle('video', !!ob.video);
    if (ob.video) {
      $('#obPlace').textContent = ob.place;
      $('#obDate').textContent = 'Таймлапс с IP-камеры'; $('#obStep').textContent = 'От плиты до каркаса третьего этажа';
      desc.hidden = false; desc.textContent = 'Запись с камеры, установленной на стройке: монолитный каркас растёт этаж за этажом.';
      bgb.src = ob.poster;
      const v = document.createElement('video');
      v.src = ob.video; v.poster = ob.poster; v.controls = true; v.playsInline = true; v.muted = true; v.loop = true; v.preload = 'metadata'; v.setAttribute('playsinline', '');
      obImgs.appendChild(v); v.play().catch(() => {});
      return;
    }
    desc.hidden = true;
    $('#obPlace').textContent = `${ob.place} · ${period(ob)}`;
    const suf = small() ? '-s' : '';
    ob.items.forEach((it, i) => {
      const im = document.createElement('img');
      im.className = 'fg'; im.decoding = 'async'; im.alt = `${ob.title}: ${it[1]}`;
      im.dataset.src = imgPath(ob, i, suf);
      im.addEventListener('load', () => fitOb(im));
      obImgs.appendChild(im);
      obBars.insertAdjacentHTML('beforeend', '<i><b></b></i>');
      const li = document.createElement('li');
      li.innerHTML = `<button type="button"><span>${it[1]}</span><small>${String(i + 1).padStart(2, '0')}</small></button>`;
      li.firstChild.addEventListener('click', () => { stopOb(); showOb(i); });
      obSteps.appendChild(li);
    });
    obBars.style.setProperty('--dur', PLAY_MS + 'ms');
    showOb(0);
    setTimeout(() => $$('img.fg', obImgs).forEach(im => { if (!im.getAttribute('src')) im.src = im.dataset.src; }), 700);
  }
  const tick = () => { if (!ob || oi >= ob.items.length - 1) { stopOb(); return; } showOb(oi + 1); obT = setTimeout(tick, PLAY_MS); };
  obPlay.addEventListener('click', () => {
    if (obT) { stopOb(); return; }
    if (!ob || ob.video) return;
    obView.classList.add('playing'); obPlayT.textContent = 'Пауза'; $('#obPlayI').setAttribute('href', '#i-pause');
    showOb(oi >= ob.items.length - 1 ? 0 : oi);
    obT = setTimeout(tick, PLAY_MS);
    goal('objects_play');
  });
  obPrev.addEventListener('click', () => { stopOb(); showOb(oi - 1); });
  obNext.addEventListener('click', () => { stopOb(); showOb(oi + 1); });
  obStage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); stopOb(); showOb(oi + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); stopOb(); showOb(oi - 1); } });
  let osx = null;
  obStage.addEventListener('pointerdown', e => { if (!ob || ob.video || e.target.closest('button')) return; osx = e.clientX; });
  obStage.addEventListener('pointerup', e => {
    if (osx === null) return;
    const d = e.clientX - osx; osx = null;
    if (Math.abs(d) > 40) { stopOb(); showOb(oi + (d < 0 ? 1 : -1)); }
    else if (e.pointerType !== 'mouse') { stopOb(); showOb(oi + (e.clientX > obStage.getBoundingClientRect().left + obStage.clientWidth / 2 ? 1 : -1)); }
  });
  once(obView, () => selectOb(0), '400px');

  /* ───────── ОФИС: слайдшоу ───────── */
  const ofStage = $('#ofStage'), ofImgs = $$('#ofImgs img'), ofBars = $('#ofBars');
  const DUR = 5000; let ofI = 0, ofT = null, ofVisible = false, ofHover = false;
  ofBars.style.setProperty('--n', ofImgs.length);
  ofImgs.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Фото ${i + 1}`); b.innerHTML = '<i><b></b></i>'; b.addEventListener('click', () => ofGo(i, true)); ofBars.appendChild(b); });
  const bars = $$('button', ofBars);
  const ofSrc = im => (innerWidth > 900 ? im.dataset.full : (im.dataset.src || im.getAttribute('src')));
  const ofLoad = i => { const im = ofImgs[(i + ofImgs.length) % ofImgs.length]; const s = ofSrc(im); if (s && im.getAttribute('src') !== s && !im.dataset.loaded) { im.dataset.loaded = 1; im.src = s; } };
  function ofGo(i, user) {
    ofI = (i + ofImgs.length) % ofImgs.length;
    ofLoad(ofI); ofLoad(ofI + 1);
    ofImgs.forEach((im, k) => { im.classList.remove('on'); if (k === ofI) { void im.offsetWidth; im.classList.add('on'); } });
    bars.forEach((b, k) => { b.classList.toggle('done', k < ofI); b.classList.remove('cur'); });
    void bars[ofI].offsetWidth; bars[ofI].classList.add('cur');
    bars[ofI].style.setProperty('--dur', DUR + 'ms');
    clearTimeout(ofT);
    if (!reduce && ofVisible && !ofHover) ofT = setTimeout(() => ofGo(ofI + 1), DUR);
    if (user) goal('office_photo');
  }
  $('#ofPrev').addEventListener('click', () => ofGo(ofI - 1, true));
  $('#ofNext').addEventListener('click', () => ofGo(ofI + 1, true));
  ofStage.addEventListener('mouseenter', () => { ofHover = true; ofStage.classList.add('paused'); clearTimeout(ofT); });
  ofStage.addEventListener('mouseleave', () => { ofHover = false; ofStage.classList.remove('paused'); ofGo(ofI); });
  let ofSx = null;
  ofStage.addEventListener('touchstart', e => { ofSx = e.touches[0].clientX; }, { passive: true });
  ofStage.addEventListener('touchend', e => { if (ofSx === null) return; const d = e.changedTouches[0].clientX - ofSx; if (Math.abs(d) > 40) ofGo(ofI + (d < 0 ? 1 : -1), true); ofSx = null; });
  onVisible(ofStage, v => { ofVisible = v; if (v) ofGo(ofI); else { clearTimeout(ofT); } }, '0px');

  const emil = $('#emil');
  emil.addEventListener('click', () => {
    if (emil.classList.contains('playing')) return;
    const v = document.createElement('video');
    v.src = 'assets/office/emil-office.mp4'; v.controls = true; v.playsInline = true; v.autoplay = true; v.setAttribute('playsinline', '');
    emil.appendChild(v); emil.classList.add('playing'); v.play().catch(() => {});
    // после просмотра: возвращаем заставку
    v.addEventListener('ended', () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setTimeout(() => { v.remove(); emil.classList.remove('playing'); }, 600); });
    goal('emil_video');
  });

  /* ───────── телефон LIVE ───────── */
  const pv = $('#phoneVid');
  once(pv.parentElement, () => {
    if (reduce || saveData) return;
    pv.src = pv.dataset.src; pv.preload = 'auto';
    pv.addEventListener('canplay', () => onVisible(pv, v => { if (v) pv.play().then(() => pv.classList.add('on')).catch(() => {}); else pv.pause(); }), { once: true });
    pv.load();
  }, '200px');

  /* ───────── Mriya: ролик только на экране ───────── */
  const mv = $('#mriyaVid');
  once(mv.parentElement, () => {
    if (reduce || saveData) return;
    mv.src = mv.dataset.src; mv.preload = 'auto';
    mv.addEventListener('canplay', () => onVisible(mv, v => { if (v) mv.play().then(() => mv.classList.add('on')).catch(() => {}); else mv.pause(); }), { once: true });
    mv.load();
  }, '200px');

  /* ───────── ВИДЕООТЗЫВЫ: сторис ───────── */
  const stItems = $$('.st-item');
  if (stItems.length) {
    const stv = $('#stv'), vid = $('#stvVid'), bars = $('#stvBars');
    const N = stItems.length; let cur = 0, raf = 0, muted = false, lastFocus = null;
    bars.innerHTML = '<i><b></b></i>'.repeat(N);
    const barEls = $$('i', bars);
    const tick = () => {
      if (vid.duration) barEls[cur].firstChild.style.transform = `scaleX(${(vid.currentTime / vid.duration).toFixed(4)})`;
      raf = requestAnimationFrame(tick);
    };
    const show = i => {
      if (i < 0) i = 0;
      if (i >= N) { closeSt(); return; }
      cur = i;
      const it = stItems[i];
      barEls.forEach((b, k) => { b.classList.toggle('done', k < i); b.firstChild.style.transform = k < i ? 'scaleX(1)' : 'scaleX(0)'; });
      $('#stvT').textContent = $('.st-t', it).textContent; $('#stvK').textContent = $('.st-k', it).textContent;
      $('#stvAv').src = `assets/stories/s${i}-av.webp?v=2`;
      $('#stvBg').style.backgroundImage = `url(assets/stories/s${i}.webp?v=2)`;
      vid.poster = `assets/stories/s${i}.webp?v=2`; vid.src = `assets/stories/s${i}.mp4?v=2`; vid.muted = muted;
      vid.play().catch(() => { vid.muted = true; muted = true; updMute(); vid.play().catch(() => {}); });
      it.classList.add('seen');
      if (i + 1 < N) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = `assets/stories/s${i + 1}.mp4?v=2`; document.head.appendChild(l); }
      goal('story_view', { i });
    };
    const updMute = () => { $('#stvMute').setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук'); $('#stvMute').style.opacity = muted ? .55 : 1; };
    const openSt = i => {
      lastFocus = document.activeElement; stv.hidden = false; document.documentElement.style.overflow = 'hidden'; lenis && lenis.stop();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); show(i); $('#stvClose').focus();
    };
    function closeSt() {
      vid.pause(); vid.removeAttribute('src'); vid.load(); cancelAnimationFrame(raf);
      stv.hidden = true; document.documentElement.style.overflow = ''; lenis && lenis.start(); lastFocus && lastFocus.focus();
    }
    stItems.forEach(b => b.addEventListener('click', () => openSt(+b.dataset.i)));
    vid.addEventListener('ended', () => show(cur + 1));
    $('#stvNext').addEventListener('click', () => show(cur + 1)); $('#stvPrev').addEventListener('click', () => show(cur - 1));
    $('#stvR').addEventListener('click', () => show(cur + 1)); $('#stvL').addEventListener('click', () => show(cur - 1));
    $('#stvClose').addEventListener('click', closeSt);
    $('#stvMute').addEventListener('click', () => { muted = !muted; vid.muted = muted; updMute(); });
    $('#stvCta').addEventListener('click', () => closeSt());
    stv.addEventListener('click', e => { if (e.target === stv || e.target.id === 'stvBg') closeSt(); });
    addEventListener('keydown', e => {
      if (stv.hidden) return;
      if (e.key === 'Escape') closeSt(); if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === ' ') { e.preventDefault(); vid.paused ? vid.play() : vid.pause(); }
    });
    let ty = null;
    stv.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
    stv.addEventListener('touchend', e => { if (ty !== null && e.changedTouches[0].clientY - ty > 90) closeSt(); ty = null; });
  }

  /* ───────── отзывы ───────── */
  const rv = $('#rvTrack');
  const rvStep = () => ($('.rev', rv).offsetWidth + 14);
  $('#rvPrev').addEventListener('click', () => rv.scrollBy({ left: -rvStep(), behavior: 'smooth' }));
  $('#rvNext').addEventListener('click', () => rv.scrollBy({ left: rvStep(), behavior: 'smooth' }));
  if (!touch) {
    let dx = null, sl = 0;
    rv.addEventListener('pointerdown', e => { dx = e.clientX; sl = rv.scrollLeft; rv.classList.add('drag'); });
    addEventListener('pointermove', e => { if (dx !== null) rv.scrollLeft = sl - (e.clientX - dx); });
    addEventListener('pointerup', () => { if (dx !== null) { dx = null; rv.classList.remove('drag'); } });
  }

  /* ───────── MAX ───────── */
  const sheet = $('#maxSheet'); let lastFocus = null;
  const openMax = () => { lastFocus = document.activeElement; sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('on')); lenis && lenis.stop(); $('#maxCopy').focus(); };
  const closeMax = () => { sheet.classList.remove('on'); setTimeout(() => { sheet.hidden = true; }, 300); lenis && lenis.start(); lastFocus && lastFocus.focus(); };
  document.addEventListener('click', e => { if (e.target.closest('[data-max]')) openMax(); });
  $('#maxClose').addEventListener('click', closeMax);
  sheet.addEventListener('click', e => { if (e.target === sheet) closeMax(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeMax(); });
  $('#maxCopy').addEventListener('click', () => copy(CONFIG.phone, 'Номер скопирован'));

  /* ───────── РАСЧЁТ: конфигуратор + заявка ───────── */
  const form = $('#quizForm');
  const C = DATA.calc;
  const qSteps = $$('.q-step', form), total = qSteps.length;
  const qBack = $('#qBack'), qNext = $('#qNext'), qNextT = $('#qNextT'), qErr = $('#qErr'), phoneIn = $('#qPhone');
  const areaIn = $('#cArea'), areaOut = $('#cAreaOut'), priceEl = $('#cPrice'), houseEl = $('#cHouse');
  let qi = 0, started = false, calcSummary = '', calcWhat = '', intent = '', areaExact = null;
  const fd = () => new FormData(form);
  const setR = (name, v) => { const r = $$(`input[name="${name}"]`, form).find(i => i.value === v); if (r) r.checked = true; };
  const setC = (name, on) => { const c = $(`input[name="${name}"]`, form); if (c) c.checked = on; };

  const INC = {
    box: ['Фундамент и монолитный сейсмокаркас', 'Кладка наружных и внутренних стен', 'Кровля', 'Остекление'],
    turnkey: ['Всё, что входит в коробку', 'Внутренняя отделка', 'Отделка фасада', 'Кровля и окна'],
    bunker: ['Монолитный железобетонный корпус', 'Гидроизоляция', 'Вентиляция и вход', 'Размер и оснащение — под вашу задачу'],
    commercial: ['Магазины, офисы, гостиницы', 'Монолитный каркас', 'Опыт: участвовали в строительстве Mriya Resort', 'Смету готовим по проекту'],
  };
  const LBL = {
    c_pkg: { box: 'Коробка', turnkey: 'Под ключ', bunker: 'Бетонный бункер', commercial: 'Коммерческий объект' },
    c_proj: { p94: 'проект 94,5 м²', p191: 'проект 191 м²', p176: 'проект 176 м²' },
    c_floors: { 1: '1 этаж', 2: '2 этажа', 3: '3 этажа' },
    c_site: { flat: 'ровный участок', slope: 'уклон', steep: 'склон' },
    c_roof: { pitched: 'скатная кровля', flat: 'плоская кровля', terrace: 'эксплуатируемая кровля' },
    c_glass: { std: 'обычные окна', pano: 'панорамные окна' }, c_finish: { std: 'отделка «стандарт»', comfort: 'отделка «комфорт»', premium: 'отделка «премиум»' },
  };
  // готовые проекты компании → параметры конфигуратора
  const PROJ = {
    p94: { area: 94.5, floors: '2', roof: 'pitched', glass: 'std', base: false, terrace: false },
    p191: { area: 191.1, floors: '2', roof: 'flat', glass: 'pano', base: false, terrace: true },
    p176: { area: 176, floors: '1', roof: 'flat', glass: 'pano', base: false, terrace: true },
  };
  const mln = v => (v / 1e6).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const round = v => Math.round(v / 100000) * 100000;
  const fmtArea = v => v.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' м²';

  /* схема дома: перерисовывается от параметров */
  const houseSVG = p => {
    const VW = 360, GY = 168, o = [];
    const gy = x => p.site === 'flat' ? GY : p.site === 'slope' ? GY - 8 + (x / VW) * 16 : GY - 20 + (x / VW) * 40;
    if (p.kind === 'bunker') {
      o.push(`<path class="h-gr" d="M0 ${GY - 40}H360"/><path class="h-soil" d="M0 ${GY - 40}H360V200H0Z"/>`);
      o.push(`<rect class="h-w thick" x="110" y="${GY - 18}" width="170" height="44" rx="3"/><rect class="h-g" x="124" y="${GY - 8}" width="40" height="22"/><path class="h-l" d="M176 ${GY - 4}h90M176 ${GY + 6}h90M176 ${GY + 16}h60"/>`);
      o.push(`<path class="h-w" d="M96 ${GY - 40}v-12h26v12"/><path class="h-l" d="M109 ${GY - 40}V${GY - 18}"/>`);
      return o.join('');
    }
    if (p.kind === 'commercial') {
      o.push(`<path class="h-gr" d="M8 ${GY}H352"/>`);
      const x0 = 70, w = 220, fh = 30, fl = 4;
      o.push(`<rect class="h-w" x="${x0}" y="${GY - fl * fh}" width="${w}" height="${fl * fh}"/><path class="h-w" d="M${x0 - 4} ${GY - fl * fh}h${w + 8}v-6h-${w + 8}z"/>`);
      for (let f = 0; f < fl; f++) for (let k = 0; k < 6; k++) if (f || k < 2 || k > 3) o.push(`<rect class="h-g" x="${x0 + 10 + k * 35}" y="${GY - (f + 1) * fh + 6}" width="${f ? 28 : 30}" height="${fh - 12}"/>`);
      o.push(`<rect class="h-g" x="${x0 + w / 2 - 34}" y="${GY - 26}" width="68" height="26"/><path class="h-l" d="M${x0 + w / 2} ${GY - 26}V${GY}"/>`);
      return o.join('');
    }
    const W = Math.round(124 + clamp((p.area - 60) / 340) * 106), floors = +p.floors;
    const gw = p.garage ? 58 : 0, tw = p.terrace ? 44 : 0, tot = W + gw + tw;
    const xt = (VW - tot) / 2, hx = xt + tw, hx1 = hx + W, gx = hx1;
    const yb = Math.min(gy(hx), gy(hx1)) - (p.base ? 22 : 2);
    const roofH = p.roof === 'pitched' ? Math.min(48, W * .3) : p.roof === 'terrace' ? 38 : 8;
    const fh = Math.min(34, (yb - 10 - roofH) / floors);
    // земля
    o.push(`<path class="h-soil" d="M0 ${gy(0)}L360 ${gy(360)}V200H0Z"/><path class="h-gr" d="M0 ${gy(0)}L360 ${gy(360)}"/>`);
    if (xt > 46) { const tx = xt - 26; o.push(`<path class="h-l" d="M${tx} ${gy(tx)}V${gy(tx) - 26}"/><circle class="h-tree" cx="${tx}" cy="${gy(tx) - 40}" r="17"/>`); }
    // фундамент / цоколь
    o.push(`<path class="h-w${p.base ? ' base' : ''}" d="M${hx} ${yb}H${hx1}V${gy(hx1) + 2}L${hx} ${gy(hx) + 2}Z"/>`);
    if (p.base) for (let k = 0; k < Math.floor(W / 46); k++) o.push(`<rect class="h-g" x="${hx + 14 + k * 46}" y="${yb + 5}" width="22" height="9"/>`);
    // этажи
    const yt = yb - floors * fh;
    o.push(`<rect class="h-w" x="${hx}" y="${yt}" width="${W}" height="${floors * fh}"/>`);
    for (let f = 1; f < floors; f++) o.push(`<path class="h-l" d="M${hx} ${yb - f * fh}H${hx1}"/>`);
    for (let f = 0; f < floors; f++) {
      const y = yb - (f + 1) * fh;
      if (p.glass === 'pano') {
        const ww = (W - 30) / 2;
        o.push(`<rect class="h-g" x="${hx + 10}" y="${y + 5}" width="${ww}" height="${fh - 7}"/><rect class="h-g" x="${hx + 20 + ww}" y="${y + 5}" width="${ww}" height="${fh - 7}"/>`);
      } else {
        const n = Math.max(2, Math.floor(W / 40));
        for (let k = 0; k < n; k++) {
          const cx = hx + (W / n) * (k + .5);
          if (f === 0 && k === 0) { o.push(`<rect class="h-w door" x="${cx - 7}" y="${yb - 22}" width="14" height="22"/>`); continue; }
          o.push(`<rect class="h-g" x="${cx - 8}" y="${y + 8}" width="16" height="14"/>`);
        }
      }
    }
    // кровля
    if (p.roof === 'pitched') { const rh = Math.min(48, W * .3); o.push(`<path class="h-w roof" d="M${hx - 10} ${yt}L${(hx + hx1) / 2} ${yt - rh}L${hx1 + 10} ${yt}Z"/>`); }
    else {
      o.push(`<rect class="h-w roof" x="${hx - 4}" y="${yt - 5}" width="${W + 8}" height="5"/>`);
      if (p.roof === 'terrace') {
        o.push(`<path class="h-l" d="M${hx} ${yt - 18}H${hx1}"/>`);
        for (let x = hx; x <= hx1; x += 12) o.push(`<path class="h-l" d="M${x} ${yt - 5}V${yt - 18}"/>`);
        o.push(`<path class="h-l" d="M${hx1 - 40} ${yt - 5}v-30M${hx1 - 58} ${yt - 32}q18 -10 36 0z"/>`);
      }
    }
    // гараж
    if (p.garage) {
      const gb = Math.min(gy(gx), gy(gx + gw)) - 2;
      o.push(`<path class="h-w" d="M${gx} ${gb}V${gb - 36}H${gx + gw}V${gy(gx + gw) + 2}L${gx} ${gy(gx) + 2}Z"/><rect class="h-w roof" x="${gx}" y="${gb - 40}" width="${gw + 4}" height="4"/>`);
      o.push(`<rect class="h-w door" x="${gx + 9}" y="${gb - 26}" width="${gw - 18}" height="26"/><path class="h-l" d="M${gx + 9} ${gb - 19}h${gw - 18}M${gx + 9} ${gb - 12}h${gw - 18}M${gx + 9} ${gb - 5}h${gw - 18}"/>`);
    }
    // терраса с перголой
    if (p.terrace) {
      const ty = yb - fh + 2;
      o.push(`<rect class="h-w deck" x="${xt}" y="${yb - 5}" width="${tw}" height="5"/>`);
      o.push(`<path class="h-l" d="M${xt + 4} ${yb}L${xt + 4} ${gy(xt + 4)}M${xt + 4} ${yb - 5}V${ty}M${xt + tw / 2} ${yb - 5}V${ty}M${xt - 4} ${ty}H${hx}"/>`);
      for (let x = xt; x < hx; x += 6) o.push(`<path class="h-l" d="M${x} ${ty - 3}V${ty + 3}"/>`);
    }
    return o.join('');
  };

  // анимация цифр
  let shown = [0, 0], tw0 = 0;
  const tweenPrice = (lo, hi, fmt) => {
    const from = shown.slice(), t0 = performance.now(); cancelAnimationFrame(tw0);
    const step = t => {
      const k = reduce ? 1 : clamp((t - t0) / 380), e = 1 - Math.pow(1 - k, 3);
      shown = [from[0] + (lo - from[0]) * e, from[1] + (hi - from[1]) * e];
      priceEl.textContent = fmt(round(shown[0]), round(shown[1]));
      if (k < 1) tw0 = requestAnimationFrame(step);
    };
    tw0 = requestAnimationFrame(step);
  };

  const compute = () => {
    const f = fd(), g = k => f.get(k);
    const pkg = g('c_pkg'), proj = g('c_proj');
    const house = pkg === 'box' || pkg === 'turnkey';
    form.classList.toggle('no-house', !house);
    $('#cFinishBox').classList.toggle('off', pkg !== 'turnkey');
    const area = areaExact != null ? areaExact : +areaIn.value;
    areaOut.textContent = fmtArea(area);
    areaIn.style.setProperty('--p', ((areaIn.value - areaIn.min) / (areaIn.max - areaIn.min) * 100).toFixed(1) + '%');
    $('#cInc').innerHTML = INC[pkg].map(t => `<li>${t}</li>`).join('');
    if (houseEl) houseEl.innerHTML = `<svg viewBox="0 0 360 200">${houseSVG({ kind: pkg, area, floors: g('c_floors'), site: g('c_site'), roof: g('c_roof'), glass: g('c_glass'), base: !!g('c_base'), garage: !!g('c_garage'), terrace: !!g('c_terrace') })}</svg>`;
    let mini;
    if (!house) {
      cancelAnimationFrame(tw0); shown = [0, 0];
      if (pkg === 'bunker') { priceEl.textContent = '1,8 – 20 млн ₽'; $('#cM2').textContent = 'зависит от размера и оснащения'; mini = '1,8–20 млн ₽'; }
      else { priceEl.textContent = 'Индивидуально'; $('#cM2').textContent = 'смету готовим по проекту объекта'; mini = 'по проекту'; }
      $('#cKind').textContent = LBL.c_pkg[pkg];
      calcWhat = LBL.c_pkg[pkg]; calcSummary = '';
    } else {
      let k = (C.floors[g('c_floors')] || 1) * (C.site[g('c_site')] || 1) * (C.roof[g('c_roof')] || 1) * (C.glass[g('c_glass')] || 1);
      if (pkg === 'turnkey') k *= 1 - C.finishShare + C.finishShare * (C.finish[g('c_finish')] || 1);
      let add = 1;
      if (g('c_base')) add += C.base; if (g('c_garage')) add += C.garage; if (g('c_terrace')) add += C.terrace;
      const [r0, r1] = C.rate[pkg];
      const lo = round(area * r0 * k * add), hi = round(area * r1 * k * add);
      tweenPrice(lo, hi, (a, b) => `${mln(a)} – ${mln(b)} млн ₽`);
      $('#cM2').textContent = `≈ ${Math.round(lo / area / 1000)}–${Math.round(hi / area / 1000)} тыс. ₽ за м²`;
      $('#cKind').textContent = 'Ориентировочная стоимость · ' + LBL.c_pkg[pkg].toLowerCase();
      mini = `${mln(lo)}–${mln(hi)} млн ₽`;
      const extras = [g('c_base') && 'цокольный этаж', g('c_garage') && 'гараж', g('c_terrace') && 'терраса', g('c_project') && 'нужен проект'].filter(Boolean);
      const parts = [LBL.c_proj[proj], fmtArea(area), LBL.c_floors[g('c_floors')], LBL.c_site[g('c_site')], LBL.c_roof[g('c_roof')], LBL.c_glass[g('c_glass')]].filter(Boolean);
      if (pkg === 'turnkey') parts.push(LBL.c_finish[g('c_finish')]);
      calcWhat = LBL.c_pkg[pkg] + (LBL.c_proj[proj] ? ', ' + LBL.c_proj[proj] : '');
      calcSummary = parts.concat(extras).join(', ') + `. Ориентировочно ${mini}`;
    }
    $('#qnPrice').textContent = mini;
  };

  const applyProj = id => {
    const P = PROJ[id]; if (!P) { areaExact = null; return; }
    areaExact = P.area; areaIn.value = Math.round(P.area);
    setR('c_floors', P.floors); setR('c_roof', P.roof); setR('c_glass', P.glass); setC('c_base', P.base); setC('c_terrace', P.terrace);
    if (!['box', 'turnkey'].includes(fd().get('c_pkg'))) setR('c_pkg', 'turnkey');
  };
  form.addEventListener('input', e => {
    if (e.target === areaIn) { areaExact = null; setR('c_proj', 'own'); }
    if (e.target.name && e.target.name.startsWith('c_')) compute();
  });
  form.addEventListener('change', e => {
    if (!started) { started = true; goal('quiz_start'); }
    const n = e.target.name || '';
    if (n === 'c_proj') applyProj(e.target.value);
    if (['c_floors', 'c_roof', 'c_glass', 'c_base', 'c_terrace'].includes(n) && fd().get('c_proj') !== 'own') { setR('c_proj', 'own'); areaExact = null; }
    if (n.startsWith('c_')) { compute(); goal('calc_change'); }
    if (n === 'via') render();
  });

  // переход по ссылкам «Рассчитать этот дом» и т. п.
  function preselect(v) {
    const map = { 'Проект 94,5 м²': 'p94', 'Проект 191 м²': 'p191', 'Проект 176 м²': 'p176' };
    if (map[v]) { setR('c_proj', map[v]); applyProj(map[v]); }
    else if (v === 'Бетонный бункер') setR('c_pkg', 'bunker');
    else if (v === 'Коммерческий объект') setR('c_pkg', 'commercial');
    else if (v === 'Встреча в офисе') intent = 'Хочет встречу в офисе';
    compute(); if (qi !== 0 && !$('#qDone').classList.contains('on')) { qi = 0; render(); }
  }

  const viaVal = () => (fd().get('via') || '');
  const stepBtns = $$('#qSteps button');
  function render() {
    qSteps.forEach((s, i) => s.classList.toggle('on', i === qi));
    stepBtns.forEach((b, i) => { b.classList.toggle('on', i === qi); b.classList.toggle('ok', i < qi); });
    qBack.hidden = qi === 0;
    $('#qnPriceBox').hidden = qi !== 0;
    qNextT.textContent = qi < total - 1 ? (innerWidth < 560 ? 'Точный расчёт' : 'Получить точный расчёт') : (viaVal() === 'Позвонить сейчас' ? 'Позвоните мне' : 'Отправить заявку');
    qErr.textContent = '';
  }
  const go = d => {
    qi = clamp(qi + d, 0, total - 1); render(); goal('quiz_step_' + (qi + 1));
    const top = form.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * .5) scrollToEl(innerWidth < 1000 ? $('.cfg-main', form) : form);
    if (qi === 1) setTimeout(() => { if (matchMedia('(hover:hover)').matches) phoneIn.focus({ preventScroll: true }); }, 450);
  };
  stepBtns.forEach((b, i) => b.addEventListener('click', () => { if (!$('#qDone').classList.contains('on') && i !== qi) go(i - qi); }));
  qBack.addEventListener('click', () => go(-1));

  const fmtPhone = v => {
    let d = v.replace(/\D/g, ''); if (d.startsWith('8')) d = '7' + d.slice(1); if (!d.startsWith('7')) d = '7' + d; d = d.slice(0, 11);
    const p = d.slice(1); let o = '+7';
    if (p.length) o += ' (' + p.slice(0, 3); if (p.length >= 3) o += ') ' + p.slice(3, 6); if (p.length >= 6) o += '-' + p.slice(6, 8); if (p.length >= 8) o += '-' + p.slice(8, 10);
    return o;
  };
  phoneIn.addEventListener('input', () => { const end = phoneIn.selectionStart === phoneIn.value.length; phoneIn.value = phoneIn.value ? fmtPhone(phoneIn.value) : ''; if (end) phoneIn.setSelectionRange(phoneIn.value.length, phoneIn.value.length); phoneIn.removeAttribute('aria-invalid'); });
  const lead = () => { const f = fd(); return { what: calcWhat, calc: calcSummary, intent, land: f.get('land') || '', when: f.get('when') || '', via: f.get('via') || '', name: String(f.get('name') || '').trim().slice(0, 80), phone: String(f.get('phone') || '').trim(), page: location.href.split('#')[0], utm: utm() }; };
  const leadText = l => {
    const L = ['Заявка с сайта Ройстрой']; if (l.name) L.push('Имя: ' + l.name); L.push('Телефон: ' + l.phone, 'Строить: ' + l.what);
    if (l.calc) L.push('Параметры: ' + l.calc);
    if (l.intent) L.push('Пожелание: ' + l.intent);
    if (l.land) L.push('Участок: ' + l.land); if (l.when) L.push('Начать: ' + l.when); L.push('Связь: ' + l.via);
    const u = l.utm; if (u.utm_source || u.utm_campaign) L.push('Источник: ' + [u.utm_source, u.utm_campaign].filter(Boolean).join(' / '));
    return L.join('\n');
  };
  const send = async l => {
    if (!CONFIG.leadEndpoint) return false;
    const ctrl = 'AbortController' in window ? new AbortController() : null; const t = setTimeout(() => ctrl && ctrl.abort(), 8000);
    try { const r = await fetch(CONFIG.leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(l), signal: ctrl && ctrl.signal }); return r.ok; }
    catch (e) { return false; } finally { clearTimeout(t); }
  };
  let sending = false;
  const submit = async () => {
    if (sending) return;
    if (phoneIn.value.replace(/\D/g, '').length !== 11) { phoneIn.setAttribute('aria-invalid', 'true'); qErr.textContent = 'Введите номер телефона полностью'; phoneIn.focus(); return; }
    if (!$('#qConsent').checked) { qErr.textContent = 'Нужно согласие на обработку данных'; return; }
    sending = true; qNext.disabled = true; qNextT.textContent = 'Отправляем…';
    const l = lead(), text = leadText(l), ok = await send(l);
    sending = false; qNext.disabled = false;
    goal('lead', { via: l.via, what: l.what });
    $('#qMsg').textContent = text;
    const call = $('#qCallBtn'), tg = $('#qTg'), cp = $('#qCopy'), msg = $('#qMsg'), h = $('#qDoneH'), txt = $('#qDoneTxt');
    call.hidden = tg.hidden = true; cp.hidden = msg.hidden = false;
    if (ok) {
      h.textContent = 'Заявка отправлена';
      txt.textContent = l.via === 'Позвонить сейчас' ? 'Спасибо! Сейчас перезвоним.' : `Спасибо! Напишем вам в ${l.via}.`;
      cp.hidden = msg.hidden = true;
    } else if (l.via === 'Позвонить сейчас') {
      h.textContent = 'Позвоните нам сейчас'; txt.textContent = 'Ответим, обсудим ваш участок и сориентируем по стоимости: ' + CONFIG.phoneHuman + '.';
      call.hidden = false; cp.hidden = msg.hidden = true;
    } else if (l.via === 'MAX') {
      txt.textContent = 'Отправьте этот текст нам в MAX на номер ' + CONFIG.phoneHuman + '. Текст уже скопирован.'; copy(text, 'Текст заявки скопирован');
    } else {
      txt.textContent = 'Откройте Telegram и вставьте текст в чат. Текст уже скопирован.'; tg.hidden = false; copy(text, 'Текст заявки скопирован');
    }
    qSteps.forEach(s => s.classList.remove('on')); $('#qNav').hidden = true; stepBtns.forEach(b => { b.classList.remove('on'); b.classList.add('ok'); });
    const done = $('#qDone'); done.classList.add('on'); done.focus();
    if (l.via === 'MAX' && !ok) openMax();
  };
  qNext.addEventListener('click', () => { if (qi === total - 1) submit(); else go(1); });
  form.addEventListener('submit', e => { e.preventDefault(); if (qi === total - 1) submit(); });
  $('#qCopy').addEventListener('click', () => copy($('#qMsg').textContent, 'Текст заявки скопирован'));
  compute(); render();

  /* ───────── старт ───────── */
  $('#yr').textContent = new Date().getFullYear();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { measure(); measureVilla(); measureReel(); onScroll(); }, 150); });
  measure(); measureVilla(); measureReel(); frame();
  const boot = () => { startLenis(); armHero(); measure(); measureVilla(); measureReel(); onScroll(); };
  if (document.readyState === 'complete') boot(); else addEventListener('load', boot);
})();
