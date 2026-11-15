/* Réplique interactive de mPIE : un menu circulaire sous le pointeur, appli de barre des menus.
   Icône (silhouette) dans la barre des menus : clic gauche = ouvre le cercle au centre de l'écran, clic droit = le menu de l'appli (réglages, modules, À propos, Quitter).
   ⌥ Espace maintenu ouvre le cercle sous le pointeur ; relâcher sur une part la valide, un appui bref garde le cercle ouvert (clic pour valider).
   Quatre modules : Lanceur (16 parts max, sens horaire depuis le haut), Applis ouvertes (loupe façon Dock), Contrôleur (raccourcis de l'appli au premier plan), Musique.
   ⇥ / molette / touches 1 à 4 changent de module, Échap ferme. Les actions agissent sur ce faux Mac (lancer une appli, fermer la fenêtre de devant…) ; rien n'est lu ni envoyé. */
import { S, h, $, T, css, sfx, toast, icon, wm, bar, clamp, reduced, launch } from './kit.js';
import { on, emit, appById } from '../core.js';
import { openFinder } from '../apps.js';
import { macMenu, closeMacMenu, macAlert, aboutWin } from './mDESK.js';

const ID = 'mPIE', CSS = 'css/demos/mPIE.css', MAXN = 16, PI = Math.PI;
const MODS = ['launcher', 'switcher', 'controller', 'music'];
const MN = { launcher: ['Lanceur', 'Launcher'], switcher: ['Applis ouvertes', 'Open apps'], controller: ['Contrôleur', 'Controller'], music: ['Musique', 'Music'] };
const mname = m => MN[m][T(0, 1)];
let M = null;
on('lang', () => M && M.relang());

export function open(app) {
  css(CSS);
  if (M) return M.show();
  M = start(app);
}

/* ------------------------------------------------------------------ pastilles génériques (dossier, fichier, Finder) */
const tile = (bg, body) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 76 76"><rect width="76" height="76" rx="17" fill="${bg}"/>${body}</svg>`);
const TILES = {
  folder: tile('#3b82f6', '<path d="M16 24a4 4 0 0 1 4-4h12l5 6h19a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" fill="#fff"/>'),
  file: tile('#8b95a5', '<path d="M24 14h20l10 10v36a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z" fill="#fff"/><path d="M44 14v10h10z" fill="#cbd5e1"/>'),
  finder: tile('#38bdf8', '<path d="M38 8h24a8 8 0 0 1 8 8v44a8 8 0 0 1-8 8H38z" fill="#fff"/><path d="M26 28v8M50 28v8M24 50c8 8 20 8 28 0" stroke="#0b3b6b" stroke-width="4" fill="none" stroke-linecap="round"/>')
};
/* silhouette de la barre des menus : quatre parts, une sur deux atténuée (image « modèle » de l'appli) */
const SIL = (() => {
  let p = '';
  for (let i = 0; i < 4; i++) {
    const a0 = i * 90 + 6, a1 = a0 + 78, P = (r, a) => [9 + r * Math.cos(a * PI / 180), 9 - r * Math.sin(a * PI / 180)].map(v => v.toFixed(2)).join(' ');
    p += `<path d="M${P(7.6, a0)}A7.6 7.6 0 0 0 ${P(7.6, a1)}L${P(2.8, a1)}A2.8 2.8 0 0 1 ${P(2.8, a0)}Z" fill="currentColor" opacity="${i % 2 ? .55 : 1}"/>`;
  }
  return `<svg viewBox="0 0 18 18" aria-hidden="true">${p}</svg>`;
})();
const GLYPH = {
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>', pause: '<path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" fill="currentColor"/>',
  prev: '<path d="M6.5 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 5.5L9 12l10 6.5z" fill="currentColor"/>',
  next: '<path d="M17.5 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 5.5L15 12 5 18.5z" fill="currentColor"/>',
  shuffle: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3c4 0 5 10 10 10h4M3 17h3c1.5 0 2.6-1 3.6-2.4M14.4 9.4C15.4 8 16.5 7 18 7h2"/><path d="M17.5 4l3 3-3 3M17.5 14l3 3-3 3"/></g>',
  repeat: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11V9a3 3 0 013-3h13M17 3l3 3-3 3M20 13v2a3 3 0 01-3 3H4M7 21l-3-3 3-3"/></g>'
};
const gl = (k, s = 24) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true">${GLYPH[k]}</svg>`;

/* ------------------------------------------------------------------ données : préréglages, raccourcis, musique */
const dir = (fr, en) => ({ k: 'folder', name: [fr, en] }), doc = (fr, en) => ({ k: 'file', name: [fr, en] });
const PRESETS = [
  { id: 'essentials', n: ['Essentiels macOS', 'macOS essentials'], items: ['mTAB', 'mDESK', 'mSPACES', 'mLINKS', 'mCLEAN', 'mBACKUP', 'mCLOUD', 'mSILENCE', 'qNOTES', 'mPDF', dir('Téléchargements', 'Downloads')] },
  { id: 'video', n: ['Création vidéo', 'Video creation'], items: ['kYNEDIT', 'mSIZER', 'qLOOKS', 'ARCHiVES', 'iCONIQ', 'MiCONE', 'mBACKUP', dir('Rushes', 'Rushes')] },
  { id: 'dev', n: ['Développement', 'Development'], items: ['wCLAUDE', 'ARCHiVES', 'mLINKS', 'mTAB', 'mSILENCE', 'hdCLEANER', 'mCLEAN', 'qNOTES', doc('LISEZMOI.md', 'README.md')] },
  { id: 'office', n: ['Bureautique', 'Office'], items: ['mPDF', 'qNOTES', 'mSTICK', 'CAREERDeSK', 'HORIZONs', 'mLINKS', 'ARCHiVES', 'mCLOUD', 'qLOOKS', dir('Documents', 'Documents')] },
  { id: 'design', n: ['Photo et design', 'Photo and design'], items: ['mSIZER', 'MiCONE', 'iCONIQ', 'qLOOKS', 'kYNEDIT', 'mSTAGRAM', 'mPDF', dir('Images', 'Pictures')] },
  { id: 'talk', n: ['Communication', 'Communication'], items: ['SOCiALS', 'mSTAGRAM', 'CAREERDeSK', 'qNOTES', 'mLINKS', 'mSTICK'] }
];
const PROFILES = [
  { id: 'both', n: ['Clavier et souris', 'Keyboard and mouse'], d: ['⌥ Espace maintenu, ou ⌥ + bouton du milieu maintenu. Relâchez pour valider.', 'Hold ⌥ Space, or hold ⌥ + middle button. Release to confirm.'], style: 'hold', mouse: 'middle', mod: 'option', keyboard: true },
  { id: 'keyboard', n: ['Clavier seul', 'Keyboard only'], d: ['⌥ Espace maintenu. La souris n’ouvre pas le menu.', 'Hold ⌥ Space. The mouse does not open the menu.'], style: 'hold', mouse: 'off', mod: 'none', keyboard: true },
  { id: 'mouse', n: ['Souris seule', 'Mouse only'], d: ['Bouton du milieu maintenu, sans touche. Aucun raccourci clavier.', 'Hold the middle button, no key. No keyboard shortcut.'], style: 'hold', mouse: 'middle', mod: 'none', keyboard: false },
  { id: 'click', n: ['Appuyer puis cliquer', 'Tap then click'], d: ['Le menu reste ouvert : cliquez sur une part pour valider.', 'The menu stays open: click a slice to confirm.'], style: 'tap', mouse: 'middle', mod: 'option', keyboard: true }
];
const LBL = {
  new: ['Nouveau', 'New'], closewindow: ['Fermer la fenêtre', 'Close window'], minimize: ['Réduire', 'Minimize'], fullscreen: ['Plein écran', 'Full screen'], find: ['Rechercher', 'Find'], settings: ['Réglages', 'Settings'],
  listview: ['Vue en liste', 'List view'], goto: ['Aller à…', 'Go to…'], downloads: ['Téléchargements', 'Downloads'], newfolder: ['Nouveau dossier', 'New folder'], emptytrash: ['Vider la corbeille', 'Empty Trash'], viewoptions: ['Options', 'Options'],
  newtab: ['Nouvel onglet', 'New tab'], closetab: ['Fermer l’onglet', 'Close tab'], reopentab: ['Rouvrir l’onglet', 'Reopen tab'], reload: ['Recharger', 'Reload'], sidebar: ['Barre latérale', 'Sidebar'], private: ['Navigation privée', 'Private window'],
  devtools: ['Outils de dév.', 'Developer tools'], incognito: ['Navigation privée', 'Incognito'], newmessage: ['Nouveau message', 'New message'], reply: ['Répondre', 'Reply'], replyall: ['Répondre à tous', 'Reply all'], forward: ['Transférer', 'Forward'],
  archive: ['Archiver', 'Archive'], getmail: ['Relever le courrier', 'Get mail'], newnote: ['Nouvelle note', 'New note'], checklist: ['Liste de contrôle', 'Checklist'], bold: ['Gras', 'Bold'], newwindow: ['Nouvelle fenêtre', 'New window'],
  clear: ['Effacer', 'Clear'], split: ['Diviser', 'Split'], blade: ['Couper (lame)', 'Blade'], ripple: ['Suppr. avec décalage', 'Ripple delete'], marker: ['Repère', 'Marker'], snap: ['Magnétisme', 'Snapping'], undo: ['Annuler', 'Undo'], redo: ['Rétablir', 'Redo'],
  editmode: ['Mode édition', 'Edit mode'], render: ['Rendu', 'Render'], save: ['Enregistrer', 'Save'], build: ['Compiler', 'Build'], run: ['Lancer', 'Run'], test: ['Tester', 'Test'], clean: ['Nettoyer', 'Clean'], quickopen: ['Ouverture rapide', 'Quick open'],
  palette: ['Palette de commandes', 'Command palette'], panel: ['Panneau', 'Panel'], search: ['Recherche globale', 'Search all'], saveall: ['Tout enregistrer', 'Save all']
};
const SETS = [
  ['generic', ['Toutes les autres applis', 'All other apps'], [['new', '⌘N'], ['closewindow', '⌘W'], ['minimize', '⌘M'], ['fullscreen', '⌃⌘F'], ['find', '⌘F'], ['settings', '⌘,']]],
  ['finder', 'Finder', [['listview', '⌘2'], ['goto', '⇧⌘G'], ['downloads', '⌥⌘L'], ['newfolder', '⇧⌘N'], ['emptytrash', '⇧⌘⌫'], ['viewoptions', '⌘J']]],
  ['safari', 'Safari', [['newtab', '⌘T'], ['closetab', '⌘W'], ['reopentab', '⇧⌘T'], ['reload', '⌘R'], ['sidebar', '⇧⌘L'], ['private', '⇧⌘N']]],
  ['chrome', 'Chrome', [['newtab', '⌘T'], ['closetab', '⌘W'], ['reopentab', '⇧⌘T'], ['reload', '⌘R'], ['devtools', '⌥⌘I'], ['incognito', '⇧⌘N']]],
  ['mail', 'Mail', [['newmessage', '⌘N'], ['reply', '⌘R'], ['replyall', '⇧⌘R'], ['forward', '⇧⌘F'], ['archive', '⌃⌘A'], ['getmail', '⇧⌘N']]],
  ['notes', 'Notes', [['newnote', '⌘N'], ['newfolder', '⇧⌘N'], ['checklist', '⇧⌘L'], ['bold', '⌘B'], ['find', '⌥⌘F']]],
  ['terminal', 'Terminal', [['newtab', '⌘T'], ['newwindow', '⌘N'], ['clear', '⌘K'], ['closetab', '⌘W'], ['split', '⌘D']]],
  ['resolve', 'DaVinci Resolve', [['blade', '⌘B'], ['ripple', '⇧⌫'], ['marker', 'M'], ['snap', 'N'], ['undo', '⌘Z'], ['redo', '⇧⌘Z']]],
  ['blender', 'Blender', [['editmode', '⇥'], ['render', 'F12'], ['save', '⌘S'], ['undo', '⌘Z'], ['redo', '⇧⌘Z']]],
  ['xcode', 'Xcode', [['build', '⌘B'], ['run', '⌘R'], ['test', '⌘U'], ['clean', '⇧⌘K'], ['quickopen', '⇧⌘O'], ['save', '⌘S']]],
  ['vscode', 'Visual Studio Code', [['palette', '⇧⌘P'], ['quickopen', '⌘P'], ['panel', '⌘J'], ['sidebar', '⌘B'], ['search', '⇧⌘F'], ['saveall', '⌥⌘S']]]
];
const setName = s => (typeof s[1] === 'string' ? s[1] : s[1][T(0, 1)]);
const TRACKS = [
  { t: 'Marée basse', a: 'Les Ondes', c: ['#7c3aed', '#ec4899'] }, { t: 'Nuit blanche', a: 'Aurélie Vance', c: ['#0ea5e9', '#1e3a8a'] },
  { t: 'Lumière d’août', a: 'Sable & Sel', c: ['#f59e0b', '#ef4444'] }, { t: 'Cendres', a: 'Nord Quartet', c: ['#10b981', '#064e3b'] }, { t: 'Ritournelle', a: 'Les Ondes', c: ['#f43f5e', '#7f1d1d'] }
];
const BASE = ['mTAB', 'qNOTES', 'mLINKS', 'mSTICK', 'mDESK', 'wCLAUDE'];
const KIND = { app: ['Application', 'Application'], folder: ['Dossier', 'Folder'], file: ['Fichier', 'File'] };

/* ------------------------------------------------------------------ géométrie (portage de PieLayout / PieGeometry) */
const mt = s => { const outer = 176 * s, inner = 66 * s, side = 2 * (outer + 14); return { s, outer, inner, tile: 38 * s, mid: (outer + inner) / 2, side, pw: Math.max(side, 500), rIn: i => inner + (outer * .82 - inner) * (1 - i), rOut: i => outer * (1 + .07 * (1 - i)) }; };
const strength = n => Math.min(1, n / 14);
const iconScale = (n, pull) => 1 + .45 * strength(n) * strength(n) * pull;
function layout(n, focus, mag) {
  const step = 360 / n, reg = { centers: [...Array(n)].map((_, i) => i * step), pull: Array(n).fill(0) };
  if (n <= 2 || mag <= .001) return reg;
  const f = ((focus % n) + n) % n, sg = 1.15, pull = [...Array(n)].map((_, i) => { let d = Math.abs(i - f); d = Math.min(d, n - d); return mag * Math.exp(-d * d / (sg * sg)); });
  const raw = pull.map(p => 1 + .6 * strength(n) * p), k = n / raw.reduce((a, b) => a + b, 0), widths = raw.map(r => r * k * step);
  const cumul = u => { if (u >= n) return 360 + cumul(u - n); const w = Math.floor(u); let a = 0; for (let j = 0; j < w; j++) a += widths[j]; return a + (u - w) * widths[w]; };
  const off = f * step - cumul(f + .5);
  return { centers: [...Array(n)].map((_, i) => cumul(i + .5) + off), pull };
}
function wedgeW(n, mag) {
  const step = 360 / n; if (n <= 2 || mag <= .001) return step;
  const g = .6 * strength(n); let total = 0;
  for (let i = 0; i < n; i++) { const d = Math.min(i, n - i); total += 1 + g * mag * Math.exp(-d * d / (1.15 * 1.15)); }
  return (1 + g * mag) * n / total * step;
}
const rad = d => (d - 90) * PI / 180;
function sector(c, a0, a1, ri, ro, gap) {
  const P = (r, a) => `${(c + r * Math.cos(rad(a))).toFixed(2)} ${(c + r * Math.sin(rad(a))).toFixed(2)}`;
  const dO = gap > 0 ? Math.asin(Math.min(.99, gap / 2 / ro)) * 180 / PI : 0, dI = gap > 0 && ri > 0 ? Math.asin(Math.min(.99, gap / 2 / ri)) * 180 / PI : 0;
  const s0 = a0 + dO, s1 = a1 - dO, i0 = a0 + dI, i1 = a1 - dI;
  return `M${P(ro, s0)}A${ro.toFixed(2)} ${ro.toFixed(2)} 0 ${s1 - s0 > 180 ? 1 : 0} 1 ${P(ro, s1)}L${P(ri, i1)}A${ri.toFixed(2)} ${ri.toFixed(2)} 0 ${i1 - i0 > 180 ? 1 : 0} 0 ${P(ri, i0)}Z`;
}
const circ = (c, r) => `M${c - r} ${c}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/* ================================================================== appli ================================================================== */
function start(app) {
  let gone = false, R = null, win = null, extra = null, ptr = null, lastClient = null, swallowUntil = 0, lastWheel = 0, uidN = 0, addOpen = false;
  const uid = () => 'p' + (++uidN), timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!gone) fn(); }, ms); timers.add(t); };
  const say = body => toast({ icon: icon(ID), title: ID, body });
  const mk = x => (typeof x === 'string' ? { id: uid(), k: 'app', app: x } : { id: uid(), ...x });
  const P = { style: 'hold', mouse: 'middle', mod: 'option', keyboard: true, enabled: { launcher: true, switcher: true, controller: true, music: true }, start: 'last', last: 'launcher', scale: 1,
    atPointer: true, showName: true, sound: false, anim: true, excluded: new Set(['finder']), player: 'auto', auto: true, login: false, menuIcon: true, tab: 'general', set: 'generic', profile: 'both' };
  let LAUNCH = PRESETS[0].items.map(mk);
  const MU = { i: 0, playing: true, shuffle: false, repeat: false };
  const MRU = [];
  const bump = id => { if (!id) return; const k = MRU.indexOf(id); if (k >= 0) MRU.splice(k, 1); MRU.unshift(id); };
  on('focus', w => w && w.appId && bump(w.appId));
  const animOn = () => P.anim && !reduced();
  const nameOf = it => (it.k === 'app' ? it.app : it.name[T(0, 1)]);
  const imgOf = it => (it.k === 'app' ? icon(it.app) : TILES[it.k]);
  const stageRect = () => $('#stage').getBoundingClientRect();
  const toStage = (cx, cy) => { const r = stageRect(); return { x: (cx - r.left) / S.scale, y: (cy - r.top) / S.scale }; };

  /* ---------------------------------------------------------------- applis ouvertes et cible du Contrôleur */
  function allRunning() {
    const ids = [], add = id => { if (id && id !== ID && !ids.includes(id)) ids.push(id); };
    wm.wins.forEach(w => { if (w.appId && (appById(w.appId) || w.appId === 'finder')) add(w.appId); });
    S.extras.forEach((_, k) => { if (appById(k)) add(k); });
    BASE.forEach(add);
    const rank = id => { const i = MRU.indexOf(id); return i < 0 ? 99 : i; };
    return ids.sort((a, b) => rank(a) - rank(b));
  }
  const running = () => allRunning().filter(id => !P.excluded.has(id)).slice(0, MAXN);
  function target() {
    const ws = [...wm.wins.values()].filter(w => !w.min && w.el.isConnected && w.space === S.cur && w.appId !== ID && !w.id.startsWith('about:'));
    ws.sort((a, b) => (+b.el.style.zIndex || 0) - (+a.el.style.zIndex || 0));
    const w = ws[0];
    if (!w) return { set: 'finder', name: 'Finder', win: null, img: TILES.finder };
    if (w.appId === 'finder') return { set: 'finder', name: 'Finder', win: w, img: TILES.finder };
    const a = appById(w.appId);
    return { set: 'generic', name: a ? a.id : w.title, win: w, img: a ? icon(a.id) : TILES.finder };
  }
  const setById = id => SETS.find(s => s[0] === id) || SETS[0];
  function ctlRun(id, keys, tg) {
    const w = tg.win;
    if (w && wm.wins.has(w.id)) {
      if (id === 'closewindow') { wm.close(w.id); return say(T(`Fenêtre de « ${tg.name} » fermée (${keys}).`, `“${tg.name}” window closed (${keys}).`)); }
      if (id === 'minimize') { wm.minimize(w.id); return say(T(`Fenêtre de « ${tg.name} » réduite (${keys}).`, `“${tg.name}” window minimized (${keys}).`)); }
      if (id === 'fullscreen') { wm.toggleMax(w.id); return say(T(`Plein écran envoyé à « ${tg.name} » (${keys}).`, `Full screen sent to “${tg.name}” (${keys}).`)); }
    }
    say(T(`${keys} envoyé à ${tg.name}.`, `${keys} sent to ${tg.name}.`));
  }
  function openItem(it) {
    if (it.k === 'app') { bump(it.app); return launch(it.app); }
    if (it.k === 'folder') { openFinder({}); return say(T(`Dossier « ${nameOf(it)} » ouvert dans le Finder.`, `“${nameOf(it)}” opened in the Finder.`)); }
    say(T(`Fichier « ${nameOf(it)} » ouvert.`, `“${nameOf(it)}” opened.`));
  }
  const track = () => TRACKS[MU.i];
  function musicAct(a) {
    const n = TRACKS.length;
    if (a === 'pp') MU.playing = !MU.playing;
    if (a === 'next') { MU.i = MU.shuffle ? (MU.i + 1 + Math.floor(Math.random() * (n - 1))) % n : (MU.i + 1) % n; MU.playing = true; }
    if (a === 'prev') { MU.i = (MU.i + n - 1) % n; MU.playing = true; }
    if (a === 'shuffle') MU.shuffle = !MU.shuffle;
    if (a === 'repeat') MU.repeat = !MU.repeat;
    const s = { pp: MU.playing ? T('Lecture', 'Playing') : T('Pause', 'Paused'), next: T('Titre suivant', 'Next track'), prev: T('Titre précédent', 'Previous track'),
      shuffle: MU.shuffle ? T('Aléatoire activé', 'Shuffle on') : T('Aléatoire désactivé', 'Shuffle off'), repeat: MU.repeat ? T('Répétition activée', 'Repeat on') : T('Répétition désactivée', 'Repeat off') }[a];
    say(`${s} · ${track().t} — ${track().a}`);
    drawWin();
  }
  const coverEl = (tr, size) => h('div', { class: 'mpie-cover', style: { width: size + 'px', height: size + 'px', background: `linear-gradient(135deg,${tr.c[0]},${tr.c[1]})` }, html: `<svg viewBox="0 0 24 24" width="${size * .4}" height="${size * .4}" aria-hidden="true"><path d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 9 18Zm10-2a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 19 16Z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` });

  /* ---------------------------------------------------------------- éléments de chaque module */
  function load(mod) {
    if (mod === 'launcher') {
      const n = LAUNCH.length;
      return { title: mname('launcher'), sub: n ? T(`${n} éléments`, `${n} items`) : T('Aucun élément', 'No items'),
        items: LAUNCH.map(it => ({ id: it.id, title: nameOf(it), img: imgOf(it), badge: it.k === 'folder' ? 'folder' : '', run: () => openItem(it) })) };
    }
    if (mod === 'switcher') {
      const ids = running();
      return { title: mname('switcher'), sub: ids.length ? T(`${ids.length} applis`, `${ids.length} apps`) : T('Aucune appli ouverte', 'No app open'),
        items: ids.map(id => ({ id, title: id === 'finder' ? 'Finder' : id, img: id === 'finder' ? TILES.finder : icon(id), badge: 'run', run: () => { bump(id); id === 'finder' ? openFinder({}) : launch(id); } })) };
    }
    if (mod === 'controller') {
      const tg = target(), set = setById(tg.set);
      return { title: tg.name, sub: T(`${set[2].length} actions`, `${set[2].length} actions`), img: tg.img, ctl: true,
        items: set[2].map(([k, keys]) => ({ id: k, title: LBL[k][T(0, 1)], keys, run: () => ctlRun(k, keys, tg) })) };
    }
    const pl = MU.playing;
    return { title: mname('music'), sub: '', music: true, items: [
      { id: 'pp', title: pl ? T('Pause', 'Pause') : T('Lecture', 'Play'), sym: pl ? 'pause' : 'play', run: () => musicAct('pp') },
      { id: 'next', title: T('Suivant', 'Next'), sym: 'next', run: () => musicAct('next') },
      { id: 'repeat', title: T('Répéter', 'Repeat'), sym: 'repeat', active: MU.repeat, run: () => musicAct('repeat') },
      { id: 'shuffle', title: T('Aléatoire', 'Shuffle'), sym: 'shuffle', active: MU.shuffle, run: () => musicAct('shuffle') },
      { id: 'prev', title: T('Précédent', 'Previous'), sym: 'prev', run: () => musicAct('prev') }] };
  }

  /* ---------------------------------------------------------------- le cercle */
  const enabledMods = () => MODS.filter(m => P.enabled[m]);
  function openRing(module, source) {
    if (R || gone) return;
    closeMacMenu();
    const mods = enabledMods(); if (!mods.length) return;
    let mod = module || (P.start === 'last' ? P.last : P.start); if (!mods.includes(mod)) mod = mods[0];
    const m = mt(P.scale), half = m.side / 2, below = 150;
    const holdStyle = P.style === 'hold' && source !== 'menu';
    let cx = 800, cy = 425;
    if (source !== 'menu' && P.atPointer && ptr) { cx = ptr.x; cy = ptr.y; }
    cx = clamp(cx, m.pw / 2 + 6, 1600 - m.pw / 2 - 6);
    cy = clamp(cy, 30 + half + 6, Math.max(30 + half + 6, 900 - half - below - 6));
    const panel = h('div', { class: 'mpie-panel socle', role: 'dialog', 'aria-label': ID, style: { left: cx - m.pw / 2 + 'px', top: cy - half + 'px', width: m.pw + 'px' } });
    const ring = h('div', { class: 'mpie-ring', style: { width: m.side + 'px', height: m.side + 'px' } });
    const svg = h('div', { class: 'mpie-svg' }), its = h('div', { class: 'mpie-its' }), ctr = h('div', { class: 'mpie-ctr' });
    const card = h('div', { class: 'mpie-card' });
    ring.append(svg, its, ctr); panel.append(ring, card);
    R = { m, cx, cy, panel, ring, svg, its, ctr, card, source, sticky: !holdStyle, hold: holdStyle, openedAt: performance.now(), hover: null, iris: 1, module: mod, items: [], els: [], anim: animOn(), chip: null };
    $('#layer').append(panel);
    select(mod, true);
    if (lastClient) hoverFrom(lastClient.x, lastClient.y, null);
    if (R.anim) {
      const r = R; r.iris = 0; frame();
      const t0 = performance.now() + 20, tick = now => { if (R !== r) return; const u = clamp((now - t0) / 200, 0, 1); r.iris = 1 - Math.pow(1 - u, 3); frame(); if (u < 1) r.raf = requestAnimationFrame(tick); };
      r.raf = requestAnimationFrame(tick);
    }
    sfx.open();
  }
  function closeRing() {
    if (!R) return;
    const r = R; R = null; cancelAnimationFrame(r.raf);
    r.panel.classList.add('closing'); r.panel.style.pointerEvents = 'none';
    setTimeout(() => r.panel.remove(), 130);
  }
  function release(source) {
    if (!R || R.sticky || source !== R.source) return;
    if (performance.now() - R.openedAt < 250) { R.sticky = true; R.hold = false; drawCard(); return; }
    commit();
  }
  function commit() {
    if (!R) return;
    const it = R.items[R.hover], emptyL = R.module === 'launcher' && !R.items.length;
    closeRing();
    if (it) later(() => it.run(), 50); else if (emptyL) showSettings('launcher');
  }
  function select(mod, first) {
    R.module = mod; P.last = mod; R.hover = null; R.chip = null; R.tilt = null;
    const d = load(mod); R.data = d; R.items = d.items; R.sub = d.sub;
    const m = R.m, n = d.items.length, rs = Math.min(.04, .3 / Math.max(n, 1));
    R.its.replaceChildren();
    R.els = d.items.map((it, i) => {
      const inner = it.img ? h('img', { src: it.img, alt: '', draggable: 'false', style: { width: m.tile + 'px', height: m.tile + 'px' } })
        : it.sym ? h('span', { class: 'mpie-sym', html: gl(it.sym, Math.round(24 * m.s)) })
        : h('span', { class: 'mpie-lab', style: { width: 94 * m.s + 'px' } }, h('b', {}, it.title), h('em', {}, it.keys || ''));
      const el = h('div', { class: 'mpie-it' + (it.active ? ' act' : ''), 'data-i': i, style: { '--d': R.anim ? (.08 + i * rs).toFixed(3) + 's' : '0s', '--an': R.anim ? 'mpie-rev' : 'none' } },
        h('div', { class: 'mpie-in' }, inner, it.badge === 'run' ? h('i', { class: 'mpie-run' }) : null, it.badge === 'folder' ? h('i', { class: 'mpie-fold', html: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M1 2.6h2.8l.9 1H9v4.6H1z" fill="currentColor"/></svg>' }) : null));
      R.its.append(el); return el;
    });
    drawCard(); placeItems(); drawSvg(); drawCenter(); sizeCenter();
    if (!first && lastClient) hoverFrom(lastClient.x, lastClient.y, null);
  }
  function placeItems() {
    const m = R.m, n = R.items.length, c = m.side / 2, step = 360 / Math.max(n, 1), mag = R.module === 'switcher' && R.hover != null ? 1 : 0;
    const lay = layout(Math.max(n, 1), R.hover == null ? 0 : R.hover, mag);
    R.els.forEach((el, i) => {
      const a = rad(mag ? lay.centers[i] : i * step), pull = lay.pull[i] || 0, r = m.mid + 9 * m.s * pull, sc = R.module === 'switcher' ? iconScale(n, pull) : 1;
      el.style.left = (c + r * Math.cos(a)).toFixed(2) + 'px'; el.style.top = (c + r * Math.sin(a)).toFixed(2) + 'px'; el.style.setProperty('--sc', sc.toFixed(3)); el.style.zIndex = Math.round(pull * 10);
      el.classList.toggle('hv', i === R.hover);
    });
  }
  function drawSvg() {
    const m = R.m, c = m.side / 2, rIn = m.rIn(R.iris), rOut = m.rOut(R.iris), n = R.items.length, step = 360 / Math.max(n, 1);
    let s = `<circle cx="${c}" cy="${c}" r="${rOut.toFixed(2)}" fill="var(--s-sunk)" stroke="var(--mp-bs)"/>`;
    if (R.module === 'launcher' || R.module === 'switcher') {
      s += `<path d="${circ(c, rOut)}${circ(c, rIn)}" fill="var(--s-raised)" fill-rule="evenodd"/>`;
      if (R.hover != null && n) {
        const sw = R.module === 'switcher', pr = sw ? 7 * m.s : -4 * m.s, rr = 7 * m.s, wedge = Math.max(4, (sw ? wedgeW(n, 1) : step) - (pr > 0 ? 3 : 8)), f = R.hover * step;
        s += `<path d="${sector(c, f - wedge / 2, f + wedge / 2, rIn - pr + rr, rOut + pr - rr, 2 * rr)}" fill="var(--s-accf)" stroke="var(--s-accf)" stroke-width="${2 * rr}" stroke-linejoin="round"/>`;
      }
    } else for (let i = 0; i < n; i++) s += `<path d="${sector(c, (i - .5) * step, (i + .5) * step, rIn, rOut, 2.5 * R.iris)}" fill="${i === R.hover ? 'var(--s-accf)' : 'var(--s-raised)'}"/>`;
    R.svg.innerHTML = `<svg width="${m.side}" height="${m.side}" viewBox="0 0 ${m.side} ${m.side}" aria-hidden="true">${s}</svg>`;
  }
  const sizeCenter = () => { const d = 2 * (R.m.rIn(R.iris) - 4); R.ctr.style.width = R.ctr.style.height = d + 'px'; };
  function frame() { if (!R) return; drawSvg(); sizeCenter(); R.card.style.opacity = R.iris; }
  function drawCenter() {
    const d = R.data, ctr = R.ctr, hv = R.items[R.hover], live = R.module === 'launcher' || R.module === 'switcher';
    if (R.module === 'music') {
      if (!R.chip) {
        const size = Math.round(ctr.offsetWidth || 2 * (R.m.inner - 4)) - 16, cv = coverEl(track(), Math.max(60, size));
        cv.classList.add('spin'); cv.style.animationPlayState = MU.playing ? 'running' : 'paused'; if (!R.anim) cv.style.animation = 'none';
        R.chip = h('div', { class: 'mpie-chip abs' }); ctr.replaceChildren(cv, R.chip);
      }
      R.chip.hidden = !hv; R.chip.textContent = hv ? hv.title : ''; return;
    }
    if (live && hv && P.showName) { ctr.replaceChildren(h('div', { class: 'mpie-chip' }, hv.title)); return; }
    const tilt = d.img ? h('img', { class: 'mpie-ci', src: d.img, alt: '', style: { width: 36 * R.m.s + 'px', height: 36 * R.m.s + 'px' } }) : null; R.tilt = tilt;
    ctr.replaceChildren(...[tilt, h('b', { class: 'mpie-ct' }, d.title), h('span', { class: 'mpie-cs' }, d.sub)].filter(Boolean));
  }
  function drawCard() {
    const mods = enabledMods(), d = R.data;
    const modes = h('div', { class: 'mpie-modes', role: 'tablist' }, mods.map((m, i) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(m === R.module), class: m === R.module ? 'on' : '', onclick: () => { sfx.tick(); select(m); } }, h('i', {}, i + 1), mname(m))));
    const hint = h('div', { class: 'mpie-hnt' }, R.hold ? T('⇥ ou molette : changer de module · relâchez pour valider · Échap ferme', '⇥ or scroll: change module · release to confirm · Esc closes')
      : T('⇥ ou molette : changer de module · cliquez pour valider · Échap ferme', '⇥ or scroll: change module · click to confirm · Esc closes'));
    const kids = [];
    if (d.music) kids.push(h('div', { class: 'mpie-now' }, coverEl(track(), 34), h('div', {}, h('b', {}, track().t), h('span', {}, `${track().a} · ${P.player === 'spotify' ? 'Spotify' : T('Musique', 'Music')}`))));
    R.card.replaceChildren(...kids, modes, hint);
    R.card.style.opacity = R.iris;
  }
  function step(d) { const mods = enabledMods(); if (!R || mods.length < 2) return; const i = mods.indexOf(R.module); sfx.tick(); select(mods[(i + d + mods.length) % mods.length]); }
  function hoverFrom(cx0, cy0, tgt) {
    if (!R) return;
    const p = toStage(cx0, cy0), n = R.items.length, dx = p.x - R.cx, dy = -(p.y - R.cy), dist = Math.hypot(dx, dy), m = R.m;
    let idx = null;
    if (n && dist >= m.inner && dist <= m.outer + 70 && !(tgt && tgt.closest && tgt.closest('.mpie-card'))) {
      let a = Math.atan2(dx, dy); if (a < 0) a += 2 * PI;
      const st = 2 * PI / n; idx = Math.floor((a + st / 2) / st) % n;
    }
    if (idx !== R.hover) {
      R.hover = idx; if (idx != null && P.sound) sfx.tick();
      drawSvg(); placeItems(); drawCenter();
    }
    if (R.module === 'controller' && R.tilt && R.anim) {
      const vx = clamp(dx / m.outer, -1, 1), vy = -clamp(dy / m.outer, -1, 1);
      R.tilt.style.transform = `translate(${(vx * 3).toFixed(2)}px,${(vy * 3).toFixed(2)}px) scale(${Math.cos(vx * .42).toFixed(3)},${Math.cos(vy * .42).toFixed(3)})`;
    }
  }

  /* ---------------------------------------------------------------- clavier, souris, molette */
  const modOk = e => ({ none: true, option: e.altKey, control: e.ctrlKey, shift: e.shiftKey, command: e.metaKey }[P.mod]);
  const swallow = e => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); swallowUntil = performance.now() + 400; };
  const onMove = e => { lastClient = { x: e.clientX, y: e.clientY }; ptr = toStage(e.clientX, e.clientY); if (R) hoverFrom(e.clientX, e.clientY, e.target); };
  const onDown = e => {
    if (gone) return;
    lastClient = { x: e.clientX, y: e.clientY }; ptr = toStage(e.clientX, e.clientY);
    if (!R) { if (P.mouse === 'middle' && e.button === 1 && modOk(e)) { swallow(e); openRing(null, 'mouse'); } return; }
    if (e.button === 1) { swallow(e); return closeRing(); }
    if (e.button === 2) { if (R.sticky) closeRing(); return; }
    if (e.button !== 0) return;
    const inCard = e.target.closest && e.target.closest('.mpie-card');
    if (!inCard) hoverFrom(e.clientX, e.clientY, e.target);
    if (!inCard && R.hover != null) { swallow(e); return commit(); }
    if (inCard) return;
    if (R.sticky) { swallow(e); closeRing(); }
  };
  const onUp = e => { if (R && e.button === 1) release('mouse'); };
  const onClick = e => { if (performance.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); } };
  const onKey = e => {
    if (gone) return;
    if (!R) { if (P.keyboard && e.altKey && e.code === 'Space' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) openRing(null, 'key'); } return; }
    if (e.metaKey || e.ctrlKey) return;
    const k = e.key, dg = /^(?:Digit|Numpad)([1-4])$/.exec(e.code) || /^([1-4])$/.exec(k);
    if (e.altKey && e.code === 'Space') { if (!e.repeat) closeRing(); }
    else if (k === 'Escape') closeRing();
    else if (k === 'Enter') commit();
    else if (k === 'Tab') step(e.shiftKey ? -1 : 1);
    else if (dg) { const mods = enabledMods(), t = mods[+dg[1] - 1]; if (t) { sfx.tick(); select(t); } }
    e.preventDefault(); e.stopImmediatePropagation();
  };
  const onKeyUp = e => { if (R && !R.sticky && R.source === 'key' && (e.code === 'Space' || e.key === 'Alt')) release('key'); };
  const onWheel = e => {
    if (!R) return; e.preventDefault(); e.stopPropagation();
    const now = performance.now(); if (!e.deltaY || now - lastWheel < 300) return; lastWheel = now; step(e.deltaY > 0 ? 1 : -1);
  };
  const onBlur = () => closeRing();
  addEventListener('pointermove', onMove, true); addEventListener('pointerdown', onDown, true); addEventListener('pointerup', onUp, true); addEventListener('click', onClick, true);
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKeyUp, true); addEventListener('wheel', onWheel, { capture: true, passive: false }); addEventListener('blur', onBlur); addEventListener('resize', onBlur);

  /* ---------------------------------------------------------------- icône de la barre des menus et son menu */
  function addExtra() {
    if (extra) return;
    extra = h('button', { class: 'mb extra mpie-bar', type: 'button', 'aria-label': ID, title: T('Clic : ouvrir le cercle · clic droit : menu', 'Click: open the ring · right-click: menu'), html: SIL });
    extra.onclick = () => { if (performance.now() < swallowUntil) return; closeMacMenu(); R ? closeRing() : openRing(null, 'menu'); };
    extra.addEventListener('contextmenu', e => { e.preventDefault(); closeRing(); showMenu(); });
    S.extras.set(ID, { el: extra, quit }); emit('extras');
  }
  function showMenu() {
    if (!extra) return;
    const items = [{ l: T('Ouvrir le menu circulaire', 'Open the pie menu'), k: '⌥ ␣', fn: () => openRing(null, 'menu') }, { sep: 1 }, { head: T('Module', 'Module') },
      ...enabledMods().map(m => ({ l: mname(m), check: m === P.last, fn: () => openRing(m, 'menu') })), { sep: 1 },
      { l: T('Réglages…', 'Settings…'), fn: () => showSettings() }, { l: T('Rechercher les mises à jour…', 'Check for updates…'), fn: upToDate },
      { l: T('À propos de mPIE', 'About mPIE'), fn: about }, { sep: 1 }, { l: T('Quitter mPIE', 'Quit mPIE'), fn: quit }];
    macMenu(extra, items);
  }
  const upToDate = () => macAlert({ app, title: T('mPIE est à jour.', 'mPIE is up to date.'), text: T('Version 1.0.0', 'Version 1.0.0') });
  function about() {
    aboutWin(app, { h: 460, version: () => T('Version 1.0.0', 'Version 1.0.0'), lines: () => [
      [T('Un menu circulaire pour lancer, changer d’appli et piloter vos applis et votre musique.', 'A pie menu to launch, switch and control your apps and your music.')],
      [T('DESKTOP MAC TOOLKIT', 'DESKTOP MAC TOOLKIT'), 'au'],
      [T('Inspirée de Pieoneer (App ahead), sans lien avec ses auteurs.', 'Inspired by Pieoneer (App ahead), not affiliated with its authors.'), 'mut'],
      [T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.'), 'mut'], [T('Fournie telle quelle, sans garantie.', 'Provided as is, without warranty.'), 'mut']] });
  }
  function quit() {
    if (gone) return; gone = true; closeRing(); closeMacMenu(); timers.forEach(clearTimeout);
    removeEventListener('pointermove', onMove, true); removeEventListener('pointerdown', onDown, true); removeEventListener('pointerup', onUp, true); removeEventListener('click', onClick, true);
    removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKeyUp, true); removeEventListener('wheel', onWheel, true); removeEventListener('blur', onBlur); removeEventListener('resize', onBlur);
    if (win && wm.wins.has(win.id)) wm.close(win.id);
    S.extras.delete(ID); emit('extras'); M = null; sfx.close();
  }

  /* ---------------------------------------------------------------- fenêtre de réglages */
  const upd = fn => { fn(); drawWin(); };
  const card2 = (title, ...kids) => h('section', { class: 'mpie-c2' }, title ? h('h4', {}, title) : null, ...kids);
  const row = (label, ctl) => h('div', { class: 'mpie-row' }, h('span', {}, label), ctl);
  const note = t => h('p', { class: 'mpie-note' }, t);
  const chk = (label, get, set, help) => h('div', { class: 'mpie-chk' }, h('button', { type: 'button', class: 'mpie-cb' + (get() ? ' on' : ''), role: 'checkbox', 'aria-checked': String(!!get()), onclick: () => { sfx.tick(); upd(() => set(!get())); } }, h('i', {}, get() ? '✓' : ''), h('span', {}, label)), help ? note(help) : null);
  const seg = (opts, get, set) => h('div', { class: 'mpie-seg' }, opts.map(([v, l]) => h('button', { type: 'button', class: get() === v ? 'on' : '', onclick: () => { sfx.tick(); upd(() => set(v)); } }, l)));
  const sel = (opts, get, set) => { const s = h('select', { class: 'mpie-sel', onchange: e => upd(() => set(e.target.value)) }, opts.map(([v, l]) => h('option', { value: v }, l))); s.value = get(); return s; };
  const btn = (label, fn, cls = '', dis) => h('button', { type: 'button', class: 'mpie-btn ' + cls, onclick: fn, disabled: dis }, label);
  const chipKeys = t => h('span', { class: 'mpie-kc' }, t);

  const TABS = () => [['general', T('Général', 'General')], ['trigger', T('Déclenchement', 'Trigger')], ['launcher', T('Lanceur', 'Launcher')], ['controller', T('Contrôleur', 'Controller')], ['music', T('Musique', 'Music')], ['presets', T('Préréglages', 'Presets')], ['updates', T('Mises à jour', 'Updates')]];
  const tabGeneral = () => [
    card2(T('Modules', 'Modules'), ...MODS.map(m => chk(mname(m), () => P.enabled[m], v => { if (!v && enabledMods().length < 2) return; P.enabled[m] = v; })),
      row(T('Module à l’ouverture', 'Module on open'), sel([['last', T('Dernier utilisé', 'Last used')], ...MODS.map(m => [m, mname(m)])], () => P.start, v => { P.start = v; }))),
    card2(T('Apparence du menu', 'Menu appearance'),
      (() => { const val = h('span', { class: 'mpie-val' }, Math.round(P.scale * 100) + ' %'); return row(T('Taille', 'Size'), h('span', { class: 'mpie-sl' }, h('input', { type: 'range', min: .7, max: 1.3, step: .05, value: P.scale, 'aria-label': T('Taille', 'Size'), oninput: e => { P.scale = +e.target.value; val.textContent = Math.round(P.scale * 100) + ' %'; } }), val)); })(),
      chk(T('Ouvrir sous le pointeur', 'Open under the pointer'), () => P.atPointer, v => { P.atPointer = v; }), chk(T('Afficher le nom au centre', 'Show the name in the center'), () => P.showName, v => { P.showName = v; }),
      chk(T('Son discret à la sélection', 'Soft sound on selection'), () => P.sound, v => { P.sound = v; }),
      chk(T('Animations de l’interface', 'Interface animations'), () => P.anim, v => { P.anim = v; }, T('Ouverture du cercle, loupe des Applis ouvertes, inclinaison de l’icône du Contrôleur, pochette qui tourne. Coupées aussi si macOS réduit les animations.', 'Ring opening, Open apps magnifier, Controller icon tilt, spinning cover art. Also off when macOS reduces motion.'))),
    card2(T('Applis ouvertes', 'Open apps'), note(T('Décochez les applis à ne jamais montrer dans le cercle.', 'Untick the apps you never want in the ring.')),
      h('div', { class: 'mpie-ex' }, ['finder', ...allRunning().filter(x => x !== 'finder')].map(id => chk(id === 'finder' ? 'Finder' : id, () => !P.excluded.has(id), v => { v ? P.excluded.delete(id) : P.excluded.add(id); })))),
    card2(T('Système', 'System'), chk(T('Icône dans la barre des menus', 'Menu bar icon'), () => P.menuIcon, v => { P.menuIcon = v; if (v) { addExtra(); } else { closeRing(); closeMacMenu(); S.extras.delete(ID); extra = null; emit('extras'); } },
      T('Masquée, l’icône reste joignable : relancez mPIE depuis le Finder pour rouvrir les réglages.', 'When hidden, you can still reach settings: relaunch mPIE from the Finder.')),
      chk(T('Ouvrir à l’ouverture de session', 'Open at login'), () => P.login, v => { P.login = v; }))];
  const tabTrigger = () => [
    card2(T('Raccourci clavier', 'Keyboard shortcut'), row(T('Ouvrir le menu', 'Open the menu'), P.keyboard ? chipKeys(T('⌥ Espace', '⌥ Space')) : h('span', { class: 'mpie-mut' }, T('Aucun', 'None'))), note(T('Sur ce Mac fictif : maintenez ⌥ Espace n’importe où dans la scène.', 'On this demo Mac: hold ⌥ Space anywhere on the screen.'))),
    card2(T('Mode', 'Mode'), seg([['hold', T('Maintenir', 'Hold')], ['tap', T('Appuyer', 'Tap')]], () => P.style, v => { P.style = v; P.profile = ''; }),
      note(P.style === 'hold' ? T('Maintenu : relâchez la touche pour valider la part visée. Un appui bref laisse le menu ouvert.', 'Hold: release the key to confirm the slice. A quick press keeps the menu open.') : T('Appuyer : le menu reste ouvert, cliquez sur une part pour valider.', 'Tap: the menu stays open, click a slice to confirm.'))),
    card2(T('Souris', 'Mouse'), row(T('Bouton', 'Button'), sel([['off', T('Désactivé', 'Off')], ['middle', T('Bouton du milieu', 'Middle button')]], () => P.mouse, v => { P.mouse = v; P.profile = ''; })),
      row(T('Touche à tenir', 'Key to hold'), sel([['none', T('Aucune', 'None')], ['option', T('⌥ Option', '⌥ Option')], ['control', T('⌃ Contrôle', '⌃ Control')], ['shift', T('⇧ Majuscule', '⇧ Shift')], ['command', T('⌘ Commande', '⌘ Command')]], () => P.mod, v => { P.mod = v; P.profile = ''; })),
      note(T('Le clic est aussi reçu par l’appli sous le pointeur : une touche à tenir évite les clics parasites.', 'The click also reaches the app under the pointer: holding a key avoids stray clicks.')))];
  function tabLauncher() {
    const have = new Set(LAUNCH.filter(x => x.k === 'app').map(x => x.app)), pool = S.apps.filter(a => a.space === 'util' && a.id !== ID && !have.has(a.id));
    const full = LAUNCH.length >= MAXN, add = it => { if (LAUNCH.length < MAXN) { LAUNCH.push(mk(it)); sfx.pop(); drawWin(); } };
    const grid = h('div', { class: 'mpie-items' }, LAUNCH.map((it, i) => h('div', { class: 'mpie-li' }, h('img', { src: imgOf(it), alt: '' }), h('div', {}, h('b', {}, nameOf(it)), h('span', {}, KIND[it.k][T(0, 1)])),
      h('span', { class: 'mpie-acts' },
        h('button', { type: 'button', title: T('Plus tôt dans le cercle', 'Earlier in the ring'), 'aria-label': T('Plus tôt dans le cercle', 'Earlier in the ring'), disabled: i === 0, onclick: () => { [LAUNCH[i - 1], LAUNCH[i]] = [LAUNCH[i], LAUNCH[i - 1]]; sfx.tick(); drawWin(); } }, '‹'),
        h('button', { type: 'button', title: T('Plus tard dans le cercle', 'Later in the ring'), 'aria-label': T('Plus tard dans le cercle', 'Later in the ring'), disabled: i === LAUNCH.length - 1, onclick: () => { [LAUNCH[i + 1], LAUNCH[i]] = [LAUNCH[i], LAUNCH[i + 1]]; sfx.tick(); drawWin(); } }, '›'),
        h('button', { type: 'button', title: T('Retirer du lanceur', 'Remove from the launcher'), 'aria-label': T('Retirer du lanceur', 'Remove from the launcher'), onclick: () => { LAUNCH.splice(i, 1); sfx.close(); drawWin(); } }, '✕')))));
    return [h('div', { class: 'mpie-wide' },
      h('div', { class: 'mpie-lh' }, note(T('Ajoutez des applis, dossiers ou fichiers. L’ordre suit le cercle, dans le sens horaire depuis le haut.', 'Add apps, folders or files. The order follows the ring, clockwise from the top.')), h('span', { class: 'mpie-mut' }, `${LAUNCH.length} / ${MAXN}`),
        btn(addOpen ? T('FERMER', 'CLOSE') : T('AJOUTER…', 'ADD…'), () => { addOpen = !addOpen; drawWin(); }, 'pri', full && !addOpen)),
      addOpen ? h('div', { class: 'mpie-pool' }, ...pool.map(a => h('button', { type: 'button', class: 'mpie-pi', disabled: full, onclick: () => add(a.id) }, h('img', { src: icon(a.id), alt: '' }), a.id)),
        h('button', { type: 'button', class: 'mpie-pi', disabled: full, onclick: () => add(dir('Documents', 'Documents')) }, h('img', { src: TILES.folder, alt: '' }), T('Dossier', 'Folder')),
        h('button', { type: 'button', class: 'mpie-pi', disabled: full, onclick: () => add(doc('Notes de tournage.txt', 'Shooting notes.txt')) }, h('img', { src: TILES.file, alt: '' }), T('Fichier', 'File'))) : null,
      LAUNCH.length ? grid : note(T('Aucun élément. Ajoutez-en, ou choisissez un préréglage.', 'No items yet. Add some, or pick a preset.')))];
  }
  function tabController() {
    const set = setById(P.set);
    return [card2(T('Jeu de raccourcis', 'Shortcut set'), sel(SETS.map(s => [s[0], setName(s)]), () => P.set, v => { P.set = v; }),
      note(T('Le Contrôleur suit l’appli au premier plan : ici, le Finder ou la fenêtre de devant (jeu générique).', 'The Controller follows the frontmost app: here the Finder, or the front window (generic set).'))),
    card2(T(`Actions (${set[2].length} / 12)`, `Actions (${set[2].length} / 12)`), ...set[2].map(([k, keys]) => row(LBL[k][T(0, 1)], chipKeys(keys)))),
    card2(T('Autorisation', 'Permission'), h('p', { class: 'mpie-ok' }, T('Accessibilité autorisée : le Contrôleur peut envoyer des raccourcis.', 'Accessibility allowed: the Controller can send shortcuts.')), note(T('Rien n’est lu : mPIE envoie seulement les raccourcis que vous choisissez.', 'Nothing is read: mPIE only sends the shortcuts you choose.')))];
  }
  function tabMusic() {
    const tr = track(), tb = (k, a, on) => h('button', { type: 'button', class: 'mpie-tb' + (on ? ' on' : ''), 'aria-label': k, 'aria-pressed': on == null ? false : String(!!on), onclick: () => { sfx.tick(); musicAct(a); }, html: gl(a === 'pp' ? (MU.playing ? 'pause' : 'play') : a, 22) });
    return [card2(T('Lecteur', 'Player'), row(T('Lecteur piloté', 'Player to control'), sel([['auto', T('Automatique', 'Automatic')], ['music', T('Musique', 'Music')], ['spotify', 'Spotify']], () => P.player, v => { P.player = v; })),
      note(T('Automatique : le lecteur ouvert, de préférence celui qui joue.', 'Automatic: the open player, preferably the one playing.'))),
    card2(T('En cours de lecture', 'Now playing'), h('div', { class: 'mpie-np' }, coverEl(tr, 64), h('div', {}, h('b', {}, tr.t), h('span', {}, `${tr.a} · ${P.player === 'spotify' ? 'Spotify' : T('Musique', 'Music')}`))),
      h('div', { class: 'mpie-tr' }, tb(T('Précédent', 'Previous'), 'prev'), tb(MU.playing ? 'Pause' : T('Lecture', 'Play'), 'pp'), tb(T('Suivant', 'Next'), 'next'), tb(T('Aléatoire', 'Shuffle'), 'shuffle', MU.shuffle), tb(T('Répéter', 'Repeat'), 'repeat', MU.repeat))),
    card2(T('Autorisation', 'Permission'), note(T('La première fois, macOS demande si mPIE peut piloter Musique ou Spotify. Ici, un lecteur fictif répond à la place.', 'The first time, macOS asks whether mPIE may control Music or Spotify. Here a pretend player answers instead.')))];
  }
  function applyPreset(p, replace) {
    const items = p.items.map(mk), name = p.n[T(0, 1)];
    if (replace) { LAUNCH = items.slice(0, MAXN); say(T(`Lanceur remplacé : ${LAUNCH.length} éléments (${name}).`, `Launcher replaced: ${LAUNCH.length} items (${name}).`)); }
    else {
      const have = new Set(LAUNCH.filter(x => x.k === 'app').map(x => x.app)), more = items.filter(x => !(x.k === 'app' && have.has(x.app))).slice(0, MAXN - LAUNCH.length);
      LAUNCH = LAUNCH.concat(more); say(T(`${more.length} éléments ajoutés (${name}).`, `${more.length} items added (${name}).`));
    }
    sfx.pop(); drawWin();
  }
  const tabPresets = () => [h('div', { class: 'mpie-wide' }, note(T('Partez d’un ensemble prêt à l’emploi : seules les applis installées sur ce Mac sont retenues, et tout reste modifiable ensuite.', 'Start from a ready-made set: only apps installed on this Mac are kept, and everything stays editable afterwards.'))),
    card2(T('Lanceur de départ', 'Starter launcher'), ...PRESETS.map(p => h('div', { class: 'mpie-pr' }, h('div', { class: 'mpie-ps' }, ...p.items.filter(x => typeof x === 'string').slice(0, 5).map(id => h('img', { src: icon(id), alt: '' }))),
      h('div', { class: 'mpie-pn' }, h('b', {}, p.n[T(0, 1)]), h('span', {}, T(`${p.items.length} applis trouvées`, `${p.items.length} apps found`))),
      btn(T('Ajouter', 'Add'), () => applyPreset(p, false)), btn(T('Remplacer', 'Replace'), async () => {
        const r = await macAlert({ app, title: T('Remplacer le lanceur ?', 'Replace the launcher?'), text: T(`Les ${LAUNCH.length} éléments actuels seront remplacés. Aucun fichier n’est modifié.`, `The ${LAUNCH.length} current items will be replaced. No file is modified.`), buttons: [T('Remplacer', 'Replace'), T('Annuler', 'Cancel')] });
        if (r.i === 0) applyPreset(p, true);
      }, 'pri')))),
    card2(T('Façon d’ouvrir le menu', 'Way to open the menu'), ...PROFILES.map(p => h('button', { type: 'button', class: 'mpie-pf' + (P.profile === p.id ? ' on' : ''), onclick: () => { sfx.tick(); upd(() => { Object.assign(P, { style: p.style, mouse: p.mouse, mod: p.mod, keyboard: p.keyboard, profile: p.id }); }); say(T(`Déclenchement réglé : ${p.n[0]}.`, `Trigger set: ${p.n[1]}.`)); } },
      h('i', {}, P.profile === p.id ? '●' : ''), h('span', {}, h('b', {}, p.n[T(0, 1)]), h('em', {}, p.d[T(0, 1)]))))),
    card2(T('Raccourcis du Contrôleur', 'Controller shortcuts'), note(T(`${SETS.length - 1} applis ont déjà leurs raccourcis, plus un jeu générique pour les autres.`, `${SETS.length - 1} apps already have their shortcuts, plus a generic set for the others.`)),
      btn(T('Rétablir tous les jeux fournis', 'Restore all built-in sets'), () => say(T('Jeux fournis rétablis.', 'Built-in sets restored.'))))];
  const tabUpdates = () => [card2(T('Mises à jour', 'Updates'), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), () => P.auto, v => { P.auto = v; }),
    row(T('Version installée', 'Installed version'), h('span', { class: 'mpie-mut' }, '1.0.0')), btn(T('Rechercher les mises à jour…', 'Check for updates…'), upToDate, 'pri'))];

  function showSettings(tab) {
    if (tab) P.tab = tab;
    if (win && wm.wins.has(win.id)) { wm.restore(win.id); return drawWin(); }
    win = wm.open({ id: 'app:' + ID, appId: app.id, title: ID, w: 920, h: 640, x: 340, y: 100, minw: 800, minh: 520, bare: true, cls: 'socle mpie-win', onclose: w => { if (win === w) win = null; },
      build: w => {
        const root = h('div', { class: 'mpie-root' });
        w.mpDraw = () => {
          const top = root.querySelector('.mpie-body') ? root.querySelector('.mpie-body').scrollTop : 0;
          const body = h('div', { class: 'mpie-body' }), pane = { general: tabGeneral, trigger: tabTrigger, launcher: tabLauncher, controller: tabController, music: tabMusic, presets: tabPresets, updates: tabUpdates }[P.tab]();
          body.append(h('div', { class: 'mpie-grid' }, ...pane));
          root.replaceChildren(bar(app, w, h('span', { class: 'mpie-mut' }, T('Réglages', 'Settings'))),
            h('div', { class: 'mpie-try' }, h('span', { class: 'mpie-ti', html: SIL }), h('p', {}, T('Essayez : maintenez ', 'Try it: hold '), chipKeys(T('⌥ Espace', '⌥ Space')), T(' sur l’écran, ou cliquez sur l’icône de la barre des menus (clic droit : son menu).', ' on the screen, or click the menu bar icon (right-click: its menu).')),
              btn(T('OUVRIR LE CERCLE', 'OPEN THE RING'), () => { closeMacMenu(); R ? closeRing() : openRing(null, 'menu'); }, 'act')),
            h('div', { class: 'mpie-tabs', role: 'tablist' }, TABS().map(([k, l]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(P.tab === k), class: P.tab === k ? 'on' : '', onclick: () => { sfx.tick(); P.tab = k; drawWin(); } }, l))), body);
          body.scrollTop = top;
        };
        w.mpDraw(); return root;
      } });
  }
  function drawWin() { if (win && wm.wins.has(win.id) && win.mpDraw) win.mpDraw(); }

  /* ---------------------------------------------------------------- démarrage */
  addExtra(); sfx.open();
  extra.classList.add('mpie-hint'); later(() => extra && extra.classList.remove('mpie-hint'), 4800);
  showSettings();
  toast({ icon: icon(ID), title: ID, body: T('mPIE est dans la barre des menus : cliquez sur son icône (ou maintenez ⌥ Espace) pour ouvrir le cercle.', 'mPIE is in the menu bar: click its icon (or hold ⌥ Space) to open the ring.'), ms: 8000 });
  return {
    show: () => { if (!win || !wm.wins.has(win.id)) showSettings(); else wm.restore(win.id); if (extra) { extra.classList.add('mpie-hint'); later(() => extra && extra.classList.remove('mpie-hint'), 3800); } },
    relang: () => { closeRing(); closeMacMenu(); if (extra) extra.title = T('Clic : ouvrir le cercle · clic droit : menu', 'Click: open the ring · right-click: menu'); drawWin(); }
  };
}
