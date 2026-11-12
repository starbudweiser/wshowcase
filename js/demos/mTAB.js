/* Réplique interactive de mTAB : le sélecteur de fenêtres de macOS. Six fenêtres fictives dans une scène ; ⌥⇥ (ou ⌘⇥, ou le bouton « Ouvrir ») ouvre le sélecteur,
   Tab / flèches / souris choisissent, Entrée valide, Échap annule, S cherche, W ferme, M réduit, Q quitte l'app. Trois styles : vignettes, icônes, titres.
   Tout est en mémoire : aucune fenêtre réelle n'est lue, rien n'est envoyé. */
import { h, T, css, wm, sfx, toast, icon, brand } from './kit.js';

const CSS = 'css/demos/mTAB.css', ID = 'mTAB';
const WIN = () => [
  { id: 'notes', app: T('Carnet', 'Notes'), title: T('Plan de tournage', 'Shooting plan'), c: '#fbbf24', g: '✎' },
  { id: 'edit', app: T('Éditeur', 'Editor'), title: 'rapport-trimestriel.md', c: '#38bdf8', g: '¶' },
  { id: 'web', app: T('Navigateur', 'Browser'), title: T('Documentation — Mise en route', 'Documentation — Getting started'), c: '#4ade80', g: '◎' },
  { id: 'term', app: 'Terminal', title: T('build — 12 tests réussis', 'build — 12 tests passed'), c: '#9ca3af', g: '>_', min: true },
  { id: 'photo', app: 'Photos', title: T('Vacances en Bretagne', 'Brittany holiday'), c: '#f87171', g: '▣' },
  { id: 'chat', app: 'Messages', title: T('Équipe projet', 'Project team'), c: '#7dd3fc', g: '✉', space: 2 }
];
const PLACE = [[4, 6], [14, 14], [24, 22], [34, 30], [44, 38], [54, 46]];
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function open(app) {
  css(CSS);
  return wm.open({ id: 'app:' + ID, appId: app.id, title: 'mTAB', w: 940, h: 640, cls: 'socle mtab-win', build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  const W0 = WIN(), S = { wins: W0, z: W0.map(x => x.id), style: 'thumbs', preview: true, release: 'select', open: false, sel: 1, q: '', searching: false, hint: true };
  const root = h('div', { class: 'mtab' }), stage = h('div', { class: 'mtab-stage', tabindex: '0' }), over = h('div', { class: 'mtab-over', hidden: true });
  const byId = id => S.wins.find(x => x.id === id);
  const list = () => S.z.map(byId).filter(Boolean).filter(x => !S.q || fold(x.title + ' ' + x.app).includes(fold(S.q)));

  /* ---- fenêtre fictive (utilisée dans la scène et dans les vignettes : tailles en em) ---- */
  const mock = (x, extra = '') => h('div', { class: 'mw ' + extra, style: { '--c': x.c } },
    h('div', { class: 'mw-bar' }, h('i'), h('i'), h('i'), h('b', {}, x.title)),
    h('div', { class: 'mw-body' }, h('div', { class: 'mw-hero' }), ...[78, 64, 90, 52, 70].map(p => h('div', { class: 'mw-line', style: { width: p + '%' } }))));
  const badge = x => h('span', { class: 'mtab-badges' },
    x.min ? h('em', {}, T('Réduite', 'Minimized')) : null, x.space ? h('em', { class: 'sp' }, 'Space ' + x.space) : null);

  /* ---- scène ---- */
  function drawStage() {
    stage.querySelectorAll('.mtab-win-s').forEach(e => e.remove());
    const sel = S.open && S.preview ? list()[S.sel] : null;
    [...S.z].reverse().forEach(id => {
      const x = byId(id); if (!x || x.min) return;
      const i = S.wins.indexOf(x), [l, t] = PLACE[i];
      stage.append(h('div', { class: 'mtab-win-s' + (sel && sel.id === id ? ' prev' : ''), style: { left: l + '%', top: t + '%' }, onclick: () => front(id) }, mock(x)));
    });
  }
  function front(id) { S.z = [id, ...S.z.filter(z => z !== id)]; const x = byId(id); if (x) x.min = false; draw(); }

  /* ---- sélecteur ---- */
  function cell(x, i) {
    const on = i === S.sel;
    const c = h('div', { class: 'mtab-cell' + (on ? ' on' : ''), role: 'option', 'aria-selected': String(on), 'aria-label': x.app + ', ' + x.title, onmouseenter: () => { if (S.moved && S.sel !== i) { S.sel = i; draw(); } }, onclick: () => commit(i) });
    const ico = h('span', { class: 'mtab-ico', style: { background: x.c } }, x.g);
    if (S.style === 'thumbs') c.append(h('div', { class: 'mtab-hd' }, ico, h('span', {}, x.title)), h('div', { class: 'mtab-th' }, mock(x, 'sm'), badge(x)));
    else if (S.style === 'icons') c.append(h('span', { class: 'mtab-ico big', style: { background: x.c } }, x.g), badge(x));
    else c.append(ico, h('span', { class: 'mtab-tt' }, x.title), h('span', { class: 'mtab-ap' }, x.app), badge(x));
    return c;
  }
  function drawOver() {
    over.hidden = !S.open; if (!S.open) return;
    const l = list(); S.sel = Math.max(0, Math.min(S.sel, l.length - 1));
    const grid = h('div', { class: 'mtab-grid ' + S.style, role: 'listbox' }, ...l.map(cell));
    const sb = h('div', { class: 'mtab-sb' }, h('span', {}, S.searching ? (S.q || T('Tapez pour rechercher', 'Type to search')) + '▏' : T('S pour rechercher', 'S to search')));
    over.replaceChildren(h('div', { class: 'mtab-panel' }, sb, l.length ? grid : h('div', { class: 'mtab-none' }, T('Aucun résultat', 'No results'))));
    if (S.style === 'icons' && l[S.sel]) over.firstChild.append(h('div', { class: 'mtab-cap' }, h('b', {}, l[S.sel].title), h('span', {}, l[S.sel].app)));
  }
  function show() { S.open = true; S.q = ''; S.searching = false; S.moved = false; S.sel = list().length > 1 ? 1 : 0; stage.focus(); draw(); sfx.open(); }
  function hide() { S.open = false; draw(); }
  function commit(i = S.sel) { const x = list()[i]; hide(); if (x) { front(x.id); sfx.click(); } }
  function move(d) { const n = list().length; if (n) { S.sel = ((S.sel + d) % n + n) % n; S.moved = false; draw(); sfx.tick(); } }
  function act(k) {
    const x = list()[S.sel]; if (!x) return;
    if (k === 'w') S.wins = S.wins.filter(y => y !== x), S.z = S.z.filter(z => z !== x.id);
    if (k === 'm') x.min = !x.min;
    if (k === 'q') { S.wins = S.wins.filter(y => y.app !== x.app); S.z = S.z.filter(z => byId(z)); }
    if (!S.wins.length) { S.wins = WIN(); S.z = S.wins.map(y => y.id); toast({ icon: icon(app.id), title: 'mTAB', body: T('Fenêtres rétablies pour la démo.', 'Windows restored for the demo.') }); }
    draw(); sfx.tick();
  }
  stage.addEventListener('keydown', e => {
    const k = e.key;
    if (!S.open) { if (k === 'Tab' || (k === ' ' && e.altKey)) { e.preventDefault(); show(); } return; }
    if (S.searching) {
      if (k === 'Escape') { e.preventDefault(); S.searching = false; S.q = ''; draw(); return; }
      if (k === 'Backspace') { S.q = S.q.slice(0, -1); S.sel = 0; draw(); return; }
      if (k.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); S.q += k; S.sel = 0; draw(); return; }
    }
    if (k === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
    else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (k === 'Enter') { e.preventDefault(); commit(); }
    else if (k === 'Escape') { e.preventDefault(); hide(); }
    else if (!S.searching && k.toLowerCase() === 's') { e.preventDefault(); S.searching = true; draw(); }
    else if (!S.searching && 'wmq'.includes(k.toLowerCase())) { e.preventDefault(); act(k.toLowerCase()); }
  });
  stage.addEventListener('keyup', e => { if (S.open && S.release === 'select' && e.key === 'Alt') commit(); });
  over.addEventListener('pointermove', () => { S.moved = true; }, { once: false });
  over.addEventListener('click', e => { if (e.target === over) hide(); });

  /* ---- barre d'outils (réglages principaux) ---- */
  const seg = (opts, get, set) => h('div', { class: 'mtab-seg' }, ...opts.map(([v, l]) => h('button', { type: 'button', class: get() === v ? 'on' : '', onclick: () => { set(v); sfx.tick(); draw(); } }, l)));
  const bar = h('div', { class: 'mtab-bar' });
  function drawBar() {
    bar.replaceChildren(
      h('span', { class: 'mtab-name', html: brand('mTAB', '#38bdf8') }),
      h('label', {}, T('Style', 'Style')), seg([['thumbs', T('Vignettes', 'Thumbnails')], ['icons', T('Icônes', 'Icons')], ['titles', T('Titres', 'Titles')]], () => S.style, v => (S.style = v)),
      h('label', {}, T('Relâcher les touches', 'Releasing the keys')), seg([['select', T('Change de fenêtre', 'Switches window')], ['keep', T('Garde ouvert', 'Keeps open')]], () => S.release, v => (S.release = v)),
      h('button', { type: 'button', class: 'mtab-chk' + (S.preview ? ' on' : ''), onclick: () => { S.preview = !S.preview; draw(); } }, h('i'), T('Aperçu en taille réelle', 'Full-size preview')),
      h('button', { type: 'button', class: 'mtab-open', onclick: show }, T('Ouvrir le sélecteur', 'Open the switcher')));
  }
  const tip = h('div', { class: 'mtab-tip' });
  function drawTip() {
    tip.textContent = S.open ? T('Tab ou flèches : choisir · Entrée : valider · Échap : annuler · S : chercher · W : fermer · M : réduire · Q : quitter l’app', 'Tab or arrows: choose · Enter: confirm · Esc: cancel · S: search · W: close · M: minimize · Q: quit app')
      : T('Cliquez dans la scène, puis appuyez sur Tab (ou sur « Ouvrir le sélecteur »). Dans l’appli : ⌘⇥ ou ⌥⇥.', 'Click the stage, then press Tab (or “Open the switcher”). In the app: ⌘⇥ or ⌥⇥.');
  }
  function draw() { if (!alive()) return; drawBar(); drawStage(); drawOver(); drawTip(); }

  stage.append(over);
  root.append(bar, stage, tip);
  draw();
  return root;
}
