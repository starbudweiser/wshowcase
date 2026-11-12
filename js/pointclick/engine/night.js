/* Ciel animé (nuages qui dérivent, étoiles) et « mode nuit » : si le joueur ne bouge pas la souris pendant une minute, la nuit tombe par paliers,
   les personnages rentrent chez eux ou s'allongent, le héros vient parler au joueur en gros plan ; au moindre mouvement, tout redevient jour. */
import { snd } from './sound.js';
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
    const id = x.getImageData(0, 0, W, SKY_H), d = id.data, A = flood(d, 28), B = flood(d, 110);
    if (A.n < 1800) return null;
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
    return { mask, strip, tmp, occ, stars, moon, speed: 3 };
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

/* ───── clin d'œil : un petit garçon à vélo avec une petite créature dans le panier passe en volant devant la lune, en ombre chinoise ───── */
function drawBike(c, x, y, t, sc = 0.8) {
  c.save(); c.translate(x, y); c.rotate(-0.1); c.scale(sc, sc); c.fillStyle = c.strokeStyle = '#04050e'; c.lineCap = c.lineJoin = 'round';
  c.lineWidth = 1.5; for (const wx of [-10, 10]) { c.beginPath(); c.arc(wx, 5, 6.6, 0, 7); c.stroke(); c.lineWidth = 0.6; for (let k = 0; k < 4; k++) { const a = t * 10 + k * 0.785; c.beginPath(); c.moveTo(wx + Math.cos(a) * 6.4, 5 + Math.sin(a) * 6.4); c.lineTo(wx - Math.cos(a) * 6.4, 5 - Math.sin(a) * 6.4); c.stroke(); } c.lineWidth = 1.5; }
  c.lineWidth = 1.6; c.beginPath(); c.moveTo(-10, 5); c.lineTo(-2, 5); c.lineTo(-4, -3); c.lineTo(7, -4); c.lineTo(10, 5); c.moveTo(-2, 5); c.lineTo(7, -4); c.moveTo(-4, -3); c.lineTo(-5, -6); c.moveTo(7, -4); c.lineTo(8, -9); c.lineTo(12, -9); c.stroke();
  /* le grand panier : un bloc arrondi, plus haut que le torse, posé sur le guidon */
  c.beginPath(); c.moveTo(9, -8); c.lineTo(8.4, -17); c.quadraticCurveTo(8.2, -25, 13.2, -25); c.quadraticCurveTo(18.4, -25, 18.4, -17); c.lineTo(17.4, -8); c.closePath(); c.fill();
  /* le garçon : penché en avant, casque, bras tendu vers le guidon, jambes qui pédalent */
  c.beginPath(); c.moveTo(-7, -6); c.lineTo(-3, -8); c.lineTo(3, -15); c.lineTo(1, -18); c.lineTo(-5, -12); c.closePath(); c.fill();
  c.beginPath(); c.arc(2.6, -19.6, 3.3, 0, 7); c.fill(); c.beginPath(); c.arc(2.2, -20.4, 3.7, Math.PI * 1.05, Math.PI * 1.95); c.fill();
  c.lineWidth = 2.2; c.beginPath(); c.moveTo(1.5, -15); c.lineTo(6, -11.5); c.lineTo(9, -9.5); c.stroke();
  const pa = t * 8; c.lineWidth = 2.4; for (const ph of [0, Math.PI]) { const px = -2 + Math.cos(pa + ph) * 3, py = 5 + Math.sin(pa + ph) * 3; c.beginPath(); c.moveTo(-5, -6); c.lineTo(-1.5 + (px + 2) * 0.35, -1 + (py - 5) * 0.2); c.lineTo(px, py); c.stroke(); }
  c.restore();
}
function flyby(g, c, n, sk) {
  const e = n.eti; if (!e || !sk || !sk.moon) return; const u = (g.now - e.t0) / 8; if (u < 0 || u > 1) return;
  const [mx, my] = sk.moon, um = (mx + 30) / 540, x = -30 + 540 * u, k = (u - um) / Math.max(um, 1 - um), y = my + 6 + 78 * k * k * (k < 0 ? 0.8 : 1);
  if (!e.sung && u > 0.05) { e.sung = true; snd.flyby && snd.flyby(); }
  drawBike(c, x, y, g.now, 1.05);
}

/* ───── mode nuit ───── */
export function startNight(g) {
  const h = g.hero; g.clearBarks(); g.hushNarr(); g.nq.length = 0;
  g.night = { t0: g.now, st: 'fall', level: 0, a: 0, hk: 0, ents: [], say: null, nextSay: 0, lineI: 0, cricket: 0, stunned: false, ct0: 0, hid: false, kdone: {} };
  g.ents.filter(e => !e.isHero && e.visible !== false && e.hot && !e.noHot && !INANIMATE.has(e.id)).sort((a, b) => a.x - b.x).forEach((e, i) => {
    g.night.ents.push({ e, mode: hash(e.id) % 2 ? 'home' : 'lie', t: 3 + i * 0.9, sx: e.x, sy: e.y, started: false, done: false, hid: false, side: hash(e.id) % 3 === 0 ? -1 : 1 });
  });
  h.pose = null; snd.music(false);
}
function nightSay(g, key, raw) {
  const n = g.night, text = raw || g.T(key), idx = raw ? -1 : g.T.idx, b = document.createElement('div'); b.className = 'pc-b pc-nightb'; b.textContent = text; b.style.color = '#ffe08a'; g.ov.append(b); g.placeBubble(b, W / 2, 62);
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
  if (lv >= 2 && now > n.cricket) { snd.cricket(); n.cricket = now + 0.7 + Math.random() * 0.7; }
  for (const o of n.ents) {
    if (!o.started && t >= o.t) { o.started = true; if (o.mode === 'home') o.e.goal = [o.e.x < 240 ? -40 : 520, o.e.y, 44]; }
    if (o.started && !o.done) {
      if (o.mode === 'lie') { const k = Math.min(1, (t - o.t) / 1.3); o.e.nrot = o.side * Math.PI / 2 * ease(k); if (k >= 1) o.done = true; }
      else if (!o.e.goal || o.e.x < -20 || o.e.x > 500) { o.e.goal = null; o.e.visible = false; o.hid = true; o.done = true; }
    }
  }
  if (!n.eti && t >= 4.5 && g.sky && g.sky.moon) n.eti = { t0: now };
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
  for (const o of n.ents) if (o.hid) { o.e.visible = true; o.e.goal = null; o.e.x = o.sx; o.e.y = o.sy; o.e.nrot = 0; o.mode = 'hid'; o.side = hash(o.e.id) % 2 ? 1 : -1; }
  g.hero.pose = null;
}
function wakeUpdate(g, dt) {
  const n = g.night, h = g.hero, tw = g.now - n.w0;
  const lvl = Math.max(0, Math.ceil(4 * (1 - tw / 1.4))); n.a += ((lvl ? STEPS[lvl - 1] : 0) - n.a) * Math.min(1, dt * 7);
  n.hk = n.hk0 * (1 - ease(Math.min(1, tw / 0.9)));
  if (n.hid && n.hk < 0.03) { n.hid = false; h.visible = true; h.front = true; h.back = false; }
  if (!n.hid && !n.greeted && tw > 0.6) { n.greeted = true; g.bark('hero', 'night.hero.back', 3600, true); h.front = false; }
  for (const o of n.ents) {
    const k = Math.min(1, tw / 1.2), wob = Math.sin(g.now * 9 + o.sx) * 0.1 * (1 - Math.min(1, Math.max(0, (tw - 0.4) / 2.2)));
    if (o.mode === 'lie') o.e.nrot = o.side * Math.PI / 2 * (1 - ease(k)) + wob; else o.e.nrot = wob;
  }
  if (n.greeted && n.barks < 2 && tw > 1.2 && !g.hiBusy() && !g.lowBusy() && g.barks.length === 0) { const c = n.ents.filter(o => o.e.visible !== false && !(g.ent(o.e.id) === null)); const o = c[(hash(String(n.barks)) + c.length) % (c.length || 1)]; if (o) g.bark(o.e.id, 'night.wake', 2800, true); n.barks++; }
  if (tw > 3 && n.barks >= 2 && !g.lowBusy() || tw > 14) { for (const o of n.ents) o.e.nrot = 0; g.night = null; g.lastMove = g.now; g.lastAct = g.now; h.front = false; }
}

export function drawNight(g, c) {
  const n = g.night; if (!n) return; const a = n.a, t = g.now;
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${255 - a * 215 | 0},${255 - a * 200 | 0},${255 - a * 120 | 0})`; c.fillRect(0, 0, W, H); c.restore();
  const sk = g.sky, va = Math.min(1, Math.max(0, (a - 0.3) / 0.4));
  if (sk && va > 0) {
    c.save(); c.globalAlpha = va; for (const s of sk.stars) { const tw = 0.6 + 0.4 * Math.sin(t * 2 + s.ph); c.globalAlpha = va * tw; c.fillStyle = '#fff8d8'; c.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1); }
    if (sk.moon) { const [mx, my] = sk.moon, R = 36;
      const hg = c.createRadialGradient(mx, my, R * 0.8, mx, my, R * 1.9); hg.addColorStop(0, 'rgba(160,200,255,0.42)'); hg.addColorStop(1, 'rgba(160,200,255,0)'); c.globalAlpha = va; c.fillStyle = hg; c.beginPath(); c.arc(mx, my, R * 1.9, 0, 7); c.fill();
      const dg = c.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.1, mx, my, R); dg.addColorStop(0, '#f6faff'); dg.addColorStop(1, '#bcd2ee'); c.fillStyle = dg; c.beginPath(); c.arc(mx, my, R, 0, 7); c.fill();
      c.fillStyle = 'rgba(110,140,185,0.30)'; for (const [fx, fy, fr] of [[-0.35, -0.45, 0.2], [0.2, -0.2, 0.15], [-0.1, 0.25, 0.24], [0.42, 0.3, 0.12], [-0.5, 0.1, 0.1], [0.05, -0.62, 0.1], [0.5, -0.4, 0.09]]) { c.beginPath(); c.arc(mx + fx * R, my + fy * R, fr * R, 0, 7); c.fill(); } }
    c.restore();
  }
  if (sk && sk.moon && va > 0) { occludeTint(c, sk, sk.moon[0] - 70, sk.moon[1] - 70, 140, 140, `rgb(${255 - a * 215 | 0},${255 - a * 200 | 0},${255 - a * 120 | 0})`); }   /* la lune passe derrière les arbres */
  flyby(g, c, n, sk);
  const vg = c.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 300); vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, `rgba(0,0,10,${a * 0.55})`); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  /* z z z au-dessus des dormeurs */
  c.save(); c.font = '12px VT323, monospace'; c.fillStyle = '#dfe8ff';
  for (const o of n.ents) if (o.mode === 'lie' && o.done && o.e.visible !== false) for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3 + o.sx * 0.01) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * 0.9; c.fillText(k === 1 ? 'Z' : 'z', o.e.x + 4 + ph * 12 + k * 3, o.e.y - 18 - ph * 22); }
  c.restore();
  /* le héros qui s'approche de l'écran : sprite qui grandit, puis portrait en gros plan */
  if (n.hk > 0.02) {
    const h = g.hero, k = n.hk, im = g.spr(h.pose || (n.stunned && n.st !== 'wake' ? 'hero.fSurprise' : 'hero.front')) || g.spr('hero.front');
    c.save(); c.imageSmoothingEnabled = false; const S = n.s0 || 1;
    if (im) { const s = S + (5.4 - S) * k, x = (n.x0 ?? h.x) + (240 - (n.x0 ?? h.x)) * k, y = (n.y0 ?? h.y) + (532 - (n.y0 ?? h.y)) * k; c.globalAlpha = k > 0.62 && g.spr('hero.pNeutral') ? Math.max(0, 1 - (k - 0.62) / 0.3) : 1; c.drawImage(im, x - im.width * s / 2, y - im.height * s, im.width * s, im.height * s); }
    const talking = n.say && n.say.au && !n.say.au.paused && !n.say.au.ended, kk = n.knock ? (() => { const tk = t - n.knock.t0; for (const h of n.knock.hits) if (tk >= h && tk < h + 0.17) return 'hero.pKnock1'; return tk > 0.05 ? 'hero.pKnock2' : null; })() : null,
      pk = !(g.hero && g.spr('hero.pNeutral')) ? null : (kk && g.spr(kk) ? kk : talking && Math.floor(t * 7) % 2 ? 'hero.pTalk' : (t % 3.7 < 0.14 ? 'hero.pBlink' : 'hero.pNeutral')), pi = pk && (g.spr(pk) || g.spr('hero.pNeutral'));
    if (pi && k > 0.6) { c.globalAlpha = Math.min(1, (k - 0.6) / 0.3); const sc = Math.min(W / pi.width, H / pi.height) * 1.02; c.drawImage(pi, W / 2 - pi.width * sc / 2, H / 2 - pi.height * sc / 2 + 6, pi.width * sc, pi.height * sc); }
    c.restore();
  }
  if (n.ring && g.now - n.ring.t0 < 0.55) { const k = (g.now - n.ring.t0) / 0.55; c.save(); c.globalAlpha = (1 - k) * 0.8; c.strokeStyle = '#dfeaff'; c.lineWidth = 2; c.beginPath(); c.ellipse(W * 0.6, H * 0.46, 14 + k * 46, 10 + k * 32, 0, 0, 7); c.stroke(); c.restore(); }
}
