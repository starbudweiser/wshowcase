/* « La vitre de l'écran » : rarement et au hasard, quelque chose salit l'écran du joueur (mouche posée ou écrasée, éternuement du héros ou d'un personnage,
   fiente d'oiseau) puis le héros vient le nettoyer, de façon différente à chaque fois : paume en cercles, chiffon en zigzag, feuille de chou en éponge,
   plumeau par petits coups, avant-bras en longs passages, bout du doigt qui frotte, buée soufflée puis frottée.
   Le héros est ENTIER, de face, derrière la vitre (18/11/2026, plus de bras coupé) : poses FLUX où la main ou l'ustensile est plaqué contre le verre
   (tools/gen_hero_clean.sh, détourées par tools/hero_clean_sprites.py). Il glisse tout entier sous les taches ; à chaque instant la pose retenue est celle
   qui amène le point de contact sur la tache en gardant le héros le plus près du centre de l'écran. Il parle avec les portraits de nuit, alignés sur son visage. */
import { snd } from './sound.js';
import { pickPose } from './night.js';
import { HERO_N } from '../data/sheets.js';
import { CLEAN } from '../data/clean.js';
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

/* ───── le héros derrière la vitre ───── */
const FW = 61;                                    /* largeur du visage à l'écran : celle du portrait de nuit, et celle de toutes les poses de nettoyage */
const HOME = [W / 2, 112];                        /* où se tient son visage quand il parle */
const PN = HERO_N.nNeutral, PSC = FW / PN[2];     /* portraits de nuit (même cadrage pour tous) : visage et échelle */
const FIST = [95 - PN[0], 161 - PN[1]];           /* poing contre la vitre (hero_nKnockC), par rapport au visage, en pixels du portrait */
const KINDS = {   /* façon de frotter, rayon nettoyé, vitesse du point de contact */
  palm: { move: 'circles', r: 30, v: 150 }, rag: { move: 'zigzag', r: 30, v: 180 }, leaf: { move: 'zigzag', r: 32, v: 140 }, duster: { move: 'flicks', r: 26, v: 260 },
  sleeve: { move: 'strokes', r: 36, v: 200 }, finger: { move: 'scrape', r: 13, v: 110 }, breath: { move: 'circles', r: 34, v: 140 }
};
const TOOL = k => (k === 'breath' ? 'palm' : k);  /* après la buée, il frotte à la paume */
const POSES = {}; for (const n of Object.keys(CLEAN)) { const t = n.split('_')[0]; (POSES[t] = POSES[t] || []).push(n); }
const cpath = n => `assets/pointclick/spr/hc_${n}.png`;
function cimg(g, n) { const i = g.imgs[cpath(n)]; return i && i.width ? i : null; }
function loadClean(g) { if (g.hcLoad) return; g.hcLoad = 1; for (const n of Object.keys(CLEAN)) g.img(cpath(n)); }   /* chargées en tâche de fond, pas au démarrage */
function ready(g, k) { const L = POSES[TOOL(k)] || []; return L.length > 0 && L.every(n => cimg(g, n)) && (k !== 'breath' || ['breath_a', 'breath_b'].every(n => CLEAN[n] && cimg(g, n))); }
function off(run, n) { const m = CLEAN[n], mx = run.mirror ? -1 : 1; return [mx * (m[2] - m[0]), m[3] - m[1]]; }   /* contact par rapport au visage, à l'écran */
/* plus haut que ça, le bas du buste (coupé à la taille dans l'image) apparaîtrait au-dessus du bord de l'écran : jamais de héros tronqué */
function minFY(g, n) { const im = cimg(g, n); return im ? H + 2 - (im.height - CLEAN[n][1]) : -1e9; }
function glide(run, tx, ty, dt, k) { const a = 1 - Math.exp(-dt * (k || 14)); run.F[0] += (tx - run.F[0]) * a; run.F[1] += (ty - run.F[1]) * a; }

function heroDraw(g, c, run, k, t) {
  const mx = run.mirror ? -1 : 1, lift = (1 - k) * 180;
  let im = null, fx, fy, sc;
  if (run.cl && cimg(g, run.cl)) { im = cimg(g, run.cl); [fx, fy] = CLEAN[run.cl]; sc = 1; }
  else {
    const talking = run.say && run.say.au && !run.say.au.paused && !run.say.au.ended, fl = talking && Math.floor(t * 7) % 2;
    let key;
    if (run.pose === 'knock') { const tk = t - (run.kt || t); key = tk < 0.25 ? 'KnockA' : tk < 0.33 ? 'KnockB' : 'KnockC'; }   /* élan, coup, poing contre la vitre */
    else if (run.pose === 'sleepy') key = 'Blink';
    else {
      const base = run.p && (run.pose === 'neutral' || run.pose === 'talk') ? run.p : null;
      if (base !== run.pb) { run.pb = base; run.pbT = t; }
      key = base && g.spr('hero.n' + base) ? (t - run.pbT < 0.14 && g.spr('hero.n' + base + 'A') ? base + 'A' : base) : fl ? 'Talk' : t % 3.7 < 0.14 ? 'Blink' : 'Neutral';
    }
    im = g.spr('hero.n' + key) || g.spr('hero.nNeutral'); fx = PN[0]; fy = PN[1]; sc = PSC;
  }
  if (!im) return;
  c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = Math.min(1, k * 1.4);
  c.translate(Math.round(run.F[0]), Math.round(run.F[1] + lift)); c.scale(mx * sc, sc); c.drawImage(im, -fx, -fy); c.restore();
}

/* trajet du point de contact sur les salissures, selon la façon de frotter */
function handPath(kind, S, fog) {
  const pts = S.map(s => [s.x, s.y]).concat(fog ? [[fog.x, fog.y]] : []), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.max(40, Math.min(...xs) - 30), x1 = Math.min(440, Math.max(...xs) + 30), y0 = Math.max(30, Math.min(...ys) - 24), y1 = Math.min(240, Math.max(...ys) + 40), p = [];
  const big = pts.filter((q, i) => !S[i] || S[i].r > 3.2);                 /* taches principales */
  const M = KINDS[kind].move;
  if (M === 'zigzag') { let dir = 1; for (let y = y0; y <= y1 + 1; y += 30) { p.push(dir > 0 ? [x0, y] : [x1, y], dir > 0 ? [x1, y] : [x0, y]); dir = -dir; } }
  else if (M === 'strokes') { for (let y = y0; y <= y1 + 1; y += 36) p.push([x0 - 20, y], [x1 + 20, y + 6], [x0 - 20, y + 12]); }
  else if (M === 'circles') { for (let y = y0; y <= y1 + 1; y += 40) for (let x = x0; x <= x1 + 1; x += 44) for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2; p.push([x + Math.cos(a) * 18, y + Math.sin(a) * 14]); } }
  else if (M === 'flicks') { for (const q of (big.length ? big : pts)) for (let k = 0; k < 4; k++) p.push([q[0] - 16, q[1] + (k % 2 ? 8 : -8)], [q[0] + 16, q[1] + (k % 2 ? -8 : 8)]); }
  else if (M === 'scrape') { for (const q of (big.length ? big : pts).slice(0, 5)) for (let k = 0; k < 3; k++) p.push([q[0] - 10, q[1] - 6 + k * 6], [q[0] + 10, q[1] - 6 + k * 6]); for (let y = y0; y <= y1 + 1; y += 34) p.push([x0, y], [x1, y]); }
  return p;
}

function say(g, run, key) {
  const text = g.T(key), idx = g.T.idx, b = document.createElement('div'); b.className = 'pc-b pc-nightb'; b.textContent = text; b.style.color = '#ffe08a'; g.ov.append(b); g.placeBubble(b, W / 2, 40);
  run.p = pickPose(g, run.p); const au = g.voicePlay(key, idx), s = { b, au, end: g.now + Math.max(2.2, text.length * 0.065) };
  if (au) au.addEventListener('loadedmetadata', () => { s.end = Math.max(s.end, g.now + au.duration + 0.25); }); run.say = s;
}

/* ───── les scénettes : suites d'étapes {w: attente} {say} {fn} {hero:'in'|'out'} {rag: true} ───── */
const pMinY = g => { const im = g.spr('hero.nNeutral'); return im ? H + 2 - (im.height - PN[1]) * PSC : HOME[1]; };   /* portrait : plus haut, le bas du buste apparaîtrait */
const knock = (g, r) => { r.pose = 'knock'; r.kt = g.now; const f = g.gl.fly; if (f) { const mx = f.x > W / 2 ? -1 : 1; r.mirror = mx < 0; r.FT = [f.x - mx * FIST[0] * PSC, Math.max(f.y - FIST[1] * PSC, pMinY(g))]; } };   /* il amène son poing sur la mouche */
const SC = {
  flySwat: () => [{ fn: (g, r) => spawnFly(g, 'wander') }, { w: 6.5 }, { fn: g => landFly(g) }, { w: 1.8 }, { hero: 'in' }, { say: 'clean.fly.1', pose: 'talk' }, { fn: knock }, { w: 0.33 },
    { fn: (g, r) => { const f = g.gl.fly; if (f) { splat(g.gl, 'fly', f.x, f.y); g.gl.fly = null; } g.shake(220, 2.4); } }, { w: 0.5 }, { fn: (g, r) => { r.pose = 'sleepy'; r.FT = null; } }, { say: 'clean.fly.2' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  flyCrash: () => [{ fn: (g, r) => spawnFly(g, 'crash') }, { w: 3.4 }, { hero: 'in' }, { say: 'clean.fly.crash', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  flyAway: () => [{ fn: (g, r) => spawnFly(g, 'wander') }, { w: 6 }, { fn: g => landFly(g) }, { w: 2 }, { hero: 'in' }, { say: 'clean.fly.1', pose: 'talk' }, { fn: g => { g.sfx('whoosh'); } }, { w: 0.6 }, { fn: g => { const f = g.gl.fly; if (f) { f.mode = 'off'; f.vx = R(-160, 160); f.vy = R(-200, -80); } } }, { w: 1.2 }, { say: 'clean.fly.4', pose: 'neutral' }, { hero: 'out' }],
  sneezeHero: () => [{ hero: 'in' }, { say: 'clean.sneeze.a', pose: 'sleepy' }, { fn: (g, r) => { r.pose = 'talk'; splat(g.gl, 'snot', R(150, 330), R(50, 120)); g.shake(300, 3.5); } }, { say: 'clean.sneeze.b' }, { w: 0.5 }, { fn: (g, r) => { r.pose = 'neutral'; } }, { say: 'clean.sneeze.2' }, { rag: true }, { say: 'clean.done' }, { hero: 'out' }],
  sneezeNpc: () => [{ fn: (g, r) => { const e = g.ents.filter(x => !x.isHero && x.hot && x.visible !== false && !x.noHot)[0]; r.npc = e && e.id; if (e) g.bark(e.id, 'clean.npc.sneeze', 2200, true); else r.skip = true; } }, { w: 1.8 }, { fn: (g, r) => { splat(g.gl, 'snot', R(130, 350), R(50, 120)); g.shake(300, 3.5); } }, { w: 1.4 }, { hero: 'in' }, { say: 'clean.sneeze.2', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }],
  bird: () => [{ fn: (g, r) => { r.bird = { t0: g.now, x: R(80, 400), y0: R(30, 80) }; } }, { w: 2.1 }, { fn: (g, r) => { const b = r.bird; splat(g.gl, 'bird', b.x, b.y0 + 10); r.bird = null; g.shake(160, 1.6); } }, { w: 1 }, { hero: 'in' }, { say: 'clean.bird.1', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }]
};
const IDS = Object.keys(SC);

function spawnFly(g, mode) { g.gl.fly = { x: mode === 'crash' ? R(120, 360) : R(-10, 490), y: mode === 'crash' ? R(50, 130) : R(20, 250), vx: R(-90, 90), vy: R(-70, 70), s: mode === 'crash' ? 0.6 : 1.4, mode, t: 0, buzz: 0, tx: R(80, 400), ty: R(60, 200) }; }
function landFly(g) { const f = g.gl.fly; if (f) { f.mode = 'land'; f.vx = f.vy = 0; f.s = 2.6; f.x = R(110, 370); f.y = R(188, 226); } }   /* dans la moitié basse : à portée du poing sans que le héros monte (buste entier) */

export function updateGlass(g, dt) {
  const gl = g.gl || (g.gl = { stains: [], drips: [], fly: null, run: null, bird: null, at: undefined });
  if (g.started) loadClean(g);
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
  const run = gl.run;
  if (run) runGlass(g, gl, run, dt);
  else if (gl.stains.length && !gl.run) { /* salissures orphelines : on les nettoie dès que possible */ if (idle(g)) start(g, gl, 'sneezeHero', true); }
  else if (g.now >= gl.at && idle(g) && !g.wk?.run) { const id = pick(IDS); start(g, gl, id); }
}
function idle(g) { return g.started && !g.titleEl && !g.night && !g.locked && !g.bubbles.length && !g.barks.length && !g.narr && !g.nq.length && !g.hiBusy() && !g.lowBusy(); }
function start(g, gl, id, orphan) {
  const ok = Object.keys(KINDS).filter(k => ready(g, k)), kinds = id === 'bird' ? ['finger', 'duster', 'rag'].filter(k => ok.includes(k)) : ok;
  if (!kinds.length) { gl.at = g.now + 20; return; }                     /* poses pas encore chargées : on réessaie plus tard */
  const run = { id, q: SC[id]().slice(), cur: null, t0: g.now, hk: 0, hdir: 0, pose: 'neutral', say: null, rag: null, blow: null, cl: null, F: HOME.slice(), FT: null,
    mirror: Math.random() < 0.5, kind: pick(kinds), wait: 0 };
  if (orphan) { run.q = [{ hero: 'in' }, { say: 'clean.sneeze.2', pose: 'talk' }, { rag: true }, { say: 'clean.done', pose: 'neutral' }, { hero: 'out' }]; }
  gl.run = run;
}
function runGlass(g, gl, run, dt) {
  const now = g.now;
  if (run.hdir) { run.hk = Math.max(0, Math.min(1, run.hk + run.hdir * dt / 0.8)); if (run.hk === 0 || run.hk === 1) run.hdir = 0; }
  if (!run.rag && !run.blow) { const T = run.FT || HOME; glide(run, T[0], Math.max(T[1], pMinY(g)), dt, run.FT ? 22 : 6); }   /* au repos, il revient au centre ; pour frapper, il amène son poing */
  if (run.blow) return blowStep(g, gl, run, dt);
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
  else if (it.rag2) {
    if (!gl.stains.length) { run.rag = null; return; }
    const S = gl.stains, cx = S.reduce((a, q) => a + q.x, 0) / S.length, cy = S.reduce((a, q) => a + q.y, 0) / S.length;
    run.mirror = cx > W / 2;                                                  /* il frotte avec la main du côté des taches */
    if (run.kind === 'breath' && !gl.fog) { run.blow = { t0: now, x: cx, y: cy }; return; }   /* il souffle d'abord de la buée */
    const path = handPath(run.kind, S, gl.fog);
    run.rag = { x: path[0][0], y: path[0][1], kind: run.kind, path, i: 0 };
  }
  if (run.skip) { run.q.length = 0; }
}
function blowStep(g, gl, run, dt) {   /* joues gonflées, puis il souffle sur les taches : la buée naît devant sa bouche */
  const b = run.blow, u = g.now - b.t0;
  run.cl = u < 0.55 ? 'breath_a' : 'breath_b'; const o = off(run, run.cl); glide(run, b.x - o[0], Math.max(b.y - o[1], minFY(g, run.cl)), dt);
  if (u >= 0.55 && !gl.fog) { gl.fog = { x: b.x, y: b.y, r: 70, a: 0, grow: 1 }; snd.whoosh && snd.whoosh(); }
  if (u >= 1.7) { run.blow = null; run.cl = null; run.q.unshift({ rag2: 1 }); }
}
function ragStep(g, gl, run, dt) {
  const r = run.rag, K = KINDS[r.kind], p = r.path[r.i];
  if (!p) { run.rag = null; run.cl = null; gl.fog = null; gl.stains = []; gl.drips = []; return; }
  const dx = p[0] - r.x, dy = p[1] - r.y, d = Math.hypot(dx, dy), st = K.v * dt;
  if (d <= st) { r.x = p[0]; r.y = p[1]; r.i++; if (r.i % 2) snd.squeak && snd.squeak(); } else { r.x += dx / d * st; r.y += dy / d * st; }
  /* pose : celle qui pose le contact sur (r.x, r.y) avec le visage le plus près du centre ; on n'en change que si c'est nettement mieux */
  const cost = n => { const o = off(run, n), ty = r.y - o[1], lo = minFY(g, n); return Math.hypot(r.x - o[0] - HOME[0], (Math.max(ty, lo) - HOME[1]) * 1.3) + Math.max(0, lo - ty) * 8; };   /* contact hors d'atteinte sans tronquer le héros : très pénalisé */
  if (!run.cl || g.now - (run.clT || 0) > 0.16) { let best = run.cl, bc = run.cl && CLEAN[run.cl] && run.cl.startsWith(TOOL(r.kind)) ? cost(run.cl) - 14 : 1e9; for (const n of POSES[TOOL(r.kind)]) { const c = cost(n); if (c < bc) { bc = c; best = n; } } if (best !== run.cl) { run.cl = best; run.clT = g.now; } }
  const o = off(run, run.cl); glide(run, r.x - o[0], Math.max(r.y - o[1], minFY(g, run.cl)), dt, 16);
  const hx = run.F[0] + o[0], hy = run.F[1] + o[1];                           /* là où la main est vraiment plaquée */
  for (const s of gl.stains) if (Math.hypot(s.x - hx, s.y - hy) < K.r) s.a = Math.max(0, s.a - dt * 7);
  for (const q of gl.drips) if (Math.hypot(q.x - hx, q.y + q.len / 2 - hy) < K.r + 4) q.a = Math.max(0, q.a - dt * 7);
  if (gl.fog && Math.hypot(gl.fog.x - hx, gl.fog.y - hy) < gl.fog.r) gl.fog.a = Math.max(0, gl.fog.a - dt * 0.9);
  gl.stains = gl.stains.filter(s => s.a > 0.02); gl.drips = gl.drips.filter(s => s.a > 0.02);
}
function finish(g, gl, run) { gl.run = null; gl.stains = []; gl.drips = []; gl.fly = null; gl.fog = null; gl.at = g.now + 360 + R(0, 300); if (run.say) run.say.b.remove(); }

export function drawGlass(g, c) {
  const gl = g.gl; if (!gl) return; const t = g.now, run = gl.run;
  if (run && run.hk > 0) heroDraw(g, c, run, ease(run.hk), t);               /* derrière la vitre : les salissures, la buée et la mouche passent devant lui */
  for (const d of gl.drips) { if (d.len < 1) continue; c.save(); c.globalAlpha = 0.6 * d.a; c.strokeStyle = d.col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x, d.y + d.len); c.stroke(); c.fillStyle = d.col; c.beginPath(); c.arc(d.x, d.y + d.len, 2.4, 0, 7); c.fill(); c.restore(); }
  for (const s of gl.stains) { c.save(); c.globalAlpha = 0.95 * s.a; c.fillStyle = s.col; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); c.globalAlpha = 0.55 * s.a; c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x - s.r * 0.35, s.y - s.r * 0.4, Math.max(0.5, s.r * 0.28), 0, 7); c.fill(); c.restore(); }
  if (gl.fog) { const f = gl.fog; if (f.grow) { f.a = Math.min(0.7, f.a + 0.03); if (f.a >= 0.7) f.grow = 0; } c.save(); const rg = c.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r); rg.addColorStop(0, `rgba(235,240,245,${f.a})`); rg.addColorStop(1, 'rgba(235,240,245,0)'); c.fillStyle = rg; c.beginPath(); c.ellipse(f.x, f.y, f.r * 1.3, f.r, 0, 0, 7); c.fill(); c.restore(); }   /* buée */
  if (gl.fly) flyDraw(c, gl.fly, t);
  if (run && run.bird) { const b = run.bird, u = (t - b.t0) / 2.1; if (u < 1) { c.save(); c.fillStyle = '#16120e'; const x = -30 + (b.x + 30) * u, y = b.y0 + 10 * u * u - Math.sin(u * 8) * 3, f = Math.sin(t * 30) * 4 * (1 - u); c.translate(x, y); c.scale(1 + u * 1.8, 1 + u * 1.8); c.beginPath(); c.ellipse(0, 0, 5, 2.4, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-1, 0); c.lineTo(-7, -6 - f); c.lineTo(2, 0); c.fill(); c.beginPath(); c.moveTo(-1, 0); c.lineTo(-7, 6 + f); c.lineTo(2, 0); c.fill(); c.restore(); } }
}
/* lance un nettoyage précis (essais) */
export function playGlass(g, id, kind) { const gl = g.gl || (g.gl = { stains: [], drips: [], fly: null, run: null, bird: null, at: undefined }); loadClean(g); gl.run = null; gl.stains = []; gl.drips = []; gl.fly = null; start(g, gl, id); if (kind && gl.run) gl.run.kind = kind; }
export const GLASS_IDS = IDS;
