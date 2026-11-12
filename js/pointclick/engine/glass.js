/* « La vitre de l'écran » : rarement et au hasard, quelque chose salit l'écran du joueur (mouche posée ou écrasée, éternuement du héros ou d'un personnage,
   fiente d'oiseau) puis le héros vient le nettoyer, de façon différente à chaque fois (chiffon, feuille de chou, plumeau, manche d'armure). */
import { snd } from './sound.js';
import { pickPose } from './night.js';
const W = 480, H = 270, R = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
const ease = k => k * k * (3 - 2 * k);

/* ───── salissures ───── */
function splat(gl, kind, x, y) {
  const S = gl.stains;
  if (kind === 'fly') {
    S.push({ x, y, r: 4.6, col: '#4c3010', a: 1 }); for (let i = 0; i < 9; i++) { const a = R(0, 6.28), d = R(3, 11); S.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: R(0.8, 2.4), col: i % 3 ? '#d9c24c' : '#8a6a30', a: 1 }); }
    for (const dx of [-5, 5]) S.push({ x: x + dx, y: y - 4, r: 2.6, col: 'rgba(210,210,220,0.8)', a: 1 }); gl.drips.push({ x, y: y + 4, len: 0, max: R(14, 30), spd: R(3, 6), col: '#7a5a20', a: 1 });
  } else if (kind === 'snot') {
    for (let i = 0; i < 52; i++) { const a = R(0, 6.28), d = Math.abs((Math.random() + Math.random() + Math.random() - 1.5)) * 62; S.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.8, r: R(1.2, 4.6), col: i % 4 ? 'rgba(170,215,110,0.95)' : 'rgba(240,245,230,0.95)', a: 1 }); }
    for (let i = 0; i < 4; i++) S.push({ x: x + R(-14, 14), y: y + R(-10, 10), r: R(6, 10), col: 'rgba(165,210,105,0.95)', a: 1 });
    for (let i = 0; i < 4; i++) gl.drips.push({ x: x + R(-26, 26), y: y + R(-6, 8), len: 0, max: R(24, 60), spd: R(5, 11), col: 'rgba(185,222,140,0.75)', a: 1 });
  } else if (kind === 'bird') {
    S.push({ x, y, r: 8, col: '#f4f4ea', a: 1 }); S.push({ x: x + 1, y: y + 1, r: 3.4, col: '#4a3a2a', a: 1 }); for (let i = 0; i < 8; i++) { const a = R(0, 6.28), d = R(8, 18); S.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: R(1, 2.6), col: '#efefe4', a: 1 }); }
    gl.drips.push({ x: x + 2, y: y + 6, len: 0, max: R(36, 70), spd: R(6, 10), col: '#f0f0e4', a: 1 });
  }
  snd.splat && snd.splat();
}

/* ───── la mouche ───── */
function flyDraw(c, f, t) {
  c.save(); c.translate(f.x, f.y); const s = f.s; c.fillStyle = '#15110e';
  const flap = f.mode === 'fly' || f.mode === 'crash' ? Math.sin(t * 90) : Math.sin(t * 8) * 0.2;
  c.globalAlpha = 0.45; c.fillStyle = '#c8d4e0'; c.beginPath(); c.ellipse(-2 * s, -2.5 * s - flap * s, 3.2 * s, 1.5 * s, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(2 * s, -2.5 * s + flap * s, 3.2 * s, 1.5 * s, 0.5, 0, 7); c.fill();
  c.globalAlpha = 1; c.fillStyle = '#15110e'; c.beginPath(); c.ellipse(0, 0, 2.3 * s, 3.2 * s, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -3.6 * s, 1.5 * s, 0, 7); c.fill();
  c.fillStyle = '#b02a20'; c.fillRect(-1.4 * s, -4.1 * s, 0.9 * s, 0.9 * s); c.fillRect(0.5 * s, -4.1 * s, 0.9 * s, 0.9 * s);
  c.strokeStyle = '#15110e'; c.lineWidth = 0.6 * s; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 1.5 * s, -0.5 * s); c.lineTo(d * 3.8 * s, 1.6 * s + (f.mode === 'land' ? Math.sin(t * 9 + d) * 0.8 * s : 0)); c.stroke(); }
  c.restore();
}

/* ───── le héros derrière la vitre, et ce qui sert à nettoyer ───── */
function ragDraw(c, rag, t) {
  c.save(); c.translate(rag.x, rag.y); c.rotate(Math.sin(t * 14) * 0.18);
  if (rag.kind === 'leaf') { c.fillStyle = '#6fa63c'; c.beginPath(); c.moveTo(-26, 4); c.quadraticCurveTo(-8, -26, 28, -6); c.quadraticCurveTo(8, 20, -26, 4); c.fill(); c.strokeStyle = '#d6efa0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-22, 3); c.lineTo(24, -5); c.stroke(); }
  else if (rag.kind === 'duster') { c.fillStyle = '#7a5434'; c.fillRect(-4, 6, 8, 34); for (let i = 0; i < 14; i++) { const a = -1.1 + i * 0.17; c.strokeStyle = i % 2 ? '#e8e0cc' : '#c9bda0'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 8); c.lineTo(Math.sin(a) * 30, 8 - Math.cos(a) * 26); c.stroke(); } }
  else if (rag.kind === 'sleeve') { c.fillStyle = '#6b4a2a'; c.beginPath(); c.roundRect(-30, -14, 60, 28, 12); c.fill(); c.fillStyle = '#9a7a52'; for (let i = -24; i < 26; i += 7) c.fillRect(i, -14 + (i % 2 ? 2 : 0), 3, 8); c.fillStyle = '#8c8c94'; c.fillRect(24, -14, 8, 28); }
  else { c.fillStyle = '#d8d6cc'; c.beginPath(); c.roundRect(-24, -17, 48, 34, 9); c.fill(); c.strokeStyle = '#b4b2a6'; c.lineWidth = 1; for (const x of [-10, 2, 14]) { c.beginPath(); c.moveTo(x, -14); c.lineTo(x + 3, 14); c.stroke(); } }
  c.restore();
}

function heroFace(g, c, run, k, t) {
  const pose = run.pose, key = { talk: 'hero.pTalk', sleepy: 'hero.pSleepy', knock: 'hero.pKnock1', blink: 'hero.pBlink' }[pose] || 'hero.pNeutral', talking = run.say && run.say.au && !run.say.au.paused && !run.say.au.ended;
  const base = run.p && (pose === 'neutral' || pose === 'talk') ? 'hero.p' + run.p : null, fl = talking && Math.floor(t * 7) % 2;
  const im = (base && g.spr(base) ? g.spr(fl && g.spr(base + 'T') ? base + 'T' : base) : g.spr(fl && pose !== 'sleepy' ? 'hero.pTalk' : key)) || g.spr('hero.pNeutral'); if (!im) return;
  const am = talking ? 1.7 : 1, sc = 0.82 * (1 + 0.012 * Math.sin(t * 1.7)), y = H * 0.74 + (1 - k) * 180 + Math.sin(t * 2.1) * 2 * am; c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = Math.min(1, k * 1.4); c.translate(W / 2 + Math.sin(t * 1.3) * 3 * am, y); c.rotate(Math.sin(t * 0.9) * 0.025 * am); c.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc); c.restore();
}

function say(g, run, key) {
  const text = g.T(key), idx = g.T.idx, b = document.createElement('div'); b.className = 'pc-b pc-nightb'; b.textContent = text; b.style.color = '#ffe08a'; g.ov.append(b); g.placeBubble(b, W / 2, 40);
  run.p = pickPose(g, run.p); const au = g.voicePlay(key, idx), s = { b, au, end: g.now + Math.max(2.2, text.length * 0.065) };
  if (au) au.addEventListener('loadedmetadata', () => { s.end = Math.max(s.end, g.now + au.duration + 0.25); }); run.say = s;
}

/* ───── les scénettes : suites d'étapes {w: attente} {say} {fn} {hero:'in'|'out'} {rag: true} ───── */
const SC = {
  flySwat: () => [{ fn: (g, r) => spawnFly(g, 'wander') }, { w: 6.5 }, { fn: g => landFly(g) }, { w: 1.8 }, { hero: 'in' }, { say: 'clean.fly.1', pose: 'talk' }, { fn: (g, r) => { r.pose = 'knock'; } }, { w: 0.35 },
    { fn: (g, r) => { const f = g.gl.fly; if (f) { splat(g.gl, 'fly', f.x, f.y); g.gl.fly = null; } g.shake(220, 2.4); } }, { w: 0.5 }, { fn: (g, r) => { r.pose = 'sleepy'; } }, { say: 'clean.fly.2' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  flyCrash: () => [{ fn: (g, r) => spawnFly(g, 'crash') }, { w: 3.4 }, { hero: 'in' }, { say: 'clean.fly.crash', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  flyAway: () => [{ fn: (g, r) => spawnFly(g, 'wander') }, { w: 6 }, { fn: g => landFly(g) }, { w: 2 }, { hero: 'in' }, { say: 'clean.fly.1', pose: 'talk' }, { fn: g => { g.sfx('whoosh'); } }, { w: 0.6 }, { fn: g => { const f = g.gl.fly; if (f) { f.mode = 'off'; f.vx = R(-160, 160); f.vy = R(-200, -80); } } }, { w: 1.2 }, { say: 'clean.fly.4', pose: 'neutral' }, { hero: 'out' }],
  sneezeHero: () => [{ hero: 'in' }, { say: 'clean.sneeze.a', pose: 'sleepy' }, { fn: (g, r) => { r.pose = 'talk'; splat(g.gl, 'snot', R(150, 330), R(50, 120)); g.shake(300, 3.5); } }, { say: 'clean.sneeze.b' }, { w: 0.5 }, { fn: (g, r) => { r.pose = 'neutral'; } }, { say: 'clean.sneeze.2' }, { rag: true }, { say: 'clean.done' }, { hero: 'out' }],
  sneezeNpc: () => [{ fn: (g, r) => { const e = g.ents.filter(x => !x.isHero && x.hot && x.visible !== false && !x.noHot)[0]; r.npc = e && e.id; if (e) g.bark(e.id, 'clean.npc.sneeze', 2200, true); else r.skip = true; } }, { w: 1.8 }, { fn: (g, r) => { splat(g.gl, 'snot', R(130, 350), R(50, 120)); g.shake(300, 3.5); } }, { w: 1.4 }, { hero: 'in' }, { say: 'clean.sneeze.2', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  bird: () => [{ fn: (g, r) => { r.bird = { t0: g.now, x: R(80, 400), y0: R(30, 80) }; } }, { w: 2.1 }, { fn: (g, r) => { const b = r.bird; splat(g.gl, 'bird', b.x, b.y0 + 10); r.bird = null; g.shake(160, 1.6); } }, { w: 1 }, { hero: 'in' }, { say: 'clean.bird.1', pose: 'talk' }, { rag: 'duster' }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }]
};
const IDS = Object.keys(SC);

function spawnFly(g, mode) { g.gl.fly = { x: mode === 'crash' ? R(120, 360) : R(-10, 490), y: mode === 'crash' ? R(50, 130) : R(20, 250), vx: R(-90, 90), vy: R(-70, 70), s: mode === 'crash' ? 0.6 : 1.4, mode, t: 0, buzz: 0, tx: R(80, 400), ty: R(60, 200) }; }
function landFly(g) { const f = g.gl.fly; if (f) { f.mode = 'land'; f.vx = f.vy = 0; f.s = 2.6; f.x = R(120, 360); f.y = R(40, 130); } }

export function updateGlass(g, dt) {
  const gl = g.gl || (g.gl = { stains: [], drips: [], fly: null, run: null, bird: null, at: undefined });
  if (gl.at === undefined) gl.at = g.now + 220 + R(0, 140);
  for (const d of gl.drips) { if (d.len < d.max) d.len += d.spd * dt; }
  const f = gl.fly;
  if (f) {
    f.t += dt; g.now - f.buzz > 0.35 && f.mode !== 'land' && (f.buzz = g.now, snd.buzz && snd.buzz());
    if (f.mode === 'wander') { f.vx += (f.tx - f.x) * dt * 2 + R(-60, 60) * dt * 8; f.vy += (f.ty - f.y) * dt * 2 + R(-60, 60) * dt * 8; f.vx = Math.max(-170, Math.min(170, f.vx)); f.vy = Math.max(-170, Math.min(170, f.vy)); f.x += f.vx * dt; f.y += f.vy * dt; if (Math.random() < dt * 0.6) { f.tx = R(60, 420); f.ty = R(40, 230); } f.s = 1.4 + Math.sin(f.t * 2) * 0.6; }
    else if (f.mode === 'crash') { f.s += dt * 4.8; f.x += Math.sin(f.t * 12) * 2; f.y += dt * 6; if (f.s > 4.8) { splat(gl, 'fly', f.x, f.y); g.shake(260, 3); gl.fly = null; } }
    else if (f.mode === 'off') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 40 * dt; f.s *= 1 - dt * 0.8; if (f.y < -20 || f.s < 0.2) gl.fly = null; }
    else if (f.mode === 'land' && Math.random() < dt * 0.7) { f.x += R(-6, 6); f.y += R(-4, 4); }
  }
  /* rag : zigzag sur les salissures, qui s'effacent au passage */
  const run = gl.run;
  if (run) runGlass(g, gl, run, dt);
  else if (gl.stains.length && !gl.run) { /* salissures orphelines : on les nettoie dès que possible */ if (idle(g)) start(g, gl, 'sneezeHero', true); }
  else if (g.now >= gl.at && idle(g) && !g.wk?.run) { const id = pick(IDS); start(g, gl, id); }
}
function idle(g) { return g.started && !g.titleEl && !g.night && !g.locked && !g.bubbles.length && !g.barks.length && !g.narr && !g.nq.length && !g.hiBusy() && !g.lowBusy(); }
function start(g, gl, id, orphan) {
  const run = { id, q: SC[id]().slice(), cur: null, t0: g.now, hk: 0, hdir: 0, pose: 'neutral', say: null, rag: null, kind: id === 'bird' ? 'duster' : pick(['rag', 'rag', 'leaf', 'duster', 'sleeve']), wait: 0 };
  if (orphan) { run.q = [{ hero: 'in' }, { say: 'clean.sneeze.2', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }]; }
  gl.run = run;
}
function runGlass(g, gl, run, dt) {
  const now = g.now;
  if (run.hdir) { run.hk = Math.max(0, Math.min(1, run.hk + run.hdir * dt / 0.8)); if (run.hk === 0 || run.hk === 1) run.hdir = 0; }
  if (run.say) { const s = run.say, playing = s.au && !s.au.paused && !s.au.ended && !s.au.error; if (now > s.end && !playing) { s.b.remove(); run.say = null; } else return; }
  if (run.rag) return ragStep(g, gl, run, dt);
  if (run.wait > 0) { run.wait -= dt; return; }
  if (run.hdir) return;
  const it = run.q.shift(); if (!it) { finish(g, gl, run); return; }
  if (it.w) run.wait = it.w;
  else if (it.hero) { run.hdir = it.hero === 'in' ? 1 : -1; if (it.hero === 'in') { g.clearBarks(); g.hushNarr(); } }
  else if (it.say) { if (it.pose) run.pose = it.pose; say(g, run, it.say); }
  else if (it.fn) it.fn(g, run);
  else if (it.rag) { run.kind = typeof it.rag === 'string' ? it.rag : run.kind; run.q.unshift({ rag2: 1 }); say(g, run, 'clean.with.' + run.kind); }
  else if (it.rag2) { if (!gl.stains.length) { run.rag = null; return; } run.rag = { x: -30, y: 140, kind: run.kind, path: null, i: 0 }; const S = gl.stains; const xs = S.map(s => s.x), ys = S.map(s => s.y); const x0 = Math.max(40, Math.min(...xs) - 30), x1 = Math.min(440, Math.max(...xs) + 30), y0 = Math.max(30, Math.min(...ys) - 24), y1 = Math.min(240, Math.max(...ys) + 40); const p = []; let dir = 1; for (let y = y0; y <= y1 + 1; y += 34) { p.push(dir > 0 ? [x0, y] : [x1, y], dir > 0 ? [x1, y] : [x0, y]); dir = -dir; } p.push([W + 60, 140]); run.rag.path = p; }
  if (run.skip) { run.q.length = 0; }
}
function ragStep(g, gl, run, dt) {
  const r = run.rag, p = r.path[r.i]; if (!p) { run.rag = null; return; }
  const dx = p[0] - r.x, dy = p[1] - r.y, d = Math.hypot(dx, dy), st = 190 * dt; if (d <= st) { r.x = p[0]; r.y = p[1]; r.i++; snd.squeak && snd.squeak(); } else { r.x += dx / d * st; r.y += dy / d * st; }
  for (const s of gl.stains) if (Math.hypot(s.x - r.x, s.y - r.y) < 30) s.a = Math.max(0, s.a - dt * 7);
  for (const q of gl.drips) if (Math.hypot(q.x - r.x, q.y + q.len / 2 - r.y) < 34) q.a = Math.max(0, q.a - dt * 7);
  gl.stains = gl.stains.filter(s => s.a > 0.02); gl.drips = gl.drips.filter(s => s.a > 0.02);
}
function finish(g, gl, run) { gl.run = null; gl.stains = []; gl.drips = []; gl.fly = null; gl.at = g.now + 360 + R(0, 300); if (run.say) run.say.b.remove(); }

export function drawGlass(g, c) {
  const gl = g.gl; if (!gl) return; const t = g.now;
  for (const d of gl.drips) { if (d.len < 1) continue; c.save(); c.globalAlpha = 0.6 * d.a; c.strokeStyle = d.col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x, d.y + d.len); c.stroke(); c.fillStyle = d.col; c.beginPath(); c.arc(d.x, d.y + d.len, 2.4, 0, 7); c.fill(); c.restore(); }
  for (const s of gl.stains) { c.save(); c.globalAlpha = 0.95 * s.a; c.fillStyle = s.col; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); c.globalAlpha = 0.55 * s.a; c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x - s.r * 0.35, s.y - s.r * 0.4, Math.max(0.5, s.r * 0.28), 0, 7); c.fill(); c.restore(); }
  const run = gl.run;
  if (run && run.hk > 0) heroFace(g, c, run, ease(run.hk), t);
  if (gl.fly) flyDraw(c, gl.fly, t);
  if (run && run.bird) { const b = run.bird, u = (t - b.t0) / 2.1; if (u < 1) { c.save(); c.fillStyle = '#16120e'; const x = -30 + (b.x + 30) * u, y = b.y0 + 10 * u * u - Math.sin(u * 8) * 3, f = Math.sin(t * 30) * 4 * (1 - u); c.translate(x, y); c.scale(1 + u * 1.8, 1 + u * 1.8); c.beginPath(); c.ellipse(0, 0, 5, 2.4, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-1, 0); c.lineTo(-7, -6 - f); c.lineTo(2, 0); c.fill(); c.beginPath(); c.moveTo(-1, 0); c.lineTo(-7, 6 + f); c.lineTo(2, 0); c.fill(); c.restore(); } }
  if (run && run.rag) ragDraw(c, run.rag, t);
}
export function playGlass(g, id) { const gl = g.gl || (g.gl = { stains: [], drips: [], fly: null, run: null, bird: null, at: undefined }); gl.run = null; gl.stains = []; gl.drips = []; gl.fly = null; start(g, gl, id); }
export const GLASS_IDS = IDS;
