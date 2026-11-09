/* Centre de contrôle : apparence, son, langue, fond d'écran. */
import { S, WALLS, applyTheme, themeMode } from './core.js';
import { h, $ } from './util.js';
import { t, lang, setLang, LANGS } from './i18n.js';
import { sfx } from './audio.js';
import { setWall, curWall } from './system.js';

let panel = null;
export function toggleCC(anchor) {
  if (panel) return closeCC();
  sfx.click();
  const seg = (items, cur, fn) => h('div', { class: 'seg3' }, items.map(([v, l]) => h('button', { class: v === cur ? 'on' : '', onclick: () => { fn(v); rebuild(); } }, l)));
  const build = () => h('div', { class: 'cc glass' },
    h('div', { class: 'cch' }, t('cc.appearance')),
    seg([['light', t('cc.light')], ['dark', t('cc.dark')], ['auto', t('cc.auto')]], themeMode(), v => { applyTheme(v); sfx.click(); }),
    h('div', { class: 'cch' }, t('cc.sound')),
    h('div', { class: 'ccs' },
      h('button', { class: 'sw' + (sfx.on ? ' on' : ''), role: 'switch', 'aria-checked': sfx.on, onclick: () => { sfx.set(!sfx.on); rebuild(); } }, h('i')),
      h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: sfx.vol, 'aria-label': t('cc.sound'), oninput: e => sfx.setVol(+e.target.value), onchange: () => sfx.click() })),
    h('div', { class: 'cch' }, t('cc.lang')),
    seg(LANGS.map(l => [l, l.toUpperCase()]), lang(), v => { setLang(v); }),
    h('div', { class: 'cch' }, t('cc.wallpaper')),
    h('div', { class: 'ccw' }, WALLS.map(w => h('button', { class: 'wth' + (curWall() === w.id ? ' on' : ''), title: w.n[lang()], 'aria-label': w.n[lang()],
      style: { backgroundImage: `url(assets/wallpapers/thumbs/${w.id}.jpg)` }, onclick: () => { setWall(w.id, { user: true }); rebuild(); } }))));
  const rebuild = () => { if (!panel) return; const n = build(); panel.replaceWith(n); panel = n; place(); };
  const place = () => {
    const r = anchor.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    panel.style.top = '38px'; panel.style.right = Math.max(8, (s.right - r.right) / S.scale - 40) + 'px';
  };
  panel = build(); $('#layer').append(panel); place();
  panel.animate([{ opacity: 0, transform: 'translateY(-8px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  setTimeout(() => addEventListener('pointerdown', away, true), 0);
}
const away = e => { if (panel && !panel.contains(e.target) && !e.target.closest('.mb.ico')) closeCC(); };
export function closeCC() { if (panel) { panel.remove(); panel = null; removeEventListener('pointerdown', away, true); } }
addEventListener('keydown', e => { if (e.key === 'Escape') closeCC(); });
