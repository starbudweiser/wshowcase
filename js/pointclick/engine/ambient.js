import { occlude } from './night.js';
/* Décor vivant : zones du décor animées (eau, roue, herbes), respiration des animaux, fumée, oiseaux, dragon qui vole, lueurs.
   Chaque scène déclare `ambient: [...]`. Tout est dessiné par-dessus le décor, avant les personnages. */
import { hitPoly } from './walk.js';

const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const bbox = p => { const xs = p.map(q => q[0]), ys = p.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const clipPoly = (c, p) => { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.clip(); };

const KINDS = {
  /* rivière : chaque ligne du décor glisse un peu de côté (ondulation) + éclats de lumière */
  water(o) {
    const poly = o.poly, [x0, y0, x1, y1] = bbox(poly), w = x1 - x0 + 4, amp = o.amp ?? 1.3, sp = o.speed ?? 2.2, R = rnd(o.seed || 3);
    const glints = Array.from({ length: o.glints ?? 14 }, () => ({ x: x0 + R() * (x1 - x0), y: y0 + R() * (y1 - y0), p: R() * 6.28, s: 1.5 + R() * 2 })).filter(g => hitPoly(g.x, g.y, poly));
    return {
      draw(g, c, t) {
        c.save(); clipPoly(c, poly);
        for (let y = Math.floor(y0); y < y1; y++) {
          const off = Math.round(Math.sin(t * sp + y * 0.62) * amp * (0.55 + 0.45 * Math.sin(y * 0.17 + t * 0.4)) + ((t * (o.flow ?? 0)) % 1));
          if (off) c.drawImage(g.bg, x0, y, w, 1, x0 + off, y, w, 1);
        }
        c.restore();
        glints.forEach(q => { const v = Math.sin(t * q.s + q.p); if (v > 0.86) { c.fillStyle = v > 0.95 ? 'rgba(255,248,214,.95)' : 'rgba(255,236,170,.7)'; c.fillRect(Math.round(q.x), Math.round(q.y), v > 0.95 ? 2 : 1, 1); } });
      }
    };
  },
  /* roue de moulin : un disque du décor qui tourne */
  wheel(o) {
    const { cx, cy, r } = o, sp = o.speed ?? 0.9;
    return { draw(g, c, t) { c.save(); c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.clip(); c.translate(cx, cy); c.rotate(t * sp); c.drawImage(g.bg, cx - r, cy - r, 2 * r, 2 * r, -r, -r, 2 * r, 2 * r); c.restore(); } };
  },
  /* herbes, fleurs, roseaux : le haut de la zone se balance plus que le bas */
  sway(o) {
    const [x0, y0, x1, y1] = o.rect, amp = o.amp ?? 1.6, sp = o.speed ?? 1.5;
    return { draw(g, c, t) { for (let y = y0; y < y1; y++) { const k = (y1 - y) / (y1 - y0), off = Math.round(Math.sin(t * sp + y * 0.11 + (o.phase || 0)) * amp * k); if (off) c.drawImage(g.bg, x0, y, x1 - x0, 1, x0 + off, y, x1 - x0, 1); } } };
  },
  /* animal qui respire / broute : la zone s'étire un peu depuis ses pieds */
  bob(o) {
    const [x0, y0, x1, y1] = o.rect, amp = o.amp ?? 0.035, sp = o.speed ?? 1.4;
    return { draw(g, c, t) { const k = 1 + amp * (0.5 + 0.5 * Math.sin(t * sp + (o.phase || 0))), h = (y1 - y0) * k; c.drawImage(g.bg, x0, y0, x1 - x0, y1 - y0, x0, Math.round(y1 - h), x1 - x0, Math.round(h)); } };
  },
  /* fumée de cheminée */
  smoke(o) {
    const n = o.n ?? 9;
    return { draw(g, c, t) { for (let i = 0; i < n; i++) { const ph = (t * (o.speed ?? 0.3) + i / n) % 1, x = o.x + Math.sin(ph * 5 + i) * 2 + ph * (o.wind ?? 10), y = o.y - ph * (o.h ?? 28), r = 1.2 + ph * 3.2; c.fillStyle = `rgba(236,230,220,${(0.5 * (1 - ph)).toFixed(2)})`; c.fillRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2)); } } };
  },
  /* lueur vacillante (fenêtre, lanterne, forge) */
  glow(o) {
    return { draw(g, c, t) { const f = 0.75 + 0.25 * Math.sin(t * 7 + (o.phase || 0)) * Math.sin(t * 3.3); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 3; k >= 1; k--) { c.fillStyle = `rgba(255,${150 + k * 20},70,${(0.05 * f * (4 - k)).toFixed(3)})`; c.beginPath(); c.arc(o.x, o.y, o.r * k / 3, 0, 6.2832); c.fill(); } c.restore(); } };
  },
  /* oiseaux : petits « v » qui battent des ailes et traversent le ciel */
  birds(o) {
    const n = o.n ?? 4, R = rnd(o.seed || 5), bs = Array.from({ length: n }, (_, i) => ({ y: (o.y0 ?? 18) + R() * ((o.y1 ?? 70) - (o.y0 ?? 18)), sp: (o.speed ?? 14) * (0.8 + R() * 0.5), off: R() * 600, ph: R() * 6, dir: o.dir ?? (R() > 0.5 ? 1 : -1) }));
    return {
      draw(g, c, t) {
        bs.forEach(b => {
          const span = 480 + 80, x = ((t * b.sp + b.off) % span) - 40, X = b.dir > 0 ? x : 480 - x, Y = Math.round(b.y + Math.sin(t * 0.8 + b.ph) * 4), up = Math.sin(t * 9 + b.ph) > 0;
          c.fillStyle = '#2a1c1c'; const px = Math.round(X);
          if (up) { c.fillRect(px - 3, Y - 2, 2, 1); c.fillRect(px - 1, Y - 1, 2, 1); c.fillRect(px + 1, Y - 1, 2, 1); c.fillRect(px + 3, Y - 2, 2, 1); }
          else { c.fillRect(px - 3, Y, 2, 1); c.fillRect(px - 1, Y - 1, 2, 1); c.fillRect(px + 1, Y - 1, 2, 1); c.fillRect(px + 3, Y, 2, 1); }
        });
      }
    };
  },
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
  /* roue qui tourne vraiment : la roue du décor, découpée en ellipse (vue de biais), est tournée dans son plan ; `skip` = zone à laisser fixe (barrière devant la roue) */
  spin(o) {
    const sx = o.rx / o.ry, bw = Math.ceil(o.rx * 2 + 4), bh = Math.ceil(o.ry * 2 + 4), tmp = document.createElement('canvas'); tmp.width = bw; tmp.height = bh;
    const T = tmp.getContext('2d'), ox = Math.floor(o.cx - bw / 2), oy = Math.floor(o.cy - bh / 2);
    return {
      draw(g, c, t) {
        if (!g.bg) return;
        T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, bw, bh); T.save(); T.beginPath(); T.ellipse(o.cx - ox, o.cy - oy, o.rx, o.ry, 0, 0, Math.PI * 2); T.clip();
        T.translate(o.cx - ox, o.cy - oy); T.scale(sx, 1); T.rotate(t * (o.speed ?? 0.3)); T.scale(1 / sx, 1); T.drawImage(g.bg, -o.cx, -o.cy, 480, 270); T.restore();
        /* `fade` = [x0, yHaut, yBas] : à droite de x0, la rotation s'estompe de yHaut à yBas (la barrière reste celle du décor, sans coupure nette) */
        if (o.fade) { const [x0, y0, y1] = o.fade, gr = T.createLinearGradient(0, y0 - oy, 0, y1 - oy); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); T.globalCompositeOperation = 'destination-out'; T.fillStyle = gr; T.fillRect(x0 - ox, y0 - oy, bw, bh); T.fillStyle = 'rgba(0,0,0,1)'; T.fillRect(x0 - ox, y1 - oy, bw, bh); }
        c.drawImage(tmp, ox, oy);
      }
    };
  },
  /* oiseaux en sprites : 3 poses d'ailes (bird.1 à bird.3), qui traversent le ciel */
  flock(o) {
    const n = o.n ?? 4, R = rnd(o.seed || 5), bs = Array.from({ length: n }, () => ({ y: (o.y0 ?? 18) + R() * ((o.y1 ?? 70) - (o.y0 ?? 18)), sp: (o.speed ?? 14) * (0.8 + R() * 0.5), off: R() * 600, ph: R() * 6, dir: R() > 0.5 ? 1 : -1, sc: 0.5 + R() * 0.4 }));
    return {
      draw(g, c, t) {
        bs.forEach(b => {
          const im = g.spr('bird.' + ([1, 2, 3, 2][Math.floor(t * 7 + b.ph) % 4])); if (!im) return;
          const x = ((t * b.sp + b.off) % 560) - 40, X = b.dir > 0 ? x : 480 - x, Y = Math.round(b.y + Math.sin(t * 0.8 + b.ph) * 4), w = im.width * b.sc, h = im.height * b.sc;
          c.save(); c.translate(Math.round(X), Y); if (b.dir < 0) c.scale(-1, 1); c.drawImage(im, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h)); c.restore();
        });
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

/* dragon perché (falaise, toit, tour, pont…) : il ne vole pas ; il respire, bouge la tête, étire parfois ses ailes et, de temps en temps, crache du feu */
function perch(o) {
  const id = o.id || 'dragon', ph = (o.x * 7 + o.y * 3) % 17, every = o.every ?? 26 + (ph % 9), dir = o.dir ?? -1; let pos = null;
  return {
    id,
    hit(x, y) { return !!pos && x >= pos[0] - pos[2] / 2 && x <= pos[0] + pos[2] / 2 && y >= pos[1] - pos[3] && y <= pos[1]; },
    draw(g, c, t) {
      const K = o.kind && g.spr(o.kind + '.up') ? o.kind + '.' : 'dragon.', P = n => g.spr(K + n); if (!P('up')) return;
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
export function makeAmbient(list) { return (list || []).map(o => KINDS[o.type](o)).filter(Boolean); }
