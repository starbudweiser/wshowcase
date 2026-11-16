/* mSIZER : réplique interactive de l'éditeur de photos par lots. Mêmes panneaux, mêmes opérations et mêmes libellés que l'appli :
   préréglages, redimensionner, recadrer (rapport ou manuel à poignées), rotation, retouches, filigrane, format, métadonnées, renommer, destination,
   plus le module RAW → DNG (v1.3) : dérushage (grille, visionneuse, étoiles, retenue/rejet), conversion par lots sans perte, RAW incorporé, corbeille des rejetées.
   Les photos d'exemple sont celles du site ; les RAW sont factices (aperçus dessinés) ; tout le traitement se fait dans le navigateur, aucun fichier n'est lu. */
import { h, brand, T, css, toast, icon, sfx, wm, download, clamp, reduced, wait, num } from './kit.js';
import { t, lang } from '../i18n.js';

const BRAND = '#f472b6';
const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });
const mk = (w, hh) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hh)); return c; };
const svg = (d, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const GEAR = '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>';
const MARK = `<svg viewBox="0 0 640 640" width="96" height="96" aria-hidden="true"><g transform="translate(320 320)" fill="none" stroke="currentColor"><rect x="-250" y="-250" width="500" height="500" rx="80" stroke-width="50"/><path d="M45-45 165-165" stroke-width="44" stroke-linecap="butt"/></g><g transform="translate(320 320)" fill="currentColor"><rect x="-185" y="-45" width="230" height="230" rx="30"/><path d="M215-215v95l-95 95z" transform="translate(0 0)"/></g></svg>`;

/* ---------- photos d'exemple : les fonds d'écran du site, recadrés au format voulu ---------- */
const PHOTOS = [['IMG_4021.jpg', 'dune', 3, 2, 6000, 4000, .5], ['IMG_4022.jpg', 'prairie', 4, 3, 4032, 3024, .4], ['DSC_0187.jpg', 'ocean', 3, 2, 6000, 4000, .5], ['IMG_4030.jpg', 'tes_hrothgar', 3, 4, 3024, 4032, .55],
  ['IMG_4041.jpg', 'nordique', 3, 2, 5472, 3648, .5], ['DSC_0214.jpg', 'tes_solitude', 16, 9, 5504, 3096, .5], ['IMG_4057.jpg', 'tes_moons', 4, 3, 4032, 3024, .35], ['IMG_4063.jpg', 'tes_markarth', 4, 5, 3024, 3780, .5],
  ['DSC_0231.jpg', 'tes_whiterun', 3, 2, 6000, 4000, .5], ['IMG_4078.jpg', 'brume', 3, 2, 4032, 2688, .5], ['IMG_4082.jpg', 'dragon', 16, 9, 3840, 2160, .6], ['DSC_0256.jpg', 'tes_winterhold', 1, 1, 4000, 4000, .45],
  ['IMG_4094.jpg', 'tes_sovngarde', 3, 2, 4032, 2688, .5], ['IMG_4101.jpg', 'tes_dwemer', 4, 3, 4032, 3024, .6], ['DSC_0278.jpg', 'tes_oblivion', 3, 2, 6000, 4000, .5], ['IMG_4119.jpg', 'tes_rift', 3, 2, 5472, 3648, .5]];
const imgCache = new Map();
const loadImg = name => { if (!imgCache.has(name)) imgCache.set(name, new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = `assets/wallpapers/${name}.jpg`; })); return imgCache.get(name); };
async function makeBase(p) {
  const [, name, ar1, ar2, , , cx] = p, im = await loadImg(name); if (!im) return null;
  const W = im.naturalWidth, H = im.naturalHeight, ar = ar1 / ar2; let cw = W, ch = H;
  if (W / H > ar) cw = Math.round(H * ar); else ch = Math.round(W / ar);
  const sx = Math.round((W - cw) * cx), long = 1400, k = Math.min(1, long / Math.max(cw, ch)), c = mk(cw * k, ch * k);
  c.getContext('2d').drawImage(im, sx, Math.round((H - ch) / 2), cw, ch, 0, 0, c.width, c.height); return c;
}

/* ---------- réglages (mêmes valeurs par défaut que l'appli) ---------- */
const DEF = () => ({ resizeOn: true, resizeMode: 'longest', resizeValue: 1920, resizeValue2: 1080, noEnlarge: true, cropOn: false, cropRatio: 'square', cropW: 16, cropH: 10, cropAnchor: 4, cropLock: 'free',
  rotateOn: false, rotation: 0, flipH: false, flipV: false, adjustOn: false, autoEnhance: false, brightness: 0, contrast: 1, saturation: 1, sharpen: 0, mono: false,
  watermarkOn: false, wmKind: 'text', wmText: '© ', wmDark: false, wmLogo: false, wmSize: .2, wmOpacity: .7, wmAnchor: 8, wmMargin: .03,
  format: 'jpeg', quality: .82, maxKB: 0, toSRGB: true, metaMode: 'keep', renameOn: false, pattern: '{name}', startNumber: 1, outputMode: 'subfolder', outputFolder: '' });
const BUILTIN = [['web', s => { s.resizeValue = 1920; s.quality = .8; }], ['mail', s => { s.resizeValue = 1280; s.quality = .8; s.maxKB = 300; s.metaMode = 'strip'; }], ['insta', s => { s.cropOn = true; s.cropRatio = 'r45'; s.resizeMode = 'width'; s.resizeValue = 1080; s.quality = .88; }],
  ['square', s => { s.cropOn = true; s.cropRatio = 'square'; s.resizeMode = 'width'; s.resizeValue = 1080; s.quality = .88; }], ['webp', s => { s.resizeValue = 1920; s.format = 'webp'; s.quality = .8; }], ['heic', s => { s.resizeOn = false; s.format = 'heic'; s.quality = .7; }],
  ['thumbs', s => { s.resizeValue = 400; s.quality = .75; s.metaMode = 'strip'; }], ['privacy', s => { s.resizeOn = false; s.metaMode = 'strip'; s.quality = .95; }]];
const PRESET_NAME = { web: ['Web (1920 px)', 'Web (1920 px)'], mail: ['E-mail (300 Ko max)', 'E-mail (300 KB max)'], insta: ['Instagram portrait 4:5', 'Instagram portrait 4:5'], square: ['Carré 1:1 (1080 px)', 'Square 1:1 (1080 px)'], webp: ['WebP léger', 'Light WebP'], heic: ['HEIC léger, taille d’origine', 'Light HEIC, original size'], thumbs: ['Miniatures (400 px)', 'Thumbnails (400 px)'], privacy: ['Effacer les métadonnées', 'Erase metadata'] };
const SOCIAL = [['Instagram', [['square', 1080, 1080], ['portrait', 1080, 1350], ['landscape', 1080, 566], ['story', 1080, 1920], ['profile', 320, 320]]], ['Facebook', [['post', 1200, 630], ['story', 1080, 1920], ['cover', 1640, 624], ['profile', 400, 400]]], ['X', [['post', 1600, 900], ['banner', 1500, 500], ['profile', 400, 400]]],
  ['LinkedIn', [['post', 1200, 627], ['banner', 1584, 396], ['profile', 400, 400]]], ['YouTube', [['thumb', 1280, 720], ['banner', 2560, 1440], ['profile', 800, 800]]], ['TikTok', [['story', 1080, 1920], ['profile', 200, 200]]], ['Pinterest', [['pin', 1000, 1500], ['profile', 400, 400]]],
  ['Snapchat', [['story', 1080, 1920]]], ['WhatsApp', [['profile', 500, 500]]], ['Discord', [['profile', 512, 512], ['banner', 960, 540]]], ['Twitch', [['profile', 256, 256], ['banner', 1200, 480]]]];
const KIND = { square: ['Publication carrée', 'Square post'], portrait: ['Publication portrait', 'Portrait post'], landscape: ['Publication paysage', 'Landscape post'], post: ['Publication', 'Post'], story: ['Story / Reel (9:16)', 'Story / Reel (9:16)'], profile: ['Photo de profil', 'Profile picture'], cover: ['Couverture', 'Cover'], banner: ['Bannière', 'Banner'], thumb: ['Miniature', 'Thumbnail'], pin: ['Épingle', 'Pin'] };
const FORMATS = ['original', 'jpeg', 'png', 'webp', 'heic', 'avif', 'jp2', 'tiff', 'gif', 'bmp', 'tga', 'psd', 'pdf', 'exr', 'ico', 'icns'];
const hasQuality = f => ['jpeg', 'heic', 'avif', 'webp', 'jp2'].includes(f), isIcon = f => f === 'ico' || f === 'icns';
const fmtLabel = f => f === 'original' ? T('Identique', 'Same as source') : f === 'jp2' ? 'JP2' : f === 'webp' ? 'WebP' : f.toUpperCase();
const RATIO = { square: 1, r43: 4 / 3, r32: 3 / 2, r169: 16 / 9, r45: 4 / 5, r916: 9 / 16 };
const RATIO_LABEL = { square: '1:1', r43: '4:3', r32: '3:2', r169: '16:9', r45: '4:5', r916: '9:16' };
const lockRatio = s => { if (s.cropLock === 'output') return s.resizeOn && (s.resizeMode === 'fit' || s.resizeMode === 'fill') && s.resizeValue > 0 && s.resizeValue2 > 0 ? s.resizeValue / s.resizeValue2 : null; return s.cropLock === 'free' ? null : RATIO[s.cropLock]; };

/* ---------- recadrage manuel : rectangle normalisé (mêmes règles que l'appli) ---------- */
const NR = {
  MIN: .03, cl: (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi)),
  full: () => ({ x: 0, y: 0, w: 1, h: 1 }),
  fitted(r, ratio, aspect) { let nw = r.w, nh = r.h; if (nw * aspect / nh > ratio) nw = nh * ratio / aspect; else nh = nw * aspect / ratio; const cx = r.x + r.w / 2, cy = r.y + r.h / 2; return { x: NR.cl(cx - nw / 2, 0, 1 - nw), y: NR.cl(cy - nh / 2, 0, 1 - nh), w: nw, h: nh }; },
  corner(a, p, lock, aspect) {
    const px = NR.cl(p.x, 0, 1), py = NR.cl(p.y, 0, 1), sx = px >= a.x ? 1 : -1, sy = py >= a.y ? 1 : -1; let w = Math.abs(px - a.x), hh = Math.abs(py - a.y);
    if (lock) { const k = aspect / lock; w = Math.max(w, hh / k); w = Math.min(w, sx > 0 ? 1 - a.x : a.x, (sy > 0 ? 1 - a.y : a.y) / k); w = Math.max(w, NR.MIN); hh = w * k; } else { w = Math.max(w, NR.MIN); hh = Math.max(hh, NR.MIN); }
    return { x: NR.cl(sx > 0 ? a.x : a.x - w, 0, 1 - w), y: NR.cl(sy > 0 ? a.y : a.y - hh, 0, 1 - hh), w, h: hh };
  },
  resized(r, hd, p, lock, aspect) {
    const px = NR.cl(p.x, 0, 1), py = NR.cl(p.y, 0, 1), L = hd.includes('l'), R = hd.includes('r'), Tp = hd.includes('t'), B = hd.includes('b');
    if (lock) {
      const k = aspect / lock;
      if (hd.length === 2) { const a = { x: L ? r.x + r.w : r.x, y: Tp ? r.y + r.h : r.y }; return NR.corner(a, p, lock, aspect); }
      if (hd === 'l' || hd === 'r') { const ax = hd === 'l' ? r.x + r.w : r.x, nw = Math.max(NR.MIN, Math.min(Math.abs(px - ax), hd === 'l' ? ax : 1 - ax, 1 / k)), nh = nw * k; return { x: hd === 'l' ? ax - nw : ax, y: NR.cl(r.y + r.h / 2 - nh / 2, 0, 1 - nh), w: nw, h: nh }; }
      const ay = hd === 't' ? r.y + r.h : r.y, nh = Math.max(NR.MIN * k, Math.min(Math.abs(py - ay), hd === 't' ? ay : 1 - ay, k)), nw = nh / k; return { x: NR.cl(r.x + r.w / 2 - nw / 2, 0, 1 - nw), y: hd === 't' ? ay - nh : ay, w: nw, h: nh };
    }
    let l = r.x, tp = r.y, rt = r.x + r.w, b = r.y + r.h;
    if (L) l = Math.min(px, rt - NR.MIN); if (R) rt = Math.max(px, l + NR.MIN); if (Tp) tp = Math.min(py, b - NR.MIN); if (B) b = Math.max(py, tp + NR.MIN);
    return { x: l, y: tp, w: rt - l, h: b - tp };
  },
  moved: (r, dx, dy) => ({ x: NR.cl(r.x + dx, 0, 1 - r.w), y: NR.cl(r.y + dy, 0, 1 - r.h), w: r.w, h: r.h })
};

/* ---------- géométrie : même plan que le moteur (rotation, recadrage, redimensionnement) ---------- */
function plan(width, height, s, crop) {
  let w = width, hh = height; if (s.rotateOn && (s.rotation === 90 || s.rotation === 270)) [w, hh] = [hh, w];
  const ax = [0, .5, 1][s.cropAnchor % 3], ay = [0, .5, 1][Math.floor(s.cropAnchor / 3)];
  let c = { x: 0, y: 0, w, h: hh };
  if (s.cropOn && s.cropRatio === 'manual') {
    let n = crop || NR.full(); const lr = lockRatio(s); if (lr) n = NR.fitted(n, lr, w / hh);
    const cw = Math.max(1, Math.min(w, Math.round(n.w * w))), ch = Math.max(1, Math.min(hh, Math.round(n.h * hh)));
    c = { x: Math.max(0, Math.min(w - cw, Math.round(n.x * w))), y: Math.max(0, Math.min(hh - ch, Math.round(n.y * hh))), w: cw, h: ch };
  } else if (s.cropOn) {
    const r = RATIO[s.cropRatio] || (s.cropH > 0 ? s.cropW / s.cropH : 0);
    if (r > 0) { let cw = w, ch = hh; if (w / hh > r) cw = Math.round(hh * r); else ch = Math.round(w / r); cw = Math.max(1, Math.min(w, cw)); ch = Math.max(1, Math.min(hh, ch)); c = { x: Math.round((w - cw) * ax), y: Math.round((hh - ch) * ay), w: cw, h: ch }; }
  }
  const cw = c.w, ch = c.h, v = s.resizeValue, v2 = s.resizeValue2; let scale = 1;
  if (s.resizeOn && v > 0) {
    scale = { longest: () => v / Math.max(cw, ch), width: () => v / cw, height: () => v / ch, percent: () => v / 100, fit: () => v2 > 0 ? Math.min(v / cw, v2 / ch) : v / cw, fill: () => v2 > 0 ? Math.max(v / cw, v2 / ch) : v / cw }[s.resizeMode]();
    if (s.noEnlarge) scale = Math.min(scale, 1);
  }
  const preW = Math.max(1, Math.round(cw * scale)), preH = Math.max(1, Math.round(ch * scale)); let outW = preW, outH = preH, fin = null;
  if (s.resizeOn && s.resizeMode === 'fill' && v > 0 && v2 > 0) { const tw = Math.min(Math.round(v), preW), th = Math.min(Math.round(v2), preH); if (tw < preW || th < preH) { fin = { x: Math.round((preW - tw) * ax), y: Math.round((preH - th) * ay), w: tw, h: th }; outW = tw; outH = th; } }
  const region = fin ? { x: c.x + fin.x / scale, y: c.y + fin.y / scale, w: fin.w / scale, h: fin.h / scale } : c;
  return { rw: w, rh: hh, crop: c, scale, outW, outH, region };
}

/* ---------- filtres, filigrane et estimation du poids ---------- */
const HAS_FILTER = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;
function rotated(item, s) {
  const rot = s.rotateOn ? s.rotation : 0, fh = s.rotateOn && s.flipH, fv = s.rotateOn && s.flipV, key = `${rot}${fh}${fv}`;
  if (item._rot && item._rot.key === key) return item._rot.c;
  const b = item.base, swap = rot === 90 || rot === 270, c = mk(swap ? b.height : b.width, swap ? b.width : b.height), x = c.getContext('2d');
  x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.scale(fh ? -1 : 1, fv ? -1 : 1); x.drawImage(b, -b.width / 2, -b.height / 2);
  item._rot = { key, c }; return c;
}
const logoImg = (() => { const c = mk(240, 240), x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 16; x.beginPath(); x.roundRect(20, 20, 200, 200, 34); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.roundRect(52, 90, 96, 96, 14); x.fill(); x.fillRect(150, 70, 8, 8); x.beginPath(); x.moveTo(176, 64); x.lineTo(176, 112); x.lineTo(128, 64); x.closePath(); x.fill(); return c; })();
function sharpen(c, amount) {
  const w = c.width, hh = c.height, x = c.getContext('2d', { willReadFrequently: true }), a = x.getImageData(0, 0, w, hh), d = a.data, o = new Uint8ClampedArray(d), k = amount * .9;
  for (let y = 1; y < hh - 1; y++) for (let i = 1; i < w - 1; i++) { const p = (y * w + i) * 4; for (let ch = 0; ch < 3; ch++) { const m = (o[p + ch - 4] + o[p + ch + 4] + o[p + ch - w * 4] + o[p + ch + w * 4] + o[p + ch]) / 5; d[p + ch] = clamp(o[p + ch] + k * (o[p + ch] - m) * 1.6, 0, 255); } }
  x.putImageData(a, 0, 0);
}
function stamp(c, s) {
  const W = c.width, H = c.height, x = c.getContext('2d'); let mw, mh, draw;
  if (s.wmKind === 'text') {
    const text = s.wmText.trim(); if (!text) return; const m = mk(10, 10).getContext('2d'); m.font = 'bold 120px "Helvetica Neue",Helvetica,Arial,sans-serif'; const tw = m.measureText(text).width, bw = tw + 32, bh = 152;
    const k = Math.min(W * s.wmSize / bw, H * .8 / bh); mw = bw * k; mh = bh * k;
    draw = (px, py) => { x.save(); x.translate(px, py); x.scale(k, k); x.font = 'bold 120px "Helvetica Neue",Helvetica,Arial,sans-serif'; x.textBaseline = 'alphabetic'; x.shadowColor = s.wmDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)'; x.shadowBlur = 7 * k; x.shadowOffsetY = 3 * k; x.fillStyle = s.wmDark ? '#000' : '#fff'; x.fillText(text, 16, 16 + 98); x.restore(); };
  } else { if (!s.wmLogo) return; const k = Math.min(W * s.wmSize / logoImg.width, H * .8 / logoImg.height); mw = logoImg.width * k; mh = logoImg.height * k; draw = (px, py) => x.drawImage(logoImg, px, py, mw, mh); }
  const mg = W * s.wmMargin, col = (s.wmAnchor % 3) / 2, row = Math.floor(s.wmAnchor / 3) / 2;
  x.save(); x.globalAlpha = s.wmOpacity; draw(mg + (W - mw - 2 * mg) * col, mg + (H - mh - 2 * mg) * row); x.restore();
}
function process(item, s, maxDim, wmOn = true) {
  const p = plan(item.w, item.h, s, item.crop), R = rotated(item, s), k = R.width / p.rw, pk = Math.min(1, maxDim / Math.max(p.outW, p.outH));
  const out = mk(p.outW * pk, p.outH * pk), x = out.getContext('2d'); x.imageSmoothingQuality = 'high';
  let f = ''; if (s.adjustOn) { if (s.autoEnhance) f += 'contrast(1.1) saturate(1.15) brightness(1.04) '; if (s.brightness) f += `brightness(${1 + s.brightness * 1.5}) `; if (s.contrast !== 1) f += `contrast(${s.contrast}) `; f += s.mono ? 'grayscale(1) ' : (s.saturation !== 1 ? `saturate(${s.saturation}) ` : ''); }
  if (f && HAS_FILTER) x.filter = f.trim();
  x.drawImage(R, p.region.x * k, p.region.y * k, p.region.w * k, p.region.h * k, 0, 0, out.width, out.height); x.filter = 'none';
  if (s.adjustOn && s.sharpen > 0) sharpen(out, s.sharpen);
  if (s.watermarkOn && wmOn) stamp(out, s);
  out.cssFilter = f && !HAS_FILTER ? f.trim() : ''; return { c: out, p, pk };
}
function estimateBytes(item, s) {
  const { c, p } = process(item, s, 640, false), f = s.format === 'original' ? 'jpeg' : s.format, px = p.outW * p.outH, ratio = px / (c.width * c.height), q = s.quality;
  const jpg = qq => Math.max(2000, (c.toDataURL('image/jpeg', qq).length * .75) * ratio * .78);
  let b;
  if (f === 'png') b = c.toDataURL('image/png').length * .75 * ratio * .8; else if (f === 'jpeg') b = jpg(q);
  else if (f === 'webp') b = jpg(q) * .74; else if (f === 'heic') b = jpg(q) * .56; else if (f === 'avif') b = jpg(q) * .46; else if (f === 'jp2') b = jpg(q) * .9; else if (f === 'gif') b = jpg(.8) * 1.4;
  else if (f === 'pdf') b = jpg(q) * 1.04; else if (f === 'ico' || f === 'icns') b = Math.min(px, 256 * 256) * 4 * .35; else if (f === 'exr') b = px * 8; else b = px * 3;
  if (hasQuality(f) && s.maxKB > 0) { let lo = .05, hi = q, cur = b; for (let i = 0; i < 7 && cur > s.maxKB * 1000; i++) { const mid = (lo + hi) / 2; hi = mid; const sc = { jpeg: 1, webp: .74, heic: .56, avif: .46, jp2: .9 }[f]; cur = jpg(mid) * sc; } b = Math.min(b, Math.max(cur, s.maxKB * 1000 * .93)); }
  return b;
}
const fmtBytes = n => { const u = lang() === 'fr' ? ['o', 'Ko', 'Mo', 'Go'] : ['B', 'KB', 'MB', 'GB']; let i = 0, v = n; while (v >= 1000 && i < 3) { v /= 1000; i++; } return (i < 2 ? Math.round(v) : (Math.round(v * 10) / 10).toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US')) + ' ' + u[i]; };
const dims = (w, hh) => `${num(w)} × ${num(hh)}`;


/* ---------- module RAW → DNG : fichiers RAW factices, aperçus peints en canvas ---------- */
// nom, boîtier, objectif, ISO, vitesse, ouverture, focale, date, largeur, hauteur, Mo, scène, graine
const RAWS = [
  ['IMG_0123.CR3', 'Canon EOS R6 Mark II', 'RF 24-105mm F4 L IS USM', 100, '1/250', 8, 35, '2026-09-14T18:42', 6000, 4000, 27.4, 'dusk', 1],
  ['IMG_0124.CR3', 'Canon EOS R6 Mark II', 'RF 24-105mm F4 L IS USM', 100, '1/250', 8, 35, '2026-09-14T18:43', 6000, 4000, 27.6, 'dusk', 2],
  ['IMG_0127.CR3', 'Canon EOS R6 Mark II', 'RF 24-105mm F4 L IS USM', 400, '1/125', 5.6, 70, '2026-09-14T19:05', 6000, 4000, 28.9, 'forest', 3],
  ['DSC_4567.NEF', 'Nikon Z 6II', 'NIKKOR Z 24-70mm f/4 S', 3200, '20 s', 4, 24, '2026-10-02T22:17', 6048, 4024, 33.1, 'night', 4],
  ['DSC_4568.NEF', 'Nikon Z 6II', 'NIKKOR Z 24-70mm f/4 S', 3200, '20 s', 4, 24, '2026-10-02T22:18', 6048, 4024, 33.3, 'night', 5],
  ['DSC_4571.NEF', 'Nikon Z 6II', 'NIKKOR Z 24-70mm f/4 S', 100, '1/500', 8, 50, '2026-10-03T09:26', 4024, 6048, 31.8, 'snow', 6],
  ['DSC04217.ARW', 'Sony ILCE-7M4', 'FE 24-70mm F2.8 GM', 100, '1/1000', 11, 28, '2026-08-21T12:08', 7008, 4672, 51.2, 'ocean', 7],
  ['DSC04218.ARW', 'Sony ILCE-7M4', 'FE 24-70mm F2.8 GM', 100, '1/1000', 11, 28, '2026-08-21T12:08', 7008, 4672, 51.0, 'ocean', 8],
  ['DSC04230.ARW', 'Sony ILCE-7M4', 'FE 24-70mm F2.8 GM', 1600, '1/60', 2.8, 35, '2026-08-21T21:14', 7008, 4672, 52.3, 'city', 9],
  ['DSC04236.ARW', 'Sony ILCE-7M4', 'FE 24-70mm F2.8 GM', 800, '1/80', 2.8, 70, '2026-08-21T21:31', 7008, 4672, 51.7, 'bokeh', 10],
  ['P1020345.RW2', 'Panasonic DC-S5', 'LUMIX S 20-60mm F3.5-5.6', 100, '1/800', 9, 24, '2026-07-09T16:20', 6000, 4000, 38.5, 'desert', 11],
  ['P1020351.RW2', 'Panasonic DC-S5', 'LUMIX S 20-60mm F3.5-5.6', 200, '1/200', 5.6, 40, '2026-07-09T17:02', 6000, 4000, 38.9, 'forest', 12],
  ['DSCF1234.RAF', 'FUJIFILM X-T5', 'XF16-80mmF4 R OIS WR', 125, '1/320', 8, 23, '2026-10-11T18:55', 7728, 5152, 57.4, 'dusk', 13],
  ['DSCF1240.RAF', 'FUJIFILM X-T5', 'XF16-80mmF4 R OIS WR', 1250, '1/50', 4, 16, '2026-10-11T20:12', 7728, 5152, 58.1, 'city', 14],
  ['P3170012.ORF', 'OM Digital OM-1', 'M.Zuiko 12-40mm F2.8 PRO', 200, '1/640', 7.1, 25, '2026-03-17T10:44', 5240, 3912, 22.4, 'snow', 15],
  ['IMG_5620.CR2', 'Canon EOS 5D Mark IV', 'EF 24-70mm f/2.8L II USM', 100, '1/400', 10, 35, '2026-06-02T14:31', 6720, 4480, 31.6, 'ocean', 16],
  ['IMG_5622.CR2', 'Canon EOS 5D Mark IV', 'EF 24-70mm f/2.8L II USM', 100, '1/500', 10, 50, '2026-06-02T14:37', 6720, 4480, 31.4, 'desert', 17],
  ['L1004567.DNG', 'Leica Q2', 'Summilux 28 f/1.7 ASPH.', 640, '1/100', 1.7, 28, '2026-09-28T19:48', 8368, 5584, 46.9, 'bokeh', 18]];
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** Peint une « photo » factice (paysage, nuit, ville…) dans le canvas, de façon déterministe. */
function paintScene(c, kind, seed) {
  const W = c.width, H = c.height, x = c.getContext('2d'), r = rng(seed * 7919 + kind.length * 31), land = W >= H;
  const grad = (stops, y0, y1) => { const g = x.createLinearGradient(0, y0 ?? 0, 0, y1 ?? H); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const glow = (cx, cy, rad, col) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); };
  const ridge = (base, amp, col, rough, ph) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); const st = Math.max(2, W / 140); for (let i = 0; i <= W + st; i += st) { const t = i / W; x.lineTo(i, (base + Math.sin(t * rough * 6 + ph) * amp + Math.sin(t * rough * 15 + ph * 2) * amp * .4 + Math.sin(t * rough * 37 + ph * 3) * amp * .15) * H); } x.lineTo(W, H); x.closePath(); x.fill(); };
  const pines = (base, size, col, n) => { x.fillStyle = col; for (let i = 0; i < n; i++) { const px = r() * W, hh = size * H * (.6 + r() * .8), ww = hh * .32; x.beginPath(); x.moveTo(px, base * H - hh); x.lineTo(px + ww, base * H); x.lineTo(px - ww, base * H); x.closePath(); x.fill(); } x.fillRect(0, base * H - 1, W, H); };
  if (kind === 'dusk') { x.fillStyle = grad([[0, '#2a1f5c'], [.55, '#d9546b'], [1, '#ffb36b']]); x.fillRect(0, 0, W, H); const sx = W * (.3 + r() * .4), sy = H * .56; glow(sx, sy, H * .5, 'rgba(255,214,150,.85)'); x.fillStyle = '#fff3d6'; x.beginPath(); x.arc(sx, sy, H * .07, 0, 7); x.fill(); ridge(.66, .04, '#6b3d6e', 1, r() * 6); ridge(.75, .035, '#3d2850', 1.4, r() * 6); ridge(.86, .03, '#1d1530', 2, r() * 6); }
  else if (kind === 'ocean') { const hz = H * .55; x.fillStyle = grad([[0, '#3f8fd8'], [1, '#d6ecff']], 0, hz); x.fillRect(0, 0, W, hz); for (let i = 0; i < 7; i++) { glow(r() * W, r() * hz * .6 + 10, W * (.08 + r() * .1), 'rgba(255,255,255,.55)'); } x.fillStyle = grad([[0, '#2d7fb8'], [1, '#0b3560']], hz, H); x.fillRect(0, hz, W, H - hz); const sx = W * (.4 + r() * .3); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(255,255,255,${.5 - i * .017})`; const ww = W * (.02 + r() * .05) * (1 + i * .12); x.fillRect(sx - ww / 2, hz + 4 + i * (H - hz) / 28, ww, Math.max(1.5, H * .004)); } }
  else if (kind === 'night') { x.fillStyle = grad([[0, '#04061a'], [1, '#26407a']]); x.fillRect(0, 0, W, H); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${.25 + r() * .75})`; const rr = Math.max(.6, r() * W / 700); x.beginPath(); x.arc(r() * W, r() * H * .75, rr, 0, 7); x.fill(); } const mx = W * (.2 + r() * .6), my = H * (.18 + r() * .15); glow(mx, my, H * .3, 'rgba(190,210,255,.55)'); x.fillStyle = '#eef3ff'; x.beginPath(); x.arc(mx, my, H * .045, 0, 7); x.fill(); ridge(.78, .03, '#0a1020', 1, r() * 6); pines(.9, .1, '#05080f', land ? 16 : 9); }
  else if (kind === 'forest') { x.fillStyle = grad([[0, '#dcebd6'], [1, '#8fb89a']]); x.fillRect(0, 0, W, H); glow(W * .7, H * .25, H * .6, 'rgba(255,255,230,.7)'); pines(.62, .22, 'rgba(94,140,106,.75)', 22); pines(.74, .3, 'rgba(56,102,74,.85)', 18); pines(.88, .42, 'rgba(26,62,44,.95)', 12); x.fillStyle = '#10281c'; x.fillRect(0, H * .9, W, H * .1); }
  else if (kind === 'city') { x.fillStyle = grad([[0, '#0b1236'], [.6, '#5a4a8a'], [1, '#f0907a']]); x.fillRect(0, 0, W, H); for (let l = 0; l < 2; l++) { let px = -10; const col = l ? '#0c0a1c' : '#2a2150'; while (px < W) { const bw = W * (.04 + r() * .07), bh = H * (.2 + r() * (l ? .42 : .3)); x.fillStyle = col; x.fillRect(px, H - bh, bw, bh); if (l) { for (let wy = H - bh + 8; wy < H - 8; wy += Math.max(7, H * .028)) for (let wx = px + 5; wx < px + bw - 6; wx += Math.max(7, W * .014)) if (r() > .55) { x.fillStyle = r() > .5 ? '#ffd98a' : '#ffefc0'; x.fillRect(wx, wy, Math.max(2, W * .005), Math.max(3, H * .012)); } } px += bw + 2; } } }
  else if (kind === 'snow') { x.fillStyle = grad([[0, '#86b0de'], [1, '#eef5fc']]); x.fillRect(0, 0, W, H); ridge(.5, .12, '#e6eff9', 1.1, r() * 6); ridge(.64, .09, '#bccfe5', 1.6, r() * 6); ridge(.8, .07, '#8da9c9', 2.2, r() * 6); x.fillStyle = '#f7fbff'; x.fillRect(0, H * .92, W, H * .08); pines(.93, .09, '#3b5675', land ? 10 : 6); }
  else if (kind === 'desert') { x.fillStyle = grad([[0, '#f2a64e'], [1, '#ffe6b8']]); x.fillRect(0, 0, W, H); glow(W * .7, H * .3, H * .5, 'rgba(255,248,214,.8)'); x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(W * .7, H * .3, H * .06, 0, 7); x.fill(); ridge(.58, .06, '#e0954a', .8, r() * 6); ridge(.72, .06, '#c4733a', 1.1, r() * 6); ridge(.86, .05, '#8c4a2a', 1.5, r() * 6); }
  else { x.fillStyle = grad([[0, '#1d1233'], [1, '#6b2c5a']]); x.fillRect(0, 0, W, H); for (let i = 0; i < 46; i++) { const cx = r() * W, cy = r() * H, rr = H * (.03 + r() * .1), hue = [38, 330, 200, 280, 20][Math.floor(r() * 5)]; const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `hsla(${hue},90%,70%,.75)`); g.addColorStop(.85, `hsla(${hue},90%,60%,.5)`); g.addColorStop(1, `hsla(${hue},90%,60%,0)`); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); } }
  const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.38)'); x.fillStyle = v; x.fillRect(0, 0, W, H);
}
function histOf(c) { const k = 192 / Math.max(c.width, c.height), t = mk(c.width * k, c.height * k), x = t.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, t.width, t.height); const d = x.getImageData(0, 0, t.width, t.height).data, H = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0), sh: 0, hi: 0 }, n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { H.r[d[i]]++; H.g[d[i + 1]]++; H.b[d[i + 2]]++; if (Math.min(d[i], d[i + 1], d[i + 2]) <= 2) H.sh++; if (Math.max(d[i], d[i + 1], d[i + 2]) >= 253) H.hi++; } H.sh /= n; H.hi /= n; return H; }
const star = (on, s = 12) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 2.6 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>`;
const flagI = (on, s = 14) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>`;
const xcI = (on, s = 15) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${on ? 'currentColor' : 'none'}"/><path d="m15 9-6 6M9 9l6 6" stroke="${on ? '#101018' : 'currentColor'}"/></svg>`;
const okI = s => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m8 12.5 2.7 2.7L16 9.5" stroke="#101018" stroke-width="2.4"/></svg>`;
const skI = s => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 13l4-4 4 4M12 9v7" stroke="#101018" stroke-width="2.2" transform="rotate(90 12 12)"/></svg>`;
const RFILTERS = ['all', 'picks', 'unflagged', 'rejects'];

export async function open(app) {
  await sheetReady('css/demos/mSIZER.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, x: 250, y: 84, minw: 960, minh: 560, bare: true, cls: 'socle msizer', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  let mode = 'photos'; let s = DEF(); const mine = []; let items = [], selId = null, showAfter = true, proc = false, cancelled = false, progress = 0, summary = '', summaryWarn = false, done = false, pgen = 0, nextBatch = 0;
  const fo = { format: false, meta: false, output: false };
  const root = h('div', { class: 'msizer-root', tabindex: '-1' });
  let popEl = null, popOff = null, sheetEl = null, holding = false;
  const sc = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
  const loc = (cx, cy) => { const r = root.getBoundingClientRect(), k = sc(); return [(cx - r.left) / k, (cy - r.top) / k]; };
  const sel = () => items.find(i => i.id === selId) || null;

  /* --- menus (avec sous-menus) --- */
  function closeMenu() { document.querySelectorAll('.msizer-menu').forEach(e => e.remove()); popEl = null; if (popOff) { document.removeEventListener('pointerdown', popOff, true); popOff = null; } }
  function menu(list, anchor) {
    closeMenu(); const mkm = (l, cls) => h('div', { class: 'msizer-menu ' + cls, role: 'menu' }, l.map(it => it === '-' ? h('hr', {}) : h('button', { class: 'msizer-mi' + (it.dg ? ' dg' : ''), role: 'menuitem', disabled: it.off }, h('i', {}, it.on ? '✓' : ''), h('span', {}, it.l), it.sub ? h('em', {}, '›') : null)));
    const el = mkm(list, ''); root.append(el); popEl = el; const ar = anchor.getBoundingClientRect(), [x, y] = loc(ar.left, ar.bottom), k = sc();
    el.style.minWidth = ar.width / k + 'px'; el.style.left = clamp(x, 8, root.offsetWidth - el.offsetWidth - 8) + 'px'; el.style.top = (y + 4 + el.offsetHeight > root.offsetHeight - 8 ? Math.max(8, loc(0, ar.top)[1] - el.offsetHeight - 4) : y + 4) + 'px';
    const flat = list.filter(i => i !== '-'); let sub = null;
    [...el.querySelectorAll('.msizer-mi')].forEach((b, i) => { const it = flat[i];
      const openSub = () => { sub && sub.remove(); sub = null; if (!it.sub) return; sub = mkm(it.sub, 'msizer-sub'); root.append(sub); const br = b.getBoundingClientRect(), [sx, sy] = loc(br.right, br.top); sub.style.left = clamp(sx + 2, 8, root.offsetWidth - sub.offsetWidth - 8) + 'px'; sub.style.top = clamp(sy - 4, 8, root.offsetHeight - sub.offsetHeight - 8) + 'px';
        const sf = it.sub.filter(q => q !== '-'); [...sub.querySelectorAll('.msizer-mi')].forEach((sb, j) => { sb.onclick = () => { closeMenu(); sfx.tick(); sf[j].fn(); }; }); };
      b.onmouseenter = openSub; b.onclick = () => { if (it.sub) return openSub(); closeMenu(); sfx.tick(); it.fn && it.fn(); }; });
    popOff = e => { if (!alive()) return closeMenu(); if (!e.target.closest('.msizer-menu') && !anchor.contains(e.target)) closeMenu(); };
    setTimeout(() => popEl === el && document.addEventListener('pointerdown', popOff, true), 0);
  }
  const dropdown = (label, getList, cls = '') => { const b = h('button', { class: 'msizer-dd ' + cls, onclick: () => (popEl ? closeMenu() : menu(getList(), b)) }, h('span', {}, label)); return b; };

  /* --- briques Socle --- */
  const upd = (patch, panel) => { Object.assign(s, patch); done = false; if (panel) drawSettings(); schedule(); };
  const checkRow = (label, get, set, help) => h('div', { class: 'msizer-chk' }, h('button', { class: 'msizer-cb' + (get() ? ' on' : ''), role: 'checkbox', 'aria-checked': !!get(), onclick: () => { set(!get()); } }, h('i', {}, get() ? '✓' : ''), h('span', {}, label)), help ? h('p', { class: 'msizer-hint' }, help) : null);
  const choice = (opts, get, set, minW = 84) => h('div', { class: 'msizer-grid', style: { '--mw': minW + 'px' } }, opts.map(([v, l]) => h('button', { class: 'msizer-opt' + (get() === v ? ' on' : ''), 'aria-pressed': get() === v, onclick: () => { sfx.tick(); set(v); } }, l)));
  const sliderRow = (label, get, set, min, max, step, fmt) => { const val = h('span', { class: 'msizer-val' }, fmt(get())); return h('div', { class: 'msizer-sl' }, h('div', { class: 'msizer-row' }, h('span', {}, label), val), h('input', { type: 'range', min, max, step, value: get(), 'aria-label': label, oninput: e => { set(+e.target.value); val.textContent = fmt(+e.target.value); } })); };
  const numRow = (label, get, set, unit, dis) => h('label', { class: 'msizer-num' }, h('span', {}, label), h('input', { type: 'text', inputmode: 'decimal', value: get(), disabled: dis, 'aria-label': label || unit, oninput: e => { const v = parseFloat(e.target.value.replace(',', '.')); set(isNaN(v) ? 0 : v); } }), unit ? h('small', {}, unit) : null);
  const op = (title, key, body) => h('section', { class: 'msizer-card' + (s[key] ? '' : ' off') }, h('button', { class: 'msizer-cb head' + (s[key] ? ' on' : ''), role: 'checkbox', 'aria-checked': !!s[key], onclick: () => { s[key] = !s[key]; if (key === 'cropOn' && s[key] && s.cropRatio === 'manual') showAfter = false; done = false; drawSettings(); schedule(); } }, h('i', {}, s[key] ? '✓' : ''), h('span', {}, title)), s[key] ? h('div', { class: 'msizer-body' }, body()) : null);
  const fold = (key, title, summ, body) => h('section', { class: 'msizer-card fold' }, h('button', { class: 'msizer-fh', 'aria-expanded': fo[key], onclick: () => { fo[key] = !fo[key]; drawSettings(); } }, h('i', { class: fo[key] ? 'op' : '' , html: svg('<path d="m9 6 6 6-6 6"/>', 10) }), h('b', {}, title), fo[key] ? null : h('em', {}, summ())), fo[key] ? h('div', { class: 'msizer-body' }, body()) : null);
  const anchorPick = (get, set) => h('div', { class: 'msizer-anchor' }, [0, 1, 2].map(r => h('div', {}, [0, 1, 2].map(c => { const a = r * 3 + c; return h('button', { class: get() === a ? 'on' : '', 'aria-label': `${r + 1}-${c + 1}`, 'aria-pressed': get() === a, onclick: () => { sfx.tick(); set(a); } }); }))));
  const btn = (label, fn, cls = '', dis) => h('button', { class: 'msizer-btn ' + cls, onclick: fn, disabled: dis }, label);

  /* --- panneau des réglages --- */
  const settings = h('div', { class: 'msizer-settings' });
  const formatSummary = () => `${fmtLabel(s.format)}${hasQuality(s.format) ? ' · ' + Math.round(s.quality * 100) + ' %' + (s.maxKB > 0 ? ' · ≤ ' + s.maxKB + ' ' + T('Ko', 'KB') : '') : ''}`;
  function applyPreset(fn) { const p = DEF(); fn(p); p.outputMode = s.outputMode; p.outputFolder = s.outputFolder; p.wmLogo = s.wmLogo; if (p.wmText === '© ') p.wmText = s.wmText; s = p; done = false; summary = ''; drawSettings(); schedule(); }
  function applySocial(w0, h0) { const p = DEF(); Object.assign(p, { resizeOn: true, resizeMode: 'fill', resizeValue: w0, resizeValue2: h0, noEnlarge: false, cropOn: true, cropRatio: 'manual', cropLock: 'output', format: 'jpeg', quality: .9, metaMode: 'noGPS', outputMode: s.outputMode }); items.forEach(i => { i.crop = null; }); s = p; showAfter = false; done = false; drawSettings(); drawPreviewTabs(); schedule(); }
  function drawSettings() {
    const keep = settings.scrollTop; settings.innerHTML = '';
    const presets = h('section', { class: 'msizer-card' }, h('h4', {}, T('Préréglages', 'Presets')),
      dropdown(T('Choisir un préréglage…', 'Choose a preset…'), () => [...BUILTIN.map(([k, fn]) => ({ l: T(...PRESET_NAME[k]), fn: () => applyPreset(fn) })), ...(mine.length ? ['-', ...mine.map(p => ({ l: p.name, fn: () => { s = { ...p.s, outputMode: s.outputMode, outputFolder: s.outputFolder }; done = false; drawSettings(); schedule(); } })), '-', { l: T('Mes préréglages', 'My presets'), sub: mine.map(p => ({ l: T(`Supprimer « ${p.name} »`, `Delete “${p.name}”`), fn: () => { mine.splice(mine.indexOf(p), 1); } })) }] : []), '-', { l: T('Enregistrer les réglages actuels', 'Save current settings'), fn: saveDialog }]),
      dropdown(T('Réseaux sociaux…', 'Social networks…'), () => SOCIAL.map(([n, specs]) => ({ l: n, sub: specs.map(([k, a, b]) => ({ l: `${T(...KIND[k])} · ${a} × ${b}`, fn: () => applySocial(a, b) })) }))));
    const mode = s.resizeMode, fitfill = mode === 'fit' || mode === 'fill';
    const rs = op(T('Redimensionner', 'Resize'), 'resizeOn', () => [choice([['longest', T('Grand côté', 'Long side')], ['width', T('Largeur', 'Width')], ['height', T('Hauteur', 'Height')], ['percent', T('Pourcentage', 'Percentage')], ['fit', T('Dans un cadre', 'Fit in box')], ['fill', T('Remplir', 'Fill')]], () => s.resizeMode, v => upd({ resizeMode: v }, true), 92),
      ...(fitfill ? [numRow(T('Largeur', 'Width'), () => s.resizeValue, v => upd({ resizeValue: v }), 'px'), numRow(T('Hauteur', 'Height'), () => s.resizeValue2, v => upd({ resizeValue2: v }), 'px'), h('p', { class: 'msizer-hint' }, mode === 'fit' ? T('La photo tient entièrement dans le cadre.', 'The photo fits entirely inside the box.') : T('Le cadre est rempli, l’excédent est coupé.', 'The box is filled, the excess is cropped.'))]
        : [numRow({ longest: T('Grand côté', 'Long side'), width: T('Largeur', 'Width'), height: T('Hauteur', 'Height'), percent: T('Pourcentage', 'Percentage') }[mode], () => s.resizeValue, v => upd({ resizeValue: v }), mode === 'percent' ? '%' : 'px')]),
      checkRow(T('Ne jamais agrandir', 'Never enlarge'), () => s.noEnlarge, v => upd({ noEnlarge: v }, true))]);
    const ratios = [...Object.keys(RATIO).map(k => [k, RATIO_LABEL[k]]), ['custom', T('Perso.', 'Custom')], ['manual', T('Manuel', 'Manual')]];
    const outputOK = s.resizeOn && fitfill && s.resizeValue > 0 && s.resizeValue2 > 0;
    const cr = op(T('Recadrer', 'Crop'), 'cropOn', () => [choice(ratios, () => s.cropRatio, v => { items.forEach(i => { i.crop = null; }); if (v === 'manual') showAfter = false; upd({ cropRatio: v }, true); drawPreviewTabs(); }, 64),
      ...(s.cropRatio === 'manual' ? [choice([['free', T('Libre', 'Free')], ...Object.keys(RATIO).map(k => [k, RATIO_LABEL[k]]), ...(outputOK ? [['output', T('Sortie', 'Output')]] : [])], () => s.cropLock, v => { items.forEach(i => { i.crop = null; }); upd({ cropLock: v }, true); }, 56),
        h('p', { class: 'msizer-hint' }, T('Onglet « Avant » : tirez les poignées ou dessinez un cadre. Chaque photo garde son cadrage.', '"Before" tab: drag the handles or draw a frame. Each photo keeps its own framing.')),
        h('div', { class: 'msizer-two' }, btn(T('Tout le cadre', 'Whole frame'), () => { const i = sel(); if (i) { i.crop = null; schedule(); } }), btn(T('Appliquer à toutes', 'Apply to all'), () => { const i = sel(); if (i) { const c = curCrop(i); items.forEach(q => { q.crop = { ...c }; }); toast({ icon: icon(app.id), title: app.id, body: T('Cadrage appliqué à toutes les photos.', 'Framing applied to all photos.') }); schedule(); } })),
        showAfter ? btn(T('Ajuster sur la photo', 'Adjust on the photo'), () => { showAfter = false; drawPreviewTabs(); schedule(); }) : null]
        : []),
      ...(s.cropRatio === 'custom' ? [h('div', { class: 'msizer-two' }, numRow('', () => s.cropW, v => upd({ cropW: v }), ''), h('span', { class: 'msizer-colon' }, ':'), numRow('', () => s.cropH, v => upd({ cropH: v }), ''))] : []),
      ...(s.cropRatio !== 'manual' ? [h('div', { class: 'msizer-row2' }, h('span', {}, T('Zone conservée', 'Area kept')), anchorPick(() => s.cropAnchor, v => upd({ cropAnchor: v }, true)))] : [])]);
    const ro = op(T('Rotation et miroir', 'Rotate and flip'), 'rotateOn', () => [choice([[0, '0°'], [90, '90° ↻'], [180, '180°'], [270, '90° ↺']], () => s.rotation, v => { items.forEach(i => { i.crop = null; }); upd({ rotation: v }, true); }, 64), checkRow(T('Miroir horizontal', 'Flip horizontally'), () => s.flipH, v => upd({ flipH: v }, true)), checkRow(T('Miroir vertical', 'Flip vertically'), () => s.flipV, v => upd({ flipV: v }, true))]);
    const ad = op(T('Retouches', 'Adjustments'), 'adjustOn', () => [checkRow(T('Amélioration automatique', 'Auto enhance'), () => s.autoEnhance, v => upd({ autoEnhance: v }, true)),
      sliderRow(T('Luminosité', 'Brightness'), () => s.brightness, v => upd({ brightness: v }), -.5, .5, .01, v => (v > 0 ? '+' : '') + Math.round(v * 100)), sliderRow(T('Contraste', 'Contrast'), () => s.contrast, v => upd({ contrast: v }), .5, 1.5, .01, v => Math.round(v * 100) + ' %'),
      sliderRow(T('Saturation', 'Saturation'), () => s.saturation, v => upd({ saturation: v }), 0, 2, .01, v => Math.round(v * 100) + ' %'), sliderRow(T('Netteté', 'Sharpness'), () => s.sharpen, v => upd({ sharpen: v }), 0, 2, .02, v => Math.round(v * 50)), checkRow(T('Noir et blanc', 'Black and white'), () => s.mono, v => upd({ mono: v }, true))]);
    const wmk = op(T('Filigrane', 'Watermark'), 'watermarkOn', () => [choice([['text', T('Texte', 'Text')], ['image', T('Logo', 'Logo')]], () => s.wmKind, v => upd({ wmKind: v }, true)),
      ...(s.wmKind === 'text' ? [h('input', { class: 'msizer-field', value: s.wmText, placeholder: T('© Votre nom', '© Your name'), 'aria-label': T('Texte du filigrane', 'Watermark text'), oninput: e => upd({ wmText: e.target.value }) }), checkRow(T('Texte sombre', 'Dark text'), () => s.wmDark, v => upd({ wmDark: v }, true))]
        : [h('div', { class: 'msizer-logo' }, h('span', { class: 'msizer-mono' }, s.wmLogo ? 'mSIZER-logo.png' : T('Aucun logo choisi.', 'No logo chosen.')), btn(T('Choisir un logo…', 'Choose a logo…'), () => upd({ wmLogo: true }, true), 'inl'))]),
      sliderRow(T('Taille', 'Size'), () => s.wmSize, v => upd({ wmSize: v }), .05, .8, .01, v => Math.round(v * 100) + ' %'), sliderRow(T('Opacité', 'Opacity'), () => s.wmOpacity, v => upd({ wmOpacity: v }), .1, 1, .01, v => Math.round(v * 100) + ' %'),
      h('div', { class: 'msizer-row2' }, h('span', {}, T('Position', 'Position')), anchorPick(() => s.wmAnchor, v => upd({ wmAnchor: v }, true)))]);
    const fm = fold('format', T('Format et qualité', 'Format and quality'), formatSummary, () => [choice(FORMATS.map(f => [f, fmtLabel(f)]), () => s.format, v => upd({ format: v }, true), 58),
      ...(hasQuality(s.format) ? [sliderRow(T('Qualité', 'Quality'), () => s.quality, v => upd({ quality: v }), .1, 1, .01, v => Math.round(v * 100) + ' %'), numRow(T('Poids maximal (Ko)', 'Maximum size (KB)'), () => s.maxKB, v => upd({ maxKB: Math.max(0, Math.round(v)) }), ''), h('p', { class: 'msizer-hint' }, T('0 : sans limite. La qualité baisse au besoin pour tenir dans la limite (JPEG et HEIC).', '0: no limit. Quality is lowered as needed to fit the limit (JPEG and HEIC).')), s.format === 'webp' ? h('p', { class: 'msizer-hint' }, T('À 100 %, le WebP est sans perte. Les métadonnées ne sont pas conservées.', 'At 100%, WebP is lossless. Metadata is not kept.')) : null] : []),
      isIcon(s.format) ? h('p', { class: 'msizer-hint' }, T('Image centrée sur un carré transparent : ICO jusqu’à 256 px, ICNS de 16 à 512 px.', 'Image centred on a transparent square: ICO up to 256 px, ICNS 16 to 512 px.')) : null,
      checkRow(T('Convertir en sRGB', 'Convert to sRGB'), () => s.toSRGB, v => upd({ toSRGB: v }, true), T('Recommandé pour le web, les réseaux sociaux et l’e-mail.', 'Recommended for the web, social networks and e-mail.'))]);
    const mt = fold('meta', T('Métadonnées', 'Metadata'), () => ({ keep: T('Conserver', 'Keep'), noGPS: T('Sans position GPS', 'No GPS location'), strip: T('Tout effacer', 'Erase all') })[s.metaMode], () => [choice([['keep', T('Conserver', 'Keep')], ['noGPS', T('Sans position GPS', 'No GPS location')], ['strip', T('Tout effacer', 'Erase all')]], () => s.metaMode, v => upd({ metaMode: v }, true), 100)]);
    const rn = op(T('Renommer', 'Rename'), 'renameOn', () => [h('input', { class: 'msizer-field mono', value: s.pattern, placeholder: '{name}', 'aria-label': T('Modèle', 'Pattern'), oninput: e => { upd({ pattern: e.target.value }); if (prev) prev.textContent = '→ ' + newName(sel() || items[0] || { name: 'IMG_0001.jpg', w: 0, h: 0 }, 0); } }),
      h('p', { class: 'msizer-hint' }, T('{name} nom d’origine · {n} numéro · {date} · {w} et {h} dimensions', '{name} original name · {n} number · {date} · {w} and {h} dimensions')), numRow(T('Premier numéro', 'First number'), () => s.startNumber, v => upd({ startNumber: Math.max(0, Math.round(v)) }), ''),
      (prev = h('p', { class: 'msizer-prev' }, '→ ' + newName(sel() || items[0] || { name: 'IMG_0001.jpg', w: 0, h: 0 }, 0)))]);
    const ou = fold('output', T('Destination', 'Destination'), () => ({ subfolder: T('Sous-dossier « mSIZER »', '“mSIZER” subfolder'), folder: T('Autre dossier', 'Other folder'), replace: T('Remplacer', 'Replace') })[s.outputMode], () => [choice([['subfolder', T('Sous-dossier « mSIZER »', '“mSIZER” subfolder')], ['folder', T('Autre dossier', 'Other folder')], ['replace', T('Remplacer', 'Replace')]], () => s.outputMode, v => upd({ outputMode: v }, true), 240),
      ...(s.outputMode === 'subfolder' ? [h('p', { class: 'msizer-hint' }, T('Créé à côté de chaque photo d’origine.', 'Created next to each original photo.'))] : s.outputMode === 'folder' ? [h('div', { class: 'msizer-logo' }, h('span', { class: 'msizer-mono' }, s.outputFolder || '~/Pictures/Export'), btn(T('Choisir…', 'Choose…'), () => { const L = ['~/Pictures/Export', '~/Desktop/Web', '~/Documents/Clients/2026']; s.outputFolder = L[(L.indexOf(s.outputFolder) + 1) % L.length]; drawSettings(); }, 'inl'))] : [h('p', { class: 'msizer-warn' }, T('Chaque original est placé dans la corbeille une fois la nouvelle version écrite.', 'Each original goes to the Trash once the new version is written.'))])]);
    settings.append(presets, rs, cr, ro, ad, wmk, fm, mt, rn, ou); settings.scrollTop = keep;
  }
  let prev = null;
  const newName = (it, idx) => { const base = it.name.replace(/\.[^.]+$/, ''), ext = s.format === 'original' ? 'jpg' : ({ jpeg: 'jpg', tiff: 'tiff' })[s.format] || s.format; const d = new Date(2026, 10, 10);
    const p = s.renameOn ? s.pattern.replace(/\{name\}/g, base).replace(/\{n\}/g, String(s.startNumber + idx).padStart(3, '0')).replace(/\{date\}/g, '2026-11-10').replace(/\{w\}/g, it.w).replace(/\{h\}/g, it.h) : base; return (p || base) + '.' + ext; };
  function saveDialog() { const f = h('input', { class: 'msizer-field', placeholder: T('Nom du préréglage', 'Preset name'), 'aria-label': T('Nom du préréglage', 'Preset name') }); const ok = () => { const n = f.value.trim(); if (!n) return; const ex = mine.find(p => p.name === n); if (ex) ex.s = { ...s }; else mine.push({ name: n, s: { ...s } }); sfx.pop(); closeSheet(); }; f.onkeydown = e => { if (e.key === 'Enter') ok(); }; sheet(T('Nom du préréglage', 'Preset name'), f, [btn(T('ANNULER', 'CANCEL'), closeSheet, 'ter'), btn(T('ENREGISTRER', 'SAVE'), ok, 'pri')], 380); }

  /* --- liste des photos --- */
  const list = h('aside', { class: 'msizer-list' });
  function thumbOf(it) { const c = mk(96, 96), x = c.getContext('2d'); if (!it.base) return c; const b = it.base, k = Math.max(96 / b.width, 96 / b.height); x.drawImage(b, (96 - b.width * k) / 2, (96 - b.height * k) / 2, b.width * k, b.height * k); return c; }
  function drawList() {
    const keep = lbody && lbody.scrollTop; list.innerHTML = '';
    const total = items.length;
    lbody = h('div', { class: 'msizer-lbody' }, items.map(it => { const on = it.id === selId;
      const row = h('div', { class: 'msizer-prow' + (on ? ' on' : ''), role: 'option', 'aria-selected': on, tabindex: -1, onclick: () => { selId = it.id; sfx.tick(); drawList(); schedule(); } },
        it.thumb ? it.thumb : h('i', { class: 'msizer-sk' }), h('div', { class: 'msizer-pt' }, h('b', { title: it.name }, it.name), h('small', {}, `${dims(it.w, it.h)} · ${fmtBytes(it.bytes)}`),
          it.status === 'done' ? h('span', { class: 'msizer-ok' }, `✓ ${T('Terminée', 'Done')} · ${fmtBytes(it.out)}`) : it.status === 'run' ? h('span', { class: 'msizer-run' }, h('i', {})) : null),
        !proc ? h('button', { class: 'msizer-x', 'aria-label': T('Retirer', 'Remove'), onclick: e => { e.stopPropagation(); remove(it.id); }, html: svg('<path d="m6 6 12 12M18 6 6 18"/>', 10) }) : null); it.row = row; return row; }));
    list.append(h('div', { class: 'msizer-lh' }, h('b', {}, total === 1 ? T('1 photo', '1 photo') : T(`${total} photos`, `${total} photos`)), h('span', { class: 'msizer-gap' }), h('button', { class: 'msizer-btn ter inl', disabled: proc, onclick: clear }, T('Vider la liste', 'Clear list'))), lbody, h('div', { class: 'msizer-lf' }, btn(T('Ajouter des photos', 'Add photos'), () => addPhotos(), '', proc)));
    if (keep) lbody.scrollTop = keep;
  }
  let lbody = null;
  async function addPhotos(auto) {
    if (proc) return; const batch = PHOTOS.slice(nextBatch, nextBatch + (nextBatch === 0 ? 8 : 4)); if (!batch.length) return toast({ icon: icon(app.id), title: app.id, body: T('Les 16 photos d’exemple sont déjà dans la liste.', 'The 16 sample photos are already in the list.') });
    nextBatch += batch.length; sfx.pop(); done = false; summary = '';
    const fresh = batch.map(p => ({ id: 'p' + p[1] + Math.random().toString(36).slice(2, 5), name: p[0], w: p[4], h: p[5], bytes: Math.round(p[4] * p[5] * .26), spec: p, base: null, thumb: null, crop: null, status: '' }));
    items.push(...fresh); if (!selId) selId = fresh[0].id; drawAll();
    await Promise.all(fresh.map(async (it, k) => { it.base = await makeBase(it.spec); if (!alive()) return; await wait(reduced() ? 0 : k * 70); it.thumb = thumbOf(it); it.thumb.className = 'msizer-th'; it.row && it.row.replaceChild(it.thumb, it.row.firstChild); sfx.tick(); if (it.id === selId) schedule(); }));
    if (alive()) drawBottom();
  }
  function remove(id) { items = items.filter(i => i.id !== id); if (selId === id) selId = items[0] ? items[0].id : null; if (!items.length) nextBatch = 0; sfx.tick(); drawAll(); }
  function clear() { items = []; selId = null; nextBatch = 0; summary = ''; done = false; sfx.close(); drawAll(); }

  /* --- aperçu avant / après, avec cadre de recadrage manuel --- */
  const info = h('span', { class: 'msizer-info' }), tabs = h('div', { class: 'msizer-seg' }), stage = h('div', { class: 'msizer-stage' }), frame = h('div', { class: 'msizer-frame' });
  const cv = h('canvas', { class: 'msizer-cv' }); let overlay = null, lastCanvas = null;
  const preview = h('section', { class: 'msizer-preview' }, h('div', { class: 'msizer-ph' }, tabs, h('span', { class: 'msizer-gap' }), info), stage);
  function drawPreviewTabs() { tabs.innerHTML = ''; [[false, T('Avant', 'Before')], [true, T('Après', 'After')]].forEach(([v, l]) => tabs.append(h('button', { class: showAfter === v ? 'on' : '', 'aria-pressed': showAfter === v, onclick: () => { showAfter = v; sfx.tick(); drawPreviewTabs(); schedule(); } }, l))); }
  const curCrop = it => { const lr = lockRatio(s); let c = it.crop || NR.full(); const R = it.base ? rotated(it, s) : null; if (lr && R) c = NR.fitted(c, lr, R.width / R.height); return c; };
  function schedule() { if (!sched) sched = requestAnimationFrame(paint); } let sched = 0;
  function paint() {
    sched = 0; if (!alive()) return; const it = sel(); const gen = ++pgen;
    stage.innerHTML = ''; stage.classList.toggle('empty', !it);
    if (!it) { info.textContent = ''; return stage.append(h('p', { class: 'msizer-none' }, T('Sélectionnez une photo pour voir l’aperçu.', 'Select a photo to see the preview.'))); }
    if (!it.base) { info.textContent = ''; return stage.append(h('div', { class: 'msizer-spin' })); }
    const editing = (!showAfter || holdBefore) && s.cropOn && s.cropRatio === 'manual', after = showAfter && !holdBefore;
    let canvas, p = plan(it.w, it.h, s, curCrop(it));
    if (after) { const r = process(it, s, 1100); canvas = r.c; p = r.p; } else { canvas = rotated(it, s); }
    info.textContent = T(`Résultat : ${p.outW} × ${p.outH} px`, `Result: ${p.outW} × ${p.outH} px`) + (est[it.id + sig()] ? ` · ≈ ${fmtBytes(est[it.id + sig()])}` : '');
    cv.width = canvas.width; cv.height = canvas.height; const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(canvas, 0, 0); cv.style.filter = canvas.cssFilter || '';
    frame.innerHTML = ''; frame.append(cv); lastCanvas = canvas; stage.append(frame); fit();
    if (editing) frame.append(cropOverlay(it)); else overlay = null;
    if (after) { clearTimeout(estT); estT = setTimeout(() => { if (!alive() || gen !== pgen) return; const k = it.id + sig(); if (!est[k]) { est[k] = estimateBytes(it, s); if (est[k]) info.textContent = T(`Résultat : ${p.outW} × ${p.outH} px`, `Result: ${p.outW} × ${p.outH} px`) + ` · ≈ ${fmtBytes(est[k])}`; } }, 120); }
  }
  let estT = 0, holdBefore = false; const est = {};
  const sig = () => JSON.stringify([s.resizeOn && [s.resizeMode, s.resizeValue, s.resizeValue2, s.noEnlarge], s.cropOn && [s.cropRatio, s.cropAnchor, s.cropW, s.cropH, s.cropLock], s.rotateOn && [s.rotation, s.flipH, s.flipV], s.adjustOn && [s.autoEnhance, s.brightness, s.contrast, s.saturation, s.sharpen, s.mono], s.watermarkOn && [s.wmKind, s.wmText, s.wmSize, s.wmOpacity, s.wmAnchor, s.wmDark, s.wmLogo], s.format, s.quality, s.maxKB, (sel() || {}).crop && JSON.stringify(sel().crop)]);
  function fit() { const cw = cv.width, ch = cv.height; if (!cw) return; const aw = stage.clientWidth - 48, ah = stage.clientHeight - 48, k = Math.min(aw / cw, ah / ch); const W = Math.max(40, Math.floor(cw * k)), H = Math.max(40, Math.floor(ch * k)); frame.style.width = W + 'px'; frame.style.height = H + 'px'; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  function cropOverlay(it) {
    const ov = h('div', { class: 'msizer-crop' }), HD = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br']; overlay = ov;
    const mask = h('div', { class: 'msizer-mask' }), box = h('div', { class: 'msizer-box' }), tag = h('span', { class: 'msizer-tag' }), hs = HD.map(n => h('i', { class: 'msizer-h ' + n }));
    ov.append(mask, box, ...hs, tag); let live = null;
    const R = rotated(it, s), aspect = R.width / R.height;
    const show = r => { const x0 = r.x * 100, y0 = r.y * 100, x1 = (r.x + r.w) * 100, y1 = (r.y + r.h) * 100; mask.style.clipPath = `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${x0}% ${y0}%,${x0}% ${y1}%,${x1}% ${y1}%,${x1}% ${y0}%,${x0}% ${y0}%)`;
      Object.assign(box.style, { left: x0 + '%', top: y0 + '%', width: r.w * 100 + '%', height: r.h * 100 + '%' });
      HD.forEach((n, i) => { hs[i].style.left = (n.includes('l') ? x0 : n.includes('r') ? x1 : (x0 + x1) / 2) + '%'; hs[i].style.top = (n.includes('t') ? y0 : n.includes('b') ? y1 : (y0 + y1) / 2) + '%'; });
      const pp = plan(it.w, it.h, s, r); tag.textContent = `${Math.round(pp.crop.w)} × ${Math.round(pp.crop.h)}`; tag.style.left = `calc(${x0}% + 6px)`; tag.style.top = `calc(${Math.max(0, y0)}% + 6px)`; };
    show(curCrop(it));
    ov.addEventListener('pointerdown', e => {
      e.preventDefault(); ov.setPointerCapture(e.pointerId); const rect = ov.getBoundingClientRect(), start = curCrop(it), lock = lockRatio(s), pt = ev => ({ x: (ev.clientX - rect.left) / rect.width, y: (ev.clientY - rect.top) / rect.height });
      const p0 = pt(e), g = 14 / rect.width; let mode = null;
      const near = (a, b) => Math.abs(a - b) <= 14 / rect.width, nearY = (a, b) => Math.abs(a - b) <= 14 / rect.height;
      const hit = HD.find(n => { const cx = n.includes('l') ? start.x : n.includes('r') ? start.x + start.w : start.x + start.w / 2, cy = n.includes('t') ? start.y : n.includes('b') ? start.y + start.h : start.y + start.h / 2; return near(cx, p0.x) && nearY(cy, p0.y); });
      if (hit) mode = ['resize', hit]; else if (p0.x >= start.x && p0.x <= start.x + start.w && p0.y >= start.y && p0.y <= start.y + start.h) mode = ['move']; else mode = ['draw', p0];
      const move = ev => { const p = pt(ev);
        live = mode[0] === 'resize' ? NR.resized(start, mode[1], p, lock, aspect) : mode[0] === 'move' ? NR.moved(start, p.x - p0.x, p.y - p0.y) : NR.corner(mode[1], p, lock, aspect); show(live); };
      const up = () => { ov.removeEventListener('pointermove', move); ov.removeEventListener('pointerup', up); if (live) { it.crop = live; sfx.tick(); } live = null; };
      ov.addEventListener('pointermove', move); ov.addEventListener('pointerup', up);
    });
    return ov;
  }
  const ro = new ResizeObserver(() => { if (!alive()) return ro.disconnect(); fit(); });

  /* --- traitement par lots --- */
  const bottom = h('footer', { class: 'msizer-bottom' });
  function drawBottom() {
    if (mode === 'raw') return drawRawBottom();
    bottom.innerHTML = '';
    if (proc) return bottom.append(h('div', { class: 'msizer-pb' }, h('i', { style: { width: progress * 100 + '%' } })), h('span', { class: 'msizer-pct' }, Math.round(progress * 100) + ' %'), btn(T('ANNULER', 'CANCEL'), () => { cancelled = true; }, 'w160'));
    bottom.append(...[h('span', { class: 'msizer-sum' + (summaryWarn ? ' wn' : summary ? ' ok' : '') }, summary), done ? btn(T('Afficher dans le Finder', 'Show in Finder'), () => { sfx.click(); toast({ icon: icon(app.id), title: 'Finder', body: s.outputMode === 'replace' ? T('Les originaux ont été remplacés par leurs nouvelles versions.', 'The originals were replaced by their new versions.') : s.outputMode === 'folder' ? (s.outputFolder || '~/Pictures/Export') : T('Sous-dossier « mSIZER » à côté de chaque photo.', '“mSIZER” subfolder next to each photo.') }); }, 'w200') : null,
      h('button', { class: 'sbtn act msizer-go', disabled: !items.length || items.some(i => !i.base), onclick: () => start() }, T('TRAITER', 'PROCESS'))].filter(Boolean));
  }
  async function start() {
    if (proc || !items.length) return; proc = true; cancelled = false; progress = 0; summary = ''; done = false; items.forEach(i => { i.status = ''; }); drawList(); drawBottom(); sfx.click();
    const t0 = performance.now(); let n = 0;
    for (const it of items) {
      if (cancelled || !alive()) break; it.status = 'run'; drawList(); await wait(reduced() ? 0 : 140 + (it.w * it.h) / 4e6 * 40); if (!alive()) return;
      try { it.out = estimateBytes(it, s); } catch { it.out = it.bytes * .2; } it.status = 'done'; n++; progress = n / items.length; sfx.tick(); drawList(); drawBottom();
    }
    proc = false; const el = ((performance.now() - t0) / 1000).toFixed(1).replace('.', lang() === 'fr' ? ',' : '.');
    if (cancelled) { summary = T(`Interrompu : ${n} photos vues.`, `Stopped: ${n} photos seen.`); summaryWarn = true; items.forEach(i => { if (i.status === 'run') i.status = ''; }); } else { summary = T(`${n} photos traitées en ${el} s`, `${n} photos processed in ${el} s`); summaryWarn = false; done = true; sfx.done();
      const a = items.reduce((q, i) => q + i.bytes, 0), b = items.reduce((q, i) => q + (i.out || 0), 0); toast({ icon: icon(app.id), title: app.id, body: T(`${fmtBytes(a)} ramenés à ${fmtBytes(b)}.`, `${fmtBytes(a)} reduced to ${fmtBytes(b)}.`) }); }
    drawList(); drawBottom();
  }

  /* --- feuilles : réglages de l'appli, à propos, enregistrement d'un préréglage --- */
  function closeSheet() { sheetEl && sheetEl.remove(); sheetEl = null; }
  function sheet(title, body, foot, width = 440) { closeMenu(); closeSheet(); const card = h('div', { class: 'msizer-sheet', style: { width: width + 'px' }, role: 'dialog', 'aria-label': title }, h('h3', {}, title), body, h('div', { class: 'msizer-foot' }, foot)); sheetEl = h('div', { class: 'msizer-scrim', onpointerdown: e => { if (e.target === sheetEl) closeSheet(); } }, card); root.append(sheetEl); card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 180, easing: 'ease-out' }); const f = card.querySelector('input'); f && requestAnimationFrame(() => f.focus({ preventScroll: true })); }
  let auto = true;
  function settingsSheet() { const st = h('p', { class: 'msizer-hint' }, T('Version installée : 1.3.3', 'Installed version: 1.3.3'));
    sheet(T('Réglages', 'Settings'), h('div', { class: 'msizer-sbody' }, h('section', { class: 'msizer-card' }, h('h4', {}, T('Mises à jour', 'Updates')), checkRow(T('Installer automatiquement les mises à jour', 'Install updates automatically'), () => auto, v => { auto = v; settingsSheet(); }), btn(T('Rechercher une mise à jour', 'Check for updates'), () => { sfx.done(); st.textContent = T('mSIZER est à jour (version 1.3.3).', 'mSIZER is up to date (version 1.3.3).'); }), st),
      h('p', { class: 'msizer-hint' }, T('Moteur : 8 photos en parallèle sur les cœurs performance, filtres sur le GPU (Metal).', 'Engine: 8 photos in parallel on the performance cores, filters on the GPU (Metal).')), btn(T('À propos de mSIZER', 'About mSIZER'), aboutSheet, '')), [btn(T('FERMER', 'CLOSE'), closeSheet, 'pri w130')], 520); }
  function aboutSheet() { sheet(T('À propos', 'About'), h('div', { class: 'msizer-about' }, h('img', { src: icon(app.id), alt: '' }), h('b', { html: brand('mSIZER', BRAND) }), h('span', { class: 'msizer-hint' }, T('Version 1.3.3', 'Version 1.3.3')),
    h('p', {}, T('Redimensionnez, recadrez, filigranez et convertissez vos photos par lots, en quelques clics.', 'Resize, crop, watermark and convert your photos in batches, in a few clicks.')), h('p', {}, h('b', {}, 'Starbudweiser & Claude Code (Anthropic)')), h('p', {}, T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.')),
    h('p', { class: 'msizer-hint' }, T('Fourni en l’état, sans garantie. Gardez une copie de vos originaux avant de les remplacer.', 'Provided as is, without warranty. Keep a copy of your originals before replacing them.')), h('p', { class: 'msizer-hint' }, T('Inspiré de Photo Bulk Editor, sans lien avec ce logiciel.', 'Inspired by Photo Bulk Editor, not affiliated with it.'))), [btn(T('FERMER', 'CLOSE'), closeSheet, 'pri w130')], 380); }

  /* --- module RAW → DNG : dérushage et conversion (mêmes réglages, libellés et raccourcis que l'appli) --- */
  const R = { items: [], set: { compressed: true, previewMax: 1600, verify: false, embedRating: true, embedOriginal: false, dest: 'subfolder', folder: '~/Pictures/DNG', conflict: 'number', scope: 'kept', autoAdvance: true },
    view: 'grid', filter: 'all', stars: 0, sort: 'name', cur: null, sel: new Set(), anchor: null, zoom: false, info: true, scanning: false, converting: false, cancelled: false, progress: 0, trashing: false, trashProgress: 0, summary: '', warn: false, last: false, next: 0 };
  const bigs = new Map(), histC = new Map();
  const bigOf = it => { if (!bigs.has(it.id)) { const k = 1400 / Math.max(it.w, it.h), c = mk(it.w * k, it.h * k); paintScene(c, it.kind, it.seed); bigs.set(it.id, c); if (bigs.size > 6) bigs.delete(bigs.keys().next().value); } return bigs.get(it.id); };
  const rmatch = (it, f, n) => f === 'all' ? true : f === 'picks' ? it.flag === 'pick' : f === 'unflagged' ? it.flag === '' : f === 'rejects' ? it.flag === 'reject' : (it.rating >= n && it.flag !== 'reject');
  const rcount = f => R.items.filter(i => rmatch(i, f)).length;
  const rvisible = () => { const f = R.stars ? 'stars' : R.filter, l = R.items.filter(i => rmatch(i, f, R.stars)); const nm = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
    return l.sort(R.sort === 'name' ? nm : R.sort === 'date' ? (a, b) => a.date - b.date : (a, b) => b.rating - a.rating || nm(a, b)); };
  const rcur = () => R.items.find(i => i.id === R.cur) || null;
  const rtargets = () => R.sel.size > 1 ? R.items.filter(i => R.sel.has(i.id)) : (rcur() ? [rcur()] : []);
  const rscope = () => { const sc = R.set.scope; return sc === 'kept' ? R.items.filter(i => i.flag !== 'reject') : sc === 'picks' ? R.items.filter(i => i.flag === 'pick') : sc === 'visible' ? rvisible() : R.items.filter(i => R.sel.has(i.id)); };
  const rrejected = () => R.items.filter(i => i.flag === 'reject').length;
  const destKey = () => R.set.dest + (R.set.dest === 'folder' ? R.set.folder : '');
  const dngBytes = it => { const st = R.set; if (it.isDNG) return it.bytes; let b = it.mb * (st.compressed ? .61 : .98) + { 0: 0, 1024: .18, 1600: .45, 2560: 1.1 }[st.previewMax]; if (st.embedOriginal) b += it.mb; return Math.round(b * (1 + ((it.seed % 7) - 3) / 220) * 1e6); };
  const rdate = it => new Intl.DateTimeFormat(lang() === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(it.date);
  const rcolumns = () => { const g = rawWork.querySelector('.msizer-rgrid'); return g ? Math.max(1, getComputedStyle(g).gridTemplateColumns.split(' ').length) : 4; };
  const rawWork = h('div', { class: 'msizer-work msizer-rawwork' });
  const rawSettings = h('div', { class: 'msizer-settings' });
  const rset = patch => { Object.assign(R.set, patch); R.summary = ''; drawRawSettings(); drawBottom(); };
  const rcard = (title, ...kids) => h('section', { class: 'msizer-card' }, h('h4', {}, title), ...kids);
  const ctr = t => h('p', { class: 'msizer-hint ctr' }, t);
  function drawRawSettings() {
    const keep = rawSettings.scrollTop, st = R.set, n = rscope().length; rawSettings.innerHTML = '';
    const dng = rcard(T('Conversion DNG', 'DNG conversion'),
      checkRow(T('Compression sans perte', 'Lossless compression'), () => st.compressed, v => rset({ compressed: v }), T('Environ 40 % plus léger, sans toucher aux pixels. Désactivée : écriture encore plus rapide, fichiers plus gros.', 'About 40% smaller without touching the pixels. Off: even faster writing, larger files.')),
      h('div', { class: 'msizer-sl' }, h('span', { class: 'msizer-lbl' }, T('Aperçu intégré', 'Embedded preview')), choice([[0, T('Aucun', 'None')], [1024, '1024 px'], [1600, '1600 px'], [2560, '2560 px']], () => st.previewMax, v => rset({ previewMax: v }), 64)),
      checkRow(T('Inclure les étoiles dans le DNG', 'Include the star ratings in the DNG'), () => st.embedRating, v => rset({ embedRating: v }), T('Lues par Lightroom, Bridge et Camera Raw. Une photo rejetée reçoit la note −1.', 'Read by Lightroom, Bridge and Camera Raw. A rejected photo gets the rating −1.')),
      checkRow(T('Incorporer le RAW d’origine', 'Embed the original RAW'), () => st.embedOriginal, v => rset({ embedOriginal: v }), T('Comme l’option du convertisseur Adobe : le DNG contient aussi le fichier d’origine, extractible plus tard. Le fichier pèse presque le double.', 'Like Adobe’s converter option: the DNG also contains the original file, which can be extracted later. The file is almost twice as large.')),
      checkRow(T('Vérifier chaque DNG après écriture', 'Verify each DNG after writing'), () => st.verify, v => rset({ verify: v }), T('Relit le DNG et compare chaque pixel au RAW d’origine (un peu plus lent).', 'Reads the DNG back and compares every pixel with the original RAW (slightly slower).')),
      h('p', { class: 'msizer-hint' }, T('Les fichiers déjà au format DNG sont copiés tels quels.', 'Files that are already DNG are copied as they are.')));
    const dest = rcard(T('Destination', 'Destination'), choice([['subfolder', T('Sous-dossier « DNG »', '“DNG” subfolder')], ['beside', T('À côté du RAW', 'Next to the RAW')], ['folder', T('Autre dossier', 'Other folder')]], () => st.dest, v => rset({ dest: v }), 110),
      ...(st.dest === 'subfolder' ? [h('p', { class: 'msizer-hint' }, T('Créé à côté de chaque RAW d’origine.', 'Created next to each original RAW.'))] : st.dest === 'folder' ? [h('div', { class: 'msizer-logo' }, h('span', { class: 'msizer-mono' }, st.folder), btn(T('Choisir…', 'Choose…'), () => { const L = ['~/Pictures/DNG', '~/Desktop/Archive DNG', '~/Documents/Mariage 2026']; rset({ folder: L[(L.indexOf(st.folder) + 1) % L.length] }); }, 'inl'))] : []),
      h('span', { class: 'msizer-lbl' }, T('Si le fichier existe', 'If the file exists')), choice([['number', T('Numéroter', 'Number it')], ['skip', T('Ignorer', 'Skip')], ['overwrite', T('Remplacer', 'Replace')]], () => st.conflict, v => rset({ conflict: v }), 90));
    const scope = rcard(T('À convertir', 'To convert'), choice([['kept', T('Tout sauf rejetées', 'All but rejected')], ['picks', T('Retenues', 'Picks')], ['visible', T('Affichées', 'Shown')], ['selection', T('Sélection', 'Selection')]], () => st.scope, v => { st.scope = v; drawRawSettings(); drawBottom(); }, 110),
      h('span', { class: 'msizer-val' }, n === 1 ? T('1 fichier RAW', '1 RAW file') : T(`${n} fichiers RAW`, `${n} RAW files`)));
    const trashBtn = btn(T('Rejetées à la corbeille…', 'Rejected to Trash…'), askTrash, '', !rrejected() || R.converting || R.trashing);
    const view = rcard(T('Visionneuse', 'Viewer'), checkRow(T('Passer à la suivante après notation', 'Go to the next one after rating'), () => st.autoAdvance, v => { st.autoAdvance = v; drawRawSettings(); }), trashBtn,
      R.trashing ? h('div', { class: 'msizer-trashp' }, h('div', { class: 'msizer-pb' }, h('i', { style: { width: R.trashProgress * 100 + '%' } })), h('span', { class: 'msizer-pct' }, Math.round(R.trashProgress * 100) + ' %')) : null,
      ctr(T('← → naviguer · 1–5 étoiles · P retenir · X rejeter · U effacer · Espace zoom 100 %', '← → browse · 1–5 stars · P pick · X reject · U clear · Space 100% zoom')));
    rawSettings.append(dng, dest, scope, view, ctr(T('Décodage RAW : LibRaw (licence CDDL 1.0).', 'RAW decoding: LibRaw (CDDL 1.0 license).'))); rawSettings.scrollTop = keep;
  }
  function askTrash() { const n = rrejected(); if (!n) return; sheet(T(`Mettre ${n} fichiers rejetés à la corbeille ?`, `Move ${n} rejected files to the Trash?`), h('p', { class: 'msizer-hint' }, T('Les RAW d’origine rejetés sont déplacés dans la corbeille : vous pourrez les récupérer.', 'The rejected original RAW files are moved to the Trash: you can get them back.')), [btn(T('ANNULER', 'CANCEL'), closeSheet, 'ter'), btn(T('Mettre à la corbeille', 'Move to Trash'), () => { closeSheet(); trashRejected(); }, 'pri')], 420); }
  async function trashRejected() {
    const rej = R.items.filter(i => i.flag === 'reject'); if (R.trashing || !rej.length) return; R.trashing = true; R.trashProgress = 0; drawRawSettings();
    for (let i = 0; i < rej.length; i++) { await wait(reduced() ? 0 : 150); if (!alive()) return; R.trashProgress = (i + 1) / rej.length; sfx.tick(); const b = rawSettings.querySelector('.msizer-trashp'); if (b) { b.firstChild.firstChild.style.width = R.trashProgress * 100 + '%'; b.lastChild.textContent = Math.round(R.trashProgress * 100) + ' %'; } }
    const gone = new Set(rej.map(i => i.id)); R.items = R.items.filter(i => !gone.has(i.id)); R.sel = new Set([...R.sel].filter(i => !gone.has(i))); if (!R.items.find(i => i.id === R.cur)) { const v = rvisible(); R.cur = v[0] ? v[0].id : null; R.sel = new Set(R.cur ? [R.cur] : []); if (!R.cur) R.view = 'grid'; }
    R.trashing = false; R.trashProgress = 0; sfx.done(); toast({ icon: icon(app.id), title: 'Finder', body: T(`${rej.length} RAW rejetés placés dans la corbeille.`, `${rej.length} rejected RAW files moved to the Trash.`) }); drawRawSettings(); drawRaw(); drawBottom();
  }

  /* notation, retenue / rejet, navigation (même logique que l'appli) */
  function afterMark() {
    const keep = R.cur, v0 = rvisible(), pos = keep ? v0.findIndex(i => i.id === keep) : -1; const adv = R.set.autoAdvance && R.sel.size <= 1, v = rvisible();
    if (keep && !v.find(i => i.id === keep) && pos >= 0) { const n = v.length ? v[Math.min(pos, v.length - 1)] : null; R.cur = n ? n.id : null; R.sel = new Set(n ? [n.id] : []); } else if (adv) rmove(1, true);
    if (!R.cur) R.view = 'grid'; drawRawSettings(); drawRaw(); drawBottom();
  }
  function setRating(r) { const t = rtargets(); if (!t.length) return; t.forEach(i => { i.rating = r; if (r > 0 && i.flag === 'reject') i.flag = ''; }); sfx.tick(); afterMark(); }
  function setFlag(f) { const t = rtargets(); if (!t.length) return; t.forEach(i => { i.flag = (i.flag === f && f) ? '' : f; }); sfx.tick(); afterMark(); }
  function rmove(d, quiet) { const v = rvisible(); if (!v.length) return; const i = Math.max(0, v.findIndex(q => q.id === R.cur)), n = v[clamp(i + d, 0, v.length - 1)]; R.cur = n.id; R.sel = new Set([n.id]); R.anchor = n.id; if (!quiet) { drawRaw(); } }
  function rclick(it, meta, shift) { const v = rvisible(); if (shift && R.anchor) { const a = v.findIndex(q => q.id === R.anchor), b = v.findIndex(q => q.id === it.id); if (a >= 0 && b >= 0) R.sel = new Set(v.slice(Math.min(a, b), Math.max(a, b) + 1).map(q => q.id)); } else if (meta) { R.sel.has(it.id) ? R.sel.delete(it.id) : R.sel.add(it.id); R.anchor = it.id; } else { R.sel = new Set([it.id]); R.anchor = it.id; } R.cur = it.id; sfx.tick(); if (R.sel.size > 1 || R.view === 'loupe') drawRaw(); else syncThumbs(); drawRawSettings(); }
  function ropen(id) { R.cur = id; R.sel = new Set([id]); R.view = 'loupe'; drawRaw(); }

  /* vignettes : un canvas redessiné par élément, badges (drapeau, état, étoiles) en surimpression */
  function thumbEl(it, hgt, wid) {
    const c = h('canvas', { class: 'msizer-rtc', width: it.th ? it.th.width : 1, height: it.th ? it.th.height : 1 }); if (it.th) c.getContext('2d').drawImage(it.th, 0, 0);
    const el = h('div', { class: 'msizer-rt', 'data-rid': it.id, style: { height: hgt + 'px', width: wid ? wid + 'px' : '' } }, it.th ? c : h('i', { class: 'msizer-sk', style: { width: '100%', height: '100%' } }), h('div', { class: 'msizer-rtb' })); fillThumb(el, it); return el;
  }
  function fillThumb(el, it) {
    el.classList.toggle('sel', R.sel.has(it.id)); el.classList.toggle('rej', it.flag === 'reject'); const b = el.querySelector('.msizer-rtb'); if (!b) return;
    const st = it.state ? (it.state.k === 'done' ? `<span class="ok">${okI(14)}</span>` : it.state.k === 'skip' ? `<span class="wn">${skI(14)}</span>` : '') : '';
    b.innerHTML = `<div class="top"><span class="fl">${it.flag === 'pick' ? `<em class="ok">${flagI(true)}</em>` : it.flag === 'reject' ? `<em class="dg">${xcI(true)}</em>` : ''}</span>${st}</div>${it.rating ? `<div class="stars">${star(true, 10).repeat(it.rating)}${star(false, 10).repeat(5 - it.rating).replace(/currentColor/g, 'currentColor')}</div>` : ''}`;
    const sv = b.querySelector('.stars'); if (sv) [...sv.children].forEach((q, i) => q.style.color = i < it.rating ? '#f5a524' : 'rgba(255,255,255,.28)');
  }
  const syncThumbs = () => rawWork.querySelectorAll('.msizer-rt').forEach(el => { const it = R.items.find(i => i.id === el.dataset.rid); if (it) fillThumb(el, it); });
  const seeIn = (box, el, axis) => { if (!box || !el) return; const a = box.getBoundingClientRect(), b = el.getBoundingClientRect(); if (axis === 'x') { box.scrollLeft += (b.left + b.width / 2) - (a.left + a.width / 2); } else { if (b.top < a.top) box.scrollTop += b.top - a.top - 8; else if (b.bottom > a.bottom) box.scrollTop += b.bottom - a.bottom + 8; } };

  /* barre d'outils */
  function rmenu(list, anchor) { popEl ? closeMenu() : menu(list, anchor); }
  function rtool() {
    const v = rvisible(), cur = rcur(), segF = R.stars ? 'all' : R.filter;
    const seg = (opts, on, set, cls) => h('div', { class: 'msizer-seg ' + (cls || '') }, opts.map(([k, l]) => h('button', { class: on === k ? 'on' : '', 'aria-pressed': on === k, onclick: () => set(k) }, l)));
    const rate = h('div', { class: 'msizer-rate' + (cur ? '' : ' off') },
      ...[1, 2, 3, 4, 5].map(i => h('button', { 'aria-label': i + ' ★', title: String(i), style: { color: i <= (cur ? cur.rating : 0) ? '#f5a524' : '' }, onclick: () => setRating(cur && cur.rating === i ? 0 : i), html: star(i <= (cur ? cur.rating : 0), 14) })),
      h('button', { class: 'sp' + (cur && cur.flag === 'pick' ? ' pk' : ''), title: T('Retenue', 'Picked') + ' (P)', 'aria-label': T('Retenue', 'Picked'), onclick: () => setFlag('pick'), html: flagI(cur && cur.flag === 'pick') }),
      h('button', { class: cur && cur.flag === 'reject' ? 'rj' : '', title: T('Rejetée', 'Rejected') + ' (X)', 'aria-label': T('Rejetée', 'Rejected'), onclick: () => setFlag('reject'), html: xcI(cur && cur.flag === 'reject', 16) }));
    const sorts = [['name', T('Nom', 'Name')], ['date', T('Date de prise de vue', 'Capture date')], ['rating', T('Note', 'Rating')]];
    const sortB = h('button', { class: 'msizer-pill', onclick: () => rmenu(sorts.map(([k, l]) => ({ l, on: R.sort === k, fn: () => { R.sort = k; drawRaw(); } })), sortB) }, sorts.find(q => q[0] === R.sort)[1]);
    const starB = h('button', { class: 'msizer-pill', onclick: () => rmenu([1, 2, 3, 4, 5].map(n => ({ l: `★ ${n}+`, on: R.stars === n, fn: () => { R.stars = n; fixCur(); drawRaw(); drawRawSettings(); drawBottom(); } })), starB) }, R.stars ? `★ ${R.stars}+` : '★');
    return h('div', { class: 'msizer-rtool' },
      seg([['grid', T('Grille', 'Grid')], ['loupe', T('Visionneuse', 'Viewer')]], R.view, k => { if (k === 'loupe' && !R.cur) return; R.view = k; sfx.tick(); drawRaw(); }),
      seg(RFILTERS.map(k => [k, `${{ all: T('Tout', 'All'), picks: T('Retenues', 'Picks'), unflagged: T('Non triées', 'Unsorted'), rejects: T('Rejetées', 'Rejected') }[k]} ${rcount(k)}`]), segF, k => { R.filter = k; R.stars = 0; sfx.tick(); fixCur(); drawRaw(); drawRawSettings(); drawBottom(); }, 'soft'), starB,
      h('span', { class: 'msizer-gap' }), rate, h('i', { class: 'msizer-sep' }), sortB,
      h('button', { class: 'msizer-btn inl', onclick: () => addRaw(), disabled: false }, T('Ajouter des RAW', 'Add RAW files')), h('button', { class: 'msizer-btn ter inl', disabled: R.converting, onclick: clearRaw }, T('Vider la liste', 'Clear list')));
  }
  function fixCur() { const v = rvisible(); if (R.cur && !v.find(i => i.id === R.cur)) { R.cur = v[0] ? v[0].id : null; R.sel = new Set(R.cur ? [R.cur] : []); if (!R.cur) R.view = 'grid'; } }

  /* grille, visionneuse, bande d'aperçus, informations */
  function rgrid() {
    const v = rvisible(), g = h('div', { class: 'msizer-rgrid' });
    if (!v.length) g.append(h('p', { class: 'msizer-none msizer-nomatch' }, T('Aucune photo ne correspond au filtre.', 'No photo matches the filter.')));
    v.forEach(it => { const t = thumbEl(it, 130), cell = h('div', { class: 'msizer-rc', ondblclick: () => ropen(it.id), onclick: e => rclick(it, e.metaKey || e.ctrlKey, e.shiftKey), oncontextmenu: e => { e.preventDefault(); const ids = () => { R.cur = it.id; if (!R.sel.has(it.id)) R.sel = new Set([it.id]); };
        menu([{ l: T('Visionneuse', 'Viewer'), fn: () => ropen(it.id) }, '-', ...[1, 2, 3, 4, 5].map(n => ({ l: '★ ' + n, fn: () => { ids(); setRating(n); } })), { l: T('Retenue', 'Picked'), fn: () => { ids(); setFlag('pick'); } }, { l: T('Rejetée', 'Rejected'), fn: () => { ids(); setFlag('reject'); } }], cell); } }, t, h('small', {}, it.name)); g.append(cell); });
    return g;
  }
  let loupeEl = null, loupeCv = null;
  function fitLoupe() { if (!loupeEl || !loupeCv) return; const cw = loupeCv.width, ch = loupeCv.height; if (R.zoom) { loupeCv.style.width = cw + 'px'; loupeCv.style.height = ch + 'px'; return; } const k = Math.min((loupeEl.clientWidth - 24) / cw, (loupeEl.clientHeight - 24) / ch); loupeCv.style.width = Math.max(40, Math.floor(cw * k)) + 'px'; loupeCv.style.height = Math.max(40, Math.floor(ch * k)) + 'px'; }
  function rloupe() {
    const it = rcur(), box = h('div', { class: 'msizer-loupe' + (R.zoom ? ' zoom' : ''), onclick: () => { R.zoom = !R.zoom; drawRaw(); } }); loupeEl = box; loupeCv = null;
    if (!it) { box.append(h('p', { class: 'msizer-none' }, T('Aucun aperçu intégré dans ce fichier.', 'This file has no embedded preview.'))); return box; }
    const big = bigOf(it), cv = h('canvas', { width: big.width, height: big.height }); cv.getContext('2d').drawImage(big, 0, 0); loupeCv = cv; box.append(cv);
    box.append(h('div', { class: 'msizer-lov' }, h('span', { class: 'msizer-mono' }, it.name), it.rating ? h('span', { class: 'msizer-stars', html: star(true, 12).repeat(it.rating) }) : null, it.flag === 'pick' ? h('em', { class: 'ok', html: flagI(true) }) : null, it.flag === 'reject' ? h('em', { class: 'dg', html: xcI(true) }) : null));
    return box;
  }
  function rfilm() { const v = rvisible(), f = h('div', { class: 'msizer-film' }); v.forEach(it => { const t = thumbEl(it, 78, 104); t.onclick = () => { rclick(it, false, false); }; f.append(t); }); return f; }
  function rinfo() {
    const it = rcur(), p = h('aside', { class: 'msizer-info2' }); if (!it) return p;
    const hs = histC.get(it.id) || (histC.set(it.id, histOf(bigOf(it))), histC.get(it.id)), cv = h('canvas', { class: 'msizer-histo', width: 492, height: 180 }), x = cv.getContext('2d'); x.fillStyle = '#0b0c12'; x.fillRect(0, 0, 492, 180);
    const peak = Math.max(1, ...Array.from({ length: 254 }, (_, i) => Math.max(hs.r[i + 1], hs.g[i + 1], hs.b[i + 1]))); x.globalCompositeOperation = 'lighter';
    [[hs.r, '#ff4040'], [hs.g, '#38d65c'], [hs.b, '#4a7dff']].forEach(([bins, col]) => { x.beginPath(); x.moveTo(0, 180); bins.forEach((v, i) => x.lineTo(492 * i / 255, 180 * (1 - Math.min(1, v / peak)))); x.lineTo(492, 180); x.closePath(); x.globalAlpha = .55; x.fillStyle = col; x.fill(); });
    const pct = v => (Math.round(v * 1000) / 10).toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 1 }) + ' %';
    const row = (k, v) => v ? h('div', { class: 'msizer-ir' }, h('small', {}, k), h('span', {}, v)) : null;
    const state = it.state ? (it.state.k === 'done' ? h('p', { class: 'msizer-okt' }, `✓ ${T('Converti', 'Converted')} · ${fmtBytes(it.state.b)}`) : it.state.k === 'skip' ? h('p', { class: 'msizer-wnt' }, it.state.m) : null) : null;
    p.append(h('h5', {}, T('Histogramme', 'Histogram')), cv, h('p', { class: 'msizer-clip' + (hs.sh > .02 ? ' wn' : '') }, `${T('Ombres bouchées', 'Clipped shadows')} ${pct(hs.sh)}`), h('p', { class: 'msizer-clip' + (hs.hi > .02 ? ' wn' : '') }, `${T('Hautes lumières brûlées', 'Clipped highlights')} ${pct(hs.hi)}`), h('hr', {}), h('h5', {}, T('Informations', 'Information')),
      row(T('Fichier', 'File'), it.name), row(T('Boîtier', 'Camera'), it.cam), row(T('Objectif', 'Lens'), it.lens), row('ISO', String(it.iso)), row(T('Vitesse', 'Shutter'), it.shutter + ' s'), row(T('Ouverture', 'Aperture'), 'f/' + it.ap.toFixed(1)), row(T('Focale', 'Focal length'), it.focal + ' mm'), row(T('Prise de vue', 'Captured'), rdate(it)), row(T('Dimensions', 'Size'), `${dims(it.w, it.h)} · ${fmtBytes(it.bytes)}`), state);
    return p;
  }
  /** Reconstruit la zone de droite (outils + grille ou visionneuse) en gardant les positions de défilement. */
  function drawRaw() {
    const g0 = rawWork.querySelector('.msizer-rgrid'), keepG = g0 ? g0.scrollTop : 0; rawWork.innerHTML = '';
    if (!R.items.length && !R.scanning) {
      const dz = h('div', { class: 'msizer-empty', ondragover: e => { e.preventDefault(); dz.classList.add('on'); }, ondragleave: () => dz.classList.remove('on'), ondrop: e => { e.preventDefault(); dz.classList.remove('on'); toast({ icon: icon(app.id), title: app.id, body: T('Démo : aucun fichier de votre Mac n’est lu. Voici des RAW d’exemple.', 'Demo: no file from your Mac is read. Here are sample RAW files.') }); addRaw(); } },
        h('div', { class: 'msizer-emp' }, h('span', { class: 'msizer-bigmark', html: MARK }), h('h2', {}, T('Déposez vos fichiers RAW ici', 'Drop your RAW files here')), h('p', {}, T('RW2 (Panasonic), CR2, CR3, NEF, ARW, RAF, ORF, PEF et plus de 1 000 boîtiers, ou des dossiers entiers. Vos RAW d’origine ne sont jamais modifiés.', 'RW2 (Panasonic), CR2, CR3, NEF, ARW, RAF, ORF, PEF and over 1,000 cameras, or whole folders. Your original RAW files are never modified.')), h('button', { class: 'sbtn act msizer-add', onclick: () => addRaw() }, T('AJOUTER DES RAW', 'ADD RAW FILES'))));
      rawWork.append(dz); return;
    }
    const col = h('div', { class: 'msizer-rcol' }, rtool());
    if (R.view === 'loupe' && R.cur) { const left = h('div', { class: 'msizer-rleft' }, rloupe(), rfilm()); col.append(h('div', { class: 'msizer-rbody' }, left, R.info ? rinfo() : null)); }
    else { R.view = 'grid'; col.append(rgrid()); }
    rawWork.append(col);
    const g = rawWork.querySelector('.msizer-rgrid'); if (g) { g.scrollTop = keepG; const c = g.querySelector('.msizer-rt.sel'); if (c && R.cur) seeIn(g, c.parentElement); }
    const f = rawWork.querySelector('.msizer-film'); if (f) { const c = f.querySelector('.msizer-rt.sel'); seeIn(f, c, 'x'); }
    fitLoupe();
  }
  const ro2 = new ResizeObserver(() => { if (!alive()) return ro2.disconnect(); fitLoupe(); }); ro2.observe(rawWork);
  async function addRaw() {
    if (R.converting || R.scanning) return; const batch = RAWS.slice(R.next, R.next + (R.next === 0 ? 12 : 6)); if (!batch.length) return toast({ icon: icon(app.id), title: app.id, body: T('Les 18 RAW d’exemple sont déjà dans la liste.', 'The 18 sample RAW files are already in the list.') });
    R.next += batch.length; R.scanning = true; R.summary = ''; sfx.pop();
    const fresh = batch.map(r => ({ id: 'r' + r[0], name: r[0], cam: r[1], lens: r[2], iso: r[3], shutter: r[4], ap: r[5], focal: r[6], date: new Date(r[7]), w: r[8], h: r[9], mb: r[10], bytes: Math.round(r[10] * 1e6), kind: r[11], seed: r[12], isDNG: /\.dng$/i.test(r[0]), rating: 0, flag: '', state: null, th: null, convKey: '' }));
    R.items.push(...fresh); if (!R.cur) { const v = rvisible(); R.cur = v[0].id; R.sel = new Set([R.cur]); R.anchor = R.cur; } drawRaw(); drawRawSettings(); drawBottom();
    for (const [k, it] of fresh.entries()) { await wait(reduced() ? 0 : 70); if (!alive()) return; const q = 340 / Math.max(it.w, it.h), c = mk(it.w * q, it.h * q); paintScene(c, it.kind, it.seed); it.th = c; sfx.tick();
      rawWork.querySelectorAll(`.msizer-rt[data-rid="${it.id}"]`).forEach(el => { const n = thumbEl(it, parseInt(el.style.height), parseInt(el.style.width) || 0); el.replaceWith(n); }); }
    R.scanning = false; if (alive()) { drawRaw(); drawBottom(); }
  }
  function clearRaw() { if (R.converting) return; R.items = []; R.cur = null; R.sel = new Set(); R.view = 'grid'; R.filter = 'all'; R.stars = 0; R.next = 0; R.summary = ''; R.last = false; bigs.clear(); histC.clear(); sfx.close(); drawRaw(); drawRawSettings(); drawBottom(); }

  /* conversion par lots : barre de progression, taille du DNG selon les options, conflits de noms */
  async function rawConvert() {
    const list = rscope(); if (R.converting || !list.length) return; R.converting = true; R.cancelled = false; R.progress = 0; R.summary = ''; R.warn = false; R.last = false; list.forEach(i => { i.state = null; }); syncThumbs(); drawRawSettings(); drawBottom(); sfx.click();
    const st = { ...R.set }, key = destKey(); let n = 0, written = 0, skipped = 0, a = 0, b = 0;
    for (const it of list) {
      if (R.cancelled || !alive()) break; await wait(reduced() ? 0 : 90 + (st.verify ? 70 : 0) + (st.compressed ? 20 : 0) + (it.mb > 40 ? 40 : 0)); if (!alive()) return;
      if (it.convKey === key && st.conflict === 'skip') { it.state = { k: 'skip', m: T('Existe déjà : ignoré', 'Already exists: skipped') }; skipped++; }
      else { const o = dngBytes(it); it.state = { k: 'done', b: o }; it.convKey = key; written++; a += it.bytes; b += o; }
      n++; R.progress = n / list.length; sfx.tick(); const el = rawWork.querySelectorAll(`.msizer-rt[data-rid="${it.id}"]`); el.forEach(e => fillThumb(e, it)); drawBottom();
      if (R.view === 'loupe' && R.cur === it.id) drawRaw();
    }
    R.converting = false; R.progress = 0; const rate = (st.compressed ? 31 : 38) * (st.verify ? .55 : 1) * (st.embedOriginal ? .8 : 1), dt = n / rate, real = written / dt; const f1 = v => v.toFixed(1).replace('.', lang() === 'fr' ? ',' : '.');
    const parts = R.cancelled ? [T(`Interrompu après ${n} fichiers.`, `Stopped after ${n} files.`)] : [T(`${written} DNG écrits en ${f1(dt)} s · ${f1(real)} par seconde`, `${written} DNG written in ${f1(dt)} s · ${f1(real)} per second`)];
    if (skipped) parts.push(T(`${skipped} ignorés`, `${skipped} skipped`)); R.summary = parts.join(' · '); R.warn = R.cancelled; R.last = written > 0;
    if (!R.cancelled) { sfx.done(); if (written) toast({ icon: icon(app.id), title: app.id, body: T(`${fmtBytes(a)} de RAW convertis en ${fmtBytes(b)} de DNG.`, `${fmtBytes(a)} of RAW converted to ${fmtBytes(b)} of DNG.`) }); }
    drawRawSettings(); drawBottom(); if (R.view === 'loupe') drawRaw();
  }
  function drawRawBottom() {
    bottom.innerHTML = ''; if (R.converting) return bottom.append(h('div', { class: 'msizer-pb' }, h('i', { style: { width: R.progress * 100 + '%' } })), h('span', { class: 'msizer-pct' }, Math.round(R.progress * 100) + ' %'), btn(T('ANNULER', 'CANCEL'), () => { R.cancelled = true; }, 'w160'));
    const n = rscope().length;
    bottom.append(...[h('span', { class: 'msizer-sum' + (R.warn ? ' wn' : R.summary ? ' ok' : '') }, R.scanning ? T('Chargement…', 'Loading…') : R.summary),
      R.last ? btn(T('Afficher dans le Finder', 'Show in Finder'), () => { sfx.click(); toast({ icon: icon(app.id), title: 'Finder', body: R.set.dest === 'folder' ? R.set.folder : R.set.dest === 'beside' ? T('À côté de chaque RAW d’origine.', 'Next to each original RAW.') : T('Sous-dossier « DNG » à côté de chaque RAW.', '“DNG” subfolder next to each RAW.') }); }, 'w200') : null,
      h('button', { class: 'sbtn act msizer-go wide', disabled: n === 0, onclick: rawConvert }, T(`CONVERTIR ${n} EN DNG`, `CONVERT ${n} TO DNG`))].filter(Boolean));
  }
  /* --- bascule Photos / RAW → DNG --- */
  const modeSeg = h('div', { class: 'msizer-seg msizer-mode' });
  const main = h('div', { class: 'msizer-main' });
  function drawModeSeg() { modeSeg.innerHTML = ''; [['photos', T('Photos', 'Photos')], ['raw', 'RAW → DNG']].forEach(([k, l]) => modeSeg.append(h('button', { class: mode === k ? 'on' : '', 'aria-pressed': mode === k, onclick: () => setMode(k) }, l))); }
  function setMode(k) { if (k === mode) return; closeMenu(); closeSheet(); mode = k; sfx.tick(); drawMode(); }
  function drawMode() {
    drawModeSeg(); main.innerHTML = '';
    if (mode === 'raw') { drawRawSettings(); main.append(rawSettings, h('div', { class: 'msizer-vl' }), rawWork); drawRaw(); drawBottom(); }
    else { main.append(settings, h('div', { class: 'msizer-vl' }), work); drawAll(); }
  }

  /* --- assemblage --- */
  const dlb = h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download'));
  const bar = h('div', { class: 'sbar msizer-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('mSIZER', BRAND) }), modeSeg, h('span', { class: 'msizer-gap' }), dlb,
    h('button', { class: 'msizer-ib', 'aria-label': T('Réglages…', 'Settings…'), title: T('Réglages…', 'Settings…'), onclick: settingsSheet, html: svg(GEAR) }));
  const work = h('div', { class: 'msizer-work' });
  function drawAll() {
    work.innerHTML = '';
    if (!items.length) {
      const dz = h('div', { class: 'msizer-empty', ondragover: e => { e.preventDefault(); dz.classList.add('on'); }, ondragleave: () => dz.classList.remove('on'), ondrop: e => { e.preventDefault(); dz.classList.remove('on'); toast({ icon: icon(app.id), title: app.id, body: T('Démo : aucune photo de votre Mac n’est lue. Voici des photos d’exemple.', 'Demo: no photo from your Mac is read. Here are sample photos.') }); addPhotos(); } },
        h('div', { class: 'msizer-emp', }, h('span', { class: 'msizer-bigmark', html: MARK }), h('h2', {}, T('Déposez vos photos ici', 'Drop your photos here')), h('p', {}, T('Glissez des photos ou des dossiers, ou utilisez le bouton Ajouter. Vos photos d’origine ne sont pas modifiées.', 'Drag photos or folders, or use the Add button. Your original photos are not modified.')), h('button', { class: 'sbtn act msizer-add', onclick: () => addPhotos() }, T('AJOUTER DES PHOTOS', 'ADD PHOTOS'))));
      work.append(dz);
    } else { drawList(); work.append(list, h('div', { class: 'msizer-vl' }), preview); drawPreviewTabs(); schedule(); ro.observe(stage); }
    drawBottom();
  }
  const onKey = e => {
    if (!alive()) { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onUp); return; } if (!w.el.classList.contains('active')) return;
    if (e.key === 'Escape' && (sheetEl || popEl || mode !== 'raw')) { if (sheetEl) closeSheet(); else closeMenu(); return; }
    const mod = e.metaKey || e.ctrlKey;
    if (mode === 'raw') {
      if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); return addRaw(); } if (mod && e.key === 'Enter') { e.preventDefault(); return rawConvert(); }
      if (mod || e.altKey || sheetEl || e.target.matches('input,textarea') || !R.items.length) return; const k = e.key, lk = k.toLowerCase(), hit = () => { e.preventDefault(); if (e.target.matches('button')) e.target.blur(); };
      if (k === 'ArrowLeft') { hit(); rmove(-1); } else if (k === 'ArrowRight') { hit(); rmove(1); } else if (k === 'ArrowUp') { hit(); rmove(R.view === 'grid' ? -rcolumns() : -1); } else if (k === 'ArrowDown') { hit(); rmove(R.view === 'grid' ? rcolumns() : 1); }
      else if (k === ' ') { hit(); if (e.repeat) return; R.zoom = !R.zoom; if (R.view === 'grid' && R.cur) ropen(R.cur); else drawRaw(); } else if (k === 'Enter') { hit(); if (R.cur) ropen(R.cur); } else if (k === 'Escape') { if (R.view === 'loupe') { R.view = 'grid'; drawRaw(); } }
      else if (/^[0-5]$/.test(k)) { hit(); setRating(+k); } else if (lk === 'p') { hit(); setFlag('pick'); } else if (lk === 'x') { hit(); setFlag('reject'); } else if (lk === 'u') { hit(); rtargets().forEach(i => { i.flag = ''; i.rating = 0; }); sfx.tick(); afterMark(); }
      else if (lk === 'g') { hit(); R.view = 'grid'; drawRaw(); } else if (lk === 'e') { hit(); if (R.cur) { R.view = 'loupe'; drawRaw(); } } else if (lk === 'i') { hit(); R.info = !R.info; drawRaw(); }
      return;
    }
    if (e.code === 'Space' && !e.repeat && !e.target.matches('input,textarea,button') && items.length && showAfter && !holdBefore) { e.preventDefault(); holdBefore = true; schedule(); }
    if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); addPhotos(); } else if (mod && e.key === 'Enter') { e.preventDefault(); start(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length && !e.target.matches('input,textarea')) { e.preventDefault(); const i = items.findIndex(q => q.id === selId), n = clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); selId = items[n].id; drawList(); schedule(); }
  };
  const onUp = e => { if (e.code === 'Space' && holdBefore) { holdBefore = false; schedule(); } };
  document.addEventListener('keydown', onKey); document.addEventListener('keyup', onUp);
  drawSettings();
  root.append(bar, main, bottom);
  drawMode();
  w.render = () => { closeMenu(); closeSheet(); drawSettings(); drawMode(); dlb.textContent = t('f.download'); };
  return root;
}
