/* Couche de lumière tramée façon PixelFX (essai du 27/11/2026, adoptée le jour même), écrite pour le jeu.
   Deux tampons, au pixel du rendu : 480 × 270 en rendu années 90, 960 × 540 en rendu 2000 (« trame fine », choisie par Stéphan) :
   - couleur (Uint32, pixels opaques jamais mélangés : les fondus passent par un tramage ordonné de Bayer 4 × 4) ;
   - lumière (Float32 RGB, additive), posée sur la scène en « lighter », avec des paliers tramés (rendu pixel, pas de dégradé lisse).
   Les deux tampons sont posés sans lissage : chaque point de trame tombe sur un pixel du canevas, dans les deux rendus.
   Effets d'une scène : data/lightfx.js (torches, objet clé). Effet à phases : préparation (les pixels convergent, la lueur monte),
   action (éclat), retombée (braises qui tombent, lueur qui s'éteint en trame).
   Activation : scènes qui ont des réglages, dans les deux rendus. ?nolightfx coupe la couche (essais) ; ?lightfx=gros garde le grain
   480 en rendu 2000 (comparaison). */
import { LIGHTFX } from '../data/lightfx.js';

const LW = 480, LH = 270;
let S = 1, W = LW, H = LH;   /* S = 2 : trame fine du rendu 2000 (tampons 960 × 540) */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const pack = ([r, g, b]) => (255 << 24) | (b << 16) | (g << 8) | r;   /* ImageData en petit-boutiste : ABGR */

let st = null;
function state() {
  if (st && st.S === S) return st;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const cc = mk(), lc = mk(), cx = cc.getContext('2d'), lx = lc.getContext('2d');
  const cImg = cx.createImageData(W, H), lImg = lx.createImageData(W, H);
  st = { S, cc, lc, cx, lx, cImg, lImg, col: new Uint32Array(cImg.data.buffer), light: new Float32Array(W * H * 3), parts: [], seed: 1, key: null, sceneId: null };
  return st;
}
const rnd = () => ((st.seed = (st.seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const Q = typeof location !== 'undefined' ? location.search : '', OFF = /[?&]nolightfx\b/.test(Q), COARSE = /[?&]lightfx=gros\b/.test(Q);
export const lightOn = g => !OFF && (g.lightfx ?? true);

/* ───── tampon couleur ───── */
function put(x, y, c) { x = x * S | 0; y = y * S | 0; if (x >= 0 && y >= 0 && x < W && y < H) st.col[y * W + x] = c; }
/* point « transparent » a (0..1) : posé seulement là où la trame le permet */
function dot(x, y, c, a) { const X = x * S | 0, Y = y * S | 0; if (a > dith(X, Y) && X >= 0 && Y >= 0 && X < W && Y < H) st.col[Y * W + X] = c; }

/* ───── tampon lumière ───── */
function add(x, y, [r, g, b], k) { x = x * S | 0; y = y * S | 0; addPx(x, y, r, g, b, k); }
function addPx(x, y, r, g, b, k) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3, L = st.light; L[i] += r * k; L[i + 1] += g * k; L[i + 2] += b * k; }
/* lueur ronde : chute en paliers (4 niveaux) tramés entre eux */
function glow(cx, cy, r, col, k) {
  cx *= S; cy *= S; r *= S;
  const c = rgb(col), x0 = Math.max(0, cx - r | 0), x1 = Math.min(W - 1, cx + r | 0), y0 = Math.max(0, cy - r | 0), y1 = Math.min(H - 1, cy + r | 0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = Math.hypot(x - cx, y - cy) / r; if (d >= 1) continue;
    const f = (1 - d) * (1 - d) * 4, lv = Math.floor(f + dith(x, y)) / 4;   /* palier tramé */
    if (lv > 0) addPx(x, y, c[0], c[1], c[2], k * lv);
  }
}

/* ───── effets ───── */
const FLAME = ['#fff3b0', '#ffd35c', '#ff9a2e', '#d9531e', '#7a2a14'].map(h => pack(rgb(h)));
function torch(T, t) {
  const fl = 0.78 + 0.22 * Math.sin(t * 13 + T.x) * Math.sin(t * 7.3 + T.y);
  glow(T.x, T.y, T.r * fl, T.col || '#ffad5c', 0.55 * (T.k ?? 1));
  /* flamme en pixels : petites langues qui montent et changent de couleur en vieillissant */
  if (T.flame !== false && rnd() < 0.9) st.parts.push({ k: 'flame', x: T.x + (rnd() - 0.5) * T.w, y: T.y + 1, vx: (rnd() - 0.5) * 3, vy: -8 - rnd() * 9, t: 0, life: 0.35 + rnd() * 0.3 });
}
/* objet clé : préparation (0 → P), action (P → P + A), retombée (→ P + A + R), puis repos jusqu'au cycle suivant */
function keyFx(K, x, y, t, dt) {
  const P = K.prep ?? 0.7, A = K.act ?? 0.22, R = K.fall ?? 1.3, every = K.every ?? 6, u = t % every, col = rgb(K.col || '#ffd166');
  if (u < P) {   /* préparation : étincelles aspirées vers l'objet, lueur qui monte */
    const p = u / P; glow(x, y, 6 + 10 * p, K.col || '#ffd166', 0.35 * p);
    if (rnd() < 0.7) { const a = rnd() * 6.283, d = 16 + rnd() * 10; st.parts.push({ k: 'in', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, tx: x, ty: y, t: 0, life: P - u + 0.05 }); }
  } else if (u < P + A) {   /* action : éclat */
    const p = (u - P) / A; glow(x, y, 26 + 14 * p, '#ffffff', 0.9 * (1 - p * 0.4)); glow(x, y, 40, K.col || '#ffd166', 0.6);
    if (!K._burst || K._burst < t - A) { K._burst = t; for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, v = 30 + rnd() * 45; st.parts.push({ k: 'ember', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, t: 0, life: 0.8 + rnd() * 0.7 }); } }
    for (let i = 0; i < 2 * Math.PI * 14; i++) { const a = i / 14; dot(x + Math.cos(a) * (6 + 20 * p), y + Math.sin(a) * (6 + 20 * p), pack([255, 255, 255]), 1 - p); }
  } else if (u < P + A + R) {   /* retombée : la lueur s'éteint en trame */
    const p = (u - P - A) / R; glow(x, y, 30 * (1 - p) + 6, K.col || '#ffd166', 0.5 * (1 - p));
  }
  void col; void dt;
}
function stepParts(dt) {
  const keep = [];
  for (const p of st.parts) {
    p.t += dt; if (p.t >= p.life) continue; const a = 1 - p.t / p.life;
    if (p.k === 'flame') { p.x += p.vx * dt; p.y += p.vy * dt; const ci = Math.min(4, Math.floor((p.t / p.life) * 5)); put(p.x, p.y, FLAME[ci]); if (ci < 2) put(p.x, p.y - 1, FLAME[ci + 1]); add(p.x, p.y, [255, 170, 80], 0.5 * a); }
    else if (p.k === 'in') { const f = Math.min(1, dt * 6); p.x += (p.tx - p.x) * f; p.y += (p.ty - p.y) * f; put(p.x, p.y, pack([255, 240, 190])); add(p.x, p.y, [255, 220, 140], 0.6); }
    else if (p.k === 'ember') { p.vy += 70 * dt; p.vx *= 1 - dt * 1.2; p.x += p.vx * dt; p.y += p.vy * dt; dot(p.x, p.y, FLAME[Math.min(4, Math.floor((1 - a) * 4))], a * 1.4); add(p.x, p.y, [255, 190, 90], 0.45 * a); }
    keep.push(p);
  }
  st.parts = keep;
}

export function drawLightFx(g, c, dt) {
  if (!lightOn(g) || !g.scene) return;
  const conf = LIGHTFX[g.scene.id]; if (!conf) return;
  S = !(g.lightfxCoarse ?? COARSE) && g.scene.hd && !g.s2low ? 2 : 1; W = LW * S; H = LH * S;
  state(); if (st.sceneId !== g.scene.id) { st.sceneId = g.scene.id; st.parts = []; }
  st.col.fill(0); st.light.fill(0);
  const t = g.now;
  for (const T of conf.torches || []) torch(T, t);
  const kp = conf.key && conf.key(g); if (kp) keyFx(conf.keyFx || {}, kp[0], kp[1], t, dt);
  stepParts(Math.min(0.05, dt || 0.016));
  /* lumière : float → octets, plafonnée */
  const L = st.light, D = st.lImg.data;
  for (let i = 0, j = 0; i < L.length; i += 3, j += 4) { D[j] = Math.min(255, L[i]); D[j + 1] = Math.min(255, L[i + 1]); D[j + 2] = Math.min(255, L[i + 2]); D[j + 3] = 255; }
  st.cx.putImageData(st.cImg, 0, 0); st.lx.putImageData(st.lImg, 0, 0);
  c.save(); c.imageSmoothingEnabled = false;
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = conf.lightK ?? 1; c.drawImage(st.lc, 0, 0, LW, LH);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.drawImage(st.cc, 0, 0, LW, LH);
  c.restore();
}
