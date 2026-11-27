/* Effets visuels de la saison 2, dessinés en pleine définition (canevas 960 × 540, coordonnées logiques 480 × 270).
   - Effets ponctuels (promesses résolues à la fin) : éclair du Wabbajack (arc électrique, flash, onde de choc, spirale
     d'étincelles, fumée qui masque la métamorphose), feu d'artifice (fusées à traîne, gerbes qui scintillent), choc, scintillement.
   - Effets permanents : aura des personnages (`e.aura` : halo qui respire + volutes), lumières du décor (`scene.fx.lights` :
     lanternes et fenêtres qui vacillent), reflets (`scene.fx.glints`), lucioles (`scene.fx.flies`), lueur sinistre (`pulse`).
   Lumière additive (« lighter ») et halos pré-rendus : léger même avec des centaines de particules. */
const R = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
const parts = g => g.parts || (g.parts = []);
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

/* halo radial pré-rendu par couleur (cœur vif, bord qui s'éteint) */
const cache = new Map();
function halo(col, soft) {
  const key = col + (soft ? 's' : ''); let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), [r, g, b] = rgb(col), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (soft) { gr.addColorStop(0, `rgba(${r},${g},${b},.55)`); gr.addColorStop(0.45, `rgba(${r},${g},${b},.22)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); }
  else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.4, `rgba(${r},${g},${b},.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); }
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); cache.set(key, c); return c;
}
/* bouffée de fumée pré-rendue (dégradé gris irrégulier) */

const smokeCache = {};
function smoke(tint) {   /* volute de fumée ; tint (#rrggbb) : vapeur colorée (potion) */
  const k = tint || '_'; if (smokeCache[k]) return smokeCache[k]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const rgb = tint ? [1, 3, 5].map(i => parseInt(tint.slice(i, i + 2), 16)).join(',') : '236,230,246';
  for (let i = 0; i < 7; i++) { const cx = R(22, 42), cy = R(22, 42), rr = R(12, 22), gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, `rgba(${rgb},.5)`); gr.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
  return (smokeCache[k] = c);
}

const WAB = ['#c77dff', '#ffd166', '#7dffb6', '#ff8fd8', '#9ad8ff'];

/* éclair du Wabbajack : de `o.from` (bout du bâton) vers (x, y). `o.peak` est appelé au plus épais de la fumée : c'est là
   que la scène échange les sprites (métamorphose invisible). Couleurs : `o.cols`. */
export async function zap(g, x, y, o = {}) {
  const P = parts(g), cols = o.cols || WAB, t0 = g.now;
  g.sfx('whoosh');
  if (o.from) { P.push({ k: 'bolt', a: o.from, b: [x, y], t: 0, life: 0.32, col: cols[0], seed: 0 }); await g.wait(180); }
  g.sfx('pop');
  P.push({ k: 'flash', x, y, t: 0, life: 0.35, r0: 6, r1: 46, col: cols[0] }, { k: 'ring', x, y, t: 0, life: 0.5, r0: 4, r1: 42, col: cols[1] }, { k: 'ring', x, y, t: -0.08, life: 0.55, r0: 2, r1: 30, col: cols[2] });
  for (let i = 0; i < 70; i++) { const a = R(0, TAU), v = R(30, 120), sw = R(-3, 3); P.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 15, sw, g: 50, drag: 1.6, t: 0, life: R(0.5, 1.1), s: R(0.6, 1.6), col: cols[i % cols.length], tw: Math.random() < 0.4 }); }
  for (let i = 0; i < 16; i++) { const a = R(0, TAU), d = R(0, 10); P.push({ k: 'smoke', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * R(6, 18), vy: Math.sin(a) * R(4, 12) - 6, g: -4, drag: 1.2, t: -R(0, 0.08), life: R(0.9, 1.4), s: R(9, 14), grow: R(14, 24), rot: R(0, TAU), vr: R(-1, 1) }); }
  await g.wait(260); if (o.peak) o.peak();
  await g.until(() => !P.some(p => p.k === 'spark' || p.k === 'smoke' || p.k === 'flash' || p.k === 'ring' || p.k === 'bolt') || g.now - t0 > 2.2);
}

/* feu d'artifice : n fusées qui montent avec une traîne, puis gerbes scintillantes ; `cols` = couleurs des gerbes */
export async function fireworks(g, x, y, n = 4, cols = ['#7dffb6', '#d6ff7d', '#ffffff', '#5dffd0']) {
  const P = parts(g);
  for (let k = 0; k < n; k++) {
    const tx = x + R(-60, 60), ty = Math.max(20, y - R(40, 90)), c = cols[k % cols.length];
    P.push({ k: 'rocket', x: x + R(-10, 10), y, tx, ty, t: 0, life: 0.55, col: c, trail: [] });
    g.sfx('whoosh'); await g.wait(R(260, 420));
  }
  await g.until(() => !P.some(p => p.k === 'rocket' || p.k === 'spark' || p.k === 'flash'));
}
function burst(P, x, y, col) {
  P.push({ k: 'flash', x, y, t: 0, life: 0.3, r0: 8, r1: 55, col });
  const n = 90; for (let i = 0; i < n; i++) { const a = (i / n) * TAU + R(-0.05, 0.05), v = R(55, 95) * (i % 3 ? 1 : 0.6); P.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 28, drag: 1.1, t: 0, life: R(1.1, 1.7), s: R(0.8, 1.5), col, tw: true, trail: [] }); }
}

/* petit choc (touche du duel, objet qui tombe) : étoile blanche et éclats dorés */
export function hit(g, x, y, col = '#ffe08a') {
  const P = parts(g); P.push({ k: 'flash', x, y, t: 0, life: 0.18, r0: 3, r1: 22, col: '#ffffff' }, { k: 'ring', x, y, t: 0, life: 0.3, r0: 2, r1: 16, col });
  for (let i = 0; i < 18; i++) { const a = R(0, TAU), v = R(40, 90); P.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 120, drag: 2, t: 0, life: R(0.25, 0.5), s: R(0.5, 1), col }); }
}
/* scintillement doré (objet ramassé, récompense) */
export function twinkle(g, x, y, col = '#ffe7a0') {
  const P = parts(g);
  for (let i = 0; i < 14; i++) P.push({ k: 'spark', x: x + R(-8, 8), y: y + R(-8, 6), vx: R(-8, 8), vy: R(-30, -10), g: 0, drag: 1, t: -R(0, 0.3), life: R(0.5, 0.9), s: R(0.6, 1.3), col, tw: true, star: true });
}
/* cri de dragon (« FUS RO DAH ») : ondes de choc successives qui partent vers dir (1 = droite, -1 = gauche), poussière soufflée */
export function shout(g, x, y, dir = 1) {
  const P = parts(g);
  for (let k = 0; k < 4; k++) P.push({ k: 'ring', x: x + dir * k * 6, y, t: -k * 0.09, life: 0.6, r0: 3, r1: 36 + k * 10, col: k % 2 ? '#dff4ff' : '#9fd6ff' });
  for (let i = 0; i < 40; i++) { const a = R(-0.5, 0.5) + (dir > 0 ? 0 : Math.PI), v = R(60, 160); P.push({ k: 'smoke', x: x + R(-4, 4), y: y + R(-6, 6), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5, g: 0, drag: 2.2, t: -R(0, 0.15), life: R(0.5, 0.9), s: R(2, 4), grow: R(6, 12), rot: R(0, TAU), vr: R(-2, 2) }); }
}
/* explosion (la créature verte contre le mur) : flash, ondes de choc, gerbe d'étincelles, gros nuage de fumée, blocs projetés */
export function explode(g, x, y, debris = ['#8d8d8d', '#6f6f6f', '#a8a8a8', '#4f9a3c']) {
  const P = parts(g);
  P.push({ k: 'flash', x, y, t: 0, life: 0.45, r0: 10, r1: 110, col: '#ffd27a' }, { k: 'flash', x, y, t: 0, life: 0.25, r0: 6, r1: 60, col: '#ffffff' });
  for (let k = 0; k < 3; k++) P.push({ k: 'ring', x, y, t: -k * 0.07, life: 0.6, r0: 6, r1: 70 + k * 25, col: k ? '#ffb45a' : '#ffffff' });
  for (let i = 0; i < 60; i++) { const a = R(0, TAU), v = R(60, 190); P.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g: 140, drag: 1.4, t: 0, life: R(0.4, 0.9), s: R(0.8, 1.8), col: i % 3 ? '#ffb347' : '#fff1b0' }); }
  for (let i = 0; i < 30; i++) { const a = R(-Math.PI, 0), v = R(70, 170); P.push({ k: 'conf', x: x + R(-10, 10), y: y + R(-10, 10), vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 300, drag: 0.6, t: 0, life: R(0.8, 1.4), s: R(1.6, 3.4), col: debris[i % debris.length], rot: R(0, TAU), vr: R(-10, 10) }); }
  for (let i = 0; i < 26; i++) { const a = R(0, TAU), d = R(0, 18); P.push({ k: 'smoke', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * R(10, 40), vy: Math.sin(a) * R(6, 20) - 14, g: -6, drag: 1, t: -R(0, 0.12), life: R(1.4, 2.4), s: R(10, 18), grow: R(16, 30), rot: R(0, TAU), vr: R(-0.8, 0.8) }); }
  g.sfx('clang'); g.sfx('whoosh'); g.shake(700, 6);
}
/* éclaboussure (chute dans une flaque) : gouttes bleues projetées en couronne, onde au sol, brume */
export function splash(g, x, y) {
  const P = parts(g); P.push({ k: 'ring', x, y, t: 0, life: 0.5, r0: 4, r1: 34, col: '#bfe6ff' }, { k: 'ring', x, y, t: -0.1, life: 0.6, r0: 2, r1: 24, col: '#7fc8ff' });
  for (let i = 0; i < 44; i++) { const a = R(-Math.PI * 0.95, -Math.PI * 0.05), v = R(40, 120); P.push({ k: 'spark', x: x + R(-8, 8), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 260, drag: 0.6, t: 0, life: R(0.5, 0.9), s: R(0.8, 1.6), col: i % 2 ? '#9ad8ff' : '#e6f6ff' }); }
  for (let i = 0; i < 10; i++) P.push({ k: 'smoke', x: x + R(-12, 12), y: y + R(-4, 2), vx: R(-14, 14), vy: R(-10, -2), g: 0, drag: 1.2, t: 0, life: R(0.6, 1), s: R(5, 8), grow: R(8, 14), rot: R(0, TAU), vr: R(-1, 1) });
  g.sfx('whoosh');
}
/* foudre : arc électrique du ciel vers (x1, y1), flash de tout l'écran, impact, tonnerre */
export function lightning(g, x0, y0, x1, y1) {
  const P = parts(g); P.push({ k: 'bolt', a: [x0, y0], b: [x1, y1], t: 0, life: 0.45, col: '#bcd8ff', seed: 0, big: true }, { k: 'bolt', a: [x0 + 6, y0], b: [x1, y1], t: 0.05, life: 0.35, col: '#ffffff', seed: 0, big: true });
  P.push({ k: 'flash', x: x1, y: y1, t: 0, life: 0.4, r0: 8, r1: 70, col: '#dfeaff' }, { k: 'ring', x: x1, y: y1, t: 0, life: 0.5, r0: 4, r1: 46, col: '#bcd8ff' });
  for (let i = 0; i < 30; i++) { const a = R(0, TAU), v = R(40, 130); P.push({ k: 'spark', x: x1, y: y1, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 120, drag: 1.4, t: 0, life: R(0.3, 0.7), s: R(0.6, 1.3), col: i % 2 ? '#dfeaff' : '#9ab8ff' }); }
  g.fx.sky = { t0: g.now, a: 0.85 }; g.sfx('thunder'); g.shake(500, 4);
}
/* traînées de feu au sol, de (x0, y) à (x1, y), deux sillons parallèles qui brûlent un moment */
export function fireTrails(g, x0, x1, y, gap = 10) {
  const P = parts(g), n = 40;
  for (const dy of [-gap / 2, gap / 2]) for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / n; P.push({ k: 'spark', x, y: y + dy, vx: R(-4, 4), vy: R(-26, -8), g: -10, drag: 0.6, t: -i * 0.012, life: R(1.2, 2.2), s: R(1, 2.2), col: i % 3 ? '#ff9a2a' : '#ffe08a', tw: true }); }
}
/* éclats de bois (caisse forcée, tonneau brisé) */
export function splinters(g, x, y, n = 26) {
  const P = parts(g), cols = ['#8a5a2b', '#a87440', '#6b4220', '#c9965a'];
  for (let i = 0; i < n; i++) { const a = R(-Math.PI * 0.95, -Math.PI * 0.05), v = R(50, 120); P.push({ k: 'conf', x: x + R(-8, 8), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 260, drag: 0.8, t: 0, life: R(0.6, 1.1), s: R(0.8, 1.8), col: cols[i % cols.length], rot: R(0, TAU), vr: R(-14, 14) }); }
  for (let i = 0; i < 8; i++) P.push({ k: 'smoke', x: x + R(-10, 10), y: y + R(-4, 2), vx: R(-10, 10), vy: R(-14, -4), g: 0, drag: 1.2, t: 0, life: R(0.6, 1), s: R(4, 7), grow: R(8, 14), rot: R(0, TAU), vr: R(-1, 1) });
}
/* confettis de Sheogorath : miettes de fromage et paillettes violettes qui tourbillonnent en tombant */
export function confetti(g, x, y, n = 50) {
  const P = parts(g), cols = ['#ffd166', '#f4b942', '#c77dff', '#e9a2ff', '#ff6b6b'];
  for (let i = 0; i < n; i++) { const a = R(-Math.PI, 0), v = R(40, 110); P.push({ k: 'conf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 70, drag: 1.4, t: 0, life: R(1.2, 2), s: R(1.2, 2.2), col: cols[i % cols.length], rot: R(0, TAU), vr: R(-8, 8) }); }
}

export function updateFx2(g, dt) {
  const P = g.parts;
  /* volutes des auras, lucioles : émises en continu */
  if (g.scene && g.scene.hd) emitAmbient(g, dt);
  if (!P || !P.length) return;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t < 0) continue;
    if (p.t >= p.life) { if (p.k === 'rocket') burst(P, p.tx, p.ty, p.col); P.splice(i, 1); continue; }
    if (p.k === 'rocket') { const u = p.t / p.life, e = 1 - (1 - u) * (1 - u); const nx = p.x0 ?? (p.x0 = p.x), ny = p.y0 ?? (p.y0 = p.y); p.cx = nx + (p.tx - nx) * e; p.cy = ny + (p.ty - ny) * e; p.trail.push([p.cx, p.cy]); if (p.trail.length > 12) p.trail.shift(); continue; }
    if (p.vx === undefined) continue;
    if (p.trail) { p.trail.push([p.x, p.y]); if (p.trail.length > 5) p.trail.shift(); }
    if (p.sw) { const a = p.sw * dt, c = Math.cos(a), s = Math.sin(a), vx = p.vx * c - p.vy * s; p.vy = p.vx * s + p.vy * c; p.vx = vx; }
    const d = Math.max(0, 1 - (p.drag || 0) * dt); p.vx *= d; p.vy = p.vy * d + (p.g || 0) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; if (p.grow) p.s += p.grow * dt; if (p.vr) p.rot += p.vr * dt;
  }
}
function emitAmbient(g, dt) {
  const P = parts(g), F = g.scene.fx;
  if (F && F.storm && g.now > (F._next || (F._next = g.now + 4))) {   /* orage : éclair lointain au hasard, flash du ciel, grondement */
    F._next = g.now + R(6, 14); g.fx.sky = { t0: g.now, a: R(0.35, 0.6) }; setTimeout(() => g.sfx('thunder', true), R(300, 1400));
  }
  /* braises qui montent d'un feu, vapeur d'un chaudron : sources fixes du décor (taux par seconde) */
  for (const B of (F && F.embers) || []) { B._a = (B._a || 0) + dt * (B.rate || 6); while (B._a >= 1) { B._a--; P.push({ k: 'spark', x: R(B.x - (B.w || 8), B.x + (B.w || 8)), y: B.y, vx: R(-4, 4), vy: R(-34, -16), g: -6, drag: 0.4, t: 0, life: R(0.7, 1.5), s: R(0.5, 1), col: B.col || '#ffb050', sw: R(-2.5, 2.5), tw: true }); } }
  for (const S of (F && F.steam) || []) { S._a = (S._a || 0) + dt * (S.rate || 3); while (S._a >= 1) { S._a--; P.push({ k: 'smoke', x: R(S.x - (S.w || 14), S.x + (S.w || 14)), y: S.y, vx: R(-3, 3), vy: R(-11, -6), g: -1.5, drag: 0.35, t: 0, life: R(2, 3.2), s: R(3, 5), grow: 6, rot: R(0, 6), vr: R(-0.3, 0.3), a: S.a ?? 0.35, tint: S.col }); } }
  for (const e of g.ents) {
    const A = e.aura; if (!A || e.visible === false || !A.wisps) continue;
    if ((e._wisp = (e._wisp || 0) + dt) < 1 / A.wisps) continue; e._wisp = 0;
    const r = g.entRect(e); if (!r) continue; const w = r[2] - r[0], h = r[3] - r[1], fy = e.float || 0;
    P.push({ k: 'wisp', x: R(r[0] + w * 0.15, r[2] - w * 0.15), y: R(r[1] + h * 0.3, r[3] - h * 0.05) - fy, vx: R(-4, 4), vy: R(-14, -6), g: -3, drag: 0.3, t: 0, life: R(1.2, 2.2), s: R(2, 4), col: A.col, sw: R(-1.2, 1.2) });
  }
}

/* sous les personnages : lumières et lueurs du décor, reflets, halo des auras */
export function drawFxBack(g, c) {
  const F = g.scene && g.scene.fx, t = g.now; c.save(); c.globalCompositeOperation = 'lighter';
  if (F) {
    for (const L of F.lights || []) {
      if (L.off || (L.ent && (L.ent.visible === false || L.ent.lightOff))) continue;
      const lx = L.ent ? L.ent.x : L.x, ly = L.ent ? L.ent.y - (L.ent.bob || 0) - (L.dy || 0) : L.y;   /* L.ent : lueur attachée à un acteur qui bouge (bougie flottante) */
      const fl = L.fl ?? 0.15, k = 1 - fl + fl * (0.55 + 0.25 * Math.sin(t * 9.1 + lx) + 0.2 * Math.sin(t * 23.7 + ly * 1.7));
      const r = L.r * (L.breathe ? 1 + 0.08 * Math.sin(t * (L.breathe) + lx) : 1);
      c.globalAlpha = (L.a ?? 0.8) * k; c.drawImage(halo(L.col, true), lx - r, ly - r, r * 2, r * 2);
    }
    for (const G of F.glints || []) {
      const [x0, y0, x1, y1] = G.rect; G._p = G._p || Array.from({ length: G.n || 12 }, () => ({ x: R(x0, x1), y: R(y0, y1), ph: R(0, TAU), sp: R(1.5, 3.5) }));
      for (const q of G._p) { const v = Math.sin(t * q.sp + q.ph); if (v < 0.55) { if (v < -0.95) { q.x = R(x0, x1); q.y = R(y0, y1); } continue; } c.globalAlpha = (v - 0.55) / 0.45 * (G.a ?? 0.9); const s = G.s || 3; c.drawImage(halo(G.col || '#dfe8ff'), q.x - s, q.y - s * 0.6, s * 2, s * 1.2); }
    }
  }
  for (const e of g.ents) {
    const A = e.aura; if (!A || e.visible === false) continue; const r = g.entRect(e); if (!r) continue;
    const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2 - (e.float || 0), rad = Math.max(r[2] - r[0], r[3] - r[1]) * (A.r || 0.75) * (1 + 0.07 * Math.sin(t * 2.2));
    c.globalAlpha = (A.a ?? 0.7) * (e.alpha ?? 1); c.drawImage(halo(A.col, true), cx - rad, cy - rad, rad * 2, rad * 2);
  }
  c.restore();
}

/* devant les personnages : particules, lucioles */
export function drawFx2(g, c) {
  const P = g.parts, F = g.scene && g.scene.fx, t = g.now;
  c.save();
  if (F && F.rain) {   /* pluie : traits obliques qui tombent en boucle, deux plans de profondeur */
    const R2 = F.rain, n = R2.n || 140; R2._p = R2._p || Array.from({ length: n }, (_, i) => ({ x: R(0, 520), y: R(-20, 270), v: R(260, 380) * (i % 3 ? 1 : 0.7), l: i % 3 ? R(7, 11) : R(4, 6) }));
    c.strokeStyle = R2.col || 'rgba(190,210,235,.55)'; c.lineWidth = 0.6; c.beginPath();
    for (const q of R2._p) { const y = (q.y + t * q.v) % 290 - 20, x = (q.x - t * q.v * 0.18) % 520; const xx = x < 0 ? x + 520 : x; c.moveTo(xx, y); c.lineTo(xx - q.l * 0.18, y + q.l); }
    c.globalAlpha = 0.8; c.stroke(); c.globalAlpha = 1;
  }
  if (F && F.snow) {   /* neige : flocons ronds qui tombent en se balançant, deux plans de profondeur ; apparition douce depuis S.t0 */
    const S = F.snow, n = S.n || 130; S._p = S._p || Array.from({ length: n }, (_, i) => ({ x: R(0, 480), y: R(0, 290), v: R(16, 30) * (i % 3 ? 1 : 0.55), s: i % 3 ? R(0.7, 1.4) : R(0.4, 0.75), ph: R(0, TAU), sw: R(0.6, 1.3) }));
    const a0 = S.t0 ? Math.min(1, (t - S.t0) / 2.5) : 1; c.fillStyle = S.col || '#f4f8ff';
    for (const q of S._p) { const y = (q.y + t * q.v) % 290 - 15, x = q.x + Math.sin(t * q.sw + q.ph) * 7; c.globalAlpha = a0 * (q.s > 0.7 ? 0.9 : 0.55); c.beginPath(); c.arc(x, y, q.s, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
  }
  if (F && F.flies) for (const Fl of F.flies) {
    const [x0, y0, x1, y1] = Fl.rect; Fl._p = Fl._p || Array.from({ length: Fl.n || 8 }, () => ({ ax: R(x0, x1), ay: R(y0, y1), ph: R(0, TAU), sp: R(0.3, 0.7) }));
    c.globalCompositeOperation = 'lighter';
    for (const q of Fl._p) { const x = q.ax + Math.sin(t * q.sp + q.ph) * 14, y = q.ay + Math.sin(t * q.sp * 1.7 + q.ph * 2) * 7, a = 0.5 + 0.5 * Math.sin(t * 2.3 + q.ph * 3); c.globalAlpha = a * 0.9; c.drawImage(halo(Fl.col || '#d8ff8a'), x - 3, y - 3, 6, 6); }
  }
  const SK = g.fx.sky; if (SK) { const u = (t - SK.t0) / 0.5; if (u >= 1) g.fx.sky = null; else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = SK.a * (1 - u) * (u < 0.15 || u > 0.3 ? 1 : 0.4); c.fillStyle = '#c8d8ff'; c.fillRect(0, 0, 480, 270); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } }
  if (P && P.length) {
    c.globalCompositeOperation = 'source-over';
    for (const p of P) {   /* fumée et confettis : mélange normal */
      if (p.t < 0) continue; const u = p.t / p.life;
      if (p.k === 'smoke') { const a = Math.min(1, p.t / 0.12) * (1 - u); c.globalAlpha = a * 0.85 * (p.a ?? 1); c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.drawImage(smoke(p.tint), -p.s, -p.s, p.s * 2, p.s * 2); c.restore(); }
      else if (p.k === 'conf') { c.globalAlpha = 1 - u * u; c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 1.3)); c.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); c.restore(); }
    }
    c.globalCompositeOperation = 'lighter';
    for (const p of P) {   /* lumière : étincelles, flashs, ondes, éclairs, fusées, volutes */
      if (p.t < 0) continue; const u = p.t / p.life;
      if (p.k === 'spark' || p.k === 'wisp') {
        let a = 1 - u; if (p.tw) a *= 0.6 + 0.4 * Math.sin(p.t * 40 + p.x); if (p.k === 'wisp') a = Math.sin(u * Math.PI) * 0.55;
        c.globalAlpha = Math.max(0, a); const s = p.s * (p.k === 'wisp' ? 1 + u : 1);
        if (p.trail) { c.strokeStyle = p.col; c.lineWidth = s * 0.7; c.beginPath(); p.trail.forEach(([tx, ty], i) => (i ? c.lineTo(tx, ty) : c.moveTo(tx, ty))); c.lineTo(p.x, p.y); c.globalAlpha = a * 0.5; c.stroke(); c.globalAlpha = Math.max(0, a); }
        c.drawImage(halo(p.col), p.x - s * 3, p.y - s * 3, s * 6, s * 6);
        if (p.star) { c.fillStyle = '#fff'; c.fillRect(p.x - s * 2, p.y - 0.25, s * 4, 0.5); c.fillRect(p.x - 0.25, p.y - s * 2, 0.5, s * 4); }
      } else if (p.k === 'flash') { const r = p.r0 + (p.r1 - p.r0) * Math.sqrt(u); c.globalAlpha = (1 - u) * 0.9; c.drawImage(halo(p.col), p.x - r, p.y - r, r * 2, r * 2); }
      else if (p.k === 'ring') { const r = p.r0 + (p.r1 - p.r0) * (1 - (1 - u) * (1 - u)); c.globalAlpha = (1 - u) * 0.8; c.strokeStyle = p.col; c.lineWidth = 2.2 * (1 - u) + 0.3; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke(); }
      else if (p.k === 'bolt') { drawBolt(c, p, u); }
      else if (p.k === 'rocket' && p.trail.length) { c.strokeStyle = p.col; c.lineWidth = 1.2; c.globalAlpha = 0.7; c.beginPath(); p.trail.forEach(([tx, ty], i) => (i ? c.lineTo(tx, ty) : c.moveTo(tx, ty))); c.stroke(); c.globalAlpha = 1; c.drawImage(halo(p.col), p.cx - 4, p.cy - 4, 8, 8); }
    }
  }
  c.restore();
}
/* arc électrique en zigzag, redessiné toutes les 40 ms, halo coloré + cœur blanc */
function drawBolt(c, p, u) {
  const k = Math.floor(p.t / 0.04); if (k !== p.seed || !p.pts) { p.seed = k; const [ax, ay] = p.a, [bx, by] = p.b, n = p.big ? 16 : 9, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; p.pts = Array.from({ length: n + 1 }, (_, i) => { const f = i / n, j = i && i < n ? R(-1, 1) * Math.min(14, L * 0.12) * Math.sin(f * Math.PI) : 0; return [ax + dx * f + nx * j, ay + dy * f + ny * j]; }); }
  const path = () => { c.beginPath(); p.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  const a = u < 0.7 ? 1 : (1 - u) / 0.3;
  const W2 = p.big ? 2.2 : 1;
  c.globalAlpha = a * 0.45; c.strokeStyle = p.col; c.lineWidth = 5 * W2; path(); c.stroke();
  c.globalAlpha = a * 0.9; c.lineWidth = 2 * W2; path(); c.stroke();
  c.globalAlpha = a; c.strokeStyle = '#ffffff'; c.lineWidth = 0.8 * W2; path(); c.stroke();
  c.drawImage(halo(p.col), p.b[0] - 10, p.b[1] - 10, 20, 20);
}
