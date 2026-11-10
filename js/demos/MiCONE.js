/* MiCONE : réplique interactive. Image → icône macOS (.ICNS) sur le fond sombre de macOS 27, ou dossier façon Finder.
   Le rendu reprend la géométrie du vrai moteur (coins continus de 185,4 px dans 1024 px, fonds, verre, ombres, gravure, détourage). Images d'exemple : aucune lecture de fichier. */
import { h, brand, T, css, toast, icon, sfx, wm, download, clamp, reduced, wait } from './kit.js';
import { t } from '../i18n.js';

const BRAND = '#4090f0';
const FONDS = { sombre: ['#3a3a3f', '#141417'], graphite: ['#5d5d64', '#2c2c31'], nuit: ['#23324a', '#0b111c'], clair: ['#ffffff', '#e2e2e8'] };
const DOSSIERS = { bleu: '#56acf0', graphite: '#8c8c94', nuit: '#2f4f84', clair: '#e6e6ec' };
const SWATCHES = ['#2d6cdf', '#8b5cf6', '#db2777', '#ff375f', '#ff9f0a', '#ffd60a', '#30d158', '#14b8a6', '#6b7280', '#1c1c1e'];
const PALETTES = { orange: ['#ff6a3d', '#ffb340'], rouge: ['#ff375f', '#ff8a9b'], bleu: ['#2f7bf5', '#8ec5ff'], vert: ['#30d158', '#9af0b2'], jaune: ['#ffd60a', '#fff1a1'], violet: ['#8b5cf6', '#c4b5fd'] };

/* ---------- couleurs (mêmes lighter / darker que Qt, travail sur la valeur HSV) ---------- */
const hex2 = s => { const v = parseInt(s.replace('#', ''), 16); return { r: (v >> 16 & 255) / 255, g: (v >> 8 & 255) / 255, b: (v & 255) / 255 }; };
const rgba = (c, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
const hsv = c => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), d = mx - mn; let hh = 0; if (d > 0) { hh = mx === c.r ? ((c.g - c.b) / d) % 6 : mx === c.g ? (c.b - c.r) / d + 2 : (c.r - c.g) / d + 4; hh /= 6; if (hh < 0) hh += 1; } return { h: hh, s: mx === 0 ? 0 : d / mx, v: mx }; };
const fromHsv = (hh, s, v) => { const i = Math.floor(hh * 6) % 6, f = hh * 6 - Math.floor(hh * 6), p = v * (1 - s), q = v * (1 - f * s), u = v * (1 - (1 - f) * s); const m = [[v, u, p], [q, v, p], [p, v, u], [p, q, v], [u, p, v], [v, p, q]][i]; return { r: m[0], g: m[1], b: m[2] }; };
const lighter = (c, f) => { if (f < 100) return darker(c, 10000 / f); const x = hsv(c); let v = x.v * f / 100, s = x.s; if (v > 1) { s = Math.max(0, s - (v - 1)); v = 1; } return fromHsv(x.h, s, v); };
const darker = (c, f) => { if (f < 100) return lighter(c, 10000 / f); const x = hsv(c); return fromHsv(x.h, x.s, x.v * 100 / f); };
const lum = c => (Math.max(c.r, c.g, c.b) + Math.min(c.r, c.g, c.b)) / 2;

/* ---------- forme : rectangle à coins continus (courbure progressive des icônes Apple) ---------- */
const BASE = [[-1.52866471, 0], [-1.08849323, 0], [-0.86840689, 0], [-0.63149399, 0.074911], [-0.37282392, 0.16905899], [-0.16905899, 0.37282392], [-0.074911, 0.63149399], [0, 0.86840689], [0, 1.08849323], [0, 1.52866471]];
function squircle(x, y, w, hh, r0 = 185.4) {
  const r = Math.min(r0, Math.min(w, hh) / 2 / 1.52866483);
  const coin = (cx, cy, sx, sy, inv) => { const p = BASE.map(([a, b]) => [cx + sx * a * r, cy + sy * b * r]); return inv ? p.reverse() : p; };
  const coins = [coin(x + w, y, 1, 1, false), coin(x + w, y + hh, 1, -1, true), coin(x, y + hh, -1, -1, false), coin(x, y, -1, 1, true)];
  const p = new Path2D(); p.moveTo(...coins[0][0]);
  coins.forEach((c, i) => { if (i) p.lineTo(...c[0]); for (let k = 1; k < 10; k += 3) p.bezierCurveTo(...c[k], ...c[k + 1], ...c[k + 2]); });
  p.closePath(); return p;
}
const CORPS = { x: 100, y: 100, w: 824, h: 824 };
const SQUIRCLE = squircle(100, 100, 824, 824);
const DOS = { x: 64, y: 168, w: 896, h: 704 }, FACE = { x: 64, y: 250, w: 896, h: 622 };
function folderPaths() {
  const dos = new Path2D(), face = new Path2D();
  dos.roundRect(DOS.x, DOS.y, DOS.w, DOS.h, 56);
  const tab = new Path2D(); tab.roundRect(DOS.x, DOS.y - 44, 380, 140, 40); dos.addPath(tab);
  const pente = new Path2D(); pente.moveTo(DOS.x + 330, DOS.y - 44); pente.bezierCurveTo(DOS.x + 380, DOS.y - 44, DOS.x + 390, DOS.y, DOS.x + 450, DOS.y); pente.lineTo(DOS.x + 330, DOS.y + 60); pente.closePath(); dos.addPath(pente);
  face.roundRect(FACE.x, FACE.y, FACE.w, FACE.h, 52);
  return { dos, face };
}
const FOLDER = folderPaths();

/* ---------- images d'exemple (dessinées dans un canvas : aucun fichier lu) ---------- */
const mk = (w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; return c; };
function drawRocket(pal) {
  const c = mk(1024, 1024), x = c.getContext('2d'); x.translate(520, 520); x.rotate(0.62);
  const fl = x.createLinearGradient(0, 260, 0, 560); fl.addColorStop(0, '#ffd60a'); fl.addColorStop(.55, '#ff6a3d'); fl.addColorStop(1, 'rgba(255,106,61,0)');
  x.fillStyle = fl; x.beginPath(); x.moveTo(-72, 262); x.quadraticCurveTo(0, 640, 72, 262); x.closePath(); x.fill();
  x.fillStyle = '#fff5c2'; x.beginPath(); x.moveTo(-36, 262); x.quadraticCurveTo(0, 440, 36, 262); x.closePath(); x.fill();
  x.fillStyle = pal[0];
  [-1, 1].forEach(s => { x.beginPath(); x.moveTo(s * 105, 40); x.lineTo(s * 255, 250); x.lineTo(s * 255, 330); x.lineTo(s * 105, 250); x.closePath(); x.fill(); });
  const body = new Path2D('M0 -400 C150 -260 172 30 122 270 L-122 270 C-172 30 -150 -260 0 -400 Z');
  x.fillStyle = '#f5f5f7'; x.fill(body);
  x.save(); x.clip(body); x.fillStyle = 'rgba(0,0,0,.09)'; x.fillRect(40, -420, 200, 720); x.fillStyle = pal[0]; x.fillRect(-200, -420, 400, 240); x.restore();
  x.fillStyle = '#1c1c24'; x.beginPath(); x.arc(0, -40, 68, 0, 7); x.fill();
  x.fillStyle = '#4090f0'; x.beginPath(); x.arc(0, -40, 50, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(-16, -58, 14, 0, 7); x.fill();
  x.fillStyle = '#8e8e96'; x.beginPath(); x.roundRect(-84, 262, 168, 48, 14); x.fill();
  return c;
}
function drawCamera(pal) {
  const c = mk(1024, 1024), x = c.getContext('2d');
  x.fillStyle = pal[0]; x.beginPath(); x.roundRect(130, 330, 764, 460, 90); x.fill();
  x.beginPath(); x.roundRect(350, 250, 230, 120, 36); x.fill();
  x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.roundRect(130, 330, 764, 120, 90); x.fill();
  x.fillStyle = '#1c1c1e'; x.beginPath(); x.arc(512, 570, 180, 0, 7); x.fill();
  x.fillStyle = '#3a3a3f'; x.beginPath(); x.arc(512, 570, 140, 0, 7); x.fill();
  x.fillStyle = '#2f7bf5'; x.beginPath(); x.arc(512, 570, 96, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(470, 528, 26, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.roundRect(740, 372, 84, 52, 12); x.fill();
  return c;
}
function drawLeaf(pal, onWhite) {
  const c = mk(1024, 1024), x = c.getContext('2d');
  if (onWhite) { x.fillStyle = '#fff'; x.fillRect(0, 0, 1024, 1024); }
  const g = x.createLinearGradient(200, 800, 840, 200); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  x.fillStyle = g; x.fill(new Path2D('M190 830 C130 420 420 190 850 180 C860 620 640 880 190 830 Z'));
  x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineCap = 'round'; x.lineWidth = 22; x.beginPath(); x.moveTo(215, 805); x.quadraticCurveTo(430, 600, 720, 310); x.stroke();
  x.lineWidth = 14; [[380, 640, 330, 500], [500, 520, 470, 380], [560, 590, 700, 600], [440, 700, 590, 730]].forEach(([a, b, d, e]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); });
  return c;
}
function drawNote() {
  const c = mk(1024, 1024), x = c.getContext('2d'); x.fillStyle = '#f5f5f7';
  [[330, 760], [700, 690]].forEach(([a, b]) => { x.save(); x.translate(a, b); x.rotate(-0.38); x.beginPath(); x.ellipse(0, 0, 122, 88, 0, 0, 7); x.fill(); x.restore(); });
  x.fillRect(418, 300, 44, 470); x.fillRect(788, 230, 44, 490);
  x.beginPath(); x.moveTo(418, 262); x.lineTo(832, 190); x.lineTo(832, 318); x.lineTo(418, 392); x.closePath(); x.fill();
  return c;
}
const photo = { c: null, ready: false, cbs: [] };
function loadPhoto() {
  if (photo.c) return photo.c;
  photo.c = mk(1792, 1008); const im = new Image();
  im.onload = () => { photo.c.getContext('2d').drawImage(im, 0, 0, 1792, 1008); photo.ready = true; cache.clear(); tints.clear(); photo.cbs.splice(0).forEach(f => f()); };
  im.src = 'assets/wallpapers/prairie.jpg'; return photo.c;
}
const whenPhoto = cb => (photo.ready ? cb() : photo.cbs.push(cb));
const SAMPLES = [
  { id: 'rocket', file: 'rocket.png', make: () => drawRocket(PALETTES.orange), w: 1024, h: 1024, ico: 'app' },
  { id: 'camera', file: 'camera.png', make: () => drawCamera(PALETTES.bleu), w: 1024, h: 1024, ico: 'app' },
  { id: 'leaf', file: 'leaf-on-white.jpg', make: () => drawLeaf(PALETTES.vert, true), w: 1024, h: 1024, ico: 'cut', opaque: true },
  { id: 'photo', file: 'meadow-photo.jpg', make: loadPhoto, w: 1792, h: 1008, ico: 'photo', photo: true },
  { id: 'note', file: 'music-note.png', make: drawNote, w: 1024, h: 1024, ico: 'folder' }
];
const sampleSrc = s => ({ id: s.id + Math.random().toString(36).slice(2, 6), file: s.file, w: s.w, h: s.h, canvas: s.make(), opaque: s.opaque, photo: s.photo, sample: s });

/* ---------- traitement de l'image : détourage (baguette magique) et marges transparentes ---------- */
function cutout(src) {
  const W = 768, k = Math.min(1, W / Math.max(src.canvas.width, src.canvas.height)), w = Math.round(src.canvas.width * k), hh = Math.round(src.canvas.height * k);
  const c = mk(w, hh), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src.canvas, 0, 0, w, hh);
  const im = x.getImageData(0, 0, w, hh), d = im.data, n = w * hh;
  const edge = []; for (let i = 0; i < w; i++) { edge.push(i, (hh - 1) * w + i); } for (let j = 0; j < hh; j++) { edge.push(j * w, j * w + w - 1); }
  const med = ch => { const a = edge.map(i => d[i * 4 + ch]).sort((p, q) => p - q); return a[a.length >> 1]; };
  const bg = [med(0), med(1), med(2)], tol = 40;
  const near = i => Math.hypot(d[i * 4] - bg[0], d[i * 4 + 1] - bg[1], d[i * 4 + 2] - bg[2]) < tol;
  if (edge.filter(near).length < edge.length * 0.6) return null;   // pas de fond uni : rien à retirer
  const gone = new Uint8Array(n), q = new Int32Array(n); let qh = 0, qt = 0;
  for (const i of edge) if (!gone[i] && near(i)) { gone[i] = 1; q[qt++] = i; }
  while (qh < qt) { const i = q[qh++], px = i % w, py = (i / w) | 0; for (const j of [px > 0 ? i - 1 : -1, px < w - 1 ? i + 1 : -1, py > 0 ? i - w : -1, py < hh - 1 ? i + w : -1]) if (j >= 0 && !gone[j] && near(j)) { gone[j] = 1; q[qt++] = j; } }
  const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = gone[i] ? 0 : 1;
  for (let i = 0; i < n; i++) {   // bords adoucis (flou 3 × 3) et teinte du fond retirée
    const px = i % w, py = (i / w) | 0; let s = 0, m = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = px + dx, yy = py + dy; if (xx >= 0 && xx < w && yy >= 0 && yy < hh) { s += a[yy * w + xx]; m++; } }
    const al = s / m; if (al > 0 && al < 1) for (let ch = 0; ch < 3; ch++) d[i * 4 + ch] = clamp((d[i * 4 + ch] - bg[ch] * (1 - al)) / al, 0, 255);
    d[i * 4 + 3] = Math.round(255 * al);
  }
  x.putImageData(im, 0, 0); return c;
}
function trim(c) {
  const w = c.width, hh = c.height, tmp = mk(w, hh), x = tmp.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0);
  const d = x.getImageData(0, 0, w, hh).data;
  let t = -1, b = -1, l = w, r = -1;
  for (let y = 0; y < hh; y++) { let g = -1, e = -1; for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 8) { if (g < 0) g = i; e = i; } if (g < 0) continue; if (t < 0) t = y; b = y; l = Math.min(l, g); r = Math.max(r, e); }
  if (t < 0 || (l === 0 && t === 0 && r === w - 1 && b === hh - 1)) return c;
  const o = mk(r - l + 1, b - t + 1); o.getContext('2d').drawImage(c, l, t, o.width, o.height, 0, 0, o.width, o.height); return o;
}
const cache = new Map();
function motifOf(src, r) {
  if (!src) return null;
  const key = src.id + (r.detourer ? 'c' : '') + (r.recadrer ? 't' : '');
  if (!cache.has(key)) {
    if (cache.size > 24) cache.clear();
    let m = src.canvas; if (r.detourer) m = cutout(src) || m; if (r.recadrer && !src.opaque || (r.recadrer && r.detourer)) m = trim(m);
    m._id = key; cache.set(key, m);
  }
  return cache.get(key);
}
const tints = new Map();
function tint(m, col) {
  const k = m._id + col; if (tints.has(k)) return tints.get(k);
  const c = mk(m.width, m.height), x = c.getContext('2d'); x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  if (tints.size > 60) tints.clear(); tints.set(k, c); return c;
}

/* ---------- rendu : mêmes étapes que le moteur MiCONE (toile 1024, forme 824 centrée) ---------- */
function place(m, zone, r) {
  const iw = m.width, ih = m.height; let k;
  if (r.ajustement === 'remplir') k = Math.max(zone.w / iw, zone.h / ih);
  else { const cote = Math.min(zone.w, zone.h) * clamp(r.taille, 10, 100) / 100; k = Math.min(cote / iw, cote / ih); }
  const w = iw * k, hh = ih * k, cx = zone.x + zone.w / 2, cy = zone.y + zone.h / 2 + zone.h * r.decalageY / 100;
  return { x: cx - w / 2, y: cy - hh / 2, w, h: hh };
}
function fondColors(r) {
  if (r.fond === 'perso') { const b = hex2(r.couleur); return [lighter(b, 122), darker(b, 165)]; }
  return FONDS[r.fond].map(hex2);
}
function render(ctx, S, m, r) {
  const k = S / 1024; ctx.clearRect(0, 0, S, S); ctx.save(); ctx.scale(k, k);
  const shadow = (a, off, blur) => { ctx.shadowColor = `rgba(0,0,0,${a})`; ctx.shadowOffsetY = off * k; ctx.shadowBlur = blur * 1.3 * k; };
  const noShadow = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };
  if (r.type === 'dossier') {
    const base = r.fondDossier === 'perso' ? hex2(r.couleur) : hex2(DOSSIERS[r.fondDossier]), clair = lum(base) > 0.75;
    if (r.ombreIcone) { shadow(110 / 255, 12, 14); ctx.fillStyle = rgba(base); ctx.fill(FOLDER.dos); noShadow(); }
    ctx.fillStyle = rgba(darker(base, 122)); ctx.fill(FOLDER.dos);
    if (r.aplat) ctx.fillStyle = rgba(base); else { const g = ctx.createLinearGradient(0, FACE.y, 0, FACE.y + FACE.h); g.addColorStop(0, rgba(lighter(base, 110))); g.addColorStop(1, rgba(darker(base, 108))); ctx.fillStyle = g; }
    ctx.fill(FOLDER.face);
    ctx.save(); ctx.clip(FOLDER.face);
    if (m) {
      const rc = place(m, FACE, r);
      if (r.grave) { ctx.drawImage(tint(m, `rgba(255,255,255,${clair ? 150 / 255 : 70 / 255})`), rc.x, rc.y + 4, rc.w, rc.h); ctx.drawImage(tint(m, rgba(darker(base, clair ? 135 : 150))), rc.x, rc.y, rc.w, rc.h); }
      else { if (r.ombreMotif && r.ajustement !== 'remplir') shadow(110 / 255, 12, 16); ctx.drawImage(m, rc.x, rc.y, rc.w, rc.h); noShadow(); }
    }
    if (r.verre) { ctx.lineWidth = 5; ctx.strokeStyle = `rgba(255,255,255,${clair ? 200 / 255 : 110 / 255})`; ctx.stroke(FOLDER.face); }
    ctx.restore(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.176)'; ctx.stroke(FOLDER.face);
  } else {
    const [haut, bas] = fondColors(r), clair = (lum(haut) + lum(bas)) / 2 > 0.6;
    const plate = () => { if (r.aplat) return r.fond === 'perso' ? rgba(hex2(r.couleur)) : rgba({ r: (haut.r + bas.r) / 2, g: (haut.g + bas.g) / 2, b: (haut.b + bas.b) / 2 }); const g = ctx.createLinearGradient(0, CORPS.y, 0, CORPS.y + CORPS.h); g.addColorStop(0, rgba(haut)); g.addColorStop(1, rgba(bas)); return g; };
    if (r.ombreIcone) { shadow(110 / 255, 12, 14); ctx.fillStyle = rgba(bas); ctx.fill(SQUIRCLE); noShadow(); }
    ctx.fillStyle = plate(); ctx.fill(SQUIRCLE);
    ctx.save(); ctx.clip(SQUIRCLE);
    if (r.verre && !r.aplat) { const g = ctx.createRadialGradient(512, CORPS.y - 120, 0, 512, CORPS.y - 120, 760); g.addColorStop(0, `rgba(255,255,255,${clair ? 60 / 255 : 34 / 255})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(CORPS.x, CORPS.y, CORPS.w, CORPS.h); }
    if (m) { const rc = place(m, CORPS, r); if (r.ombreMotif && r.ajustement !== 'remplir') shadow(clair ? 90 / 255 : 150 / 255, 14, 16); ctx.drawImage(m, rc.x, rc.y, rc.w, rc.h); noShadow(); }
    if (r.verre) { const a = clair ? .55 : 1, g = ctx.createLinearGradient(0, CORPS.y, 0, CORPS.y + CORPS.h); g.addColorStop(0, `rgba(255,255,255,${120 / 255 * a})`); g.addColorStop(.25, `rgba(255,255,255,${28 / 255 * a})`); g.addColorStop(.75, `rgba(255,255,255,${14 / 255 * a})`); g.addColorStop(1, `rgba(255,255,255,${60 / 255 * a})`); ctx.lineWidth = 5; ctx.strokeStyle = g; ctx.stroke(SQUIRCLE); }
    ctx.restore(); ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(0,0,0,${clair ? 40 / 255 : 70 / 255})`; ctx.stroke(SQUIRCLE);
  }
  ctx.restore();
}

/* ---------- icônes générées par l'« IA » (démonstration : dessinées, aucune requête) ---------- */
const KINDS = [[/fus[ée]e|rocket|spaceship|vaisseau/, 'rocket'], [/appareil|camera|cam[ée]ra|photo/, 'camera'], [/feuille|leaf|plante|plant|arbre|tree|nature/, 'leaf'], [/note|music|musique|audio|son\b/, 'note']];
const COLORS = [[/bleu|blue/, 'bleu'], [/rouge|red/, 'rouge'], [/vert|green/, 'vert'], [/jaune|yellow/, 'jaune'], [/violet|purple/, 'violet'], [/orange/, 'orange']];
function gen(kind, color) {
  const pal = PALETTES[color] || PALETTES.orange;
  return kind === 'camera' ? drawCamera(pal) : kind === 'leaf' ? drawLeaf(pal, false) : kind === 'note' ? drawNote() : drawRocket(pal);
}
const NOUNS = { rocket: ['rocket lifting off', 'fusée'], camera: ['camera', 'appareil photo'], leaf: ['leaf', 'feuille'], note: ['music note', 'note de musique'] };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'icone';

/* ================================ fenêtre ================================ */
const svg = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO = { info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'), gear: svg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>') };
const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });

export async function open(app) {
  await sheetReady('css/demos/MiCONE.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1040, h: 700, x: 280, y: 84, minw: 820, minh: 560, bare: true, cls: 'socle micone', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  const r = { type: 'appli', fondDossier: 'bleu', grave: true, detourer: false, fond: 'sombre', couleur: '#2d6cdf', ajustement: 'contenir', taille: 72, decalageY: 0, recadrer: true, verre: true, ombreMotif: true, ombreIcone: false, aplat: false };
  const st = { src: null, png: false, nom: '', coll: '', status: '', level: '', exported: null, apply: false, customOpen: false, auto: true, busy: false };
  const COLLS = [['', 'MiCONE'], ['apps', T('Icônes d’applis', 'App icons')], ['folders', T('Dossiers', 'Folders')], ['mac', 'macOS 27']];
  const root = h('div', { class: 'micone-root', tabindex: '-1' });
  const side = h('aside', { class: 'micone-side nosb' }), work = h('main', { class: 'micone-work' });
  const pop = { el: null, off: null };
  let raf = 0, pv = 340;

  /* --- petits composants Socle --- */
  const closePop = () => { if (pop.el) { pop.el.remove(); pop.el = null; } if (pop.off) { document.removeEventListener('pointerdown', pop.off, true); pop.off = null; } };
  const scaleOf = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
  function popup(anchor, items, pick) {
    closePop();
    const menu = h('div', { class: 'micone-menu', role: 'listbox' }, items.map(([v, label, on]) => h('button', { class: 'micone-mi' + (on ? ' on' : ''), role: 'option', 'aria-selected': !!on, onclick: () => { closePop(); sfx.tick(); pick(v); } }, h('i', {}, on ? '✓' : ''), label)));
    root.append(menu); pop.el = menu;
    const ar = anchor.getBoundingClientRect(), rr = root.getBoundingClientRect(), sc = scaleOf();
    const mh = menu.offsetHeight, below = (ar.bottom - rr.top) / sc + 2;
    menu.style.left = (ar.left - rr.left) / sc + 'px'; menu.style.minWidth = ar.width / sc + 'px';
    menu.style.top = (below + mh > root.offsetHeight - 8 ? Math.max(8, (ar.top - rr.top) / sc - mh - 2) : below) + 'px';
    pop.off = e => { if (!alive()) return closePop(); if (!menu.contains(e.target) && !anchor.contains(e.target)) closePop(); };
    setTimeout(() => pop.el === menu && document.addEventListener('pointerdown', pop.off, true), 0);
  }
  const select = (opts, get, set, disabled) => {
    const cur = () => (opts.find(o => o[0] === get()) || opts[0])[1];
    const b = h('button', { class: 'micone-sel', 'aria-haspopup': 'listbox', disabled, onclick: () => (pop.el ? closePop() : popup(b, opts.map(o => [o[0], o[1], o[0] === get()]), v => { set(v); })) }, h('span', {}, cur()), h('i', { class: 'micone-chev' }, '⌄'));
    return b;
  };
  const check = (label, get, set, disabled) => h('button', { class: 'micone-check' + (get() ? ' on' : ''), role: 'checkbox', 'aria-checked': !!get(), disabled, onclick: e => { set(!get()); } }, h('i', {}, get() ? '✓' : ''), h('span', {}, label));
  const slider = (label, unit, get, set, min, max, disabled, signed) => {
    const val = h('span', { class: 'micone-mono' }, (signed && get() > 0 ? '+' : '') + get() + ' ' + unit);
    const inp = h('input', { type: 'range', min, max, step: 1, value: get(), disabled, 'aria-label': label, oninput: e => { set(+e.target.value, true); val.textContent = (signed && +e.target.value > 0 ? '+' : '') + e.target.value + ' ' + unit; } });
    return h('div', { class: 'micone-slider' + (disabled ? ' off' : '') }, h('div', { class: 'micone-row' }, h('span', {}, label), val), inp);
  };
  const eyebrow = s => h('div', { class: 'micone-eb' }, s);
  const secondary = (label, fn, cls = '', dis) => h('button', { class: 'micone-btn ' + cls, onclick: fn, disabled: dis }, label);

  /* --- état et rendu --- */
  const motif = () => (st.src ? motifOf(st.src, r) : null);
  const pvCanvas = h('canvas', { class: 'micone-pv', 'aria-label': T('Aperçu de l’icône', 'Icon preview') });
  const tiles = [128, 64, 32, 16].map(n => ({ n, el: h('canvas', { class: 'micone-tile', style: { width: n + 'px', height: n + 'px' } }) }));
  function draw() {
    raf = 0; if (!alive()) return;
    const m = motif(), dpr = Math.min(2, devicePixelRatio || 1);
    const big = Math.round(pv * dpr); if (pvCanvas.width !== big) { pvCanvas.width = big; pvCanvas.height = big; }
    pvCanvas.style.width = pvCanvas.style.height = pv + 'px';
    render(pvCanvas.getContext('2d'), big, m, r);
    tiles.forEach(({ n, el }) => { const s = Math.round(n * dpr); if (el.width !== s) { el.width = s; el.height = s; } render(el.getContext('2d'), s, m, r); });
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  function setSrc(src) {
    st.src = src; st.nom = src.file.replace(/\.[^.]+$/, ''); st.exported = null; st.status = ''; st.level = '';
    const s = src.sample; r.ajustement = s && s.photo ? 'remplir' : 'contenir'; r.detourer = !!(s && s.ico === 'cut');
    if (src.photo) whenPhoto(() => alive() && redraw());
    sfx.pop(); drawAll(); pvCanvas.animate([{ transform: 'scale(.94)', opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: reduced() ? 1 : 320, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  }
  const set = (k, v, live) => { r[k] = v; if (live) redraw(); else drawAll(); };

  /* --- barre d'en-tête --- */
  const bar = h('div', { class: 'sbar micone-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('MiCONE', BRAND) }), h('span', { class: 'micone-sub' }, T('Image → icône macOS', 'Image → macOS icon')), h('span', { class: 'micone-gap' }),
    h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download')),
    h('button', { class: 'micone-ib', 'aria-label': T('À propos de MiCONE', 'About MiCONE'), title: T('À propos de MiCONE', 'About MiCONE'), onclick: () => about(), html: ICO.info }),
    h('button', { class: 'micone-ib', 'aria-label': T('Réglages', 'Settings'), title: T('Réglages', 'Settings'), onclick: e => gear(e.currentTarget), html: ICO.gear }));
  function gear(anchor) {
    if (pop.el) return closePop();
    popup(anchor, [['upd', T('Rechercher une mise à jour…', 'Check for Updates…')], ['auto', T('Installer les mises à jour automatiquement', 'Install updates automatically'), st.auto]], v => {
      if (v === 'auto') st.auto = !st.auto; else { sfx.done(); toast({ icon: icon(app.id), title: app.id, body: T('MiCONE est à jour (version 2.0.0).', 'MiCONE is up to date (version 2.0.0).') }); }
    });
    pop.el.style.left = ''; pop.el.style.right = '12px'; pop.el.style.top = '44px';
  }

  /* --- barre latérale --- */
  function drawSide() {
    const keepTop = side.scrollTop; side.innerHTML = '';
    const dossier = r.type === 'dossier', contenir = r.ajustement === 'contenir', has = !!st.src;
    const fondOpts = dossier ? [...Object.keys(DOSSIERS), 'perso'].map(k => [k, T({ bleu: 'Bleu', graphite: 'Graphite', nuit: 'Nuit', clair: 'Clair', perso: 'Personnalisée…' }[k], { bleu: 'Blue', graphite: 'Graphite', nuit: 'Night', clair: 'Light', perso: 'Custom…' }[k])])
      : [...Object.keys(FONDS), 'perso'].map(k => [k, T({ sombre: 'Sombre (macOS 27)', graphite: 'Graphite', nuit: 'Nuit', clair: 'Clair', perso: 'Couleur personnalisée' }[k], { sombre: 'Dark (macOS 27)', graphite: 'Graphite', nuit: 'Night', clair: 'Light', perso: 'Custom colour' }[k])]);
    const fondKey = dossier ? 'fondDossier' : 'fond';
    side.append(
      secondary(T('Ouvrir une image…', 'Open an image…'), () => picker()),
      secondary(T('Créer avec une IA…', 'Create with AI…'), () => aiDialog()),
      h('p', { class: 'micone-meta' }, has ? `${st.src.file} — ${st.src.w} × ${st.src.h} px` : T('Aucune image chargée.', 'No image loaded.')),
      eyebrow(T('Type d’icône', 'Icon type')), select([['appli', T('Application', 'Application')], ['dossier', T('Dossier', 'Folder')]], () => r.type, v => set('type', v)),
      eyebrow(dossier ? T('Couleur du dossier', 'Folder colour') : T('Fond', 'Background')), select(fondOpts, () => r[fondKey], v => { set(fondKey, v); if (v === 'perso') st.customOpen = true; }));
    if (r[fondKey] === 'perso') {
      side.append(secondary(`${T('Choisir la couleur…', 'Choose colour…')}  ${r.couleur.toUpperCase()}`, () => { st.customOpen = !st.customOpen; drawSide(); }, 'micone-colorbtn'));
      if (st.customOpen) side.append(h('div', { class: 'micone-sw' }, SWATCHES.map(c => h('button', { class: 'micone-swatch' + (c === r.couleur ? ' on' : ''), style: { background: c }, 'aria-label': c, onclick: () => { sfx.tick(); set('couleur', c); } }))));
    }
    side.append(check(T('Aplat de couleur (sans dégradé)', 'Solid colour (no gradient)'), () => r.aplat, v => set('aplat', v)),
      eyebrow(T('Motif', 'Artwork')), select([['contenir', T('Contenir dans la forme', 'Fit inside the shape')], ['remplir', T('Remplir la forme (photo)', 'Fill the shape (photo)')]], () => r.ajustement, v => set('ajustement', v)),
      slider(T('Taille', 'Size'), '%', () => r.taille, (v, live) => set('taille', v, live), 20, 100, !contenir),
      slider(T('Décalage vertical', 'Vertical offset'), '%', () => r.decalageY, (v, live) => set('decalageY', v, live), -20, 20, !contenir, true),
      check(T('Retirer les marges transparentes', 'Trim transparent margins'), () => r.recadrer, v => set('recadrer', v)),
      check(T('Détourage automatique (fond, sujet ou plaque d’icône)', 'Automatic cut-out (background, subject or icon plate)'), () => r.detourer, v => set('detourer', v)));
    if (dossier) side.append(check(T('Motif gravé dans le dossier', 'Symbol engraved in the folder'), () => r.grave, v => set('grave', v)));
    side.append(eyebrow(T('Effets', 'Effects')),
      check(T('Reflet verre (bord et lumière haute)', 'Glass highlight (rim and top light)'), () => r.verre, v => set('verre', v)),
      check(T('Ombre douce sous le motif', 'Soft shadow under the artwork'), () => r.ombreMotif, v => set('ombreMotif', v), !contenir),
      check(T('Ombre portée autour de l’icône', 'Drop shadow around the icon'), () => r.ombreIcone, v => set('ombreIcone', v)),
      h('div', { class: 'micone-grow' }));
    side.append(h('div', { class: 'micone-pin' },
      check(T('Enregistrer aussi le .PNG 1024 px', 'Also save the 1024 px .PNG'), () => st.png, v => { st.png = v; drawSide(); }),
      h('p', { class: 'micone-meta' }, T('L’image d’origine n’est pas modifiée.', 'The original image is not modified.')),
      h('button', { class: 'sbtn act micone-cta', onclick: () => create(), disabled: !has || st.busy }, T('CRÉER LE .ICNS', 'CREATE THE .ICNS')),
      dossier ? secondary(T('Appliquer à un dossier…', 'Apply to a folder…'), () => folderDialog(), '', !has) : null));
    const nameInp = h('input', { class: 'micone-field', value: st.nom, disabled: !has, 'aria-label': T('Nom de l’icône dans iCONIQ', 'Icon name in iCONIQ'), oninput: e => { st.nom = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') sendIconiq(); } });
    side.append(h('p', { class: 'micone-lbl' }, T('Nom de l’icône dans iCONIQ', 'Icon name in iCONIQ')), nameInp,
      h('p', { class: 'micone-lbl' }, T('Collection dans iCONIQ', 'Collection in iCONIQ')), select(COLLS, () => st.coll, v => { st.coll = v; drawSide(); }, !has),
      secondary(T('Envoyer à iCONIQ', 'Send to iCONIQ'), () => sendIconiq(), '', !has));
    side.scrollTop = keepTop;
  }

  /* --- zone de travail --- */
  const status = h('div', { class: 'micone-status' });
  const stage = h('div', { class: 'micone-stage' });
  function drawWork() {
    work.innerHTML = '';
    if (!st.src) {
      if (!photo.ready) { loadPhoto(); whenPhoto(() => alive() && !st.src && drawWork()); }
      const samples = h('div', { class: 'micone-samples' }, SAMPLES.map(s => { const c = h('canvas', { width: 128, height: 128 }); const src = { canvas: s.make(), id: s.id, w: s.w, h: s.h }; render(c.getContext('2d'), 128, motifOf({ ...src, id: 'th' + s.id }, { ...r, taille: 72, ajustement: s.photo ? 'remplir' : 'contenir', detourer: s.ico === 'cut', type: s.ico === 'folder' ? 'dossier' : 'appli' }), { ...r, ajustement: s.photo ? 'remplir' : 'contenir', type: s.ico === 'folder' ? 'dossier' : 'appli' });
        return h('button', { class: 'micone-sample', 'aria-label': s.file, onclick: () => setSrc(sampleSrc(s)) }, c, h('span', {}, s.file)); }));
      const dz = h('div', { class: 'micone-drop', ondragover: e => { e.preventDefault(); dz.classList.add('on'); }, ondragleave: () => dz.classList.remove('on'), ondrop: e => { e.preventDefault(); dz.classList.remove('on'); sfx.tick(); toast({ icon: icon(app.id), title: app.id, body: T('Démo : aucun fichier n’est lu. Essayez une image d’exemple.', 'Demo: no file is read. Try a sample image.') }); } },
        h('p', { class: 'micone-h' }, T('Ouvrez ou glissez-déposez une image pour commencer.', 'Open or drop an image to get started.')),
        h('p', { class: 'micone-meta' }, T('Formats acceptés : .PNG, .JPG, .WEBP, .SVG, .HEIC, .TIF…', 'Supported formats: .PNG, .JPG, .WEBP, .SVG, .HEIC, .TIF…')),
        secondary(T('Ouvrir une image…', 'Open an image…'), () => picker(), 'micone-w220'), secondary(T('Créer avec une IA…', 'Create with AI…'), () => aiDialog(), 'micone-w220 ter'),
        h('p', { class: 'micone-meta micone-try' }, T('Ou essayez avec une image d’exemple :', 'Or try a sample image:')), samples);
      return work.append(dz);
    }
    work.append(eyebrow(T('Aperçu', 'Preview')), stage, eyebrow(T('Tailles réelles', 'Actual sizes')),
      h('div', { class: 'micone-sizes' }, tiles.map(({ n, el }) => h('div', { class: 'micone-size' }, el, h('span', {}, n + ' px')))), status);
    stage.innerHTML = ''; stage.append(pvCanvas); drawStatus();
  }
  function drawStatus() {
    status.innerHTML = ''; status.className = 'micone-status ' + st.level;
    if (!st.status) return;
    const mini = h('canvas', { class: 'micone-mini', width: 56, height: 56 }); render(mini.getContext('2d'), 56, motif(), r);
    status.append(mini, h('span', { class: 'micone-stext' }, st.status));
    if (st.exported) status.append(h('button', { class: 'micone-link', onclick: () => { sfx.click(); toast({ icon: icon(app.id), title: 'Finder', body: T('Dans l’appli, le fichier s’afficherait ici : ', 'In the app, the file would be revealed here: ') + st.exported }); } }, T('Afficher dans le Finder', 'Show in Finder')));
  }
  function drawAll() { drawSide(); drawWork(); redraw(); }

  /* --- actions --- */
  async function create() {
    if (!st.src || st.busy) return; st.busy = true; sfx.click();
    const file = (st.src.file.replace(/\.[^.]+$/, '') || 'icone') + '.icns';
    const from = pvCanvas.getBoundingClientRect(), rr = root.getBoundingClientRect(), sc = scaleOf();
    const ghost = h('canvas', { class: 'micone-fly', width: 256, height: 256 }); render(ghost.getContext('2d'), 256, motif(), r);
    Object.assign(ghost.style, { left: (from.left - rr.left) / sc + 'px', top: (from.top - rr.top) / sc + 'px', width: from.width / sc + 'px', height: from.height / sc + 'px' });
    root.append(ghost); drawSide();
    const tg = status.getBoundingClientRect(), dx = (tg.left - from.left) / sc, dy = (tg.top - from.top) / sc + (tg.height / sc - 28) / 2, k = 28 / (from.width / sc);
    ghost.style.transformOrigin = '0 0';
    if (!reduced()) await ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(${k})`, opacity: .9 }], { duration: 560, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished.catch(() => 0);
    ghost.remove(); if (!alive()) return;
    st.busy = false; st.exported = '~/Pictures/' + file + (st.png ? ' + _1024.png' : ''); st.level = 'ok'; st.status = T('✓ Icône créée : ', '✓ Icon created: ') + '~/Pictures/' + file;
    sfx.done(); drawSide(); drawStatus();
    status.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 260, easing: 'ease-out' });
  }
  function sendIconiq() {
    if (!st.src) return; const nm = (st.nom || '').trim() || st.src.file.replace(/\.[^.]+$/, '');
    const c = mk(256, 256); render(c.getContext('2d'), 256, motif(), r);
    (window.__wscIconiq = window.__wscIconiq || []).push({ name: nm, kind: r.type === 'dossier' ? 'folder' : 'app', url: c.toDataURL('image/png'), coll: st.coll });
    st.level = 'ok'; st.exported = null; st.status = T('Icône envoyée à iCONIQ.', 'Icon sent to iCONIQ.'); sfx.done(); drawStatus();
    toast({ icon: icon('iCONIQ'), title: 'iCONIQ', body: T(`« ${nm} » reçue de MiCONE : rangée dans la collection « ${(COLLS.find(c0 => c0[0] === st.coll) || COLLS[0])[1]} ».`, `“${nm}” received from MiCONE: filed in the “${(COLLS.find(c0 => c0[0] === st.coll) || COLLS[0])[1]}” collection.`) });
  }

  /* --- fenêtres secondaires (feuilles centrées dans la fenêtre de l'appli) --- */
  let sheetEl = null;
  const closeSheet = () => { if (sheetEl) { sheetEl.remove(); sheetEl = null; } };
  function sheet(title, body, foot, cls = '') {
    closePop(); closeSheet();
    const card = h('div', { class: 'micone-sheet ' + cls, role: 'dialog', 'aria-label': title }, h('h3', {}, title), body, foot);
    sheetEl = h('div', { class: 'micone-scrim', onpointerdown: e => { if (e.target === sheetEl) closeSheet(); } }, card);
    root.append(sheetEl); card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 180, easing: 'ease-out' }); return card;
  }
  function picker() {
    const rows = SAMPLES.map(s => { const c = h('canvas', { width: 80, height: 80 }), src = sampleSrc(s); render(c.getContext('2d'), 80, motifOf({ ...src, id: 'p' + src.id }, { ...r, ajustement: s.photo ? 'remplir' : 'contenir', detourer: s.ico === 'cut', type: s.ico === 'folder' ? 'dossier' : 'appli' }), { ...r, ajustement: s.photo ? 'remplir' : 'contenir', type: s.ico === 'folder' ? 'dossier' : 'appli' });
      return h('button', { class: 'micone-row-pick', onclick: () => { closeSheet(); setSrc(sampleSrc(s)); } }, c, h('span', { class: 'micone-pn' }, h('b', {}, s.file), h('small', {}, `${s.w} × ${s.h} px`))); });
    sheet(T('Ouvrir une image…', 'Open an image…'), h('div', { class: 'micone-list' }, h('p', { class: 'micone-meta' }, T('Images d’exemple de la démo : aucun fichier de votre Mac n’est lu.', 'Demo sample images: no file on your Mac is read.')), rows),
      h('div', { class: 'micone-foot' }, secondary(T('ANNULER', 'CANCEL'), closeSheet, 'ter')), 'micone-s440');
  }
  function folderDialog() {
    const dirs = ['~/Documents/Projets', '~/Documents/Factures', '~/Téléchargements', '~/Bureau/Photos'];
    sheet(T('Appliquer à un dossier…', 'Apply to a folder…'), h('div', { class: 'micone-list' }, dirs.map(d => h('button', { class: 'micone-row-pick', onclick: () => { closeSheet(); sfx.pop(); st.exported = null; st.level = 'ok'; st.status = T('Icône appliquée à ', 'Icon applied to ') + d; drawStatus(); } },
      h('i', { class: 'micone-fold' }), h('span', { class: 'micone-pn' }, h('b', {}, d.split('/').pop()), h('small', {}, d))))),
      h('div', { class: 'micone-foot' }, secondary(T('ANNULER', 'CANCEL'), closeSheet, 'ter')), 'micone-s440');
  }
  function about() {
    sheet(T('À propos', 'About'), h('div', { class: 'micone-about' }, h('img', { src: icon(app.id), alt: '' }), h('b', { html: brand('MiCONE', BRAND) }), h('span', { class: 'micone-meta' }, T('Version 2.0.0', 'Version 2.0.0')),
      h('p', {}, T('Transforme n’importe quelle image en icône macOS (.ICNS) sur le fond sombre des icônes de macOS 27.', 'Turns any image into a macOS icon (.ICNS) on the dark background of macOS 27 icons.')),
      h('p', {}, h('b', {}, 'Starbudweiser & Claude Code (Anthropic)')), h('p', {}, T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.')), h('p', { class: 'micone-meta' }, T('Fourni en l’état, sans garantie.', 'Provided "as is", without warranty.'))),
      h('div', { class: 'micone-foot' }, secondary(T('FERMER', 'CLOSE'), closeSheet, 'pri')), 'micone-s360');
  }

  /* --- « Créer avec une IA » : conversation simulée, icônes dessinées --- */
  const ia = { entries: [], service: 'pollinations', style: '3d', flat: false, reglages: false, det: true, trad: true, ret: true, last: null, busy: false, text: '' };
  function aiDialog() {
    const SERV = [['pollinations', T('IA gratuite, sans inscription', 'Free AI, no sign-up')], ['huggingface', T('Hugging Face (clé gratuite)', 'Hugging Face (free key)')], ['gemini', T('Google Gemini (clé API)', 'Google Gemini (API key)')], ['openai', T('OpenAI (clé API)', 'OpenAI (API key)')]];
    const STY = [['3d', T('3D brillant (façon macOS)', 'Glossy 3D (macOS-like)')], ['plat', T('Plat minimaliste', 'Flat minimalist')], ['glyphe', T('Glyphe blanc', 'White glyph')]];
    const body = h('div', { class: 'micone-ia' }), hist = h('div', { class: 'micone-hist' }), statusLine = h('span', { class: 'micone-stext' });
    const area = h('textarea', { class: 'micone-area', rows: 3, placeholder: T('Ex. : une fusée stylisée qui décolle d’un nuage', 'E.g. a stylised rocket lifting off from a cloud'), 'aria-label': T('Votre demande', 'Your request'), oninput: e => { ia.text = e.target.value; }, onkeydown: e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } } });
    const prog = h('div', { class: 'sprog micone-prog hid' }, h('i', {}));
    let card = null;
    const draw = () => {
      body.innerHTML = '';
      body.append(h('div', { class: 'micone-ia-top' }, h('span', {}, T('Service', 'Service')), select(SERV, () => ia.service, v => { ia.service = v; ia.reglages = v !== 'pollinations'; draw(); }), h('span', {}, T('Style', 'Style')), select(STY, () => ia.style, v => { ia.style = v; draw(); }, ia.flat),
        check(T('Style flat vectoriel', 'Flat vector style'), () => ia.flat, v => { ia.flat = v; draw(); }), secondary(T('Réglages…', 'Settings…'), () => { ia.reglages = !ia.reglages; draw(); }, ia.reglages ? '' : 'ter')));
      if (ia.reglages) body.append(h('div', { class: 'micone-ia-set' }, h('div', { class: 'micone-ia-line' }, h('span', {}, T('Modèle', 'Model')), h('input', { class: 'micone-field', value: { pollinations: 'flux', huggingface: 'FLUX.1-schnell', gemini: 'gemini-2.5-flash-image', openai: 'gpt-image-1' }[ia.service], 'aria-label': T('Modèle', 'Model') })),
        h('div', { class: 'micone-ia-line' }, h('span', {}, T('Clé API', 'API key')), h('input', { class: 'micone-field', type: 'password', placeholder: '••••••••••••', 'aria-label': T('Clé API', 'API key') }), secondary(T('Enregistrer la clé', 'Save key'), () => { ia.msg = T('✓ Clé enregistrée dans le trousseau.', '✓ Key saved to the Keychain.'); sfx.tick(); statusLine.textContent = ia.msg; }, 'micone-inl')),
        h('p', { class: 'micone-meta' }, (ia.service === 'pollinations' ? T('Clé facultative. Sans clé : petit logo du service incrusté dans l’image et une image toutes les 45 s au plus. ', 'Optional key. Without it: a small service logo on the image and one image every 45 s at most. ') : '') + T('La clé est conservée dans le trousseau macOS, jamais dans un fichier.', 'The key is stored in the macOS Keychain, never in a file.'))));
      hist.innerHTML = ''; if (!ia.entries.length) hist.append(h('p', { class: 'micone-empty' }, T('Décrivez l’icône souhaitée, puis affinez-la en conversant : « plus de bleu », « vue de face »…', 'Describe the icon you want, then refine it by chatting: “more blue”, “front view”…')));
      ia.entries.forEach(e => hist.append(entryEl(e)));
      body.append(hist, area, h('div', { class: 'micone-ia-checks' }, check(T('Détourer le fond uni', 'Remove the plain background'), () => ia.det, v => { ia.det = v; draw(); }), check(T('Traduire ma demande en anglais', 'Translate my request into English'), () => ia.trad, v => { ia.trad = v; draw(); }), check(T('Retoucher la dernière image', 'Edit the last image'), () => ia.ret, v => { ia.ret = v; draw(); }, !ia.last)),
        h('div', { class: 'micone-foot' }, secondary(T('NOUVELLE CONVERSATION', 'NEW CONVERSATION'), () => { if (ia.busy) return; ia.entries = []; ia.last = null; ia.ret = true; draw(); }, 'ter'), h('button', { class: 'micone-btn pri micone-w120', onclick: () => send(), disabled: ia.busy }, T('ENVOYER', 'SEND'))),
        h('div', { class: 'micone-ia-status' }, statusLine, prog));
      area.value = ia.text; requestAnimationFrame(() => { hist.scrollTop = hist.scrollHeight; });
    };
    const entryEl = e => e.k === 'you' ? h('p', { class: 'micone-you' }, h('b', {}, T('Vous', 'You') + ' : '), e.text) : e.k === 'en' ? h('p', { class: 'micone-en' }, `→ ${T('envoyé en anglais', 'sent in English')} : ${e.text}`)
      : h('div', { class: 'micone-card' }, h('div', { class: 'micone-card-in' }, e.big, h('div', { class: 'micone-card-side' }, h('div', { class: 'micone-raw' }, e.raw), secondary(T('Utiliser cette image', 'Use this image'), () => use(e), 'micone-fit'))),
        h('button', { class: 'micone-btn ter micone-fit', onclick: ev => { e.open = !e.open; ev.currentTarget.classList.toggle('ter', !e.open); ev.currentTarget.nextElementSibling.classList.toggle('hid', !e.open); } }, T('Voir le prompt envoyé', 'Show the prompt sent')), h('p', { class: 'micone-en hid' }, e.prompt));
    async function send() {
      const txt = ia.text.trim(); if (!txt || ia.busy) return; ia.busy = true; sfx.click();
      ia.entries.push({ k: 'you', text: txt }); ia.text = ''; area.value = '';
      const low = txt.toLowerCase(); let kind = (KINDS.find(([re]) => re.test(low)) || [])[1], color = (COLORS.find(([re]) => re.test(low)) || [])[1];
      if (!kind) kind = (ia.ret && ia.last) ? ia.last.kind : 'rocket'; if (!color) color = (ia.ret && ia.last) ? ia.last.color : 'orange';
      const noun = NOUNS[kind][0], styleTxt = ia.flat ? 'flat vector style' : { '3d': 'glossy 3D app icon, macOS style', plat: 'flat minimalist app icon', glyphe: 'white glyph icon' }[ia.style];
      const prompt = `${styleTxt}, a ${noun}, ${color === 'orange' && !/orange/.test(low) ? 'warm' : { rouge: 'red', bleu: 'blue', vert: 'green', jaune: 'yellow', violet: 'purple', orange: 'orange' }[color]} colours, centered, plain background, no text`;
      if (ia.trad) ia.entries.push({ k: 'en', text: prompt });
      draw(); statusLine.textContent = T('Génération en cours… (jusqu’à une minute)', 'Generating… (up to a minute)'); prog.classList.remove('hid'); prog.firstChild.style.width = '8%';
      for (let i = 1; i <= 8; i++) { if (!alive() || !sheetEl) { ia.busy = false; return; } await wait(reduced() ? 0 : 170); prog.firstChild.style.width = 8 + i * 11 + '%'; }
      if (!alive() || !sheetEl) { ia.busy = false; return; }
      const motifC = gen(kind, color), src = { id: 'gen' + Date.now(), canvas: motifC, w: 1024, h: 1024, file: slug(txt) + '.png' };
      const big = mk(440, 440), raw = mk(192, 192);
      render(big.getContext('2d'), 440, trim(motifC), { ...r, type: 'appli', fond: 'sombre', aplat: false, ajustement: 'contenir', taille: 72, decalageY: 0, verre: true, ombreMotif: true, ombreIcone: false });
      const rx = raw.getContext('2d'); rx.drawImage(motifC, 0, 0, 192, 192);
      ia.entries.push({ k: 'card', big, raw, prompt, src, kind, color }); ia.last = { kind, color }; ia.busy = false; ia.ret = true; prog.classList.add('hid'); sfx.done(); draw(); statusLine.textContent = ''; area.focus({ preventScroll: true });
    }
    function use(e) { closeSheet(); const s = e.src; setSrc({ id: s.id, file: s.file.replace('.png', '') + '-20261110-021700.png', w: 1024, h: 1024, canvas: s.canvas }); }
    draw(); card = sheet(T('Créer une icône avec une IA', 'Create an icon with AI'), body, null, 'micone-sia');
  }

  /* --- raccourcis : ⌘O ouvrir, ⌘↩ créer, ⌘, réglages --- */
  const onKey = e => {
    if (!alive()) return document.removeEventListener('keydown', onKey);
    if (!w.el.classList.contains('active')) return;
    const mod = e.metaKey || e.ctrlKey; if (e.key === 'Escape') { if (sheetEl) { closeSheet(); e.stopPropagation(); } else closePop(); return; }
    if (!mod || e.target.matches('textarea,input[type=text],input[type=password],.micone-field')) return;
    if (e.key.toLowerCase() === 'o') { e.preventDefault(); picker(); } else if (e.key === 'Enter' && st.src) { e.preventDefault(); create(); }
  };
  document.addEventListener('keydown', onKey);
  const ro = new ResizeObserver(() => { if (!alive()) return ro.disconnect(); const hh = work.clientHeight; const next = clamp(Math.floor(hh - 316), 180, 360); if (next !== pv) { pv = next; redraw(); } });

  root.append(bar, h('div', { class: 'micone-body' }, side, work));
  drawAll(); requestAnimationFrame(() => { if (alive()) ro.observe(work); });
  return root;
}
