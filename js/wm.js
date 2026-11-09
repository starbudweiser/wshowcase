/* Gestionnaire de fenêtres : déplacement, redimensionnement, réduction vers le Dock, zoom, focus. */
import { S, emit, on } from './core.js';
import { h, clamp } from './util.js';
import { sfx } from './audio.js';
export const wins = new Map();
let z = 30, cascade = 0;
const MB = 30, DOCK = 104;
const spEl = id => document.getElementById('sp-' + id);

export function lights(w) {
  const b = (c, label, fn) => h('button', { class: 'c ' + c, 'aria-label': label, 'data-nodrag': '', onclick: e => { e.stopPropagation(); fn(); } });
  return h('div', { class: 'tl' }, b('r', 'Close', () => close(w.id)), b('y', 'Minimize', () => minimize(w.id)), b('g', 'Zoom', () => toggleMax(w.id)));
}
export function open(o) {
  if (wins.has(o.id)) { const w = wins.get(o.id); if (w.min) restore(o.id); focus(o.id); return w; }
  const sp = o.space || S.cur, W = o.w || 760, H = o.h || 500;
  cascade = (cascade + 1) % 6;
  const x = o.x ?? Math.round((1600 - W) / 2 + (cascade - 3) * 26), y = o.y ?? Math.round(MB + (860 - MB - H) / 2 - 20 + (cascade - 3) * 20);
  const w = { id: o.id, appId: o.appId, title: o.title, space: sp, x, y, w: W, h: H, min: false, max: false, o };
  const body = h('div', { class: 'wbody' });
  const el = h('div', { class: 'win' + (o.cls ? ' ' + o.cls : ''), role: 'dialog', 'aria-label': o.title, tabindex: '-1' });
  w.el = el; w.body = body;
  if (!o.bare) el.append(h('div', { class: 'wtb', 'data-drag': '' }, lights(w), h('div', { class: 'wt' }, o.title)));
  el.append(body);
  if (o.resizable !== false) el.append(h('i', { class: 'rz', 'data-nodrag': '' }));
  place(w); spEl(sp).append(el); wins.set(w.id, w);
  const r = typeof o.build === 'function' ? o.build(w) : null;
  if (r) body.append(r);
  wire(w); focus(w.id);
  const ir = S.rectOf(w.appId);
  const ox = ir ? ir.x + ir.w / 2 - x : W / 2, oy = ir ? ir.y - y : H;
  el.style.transformOrigin = `${ox}px ${oy}px`;
  el.animate([{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1.02)', offset: .7 }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.3,1)' });
  sfx.open(); emit('wins', w);
  return w;
}
function place(w) { Object.assign(w.el.style, { left: w.x + 'px', top: w.y + 'px', width: w.w + 'px', height: w.h + 'px' }); }
function wire(w) {
  const el = w.el;
  el.addEventListener('pointerdown', e => {
    focus(w.id);
    const rz = e.target.closest('.rz'), dr = e.target.closest('[data-drag]');
    if (rz) return drag(e, w, 'rz');
    if (dr && !e.target.closest('[data-nodrag],button,input,select,textarea,a,.seg,.search')) drag(e, w, 'mv');
  });
  el.addEventListener('dblclick', e => { if (e.target.closest('.wtb') && !e.target.closest('button')) toggleMax(w.id); });
}
function drag(e, w, mode) {
  if (w.max && mode === 'mv') return;
  e.preventDefault();
  const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y, ow = w.w, oh = w.h, s = S.scale, o = w.o;
  const mv = ev => {
    const dx = (ev.clientX - sx) / s, dy = (ev.clientY - sy) / s;
    if (mode === 'mv') { w.x = clamp(ox + dx, -w.w + 140, 1600 - 140); w.y = clamp(oy + dy, MB, 900 - 60); }
    else { w.w = clamp(ow + dx, o.minw || 380, 1600 - w.x); w.h = clamp(oh + dy, o.minh || 260, 900 - w.y - 20); }
    place(w);
  };
  const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); w.el.classList.remove('moving'); };
  w.el.classList.add('moving'); addEventListener('pointermove', mv); addEventListener('pointerup', up);
}
export function focus(id) {
  const w = wins.get(id); if (!w) return;
  wins.forEach(x => x.el.classList.toggle('active', x === w));
  w.el.style.zIndex = ++z; S.active = w; emit('focus', w);
}
export function close(id) {
  const w = wins.get(id); if (!w) return;
  wins.delete(id); sfx.close();
  const done = () => { w.el.remove(); w.o.onclose && w.o.onclose(w); emit('wins', null); topmost(); };
  w.el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.92)' }], { duration: 160, easing: 'ease-in' }).onfinish = done;
  w.el.style.pointerEvents = 'none';
}
export function minimize(id) {
  const w = wins.get(id); if (!w || w.min) return;
  w.min = true; sfx.min();
  const ir = S.rectOf(w.appId) || { x: 800, y: 860, w: 60 };
  const tx = ir.x + ir.w / 2 - (w.x + w.w / 2), ty = ir.y + 20 - (w.y + w.h / 2);
  w.el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(.08,.04)`, opacity: .2 }], { duration: 480, easing: 'cubic-bezier(.6,.05,.9,.4)' }).onfinish = () => { w.el.hidden = true; };
  topmost(); emit('wins', w);
}
export function restore(id) {
  const w = wins.get(id); if (!w) return;
  if (w.min) {
    w.min = false; w.el.hidden = false; sfx.open();
    const ir = S.rectOf(w.appId) || { x: 800, y: 860, w: 60 };
    const tx = ir.x + ir.w / 2 - (w.x + w.w / 2), ty = ir.y + 20 - (w.y + w.h / 2);
    w.el.animate([{ transform: `translate(${tx}px,${ty}px) scale(.08,.04)`, opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
  focus(id); emit('wins', w);
}
export function toggleMax(id) {
  const w = wins.get(id); if (!w) return;
  w.el.classList.add('anim');
  if (w.max) { Object.assign(w, w.prev); w.max = false; }
  else { w.prev = { x: w.x, y: w.y, w: w.w, h: w.h }; Object.assign(w, { x: 0, y: MB, w: 1600, h: 900 - MB - DOCK + 14 }); w.max = true; }
  place(w); setTimeout(() => w.el.classList.remove('anim'), 400); sfx.click();
}
function topmost() {
  let best = null; wins.forEach(w => { if (w.space === S.cur && !w.min && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w; });
  if (best) focus(best.id); else { S.active = null; emit('focus', null); }
}
export const byApp = appId => [...wins.values()].filter(w => w.appId === appId);
export const isRunning = appId => wins.size && byApp(appId).length > 0;
on('space', topmost);
