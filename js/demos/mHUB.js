/* Réplique interactive de mHUB : la bibliothèque du Desktop Mac Toolkit. Toutes les applis du kit, leur état (à jour, mise à jour, non installée),
   Ouvrir, Installer / Mettre à jour (progression simulée), recherche, catégories. Rien n'est téléchargé : les états et les installations sont fictifs. */
import { h, brand, T, css, toast, icon, sfx, wm, S, launch, download, wait, reduced } from './kit.js';
import { winOf, titleOf } from './engine.js';
import { tag, lang } from '../i18n.js';

const CSS = 'css/demos/mHUB.css';
const UPD = new Set(['mCLEAN', 'mPDF']);          // mises à jour disponibles dans la démo
let state = null;                                  // id → 'ok' | 'upd' | 'new' | 'dev' | 'busy'

export function open(app) {
  css(CSS);
  const c = { w: 1060, h: 650 };
  const list = () => S.apps.filter(a => (a.space === 'util' || a.space === 'pro') && a.id !== 'mHUB' && (a.download || a.id === 'mCASTING'));
  if (!state) { state = {}; list().forEach(a => { state[a.id] = !a.download ? 'dev' : UPD.has(a.id) ? 'upd' : 'ok'; }); }
  return winOf(app, c, w => {
    let cat = 'all', q = '', sel = list()[0], checked = T('il y a 20 min', '20 min ago');
    const root = h('div', { class: 'skw mhub nosb' }), side = h('aside', { class: 'mh-side' }), main = h('main', { class: 'mh-main' }), det = h('aside', { class: 'mh-det' });
    const checkBtn = h('button', { class: 'sbtn', onclick: async () => { checkBtn.disabled = true; checkBtn.textContent = '…'; sfx.click(); await wait(reduced() ? 0 : 900); checked = T('à l’instant', 'just now'); checkBtn.disabled = false; checkBtn.textContent = T('Vérifier', 'Check'); sfx.done(); toast({ icon: icon('mHUB'), title: 'mHUB', body: upd() ? T(upd() + ' mise(s) à jour disponible(s).', upd() + ' update(s) available.') : T('Tout est à jour.', 'Everything is up to date.') }); draw(); } }, T('Vérifier', 'Check'));
    root.append(titleOf(app, w, h('span', { class: 'mh-sub' }, 'DESKTOP MAC TOOLKIT')), h('div', { class: 'mh-body' }, side, main, det));
    const upd = () => list().filter(a => state[a.id] === 'upd').length;
    const folderOf = a => { const sp = S.spaces.find(s => s.id === a.space); const f = ((sp && sp.folders) || []).find(f => f.apps.includes(a.id)); return f ? (f.name[lang()] || f.name.en) : (sp && (sp.name[lang()] || sp.name.en)) || ''; };
    const cats = () => { const m = new Map(); list().forEach(a => { const n = folderOf(a); m.set(n, (m.get(n) || 0) + 1); }); return [...m]; };
    const filt = () => list().filter(a => {
      const s = state[a.id];
      if (cat === 'inst' && !(s === 'ok' || s === 'upd')) return false;
      if (cat === 'upd' && s !== 'upd') return false;
      if (cat === 'new' && s !== 'new' && s !== 'dev') return false;
      if (cat.startsWith('c:') && folderOf(a) !== cat.slice(2)) return false;
      return !q || (a.id + ' ' + tag(a)).toLowerCase().includes(q.toLowerCase());
    }).sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()));
    const chip = a => { const s = state[a.id]; return h('span', { class: 'mh-chip ' + s }, s === 'ok' ? '✓ ' + T('À jour', 'Up to date') : s === 'upd' ? T('Mise à jour', 'Update') : s === 'busy' ? '…' : s === 'dev' ? T('En développement', 'In development') : T('Non installée', 'Not installed')); };
    async function install(a) {
      if (state[a.id] === 'busy') return; const was = state[a.id]; state[a.id] = 'busy'; sfx.click(); draw();
      const bar = root.querySelector(`[data-id="${a.id}"] .mh-bar i`);
      for (let p = 0; p <= 100; p += 10) { await wait(reduced() ? 0 : 90); const b = root.querySelector(`[data-id="${a.id}"] .mh-bar i`); b && (b.style.width = p + '%'); }
      state[a.id] = 'ok'; sfx.done(); toast({ icon: icon(a.id), title: 'mHUB', body: was === 'upd' ? T(a.id + ' est à jour.', a.id + ' is up to date.') : T(a.id + ' est installée.', a.id + ' is installed.') }); draw();
    }
    const actions = a => {
      const s = state[a.id];
      if (s === 'busy') return h('div', { class: 'mh-bar' }, h('i'));
      return h('div', { class: 'mh-act' },
        s === 'upd' || s === 'new' ? h('button', { class: 'sbtn acc', onclick: e => { e.stopPropagation(); install(a); } }, s === 'upd' ? T('Mettre à jour', 'Update') : T('Installer', 'Install')) : null,
        s === 'dev' ? h('button', { class: 'sbtn', disabled: true }, T('Bientôt', 'Soon')) : h('button', { class: 'sbtn', onclick: e => { e.stopPropagation(); launch(a.id); } }, T('Ouvrir', 'Open')));
    };
    const drawSide = () => {
      side.innerHTML = '';
      const row = (id, label, n) => h('button', { class: 'mh-nav' + (cat === id ? ' on' : ''), onclick: () => { cat = id; sfx.tick(); draw(); } }, h('span', {}, label), h('em', {}, String(n)));
      const L = list(), n = s => L.filter(a => s.includes(state[a.id])).length;
      side.append(h('div', { class: 'mh-h' }, T('BIBLIOTHÈQUE', 'LIBRARY')), row('all', T('Toutes', 'All'), L.length), row('inst', T('Installées', 'Installed'), n(['ok', 'upd'])), row('upd', T('Mises à jour', 'Updates'), upd()), row('new', T('Non installées', 'Not installed'), n(['new', 'dev'])),
        h('div', { class: 'mh-h' }, T('CATÉGORIES', 'CATEGORIES')), ...cats().map(([k, v]) => row('c:' + k, k, v)),
        h('div', { class: 'mh-foot' }, upd() ? h('button', { class: 'sbtn acc', onclick: async () => { for (const a of list().filter(x => state[x.id] === 'upd')) await install(a); } }, T('Tout mettre à jour', 'Update all')) : h('span', { class: 'ok' }, T('Tout est à jour', 'Everything is up to date'))));
    };
    const drawMain = () => {
      main.innerHTML = '';
      main.append(h('div', { class: 'mh-top' }, h('input', { class: 'sfind', type: 'search', value: q, placeholder: T('Chercher une appli…', 'Search apps…'), 'aria-label': 'search', oninput: e => { q = e.target.value; drawMain(); } }),
        h('span', { class: 'mut mh-chk' }, T('Vérifié ', 'Checked ') + checked), checkBtn));
      const grid = h('div', { class: 'mh-grid' });
      filt().forEach(a => grid.append(h('div', { class: 'mh-card' + (sel === a ? ' on' : ''), 'data-id': a.id, tabindex: 0, onclick: () => { sel = a; sfx.tick(); draw(); } },
        h('div', { class: 'mh-ch' }, h('img', { src: icon(a.id), alt: '' }), h('div', {}, h('b', { html: brand(a.id, a.accent) }), chip(a))), h('p', { class: 'mut' }, tag(a)), actions(a))));
      if (!grid.children.length) grid.append(h('p', { class: 'mut' }, T('Aucune appli.', 'No apps.')));
      main.append(grid);
    };
    const drawDet = () => {
      det.innerHTML = ''; if (!sel) return;
      det.append(h('div', { class: 'mh-dh' }, h('img', { src: icon(sel.id), alt: '' }), h('div', {}, h('b', { html: brand(sel.id, sel.accent) }), chip(sel))), h('p', { class: 'mut' }, tag(sel)),
        ...[[T('Catégorie', 'Category'), folderOf(sel)], [T('Version', 'Version'), sel.version || '—'], [T('Dossier', 'Folder'), 'Applications Personnelles']].map(([k, v]) => h('div', { class: 'mh-kv' }, h('span', { class: 'mut' }, k), h('b', {}, v))),
        actions(sel), h('button', { class: 'sbtn', onclick: () => download(sel), disabled: !sel.download }, 'GitHub'));
    };
    const draw = () => { drawSide(); drawMain(); drawDet(); };
    draw(); return root;
  });
}
