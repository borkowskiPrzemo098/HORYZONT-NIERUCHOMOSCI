(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zl = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł';

  /* =========================================================
     SCENA: wieża nad zatoką, pora dnia sterowana scrollem
     ========================================================= */
  const canvas = $('#sky');
  const ctx = canvas.getContext('2d');
  const scene = $('#scena');
  let W = 0, H = 0, DPR = 1, progress = 0, target = 0, time = 0, running = true;

  // klatki kluczowe: t = postęp scrolla 0..1
  const K = [
    { t: 0.00, top: '#1d2a52', mid: '#7d6f95', hor: '#f4b48f', sea: '#3c4766', sun: 0.04, sunX: 0.18, light: 0.45, night: 0.25, lit: 0.18, cloud: 0.35, rain: 0, fog: 0.75, warm: 0.55, clock: 380, w: 'Mgła nad zatoką · 9°C' },
    { t: 0.12, top: '#2a3f74', mid: '#9a8fb0', hor: '#ffc9a0', sea: '#4a5779', sun: 0.12, sunX: 0.22, light: 0.6, night: 0.08, lit: 0.06, cloud: 0.3, rain: 0, fog: 0.55, warm: 0.6, clock: 400, w: 'Mgła nad zatoką · 9°C' },
    { t: 0.32, top: '#2f6fbf', mid: '#79aee2', hor: '#d6ecf8', sea: '#2d5f8f', sun: 0.92, sunX: 0.5, light: 1, night: 0, lit: 0, cloud: 0.4, rain: 0, fog: 0, warm: 0, clock: 750, w: 'Bezchmurnie · 19°C' },
    { t: 0.54, top: '#36366e', mid: '#c2667a', hor: '#ffb062', sea: '#5b4560', sun: 0.06, sunX: 0.8, light: 0.7, night: 0.12, lit: 0.22, cloud: 0.45, rain: 0, fog: 0.05, warm: 1, clock: 1180, w: 'Zachód słońca · 17°C' },
    { t: 0.74, top: '#1b2330', mid: '#2e3848', hor: '#4a5566', sea: '#1d2633', sun: -0.3, sunX: 0.9, light: 0.25, night: 0.7, lit: 0.55, cloud: 1, rain: 1, fog: 0.35, warm: 0.15, clock: 1270, w: 'Deszcz · 12°C' },
    { t: 0.95, top: '#03060f', mid: '#0b1430', hor: '#1f2b4d', sea: '#070c1a', sun: -0.5, sunX: 0.95, light: 0.08, night: 1, lit: 0.82, cloud: 0.15, rain: 0, fog: 0.1, warm: 0.1, clock: 1410, w: 'Bezchmurnie · 10°C' },
    { t: 1.00, top: '#03060f', mid: '#0b1430', hor: '#1f2b4d', sea: '#070c1a', sun: -0.5, sunX: 0.95, light: 0.08, night: 1, lit: 0.85, cloud: 0.15, rain: 0, fog: 0.1, warm: 0.1, clock: 1415, w: 'Bezchmurnie · 10°C' },
  ];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixC = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const sm = f => f * f * (3 - 2 * f);
  K.forEach(k => { ['top', 'mid', 'hor', 'sea'].forEach(p => { k[p] = hex(k[p]); }); });

  function stateAt(t) {
    let i = 0;
    while (i < K.length - 2 && t > K[i + 1].t) i++;
    const a = K[i], b = K[i + 1];
    const f = sm(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
    const s = {};
    for (const p in a) {
      if (p === 'w' || p === 't') continue;
      s[p] = Array.isArray(a[p]) ? mixC(a[p], b[p], f) : a[p] + (b[p] - a[p]) * f;
    }
    s.w = f < 0.5 ? a.w : b.w;
    return s;
  }

  // stałe losowe (deterministyczne)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const FLOORS = 26, COLS = 7;
  const winSeed = Array.from({ length: FLOORS * COLS }, () => rnd());
  const stars = Array.from({ length: 140 }, () => [rnd(), rnd() * 0.6, rnd() * 1.4 + 0.3, rnd()]);
  const city = Array.from({ length: 46 }, (_, i) => [i / 46, 0.02 + rnd() * 0.07, rnd()]);
  const clouds = Array.from({ length: 9 }, () => [rnd(), 0.06 + rnd() * 0.3, 0.12 + rnd() * 0.22, rnd()]);
  const drops = Array.from({ length: 260 }, () => [rnd(), rnd(), 0.6 + rnd() * 0.8]);
  const cityWin = Array.from({ length: 300 }, () => [rnd(), rnd(), rnd()]);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw() {
    const s = stateAt(progress);
    const mobile = W < 700;
    const hor = Math.round(H * (mobile ? 0.66 : 0.7));

    // niebo
    const g = ctx.createLinearGradient(0, 0, 0, hor);
    g.addColorStop(0, rgb(s.top)); g.addColorStop(0.55, rgb(s.mid)); g.addColorStop(1, rgb(s.hor));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hor + 1);

    // gwiazdy
    if (s.night > 0.4) {
      const a = (s.night - 0.4) / 0.6 * (1 - s.cloud * 0.8);
      for (const st of stars) {
        const tw = 0.6 + 0.4 * Math.sin(time * 0.002 + st[3] * 20);
        ctx.fillStyle = `rgba(255,248,230,${a * tw * 0.9})`;
        ctx.fillRect(st[0] * W, st[1] * hor, st[2], st[2]);
      }
      // księżyc
      const mx = W * (mobile ? 0.78 : 0.22), my = hor * 0.2;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
      mg.addColorStop(0, `rgba(240,236,220,${0.35 * a})`); mg.addColorStop(1, 'rgba(240,236,220,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - 90, my - 90, 180, 180);
      ctx.fillStyle = `rgba(246,242,228,${a})`;
      ctx.beginPath(); ctx.arc(mx, my, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(s.top, a); ctx.beginPath(); ctx.arc(mx + 7, my - 4, 14, 0, Math.PI * 2); ctx.fill();
    }

    // słońce
    if (s.sun > -0.15) {
      const sx = W * s.sunX, sy = hor - Math.max(-0.1, s.sun) * hor * 0.82;
      const r = 26 + (1 - Math.min(1, s.sun)) * 14;
      const warm = s.warm;
      const col = mixC([255, 248, 225], [255, 170, 90], warm);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 9);
      sg.addColorStop(0, rgb(col, 0.55 * (1 - s.cloud * 0.6)));
      sg.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = sg; ctx.fillRect(sx - r * 9, sy - r * 9, r * 18, r * 18);
      ctx.fillStyle = rgb(mixC([255, 252, 238], [255, 196, 120], warm), 1 - s.cloud * 0.7);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }

    // chmury
    const cloudCol = mixC(mixC(s.hor, [255, 255, 255], 0.35 * s.light), [40, 46, 58], s.rain * 0.7 + s.night * 0.4);
    for (const c of clouds) {
      const amount = s.cloud;
      if (c[3] > amount + 0.1) continue;
      const x = ((c[0] + time * 0.000004 * (0.5 + c[3])) % 1.3 - 0.15) * W;
      const y = c[1] * hor, w = c[2] * W * (0.8 + amount * 0.6), h = w * 0.22;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, w * 0.6);
      cg.addColorStop(0, rgb(cloudCol, 0.55 * amount + 0.1)); cg.addColorStop(1, rgb(cloudCol, 0));
      ctx.save(); ctx.translate(x, y); ctx.scale(1, h / w); ctx.translate(-x, -y);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, y, w * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (s.rain > 0) { ctx.fillStyle = rgb([34, 40, 52], s.rain * 0.45); ctx.fillRect(0, 0, W, hor); }

    // panorama miasta na horyzoncie
    const cityCol = mixC(mixC(s.hor, [20, 26, 40], 0.55), [8, 12, 22], s.night);
    ctx.fillStyle = rgb(cityCol);
    for (const b of city) {
      const bx = b[0] * W, bw = W / 46 + 1, bh = b[1] * H * (mobile ? 0.7 : 1);
      if (bx > W * 0.55 && bx < W * 0.85 && !mobile) continue;
      ctx.fillRect(bx, hor - bh, bw, bh);
    }
    if (s.night > 0.3) {
      for (const w of cityWin) {
        if (w[2] > s.lit) continue;
        const bx = w[0] * W; if (bx > W * 0.55 && bx < W * 0.85 && !mobile) continue;
        ctx.fillStyle = `rgba(255,214,150,${0.7 * s.night})`;
        ctx.fillRect(bx, hor - w[1] * H * 0.06 - 2, 1.6, 1.6);
      }
    }

    // wieża
    const tw = Math.min(W * (mobile ? 0.4 : 0.17), 300);
    const th = Math.min(H * (mobile ? 0.5 : 0.62), tw * 3.4);
    const tx = mobile ? W * 0.5 - tw / 2 : W * 0.68 - tw / 2;
    const ty = hor - th;
    drawTower(s, tx, ty, tw, th, hor);

    // mgła
    if (s.fog > 0) {
      const fg = ctx.createLinearGradient(0, hor - H * 0.25, 0, hor + 10);
      const fc = mixC(s.hor, [235, 230, 225], 0.5);
      fg.addColorStop(0, rgb(fc, 0)); fg.addColorStop(1, rgb(fc, 0.55 * s.fog));
      ctx.fillStyle = fg; ctx.fillRect(0, hor - H * 0.25, W, H * 0.25 + 10);
    }

    // bulwar
    ctx.fillStyle = rgb(mixC(mixC(s.sea, [10, 14, 22], 0.6), [4, 6, 12], s.night));
    ctx.fillRect(0, hor, W, 6);
    if (s.night > 0.2) {
      for (let i = 0; i < 16; i++) {
        const lx = (i + 0.5) / 16 * W;
        const lg = ctx.createRadialGradient(lx, hor, 0, lx, hor, 22);
        lg.addColorStop(0, `rgba(255,205,140,${0.7 * s.night})`); lg.addColorStop(1, 'rgba(255,205,140,0)');
        ctx.fillStyle = lg; ctx.fillRect(lx - 22, hor - 22, 44, 44);
      }
    }

    // morze + odbicie
    const sg2 = ctx.createLinearGradient(0, hor, 0, H);
    sg2.addColorStop(0, rgb(mixC(s.sea, s.hor, 0.35))); sg2.addColorStop(1, rgb(mixC(s.sea, [3, 6, 14], 0.55)));
    ctx.fillStyle = sg2; ctx.fillRect(0, hor + 6, W, H - hor);
    const seaH = H - hor - 6;
    const step = 3;
    ctx.globalAlpha = 0.42 - s.rain * 0.12;
    for (let y = 0; y < seaH; y += step) {
      const srcY = hor - y * 1.05 - 2;
      if (srcY < 0) break;
      const amp = (1.2 + y * 0.05) * (1 + s.rain * 1.5);
      const off = Math.sin(y * 0.18 + time * 0.0025) * amp;
      ctx.drawImage(canvas, 0, srcY * DPR, W * DPR, step * DPR, off, hor + 6 + y, W, step);
    }
    ctx.globalAlpha = 1;
    // połysk słońca na wodzie
    if (s.sun > -0.1 && s.light > 0.3) {
      const sx = W * s.sunX;
      for (let i = 0; i < 26; i++) {
        const y = hor + 10 + i * i * 0.5;
        if (y > H) break;
        const w = 30 + i * 6 + Math.sin(time * 0.003 + i) * 8;
        ctx.fillStyle = rgb(mixC([255, 250, 230], [255, 170, 90], s.warm), 0.22 * (1 - i / 26) * (1 - s.cloud * 0.6));
        ctx.fillRect(sx - w / 2, y, w, 1.5);
      }
    }
    // deszcz
    if (s.rain > 0.02) {
      ctx.strokeStyle = `rgba(200,212,230,${0.35 * s.rain})`; ctx.lineWidth = 1;
      ctx.beginPath();
      const n = Math.round(drops.length * s.rain * (mobile ? 0.5 : 1));
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        const x = (d[0] * W + time * 0.05 * d[2]) % W;
        const y = (d[1] * H + time * 0.9 * d[2]) % H;
        ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14 * d[2]);
      }
      ctx.stroke();
    }
  }

  function drawTower(s, x, y, w, h, hor) {
    const crown = h * 0.08;
    const facade = mixC(mixC([214, 208, 196], s.hor, 0.25), [26, 30, 40], 1 - s.light);
    const fin = mixC(facade, [255, 255, 255], 0.15 * s.light);
    // skrzydło niskie
    const ww = w * 1.25, wh = h * 0.2, wx = x - ww * 0.82;
    ctx.fillStyle = rgb(mixC(facade, [0, 0, 0], 0.15)); ctx.fillRect(wx, hor - wh, ww, wh);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
      const lit = winSeed[(r * 9 + c) % winSeed.length] < s.lit * 1.1;
      ctx.fillStyle = lit ? `rgba(255,208,140,${0.6 + 0.35 * s.night})` : rgb(mixC(s.mid, s.top, 0.5), 0.8);
      ctx.fillRect(wx + 6 + c * (ww - 12) / 9, hor - wh + 6 + r * (wh - 10) / 4, (ww - 12) / 9 - 4, (wh - 10) / 4 - 5);
    }
    // korpus
    ctx.fillStyle = rgb(facade); ctx.fillRect(x, y + crown, w, h - crown);
    // korona (cofnięta)
    ctx.fillStyle = rgb(mixC(facade, [0, 0, 0], 0.1)); ctx.fillRect(x + w * 0.12, y, w * 0.76, crown);
    // latarnia na szczycie
    const beacon = (Math.sin(time * 0.004) + 1) / 2;
    if (s.night > 0.3) {
      const bg = ctx.createRadialGradient(x + w / 2, y - 6, 0, x + w / 2, y - 6, 40);
      bg.addColorStop(0, `rgba(255,190,110,${0.8 * s.night * (0.4 + 0.6 * beacon)})`); bg.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = bg; ctx.fillRect(x + w / 2 - 40, y - 46, 80, 80);
    }
    ctx.fillStyle = s.night > 0.3 ? `rgba(255,214,150,${0.6 + 0.4 * beacon})` : rgb(fin);
    ctx.fillRect(x + w / 2 - 2, y - 14, 4, 14);

    // okna
    const pad = w * 0.06, gw = (w - pad * 2) / COLS, gh = (h - crown - pad) / FLOORS;
    for (let f = 0; f < FLOORS; f++) {
      for (let c = 0; c < COLS; c++) {
        const wxp = x + pad + c * gw, wyp = y + crown + pad * 0.5 + f * gh;
        const idx = f * COLS + c;
        const lit = winSeed[idx] < s.lit;
        if (lit) {
          const warmth = 0.75 + 0.25 * Math.sin(idx * 3.1);
          ctx.fillStyle = `rgba(255,${(200 * warmth) | 0},${(130 * warmth) | 0},${0.55 + 0.45 * s.night})`;
        } else {
          // odbicie nieba w szkle, jaśniejsze wyżej
          const refl = mixC(mixC(s.mid, s.hor, f / FLOORS), [12, 16, 26], 0.35 + 0.4 * (1 - s.light));
          const glint = s.sun > 0 ? Math.max(0, 1 - Math.abs((c / COLS) - (1 - s.sunX)) * 3) * 0.25 * s.light : 0;
          ctx.fillStyle = rgb(mixC(refl, [255, 240, 220], glint));
        }
        ctx.fillRect(wxp + 1.5, wyp + 1.5, gw - 3, gh - 3.5);
      }
      // płyty balkonów co 2 piętra
      if (f % 2 === 1) { ctx.fillStyle = rgb(fin, 0.9); ctx.fillRect(x - 3, y + crown + pad * 0.5 + (f + 1) * gh - 2, w + 6, 2); }
    }
    // pionowe lamele
    ctx.fillStyle = rgb(fin, 0.75);
    for (let c = 0; c <= COLS; c++) ctx.fillRect(x + pad + c * gw - 1, y + crown, 2, h - crown);
    // cieniowanie bryły (światło z boku słońca)
    const side = ctx.createLinearGradient(x, 0, x + w, 0);
    const lightLeft = s.sunX < 0.5;
    side.addColorStop(0, `rgba(0,0,0,${lightLeft ? 0 : 0.28})`);
    side.addColorStop(1, `rgba(0,0,0,${lightLeft ? 0.28 : 0})`);
    ctx.fillStyle = side; ctx.fillRect(x, y, w, h);
    if (s.warm > 0.5 && s.sun > -0.1) { ctx.fillStyle = `rgba(255,150,70,${0.12 * s.warm})`; ctx.fillRect(x, y, w, h); }
  }

  // HUD + rozdziały
  const chapters = $$('.chapter'), rail = $$('#hudRail button');
  const hudTime = $('#hudTime'), hudW = $('#hudWeather'), hint = $('#hint');
  const BOUNDS = [0.06, 0.22, 0.43, 0.64, 0.85];
  let lastCh = -1;
  function updateUI() {
    const s = stateAt(progress);
    const m = Math.round(s.clock) % 1440;
    hudTime.textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    hudW.textContent = s.w;
    let ch = 0; BOUNDS.forEach((b, i) => { if (progress >= b) ch = i + 1; });
    if (ch !== lastCh) {
      chapters.forEach((c, i) => { const on = i === ch; c.classList.toggle('is-on', on); c.setAttribute('aria-hidden', String(!on)); c.inert = !on; });
      rail.forEach((b, i) => b.classList.toggle('is-on', i === ch - 1));
      lastCh = ch;
    }
    hint.classList.toggle('is-hidden', progress > 0.02);
  }

  function readScroll() {
    const r = scene.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    target = Math.min(1, Math.max(0, -r.top / total));
  }
  rail.forEach(b => b.addEventListener('click', () => {
    const total = scene.offsetHeight - window.innerHeight;
    window.scrollTo({ top: scene.offsetTop + total * Number(b.dataset.p), behavior: reduce ? 'auto' : 'smooth' });
  }));

  function frame(ts) {
    time = reduce ? 0 : ts;
    progress += (target - progress) * (reduce ? 1 : 0.12);
    if (Math.abs(target - progress) < 0.0005) progress = target;
    if (running) { draw(); updateUI(); }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { running = e.isIntersecting; }, { rootMargin: '100px' }).observe(scene);
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', () => { resize(); readScroll(); });
  resize(); readScroll(); progress = target; draw(); updateUI();
  requestAnimationFrame(frame);

  /* =========================================================
     NAWIGACJA
     ========================================================= */
  const burger = $('#burger'), nav = $('#nav');
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
  }
  burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setNav(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1000) setNav(false); });

  /* =========================================================
     APARTAMENTY
     ========================================================= */
  const ROOMS = {
    2: [['Salon z aneksem', 28.4], ['Sypialnia', 13.2], ['Łazienka', 5.6], ['Przedpokój', 6.1], ['Taras', 14]],
    3: [['Salon z aneksem', 36.2], ['Sypialnia główna', 16.4], ['Sypialnia', 11.8], ['Łazienka', 7.2], ['WC', 2.4], ['Przedpokój', 8.3], ['Taras', 22]],
    4: [['Salon z aneksem', 48.6], ['Sypialnia główna', 19.8], ['Sypialnia', 13.4], ['Gabinet', 11.2], ['Łazienki (2)', 14.1], ['Garderoba', 6.2], ['Przedpokój', 10.7], ['Taras', 46]],
  };
  const UNITS = [];
  (function genUnits() {
    let s2 = 11; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
    for (let f = 4; f <= 27; f += 1) {
      const per = f >= 24 ? 1 : 2;
      for (let k = 0; k < per; k++) {
        const rooms = f >= 24 ? 4 : (r2() < 0.45 ? 2 : r2() < 0.7 ? 3 : 4);
        const area = ROOMS[rooms].filter(r => r[0] !== 'Taras').reduce((a, r) => a + r[1], 0);
        const m2 = 18900 + f * 420 + (rooms === 4 ? 2600 : 0);
        const rr = r2();
        UNITS.push({ id: `L${String(f).padStart(2, '0')}.${k + 1}`, floor: f, rooms, area: Math.round(area * 10) / 10, price: Math.round(area * m2 / 1000) * 1000, m2, status: rr < 0.58 ? 'free' : rr < 0.78 ? 'held' : 'sold', side: k ? 'zachód' : 'wschód' });
      }
    }
  })();
  const ST = { free: ['dostępny', 'st-free'], held: ['rezerwacja', 'st-held'], sold: ['sprzedany', 'st-sold'] };
  const fstate = { rooms: 'all', onlyFree: true };
  let current = null;
  const tbody = $('#unitRows');

  function renderUnits() {
    const list = UNITS.filter(u => (fstate.rooms === 'all' || (fstate.rooms === '4' ? u.rooms >= 4 : u.rooms === Number(fstate.rooms))) && (!fstate.onlyFree || u.status === 'free'));
    tbody.innerHTML = list.map(u => `<tr data-id="${u.id}"${current && current.id === u.id ? ' class="is-on"' : ''}>
      <td><button type="button" class="rowbtn" aria-label="Pokaż rzut lokalu ${u.id}">${u.id}</button></td><td>${u.floor}</td><td>${u.rooms}</td><td>${u.area.toFixed(1).replace('.', ',')} m²</td>
      <td>${zl(u.price)}</td><td><span class="status ${ST[u.status][1]}">${ST[u.status][0]}</span></td>
      <td class="meta">piętro ${u.floor} · ${u.rooms} pok. · ${u.area.toFixed(1).replace('.', ',')} m²</td></tr>`).join('');
    $('#unitEmpty').hidden = list.length > 0;
    if (!current || !list.some(u => u.id === current.id)) { if (list[0]) showUnit(list[0]); }
  }
  function planSvg(u) {
    const rooms = ROOMS[Math.min(4, u.rooms)];
    const inner = rooms.filter(r => r[0] !== 'Taras'), terr = rooms.find(r => r[0] === 'Taras');
    const total = inner.reduce((a, r) => a + r[1], 0);
    let out = '', x = 14, y = 14; const Wp = 372, Hp = 200;
    // salon: lewa część
    const big = inner[0], restA = total - big[1];
    const bw = Wp * big[1] / total * 1.25;
    out += `<rect x="${x}" y="${y}" width="${bw}" height="${Hp}"/><text x="${x + 10}" y="${y + 22}">${big[0]}</text><text class="m" x="${x + 10}" y="${y + 38}">${big[1].toFixed(1).replace('.', ',')} m²</text>`;
    const rest = inner.slice(1); let ry = y; const rw = Wp - bw;
    rest.forEach(r => { const rh = Hp * r[1] / restA; out += `<rect x="${x + bw}" y="${ry}" width="${rw}" height="${rh}"/>`; if (rh > 24) out += `<text x="${x + bw + 8}" y="${ry + Math.min(18, rh / 2 + 4)}">${r[0]}</text>`; ry += rh; });
    if (terr) out += `<rect class="terrace" x="${x}" y="${y + Hp + 10}" width="${Wp}" height="58"/><text x="${x + 10}" y="${y + Hp + 34}">Taras · ${terr[1]} m²</text><text class="m" x="${x + 10}" y="${y + Hp + 52}">strona: ${u.side}</text>`;
    return out;
  }
  function showUnit(u) {
    current = u;
    $$('#unitRows tr').forEach(tr => tr.classList.toggle('is-on', tr.dataset.id === u.id));
    $('#planTitle').textContent = `Lokal ${u.id}`;
    const st = $('#planStatus'); st.className = `status ${ST[u.status][1]}`; st.textContent = ST[u.status][0];
    $('#planSvg').innerHTML = planSvg(u);
    $('#planSvg').setAttribute('aria-label', `Rzut lokalu ${u.id}: ${u.rooms} pokoje, ${u.area} m²`);
    $('#planRooms').innerHTML = ROOMS[Math.min(4, u.rooms)].map(r => `<div><dt>${r[0]}</dt><dd>${r[1].toFixed(1).replace('.', ',')} m²</dd></div>`).join('');
    $('#planPrice').textContent = zl(u.price);
    $('#planM2').textContent = `${zl(u.m2)} / m² · piętro ${u.floor} · ${u.area.toFixed(1).replace('.', ',')} m²`;
    const ask = $('#planAsk');
    ask.textContent = u.status === 'sold' ? 'Zapytaj o podobny apartament' : 'Zapytaj o ten apartament';
  }
  tbody.addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) showUnit(UNITS.find(u => u.id === tr.dataset.id)); });
  $$('.filters .fchip').forEach(b => b.addEventListener('click', () => {
    fstate.rooms = b.dataset.rooms;
    $$('.filters .fchip').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    renderUnits();
  }));
  $('#onlyFree').addEventListener('change', e => { fstate.onlyFree = e.target.checked; renderUnits(); });
  $('#showAll').addEventListener('click', () => { $('#onlyFree').checked = false; fstate.onlyFree = false; renderUnits(); });
  renderUnits();

  /* =========================================================
     OFERTY
     ========================================================= */
  $$('.tabs .fchip').forEach(b => b.addEventListener('click', () => {
    $$('.tabs .fchip').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    $$('.offer').forEach(o => { o.hidden = b.dataset.kind !== 'all' && o.dataset.kind !== b.dataset.kind; });
  }));

  /* =========================================================
     KALKULATOR
     ========================================================= */
  const cP = $('#cPrice'), cD = $('#cDown'), cY = $('#cYears'), cR = $('#cRate');
  function calc() {
    const P = Number(cP.value), d = Number(cD.value), n = Number(cY.value) * 12, r = Number(cR.value) / 100 / 12;
    const loan = P * (1 - d / 100);
    const rata = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
    $('#oPrice').textContent = zl(P); $('#oDown').textContent = d + '%';
    $('#oYears').textContent = cY.value + (Number(cY.value) < 5 ? ' lata' : ' lat');
    $('#oRate').textContent = String(cR.value).replace('.', ',') + '%';
    $('#rata').textContent = zl(rata); $('#kwota').textContent = zl(loan);
  }
  [cP, cD, cY, cR].forEach(i => i.addEventListener('input', calc));
  calc();

  /* =========================================================
     FORMULARZ
     ========================================================= */
  const form = $('#form'), topic = $('#topic');
  topic.innerHTML += $$('.offer h3').map(h => `<option value="${h.textContent}">${h.textContent}</option>`).join('');
  $('#planAsk').addEventListener('click', () => {
    if (!current) return;
    const val = `lokal-${current.id}`;
    if (!topic.querySelector(`option[value="${val}"]`)) topic.insertAdjacentHTML('afterbegin', `<option value="${val}">Latarnia Orłowo — lokal ${current.id}</option>`);
    topic.value = val;
  });
  function setErr(id, msg) {
    $(`#${id}-err`).textContent = msg;
    const el = document.getElementById(id);
    el.closest('.field').classList.toggle('has-err', !!msg);
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  ['name', 'phone', 'email'].forEach(id => document.getElementById(id).addEventListener('input', () => setErr(id, '')));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const errs = [];
    if (form.name.value.trim().length < 3) errs.push(['name', 'Podaj imię i nazwisko.']);
    if (form.phone.value.replace(/\D/g, '').length < 9) errs.push(['phone', 'Podaj numer telefonu (9 cyfr).']);
    if (!/^\S+@\S+\.\S+$/.test(form.email.value.trim())) errs.push(['email', 'Podaj poprawny adres e-mail.']);
    ['name', 'phone', 'email'].forEach(id => setErr(id, ''));
    if (errs.length) {
      errs.forEach(([id, m]) => setErr(id, m));
      const first = document.getElementById(errs[0][0]);
      first.focus({ preventScroll: true }); first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    const btn = $('#submit'); btn.disabled = true; btn.textContent = 'Wysyłam…';
    setTimeout(() => {
      const mode = form.querySelector('input[name="mode"]:checked').nextElementSibling.textContent.toLowerCase();
      $('#doneText').textContent = `Tomasz Lewicki zadzwoni na ${form.phone.value.trim()} w ciągu 2 godzin roboczych, żeby ustalić prezentację (${mode}). Temat: ${topic.options[topic.selectedIndex].text}.`;
      $('#formBody').hidden = true; const done = $('#done'); done.hidden = false; done.focus();
      btn.disabled = false; btn.textContent = 'Wyślij zapytanie';
    }, 800);
  });
  $('#again').addEventListener('click', () => { form.reset(); $('#done').hidden = true; $('#formBody').hidden = false; topic.focus(); });

  // pływający przycisk: ukryty na scenie i przy formularzu
  const fab = $('#fab');
  if ('IntersectionObserver' in window) {
    const seen = { scene: true, form: false };
    const sync = () => fab.classList.toggle('is-hidden', seen.scene || seen.form);
    new IntersectionObserver(([e]) => { seen.scene = e.isIntersecting; sync(); }).observe(scene);
    new IntersectionObserver(([e]) => { seen.form = e.isIntersecting; sync(); }).observe($('#kontakt'));
    sync();
  }
})();
