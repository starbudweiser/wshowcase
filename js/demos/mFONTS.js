/* Réplique interactive de mFONTS : gestionnaire de polices. Bibliothèque, collections, listes intelligentes, activation, aperçu modifiable, taille, grille / liste,
   filtres, favoris, inspecteur (styles, glyphes, collections), ajout de polices. Les polices s'affichent avec celles installées sur votre ordinateur ; rien n'est lu ni envoyé. */
import { css, h, T, win, bar, sw, dialog, toast, icon, sfx, S, clamp } from './tk.js';
const CSS = 'css/demos/mFONTS.css';
const F = (n, st, cls, cols, o = {}) => ({ n, st, cls, cols, ...o });
const FONTS = [
  F('Apple Chancery', 1, 'script', ['Posters'], { ff: '"Apple Chancery","Snell Roundhand",cursive' }), F('Baskerville', 4, 'serif', ['Editorial'], { dup: 1, ff: 'Baskerville,"Baskerville Old Face",serif' }),
  F('Bodoni 72', 3, 'serif', ['Posters', 'Editorial'], { ff: '"Bodoni 72","Bodoni MT",serif' }), F('Bradley Hand', 1, 'script', ['Posters'], { ff: '"Bradley Hand","Segoe Print",cursive' }),
  F('Chalkduster', 1, 'display', ['Posters'], { ff: 'Chalkduster,"Comic Sans MS",fantasy' }), F('Copperplate', 3, 'display', ['Posters', 'Brand guidelines'], { ff: 'Copperplate,"Copperplate Gothic Light",fantasy' }),
  F('Didot', 3, 'serif', ['Editorial', 'Posters'], { ff: 'Didot,"Bodoni MT",serif' }), F('Futura', 5, 'sans', ['Posters', 'Brand guidelines'], { ff: 'Futura,"Century Gothic","Trebuchet MS",sans-serif' }),
  F('Georgia', 4, 'serif', ['Editorial', 'Web UI'], { dup: 1, ff: 'Georgia,serif' }), F('Gill Sans', 6, 'sans', ['Brand guidelines', 'Editorial'], { ff: '"Gill Sans","Gill Sans MT",sans-serif', hid: 1 }),
  F('Helvetica Neue', 9, 'sans', ['Web UI', 'Brand guidelines'], { ff: '"Helvetica Neue",Helvetica,Arial,sans-serif' }), F('Herculanum', 1, 'display', ['Posters'], { ff: 'Herculanum,fantasy' }),
  F('Hoefler Text', 4, 'serif', ['Editorial'], { ff: '"Hoefler Text","Palatino Linotype",serif' }), F('Impact', 1, 'display', ['Posters'], { ff: 'Impact,"Arial Narrow Bold",sans-serif' }),
  F('Luminari', 1, 'display', ['Posters'], { ff: 'Luminari,fantasy' }), F('Menlo', 4, 'mono', ['Web UI'], { ff: 'Menlo,Consolas,monospace' }),
  F('Optima', 5, 'sans', ['Editorial', 'Brand guidelines'], { ff: 'Optima,Candara,sans-serif', hid: 1 }), F('Palatino', 4, 'serif', ['Editorial'], { ff: 'Palatino,"Palatino Linotype",serif' }),
  F('Party LET', 1, 'display', ['Posters'], { ff: '"Party LET","Comic Sans MS",fantasy' }), F('Phosphate', 2, 'display', ['Posters'], { ff: 'Phosphate,Impact,fantasy' }),
  F('Rockwell', 4, 'serif', ['Posters', 'Web UI'], { ff: 'Rockwell,"Rockwell Nova","Courier New",serif' }), F('SF Mono', 6, 'mono', ['Web UI'], { ff: '"SF Mono",ui-monospace,Menlo,monospace' }),
  F('Snell Roundhand', 3, 'script', ['Posters'], { ff: '"Snell Roundhand","Segoe Script",cursive' }), F('Trattatello', 1, 'display', ['Posters'], { ff: 'Trattatello,fantasy' }),
  F('Verdana', 4, 'sans', ['Web UI'], { ff: 'Verdana,Geneva,sans-serif' }), F('Zapfino', 1, 'script', ['Posters'], { ff: 'Zapfino,cursive' })
];
const COLS = ['Brand guidelines', 'Editorial', 'Posters', 'Web UI'];
const PREV = () => [T('Portez ce vieux whisky au juge blond qui fume', 'The quick brown fox jumps over the lazy dog'), 'ABCDEFGHIJKLM abcdefghijklm', '0123456789 & @ € ! ? ( )', 'Aa Bb Cc Dd Ee Ff Gg'];
const STY = ['Regular', 'Italic', 'Bold', 'Bold Italic', 'Light', 'Medium', 'Condensed', 'Black', 'Thin'];

export function open(app) {
  css(CSS);
  return win(app, 1060, 660, w => {
    const st = { nav: 'all', q: '', p: 0, custom: '', size: 26, view: 'grid', insp: true, fav: new Set(['Futura', 'Didot']), act: new Set(), rec: [], sel: 'Futura', fs: 'all', fc: 'all', cls: 'all', cache: null };
    const font = n => FONTS.find(f => f.n === n);
    const lib = () => FONTS.filter(f => !f.hid || st.added);
    const root = h('div', { class: 'tk' }), side = h('aside', { class: 'tk-side' }), main = h('div', { class: 'tk-main' }), insp = h('aside', { class: 'mf-insp' });
    const text = () => st.custom || PREV()[st.p];
    const list = () => lib().filter(f => {
      if (st.nav === 'fav' && !st.fav.has(f.n)) return false; if (st.nav === 'rec' && !st.rec.includes(f.n)) return false; if (st.nav === 'dup' && !f.dup) return false;
      if (st.nav === 'act' && !st.act.has(f.n)) return false; if (st.nav === 'ina' && st.act.has(f.n)) return false; if (st.nav === 'auto') return false;
      if (st.nav.startsWith('c:') && !f.cols.includes(st.nav.slice(2))) return false;
      if (st.fs === 'act' && !st.act.has(f.n)) return false; if (st.fs === 'ina' && st.act.has(f.n)) return false;
      if (st.cls !== 'all' && f.cls !== st.cls) return false;
      return !st.q || f.n.toLowerCase().includes(st.q.toLowerCase());
    });
    const toggle = n => { st.act.has(n) ? st.act.delete(n) : (st.act.add(n), st.rec = [n, ...st.rec.filter(x => x !== n)].slice(0, 12)); sfx.tick(); draw(); };
    const nav = (id, g, label, n) => h('button', { class: 'tk-nav' + (st.nav === id ? ' on' : ''), onclick: () => { st.nav = id; sfx.tick(); draw(); } }, h('span', { class: 'g' }, g), label, h('em', {}, String(n)));
    const drawSide = () => {
      side.innerHTML = ''; const L = lib();
      side.append(nav('all', 'Aa', T('Toutes les polices', 'All fonts'), L.reduce((a, f) => a + f.st, 0)), nav('fav', '☆', T('Favoris', 'Favorites'), st.fav.size), nav('rec', '◷', T('Récentes', 'Recent'), st.rec.length), nav('dup', '⧉', T('Doublons', 'Duplicates'), L.filter(f => f.dup).length),
        h('div', { class: 'tk-h' }, T('Bibliothèques', 'Libraries')), h('button', { class: 'tk-nav', onclick: () => { st.nav = 'all'; draw(); } }, h('span', { class: 'g' }, '▤'), 'Mac Supplemental', h('em', {}, String(L.reduce((a, f) => a + f.st, 0)))),
        h('div', { class: 'tk-h' }, T('Listes intelligentes', 'Smart lists')), nav('act', '✓', T('Actives', 'Active'), st.act.size), nav('auto', '✦', T('Activées auto', 'Auto-activated'), 0), nav('ina', '○', T('Inactives', 'Inactive'), L.length - st.act.size),
        h('div', { class: 'tk-h' }, T('Collections', 'Collections')), ...COLS.map(c => nav('c:' + c, '▭', c, L.filter(f => f.cols.includes(c)).length)));
    };
    const card = f => {
      const on = st.act.has(f.n);
      return h('div', { class: 'mf-c' + (st.sel === f.n ? ' on' : ''), onclick: () => { st.sel = f.n; sfx.tick(); draw(); } },
        h('div', { class: 'mf-h' }, h('button', { class: 'mf-dot' + (on ? ' on' : ''), 'aria-label': T('Activer', 'Activate'), title: on ? T('Désactiver', 'Deactivate') : T('Activer', 'Activate'), onclick: e => { e.stopPropagation(); toggle(f.n); } }), h('b', {}, f.n), h('span', {}, ' · ' + f.st + ' ' + (f.st > 1 ? 'styles' : 'style')),
          h('button', { class: 'mf-star' + (st.fav.has(f.n) ? ' on' : ''), 'aria-label': 'favorite', onclick: e => { e.stopPropagation(); st.fav.has(f.n) ? st.fav.delete(f.n) : st.fav.add(f.n); sfx.tick(); draw(); } }, st.fav.has(f.n) ? '★' : '☆')),
        h('div', { class: 'mf-s', style: { fontFamily: f.ff, fontSize: st.size + 'px' } }, text()));
    };
    const drawMain = () => {
      main.innerHTML = ''; const L = list();
      const prevSel = h('select', { class: 'tk-sel', 'aria-label': 'preview', onchange: e => { st.p = +e.target.value; st.custom = ''; draw(); } }, ...[T('Document', 'Document'), T('Alphabet', 'Alphabet'), T('Chiffres', 'Numbers'), 'Aa Bb'].map((l, i) => h('option', { value: i, selected: !st.custom && st.p === i }, l)));
      const tools = h('div', { class: 'mf-tools' }, prevSel, h('input', { class: 'tk-in', value: st.custom, placeholder: T('Texte d’aperçu…', 'Preview text…'), 'aria-label': 'text', oninput: e => { st.custom = e.target.value; drawGrid(); } }),
        h('input', { class: 'mf-rng', type: 'range', min: 14, max: 56, value: st.size, 'aria-label': 'size', oninput: e => { st.size = +e.target.value; drawGrid(); } }), h('span', { class: 'tk-dim' }, st.size + ' pt'), h('span', { class: 'tk-sp' }),
        h('button', { class: 'tk-ico' + (st.view === 'list' ? ' on' : ''), title: T('Liste', 'List'), onclick: () => { st.view = 'list'; sfx.tick(); draw(); } }, '☰'), h('button', { class: 'tk-ico' + (st.view === 'grid' ? ' on' : ''), title: T('Grille', 'Grid'), onclick: () => { st.view = 'grid'; sfx.tick(); draw(); } }, '▦'),
        h('button', { class: 'tk-ico' + (st.insp ? ' on' : ''), title: T('Inspecteur', 'Inspector'), onclick: () => { st.insp = !st.insp; draw(); } }, 'ⓘ'), h('button', { class: 'tk-btn pri', onclick: addFonts }, T('Ajouter des polices', 'Add fonts')));
      const fil = h('div', { class: 'mf-filters' }, h('input', { class: 'tk-in', type: 'search', value: st.q, placeholder: T('Chercher une police…', 'Search fonts…'), 'aria-label': 'search', oninput: e => { st.q = e.target.value; drawGrid(); drawFoot(); drawCount(); } }),
        h('select', { class: 'tk-sel', 'aria-label': 'status', onchange: e => { st.fs = e.target.value; draw(); } }, ...[['all', T('Statut : tous', 'Status: all')], ['act', T('Actives', 'Active')], ['ina', T('Inactives', 'Inactive')]].map(([v, l]) => h('option', { value: v, selected: st.fs === v }, l))),
        h('select', { class: 'tk-sel', 'aria-label': 'class', onchange: e => { st.cls = e.target.value; draw(); } }, ...[['all', T('Propriétés : toutes', 'Properties: all')], ['serif', 'Serif'], ['sans', 'Sans serif'], ['script', 'Script'], ['display', 'Display'], ['mono', 'Monospace']].map(([v, l]) => h('option', { value: v, selected: st.cls === v }, l))),
        h('select', { class: 'tk-sel', 'aria-label': 'lang' }, ...[T('Langue : toutes', 'Language: all'), 'Latin', 'Cyrillic', 'Greek'].map(l => h('option', {}, l))),
        h('span', { class: 'cnt' }, T(`${L.length} sur ${lib().length} familles`, `${L.length} of ${lib().length} families`)));
      main.append(tools, fil, h('div', { class: 'tk-scroll mf-gw', style: { flex: '1' } }), h('div', { class: 'tk-foot' }, h('span', { class: 'ft' }), h('span', { class: 'fr' })));
      drawGrid(); drawFoot();
    };
    const drawCount = () => { const c = main.querySelector('.cnt'); if (c) c.textContent = T(`${list().length} sur ${lib().length} familles`, `${list().length} of ${lib().length} families`); };
    const drawGrid = () => { const g = main.querySelector('.mf-gw'); if (!g) return; g.innerHTML = ''; const L = list(); g.append(L.length ? h('div', { class: 'mf-grid ' + st.view }, ...L.map(card)) : h('p', { class: 'tk-dim', style: { padding: '30px', textAlign: 'center' } }, st.nav === 'auto' ? T('Aucune police activée automatiquement.', 'No auto-activated fonts.') : T('Aucune police.', 'No fonts.'))); };
    const drawFoot = () => { const f = main.querySelector('.ft'), r = main.querySelector('.fr'); if (!f) return; const L = lib(); f.textContent = T(`${L.length} familles · ${L.reduce((a, x) => a + x.st, 0)} styles · ${st.act.size} active(s)`, `${L.length} families · ${L.reduce((a, x) => a + x.st, 0)} styles · ${st.act.size} active`); r.textContent = T(`${list().length} familles affichées`, `${list().length} families shown`); };
    const drawInsp = () => {
      insp.innerHTML = ''; insp.hidden = !st.insp; const f = font(st.sel); if (!f || !st.insp) return; const on = st.act.has(f.n);
      insp.append(h('h4', { style: { fontFamily: f.ff } }, f.n), h('div', { class: 'tk-dim' }, `${f.st} ${f.st > 1 ? 'styles' : 'style'} · ${f.cls} · Latin`),
        h('div', { class: 'mf-s', style: { fontFamily: f.ff, fontSize: '30px', whiteSpace: 'normal' } }, 'Aa'), h('div', { class: 'mf-gl', style: { fontFamily: f.ff } }, ...'ABCDEFGHabcdefgh01234567'.split('').map(c => h('span', {}, c))),
        h('div', { class: 'tk-h', style: { margin: '6px 0 0' } }, 'Styles'), ...STY.slice(0, Math.min(f.st, 5)).map((s, i) => h('div', { class: 'mf-st', style: { fontFamily: f.ff, fontWeight: /Bold|Black/.test(s) ? 700 : /Light|Thin/.test(s) ? 300 : 400, fontStyle: /Italic/.test(s) ? 'italic' : 'normal' } }, h('span', {}, s), h('span', { class: 'tk-dim' }, i ? '' : 'Regular'))),
        h('button', { class: 'tk-btn ' + (on ? '' : 'pri'), onclick: () => toggle(f.n) }, on ? T('Désactiver', 'Deactivate') : T('Activer', 'Activate')),
        h('div', { class: 'tk-h', style: { margin: '8px 0 0' } }, T('Collections', 'Collections')), ...COLS.map(c => h('label', { class: 'mf-col' }, h('input', { type: 'checkbox', checked: f.cols.includes(c), onchange: e => { e.target.checked ? f.cols.push(c) : f.cols.splice(f.cols.indexOf(c), 1); sfx.tick(); drawSide(); drawGrid(); drawFoot(); } }), c)));
    };
    const addFonts = () => dialog(root, T('Ajouter des polices', 'Add fonts'), h('div', { class: 'mf-drop' }, T('Déposez ici des fichiers .ttf, .otf, .ttc ou un dossier. Dans cette démo, deux polices d’exemple sont ajoutées.', 'Drop .ttf, .otf, .ttc files or a folder here. In this demo, two sample fonts are added.')),
      [T('Annuler', 'Cancel')], [T('Ajouter 2 polices', 'Add 2 fonts'), 'pri', () => { st.added = true; sfx.done(); toast({ icon: icon('mFONTS'), title: 'mFONTS', body: T('Gill Sans et Optima ajoutées à la bibliothèque.', 'Gill Sans and Optima added to the library.') }); draw(); }]);
    const draw = () => { drawSide(); drawMain(); drawInsp(); };
    root.append(bar(app, w, h('span', { class: 'tk-sp' }), h('span', { class: 'tk-dim' }, 'DESKTOP MAC TOOLKIT')), h('div', { class: 'tk-body' }, side, main, insp));
    draw(); return root;
  });
}
