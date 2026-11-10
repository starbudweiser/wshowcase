/* Réplique interactive de mORTEX (interface Socle) : mods, plugins triés par LOOT, téléchargements et installateur FOMOD,
   Time Machine (clones APFS), Atelier DXMT. Données fictives : aucun fichier n'est lu, aucun réseau. */
import { lang } from '../i18n.js';
import { h, brand, esc, wait, reduced, clamp, T, num, sfx, wm, toast, icon, download, css, S } from './kit.js';
css('css/demos/mORTEX.css');

/* Nom d'appli dans les textes : la lettre minuscule initiale prend la couleur du logo (règle Socle), jamais dans un menu déroulant. */
const NAMES = { mORTEX: '#f59e0b', mABBAJACK: '#5aa9ff', csSETTINGS: '#38bdf8', mTRANSLATOR: '#4285f4' }, NRE = /\b(mORTEX|mABBAJACK|csSETTINGS|mTRANSLATOR)\b/;
function tint(el) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => (NRE.test(n.nodeValue) && !n.parentNode.closest('.lc,input,textarea,select,option,[data-nobrand],.mtx-pop,.mtr-menu,.mbj-menu,.csx-menu') ? 1 : 3) }), list = [];
  while (tw.nextNode()) list.push(tw.currentNode);
  list.forEach(n => { const sp = document.createElement('span'); sp.innerHTML = esc(n.nodeValue).replace(new RegExp(NRE.source, 'g'), m => brand(m, NAMES[m])); n.replaceWith(...sp.childNodes); });
}

/* ---------- icônes ---------- */
const P = {
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', layers: 'M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  box: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7', plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4', wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4', save: 'M5 3h12l4 4v14H3V3zM7 3v6h8V3M7 21v-7h10v7', down: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  cpu: 'M7 7h10v10H7zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3', hist: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  pulse: 'M3 12h4l2-5 4 10 2-5h6', grid: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z', pad: 'M6 12h4M8 10v4M15 13h.01M18 11h.01M17.3 5H6.7a4 4 0 0 0-4 3.4l-1 6.3A3 3 0 0 0 7 17l1-2h8l1 2a3 3 0 0 0 5.3-2.3l-1-6.3a4 4 0 0 0-4-3.4z',
  puzzle: 'M12 3a2 2 0 0 1 2 2v1h4v4h1a2 2 0 1 1 0 4h-1v4h-4v-1a2 2 0 1 0-4 0v1H6v-4H5a2 2 0 1 1 0-4h1V6h4V5a2 2 0 0 1 2-2z', gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  plus: 'M12 8v8M8 12h8M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', refresh: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5', dots: 'M5 12h.01M12 12h.01M19 12h.01', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  chev: 'M6 9l6 6 6-6', chevr: 'M9 6l6 6-6 6', check: 'M4 12l5 5L20 6', warn: 'M12 3l10 18H2zM12 10v5M12 18h.01', image: 'M4 5h16v14H4zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4M4 17l5-5 4 4 3-3 4 4',
  feather: 'M20 4c-8 0-14 5-14 12v4M6 16h8M12 12h6M16 8h4', arch: 'M3 4h18v5H3zM5 9v11h14V9M10 13h4', crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z', play: 'M7 4l13 8-13 8z', trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  camera: 'M4 7h4l2-3h4l2 3h4v12H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8', tree: 'M12 3v5M12 8H5v5M12 8h7v5M5 13v8M19 13v8', x: 'M6 6l12 12M18 6L6 18', route: 'M5 5a2 2 0 1 0 0 .01M19 19a2 2 0 1 0 0 .01M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', hub: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 3v5M12 16v5M3 12h5M16 12h5', folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5'
};
const svg = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const I = n => h('span', { class: 'mtx-ico', html: svg(n) });
const NEXUS = 'nexusmods.com';

/* ---------- données d'exemple ---------- */
const MODS = [
  { id: 'skse', n: 'SKSE64', v: '2.2.6', cat: 'Modders Resources', en: 1, inst: 1, mb: 4, files: 38, nx: 30379 },
  { id: 'addr', n: 'Address Library for SKSE Plugins', v: '11', cat: 'Modders Resources', en: 1, inst: 1, mb: 12, files: 4, nx: 32444 },
  { id: 'cs', n: 'Community Shaders (Bottled)', v: '1.1.4', cat: 'Visuals and Graphics', en: 1, inst: 1, mb: 212, files: 640, nx: 86492, pl: 'CommunityShaders.esp' },
  { id: 'sdt', n: 'SSE Display Tweaks', v: '0.7.1', cat: 'Utilities', en: 1, inst: 1, mb: 2, files: 6, nx: 34705 },
  { id: 'ard', n: 'Ancient Realms HD', v: '2.1.0', cat: 'Models and Textures', en: 1, inst: 1, mb: 3482, files: 2418, nx: 51207, pl: 'AncientRealmsHD.esp' },
  { id: 'iwo', n: 'Immersive Weather Overhaul', v: '4.0.3', cat: 'Visuals and Graphics', en: 1, inst: 1, mb: 640, files: 312, nx: 41903, pl: 'ImmersiveWeather.esp', nv: '4.1.0' },
  { id: 'fap', n: 'Frost & Ash Patch', v: '1.2.0', cat: 'Patches', en: 1, inst: 1, mb: 6, files: 14, nx: 60118, pl: 'FrostAshPatch.esp' },
  { id: 'drw', n: 'Dragon Rework', v: '3.4.1', cat: 'Gameplay', en: 1, inst: 1, mb: 180, files: 226, nx: 28850, pl: 'DragonRework.esp' },
  { id: 'cli', n: 'Cinematic Lighting', v: '1.0.7', cat: 'Visuals and Graphics', en: 0, inst: 1, mb: 74, files: 90, nx: 70231, pl: 'CinematicLighting.esp' },
  { id: 'bdu', n: 'Better Dialogue UI', v: '2.3', cat: 'User Interface', en: 1, inst: 1, mb: 9, files: 31, nx: 12877, pl: 'BetterDialogue.esp' },
  { id: 'iha', n: 'Ironhold Armory', v: '1.5.0', cat: 'Armour', en: 1, inst: 1, mb: 420, files: 507, nx: 36042, pl: 'IronholdArmory.esp' },
  { id: 'wfq', n: 'Winterfell Quests', v: '2.0.2', cat: 'Quests and Adventures', en: 1, inst: 1, mb: 96, files: 148, nx: 45530, pl: 'WinterfellQuests.esp' },
  { id: 'amr', n: 'Amber Realm', v: '1.1.0', cat: 'New Lands', en: 1, inst: 1, mb: 1320, files: 1160, nx: 57009, pl: 'AmberRealm.esm' },
  { id: 'hsi', n: 'Hearthside Interiors 4K', v: '1.4.0', cat: 'Models and Textures', en: 0, inst: 0, mb: 1900, files: 812, nx: 55212, pl: 'HearthsideInteriors.esp' },
  { id: 'aul', n: 'Aurora Lanterns', v: '1.0.3', cat: 'Visuals and Graphics', en: 0, inst: 0, mb: 38, files: 52, nx: 8812, pl: 'AuroraLanterns.esl' }
];
const PL = [
  ['Skyrim.esm', 'esm', 0], ['Update.esm', 'esm', 0], ['Dawnguard.esm', 'esm', 0], ['HearthFires.esm', 'esm', 0], ['Dragonborn.esm', 'esm', 0],
  ['AncientRealmsHD.esp', 'esp', 'ard'], ['FrostAshPatch.esp', 'esp', 'fap'], ['ImmersiveWeather.esp', 'esp', 'iwo'], ['CommunityShaders.esp', 'esp', 'cs'], ['DragonRework.esp', 'esp', 'drw'], ['BetterDialogue.esp', 'esp', 'bdu'],
  ['WinterfellQuests.esp', 'esp', 'wfq'], ['IronholdArmory.esp', 'esp', 'iha'], ['CinematicLighting.esp', 'esp', 'cli'], ['AmberRealm.esm', 'esm', 'amr'], ['HearthsideInteriors.esp', 'esp', 'hsi'], ['AuroraLanterns.esl', 'esl', 'aul']
].map(([n, k, m], i) => ({ n, k, m: m || null, on: 1, o: i, bsa: ['ard', 'iwo', 'amr', 'iha', 'hsi'].includes(m) || !m, g: { fap: 'Patches', cs: 'Early loaders', bdu: 'UI', wfq: 'Quests', iha: 'Crafting' }[m] || '' }));
const SORT = ['Skyrim.esm', 'Update.esm', 'Dawnguard.esm', 'HearthFires.esm', 'Dragonborn.esm', 'AmberRealm.esm', 'CommunityShaders.esp', 'AncientRealmsHD.esp', 'ImmersiveWeather.esp', 'FrostAshPatch.esp', 'DragonRework.esp', 'IronholdArmory.esp', 'WinterfellQuests.esp', 'BetterDialogue.esp', 'CinematicLighting.esp', 'HearthsideInteriors.esp', 'AuroraLanterns.esl'];
const ARCH = [['Hearthside Interiors 4K-55212-1-4-0.7z', 'hsi', 1900, 1], ['Aurora Lanterns-8812-1-0-3.zip', 'aul', 38, 0], ['Immersive Weather Overhaul 4.1.0-41903.7z', 'iwo', 655, 0, 1], ['Ancient Realms HD-51207-2-1-0.7z', 'ard', 3482, 0], ['Community Shaders Bottled 1.1.4-86492.zip', 'cs', 212, 0], ['Dragon Rework-28850-3-4-1.7z', 'drw', 180, 0], ['Ironhold Armory-36042-1-5-0.7z', 'iha', 420, 0], ['SKSE64 2.2.6-30379.7z', 'skse', 4, 0]];
const FOMOD = () => [
  { t: T('Qualité des textures', 'Texture quality'), multi: 0, opts: [[T('4K (recommandé)', '4K (recommended)'), T('Textures 4096 × 4096 pour un rendu net. Demande 8 Go de mémoire vidéo.', '4096 × 4096 textures for a crisp look. Needs 8 GB of video memory.')], ['2K', T('Équilibré : bon rendu pour une carte graphique modeste.', 'Balanced: a good look on a modest graphics card.')], ['1K', T('Léger : pour les petites configurations.', 'Light: for small setups.')]], def: [0] },
  { t: T('Éclairage', 'Lighting'), multi: 1, opts: [[T('Bougies chaleureuses', 'Warm candlelight'), T('Lumière ambrée dans toutes les maisons.', 'Amber light in every house.')], [T('Feux plus vifs', 'Brighter fires'), T('Les âtres éclairent davantage la pièce.', 'Hearths light the room more.')], [T('Ombres douces (Community Shaders)', 'Soft shadows (Community Shaders)'), T('Utilise le pont d’ombres de Bottled Shaders.', 'Uses the Bottled Shaders shadow bridge.')]], def: [0, 2] },
  { t: T('Patchs de compatibilité', 'Compatibility patches'), multi: 1, opts: [['Amber Realm', T('Intérieurs adaptés aux nouvelles terres.', 'Interiors adapted to the new lands.')], ['Winterfell Quests', T('Corrige deux salles de quête.', 'Fixes two quest rooms.')]], def: [0] }];
const NAV = () => ({
  game: [['profiles', 'users'], ['collections', 'layers', 'pur'], ['mods', 'box'], ['plugins', 'plug'], ['tools', 'wrench'], ['gset', 'sliders'], ['saves', 'save'], ['downloads', 'down'], ['dxmt', 'cpu', 'mac'], ['tm', 'hist', 'mac'], ['ini', 'sliders', 'grn']],
  tools: [['nexus', 'search', 'blu'], ['health', 'pulse']], app: [['dash', 'grid'], ['games', 'pad'], ['ext', 'puzzle'], ['settings', 'gear']] });
const LAB = { profiles: ['Profils', 'Profiles'], collections: ['Collections', 'Collections'], mods: ['Mods', 'Mods'], plugins: ['Plugins', 'Plugins'], tools: ['Outils', 'Tools'], gset: ['Réglages du jeu', 'Game settings'], saves: ['Sauvegardes', 'Save games'], downloads: ['Téléchargements', 'Downloads'], dxmt: ['Atelier DXMT', 'DXMT workshop'], tm: ['Time Machine', 'Time Machine'], ini: ['Éditeur de réglages', 'Settings editor'], nexus: ['Parcourir Nexus Mods', 'Browse Nexus Mods'], health: ['Contrôle de santé', 'Health check'], dash: ['Tableau de bord', 'Dashboard'], games: ['Jeux', 'Games'], ext: ['Extensions', 'Extensions'], settings: ['Réglages', 'Settings'] };
const GROUPS = { game: ['JEU', 'GAME'], tools: ['OUTILS', 'TOOLS'], app: ['APPLICATION', 'APPLICATION'] };
const lab = id => T(...LAB[id]);
const CAT = { 'Modders Resources': ['Ressources de moddeurs', 'Modders Resources'], 'Visuals and Graphics': ['Visuels et graphismes', 'Visuals and Graphics'], Utilities: ['Utilitaires', 'Utilities'], 'Models and Textures': ['Modèles et textures', 'Models and Textures'], Patches: ['Correctifs', 'Patches'], Gameplay: ['Gameplay', 'Gameplay'], 'User Interface': ['Interface', 'User Interface'], Armour: ['Armures', 'Armour'], 'Quests and Adventures': ['Quêtes et aventures', 'Quests and Adventures'], 'New Lands': ['Nouvelles terres', 'New Lands'] };
const catL = c => T(...(CAT[c] || [c, c]));

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 690, x: 250, y: 88, minw: 940, minh: 600, bare: true, cls: 'socle mtx-win', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); }, build: w => build(app, w) });
}

function build(app, w) {
  const loc = lang() === 'fr' ? 'fr-FR' : 'en-US';
  const mods = MODS.map(m => ({ ...m, added: Date.now() - 86400000 * 3 })), pls = PL.map(p => ({ ...p }));
  const st = { page: 'mods', filter: 'all', view: 'all', q: '', dirty: 0, sel: null, exp: new Set(), deploy: 'ok', sorted: false, ruled: false, notif: [], unread: 1, checked: false, dxmt: null, dxbusy: false, running: 0, plsel: 'Skyrim.esm', plq: '', plf: 'all', dropMin: false, lootBanner: true };
  const order = NAV(); let ui = {}, pop = null; const timers = new Set(), alive = () => !w.dead;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); return t; };
  const offs = new Set(); w.cleanup = () => { timers.forEach(clearTimeout); document.removeEventListener('pointermove', dragMove); document.removeEventListener('pointerup', dragEnd); offs.forEach(f => f()); };
  const mine = () => S.active === w && !w.min;
  const root = h('div', { class: 'mtx', tabindex: '-1' });
  const hhmm = d => new Date(d).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  const installed = () => mods.filter(m => m.inst), enabled = () => mods.filter(m => m.inst && m.en);
  const byId = id => mods.find(m => m.id === id);
  const upd = m => m.inst && m.up;
  const conflict = m => m.inst && m.en && !st.ruled && (m.id === 'drw' || m.id === 'iha') && byId('drw').en && byId('iha').en;
  const size = mb => (mb >= 1024 ? (mb / 1024).toFixed(1) + ' ' + T('Go', 'GB') : mb + ' ' + T('Mo', 'MB'));
  const dirty = () => { st.dirty = 1; if (st.deploy === 'ok') st.deploy = 'pending'; refreshBar(); };

  /* ---------- notifications ---------- */
  const notify = (title, body, c) => { st.notif.unshift({ title, body, c: c || 'var(--s-acct)', t: Date.now() }); st.notif.length = Math.min(st.notif.length, 6); st.unread++; refreshBar(); };
  notify(T('LOOT : masterlist à jour', 'LOOT: masterlist up to date'), T('Les règles de tri de 1 214 plugins sont chargées.', 'Sorting rules for 1,214 plugins are loaded.'), 'var(--s-ok)'); st.unread = 1;

  /* ---------- Time Machine ---------- */
  const dayMs = 86400000, now0 = Date.now();
  const snaps = [];
  const mkSnap = (when, reason, prof, inst, en, ord) => snaps.push({ id: Math.random().toString(36).slice(2), when, reason, prof, inst: new Set(inst), en: new Set(en), ord });
  const curSnap = () => ({ inst: mods.filter(m => m.inst).map(m => m.id), en: mods.filter(m => m.inst && m.en).map(m => m.id), ord: pls.map(p => p.n) });
  const addSnap = reason => { const c = curSnap(); mkSnap(Date.now(), reason, 'Default', c.inst, c.en, c.ord); snaps.sort((a, b) => b.when - a.when); return snaps.find(s => s.when >= Date.now() - 5); };
  const at = (days, hh, mm) => { const d = new Date(now0 - days * dayMs); d.setHours(hh, mm, 0, 0); return d.getTime(); };
  { const c = curSnap(); const old1 = c.inst.filter(i => i !== 'amr'), old2 = old1.filter(i => i !== 'wfq' && i !== 'bdu'), old3 = old2.filter(i => i !== 'fap');
    mkSnap(now0 - 95 * 60000, 'Before deployment', 'Default', c.inst, c.en, c.ord); mkSnap(at(1, 14, 13), 'Before deployment', 'Default', old1, old1.filter(i => i !== 'iwo'), c.ord);
    mkSnap(at(1, 13, 49), 'Before deployment', 'Default', old2, old2, c.ord); mkSnap(at(1, 13, 12), 'By hand', 'Default', old3, old3.filter(i => i !== 'cs'), c.ord); mkSnap(at(1, 13, 12) - 60000, 'Before deployment', 'Immersive & Adult', old3, [], c.ord); snaps.sort((a, b) => b.when - a.when); }
  const changes = s => mods.filter(m => (s.inst.has(m.id) !== !!m.inst) || (s.en.has(m.id) !== !!(m.inst && m.en))).length;

  /* ---------- popovers et feuilles ---------- */
  const closePop = () => { if (pop) { pop.remove(); pop = null; } };
  root.addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !e.target.closest('[data-pop]')) closePop(); }, true);
  function popOver(anchor, kids, cls, right) {
    const same = pop && pop.dataset.for === anchor.dataset.pop; closePop(); if (same) return;
    const m = h('div', { class: 'mtx-pop ' + (cls || ''), 'data-for': anchor.dataset.pop }, kids); root.append(m); pop = m;
    const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect(), sc = S.scale || 1;
    m.style.top = (a.bottom - r.top) / sc + 4 + 'px'; const L = right ? (a.right - r.left) / sc - m.offsetWidth : (a.left - r.left) / sc; m.style.left = clamp(L, 8, root.clientWidth - m.offsetWidth - 8) + 'px';
    return m;
  }
  const menuBtn = (label, fn, o = {}) => h('button', { class: o.on ? 'on' : '', disabled: !!o.disabled, onclick: () => { closePop(); fn && fn(); } }, label);
  function sheet(title, body, foot, wide) {
    const close = () => { sh.remove(); document.removeEventListener('keydown', esc, true); offs.delete(close); w.el.focus({ preventScroll: true }); };
    const esc = e => { if (e.key === 'Escape' && mine()) { e.stopPropagation(); if (!sh.dataset.busy) close(); } };
    const sh = h('div', { class: 'mtx-sheet', onpointerdown: e => { if (e.target === sh && !sh.dataset.busy) close(); } },
      h('div', { class: 'mtx-pan' + (wide ? ' wide' : ''), role: 'dialog', 'aria-label': title, tabindex: '-1' }, h('div', { class: 'mtx-sh' }, h('h4', {}, title), h('button', { class: 'x', 'aria-label': T('Fermer', 'Close'), onclick: () => { if (!sh.dataset.busy) close(); } }, '×')), h('div', { class: 'mtx-sb' }, body), foot ? h('div', { class: 'mtx-sf' }, foot) : null));
    document.addEventListener('keydown', esc, true); offs.add(close); root.append(sh); tint(sh); sh.firstChild.focus({ preventScroll: true });
    sh.firstChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    return { close, el: sh, busy: v => { v ? (sh.dataset.busy = '1') : delete sh.dataset.busy; } };
  }
  const confirm = (title, text, ok, fn) => { const s = sheet(title, h('p', {}, text), [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { s.close(); fn(); } }, ok)]); };

  /* ---------- structure ---------- */
  function layout() {
    ui = {};
    ui.bar = h('div', { class: 'sbar', 'data-drag': '' }); ui.side = h('aside', { class: 'mtx-side', 'aria-label': 'Navigation' }); ui.main = h('main', { class: 'mtx-main' }); ui.status = h('footer', { class: 'mtx-status' });
    root.replaceChildren(ui.bar, ui.side, ui.main, ui.status); drawBar(); drawSide(); drawPage(); refreshBar();
  }
  function drawBar() {
    ui.play = h('button', { class: 'sbtn act', onclick: primary }); ui.bell = h('button', { class: 'mtx-bell', 'data-pop': 'bell', 'aria-label': T('Notifications', 'Notifications'), onclick: e => bellMenu(e.currentTarget) }, I('bell'), h('i', { hidden: true }));
    ui.bar.replaceChildren(wm.lights(w), h('img', { src: icon(app.id), alt: '', style: { width: '24px', height: '24px', marginLeft: '6px', borderRadius: '5px' } }), h('b', { html: brand(app.id, app.accent) }),
      h('button', { class: 'mtx-game', 'data-pop': 'game', onclick: e => popOver(e.currentTarget, [menuBtn('Skyrim Special Edition', null, { on: 1 }), h('hr'), menuBtn(T('Gérer les jeux', 'Manage games'), () => go('games'))]) }, 'Skyrim Special Edition', I('chev')),
      h('div', { class: 'mtx-bar' }, h('span', { class: 'mtx-ver' }, 'v1.0.0'), h('span', { class: 'mtx-prem' }, 'PREMIUM'), ui.bell, h('span', { class: 'mtx-av' }), ui.play));
  }
  function refreshBar() {
    if (!ui.play) return; const d = st.deploy;
    ui.play.disabled = d === 'busy' || st.running; ui.play.classList.toggle('busy', d === 'busy' || !!st.running);
    ui.play.replaceChildren(...(d === 'busy' ? [h('i', { class: 'mtx-spin' }), T('DÉPLOIEMENT', 'DEPLOYING')] : st.running ? [h('i', { class: 'mtx-spin' }), T('LANCEMENT', 'LAUNCHING')] : d === 'pending' ? [h('span', { html: svg('down') }), T('DÉPLOYER', 'DEPLOY')] : [h('span', { html: svg('play') }), T('JOUER', 'PLAY')]));
    ui.play.title = d === 'pending' ? T('Déployer les mods (⌘D)', 'Deploy mods (⌘D)') : T('Lancer Skyrim SE', 'Launch Skyrim SE');
    ui.bell.lastChild.hidden = !st.unread;
    const inst = installed().length, en = enabled().length;
    ui.status.replaceChildren(h('span', {}, h('b', {}, inst), ' ' + T(inst > 1 ? 'mods installés' : 'mod installé', inst > 1 ? 'mods installed' : 'mod installed')), h('span', {}, h('b', {}, en), ' ' + T('activés', 'enabled')),
      h('span', { class: d === 'ok' ? 'ok' : 'wn' }, T('Déploiement : ', 'Deployment: ') + (d === 'ok' ? T('à jour', 'up to date') : d === 'busy' ? T('en cours', 'in progress') : T('modifications en attente', 'changes pending'))), h('span', { class: 'sp' }), h('span', {}, T('Nexus : connecté (Premium)', 'Nexus: connected (Premium)')), h('button', { class: 'sbtn', style: { height: '18px', padding: '0 10px', fontSize: '10.5px' }, disabled: !app.download, onclick: () => download(app) }, T('Télécharger', 'Download')));
    const mc = ui.side && ui.side.querySelector('[data-id="mods"] em'); if (mc) mc.textContent = inst;
  }
  function primary() {
    if (st.deploy === 'pending') return deploy();
    sfx.click(); st.running = 1; refreshBar();
    later(() => { st.running = 0; refreshBar(); sfx.done(); toast({ icon: icon(app.id), title: app.id, body: T('Skyrim SE lancé dans la bouteille CrossOver.', 'Skyrim SE launched in the CrossOver bottle.') }); }, reduced() ? 100 : 2400);
  }
  async function deploy() {
    if (st.deploy !== 'pending') return; st.deploy = 'busy'; addSnap('Before deployment'); refreshBar(); sfx.click(); if (st.page === 'tm') drawPage();
    const n = enabled().reduce((a, m) => a + m.files, 0); const bar = h('div', { class: 'sprog', style: { width: '100%' } }, h('i')), lg = h('pre', { class: 'mtx-log' });
    const s = sheet(T('Déploiement', 'Deployment'), [h('p', {}, T('Liens physiques vers le dossier Data. Un instantané est pris avant.', 'Hardlinks into the Data folder. A snapshot is taken first.')), bar, lg]); s.busy(1);
    const files = ['Data/meshes/armor/…', 'Data/textures/terrain/…', 'Data/Scripts/…', 'Data/SKSE/Plugins/…', 'Data/Interface/…', 'Data/Sound/fx/…'];
    for (let i = 0; i <= 10 && alive(); i++) { bar.firstChild.style.width = i * 10 + '%'; lg.textContent = files.slice(Math.max(0, Math.floor(i / 10 * files.length) - 4), Math.floor(i / 10 * files.length) + 1).map(f => T('lien : ', 'link: ') + f).join('\n'); if (i % 2 === 0) sfx.tick(); if (!reduced()) await wait(160); }
    if (!alive()) return; st.deploy = 'ok'; st.dirty = 0; s.busy(0); s.close(); refreshBar(); sfx.done();
    notify(T('Déploiement terminé', 'Deployment complete'), T(`${enabled().length} mods, ${num(n)} fichiers liés.`, `${enabled().length} mods, ${num(n)} files linked.`), 'var(--s-ok)');
    toast({ icon: icon(app.id), title: app.id, body: T(`Déploiement terminé : ${num(n)} fichiers liés.`, `Deployment complete: ${num(n)} files linked.`) });
    if (st.page === 'tm') drawPage();
  }
  function bellMenu(anchor) {
    st.unread = 0; refreshBar();
    popOver(anchor, st.notif.length ? st.notif.map(n => h('div', { class: 'n', style: { '--c': n.c } }, h('div', {}, h('b', {}, n.title), h('span', {}, n.body)))) : h('div', { class: 'none' }, T('Aucune notification.', 'No notifications.')), 'mtx-nf', true);
  }

  /* ---------- barre latérale (ordre personnalisable par glisser) ---------- */
  function drawSide() {
    ui.side.replaceChildren();
    for (const g of ['game', 'tools', 'app']) {
      ui.side.append(h('div', { class: 'mtx-gh' }, T(...GROUPS[g])));
      order[g].forEach(([id, ic, c]) => ui.side.append(h('button', { class: 'mtx-it ' + (c || '') + (st.page === id ? ' on' : ''), 'data-id': id, 'data-g': g, title: T('Glissez pour réordonner', 'Drag to reorder'), onpointerdown: e => dragStart(e, id, g), onclick: e => { if (drag && drag.moved) return; go(id); } },
        I(ic), h('span', { class: 'l' }, lab(id)), id === 'mods' ? h('em', {}, installed().length) : id === 'downloads' ? h('em', {}, ARCH.length + 6) : null)));
    }
  }
  let drag = null;
  function dragStart(e, id, g) {
    if (e.button !== 0) return; const el = e.currentTarget, items = [...ui.side.querySelectorAll(`.mtx-it[data-g="${g}"]`)];
    drag = { id, g, el, items, y0: e.clientY, i0: items.indexOf(el), moved: false, hs: items.map(x => x.offsetTop), ih: el.offsetHeight };
    document.addEventListener('pointermove', dragMove); document.addEventListener('pointerup', dragEnd);
  }
  function dragMove(e) {
    if (!drag) return; const sc = S.scale || 1, dy = (e.clientY - drag.y0) / sc;
    if (!drag.moved && Math.abs(dy) < 6) return; if (!drag.moved) { drag.moved = true; drag.el.classList.add('lift'); sfx.tick(); ui.side.classList.add('dragging'); }
    const min = -drag.i0 * drag.ih, max = (drag.items.length - 1 - drag.i0) * drag.ih, cy = clamp(dy, min, max); drag.el.style.transform = `translateY(${cy}px)`;
    drag.to = clamp(Math.round(drag.i0 + cy / drag.ih), 0, drag.items.length - 1);
    drag.items.forEach((x, i) => { if (x === drag.el) return; let sh = 0; if (drag.to > drag.i0 && i > drag.i0 && i <= drag.to) sh = -drag.ih; if (drag.to < drag.i0 && i < drag.i0 && i >= drag.to) sh = drag.ih; x.style.transform = sh ? `translateY(${sh}px)` : ''; });
  }
  function dragEnd() {
    document.removeEventListener('pointermove', dragMove); document.removeEventListener('pointerup', dragEnd);
    const d = drag; if (!d) return; if (d.moved && d.to != null && d.to !== d.i0) { const a = order[d.g], [x] = a.splice(d.i0, 1); a.splice(d.to, 0, x); sfx.pop(); }
    setTimeout(() => { drag = null; }, 0); if (d.moved) drawSide();
  }
  function go(id) { if (!alive()) return; closePop(); st.page = id; ui.side.querySelectorAll('.mtx-it').forEach(b => b.classList.toggle('on', b.dataset.id === id)); sfx.tick(); drawPage(); }
  function drawPage() {
    ui.main.replaceChildren(); ui.main.classList.remove('dropping');
    ({ mods: pageMods, plugins: pagePlugins, downloads: pageDownloads, tm: pageTm, dxmt: pageDxmt }[st.page] || pageStub)(); tint(ui.main);
  }

  /* ---------- page Mods ---------- */
  function listMods() {
    const q = st.q.trim().toLowerCase();
    return installed().filter(m => (st.filter === 'all' || (st.filter === 'on' && m.en) || (st.filter === 'conf' && conflict(m)) || (st.filter === 'upd' && upd(m))) && (!q || (m.n + ' ' + m.cat).toLowerCase().includes(q)));
  }
  function pageMods() {
    ui.main.replaceChildren();
    const inst = installed(), cnt = { all: inst.length, on: enabled().length, conf: inst.filter(conflict).length, upd: inst.filter(upd).length };
    ui.segs = {}; const segL = { all: T('Tous', 'All'), on: T('Activés', 'Enabled'), conf: T('Conflits', 'Conflicts'), upd: T('Mises à jour', 'Updates') };
    const seg = h('div', { class: 'ssegs', role: 'group' }, Object.keys(segL).map(k => ui.segs[k] = h('button', { class: st.filter === k ? 'on' : '', onclick: () => { st.filter = k; sfx.tick(); pageMods(); } }, segL[k] + (k === 'all' ? '' : ' ' + cnt[k]))));
    const views = h('div', { class: 'mtx-views' }, [['all', T('Tous les mods', 'All mods')], ['status', T('Statut', 'Status')], ['cat', T('Catégories', 'Categories')]].map(([k, n]) => h('button', { class: st.view === k ? 'on' : '', onclick: () => { st.view = k; sfx.tick(); pageMods(); } }, n)));
    const find = h('label', { class: 'mtx-find' }, h('span', { html: svg('search') }), ui.q = h('input', { type: 'search', placeholder: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), value: st.q, oninput: e => { st.q = e.target.value; drawRows(); } }));
    const tb = (ic, t, fn, extra) => h('button', { class: 'sbtn sm ico', title: t, 'aria-label': t, onclick: fn, ...extra }, I(ic));
    ui.refresh = tb('refresh', T('Rechercher des mises à jour', 'Check for updates'), checkUpdates);
    ui.main.append(h('div', { class: 'mtx-ph' }, h('h2', {}, I('box'), T('Mods', 'Mods')), h('span', { class: 'sp' }), h('div', { class: 'tools' }, tb('plus', T('Installer depuis un fichier', 'Install from file'), installSheet), ui.refresh,
      tb('dots', T('Plus d’actions', 'More actions'), e => popOver(e.currentTarget, [menuBtn(T('Tout activer', 'Enable all'), () => setAll(1)), menuBtn(T('Tout désactiver', 'Disable all'), () => setAll(0)), h('hr'), menuBtn(T('Ouvrir le dossier de préparation', 'Open the staging folder'), () => toast({ icon: icon(app.id), title: app.id, body: T('Démo : aucun dossier réel.', 'Demo: no real folder.') }))], '', true), { 'data-pop': 'more' }))),
      h('div', { class: 'mtx-sub' }, seg, h('span', { class: 'sp' }), views, find),
      ui.scroll = h('div', { class: 'mtx-scroll' }), dropZone());
    drawRows();
  }
  function drawRows() {
    if (st.page !== 'mods') return; const list = listMods(), tbl = h('div', { class: 'mtx-tbl mtx-mods' }), inst0 = installed();
    if (ui.segs) { const cn = { on: enabled().length, conf: inst0.filter(conflict).length, upd: inst0.filter(upd).length }, nm = { on: T('Activés', 'Enabled'), conf: T('Conflits', 'Conflicts'), upd: T('Mises à jour', 'Updates') }; Object.keys(cn).forEach(k => { ui.segs[k].textContent = nm[k] + ' ' + cn[k]; }); }
    const all = list.length && list.every(m => m.en);
    tbl.append(h('div', { class: 'mtx-r h' }, h('span', {}, h('button', { class: 'mtx-cb' + (all ? ' on' : ''), 'aria-label': T('Tout activer', 'Enable all'), onclick: () => setAll(all ? 0 : 1, list) }, all ? '✓' : ''), ''), h('span'), h('span'), h('span', {}, T('Nom ↓', 'Name ↓')), h('span', {}, 'Version'), h('span', {}, T('Statut du mod', 'Mod status')), h('span', {}, T('Catégorie', 'Category')), h('span', { style: { textAlign: 'right' } }, 'Actions')));
    if (!list.length) tbl.append(h('div', { class: 'mtx-empty' }, h('span', {}, st.q ? T('Aucun mod ne correspond.', 'No mod matches.') : st.filter === 'upd' ? T('Tous les mods sont à jour.', 'All mods are up to date.') : st.filter === 'conf' ? T('Aucun conflit de fichiers non résolu.', 'No unresolved file conflicts.') : T('Aucun mod activé.', 'No enabled mods.'))));
    const group = st.view === 'cat' ? k => catL(k.cat) : st.view === 'status' ? k => (upd(k) ? T('Mise à jour disponible', 'Update available') : k.en ? T('Activés', 'Enabled') : T('Désactivés', 'Disabled')) : null;
    let last = null;
    list.sort((a, b) => (group ? group(a).localeCompare(group(b)) : 0) || a.n.localeCompare(b.n)).forEach(m => {
      if (group && group(m) !== last) { last = group(m); tbl.append(h('div', { class: 'mtx-grp' }, I('chev'), last, h('em', {}, '· ' + list.filter(x => group(x) === last).length))); }
      tbl.append(modRow(m));
    });
    ui.scroll.replaceChildren(tbl);
  }
  function modRow(m, isNew) {
    const open = st.exp.has(m.id), c = conflict(m);
    const pill = m.busy ? h('span', { class: 'mtx-pill in' }, T('Installation', 'Installing')) : upd(m) ? h('span', { class: 'mtx-pill wn' }, T('Mise à jour disponible', 'Update available')) : h('span', { class: 'mtx-pill ok' }, T('À jour', 'Up-to-date'));
    const row = h('div', { class: 'mtx-r' + (m.en ? '' : ' off') + (st.sel === m.id ? ' on' : '') + (isNew ? ' new' : ''), 'data-id': m.id, role: 'row', onclick: e => { if (!e.target.closest('button')) { st.sel = m.id; drawRows(); } } },
      h('span', {}, h('button', { class: 'mtx-cb' + (m.en ? ' on' : ''), role: 'checkbox', 'aria-checked': String(!!m.en), 'aria-label': m.n, onclick: () => toggle(m) }, m.en ? '✓' : '')),
      h('button', { class: 'mtx-xb', 'aria-expanded': String(open), 'aria-label': T('Détails', 'Details'), onclick: () => { open ? st.exp.delete(m.id) : st.exp.add(m.id); drawRows(); } }, open ? '−' : '+'),
      h('span', { class: 'mtx-th' }, I('image')),
      h('span', { class: 'mtx-nm' }, h('b', { title: m.n }, m.n), c ? h('button', { class: 'mtx-warn', title: T('Conflit de fichiers : cliquez pour le résoudre', 'File conflict: click to resolve'), 'aria-label': T('Conflit', 'Conflict'), onclick: conflictSheet }, I('warn')) : null),
      h('span', { class: 'mtx-vr' }, m.v), pill, h('span', { class: 'mtx-ct', title: catL(m.cat) }, catL(m.cat)),
      h('span', { class: 'mtx-act' }, upd(m) ? h('button', { class: 'sbtn acc', onclick: () => updateMod(m) }, T('Mettre à jour', 'Update')) : null,
        h('button', { class: 'mtx-xb', 'data-pop': 'm' + m.id, 'aria-label': T('Actions', 'Actions'), onclick: e => popOver(e.currentTarget, [menuBtn(T('Informations', 'Mod information'), () => { st.exp.add(m.id); drawRows(); }), menuBtn(T('Chercher une mise à jour', 'Check for update'), () => toast({ icon: icon(app.id), title: m.n, body: upd(m) ? T('Une mise à jour est disponible.', 'An update is available.') : T('Ce mod est à jour.', 'This mod is up to date.') })), h('hr'), menuBtn(T('Retirer', 'Remove'), () => removeMod(m))], '', true) }, I('dots'))));
    if (!open) return row;
    const f = h('div', { class: 'mtx-r', style: { padding: 0, border: 0 } }, h('div', { class: 'mtx-det' }, [[T('Source', 'Source'), NEXUS + ' · ID ' + m.nx], [T('Taille', 'Size'), size(m.mb)], [T('Fichiers', 'Files'), num(m.files)], [T('Installé', 'Installed'), new Date(m.added).toLocaleDateString(loc)],
      [T('Plugin', 'Plugin'), m.pl || '—'], [T('Méthode', 'Method'), T('Lien physique', 'Hardlink')], [T('Version', 'Version'), m.v + (upd(m) ? ' → ' + m.nv : '')], [T('Catégorie', 'Category'), catL(m.cat)]].map(([k, v]) => h('div', {}, h('span', {}, k.toUpperCase()), h('b', { title: v }, v)))));
    const wrap = h('div', {}, row, f); wrap.dataset.id = m.id; return wrap;
  }
  function toggle(m, v) { m.en = v == null ? (m.en ? 0 : 1) : v; sfx.tick(); dirty(); drawRows(); refreshBar(); }
  function setAll(v, list) { (list || installed()).forEach(m => { m.en = v; }); sfx.click(); dirty(); drawRows(); }
  function removeMod(m) { confirm(T('Retirer ce mod ?', 'Remove this mod?'), T(`« ${m.n} » sera retiré de la préparation. Le fichier d’archive reste dans Téléchargements.`, `“${m.n}” will be removed from staging. The archive stays in Downloads.`), T('Retirer', 'Remove'), () => { m.inst = 0; m.en = 0; sfx.close(); dirty(); drawRows(); refreshBar(); }); }
  async function checkUpdates() {
    if (ui.refresh.dataset.busy) return; ui.refresh.dataset.busy = 1; const ic = ui.refresh.querySelector('svg'); ic.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 900, iterations: reduced() ? 1 : 2 }); sfx.click();
    await wait(reduced() ? 0 : 1500); if (!alive()) return; delete ui.refresh.dataset.busy; const found = !st.checked; st.checked = true; ['iwo', 'ard'].forEach(id => { const m = byId(id); if (found) { m.up = 1; m.nv = m.nv || '2.2.0'; } });
    if (found) { sfx.pop(); notify(T('2 mises à jour disponibles', '2 updates available'), 'Immersive Weather Overhaul, Ancient Realms HD', 'var(--s-wn)'); toast({ icon: icon(app.id), title: app.id, body: T('2 mises à jour disponibles.', '2 updates available.') }); } else toast({ icon: icon(app.id), title: app.id, body: T('Aucune nouvelle mise à jour.', 'No new update.') });
    if (st.page === 'mods') pageMods();
  }
  async function updateMod(m) {
    m.busy = 1; drawRows(); sfx.click(); await wait(reduced() ? 0 : 1600); if (!alive()) return; m.busy = 0; m.up = 0; m.v = m.nv; sfx.done(); dirty(); drawRows(); toast({ icon: icon(app.id), title: m.n, body: T(`Mis à jour en version ${m.v}.`, `Updated to version ${m.v}.`) });
  }
  function conflictSheet() {
    const a = byId('drw'), b = byId('iha'); let win = 'iha';
    const vs = h('div', { class: 'mtx-vs' }), draw = () => vs.replaceChildren(h('div', { class: win === 'drw' ? 'w' : '' }, a.n, h('small', {}, win === 'drw' ? T('Prioritaire', 'Wins') : T('Écrasé', 'Overridden'))), h('i', {}, '→'), h('div', { class: win === 'iha' ? 'w' : '' }, b.n, h('small', {}, win === 'iha' ? T('Prioritaire', 'Wins') : T('Écrasé', 'Overridden'))));
    draw(); const s = sheet(T('Conflit de fichiers', 'File conflict'), [h('p', {}, T('Deux mods modifient les mêmes fichiers. Choisissez celui qui doit l’emporter : mORTEX ajoute une règle de priorité.', 'Two mods change the same files. Pick the one that should win: mORTEX adds a load-order rule.')),
      vs, h('div', { class: 'mtx-conf' }, h('span', {}, 'meshes/armor/iron/helmet.nif'), h('span', {}, 'textures/armor/iron/helmet_d.dds'), h('span', {}, 'textures/armor/iron/helmet_n.dds'))],
    [h('button', { class: 'sbtn', onclick: () => { win = win === 'iha' ? 'drw' : 'iha'; sfx.tick(); draw(); } }, T('Inverser', 'Swap')), h('button', { class: 'sbtn', onclick: () => s.close() }, T('Plus tard', 'Later')), h('button', { class: 'sbtn acc', onclick: () => { st.ruled = true; s.close(); sfx.pop(); dirty(); notify(T('Règle ajoutée', 'Rule added'), T(`${win === 'iha' ? b.n : a.n} s’applique après ${win === 'iha' ? a.n : b.n}.`, `${win === 'iha' ? b.n : a.n} loads after ${win === 'iha' ? a.n : b.n}.`), 'var(--s-ok)'); drawRows(); } }, T('Ajouter la règle', 'Add rule'))]);
  }
  function dropZone() {
    const z = h('button', { class: 'mtx-drop', onclick: installSheet }, I('down'), T('Déposez des fichiers ici ou cliquez pour installer depuis un fichier', 'Drop file(s) here or click to install from file'));
    const ok = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
    z.addEventListener('dragover', e => { if (ok(e)) { e.preventDefault(); z.classList.add('over'); } }); z.addEventListener('dragenter', e => { if (ok(e)) { e.preventDefault(); z.classList.add('over'); } });
    z.addEventListener('dragleave', () => z.classList.remove('over')); z.addEventListener('drop', e => { if (!ok(e)) return; e.preventDefault(); z.classList.remove('over'); const next = ARCH.find(a => !byId(a[1]).inst); toast({ icon: icon(app.id), title: app.id, body: T('Démo : votre fichier n’est pas lu, une archive d’exemple est installée.', 'Demo: your file is not read, a sample archive is installed instead.') }); next ? installArchive(next) : installSheet(); });
    return z;
  }
  function installSheet() {
    const pend = ARCH.filter(a => !byId(a[1]).inst);
    const s = sheet(T('Installer depuis un fichier', 'Install from file'), [h('p', {}, T('Démo : choisissez une archive du dossier Téléchargements. Vos fichiers ne sont jamais lus.', 'Demo: pick an archive from the Downloads folder. Your files are never read.')),
      pend.length ? pend.map(a => h('button', { class: 'mtx-fo', onclick: () => { s.close(); installArchive(a); } }, I('box'), h('span', { style: { flex: 1, minWidth: 0 } }, h('b', {}, a[0]), h('small', {}, `${size(a[2])}${a[3] ? ' · ' + T('installateur FOMOD', 'FOMOD installer') : ''}`)))) : h('p', {}, T('Toutes les archives d’exemple sont déjà installées.', 'All sample archives are already installed.'))], h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')));
  }

  /* ---------- installation (FOMOD) ---------- */
  function installArchive(a) {
    const m = byId(a[1]); if (a[4]) return upgrade(a, m);
    if (m.inst) return toast({ icon: icon(app.id), title: app.id, body: T('Ce mod est déjà installé.', 'This mod is already installed.') });
    if (a[3]) return fomod(a, m); runInstall(a, m, m.files);
  }
  function upgrade(a, m) { if (m.nv === m.v) return toast({ icon: icon(app.id), title: m.n, body: T('Ce mod est à jour.', 'This mod is up to date.') }); m.up = 1; go('mods'); updateMod(m); }
  function fomod(a, m) {
    const steps = FOMOD(), pick = steps.map(s => new Set(s.def)); let i = 0, hov = 0;
    const body = h('div', { class: 'mtx-col' }), steplab = h('div', { class: 'mtx-steps' }), next = h('button', { class: 'sbtn act', onclick: () => { if (i < steps.length - 1) { i++; hov = 0; sfx.click(); draw(); } else { s.close(); const n = 400 + pick[0].has(0) * 412 + pick[1].size * 60; runInstall(a, m, n); } } }), back = h('button', { class: 'sbtn', onclick: () => { if (i) { i--; hov = 0; draw(); } else s.close(); } });
    const draw = () => {
      const st0 = steps[i]; next.textContent = i < steps.length - 1 ? T('SUIVANT', 'NEXT') : T('INSTALLER', 'INSTALL'); back.textContent = i ? T('Retour', 'Back') : T('Annuler', 'Cancel');
      steplab.replaceChildren(...steps.map((x, k) => h('i', { class: k === i ? 'on' : '' }, `${k + 1}. ${x.t}`)));
      const sel = st0.opts[hov];
      body.replaceChildren(steplab, h('div', { class: 'mtx-fm' }, h('div', { class: 'opts' }, st0.opts.map(([n, d], k) => h('button', { class: 'mtx-fo' + (pick[i].has(k) ? ' on' : ''), onmouseenter: () => { hov = k; pv(); }, onclick: () => { hov = k; if (st0.multi) { pick[i].has(k) ? pick[i].delete(k) : pick[i].add(k); } else { pick[i].clear(); pick[i].add(k); } sfx.tick(); draw(); } },
        h('i', { class: 'ch ' + (st0.multi ? 'c' : 'r') }, pick[i].has(k) ? '✓' : ''), h('span', {}, h('b', {}, n), h('small', {}, d))))),
        ui.pv = h('div', { class: 'mtx-pv' }, h('div', { class: 'img' }, I('image')), h('b', {}, sel[0]), h('span', {}, sel[1]))));
    };
    const pv = () => { const o = steps[i].opts[hov]; ui.pv.replaceChildren(h('div', { class: 'img' }, I('image')), h('b', {}, o[0]), h('span', {}, o[1])); };
    const s = sheet(`${m.n} · ${T('Installateur', 'Installer')}`, body, [back, next], true); draw();
  }
  async function runInstall(a, m, files) {
    const bar = h('div', { class: 'sprog', style: { width: '100%' } }, h('i')), lg = h('pre', { class: 'mtx-log' }), s = sheet(T('Installation', 'Installing') + ' · ' + m.n, [h('p', {}, T(`Extraction de ${a[0]} dans le dossier de préparation.`, `Extracting ${a[0]} into the staging folder.`)), bar, lg]); s.busy(1); sfx.click();
    const names = ['textures/interiors/whiterun/…', 'meshes/interiors/hearth/…', 'textures/interiors/windhelm/…', 'meshes/lights/lantern01.nif', 'interface/translations/…', m.pl || 'plugin'];
    for (let i = 0; i <= 10 && alive(); i++) { bar.firstChild.style.width = i * 10 + '%'; const k = Math.floor(i / 10 * names.length); lg.textContent = names.slice(Math.max(0, k - 4), k + 1).map(n => T('extrait : ', 'extracted: ') + n).join('\n'); if (i % 2 === 0) sfx.tick(); if (!reduced()) await wait(170); }
    if (!alive()) return; m.inst = 1; m.en = 0; m.files = files; m.added = Date.now(); m.busy = 1; s.busy(0); s.close(); sfx.pop(); st.page = 'mods'; st.filter = 'all'; st.q = ''; drawSide(); drawPage(); refreshBar();
    const row = ui.scroll.querySelector(`[data-id="${m.id}"]`); if (row) { const r = row.classList.contains('mtx-r') ? row : row.firstChild; r.classList.add('new'); ui.scroll.scrollTop = Math.max(0, r.offsetTop - 80); }
    later(() => { m.busy = 0; if (st.page === 'mods') drawRows(); }, reduced() ? 50 : 1800);
    notify(T(`${m.n} installé`, `${m.n} installed`), T('Cochez la case « Activé » puis déployez.', 'Tick “Enabled”, then deploy.'), 'var(--s-ok)'); toast({ icon: icon(app.id), title: app.id, body: T(`${m.n} est installé. Activez-le pour le déployer.`, `${m.n} is installed. Enable it to deploy it.`) });
  }

  /* ---------- page Plugins ---------- */
  const visPl = () => pls.filter(p => !p.m || byId(p.m).inst);
  const act = p => !p.m ? 1 : (byId(p.m).en && p.on);
  const warnsOf = p => { const o = []; if (!st.sorted && p.n === 'FrostAshPatch.esp') o.push(['w', T('Doit se charger après ImmersiveWeather.esp (règle LOOT).', 'Must load after ImmersiveWeather.esp (LOOT rule).')]); if (!st.sorted && p.n === 'AmberRealm.esm') o.push(['w', T('Un plugin maître doit se charger avant les plugins .esp.', 'A master plugin must load before .esp plugins.')]);
    if (p.n === 'CommunityShaders.esp') o.push(['n', T('Requiert Address Library for SKSE Plugins.', 'Requires Address Library for SKSE Plugins.')]); if (p.n === 'IronholdArmory.esp') o.push(['n', T('Propre : 0 ITM, 0 suppression (SSEEdit).', 'Clean: 0 ITM, 0 deleted records (SSEEdit).')]); if (p.n === 'WinterfellQuests.esp') o.push(['n', T('Compatible avec Frost & Ash Patch.', 'Compatible with Frost & Ash Patch.')]); return o; };
  function idx() { let f = 0, l = 0; const m = new Map(); pls.forEach(p => { if (!act(p) || (p.m && !byId(p.m).inst)) return; if (p.k === 'esl') m.set(p.n, 'FE:' + (l++).toString(16).toUpperCase().padStart(3, '0')); else m.set(p.n, (f++).toString(16).toUpperCase().padStart(2, '0')); }); return m; }
  function pagePlugins() {
    ui.main.replaceChildren();
    const find = h('label', { class: 'mtx-find' }, h('span', { html: svg('search') }), h('input', { type: 'search', placeholder: T('Filtrer par nom', 'Filter by name'), 'aria-label': T('Filtrer', 'Filter'), value: st.plq, oninput: e => { st.plq = e.target.value; drawPl(); } }));
    ui.plstat = h('div', { class: 'mtx-stat' }); ui.loot = h('div', { class: 'mtx-loot', hidden: !st.lootBanner });
    const seg = h('div', { class: 'ssegs' }, [['all', T('Tous', 'All')], ['on', T('Activés', 'Enabled')], ['off', T('Désactivés', 'Disabled')], ['warn', T('Alertes', 'Warnings')]].map(([k, n]) => h('button', { class: st.plf === k ? 'on' : '', onclick: () => { st.plf = k; sfx.tick(); pagePlugins(); } }, n)));
    ui.sortBtn = h('button', { class: 'sbtn acc sm', onclick: lootSort, title: T('Trier avec LOOT', 'Sort with LOOT') }, I('tree'), T('Trier avec LOOT', 'Sort with LOOT'));
    ui.main.append(h('div', { class: 'mtx-ph' }, h('h2', {}, I('plug'), T('Plugins', 'Plugins')), h('span', { class: 'sp' }), ui.plstat), h('div', { class: 'mtx-sub' }, ui.sortBtn, seg, h('span', { class: 'sp' }), find), ui.loot, ui.scroll = h('div', { class: 'mtx-scroll' }), ui.insp = h('div', { class: 'mtx-insp' }));
    drawLoot(); drawPl();
  }
  function drawLoot(busy) {
    if (!ui.loot) return; ui.loot.hidden = !st.lootBanner; ui.loot.replaceChildren(...(busy ? [h('i', { class: 'mtx-spin' }), h('span', {}, T('Tri avec LOOT… lecture de la masterlist', 'Sorting with LOOT… reading the masterlist')), h('span', { class: 'sp' }), h('div', { class: 'sprog' }, ui.lbar = h('i'))] : [I('tree'), h('span', {}, T('Le tri automatique de l’ordre de chargement repose sur ', 'Auto load order sorting is powered by '), h('b', {}, 'LOOT')), h('span', { class: 'sp' }), h('button', { class: 'x', 'aria-label': T('Fermer', 'Close'), onclick: () => { st.lootBanner = false; drawLoot(); } }, '×')]));
  }
  function drawPl() {
    if (st.page !== 'plugins') return; const ix = idx(), q = st.plq.trim().toLowerCase(), tbl = h('div', { class: 'mtx-tbl mtx-pl' });
    const all = visPl(), full = all.filter(p => act(p) && p.k !== 'esl').length, lite = all.filter(p => act(p) && p.k === 'esl').length;
    ui.plstat.replaceChildren(h('span', {}, T('Actifs ', 'Active '), h('b', {}, full + lite)), h('span', {}, T('Complets : ', 'Full: '), h('b', {}, `${full} / 254`)), h('span', {}, T('Légers : ', 'Light: '), h('b', {}, `${lite} / 4096`)));
    tbl.append(h('div', { class: 'mtx-r h' }, h('span', {}, T('STATUT', 'STATUS')), h('span', {}, T('NOM', 'NAME')), h('span', {}, T('INDICATEURS', 'FLAGS')), h('span', { style: { textAlign: 'center' } }, T('ORDRE', 'LOAD ORDER')), h('span', { style: { textAlign: 'center' } }, T('INDEX', 'MOD INDEX')), h('span', {}, T('GROUPE', 'GROUP')), h('span')));
    all.filter(p => (!q || p.n.toLowerCase().includes(q)) && (st.plf === 'all' || (st.plf === 'on' && act(p)) || (st.plf === 'off' && !act(p)) || (st.plf === 'warn' && warnsOf(p).some(x => x[0] === 'w')))).forEach(p => {
      const a = act(p), ws = warnsOf(p), n = all.indexOf(p);
      tbl.append(h('div', { class: 'mtx-r' + (st.plsel === p.n ? ' on' : '') + (a ? '' : ' off'), 'data-n': p.n, role: 'row', onclick: e => { if (!e.target.closest('button')) { st.plsel = p.n; drawPl(); } } },
        h('span', {}, h('button', { class: 'mtx-tg ' + (a ? 'on' : 'off'), disabled: !p.m, title: !p.m ? T('Plugin officiel : toujours actif', 'Official plugin: always active') : '', onclick: () => { p.on = p.on ? 0 : 1; sfx.tick(); dirty(); drawPl(); } }, I(a ? 'check' : 'x'), a ? T('Activé', 'Enabled') : T('Désactivé', 'Disabled'))),
        h('span', { class: 'mtx-nm' }, h('b', { title: p.n }, p.n)),
        h('span', { class: 'mtx-fl' }, p.k === 'esm' ? h('span', { title: T('Plugin maître (ESM)', 'Master plugin (ESM)'), html: svg('crown') }) : null, p.k === 'esl' ? h('span', { title: T('Plugin léger (ESL)', 'Light plugin (ESL)'), html: svg('feather') }) : null, p.bsa ? h('span', { title: T('Contient une archive BSA', 'Ships a BSA archive'), html: svg('arch') }) : null, ws.some(x => x[0] === 'w') ? h('span', { class: 'w', title: ws.find(x => x[0] === 'w')[1], html: svg('warn') }) : null),
        h('span', { class: 'lo' }, n), h('span', { class: 'ix' }, a ? ix.get(p.n) || '' : '—'), h('span', { class: p.g ? '' : 'mtx-grpn' }, p.g || 'default'),
        h('button', { class: 'mtx-xb', 'aria-label': T('Dépendances', 'Dependencies'), title: T('Dépendances', 'Dependencies'), onclick: () => { st.plsel = p.n; drawPl(); } }, I('tree'))));
    });
    ui.scroll.replaceChildren(tbl); drawInsp();
  }
  function drawInsp() {
    const p = pls.find(x => x.n === st.plsel) || pls[0], ws = warnsOf(p), m = p.m ? byId(p.m) : null;
    ui.insp.replaceChildren(h('div', { class: 'col' }, h('h4', {}, p.n), h('p', {}, m ? T('Fourni par : ', 'Provided by: ') + m.n + ' ' + m.v : T('Plugin officiel de Skyrim Special Edition.', 'Official Skyrim Special Edition plugin.')), h('p', {}, T('Maîtres : ', 'Masters: ') + (p.k === 'esm' && !p.m ? '—' : 'Skyrim.esm, Update.esm'))),
      h('div', { class: 'col', style: { flex: '1.4' } }, h('h4', {}, T('Messages LOOT', 'LOOT messages')), ws.length ? ws.map(([k, tx]) => h('div', { class: 'mtx-msg ' + k }, I(k === 'w' ? 'warn' : 'check'), h('span', {}, tx))) : h('p', {}, T('Aucun message pour ce plugin.', 'No messages for this plugin.'))));
  }
  async function lootSort() {
    if (ui.sortBtn.disabled) return; ui.sortBtn.disabled = true; st.lootBanner = true; drawLoot(true); sfx.click(); const steps = 8;
    for (let i = 1; i <= steps && alive(); i++) { if (ui.lbar) ui.lbar.style.width = i / steps * 100 + '%'; if (!reduced()) await wait(150); }
    if (!alive() || st.page !== 'plugins') { ui.sortBtn && (ui.sortBtn.disabled = false); return; }
    const before = new Map([...ui.scroll.querySelectorAll('.mtx-r[data-n]')].map(e => [e.dataset.n, e.getBoundingClientRect().top]));
    pls.sort((a, b) => SORT.indexOf(a.n) - SORT.indexOf(b.n)); const was = st.sorted; st.sorted = true; drawLoot(); drawPl();
    const sc = S.scale || 1; if (!reduced()) ui.scroll.querySelectorAll('.mtx-r[data-n]').forEach(e => { const d = (before.get(e.dataset.n) - e.getBoundingClientRect().top) / sc; if (Math.abs(d) > 1) e.animate([{ transform: `translateY(${d}px)`, background: 'color-mix(in srgb,var(--s-acct) 22%,transparent)' }, { transform: 'none', background: 'transparent' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1)' }); });
    ui.sortBtn.disabled = false; sfx.done(); if (!was) notify(T('Tri LOOT réussi', 'LOOT sorting successful'), T('2 avertissements d’ordre corrigés.', '2 load-order warnings fixed.'), 'var(--s-ok)'); toast({ icon: icon(app.id), title: app.id, body: was ? T('L’ordre de chargement est déjà optimal.', 'The load order is already optimal.') : T('Tri LOOT réussi : 2 avertissements corrigés.', 'LOOT sorting successful: 2 warnings fixed.') });
  }

  /* ---------- page Téléchargements ---------- */
  function pageDownloads() {
    ui.main.replaceChildren();
    const rows = ARCH.map(a => { const m = byId(a[1]), done = m.inst && !a[4]; return h('div', { class: 'mtx-r', role: 'row' }, h('span', { class: 'fn', title: a[0] }, a[0]), h('span', { class: 'mtx-ct' }, m.n), h('span', { class: 'sz' }, size(a[2])),
      h('span', {}, h('span', { class: 'mtx-pill ' + (done ? 'ok' : a[4] ? 'wn' : '') }, done ? T('Installé', 'Installed') : a[4] ? T('Mise à jour', 'Update') : T('Non installé', 'Not installed'))),
      h('span', { class: 'mtx-act' }, done ? h('button', { class: 'sbtn', disabled: true }, T('Installé', 'Installed')) : h('button', { class: 'sbtn acc', onclick: () => installArchive(a) }, a[3] ? T('Installer…', 'Install…') : T('Installer', 'Install')))); });
    ui.main.append(h('div', { class: 'mtx-ph' }, h('h2', {}, I('down'), T('Téléchargements', 'Downloads')), h('span', { class: 'sp' }), h('span', { class: 'mtx-stat' }, h('b', {}, ARCH.length), ' ' + T('archives', 'archives'))),
      h('div', { class: 'mtx-scroll' }, h('div', { class: 'mtx-tbl mtx-dl' }, h('div', { class: 'mtx-r h' }, h('span', {}, T('ARCHIVE', 'ARCHIVE')), h('span', {}, 'MOD'), h('span', { style: { textAlign: 'right' } }, T('TAILLE', 'SIZE')), h('span', {}, T('STATUT', 'STATUS')), h('span')), rows)), dropZone());
  }

  /* ---------- page Time Machine ---------- */
  const reasonL = r => ({ 'Before deployment': T('Avant le déploiement', 'Before deployment'), 'By hand': T('Pris à la main', 'Taken by hand'), 'Before going back': T('Avant le retour en arrière', 'Before going back') }[r] || r);
  function pageTm(newId) {
    ui.main.replaceChildren();
    const days = []; const today = new Date().toDateString(), yest = new Date(Date.now() - dayMs).toDateString();
    snaps.forEach(s => { const d = new Date(s.when).toDateString(), lbl = d === today ? T('Aujourd’hui', 'Today') : d === yest ? T('Hier', 'Yesterday') : new Date(s.when).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' }); if (!days.length || days.at(-1)[0] !== lbl) days.push([lbl, []]); days.at(-1)[1].push(s); });
    ui.main.append(h('div', { class: 'mtx-tm' }, h('div', { class: 'mtx-ph', style: { padding: '8px 0 0' } }, h('h2', {}, I('hist'), 'Time Machine', h('span', { class: 'mtx-badge' }, T('Exclusif Mac', 'Mac exclusive'))), h('span', { class: 'sp' }), h('button', { class: 'sbtn acc sm', onclick: takeSnap }, I('camera'), T('Prendre un instantané', 'Take a snapshot'))),
      h('p', { class: 'mtx-lead' }, T('Avant chaque déploiement, mORTEX prend un instantané de Data, de vos mods, de l’ordre de chargement et des fichiers INI. Les clones APFS partagent leur contenu avec les originaux : un instantané ne prend presque aucune place. Tous les instantanés des dernières 24 heures sont gardés, puis un par jour pendant deux semaines.', 'Before each deployment, mORTEX takes a snapshot of Data, your mods, the load order and the INI files. APFS clones share their content with the originals, so a snapshot takes almost no space. All snapshots from the last 24 hours are kept, then one per day for two weeks.')),
      ...days.flatMap(([lbl, list]) => [h('h3', {}, lbl), h('div', { class: 'mtx-tl' }, list.map(s => { const c = changes(s), other = s.prof !== 'Default';
        return h('div', { class: 'mtx-sn' + (s.id === newId ? ' new' : ''), 'data-id': s.id }, h('span', { class: 'tm' }, hhmm(s.when)), h('div', { class: 'tx' }, h('b', {}, reasonL(s.reason)), h('span', {}, ' · ' + T('Profil ', 'Profile ') + s.prof), h('small', {}, T(`Mods activés : ${s.en.size} sur ${s.inst.size} · ${c ? c + ' mod(s) modifié(s) depuis' : 'Mêmes mods qu’actuellement'}`, `Mods enabled: ${s.en.size} of ${s.inst.size} · ${c ? c + ' mod(s) changed since' : 'Same mods as now'}`))),
          h('button', { class: 'sbtn ico', title: T('Supprimer', 'Delete'), 'aria-label': T('Supprimer', 'Delete'), onclick: e => delSnap(s, e.currentTarget.closest('.mtx-sn')) }, I('trash')), h('button', { class: 'sbtn acc', disabled: other, title: other ? T('Passez d’abord au profil de l’instantané', 'Switch to the snapshot’s profile first') : '', onclick: () => backTo(s) }, I('hist'), T('Revenir', 'Go back'))); }))])));
  }
  function takeSnap() { const s = addSnap('By hand'); sfx.pop(); drawPage(); const el = ui.main.querySelector(`[data-id="${s.id}"]`); if (el) { el.classList.add('new'); } notify(T('Instantané pris', 'Snapshot taken'), T('Clone APFS créé en 0,2 s, 0 Mo utilisé.', 'APFS clone created in 0.2 s, 0 MB used.'), 'var(--s-ok)'); }
  function delSnap(s, el) { el.classList.add('gone'); sfx.close(); later(() => { snaps.splice(snaps.indexOf(s), 1); if (st.page === 'tm') drawPage(); }, 280); }
  function backTo(s) {
    confirm(T('Revenir à cet instantané ?', 'Go back to this snapshot?'), T(`Data, vos mods, l’ordre de chargement et les fichiers INI reviennent au ${new Date(s.when).toLocaleString(loc)}. mORTEX prend d’abord un instantané de l’état actuel : vous pourrez y revenir.`, `Data, your mods, the load order and the INI files go back to ${new Date(s.when).toLocaleString(loc)}. mORTEX takes a snapshot of the current state first, so you can come back to it.`), T('Revenir', 'Go back'), () => {
      addSnap('Before going back'); mods.forEach(m => { m.inst = s.inst.has(m.id) ? 1 : 0; m.en = m.inst && s.en.has(m.id) ? 1 : 0; }); const ord = s.ord; pls.sort((a, b) => ord.indexOf(a.n) - ord.indexOf(b.n)); st.dirty = 0; st.deploy = 'ok'; sfx.done(); refreshBar(); drawSide(); drawPage();
      notify(T('Retour à l’instantané', 'Back to the snapshot'), T(`Mods et ordre de chargement restaurés (${hhmm(s.when)}).`, `Mods and load order restored (${hhmm(s.when)}).`), 'var(--s-ok)'); toast({ icon: icon(app.id), title: app.id, body: T('Retour à l’instantané effectué.', 'Back to the snapshot.') });
    });
  }

  /* ---------- Atelier DXMT ---------- */
  const CHECKS = () => [['engine', T('Moteur graphique', 'Graphics backend'), T('DXMT (Metal)', 'DXMT (Metal)'), 'ok'], ['bridge', T('Pont mDLSS', 'mDLSS bridge'), T('Non installé : le DLSS affiche un écran noir', 'Not installed: DLSS shows a black screen'), 'wn', T('Installer le pont', 'Install the bridge')], ['tweaks', 'SSE Display Tweaks', T('Optimisé pour DXMT', 'Optimized for DXMT'), 'ok'],
    ['dups', T('Doublons de Bottled Shaders', 'Bottled Shaders duplicates'), T('Aucun', 'None'), 'ok'], ['cs', T('Version de Community Shaders', 'Community Shaders build'), 'Bottled Shaders 1.1.4', 'ok'], ['shaders', T('Compilation des shaders', 'Shader compilation'), T('Community Shaders 1.1.4 : les shaders se compilent', 'Community Shaders 1.1.4: shaders compile'), 'ok']];
  function pageDxmt() {
    ui.main.replaceChildren();
    ui.main.append(h('div', { class: 'mtx-ph' }, h('h2', {}, I('cpu'), T('Atelier DXMT', 'DXMT workshop'), h('span', { class: 'mtx-badge' }, T('Exclusif Mac', 'Mac exclusive')), h('span', { class: 'mut', style: { fontSize: '12px', fontWeight: 400 } }, T('Bouteille Skyrim-Mac', 'Bottle Skyrim-Mac'))), h('span', { class: 'sp' }),
      ui.chkBtn = h('button', { class: 'sbtn acc sm', onclick: runChecks, title: T('Revérifier la bouteille : rien n’est déplacé ni modifié', 'Check the bottle again: moves nothing, changes nothing') }, I('refresh'), T('Vérifier l’installation', 'Check the installation'))),
      h('div', { class: 'mtx-dx' }, h('p', { class: 'mtx-lead' }, T('Rendu moderne de Skyrim SE sur Mac : Community Shaders et les presets ENB tournent sous CrossOver avec DXMT. Cette page vérifie votre bouteille et explique les pièges déjà résolus.', 'Modern rendering for Skyrim SE on a Mac: Community Shaders and ENB presets run under CrossOver with DXMT. This page checks your bottle and explains the pitfalls we solved.')),
        ui.chk = h('div', { class: 'mtx-chk' }), h('h3', {}, I('route'), T('Le trajet d’une image jusqu’à votre Mac', 'How a frame reaches your Mac')), ui.path = h('div', { class: 'mtx-path' })));
    drawChecks(); if (st.dxn == null && !st.dxbusy) later(runChecks, 350);
  }
  function drawChecks() {
    if (!ui.chk) return; const defs = CHECKS(), n = st.dxn || 0;
    ui.chk.replaceChildren(...defs.map(([id, nm, tx, s0, fix], i) => { const scan = st.dxbusy && i === n, fixed = st.dxfix && id === 'bridge', state = i < n ? (fixed ? 'ok' : s0) : scan ? 'scan' : 'na';
      return h('div', { class: 'mtx-ck ' + (scan ? 'scan na' : state) }, h('span', { class: 'st', html: svg(state === 'ok' ? 'check' : state === 'wn' ? 'warn' : scan ? 'refresh' : 'x') }), h('b', {}, nm), h('span', { class: 'tx' }, scan ? T('Vérification…', 'Checking…') : i >= n ? T('Pas encore vérifié', 'Not checked yet') : fixed ? T('Installé', 'Installed') : tx),
        state === 'wn' && fix ? h('button', { class: 'sbtn', onclick: fixBridge }, fix) : fixed ? h('button', { class: 'sbtn', onclick: undoFix }, T('Annuler', 'Undo')) : h('span')); }));
    const okOf = { game: 1, gpu: 1, dxmt: n >= 1, shaders: n >= 6, bridge: n >= 2 && st.dxfix }, warn = n >= 2 && !st.dxfix;
    const stg = [['game', 'pad', 'Skyrim SE', T('Dessine chaque image en Direct3D 11', 'Draws each frame with Direct3D 11')], ['shaders', 'spark', 'Community Shaders', T('Bottled Shaders ajoute éclairage, ombres et upscaling via SKSE', 'Bottled Shaders adds lighting, shadows and upscaling through SKSE')], ['bridge', 'hub', T('Pont mDLSS', 'mDLSS bridge'), T('Fait tourner le DLSS via MetalFX', 'Lets DLSS run through MetalFX')], ['dxmt', 'cpu', 'DXMT', T('Traduit Direct3D 11 en Metal dans la bouteille', 'Translates Direct3D 11 into Metal in the bottle')], ['gpu', 'cube', T('GPU Apple', 'Apple GPU'), T('Calcule l’image avec Metal', 'Renders the frame with Metal')]];
    ui.path.replaceChildren(...stg.flatMap(([id, ic, nm, d], i) => [i ? h('span', { class: 'mtx-ar' }, '›') : null, h('div', { class: 'mtx-stg ' + (okOf[id] ? 'ok' : warn && id === 'bridge' ? 'wn' : '') }, h('b', {}, I(ic), nm), h('span', {}, d))].filter(Boolean)));
  }
  async function runChecks() {
    if (st.dxbusy) return; st.dxbusy = 1; st.dxn = 0; st.dxfix = false; sfx.click(); ui.chkBtn && (ui.chkBtn.disabled = true);
    for (let i = 0; i < 6; i++) { st.dxn = i; if (st.page === 'dxmt') drawChecks(); if (!reduced()) await wait(420); if (!alive()) return; sfx.tick(); }
    st.dxn = 6; st.dxbusy = 0; if (st.page === 'dxmt') { ui.chkBtn.disabled = false; drawChecks(); sfx.done(); toast({ icon: icon(app.id), title: app.id, body: T('Bilan : 5 contrôles réussis, 1 avertissement.', 'Report: 5 checks passed, 1 warning.') }); }
  }
  async function fixBridge() { sfx.click(); const b = ui.chk.querySelector('.sbtn'); if (b) { b.disabled = true; b.textContent = T('Installation…', 'Installing…'); } if (!reduced()) await wait(1100); if (!alive()) return; st.dxfix = true; sfx.pop(); if (st.page === 'dxmt') drawChecks(); notify(T('Pont mDLSS installé', 'mDLSS bridge installed'), T('d3d11.dll posé à côté de SkyrimSE.exe.', 'd3d11.dll placed next to SkyrimSE.exe.'), 'var(--s-ok)'); }
  function undoFix() { st.dxfix = false; sfx.click(); drawChecks(); }

  /* ---------- pages non reprises dans la démo ---------- */
  function pageStub() {
    ui.main.replaceChildren();
    const id = st.page; ui.main.append(h('div', { class: 'mtx-stub' }, h('span', { html: svg(order.game.concat(order.tools, order.app).find(x => x[0] === id)[1]) }), h('h2', {}, lab(id)), h('p', {}, T('Cette page existe dans mORTEX mais n’est pas reprise dans la démo. Les pages Mods, Plugins, Téléchargements, Time Machine et Atelier DXMT sont jouables.', 'This page exists in mORTEX but is not part of the demo. The Mods, Plugins, Downloads, Time Machine and DXMT workshop pages are playable.')), h('button', { class: 'sbtn', disabled: !app.download, onclick: () => download(app) }, T('Télécharger', 'Download'))));
  }

  /* ---------- clavier ---------- */
  const onKey = e => {
    if (!mine() || root.querySelector('.mtx-sheet')) return; const mod = e.metaKey || e.ctrlKey, inField = e.target.matches && e.target.matches('input,textarea');
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); primary(); }
    else if ((mod && e.key.toLowerCase() === 'f') || (!inField && e.key === '/')) { const q = ui.q || ui.main.querySelector('.mtx-find input'); if (q) { e.preventDefault(); q.focus({ preventScroll: true }); } }
    else if (st.page === 'mods' && !inField && ['ArrowDown', 'ArrowUp', ' '].includes(e.key)) { e.preventDefault(); const l = listMods(); const i = l.findIndex(m => m.id === st.sel);
      if (e.key === ' ') { const m = byId(st.sel); m && toggle(m); } else { const n = l[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, l.length - 1)]; if (n) { st.sel = n.id; drawRows(); } } }
  };
  document.addEventListener('keydown', onKey); offs.add(() => document.removeEventListener('keydown', onKey));
  layout(); setTimeout(() => w.el.focus({ preventScroll: true }), 0);
  return root;
}
