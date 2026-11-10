/* kYNEDIT : réplique interactive du navigateur média et transcodeur (façon Kyno, EditReady).
   Onglets de l'appli : Explorateur, Atelier, Convertir, Copier, Exports, Performances. Médias, lecture et exports sont simulés : aucun fichier lu, aucun réseau. */
import { h, brand, T, css, toast, icon, sfx, wm, download, clamp, reduced, wait, num } from './kit.js';
import { t, lang } from '../i18n.js';

const BRAND = '#38bdf8';
const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });
const LABELS = ['', '#4ade80', '#fbbf24', '#f87171'];
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
const tc = (t0, fps) => { const f = Math.round(fps), tt = Math.max(0, t0), s = Math.floor(tt), fr = Math.min(f - 1, Math.floor((tt - s) * fps + 1e-6)); return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}:${pad(fr)}`; };
const stc = (t0, fps) => tc(t0, fps).slice(3);
const dur = s => { const t0 = Math.round(s), m = Math.floor(t0 / 60), ss = t0 % 60; return `${m}:${pad(ss)}`; };
const fpsTxt = f => (Number.isInteger(f) ? String(f) : String(f)).replace('.', lang() === 'fr' ? ',' : '.') + ' ' + T('i/s', 'fps');
const bytes = n => { const u = lang() === 'fr' ? ['o', 'Ko', 'Mo', 'Go', 'To'] : ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0, v = n; while (v >= 1000 && i < 4) { v /= 1000; i++; } return (i < 2 ? Math.round(v) : (Math.round(v * 10) / 10).toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US')) + ' ' + u[i]; };
const svg = (d, s = 14) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const MS = new Intl.DateTimeFormat('en-US');
const fdate = ms => new Intl.DateTimeFormat(lang() === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ms);

/* ---------- médias d'exemple : des plans tirés des fonds d'écran du site ---------- */
const NOW = Date.UTC(2026, 10, 9, 18, 40);
const V = (name, img, size, w, hh, fps, d, codec, o = {}) => ({ name, ext: name.split('.').pop().toLowerCase(), kind: 'video', img, size, w, h: hh, fps, dur: d, codec, ...o });
const VOLUMES = [
  { id: 'ssd', name: 'SSD Editing', clips: [V('A001_C003_1109.mov', 'tes_rift', 6.2e9, 4096, 2160, 24, 48, 'Apple ProRes 422 HQ'), V('A001_C004_1109.mov', 'tes_hrothgar', 4.4e9, 4096, 2160, 24, 34, 'Apple ProRes 422 HQ'), V('A002_C001_1109.mov', 'dragon', 7.9e9, 4096, 2160, 24, 61, 'Apple ProRes 422 HQ'), V('C0012.MP4', 'ocean', 1.3e9, 3840, 2160, 25, 27, 'Sony XAVC S', { cam: 'Sony FX6' }),
    V('C0013.MP4', 'dune', 2.6e9, 3840, 2160, 25, 52, 'Sony XAVC S', { cam: 'Sony FX6' }), V('scene12_take3.braw', 'tes_oblivion', 3.8e9, 4608, 2592, 24, 22, 'Blackmagic RAW', { raw: true, cam: 'Blackmagic URSA' }), V('IMG_5127.MOV', 'prairie', 0.9e9, 3840, 2160, 30, 18, 'HEVC (Main 10)', { cam: 'iPhone 17 Pro' }), V('IMG_5128.MOV', 'brume', 0.7e9, 1920, 1080, 60, 14, 'HEVC (Main)', { cam: 'iPhone 17 Pro' }),
    V('drone_dji_0042.mp4', 'tes_solitude', 2.1e9, 3840, 2160, 29.97, 71, 'H.264 High', { cam: 'DJI Mavic 4' }), V('interview_marc_A.mov', 'tes_whiterun', 3.1e9, 1920, 1080, 25, 94, 'Apple ProRes 422'), V('plan_large_aurore.mov', 'nordique', 5.5e9, 4096, 2160, 24, 40, 'Apple ProRes 422 HQ'), V('R3D_K003_C002.R3D', 'tes_moons', 11e9, 6144, 3240, 24, 15, 'REDCODE RAW', { raw: true, cam: 'RED Komodo-X' }),
    { name: 'ambiance_foret.wav', ext: 'wav', kind: 'audio', img: null, size: 86e6, dur: 150, codec: 'PCM 24 bits 48 kHz', fps: 0, w: 0, h: 0 }, { name: 'affiche_festival.jpg', ext: 'jpg', kind: 'image', img: 'tes_winterhold', size: 3.4e6, w: 6000, h: 4000, fps: 0, dur: 0, codec: 'JPEG' }] },
  { id: 'card', name: 'RUSHES_FX6', clips: ['tes_markarth', 'tes_sovngarde', 'aurore', 'tes_dwemer', 'braises', 'tes_solitude', 'ocean', 'dune', 'prairie', 'brume', 'nordique', 'dragon'].map((im, i) => V(`C${pad(21 + i, 4)}.MP4`, im, (1.1 + (i % 5) * .4) * 1e9, 3840, 2160, 25, 16 + (i * 13) % 57, 'Sony XAVC-I', { cam: 'Sony FX6' })) },
  { id: 'raid', name: 'Archive RAID', clips: [V('2025_mariage_cérémonie.mov', 'tes_whiterun', 18e9, 3840, 2160, 25, 88, 'Apple ProRes 422'), V('2025_mariage_discours.mov', 'tes_hrothgar', 9.4e9, 1920, 1080, 25, 64, 'Apple ProRes 422'), V('voyage_islande_01.mov', 'nordique', 6.6e9, 3840, 2160, 24, 43, 'Apple ProRes 422 LT'), V('voyage_islande_02.mov', 'aurore', 5.2e9, 3840, 2160, 24, 36, 'Apple ProRes 422 LT'),
    V('clip_musical_final.mov', 'verre', 12e9, 4096, 2160, 24, 112, 'Apple ProRes 4444'), V('making_of.mp4', 'nuit', 1.8e9, 1920, 1080, 25, 126, 'H.264 High'), V('teaser_v3.mov', 'tes_oblivion', 2.2e9, 3840, 2160, 24, 30, 'Apple ProRes 422'), V('vieux_rush_16mm.mov', 'tes_dwemer', 4.1e9, 2048, 1556, 24, 21, 'Apple ProRes 422')] },
  { id: 'hd', name: 'Macintosh HD', clips: [V('Screen Recording 2026-11-02.mov', 'tes_solitude', 0.4e9, 2880, 1864, 60, 73, 'H.264'), V('IMG_4980.MOV', 'prairie', 0.5e9, 3840, 2160, 30, 12, 'HEVC (Main 10)', { cam: 'iPhone 17 Pro' }), V('tuto_montage.mp4', 'dune', 0.8e9, 1920, 1080, 30, 148, 'H.264 High')] }
];
VOLUMES.forEach(v => v.clips.forEach((c, i) => { c.id = v.id + '/' + c.name; c.vol = v.id; c.mtime = NOW - (i * 7 + 2) * 36e5 * (v.id === 'raid' ? 40 : 1); c.pos = (i * 37) % 100; }));
const ALL = VOLUMES.flatMap(v => v.clips);
const PRESETS = [['proRes422HQ', 'ProRes 422 HQ'], ['h264', 'H.264'], ['hevc', 'H.265 (HEVC)']];
const CODECS_F = () => ['ProRes 422 Proxy', 'ProRes 422 LT', 'ProRes 422', 'ProRes 422 HQ', 'ProRes 4444', 'ProRes 4444 XQ', 'DNxHR LB', 'DNxHR SQ', 'DNxHR HQ', 'DNxHR HQX', 'DNxHR 444', 'DNxHD (1080p, 8 bits)', 'DNxHD (1080p, 10 bits)', 'H.264', 'H.265 (HEVC)', T('Rewrap (sans réencodage)', 'Rewrap (no re-encode)')];
const SIZES_F = () => [['', T('Taille d’origine', 'Source size')], ['3840x2160', 'UHD 3840×2160'], ['2048x1080', '2K 2048×1080'], ['1920x1080', '1080p 1920×1080'], ['1280x720', '720p 1280×720'], ['960x540', '540p 960×540'], ['854x480', '480p 854×480'], ['1080x1080', '1080×1080'], ['1080x1920', '1080×1920']];
const RATES = [0, 23.976, 24, 25, 29.97, 30, 50, 59.94, 60];
const LOGS = ['—', 'ARRI LogC3 / Wide Gamut', 'Sony S-Log3 / S-Gamut3.Cine', 'Sony S-Log3 / S-Gamut3', 'Panasonic V-Log / V-Gamut', 'Canon Log 3 / Cinema Gamut', 'Blackmagic Film Gen 5', 'RED Log3G10 / RedWideGamut'];
const CP_F = () => [[T('Montage (ProRes)', 'Editing (ProRes)'), [['ProRes 422 HQ', { codec: 'ProRes 422 HQ' }], ['ProRes 422', { codec: 'ProRes 422' }], ['ProRes 422 LT', { codec: 'ProRes 422 LT' }], ['ProRes 422 HQ · 1080p', { codec: 'ProRes 422 HQ', size: '1920x1080' }], ['ProRes 422 HQ · UHD', { codec: 'ProRes 422 HQ', size: '3840x2160' }]]],
  [T('Proxys', 'Proxies'), [['ProRes Proxy · 1080p', { codec: 'ProRes 422 Proxy', size: '1920x1080', tpl: '{name}_proxy' }], ['H.264 proxy · 720p', { codec: 'H.264', size: '1280x720', tpl: '{name}_proxy' }], ['H.264 proxy · 1080p + ' + T('timecode', 'timecode'), { codec: 'H.264', size: '1920x1080', tpl: '{name}_proxy', burn: [['tc', 'bl'], ['nm', 'tl']] }]]],
  ['Avid (DNxHR, DNxHD)', [['DNxHR HQ · MOV', { codec: 'DNxHR HQ' }], ['DNxHR HQX · MXF OP-Atom + ALE', { codec: 'DNxHR HQX', wrap: 'MXF OP-Atom', ale: true }]]],
  [T('Diffusion', 'Delivery'), [['H.264 · UHD (YouTube)', { codec: 'H.264', size: '3840x2160', tpl: '{name}_UHD' }], ['H.264 · 1080p (web, Vimeo)', { codec: 'H.264', size: '1920x1080', tpl: '{name}_1080p' }], ['H.264 · 1080 ' + T('carré (réseaux sociaux)', 'square (social media)'), { codec: 'H.264', size: '1080x1080', pad: true, tpl: '{name}_square' }], ['H.265 · 1080p', { codec: 'H.265 (HEVC)', size: '1920x1080', tpl: '{name}_1080p' }]]],
  [T('Rushes', 'Dailies'), [[T('Rushes', 'Dailies') + ' H.264 · 1080p (' + T('timecode, bobine, nom', 'timecode, reel, name') + ') + ALE', { codec: 'H.264', size: '1920x1080', burn: [['tc', 'bl'], ['reel', 'br'], ['nm', 'tl']], ale: true, tpl: '{name}_{reel}' }]]],
  [T('Caméras (log → Rec.709)', 'Cameras (log → Rec.709)'), [['ARRI LogC3', { codec: 'ProRes 422 HQ', log: 1 }], ['Sony S-Log3', { codec: 'ProRes 422 HQ', log: 2 }], ['Canon Log 3', { codec: 'ProRes 422 HQ', log: 5 }]]]];
const BURN_F_F = () => [['tc', T('Timecode', 'Timecode')], ['reel', T('Bobine', 'Reel')], ['nm', T('Nom du clip', 'Clip name')], ['date', T('Date', 'Date')], ['custom', T('Texte libre', 'Custom text')]];
const POS_F = () => [['tl', T('Haut gauche', 'Top left')], ['tc', T('Haut centre', 'Top center')], ['tr', T('Haut droite', 'Top right')], ['bl', T('Bas gauche', 'Bottom left')], ['bc', T('Bas centre', 'Bottom center')], ['br', T('Bas droite', 'Bottom right')]];

export async function open(app) {
  await sheetReady('css/demos/kYNEDIT.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, x: 250, y: 84, minw: 1040, minh: 560, bare: true, cls: 'socle kynedit', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  const CODECS = CODECS_F(), SIZES = SIZES_F(), CP = CP_F(), BURN_F = BURN_F_F(), POS = POS_F();
  const root = h('div', { class: 'kynedit-root', tabindex: '-1' }), content = h('div', { class: 'kynedit-content' });
  const S = { tab: 'explorer', vol: null, scanning: false, scanned: 0, shown: [], sel: new Set(), anchor: null, grid: true, q: '', hMin: 0, fpsF: 0, rMin: 0, cF: 0, meta: {}, preset: 'proRes422HQ', outDir: 0, queueNote: '', useLUT: false, lut: null,
    conv: { clips: [], preset: null, set: { codec: 'ProRes 422 HQ', wrap: 'MOV', size: '', pad: false, fps: 0, log: 0, lut: null, audio: 'all', ch: 'keep', burn: [], logo: false, tpl: '{name}_{codec}', recreate: false, ale: false, assemble: false }, mine: [], newName: '', msg: '', jobs: [], open: { format: true, output: true } },
    at: { clips: [], idx: 0, items: [], msg: '', last: null, jobs: [], replace: false }, jobs: [], offload: { src: '/Volumes/RUSHES_FX6', dests: ['/Volumes/SSD Editing/RUSHES', '/Volumes/Archive RAID/Backup'], verify: true, incr: true, mhl: false, running: false, done: 0, total: 0, bytesDone: 0, bytesTotal: 0, cur: '', finished: false, results: [] }, perf: { rows: [], best: {}, running: false } };
  const OUT = ['~/Movies/kYNEDIT Exports', '~/Desktop/Exports', '/Volumes/SSD Editing/Exports'];
  const meta = c => (S.meta[c.id] = S.meta[c.id] || { rating: 0, color: 0, tags: [], note: '', markers: [], subclips: [] });
  let jid = 0, popEl = null, popOff = null, sheetEl = null, rafId = 0, last = 0; const subs = new Set();

  /* --- briques d'interface (style Socle) --- */
  const btn = (label, fn, cls = '', dis) => h('button', { class: 'kynedit-btn ' + cls, onclick: fn, disabled: dis }, label);
  const link = (label, fn, dis) => h('button', { class: 'kynedit-link', onclick: fn, disabled: dis }, label);
  const sh = s => h('div', { class: 'kynedit-sh' }, s);
  const rowL = (label, ctl) => h('div', { class: 'kynedit-srow' }, h('span', {}, label), h('div', {}, ctl));
  const chk = (label, get, set) => h('button', { class: 'kynedit-chk' + (get() ? ' on' : ''), role: 'checkbox', 'aria-checked': !!get(), onclick: () => set(!get()) }, h('i', {}, get() ? '✓' : ''), h('span', {}, label));
  const field = (ph, get, set, cls = '') => h('input', { class: 'kynedit-field ' + cls, value: get(), placeholder: ph, 'aria-label': ph, oninput: e => set(e.target.value) });
  const note = s => h('p', { class: 'kynedit-note' }, s);
  const stars = (v, size, set) => h('span', { class: 'kynedit-stars', style: { '--sz': size + 'px' } }, [1, 2, 3, 4, 5].map(i => h('button', { class: i <= v ? 'on' : '', 'aria-label': i + ' ★', onclick: e => { e.stopPropagation(); set(i); } }, i <= v ? '★' : '☆')));
  const toastSay = m => toast({ icon: icon(app.id), title: app.id, body: m });
  const sc = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
  const loc = (cx, cy) => { const r = root.getBoundingClientRect(), k = sc(); return [(cx - r.left) / k, (cy - r.top) / k]; };
  function closeMenu() { document.querySelectorAll('.kynedit-menu').forEach(e => e.remove()); popEl = null; if (popOff) { document.removeEventListener('pointerdown', popOff, true); popOff = null; } }
  function menu(list, at) {
    closeMenu(); const mkm = (l, cls) => h('div', { class: 'kynedit-menu ' + cls, role: 'menu' }, l.map(it => it === '-' ? h('hr', {}) : it.head ? h('div', { class: 'kynedit-mh' }, it.head) : h('button', { class: 'kynedit-mi', role: 'menuitem', disabled: it.off }, h('i', {}, it.on ? '✓' : ''), h('span', {}, it.l), it.sub ? h('em', {}, '›') : null)));
    const el = mkm(list, ''); root.append(el); popEl = el; let x, y, minW = 0;
    if (at.getBoundingClientRect) { const r = at.getBoundingClientRect(); [x, y] = loc(r.left, r.bottom); y += 4; minW = r.width / sc(); } else [x, y] = at; el.style.minWidth = minW + 'px';
    el.style.left = clamp(x, 8, root.offsetWidth - el.offsetWidth - 8) + 'px'; el.style.top = clamp(y, 8, root.offsetHeight - el.offsetHeight - 8) + 'px';
    const flat = list.filter(i => i !== '-' && !i.head); let sub = null;
    [...el.querySelectorAll('.kynedit-mi')].forEach((b, i) => { const it = flat[i];
      const openSub = () => { sub && sub.remove(); sub = null; if (!it.sub) return; sub = mkm(it.sub, 'kynedit-sub'); root.append(sub); const br = b.getBoundingClientRect(), [sx, sy] = loc(br.right, br.top); sub.style.left = clamp(sx + 2, 8, root.offsetWidth - sub.offsetWidth - 8) + 'px'; sub.style.top = clamp(sy - 4, 8, root.offsetHeight - sub.offsetHeight - 8) + 'px';
        const sf = it.sub.filter(q => q !== '-' && !q.head); [...sub.querySelectorAll('.kynedit-mi')].forEach((sb, j) => { sb.onclick = () => { closeMenu(); sfx.tick(); sf[j].fn(); }; }); };
      b.onmouseenter = openSub; b.onclick = () => { if (it.sub) return openSub(); closeMenu(); sfx.tick(); it.fn && it.fn(); }; });
    popOff = e => { if (!alive()) return closeMenu(); if (!e.target.closest('.kynedit-menu') && !(at.contains && at.contains(e.target))) closeMenu(); };
    setTimeout(() => popEl === el && document.addEventListener('pointerdown', popOff, true), 0);
  }
  const dd = (items, get, set, labelOf = x => x, cls = '') => { const b = h('button', { class: 'kynedit-dd ' + cls, 'aria-haspopup': 'menu', onclick: () => (popEl ? closeMenu() : menu(items.map(it => ({ l: labelOf(it), on: JSON.stringify(it) === JSON.stringify(get()), fn: () => set(it) })), b)) }, h('span', {}, labelOf(get())), h('i', {}, '⌄')); return b; };
  function closeSheet() { sheetEl && sheetEl.remove(); sheetEl = null; }
  function sheet(title, body, foot, width = 440) { closeMenu(); closeSheet(); const card = h('div', { class: 'kynedit-sheet', style: { width: width + 'px' }, role: 'dialog', 'aria-label': title }, h('h3', {}, title), body, h('div', { class: 'kynedit-foot' }, foot)); sheetEl = h('div', { class: 'kynedit-scrim', onpointerdown: e => { if (e.target === sheetEl) closeSheet(); } }, card); root.append(sheetEl); card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 180, easing: 'ease-out' }); const f = card.querySelector('input'); f && requestAnimationFrame(() => f.focus({ preventScroll: true })); }
  const confirmBox = (title, body, ok, label) => sheet(title, h('p', { class: 'kynedit-note c' }, body), [btn(T('ANNULER', 'CANCEL'), closeSheet, 'ter'), btn(label, () => { closeSheet(); ok(); }, 'dng')], 400);

  /* --- lecteur simulé : horloge, J K L, I O, M, sous-clips --- */
  function makePlayer() {
    const p = { clip: null, dur: 0, t: 0, rate: 0, fps: 25, markIn: null, markOut: null, listeners: new Set() };
    const emit = () => p.listeners.forEach(f => f());
    Object.assign(p, {
      open(c) { p.clip = c; p.dur = c.dur || 0; p.fps = c.fps > 0 ? c.fps : 25; p.t = 0; p.rate = 0; p.markIn = null; p.markOut = null; emit(); },
      close() { p.clip = null; p.rate = 0; emit(); },
      toggle() { if (!p.clip || !p.dur) return; if (p.rate !== 0) p.rate = 0; else { if (p.t >= p.dur - .05) p.t = 0; p.rate = 1; } ensureLoop(); emit(); },
      pause() { p.rate = 0; emit(); }, faster() { if (!p.dur) return; p.rate = p.rate <= 0 ? 1 : Math.min(8, p.rate * 2); ensureLoop(); emit(); }, reverse() { if (!p.dur) return; p.rate = p.rate >= 0 ? -1 : Math.max(-8, p.rate * 2); ensureLoop(); emit(); },
      step(n) { p.rate = 0; p.t = clamp(p.t + n / p.fps, 0, p.dur); emit(); }, seek(x) { p.t = clamp(x, 0, p.dur); emit(); },
      marker() { if (!p.clip) return; const m = meta(p.clip); m.markers.push({ id: Date.now() + Math.random(), t: p.t, label: T(`Marqueur ${m.markers.length + 1}`, `Marker ${m.markers.length + 1}`) }); m.markers.sort((a, b) => a.t - b.t); sfx.tick(); emit(); },
      subclip() { if (!p.clip) return; const a = p.markIn ?? 0, b = p.markOut ?? p.dur; if (b <= a) return; const m = meta(p.clip); m.subclips.push({ id: Date.now() + Math.random(), tin: a, tout: b, name: T(`Sous-clip ${m.subclips.length + 1}`, `Subclip ${m.subclips.length + 1}`) }); m.subclips.sort((x, y) => x.tin - y.tin); sfx.pop(); emit(); },
      key(e) {
        if (!p.clip) return false; const sh2 = e.shiftKey;
        if (e.key === 'ArrowLeft') p.step(sh2 ? -10 : -1); else if (e.key === 'ArrowRight') p.step(sh2 ? 10 : 1);
        else if (e.key === ' ') p.toggle(); else { const k = e.key.toLowerCase(); if (k === 'k') p.pause(); else if (k === 'l') p.faster(); else if (k === 'j') p.reverse(); else if (k === 'i') { p.markIn = p.t; emit(); } else if (k === 'o') { p.markOut = p.t; emit(); } else if (k === 'm') p.marker(); else return false; }
        return true;
      }
    });
    return p;
  }
  const pl = makePlayer(), at = makePlayer(); S.pl = pl; S.atP = at;
  function ensureLoop() { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); } }
  function loop(now) {
    rafId = 0; if (!alive()) return; const dt = Math.min(.1, (now - last) / 1000); last = now; let busy = false;
    [pl, at].forEach(p => { if (p.rate !== 0 && p.clip) { p.t += p.rate * dt; if (p.t >= p.dur) { p.t = p.dur; p.rate = 0; } else if (p.t <= 0) { p.t = 0; p.rate = 0; } else busy = true; p.listeners.forEach(f => f()); } });
    const running = S.jobs.filter(j => j.state === 'running' || j.state === 'waiting');
    if (running.length) { busy = true; running.filter(j => j.state === 'running').forEach(j => { j.progress += dt / j.wall; if (j.fail && j.progress >= j.fail) { j.state = 'failed'; j.error = T('Format RAW : l’export demande le SDK du fabricant, non installé.', 'RAW format: export needs the manufacturer’s SDK, which is not installed.'); sfx.close(); } else if (j.progress >= 1) { j.progress = 1; j.state = 'done'; j.elapsed = j.wall; sfx.tick(); } }); pump(); }
    const js = S.jobs.map(j => j.state).join(); if (js !== S.jstate) { S.jstate = js; drawTabs(); }
    subs.forEach(f => f()); if (busy || subs.size && S.jobs.some(j => j.state === 'running')) rafId = requestAnimationFrame(loop);
  }
  function pump() { const run = S.jobs.filter(j => j.state === 'running').length; S.jobs.filter(j => j.state === 'waiting').slice(0, Math.max(0, 2 - run)).forEach(j => { j.state = 'running'; }); }
  function addJob(o) { const j = { id: ++jid, name: o.name, label: o.label, state: 'waiting', progress: 0, out: o.out, wall: clamp(o.dur / (o.speed || 8), 1.6, 6.5), seconds: o.dur, elapsed: 0, error: null, fail: o.raw ? .38 : 0 }; S.jobs.push(j); pump(); ensureLoop(); drawTabs(); return j.id; }
  const outName = (c, preset) => c.name.replace(/\.[^.]+$/, '') + '_' + preset.replace(/[ .()]/g, '') + '.' + (preset.startsWith('Pro') ? 'mov' : 'mp4');

  /* --- barre de titre, onglets, recherche --- */
  const TABS = [['explorer', T('Explorateur', 'Explorer')], ['atelier', T('Atelier', 'Workshop')], ['convert', T('Convertir', 'Convert')], ['offload', T('Copier', 'Offload')], ['exports', 'Exports'], ['perf', T('Performances', 'Performance')]];
  const tabsEl = h('div', { class: 'kynedit-tabs', role: 'tablist' }), searchEl = h('input', { class: 'kynedit-search', type: 'search', placeholder: T('Rechercher un clip, une étiquette, une caméra…', 'Search a clip, tag or camera…'), 'aria-label': T('Rechercher un clip, une étiquette, une caméra…', 'Search a clip, tag or camera…'), oninput: e => { S.q = e.target.value; if (S.tab === 'explorer') drawExplorerList(); } });
  const openBtn = h('button', { class: 'kynedit-btn kynedit-open', onclick: () => chooseFolder() }, T('OUVRIR UN DOSSIER', 'OPEN A FOLDER'));
  function drawTabs() {
    tabsEl.innerHTML = ''; const pend = S.jobs.filter(j => j.state === 'waiting' || j.state === 'running').length;
    TABS.forEach(([k, l]) => tabsEl.append(h('button', { class: 'kynedit-tab' + (S.tab === k ? ' on' : ''), role: 'tab', 'aria-selected': S.tab === k, onclick: () => go(k) }, l + (k === 'exports' && pend ? ` (${pend})` : ''))));
    openBtn.classList.toggle('hid', !S.vol); openBtn.classList.toggle('kynedit-amber', false); searchEl.disabled = false;
  }
  function go(k) { S.tab = k; subs.clear(); closeMenu(); sfx.tick(); drawTabs(); ({ explorer: drawExplorer, atelier: drawAtelier, convert: drawConvert, offload: drawOffload, exports: drawExports, perf: drawPerf })[k](); }
  const bar = h('div', { class: 'kynedit-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('kYNEDIT', BRAND) }), tabsEl, h('span', { class: 'kynedit-gap' }), h('div', { class: 'kynedit-sf' }, searchEl), openBtn,
    h('button', { class: 'kynedit-btn', onclick: () => download(app), disabled: !app.download }, t('f.download')));

  /* ======================== Explorateur ======================== */
  const exp = { side: null, main: null, list: null, insp: null, player: null };
  function chooseFolder() { sheet(T('Choisissez un dossier', 'Choose a folder'), h('div', { class: 'kynedit-vols' }, VOLUMES.map(v => h('button', { class: 'kynedit-vol', onclick: () => { closeSheet(); openVol(v); } }, h('i', { html: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', 18) }), h('span', {}, h('b', {}, v.name), h('small', {}, `${v.clips.length} ` + T('médias', 'media files'))))), h('p', { class: 'kynedit-note' }, T('Dossiers d’exemple de la démo : aucun fichier de votre Mac n’est lu.', 'Demo sample folders: no file on your Mac is read.'))), [btn(T('ANNULER', 'CANCEL'), closeSheet, 'ter')], 420); }
  async function openVol(v) {
    if (S.scanning) return; S.vol = v; S.sel = new Set(); S.anchor = null; pl.close(); S.shown = []; S.scanning = true; S.scanned = 0; S.tab = 'explorer'; drawTabs(); drawExplorer(); sfx.click();
    for (let i = 0; i < v.clips.length; i++) { if (!alive() || S.vol !== v) return; S.shown.push(v.clips[i]); S.scanned = i + 1; drawExplorerList(true); sfx.tick(); await wait(reduced() ? 0 : 70); }
    if (!alive() || S.vol !== v) return; S.scanning = false; drawExplorerList(); drawExplorerSide(); sfx.done();
  }
  const visibleClips = () => { const q = S.q.trim().toLowerCase(); return (S.vol ? S.shown : []).filter(c => { const m = meta(c); return (!q || (c.name + ' ' + (c.cam || '') + ' ' + c.codec + ' ' + m.tags.join(' ') + ' ' + m.note).toLowerCase().includes(q)) && (!S.hMin || c.h >= S.hMin) && (!S.fpsF || Math.abs(c.fps - S.fpsF) < .01) && m.rating >= S.rMin && (!S.cF || m.color === S.cF); }); };
  const selClips = () => ALL.filter(c => S.sel.has(c.id));
  const one = () => { const l = selClips(); return l.length ? l[l.length - 1] : null; };
  function drawExplorer() {
    content.innerHTML = ''; exp.side = h('aside', { class: 'kynedit-side' }); exp.main = h('div', { class: 'kynedit-exmain' }); exp.list = h('div', { class: 'kynedit-exlist' }); exp.insp = h('aside', { class: 'kynedit-insp hid' }); exp.player = h('div', { class: 'kynedit-player hid' });
    exp.main.append(h('div', { class: 'kynedit-extop' }, exp.list, exp.insp), exp.player); content.append(h('div', { class: 'kynedit-explorer' }, exp.side, exp.main)); drawExplorerSide(); drawExplorerList(); drawSelection();
  }
  function drawExplorerSide() { exp.side.innerHTML = ''; exp.side.append(h('div', { class: 'kynedit-sh' }, T('VOLUMES', 'VOLUMES')), ...VOLUMES.map(v => h('button', { class: 'kynedit-sv' + (S.vol === v ? ' on' : ''), onclick: () => openVol(v) }, v.name))); }
  const filterBtn = (label, active, items) => { const b = h('button', { class: 'kynedit-flt' + (active ? ' on' : ''), onclick: () => (popEl ? closeMenu() : menu(items, b)) }, h('span', {}, label), h('i', {}, '⌄')); return b; };
  function drawExplorerList(scanTick) {
    if (S.tab !== 'explorer' || !exp.list) return; const keep = exp.scroll && exp.scroll.scrollTop; exp.list.innerHTML = '';
    if (!S.vol) { exp.list.append(h('div', { class: 'kynedit-empty' }, h('b', {}, T('Ouvrez un dossier pour commencer.', 'Open a folder to get started.')), h('p', {}, T('Explorez, marquez, exportez vos médias.', 'Browse, tag and export your media.')), h('button', { class: 'sbtn act kynedit-cta', onclick: chooseFolder }, T('OUVRIR UN DOSSIER', 'OPEN A FOLDER')), h('small', {}, T('Aucun fichier d’origine n’est modifié.', 'Your original files are never modified.')))); return; }
    const list = visibleClips(), n = list.length;
    const head = h('div', { class: 'kynedit-lh' }, h('b', {}, S.vol.name), h('span', { class: 'kynedit-mut' }, S.scanning ? T(`Analyse… ${S.scanned} fichier${S.scanned > 1 ? 's' : ''}`, `Scanning… ${S.scanned} file${S.scanned > 1 ? 's' : ''}`) : T(`${n} média${n > 1 ? 's' : ''}`, `${n} media file${n > 1 ? 's' : ''}`)), h('span', { class: 'kynedit-gap' }),
      filterBtn(S.hMin ? `≥ ${S.hMin}p` : T('Résolution', 'Resolution'), S.hMin, [{ l: T('Toutes résolutions', 'All resolutions'), fn: () => { S.hMin = 0; drawExplorerList(); } }, ...[[720, 'HD 720+'], [1080, 'Full HD 1080+'], [1440, '2K 1440+'], [2160, 'UHD 2160+'], [4320, '8K 4320+']].map(([v, l]) => ({ l, on: S.hMin === v, fn: () => { S.hMin = v; drawExplorerList(); } }))]),
      filterBtn(S.fpsF ? fpsTxt(S.fpsF) : T('Cadence', 'Frame rate'), S.fpsF, [{ l: T('Toutes cadences', 'All frame rates'), fn: () => { S.fpsF = 0; drawExplorerList(); } }, ...[23.976, 24, 25, 29.97, 30, 50, 59.94, 60].map(f => ({ l: fpsTxt(f), on: S.fpsF === f, fn: () => { S.fpsF = f; drawExplorerList(); } }))]),
      stars(S.rMin, 13, i => { S.rMin = S.rMin === i ? 0 : i; drawExplorerList(); }), ...[1, 2, 3].map(c => h('button', { class: 'kynedit-dot' + (S.cF === c ? ' on' : ''), style: { background: LABELS[c] }, 'aria-label': [T('Validé', 'Approved'), T('À revoir', 'To review'), T('Rejeté', 'Rejected')][c - 1], onclick: () => { S.cF = S.cF === c ? 0 : c; drawExplorerList(); } })),
      h('div', { class: 'kynedit-segs' }, [[true, T('Grille', 'Grid')], [false, T('Liste', 'List')]].map(([g, l]) => h('button', { class: S.grid === g ? 'on' : '', 'aria-pressed': S.grid === g, onclick: () => { S.grid = g; drawExplorerList(); } }, l))));
    exp.list.append(head);
    if (!n && !S.scanning) { exp.list.append(h('p', { class: 'kynedit-nomedia' }, T('Aucun média dans ce dossier.', 'No media in this folder.'))); return; }
    const scroll = h('div', { class: 'kynedit-scroll' }); exp.scroll = scroll;
    if (S.grid) scroll.append(h('div', { class: 'kynedit-grid' }, list.map(card)));
    else { scroll.append(h('div', { class: 'kynedit-lcols' }, [T('NOM', 'NAME'), T('TYPE', 'TYPE'), T('TAILLE', 'SIZE'), T('MODIFIÉ', 'MODIFIED')].map(x => h('span', {}, x))), ...list.map(c => h('div', { class: 'kynedit-lrow' + (S.sel.has(c.id) ? ' sel' : ''), 'data-id': c.id, onclick: e => click(c, e), oncontextmenu: e => ctx(c, e) }, h('b', {}, c.name), h('span', {}, T({ video: 'Vidéo', audio: 'Audio', image: 'Image' }[c.kind], { video: 'Video', audio: 'Audio', image: 'Image' }[c.kind]) + ' · ' + c.ext.toUpperCase()), h('span', {}, bytes(c.size)), h('span', {}, fdate(c.mtime))))); }
    exp.list.append(scroll); if (keep && !scanTick) scroll.scrollTop = keep; else if (scanTick) scroll.scrollTop = scroll.scrollHeight;
  }
  function card(c) {
    const m = meta(c), sel = S.sel.has(c.id);
    const img = c.img ? h('img', { src: `assets/wallpapers/thumbs/${c.img}.jpg`, alt: '', draggable: false }) : h('div', { class: 'kynedit-wave', html: Array.from({ length: 26 }, (_, i) => `<i style="height:${18 + Math.abs(Math.sin(i * 1.7) * 50) + (i % 3) * 8}%"></i>`).join('') });
    const bar2 = h('i', { class: 'kynedit-scrub' });
    const th = h('div', { class: 'kynedit-th' }, img, bar2, c.raw ? h('span', { class: 'kynedit-raw' }, 'RAW') : null, (m.rating || m.color) ? h('span', { class: 'kynedit-bdg' }, m.color ? h('i', { style: { background: LABELS[m.color] } }) : null, m.rating ? '★'.repeat(m.rating) : null) : null, c.dur ? h('span', { class: 'kynedit-dur' }, dur(c.dur)) : null);
    if (c.img && c.kind === 'video') { th.addEventListener('pointermove', e => { const r = th.getBoundingClientRect(), f = clamp((e.clientX - r.left) / r.width, 0, 1); img.style.transform = `scale(1.35) translateX(${(.5 - f) * 12}%)`; bar2.style.width = f * 100 + '%'; }); th.addEventListener('pointerleave', () => { img.style.transform = ''; bar2.style.width = '0'; }); }
    return h('div', { class: 'kynedit-card' + (sel ? ' sel' : ''), 'data-id': c.id, role: 'option', 'aria-selected': sel, onclick: e => click(c, e), oncontextmenu: e => ctx(c, e) }, th,
      h('div', { class: 'kynedit-ci' }, h('b', {}, c.name), h('small', {}, c.w ? `${c.w}×${c.h}${c.fps ? ' · ' + fpsTxt(c.fps) : ''}` : ' '), h('small', {}, c.codec)));
  }
  function click(c, e) {
    const ids = visibleClips().map(q => q.id);
    if (e.metaKey || e.ctrlKey) S.sel.has(c.id) ? S.sel.delete(c.id) : S.sel.add(c.id); else if (e.shiftKey && S.anchor) { const a = ids.indexOf(S.anchor), b = ids.indexOf(c.id); if (a >= 0 && b >= 0) S.sel = new Set(ids.slice(Math.min(a, b), Math.max(a, b) + 1)); } else S.sel = new Set([c.id]);
    if (!e.shiftKey) S.anchor = c.id; sfx.tick(); updateSelMarks(); drawSelection(); if (S.sel.size === 1 && pl.clip !== c) pl.open(one());
  }
  function ctx(c, e) { e.preventDefault(); if (!S.sel.has(c.id)) { S.sel = new Set([c.id]); updateSelMarks(); drawSelection(); } const tg = selClips(), [x, y] = loc(e.clientX, e.clientY);
    menu([{ l: T('Ajouter à Convertir', 'Add to Convert'), fn: () => { addConvert(tg); go('convert'); } }, { l: T('Envoyer vers', 'Send to'), sub: [{ l: T('Aucune', 'None'), fn: () => {} }, ...['DaVinci Resolve', 'Final Cut Pro', 'Premiere Pro'].map((n, i) => ({ l: n, fn: () => sendNLE(i) }))] }, '-', { l: T('Ouvrir dans l’atelier', 'Open in the workshop'), fn: () => { addAtelier(tg); go('atelier'); } }, '-', { l: T('Afficher dans le Finder', 'Show in Finder'), fn: () => toastSay('/Volumes/' + (S.vol ? S.vol.name : '') + '/' + c.name) }, { l: T('Copier le chemin', 'Copy path'), fn: () => toastSay(T('Chemin copié : ', 'Path copied: ') + '/Volumes/' + (S.vol ? S.vol.name : '') + '/' + c.name) }], [x, y]); }
  function updateSelMarks() { exp.list && exp.list.querySelectorAll('[data-id]').forEach(el => { const on = S.sel.has(el.dataset.id); el.classList.toggle('sel', on); el.setAttribute('aria-selected', on); }); }

  /* inspecteur + lecteur de l'explorateur */
  function drawSelection() {
    if (S.tab !== 'explorer' || !exp.insp) return; const c = one(), many = S.sel.size;
    exp.insp.classList.toggle('hid', !c); exp.player.classList.toggle('hid', !c || c.kind === 'image' && false); if (!c) return pl.close();
    drawInspector(c); if (pl.clip !== c) pl.open(c); drawPlayer(c);
  }
  function drawInspector(c) {
    const m = meta(c), box = exp.insp; box.innerHTML = ''; const many = S.sel.size;
    const tagIn = h('input', { class: 'kynedit-field', placeholder: T('Ajouter un mot-clé', 'Add a keyword'), 'aria-label': T('Ajouter un mot-clé', 'Add a keyword'), onkeydown: e => { if (e.key === 'Enter' && tagIn.value.trim()) { m.tags.push(tagIn.value.trim()); sfx.tick(); drawInspector(c); updateCardBadges(c); } } });
    const info = (k, v) => h('div', { class: 'kynedit-info' }, h('span', {}, k), h('b', { title: v }, v));
    box.append(h('div', { class: 'kynedit-ib' }, h('div', { class: 'kynedit-sh' }, T('CLIP SÉLECTIONNÉ', 'SELECTED CLIP')), h('div', { class: 'kynedit-ti' }, h('b', {}, c.name), c.w ? h('small', {}, `${c.w}×${c.h}${c.fps ? ' · ' + fpsTxt(c.fps) : ''}`) : null),
      h('div', { class: 'kynedit-infos' }, c.w ? info(T('Résolution', 'Resolution'), `${c.w} × ${c.h}`) : null, info('Codec', c.codec), c.dur ? info(T('Durée', 'Duration'), tc(c.dur, c.fps || 25)) : null, info(T('Taille', 'Size'), bytes(c.size)), info(T('Modifié', 'Modified'), fdate(c.mtime))),
      h('div', { class: 'kynedit-sec' }, sh(T('NOTE', 'RATING')), stars(m.rating, 16, i => { m.rating = m.rating === i ? 0 : i; sfx.tick(); drawInspector(c); updateCardBadges(c); })),
      h('div', { class: 'kynedit-sec' }, sh(T('ÉTIQUETTE', 'LABEL')), ...[1, 2, 3].map(k => h('button', { class: 'kynedit-lab' + (m.color === k ? ' on' : ''), onclick: () => { m.color = m.color === k ? 0 : k; sfx.tick(); drawInspector(c); updateCardBadges(c); } }, h('i', { style: { background: LABELS[k] } }), [T('Validé', 'Approved'), T('À revoir', 'To review'), T('Rejeté', 'Rejected')][k - 1]))),
      h('div', { class: 'kynedit-sec' }, sh(T('MOTS-CLÉS', 'KEYWORDS')), h('div', { class: 'kynedit-tags' }, m.tags.map((tg, i) => h('button', { class: 'kynedit-tag', onclick: () => { m.tags.splice(i, 1); drawInspector(c); } }, tg, h('i', {}, '✕')))), tagIn),
      c.kind === 'video' ? h('div', { class: 'kynedit-sec' }, sh('EXPORT'), h('div', { class: 'kynedit-chips' }, PRESETS.map(([k, l]) => h('button', { class: S.preset === k ? 'on' : '', onclick: () => { S.preset = k; drawInspector(c); } }, l))),
        h('div', { class: 'kynedit-dirr' }, h('span', {}, OUT[S.outDir].split('/').pop()), link(T('Choisir…', 'Choose…'), () => { S.outDir = (S.outDir + 1) % OUT.length; drawInspector(c); })),
        note(m.subclips.length > 1 ? T(`Exporte les ${m.subclips.length} sous-clips`, `Exports the ${m.subclips.length} subclips`) : m.subclips.length === 1 ? T('Exporte le sous-clip', 'Exports the subclip') : T('Exporte le clip entier', 'Exports the whole clip')),
        S.lut ? chk(T(`Avec le LUT « ${S.lut} »`, `With LUT “${S.lut}”`), () => S.useLUT, v => { S.useLUT = v; drawInspector(c); }) : null, many > 1 ? note(T(`${many} clips sélectionnés`, `${many} clips selected`)) : null,
        h('button', { class: 'kynedit-btn pri full', onclick: () => queueSel() }, many > 1 ? T(`AJOUTER ${many} CLIPS À LA FILE`, `ADD ${many} CLIPS TO QUEUE`) : T('AJOUTER À LA FILE', 'ADD TO QUEUE')),
        S.queueNote ? h('div', { class: 'kynedit-qn' }, h('span', {}, S.queueNote), link(T('Voir les exports', 'View exports'), () => go('exports'))) : null,
        h('div', { class: 'kynedit-links' }, link(T('Ouvrir dans l’atelier', 'Open in the workshop'), () => { addAtelier(selClips()); go('atelier'); }), link(T('Renommer…', 'Rename…'), () => renameSheet()), link(T('Shotlist (CSV)', 'Shotlist (CSV)'), () => toastSay(T('Fichier créé : shotlist.csv', 'File created: shotlist.csv'))), link(T('Images des marqueurs', 'Marker stills'), () => toastSay(T(`${m.markers.length} image(s) enregistrée(s) dans ${OUT[S.outDir]}`, `${m.markers.length} still(s) saved in ${OUT[S.outDir]}`))))) : null,
      h('div', { class: 'kynedit-sec' }, sh(T('COMMENTAIRE', 'COMMENT')), h('textarea', { class: 'kynedit-area', rows: 3, 'aria-label': T('Commentaire', 'Comment'), value: m.note, oninput: e => { m.note = e.target.value; } }, m.note))));
  }
  function updateCardBadges(c) { const el = exp.list && exp.list.querySelector(`[data-id="${CSS.escape(c.id)}"]`); if (!el) return; const nw = card(c); if (S.grid) { el.replaceWith(nw); } }
  function queueSel() { const l = selClips().filter(c => c.kind === 'video'); if (!l.length) return toastSay(T('Seuls les clips vidéo s’exportent.', 'Only video clips can be exported.')); const preset = PRESETS.find(p => p[0] === S.preset)[1];
    l.forEach(c => { const m = meta(c), subs2 = m.subclips; if (subs2.length) subs2.forEach((s2, i) => addJob({ name: `${c.name} · ${s2.name}`, label: preset, dur: s2.tout - s2.tin, speed: S.preset === 'proRes422HQ' ? 6 : 9, out: outName(c, preset).replace('.', `_${i + 1}.`), raw: c.raw })); else addJob({ name: c.name, label: preset, dur: c.dur, speed: S.preset === 'proRes422HQ' ? 6 : 9, out: outName(c, preset), raw: c.raw }); });
    S.queueNote = T(`${l.length} clip(s) ajouté(s) à la file d’export.`, `${l.length} clip(s) added to the export queue.`); sfx.pop(); drawInspector(one()); }
  function renameSheet() { const st2 = { tpl: '{name}_{n}' }, pv = h('div', { class: 'kynedit-rpv' }), render = () => { pv.innerHTML = ''; selClips().slice(0, 6).forEach((c, i) => pv.append(h('div', {}, h('span', {}, c.name), h('em', {}, '→'), h('b', {}, st2.tpl.replace('{name}', c.name.replace(/\.[^.]+$/, '')).replace('{n}', pad(i + 1, 3)).replace('{reel}', 'A001').replace('{date}', '20261109').replace('{res}', c.h + 'p').replace('{fps}', c.fps).replace('{tc}', '00-00-00-00') + '.' + c.ext)))); };
    const f = field('', () => st2.tpl, v => { st2.tpl = v; render(); }); render(); sheet(T('Renommer les clips', 'Rename clips'), h('div', { class: 'kynedit-rn' }, f, note(T('Variables : {name} {n} {reel} {date} {res} {fps} {tc}', 'Variables: {name} {n} {reel} {date} {res} {fps} {tc}')), pv), [btn(T('ANNULER', 'CANCEL'), closeSheet, 'ter'), btn(T('RENOMMER', 'RENAME'), () => { closeSheet(); toastSay(T('Clips renommés.', 'Clips renamed.')); }, 'pri')], 560); }

  /* lecteur : image, chronologie, boutons, marqueurs et sous-clips */
  const tlEls = new Set();
  function viewer(p, o = {}) {
    const c = p.clip, el = h('div', { class: 'kynedit-vid' + (o.big ? ' big' : '') }), img = c && c.img ? h('img', { src: `assets/wallpapers/${c.img}.jpg`, alt: '', draggable: false }) : null;
    el.append(...[img ? h('div', { class: 'kynedit-vf' }, img) : h('p', { class: 'kynedit-novid' }, c && c.kind === 'audio' ? '♪' : ''), c && c.raw ? h('span', { class: 'kynedit-raw' }, 'RAW') : null, c && c.kind === 'video' ? h('span', { class: 'kynedit-lutb' + (S.lut ? '' : ' hid') }, 'LUT') : null].filter(Boolean));
    const upd2 = () => { if (!img) return; const f = p.dur ? p.t / p.dur : 0; img.style.transform = `scale(1.3) translateX(${(.5 - f) * 9}%)`; img.style.filter = S.lut ? 'contrast(1.12) saturate(1.25) hue-rotate(-6deg)' : ''; };
    upd2(); p.listeners.add(upd2); el._u = upd2; return el;
  }
  function timeline(p, o = {}) {
    const el = h('div', { class: 'kynedit-tl' + (o.trim ? ' trim' : ''), role: 'slider', 'aria-label': T('Chronologie', 'Timeline'), tabindex: 0 }), head = h('i', { class: 'kynedit-head' });
    const draw = () => {
      el.innerHTML = ''; const d = Math.max(p.dur, .001), m = p.clip ? meta(p.clip) : { markers: [], subclips: [] }, pc = x => (x / d * 100) + '%';
      if (o.trim) { (o.done ? o.done() : []).forEach(it => el.append(h('i', { class: 'kynedit-done', style: { left: pc(it.tin), width: Math.max(.3, (it.tout - it.tin) / d * 100) + '%' } }))); const a = p.markIn ?? 0, b = p.markOut ?? d; el.append(h('i', { class: 'kynedit-range', style: { left: pc(a), width: Math.max(.3, (b - a) / d * 100) + '%' } }), hdl('in', a), hdl('out', b)); }
      else { m.subclips.forEach(s2 => el.append(h('i', { class: 'kynedit-sub', style: { left: pc(s2.tin), width: Math.max(.3, (s2.tout - s2.tin) / d * 100) + '%' } }))); if (p.markIn != null) el.append(h('i', { class: 'kynedit-mk in', style: { left: pc(p.markIn) } })); if (p.markOut != null) el.append(h('i', { class: 'kynedit-mk in', style: { left: pc(p.markOut) } })); m.markers.forEach(mm => el.append(h('i', { class: 'kynedit-mk', style: { left: pc(mm.t) } }))); }
      el.append(head); head.style.left = pc(Math.min(p.t, d));
    };
    const hdl = (k, x) => { const hd = h('i', { class: 'kynedit-hd ' + k, style: { left: (x / Math.max(p.dur, .001) * 100) + '%' } }); hd.addEventListener('pointerdown', e => { e.stopPropagation(); hd.setPointerCapture(e.pointerId); const mv = ev => { const r = el.getBoundingClientRect(), v = clamp((ev.clientX - r.left) / r.width, 0, 1) * p.dur; if (k === 'in') p.markIn = Math.min(v, (p.markOut ?? p.dur) - .04); else p.markOut = Math.max(v, (p.markIn ?? 0) + .04); p.t = k === 'in' ? p.markIn : p.markOut; p.listeners.forEach(f => f()); }; const up = () => { hd.removeEventListener('pointermove', mv); hd.removeEventListener('pointerup', up); }; hd.addEventListener('pointermove', mv); hd.addEventListener('pointerup', up); }); return hd; };
    el.addEventListener('pointerdown', e => { if (!p.clip) return; el.setPointerCapture(e.pointerId); const seek = ev => { const r = el.getBoundingClientRect(); p.rate = 0; p.seek(clamp((ev.clientX - r.left) / r.width, 0, 1) * p.dur); }; seek(e); const up = () => { el.removeEventListener('pointermove', seek); el.removeEventListener('pointerup', up); }; el.addEventListener('pointermove', seek); el.addEventListener('pointerup', up); });
    draw(); const fast = () => { if (!el.isConnected) return p.listeners.delete(fast); head.style.left = (Math.min(p.t, Math.max(p.dur, .001)) / Math.max(p.dur, .001) * 100) + '%'; }; p.listeners.add(fast); el._redraw = draw; tlEls.add(el); return el;
  }
  function drawPlayer(c) {
    const box = exp.player, m = meta(c); box.innerHTML = ''; pl.listeners.clear(); tlEls.clear();
    const v = viewer(pl), tcEl = h('b', { class: 'kynedit-tc' }), rate = h('span', { class: 'kynedit-rate' }), io = h('span', { class: 'kynedit-io' }), tl = timeline(pl);
    const lists = h('div', { class: 'kynedit-lists' }), msg = h('div', { class: 'kynedit-xmsg' });
    const drawLists = () => { lists.innerHTML = ''; const mk2 = (title, rows) => h('div', { class: 'kynedit-ll' }, sh(title.toUpperCase()), h('div', { class: 'kynedit-lrows' }, rows)); lists.append(mk2(T('Marqueurs', 'Markers'), m.markers.map(mm => h('div', { class: 'kynedit-lr' }, h('button', { onclick: () => pl.seek(mm.t) }, `${tc(mm.t, pl.fps)}  ${mm.label}`), h('i', { onclick: () => { m.markers.splice(m.markers.indexOf(mm), 1); drawLists(); tl._redraw(); } }, '✕')))), mk2(T('Sous-clips', 'Subclips'), m.subclips.map(s2 => h('div', { class: 'kynedit-lr' }, h('button', { onclick: () => pl.seek(s2.tin) }, `${stc(s2.tin, pl.fps)} → ${stc(s2.tout, pl.fps)}  ${s2.name}`), h('i', { onclick: () => { m.subclips.splice(m.subclips.indexOf(s2), 1); drawLists(); tl._redraw(); } }, '✕'))))); };
    const upd = () => { tcEl.textContent = tc(pl.t, pl.fps); rate.textContent = pl.rate === 0 ? '■' : (pl.rate < 0 ? '◀ ' : '▶ ') + Math.abs(pl.rate) + '×'; io.textContent = `I ${pl.markIn != null ? tc(pl.markIn, pl.fps) : '—'}   O ${pl.markOut != null ? tc(pl.markOut, pl.fps) : '—'}`; };
    const full = () => { upd(); drawLists(); tl._redraw(); }; pl.listeners.add(upd); pl.listeners.add(() => { if (!lists.isConnected) return; }); pl._full = full;
    const sendBtns = ['RESOLVE', 'FINAL CUT PRO', 'PREMIERE PRO'].map((n, i) => btn(n, () => { sendNLE(i, msg); }, '', c.kind !== 'video'));
    box.append(h('div', { class: 'kynedit-pv' }, v), h('div', { class: 'kynedit-pc' }, h('div', { class: 'kynedit-pn' }, h('b', {}, c.name), h('button', { class: 'kynedit-x', 'aria-label': T('Fermer', 'Close'), onclick: () => { S.sel.clear(); updateSelMarks(); drawSelection(); } }, '✕')),
      h('div', { class: 'kynedit-tcr' }, tcEl, rate, h('span', { class: 'kynedit-gap' }), io), tl,
      h('div', { class: 'kynedit-pb' }, btn(T('MARQUEUR', 'MARKER'), () => { pl.marker(); full(); }), h('button', { class: 'sbtn act kynedit-act', onclick: () => { pl.subclip(); full(); }, disabled: c.kind !== 'video' }, T('CRÉER SOUS-CLIP', 'CREATE SUBCLIP')), btn(S.lut ? (S.lut.length > 12 ? S.lut.slice(0, 12) + '…' : S.lut) : 'LUT…', () => { if (!S.lut) { S.lut = 'Rec709_Warm'; sfx.pop(); } else menu([{ l: T('Sans LUT', 'No LUT'), fn: () => { S.lut = null; S.useLUT = false; refreshLUT(); } }], null); refreshLUT(); }, S.lut ? 'on' : ''), S.lut ? btn('✕', () => { S.lut = null; S.useLUT = false; refreshLUT(); }, 'sq') : null, h('span', { class: 'kynedit-gap' }), ...sendBtns),
      msg, lists)); upd(); drawLists(); pl.listeners.add(() => { });
    const refreshLUT = () => { drawPlayer(c); drawInspector(c); };
  }
  function sendNLE(i, msgEl) { const sel2 = selClips().filter(c => c.kind === 'video'); if (!sel2.length) return toastSay(T('Aucun clip vidéo à envoyer.', 'No video clip to send.')); const n = ['DaVinci Resolve', 'Final Cut Pro', 'Premiere Pro'][i], ext = i === 2 ? 'xml' : 'fcpxml', file = `kYNEDIT_${n.replace(/ /g, '')}.${ext}`;
    sfx.done(); const m = msgEl || exp.player.querySelector('.kynedit-xmsg'); if (m) { m.innerHTML = ''; m.append(h('span', {}, T('Fichier créé : ', 'File created: ') + file), btn(T('OUVRIR DANS ', 'OPEN IN ') + n.toUpperCase(), () => toastSay(T(`« ${file} » s’ouvrirait dans ${n}.`, `“${file}” would open in ${n}.`)), 'sm')); } else toastSay(T('Fichier créé : ', 'File created: ') + file); }

  /* ======================== Atelier ======================== */
  function addAtelier(list) { const v = list.filter(c => c.kind === 'video' && !at_has(c)); if (!v.length) return; const first = !S.at.clips.length; S.at.clips.push(...v); if (first || !at.clip) { S.at.idx = S.at.clips.length - v.length; at.open(S.at.clips[S.at.idx]); } }
  const at_has = c => S.at.clips.some(q => q.id === c.id);
  function atelierCur() { return S.at.clips[S.at.idx] || null; }
  const curTrim = () => { const c = atelierCur(); if (!c || at.clip !== c || !at.dur) return null; const a = at.markIn ?? 0, b = at.markOut ?? at.dur; if (b - a < .01) { S.at.msg = T('La sortie doit suivre l’entrée.', 'The out point must follow the in point.'); return null; } return { clip: c, tin: a, tout: b, fps: at.fps, id: Math.random() }; };
  function atOpen(i) { if (!S.at.clips[i]) return; S.at.idx = i; at.open(S.at.clips[i]); drawAtelier(); }
  function atGo(d) { const i = S.at.idx + d; if (S.at.clips[i]) atOpen(i); }
  function atAdd() { const it = curTrim(); if (!it) return drawAtelier(); S.at.items.push(it); S.at.msg = T(`${it.clip.name} ajouté à la liste.`, `${it.clip.name} added to the list.`); sfx.pop(); if (S.at.idx >= S.at.clips.length - 1) { at.markIn = null; at.markOut = null; drawAtelier(); } else atGo(1); }
  function atExport(list) { if (!list.length) return; const rep = S.at.replace;
    const go2 = () => { S.at.jobs = rep || !S.at.jobs.some(id => S.jobs.find(j => j.id === id && (j.state === 'running' || j.state === 'waiting'))) ? [] : S.at.jobs; list.forEach(it => { const m = it.clip; S.at.jobs.push(addJob({ name: `${m.name} · ${stc(it.tin, it.fps)} → ${stc(it.tout, it.fps)}`, label: T('Sans réencodage', 'No re-encode'), dur: it.tout - it.tin, speed: 40, out: m.name.replace(/(\.[^.]+)$/, `_trim$1`), raw: m.raw })); }); S.at.msg = T(`${list.length} passage(s) envoyé(s) à l’export.`, `${list.length} trim(s) sent to export.`); S.at.items = S.at.items.filter(q => !list.includes(q)); sfx.done(); drawAtelier(); };
    if (rep) confirmBox(T('Remplacer les fichiers d’origine ?', 'Replace the original files?'), T(`${list.length} fichier(s) d’origine seront remplacés définitivement par leur version élaguée. Cette opération est irréversible.`, `${list.length} original file(s) will be permanently replaced by their trimmed version. This can't be undone.`), go2, T('Remplacer', 'Replace')); else go2(); }
  function drawAtelier() {
    subs.clear(); content.innerHTML = ''; tlEls.clear(); at.listeners.clear(); const c = atelierCur();
    const view = h('div', { class: 'kynedit-aview' }), vh = c ? viewer(at, { big: true }) : null;
    view.append(c ? vh : h('p', { class: 'kynedit-aempty' }, T('Glissez des vidéos ici, ou envoyez-les depuis l’explorateur, pour les élaguer sans réencodage.', 'Drop videos here, or send them from the Explorer, to trim them without re-encoding.'), h('span', {}, link(T('Ajouter des clips d’exemple', 'Add sample clips'), () => { addAtelier(ALL.filter(q => q.vol === 'ssd' && q.kind === 'video' && !q.raw).slice(0, 4)); drawAtelier(); }))));
    if (c) { const tcB = h('b', { class: 'kynedit-atc' }); view.append(h('span', { class: 'kynedit-aname' }, `${S.at.idx + 1}/${S.at.clips.length}  ${c.name}`), tcB); const u = () => { tcB.textContent = tc(at.t, at.fps); }; u(); at.listeners.add(u); }
    const done = () => S.at.items.filter(i => i.clip === c), tl = timeline(at, { trim: true, done }), ro = (l, v, on) => h('div', { class: 'kynedit-ro' + (on ? ' on' : '') }, h('small', {}, l.toUpperCase()), h('b', {}, v));
    const roIn = h('b', {}), roOut = h('b', {}), roDur = h('b', {}), msgEl = h('span', { class: 'kynedit-amsg' }, S.at.msg);
    const upd = () => { const a = at.markIn ?? 0, b = at.markOut ?? at.dur; roIn.textContent = at.markIn != null ? tc(at.markIn, at.fps) : '—'; roOut.textContent = at.markOut != null ? tc(at.markOut, at.fps) : '—'; roDur.textContent = at.dur ? tc(Math.max(0, b - a), at.fps) : '—'; roIn.parentElement && roIn.parentElement.classList.toggle('on', at.markIn != null); roOut.parentElement && roOut.parentElement.classList.toggle('on', at.markOut != null); tl._redraw(); playB.textContent = at.rate === 0 ? '▶' : '❚❚'; };
    const kb = (k, main) => h('em', { class: 'kynedit-kb' + (main ? ' m' : '') }, k);
    const tool = (label, key, fn, o = {}) => h('button', { class: 'kynedit-tool' + (o.main ? ' main' : ''), onclick: fn, title: o.help || '' }, h('span', {}, label), key ? kb(key, o.main) : null);
    const playB = h('span', {}, at.rate === 0 ? '▶' : '❚❚'); const playBtn = h('button', { class: 'kynedit-tool', onclick: () => at.toggle(), title: T('Lecture / pause', 'Play / pause') }, playB, kb(T('Espace', 'Space')));
    const ioRow = h('div', { class: 'kynedit-ros' }, h('div', { class: 'kynedit-ro' }, h('small', {}, T('ENTRÉE', 'IN')), roIn), h('div', { class: 'kynedit-ro' }, h('small', {}, T('SORTIE', 'OUT')), roOut), h('div', { class: 'kynedit-ro on' }, h('small', {}, T('DURÉE', 'DURATION')), roDur), h('span', { class: 'kynedit-gap' }), msgEl, S.at.last ? link(T('Afficher dans le Finder', 'Show in Finder'), () => toastSay(S.at.last)) : null);
    const tools = h('div', { class: 'kynedit-tools' }, tool('◀', '↑', () => atGo(-1), { help: T('Clip précédent', 'Previous clip') }), playBtn, tool('▶', '↓', () => atGo(1), { help: T('Clip suivant', 'Next clip') }), h('i', { class: 'kynedit-vs' }), tool(T('ENTRÉE', 'IN'), 'I', () => { at.markIn = at.t; at.listeners.forEach(f => f()); }), tool(T('SORTIE', 'OUT'), 'O', () => { at.markOut = at.t; at.listeners.forEach(f => f()); }), tool(T('EFFACER I/O', 'CLEAR I/O'), null, () => { at.markIn = null; at.markOut = null; at.listeners.forEach(f => f()); }), h('i', { class: 'kynedit-vs' }),
      tool(T('IMAGE', 'STILL'), null, () => { if (!c) return; S.at.msg = T(`Image enregistrée : ${c.name.replace(/\.[^.]+$/, '')}_${tc(at.t, at.fps).replace(/:/g, '-')}.jpg`, `Still saved: ${c.name.replace(/\.[^.]+$/, '')}_${tc(at.t, at.fps).replace(/:/g, '-')}.jpg`); S.at.last = OUT[S.outDir]; sfx.tick(); drawAtelier(); }), tool(T('AUDIO SEUL', 'AUDIO ONLY'), null, () => { if (!c) return; S.at.msg = T(`Audio enregistré : ${c.name.replace(/\.[^.]+$/, '')}_audio.mov`, `Audio saved: ${c.name.replace(/\.[^.]+$/, '')}_audio.mov`); S.at.last = OUT[S.outDir]; sfx.tick(); drawAtelier(); }), h('span', { class: 'kynedit-gap' }), tool(T('AJOUTER', 'ADD'), '↩', () => atAdd()), h('button', { class: 'sbtn act kynedit-tool main', onclick: () => { const it = curTrim(); if (it) { atExport([it]); atGo(1); } else drawAtelier(); }, disabled: !c }, h('span', {}, T('EXPORTER', 'EXPORT')), kb('⌘S', true)));
    at.listeners.add(upd); upd();
    const left = h('div', { class: 'kynedit-aleft' }, view, h('div', { class: 'kynedit-atools' }, tl, ioRow, tools));
    /* panneau de droite */
    const jobs = S.at.jobs.map(id => S.jobs.find(j => j.id === id)).filter(Boolean), running = jobs.some(j => j.state === 'running' || j.state === 'waiting'), pr = jobs.length ? jobs.reduce((a, j) => a + (j.state === 'done' ? 1 : j.state === 'running' ? j.progress : 0), 0) / jobs.length : 0;
    const clipsList = h('div', { class: 'kynedit-aclips' }, S.at.clips.map((q, i) => h('div', { class: 'kynedit-mini' + (i === S.at.idx ? ' on' : ''), onclick: () => atOpen(i) }, h('img', { src: `assets/wallpapers/thumbs/${q.img}.jpg`, alt: '' }), h('span', {}, h('b', {}, q.name), h('small', {}, dur(q.dur))), S.at.items.filter(it => it.clip === q).length ? h('em', {}, `✓ ${S.at.items.filter(it => it.clip === q).length}`) : null, h('i', { onclick: e => { e.stopPropagation(); S.at.clips.splice(i, 1); S.at.items = S.at.items.filter(it => it.clip !== q); if (!S.at.clips.length) at.close(); else if (S.at.idx >= S.at.clips.length) S.at.idx = S.at.clips.length - 1, at.open(S.at.clips[S.at.idx]); drawAtelier(); } }, '✕'))));
    const prog = h('div', { class: 'kynedit-prg' }), progU = () => { prog.innerHTML = ''; const js = S.at.jobs.map(id => S.jobs.find(j => j.id === id)).filter(Boolean); if (!js.length) return; const run = js.some(j => j.state === 'running' || j.state === 'waiting'), fail = js.filter(j => j.state === 'failed').length, dn = js.filter(j => j.state === 'done').length, p2 = js.reduce((a, j) => a + (j.state === 'done' ? 1 : j.state === 'running' ? j.progress : 0), 0) / js.length;
      prog.append(h('div', { class: 'kynedit-prh' }, h('b', { class: run ? '' : fail ? 'dg' : 'ok' }, run ? T('Export en cours…', 'Exporting…') : fail ? T(`${fail} en erreur`, `${fail} failed`) : T('Export terminé', 'Export finished')), h('span', {}, `${dn}/${js.length}  ·  ${Math.round(p2 * 100)} %`)), h('div', { class: 'kynedit-bar6' }, h('i', { class: run ? '' : fail ? 'dg' : 'ok', style: { width: p2 * 100 + '%' } }))); if (!run && dn) prog.append(link(T('Afficher dans le Finder', 'Show in Finder'), () => toastSay(OUT[S.outDir]))); }; progU(); subs.add(progU);
    const side = h('aside', { class: 'kynedit-aside' }, h('div', { class: 'kynedit-ash' }, h('span', {}, T('CLIPS', 'CLIPS')), h('span', { class: 'kynedit-gap' }), S.sel.size ? link(T(`Ajouter la sélection (${S.sel.size})`, `Add selection (${S.sel.size})`), () => { addAtelier(selClips()); drawAtelier(); }) : null, S.at.clips.length ? link(T('Tout ajouter entier', 'Add all whole'), () => { S.at.clips.forEach(q => { if (!S.at.items.some(i => i.clip === q)) S.at.items.push({ clip: q, tin: 0, tout: q.dur, fps: q.fps, id: Math.random() }); }); S.at.msg = T(`${S.at.clips.length} clip(s) entier(s) ajouté(s) à la liste.`, `${S.at.clips.length} whole clip(s) added to the list.`); drawAtelier(); }) : null), clipsList,
      h('div', { class: 'kynedit-ash' }, h('span', {}, (T('LISTE D’EXPORT', 'EXPORT LIST') + (S.at.items.length ? ' · ' + S.at.items.length : ''))), h('span', { class: 'kynedit-gap' }), S.at.items.length ? link(T('Vider la liste', 'Clear list'), () => { S.at.items = []; drawAtelier(); }) : null),
      h('div', { class: 'kynedit-alist' }, S.at.items.length ? S.at.items.map(it => h('div', { class: 'kynedit-ai' }, h('span', {}, h('b', {}, it.clip.name), h('small', {}, `${stc(it.tin, it.fps)} → ${stc(it.tout, it.fps)}  ·  ${stc(it.tout - it.tin, it.fps)}`)), h('i', { onclick: () => { S.at.items = S.at.items.filter(q => q !== it); drawAtelier(); } }, '✕'))) : h('p', { class: 'kynedit-note c' }, T('La liste est vide. Posez une entrée (I) et une sortie (O) sur un clip, puis ↩ pour y ajouter le passage.', 'The list is empty. Set an in (I) and an out (O) on a clip, then press ↩ to add the trim here.'))),
      h('div', { class: 'kynedit-afoot' }, prog, h('div', { class: 'kynedit-dirr' }, h('span', {}, T('Dossier', 'Folder')), h('b', { class: S.at.replace ? 'dg' : '' }, S.at.replace ? T('Sur place (remplacement)', 'In place (replacing)') : OUT[S.outDir].split('/').pop()), S.at.replace ? null : link(T('Choisir…', 'Choose…'), () => { S.outDir = (S.outDir + 1) % OUT.length; drawAtelier(); })), chk(T('Remplacer les fichiers d’origine', 'Replace the original files'), () => S.at.replace, v => { S.at.replace = v; drawAtelier(); }),
        S.at.replace ? h('p', { class: 'kynedit-note dg' }, T('Chaque original élagué sera écrasé par sa version raccourcie. Une confirmation est demandée.', 'Each trimmed original will be overwritten by its shortened version. A confirmation is asked.')) : null, note(T('Sans réencodage : le début se cale sur l’image clé précédente.', 'No re-encoding: the start snaps to the previous keyframe.')),
        h('button', { class: 'kynedit-tool' + (S.at.items.length ? ' pri' : ''), onclick: () => atExport(S.at.items.slice()), disabled: !S.at.items.length }, h('span', {}, T(`EXPORTER LA LISTE (${S.at.items.length})`, `EXPORT LIST (${S.at.items.length})`)), kb('⇧⌘S'))));
    content.append(h('div', { class: 'kynedit-atelier' }, left, side));
  }

  /* ======================== Convertir ======================== */
  function addConvert(list) { const v = list.filter(c => c.kind === 'video' && !S.conv.clips.some(q => q.id === c.id)); S.conv.clips.push(...v); }
  const cvSummary = () => { const s = S.conv.set; return `${s.codec} · ${s.wrap} · ${s.size ? SIZES.find(z => z[0] === s.size)[1] : T('Taille d’origine', 'Source size')} · ${s.fps ? fpsTxt(s.fps) : T('Cadence d’origine', 'Source frame rate')}`; };
  function drawConvert() {
    subs.clear(); const cv = S.conv, s = cv.set; content.innerHTML = '';
    const src = h('div', { class: 'kynedit-csrc' });
    if (!cv.clips.length) src.append(h('div', { class: 'kynedit-cdrop' }, h('p', {}, T('Glissez des clips ou des dossiers ici, ou ajoutez la sélection de l’explorateur.', 'Drop clips or folders here, or add the Explorer selection.')), S.sel.size ? btn(T(`AJOUTER LA SÉLECTION (${S.sel.size})`, `ADD SELECTION (${S.sel.size})`), () => { addConvert(selClips()); drawConvert(); }) : null, link(T('Ajouter des clips d’exemple', 'Add sample clips'), () => { addConvert(ALL.filter(q => q.vol === 'card').slice(0, 5)); drawConvert(); })));
    else src.append(h('div', { class: 'kynedit-ccols' }, h('span', {}, T('NOM', 'NAME')), h('span', {}, T('DURÉE', 'DURATION')), h('span', {}, T('RÉSOLUTION', 'RESOLUTION')), h('span', {}, 'CODEC'), h('i', {})), h('div', { class: 'kynedit-crows' }, cv.clips.map(c => h('div', { class: 'kynedit-crow' }, h('img', { src: `assets/wallpapers/thumbs/${c.img}.jpg`, alt: '' }), h('span', {}, h('b', {}, c.name), h('small', {}, '/Volumes/' + VOLUMES.find(v => v.id === c.vol).name)), h('span', {}, dur(c.dur)), h('span', {}, `${c.w}×${c.h}`), h('span', {}, c.codec), h('i', { onclick: () => { cv.clips = cv.clips.filter(q => q !== c); drawConvert(); } }, '✕')))));
    const setU = (patch, redraw = true) => { Object.assign(s, patch); cv.preset = null; if (redraw) drawConvert(); };
    const secF = (key, title, body) => h('div', { class: 'kynedit-fs' }, h('button', { class: 'kynedit-fh', 'aria-expanded': !!cv.open[key], onclick: () => { cv.open[key] = !cv.open[key]; drawConvert(); } }, h('i', { html: svg(cv.open[key] ? '<path d="m6 9 6 6 6-6"/>' : '<path d="m9 6 6 6-6 6"/>', 10) }), h('b', {}, title)), cv.open[key] ? h('div', { class: 'kynedit-fb' }, body()) : null);
    const allP = CP.flatMap(([, l]) => l), curP = cv.preset || (allP.find(([, o]) => Object.entries(o).every(([k, v]) => JSON.stringify(s[{ tpl: 'tpl', burn: 'burn' }[k] || k]) === JSON.stringify(v) || k === 'log' && s.log === v)) || [])[0] || T('Personnalisé', 'Custom');
    const presetBlock = h('div', { class: 'kynedit-pres' }, sh(T('PRÉRÉGLAGES', 'PRESETS')), dd([], () => curP, () => {}, x => x, 'kynedit-ddp'), h('div', { class: 'kynedit-psave' }, field(T('Nom du préréglage', 'Preset name'), () => cv.newName, v => { cv.newName = v; }), btn(T('ENREGISTRER', 'SAVE'), () => { const n = cv.newName.trim(); if (!n) return; cv.mine.push([n, { ...s }]); cv.preset = n; cv.newName = ''; sfx.pop(); drawConvert(); })));
    presetBlock.querySelector('.kynedit-dd').onclick = e => (popEl ? closeMenu() : menu([...(cv.mine.length ? [{ head: T('Mes préréglages', 'My presets') }, ...cv.mine.map(([n, o]) => ({ l: n, fn: () => { Object.assign(s, o); cv.preset = n; drawConvert(); } }))] : []), ...CP.flatMap(([g, l]) => [{ head: g }, ...l.map(([n, o]) => ({ l: n, on: n === curP, fn: () => { Object.assign(s, { codec: 'ProRes 422 HQ', wrap: 'MOV', size: '', pad: false, fps: 0, log: 0, burn: [], tpl: '{name}_{codec}', ale: false }, o); cv.preset = n; drawConvert(); } }))])], e.currentTarget));
    const settings = h('div', { class: 'kynedit-cset' }, presetBlock,
      secF('format', T('Format', 'Format'), () => [rowL(T('Codec', 'Codec'), dd(CODECS, () => s.codec, v => setU({ codec: v, wrap: v.startsWith('Pro') ? 'MOV' : v.startsWith('DNx') ? 'MOV' : 'MP4' }))), rowL(T('Conteneur', 'Wrapper'), dd(s.codec.startsWith('Pro') ? ['MOV'] : s.codec.startsWith('DNx') ? ['MOV', 'MXF OP1a', 'MXF OP-Atom'] : ['MP4', 'MOV'], () => s.wrap, v => setU({ wrap: v }))),
        rowL(T('Taille', 'Size'), dd(SIZES, () => SIZES.find(z => z[0] === s.size), v => setU({ size: v[0] }), z => z[1])), s.size ? chk(T('Bandes noires pour remplir l’image', 'Black bars to fill the frame'), () => s.pad, v => setU({ pad: v })) : null, rowL(T('Cadence', 'Frame rate'), dd(RATES, () => s.fps, v => setU({ fps: v }), f => f === 0 ? T('Cadence d’origine', 'Source frame rate') : fpsTxt(f))),
        s.codec.startsWith('DNxHD') ? note(T('DNxHD : 1080p uniquement, cadences de 23,976 à 60 i/s.', 'DNxHD: 1080p only, frame rates from 23.976 to 60 fps.')) : null, !s.size && !s.fps && !s.log && !s.burn.length && !s.codec.startsWith('Rew') ? note(T('Sans retouche d’image, la conversion passe directement du décodeur à l’encodeur matériel.', 'With no picture changes, conversion goes straight from the decoder to the hardware encoder.')) : null]),
      secF('color', T('Couleur', 'Color'), () => [rowL(T('Log → Rec.709', 'Log → Rec.709'), dd(LOGS.map((l, i) => i), () => s.log, v => setU({ log: v }), i => LOGS[i])), rowL('LUT', h('div', { class: 'kynedit-fch' }, h('span', {}, s.lut || T('Aucun', 'None')), link(T('Choisir…', 'Choose…'), () => setU({ lut: 'Rec709_Warm.cube' })), s.lut ? link('✕', () => setU({ lut: null })) : null))]),
      secF('audio', T('Audio', 'Audio'), () => [rowL(T('Audio', 'Audio'), dd(['all', 'first', 'none'], () => s.audio, v => setU({ audio: v }), v => ({ all: T('Toutes les pistes', 'All tracks'), first: T('Première piste', 'First track'), none: T('Sans audio', 'No audio') })[v])), s.audio !== 'none' ? rowL(T('Canaux', 'Channels'), dd(['keep', 'stereo', 'mono'], () => s.ch, v => setU({ ch: v }), v => ({ keep: T('Canaux d’origine', 'Source channels'), stereo: T('Stéréo', 'Stereo'), mono: 'Mono' })[v])) : null]),
      secF('burn', T('Incrustations', 'Burn-ins'), () => [...s.burn.map((b, i) => h('div', { class: 'kynedit-burn' }, dd(BURN_F.map(x => x[0]), () => b[0], v => { b[0] = v; cv.preset = null; drawConvert(); }, v => BURN_F.find(x => x[0] === v)[1]), dd(POS.map(x => x[0]), () => b[1], v => { b[1] = v; cv.preset = null; drawConvert(); }, v => POS.find(x => x[0] === v)[1]), link('✕', () => { s.burn.splice(i, 1); cv.preset = null; drawConvert(); }))), link(T('Ajouter une incrustation', 'Add a burn-in'), () => setU({ burn: [...s.burn, ['tc', 'bl']] })),
        rowL(T('Logo PNG', 'PNG logo'), h('div', { class: 'kynedit-fch' }, h('span', {}, s.logo ? 'logo.png' : T('Aucun', 'None')), link(T('Choisir…', 'Choose…'), () => setU({ logo: true })), s.logo ? link('✕', () => setU({ logo: false })) : null))]),
      secF('output', T('Sortie', 'Output'), () => [rowL(T('Nom du fichier', 'File name'), field('', () => s.tpl, v => { s.tpl = v; cv.preset = null; })), note(T('Variables : {name} {reel} {date} {codec} {res} {fps} {tc}', 'Variables: {name} {reel} {date} {codec} {res} {fps} {tc}')), rowL(T('Dossier', 'Folder'), h('div', { class: 'kynedit-fch' }, h('span', {}, OUT[S.outDir].split('/').pop()), link(T('Choisir…', 'Choose…'), () => { S.outDir = (S.outDir + 1) % OUT.length; drawConvert(); }))),
        chk(T('Recréer l’arborescence des dossiers sources', 'Recreate the source folder structure'), () => s.recreate, v => setU({ recreate: v })), chk(T('Exporter un fichier ALE (Avid)', 'Export an ALE file (Avid)'), () => s.ale, v => setU({ ale: v })), chk(T('Assembler tous les clips en un seul fichier', 'Join all clips into a single file'), () => s.assemble, v => setU({ assemble: v })), cv.clips.some(c => c.raw) ? note(T('Clips RAW : image seule, sans audio.', 'RAW clips: picture only, no audio.')) : null]));
    const bottom = h('div', { class: 'kynedit-cbar' }, h('span', { class: 'kynedit-csum' }, cvSummary()), h('span', { class: 'kynedit-gap' }), h('span', { class: 'kynedit-cprog' }), cv.clips.length ? link(T('Vider la liste', 'Clear list'), () => { cv.clips = []; drawConvert(); }) : null, S.sel.size && cv.clips.length ? btn(T(`AJOUTER LA SÉLECTION (${S.sel.size})`, `ADD SELECTION (${S.sel.size})`), () => { addConvert(selClips()); drawConvert(); }) : null,
      h('button', { class: 'sbtn act kynedit-run', disabled: !cv.clips.length, onclick: () => runConvert() }, T(`CONVERTIR ${cv.clips.length} CLIP(S)`, `CONVERT ${cv.clips.length} CLIP(S)`)));
    const cprog = bottom.querySelector('.kynedit-cprog'), pU = () => { cprog.innerHTML = ''; const js = cv.jobs.map(id => S.jobs.find(j => j.id === id)).filter(Boolean); if (!js.length) { if (cv.msg) cprog.append(h('span', { class: 'kynedit-mut' }, cv.msg)); return; }
      const run = js.some(j => j.state === 'running' || j.state === 'waiting'), fail = js.filter(j => j.state === 'failed').length, dn = js.filter(j => j.state === 'done').length, p2 = js.reduce((a, j) => a + (j.state === 'done' ? 1 : j.state === 'running' ? j.progress : 0), 0) / js.length;
      cprog.append(...[h('b', { class: run ? 'kynedit-mut' : fail ? 'dg' : 'ok' }, run ? T('Export en cours…', 'Exporting…') : fail ? T(`${fail} en erreur`, `${fail} failed`) : T('Export terminé', 'Export finished')), h('div', { class: 'kynedit-bar6 w' }, h('i', { class: run ? '' : fail ? 'dg' : 'ok', style: { width: p2 * 100 + '%' } })), h('span', { class: 'kynedit-mut mono' }, `${dn}/${js.length} · ${Math.round(p2 * 100)} %`), !run && dn ? link(T('Afficher dans le Finder', 'Show in Finder'), () => toastSay(OUT[S.outDir])) : null].filter(Boolean)); }; pU(); subs.add(pU);
    content.append(h('div', { class: 'kynedit-convert' }, h('div', { class: 'kynedit-cmain' }, src, settings), bottom));
  }
  function runConvert() { const cv = S.conv, s = cv.set; if (!cv.clips.length) return; const before = S.jobs.length; const run = cv.jobs.some(id => S.jobs.find(j => j.id === id && (j.state === 'running' || j.state === 'waiting'))); if (!run) cv.jobs = [];
    const fast = s.codec.startsWith('Rew') ? 40 : s.codec.startsWith('Pro') ? 7 : s.codec.startsWith('H') ? 10 : 5, label = `${s.codec} · ${s.wrap}`;
    if (s.assemble) cv.jobs.push(addJob({ name: T(`Assemblage de ${cv.clips.length} clips`, `Assembly of ${cv.clips.length} clips`), label, dur: cv.clips.reduce((a, c) => a + c.dur, 0), speed: fast, out: 'assemblage.mov' })); else cv.clips.forEach(c => cv.jobs.push(addJob({ name: c.name, label, dur: c.dur, speed: fast, out: s.tpl.replace('{name}', c.name.replace(/\.[^.]+$/, '')).replace('{codec}', s.codec.replace(/[ .()]/g, '')).replace('{reel}', 'A001').replace('{date}', '20261109').replace('{res}', c.h + 'p').replace('{fps}', c.fps).replace('{tc}', '00-00-00-00') + '.' + (s.wrap.startsWith('MXF') ? 'mxf' : s.wrap === 'MP4' ? 'mp4' : 'mov'), raw: c.raw })));
    cv.msg = T(`${S.jobs.length - before} tâche(s) ajoutée(s) à la file.`, `${S.jobs.length - before} job(s) added to the queue.`); sfx.click(); drawConvert(); }

  /* ======================== Exports ======================== */
  function drawExports() {
    subs.clear(); content.innerHTML = ''; const finished = S.jobs.some(j => ['done', 'failed', 'cancelled'].includes(j.state)), box = h('div', { class: 'kynedit-exps' });
    const head = h('div', { class: 'kynedit-eh' }, h('b', {}, T('Exports', 'Exports')), h('span', { class: 'kynedit-gap' }), finished ? btn(T('VIDER LES TERMINÉS', 'CLEAR FINISHED'), () => { S.jobs = S.jobs.filter(j => !['done', 'failed', 'cancelled'].includes(j.state)); drawTabs(); drawExports(); }) : null);
    const rows = h('div', { class: 'kynedit-erows' }); const refs = new Map();
    const stateTxt = j => T({ waiting: 'En attente', running: 'En cours', done: 'Terminé', failed: 'Échec', cancelled: 'Annulé' }[j.state], { waiting: 'Waiting', running: 'Running', done: 'Done', failed: 'Failed', cancelled: 'Cancelled' }[j.state]);
    S.jobs.forEach(j => { const bar2 = h('i', {}), st1 = h('b', {}), st2 = h('small', {}), acts = h('div', { class: 'kynedit-eacts' }), det = h('small', {});
      const row = h('div', { class: 'kynedit-erow' }, h('div', { class: 'kynedit-en' }, h('b', {}, j.name), det), h('span', { class: 'kynedit-el' }, j.label), h('div', { class: 'kynedit-bar6 e' }, bar2), h('div', { class: 'kynedit-es' }, st1, st2), acts);
      const u = () => { bar2.style.width = j.progress * 100 + '%'; bar2.className = j.state === 'done' ? 'ok' : j.state === 'failed' ? 'dg' : ''; st1.textContent = stateTxt(j); st1.className = j.state; st2.textContent = j.state === 'done' && j.elapsed ? T(`${(j.seconds / j.elapsed).toFixed(1).replace('.', ',')}× temps réel`, `${(j.seconds / j.elapsed).toFixed(1)}× real time`) : j.state === 'running' ? Math.round(j.progress * 100) + ' %' : ''; det.textContent = j.error || (j.state === 'done' ? j.out : j.label); det.className = j.state === 'failed' ? 'dg' : '';
        acts.innerHTML = ''; if (j.state === 'failed' || j.state === 'cancelled') acts.append(h('button', { 'aria-label': T('Relancer', 'Retry'), title: T('Relancer', 'Retry'), onclick: () => { j.state = 'waiting'; j.progress = 0; j.error = null; j.fail = 0; pump(); ensureLoop(); drawTabs(); } , html: svg('<path d="M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7"/>', 14) })); if (j.state === 'done') acts.append(h('button', { 'aria-label': T('Afficher dans le Finder', 'Show in Finder'), title: T('Afficher dans le Finder', 'Show in Finder'), onclick: () => toastSay(OUT[S.outDir] + '/' + j.out), html: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 14) })); acts.append(h('button', { 'aria-label': T('Retirer', 'Remove'), onclick: () => { S.jobs = S.jobs.filter(q => q !== j); drawTabs(); drawExports(); }, html: svg('<path d="m6 6 12 12M18 6 6 18"/>', 12) })); };
      u(); refs.set(j, u); rows.append(row); });
    let lastState = S.jobs.map(j => j.state).join(); const tick = () => { if (!alive() || S.tab !== 'exports') return; refs.forEach(u => u()); const st = S.jobs.map(j => j.state).join(); if (st !== lastState) { lastState = st; drawTabs(); } }; subs.add(tick);
    box.append(head, S.jobs.length ? rows : h('p', { class: 'kynedit-eempty' }, T('Aucun export pour l’instant.', 'No exports yet.'))); content.append(box);
  }

  /* ======================== Copier (offload) ======================== */
  const DEST = ['/Volumes/SSD Editing/RUSHES', '/Volumes/Archive RAID/Backup', '/Volumes/Backup A/2026', '/Volumes/Backup B/2026'];
  function drawOffload() {
    const o = S.offload; content.innerHTML = ''; const box = h('div', { class: 'kynedit-off' });
    const card = (title, ...kids) => h('section', { class: 'kynedit-card2' }, sh(title.toUpperCase()), ...kids);
    box.append(card(T('Source (carte caméra ou dossier)', 'Source (camera card or folder)'), h('div', { class: 'kynedit-dirr big' }, h('span', { class: 'mono' }, o.src), link(T('Choisir…', 'Choose…'), () => { const L = ['/Volumes/RUSHES_FX6', '/Volumes/A7S3_CARD1/PRIVATE/M4ROOT', '/Volumes/BMPCC_SSD']; o.src = L[(L.indexOf(o.src) + 1) % L.length]; drawOffload(); }))),
      card(T('Destinations (jusqu’à 4)', 'Destinations (up to 4)'), ...o.dests.map(d => h('div', { class: 'kynedit-dirr big' }, h('span', { class: 'mono' }, d), link('✕', () => { o.dests = o.dests.filter(q => q !== d); drawOffload(); }))), o.dests.length < 4 ? link(T('AJOUTER UNE DESTINATION', 'ADD A DESTINATION'), () => { o.dests.push(DEST.find(d => !o.dests.includes(d))); drawOffload(); }) : null),
      card(T('Options', 'Options'), chk(T('Vérifier chaque copie (somme MD5)', 'Verify every copy (MD5 checksum)'), () => o.verify, v => { o.verify = v; drawOffload(); }), chk(T('Copie incrémentale : ignorer les fichiers déjà copiés', 'Incremental copy: skip files already copied'), () => o.incr, v => { o.incr = v; drawOffload(); }), chk(T('Écrire une liste de hachage (MHL)', 'Write a media hash list (MHL)'), () => o.mhl, v => { o.mhl = v; drawOffload(); })));
    const prog = h('div', { class: 'kynedit-oprog' }), fin = h('div', { class: 'kynedit-ofin' }), cur = h('p', { class: 'kynedit-ocur' });
    const pU = () => { prog.innerHTML = ''; if (o.total > 0) prog.append(h('div', { class: 'kynedit-bar6 w2' }, h('i', { style: { width: (o.bytesTotal ? o.bytesDone / o.bytesTotal * 100 : 0) + '%' } })), h('span', { class: 'kynedit-mut' }, T(`${o.done} / ${o.total} fichiers`, `${o.done} / ${o.total} files`))); cur.textContent = o.cur; };
    const run = h('div', { class: 'kynedit-orun' }, prog, h('span', { class: 'kynedit-gap' }), o.running ? btn(T('ANNULER', 'CANCEL'), () => { o.cancel = true; }) : h('button', { class: 'sbtn act', disabled: !o.dests.length, onclick: () => startOffload() }, T('COPIER', 'COPY')));
    box.append(run, cur, fin);
    const finU = () => { fin.innerHTML = ''; if (o.finished) fin.append(h('b', { class: 'ok' }, o.verify ? T('Copie terminée, toutes les copies sont vérifiées.', 'Copy finished, all copies verified.') : T('Copie terminée.', 'Copy finished.')), link(T('Afficher dans le Finder', 'Show in Finder'), () => toastSay(o.dests[0])), h('div', { class: 'kynedit-ores' }, o.results.slice(-6).map(r => h('div', {}, h('span', {}, r[0]), h('em', {}, r[1]))))); };
    pU(); finU(); o.pU = () => { pU(); finU(); }; content.append(h('div', { class: 'kynedit-scroll p' }, box));
  }
  async function startOffload() {
    const o = S.offload; if (o.running || !o.dests.length) return; const files = VOLUMES[1].clips.slice(0, 12).map(c => ({ n: c.name, b: c.size })); o.running = true; o.cancel = false; o.finished = false; o.results = []; o.total = files.length * (o.dests.length > 1 ? 1 : 1); o.done = 0; o.bytesTotal = files.reduce((a, f) => a + f.b, 0) * o.dests.length; o.bytesDone = 0; drawOffload(); sfx.click();
    for (const f of files) { if (o.cancel || !alive() || S.tab !== 'offload' && !alive()) break; o.cur = f.n; const steps = reduced() ? 1 : 8; for (let i = 0; i < steps; i++) { await wait(reduced() ? 0 : 40); if (!alive()) return; o.bytesDone += f.b * o.dests.length / steps; S.tab === 'offload' && o.pU && o.pU(); } o.done++; o.results.push([f.n, o.verify ? T('copié · vérifié', 'copied · verified') : T('copié', 'copied')]); sfx.tick(); S.tab === 'offload' && o.pU && o.pU(); }
    o.running = false; o.finished = !o.cancel; o.cur = ''; if (!o.cancel) sfx.done(); if (S.tab === 'offload') drawOffload();
  }

  /* ======================== Performances ======================== */
  function drawPerf() {
    const p = S.perf; content.innerHTML = ''; const kv = (k, v, cls = '') => h('div', { class: 'kynedit-kv' }, h('span', {}, k), h('b', { class: cls }, v)); const card = (title, ...k) => h('section', { class: 'kynedit-card2' }, sh(title.toUpperCase()), ...k);
    const bench = h('div', { class: 'kynedit-bench' });
    const drawB = () => { bench.innerHTML = ''; bench.append(note(T('Encodage 4K synthétique avec 1, 2 puis 4 sessions. Aucun fichier n’est écrit.', 'Synthetic 4K encoding with 1, 2 then 4 sessions. No file is written.'))); if (!p.rows.length && !p.running) bench.append(h('p', { class: 'kynedit-mut' }, T('Pas encore mesuré sur cette machine.', 'Not measured on this machine yet.')));
      if (p.rows.length) bench.append(h('div', { class: 'kynedit-btab' }, h('div', { class: 'kynedit-bh' }, [T('CODEC', 'CODEC'), T('SESSIONS', 'SESSIONS'), T('IMAGES/S', 'FRAMES/S'), ''].map(x => h('span', {}, x))), ...p.rows.map(r => h('div', {}, h('b', {}, r[0]), h('span', {}, r[1]), h('b', { class: 'mono' }, Math.round(r[2])), h('span', { class: r[3] ? 'ok' : 'wn' }, r[3] ? T('Matériel', 'Hardware') : T('Logiciel', 'Software')))), ...Object.entries(p.best).map(([k, v]) => h('div', { class: 'kynedit-best' }, `${k} · ` + T(`Optimal : ${v} en parallèle`, `Best: ${v} in parallel`)))));
      bench.append(h('div', {}, p.running ? h('button', { class: 'kynedit-btn', disabled: true }, T('Mesure en cours…', 'Measuring…')) : h('button', { class: 'sbtn act', onclick: () => runBench() }, T('LANCER LE BANC D’ESSAI', 'RUN BENCHMARK')))); }; drawB(); p.draw = () => S.tab === 'perf' && drawB();
    content.append(h('div', { class: 'kynedit-scroll p' }, h('div', { class: 'kynedit-perf' }, h('div', { class: 'kynedit-pr2' }, card(T('Machine', 'Machine'), kv(T('Puce', 'Chip'), 'Apple M4 Max'), kv('CPU', T('12 performance + 4 efficacité', '12 performance + 4 efficiency')), kv('GPU', T('40 cœurs', '40 cores')), kv(T('Mémoire', 'Memory'), '64 ' + T('Go', 'GB')), kv(T('Moteurs média (estimés)', 'Media engines (estimated)'), '2 + 2'), note(T('2 vidéo · 2 ProRes d’après le nom de la puce ; le banc d’essai confirme.', '2 video · 2 ProRes based on the chip name; the benchmark confirms.')), kv(T('État thermique', 'Thermal state'), T('Normal', 'Nominal'), 'ok'), kv(T('Mode économie d’énergie', 'Low Power Mode'), T('désactivé', 'off'))),
      card(T('Tâches en parallèle', 'Parallel tasks'), kv(T('Vignettes', 'Thumbnails'), '8'), kv(T('Export', 'Export') + ' · HEVC / H.264', '2'), kv(T('Export', 'Export') + ' · ProRes', '2'), note(T('en parallèle', 'in parallel')))),
      card(T('Stockage', 'Storage'), ...[['SSD Editing', T('Externe (SSD)', 'External (SSD)'), 4], ['RUSHES_FX6', T('Externe (SSD)', 'External (SSD)'), 4], ['Archive RAID', T('Externe (disque dur)', 'External (hard drive)'), 1], ['Macintosh HD', T('Interne (SSD)', 'Internal (SSD)'), 8]].map(([n, k, wk]) => kv(n, `${k} · ${T('Analyse', 'Scan')} ${wk}`))), card(T('Banc d’essai', 'Benchmark'), bench))));
  }
  async function runBench() {
    const p = S.perf; if (p.running) return; p.running = true; p.rows = []; p.best = {}; p.draw && p.draw(); sfx.click(); const data = [['ProRes 422 HQ', [[1, 96], [2, 188], [4, 190]], true], ['H.264', [[1, 212], [2, 391], [4, 402]], true], ['HEVC', [[1, 176], [2, 342], [4, 349]], true]];
    for (const [codec, rs, hw] of data) { for (const [ss, fps] of rs) { await wait(reduced() ? 0 : 520); if (!alive()) return; p.rows.push([codec, ss, fps * (1 + (Math.random() - .5) * .04), hw]); sfx.tick(); p.draw && p.draw(); } }
    data.forEach(([codec]) => { p.best[codec] = 2; }); p.running = false; sfx.done(); p.draw && p.draw();
  }

  /* --- clavier --- */
  const onKey = e => {
    if (!alive()) return document.removeEventListener('keydown', onKey); if (!w.el.classList.contains('active')) return; const inField = e.target.matches('input,textarea');
    if (e.key === 'Escape') { if (sheetEl) closeSheet(); else closeMenu(); return; }
    if (inField) return; const mod = e.metaKey || e.ctrlKey;
    if (S.tab === 'atelier') { if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); if (e.shiftKey) atExport(S.at.items.slice()); else { const it = curTrim(); if (it) { atExport([it]); atGo(1); } } return; } if (e.key === 'Enter') { e.preventDefault(); atAdd(); return; } if (e.key === 'ArrowUp') { e.preventDefault(); atGo(-1); return; } if (e.key === 'ArrowDown') { e.preventDefault(); atGo(1); return; } if (at.key(e)) e.preventDefault(); }
    else if (S.tab === 'explorer' && one()) { if (pl.key(e)) e.preventDefault(); }
    if (mod && e.key.toLowerCase() === 'a' && S.tab === 'explorer' && S.vol) { e.preventDefault(); S.sel = new Set(visibleClips().map(c => c.id)); updateSelMarks(); drawSelection(); }
  };
  document.addEventListener('keydown', onKey);
  root.append(bar, content); drawTabs(); drawExplorer();
  return root;
}
