/* mBAE : réplique fidèle de Bethesda Archive Extractor. Ouvrir une archive .bsa / .ba2 (bouton, ⌘O ou glisser-déposer),
   lire sa liste de fichiers (colonnes triables), tout extraire vers un dossier. Données d'exemple : aucun fichier n'est lu. */
import { h, brand, reduced, clamp, sfx, toast, icon, T, css, wm, dlBtn } from './kit.js';
css('css/demos/mBAE.css');

const COLOR = '#21a3d9';
const ROW = 30, MAXROWS = 2500;

/* ---------------------------- archives d'exemple (fictives, générées) ---------------------------- */
const rng = seed => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
const pad = (n, w = 2) => String(n).padStart(w, '0');
/* garde N éléments répartis sur toute la liste, dans l'ordre */
const spread = (a, n) => (a.length <= n ? a : Array.from({ length: n }, (_, i) => a[Math.floor((i * a.length) / n)]));
const SZ_DDS = [262272, 699192, 1048704, 2796344, 5592504, 11184952];

function genInterface() {
  const r = rng(11), out = [], add = (n, kb) => out.push({ n, s: Math.round(kb * 1024), c: false });
  for (const p of ['360', 'ps3', 'durango', 'orbis', 'pc']) { add(`interface/controls/${p}/keyboard_english.txt`, 2.3); add(`interface/controls/${p}/gamepad.txt`, 0.5); add(`interface/controls/${p}/controlmap.txt`, 6.5 + r() * 2.7); }
  [['hudmenu', 181.5], ['safezone', 0.9], ['inventorymenu', 142.8], ['magicmenu', 96.3], ['map', 118.4], ['journal_menu', 88.1], ['statsmenu', 64.7], ['lockpickingmenu', 53.2], ['sleepwaitmenu', 21.9], ['tweenmenu', 38.6], ['loadingmenu', 24.4], ['mainmenu', 45.5]]
    .forEach(([n, kb]) => add(`interface/exported/${n}.gfx`, kb));
  ['English', 'French', 'German', 'Italian', 'Spanish', 'Polish', 'Russian', 'Japanese', 'Czech'].forEach(l => add(`interface/translate_${l.toLowerCase()}.txt`, 38 + r() * 9));
  ['english', 'french', 'german', 'italian', 'spanish', 'polish', 'russian', 'japanese', 'czech'].forEach(l => add(`interface/fonts_${l}.swf`, 210 + r() * 380));
  const keys = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'ls', 'rs', 'start', 'back', 'dpad', 'l-alt', 'r-alt', 'l-ctrl', 'r-ctrl', 'l-shift', 'r-shift', 'tab', 'esc', 'enter', 'space', 'up', 'down', 'left', 'right', 'home', 'end', 'pgup', 'pgdn', 'ins', 'del', 'caps', 'backspace', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'];
  for (const p of ['360_', 'ps3_', 'pc_', 'ps4_', 'xbone_', '']) for (const k of keys) add(`interface/exported/${p}${k}.png.dds`, 4.1);
  for (const c of ['skill', 'perk', 'magic', 'weapon', 'armor', 'misc']) for (let i = 1; i <= 12; i++) add(`interface/icons/${c}_${pad(i)}.dds`, i % 3 ? 16.2 : 64.4);
  return spread(out, 386);
}
function genFrostcoin() {
  const r = rng(5), out = [], add = (n, s, c = true) => out.push({ n, s, c });
  for (const [d, stems] of [['frostcoin/jarl', ['jarl', 'jarlgold', 'jarlsilver']], ['frostcoin/nchuark', ['nchuark', 'nchuarkcoinpile', 'nchuarkmoneybag']], ['frostcoin/mallari', ['mallari', 'mallarigold']], ['frostcoin/gibber', ['gibber', 'gibberdark', 'gibbergold']]])
    for (const s of stems) { add(`textures/${d}/${s}.dds`, Math.round((500 + r() * 3300) * 1024)); add(`textures/${d}/${s}_n.dds`, Math.round((150 + r() * 2000) * 1024)); }
  add('textures/frostcoin/frostcoin_m.dds', Math.round(766.9 * 1024)); add('textures/frostcoin/frostcoin_g.dds', Math.round(412.3 * 1024));
  add('textures/frostcoin/ledger_n.dds', Math.round(919.4 * 1024));
  return out.slice(0, 23);
}
function genTextures(N) {
  const r = rng(23), all = [];
  const T_ = [['terrain/tamriel', ['tamriel', 'mountain', 'grass', 'snow', 'dirt', 'rock', 'sand', 'tundra', 'ash', 'forestfloor', 'road', 'cobble', 'path']],
    ['architecture/whiterun', ['wrbuilding', 'wrhouse', 'wrplank', 'wrstone', 'wrroof', 'wrdoor', 'wrbeam', 'wrwall']],
    ['architecture/solitude', ['solbuilding', 'solwall', 'solroof', 'solcolumn', 'solgate', 'solarch']],
    ['landscape/rocks', ['cliff', 'boulder', 'rockface', 'basalt', 'slate', 'pebble']],
    ['landscape/trees', ['pinebark', 'birchbark', 'aspenleaf', 'pineneedle', 'fernleaf']],
    ['clutter/common', ['barrel', 'crate', 'sack', 'bucket', 'candle', 'basket']],
    ['actors/character/female', ['femalebody', 'femalehead', 'femalehands']]];
  for (let v = 1; v <= 10; v++) for (const [d, stems] of T_) for (const s of stems) for (const x of ['', '_n', '_m'])
    all.push({ n: `textures/${d}/${s}${v > 1 ? pad(v) : ''}${x}.dds`, s: SZ_DDS[Math.floor(r() * SZ_DDS.length)], c: true });
  return spread(all, N);
}
function genMain(N) {
  const r = rng(41), all = [];
  const G = [['meshes/architecture/outpost', ['wall', 'tower', 'gate', 'bridge', 'stair', 'floor', 'beam'], 'nif', 1, [18, 640]],
    ['meshes/actors/frostwolf', ['body', 'head', 'tail', 'jaw', 'skeleton'], 'nif', 1, [40, 920]],
    ['materials/architecture/outpost', ['wall', 'tower', 'gate', 'floor'], 'bgsm', 0, [0.6, 1.4]],
    ['sound/fx/ambient', ['wind', 'snowstep', 'icecrack', 'fire', 'water', 'cave'], 'xwm', 1, [90, 2400]],
    ['scripts', ['frostlinequest', 'wolfcontroller', 'outpostdoor', 'icecrackfx'], 'pex', 1, [3, 60]]];
  for (let v = 1; v <= 160; v++) for (const [d, stems, ext, c, [a, b]] of G) for (const s of stems)
    all.push({ n: `${d}/${s}_${pad(v)}.${ext}`, s: Math.round((a + r() * (b - a)) * 1024), c: !!c && r() > .2 });
  return spread(all, N);
}
function genSketchy() {
  const r = rng(3), out = [];
  ['iron', 'steel', 'orcish', 'elven', 'glass', 'dragonbone'].forEach(a => { out.push({ n: `meshes/armor/${a}/cuirass_0.nif`, s: Math.round((120 + r() * 400) * 1024), c: true }); out.push({ n: `textures/armor/${a}/cuirass.dds`, s: SZ_DDS[Math.floor(r() * 6)], c: true }); });
  out.push({ n: 'textures/armor/readme.txt', s: 1200, c: false }, { n: 'meshes/armor/shared/boots_1.nif', s: 220 * 1024, c: true }, { n: 'meshes/armor/shared/gauntlets_1.nif', s: 190 * 1024, c: true });
  out.splice(5, 0, { n: '../../../Library/LaunchAgents/com.helper.update.plist', s: 1536, c: false, bad: true });
  out.splice(11, 0, { n: '/etc/hosts', s: 2048, c: false, bad: true });
  return out;
}
const ARCHIVES = () => [
  { id: 'iface', name: 'Skyrim - Interface.bsa', kind: 'BSA', date: [T('7 nov. 2026', 'Nov 7, 2026')], gen: genInterface, chip: true },
  { id: 'coin', name: 'Frostcoin - Textures.bsa', kind: 'BSA', date: [T('9 nov. 2026', 'Nov 9, 2026')], gen: genFrostcoin, chip: true },
  { id: 'tex', name: 'Ancient Realms HD - Textures.bsa', kind: 'BSA', date: [T('2 nov. 2026', 'Nov 2, 2026')], gen: () => genTextures(1284), chip: true },
  { id: 'main', name: 'Frostline - Main.ba2', kind: 'BA2', date: [T('28 oct. 2026', 'Oct 28, 2026')], gen: () => genMain(3972) },
  { id: 'sketchy', name: 'Sketchy Patch Pack.bsa', kind: 'BSA', date: [T('5 nov. 2026', 'Nov 5, 2026')], gen: genSketchy },
  { id: 'broken', name: 'Broken Download.bsa', kind: 'BSA', date: [T('4 nov. 2026', 'Nov 4, 2026')], broken: true }
];
const FOLDERS = () => [
  { name: 'Desktop', label: T('Bureau', 'Desktop'), path: '~/Desktop' },
  { name: 'Downloads', label: T('Téléchargements', 'Downloads'), path: '~/Downloads' },
  { name: 'Documents', label: 'Documents', path: '~/Documents' },
  { name: 'Data', label: 'Skyrim Special Edition/Data', path: '~/Games/Skyrim Special Edition/Data' },
  { name: 'MO2', label: 'MO2/mods/Extracted', path: '~/Games/MO2/mods/Extracted' }
];
const bytesTxt = b => { const v = b / 1048576; return v >= 1024 ? (v / 1024).toFixed(1).replace('.', T(',', '.')) + T(' Go', ' GB') : (v >= 1 ? v.toFixed(1).replace('.', T(',', '.')) + T(' Mo', ' MB') : (b / 1024).toFixed(0) + T(' Ko', ' KB')); };
const KB = b => (b / 1024).toFixed(1).replace('.', T(',', '.')) + ' ' + T('Ko', 'KB');

/* ---------------------------- fenêtre ---------------------------- */
export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 920, h: 600, minw: 640, minh: 440, bare: true, cls: 'socle',
    onclose: w => { w.dead = true; w.ro && w.ro.disconnect(); }, build: w => build(app, w) });
}

function build(app, w) {
  const archives = ARCHIVES();
  let arch = null, rows = [], view = [], sort = { k: 'id', d: 1 }, st = { f: () => T('En attente', 'Waiting'), tone: '' };
  let busy = false, progress = 0, cur = -1, flagged = false, closeSheet = null, dragN = 0, token = 0;
  const alive = () => !w.dead && root.isConnected;

  /* --- squelette --- */
  const openBtn = h('button', { class: 'sbtn act sent', onclick: () => openPanel() }, '📦 ' + T('Ouvrir une archive (.bsa / .ba2)', 'Open an archive (.bsa / .ba2)'));
  const info = h('div', { class: 'bae-info' });
  const colDefs = [['n', T('Chemin du fichier', 'File path')], ['s', T('Taille brute', 'Raw size')], ['c', T('Type d’archive', 'Archive type')]];
  const colBtns = colDefs.map(([k, l]) => h('button', { 'aria-label': l, onclick: () => { sort = sort.k === k ? { k, d: -sort.d } : { k, d: 1 }; sfx.tick(); body.scrollTop = 0; resort(); } }, l, h('i', { class: 'ar' })));
  const cols = h('div', { class: 'bae-cols' }, colBtns);
  const spacer = h('div', { class: 'bae-spacer' }), rowsEl = h('div', { class: 'bae-rows' });
  spacer.append(rowsEl);
  const body = h('div', { class: 'bae-body', onscroll: () => paint() }, spacer);
  const tbl = h('div', { class: 'bae-tbl', 'data-drop': T('Déposez l’archive ici', 'Drop the archive here') }, cols, body);
  const barFill = h('i'), prog = h('div', { class: 'bae-prog', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, barFill);
  const stEl = h('div', { class: 'bae-st', 'aria-live': 'polite' });
  const extractBtn = h('button', { class: 'sbtn cap', onclick: () => destPanel() }, T('EXTRAIRE TOUT', 'EXTRACT ALL'));
  const main = h('div', { class: 'bae-main' }, h('div', { class: 'bae-top' }, openBtn, info), tbl, prog, h('div', { class: 'bae-bottom' }, stEl, extractBtn));
  const bar = h('div', { class: 'bae-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('mBAE', COLOR), style: { fontSize: '15px', letterSpacing: '.025em', color: 'var(--s-ts)', marginLeft: '6px' } }),
    h('span', { class: 'bae-sub' }, '– ' + T('Extracteur d’archives Bethesda', 'Bethesda archive extractor')), dlBtn(app));
  const root = h('div', { class: 'bae', tabindex: '-1' }, bar, main);

  /* état vide : invite à déposer une archive */
  const empty = h('div', { class: 'bae-empty' }, h('div', { class: 'bae-drop' },
    h('b', {}, T('Glissez-déposez une archive', 'Drag and drop an archive')),
    h('p', {}, T('sur la fenêtre, ou essayez une archive d’exemple :', 'onto the window, or try a sample archive:')),
    h('div', { class: 'bae-chips' }, archives.filter(a => a.chip).map(a => h('button', { class: 'bae-chip', draggable: 'true', title: a.name,
      ondragstart: e => { e.dataTransfer.setData('text/plain', 'bae:' + a.id); e.dataTransfer.effectAllowed = 'copy'; }, onclick: () => load(a) },
    '📦 ' + a.name.replace('.bsa', ''), h('small', {}, a.kind))))));
  tbl.append(empty);

  /* --- états --- */
  const typeLabel = c => `${arch ? arch.kind : ''} ` + (c ? T('(Comp)', '(Comp)') : T('(Brut)', '(Raw)'));
  const setSt = (f, tone = '') => { st = { f, tone }; stEl.textContent = f(); stEl.className = 'bae-st ' + tone; };
  const sync = () => {
    const has = !!arch;
    openBtn.disabled = busy; extractBtn.disabled = !has || busy;
    const amberOpen = !has;
    openBtn.className = 'sbtn sent ' + (amberOpen ? 'act' : '');
    extractBtn.className = 'sbtn cap ' + (has && !busy ? 'act' : '');
    info.textContent = has ? `${arch.name} — ${arch.kind} (${arch.files.length} ${T('fichiers', 'files')})` : T('Glissez-déposez une archive n’importe où ici.', 'Drag and drop an archive anywhere here.');
    empty.hidden = has;
    colBtns.forEach((b, i) => { b.querySelector('.ar').textContent = sort.k === colDefs[i][0] && sort.k !== 'id' ? (sort.d > 0 ? '▴' : '▾') : ''; b.setAttribute('aria-sort', sort.k === colDefs[i][0] && sort.k !== 'id' ? (sort.d > 0 ? 'ascending' : 'descending') : 'none'); });
    barFill.style.width = progress + '%'; prog.setAttribute('aria-valuenow', progress);
  };
  function resort() {
    view = rows.slice().sort((a, b) => ((sort.k === 'n' ? (a.n < b.n ? -1 : a.n > b.n ? 1 : 0) : (a[sort.k] === true ? 1 : a[sort.k] === false ? 0 : a[sort.k]) - (b[sort.k] === true ? 1 : b[sort.k] === false ? 0 : b[sort.k])) * sort.d) || a.id - b.id);
    sync(); paint();
  }
  function paint() {
    spacer.style.height = view.length * ROW + 'px';
    const top = body.scrollTop, vh = body.clientHeight || 360;
    const a = Math.max(0, Math.floor(top / ROW) - 4), b = Math.min(view.length, Math.ceil((top + vh) / ROW) + 4);
    rowsEl.style.transform = `translateY(${a * ROW}px)`;
    rowsEl.replaceChildren(...view.slice(a, b).map((r, j) => h('div', { class: 'bae-row' + ((a + j) % 2 ? ' odd' : '') + (r.id === cur ? ' cur' : '') + (flagged && r.bad ? ' bad' : '') },
      h('span', { title: r.n }, r.n), h('span', {}, KB(r.s)), h('span', {}, typeLabel(r.c)))));
    tbl.style.setProperty('--bae-sb', body.offsetWidth - body.clientWidth + 'px');
  }
  w.ro = new ResizeObserver(() => { if (alive()) paint(); else w.ro.disconnect(); }); w.ro.observe(body);

  /* --- ouverture d'une archive --- */
  function load(a) {
    if (busy) return; closeSheet && closeSheet(); sfx.click(); token++;
    if (a.broken) { arch = null; rows = []; view = []; progress = 0; cur = -1; paint(); sync(); setSt(() => T('Erreur : Archive corrompue : table des dossiers tronquée.', 'Error: Corrupted archive: folder table truncated.'), 'dg'); sfx.close(); return; }
    arch = { ...a, files: a.gen() }; flagged = false; cur = -1; progress = 0; sort = { k: 'id', d: 1 };
    rows = arch.files.slice(0, MAXROWS).map((f, i) => ({ id: i, n: f.n, s: f.s, c: f.c, bad: !!f.bad }));
    body.scrollTop = 0; resort(); setSt(() => T('Prêt pour l’extraction.', 'Ready to extract.'));
    sfx.open();
  }

  /* --- extraction --- */
  async function extract(dest) {
    if (!arch || busy) return; busy = true; progress = 0; flagged = false; const my = ++token; setSt(st.f, ''); sync();
    const n = arch.files.length, bad = arch.files.filter(f => f.bad).length, dur = reduced() ? 0 : clamp(1700 + n * 1.1, 1700, 5200);
    const t0 = performance.now(); let lastTick = -1;
    await new Promise(res => {
      const step = now => {
        if (!alive() || my !== token) return res();
        const k = dur ? clamp((now - t0) / dur, 0, 1) : 1, e = k < .6 ? k * 0.95 : k < .68 ? .57 + (k - .6) * 0.2 : .586 + (k - .68) / .32 * .414;
        progress = k >= 1 ? 100 : Math.min(99, Math.floor(e * 100)); cur = k >= 1 ? -1 : Math.min(n - 1, Math.floor(e * n));
        barFill.style.width = progress + '%'; prog.setAttribute('aria-valuenow', progress);
        if (sort.k === 'id' && sort.d === 1 && cur >= 0 && cur < rows.length) body.scrollTop = clamp(cur * ROW - body.clientHeight / 2, 0, Math.max(0, view.length * ROW - body.clientHeight));
        paint();
        if (progress !== lastTick && progress % 6 === 0) { lastTick = progress; sfx.tick(); }
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    if (!alive() || my !== token) return;
    busy = false; progress = 100; cur = -1; flagged = bad > 0;
    setSt(() => bad ? T(`Extraction terminée : ${n - bad} fichiers extraits (${bad} ignorés : chemin non sûr).`, `Extraction complete: ${n - bad} files extracted (${bad} skipped: unsafe path).`) : T(`Extraction terminée : ${n} fichiers extraits.`, `Extraction complete: ${n} files extracted.`), 'ok');
    sync(); paint(); sfx.done();
    toast({ icon: icon('mBAE'), title: 'mBAE', body: T(`${n - bad} fichiers dans ${dest.path}`, `${n - bad} files in ${dest.path}`) });
  }

  /* --- feuilles : ouvrir une archive, choisir la destination (look NSOpenPanel) --- */
  function sheet(build) {
    closeSheet && closeSheet();
    const scrim = h('div', { class: 'bae-scrim' }), panel = h('div', { class: 'bae-sheet', role: 'dialog', 'aria-modal': 'true' });
    scrim.append(panel); root.append(scrim); main.inert = true;
    const close = () => { if (!scrim.isConnected) return; scrim.remove(); if (closeSheet === close) { closeSheet = null; main.inert = false; root.focus({ preventScroll: true }); } };
    closeSheet = close; build(panel, close);
    if (!reduced()) panel.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    return close;
  }
  /* liste sélectionnable : le focus reste sur la ligne cliquée (pas de redessin), flèches et Entrée comme dans un panneau macOS */
  const reveal = el => { const l = el.parentElement; if (!l) return; if (el.offsetTop < l.scrollTop + 28) l.scrollTop = Math.max(0, el.offsetTop - 28); else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight; };
  function selectable(p, items, make, onPick, getSel, setSel) {
    const btns = items.map(make);
    const apply = () => btns.forEach((b, i) => { const on = items[i] === getSel(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    btns.forEach((b, i) => { if (items[i].off) return; b.onclick = () => { setSel(items[i]); sfx.tick(); apply(); }; b.ondblclick = () => onPick(items[i]); });
    p.tabIndex = -1;
    p.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'Enter') { if (e.target.closest('.sbtn')) return; e.preventDefault(); onPick(getSel()); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); const ok = items.filter(x => !x.off), i = clamp(ok.indexOf(getSel()) + (e.key === 'ArrowDown' ? 1 : -1), 0, ok.length - 1);
        setSel(ok[i]); sfx.tick(); apply(); const nb = btns[items.indexOf(ok[i])]; nb.focus({ preventScroll: true }); reveal(nb);
      }
    });
    apply(); return btns;
  }
  function openPanel() {
    if (busy) return; sfx.click();
    sheet((p, close) => {
      let sel = archives[1];
      const items = [...archives, { off: true, name: 'readme.txt' }];
      const make = a => a.off
        ? h('button', { class: 'bae-li', disabled: true }, h('span', {}, '📄 readme.txt'), h('span', { class: 'mu' }, T('1 nov. 2026', 'Nov 1, 2026')), h('span', { class: 'mu' }, '2 ' + T('Ko', 'KB')), h('span', { class: 'mu' }, T('Texte brut', 'Plain text')))
        : h('button', { class: 'bae-li' }, h('span', {}, '📦 ' + a.name), h('span', { class: 'mu' }, a.date[0]), h('span', { class: 'mu' }, a.broken ? '812 ' + T('Ko', 'KB') : bytesTxt(a.size ??= a.gen().reduce((s, f) => s + (f.c ? f.s * 0.55 : f.s), 0))), h('span', { class: 'mu' }, T('Archive Bethesda', 'Bethesda archive')));
      const btns = selectable(p, items, make, a => a && load(a), () => sel, a => { sel = a; });
      const list = h('div', { class: 'bae-list', style: { maxHeight: '300px' } },
        h('div', { class: 'bae-li hd' }, h('span', {}, T('NOM', 'NAME')), h('span', {}, T('DATE', 'DATE MODIFIED')), h('span', {}, T('TAILLE', 'SIZE')), h('span', {}, T('TYPE', 'KIND'))), btns);
      p.append(h('div', {}, h('h4', {}, T('Sélectionner une archive Bethesda', 'Select a Bethesda archive')), h('p', { class: 'msg' }, T('Archives Bethesda', 'Bethesda archives') + ' (*.bsa *.ba2)')),
        h('div', { class: 'bae-path' }, '~/Downloads'), list,
        h('div', { class: 'bae-acts' }, h('button', { class: 'sbtn sm sent', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn sm sent acc', onclick: () => load(sel) }, T('Ouvrir', 'Open'))));
      setTimeout(() => p.focus({ preventScroll: true }), 30);
    });
  }
  function destPanel() {
    if (!arch || busy) return; sfx.click();
    sheet((p, close) => {
      const items = FOLDERS(); let sel = items[0], naming = false;
      const pick = f => { if (naming) return; close(); extract(f || sel); };
      const make = f => h('button', { class: 'bae-li fold' }, h('span', {}, '📁 ' + f.label), h('span', { class: 'mu' }, f.path));
      const btns = selectable(p, items, make, pick, () => sel, f => { sel = f; });
      const list = h('div', { class: 'bae-list', style: { maxHeight: '260px' } }, btns);
      const newFolder = () => {
        if (naming) return; naming = true; sfx.pop();
        const inp = h('input', { value: T('dossier sans titre', 'untitled folder'), 'aria-label': T('Nom du dossier', 'Folder name') });
        const row = h('div', { class: 'bae-li fold on' }, h('span', { class: 'nf' }, '📁', inp)); list.append(row); list.scrollTop = list.scrollHeight; inp.focus({ preventScroll: true }); inp.select();
        const done = ok => {
          if (!naming) return; naming = false; row.remove();
          if (ok && inp.value.trim()) { const f = { label: inp.value.trim(), path: sel.path.replace(/\/[^/]*$/, '') + '/' + inp.value.trim() }; items.push(f); const b = make(f); list.append(b); btns.push(b); b.onclick = () => { sel = f; sfx.tick(); btns.forEach((x, i) => x.classList.toggle('on', items[i] === sel)); }; b.ondblclick = () => pick(f); sel = f; btns.forEach((x, i) => x.classList.toggle('on', items[i] === sel)); }
          p.focus({ preventScroll: true });
        };
        inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); }; inp.onblur = () => done(true);
      };
      p.append(h('div', {}, h('h4', {}, T('Choisir le dossier de destination', 'Choose the destination folder')), h('p', { class: 'msg' }, T('Les sous-dossiers de l’archive sont conservés.', 'The folder structure of the archive is preserved.'))),
        list, h('div', { class: 'bae-acts' }, h('button', { class: 'sbtn sm sent sp', onclick: newFolder }, T('Nouveau dossier', 'New folder')), h('button', { class: 'sbtn sm sent', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn sm sent acc', onclick: () => pick() }, T('Choisir', 'Choose'))));
      setTimeout(() => p.focus({ preventScroll: true }), 30);
    });
  }

  /* --- glisser-déposer et raccourcis --- */
  root.addEventListener('dragenter', e => { if (busy || closeSheet) return; e.preventDefault(); dragN++; root.classList.add('dragging'); });
  root.addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) root.classList.remove('dragging'); });
  root.addEventListener('dragover', e => { if (busy || closeSheet) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  root.addEventListener('dragend', () => { dragN = 0; root.classList.remove('dragging'); });
  root.addEventListener('drop', e => {
    e.preventDefault(); dragN = 0; root.classList.remove('dragging'); if (busy || closeSheet) return;
    const t = e.dataTransfer.getData('text/plain'), a = archives.find(x => 'bae:' + x.id === t);
    if (a) return load(a);
    if (e.dataTransfer.files.length) toast({ icon: icon('mBAE'), title: 'mBAE', body: T('Démo : aucun fichier de votre ordinateur n’est lu. Choisissez une archive d’exemple.', 'Demo: no file from your computer is read. Pick a sample archive.') });
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && closeSheet) { e.preventDefault(); closeSheet(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') { e.preventDefault(); openPanel(); }
  });

  sync(); setSt(st.f); paint();
  setTimeout(() => root.isConnected && root.focus({ preventScroll: true }), 60);
  return root;
}
