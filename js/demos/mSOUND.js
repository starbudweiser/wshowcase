/* Réplique interactive de mSOUND : convertir, couper et retoucher de l'audio sur macOS.
   Éditeur de forme d'onde (sélection à la souris, zoom, défilement, vue d'ensemble, lecture avec tête de lecture, couper / copier / coller / supprimer / garder,
   fondus, normaliser, gain, repères et repères aux silences, annulation illimitée, effets et recettes avec progression, import d'échantillons colorés,
   timelines, enregistrement au micro simulé, export avec choix du format) et Finder simulé : clic droit sur des fichiers audio, conversion avec jauge sur l'icône
   ou fenêtre de progression flottante. Données d'exemple : aucun fichier n'est lu, converti ni enregistré ; la lecture est un petit son synthétisé (Web Audio). */
import { css, h, T, sfx, toast, icon, S, wait, reduced, dialog } from './tk.js';
import { wm, brand } from './kit.js';

const CSSF = 'css/demos/mSOUND.css';
const RES = 200;                       // points d'amplitude par seconde
const VERSION = '1.3.0';
const NEG1DB = Math.pow(10, -1 / 20);  // −1 dBFS

/* ——— icônes (traits, 20×20) ——— */
const P = {
  undo: '<path d="M7 5 3.5 8.5 7 12"/><path d="M4 8.5h7.5a4.5 4.5 0 0 1 0 9H9"/>',
  redo: '<path d="M13 5l3.5 3.5L13 12"/><path d="M16 8.5H8.5a4.5 4.5 0 0 0 0 9H11"/>',
  cut: '<circle cx="5.5" cy="14.5" r="2.5"/><circle cx="14.5" cy="14.5" r="2.5"/><path d="M7.3 12.7 15 3M12.7 12.7 5 3"/>',
  copy: '<rect x="7" y="6" width="9" height="11" rx="1.5"/><path d="M4 13.5V4.5A1.5 1.5 0 0 1 5.5 3H12"/>',
  paste: '<rect x="4.5" y="4" width="11" height="13.5" rx="1.5"/><rect x="7.5" y="2.5" width="5" height="3" rx="1"/>',
  trash: '<path d="M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.8 11.2a1 1 0 0 0 1 .8h5.4a1 1 0 0 0 1-.8l.8-11.2"/>',
  crop: '<path d="M5.5 2.5v12h12M2.5 5.5h12v12"/>',
  fx: '<path d="M3 5.5h8M14 5.5h3M3 14.5h3M9 14.5h8"/><circle cx="12.5" cy="5.5" r="1.8"/><circle cx="7.5" cy="14.5" r="1.8"/>',
  normalize: '<path d="M2.5 10h1.5M6 7v6M9 4.5v11M12 7v6"/><path d="M15.5 6.5v5M13 9h5"/>',
  isolate: '<path d="M3 17 12.5 7.5M11 6l3 3"/><path d="M15 2.5v2.5M13.75 3.75h2.5M17 9v2M16 10h2M7 3v2M6 4h2"/>',
  compress: '<path d="M2 10h3l1.5-4 3 9 2.5-7 1.5 2h4.5"/>',
  voicePro: '<rect x="7.5" y="2.5" width="5" height="9" rx="2.5"/><path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5"/>',
  eqVoice: '<path d="M5 3v14M10 3v14M15 3v14"/><path d="M3.5 12h3M8.5 7h3M13.5 10h3"/>',
  loudness: '<path d="M3 8h3l4-3.5v11L6 12H3z"/><path d="M13 7.5a3.5 3.5 0 0 1 0 5M15.2 5.5a6.5 6.5 0 0 1 0 9"/>',
  flag: '<path d="M5 17.5V3M5 3.5h9.5l-2 3.25 2 3.25H5"/>',
  addtl: '<rect x="2.5" y="6" width="11" height="10" rx="1.5"/><path d="M6.5 3.5h9a2 2 0 0 1 2 2v7M8 11h5M10.5 8.5v5"/>',
  fit: '<path d="M2.5 10h15M5.5 7 2.5 10l3 3M14.5 7l3 3-3 3"/>',
  side: '<rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/><path d="M12.5 3.5v13"/>',
  zminus: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2 16.5 16.5M6.5 8.5h4"/>',
  zplus: '<circle cx="8.5" cy="8.5" r="5"/><path d="M12.2 12.2 16.5 16.5M6.5 8.5h4M8.5 6.5v4"/>',
  spk: '<path d="M4 8h3l4-3.5v11L7 12H4z" fill="currentColor"/>',
  spk3: '<path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor"/><path d="M12.5 7.5a3.5 3.5 0 0 1 0 5M14.7 5.5a6.5 6.5 0 0 1 0 9"/>',
  rec: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.6" fill="currentColor" stroke="none"/>',
  recstop: '<circle cx="10" cy="10" r="7.5" fill="currentColor" stroke="none"/><rect x="7.2" y="7.2" width="5.6" height="5.6" rx="1" fill="#fff" stroke="none"/>',
  start: '<path d="M5 4v12" stroke-width="2.2"/><path d="M16 4.5v11L7.5 10z" fill="currentColor" stroke="none"/>',
  end: '<path d="M15 4v12" stroke-width="2.2"/><path d="M4 4.5v11l8.5-5.5z" fill="currentColor" stroke="none"/>',
  play: '<path d="M6 3.8v12.4L16.5 10z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="5" y="4" width="3.6" height="12" rx=".8" fill="currentColor" stroke="none"/><rect x="11.4" y="4" width="3.6" height="12" rx=".8" fill="currentColor" stroke="none"/>',
  stop: '<rect x="5" y="5" width="10" height="10" rx="1.2" fill="currentColor" stroke="none"/>',
  wave: '<path d="M2.5 9v2M5.5 6.5v7M8.5 3.5v13M11.5 6v8M14.5 8v4M17.5 9.2v1.6"/>',
  note: '<path d="M8 15V4.5l8-2V13"/><circle cx="6" cy="15" r="2"/><circle cx="14" cy="13" r="2"/>',
  x: '<path d="M6 6l8 8M14 6l-8 8"/>'
};
const ico = (k, cls = '') => h('span', { class: 'ms-i ' + cls, html: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${P[k]}</svg>` });

/* ——— formats ——— */
const FORMATS = [['mp3', 'MP3', 0], ['m4a', 'M4A (AAC)', 0], ['flac', 'FLAC', 1], ['wav', 'WAV', 1], ['aiff', 'AIFF', 1], ['alac', 'ALAC', 1]];
const fmtName = f => (FORMATS.find(x => x[0] === f) || [0, f.toUpperCase()])[1];
const lossless = f => !!(FORMATS.find(x => x[0] === f) || [])[2];
const extOf = f => (f === 'alac' ? 'm4a' : f);
const KIND = { wav: ['Audio WAV', 'WAV audio'], aiff: ['Audio AIFF', 'AIFF audio'], flac: ['Audio FLAC', 'FLAC audio'], mp3: ['Audio MP3', 'MP3 audio'], m4a: ['Audio MPEG-4', 'MPEG-4 audio'] };
const mb = n => (n < 1 ? n.toFixed(2) : n.toFixed(1)).replace('.', T(',', '.')) + ' ' + T('Mo', 'MB');
const outMB = (f, sec, kbps) => lossless(f) ? 176400 * sec * (f === 'flac' ? 0.55 : f === 'alac' ? 0.58 : 1) / 1048576 : kbps * 125 * sec / 1048576;

/* ——— temps ——— */
const ts = (frames, ms = true) => {
  const t = Math.max(0, frames / RES), hh = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60), p = n => String(n).padStart(2, '0');
  return (hh ? hh + ':' + p(m) : p(m)) + ':' + p(s) + (ms ? '.' + String(Math.floor((t - Math.floor(t)) * 1000)).padStart(3, '0') : '');
};
const rulerLabel = (t, step) => { const m = Math.floor(t / 60), s = Math.floor(t % 60), p = n => String(n).padStart(2, '0'); return p(m) + ':' + p(s) + (step < 1 ? '.' + p(Math.floor((t - Math.floor(t)) * 100 + 1e-6)) : ''); };

/* ——— sons d'exemple (enveloppes d'amplitude générées) ——— */
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
function gen(kind, sec, sd) {
  const n = Math.round(sec * RES), a = new Float32Array(n), r = rnd(sd * 977 + 13);
  if (kind === 'music') {
    const beat = 60 / 96, sections = sd === 1 ? [[0, .5], [20, .78], [41, .02], [42.4, .95], [70, .68], [97.2, .02], [98.6, .9], [138, .55]] : [[0, .6], [sec * .3, .85], [sec * .7, .7]];
    let lvl = .5;
    for (let i = 0; i < n; i++) {
      const t = i / RES; let tg = sections[0][1]; for (const [s0, v] of sections) if (t >= s0) tg = v;
      lvl += (tg - lvl) * (tg < .1 || lvl < .1 ? .2 : .004);
      const b = (t / beat) % 1, half = (t / beat * 2) % 1;
      const env = .38 + .44 * Math.exp(-b * 5) + .12 * Math.exp(-half * 7);
      let v = lvl * env * (.72 + .28 * r());
      if (t < 3) v *= t / 3; if (t > sec - 8) v *= Math.max(0, (sec - t) / 8);
      a[i] = Math.min(.84, Math.max(.008, v));
    }
  } else if (kind === 'voice') {
    let i = 0;
    while (i < n) {
      const word = Math.round((.12 + r() * .3) * RES), peak = .28 + r() * .42;
      for (let k = 0; k < word && i < n; k++, i++) a[i] = peak * Math.sin(Math.PI * k / word) * (.7 + .3 * r()) + .025 + r() * .02;
      const gap = Math.round((r() < .14 ? .5 + r() * .6 : .04 + r() * .12) * RES);
      for (let k = 0; k < gap && i < n; k++, i++) a[i] = .02 + r() * .025;
    }
  } else if (kind === 'rain') {
    for (let i = 0; i < n; i++) a[i] = .22 + .1 * Math.sin(i / RES * .7) + r() * .16 + (r() < .004 ? .35 : 0);
  } else if (kind === 'applause') {
    for (let i = 0; i < n; i++) { const t = i / n; a[i] = (.25 + .55 * Math.sin(Math.PI * Math.min(1, t * 1.3))) * (.6 + .4 * r()); }
  } else if (kind === 'whoosh') {
    for (let i = 0; i < n; i++) { const t = i / n; a[i] = .05 + .8 * Math.exp(-Math.pow((t - .62) * 4.2, 2)) * (.85 + .15 * r()); }
  }
  return a;
}

/* ——— fichiers d'exemple (Finder simulé) ——— */
const FILES = () => [
  { n: 'Acoustic Breeze', f: 'wav', sec: 150, kind: 'music', sd: 1, khz: 44.1, bits: 16, ch: 2 },
  { n: T('Interview – prise 2', 'Interview – take 2'), f: 'wav', sec: 161, kind: 'voice', sd: 2, khz: 48, bits: 24, ch: 2 },
  { n: T('Générique podcast', 'Podcast intro'), f: 'aiff', sec: 58, kind: 'music', sd: 3, khz: 44.1, bits: 16, ch: 2 },
  { n: T('Pluie sur le toit', 'Rain on the roof'), f: 'flac', sec: 95, kind: 'rain', sd: 4, khz: 44.1, bits: 16, ch: 2, mb: 9.2 },
  { n: T('Mémo vocal', 'Voice memo'), f: 'm4a', sec: 72, kind: 'voice', sd: 5, khz: 44.1, bits: 16, ch: 1, mb: 1.1 },
  { n: 'Jingle', f: 'mp3', sec: 18, kind: 'music', sd: 6, khz: 44.1, bits: 16, ch: 2, mb: 0.55 }
].map(x => ({ ...x, mb: x.mb || x.khz * 1000 * x.bits / 8 * x.ch * x.sec / 1048576 }));
const SAMPLES = () => [{ n: T('Applaudissements', 'Applause'), kind: 'applause', sec: 4.5 }, { n: 'Whoosh', kind: 'whoosh', sec: 1.6 }];

/* ——— couleurs (comme WaveformView / WavePalette) ——— */
const PAL = {
  dark: { bg: '#202024', wave: '#2ed4bf', acc: '#0a84ff', muted: '#999999', head: '#2ed4bf', tints: ['#2ed4bf', '#ff9e0a', '#ff5c9e', '#b085ff', '#9edb40'] },
  sand: { bg: '#f2ebd9', wave: '#a8691a', acc: '#ba731a', muted: '#7d7359', head: '#0d9487', tints: ['#a8691a', '#cc6b05', '#c73873', '#734dc7', '#598c1a'] }
};
const SHORTCUTS = {
  normalize: ['normalize', T('Normaliser', 'Normalize'), T('Normaliser', 'Normalize')],
  isolate: ['isolate', T('Isoler et nettoyer', 'Isolate & clean'), T('Isoler et nettoyer la voix', 'Isolate and clean the voice')],
  compress: ['compress', T('Compression', 'Compression'), T('Compression studio', 'Studio compression')],
  voicePro: ['voicePro', T('Voix pro', 'Pro voice'), T('Voix pro (recette complète)', 'Pro voice (full recipe)')],
  eqVoice: ['eqVoice', T('Égaliseur', 'EQ'), T('Égaliser la voix', 'Voice EQ')],
  loudness: ['loudness', T('Sonie −16', 'Loudness −16'), T('Sonie −16 LUFS', 'Loudness −16 LUFS')]
};

export function open(app) {
  css('css/demos/tk.css'); css(CSSF);
  const ID = 'app:' + app.id, FID = ID + ':finder', PID = ID + ':progress';
  if (wm.wins.has(ID)) return wm.open({ id: ID });
  const st = {
    docs: [], cur: 0, clip: null, insp: true, theme: 'auto', fmt: 'm4a', kbps: 256, vol: .8, playing: false, rec: null,
    menu: ['mp3', 'm4a', 'flac', 'wav', 'aiff', 'alac', 'edit'], quality: 256, slots: ['normalize', 'isolate', 'compress'], autoUpd: true,
    files: FILES(), fsel: new Set(), jobs: [], fx: { str: 'medium', eq: 'voice', comp: 'studio', lufs: -16 }
  };
  const W = 1240, H = 680, FW = 470, FH = 400;

  /* ——— documents ——— */
  const mkDoc = (file, amp) => {
    const a = amp || gen(file.kind, file.sec, file.sd || 9);
    return { name: file.n, ext: file.f, khz: file.khz || 44.1, bits: file.bits || 16, ch: file.ch || 2, size: file.mb || 0, amp: a, tint: new Uint8Array(a.length), markers: [], undo: [], redo: [], sel: null, ph: 0, phSet: false, fpp: 1, scroll: 0, fit: true, src: { 0: file.n }, edited: false, work: null, segs: 1, kind: file.kind };
  };
  const D = () => st.docs[st.cur];
  const N = d => d.amp.length;

  /* ——— fenêtre principale ——— */
  const root = h('div', { class: 'tk ms', tabindex: '0' });
  const tb = h('div', { class: 'ms-tb', 'data-drag': '' }), tabs = h('div', { class: 'ms-tabs' }), tools = h('div', { class: 'ms-tools' });
  const ovC = h('canvas', { class: 'ms-ov' }), wvC = h('canvas', { class: 'ms-wv' });
  const ovBox = h('div', { class: 'ms-card ms-ovb' }, ovC), wvBox = h('div', { class: 'ms-card ms-wvb' }, wvC);
  const recBox = h('div', { class: 'ms-card ms-recp' }), transport = h('div', { class: 'ms-card ms-tr' }), insp = h('div', { class: 'ms-insp' });
  const col = h('div', { class: 'ms-col' }, ovBox, wvBox, recBox, transport);
  const body = h('div', { class: 'ms-body' }, col, insp);
  root.append(tb, tabs, tools, body);
  const isSand = () => st.theme === 'sand' || (st.theme === 'auto' && document.documentElement.dataset.theme !== 'dark');
  const pal = () => PAL[isSand() ? 'sand' : 'dark'];

  /* ——— annulation ——— */
  const snap = d => ({ amp: d.amp.slice(), tint: d.tint.slice(), markers: d.markers.map(m => ({ ...m })), segs: d.segs, edited: d.edited });
  const restore = (d, s) => { Object.assign(d, { amp: s.amp, tint: s.tint, markers: s.markers, segs: s.segs, edited: s.edited }); d.sel = null; d.ph = Math.min(d.ph, N(d)); refit(d); };
  const edit = (d, fn) => { d.undo.push(snap(d)); if (d.undo.length > 80) d.undo.shift(); d.redo = []; fn(); d.edited = true; refit(d); ui(); };
  const undo = () => { const d = D(); if (!d.undo.length) return; d.redo.push(snap(d)); restore(d, d.undo.pop()); sfx.tick(); ui(); };
  const redo = () => { const d = D(); if (!d.redo.length) return; d.undo.push(snap(d)); restore(d, d.redo.pop()); sfx.tick(); ui(); };

  /* ——— opérations de montage (non destructives dans l'appli : ici sur l'enveloppe d'amplitude) ——— */
  const cat = (...arrs) => { const T0 = arrs[0].constructor, o = new T0(arrs.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of arrs) { o.set(x, p); p += x.length; } return o; };
  const removeRange = (d, a, b) => {
    const len = b - a; if (a > 0 && b < N(d)) d.segs++;
    d.amp = cat(d.amp.subarray(0, a), d.amp.subarray(b)); d.tint = cat(d.tint.subarray(0, a), d.tint.subarray(b));
    d.markers = d.markers.filter(m => m.f < a || m.f >= b).map(m => (m.f >= b ? { ...m, f: m.f - len } : m));
  };
  const insertAt = (d, p, amp, tint) => {
    if (p > 0 && p < N(d)) d.segs += 2; else d.segs++;
    d.amp = cat(d.amp.subarray(0, p), amp, d.amp.subarray(p)); d.tint = cat(d.tint.subarray(0, p), tint, d.tint.subarray(p));
    d.markers = d.markers.map(m => (m.f >= p ? { ...m, f: m.f + amp.length } : m));
  };
  const range = d => d.sel || [0, N(d)];
  const cut = () => { const d = D(); if (!d.sel) return; const [a, b] = d.sel; st.clip = { amp: d.amp.slice(a, b), tint: d.tint.slice(a, b) }; edit(d, () => { removeRange(d, a, b); d.ph = a; d.sel = null; }); };
  const copy = () => { const d = D(); if (!d.sel) return; const [a, b] = d.sel; st.clip = { amp: d.amp.slice(a, b), tint: d.tint.slice(a, b) }; sfx.tick(); ui(); };
  const paste = () => { const d = D(), c = st.clip; if (!c) return; edit(d, () => { let p = d.ph; if (d.sel) { p = d.sel[0]; removeRange(d, d.sel[0], d.sel[1]); } insertAt(d, p, c.amp, c.tint); d.sel = [p, p + c.amp.length]; d.ph = p; }); };
  const del = () => { const d = D(); if (!d.sel) return; const [a, b] = d.sel; edit(d, () => { removeRange(d, a, b); d.ph = a; d.sel = null; }); };
  const keep = () => { const d = D(); if (!d.sel) return; const [a, b] = d.sel; edit(d, () => { d.amp = d.amp.slice(a, b); d.tint = d.tint.slice(a, b); d.markers = d.markers.filter(m => m.f >= a && m.f < b).map(m => ({ ...m, f: m.f - a })); d.segs = 1; d.ph = 0; d.sel = null; }); };
  const gainRange = (d, a, b, f) => { for (let i = a; i < b; i++) d.amp[i] = Math.min(1, d.amp[i] * f); };
  const gain = db => { const d = D(); const [a, b] = range(d); edit(d, () => gainRange(d, a, b, Math.pow(10, db / 20))); };
  const fade = inn => { const d = D(); const r = d.sel || (inn ? [0, Math.min(RES, N(d) >> 1)] : [N(d) - Math.min(RES, N(d) >> 1), N(d)]); edit(d, () => { const [a, b] = r; for (let i = a; i < b; i++) { const t = (i - a) / Math.max(1, b - a); d.amp[i] *= inn ? t : 1 - t; } }); };
  const normalize = () => {
    const d = D(); if (d.work) return; const [a, b] = range(d); let pk = 0; for (let i = a; i < b; i++) pk = Math.max(pk, d.amp[i]);
    if (pk < 1e-5) return say(T('La sélection est muette.', 'The selection is silent.'));
    edit(d, () => gainRange(d, a, b, NEG1DB / pk)); sfx.tick();
  };
  const addMarker = () => { const d = D(); edit(d, () => { d.markers.push({ f: Math.round(d.ph), n: T('Repère ', 'Marker ') + (d.markers.length + 1) }); d.markers.sort((x, y) => x.f - y.f); }); sfx.tick(); };
  const silences = () => {
    const d = D(), out = []; let s = -1;
    for (let i = 0; i <= N(d); i++) { const q = i < N(d) && d.amp[i] < .05; if (q && s < 0) s = i; if (!q && s >= 0) { if (i - s > RES * .4) out.push((s + i) >> 1); s = -1; } }
    if (!out.length) return say(T('Aucun silence trouvé.', 'No silence found.'));
    edit(d, () => { let n = d.markers.length; out.forEach(f => d.markers.push({ f, n: T('Repère ', 'Marker ') + (++n) })); d.markers.sort((x, y) => x.f - y.f); }); sfx.done();
  };

  /* ——— filtres (simulés sur l'enveloppe, avec progression et annulation) ——— */
  const mean = (d, a, b) => { let s = 0; for (let i = a; i < b; i++) s += d.amp[i]; return s / Math.max(1, b - a); };
  const STEP = {
    clean: (d, a, b) => { for (let i = a; i < b; i++) d.amp[i] = d.amp[i] < .07 ? d.amp[i] * .55 : d.amp[i] * .97; },
    denoise: k => (d, a, b) => { const s = { light: .5, medium: 1, strong: 1.6 }[k]; for (let i = a; i < b; i++) { const v = d.amp[i]; d.amp[i] = Math.max(.004, v < .1 ? v * (1 - .5 * s / 1.6) - .01 * s : v - .012 * s); } },
    eq: k => (d, a, b) => { const f = { voice: 1.06, warm: 1.03, bright: 1.08 }[k]; for (let i = a; i < b; i++) d.amp[i] = Math.min(1, d.amp[i] * f * (.97 + .06 * Math.abs(Math.sin(i * .37)))); },
    compress: k => (d, a, b) => { const e = { soft: .8, studio: .6, radio: .45 }[k], m = mean(d, a, b) || .1; for (let i = a; i < b; i++) d.amp[i] = Math.min(1, m * Math.pow(d.amp[i] / m, e)); },
    loud: l => (d, a, b) => { const tg = { '-23': .22, '-18': .34, '-16': .42, '-14': .5 }[String(l)], f = tg / (mean(d, a, b) || .1); for (let i = a; i < b; i++) d.amp[i] = Math.min(NEG1DB, d.amp[i] * f); }
  };
  const RECIPES = () => [
    ['voicePro', T('Voix pro', 'Pro voice'), T('Voix propre (studio, bureau calme) : podcast, vidéo, −16 LUFS.', 'Clean voice (studio, quiet office): podcast, video, −16 LUFS.'), [STEP.clean, STEP.denoise('light'), STEP.eq('voice'), STEP.compress('studio'), STEP.loud(-16)]],
    ['interview', T('Interview bruyante', 'Noisy interview'), T('Terrain, pièce qui résonne : débruitage fort, compression radio, −16 LUFS.', 'Field recording, echoey room: strong denoise, radio compression, −16 LUFS.'), [STEP.clean, STEP.denoise('strong'), STEP.eq('voice'), STEP.compress('radio'), STEP.loud(-16)]],
    ['narration', T('Voix off chaleureuse', 'Warm narration'), T('Narration, livre audio : voix ronde et régulière, −18 LUFS.', 'Narration, audiobook: round, even voice, −18 LUFS.'), [STEP.clean, STEP.denoise('light'), STEP.eq('warm'), STEP.compress('soft'), STEP.loud(-18)]],
    ['instrument', T('Instrument / échantillon', 'Instrument / sample'), T('Nettoyage doux, graves conservés, compression légère, −14 LUFS.', 'Gentle cleanup, bass kept, light compression, −14 LUFS.'), [STEP.denoise('light'), STEP.compress('soft'), STEP.loud(-14)]]
  ];
  const process = async (steps, title, d = D()) => {
    if (d.work) return;
    const [a, b] = range(d), before = snap(d), job = d.work = { title, p: 0, cancel: false };
    ui(); const dur = reduced() ? 120 : 900 + (b - a) / RES * 6;
    for (const t0 = performance.now(); ;) {
      await wait(40); if (!root.isConnected) return;
      job.p = Math.min(1, (performance.now() - t0) / dur); paintWork();
      if (job.cancel) { d.work = null; ui(); return; }
      if (job.p >= 1) break;
    }
    d.work = null;
    let loud = 0; for (let i = a; i < b; i++) loud = Math.max(loud, d.amp[i]);
    if (loud < .03) { ui(); return say(T('Rien d’audible à traiter.', 'Nothing audible to process.')); }
    d.undo.push(before); d.redo = []; steps.forEach(s => s(d, a, b)); d.edited = true; sfx.done(); ui();
  };
  const runShortcut = k => ({ normalize, isolate: () => process([STEP.clean, STEP.denoise('medium')], SHORTCUTS.isolate[2]), compress: () => process([STEP.compress('studio')], SHORTCUTS.compress[2]), voicePro: () => process(RECIPES()[0][3], SHORTCUTS.voicePro[2]), eqVoice: () => process([STEP.eq('voice')], SHORTCUTS.eqVoice[2]), loudness: () => process([STEP.loud(-16)], SHORTCUTS.loudness[2]) }[k]());

  /* ——— échantillons et timelines ——— */
  const importSample = s => {
    const d = D(), used = new Set(d.tint), t = [1, 2, 3, 4].find(x => !used.has(x)) || 4, amp = gen(s.kind, s.sec, 30 + t), tint = new Uint8Array(amp.length).fill(t);
    edit(d, () => { const p = d.phSet ? Math.round(d.ph) : N(d); insertAt(d, p, amp, tint); d.src[t] = s.n + '.wav'; d.sel = [p, p + amp.length]; d.ph = p; });
    sfx.pop();
  };
  const openDoc = (file, amp) => {
    const i = st.docs.findIndex(d => d.name === file.n && d.ext === file.f);
    if (i >= 0) st.cur = i; else { st.docs.push(mkDoc(file, amp)); st.cur = st.docs.length - 1; }
    stop(); layout(); ui();
  };
  const closeDoc = i => { stop(); st.docs.splice(i, 1); if (!st.docs.length) return wm.close(ID); st.cur = Math.min(st.cur, st.docs.length - 1); layout(); ui(); };

  /* ——— vue : zoom et défilement ——— */
  const vw = () => wvC.clientWidth || 800;
  const maxFPP = d => N(d) / Math.max(1, vw()), minFPP = .02;
  const clampScroll = d => { d.scroll = Math.max(0, Math.min(d.scroll, N(d) - vw() * d.fpp)); };
  const refit = d => { if (d.fit || d.fpp > maxFPP(d)) { d.fpp = maxFPP(d); d.fit = true; } clampScroll(d); };
  const zoomLevel = d => Math.log(d.fpp / maxFPP(d)) / Math.log(minFPP / maxFPP(d));
  const zoomAt = (d, fpp, x) => { const f = d.scroll + x * d.fpp; d.fpp = Math.max(minFPP, Math.min(maxFPP(d), fpp)); d.fit = d.fpp >= maxFPP(d) * .999; d.scroll = f - x * d.fpp; clampScroll(d); paint(); paintTr(); };
  const setZoom = l => { const d = D(), x0 = (d.ph - d.scroll) / d.fpp, x = x0 >= 0 && x0 <= vw() ? x0 : vw() / 2; zoomAt(d, maxFPP(d) * Math.pow(minFPP / maxFPP(d), l), x); };
  const fitAll = () => { const d = D(); d.fit = true; d.fpp = maxFPP(d); d.scroll = 0; paint(); paintTr(); };
  const frameAt = (d, x) => Math.max(0, Math.min(N(d), d.scroll + x * d.fpp));
  const xOf = (d, f) => (f - d.scroll) / d.fpp;

  /* ——— dessin ——— */
  const fit2 = c => { const r = devicePixelRatio || 1, w = c.clientWidth, hh = c.clientHeight; if (c.width !== Math.round(w * r) || c.height !== Math.round(hh * r)) { c.width = Math.round(w * r); c.height = Math.round(hh * r); } const g = c.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); return [g, w, hh]; };
  const colData = (d, n, start, per) => {
    const amps = new Float32Array(n), tints = new Uint8Array(n), L = N(d);
    for (let i = 0; i < n; i++) {
      const s = start + i * per; if (s >= L || s < 0) { amps[i] = -1; continue; }
      const i0 = Math.floor(s);
      if (per >= 1) { let m = 0; const e = Math.min(L, Math.floor(s + per)); for (let k = i0; k < Math.max(e, i0 + 1); k++) m = Math.max(m, d.amp[k]); amps[i] = m; }
      else { const fr = s - i0, v = d.amp[i0] * (1 - fr) + (d.amp[Math.min(L - 1, i0 + 1)] || 0) * fr; amps[i] = v * (.55 + .45 * Math.abs(Math.sin(s * 9.1))); }
      tints[i] = d.tint[i0];
    }
    return [amps, tints];
  };
  const rr = (g, x, y, w, hh, r) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, hh, Math.min(r, hh / 2)) : g.rect(x, y, w, hh); g.fill(); };
  const paintWave = () => {
    const d = D(); if (!d || st.rec) return; const [g, w, hh] = fit2(wvC), p = pal(), rulerH = 22, area = hh - rulerH, mid = rulerH + area / 2;
    g.fillStyle = p.bg; g.fillRect(0, 0, w, hh);
    g.fillStyle = p.muted + '40'; g.fillRect(0, mid, w, 1);
    const pitch = 5, n = Math.ceil(w / pitch) + 1, [amps, tints] = colData(d, n, d.scroll, d.fpp * pitch), maxH = area * .94;
    for (let i = 0; i < n; i++) { if (amps[i] < 0) continue; const bh = Math.max(2, Math.min(1, amps[i]) * maxH); g.fillStyle = p.tints[tints[i]] || p.wave; rr(g, i * pitch, mid - bh / 2, 3, bh, 1.5); }
    if (d.sel) {
      const x0 = Math.max(0, xOf(d, d.sel[0])), x1 = Math.min(w, xOf(d, d.sel[1]));
      if (x1 > x0) { g.globalAlpha = .26; g.fillStyle = p.acc; g.fillRect(x0, rulerH, x1 - x0, area); g.globalAlpha = 1; if (xOf(d, d.sel[0]) >= 0) g.fillRect(x0, rulerH, 2, area); if (xOf(d, d.sel[1]) <= w) g.fillRect(x1 - 2, rulerH, 2, area); }
    }
    g.font = '600 10px -apple-system,system-ui,sans-serif';
    for (const m of d.markers) { const x = xOf(d, m.f); if (x < 0 || x > w) continue; g.fillStyle = p.muted + '99'; g.fillRect(x, rulerH, 1, area); g.fillStyle = p.muted; g.fillText(m.n, x + 4, rulerH + 13); }
    // règle
    const spp = d.fpp / RES, steps = [.01, .02, .05, .1, .2, .5, 1, 2, 5, 10, 15, 30, 60, 120, 300], step = steps.find(s => s / spp >= 90) || 600, t0 = d.scroll / RES;
    g.font = '10px ui-monospace,SFMono-Regular,Menlo,monospace'; g.fillStyle = p.muted; g.strokeStyle = p.muted + '80';
    for (let t = Math.floor(t0 / step) * step; ; t += step) { const x = (t - t0) / spp; if (x > w) break; if (x >= 0) { g.fillRect(Math.round(x), rulerH - 6, 1, 6); g.fillText(rulerLabel(t, step), x + 4, 13); } }
    const px = xOf(d, d.ph);
    if (px >= 0 && px <= w) { g.fillStyle = p.head; g.fillRect(px - 1, 0, 2, hh); g.beginPath(); g.moveTo(px - 5, 0); g.lineTo(px + 5, 0); g.lineTo(px, 7); g.fill(); }
  };
  const paintOv = () => {
    const d = D(); if (!d || st.rec) return; const [g, w, hh] = fit2(ovC), p = pal(), L = Math.max(1, N(d));
    g.fillStyle = p.bg; g.fillRect(0, 0, w, hh);
    const pitch = 3, n = Math.floor(w / pitch) + 1, [amps, tints] = colData(d, n, 0, L / w * pitch), mid = hh / 2, maxH = hh - 12;
    g.globalAlpha = .85; for (let i = 0; i < n; i++) { if (amps[i] < 0) continue; const bh = Math.max(2, Math.min(1, amps[i]) * maxH); g.fillStyle = p.tints[tints[i]] || p.wave; rr(g, i * pitch, mid - bh / 2, 2, bh, 1); } g.globalAlpha = 1;
    const x = f => f / L * w;
    if (d.sel) { g.globalAlpha = .3; g.fillStyle = p.acc; g.fillRect(x(d.sel[0]), 0, Math.max(2, x(d.sel[1]) - x(d.sel[0])), hh); g.globalAlpha = 1; }
    const vx0 = x(d.scroll), vx1 = Math.min(w, x(d.scroll + vw() * d.fpp)), vr = [vx0 + 1, 1, Math.max(8, vx1 - vx0 - 2), hh - 2];
    g.globalAlpha = .12; g.fillStyle = p.acc; g.fillRect(...vr); g.globalAlpha = 1; g.strokeStyle = p.acc; g.lineWidth = 2; g.beginPath(); g.roundRect ? g.roundRect(...vr, 3) : g.rect(...vr); g.stroke();
    g.fillStyle = p.head; g.fillRect(x(d.ph) - 1, 0, 2, hh);
  };
  const paint = () => { paintWave(); paintOv(); };

  /* ——— menus (contextuel, format) ——— */
  let menuEl = null;
  const closeMenu = () => { if (menuEl) { menuEl.remove(); menuEl = null; } };
  const popMenu = (x, y, items, host = root) => {
    closeMenu(); const hr = host.getBoundingClientRect(), sc = hr.width / host.offsetWidth || 1;
    menuEl = h('div', { class: 'ms-menu', role: 'menu' }, ...items.map(it => it.sep ? h('hr') : it.head ? h('div', { class: 'hd' }, it.head) : h('button', { role: 'menuitem', disabled: it.dis, class: it.check ? 'ck' : '', onclick: () => { closeMenu(); sfx.click(); it.fn && it.fn(); } }, it.ico || null, h('span', {}, it.l), it.k ? h('em', {}, it.k) : null)));
    host.append(menuEl);
    const lx = (x - hr.left) / sc, ly = (y - hr.top) / sc;
    menuEl.style.left = Math.min(lx, host.offsetWidth - menuEl.offsetWidth - 6) + 'px'; menuEl.style.top = Math.min(ly, host.offsetHeight - menuEl.offsetHeight - 6) + 'px';
  };
  const away = e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); if (fxEl && !fxEl.contains(e.target) && !e.target.closest('.ms-fxbtn')) closeFx(); };
  addEventListener('pointerdown', away, true);

  /* ——— barre de titre, onglets, outils ——— */
  const btn = (k, title, en, fn, cls = '') => h('button', { class: 'ms-ic ' + cls, title, 'aria-label': title, disabled: !en, onclick: () => { fn(); root.focus({ preventScroll: true }); } }, ico(k));
  const grp = (...k) => h('div', { class: 'ms-grp' }, ...k);
  const chLabel = c => (c === 1 ? 'mono' : c === 2 ? T('stéréo', 'stereo') : c + T(' canaux', ' channels'));
  const drawTitle = () => {
    const d = D(); tb.innerHTML = '';
    const fmtBtn = h('button', { class: 'ms-fmt', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); popMenu(r.left, r.bottom + 4, [{ head: T('Convertir / exporter', 'Convert / export') }, ...FORMATS.map(([f, n]) => ({ l: n, check: st.fmt === f, fn: () => { st.fmt = f; ui(); } })), ...(lossless(st.fmt) ? [] : [{ sep: 1 }, { head: T('Qualité', 'Quality') }, ...[128, 192, 256, 320].map(k => ({ l: k + ' kb/s', check: st.kbps === k, fn: () => { st.kbps = k; ui(); } }))])]); } }, fmtName(st.fmt) + (lossless(st.fmt) ? '' : ' · ' + st.kbps));
    tb.append(wm.lights(mainW), h('div', { class: 'ms-ttl' }, h('b', {}, d.name + '.' + d.ext), h('small', {}, `${String(d.khz).replace('.', T(',', '.'))} kHz · ${d.bits} bits · ${chLabel(d.ch)} · ${ts(N(d), false)}`)),
      h('div', { class: 'ms-exp', 'data-nodrag': '' }, fmtBtn, h('button', { class: 'ms-btn pri', onclick: () => exportDoc(d) }, d.sel ? T('Exporter la sélection', 'Export selection') : T('Exporter le fichier', 'Export file'))));
  };
  const drawTabs = () => {
    tabs.innerHTML = ''; tabs.hidden = st.docs.length < 2; if (tabs.hidden) return;
    tabs.append(h('div', { class: 'ms-tablist' }, ...st.docs.map((d, i) => h('div', { class: 'ms-tab' + (i === st.cur ? ' on' : ''), onclick: () => { if (st.cur !== i) { stop(); st.cur = i; layout(); ui(); sfx.tick(); } } }, d.work ? h('i', { class: 'spin' }) : null, h('span', {}, d.name + '.' + d.ext), h('button', { 'aria-label': T('Fermer', 'Close'), title: T('Fermer', 'Close'), onclick: e => { e.stopPropagation(); closeDoc(i); } }, ico('x'))))),
      h('button', { class: 'ms-btn', onclick: () => st.docs.forEach(d => exportDoc(d, true)) }, T('Tout exporter', 'Export all')));
  };
  const workBox = h('span', { class: 'ms-work' });
  const paintWork = () => { const d = D(), w = d && d.work; if (!w) return; const b = workBox.querySelector('i'); const t = workBox.querySelector('b'); if (b) b.style.width = Math.round(w.p * 100) + '%'; if (t) t.textContent = `${w.title} — ${Math.round(w.p * 100)} %`; };
  const drawTools = () => {
    const d = D(), sel = !!d.sel, busy = !!d.work; tools.innerHTML = '';
    const fxBtn = h('button', { class: 'ms-txt ms-fxbtn', disabled: busy, onclick: e => fxEl ? closeFx() : openFx(e.currentTarget) }, ico('fx'), T('Effets', 'Effects'));
    const scs = st.slots.map(k => h('button', { class: 'ms-txt', disabled: busy, title: SHORTCUTS[k][2], onclick: () => runShortcut(k) }, ico(SHORTCUTS[k][0]), SHORTCUTS[k][1]));
    const addBtn = h('button', { class: 'ms-ic', title: T('Importer un ou plusieurs échantillons (à la tête de lecture, sinon à la suite)', 'Import samples (at the playhead, otherwise at the end)'), onclick: e => { const r = e.currentTarget.getBoundingClientRect(); popMenu(r.left, r.bottom + 4, [{ head: T('Insérer dans cette timeline…', 'Insert into this timeline…') }, ...SAMPLES().map(s => ({ l: '    ' + s.n + '.wav', fn: () => importSample(s) })), { sep: 1 }, { head: T('Ouvrir dans de nouvelles timelines…', 'Open in new timelines…') }, ...st.files.filter(f => !st.docs.some(x => x.name === f.n && x.ext === f.f)).slice(0, 4).map(f => ({ l: '    ' + f.n + '.' + f.f, fn: () => openDoc(f) }))]); } }, ico('addtl'));
    workBox.innerHTML = '';
    if (busy) workBox.append(h('b', {}, ''), h('span', { class: 'ms-pg' }, h('i')), h('button', { class: 'ms-btn', onclick: () => { d.work.cancel = true; } }, T('Annuler', 'Cancel')));
    tools.append(grp(btn('undo', T('Annuler', 'Undo') + ' ⌘Z', d.undo.length && !busy, undo), btn('redo', T('Rétablir', 'Redo') + ' ⇧⌘Z', d.redo.length && !busy, redo)),
      grp(btn('cut', T('Couper', 'Cut') + ' ⌘X', sel && !busy, cut), btn('copy', T('Copier', 'Copy') + ' ⌘C', sel, copy), btn('paste', T('Coller', 'Paste') + ' ⌘V', !!st.clip && !busy, paste), btn('trash', T('Supprimer', 'Delete') + ' ⌫', sel && !busy, del), btn('crop', T('Garder la sélection', 'Keep selection'), sel && !busy, keep)),
      grp(fxBtn, ...scs), grp(btn('flag', T('Ajouter un repère', 'Add marker') + ' (M)', !busy, addMarker), addBtn, btn('fit', T('Tout afficher', 'Show all'), true, fitAll)),
      h('span', { class: 'tk-sp' }), busy ? workBox : h('span', { class: 'ms-seltxt' }, sel ? `${ts(d.sel[0])} → ${ts(d.sel[1])}  ·  ${ts(d.sel[1] - d.sel[0], false)}` : ''),
      grp(btn('side', T('Inspecteur', 'Inspector'), true, () => { st.insp = !st.insp; layout(); ui(); }, st.insp ? 'on' : '')));
    if (busy) paintWork();
  };

  /* ——— effets (carte en popover) ——— */
  let fxEl = null;
  const closeFx = () => { if (fxEl) { fxEl.remove(); fxEl = null; } };
  const openFx = anchor => {
    closeFx(); const d = D(), rr0 = root.getBoundingClientRect(), r = anchor.getBoundingClientRect(), sc = rr0.width / root.offsetWidth || 1;
    const chip = (key, val, label) => h('button', { class: 'ms-chip' + (st.fx[key] === val ? ' on' : ''), onclick: () => { st.fx[key] = val; sfx.tick(); openFx(anchor); } }, label);
    const row = (t, desc, apply, ...chips) => h('div', { class: 'ms-fxr' }, h('div', { class: 'l' }, h('b', {}, t), h('span', { class: 'tk-sp' }), ...chips, h('button', { class: 'ms-btn pri', onclick: () => { closeFx(); apply(); } }, T('Appliquer', 'Apply'))), h('p', {}, desc));
    const L = { light: T('Léger', 'Light'), medium: T('Moyen', 'Medium'), strong: T('Fort', 'Strong'), voice: T('Voix', 'Voice'), warm: T('Chaleur', 'Warm'), bright: T('Brillance', 'Bright'), soft: T('Doux', 'Soft'), studio: 'Studio', radio: 'Radio' };
    fxEl = h('div', { class: 'ms-fx', role: 'dialog' },
      h('div', { class: 'scope' }, d.sel ? T('Appliqué à la sélection', 'Applied to the selection') : T('Appliqué à tout le fichier', 'Applied to the whole file')),
      h('h5', {}, T('Recettes', 'Recipes')), ...RECIPES().map(([, t, desc, steps]) => row(t, desc, () => process(steps, t))),
      h('h5', {}, T('Filtres', 'Filters')),
      row(T('Réduire le bruit', 'Reduce noise'), T('Mesure le bruit de fond (souffle, ventilateur) et l’atténue sans abîmer la voix.', 'Measures the background noise (hiss, fan) and lowers it without harming the voice.'), () => process([STEP.denoise(st.fx.str)], T('Réduire le bruit', 'Reduce noise')), ...['light', 'medium', 'strong'].map(k => chip('str', k, L[k]))),
      row(T('Nettoyer', 'Clean up'), T('Coupe les grondements graves et supprime le ronflement secteur 50/60 Hz.', 'Cuts low rumble and removes 50/60 Hz mains hum.'), () => process([STEP.clean], T('Nettoyer', 'Clean up'))),
      row(T('Égaliser la voix', 'Voice EQ'), T('Voix : claire et présente · Chaleur : ronde · Brillance : aérienne.', 'Voice: clear and present · Warm: round · Bright: airy.'), () => process([STEP.eq(st.fx.eq)], T('Égaliser la voix', 'Voice EQ')), ...['voice', 'warm', 'bright'].map(k => chip('eq', k, L[k]))),
      row(T('Compresser', 'Compress'), T('Resserre la dynamique pour une voix régulière ; le niveau perçu est conservé.', 'Tightens dynamics for an even voice; perceived level is kept.'), () => process([STEP.compress(st.fx.comp)], T('Compresser', 'Compress')), ...['soft', 'studio', 'radio'].map(k => chip('comp', k, L[k]))),
      row(T('Régler la sonie', 'Set loudness'), T('Volume perçu cible en LUFS : −23 télé, −16 podcast, −14 streaming. Limiteur à −1 dB.', 'Target perceived volume in LUFS: −23 TV, −16 podcast, −14 streaming. −1 dB limiter.'), () => process([STEP.loud(st.fx.lufs)], T('Régler la sonie', 'Set loudness')), ...[-23, -16, -14].map(k => chip('lufs', k, '−' + -k))),
      h('h5', {}, T('Niveaux', 'Levels')),
      h('div', { class: 'ms-lv' }, ...[[T('Normaliser', 'Normalize'), normalize], [T('Fondu ↗', 'Fade in'), () => fade(true)], [T('Fondu ↘', 'Fade out'), () => fade(false)], ['+3 dB', () => gain(3)], ['−3 dB', () => gain(-3)]].map(([l, f]) => h('button', { class: 'ms-btn', onclick: () => { closeFx(); f(); } }, l))));
    root.append(fxEl);
    fxEl.style.left = Math.max(12, (r.left - rr0.left) / sc + r.width / 2 / sc - 260) + 'px'; fxEl.style.top = (r.bottom - rr0.top) / sc + 8 + 'px';
  };

  /* ——— transport ——— */
  const tPos = h('b', { class: 'ms-time' }), tRem = h('b', { class: 'ms-time rem' }), playB = h('button', { class: 'ms-play', 'aria-label': T('Lecture / Pause', 'Play / Pause'), title: T('Lecture / Pause', 'Play / Pause') + ' (␣)', onclick: () => toggle() });
  const zoomR = h('input', { type: 'range', min: 0, max: 1, step: .001, value: 0, 'aria-label': 'zoom', oninput: e => setZoom(+e.target.value) });
  const volR = h('input', { type: 'range', min: 0, max: 1, step: .01, value: st.vol, 'aria-label': T('Volume', 'Volume'), oninput: e => { st.vol = +e.target.value; if (master) master.gain.value = st.vol * sfx.vol * .55; } });
  const recB = h('button', { class: 'ms-ic ms-recb', title: T('Enregistrer au micro', 'Record from the microphone') + '  ⌘R', onclick: () => toggleRec() });
  transport.append(h('div', { class: 'ms-zm' }, ico('zminus'), zoomR, ico('zplus')),
    h('div', { class: 'ms-pc' }, recB, tPos, btn('start', T('Aller au début', 'Go to start'), true, () => seek(0)), playB, btn('stop', 'Stop', true, () => stopTo()), btn('end', T('Aller à la fin', 'Go to end'), true, () => seek(N(D()))), tRem),
    h('div', { class: 'ms-vol' }, ico('spk'), volR, ico('spk3')));
  const paintTr = () => {
    const d = D(); if (!d) return; tPos.textContent = ts(d.ph); tRem.textContent = '−' + ts(Math.max(0, (d.sel ? d.sel[1] : N(d)) - d.ph));
    playB.innerHTML = ''; playB.append(ico(st.playing ? 'pause' : 'play')); recB.innerHTML = ''; recB.append(ico(st.rec ? 'recstop' : 'rec'));
    if (document.activeElement !== zoomR) zoomR.value = String(Math.max(0, Math.min(1, zoomLevel(d) || 0)));
  };

  /* ——— lecture (son synthétisé) ——— */
  let raf = 0, last = 0, ac = null, master = null, lastBeat = -1;
  const CH = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]];
  const pluck = (f, g, dur = .7, type = 'triangle') => {
    if (!ac || !sfx.on) return; const o = ac.createOscillator(), e = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.value = f; e.gain.setValueAtTime(.0001, t); e.gain.exponentialRampToValueAtTime(Math.max(.0002, g), t + .008); e.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(e).connect(master); o.start(t); o.stop(t + dur + .05);
  };
  const sound = d => {
    if (!sfx.on) return; const i = Math.min(N(d) - 1, Math.floor(d.ph)), a = d.amp[i] || 0, tint = d.tint[i];
    const bt = Math.floor(d.ph / RES / (d.kind === 'music' && !tint ? .3125 : .18)); if (bt === lastBeat) return; lastBeat = bt; if (a < .05) return;
    if (tint) return pluck(700 + (bt % 5) * 140, a * .08, .12, 'sawtooth');
    if (d.kind !== 'music') return pluck(150 + (bt * 37 % 90), a * .14, .16, 'sine');
    const ch = CH[Math.floor(bt / 8) % 4]; pluck(ch[bt % 4] * (bt % 8 >= 4 ? 2 : 1), a * .2); if (bt % 4 === 0) pluck(ch[0] / 2, a * .22, 1, 'sine');
  };
  const loop = now => {
    const d = D(); if (!root.isConnected || !st.playing || !d) return;
    d.ph += (now - last) / 1000 * RES; last = now;
    const end = d.sel ? d.sel[1] : N(d);
    if (d.ph >= end) { d.ph = d.sel ? d.sel[0] : end; st.playing = false; paint(); paintTr(); return; }
    if (xOf(d, d.ph) > vw() - 4) { d.scroll = d.ph; clampScroll(d); }
    sound(d); paint(); paintTr(); raf = requestAnimationFrame(loop);
  };
  const play = () => {
    const d = D(); if (st.rec) return; if (d.sel && (d.ph < d.sel[0] || d.ph >= d.sel[1])) d.ph = d.sel[0]; if (d.ph >= N(d)) d.ph = 0;
    if (sfx.on) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); if (!master) { master = ac.createGain(); master.connect(ac.destination); } master.gain.value = st.vol * sfx.vol * .55; } catch { ac = null; } }
    st.playing = true; lastBeat = -1; last = performance.now(); raf = requestAnimationFrame(loop); paintTr();
  };
  const stop = () => { st.playing = false; cancelAnimationFrame(raf); paintTr(); };
  const toggle = () => (st.playing ? stop() : play());
  const stopTo = () => { const d = D(); stop(); d.ph = d.sel ? d.sel[0] : 0; paint(); paintTr(); };
  const seek = f => { const d = D(); d.ph = Math.max(0, Math.min(N(d), f)); d.phSet = true; if (xOf(d, d.ph) < 0 || xOf(d, d.ph) > vw()) { d.scroll = d.ph - vw() * d.fpp / 2; clampScroll(d); } paint(); paintTr(); };

  /* ——— souris sur la forme d'onde ——— */
  let drag = null;
  const lx = e => { const r = wvC.getBoundingClientRect(); return (e.clientX - r.left) * (wvC.clientWidth / r.width); };
  wvC.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; root.focus({ preventScroll: true }); const d = D(), f = frameAt(d, lx(e));
    if (e.detail === 2) { d.sel = [0, N(d)]; drag = null; ui(); return; }
    wvC.setPointerCapture(e.pointerId);
    if (e.shiftKey && d.sel) { const a = Math.abs(f - d.sel[0]) < Math.abs(f - d.sel[1]) ? d.sel[1] : d.sel[0]; drag = { a, moved: true }; d.sel = [Math.min(a, f), Math.max(a, f)]; paint(); }
    else drag = { a: f, moved: false, x: lx(e) };
  });
  wvC.addEventListener('pointermove', e => {
    if (!drag) { wvC.style.cursor = 'text'; return; } const d = D(), x = lx(e), f = frameAt(d, x);
    if (!drag.moved && Math.abs(x - drag.x) > 2) drag.moved = true;
    if (drag.moved) { if (x > vw() - 8) { d.scroll += d.fpp * 12; clampScroll(d); } if (x < 8) { d.scroll -= d.fpp * 12; clampScroll(d); } d.sel = [Math.min(drag.a, f), Math.max(drag.a, f)]; if (d.sel[1] - d.sel[0] < 1) d.sel = null; paint(); drawSelTxt(); }
  });
  wvC.addEventListener('pointerup', () => {
    if (!drag) return; const d = D(), g = drag; drag = null;
    if (!g.moved) { d.sel = null; seek(g.a); ui(); sfx.tick(); }
    else { if (d.sel && !st.playing) { d.ph = d.sel[0]; d.phSet = true; } ui(); }
  });
  wvC.addEventListener('wheel', e => {
    e.preventDefault(); const d = D(), x = lx(e);
    if (e.metaKey || e.ctrlKey || e.altKey) zoomAt(d, d.fpp * Math.exp(e.deltaY * .01), x);
    else { const dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; d.scroll += dl * d.fpp; clampScroll(d); paint(); }
  }, { passive: false });
  wvC.addEventListener('contextmenu', e => {
    e.preventDefault(); const d = D(), s = !!d.sel;
    popMenu(e.clientX, e.clientY, [...(s ? [{ l: T('Exporter la sélection…', 'Export selection…'), fn: () => exportDoc(d) }, { sep: 1 }] : []),
      { l: T('Couper', 'Cut'), dis: !s, fn: cut }, { l: T('Copier', 'Copy'), dis: !s, fn: copy }, { l: T('Coller', 'Paste'), dis: !st.clip, fn: paste }, { l: T('Supprimer', 'Delete'), dis: !s, fn: del }, { l: T('Garder la sélection', 'Keep selection'), dis: !s, fn: keep }, { sep: 1 },
      { l: T('Normaliser', 'Normalize'), fn: normalize }, { l: T('Fondu entrant', 'Fade in'), dis: !s, fn: () => fade(true) }, { l: T('Fondu sortant', 'Fade out'), dis: !s, fn: () => fade(false) }, { sep: 1 }, { l: T('Ajouter un repère', 'Add marker'), fn: addMarker }]);
  });
  const ovNav = e => { const d = D(), r = ovC.getBoundingClientRect(), f = (e.clientX - r.left) / r.width * N(d); d.scroll = f - vw() * d.fpp / 2; clampScroll(d); paint(); };
  ovC.addEventListener('pointerdown', e => { ovC.setPointerCapture(e.pointerId); ovNav(e); ovC.onpointermove = ovNav; });
  ovC.addEventListener('pointerup', () => { ovC.onpointermove = null; });
  const drawSelTxt = () => { const d = D(), el = tools.querySelector('.ms-seltxt'); if (el) el.textContent = d.sel ? `${ts(d.sel[0])} → ${ts(d.sel[1])}  ·  ${ts(d.sel[1] - d.sel[0], false)}` : ''; };

  /* ——— clavier ——— */
  root.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea') || st.rec && e.key !== 'r') return;
    const d = D(), k = e.key.toLowerCase(), cmd = e.metaKey || e.ctrlKey; let ok = true;
    if (cmd && k === 'z') e.shiftKey ? redo() : undo();
    else if (cmd && k === 'x') cut(); else if (cmd && k === 'c') copy(); else if (cmd && k === 'v') paste();
    else if (cmd && k === 'a') { d.sel = [0, N(d)]; ui(); } else if (cmd && k === 'r') toggleRec();
    else if (cmd) ok = false;
    else if (e.key === ' ') toggle(); else if (k === 'm') addMarker();
    else if (e.key === 'Backspace' || e.key === 'Delete') del();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { const s = e.altKey ? 1 : Math.max(1, d.fpp) * (e.shiftKey ? 10 : 1); seek(d.ph + (e.key === 'ArrowLeft' ? -s : s)); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') gain((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 3 : 1));
    else if (e.key === 'Escape') { closeMenu(); closeFx(); } else ok = false;
    if (ok) { e.preventDefault(); e.stopPropagation(); }
  });

  /* ——— enregistrement (simulé : aucun micro n'est utilisé) ——— */
  let recT = 0;
  const toggleRec = () => {
    if (st.rec) return endRec(true);
    stop(); st.rec = { t0: performance.now(), lv: [-60, -60], pk: [-99, -99] }; sfx.click(); layout(); drawRec();
    const tick = () => { if (!st.rec || !root.isConnected) return; const r = st.rec; r.lv = r.lv.map((v, i) => { const tg = -30 + Math.random() * 24 - (Math.random() < .2 ? 25 : 0); return v + (tg - v) * .35; }); r.pk = r.pk.map((p, i) => Math.max(p - .25, r.lv[i])); drawRec(); recT = setTimeout(tick, 70); };
    tick();
  };
  const endRec = keepIt => {
    const r = st.rec; if (!r) return; clearTimeout(recT); st.rec = null; const sec = Math.max(3, (performance.now() - r.t0) / 1000);
    if (keepIt) { const n = T('Enregistrement', 'Recording') + ' ' + (st.docs.filter(d => d.kind === 'rec').length + 1), f = { n, f: 'wav', sec, kind: 'voice', sd: 40 + st.docs.length, khz: 48, bits: 24, ch: 1 }; f.mb = 48000 * 3 * sec / 1048576; const doc = mkDoc(f); doc.kind = 'rec'; st.docs.push(doc); st.cur = st.docs.length - 1; sfx.done(); }
    layout(); ui();
  };
  const meter = (lv, pk) => { const x = v => Math.min(1, Math.max(0, (v + 60) / 60)) * 100; return h('div', { class: 'ms-meter' }, h('i', { style: { clipPath: `inset(0 ${100 - x(lv)}% 0 0)` } }), h('b', { style: { left: `calc(${x(pk)}% - 2px)` } })); };
  const drawRec = () => {
    const r = st.rec; if (!r) return; recBox.innerHTML = ''; const sec = (performance.now() - r.t0) / 1000;
    recBox.append(h('div', { class: 'ms-rech' }, h('i'), T('Enregistrement en cours', 'Recording')), h('div', { class: 'ms-recn' }, ts(sec * RES, false)),
      h('div', { class: 'ms-meters' }, ...r.lv.map((v, i) => h('div', { class: 'ms-mrow' }, h('span', {}, i ? 'R' : 'L'), meter(v, r.pk[i]), h('em', {}, r.pk[i] > -99 ? Math.round(r.pk[i]) + ' dB' : '−∞')))),
      h('div', { class: 'ms-recb2' }, h('button', { class: 'ms-btn pri', onclick: () => endRec(true) }, T('Arrêter et garder', 'Stop and keep')), h('button', { class: 'ms-btn', onclick: () => endRec(false) }, T('Abandonner', 'Discard'))));
    paintTr();
  };

  /* ——— inspecteur ——— */
  const card = (title, ...k) => h('div', { class: 'ms-sec' }, h('h6', {}, title), h('div', { class: 'ms-card ms-cb' }, ...k));
  const kv = (k, v) => h('div', { class: 'ms-kv' }, h('span', {}, k), h('b', {}, v));
  const drawInsp = () => {
    const d = D(); insp.innerHTML = ''; if (!st.insp) return;
    const tints = [...new Set(d.tint)].sort();
    const mk = d.markers.length ? h('div', { class: 'ms-mk' }, ...d.markers.map(m => h('div', { class: 'ms-mkr', onclick: () => { d.sel = null; seek(m.f); ui(); }, oncontextmenu: e => { e.preventDefault(); popMenu(e.clientX, e.clientY, [{ l: T('Supprimer', 'Delete'), fn: () => edit(d, () => { d.markers = d.markers.filter(x => x !== m); }) }]); } }, h('span', {}, m.n), h('em', {}, ts(m.f, false)))))
      : h('p', { class: 'ms-empty' }, h('span', {}, T('Aucun repère.', 'No markers.')), h('span', {}, T('Touche M pour en ajouter un.', 'Press M to add one.')));
    const fmk = h('div', { class: 'ms-sec grow' }, h('h6', {}, T('Repères', 'Markers')), h('div', { class: 'ms-card ms-cb grow' }, mk, h('button', { class: 'ms-btn', onclick: silences }, T('Repères aux silences', 'Markers at silences'))));
    insp.append(fmk);
    if (tints.length > 1) insp.append(card(T('Échantillons', 'Samples'), ...tints.map(t => h('div', { class: 'ms-smp' }, h('i', { style: { background: pal().tints[t] } }), h('span', {}, t ? d.src[t] || '—' : d.name)))));
    insp.append(card(T('Fichier', 'File'), kv('Format', d.ext.toUpperCase()), kv(T('Fréquence', 'Sample rate'), String(d.khz).replace('.', T(',', '.')) + ' kHz'), kv(T('Canaux', 'Channels'), String(d.ch)), kv(T('Profondeur', 'Bit depth'), d.bits + ' bits'), kv(T('Poids', 'Size'), mb(d.size)), kv('Segments', String(d.segs))));
  };

  /* ——— mise en page et rendu ——— */
  const layout = () => {
    root.classList.toggle('sand', isSand());
    const rec = !!st.rec; ovBox.hidden = rec; wvBox.hidden = rec; recBox.hidden = !rec; insp.hidden = !st.insp;
    requestAnimationFrame(() => { st.docs.forEach(refit); paint(); paintTr(); });
  };
  const ui = () => { if (!st.docs.length) return; drawTitle(); drawTabs(); drawTools(); drawInsp(); paint(); paintTr(); };
  const say = msg => { toast({ icon: icon(app.id), title: app.id, body: msg }); };

  /* ——— export (fenêtre de progression flottante) ——— */
  const exportDoc = (d, whole = false) => {
    const sel = d.sel && !whole, f = st.fmt, sec = (sel ? d.sel[1] - d.sel[0] : N(d)) / RES;
    const name = d.name + (sel ? ' ' + T('sélection', 'selection') : d.edited ? ' ' + T('édité', 'edited') : '');
    if (!sel && !d.edited && extOf(f) === d.ext && f !== 'alac') return say(T('Le fichier est déjà dans ce format.', 'The file is already in this format.'));
    addJobs([{ n: name, f, sec, inMB: d.size * (sel ? sec * RES / N(d) : 1), src: null }]);
  };
  const addJobs = list => {
    if (!wm.wins.has(PID)) st.jobs = st.jobs.filter(j => j.s === 'run' || j.s === 'wait');
    list.forEach(j => st.jobs.push({ ...j, p: 0, s: 'wait', id: Math.random() }));
    showProgress(); pump();
  };
  let pumping = false;
  const pump = async () => {
    if (pumping) return; pumping = true;
    while (true) {
      const run = st.jobs.filter(j => j.s === 'run'), next = st.jobs.find(j => j.s === 'wait');
      if (!next && !run.length) break;
      if (next && run.length < 2) {
        next.s = 'run'; const j = next;
        (async () => {
          if (j.skip) { await wait(250); j.s = 'skip'; j.p = 1; drawProgress(); return; }
          const dur = reduced() ? 200 : 900 + j.sec * 14;
          for (const t0 = performance.now(); j.p < 1;) { await wait(60); if (j.s === 'cancel') return; j.p = Math.min(1, (performance.now() - t0) / dur); drawProgress(); if (j.gauge) j.gauge(j.p); }
          j.s = 'done'; j.out = outMB(j.f, j.sec, st.quality); drawProgress(); addOutput(j); j.onDone && j.onDone();
        })();
        continue;
      }
      await wait(80);
    }
    pumping = false; drawProgress();
    const vis = st.jobs.some(j => !j.quiet);
    if (vis) { sfx.done(); setTimeout(() => { if (!st.jobs.some(j => j.s === 'run' || j.s === 'wait')) wm.close(PID); }, 4000); }
  };
  const progBody = h('div', { class: 'ms msp' });
  const showProgress = () => {
    if (!st.jobs.some(j => !j.quiet)) return;
    if (!wm.wins.has(PID)) wm.open({ id: PID, appId: app.id, title: app.id, w: 560, h: 150, x: S.W - 560 - 24, y: 54, bare: true, resizable: false, cls: 'tkwin msw-p', build: () => progBody });
    drawProgress();
  };
  const drawProgress = () => {
    const vis = st.jobs.filter(j => !j.quiet), done = vis.filter(j => j.s === 'done' || j.s === 'skip').length, running = vis.some(j => j.s === 'run' || j.s === 'wait');
    progBody.classList.toggle('sand', isSand()); progBody.innerHTML = '';
    const stat = j => j.s === 'wait' ? T('En attente', 'Waiting') : j.s === 'run' ? `${T('En cours', 'Converting')} · ${Math.round(j.p * 100)} %` : j.s === 'done' ? T('Terminé', 'Done') : j.s === 'skip' ? T('Déjà dans ce format', 'Already in this format') : T('Annulé', 'Cancelled');
    progBody.append(h('div', { class: 'msp-h', 'data-drag': '' }, h('b', { html: brand(app.id, '#14b8a6') }), h('span', { class: 'tk-sp' }), h('span', {}, T(`${done} sur ${vis.length} terminés`, `${done} of ${vis.length} done`))),
      h('div', { class: 'msp-l' }, ...vis.map(j => h('div', { class: 'msp-r ' + j.s }, h('i', { class: 'fb' }, j.f.toUpperCase()), h('div', { class: 'nm' }, h('b', {}, j.n + '.' + extOf(j.f)), h('span', { class: 'ms-pg' }, h('i', { style: { width: Math.round(j.p * 100) + '%' } }))), h('div', { class: 'st' }, h('b', {}, stat(j)), j.s === 'done' ? h('span', {}, mb(j.inMB) + ' → ' + mb(j.out)) : null)))),
      h('div', { class: 'msp-f' }, h('span', { class: 'tk-sp' }), running ? h('button', { class: 'ms-btn', onclick: () => { st.jobs.forEach(j => { if (j.s === 'wait' || j.s === 'run') j.s = 'cancel'; }); drawProgress(); } }, T('Annuler', 'Cancel')) : null,
        h('button', { class: 'ms-btn pri', disabled: !st.jobs.some(j => j.s === 'done'), onclick: () => { openFinder(); st.fsel = new Set(st.jobs.filter(j => j.s === 'done').map(j => j.outName)); drawFinder(); } }, T('Afficher dans le Finder', 'Show in Finder'))));
    const w = wm.wins.get(PID); if (w) { const hh = 118 + Math.min(5, vis.length) * 58; w.h = hh; w.el.style.height = hh + 'px'; }
  };
  const addOutput = j => {
    const n = j.n, f = extOf(j.f); let name = n, k = 2; while (st.files.some(x => x.n === name && x.f === f)) name = `${n} ${k++}`;
    j.outName = name + '.' + f;
    st.files.push({ n: name, f, sec: j.sec, kind: j.kind || 'music', sd: 70 + st.files.length, khz: 44.1, bits: 16, ch: 2, mb: j.out, fresh: true });
    drawFinder();
  };

  /* ——— Finder simulé : clic droit sur des fichiers audio ——— */
  const fList = h('div', { class: 'msf-l', role: 'listbox' }), fBody = h('div', { class: 'msf' });
  let anchorI = -1;
  const fkey = x => x.n + '.' + x.f;
  const convert = (fmt, files) => {
    if (files.length === 1) {
      const x = files[0];
      if (extOf(fmt) === x.f && fmt !== 'alac') return say(T('Déjà dans ce format', 'Already in this format') + ' — ' + fkey(x));
      x.busy = 0; drawFinder();
      const j = { n: x.n, f: fmt, sec: x.sec, inMB: x.mb, kind: x.kind, quiet: true, onDone: () => { x.busy = null; drawFinder(); }, gauge: p => { x.busy = p; const g = fList.querySelector(`[data-k="${CSS.escape(fkey(x))}"] .g`); if (g) g.style.setProperty('--p', p * 360 + 'deg'); } };
      st.jobs.push({ ...j, p: 0, s: 'wait', id: Math.random() }); pump();
    } else addJobs(files.map(x => ({ n: x.n, f: fmt, sec: x.sec, inMB: x.mb, kind: x.kind, skip: extOf(fmt) === x.f && fmt !== 'alac' })));
  };
  const finderMenu = (e, files) => {
    const host = fBody, items = [{ l: T('Ouvrir', 'Open'), dis: 1 }, { l: T('Ouvrir avec', 'Open With'), k: '›', dis: 1 }, { sep: 1 }, { l: T('Lire les informations', 'Get Info'), dis: 1 }, { l: T('Renommer', 'Rename'), dis: 1 }, { l: T('Dupliquer', 'Duplicate'), dis: 1 }, { sep: 1 }];
    st.menu.forEach(f => items.push(f === 'edit' ? { l: T('Éditer avec mSOUND', 'Edit with mSOUND'), ico: ico('wave', 'blue'), fn: () => { files.forEach(x => openDoc(x)); wm.focus(ID); } } : { l: T(`Convertir en ${fmtName(f)} — mSOUND`, `Convert to ${fmtName(f)} — mSOUND`), ico: ico('wave', 'blue'), fn: () => convert(f, files) }));
    items.push({ sep: 1 }, { l: T('Actions rapides', 'Quick Actions'), k: '›', dis: 1 });
    popMenu(e.clientX, e.clientY, items, host); menuEl.classList.add('finder');
  };
  const drawFinder = () => {
    fList.innerHTML = '';
    fList.append(h('div', { class: 'msf-hd' }, h('span', {}, T('Nom', 'Name')), h('span', {}, T('Taille', 'Size')), h('span', {}, T('Type', 'Kind'))));
    st.files.forEach((x, i) => {
      const k = fkey(x), on = st.fsel.has(k);
      fList.append(h('div', { class: 'msf-r' + (on ? ' on' : '') + (x.fresh ? ' fresh' : ''), 'data-k': k, role: 'option', 'aria-selected': String(on),
        onpointerdown: e => { if (e.button === 2 && on) return; if (e.metaKey || e.ctrlKey) { on ? st.fsel.delete(k) : st.fsel.add(k); anchorI = i; } else if (e.shiftKey && anchorI >= 0) { st.fsel = new Set(st.files.slice(Math.min(anchorI, i), Math.max(anchorI, i) + 1).map(fkey)); } else { st.fsel = new Set([k]); anchorI = i; } x.fresh = false; drawFinder(); },
        ondblclick: () => { openDoc(x); wm.focus(ID); },
        oncontextmenu: e => { e.preventDefault(); if (!st.fsel.has(k)) { st.fsel = new Set([k]); drawFinder(); } finderMenu(e, st.files.filter(y => st.fsel.has(fkey(y)))); } },
        h('span', { class: 'nm' }, h('span', { class: 'fi' + (x.busy != null ? ' busy' : '') }, ico('note'), h('i', { class: 'g', style: { '--p': (x.busy || 0) * 360 + 'deg' } })), h('b', {}, k)), h('span', {}, mb(x.mb)), h('span', {}, T(KIND[x.f][0], KIND[x.f][1]))));
    });
  };
  fBody.append(fList, h('div', { class: 'msf-f' }, h('span', {}, T('Clic droit sur un fichier audio pour le convertir.', 'Right-click an audio file to convert it.')), h('span', { class: 'tk-sp' }), h('button', { class: 'ms-btn sm', onclick: () => { wm.focus(ID); settings(); } }, T('Réglages de mSOUND…', 'mSOUND Settings…'))));
  fBody.addEventListener('pointerdown', e => { if (e.target === fList || e.target === fBody) { st.fsel.clear(); drawFinder(); } });
  const openFinder = () => {
    if (wm.wins.has(FID)) return wm.focus(FID);
    wm.open({ id: FID, appId: app.id, title: T('Audio', 'Audio'), w: FW, h: FH, x: 16, y: 300, cls: 'msw-f', build: () => { drawFinder(); return fBody; } });
  };

  /* ——— réglages ——— */
  const settings = () => {
    const sec = (t, ...k) => h('div', { class: 'ms-set' }, h('h6', {}, t), ...k);
    const chips = (arr, get, set) => h('div', { class: 'ms-chips' }, ...arr.map(([v, l]) => { const b = h('button', { class: 'ms-chip' + (get(v) ? ' on' : ''), onclick: () => { set(v); b.classList.toggle('on', get(v)); sfx.tick(); b.parentElement.querySelectorAll('.ms-chip').forEach((c, i) => c.classList.toggle('on', get(arr[i][0]))); } }, l); return b; }));
    const upd = h('span', { class: 'tk-dim' }, T(`Version ${VERSION}`, `Version ${VERSION}`)), sw = h('button', { class: 'tk-sw' + (st.autoUpd ? ' on' : ''), role: 'switch', 'aria-checked': String(st.autoUpd), onclick: () => { st.autoUpd = !st.autoUpd; sw.classList.toggle('on', st.autoUpd); sw.setAttribute('aria-checked', String(st.autoUpd)); sfx.tick(); } }, h('i'));
    const body = h('div', { class: 'ms-sets' },
      sec(T('Menu du Finder', 'Finder menu'), chips([...FORMATS.map(([f, n]) => [f, n]), ['edit', T('Éditer', 'Edit')]], v => st.menu.includes(v), v => { st.menu = st.menu.includes(v) ? st.menu.filter(x => x !== v) : [...st.menu, v].sort((a, b) => ['mp3', 'm4a', 'flac', 'wav', 'aiff', 'alac', 'edit'].indexOf(a) - ['mp3', 'm4a', 'flac', 'wav', 'aiff', 'alac', 'edit'].indexOf(b)); }),
        h('p', {}, T('Formats proposés au clic droit sur un fichier audio. Activez l’extension dans Réglages Système › Extensions › Finder.', 'Formats offered when right-clicking an audio file. Enable the extension in System Settings › Extensions › Finder.'))),
      sec(T('Qualité des formats compressés (MP3, AAC)', 'Compressed format quality (MP3, AAC)'), chips([128, 192, 256, 320].map(k => [k, k + ' kb/s']), v => st.quality === v, v => { st.quality = v; })),
      sec(T('Thème', 'Theme'), chips([['auto', T('Automatique', 'Automatic')], ['dark', T('Sombre', 'Dark')], ['sand', T('Sable', 'Sand')]], v => st.theme === v, v => { st.theme = v; layout(); ui(); })),
      sec(T('Raccourcis d’effets (fenêtre principale)', 'Effect shortcuts (main window)'), ...[0, 1, 2].map(i => h('div', { class: 'ms-slot' }, h('b', {}, String(i + 1)), h('select', { class: 'tk-sel', 'aria-label': 'shortcut ' + (i + 1), onchange: e => { st.slots[i] = e.target.value; ui(); } }, ...Object.entries(SHORTCUTS).map(([k, v]) => h('option', { value: k, selected: st.slots[i] === k }, v[2])))))),
      sec(T('Dossier des enregistrements', 'Recordings folder'), h('div', { class: 'ms-slot' }, h('code', {}, '~/Music/mSOUND'), h('span', { class: 'tk-sp' }), h('button', { class: 'ms-btn sm', onclick: () => say(T('Dans l’appli, choisissez n’importe quel dossier.', 'In the app, pick any folder.')) }, T('Choisir…', 'Choose…')))),
      sec(T('Mises à jour', 'Updates'), h('div', { class: 'ms-slot' }, h('span', {}, T('Installer automatiquement les mises à jour', 'Install updates automatically')), h('span', { class: 'tk-sp' }), sw),
        h('div', { class: 'ms-slot' }, upd, h('span', { class: 'tk-sp' }), h('button', { class: 'ms-btn sm', onclick: async () => { upd.textContent = T('Recherche en cours…', 'Checking…'); await wait(reduced() ? 0 : 900); upd.textContent = T(`Vous avez la dernière version (${VERSION}).`, `You have the latest version (${VERSION}).`); } }, T('Rechercher une mise à jour', 'Check for updates')))));
    const m = dialog(root, T('Réglages', 'Settings'), body, [T('Fermer', 'Close'), 'pri']); m.classList.add('ms-setm');
  };

  /* ——— ouverture ——— */
  let mainW;
  const ro = new ResizeObserver(() => { st.docs.forEach(d => refit(d)); paint(); });
  const mo = new MutationObserver(() => { layout(); ui(); drawProgress(); });
  openFinder();
  st.docs.push(mkDoc(st.files[0]));
  mainW = wm.open({
    id: ID, appId: app.id, title: app.id, w: W, h: H, x: Math.max(16, S.W - W - 24), y: 44, minw: 1000, minh: 520, bare: true, cls: 'tkwin msw', build: () => root,
    onclose: () => { stop(); removeEventListener('pointerdown', away, true); ro.disconnect(); mo.disconnect(); clearTimeout(recT); closeMenu(); closeFx(); [FID, PID].forEach(id => wm.wins.has(id) && wm.close(id)); try { ac && ac.close(); } catch {} }
  });
  ro.observe(wvBox);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // état de départ : deux repères et une sélection, comme sur la capture
  requestAnimationFrame(() => {
    const d = D(); refit(d); const t = N(d);
    d.markers = [{ f: Math.round(t * .16), n: T('Repère 1', 'Marker 1') }, { f: Math.round(t * .64), n: T('Repère 2', 'Marker 2') }];
    d.sel = [Math.round(t * .31), Math.round(t * .47)]; d.ph = Math.round(t * .36); d.phSet = true;
    layout(); ui(); root.focus({ preventScroll: true });
  });
  return mainW;
}
