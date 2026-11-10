/* Réplique interactive de qNOTES (interface Socle) : notes en texte enrichi (barre de format, mini-barre sur la sélection, puces intelligentes, séparateurs,
   compteurs), liste réordonnable, volet rapide dans la barre des menus (point blanc), réglages. Les notes vivent en mémoire : rien n'est lu, rien n'est envoyé. */
import { S, emit } from '../core.js';
import { h, $, T, sfx, toast, wm, bar, icon as appIcon, clamp } from './kit.js';
import { cssReady, SVG, macMenu, closeMenus, menuOpenFor, sheet, aboutWin, hotLabel, hotMatch, hotFrom, bhtml } from './mLINKS.js';

const ID = 'qNOTES', BRAND = '#bf5af2', CSS2 = 'css/demos/qNOTES.css';
const COLORS = ['FFC71A', 'FF851A', 'F5423D', '9E4DDB', '337AF5', '1AB3CC', '33BD4D'];
const BULLETS = ['-', '•', '▸', '–', '→', '◦'], BSET = '-*+•▸–→◦';
const SEPS = ['────────────────────', '— — — — — —', '• • •', '⁂', '***', '========================'];
const FONTS_ = () => [['', T('Système (SF Pro)', 'System (SF Pro)')], ['Helvetica Neue', 'Helvetica Neue'], ['Avenir Next', 'Avenir Next'], ['Georgia', 'Georgia'], ['Palatino', 'Palatino'], ['Menlo', 'Menlo']];
const P = { size: 16, smart: true, glyph: '•', sep: SEPS[0], font: '', mono: false, translucent: false, onTop: false, sync: false, backups: true, auto: true, display: 'both', hotkey: true, dots: false, login: false, backupOpen: false };

/* ====================================================================== données ====================================================================== */
let NOTES = null, SEL = null, QUERY = '', uidN = 0, running = false, extra = null, PANEL = null, hotOn = null, BACKS = null, FLASH = null;
const views = new Set(), eds = new Set();
const uid = () => 'q' + (++uidN);
const ago = (d, hh, mm) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(hh, mm, 0, 0); return x; };
const L = (s, d = 0) => `<div>${s}</div>`;
function seed() {
  const col = (c, s) => `<span style="color: #${c};">${s}</span>`;
  const N = (html, i, o = {}) => ({ id: uid(), html, text: '', created: ago(8 - i, 9, 0), modified: ago(i === 0 ? 0 : i, 9 + i, 20), pinned: false, order: i, ...o });
  const lst = [
    N(`<h1>${T('Bienvenue dans ', 'Welcome to ')}<span style="color: ${BRAND};">q</span>NOTES</h1>` + L(T('Écrivez, mettez en forme, tout est enregistré tout de suite.', 'Write, format, everything is saved right away.')) + L('')
      + L(T(`Sélectionnez ce mot : une <b>mini-barre</b> apparaît, avec les ${col('F5423D', 'couleurs')}.`, `Select this word: a <b>mini toolbar</b> appears, with the ${col('F5423D', 'colors')}.`)) + L('')
      + L(T('☐ Tapez <i>- </i> pour une puce, <i>[]</i> pour une tâche', '☐ Type <i>- </i> for a bullet, <i>[]</i> for a task')) + L(T('☑ Un clic sur la case la coche', '☑ A click on the box checks it')) + L('')
      + L(T('Tapez <b>---</b> puis Retour : la ligne devient un séparateur.', 'Type <b>---</b> then Return: the line becomes a separator.')), 0, { pinned: true, modified: ago(0, 8, 40) }),
    N(`<h1>${T('Courses', 'Groceries')}</h1>` + L(T('☑ Pain complet', '☑ Whole-grain bread')) + L(T('☐ Café en grains', '☐ Coffee beans')) + L(T('☐ Citrons', '☐ Lemons')) + L(T('☐ Piles AAA', '☐ AAA batteries')), 1),
    N(`<h1>${T('Idées de la semaine', 'Ideas for the week')}</h1><h2>${T('Site', 'Site')}</h2>` + L(T('• Refaire la page d’accueil', '• Rebuild the home page')) + L(T('• Tester le <b>mode sombre</b>', '• Try the <b>dark mode</b>'))
      + `<h2>${T('Maison', 'Home')}</h2>` + L(T(`• ${col('FF851A', 'Peindre')} le couloir`, `• ${col('FF851A', 'Paint')} the hallway`)) + L(T('• Voir <a href="https://example.com">le devis</a>', '• See <a href="https://example.com">the quote</a>')), 2),
    N(`<h1>${T('Réunion du jeudi', 'Thursday meeting')}</h1>` + L(T('1. Budget du trimestre', '1. Quarterly budget')) + L(T('2. Planning des livraisons', '2. Delivery schedule')) + L(T('3. Questions diverses', '3. Any other business')) + `<div class="qn-sep">${SEPS[0]}</div>` + L(T('Salle B12, 14 h', 'Room B12, 2 pm')), 3),
    N(`<h1>${T('Crêpes', 'Pancakes')}</h1>` + L(T('250 g de farine, 3 œufs, 50 cl de lait, une pincée de sel.', '250 g flour, 3 eggs, 500 ml milk, a pinch of salt.')) + L(T('Laisser reposer <b>1 h</b>.', 'Let rest for <b>1 h</b>.')), 4)];
  lst.forEach(n => { n.text = plain(n.html); });
  return { lang: T('fr', 'en'), dirty: false, list: lst };
}
const plain = html => { const d = document.createElement('div'); d.innerHTML = html.replace(/<\/(div|h1|h2|p|li)>/gi, '\n$&').replace(/<br\s*\/?>/gi, '\n'); return d.textContent.replace(/ /g, ' '); };
const data = () => { if (!NOTES || (!NOTES.dirty && NOTES.lang !== T('fr', 'en'))) { NOTES = seed(); SEL = NOTES.list[0].id; BACKS = BACKS || mkBacks(); } return NOTES; };
const notes = () => data().list;
const sorted = () => [...notes()].sort((a, b) => (b.pinned - a.pinned) || a.order - b.order);
const note = id => notes().find(n => n.id === id);
const cur = () => note(SEL);
const touch = () => { data().dirty = true; };
const stripMark = s => { s = s.trim(); if (!/[\p{L}\p{N}]/u.test(s)) return null; const m = /^[ \t]*(?:[•▸–→◦*+-]|☐|☑|\d+[.)])[ \t]+/.exec(s); if (m) s = s.slice(m[0].length).trim(); return /[\p{L}\p{N}]/u.test(s) ? s : null; };
const lines = n => n.text.split('\n').map(stripMark).filter(Boolean);
const tname = n => (lines(n)[0] || '').slice(0, 80);
const preview = n => lines(n).slice(1, 5).join(' · ').slice(0, 140);
const dtxt = d => { const t = new Date(), loc = T('fr-FR', 'en-US'); if (d.toDateString() === t.toDateString()) return d.toLocaleTimeString(loc, { hour: T('2-digit', 'numeric'), minute: '2-digit' }); if (d.getFullYear() === t.getFullYear()) return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); return d.toLocaleDateString(loc, { day: 'numeric', month: 'short', year: '2-digit' }); };
const dfull = d => d.toLocaleDateString(T('fr-FR', 'en-US'), { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + T('à', 'at') + ' ' + d.toLocaleTimeString(T('fr-FR', 'en-US'), { hour: T('2-digit', 'numeric'), minute: '2-digit' });
const count = t => { const w = (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length; return [w, t.replace(/\n+$/, '').length]; };
const nWords = n => T(`${n} mots`, `${n} words`), nChars = n => T(`${n} caractères`, `${n} characters`);
function mkBacks() { return [{ id: 'b1', date: ago(0, 3, 0), snap: JSON.parse(JSON.stringify(notes())) }, { id: 'b2', date: ago(1, 3, 0), snap: JSON.parse(JSON.stringify(notes().slice(0, 4))) }]; }
function addNote(html = '') {
  const o = Math.min(0, ...notes().map(n => n.order)) - 1, n = { id: uid(), html, text: plain(html), created: new Date(), modified: new Date(), pinned: false, order: o };
  notes().unshift(n); touch(); return n;
}
const repaint = from => views.forEach(v => v.paint && v.paint(from));

/* ====================================================================== icônes ====================================================================== */
const I = (d, w = 1.7) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  bold: I('<path d="M4.5 2.5h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.5h4.5a2.5 2.5 0 0 1 0 5H4.5z"/>', 1.9), italic: I('<path d="M10 2.5H6.5M9.5 13.5H6M9 2.5 7 13.5"/>'), underline: I('<path d="M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5M3 14h10"/>'), strike: I('<path d="M3 8h10M10.5 4.5A3 2.2 0 0 0 5.5 5c0 1.4 1.6 2.2 3 2.5M5.5 11.5c.6 1.2 2.6 1.5 3.7.9"/>'),
  l: I('<path d="M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7"/>'), c: I('<path d="M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7"/>'), r: I('<path d="M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7"/>'),
  ul: I('<circle cx="3" cy="4" r=".7"/><circle cx="3" cy="8" r=".7"/><circle cx="3" cy="12" r=".7"/><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/>'), ol: I('<path d="M2.4 3.5 3.6 3v3M2.3 9.5h2.3l-2.3 2.6h2.5M6.5 4h7M6.5 8h7M6.5 12h7"/>'),
  task: I('<path d="m2 3.8 1 1 1.8-2M2 8.8l1 1 1.8-2M2 13.3l1 1 1.8-2M7 4h6.5M7 9h6.5M7 13.5h6.5"/>', 1.4), link: I('<path d="M7 9a3 3 0 0 0 4.2.2l2-2a3 3 0 0 0-4.2-4.2l-1 1M9 7a3 3 0 0 0-4.2-.2l-2 2a3 3 0 0 0 4.2 4.2l1-1"/>'),
  sep: I('<path d="M2.5 8h11"/>', 1.9), pal: I('<path d="M8 2a6 6 0 1 0 0 12c1 0 1.4-.7 1.2-1.4-.2-.8.2-1.6 1.2-1.6h1.2A2.4 2.4 0 0 0 14 8.6 6 6 0 0 0 8 2z"/><circle cx="5" cy="7" r=".6"/><circle cx="8" cy="5" r=".6"/><circle cx="11" cy="7" r=".6"/>', 1.3),
  none: I('<circle cx="8" cy="8" r="6"/><path d="M3.7 12.3 12.3 3.7"/>', 1.4), plus: I('<path d="M8 3v10M3 8h10"/>', 1.9), list: I('<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/>'), open: I('<path d="M9 2.5h4.5V7M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1H6.5"/>'),
  grip: '<svg viewBox="0 0 10 10"><path d="M6 1 9 1 9 4M4 9 1 9 1 6M9 1 1 9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>', pin: '<svg viewBox="0 0 16 16"><path d="M9.5 1.5 14.5 6.5 12.4 7l-2.3 2.3.4 3.2L9.4 13.6 5.7 9.9 2.5 13.1 2 12.6l3.1-3.2-3.7-3.7 1.1-1.1 3.2.4L8.1 2.7z" fill="currentColor"/></svg>'
};

/* ====================================================================== éditeur riche ====================================================================== */
const MARK = /^([ \t]*)(?:([•▸–→◦*+-])|(☐|☑)|(\d+)([.)]))[ \t]/;
const parseL = s => { const m = MARK.exec(s); if (!m) return null; return { indent: m[1], len: m[0].length, kind: m[3] ? 'task' : m[4] ? 'num' : 'bul', ch: m[2] || m[3] || m[4], sep: m[5] || '', content: s.slice(m[0].length) }; };
const blockOf = n => { while (n && n.nodeType !== 1) n = n.parentNode; while (n && !/^(DIV|H1|H2|P|LI)$/.test(n.nodeName)) n = n.parentNode; return n; };
function textNodes(el) { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = []; let n; while ((n = tw.nextNode())) out.push(n); return out; }
function posIn(block, idx) { let acc = 0; for (const n of textNodes(block)) { if (idx <= acc + n.data.length) return [n, idx - acc]; acc += n.data.length; } return null; }
/* un éditeur : `host` est son conteneur, `get()` renvoie la note affichée, `after()` est appelé après chaque modification */
function editor(el, get, after) {
  let flash = 0, closeMini = () => {};
  el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'false'); el.setAttribute('role', 'textbox'); el.setAttribute('aria-multiline', 'true'); el.dataset.ph = T('Écrivez ici…', 'Write here…');
  const ex = (c, v) => { el.focus({ preventScroll: true }); document.execCommand('styleWithCSS', false, true); return document.execCommand(c, false, v); };
  const save = () => { const n = get(); if (!n) return; marks(); n.html = el.innerHTML; n.text = el.innerText.replace(/ /g, ' '); n.modified = new Date(); touch(); after(n); };
  const marks = () => el.querySelectorAll(':scope>div').forEach(d => { const t = d.textContent.trim(), sep = t.length >= 1 && (t === P.sep.trim() || SEPS.includes(t)); d.classList.toggle('qn-sep', sep); if (!d.classList.length) d.removeAttribute('class'); });
  const paint = () => { const n = get(); el.innerHTML = n ? n.html : ''; el.contentEditable = n ? 'true' : 'false'; };
  const lineInfo = () => { const s = getSelection(); if (!s.rangeCount || !el.contains(s.anchorNode)) return null; const b = blockOf(s.anchorNode); if (!b || b === el) return null;
    const r = s.getRangeAt(0).cloneRange(); const pre = document.createRange(); pre.selectNodeContents(b); pre.setEnd(r.startContainer, r.startOffset); return { b, s, before: pre.toString().replace(/ /g, ' '), text: b.textContent.replace(/ /g, ' '), collapsed: s.isCollapsed }; };
  const replaceBlockText = (b, t) => { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); if (t) document.execCommand('insertText', false, t); else document.execCommand('delete'); };
  el.addEventListener('input', e => {
    if (P.smart && e.inputType === 'insertText' && e.data === ' ') {
      const li = lineInfo(); if (li && li.collapsed) { const m = /^([ \t]*)(-|\*|\+|\[\]|\[ \])\s$/.exec(li.before); if (m) { const task = m[2][0] === '[', rep = m[1] + (task ? '☐ ' : (P.glyph === m[2] ? null : P.glyph + ' '));
        if (rep) { const r = document.createRange(); const a = posIn(li.b, 0), z = posIn(li.b, li.before.length); if (a && z) { r.setStart(...a); r.setEnd(...z); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, rep); } } } }
    }
    save(); active();
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const li = lineInfo(); if (!li || !li.collapsed) return;
      const atEnd = li.before.length >= li.text.length, t = li.text.trim();
      if (atEnd && t.length >= 3 && '-*_'.includes(t[0]) && [...t].every(c => c === t[0])) { e.preventDefault(); replaceBlockText(li.b, P.sep); document.execCommand('insertParagraph'); const nb = blockOf(getSelection().anchorNode); if (nb && nb.nodeName === 'H1') document.execCommand('formatBlock', false, 'div'); save(); return; }
      if (!P.smart) return; const it = parseL(li.before.length < li.text.length ? li.text : li.text); if (!it) return;
      e.preventDefault();
      if (!it.content.trim()) { replaceBlockText(li.b, ''); save(); return; }
      const next = it.kind === 'task' ? '☐ ' : it.kind === 'num' ? (parseInt(it.ch, 10) + 1) + it.sep + ' ' : it.ch + ' ';
      document.execCommand('insertParagraph'); document.execCommand('insertText', false, it.indent + next); save(); return;
    }
    if (e.key === 'Tab' && P.smart) { const li = lineInfo(); if (li && parseL(li.text)) { e.preventDefault(); const a = posIn(li.b, 0); if (!a) return; const s = getSelection(), keep = s.getRangeAt(0).cloneRange(); const r = document.createRange();
      if (e.shiftKey) { const m = /^( {1,2}|\t)/.exec(li.text); if (m) { r.setStart(...a); r.setEnd(...posIn(li.b, m[0].length)); s.removeAllRanges(); s.addRange(r); document.execCommand('delete'); } } else { r.setStart(...a); r.collapse(true); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '  '); }
      s.removeAllRanges(); void keep; save(); } }
  });
  el.addEventListener('beforeinput', () => { if (!el.firstElementChild && !el.textContent && el.isContentEditable) { el.innerHTML = '<div><br></div>'; const r = document.createRange(); r.setStart(el.firstChild, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } });
  el.addEventListener('paste', e => { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
  el.addEventListener('click', e => {
    const a = e.target.closest('a'); if (a && el.contains(a)) { e.preventDefault(); toast({ icon: appIcon(ID), title: ID, body: T('Lien ouvert dans le navigateur : ', 'Link opened in the browser: ') + (a.getAttribute('href') || '').replace(/^https?:\/\//, '') }); sfx.pop(); return; }
    const rg = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null; if (!rg) return; const b = blockOf(rg.startContainer); if (!b || b === el) return;
    const it = parseL(b.textContent); if (!it || it.kind !== 'task' || !/^[☐☑]$/.test(it.ch)) return; const p = posIn(b, it.indent.length), q = posIn(b, it.indent.length + 1); if (!p || !q) return;
    const r = document.createRange(); r.setStart(...p); r.setEnd(...q); const bb = r.getBoundingClientRect(); if (e.clientX < bb.left - 4 || e.clientX > bb.right + 4 || e.clientY < bb.top - 2 || e.clientY > bb.bottom + 2) return;
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, it.ch === '☐' ? '☑' : '☐'); sfx.tick(); save();
  });
  /* mini-barre sur la sélection */
  const showMini = () => {
    closeMini(); const s = getSelection(); if (!s.rangeCount || s.isCollapsed || !el.contains(s.anchorNode) || !el.contains(s.focusNode)) return; const rect = s.getRangeAt(0).getBoundingClientRect(); if (!rect.width && !rect.height) return;
    const root = el.closest('.mlkx-root'); if (!root) return;
    const mk = (g, tip, fn) => h('button', { class: 'qn-tb', title: tip, 'aria-label': tip, html: g, onmousedown: ev => ev.preventDefault(), onclick: () => { fn(); active(); } });
    const mini = h('div', { class: 'qn-mini', role: 'toolbar' }, h('div', { class: 'qn-r' }, mk(IC.bold, T('Gras', 'Bold'), () => cmd('bold')), mk(IC.italic, T('Italique', 'Italic'), () => cmd('italic')), mk(IC.underline, T('Souligné', 'Underline'), () => cmd('underline')), mk(IC.strike, T('Barré', 'Strikethrough'), () => cmd('strikeThrough')), mk(IC.link, T('Lien', 'Link'), () => linkDlg()), mk('<b style="font-size:13px">Aa</b>', T('Sous-titre', 'Subtitle'), () => block('h2')), mk(IC.ul, T('Liste à puces', 'Bulleted list'), () => list('bul'))),
      h('div', { class: 'qn-sw', style: { '--sz': '15px' } }, ...COLORS.map(c => h('button', { style: { '--c': '#' + c }, 'aria-label': c, title: T('Couleur du texte', 'Text color'), onmousedown: ev => ev.preventDefault(), onclick: () => { color('#' + c); } })), h('button', { class: 'qn-nn', html: IC.none, title: T('Sans couleur', 'No color'), onmousedown: ev => ev.preventDefault(), onclick: () => color(null) })));
    root.append(mini); const rr = root.getBoundingClientRect(), k = S.scale; let x = (rect.left - rr.left) / k + rect.width / k / 2 - mini.offsetWidth / 2, y = (rect.top - rr.top) / k - mini.offsetHeight - 6; if (y < 4) y = (rect.bottom - rr.top) / k + 6;
    mini.style.left = clamp(x, 4, root.clientWidth - mini.offsetWidth - 4) + 'px'; mini.style.top = y + 'px'; closeMini = () => { mini.remove(); closeMini = () => {}; };
  };
  const cmd = c => { ex(c); save(); };
  const color = c => { if (c) ex('foreColor', c); else ex('foreColor', getComputedStyle(el).color); save(); sfx.tick(); };
  const block = t => { const li = lineInfo(), cur = li && li.b.nodeName.toLowerCase(); ex('formatBlock', cur === t ? 'div' : t); save(); };
  /* liste : met les lignes en puces, numérotées ou tâches, ou les en retire si elles y sont toutes */
  const list = kind => {
    const s = getSelection(); if (!s.rangeCount || !el.contains(s.anchorNode)) { el.focus({ preventScroll: true }); return; }
    const r = s.getRangeAt(0), blocks = [...el.querySelectorAll(':scope>div,:scope>h1,:scope>h2')].filter(b => r.intersectsNode(b)); const bs = blocks.length ? blocks : [blockOf(r.startContainer)].filter(Boolean);
    const target = bs.filter(b => bs.length === 1 || b.textContent.trim()), inKind = b => { const it = parseL(b.textContent); return it && it.kind === kind; }, remove = target.length && target.every(inKind); let k = 1;
    target.forEach(b => { const it = parseL(b.textContent), indent = it ? it.indent : (/^[ \t]*/.exec(b.textContent) || [''])[0], content = it ? it.content : b.textContent.slice(indent.length);
      const out = remove ? indent + content : indent + (kind === 'bul' ? P.glyph + ' ' : kind === 'num' ? (k++) + '. ' : '☐ ') + content; replaceBlockText(b, out); });
    save();
  };
  const linkDlg = () => {
    const root = el.closest('.mlkx-root'), s = getSelection(), saved = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; if (!root) return;
    const f = h('input', { class: 'mlkx-field', type: 'text', placeholder: 'https://…', spellcheck: 'false', style: { width: '100%' }, 'aria-label': T('Adresse', 'Address') });
    const go = () => { const v = f.value.trim(); if (!v) return; const u = /^[a-z]+:/i.test(v) ? v : 'https://' + v; close(); if (saved) { el.focus({ preventScroll: true }); const g = getSelection(); g.removeAllRanges(); g.addRange(saved); } ex('createLink', u); save(); };
    const close = sheet(root, { title: T('Ajouter un lien', 'Add a link'), text: T('Adresse du lien pour le texte sélectionné.', 'Link address for the selected text.'), body: f, buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Ajouter', 'Add'), kind: 'pri', fn: () => {} }] });
    const ok = root.querySelector('.mlkx-dlg .mlkx-btn.pri'); ok.onclick = e => { e.stopImmediatePropagation(); go(); }; f.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }); f.focus({ preventScroll: true });
  };
  const sepLine = () => { const s = getSelection(); if (!s.rangeCount || !el.contains(s.anchorNode)) el.focus({ preventScroll: true }); const li = lineInfo(); if (li && li.text.trim()) { document.execCommand('insertParagraph'); } document.execCommand('insertText', false, P.sep); document.execCommand('insertParagraph'); save(); };
  /* états des boutons : ce qui s'applique sous le curseur */
  let activeCb = () => {};
  const state = () => { const li = lineInfo(), st = new Set(); const q = c => { try { return document.queryCommandState(c); } catch { return false; } };
    ['bold', 'italic', 'underline', 'strikeThrough', 'justifyCenter', 'justifyRight'].forEach(c => q(c) && st.add(c)); if (!st.has('justifyCenter') && !st.has('justifyRight')) st.add('justifyLeft');
    if (li) { const nm = li.b.nodeName; st.add(nm === 'H1' ? 'title' : nm === 'H2' ? 'subtitle' : 'body'); const it = parseL(li.text); if (it) st.add(it.kind); } return st; };
  const active = () => activeCb(state());
  const onSel = () => { if (!el.isConnected) return; const s = getSelection(); if (el.contains(s.anchorNode)) { active(); const sel = s.isCollapsed ? '' : (s.toString().trim() ? s.toString() : ''); el._sel && el._sel(sel); } };
  document.addEventListener('selectionchange', onSel);
  el.addEventListener('mouseup', () => setTimeout(showMini, 10)); el.addEventListener('keyup', e => { if (e.shiftKey || e.key.startsWith('Arrow')) showMini(); else closeMini(); });
  el.addEventListener('mousedown', () => closeMini()); el.addEventListener('blur', () => setTimeout(() => { if (!document.activeElement || !document.activeElement.closest('.qn-mini')) closeMini(); }, 120)); el.addEventListener('input', () => closeMini());
  paint();
  return { el, destroy: () => { document.removeEventListener('selectionchange', onSel); closeMini(); }, paint, cmd, color, block, list, link: linkDlg, sep: sepLine, align: a => { ex(a); save(); }, onState: f => { activeCb = f; }, state, refresh: active, save, focus: () => el.focus({ preventScroll: true }) };
}

/* ====================================================================== barre de format ====================================================================== */
function formatBar(ed, root) {
  const bar_ = h('div', { class: 'qn-fb', role: 'toolbar', 'aria-label': T('Mise en forme', 'Formatting') }), btns = {};
  const tb = (key, g, tip, fn, sc) => { const b = h('button', { class: 'qn-tb', title: tip + (sc ? '  ' + sc : ''), 'aria-label': tip, html: g, onmousedown: e => e.preventDefault(), onclick: () => { fn(); sfx.tick(); } }); btns[key] = b; return b; };
  const sp = () => h('i', { class: 'qn-sp' });
  const stl = h('button', { class: 'qn-st', 'data-pop': '', title: T('Style du paragraphe', 'Paragraph style'), onmousedown: e => e.preventDefault() }); const sName = { title: T('Titre', 'Title'), subtitle: T('Sous-titre', 'Subtitle'), body: T('Texte', 'Body') };
  const setStyle = k => { stl.replaceChildren(h('span', {}, sName[k]), h('i', { html: SVG.down, style: { display: 'contents' } })); }; setStyle('body');
  stl.onclick = () => (menuOpenFor(stl) ? closeMenus() : macMenu(stl, [['title', 'h1', '⌘1'], ['subtitle', 'h2', '⌘2'], ['body', 'div', '⌘0']].map(([k, t, key]) => ({ label: sName[k], key, fn: () => { ed.focus(); const li = null; void li; document.execCommand('styleWithCSS', false, true); document.execCommand('formatBlock', false, t); ed.save(); } })), { align: 'left' }));
  const pal = tb('pal', IC.pal, T('Couleur du texte', 'Text color'), () => {});
  pal.dataset.pop = ''; pal.onclick = () => { const p = root.querySelector('.qn-pop'); if (p) return p.remove(); const sw = h('div', { class: 'qn-sw', style: { '--sz': '20px', padding: '0' } }, ...COLORS.map(c => h('button', { style: { '--c': '#' + c }, 'aria-label': c, title: T('Couleur du texte', 'Text color'), onclick: () => { ed.color('#' + c); pop.remove(); } })), h('button', { class: 'qn-nn', html: IC.none, title: T('Sans couleur', 'No color'), onclick: () => { ed.color(null); pop.remove(); } }));
    const pop = h('div', { class: 'qn-pop', role: 'dialog' }, sw); root.append(pop); const rr = root.getBoundingClientRect(), ar = pal.getBoundingClientRect(); pop.style.left = clamp((ar.left - rr.left) / S.scale, 8, root.clientWidth - pop.offsetWidth - 8) + 'px'; pop.style.top = (ar.bottom - rr.top) / S.scale + 6 + 'px';
    const away = e => { if (!pop.contains(e.target) && !e.target.closest('[data-pop]')) { pop.remove(); removeEventListener('pointerdown', away, true); } }; setTimeout(() => addEventListener('pointerdown', away, true), 0); };
  bar_.append(stl, sp(), tb('bold', IC.bold, T('Gras', 'Bold'), () => ed.cmd('bold'), '⌘B'), tb('italic', IC.italic, T('Italique', 'Italic'), () => ed.cmd('italic'), '⌘I'), tb('underline', IC.underline, T('Souligné', 'Underline'), () => ed.cmd('underline'), '⌘U'), tb('strikeThrough', IC.strike, T('Barré', 'Strikethrough'), () => ed.cmd('strikeThrough'), '⇧⌘X'),
    sp(), pal, tb('justifyLeft', IC.l, T('Aligner à gauche', 'Align left'), () => ed.align('justifyLeft')), tb('justifyCenter', IC.c, T('Centrer', 'Center'), () => ed.align('justifyCenter')), tb('justifyRight', IC.r, T('Aligner à droite', 'Align right'), () => ed.align('justifyRight')),
    sp(), tb('bul', IC.ul, T('Liste à puces', 'Bulleted list'), () => ed.list('bul'), '⇧⌘8'), tb('num', IC.ol, T('Liste numérotée', 'Numbered list'), () => ed.list('num'), '⇧⌘7'), tb('task', IC.task, T('Liste de tâches', 'Task list'), () => ed.list('task'), '⇧⌘T'),
    sp(), tb('link', IC.link, T('Lien', 'Link'), () => ed.link(), '⌘K'), tb('sep', IC.sep, T('Séparateur', 'Separator'), () => ed.sep()));
  ed.onState(st => { Object.entries(btns).forEach(([k, b]) => b.classList.toggle('on', st.has(k))); setStyle(st.has('title') ? 'title' : st.has('subtitle') ? 'subtitle' : 'body'); });
  return bar_;
}

/* ====================================================================== fenêtre principale ====================================================================== */
function openMain(app) {
  const A = { ...app, accent: BRAND };
  return wm.open({ id: 'app:' + ID, appId: ID, title: ID, w: 980, h: 700, minw: 860, minh: 520, cls: 'socle mlkx-win', onclose: w => { w.dead = true; views.delete(w.view); eds.delete(w.ed); w.off && w.off(); },
    build: w => { w.render = () => { w.off && w.off(); views.delete(w.view); eds.delete(w.ed); w.body.innerHTML = ''; w.body.append(mainUI(w, A)); const t = w.el.querySelector('.wt'); t && (t.textContent = ID); }; return mainUI(w, A); } });
}
function mainUI(w, A) {
  const root = h('div', { class: 'mlkx-root' }), cols = h('div', { class: 'qn-cols' }), side = h('aside', { class: 'qn-side' }), main = h('main', { class: 'qn-main' }), list = h('div', { class: 'qn-list', role: 'listbox', 'aria-label': T('Notes', 'Notes') });
  let ed = null, counts = null, mod = null, suppress = false, dragOff = null; w.off = () => { dragOff && dragOff(); ed && ed.destroy(); };
  const q = h('input', { class: 'mlkx-field', type: 'search', placeholder: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), value: QUERY }); q.addEventListener('input', () => { QUERY = q.value; drawList(); });
  const plus = h('button', { class: 'mlkx-btn act', title: T('Nouvelle note', 'New note'), 'aria-label': T('Nouvelle note', 'New note'), html: IC.plus.replace('<svg ', '<svg style="width:16px;height:16px" '), onclick: () => newNote() });
  const filtered = () => { const s = QUERY.trim().toLowerCase(); return sorted().filter(n => !s || n.text.toLowerCase().includes(s)); };
  const cnt = h('div', { class: 'qn-cnt' });
  function drawList() {
    const keep = list.scrollTop, fl = filtered(); list.replaceChildren();
    if (!fl.length) list.append(h('div', { class: 'qn-none' }, QUERY ? T('Aucun résultat', 'No results') : T('Aucune note', 'No notes')));
    fl.forEach(n => { const t = tname(n);
      const r = h('div', { class: 'qn-row' + (n.id === SEL ? ' on' : ''), role: 'option', 'aria-selected': String(n.id === SEL), 'data-id': n.id, tabindex: '0' },
        h('div', { class: 'qn-r1' }, n.pinned ? h('i', { class: 'qn-pin', html: IC.pin, style: { display: 'block' } }) : null, h('span', { class: 'qn-rt' + (t ? '' : ' mt') }, t || T('Note vide', 'Empty note')), h('span', { class: 'qn-rd' }, dtxt(n.modified))), preview(n) ? h('div', { class: 'qn-rp' }, preview(n)) : null);
      r.addEventListener('click', () => { if (suppress) return; if (SEL !== n.id) { SEL = n.id; sfx.tick(); drawList(); drawEditor(); repaint(w); } });
      r.addEventListener('keydown', e => { if (e.key === 'Enter') r.click(); });
      r.addEventListener('contextmenu', e => { e.preventDefault(); macMenu({ x: e.clientX, y: e.clientY }, [{ label: n.pinned ? T('Désépingler', 'Unpin') : T('Épingler', 'Pin'), fn: () => { n.pinned = !n.pinned; touch(); repaint(); } }, { label: T('Dupliquer', 'Duplicate'), fn: () => { const c = addNote(n.html); c.pinned = false; SEL = c.id; repaint(); drawEditor(); } }, { label: T('Copier le texte', 'Copy text'), fn: () => { navigator.clipboard && navigator.clipboard.writeText(n.text).catch(() => {}); toast({ icon: appIcon(ID), title: ID, body: T('Texte copié.', 'Text copied.') }); } }, { sep: 1 }, { label: T('Supprimer la note', 'Delete note'), danger: 1, fn: () => askDel(n) }]); });
      r.addEventListener('pointerdown', e => { if (e.button === 0) startDrag(e, n, t || T('Note vide', 'Empty note')); }); list.append(r); });
    list.scrollTop = keep; cnt.textContent = T(`${notes().length} notes`, `${notes().length} notes`);
  }
  function askDel(n) { sheet(root, { title: T('Supprimer cette note ?', 'Delete this note?'), text: T('Une sauvegarde automatique peut la restaurer, si elles sont activées.', 'An automatic backup can restore it, if they are turned on.'), buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Supprimer', 'Delete'), kind: 'tdg', fn: () => { const i = sorted().indexOf(n); notes().splice(notes().indexOf(n), 1); touch(); sfx.close(); const s = sorted(); SEL = s.length ? (s[Math.min(i, s.length - 1)]).id : null; repaint(); drawEditor(); } }] }); }
  function newNote() { const n = addNote(); SEL = n.id; QUERY = ''; q.value = ''; sfx.pop(); FLASH = n.id; repaint(); drawEditor(); setTimeout(() => ed && ed.focus(), 30); }
  /* réordonner à la souris : une note déposée sur une note épinglée s'épingle */
  function startDrag(e, n, label) {
    if (QUERY) return; const sx = e.clientX, sy = e.clientY; let on = false, ghost = null, hit = null;
    const clear = () => { list.querySelectorAll('.dt').forEach(x => x.classList.remove('dt')); list.classList.remove('de'); };
    const mv = ev => {
      if (!on) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; on = true; ghost = h('div', { class: 'qn-ghost' }, label); root.append(ghost); sfx.tick(); const s = list.querySelector(`[data-id="${n.id}"]`); s && s.classList.add('dragging'); }
      const rr = root.getBoundingClientRect(); ghost.style.left = (ev.clientX - rr.left) / S.scale + 14 + 'px'; ghost.style.top = (ev.clientY - rr.top) / S.scale + 6 + 'px'; clear();
      const el = document.elementFromPoint(ev.clientX, ev.clientY), row = el && el.closest('.qn-row'); hit = null;
      if (row && row.dataset.id !== n.id) { row.classList.add('dt'); hit = { id: row.dataset.id }; } else if (el && el.closest('.qn-list') && !row) { list.classList.add('de'); hit = { id: null }; }
    };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); dragOff = null; if (!on) return; ghost.remove(); clear(); suppress = true; setTimeout(() => { suppress = false; }, 0);
      if (!hit) { drawList(); return; } const s = sorted().filter(x => x !== n), i = hit.id ? s.findIndex(x => x.id === hit.id) : s.length, target = s[i]; n.pinned = target ? target.pinned : (s.length ? s[s.length - 1].pinned : false);
      s.splice(i < 0 ? s.length : i, 0, n); s.forEach((x, k) => { x.order = k; }); touch(); sfx.pop(); repaint(); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up); dragOff = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  }
  function drawEditor() {
    main.replaceChildren(); const n = cur();
    if (!n) {
      main.append(h('div', { class: 'qn-empty' }, h('h2', { class: 'mlkx-heading' }, T('Commencez votre première note', 'Start your first note')), h('p', {}, T('Écrivez et mettez en forme : titres, gras, listes, tâches, couleurs. Tout est enregistré tout de suite.', 'Write and format: headings, bold, lists, tasks, colors. Everything is saved right away.')),
        h('button', { class: 'mlkx-btn act', onclick: newNote }, T('Nouvelle note', 'New note')), h('button', { class: 'mlkx-btn', onclick: () => importDlg() }, T('Importer depuis Tot', 'Import from Tot'))));
      ed && ed.destroy(); ed = null; eds.delete(w.ed); return;
    }
    const el = h('div', { class: 'qn-ed' + (P.mono ? ' qn-mono' : ''), 'aria-label': T('Texte de la note', 'Note text') }); el.style.setProperty('--qs', P.size + 'px'); if (P.font) el.style.setProperty('--qf', `"${P.font}",system-ui,sans-serif`);
    ed && ed.destroy(); ed = editor(el, cur, nn => { drawList(); upd(); repaint(w); }); eds.delete(w.ed); w.ed = ed; eds.add(ed);
    counts = h('span', {}), mod = h('span', {}); const upd = (selTxt) => { const t = selTxt || (cur() ? cur().text : ''), [wd, ch] = count(t); counts.textContent = (selTxt ? T('Sélection', 'Selection') + ' · ' : '') + nWords(wd) + ' · ' + nChars(ch); mod.textContent = cur() ? T('Modifiée le ', 'Modified on ') + dfull(cur().modified) : ''; };
    el._sel = s => upd(s); upd();
    const fb = formatBar(ed, root); main.append(fb, el, h('div', { class: 'qn-ft' }, counts, h('span', { class: 'qn-spc' }), mod)); ed.refresh();
    el.addEventListener('keydown', k => { const m = k.metaKey || k.ctrlKey; if (!m) return; const key = k.key.toLowerCase();
      if (k.shiftKey && key === 'x') { k.preventDefault(); ed.cmd('strikeThrough'); } else if (k.shiftKey && key === '8') { k.preventDefault(); ed.list('bul'); } else if (k.shiftKey && key === '7') { k.preventDefault(); ed.list('num'); } else if (k.shiftKey && key === 't') { k.preventDefault(); ed.list('task'); }
      else if (key === 'k') { k.preventDefault(); ed.link(); } else if (key === '1') { k.preventDefault(); ed.block('h1'); } else if (key === '2') { k.preventDefault(); ed.block('h2'); } else if (key === '0') { k.preventDefault(); document.execCommand('formatBlock', false, 'div'); ed.save(); } });
    if (FLASH === n.id) { FLASH = null; el.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 300 }); }
  }
  side.append(h('div', { class: 'qn-sh' }, q, plus), list, cnt); cols.append(side, main); root.append(cols);
  const view = { paint: from => { if (w.dead) return; drawList(); if (from !== w) { const n = cur(); if (!n || !ed) { drawEditor(); } else if (!root.contains(document.activeElement) || !document.activeElement.matches('.qn-ed')) { ed.paint(); } } } };
  w.view = view; views.add(view); drawList(); drawEditor(); void A; return root;
}
function importDlg() {
  const w = wm.wins.get('app:' + ID); if (!w) return; const root = w.body.querySelector('.mlkx-root'); const when = ago(0, 4, 0);
  sheet(root, { title: T('Importer depuis Tot', 'Import from Tot'), text: T(`La dernière sauvegarde de Tot (${dfull(when)}) contient 4 notes. Elles seront ajoutées à qNOTES ; Tot n’est pas modifié.`, `The latest Tot backup (${dfull(when)}) contains 4 notes. They will be added to qNOTES; Tot is not modified.`),
    buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Importer', 'Import'), kind: 'pri', fn: () => { const t = [['Liste de lectures', '☐ Dune\n☐ Solaris'], ['Mots de passe oubliés', 'Rien ici.'], ['Idée de cadeau', 'Un carnet relié.'], ['Trajet', 'Gare à 8 h 12.']];
      t.forEach(([a, b]) => { addNote(`<h1>${a}</h1>` + b.split('\n').map(x => `<div>${x}</div>`).join('')); }); SEL = notes()[0].id; sfx.done(); repaint(); toast({ icon: appIcon(ID), title: ID, body: T('4 notes importées, 0 déjà présentes', '4 notes imported, 0 already present') }); } }] });
}

/* ====================================================================== volet de la barre des menus ====================================================================== */
function togglePanel() { if (PANEL) return closePanel(); openPanel(); }
function closePanel() { if (PANEL) { PANEL.off(); PANEL.el.remove(); PANEL = null; extra && extra.classList.remove('open'); } }
function openPanel() {
  if (!extra) return; closeMenus(); sfx.click(); if (!note(SEL)) { const s = sorted()[0]; if (s) SEL = s.id; else { SEL = addNote().id; } } extra.classList.add('open');
  const W = 440, H = 520, r = extra.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(); let x = (r.left - s.left) / S.scale + r.width / S.scale / 2 - W / 2, y = (r.bottom - s.top) / S.scale + 4;
  const el = h('div', { class: 'socle mlkx-root qn-panel', role: 'dialog', 'aria-label': ID, style: { left: clamp(x, 8, 1592 - W) + 'px', top: y + 'px', width: W + 'px', height: H + 'px' } }); $('#layer').append(el);
  const dots = h('div', { class: 'qn-dots' + (P.dots ? ' num' : '') }), tools = h('div', { class: 'qn-pt' }), foot = h('div', { class: 'qn-pf' }); let ed = null, cn = null;
  const drawDots = () => { dots.replaceChildren(...sorted().map((n, i) => h('button', { class: 'qn-dot' + (n.id === SEL ? ' on' : ''), style: { '--c': '#' + COLORS[i % COLORS.length] }, title: tname(n) || T('Note vide', 'Empty note'), 'aria-label': tname(n) || T('Note vide', 'Empty note'), 'data-id': n.id, onclick: () => { SEL = n.id; drawDots(); drawEd(); repaint(); } }, h('i', {}, P.dots ? String(i + 1) : '')))); };
  const edHost = h('div', { style: { flex: '1', minHeight: '0', display: 'flex', flexDirection: 'column' } });
  function drawEd() { ed && ed.destroy(); edHost.replaceChildren(); const el2 = h('div', { class: 'qn-ed' + (P.mono ? ' qn-mono' : '') }); el2.style.setProperty('--qs', P.size + 'px'); if (P.font) el2.style.setProperty('--qf', `"${P.font}",system-ui,sans-serif`); eds.delete(ed);
    ed = editor(el2, cur, () => { drawDots(); upd(); repaint(view); }); eds.add(ed); edHost.append(el2); el2._sel = sl => upd(sl); upd(); }
  const upd = sl => { const t = sl || (cur() ? cur().text : ''), [wd, ch] = count(t); cn.textContent = nWords(wd) + ' · ' + nChars(ch); };
  cn = h('span', {}); const plusB = h('button', { class: 'qn-pb', title: T('Nouvelle note', 'New note'), 'aria-label': T('Nouvelle note', 'New note'), html: IC.plus, onclick: () => { const n = addNote(); SEL = n.id; sfx.pop(); drawDots(); drawEd(); repaint(view); setTimeout(() => ed.focus(), 20); } });
  const listB = h('button', { class: 'qn-pb', title: T('Toutes les notes', 'All notes'), 'aria-label': T('Toutes les notes', 'All notes'), html: IC.list, onclick: () => macMenu(listB, sorted().slice(0, 60).map(n => ({ label: (n.pinned ? '📌 ' : '') + (tname(n) || T('Note vide', 'Empty note')), fn: () => { SEL = n.id; drawDots(); drawEd(); repaint(view); } })), { align: 'right' }) });
  const openB = h('button', { class: 'qn-pb', title: T('Ouvrir qNOTES', 'Open qNOTES'), 'aria-label': T('Ouvrir qNOTES', 'Open qNOTES'), html: IC.open, onclick: () => { closePanel(); openMain(appBy()); } });
  const grip = h('div', { class: 'qn-pg', title: T('Agrandir le volet', 'Enlarge the panel'), html: IC.grip });
  grip.addEventListener('pointerdown', e => { e.preventDefault(); const sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight; const mv = ev => { el.style.width = clamp(ow + (ev.clientX - sx) / S.scale, 340, 1000) + 'px'; el.style.height = clamp(oh + (ev.clientY - sy) / S.scale, 280, 820) + 'px'; }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  tools.append(dots, plusB, listB); foot.append(cn, h('span', { class: 'qn-spc' }), openB, grip); el.append(tools, edHost, foot);
  const view = { paint: from => { if (!PANEL || from === view) return; drawDots(); if (ed && !(document.activeElement && document.activeElement === ed.el)) ed.paint(); } }; views.add(view);
  const away = e => { if (!el.contains(e.target) && !extra.contains(e.target) && !e.target.closest('.mlkx-menu,.mlkx-scrim')) closePanel(); }, key = e => { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } };
  setTimeout(() => addEventListener('pointerdown', away, true), 0); addEventListener('keydown', key, true);
  PANEL = { el, off: () => { removeEventListener('pointerdown', away, true); removeEventListener('keydown', key, true); views.delete(view); eds.delete(ed); ed && ed.destroy(); } };
  drawDots(); drawEd(); setTimeout(() => ed.focus(), 30);
}
const appBy = () => S.apps.find(a => a.id === ID);

/* ====================================================================== réglages ====================================================================== */
function openSettings() {
  const ex = wm.wins.get('app:' + ID + ':set'); if (ex) { wm.open({ id: 'app:' + ID + ':set' }); return; }
  wm.open({ id: 'app:' + ID + ':set', appId: ID, title: T('Réglages de qNOTES', 'qNOTES Settings'), w: 560, h: 686, resizable: false, cls: 'socle mlkx-win',
    build: w => { w.render = () => { w.body.innerHTML = ''; w.body.append(setUI(w)); const t = w.el.querySelector('.wt'); t && (t.textContent = T('Réglages de qNOTES', 'qNOTES Settings')); }; return setUI(w); } });
}
function setUI(w) {
  const root = h('div', { class: 'mlkx-root' }), sc = h('div', { class: 'qn-set' });
  const chk = (lab, get, set, dis) => { const b = h('button', { class: 'mlkx-chk', role: 'checkbox', 'aria-checked': String(!!get()), disabled: !!dis, onclick: () => { const v = !get(); set(v); b.setAttribute('aria-checked', String(v)); sfx.tick(); } }, h('i', { html: SVG.check }), h('span', {}, lab)); return b; };
  const sec = (lab, ...k) => h('section', { class: 'qn-sec' }, h('div', { class: 'mlkx-eyebrow' }, lab.toUpperCase()), ...k);
  const hint = t => h('div', { class: 'qn-hint' }, t);
  const row = (lab, c) => h('div', { class: 'qn-row2' }, h('span', {}, lab), c);
  const seg = (opts, get, set, lab) => { const d = h('div', { class: 'qn-seg', role: 'group' }), paint = () => d.replaceChildren(...opts.map(([k, l]) => h('button', { 'aria-pressed': String(get() === k), onclick: () => { set(k); sfx.tick(); paint(); } }, l))); paint(); return d; };
  const edUpd = () => eds.forEach(e => { e.el.classList.toggle('qn-mono', P.mono); e.el.style.setProperty('--qs', P.size + 'px'); P.font && !P.mono ? e.el.style.setProperty('--qf', `"${P.font}",system-ui,sans-serif`) : e.el.style.removeProperty('--qf'); });
  const sample = h('div', { class: 'qn-sample' }, T('Voici l’aspect de vos notes : un texte clair, agréable à lire.', 'This is how your notes look: clear text, pleasant to read.')); const paintSample = () => { sample.style.fontSize = P.size + 'px'; sample.style.fontFamily = P.mono ? 'ui-monospace,Menlo,monospace' : P.font ? `"${P.font}",system-ui,sans-serif` : ''; }; paintSample();
  const fontBtn = h('button', { class: 'qn-dd', 'data-pop': '', style: { fontFamily: P.font ? `"${P.font}"` : '' } }); const fpaint = () => { fontBtn.replaceChildren(h('span', {}, (FONTS_().find(f => f[0] === P.font) || FONTS_()[0])[1]), h('i', { html: SVG.down, style: { display: 'contents' } })); fontBtn.style.opacity = P.mono ? '.45' : ''; fontBtn.disabled = P.mono; }; fpaint();
  fontBtn.onclick = () => (menuOpenFor(fontBtn) ? closeMenus() : macMenu(fontBtn, FONTS_().map(([k, l]) => ({ label: l, check: P.font === k, fn: () => { P.font = k; fpaint(); paintSample(); edUpd(); } })), { align: 'left' }));
  const bmsg = h('span', { class: 'qn-ok' }), bl = h('div', {}); const paintBk = () => { bl.replaceChildren(); const arr = [...BACKS].sort((a, b) => b.date - a.date), show = P.backupOpen ? arr : arr.slice(0, 1);
    show.forEach(b => bl.append(h('div', { class: 'qn-bk' }, h('span', {}, dfull(b.date)), h('span', { class: 'n' }, T(`${b.snap.length} notes`, `${b.snap.length} notes`)), h('button', { class: 'mlkx-btn ter', onclick: () => sheet(root, { title: T('Restaurer cette sauvegarde ?', 'Restore this backup?'), text: T('Vos notes actuelles sont d’abord sauvegardées, puis remplacées par celles de cette sauvegarde.', 'Your current notes are backed up first, then replaced by those from this backup.'),
      buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Restaurer', 'Restore'), kind: 'tdg', fn: () => { BACKS.push({ id: uid(), date: new Date(), snap: JSON.parse(JSON.stringify(notes())) }); data().list = JSON.parse(JSON.stringify(b.snap)).map(n => ({ ...n, created: new Date(n.created), modified: new Date(n.modified) })); touch(); SEL = sorted()[0] ? sorted()[0].id : null; bmsg.textContent = T('Sauvegarde restaurée', 'Backup restored'); sfx.done(); paintBk(); repaint(); } }] }) }, T('Restaurer', 'Restore')))));
    if (arr.length > 1) bl.append(h('button', { class: 'mlkx-btn ter', style: { alignSelf: 'flex-start', minHeight: '26px', marginTop: '4px' }, onclick: () => { P.backupOpen = !P.backupOpen; paintBk(); } }, P.backupOpen ? T('Masquer les autres', 'Hide the others') : T('Voir les autres sauvegardes', 'Show other backups'))); }; paintBk();
  const sepIn = h('input', { class: 'mlkx-field', type: 'text', value: P.sep, placeholder: T('Séparateur personnalisé', 'Custom separator'), 'aria-label': T('Séparateur personnalisé', 'Custom separator') }); sepIn.addEventListener('input', () => { P.sep = sepIn.value; });
  const updMsg = h('div', { class: 'qn-hint' }, T('Version 1.0.0 (1)', 'Version 1.0.0 (1)'));
  sc.append(
    sec(T('Affichage', 'Display'), seg([['both', T('Les deux', 'Both')], ['menubar', T('Barre de menu', 'Menu bar')], ['dock', T('Dock', 'Dock')]], () => P.display, v => { P.display = v; menubarIcon(); }), hint(T('Barre de menu : un clic sur l’icône ouvre un volet de notes rapide, sans quitter ce que vous faites.', 'Menu bar: a click on the icon opens a quick notes panel, without leaving what you are doing.')),
      chk(T('Raccourci global ⌃⌥N pour ouvrir le volet', 'Global shortcut ⌃⌥N to open the panel'), () => P.hotkey, v => { P.hotkey = v; }), chk(T('Afficher un numéro dans les pastilles de couleur du volet', 'Show a number in the panel color dots'), () => P.dots, v => { P.dots = v; PANEL && (closePanel(), openPanel()); }), chk(T('Démarrer à l’ouverture de session', 'Start at login'), () => P.login, v => { P.login = v; })),
    sec(T('Écriture', 'Writing'), row(T('Police', 'Font'), fontBtn), chk(T('Police à chasse fixe', 'Monospaced font'), () => P.mono, v => { P.mono = v; fpaint(); paintSample(); edUpd(); }), row(T('Taille du texte', 'Text size'), seg([[14, '14'], [16, '16'], [18, '18'], [20, '20']], () => P.size, v => { P.size = v; paintSample(); edUpd(); })), sample),
    sec(T('Fenêtre', 'Window'), chk(T('Fond translucide', 'Translucent background'), () => P.translucent, v => { P.translucent = v; }), chk(T('Toujours au premier plan', 'Always on top'), () => P.onTop, v => { P.onTop = v; })),
    sec(T('Listes', 'Lists'), chk(T('Puces intelligentes (suite automatique, Tab pour décaler, « [] » pour une tâche)', 'Smart bullets (automatic continuation, Tab to indent, “[]” for a task)'), () => P.smart, v => { P.smart = v; }), row(T('Puce des listes', 'List bullet'), seg(BULLETS.map(b => [b, b]), () => P.glyph, v => { P.glyph = v; })), hint(T('Taper « - » puis une espace donne la puce choisie. Un clic sur une case « ☐ » coche la tâche.', 'Typing “-” then a space gives the chosen bullet. A click on a “☐” box checks the task.'))),
    sec(T('Séparateur', 'Separator'), seg(SEPS.map(s => [s, s.slice(0, 7)]), () => P.sep, v => { P.sep = v; sepIn.value = v; }), sepIn, hint(T('Taper « --- » puis Retour remplace la ligne par ce séparateur.', 'Typing “---” then Return replaces the line with this separator.'))),
    sec(T('Synchronisation', 'Sync'), chk(T('Synchroniser avec iCloud Drive', 'Sync with iCloud Drive'), () => P.sync, v => { P.sync = v; }), hint(T('Les notes sont enregistrées dans le dossier qNOTES d’iCloud Drive, partagé entre vos Mac.', 'Notes are saved in the qNOTES folder of iCloud Drive, shared between your Macs.'))),
    sec(T('Sauvegardes', 'Backups'), chk(T('Sauvegarder automatiquement', 'Back up automatically'), () => P.backups, v => { P.backups = v; }), hint(T('Une sauvegarde par jour ; les 10 dernières sont conservées.', 'One backup per day; the last 10 are kept.')),
      h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('button', { class: 'mlkx-btn', onclick: () => { BACKS.push({ id: uid(), date: new Date(), snap: JSON.parse(JSON.stringify(notes())) }); bmsg.textContent = T('Sauvegarde créée', 'Backup created'); sfx.done(); paintBk(); } }, T('Sauvegarder maintenant', 'Back up now')), bmsg), bl),
    sec(T('Mises à jour', 'Updates'), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), () => P.auto, v => { P.auto = v; }), h('button', { class: 'mlkx-btn', style: { alignSelf: 'flex-start' }, onclick: () => { updMsg.innerHTML = bhtml(T('qNOTES est à jour (version 1.0.0).', 'qNOTES is up to date (version 1.0.0).'), ID, BRAND); sfx.tick(); } }, T('Rechercher les mises à jour…', 'Check for updates…')), updMsg));
  root.append(sc); void w; return root;
}

/* ====================================================================== barre des menus et cycle de vie ====================================================================== */
const DOT = '<i></i>';
function menuItems(app) {
  return [{ label: T('Ouvrir qNOTES', 'Open qNOTES'), fn: () => openMain(app) }, { label: T('Nouvelle note', 'New note'), fn: () => { const n = addNote(); SEL = n.id; repaint(); openPanel(); } }, { label: T('Réglages…', 'Settings…'), fn: () => openSettings() },
    { label: T('À propos de qNOTES', 'About qNOTES'), fn: () => aboutWin(app, { brandColor: BRAND, tagline: () => T('Vos notes en texte enrichi, rapides et synchronisées : puces intelligentes, séparateurs personnalisés, sauvegardes automatiques.', 'Your rich-text notes, fast and synced: smart bullets, custom separators, automatic backups.'), credit: () => T('Inspiré de Tot (The Iconfactory), sans lien avec ses auteurs.', 'Inspired by Tot (The Iconfactory), not affiliated with its authors.'), version: '1.0.0' }) },
    { sep: 1 }, { label: T('Quitter qNOTES', 'Quit qNOTES'), fn: () => quit() }];
}
function menubarIcon() { if (!extra) return; const want = P.display !== 'dock'; if (want && !S.extras.has(ID)) { S.extras.set(ID, { el: extra, quit }); emit('extras'); } else if (!want && S.extras.has(ID)) { closePanel(); S.extras.delete(ID); emit('extras'); } }
function quit() {
  closeMenus(); closePanel(); [...wm.wins.values()].filter(w => w.appId === ID).forEach(w => wm.close(w.id)); hotOn && removeEventListener('keydown', hotOn, true); hotOn = null; extra = null; running = false; S.extras.delete(ID); emit('extras'); sfx.close();
}
function install(app) {
  running = true; extra = h('button', { class: 'mb extra qn-xicon', 'aria-label': T('Notes rapides', 'Quick notes'), title: T('Notes rapides', 'Quick notes'), html: DOT });
  extra.addEventListener('click', () => togglePanel()); extra.addEventListener('contextmenu', e => { e.preventDefault(); closePanel(); macMenu(extra, menuItems(app)); });
  S.extras.set(ID, { el: extra, quit }); emit('extras'); menubarIcon();
  hotOn = e => { if (e.repeat || !P.hotkey || !hotMatch(e, hotFrom('KeyN', 'ca'))) return; e.preventDefault(); e.stopPropagation(); togglePanel(); }; addEventListener('keydown', hotOn, true);
}
export async function open(app) {
  await cssReady(CSS2); data();
  if (!running) install(app);
  openMain(app);
}
