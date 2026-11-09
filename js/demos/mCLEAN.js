/* Réplique interactive de mCLEAN : anneau de mémoire dans la barre des menus, fenêtre de détails, libération en un clic. */
import { S, emit } from '../core.js';
import { h, brand, $ } from '../util.js';
import { t } from '../i18n.js';
import { sfx } from '../audio.js';
import { toast } from '../system.js';

const TOTAL = 16;
const mem = { app: 6.2, wired: 2.1, comp: 1.4, cache: 4.3 };
let panel = null, timer = 0;
const used = () => mem.app + mem.wired + mem.comp + mem.cache;
const pct = () => Math.round(used() / TOTAL * 100);
const ring = (p, r = 9, w = 2.4) => { const c = 2 * Math.PI * r; return `<svg viewBox="0 0 ${r * 2 + w * 2} ${r * 2 + w * 2}"><circle cx="${r + w}" cy="${r + w}" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-width="${w}"/><circle cx="${r + w}" cy="${r + w}" r="${r}" fill="none" stroke="var(--ring,#30d158)" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${c * p / 100} ${c}" transform="rotate(-90 ${r + w} ${r + w})"/></svg>`; };
const col = p => (p > 85 ? '#ff453a' : p > 70 ? '#ff9f0a' : '#30d158');

export function open(app) {
  if (S.extras.has('mCLEAN')) { togglePanel(); return; }
  const el = h('button', { class: 'mb extra mc', 'aria-label': 'mCLEAN' });
  el.onclick = togglePanel;
  S.extras.set('mCLEAN', { el, quit });
  const refreshEl = () => { const p = pct(); el.style.setProperty('--ring', col(p)); el.innerHTML = ring(p) + `<span>${p}%</span>`; };
  refreshEl();
  timer = setInterval(() => { mem.app = Math.max(5.6, Math.min(7.4, mem.app + (Math.random() - .5) * .16)); mem.cache = Math.max(3.6, Math.min(5, mem.cache + (Math.random() - .5) * .1)); refreshEl(); panel && draw(); }, 1600);
  el._refresh = refreshEl;
  emit('extras'); sfx.open();
  toast({ icon: `assets/icons/mCLEAN.png`, title: 'mCLEAN', body: t('mc.intro') });
  setTimeout(() => { const b = $('#menubar .mc'); b && togglePanel(b); }, 700);
}
function quit() { clearInterval(timer); closePanel(); S.extras.delete('mCLEAN'); emit('extras'); sfx.close(); }
function togglePanel(a) { panel ? closePanel() : openPanel(a && a.currentTarget ? a.currentTarget : (a && a.nodeType ? a : $('#menubar .mc'))); }
function openPanel(anchor) {
  if (!anchor) return; sfx.click();
  panel = h('div', { class: 'mcp glass', role: 'dialog', 'aria-label': 'mCLEAN' });
  $('#layer').append(panel); draw();
  const r = anchor.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
  panel.style.top = '38px'; panel.style.right = Math.max(8, (s.right - r.right) / S.scale - 120) + 'px';
  panel.animate([{ opacity: 0, transform: 'translateY(-8px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
  setTimeout(() => addEventListener('pointerdown', away, true), 0);
}
const away = e => { if (panel && !panel.contains(e.target) && !e.target.closest('.mc')) closePanel(); };
function closePanel() { if (panel) { panel.remove(); panel = null; removeEventListener('pointerdown', away, true); } }
function draw() {
  if (!panel) return; const p = pct(), free = TOTAL - used();
  const row = (k, v, c) => `<div class="mr"><span><i style="background:${c}"></i>${t('mc.' + k)}</span><b>${v.toFixed(1)} ${t('mc.gb')}</b><div class="mbar"><i style="width:${v / TOTAL * 100}%;background:${c}"></i></div></div>`;
  panel.innerHTML = `<div class="mch"><div class="mring" style="--ring:${col(p)}">${ring(p, 38, 7)}<b>${p}%</b></div><div><h4>${brand('mCLEAN', '#30d158')}</h4><p>${t('mc.used', { u: used().toFixed(1), n: TOTAL })}</p><p class="${p > 70 ? 'wn' : 'ok'}">${t(p > 70 ? 'mc.pressure' : 'mc.good')}</p></div></div>`
    + row('app', mem.app, '#0a84ff') + row('wired', mem.wired, '#bf5af2') + row('comp', mem.comp, '#ff9f0a') + row('cache', mem.cache, '#64d2ff') + row('freem', free, '#8e8e93')
    + `<div class="mca"><button class="btn pri" data-a="free">${t('mc.free')}</button><button class="btn" data-a="quit">${t('mc.quit')}</button></div>`;
  panel.querySelector('[data-a=free]').onclick = free_;
  panel.querySelector('[data-a=quit]').onclick = quit;
}
function free_() {
  const before = used(), tgt = { app: 4.4, wired: 2, comp: .5, cache: 1.1 }; sfx.pop();
  const t0 = performance.now();
  (function step(now) { const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3);
    Object.keys(tgt).forEach(x => { mem[x] = mem[x] + (tgt[x] - mem[x]) * (k === 1 ? 1 : 0.18 * (1 + e)); });
    $('#menubar .mc') && $('#menubar .mc')._refresh && $('#menubar .mc')._refresh(); draw();
    if (k < 1) requestAnimationFrame(step); else toast({ icon: 'assets/icons/mCLEAN.png', title: 'mCLEAN', body: t('mc.freed', { g: (before - used()).toFixed(1) }) });
  })(t0);
}
