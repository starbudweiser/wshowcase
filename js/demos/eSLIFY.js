/* Réplique interactive de eSLIFY (interface Socle) : ajouter des plugins ou un dossier, lire l'éligibilité ESL de chacun, marquer ceux qui peuvent l'être.
   Les plugins sont des exemples fictifs : aucun fichier n'est lu. Les règles d'éligibilité sont celles de l'appli (FormID propres entre 0x800 et 0xFFF, en-tête 1.71, cellules, dépendants). */
import { h, brand, T, wm, sfx, icon, toast, css } from './kit.js';
import { setLang, lang } from '../i18n.js';

const DIRS = { new: '/Users/Shared/Skyrim/Mods/New plugins', data: '/Users/Shared/Skyrim/Skyrim Special Edition/Data' };
const DIR_LABEL = { new: 'New plugins', data: 'Data' };
/* nom, dossier, déjà ESL, nouveaux enregistrements, FormID min, FormID max, version d'en-tête, maîtres, nouvelles cellules, dépendants */
const FILES = [
  ['Audio Overhaul Skyrim.esp', 'new', 0, 497, 0x800, 0x693A5, 1.7, 5, 0, []],
  ['PAN_NPCs.esp', 'new', 0, 174, 0xD6B, 0x7464, 1.7, 3, 0, []],
  ['PAN_NPCs_DB.esp', 'new', 0, 74, 0x36C9, 0x2C1F, 1.7, 2, 0, []],
  ['Project Proteus.esp', 'new', 0, 1077, 0xD62, 0x2A3F, 1.7, 4, 0, []],
  ['SMIM-SE-Merged-All.esp', 'new', 0, 33, 0xD62, 0xAA05, 1.7, 1, 0, []],
  ['SMPClothing.esp', 'new', 0, 0, null, null, 1.71, 1, 0, []],
  ['Seasonal Weathers Framework.esp', 'new', 0, 78, 0x800, 0x19D4, 1.7, 2, 0, []],
  ['Ryn’s Karthspire Cloak.esp', 'new', 0, 12, 0x800, 0x80B, 1.71, 2, 0, []],
  ['Frostfall Hunters Patch.esp', 'new', 0, 45, 0x800, 0x82C, 1.71, 3, 0, []],
  ['Immersive Laundry.esp', 'new', 0, 22, 0x800, 0x815, 1.71, 1, 2, []],
  ['Old Compact Patch.esp', 'new', 0, 9, 0x7F0, 0x7F8, 1.7, 2, 0, []],
  ['Aetherius.esp', 'new', 1, 73, 0x800, 0x848, 1.71, 2, 0, []],
  ['Dawnguard.esm', 'data', 0, 93440, 0x800, 0x1AA3F2, 1.7, 1, 412, []],
  ['Dragonborn.esm', 'data', 0, 178327, 0x800, 0x3D5A19, 1.7, 1, 1203, []],
  ['ccBGSSSE037-Curios.esl', 'data', 1, 0, null, null, 1.71, 1, 0, []],
  ['ccQDRSSE001-SurvivalMode.esl', 'data', 1, 38, 0x800, 0x82B, 1.71, 1, 0, []],
  ['Dragon Rework Patch.esp', 'data', 0, 64, 0x800, 0x83F, 1.71, 2, 0, ['Dragon Rework - Hotfix.esp', 'Dragon Rework - Extras.esp']],
  ['Companions Dialogue Bundle.esp', 'data', 1, 193, 0x800, 0x8C0, 1.71, 2, 0, []],
  ['Ascend - Hidden Peaks of Skyrim.esp', 'data', 1, 766, 0x800, 0xDEE, 1.71, 3, 0, []],
  ['Bounty Hunter - Missives + SRC Patch.esp', 'data', 1, 0, null, null, 1.71, 2, 0, []],
  ['Evolving Locations - Lucky Shack.esp', 'data', 1, 308, 0x001, 0x134, 1.71, 2, 0, []],
  ['Warmer Hearth.esp', 'data', 0, 31, 0x800, 0x81E, 1.71, 1, 0, []]
].map(([n, d, esl, rec, lo, hi, ver, m, cells, deps]) => ({ n, d, esl: !!esl, rec, lo, hi, ver, m, cells, deps, id: d + '/' + n }));

const hx = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');
const pyFloat = v => (Number.isInteger(v) ? v.toFixed(1) : String(v));
const span = f => (f.lo == null ? '—' : `${hx(f.lo, 3)} – ${hx(f.hi, 3)}`);
const eligible = f => !f.esl && !f.cells && !(f.hi > 0xFFF) && !(f.lo != null && f.lo < 0x800 && f.ver < 1.71);
const statusOf = f => (f.esl ? T('Déjà ESL', 'Already ESL') : eligible(f) ? T('Éligible', 'Eligible') : T('Non éligible', 'Not eligible'));
const statusCls = f => (f.esl ? 'mut' : eligible(f) ? (f.deps.length ? 'wn' : 'ok') : 'dg');
const byCode = (a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : 0);

/* Verdict d'un plugin, dans l'ordre de vérification de l'appli. */
function reason(f) {
  if (f.esl) return T('Déjà marqué ESL.', 'Already flagged ESL.');
  if (f.cells) return T(`Ajoute ${f.cells} cellule(s) ou worldspace(s) : le jeu gère mal les nouvelles cellules d’un plugin ESL (modifications perdues, objets qui disparaissent).`, `Adds ${f.cells} cell(s) or worldspace(s): the game handles new cells in an ESL plugin badly (lost changes, disappearing objects).`);
  if (f.hi > 0xFFF) return T(`FormID propre trop élevé (${hx(f.hi, 6)} > FFF). Compactez les FormID dans xEdit avant de le marquer ESL.`, `Own FormID too high (${hx(f.hi, 6)} > FFF). Compact the FormIDs in xEdit before flagging it ESL.`);
  if (f.lo != null && f.lo < 0x800 && f.ver < 1.71) return T(`FormID propre sous 0x800 (${hx(f.lo, 6)}) avec un en-tête ${pyFloat(f.ver)} : il faut un en-tête 1.71 (xEdit) pour que le jeu l’accepte.`, `Own FormID below 0x800 (${hx(f.lo, 6)}) with header ${pyFloat(f.ver)}: the game needs a 1.71 header (xEdit) to accept it.`);
  if (f.deps.length) { const names = f.deps.slice(0, 3).join(', ') + (f.deps.length > 3 ? '…' : ''); return T(`Éligible, mais ${f.deps.length} plugin(s) en dépendent (${names}) : ne compactez plus ses FormID après le marquage, ils casseraient.`, `Eligible, but ${f.deps.length} plugin(s) depend on it (${names}): do not compact its FormIDs after flagging, they would break.`); }
  return T('Éligible.', 'Eligible.');
}

/** Feuille modale plate au-dessus de la fenêtre (Échap ferme, Tab reste dans la feuille). */
function sheet(root, { title, body, foot, width = 440, label }) {
  const prev = document.activeElement;
  const card = h('div', { class: 'x-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'eSLIFY', style: { width: width + 'px' } }, title ? h('div', { class: 'x-st' }, title) : null, body, foot ? h('div', { class: 'x-sf' }, foot) : null);
  const back = h('div', { class: 'x-back' }, card);
  const close = () => { back.remove(); const f = prev && prev.isConnected && prev !== document.body ? prev : root; f.focus({ preventScroll: true }); };
  back.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button:not(:disabled),input,select')]; if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus({ preventScroll: true }); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus({ preventScroll: true }); e.preventDefault(); }
    }
  });
  root.append(back);
  (card.querySelector('.acc:not(:disabled)') || card.querySelector('input,select') || card.querySelector('button')).focus({ preventScroll: true });
  return { close, card };
}

export function open(app) {
  css('css/demos/eSLIFY.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 900, h: 600, minw: 640, minh: 460, bare: true, cls: 'socle', onclose: w => { w.dead = true; },
    build: w => {
      let rows = [], sel = new Set(), anchor = null, backup = true, msg = { text: '', tone: '' };
      const known = () => new Set(rows.map(r => r.id));
      const root = h('div', { class: 'eslify', tabindex: '-1' });
      const hint = () => T('Ajoutez ou glissez-déposez des fichiers .ESP, .ESM, .ESL ou un dossier.', 'Add or drag and drop .ESP, .ESM, .ESL files or a folder.');
      const msgEl = h('p', { class: 'e-msg', 'aria-live': 'polite' });
      const rowsEl = h('div', { class: 'e-rows', role: 'grid' });
      const table = h('div', { class: 'e-table' }, rowsEl);
      const flagBtn = h('button', { class: 'sbtn acc', onclick: () => askFlag() });
      const addBtn = h('button', { class: 'sbtn act', onclick: () => pickFiles() }, T('Ajouter des plugins', 'Add plugins'));
      const chk = h('button', { class: 'e-chk', role: 'checkbox', 'aria-checked': 'true', onclick: () => { backup = !backup; sfx.tick(); drawChk(); } });
      const drawChk = () => { chk.setAttribute('aria-checked', backup); chk.replaceChildren(h('span', { class: 'cb' + (backup ? ' on' : '') }, backup ? '✓' : ''), T('Créer une copie de sauvegarde (.bak) avant modification', 'Create a backup copy (.bak) before modifying')); };
      const langBtns = ['fr', 'en'].map(l => h('button', { class: lang() === l ? 'on' : '', 'aria-pressed': lang() === l, onclick: () => setLang(l) }, l.toUpperCase()));
      root.append(
        h('div', { class: 'e-tb', 'data-drag': '' }, wm.lights(w), h('div', { class: 'e-tt', html: brand(app.id, app.accent) })),
        h('div', { class: 'e-body' },
          h('div', { class: 'e-head' }, h('div', {}, h('b', { html: brand(app.id, app.accent) }), h('small', {}, T('Marque des plugins comme ESL (light master) après avoir vérifié leurs FormID.', 'Flags plugins as ESL (light master) after checking their FormIDs.'))), h('div', { class: 'e-lang', role: 'group', 'aria-label': T('Langue', 'Language') }, langBtns)),
          h('div', { class: 'e-btns' }, addBtn, h('button', { class: 'sbtn', onclick: () => pickFolder() }, T('Ajouter un dossier', 'Add a folder')), h('button', { class: 'sbtn', onclick: () => clearList() }, T('Vider la liste', 'Clear list'))),
          table, msgEl, h('div', { class: 'e-foot' }, chk, flagBtn)));

      const targets = () => (sel.size ? rows.filter(r => sel.has(r.id)) : rows).filter(eligible);
      const setMsg = (text, tone = '') => { msg = { text, tone }; msgEl.textContent = text; msgEl.className = 'e-msg ' + tone; };
      const drawFlag = () => { const n = targets().length; flagBtn.textContent = T('MARQUER ESL', 'FLAG ESL') + (n ? ` (${n})` : ''); flagBtn.disabled = !n; };
      const paintSel = () => rowsEl.querySelectorAll('.e-r').forEach((el, i) => { const on = sel.has(rows[i].id); el.classList.toggle('on', on); el.setAttribute('aria-selected', on); });
      const selMsg = () => {
        if (sel.size === 1) { const f = rows.find(r => sel.has(r.id)); setMsg(T(`${f.n} : ${reason(f)}`, `${f.n}: ${reason(f)}`) + '  ' + T(`En-tête ${pyFloat(f.ver)}, ${f.m} maître(s).`, `Header ${pyFloat(f.ver)}, ${f.m} master(s).`)); }
        else if (sel.size > 1) setMsg(T(`${sel.size} plugins sélectionnés.`, `${sel.size} plugins selected.`));
        else setMsg(hint());
      };
      const changed = () => { paintSel(); selMsg(); drawFlag(); };

      function draw(fresh = new Set(), flash = new Set()) {
        rowsEl.replaceChildren(h('div', { class: 'e-th', role: 'row' }, ...[T('Plugin', 'Plugin'), T('Statut', 'Status'), T('Nouveaux enr.', 'New records'), T('FormID propres', 'Own FormIDs'), T('Dossier', 'Folder')].map(x => h('span', { role: 'columnheader' }, x))));
        let k = 0;
        rows.forEach(f => {
          const r = h('div', { class: 'e-r' + (sel.has(f.id) ? ' on' : '') + (flash.has(f.id) ? ' flash' : fresh.has(f.id) ? '' : ' off'), role: 'row', 'aria-selected': sel.has(f.id), 'data-id': f.id, style: fresh.has(f.id) ? { '--d': Math.min(k++ * 36, 700) + 'ms' } : null },
            h('span', { title: f.n }, f.n), h('span', { class: 'st ' + statusCls(f) }, statusOf(f)), h('span', { class: 'm' }, String(f.rec)), h('span', { class: 'm' }, span(f)), h('span', { class: 'f', title: DIRS[f.d] }, DIRS[f.d]));
          rowsEl.append(r);
        });
        table.querySelector('.e-empty')?.remove();
        if (!rows.length) {
          const sample = h('button', { class: 'e-link', onclick: () => { addFiles(FILES.filter(f => f.d === 'new')); } }, T('Pas de plugins sous la main ? Essayez le dossier d’exemple.', 'No plugins at hand? Try the sample folder.'));
          table.append(h('div', { class: 'e-empty' }, h('img', { src: icon(app.id), alt: '' }), h('p', {}, hint()), sample));
        }
        drawFlag();
      }
      function addFiles(list) {
        const k = known(), add = list.filter(f => !k.has(f.id)).sort(byCode); if (!add.length) return setMsg(T('Ces plugins sont déjà dans la liste.', 'These plugins are already in the list.'));
        rows = rows.concat(add); sel.clear(); addBtn.classList.remove('pulse');
        draw(new Set(add.map(f => f.id))); setMsg(hint()); sfx.pop(); rowsEl.scrollTop = 0;
      }
      function clearList() { if (!rows.length && !sel.size) return; rows = []; sel.clear(); anchor = null; draw(); setMsg(hint()); sfx.click(); }

      rowsEl.addEventListener('click', e => {
        const el = e.target.closest('.e-r'); if (!el) return;
        const i = rows.findIndex(r => r.id === el.dataset.id); if (i < 0) return;
        if (e.shiftKey && anchor != null) { const [a, b] = [Math.min(anchor, i), Math.max(anchor, i)]; sel = new Set(rows.slice(a, b + 1).map(r => r.id)); }
        else if (e.metaKey || e.ctrlKey) { sel.has(rows[i].id) ? sel.delete(rows[i].id) : sel.add(rows[i].id); anchor = i; }
        else { sel = new Set([rows[i].id]); anchor = i; }
        sfx.tick(); changed();
      });

      /* Feuille « Ouvrir » : liste d'exemples à cocher (remplace le sélecteur de fichiers de macOS). */
      function pickFiles() {
        let dir = 'new'; const ch = new Set(); const list = h('div', { class: 'x-list' });
        const selEl = h('select', { class: 'x-sel', 'aria-label': T('Dossier', 'Folder'), onchange: e => { dir = e.target.value; ch.clear(); redraw(); } }, Object.keys(DIRS).map(d => h('option', { value: d }, DIR_LABEL[d])));
        const ok = h('button', { class: 'sbtn acc', disabled: true, onclick: () => { const add = FILES.filter(f => ch.has(f.id)); s.close(); addFiles(add); } }, T('Ouvrir', 'Open'));
        const redraw = () => {
          list.replaceChildren(...FILES.filter(f => f.d === dir).sort(byCode).map(f => h('button', { class: 'x-li', role: 'checkbox', 'aria-checked': ch.has(f.id), onclick: () => { ch.has(f.id) ? ch.delete(f.id) : ch.add(f.id); sfx.tick(); redraw(); } },
            h('span', { class: 'cb' + (ch.has(f.id) ? ' on' : '') }, ch.has(f.id) ? '✓' : ''), h('span', { class: 'n' }, f.n), known().has(f.id) ? h('small', {}, T('déjà listé', 'already listed')) : null)));
          ok.disabled = !ch.size; ok.textContent = T('Ouvrir', 'Open') + (ch.size ? ` (${ch.size})` : '');
        };
        const all = h('button', { class: 'e-link', onclick: () => { const here = FILES.filter(f => f.d === dir); const full = here.every(f => ch.has(f.id)); here.forEach(f => (full ? ch.delete(f.id) : ch.add(f.id))); sfx.tick(); redraw(); } }, T('Tout sélectionner', 'Select all'));
        const s = sheet(root, { title: T('Ajouter des plugins', 'Add plugins'), width: 520,
          body: h('div', { class: 'x-sb' }, h('span', { class: 'mut' }, T('Plugins Skyrim', 'Skyrim plugins') + ' (*.esp *.esm *.esl)'), h('div', { class: 'x-row' }, selEl, all), list),
          foot: [h('span', { class: 'x-note' }, T('Fichiers d’exemple : rien n’est lu sur votre ordinateur.', 'Sample files: nothing is read from your computer.')), h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), ok] });
        redraw();
      }
      function pickFolder() {
        let dir = 'new';
        const list = h('div', { class: 'x-list' }), drawList = () => list.replaceChildren(...Object.keys(DIRS).map(d => h('button', { class: 'x-li', role: 'radio', 'aria-checked': dir === d, onclick: () => { dir = d; sfx.tick(); drawList(); } },
          h('span', { class: 'rd' + (dir === d ? ' on' : '') }), h('span', { class: 'n' }, DIRS[d]), h('small', {}, T(`${FILES.filter(f => f.d === d).length} plugins`, `${FILES.filter(f => f.d === d).length} plugins`)))));
        const s = sheet(root, { title: T('Ajouter un dossier', 'Add a folder'), width: 560,
          body: h('div', { class: 'x-sb' }, h('span', { class: 'mut' }, T('Les plugins du dossier sont ajoutés (sans ses sous-dossiers).', 'The folder’s plugins are added (not its subfolders).')), list),
          foot: [h('span', { class: 'x-note' }, T('Dossiers d’exemple : rien n’est lu sur votre ordinateur.', 'Sample folders: nothing is read from your computer.')), h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { s.close(); addFiles(FILES.filter(f => f.d === dir)); } }, T('Ouvrir', 'Open'))] });
        drawList();
      }

      /* Confirmation (alerte), puis marquage. */
      function askFlag() {
        const todo = targets(); if (!todo.length) return;
        const first = todo.slice(0, 15).map(f => f.n).join('\n') + (todo.length > 15 ? '\n…' : '');
        const yes = h('button', { class: 'sbtn acc', onclick: () => { s.close(); apply(todo); } }, T('Oui', 'Yes'));
        const s = sheet(root, { width: 440, label: 'eSLIFY',
          body: h('div', { class: 'x-al' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('b', {}, T(`Marquer ${todo.length} plugin(s) comme ESL ?`, `Flag ${todo.length} plugin(s) as ESL?`)), h('p', { style: { whiteSpace: 'pre-line' } }, first),
            h('p', {}, backup ? T('Une copie .bak de chaque fichier est créée avant modification.', 'A .bak copy of each file is created before modifying it.') : T('Aucune copie de sauvegarde ne sera créée.', 'No backup copy will be created.')))),
          foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Non', 'No')), yes] });
      }
      function apply(todo) {
        const ids = new Set(todo.map(f => f.id));
        todo.forEach(f => { f.esl = true; });
        sel = new Set(); anchor = null; draw(new Set(), ids);
        setMsg(T(`${todo.length} plugin(s) marqué(s) ESL.`, `${todo.length} plugin(s) flagged ESL.`), 'ok'); sfx.done();
        toast({ icon: icon(app.id), title: app.id, body: T(`${todo.length} plugin(s) marqué(s) ESL.`, `${todo.length} plugin(s) flagged ESL.`) + (backup ? ' ' + T('Copies .bak créées.', '.bak copies created.') : '') });
      }

      /* Clavier : ↑ ↓ pour parcourir, ⌘A pour tout sélectionner. */
      root.addEventListener('keydown', e => {
        if (root.querySelector(':scope > .x-back') || e.target.closest('input,select')) return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); sel = new Set(rows.map(r => r.id)); changed(); }
        else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && rows.length && e.target.closest('.e-rows')) {
          e.preventDefault(); const cur = rows.findIndex(r => sel.has(r.id)), i = Math.max(0, Math.min(rows.length - 1, (cur < 0 ? (e.key === 'ArrowDown' ? -1 : rows.length) : cur) + (e.key === 'ArrowDown' ? 1 : -1)));
          sel = new Set([rows[i].id]); anchor = i; changed(); const el = rowsEl.children[i + 1]; if (el) { const t = el.offsetTop, b = t + el.offsetHeight; if (t < rowsEl.scrollTop + 32) rowsEl.scrollTop = t - 32; else if (b > rowsEl.scrollTop + rowsEl.clientHeight) rowsEl.scrollTop = b - rowsEl.clientHeight; }
        }
      });
      rowsEl.tabIndex = 0; rowsEl.setAttribute('aria-label', T('Plugins', 'Plugins'));
      /* Dépôt de fichiers du bureau : l'appli le gère, la démo explique qu'elle ne lit rien. */
      table.addEventListener('dragover', e => { e.preventDefault(); table.classList.add('drag'); });
      table.addEventListener('dragleave', () => table.classList.remove('drag'));
      table.addEventListener('drop', e => { e.preventDefault(); table.classList.remove('drag'); setMsg(T('Cette démo ne lit aucun fichier : utilisez « Ajouter des plugins » pour essayer avec des exemples.', 'This demo reads no file: use “Add plugins” to try with samples.')); });

      drawChk(); setMsg(hint()); draw(); addBtn.classList.add('pulse');
      return root;
    } });
}
