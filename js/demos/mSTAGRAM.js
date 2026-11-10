/* mSTAGRAM : Instagram en version téléphone, dans une fenêtre d'iPhone 17 Pro Max (écran 440 × 956 pt, cadre titane, îlot dynamique, barre d'état, 7 coloris).
   La démo reprend l'écran du téléphone : fil, stories, recherche, reels, nouvelle publication, profil et « Modifier le profil » (le champ du lien du profil, modifiable seulement en version téléphone).
   Comptes, photos et textes sont fictifs ; rien n'est envoyé. */
import { h, brand, T, css, toast, icon, sfx, wm, download, clamp, reduced, wait, num } from './kit.js';
import { t, lang } from '../i18n.js';

const BRAND = '#db2777';
const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });
const FIN = { titanium: ['#bdb2a6', '#756e63'], black: ['#4d4d52', '#171719'], white: ['#ede9e6', '#b3b0ab'], desert: ['#ccad8f', '#85664d'], orange: ['#ed8545', '#943d14'], blue: ['#455980', '#172138'], silver: ['#e6e8ed', '#999ba6'] };
const FIN_NAME_F = () => ({ titanium: T('Titane naturel', 'Natural Titanium'), black: T('Titane noir', 'Black Titanium'), white: T('Titane blanc', 'White Titanium'), desert: T('Titane désert', 'Desert Titanium'), orange: T('Orange cosmique', 'Cosmic Orange'), blue: T('Bleu intense', 'Deep Blue'), silver: T('Argent', 'Silver') });
const SW = 440, SH = 956, BZ = 13, DW = SW + 2 * BZ, DH = SH + 2 * BZ, STATUS = 54, HOME = 24;
const ph = n => `assets/wallpapers/${n}.jpg`, th = n => `assets/wallpapers/thumbs/${n}.jpg`;
const svg = (d, s = 24, sw = 2) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>', comment: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.8L3 21l1.7-5A8.4 8.4 0 1 1 21 11.5z"/>', send: '<path d="m21 3-9.5 18-2.5-7.5L1.5 11z"/><path d="m21 3-12 10.5"/>', save: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', plus: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>', reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 9h18M9 3l3 6M15 3l3 6"/><path d="m10 13 5 3-5 3z" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', back: '<path d="m15 5-7 7 7 7"/>', more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>', x: '<path d="m6 6 12 12M18 6 6 18"/>', grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>', tag: '<circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/><rect x="3" y="3" width="18" height="18" rx="2"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  prev: '<path d="m15 5-7 7 7 7"/>', play: '<path d="m8 5 12 7-12 7z" fill="currentColor"/>', audio: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
};
const ic = (k, s, sw) => h('i', { class: 'msta-ic', html: svg(I[k], s, sw) });

/* ---------- données d'exemple (comptes fictifs, photos du site) ---------- */
const USERS = [['northern.lights', 'nordique', 'tes_hrothgar'], ['dune.studio', 'dune', 'ocean'], ['mac.setup', 'verre', 'nuit'], ['atelier.bois', 'prairie', 'brume'], ['lena.voyage', 'tes_solitude', 'aurore'], ['studio.nord', 'tes_whiterun', 'tes_winterhold']];
const SEED = () => [
  { id: 1, u: 'northern.lights', img: 'nordique', loc: T('Fjord de Tromsø', 'Tromsø fjord'), cap: T('Aurore sur le fjord, quarante minutes d’attente pour trente secondes de magie.', 'Aurora over the fjord, forty minutes of waiting for thirty seconds of magic.'), likes: 1284, ago: T('il y a 2 heures', '2 hours ago'), c: [['lena.voyage', T('Incroyable !', 'Incredible!')], ['dune.studio', T('Les verts…', 'Those greens…')]] },
  { id: 2, u: 'dune.studio', img: 'dune', loc: 'Merzouga', cap: T('Heure dorée dans les dunes. Aucun filtre, juste le bon moment.', 'Golden hour in the dunes. No filter, just the right moment.'), likes: 862, ago: T('il y a 5 heures', '5 hours ago'), c: [['mac.setup', T('Superbe lumière', 'Gorgeous light')]] },
  { id: 3, u: 'mac.setup', img: 'verre', cap: T('Nouveau fond d’écran, nouveau bureau. Le setup du moment.', 'New wallpaper, new desk. This week’s setup.'), likes: 2310, ago: T('il y a 9 heures', '9 hours ago'), c: [['atelier.bois', T('Le fond d’écran !', 'The wallpaper!')], ['studio.nord', '🔥'], ['lena.voyage', T('Quel bureau', 'What a desk')]] },
  { id: 4, u: 'lena.voyage', img: 'tes_solitude', loc: 'Glencoe', cap: T('Vieux pont, brume du matin. On y retourne cet été.', 'Old bridge, morning mist. We’re going back this summer.'), likes: 640, ago: T('hier', 'yesterday'), c: [] },
  { id: 5, u: 'atelier.bois', img: 'prairie', cap: T('Atelier ouvert ce week-end, venez voir les collines.', 'Open workshop this weekend, come see the hills.'), likes: 417, ago: T('hier', 'yesterday'), c: [['dune.studio', T('On passe samedi', 'We’ll drop by Saturday')]] }
];
const MY_F = () => ({ u: 'atelier.nord', name: 'Atelier Nord', bio: T('Photos et motion design.\nApplis pour Mac, petits outils.', 'Photos and motion design.\nMac apps, small tools.'), site: '', avatar: 'tes_whiterun', posts: [{ img: 'tes_winterhold' }, { img: 'tes_markarth' }, { img: 'ocean' }, { img: 'tes_moons' }, { img: 'brume' }, { img: 'tes_rift' }], followers: 1842, following: 311 });
const EXPLORE = ['tes_dwemer', 'dragon', 'tes_oblivion', 'braises', 'tes_sovngarde', 'aurore', 'tes_markarth', 'tes_rift', 'nuit', 'ocean', 'tes_moons', 'brume', 'tes_hrothgar', 'prairie', 'tes_winterhold', 'verre', 'dune', 'tes_whiterun'];
const REELS_F = () => [['northern.lights', 'tes_oblivion', T('Le portail de feu, version cinéma', 'The fire gate, cinematic cut'), 'Original audio'], ['dune.studio', 'dune', T('Pas à pas dans le sable', 'Step by step in the sand'), 'Golden hour · Atlas'], ['lena.voyage', 'tes_rift', T('Forêt de bouleaux en automne', 'Birch forest in autumn'), 'Original audio']];
const NEWPICK = ['tes_dwemer', 'dragon', 'braises', 'tes_sovngarde', 'aurore', 'nuit', 'tes_moons', 'tes_rift', 'tes_oblivion'];

export async function open(app) {
  await sheetReady('css/demos/mSTAGRAM.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 440, h: 772, x: 240, y: 36, resizable: false, bare: true, cls: 'socle msta-win', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  const FIN_NAME = FIN_NAME_F(), MY = MY_F(), REELS = REELS_F();
  const K = 726 / DH;   // l'iPhone entier tient dans la scène : 466 × 982 réduit à 344 × 726
  const S = { finish: 'orange', screen: 'home', stack: [], posts: SEED(), liked: new Set([2]), saved: new Set(), me: { ...MY }, loading: false, tab: 'grid', follow: false, nextId: 10, banner: '' };
  const timers = new Set(); const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (alive()) fn(); }, ms); timers.add(id); return id; };
  const root = h('div', { class: 'msta-root', style: { '--k': K, '--fa': FIN.orange[0], '--fb': FIN.orange[1] } });
  const view = h('div', { class: 'msta-view' }), top = h('div', { class: 'msta-top' }), tabbar = h('nav', { class: 'msta-tabs' }), over = h('div', { class: 'msta-over' }), prog = h('i', { class: 'msta-prog' });
  const fmt = n => n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US');

  /* --- habillage de l'iPhone --- */
  const clock = h('span', { class: 'msta-clock' }), island = h('div', { class: 'msta-island' }, h('i', {}), h('span', {}));
  const tick = () => { const d = new Date(); clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }; tick(); const clk = setInterval(() => { if (!alive()) return clearInterval(clk); tick(); }, 10000);
  const status = h('div', { class: 'msta-status' }, clock, h('span', { class: 'msta-sig', html: `<svg viewBox="0 0 66 14" width="66" height="14" aria-hidden="true" fill="currentColor"><rect x="0" y="9" width="3" height="5" rx="1"/><rect x="5" y="6" width="3" height="8" rx="1"/><rect x="10" y="3" width="3" height="11" rx="1"/><rect x="15" y="0" width="3" height="14" rx="1"/><path d="M29 11.8a1.5 1.5 0 1 0 .01 0zM24 8a7 7 0 0 1 10 0M21.4 5.2a11 11 0 0 1 15.2 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="42" y="1" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="44" y="3" width="18" height="8" rx="2"/></svg>` }));
  function finishIsland(k) { island.querySelector('i').style.background = FIN[k][0]; island.querySelector('span').textContent = FIN_NAME[k]; island.classList.add('on'); clearTimeout(finishIsland.t); finishIsland.t = setTimeout(() => island.classList.remove('on'), 1600); }
  const setFinish = k => { S.finish = k; root.style.setProperty('--fa', FIN[k][0]); root.style.setProperty('--fb', FIN[k][1]); sfx.tick(); finishIsland(k); dots.forEach(([kk, el]) => el.classList.toggle('on', kk === k)); };
  const dev = h('div', { class: 'msta-dev' }, h('div', { class: 'msta-body' }), h('div', { class: 'msta-bezel' }),
    h('div', { class: 'msta-screen' }, h('div', { class: 'msta-page' }, top, view, tabbar, over, prog), status, island, h('div', { class: 'msta-home' }, h('i', {}))),
    h('i', { class: 'msta-btn b1' }), h('i', { class: 'msta-btn b2' }), h('i', { class: 'msta-btn b3' }), h('i', { class: 'msta-btn b4' }));

  /* --- navigation (menu Navigation de l'appli : précédent, recharger, accueil) --- */
  const go = (screen, o = {}) => { if (o.replace !== true && screen !== S.screen) S.stack.push({ screen: S.screen, ...S.keep }); S.screen = screen; S.keep = o; render(); };
  const back = () => { const p = S.stack.pop(); if (!p) return; sfx.tick(); S.screen = p.screen; S.keep = { ...p }; render(); };
  const reload = () => { if (S.loading) return; S.loading = true; prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run'); sfx.click(); view.style.opacity = .35; later(() => { S.loading = false; view.style.opacity = ''; render(); }, 700); };
  const home = () => { S.stack = []; S.screen = 'home'; S.keep = {}; sfx.tick(); render(); };
  const ctl = (label, svgd, fn, dis) => h('button', { class: 'msta-cb', 'aria-label': label, title: label, onclick: fn, disabled: dis, html: svg(svgd, 16) });
  const dots = Object.keys(FIN).map(k => [k, h('button', { class: 'msta-dot' + (k === S.finish ? ' on' : ''), style: { '--c1': FIN[k][0], '--c2': FIN[k][1] }, 'aria-label': FIN_NAME[k], title: FIN_NAME[k], onclick: () => setFinish(k) })]);
  let backB = null;
  const strip = h('div', { class: 'msta-strip', 'data-drag': '' }, wm.lights(w), backB = ctl(T('Précédent', 'Back'), I.prev, back), ctl(T('Recharger', 'Reload'), '<path d="M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7"/>', reload), ctl(T('Accueil', 'Home'), '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>', home), h('i', { class: 'msta-sep' }), h('span', { class: 'msta-dots', 'aria-label': T('Coloris', 'Finish'), role: 'group' }, dots.map(d => d[1])), h('span', { class: 'msta-gap' }),
    h('button', { class: 'msta-cb', 'aria-label': T('À propos de mSTAGRAM', 'About mSTAGRAM'), title: T('À propos de mSTAGRAM', 'About mSTAGRAM'), onclick: () => about(), html: svg(I.info, 16) }), h('button', { class: 'msta-dl', onclick: () => download(app), disabled: !app.download }, t('f.download')));
  function about() {
    const card = h('div', { class: 'msta-about', role: 'dialog', 'aria-label': T('À propos', 'About') }, h('img', { src: icon(app.id), alt: '' }), h('b', { html: brand('mSTAGRAM', BRAND) }), h('small', {}, T('Version 1.0', 'Version 1.0')), h('p', {}, T('Instagram en version téléphone, dans une fenêtre sur le Mac.', 'Instagram in its phone version, in a window on your Mac.')), h('p', {}, h('b', {}, 'starbudweiser')), h('p', {}, T('Licence MIT', 'MIT licence')),
      h('small', {}, T('Outil personnel indépendant, non affilié à Instagram ni à Meta.', 'Independent personal tool, not affiliated with Instagram or Meta.')), h('button', { class: 'msta-ok', onclick: () => sc.remove() }, T('FERMER', 'CLOSE')));
    const sc = h('div', { class: 'msta-scrim', onpointerdown: e => { if (e.target === sc) sc.remove(); } }, card); root.append(sc); card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 180 });
  }

  /* --- écrans de l'app Instagram (version téléphone, thème sombre) --- */
  const avatar = (n, size = 32, ring = false) => h('i', { class: 'msta-av' + (ring ? ' ring' : ''), style: { '--s': size + 'px', backgroundImage: `url(${th(n)})` } });
  const bar = (title, left, right) => h('div', { class: 'msta-hd' }, left || h('span', {}), h('b', {}, title), right || h('span', {}));
  function drawTop() {
    top.innerHTML = ''; top.classList.toggle('hid', ['reels', 'edit'].includes(S.screen) && false);
    if (S.screen === 'home') top.append(h('div', { class: 'msta-hd home' }, h('b', { class: 'msta-logo' }, 'Instagram'), h('span', { class: 'msta-gap' }), h('button', { class: 'msta-b', 'aria-label': T('Notifications', 'Notifications'), onclick: () => flash(T('Aucune nouvelle notification.', 'No new notifications.')), html: svg(I.heart, 26) }), h('button', { class: 'msta-b', 'aria-label': 'Messages', onclick: () => flash(T('Messages : disponible dans l’appli complète.', 'Messages: available in the full app.')), html: svg(I.send, 26) })));
    else if (S.screen === 'search') top.append(h('div', { class: 'msta-hd' }, h('div', { class: 'msta-sbox' }, ic('search', 16), h('input', { placeholder: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), oninput: e => filterExplore(e.target.value) }))));
    else if (S.screen === 'profile') top.append(h('div', { class: 'msta-hd' }, h('b', { class: 'l' }, S.me.u), h('span', { class: 'msta-gap' }), h('button', { class: 'msta-b', 'aria-label': T('Réglages', 'Settings'), onclick: () => flash(T('Réglages : disponible dans l’appli complète.', 'Settings: available in the full app.')), html: svg(I.gear, 24) })));
    else if (S.screen === 'edit') top.append(bar(T('Modifier le profil', 'Edit profile'), h('button', { class: 'msta-b', 'aria-label': T('Retour', 'Back'), onclick: back, html: svg(I.back, 26) }), h('button', { class: 'msta-link', onclick: () => saveProfile() }, T('Terminer', 'Done'))));
    else if (S.screen === 'reels') top.append(h('div', { class: 'msta-hd ov' }, h('b', {}, 'Reels')));
    else top.append(bar('', h('button', { class: 'msta-b', onclick: back, html: svg(I.back, 26) })));
    top.classList.toggle('ov', S.screen === 'reels'); backB.disabled = !S.stack.length;
  }
  function drawTabs() {
    tabbar.innerHTML = ''; [['home', 'home'], ['search', 'search'], ['new', 'plus'], ['reels', 'reels'], ['profile', null]].forEach(([k, g]) => tabbar.append(h('button', { class: 'msta-t' + (S.screen === k || (k === 'profile' && S.screen === 'edit') ? ' on' : ''), 'aria-label': { home: T('Accueil', 'Home'), search: T('Recherche', 'Search'), new: T('Nouvelle publication', 'New post'), reels: 'Reels', profile: T('Profil', 'Profile') }[k], onclick: () => { if (k === 'new') return compose(); if (k === S.screen) { view.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); return; } S.stack = []; S.screen = k; S.keep = {}; sfx.tick(); render(); } }, g ? h('i', { html: svg(I[g], 26, S.screen === k ? 2.6 : 2) }) : avatar(S.me.avatar, 26, S.screen === 'profile'))));
  }
  function flash(msg) { const el = h('div', { class: 'msta-flash' }, msg); over.append(el); el.animate([{ opacity: 0, transform: 'translate(-50%,-10px)' }, { opacity: 1, transform: 'translate(-50%,0)' }], { duration: 200, fill: 'forwards' }); later(() => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250 }).onfinish = () => el.remove(), 2200); }

  function postEl(p) {
    const liked = S.liked.has(p.id), likes = h('b', {}, `${fmt(p.likes + (liked ? 1 : 0))} ${T('mentions J’aime', 'likes')}`), heart = h('i', { class: 'msta-big', html: svg(I.heart, 96, 0).replace('fill="none"', 'fill="#fff"') });
    const btn = h('button', { class: 'msta-b like' + (liked ? ' on' : ''), 'aria-label': T('J’aime', 'Like'), 'aria-pressed': liked, html: svg(I.heart, 26) }), sv = h('button', { class: 'msta-b sv' + (S.saved.has(p.id) ? ' on' : ''), 'aria-label': T('Enregistrer', 'Save'), html: svg(I.save, 26) });
    const setLike = (on, anim) => { on ? S.liked.add(p.id) : S.liked.delete(p.id); btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); likes.textContent = `${fmt(p.likes + (on ? 1 : 0))} ${T('mentions J’aime', 'likes')}`; on ? sfx.pop() : sfx.tick(); if (anim) heart.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, offset: .45 }, { transform: 'translate(-50%,-50%) scale(1.35)', opacity: 0 }], { duration: reduced() ? 1 : 750, easing: 'ease-out' }); btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: reduced() ? 1 : 260 }); };
    btn.onclick = () => setLike(!S.liked.has(p.id)); sv.onclick = () => { S.saved.has(p.id) ? S.saved.delete(p.id) : S.saved.add(p.id); sv.classList.toggle('on', S.saved.has(p.id)); sfx.tick(); };
    const img = h('div', { class: 'msta-img', style: { backgroundImage: `url(${p.mine ? p.src : ph(p.img)})` }, ondblclick: () => { if (!S.liked.has(p.id)) setLike(true, true); else heart.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.35)', opacity: 0 }], { duration: 600 }); } }, heart);
    const cm = h('div', { class: 'msta-cms' }, p.c.map(([u, tx]) => h('p', {}, h('b', {}, u + ' '), tx)));
    return h('article', { class: 'msta-post' }, h('div', { class: 'msta-ph' }, avatar(p.mine ? S.me.avatar : (USERS.find(u => u[0] === p.u) || USERS[0])[2], 32, true), h('span', {}, h('b', {}, p.u), p.loc ? h('small', {}, p.loc) : null), h('button', { class: 'msta-b', 'aria-label': T('Plus', 'More'), html: svg(I.more, 22) })), img,
      h('div', { class: 'msta-pa' }, btn, h('button', { class: 'msta-b', 'aria-label': T('Commenter', 'Comment'), onclick: () => commentSheet(p), html: svg(I.comment, 26) }), h('button', { class: 'msta-b', 'aria-label': T('Partager', 'Share'), onclick: () => flash(T('Lien copié dans le presse-papiers.', 'Link copied to the clipboard.')), html: svg(I.send, 26) }), h('span', { class: 'msta-gap' }), sv),
      h('div', { class: 'msta-pt' }, likes, h('p', {}, h('b', {}, p.u + ' '), p.cap), p.c.length ? h('button', { class: 'msta-link mut', onclick: () => commentSheet(p) }, T(`Voir les ${p.c.length} commentaires`, `View all ${p.c.length} comments`)) : null, cm, h('small', {}, p.ago)));
  }
  function story(i) {
    const items = [[S.me.u, S.me.avatar, 'tes_winterhold'], ...USERS.slice(0, 5).map(u => [u[0], u[2], u[1]])]; let idx = i, timer = 0; const cur = () => items[idx];
    const sv = h('div', { class: 'msta-story' }), bars = h('div', { class: 'msta-sbars' }), close = () => { clearTimeout(timer); sv.remove(); }, next = () => { clearTimeout(timer); if (idx >= items.length - 1) return close(); idx++; draw(); }, prev = () => { clearTimeout(timer); idx = Math.max(0, idx - 1); draw(); };
    function draw() { sv.innerHTML = ''; bars.innerHTML = ''; items.forEach((_, k) => bars.append(h('i', { class: k < idx ? 'done' : k === idx ? 'run' : '' }, h('b', {})))); const [u, av, im] = cur();
      sv.append(h('div', { class: 'msta-simg', style: { backgroundImage: `url(${ph(im)})` } }), bars, h('div', { class: 'msta-sh' }, avatar(av, 32), h('b', {}, u), h('small', {}, T('3 h', '3h')), h('span', { class: 'msta-gap' }), h('button', { class: 'msta-b', onclick: close, 'aria-label': T('Fermer', 'Close'), html: svg(I.x, 24) })), h('button', { class: 'msta-sl', 'aria-label': T('Précédent', 'Previous'), onclick: prev }), h('button', { class: 'msta-sr', 'aria-label': T('Suivant', 'Next'), onclick: next }), h('div', { class: 'msta-sm' }, h('span', {}, T('Envoyer un message', 'Send message')), h('i', { html: svg(I.heart, 22) }))); sfx.tick(); timer = setTimeout(() => { if (!alive()) return; next(); }, 4200); timers.add(timer); }
    over.append(sv); draw();
  }
  function feed() {
    const stories = h('div', { class: 'msta-stories' }, [[T('Votre story', 'Your story'), S.me.avatar, true], ...USERS.slice(0, 5).map(u => [u[0].split('.')[0], u[2], false])].map(([n, a, me], i) => h('button', { class: 'msta-st', onclick: () => story(i) }, h('span', { class: 'msta-ring' + (me ? ' me' : '') }, avatar(a, 62)), h('small', {}, n))));
    view.append(stories, ...S.posts.map(postEl), h('p', { class: 'msta-end' }, T('Vous êtes à jour.', 'You’re all caught up.')));
  }
  let exploreQ = '';
  function filterExplore(q) { exploreQ = q.trim().toLowerCase(); const g = view.querySelector('.msta-xg'); if (g) fillExplore(g); }
  function fillExplore(g) { g.innerHTML = ''; const list = EXPLORE.filter(n => !exploreQ || n.includes(exploreQ) || exploreQ.length < 2); list.forEach((n, i) => g.append(h('button', { class: 'msta-x' + (i % 10 === 0 ? ' big' : ''), style: { backgroundImage: `url(${th(n)})` }, 'aria-label': n, onclick: () => openPhoto(n) }))); if (!list.length) g.append(h('p', { class: 'msta-end' }, T('Aucun résultat.', 'No results.'))); }
  function openPhoto(n) { S.keep = { photo: n }; const p = { id: 'x' + n, u: USERS[EXPLORE.indexOf(n) % USERS.length][0], img: n, cap: '', likes: 300 + (EXPLORE.indexOf(n) * 137) % 900, ago: T('il y a 3 jours', '3 days ago'), c: [] }; go('photo', { p }); }
  function reels() { view.append(...REELS.map(([u, im, cap, au], i) => { let liked = false; const lk = h('button', { class: 'msta-b', 'aria-label': T('J’aime', 'Like'), html: svg(I.heart, 30), onclick: () => { liked = !liked; lk.classList.toggle('on', liked); liked ? sfx.pop() : sfx.tick(); } });
    return h('section', { class: 'msta-reel', style: { backgroundImage: `url(${ph(im)})` } }, h('div', { class: 'msta-rside' }, lk, h('button', { class: 'msta-b', html: svg(I.comment, 30) }), h('button', { class: 'msta-b', html: svg(I.send, 30) }), h('button', { class: 'msta-b', html: svg(I.more, 28) })), h('div', { class: 'msta-rinfo' }, h('div', { class: 'msta-ru' }, avatar((USERS.find(x => x[0] === u) || USERS[0])[2], 32), h('b', {}, u), h('button', { class: 'msta-fol' }, T('Suivre', 'Follow'))), h('p', {}, cap), h('small', { html: svg(I.audio, 14) + ' ' + au }))); })); }
  function profile() {
    const m = S.me, posts = [...S.myPosts || [], ...m.posts]; const n = posts.length;
    view.append(h('div', { class: 'msta-prof' }, h('div', { class: 'msta-pr1' }, avatar(m.avatar, 86, true), h('div', { class: 'msta-stats' }, [[n, T('publications', 'posts')], [fmt(m.followers), T('abonnés', 'followers')], [fmt(m.following), T('abonnements', 'following')]].map(([v, l]) => h('span', {}, h('b', {}, v), l)))),
      h('div', { class: 'msta-bio' }, h('b', {}, m.name), h('p', {}, m.bio), m.site ? h('a', { href: '#', class: 'msta-site', onclick: e => { e.preventDefault(); flash(T('Ouvre ' + m.site + ' dans le navigateur.', 'Opens ' + m.site + ' in the browser.')); } }, m.site.replace(/^https?:\/\//, '')) : null),
      h('div', { class: 'msta-pb' }, h('button', { class: 'msta-gb', onclick: () => go('edit') }, T('Modifier le profil', 'Edit profile')), h('button', { class: 'msta-gb', onclick: () => flash(T('Lien du profil copié.', 'Profile link copied.')) }, T('Partager le profil', 'Share profile'))),
      h('div', { class: 'msta-hl' }, [T('Voyages', 'Travel'), T('Atelier', 'Studio'), T('Notes', 'Notes')].map((l, i) => h('button', { class: 'msta-st', onclick: () => story(0) }, h('span', { class: 'msta-ring' }, avatar(['tes_hrothgar', 'tes_markarth', 'dune'][i], 54)), h('small', {}, l)))),
      h('div', { class: 'msta-ptabs' }, [['grid', I.grid], ['reels', I.reels], ['tag', I.tag]].map(([k, g]) => h('button', { class: S.tab === k ? 'on' : '', 'aria-label': k, onclick: () => { S.tab = k; render(true); } }, h('i', { html: svg(g, 24) })))),
      S.tab === 'grid' ? h('div', { class: 'msta-pg' }, posts.map(p => h('button', { class: 'msta-x', style: { backgroundImage: `url(${p.src || th(p.img)})` }, onclick: () => p.src ? flash(T('Votre publication.', 'Your post.')) : openPhoto(p.img) }))) : h('p', { class: 'msta-end big' }, T('Rien à afficher pour l’instant.', 'Nothing to show yet.'))));
  }
  let draft = null;
  function edit() {
    draft = draft || { name: S.me.name, u: S.me.u, site: S.me.site, bio: S.me.bio };
    const f = (k, label, ph2, o = {}) => h('label', { class: 'msta-f' }, h('span', {}, label), o.area ? h('textarea', { rows: 3, value: draft[k], maxlength: 150, 'aria-label': label, oninput: e => { draft[k] = e.target.value; cnt && (cnt.textContent = `${draft.bio.length} / 150`); } }, draft[k]) : h('input', { value: draft[k], placeholder: ph2, 'aria-label': label, oninput: e => { draft[k] = e.target.value; }, spellcheck: 'false' }), o.hint ? h('small', {}, o.hint) : null);
    let cnt = null;
    view.append(h('div', { class: 'msta-edit' }, h('div', { class: 'msta-ea' }, avatar(S.me.avatar, 78), h('button', { class: 'msta-link', onclick: () => flash(T('Choisir une photo : disponible dans l’appli complète.', 'Choose a photo: available in the full app.')) }, T('Changer la photo de profil', 'Change profile photo'))),
      f('name', T('Nom', 'Name'), ''), f('u', T('Nom d’utilisateur', 'Username'), ''), f('site', T('Site web', 'Website'), 'https://', { hint: T('Vous pouvez modifier ce lien ici : la version téléphone le permet.', 'You can edit this link here: the phone version allows it.') }), f('bio', T('Bio', 'Bio'), '', { area: true }), (cnt = h('small', { class: 'msta-cnt' }, `${draft.bio.length} / 150`)),
      h('button', { class: 'msta-primary', onclick: () => saveProfile() }, T('Envoyer', 'Submit'))));
  }
  function saveProfile() { if (!draft) return; Object.assign(S.me, { name: draft.name.trim() || S.me.name, u: draft.u.trim() || S.me.u, site: draft.site.trim() && !/^https?:\/\//.test(draft.site.trim()) ? 'https://' + draft.site.trim() : draft.site.trim(), bio: draft.bio }); draft = null; S.banner = T('Profil enregistré.', 'Profile saved.'); sfx.done(); const p = S.stack.pop(); S.screen = p ? p.screen : 'profile'; S.keep = {}; render(); flash(S.banner); }
  function photoScreen() { const p = S.keep.p; view.append(postEl(p)); }
  function commentSheet(p) {
    const list = h('div', { class: 'msta-cl' }, [[p.u, p.cap], ...p.c].filter(c => c[1]).map(([u, tx]) => h('div', { class: 'msta-cr' }, avatar((USERS.find(x => x[0] === u) || USERS[0])[2], 32), h('p', {}, h('b', {}, u + ' '), tx)))), inp = h('input', { placeholder: T('Ajouter un commentaire…', 'Add a comment…'), 'aria-label': T('Ajouter un commentaire', 'Add a comment'), onkeydown: e => { if (e.key === 'Enter') send(); } });
    const send = () => { const v = inp.value.trim(); if (!v) return; p.c.push([S.me.u, v]); inp.value = ''; list.append(h('div', { class: 'msta-cr' }, avatar(S.me.avatar, 32), h('p', {}, h('b', {}, S.me.u + ' '), v))); list.scrollTop = list.scrollHeight; sfx.pop(); };
    const sh = h('div', { class: 'msta-sheet' }, h('i', { class: 'msta-grab' }), h('b', { class: 'msta-sht' }, T('Commentaires', 'Comments')), list, h('div', { class: 'msta-ci' }, avatar(S.me.avatar, 32), inp, h('button', { class: 'msta-link', onclick: send }, T('Publier', 'Post'))));
    const sc = h('div', { class: 'msta-sc', onpointerdown: e => { if (e.target === sc) { sh.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 200 }).onfinish = () => { sc.remove(); render(true); }; } } }, sh); over.append(sc); sh.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: reduced() ? 1 : 260, easing: 'cubic-bezier(.2,.8,.3,1)' }); requestAnimationFrame(() => inp.focus({ preventScroll: true }));
  }
  function compose() {
    let pick = null, step = 0, cap = ''; const sc = h('div', { class: 'msta-sc full' }), close = () => sc.remove();
    const draw = () => { sc.innerHTML = '';
      if (step === 0) sc.append(h('div', { class: 'msta-new' }, h('div', { class: 'msta-hd' }, h('button', { class: 'msta-b', onclick: close, 'aria-label': T('Fermer', 'Close'), html: svg(I.x, 26) }), h('b', {}, T('Nouvelle publication', 'New post')), h('button', { class: 'msta-link', disabled: !pick, onclick: () => { step = 1; draw(); } }, T('Suivant', 'Next'))),
        h('div', { class: 'msta-npv', style: pick ? { backgroundImage: `url(${ph(pick)})` } : {} }, pick ? null : h('p', {}, T('Choisissez une photo', 'Choose a photo'))), h('p', { class: 'msta-nl' }, T('Récentes', 'Recents')), h('div', { class: 'msta-ng' }, NEWPICK.map(n => h('button', { class: 'msta-x' + (pick === n ? ' sel' : ''), style: { backgroundImage: `url(${th(n)})` }, 'aria-label': n, onclick: () => { pick = n; sfx.tick(); draw(); } }, pick === n ? h('b', {}, '1') : null)))));
      else sc.append(h('div', { class: 'msta-new' }, h('div', { class: 'msta-hd' }, h('button', { class: 'msta-b', onclick: () => { step = 0; draw(); }, html: svg(I.back, 26) }), h('b', {}, T('Nouvelle publication', 'New post')), h('button', { class: 'msta-link', onclick: share }, T('Partager', 'Share'))), h('div', { class: 'msta-cap' }, h('i', { class: 'msta-tn', style: { backgroundImage: `url(${th(pick)})` } }), h('textarea', { rows: 4, placeholder: T('Rédigez une légende…', 'Write a caption…'), 'aria-label': T('Légende', 'Caption'), oninput: e => { cap = e.target.value; } }, cap)), h('p', { class: 'msta-row' }, T('Ajouter un lieu', 'Add location')), h('p', { class: 'msta-row' }, T('Identifier des personnes', 'Tag people')), h('p', { class: 'msta-row' }, T('Aussi publier sur Facebook', 'Also post to Facebook'))));
    };
    function share() { const src = ph(pick); S.myPosts = [{ img: pick, src: th(pick) }, ...(S.myPosts || [])]; S.posts.unshift({ id: S.nextId++, mine: true, u: S.me.u, src, img: pick, cap: cap.trim() || '', likes: 0, ago: T('à l’instant', 'just now'), c: [] }); sfx.done(); close(); S.stack = []; S.screen = 'home'; S.keep = {}; render(); flash(T('Publication partagée.', 'Post shared.')); }
    over.append(sc); draw(); sc.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: reduced() ? 1 : 280, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }
  function render(keepScroll) {
    const sy = keepScroll ? view.scrollTop : 0; view.innerHTML = ''; view.classList.toggle('flush', S.screen === 'reels');
    ({ home: feed, search: () => { view.append(h('div', { class: 'msta-xg' })); fillExplore(view.firstChild); }, reels, profile, edit, photo: photoScreen })[S.screen](); drawTop(); drawTabs(); view.scrollTop = sy;
  }

  const phone = h('div', { class: 'msta-phone' }, dev);
  root.append(h('div', { class: 'msta-wrap' }, phone), strip); w.el.style.background = 'transparent';
  render(); setTimeout(() => finishIsland(S.finish), 600);
  const onKey = e => { if (!alive()) return document.removeEventListener('keydown', onKey); if (!w.el.classList.contains('active')) return; if (e.key === 'Escape') { const st = over.querySelector('.msta-story'); if (st) { st.remove(); return; } const s2 = over.querySelector('.msta-sc'); if (s2) s2.remove(); } };
  document.addEventListener('keydown', onKey);
  return root;
}
