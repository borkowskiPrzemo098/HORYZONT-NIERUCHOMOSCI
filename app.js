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
    { t: 0.54, top: '#36366e', mid: '#c2667a', hor: '#ffb062', sea: '#5b4560', sun: 0.06, sunX: 0.8, light: 0.7, night: 0.12, lit: 0.1, cloud: 0.45, rain: 0, fog: 0.05, warm: 1, clock: 1180, w: 'Zachód słońca · 17°C' },
    { t: 0.74, top: '#1b2330', mid: '#2e3848', hor: '#4a5566', sea: '#1d2633', sun: -0.3, sunX: 0.9, light: 0.25, night: 0.7, lit: 0.36, cloud: 1, rain: 1, fog: 0.35, warm: 0.15, clock: 1270, w: 'Deszcz · 12°C' },
    { t: 0.95, top: '#03060f', mid: '#0b1430', hor: '#1f2b4d', sea: '#070c1a', sun: -0.5, sunX: 0.95, light: 0.08, night: 1, lit: 0.48, cloud: 0.15, rain: 0, fog: 0.1, warm: 0.1, clock: 1410, w: 'Bezchmurnie · 10°C' },
    { t: 1.00, top: '#03060f', mid: '#0b1430', hor: '#1f2b4d', sea: '#070c1a', sun: -0.5, sunX: 0.95, light: 0.08, night: 1, lit: 0.5, cloud: 0.15, rain: 0, fog: 0.1, warm: 0.1, clock: 1415, w: 'Bezchmurnie · 10°C' },
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
  const FLOORS = 30, COLS = 6, SIDE = 2, TERRACE_FROM = 12;
  const winSeed = Array.from({ length: FLOORS * (COLS + SIDE) }, () => rnd());
  const stars = Array.from({ length: 160 }, () => [rnd(), rnd() * 0.62, rnd() * 1.4 + 0.3, rnd()]);
  const clouds = Array.from({ length: 10 }, () => [rnd(), 0.05 + rnd() * 0.32, 0.14 + rnd() * 0.24, rnd()]);
  const drops = Array.from({ length: 320 }, () => [rnd(), rnd(), 0.6 + rnd() * 0.8]);
  // daleka panorama Gdyni: różne szerokości i wysokości, tylko po lewej
  const skyline = [];
  for (let x = 0; x < 0.5;) { const w = 0.006 + rnd() * 0.022; skyline.push([x, w, 0.012 + Math.pow(rnd(), 2) * 0.07, rnd()]); x += w + rnd() * 0.004; }
  const ships = Array.from({ length: 3 }, (_, i) => [0.1 + i * 0.28 + rnd() * 0.1, 0.06 + rnd() * 0.18, 0.4 + rnd() * 0.6]);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw() {
    const s = stateAt(progress);
    const mobile = W < 700;
    const hor = Math.round(H * (mobile ? 0.64 : 0.7));
    const dark = [8, 11, 20];

    // niebo
    const g = ctx.createLinearGradient(0, 0, 0, hor);
    g.addColorStop(0, rgb(s.top)); g.addColorStop(0.55, rgb(s.mid)); g.addColorStop(1, rgb(s.hor));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hor + 1);

    // gwiazdy i księżyc
    if (s.night > 0.4) {
      const a = (s.night - 0.4) / 0.6 * (1 - s.cloud * 0.8);
      for (const st of stars) {
        const tw = 0.6 + 0.4 * Math.sin(time * 0.002 + st[3] * 20);
        ctx.fillStyle = `rgba(255,248,230,${a * tw * 0.9})`;
        ctx.fillRect(st[0] * W, st[1] * hor, st[2], st[2]);
      }
      const mx = W * (mobile ? 0.8 : 0.24), my = hor * 0.18;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 110);
      mg.addColorStop(0, `rgba(240,236,220,${0.3 * a})`); mg.addColorStop(1, 'rgba(240,236,220,0)');
      ctx.fillStyle = mg; ctx.fillRect(mx - 110, my - 110, 220, 220);
      ctx.fillStyle = `rgba(246,242,228,${a})`; ctx.beginPath(); ctx.arc(mx, my, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgb(s.top, a); ctx.beginPath(); ctx.arc(mx + 7, my - 4, 13.5, 0, Math.PI * 2); ctx.fill();
    }

    // słońce
    if (s.sun > -0.15) {
      const sx = W * s.sunX, sy = hor - Math.max(-0.1, s.sun) * hor * 0.82;
      const r = 24 + (1 - Math.min(1, s.sun)) * 14;
      const col = mixC([255, 248, 225], [255, 170, 90], s.warm);
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 10);
      sg.addColorStop(0, rgb(col, 0.55 * (1 - s.cloud * 0.6))); sg.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = sg; ctx.fillRect(sx - r * 10, sy - r * 10, r * 20, r * 20);
      ctx.fillStyle = rgb(mixC([255, 252, 238], [255, 196, 120], s.warm), 1 - s.cloud * 0.7);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }

    // chmury
    const cloudCol = mixC(mixC(s.hor, [255, 255, 255], 0.35 * s.light), [40, 46, 58], s.rain * 0.7 + s.night * 0.4);
    for (const c of clouds) {
      if (c[3] > s.cloud + 0.1) continue;
      const x = ((c[0] + time * 0.000004 * (0.5 + c[3])) % 1.3 - 0.15) * W;
      const y = c[1] * hor, w = c[2] * W * (0.8 + s.cloud * 0.6), h = w * 0.22;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, w * 0.6);
      cg.addColorStop(0, rgb(cloudCol, 0.55 * s.cloud + 0.1)); cg.addColorStop(1, rgb(cloudCol, 0));
      ctx.save(); ctx.translate(x, y); ctx.scale(1, h / w); ctx.translate(-x, -y);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(x, y, w * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (s.rain > 0) { ctx.fillStyle = rgb([34, 40, 52], s.rain * 0.45); ctx.fillRect(0, 0, W, hor); }

    // błyskawica w deszczu
    const flashPhase = (time % 6800) / 6800;
    const flash = s.rain > 0.6 && !reduce && flashPhase < 0.03 ? (1 - flashPhase / 0.03) * s.rain : 0;
    if (flash > 0) {
      ctx.fillStyle = `rgba(220,228,255,${0.28 * flash})`; ctx.fillRect(0, 0, W, hor);
      ctx.strokeStyle = `rgba(240,244,255,${0.9 * flash})`; ctx.lineWidth = 1.6; ctx.beginPath();
      let bx = W * 0.32, by = 0; ctx.moveTo(bx, by);
      for (let i = 0; i < 9; i++) { bx += (winSeed[i] - 0.5) * 40; by += hor * 0.075; ctx.lineTo(bx, by); }
      ctx.stroke();
    }

    // panorama Gdyni (lewa strona, za mgłą)
    const haze = Math.min(1, 0.35 + s.fog * 0.5);
    const skyCol = mixC(mixC(s.hor, dark, 0.45), s.hor, haze * 0.5);
    const skyN = mixC(skyCol, [6, 9, 18], s.night * 0.85);
    ctx.fillStyle = rgb(skyN);
    for (const b of skyline) ctx.fillRect(b[0] * W, hor - b[2] * H, b[1] * W, b[2] * H);
    if (s.night > 0.3) {
      ctx.fillStyle = `rgba(255,214,150,${0.65 * s.night})`;
      for (const b of skyline) for (let k = 0; k < 3; k++) if (winSeed[(b[3] * 97 + k * 13) | 0] < s.lit) ctx.fillRect((b[0] + b[1] * (0.2 + k * 0.25)) * W, hor - b[2] * H * (0.3 + k * 0.2), 1.5, 1.5);
    }

    // Kępa Redłowska: klif z linią drzew po prawej
    const kx = W * (mobile ? 0.72 : 0.8), kTop = hor - H * (mobile ? 0.1 : 0.14);
    const kCol = mixC(mixC(mixC([46, 62, 48], s.hor, 0.25), dark, 1 - s.light), s.hor, s.fog * 0.35);
    ctx.fillStyle = rgb(kCol);
    ctx.beginPath(); ctx.moveTo(kx - W * 0.06, hor);
    ctx.bezierCurveTo(kx, hor - H * 0.02, kx + W * 0.02, kTop + H * 0.02, kx + W * 0.07, kTop);
    ctx.lineTo(W, kTop - H * 0.01); ctx.lineTo(W, hor); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 26; i++) { const tx2 = kx + W * 0.05 + i * (W - kx) / 22; const r2 = 6 + winSeed[i] * 9; ctx.beginPath(); ctx.arc(tx2, kTop - H * 0.005 + winSeed[i + 30] * 4, r2, 0, Math.PI * 2); ctx.fill(); }
    // jasna ściana klifu (piasek) w dzień
    ctx.fillStyle = rgb(mixC([196, 170, 130], dark, 1 - s.light), 0.55);
    ctx.beginPath(); ctx.moveTo(kx - W * 0.03, hor); ctx.bezierCurveTo(kx + W * 0.01, hor - H * 0.02, kx + W * 0.03, kTop + H * 0.03, kx + W * 0.07, kTop + H * 0.012); ctx.lineTo(kx + W * 0.08, hor); ctx.closePath(); ctx.fill();

    // wieża
    const tw = Math.min(W * (mobile ? 0.36 : 0.19), 340);
    const th = Math.min(H * (mobile ? 0.37 : 0.58), tw * 3.2);
    const tx = mobile ? W * 0.46 - tw / 2 : W * 0.6 - tw / 2;
    drawTower(s, tx, hor - th, tw, th, hor, dark);

    // mgła
    if (s.fog > 0) {
      const fg = ctx.createLinearGradient(0, hor - H * 0.25, 0, hor + 10);
      const fc = mixC(s.hor, [235, 230, 225], 0.5);
      fg.addColorStop(0, rgb(fc, 0)); fg.addColorStop(1, rgb(fc, 0.55 * s.fog));
      ctx.fillStyle = fg; ctx.fillRect(0, hor - H * 0.25, W, H * 0.25 + 10);
    }

    // brzeg: cienka linia, wygaszona pod tekstem po lewej
    const shore = ctx.createLinearGradient(0, 0, W, 0);
    const shoreCol = mixC(mixC(s.sea, dark, 0.6), [4, 6, 12], s.night);
    shore.addColorStop(0, rgb(shoreCol, 0)); shore.addColorStop(0.45, rgb(shoreCol, 0)); shore.addColorStop(0.58, rgb(shoreCol, 1)); shore.addColorStop(1, rgb(shoreCol, 1));
    if (!mobile) { ctx.fillStyle = shore; ctx.fillRect(0, hor, W, 2); }

    // morze
    const sg2 = ctx.createLinearGradient(0, hor, 0, H);
    sg2.addColorStop(0, rgb(mixC(s.sea, s.hor, 0.35))); sg2.addColorStop(1, rgb(mixC(s.sea, [3, 6, 14], 0.55)));
    ctx.fillStyle = sg2; ctx.fillRect(0, hor + 2, W, H - hor);
    // odbicie: cienkie paski, malejąca widoczność w głąb
    const seaH = H - hor - 2, step = mobile ? 2 : 1;
    for (let y = 0; y < seaH; y += step) {
      const srcY = hor - y * 1.04 - 1;
      if (srcY < 0) break;
      const amp = (0.6 + y * 0.02) * (1 + s.rain * 1.8);
      const off = Math.sin(y * 0.16 + time * 0.0022) * amp + Math.sin(y * 0.05 - time * 0.001) * amp * 0.6;
      ctx.globalAlpha = (0.46 - s.rain * 0.14) * (1 - y / seaH * 0.75);
      ctx.drawImage(canvas, 0, srcY * DPR, W * DPR, step * DPR, off, hor + 2 + y, W, step);
    }
    ctx.globalAlpha = 1;
    // połysk słońca na wodzie
    if (s.sun > -0.1 && s.light > 0.3) {
      const sx = W * s.sunX;
      for (let i = 0; i < 26; i++) {
        const y = hor + 8 + i * i * 0.5; if (y > H) break;
        const w = 30 + i * 6 + Math.sin(time * 0.003 + i) * 8;
        ctx.fillStyle = rgb(mixC([255, 250, 230], [255, 170, 90], s.warm), 0.22 * (1 - i / 26) * (1 - s.cloud * 0.6));
        ctx.fillRect(sx - w / 2, y, w, 1.5);
      }
    }
    // molo w Orłowie: pomost wchodzący w wodę
    const py = hor + seaH * 0.16, px0 = W * (mobile ? 0.62 : 0.74), px1 = W * (mobile ? 0.98 : 0.96);
    const deck = mixC(mixC([150, 128, 98], dark, 1 - s.light * 0.9), s.hor, s.fog * 0.3);
    ctx.fillStyle = rgb(deck); ctx.fillRect(px0, py, px1 - px0, 3);
    ctx.fillStyle = rgb(mixC(deck, dark, 0.4));
    for (let x = px0; x < px1; x += 14) ctx.fillRect(x, py + 3, 1.5, 7);
    ctx.fillRect(px0 - 4, py - 6, 26, 6);
    if (s.night > 0.25) for (let x = px0 + 8; x < px1; x += 34) {
      const lg = ctx.createRadialGradient(x, py - 5, 0, x, py - 5, 14);
      lg.addColorStop(0, `rgba(255,205,140,${0.85 * s.night})`); lg.addColorStop(1, 'rgba(255,205,140,0)');
      ctx.fillStyle = lg; ctx.fillRect(x - 14, py - 19, 28, 28);
      ctx.fillStyle = `rgba(255,200,130,${0.25 * s.night})`; ctx.fillRect(x - 0.75, py + 4, 1.5, 22);
    }
    // statki nocą
    if (s.night > 0.5) for (const sh of ships) {
      const x = ((sh[0] + time * 0.000006 * sh[2]) % 1) * W * (mobile ? 1 : 0.5), y = hor + 6 + sh[1] * seaH * 0.4;
      ctx.fillStyle = `rgba(255,226,170,${(s.night - 0.5) * 1.6})`; ctx.fillRect(x, y, 2, 2); ctx.fillRect(x + 7, y + 1, 1.5, 1.5);
      ctx.fillStyle = `rgba(255,210,150,${(s.night - 0.5) * 0.5})`; ctx.fillRect(x + 0.5, y + 3, 1, 10);
    }
    // deszcz
    if (s.rain > 0.02) {
      ctx.strokeStyle = `rgba(200,212,230,${0.35 * s.rain})`; ctx.lineWidth = 1; ctx.beginPath();
      const n = Math.round(drops.length * s.rain * (mobile ? 0.5 : 1));
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        const x = (d[0] * W + time * 0.05 * d[2]) % W, y = (d[1] * H + time * 0.9 * d[2]) % H;
        ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14 * d[2]);
      }
      ctx.stroke();
    }
    if (flash > 0) { ctx.fillStyle = `rgba(220,228,255,${0.12 * flash})`; ctx.fillRect(0, hor, W, H - hor); }
  }

  function drawTower(s, x, y, w, h, hor, dark) {
    const crown = h * 0.1, sw = w * 0.2;
    const facade = mixC(mixC([226, 220, 208], s.hor, 0.22), [26, 30, 40], 1 - s.light);
    const fin = mixC(facade, [255, 255, 255], 0.18 * s.light);
    const shadeSide = s.sunX < 0.5 ? 0.18 : 0.42;

    // niskie skrzydło z pasmowym przeszkleniem i ciepłym lobby
    const ww = w * 1.4, wh = h * 0.16, wx = x - ww + w * 0.12;
    ctx.fillStyle = rgb(mixC(facade, dark, 0.12)); ctx.fillRect(wx, hor - wh, ww, wh);
    for (let r = 0; r < 2; r++) {
      const ry = hor - wh + wh * (0.18 + r * 0.38), rh = wh * 0.24;
      const rg = ctx.createLinearGradient(wx, 0, wx + ww, 0);
      rg.addColorStop(0, rgb(mixC(s.mid, dark, 0.4 + 0.4 * (1 - s.light)))); rg.addColorStop(1, rgb(mixC(s.hor, dark, 0.5 + 0.3 * (1 - s.light))));
      ctx.fillStyle = rg; ctx.fillRect(wx + 6, ry, ww - 12, rh);
      if (s.lit > 0.05) { ctx.fillStyle = `rgba(255,214,160,${Math.min(0.55, s.lit) * (r ? 1 : 0.6)})`; ctx.fillRect(wx + ww * (r ? 0.1 : 0.45), ry + 1, ww * (r ? 0.32 : 0.24), rh - 2); }
    }
    const lobby = ctx.createLinearGradient(0, hor - wh * 0.3, 0, hor);
    lobby.addColorStop(0, `rgba(255,200,130,${0.15 + 0.5 * s.night})`); lobby.addColorStop(1, `rgba(255,170,90,${0.25 + 0.55 * s.night})`);
    ctx.fillStyle = lobby; ctx.fillRect(x - w * 0.1, hor - wh * 0.3, w * 0.5, wh * 0.3);

    // boczna ściana (bryła)
    ctx.fillStyle = rgb(mixC(facade, dark, shadeSide)); ctx.beginPath();
    ctx.moveTo(x + w, y + crown); ctx.lineTo(x + w + sw, y + crown + sw * 0.25); ctx.lineTo(x + w + sw, hor); ctx.lineTo(x + w, hor); ctx.closePath(); ctx.fill();
    const fh = (h - crown) / FLOORS;
    for (let f = 0; f < FLOORS; f++) for (let c = 0; c < SIDE; c++) {
      const idx = FLOORS * COLS + f * SIDE + c;
      const sx0 = x + w + 4 + c * (sw - 6) / SIDE, sy0 = y + crown + sw * 0.25 * (c + 0.5) / SIDE + f * fh;
      const lit = winSeed[idx] < s.lit;
      ctx.fillStyle = lit ? `rgba(255,214,160,${0.3 + 0.4 * s.night})` : rgb(mixC(s.mid, dark, 0.55 + 0.35 * (1 - s.light)));
      ctx.fillRect(sx0, sy0 + 2, (sw - 6) / SIDE - 3, fh - 4);
    }

    // korona: dwa uskoki + pergola tarasu na dachu
    ctx.fillStyle = rgb(mixC(facade, dark, 0.08)); ctx.fillRect(x + w * 0.06, y + crown * 0.45, w * 0.88, crown * 0.55);
    ctx.fillStyle = rgb(mixC(facade, dark, 0.16)); ctx.fillRect(x + w * 0.16, y + crown * 0.05, w * 0.68, crown * 0.4);
    ctx.fillStyle = rgb(fin, 0.9);
    for (let i = 0; i <= 8; i++) ctx.fillRect(x + w * 0.16 + i * w * 0.68 / 8, y - crown * 0.25, 1.5, crown * 0.3);
    ctx.fillRect(x + w * 0.16, y - crown * 0.25, w * 0.68, 2);
    if (s.night > 0.3) { ctx.fillStyle = `rgba(255,210,150,${0.5 * s.night})`; ctx.fillRect(x + w * 0.18, y + crown * 0.1, w * 0.64, crown * 0.28); }
    const beacon = (Math.sin(time * 0.004) + 1) / 2;
    if (s.night > 0.3) {
      const bg = ctx.createRadialGradient(x + w / 2, y - crown * 0.4, 0, x + w / 2, y - crown * 0.4, 46);
      bg.addColorStop(0, `rgba(255,190,110,${0.8 * s.night * (0.4 + 0.6 * beacon)})`); bg.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = bg; ctx.fillRect(x + w / 2 - 46, y - crown * 0.4 - 46, 92, 92);
    }
    ctx.fillStyle = s.night > 0.3 ? `rgba(255,214,150,${0.6 + 0.4 * beacon})` : rgb(fin);
    ctx.fillRect(x + w / 2 - 2, y - crown * 0.55, 4, crown * 0.32);

    // fasada frontowa: szklana ściana
    const pad = w * 0.04, gx = x + pad, gy = y + crown, gwid = w - pad * 2, ghei = h - crown;
    ctx.fillStyle = rgb(facade); ctx.fillRect(x, gy, w, ghei);
    const gw = gwid / COLS, gh = ghei / FLOORS;
    const refl = ctx.createLinearGradient(gx, gy, gx + gwid * 0.45, gy + ghei);
    refl.addColorStop(0, rgb(mixC(mixC(s.top, s.mid, 0.4), dark, 0.22 + 0.5 * (1 - s.light))));
    refl.addColorStop(0.55, rgb(mixC(s.mid, dark, 0.32 + 0.45 * (1 - s.light))));
    refl.addColorStop(1, rgb(mixC(s.hor, dark, 0.42 + 0.4 * (1 - s.light))));
    ctx.fillStyle = refl; ctx.fillRect(gx, gy, gwid, ghei);
    if (s.sun > 0 && s.light > 0.4) {
      const bandX = gx + gwid * (1 - s.sunX);
      const bg2 = ctx.createLinearGradient(bandX - gwid * 0.35, gy, bandX + gwid * 0.35, gy + ghei * 0.6);
      const c2 = mixC([255, 250, 235], [255, 190, 120], s.warm);
      bg2.addColorStop(0, rgb(c2, 0)); bg2.addColorStop(0.5, rgb(c2, 0.34 * s.light * (1 - s.cloud * 0.6))); bg2.addColorStop(1, rgb(c2, 0));
      ctx.fillStyle = bg2; ctx.fillRect(gx, gy, gwid, ghei);
    }
    // mokra elewacja w deszczu
    if (s.rain > 0.1) {
      const wet = ctx.createLinearGradient(0, gy, 0, gy + ghei);
      wet.addColorStop(0, `rgba(170,190,220,${0.05 * s.rain})`); wet.addColorStop(1, `rgba(170,190,220,${0.16 * s.rain})`);
      ctx.fillStyle = wet; ctx.fillRect(gx, gy, gwid, ghei);
    }
    // zapalone wnętrza: zasłony, lampy, różna jasność
    for (let f = 0; f < FLOORS; f++) for (let c = 0; c < COLS; c++) {
      const idx = f * COLS + c;
      if (winSeed[idx] >= s.lit) continue;
      const px = gx + c * gw, py = gy + f * gh;
      const k = winSeed[(idx * 7 + 3) % winSeed.length];
      const a = (0.32 + 0.5 * s.night) * (0.45 + 0.55 * k);
      const lg = ctx.createLinearGradient(0, py, 0, py + gh);
      lg.addColorStop(0, `rgba(255,${(226 + k * 14) | 0},${(180 + k * 30) | 0},${a})`);
      lg.addColorStop(1, `rgba(236,${(176 + k * 20) | 0},${(120 + k * 20) | 0},${a * 0.5})`);
      ctx.fillStyle = lg; ctx.fillRect(px + 2, py + 2.5, gw - 4, gh - 5);
      if (k > 0.6) { ctx.fillStyle = `rgba(30,22,14,${0.35 * a})`; ctx.fillRect(px + 2, py + 2.5, (gw - 4) * 0.28, gh - 5); }
      if (k < 0.2) { ctx.fillStyle = `rgba(255,240,210,${a})`; ctx.fillRect(px + gw * 0.62, py + gh * 0.32, 2, 2); }
    }
    // stropy i szprosy
    ctx.fillStyle = rgb(fin, 0.95);
    for (let f = 0; f <= FLOORS; f++) ctx.fillRect(x, gy + f * gh - 1.1, w, 2.2);
    ctx.fillStyle = rgb(mixC(fin, dark, 0.35), 0.75);
    for (let c = 1; c < COLS; c++) ctx.fillRect(gx + c * gw - 0.6, gy, 1.2, ghei);
    // tarasy od 12. piętra: wysunięte płyty po stronie zachodniej + szklane balustrady
    // narożne pilastry
    ctx.fillStyle = rgb(fin); ctx.fillRect(x, gy, pad, ghei); ctx.fillRect(x + w - pad, gy, pad, ghei);
    // modelowanie światłem — tylko w obrysie bryły (bez prostokąta wokół wieży)
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, gy, w, ghei);
    ctx.moveTo(x + w, gy); ctx.lineTo(x + w + sw, gy + sw * 0.25); ctx.lineTo(x + w + sw, hor); ctx.lineTo(x + w, hor); ctx.closePath();
    ctx.rect(x + w * 0.06, y + crown * 0.45, w * 0.88, crown * 0.55);
    ctx.rect(x + w * 0.16, y + crown * 0.05, w * 0.68, crown * 0.4);
    ctx.clip();
    const side = ctx.createLinearGradient(x, 0, x + w, 0);
    const lightLeft = s.sunX < 0.5;
    side.addColorStop(0, `rgba(0,0,0,${lightLeft ? 0 : 0.22})`); side.addColorStop(1, `rgba(0,0,0,${lightLeft ? 0.22 : 0})`);
    ctx.fillStyle = side; ctx.fillRect(x, y, w, h);
    if (s.warm > 0.5 && s.sun > -0.1) { ctx.fillStyle = `rgba(255,150,70,${0.12 * s.warm})`; ctx.fillRect(x, y, w + sw, h); }
    ctx.restore();
    // tarasy od 12. piętra co 3 kondygnacje: głębokie płyty, przyciemnione szkło, poręcz
    const tExt = w * 0.13;
    for (let f = 0; f < FLOORS; f++) {
      const fromBottom = FLOORS - 1 - f;
      if (fromBottom < TERRACE_FROM || fromBottom % 3) continue;
      const slabY = gy + (f + 1) * gh, bh = gh * 0.55;
      ctx.fillStyle = rgb(mixC(mixC(s.mid, s.top, 0.3), dark, 0.25), 0.55); ctx.fillRect(x - tExt, slabY - bh, tExt, bh);
      ctx.fillStyle = rgb(mixC(fin, [255, 255, 255], 0.2)); ctx.fillRect(x - tExt, slabY - bh - 1, tExt, 1.6);
      ctx.fillStyle = rgb(fin); ctx.fillRect(x - tExt - 2, slabY - 2, tExt + 2, 4);
      ctx.fillStyle = rgb(mixC(fin, dark, 0.45)); ctx.fillRect(x - tExt - 2, slabY + 2, tExt + 2, 2);
      ctx.fillRect(x - tExt, slabY - bh, 1.4, bh);
    }
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
  const fstate = { rooms: 'all', onlyFree: true, all: false };
  const isPhone = () => window.innerWidth <= 640;
  let current = null;
  const tbody = $('#unitRows');

  function renderUnits() {
    const list = UNITS.filter(u => (fstate.rooms === 'all' || (fstate.rooms === '4' ? u.rooms >= 4 : u.rooms === Number(fstate.rooms))) && (!fstate.onlyFree || u.status === 'free'));
    const shown = (isPhone() && !fstate.all) ? list.slice(0, 8) : list;
    const more = document.getElementById('moreUnits');
    more.hidden = shown.length === list.length;
    more.textContent = `Pokaż wszystkie (${list.length})`;
    tbody.innerHTML = shown.map(u => `<tr data-id="${u.id}"${current && current.id === u.id ? ' class="is-on"' : ''}>
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
  tbody.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    showUnit(UNITS.find(u => u.id === tr.dataset.id));
    if (window.innerWidth <= 1000) $('#plan').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  $('#moreUnits').addEventListener('click', () => { fstate.all = true; renderUnits(); });
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
