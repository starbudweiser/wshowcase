/* Réplique interactive de mDOWN : téléchargeur de vidéos et de sons léger, au moteur yt-dlp qui se met à jour seul.
   Lien collé ou glissé (lien copié détecté), mode vidéo / audio, qualité et format, analyse, file de téléchargements (vitesse, reste, pause, reprise,
   annulation, téléchargements simultanés), playlist, échec suivi d'une réparation du moteur et d'un nouvel essai automatique, historique du jour,
   moteur (vérification, mise à jour vérifiée SHA-256, tests des plateformes, canal stable / nightly), réglages (cookies, mises à jour, extension du
   navigateur, signet, dossiers autorisés pour les agents du serveur MCP). Exemples : films libres de la Blender Foundation et films du domaine public
   d'Internet Archive. Rien n'est téléchargé. */
import { css, h, T, win, bar, sw, toast, icon, sfx, reduced } from './tk.js';
const CSS = 'css/demos/mDOWN.css';

/* Pictogrammes (équivalents des symboles SF de l'appli). */
const P = {
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  down: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
  note: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3.2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  retry: '<path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  sync: '<path d="M4 10a8 8 0 0 1 14.5-3.5L20 8M20 14a8 8 0 0 1-14.5 3.5L4 16M20 3.5V8h-4.5M4 20.5V16h4.5"/>',
  warn: '<path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  chev: '<path d="M7 10l5 5 5-5"/>'
};
const ic = (n, cls = '') => h('span', { class: 'md-ic ' + cls, html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>` });

/* Exemples libres de droits : films ouverts de la Blender Foundation (CC-BY) et films du domaine public (Internet Archive). */
const CAT = {
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ': { title: 'Big Buck Bunny — 4K 60 fps (Blender Open Movie)', plat: 'YouTube', dur: 634, max: 2160 },
  'https://www.youtube.com/watch?v=eRsGyueVLvQ': { title: 'Sintel — Open Movie by Blender Foundation', plat: 'YouTube', dur: 888, max: 1080 },
  'https://www.youtube.com/watch?v=R6MlUcmOul8': { title: 'Tears of Steel — Blender Open Movie', plat: 'YouTube', dur: 734, max: 2160 },
  'https://www.youtube.com/watch?v=WhWc3b3KhnY': { title: 'Spring — Blender Open Movie', plat: 'YouTube', dur: 464, max: 2160 },
  'https://archive.org/details/Popeye_forPresident': { title: 'Popeye for President (1956)', plat: 'Internet Archive', dur: 371, max: 480 },
  'https://archive.org/details/night_of_the_living_dead': { title: 'Night of the Living Dead (1968)', plat: 'Internet Archive', dur: 5760, max: 480 },
  'https://archive.org/details/FleischerSuperman': { title: 'Superman — Fleischer Studios (1941)', plat: 'Internet Archive', dur: 0, max: 480, count: 4 },
  'https://vimeo.com/1084537': { title: 'Big Buck Bunny (2008)', plat: 'Vimeo', dur: 597, max: 1080, failOnce: true }
};
const DEMO = [
  ['https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'Big Buck Bunny 4K'], ['https://www.youtube.com/watch?v=R6MlUcmOul8', 'Tears of Steel'],
  ['https://archive.org/details/night_of_the_living_dead', 'Night of the Living Dead'], ['https://archive.org/details/FleischerSuperman', () => T('Playlist (4 films)', 'Playlist (4 films)')],
  ['https://vimeo.com/1084537', () => T('Vimeo (réparation du moteur)', 'Vimeo (engine repair)')], ['https://www.youtube.com/watch?v=WhWc3b3KhnY', 'Spring']
];
const MBMIN = { 2160: 44, 1440: 24, 1080: 11, 720: 5.6, 480: 2.6, 360: 1.6 };

const fr = () => T('fr', 'en') === 'fr';
const bytes = n => { const u = fr() ? ['o', 'Ko', 'Mo', 'Go'] : ['B', 'KB', 'MB', 'GB']; let i = 0; while (n >= 1000 && i < 3) { n /= 1000; i++; } const s = (n >= 100 || i === 0 ? Math.round(n).toString() : n.toFixed(1)); return (fr() ? s.replace('.', ',') : s) + ' ' + u[i]; };
const clock = s => { s = Math.max(0, Math.round(s)); const p = n => String(n).padStart(2, '0'); return s >= 3600 ? `${Math.floor(s / 3600)}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}` : `${p(Math.floor(s / 60))}:${p(s % 60)}`; };
const ago = t => { const s = (Date.now() - t) / 1000; if (s < 50) return T('à l’instant', 'now'); if (s < 3600) { const m = Math.max(1, Math.round(s / 60)); return T(`il y a ${m} min`, `${m} min. ago`); } const hh = Math.round(s / 3600); return T(`il y a ${hh} h`, `${hh} hr. ago`); };
const hhmm = t => new Date(t).toLocaleTimeString(fr() ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

export function open(app) {
  css(CSS);
  return win(app, 1060, 720, w => {
    const now = Date.now(), min = 60e3;
    let seq = 0;
    const J = (url, o) => ({ id: ++seq, url, state: 'queued', prog: 0, audio: false, height: null, fmt: 'mp4', attempts: 0, added: now, ...o });
    const st = {
      mode: 'video', q: 'best', vf: 'mp4', af: 'm4a', clip: true, conc: 2, cookies: '', autoEng: true, autoApp: true, wcl: true, login: true, channel: 'stable',
      ver: '2026.11.23', checked: now - 64 * min, eng: 'ready', testing: false, verified: false, app: '', mem: 20, folder: 'Movies/mDOWN', over: false,
      allowed: ['Movies/mDOWN'], pending: [], copied: '', set: false,
      plats: [
        { id: 'youtube', n: 'YouTube', ok: true, date: now - 10 * min, job: true }, { id: 'vimeo', n: 'Vimeo', ok: null, session: true }, { id: 'tiktok', n: 'TikTok', ok: null, session: true },
        { id: 'instagram', n: 'Instagram', ok: true, date: now - 64 * min, session: true }, { id: 'soundcloud', n: 'SoundCloud', ok: true, date: now - 64 * min }, { id: 'twitter', n: 'X', ok: null, login: true },
        { id: 'archive', n: 'Internet Archive', ok: true, date: now - 25 * min, job: true }
      ],
      jobs: [
        J('https://www.youtube.com/watch?v=eRsGyueVLvQ', { title: CAT['https://www.youtube.com/watch?v=eRsGyueVLvQ'].title, plat: 'YouTube', dur: 888, state: 'done', prog: 1, height: 1080, bytes: 437e6, finished: now - 3 * min }),
        J('https://www.youtube.com/watch?v=R6MlUcmOul8', { title: CAT['https://www.youtube.com/watch?v=R6MlUcmOul8'].title, plat: 'YouTube', dur: 734, state: 'done', prog: 1, height: 1080, bytes: 372e6, finished: now - 7 * min }),
        J('https://archive.org/details/Popeye_forPresident', { title: 'Popeye for President (1956)', plat: 'Internet Archive', dur: 371, state: 'done', prog: 1, bytes: 58.4e6, finished: now - 13 * min }),
        J('https://www.youtube.com/watch?v=WhWc3b3KhnY', { title: 'Spring — Blender Open Movie', plat: 'YouTube', dur: 464, state: 'done', prog: 1, audio: true, fmt: 'm4a', bytes: 12.3e6, finished: now - 18 * min })
      ]
    };
    const root = h('div', { class: 'tk md' }), side = h('aside', { class: 'md-side' }), main = h('div', { class: 'md-main' }), list = h('div', { class: 'md-list' });
    const alive = () => root.isConnected;
    const say = body => toast({ icon: icon(app.id), title: 'mDOWN', body });

    /* ——— menus déroulants (puces, canal, clic droit) ——— */
    let menuEl = null;
    const closeMenu = () => { menuEl && menuEl.remove(); menuEl = null; };
    const menu = (x, y, items) => {
      closeMenu(); const r = root.getBoundingClientRect();
      menuEl = h('div', { class: 'md-menu', style: { left: (x - r.left) + 'px', top: (y - r.top) + 'px' } }, ...items.map(([l, f, on]) => h('button', { class: on ? 'on' : '', onclick: e => { e.stopPropagation(); closeMenu(); sfx.tick(); f(); } }, (on ? '✓ ' : '') + l)));
      root.append(menuEl);
    };
    root.addEventListener('pointerdown', e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); });
    const dropdown = (el, items) => { const b = el.getBoundingClientRect(); menu(b.left, b.bottom + 4, items); };

    /* ——— en-tête ——— */
    const memEl = h('span', { class: 'md-svc' });
    const drawMem = () => { memEl.textContent = T(`Service actif · ${st.mem} Mo de mémoire`, `Service running · ${st.mem} MB of memory`); };
    const gear = h('button', { class: 'md-sq', title: T('Réglages', 'Settings'), onclick: () => settings() }, ic('gear'));

    /* ——— colonne de gauche : moteur, bilan du jour, dossier ——— */
    const busyEng = () => ['checking', 'installing', 'updating'].includes(st.eng) || st.testing;
    const tag = (text, kind = '') => h('span', { class: 'md-tag ' + kind }, text);
    const platTag = p => p.ok === 'testing' ? tag(T('Test…', 'Testing…')) : p.ok === true ? tag(T('Fonctionne', 'Working'), 'ok') : p.ok === false ? tag(T('Ne répond pas', 'Not working'), 'err')
      : (p.session || p.login) ? tag(T('Compte requis', 'Account needed')) : tag(T('Non testé', 'Not tested'));
    const today = () => st.jobs.filter(j => j.state === 'done' && j.finished && new Date(j.finished).toDateString() === new Date().toDateString());
    const drawSide = () => {
      side.innerHTML = '';
      const title = { ready: T(`À jour · ${st.ver}`, `Up to date · ${st.ver}`), checking: T('Vérification…', 'Checking…'), updating: T('Mise à jour du moteur…', 'Updating the engine…'), installing: T('Installation du moteur…', 'Installing the engine…') }[st.eng];
      const sub = st.eng === 'updating' ? (st.verified ? T('Somme SHA-256 vérifiée · test du moteur', 'SHA-256 checksum verified · testing the engine') : T(`Téléchargement de yt-dlp ${st.next || ''}`, `Downloading yt-dlp ${st.next || ''}`))
        : T(`Vérifié ${ago(st.checked)} · sans recompilation`, `Checked ${ago(st.checked)} · no rebuild`);
      const tint = st.eng === 'ready' ? 'ok' : 'warn';
      const chan = h('button', { class: 'md-chan', onclick: e => dropdown(e.currentTarget, [['Stable', () => setChannel('stable'), st.channel === 'stable'], ['Nightly', () => setChannel('nightly'), st.channel === 'nightly']]) }, st.channel === 'nightly' ? 'Nightly' : 'Stable');
      side.append(
        h('div', { class: 'md-card md-eng' },
          h('div', { class: 'md-engh' }, h('span', { class: 'md-badge ' + tint + (busyEng() ? ' spin' : '') }, ic(st.eng === 'ready' ? 'shield' : 'sync')), h('div', {}, h('b', {}, title), h('small', {}, sub))),
          h('div', { class: 'md-plats' }, ...st.plats.map(p => h('div', { class: 'md-plat' }, h('div', {}, h('span', {}, p.n),
            p.date && p.ok !== 'testing' ? h('small', {}, p.job ? (p.ok ? T(`Dernier téléchargement réussi ${ago(p.date)}`, `Last download succeeded ${ago(p.date)}`) : T(`Dernier échec ${ago(p.date)}`, `Last failure ${ago(p.date)}`)) : T(`Testé ${ago(p.date)}`, `Tested ${ago(p.date)}`)) : null), platTag(p)))),
          h('div', { class: 'md-row' }, h('span', { class: 'md-dim' }, T('Canal', 'Channel')), chan),
          h('button', { class: 'md-soft wide', disabled: busyEng(), onclick: () => checkNow() }, busyEng() ? h('span', { class: 'md-spin' }) : ic('refresh'), T('Vérifier maintenant', 'Check now'))),
        h('div', { class: 'md-stats' }, stat(String(today().length), T('Terminés', 'Done')), stat(bytes(today().reduce((a, j) => a + (j.bytes || 0), 0)), T('Reçus', 'Received')), stat(String(st.jobs.filter(j => j.state === 'failed').length), T('Erreurs', 'Errors'))),
        h('div', { class: 'md-card md-dest' },
          h('div', { class: 'md-row' }, h('span', { class: 'md-path' }, ic('folder'), st.folder), h('button', { class: 'md-tagbtn', onclick: e => dropdown(e.currentTarget, ['Movies/mDOWN', 'Downloads/mDOWN', 'Desktop/Clips'].map(f => [f, () => { st.folder = f; if (!st.allowed.includes(f)) st.allowed.push(f); drawSide(); say(T(`Enregistrement dans ${f}`, `Saving to ${f}`)); }, st.folder === f])) }, T('Changer', 'Change'))),
          h('div', { class: 'md-row' }, h('span', { class: 'md-dim' }, T('Lien copié', 'Copied link')), h('button', { class: 'md-plain', onclick: () => { st.clip = !st.clip; sfx.tick(); drawSide(); } }, tag(st.clip ? T('Détecté auto', 'Auto-detected') : T('Désactivé', 'Off'), st.clip ? 'ok' : '')))));
    };
    const stat = (v, l) => h('div', { class: 'md-stat' }, h('b', {}, v), h('small', {}, l));

    /* ——— moteur : vérification, mise à jour vérifiée, tests des plateformes ——— */
    const pause_ = ms => new Promise(r => setTimeout(r, reduced() ? Math.min(ms, 60) : ms));
    const bump = v => { const [y, m, d] = v.split('.').map(Number); const t = new Date(y, m - 1, d + 4); return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')}`; };
    let engTask = null;
    const update = (force) => engTask || (engTask = (async () => {
      st.eng = 'checking'; drawSide(); await pause_(1100); if (!alive()) return false;
      const fresh = force || !st.updatedOnce;
      st.checked = Date.now();
      if (!fresh) { st.eng = 'ready'; drawSide(); engTask = null; return false; }
      st.next = st.channel === 'nightly' ? bump(st.ver) + '.231544' : bump(st.ver); st.eng = 'updating'; st.verified = false; drawSide(); await pause_(1400); if (!alive()) return false;
      st.verified = true; drawSide(); await pause_(900); if (!alive()) return false;
      st.ver = st.next; st.updatedOnce = true; st.eng = 'ready'; drawSide();
      say(T(`Moteur mis à jour : yt-dlp ${st.ver}, installé à chaud, sans recompiler l’appli.`, `Engine updated: yt-dlp ${st.ver}, installed live, without rebuilding the app.`));
      engTask = null; await probes(); return true;
    })());
    const probes = async () => {
      st.testing = true;
      const todo = st.plats.filter(p => !p.job && !p.login && (!p.session || st.wcl));
      todo.forEach(p => p.ok = 'testing'); drawSide();
      for (const p of todo) { await pause_(420); if (!alive()) return; p.ok = true; p.date = Date.now(); drawSide(); }
      st.testing = false; drawSide();
    };
    const checkNow = async () => { if (busyEng()) return; sfx.click(); const up = await update(false); if (!up && alive()) await probes(); };
    const setChannel = c => { if (st.channel === c) return; st.channel = c; st.updatedOnce = false; drawSide(); say(c === 'nightly' ? T('Canal nightly : le moteur suit les versions de chaque nuit.', 'Nightly channel: the engine follows the nightly builds.') : T('Canal stable : versions publiées seulement.', 'Stable channel: published releases only.')); if (st.autoEng) update(true); };

    /* ——— barre de lien, options ——— */
    const field = h('input', { class: 'md-in', placeholder: T('Collez un lien ou glissez-le ici', 'Paste a link or drop it here'), onkeydown: e => { if (e.key === 'Enter') { closeMenu(); submit(); } }, onfocus: () => suggest(), onclick: () => suggest() });
    const suggest = () => { if (menuEl) return; const b = field.parentNode.getBoundingClientRect(); menu(b.left, b.bottom + 4, [[T('— Liens d’exemple (films libres) —', '— Sample links (free films) —'), () => {}], ...DEMO.map(([u, l]) => [(typeof l === 'function' ? l() : l) + '   ' + u.replace(/^https:\/\/(www\.)?/, ''), () => { field.value = u; field.focus(); }])]); menuEl.classList.add('md-sugg'); };
    const submit = () => { const n = add(field.value); if (n > 0) field.value = ''; else if (field.value.trim()) { say(T('Lien non reconnu.', 'Link not recognized.')); } };
    const opts = h('div', { class: 'md-opts' }), count = h('span', { class: 'md-count' });
    const chip = (label, items) => h('button', { class: 'md-chip', onclick: e => dropdown(e.currentTarget, items) }, label, ic('chev', 'sm'));
    const drawOpts = () => {
      opts.innerHTML = '';
      const seg = h('div', { class: 'md-seg' }, ...[['video', T('Vidéo', 'Video'), 'film'], ['audio', 'Audio', 'note']].map(([m, l, g]) => h('button', { class: st.mode === m ? 'on' : '', onclick: () => { st.mode = m; sfx.tick(); drawOpts(); } }, ic(g), l)));
      const best = T('Meilleure', 'Best');
      opts.append(seg, ...(st.mode === 'video'
        ? [chip(T('Qualité : ', 'Quality: ') + (st.q === 'best' ? best : st.q + 'p'), [['best', best], ...['2160', '1440', '1080', '720', '480'].map(q => [q, q + 'p'])].map(([v, l]) => [l, () => { st.q = v; drawOpts(); }, st.q === v])),
           chip(T('Format : ', 'Format: ') + st.vf.toUpperCase(), ['mp4', 'mkv'].map(f => [f.toUpperCase(), () => { st.vf = f; drawOpts(); }, st.vf === f]))]
        : [chip(T('Format : ', 'Format: ') + st.af.toUpperCase(), ['m4a', 'mp3'].map(f => [f.toUpperCase(), () => { st.af = f; drawOpts(); }, st.af === f]))]),
        h('span', { class: 'tk-sp' }), count);
      drawCount();
    };
    const drawCount = () => { const a = st.jobs.filter(j => ['analyzing', 'downloading'].includes(j.state)).length, q = st.jobs.filter(j => j.state === 'queued').length;
      count.textContent = T(`${st.jobs.length} éléments · ${a} en cours · ${q} en attente`, `${st.jobs.length} items · ${a} active · ${q} waiting`); };

    /* ——— file de téléchargements ——— */
    const add = (text, o = {}) => {
      let n = 0;
      for (const raw of String(text).split(/\s+/)) {
        let u; try { u = new URL(raw); } catch { continue; }
        if (!/^https?:$/.test(u.protocol) || !u.host) continue;
        const url = u.href;
        if (st.jobs.some(j => j.url === url && ['queued', 'analyzing', 'downloading', 'paused'].includes(j.state))) { n++; continue; }
        const audio = o.audio ?? st.mode === 'audio';
        st.jobs.unshift(J(url, { audio, height: audio || st.q === 'best' ? null : +st.q, fmt: audio ? st.af : st.vf, src: o.src, folder: o.folder, added: Date.now() }));
        n++;
      }
      if (n) { sfx.click(); drawList(); pump(); }
      return n;
    };
    const pump = () => { for (const j of [...st.jobs].reverse()) { if (st.jobs.filter(x => ['analyzing', 'downloading'].includes(x.state)).length >= st.conc) break; if (j.state === 'queued' && (!j.retryAt || j.retryAt <= Date.now())) { j.state = j.title ? 'downloading' : 'analyzing'; j.t = 0; } } drawList(); };
    const resolve = j => {
      const c = CAT[j.url];
      if (c) { j.title = c.title; j.plat = c.plat; j.dur = c.dur; j.count = c.count; j.max = c.max; j.failOnce = c.failOnce; }
      else { const u = new URL(j.url); const host = u.host.replace(/^www\./, ''); j.plat = host.split('.').slice(-2, -1)[0].replace(/^./, s => s.toUpperCase()); j.title = host + u.pathname; j.dur = 120 + Math.round(Math.random() * 600); j.max = 1080; }
      const hq = j.audio ? 0 : Math.min(j.height || j.max, j.max);
      if (!j.audio && j.height && j.height > j.max) j.height = j.max;
      const mins = (j.count ? 4 * 9 * 60 : j.dur) / 60;
      j.total = Math.round((j.audio ? (j.fmt === 'mp3' ? 1.4 : 1.0) : MBMIN[hq] || 3) * mins * 1e6);
      j.rate = j.total / Math.max(5 + Math.random() * 3, Math.min(14, j.total / 42e6));
    };
    const tick = dt => {
      let changed = false;
      for (const j of st.jobs) {
        if (j.state === 'analyzing') {
          j.t += dt; if (j.t < 1000) continue;
          resolve(j); changed = true;
          if (j.failOnce && !j.attempts) { j.attempts = 1; j.state = 'failed'; j.error = 'ERROR: [vimeo] 1084537: Unable to extract player config'; j.repairing = true; repair(j); }
          else { j.state = 'downloading'; j.prog = 0; }
        } else if (j.state === 'downloading') {
          const share = Math.max(1, st.jobs.filter(x => x.state === 'downloading').length) > 2 ? .8 : 1;
          j.speed = j.rate * share * (.82 + Math.random() * .36);
          j.prog = Math.min(1, j.prog + j.speed * dt / 1000 / j.total);
          j.eta = (1 - j.prog) * j.total / j.speed;
          if (j.prog >= 1) {
            j.state = 'done'; j.bytes = j.total; j.finished = Date.now(); changed = true;
            const p = st.plats.find(x => x.n === j.plat); if (p) { p.ok = true; p.date = Date.now(); p.job = true; }
            say(T(`Téléchargé : ${j.title}`, `Downloaded: ${j.title}`) + (j.folder ? T(` · dans ${j.folder}`, ` · in ${j.folder}`) : ''));
          } else updRow(j);
        } else if (j.state === 'failed' && j.retryAt && j.retryAt <= Date.now()) { j.state = 'queued'; j.retryAt = null; changed = true; }
      }
      if (changed) { drawList(); drawSide(); pump(); }
    };
    const repair = async j => {
      drawSide();
      await update(true); if (!alive()) return;
      j.repairing = false; j.error = null; j.retryAt = Date.now() + (reduced() ? 300 : 4000);
      const p = st.plats.find(x => x.id === 'vimeo'); if (p) { p.ok = true; p.date = Date.now(); }
      drawList(); drawSide();
    };
    let last = performance.now();
    const loop = setInterval(() => { if (!alive()) return clearInterval(loop); const t = performance.now(); tick(t - last); last = t; }, 200);
    const memLoop = setInterval(() => { if (!alive()) return clearInterval(memLoop); const busy = st.jobs.some(j => j.state === 'downloading'); st.mem = (busy ? 24 : 19) + Math.round(Math.random() * 3); drawMem(); }, 5000);

    /* ——— lignes ——— */
    const rows = new Map();
    const right = j => {
      switch (j.state) {
        case 'downloading': return [bytes(j.speed || 0) + '/s', T(`${Math.floor(j.prog * 100)} % · reste ${clock(j.eta || 0)}`, `${Math.floor(j.prog * 100)} % · ${clock(j.eta || 0)} left`)];
        case 'analyzing': return ['—', '0 %'];
        case 'queued': return ['—', T('file d’attente', 'queued')];
        case 'paused': return [`${Math.floor(j.prog * 100)} %`, T('En pause', 'Paused')];
        case 'done': return [bytes(j.bytes || 0), ago(j.finished)];
        default: return ['—', j.retryAt ? T(`Nouvel essai à ${hhmm(j.retryAt)}`, `Retrying at ${hhmm(j.retryAt)}`) : ''];
      }
    };
    const meta = j => {
      if (j.state === 'failed') return [tag(T('Échec', 'Failed'), 'err'), h('span', {}, j.repairing ? T('Le moteur reçoit un correctif · nouvel essai automatique', 'The engine is getting a fix · automatic retry') : (j.error || T('Le site a refusé la connexion.', 'The site refused the connection.')))];
      const q = j.audio ? null : (j.height ? j.height + 'p' : T('Meilleure', 'Best'));
      const txt = [j.count ? T(`Playlist · ${j.count} éléments`, `Playlist · ${j.count} items`) : null, q, j.fmt.toUpperCase(), !j.count && (j.bytes || (j.total && j.state !== 'analyzing')) ? bytes(j.bytes || j.total) : null].filter(Boolean).join(' · ');
      const s = { downloading: [T('Téléchargement', 'Downloading'), 'ok'], analyzing: [T('Analyse…', 'Analyzing…'), ''], queued: [T('En attente', 'Waiting'), ''], paused: [T('En pause', 'Paused'), 'warn'], done: [T('Terminé', 'Done'), 'ok'] }[j.state];
      return [h('span', {}, txt), tag(s[0], s[1]), j.src ? tag(j.src) : null];
    };
    const sq = (g, tip, f) => h('button', { class: 'md-sq', title: tip, onclick: e => { e.stopPropagation(); f(); } }, ic(g));
    const actions = j => {
      switch (j.state) {
        case 'downloading': case 'analyzing': return [sq('pause', T('Mettre en pause', 'Pause'), () => { j.state = 'paused'; sfx.tick(); drawList(); pump(); }), sq('x', T('Annuler', 'Cancel'), () => cancel(j))];
        case 'queued': return [sq('x', T('Annuler', 'Cancel'), () => cancel(j))];
        case 'paused': return [sq('play', T('Reprendre', 'Resume'), () => { j.state = 'queued'; sfx.tick(); pump(); }), sq('x', T('Annuler', 'Cancel'), () => cancel(j))];
        case 'done': return [sq('folder', T('Afficher dans le Finder', 'Show in Finder'), () => say(T(`Affiché dans le Finder : ${j.folder || st.folder}/${(j.title || 'video').slice(0, 40)}.${j.fmt}`, `Shown in Finder: ${j.folder || st.folder}/${(j.title || 'video').slice(0, 40)}.${j.fmt}`)))];
        default: return j.repairing ? [] : [sq('retry', T('Réessayer', 'Retry'), () => { j.attempts = 0; j.retryAt = null; j.state = 'queued'; sfx.tick(); pump(); })];
      }
    };
    const cancel = j => { st.jobs = st.jobs.filter(x => x !== j); sfx.tick(); drawList(); drawSide(); pump(); };
    const disp = j => j.title || (() => { try { const u = new URL(j.url); return u.host + u.pathname; } catch { return j.url; } })();
    const row = (j, hgt) => {
      const bar = h('i'), rt = h('b'), rs = h('small'), mt = h('div', { class: 'md-meta' }, ...meta(j));
      const color = j.state === 'done' ? 'ok' : j.state === 'failed' ? 'err' : '';
      const el = h('div', { class: 'md-job', style: { height: hgt + 'px' }, oncontextmenu: e => { e.preventDefault(); menu(e.clientX, e.clientY, [[T('Retirer de la liste', 'Remove from list'), () => cancel(j)]]); } },
        h('div', { class: 'md-thumb' }, ic(j.state === 'failed' ? 'warn' : j.audio ? 'note' : 'play'), (j.count || j.dur) ? h('em', {}, j.count ? String(j.count) : clock(j.dur)) : null),
        h('div', { class: 'md-mid' }, h('div', { class: 'md-tl' }, h('b', {}, disp(j)), j.plat ? tag(j.plat) : null), mt, h('div', { class: 'md-bar ' + color }, bar)),
        h('div', { class: 'md-right' }, rt, rs), h('div', { class: 'md-acts' }, ...actions(j)));
      const upd = () => { bar.style.width = (j.state === 'failed' ? 100 : j.prog * 100) + '%'; const [a, b] = right(j); rt.textContent = a; rs.textContent = b; };
      upd(); rows.set(j.id, { el, upd, mt }); return el;
    };
    const updRow = j => { const r = rows.get(j.id); if (r) r.upd(); };
    const dropCard = () => h('div', { class: 'md-drop' }, ic('down', 'lg'), h('b', {}, T('Glissez un lien ici', 'Drop a link here')), h('span', {}, T('mDOWN choisit seul le bon extracteur pour chaque site.', 'mDOWN picks the right extractor for each site by itself.')),
      h('div', { class: 'md-demo' }, h('small', {}, T('Liens d’exemple (films libres) : cliquez ou glissez', 'Sample links (free films): click or drag')),
        h('div', {}, ...DEMO.map(([u, l]) => h('button', { class: 'md-chip sm', draggable: 'true', title: u, ondragstart: e => e.dataTransfer.setData('text/plain', u), onclick: () => { field.value = u; field.focus(); sfx.tick(); } }, typeof l === 'function' ? l() : l)))));
    const drawList = () => {
      rows.clear(); list.innerHTML = '';
      const n = st.jobs.length, H = list.clientHeight || 520, gaps = Math.max(0, n - 1) * 8;
      const rh = n ? Math.min(92, Math.max(76, (H - gaps) / n)) : 0, rest = H - n * rh - gaps - (n ? 8 : 0);
      st.jobs.forEach(j => list.append(row(j, rh)));
      if (!n || rest >= 150) { const d = dropCard(); d.style.minHeight = (n ? rest : H) + 'px'; list.append(d); }
      drawCount();
    };

    /* ——— réglages (feuille) ——— */
    const settings = () => {
      sfx.click(); closeMenu();
      const m = h('div', { class: 'tk-modal md-modal', onclick: e => e.target === m && m.remove() });
      const swr = (l, k, f) => h('div', { class: 'md-swr' }, h('span', {}, l), sw(st[k], v => { st[k] = v; f && f(v); }));
      const draw = () => {
        m.innerHTML = '';
        const updTxt = { '': '', checking: T('Recherche…', 'Checking…'), ok: T('L’appli est à jour (1.0.3)', 'The app is up to date (1.0.3)') }[st.app];
        const cp = (k, txt) => { st.copied = k; draw(); sfx.tick(); say(txt); setTimeout(() => { if (st.copied === k) { st.copied = ''; if (m.isConnected) draw(); } }, 2000); };
        m.append(h('div', { class: 'md-sheet' }, h('h3', {}, T('Réglages', 'Settings')),
          h('div', { class: 'md-cols' },
            h('div', { class: 'md-col' },
              h('div', { class: 'md-card pad' },
                h('div', { class: 'md-row' }, h('span', {}, T('Téléchargements simultanés', 'Simultaneous downloads')), h('div', { class: 'md-step' }, h('button', { onclick: () => { st.conc = Math.max(1, st.conc - 1); draw(); pump(); } }, '−'), h('b', {}, String(st.conc)), h('button', { onclick: () => { st.conc = Math.min(4, st.conc + 1); draw(); pump(); } }, '+'))),
                h('div', { class: 'md-row' }, h('span', {}, T('Cookies du navigateur', 'Browser cookies')), (() => { const s = h('select', { class: 'md-select', onchange: e => { st.cookies = e.target.value; } }, ...[['', T('Aucun', 'None')], ...['Safari', 'Chrome', 'Firefox', 'Brave', 'Edge'].map(b => [b.toLowerCase(), b])].map(([v, l]) => h('option', { value: v }, l))); s.value = st.cookies; return s; })()),
                h('p', { class: 'md-help' }, T('Pour les vidéos réservées à un compte (âge, abonnés). Safari demande l’accès complet au disque.', 'For videos that need an account (age, subscribers). Safari needs Full Disk Access.'))),
              h('div', { class: 'md-card pad' },
                swr(T('Détecter le lien copié', 'Detect the copied link'), 'clip', () => drawSide()),
                swr(T('Mettre à jour le moteur automatiquement', 'Update the engine automatically'), 'autoEng'),
                swr(T('Installer automatiquement les mises à jour de l’appli', 'Install app updates automatically'), 'autoApp'),
                swr(T('Tester les plateformes avec compte via la session de wCLAUDE (si reliée)', 'Test account platforms with wCLAUDE’s session (if linked)'), 'wcl'),
                swr(T('Ouvrir à l’ouverture de session', 'Open at login'), 'login'),
                h('div', { class: 'md-row' }, h('button', { class: 'md-soft', onclick: async () => { st.app = 'checking'; draw(); await pause_(1200); st.app = 'ok'; if (m.isConnected) draw(); } }, T('Rechercher une mise à jour de l’appli', 'Check for an app update')), h('span', { class: 'md-dim md-grow' }, updTxt)))),
            h('div', { class: 'md-col' },
              h('div', { class: 'md-card pad' }, h('div', { class: 'md-cap' }, T('Agents · serveur MCP', 'Agents · MCP server')),
                h('p', { class: 'md-help' }, T('Dossiers où un agent peut enregistrer. Tout autre dossier attend votre accord.', 'Folders where an agent may save files. Any other folder waits for your approval.')),
                ...st.pending.map(p => h('div', { class: 'md-row' }, tag(T(`Un agent demande : ${p}`, `An agent asks for: ${p}`), 'warn'), h('span', { class: 'tk-sp' }),
                  h('button', { class: 'md-pri sm', onclick: () => { st.pending = st.pending.filter(x => x !== p); st.allowed.push(p); add('https://www.youtube.com/watch?v=R6MlUcmOul8', { folder: p, src: T('Agent', 'Agent') }); draw(); } }, T('Autoriser', 'Allow')),
                  h('button', { class: 'md-soft sm', onclick: () => { st.pending = st.pending.filter(x => x !== p); draw(); say(T('Dossier refusé : l’agent est prévenu.', 'Folder denied: the agent is told.')); } }, T('Refuser', 'Deny')))),
                ...st.allowed.map(p => h('div', { class: 'md-row' }, h('span', { class: 'md-path' }, ic('folder'), p), sq('x', T('Retirer de la liste', 'Remove from list'), () => { st.allowed = st.allowed.filter(x => x !== p); draw(); }))),
                h('div', { class: 'md-row' }, h('button', { class: 'md-soft', onclick: () => { const f = ['Documents/Clips', 'Music/mDOWN', 'Desktop/Archive'].find(x => !st.allowed.includes(x)); if (f) { st.allowed.push(f); sfx.tick(); draw(); } } }, T('Ajouter un dossier…', 'Add a folder…')),
                  h('button', { class: 'md-soft', disabled: st.pending.length > 0, onclick: () => { st.pending.push(st.allowed.includes('Desktop/Clips') ? 'Movies/Agent' : 'Desktop/Clips'); sfx.notif(); draw(); } }, T('Simuler une demande d’agent', 'Simulate an agent request'))),
                h('p', { class: 'md-help mono' }, 'download_media · get_download · list_downloads · cancel_download · engine_status · update_engine · request_folder_access')),
              h('div', { class: 'md-card pad' }, h('div', { class: 'md-cap' }, T('Navigateur', 'Browser')),
                h('div', { class: 'md-row' }, h('span', {}, T('Code d’association de l’extension du navigateur', 'Browser extension pairing code')), h('button', { class: 'md-soft', onclick: () => cp('code', T('Code copié : collez-le dans l’extension.', 'Code copied: paste it in the extension.')) }, st.copied === 'code' ? T('Copié', 'Copied') : T('Copier', 'Copy'))),
                h('div', { class: 'md-row' }, h('span', {}, T('Dossier de l’extension (Brave, Chrome, Edge, Helium…)', 'Extension folder (Brave, Chrome, Edge, Helium…)')), h('button', { class: 'md-soft', onclick: () => say(T('Le Finder montre le dossier de l’extension : chargez-le dans chrome://extensions (mode développeur).', 'Finder shows the extension folder: load it in chrome://extensions (developer mode).')) }, T('Afficher', 'Show'))),
                h('div', { class: 'md-row' }, h('span', {}, T('Signet pour Safari et les autres navigateurs', 'Bookmarklet for Safari and other browsers')), h('button', { class: 'md-soft', onclick: () => cp('bm', T('Signet copié : ajoutez-le à vos favoris.', 'Bookmarklet copied: add it to your bookmarks.')) }, st.copied === 'bm' ? T('Copié', 'Copied') : T('Copier', 'Copy'))),
                h('div', { class: 'md-row' }, h('button', { class: 'md-soft', onclick: () => { m.remove(); add('https://www.youtube.com/watch?v=WhWc3b3KhnY', { src: T('Extension', 'Extension') }); say(T('Reçu de l’extension du navigateur : l’onglet en cours est ajouté à la file.', 'Received from the browser extension: the current tab joins the queue.')); } }, '↓ ' + T('Simuler l’envoi d’un onglet par l’extension', 'Simulate sending a tab from the extension')))))),
          h('div', { class: 'md-end' }, h('button', { class: 'md-pri', onclick: () => { m.remove(); sfx.tick(); } }, T('Fermer', 'Close')))));
      };
      draw(); root.append(m);
    };

    /* ——— assemblage ——— */
    main.append(
      h('div', { class: 'md-paste' }, h('label', { class: 'md-field' }, ic('link'), field), h('button', { class: 'md-pri', onclick: submit }, ic('down'), T('Télécharger', 'Download'))),
      opts, list,
      h('div', { class: 'md-foot' }, h('span', {}, T('Démarre avec la session · icône dans la barre des menus', 'Starts with your session · menu bar icon')), h('span', {}, T('Moteur vérifié par somme SHA-256 · jamais de recompilation', 'Engine verified by SHA-256 · never rebuilt'))));
    main.addEventListener('dragover', e => { e.preventDefault(); if (!st.over) { st.over = true; main.classList.add('over'); } });
    main.addEventListener('dragleave', e => { if (!main.contains(e.relatedTarget)) { st.over = false; main.classList.remove('over'); } });
    main.addEventListener('drop', e => { e.preventDefault(); st.over = false; main.classList.remove('over'); const t = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'); if (!add(t)) say(T('Lien non reconnu.', 'Link not recognized.')); });
    root.append(bar(app, w, h('span', { class: 'tk-sp' }), h('i', { class: 'md-dot' }), memEl, gear), h('div', { class: 'md-body' }, side, main));
    if (st.clip) field.value = DEMO[0][0];          // lien copié détecté au lancement (presse-papiers simulé)
    drawMem(); drawSide(); drawOpts();
    requestAnimationFrame(() => alive() && drawList());
    new ResizeObserver(() => { if (alive() && !st.jobs.some(j => j.state === 'downloading')) drawList(); }).observe(list);
    drawList();
    return root;
  }, 'mdw');
}
