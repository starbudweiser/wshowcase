/* hERALD : réplique de l'appli. Plan de communication pour moddeurs : calendrier, suivi, brouillons en 4 langues, statistiques, retours, veille, canaux, et (en option)
   discussion avec un agent IA. Règle d'or : hERALD prépare et suit, il ne publie JAMAIS rien. Données d'exemple, aucun réseau. */
import { h, brand, wait, reduced, stream, toast, icon, S, sfx, wm, T, num, css } from './kit.js';

const HC = '#f39200';
const P = {
  l: '<path d="m15 6-6 6 6 6"/>', r: '<path d="m9 6 6 6-6 6"/>', trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>', flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>', spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  nexus: '<path d="M3 8 12 3l9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>', reddit: '<path d="M4 5h11v8H9l-3 3v-3H4zM18 9h2v8h-2v3l-3-3h-5v-2"/>', discord: '<path d="M4 5h16v11H9l-5 4z"/>', youtube: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>', github: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>', bluesky: '<circle cx="12" cy="12" r="4"/><path d="M16 12v2a3 3 0 0 0 6 0v-2a10 10 0 1 0-4 8"/>', instagram: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="4"/>', forum: '<path d="M4 4h16v12H10l-4 4v-4H4z"/>', other: '<path d="M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 0 1 0 6"/>', site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
};
const ic = (k, s = 14, c = '') => h('span', { class: 'hd-ic ' + c, html: `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || P.other}</svg>` });
const fill = (el, ...k) => { el.replaceChildren(...k.flat(Infinity).filter(x => x != null && x !== false)); return el; };
const LG = () => T('fr-FR', 'en-US');
const day = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d.getTime(); };
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const fday = t => new Date(t).toLocaleDateString(LG(), { dateStyle: 'medium' });
const fdt = t => new Date(t).toLocaleString(LG(), { dateStyle: 'medium', timeStyle: 'short' });
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const daysLeft = c => Math.round((new Date(c.event).setHours(12, 0, 0, 0) - day(0)) / 864e5);
const STS = () => [['idea', T('Idée', 'Idea')], ['draft', T('Brouillon', 'Draft')], ['approved', T('Validé', 'Approved')], ['published', T('Publié', 'Published')]];
const SK = { idea: '', draft: 'wn', approved: 'ac', published: 'ok' };
const KINDS = () => [['nexus', 'Nexus Mods'], ['reddit', 'Reddit'], ['discord', 'Discord'], ['youtube', 'YouTube'], ['github', 'GitHub'], ['x', 'X'], ['bluesky', 'Bluesky'], ['instagram', 'Instagram'], ['forum', 'Forum'], ['other', T('Autre', 'Other')]];
const MSK = () => [['teaser', 'Teaser'], ['announce', T('Annonce (Jour J)', 'Announcement (D-day)')], ['followup', T('Suivi', 'Follow-up')], ['other', T('Autre', 'Other')]];
const FBK = () => [['comment', T('Commentaires', 'Comments')], ['downloads', T('Téléchargements', 'Downloads')], ['endorsements', 'Endorsements'], ['stars', T('Étoiles', 'Stars')], ['views', T('Vues', 'Views')], ['other', T('Autre', 'Other')]];
const PLAT = { youtube: ['YouTube', '#ef4444'], reddit: ['Reddit', '#f97316'], bluesky: ['Bluesky', '#38a0f5'], github: ['GitHub', '#9ca3af'], nexus: ['Nexus Mods', '#f59e0b'], site: [T('Site web', 'Website'), '#4ade80'], instagram: ['Instagram', '#d4537d'], discord: ['Discord', '#8b8ff8'], other: [T('Autre', 'Other'), '#9ca3af'] };

/* ---------- Données d'exemple (campagne en cours : lancement il y a 2 jours) ---------- */
function makeData() {
  let n = 0; const id = () => 'i' + ++n;
  const chans = [['Nexus Mods', 'nexus', 'https://www.nexusmods.com', T('Page du mod, actualités et commentaires : le canal principal des joueurs.', 'Mod page, news and comments: the main channel for players.')],
    ['Reddit', 'reddit', 'https://www.reddit.com', T('Choisissez le sous-forum adapté et respectez ses règles d’auto-promotion (souvent 1 post par mois, avec flair). Pas de relance.', 'Pick the right subreddit and follow its self-promotion rules (often 1 post a month, with flair). No bumping.')],
    ['Discord', 'discord', 'https://discord.com', T('Un message par serveur, seulement dans les salons prévus.', 'One message per server, only in the intended channels.')], ['YouTube', 'youtube', 'https://studio.youtube.com', T('Vidéo de présentation + vidéos courtes verticales, sous-titrées.', 'Presentation video + short vertical videos, with subtitles.')],
    ['GitHub Releases', 'github', 'https://github.com', ''], ['Bluesky / X', 'bluesky', 'https://bsky.app', ''], ['Instagram', 'instagram', 'https://www.instagram.com', T('Visuels et vidéos courtes ; un lien unique en bio.', 'Visuals and short videos; a single link in bio.')]].map(([name, kind, url, notes]) => ({ id: id(), name, kind, url, notes }));
  const ch = k => chans.find(c => c.kind === k).id;
  const camp = (name, L, notes, live) => {
    const ms = [[T('Préparation', 'Preparation'), -14, 'other'], [T('Teaser (J-7)', 'Teaser (D-7)'), -7, 'teaser'], [T('Aperçus (J-3)', 'Previews (D-3)'), -3, 'teaser'], [T('Sortie (Jour J)', 'Release (D-day)'), 0, 'announce'], [T('Suivi et retours', 'Follow-up and feedback'), 3, 'followup'], [T('Bilan (J+30)', 'Review (D+30)'), 30, 'followup']].map(([title, o, kind]) => ({ id: id(), title, t: L + o * 864e5, kind }));
    const P0 = (k, o, kind, m, status, extra = {}) => ({ id: id(), title: k, t: L + o * 864e5, ch: ch(kind), ms: ms[m].id, status: live ? status : (status === 'published' || status === 'approved' ? 'draft' : status), link: '', notes: '', drafts: {}, fb: [], ...extra });
    const lk = (u, live2) => (live ? u : '');
    const posts = [
      P0(T('Page du mod et fichiers prêts', 'Mod page and files ready'), -12, 'nexus', 0, 'published', { link: lk('https://www.nexusmods.com/skyrimspecialedition/mods/48210') }), P0(T('Captures, bannière et courte vidéo', 'Screenshots, banner and short video'), -10, 'instagram', 0, 'published', { link: lk('https://www.instagram.com/p/C9xAbCd/') }),
      P0(T('Teaser : quelque chose arrive', 'Teaser: something is coming'), -7, 'bluesky', 1, 'published', { link: lk('https://bsky.app/profile/aelwyn.bsky.social/post/3kq2'), drafts: { fr: 'Quelque chose arrive dans 7 jours… 👀\nAncient Realms HD 1.4 : des montagnes en 4K, sans toucher à vos performances.\nRendez-vous le jour J !', en: 'Something is coming in 7 days… 👀\nAncient Realms HD 1.4: 4K mountains without hurting your performance.\nSee you on D-day!', es: 'Algo llega dentro de 7 días… 👀\nAncient Realms HD 1.4: montañas en 4K sin castigar tu rendimiento.\n¡Nos vemos el día D!', it: 'Qualcosa arriva tra 7 giorni… 👀\nAncient Realms HD 1.4: montagne in 4K senza pesare sulle prestazioni.\nAppuntamento al giorno D!' } }),
      P0(T('Visuel teaser', 'Teaser visual'), -7, 'instagram', 1, 'published', { link: lk('https://www.instagram.com/p/C9yEfGh/') }), P0(T('Aperçu de la fonction principale', 'Preview of the main feature'), -3, 'discord', 2, 'published', { link: lk('https://discord.com/channels/1/2/3') }),
      P0(T('Vidéo courte de démonstration', 'Short demo video'), -2, 'youtube', 2, 'published', { link: lk('https://www.youtube.com/shorts/aB3dEf9GhIj') }),
      P0(T('Annonce de sortie sur Reddit', 'Release announcement on Reddit'), 0, 'reddit', 3, 'published', { link: lk('https://www.reddit.com/r/skyrimmods/comments/1abc2de/'), drafts: { fr: 'Ancient Realms HD 1.4 est disponible : des paysages en 4K sans sacrifier les performances\n\nBonjour à tous,\n\nJe viens de publier Ancient Realms HD 1.4, un projet fait sur mon temps libre :\n\n- Textures de terrain en 4K, packs 8K et Lite 2K\n- Mipmaps régénérées pour de meilleures performances\n- Compatible avec ENB et Community Shaders\n\nTéléchargement : https://www.nexusmods.com/skyrimspecialedition/mods/48210\n\nVos retours, bugs et idées sont les bienvenus. Merci d’avance !', en: 'Ancient Realms HD 1.4 is out: 4K landscapes without sacrificing performance\n\nHi everyone,\n\nI’ve just released Ancient Realms HD 1.4, a project I build in my spare time:\n\n- 4K terrain textures, with 8K and Lite 2K packs\n- Regenerated mipmaps for better performance\n- Works with ENB and Community Shaders\n\nDownload: https://www.nexusmods.com/skyrimspecialedition/mods/48210\n\nFeedback, bug reports and ideas are very welcome. Thanks in advance!' } }),
      P0(T('Page Nexus publiée', 'Nexus page published'), 0, 'nexus', 3, 'published', { link: lk('https://www.nexusmods.com/skyrimspecialedition/mods/48210'), drafts: { fr: 'Ancient Realms HD — des paysages en 4K\n\nTextures de terrain, de roches et de montagnes. Prérequis, installation et ordre de chargement ci-dessous.\nVos retours sont les bienvenus dans les commentaires.', en: 'Ancient Realms HD — 4K landscapes\n\nTerrain, rock and mountain textures. Requirements, installation and load order below.\nFeedback is welcome in the comments.' } }),
      P0(T('Vidéo de présentation', 'Presentation video'), 0, 'youtube', 3, 'approved'), P0(T('Présentation sur Discord', 'Introduction on Discord'), 0, 'discord', 3, 'draft', { drafts: { fr: 'Bonjour ! Je viens de publier Ancient Realms HD 1.4 : des paysages en 4K. Gratuit, retours bienvenus. Lien : https://www.nexusmods.com/skyrimspecialedition/mods/48210\nSi ce n’est pas le bon salon, dites-le-moi et je retire le message.', en: 'Hi! I’ve just released Ancient Realms HD 1.4: 4K landscapes. Free, feedback welcome. Link: https://www.nexusmods.com/skyrimspecialedition/mods/48210\nIf this isn’t the right channel, let me know and I’ll remove the message.', es: '¡Hola! Acabo de publicar Ancient Realms HD 1.4: paisajes en 4K. Gratis, comentarios bienvenidos. Enlace: https://www.nexusmods.com/skyrimspecialedition/mods/48210\nSi este no es el canal adecuado, decídmelo y retiro el mensaje.', it: 'Ciao! Ho appena pubblicato Ancient Realms HD 1.4: paesaggi in 4K. Gratis, commenti benvenuti. Link: https://www.nexusmods.com/skyrimspecialedition/mods/48210\nSe non è il canale giusto, ditemelo e rimuovo il messaggio.' } }),
      P0(T('Post « merci et retours »', '“Thanks and feedback” post'), 7, 'reddit', 4, 'idea'), P0(T('Bilan et prochaine version', 'Review and next version'), 30, 'github', 5, 'idea')];
    return { id: id(), name, event: L, notes, ms, posts, live, brief: '' };
  };
  const L0 = day(-2), L1 = day(21);
  const c1 = camp(T('Lancement d’Ancient Realms HD 1.4', 'Ancient Realms HD 1.4 launch'), L0, T('Campagne d’exemple, à adapter ou à supprimer.\nMessage central : des paysages en 4K qui ne coûtent pas de performances.', 'Example campaign, to adapt or delete.\nKey message: 4K landscapes that do not cost performance.'), true);
  /* retours, relevés (vues, j'aime…) des publications déjà faites */
  const byT = k => c1.posts.find(p => p.title === k), find = (re) => c1.posts.find(p => re.test(p.title));
  const S0 = (p, plat, d0, v) => { p.stat = { plat, d0, auto: !['instagram', 'discord'].includes(plat), ...v }; };
  S0(c1.posts[1], 'instagram', -10, { views: 820, likes: 77, comments: 6, shares: 0, dl: 0, d24: 9 }); S0(c1.posts[2], 'bluesky', -7, { views: 0, likes: 64, comments: 7, shares: 21, dl: 0, d24: 4 }); S0(c1.posts[3], 'instagram', -7, { views: 1150, likes: 98, comments: 12, shares: 3, dl: 0, d24: 14 });
  S0(c1.posts[5], 'youtube', -2, { views: 3420, likes: 210, comments: 18, shares: 0, dl: 0, d24: 612 }); S0(c1.posts[6], 'reddit', 0, { views: 0, likes: 412, comments: 58, shares: 0, dl: 0, d24: 37 }); S0(c1.posts[7], 'nexus', 0, { views: 0, likes: 96, comments: 5, shares: 0, dl: 1240, d24: 218 }); S0(c1.posts[0], 'nexus', -12, { views: 0, likes: 0, comments: 0, shares: 0, dl: 0, d24: 0 });
  const fbk = (p, a) => { p.fb = a.map(x => ({ id: id(), ...x })); };
  fbk(c1.posts[6], [{ t: day(-2) + 36e5, kind: 'comment', value: 1, author: 'dovah_fan', text: T('Superbe travail ! Est-ce que ça tourne sur une carte de 8 Go ?', 'Great work! Does it run on an 8 GB card?'), unread: true }, { t: day(-1), kind: 'comment', value: 1, author: 'stone_mage', text: T('Les montagnes de Markarth sont magnifiques, merci.', 'The Markarth mountains look gorgeous, thanks.'), unread: true }, { t: day(-1), kind: 'comment', value: 1, author: 'aela_77', text: T('Compatible avec Cathedral Landscapes ?', 'Compatible with Cathedral Landscapes?'), unread: false }]);
  fbk(c1.posts[7], [{ t: day(-1), kind: 'downloads', value: 1240, text: '' }, { t: day(-1), kind: 'endorsements', value: 96, text: '' }, { t: day(-1), kind: 'comment', value: 5, text: T('Cinq commentaires sur la page du mod', 'Five comments on the mod page') }]);
  fbk(c1.posts[5], [{ t: day(0), kind: 'views', value: 3420, text: '' }, { t: day(0), kind: 'comment', value: 18, text: T('Surtout des demandes de version 1K', 'Mostly requests for a 1K version') }]);
  fbk(c1.posts[2], [{ t: day(-6), kind: 'comment', value: 7, text: T('Réactions sympathiques sous le teaser', 'Friendly reactions under the teaser') }]);
  const c2 = camp(T('Exemple : lancement de mon mod', 'Example: my mod’s launch'), L1, T('Campagne d’exemple, à adapter ou à supprimer.', 'Example campaign, to adapt or delete.'), false);
  c2.posts.forEach(p => { p.status = ['idea', 'draft'].includes(p.status) ? p.status : 'idea'; });
  const watch = [{ id: id(), name: 'Community Shaders', kind: 'github', ref: 'doodlum/skyrim-community-shaders', notes: '', checked: Date.now() - 4 * 864e5, hist: [{ t: Date.now() - 20 * 864e5, v: 'v1.1.2', pub: Date.now() - 21 * 864e5 }, { t: Date.now() - 6 * 864e5, v: 'v1.1.4', pub: Date.now() - 7 * 864e5 }] },
    { id: id(), name: 'Address Library for SKSE Plugins', kind: 'nexus', ref: 'skyrimspecialedition/32444', notes: '', checked: Date.now() - 4 * 864e5, hist: [{ t: Date.now() - 4 * 864e5, v: '11.1', pub: Date.now() - 34 * 864e5, dl: 2871950, end: 118402 }] }];
  return { camps: [c1, c2], chans, watch, id };
}
const AGENT_DRAFT = () => ({ fr: 'Bonjour ! Ancient Realms HD 1.4 est sorti : des paysages en 4K, avec des mipmaps régénérées pour garder vos images par seconde. Gratuit, retours bienvenus.\nLien : https://www.nexusmods.com/skyrimspecialedition/mods/48210\n(Un seul message, dans le salon prévu pour les mods.)', en: 'Hi! Ancient Realms HD 1.4 is out: 4K landscapes, with regenerated mipmaps to protect your frame rate. Free, feedback welcome.\nLink: https://www.nexusmods.com/skyrimspecialedition/mods/48210\n(One message, in the room meant for mods.)' });


/* Nom de l'appli : lettre minuscule colorée dans tous les textes (CSS Custom Highlight API, sans toucher au DOM), sauf dans les menus déroulants. */
function brandHL(root, name, key) {
  if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return () => {};
  const k = [...name].findIndex(c => c >= 'a' && c <= 'z'); let raf = 0;
  const run = () => {
    raf = 0; const rs = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.includes(name) && !n.parentElement.closest('.lc,.hd-pop,option,textarea,script,style') ? 1 : 3) });
    for (let n; (n = tw.nextNode());) { let i = -1; while ((i = n.nodeValue.indexOf(name, i + 1)) >= 0) { const r = new Range(); r.setStart(n, i + k); r.setEnd(n, i + k + 1); rs.push(r); } }
    CSS.highlights.set(key, new Highlight(...rs));
  };
  const obs = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); }); obs.observe(root, { childList: true, subtree: true, characterData: true }); run();
  return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); CSS.highlights.delete(key); };
}

export function open(app) {
  css('css/demos/hERALD.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, minw: 1040, minh: 620, bare: true, cls: 'socle hd-win',
    onclose: w => { w.dead = true; w.unbrand && w.unbrand(); removeEventListener('keydown', w.esc, true); removeEventListener('pointerdown', w.away, true); },
    build: w => {
      const alive = () => !w.dead, D = makeData();
      const st = { tab: 'calendar', ci: 0, sel: null, filter: null, month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(), period: 'campaign', agent: true, agentOpen: false, scopeTask: false, lang: ['fr', 'en'].includes(T('fr', 'en')) ? T('fr', 'en') : 'en', fbSel: null, wsel: 'report', sbusy: false, wbusy: false, checked: Date.now() - 36e5, extra: 0 };
      const C = () => D.camps[st.ci] || null, chOf = p => D.chans.find(c => c.id === p.ch);
      const root = h('div', { class: 'hd' }), side = h('aside', { class: 'hd-side' }), main = h('main', { class: 'hd-main' }), agentEl = h('aside', { class: 'hd-agent', hidden: true }), modal = h('div', { class: 'hd-scrim', hidden: true }), pop = h('div', { class: 'hd-pop', hidden: true });
      root.append(h('div', { class: 'hd-title', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('hERALD', HC) })), side, main, agentEl, modal, pop);
      const eHead = h('div'), eRule = h('div'), eTabs = h('div'), ePane = h('div', { class: 'hd-pane' });
      main.append(eHead, eRule, eTabs, ePane);

      /* --- composants --- */
      const demo = m => toast({ icon: icon(app.id), title: 'hERALD', body: m });
      const btn = (l, cls, fn, o = {}) => h('button', { class: 'hd-b ' + (cls || ''), onclick: fn, ...o }, l);
      const badge = (t, k = '') => h('span', { class: 'hd-badge ' + k }, t);
      const stBadge = s => badge(STS().find(x => x[0] === s)[1], SK[s]);
      const empty = t => h('div', { class: 'hd-empty' }, t);
      const seg = (opts, cur, fn) => h('div', { class: 'hd-seg' }, opts.map(([k, l]) => h('button', { class: k === cur ? 'on' : '', onclick: () => { sfx.tick(); fn(k); } }, l)));
      const lbl = (t, ...k) => h('div', { class: 'hd-fld' }, h('div', { class: 'hd-lbl' }, t), ...k);
      const chk = (label, on, fn) => h('label', { class: 'hd-chk' }, h('input', { type: 'checkbox', checked: on, onchange: e => { sfx.tick(); fn(e.target.checked); } }), h('i', {}), h('span', {}, label));
      const copyBtn = (label, textFn, cls, dis) => { const b = h('button', { class: 'hd-b ' + (cls || ''), disabled: dis, onclick: async () => { try { await navigator.clipboard.writeText(textFn()); } catch {} sfx.pop(); const o = b.textContent; b.textContent = T('Copié ✓', 'Copied ✓'); setTimeout(() => { if (alive()) b.textContent = o; }, 2000); } }, label); return b; };
      const callout = (k, t) => h('div', { class: 'hd-call ' + k }, ic(k === 'wn' ? 'warn' : 'info', 16), h('span', {}, t));
      const input = (v, fn, o = {}) => h('input', { class: 'hd-in', value: v, oninput: e => fn(e.target.value), ...o });
      const select = (opts, v, fn, cls) => h('select', { class: 'hd-sel ' + (cls || ''), onchange: e => fn(e.target.value) }, opts.map(([k, l]) => h('option', { value: k, selected: k === v }, l)));
      const chip = (c, o = 'hd-cnt') => h('span', { class: 'hd-cd ' + (daysLeft(c) <= 7 && daysLeft(c) > 0 ? 'wn' : daysLeft(c) === 0 ? 'ok' : daysLeft(c) < 0 ? '' : 'ac') }, daysLeft(c) > 0 ? `${T('J-', 'D-')}${daysLeft(c)}` : daysLeft(c) === 0 ? T('Jour J', 'D-day') : `${T('J+', 'D+')}${-daysLeft(c)}`);
      const posts = () => (C() ? C().posts : []);
      const unreadFb = () => posts().reduce((a, p) => a + p.fb.filter(f => f.unread).length, 0);
      const total = (p, k) => { const it = p.fb.filter(f => f.kind === k); return ['comment', 'other'].includes(k) ? it.reduce((a, f) => a + f.value, 0) : (it.sort((a, b) => b.t - a.t)[0] || { value: 0 }).value; };
      const showPop = (items, x, y) => { pop.replaceChildren(...items.map(it => (it === '-' ? h('hr') : h('button', { class: 'hd-mi', onclick: () => { hidePop(); it[1](); } }, it[0])))); pop.hidden = false; const r = root.getBoundingClientRect(), s = S.scale || 1; pop.style.left = Math.min(x - r.left, r.width * 1 - 220) / s + 'px'; pop.style.top = (y - r.top) / s + 'px'; };
      const hidePop = () => { pop.hidden = true; };
      w.away = e => { if (!pop.hidden && !pop.contains(e.target)) hidePop(); }; addEventListener('pointerdown', w.away, true);
      const closeModal = () => { modal.hidden = true; modal.replaceChildren(); };
      const sheet = (title, content, foot, wd) => { modal.replaceChildren(h('div', { class: 'hd-sheet', style: { width: wd || '600px' } }, h('div', { class: 'hd-sbody hd-scroll' }, h('h2', { class: 'hd-h2' }, title), content), h('div', { class: 'hd-sfoot' }, foot))); modal.hidden = false; const f = modal.querySelector('input:not([readonly])'); if (f) f.focus({ preventScroll: true }); };
      w.esc = e => { if (e.key === 'Escape' && S.active === w) { if (!pop.hidden) { hidePop(); e.stopPropagation(); } else if (!modal.hidden) { e.preventDefault(); e.stopPropagation(); closeModal(); } } }; addEventListener('keydown', w.esc, true);

      /* --- barre latérale : campagnes --- */
      function drawSide() {
        side.hidden = st.agentOpen && st.agent;
        fill(side, h('div', { class: 'hd-sh' }, h('span', { class: 'hd-eyebrow' }, T('CAMPAGNES', 'CAMPAIGNS')), h('button', { class: 'hd-ib', title: T('Nouvelle campagne', 'New campaign'), 'aria-label': T('Nouvelle campagne', 'New campaign'), onclick: addCampaign }, ic('plus', 15))),
          h('div', { class: 'hd-list hd-scroll' }, D.camps.map((c, i) => { const pub = c.posts.filter(p => p.status === 'published').length; return h('button', { class: 'hd-row' + (i === st.ci ? ' on' : ''), onclick: () => { st.ci = i; st.sel = null; sfx.tick(); draw(); },
            oncontextmenu: e => { e.preventDefault(); showPop([[T('Modifier la campagne', 'Edit campaign'), () => { st.ci = i; draw(); campaignSheet(); }], [T('Supprimer la campagne', 'Delete campaign'), () => delCampaign(c)]], e.clientX, e.clientY); } },
            h('span', { class: 'hd-nm' }, c.name), h('span', { class: 'hd-r2' }, h('small', {}, fday(c.event)), h('span', { class: 'sp' }), chip(c)), h('span', { class: 'hd-bar' }, h('i', { style: { width: (c.posts.length ? pub / c.posts.length * 100 : 0) + '%' } }))); })));
      }
      function addCampaign() { const c = { id: D.id(), name: T('Nouvelle campagne', 'New campaign'), event: day(30), notes: '', ms: [], posts: [], brief: '' }; D.camps.push(c); st.ci = D.camps.length - 1; st.sel = null; sfx.pop(); draw(); campaignSheet(); }
      function delCampaign(c) { sheet(T('Supprimer la campagne', 'Delete campaign'), h('p', { class: 'hd-p' }, T(`Supprimer la campagne « ${c.name} » et toutes ses publications ?`, `Delete the campaign “${c.name}” and all its posts?`)), [btn(T('ANNULER', 'CANCEL'), '', closeModal), btn(T('SUPPRIMER', 'DELETE'), 'dg', () => { D.camps.splice(D.camps.indexOf(c), 1); st.ci = Math.max(0, Math.min(st.ci, D.camps.length - 1)); st.sel = null; sfx.close(); closeModal(); draw(); })], '480px'); }

      /* --- en-tête, règle d'or, onglets --- */
      function drawHead() {
        const c = C();
        fill(eHead, h('div', { class: 'hd-head' }, h('b', { class: 'hd-app', html: brand('hERALD', HC) }), h('span', { class: 'hd-sub' }, T('Gestion de campagne de communication', 'Communication campaign management')), c ? [h('span', { class: 'hd-cn', title: c.name }, '·  ' + c.name), chip(c)] : null, h('span', { class: 'sp' }),
          h('button', { class: 'hd-b gh', onclick: e => { const r = e.currentTarget.getBoundingClientRect(); showPop([[T('Exporter le plan…', 'Export plan…'), exportPlan], [T('Importer un plan…', 'Import a plan…'), () => demo(T('Ouvre le sélecteur de fichier .herald (désactivé dans la démo).', 'Opens the .herald file picker (disabled in the demo).'))], [T('Ouvrir la boîte de dépôt', 'Open the drop box'), () => demo(T('Ouvre le dossier surveillé dans le Finder (désactivé dans la démo).', 'Opens the watched folder in Finder (disabled in the demo).'))], '-', [T('Ajouter la campagne d’exemple', 'Add the example campaign'), addExample]], r.left, r.bottom + 4); } }, T('Plan', 'Plan'), ic('l', 12, 'dn')),
          st.agent ? btn(T('Agent IA', 'AI agent'), st.agentOpen ? 'pri' : '', toggleAgent, { disabled: !c }) : null, btn(T('Modifier la campagne', 'Edit campaign'), '', campaignSheet, { disabled: !c }),
          h('button', { class: 'hd-b ic', title: T('Réglages', 'Settings'), 'aria-label': T('Réglages', 'Settings'), onclick: settingsSheet }, ic('gear', 16))));
        fill(eRule, h('div', { class: 'hd-rule' }, callout('in', T('Règle d’or : hERALD ne publie jamais. Il prépare et suit ; chaque envoi reste manuel, avec votre accord.', 'Golden rule: hERALD never publishes. It prepares and tracks; every post stays manual, with your approval.'))));
        const TB = [['calendar', T('Calendrier', 'Calendar')], ['tracking', T('Suivi', 'Tracking')], ['drafts', T('Brouillons', 'Drafts')], ['stats', T('Statistiques', 'Statistics')], ['feedback', T('Retours', 'Feedback')], ['watch', T('Veille', 'Monitoring')], ['channels', T('Canaux', 'Channels')]];
        fill(eTabs, h('div', { class: 'hd-tabs' }, TB.map(([k, l]) => h('button', { class: 'hd-tab' + (st.tab === k ? ' on' : ''), onclick: () => { if (st.tab === k) return; st.tab = k; sfx.tick(); drawHead(); drawPane(); } }, l, k === 'feedback' && unreadFb() ? h('b', { class: 'hd-cnt' }, unreadFb()) : null))));
      }
      const draw = () => { drawSide(); drawHead(); drawPane(); };
      function drawPane() {
        if (!C() && ['calendar', 'tracking', 'drafts', 'stats', 'feedback'].includes(st.tab)) return fill(ePane, h('div', { class: 'hd-empty col' }, h('p', {}, T('Aucune campagne. Créez-en une pour planifier vos publications.', 'No campaign yet. Create one to plan your posts.')), btn(T('Nouvelle campagne', 'New campaign'), 'pri', addCampaign)));
        fill(ePane, { calendar: calView, tracking: trackView, drafts: draftsView, stats: statsView, feedback: fbView, watch: watchView, channels: chView }[st.tab]());
        if (agentEl && st.agentOpen) paintAgent();
      }
      function exportPlan() { try { const blob = new Blob([JSON.stringify({ format: 1, campaigns: D.camps, channels: D.chans, watch: D.watch }, null, 2)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'hERALD.herald' }); a.click(); } catch {} sfx.pop(); }
      function addExample() { const L = day(21); const copy = JSON.parse(JSON.stringify(D.camps[1])); copy.id = D.id(); copy.name = T('Exemple : lancement de mon mod', 'Example: my mod’s launch') + ' (' + (D.camps.length + 1) + ')'; D.camps.push(copy); st.ci = D.camps.length - 1; sfx.pop(); draw(); }

      /* --- calendrier --- */
      function calView() {
        const c = C(), m0 = new Date(st.month), mon = T(true, false), first = m0.getDay(), off = (first - (mon ? 1 : 0) + 7) % 7, count = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate(), rows = Math.ceil((off + count) / 7);
        const wd = [...Array(7)].map((_, i) => new Date(2024, 0, 7 + i + (mon ? 1 : 0)).toLocaleDateString(LG(), { weekday: 'short' }).toUpperCase());
        const go = d => { st.month = new Date(m0.getFullYear(), m0.getMonth() + d, 1).getTime(); drawPane(); };
        const cells = [...Array(rows * 7)].map((_, i) => { const d = new Date(m0.getFullYear(), m0.getMonth(), 1 - off + i), t = d.setHours(12, 0, 0, 0), inM = d.getMonth() === m0.getMonth(), today = sameDay(t, Date.now());
          const ps = c.posts.filter(p => sameDay(p.t, t)), ms = c.ms.filter(m => sameDay(m.t, t));
          return h('div', { class: 'hd-day' + (inM ? '' : ' out') + (today ? ' today' : ''), oncontextmenu: e => { e.preventDefault(); showPop([[T('Nouvelle publication ce jour', 'New post on this day'), () => { const p = newPost(t); st.sel = p.id; st.tab = 'tracking'; draw(); }]], e.clientX, e.clientY); } },
            h('div', { class: 'hd-dn' }, h('b', {}, d.getDate()), sameDay(c.event, t) ? ic('star', 11, 'wn') : null), ms.map(m => h('div', { class: 'hd-ms', title: m.title }, m.title)),
            h('div', { class: 'hd-chips hd-scroll' }, ps.map(p => h('button', { class: 'hd-pc', title: `${chOf(p)?.name || ''} · ${p.title} · ${STS().find(x => x[0] === p.status)[1]}`, onclick: () => { st.sel = p.id; st.tab = 'tracking'; sfx.tick(); drawHead(); drawPane(); } }, h('i', { class: 'd ' + SK[p.status] }), chOf(p) ? ic(chOf(p).kind, 11, 'sub') : null, h('span', {}, p.title)))));
        });
        return h('div', { class: 'hd-cal' }, h('div', { class: 'hd-calbar' }, h('button', { class: 'hd-b ic2', 'aria-label': T('Mois précédent', 'Previous month'), onclick: () => go(-1) }, ic('l', 14)), h('h3', { class: 'hd-mh' }, new Date(st.month).toLocaleDateString(LG(), { month: 'long', year: 'numeric' }).replace(/^./, x => x.toUpperCase())), h('button', { class: 'hd-b ic2', 'aria-label': T('Mois suivant', 'Next month'), onclick: () => go(1) }, ic('r', 14)),
          btn(T('Aujourd’hui', 'Today'), 'gh', () => { st.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(); drawPane(); }), btn(T('Jour J', 'D-day'), 'gh', () => { const e = new Date(c.event); st.month = new Date(e.getFullYear(), e.getMonth(), 1).getTime(); drawPane(); }), h('span', { class: 'sp' }), STS().map(([k]) => stBadge(k))),
          h('div', { class: 'hd-wd' }, wd.map(x => h('span', {}, x))), h('div', { class: 'hd-grid', style: { gridTemplateRows: `repeat(${rows},minmax(0,1fr))` } }, cells));
      }
      function newPost(t) { const p = { id: D.id(), title: T('Nouvelle publication', 'New post'), t: t || day(0), ch: D.chans[0] && D.chans[0].id, ms: null, status: 'idea', link: '', notes: '', drafts: {}, fb: [] }; C().posts.push(p); sfx.pop(); return p; }

      /* --- suivi --- */
      function trackView() {
        const c = C(), listBox = h('div', { class: 'hd-tl' }), ed = h('div', { class: 'hd-ed hd-scroll' }), count = s => c.posts.filter(p => p.status === s).length;
        const late = p => p.status !== 'published' && new Date(p.t).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
        const paintList = () => {
          const sc0 = (listBox.querySelector('.hd-tb') || {}).scrollTop || 0;
          const rows = c.posts.filter(p => !st.filter || p.status === st.filter).sort((a, b) => a.t - b.t);
          fill(listBox, h('div', { class: 'hd-th' }, h('span', { class: 'c1' }, T('Date', 'Date')), h('span', { class: 'c2' }, T('Titre', 'Title')), h('span', { class: 'c3' }, T('Canal', 'Channel')), h('span', { class: 'c4' }, T('Statut', 'Status')), h('span', { class: 'c5' }, T('Retours', 'Feedback'))),
            h('div', { class: 'hd-tb hd-scroll' }, rows.length ? rows.map((p, i) => { const m = c.ms.find(x => x.id === p.ms), k = chOf(p); return h('button', { class: 'hd-tr' + (p.id === st.sel ? ' on' : '') + (i % 2 ? ' z' : '') + (p.status === 'published' && p.id !== st.sel ? ' dim' : ''), 'data-id': p.id, onclick: () => { st.sel = p.id; sfx.tick(); paintList(); paintEd(); } },
              h('span', { class: 'c1 ' + (late(p) ? 'dg' : '') }, fday(p.t)), h('span', { class: 'c2' }, h('b', { title: p.title }, p.title), m ? h('small', {}, m.title) : null), h('span', { class: 'c3' }, k ? ic(k.kind, 13, 'sub') : null, h('span', {}, k ? k.name : '—')), h('span', { class: 'c4' }, stBadge(p.status), p.link ? ic('link', 11, 'sub') : null), h('span', { class: 'c5' }, p.fb.length ? num(total(p, 'comment')) + ' 💬' : '—')); }) : empty(T('Aucune publication.', 'No post.')))); const tb = listBox.querySelector('.hd-tb'); if (tb) tb.scrollTop = sc0;
        };
        const paintEd = () => {
          const p = c.posts.find(x => x.id === st.sel); if (!p) return fill(ed, empty(T('Choisissez une publication.', 'Choose a post.')));
          const upd = () => paintList(), nd = Object.values(p.drafts).filter(Boolean).length;
          const date = h('input', { class: 'hd-in', type: 'date', value: iso(p.t), 'aria-label': 'Date', onchange: e => { if (e.target.value) { p.t = new Date(e.target.value + 'T12:00:00').getTime(); upd(); } } });
          const link = input(p.link, v => { p.link = v; paintList(); warnL(); }, { placeholder: 'https://…' }), warn = h('div'), warnL = () => fill(warn, p.status === 'published' && !p.link ? h('div', { class: 'hd-w' }, T('Ajoutez le lien de la publication pour la suivre.', 'Add the post’s link to track it.')) : null); warnL();
          const stSeg = h('div'), paintSeg = () => fill(stSeg, seg(STS(), p.status, k => { p.status = k; paintSeg(); warnL(); paintList(); }), h('div', { class: 'hd-meta' }, T('« Publié » se coche à la main, une fois que vous avez publié vous-même.', '“Published” is set by hand, once you have posted it yourself.'))); paintSeg();
          const notes = h('textarea', { class: 'hd-in ta', rows: 4, oninput: e => { p.notes = e.target.value; } }); notes.value = p.notes;
          fill(ed, h('div', { class: 'hd-pad' }, lbl(T('Titre', 'Title'), input(p.title, v => { p.title = v; upd(); })), h('div', { class: 'hd-two' }, lbl(T('Date', 'Date'), date), lbl(T('Canal', 'Channel'), select([['', '—'], ...D.chans.map(k => [k.id, k.name])], p.ch || '', v => { p.ch = v || null; upd(); }))),
            lbl(T('Jalon', 'Milestone'), select([['', '—'], ...c.ms.map(m => [m.id, `${fday(m.t)} · ${m.title}`])], p.ms || '', v => { p.ms = v || null; upd(); })), lbl(T('Statut', 'Status'), stSeg),
            lbl(T('Lien', 'Link'), h('div', { class: 'hd-row2' }, link, btn(T('Ouvrir', 'Open'), '', () => demo(T('Ouvre le lien de la publication (désactivé dans la démo).', 'Opens the post link (disabled in the demo).')), { disabled: !p.link })), warn), lbl('Notes', notes),
            st.agent ? btn(T('Discuter avec l’agent', 'Chat with the agent'), '', () => { st.scopeTask = true; if (!st.agentOpen) toggleAgent(); else paintAgent(); }) : null,
            h('div', { class: 'hd-row2' }, h('span', { class: 'hd-meta' }, T(`Brouillons : ${nd} langue(s) sur 4`, `Drafts: ${nd} of 4 languages`)), h('span', { class: 'sp' }), btn(T('Supprimer la publication', 'Delete post'), 'gh', () => { c.posts.splice(c.posts.indexOf(p), 1); st.sel = null; sfx.close(); paintList(); paintEd(); }))));
        };
        paintList(); paintEd();
        return h('div', { class: 'hd-trk' }, h('div', { class: 'hd-tcol' }, h('div', { class: 'hd-tbar' }, seg([['', T(`Toutes (${c.posts.length})`, `All (${c.posts.length})`)], ...STS().map(([k, l]) => [k, `${l} (${count(k)})`])], st.filter || '', k => { st.filter = k || null; drawPane(); }), h('span', { class: 'sp' }), btn(T('Nouvelle publication', 'New post'), 'pri', () => { st.sel = newPost().id; st.filter = null; drawPane(); })), listBox), ed);
      }

      /* --- brouillons --- */
      function draftsView() {
        const c = C(), ed = h('div', { class: 'hd-dedit' }), lc = h('div', { class: 'hd-lcol hd-scroll' }), LANGS = [['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['it', 'Italiano']];
        const sorted = [...c.posts].sort((a, b) => a.t - b.t); if (!st.sel || !c.posts.find(p => p.id === st.sel)) st.sel = null;
        const paintList = () => fill(lc, sorted.map(p => h('button', { class: 'hd-lr' + (p.id === st.sel ? ' on' : ''), onclick: () => { st.sel = p.id; sfx.tick(); paintList(); paintEd(); } }, h('span', { class: 'hd-l1' }, h('b', {}, p.title), h('span', { class: 'sp' }), stBadge(p.status)), h('span', { class: 'hd-l1' }, h('small', {}, `${fday(p.t)} · ${chOf(p) ? chOf(p).name : '—'}`), h('span', { class: 'sp' }), LANGS.map(([k]) => h('small', { class: 'lg' + (p.drafts[k] ? ' on' : '') }, k.toUpperCase()))))));
        const paintEd = () => {
          const p = c.posts.find(x => x.id === st.sel); if (!p) return fill(ed, empty(T('Choisissez une publication.', 'Choose a post.')));
          const k = chOf(p), cnt = h('span', { class: 'hd-meta' }), ta = h('textarea', { class: 'hd-in big', 'aria-label': 'Brouillon', oninput: e => { p.drafts[st.lang] = e.target.value; cnt.textContent = T(`${e.target.value.length} caractères`, `${e.target.value.length} characters`); paintList(); act(); } }); ta.value = p.drafts[st.lang] || ''; cnt.textContent = T(`${ta.value.length} caractères`, `${ta.value.length} characters`);
          const actEl = h('div', { class: 'hd-row2 end' }), act = () => fill(actEl, h('span', { class: 'hd-meta fl' }, T('Copiez le texte puis publiez-le vous-même sur le canal.', 'Copy the text, then post it yourself on the channel.')), k && k.url ? btn(T('Ouvrir le canal', 'Open channel'), '', () => demo(T('Ouvre le canal dans le navigateur : vous publiez vous-même (désactivé dans la démo).', 'Opens the channel in your browser: you post it yourself (disabled in the demo).'))) : null,
            ['idea', 'draft'].includes(p.status) ? btn(T('Marquer validé', 'Mark approved'), '', () => { p.status = 'approved'; sfx.pop(); paintList(); paintEd(); }, { disabled: !ta.value }) : null, copyBtn(T('COPIER', 'COPY'), () => ta.value, 'pri', !ta.value)); act();
          fill(ed, h('div', { class: 'hd-row2' }, h('div', { class: 'fl' }, h('h3', { class: 'hd-bh' }, p.title), h('div', { class: 'hd-meta' }, `${fday(p.t)} · ${k ? k.name : '—'}`)), stBadge(p.status)), k && k.notes ? h('div', { class: 'hd-notes' }, k.notes) : null,
            h('div', { class: 'hd-row2' }, seg(LANGS, st.lang, v => { st.lang = v; paintEd(); }), h('span', { class: 'sp' }), cnt), ta, actEl);
        };
        paintList(); paintEd(); return h('div', { class: 'hd-split' }, lc, ed);
      }

      /* --- statistiques --- */
      const platOf = p => (p.stat ? p.stat.plat : null);
      function statsView() {
        const c = C(), pub = c.posts.filter(p => p.status === 'published' && p.stat && p.link), per = st.period, mul = per === 'day' ? 0 : per === 'week' ? 0 : 1;
        const sum = k => pub.reduce((a, p) => a + (per === 'campaign' ? p.stat[k] : Math.round(p.stat[k] * (per === 'day' ? .06 : .3))), 0), views = sum('views'), inter = sum('likes') + sum('comments') + sum('shares'), dls = sum('dl'), site = per === 'campaign' ? 2860 : per === 'week' ? 940 : 212;
        const kpi = (l, v, sub) => h('div', { class: 'hd-tile' }, h('div', { class: 'hd-eyebrow' }, l), h('div', { class: 'hd-val' }, v == null ? '—' : num(v)), h('div', { class: 'hd-meta' }, sub));
        const best = [...pub].sort((a, b) => b.stat.d24 - a.stat.d24)[0];
        const pl = {}; pub.forEach(p => { const q = pl[p.stat.plat] || (pl[p.stat.plat] = { v: 0, i: 0, d: 0 }); q.v += p.stat.views; q.i += p.stat.likes + p.stat.comments + p.stat.shares; q.d += p.stat.dl; });
        const sBtn = btn(T('ACTUALISER', 'REFRESH'), 'pri', async () => { if (st.sbusy) return; st.sbusy = true; sfx.click(); drawPane(); await wait(reduced() ? 0 : 1300); if (!alive()) return; pub.filter(p => p.stat.auto).forEach(p => { const g = x => Math.round(x * (.01 + Math.random() * .02)) + 1; p.stat.views += p.stat.views ? g(p.stat.views) : 0; p.stat.likes += g(p.stat.likes); p.stat.comments += p.stat.comments ? 1 : 0; p.stat.dl += p.stat.dl ? g(p.stat.dl) : 0; }); st.checked = Date.now(); st.sbusy = false; sfx.done(); drawPane(); }, { disabled: st.sbusy });
        const md = () => `# ${T('Statistiques', 'Statistics')} · ${c.name}\n\n${T('Période', 'Period')}: ${per}\n\n- ${T('Vues', 'Views')}: ${num(views)}\n- ${T('Interactions', 'Interactions')}: ${num(inter)}\n- ${T('Téléchargements', 'Downloads')}: ${num(dls)}\n- ${T('Visites du site', 'Site visits')}: ${num(site)}\n\n` + pub.map(p => `- ${p.title} (${PLAT[p.stat.plat][0]}): ${num(p.stat.views)} / ${num(p.stat.likes)} / ${num(p.stat.comments)} / ${num(p.stat.shares)} / ${num(p.stat.dl)}`).join('\n');
        const cols = [['views', T('Vues', 'Views')], ['likes', T('J’aime', 'Likes')], ['comments', T('Comm.', 'Comm.')], ['shares', T('Partages', 'Shares')], ['dl', T('Téléch.', 'Downl.')], ['d24', '24 h']];
        return h('div', { class: 'hd-scroll hd-statw' }, h('div', { class: 'hd-pad wide' }, h('div', { class: 'hd-row2' }, seg([['campaign', T('Toute la campagne', 'Whole campaign')], ['day', '24 h'], ['week', T('7 jours', '7 days')]], per, k => { st.period = k; drawPane(); }), h('span', { class: 'sp' }), st.sbusy ? h('i', { class: 'hd-spin' }) : null, btn(T('Saisir des chiffres', 'Enter numbers'), '', manualSheet), copyBtn(T('COPIER LE RAPPORT', 'COPY REPORT'), md), sBtn),
          h('div', { class: 'hd-meta' }, T('Relevé le ', 'Read ') + fdt(st.checked) + T(' · toutes les heures (campagne en cours)', ' · hourly (campaign running)')),
          callout('in', T('Visites du site : réglez votre code GoatCounter dans les Réglages (compteur gratuit, sans cookies).', 'Site visits: set your GoatCounter code in Settings (free counter, no cookies).')),
          h('div', { class: 'hd-kpis' }, kpi(T('Vues', 'Views'), views, T('toutes plateformes', 'all platforms')), kpi(T('Interactions', 'Interactions'), inter, T('j’aime, commentaires, partages', 'likes, comments, shares')), kpi(T('Téléchargements', 'Downloads'), dls, T('GitHub et Nexus', 'GitHub and Nexus')), kpi(T('Visites du site', 'Site visits'), site, 'ancientrealms.example')),
          best ? h('div', { class: 'hd-fire' }, ic('flame', 14), T(`En forme : « ${best.title} » (+${num(best.stat.d24)} en 24 h)`, `On fire: “${best.title}” (+${num(best.stat.d24)} in 24 h)`)) : null, chartEl(c, pub),
          h('div', { class: 'hd-plats' }, Object.entries(pl).map(([k, v]) => h('div', { class: 'hd-plat' }, h('b', { style: { color: PLAT[k][1] } }, ic(k === 'site' ? 'site' : k, 14), PLAT[k][0]), h('span', { class: 'hd-meta' }, [v.v ? `${num(v.v)} ${T('vues', 'views')}` : null, v.i ? `${num(v.i)} ${T('interactions', 'interactions')}` : null, v.d ? `${num(v.d)} ${T('téléch.', 'downl.')}` : null].filter(Boolean).join(' · ') || '—')))),
          h('div', { class: 'hd-stab' }, h('div', { class: 'hd-str hd' }, h('span', { class: 'pc' }, T('Publication', 'Post')), cols.map(([, l]) => h('span', { class: 'n' }, l)), h('span', { class: 'src' }, T('Relevé', 'Reading'))),
            pub.map((p, i) => h('div', { class: 'hd-str' + (i % 2 ? ' z' : ''), onclick: () => { st.sel = p.id; st.tab = 'tracking'; drawHead(); drawPane(); }, title: T('Voir la publication', 'Show the post') }, h('span', { class: 'pc' }, ic(p.stat.plat, 13, 'sub'), h('span', {}, p.title)), cols.map(([k]) => h('span', { class: 'n' }, (k === 'views' && !p.stat.views) ? '—' : num(p.stat[k]))), h('span', { class: 'src' }, h('small', {}, p.stat.auto ? T('auto', 'auto') : T('saisi', 'entered')))))),
          h('p', { class: 'hd-meta' }, T('Lecture seule : hERALD lit des compteurs publics (YouTube, Reddit, Bluesky, GitHub, Nexus, GoatCounter) et ne publie jamais rien. Double-cliquez une ligne pour saisir des chiffres.', 'Read only: hERALD reads public counters (YouTube, Reddit, Bluesky, GitHub, Nexus, GoatCounter) and never publishes anything. Double-click a row to enter numbers.'))));
      }
      function chartEl(c, pub) {
        const days = 15, W = 800, H = 200, X = i => 44 + i * (W - 60) / (days - 1), series = {};
        pub.forEach(p => { const s = p.stat, pl = ['instagram', 'youtube'].includes(s.plat) && s.views ? s.plat : null; if (!pl) return; const a = series[pl] || (series[pl] = Array(days).fill(0)), st0 = days - 1 + s.d0, k = 3.5 / (days - st0); for (let i = st0; i < days; i++) a[i] += Math.round(s.views * (1 - Math.exp(-(i - st0 + 1) * k))); });
        series.site = Array.from({ length: days }, (_, i) => Math.round(2860 * Math.pow(i / (days - 1), 1.5)));
        const max = Math.max(...Object.values(series).flat(), 1), Y = v => 24 + (H - 48) * (1 - v / max), cl = Object.keys(series), dateAt = i => new Date(day(i - (days - 1))).toLocaleDateString(LG(), { day: '2-digit', month: '2-digit' });
        const idx = m => Math.round((m.t - day(-(days - 1))) / 864e5), esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Vues cumulées par plateforme', 'Cumulative views by platform')}">` + [0, .5, 1].map(f => Math.round(max * f)).map(v => `<line x1="44" x2="${W - 16}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="38" y="${Y(v) + 3}" class="t" text-anchor="end">${num(v)}</text>`).join('') + [0, 3, 6, 9, 12, 14].map(i => `<text x="${X(i)}" y="${H - 6}" class="t" text-anchor="middle">${dateAt(i)}</text>`).join('') +
          c.ms.filter(m => idx(m) >= 0 && idx(m) < days).map(m => { const i = idx(m); return `<line x1="${X(i)}" x2="${X(i)}" y1="14" y2="${H - 20}" class="m"/><text x="${X(i) + (i > 9 ? -4 : 4)}" y="${i % 2 ? 24 : 12}" class="mt" text-anchor="${i > 9 ? 'end' : 'start'}">${esc(m.title)}</text>`; }).join('') +
          cl.map(k => `<polyline fill="none" stroke="${PLAT[k][1]}" stroke-width="2" stroke-linejoin="round" points="${series[k].map((v, i) => X(i) + ',' + Y(v)).join(' ')}"/>`).join('') + '</svg>';
        return h('div', { class: 'hd-chart' }, h('div', { class: 'hd-eyebrow' }, T('VUES CUMULÉES PAR PLATEFORME', 'CUMULATIVE VIEWS BY PLATFORM')), h('div', { class: 'hd-svg', html: svg }), h('div', { class: 'hd-leg' }, cl.map(k => h('span', {}, h('i', { style: { background: PLAT[k][1] } }), PLAT[k][0]))));
      }
      function manualSheet() {
        const c = C(), cand = c.posts.filter(p => p.status === 'published'), f = {}; let cur = cand[0];
        const vals = h('div', { class: 'hd-two5' }); const keys = [['views', T('Vues', 'Views')], ['likes', T('J’aime', 'Likes')], ['comments', T('Comm.', 'Comm.')], ['shares', T('Partages', 'Shares')], ['dl', T('Téléch.', 'Downl.')]];
        const paint = () => { cur = cand.find(p => p.id === sel.value) || cur; fill(vals, keys.map(([k, l]) => lbl(l, h('input', { class: 'hd-in mono', type: 'number', min: 0, value: cur && cur.stat ? cur.stat[k] : '', 'aria-label': l, oninput: e => { f[k] = Math.max(0, +e.target.value || 0); } })))); };
        const sel = select(cand.map(p => [p.id, `${fday(p.t)} · ${p.title}`]), cur && cur.id, () => { Object.keys(f).forEach(k => delete f[k]); paint(); });
        sheet(T('Saisir des chiffres', 'Enter numbers'), h('div', { class: 'hd-sbody2' }, h('p', { class: 'hd-meta' }, T('Pour Instagram, Facebook, Discord ou X : recopiez les compteurs affichés sous la publication. Laissez vide ce que vous ne connaissez pas.', 'For Instagram, Facebook, Discord or X: copy the counters shown under the post. Leave blank what you don’t know.')), lbl(T('Publication', 'Post'), sel), vals),
          [btn(T('ANNULER', 'CANCEL'), '', closeModal), btn(T('ENREGISTRER', 'SAVE'), 'pri', () => { if (cur) { cur.stat = cur.stat || { plat: 'other', d0: 0, d24: 0, views: 0, likes: 0, comments: 0, shares: 0, dl: 0 }; Object.assign(cur.stat, f, { auto: false }); } sfx.done(); closeModal(); drawPane(); })]); paint();
      }

      /* --- retours --- */
      function fbView() {
        const c = C(), lc = h('div', { class: 'hd-lcol hd-scroll' }), ed = h('div', { class: 'hd-dedit hd-scroll' }), order = [...c.posts].sort((a, b) => (a.status === 'published' ? 0 : 1) - (b.status === 'published' ? 0 : 1) || a.t - b.t);
        const sum = p => (p.fb.length ? FBK().filter(([k]) => p.fb.some(f => f.kind === k)).map(([k, l]) => `${l} ${num(total(p, k))}`).join(' · ') : T('Aucun retour noté', 'No feedback recorded'));
        const paintList = () => fill(lc, order.map(p => h('button', { class: 'hd-lr' + (p.id === st.fbSel ? ' on' : ''), onclick: () => { st.fbSel = p.id; const un = p.fb.filter(f => f.unread); st.fresh = new Set(un.map(f => f.id)); p.fb.forEach(f => { f.unread = false; }); sfx.tick(); paintList(); paintEd(); drawHead(); } },
          h('span', { class: 'hd-l1' }, h('b', {}, p.title), h('span', { class: 'sp' }), p.fb.some(f => f.unread) ? badge(T(`${p.fb.filter(f => f.unread).length} nouvelle(s) réponse(s)`, `${p.fb.filter(f => f.unread).length} new reply(ies)`), 'ac') : null, stBadge(p.status)), h('small', {}, sum(p)))));
        const paintEd = () => {
          const p = c.posts.find(x => x.id === st.fbSel); if (!p) return fill(ed, empty(T('Choisissez une publication pour noter ses retours.', 'Choose a post to record its feedback.')));
          const f = { kind: 'comment', value: 1, date: day(0), text: '' };
          const tile = ([k, l]) => h('div', { class: 'hd-tile' }, h('span', { class: 'hd-meta' }, l), h('b', { class: 'hd-val' }, num(total(p, k))));
          const msg = h('span', { class: 'hd-meta fl' }, T('CSV : date;type;valeur;texte (date AAAA-MM-JJ ; type comment, downloads, endorsements, stars, views ou other).', 'CSV: date;type;value;text (date YYYY-MM-DD; type comment, downloads, endorsements, stars, views or other).'));
          fill(ed, h('div', { class: 'hd-row2' }, h('h3', { class: 'hd-bh fl' }, p.title), p.link ? btn(T('Ouvrir', 'Open'), '', () => demo(T('Ouvre le lien de la publication (désactivé dans la démo).', 'Opens the post link (disabled in the demo).'))) : null),
            h('div', { class: 'hd-tiles' }, FBK().filter(x => x[0] !== 'other').map(tile)),
            h('div', { class: 'hd-add' }, lbl(T('Type', 'Type'), select(FBK(), 'comment', v => { f.kind = v; })), lbl(T('Valeur', 'Value'), h('input', { class: 'hd-in', type: 'number', value: 1, min: 0, 'aria-label': T('Valeur', 'Value'), oninput: e => { f.value = +e.target.value || 0; } })), lbl(T('Date', 'Date'), h('input', { class: 'hd-in', type: 'date', value: iso(day(0)), onchange: e => { if (e.target.value) f.date = new Date(e.target.value + 'T12:00:00').getTime(); } })),
              h('div', { class: 'wr' }, lbl(T('Commentaire ou note', 'Comment or note'), input('', v => { f.text = v; }, { 'aria-label': T('Commentaire ou note', 'Comment or note') })), btn(T('AJOUTER', 'ADD'), 'pri', () => { p.fb.push({ id: D.id(), t: f.date, kind: f.kind, value: f.value, text: f.text.trim() }); sfx.pop(); paintList(); paintEd(); }))),
            h('div', { class: 'hd-row2' }, msg, btn(T('Importer un CSV…', 'Import CSV…'), '', () => { const n = [{ t: day(-1), kind: 'comment', value: 3, text: 'Nice' }, { t: day(0), kind: 'downloads', value: 120, text: '' }]; n.forEach(x => p.fb.push({ id: D.id(), ...x })); sfx.done(); msg.textContent = T(`${n.length} retour(s) importé(s).`, `${n.length} feedback item(s) imported.`); msg.classList.add('ok'); paintList(); setTimeout(() => { if (alive() && st.fbSel === p.id) paintEd(); }, 900); })), h('hr', { class: 'hd-hr' }),
            p.fb.length ? [...p.fb].sort((a, b) => b.t - a.t).map(x => h('div', { class: 'hd-fb' }, h('span', { class: 'hd-meta d' }, fday(x.t)), badge(FBK().find(k => k[0] === x.kind)[1], x.kind === 'comment' ? 'ac' : ''),
              x.author ? h('div', { class: 'fl' }, h('b', {}, 'u/' + x.author), st.fresh && st.fresh.has(x.id) || x.unread ? badge(T('Nouveau', 'New'), 'ok') : null, h('p', {}, x.text)) : [h('b', { class: 'v' }, num(x.value)), h('span', { class: 'fl' }, x.text)],
              h('button', { class: 'hd-ib', title: T('Supprimer', 'Remove'), 'aria-label': T('Supprimer', 'Remove'), onclick: () => { p.fb.splice(p.fb.indexOf(x), 1); sfx.close(); paintList(); paintEd(); drawHead(); } }, ic('trash', 14)))) : empty(T('Aucun retour noté', 'No feedback recorded')));
        };
        paintList(); paintEd(); return h('div', { class: 'hd-split' }, lc, ed);
      }

      /* --- veille : rapport de la semaine + produits surveillés --- */
      const KIND = { github: 'GitHub', nexus: 'Nexus' };
      function reportBlocks() {
        const c = C(), wk = Date.now() - 7 * 864e5, ps = c ? c.posts : [], out = [], none = T('Rien à signaler.', 'Nothing to report.');
        const sec = (title, items, empty0) => { out.push(['h', title]); if (items.length) items.forEach(x => out.push(['li', x])); else out.push(['p', empty0 || none]); };
        const nm = p => `${fday(p.t)} · **${p.title}** (${chOf(p) ? chOf(p).name : '—'})`;
        sec(T('Nouvelles versions repérées', 'New versions spotted'), D.watch.filter(x => x.hist.length > 1 && x.hist[x.hist.length - 1].t > wk).map(x => `**${x.name}** : ${x.hist[x.hist.length - 2].v} → ${x.hist[x.hist.length - 1].v}`), T('Aucune nouvelle version cette semaine.', 'No new version this week.'));
        sec(T('Dernières versions connues', 'Latest known versions'), D.watch.map(x => `**${x.name}** : ${x.hist.length ? x.hist[x.hist.length - 1].v : '—'}`));
        sec(T('Nos publications', 'Our posts'), ps.filter(p => p.status === 'published' && p.t > wk).map(nm));
        const fb = ps.flatMap(p => p.fb).filter(f => f.t > wk); sec(T('Retours reçus', 'Feedback received'), fb.length ? [T(`${fb.length} retour(s) noté(s) cette semaine`, `${fb.length} feedback item(s) recorded this week`)] : []);
        sec(T('À publier dans les 7 jours', 'To post within 7 days'), ps.filter(p => p.status !== 'published' && p.t >= Date.now() - 864e5 && p.t < Date.now() + 7 * 864e5).map(p => nm(p) + ' — ' + STS().find(x => x[0] === p.status)[1]));
        return out;
      }
      function watchView() {
        let problem = ''; const sel = D.watch.find(x => x.id === st.wsel), rep = st.wsel === 'report';
        const inp = h('input', { class: 'hd-in', placeholder: T('URL GitHub ou Nexus (ou propriétaire/dépôt)', 'GitHub or Nexus URL (or owner/repo)'), 'aria-label': 'URL' }), nm = h('input', { class: 'hd-in', placeholder: T('Nom (facultatif)', 'Name (optional)'), 'aria-label': T('Nom', 'Name') }), err = h('div', { class: 'hd-w' });
        const add = () => { const s = inp.value.trim(), gm = s.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i), nx = s.match(/nexusmods\.com\/(?:games\/)?([a-z0-9]+)\/mods\/(\d+)/i); let kind, ref; if (gm) { kind = 'github'; ref = gm[1] + '/' + gm[2]; } else if (nx) { kind = 'nexus'; ref = nx[1] + '/' + nx[2]; } else if (/^[\w.-]+\/\d+$/.test(s)) { kind = 'nexus'; ref = s; } else if (/^[\w.-]+\/[\w.-]+$/.test(s)) { kind = 'github'; ref = s; }
          if (!kind) { err.textContent = T('Adresse non reconnue : dépôt GitHub ou page de mod Nexus.', 'Address not recognised: GitHub repository or Nexus mod page.'); return; } if (D.watch.some(x => x.kind === kind && x.ref.toLowerCase() === ref.toLowerCase())) { err.textContent = T('Déjà dans la liste.', 'Already in the list.'); return; }
          const it = { id: D.id(), name: nm.value.trim() || ref, kind, ref, notes: '', checked: null, hist: [] }; D.watch.push(it); st.wsel = it.id; sfx.pop(); drawPane(); check([it.id]); };
        [inp, nm].forEach(e => e.addEventListener('keydown', ev => { if (ev.key === 'Enter') add(); }));
        const lc = h('div', { class: 'hd-lcol hd-scroll' }, h('button', { class: 'hd-lr' + (rep ? ' on' : ''), onclick: () => { st.wsel = 'report'; drawPane(); } }, h('b', { class: 'hd-l1' }, ic('forum', 14, 'sub'), T('Rapport de la semaine', 'Weekly report')), h('small', {}, T(`Du ${fday(Date.now() - 7 * 864e5)} au ${fday(Date.now())}`, `${fday(Date.now() - 7 * 864e5)} to ${fday(Date.now())}`))),
          h('div', { class: 'hd-sh2' }, h('span', { class: 'hd-eyebrow' }, T('PRODUITS SURVEILLÉS', 'WATCHED PRODUCTS')), st.wbusy ? h('i', { class: 'hd-spin' }) : null, btn(T('VÉRIFIER', 'CHECK'), 'pri', () => check(), { disabled: st.wbusy || !D.watch.length })), h('div', { class: 'hd-wadd' }, inp, h('div', { class: 'hd-row2 one' }, nm, btn(T('Ajouter', 'Add'), '', add)), err),
          D.watch.map(x => h('button', { class: 'hd-lr' + (x.id === st.wsel ? ' on' : ''), onclick: () => { st.wsel = x.id; sfx.tick(); drawPane(); } }, h('span', { class: 'hd-l1' }, h('b', {}, x.name), h('span', { class: 'sp' }), badge(KIND[x.kind])), h('span', { class: 'hd-l1' }, h('span', { class: 'mono ac' }, x.hist.length ? x.hist[x.hist.length - 1].v : T('Pas encore vérifié', 'Not checked yet'))))));
        const det = h('div', { class: 'hd-dedit hd-scroll' });
        if (rep) { const blocks = reportBlocks(), md = blocks.map(b => (b[0] === 'h' ? '\n## ' : b[0] === 'li' ? '- ' : '') + b[1]).join('\n'); fill(det, h('div', { class: 'hd-row2' }, h('h3', { class: 'hd-bh fl' }, T('Rapport de la semaine', 'Weekly report')), copyBtn(T('Copier en Markdown', 'Copy as Markdown'), () => `# ${T('Rapport de la semaine', 'Weekly report')}\n${md}`)),
          blocks.map(b => b[0] === 'h' ? h('h4', { class: 'hd-h4' }, b[1]) : b[0] === 'li' ? h('div', { class: 'hd-li' }, h('i', {}, '•'), h('span', { html: b[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>') })) : h('p', { class: 'hd-p mut' }, b[1])),
          h('p', { class: 'hd-meta' }, T('Rapport calculé à partir des relevés de la veille (vérifiés automatiquement une fois par semaine au lancement) et de vos retours notés.', 'Report built from monitoring readings (checked automatically once a week at launch) and the feedback you recorded.'))); }
        else if (sel) fill(det, h('div', { class: 'hd-row2 one' }, h('div', { class: 'fl' }, h('h3', { class: 'hd-bh' }, sel.name), h('div', { class: 'hd-meta mono' }, `${KIND[sel.kind]} · ${sel.ref}`)), btn(T('Ouvrir', 'Open'), '', () => demo(T('Ouvre la page du produit (désactivé dans la démo).', 'Opens the product page (disabled in the demo).'))), btn(T('Supprimer', 'Remove'), 'gh', () => { D.watch.splice(D.watch.indexOf(sel), 1); st.wsel = 'report'; sfx.close(); drawPane(); })), h('div', { class: 'hd-meta' }, sel.checked ? T('Vérifié le ', 'Checked ') + fdt(sel.checked) : T('Pas encore vérifié', 'Not checked yet')),
          lbl('Notes', input(sel.notes, v => { sel.notes = v; })), h('div', { class: 'hd-eyebrow' }, T('HISTORIQUE', 'HISTORY')), sel.hist.length ? [...sel.hist].reverse().map(x => h('div', { class: 'hd-hrow' }, h('span', { class: 'hd-meta w150' }, fdt(x.t)), h('span', { class: 'mono ac w120' }, x.v), h('span', { class: 'hd-meta' }, x.pub ? T('publiée le ', 'released ') + fday(x.pub) : ''), x.dl ? h('span', { class: 'hd-meta' }, '⬇︎ ' + num(x.dl)) : null, x.end ? h('span', { class: 'hd-meta' }, '👍 ' + num(x.end)) : null)) : empty(T('Aucun relevé pour l’instant.', 'No readings yet.')));
        return h('div', { class: 'hd-split wide' }, lc, det);
      }
      async function check(ids) {
        if (st.wbusy) return; st.wbusy = true; sfx.click(); drawPane(); await wait(reduced() ? 0 : 1200); if (!alive()) return;
        D.watch.forEach(x => { if (ids && !ids.includes(x.id)) return; x.checked = Date.now(); if (!x.hist.length) x.hist.push(x.kind === 'github' ? { t: Date.now(), v: 'v2.4.0', pub: Date.now() - 9 * 864e5 } : { t: Date.now(), v: '1.0.2', pub: Date.now() - 20 * 864e5, dl: 1480, end: 96 }); else if (x.name === 'Community Shaders' && !x.bumped) { x.bumped = true; x.hist.push({ t: Date.now(), v: 'v1.1.5', pub: Date.now() - 864e5 }); toast({ icon: icon(app.id), title: T('Nouvelle version de Community Shaders', 'New version of Community Shaders'), body: T('Version v1.1.5 disponible.', 'Version v1.1.5 is out.') }); } });
        st.wbusy = false; sfx.done(); if (alive() && st.tab === 'watch') drawPane();
      }

      /* --- canaux --- */
      function chView() {
        if (!st.chSel || !D.chans.find(x => x.id === st.chSel)) st.chSel = null; const ed = h('div', { class: 'hd-dedit hd-scroll' }), lc = h('div', { class: 'hd-lcol hd-scroll' });
        const uses = k => D.camps.reduce((a, c) => a + c.posts.filter(p => p.ch === k.id).length, 0);
        const paintList = () => fill(lc, h('div', { class: 'hd-sh2' }, h('span', { class: 'hd-eyebrow' }, T('CANAUX', 'CHANNELS')), btn(T('Nouveau canal', 'New channel'), '', () => { const k = { id: D.id(), name: T('Nouveau canal', 'New channel'), kind: 'other', url: '', notes: '' }; D.chans.push(k); st.chSel = k.id; sfx.pop(); drawPane(); })), D.chans.map(k => h('button', { class: 'hd-lr' + (k.id === st.chSel ? ' on' : ''), onclick: () => { st.chSel = k.id; sfx.tick(); drawPane(); } }, h('span', { class: 'hd-l1' }, ic(k.kind, 14, 'sub'), h('b', {}, k.name), h('span', { class: 'sp' }), h('small', {}, T(`${uses(k)} publication(s)`, `${uses(k)} post(s)`))))));
        const k = D.chans.find(x => x.id === st.chSel);
        if (!k) fill(ed, empty(T('Choisissez un canal.', 'Choose a channel.')));
        else { const notes = h('textarea', { class: 'hd-in ta', rows: 5, 'aria-label': 'Notes', oninput: e => { k.notes = e.target.value; } }); notes.value = k.notes; fill(ed, h('div', { class: 'hd-pad' }, lbl(T('Nom', 'Name'), input(k.name, v => { k.name = v; })), h('div', { class: 'hd-two' }, lbl(T('Type', 'Type'), select(KINDS(), k.kind, v => { k.kind = v; paintList(); })), lbl(T('Adresse', 'Address'), input(k.url, v => { k.url = v; }))), lbl(T('Règles et notes (auto-promotion, salons autorisés…)', 'Rules and notes (self-promotion, allowed channels…)'), notes), h('div', { class: 'hd-row2' }, h('span', { class: 'sp' }), btn(T('Supprimer', 'Remove'), 'gh', () => { D.chans.splice(D.chans.indexOf(k), 1); st.chSel = null; sfx.close(); drawPane(); })))); }
        paintList(); return h('div', { class: 'hd-split wide' }, lc, ed);
      }

      /* --- campagne, réglages --- */
      function campaignSheet() {
        const c = C(); if (!c) return; const ml = h('div', { class: 'hd-ml' });
        const paint = () => fill(ml, c.ms.map(m => h('div', { class: 'hd-mrow' }, h('input', { class: 'hd-in', type: 'date', value: iso(m.t), 'aria-label': 'Date', onchange: e => { if (e.target.value) m.t = new Date(e.target.value + 'T12:00:00').getTime(); } }), select(MSK(), m.kind, v => { m.kind = v; }, 'w130'), input(m.title, v => { m.title = v; }), h('button', { class: 'hd-ib', title: T('Supprimer', 'Remove'), 'aria-label': T('Supprimer', 'Remove'), onclick: () => { c.ms.splice(c.ms.indexOf(m), 1); paint(); } }, ic('trash', 14)))));
        const nt = h('textarea', { class: 'hd-in ta', rows: 3, 'aria-label': T('Message central et notes', 'Key message and notes'), oninput: e => { c.notes = e.target.value; } }); nt.value = c.notes;
        sheet(T('Modifier la campagne', 'Edit campaign'), h('div', { class: 'hd-sbody2' }, h('div', { class: 'hd-two' }, lbl(T('Nom', 'Name'), input(c.name, v => { c.name = v; })), lbl(T('Date de l’événement', 'Event date'), h('input', { class: 'hd-in', type: 'date', value: iso(c.event), onchange: e => { if (e.target.value) c.event = new Date(e.target.value + 'T12:00:00').getTime(); } }))), lbl(T('Message central et notes', 'Key message and notes'), nt),
          h('div', { class: 'hd-row2' }, h('span', { class: 'hd-eyebrow' }, T('JALONS', 'MILESTONES')), h('span', { class: 'sp' }), btn(T('Ajouter un jalon', 'Add a milestone'), '', () => { c.ms.push({ id: D.id(), title: T('Nouveau jalon', 'New milestone'), t: c.event, kind: 'other' }); paint(); })), ml),
          [btn(T('TERMINÉ', 'DONE'), 'pri', () => { c.ms.sort((a, b) => a.t - b.t); sfx.done(); closeModal(); draw(); })], '680px'); paint();
      }
      function settingsSheet() {
        const d = { agent: st.agent }, ro = (v, l) => h('input', { class: 'hd-in mono', type: 'password', value: v, readonly: true, 'aria-label': l, title: T('Démo : aucune clé n’est demandée ni enregistrée.', 'Demo: no key is asked for or stored.') });
        sheet(T('Réglages', 'Settings'), h('div', { class: 'hd-sbody2' }, lbl(T('Clé API Nexus (facultative)', 'Nexus API key (optional)'), ro('••••••••••••', 'Nexus'), h('div', { class: 'hd-meta' }, T('Sert seulement à lire les fiches de mods Nexus surveillées. Rangée dans le trousseau macOS, jamais dans le plan ni dans l’export.', 'Only used to read the watched Nexus mod pages. Stored in the macOS keychain, never in the plan or the export.'))),
          lbl(T('Clé API YouTube (statistiques des vidéos)', 'YouTube API key (video statistics)'), ro('••••••••••••', 'YouTube')), lbl(T('Reddit (app de type script, lecture seule)', 'Reddit (script app, read only)'), h('div', { class: 'hd-two' }, ro('••••••••', 'Client ID'), ro('••••••••••••', 'Secret'))),
          h('div', { class: 'hd-two' }, lbl(T('Site web (domaine)', 'Website (domain)'), h('input', { class: 'hd-in mono', value: 'ancientrealms.example', readonly: true, 'aria-label': 'Domain' })), lbl(T('Code GoatCounter', 'GoatCounter code'), h('input', { class: 'hd-in mono', value: 'ancientrealms', readonly: true, 'aria-label': 'GoatCounter' }))),
          lbl(T('Icône de l’application', 'App icon'), seg([['dock', 'Dock'], ['menubar', T('Barre de menus', 'Menu bar')], ['both', T('Les deux', 'Both')]], 'dock', () => demo(T('Réglage de la vraie appli (Dock, barre de menus ou les deux).', 'Setting of the real app (Dock, menu bar or both).')))),
          lbl(T('Agent IA (facultatif)', 'AI agent (optional)'), chk(T('Discuter avec un agent IA depuis hERALD', 'Chat with an AI agent from hERALD'), d.agent, v => { d.agent = v; }), h('div', { class: 'hd-meta' }, T('Désactivé par défaut : hERALD fonctionne très bien sans agent. Activé, chaque tâche et la campagne ont une discussion avec l’agent de votre choix (Claude Code, Codex, ChatGPT…).', 'Off by default: hERALD works perfectly without an agent. When on, every task and the campaign get a chat with the agent of your choice (Claude Code, Codex, ChatGPT…).'))),
          lbl(T('Données', 'Data'), h('input', { class: 'hd-in mono', value: '~/Library/Application Support/hERALD/plan.json', readonly: true, 'aria-label': T('Données', 'Data') })), callout('in', T('hERALD ne publie rien et n’envoie aucun message : il prépare vos textes, les copie dans le presse-papiers et suit vos publications.', 'hERALD publishes nothing and sends no message: it prepares your texts, copies them to the clipboard and tracks your posts.'))),
          [btn(T('ANNULER', 'CANCEL'), '', closeModal), btn(T('ENREGISTRER', 'SAVE'), 'pri', () => { const ch = d.agent !== st.agent; st.agent = d.agent; if (!d.agent && st.agentOpen) toggleAgent(false); sfx.done(); closeModal(); if (ch) draw(); })], '640px');
      }

      /* --- volet de l'agent IA (facultatif) : il lit, conseille, ne publie jamais ; ses propositions s'appliquent d'un clic et s'annulent --- */
      const threads = {}, th = () => { const k = st.scopeTask && st.sel ? st.sel : 'campaign:' + (C() ? C().id : ''); return threads[k] || (threads[k] = []); };
      const AW = 400, SW = 200;
      function toggleAgent(v) {
        st.agentOpen = v === undefined ? !st.agentOpen : v;
        if (st.agentOpen !== !!st.grown) { st.grown = st.agentOpen; w.w += st.agentOpen ? AW - SW : SW - AW; w.o.minw = st.agentOpen ? 1040 + AW - SW : 1040; if (w.x + w.w > 1590) w.x = Math.max(8, 1590 - w.w); w.el.classList.add('anim'); w.el.style.width = w.w + 'px'; w.el.style.left = w.x + 'px'; setTimeout(() => w.el.classList.remove('anim'), 420); }
        agentEl.hidden = !st.agentOpen; root.classList.toggle('ag', st.agentOpen); sfx.tick(); draw();
      }
      let busy = false;
      const dr = (post, l, text, label) => { let prev, ps; return { label, before: post.drafts[l] || '', after: text, apply: () => { prev = post.drafts[l]; ps = post.status; post.drafts[l] = text; if (post.status === 'idea') post.status = 'draft'; }, undo: () => { if (prev == null) delete post.drafts[l]; else post.drafts[l] = prev; post.status = ps; } }; };
      const ES = '¡Hola! Ancient Realms HD 1.4 ya está disponible: paisajes en 4K que protegen tus fps. Gratis, comentarios bienvenidos.\nEnlace: https://www.nexusmods.com/skyrimspecialedition/mods/48210', IT = 'Ciao! Ancient Realms HD 1.4 è disponibile: paesaggi in 4K che proteggono i tuoi fps. Gratis, commenti benvenuti.\nLink: https://www.nexusmods.com/skyrimspecialedition/mods/48210';
      function paintAgent() {
        const c = C(), p = st.scopeTask ? c.posts.find(x => x.id === st.sel) : null, msgs = th();
        const conv = h('div', { class: 'hd-conv hd-scroll' }), ta = h('textarea', { class: 'hd-in', rows: 2, placeholder: T('Votre demande… (Entrée pour envoyer, ⇧Entrée pour un retour à la ligne)', 'Your request… (Return to send, ⇧Return for a new line)'), 'aria-label': T('Votre demande', 'Your request') });
        const quick = [[T('Rédiger le brouillon', 'Write the draft'), 'draft'], [T('Améliorer l’accroche', 'Improve the hook'), 'hook'], [T('Traduire', 'Translate'), 'tr'], [T('Vérifier avant publication', 'Check before publishing'), 'chk'], [T('Et ensuite ?', 'What next?'), 'next']];
        const send = k => { if (busy) return; const txt = k ? quick.find(q => q[1] === k)[0] : ta.value.trim(); if (!txt) return; ta.value = ''; ask(txt, k, p); };
        ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
        agentEl._conv = conv;
        fill(conv, msgs.length ? msgs.map(m => (m.who === 'me' ? h('div', { class: 'hd-bub me' }, m.text) : h('div', { class: 'hd-bub ag' }, h('div', { class: 'hd-bt' }, m.text), m.prop ? propCard(m.prop) : null))) : empty(T('Posez une question ou demandez un travail : rédiger, traduire, vérifier, préparer la suite.', 'Ask a question or request a job: write, translate, check, prepare what comes next.')));
        fill(agentEl, h('div', { class: 'hd-ah' }, h('span', { class: 'hd-eyebrow' }, T('AGENT IA', 'AI AGENT')), h('span', { class: 'sp' }), h('button', { class: 'hd-ib', title: T('Effacer', 'Clear'), 'aria-label': T('Effacer', 'Clear'), disabled: !msgs.length, onclick: () => { msgs.length = 0; sfx.close(); paintAgent(); } }, ic('trash', 14)), h('button', { class: 'hd-ib', title: T('Fermer le volet', 'Close the panel'), 'aria-label': T('Fermer le volet', 'Close the panel'), onclick: () => toggleAgent(false) }, ic('x', 15))),
          h('div', { class: 'hd-asc' }, seg([['false', T('Campagne', 'Campaign')], ['true', T('Tâche sélectionnée', 'Selected task')]], String(st.scopeTask), k => { st.scopeTask = k === 'true'; paintAgent(); }), p || !st.scopeTask ? h('h4', { class: 'hd-h4 w' }, st.scopeTask ? p.title : c.name) : null,
            h('div', { class: 'hd-row2' }, badge('hERALD', 'ac'), h('span', { class: 'mono sub' }, 'session 3f9a1c2e…'), h('span', { class: 'sp' }), copyBtn(T('Copier la commande de reprise', 'Copy the resume command'), () => 'cd "~/hERALD" && claude --resume 3f9a1c2e', 'gh'))),
          st.scopeTask && !p ? empty(T('Sélectionnez une tâche dans le suivi pour en discuter avec l’agent.', 'Select a task in the tracking tab to talk about it with the agent.')) : [conv, h('div', { class: 'hd-quick' }, quick.map(([l, k]) => h('button', { class: 'hd-qb', disabled: busy, onclick: () => send(k) }, l))), h('div', { class: 'hd-comp' }, ta, btn(T('ENVOYER', 'SEND'), 'pri', () => send(), { disabled: busy })), h('p', { class: 'hd-meta' }, T('L’agent lit et conseille, il ne publie jamais. Ses propositions de modifications (notes, brouillons, statut) ne s’appliquent que d’un clic de votre part, et s’annulent.', 'The agent reads and advises, it never publishes. Its proposed changes (notes, drafts, status) apply only when you click, and can be undone.'))]);
        conv.scrollTop = conv.scrollHeight;
      }
      function propCard(pr) {
        const card = h('div', { class: 'hd-prop' });
        const paint = () => fill(card, h('div', { class: 'hd-eyebrow' }, T('PROPOSITION DE L’AGENT', 'AGENT’S PROPOSAL')), pr.ch.map(x => h('div', { class: 'hd-diff' }, h('b', {}, x.label), h('div', { class: 'hd-cmp' }, h('div', {}, h('small', {}, T('Avant', 'Before')), h('pre', {}, x.before || T('(vide)', '(empty)'))), h('div', {}, h('small', {}, T('Après', 'After')), h('pre', {}, x.after))))),
          pr.state === 'applied' ? h('div', { class: 'hd-row2' }, h('span', { class: 'hd-meta ok' }, T('Appliquée le ', 'Applied ') + fdt(pr.at)), h('span', { class: 'sp' }), btn(T('Annuler', 'Undo'), '', () => { pr.ch.forEach(x => x.undo()); pr.state = ''; sfx.close(); paint(); refresh(); }))
            : pr.state === 'dismissed' ? h('span', { class: 'hd-meta' }, T('Ignorée', 'Dismissed')) : h('div', { class: 'hd-row2' }, h('span', { class: 'sp' }), btn(T('Ignorer', 'Dismiss'), 'gh', () => { pr.state = 'dismissed'; paint(); }), btn(T('Appliquer', 'Apply'), 'pri', () => { pr.ch.forEach(x => x.apply()); pr.state = 'applied'; pr.at = Date.now(); sfx.done(); paint(); refresh(); })));
        paint(); return card;
      }
      const refresh = () => { drawHead(); if (st.tab !== 'calendar') drawPane(); };
      async function ask(txt, kind, post) {
        busy = true; const msgs = th(), c = C(); msgs.push({ who: 'me', text: txt }); sfx.click(); paintAgent();
        const conv = agentEl._conv, pt = post ? post.title : c.name, need = ['draft', 'hook', 'tr'].includes(kind) && !post;
        const R = {
          draft: [T(`Voici un brouillon pour « ${pt} », court et conforme aux règles du canal (un seul message, dans le salon prévu). Il reprend le message central de la campagne et le lien de la page du mod.`, `Here is a draft for “${pt}”, short and within the channel rules (one message, in the intended room). It reuses the campaign’s key message and the mod page link.`), post && ['fr', 'en'].map(l => dr(post, l, AGENT_DRAFT()[l], T('Brouillon', 'Draft') + ' (' + { fr: 'français', en: 'English' }[l] + ')'))],
          hook: [T('Trois variantes d’accroche : 1) « Des montagnes en 4K, sans perdre une image par seconde. » 2) « Vos paysages méritent mieux que 2K. » 3) « 4K, 8K ou Lite : choisissez votre carte. » Je recommande la première : concrète et rassurante pour les cartes de 8 Go.', 'Three hook variants: 1) “4K mountains, without losing a frame per second.” 2) “Your landscapes deserve better than 2K.” 3) “4K, 8K or Lite: pick your card.” I recommend the first: concrete and reassuring for 8 GB cards.'), post && [dr(post, 'en', '4K mountains, without losing a frame per second.\n' + (post.drafts.en || '').split('\n').slice(1).join('\n'), T('Accroche (anglais)', 'Hook (English)'))]],
          tr: [T('Il manque l’espagnol et l’italien. Voici la traduction du brouillon anglais, ton conservé, nom du mod et lien inchangés.', 'Spanish and Italian are missing. Here is the translation of the English draft, tone kept, mod name and link unchanged.'), post && [dr(post, 'es', ES, T('Brouillon', 'Draft') + ' (español)'), dr(post, 'it', IT, T('Brouillon', 'Draft') + ' (italiano)')]],
          chk: [T('Relecture avant diffusion : 1) le lien de la page du mod est présent ; 2) le salon visé n’autorise qu’un message par serveur, ne relancez pas ; 3) créditez les auteurs de Cathedral Landscapes si vous citez la compatibilité ; 4) 18 h, heure des joueurs européens, convient. Rien ne manque côté plan : tout reste à publier par vous.', 'Proofreading before it goes out: 1) the mod page link is there; 2) the target room allows one message per server, do not bump; 3) credit the Cathedral Landscapes authors if you mention compatibility; 4) 6 pm, European players’ time, works. Nothing is missing in the plan: everything is for you to post.'), null],
          next: [T('Prochaines étapes : 1) copier et publier l’annonce Discord (brouillon prêt) ; 2) ajouter le lien de la vidéo de présentation dès sa mise en ligne ; 3) noter les réponses Reddit de la semaine dans l’onglet Retours ; 4) préparer le post « merci et retours » du jour J+7.', 'Next steps: 1) copy and post the Discord announcement (draft ready); 2) add the presentation video link once it is live; 3) record this week’s Reddit replies in the Feedback tab; 4) prepare the “thanks and feedback” post for D+7.'), null]
        };
        let [reply, prop] = need ? [T('Choisissez d’abord une tâche dans le suivi (« Tâche sélectionnée ») : je rédige pour un canal précis.', 'First pick a task in the tracking tab (“Selected task”): I write for one specific channel.'), null] : kind ? R[kind] : [T('J’ai lu la fiche de la tâche et le plan. Précisez ce que vous voulez modifier (ton, longueur, canal) et je prépare une proposition que vous pourrez appliquer d’un clic.', 'I read the task sheet and the plan. Tell me what to change (tone, length, channel) and I’ll prepare a proposal you can apply with one click.'), null];
        const stat = h('div', { class: 'hd-bub ag st' }, h('i', { class: 'hd-spin' }), h('span', {}, T('Réfléchit…', 'Thinking…'))); conv.append(stat); conv.scrollTop = conv.scrollHeight;
        await wait(reduced() ? 0 : 700); if (!alive()) return; stat.querySelector('span').textContent = T('Lit : le plan et la fiche de la tâche', 'Reading: the plan and the task sheet'); await wait(reduced() ? 0 : 700); if (!alive()) return; stat.querySelector('span').textContent = T('Rédige la réponse…', 'Writing the answer…'); await wait(reduced() ? 0 : 500); if (!alive()) return;
        stat.remove(); const tx = h('div', { class: 'hd-bt' }); conv.append(h('div', { class: 'hd-bub ag' }, tx)); conv.scrollTop = conv.scrollHeight;
        await stream(tx, reply, { think: 0, cps: 220, alive: () => alive() && tx.isConnected }); if (!alive()) return;
        msgs.push({ who: 'ag', text: reply, prop: prop ? { ch: prop, state: '' } : null }); busy = false; if (st.agentOpen && agentEl.isConnected) paintAgent(); sfx.done();
      }

      w.unbrand = brandHL(root, 'hERALD', 'hd-brand');
      draw(); return root;
    } });
}
