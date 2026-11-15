/* Ciel animé (nuages qui dérivent, étoiles) et « mode nuit » : si le joueur ne bouge pas la souris pendant une minute, la nuit tombe par paliers,
   les personnages rentrent chez eux ou s'allongent, le héros vient parler au joueur en gros plan ; au moindre mouvement, tout redevient jour. */
import { snd } from './sound.js';
import { CASSE, HERO_N } from '../data/sheets.js';
const W = 480, H = 270, SKY_H = 130, STEPS = [0.2, 0.4, 0.6, 0.78];
export const IDLE_NIGHT = 60;
const ease = k => k * k * (3 - 2 * k);
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const INANIMATE = new Set(['handcart', 'cake', 'mannequin', 'butterfly', 'cheese', 'crate']);

/* ───── ciel : zone de ciel déduite du décor (parcours depuis le bord haut) ─────
   `strip` = ciel seul (les arbres, falaises et toits sont remplacés par le ciel voisin) que l'on fait défiler en miroir à l'intérieur du masque réduit ;
   `occ` = tout ce qui est plus proche que le ciel lointain (arbres, falaise, toits) : repeint par-dessus le dragon pour qu'il passe derrière. */
function flood(d, thr) {
  const m = new Uint8Array(W * SKY_H), q = [];
  for (let i = 0; i < W; i++) { m[i] = 1; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const p = q[h], px = p % W, py = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= SKY_H) continue; const n = ny * W + nx; if (m[n]) continue;
      if (Math.abs(d[p * 4] - d[n * 4]) + Math.abs(d[p * 4 + 1] - d[n * 4 + 1]) + Math.abs(d[p * 4 + 2] - d[n * 4 + 2]) <= thr) { m[n] = 1; q.push(n); }
    }
  }
  return { m, n: q.length, q };
}
export function buildSky(bg) {
  try {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(bg, 0, 0, W, H);
    const id = x.getImageData(0, 0, W, SKY_H), d = id.data, A = flood(d, 28), B = flood(d, 45);
    if (A.n < 1800) return null;
    /* nettoyage du masque de « premier plan » : les pixels isolés (bruit, bords de nuages) redeviennent du ciel */
    for (let pass = 0; pass < 2; pass++) { const cpm = B.m.slice(); for (let y = 1; y < SKY_H - 1; y++) for (let xx = 1; xx < W - 1; xx++) { const i = y * W + xx; if (cpm[i]) continue; let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !cpm[i + dy * W + dx]) n++; if (n < 4) B.m[i] = 1; } }
    /* masque réduit de 3 pixels : le défilement ne touche jamais les bords des arbres */
    const m = new Uint8Array(W * SKY_H);
    for (let y = 3; y < SKY_H - 3; y++) for (let xx = 3; xx < W - 3; xx++) { let ok = A.m[y * W + xx] === 1; for (let dy = -3; dy <= 3 && ok; dy += 3) for (let dx = -3; dx <= 3 && ok; dx += 3) if (!A.m[(y + dy) * W + xx + dx]) ok = false; m[y * W + xx] = ok ? 1 : 0; }
    /* bande de ciel : les pixels hors masque prennent la couleur du ciel le plus proche sur la même ligne */
    const sd = new Uint8ClampedArray(d);
    for (let y = 0; y < SKY_H; y++) {
      let last = -1; for (let xx = 0; xx < W; xx++) { const i = y * W + xx; if (m[i]) last = xx; else if (last >= 0) { const j = y * W + last; sd[i * 4] = sd[j * 4]; sd[i * 4 + 1] = sd[j * 4 + 1]; sd[i * 4 + 2] = sd[j * 4 + 2]; } }
      last = -1; for (let xx = W - 1; xx >= 0; xx--) { const i = y * W + xx; if (m[i]) last = xx; else if (last >= 0 && !(sd[i * 4 + 3] === 255 && xx > 0 && m[i - 1] === 0 && false)) { if (!hasLeft(m, y, xx)) { const j = y * W + last; sd[i * 4] = sd[j * 4]; sd[i * 4 + 1] = sd[j * 4 + 1]; sd[i * 4 + 2] = sd[j * 4 + 2]; } } }
    }
    const mask = document.createElement('canvas'); mask.width = W; mask.height = SKY_H; const mx = mask.getContext('2d'), md = mx.createImageData(W, SKY_H);
    for (let i = 0; i < m.length; i++) md.data[i * 4 + 3] = m[i] ? 255 : 0; mx.putImageData(md, 0, 0);
    const strip = document.createElement('canvas'); strip.width = W; strip.height = SKY_H; strip.getContext('2d').putImageData(new ImageData(sd, W, SKY_H), 0, 0);
    const occ = document.createElement('canvas'); occ.width = W; occ.height = SKY_H; { const ox = occ.getContext('2d'), od = ox.createImageData(W, SKY_H); for (let i = 0; i < B.m.length; i++) if (!B.m[i]) { od.data[i * 4] = d[i * 4]; od.data[i * 4 + 1] = d[i * 4 + 1]; od.data[i * 4 + 2] = d[i * 4 + 2]; od.data[i * 4 + 3] = 255; } ox.putImageData(od, 0, 0); }
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = SKY_H;
    let s = 12345; const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const q = A.q, stars = []; for (let k = 0; k < 400 && stars.length < 46; k++) { const p = q[(R() * q.length) | 0]; stars.push({ x: p % W, y: (p / W) | 0, ph: R() * 6, big: R() < 0.2 }); }
    /* lune : le disque le plus dégagé du ciel lointain (zone large du parcours souple), de préférence à droite */
    let moon = null, best = -1;
    for (let cy = 40; cy <= 82; cy += 6) for (let cx = 60; cx <= 420; cx += 8) {
      let ok = 0, tot = 0; for (let dy = -34; dy <= 34; dy += 4) for (let dx = -34; dx <= 34; dx += 4) { if (dx * dx + dy * dy > 1156) continue; const yy = cy + dy; if (yy < 0 || yy >= SKY_H) continue; tot++; if (B.m[yy * W + cx + dx]) ok++; }
      const sc = ok / tot + cx / 5000 - Math.abs(cy - 56) / 900; if (sc > best) { best = sc; moon = [cx, cy]; }
    }
    if (best < 0.1) moon = null;
    /* pleine lune entièrement dégagée : si le ciel lointain contient un disque libre d'au moins 30 px de rayon (aucun arbre, toit, falaise ni
       nuage peint du décor, et entièrement dans l'image), la lune s'y place, à la plus grande taille possible (36 px au plus). Carte des
       distances au plus proche obstacle (chanfrein 3-4, bords de l'image compris). Seule une lune dégagée reçoit le passage du vélo. */
    let moonR = 36, moonClear = false;
    { const D = new Float32Array(W * SKY_H), INF = 1e9;
      for (let y = 0; y < SKY_H; y++) for (let x = 0; x < W; x++) D[y * W + x] = B.m[y * W + x] ? INF : 0;
      const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= SKY_H) ? 0 : D[y * W + x];
      for (let y = 0; y < SKY_H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!D[i]) continue; D[i] = Math.min(D[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4); }
      for (let y = SKY_H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!D[i]) continue; D[i] = Math.min(D[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4); }
      let bi = -1, bd = 0; for (let i = 0; i < D.length; i++) if (D[i] > bd) { bd = D[i]; bi = i; }
      const r = Math.floor(bd / 3) - 1;
      if (r >= 30) { moon = [bi % W, (bi / W) | 0]; moonR = Math.min(36, r); moonClear = true; } }
    return { mask, strip, tmp, occ, stars, moon, moonR, moonClear, speed: 3 };
  } catch { return null; }
}
const hasLeft = (m, y, x) => { for (let k = x; k >= 0; k--) if (m[y * W + k]) return true; return false; };
export function drawSky(c, sky, t) {
  const T = sky.tmp.getContext('2d'), s = (t * sky.speed) % (W * 2);
  T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, W, SKY_H);
  for (let k = 0; k < 3; k++) { const x = -s + k * W; if (k % 2) { T.save(); T.translate(x + W, 0); T.scale(-1, 1); T.drawImage(sky.strip, 0, 0); T.restore(); } else T.drawImage(sky.strip, x, 0); }
  T.globalCompositeOperation = 'destination-in'; T.drawImage(sky.mask, 0, 0);
  c.drawImage(sky.tmp, 0, 0);
}
/* repeint le décor proche (arbres, falaise, toits) sur une zone : sert au dragon pour passer derrière */
export function occlude(c, sky, x, y, w, h) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(SKY_H, Math.ceil(y + h)); if (x1 <= x0 || y1 <= y0) return;
  c.drawImage(sky.occ, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
}

/* idem, mais le décor repeint reçoit la teinte de nuit (sinon des taches claires apparaissent) */
function occludeTint(c, sky, x, y, w, h, color) {
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(SKY_H, Math.ceil(y + h)); if (x1 <= x0 || y1 <= y0) return;
  const t = sky.tmp2 || (sky.tmp2 = Object.assign(document.createElement('canvas'), { width: W, height: SKY_H })), T = t.getContext('2d'), bw = x1 - x0, bh = y1 - y0;
  T.globalCompositeOperation = 'source-over'; T.clearRect(x0, y0, bw, bh); T.drawImage(sky.occ, x0, y0, bw, bh, x0, y0, bw, bh);
  T.globalCompositeOperation = 'multiply'; T.fillStyle = color; T.fillRect(x0, y0, bw, bh);
  T.globalCompositeOperation = 'destination-in'; T.drawImage(sky.occ, x0, y0, bw, bh, x0, y0, bw, bh);
  c.drawImage(t, x0, y0, bw, bh, x0, y0, bw, bh);
}

/* ───── clin d'œil : un petit garçon à vélo, la petite créature dans le panier, passe en volant devant la pleine lune, en ombre chinoise ─────
   Seulement dans les décors où la lune est entièrement dégagée. Il vole comme un oiseau : il traverse le disque de la lune en montant vers
   le haut à droite, sur une courbe qui s'élève de plus en plus, avec un léger tangage au rythme du pédalage. Animation pixel art
   (tools/gen_bike.py) : 8 images par tour de pédalier (12 i/s), 3 inclinaisons pré-dessinées choisies selon la pente de la trajectoire. */
const BK = { fw: 34, fh: 32, n: 8, tilts: [6, 12, 18], ox: 17.5, oy: 19, dur: 8, half: 130 };
function flyby(g, c, n, sk) {
  const e = n.eti; if (!e || !sk || !sk.moon || !sk.moonClear) return false; const u = (g.now - e.t0) / BK.dur; if (u < 0 || u > 1) return false;
  const im = g.spr('bike.fly'); if (!im) return false;
  const [mx, my] = sk.moon, dx = -BK.half + 2 * BK.half * u;
  const slope = -0.22 - 0.001 * dx, ph = (g.now - e.t0) * 12;              /* pente : de -0.09 (arrivée) à -0.35 (départ, il monte de plus en plus) */
  const x = mx + dx, y = my + 2 - 0.22 * dx - 0.0005 * dx * dx + Math.sin(ph / BK.n * Math.PI * 2) * 0.6;
  const deg = -Math.atan(slope) * 180 / Math.PI, row = BK.tilts.reduce((b, t, i) => Math.abs(t - deg) < Math.abs(BK.tilts[b] - deg) ? i : b, 0), col = Math.floor(ph) % BK.n;
  if (!e.sung && u > 0.05) { e.sung = true; snd.flyby && snd.flyby(); }
  const t = sk.tmpB || (sk.tmpB = Object.assign(document.createElement('canvas'), { width: W, height: SKY_H })), T = t.getContext('2d');
  T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, W, SKY_H); T.imageSmoothingEnabled = false;
  T.drawImage(im, col * BK.fw, row * BK.fh, BK.fw, BK.fh, Math.round(x - BK.ox), Math.round(y - BK.oy), BK.fw, BK.fh);
  T.globalCompositeOperation = 'destination-out'; T.drawImage(sk.occ, 0, 0); c.drawImage(t, 0, 0); return true;
}

/* ───── mode nuit ───── */
/* coucher image par image : suites de passages de la planche (tools/sleep_frames.py). Nazim sort d'abord de sa fosse (pit1, pit2) : il y est
   enfoncé de A.pit pixels, coupé sous le rebord, et remonte au fil des images ; au réveil il y redescend par les mêmes passages. */
const ord = (A, re) => Object.keys(A.seg).filter(n => re.test(n)).sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10));
const PIT = A => ord(A, /^pit\d+$/), DOWN = A => [...PIT(A), ...ord(A, /^down\d+$/)], UP = A => [...ord(A, /^up\d+$/), 'end'];
/* planches simplifiées des secondaires (tools/sleep_simple.py) : 4-5 poses par étape, chacune tenue A.hold[passage][k] images du moteur */
function frames(A, names) { const fr = []; for (const n of names) { const s = A.seg[n], h = A.hold && A.hold[n]; if (s) for (let k = 0; k < s[1]; k++) for (let r = h ? h[k] || 1 : 1; r > 0; r--) fr.push({ f: s[0] + k, dy: 0 }); } return fr; }
function pitDepth(fr, n, depth, rise) { for (let j = 0; j < n; j++) { const k = ease(n > 1 ? j / (n - 1) : 1); fr[j].dy = depth * (rise ? 1 - k : k); } }
function animBegin(g, o, now) {
  const A = g.sleepIdx[o.k]; o.fr = frames(A, DOWN(A)); o.ph = 'down'; o.t0 = now; o.speed = 1;
  o.thr = g.sleepConf(o.e).thr ? { st: 'wait' } : null;
  if (A.pit) pitDepth(o.fr, frames(A, PIT(A)).length, A.pit, true);
}
function animWake(g, o, now) {
  const A = g.sleepIdx[o.k];
  if (o.ph === 'loop') { o.fr = frames(A, UP(A)); if (A.pit) { const back = frames(A, PIT(A)); pitDepth(back, back.length, A.pit, false); o.fr.push(...back); } o.speed = 1; }
  else if (o.ph === 'down') {
    const j = Math.min(o.fr.length - 1, Math.floor((now - o.t0) * A.fps)); o.fr = o.fr.slice(0, j + 1).reverse(); o.speed = 1.6;   /* réveillé avant d'être endormi : il se relève par le même chemin */
    const T = g.sleepConf(o.e).thr; if (o.thr && o.thr.st !== 'wait' && T && A.seg[T.seg]) { const f0 = A.seg[T.seg][0] + (T.at || 0); o.fr = [...o.fr.filter(fr => fr.f >= f0), ...frames(A, [...(T.back || []), 'end'])]; }
  }   /* réveillé avant d'être endormi : il se relève par le même chemin */
  else return;
  o.ph = 'up'; o.t0 = now;
}
/* ───── le géant lance son gourdin (SLEEP.thr) : vol en cloche en tournoyant ; s'il vise un décor intact (CASSE), fracas, nuage de poussière et
   rondins qui volent, et le coin du décor passe à son état brisé derrière la poussière ; sinon le gourdin sort de l'écran et on entend un fracas lointain ───── */
function thrLaunch(g, o, now) {
  const T = g.sleepConf(o.e).thr, e = o.e, s = e.scale ?? g.persp(e.y), tg = T.targets && T.targets[g.st.scene], d = tg && tg.casse && CASSE[tg.casse];
  const casse = d && !g.st.flags[d.flag] ? tg.casse : null, from = [e.x + T.hand[0] * s, e.y + T.hand[1] * s], to = casse ? tg.to : [-70, from[1] - 150];
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
  Object.assign(o.thr, { st: 'fly', t0: now, from, to, s, casse, img: T.img, dur: Math.max(0.55, dist / 330), h: 26 + dist * 0.16 }); snd.whoosh();
}
function thrStep(g, o, now) {
  const c = o.thr; if (!c || c.st === 'wait') return;
  if (c.st === 'fly' && now - c.t0 >= c.dur) {
    c.st = 'hit';
    if (c.casse) {
      snd.crash(); g.shake(450, 2.6); c.swapAt = now + 0.3; const [x0, y0, x1, y1] = CASSE[c.casse].dust, r = (a, b) => a + Math.random() * (b - a);
      c.dust = Array.from({ length: 18 }, (_, i) => ({ x: r(x0, x1), y: r(y0 + (y1 - y0) * 0.25, y1), t0: now + i * 0.03, life: r(1.5, 2.4), s0: r(0.6, 0.9), s1: r(1.5, 2.3), vy: r(-14, -5) }));
      c.logs = Array.from({ length: 8 }, () => ({ x: r(x0 + 15, x1 - 15), y: r(y0, (y0 + y1) / 2), vx: r(-60, 60), vy: r(-90, -30), a: r(0, 6), va: r(-9, 9), w: r(6, 11), t0: now, life: r(0.9, 1.4) }));
    } else c.farAt = now + 0.5;
  }
  if (c.swapAt && now >= c.swapAt) { c.swapAt = 0; g.casseApply(c.casse); }
  if (c.farAt && now >= c.farAt) { c.farAt = 0; snd.farcrash(); }
}
function thrDraw(g, c, o, now) {
  const t = o.thr; if (!t || t.st === 'wait') return;
  if (t.st === 'fly') {
    const im = g.imgs[t.img]; if (!im || !im.width) return; const k = Math.min(1, (now - t.t0) / t.dur);
    const x = t.from[0] + (t.to[0] - t.from[0]) * k, y = t.from[1] + (t.to[1] - t.from[1]) * k - 4 * t.h * k * (1 - k);
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(-(now - t.t0) * 15); c.drawImage(im, -im.width / 2 * t.s, -im.height / 2 * t.s, im.width * t.s, im.height * t.s); c.restore();
  }
  for (const L of t.logs || []) { const u = now - L.t0; if (u > L.life) continue; c.save(); c.translate(L.x + L.vx * u, L.y + L.vy * u + 160 * u * u); c.rotate(L.a + L.va * u); c.fillStyle = '#5b3a1e'; c.fillRect(-L.w / 2, -1.5, L.w, 3); c.fillStyle = '#2a1a10'; c.fillRect(-L.w / 2, 1.5, L.w, 1); c.restore(); }
  const pf = g.spr('puff');   /* poussière : les volutes pixel art du jeu (comme la fumée des feux), qui gonflent et s'effacent */
  if (pf) for (const D of t.dust || []) { const u = (now - D.t0) / D.life; if (u < 0 || u > 1) continue; const k = D.s0 + (D.s1 - D.s0) * Math.sqrt(u), w = pf.width * k, h = pf.height * k; c.globalAlpha = 0.9 * (1 - u) * Math.min(1, u * 8); c.drawImage(pf, Math.round(D.x - w / 2), Math.round(D.y + D.vy * u * D.life - h / 2), Math.round(w), Math.round(h)); }
  c.globalAlpha = 1;
}
function animStep(g, o, now) {
  const A = g.sleepIdx[o.k], e = o.e; thrStep(g, o, now); if (!o.ph || o.ph === 'over') return;
  if (o.ph === 'loop') { const s = A.seg.loop; e.sleepF = s[0] + Math.floor((now - o.t0) * (A.lfps || A.fps)) % s[1]; e.sleepDy = 0; e.sleepClip = null; return; }
  const j = Math.floor((now - o.t0) * A.fps * o.speed);
  if (j >= o.fr.length) {
    if (o.ph === 'down' && A.seg.loop) { o.ph = 'loop'; o.t0 = now; o.done = true; return animStep(g, o, now); }
    o.ph = 'over'; e.sleepF = null; e.sleepDy = 0; e.sleepClip = null; return;
  }
  const fr = o.fr[j]; e.sleepF = fr.f; e.sleepDy = fr.dy; e.sleepClip = fr.dy > 0 ? e.y : null;
  const T = g.sleepConf(e).thr; if (o.thr && o.thr.st === 'wait' && o.ph === 'down' && T && A.seg[T.seg] && fr.f >= A.seg[T.seg][0] + (T.at || 0)) thrLaunch(g, o, now);
}
export function startNight(g) {
  const h = g.hero; g.clearBarks(); g.hushNarr(); g.nq.length = 0;
  g.night = { t0: g.now, st: 'fall', level: 0, a: 0, hk: 0, ents: [], say: null, nextSay: 0, lineI: 0, cricket: 0, stunned: false, ct0: 0, hid: false, kdone: {}, mirror: Math.random() < 0.5 };   /* côté vers lequel il se tourne, tiré au sort à chaque nuit */
  /* tout le monde se couche sur place : animation image par image (planche du coucher) ; à défaut, en attendant sa planche, le sprite pivote */
  g.ents.filter(e => !e.isHero && e.visible !== false && e.hot && !e.noHot && !INANIMATE.has(e.id)).sort((a, b) => a.x - b.x).forEach((e, i) => {
    const k = g.sleepKey(e);
    g.night.ents.push({ e, mode: k ? 'anim' : 'lie', k, t: 3 + i * 0.9, sx: e.x, sy: e.y, flip0: e.flip, started: false, done: false, hid: false, side: hash(e.id) % 3 === 0 ? -1 : 1 });
  });
  h.pose = null; snd.music(false);
}
export const POSES = ['Point', 'Shrug', 'Plead', 'Think', 'Wave'];
export function pickPose(g, prev) { const ok = POSES.filter(p => p !== prev && g.spr('hero.p' + p)); return ok.length && Math.random() < 0.8 ? ok[Math.random() * ok.length | 0] : null; }
function nightSay(g, key, raw) {
  const n = g.night; if (!raw) n.pose = pickPose(g, n.pose); const text = raw || g.T(key), idx = raw ? -1 : g.T.idx, b = document.createElement('div'); b.className = 'pc-b pc-nightb'; b.textContent = text; b.style.color = '#ffe08a'; g.ov.append(b); g.placeBubble(b, W / 2, 62);
  const au = raw ? null : g.voicePlay(key, idx), say = { b, au, end: g.now + Math.max(2.4, text.length * 0.065) };
  if (au) au.addEventListener('loadedmetadata', () => { say.end = Math.max(say.end, g.now + au.duration + 0.3); });
  n.say = say;
}
function endSay(g) { const n = g.night; if (n && n.say) { n.say.b.remove(); if (n.say.au) n.say.au.pause(); n.say = null; } }

export function updateNight(g, dt) {
  const n = g.night, h = g.hero, now = g.now, t = now - n.t0;
  if (n.st === 'wake') return wakeUpdate(g, dt);
  const lv = t < 3 ? 1 : t < 6 ? 2 : t < 9 ? 3 : 4; n.level = lv;
  n.a += (STEPS[lv - 1] - n.a) * Math.min(1, dt * 5);
  for (const o of n.ents) {
    if (!o.started && t >= o.t) {
      o.started = true;
      if (o.mode === 'anim') { const at = g.sleepConf(o.e).at && g.sleepConf(o.e).at[o.e.id]; if (at) { o.e.goal = [at[0], at[1], 30]; o.walk = true; } else animBegin(g, o, now); }
    }
    if (o.started && o.mode === 'anim') { if (o.walk && !o.e.goal) { o.walk = false; o.e.flip = o.flip0; animBegin(g, o, now); } if (!o.walk) animStep(g, o, now); }
    if (o.started && !o.done && o.mode === 'lie') { const k = Math.min(1, (t - o.t) / 1.3); o.e.nrot = o.side * Math.PI / 2 * ease(k); if (k >= 1) o.done = true; }
  }
  if (!n.eti && t >= 4.5 && g.sky && g.sky.moon && g.sky.moonClear) n.eti = { t0: now };
  if (t >= 11 && !n.stunned) { n.stunned = true; h.front = true; h.back = false; h.pose = h.pose || 'hero.fSurprise'; nightSay(g, '', '…?!'); snd.jingle(); n.nextSay = now + 1.8; n.stunEnd = now + 1.6; }
  if (n.stunned && n.say && !n.say.au && now > n.say.end) endSay(g);
  if (n.stunned && n.st === 'fall' && now > n.nextSay) { n.st = 'close'; n.ct0 = now; h.pose = null; n.s0 = g.persp(h.y); n.x0 = h.x; n.y0 = h.y; }
  if (n.st === 'close') {
    n.hk = ease(Math.min(1, (now - n.ct0) / 3.2)); if (n.hk > 0.02 && !n.hid) { n.hid = true; h.visible = false; }
    if (n.say) { const playing = n.say.au && !n.say.au.ended && !n.say.au.error && !n.say.au.paused; if (now > n.say.end && !playing) { endSay(g); n.nextSay = now + (n.lineI < 3 ? 0.7 : 6.5); } }
    else if (n.knock) {
      const k = n.knock, tk = now - k.t0; if (k.hit < k.hits.length && tk >= k.hits[k.hit]) { snd.knock(); g.shake(140, 1.6); n.ring = { t0: now }; k.hit++; }
      if (tk > k.hits[k.hits.length - 1] + 0.7) { n.knock = null; n.nextSay = now + 0.3; }
    }
    else if (n.hk >= 1 && now >= n.nextSay) {
      if (n.pendingKnockLine) { n.pendingKnockLine = false; nightSay(g, 'night.hero.knock'); return; }
      if (!n.knocked || (n.lineI >= 3 && n.lineI % 2 === 0 && !n.kdone[n.lineI])) { n.kdone = n.kdone || {}; n.kdone[n.lineI] = 1; if (!n.knocked) n.pendingKnockLine = true; n.knocked = true; n.knock = { t0: now, hits: [0.25, 0.8, 1.35], hit: 0 }; return; }
      const key = n.lineI < 3 ? 'night.hero.' + (n.lineI + 1) : 'night.hero.r' + (1 + ((n.lineI - 3) % 3)); n.lineI++; nightSay(g, key); }
  }
}

export function wakeNight(g) {
  const n = g.night; if (!n || n.st === 'wake') return;
  endSay(g); n.st = 'wake'; n.w0 = g.now; n.hk0 = n.hk; n.a0 = n.a; n.greeted = false; n.barks = 0; snd.music(snd.musicOn !== false);
  for (const o of n.ents) { if (o.mode === 'anim') { if (o.walk) { o.walk = false; o.e.goal = null; o.e.flip = o.flip0; } animWake(g, o, g.now); } }
  g.hero.pose = null;
}
function wakeUpdate(g, dt) {
  const n = g.night, h = g.hero, tw = g.now - n.w0;
  const lvl = Math.max(0, Math.ceil(4 * (1 - tw / 1.4))); n.a += ((lvl ? STEPS[lvl - 1] : 0) - n.a) * Math.min(1, dt * 7);
  n.hk = n.hk0 * (1 - ease(Math.min(1, tw / (g.spr('hero.nNeutral') ? 1.6 : 0.9))));   /* vue de face : il recule pendant 1,6 s */
  if (n.hid && n.hk < 0.03) { n.hid = false; h.visible = true; h.front = true; h.back = false; }
  if (!n.hid && !n.greeted && tw > 0.6) { n.greeted = true; g.bark('hero', 'night.hero.back', 3600, true); h.front = false; }
  for (const o of n.ents) {
    if (o.mode === 'anim') { animStep(g, o, g.now); continue; }
    const k = Math.min(1, tw / 1.2), wob = Math.sin(g.now * 9 + o.sx) * 0.1 * (1 - Math.min(1, Math.max(0, (tw - 0.4) / 2.2)));
    if (o.mode === 'lie') o.e.nrot = o.side * Math.PI / 2 * (1 - ease(k)) + wob; else o.e.nrot = wob;
  }
  const animsOver = n.ents.every(o => o.mode !== 'anim' || !o.ph || o.ph === 'over');
  if (n.greeted && n.barks < 2 && tw > 1.2 && !g.hiBusy() && !g.lowBusy() && g.barks.length === 0) { const c = n.ents.filter(o => o.e.visible !== false && !(g.ent(o.e.id) === null)); const o = c[(hash(String(n.barks)) + c.length) % (c.length || 1)]; if (o) g.bark(o.e.id, 'night.wake', 2800, true); n.barks++; }
  if (tw > 3 && n.barks >= 2 && !g.lowBusy() && animsOver || tw > 16) { for (const o of n.ents) { o.e.nrot = 0; o.e.sleepF = null; o.e.sleepDy = 0; o.e.sleepClip = null; } g.night = null; g.lastMove = g.now; g.lastAct = g.now; h.front = false; }
}

export function drawNight(g, c) {
  const n = g.night; if (!n) return; const a = n.a, t = g.now;
  for (const o of n.ents) thrDraw(g, c, o, t);
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${255 - a * 215 | 0},${255 - a * 200 | 0},${255 - a * 120 | 0})`; c.fillRect(0, 0, W, H); c.restore();
  const sk = g.sky, va = Math.min(1, Math.max(0, (a - 0.3) / 0.4));
  if (sk && va > 0) {
    c.save(); c.globalAlpha = va; for (const s of sk.stars) { const tw = 0.6 + 0.4 * Math.sin(t * 2 + s.ph); c.globalAlpha = va * tw; c.fillStyle = '#fff8d8'; c.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1); }
    if (sk.moon) { const [mx, my] = sk.moon, R = sk.moonR || 36;
      const hg = c.createRadialGradient(mx, my, R * 0.8, mx, my, R * 1.9); hg.addColorStop(0, 'rgba(160,200,255,0.42)'); hg.addColorStop(1, 'rgba(160,200,255,0)'); c.globalAlpha = va; c.fillStyle = hg; c.beginPath(); c.arc(mx, my, R * 1.9, 0, 7); c.fill();
      const dg = c.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.1, mx, my, R); dg.addColorStop(0, '#f6faff'); dg.addColorStop(1, '#bcd2ee'); c.fillStyle = dg; c.beginPath(); c.arc(mx, my, R, 0, 7); c.fill();
      c.fillStyle = 'rgba(110,140,185,0.30)'; for (const [fx, fy, fr] of [[-0.35, -0.45, 0.2], [0.2, -0.2, 0.15], [-0.1, 0.25, 0.24], [0.42, 0.3, 0.12], [-0.5, 0.1, 0.1], [0.05, -0.62, 0.1], [0.5, -0.4, 0.09]]) { c.beginPath(); c.arc(mx + fx * R, my + fy * R, fr * R, 0, 7); c.fill(); } }
    c.restore();
  }
  /* le vélo passe dans le ciel, comme la lune : tous deux derrière le décor proche (arbres, falaise, toits), repeint par-dessus */
  flyby(g, c, n, sk);
  if (sk && sk.moon && va > 0) { const tint = `rgb(${255 - a * 215 | 0},${255 - a * 200 | 0},${255 - a * 120 | 0})`; occludeTint(c, sk, sk.moon[0] - 70, sk.moon[1] - 70, 140, 140, tint); }
  const vg = c.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 300); vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, `rgba(0,0,10,${a * 0.55})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  /* z z z au-dessus des dormeurs */
  c.save(); c.font = '12px VT323, monospace'; c.fillStyle = '#dfe8ff';
  for (const o of n.ents) {
    if (o.e.visible === false || !((o.mode === 'lie' && o.done) || o.ph === 'loop')) continue;
    const z = o.mode === 'anim' && g.sleepConf(o.e).z, s = o.e.scale ?? g.persp(o.e.y), zx = z ? o.e.x + z[0] * s : o.e.x + 4, zy = z ? o.e.y + z[1] * s : o.e.y - 18;
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3 + o.sx * 0.01) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * 0.9; c.fillText(k === 1 ? 'Z' : 'z', zx + ph * 12 + k * 3, zy - ph * 22); }
  }
  c.restore();
  /* le héros qui s'approche de l'écran. Vue de face (15/11, tools/hero_nuit_sprites.py) : travelling avant fait d'images entières à chaque distance
     (sprite du jeu, en pied, aux genoux, à la taille, puis portrait), chacune réduite ou agrandie en continu et relayée par la suivante à taille de
     visage égale ; au réveil, le même travelling à l'envers (il recule). Sans ces images : ancien sprite agrandi puis fondu vers le portrait. */
  if (n.hk > 0.02) {
    const h = g.hero, k = n.hk, NF = g.spr('hero.nNeutral') ? 'hero.n' : null, P = NF || 'hero.p', mx = n.mirror ? -1 : 1;
    c.save(); c.imageSmoothingEnabled = false;
    const im0 = g.spr(h.pose || (n.stunned && n.st !== 'wake' ? 'hero.fSurprise' : 'hero.front')) || g.spr('hero.front'), S = n.s0 || 1;
    const talking = n.say && n.say.au && !n.say.au.paused && !n.say.au.ended, base = n.pose ? P + n.pose : null;
    if (base !== n.pb) { n.pp = n.pb; n.pb = base; n.pbT = t; }
    const src = base || n.pp, inter = NF && src && t - (n.pbT ?? -9) < 0.14 && g.spr(src + 'A') ? src + 'A' : null;   /* geste : image intermédiaire à l'aller et au retour */
    let kk = null;
    if (n.knock) { const tk = t - n.knock.t0;
      if (NF) { kk = P + 'KnockA'; for (const hh of n.knock.hits) { if (tk >= hh && tk < hh + 0.07) kk = P + 'KnockB'; else if (tk >= hh + 0.07 && tk < hh + 0.22) kk = P + 'KnockC'; } }   /* élan, coup, poing contre la vitre */
      else { for (const hh of n.knock.hits) if (tk >= hh && tk < hh + 0.17) kk = 'hero.pKnock1'; if (!kk && tk > 0.05) kk = 'hero.pKnock2'; } }
    const pk = !g.spr(P + 'Neutral') ? null : (kk && g.spr(kk) ? kk : inter || (base && g.spr(base) ? (talking && Math.floor(t * 7) % 2 && g.spr(base + 'T') ? base + 'T' : base) : talking && Math.floor(t * 7) % 2 ? P + 'Talk' : (t % 3.7 < 0.14 ? P + 'Blink' : P + 'Neutral'))), pi = pk && (g.spr(pk) || g.spr(P + 'Neutral'));
    const ne = g.spr(P + 'Neutral') || pi, scP = ne ? Math.min(W / ne.width, H / ne.height) * 1.02 : 1;
    if (NF && k < 1 && im0) {
      const fp = HERO_N.nNeutral, Fp = fp[2] * scP, Px = W / 2 + mx * (fp[0] - ne.width / 2) * scP, Py = H / 2 + 6 + (fp[1] - ne.height / 2) * scP;
      const f0 = [im0.width / 2, 16, 10], F0 = f0[2] * S, X0 = n.x0 ?? h.x, Y0 = (n.y0 ?? h.y) - (im0.height - f0[1]) * S;
      const Fk = F0 * Math.pow(Fp / F0, k), u = (Fk - F0) / (Fp - F0), fx = X0 + (Px - X0) * u, fy = Y0 + (Py - Y0) * u + Math.abs(Math.sin(t * 7)) * Fk * 0.05 * (1 - k);
      const L = [[im0, f0], [g.spr('hero.nAp1'), HERO_N.nAp1], [g.spr('hero.nAp2'), HERO_N.nAp2], [g.spr('hero.nAp3'), HERO_N.nAp3], [ne, fp]], i = k < 0.3 ? 0 : k < 0.55 ? 1 : k < 0.75 ? 2 : k < 0.9 ? 3 : 4;
      const [im, [cx, cy, fw]] = L[i][0] ? L[i] : L[0], s = Fk / fw;
      c.save(); c.translate(Math.round(fx), Math.round(fy)); if (n.mirror && i > 0) c.scale(-1, 1); c.drawImage(im, -cx * s, -cy * s, im.width * s, im.height * s); c.restore();
    } else if (!NF && im0) { const s = S + (5.4 - S) * k, x = (n.x0 ?? h.x) + (240 - (n.x0 ?? h.x)) * k, y = (n.y0 ?? h.y) + (532 - (n.y0 ?? h.y)) * k; c.globalAlpha = k > 0.62 && pi ? Math.max(0, 1 - (k - 0.62) / 0.3) : 1; c.drawImage(im0, x - im0.width * s / 2, y - im0.height * s, im0.width * s, im0.height * s); }
    if (pi && (NF ? k >= 1 : k > 0.6)) {
      c.globalAlpha = NF ? 1 : Math.min(1, (k - 0.6) / 0.3); const am = talking ? 1.7 : 1, sc = scP * (1 + 0.012 * Math.sin(t * 1.7)), ox = Math.sin(t * 1.3) * 3 * am, oy = Math.sin(t * 2.1) * 2 * am;
      if (NF) n.ringXY = [W / 2 + ox + mx * (0.37 - 0.5) * ne.width * sc, H / 2 + 6 + oy + (0.7 - 0.5) * ne.height * sc];   /* le poing contre la vitre */
      c.translate(W / 2 + ox, H / 2 + 6 + oy); c.rotate(Math.sin(t * 0.9) * 0.025 * am); if (n.mirror) c.scale(-1, 1); c.drawImage(pi, -pi.width * sc / 2, -pi.height * sc / 2, pi.width * sc, pi.height * sc);
    }
    c.restore();
  }
  if (n.ring && g.now - n.ring.t0 < 0.55) { const k = (g.now - n.ring.t0) / 0.55; c.save(); c.globalAlpha = (1 - k) * 0.8; c.strokeStyle = '#dfeaff'; c.lineWidth = 2; const [rx, ry] = n.ringXY || [W * 0.6, H * 0.46]; c.beginPath(); c.ellipse(rx, ry, 14 + k * 46, 10 + k * 32, 0, 0, 7); c.stroke(); c.restore(); }
}
