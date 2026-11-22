/* Réplique interactive de mTAPES : bibliothèque de prises d'écran. Enregistrer / arrêter (nouvelle prise), filtres (à la main / pilotées par une IA), recherche, détail, exports (GIF README, MP4 1080p, Short 9:16),
   montage (zooms, accélérés, sous-titres modifiables, recalcul automatique, aperçu animé), corbeille. Rien n'est filmé : les prises sont fictives. */
import { css, h, T, win, bar, dialog, toast, icon, sfx, wait, reduced, clamp } from './tk.js';
const CSS = 'css/demos/mTAPES.css';
const fmtT = s => '00:' + String(Math.round(s)).padStart(2, '0');
export function open(app) {
  css(CSS);
  return win(app, 1060, 700, w => {
    const T0 = (id, name, src, dur, kind, who, date, mb, marks, z, sp, cap) => ({ id, name, src, dur, kind, who, date, mb, marks, z, sp, cap, ex: [] });
    const takes = [
      T0(1, T('Visite de la sauvegarde', 'Backup walkthrough'), T('Fenêtre : Sample App', 'Window: Sample App'), 12, 'ai', 'Claude Code', T('16 nov. 2026 à 11:30', '16 Nov 2026 at 11:30'), .4, 3, [[1.85, 2.9, 2.2, .23, .28], [4.85, 5.9, 2.2, .55, .56], [7.85, 8.9, 2.2, .7, .42]], [[8.8, 11.2, 4]], [[2, 'Choisir un dossier'], [5, 'Lancer la sauvegarde'], [8, 'Résultat']]),
      T0(2, T('Ajout d’un raccourci', 'Adding a shortcut'), T('Écran entier', 'Full screen'), 10, 'ai', 'Codex', T('16 nov. 2026 à 10:10', '16 Nov 2026 at 10:10'), .3, 2, [[2.1, 3.2, 2, .4, .3], [6, 7.1, 2.4, .6, .5]], [], [[2.5, 'Ouvrir les réglages'], [6.5, 'Choisir le raccourci']]),
      T0(3, T('Tour des réglages', 'Settings tour'), T('Écran entier', 'Full screen'), 8, 'hand', '', T('15 nov. 2026 à 17:00', '15 Nov 2026 at 17:00'), .5, 0, [], [], [])
    ];
    const st = { f: 'all', q: '', sel: 1, rec: false, t: 0, n: 4 };
    const root = h('div', { class: 'tk' }), body = h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } });
    let iv = 0, pv = 0; const cur = () => takes.find(t => t.id === st.sel);
    const filt = () => takes.filter(t => (st.f === 'all' || t.kind === st.f) && (!st.q || t.name.toLowerCase().includes(st.q.toLowerCase())));
    const rec = () => {
      if (!st.rec) { st.rec = true; st.t = 0; sfx.click(); iv = setInterval(() => { st.t++; if (!root.isConnected) return clearInterval(iv); const e = root.querySelector('.mt-live b'); if (e) e.textContent = fmtT(st.t); }, 1000); draw(); return; }
      clearInterval(iv); st.rec = false; const nid = st.n++, n = { ...takes[takes.length - 1], id: nid, name: T('Prise ', 'Take ') + (nid - 3), dur: Math.max(3, st.t), date: T('à l’instant', 'just now'), mb: +(st.t * .05 + .1).toFixed(1), marks: 0, z: [], sp: [], cap: [], ex: [] }; takes.unshift(n); st.sel = n.id; st.f = 'all'; sfx.done(); toast({ icon: icon('mTAPES'), title: 'mTAPES', body: T('Prise enregistrée : ' + n.name, 'Take saved: ' + n.name) }); draw();
    };
    const auto = t => { t.z = [...Array(Math.max(2, t.cap.length || 2))].map((_, i) => { const a = +(1.5 + i * (t.dur - 3) / Math.max(1, (t.cap.length || 2) - 1)).toFixed(2); return [a, +(a + 1.05).toFixed(2), 2.2, +(.2 + (i * .23) % .6).toFixed(2), +(.25 + (i * .17) % .5).toFixed(2)]; }); t.sp = t.dur > 6 ? [[+(t.dur - 3.2).toFixed(1), +(t.dur - .8).toFixed(1), 4]] : []; if (!t.cap.length) t.cap = [[2, T('Étape 1', 'Step 1')], [Math.min(t.dur - 1, 5), T('Étape 2', 'Step 2')]]; sfx.done(); draw(); };
    const exportTo = async (t, kind) => {
      const names = { gif: ['README GIF', 'readme.gif', .6], mp4: ['Release MP4 1080p', 'release.mp4', 2.4], short: ['Short MP4 9:16', 'short.mp4', 1.6] }; const [lbl, file, mb] = names[kind];
      sfx.click(); const m = dialog(root, T('Export en cours', 'Exporting'), h('div', {}, h('p', {}, lbl), h('div', { class: 'tk-bar2', style: { marginTop: '10px' } }, h('i', { class: 'pg' }))));
      for (let p = 0; p <= 100; p += 10) { await wait(reduced() ? 0 : 140); const b = m.querySelector('.pg'); if (b) b.style.width = p + '%'; } m.remove();
      t.ex.push(`${t.name.replace(/\s+/g, '-').toLowerCase()}-${file} · ${(mb * (t.dur / 12 + .5)).toFixed(1)} MB`); sfx.done(); toast({ icon: icon('mTAPES'), title: 'mTAPES', body: T(lbl + ' exporté.', lbl + ' exported.') }); if (root.isConnected) draw();
    };
    const preview = t => {
      clearInterval(pv); const box = root.querySelector('.mt-pv'); if (!box) return; const winEl = box.querySelector('.win'), cap = box.querySelector('.cap'), cur2 = box.querySelector('.cur'), bar2 = root.querySelector('.mt-pb i'), lab = root.querySelector('.mt-pb b'); let s = 0;
      pv = setInterval(() => { s += .1; if (!root.isConnected || s > t.dur) { clearInterval(pv); winEl.style.transform = ''; cap.textContent = ''; return; }
        const z = t.z.find(z => s >= z[0] && s <= z[1]); winEl.style.transformOrigin = z ? z[3] * 100 + '% ' + z[4] * 100 + '%' : '50% 50%'; winEl.style.transform = z ? `scale(${z[2]})` : ''; const c = [...t.cap].reverse().find(c => s >= c[0] && s <= c[0] + 2.2); cap.textContent = c ? c[1] : '';
        cur2.style.left = 30 + Math.sin(s) * 18 + '%'; cur2.style.top = 40 + Math.cos(s * .8) * 14 + '%'; bar2.style.width = s / t.dur * 100 + '%'; lab.textContent = fmtT(s) + ' / ' + fmtT(t.dur); }, reduced() ? 5 : 100);
    };
    const num = (arr, i, j, step = .05) => h('input', { type: 'number', step, value: arr[i][j], 'aria-label': 'value', onchange: e => { arr[i][j] = +e.target.value; } });
    const detail = t => {
      const d = h('div', { class: 'mt-det' });
      if (!t) return h('div', { class: 'mt-det' }, h('p', { class: 'tk-dim' }, T('Aucune prise sélectionnée.', 'No take selected.')));
      d.append(h('h3', {}, t.name), h('div', { class: 'mt-kv' }, ...[[T('Source', 'Source'), t.src], [T('Durée', 'Duration'), fmtT(t.dur)], [T('Poids brut', 'Raw size'), t.mb + ' MB'], [T('Couleurs', 'Colours'), 'sRGB'], [T('Son', 'Sound'), T('Aucun', 'None')], [T('Actions marquées', 'Marked actions'), String(t.marks)]].map(([k, v]) => [h('span', {}, k), h('b', { style: { fontWeight: 500 } }, v)]).flat()),
        h('h4', {}, 'Exports'), t.ex.length ? h('div', {}, ...t.ex.map(e => h('div', { class: 'mt-exf' }, '✓ ' + e, h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn sm', onclick: () => toast({ icon: icon('mTAPES'), title: 'mTAPES', body: T('Affiché dans le Finder.', 'Shown in Finder.') }) }, T('Afficher', 'Show'))))) : h('p', { class: 'tk-dim' }, T('Aucun export pour l’instant', 'No export yet')),
        h('div', { class: 'mt-ex' }, ...[['gif', 'README GIF'], ['mp4', 'Release MP4 1080p'], ['short', 'Short MP4 9:16']].map(([k, l]) => h('button', { class: 'tk-btn', onclick: () => exportTo(t, k) }, l))),
        h('h4', {}, T('Montage', 'Edit')), h('div', { style: { display: 'flex', gap: '8px' } }, h('button', { class: 'tk-btn', onclick: () => preview(t) }, '▶ ' + T('Aperçu', 'Preview')), h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn', onclick: () => auto(t) }, T('Recalculer automatiquement', 'Recompute automatically'))),
        h('div', { class: 'mt-pv' }, h('div', { class: 'win' }, h('i'), h('i', { style: { width: '60%' } }), h('i', { style: { width: '78%' } })), h('div', { class: 'cur', style: { left: '30%', top: '40%' } }), h('div', { class: 'cap' })), h('div', { class: 'mt-pb' }, h('b', { class: 'tk-mono' }, '00:00 / ' + fmtT(t.dur)), h('div', { class: 'tl' }, h('i', { style: { width: 0 } }))));
      const hd = (l, f) => h('div', { class: 'mt-hd' }, h('b', {}, l), h('button', { onclick: f }, T('Ajouter', 'Add')));
      d.append(hd('Zooms', () => { t.z.push([1, 2, 2.2, .5, .5]); draw(); }), ...t.z.map((z, i) => h('div', { class: 'mt-tb' }, ...['début (s)', 'fin (s)', 'échelle', 'x', 'y'].map((l, j) => h('label', {}, T(l, ['start (s)', 'end (s)', 'scale', 'x', 'y'][j]), num(t.z, i, j))), h('button', { class: 'tk-ico', 'aria-label': 'delete', onclick: () => { t.z.splice(i, 1); draw(); } }, '🗑'))),
        hd(T('Accélérés', 'Speed-ups'), () => { t.sp.push([2, 4, 3]); draw(); }), ...t.sp.map((z, i) => h('div', { class: 'mt-tb', style: { gridTemplateColumns: 'repeat(3,minmax(0,1fr)) 30px' } }, ...['début (s)', 'fin (s)', 'vitesse ×'].map((l, j) => h('label', {}, T(l, ['start (s)', 'end (s)', 'speed ×'][j]), num(t.sp, i, j))), h('button', { class: 'tk-ico', 'aria-label': 'delete', onclick: () => { t.sp.splice(i, 1); draw(); } }, '🗑'))),
        hd(T('Sous-titres', 'Captions'), () => { t.cap.push([1, T('Nouvelle étape', 'New step')]); draw(); }), ...t.cap.map((c, i) => h('div', { class: 'mt-tb', style: { gridTemplateColumns: '90px minmax(0,1fr) 30px' } }, h('label', {}, T('début (s)', 'start (s)'), num(t.cap, i, 0)), h('label', {}, T('texte', 'text'), h('input', { value: c[1], style: { fontFamily: 'inherit', fontWeight: 500 }, 'aria-label': 'caption', onchange: e => { c[1] = e.target.value; } })), h('button', { class: 'tk-ico', 'aria-label': 'delete', onclick: () => { t.cap.splice(i, 1); draw(); } }, '🗑'))));
      return d;
    };
    const draw = () => {
      clearInterval(pv); body.innerHTML = ''; const t = cur(), L = filt();
      body.append(h('div', { class: 'mt-top' }, h('h2', {}, T('Bibliothèque', 'Library')), h('button', { class: 'mt-rec' + (st.rec ? ' on' : ''), onclick: rec }, h('i'), st.rec ? T('Arrêter', 'Stop') : T('Enregistrer', 'Record'))),
        h('div', { class: 'mt-flt' }, ...[['all', T('Toutes les prises', 'All takes')], ['hand', T('À la main', 'Recorded by hand')], ['ai', T('Pilotées par une IA', 'Driven by an AI')]].map(([k, l]) => h('button', { class: 'mt-seg' + (st.f === k ? ' on' : ''), onclick: () => { st.f = k; sfx.tick(); draw(); } }, l)), h('input', { class: 'tk-in', type: 'search', placeholder: T('Chercher une prise', 'Search takes'), value: st.q, 'aria-label': 'search', oninput: e => { st.q = e.target.value; const l = body.querySelector('.mt-list'); if (l) { l.innerHTML = ''; l.append(...rows()); } } })),
        h('div', { class: 'mt-2' }, h('div', { class: 'mt-list' }, ...rows()), detail(L.includes(t) ? t : L[0] || null)),
        st.rec ? h('div', { class: 'mt-live' }, h('span', { class: 'tk-chip dg' }, '● REC'), h('b', {}, fmtT(st.t)), h('span', { class: 'tk-dim' }, T('Enregistrement en silence — l’écran n’est pas filmé dans cette démo.', 'Silent recording — the screen is not filmed in this demo.'))) : h('div', { class: 'mt-foot' }, h('button', { class: 'tk-btn', onclick: () => toast({ icon: icon('mTAPES'), title: 'mTAPES', body: T('Affiché dans le Finder.', 'Shown in Finder.') }) }, T('Afficher dans le Finder', 'Show in Finder')), h('button', { class: 'tk-btn dg', onclick: () => { if (!t) return; dialog(root, T('Mettre à la corbeille ?', 'Move to Trash?'), T('La prise « ' + t.name + ' » sera mise à la corbeille.', 'The take “' + t.name + '” will be moved to the Trash.'), [T('Annuler', 'Cancel')], [T('Corbeille', 'Trash'), 'dg', () => { takes.splice(takes.indexOf(t), 1); st.sel = (takes[0] || {}).id; sfx.tick(); draw(); }]); } }, T('Mettre à la corbeille', 'Move to Trash'))));
    };
    function rows() { return filt().map(t => h('button', { class: 'mt-it' + (st.sel === t.id ? ' on' : ''), onclick: () => { st.sel = t.id; sfx.tick(); draw(); } }, h('b', {}, t.name), h('div', { class: 'm' }, t.kind === 'ai' ? h('span', { class: 'mt-ai' }, 'IA · ' + t.who) : null, fmtT(t.dur), t.date))); }
    root.append(bar(app, w), body); draw(); return root;
  });
}
