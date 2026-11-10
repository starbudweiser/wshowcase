/* qLOOKS : aperçus Coup d'œil et vignettes pour les formats que macOS ignore. Démo : un dossier du Finder où l'on appuie sur Espace (avec ou sans qLOOKS), puis les vraies pages de l'appli. Tout est dessiné ici, aucun fichier n'est lu. */
import { dlBtn, toast, icon, h, brand, esc, wait, reduced, clamp, sfx, wm, T, css } from './kit.js';
import { lang } from '../i18n.js';

const loc = () => (lang() === 'fr' ? 'fr-FR' : 'en-US');
const fmtN = (n, d = 1) => n.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
const sz = mb => { const fr = lang() === 'fr'; return mb >= 1024 ? fmtN(mb / 1024) + (fr ? ' Go' : ' GB') : mb >= 10 ? fmtN(Math.round(mb), 0) + (fr ? ' Mo' : ' MB') : mb >= 1 ? fmtN(mb) + (fr ? ' Mo' : ' MB') : fmtN(Math.max(1, Math.round(mb * 1024)), 0) + (fr ? ' Ko' : ' KB'); };
const loadCss = u => new Promise(res => { css(u); const l = document.querySelector(`link[data-k="${u}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res); l.addEventListener('error', res); setTimeout(res, 800); });
let BC = '#bf5af2'; const bt = s => esc(s).split('qLOOKS').join(brand('qLOOKS', BC)); /* nom de l'appli coloré dans un texte */
const ease = k => 1 - Math.pow(1 - k, 3);
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

const I = {
  settings: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  formats: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  editor: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  trial: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  updates: '<circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/>',
  play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'
};
const svg = (k, cls = '') => { const t = document.createElement('template'); t.innerHTML = `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${I[k]}</svg>`; return t.content.firstChild; };

/* ---------- formats pris en charge (registre de l'appli, version par version) ---------- */
const NOTE = {
  mov: ['PNG, Animation et vidéos à couche alpha sur damier ; lecture du son par le système.', 'PNG, Animation and alpha videos on a checkerboard; sound played by the system.'],
  mkv: ['H.264, HEVC, VP9, AV1 ; vignettes pour H.264 et HEVC.', 'H.264, HEVC, VP9, AV1; thumbnails for H.264 and HEVC.'],
  eps: ['Rendu du dessin, ou aperçu intégré au fichier.', 'Drawing rendered, or the preview embedded in the file.'],
  ai: ['Anciens fichiers Illustrator et FreeHand (PostScript) et fichiers PDF.', 'Old Illustrator and FreeHand files (PostScript) and PDF-based files.'],
  c4d: ['Modèle 3D si Cinema 4D est installé, sinon image d’aperçu du fichier.', '3D model if Cinema 4D is installed, otherwise the file’s preview image.'],
  max: ['Image d’aperçu enregistrée dans le fichier.', 'Preview image stored in the file.'],
  dmg: ['Contenu des volumes HFS+ et APFS, sans monter l’image.', 'Contents of HFS+ and APFS volumes, without mounting the image.'],
  code: ['Une quarantaine de langages, coloration syntaxique.', 'About forty languages, syntax highlighting.'],
  apps: ['Version, signature, notarisation, architectures, droits.', 'Version, signature, notarization, architectures, entitlements.']
};
const CAT = { video: ['Vidéo', 'Video'], image: ['Images vectorielles', 'Vector images'], model: ['Modèles 3D', '3D models'], archive: ['Archives et dossiers', 'Archives and folders'], document: ['Documents', 'Documents'], dev: ['Développement', 'Development'], geo: ['Cartes', 'Maps'] };
const VERS = ['1.0.0', '1.1.0'];
const FMT0 = () => [
  ['QuickTime', ['mov'], 'video', '1.0.0', 1, 1, NOTE.mov], ['Matroska', ['mkv'], 'video', '1.0.0', 1, 1, NOTE.mkv],
  ['SVG', ['svg'], 'image', '1.1.0', 1, 1], ['EPS', ['eps'], 'image', '1.1.0', 1, 1, NOTE.eps], ['Illustrator / FreeHand', ['ai'], 'image', '1.1.0', 1, 0, NOTE.ai],
  ['STL', ['stl'], 'model', '1.1.0', 1, 1], ['OBJ', ['obj'], 'model', '1.1.0', 1, 1], ['PLY', ['ply'], 'model', '1.1.0', 1, 1], ['USD', ['usd', 'usda', 'usdc', 'usdz'], 'model', '1.1.0', 1, 1], ['Alembic', ['abc'], 'model', '1.1.0', 1, 1],
  ['Collada', ['dae'], 'model', '1.1.0', 1, 1], ['SceneKit', ['scn'], 'model', '1.1.0', 1, 1], ['3MF', ['3mf'], 'model', '1.1.0', 1, 1], ['3D Studio', ['3ds'], 'model', '1.1.0', 1, 1], ['LightWave', ['lwo', 'lws'], 'model', '1.1.0', 1, 1],
  ['Cinema 4D', ['c4d'], 'model', '1.1.0', 1, 1, NOTE.c4d], ['3ds Max', ['max'], 'model', '1.1.0', 1, 1, NOTE.max],
  ['ZIP', ['zip'], 'archive', '1.1.0', 1, 0], ['TAR / TGZ / GZ', ['tar', 'tgz', 'tar.gz', 'gz'], 'archive', '1.1.0', 1, 0], ['RAR', ['rar'], 'archive', '1.1.0', 1, 0], ['7-Zip', ['7z'], 'archive', '1.1.0', 1, 0], ['DMG', ['dmg'], 'archive', '1.1.0', 1, 0, NOTE.dmg], [['Dossiers', 'Folders'], [], 'archive', '1.1.0', 1, 0],
  ['Markdown', ['md', 'markdown', 'qmd', 'rmd'], 'document', '1.1.0', 1, 0],
  [['Code source', 'Source code'], ['swift', 'py', 'js', 'ts', 'c', 'cpp', 'h', 'm', 'java', 'go', 'rs', 'rb', 'php', 'sh', 'json', 'yml', 'xml', 'sql', 'css'], 'dev', '1.1.0', 1, 0, NOTE.code], [['Applications et modules', 'Apps and bundles'], ['app', 'appex', 'framework', 'bundle', 'plugin', 'dylib'], 'dev', '1.1.0', 1, 0, NOTE.apps],
  ['GPX', ['gpx'], 'geo', '1.1.0', 1, 0]
].map(([name, exts, cat, since, preview, thumb, note]) => ({ name, exts, cat, since, preview: !!preview, thumb: !!thumb, note }));

/* ---------- vidéos d'exemple dessinées au canvas : des plans à couche alpha, comme ceux que macOS ne lit pas ---------- */
const SAMPLES = {
  logo: { file: 'logo_reveal.mov', codec: 'ProRes 4444', fps: 24, alpha: true, dur: 4, draw(c, t, W, H) {
    c.clearRect(0, 0, W, H); const cx = W / 2, cy = H / 2, s = Math.min(W, H) * 0.24, k = ease(clamp(t / 1.2, 0, 1)), fade = t > 3.4 ? 1 - (t - 3.4) / 0.6 : 1;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, s * 2.4); g.addColorStop(0, `rgba(191,90,242,${.6 * k * fade})`); g.addColorStop(1, 'rgba(191,90,242,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = fade; c.lineCap = 'round'; c.strokeStyle = '#fff'; c.lineWidth = s * .17; c.beginPath(); c.arc(cx, cy, s * k, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#bf5af2'; c.beginPath(); c.arc(cx, cy, s * .34 * k, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#ff9f0a'; c.lineWidth = s * .07; for (let i = 0; i < 3; i++) { const a = t * (1.1 + i * .45) + i * 2.1; c.beginPath(); c.arc(cx, cy, s * (1.38 + i * .22) * k, a, a + 1.5); c.stroke(); }
    c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const a = -t * .9 + (i * Math.PI * 2) / 5; c.beginPath(); c.arc(cx + Math.cos(a) * s * 2 * k, cy + Math.sin(a) * s * 2 * k, s * .08, 0, 7); c.fill(); } c.globalAlpha = 1;
  } },
  lower: { file: 'lower_third.mov', codec: 'PNG', fps: 25, alpha: true, dur: 4, draw(c, t, W, H) {
    c.clearRect(0, 0, W, H); const pw = W * .56, ph = H * .2, x0 = W * .06, y0 = H * .66, p = t < .7 ? ease(t / .7) : t > 3.2 ? 1 - ease((t - 3.2) / .7) : 1, x = x0 - (pw + x0) * (1 - p);
    c.fillStyle = 'rgba(18,18,22,.88)'; c.fillRect(x, y0, pw, ph); c.fillStyle = '#ff9f0a'; c.fillRect(x, y0, Math.max(6, W * .01), ph);
    c.fillStyle = '#fff'; c.font = `700 ${Math.round(ph * .34)}px -apple-system,Helvetica,Arial,sans-serif`; c.textBaseline = 'alphabetic'; c.fillText('Stéphan Le Gac', x + W * .035, y0 + ph * .5);
    c.fillStyle = '#bbb'; c.font = `400 ${Math.round(ph * .22)}px -apple-system,Helvetica,Arial,sans-serif`; c.fillText(lang() === 'fr' ? 'Développeur d’applis Mac' : 'Mac app developer', x + W * .035, y0 + ph * .8);
  } },
  hero: { file: 'hero_shot.mkv', codec: 'H.264', fps: 30, alpha: false, dur: 6, draw(c, t, W, H) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1c2a52'); g.addColorStop(.6, '#7a5a8c'); g.addColorStop(1, '#f2a65a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(W * .72, H * (.5 + Math.sin(t * .5) * .02), H * .09, 0, 7); c.fill();
    [['#4a3f78', .55, .07, 22, .5], ['#2d2a56', .68, .09, 34, 1], ['#16142e', .82, .08, 50, 1.8]].forEach(([col, base, amp, sp, v]) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, H * base + Math.sin((x + t * sp * v * 4) / (sp * 2.2)) * H * amp + Math.sin((x + t * 30) / 90) * H * .01); c.lineTo(W, H); c.fill(); });
    const bx = ((t * W * .16) % (W * 1.2)) - W * .1, by = H * .3 + Math.sin(t * 2) * H * .015; c.strokeStyle = '#16142e'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 10, by); c.quadraticCurveTo(bx - 4, by - 7 - Math.sin(t * 9) * 5, bx, by); c.quadraticCurveTo(bx + 4, by - 7 - Math.sin(t * 9) * 5, bx + 10, by); c.stroke();
  } }
};
const CHECK = (c, W, H) => { const n = 10; for (let y = 0; y < H / n; y++) for (let x = 0; x < W / n; x++) { c.fillStyle = (x + y) % 2 ? '#3a3a3a' : '#4a4a4a'; c.fillRect(x * n, y * n, n, n); } };
function sizeCanvas(cv) { const r = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)), w = cv.clientWidth || 1, hh = cv.clientHeight || 1; if (cv.width !== Math.round(w * r) || cv.height !== Math.round(hh * r)) { cv.width = Math.round(w * r); cv.height = Math.round(hh * r); } return [cv.width / r, cv.height / r, r]; }

/* ---------- maillage 3D : un joint torique, dessiné facette par facette ---------- */
const TORUS = (() => {
  const U = 40, V = 18, R = 1, r = .42, vs = [], ns = [], fs = [];
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) { const u = (i / U) * Math.PI * 2, v = (j / V) * Math.PI * 2; vs.push([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)]); ns.push([Math.cos(v) * Math.cos(u), Math.sin(v), Math.cos(v) * Math.sin(u)]); }
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) fs.push([i * V + j, ((i + 1) % U) * V + j, ((i + 1) % U) * V + (j + 1) % V, i * V + (j + 1) % V]);
  return { vs, ns, fs, tris: fs.length * 2 };
})();
function drawTorus(cv, a, b, fixed) {
  const r0 = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); if (fixed) { cv.width = fixed[0] * r0; cv.height = fixed[1] * r0; }
  const [W, H, r] = fixed ? [fixed[0], fixed[1], r0] : sizeCanvas(cv), c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); c.clearRect(0, 0, W, H);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), S = Math.min(W, H) * .3;
  const rot = ([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; return [x1, y * cb - z1 * sb, y * sb + z1 * cb]; };
  const P = TORUS.vs.map(v => { const [x, y, z] = rot(v), f = 4.2 / (4.2 - z); return [W / 2 + x * S * f, H / 2 - y * S * f, z]; }), N = TORUS.ns.map(rot);
  const L = [-.45, .62, .64], ll = Math.hypot(...L);
  const faces = TORUS.fs.map(f => { const n = [0, 1, 2].map(k => f.reduce((s, i) => s + N[i][k], 0) / 4); return { f, z: f.reduce((s, i) => s + P[i][2], 0) / 4, vis: n[2] > -.05, d: Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / ll) }; }).filter(q => q.vis).sort((x, y) => x.z - y.z);
  faces.forEach(q => { const k = .16 + .84 * Math.pow(q.d, 1.25), col = `rgb(${Math.round(30 + 130 * k)},${Math.round(90 + 140 * k)},${Math.round(150 + 100 * k)})`; c.fillStyle = col; c.strokeStyle = col; c.lineWidth = .6; c.beginPath(); c.moveTo(P[q.f[0]][0], P[q.f[0]][1]); for (let i = 1; i < 4; i++) c.lineTo(P[q.f[i]][0], P[q.f[i]][1]); c.closePath(); c.fill(); c.stroke(); });
}

/* ---------- fichiers du dossier d'essai ---------- */
const FILES = [
  { id: 'logo', name: 'logo_reveal.mov', ext: 'mov', k: ['Vidéo QuickTime', 'QuickTime movie'], mb: 48.2, thumb: true, v: 'logo' },
  { id: 'lower', name: 'lower_third.mov', ext: 'mov', k: ['Vidéo QuickTime', 'QuickTime movie'], mb: 12.6, thumb: true, v: 'lower' },
  { id: 'hero', name: 'hero_shot.mkv', ext: 'mkv', k: ['Vidéo Matroska', 'Matroska video'], mb: 186, thumb: true, v: 'hero' },
  { id: 'gasket', name: 'gasket.stl', ext: 'stl', k: ['Modèle 3D STL', 'STL 3D model'], mb: 0.8, thumb: true },
  { id: 'art', name: 'logo.svg', ext: 'svg', k: ['Image vectorielle', 'Vector image'], mb: 0.012, thumb: true },
  { id: 'pack', name: 'assets_pack.zip', ext: 'zip', k: ['Archive ZIP', 'ZIP archive'], mb: 24.5, thumb: false },
  { id: 'ride', name: 'morning_ride.gpx', ext: 'gpx', k: ['Trace GPS GPX', 'GPX track'], mb: 0.9, thumb: false },
  { id: 'code', name: 'AppDelegate.swift', ext: 'swift', k: ['Code source Swift', 'Swift source'], mb: 0.004, thumb: false }
];
const ART = '<svg class="art" viewBox="0 0 240 180" aria-hidden="true"><rect width="240" height="180" fill="#bde0fe"/><circle cx="170" cy="56" r="26" fill="#ffb703"/><path d="M0 180V118l52-44 46 40 44-62 98 78v50z" fill="#219ebc"/><path d="M0 180v-28l70-34 60 34 110-40v68z" fill="#023047"/></svg>';
const TREE = [['assets', 0, 0], ['textures', 1, 0], ['terrain_4k.dds', 2, 21.3], ['sky_dusk.dds', 2, 16.1], ['meshes', 1, 0], ['gate.nif', 2, 1.4], ['banner.nif', 2, 0.6], ['audio', 1, 0], ['ambience.wav', 2, 18.4], ['readme.md', 1, 0.004]];
const CODE = [[['c', '// AppDelegate.swift']], [['k', 'import'], ['', ' AppKit']], [['k', 'import'], ['', ' SwiftUI']], [['', '']], [['k', '@main']], [['k', 'final class'], ['', ' '], ['t', 'AppDelegate'], ['', ': '], ['t', 'NSObject'], ['', ', '], ['t', 'NSApplicationDelegate'], ['', ' {']],
  [['', '    '], ['k', 'private var'], ['', ' window: '], ['t', 'NSWindow'], ['', '?']], [['', '']], [['', '    '], ['k', 'func'], ['', ' applicationDidFinishLaunching(_ n: '], ['t', 'Notification'], ['', ') {']], [['', '        '], ['t', 'Socle'], ['', '.apply()']],
  [['', '        '], ['t', 'Socle'], ['', '.brand('], ['s', '"qLOOKS"'], ['', ', color: '], ['t', 'Brand'], ['', '.color)']], [['', '        '], ['k', 'let'], ['', ' content = '], ['t', 'ContentView'], ['', '()']], [['', '        window = '], ['t', 'NSWindow'], ['', '(contentRect: .zero, styleMask: [.titled, .closable])']],
  [['', '        window?.contentView = '], ['t', 'NSHostingView'], ['', '(rootView: content)']], [['', '        window?.makeKeyAndOrderFront('], ['k', 'nil'], ['', ')']], [['', '    }']], [['', '}']]];

export async function open(app) {
  await loadCss('css/demos/qLOOKS.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1040, h: 660, y: 96, minw: 880, minh: 540, bare: true, cls: 'socle ql',
    onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => { const mk = () => make(app, w); w.redraw = () => { w.stop && w.stop(); w.body.replaceChildren(mk()); }; return mk(); } });
}

function make(app, w) {
  BC = app.accent || BC;
  const life = { dead: false }; w.stop = () => { life.dead = true; };
  const alive = () => !life.dead && !w.dead;
  const S = { view: 'finder', page: 'settings', pref: { bg: 'chk', loop: true, auto: true }, withQ: true, sel: 'logo', ql: false, ver: VERS[1], q: '', trial: null, pick: false, reset: false, auto: true, upd: '', upState: 'idle', fmts: FMT0(),
    add: { scope: 'both', fmt: '', exts: '', brief: '', agent: 'claudeCode', key: '', run: false, log: '', done: false, stop: false, msg: '' } };
  const root = h('div', { class: 'ql-root' }), view = h('div', { class: 'ql-view' }), seg = h('div', { class: 'ql-seg bar', role: 'tablist' });
  root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('qLOOKS', app.accent) }), seg, dlBtn(app)), view);
  const drawSeg = () => seg.replaceChildren(...[['finder', T('Dans le Finder', 'In the Finder')], ['app', T('Application', 'Application')]].map(([k, l]) => h('button', { class: S.view === k ? 'on' : '', role: 'tab', 'aria-selected': S.view === k, onclick: () => { if (S.view !== k) { S.view = k; S.ql = false; S.pick = false; sfx.click(); render(); } } }, l)));
  const kindOf = f => T(f.k[0], f.k[1]);

  /* ----- lecteur à couche alpha (damier, sombre, clair), commun à l'essai et à Quick Look ----- */
  function player(sample, o = {}) {
    const cv = h('canvas', { 'aria-label': sample.file }), stage = h('div', { class: 'ql-stage ' + S.pref.bg }, cv);
    let t = 0, playing = S.pref.auto && !reduced(), last = performance.now();
    const pbtn = h('button', { 'aria-label': T('Lecture / pause', 'Play / pause'), title: T('Lecture / pause', 'Play / pause'), onclick: () => toggle() }), slider = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': T('Position', 'Position'), oninput: e => { t = (e.target.value / 1000) * sample.dur; paint(); } });
    const time = h('span', { class: 'tm' }), info = h('span', { class: 'in' }, `${sample.fps} ${T('i/s', 'fps')} · ${sample.alpha ? 'alpha' : T('sans alpha', 'no alpha')}`);
    const bgSeg = h('div', { class: 'ql-seg', role: 'group', 'aria-label': T('Fond derrière la vidéo', 'Background behind the video') }), loopB = h('button', { 'aria-label': T('Lire en boucle', 'Loop'), title: T('Lire en boucle', 'Loop'), 'aria-pressed': S.pref.loop, onclick: () => { S.pref.loop = !S.pref.loop; loopB.setAttribute('aria-pressed', S.pref.loop); sfx.tick(); } }, svg('repeat'));
    const drawBg = () => bgSeg.replaceChildren(...[['chk', T('Damier', 'Checkerboard')], ['dk', T('Sombre', 'Dark')], ['lt', T('Clair', 'Light')]].map(([k, l]) => h('button', { class: S.pref.bg === k ? 'on' : '', onclick: () => { S.pref.bg = k; stage.className = 'ql-stage ' + k; drawBg(); sfx.tick(); } }, l)));
    const icoP = () => pbtn.replaceChildren(svg(playing ? 'pause' : 'play', 'f'));
    function toggle() { if (!playing && t >= sample.dur - 0.01) t = 0; playing = !playing; last = performance.now(); icoP(); sfx.tick(); }
    function paint() { const [W, H, r] = sizeCanvas(cv), c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); sample.draw(c, t, W, H); time.textContent = mmss(t) + ' / ' + mmss(sample.dur); slider.value = Math.round((t / sample.dur) * 1000); }
    const frame = now => {
      if (!alive() || !bar.isConnected) return;
      if (playing) { t += (now - last) / 1000; if (t >= sample.dur) { if (S.pref.loop) t %= sample.dur; else { t = sample.dur; playing = false; icoP(); } } } last = now; paint(); requestAnimationFrame(frame);
    };
    const bar = h('div', { class: 'ql-pbar' }, pbtn, slider, time, info, bgSeg, loopB), el = h('div', { class: 'ql-play', style: { flex: '1', minHeight: 0 } }, stage, bar);
    drawBg(); icoP(); requestAnimationFrame(() => { paint(); requestAnimationFrame(frame); });
    if (o.space) el.addEventListener('keydown', e => { if (e.key === ' ' && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); toggle(); } });
    return el;
  }

  /* ----- aperçus Quick Look par format ----- */
  function stlPrev() {
    const cv = h('canvas'), el = h('div', { class: 'ql-3d' }, cv, h('span', {}, T(`${fmtN(TORUS.tris, 0)} triangles`, `${fmtN(TORUS.tris, 0)} triangles`))); let a = .6, b = .5, last = performance.now();
    const f = now => { if (!alive() || !el.isConnected) return; if (!reduced()) { a += (now - last) / 1000 * .7; b = .5 + Math.sin(a * .6) * .25; } last = now; drawTorus(cv, a, b); requestAnimationFrame(f); }; requestAnimationFrame(f); return el;
  }
  const svgPrev = () => h('div', { class: 'ql-svg', html: ART });
  function zipPrev() {
    const dirs = TREE.filter(r => !r[2]).length, files = TREE.length - dirs;
    return h('div', { class: 'ql-qb', style: { flex: 1 } }, h('div', { class: 'ql-tree' }, h('div', { class: 'ql-tr h' }, h('span', {}, T('Nom', 'Name')), h('span', {}, T('Taille', 'Size'))),
      ...TREE.map(([n, d, mb]) => h('div', { class: 'ql-tr' }, h('span', { class: 'n', style: { paddingLeft: d * 16 + 'px' } }, svg(mb ? 'file' : 'folder'), n), h('span', {}, mb ? sz(mb) : '')))), h('div', { class: 'ql-foot' }, T(`${files} fichiers · ${dirs} dossiers`, `${files} files · ${dirs} folders`)));
  }
  function gpxPrev() {
    const N = 90, alt = Array.from({ length: N }, (_, i) => 160 + 110 * Math.sin(i / 11) + 70 * Math.sin(i / 4.2 + 1) + i * 1.2), mx = Math.max(...alt), mn = Math.min(...alt);
    const pts = alt.map((a, i) => `${(i / (N - 1)) * 300},${60 - ((a - mn) / (mx - mn)) * 52}`).join(' L'), route = Array.from({ length: 70 }, (_, i) => { const a = (i / 69) * Math.PI * 2; return `${100 + 70 * Math.cos(a) + 14 * Math.cos(3 * a)},${60 + 42 * Math.sin(a) + 8 * Math.sin(2 * a)}`; }).join(' L');
    const st = [[T('Distance', 'Distance'), '42,6 km'], [T('Durée', 'Duration'), '2:14:08'], [T('En mouvement', 'Moving time'), '2:05:31'], [T('Vitesse moyenne', 'Average speed'), '20,4 km/h'], [T('Dénivelé +', 'Ascent'), '612 m'], [T('Dénivelé −', 'Descent'), '598 m'], [T('Altitude', 'Altitude'), '120–486 m'], [T('Points', 'Points'), '8 412'], [T('Départ', 'Start'), T('10 nov. 2026, 08:12', 'Nov 10, 2026, 08:12')]].map(([l, v]) => [l, lang() === 'fr' ? v : v.replace(',', '.').replace(' km/h', ' km/h')]);
    return h('div', { class: 'ql-gpx' }, h('div', { class: 'ql-stats' }, ...st.map(([l, v]) => h('div', {}, h('small', {}, l), h('b', {}, v)))),
      h('div', { class: 'ql-route', html: `<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M${route}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${route.split(' L')[0].split(',')[0]}" cy="${route.split(' L')[0].split(',')[1]}" r="4" fill="#4ade80"/></svg>` }),
      h('div', { class: 'ql-chart' }, h('small', {}, T('Profil d’altitude', 'Elevation profile')), h('div', { html: `<svg viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true" style="background:var(--s-sunk)"><path d="M${pts} L300,64 L0,64Z" fill="#38bdf8" opacity=".35"/><path d="M${pts}" fill="none" stroke="#38bdf8" stroke-width="1.5"/></svg>` })));
  }
  const codePrev = () => h('div', { class: 'ql-code' }, ...CODE.map((ln, i) => h('div', {}, h('i', {}, i + 1), ...ln.map(([c, tx]) => h('span', { class: c }, tx)))));
  function noPreview(f) { return h('div', { class: 'ql-none' }, h('div', { class: 'ql-gen' }, f.ext), h('b', {}, f.name), h('span', {}, kindOf(f) + ' — ' + sz(f.mb)), h('small', {}, T('Aucun aperçu disponible.', 'No preview available.'))); }
  const previewOf = f => (!S.withQ ? noPreview(f) : f.v ? player(SAMPLES[f.v]) : { gasket: stlPrev, art: svgPrev, pack: zipPrev, ride: gpxPrev, code: codePrev }[f.id]());

  /* ----- vue Finder ----- */
  function thumbOf(f) {
    if (!S.withQ || !f.thumb) return h('div', { class: 'ql-gen' }, f.ext);
    if (f.v) { const sm = SAMPLES[f.v], cv = h('canvas', { width: 240, height: 184, style: { width: '120px', height: '92px' } }), c = cv.getContext('2d'), off = document.createElement('canvas'); off.width = 240; off.height = 184; sm.draw(off.getContext('2d'), sm.alpha ? 1.8 : 2.2, 240, 184); if (sm.alpha) CHECK(c, 240, 184); c.drawImage(off, 0, 0); return cv; }
    if (f.id === 'gasket') { const cv = h('canvas', { style: { width: '120px', height: '92px', background: 'var(--s-sunk)' } }); drawTorus(cv, .6, .5, [120, 92]); return cv; }
    return h('div', { html: ART.replace('class="art"', 'class="art" width="120" height="90"') });
  }
  function viewFinder() {
    const idx = FILES.findIndex(f => f.id === S.sel);
    const tb = h('div', { class: 'ql-ftb' }, h('div', { class: 'p' }, T('Médias', 'Media'), ' ', h('span', {}, '› ' + T('Projet trailer', 'Trailer project'))), h('span', { class: 'ql-key' }, h('b', {}, T('Espace', 'Space')), ' ', T('pour l’aperçu', 'to preview'), ' · ← → '),
      h('div', { class: 'ql-seg', role: 'group', 'aria-label': T('Comparer', 'Compare') }, ...[[true, T('Avec qLOOKS', 'With qLOOKS')], [false, T('Sans qLOOKS', 'Without qLOOKS')]].map(([v, l]) => h('button', { class: S.withQ === v ? 'on' : '', html: bt(l), onclick: () => { if (S.withQ !== v) { S.withQ = v; sfx.swap(); render(); } } }))));
    const grid = h('div', { class: 'ql-grid', tabindex: '0', role: 'listbox', 'aria-label': T('Fichiers', 'Files'), onkeydown: onGridKey },
      ...FILES.map(f => h('button', { class: 'ql-tile' + (f.id === S.sel ? ' on' : ''), role: 'option', 'aria-selected': f.id === S.sel, 'data-id': f.id, onclick: () => { S.sel = f.id; sfx.tick(); grid.querySelectorAll('.ql-tile').forEach(t => { t.classList.toggle('on', t.dataset.id === f.id); t.setAttribute('aria-selected', t.dataset.id === f.id); }); grid.focus({ preventScroll: true }); }, ondblclick: () => openQL() },
        h('div', { class: 'th' }, thumbOf(f)), h('span', { class: 'nm' }, f.name))));
    return [h('div', { class: 'ql-fin' }, tb, grid, h('div', { class: 'ql-status' }, `${FILES.length} ` + T('éléments', 'items') + (FILES[idx] ? ' · ' + FILES[idx].name + ' (' + sz(FILES[idx].mb) + ')' : ''))), S.ql ? qlPanel() : null];
  }
  function onGridKey(e) {
    const i = FILES.findIndex(f => f.id === S.sel);
    if (e.key === ' ') { e.preventDefault(); S.ql ? closeQL() : openQL(); }
    else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); const cols = Math.max(1, Math.floor(e.currentTarget.clientWidth / 160)), d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key]; go(clamp(i + d, 0, FILES.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); openQL(); }
  }
  function go(j) { S.sel = FILES[j].id; if (S.ql) { sfx.tick(); render(true); } else { render(); } }
  const openQL = () => { S.ql = true; sfx.open(); render(); };
  const closeQL = () => { S.ql = false; sfx.close(); render(); };
  function qlPanel() {
    const f = FILES.find(x => x.id === S.sel), i = FILES.indexOf(f), body = h('div', { class: 'ql-qb' }, previewOf(f));
    const p = h('div', { class: 'ql-qlp', role: 'dialog', 'aria-label': f.name, tabindex: '-1', onkeydown: e => { if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); closeQL(); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.min(FILES.length - 1, i + 1)); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.max(0, i - 1)); } } },
      h('div', { class: 'ql-qh' }, h('button', { 'aria-label': T('Fermer', 'Close'), onclick: closeQL }, '×'), h('b', {}, f.name), h('span', { class: 's' })), body);
    requestAnimationFrame(() => p.focus({ preventScroll: true })); return p;
  }

  /* ----- vue Application (les vraies pages) ----- */
  const NAV = [['settings', T('Réglages', 'Settings')], ['formats', T('Formats', 'Formats')], ['editor', T('Ajouter', 'Add')], ['trial', T('Essai', 'Try it')], ['updates', T('Mises à jour', 'Updates')]];
  const card = (title, sub, ...kids) => h('section', { class: 'ql-card' }, h('h3', {}, title), sub ? h('p', { class: 'sub', html: bt(sub) }) : null, ...kids);
  const chk = (label, val, set) => h('button', { class: 'ql-chk', role: 'checkbox', 'aria-checked': val, onclick: () => { set(!val); sfx.tick(); render(); } }, h('i', { class: 'ql-cb' + (val ? ' on' : '') }), label);
  const segOf = (opts, cur, set, cls = '') => h('div', { class: 'ql-seg ' + cls }, ...opts.map(([v, l]) => h('button', { class: cur === v ? 'on' : '', onclick: () => { set(v); sfx.tick(); render(); } }, l)));
  function pageSettings() {
    const ext = (t, st) => h('div', { class: 'ql-ext' }, h('b', {}, t), h('em', { class: 'ql-chip ok' }, st));
    return [card(T('Aperçu', 'Preview'), T('S’applique à la barre d’espace du Finder et aux vignettes.', 'Applies to the Finder space bar preview and to thumbnails.'),
      h('div', { class: 'ql-row' }, h('span', { class: 'lb' }, T('Fond derrière la vidéo', 'Background behind the video')), segOf([['chk', T('Damier', 'Checkerboard')], ['dk', T('Sombre', 'Dark')], ['lt', T('Clair', 'Light')]], S.pref.bg, v => { S.pref.bg = v; })),
      chk(T('Lire en boucle', 'Loop'), S.pref.loop, v => { S.pref.loop = v; }), chk(T('Lancer la lecture à l’ouverture de l’aperçu', 'Start playing when the preview opens'), S.pref.auto, v => { S.pref.auto = v; }),
      h('p', { class: 'ql-hint' }, T('Le fond et la boucle se changent aussi depuis la barre de l’aperçu.', 'The background and loop can also be changed from the preview bar.'))),
    card(T('Extensions QuickLook', 'Quick Look extensions'), T('qLOOKS ajoute au système les aperçus et vignettes des formats qu’il ne lit pas.', 'qLOOKS adds previews and thumbnails to the system for formats it cannot read.'),
      h('div', {}, ext(T('Aperçu (barre d’espace)', 'Preview (space bar)'), T('Activée', 'Enabled')), ext(T('Vignettes du Finder', 'Finder thumbnails'), T('Activée', 'Enabled'))),
      h('div', { class: 'ql-btns' }, h('button', { class: 'sbtn', onclick: () => { sfx.click(); toast({ icon: icon(app.id), title: app.id, body: T('Ouvrirait Réglages Système › Extensions.', 'Would open System Settings › Extensions.') }); } }, T('Ouvrir les réglages des extensions', 'Open extension settings')),
        h('button', { class: 'sbtn', onclick: () => { S.reset = true; sfx.done(); render(); } }, T('Recalculer les vignettes', 'Rebuild thumbnails'))),
      h('p', { class: 'ql-hint' }, S.reset ? T('Vignettes effacées : le Finder les recalcule à l’affichage.', 'Thumbnails cleared: the Finder rebuilds them when it shows them.') : T('Les vidéos sans couche alpha gardent un lecteur classique, avec le son. Aucun fichier n’est modifié.', 'Videos without an alpha channel keep a standard player, with sound. No file is modified.')))];
  }
  function pageFormats() {
    const q = S.q.trim().toLowerCase().replace(/^\./, ''), vi = VERS.indexOf(S.ver);
    const list = S.fmts.filter(f => VERS.indexOf(f.since) <= vi).filter(f => { const n = Array.isArray(f.name) ? f.name.join(' ') : f.name; return !q || n.toLowerCase().includes(q) || f.exts.some(e => e.includes(q)); });
    const search = h('input', { class: 'ql-field', type: 'search', placeholder: T('Rechercher un format ou une extension…', 'Search a format or an extension…'), 'aria-label': T('Rechercher un format', 'Search a format'), value: S.q, oninput: e => { S.q = e.target.value; drawCats(); } });
    const cats = h('div', { style: { display: 'contents' } }), count = h('span', { class: 'ql-count' });
    const drawCats = () => {
      const l2 = S.fmts.filter(f => VERS.indexOf(f.since) <= vi).filter(f => { const n = Array.isArray(f.name) ? f.name.join(' ') : f.name; const qq = S.q.trim().toLowerCase().replace(/^\./, ''); return !qq || n.toLowerCase().includes(qq) || f.exts.some(e => e.includes(qq)); });
      count.textContent = l2.length + ' ' + T('formats', 'formats');
      cats.replaceChildren(...Object.keys(CAT).map(c => { const rows = l2.filter(f => f.cat === c); return rows.length ? card(T(CAT[c][0], CAT[c][1]), null, ...rows.map(f => h('div', { class: 'ql-frow' + (f.flash ? ' flash' : '') },
        h('div', { class: 't' }, h('b', {}, Array.isArray(f.name) ? T(f.name[0], f.name[1]) : f.name), f.since === S.ver && vi > 0 ? h('em', { class: 'ql-chip' }, T('Nouveau', 'New')) : null, f.preview ? h('em', { class: 'ql-chip' }, T('Aperçu', 'Preview')) : null, f.thumb ? h('em', { class: 'ql-chip' }, T('Vignette', 'Thumbnail')) : null),
        f.exts.length ? h('small', {}, f.exts.map(e => '.' + e).join('  ')) : null, f.note ? h('small', { class: 'n' }, T(f.note[0], f.note[1])) : null))) : null; }).filter(Boolean));
    };
    drawCats(); void list;
    return [card(T('Formats pris en charge', 'Supported formats'), T('Tout ce que qLOOKS affiche dans le Finder, version par version.', 'Everything qLOOKS shows in the Finder, version by version.'),
      h('div', { class: 'ql-row' }, h('span', { class: 'lb', style: { flex: 'none' } }, T('Version', 'Version')), segOf(VERS.map(v => [v, v]), S.ver, v => { S.ver = v; }), h('span', { style: { flex: 1 } }), count), search), cats];
  }
  function pageAdd() {
    const A = S.add, ready = A.fmt.trim() && A.exts.trim() && A.brief.trim() && (A.agent !== 'api' || A.key.trim()) || A.agent === 'copy' && A.fmt.trim() && A.exts.trim() && A.brief.trim();
    const field = (key, ph, area) => { const el = h(area ? 'textarea' : 'input', { class: 'ql-field', placeholder: ph, value: area ? null : A[key], spellcheck: 'false', 'aria-label': ph, oninput: e => { A[key] = e.target.value; upBtn(); } }); if (area) el.value = A[key]; return el; };
    const btn = h('button', { class: 'sbtn act', onclick: run }, A.agent === 'copy' ? T('Copier le prompt', 'Copy prompt') : T('Ajouter le format', 'Add the format'));
    const upBtn = () => { const ok = A.fmt.trim() && A.exts.trim() && A.brief.trim() && (A.agent !== 'api' || A.key.trim()); btn.disabled = !ok || A.run; };
    const log = h('pre', { class: 'ql-log' }, A.log);
    const hint = { claudeCode: T('Lance Claude Code (abonnement, sans clé) dans le dossier source de qLOOKS ; il écrit le format, recompile et réinstalle qLOOKS.', 'Runs Claude Code (subscription, no key) in the qLOOKS source folder; it writes the format, rebuilds and reinstalls qLOOKS.'),
      api: T('La clé est gardée dans votre Trousseau. Le prompt est envoyé à l’API et la réponse enregistrée dans Documents/qLOOKS Formats ; l’API ne modifie pas le code.', 'The key is kept in your Keychain. The prompt is sent to the API and the answer saved in Documents/qLOOKS Formats; the API does not edit the code.'), copy: T('Copie le prompt pour le coller dans l’agent de votre choix.', 'Copies the prompt so you can paste it into the agent of your choice.') }[A.agent];
    async function run() {
      if (A.run) return; if (A.agent === 'copy') { A.msg = T('Prompt copié dans le presse-papiers.', 'Prompt copied to the clipboard.'); try { await navigator.clipboard.writeText(`qLOOKS: add a preview and a thumbnail for ${A.fmt} (${A.exts}).\n${A.brief}`); } catch { /* sans presse-papiers */ } sfx.done(); render(); return; }
      A.run = true; A.log = ''; A.done = false; A.msg = ''; sfx.click(); render();
      const name = A.fmt.trim(), exts = A.exts.split(/[,\s]+/).filter(Boolean).map(e => e.replace(/^\./, '').toLowerCase());
      const lines = [T('Lecture de la demande…', 'Reading the request…'), T(`Format : ${name} (${exts.map(e => '.' + e).join(', ')})`, `Format: ${name} (${exts.map(e => '.' + e).join(', ')})`), T('Écrit Shared/' + name.replace(/\W+/g, '') + '.swift (aperçu et vignette)…', 'Writing Shared/' + name.replace(/\W+/g, '') + '.swift (preview and thumbnail)…'),
        T('Ajoute la ligne au registre Formats.swift…', 'Adding the line to the Formats.swift registry…'), T('Compile qLOOKS…  OK', 'Building qLOOKS…  OK'), T('Signe et réinstalle qLOOKS…', 'Signing and reinstalling qLOOKS…'), T('Enregistre les extensions Quick Look…', 'Registering the Quick Look extensions…')];
      for (const ln of lines) { await wait(reduced() ? 0 : 650); if (!alive() || A.stop) break; A.log += ln + '\n'; const l = view.querySelector('.ql-log'); if (l) { l.textContent = A.log; l.scrollTop = l.scrollHeight; } sfx.tick(); }
      if (!alive()) return;
      if (!A.stop) { A.log += T('Terminé.', 'Done.') + '\n'; A.done = true; S.fmts.push({ name, exts, cat: 'dev', since: VERS[1], preview: A.scope !== 'thumb', thumb: A.scope !== 'preview', note: null, flash: true }); sfx.done(); } else A.log += T('Arrêté.', 'Stopped.') + '\n';
      A.run = false; A.stop = false; render();
    }
    return [card(T('Ajouter un format', 'Add a format'), T('Décrivez un format de fichier : un agent IA ajoute son aperçu et sa vignette à qLOOKS.', 'Describe a file format: an AI agent adds its preview and thumbnail to qLOOKS.'),
      h('span', { class: 'ql-lbl' }, T('À prendre en charge', 'To support')), segOf([['both', T('Aperçu et vignette', 'Preview and thumbnail')], ['preview', T('Aperçu (Coup d’œil)', 'Preview (Quick Look)')], ['thumb', T('Vignette (Finder)', 'Thumbnail (Finder)')]], A.scope, v => { A.scope = v; }),
      h('span', { class: 'ql-lbl' }, T('Format', 'Format')), field('fmt', T('Ex. : fichiers Sketch', 'e.g. Sketch files')), h('span', { class: 'ql-lbl' }, T('Extensions', 'Extensions')), field('exts', '.sketch, .fig'),
      h('span', { class: 'ql-lbl' }, T('Ce que l’aperçu doit montrer', 'What the preview should show')), field('brief', '', true)),
    card(T('Agent IA', 'AI agent'), null, segOf([['claudeCode', 'Claude Code'], ['api', T('API Anthropic', 'Anthropic API')], ['copy', T('Copier seulement', 'Copy only')]], A.agent, v => { A.agent = v; }),
      A.agent === 'api' ? h('input', { class: 'ql-field', type: 'password', placeholder: 'sk-ant-…', autocomplete: 'off', value: A.key, 'aria-label': 'API key', oninput: e => { A.key = e.target.value; upBtn(); } }) : null, h('p', { class: 'ql-hint', html: bt(hint + (A.agent === 'api' ? ' ' + T('Démo : rien n’est envoyé.', 'Demo: nothing is sent.') : '')) }),
      A.agent === 'claudeCode' ? h('div', {}, h('span', { class: 'ql-lbl', html: bt(T('Dossier source de qLOOKS', 'qLOOKS source folder')) }), h('p', { class: 'mono', style: { margin: '4px 0 0', color: 'var(--s-acct)' } }, '~/Developer/qLOOKS')) : null,
      h('div', { class: 'ql-btns' }, btn, A.run ? h('button', { class: 'sbtn', onclick: () => { A.stop = true; } }, T('Arrêter', 'Stop')) : null, A.done ? h('button', { class: 'sbtn', onclick: () => toast({ icon: icon(app.id), title: app.id, body: T('Ouvrirait le dossier dans le Finder.', 'Would open the folder in the Finder.') }) }, T('Ouvrir le dossier', 'Open folder')) : null),
      A.msg ? h('p', { class: 'ql-hint', style: { color: 'var(--s-ok)' } }, A.msg) : null, A.log ? log : null)].map(x => { queueMicrotask(upBtn); return x; });
  }
  const SMP = [['logo', 'ProRes 4444 · alpha'], ['lower', 'PNG · alpha'], ['hero', 'H.264 · ' + T('sans alpha', 'no alpha')]];
  function pageTrial() {
    const zone = h('div', { class: 'ql-drop', ondragover: e => { e.preventDefault(); zone.classList.add('hov'); }, ondragleave: () => zone.classList.remove('hov'), ondrop: e => { e.preventDefault(); zone.classList.remove('hov'); toast({ icon: icon(app.id), title: app.id, body: T('Dans la démo, aucun fichier n’est lu : choisissez une vidéo d’exemple.', 'In the demo no file is read: pick a sample video.') }); } },
      h('b', {}, T('Déposez une vidéo (.MOV, .MKV)', 'Drop a video (.MOV, .MKV)')), h('small', {}, T('PNG, Animation, ProRes 4444, MKV et toute vidéo lue par macOS.', 'PNG, Animation, ProRes 4444, MKV and any video macOS can play.')));
    const menu = S.pick ? h('div', { class: 'ql-samples' }, h('span', { class: 'lb' }, T('Vidéos d’exemple :', 'Sample videos:')), ...SMP.map(([k, d]) => h('button', { class: 'ql-sm', onclick: () => { S.trial = k; S.pick = false; sfx.pop(); render(); } }, h('b', {}, SAMPLES[k].file), h('small', {}, d)))) : null;
    const choose = h('button', { class: 'sbtn acc', onclick: () => { S.pick = !S.pick; sfx.click(); render(); } }, T('Choisir un fichier…', 'Choose a file…'));
    return [card(T('Essai', 'Try it'), T('Glissez une vidéo ici pour la voir sur damier, fond sombre ou clair.', 'Drop a video here to see it on a checkerboard, dark or light background.'),
      S.trial ? h('div', { style: { display: 'flex', flexDirection: 'column', height: '380px' } }, player(SAMPLES[S.trial], { space: true })) : zone, menu, h('div', { class: 'ql-btns', style: { justifyContent: 'center' } }, choose))];
  }
  function pageUpdates() {
    const msg = { idle: T('Version installée : 1.1.0', 'Installed version: 1.1.0'), checking: T('Recherche en cours…', 'Checking…'), ok: T('qLOOKS est à jour (version 1.1.0).', 'qLOOKS is up to date (version 1.1.0).') }[S.upState];
    return [card(T('Mises à jour', 'Updates'), null, chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), S.auto, v => { S.auto = v; }),
      h('div', { class: 'ql-btns' }, h('button', { class: 'sbtn', disabled: S.upState === 'checking', onclick: async () => { S.upState = 'checking'; sfx.click(); render(); await wait(reduced() ? 0 : 1100); if (!alive()) return; S.upState = 'ok'; sfx.done(); if (S.view === 'app' && S.page === 'updates') render(); } }, T('Rechercher une mise à jour', 'Check for updates'))), h('p', { class: 'ql-hint', html: bt(msg) }))];
  }
  function viewApp() {
    const side = h('aside', { class: 'ql-side' }, h('p', { class: 'ql-tag' }, T('Aperçus et vignettes QuickLook', 'QuickLook previews and thumbnails')),
      ...NAV.map(([k, l]) => h('button', { class: 'ql-nav' + (S.page === k ? ' on' : ''), onclick: () => { if (S.page !== k) { S.page = k; S.pick = false; sfx.tick(); render(); } } }, svg(k), h('span', {}, l))), h('div', { class: 'ql-sp' }), h('p', { class: 'ql-ver' }, T('Version installée : 1.1.0', 'Installed version: 1.1.0')));
    const page = { settings: pageSettings, formats: pageFormats, editor: pageAdd, trial: pageTrial, updates: pageUpdates }[S.page]();
    return [h('div', { class: 'ql-app' }, side, h('div', { class: 'ql-scroll' }, h('div', { class: 'ql-col' }, ...page.filter(Boolean))))];
  }

  function render(keepQL) {
    if (!alive()) return; drawSeg();
    const sc = view.querySelector('.ql-scroll') ? view.querySelector('.ql-scroll').scrollTop : 0, gs = view.querySelector('.ql-grid') ? view.querySelector('.ql-grid').scrollTop : 0;
    view.replaceChildren(...(S.view === 'finder' ? viewFinder() : viewApp()).filter(Boolean));
    const a = view.querySelector('.ql-scroll'); if (a) a.scrollTop = sc; const g = view.querySelector('.ql-grid'); if (g) { g.scrollTop = gs; if (!S.ql && !keepQL) requestAnimationFrame(() => g.isConnected && g.focus({ preventScroll: true })); }
  }
  render();
  return root;
}
