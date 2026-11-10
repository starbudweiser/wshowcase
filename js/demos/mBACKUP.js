/* Réplique interactive de mBACKUP (interface Socle) : copies miroir planifiées, dans la barre des menus. Icône qui tourne en orange pendant une tâche,
   menu des tâches, fenêtre à deux colonnes (tâches / éditeur en cartes), simulation (rsync -n), exécution avec progression, journal, réglages.
   Données d'exemple : aucune copie n'a lieu, rien n'est lu ni envoyé. */
import { S, emit } from '../core.js';
import { h, $, T, sfx, toast, wm, bar, icon as appIcon, clamp } from './kit.js';
import { cssReady, SVG, macMenu, closeMenus, menuOpenFor, sheet, aboutWin, bhtml } from './mLINKS.js';

const ID = 'mBACKUP', BRAND = '#2dd4bf', CSS2 = 'css/demos/mBACKUP.css';
const bn = s => bhtml(s, ID, BRAND);
const ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
/* motif de l'icône (anneau fléché + deux disques), une seule teinte : filigrane et état vide */
const MARK = '<svg viewBox="-320 -320 640 640" aria-hidden="true"><path d="M206.8 -173.5A270 270 0 1 0 221.2 154.9" fill="none" stroke="currentColor" stroke-width="58"/><path d="M281.4 68.9 151.6 106.1 290.8 203.7z" fill="currentColor"/><rect x="-150" y="-100" width="300" height="76" rx="30" fill="currentColor"/><rect x="-150" y="24" width="300" height="76" rx="30" fill="currentColor"/></svg>';
const FOLDER = '<svg viewBox="0 0 16 16"><path d="M1.5 4.3c0-.7.5-1.3 1.2-1.3h3.1c.4 0 .7.2 1 .5l.8.9h5.7c.7 0 1.2.6 1.2 1.3v6.3c0 .7-.5 1.3-1.2 1.3H2.7c-.7 0-1.2-.6-1.2-1.3z" fill="#3b9aee"/><path d="M1.5 6.4h13v6.2c0 .7-.5 1.3-1.2 1.3H2.7c-.7 0-1.2-.6-1.2-1.3z" fill="#68b8fa"/></svg>';

/* ====================================================================== données ====================================================================== */
let TASKS = null, SEL = null, QUEUE = [], PROG = {}, DRYQ = new Set(), RUN = null, PEND = null, extra = null, uidN = 0, WANT_SET = false;
const PREFS = { errorsOnly: true, login: true, auto: true, hasPw: false };
const UNPLUGGED = ['/Volumes/SKYRIM'];                 // disque externe débranché : rien ne peut le monter
const views = new Set();
const uid = () => 'b' + (++uidN);
const loc = () => T('fr-FR', 'en-US');
const ago = (n, hh, mm) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hh, mm, 0, 0); return d; };
const fmtDate = d => d.toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + T('à', 'at') + ' ' + d.toLocaleTimeString(loc(), { hour: T('2-digit', 'numeric'), minute: '2-digit' });
const wk = () => [0, 1, 2, 3, 4, 5, 6].map(i => new Date(2024, 0, 1 + i).toLocaleDateString(loc(), { weekday: 'short' }));
const nbr = n => n.toLocaleString(loc());
const volRoot = p => { const m = /^\/Volumes\/([^/]+)/.exec(p || ''); return m ? '/Volumes/' + m[1] : null; };
const copied = (c, d) => T(`${nbr(c)} copié(s), ${nbr(d)} supprimé(s)`, `${nbr(c)} copied, ${nbr(d)} deleted`);

function mk(o) {
  return { id: uid(), name: T('Nouvelle tâche', 'New task'), source: '', destination: '', d2: null, srcAuto: true, dstAuto: true, d2Auto: true, enabled: true, days: [0, 1, 2, 3, 4, 5, 6], hour: 3, min: 0, catchUp: true,
    admin: false, mirror: true, hidden: false, versioning: false, kept: 10, excludes: '', last: null, pend: { c: 0, u: 0, d: 0 }, vanish: false, ...o };
}
function seed() {
  const lng = T('fr', 'en');
  return { lang: lng, dirty: false, tasks: [
    mk({ name: T('Photos → NAS', 'Photos → NAS'), source: '/Users/lea/Pictures/' + T('Photothèque', 'Library'), destination: '/Volumes/NAS/Sauvegardes/Photos', pend: { c: 12, u: 3, d: 2 },
      last: { date: ago(1, 3, 0), outcome: 'success', detail: copied(1284, 12), log: 1 } }),
    mk({ name: T('Projets → Disque externe', 'Projects → External disk'), source: '/Users/lea/Documents/' + T('Projets', 'Projects'), destination: '/Volumes/Backup/' + T('Projets', 'Projects'), days: [0, 1, 2, 3, 4], hour: 18, min: 30,
      versioning: true, kept: 10, excludes: '.DS_Store\nnode_modules/\n*.tmp', pend: { c: 9, u: 14, d: 2 }, vanish: true,
      last: { date: ago(2, 18, 30), outcome: 'warnings', detail: copied(37, 2) + T(', avec avertissements', ', with warnings'), log: 1 } }),
    mk({ name: 'Mods Skyrim → NAS', source: '/Volumes/SKYRIM/Mods', destination: '/Volumes/NAS/Sauvegardes/Mods', days: [5], hour: 4, min: 0, enabled: false, pend: { c: 58, u: 6, d: 0 } })
  ] };
}
const data = () => { if (!TASKS || (!TASKS.dirty && TASKS.lang !== T('fr', 'en'))) { TASKS = seed(); SEL = TASKS.tasks[0].id; } return TASKS; };
const tasks = () => data().tasks;
const touch = () => { data().dirty = true; };
const task = id => tasks().find(t => t.id === id);
const cur = () => task(SEL) || tasks()[0] || null;
const isRun = id => QUEUE[0] === id, isQ = id => QUEUE.includes(id);
const ST = { running: ['En cours', 'Running'], idle: ['En attente', 'Waiting'], disabled: ['Désactivée', 'Disabled'], never: ['Jamais lancée', 'Never run'], success: ['Réussie', 'Succeeded'], warnings: ['Avec avertissements', 'With warnings'], failed: ['Échec', 'Failed'], skipped: ['Ignorée', 'Skipped'] };
const stKey = t => (isRun(t.id) ? 'running' : isQ(t.id) ? 'idle' : !t.enabled ? 'disabled' : !t.last ? 'never' : t.last.outcome);
const stText = t => T(...ST[stKey(t)]);
const stCls = t => ({ running: 'run', success: 'ok', warnings: 'wn', failed: 'dg' }[stKey(t)] || '');
const stColor = t => ({ run: 'var(--acct)', ok: 'var(--ok)', wn: 'var(--wn)', dg: 'var(--dg)' }[stCls(t)] || 'var(--tm)');
function nextOcc(t) {
  if (!t.enabled || !t.days.length) return null; const now = new Date();
  for (let a = 0; a <= 8; a++) { const d = new Date(now); d.setDate(d.getDate() + a); d.setHours(t.hour, t.min, 0, 0); if (d > now && t.days.includes((d.getDay() + 6) % 7)) return d; }
  return null;
}

/* ---------- exécution simulée (rsync) ---------- */
const POOL = t => (/Pictures/.test(t.source) ? i => `${2026 - (i % 3 === 0 ? 1 : 0)}/${String(1 + (i * 7) % 12).padStart(2, '0')}/IMG_${5100 + i * 13}.HEIC` : /Projets|Projects/.test(t.source) ? i => ['src/components/Panel', 'src/lib/store', 'docs/notes-', 'assets/img/hero-', 'src/pages/Page'][i % 5] + (i + 1) + ['.tsx', '.ts', '.md', '.png', '.tsx'][i % 5] : i => ['Data/Textures/landscape/tex_', 'Data/Meshes/armor/mesh_', 'Data/Scripts/mod_'][i % 3] + (200 + i * 3) + ['.dds', '.nif', '.pex'][i % 3]);
function dryLines(t) {
  const f = POOL(t), L = []; let k = 0; const p = t.pend;
  for (let i = 0; i < Math.min(p.c, 120); i++) L.push('>f+++++++++ ' + f(k++));
  for (let i = 0; i < Math.min(p.u, 60); i++) L.push('>f.st...... ' + f(k++));
  for (let i = 0; i < Math.min(p.d, 40); i++) L.push('*deleting   ' + f(k++ + 50));
  return L;
}
function logText(t) {
  const l = t.last, c = (t.lastRun ? t.lastRun.c + t.lastRun.u : 0) || 37, d = t.lastRun ? t.lastRun.d : 2; if (!l) return '';
  const f = POOL(t), lines = [`=== ${t.name} ===`, 'sending incremental file list'];
  for (let i = 0; i < Math.min(c, 14); i++) lines.push(f(i)); if (c > 14) lines.push(`… (${c - 14} ${T('autres', 'more')})`);
  for (let i = 0; i < Math.min(d, 6); i++) lines.push('deleting ' + f(90 + i));
  if (l.outcome === 'warnings') lines.push('file has vanished: "' + f(3) + '"', 'rsync warning: some files vanished before they could be transferred (code 24)');
  lines.push('', `Number of files: ${nbr(4312)} (reg: ${nbr(4101)}, dir: 211)`, `Number of created files: ${Math.max(0, c - 4)}`, `Number of deleted files: ${d}`, `Number of regular files transferred: ${c}`,
    `Total file size: 1.48G bytes`, `Total transferred file size: 42.1M bytes`, `sent 42.3M bytes  received 1.2K bytes  8.6M bytes/sec`, `total size is 1.48G  speedup is 35.0`);
  return lines.join('\n');
}
function execute(t, dry) {
  const roots = [[t.source, 'src'], [t.destination, 'dst'], ...(t.d2 ? [[t.d2.path, 'd2']] : [])];
  if (!t.source.trim()) return { outcome: 'skipped', detail: T('Dossier source introuvable : ', 'Source folder not found: ') + t.source, retry: true };
  for (const [p] of roots) { const r = volRoot(p); if (r && UNPLUGGED.includes(r)) return { outcome: 'skipped', detail: T(`Volume introuvable : ${r}`, `Volume not found: ${r}`), retry: true }; }
  if (!t.destination.trim()) return { outcome: 'skipped', detail: T('Dossier source introuvable : ', 'Source folder not found: ') + t.destination, retry: true };
  if (dry) return { outcome: 'success', dry: { name: t.name, lines: dryLines(t), c: t.pend.c, u: t.pend.u, d: t.pend.d } };
  const p = t.pend; let det = copied(p.c + p.u, p.d), out = 'success';
  if (t.vanish) { out = 'warnings'; det += T(', avec avertissements', ', with warnings'); }
  return { outcome: out, detail: det, run: { ...p } };
}
const repaint = () => views.forEach(v => v.paint());
function enqueue(id, dry) {
  if (QUEUE.includes(id) || !task(id)) return; QUEUE.push(id); if (dry) DRYQ.add(id); sfx.click(); setIcon(); repaint(); pump();
}
function runAll() { tasks().filter(t => t.enabled).forEach(t => enqueue(t.id, false)); }
function stopTask(id) {
  if (QUEUE[0] === id) { const wasDry = DRYQ.has(id); clearInterval(RUN); RUN = null; QUEUE.shift(); DRYQ.delete(id); delete PROG[id]; const t = task(id); if (t && !wasDry) { t.last = { date: new Date(), outcome: 'skipped', detail: T('Arrêtée', 'Stopped') }; t.lastRun = null; }
    sfx.close(); setIcon(); repaint(); pump(); } else { QUEUE = QUEUE.filter(x => x !== id); DRYQ.delete(id); setIcon(); repaint(); }
}
function pump() {
  if (RUN || !QUEUE.length) return; const id = QUEUE[0], t = task(id); if (!t) { QUEUE.shift(); return pump(); }
  const dry = DRYQ.has(id), dur = dry ? 1300 : 3800 + Math.min(1800, (t.pend.c + t.pend.u) * 25), t0 = performance.now(); PROG[id] = 0;
  RUN = setInterval(() => {
    const k = clamp((performance.now() - t0) / dur, 0, 1); PROG[id] = k >= 1 ? 1 : clamp(k + Math.sin(k * 17) * .035, 0, .995);
    if (k >= 1) finish(id, dry); else views.forEach(v => v.run());
  }, 90);
  repaint();
}
function finish(id, dry) {
  clearInterval(RUN); RUN = null; QUEUE.shift(); DRYQ.delete(id); delete PROG[id]; const t = task(id), r = t ? execute(t, dry) : null;
  if (t && r) {
    if (dry) {
      if (r.dry) { PEND = r.dry; sfx.done(); } else { PEND = { notice: r.detail }; sfx.tick(); }
    } else {
      t.last = { date: new Date(), outcome: r.outcome, detail: r.detail, log: 1 }; if (r.run) { t.lastRun = r.run; t.pend = { c: 0, u: 0, d: 0 }; }
      sfx.done(); notify(t, r);
    }
  }
  setIcon(); repaint(); views.forEach(v => v.dry()); pump();
}
function notify(t, r) {
  if (PREFS.errorsOnly && r.outcome === 'success') return;
  const key = r.outcome === 'success' ? T('terminée', 'finished') : r.outcome === 'warnings' ? T('terminée avec avertissements', 'finished with warnings') : T('échec', 'failed');
  toast({ icon: appIcon(ID), title: `${t.name}${T(' : ', ': ')}${key}`, body: r.detail });
}
function setIcon() { extra && extra.classList.toggle('mbk-run', QUEUE.length > 0); }

/* ====================================================================== barre des menus ====================================================================== */
function menuItems(app) {
  const items = [];
  if (!tasks().length) items.push({ label: T('Aucune tâche', 'No tasks'), disabled: true });
  tasks().forEach(t => items.push({ label: `${t.name} — ${isRun(t.id) ? T('en cours', 'running') + ' ' + Math.round((PROG[t.id] || 0) * 100) + ' %' : stText(t)}`, disabled: isQ(t.id), fn: () => enqueue(t.id, false) }));
  items.push({ sep: 1 }, { label: T('Tout lancer', 'Run all'), disabled: !tasks().length, fn: runAll }, { label: T('Ouvrir mBACKUP', 'Open mBACKUP'), fn: () => openWin(app) },
    { label: T('Réglages…', 'Settings…'), fn: () => { WANT_SET = true; openWin(app); } }, { sep: 1 },
    { label: T('À propos de mBACKUP', 'About mBACKUP'), fn: () => about(app) }, { label: T('Quitter mBACKUP', 'Quit mBACKUP'), key: '⌘Q', fn: () => quit() });
  return items;
}
const about = app => aboutWin(app, { brandColor: BRAND, tagline: () => T('Copies miroir planifiées de vos dossiers, simples et fiables.', 'Scheduled mirror copies of your folders, simple and reliable.'),
  credit: () => T('Inspiré de Get Backup Pro, sans lien avec BeLight Software.', 'Inspired by Get Backup Pro, not affiliated with BeLight Software.') });
function quit() {
  closeMenus(); [...wm.wins.values()].filter(w => w.appId === ID).forEach(w => wm.close(w.id));
  clearInterval(RUN); RUN = null; QUEUE = []; DRYQ.clear(); PROG = {}; PEND = null; extra = null; S.extras.delete(ID); emit('extras'); sfx.close();
}
function install(app) {
  extra = h('button', { class: 'mb extra mbk-xicon', 'aria-label': ID, html: ICON_SVG });
  extra.onclick = () => { if (menuOpenFor(extra)) closeMenus(); else { sfx.click(); macMenu(extra, menuItems(app)); } };
  S.extras.set(ID, { el: extra, quit }); emit('extras'); sfx.open(); setIcon();
  toast({ icon: appIcon(ID), title: ID, body: T('L’appli est dans la barre des menus. Cliquez sur son icône : un clic sur une tâche la lance.', 'The app is in the menu bar. Click its icon: a click on a task runs it.') });
  setTimeout(() => { const el = extra; if (el && el.isConnected && !$('.mlkx-menu') && !$('.mlkx-scrim')) { sfx.click(); macMenu(el, menuItems(app)); } }, 900);
}
export async function open(app) {
  await cssReady(CSS2); data();
  if (S.extras.has(ID)) return openWin(app);
  install(app);
}

/* ====================================================================== fenêtre ====================================================================== */
function openWin(app) {
  const A = { ...app, accent: BRAND };
  return wm.open({ id: 'app:' + ID, appId: ID, title: ID, w: 1100, h: 700, minw: 900, minh: 520, bare: true, cls: 'socle mlkx-win',
    onclose: w => { w.dead = true; w.off && w.off(); },
    build: w => {
      data(); w.render = () => { w.off && w.off(); w.body.innerHTML = ''; w.body.append(ui(w, A)); };
      return ui(w, A);
    } });
}

function ui(w, A) {
  const root = h('div', { class: 'mlkx-root mbk' });
  const side = h('aside', { class: 'mbk-side' }), ed = h('main', { class: 'mbk-ed' }), cols = h('div', { class: 'mbk-cols' }, side, ed);
  const tasksEl = h('div', { class: 'mbk-tasks', role: 'listbox', 'aria-label': T('Tâches', 'Tasks') });
  let ro = null, headEl = null, lastEl = null, grid = null, cards = [], colEls = [], nCols = 0, focusCard = null, hoverCard = null, closeDry = null;
  const gear = h('button', { class: 'mlkx-btn mbk-gear', style: { marginLeft: 'auto', minHeight: '32px' }, 'aria-label': T('Réglages…', 'Settings…'), title: T('Réglages…', 'Settings…'), html: GEAR, onclick: () => openSettings() });
  root.append(bar(A, w, gear), cols);
  const view = { paint: () => { if (w.dead) return; paintSide(); paintHead(); paintLast(); }, run: () => { if (!w.dead) paintRun(); }, dry: () => { if (!w.dead) showDry(); } };
  views.add(view); w.off = () => { views.delete(view); ro && ro.disconnect(); closeDry && closeDry(); closeDry = null; removeEventListener('keydown', escKey, true); };
  const escKey = () => {};

  /* ----- colonne de gauche ----- */
  const sub = t => (isRun(t.id) ? `${T('En cours', 'Running')} · ${Math.round((PROG[t.id] || 0) * 100)} %` : nextOcc(t) ? T('Prochaine : ', 'Next: ') + fmtDate(nextOcc(t)) : stText(t));
  const dot = t => h('i', { class: 'mlkx-dot ' + stCls(t) });
  function paintSide() {
    const keep = tasksEl.scrollTop; tasksEl.innerHTML = '';
    tasks().forEach(t => tasksEl.append(h('button', { class: 'mbk-t' + (t.id === SEL ? ' on' : ''), role: 'option', 'aria-selected': String(t.id === SEL), 'data-id': t.id, onclick: () => { if (SEL !== t.id) { SEL = t.id; sfx.tick(); paintSide(); buildEd(); } } },
      dot(t), h('span', { class: 'mbk-tx' }, h('span', { class: 'mbk-nm' }, t.name || ' '), h('span', { class: 'mbk-sb', 'data-sb': t.id }, sub(t))))));
    tasksEl.scrollTop = keep;
  }
  const add = () => { const t = mk({}); tasks().push(t); SEL = t.id; touch(); sfx.pop(); paintSide(); buildEd(); };
  side.append(h('div', { class: 'mbk-wm', html: MARK }), h('div', { class: 'mbk-eb mlkx-eyebrow' }, T('Tâches', 'Tasks')), tasksEl,
    h('div', { class: 'mbk-foot' }, h('button', { class: 'mlkx-btn tok', onclick: add }, T('Nouvelle tâche', 'New task'))));

  /* ----- éditeur ----- */
  function paintHead() {
    if (!headEl) return; const t = cur(); if (!t) return; headEl.innerHTML = '';
    const q = isQ(t.id);
    headEl.append(h('div', { class: 'mbk-hx' }, h('h2', { class: 'mlkx-heading' }, t.name || ' '), h('span', { class: 'mbk-stat', style: { color: stColor(t) } }, stText(t))),
      ...(q ? [h('button', { class: 'mlkx-btn', onclick: () => stopTask(t.id) }, T('ARRÊTER', 'STOP'))]
        : [h('button', { class: 'mlkx-btn', onclick: () => enqueue(t.id, true) }, T('SIMULER', 'SIMULATE')), h('button', { class: 'mlkx-btn pri', onclick: () => enqueue(t.id, false) }, T('LANCER', 'RUN'))]));
  }
  function paintLast() {
    if (!lastEl) return; const t = cur(); if (!t) return; lastEl.innerHTML = '';
    if (isQ(t.id)) lastEl.append(h('div', { class: 'mbk-bar' }, h('i', { 'data-prog': t.id, style: { width: Math.round((PROG[t.id] || 0) * 100) + '%' } })));
    if (t.last) {
      lastEl.append(h('div', { class: 'mbk-lrow' }, h('i', { class: 'mlkx-dot ' + ({ success: 'ok', warnings: 'wn', failed: 'dg' }[t.last.outcome] || '') }), h('span', {}, T('Dernière : ', 'Last: ') + fmtDate(t.last.date))),
        h('div', { class: 'mlkx-muted' }, t.last.detail));
      if (t.last.log) lastEl.append(h('button', { class: 'mlkx-btn', style: { width: '200px' }, onclick: () => logSheet(t) }, T('Ouvrir le journal', 'Open log')));
    } else lastEl.append(h('div', { class: 'mlkx-muted' }, T('Jamais lancée', 'Never run')));
    const n = nextOcc(t); if (n) lastEl.append(h('div', { class: 'mbk-hint' }, T('Prochaine : ', 'Next: ') + fmtDate(n)));
  }
  function paintRun() {
    const t = cur(); tasksEl.querySelectorAll('[data-sb]').forEach(e => { const x = task(e.dataset.sb); if (x && isRun(x.id)) e.textContent = sub(x); });
    const p = ed.querySelector('[data-prog]'); if (p && t) p.style.width = Math.round((PROG[t.id] || 0) * 100) + '%';
    const hx = headEl && headEl.querySelector('.mbk-stat'); if (hx && t && isRun(t.id)) hx.textContent = stText(t);
  }

  /* cases à cocher, champs et cartes */
  const chk = (label, get, set, help) => { const b = h('button', { class: 'mlkx-chk', role: 'checkbox', 'aria-checked': String(!!get()), onclick: () => { const v = !get(); set(v); b.setAttribute('aria-checked', String(v)); sfx.tick(); } },
    h('i', { html: SVG.check }), h('span', {}, label, help ? h('small', {}, help) : null)); return b; };
  const card = (title, subtitle, ...kids) => h('section', { class: 'mbk-card' }, h('header', {}, h('h3', { class: 'mlkx-title' }, title), subtitle ? h('p', { class: 'mbk-sub' }, subtitle) : null), ...kids);
  const input = (val, on, o = {}) => { const i = h('input', { class: 'mlkx-field' + (o.mono ? ' mono val' : ''), type: o.type || 'text', value: val, spellcheck: 'false', autocomplete: 'off', 'aria-label': o.label || null, placeholder: o.ph || null });
    i.addEventListener('input', () => on(i.value)); return i; };
  function folderPick(cb, initial) {
    const LIST = ['/Users/lea/Pictures/' + T('Photothèque', 'Library'), '/Users/lea/Documents/' + T('Projets', 'Projects'), '/Users/lea/Documents', '/Users/lea/Desktop', '/Volumes/NAS/Sauvegardes/Photos', '/Volumes/NAS/Sauvegardes/Documents', '/Volumes/Backup/' + T('Projets', 'Projects'), '/Volumes/Backup'];
    let pick = initial && LIST.includes(initial) ? initial : null; const list = h('div', { class: 'mbk-pick' }), ok = h('button', { class: 'mlkx-btn pri', disabled: true }, T('Ouvrir', 'Open'));
    const paint = () => { list.innerHTML = ''; LIST.forEach(p => list.append(h('button', { class: 'mbk-pi' + (p === pick ? ' on' : ''), onclick: () => { pick = p; sfx.tick(); paint(); }, ondblclick: () => { pick = p; ok.click(); } }, h('i', { html: FOLDER, style: { display: 'contents' } }), h('span', {}, p)))); ok.disabled = !pick; };
    paint(); const close = sheet(root, { title: T('Choisir un dossier', 'Choose a folder'), text: T('Aucun fichier n’est modifié.', 'No file is changed.'), body: list, buttons: [{ label: T('Annuler', 'Cancel') }], wide: 520 });
    const bt = root.querySelector('.mlkx-dlg .mlkx-dbtns'); bt.append(ok); ok.onclick = () => { if (pick) { close(); cb(pick); } };
  }
  const pathField = (label, get, set, mountGet, mountSet) => {
    const f = h('div', { class: 'mbk-fld' }), t = cur();
    const row = h('div', { class: 'mbk-row' }, input(get(), v => { set(v); touch(); paintLast(); const m = volRoot(v); mnt(m); }, { mono: true, label }), h('button', { class: 'mlkx-btn', onclick: () => folderPick(p => { set(p); touch(); buildEd(); }, get()) }, T('Choisir…', 'Choose…')));
    const mnt = r => { const old = f.querySelector('.mlkx-chk'); if (r && !old) f.append(chk(T('Monter ce volume s’il est absent', 'Mount this volume if it is missing'), mountGet, mountSet)); else if (!r && old) old.remove(); };
    f.append(h('div', { class: 'mbk-lab' }, label), row); mnt(volRoot(get())); void t; return f;
  };

  function buildEd() {
    closeDry && closeDry(); closeDry = null; ro && ro.disconnect(); ed.innerHTML = ''; headEl = lastEl = grid = null; const t = cur();
    if (!t) {
      const c = h('div', { class: 'mbk-ec' }, h('div', { class: 'mbk-card' }, h('div', { class: 'mbk-mk', html: MARK }), h('h2', { class: 'mlkx-display' }, T('Créez votre première tâche', 'Create your first task')),
        h('p', {}, T('mBACKUP copie vos dossiers vers un disque ou un partage, aux heures choisies. Aucun fichier d’origine n’est modifié.', 'mBACKUP copies your folders to a disk or a share at the times you choose. No original file is modified.')),
        h('button', { class: 'mlkx-btn act', onclick: add }, T('Nouvelle tâche', 'New task'))));
      ed.append(h('div', { class: 'mbk-empty' }, c)); return;
    }
    headEl = h('div', { class: 'mbk-eh' });
    const days = wk();
    /* Général */
    const general = card(T('Général', 'General'), null,
      h('div', { class: 'mbk-fld' }, h('div', { class: 'mbk-lab' }, T('Nom', 'Name')), input(t.name, v => { t.name = v; touch(); paintSide(); paintHead(); }, { label: T('Nom', 'Name') })),
      chk(T('Tâche activée', 'Task enabled'), () => t.enabled, v => { t.enabled = v; touch(); paintSide(); paintHead(); paintLast(); }),
      h('button', { class: 'mlkx-btn tdg', style: { width: '200px', alignSelf: 'center' }, onclick: () => askDelete(t) }, T('Supprimer la tâche', 'Delete task')));
    /* Dossiers */
    const second = h('div', { class: 'mbk-fld' });
    const paintSecond = () => { second.innerHTML = '';
      if (t.d2) second.append(h('hr', { class: 'mbk-sep' }), pathField(T('Deuxième destination', 'Second destination'), () => t.d2.path, v => { t.d2.path = v; }, () => t.d2Auto, v => { t.d2Auto = v; }),
        h('button', { class: 'mlkx-btn ter', style: { width: '260px', alignSelf: 'center' }, onclick: () => { t.d2 = null; touch(); paintSecond(); paintLast(); } }, T('Retirer la deuxième destination', 'Remove the second destination')));
      else second.append(h('button', { class: 'mlkx-btn', style: { width: '260px', alignSelf: 'center' }, onclick: () => { t.d2 = { path: '' }; touch(); paintSecond(); } }, T('Ajouter une deuxième destination', 'Add a second destination'))); };
    paintSecond();
    const paths = card(T('Dossiers', 'Folders'), T('La destination devient une copie exacte de la source.', 'The destination becomes an exact copy of the source.'),
      pathField(T('Source', 'Source'), () => t.source, v => { t.source = v; }, () => t.srcAuto, v => { t.srcAuto = v; }),
      pathField(T('Destination', 'Destination'), () => t.destination, v => { t.destination = v; }, () => t.dstAuto, v => { t.dstAuto = v; }), second);
    /* Planification */
    const dayRow = h('div', { class: 'mbk-days', role: 'group', 'aria-label': T('Jours', 'Days') });
    const paintDays = () => { dayRow.innerHTML = ''; days.forEach((d, i) => dayRow.append(h('button', { 'aria-pressed': String(t.days.includes(i)), onclick: () => { t.days = t.days.includes(i) ? t.days.filter(x => x !== i) : [...t.days, i].sort(); touch(); sfx.tick(); paintDays(); paintSide(); paintLast(); } }, d))); };
    paintDays();
    const stepper = () => {
      const hh = h('input', { type: 'text', inputmode: 'numeric', 'aria-label': T('Heure', 'Hour'), value: String(t.hour).padStart(2, '0'), maxlength: '2' }), mm = h('input', { type: 'text', inputmode: 'numeric', 'aria-label': T('Minute', 'Minute'), value: String(t.min).padStart(2, '0'), maxlength: '2' });
      let focus = hh; hh.onfocus = () => { focus = hh; hh.select(); }; mm.onfocus = () => { focus = mm; mm.select(); };
      const set = () => { touch(); hh.value = String(t.hour).padStart(2, '0'); mm.value = String(t.min).padStart(2, '0'); paintSide(); paintLast(); };
      const bump = d => { if (focus === hh) t.hour = (t.hour + d + 24) % 24; else t.min = (t.min + d + 60) % 60; set(); sfx.tick(); };
      [[hh, v => { t.hour = clamp(v, 0, 23); }], [mm, v => { t.min = clamp(v, 0, 59); }]].forEach(([el, fn]) => {
        el.addEventListener('input', () => { const v = parseInt(el.value, 10); if (!isNaN(v)) { fn(v); touch(); paintSide(); paintLast(); } });
        el.addEventListener('blur', () => set());
        el.addEventListener('keydown', e => { if (e.key === 'ArrowUp') { e.preventDefault(); focus = el; bump(1); } else if (e.key === 'ArrowDown') { e.preventDefault(); focus = el; bump(-1); } });
        el.addEventListener('wheel', e => { if (document.activeElement === el) { e.preventDefault(); focus = el; bump(e.deltaY < 0 ? 1 : -1); } }, { passive: false }); });
      const up = h('button', { 'aria-label': '+', html: SVG.up, tabindex: '-1', onclick: () => bump(1) }), dn = h('button', { 'aria-label': '−', html: SVG.down, tabindex: '-1', onclick: () => bump(-1) });
      return h('div', { class: 'mbk-step' }, h('span', { class: 'mbk-sg' }, hh, ':', mm), h('span', { class: 'mbk-ar' }, up, dn));
    };
    const schedule = card(T('Planification', 'Schedule'), null, h('div', { class: 'mbk-fld' }, h('div', { class: 'mbk-lab' }, T('Jours', 'Days')), dayRow),
      h('div', { class: 'mbk-time' }, h('span', { class: 'mbk-lab' }, T('Heure', 'Time')), stepper()),
      chk(T('Rattraper une exécution manquée', 'Catch up a missed run'), () => t.catchUp, v => { t.catchUp = v; touch(); }, T('Lance la tâche dès que possible si le Mac était éteint ou le disque absent à l’heure prévue.', 'Runs the task as soon as possible if the Mac was off or the disk missing at the scheduled time.')));
    /* Options */
    const vers = h('div', { class: 'mbk-fld' });
    const paintVers = () => { vers.innerHTML = ''; if (!t.versioning) return;
      const n = h('input', { type: 'text', inputmode: 'numeric', value: String(t.kept), maxlength: '3', 'aria-label': T('Versions conservées', 'Versions kept') });
      const setN = v => { t.kept = clamp(v, 1, 100); n.value = String(t.kept); touch(); };
      n.addEventListener('change', () => setN(parseInt(n.value, 10) || 1)); n.addEventListener('keydown', e => { if (e.key === 'ArrowUp') { e.preventDefault(); setN(t.kept + 1); } if (e.key === 'ArrowDown') { e.preventDefault(); setN(t.kept - 1); } });
      vers.append(h('div', { class: 'mbk-num' }, h('span', { class: 'mbk-lab' }, T('Versions conservées', 'Versions kept')),
        h('div', { class: 'mbk-step' }, h('span', { class: 'mbk-sg' }, n), h('span', { class: 'mbk-ar' }, h('button', { 'aria-label': '+', html: SVG.up, tabindex: '-1', onclick: () => setN(t.kept + 1) }), h('button', { 'aria-label': '−', html: SVG.down, tabindex: '-1', onclick: () => setN(t.kept - 1) })))),
        h('button', { class: 'mlkx-btn', style: { width: '220px' }, onclick: () => toast({ icon: appIcon(ID), title: ID, body: T('Dossier des versions affiché dans le Finder : mBACKUP versions/', 'Versions folder shown in Finder: mBACKUP versions/') }) }, T('Afficher les versions', 'Show versions'))); };
    paintVers();
    const options = card(T('Options', 'Options'), null,
      chk(T('Miroir : supprimer à la destination ce qui n’existe plus à la source', 'Mirror: delete at the destination what no longer exists at the source'), () => t.mirror, v => { t.mirror = v; touch(); }),
      chk(T('Ignorer les fichiers invisibles', 'Skip invisible files'), () => t.hidden, v => { t.hidden = v; touch(); }),
      chk(T('Exécuter avec les droits administrateur', 'Run with administrator rights'), () => t.admin, v => { t.admin = v; touch(); }, T('Utile pour les fichiers d’autres utilisateurs. Demande le mot de passe dans les réglages.', 'Useful for files owned by other users. The password is set in Settings.')),
      chk(T('Garder des copies versionnées', 'Keep versioned copies'), () => t.versioning, v => { t.versioning = v; touch(); paintVers(); }, T('Les fichiers remplacés ou supprimés sont rangés dans un dossier daté, à côté de la destination, au lieu d’être perdus.', 'Replaced or deleted files are moved to a dated folder next to the destination instead of being lost.')), vers);
    /* Exclusions */
    const ta = h('textarea', { class: 'mlkx-field mono', rows: '6', spellcheck: 'false', 'aria-label': T('Motifs rsync, un par ligne', 'rsync patterns, one per line'), style: { minHeight: '130px' } }); ta.value = t.excludes; ta.addEventListener('input', () => { t.excludes = ta.value; touch(); });
    const excludes = card(T('Exclusions', 'Exclusions'), T('Motifs rsync, un par ligne', 'rsync patterns, one per line'), ta, h('div', { class: 'mbk-hint' }, T('Exemples : .DS_Store, node_modules/, *.tmp', 'Examples: .DS_Store, node_modules/, *.tmp')));
    /* Dernière exécution */
    lastEl = h('div', { class: 'mbk-last' }); const last = h('section', { class: 'mbk-card mid' }, h('header', {}, h('h3', { class: 'mlkx-title' }, T('Dernière exécution', 'Last run'))), lastEl);
    cards = [general, paths, schedule, options, excludes, last];
    grid = h('div', { class: 'mbk-grid' }); const scroll = h('div', { class: 'mbk-scroll' }, grid); ed.append(headEl, scroll);
    paintHead(); paintLast(); layout(true);
    ro = new ResizeObserver(() => layout()); ro.observe(scroll); cards.forEach(c => ro.observe(c));
    cards.forEach(c => {
      c.addEventListener('pointerenter', () => { hoverCard = c; spot(); }); c.addEventListener('pointerleave', () => { if (hoverCard === c) hoverCard = null; spot(); });
      c.addEventListener('focusin', () => { focusCard = c; spot(); }); c.addEventListener('focusout', e => { if (!c.contains(e.relatedTarget)) { if (focusCard === c) focusCard = null; spot(); } });
    });
    showDry();
  }
  /* mise en avant du module actif : les autres passent à 45 % */
  function spot() { const a = focusCard || hoverCard; cards.forEach(c => c.style.opacity = a && c !== a ? '.45' : ''); }
  /* grille en maçonnerie : chaque carte se pose sous la colonne la plus courte */
  function layout(force) {
    if (!grid) return; const W = grid.clientWidth || 600, n = clamp(Math.floor((W + 16) / (370 + 16)), 1, 4);
    const hs = new Map(cards.map(c => [c, c.offsetHeight])), tot = Array(n).fill(0), asg = cards.map(c => { let k = 0; tot.forEach((v, i) => { if (v < tot[k]) k = i; }); tot[k] += hs.get(c) + 16; return k; });
    const same = !force && n === nCols && cards.every((c, i) => colEls[asg[i]] && c.parentElement === colEls[asg[i]]); if (same) return;
    const act = document.activeElement; if (!force && n === nCols && act && cards.some((c, i) => c.contains(act) && c.parentElement !== colEls[asg[i]])) return;
    nCols = n; colEls = Array.from({ length: n }, () => h('div', { class: 'mbk-col' })); cards.forEach((c, i) => colEls[asg[i]].append(c)); grid.replaceChildren(...colEls);
    if (act && act.isConnected && act !== document.body) act.focus({ preventScroll: true });
  }

  /* ----- feuilles : suppression, simulation, journal, réglages ----- */
  function askDelete(t) {
    sheet(root, { html: true, title: T('Supprimer cette tâche ?', 'Delete this task?'), text: bn(T(`La tâche « ${t.name} » sera retirée de mBACKUP. Vos fichiers et leurs copies ne sont pas touchés.`, `The task “${t.name}” will be removed from mBACKUP. Your files and their copies are not touched.`)),
      buttons: [{ label: T('ANNULER', 'CANCEL') }, { label: T('SUPPRIMER', 'DELETE'), kind: 'tdg', fn: () => { stopTask(t.id); const l = tasks(), i = l.indexOf(t); l.splice(i, 1); touch(); SEL = (l[Math.min(i, l.length - 1)] || {}).id || null; sfx.close(); setIcon(); paintSide(); buildEd(); } }] });
  }
  function frame(title, body, buttons, o = {}) {
    const scrim = h('div', { class: 'mlkx-scrim' }), ft = h('footer', {}, buttons.map(b => h('button', { class: 'mlkx-btn ' + (b.kind || 'pri'), onclick: () => { close(); b.fn && b.fn(); } }, b.label)));
    const sh = h('div', { class: 'mbk-sheet', role: 'dialog', 'aria-label': title, style: { '--w': (o.w || 640) + 'px' } }, h('h3', { class: 'mlkx-heading' }, title), h('div', { class: 'mbk-sb' }, body), ft);
    const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    function close() { scrim.remove(); root.removeEventListener('keydown', kd, true); o.onclose && o.onclose(); }
    scrim.append(sh); root.addEventListener('keydown', kd, true); root.append(scrim); ft.lastChild.focus({ preventScroll: true }); return close;
  }
  function showDry() {
    if (!PEND || w.dead || closeDry) return; const r = PEND; PEND = null;
    if (r.notice) { sheet(root, { title: r.notice, buttons: [{ label: 'OK', kind: 'pri' }] }); return; }
    const sum = T(`${r.c} à créer · ${r.u} à mettre à jour · ${r.d} à supprimer`, `${r.c} to create · ${r.u} to update · ${r.d} to delete`);
    const body = [h('div', { class: 'mbk-sum' }, sum)];
    if (!r.lines.length) body.push(h('div', { class: 'mlkx-muted' }, T('Rien à faire : la destination est déjà identique.', 'Nothing to do: the destination is already identical.')));
    else { const log = h('div', { class: 'mbk-log' }); r.lines.forEach(l => log.append(h('div', { class: l.startsWith('*deleting') ? 'del' : '' }, l))); body.push(log); }
    body.push(h('div', { class: 'mbk-hint' }, T('Aucun fichier n’a été modifié.', 'No file was modified.')));
    closeDry = frame(T(`Simulation : ${r.name}`, `Simulation: ${r.name}`), body, [{ label: T('FERMER', 'CLOSE') }], { w: 760, onclose: () => { closeDry = null; } });
  }
  function logSheet(t) { frame(T(`Journal : ${t.name}`, `Log: ${t.name}`), h('div', { class: 'mbk-log' }, logText(t)), [{ label: T('FERMER', 'CLOSE') }], { w: 760 }); }
  function openSettings() {
    if (root.querySelector('.mbk-sheet')) return;
    const pw = h('input', { class: 'mlkx-field', type: 'password', autocomplete: 'off', placeholder: PREFS.hasPw ? T('Mot de passe enregistré', 'Password saved') : '', 'aria-label': T('Mot de passe administrateur', 'Administrator password') });
    const msg = h('div', { class: 'mbk-hint' }, PREFS.hasPw ? T('Mot de passe enregistré dans le Trousseau.', 'Password saved in the Keychain.') : T('Aucun mot de passe enregistré.', 'No password saved.'));
    const save = h('button', { class: 'mlkx-btn pri', disabled: true, onclick: () => { PREFS.hasPw = true; pw.value = ''; pw.placeholder = T('Mot de passe enregistré', 'Password saved'); msg.textContent = T('Mot de passe enregistré dans le Trousseau.', 'Password saved in the Keychain.'); save.disabled = true; rm.disabled = false; sfx.done(); } }, T('Enregistrer', 'Save'));
    const rm = h('button', { class: 'mlkx-btn', disabled: !PREFS.hasPw, onclick: () => { PREFS.hasPw = false; pw.placeholder = ''; msg.textContent = T('Aucun mot de passe enregistré.', 'No password saved.'); rm.disabled = true; sfx.tick(); } }, T('Retirer', 'Remove'));
    pw.addEventListener('input', () => { save.disabled = !pw.value; });
    const upd = h('div', { class: 'mbk-hint' }, T('Version installée : 1.0.2', 'Installed version: 1.0.2'));
    const cardIn = (t, sb, ...k) => h('section', { class: 'mbk-card' }, h('header', {}, h('h3', { class: 'mlkx-title' }, t)), ...k);
    const body = [cardIn(T('Général', 'General'), null,
      chk(h('span', { html: bn(T('Ouvrir mBACKUP à la connexion', 'Open mBACKUP at login')) }), () => PREFS.login, v => { PREFS.login = v; }, T('Nécessaire pour que les tâches se lancent aux heures prévues.', 'Required for tasks to start at their scheduled times.')),
      chk(T('Notifier seulement les erreurs', 'Notify errors only'), () => PREFS.errorsOnly, v => { PREFS.errorsOnly = v; })),
      cardIn(T('Mot de passe administrateur', 'Administrator password'), null, h('div', { class: 'mbk-pw' }, pw, save, rm), msg,
        h('div', { class: 'mbk-hint' }, T('Rangé dans le Trousseau, utilisé uniquement pour les tâches avec droits administrateur.', 'Stored in the Keychain, used only by tasks with administrator rights.')),
        h('div', { class: 'mbk-hint' }, T('Si des dossiers protégés échouent (iCloud Drive, Bibliothèque), accordez l’accès complet au disque à mBACKUP dans Réglages Système, Confidentialité et sécurité.', 'If protected folders fail (iCloud Drive, Library), grant mBACKUP Full Disk Access in System Settings, Privacy and Security.'))),
      cardIn(T('Mises à jour', 'Updates'), null, chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), () => PREFS.auto, v => { PREFS.auto = v; }),
        h('button', { class: 'mlkx-btn', style: { width: '240px' }, onclick: e => { const b = e.currentTarget; b.disabled = true; upd.textContent = T('Recherche en cours…', 'Checking…'); setTimeout(() => { b.disabled = false; upd.innerHTML = bn(T('mBACKUP est à jour (version 1.0.2).', 'mBACKUP is up to date (version 1.0.2).')); sfx.tick(); }, 900); } }, T('Rechercher une mise à jour', 'Check for updates')), upd)];
    frame(T('Réglages', 'Settings'), body, [{ label: T('FERMER', 'CLOSE') }], { w: 640 });
  }

  paintSide(); buildEd(); if (WANT_SET) { WANT_SET = false; setTimeout(() => !w.dead && openSettings(), 30); }
  return root;
}
