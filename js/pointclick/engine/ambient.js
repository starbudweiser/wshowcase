import { occlude } from './night.js';
/* Décor vivant : zones du décor animées par images (eau, roue, herbes, animaux), roue à aubes en 3D, oiseaux, poissons, fumée, dragons, objet en orbite.
   Chaque scène déclare `ambient: [...]`. Tout est dessiné par-dessus le décor, avant les personnages. */

const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

/* Eau d'une rivière lue dans le décor (pour les sauts de poissons) : dans la zone de recherche `roi` [x0, y0, x1, y1], pixels bleutés
   (ni verts, ni neige claire), fermeture puis ouverture morphologiques 3×3, plus grande nappe d'un seul tenant. Pour chaque point d'eau :
   la colonne d'eau qui le contient (hauteur, position relative) et le test de l'éclaboussure (ellipse 11·s × 3,8·s entièrement dans l'eau).
   Départs : colonne haute (≥ 16·s), près du milieu ; retombées : colonne ≥ 11·s, moins centrées. s = k × perspective de la scène. */
function waterMap(g, roi, k) {
  const [x0, y0, x1, y1] = roi, w = x1 - x0, h = y1 - y0, N = w * h;
  const cv = document.createElement('canvas'); cv.width = 480; cv.height = 270; const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(g.bg, 0, 0, 480, 270); const px = cx.getImageData(x0, y0, w, h).data;
  let m = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const r = px[i * 4], gr = px[i * 4 + 1], b = px[i * 4 + 2]; m[i] = b - r >= 8 && b >= gr - 6 && Math.max(r, gr, b) <= 175 ? 1 : 0; }
  const morph = (src, grow) => {                        /* dilatation (grow) ou érosion 3×3, hors zone = sec */
    const o = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let any = 0, all = 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy, v = X >= 0 && Y >= 0 && X < w && Y < h ? src[Y * w + X] : 0; any |= v; all &= v; }
      o[y * w + x] = grow ? any : all;
    }
    return o;
  };
  m = morph(morph(morph(morph(m, 1), 1), 0), 0);       /* fermeture : bouche l'écume et les reflets */
  m = morph(morph(m, 0), 1);                            /* ouverture : enlève les miettes */
  const lab = new Int32Array(N); let best = 0, bestN = 0, id = 0;   /* plus grande nappe (4-connexité) */
  for (let i = 0; i < N; i++) {
    if (!m[i] || lab[i]) continue; id++; let n = 0; const st = [i]; lab[i] = id;
    while (st.length) { const q = st.pop(), x = q % w, y = (q / w) | 0; n++; for (const [X, Y] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const j = Y * w + X; if (m[j] && !lab[j]) { lab[j] = id; st.push(j); } } }
    if (n > bestN) { bestN = n; best = id; }
  }
  for (let i = 0; i < N; i++) m[i] = lab[i] === best && best ? 1 : 0;
  const wet = (x, y) => { x -= x0; y -= y0; return x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1; };
  const top = new Int16Array(N), bot = new Int16Array(N);
  for (let x = 0; x < w; x++) for (let y = 0; y < h;) { if (!m[y * w + x]) { y++; continue; } let e = y; while (e < h && m[e * w + x]) e++; for (let q = y; q < e; q++) { top[q * w + x] = y; bot[q * w + x] = e - 1; } y = e; }
  const land = new Uint8Array(N), starts = [], A = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8), Math.sin(i * Math.PI / 8)]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!m[i]) continue;
    const gx = x + x0, gy = y + y0, s = k * g.persp(gy), run = bot[i] - top[i] + 1, rel = 1 - Math.abs((y - top[i]) - (bot[i] - y)) / run;
    if (run < 11 * s || rel < 0.3) continue;
    if (!A.every(([c, d]) => wet(Math.round(gx + c * 11 * s), Math.round(gy + d * 3.8 * s)))) continue;
    land[i] = 1; if (run >= 16 * s && rel >= 0.5) starts.push([gx, gy]);
  }
  return { wet, land: (x, y) => { x -= x0; y -= y0; return x >= 0 && y >= 0 && x < w && y < h && land[y * w + x] === 1; }, starts };
}

const KINDS = {
  /* objet en orbite : un sprite minuscule qui tourne lentement dans le ciel ; cliquable */
  orbit(o) {
    const id = o.id || 'satellite'; let pos = null;
    return {
      id,
      hit(x, y) { return !!pos && Math.abs(x - pos[0]) < pos[2] / 2 + 3 && Math.abs(y - pos[1]) < pos[2] / 2 + 3; },
      draw(g, c, t) {
        const im = g.spr(o.spr); if (!im) return; const per = o.period ?? 70, p = ((t + (o.offset ?? 0)) % per) / per, s = o.scale ?? 0.3;
        const x = (o.x0 ?? 20) + p * ((o.x1 ?? 460) - (o.x0 ?? 20)), y = (o.y ?? 24) + Math.sin(p * Math.PI) * -(o.arc ?? 10), w = im.width * s, h = im.height * s;
        pos = [x, y, Math.max(w, h)];
        c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(t * (o.spin ?? 1.2)); c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); c.restore();
      }
    };
  },
  /* zone du décor animée par images (sprites calculés par tools/gen_regions.py) : rivière, roue, mammouth, flammes, herbes */
  frames(o) {
    return {
      draw(g, c, t) {
        const A = g.animIdx && g.animIdx[o.id]; if (!A) return;
        const seq = o.seq || [-1, ...Array.from({ length: A.n }, (_, i) => i), ...Array.from({ length: Math.max(0, A.n - 2) }, (_, i) => A.n - 2 - i)];
        /* fondu enchaîné entre deux images successives : le mouvement devient continu même avec peu d'images */
        const fp = (t + (o.offset || 0)) * (o.fps || 3), k = Math.floor(fp), f = o.fade === false ? 1 : fp - k, ease = f * f * (3 - 2 * f), i = seq[k % seq.length], j = seq[(k + 1) % seq.length];
        const img = n => (n >= 0 && n < A.n ? g.animImg(o.id, n) : null), a = img(i), b = img(j);
        if (b) { if (a) c.drawImage(a, A.x, A.y); c.save(); c.globalAlpha = ease; c.drawImage(b, A.x, A.y); c.restore(); }
        else if (a) { c.save(); c.globalAlpha = 1 - ease; c.drawImage(a, A.x, A.y); c.restore(); }
      }
    };
  },
  /* roue à aubes calculée en 3D : deux jantes, rayons, moyeu, pales qui dépassent ; le plan de la roue est tourné de φ autour de la verticale
     (φ déduit de l'ellipse du décor : cos φ = rx / ry), projection orthographique, pièces triées en profondeur et éclairées selon leur orientation.
     Le fond derrière la roue est assombri (mur dans l'ombre) ; `front` = zone du décor redessinée devant (barrière). */
  wheel3d(o) {
    const R = o.ry, phi = Math.acos(Math.min(1, o.rx / o.ry)), cp = Math.cos(phi), sp = Math.sin(phi) * (o.side ?? -1), Wd = o.width ?? R * 0.32, NS = o.spokes ?? 12, NP = o.paddles ?? 16;
    const P = (r, th, w) => { const u = r * Math.cos(th), v = r * Math.sin(th); return [o.cx + u * cp + w * sp, o.cy - v, -u * Math.sin(phi) * (o.side ?? -1) + w * cp]; };
    const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
    const WOOD = o.wood || '#8a5a2c', DARK = '#24140a';
    return {
      draw(g, c, t) {
        const a0 = t * (o.speed ?? 0.55) * (o.dir ?? 1);
        c.save(); c.lineCap = c.lineJoin = 'round';
        /* fond : le mur derrière la roue, dans l'ombre */
        const bg = c.createRadialGradient(o.cx, o.cy, R * 0.2, o.cx, o.cy, R * 1.15); bg.addColorStop(0, '#2c1c10'); bg.addColorStop(1, '#3e2814');
        c.fillStyle = bg; c.beginPath(); c.ellipse(o.cx + Wd * sp * 0.5, o.cy, o.rx + Wd * Math.abs(sp) * 0.5 + 1.5, R + 1.5, 0, 0, 7); c.fill();
        const ring = (w, col, lw) => { c.strokeStyle = DARK; c.lineWidth = lw + 1.6; c.beginPath(); for (let i = 0; i <= 48; i++) { const p = P(R, i / 48 * Math.PI * 2, w); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); };
        const spokes = (w, k) => { for (let i = 0; i < NS; i++) { const th = a0 + i * Math.PI * 2 / NS, p0 = P(R * 0.14, th, w), p1 = P(R * 0.97, th, w); c.strokeStyle = DARK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.strokeStyle = shade(WOOD, k * (0.85 + 0.25 * Math.cos(th - 2.2))); c.lineWidth = 1.3; c.stroke(); } };
        /* arrière : jante et rayons du fond, plus sombres */
        ring(-Wd / 2, shade(WOOD, 0.55), 2.4); spokes(-Wd / 2, 0.6);
        /* pales, de la plus lointaine à la plus proche */
        const pads = []; for (let i = 0; i < NP; i++) { const th = a0 + (i + 0.5) * Math.PI * 2 / NP, q = [P(R * 0.8, th, -Wd / 2), P(R * 1.1, th, -Wd / 2), P(R * 1.1, th, Wd / 2), P(R * 0.8, th, Wd / 2)]; pads.push({ q, z: q.reduce((s, p) => s + p[2], 0) / 4, th }); }
        pads.sort((x, y) => y.z - x.z);
        for (const p of pads) { const k = 0.55 + 0.5 * Math.abs(Math.sin(p.th + 0.6)) * (p.z < 0 ? 1 : 0.75); c.fillStyle = shade(WOOD, k); c.strokeStyle = DARK; c.lineWidth = 1; c.beginPath(); p.q.forEach((v, i) => (i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1]))); c.closePath(); c.fill(); c.stroke(); }
        /* avant : rayons et jante, moyeu */
        spokes(Wd / 2, 1); ring(Wd / 2, shade(WOOD, 1.08), 2.8);
        const h = P(0, 0, Wd / 2 + 1); c.fillStyle = DARK; c.beginPath(); c.ellipse(h[0], h[1], R * 0.16 * cp + 1, R * 0.16 + 1, 0, 0, 7); c.fill(); c.fillStyle = shade(WOOD, 0.9); c.beginPath(); c.ellipse(h[0], h[1], R * 0.11 * cp, R * 0.11, 0, 0, 7); c.fill();
        c.fillStyle = '#7d7d82'; c.beginPath(); c.ellipse(h[0], h[1], R * 0.045 * cp + 0.5, R * 0.045 + 0.5, 0, 0, 7); c.fill();
        c.restore();
        /* ce qui est devant la roue dans le décor (barrière, buissons) est redessiné par-dessus */
        if (o.front && g.bg) for (const f of o.front) { c.save(); c.beginPath(); f.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); c.drawImage(g.bg, 0, 0, 480, 270); c.restore(); }
      }
    };
  },
  /* oiseaux en sprites : 3 poses d'ailes (bird.1 à bird.3), qui traversent le ciel */
  flock(o) {
    const n = o.n ?? 4, R = rnd(o.seed || 5), bs = Array.from({ length: n }, () => ({ y: (o.y0 ?? 18) + R() * ((o.y1 ?? 70) - (o.y0 ?? 18)), sp: (o.speed ?? 14) * (0.8 + R() * 0.5), off: R() * 600, ph: R() * 6, dir: R() > 0.5 ? 1 : -1, sc: 0.5 + R() * 0.4 }));
    let t0 = null;
    return {
      draw(g, c, t) {
        /* la nuit, ils filent se coucher hors de l'écran (3 fois plus vite) et ne reviennent qu'après le réveil, en entrant par le bord */
        const dt = t0 === null ? 0 : Math.max(0, Math.min(0.2, t - t0)); t0 = t; const night = !!g.night && g.night.st !== 'wake';
        bs.forEach(b => {
          b.p = (b.p ?? b.off) + dt * b.sp * (night ? 3 : 1);
          const x = (b.p % 560) - 40, off = x < -24 || x > 504;
          if (off) b.hide = night; if (b.hide) return;
          const im = g.spr('bird.' + ([1, 2, 3, 2][Math.floor(t * (night ? 12 : 7) + b.ph) % 4])); if (!im) return;
          const X = b.dir > 0 ? x : 480 - x, Y = Math.round(b.y + Math.sin(t * 0.8 + b.ph) * 4), w = im.width * b.sc, h = im.height * b.sc;
          c.save(); c.translate(Math.round(X), Y); if (b.dir < 0) c.scale(-1, 1); c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); c.restore();
        });
      }
    };
  },
  /* poissons qui sautent : de temps en temps, un saumon jaillit en pleine rivière, décrit un arc en suivant sa trajectoire et replonge ;
     ce qui est sous la surface est caché, éclaboussures et ronds dans l'eau au départ et à l'arrivée. Départ et retombée sont tirés dans
     l'eau lue sur le décor (`water` : zone de recherche, `k` : échelle × perspective), au milieu du courant, jamais contre les rochers. */
  fish(o) {
    const R = rnd(o.seed || 21), D = 0.95, jumps = [];
    let next = 1.5 + R() * 3, wm = null;
    const pick = g => {
      for (let n = 0; n < 40 && wm.starts.length; n++) {
        const [x, y] = wm.starts[(R() * wm.starts.length) | 0], s = (o.k ?? 1) * g.persp(y), dir = R() > 0.5 ? 1 : -1, L = 14 + R() * 8, H = 11 + R() * 7;
        if (!wm.land(Math.round(x + dir * L * s), y)) continue;
        let ok = true; for (let f = 0; f <= 11; f++) if (!wm.wet(Math.round(x + dir * L * s * f / 11), y)) { ok = false; break; }
        if (ok) return { x, y, s, dir, L, H };
      }
      return null;
    };
    const splash = (c, x, y, s, k) => {
      /* rond dans l'eau qui s'élargit, puis gouttes qui retombent */
      const a = 1 - k; if (a <= 0) return;
      c.strokeStyle = `rgba(235,245,255,${(0.8 * a).toFixed(2)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, (2 + k * 7) * s, (0.8 + k * 2) * s, 0, 0, 7); c.stroke();
      c.fillStyle = `rgba(245,250,255,${(0.95 * a).toFixed(2)})`;
      for (let i = 0; i < 5; i++) { const vx = (i - 2) * 2.2 * s, h = (5 + (i % 2) * 3) * s, px = x + vx * k * 1.6, py = y - h * 4 * k * (1 - k); c.fillRect(Math.round(px), Math.round(py), 1, 1); }
    };
    return {
      draw(g, c, t) {
        const im = g.spr('fish');
        if (g.night && g.night.st !== 'wake') next = Math.max(next, t + 2 + R() * 3);   /* la nuit, les poissons dorment : plus de sauts */
        if (!wm && g.bg && g.bg.width) wm = waterMap(g, o.water, o.k ?? 1);
        if (t > next && wm) { const j = pick(g); if (j) jumps.push({ t0: t, ...j }); next = t + (o.every ?? 4) + R() * (o.spread ?? 5); }
        for (let i = jumps.length - 1; i >= 0; i--) {
          const j = jumps[i], k = (t - j.t0) / D, s = j.s;
          if (k > 1.8) { jumps.splice(i, 1); continue; }
          splash(c, j.x, j.y, s, Math.min(1, k / 0.8));                                 /* départ */
          if (k > 1) splash(c, j.x + j.dir * j.L * s, j.y, s, (k - 1) / 0.8);          /* arrivée */
          if (k > 1 || !im) continue;
          const x = j.x + j.dir * j.L * s * k, y = j.y - 4 * j.H * s * k * (1 - k);
          const ang = Math.atan2(-4 * j.H * (1 - 2 * k), j.L);                           /* le nez suit la trajectoire */
          const w = im.width * s * (o.scale ?? 1.4), h = im.height * s * (o.scale ?? 1.4);
          c.save(); c.beginPath(); c.rect(0, 0, 480, j.y + 0.5); c.clip();             /* sous la surface : caché */
          c.translate(Math.round(x), Math.round(y)); c.scale(j.dir, 1); c.rotate(ang - 0.35); c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); c.restore();
        }
      }
    };
  },
  /* fumée en sprites : volutes (puff) qui montent, grossissent et s'effacent */
  puffs(o) {
    const n = o.n ?? 7;
    return {
      draw(g, c, t) {
        const im = g.spr('puff'); if (!im) return;
        for (let i = 0; i < n; i++) {
          const ph = (t * (o.speed ?? 0.25) + i / n) % 1, s = (o.s0 ?? 0.35) + ph * (o.s1 ?? 1.1), w = im.width * s, h = im.height * s, x = o.x + Math.sin(ph * 5 + i * 2) * 2 + ph * (o.wind ?? 10), y = o.y - ph * (o.h ?? 30);
          c.globalAlpha = 0.75 * (1 - ph) * Math.min(1, ph * 6); c.drawImage(im, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
        }
        c.globalAlpha = 1;
      }
    };
  },
  /* dragon dans le ciel, toujours derrière le décor proche (falaise, arbres, toits : voir night.js `occlude`) ; cliquable.
     modes de vol : cross (traversée), glide (plané, ailes tenues), swoop (piqué puis remontée), circle (tourne au loin) ; `fire` = souffle de flammes, `haze` = lointain voilé */
  dragon(o) {
    if (o.mode === 'perch') return perch(o);
    const period = o.period ?? 34, y0 = o.y ?? 26, id = o.id || 'dragon', mode = o.mode || 'cross';
    let pos = null;
    return {
      id,
      hit(x, y) { return !!pos && x >= pos[0] - pos[2] / 2 && x <= pos[0] + pos[2] / 2 && y >= pos[1] - pos[3] && y <= pos[1]; },
      draw(g, c, t) {
        const tt = t + (o.offset ?? 6), cyc = (tt % period) / period, travel = o.travel ?? 0.7;
        if (cyc > travel) { pos = null; return; }
        const K = o.kind && g.spr(o.kind + '.up') ? o.kind + '.' : 'dragon.', base = g.spr(K + 'up'); if (!base) return;
        const p = cyc / travel, POSES = g.spr(K + 'mid1') ? [K + 'up', K + 'mid1', K + 'down', K + 'mid2'] : [K + 'up', K + 'up', K + 'down', K + 'down'];
        let sc = o.scale ?? 1, dirL = (o.dir ?? -1) < 0, xc, yc, tilt = 0, ff = tt * (o.flap ?? 4.2);
        if (mode === 'glide') ff = (tt % 7) < 1.8 ? ff : 3;                       /* quelques battements, puis ailes à plat */
        if (mode === 'circle') {
          const a = p * Math.PI * 2 * (o.turns ?? 1.25) + (o.phase ?? 0), sn = Math.sin(a); sc *= 0.7 + 0.3 * (sn * 0.5 + 0.5); dirL = sn > 0;
          xc = (o.cx ?? 240) + (o.r ?? 150) * Math.cos(a); yc = y0 + (o.ry ?? 16) * sn;
        } else {
          const w0 = base.width * sc, h0 = base.height * sc; xc = dirL ? 480 + w0 / 2 - p * (480 + w0) : -w0 / 2 + p * (480 + w0);
          yc = y0 + h0 / 2 + Math.sin(tt * 0.9) * 6 + p * (o.drop ?? 14);
          if (mode === 'swoop') { const A = o.amp ?? 30, k = Math.PI * 2 * (o.waves ?? 1); yc += A * Math.sin(p * k); tilt = Math.atan(A * k * Math.cos(p * k) / (480 + w0)) * (dirL ? -1 : 1); }
          else tilt = Math.sin(tt * 1.3) * 0.03 * (dirL ? -1 : 1);
        }
        const fi = Math.floor(ff) % 4, fe = ff - Math.floor(ff), im = g.spr(POSES[fi]), im2 = g.spr(POSES[(fi + 1) % 4]); if (!im) return;
        const w = im.width * sc, h = im.height * sc; pos = [xc, yc + h / 2, w, h];
        c.save(); if (o.haze) c.globalAlpha = 0.78; c.translate(Math.round(xc), Math.round(yc)); c.rotate(tilt); if (!dirL) c.scale(-1, 1);
        c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
        if (im2 && im2 !== im && !(mode === 'glide' && (tt % 7) >= 1.8)) { c.globalAlpha *= fe * fe * (3 - 2 * fe); c.drawImage(im2, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); }
        c.restore();
        /* souffle de flammes : particules déterministes qui partent de la gueule (à l'avant du dragon) */
        if (o.fire && p > 0.38 && p < 0.52) {
          const dir = dirL ? -1 : 1, mx = xc + dir * w * 0.46, my = yc - h * 0.06, k = Math.sin((p - 0.38) / 0.14 * Math.PI);
          c.save(); for (let i = 0; i < 22; i++) { const a = (tt * 2.6 + i / 22) % 1, r = (2 + a * 6) * Math.max(0.5, sc), px = mx + dir * (a * 44 * sc + 2), py = my + Math.sin(i * 1.7 + tt * 9) * a * 5 + a * 6; c.globalAlpha = k * (1 - a) * 0.85; c.fillStyle = a < 0.35 ? '#fff2a0' : a < 0.7 ? '#ffa030' : '#d8401a'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); } c.restore();
        }
        if (g.sky && g.sky.occ) occlude(c, g.sky, xc - w / 2 - 50, yc - h / 2 - 12, w + 100, h + 24);
      }
    };
  }
};

/* dragon perché (falaise, toit, tour, pont…) : il ne vole pas ; il respire, bouge la tête, étire parfois ses ailes et, de temps en temps, crache du feu.
   gone = drapeau de partie qui détruit son perchoir (tour abattue par le gourdin du géant) : quand il passe à vrai sous ses yeux, le dragon
   s'envole vers le haut à gauche et quitte l'écran ; s'il est déjà vrai à l'arrivée dans le décor, le dragon n'est plus là */
function perch(o) {
  const id = o.id || 'dragon', ph = (o.x * 7 + o.y * 3) % 17, every = o.every ?? 26 + (ph % 9), dir = o.dir ?? -1; let pos = null, gone0, fly0 = null;
  return {
    id,
    hit(x, y) { return !!pos && x >= pos[0] - pos[2] / 2 && x <= pos[0] + pos[2] / 2 && y >= pos[1] - pos[3] && y <= pos[1]; },
    draw(g, c, t) {
      const K = o.kind && g.spr(o.kind + '.up') ? o.kind + '.' : 'dragon.', P = n => g.spr(K + n); if (!P('up')) return;
      if (o.gone) {
        const f = !!(g.st && g.st.flags && g.st.flags[o.gone]); if (gone0 === undefined) gone0 = f;
        if (gone0) { pos = null; return; }
        if (f && fly0 === null) { fly0 = t; if (g.sfx) g.sfx('whoosh'); }
        if (fly0 !== null) {
          const p = (t - fly0) / 2.6; pos = null; if (p > 1) return;
          const POSES = ['up', 'mid1', 'down', 'mid2'], ff = (t - fly0) * 7, fi = Math.floor(ff) % 4, fe = ff - Math.floor(ff), im = P(POSES[fi]), im2 = P(POSES[(fi + 1) % 4]); if (!im) return;
          const sc = (o.scale ?? 0.7) * (1 - 0.35 * p), w = im.width * sc, h = im.height * sc, e = p * p * (3 - 2 * p) * 0.6 + p * 0.4;
          const x = o.x - e * (o.x + w + 20), y = o.y - h * 0.6 - e * (o.y + h) - Math.sin(p * Math.PI) * 12;
          c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(-0.12);
          c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
          if (im2 && im2 !== im) { c.globalAlpha = fe * fe * (3 - 2 * fe); c.drawImage(im2, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); }
          c.restore(); return;
        }
      }
      if (perchSleep(g, c, o, dir, ph)) { pos = null; return; }
      const sc = o.scale ?? 0.7, tt = t + ph, stretch = (tt % 15) / 1.7, fireT = (tt + 7) % every, fire = o.fire !== false && fireT < 2.6;
      let a = 'down', b = 'down', f = 0;
      if (stretch < 1) { const seq = ['down', 'mid2', 'up', 'mid2', 'down'], q = stretch * 4, i = Math.floor(q); a = seq[i]; b = seq[Math.min(4, i + 1)]; f = q - i; }
      else if (fire && fireT < 0.5) { a = 'mid1'; b = 'mid2'; f = fireT / 0.5; }
      const im = P(a), im2 = P(b); if (!im) return; const w = im.width * sc, h = im.height * sc, br = 1 + 0.014 * Math.sin(tt * 2.2), tilt = Math.sin(tt * 0.8) * 0.025 + (fire ? -0.06 * Math.min(1, fireT / 0.4) * dir * -1 : 0);
      pos = [o.x, o.y, w, h];
      c.save(); c.translate(Math.round(o.x), Math.round(o.y + 2)); c.rotate(tilt); if (dir > 0) c.scale(-1, 1); c.scale(1, br);
      c.drawImage(im, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h));
      if (im2 && im2 !== im) { c.globalAlpha = f * f * (3 - 2 * f); c.drawImage(im2, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); }
      c.restore();
      if (fire && fireT > 0.4) {
        const k = Math.sin(Math.min(1, (fireT - 0.4) / 2.2) * Math.PI), mx = o.x + dir * w * 0.47, my = o.y - h * 0.56; if (fireT < 0.45 && g.sfx) g.sfx('whoosh');
        c.save(); for (let i = 0; i < 26; i++) { const q = (t * 2.4 + i / 26) % 1, r = (2 + q * 7) * Math.max(0.5, sc), px = mx + dir * (q * 52 * sc + 2), py = my + Math.sin(i * 1.7 + t * 9) * q * 5 + q * q * 16; c.globalAlpha = k * (1 - q) * 0.9; c.fillStyle = q < 0.3 ? '#fff2a0' : q < 0.65 ? '#ffa030' : '#d8401a'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill(); } c.restore();
      }
      if (o.occ && g.sky && g.sky.occ) occlude(c, g.sky, o.x - w / 2 - 10, o.y - h - 10, w + 20, h + 20);
    }
  };
}
/* la nuit, le dragon perché se couche sur son perchoir (planche assets/pointclick/sleep/dragon_<espèce>.png, tools/sleep_simple.py) :
   coucher image par image, pose « dort » tenue avec ses z z z, réveil ; réveillé avant d'être couché, il se relève par le même chemin */
const DZ = { ember: [-35, -48], frost: [-27, -34], moss: [-30, -36], gold: [-17, -22] };   /* z z z : au-dessus de la tête (à gauche), pixels de la planche */
function perchSleep(g, c, o, dir, ph) {
  const st = o._sl, n = g.night, k = 'dragon_' + (o.kind || ''), A = g.sleepIdx && g.sleepIdx[k], sh = A && g.sleepSheet(k);
  if (A && !sh && !o._ld) { o._ld = 1; Promise.resolve(g.img(`assets/pointclick/sleep/${k}.png`)).catch(() => {}); }   /* planche chargée dès l'arrivée */
  if (!n || !sh) { o._sl = null; return false; }
  const now = g.now, fr = names => { const out = []; for (const m of names) { const s = A.seg[m], h = A.hold && A.hold[m]; if (s) for (let i = 0; i < s[1]; i++) for (let r = h ? h[i] || 1 : 1; r > 0; r--) out.push(s[0] + i); } return out; };
  let S = st;
  if (!S) S = o._sl = { ph: 'down', t0: n.t0 + 3.5 + (ph % 3) * 0.6, fr: fr(['down1']) };
  if (n.st === 'wake' && S.ph !== 'up' && S.ph !== 'over') {
    if (S.ph === 'loop') S.fr = fr(['up1']); else { const j = Math.max(0, Math.min(S.fr.length - 1, Math.floor((now - S.t0) * A.fps))); S.fr = now < S.t0 ? [] : S.fr.slice(0, j + 1).reverse(); }
    S.ph = 'up'; S.t0 = now;
  }
  if (now < S.t0 || S.ph === 'over') return false;
  let f;
  if (S.ph === 'loop') f = A.seg.loop[0];
  else { const j = Math.floor((now - S.t0) * A.fps); if (j >= S.fr.length) { if (S.ph === 'down') { S.ph = 'loop'; f = A.seg.loop[0]; } else { S.ph = 'over'; return false; } } else f = S.fr[j]; }
  const sc = o.scale ?? 0.7, sx = (f % A.cols) * A.w, sy = Math.floor(f / A.cols) * A.h;
  c.save(); c.translate(Math.round(o.x), Math.round(o.y + 2)); if (dir > 0) c.scale(-1, 1);
  c.drawImage(sh, sx, sy, A.w, A.h, Math.round(-A.ax * sc), Math.round(-A.ay * sc), Math.round(A.w * sc), Math.round(A.h * sc)); c.restore();
  const Z = DZ[o.kind]; if (S.ph === 'loop' && Z) (g.zExtra = g.zExtra || []).push([o.x + Z[0] * sc * (dir > 0 ? -1 : 1), o.y + Z[1] * sc]);   /* z z z : dessinés par night.js */
  if (o.occ && g.sky && g.sky.occ) occlude(c, g.sky, o.x - A.w * sc / 2 - 10, o.y - A.h * sc - 10, A.w * sc + 20, A.h * sc + 20);
  return true;
}
export function makeAmbient(list) { return (list || []).map(o => KINDS[o.type](o)).filter(Boolean); }
