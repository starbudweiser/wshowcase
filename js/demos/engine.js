/* Moteur de démos interactives : quelques gabarits (analyse, traitement, navigateur, barre des menus, assistant) pilotés par js/demos/configs.js.
   Chaque appli a sa réplique en interface Socle, avec des données d'exemple : rien n'est lu ni envoyé. */
import { S, icon, emit, appById } from '../core.js';
import { h, brand, wait, reduced, $ } from '../util.js';
import { t, lang } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download, launch } from '../apps.js';
import { toast } from '../system.js';
import { CONFIG } from './configs.js';
import * as tour from '../tour.js';

export const fmt = mb => (mb >= 1024 ? (mb / 1024).toFixed(1) + ' ' + t('mc.gb') : Math.round(mb * 10) / 10 + ' ' + t('u.mb'));
export const winOf = (app, c, build) => wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: c.w || 940, h: c.h || 600, minw: 640, minh: 440, bare: true, cls: 'socle', build });
export const titleOf = (app, w, extra) => h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand(app.id, app.accent) }), extra);
export const dlBtn = app => h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download'));

export function open(app) {
  const make = CONFIG[app.id];
  if (!make) return tour.open(app);
  const c = make(); c.id = app.id;
  const fn = { scan, run, browse, menu, wizard }[c.type];
  return fn ? fn(app, c) : tour.open(app);
}

/* ===================== ANALYSE (eSLIFY, fCLEANER, hdCLEANER) ===================== */
function scan(app, c) {
  return winOf(app, c, w => {
    let phase = 'idle'; const rows = c.rows.map(r => ({ ...r, sel: c.mode === 'flag' ? !!r.ok : r.pre !== false, seen: false, gone: false, flagged: false }));
    const root = h('div', { class: 'skw nosb' }), main = h('main', { class: 'smain' });
    const act = h('button', { class: 'sbtn act', onclick: () => (phase === 'ready' ? apply() : start()) }, c.scanLabel);
    root.append(titleOf(app, w, act), main);
    const selected = () => rows.filter(r => r.seen && !r.gone && r.sel);
    const draw = () => {
      main.innerHTML = '';
      const sel = selected(), total = sel.reduce((a, r) => a + (r.s || 0), 0);
      main.append(h('div', { class: 'shead' }, h('h3', {}, c.head), h('span', { class: 'mut' }, phase === 'idle' ? '' : c.mode === 'flag' ? t('e.selN', { n: sel.length }) : t('e.sel', { n: sel.length, s: fmt(total) }))));
      if (phase === 'idle') return main.append(h('div', { class: 'scard center' }, h('p', { class: 'mut' }, c.intro), h('button', { class: 'sbtn act', onclick: start }, c.scanLabel)));
      const tab = h('div', { class: 'dtab' }, h('div', { class: 'dr dh' }, h('span', {}), ...c.cols.map(x => h('span', {}, x))));
      rows.filter(r => r.seen).forEach(r => {
        const cb = h('button', { class: 'cb' + (r.sel ? ' on' : ''), 'aria-label': r.n, disabled: phase !== 'ready' || (c.mode === 'flag' && !r.ok), onclick: () => { r.sel = !r.sel; sfx.tick(); draw(); } }, r.sel ? '✓' : '');
        const third = c.mode === 'flag' ? h('span', { class: r.flagged ? 'ok' : r.ok ? 'acc' : 'dg' }, r.flagged ? 'ESL' : r.ok ? t('e.eligible') : t('e.notEligible')) : h('span', { class: 'num' }, fmt(r.s));
        tab.append(h('div', { class: 'dr' + (r.gone ? ' gone' : '') + (r.sel ? '' : ' off') }, cb, h('span', { class: 'mono' }, r.n), h('span', { class: 'mut' }, typeof r.d === 'function' ? r.d() : r.d), third));
      });
      main.append(tab);
      if (phase === 'done') main.append(h('div', { class: 'scard center' }, h('b', { class: 'okt' }, c.mode === 'flag' ? t('e.flagged', { n: rows.filter(r => r.flagged).length }) : t('e.freed', { s: fmt(rows.filter(r => r.gone).reduce((a, r) => a + r.s, 0)) })), h('p', { class: 'mut' }, c.safe)));
    };
    async function start() {
      if (phase === 'scanning') return; phase = 'scanning'; act.disabled = true; rows.forEach(r => { r.seen = false; r.gone = false; r.flagged = false; });
      const prog = h('i'); main.innerHTML = ''; main.append(h('div', { class: 'scard center' }, h('p', { class: 'mut' }, c.scanning), h('div', { class: 'sprog' }, prog))); sfx.click();
      for (let i = 0; i < rows.length; i++) { await wait(reduced() ? 0 : 150); prog.style.width = ((i + 1) / rows.length * 100) + '%'; sfx.tick(); rows[i].seen = true; }
      await wait(reduced() ? 0 : 200); phase = 'ready'; act.disabled = false; act.textContent = c.actLabel; draw(); sfx.done();
    }
    async function apply() {
      if (!selected().length) return; sfx.pop(); const sel = selected();
      if (c.mode === 'flag') sel.forEach(r => { r.flagged = true; r.sel = false; }); else sel.forEach(r => { r.gone = true; });
      phase = 'done'; draw(); act.textContent = t('e.again'); setTimeout(() => { rows.forEach(r => { if (r.gone) r.seen = false; }); }, 600);
      act.onclick = () => { act.onclick = () => (phase === 'ready' ? apply() : start()); phase = 'idle'; act.textContent = c.scanLabel; draw(); };
      toast({ icon: icon(app.id), title: app.id, body: c.mode === 'flag' ? t('e.flagged', { n: sel.length }) : t('e.freed', { s: fmt(sel.reduce((a, r) => a + r.s, 0)) }) });
    }
    draw(); return root;
  });
}

/* ===================== TRAITEMENT (fOLDERFUSE, mBAE, ARCHiVES, mO2FLATTENER, mABBAJACK, mSIZER, MiCONE) ===================== */
function run(app, c) {
  return winOf(app, c, w => {
    let busy = false, done = false;
    const root = h('div', { class: 'skw nosb' }), main = h('main', { class: 'smain' });
    const act = h('button', { class: 'sbtn act', onclick: () => go() }, c.runLabel);
    root.append(titleOf(app, w, act), main);
    const prog = h('i'), log = h('pre', { class: 'sraw rlog' }), res = h('div', { class: 'rres' });
    const fields = h('div', { class: 'fgrid' }, c.fields.map(([l, v, s]) => h('div', { class: 'fcard' }, h('div', { class: 'sh' }, l), h('div', { class: 'fv mono' }, v), h('div', { class: 'mut' }, s || ''))));
    main.append(h('div', { class: 'shead' }, h('h3', {}, c.head), h('div', { class: 'sprog wide' }, prog)), fields, log, res);
    log.textContent = c.ready || '';
    async function go() {
      if (busy) return; if (done) { done = false; prog.style.width = '0%'; log.textContent = ''; res.innerHTML = ''; act.textContent = c.runLabel; }
      busy = true; act.disabled = true; sfx.click(); log.textContent = '';
      const lines = c.log.map(x => (typeof x === 'function' ? x() : x));
      for (let i = 0; i < lines.length; i++) { await wait(reduced() ? 0 : 330); log.textContent += lines[i] + '\n'; log.scrollTop = log.scrollHeight; prog.style.width = ((i + 1) / lines.length * 100) + '%'; sfx.tick(); }
      await wait(reduced() ? 0 : 250); sfx.done(); busy = false; done = true; act.disabled = false; act.textContent = t('e.again');
      res.innerHTML = ''; res.append(h('div', { class: 'scard' }, h('b', { class: 'okt' }, '✓ ' + c.done),
        h('div', { class: 'stats' }, c.stats.map(([l, v]) => h('div', {}, h('b', {}, v), h('span', { class: 'mut' }, l)))),
        c.preview ? h('div', { class: 'iconset' }, [128, 64, 40, 24].map(s => h('div', { class: 'plate' }, h('img', { src: icon(c.preview), style: { width: s + 'px', height: s + 'px' }, alt: '' })))) : null,
        h('div', { class: 'sact' }, dlBtn(app))));
      res.firstChild.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'ease-out' });
      c.toast && toast({ icon: icon(app.id), title: app.id, body: c.toast });
    }
    return root;
  });
}

/* ===================== NAVIGATEUR (liste ou grille + détail) ===================== */
function browse(app, c) {
  return winOf(app, c, w => {
    const items = c.items.map(x => ({ ...x, state: x.state || c.state0, fields: (x.fields || []).map(f => [...f]) }));
    let sel = items[0], q = '';
    const root = h('div', { class: 'skw' + (c.grid ? ' grid' : '') + (c.stats ? ' withstats' : '') }), side = h('aside', { class: 'sside' }), main = h('main', { class: 'smain' });
    root.append(titleOf(app, w, c.topAction ? h('button', { class: 'sbtn act', onclick: c.topAction.fn && (() => c.topAction.fn(items, draw)) }, c.topAction.label) : null), side, main);
    const stLabel = s => (c.states && c.states[s] ? c.states[s][0] : s), stCls = s => (c.states && c.states[s] ? c.states[s][1] : '');
    const thumb = x => x.img ? h('img', { src: icon(x.img), alt: '' }) : x.grad ? h('i', { class: 'vthumb', style: { background: `linear-gradient(135deg,${x.grad[0]},${x.grad[1]})` } }, h('b', {}, '▶')) : null;
    const drawSide = () => {
      side.innerHTML = ''; side.append(h('input', { class: 'sfind', type: 'search', placeholder: t('f.search'), value: q, 'aria-label': t('f.search'), oninput: e => { q = e.target.value; drawSide(); } }));
      const list = items.filter(x => !q || (x.n + ' ' + (x.sub || '')).toLowerCase().includes(q.toLowerCase()));
      const wrap = h('div', { class: c.grid ? 'tiles' : 'blist' });
      list.forEach(x => wrap.append(h('button', { class: (c.grid ? 'tile' : 'bi') + (x === sel ? ' on' : ''), onclick: () => { sel = x; sfx.tick(); draw(); } },
        thumb(x), h('span', { class: 'bt' }, h('b', {}, x.n), x.sub && !c.grid ? h('small', {}, x.sub) : null), !c.grid && x.state ? h('em', { class: 'dotst ' + stCls(x.state) }) : null)));
      side.append(wrap);
    };
    const drawMain = () => {
      main.innerHTML = '';
      if (c.stats) main.append(h('div', { class: 'statrow' }, c.stats.map(([l, v, d]) => h('div', { class: 'statc' }, h('span', { class: 'mut' }, l), h('b', {}, v), d ? h('small', { class: 'ok' }, d) : null))));
      if (!sel) return main.append(h('div', { class: 'scard center' }, h('p', { class: 'mut' }, t('f.empty'))));
      const dirty = () => { if (c.dirty && sel.state !== c.dirty) { sel.state = c.dirty; drawSide(); chip.className = 'chip ' + stCls(sel.state); chip.textContent = stLabel(sel.state); } };
      const chip = h('span', { class: 'chip ' + stCls(sel.state) }, sel.state ? stLabel(sel.state) : '');
      main.append(h('div', { class: 'shead' }, h('div', { class: 'ht' }, sel.img ? h('img', { class: 'hico', src: icon(sel.img), alt: '' }) : null, h('div', {}, h('h3', {}, sel.n), sel.sub ? h('div', { class: 'mut' }, sel.sub) : null)), chip));
      if (sel.fields.length) main.append(h('div', { class: 'scard tight' }, sel.fields.map(f => h('div', { class: 'frow2' }, h('span', { class: 'mut' }, f[0]),
        h('span', c.editable ? { class: 'ed', contenteditable: 'true', spellcheck: 'false', oninput: e => { f[1] = e.target.textContent; sfx.tick(); dirty(); } } : { class: 'num' }, f[1])))));
      if (sel.body != null) main.append(h('div', { class: 'scard grow' }, h('div', { class: 'sh' }, c.bodyLabel || ''), h('div', { class: 'edbody', contenteditable: 'true', spellcheck: 'false', oninput: e => { sel.body = e.target.innerText; dirty(); } }, typeof sel.body === 'function' ? sel.body() : sel.body)));
      main.append(h('div', { class: 'sact' }, ...(c.actions || []).map(a => h('button', { class: 'sbtn' + (a.pri ? ' acc' : ''), onclick: () => act(a) }, a.label)), dlBtn(app)));
    };
    const act = a => {
      sfx.pop();
      if (a.fn) a.fn(sel, items, draw);
      if (a.set) { if (a.exclusive) items.forEach(x => { if (x.state === a.set) x.state = a.reset || c.state0; }); sel.state = a.set; }
      draw(); a.toast && toast({ icon: icon(app.id), title: app.id, body: typeof a.toast === 'function' ? a.toast(sel) : a.toast });
    };
    const draw = () => { drawSide(); drawMain(); };
    draw(); return root;
  });
}

/* ===================== BARRE DES MENUS (mLINKS, mSILENCE, mDESK, mSPACES, mBACKUP) ===================== */
export function menu(app, c) {
  if (S.extras.has(app.id)) { const e = S.extras.get(app.id); e.el.click(); return; }
  let panel = null, timer = 0;
  const el = h('button', { class: 'mb extra', 'aria-label': app.id }, h('img', { class: 'xicon', src: icon(app.id), alt: '' }));
  const close = () => { if (panel) { panel.remove(); panel = null; clearInterval(timer); removeEventListener('pointerdown', away, true); } };
  const away = e => { if (panel && !panel.contains(e.target) && !el.contains(e.target)) close(); };
  const quit = () => { close(); c.onQuit && c.onQuit(); S.extras.delete(app.id); emit('extras'); sfx.close(); };
  el.onclick = () => {
    if (panel) return close(); sfx.click();
    panel = h('div', { class: 'xp glass', role: 'dialog', 'aria-label': app.id }); $('#layer').append(panel);
    const r = el.getBoundingClientRect(), s = $('#stage').getBoundingClientRect();
    panel.style.top = '38px'; panel.style.right = Math.max(8, (s.right - r.right) / S.scale - 150) + 'px';
    const body = h('div', { class: 'xb' }); panel.append(h('div', { class: 'xh' }, h('img', { src: icon(app.id), alt: '' }), h('b', { html: brand(app.id, app.accent) }), h('span', { class: 'mut' }, c.sub || '')), body,
      h('div', { class: 'xf' }, h('button', { class: 'btn', onclick: () => download(app), disabled: !app.download }, t('f.download')), h('button', { class: 'btn', onclick: quit }, t('mc.quit'))));
    const ctx = { app, close, toast: m => toast({ icon: icon(app.id), title: app.id, body: m }) };
    timer = c.view(body, ctx) || 0;
    panel.animate([{ opacity: 0, transform: 'translateY(-8px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
    setTimeout(() => addEventListener('pointerdown', away, true), 0);
  };
  S.extras.set(app.id, { el, quit }); emit('extras'); sfx.open();
  toast({ icon: icon(app.id), title: app.id, body: t('e.menuHint') });
  setTimeout(() => $('#menubar .extra[aria-label="' + app.id + '"]') && $('#menubar .extra[aria-label="' + app.id + '"]').click(), 900);
}

/* ===================== ASSISTANT (fOMODSIM) ===================== */
function wizard(app, c) {
  return winOf(app, c, w => {
    let step = 0; const pick = c.steps.map(s => new Set(s.def || []));
    const root = h('div', { class: 'skw nosb' }), main = h('main', { class: 'smain' });
    const next = h('button', { class: 'sbtn act', onclick: () => { if (step < c.steps.length) { step++; sfx.click(); draw(); } else { step = 0; draw(); } } }, '');
    root.append(titleOf(app, w, next), main);
    const files = () => c.steps.flatMap((s, i) => [...pick[i]].flatMap(o => s.options[o].files));
    const draw = () => {
      main.innerHTML = ''; const last = step >= c.steps.length;
      next.textContent = last ? t('e.again') : step === c.steps.length - 1 ? t('e.preview') : t('e.next');
      main.append(h('div', { class: 'shead' }, h('h3', {}, last ? t('e.result') : c.steps[step].title), h('span', { class: 'mut' }, t('t.step', { i: Math.min(step + 1, c.steps.length), n: c.steps.length }))));
      if (!last) {
        const s = c.steps[step], grid = h('div', { class: 'opts' });
        s.options.forEach((o, i) => grid.append(h('button', { class: 'opt' + (pick[step].has(i) ? ' on' : ''), onclick: () => { if (s.multi) { pick[step].has(i) ? pick[step].delete(i) : pick[step].add(i); } else { pick[step].clear(); pick[step].add(i); } sfx.tick(); draw(); } },
          h('i', { class: s.multi ? 'cbx' : 'rad' }, pick[step].has(i) ? '✓' : ''), h('span', {}, h('b', {}, o.n), h('small', { class: 'mut' }, o.d)))));
        main.append(grid);
      } else {
        const f = files(); main.append(h('div', { class: 'scard grow' }, h('div', { class: 'sh' }, t('e.filesN', { n: f.length })), h('pre', { class: 'tree' }, f.map(x => '├ ' + x).join('\n') || '—')),
          h('div', { class: 'sact' }, dlBtn(app)));
      }
    };
    draw(); return root;
  });
}
