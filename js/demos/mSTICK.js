/* Réplique interactive de mSTICK : le « deck » de notes adhésives au bord de l'écran (repos : capsule à pastilles, survol : cartes en écailles, clic : la note
   glisse hors du deck), notes flottantes en Markdown mis en forme en direct, « Toutes les notes », réglages, menu de la barre des menus, raccourcis globaux.
   Les notes vivent en mémoire : rien n'est lu, rien n'est envoyé. */
import { S, emit, bus } from '../core.js';
import { h, $, T, sfx, toast, wm, icon as appIcon, clamp, reduced } from './kit.js';
import { cssReady, SVG, macMenu, closeMenus, menuOpenFor, sheet, aboutWin, hotLabel, hotMatch, hotFrom, recordHotkey, bhtml } from './mLINKS.js';

const ID = 'mSTICK', BRAND = '#ffcc38', CSS2 = 'css/demos/mSTICK.css';
const VF = { t: 30, b: 806 };                                   // zone utile : sous la barre des menus, au-dessus du Dock
const PAL = [['yellow', '#F8D872'], ['pink', '#F5A9A2'], ['green', '#A8E4C4'], ['blue', '#A9CBF8'], ['purple', '#CFC0F5']];
const EMOJIS = ['📝', '✅', '🛒', '💡', '📌', '⭐️', '🔥', '📞', '📅', '💼', '🏠', '🎯', '🎵', '🍎', '🚀', '❤️', '📚', '✈️', '💰', '🔑', '⚠️', '❓', '🎁', '🧠', '🛠️', '📷', '🎮', '☕️', '🌱', '🧪'];
const FONTS = ['Bradley Hand', 'Noteworthy', 'Marker Felt', 'Chalkboard SE', 'Avenir Next', 'Georgia', 'Menlo'];
const ACTIONS = ['newNote', 'reopenLast', 'allNotes', 'archive', 'moveDeck', 'hideAll'];
const EDGES = ['right', 'left', 'bottom', 'top'];
const P = { edge: 'right', dock: 'stripes', keepOpen: false, fanOnClick: false, delay: .05, fullscreen: true, font: 'Bradley Hand', size: 18, autoTool: false, emoji: true, menubar: true, login: true,
  custom: [], sync: false, syncPath: '~/Library/Mobile Documents/com~apple~CloudDocs/mSTICK', md: false, mdPath: '', auto: true,
  hot: { newNote: hotFrom('KeyN', 'am'), reopenLast: hotFrom('KeyO', 'am'), allNotes: hotFrom('KeyL', 'am'), archive: hotFrom('KeyA', 'am'), moveDeck: hotFrom('KeyE', 'am'), hideAll: hotFrom('KeyH', 'cam') } };
const DEF_HOT = JSON.parse(JSON.stringify(P.hot));

/* ====================================================================== notes ====================================================================== */
let recHot = false, NOTES = null, uidN = 0, running = false, extra = null, DECK = null, hidden = false, fanned = false, fanTimer = 0, dragZ = 0, lastOpened = null, zN = 20, toastEl = null, toastTimer = 0, zonesEl = null;
const NW = new Map();                                            // notes ouvertes : id → { el, note, ed }
const views = new Set();
const uid = () => 'n' + (++uidN);
const ago = (d, hh, mm) => { const x = new Date(); x.setDate(x.getDate() - d); x.setHours(hh, mm, 0, 0); return x; };
function seed() {
  const N = (o, i) => ({ id: uid(), title: '', emoji: '', body: '', color: 'yellow', font: null, pinned: false, archived: false, created: ago(9, 9, 0), updated: ago(i, 10 + i, 12), order: i, ...o });
  return { lang: T('fr', 'en'), dirty: false, list: [
    N({ title: T('À rappeler', 'To call back'), emoji: '📞', color: 'pink', pinned: true, body: T('Appeler Léa avant 18 h\nDemander le devis ~~mardi~~ jeudi\n- [ ] Envoyer les **photos**\n- [x] Réserver la salle', 'Call Lea before 6 pm\nAsk for the quote ~~Tuesday~~ Thursday\n- [ ] Send the **photos**\n- [x] Book the room') }, 0),
    N({ title: T('Courses', 'Groceries'), emoji: '🛒', color: 'green', body: T('- [ ] Café en grains\n- [x] Pain complet\n- [ ] Citrons\n- [ ] Piles AAA', '- [ ] Coffee beans\n- [x] Whole-grain bread\n- [ ] Lemons\n- [ ] AAA batteries') }, 1),
    N({ title: T('Idées', 'Ideas'), emoji: '💡', color: 'yellow', body: T('# Cette semaine\n- Refaire la **page d’accueil**\n- Tester *mSTICK* sur l’autre écran\n- Lire [le cahier des charges](https://example.com/cahier)', '# This week\n- Rebuild the **home page**\n- Try *mSTICK* on the other screen\n- Read [the brief](https://example.com/brief)') }, 2),
    N({ title: T('Réunion de jeudi', 'Thursday meeting'), emoji: '📅', color: 'blue', body: T('1. Budget du trimestre\n2. Planning des livraisons\n3. Questions diverses\n\nSalle `B12`, 14 h', '1. Quarterly budget\n2. Delivery schedule\n3. Any other business\n\nRoom `B12`, 2 pm') }, 3),
    N({ title: T('Playlist du week-end', 'Weekend playlist'), emoji: '🎵', color: 'purple', body: T('Quelque chose de calme\npour le dimanche matin.', 'Something calm\nfor Sunday morning.') }, 4),
    N({ title: T('Vieux brouillon', 'Old draft'), emoji: '', color: 'blue', archived: true, updated: ago(31, 16, 40), body: T('Brouillon de la lettre.\nÀ reprendre un jour.', 'Letter draft.\nTo pick up some day.') }, 5)] };
}
const data = () => { if (!NOTES || (!NOTES.dirty && NOTES.lang !== T('fr', 'en'))) { NOTES = seed(); } return NOTES; };
const all = () => data().list;
const touch = n => { data().dirty = true; if (n) n.updated = new Date(); };
const note = id => all().find(n => n.id === id);
const active = () => all().filter(n => !n.archived).sort((a, b) => (b.pinned - a.pinned) || a.order - b.order);
const hex = c => (c && c[0] === '#' ? c : (PAL.find(p => p[0] === c) || PAL[0])[1]);
const colors = () => [...PAL.map(p => p[0]), ...P.custom];
const isLight = x => { const v = parseInt(x.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255; return (.299 * r + .587 * g + .114 * b) / 255 > .55; };
const tone = n => (isLight(hex(n.color)) ? '#1f1f1f' : '#f2f2f2');
const title = n => { const t = n.title.trim(); if (t) return t; const l = (n.body.split('\n')[0] || '').replace(/^[#\-*\[\] \t]+/, '').trim(); return l ? l.slice(0, 40) : T('Sans titre', 'Untitled'); };
const label = n => [n.emoji, title(n)].filter(Boolean).join(' ');
const fmtDate = d => d.toLocaleDateString(T('fr-FR', 'en-US'), { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + T('à', 'at') + ' ' + d.toLocaleTimeString(T('fr-FR', 'en-US'), { hour: T('2-digit', 'numeric'), minute: '2-digit' });
const repaint = () => { drawDeck(); views.forEach(v => v.paint()); };
function addNote(o = {}) {
  const n = { id: uid(), title: '', emoji: '', body: '', color: 'yellow', font: null, pinned: false, archived: false, created: new Date(), updated: new Date(), order: -1, ...o };
  all().forEach(x => { x.order++; }); n.order = 0; all().push(n); touch(); return n;
}

/* ====================================================================== Markdown en direct ====================================================================== */
const F = { B: 1, I: 2, U: 4, S: 8, C: 16, L: 32, M: 64, BU: 128, NU: 256, X0: 512, X1: 1024, TA: 2048, Q: 4096, H1: 8192, H2: 16384, H3: 32768, IM: 65536 };
const FC = [[F.H1, 'mst-h1'], [F.H2, 'mst-h2'], [F.H3, 'mst-h3'], [F.B, 'mst-b'], [F.I, 'mst-i'], [F.U, 'mst-u'], [F.S, 'mst-s'], [F.C, 'mst-co'], [F.L, 'mst-l'], [F.M, 'mst-m'], [F.IM, 'mst-im'], [F.BU, 'mst-bu'], [F.NU, 'mst-nu'], [F.TA, 'mst-ta'], [F.Q, 'mst-q'], [F.X0, 'mst-ck'], [F.X1, 'mst-ck on']];
const RX = { heading: /^(#{1,3})[ \t]+/, checkbox: /^([ \t]*(?:[-*][ \t]+)?)(\[[ xX]?\])(?=[ \t]|$)/, bullet: /^[ \t]*([-*])[ \t]+/, number: /^[ \t]*(\d+\.)[ \t]+/, quote: /^[ \t]*(>)[ \t]?/,
  bold: /\*\*(?=\S)(.+?)(?<=\S)\*\*/g, itS: /(?<![*\\])\*(?![*\s])(.+?)(?<![*\s])\*(?!\*)/g, itU: /(?<![A-Za-z0-9_])_(?![_\s])(.+?)(?<![_\s])_(?![A-Za-z0-9_])/g, strike: /~~(?=\S)(.+?)(?<=\S)~~/g,
  under: /<u>(.+?)<\/u>/g, code: /`([^`\n]+)`/g, link: /\[([^\]\n]+)\]\(([^)\s]+)\)/g, url: /https?:\/\/[^\s)>\]]+/g };
/* repère la syntaxe : un tableau de drapeaux par caractère (le texte n'est jamais modifié) */
function scan(text) {
  const fl = new Array(text.length).fill(0), urls = {}, set = (s, e, f) => { for (let i = s; i < e; i++) fl[i] |= f; };
  let pos = 0;
  for (const line of text.split('\n')) {
    const L = line.length, o = pos; pos += L + 1; if (!L) continue;
    if (line.trimStart().startsWith('|')) { set(o, o + L, F.TA); for (let i = 0; i < L; i++) if (line[i] === '|') set(o + i, o + i + 1, F.M); continue; }
    let m;
    if ((m = RX.heading.exec(line))) { set(o, o + L, [F.H1, F.H2, F.H3][m[1].length - 1]); set(o, o + m[0].length, F.M); }
    else if ((m = RX.checkbox.exec(line))) {
      const bs = o + m[1].length, ck = /x/i.test(m[2]); set(bs, bs + m[2].length, ck ? F.X1 : F.X0); if (ck) set(o + m[0].length, o + L, F.S); if (m[1].length) set(o, bs, F.M);
    } else if ((m = RX.bullet.exec(line))) set(o + m[0].indexOf(m[1]), o + m[0].indexOf(m[1]) + 1, F.BU);
    else if ((m = RX.number.exec(line))) set(o + m[0].indexOf(m[1]), o + m[0].indexOf(m[1]) + m[1].length, F.NU);
    else if ((m = RX.quote.exec(line))) { set(o, o + m[0].length, F.M); set(o, o + L, F.Q); }
    const codes = []; for (const c of line.matchAll(RX.code)) { codes.push([c.index, c.index + c[0].length]); set(o + c.index, o + c.index + c[0].length, F.C); set(o + c.index, o + c.index + 1, F.M | F.IM); set(o + c.index + c[0].length - 1, o + c.index + c[0].length, F.M | F.IM); }
    const free = (s, e) => !codes.some(([a, b]) => a < e && s < b);
    const pair = (re, op, cl, f) => { for (const c of line.matchAll(re)) if (free(c.index, c.index + c[0].length)) { set(o + c.index + op, o + c.index + c[0].length - cl, f); set(o + c.index, o + c.index + op, F.M | F.IM); set(o + c.index + c[0].length - cl, o + c.index + c[0].length, F.M | F.IM); } };
    pair(RX.bold, 2, 2, F.B); pair(RX.itS, 1, 1, F.I); pair(RX.itU, 1, 1, F.I); pair(RX.strike, 2, 2, F.S); pair(RX.under, 3, 4, F.U);
    const linked = [];
    for (const c of line.matchAll(RX.link)) if (free(c.index, c.index + c[0].length)) {
      const ts = c.index + 1, te = ts + c[1].length; linked.push([c.index, c.index + c[0].length]); set(o + ts, o + te, F.L); for (let i = ts; i < te; i++) urls[o + i] = c[2];
      set(o + c.index, o + ts, F.M | F.IM); set(o + te, o + c.index + c[0].length, F.M | F.IM);
    }
    for (const c of line.matchAll(RX.url)) if (free(c.index, c.index + c[0].length) && !linked.some(([a, b]) => a < c.index + c[0].length && c.index < b)) { set(o + c.index, o + c.index + c[0].length, F.L); for (let i = 0; i < c[0].length; i++) urls[o + c.index + i] = c[0]; }
  }
  return { fl, urls };
}
/* construit les nœuds d'un texte mis en forme (un nœud par plage de même style) */
function runs(text) {
  const { fl, urls } = scan(text), out = []; let s = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i < text.length && fl[i] === fl[s] && (urls[i] || '') === (urls[s] || '')) continue;
    const seg = text.slice(s, i), f = fl[s];
    if (!f) out.push(document.createTextNode(seg));
    else { const sp = h('span', { class: FC.filter(([b]) => f & b).map(x => x[1]).join(' ') }, seg); sp.dataset.o = String(s); if (urls[s]) sp.dataset.url = urls[s]; out.push(sp); }
    s = i;
  }
  return out;
}
const selOf = el => {
  const s = getSelection(); if (!s.rangeCount || !el.contains(s.anchorNode)) return null;
  const at = (n, o) => { const r = document.createRange(); r.selectNodeContents(el); r.setEnd(n, o); return r.toString().length; };
  const a = at(s.anchorNode, s.anchorOffset), b = at(s.focusNode, s.focusOffset); return { s: Math.min(a, b), e: Math.max(a, b) };
};
function setSel(el, s, e = s) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, acc = 0, a = null, b = null;
  while ((n = tw.nextNode())) { const L = n.data.length; if (!a && s <= acc + L) a = [n, s - acc]; if (!b && e <= acc + L) { b = [n, e - acc]; break; } acc += L; }
  const r = document.createRange(); if (!a) { r.selectNodeContents(el); r.collapse(false); } else { r.setStart(...a); b ? r.setEnd(...b) : r.setEnd(...a); }
  const g = getSelection(); g.removeAllRanges(); g.addRange(r);
}
/* éditeur : le texte reste du Markdown, mis en forme en direct ; le curseur et l'annulation sont gérés ici */
function editor(el, n, o) {
  let composing = false, hist = [{ t: n.body, s: n.body.length, e: n.body.length }], hi = 0, hT = 0;
  const paint = sel => {
    el.replaceChildren(...runs(n.body)); if (n.body.endsWith('\n')) el.append(h('br', { 'data-pad': '' }));
    if (sel && document.activeElement === el) setSel(el, sel.s, sel.e);
  };
  const push = sel => { const now = performance.now(); const e = { t: n.body, s: sel.s, e: sel.e }; hist = hist.slice(0, hi + 1);
    if (now - hT < 700 && hi > 0) hist[hi] = e; else { hist.push(e); hi = hist.length - 1; } hT = now; if (hist.length > 120) { hist.shift(); hi--; } };
  const commit = (t, sel) => { n.body = t; touch(n); paint(sel); hT = 0; push(sel); hT = 0; o.changed(); };
  const go = i => { if (i < 0 || i >= hist.length) return; hi = i; const x = hist[i]; n.body = x.t; touch(n); paint(x); o.changed(); };
  el.setAttribute('contenteditable', 'plaintext-only'); if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
  el.setAttribute('spellcheck', 'false'); el.setAttribute('role', 'textbox'); el.setAttribute('aria-multiline', 'true'); el.dataset.ph = T('Écrivez ici…', 'Write here…');
  paint();
  el.addEventListener('compositionstart', () => { composing = true; });
  el.addEventListener('compositionend', () => { composing = false; el.dispatchEvent(new Event('input')); });
  el.addEventListener('input', () => { if (composing) return; const sel = selOf(el) || { s: 0, e: 0 }; n.body = el.textContent; touch(n); paint(sel); push(sel); o.changed(); });
  el.addEventListener('beforeinput', e => { if (e.inputType === 'historyUndo') { e.preventDefault(); go(hi - 1); } else if (e.inputType === 'historyRedo') { e.preventDefault(); go(hi + 1); } });
  el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, t); });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !composing) { if (newline()) e.preventDefault(); }
    else if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? go(hi + 1) : go(hi - 1); }
    else if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'y') { e.preventDefault(); go(hi + 1); }
  });
  /* liste en cours : Retour continue la puce, la numérotation ou la case ; une ligne vide la termine */
  function newline() {
    const sel = selOf(el); if (!sel || sel.s !== sel.e) return false; const t = n.body, ls = t.lastIndexOf('\n', sel.s - 1) + 1, le = t.indexOf('\n', sel.s), end = le < 0 ? t.length : le, line = t.slice(ls, end);
    const pats = [[/^([ \t]*)([-*])[ \t]+\[[ xX]?\][ \t]+/, m => m[1] + '- [ ] '], [/^([ \t]*)\[[ xX]?\][ \t]+/, m => m[1] + '[ ] '], [/^([ \t]*)([-*])[ \t]+/, m => m[1] + m[2] + ' '], [/^([ \t]*)(\d+)\.[ \t]+/, m => m[1] + (parseInt(m[2], 10) + 1) + '. ']];
    for (const [re, mk] of pats) { const m = re.exec(line); if (!m) continue;
      if (m[0].length === line.length) { commit(t.slice(0, ls) + t.slice(end), { s: ls, e: ls }); return true; }
      const pre = mk(m), at = sel.s; commit(t.slice(0, at) + '\n' + pre + t.slice(at), { s: at + 1 + pre.length, e: at + 1 + pre.length }); return true; }
    return false;
  }
  el.addEventListener('click', e => {
    const c = e.target.closest('.mst-ck'); if (c && el.contains(c)) { e.preventDefault(); const i = +c.dataset.o, t = n.body, end = t.indexOf(']', i) + 1, on = /x/i.test(t.slice(i, end)); commit(t.slice(0, i) + (on ? '[ ]' : '[x]') + t.slice(end), selOf(el) || { s: 0, e: 0 }); sfx.tick(); return; }
    const l = e.target.closest('.mst-l'); if (l && el.contains(l) && !e.altKey && l.dataset.url) { e.preventDefault(); toast({ icon: appIcon(ID), title: ID, body: T('Lien ouvert dans le navigateur : ', 'Link opened in the browser: ') + l.dataset.url.replace(/^https?:\/\//, '') }); sfx.pop(); }
  });
  const api = {
    text: () => n.body,
    wrap(l, r = l) {
      const t = n.body, sel = selOf(el) || { s: t.length, e: t.length }, { s, e } = sel, mid = t.slice(s, e);
      if (mid.length >= l.length + r.length && mid.startsWith(l) && mid.endsWith(r)) return commit(t.slice(0, s) + mid.slice(l.length, mid.length - r.length) + t.slice(e), { s, e: e - l.length - r.length });
      if (t.slice(s - l.length, s) === l && t.slice(e, e + r.length) === r) return commit(t.slice(0, s - l.length) + mid + t.slice(e + r.length), { s: s - l.length, e: e - l.length });
      commit(t.slice(0, s) + l + mid + r + t.slice(e), { s: s + l.length, e: e + l.length });
    },
    prefix(p) {
      const t = n.body, sel = selOf(el) || { s: t.length, e: t.length }, a = t.lastIndexOf('\n', sel.s - 1) + 1, bi = t.indexOf('\n', Math.max(sel.e, sel.s)), b = bi < 0 ? t.length : bi;
      const lines = t.slice(a, b).split('\n'), all = lines.every(x => x.startsWith(p)), out = lines.map(x => (all ? x.slice(p.length) : p === '# ' ? p + x.replace(/^#{1,3}[ \t]+/, '') : p + x)).join('\n'), d = out.length - (b - a);
      commit(t.slice(0, a) + out + t.slice(b), { s: Math.max(a, sel.s + (all ? -p.length : p.length)), e: sel.e + d });
    },
    link() {
      const t = n.body, sel = selOf(el) || { s: t.length, e: t.length }, mid = t.slice(sel.s, sel.e) || T('lien', 'link'), ins = `[${mid}](https://)`, st = sel.s + mid.length + 3;
      commit(t.slice(0, sel.s) + ins + t.slice(sel.e), { s: st, e: st + 8 });
    },
    refresh: () => paint(selOf(el)), focus: () => el.focus({ preventScroll: true }), undo: () => go(hi - 1), redo: () => go(hi + 1)
  };
  return api;
}

/* ====================================================================== deck ====================================================================== */
const ANG = { right: 0, left: 180, bottom: 90, top: -90 };
const vert = () => P.edge === 'left' || P.edge === 'right';
const fanLen = c => c * 84 + 150;
const restLen = n => Math.max(40, Math.max(n, 1) * 22 + 16);
function frame() {
  const a = active(), c = Math.min(a.length, 8) + (a.length > 8 ? 1 : 0), T0 = fanned ? 84 : 16, max = (vert() ? VF.b - VF.t : 1600) - 40, len = Math.min(fanned ? fanLen(c) : restLen(a.length), max), cy = (VF.t + VF.b) / 2;
  const f = { right: { x: 1600 - T0, y: cy - len / 2, w: T0, h: len }, left: { x: 0, y: cy - len / 2, w: T0, h: len }, bottom: { x: 800 - len / 2, y: VF.b - T0, w: len, h: T0 }, top: { x: 800 - len / 2, y: VF.t, w: len, h: T0 } }[P.edge];
  return { ...f, len, T0 };
}
function ensureDeck() {
  if (DECK) return DECK;
  DECK = h('div', { class: 'mst-deck', role: 'region', 'aria-label': T('Deck de notes', 'Notes deck') }); $('#layer').append(DECK);
  DECK.addEventListener('pointerenter', () => { if (!P.fanOnClick) sched(true, P.delay * 1000); });
  DECK.addEventListener('pointerleave', e => { if (!e.buttons && !handleDrag) sched(false, 300); });
  DECK.addEventListener('click', e => { if (!fanned && !e.target.closest('.mst-it')) { sfx.tick(); sched(true, 0); } });
  return DECK;
}
let handleDrag = false;
function sched(v, d) {
  clearTimeout(fanTimer);
  fanTimer = setTimeout(() => { const t = v || P.keepOpen; if (t === fanned) return; if (t) { fanned = true; drawDeck(true); } else { collapse(); } }, d);
}
function collapse() {
  const f = DECK && DECK.querySelector('.mst-fan'); if (f) { f.classList.remove('in'); fanTimer = setTimeout(() => { fanned = false; drawDeck(); }, 230); } else { fanned = false; drawDeck(); }
}
function drawDeck(anim) {
  if (!running) return; const el = ensureDeck(), a = active(), shown = a.slice(0, 8), over = a.length - shown.length, f = frame();
  el.classList.toggle('mst-off', hidden); Object.assign(el.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' });
  el.style.transition = 'left .12s,top .12s,width .12s,height .12s';
  const flip = P.edge === 'top', ordered = P.edge === 'bottom' || P.edge === 'left' ? [...shown].reverse() : shown;
  const can = h('div', { class: 'mst-can', style: { width: f.T0 + 'px', height: f.len + 'px', transform: `translate(-50%,-50%) rotate(${ANG[P.edge]}deg)` } });
  if (!fanned) {
    const rest = h('div', { class: 'mst-rest' + (P.dock === 'pile' ? ' pile' : '') });
    if (!a.length) rest.append(h('i', { class: 'mst-br', style: { background: 'rgba(255,255,255,.35)' } }));
    else if (P.dock === 'pile') rest.append(h('div', { class: 'mst-pl' }, shown.slice(0, 3).map((n, i) => h('i', { style: { background: hex(n.color), top: i * 4 + 'px', right: 2 + i * 1.5 + 'px' } }))));
    else ordered.forEach(n => rest.append(h('i', { class: P.dock === 'dots' ? 'mst-dt' : 'mst-br', style: { background: hex(n.color) } })));
    can.append(rest);
  } else {
    const fan = h('div', { class: 'mst-fan' }); let k = 0; const it = (node, mt) => h('div', { class: 'mst-it', style: { '--i': k++, marginTop: mt || null, zIndex: k } }, node);
    const hd = h('div', { class: 'mst-handle', title: T('Glisser vers un bord de l’écran', 'Drag to a screen edge'), 'aria-label': T('Déplacer le deck', 'Move the deck') }, h('i'), h('i'), h('i'));
    hd.addEventListener('pointerdown', startHandle); fan.append(it(hd));
    ordered.forEach((n, i) => {
      const t = tone(n), vis = 46 + Math.min(i, 7) * 3;
      const card = h('button', { class: 'mst-card' + (flip ? ' flip' : ''), style: { '--c': hex(n.color), '--t': t, width: vis + 24 + 'px' }, title: label(n), 'aria-label': label(n) },
        h('div', { class: 'mst-cf' }, h('div', { class: 'mst-lb' }, n.pinned ? h('i', { class: 'mst-pin', html: PIN }) : null, h('span', {}, title(n).toUpperCase().slice(0, 8))), h('div', { class: 'mst-perf' })));
      card.addEventListener('click', e => { e.stopPropagation(); const r = card.getBoundingClientRect(), s = $('#stage').getBoundingClientRect(); openNote(n.id, { x: (e.clientX - s.left) / S.scale, y: (e.clientY - s.top) / S.scale || (r.top - s.top) / S.scale }); });
      card.addEventListener('contextmenu', e => { e.preventDefault(); macMenu({ x: e.clientX, y: e.clientY }, [{ label: n.pinned ? T('Désépingler', 'Unpin') : T('Épingler', 'Pin'), fn: () => { n.pinned = !n.pinned; touch(); repaint(); } }, { label: T('Archiver', 'Archive'), fn: () => archive([n.id], true) }, { label: T('Supprimer', 'Delete'), danger: 1, fn: () => del([n.id]) }]); });
      fan.append(it(card, '-12px'));
    });
    if (over > 0) fan.append(it(h('button', { class: 'mst-more', onclick: e => { e.stopPropagation(); openAll('active'); } }, '+' + over)));
    fan.append(it(h('button', { class: 'mst-plus', 'aria-label': T('Nouvelle note', 'New note'), title: T('Nouvelle note', 'New note'), html: SVG.plus.replace('stroke-width="1.6"', 'stroke-width="2.2"'), onclick: e => { e.stopPropagation(); newNote(); } })));
    can.append(fan); if (anim) requestAnimationFrame(() => requestAnimationFrame(() => fan.classList.add('in'))); else fan.classList.add('in');
  }
  el.replaceChildren(can);
}
const PIN = '<svg viewBox="0 0 16 16"><path d="M9.5 1.5 14.5 6.5 12.4 7l-2.3 2.3.4 3.2L9.4 13.6 5.7 9.9 2.5 13.1 2 12.6l3.1-3.2-3.7-3.7 1.1-1.1 3.2.4L8.1 2.7z" fill="currentColor"/></svg>';
/* poignée : le deck se glisse vers un autre bord ; l'écran s'assombrit et le bord visé s'allume */
function nearestEdge(x, y) { const d = { left: x, right: 1600 - x, top: y - VF.t, bottom: VF.b - y }; return Object.entries(d).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0][0]; }
function startHandle(e) {
  e.preventDefault(); e.stopPropagation(); handleDrag = true; clearTimeout(fanTimer);
  const z = h('div', { class: 'mst-zones' }, [['t', 'top'], ['b', 'bottom'], ['l', 'left'], ['r', 'right']].map(([c, k]) => h('i', { class: 'mst-z' + c, 'data-e': k }))); $('#layer').append(z); zonesEl = z;
  const st = $('#stage').getBoundingClientRect(), upd = ev => { const x = (ev.clientX - st.left) / S.scale, y = (ev.clientY - st.top) / S.scale, k = nearestEdge(x, y); z.querySelectorAll('i').forEach(i => i.classList.toggle('on', i.dataset.e === k)); return k; };
  let k = upd(e);
  const mv = ev => { k = upd(ev); }, up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); z.remove(); zonesEl = null; handleDrag = false; setEdge(k); sched(false, 400); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
}
function setEdge(k) { if (!k || k === P.edge) return; P.edge = k; sfx.swap && sfx.swap(); drawDeck(); followDeck(); }
function followDeck() { NW.forEach(nw => { applyLayout(nw); const f = noteFrame(nw.w, nw.h, null); nw.x = f.x; nw.y = f.y; place(nw); }); }

/* ====================================================================== notes flottantes ====================================================================== */
const SW = (c, d) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICO = {
  pin: SW(0, '<path d="M9.5 2 14 6.5l-2 .6-2.4 2.4.3 3-1 1-3.2-3.2L2.5 13.5M6 2.5l7.5 7.5"/>'), pinF: PIN, more: '<svg viewBox="0 0 16 16"><circle cx="3.5" cy="8" r="1.4" fill="currentColor"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="12.5" cy="8" r="1.4" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 8 8"><path d="m1.5 1.5 5 5m0-5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>',
  ul: SW(0, '<circle cx="3" cy="4" r=".6"/><circle cx="3" cy="8" r=".6"/><circle cx="3" cy="12" r=".6"/><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/>'), ol: SW(0, '<path d="M2.5 3.5 3.6 3v3M2.4 9.5h2.2l-2.2 2.5h2.4M6.5 4h7M6.5 8h7M6.5 12h7"/>'),
  ck: SW(0, '<rect x="2" y="2" width="12" height="12" rx="2.5"/><path d="m5 8.2 2 2L11 6"/>'), lk: SW(0, '<path d="M7 9a3 3 0 0 0 4.2.2l2-2a3 3 0 0 0-4.2-4.2l-1 1M9 7a3 3 0 0 0-4.2-.2l-2 2a3 3 0 0 0 4.2 4.2l1-1"/>'),
  ar: SW(0, '<path d="M2.5 5.5h11v8.5h-11zM1.5 2.5h13v3h-13zM6 8.5h4"/>'), tr: SW(0, '<path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.5 7v4M9.5 7v4"/>')
};
function noteFrame(w, hh, along) {
  const inset = 90, cy = (VF.t + VF.b) / 2; let x, y;
  if (P.edge === 'right') { x = 1600 - inset - w; y = (along ? along.y : cy) - hh / 2; }
  else if (P.edge === 'left') { x = inset; y = (along ? along.y : cy) - hh / 2; }
  else if (P.edge === 'bottom') { x = (along ? along.x : 800) - w / 2; y = VF.b - inset - hh; }
  else { x = (along ? along.x : 800) - w / 2; y = VF.t + inset; }
  return { x: clamp(x, 8, 1592 - w), y: clamp(y, VF.t + 8, VF.b - hh - 8) };
}
const LAY = { right: 'v', left: 'vr', bottom: 'hz', top: 'hzr' };
const applyLayout = nw => { nw.el.classList.remove('v', 'vr', 'hz', 'hzr'); nw.el.classList.add(LAY[P.edge]); };
const place = nw => Object.assign(nw.el.style, { left: nw.x + 'px', top: nw.y + 'px', width: nw.w + 'px', height: nw.h + 'px' });
const front = nw => { nw.el.style.zIndex = ++zN; if (zN > 700) { zN = 20; NW.forEach(x => { x.el.style.zIndex = ++zN; }); } };
function openNote(id, along, o = {}) {
  const n = note(id); if (!n) return; lastOpened = id;
  if (NW.has(id)) { const nw = NW.get(id); nw.el.hidden = false; front(nw); !reduced() && nw.el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 260 }); nw.ed && nw.ed.focus(); return nw; }
  const w = o.w || 340, hh = o.h || 240, f = o.frame || noteFrame(w, hh, along), nw = { id, x: f.x, y: f.y, w, h: hh, fmt: false };
  const el = h('div', { class: 'mst-note ' + LAY[P.edge], role: 'dialog', 'aria-label': label(n), hidden: hidden }); nw.el = el; NW.set(id, nw);
  const strip = h('div', { class: 'mst-strip' }, h('span', {}, title(n).toUpperCase())), top = h('div', { class: 'mst-top' });
  const colorize = () => { el.style.setProperty('--c', hex(n.color)); el.style.setProperty('--t', tone(n)); };
  const closeB = h('button', { class: 'mst-cx', 'aria-label': T('Fermer', 'Close'), title: T('Fermer', 'Close'), html: ICO.x, onclick: () => closeNote(id) });
  const emo = h('button', { class: 'mst-emo' + (n.emoji ? '' : ' none'), 'aria-label': T('Emoji du titre', 'Title emoji'), title: T('Emoji du titre', 'Title emoji'), 'data-pop': '' }, n.emoji || '☺︎');
  emo.hidden = !P.emoji; emo.onclick = () => popEmoji(emo, n, () => { emo.textContent = n.emoji || '☺︎'; emo.classList.toggle('none', !n.emoji); strip.firstChild.textContent = title(n).toUpperCase(); repaint(); });
  const tin = h('input', { class: 'mst-title', type: 'text', value: n.title, placeholder: T('Titre', 'Title'), 'aria-label': T('Titre', 'Title'), spellcheck: 'false' });
  tin.addEventListener('input', () => { n.title = tin.value; touch(n); strip.firstChild.textContent = title(n).toUpperCase(); el.setAttribute('aria-label', label(n)); repaint(); });
  const pinB = h('button', { class: 'mst-ib' + (n.pinned ? ' on' : ''), 'aria-label': n.pinned ? T('Désépingler la note', 'Unpin the note') : T('Épingler la note', 'Pin the note'), title: n.pinned ? T('Désépingler la note', 'Unpin the note') : T('Épingler la note', 'Pin the note'), html: n.pinned ? ICO.pinF : ICO.pin,
    onclick: () => { n.pinned = !n.pinned; touch(n); sfx.tick(); pinB.classList.toggle('on', n.pinned); pinB.innerHTML = n.pinned ? ICO.pinF : ICO.pin; chrome.classList.toggle('on', n.pinned); repaint(); } });
  const moreB = h('button', { class: 'mst-ib', 'aria-label': T('Couleur, police, archive…', 'Color, font, archive…'), title: T('Couleur, police, archive…', 'Color, font, archive…'), html: ICO.more, 'data-pop': '' });
  const chrome = h('div', { class: 'mst-chrome' + (n.pinned ? ' on' : '') }, pinB, moreB);
  top.append(closeB, emo, tin, chrome);
  const ed = h('div', { class: 'mst-ed' }); nw.ed = editor(ed, n, { changed: () => { strip.firstChild.textContent = title(n).toUpperCase(); repaint(); } });
  ed.style.setProperty('--mf', fontOf(n)); ed.style.setProperty('--mfs', P.size + 'px');
  moreB.onclick = () => popOptions(moreB, n, { colorize, ed, closeNote: () => closeNote(id), refresh: () => { nw.ed.refresh(); } });
  const tools = h('div', { class: 'mst-tools' }); const aa = h('button', { class: 'mst-tb aa', title: T('Mise en forme', 'Formatting'), 'aria-label': T('Mise en forme', 'Formatting') }, 'Aa');
  const fb = [['B', T('Gras', 'Bold'), () => nw.ed.wrap('**'), 'font-weight:900'], ['I', T('Italique', 'Italic'), () => nw.ed.wrap('*'), 'font:italic 700 13px Georgia,serif'], ['U', T('Souligné', 'Underline'), () => nw.ed.wrap('<u>', '</u>'), 'text-decoration:underline'],
    ['S', T('Barré', 'Strikethrough'), () => nw.ed.wrap('~~'), 'text-decoration:line-through'], ['H', T('Titre', 'Heading'), () => nw.ed.prefix('# '), 'font-size:15px'], [ICO.ul, T('Liste à puces', 'Bulleted list'), () => nw.ed.prefix('- ')], [ICO.ol, T('Liste numérotée', 'Numbered list'), () => nw.ed.prefix('1. ')],
    [ICO.ck, T('Cases à cocher', 'Checkboxes'), () => nw.ed.prefix('- [ ] ')], [ICO.lk, T('Lien', 'Link'), () => nw.ed.link()]];
  const fbEls = fb.map(([g, tip, fn, st]) => { const b = h('button', { class: 'mst-tb', title: tip, 'aria-label': tip, style: st ? { cssText: st } : null, onmousedown: e => e.preventDefault(), onclick: () => { fn(); nw.ed.focus(); sfx.tick(); } }); if (g.startsWith('<')) b.innerHTML = g; else b.textContent = g; if (st) b.style.cssText = st; return b; });
  const drawTools = () => { tools.replaceChildren(aa, ...(nw.fmt ? fbEls : [])); aa.classList.toggle('on', nw.fmt); tools.hidden = P.autoTool && !hover && !nw.fmt; };
  let hover = false; aa.onclick = () => { nw.fmt = !nw.fmt; sfx.tick(); drawTools(); }; aa.onmousedown = e => e.preventDefault();
  el.addEventListener('pointerenter', () => { hover = true; if (P.autoTool) drawTools(); }); el.addEventListener('pointerleave', () => { hover = false; if (P.autoTool) drawTools(); });
  nw.drawTools = drawTools; nw.colorize = colorize; nw.title = tin; drawTools(); colorize();
  const body = h('div', { class: 'mst-body' }, top, ed, tools), grip = h('div', { class: 'mst-grip' });
  el.append(strip, body, grip); place(nw); front(nw); $('#layer').append(el);
  el.addEventListener('pointerdown', () => front(nw), true);
  /* déplacement par la languette et la barre de titre */
  const move = e => {
    if (e.button !== 0 || e.target.closest('button,input')) return; e.preventDefault(); const sx = e.clientX, sy = e.clientY, ox = nw.x, oy = nw.y; el.classList.add('drag');
    const mv = ev => { nw.x = clamp(ox + (ev.clientX - sx) / S.scale, -nw.w + 90, 1510); nw.y = clamp(oy + (ev.clientY - sy) / S.scale, VF.t, 840); place(nw); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); el.classList.remove('drag'); }; addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
  strip.addEventListener('pointerdown', move); top.addEventListener('pointerdown', move);
  grip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const sx = e.clientX, sy = e.clientY, ow = nw.w, oh = nw.h; el.classList.add('resizing');
    const mv = ev => { nw.w = clamp(ow + (ev.clientX - sx) / S.scale, 240, 1000); nw.h = clamp(oh + (ev.clientY - sy) / S.scale, 150, 800); place(nw); }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); el.classList.remove('resizing'); };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  /* raccourcis dans la note */
  el.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Escape') { e.preventDefault(); popClose(); closeNote(id); return; }
    if (!mod) return;
    if (e.shiftKey && e.key === 'Backspace') { e.preventDefault(); del([id]); }
    else if (e.key === ']') { e.preventDefault(); neighbor(id, 1); } else if (e.key === '[') { e.preventDefault(); neighbor(id, -1); }
    else if (e.key === '.') { e.preventDefault(); const cs = colors(), i = cs.indexOf(n.color); n.color = cs[(i + 1) % cs.length]; touch(n); colorize(); repaint(); sfx.tick(); }
    else if (e.key.toLowerCase() === 'b') { e.preventDefault(); nw.ed.wrap('**'); } else if (e.key.toLowerCase() === 'i') { e.preventDefault(); nw.ed.wrap('*'); } else if (e.key.toLowerCase() === 'u') { e.preventDefault(); nw.ed.wrap('<u>', '</u>'); }
    else if (e.key === ',') { e.preventDefault(); openSettings(); }
  });
  !reduced() && el.animate([{ opacity: 0, transform: `translate(${P.edge === 'right' ? 70 : P.edge === 'left' ? -70 : 0}px,${P.edge === 'bottom' ? 70 : P.edge === 'top' ? -70 : 0}px) scale(.94)` }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.9,.3,1.1)' });
  sfx.open(); if (o.focus !== false) setTimeout(() => (n.title || n.body ? nw.ed.focus() : tin.focus({ preventScroll: true })), 60);
  return nw;
}
const fontOf = n => `"${n.font || P.font}",` + (/Menlo/.test(n.font || P.font) ? 'monospace' : /Georgia/.test(n.font || P.font) ? 'serif' : /Avenir/.test(n.font || P.font) ? 'system-ui,sans-serif' : '"Segoe Print","Marker Felt","Comic Sans MS",cursive');
function closeNote(id) {
  const nw = NW.get(id); if (!nw) return; NW.delete(id); popClose(); const n = note(id);
  if (reduced()) nw.el.remove(); else nw.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate(${P.edge === 'right' ? 50 : P.edge === 'left' ? -50 : 0}px,${P.edge === 'bottom' ? 50 : P.edge === 'top' ? -50 : 0}px) scale(.94)` }], { duration: 180, easing: 'ease-in' }).onfinish = () => nw.el.remove();
  nw.el.style.pointerEvents = 'none'; sfx.close(); void n;
}
function neighbor(id, d) { const a = active(), i = a.findIndex(n => n.id === id); if (i < 0 || a.length < 2) return; const nx = a[(i + d + a.length) % a.length], nw = NW.get(id); closeNote(id); openNote(nx.id, null, { frame: nw ? { x: nw.x, y: nw.y } : null, w: nw && nw.w, h: nw && nw.h }); }
function peek(ms = 2400) { sched(true, 0); setTimeout(() => { if (running && DECK && !DECK.matches(':hover') && !handleDrag && !P.keepOpen) sched(false, 0); }, ms); }
function newNote() {
  const n = addNote({ color: colors()[0] }); sfx.pop(); repaint(); peek(1800); openNote(n.id, null, { focus: true });
}
function archive(ids, v) { ids.forEach(id => { const n = note(id); if (n) { n.archived = v; touch(n); if (v) closeNote(id); } }); sfx.pop(); repaint(); }
function del(ids) {
  const gone = ids.map(id => ({ n: note(id), i: all().findIndex(x => x.id === id) })).filter(x => x.n); if (!gone.length) return;
  gone.forEach(g => { all().splice(all().indexOf(g.n), 1); closeNote(g.n.id); }); touch(); sfx.close(); repaint();
  undoToast(gone.length > 1 ? T(`${gone.length} notes supprimées`, `${gone.length} notes deleted`) : T('Note supprimée', 'Note deleted'), () => { gone.sort((a, b) => a.i - b.i).forEach(g => all().splice(Math.min(g.i, all().length), 0, g.n)); touch(); sfx.pop(); repaint(); });
}
function undoToast(msg, fn) {
  clearTimeout(toastTimer); toastEl && toastEl.remove();
  const b = h('button', { onclick: () => { fn(); gone(); } }, T('Annuler', 'Undo')); toastEl = h('div', { class: 'mst-toast', role: 'status' }, h('span', {}, msg), b); $('#layer').append(toastEl);
  const gone = () => { clearTimeout(toastTimer); toastEl && toastEl.remove(); toastEl = null; }; toastTimer = setTimeout(gone, 10000);
}

/* ----- fenêtres volantes : options et emoji ----- */
let POP = null;
function popClose() { if (POP) { POP.el.remove(); removeEventListener('pointerdown', POP.away, true); removeEventListener('keydown', POP.key, true); POP = null; } }
function popOpen(anchor, node, o = {}) {
  popClose(); const el = h('div', { class: 'mst-pop', role: 'dialog' }, node); $('#layer').append(el);
  const s = $('#stage').getBoundingClientRect(), r = anchor.getBoundingClientRect(), w = el.offsetWidth, hh = el.offsetHeight;
  let x = (r.left - s.left) / S.scale + (r.width / S.scale) / 2 - w / 2, y = (r.bottom - s.top) / S.scale + 6; if (y + hh > 892) y = (r.top - s.top) / S.scale - hh - 6;
  el.style.left = clamp(x, 8, 1592 - w) + 'px'; el.style.top = clamp(y, 34, 892 - hh) + 'px';
  const away = e => { if (!el.contains(e.target) && !e.target.closest('[data-pop]')) popClose(); }, key = e => { if (e.key === 'Escape') { e.stopPropagation(); popClose(); } };
  setTimeout(() => addEventListener('pointerdown', away, true), 0); addEventListener('keydown', key, true); POP = { el, away, key }; return el;
}
function popEmoji(anchor, n, done) {
  if (POP) return popClose();
  popOpen(anchor, h('div', {}, h('div', { class: 'mst-emg' }, EMOJIS.map(e => h('button', { onclick: () => { n.emoji = e; touch(n); popClose(); sfx.tick(); done(); } }, e))), h('button', { class: 'mst-lnk', onclick: () => { n.emoji = ''; touch(n); popClose(); done(); } }, T('Aucun emoji', 'No emoji'))));
}
function popOptions(anchor, n, ctx) {
  if (POP) return popClose();
  const sw = h('div', { class: 'mst-sw' }, colors().map(c => h('button', { class: n.color === c ? 'on' : '', 'aria-label': c, onclick: () => { n.color = c; touch(n); ctx.colorize(); repaint(); sfx.tick(); [...sw.children].forEach(b => b.classList.toggle('on', b.getAttribute('aria-label') === c)); } }, h('i', { style: { background: hex(c) } }))));
  const fs = h('select', { class: 'mlkx-field', 'aria-label': T('Police', 'Font'), style: { background: 'var(--ctl)', color: 'var(--ink)', minHeight: '28px', padding: '0 8px', borderRadius: '6px' } }, h('option', { value: '' }, T('Police du système', 'System font')), FONTS.map(f => h('option', { value: f }, f)));
  fs.value = n.font || ''; fs.onchange = () => { n.font = fs.value || null; touch(n); ctx.ed.style.setProperty('--mf', fontOf(n)); };
  popOpen(anchor, h('div', { style: { width: '190px' } }, h('div', { class: 'mst-eb' }, T('COULEUR', 'COLOR')), sw, h('div', { class: 'mst-eb' }, T('POLICE', 'FONT')), fs, h('div', { class: 'mst-sep' }),
    h('button', { class: 'mst-act', onclick: () => { popClose(); archive([n.id], !n.archived); }, html: ICO.ar + '<span></span>' }), h('button', { class: 'mst-act dg', onclick: () => { popClose(); del([n.id]); }, html: ICO.tr + '<span></span>' })));
  const acts = POP.el.querySelectorAll('.mst-act span'); acts[0].textContent = n.archived ? T('Désarchiver', 'Unarchive') : T('Archiver', 'Archive'); acts[1].textContent = T('Supprimer la note', 'Delete note');
}

/* ====================================================================== fenêtres Socle ====================================================================== */
const AS = { q: '', filter: 'all', sel: new Set(), anchor: null, msg: null };
function openAll(filter) {
  if (filter) AS.filter = filter === 'active' ? 'active' : filter; const ttl = () => (AS.filter === 'archived' ? T('Archive', 'Archive') : T('Toutes les notes', 'All notes'));
  const ex = wm.wins.get('app:' + ID); if (ex) { ex.render && ex.render(); const t = ex.el.querySelector('.wt'); t && (t.textContent = ttl()); return wm.open({ id: 'app:' + ID }); }
  return wm.open({ id: 'app:' + ID, appId: ID, title: ttl(), w: 900, h: 606, minw: 720, minh: 466, cls: 'socle mlkx-win', onclose: w => { w.dead = true; views.delete(w.view); },
    build: w => { w.render = () => { w.body.innerHTML = ''; w.body.append(allUI(w)); const t = w.el.querySelector('.wt'); t && (t.textContent = ttl()); }; return allUI(w); } });
}
function allUI(w) {
  const root = h('div', { class: 'mlkx-root mst-all' }), left = h('div', { class: 'mst-al' }), list = h('div', { class: 'mst-list', role: 'listbox', 'aria-multiselectable': 'true', tabindex: '0' }), pv = h('div', { class: 'mst-pv' });
  const results = () => { const q = AS.q.trim().toLowerCase(); return all().filter(n => (AS.filter === 'all' || (AS.filter === 'active' ? !n.archived : n.archived)) && (!q || (n.title + ' ' + n.emoji + ' ' + n.body).toLowerCase().includes(q))).sort((a, b) => b.updated - a.updated); };
  const chosen = () => results().filter(n => AS.sel.has(n.id));
  const search = h('input', { class: 'mlkx-field', type: 'search', placeholder: T('Rechercher dans les titres, les textes et les emoji', 'Search titles, texts and emoji'), 'aria-label': T('Rechercher', 'Search'), value: AS.q });
  search.addEventListener('input', () => { AS.q = search.value; drawList(); drawPv(); drawFoot(); });
  const seg = h('div', { class: 'mlkx-seg', role: 'group', style: { width: '100%' } }); const paintSeg = () => { seg.replaceChildren(...[['all', T('Toutes', 'All')], ['active', T('Actives', 'Active')], ['archived', T('Archivées', 'Archived')]].map(([k, l]) => h('button', { style: { flex: '1' }, 'aria-pressed': String(AS.filter === k), onclick: () => { AS.filter = k; AS.sel.clear(); paintSeg(); drawList(); drawPv(); drawFoot(); const t = w.el.querySelector('.wt'); t && (t.textContent = k === 'archived' ? T('Archive', 'Archive') : T('Toutes les notes', 'All notes')); } }, l))); }; paintSeg();
  const foot = h('div', { class: 'mst-alf' });
  const drawList = () => {
    const keep = list.scrollTop, rs = results(); list.replaceChildren();
    if (!rs.length) list.append(h('div', { class: 'mst-ale' }, AS.q ? T('Aucune note ne correspond.', 'No note matches.') : T('Aucune note.', 'No notes.')));
    rs.forEach(n => { const on = AS.sel.has(n.id);
      const r = h('div', { class: 'mst-r' + (on ? ' on' : ''), role: 'option', 'aria-selected': String(on), 'data-id': n.id }, h('i', { class: 'mst-cb', style: { background: hex(n.color) } }),
        h('div', { class: 'mst-rt' }, h('span', { class: 'mst-rn' }, label(n)), h('span', { class: 'mst-rm' }, h('span', {}, fmtDate(n.updated)), n.archived ? h('span', { class: 'wn' }, T('Archivées', 'Archived')) : null, n.pinned ? h('i', { html: PIN, style: { display: 'contents' } }) : null)));
      r.addEventListener('click', e => { const ids = rs.map(x => x.id); if (e.shiftKey && AS.anchor) { const a = ids.indexOf(AS.anchor), b = ids.indexOf(n.id); AS.sel = new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)); } else if (e.metaKey || e.ctrlKey) { AS.sel.has(n.id) ? AS.sel.delete(n.id) : AS.sel.add(n.id); AS.anchor = n.id; } else { AS.sel = new Set([n.id]); AS.anchor = n.id; } sfx.tick(); drawList(); drawPv(); drawFoot(); });
      r.addEventListener('dblclick', () => openNote(n.id)); list.append(r); }); list.scrollTop = keep;
  };
  list.addEventListener('keydown', e => { const rs = results(); const i = rs.findIndex(n => AS.sel.has(n.id));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const nx = rs[clamp((i < 0 ? -1 : i) + (e.key === 'ArrowDown' ? 1 : -1), 0, rs.length - 1)]; if (nx) { AS.sel = new Set([nx.id]); AS.anchor = nx.id; drawList(); drawPv(); drawFoot(); const r = list.querySelector(`[data-id="${nx.id}"]`); if (r) { const t = r.offsetTop; if (t < list.scrollTop) list.scrollTop = t; else if (t + r.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = t + r.offsetHeight - list.clientHeight; } } }
    else if (e.key === 'Enter' && chosen().length === 1) openNote(chosen()[0].id); else if ((e.key === 'Delete' || e.key === 'Backspace') && chosen().length) askDel(); else if ((e.metaKey || e.ctrlKey) && e.key === 'a') { e.preventDefault(); AS.sel = new Set(rs.map(n => n.id)); drawList(); drawPv(); drawFoot(); } });
  function askDel() { const c = chosen(); if (!c.length) return; sheet(root, { title: T(`Supprimer ${c.length} note(s) ?`, `Delete ${c.length} note(s)?`), text: T('Vous aurez 10 secondes pour annuler.', 'You will have 10 seconds to undo.'), buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Supprimer', 'Delete'), kind: 'tdg', fn: () => { AS.sel.clear(); del(c.map(n => n.id)); } }] }); }
  function exportTo(kind) { const c = chosen().length ? chosen() : results(); const n = kind === 'single' || kind === 'archive' ? 1 : c.length; AS.msg = T(`${n} fichier(s) écrit(s).`, `${n} file(s) written.`); sfx.done(); drawFoot(); setTimeout(() => { AS.msg = null; if (!w.dead) drawFoot(); }, 4000); }
  const exp = h('button', { class: 'mlkx-btn', 'data-pop': '', onclick: () => macMenu(exp, [{ label: T('Markdown (un .md par note)', 'Markdown (one .md per note)'), fn: () => exportTo('md') }, { label: T('Texte brut (un .txt par note)', 'Plain text (one .txt per note)'), fn: () => exportTo('txt') }, { label: T('Fichier unique (toutes les notes)', 'Single file (all notes)'), fn: () => exportTo('single') }, { label: T('Archive .stickies (réimportable)', '.stickies archive (re-importable)'), fn: () => exportTo('archive') }], { align: 'left' }) }, T('Exporter', 'Export'), h('span', { html: SVG.down, style: { width: '10px', height: '10px', display: 'block', opacity: '.7' } }));
  function drawFoot() {
    const c = chosen(), rs = results(); foot.replaceChildren(); exp.disabled = !rs.length && !c.length;
    foot.append(h('div', { class: 'mst-fr' }, exp, h('button', { class: 'mlkx-btn', onclick: () => { const n = addNote({ title: T('Note importée', 'Imported note'), emoji: '📥', color: 'blue', body: T('Importée depuis une archive .stickies.', 'Imported from a .stickies archive.') }); AS.msg = T('1 note(s) ajoutée(s).', '1 note(s) added.'); AS.sel = new Set([n.id]); sfx.done(); repaint(); setTimeout(() => { AS.msg = null; if (!w.dead) drawFoot(); }, 4000); } }, T('Importer…', 'Import…')),
      h('span', { style: { flex: '1' } }), h('button', { class: 'mlkx-btn ter', disabled: !c.length, onclick: askDel }, T('Supprimer', 'Delete'))),
      h('div', { class: 'mlkx-meta' }, AS.msg || T(`${rs.length} notes · ${c.length} sélectionnées`, `${rs.length} notes · ${c.length} selected`)));
  }
  function drawPv() {
    const c = chosen(); pv.replaceChildren(); pv.classList.toggle('mst-pvn', c.length !== 1);
    if (c.length !== 1) { pv.append(h('span', {}, c.length ? T(`${c.length} notes sélectionnées`, `${c.length} notes selected`) : T('Sélectionnez une note pour la lire.', 'Select a note to read it.'))); return; }
    const n = c[0], body = h('div', { class: 'mst-pb' }, ...runs(n.body));
    pv.append(h('div', { class: 'mst-ph' }, h('h3', { class: 'mlkx-heading' }, label(n)), h('button', { class: 'mlkx-btn pri', onclick: () => openNote(n.id) }, T('Ouvrir', 'Open')), h('button', { class: 'mlkx-btn', onclick: () => { archive([n.id], !n.archived); } }, n.archived ? T('Désarchiver', 'Unarchive') : T('Archiver', 'Archive'))), body);
  }
  left.append(h('div', { class: 'mst-alh' }, search, seg), list, foot); root.append(left, pv);
  const view = { paint: () => { if (!w.dead) { drawList(); drawPv(); drawFoot(); } } }; w.view = view; views.add(view);
  drawList(); drawPv(); drawFoot(); return root;
}

/* ----- Réglages ----- */
function openSettings(tab) {
  const ex = wm.wins.get('app:' + ID + ':set'); if (ex) { wm.open({ id: 'app:' + ID + ':set' }); return; }
  wm.open({ id: 'app:' + ID + ':set', appId: ID, title: T('Réglages de mSTICK', 'mSTICK Settings'), w: 520, h: 606, resizable: false, cls: 'socle mlkx-win', onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => { let tb = tab || 'general'; w.render = () => { w.stop && w.stop(); w.body.innerHTML = ''; w.body.append(setUI(w, () => tb, v => { tb = v; })); const t = w.el.querySelector('.wt'); t && (t.textContent = T('Réglages de mSTICK', 'mSTICK Settings')); }; return setUI(w, () => tb, v => { tb = v; }); } });
}
function setUI(w, getTab, setTab) {
  const root = h('div', { class: 'mlkx-root mst-set' }), sc = h('div', { class: 'mst-sc' }), tabs = h('div', { class: 'mst-tabs' });
  let stopRec = null; w.stop = () => { stopRec && stopRec(); stopRec = null; recHot = false; };
  const chk = (lab, get, set) => { const b = h('button', { class: 'mlkx-chk', role: 'checkbox', 'aria-checked': String(!!get()), onclick: () => { const v = !get(); set(v); b.setAttribute('aria-checked', String(v)); sfx.tick(); } }, h('i', { html: SVG.check }), h('span', {}, lab)); return b; };
  const sec = (lab, ...k) => h('section', { class: 'mst-sec' }, h('div', { class: 'mlkx-eyebrow' }, lab), h('div', { class: 'mst-sb' }, ...k));
  const row = (lab, ctl) => h('div', { class: 'mst-row' }, h('span', {}, lab), ctl);
  const dd = (val, opts, on) => { const b = h('button', { class: 'mst-dd', 'data-pop': '' }); const cur = () => (opts.find(o => o[0] === val()) || opts[0])[1]; const paint = () => { b.replaceChildren(h('span', {}, cur()), h('i', { html: SVG.down, style: { display: 'contents' } })); }; paint();
    b.onclick = () => (menuOpenFor(b) ? closeMenus() : macMenu(b, opts.map(([k, l]) => ({ label: l, check: k === val(), fn: () => { on(k); paint(); } })), { align: 'left' })); return b; };
  const folder = (path, on) => h('div', { class: 'mst-fold' }, h('span', { class: 'mlkx-monosm' }, path || T('Aucun dossier choisi', 'No folder chosen')), h('button', { class: 'mlkx-btn', disabled: !on, onclick: () => { sfx.tick(); } }, T('Choisir…', 'Choose…')));
  const general = () => [
    sec(T('DECK', 'DECK'),
      row(T('Position', 'Position'), dd(() => P.edge, EDGES.map(e => [e, { right: T('Bord droit', 'Right edge'), left: T('Bord gauche', 'Left edge'), bottom: T('Bas de l’écran', 'Bottom of the screen'), top: T('Haut de l’écran', 'Top of the screen') }[e]]), v => setEdge(v))),
      row(T('Aspect au repos', 'Look at rest'), dd(() => P.dock, [['stripes', T('Languettes', 'Stripes')], ['dots', T('Points', 'Dots')], ['pile', T('Petite pile', 'Small pile')]], v => { P.dock = v; drawDeck(); })),
      row(T('Écrans', 'Screens'), dd(() => 'main', [['main', T('Écran principal', 'Main screen')]], () => {})),
      chk(T('Garder le deck ouvert', 'Keep the deck open'), () => P.keepOpen, v => { P.keepOpen = v; if (v) { fanned = true; drawDeck(true); } else sched(false, 200); }),
      chk(T('Éventail au clic plutôt qu’au survol', 'Fan on click instead of hover'), () => P.fanOnClick, v => { P.fanOnClick = v; }),
      chk(T('Afficher sur les applis en plein écran', 'Show over full-screen apps'), () => P.fullscreen, v => { P.fullscreen = v; }),
      row(T('Délai d’activation', 'Activation delay'), (() => { const v = h('span', { class: 'v' }, P.delay.toFixed(2) + ' s'), r = h('input', { type: 'range', min: '0', max: '1', step: '.05', value: String(P.delay), 'aria-label': T('Délai d’activation', 'Activation delay') }); r.oninput = () => { P.delay = +r.value; v.textContent = P.delay.toFixed(2) + ' s'; }; return h('span', { class: 'mst-rg' }, r, v); })())),
    sec(T('NOTES', 'NOTES'),
      row(T('Police des notes', 'Notes font'), dd(() => P.font, FONTS.map(f => [f, f]), v => { P.font = v; NW.forEach(nw => { const n = note(nw.id); n && nw.el.querySelector('.mst-ed').style.setProperty('--mf', fontOf(n)); }); })),
      row(T('Taille du texte', 'Text size'), dd(() => String(P.size), [10, 12, 14, 16, 18, 20, 24].map(s => [String(s), s + ' pt']), v => { P.size = +v; NW.forEach(nw => nw.el.querySelector('.mst-ed').style.setProperty('--mfs', P.size + 'px')); })),
      chk(T('Masquer la barre d’outils hors survol', 'Hide the toolbar when not hovering'), () => P.autoTool, v => { P.autoTool = v; NW.forEach(nw => nw.drawTools()); }),
      chk(T('Bouton emoji dans le titre', 'Emoji button in the title'), () => P.emoji, v => { P.emoji = v; NW.forEach(nw => { nw.el.querySelector('.mst-emo').hidden = !v; }); }),
      (() => { const wrap = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }), paint = () => { wrap.replaceChildren(h('span', { style: { color: 'var(--t)' } }, T('Couleurs personnalisées', 'Custom colors')),
        h('div', { class: 'mst-cs' }, ...P.custom.map(c => h('button', { class: 'mst-cc', style: { background: c }, title: T('Cliquer pour retirer cette couleur', 'Click to remove this color'), 'aria-label': c, onclick: () => { P.custom = P.custom.filter(x => x !== c); paint(); } })), cp, h('button', { class: 'mlkx-btn', style: { minHeight: '32px' }, onclick: () => { const v = cp.value.toUpperCase(); if (!P.custom.includes(v)) { P.custom.push(v); sfx.pop(); paint(); } } }, T('Ajouter', 'Add')))); }, cp = h('input', { type: 'color', value: '#ffd966', 'aria-label': T('Couleur', 'Color') }); paint(); return wrap; })()),
    sec(T('SYSTÈME', 'SYSTEM'), chk(T('Icône dans la barre des menus', 'Menu bar icon'), () => P.menubar, v => { P.menubar = v; menubarIcon(); }), chk(T('Démarrer à l’ouverture de session', 'Start at login'), () => P.login, v => { P.login = v; }))];
  const keyboard = () => { const msg = h('div', { class: 'mst-hint dg' });
    return [sec(T('RACCOURCIS GLOBAUX', 'GLOBAL SHORTCUTS'), ...ACTIONS.map(a => { const box = h('div', { class: 'mst-hk' }); const names = { newNote: T('Nouvelle note', 'New note'), reopenLast: T('Rouvrir la dernière note', 'Reopen the last note'), allNotes: T('Toutes les notes', 'All notes'), archive: T('Archive', 'Archive'), moveDeck: T('Déplacer le deck', 'Move the deck'), hideAll: T('Masquer deck et notes', 'Hide deck and notes') };
      const paint = (rec, m) => { box.replaceChildren(); const b = h('button', { class: 'mlkx-btn', onclick: () => { if (rec) { stop(); } else begin(); } }, rec ? T('Appuyez sur un raccourci…', 'Press a shortcut…') : P.hot[a] ? hotLabel(P.hot[a]) : T('Aucun', 'None'));
        box.append(h('div', { class: 'mst-hr' }, b, P.hot[a] && JSON.stringify(P.hot[a]) !== JSON.stringify(DEF_HOT[a]) && !rec ? h('button', { class: 'mlkx-btn ter', style: { minHeight: '32px' }, onclick: () => { P.hot[a] = { ...DEF_HOT[a] }; paint(); } }, T('Rétablir', 'Reset')) : null)); if (m) box.append(h('div', { class: 'mst-hint dg' }, m)); };
      function stop() { stopRec && stopRec(); stopRec = null; recHot = false; paint(false); }
      function begin() { stopRec && stopRec(); recHot = true; paint(true); stopRec = recordHotkey(r => { if (r.type === 'cancel') return stop(); if (r.type === 'clear') { P.hot[a] = null; return stop(); }
        if (r.type === 'need') return paint(true, T('Ajoutez ⌘, ⌥ ou ⌃.', 'Add ⌘, ⌥ or ⌃.'));
        const own = ACTIONS.find(x => x !== a && P.hot[x] && hotLabel(P.hot[x]) === hotLabel(r.hk)); if (own) return paint(true, T(`Déjà utilisé par « ${names[own]} ».`, `Already used by “${names[own]}”.`)); P.hot[a] = r.hk; sfx.pop(); stop(); }); }
      paint(false); return row(names[a], box); }),
      h('div', { class: 'mst-hint' }, T('Dans une note : Échap ferme, ⌘] et ⌘[ changent de note, ⌘. change la couleur, ⇧⌘⌫ supprime.', 'In a note: Esc closes, ⌘] and ⌘[ switch notes, ⌘. changes the color, ⇧⌘⌫ deletes.'))), msg]; };
  const data_ = () => { const sm = h('div', { class: 'mst-hint' });
    return [sec(T('SYNCHRONISATION', 'SYNC'), chk(T('Synchroniser entre mes Mac', 'Sync between my Macs'), () => P.sync, v => { P.sync = v; sm.textContent = ''; }), folder(P.syncPath, true),
      h('div', { class: 'mst-hint' }, T('Un fichier .hmnote par note dans le dossier choisi (iCloud Drive par défaut). Ces fichiers ne sont pas chiffrés : la clé de chiffrement reste sur ce Mac.', 'One .hmnote file per note in the chosen folder (iCloud Drive by default). These files are not encrypted: the encryption key stays on this Mac.')),
      h('div', { class: 'mst-fr', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('button', { class: 'mlkx-btn', onclick: () => { sm.textContent = T('Synchronisé à l’instant.', 'Synced just now.'); sfx.done(); } }, T('Synchroniser maintenant', 'Sync now')), sm)),
      sec(T('DOSSIER MARKDOWN', 'MARKDOWN FOLDER'), chk(T('Copier chaque note en .md', 'Copy each note as .md'), () => P.md, v => { P.md = v; }), folder(P.mdPath, true), h('div', { class: 'mst-hint', html: bhtml(T('Par exemple un coffre Obsidian. Seuls les fichiers créés par mSTICK sont modifiés.', 'For example an Obsidian vault. Only files created by mSTICK are modified.'), ID, BRAND) })),
      sec(T('CONFIDENTIALITÉ', 'PRIVACY'), h('div', { style: { color: 'var(--tm)', lineHeight: '18px' } }, T('Vos notes sont chiffrées (AES-GCM) sur ce Mac, la clé est dans votre Trousseau. Aucun compte, aucun serveur, aucune télémétrie : l’appli n’ouvre une connexion que pour chercher une mise à jour.', 'Your notes are encrypted (AES-GCM) on this Mac, the key is in your Keychain. No account, no server, no telemetry: the app only opens a connection to look for an update.')))]; };
  const updates = () => [sec(T('MISES À JOUR', 'UPDATES'), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), () => P.auto, v => { P.auto = v; }),
    h('button', { class: 'mlkx-btn', style: { alignSelf: 'flex-start' }, onclick: () => toast({ icon: appIcon(ID), title: ID, body: T('mSTICK est à jour.', 'mSTICK is up to date.') }) }, T('Rechercher les mises à jour…', 'Check for updates…')), h('div', { class: 'mlkx-meta' }, T('Version 1.0.0 (1)', 'Version 1.0.0 (1)')))];
  const draw = () => { w.stop(); tabs.replaceChildren(h('div', { class: 'mlkx-seg', role: 'tablist' }, [['general', T('Général', 'General')], ['keyboard', T('Clavier', 'Keyboard')], ['data', T('Données', 'Data')], ['updates', T('Mises à jour', 'Updates')]].map(([k, l]) => h('button', { role: 'tab', 'aria-pressed': String(getTab() === k), onclick: () => { setTab(k); draw(); } }, l))));
    sc.replaceChildren(...{ general, keyboard, data: data_, updates }[getTab()]()); sc.scrollTop = 0; };
  root.append(tabs, sc); draw(); return root;
}

/* ====================================================================== barre des menus, raccourcis, cycle de vie ====================================================================== */
const STICK_SVG = '<svg viewBox="0 0 18 18"><path d="M3.5 16h11V7.5L10.5 3h-7z" fill="currentColor"/><path d="M10.5 3v4.5h4z" fill="currentColor" opacity=".45"/></svg>';
function menuItems(app) {
  const hk = a => (P.hot[a] ? hotLabel(P.hot[a]) : null), EN = { right: T('Bord droit', 'Right edge'), left: T('Bord gauche', 'Left edge'), bottom: T('Bas de l’écran', 'Bottom of the screen'), top: T('Haut de l’écran', 'Top of the screen') };
  return [{ label: T('Nouvelle note', 'New note'), badge: hk('newNote'), fn: newNote }, { label: T('Toutes les notes…', 'All notes…'), badge: hk('allNotes'), fn: () => openAll('all') }, { label: T('Archive…', 'Archive…'), badge: hk('archive'), fn: () => openAll('archived') }, { sep: 1 },
    { label: T('Placer le deck', 'Place the deck'), sub: [...EDGES.map(e => ({ label: EN[e], check: P.edge === e, fn: () => setEdge(e) })), { sep: 1 }, { label: T('Écran principal', 'Main screen'), check: true, fn: () => {} }] },
    { label: T('Déplacer le deck', 'Move the deck'), badge: hk('moveDeck'), fn: () => setEdge(nextEdge()) },
    { label: hidden ? T('Afficher le deck et les notes', 'Show the deck and notes') : T('Masquer le deck et les notes', 'Hide the deck and notes'), badge: hk('hideAll'), fn: toggleHide }, { sep: 1 },
    { label: T('Réglages…', 'Settings…'), fn: () => openSettings() }, { label: T('Rechercher les mises à jour…', 'Check for updates…'), fn: () => toast({ icon: appIcon(ID), title: ID, body: T('mSTICK est à jour.', 'mSTICK is up to date.') }) },
    { label: T('À propos de mSTICK', 'About mSTICK'), fn: () => aboutWin(app, { brandColor: BRAND, tagline: () => T('Des notes adhésives rangées au bord de votre écran, chiffrées et toujours à portée de main.', 'Sticky notes tucked at the edge of your screen, encrypted and always within reach.'), credit: () => T('Inspirée de Hold My Notes, sans lien avec ses auteurs.', 'Inspired by Hold My Notes, not affiliated with its authors.'), version: '1.0.0' }) },
    { label: T('Quitter mSTICK', 'Quit mSTICK'), fn: () => quit() }];
}
const nextEdge = () => ({ right: 'bottom', bottom: 'left', left: 'top', top: 'right' }[P.edge]);
function toggleHide() { hidden = !hidden; DECK && DECK.classList.toggle('mst-off', hidden); NW.forEach(nw => { nw.el.hidden = hidden; }); sfx.tick(); }
function perform(a) {
  if (a === 'newNote') newNote(); else if (a === 'reopenLast') { const id = note(lastOpened) ? lastOpened : (active()[0] || {}).id; id && openNote(id); }
  else if (a === 'allNotes') openAll('all'); else if (a === 'archive') openAll('archived'); else if (a === 'moveDeck') setEdge(nextEdge()); else if (a === 'hideAll') toggleHide();
}
function menubarIcon() {
  if (!extra) return; if (P.menubar) { if (!S.extras.has(ID)) { S.extras.set(ID, { el: extra, quit }); emit('extras'); } } else if (S.extras.has(ID)) { S.extras.delete(ID); emit('extras'); }
}
const hotKey = e => {
  if (e.repeat || recHot || !(e.ctrlKey || e.altKey || e.metaKey)) return;
  const a = ACTIONS.find(k => P.hot[k] && hotMatch(e, P.hot[k])); if (!a) return; e.preventDefault(); e.stopPropagation(); perform(a);
};
const outside = e => { if (fanned && P.fanOnClick && !P.keepOpen && DECK && !DECK.contains(e.target)) sched(false, 0); };
const onLang = () => { closeMenus(); popClose(); drawDeck(); const open = [...NW.values()].map(nw => ({ id: nw.id, f: { x: nw.x, y: nw.y }, w: nw.w, h: nw.h })); open.forEach(o => { const nw = NW.get(o.id); nw.el.remove(); NW.delete(o.id); }); open.forEach(o => openNote(o.id, null, { frame: o.f, w: o.w, h: o.h, focus: false })); };
function quit() {
  closeMenus(); popClose(); clearTimeout(fanTimer); clearTimeout(toastTimer); NW.forEach(nw => nw.el.remove()); NW.clear(); DECK && DECK.remove(); DECK = null; zonesEl && zonesEl.remove(); toastEl && toastEl.remove(); toastEl = null;
  [...wm.wins.values()].filter(w => w.appId === ID).forEach(w => wm.close(w.id)); removeEventListener('keydown', hotKey, true); removeEventListener('pointerdown', outside, true); bus.removeEventListener('lang', onLang);
  running = false; fanned = false; hidden = false; extra = null; S.extras.delete(ID); emit('extras'); sfx.close();
}
function install(app) {
  running = true; fanned = false; extra = h('button', { class: 'mb extra mst-xicon', 'aria-label': ID, html: STICK_SVG });
  extra.onclick = () => { if (menuOpenFor(extra)) closeMenus(); else { sfx.click(); macMenu(extra, menuItems(app)); } };
  S.extras.set(ID, { el: extra, quit }); emit('extras'); menubarIcon(); sfx.open(); drawDeck();
  addEventListener('keydown', hotKey, true); addEventListener('pointerdown', outside, true); bus.addEventListener('lang', onLang);
  toast({ icon: appIcon(ID), title: ID, body: T('Passez la souris sur le bord droit de l’écran : les notes se déploient. Un clic ouvre une note.', 'Move the pointer to the right edge of the screen: the notes fan out. Click to open one.') });
  setTimeout(() => { if (running && !fanned && !handleDrag) peek(2600); }, 700);
}
export async function open(app) {
  await cssReady(CSS2); data();
  if (running) return openAll('active');
  install(app);
}
