/* ARCHiVES : extraction et compression d'archives intégrées au Finder. Démo : un dossier Téléchargements d'essai (double-clic, clic droit › Services) et les vrais Réglages ; rien n'est lu ni écrit. */
import { dlBtn, toast, icon, h, brand, esc, wait, reduced, clamp, sfx, wm, T, css } from './kit.js';
import { lang } from '../i18n.js';

const loc = () => (lang() === 'fr' ? 'fr-FR' : 'en-US');
const fmtN = (n, d = 1) => n.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
const sz = mb => {
  const fr = lang() === 'fr';
  if (mb >= 1024) return fmtN(mb / 1024) + ' ' + (fr ? 'Go' : 'GB');
  if (mb >= 10) return fmtN(Math.round(mb), 0) + ' ' + (fr ? 'Mo' : 'MB');
  if (mb >= 1) return fmtN(mb) + ' ' + (fr ? 'Mo' : 'MB');
  return fmtN(Math.max(1, Math.round(mb * 1024)), 0) + ' ' + (fr ? 'Ko' : 'KB');
};
const loadCss = u => new Promise(res => { css(u); const l = document.querySelector(`link[data-k="${u}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res); l.addEventListener('error', res); setTimeout(res, 4000); });
const bt = (s, c) => esc(s).split('ARCHiVES').join(brand('ARCHiVES', c)); /* nom de l'appli coloré dans un texte */
const mid = (s, n = 34) => (s.length <= n ? s : s.slice(0, Math.ceil((n - 1) * 0.6)) + '…' + s.slice(-Math.floor((n - 1) * 0.4)));

const I = {
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  text: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  fwd: '<path d="m9 18 6-6-6-6"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  desk: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  doc: '<path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
  apps: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'
};
const svg = (k, cls = '', box = 24) => { const t = document.createElement('template'); t.innerHTML = `<svg viewBox="0 0 ${box} ${box}" class="${cls}" aria-hidden="true">${I[k]}</svg>`; return t.content.firstChild; };

/* ---------- le moteur de noms de l'appli (NameSimplifier), porté tel quel ---------- */
const MULTI = ['tar.gz', 'tar.bz2', 'tar.xz', 'tar.zst', 'tar.lz', 'tar.z'];
const AEXT = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'tbz', 'tbz2', 'xz', 'txz', 'zst', 'lz', 'lzma', 'z', 'cab', 'iso', 'cpio', 'jar', 'war', 'xar', 'pkg', 'lha', 'lzh', 'arj', 'zipx', 'cbz', 'cbr', 'cb7', 'img', 'dmg']);
function baseName(fn) {
  const low = fn.toLowerCase();
  for (const e of MULTI) if (low.endsWith('.' + e)) return fn.slice(0, -(e.length + 1));
  let m = fn.match(/\.(?:\d{3}|[rz]\d{2})$/i);
  if (m) { let n = fn.slice(0, m.index); const ext = n.split('.').pop(); if (n.includes('.') && AEXT.has(ext.toLowerCase())) n = n.slice(0, -(ext.length + 1)); return n; }
  m = fn.match(/\.part0*\d+\.rar$/i); if (m) return fn.slice(0, m.index);
  const ext = fn.includes('.') ? fn.split('.').pop().toLowerCase() : '';
  return AEXT.has(ext) ? fn.slice(0, -(ext.length + 1)) : fn;
}
function simplify(base, max = 40) {
  let s = base;
  const stripped = s.replace(/\s*[[(][^\])]*[\])]/g, '');
  if (stripped.trim()) s = stripped;
  const m = s.match(/(?:[-_ ]\d+){3,}$/);
  if (m) { const groups = m[0].split(/[-_ ]+/).filter(Boolean), last = groups[groups.length - 1]; if (last && (last.length >= 9 || groups.length >= 5)) { const head = s.slice(0, m.index); if (head) s = head; } }
  s = s.replace(/_/g, ' ');
  const ch = [...s]; let out = '';
  ch.forEach((c, i) => { out += c === '.' && !(i > 0 && /\d/.test(ch[i - 1]) && i + 1 < ch.length && /\d/.test(ch[i + 1])) ? ' ' : c; });
  s = out.replace(/[/:]/g, '-').replace(/\s+/g, ' ').replace(/^[ \-_.]+|[ \-_.]+$/g, '');
  if (s.length > max) { const cut = s.slice(0, max), sp = cut.lastIndexOf(' '); s = sp > max / 2 ? cut.slice(0, sp) : cut; s = s.replace(/^[ \-_.]+|[ \-_.]+$/g, ''); }
  return s || base;
}
const folderName = (file, P) => (P.simplify ? simplify(baseName(file), P.maxLen) : baseName(file));
const unique = (name, taken, ext = '') => { let c = ext ? `${name}.${ext}` : name, n = 2; while (taken.has(c)) { c = ext ? `${name} ${n}.${ext}` : `${name} ${n}`; n++; } return c; };

/* ---------- données d'exemple ---------- */
const kindOf = n => { const e = n.includes('.') ? n.split('.').pop().toLowerCase() : ''; return /^(jpg|jpeg|png|dds|svg|gif)$/.test(e) ? 'img' : /^(txt|md|csv|esp|nif|json)$/.test(e) ? 'txt' : /^(pdf|xlsx|wav)$/.test(e) ? e : 'file'; };
const D = (name, ...children) => ({ name, kind: 'folder', children });
const Fl = (name, mb) => ({ name, kind: kindOf(name), mb });
const total = n => (n.children ? n.children.reduce((a, k) => a + total(k), 0) : n.mb || 0);
const walk = (n, p = '') => (n.children ? n.children.flatMap(k => walk(k, p + n.name + '/')) : [p + n.name]);
const clone = n => ({ ...n, children: n.children && n.children.map(clone) });
const ARCS = () => ({
  realms: { name: 'Ancient_Realms_HD_Textures-4412-1-3-1731240000.zip', kind: 'zip', mb: 148, date: '2026-11-08', root: 'Ancient Realms HD v1.3', entries: [D('textures', D('terrain', Fl('hd_ultra_4k.dds', 96), Fl('hd_ultra_2k.dds', 24)), D('architecture', Fl('whiterun_wall.dds', 18), Fl('riften_roof.dds', 14))), D('meshes', Fl('whiterun_gate.nif', 3.2), Fl('banner_stand.nif', 1.1)), Fl('Ancient Realms HD.esp', 2.1), Fl('readme.txt', 0.01)] },
  skyrim: { name: 'Skyrim_Textures_[4K]_(v2.1).7z', kind: '7z', mb: 312, date: '2026-11-05', root: null, entries: [D('Textures', D('actors', Fl('dragon_body.dds', 64), Fl('dragon_wings.dds', 48)), D('landscape', Fl('mountain_rock.dds', 72))), D('Meshes', Fl('dragon.nif', 12)), Fl('SkyUI_SE.esp', 0.4), Fl('Skyrim Textures 4K.txt', 0.02)] },
  vacances: { name: 'vacances_2026.tar.gz', kind: 'targz', mb: 86, date: '2026-11-01', root: 'vacances_2026', entries: [Fl('IMG_0001.jpg', 4.1), Fl('IMG_0002.jpg', 3.8), Fl('IMG_0003.jpg', 4.4), Fl('IMG_0004.jpg', 3.9), Fl('IMG_0005.jpg', 4.2), Fl('notes.txt', 0.01)] },
  backup: { name: 'Backup_Docs.rar', kind: 'rar', mb: 54, date: '2026-10-28', pw: 'archives', root: 'Backup_Docs', entries: [D('Contrats', Fl('Contrat_prestation.pdf', 3.2), Fl('Devis_studio.pdf', 0.8)), D('Factures', Fl('Facture_octobre.pdf', 0.4), Fl('Facture_septembre.pdf', 0.4)), Fl('budget_2025.xlsx', 0.4)] },
  d1: { name: 'Dataset_voix.part1.rar', kind: 'rar', mb: 40, date: '2026-10-24', vol: 'Dataset_voix', root: null, entries: [D('wav', Fl('voix_001.wav', 12), Fl('voix_002.wav', 11), Fl('voix_003.wav', 13)), Fl('index.csv', 0.2)] },
  d2: { name: 'Dataset_voix.part2.rar', kind: 'rar', mb: 38, date: '2026-10-24', vol: 'Dataset_voix', root: null, entries: [] },
  bad: { name: 'fichier_corrompu.zip', kind: 'zip', mb: 3, date: '2026-10-20', bad: true, entries: [] }
});
const mkRoot = () => {
  const A = ARCS(), files = [...Object.values(A),
    { name: 'Notes_projet.txt', kind: 'txt', mb: 0.004, date: '2026-11-09' }, { name: 'budget_2026.xlsx', kind: 'xlsx', mb: 0.2, date: '2026-11-07' }, { name: 'IMG_2041.jpg', kind: 'img', mb: 3.4, date: '2026-11-06' },
    { name: 'Rapport_Q3.pdf', kind: 'pdf', mb: 1.8, date: '2026-11-02' }, { name: 'Maquettes', kind: 'folder', date: '2026-10-30', children: [Fl('logo_v3.svg', 0.3), Fl('ecran_accueil.png', 1.2), Fl('ecran_reglages.png', 1.1)] }];
  files.forEach((f, i) => { f.id = 'f' + i; });
  return { name: 'Téléchargements', kind: 'folder', children: files };
};
const ARCH = new Set(['zip', '7z', 'targz', 'rar']);
const KIND = k => ({ zip: ['Archive ZIP', 'ZIP archive'], '7z': ['Archive 7-Zip', '7-Zip archive'], targz: ['Archive gzip', 'gzip archive'], rar: ['Archive RAR', 'RAR archive'], folder: ['Dossier', 'Folder'], txt: ['Texte', 'Plain text'], pdf: ['Document PDF', 'PDF document'], xlsx: ['Tableur', 'Spreadsheet'],
  img: ['Image', 'Image'], wav: ['Audio WAV', 'WAV audio'], file: ['Document', 'Document'] }[k] || ['Document', 'Document']);
const dateOf = n => (n.date === 'today' ? T('Aujourd’hui', 'Today') : n.date ? new Date(n.date + 'T12:00:00').toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const kindLabel = k => T(KIND(k)[0], KIND(k)[1]);

export async function open(app) {
  await loadCss('css/demos/ARCHiVES.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1040, h: 640, y: 96, minw: 860, minh: 520, bare: true, cls: 'socle ar',
    onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => { const mk = () => make(app, w); w.redraw = () => { w.stop && w.stop(); w.body.replaceChildren(mk()); }; return mk(); } });
}

function make(app, w) {
  const life = { dead: false }; let raf = 0;
  w.stop = () => { life.dead = true; cancelAnimationFrame(raf); };
  const alive = () => !life.dead && !w.dead;
  const P = { trashAfter: false, simplify: true, maxLen: 40, flatten: true, reveal: false, fmt: 'zip', level: 5, auto: true };
  const S = { tab: 'try', root: mkRoot(), path: [], sel: new Set(), last: null, hint: true, defMsg: '', upd: '', menu: null };
  S.path = [S.root];
  const cwd = () => S.path[S.path.length - 1];
  const root = h('div', { class: 'ar-root' }), body = h('div', { class: 'ar-body' });
  const seg = h('div', { class: 'ar-seg', role: 'tablist' });
  root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('ARCHiVES', app.accent) }), seg, dlBtn(app)), body);
  const drawSeg = () => seg.replaceChildren(...[['try', T('Essai dans le Finder', 'Try it in the Finder')], ['set', T('Réglages', 'Settings')]].map(([k, l]) => h('button', { class: S.tab === k ? 'on' : '', role: 'tab', 'aria-selected': S.tab === k, onclick: () => { if (S.tab !== k) { S.tab = k; closeMenu(); sfx.click(); render(); } } }, l)));
  const cnt = n => (S.sel.size ? T(`${S.sel.size} sélectionné${S.sel.size > 1 ? 's' : ''}`, `${S.sel.size} selected`) : T(`${n} élément${n > 1 ? 's' : ''}`, `${n} item${n === 1 ? '' : 's'}`));
  const pos = e => { const r = root.getBoundingClientRect(), k = r.width / root.offsetWidth; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };

  /* ----- menu contextuel ----- */
  const closeMenu = () => { if (S.menu) { S.menu.remove(); S.menu = null; } };
  const selNodes = () => cwd().children.filter(n => S.sel.has(n.id));
  function openMenu(e) {
    closeMenu(); const sel = selNodes(); if (!sel.length) return;
    const hasArc = sel.some(n => ARCH.has(n.kind)), [x, y] = pos(e);
    const sub = h('div', { class: 'ar-menu sub', hidden: true },
      h('button', { disabled: !hasArc, onclick: () => { closeMenu(); extractSel(); } }, T('Extraire ARCHiVE', 'Extract ARCHiVE')),
      h('button', { onclick: () => { closeMenu(); createSel(false); } }, T('Créer une ARCHiVE', 'Create an ARCHiVE')),
      h('button', { onclick: () => { closeMenu(); createSel(true); } }, T('Créer une ARCHiVE protégée', 'Create a protected ARCHiVE')));
    const srv = h('button', { onclick: () => { sub.hidden = !sub.hidden; }, onpointerenter: () => { sub.hidden = false; } }, h('span', {}, T('Services', 'Services')), svg('chev', 'ar-ic'));
    const m = h('div', { class: 'ar-menu', role: 'menu' },
      h('button', { disabled: sel.length > 1, onclick: () => { closeMenu(); openNode(sel[0]); } }, T('Ouvrir', 'Open')), h('hr'),
      h('button', { onclick: () => { closeMenu(); trashSel(); } }, T('Placer dans la corbeille', 'Move to Trash')), h('hr'), h('div', { style: { position: 'relative' } }, srv, sub));
    root.append(m); S.menu = m;
    const W = root.offsetWidth, H = root.offsetHeight; m.style.left = clamp(x, 4, W - 232 - 4) + 'px'; m.style.top = clamp(y, 4, H - 140) + 'px';
    if (x > W - 232 - 220) { sub.style.left = 'auto'; sub.style.right = 'calc(100% - 2px)'; }
    sfx.click();
  }
  root.addEventListener('pointerdown', e => { if (S.menu && !S.menu.contains(e.target)) closeMenu(); });

  /* ----- travaux : file d'attente, un seul à la fois, panneau discret s'il est long ----- */
  const Q = []; let running = false, count = 0, doneN = 0, cancelled = false, failures = [], revealed = [], panel = null, ptimer = 0, pv = null, dlgOpen = false;
  const firstVol = a => (a.vol ? S.root.children.find(n => n.vol === a.vol && /part0*1\./i.test(n.name)) || a : a);
  const allVols = a => (a.vol ? S.root.children.filter(n => n.vol === a.vol) : [a]);
  function addJobs(jobs) {
    const seen = new Set(), uniq = [];
    jobs.forEach(j => { if (j.type === 'x') { const f = firstVol(j.a); if (!seen.has(f.id)) { seen.add(f.id); uniq.push({ type: 'x', a: f }); } } else uniq.push(j); });
    Q.push(...uniq); count += uniq.length; if (!running) next();
  }
  async function next() {
    if (!alive()) return;
    if (!Q.length) return finish();
    running = true; const job = Q.shift(); doneN++; cancelled = false;
    const isX = job.type === 'x';
    const outName = isX ? '' : outputName(job.src, job.fmt);
    const name = isX ? job.a.name : outName;
    pv = { title: isX ? T(`Extraction de ${name}`, `Extracting ${name}`) : T(`Compression de ${name}`, `Compressing ${name}`), step: count > 1 ? T(`${doneN} sur ${count}`, `${doneN} of ${count}`) : '', pct: 0, cur: '' };
    clearTimeout(ptimer); ptimer = setTimeout(() => { if (running && !panel && !dlgOpen) showPanel(); }, 800);
    try { if (isX) await runExtract(job.a); else await runCreate(job, outName); }
    catch (e) { if (e !== 'cancel') failures.push(e); }
    running = false; if (alive()) next();
  }
  function finish() {
    clearTimeout(ptimer); hidePanel(); count = 0; doneN = 0;
    if (revealed.length) { S.path = [S.root]; S.sel = new Set(revealed.map(n => n.id)); revealed = []; render(); const r = body.querySelector('.ar-row.sel'), l = body.querySelector('.ar-list'); if (r && l) l.scrollTop = Math.max(0, r.offsetTop - l.clientHeight / 2); }
    if (failures.length) { const f = failures; failures = []; errorDialog(f[0].title, f.map(x => (x.title === f[0].title ? x.detail : x.title + '\n' + x.detail)).join('\n\n')); }
  }
  const showPanel = () => {
    const t = h('b', {}, mid(pv.title, 38)), st = h('span', {}, pv.step), bar = h('i'), pc = h('span', { class: 'pc' }, '0 %'), cur = h('span', { class: 'cur' }, '');
    panel = h('div', { class: 'ar-prog', role: 'status' }, h('div', { class: 't' }, t, st), h('div', { class: 'ar-bar' }, bar), h('div', { class: 'f' }, pc, cur, h('button', { class: 'sbtn sm caps', onclick: () => { cancelled = true; } }, T('Annuler', 'Cancel'))));
    panel._r = { t, st, bar, pc, cur }; root.append(panel); upPanel();
  };
  const upPanel = () => { if (!panel) return; const r = panel._r; r.t.textContent = mid(pv.title, 38); r.st.textContent = pv.step; r.bar.style.width = pv.pct + '%'; r.pc.textContent = Math.round(pv.pct) + ' %'; r.cur.textContent = pv.cur; };
  const hidePanel = () => { if (panel) { panel.remove(); panel = null; } };
  /** Avance de 0 à 100 % pendant `ms` ; renvoie false si annulé. */
  function progress(ms, files) {
    return new Promise(res => {
      if (reduced()) { pv.pct = 100; upPanel(); return res(true); }
      const t0 = performance.now(); let lastI = -1;
      const tick = t => {
        if (!alive()) return res(false);
        if (cancelled) return res(false);
        const k = clamp((t - t0) / ms, 0, 1); pv.pct = k * 100;
        if (files && files.length) { const i = Math.min(files.length - 1, Math.floor(k * files.length)); pv.cur = files[i]; if (i !== lastI) { lastI = i; sfx.tick(); } }
        upPanel(); if (k < 1) raf = requestAnimationFrame(tick); else res(true);
      };
      raf = requestAnimationFrame(tick);
    });
  }
  const dur = mb => clamp(700 + mb * 14, 700, 3200);
  async function runExtract(a) {
    if (a.bad) { await progress(900, null); if (cancelled) throw 'cancel'; throw { title: T(`Impossible d’extraire « ${a.name} »`, `Can't extract “${a.name}”`), detail: T('Archive endommagée : fin de fichier inattendue.\nVérifiez que l’archive n’est pas corrompue et que le dossier est modifiable.', 'Damaged archive: unexpected end of file.\nCheck that the archive is not corrupted and that the folder is writable.') }; }
    let retry = false;
    if (a.pw) { for (;;) { dlgOpen = true; hidePanel(); const ans = await askPassword(a.name, retry); dlgOpen = false; if (ans === null) throw 'cancel'; if (ans === a.pw) break; retry = true; } clearTimeout(ptimer); ptimer = setTimeout(() => { if (running && !panel && !dlgOpen) showPanel(); }, 300); }
    const vols = allVols(a), all = vols.flatMap(v => v.entries || []), files = all.flatMap(n => walk(n)), mbs = vols.reduce((s, v) => s + v.mb, 0);
    if (!(await progress(dur(mbs), files)) || cancelled) throw 'cancel';
    const taken = new Set(S.root.children.map(n => n.name)), name = unique(folderName(a.name, P), taken);
    let children = all.map(clone);
    if (a.root) { const inner = clone(D(a.root, ...a.entries)); children = P.flatten ? inner.children : [inner]; }
    const node = { id: 'n' + Math.random().toString(36).slice(2, 8), name, kind: 'folder', date: 'today', children, fresh: true };
    S.root.children.push(node); sortRoot();
    if (P.trashAfter) { const ids = new Set(vols.map(v => v.id)); S.root.children = S.root.children.filter(n => !ids.has(n.id)); ids.forEach(id => S.sel.delete(id)); }
    if (P.reveal) revealed.push(node);
    sfx.pop(); if (S.path.length === 1) render();
  }
  const sortRoot = () => S.root.children.sort((a, b) => a.name.localeCompare(b.name, loc(), { numeric: true }));
  const outputName = (src, fmt) => {
    const taken = new Set(S.root.children.map(n => n.name));
    const base = src.length === 1 ? (src[0].kind === 'folder' ? src[0].name : src[0].name.replace(/\.[^.]+$/, '')) : T('Archive', 'Archive');
    return unique(base, taken, fmt);
  };
  const ratio = n => { if (P.level === 0) return 1; const best = n.kind === 'txt' ? .25 : n.kind === 'xlsx' ? .8 : n.kind === 'pdf' ? .9 : n.kind === 'img' ? .98 : n.kind === 'wav' ? .6 : .7; return 1 - (1 - best) * ({ 1: .7, 5: .9, 9: 1 }[P.level] || .9); };
  async function runCreate(job, outName) {
    const mbs = job.src.reduce((s, n) => s + (n.children ? total(n) : n.mb), 0), files = job.src.flatMap(n => walk(n));
    if (!(await progress(dur(mbs), files)) || cancelled) throw 'cancel';
    const out = mbs ? job.src.reduce((s, n) => s + (n.children ? total(n) : n.mb) * ratio(n), 0) * (job.fmt === '7z' ? .9 : 1) : 0.001;
    const node = { id: 'n' + Math.random().toString(36).slice(2, 8), name: outName, kind: job.fmt === '7z' ? '7z' : 'zip', mb: Math.max(out, 0.004), date: 'today', pw: job.pw || undefined, entries: [], fresh: true };
    S.root.children.push(node); sortRoot(); if (P.reveal) revealed.push(node); sfx.pop(); if (S.path.length === 1) render();
  }
  function extractSel() { const arcs = selNodes().filter(n => ARCH.has(n.kind)); if (!arcs.length) return; S.hint = false; addJobs(arcs.map(a => ({ type: 'x', a }))); }
  async function createSel(protectedArc) {
    const src = selNodes(); if (!src.length) return; S.hint = false;
    let fmt = P.fmt, pw = null;
    if (protectedArc) { const r = await askCreate(); if (!r) return; fmt = r.fmt; pw = r.pw; }
    addJobs([{ type: 'c', src, fmt, pw }]);
  }
  function trashSel() { const ids = new Set(S.sel); cwd().children = cwd().children.filter(n => !ids.has(n.id)); S.sel.clear(); sfx.close(); render(); }
  function openNode(n) {
    if (ARCH.has(n.kind)) { S.sel = new Set([n.id]); extractSel(); }
    else if (n.kind === 'folder') { S.path.push(n); S.sel.clear(); sfx.tick(); render(); }
    else toast({ icon: icon(app.id), title: n.name, body: T('S’ouvrirait dans son appli habituelle.', 'Would open in its usual app.') });
  }

  /* ----- dialogues (mêmes textes que l'appli) ----- */
  function modal(build) {
    return new Promise(res => {
      const close = v => { sc.remove(); res(v); };
      const { el, focus } = build(close);
      const sc = h('div', { class: 'ar-scrim', onpointerdown: e => { if (e.target === sc) close(null); } }, el); root.append(sc); sfx.open();
      (focus || el).focus({ preventScroll: true });
    });
  }
  const appIco = () => h('img', { src: icon(app.id), alt: '' });
  function askPassword(name, retry) {
    return modal(close => {
      const f = h('input', { class: 'ar-in', type: 'password', placeholder: T('Mot de passe', 'Password'), autocomplete: 'off', 'aria-label': T('Mot de passe', 'Password') });
      const ok = () => close(f.value || null);
      f.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(null); });
      return { focus: f, el: h('div', { class: 'ar-dlg', role: 'dialog', tabindex: '-1' }, h('div', { class: 'hd' }, appIco(), h('div', {}, h('h3', {}, T('Mot de passe requis', 'Password required')),
        h('p', { class: retry ? 'er' : '' }, retry ? T(`Mot de passe incorrect pour « ${name} ». Réessayez.`, `Wrong password for “${name}”. Try again.`) : T(`« ${name} » est protégée par un mot de passe.`, `“${name}” is password-protected.`)))),
      f, h('div', { class: 'hint' }, T('Démo : le mot de passe est « archives ».', 'Demo: the password is “archives”.')),
      h('div', { class: 'acts' }, h('button', { class: 'sbtn', onclick: () => close(null) }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn act', onclick: ok }, T('Valider', 'OK')))) };
    });
  }
  function askCreate() {
    return modal(close => {
      let fmt = P.fmt, msg = T('Choisissez le format et le mot de passe. Le contenu sera chiffré (AES-256).', 'Choose the format and the password. The content will be encrypted (AES-256).'), bad = false;
      const p1 = h('input', { class: 'ar-in', type: 'password', placeholder: T('Mot de passe', 'Password'), autocomplete: 'off' }), p2 = h('input', { class: 'ar-in', type: 'password', placeholder: T('Confirmer le mot de passe', 'Confirm password'), autocomplete: 'off' });
      const info = h('p', {}, msg), seg2 = h('div', { class: 'ar-seg', style: { margin: 0 } });
      const draw = () => { seg2.replaceChildren(...['zip', '7z'].map(f => h('button', { class: fmt === f ? 'on' : '', onclick: () => { fmt = f; draw(); } }, f.toUpperCase()))); info.textContent = msg; info.className = bad ? 'er' : ''; p1.classList.toggle('bad', bad); p2.classList.toggle('bad', bad); };
      const ok = () => { if (!p1.value) { msg = T('Le mot de passe est vide.', 'The password is empty.'); bad = true; return draw(); } if (p1.value !== p2.value) { msg = T('Les deux mots de passe sont différents.', 'The two passwords differ.'); bad = true; return draw(); } close({ fmt, pw: p1.value }); };
      [p1, p2].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(null); }));
      draw();
      return { focus: p1, el: h('div', { class: 'ar-dlg', role: 'dialog', tabindex: '-1' }, h('div', { class: 'hd' }, appIco(), h('div', {}, h('h3', {}, T('Créer une ARCHiVE protégée', 'Create a protected ARCHiVE')), info)),
        h('div', { class: 'col' }, h('label', {}, T('Format', 'Format')), seg2, p1, p2), h('div', { class: 'hint' }, T('Démo : choisissez n’importe quel mot de passe.', 'Demo: pick any password.')),
        h('div', { class: 'acts' }, h('button', { class: 'sbtn', onclick: () => close(null) }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn act', onclick: ok }, T('Valider', 'OK')))) };
    });
  }
  function errorDialog(title, detail) {
    return modal(close => ({ el: h('div', { class: 'ar-dlg', role: 'alertdialog', tabindex: '-1', onkeydown: e => { if (e.key === 'Escape') close(null); } }, h('div', { class: 'hd' }, appIco(), h('div', {}, h('h3', {}, title), ...detail.split('\n').map(l => h('p', {}, l)))),
      h('div', { class: 'acts' }, h('button', { class: 'sbtn act', onclick: () => close(null) }, T('Fermer', 'Close')))) }));
  }

  /* ----- Essai dans le Finder ----- */
  function viewTry() {
    const dir = cwd(), items = dir.children;
    const trail = S.path.map((n, i) => ({ n, i }));
    const tb = h('div', { class: 'ar-tb' }, h('button', { class: 'nav', disabled: S.path.length < 2, 'aria-label': T('Précédent', 'Back'), onclick: () => { S.path.pop(); S.sel.clear(); sfx.tick(); render(); } }, svg('back')),
      h('div', { class: 'ar-path' }, ...trail.flatMap(({ n, i }) => [i ? svg('chev') : null, h('button', { onclick: () => { S.path = S.path.slice(0, i + 1); S.sel.clear(); sfx.tick(); render(); } }, i === 0 ? T('Téléchargements', 'Downloads') : n.name)])),
      h('span', { class: 'ar-count' }, cnt(items.length)),
      h('button', { class: 'sbtn sm', title: T('Remettre le dossier d’essai à zéro', 'Reset the demo folder'), onclick: () => { S.root = mkRoot(); S.path = [S.root]; S.sel.clear(); S.hint = true; sfx.click(); render(); } }, T('Réinitialiser', 'Reset')));
    const icoFor = n => (n.kind === 'folder' ? svg('folder') : ARCH.has(n.kind) ? svg(n.pw ? 'lock' : 'archive', 'arc') : n.kind === 'img' ? svg('image') : n.kind === 'txt' || n.kind === 'pdf' ? svg('text') : svg('file'));
    const rows = items.map(n => {
      const row = h('div', { class: 'ar-row' + (S.sel.has(n.id) ? ' sel' : '') + (n.fresh ? ' fresh' : ''), 'data-id': n.id, role: 'row', 'aria-selected': S.sel.has(n.id),
        onpointerdown: e => { if (e.button === 2 && S.sel.has(n.id)) return; select(n, e); }, ondblclick: () => openNode(n), oncontextmenu: e => { e.preventDefault(); if (!S.sel.has(n.id)) { S.sel = new Set([n.id]); S.last = n.id; refreshSel(); } openMenu(e); } },
      h('div', { class: 'nm' }, icoFor(n), h('b', { title: n.name }, n.name)), h('span', { class: 'sz' }, n.kind === 'folder' && !n.children ? '--' : sz(n.children ? total(n) : n.mb)), h('span', { class: 'mu' }, kindLabel(n.kind) + (n.pw ? ' · ' + T('protégée', 'protected') : '')), h('span', { class: 'mu' }, dateOf(n)));
      if (n.fresh && !n._t) n._t = setTimeout(() => { n.fresh = false; }, 1900);
      return row;
    });
    const list = h('div', { class: 'ar-list', tabindex: '0', 'aria-label': T('Fichiers', 'Files'), role: 'grid', onkeydown: onKey }, ...(rows.length ? rows : [h('div', { class: 'ar-empty' }, T('Dossier vide', 'Empty folder'))]));
    const fin = h('div', { class: 'ar-fin' }, h('div', { class: 'ar-fside' }, h('h4', {}, T('Favoris', 'Favorites')),
      h('button', { class: 'on', onclick: () => { S.path = [S.root]; S.sel.clear(); render(); } }, svg('down'), T('Téléchargements', 'Downloads')), h('button', { disabled: true }, svg('desk'), T('Bureau', 'Desktop')), h('button', { disabled: true }, svg('doc'), 'Documents'), h('button', { disabled: true }, svg('apps'), T('Applications', 'Applications'))),
    h('div', { class: 'ar-fmain' }, tb, h('div', { class: 'ar-cols' }, h('span', {}, T('Nom', 'Name')), h('span', {}, T('Taille', 'Size')), h('span', {}, T('Type', 'Kind')), h('span', {}, T('Date', 'Date'))), list));
    const bub = S.hint ? h('div', { class: 'ar-bub' }, h('i', {}, 'i'), h('span', {}, T('Double-cliquez une archive pour l’extraire. Clic droit › Services pour extraire ou créer une ARCHiVE, protégée ou non.', 'Double-click an archive to extract it. Right-click › Services to extract or create an ARCHiVE, protected or not.')),
      h('button', { 'aria-label': T('Fermer', 'Close'), onclick: () => { S.hint = false; render(); } }, '×')) : null;
    return [fin, bub];
  }
  function select(n, e) {
    const items = cwd().children;
    if (e.shiftKey && S.last) { const a = items.findIndex(x => x.id === S.last), b = items.findIndex(x => x.id === n.id); S.sel = new Set(items.slice(Math.min(a, b), Math.max(a, b) + 1).map(x => x.id)); }
    else if (e.metaKey || e.ctrlKey) { S.sel.has(n.id) ? S.sel.delete(n.id) : S.sel.add(n.id); S.last = n.id; }
    else { S.sel = new Set([n.id]); S.last = n.id; }
    refreshSel();
  }
  function refreshSel() {
    body.querySelectorAll('.ar-row').forEach(r => { const on = S.sel.has(r.dataset.id); r.classList.toggle('sel', on); r.setAttribute('aria-selected', on); });
    const c = body.querySelector('.ar-count'); if (c) c.textContent = cnt(cwd().children.length);
  }
  function onKey(e) {
    const items = cwd().children, i = items.findIndex(x => x.id === S.last);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const j = clamp((i < 0 ? -1 : i) + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); if (items[j]) { S.sel = new Set([items[j].id]); S.last = items[j].id; refreshSel(); const r = body.querySelector(`.ar-row[data-id="${items[j].id}"]`), l = e.currentTarget; if (r) { if (r.offsetTop < l.scrollTop) l.scrollTop = r.offsetTop; else if (r.offsetTop + r.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = r.offsetTop + r.offsetHeight - l.clientHeight; } } }
    else if (e.key === 'Enter' && items[i]) { e.preventDefault(); openNode(items[i]); }
    else if ((e.key === 'Backspace' || e.key === 'Delete') && S.sel.size) { e.preventDefault(); trashSel(); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); S.sel = new Set(items.map(x => x.id)); refreshSel(); }
  }

  /* ----- Réglages (les vrais) ----- */
  function viewSet() {
    const chk = (label, key, hint) => h('div', { class: 'ar-chk' }, h('button', { role: 'checkbox', 'aria-checked': P[key], onclick: () => { P[key] = !P[key]; sfx.tick(); render(); } }, h('i', { class: 'ar-cb' + (P[key] ? ' on' : '') }), label), hint ? h('div', { class: 'mu' }, hint) : null);
    const seg3 = (opts, cur, set) => h('div', { class: 'ar-seg wide', style: { margin: 0 } }, ...opts.map(([v, l]) => h('button', { class: cur === v ? 'on' : '', onclick: () => { set(v); sfx.tick(); render(); } }, l)));
    const ex = ARCS().realms.name, exOut = h('b', {}), exIn = h('span', {}), lenLab = h('b', {}, String(P.maxLen));
    const upEx = () => { exIn.textContent = ex; exOut.textContent = folderName(ex, P); };
    const slider = h('input', { type: 'range', min: 15, max: 80, step: 5, value: P.maxLen, 'aria-label': T('Longueur maximale du nom', 'Maximum name length'), oninput: e => { P.maxLen = +e.target.value; lenLab.textContent = P.maxLen; upEx(); } });
    upEx();
    const left = h('div', { class: 'ar-col' },
      h('section', { class: 'ar-card' }, h('h3', {}, T('Extraction', 'Extraction')),
        chk(T('Mettre l’archive à la corbeille après l’extraction', 'Move the archive to the Trash after extraction'), 'trashAfter'),
        chk(T('Simplifier le nom du dossier', 'Simplify the folder name'), 'simplify', T('Retire les étiquettes [..], les identifiants numériques de fin et les _ . superflus.', 'Removes [..] tags, trailing numeric IDs and extra _ . characters.')),
        P.simplify ? h('div', { class: 'ar-slider' }, h('span', {}, T('Longueur maximale du nom : ', 'Maximum name length: '), lenLab, T(' caractères', ' characters')), slider) : null,
        h('div', { class: 'ar-ex' }, exIn, ' →', exOut),
        chk(T('Ne pas doubler le dossier si l’archive n’en contient qu’un', 'Don’t nest a folder when the archive holds just one'), 'flatten'),
        chk(T('Afficher le dossier dans le Finder après l’extraction', 'Reveal the folder in the Finder after extraction'), 'reveal')),
      h('section', { class: 'ar-card' }, h('h3', {}, T('Intégration au Finder', 'Finder integration')),
        h('p', { html: bt(T('Double-clic : définissez ARCHiVES comme application par défaut pour les archives.', 'Double-click: set ARCHiVES as the default app for archives.'), app.accent) }),
        h('div', { class: 'ar-line' }, h('button', { class: 'sbtn act', onclick: () => { S.defMsg = T('ARCHiVES est maintenant l’application par défaut de 16 formats.', 'ARCHiVES is now the default app for 16 formats.'); sfx.done(); render(); } }, T('Définir par défaut', 'Set as default')), S.defMsg ? h('span', { class: 'ar-ok', html: bt(S.defMsg, app.accent) }) : null),
        h('p', { class: 'mu' }, T('Clic droit sur un ou plusieurs fichiers, menu Services : « Extraire ARCHiVE », « Créer une ARCHiVE ». S’ils manquent, activez-les dans Réglages Système › Clavier › Raccourcis clavier › Services.', 'Right-click one or more files, Services menu: “Extract ARCHiVE”, “Create an ARCHiVE”. If they are missing, turn them on in System Settings › Keyboard › Keyboard Shortcuts › Services.'))));
    const right = h('div', { class: 'ar-col' },
      h('section', { class: 'ar-card' }, h('h3', {}, T('Compression', 'Compression')), h('label', { class: 'mu' }, T('Format par défaut', 'Default format')), seg3([['zip', 'ZIP'], ['7z', '7Z']], P.fmt, v => { P.fmt = v; }),
        h('label', { class: 'mu' }, T('Niveau de compression', 'Compression level')), seg3([[0, T('Aucune', 'None')], [1, T('Rapide', 'Fast')], [5, T('Normale', 'Normal')], [9, T('Maximale', 'Maximum')]], P.level, v => { P.level = v; }),
        h('p', { class: 'mu' }, T('Plus la compression est forte, plus l’archive est petite et lente à créer.', 'The stronger the compression, the smaller and slower to create the archive.'))),
      h('section', { class: 'ar-card' }, h('h3', {}, T('Mises à jour', 'Updates')), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), 'auto'),
        h('div', { class: 'ar-line' }, h('button', { class: 'sbtn caps', onclick: async () => { S.upd = T('Recherche en cours…', 'Checking…'); sfx.click(); render(); await wait(reduced() ? 0 : 1100); if (!alive()) return; S.upd = T('ARCHiVES est à jour (version 1.0.0).', 'ARCHiVES is up to date (version 1.0.0).'); sfx.done(); if (S.tab === 'set') render(); } }, T('Rechercher maintenant', 'Check now')), S.upd ? h('span', { class: 'mu', html: bt(S.upd, app.accent) }) : null)));
    return [h('div', { class: 'ar-set' }, left, right)];
  }

  function render() {
    drawSeg();
    const sc = body.querySelector('.ar-set') ? body.querySelector('.ar-set').scrollTop : 0, ls = body.querySelector('.ar-list') ? body.querySelector('.ar-list').scrollTop : 0;
    body.replaceChildren(...(S.tab === 'try' ? viewTry() : viewSet()).filter(Boolean));
    const s2 = body.querySelector('.ar-set'); if (s2) s2.scrollTop = sc; const l2 = body.querySelector('.ar-list'); if (l2) l2.scrollTop = ls;
  }
  render();
  return root;
}
