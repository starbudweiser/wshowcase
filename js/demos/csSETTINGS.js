/* Réplique interactive de csSETTINGS (interface Socle) : bibliothèque de presets Community Shaders, presets ENB, échange de système,
   sauvegardes et navigateur Nexus. Données fictives : aucun fichier n'est lu ni écrit, aucun réseau. */
import { lang } from '../i18n.js';
import { h, brand, esc, wait, reduced, clamp, T, sfx, wm, toast, icon, download, css, S } from './kit.js';
css('css/demos/csSETTINGS.css');

/* Nom d'appli dans les textes : la lettre minuscule initiale prend la couleur du logo (règle Socle), jamais dans un menu déroulant. */
const NAMES = { mORTEX: '#f59e0b', mABBAJACK: '#5aa9ff', csSETTINGS: '#38bdf8', mTRANSLATOR: '#4285f4' }, NRE = /\b(mORTEX|mABBAJACK|csSETTINGS|mTRANSLATOR)\b/;
function tint(el) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => (NRE.test(n.nodeValue) && !n.parentNode.closest('.lc,input,textarea,select,option,[data-nobrand],.mtx-pop,.mtr-menu,.mbj-menu,.csx-menu') ? 1 : 3) }), list = [];
  while (tw.nextNode()) list.push(tw.currentNode);
  list.forEach(n => { const sp = document.createElement('span'); sp.innerHTML = esc(n.nodeValue).replace(new RegExp(NRE.source, 'g'), m => brand(m, NAMES[m])); n.replaceWith(...sp.childNodes); });
}

const P = { down: 'M6 9l6 6 6-6', chevl: 'M15 6l-6 6 6 6', chevr: 'M9 6l6 6-6 6', refresh: 'M21 12a9 9 0 1 1-3-6.7M21 4v5h-5', ext: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6', check: 'M4 12l5 5L20 6', folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3' };
const svg = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const I = n => h('span', { html: svg(n), style: { display: 'inline-grid' } });
const REF = '1.9.0.0';

/* ---------- données d'exemple ---------- */
const PRESETS = () => [
  { id: 'amber', name: '1 - Amber Haze (NAT III)', ver: '1.8.0.0', pp: ['Amber Haze pp.json'], editor: ['Weathers', 'ImageSpaces', 'SceneSettings', 'Volumetric Lighting', 'EditorSettings.json'], mod: 'Amber Haze', file: 'Amber Haze NAT III 1.8', added: '2026-10-18', c: { unk: ['NRD', 'Physical Sky', 'Pseudo Sun Bounce', 'Screen Space Point Light Shadows', 'Screen Space Reflections'], fg: true, ppr: ['unknown'], upp: ['Border', 'COD Bloom', 'Camera', 'Color Grading and Tone Mapping', 'Composite', 'Depth of Field', 'Histogram Auto Exposure', 'LUT', 'Lens Flare', 'Local Exposure', 'Motion Blur', 'Physical Glare', 'Vignette'], miss: [], uo: 21 } },
  { id: 'frost', name: '2 - Frost Grade', ver: '1.6.0.0', pp: ['Frost pp.json'], editor: ['Weathers', 'ImageSpaces'], mod: 'Frost Grade', file: 'Frost Grade 1.6', added: '2026-10-12', c: { unk: ['Terrain Blending', 'Cloud Shadows'], fg: false, ppr: ['version'], upp: [], miss: [], uo: 8, pv: '1.6.0.0' } },
  { id: 'twi', name: '3 - Twilight (CS + ENB)', ver: '1.9.0.0', enb: true, pp: ['Twilight pp.json'], editor: ['Weathers', 'ImageSpaces', 'SceneSettings'], mod: 'Twilight', file: 'Twilight CS + ENB 1.2', added: '2026-10-05', c: { unk: [], fg: false, ppr: [], upp: [], miss: ['Sky Sync'], uo: 0 } },
  { id: 'gold', name: 'Golden Hour', ver: '1.8.0.0', pp: [], editor: ['Weathers'], src: T('Importé à la main', 'Imported by hand'), added: '2026-09-30', c: { unk: ['Screen Space Reflections'], fg: false, ppr: [], upp: [], miss: [], uo: 3 } },
  { id: 'starb', name: 'Starbudweiser', ver: '1.9.0.0', pp: ['Starbudweiser pp.json'], editor: ['Weathers', 'ImageSpaces', 'SceneSettings', 'EditorSettings.json'], src: T('Configuration enregistrée', 'Saved configuration'), added: '2026-11-08', c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 } },
  { id: 'moss', name: 'Moss & Mist 0.3', ver: '1.4.6.0', pp: [], editor: [], mod: 'Moss & Mist', file: 'Moss & Mist 0.3', added: '2026-09-12', c: { unk: ['Terrain Helper', 'Inverse Square Lighting'], fg: false, ppr: [], upp: [], miss: [], uo: 12 } }];
const ENBS = () => [{ id: 'north', name: 'Northlight ENB', fx: 14, local: true, added: '2026-10-20', src: 'Nexus Mods' }, { id: 'obs', name: 'Obsidian ENB (pour les mods météo)', nameEn: 'Obsidian ENB (for weather mods)', fx: 11, local: false, added: '2026-10-02', src: 'Nexus Mods' }, { id: 'cinder', name: 'Cinder ENB', fx: 9, local: true, added: '2026-09-21', src: T('Importé à la main', 'Imported by hand') }];
const NXMODS = () => [
  { id: 'aur', n: 'Aurora Grade', au: 'Lysandre', v: '2.0', d: T('Étalonnage froid et lumineux, pensé pour Community Shaders 1.9.', 'A cool, luminous grade made for Community Shaders 1.9.'), dl: '48 K', en: '5.2 K', ver: '1.9.0.0', file: 'AuroraGrade_CS1.9.zip', mb: 4.2, c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 }, pp: ['Aurora pp.json'], editor: ['Weathers', 'ImageSpaces'] },
  { id: 'cold', n: 'Cold Dawn Weathers', au: 'Tolvar', v: '1.4', d: T('Aubes glacées et brumes basses, avec ses propres météos.', 'Icy dawns and low mist, with its own weathers.'), dl: '31 K', en: '3.8 K', ver: '1.8.0.0', file: 'ColdDawn_CS1.8.7z', mb: 6.8, c: { unk: ['Screen Space Reflections'], fg: false, ppr: [], upp: [], miss: [], uo: 4 }, pp: [], editor: ['Weathers'] },
  { id: 'ash', n: 'Ashfall Mood', au: 'Marenwyn', v: '1.1', d: T('Ambiance cendrée, contrastes doux, ombres longues.', 'An ashen mood: soft contrast and long shadows.'), dl: '22 K', en: '2.9 K', ver: '1.9.0.0', file: 'AshfallMood_CS1.9.zip', mb: 3.1, c: { unk: [], fg: false, ppr: [], upp: [], miss: ['Sky Sync'], uo: 0 }, pp: ['Ashfall pp.json'], editor: ['Weathers', 'SceneSettings'] },
  { id: 'verd', n: 'Verdant Lumen', au: 'Eirik', v: '3.0', d: T('Verts éclatants, soleil doré, rendu très naturel.', 'Vivid greens, golden sun and a very natural look.'), dl: '67 K', en: '7.5 K', ver: '1.9.0.0', file: 'VerdantLumen_CS1.9.zip', mb: 5.5, c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 }, pp: ['Verdant pp.json'], editor: ['Weathers', 'ImageSpaces'] },
  { id: 'dusk', n: 'Dusk & Dawn LUT Pack', au: 'Hallvard', v: '0.9', d: T('Six LUT de crépuscule à régler en jeu.', 'Six dusk LUTs to tune in game.'), dl: '9 K', en: '1.1 K', ver: '1.7.2.0', file: 'DuskDawn_LUT_CS1.7.7z', mb: 12.4, c: { unk: [], fg: false, ppr: ['composite'], upp: ['LUT'], miss: [], uo: 2, pv: '1.7.2.0' }, pp: ['Dusk pp.json'], editor: [] },
  { id: 'min', n: 'Minimal Contrast', au: 'Brynja', v: '1.3', d: T('Un preset discret : on corrige à peine, on garde tout.', 'A discreet preset: barely corrects anything, keeps everything.'), dl: '15 K', en: '2.0 K', ver: '1.9.0.0', file: 'MinimalContrast_CS1.9.zip', mb: 1.9, c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 }, pp: [], editor: ['Weathers'] }];
const SAMPLES = () => [['AuroraGrade_CS1.9.zip', 'zip', 4.2, { ver: '1.9.0.0', pp: ['Aurora pp.json'], editor: ['Weathers', 'ImageSpaces'], c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 } }], ['OldSchool_CS1.5.7z', '7z', 7.4, { ver: '1.5.0.0', pp: [], editor: ['Weathers'], c: { unk: ['Terrain Shadows', 'Grass Collision'], fg: false, ppr: [], upp: [], miss: [], uo: 6 } }], ['ReShade-Preset.rar', 'rar', 2.2, null]];
const pad = n => String(n).padStart(2, '0'), stamp = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 690, x: 250, y: 88, minw: 880, minh: 560, bare: true, cls: 'socle csx-win', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); }, build: w => build(app, w) });
}

function build(app, w) {
  const fr = lang() === 'fr', fl = x => (fr ? x.replace('.', ',') : x);
  const st = { tab: 'presets', sel: 'starb', enbSel: 'north', bkSel: 0, sys: 'CS', running: false, active: 'starb', enbActive: null, presets: PRESETS(), enb: ENBS(), busy: false, nx: { page: 'home', mod: null, q: '', got: new Set() }, key: '', acct: null, cfg: { lib: '/Users/Shared/Skyrim/Shaders/CS presets', enb: '/Users/Shared/Skyrim/Shaders/ENB presets', sys: '/Users/Shared/Skyrim/Shaders/Systems', cs: '/Volumes/Games/GAMES/Skyrim Special Edition/Data/SKSE/Plugins/CommunityShaders', bk: '/Users/Shared/Skyrim/Shaders/Backups', lang: 'auto' } };
  const bk0 = (d, reason, ver, cont) => ({ name: d, reason, ver, cont });
  st.backups = [bk0('2026-11-08 21:14:07', T('avant d’appliquer « Starbudweiser »', 'before applying “Starbudweiser”'), REF, T('réglages, Weathers, ImageSpaces, 3 PP', 'settings, Weathers, ImageSpaces, 3 PP')), bk0('2026-11-07 18:40:12', T('avant d’appliquer « Golden Hour »', 'before applying “Golden Hour”'), '1.8.0.0', T('réglages, Weathers, 1 PP', 'settings, Weathers, 1 PP')), bk0('2026-11-02 14:20:11', T('avant l’échange de système', 'before the system swap'), '1.8.0.0', T('réglages, Weathers, ImageSpaces, ENB', 'settings, Weathers, ImageSpaces, ENB'))];
  st.hist = [{ d: '2026-11-02 14:20:11', op: T('Passage à Community Shaders', 'Switch to Community Shaders'), layer: 'CS', s: T('Terminé', 'Done') }, { d: '2026-10-29 09:03:40', op: T('Reprise de l’installation actuelle', 'Adopt the current installation'), layer: 'CS', s: T('Terminé', 'Done') }];
  let ui = {}, menu = null; const timers = new Set(), alive = () => !w.dead;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); return t; };
  const offs = new Set(); w.cleanup = () => { timers.forEach(clearTimeout); offs.forEach(f => f()); };
  const mine = () => S.active === w && !w.min;
  const root = h('div', { class: 'csx', tabindex: '-1' });
  const cur = () => st.presets.find(p => p.id === st.sel), curE = () => st.enb.find(p => p.id === st.enbSel);
  const enbName = e => (fr ? e.name : e.nameEn || e.name);
  const say = text => { if (!ui.log) return; const d = h('div', { class: 'n' }, h('span', { class: 't' }, new Date().toLocaleTimeString('fr-FR', { hour12: false }) + '  '), text); ui.log.append(d); tint(d); ui.log.scrollTop = ui.log.scrollHeight; };
  const lvl = c => (c.unk.length || c.fg || c.ppr.length || c.upp.length ? 'wn' : 'ok');
  const kindOf = p => `CS ${p.ver}` + (lvl(p.c) === 'wn' ? '  ·  ' + T('⚠ incompatible en partie', '⚠ partly incompatible') : '');

  /* ---------- dialogues ---------- */
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; } };
  root.addEventListener('pointerdown', e => { if (menu && !menu.contains(e.target) && !e.target.closest('[data-menu]')) closeMenu(); }, true);
  function popMenu(anchor, items) {
    const same = menu && menu.dataset.for === anchor.dataset.menu; closeMenu(); if (same) return;
    const m = h('div', { class: 'csx-menu', 'data-for': anchor.dataset.menu }, items.map(([label, fn]) => h('button', { onclick: () => { closeMenu(); fn(); } }, label))); root.append(m); menu = m;
    const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect(), sc = S.scale || 1; m.style.top = (a.bottom - r.top) / sc + 4 + 'px'; m.style.left = clamp((a.left - r.left) / sc, 8, root.clientWidth - m.offsetWidth - 8) + 'px';
  }
  function dlg(title, body, btns, o = {}) {
    return new Promise(res => {
      const done = v => { sh.remove(); document.removeEventListener('keydown', key, true); offs.delete(off); w.el.focus({ preventScroll: true }); res(v); }, off = () => document.removeEventListener('keydown', key, true);
      const go = b => { const v = b.get ? b.get() : b.v; if (v === false && b.get) return; done(v); };
      const key = e => { if (!mine()) return; if (e.key === 'Escape') { e.stopPropagation(); done(o.cancel === undefined ? null : o.cancel); } else if (e.key === 'Enter' && o.enter && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.stopPropagation(); go(o.enter); } };
      const sh = h('div', { class: 'csx-sheet', onpointerdown: e => { if (e.target === sh && !o.modal) done(o.cancel === undefined ? null : o.cancel); } },
        h('div', { class: 'csx-pan' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-label': title, tabindex: '-1' }, h('div', { class: 'csx-sh' }, h('h4', {}, title), h('button', { class: 'x', 'aria-label': T('Fermer', 'Close'), onclick: () => done(o.cancel === undefined ? null : o.cancel) }, '×')), h('div', { class: 'csx-sb' }, body), btns ? h('div', { class: 'csx-sf' }, btns.map(b => h('button', { class: 'sbtn ' + (b.cls || ''), onclick: () => go(b) }, b.label))) : null));
      document.addEventListener('keydown', key, true); offs.add(off); root.append(sh); tint(sh); sh.firstChild.focus({ preventScroll: true });
      sh.firstChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
      o.focus && setTimeout(() => o.focus.focus({ preventScroll: true }), 40); o.onopen && o.onopen(sh, done);
    });
  }
  const ask = (title, text, yes) => { const ok = { label: yes || T('Oui', 'Yes'), cls: 'acc', v: true }; return dlg(title, h('p', {}, text), [{ label: T('Annuler', 'Cancel'), v: false }, ok], { cancel: false, enter: ok }).then(v => v === true); };
  const info = (title, text) => { const ok = { label: 'OK', cls: 'acc', v: true }; return dlg(title, h('p', {}, text), [ok], { enter: ok }); };
  async function prompt(title, label, def) {
    const inp = h('input', { class: 'csx-in', value: def || '', 'aria-label': label, spellcheck: 'false' }), err = h('p', { style: { color: 'var(--s-dg)', minHeight: '18px' } });
    const get = () => { const v = inp.value.trim(); if (!v) { inp.classList.add('bad'); return false; } return v; }, b = { label: 'OK', cls: 'acc', get };
    return dlg(title, [h('p', {}, label), inp, err], [{ label: T('Annuler', 'Cancel'), v: null }, b], { enter: b, focus: inp, onopen: () => { inp.select(); } });
  }

  /* ---------- structure ---------- */
  function layout() {
    ui.bar = h('div', { class: 'sbar', 'data-drag': '' }); ui.tabs = h('div', { class: 'csx-tabs', role: 'tablist' }); ui.main = h('div', { class: 'csx-main' }); ui.log = h('div', { class: 'csx-log', 'aria-label': 'Journal', role: 'log' });
    root.replaceChildren(ui.bar, ui.tabs, ui.main, ui.log); drawBar(); drawTabs(); drawTab();
    say(T('csSETTINGS prêt. Bibliothèque : ', 'csSETTINGS ready. Library: ') + st.cfg.lib);
  }
  function drawBar() {
    ui.gs = h('button', { class: 'csx-gs' + (st.running ? ' run' : ''), title: T('Démo : cliquez pour simuler le lancement du jeu', 'Demo: click to simulate the game running'), onclick: () => { st.running = !st.running; sfx.tick(); drawBar(); if (st.tab === 'presets' || st.tab === 'enb' || st.tab === 'bk' || st.tab === 'sys') drawTab(); say(st.running ? T('⚠ Jeu lancé : fermez-le avant d’appliquer', '⚠ Game running: close it before applying') : T('Jeu fermé', 'Game closed')); } }, st.running ? T('⚠ Jeu lancé : fermez-le avant d’appliquer', '⚠ Game running: close it before applying') : T('Jeu fermé', 'Game closed'));
    ui.bar.replaceChildren(wm.lights(w), h('b', { html: brand(app.id, app.accent) }), h('span', { class: 'csx-sub' }, T('Presets Community Shaders', 'Community Shaders presets')), ui.gs, h('button', { class: 'sbtn sm', onclick: settingsSheet }, T('Réglages', 'Settings')), h('button', { class: 'sbtn sm', disabled: !app.download, onclick: () => download(app) }, T('Télécharger', 'Download')));
  }
  const TABS = () => [['presets', 'Presets'], ['enb', T('Presets ENB', 'ENB presets')], ['sys', T('Système', 'System')], ['bk', T('Sauvegardes', 'Backups')], ['nexus', 'Nexus']];
  function drawTabs() { ui.tabs.replaceChildren(...TABS().map(([k, n]) => h('button', { class: 'csx-tab' + (st.tab === k ? ' on' : ''), role: 'tab', 'aria-selected': String(st.tab === k), onclick: () => go(k) }, n))); }
  function go(k) { closeMenu(); st.tab = k; sfx.tick(); drawTabs(); drawTab(); }
  function drawTab() { ui.main.replaceChildren(); ({ presets: tabPresets, enb: tabEnb, sys: tabSys, bk: tabBk, nexus: tabNexus }[st.tab])(); tint(ui.main); }

  /* ---------- compatibilité ---------- */
  const ppWhy = c => c.ppr.map(r => ({ composite: T('étape Composite absente', 'Composite step missing'), unknown: T(`effets inconnus : ${c.upp.join(', ')}`, `unknown effects: ${c.upp.join(', ')}`), version: T(`preset fait pour CS ${c.pv || '1.8.0.0'}`, `preset made for CS ${c.pv || '1.8.0.0'}`) }[r])).join(' ; ');
  function compatEl(p) {
    const c = p.c, parts = [];
    if (c.unk.length) parts.push(h('p', {}, h('b', {}, T(`⚠ Features inconnues de votre Community Shaders ${REF}`, `⚠ Features unknown to your Community Shaders ${REF}`)), ` : ${c.unk.join(', ')}. ` + T('Elles seront ignorées ; le rendu peut différer des captures du preset (autre variante de CS, comme Jiaye AIO ou Open Shader ?).', 'They will be ignored; the result may differ from the preset’s screenshots (another CS variant, such as Jiaye AIO or Open Shader?).')));
    if (c.fg) parts.push(h('p', {}, h('b', {}, T('⚠ Frame Generation forcée', '⚠ Forced Frame Generation')), ` : ` + T('le preset l’active, et sous CrossOver elle fait planter le jeu au lancement. Désactivez-la en jeu (Upscaling) ou dans le SettingsUser.json du preset (frameGenerationForceEnable à 0).', 'the preset turns it on, and under CrossOver it crashes the game at launch. Turn it off in game (Upscaling) or in the preset’s SettingsUser.json (frameGenerationForceEnable to 0).')));
    if (c.ppr.length) parts.push(h('p', {}, h('b', {}, T('⚠ Post-traitement du preset ignoré', '⚠ Preset post-processing ignored')), ` : ` + T(`votre Community Shaders ${REF} rejettera sa chaîne de post-traitement (${ppWhy(c)}) et la remplacera par une chaîne vide. Ni l’étalonnage ni les effets du preset ne seront rendus : refaites la chaîne en jeu ou prenez une version du preset faite pour CS ${REF}.`, `your Community Shaders ${REF} will reject its post-processing chain (${ppWhy(c)}) and replace it with an empty chain. Neither the preset’s grading nor its effects will be rendered: rebuild the chain in game or get a version of the preset made for CS ${REF}.`)));
    else if (c.upp.length) parts.push(h('p', {}, h('b', {}, T('⚠ Effets de post-traitement inconnus', '⚠ Unknown post-processing effects')), ` : ${c.upp.join(', ')}. ` + T('Ils seront ignorés.', 'They will be ignored.')));
    if (c.miss.length) parts.push(h('p', {}, h('b', {}, T('ⓘ Features absentes du preset', 'ⓘ Features missing from the preset')), ` : ${c.miss.join(', ')}. ` + T('Elles garderont leurs valeurs par défaut.', 'They will keep their default values.')));
    if (c.uo) parts.push(h('p', {}, T(`ⓘ ${c.uo} option(s) inconnue(s) dans des features connues : renommées ou retirées depuis la version du preset, elles seront ignorées.`, `ⓘ ${c.uo} unknown option(s) in known features: renamed or removed since the preset’s version, they will be ignored.`)));
    const l = lvl(c); if (l === 'ok') parts.unshift(h('p', {}, h('b', {}, T('✓ Compatible', '✓ Compatible')), ` : ` + T(`toutes les features du preset existent dans votre Community Shaders ${REF}.`, `all the preset’s features exist in your Community Shaders ${REF}.`)));
    return h('div', { class: 'csx-co ' + l }, parts);
  }
  function detailsEl(p) {
    const out = []; out.push(p.mod ? h('p', { class: 'csx-p' }, h('b', {}, T('Source', 'Source')), ' : ', h('a', { href: '#', onclick: e => { e.preventDefault(); say(T('Démo : la page Nexus s’ouvrirait dans votre navigateur.', 'Demo: the Nexus page would open in your browser.')); } }, p.mod), ` — ${p.file}`) : h('p', { class: 'csx-p' }, h('b', {}, T('Source', 'Source')), ' : ' + p.src));
    out.push(h('p', { class: 'csx-p' }, h('b', {}, T('Ajouté le', 'Added on')), ' : ' + p.added), h('p', { class: 'csx-p' }, T('Remplace les réglages de Community Shaders (SettingsUser.json).', 'Replaces the Community Shaders settings (SettingsUser.json).')));
    if (p.editor.length) out.push(h('p', { class: 'csx-p' }, T('Données de l’éditeur CS : ', 'CS editor data: ') + p.editor.join(', ')));
    if (p.pp.length) out.push(h('p', { class: 'csx-p' }, T('Post-traitement ajouté au menu CS : ', 'Post-processing added to the CS menu: ') + p.pp.join(', ')));
    if (p.enb) out.push(h('p', { class: 'csx-p' }, h('b', {}, T('Preset ENB (Effects 11)', 'ENB preset (Effects 11)')), ' : ' + T('remplace enbseries.ini et le dossier enbseries à la racine du jeu. Ceux en place sont déplacés dans la sauvegarde, rien n’est effacé.', 'replaces enbseries.ini and the enbseries folder at the game root. Those in place are moved into the backup, nothing is deleted.')));
    return out;
  }

  /* ---------- onglet Presets ---------- */
  function tabPresets() {
    const p = cur(), enbOn = st.sys === 'ENB';
    ui.list = h('div', { class: 'csx-list', role: 'listbox', 'aria-label': 'Presets' }, st.presets.map(x => h('button', { class: 'csx-li' + (x.id === st.sel ? ' on' : ''), role: 'option', 'aria-selected': String(x.id === st.sel), ondblclick: () => apply(), onclick: () => { st.sel = x.id; drawTab(); } },
      h('b', {}, x.id === st.active ? h('i', {}, '●') : null, x.name), h('small', {}, kindOf(x).split('  ·  ')[0], lvl(x.c) === 'wn' ? h('span', { class: 'w' }, '  ·  ' + T('⚠ incompatible en partie', '⚠ partly incompatible')) : null))));
    const imp = h('button', { class: 'sbtn sm', 'data-menu': 'imp', onclick: e => popMenu(e.currentTarget, [[T('Une archive (.ZIP, .7Z, .RAR)…', 'An archive (.ZIP, .7Z, .RAR)…'), importArchive], [T('Un dossier…', 'A folder…'), importFolder]]) }, T('Importer…', 'Import…'), I('down'));
    ui.main.append(h('div', { class: 'csx-split' }, h('div', { class: 'csx-left' }, ui.list, h('div', { class: 'csx-hint' }, T('Vous pouvez aussi glisser-déposer une archive ou un dossier sur la fenêtre.', 'You can also drag and drop an archive or a folder onto the window.')),
      h('div', { class: 'csx-row' }, imp, h('button', { class: 'sbtn sm', onclick: () => go('nexus') }, T('Depuis Nexus…', 'From Nexus…')), h('button', { class: 'sbtn sm', onclick: saveCurrent }, T('Enregistrer la config actuelle…', 'Save current config…')))),
      h('div', { class: 'csx-right' }, p ? [h('h2', { class: 'csx-h' }, p.name), h('div', { class: 'csx-bg' }, p.id === st.active ? h('span', { class: 'ok' }, T('✓ Chargé', '✓ Loaded')) : null, h('span', {}, `CS ${p.ver}`), p.enb ? h('span', {}, T('+ ENB', '+ ENB')) : null, p.ver !== REF ? h('span', { class: 'wn' }, T('⚠ Réglages d’une autre version de CS', '⚠ Settings from another CS version')) : null),
        h('div', { class: 'csx-scroll' }, enbOn ? h('div', { class: 'csx-co wn' }, T('Le système ENB est actif : les presets Community Shaders ne s’appliquent pas. Passez à Community Shaders dans l’onglet Système.', 'The ENB system is active: Community Shaders presets do not apply. Switch to Community Shaders in the System tab.')) : null, compatEl(p), ...detailsEl(p)),
        h('p', { class: 'csx-re' }, T('Avant chaque application, la configuration en place est sauvegardée (onglet Sauvegardes). Aucun fichier du preset n’est modifié.', 'Before each apply, the current configuration is backed up (Backups tab). No preset file is modified.')),
        h('div', { class: 'csx-bt' }, h('button', { class: 'sbtn', onclick: () => say(T('Démo : le dossier s’ouvrirait dans le Finder.', 'Demo: the folder would open in Finder.')) }, T('Afficher dans le Finder', 'Show in Finder')), h('button', { class: 'sbtn', onclick: removePreset }, T('Retirer de la bibliothèque', 'Remove from library')), h('span', { class: 'sp' }), ui.apply = h('button', { class: 'sbtn act', disabled: st.running || enbOn || st.busy, title: st.running ? T('Fermez le jeu avant d’appliquer', 'Close the game before applying') : '', onclick: () => apply() }, T('Appliquer ce preset', 'Apply this preset')))]
        : [h('h2', { class: 'csx-h' }, T('Aucun preset', 'No preset')), h('p', { class: 'csx-p' }, T('Importez une archive, un dossier, ou téléchargez un preset depuis Nexus pour commencer. Bibliothèque : ', 'Import an archive or a folder, or download a preset from Nexus to get started. Library: ') + st.cfg.lib)])));
  }
  async function apply() {
    const p = cur(); if (!p || st.running || st.sys === 'ENB' || st.busy) return; const c = p.c;
    if (c.fg && !await ask('csSETTINGS', T(`« ${p.name} » force la Frame Generation de Community Shaders, qui fait planter le jeu sous CrossOver. Appliquer quand même ? La configuration en place est sauvegardée avant.`, `“${p.name}” forces Community Shaders’ Frame Generation, which crashes the game under CrossOver. Apply anyway? The current configuration is backed up first.`), T('Appliquer', 'Apply'))) return;
    if (c.ppr.length && !await ask('csSETTINGS', T(`Le post-traitement de « ${p.name} » sera ignoré : votre Community Shaders ${REF} rejettera sa chaîne (${ppWhy(c)}) et la remplacera par une chaîne vide. Appliquer quand même ? La configuration en place est sauvegardée avant.`, `The post-processing of “${p.name}” will be ignored: your Community Shaders ${REF} will reject its chain (${ppWhy(c)}) and replace it with an empty chain. Apply anyway? The current configuration is backed up first.`), T('Appliquer', 'Apply'))) return;
    if ((c.unk.length || (c.upp.length && !c.ppr.length)) && !await ask('csSETTINGS', T(`« ${p.name} » utilise des réglages que votre Community Shaders ne connaît pas (${[...c.unk, ...(c.ppr.length ? [] : c.upp)].join(', ')}). Ils seront ignorés. Appliquer quand même ? La configuration en place est sauvegardée avant.`, `“${p.name}” uses settings that your Community Shaders does not know (${[...c.unk, ...(c.ppr.length ? [] : c.upp)].join(', ')}). They will be ignored. Apply anyway? The current configuration is backed up first.`), T('Appliquer', 'Apply'))) return;
    if (!alive()) return; st.busy = true; ui.apply && (ui.apply.disabled = true, ui.apply.textContent = T('Application…', 'Applying…')); sfx.click(); await wait(reduced() ? 0 : 700); if (!alive()) return; st.busy = false;
    const name = stamp(new Date()), prevA = st.presets.find(x => x.id === st.active); st.backups.unshift(bk0(name, T(`avant d’appliquer « ${p.name} »`, `before applying “${p.name}”`), prevA ? prevA.ver : REF, T('réglages, Weathers, ImageSpaces, ' + (prevA ? prevA.pp.length : 0) + ' PP', 'settings, Weathers, ImageSpaces, ' + (prevA ? prevA.pp.length : 0) + ' PP'))); st.active = p.id; sfx.done();
    say(T(`Preset « ${p.name} » appliqué. Sauvegarde de l’ancienne configuration : ${name.replace(/[ :]/g, '_')}`, `Preset “${p.name}” applied. Backup of the old configuration: ${name.replace(/[ :]/g, '_')}`)); toast({ icon: icon(app.id), title: app.id, body: T(`Preset « ${p.name} » appliqué.`, `Preset “${p.name}” applied.`) }); drawTab();
  }
  async function removePreset() {
    const p = cur(); if (!p) return; if (!await ask('csSETTINGS', T(`Retirer « ${p.name} » de la bibliothèque ? Il est déplacé dans le dossier des sauvegardes, pas effacé.`, `Remove “${p.name}” from the library? It is moved to the backup folder, not deleted.`), T('Retirer', 'Remove'))) return;
    const i = st.presets.indexOf(p); st.presets.splice(i, 1); if (st.active === p.id) st.active = null; st.sel = (st.presets[Math.min(i, st.presets.length - 1)] || {}).id; sfx.close(); say(T(`« ${p.name} » déplacé dans ${st.cfg.bk}`, `“${p.name}” moved to ${st.cfg.bk}`)); drawTab();
  }
  async function saveCurrent() {
    const d = new Date(), def = T(`Mon réglage ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, `My setup ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    const name = await prompt('csSETTINGS', T('Nom du nouveau preset :', 'New preset name:'), def); if (!name) return;
    if (st.presets.some(x => x.name.toLowerCase() === name.toLowerCase())) { await info('csSETTINGS', T('Un preset porte déjà ce nom.', 'A preset with this name already exists.')); return; }
    const a = st.presets.find(x => x.id === st.active), p = { id: 'u' + Date.now(), name, ver: REF, pp: a ? a.pp : ['Current pp.json'], editor: a ? a.editor : ['Weathers'], src: T('Configuration enregistrée', 'Saved configuration'), added: stamp(d).slice(0, 10), c: { unk: [], fg: false, ppr: [], upp: [], miss: [], uo: 0 } };
    st.presets.unshift(p); st.sel = p.id; st.active = p.id; sfx.pop(); say(T(`Configuration actuelle enregistrée : ${st.cfg.lib}/${name}`, `Current configuration saved: ${st.cfg.lib}/${name}`)); drawTab();
  }
  async function importArchive() {
    const f = await dlg(T('Choisir une archive', 'Choose an archive'), [h('p', {}, T('Démo : choisissez une archive d’exemple. Vos fichiers ne sont jamais lus.', 'Demo: pick a sample archive. Your own files are never read.')), ...SAMPLES().map(s => h('button', { class: 'csx-opt', onclick: e => e.currentTarget.dispatchEvent(new CustomEvent('pick', { bubbles: true, detail: s })) }, I('folder'), s[0], h('small', {}, s[2] + ' MB')))], [{ label: T('Annuler', 'Cancel'), v: null }], { onopen: (sh, done) => sh.addEventListener('pick', e => done(e.detail)) });
    if (!f) return; await importSample(f);
  }
  async function importFolder() { const s = SAMPLES()[0]; const ok = await ask(T('Choisir un dossier', 'Choose a folder'), T('Démo : un dossier d’exemple « AuroraGrade_CS1.9 » sera importé.', 'Demo: a sample folder “AuroraGrade_CS1.9” will be imported.'), T('Choisir', 'Choose')); if (ok) importSample([s[0].replace('.zip', ''), 'dir', s[2], s[3]]); }
  async function importSample(f) {
    const stem = f[0].replace(/\.(zip|7z|rar)$/i, ''), name = await prompt('csSETTINGS', T('Nom du preset :', 'Preset name:'), stem); if (!name) return;
    if (!f[3]) { await info('csSETTINGS', T(`Aucun preset Community Shaders trouvé dans « ${f[0]} » : il faut un SettingsUser.json ou un dossier PostProcessing.`, `No Community Shaders preset found in “${f[0]}”: a SettingsUser.json or a PostProcessing folder is required.`)); say(T(`Échec : aucun preset dans « ${f[0]} »`, `Failed: no preset in “${f[0]}”`)); return; }
    const p = { id: 'i' + Date.now(), name, ver: f[3].ver, pp: f[3].pp, editor: f[3].editor, src: T('Importé à la main', 'Imported by hand'), added: stamp(new Date()).slice(0, 10), c: f[3].c }; st.presets.unshift(p); st.sel = p.id; sfx.pop(); say(T(`Importé : ${name}`, `Imported: ${name}`)); if (st.tab !== 'presets') go('presets'); else drawTab();
    if (lvl(p.c) === 'wn') say(T(`⚠ « ${name} » : features inconnues de votre Community Shaders, elles seront ignorées (${p.c.unk.join(', ')}).`, `⚠ “${name}”: features unknown to your Community Shaders, they will be ignored (${p.c.unk.join(', ')}).`));
  }
  const dragOk = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  root.addEventListener('dragover', e => { if (dragOk(e) && ['presets'].includes(st.tab)) { e.preventDefault(); if (!ui.dz) { ui.dz = h('div', { class: 'csx-drop' }, T('Déposez l’archive ou le dossier ici', 'Drop the archive or folder here')); root.append(ui.dz); } } });
  const undrop = () => { ui.dz && ui.dz.remove(); ui.dz = null; };
  root.addEventListener('dragleave', e => { if (!root.contains(e.relatedTarget)) undrop(); }); root.addEventListener('drop', e => { if (!dragOk(e)) return; e.preventDefault(); undrop(); toast({ icon: icon(app.id), title: app.id, body: T('Démo : votre fichier n’est pas lu, une archive d’exemple est importée.', 'Demo: your file is not read, a sample archive is imported instead.') }); importSample(SAMPLES()[0]); });

  /* ---------- onglet ENB ---------- */
  function tabEnb() {
    const e = curE(), on = st.sys === 'ENB';
    ui.main.append(h('div', { class: 'csx-split' }, h('div', { class: 'csx-left' }, h('div', { class: 'csx-list', role: 'listbox' }, st.enb.map(x => h('button', { class: 'csx-li' + (x.id === st.enbSel ? ' on' : ''), role: 'option', ondblclick: () => applyEnb(), onclick: () => { st.enbSel = x.id; drawTab(); } }, h('b', {}, x.id === st.enbActive ? h('i', {}, '●') : null, enbName(x))))),
      h('div', { class: 'csx-hint' }, T('Bibliothèque : ', 'Library: ') + st.cfg.enb), h('div', { class: 'csx-row' }, h('button', { class: 'sbtn sm', onclick: saveEnb }, T('Enregistrer l’ENB actuel…', 'Save current ENB…')))),
      h('div', { class: 'csx-right' }, e ? [h('h2', { class: 'csx-h' }, enbName(e)), h('div', { class: 'csx-scroll' }, !on ? h('div', { class: 'csx-co wn' }, T('Le système ENB n’est pas actif : passez-y depuis l’onglet Système pour appliquer un preset ENB.', 'The ENB system is not active: switch to it from the System tab to apply an ENB preset.')) : null,
        e.id === st.enbActive ? h('p', { class: 'csx-p', style: { color: 'var(--s-ok)' } }, T('✓ Chargé', '✓ Loaded')) : null, h('p', { class: 'csx-p' }, h('b', {}, T('Source', 'Source')), ' : ' + e.src), h('p', { class: 'csx-p' }, h('b', {}, T('Ajouté le', 'Added on')), ' : ' + e.added), h('p', { class: 'csx-p' }, T(`Remplace enbseries.ini et le dossier enbseries à la racine du jeu (${e.fx} effets).`, `Replaces enbseries.ini and the enbseries folder at the game root (${e.fx} effects).`)), e.local ? h('p', { class: 'csx-p' }, T('L’enblocal.ini du preset n’est pas appliqué : il règle la machine, pas le rendu.', 'The preset’s enblocal.ini is not applied: it tunes the machine, not the look.')) : null),
        h('p', { class: 'csx-re' }, T('Avant chaque application, enbseries.ini et le dossier enbseries en place sont déplacés dans la sauvegarde, rien n’est effacé, sauf le cache enbcache de la racine du jeu, supprimé pour que le nouveau preset soit recompilé. Aucun fichier du preset n’est modifié.', 'Before each application, the enbseries.ini and enbseries folder in place are moved into the backup, nothing is deleted, except the enbcache folder at the game root, removed so the new preset is recompiled. No file of the preset is modified.')),
        h('div', { class: 'csx-bt' }, h('button', { class: 'sbtn', onclick: () => say(T('Démo : le dossier s’ouvrirait dans le Finder.', 'Demo: the folder would open in Finder.')) }, T('Afficher dans le Finder', 'Show in Finder')), h('span', { class: 'sp' }), h('button', { class: 'sbtn act', disabled: !on || st.running || st.busy, onclick: applyEnb }, T('Appliquer ce preset ENB', 'Apply this ENB preset')))] : h('h2', { class: 'csx-h' }, T('Aucun preset ENB', 'No ENB preset')))));
  }
  async function applyEnb() {
    const e = curE(); if (!e || st.sys !== 'ENB' || st.running || st.busy) return; st.busy = true; sfx.click(); await wait(reduced() ? 0 : 800); if (!alive()) return; st.busy = false;
    const name = stamp(new Date()); st.backups.unshift(bk0(name, T(`avant l’ENB « ${enbName(e)} »`, `before ENB “${enbName(e)}”`), '—', 'ENB')); st.enbActive = e.id; sfx.done(); say(T(`Preset ENB appliqué : ${enbName(e)}. Ancienne config sauvegardée dans ${name.replace(/[ :]/g, '_')}`, `ENB preset applied: ${enbName(e)}. Old config backed up in ${name.replace(/[ :]/g, '_')}`)); toast({ icon: icon(app.id), title: app.id, body: T(`Preset ENB « ${enbName(e)} » appliqué.`, `ENB preset “${enbName(e)}” applied.`) }); drawTab();
  }
  async function saveEnb() {
    const name = await prompt('csSETTINGS', T('Nom du preset ENB à enregistrer :', 'Name of the ENB preset to save:'), 'My ENB'); if (!name) return;
    if (st.enb.some(x => x.name.toLowerCase() === name.toLowerCase())) { await info('csSETTINGS', T('Un preset ENB porte déjà ce nom.', 'An ENB preset with this name already exists.')); return; }
    if (st.sys !== 'ENB') { await info('csSETTINGS', T('Aucun enbseries.ini à la racine du jeu : rien à enregistrer.', 'No enbseries.ini at the game root: nothing to save.')); return; }
    st.enb.unshift({ id: 'e' + Date.now(), name, fx: 12, local: true, added: stamp(new Date()).slice(0, 10), src: T('Configuration enregistrée', 'Saved configuration') }); st.enbSel = st.enb[0].id; sfx.pop(); say(T(`Preset ENB enregistré : ${name}`, `ENB preset saved: ${name}`)); drawTab();
  }

  /* ---------- onglet Système ---------- */
  function tabSys() {
    const names = { CS: 'Community Shaders', ENB: 'ENB' }, bad = st.sys === 'ENB' ? 'DXVK' : 'DXMT', backend = 'DXMT';
    const lines = [h('p', {}, st.sys ? [h('b', {}, T('Système actif', 'Active system')), ' : ' + names[st.sys]] : [h('b', {}, T('Aucun système géré par csSETTINGS', 'No system managed by csSETTINGS')), ' : ' + T('l’installation actuelle n’est pas encore suivie. Reprenez-la ou choisissez un système ci-dessous.', 'the current installation is not tracked yet. Resume it or pick a system below.')]), h('p', {}, T('Skyrim 1.6.1170 détecté, SKSE présent.', 'Skyrim 1.6.1170 detected, SKSE found.'))];
    const warn = st.sys === 'ENB';
    if (warn) lines.push(h('p', {}, h('b', {}, T(`⚠ Backend graphique : ${backend}`, `⚠ Graphics backend: ${backend}`)), '. ' + T('ENB rend correctement sous DXVK ; sous DXMT, la teinte est faussée (dominante verte). Dans CrossOver : bouteille › Réglages avancés › Graphismes › DXVK.', 'ENB renders correctly under DXVK; under DXMT the tint is off (green cast). In CrossOver: bottle › Advanced Settings › Graphics › DXVK.'))); else lines.push(h('p', {}, T(`Backend graphique : ${backend}.`, `Graphics backend: ${backend}.`)));
    if (st.sys) lines.push(h('p', {}, '• ' + (st.sys === 'CS' ? 'CS' : 'ENB') + ' : ' + T('intact', 'intact')));
    const sw = (k, label) => h('button', { class: 'sbtn acc csx-sw' + (st.sys === k ? ' cur' : ''), disabled: st.running || st.busy, onclick: () => swap(k) }, st.sys === k ? I('check') : null, label);
    ui.main.append(h('div', { class: 'csx-pg' }, h('div', { class: 'csx-co ' + (warn ? 'wn' : st.sys ? 'ok' : 'in') }, lines),
      h('p', { class: 'csx-p', style: { color: 'var(--s-sub)' } }, T('Un système de shaders à la fois : Community Shaders (Bottled) ou ENB. Chaque système a une base neutre ; passer de l’un à l’autre retire proprement l’ancien (ce que vous avez modifié est mis de côté, jamais perdu) et pose le nouveau. Les pièces communes (KiLoader…) restent.', 'One shader system at a time: Community Shaders (Bottled) or ENB. Each system has a neutral base; switching from one to the other cleanly removes the old one (whatever you changed is set aside, never lost) and installs the new one. Shared parts (KiLoader…) stay.')),
      h('div', { class: 'csx-row' }, sw('CS', 'Community Shaders'), sw('ENB', 'ENB'), h('button', { class: 'sbtn', disabled: !st.sys || st.running || st.busy, onclick: removeSys }, T('Retirer le système', 'Remove the system'))),
      h('p', { class: 'csx-st' }, h('b', {}, T('Bases : ', 'Bases: ')), 'CS ✓ · ENB ✓'), h('div', { class: 'csx-row' }, h('button', { class: 'sbtn', onclick: () => { say(T('Reconstruction des bases… (démo : rien n’est modifié)', 'Rebuilding the bases… (demo: nothing is changed)')); } }, T('Reconstruire les bases…', 'Rebuild the bases…')), h('button', { class: 'sbtn', onclick: () => say(T('Démo : le dossier s’ouvrirait dans le Finder.', 'Demo: the folder would open in Finder.')) }, T('Afficher les bases', 'Show the bases'))),
      h('h3', { class: 'csx-h3' }, T('Historique des échanges', 'Swap history')), h('div', { class: 'csx-tbl csx-hs' }, h('div', { class: 'csx-tr h' }, h('span', {}, 'DATE'), h('span', {}, T('OPÉRATION', 'OPERATION')), h('span', {}, T('COUCHE', 'LAYER')), h('span', {}, T('ÉTAT', 'STATE'))), h('div', { class: 'body' }, st.hist.map(x => h('div', { class: 'csx-tr' }, h('span', {}, x.d), h('span', {}, x.op), h('span', {}, x.layer), h('span', {}, x.s))))),
      h('div', { class: 'csx-row' }, h('button', { class: 'sbtn', onclick: () => say(T('Démo : la sauvegarde s’ouvrirait dans le Finder.', 'Demo: the backup would open in Finder.')) }, T('Afficher la sauvegarde dans le Finder', 'Show the backup in Finder')))));
  }
  async function swap(k) {
    if (st.sys === k || st.running || st.busy) return; const nm = k === 'CS' ? 'Community Shaders' : 'ENB', r = k === 'ENB' ? 212 : 148, a = k === 'ENB' ? 3 : 1, add = k === 'ENB' ? 148 : 212, rep = k === 'ENB' ? 6 : 4;
    const ok = await ask('csSETTINGS', T(`Passer à « ${nm} » ?\n\n• ${r} fichier(s) de l’ancien système retirés, dont ${a} modifiés depuis la pose (mis de côté dans la sauvegarde)\n• ${add} fichier(s) ajoutés, ${rep} remplacés (originaux sauvegardés)\n\nSauvegarde : ${st.cfg.bk}`, `Switch to “${nm}”?\n\n• ${r} file(s) of the old system removed, of which ${a} modified since placement (set aside in the backup)\n• ${add} file(s) added, ${rep} replaced (originals saved)\n\nBackup: ${st.cfg.bk}`), T('Passer', 'Switch')); if (!ok) return;
    st.busy = true; const bar = h('div', { class: 'csx-bar' }, h('i')), msg = h('p', {}, T('Opération en cours… ne fermez pas l’appli ni le disque.', 'Operation in progress… do not close the app or the disk.')); const ov = h('div', { class: 'csx-ov' }, h('div', { class: 'box' }, h('b', { style: { color: 'var(--s-ts)' } }, T(`Passage à ${nm}`, `Switching to ${nm}`)), msg, bar)); root.append(ov); sfx.click();
    const steps = [T('Retrait de l’ancien système…', 'Removing the old system…'), T('Mise de côté des fichiers modifiés…', 'Setting aside modified files…'), T('Pose de la base neutre…', 'Placing the neutral base…'), T('Vérification des empreintes…', 'Verifying checksums…')];
    for (let i = 0; i < steps.length && alive(); i++) { msg.textContent = steps[i]; bar.firstChild.style.width = (i + 1) / steps.length * 100 + '%'; sfx.tick(); if (!reduced()) await wait(480); }
    if (!alive()) return; ov.remove(); st.busy = false; const was = st.sys; st.sys = k; const d = stamp(new Date());
    st.backups.unshift(bk0(d, T('avant l’échange de système', 'before the system swap'), REF, k === 'ENB' ? 'ENB' : T('réglages, Weathers', 'settings, Weathers'))); st.hist.unshift({ d, op: T(`Passage à ${nm}`, `Switch to ${nm}`), layer: k, s: T('Terminé', 'Done') }); if (k === 'CS') st.enbActive = null;
    sfx.done(); say(T(`Système « ${nm} » en place. ${r} fichier(s) retiré(s), ${add} ajouté(s).`, `System “${nm}” in place. ${r} file(s) removed, ${add} added.`)); toast({ icon: icon(app.id), title: app.id, body: T(`Système actif : ${nm}.`, `Active system: ${nm}.`) }); drawTab();
  }
  async function removeSys() { if (!st.sys) return; const ok = await ask('csSETTINGS', T('Retirer le système actif ? Les fichiers d’origine remplacés sont remis. Sans système, le jeu n’aura plus de shaders de rendu.', 'Remove the active system? The original files that were replaced are put back. Without a system, the game will have no rendering shaders.'), T('Retirer', 'Remove')); if (!ok) return; st.sys = null; st.enbActive = null; sfx.close(); st.hist.unshift({ d: stamp(new Date()), op: T('Retrait du système', 'System removal'), layer: '—', s: T('Terminé', 'Done') }); say(T('Système retiré.', 'System removed.')); drawTab(); }

  /* ---------- onglet Sauvegardes ---------- */
  function tabBk() {
    const sel = clamp(st.bkSel, 0, st.backups.length - 1);
    ui.main.append(h('div', { class: 'csx-pg' }, h('div', { class: 'csx-tbl csx-bk', style: { flex: 1 } }, h('div', { class: 'csx-tr h' }, h('span', {}, 'DATE'), h('span', {}, T('MOTIF', 'REASON')), h('span', {}, T('RÉGLAGES CS', 'CS SETTINGS')), h('span', {}, T('CONTENU', 'CONTENTS'))),
      h('div', { class: 'body', style: { flex: 1 } }, st.backups.map((b, i) => h('button', { class: 'csx-tr' + (i === sel ? ' on' : ''), onclick: () => { st.bkSel = i; drawTab(); } }, h('span', {}, b.name.replace(/_/g, ' ')), h('span', { title: b.reason }, b.reason), h('span', {}, b.ver), h('span', { title: b.cont }, b.cont))))),
      h('div', { class: 'csx-bt' }, h('button', { class: 'sbtn', onclick: () => say(T('Démo : la sauvegarde s’ouvrirait dans le Finder.', 'Demo: the backup would open in Finder.')) }, T('Afficher dans le Finder', 'Show in Finder')), h('span', { class: 'sp' }), h('button', { class: 'sbtn acc', disabled: st.running || st.busy || !st.backups.length, onclick: () => restore(sel) }, T('Restaurer cette sauvegarde', 'Restore this backup')))));
  }
  async function restore(i) {
    const b = st.backups[i]; if (!b || st.running) return; st.busy = true; sfx.click(); await wait(reduced() ? 0 : 700); if (!alive()) return; st.busy = false; const name = stamp(new Date());
    st.backups.unshift(bk0(name, T(`avant la restauration de ${b.name}`, `before restoring ${b.name}`), REF, T('réglages, Weathers, ImageSpaces', 'settings, Weathers, ImageSpaces'))); st.active = null; st.bkSel = 0; sfx.done();
    say(T(`Sauvegarde ${b.name.replace(/ /g, '_')} restaurée (configuration remplacée sauvegardée dans ${name.replace(/[ :]/g, '_')}).`, `Backup ${b.name.replace(/ /g, '_')} restored (replaced configuration saved in ${name.replace(/[ :]/g, '_')}).`)); toast({ icon: icon(app.id), title: app.id, body: T('Sauvegarde restaurée.', 'Backup restored.') }); drawTab();
  }

  /* ---------- onglet Nexus (navigateur) ---------- */
  function tabNexus() {
    const n = st.nx, mod = n.mod && NXMODS().find(m => m.id === n.mod);
    const back = h('button', { class: 'sbtn ico', 'aria-label': T('Page précédente', 'Previous page'), disabled: !mod, onclick: () => { n.mod = null; sfx.tick(); drawTab(); } }, I('chevl')), fwd = h('button', { class: 'sbtn ico', 'aria-label': T('Page suivante', 'Next page'), disabled: true }, I('chevr'));
    const find = h('input', { type: 'search', placeholder: T('Rechercher sur Nexus', 'Search Nexus'), 'aria-label': T('Rechercher sur Nexus', 'Search Nexus'), value: n.q, oninput: e => { n.q = e.target.value; n.mod = null; drawPage(); } });
    ui.pgbox = h('div', { class: 'csx-page' });
    ui.main.append(h('div', { class: 'csx-web' }, h('div', { class: 'csx-nav' }, back, fwd, h('button', { class: 'sbtn ico', 'aria-label': T('Recharger', 'Reload'), onclick: () => { sfx.click(); drawPage(); } }, I('refresh')), h('div', { class: 'url' }, 'nexusmods.com/skyrimspecialedition' + (mod ? '/mods/' + (mod.mb * 1000 | 0) : '/mods?q=community+shaders+preset')), find,
      h('button', { class: 'sbtn ico', 'aria-label': T('Ouvrir dans le navigateur', 'Open in browser'), title: T('Ouvrir dans le navigateur', 'Open in browser'), onclick: () => say(T('Démo : la page s’ouvrirait dans votre navigateur.', 'Demo: the page would open in your browser.')) }, I('ext'))), ui.pgbox));
    drawPage();
  }
  function drawPage() {
    if (!ui.pgbox || !ui.pgbox.isConnected) return; const n = st.nx, mods = NXMODS(), q = n.q.trim().toLowerCase(), mod = n.mod && mods.find(m => m.id === n.mod); ui.pgbox.replaceChildren();
    if (mod) {
      const got = n.got.has(mod.id);
      return ui.pgbox.append(h('h2', { class: 'csx-h' }, mod.n), h('p', { class: 'csx-hint', style: { margin: '2px 0 10px' } }, `${T('par ', 'by ')}${mod.au} · v${mod.v} · ${fl(mod.dl)} ${T('téléchargements', 'downloads')} · ${fl(mod.en)} ${T('recommandations', 'endorsements')}`), h('p', { class: 'csx-p' }, mod.d),
        h('div', { class: 'csx-files' }, h('div', { class: 'csx-fr h' }, h('span', {}, T('FICHIER', 'FILE')), h('span', {}, T('CATÉGORIE', 'CATEGORY')), h('span', {}, 'VERSION'), h('span', {}, T('TAILLE', 'SIZE')), h('span')),
          h('div', { class: 'csx-fr' }, h('span', { class: 'n', title: mod.file }, mod.file), h('span', {}, T('Fichier principal', 'Main file')), h('span', {}, mod.ver), h('span', {}, mod.mb + ' MB'), h('button', { class: 'sbtn acc sm', disabled: got, onclick: () => download1(mod) }, got ? '✓ ' + T('Dans la bibliothèque', 'In library') : T('Télécharger', 'Download')))),
        h('p', { class: 'csx-re', style: { marginTop: '10px' } }, T('Le fichier téléchargé est ajouté à la bibliothèque. Aucun réglage du jeu n’est modifié.', 'The downloaded file is added to the library. No game setting is changed.')));
    }
    const list = mods.filter(m => !q || (m.n + m.au + m.d).toLowerCase().includes(q));
    ui.pgbox.append(h('h2', { class: 'csx-h', style: { marginBottom: '4px' } }, T('Presets Community Shaders', 'Community Shaders presets')), h('p', { class: 'csx-hint', style: { marginBottom: '12px' } }, T('Skyrim Special Edition · résultats pour « community shaders preset »', 'Skyrim Special Edition · results for “community shaders preset”')),
      list.length ? h('div', { class: 'csx-mods' }, list.map(m => h('button', { class: 'csx-mod', onclick: () => { n.mod = m.id; sfx.tick(); drawTab(); } }, h('div', { class: 'th' }, m.n.toUpperCase()), h('div', { class: 'bd' }, h('b', {}, m.n), h('small', {}, `${T('par ', 'by ')}${m.au}`), h('small', {}, m.d), h('div', { class: 'mt' }, h('span', {}, '⇩ ' + fl(m.dl)), h('span', {}, '♥ ' + fl(m.en)), h('span', {}, 'CS ' + m.ver)))))) : h('p', { class: 'csx-p' }, T('Aucun résultat.', 'No results.')));
  }
  async function download1(m) {
    const btn = ui.pgbox.querySelector('.csx-fr .sbtn'); if (btn) { btn.disabled = true; btn.textContent = T('Téléchargement…', 'Downloading…'); } say(T(`Téléchargement de ${m.file}…`, `Downloading ${m.file}…`)); sfx.click(); await wait(reduced() ? 0 : 1400); if (!alive()) return;
    const p = { id: 'nx' + m.id, name: m.n, ver: m.ver, pp: m.pp, editor: m.editor, mod: m.n, file: m.file, added: stamp(new Date()).slice(0, 10), c: m.c }; if (!st.presets.some(x => x.id === p.id)) st.presets.unshift(p); st.nx.got.add(m.id); sfx.pop();
    say(T(`✓ Ajouté à la bibliothèque : ${m.n}`, `✓ Added to the library: ${m.n}`)); toast({ icon: icon(app.id), title: app.id, body: T(`« ${m.n} » ajouté à la bibliothèque.`, `“${m.n}” added to the library.`), onclick: () => { st.sel = p.id; go('presets'); } }); if (st.tab === 'nexus') drawPage();
  }

  /* ---------- Réglages ---------- */
  function settingsSheet() {
    const f = (label, key) => { const inp = h('input', { value: st.cfg[key], spellcheck: 'false', 'aria-label': label, oninput: e => { tmp[key] = e.target.value; } }); return [h('label', {}, label), inp, h('button', { class: 'sbtn sm', onclick: () => { const alt = { lib: '/Users/Shared/Skyrim/Shaders/CS presets', enb: '/Users/Shared/Skyrim/Shaders/ENB presets', sys: '/Users/Shared/Skyrim/Shaders/Systems', cs: '/Volumes/Games/GAMES/Skyrim Special Edition/Data/SKSE/Plugins/CommunityShaders', bk: '/Users/Shared/Skyrim/Shaders/Backups' }; inp.value = inp.value === alt[key] ? alt[key].replace('/Users/Shared', '/Volumes/SSD') : alt[key]; tmp[key] = inp.value; sfx.tick(); } }, T('Choisir…', 'Choose…'))]; };
    const tmp = { ...st.cfg }, keyInp = h('input', { type: 'password', value: st.key, placeholder: T('Collez votre clé API Nexus…', 'Paste your Nexus API key…'), 'aria-label': T('Clé d’API', 'API key'), style: { gridColumn: '1 / 2' }, oninput: e => { st.key = e.target.value; } }), keyMsg = h('p', {}, st.acct ? '✓ ' + T('Clé valide : Starbudweiser (Premium)', 'Valid key: Starbudweiser (Premium)') : '');
    const lg = h('select', { 'aria-label': T('Langue', 'Language'), onchange: e => { tmp.lang = e.target.value; } }, [['auto', T(`Automatique (${fr ? 'Français' : 'English'})`, `Automatic (${fr ? 'Français' : 'English'})`)], ['en', 'English'], ['fr', 'Français'], ['es', 'Español'], ['it', 'Italiano']].map(([v, n]) => h('option', { value: v, selected: tmp.lang === v }, n)));
    const check = h('button', { class: 'sbtn', onclick: async () => { if (st.key.trim().length < 8) { keyMsg.style.color = 'var(--s-dg)'; keyMsg.textContent = '✕ ' + T('Clé rejetée par Nexus (clé trop courte).', 'Key rejected by Nexus (key too short).'); return sfx.click(); } check.disabled = true; keyMsg.style.color = ''; keyMsg.textContent = T('Vérification…', 'Checking…'); await wait(reduced() ? 0 : 800); if (!alive()) return; st.acct = { name: 'Starbudweiser' }; sfx.pop(); check.disabled = false; keyMsg.style.color = 'var(--s-ok)'; keyMsg.textContent = '✓ ' + T('Clé valide : Starbudweiser (Premium)', 'Valid key: Starbudweiser (Premium)'); } }, T('Vérifier', 'Check'));
    dlg(T('Réglages', 'Settings'), [h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, ...[[T('Bibliothèque de presets', 'Preset library'), 'lib'], [T('Bibliothèque de presets ENB', 'ENB presets library'), 'enb'], [T('Dossier des bases système (CS / ENB)', 'Folder of the system bases (CS / ENB)'), 'sys'], [T('Dossier Community Shaders du jeu', 'Game’s Community Shaders folder'), 'cs'], [T('Dossier des sauvegardes', 'Backup folder'), 'bk']].map(([l, k]) => h('div', { class: 'csx-fld' }, ...f(l, k))), h('div', { class: 'csx-fld' }, h('label', {}, T('Langue', 'Language')), lg)),
      h('h5', { class: 'csx-h4' }, 'Nexus Mods'), h('p', {}, T('Collez votre clé d’API personnelle (page « API Keys » de votre compte Nexus). Elle est gardée dans le trousseau macOS, jamais dans un fichier. Le téléchargement direct demande un compte Premium.', 'Paste your personal API key (“API Keys” page of your Nexus account). It is stored in the macOS keychain, never in a file. Direct download requires a Premium account.')),
      h('div', { class: 'csx-fld', style: { gridTemplateColumns: 'minmax(0,1fr) auto auto' } }, keyInp, check, h('button', { class: 'sbtn', onclick: () => say(T('Démo : la page des clés s’ouvrirait dans votre navigateur.', 'Demo: the keys page would open in your browser.')) }, T('Ouvrir la page des clés', 'Open the keys page'))), keyMsg],
      [{ label: T('Annuler', 'Cancel'), v: null }, { label: T('ENREGISTRER', 'SAVE'), cls: 'act', get: () => { Object.assign(st.cfg, tmp); return true; } }], { wide: true }).then(v => { if (v) { if (tmp.lang !== 'auto') say(T('La nouvelle langue s’appliquera au prochain lancement.', 'The new language will apply at the next launch.')); if (st.tab === 'enb') drawTab(); } });
  }

  layout(); setTimeout(() => w.el.focus({ preventScroll: true }), 0);
  return root;
}
