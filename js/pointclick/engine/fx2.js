/* Effets de particules de la saison 2, dessinés dans la scène (coordonnées logiques 480 × 270, canevas 960 × 540) :
   éclair du Wabbajack (étincelles + pouf de fumée), feu d'artifice. Les fonctions renvoient une promesse résolue à la fin de l'effet. */
const R = (a, b) => a + Math.random() * (b - a);
const parts = g => g.parts || (g.parts = []);

/* éclair du Wabbajack sur (x, y) : gerbe d'étincelles violettes, dorées et vertes, puis pouf de fumée */
export function zap(g, x, y, o = {}) {
  const P = parts(g), cols = o.cols || ['#c77dff', '#ffd166', '#7dffb6', '#ff8fd8', '#ffffff'];
  for (let i = 0; i < 46; i++) { const a = R(0, Math.PI * 2), v = R(25, 95); P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 60, life: R(0.45, 0.9), t: 0, s: R(0.8, 2), col: cols[i % cols.length], star: true }); }
  for (let i = 0; i < 14; i++) P.push({ x: x + R(-10, 10), y: y + R(-12, 8), vx: R(-12, 12), vy: R(-16, -4), g: 0, life: R(0.7, 1.2), t: 0, s: R(5, 9), grow: R(10, 18), col: 'rgba(230,224,240,1)', smoke: true });
  g.sfx('whoosh'); setTimeout(() => g.sfx('pop'), 160);
  return g.until(() => !P.some(p => p.star || p.smoke));
}

/* feu d'artifice en n bouquets autour de (x, y) */
export async function fireworks(g, x, y, n = 3, col = ['#7dffb6', '#b6ff7d', '#ffffff']) {
  const P = parts(g);
  for (let k = 0; k < n; k++) {
    const cx = x + R(-40, 40), cy = y + R(-30, 10), c = col[k % col.length];
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, v = R(40, 70); P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 35, life: R(0.9, 1.4), t: 0, s: R(1, 1.8), col: c, star: true }); }
    g.sfx('pop'); await g.wait(380);
  }
  await g.until(() => !P.length);
}

export function updateFx2(g, dt) {
  const P = g.parts; if (!P || !P.length) return;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.grow) p.s += p.grow * dt; p.vx *= 1 - 1.5 * dt; p.vy *= p.smoke ? 1 - 1.5 * dt : 1;
  }
}
export function drawFx2(g, c) {
  const P = g.parts; if (!P || !P.length) return;
  c.save();
  for (const p of P) {
    const a = 1 - p.t / p.life; c.globalAlpha = p.smoke ? a * 0.55 : a; c.fillStyle = p.col;
    c.beginPath(); c.arc(p.x, p.y, p.s, 0, Math.PI * 2); c.fill();
    if (p.star) { c.globalAlpha = a * 0.35; c.beginPath(); c.arc(p.x, p.y, p.s * 2.4, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
}
