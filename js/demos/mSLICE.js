/* Réplique interactive de mSLICE : découpeur audio et vidéo. Fichiers ouverts, lecteur (image, puce « Dans le morceau », numéro d'image), transport, timeline avec vignettes,
   forme d'onde, images clés, zoom, aimant, tête de lecture ; touches I / O / Espace / J K L / flèches / [ ] / ⌫ / ⌘Z / ⌘↩ / ⌘/ ; morceaux nommés, déplaçables par leurs bords,
   avertissement d'image clé, « Retirer les blancs », onglets Personnes (analyse des scènes et des sons) et Dialogues (répliques), agent, réglages d'export (un fichier par morceau
   ou fusion, format sans recompression ou recompressé, voix seules, blancs, dossier, noms), export animé puis résumé, réglages de l'appli, thème clair / sombre.
   Médias inventés et dessinés à la volée : rien n'est lu, analysé ni exporté. */
import { css, h, T, win, toast, icon, sfx, wait, reduced, clamp, S } from './tk.js';
import { wm } from './kit.js';
const CSS = 'css/demos/mSLICE.css';
const FR = () => T(1, 0) === 1;
const P = (n, one, many) => (n < 2 && FR()) || n === 1 ? one : many;           // vrai pluriel (le français met 0 et 1 au singulier)
const num = (v, d = 1) => v.toFixed(d).replace('.', FR() ? ',' : '.');
const size = mb => mb >= 1000 ? num(mb / 1000) + T(' Go', ' GB') : mb >= 1 ? num(mb) + T(' Mo', ' MB') : Math.max(1, Math.round(mb * 1000)) + T(' Ko', ' KB');
const tm = (s, dec = true) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (dec ? r.toFixed(1).padStart(4, '0') : String(Math.floor(r)).padStart(2, '0')); };
const rnd = sd => () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const SEG = '#f08a52', FAM = { space: '#64d2ff', earth: '#30d158', night: '#ffd60a', music: '#bf5af2', v1: '#64d2ff', v2: '#ff9f0a' };

/* ---------- médias d'exemple ---------- */
function makeKf(dur, sd) { const r = rnd(sd), k = [0]; while (k[k.length - 1] < dur) k.push(+(k[k.length - 1] + 1.4 + r() * 1.3).toFixed(2)); return k.filter(x => x < dur); }
function makeAmp(dur, kind, quiet, sd) {
  const r = rnd(sd), n = Math.ceil(dur * 20), a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / 20; let v;
    if (kind === 'music') v = .42 + .2 * Math.abs(Math.sin(t * 3.7)) + .18 * (Math.floor(t * 2) % 2) + r() * .2;
    else { const ph = (t * .61 + Math.sin(t * .23) * 2) % 3.1; v = ph < 2.3 ? .3 + .45 * Math.abs(Math.sin(t * 9.1)) * (r() * .5 + .6) : .03 + r() * .04; }
    if (quiet.some(([a0, b0]) => t >= a0 && t <= b0)) v = .02 + r() * .03;
    a[i] = Math.min(1, v);
  }
  return a;
}
const LINES = [
  [2.1, 7.4, 'v1', 'Bonjour et merci d’être venue.', 'Hello, and thanks for coming in.'], [8.0, 15.6, 'v2', 'Merci à vous, c’est un plaisir.', 'Thank you, it’s a pleasure.'],
  [16.8, 27.9, 'v1', 'Racontez-nous comment le projet a commencé.', 'Tell us how the project started.'], [29.0, 52.3, 'v2', 'Tout est parti d’un carnet de croquis, il y a trois ans.', 'It all started with a sketchbook, three years ago.'],
  [54.1, 61.0, 'v1', 'Et l’équipe, aujourd’hui ?', 'And the team, today?'], [62.2, 88.7, 'v2', 'Nous sommes six, répartis entre Lyon et Montréal.', 'There are six of us, between Lyon and Montreal.'],
  [90.4, 99.8, 'v1', 'Quelle a été la plus grosse difficulté ?', 'What was the biggest challenge?'], [101.0, 131.6, 'v2', 'Garder le cap quand tout le monde avait un avis différent.', 'Staying on course when everyone had a different opinion.'],
  [133.2, 140.1, 'v1', 'Un conseil pour ceux qui se lancent ?', 'Any advice for those starting out?'], [141.5, 168.9, 'v2', 'Commencer petit, et montrer son travail très tôt.', 'Start small, and show your work very early.']
];
function mkFiles() {
  const planetQuiet = [[0, 1.2], [29.3, 30.5], [44.2, 45.4], [88.7, 90]];
  const ivQuiet = LINES.slice(1).map((l, i) => [LINES[i][1] + .1, l[0] - .1]).concat([[0, 2], [169.2, 172]]);
  return [
    { id: 'p', name: 'Planet Earth', ext: 'mp4', kind: 'video', dur: 90, fps: 30, meta: '1920×1080 · H.264 · 30 i/s · AAC 44.1 kHz', metaEn: '1920×1080 · H.264 · 30 fps · AAC 44.1 kHz', mb: 67.2,
      kf: makeKf(90, 11), amp: makeAmp(90, 'music', planetQuiet, 5), quiet: planetQuiet, segs: [[6, 21], [30, 44], [58, 79]].map(([a, b]) => ({ id: Math.random(), a, b })), sel: 1, t: 33, pin: null, undo: [], base: '', merge: '', find: 'before', dlg: 'before', done: false },
    { id: 'i', name: 'Interview_raw', ext: 'wav', kind: 'audio', dur: 172, fps: 0, meta: 'WAV · PCM 48 kHz · stéréo', metaEn: 'WAV · PCM 48 kHz · stereo', mb: 33.0,
      kf: [], amp: makeAmp(172, 'speech', ivQuiet, 17), quiet: ivQuiet, segs: [], sel: -1, t: 0, pin: null, undo: [], base: '', merge: '', find: 'before', dlg: 'before', done: false }
  ];
}

/* ---------- dessin d'une image du film (planète, étoiles) ---------- */
const STARS = (() => { const r = rnd(3); return Array.from({ length: 140 }, () => [r(), r(), r() * 1.2 + .3, r()]); })();
function scene(c, W, H, t, small) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const shot = t < 30 ? 0 : t < 60 ? 1 : 2, u = t - shot * 30;
  c.fillStyle = '#fff';
  for (const [x, y, s, a] of small ? STARS.slice(0, 40) : STARS) { c.globalAlpha = .25 + a * .6; const px = ((x + u * .002 * (shot ? -1 : 1)) % 1 + 1) % 1; c.fillRect(px * W, y * H, s * (small ? .6 : W / 900), s * (small ? .6 : W / 900)); }
  c.globalAlpha = 1;
  let cx, cy, R;
  if (shot === 0) { cx = W * (1.12 - u * .004); cy = H * 1.32; R = H * 1.12; }
  else if (shot === 1) { cx = W * (.98 - u * .002); cy = H * 1.02; R = H * (.78 + u * .003); }
  else { cx = W * .5; cy = H * .5; R = H * .38; }
  const glow = c.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.08); glow.addColorStop(0, 'rgba(90,200,255,.55)'); glow.addColorStop(1, 'rgba(90,200,255,0)');
  c.fillStyle = glow; c.beginPath(); c.arc(cx, cy, R * 1.08, 0, 7); c.fill();
  const lx = shot === 2 ? cx - R * .4 : cx - R * .7, ly = shot === 2 ? cy - R * .4 : cy - R * .7;
  const g = c.createRadialGradient(lx, ly, R * .1, cx, cy, R);
  if (shot === 2) { g.addColorStop(0, '#5fb8ff'); g.addColorStop(.6, '#1d5fa8'); g.addColorStop(1, '#06162e'); }
  else { g.addColorStop(0, '#3fa9ff'); g.addColorStop(.35, '#0b4f8a'); g.addColorStop(.7, '#03111f'); g.addColorStop(1, '#010409'); }
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fillStyle = g; c.fill(); c.clip();
  if (shot === 2) {
    const r = rnd(9);
    for (let i = 0; i < 7; i++) { const ox = ((r() * 2 + u * .018) % 2) - .5; c.fillStyle = i % 2 ? 'rgba(84,140,70,.85)' : 'rgba(150,120,70,.8)'; c.beginPath(); c.ellipse(cx + (ox - .5) * R * 2, cy + (r() - .5) * R * 1.4, R * (.12 + r() * .2), R * (.08 + r() * .14), r() * 3, 0, 7); c.fill(); }
    for (let i = 0; i < 9; i++) { const ox = ((r() * 2 + u * .026) % 2) - .5; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(cx + (ox - .5) * R * 2, cy + (r() - .5) * R * 1.7, R * (.2 + r() * .25), R * (.03 + r() * .05), .2, 0, 7); c.fill(); }
    const sh = c.createRadialGradient(cx - R * .5, cy - R * .5, R * .2, cx, cy, R * 1.05); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(.7, 'rgba(0,0,0,.15)'); sh.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = sh; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  } else if (shot === 1) {
    const r = rnd(21); c.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const y = cy - R * (.15 + r() * .75), x = cx - R * (.2 + r() * .7) + ((u * 6 + r() * 400) % (R * .4)); c.strokeStyle = `rgba(255,${120 + r() * 80 | 0},40,${.4 + r() * .5})`; c.lineWidth = Math.max(1, H * .004); c.beginPath(); c.moveTo(x, y); c.lineTo(x + R * (.05 + r() * .12), y - R * .01); c.stroke(); }
  }
  c.restore();
  c.strokeStyle = shot === 1 ? 'rgba(255,90,120,.5)' : 'rgba(150,225,255,.7)'; c.lineWidth = Math.max(1, H * .006); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
}

export function open(app) {
  css(CSS);
  return win(app, 1180, 720, w => {
    const files = mkFiles();
    const st = { f: 0, tab: 'cut', play: 0, zoom: 1, snap: true, hints: true, light: false, silPrev: false, silBusy: -1, agent: false, chat: [], busy: false,
      o: { merge: false, pass: true, fmt: 'same', voice: false, voiceReady: 0, sil: false, inten: .5, folder: '', digits: 2, suffix: T('extrait', 'extract'), reveal: false, trash: false, auto: true, more: false } };
    const cur = () => files[st.f];
    const root = h('div', { class: 'tk msl', tabindex: '-1' });
    let raf = 0, last = 0, ro = null, sheet = null;

    /* ---------- utilitaires ---------- */
    const sorted = f => f.segs.slice().sort((a, b) => a.a - b.a);
    const kept = f => f.segs.reduce((s, x) => s + x.b - x.a, 0);
    const pad = n => String(n).padStart(st.o.digits, '0');
    const baseOf = f => f.base || f.name;
    const ext = f => { const o = st.o; if (o.pass && o.fmt === 'same') return f.ext; if (o.fmt === 'same') return f.kind === 'audio' ? 'm4a' : 'mp4'; return o.fmt; };
    const outs = f => { const L = sorted(f); if (!L.length) return []; if (st.o.merge) return [{ name: (f.merge || baseOf(f) + '_' + st.o.suffix) + '.' + ext(f), dur: kept(f), segs: L }]; return L.map((s, i) => ({ name: (s.name || baseOf(f) + '_' + pad(i + 1)) + '.' + ext(f), dur: s.b - s.a, segs: [s] })); };
    const rate = f => { const o = st.o, e = ext(f); if (o.pass) return f.mb / f.dur; return { mp3: .024, m4a: .02, opus: .012, wav: .192, aiff: .192, flac: .1, webm: .3 }[e] || (f.kind === 'audio' ? .02 : .42); };
    const silGain = f => { let g = 0; for (const s of f.segs) for (const [a, b] of f.quiet) { const x = Math.max(a, s.a), y = Math.min(b, s.b); if (y > x) g += (y - x) * (.6 + st.o.inten * .4); } return g; };
    const est = f => { const d = kept(f) - (st.o.sil ? silGain(f) : 0); return { mb: d * rate(f), sec: st.o.pass && !st.o.sil ? .4 + f.segs.length * .1 : d * .22 }; };
    const prevKf = (f, t) => { let k = 0; for (const x of f.kf) { if (x <= t + 1e-3) k = x; else break; } return k; };
    const inPiece = f => sorted(f).findIndex(s => f.t >= s.a && f.t < s.b);
    const colorOf = s => s.who ? FAM[s.who] : SEG;
    const snapIn = (f, t) => (st.snap && st.o.pass && f.kind === 'video') ? prevKf(f, t) : t;
    const push = f => { f.undo.push(JSON.stringify(f.segs)); if (f.undo.length > 60) f.undo.shift(); };
    const later = (fn, ms) => setTimeout(() => { if (root.isConnected) fn(); }, ms);
    const say = body => toast({ icon: icon('mSLICE'), title: 'mSLICE', body });
    const lc = '<span class="lc">m</span>SLICE';

    /* ---------- structure ---------- */
    const meta = h('div', { class: 'msl-meta' });
    const tbar = h('div', { class: 'msl-tb', 'data-drag': '' },
      wm.lights(w), h('b', { class: 'msl-brand', html: lc }), meta, h('span', { class: 'tk-sp' }),
      h('button', { class: 'msl-ib', title: T('Agent', 'Agent'), 'aria-label': 'Agent', onclick: () => { st.agent = !st.agent; sfx.tick(); paintRight(); }, html: '<svg viewBox="0 0 16 16"><path d="M8 1.5l1.3 3.7L13 6.5 9.3 7.8 8 11.5 6.7 7.8 3 6.5l3.7-1.3zM13 11l.6 1.4L15 13l-1.4.6L13 15l-.6-1.4L11 13l1.4-.6z" fill="currentColor"/></svg>' }),
      h('button', { class: 'msl-sc', onclick: shortcuts }, T('Raccourcis', 'Shortcuts'), h('kbd', {}, '⌘/')),
      h('button', { class: 'msl-ib', title: T('Apparence', 'Appearance'), 'aria-label': 'theme', onclick: () => { st.light = !st.light; sfx.tick(); root.classList.toggle('light', st.light); drawStrip(); drawFrame(); }, html: '<svg viewBox="0 0 16 16"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3"/></g></svg>' }),
      h('button', { class: 'msl-ib', title: T('Réglages', 'Settings'), 'aria-label': 'settings', onclick: settings, html: '<svg viewBox="0 0 16 16"><g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></g></svg>' }));
    const side = h('aside', { class: 'msl-side' }), center = h('main', { class: 'msl-c' }), right = h('aside', { class: 'msl-r' });
    root.append(tbar, h('div', { class: 'msl-body' }, side, center, right));

    /* lecteur */
    const cv = h('canvas', { class: 'msl-cv' }), chipName = h('span', { class: 'msl-chip nm' }), chipIn = h('span', { class: 'msl-chip in' }), tcode = h('span', { class: 'msl-tc' }), fr = h('span', { class: 'msl-fr' });
    const audioArt = h('div', { class: 'msl-aud' });
    const player = h('div', { class: 'msl-pl', onclick: () => togglePlay() }, cv, audioArt, chipName, chipIn, tcode, fr);
    const big = h('b', {}), tot = h('small', {}), playB = h('button', { class: 'msl-rb pri', 'aria-label': 'play', onclick: () => togglePlay() });
    const rb = (g, l, fn) => h('button', { class: 'msl-rb', 'aria-label': l, title: l, onclick: fn, html: g });
    const svgp = d => `<svg viewBox="0 0 16 16"><path d="${d}" fill="currentColor"/></svg>`;
    const voiceB = rb('<svg viewBox="0 0 16 16"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 7v2M4.5 5v6M7 3v10M9.5 5.5v5M12 4v8M14 7v2"/></g></svg>', T('Écouter les voix seules', 'Listen to the voices only'), () => toggleVoice());
    const transport = h('div', { class: 'msl-tr' }, h('div', { class: 'msl-time' }, big, tot),
      rb(svgp('M3 3h1.6v10H3zM13 3v10L5.5 8z'), T('Début', 'Start'), () => seek(0)), rb(svgp('M8 3v10L1.5 8zM15 3v10L8.5 8z'), '−1 s', () => seek(cur().t - 1)), playB,
      rb(svgp('M1 3v10l6.5-5zM8 3v10l6.5-5z'), '+1 s', () => seek(cur().t + 1)), rb(svgp('M3 3v10l7.5-5zM11.4 3H13v10h-1.6z'), T('Fin', 'End'), () => seek(cur().dur)), voiceB,
      h('span', { class: 'tk-sp' }), h('button', { class: 'msl-io', onclick: () => markIn() }, T('Entrée', 'In'), h('kbd', {}, 'I')), h('button', { class: 'msl-io', onclick: () => markOut() }, T('Sortie', 'Out'), h('kbd', {}, 'O')));
    /* timeline */
    const zoomIn = h('input', { type: 'range', min: 1, max: 6, step: .1, value: 1, 'aria-label': 'zoom', oninput: e => setZoom(+e.target.value) }), zoomL = h('span', { class: 'tk-dim' }, '1×');
    const snapB = h('button', { class: 'msl-snap', title: T('En copie directe, l’entrée se cale sur l’image clé précédente : le début réel du morceau.', 'With direct copy, the in point snaps to the previous keyframe: the actual start of the piece.'), onclick: () => { st.snap = !st.snap; sfx.tick(); paintTl(); } });
    const moreB = h('button', { class: 'msl-ib sm', 'aria-label': T('Plus', 'More'), onclick: e => tlMenu(e.currentTarget) }, '•••');
    const ruler = h('div', { class: 'msl-ru' }), strip = h('canvas', { class: 'msl-st' }), segL = h('div', { class: 'msl-sl' }), ph = h('div', { class: 'msl-ph' }, h('span'));
    const track = h('div', { class: 'msl-trk' }, ruler, h('div', { class: 'msl-lane' }, strip, segL), ph);
    const scroller = h('div', { class: 'msl-scr' }, track);
    const legend = h('div', { class: 'msl-leg' });
    const tl = h('div', { class: 'msl-tl' }, h('div', { class: 'msl-tlh' }, h('span', { class: 'tk-dim' }, 'Zoom'), zoomIn, zoomL, h('span', { class: 'tk-sp' }), snapB, moreB), scroller, legend);
    center.append(player, transport, tl);

    /* ---------- dessin ---------- */
    function fit(c, wd, ht) { const d = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(wd * d) || c.height !== Math.round(ht * d)) { c.width = Math.round(wd * d); c.height = Math.round(ht * d); } const x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return x; }
    function drawFrame() {
      const f = cur(), r = player.getBoundingClientRect(); if (!r.width) return;
      cv.hidden = f.kind !== 'video'; audioArt.hidden = f.kind === 'video';
      if (f.kind === 'video') { const x = fit(cv, r.width, r.height); x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, r.width, r.height); let vw = r.width, vh = vw * 9 / 16; if (vh > r.height) { vh = r.height; vw = vh * 16 / 9; } x.save(); x.translate((r.width - vw) / 2, (r.height - vh) / 2); scene(x, vw, vh, f.t, false); x.restore(); }
      else { const i = Math.floor(f.t * 20); [...audioArt.children].forEach((b, k) => { const a = f.amp[clamp(i + (k - 30) * 2, 0, f.amp.length - 1)] || 0; b.style.height = 6 + a * 90 + '%'; b.classList.toggle('on', k <= 30); }); }
      const ip = inPiece(f); chipIn.hidden = ip < 0; chipIn.textContent = T('Dans le morceau ', 'In piece ') + (ip + 1);
      tcode.textContent = tm(f.t); fr.textContent = f.kind === 'video' ? T(`image ${Math.floor(f.t * f.fps)} · ${f.fps} i/s`, `frame ${Math.floor(f.t * f.fps)} · ${f.fps} fps`) : '48 kHz';
      big.textContent = tm(f.t); tot.textContent = ' / ' + tm(f.dur);
      playB.innerHTML = st.play ? svgp('M4 3h3v10H4zM9 3h3v10H9z') : svgp('M4.5 2.5v11L13 8z');
      ph.style.left = f.t / f.dur * 100 + '%'; ph.firstChild.textContent = tm(f.t);
    }
    function drawStrip() {
      const f = cur(), wd = track.clientWidth, vid = f.kind === 'video', th = vid ? 40 : 0, wh = vid ? 84 : 124, x = fit(strip, wd, th + wh);
      strip.style.height = th + wh + 'px'; x.clearRect(0, 0, wd, th + wh);
      if (vid) { const tw = Math.round(th * 16 / 9), n = Math.ceil(wd / tw); for (let i = 0; i < n; i++) { x.save(); x.beginPath(); x.rect(i * tw, 0, tw - 1, th); x.clip(); x.translate(i * tw, 0); scene(x, tw, th, Math.min(f.dur - .1, (i + .5) * tw / wd * f.dur), true); x.restore(); } }
      const base = st.light ? '#c3c3c9' : '#4a4a50', segs = sorted(f), mid = th + wh / 2;
      for (let px = 0; px < wd; px += 3) {
        const t = px / wd * f.dur, a = f.amp[Math.min(f.amp.length - 1, Math.floor(t * 20))], s = segs.find(z => t >= z.a && t < z.b);
        const quiet = st.silPrev && f.quiet.some(([q0, q1]) => t >= q0 && t <= q1);
        x.fillStyle = s ? (quiet ? 'rgba(255,69,58,.85)' : colorOf(s)) : base; const hh = Math.max(2, a * (wh - 10)); x.fillRect(px, mid - hh / 2, 2, hh);
      }
      if (st.silPrev) { x.fillStyle = 'rgba(255,69,58,.14)'; for (const [q0, q1] of f.quiet) x.fillRect(q0 / f.dur * wd, th, (q1 - q0) / f.dur * wd, wh); }
    }
    function paintRuler() {
      const f = cur(), wd = track.clientWidth, steps = [1, 2, 5, 10, 15, 30, 60], step = steps.find(s => s / f.dur * wd >= 80) || 60, minor = step / 5;
      ruler.replaceChildren();
      for (let t = 0; t <= f.dur + 1e-6; t += minor) { const major = Math.abs(t / step - Math.round(t / step)) < 1e-6; ruler.append(h('i', { class: major ? 'mj' : '', style: { left: t / f.dur * 100 + '%' } }, major ? h('span', {}, tm(t, false)) : null)); }
      if (st.snap && f.kind === 'video' && st.zoom >= 2.5) f.kf.forEach(k => ruler.append(h('u', { style: { left: k / f.dur * 100 + '%' } })));
    }
    function paintSegs() {
      const f = cur(); segL.replaceChildren();
      sorted(f).forEach((s, i) => {
        const on = f.segs.indexOf(s) === f.sel, c = colorOf(s);
        const box = h('div', { class: 'msl-sg' + (on ? ' on' : ''), style: { left: s.a / f.dur * 100 + '%', width: (s.b - s.a) / f.dur * 100 + '%', '--c': c } },
          h('em', {}, String(i + 1)), on ? h('b', { class: 'fi' }, 'I') : null, on ? h('b', { class: 'fo' }, 'O') : null, h('span', { class: 'hl', 'data-e': 'a' }), h('span', { class: 'hr', 'data-e': 'b' }));
        box.addEventListener('pointerdown', e => edgeDrag(e, s, box));
        segL.append(box);
      });
      if (f.pin != null) segL.append(h('div', { class: 'msl-pin', style: { left: f.pin / f.dur * 100 + '%' } }, h('b', {}, 'I')));
    }
    function paintTl() {
      track.style.width = st.zoom * 100 + '%'; zoomL.textContent = num(st.zoom, st.zoom % 1 ? 1 : 0).replace(/[.,]0$/, '') + '×';
      snapB.classList.toggle('on', st.snap); snapB.textContent = (st.snap ? '✓ ' : '') + T('Aimant : images clés', 'Snap: keyframes'); snapB.hidden = cur().kind !== 'video';
      legend.hidden = !st.hints;
      legend.replaceChildren(...[['I', T('entrée', 'in')], ['O', T('sortie', 'out')], [T('Espace', 'Space'), T('lecture', 'play')], ['←→', T('image', 'frame')], ['⌫', T('supprimer', 'delete')]].map(([k, l]) => h('span', {}, h('kbd', {}, k), l)));
      paintRuler(); paintSegs(); drawStrip(); drawFrame();
    }
    function paintMeta() { const f = cur(); meta.replaceChildren(h('b', {}, f.name + '.' + f.ext), ' · ' + T(f.meta, f.metaEn) + ' · ' + tm(f.dur) + ' · ' + size(f.mb)); chipName.textContent = f.name + '.' + f.ext; }
    function paintSide() {
      side.replaceChildren(h('div', { class: 'msl-h' }, T('Fichiers ouverts · ', 'Open files · ') + files.length));
      files.forEach((f, i) => side.append(h('button', { class: 'msl-file' + (i === st.f ? ' on' : ''), onclick: () => { if (i === st.f) return; stopPlay(); st.f = i; st.silPrev = false; sfx.tick(); paintAll(); } },
        h('i', { class: f.kind }, f.ext.toUpperCase()), h('div', {}, h('b', {}, f.name + '.' + f.ext), h('small', {}, tm(f.dur, false) + ' · ' + size(f.mb)),
          h('span', { class: 'bd' }, f.done ? h('span', { class: 'ok' }, T('Extrait', 'Extracted')) : null, f.segs.length ? h('span', { class: 'n' }, f.segs.length + ' ' + P(f.segs.length, T('morceau', 'piece'), T('morceaux', 'pieces'))) : null)))));
      const drop = h('div', { class: 'msl-drop' }, h('b', {}, T('Déposez des fichiers ici', 'Drop files here')), h('span', {}, T('ou clic droit dans le Finder ▸ Extraire avec mSLICE', 'or right-click in the Finder ▸ Extract with mSLICE')), h('small', {}, 'MOV · MP4 · MKV · AVI · WebM · MXF · MTS · ProRes · WAV · MP3 · FLAC · AAC · AIFF · OGG · Opus…'));
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('hot'); }));
      drop.addEventListener('dragleave', () => drop.classList.remove('hot'));
      drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('hot'); const fl = [...(e.dataTransfer.files || [])]; if (!fl.length) return; fl.slice(0, 4).forEach((x, k) => addFile(x.name, k)); });
      side.append(h('span', { class: 'tk-sp' }), drop);
    }
    function addFile(full, k) {
      const m = /^(.*?)(?:\.([^.]+))?$/.exec(full), e = (m[2] || 'mov').toLowerCase(), audio = /^(wav|mp3|flac|aac|m4a|aiff?|ogg|opus)$/.test(e), dur = 40 + ((full.length * 37 + k * 13) % 200);
      if (!/^(mov|mp4|mkv|avi|webm|mxf|mts|m4v|wav|mp3|flac|aac|m4a|aiff?|ogg|opus)$/.test(e)) { say(T(`« ${full} » n’est pas un fichier audio ou vidéo.`, `“${full}” is not an audio or video file.`)); return; }
      const q = [[0, 1], [dur - 1, dur]];
      files.push({ id: 'x' + Date.now() + k, name: m[1], ext: e, kind: audio ? 'audio' : 'video', dur, fps: audio ? 0 : 25, meta: audio ? e.toUpperCase() + ' · 48 kHz' : '1920×1080 · H.264 · 25 i/s · AAC 48 kHz', metaEn: audio ? e.toUpperCase() + ' · 48 kHz' : '1920×1080 · H.264 · 25 fps · AAC 48 kHz', mb: audio ? dur * .19 : dur * .9,
        kf: audio ? [] : makeKf(dur, dur), amp: makeAmp(dur, audio ? 'speech' : 'music', q, dur + 3), quiet: q, segs: [], sel: -1, t: 0, pin: null, undo: [], base: '', merge: '', find: 'before', dlg: 'before', done: false });
      stopPlay(); st.f = files.length - 1; sfx.pop(); paintAll();
      say(T('Démo : le fichier n’est pas lu, son contenu est inventé.', 'Demo: the file is not read, its content is made up.'));
    }

    /* ---------- panneau de droite ---------- */
    function tabs() {
      return h('div', { class: 'msl-tabs' }, ...[['cut', T('Couper', 'Cut')], ['people', T('Personnes', 'People')], ['dlg', T('Dialogues', 'Dialogues')]].map(([k, l]) =>
        h('button', { class: st.tab === k && !st.agent ? 'on' : '', onclick: () => { st.tab = k; st.agent = false; sfx.tick(); paintRight(); } }, l)));
    }
    function paintRight() {
      const f = cur(); right.replaceChildren(tabs());
      const body = h('div', { class: 'msl-rb2' }); right.append(body);
      if (st.agent) body.append(agentPanel());
      else if (st.tab === 'cut') body.append(piecesCard(f));
      else if (st.tab === 'people') body.append(peopleCard(f));
      else body.append(dlgCard(f));
      right.append(exportBar(f));
    }
    function piecesCard(f) {
      const L = sorted(f), card = h('div', { class: 'msl-card' });
      card.append(h('div', { class: 'msl-ch' }, h('span', {}, T('MORCEAUX · ', 'PIECES · ') + L.length), h('span', { class: 'tk-dim' }, T(`${tm(kept(f))} gardés sur ${tm(f.dur)}`, `${tm(kept(f))} kept of ${tm(f.dur)}`))));
      if (!L.length) card.append(h('p', { class: 'msl-empty' }, T('Placez la tête de lecture, puis marquez l’entrée et la sortie de chaque morceau à garder.', 'Move the playhead, then mark the in and out of each piece to keep.'), h('span', {}, h('kbd', {}, 'I'), ' ', h('kbd', {}, 'O'))));
      L.forEach((s, i) => {
        const on = f.segs.indexOf(s) === f.sel, auto = baseOf(f) + '_' + pad(i + 1);
        const nm = h('b', { title: T('Double-cliquez pour renommer', 'Double-click to rename'), ondblclick: e => { e.stopPropagation(); rename(nm, s, auto); } }, s.name || auto);
        card.append(h('div', { class: 'msl-row' + (on ? ' on' : ''), onclick: () => { f.sel = f.segs.indexOf(s); seek(s.a); sfx.tick(); paintSegs(); paintRight(); } },
          h('i', { style: { background: colorOf(s) } }, String(i + 1)), h('div', {}, nm, h('small', {}, tm(s.a) + ' → ' + tm(s.b))), h('strong', {}, tm(s.b - s.a)),
          h('button', { class: 'x', 'aria-label': T('Supprimer', 'Delete'), onclick: e => { e.stopPropagation(); delSeg(s); } }, '×')));
      });
      if (f.segs.length) {
        card.append(h('div', { class: 'msl-sil' }, st.silBusy >= 0 ? h('div', { class: 'msl-prog' }, h('span', {}, T(`Recherche des blancs… ${st.silBusy} %`, `Looking for silences… ${st.silBusy}%`)), h('i', {}, h('u', { style: { width: st.silBusy + '%' } })))
          : [h('button', { class: 'msl-btn sm', onclick: removeSilences }, T('Retirer les blancs', 'Remove silences')), h('button', { class: 'msl-lnk' + (st.silPrev ? ' on' : ''), onclick: () => { st.silPrev = !st.silPrev; sfx.tick(); drawStrip(); paintRight(); } }, T('Voir ce qui serait coupé', 'See what would be cut'))]));
        const bad = f.kind === 'video' && st.o.pass && L.findIndex(s => Math.abs(prevKf(f, s.a) - s.a) > .04);
        if (bad >= 0 && bad !== false) card.append(h('div', { class: 'msl-warn' }, T(`Sans recompression, le morceau ${bad + 1} démarre à l’image clé ${tm(prevKf(f, L[bad].a))}. `, `Without re-encoding, piece ${bad + 1} starts at keyframe ${tm(prevKf(f, L[bad].a))}. `),
          h('button', { onclick: () => { st.o.pass = false; if (st.o.fmt === 'same') st.o.fmt = 'same'; sfx.tick(); say(T('Recompression activée : coupe à l’image près.', 'Re-encoding on: frame-accurate cuts.')); paintAll(); } }, T('Recompresser', 'Re-encode')), T(' pour couper à l’image près.', ' to cut to the exact frame.')));
      }
      return card;
    }
    function rename(el, s, auto) {
      const inp = h('input', { class: 'msl-in', value: s.name || auto, 'aria-label': 'name' });
      const done = ok => { if (ok) { const v = inp.value.trim().replace(/[/:]/g, '-'); s.name = v && v !== auto ? v : undefined; } paintRight(); };
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
      inp.addEventListener('blur', () => done(true)); inp.addEventListener('click', e => e.stopPropagation());
      el.replaceWith(inp); inp.focus(); inp.select();
    }
    function settingsText(f) {
      const o = st.o; if (o.pass && o.fmt === 'same' && !o.voice) return T('mêmes réglages que l’original', 'same settings as the original');
      let s = o.pass ? (o.fmt === 'same' ? T('même format que l’original', 'same format as the original') : T(`${ext(f).toUpperCase()}, sans recompression`, `${ext(f).toUpperCase()}, no re-encoding`)) : T(`recompressé en ${ext(f).toUpperCase()}`, `re-encoded as ${ext(f).toUpperCase()}`);
      if (o.voice) s += T(' · voix seules', ' · voice only'); return s;
    }
    function exportBar(f) {
      const n = outs(f).length, bar = h('div', { class: 'msl-xb' });
      bar.append(h('p', {}, n ? [h('b', {}, n + ' ' + P(n, T('fichier', 'file'), T('fichiers', 'files'))), h('span', { class: 'tk-dim' }, ' · ' + settingsText(f)), h('span', { class: 'tk-dim r' }, '≈ ' + size(est(f).mb))] : h('span', { class: 'tk-dim' }, T('Rien à exporter : posez une entrée et une sortie', 'Nothing to export: set an in and an out point'))));
      const k = f.segs.length;
      bar.append(h('div', { class: 'msl-xr' }, h('button', { class: 'msl-btn pri big', disabled: !n, onclick: () => runExport() }, T(`Exporter ${k} ${P(k, 'morceau', 'morceaux')}`, `Export ${k} ${P(k, 'piece', 'pieces')}`)),
        h('button', { class: 'msl-btn big sl', disabled: !n, title: T('Réglages d’export', 'Export settings'), 'aria-label': T('Réglages d’export', 'Export settings'), onclick: () => options(), html: '<svg viewBox="0 0 16 16"><g fill="none" stroke="#ff9f0a" stroke-width="1.6" stroke-linecap="round"><path d="M2 4h7M12 4h2M2 8h2M7 8h7M2 12h9M14 12h0"/><circle cx="10.5" cy="4" r="1.5"/><circle cx="5.5" cy="8" r="1.5"/><circle cx="12.5" cy="12" r="1.5"/></g></svg>' })));
      return bar;
    }

    /* ---------- Personnes : analyse des scènes et des sons ---------- */
    const FAMS = f => f.kind === 'video' ? [
      { k: 'space', g: T('Scènes', 'Scenes'), n: T('Espace, étoiles', 'Space, stars'), segs: [[0, 12.4], [31.5, 38.0]] },
      { k: 'earth', g: T('Scènes', 'Scenes'), n: T('Planète Terre', 'Planet Earth'), segs: [[61.2, 89.6]] },
      { k: 'night', g: T('Scènes', 'Scenes'), n: T('Lumières de la ville, nuit', 'City lights, night'), segs: [[40.2, 57.6]] },
      { k: 'music', g: T('Sons', 'Sounds'), n: T('Musique', 'Music'), segs: [[1.2, 29.3], [30.5, 44.2], [45.4, 88.7]] }
    ] : [{ k: 'v1', g: T('Voix', 'Voices'), n: T('Voix 1', 'Voice 1'), segs: LINES.filter(l => l[2] === 'v1').map(l => [l[0], l[1]]) }, { k: 'v2', g: T('Voix', 'Voices'), n: T('Voix 2', 'Voice 2'), segs: LINES.filter(l => l[2] === 'v2').map(l => [l[0], l[1]]) }];
    function peopleCard(f) {
      const card = h('div', { class: 'msl-card' });
      if (f.find === 'before') {
        card.append(h('h4', {}, f.kind === 'video' ? T('Trouver dans la vidéo', 'Find in the video') : T('Trouver dans le son', 'Find in the sound')),
          h('p', { class: 'tk-dim' }, f.kind === 'video' ? T('Repérez les types de scènes et les sons, puis transformez leurs passages en morceaux.', 'Spot the kinds of scenes and sounds, then turn their passages into pieces.') : T('Repérez les voix et les types de sons, puis transformez leurs passages en morceaux.', 'Spot the voices and kinds of sounds, then turn their passages into pieces.')),
          h('p', { class: 'tk-dim' }, T(`Environ ${Math.round(f.dur / 5)} s pour ce fichier de ${tm(f.dur, false)}.`, `About ${Math.round(f.dur / 5)} s for this ${tm(f.dur, false)} file.`)),
          h('p', { class: 'tk-dim' }, T('Tout reste sur ce Mac : rien n’est envoyé.', 'Everything stays on this Mac: nothing is sent.')),
          h('button', { class: 'msl-btn pri', onclick: () => analyze(f) }, T('Analyser', 'Analyze')));
      } else if (typeof f.find === 'number') {
        const p = f.find;
        card.append(h('h4', {}, T(`Analyse en cours… ${p} %`, `Analyzing… ${p}%`)), h('div', { class: 'msl-prog' }, h('i', {}, h('u', { style: { width: p + '%' } }))),
          h('p', { class: 'tk-dim' }, (p < 45 ? '● ' : '✓ ') + T('Sons', 'Sounds')), f.kind === 'video' ? h('p', { class: 'tk-dim' }, (p < 45 ? '○ ' : p < 100 ? '● ' : '✓ ') + T('Images et scènes', 'Pictures and scenes') + (p < 45 ? T(' · en attente', ' · waiting') : '')) : null,
          h('p', { class: 'tk-dim' }, T('Vous pouvez continuer à travailler.', 'You can keep working.')));
      } else {
        card.append(h('div', { class: 'msl-ch' }, h('span', {}, T('ANALYSÉ', 'ANALYZED')), h('button', { class: 'msl-lnk', onclick: () => analyze(f) }, T('Analyser de nouveau', 'Analyze again'))));
        let g0 = '';
        FAMS(f).forEach(F => {
          if (F.g !== g0) { g0 = F.g; card.append(h('div', { class: 'msl-h2' }, F.g)); }
          const d = F.segs.reduce((s, [a, b]) => s + b - a, 0), on = f.segs.some(s => s.who === F.k);
          card.append(h('button', { class: 'msl-fam' + (on ? ' on' : ''), onclick: () => addFamily(f, F) }, h('i', { style: { background: FAM[F.k] } }), h('span', {}, F.n), h('small', {}, F.segs.length + ' · ' + tm(d, false)), h('b', {}, on ? '✓' : '+')));
        });
        if (f.segs.some(s => s.who)) card.append(h('p', { class: 'tk-dim' }, T('Sur la timeline et dans l’onglet Couper. ⌘Z annule.', 'On the timeline and in the Cut tab. ⌘Z undoes it.')), h('button', { class: 'msl-btn', onclick: () => { st.tab = 'cut'; paintRight(); } }, T('Ouvrir l’onglet Couper', 'Open the Cut tab')));
      }
      return card;
    }
    async function analyze(f) {
      f.find = 0; sfx.click(); paintRight();
      for (let p = 0; p <= 100; p += 4) { await wait(reduced() ? 5 : 70); if (!root.isConnected) return; f.find = p; if (cur() === f && st.tab === 'people' && !st.agent) paintRight(); }
      f.find = 'done'; sfx.done(); if (cur() === f) paintRight();
    }
    function addFamily(f, F) {
      push(f);
      if (f.segs.some(s => s.who === F.k)) f.segs = f.segs.filter(s => s.who !== F.k);
      else F.segs.forEach(([a, b]) => f.segs.push({ id: Math.random(), a, b, who: F.k }));
      f.sel = f.segs.length - 1; sfx.tick(); paintAll();
    }

    /* ---------- Dialogues ---------- */
    function dlgCard(f) {
      const card = h('div', { class: 'msl-card' });
      if (f.dlg === 'before') card.append(h('h4', {}, T('Dialogues', 'Dialogues')), h('p', { class: 'tk-dim' }, T('Extrait les répliques avec leurs temps et leurs voix. Cliquez une réplique pour en faire un morceau.', 'Extracts the lines with their times and voices. Click a line to make it a piece.')),
        h('button', { class: 'msl-btn pri', onclick: async () => { f.dlg = 'run'; sfx.click(); paintRight(); await wait(reduced() ? 10 : 1500); if (!root.isConnected) return; f.dlg = 'done'; sfx.done(); if (cur() === f) paintRight(); } }, T('Extraire les répliques', 'Extract the lines')));
      else if (f.dlg === 'run') card.append(h('h4', {}, T('Extraction des répliques…', 'Extracting the lines…')), h('div', { class: 'msl-prog ind' }, h('i', {}, h('u'))));
      else if (f.kind === 'video') card.append(h('h4', {}, T('Dialogues', 'Dialogues')), h('p', { class: 'tk-dim' }, T('Aucune parole dans ce fichier : musique seule. Essayez « Interview_raw.wav » dans la liste des fichiers.', 'No speech in this file: music only. Try “Interview_raw.wav” in the file list.')));
      else {
        card.append(h('div', { class: 'msl-ch' }, h('span', {}, T('RÉPLIQUES · ', 'LINES · ') + LINES.length), h('span', { class: 'tk-dim' }, T('cliquez pour garder', 'click to keep'))));
        LINES.forEach(([a, b, v, tf, te]) => { const on = f.segs.some(s => Math.abs(s.a - a) < .01 && Math.abs(s.b - b) < .01);
          card.append(h('button', { class: 'msl-line' + (on ? ' on' : ''), onclick: () => { push(f); if (on) f.segs = f.segs.filter(s => !(Math.abs(s.a - a) < .01 && Math.abs(s.b - b) < .01)); else { f.segs.push({ id: Math.random(), a, b, who: v }); f.sel = f.segs.length - 1; } seek(a); sfx.tick(); paintAll(); } },
            h('i', { style: { background: FAM[v] } }), h('div', {}, h('small', {}, tm(a) + ' · ' + (v === 'v1' ? T('Voix 1', 'Voice 1') : T('Voix 2', 'Voice 2'))), h('span', {}, T(tf, te))))); });
      }
      return card;
    }

    /* ---------- agent ---------- */
    function agentPanel() {
      const card = h('div', { class: 'msl-card msl-agent' }), log = h('div', { class: 'msl-log' });
      card.append(h('div', { class: 'msl-ch' }, h('span', {}, T('AGENT', 'AGENT')), h('button', { class: 'msl-lnk', onclick: () => { st.chat = []; paintRight(); } }, T('Nouvelle discussion', 'New chat'))));
      if (!st.chat.length) log.append(h('p', { class: 'tk-dim' }, T('Demandez en langage courant : l’agent pose les morceaux, règle l’export et lance l’extraction. Il crée de nouveaux fichiers, sans jamais toucher à l’original.', 'Ask in plain words: the agent places pieces, sets up the export and runs the extraction. It creates new files and never touches the original.')));
      st.chat.forEach(m => log.append(h('div', { class: 'msl-msg ' + m.r }, m.t)));
      if (st.busy) log.append(h('div', { class: 'msl-msg a dim' }, T('L’agent travaille…', 'The agent is working…')));
      const sugg = cur().kind === 'video' ? [T('Garde seulement les plans de la Terre entière', 'Keep only the whole-Earth shots'), T('Retire les blancs', 'Remove silences'), T('Exporte en MP4', 'Export as MP4')] : [T('Garde les réponses de la voix 2', 'Keep voice 2’s answers'), T('Retire les blancs', 'Remove silences')];
      const inp = h('input', { class: 'msl-in', placeholder: T('Demandez à l’agent…', 'Ask the agent…'), 'aria-label': 'agent', onkeydown: e => { e.stopPropagation(); if (e.key === 'Enter' && inp.value.trim()) ask(inp.value.trim()); } });
      card.append(log, h('div', { class: 'msl-sug' }, ...sugg.map(s => h('button', { onclick: () => ask(s), disabled: st.busy }, s))), h('div', { class: 'msl-ask' }, inp, h('button', { class: 'msl-btn pri sm', onclick: () => inp.value.trim() && ask(inp.value.trim()) }, T('Envoyer', 'Send'))));
      requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
      return card;
    }
    async function ask(q) {
      if (st.busy) return; const f = cur(); st.chat.push({ r: 'u', t: q }); st.busy = true; sfx.tick(); paintRight(); await wait(reduced() ? 10 : 1300); if (!root.isConnected) return;
      let a; const s = q.toLowerCase();
      if (/blanc|silen/.test(s)) { a = applySilences(f, true); }
      else if (/mp4|export/.test(s)) { st.o.pass = true; st.o.fmt = f.kind === 'video' ? 'mp4' : 'same'; a = f.segs.length ? T(`Format réglé sur MP4 sans recompression. ${f.segs.length} ${P(f.segs.length, 'morceau prêt', 'morceaux prêts')} : cliquez « Exporter ».`, `Format set to MP4 without re-encoding. ${f.segs.length} ${P(f.segs.length, 'piece', 'pieces')} ready: click “Export”.`) : T('Format réglé sur MP4. Posez d’abord des morceaux.', 'Format set to MP4. Place some pieces first.'); }
      else if (f.kind === 'video') { push(f); f.segs = [{ id: Math.random(), a: 60, b: 89.6, name: T('Terre_entiere', 'Whole_Earth') }]; f.sel = 0; seek(60); a = T('Un morceau posé de 1:00.0 à 1:29.6 : le plan de la Terre entière. ⌘Z annule.', 'One piece placed from 1:00.0 to 1:29.6: the whole-Earth shot. ⌘Z undoes it.'); }
      else { push(f); f.segs = LINES.filter(l => l[2] === 'v2').map(l => ({ id: Math.random(), a: l[0], b: l[1], who: 'v2' })); f.sel = 0; a = T(`${f.segs.length} répliques de la voix 2 gardées. ⌘Z annule.`, `${f.segs.length} lines from voice 2 kept. ⌘Z undoes it.`); }
      st.busy = false; st.chat.push({ r: 'a', t: a }); sfx.notif(); paintAll();
    }

    /* ---------- édition ---------- */
    function seek(t) { const f = cur(); f.t = clamp(t, 0, f.dur); drawFrame(); follow(); }
    function follow() { if (st.zoom <= 1) return; const x = cur().t / cur().dur * track.clientWidth, sw = scroller.clientWidth; if (x < scroller.scrollLeft + 20 || x > scroller.scrollLeft + sw - 20) scroller.scrollLeft = x - sw * .3; }
    function markIn() { const f = cur(); f.pin = snapIn(f, f.t); if (f.pin !== f.t) seek(f.pin); sfx.tick(); paintSegs(); }
    function markOut() {
      const f = cur(); let a = f.pin;
      if (a == null) a = snapIn(f, Math.max(0, ...f.segs.filter(s => s.b <= f.t - .2).map(s => s.b)));
      const b = f.t; if (b - a < .2) { say(T('La sortie doit venir après l’entrée.', 'The out point must come after the in point.')); return; }
      push(f); f.segs = f.segs.filter(s => s.b <= a || s.a >= b);
      f.segs.push({ id: Math.random(), a, b }); f.sel = f.segs.length - 1; f.pin = null; sfx.pop(); paintAll();
    }
    function delSeg(s) { const f = cur(); push(f); f.segs.splice(f.segs.indexOf(s), 1); f.sel = Math.min(f.sel, f.segs.length - 1); sfx.tick(); paintAll(); }
    function undo() { const f = cur(); if (!f.undo.length) { say(T('Rien à annuler.', 'Nothing to undo.')); return; } f.segs = JSON.parse(f.undo.pop()); f.sel = Math.min(f.sel, f.segs.length - 1); sfx.tick(); paintAll(); }
    function stepPiece(d) { const f = cur(), L = sorted(f); if (!L.length) return; let i = L.indexOf(f.segs[f.sel]); i = clamp(i < 0 ? 0 : i + d, 0, L.length - 1); f.sel = f.segs.indexOf(L[i]); seek(L[i].a); paintSegs(); paintRight(); }
    function edgeDrag(e, s, box) {
      const f = cur(), edge = e.target.dataset.e; f.sel = f.segs.indexOf(s);
      if (!edge) { paintSegs(); paintRight(); return; }
      e.stopPropagation(); push(f); const r = track.getBoundingClientRect(); box.setPointerCapture(e.pointerId);
      const mv = ev => { let t = clamp((ev.clientX - r.left) / r.width * f.dur, 0, f.dur); if (edge === 'a') { s.a = Math.min(snapIn(f, t), s.b - .3); seek(s.a); } else { s.b = Math.max(t, s.a + .3); seek(s.b); } paintSegs(); };
      const up = () => { box.removeEventListener('pointermove', mv); box.removeEventListener('pointerup', up); paintAll(); };
      box.addEventListener('pointermove', mv); box.addEventListener('pointerup', up);
    }
    track.addEventListener('pointerdown', e => {
      if (e.target.closest('.hl,.hr')) return; const r = track.getBoundingClientRect(), f = cur();
      const go = ev => seek((ev.clientX - r.left) / r.width * f.dur); go(e);
      const up = () => { removeEventListener('pointermove', go); removeEventListener('pointerup', up); };
      addEventListener('pointermove', go); addEventListener('pointerup', up);
    });
    function setZoom(z) { const f = cur(), keep = f.t / f.dur; st.zoom = z; paintTl(); scroller.scrollLeft = keep * track.clientWidth - scroller.clientWidth / 2; }
    function tlMenu(anchor) {
      const old = tl.querySelector('.msl-menu'); if (old) { old.remove(); return; }
      const m = h('div', { class: 'msl-menu' },
        h('button', { onclick: () => { m.remove(); autoTrim(); } }, T('Auto : silences début/fin', 'Auto: start/end silence')),
        h('button', { onclick: () => { m.remove(); st.hints = !st.hints; paintTl(); } }, (st.hints ? '✓ ' : '   ') + T('Rappel des touches', 'Key hints')));
      tl.append(m); m.style.right = '12px'; m.style.top = anchor.offsetTop + 30 + 'px';
      later(() => addEventListener('pointerdown', function off(ev) { if (!m.contains(ev.target)) { m.remove(); removeEventListener('pointerdown', off); } }), 0);
    }
    function autoTrim() {
      const f = cur(), q = f.quiet, a = q.find(([x]) => x === 0) ? q.find(([x]) => x === 0)[1] : 0, endQ = q.find(([, y]) => y >= f.dur - .01), b = endQ ? endQ[0] : f.dur;
      if (!a && b === f.dur) { say(T('Aucun silence d’ouverture ou de fin détecté.', 'No opening or closing silence detected.')); return; }
      push(f); f.segs = [{ id: Math.random(), a, b }]; f.sel = 0; sfx.pop(); paintAll();
    }
    function applySilences(f, quiet) {
      if (!f.segs.length) return T('Posez d’abord des morceaux : je resserrerai leurs bords sur le son.', 'Place some pieces first: I’ll tighten their edges on the sound.');
      push(f); let g = 0;
      for (const s of f.segs) for (const [a, b] of f.quiet) { if (a <= s.a + .05 && b > s.a && b < s.b) { g += b - s.a; s.a = b; } if (b >= s.b - .05 && a < s.b && a > s.a) { g += s.b - a; s.b = a; } }
      const msg = g > .05 ? T(`Blancs retirés : gain de ${tm(g)} (⌘Z pour annuler)`, `Silences removed: ${tm(g)} saved (⌘Z to undo)`) : (f.undo.pop(), T('Aucun blanc à retirer', 'No silence to remove'));
      if (!quiet) say(msg); return msg;
    }
    async function removeSilences() {
      const f = cur(); st.silBusy = 0; paintRight();
      for (let p = 0; p <= 100; p += 10) { await wait(reduced() ? 5 : 60); if (!root.isConnected) return; st.silBusy = p; if (st.tab === 'cut') paintRight(); }
      st.silBusy = -1; applySilences(f); sfx.done(); paintAll();
    }
    function toggleVoice() { st.o.voice = !st.o.voice; voiceB.classList.toggle('on', st.o.voice); sfx.tick(); say(st.o.voice ? T('Voix seules : musique et bruits d’arrière-plan retirés à l’écoute et à l’export.', 'Voice only: music and background noise removed for listening and export.') : T('Son original.', 'Original sound.')); paintRight(); }

    /* ---------- lecture ---------- */
    function loop(ts) { const f = cur(), dt = Math.min(.1, (ts - last) / 1000); last = ts; f.t += dt * st.play; if (f.t >= f.dur || f.t <= 0) { f.t = clamp(f.t, 0, f.dur); stopPlay(); } drawFrame(); follow(); if (st.play && root.isConnected) raf = requestAnimationFrame(loop); }
    function startPlay(sp) { st.play = sp; cancelAnimationFrame(raf); last = performance.now(); if (cur().t >= cur().dur && sp > 0) cur().t = 0; raf = requestAnimationFrame(loop); drawFrame(); }
    function stopPlay() { st.play = 0; cancelAnimationFrame(raf); if (root.isConnected) drawFrame(); }
    function togglePlay() { st.play ? stopPlay() : startPlay(1); }

    /* ---------- feuilles ---------- */
    function openSheet(el, cls = '') { closeSheet(); sheet = h('div', { class: 'msl-shade ' + cls, onclick: e => e.target === sheet && sheet.dataset.esc !== 'no' && closeSheet() }, el); root.append(sheet); return sheet; }
    function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
    function shortcuts() {
      sfx.tick();
      openSheet(h('div', { class: 'msl-sheet', style: { width: '420px' } }, h('h3', {}, T('Raccourcis', 'Shortcuts')),
        ...[['I', T('Marquer l’entrée du morceau', 'Mark the piece’s in point')], ['O', T('Marquer la sortie (crée le morceau)', 'Mark the out point (creates the piece)')], [T('Espace', 'Space'), T('Lecture', 'Play')], ['J  K  L', T('Vitesse', 'Speed')],
          ['←  →', T('Image', 'Frame')], ['⇧← ⇧→', T('Avancer / reculer d’une seconde', 'Step one second')], ['↑  ↓', T('Image clé suivante / précédente', 'Next / previous keyframe')], ['[  ]', T('Morceau précédent / suivant', 'Previous / next piece')],
          ['⌫', T('Supprimer', 'Delete')], ['⌘Z', T('Annuler', 'Undo')], ['⌘↩', T('Extraire', 'Extract')], ['Home  End', T('Début / fin du fichier', 'Start / end of file')]].map(([k, l]) => h('div', { class: 'msl-kr' }, h('kbd', {}, k), h('span', {}, l))),
        h('div', { class: 'msl-sb' }, h('button', { class: 'msl-btn pri', onclick: closeSheet }, T('Fermer', 'Close')))));
    }
    const seg2 = (opts, val, fn) => h('div', { class: 'msl-seg' }, ...opts.map(([v, l]) => h('button', { class: v === val ? 'on' : '', onclick: () => { fn(v); sfx.tick(); } }, l)));
    const swt = (on, fn) => { const b = h('button', { class: 'msl-sw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(on), onclick: () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); sfx.tick(); fn(on); } }, h('i')); return b; };
    function options() {
      const f = cur(), o = st.o; sfx.tick();
      const draw = () => {
        const tails = m => { const save = o.merge; o.merge = m; const L = outs(f).map(x => x.name.replace(/\.[^.]+$/, '')); o.merge = save; if (L.length < 2) return L[0] || ''; const tail = L.map(n => '…' + n.slice(-3)); return tail.length > 3 ? tail.slice(0, 2).join(', ') + ', … ' + tail[tail.length - 1] : tail.join(', '); };
        const choice = (on, t, sub, fn) => h('button', { class: 'msl-choice' + (on ? ' on' : ''), onclick: () => { fn(); sfx.tick(); draw(); } }, h('b', {}, t), h('small', {}, sub));
        const vid = f.kind === 'video', copy = vid ? ['same', 'mp4', 'mov', 'mkv'] : ['same'], all = vid ? ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'm4a', 'wav', 'flac', 'aiff', 'opus'] : ['mp3', 'm4a', 'wav', 'flac', 'aiff', 'opus'];
        const sel = h('select', { class: 'msl-select', 'aria-label': T('Format', 'Format'), onchange: e => { const [m, v] = e.target.value.split(':'); o.pass = m === 'c'; o.fmt = v; if (!o.pass && v === 'same') o.fmt = 'same'; if (o.pass) o.sil = f.kind === 'audio' ? o.sil : false; draw(); } },
          h('optgroup', { label: T('Sans recompression', 'No re-encoding') }, ...copy.map(v => h('option', { value: 'c:' + v, selected: o.pass && o.fmt === v }, v === 'same' ? T('Même format que l’original, sans recompression', 'Same format as the original, no re-encoding') : T(`${v.toUpperCase()}, sans recompression`, `${v.toUpperCase()}, no re-encoding`)))),
          h('optgroup', { label: T('Recompresser en…', 'Re-encode as…') }, ...all.map(v => h('option', { value: 'r:' + v, selected: !o.pass && (o.fmt === v || (o.fmt === 'same' && v === (vid ? 'mp4' : 'm4a'))) }, T(`Recompressé en ${v.toUpperCase()}`, `Re-encoded as ${v.toUpperCase()}`)))));
        const n = outs(f).length, e2 = est(f), gain = silGain(f);
        const voiceNote = o.voice ? (o.voiceReady >= 100 ? T('Musique et bruits d’arrière-plan retirés. Calcul fait une fois par fichier (prêt).', 'Music and background noise removed. Computed once per file (ready).') : o.voiceReady > 0 ? T(`Préparation de la piste des voix… ${o.voiceReady} %`, `Preparing the voice track… ${o.voiceReady}%`) : T('Musique et bruits d’arrière-plan retirés. Calcul fait une fois par fichier.', 'Music and background noise removed. Computed once per file.')) : '';
        const box = h('div', { class: 'msl-sheet opt' }, h('h3', {}, T(`Exporter ${f.segs.length} ${P(f.segs.length, 'morceau', 'morceaux')}`, `Export ${f.segs.length} ${P(f.segs.length, 'piece', 'pieces')}`)),
          h('div', { class: 'msl-q' }, h('label', {}, T('Combien de fichiers ?', 'How many files?')), choice(!o.merge, T('Un fichier par morceau', 'One file per piece'), tails(false), () => { o.merge = false; }), choice(o.merge, T('Tout dans un seul fichier', 'Everything in one file'), tails(true), () => { o.merge = true; })),
          h('div', { class: 'msl-q' }, h('label', {}, 'Format'), sel, h('small', {}, o.pass ? T('Rapide et sans perte. Le début peut reculer jusqu’à l’image clé la plus proche.', 'Fast and lossless. The start can move back to the nearest keyframe.') : T('Coupe à l’image près ; plus long à calculer.', 'Cuts to the exact frame; takes longer.'))),
          h('div', { class: 'msl-q' }, h('label', {}, T('Son', 'Sound')), seg2([[false, 'Original'], [true, T('Voix seules', 'Voice only')]], o.voice, v => { o.voice = v; voiceB.classList.toggle('on', v); if (v && !o.voiceReady) buildVoice(draw); draw(); }), voiceNote ? h('small', {}, voiceNote) : null),
          h('div', { class: 'msl-q' }, h('label', {}, T('Blancs', 'Silences')), seg2([[false, T('Garder', 'Keep')], [true, T('Retirer', 'Remove')]], o.sil, v => { o.sil = v; if (v && f.kind === 'video') o.pass = false; draw(); }),
            o.sil ? h('div', { class: 'msl-int' }, h('span', {}, T('Doux', 'Gentle')), h('input', { type: 'range', min: 0, max: 1, step: .05, value: o.inten, 'aria-label': T('Intensité', 'Intensity'), oninput: ev => { o.inten = +ev.target.value; nt.textContent = note(); } }), h('span', {}, T('Serré', 'Tight'))) : null,
            o.sil ? h('small', { class: 'nt' }) : null),
          h('div', { class: 'msl-q' }, h('label', {}, T('Enregistrer dans', 'Save in')), h('div', { class: 'msl-fold' }, h('b', {}, o.folder || T('Même dossier que l’original', 'Same folder as the original')), h('button', { class: 'msl-btn sm', onclick: () => { o.folder = o.folder ? '' : T('Extraits', 'Clips'); sfx.tick(); draw(); } }, T('Choisir…', 'Choose…')))),
          h('button', { class: 'msl-more', onclick: () => { o.more = !o.more; draw(); } }, h('span', {}, T('Plus d’options : noms, numérotation, codec, qualité', 'More options: names, numbering, codec, quality')), h('b', {}, o.more ? '▾' : '▸')),
          o.more ? h('div', { class: 'msl-q' }, ...(o.merge ? [nameField(f.merge, baseOf(f) + '_' + o.suffix, ext(f), v => { f.merge = v; })] : [h('label', {}, T('Noms des fichiers', 'File names')), nameField(f.base, f.name, null, v => { f.base = v; draw(); }), ...sorted(f).map((s, i) => nameField(s.name, baseOf(f) + '_' + pad(i + 1), ext(f), v => { s.name = v || undefined; }))]),
            !o.pass && vid && !/mp3|m4a|wav|flac|aiff|opus/.test(o.fmt) ? h('div', { class: 'msl-kv' }, h('span', {}, T('Codec · qualité', 'Codec · quality')), h('b', {}, (o.fmt === 'webm' ? 'VP9' : 'H.264') + T(' · Haute', ' · High'))) : null,
            h('div', { class: 'msl-kv' }, h('span', {}, T('Taille estimée', 'Estimated size')), h('b', {}, '≈ ' + size(e2.mb))), h('div', { class: 'msl-kv' }, h('span', {}, T('Durée du traitement', 'Processing time')), h('b', {}, '≈ ' + Math.max(1, Math.ceil(e2.sec)) + ' s'))) : null,
          h('div', { class: 'msl-sb' }, h('button', { class: 'msl-btn', onclick: () => { closeSheet(); paintRight(); } }, T('Annuler', 'Cancel')),
            h('button', { class: 'msl-btn pri', disabled: !n || (o.voice && o.voiceReady < 100), onclick: () => { closeSheet(); runExport(); } }, o.voice && o.voiceReady < 100 ? T('Préparation…', 'Preparing…') : T(`Exporter ${n} ${P(n, 'fichier', 'fichiers')}`, `Export ${n} ${P(n, 'file', 'files')}`))));
        const note = () => T(`Blancs retirés ${o.merge ? 'au début, à la fin et à l’intérieur de chaque morceau' : 'au début et à la fin de chaque morceau'} : gain de ${tm(silGain(f))}, avec ${num(.6 - o.inten * .45)} s de respiration gardée entre les prises.`, `Silences removed ${o.merge ? 'at the start, the end and inside each piece' : 'at the start and end of each piece'}: ${tm(silGain(f))} saved, with ${num(.6 - o.inten * .45)} s of breathing room kept between takes.`) + (f.kind === 'video' ? T(' Recompression nécessaire pour couper au plus juste.', ' Re-encoding is needed to cut precisely.') : '');
        const nt = box.querySelector('.nt'); if (nt) nt.textContent = note(); void gain;
        if (sheet && sheet.classList.contains('optS')) sheet.replaceChildren(box); else openSheet(box, 'optS');
        paintRight();
      };
      draw();
    }
    function nameField(v, ph, ex, fn) { const inp = h('input', { class: 'msl-in mono', value: v || '', placeholder: ph, 'aria-label': ph, onkeydown: e => e.stopPropagation(), oninput: e => fn(e.target.value.trim().replace(/[/:]/g, '-')) }); return h('div', { class: 'msl-nf' }, inp, ex ? h('span', {}, '.' + ex) : null); }
    async function buildVoice(redraw) { for (let p = 5; p <= 100; p += 5) { await wait(reduced() ? 5 : 90); if (!root.isConnected) return; st.o.voiceReady = p; if (sheet && sheet.classList.contains('optS')) redraw(); } }
    async function runExport() {
      const f = cur(), L = outs(f); if (!L.length) return; stopPlay(); sfx.click();
      const items = L.map(x => ({ ...x, p: 0, state: 'wait', mb: x.dur * rate(f) * (st.o.sil ? .93 : 1) })); let cancel = false; const t0 = performance.now();
      const rows = items.map(it => { const bar = h('u'), stt = h('em', {}, T('En attente', 'Waiting')); it.el = { bar, stt }; return h('div', { class: 'msl-xi' }, h('div', {}, h('code', {}, it.name), stt), h('i', {}, bar)); });
      const overall = h('span', { class: 'tk-dim' }, T('0 % terminé', '0% done'));
      const sh = openSheet(h('div', { class: 'msl-sheet' }, h('h3', {}, T('Extraction en cours', 'Extracting')),
        h('p', { class: 'tk-dim' }, `${f.name}.${f.ext} → ${items.length} ${P(items.length, T('fichier', 'file'), T('fichiers', 'files'))}` + (st.o.pass ? T(' · Sans recompression', ' · No re-encoding') : '') + ' · ' + (st.o.folder || T('Même dossier que l’original', 'Same folder as the original'))),
        h('div', { class: 'msl-xl' }, ...rows), h('div', { class: 'msl-sb sp' }, overall, h('button', { class: 'msl-btn', onclick: () => { cancel = true; } }, T('Annuler', 'Cancel'), h('kbd', {}, 'Esc')))));
      sh.dataset.esc = 'no'; sh.cancel = () => { cancel = true; };
      const per = it => st.o.pass && !st.o.sil ? (reduced() ? 20 : 260 + it.dur * 8) : (reduced() ? 40 : 600 + it.dur * 70);
      for (const it of items) {
        if (cancel) break; it.state = 'run'; const T0 = performance.now(), D = per(it);
        while (!cancel) { await wait(30); if (!root.isConnected) return; it.p = Math.min(1, (performance.now() - T0) / D); it.el.bar.style.width = it.p * 100 + '%'; it.el.stt.textContent = Math.round(it.p * 100) + ' %';
          const ov = items.reduce((s, x) => s + (x.state === 'done' ? 1 : x === it ? it.p : 0), 0) / items.length; overall.textContent = T(`${Math.round(ov * 100)} % terminé`, `${Math.round(ov * 100)}% done`); if (it.p >= 1) break; }
        if (cancel) break; it.state = 'done'; it.el.stt.textContent = '✓ ' + size(it.mb);
      }
      if (cancel) { items.filter(x => x.state !== 'done').forEach(x => { x.el.stt.textContent = T('Annulé', 'Cancelled'); }); sfx.off(); await wait(500); closeSheet(); say(T('Extraction annulée. Les fichiers inachevés sont retirés.', 'Extraction cancelled. Unfinished files are removed.')); return; }
      const el = (performance.now() - t0) / 1000, totMb = items.reduce((s, x) => s + x.mb, 0); f.done = true; sfx.done(); paintSide();
      openSheet(h('div', { class: 'msl-sheet' }, h('div', { class: 'msl-done' }, h('i', {}, '✓'), h('h3', {}, `${items.length} ${P(items.length, T('fichier créé', 'file created'), T('fichiers créés', 'files created'))}`), h('p', { class: 'tk-dim' }, T(`${size(totMb)} · ${num(el)} s · dans le dossier choisi`, `${size(totMb)} · ${num(el)} s · in the chosen folder`))),
        h('div', { class: 'msl-xl' }, ...items.map(it => h('div', { class: 'msl-di' }, h('code', {}, it.name), h('span', { class: 'tk-dim' }, tm(it.dur) + ' · ' + size(it.mb))))),
        h('div', { class: 'msl-sb' }, h('button', { class: 'msl-btn', onclick: () => { closeSheet(); say(T(`« ${f.name}.${f.ext} » mis à la corbeille (démo : rien n’est supprimé).`, `“${f.name}.${f.ext}” moved to the Trash (demo: nothing is deleted).`)); } }, T('Mettre l’original à la corbeille', 'Move the original to the Trash')),
          h('button', { class: 'msl-btn', onclick: () => say(T('Démo : les fichiers ne sont pas réellement créés.', 'Demo: the files are not actually created.')) }, T('Révéler dans le Finder', 'Reveal in Finder')),
          h('button', { class: 'msl-btn pri', onclick: closeSheet }, T('Fermer', 'Close')))));
      if (st.o.reveal) say(T('Révélé dans le Finder (démo).', 'Revealed in Finder (demo).'));
    }
    function settings() {
      const o = st.o; sfx.tick();
      const row = (l, c) => h('div', { class: 'msl-sr' }, h('span', {}, l), c);
      openSheet(h('div', { class: 'msl-sheet set' }, h('h3', {}, T('Réglages', 'Settings')),
        h('div', { class: 'msl-h2' }, T('Général', 'General')),
        row(T('Langue', 'Language'), h('span', { class: 'tk-dim' }, T('Automatique (langue du Mac)', 'Automatic (Mac language)'))),
        row(T('Apparence', 'Appearance'), seg2([['auto', 'Auto'], [false, T('Sombre', 'Dark')], [true, T('Clair', 'Light')]], st.light, v => { st.light = v === 'auto' ? matchMedia('(prefers-color-scheme: light)').matches : v; root.classList.toggle('light', st.light); drawStrip(); drawFrame(); settings(); })),
        h('div', { class: 'msl-h2' }, 'Export'),
        row(T('Chiffres de la numérotation', 'Numbering digits'), seg2([[2, '01'], [3, '001']], o.digits, v => { o.digits = v; paintRight(); settings(); })),
        row(T('Nom du fichier fusionné', 'Merged file name'), h('input', { class: 'msl-in r', value: o.suffix, 'aria-label': 'suffix', onkeydown: e => e.stopPropagation(), oninput: e => { o.suffix = e.target.value.trim() || T('extrait', 'extract'); } })),
        row(T('Révéler dans le Finder après l’export', 'Reveal in Finder after export'), swt(o.reveal, v => { o.reveal = v; })),
        row(T('Mettre l’original à la corbeille après l’export', 'Move the original to the Trash after export'), swt(o.trash, v => { o.trash = v; })),
        h('div', { class: 'msl-h2' }, 'Finder'),
        row(T('Extension du clic droit', 'Right-click extension'), h('span', { class: 'msl-ok' }, '● ' + T('Active', 'Active'))),
        h('div', { class: 'msl-h2' }, T('Mises à jour', 'Updates')),
        row(T('Installer automatiquement', 'Install automatically'), swt(o.auto, v => { o.auto = v; })),
        row(T('Version 1.20.2', 'Version 1.20.2'), h('button', { class: 'msl-btn sm', onclick: async e => { const b = e.currentTarget; b.textContent = T('Recherche…', 'Checking…'); await wait(reduced() ? 10 : 1000); if (b.isConnected) b.textContent = T('À jour ✓', 'Up to date ✓'); } }, T('Rechercher', 'Check now'))),
        h('p', { class: 'msl-about', html: T('À propos de ', 'About ') + lc + ' · DESKTOP MAC TOOLKIT' }),
        h('div', { class: 'msl-sb' }, h('button', { class: 'msl-btn pri', onclick: closeSheet }, T('Fermer', 'Close')))));
    }

    /* ---------- clavier ---------- */
    const key = e => {
      if (!root.isConnected) { removeEventListener('keydown', key); return; }
      if (S.active !== w || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const f = cur(), k = e.key, cmd = e.metaKey || e.ctrlKey;
      if (sheet) { if (k === 'Escape') { e.preventDefault(); sheet.cancel ? sheet.cancel() : closeSheet(); } return; }
      let hit = true;
      if (cmd && k === '/') shortcuts(); else if (cmd && k === ',') settings(); else if (cmd && (k === 'z' || k === 'Z')) undo(); else if (cmd && k === 'Enter') runExport();
      else if (cmd) hit = false;
      else if (k === 'i' || k === 'I') markIn(); else if (k === 'o' || k === 'O') markOut(); else if (k === ' ') togglePlay();
      else if (k === 'l' || k === 'L') startPlay(st.play > 0 ? Math.min(4, st.play * 2) : 1); else if (k === 'k' || k === 'K') stopPlay(); else if (k === 'j' || k === 'J') startPlay(st.play < 0 ? Math.max(-4, st.play * 2) : -1);
      else if (k === 'ArrowLeft') seek(f.t - (e.shiftKey ? 1 : 1 / (f.fps || 25))); else if (k === 'ArrowRight') seek(f.t + (e.shiftKey ? 1 : 1 / (f.fps || 25)));
      else if (k === 'ArrowUp' && f.kf.length) seek(f.kf.find(x => x > f.t + .01) ?? f.t); else if (k === 'ArrowDown' && f.kf.length) seek(prevKf(f, f.t - .02));
      else if (k === '[') stepPiece(-1); else if (k === ']') stepPiece(1); else if (k === 'Home') seek(0); else if (k === 'End') seek(f.dur);
      else if ((k === 'Backspace' || k === 'Delete') && f.segs[f.sel]) delSeg(f.segs[f.sel]); else if (k === 'Escape' && f.pin != null) { f.pin = null; paintSegs(); }
      else hit = false;
      if (hit) e.preventDefault();
    };
    addEventListener('keydown', key);

    /* ---------- ensemble ---------- */
    function paintAll() { paintMeta(); paintSide(); paintRight(); paintTl(); }
    audioArt.append(...Array.from({ length: 61 }, () => h('i')));
    ro = new ResizeObserver(() => { if (!root.isConnected) { ro.disconnect(); return; } drawStrip(); drawFrame(); }); ro.observe(scroller); ro.observe(player);
    requestAnimationFrame(() => { paintAll(); });
    paintMeta(); paintSide(); paintRight();
    return root;
  }, 'msl-win');
}
