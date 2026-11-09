/* Réplique interactive de mSTICK : de vrais pense-bêtes déplaçables sur le bureau, enregistrés dans le navigateur. */
import { S, emit, spaceById } from '../core.js';
import { h, $, store, clamp } from '../util.js';
import { t } from '../i18n.js';
import { sfx } from '../audio.js';
import { toast } from '../system.js';

const COLORS = { yellow: '#ffe066', pink: '#ffb3c7', blue: '#a5d8ff', green: '#b7f0b1' };
let notes = null, layer = null;
const save = () => store.set('sticks', notes);
const seed = () => [
  { id: 1, c: 'yellow', x: 190, y: 450, r: -2, tx: t('ms.n1') }, { id: 2, c: 'pink', x: 700, y: 540, r: 3, tx: t('ms.n2') }, { id: 3, c: 'blue', x: 1000, y: 430, r: -1, tx: t('ms.n3') }
];

export function open(app) {
  if (S.extras.has('mSTICK')) { toast({ icon: 'assets/icons/mSTICK.png', title: 'mSTICK', body: t('ms.already') }); return; }
  notes = store.get('sticks', null) || seed();
  layer = h('div', { class: 'stick-layer' }); $('#sp-' + app.space).append(layer);
  const el = h('button', { class: 'mb extra ms', 'aria-label': 'mSTICK', html: '<svg viewBox="0 0 16 16"><path d="M2.5 2.5h11v7.5l-4 4h-7z" fill="#ffd60a"/><path d="M9.5 14v-4h4z" fill="#d4a800"/></svg>' });
  el.onclick = e => import('../menubar.js').then(m => m.showMenu(el, [
    { l: t('ms.new'), fn: () => add() }, { l: t('ms.reset'), fn: () => { notes = seed(); save(); draw(); sfx.pop(); } }, { sep: 1 }, { l: t('mc.quit'), fn: quit }]));
  S.extras.set('mSTICK', { el, quit }); emit('extras'); draw(true); sfx.open();
  toast({ icon: 'assets/icons/mSTICK.png', title: 'mSTICK', body: t('ms.intro') });
}
function quit() { layer && layer.remove(); layer = null; S.extras.delete('mSTICK'); emit('extras'); sfx.close(); }
function add() {
  const n = { id: Date.now(), c: Object.keys(COLORS)[notes.length % 4], x: 380 + (notes.length % 5) * 60, y: 160 + (notes.length % 4) * 40, r: Math.round(Math.random() * 6 - 3), tx: '' };
  notes.push(n); save(); draw(false, n.id); sfx.pop();
}
function draw(intro, focusId) {
  layer.innerHTML = '';
  notes.forEach((n, i) => {
    const ta = h('div', { class: 'st-tx', contenteditable: 'true', spellcheck: 'false', 'aria-label': t('ms.note') }, n.tx);
    ta.addEventListener('input', () => { n.tx = ta.innerText; save(); });
    const sw = h('div', { class: 'st-sw' }, Object.entries(COLORS).map(([k, v]) => h('button', { style: { background: v }, 'aria-label': k, onclick: () => { n.c = k; save(); el.style.setProperty('--c', v); sfx.tick(); } })));
    const hd = h('div', { class: 'st-hd' }, h('button', { class: 'st-x', 'aria-label': t('ms.del'), onclick: () => { notes = notes.filter(x => x !== n); save(); el.animate([{ opacity: 1 }, { opacity: 0, transform: `rotate(${n.r + 12}deg) scale(.7)` }], { duration: 200 }).onfinish = () => el.remove(); sfx.close(); } }, '×'), sw);
    const el = h('div', { class: 'stick', style: { left: n.x + 'px', top: n.y + 'px', '--c': COLORS[n.c], '--r': n.r + 'deg' } }, hd, ta);
    hd.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return; e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y; el.style.zIndex = 20; el.classList.add('lift');
      const mv = ev => { n.x = clamp(ox + (ev.clientX - sx) / S.scale, 0, 1380); n.y = clamp(oy + (ev.clientY - sy) / S.scale, 34, 700); el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); el.classList.remove('lift'); save(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    layer.append(el);
    if (intro) el.animate([{ opacity: 0, transform: `translateY(-60px) rotate(${n.r - 14}deg) scale(1.2)` }, { opacity: 1, transform: `rotate(${n.r}deg)` }], { duration: 520, delay: 160 + i * 140, fill: 'backwards', easing: 'cubic-bezier(.2,.9,.3,1.2)' });
    if (focusId === n.id) setTimeout(() => ta.focus(), 50);
  });
}
