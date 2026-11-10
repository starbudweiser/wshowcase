/* fOLDERFUSE : réplique fidèle de la fusion de dossiers « à la Windows ». SOURCE et DESTINATION, résumé avant fusion, progression avec points animés,
   problèmes de copie, arrêt, espace insuffisant. Dossiers d'exemple fictifs : aucun fichier n'est lu ni copié. */
import { h, brand, wait, reduced, clamp, sfx, toast, icon, T, num, css, wm, dlBtn } from './kit.js';
css('css/demos/fOLDERFUSE.css');

const COLOR = '#f39c4a';
const KB = 1024, MB = KB * KB, GB = MB * KB;
const FRAMES = ['● ○ ○', '○ ● ○', '○ ○ ●', '○ ● ○'];
const pad = (n, w = 4) => String(n).padStart(w, '0');
const rng = seed => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
const fmtSize = b => {
  if (b < KB) return `${b} ${T(b === 1 ? 'octet' : 'octets', b === 1 ? 'byte' : 'bytes')}`;
  const u = [T('Ko', 'KB'), T('Mo', 'MB'), T('Go', 'GB'), T('To', 'TB')]; let v = b / KB, i = 0;
  while (v >= 1024 && i < 3) { v /= 1024; i++; }
  return v.toFixed(1).replace('.', T(',', '.')) + ' ' + u[i];
};
const count = n => `${num(n)} ${T(n === 1 ? 'fichier' : 'fichiers', n === 1 ? 'file' : 'files')}`;
const sizeAndCount = (b, n) => `${fmtSize(b)} · ${count(n)}`;
const shortPath = (p, max = 30) => (p.length > max ? p.slice(0, Math.floor((max - 3) / 2)) + '...' + p.slice(-Math.floor((max - 3) / 2)) : p);

/* ---------------------------- dossiers d'exemple ---------------------------- */
const F = (p, kb) => ({ p, s: Math.round(kb * KB) });
function genAR(n, ratio = 1) {
  const r = rng(9), dirs = ['terrain', 'rocks', 'architecture', 'trees', 'clutter'], out = [];
  for (let i = 0; i < n; i++) out.push({ p: `Textures/ancient/${dirs[i % 5]}/ar_${pad(i)}.dds`, s: Math.round((80 + r() * 540) * KB * ratio) });
  return out;
}
function genTex() {
  const r = rng(77), out = [];
  for (let i = 0; i < 3480; i++) out.push({ p: `Textures/hd4k/set${i % 12}/tex_${pad(i)}.dds`, s: Math.round((0.4 + r() * 6.4) * MB) });
  return out;
}
function genPatch() {
  const r = rng(5), out = [];
  for (let i = 0; i < 40; i++) out.push({ p: `Data/Meshes/patch/part_${pad(i, 3)}.nif`, s: Math.round((120 + r() * 1700) * KB) });
  out.splice(17, 0, { p: 'Data/Scripts/Source/quest_locked.psc', s: 64 * KB, lock: true });
  return out;
}
const FOLDERS = [
  { id: 'src', path: '/Users/Shared/Merge/Source', vol: 'mac', free: 232.1 * GB, files: () => [F('Textures/hd_rock.dds', 512.4), F('Meshes/rock01.nif', 118.7), F('Meshes/rock02.nif', 126.3), F('Scripts/patch.pex', 110.4), F('Readme.txt', 12.4)] },
  { id: 'dst', path: '/Users/Shared/Merge/Destination', vol: 'mac', free: 232.1 * GB, files: () => [F('Meshes/rock01.nif', 96.0), F('Meshes/rock02.nif', 101.2), F('Meshes/cliff01.nif', 88.4), F('Textures/cliff.dds', 2457.6), F('Plugins/base.esp', 14.2)] },
  { id: 'ar', path: '/Users/Shared/Downloads/Ancient Realms HD (update)', vol: 'mac', free: 232.1 * GB, files: () => genAR(1206) },
  { id: 'data', path: '/Users/Shared/Games/Skyrim/Data', vol: 'mac', free: 148.7 * GB, files: () => [...genAR(800, .82), F('Skyrim.esm', 244000), F('Update.esm', 12400), F('Meshes/base/readme.txt', 2)] },
  { id: 'patch', path: '/Users/Shared/Downloads/Patch Pack (1 locked)', vol: 'mac', free: 232.1 * GB, files: genPatch },
  { id: 'tex', path: '/Users/Shared/Downloads/Textures HD 4K', vol: 'mac', free: 232.1 * GB, files: genTex },
  { id: 'usb', path: '/Volumes/USB-STICK/Skyrim', vol: 'usb', free: 4.1 * GB, files: () => [F('Skyrim.esm', 244000), F('Update.esm', 12400)] },
  { id: 'bak', path: '/Users/Shared/Merge/Source/Backup', vol: 'mac', free: 232.1 * GB, files: () => [F('old/rock01.nif', 90)] }
];
const FREE0 = new Map(FOLDERS.map(f => [f.id, f.free]));
FOLDERS.forEach(f => { let c; f.all = () => (c ||= f.files()); f.total = () => f.all().reduce((a, x) => a + x.s, 0); });
const inside = (p, folder) => p === folder || p.startsWith(folder + '/');
const folderName = f => f.path.split('/').pop();

function inventory(src, dst) {
  const dm = new Map(dst.all().map(f => [f.p.toLowerCase(), f.s])); let over = 0, overB = 0;
  src.all().forEach(f => { const d = dm.get(f.p.toLowerCase()); if (d != null) { over++; overB += d; } });
  return { total: src.total(), count: src.all().length, over, overB, free: dst.free, same: src.vol === dst.vol, locked: src.all().filter(f => f.lock) };
}

/* ---------------------------- fenêtre ---------------------------- */
export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 640, h: 376, bare: true, resizable: false, cls: 'socle', onclose: w => { w.dead = true; w.timers && w.timers.forEach(clearInterval); }, build: w => build(app, w) });
}

function build(app, w) {
  FOLDERS.forEach(f => { f.free = FREE0.get(f.id); });
  let src = null, dst = null, running = false, busyKind = '', progress = 0, status = 'none', text = T('En attente de sélection...', 'Waiting for selection...');
  let activityKey = null, frame = 0, stopping = false, closeModal = null, sizeTok = 0;
  const alive = () => !w.dead && root.isConnected;
  const pause = ms => (reduced() ? Promise.resolve() : wait(ms));
  const nextFrame = () => new Promise(r => requestAnimationFrame(r));
  w.timers = [];

  /* --- squelette --- */
  const mkPick = (kind, title) => {
    const pa = h('div', { class: 'pa', hidden: true }), no = h('div', { class: 'no' }, T('Choisir un dossier', 'Choose a folder')), de = h('div', { class: 'de' }, ' ');
    const btn = h('button', { class: 'fuse-fp', 'aria-label': title, onclick: () => pickFolder(kind) }, h('b', {}, title), no, pa, de);
    return { btn, pa, no, de };
  };
  const pS = mkPick('src', T('SOURCE', 'SOURCE')), pD = mkPick('dst', T('DESTINATION', 'DESTINATION'));
  const goBtn = h('button', { class: 'sbtn fuse-go act', onclick: () => (running ? stopFusion() : startFusion()) }, T('FUSIONNER', 'MERGE'));
  const barFill = h('i'), barTxt = h('span'), bar2 = h('div', { class: 'fuse-bar2', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, barFill, barTxt);
  const ban = h('div', { class: 'fuse-ban' }, h('h1', { html: brand('fOLDERFUSE', 'var(--x-brand-f)') }), h('p', {}, T('Les fichiers de même nom sont remplacés dans la destination.', 'Files with the same name are replaced in the destination.')));
  const main = h('div', { class: 'fuse-main' }, ban, h('div', { class: 'fuse-pick' }, pS.btn, pD.btn), goBtn, bar2);
  const titleBar = h('div', { class: 'fuse-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('fOLDERFUSE', COLOR), style: { fontSize: '15px', letterSpacing: '.025em', color: 'var(--s-ts)', marginLeft: '6px' } }), dlBtn(app));
  const root = h('div', { class: 'fuse', tabindex: '-1' }, titleBar, main);

  /* --- affichage --- */
  const SYM = { ok: '✓  ', wn: '!  ', dg: '✕  ' };
  const drawBar = () => {
    barFill.style.width = progress + '%'; bar2.className = 'fuse-bar2 ' + (status === 'none' ? '' : status);
    bar2.setAttribute('aria-valuenow', progress); barTxt.textContent = text;
  };
  const setBar = (st, t, value) => { status = st; if (value != null) progress = value; if (t != null) { activityKey = null; text = (SYM[st] || '') + t; } drawBar(); };
  const tick = () => {
    if (!activityKey) return; const f = FRAMES[frame++ % FRAMES.length];
    text = activityKey.replace('{frame}', f).replace('%p%', progress + '%'); drawBar();
  };
  const startActivity = k => { activityKey = k; frame = 0; tick(); };
  const iv = setInterval(() => (alive() ? tick() : clearInterval(iv)), 250); w.timers.push(iv);
  const drawPickers = () => {
    [[pS, src], [pD, dst]].forEach(([p, f]) => { p.no.hidden = !!f; p.pa.hidden = !f; p.pa.textContent = f ? shortPath(f.path) : ''; p.btn.title = f ? f.path : ''; });
    pS.de.textContent = src ? srcDetail : ' '; pD.de.textContent = dst ? dstDetail : ' ';
  };
  let srcDetail = '', dstDetail = '';
  const syncUi = () => {
    pS.btn.disabled = pD.btn.disabled = running;
    goBtn.className = 'sbtn fuse-go ' + (running ? 'stop' : 'act'); goBtn.textContent = running ? T('ARRÊTER', 'STOP') : T('FUSIONNER', 'MERGE'); goBtn.disabled = false;
    drawPickers();
  };
  const updateStatus = () => {
    const t = src && dst ? T('Prêt à fusionner', 'Ready to merge') : src ? T('Sélectionnez la destination...', 'Select the destination...') : dst ? T('Sélectionnez la source...', 'Select the source...') : T('En attente de sélection...', 'Waiting for selection...');
    setBar('none', t, 0);
  };
  const freeText = f => T(`${fmtSize(f.free)} libres sur le volume`, `${fmtSize(f.free)} free on the volume`);
  async function measureSource(f) {
    const tok = ++sizeTok; srcDetail = T('Calcul de la taille...', 'Calculating size...'); drawPickers();
    const all = f.all(), n = all.length, steps = reduced() ? 1 : clamp(Math.round(n / 120), 2, 8); let acc = 0;
    await pause(260);
    for (let i = 1; i < steps; i++) { if (tok !== sizeTok || !alive()) return; acc = i / steps; srcDetail = sizeAndCount(f.total() * acc, Math.round(n * acc)) + '...'; drawPickers(); await pause(130); }
    if (tok !== sizeTok || !alive()) return;
    srcDetail = sizeAndCount(f.total(), n); drawPickers();
  }

  /* --- fenêtres modales : sélecteur de dossier et alertes (à la NSAlert) --- */
  function modal(build, cls) {
    closeModal && closeModal(false);
    const scrim = h('div', { class: 'fuse-scrim', style: { top: '44px' } }), panel = h('div', { class: cls, role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
    scrim.append(panel); root.append(scrim); main.inert = true;
    const close = (restore = true) => { if (!scrim.isConnected) return; scrim.remove(); if (closeModal === close) { closeModal = null; main.inert = false; restore && root.focus({ preventScroll: true }); } };
    closeModal = close; build(panel, close);
    if (!reduced()) panel.animate([{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
    setTimeout(() => (panel.querySelector('[data-def]') || panel).focus({ preventScroll: true }), 30);
  }
  const para = parts => h('p', {}, parts.map(x => (typeof x === 'string' ? x : h('span', { class: 'pa' }, x.pa))));
  /* boutons : [{label, kind: 'acc'|'dg'|'', def}] ; renvoie l'index choisi (Échap : dernier bouton « annuler » si cancel est défini) */
  function ask(title, parts, buttons, { detail = '', cancel = -1 } = {}) {
    return new Promise(resolve => {
      modal((p, close) => {
        const done = i => { close(); resolve(i); };
        p.append(h('img', { src: icon('fOLDERFUSE'), alt: '' }), h('div', { class: 'tx' }, h('b', {}, title), h('div', { class: 'body' }, ...parts.map(x => para(Array.isArray(x) ? x : [x])), detail ? h('pre', { tabindex: '0' }, detail) : null),
          h('div', { class: 'fuse-acts' }, buttons.map((b, i) => h('button', { class: 'sbtn sm sent ' + (b.kind || ''), 'data-def': b.def ? '' : null, onclick: () => done(i) }, b.label)))));
        p.onkeydown = e => { if (e.key === 'Escape' && cancel >= 0) { e.preventDefault(); done(cancel); } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); done(buttons.findIndex(b => b.def)); } };
      }, 'fuse-alert');
    });
  }
  const ok = (title, parts, opts) => ask(title, parts, [{ label: 'OK', kind: 'acc', def: true }], { cancel: 0, ...opts });

  const reveal = el => { const l = el.parentElement; if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop; else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight; };
  function pickFolder(kind) {
    if (running) return; sfx.click();
    const items = FOLDERS; let cur = (kind === 'src' ? src : dst) || items[kind === 'src' ? 0 : 1], btns;
    modal((p, close) => {
      const prev = h('pre'), prevT = h('div', { class: 't' }), pn = h('div', { class: 'fuse-prev' }, prevT, prev);
      const showPrev = () => {
        const all = cur.all(), more = all.length - 8;
        prevT.textContent = T('CONTENU', 'CONTENTS'); prev.textContent = all.slice(0, 8).map(f => f.p).join('\n') + (more > 0 ? '\n' + T(`… et ${num(more)} autres`, `… and ${num(more)} more`) : '');
      };
      const apply = () => { btns.forEach((b, i) => { b.classList.toggle('on', items[i] === cur); b.setAttribute('aria-pressed', items[i] === cur); }); showPrev(); };
      const pick = f => { close(); choose(kind, f); };
      btns = items.map(f => h('button', { class: 'fuse-li', onclick: () => { cur = f; sfx.tick(); apply(); }, ondblclick: () => pick(f) }, h('b', {}, '📁 ' + folderName(f)), h('small', {}, f.path)));
      apply();
      p.append(h('div', {}, h('h4', {}, kind === 'src' ? T('Dossier source', 'Source folder') : T('Dossier de destination', 'Destination folder')), h('p', { class: 'msg' }, T('Choisissez dans la liste (démo : aucun fichier n’est lu).', 'Pick from the list (demo: no file is read).'))),
        h('div', { class: 'fuse-pn' }, h('div', { class: 'fuse-list' }, btns), pn),
        h('div', { class: 'fuse-acts' }, h('button', { class: 'sbtn sm sent', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn sm sent acc', 'data-def': '', onclick: () => pick(cur) }, T('Choisir', 'Choose'))));
      p.onkeydown = e => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = clamp(items.indexOf(cur) + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); cur = items[i]; sfx.tick(); apply(); btns[i].focus({ preventScroll: true }); reveal(btns[i]); }
        else if (e.key === 'Enter' && !e.target.closest('.sbtn')) { e.preventDefault(); pick(cur); }
      };
    }, 'fuse-sheet');
  }
  function choose(kind, f) {
    if (kind === 'src') { src = f; srcDetail = ''; measureSource(f); } else { dst = f; dstDetail = freeText(f); }
    sfx.pop(); drawPickers(); updateStatus();
  }

  /* --- déroulement --- */
  async function startFusion() {
    if (running) return;
    if (!src || !dst) { sfx.close(); return ok(T('Attention', 'Warning'), [T('Veuillez choisir un dossier source et un dossier de destination.', 'Please choose a source folder and a destination folder.')]); }
    sfx.click(); running = true; stopping = false; busyKind = 'analyse'; progress = 0; setBar('none', null, 0); syncUi(); startActivity(T('Analyse des dossiers  {frame}', 'Analyzing folders  {frame}'));
    await pause(900); if (!alive() || !running) return;
    if (inside(dst.path, src.path)) {
      running = false; setBar('dg', T('Fusion impossible', 'Merge not possible'), 0); syncUi(); sfx.close();
      return ok(T('Fusion impossible', 'Merge not possible'), [T('La destination se trouve dans le dossier source.\nChoisissez une destination située en dehors de la source.', 'The destination is inside the source folder.\nChoose a destination outside the source.')]);
    }
    await confirmAndRun(inventory(src, dst));
  }
  async function confirmAndRun(inv) {
    dstDetail = freeText(dst); syncUi();
    const lines = [T(`À copier : ${fmtSize(inv.total)} (${count(inv.count)})`, `To copy: ${fmtSize(inv.total)} (${count(inv.count)})`)];
    if (inv.over > 0) lines.push(T(`Dont ${inv.over} ${inv.over === 1 ? 'fichier de même nom remplacé' : 'fichiers de même nom remplacés'} (${fmtSize(inv.overB)} actuellement)`, `Including ${inv.over} ${inv.over === 1 ? 'file' : 'files'} with the same name replaced (${fmtSize(inv.overB)} currently)`));
    lines.push(T(`Espace libre sur la destination : ${fmtSize(inv.free)}`, `Free space on the destination: ${fmtSize(inv.free)}`));
    if (inv.same) lines.push(T('Même volume : les fichiers sont clonés, sans occuper d’espace supplémentaire.', 'Same volume: files are cloned without using extra space.'));
    let fillAt = null;
    if (!inv.same && inv.total > inv.free) {
      const c = await ask(T('Espace insuffisant', 'Not enough space'), [T(`Il faut environ ${fmtSize(inv.total)} sur le volume de destination, il reste ${fmtSize(inv.free)}.\n\nLibérez au moins ${fmtSize(inv.total - inv.free)} ou choisissez une autre destination.\nSi la fusion est lancée quand même, elle s’arrêtera quand le volume sera plein.`,
        `About ${fmtSize(inv.total)} is needed on the destination volume, ${fmtSize(inv.free)} is left.\n\nFree up at least ${fmtSize(inv.total - inv.free)} or choose another destination.\nIf you merge anyway, the merge will stop when the volume is full.`)],
      [{ label: T('Annuler', 'Cancel'), def: true }, { label: T('Fusionner quand même', 'Merge anyway'), kind: 'dg' }], { cancel: 0 });
      if (!alive()) return;
      if (c !== 1) { running = false; setBar('wn', T('Espace insuffisant', 'Not enough space'), 0); syncUi(); return; }
      fillAt = inv.free / inv.total;
    }
    const c = await ask(T('Confirmation de fusion', 'Confirm merge'), [
      [T('Fusionner le contenu de :\n', 'Merge the contents of:\n'), { pa: src.path }], [T('Vers la racine du dossier :\n', 'Into the root of the folder:\n'), { pa: dst.path }], [lines.join('\n')],
      [T('Les fichiers existants portant le même nom seront remplacés. Le dossier source n’est pas modifié.', 'Existing files with the same name will be replaced. The source folder is not modified.')]],
    [{ label: T('Annuler', 'Cancel') }, { label: T('Fusionner', 'Merge'), kind: 'acc', def: true }], { cancel: 0 });
    if (!alive()) return;
    if (c !== 1) { running = false; setBar('none', T('Fusion annulée', 'Merge cancelled'), 0); syncUi(); return; }
    await runMerge(inv, fillAt);
  }
  async function runMerge(inv, fillAt) {
    busyKind = 'merge'; progress = 0; startActivity('%p%  {frame}'); syncUi(); sfx.open();
    const problems = []; let skipAll = false, handled = !inv.locked.length;
    const dur = reduced() ? 0 : clamp((1500 + (inv.total / MB) * 8) * (inv.same ? .5 : 1), 1700, 7000);
    let elapsed = 0, last = performance.now(), lastTick = -1, outcome = 'success';
    while (true) {
      await nextFrame(); if (!alive()) return;
      const now = performance.now(); elapsed += now - last; last = now;
      const k = dur ? clamp(elapsed / dur, 0, 1) : 1;
      progress = k >= 1 ? 99 : Math.floor(k * 99); if (progress !== lastTick && progress % 8 === 0) { lastTick = progress; sfx.tick(); }
      if (stopping) { outcome = 'stopped'; break; }
      if (fillAt != null && k >= fillAt) { outcome = 'full'; break; }
      if (!handled && k >= .45) {
        handled = true; const lk = inv.locked[0], msg = `${lk.p}: ${T('opération non autorisée (fichier verrouillé ?)', 'operation not permitted (locked file?)')}`;
        if (!skipAll) {
          stopActivity(); setBar('wn', null); text = T(`${progress}%  ! En pause`, `${progress}%  ! Paused`); drawBar(); sfx.close();
          const c = await ask(T('Problème de copie', 'Copy problem'), [[T('Un élément n’a pas pu être copié :\n', 'An item could not be copied:\n'), { pa: msg }], T('La fusion est en pause. Les autres fichiers peuvent être copiés normalement.', 'The merge is paused. The other files can be copied normally.')],
            [{ label: T('Ignorer et continuer', 'Skip and continue'), def: true }, { label: T('Ignorer tous les problèmes', 'Skip all problems') }, { label: T('Arrêter la fusion', 'Stop the merge'), kind: 'dg' }]);
          if (!alive()) return; last = performance.now();
          if (c === 2) { stopping = true; problems.push(msg); outcome = 'stopped'; break; }
          if (c === 1) skipAll = true;
          status = 'none'; startActivity('%p%  {frame}');
        }
        problems.push(msg);
      }
      if (k >= 1) break;
    }
    stopActivity(); running = false; stopping = false; busyKind = '';
    if (outcome === 'success' && !inv.same) dst.free = Math.max(0, dst.free - inv.total);
    dstDetail = freeText(dst); syncUi();
    const detail = problems.join('\n');
    if (outcome === 'full') {
      setBar('dg', T('Erreur de fusion', 'Merge error'), Math.round((fillAt || 0) * 99)); sfx.close();
      return ok(T('Erreur', 'Error'), [T('Le volume de destination est plein.\nLibérez de l’espace puis relancez la fusion : les fichiers déjà copiés seront simplement remplacés.', 'The destination volume is full.\nFree up some space, then run the merge again: files already copied will simply be replaced.')]);
    }
    if (outcome === 'stopped') {
      setBar('wn', T('Fusion arrêtée', 'Merge stopped')); sfx.close();
      return ok(T('Fusion arrêtée', 'Merge stopped'), [T('Fusion arrêtée. Les fichiers déjà copiés restent dans la destination.', 'Merge stopped. Files already copied stay in the destination.')], { detail });
    }
    if (problems.length) {
      const n = problems.length; setBar('wn', T(n <= 1 ? `Terminée avec ${n} problème` : `Terminée avec ${n} problèmes`, n <= 1 ? `Completed with ${n} problem` : `Completed with ${n} problems`), 100); sfx.done();
      return ok(T('Fusion terminée avec des problèmes', 'Merge completed with problems'), [T(`La fusion est terminée, mais ${n} élément n’a pas pu être copié.\nTous les autres fichiers ont été fusionnés.\n\nLa liste se trouve dans les détails.`, `The merge is complete, but ${n} item could not be copied.\nAll other files were merged.\n\nThe list is in the details.`)], { detail });
    }
    setBar('ok', T('Fusion terminée', 'Merge complete'), 100); sfx.done();
    toast({ icon: icon('fOLDERFUSE'), title: 'fOLDERFUSE', body: T(`${count(inv.count)} fusionnés dans « ${folderName(dst)} ».`, `${count(inv.count)} merged into “${folderName(dst)}”.`) });
  }
  function stopActivity() { activityKey = null; }
  async function stopFusion() {
    if (busyKind === 'analyse') { running = false; busyKind = ''; stopActivity(); setBar('none', T('Fusion annulée', 'Merge cancelled'), 0); syncUi(); return; }
    if (busyKind !== 'merge' || stopping) return;
    const c = await ask(T('Arrêter la fusion', 'Stop the merge'), [T('Arrêter la fusion maintenant ?\n\nLes fichiers déjà copiés restent dans la destination ; le fichier en cours de copie n’est pas conservé.', 'Stop the merge now?\n\nFiles already copied stay in the destination; the file being copied is not kept.')],
      [{ label: T('Continuer la fusion', 'Continue merging'), def: true }, { label: T('Arrêter', 'Stop'), kind: 'dg' }], { cancel: 0 });
    if (c === 1 && running && alive()) { stopping = true; goBtn.disabled = true; startActivity(T('Arrêt en cours  {frame}', 'Stopping  {frame}')); }
  }

  syncUi(); drawBar();
  setTimeout(() => root.isConnected && root.focus({ preventScroll: true }), 60);
  return root;
}
