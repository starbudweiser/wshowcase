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
let smokeImg = null;
function smoke() {
  if (smokeImg) return smokeImg; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  for (let i = 0; i < 7; i++) { const cx = R(22, 42), cy = R(22, 42), rr = R(12, 22), gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(236,230,246,.5)'); gr.addColorStop(1, 'rgba(236,230,246,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }
  return (smokeImg = c);
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
  const P = parts(g);
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
      const fl = L.fl ?? 0.15, k = 1 - fl + fl * (0.55 + 0.25 * Math.sin(t * 9.1 + L.x) + 0.2 * Math.sin(t * 23.7 + L.y * 1.7));
      const r = L.r * (L.breathe ? 1 + 0.08 * Math.sin(t * (L.breathe) + L.x) : 1);
      c.globalAlpha = (L.a ?? 0.8) * k; c.drawImage(halo(L.col, true), L.x - r, L.y - r, r * 2, r * 2);
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
  if (F && F.flies) for (const Fl of F.flies) {
    const [x0, y0, x1, y1] = Fl.rect; Fl._p = Fl._p || Array.from({ length: Fl.n || 8 }, () => ({ ax: R(x0, x1), ay: R(y0, y1), ph: R(0, TAU), sp: R(0.3, 0.7) }));
    c.globalCompositeOperation = 'lighter';
    for (const q of Fl._p) { const x = q.ax + Math.sin(t * q.sp + q.ph) * 14, y = q.ay + Math.sin(t * q.sp * 1.7 + q.ph * 2) * 7, a = 0.5 + 0.5 * Math.sin(t * 2.3 + q.ph * 3); c.globalAlpha = a * 0.9; c.drawImage(halo(Fl.col || '#d8ff8a'), x - 3, y - 3, 6, 6); }
  }
  if (P && P.length) {
    c.globalCompositeOperation = 'source-over';
    for (const p of P) {   /* fumée et confettis : mélange normal */
      if (p.t < 0) continue; const u = p.t / p.life;
      if (p.k === 'smoke') { const a = Math.min(1, p.t / 0.12) * (1 - u); c.globalAlpha = a * 0.85; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.drawImage(smoke(), -p.s, -p.s, p.s * 2, p.s * 2); c.restore(); }
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
  const k = Math.floor(p.t / 0.04); if (k !== p.seed || !p.pts) { p.seed = k; const [ax, ay] = p.a, [bx, by] = p.b, n = 9, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; p.pts = Array.from({ length: n + 1 }, (_, i) => { const f = i / n, j = i && i < n ? R(-1, 1) * Math.min(14, L * 0.12) * Math.sin(f * Math.PI) : 0; return [ax + dx * f + nx * j, ay + dy * f + ny * j]; }); }
  const path = () => { c.beginPath(); p.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  const a = u < 0.7 ? 1 : (1 - u) / 0.3;
  c.globalAlpha = a * 0.45; c.strokeStyle = p.col; c.lineWidth = 5; path(); c.stroke();
  c.globalAlpha = a * 0.9; c.lineWidth = 2; path(); c.stroke();
  c.globalAlpha = a; c.strokeStyle = '#ffffff'; c.lineWidth = 0.8; path(); c.stroke();
  c.drawImage(halo(p.col), p.b[0] - 10, p.b[1] - 10, 20, 20);
}
