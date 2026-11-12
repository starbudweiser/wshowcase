/* Ciel animé (nuages qui dérivent, étoiles) et « mode nuit » : si le joueur ne bouge pas la souris pendant une minute, la nuit tombe par paliers,
   les personnages rentrent chez eux ou s'allongent, le héros vient parler au joueur en gros plan ; au moindre mouvement, tout redevient jour. */
import { snd } from './sound.js';
const W = 480, H = 270, SKY_H = 130, STEPS = [0.2, 0.4, 0.6, 0.78];
export const IDLE_NIGHT = 60;
const ease = k => k * k * (3 - 2 * k);
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const INANIMATE = new Set(['handcart', 'cake', 'mannequin', 'butterfly', 'cheese', 'crate']);

/* ───── ciel : zone de ciel déduite du décor (parcours depuis le bord haut), faite défiler en miroir ───── */
export function buildSky(bg) {
  try {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(bg, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, SKY_H).data, m = new Uint8Array(W * SKY_H), q = [];
    for (let i = 0; i < W; i++) { m[i] = 1; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const p = q[h], px = p % W, py = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= SKY_H) continue; const n = ny * W + nx; if (m[n]) continue;
        if (Math.abs(d[p * 4] - d[n * 4]) + Math.abs(d[p * 4 + 1] - d[n * 4 + 1]) + Math.abs(d[p * 4 + 2] - d[n * 4 + 2]) <= 40) { m[n] = 1; q.push(n); }
      }
    }
    if (q.length < 1800) return null;
    const mask = document.createElement('canvas'); mask.width = W; mask.height = SKY_H; const mx = mask.getContext('2d'), md = mx.createImageData(W, SKY_H);
    for (let i = 0; i < m.length; i++) md.data[i * 4 + 3] = m[i] ? 255 : 0; mx.putImageData(md, 0, 0);
    const strip = document.createElement('canvas'); strip.width = W; strip.height = SKY_H; strip.getContext('2d').drawImage(cv, 0, 0, W, SKY_H, 0, 0, W, SKY_H);
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = SKY_H;
    let s = 12345; const R = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const stars = []; for (let k = 0; k < 400 && stars.length < 46; k++) { const p = q[(R() * q.length) | 0]; stars.push({ x: p % W, y: (p / W) | 0, ph: R() * 6, big: R() < 0.2 }); }
    let moon = null; for (const [cx, cy] of [[410, 34], [70, 34], [240, 24], [330, 40], [150, 40]]) { let ok = true; for (let a = 0; a < 16 && ok; a++) { const px = Math.round(cx + Math.cos(a * 0.39) * 11), py = Math.round(cy + Math.sin(a * 0.39) * 11); if (!m[py * W + px]) ok = false; } if (ok) { moon = [cx, cy]; break; } }
    return { mask, strip, tmp, stars, moon, speed: 3 };
  } catch { return null; }
}
export function drawSky(c, sky, t) {
  const T = sky.tmp.getContext('2d'), s = (t * sky.speed) % (W * 2);
  T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, W, SKY_H);
  for (let k = 0; k < 3; k++) { const x = -s + k * W; if (k % 2) { T.save(); T.translate(x + W, 0); T.scale(-1, 1); T.drawImage(sky.strip, 0, 0); T.restore(); } else T.drawImage(sky.strip, x, 0); }
  T.globalCompositeOperation = 'destination-in'; T.drawImage(sky.mask, 0, 0);
  c.drawImage(sky.tmp, 0, 0);
}

/* ───── mode nuit ───── */
export function startNight(g) {
  const h = g.hero; g.clearBarks(); g.nq.length = 0;
  g.night = { t0: g.now, st: 'fall', level: 0, a: 0, hk: 0, ents: [], say: null, nextSay: 0, lineI: 0, cricket: 0, stunned: false, ct0: 0, hid: false };
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
  if (t >= 11 && !n.stunned) { n.stunned = true; h.front = true; h.back = false; h.pose = h.pose || 'hero.fSurprise'; nightSay(g, '', '…?!'); snd.jingle(); n.nextSay = now + 1.8; n.stunEnd = now + 1.6; }
  if (n.stunned && n.say && !n.say.au && now > n.say.end) endSay(g);
  if (n.stunned && n.st === 'fall' && now > n.nextSay) { n.st = 'close'; n.ct0 = now; h.pose = null; n.s0 = g.persp(h.y); n.x0 = h.x; n.y0 = h.y; }
  if (n.st === 'close') {
    n.hk = ease(Math.min(1, (now - n.ct0) / 3.2)); if (n.hk > 0.02 && !n.hid) { n.hid = true; h.visible = false; }
    if (n.say) { const playing = n.say.au && !n.say.au.ended && !n.say.au.error && !n.say.au.paused; if (now > n.say.end && !playing) { endSay(g); n.nextSay = now + (n.lineI < 3 ? 0.7 : 6.5); } }
    else if (n.hk >= 1 && now >= n.nextSay) { const key = n.lineI < 3 ? 'night.hero.' + (n.lineI + 1) : 'night.hero.r' + (1 + ((n.lineI - 3) % 3)); n.lineI++; nightSay(g, key); }
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
  if (!n.hid && !n.greeted && tw > 0.8) { n.greeted = true; g.bark('hero', 'night.hero.back', 3600, true); h.front = false; }
  for (const o of n.ents) {
    const k = Math.min(1, tw / 1.2), wob = Math.sin(g.now * 9 + o.sx) * 0.1 * (1 - Math.min(1, Math.max(0, (tw - 0.4) / 2.2)));
    if (o.mode === 'lie') o.e.nrot = o.side * Math.PI / 2 * (1 - ease(k)) + wob; else o.e.nrot = wob;
  }
  if (n.barks < 2 && tw > 0.5 + n.barks * 0.9) { const c = n.ents.filter(o => o.e.visible !== false && !(g.ent(o.e.id) === null)); const o = c[(hash(String(n.barks)) + c.length) % (c.length || 1)]; if (o) g.bark(o.e.id, 'night.wake', 2800, true); n.barks++; }
  if (tw > 3) { for (const o of n.ents) o.e.nrot = 0; g.night = null; g.lastMove = g.now; g.lastAct = g.now; h.front = false; }
}

export function drawNight(g, c) {
  const n = g.night; if (!n) return; const a = n.a, t = g.now;
  c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${255 - a * 215 | 0},${255 - a * 200 | 0},${255 - a * 120 | 0})`; c.fillRect(0, 0, W, H); c.restore();
  const sk = g.sky, va = Math.min(1, Math.max(0, (a - 0.3) / 0.4));
  if (sk && va > 0) {
    c.save(); c.globalAlpha = va; for (const s of sk.stars) { const tw = 0.6 + 0.4 * Math.sin(t * 2 + s.ph); c.globalAlpha = va * tw; c.fillStyle = '#fff8d8'; c.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1); }
    if (sk.moon) { const [mx, my] = sk.moon; c.globalAlpha = va * 0.3; c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(mx, my, 13, 0, 7); c.fill(); c.globalAlpha = va; c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(mx, my, 8, 0, 7); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(mx + 4, my - 2, 7, 0, 7); c.fill(); }
    c.restore();
  }
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
    const talking = n.say && n.say.au && !n.say.au.paused && !n.say.au.ended, pk = !(g.hero && g.spr('hero.pNeutral')) ? null : (talking && Math.floor(t * 7) % 2 ? 'hero.pTalk' : (t % 3.7 < 0.14 ? 'hero.pBlink' : 'hero.pNeutral')), pi = pk && (g.spr(pk) || g.spr('hero.pNeutral'));
    if (pi && k > 0.6) { c.globalAlpha = Math.min(1, (k - 0.6) / 0.3); const sc = Math.min(W / pi.width, H / pi.height) * 1.02; c.drawImage(pi, W / 2 - pi.width * sc / 2, H / 2 - pi.height * sc / 2 + 6, pi.width * sc, pi.height * sc); }
    c.restore();
  }
}
