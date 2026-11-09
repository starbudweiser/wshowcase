/* Spotlight : ⌘K ou Ctrl+K, recherche d'applis et commandes. */
import { S, applyTheme, WALLS, icon } from './core.js';
import { h, $, brand } from './util.js';
import { t, lang, tag, sname } from './i18n.js';
import { sfx } from './audio.js';
import { launch, openSettings, power } from './apps.js';
import { setWall } from './system.js';
import { go } from './spaces.js';

let box = null;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function commands() {
  return [
    { id: 'dark', n: t('sp.dark'), fn: () => applyTheme('dark') }, { id: 'light', n: t('sp.light'), fn: () => applyTheme('light') },
    { id: 'wall', n: t('sp.wall'), fn: () => openSettings('wall') },
    { id: 'rand', n: t('sp.rand'), fn: () => setWall(WALLS[Math.floor(Math.random() * WALLS.length)].id, { user: true }) },
    ...S.spaces.map(sp => ({ id: 's' + sp.id, n: t('sp.goto', { s: sname(sp) }), fn: () => go(sp.id) })),
    { id: 'snd', n: t('sp.sound'), fn: () => sfx.set(!sfx.on) }, { id: 'rs', n: t('m.restart'), fn: () => power('restart') }
  ];
}
export function toggleSpot() { box ? closeSpot() : openSpot(); }
export function closeSpot() { if (box) { box.remove(); box = null; } }
function openSpot() {
  sfx.click();
  let sel = 0, rows = [];
  const input = h('input', { type: 'text', placeholder: t('sp.ph'), 'aria-label': t('sp.ph'), autocomplete: 'off', spellcheck: 'false' });
  const list = h('div', { class: 'spl', role: 'listbox' });
  box = h('div', { class: 'spot-wrap' }, h('div', { class: 'spot glass' }, h('div', { class: 'spi' }, h('span', { class: 'mg', html: '⌕' }), input), list));
  box.addEventListener('pointerdown', e => { if (e.target === box) closeSpot(); });
  const draw = () => {
    const q = norm(input.value.trim());
    const apps = S.apps.filter(a => !q || norm(a.id).includes(q) || norm(tag(a)).includes(q)).sort((a, b) => (norm(a.id).startsWith(q) ? 0 : 1) - (norm(b.id).startsWith(q) ? 0 : 1));
    const cmds = q ? commands().filter(c => norm(c.n).includes(q)) : [];
    rows = [...apps.slice(0, q ? 7 : 6).map(a => ({ a })), ...cmds.slice(0, 3).map(c => ({ c }))];
    sel = Math.min(sel, rows.length - 1);
    list.innerHTML = '';
    if (!rows.length) list.append(h('div', { class: 'spn' }, t('sp.none')));
    rows.forEach((r, i) => {
      const el = h('button', { class: 'spr' + (i === sel ? ' on' : ''), role: 'option', onpointerenter: () => { sel = i; mark(); }, onclick: () => go_(r) },
        r.a ? h('img', { src: icon(r.a.id), alt: '' }) : h('span', { class: 'cmd' }, '⌘'),
        h('span', { class: 'rt' }, r.a ? h('b', { html: brand(r.a.id, r.a.accent) }) : h('b', {}, r.c.n), h('small', {}, r.a ? `${t('sp.app')} · ${sname(S.spaces.find(s => s.id === r.a.space))}` : t('sp.cmd'))),
        h('span', { class: 'ret' }, i === sel ? '↩' : ''));
      list.append(el);
    });
  };
  const mark = () => [...list.children].forEach((el, i) => { el.classList.toggle('on', i === sel); const r = el.querySelector('.ret'); if (r) r.textContent = i === sel ? '↩' : ''; });
  const go_ = r => { closeSpot(); r && (r.a ? launch(r.a.id) : r.c.fn()); };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
    else if (e.key === 'Enter') go_(rows[sel]);
  });
  $('#layer').append(box); draw(); input.focus();
  box.firstChild.animate([{ opacity: 0, transform: 'scale(.96) translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' });
}
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && document.getElementById('mac') && !document.getElementById('mac').hidden) { e.preventDefault(); toggleSpot(); }
  else if (e.key === 'Escape') closeSpot();
});
