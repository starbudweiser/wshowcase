/* Pièce des verbes (esprit Curse of Monkey Island) : un septim d'or qui s'ouvre sous le curseur sur un appui long, avec quatre
   alvéoles (Regarder en haut, Prendre à droite, Parler en bas, Utiliser à gauche). Tout est dessiné en pixel art à la résolution du
   jeu (480×270) : la pièce au pixel près par calcul (bord, perles, gorge, reflets tramés, alvéoles en creux), les icônes 15×15
   dessinées à la main. Contient aussi les curseurs (viseur, viseur allumé, objet tenu) et l'icône de la besace. */

const PAL = {
  k: [27, 13, 7], w: [242, 234, 214], g: [185, 173, 148], b: [90, 150, 214], B: [35, 80, 142], p: [11, 7, 5], h: [255, 255, 255],
  s: [226, 230, 236], m: [154, 161, 176], d: [90, 96, 112], r: [206, 72, 52], R: [122, 30, 22], t: [246, 242, 228], o: [58, 14, 10], l: [240, 130, 110],
  y: [255, 208, 74], L: [240, 192, 128], c: [200, 132, 64], C: [142, 86, 38], n: [92, 52, 20], z: [58, 32, 16]
};
export const ICONS = {
  look: ['...............', '...............', '...............', '.....kkkkk.....', '...kkgggggkk...', '..kgwwBBBwwgk..', '.kgwBBbphBBwgk.', 'kwwwBbpppbBwwwk', '.kgwBBbpbBBwgk.', '..kgwwBBBwwgk..', '...kkgwwwgkk...', '.....kkkkk.....', '...............', '...............', '...............'],
  take: ['......kk.......', '...kkksmkkk....', '..ksmksmksmk...', '..ksmksmksmkkk.', '..ksmksmksmksmk', '.kksmksmksmksmk', 'ksksmksmksmksmk', 'ksksmksmksmksmk', 'ksmsmmmmmmmmmdk', 'ksmmsmmmmmmmmdk', '.ksmsmmmmmmmmdk', '..kssmmmmmmmmdk', '..kmmmmmmmmmmdk', '...kddddsddddk.', '....kkkkkkkkk..'],
  talk: ['...............', '...............', '...............', '...............', '....kkk.kkk....', '..kkrlrkrlrkk..', '.krrrrrrrrrrrk.', 'krRtttttttttRrk', 'krooooooooooork', '.krooorrrooork.', '..krrrlrrrrrk..', '...kkrrrrrkk...', '.....kkkkk.....', '...............', '...............'],
  use: ['......kkk......', '.....ksssk.....', '...kkkssskkk...', '..ksskkskkmmk..', '..ksssssmmmmk..', '.kkksssmmmmkkk.', 'ksskssskmmmkddk', 'kssssmkkkmddddk', 'ksskmmmkdddkddk', '.kkkmmmmdddkkk.', '..kmmmmdddddk..', '..kmmkkdkkddk..', '...kkkdddkkk...', '.....kdddk.....', '......kkk......']
};
const BAG = ['................', '......kkkk......', '.....kLccLk.....', '......kCCk......', '.....kkzzkk.....', '....kcLcccck....', '...kcLcccccCk...', '..kcLccccccCCk..', '..kcLcccccCCCk..', '.kcLccccccCCCnk.', '.kcccccccCCCCnk.', '.kccccccCCCCnnk.', '.kCcccccCCCCnnk.', '..kCCCCCCCnnnk..', '...kkkkkkkkkk...', '................'];
const CROSS = ['......k......', '.....kwk.....', '.....kwk.....', '......k......', '.............', '.kk...k...kk.', 'kwwk.kwk.kwwk', '.kk...k...kk.', '.............', '......k......', '.....kwk.....', '.....kwk.....', '......k......'];

/* grille de caractères -> petit canvas (mis en cache) ; `sub` remplace des couleurs (viseur allumé) */
const gridCache = new Map();
function gridCanvas(rows, sub) {
  const key = rows.join('') + (sub ? JSON.stringify(sub) : ''); let c = gridCache.get(key); if (c) return c;
  const h = rows.length, w = rows[0].length; c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), id = x.createImageData(w, h);
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; const col = PAL[(sub && sub[ch]) || ch]; const o = (j * w + i) * 4; id.data[o] = col[0]; id.data[o + 1] = col[1]; id.data[o + 2] = col[2]; id.data[o + 3] = 255; }));
  x.putImageData(id, 0, 0); gridCache.set(key, c); return c;
}
export const bagCanvas = () => gridCanvas(BAG);

/* ───────── la pièce ───────── */
export const COIN = { R: 33, D: 19, S: 9.5, ORDER: ['look', 'take', 'talk', 'use'] };
const DIRS = { look: [0, -1], take: [1, 0], talk: [0, 1], use: [-1, 0] };
const GOLD = [[255, 244, 190], [246, 212, 104], [222, 168, 58], [178, 120, 34], [118, 72, 16], [64, 36, 8]];
const SOCK = { in: [96, 58, 18], inHi: [128, 82, 26], dark: [62, 36, 10], lite: [168, 118, 40], glow: [255, 240, 168] };
const coinCache = new Map();
function coinCanvas(R, D, S, hi, icons) {
  const key = `${R}|${D}|${S}|${hi}|${icons}`; let out = coinCache.get(key); if (out) return out;
  const n = 2 * R + 5, o = (n - 1) / 2, c = document.createElement('canvas'); c.width = n; c.height = n;
  const x = c.getContext('2d'), id = x.createImageData(n, n), px = id.data;
  const slots = COIN.ORDER.map(v => [v, o + DIRS[v][0] * D, o + DIRS[v][1] * D]);
  const put = (i, j, col) => { const q = (j * n + i) * 4; px[q] = col[0]; px[q + 1] = col[1]; px[q + 2] = col[2]; px[q + 3] = 255; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const dx = i - o, dy = j - o, d = Math.hypot(dx, dy); if (d > R + 0.5) continue;
    const lit = -(dx + dy) * 0.7071 / Math.max(d, 1), chk = (i + j) & 1;
    let col;
    if (d > R - 0.5) col = GOLD[5];
    else if (d > R - 3.5) {                                   // bord en relief, éclairé en haut à gauche, perles tous les 15°
      let k = lit > 0.55 ? 0 : lit > 0.1 ? 1 : lit > -0.35 ? 2 : lit > -0.7 ? 3 : 4;
      const a = (Math.atan2(dy, dx) * 180 / Math.PI + 367.5) % 15;
      if (Math.abs(d - (R - 2)) < 0.75 && a < 5) k = Math.max(0, k - 1); else if (Math.abs(d - (R - 2)) < 0.75 && a < 7.5) k = Math.min(4, k + 1);
      col = GOLD[k];
    } else if (d > R - 4.5) col = lit > 0 ? GOLD[4] : GOLD[1];    // gorge : paroi intérieure dans l'ombre en haut, au soleil en bas
    else {                                                    // champ de la pièce : aplat, reflet tramé en haut à gauche, ombre en bas à droite
      col = GOLD[2];
      if (d > R - 12) { if (lit > 0.5) col = GOLD[1]; else if (lit > 0.32 && chk) col = GOLD[1]; else if (lit < -0.55) col = GOLD[3]; else if (lit < -0.38 && chk) col = GOLD[3]; }
    }
    for (const [v, sx, sy] of slots) {                        // alvéoles en creux (ombre en haut à gauche), halo clair sur celle visée
      const ex = i - sx, ey = j - sy, ds = Math.hypot(ex, ey);
      if (ds <= S) { const sl = -(ex + ey) * 0.7071 / Math.max(ds, 1); col = ds > S - 1.2 ? (sl > 0 ? SOCK.dark : SOCK.lite) : (v === hi ? SOCK.inHi : SOCK.in); }
      else if (v === hi && ds <= S + 1.25) col = SOCK.glow;
    }
    if (d <= 5.5) { col = d > 4.6 ? GOLD[4] : lit > 0.3 ? GOLD[0] : lit > -0.3 ? GOLD[1] : GOLD[3]; }   // bouton central bombé
    put(i, j, col);
  }
  x.putImageData(id, 0, 0);
  if (icons) for (const [v, sx, sy] of slots) {
    const ic = gridCanvas(ICONS[v]); x.globalAlpha = hi && v !== hi ? 0.72 : 1;
    x.drawImage(ic, Math.round(sx - 7), Math.round(sy - 7 - (v === hi ? 1 : 0))); x.globalAlpha = 1;
  }
  const sh = document.createElement('canvas'); sh.width = n; sh.height = n; const sx = sh.getContext('2d');   // ombre portée
  sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#000'; sx.fillRect(0, 0, n, n);
  out = { c, sh, o }; if (coinCache.size > 80) coinCache.clear(); coinCache.set(key, out); return out;
}
const easeOutBack = t => { const k = 1.9; return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
export const OPEN_S = 0.17, CLOSE_S = 0.09;
/* dessine la pièce (ouverture qui rebondit, fermeture qui se resserre) ; renvoie false quand elle a fini de se fermer */
export function drawCoin(ctx, coin, now) {
  let e;
  if (coin.closeT != null) { const t = Math.min(1, (now - coin.closeT) / CLOSE_S); if (t >= 1) return false; e = 1 - t * t; }
  else e = easeOutBack(Math.min(1, (now - coin.t0) / OPEN_S));
  const R = Math.max(3, Math.round(COIN.R * e)), D = Math.round(COIN.D * e), S = Math.max(1, Math.round(COIN.S * e * 2) / 2);
  const icons = coin.closeT == null && now - coin.t0 > OPEN_S * 0.45;
  const g = coinCanvas(R, D, S, coin.closeT == null ? coin.hi : null, icons), x0 = Math.round(coin.cx - g.o), y0 = Math.round(coin.cy - g.o);
  ctx.globalAlpha = 0.38; ctx.drawImage(g.sh, x0 + 2, y0 + 3); ctx.globalAlpha = 1; ctx.drawImage(g.c, x0, y0);
  return true;
}
/* verbe désigné par un point (coordonnées du jeu) : secteurs en croix autour du centre, zone morte au milieu, rien trop loin */
export function coinSector(coin, x, y) {
  const dx = x - coin.cx, dy = y - coin.cy, d = Math.hypot(dx, dy);
  if (d < 7 || d > COIN.R + 18) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'take' : 'use';
  return dy > 0 ? 'talk' : 'look';
}
/* anneau de chargement autour du curseur pendant l'appui long (avant l'ouverture de la pièce) */
export function drawCharge(ctx, x, y, p) {
  const r = 6, cx = Math.round(x), cy = Math.round(y);
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j); if (Math.abs(d - r) > 0.6) continue;
    const a = (Math.atan2(i, -j) / (2 * Math.PI) + 1) % 1; if (a > p) continue;
    ctx.fillStyle = '#1b0d07'; ctx.fillRect(cx + i + 1, cy + j + 1, 1, 1); ctx.fillStyle = '#ffd04a'; ctx.fillRect(cx + i, cy + j, 1, 1);
  }
}

/* ───────── curseurs (images CSS agrandies d'un facteur entier, pixels nets) ───────── */
const curCache = new Map();
function upscale(src, k) { const c = document.createElement('canvas'); c.width = src.width * k; c.height = src.height * k; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height); return c; }
export function crossCursor(hot, k) {
  const key = `x${hot}|${k}`; if (curCache.has(key)) return curCache.get(key);
  const c = upscale(gridCanvas(CROSS, hot ? { w: 'y' } : null), k), h = Math.floor(c.width / 2);
  const v = `url(${c.toDataURL()}) ${h} ${h}, crosshair`; curCache.set(key, v); return v;
}
export function itemCursor(img, id, k) {
  const key = `i${id}|${k}`; if (curCache.has(key)) return curCache.get(key);
  if (!img) return crossCursor(true, k);
  const box = 22, s = Math.min(box / img.width, box / img.height, 2), w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const base = document.createElement('canvas'); base.width = box + 2; base.height = box + 2; const x = base.getContext('2d'); x.imageSmoothingEnabled = (img.dens || 1) > 1; x.imageSmoothingQuality = 'high';   /* objets S2 pleine couleur : réduits en douceur */
  const ox = Math.round((box + 2 - w) / 2), oy = Math.round((box + 2 - h) / 2);
  x.filter = 'drop-shadow(1px 1px 0 rgba(0,0,0,.85))'; x.drawImage(img, ox, oy, w, h); x.filter = 'none';
  let kk = k; while (kk > 1 && (box + 2) * kk > 128) kk--;
  const c = upscale(base, kk), hh = Math.floor(c.width / 2), v = `url(${c.toDataURL()}) ${hh} ${hh}, pointer`; curCache.set(key, v); return v;
}
