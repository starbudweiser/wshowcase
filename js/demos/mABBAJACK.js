/* Réplique interactive de mABBAJACK (interface Socle) : galerie de modlists, inspecteur, installation « Ready to Play », progression en direct,
   adaptation au Mac annulable. Données fictives : aucun fichier n'est lu, aucun réseau. */
import { lang } from '../i18n.js';
import { h, brand, esc, wait, reduced, clamp, T, num, sfx, wm, toast, icon, download, css, S } from './kit.js';
css('css/demos/mABBAJACK.css');

/* Nom d'appli dans les textes : la lettre minuscule initiale prend la couleur du logo (règle Socle), jamais dans un menu déroulant. */
const NAMES = { mORTEX: '#f59e0b', mABBAJACK: '#5aa9ff', csSETTINGS: '#38bdf8', mTRANSLATOR: '#4285f4' }, NRE = /\b(mORTEX|mABBAJACK|csSETTINGS|mTRANSLATOR)\b/;
function tint(el) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => (NRE.test(n.nodeValue) && !n.parentNode.closest('.lc,input,textarea,select,option,[data-nobrand],.mtx-pop,.mtr-menu,.mbj-menu,.csx-menu') ? 1 : 3) }), list = [];
  while (tw.nextNode()) list.push(tw.currentNode);
  list.forEach(n => { const sp = document.createElement('span'); sp.innerHTML = esc(n.nodeValue).replace(new RegExp(NRE.source, 'g'), m => brand(m, NAMES[m])); n.replaceWith(...sp.childNodes); });
}

const P = {
  store: 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 0 0 5 0 3 3 0 0 0 6 0 3 3 0 0 0 5 0M10 20v-5h4v5', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', box: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z', gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2', down: 'M12 3v12M7 10l5 5 5-5M4 20h16', folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  paste: 'M9 4h6v3H9zM7 5H5v16h14V5h-2', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', check: 'M4 12l5 5L20 6', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01',
  chevr: 'M9 6l6 6-6 6', file: 'M6 3h8l4 4v14H6zM14 3v4h4', refresh: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5', play: 'M7 4l13 8-13 8z', pause: 'M7 4h4v16H7zM13 4h4v16h-4z', chev: 'M6 9l6 6 6-6', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13', chat: 'M4 5h16v11H9l-5 4z'
};
const svg = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const I = n => h('span', { html: svg(n), style: { display: 'inline-grid' } });

/* ---------- données d'exemple ---------- */
const PAL = [['#2b3a55', '#f2c14e', '#1f2a3d', '#141c29'], ['#4a2c2a', '#f4a259', '#2d1b1b', '#1a0f0f'], ['#2f4858', '#f6ae2d', '#1b2a33', '#101a20'], ['#5c3d57', '#ffd6a5', '#3a2438', '#221423'], ['#2d4a3e', '#e9d985', '#1c3027', '#101d17'], ['#1d3b53', '#7fe3d6', '#11273a', '#0a1826'], ['#4a4a3a', '#e0c27a', '#2f2f24', '#1c1c14'], ['#3a3a4f', '#c9d1f0', '#25253a', '#14141f']];
const L = (id, n, au, v, g, tags, dl, ins, arc, pal, fr, en, o = {}) => ({ id, n, au, v, g, tags, dl, ins, arc, pal, d: [fr, en], ...o });
const LISTS = [
  L('frost', 'Frostbound Odyssey', 'Aldrenn', '3.3.4', 'ae', ['Official', 'Lightweight', 'Anniversary Edition'], 43.1, 60.9, 616, 0, 'Skyrim en mieux : textures plus nettes, forêts plus denses, un hiver qui prend enfin son temps. Léger et fidèle à l’univers.', 'Skyrim, but better: sharper textures, lusher forests and a winter that finally takes its time. Lightweight and lore-friendly.', { off: 1 }),
  L('ember', 'Ember & Ash', 'Marenwyn', '1.2.3', 'ae', ['Combat Overhaul', 'DLC Required', 'Hardcore', 'SFW'], 46.2, 64.6, 849, 1, 'Une refonte du combat et de la survie pour joueurs expérimentés : chaque affrontement compte, chaque feu de camp aussi.', 'A combat and survival overhaul for seasoned players: every fight matters, and so does every campfire.'),
  L('hearth', 'Hearthlight', 'Tolvar', '4.2.2', 'ae', ['Official', 'Anniversary Edition', 'Balanced', 'Creation Club'], 49.5, 58.5, 704, 2, 'Une liste équilibrée qui améliore le gameplay et les graphismes sans trahir l’esprit du jeu d’origine.', 'A balanced list that improves gameplay and visuals without betraying the spirit of the original game.', { off: 1 }),
  L('dawn', 'Nordic Dawn', 'Kjeld', '0.1.0', 'ae', ['Anniversary Edition', 'Survival'], 42.9, 55.1, 511, 3, 'Une liste centrée sur le gameplay et les fonctions, à l’impact minimal sur les performances. Elle démarre petite et grandit avec le temps.', 'A list focused on gameplay and functionality with minimal performance impact. It starts small and grows over time.'),
  L('iron', 'Ironwood Chronicles', 'Sigrún', '1.0.1', 'se', ['Vanilla+', 'Lightweight', 'Lore-Friendly'], 18.4, 26, 298, 4, 'Du Vanilla+ en toute simplicité : stabilité, clarté visuelle et petites améliorations bien choisies.', 'Simple Vanilla+: stability, visual clarity and a handful of well-chosen improvements.'),
  L('aurora', 'Aurora Veil', 'Lysandre', '1.5.6', 'ae', ['Visuals', 'Anniversary Edition'], 51.8, 72.4, 912, 5, 'Une liste purement visuelle pour Skyrim AE : éclairage, météo et textures, avec une base très stable.', 'A visuals-only list for Skyrim AE: lighting, weather and textures on a very stable base.'),
  L('skald', 'Skald’s Road', 'Brynja', '2.0.0', 'se', ['Official', 'Overhaul', 'Immersive'], 64, 91.3, 1204, 6, 'Une grande liste d’immersion : voix, routes, villages, vie quotidienne. À réserver aux longues soirées d’hiver.', 'A big immersion list: voices, roads, villages, daily life. Best saved for long winter evenings.', { off: 1 }),
  L('grey', 'Greywatch', 'Hallvard', '1.1.0', 'se', ['Hardcore', 'Survival', 'Combat'], 33.7, 47.2, 540, 7, 'Survie hardcore : faim, froid, blessures, et un monde qui ne vous attend pas.', 'Hardcore survival: hunger, cold, wounds and a world that does not wait for you.'),
  L('verdant', 'Verdant Reach', 'Eirik', '1.0.4', 'ae', ['Visuals', 'Performance', 'Lightweight'], 12.5, 19.8, 180, 4, 'Verdure et performances : un Skyrim plus beau qui tourne bien, même sur un Mac modeste.', 'Greenery and performance: a prettier Skyrim that runs well, even on a modest Mac.'),
  L('storm', 'Stormcrown', 'Torunn', '3.0.0', 'vr', ['Performance', 'VR'], 22, 30.5, 360, 7, 'Pensée pour la réalité virtuelle : images stables, interface lisible, aucun luxe inutile.', 'Built for virtual reality: stable frames, a readable interface and no needless luxury.'),
  L('dun', 'Dunmark Reborn', 'Oswin', '1.8.2', 'se', ['Overhaul', 'Immersive', 'NSFW'], 55.2, 80.1, 980, 3, 'Une refonte totale pour adultes : nouveaux visages, nouvelles histoires, un ton plus sombre.', 'A total overhaul for adults: new faces, new stories, a darker tone.', { nsfw: 1 }),
  L('way', 'Wayfarer’s Rest', 'Maelis', '2.4.0', 'ender', ['Overhaul'], 15.9, 24.4, 260, 6, 'Une refonte légère d’Enderal : interface, équilibrage et confort de jeu.', 'A light Enderal overhaul: interface, balance and quality-of-life fixes.'),
  L('cinder', 'Cinder Vale', 'Ragna', '0.9.2', 'ae', ['Never Nude', 'Vanilla+'], 28.8, 40.3, 402, 1, 'Du Vanilla+ sans nudité : des cendres, des braises et des vallées à explorer.', 'Vanilla+ without nudity: ash, embers and valleys to explore.')
];
const GAMES = { all: ['Tous', 'All', ''], se: ['Skyrim SE', 'Skyrim SE', '1.5.97'], ae: ['Skyrim AE', 'Skyrim AE', '1.6.x'], vr: ['Skyrim VR', 'Skyrim VR', '1.4.x'], ender: ['Enderal', 'Enderal', ''] };
const TAGS = ['Official', 'NSFW', 'Never Nude', 'Lightweight', 'Performance', 'Vanilla+', 'Overhaul', 'Survival', 'Hardcore', 'Combat', 'Visuals', 'Immersive', 'Lore-Friendly'];
const POOL = [['SkyUI_5_2_SE.7z', 12, 'SkyUI Team'], ['Unofficial Skyrim Special Edition Patch-266-4-3-0.7z', 61, 'Arthmoor'], ['SKSE64 2.2.6.7z', 2, 'Ian Patterson'], ['Address Library for SKSE Plugins-32444-11.zip', 1, 'meh321'], ['SSE Engine Fixes-17230-7-0-17.7z', 4, 'aers'], ['Community Shaders Bottled-86492-1-1-4.7z', 212, 'Bottled Team'], ['Frostbound Landscapes 2K-51207-3-1.7z', 2480, 'Aldrenn'], ['Ember Fire Effects-60118-2-0.7z', 188, 'Marenwyn'], ['Hearthlight Interiors-55212-1-4.7z', 1900, 'Tolvar'], ['Skald Voice Pack-44731-1-0.7z', 940, 'Brynja'],
  ['Northern Roads-18820-2-2.zip', 96, 'Kjeld'], ['Immersive Weather Overhaul-41903-4-0-3.7z', 640, 'Lysandre'], ['Dragon Rework-28850-3-4-1.7z', 180, 'Hallvard'], ['Better Dialogue UI-12877-2-3.7z', 9, 'Eirik'], ['Ironhold Armory-36042-1-5-0.7z', 420, 'Sigrún'], ['Winterfell Quests-45530-2-0-2.7z', 96, 'Oswin'], ['Amber Realm-57009-1-1-0.7z', 1320, 'Torunn'], ['Aurora Lanterns-8812-1-0-3.zip', 38, 'Maelis'], ['Ancient Realms HD-51207-2-1-0.7z', 3482, 'Ragna'], ['Wolf Pack Redux-30177-1-2.7z', 88, 'Brynja'],
  ['Mist & Smoke FX-47310-1-0.7z', 55, 'Marenwyn'], ['Faces of the North HD-39822-2-0.7z', 1250, 'Lysandre'], ['Dwemer Ruins Retex-22918-1-3.7z', 770, 'Hallvard'], ['Blacksmith Forge Anim-18123-3-0.7z', 34, 'Eirik'], ['Sky Sounds Overhaul-41200-2-1.7z', 510, 'Oswin'], ['Grass Tuned 4K-37144-1-6.7z', 365, 'Aldrenn'], ['Skyrim - Animations.bsa', 1100, 'Game file'], ['Skyrim - Meshes0.bsa', 2800, 'Game file'], ['Skyrim - Textures1.bsa', 1700, 'Game file']];
const PLUGINS = ['Skyrim.esm', 'Update.esm', 'Dawnguard.esm', 'HearthFires.esm', 'Dragonborn.esm', 'SkyUI_SE.esp', 'Unofficial Skyrim Special Edition Patch.esp', 'CommunityShaders.esp', 'EngineFixes.esp', 'FrostboundLandscapes.esp', 'EmberFireEffects.esp', 'HearthlightInteriors.esp', 'ImmersiveWeather.esp', 'DragonRework.esp', 'BetterDialogue.esp', 'IronholdArmory.esp', 'WinterfellQuests.esp', 'AmberRealm.esm', 'AuroraLanterns.esl', 'WolfPackRedux.esp', 'MistAndSmoke.esp', 'FacesOfTheNorth.esp', 'DwemerRuinsRetex.esp', 'SkySounds.esp', 'Bashed Patch, 0.esp'];
const ft = gb => (gb >= 1 ? gb.toFixed(1) + ' ' + T('Go', 'GB') : Math.round(gb * 1024) + ' ' + T('Mo', 'MB'));
const fmb = mb => (mb >= 1024 ? (mb / 1024).toFixed(1) + ' ' + T('Go', 'GB') : mb + ' ' + T('Mo', 'MB'));

/* bannière : paysage plat généré (aucun dégradé) */
function banner(l, w = 330, hh = 116) {
  const [sky, sun, r1, r2] = PAL[l.pal], seed = [...l.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7); let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const ridge = (base, amp, n) => { const pts = [`0,${hh}`]; for (let i = 0; i <= n; i++) pts.push(`${Math.round(i / n * w)},${Math.round(base - rnd() * amp)}`); pts.push(`${w},${hh}`); return pts.join(' '); };
  const trees = Array.from({ length: 16 }, (_, i) => { const x = 8 + i * (w / 16) + rnd() * 10, hgt = 16 + rnd() * 22, b = hh; return `<polygon points="${x},${b - hgt - 6} ${x + 7},${b} ${x - 7},${b}" fill="${r2}"/>`; }).join('');
  return `<svg viewBox="0 0 ${w} ${hh}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="${w}" height="${hh}" fill="${sky}"/><circle cx="${Math.round(w * (.25 + rnd() * .5))}" cy="${Math.round(hh * .38)}" r="${14 + Math.round(rnd() * 8)}" fill="${sun}" opacity=".9"/><polygon points="${ridge(hh * .78, hh * .42, 9)}" fill="${r1}"/>${trees}<polygon points="${ridge(hh * .96, hh * .22, 7)}" fill="${r2}"/><text x="${w / 2}" y="${Math.round(hh * .56)}" text-anchor="middle" font-family="Georgia,serif" font-size="${l.n.length > 18 ? 15 : 19}" letter-spacing="2" fill="#f3efe6" opacity=".92">${l.n.toUpperCase().replace(/&/g, '&amp;')}</text></svg>`;
}

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 690, x: 250, y: 88, minw: 940, minh: 600, bare: true, cls: 'socle mbj-win', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); }, build: w => build(app, w) });
}

function build(app, w) {
  const fr = lang() === 'fr';
  const st = { tab: 'gallery', game: 'ae', tag: 'all', q: '', sort: 'size+', nsfw: false, list: null, dl: '/Volumes/Games/DOWNLOADS', rtp: '/Volumes/Games/READY_TO_PLAY', gpath: '', key: '', acct: null, mode: 'kit', insp: 'arch', aq: '', af: 'all', threads: 8,
    prog: { stage: 'idle', pct: 0, task: '', paused: false, files: 0, total: 0, bytes: 0, tbytes: 0, speed: 0, eta: 0, err: false }, logs: [], lf: 'all', auto: true, mac: null, ready: new Set(), manualOk: false };
  let ui = {}, menu = null, sim = null, lid = 0, tabNew = false; const timers = new Set(), alive = () => !w.dead;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); return t; };
  const offs = new Set(); w.cleanup = () => { timers.forEach(clearTimeout); sim && clearInterval(sim.t); offs.forEach(f => f()); };
  const mine = () => S.active === w && !w.min;
  const root = h('div', { class: 'mbj', tabindex: '-1' });
  const gTxt = k => T(GAMES[k][0], GAMES[k][1]);
  const edition = l => ({ se: ['Skyrim Special Edition', '1.5.97'], ae: ['Skyrim Anniversary Edition', '1.6.1170'], vr: ['Skyrim VR', '1.4.15'], ender: ['Enderal', '2.0.12'] }[l.g]);

  /* ---------- fenêtres internes et menus ---------- */
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; } };
  root.addEventListener('pointerdown', e => { if (menu && !menu.contains(e.target) && !e.target.closest('[data-menu]')) closeMenu(); }, true);
  function popMenu(anchor, items) {
    const same = menu && menu.dataset.for === anchor.dataset.menu; closeMenu(); if (same) return;
    const m = h('div', { class: 'mbj-menu', 'data-for': anchor.dataset.menu }, items.map(it => h('button', { class: it.on ? 'on' : '', onclick: () => { closeMenu(); it.fn(); } }, it.label))); root.append(m); menu = m;
    const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect(), sc = S.scale || 1; m.style.top = (a.bottom - r.top) / sc + 4 + 'px'; m.style.left = clamp((a.right - r.left) / sc - m.offsetWidth, 8, root.clientWidth - m.offsetWidth - 8) + 'px';
  }
  function sheet(title, body, foot, o = {}) {
    const close = () => { sh.remove(); document.removeEventListener('keydown', esc, true); offs.delete(close); w.el.focus({ preventScroll: true }); o.onclose && o.onclose(); };
    const esc = e => { if (e.key === 'Escape' && mine()) { e.stopPropagation(); if (!sh.dataset.busy) close(); } };
    const sh = h('div', { class: 'mbj-sheet', onpointerdown: e => { if (e.target === sh && !sh.dataset.busy) close(); } },
      h('div', { class: 'mbj-pan' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-label': title, tabindex: '-1' }, h('div', { class: 'mbj-sh' }, h('div', {}, h('h4', {}, title), o.sub ? h('small', { html: o.sub }) : null), h('button', { class: 'x', 'aria-label': T('Fermer', 'Close'), onclick: () => { if (!sh.dataset.busy) close(); } }, '×')), h('div', { class: 'mbj-sb' }, body), foot ? h('div', { class: 'mbj-sf' }, foot) : null));
    document.addEventListener('keydown', esc, true); offs.add(close); root.append(sh); tint(sh); sh.firstChild.focus({ preventScroll: true });
    sh.firstChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    return { close, el: sh, busy: v => { v ? (sh.dataset.busy = '1') : delete sh.dataset.busy; } };
  }

  /* ---------- structure ---------- */
  function layout() {
    ui.bar = h('div', { class: 'sbar', 'data-drag': '' }); ui.body = h('div', { class: 'mbj-body' }); root.replaceChildren(ui.bar, ui.body); drawBar(); drawPage();
  }
  const TABS = () => [['gallery', 'store', T('Galerie', 'Gallery')], ['inspector', 'search', T('Inspecteur', 'Inspector')], ['installer', 'box', T('Installation', 'Install')], ['progress', 'bolt', T('Progression', 'Progress')]];
  function drawBar() {
    const busy = ['running', 'paused'].includes(sim && sim.state);
    ui.bar.replaceChildren(wm.lights(w), h('span', { class: 'mbj-logo', html: svg('bolt') }), h('b', { html: brand(app.id, app.accent) }), h('span', { class: 'mbj-ver mbj-sub' }, 'v1.2.0'),
      h('div', { class: 'mbj-tabs', role: 'tablist' }, TABS().map(([k, ic, n]) => h('button', { class: 'mbj-tab' + (st.tab === k ? ' on' : ''), role: 'tab', 'aria-selected': String(st.tab === k), title: n, 'aria-label': n, onclick: () => go(k) }, I(ic), h('span', {}, n), k === 'progress' && busy ? h('i') : null))),
      h('div', { class: 'mbj-right' }, h('span', { class: 'mbj-chip' + (st.acct ? ' ok' : '') }, I('info'), st.acct ? (st.acct.premium ? 'Premium ★' : T('Nexus gratuit', 'Nexus Free')) : 'Nexus'), h('button', { class: 'sbtn sm', onclick: settingsSheet }, I('gear'), T('Réglages', 'Settings')), h('button', { class: 'sbtn sm', disabled: !app.download, onclick: () => download(app) }, T('Télécharger', 'Download'))));
  }
  function go(k) { closeMenu(); st.tab = k; sfx.tick(); drawBar(); drawPage(); }
  function drawPage() { ui.body.replaceChildren(); ui.body.scrollTop = 0; ({ gallery: pageGallery, inspector: pageInspector, installer: pageInstaller, progress: pageProgress }[st.tab])(); tint(ui.body); }

  /* ---------- Galerie ---------- */
  const listed = () => { const q = st.q.trim().toLowerCase(); const a = LISTS.filter(l => (st.game === 'all' || l.g === st.game) && (st.tag === 'all' || l.tags.includes(st.tag)) && !(st.nsfw && l.nsfw) && (!q || (l.n + ' ' + l.au + ' ' + l.tags.join(' ') + ' ' + l.d[0] + l.d[1]).toLowerCase().includes(q)));
    return a.sort((x, y) => ({ 'size+': x.dl - y.dl, 'size-': y.dl - x.dl, 'name+': x.n.localeCompare(y.n), 'name-': y.n.localeCompare(x.n) }[st.sort])); };
  function pageGallery() {
    const sortL = { 'size+': T('Taille +', 'Size +'), 'size-': T('Taille −', 'Size −'), 'name+': T('Nom A–Z', 'Name A–Z'), 'name-': T('Nom Z–A', 'Name Z–A') };
    const gchips = h('div', { class: 'mbj-row' }, h('span', { class: 'mbj-lab' }, T('FILTRE', 'FILTER')), Object.keys(GAMES).map(k => h('button', { class: 'mbj-gc' + (st.game === k ? ' on' : ''), onclick: () => { st.game = k; sfx.tick(); drawPage(); } }, gTxt(k), GAMES[k][2] ? h('small', {}, GAMES[k][2]) : null, h('em', {}, LISTS.filter(l => k === 'all' || l.g === k).length))));
    const find = h('label', { class: 'mbj-find' }, h('span', { html: svg('search') }), h('input', { type: 'search', placeholder: T('Titre, auteur, mot-clé…', 'Title, author, keyword…'), 'aria-label': T('Rechercher', 'Search'), value: st.q, oninput: e => { st.q = e.target.value; drawGrid(); } }));
    const tags = h('div', { class: 'mbj-tags' }, ['all', ...TAGS].map(t => h('button', { class: 'mbj-tag' + (st.tag === t ? ' on' : ''), onclick: () => { st.tag = t; sfx.tick(); drawPage(); } }, t === 'all' ? T('Tous les jeux', 'All Games') : t)));
    ui.body.append(h('div', { class: 'mbj-pg' }, h('div', { class: 'mbj-h' }, h('div', {}, h('h2', {}, T('Galerie des modlists officielles', 'Official Modlists Gallery'), ui.cnt = h('span', { class: 'mbj-count' })), h('p', {}, T('Parcourez, inspectez et installez des modlists sélectionnées pour Skyrim, avec téléchargements automatisés.', 'Explore, inspect, and install curated modlists for Skyrim with automated download pipelines.'))), h('span', { class: 'sp' }), find),
      gchips, h('div', { class: 'mbj-row' }, h('button', { class: 'sbtn sm', style: st.nsfw ? { color: 'var(--s-acct)' } : null, onclick: () => { st.nsfw = !st.nsfw; sfx.tick(); drawPage(); } }, st.nsfw ? T('Afficher le NSFW', 'Show NSFW') : T('Masquer le NSFW', 'Hide NSFW')), tags,
        h('button', { class: 'sbtn sm', 'data-menu': 'sort', onclick: e => popMenu(e.currentTarget, Object.keys(sortL).map(k => ({ label: sortL[k], on: st.sort === k, fn: () => { st.sort = k; sfx.tick(); drawGrid(); const sb = ui.body.querySelector('[data-menu="sort"] span'); sb && (sb.textContent = sortL[k]); } }))) }, h('span', {}, sortL[st.sort]), I('chev'))),
      ui.grid = h('div', { class: 'mbj-grid' })));
    drawGrid();
  }
  function drawGrid() {
    const a = listed(); ui.cnt.textContent = a.length; ui.grid.replaceChildren();
    if (!a.length) { ui.grid.style.display = 'block'; ui.grid.append(h('div', { class: 'mbj-empty' }, T('Aucune modlist ne correspond à ces filtres.', 'No modlist matches these filters.'), h('button', { class: 'sbtn', onclick: () => { st.game = 'all'; st.tag = 'all'; st.q = ''; st.nsfw = false; drawPage(); } }, T('Réinitialiser les filtres', 'Reset filters')))); return; }
    ui.grid.style.display = ''; a.forEach(l => ui.grid.append(card(l)));
  }
  function card(l) {
    return h('article', { class: 'mbj-card' }, h('div', { class: 'mbj-ban', html: banner(l) }, l.off ? h('span', { class: 'mbj-b3' }, 'Official') : null, h('span', { class: 'mbj-b1', style: l.off ? { left: '70px' } : null }, 'v' + l.v), h('span', { class: 'mbj-b2' }, '⚜ ' + (GAMES[l.g][2] ? '~' + GAMES[l.g][2] : 'Enderal'))),
      h('div', { class: 'mbj-cb' }, h('div', { class: 'mbj-au' }, T('par ', 'by '), h('b', {}, l.au)), h('h3', { title: l.n }, l.n), h('p', { class: 'mbj-desc' }, T(l.d[0], l.d[1])), h('div', { class: 'mbj-pt' }, l.tags.slice(0, 4).map(t => h('i', { class: /Anniversary|NSFW/.test(t) ? 'w' : '' }, t)), l.tags.length > 4 ? h('i', {}, '+' + (l.tags.length - 4)) : null),
        h('div', { class: 'mbj-st' }, h('div', {}, h('span', {}, T('TÉLÉCHARGEMENT', 'DOWNLOAD')), h('b', {}, ft(l.dl)), h('small', {}, `(${num(l.arc)} archives)`)), h('div', {}, h('span', {}, T('INSTALLÉ', 'INSTALLED')), h('b', { class: 'g' }, ft(l.ins)), h('small', {}, T('Taille installée', 'Installed Size')))),
        h('button', { class: 'sbtn', onclick: () => detailSheet(l) }, I('info'), T('Détails', 'Details'))));
  }
  function detailSheet(l) {
    const s = sheet(l.n, [h('div', { class: 'mbj-ban', html: banner(l, 560, 140) }), h('p', {}, T(l.d[0], l.d[1])), h('div', { class: 'mbj-pt' }, l.tags.map(t => h('i', { class: /Anniversary|NSFW/.test(t) ? 'w' : '' }, t))),
      h('div', { class: 'mbj-ds' }, h('div', {}, h('span', {}, T('Téléchargement', 'Download')), h('b', { class: 'a' }, ft(l.dl))), h('div', {}, h('span', {}, T('Installé', 'Installed')), h('b', { class: 'g' }, ft(l.ins))), h('div', {}, h('span', {}, 'Archives'), h('b', {}, num(l.arc))), h('div', {}, h('span', {}, T('Jeu cible', 'Target Game')), h('b', {}, ({ se: 'skyrimspecialedition', ae: 'skyrimspecialedition', vr: 'skyrimvr', ender: 'enderal' })[l.g]))),
      h('div', { class: 'mbj-lk' }, h('button', { class: 'sbtn', onclick: () => note(T('Démo : le guide s’ouvrirait dans votre navigateur.', 'Demo: the guide would open in your browser.')) }, I('book'), T('Guide d’installation', 'Installation Guide')), h('button', { class: 'sbtn', onclick: () => note(T('Démo : le Discord s’ouvrirait dans votre navigateur.', 'Demo: the Discord would open in your browser.')) }, I('chat'), 'Discord'))],
    [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Fermer', 'Close')), h('button', { class: 'sbtn act', onclick: () => { s.close(); loadList(l); } }, T('CONFIGURER L’INSTALLATION', 'CONFIGURE INSTALLATION'), I('chevr'))], { sub: `${T('par ', 'by ')}<b>${l.au}</b> · v${l.v} · ⚜ ${gTxt(l.g)}` });
  }
  const note = body => toast({ icon: icon(app.id), title: app.id, body });

  /* ---------- chargement d'une modlist ---------- */
  async function loadList(l, to = 'installer') {
    if (sim && ['running', 'paused'].includes(sim.state)) return note(T('Une installation est en cours.', 'An installation is already running.'));
    const bar = h('div', { class: 'sprog', style: { width: '100%' } }, h('i')), msg = h('p', {}, T('Envoi du fichier au serveur…', 'Sending file to the server…')), s = sheet(T('Chargement de la modlist', 'Loading modlist'), [msg, bar, h('p', { style: { fontSize: '11.5px', color: 'var(--s-sub)' } }, T('Les très grosses modlists (plusieurs Go) peuvent prendre une minute. Ne fermez pas l’appli.', 'Very large modlists (several GB) can take a minute. Do not close the app.'))]); s.busy(1); sfx.click();
    for (let i = 1; i <= 10 && alive(); i++) { bar.firstChild.style.width = i * 10 + '%'; if (i === 4) msg.textContent = T('Analyse du manifeste…', 'Analyzing manifest…'); if (i === 8) msg.textContent = T('Lecture des directives…', 'Reading directives…'); if (!reduced()) await wait(140); }
    if (!alive()) return; s.busy(0); s.close(); st.list = l; st.installed = null; st.prog = { stage: 'idle', pct: 0, task: '', paused: false, files: 0, total: 0, bytes: 0, tbytes: 0, speed: 0, eta: 0, err: false }; st.logs = []; st.mac = null; sim = null; st.insp = 'arch'; sfx.pop(); go(to);
  }

  /* ---------- Inspecteur ---------- */
  const archivesOf = l => POOL.map((p, i) => ({ n: p[0], mb: p[1], au: p[2], game: p[2] === 'Game file', i })).sort((a, b) => ((a.i * 7 + l.pal) % 29) - ((b.i * 7 + l.pal) % 29));
  const isReady = (l, a) => st.installed === l.id || a.game || (a.i * 3 + l.pal) % 5 !== 0;
  function pageInspector() {
    const l = st.list; ui.body.append(h('div', { class: 'mbj-pg' }));
    const pg = ui.body.firstChild;
    if (!l) return pg.append(h('div', { class: 'mbj-h' }, h('div', {}, h('h2', {}, T('Inspecteur de modlist', 'Modlist Inspector')), h('p', {}, T('Déposez un fichier .wabbajack sur la fenêtre pour l’examiner.', 'Drop a .wabbajack file on the window to inspect it.')))),
      dropArea(), h('div', { class: 'mbj-empty', style: { border: 0 } }, h('span', {}, T('Aucune modlist chargée.', 'No modlist loaded.')), h('div', { class: 'mbj-row' }, h('button', { class: 'sbtn', onclick: openFile }, I('folder'), T('Parcourir un fichier…', 'Browse for a file…')), h('button', { class: 'sbtn', onclick: () => go('gallery') }, I('store'), T('Choisir dans la galerie', 'Pick from the Gallery')))));
    const arcs = archivesOf(l), ready = arcs.filter(a => isReady(l, a)).length, dirs = l.arc * 6 + 112, ed = edition(l);
    pg.append(h('div', { class: 'mbj-h' }, h('div', {}, h('h2', {}, l.n, h('span', { class: 'mbj-pill bl' }, 'v' + l.v)), h('p', {}, `${T('par ', 'by ')}${l.au} · ${ed[0]} ${ed[1]}`)), h('span', { class: 'sp' }), h('button', { class: 'sbtn', onclick: openFile }, I('folder'), T('Changer', 'Change')), h('button', { class: 'sbtn', onclick: () => go('installer') }, I('box'), T('Installer', 'Install'))),
      h('div', { class: 'mbj-stats' }, [[T('Archives requises', 'Required archives'), num(l.arc), T('Taille totale : ', 'Total size: ') + ft(l.dl)], [T('Directives d’extraction', 'Extraction directives'), num(dirs), T('Taille installée : ', 'Installed size: ') + ft(l.ins)], [T('Fichiers intégrés', 'Inlined files'), num(Math.round(l.arc / 14)), T('Configs et scripts embarqués', 'Embedded configs & scripts')], [T('Patchs binaires OctoDiff', 'OctoDiff binary patches'), num(Math.round(l.arc / 52)), T('Différences à appliquer', 'Diffs to apply')]].map(([a, b, c]) => h('div', {}, h('span', {}, a.toUpperCase()), h('b', {}, b), h('small', {}, c)))),
      h('div', { class: 'mbj-tt', role: 'tablist' }, [['arch', T('ARCHIVES', 'ARCHIVES')], ['plug', 'PLUGINS']].map(([k, n]) => h('button', { class: st.insp === k ? 'on' : '', role: 'tab', onclick: () => { st.insp = k; sfx.tick(); drawPage(); } }, n))),
      st.insp === 'arch' ? inspArch(l, arcs, ready) : h('div', {}, h('p', { style: { margin: '0 0 8px', color: 'var(--s-sub)', fontSize: '12px' } }, T('plugins.txt prédéfini par la modlist : cet ordre est généré automatiquement et copié dans votre dossier d’installation.', 'plugins.txt predefined by the modlist: this load order is generated automatically and copied into your installation folder.')), h('pre', { class: 'mbj-pl' }, PLUGINS.map((p, i) => (i < 5 ? '*' : '*') + p).join('\n'))));
  }
  function inspArch(l, arcs, ready) {
    const box = h('div', { class: 'mbj-tbl' }), draw = () => { const q = st.aq.toLowerCase(); box.replaceChildren(h('div', { class: 'mbj-tr h' }, h('span', {}, T('ARCHIVE', 'ARCHIVE')), h('span', { style: { textAlign: 'right' } }, T('TAILLE', 'SIZE')), h('span', {}, T('AUTEUR', 'AUTHOR')), h('span', {}, T('STATUT', 'STATUS'))),
      ...arcs.filter(a => (!q || a.n.toLowerCase().includes(q)) && (st.af === 'all' || (st.af === 'ready') === isReady(l, a))).map(a => h('div', { class: 'mbj-tr' }, h('span', { class: 'fn', title: a.n }, a.n), h('span', { class: 'sz' }, fmb(a.mb)), h('span', { class: 'au' }, a.au), h('span', { class: 'mbj-pill ' + (isReady(l, a) ? 'ok' : 'wn') }, isReady(l, a) ? '✓ ' + T('Prête', 'Ready') : '⚠ ' + T('Manquante', 'Missing'))))); };
    draw(); return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, h('div', { class: 'mbj-row' }, h('label', { class: 'mbj-find', style: { width: '260px' } }, h('span', { html: svg('search') }), h('input', { type: 'search', placeholder: T('Rechercher…', 'Search…'), value: st.aq, 'aria-label': T('Rechercher', 'Search'), oninput: e => { st.aq = e.target.value; draw(); } })),
      h('div', { class: 'ssegs left' }, [['all', T('Toutes', 'All')], ['ready', T('Prêtes', 'Ready')], ['miss', T('Manquantes', 'Missing')]].map(([k, n]) => h('button', { class: st.af === k ? 'on' : '', onclick: e => { st.af = k; e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); draw(); } }, n))), h('span', { style: { color: 'var(--s-sub)', fontSize: '12px' } }, T(`${ready} prêtes sur ${arcs.length} affichées`, `${ready} ready out of ${arcs.length} shown`))), box);
  }
  function dropArea() { return h('div', { class: 'mbj-empty', style: { padding: '34px' } }, I('file'), h('b', { style: { color: 'var(--s-ts)' } }, T('Déposez le fichier .wabbajack', 'Drop the .wabbajack file')), h('span', {}, T('Relâchez pour analyser la modlist', 'Release to analyze the modlist'))); }
  function openFile() {
    const s = sheet(T('Choisir un fichier .wabbajack', 'Select your .wabbajack file'), [h('p', {}, T('Démo : choisissez un fichier d’exemple. Vos fichiers ne sont jamais lus.', 'Demo: pick a sample file. Your own files are never read.')), h('div', { class: 'mbj-lst' }, LISTS.slice(0, 5).map(l => h('button', { class: 'mbj-fl', onclick: () => { s.close(); loadList(l, 'inspector'); } }, I('file'), l.n.replace(/[’']/g, '').replace(/ /g, '_') + '.wabbajack', h('small', {}, ft(l.dl)))))], h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')));
  }
  const ok = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  root.addEventListener('dragover', e => { if (ok(e)) e.preventDefault(); }); root.addEventListener('drop', e => { if (!ok(e)) return; e.preventDefault(); note(T('Démo : votre fichier n’est pas lu, une modlist d’exemple est chargée.', 'Demo: your file is not read, a sample modlist is loaded instead.')); loadList(LISTS[0], 'inspector'); });

  /* ---------- Installation ---------- */
  function pathRow(key, label, hint, badge, ph, auto) {
    const inp = h('input', { value: st[key], placeholder: ph, spellcheck: 'false', 'aria-label': label, oninput: e => { st[key] = e.target.value; e.target.classList.remove('bad'); } });
    return h('div', { class: 'mbj-box' }, h('h4', {}, h('span', {}, label), badge ? h('span', { class: 'mbj-pill bl' }, badge) : null), h('p', {}, hint), h('div', { class: 'mbj-fr' }, inp, h('button', { class: 'sbtn', onclick: () => { st[key] = ph; inp.value = ph; sfx.tick(); } }, I('paste'), T('Coller', 'Paste')), h('button', { class: 'sbtn', onclick: () => browse(key, inp) }, I('folder'), T('Parcourir', 'Browse'))), auto);
  }
  function browse(key, inp) {
    const cands = { dl: ['/Volumes/Games/DOWNLOADS', '/Volumes/SSD Mods/DOWNLOADS', '~/Downloads/Wabbajack'], rtp: ['/Volumes/Games/READY_TO_PLAY', '/Volumes/SSD Mods/READY_TO_PLAY', '~/Games/Skyrim Ready'], gpath: ['', '/Volumes/Games/GAMES/Skyrim Special Edition', '/Volumes/SSD Mods/GAMES/Skyrim Special Edition'] }[key];
    const s = sheet(T('Choisir un dossier', 'Choose a folder'), [h('p', {}, T('Démo : choisissez un emplacement d’exemple.', 'Demo: pick a sample location.')), h('div', { class: 'mbj-lst' }, cands.map(c => h('button', { class: 'mbj-fl', onclick: () => { st[key] = c; inp.value = c; s.close(); sfx.pop(); } }, I('folder'), c || T('(détection automatique)', '(auto-detect)'))))], h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')));
  }
  function pageInstaller() {
    const l = st.list, wrap = h('div', { class: 'mbj-wrap' }), ed = l && edition(l), arcs = l ? archivesOf(l) : [], miss = l ? (st.installed === l.id ? 0 : Math.round(l.arc * .2)) : 0, rdy = l ? l.arc - miss : 0;
    wrap.append(h('div', { class: 'mbj-h', style: { borderBottom: '1px solid var(--s-bd)', paddingBottom: '12px' } }, h('div', {}, h('h2', {}, I('bolt'), T('Installation Ready to Play', 'Ready to Play Installation')), h('p', {}, T('Déploiement direct des mods selon les directives Wabbajack.', 'Direct mod deployment following Wabbajack directives.')))));
    wrap.append(h('div', { class: 'mbj-box' }, h('h4', {}, h('span', {}, I('file'), T('MODLIST CHARGÉE', 'LOADED MODLIST')), l ? h('span', { class: 'mbj-pill bl' }, `${num(l.arc)} archives · ${ft(l.dl)}`) : null),
      l ? [h('div', { class: 'mbj-loaded' }, h('div', {}, h('b', {}, l.n), h('small', {}, `${T('par ', 'by ')}${l.au} · v${l.v}`)), h('span', { class: 'mbj-pill ok' }, '✓ ' + T('Chargée', 'Loaded'))), h('div', { class: 'mbj-loaded' }, h('div', {}, h('b', { style: { fontSize: '12.5px' } }, ed[0]), h('small', {}, T('Version requise : ', 'Required version: ') + ed[1])), h('code', { style: { fontSize: '10.5px', color: 'var(--s-acct)' } }, l.g === 'ae' ? 'SkyrimAE' : 'SkyrimSpecialEdition'))]
        : h('div', { class: 'mbj-warn' }, '⚠ ' + T('Déposez un fichier .wabbajack sur la fenêtre, ou chargez-en un depuis la Galerie ou l’Inspecteur.', 'Drop a .wabbajack file on the window, or load one from the Gallery or the Inspector.'))));
    wrap.append(pathRow('dl', '1. ' + T('DOSSIER DOWNLOADS', 'DOWNLOADS FOLDER'), T('Stockage des archives .7z/.zip/.rar téléchargées (mods bruts).', 'Storage for downloaded .7z/.zip/.rar archives (raw mods).'), null, '/Volumes/Games/DOWNLOADS',
      l ? h('div', { class: 'mbj-cache' }, h('span', {}, T('Cache : ', 'Cache: '), h('b', {}, num(rdy)), ` / ${num(l.arc)} ${T('archives prêtes', 'archives ready')}`), miss ? h('span', { class: 'mbj-pill wn' }, `${num(miss)} ${T('manquantes', 'missing')}`) : h('span', { class: 'mbj-pill ok' }, '✓ ' + T('Toutes présentes', 'All present'))) : null));
    wrap.append(pathRow('rtp', '2. ' + T('DOSSIER READY TO PLAY', 'READY TO PLAY FOLDER'), T('Les fichiers sont extraits ici selon les directives Wabbajack. Copiez-les ensuite dans votre Skyrim/Data.', 'Files are extracted here following Wabbajack directives. Then copy them into your Skyrim/Data.'), T('Destination finale', 'Final destination'), '/Volumes/Games/READY_TO_PLAY'));
    wrap.append(pathRow('gpath', '3. ' + T('DOSSIER DU JEU SKYRIM', 'SKYRIM GAME FOLDER'), T('Dossier contenant Data/. Certaines modlists réutilisent les fichiers ORIGINAUX du jeu (par ex. « Skyrim - Animations.bsa ») : ils ne sont pas téléchargés, ils sont lus ici. Vide = détection automatique (Steam, CrossOver, /Volumes/*/GAMES).', 'Folder containing Data/. Some modlists reuse ORIGINAL game files (e.g. “Skyrim - Animations.bsa”): they are not downloaded, they are read from here. Leave empty = auto-detection (Steam, CrossOver, /Volumes/*/GAMES).'), null, '/Volumes/Games/GAMES/Skyrim Special Edition',
      h('span', { class: 'mbj-pill ok', style: { alignSelf: 'flex-start' } }, '✓ ' + T('Skyrim détecté : 1.6.1170, SKSE présent', 'Skyrim detected: 1.6.1170, SKSE found'))));
    wrap.append(macCard()); wrap.append(keyBox());
    const go1 = h('button', { class: 'sbtn act mbj-go', disabled: !l, onclick: startInstall }, I('bolt'), T('LANCER LE DÉPLOIEMENT READY TO PLAY', 'START READY TO PLAY DEPLOYMENT'));
    wrap.append(l ? go1 : h('div', { class: 'mbj-warn', style: { borderColor: 'var(--s-dg)', color: 'var(--s-dg)' } }, '⛔ ' + T('Installation bloquée : chargez d’abord un vrai fichier .wabbajack.', 'Installation blocked: load a real .wabbajack file first.')), h('div', { class: 'mbj-foot' }, T('Extraction sélective selon les directives Wabbajack · plugins.txt et loadorder.txt générés', 'Selective extraction following Wabbajack directives · plugins.txt & loadorder.txt generated')));
    ui.body.append(h('div', { class: 'mbj-pg' }, wrap));
  }
  function macCard() {
    const opts = [['stock', T('Dossier universel (Stock)', 'Universal folder (Stock)'), T('Le dossier est livré tel que la liste le produit : rien n’est ajouté ni modifié. Copiez-le où vous voulez : Windows, CrossOver, Wine…', 'The folder is delivered exactly as the list produces it: nothing is added or changed. Copy it wherever you like: Windows, CrossOver, Wine…')], ['kit', T('Pour une bouteille CrossOver (kit DXMT mORTEX)', 'For a CrossOver bottle (mORTEX DXMT kit)'), T('Prépare le jeu pour CrossOver sur Mac : moteur graphique DXMT, pont DLSS, réglages d’affichage et DLL de la bouteille. Tout s’annule depuis le bilan.', 'Gets the game ready for CrossOver on Mac: DXMT graphics engine, DLSS bridge, display settings and bottle DLLs. Everything can be undone from the report.')]];
    const box = h('div', { class: 'mbj-box mbj-mac' }), draw = () => box.replaceChildren(h('h4', {}, h('span', {}, I('gear'), T('ADAPTATION AU MAC', 'MAC ADAPTATION'))), h('p', {}, T('Comment utiliserez-vous ce jeu ?', 'How will you use this game?')),
      h('div', { class: 'mbj-mode' }, opts.map(([k, n, d]) => h('button', { class: 'mbj-opt' + (st.mode === k ? ' on' : ''), onclick: () => { st.mode = k; sfx.tick(); draw(); } }, h('i', { class: 'rad' }, st.mode === k ? '✓' : ''), h('span', { class: 't' }, h('b', {}, n), h('small', {}, d))))),
      h('p', {}, T('Les fichiers d’origine sont copiés dans le dossier _MAC_BACKUP du jeu : tout s’annule après l’installation.', 'The original files are copied into the game’s _MAC_BACKUP folder: everything can be undone after the installation.')));
    draw(); return box;
  }
  function keyBox() {
    const inp = h('input', { type: 'password', value: st.key, placeholder: T('Clé API Nexus Mods…', 'Nexus Mods API key…'), 'aria-label': 'Nexus Mods API key', autocomplete: 'off', oninput: e => { st.key = e.target.value; } }), msg = h('p', {}, st.acct ? '✓ ' + T('Compte vérifié : ', 'Account verified: ') + 'Starbudweiser — Premium' : '');
    const val = h('button', { class: 'sbtn', onclick: async () => { if (st.key.trim().length < 8) { inp.classList.add('bad'); msg.textContent = '✕ ' + T('Clé invalide : collez votre clé personnelle Nexus (8 caractères au moins).', 'Invalid key: paste your personal Nexus key (8 characters at least).'); return sfx.click(); } val.disabled = true; msg.textContent = T('Vérification…', 'Verifying…'); await wait(reduced() ? 0 : 900); if (!alive()) return; st.acct = { name: 'Starbudweiser', premium: true }; sfx.pop(); drawBar(); msg.textContent = '✓ Starbudweiser — ' + T('Premium ★ (téléchargements automatiques)', 'Premium ★ (automatic downloads)'); val.disabled = false; } }, '✓ ' + T('Valider', 'Validate'));
    return h('div', { class: 'mbj-box' }, h('p', {}, h('b', { style: { color: 'var(--s-wn)', fontWeight: 600 } }, T('Compte Premium : téléchargements automatiques. ', 'Premium account: automatic downloads. ')), T('Compte standard : les URL à ouvrir à la main sont listées.', 'Standard account: manual URLs listed in the log.')), h('h4', {}, h('span', {}, I('info'), T('CLÉ API NEXUS MODS', 'NEXUS MODS API KEY'), h('span', { style: { color: 'var(--s-sub)', fontWeight: 400, letterSpacing: 0 } }, T('(facultative)', '(optional)')))),
      h('div', { class: 'mbj-fr' }, inp, h('button', { class: 'sbtn', 'aria-label': T('Afficher la clé', 'Show key'), onclick: () => { inp.type = inp.type === 'password' ? 'text' : 'password'; } }, I('eye')), h('button', { class: 'sbtn', onclick: () => { st.key = 'demo-key-7f3a91c2e8b4'; inp.value = st.key; inp.type = 'password'; sfx.tick(); } }, I('paste'), T('Coller', 'Paste')), val), msg);
  }
  function settingsSheet() {
    const fld = (lab, key, ph) => h('label', { class: 'mbj-fld' }, lab, h('div', { class: 'mbj-fr' }, h('input', { value: st[key], placeholder: ph, spellcheck: 'false', oninput: e => { st[key] = e.target.value; } })));
    const th = h('b', { style: { color: 'var(--s-acct)' } }, st.threads), rng = h('input', { type: 'range', class: 'mbj-range', min: 1, max: 16, value: st.threads, 'aria-label': T('Tâches en parallèle', 'Parallel tasks'), oninput: e => { st.threads = +e.target.value; th.textContent = st.threads; } });
    const s = sheet(T('Réglages', 'Settings'), [fld(T('DOSSIER DOWNLOADS (archives des mods)', 'DOWNLOADS FOLDER (mod archives)'), 'dl', '/Volumes/Games/DOWNLOADS'), fld(T('DOSSIER READY TO PLAY (destination finale)', 'READY TO PLAY FOLDER (final destination)'), 'rtp', '/Volumes/Games/READY_TO_PLAY'),
      h('div', { class: 'mbj-fld' }, h('span', {}, T('TÂCHES EN PARALLÈLE', 'PARALLEL TASKS'), ' · ', th, ' ', h('span', { style: { fontWeight: 400, letterSpacing: 0 } }, `(${T('recommandé', 'recommended')} : 8, Apple Silicon)`)), rng), h('p', {}, T('La clé API Nexus est rangée dans le Trousseau macOS, jamais dans un fichier.', 'The Nexus API key is stored in the macOS Keychain, never in a file.'))], h('button', { class: 'sbtn act', onclick: () => { s.close(); if (st.tab === 'installer') drawPage(); } }, T('ENREGISTRER', 'SAVE')));
  }

  /* ---------- simulation de l'installation ---------- */
  const STAGES = () => [[0, 'init', T('Initialisation', 'Initialization')], [3, 'scan', T('Analyse de DOWNLOADS', 'Scanning DOWNLOADS')], [9, 'verify', T('Vérification des archives', 'Verifying archives')], [16, 'dl', T('Téléchargements', 'Downloads')], [42, 'deploy', T('Déploiement des directives (extraction sélective)', 'Deploying directives (selective extraction)')], [84, 'check', T('Contrôle de l’installation', 'Installation check')], [90, 'plugins', T('Génération de plugins.txt', 'Generating plugins.txt')], [95, 'mac', T('Adaptation au Mac', 'Mac adaptation')]];
  const clock = () => new Date().toLocaleTimeString('fr-FR', { hour12: false });
  function log(level, msg) { st.logs.unshift({ id: ++lid, t: clock(), level, msg }); if (st.logs.length > 400) st.logs.length = 400; if (st.tab === 'progress') drawLog(true); }
  function startInstall() {
    const l = st.list; if (!l) return; if (!st.dl.trim() || !st.rtp.trim()) { note(T('Choisissez les dossiers DOWNLOADS et READY TO PLAY.', 'Choose the DOWNLOADS and READY TO PLAY folders.')); return; }
    sfx.click(); st.logs = []; st.mac = null; st.manualOk = false;
    st.prog = { stage: 'init', name: STAGES()[0][2], pct: 0, task: T('Création de DOWNLOADS et READY TO PLAY…', 'Creating DOWNLOADS and READY TO PLAY…'), paused: false, files: 0, total: l.arc * 6 + 112, bytes: 0, tbytes: l.ins * 1024, speed: 0, eta: 0, err: false };
    sim = { state: 'running', last: 'init', t: setInterval(tick, 120), n: 0 }; timers.add(sim.t);
    log('info', T(`Installation de « ${l.n} » v${l.v}`, `Installing “${l.n}” v${l.v}`)); log('debug', `DL: ${st.dl}  ·  RTP: ${st.rtp}`); drawBar(); go('progress');
  }
  const POOLMSG = {
    scan: () => [['info', T('Inventaire des archives de DOWNLOADS…', 'Inventory of DOWNLOADS archives…')], ['debug', T('Index xxHash64 chargé depuis le cache.', 'xxHash64 index loaded from cache.')]],
    verify: n => [['info', T(`Vérification de ${num(n)} archive(s) (xxHash64)…`, `Verifying ${num(n)} archive(s) (xxHash64)…`)]],
    dl: () => { const a = POOL[Math.floor(Math.random() * 20)]; return [['info', T(`Nexus Premium : téléchargement automatique de « ${a[0]} »`, `Nexus Premium: automatic download of “${a[0]}”`)], ['success', `✓ ${a[0]} (${fmb(a[1])})`]]; },
    deploy: () => { const a = POOL[Math.floor(Math.random() * POOL.length)]; const r = Math.random(); return r < .5 ? [['info', T(`Extraction de « ${a[0]} »…`, `Extracting “${a[0]}”…`)]] : r < .65 ? [['debug', T('BSA : lecture native de Skyrim - Meshes0.bsa', 'BSA: native read of Skyrim - Meshes0.bsa')]] : r < .8 ? [['info', T(`Patch OctoDiff appliqué (${Math.round(Math.random() * 300 + 20)} Ko)`, `OctoDiff patch applied (${Math.round(Math.random() * 300 + 20)} KB)`)]] : r < .92 ? [['info', T(`texconv : ${Math.round(Math.random() * 400 + 80)} textures converties en BC7`, `texconv: ${Math.round(Math.random() * 400 + 80)} textures converted to BC7`)]] : [['warn', T('Maître du Stock Game différent du manifeste (conservé).', 'Stock Game master differs from the manifest (kept).')]]; },
    check: () => [['info', T('Contrôle des fichiers installés…', 'Checking installed files…')]],
    plugins: () => [['info', T(`Écriture de plugins.txt et loadorder.txt (${PLUGINS.length} plugins)`, `Writing plugins.txt and loadorder.txt (${PLUGINS.length} plugins)`)]],
    mac: () => st.mode === 'kit' ? [['info', T('Adaptation au Mac : kit DXMT', 'Mac adaptation: DXMT kit')], ['success', T('Pont DLSS (d3d11.dll) posé', 'DLSS bridge (d3d11.dll) placed')], ['info', T('Réglages de SSE Display Tweaks optimisés', 'SSE Display Tweaks settings optimized')], ['warn', T('2 DLL en double écartées (gardées dans _MAC_BACKUP)', '2 duplicate DLLs set aside (kept in _MAC_BACKUP)')]] : [['info', T('Dossier universel : aucune adaptation.', 'Universal folder: no adaptation.')]]
  };
  function tick() {
    const l = st.list, p = st.prog; if (!l || !sim || sim.state !== 'running') return; sim.n++;
    const fast = reduced() ? 8 : 1, stg = STAGES(), cur = stg.filter(s => p.pct >= s[0]).pop(), prem = st.acct && st.acct.premium, missN = Math.round(l.arc * .2);
    /* compte gratuit : pause aux téléchargements, le temps de récupérer les archives à la main */
    if (cur[1] === 'dl' && !prem && !st.manualOk) { if (!sim.manual) { sim.manual = 1; sim.state = 'paused'; p.paused = true; p.task = T('En attente des téléchargements manuels…', 'Waiting for manual downloads…'); log('warn', T(`Compte standard : ${num(missN)} archive(s) à télécharger à la main.`, `Standard account: ${num(missN)} archive(s) to download manually.`)); drawBar(); manualSheet(missN); refreshProg(); } return; }
    const inc = ({ init: .9, scan: .6, verify: .55, dl: .42, deploy: .3, check: .6, plugins: .8, mac: .8 }[cur[1]] || .5) * fast * (.85 + Math.random() * .3);
    p.pct = Math.min(100, p.pct + inc); const ns = stg.filter(s => p.pct >= s[0]).pop();
    if (ns[1] !== cur[1] || sim.last !== ns[1]) { sim.last = ns[1]; p.stage = ns[1]; p.name = ns[2]; (POOLMSG[ns[1]] ? POOLMSG[ns[1]](missN) : []).forEach(m => log(...m)) }
    else if (sim.n % (ns[1] === 'dl' ? 6 : 7) === 0 && POOLMSG[ns[1]] && ['dl', 'deploy'].includes(ns[1])) POOLMSG[ns[1]]().forEach(m => log(...m));
    p.task = ns[1] === 'dl' ? T(`Téléchargement : ${Math.round(missN * (p.pct - 16) / 26)} / ${num(missN)} archive(s)`, `Downloading: ${Math.round(missN * (p.pct - 16) / 26)} / ${num(missN)} archive(s)`) : ns[1] === 'deploy' ? T('Extraction sélective des fichiers…', 'Selective extraction of files…') : ns[2] + '…';
    p.files = Math.round(p.total * clamp((p.pct - 40) / 46, 0, 1)); p.bytes = p.tbytes * clamp((p.pct - 40) / 46, 0, 1); p.speed = ns[1] === 'dl' ? 82 + Math.random() * 12 : ns[1] === 'deploy' ? 240 + Math.random() * 90 : 0; p.eta = p.speed ? Math.max(0, (100 - p.pct) / (inc / 0.12 || 1)) : 0;
    if (p.pct >= 100) finish(); else if (st.tab === 'progress') refreshProg();
  }
  function finish() {
    clearInterval(sim.t); const l = st.list, p = st.prog; p.pct = 100; p.stage = 'completed'; p.name = T('Déploiement terminé !', 'Deployment complete!'); p.task = '✓ ' + T(`« ${l.n} » prêt dans « ${st.rtp} »`, `“${l.n}” ready in “${st.rtp}”`); p.files = p.total; p.bytes = p.tbytes; p.speed = 0; p.eta = 0; sim.state = 'done'; st.installed = l.id;
    st.mac = st.mode === 'kit' ? { fx: [{ id: 'dlss', s: 'applied', t: T('Pont DLSS', 'DLSS bridge'), d: 'd3d11.dll → SkyrimSE.exe' }, { id: 'sdt', s: 'applied', t: 'SSE Display Tweaks', d: T('3 lignes modifiées dans SSEDisplayTweaks.ini', '3 lines changed in SSEDisplayTweaks.ini') }, { id: 'dll', s: 'applied', t: T('DLL en double', 'Duplicate DLLs'), d: T('2 fichiers écartés (gardés dans _MAC_BACKUP)', '2 files set aside (kept in _MAC_BACKUP)') }, { id: 'enb', s: 'skipped', t: T('Pont ENB', 'ENB bridge'), d: T('Aucun ENB dans cette liste', 'No ENB in this list') }] } : { stock: 1 };
    log('success', T(`Installation de « ${l.n} » terminée.`, `Installation of “${l.n}” complete.`)); sfx.done(); drawBar(); if (st.tab === 'progress') drawPage(); else toast({ icon: icon(app.id), title: app.id, body: T(`Installation de « ${l.n} » terminée.`, `Installation of “${l.n}” complete.`), onclick: () => go('progress') });
  }
  function manualSheet(n) {
    const names = POOL.slice(5, 10).map(a => ({ n: a[0], mb: a[1], st: 0 })); let busy = false;
    const lst = h('div', { class: 'mbj-lst', style: { maxHeight: '260px' } }), verify = h('button', { class: 'sbtn act', disabled: true, onclick: async () => { verify.disabled = true; verify.textContent = T('Vérification…', 'Verifying…'); await wait(reduced() ? 0 : 900); if (!alive()) return; s.busy(0); s.close(); resume(); } }, T('VÉRIFIER LES FICHIERS', 'VERIFY FILES'));
    const draw = () => { lst.replaceChildren(...names.map(a => h('div', { class: 'mbj-fl', style: { cursor: 'default' } }, I(a.st === 2 ? 'check' : 'down'), h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } }, a.n), h('small', {}, fmb(a.mb)),
      a.st === 2 ? h('span', { class: 'mbj-pill ok' }, '✓') : h('button', { class: 'sbtn sm', disabled: a.st === 1, onclick: async () => { a.st = 1; draw(); sfx.tick(); await wait(reduced() ? 0 : 700); if (!alive()) return; a.st = 2; sfx.pop(); log('success', T(`Reçu via nxm:// : ${a.n}`, `Received via nxm://: ${a.n}`)); draw(); verify.disabled = !names.every(x => x.st === 2); } }, a.st === 1 ? T('Réception…', 'Receiving…') : 'Mod Manager Download')))); };
    draw(); const s = sheet(T('Téléchargement manuel des archives', 'Manual archive download'), [h('p', {}, T(`${num(n)} archive(s) manquante(s). Compte gratuit : sur la page Nexus, cliquez sur « Mod Manager Download », puis « Slow download » : mABBAJACK reçoit le fichier et le range dans DOWNLOADS. (Démo : ${names.length} archives d’exemple.)`, `${num(n)} archive(s) missing. Free account: on the Nexus page, click “Mod Manager Download”, then “Slow download”: mABBAJACK receives the file and puts it in DOWNLOADS. (Demo: ${names.length} sample archives.)`)), lst],
    [h('button', { class: 'sbtn', onclick: () => { s.busy(0); s.close(); cancel(); } }, T('Annuler l’installation', 'Cancel installation')), verify], { wide: true }); s.busy(1);
    function resume() { st.manualOk = true; sim.state = 'running'; st.prog.paused = false; log('success', T('Archives vérifiées : toutes présentes.', 'Archives verified: all present.')); drawBar(); }
  }
  function cancel() { if (!sim || !['running', 'paused'].includes(sim.state)) return; clearInterval(sim.t); sim.state = 'idle'; st.prog = { ...st.prog, stage: 'idle', name: T('Annulé', 'Cancelled'), pct: 0, task: T('Annulé.', 'Cancelled.'), paused: false, speed: 0, eta: 0, files: 0, bytes: 0 }; log('warn', T('Installation annulée.', 'Installation cancelled.')); sfx.close(); drawBar(); if (st.tab === 'progress') drawPage(); }
  function togglePause() { if (!sim) return; if (sim.state === 'running') { sim.state = 'paused'; st.prog.paused = true; log('info', T('Installation en pause.', 'Installation paused.')); } else if (sim.state === 'paused' && !(sim.manual && !st.manualOk)) { sim.state = 'running'; st.prog.paused = false; log('info', T('Reprise de l’installation.', 'Installation resumed.')); } sfx.click(); drawBar(); drawPage(); }

  /* ---------- Progression ---------- */
  function pageProgress() {
    const p = st.prog, done = p.stage === 'completed', active = sim && ['running', 'paused'].includes(sim.state), l = st.list;
    const pg = h('div', { class: 'mbj-pg' });
    if (!l || (!active && !done && !st.logs.length)) { ui.body.append(h('div', { class: 'mbj-pg' }, h('div', { class: 'mbj-h' }, h('div', {}, h('h2', {}, I('bolt'), T('Progression de l’installation', 'Installation Progress')), h('p', {}, T('Suivez en direct les téléchargements, la vérification xxHash64, l’extraction et les patchs binaires.', 'Monitor downloads, xxHash64 verification, archive extraction, and binary patching in real time.')))), h('div', { class: 'mbj-empty' }, h('span', {}, T('Aucune installation en cours.', 'No installation in progress.')), h('button', { class: 'sbtn', onclick: () => go(l ? 'installer' : 'gallery') }, l ? T('Aller à l’installation', 'Go to Install') : T('Ouvrir la galerie', 'Open the Gallery'))))); return; }
    ui.pr = {}; ui.pr.title = h('h3', {}); ui.pr.tools = h('div', { class: 'mbj-tools' }); ui.pr.pct = h('b'); ui.pr.task = h('span'); ui.pr.bar = h('div', { class: 'mbj-bar' }, h('i')); ui.pr.sbar = h('div', { class: 'mbj-bar thin' }, h('i')); ui.pr.act = h('div', { class: 'mbj-act' }); ui.pr.kp = h('div', { class: 'mbj-kp' });
    pg.append(h('div', { class: 'mbj-top' }, h('div', { class: 'mbj-trow' }, ui.pr.title, ui.pr.tools), h('div', { class: 'mbj-dirs' }, h('span', {}, h('b', {}, 'DL: '), st.dl), h('span', {}, h('b', { class: 'g' }, 'RTP: '), st.rtp)), h('div', { class: 'mbj-pr' }, h('div', { class: 'mbj-pl1' }, ui.pr.task, ui.pr.pct), ui.pr.bar, ui.pr.sbar, ui.pr.act), ui.pr.kp));
    if (done && st.mac) pg.append(macReport());
    ui.pr.term = h('div', { class: 'mbj-term' }); pg.append(ui.pr.term); ui.body.append(pg); refreshProg(); drawTerm();
  }
  function refreshProg() {
    if (!ui.pr || !ui.pr.title.isConnected) return; const p = st.prog, done = p.stage === 'completed', active = sim && ['running', 'paused'].includes(sim.state);
    ui.pr.title.replaceChildren(I('bolt'), T('Progression de l’installation', 'Installation Progress'), h('span', { class: 'mbj-pill ' + (done ? 'ok' : p.paused ? 'wn' : 'bl') }, p.paused ? T('En pause', 'Paused') : p.name || '—'));
    ui.pr.tools.replaceChildren(...(active ? [h('button', { class: 'sbtn sm', onclick: togglePause }, I(p.paused ? 'play' : 'pause'), p.paused ? T('Reprendre', 'Resume') : T('Pause', 'Pause')), h('button', { class: 'sbtn sm', style: { color: 'var(--s-dg)' }, onclick: cancel }, T('Annuler', 'Cancel'))] : []), h('button', { class: 'sbtn sm', onclick: pluginsSheet }, I('file'), 'plugins.txt'), ...(done ? [h('button', { class: 'sbtn sm', onclick: () => note(T('Démo : le dossier s’ouvrirait dans le Finder.', 'Demo: the folder would open in Finder.')) }, I('folder'), T('Afficher dans le Finder', 'Show in Finder'))] : []));
    ui.pr.task.textContent = p.task || T('Progression globale', 'Overall progress'); ui.pr.pct.textContent = p.pct.toFixed(1).replace('.', fr ? ',' : '.') + ' %'; ui.pr.bar.firstChild.style.width = p.pct + '%'; ui.pr.bar.classList.toggle('ok', done); ui.pr.sbar.hidden = done; ui.pr.sbar.firstChild.style.width = clamp(((p.pct % 8) / 8) * 100, 0, 100) + '%';
    ui.pr.act.hidden = done || !active; ui.pr.act.replaceChildren(h('i', { class: 'd' }), h('span', {}, p.task));
    const eta = p.eta > 0 ? `${Math.floor(p.eta / 60)} min ${String(Math.floor(p.eta % 60)).padStart(2, '0')} s` : '--:--', gbs = n => (n / 1024).toFixed(1);
    ui.pr.kp.replaceChildren(...[[T('FICHIERS', 'FILES'), `${num(p.files)} / ${num(p.total)}`, 'var(--s-ts)'], [T('DONNÉES', 'DATA'), `${gbs(p.bytes)} / ${gbs(p.tbytes)} ${T('Go', 'GB')}`, 'var(--s-acct)'], [T('VITESSE', 'SPEED'), p.speed ? `${p.speed.toFixed(1)} ${T('Mo', 'MB')}/s` : `-- ${T('Mo', 'MB')}/s`, 'var(--s-ok)'], ['ETA', eta, 'var(--s-wn)']].map(([a, b, c]) => h('div', {}, h('span', {}, a), h('b', { style: { color: c } }, b))));
  }
  function drawTerm() {
    if (!ui.pr || !ui.pr.term) return; const c = { all: 'var(--s-acct)', warn: 'var(--s-wn)', error: 'var(--s-dg)' };
    ui.pr.term.replaceChildren(h('div', { class: 'mbj-th' }, h('b', {}, T('JOURNAL EN DIRECT', 'LIVE LOG')), h('div', { class: 'mbj-lf' }, [['all', T('Tous', 'All')], ['warn', T('Avertissements', 'Warnings')], ['error', T('Erreurs', 'Errors')]].map(([k, n]) => h('button', { class: st.lf === k ? 'on' : '', style: { '--c': c[k] }, onclick: () => { st.lf = k; drawTerm(); } }, n)), h('span', { class: 'sep' }), h('label', {}, h('input', { type: 'checkbox', checked: st.auto, onchange: e => { st.auto = e.target.checked; } }), T('Défilement auto', 'Auto-scroll')), h('span', { class: 'sep' }),
      h('button', { onclick: copyLog }, ui.copy = h('span', {}, T('Copier le journal', 'Copy log'))), h('button', { onclick: () => { st.logs = []; drawTerm(); } }, T('Effacer', 'Clear')))), ui.pr.log = h('div', { class: 'mbj-log' })); drawLog();
  }
  function drawLog(fresh) {
    if (!ui.pr || !ui.pr.log || !ui.pr.log.isConnected) return; const a = st.logs.filter(x => st.lf === 'all' || (st.lf === 'error' ? x.level === 'error' : x.level === 'warn' || x.level === 'error')).slice(0, 120);
    ui.pr.log.replaceChildren(...(a.length ? a.map((x, i) => h('div', { class: 'mbj-ln ' + x.level + (fresh && i === 0 ? ' new' : '') }, h('span', { class: 'ts' }, x.t), h('span', { class: 'lv' }, `[${x.level}]`), h('span', { class: 'tx' }, x.msg))) : [h('div', { class: 'mbj-wait' }, T('En attente des opérations…', 'Waiting for operations…'))]));
    if (st.auto) ui.pr.log.scrollTop = 0;
  }
  async function copyLog() { const txt = st.logs.map(x => `[${x.t}] [${x.level.toUpperCase()}] ${x.msg}`).join('\n'); try { await navigator.clipboard.writeText(txt); } catch { /* non autorisé : sans importance dans la démo */ } if (ui.copy) { ui.copy.textContent = T('Copié !', 'Copied!'); later(() => { ui.copy && (ui.copy.textContent = T('Copier le journal', 'Copy log')); }, 2200); } }
  function pluginsSheet() { const s = sheet('plugins.txt', [h('p', {}, T('Ordre de chargement après LOOT, généré à partir de l’ordre optimal défini par la modlist.', 'Post-LOOT load order, generated from the optimal order defined by the modlist.')), h('pre', { class: 'mbj-pl' }, PLUGINS.map(p => '*' + p).join('\n')), h('p', {}, T('Sur macOS / Wine, ce fichier va généralement dans : drive_c/users/crossover/AppData/Local/Skyrim Special Edition/', 'On macOS / Wine, this file usually goes in: drive_c/users/crossover/AppData/Local/Skyrim Special Edition/'))], h('button', { class: 'sbtn', onclick: () => s.close() }, T('Fermer', 'Close'))); }
  function macReport() {
    const box = h('div', { class: 'mbj-box mbj-mac' }), m = st.mac, draw = () => {
      if (m.stock) return box.replaceChildren(h('h4', {}, h('span', {}, I('gear'), T('BILAN MAC', 'MAC REPORT'))), h('p', {}, T('Dossier universel : aucune adaptation, le dossier est tel que la liste l’a produit. Copiez-le où vous voulez.', 'Universal folder: no adaptation, the folder is exactly as the list produced it. Copy it wherever you like.')));
      const left = m.fx.filter(x => x.s === 'applied').length;
      box.replaceChildren(h('h4', {}, h('span', {}, I('gear'), T('BILAN MAC', 'MAC REPORT'))), h('p', {}, !left && m.fx.some(x => x.s === 'undone') ? T('Tout est annulé : le jeu est revenu à son état d’avant l’adaptation.', 'Everything is undone: the game is back to its state before the adaptation.') : T('Installation terminée. Voici ce que l’adaptation au Mac a fait.', 'Installation complete. Here is what the Mac adaptation did.')),
        ...m.fx.map(x => h('div', { class: 'mbj-fx' }, h('span', { class: 'mbj-pill ' + ({ applied: 'ok', skipped: '', undone: 'wn' }[x.s]) }, { applied: T('Appliqué', 'Applied'), skipped: T('Ignoré', 'Skipped'), undone: T('Annulé', 'Undone') }[x.s]), h('div', { class: 't' }, x.t, h('small', {}, x.d)), x.s === 'applied' ? h('button', { class: 'sbtn', onclick: () => { x.s = 'undone'; sfx.click(); log('info', T(`Annulé : ${x.t}`, `Undone: ${x.t}`)); draw(); } }, T('Annuler', 'Undo')) : h('span'))),
        left ? h('div', { class: 'mbj-row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'sbtn', onclick: () => { m.fx.forEach(x => { if (x.s === 'applied') x.s = 'undone'; }); sfx.pop(); log('success', T('Tout est annulé.', 'Everything is undone.')); draw(); } }, T('Tout annuler', 'Undo all'))) : null, h('p', {}, T('Gardez le dossier _MAC_BACKUP à la racine du jeu : il contient les fichiers d’origine nécessaires pour annuler.', 'Keep the _MAC_BACKUP folder at the root of the game: it holds the original files needed to undo.')));
    }; draw(); return box;
  }
  layout(); setTimeout(() => w.el.focus({ preventScroll: true }), 0);
  return root;
}
