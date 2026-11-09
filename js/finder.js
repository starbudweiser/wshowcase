/* Finder : vue Galerie (aperçu, bande d'icônes, inspecteur), vue Icônes, vue Liste. */
import { S, appById, icon, spaceById } from './core.js';
import { h, store, brand, reduced } from './util.js';
import { t, lang, tag, sname } from './i18n.js';
import { sfx } from './audio.js';
import * as wm from './wm.js';
import { launch, download, repoUrl } from './apps.js';

let VIEW = store.get('fview', 'gallery');
const finders = new Set();
export const view = () => VIEW;
export function setView(v) { VIEW = v; store.set('fview', v); sfx.tick(); finders.forEach(f => f.render()); }

const TAGS = [['menubar', a => a.kind === 'menubar'], ['demo', a => !!a.demo], ['dl', a => a.download]];
const verCache = {};
async function version(app) {
  if (!app.download) return null;
  if (verCache[app.id]) return verCache[app.id];
  try {
    const c = sessionStorage.getItem('wsc.v.' + app.id); if (c) return (verCache[app.id] = c);
    const r = await fetch(`https://api.github.com/repos/${S.owner}/${app.repo}/releases/latest`);
    if (!r.ok) throw 0; const j = await r.json(); const v = String(j.tag_name || '').replace(/^v/, '');
    if (v) { sessionStorage.setItem('wsc.v.' + app.id, v); return (verCache[app.id] = v); }
  } catch {}
  return app.version || null;
}

export function open(o = {}) {
  const sel = o.select ? appById(o.select) : null;
  const id = o.fresh ? `finder:${Date.now()}` : `finder:${S.cur}`;
  const existing = wm.wins.get(id);
  if (existing && sel) { existing.st.src = sel.space; existing.st.sel = sel.id; existing.render(); }
  return wm.open({ id, appId: 'finder', title: 'Finder', w: 1260, h: 676, x: o.fresh ? undefined : 170, y: o.fresh ? undefined : 98, minw: 860, minh: 460, bare: true, cls: 'fwin',
    onclose: w => { finders.delete(w); clearInterval(w.timer); },
    build: w => {
      const st = w.st = { src: sel ? sel.space : S.cur, sel: sel ? sel.id : null, q: '' };
      const root = h('div', { class: 'fnd', tabindex: '0' });
      const items = () => {
        const q = st.q.trim().toLowerCase();
        let l = st.src.startsWith('tag:') ? S.apps.filter(TAGS.find(x => 'tag:' + x[0] === st.src)[1]) : S.apps.filter(a => a.space === st.src);
        if (q) l = S.apps.filter(a => a.id.toLowerCase().includes(q) || tag(a).toLowerCase().includes(q));
        return l;
      };
      const title = () => st.src.startsWith('tag:') ? t('f.tag.' + st.src.slice(4)) : sname(spaceById(st.src));
      const select = (id2, { scroll = true } = {}) => { st.sel = id2; sfx.tick(); w.render(true); if (scroll) { const b = root.querySelector('.th.on,.ic.on,.lr.on'); b && b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } };
      const launchSel = () => st.sel && launch(st.sel);

      w.render = (soft) => {
        const list = items();
        if (!list.some(a => a.id === st.sel)) st.sel = list[0] ? list[0].id : null;
        const app = st.sel ? appById(st.sel) : null;
        clearInterval(w.timer);
        const keepQ = root.querySelector('.fsearch input');
        const hadFocus = keepQ && document.activeElement === keepQ;
        root.innerHTML = '';
        /* barre d'outils */
        const seg = h('div', { class: 'seg', role: 'tablist' }, ['icons', 'list', 'gallery'].map(v => h('button', { class: VIEW === v ? 'on' : '', role: 'tab', 'aria-selected': VIEW === v, onclick: () => setView(v) }, t('f.' + v))));
        const search = h('label', { class: 'fsearch' }, h('span', {}, '⌕'), h('input', { type: 'search', placeholder: t('f.search'), value: st.q, 'aria-label': t('f.search'),
          oninput: e => { st.q = e.target.value; w.render(); } }));
        root.append(h('div', { class: 'ftb', 'data-drag': '' }, wm.lights(w), h('b', { class: 'ft' }, title()), seg, search));
        /* barre latérale */
        const side = h('nav', { class: 'fside', 'aria-label': t('f.spaces') }, h('div', { class: 'sh' }, t('f.spaces')),
          S.spaces.map(sp => h('button', { class: 'si' + (st.src === sp.id && !st.q ? ' on' : ''), onclick: () => { st.src = sp.id; st.q = ''; sfx.tick(); w.render(); } },
            h('u', { style: { background: `linear-gradient(135deg,${sp.tint[0]},${sp.tint[1]})` } }), sname(sp), h('em', {}, S.apps.filter(a => a.space === sp.id).length))),
          h('div', { class: 'sh' }, t('f.tags')),
          TAGS.map(([k, fn]) => h('button', { class: 'si' + (st.src === 'tag:' + k && !st.q ? ' on' : ''), onclick: () => { st.src = 'tag:' + k; st.q = ''; sfx.tick(); w.render(); } },
            h('u', { class: 'dotc', 'data-k': k }), t('f.tag.' + k), h('em', {}, S.apps.filter(fn).length))));
        root.append(side);
        /* zone principale */
        const main = h('div', { class: 'fmain v-' + VIEW });
        if (!list.length) main.append(h('div', { class: 'fempty' }, t('f.empty')));
        else if (VIEW === 'gallery') {
          const pv = h('div', { class: 'pv' }); renderPreview(pv, app, w); pv.ondblclick = launchSel;
          const strip = h('div', { class: 'strip', role: 'listbox' }, list.map(a => h('button', { class: 'th' + (a.id === st.sel ? ' on' : ''), role: 'option', 'aria-selected': a.id === st.sel, onclick: () => select(a.id), ondblclick: () => launch(a.id) },
            h('img', { src: icon(a.id), alt: '', loading: 'lazy', draggable: 'false' }), h('span', {}, a.id))));
          main.append(pv, strip);
        } else if (VIEW === 'icons') {
          main.append(h('div', { class: 'icv', role: 'listbox' }, list.map(a => h('button', { class: 'ic' + (a.id === st.sel ? ' on' : ''), role: 'option', onclick: () => select(a.id), ondblclick: () => launch(a.id) },
            h('img', { src: icon(a.id), alt: '', loading: 'lazy', draggable: 'false' }), h('span', { html: brand(a.id, a.accent) })))));
        } else {
          main.append(h('div', { class: 'lst', role: 'listbox' },
            h('div', { class: 'lh' }, h('span', {}, t('f.name')), h('span', {}, t('f.kind')), h('span', {}, t('f.demo')), h('span', {}, t('f.version'))),
            list.map(a => h('button', { class: 'lr' + (a.id === st.sel ? ' on' : ''), role: 'option', onclick: () => select(a.id), ondblclick: () => launch(a.id) },
              h('span', { class: 'n' }, h('img', { src: icon(a.id), alt: '', loading: 'lazy' }), h('b', { html: brand(a.id, a.accent) })),
              h('span', {}, a.kind === 'menubar' ? t('f.kindMenu') : t('f.kindApp')), h('span', {}, a.demo ? t('f.demoLive') : t('f.demoTour')), h('span', {}, a.version || '—')))));
        }
        root.append(main);
        root.append(renderInsp(app, launchSel));
        if (hadFocus) { const i = root.querySelector('.fsearch input'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
      };
      root.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        const list = items(), i = list.findIndex(a => a.id === st.sel);
        const next = d => { const n = list[Math.max(0, Math.min(list.length - 1, i + d))]; if (n) { e.preventDefault(); select(n.id); root.focus(); } };
        if (e.key === 'ArrowRight') next(1); else if (e.key === 'ArrowLeft') next(-1);
        else if (e.key === 'ArrowDown') next(VIEW === 'icons' ? 6 : 1); else if (e.key === 'ArrowUp') next(VIEW === 'icons' ? -6 : -1);
        else if (e.key === 'Enter') launchSel();
      });
      finders.add(w); w.render();
      return root;
    } });
}

function renderPreview(pv, app, w) {
  if (!app) return;
  const badge = h('span', { class: 'pbadge glass' }, h('i', { class: app.demo ? 'live' : '' }), app.demo ? t('f.demoLive') : t('f.demoTour'));
  if (app.shots) {
    const set = lang() === 'fr' ? 'fr' : 'en';
    const box = h('div', { class: 'shots' });
    for (let i = 1; i <= app.shots; i++) box.append(h('img', { class: i === 1 ? 'on' : '', src: `assets/shots/${set}/${app.id}_${i}.jpg`, alt: `${app.id} ${i}`, draggable: 'false', loading: i === 1 ? 'eager' : 'lazy' }));
    pv.append(box, badge);
    if (!reduced() && app.shots > 1) {
      let k = 0; w.timer = setInterval(() => { const im = box.children; if (!im.length) return; im[k].classList.remove('on'); k = (k + 1) % im.length; im[k].classList.add('on'); }, 3600);
    }
  } else {
    pv.append(h('div', { class: 'art', style: { '--c': app.accent } }, h('img', { src: icon(app.id), alt: '', draggable: 'false' }), h('div', { class: 'at', html: brand(app.id, app.accent) }), h('p', {}, tag(app))), badge);
  }
}

function renderInsp(app, launchSel) {
  const el = h('aside', { class: 'finsp' });
  if (!app) return el;
  const verEl = h('dd', {}, app.version || '—');
  version(app).then(v => { if (v) verEl.textContent = v; });
  const sp = spaceById(app.space);
  el.append(h('img', { class: 'bigic', src: icon(app.id), alt: '', draggable: 'false' }),
    h('div', {}, h('h3', { html: brand(app.id, app.accent) }), h('div', { class: 'k' }, `${app.kind === 'menubar' ? t('f.kindMenu') : t('f.kindApp')} · ${sname(sp)}`)),
    h('p', {}, tag(app)),
    h('dl', {}, h('dt', {}, t('f.version')), verEl, h('dt', {}, t('f.demo')), h('dd', {}, app.demo ? t('f.demoLive') : t('f.demoTour')),
      h('dt', {}, t('f.source')), h('dd', {}, h('a', { href: repoUrl(app), target: '_blank', rel: 'noopener' }, 'GitHub ›'))),
    h('div', { class: 'acts' },
      h('button', { class: 'btn pri', onclick: launchSel }, t('f.try')),
      app.download ? h('button', { class: 'btn', onclick: () => download(app) }, t('f.download'))
        : h('button', { class: 'btn', disabled: true }, t('f.soon'))));
  return el;
}
