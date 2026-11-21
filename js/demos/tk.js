/* Outils communs des démos « Desktop Mac Toolkit » récentes (fenêtre sombre, éléments d'interface, onde, fenêtre de dialogue). */
import { h, brand, wm, sfx, T, css } from './kit.js';
export { h, T, sfx, toast, icon, S, launch, download, wait, reduced, clamp, css } from './kit.js';
export const win = (app, w, hh, build, cls = '') => { css('css/demos/tk.css'); return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w, h: hh, minw: 640, minh: 420, bare: true, cls: 'tkwin ' + cls, build }); };
export const bar = (app, w, ...extra) => h('div', { class: 'tk-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand(app.id, app.accent) }), ...extra);
export const sw = (on, fn) => { const b = h('button', { class: 'tk-sw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(!!on), onclick: () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); sfx.tick(); fn && fn(on); } }, h('i')); return b; };
export const seed = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
export const wave = (n, sd) => { const r = seed(sd + 7); const w = h('div', { class: 'tk-wave' }); for (let i = 0; i < n; i++) w.append(h('i', { style: { height: 6 + Math.round(Math.abs(Math.sin(i * .55 + sd)) * 14 + r() * 10) + 'px' } })); return w; };
export const playWave = async (w, ms = 1500) => { const b = [...w.children]; for (let i = 0; i < b.length; i++) { b[i].classList.add('on'); await new Promise(r => setTimeout(r, ms / b.length)); if (!w.isConnected) return; } await new Promise(r => setTimeout(r, 200)); b.forEach(x => x.classList.remove('on')); };
export const dialog = (root, title, body, ...btns) => { const m = h('div', { class: 'tk-modal', onclick: e => e.target === m && m.remove() }, h('div', { class: 'tk-dlg' }, h('h4', {}, title), typeof body === 'string' ? h('p', {}, body) : body, h('div', { class: 'row' }, ...btns.map(([l, c, f]) => h('button', { class: 'tk-btn ' + (c || ''), onclick: () => { m.remove(); f && f(); } }, l))))); root.append(m); return m; };
export const kb = s => s;
