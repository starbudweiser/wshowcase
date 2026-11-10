/* hERALD : réplique de l'appli après la refonte (barre latérale en panneau, en-tête de vue, barre d'état).
   Vues : Aujourd'hui, Calendrier, Publications (liste + inspecteur à onglets), Contacts (démarchage + éditeur de mail),
   Statistiques, Retours, Veille, Canaux, Navigateur intégré, Agent IA (propose, applicable puis annulable, ne publie jamais),
   Réglages, À propos. Règle d'or : hERALD prépare et suit, il ne publie JAMAIS rien ; il n'envoie un e-mail que sur votre clic.
   Données d'exemple fictives, aucun réseau ni envoi réel. */
import { h, brand, wait, reduced, stream, toast, icon, S, sfx, wm, T, css, clamp } from './kit.js';

const HC = '#f39200';
const VERSION = '1.0.0';
const LG = () => T('fr-FR', 'en-US');
const SVG = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.4 0 4 1.8 4 4.5"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  bubbles: '<path d="M4 5h11v8H9l-3 3v-3H4z"/><path d="M18 9h2v8h-2v3l-3-3h-5v-2"/>',
  bubble: '<path d="M4 5h16v11H9l-5 4z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mega: '<path d="M4 10v4h3l6 4V6L7 10zM17 9a4 4 0 0 1 0 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>',
  xc: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M9 9l6 6M15 9l-6 6" stroke="var(--h-bg)"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  chl: '<path d="m15 6-6 6 6 6"/>', chr: '<path d="m9 6 6 6-6 6"/>', chd: '<path d="m6 9 6 6 6-6"/>', chud: '<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  plane: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>',
  linkp: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>', box: '<path d="M3 8 12 3l9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', reload: '<path d="M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>', code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v2a3 3 0 0 0 6 0v-2a10 10 0 1 0-4 8"/>', cam: '<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/>',
  forum: '<path d="M4 4h16v12H10l-4 4v-4H4z"/>', news: '<path d="M4 5h12v14H6a2 2 0 0 1-2-2zM16 9h4v8a2 2 0 0 1-2 2M7 9h6M7 13h6"/>', person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
};
const ic = (k, s = 14, c = '') => h('span', { class: 'hd-ic ' + c, html: `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k] || SVG.mega}</svg>` });
const dv = (c, ...k) => h('div', { class: c }, ...k);
const sp = (c, ...k) => h('span', { class: c }, ...k);
const fill = (el, ...k) => { el.replaceChildren(...k.flat(Infinity).filter(x => x != null && x !== false)); return el; };

/* ---------- dates ---------- */
const day = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d.getTime(); };
const sod = t => new Date(t).setHours(0, 0, 0, 0);
const sameDay = (a, b) => sod(a) === sod(b);
const fday = t => new Date(t).toLocaleDateString(LG(), { day: 'numeric', month: 'short', year: 'numeric' });
const fdm = t => new Date(t).toLocaleDateString(LG(), { day: 'numeric', month: 'short' });
const fshort = t => new Date(t).toLocaleDateString(LG(), { day: '2-digit', month: '2-digit' });
const fstamp = t => new Date(t).toLocaleString(LG(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return y ? new Date(y, m - 1, d, 12).getTime() : null; };
const daysTo = t => Math.round((sod(t) - sod(Date.now())) / 864e5);
const nf = n => (n == null ? '—' : T(n.toLocaleString('en-US').replace(/,/g, '\u00a0'), n.toLocaleString('en-US')));
const nr = n => T(`${n} nouvelle${n > 1 ? 's' : ''} réponse${n > 1 ? 's' : ''}`, `${n} new repl${n > 1 ? 'ies' : 'y'}`);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- libellés ---------- */
const STS = () => [['idea', T('Idée', 'Idea')], ['draft', T('Brouillon', 'Draft')], ['approved', T('Validé', 'Approved')], ['published', T('Publié', 'Published')]];
const STK = { idea: '', draft: 'wn', approved: 'ac', published: 'ok' };
const stLabel = s => STS().find(x => x[0] === s)[1];
const CHK = () => [['nexus', 'Nexus Mods'], ['reddit', 'Reddit'], ['discord', 'Discord'], ['youtube', 'YouTube'], ['github', 'GitHub'], ['x', 'X'], ['bluesky', 'Bluesky'], ['instagram', 'Instagram'], ['forum', 'Forum'], ['other', T('Autre', 'Other')]];
const CHI = { nexus: 'box', reddit: 'bubbles', discord: 'bubble', youtube: 'play', github: 'code', x: 'at', bluesky: 'at', instagram: 'cam', forum: 'forum', other: 'mega' };
const CTK = () => [['youtuber', T('Youtubeur', 'YouTuber')], ['press', T('Presse', 'Press')], ['site', T('Site', 'Website')], ['discord', 'Discord'], ['forum', 'Forum'], ['other', T('Autre', 'Other')]];
const CTI = { youtuber: 'play', press: 'news', site: 'globe', discord: 'bubble', forum: 'forum', other: 'person' };
const CSS_ = () => [['toContact', T('À contacter', 'To contact')], ['contacted', T('Contacté', 'Contacted')], ['followedUp', T('Relancé', 'Followed up')], ['replied', T('A répondu', 'Replied')], ['accepted', T('Accepté', 'Accepted')], ['declined', T('Refusé', 'Declined')], ['covered', T('Publié chez eux', 'Covered')]];
const CSK = { toContact: '', contacted: 'ac', followedUp: 'ac', replied: 'wn', accepted: 'ok', covered: 'ok', declined: 'dg' };
const WAITING = s => s === 'contacted' || s === 'followedUp';
const MSK = () => [['teaser', 'Teaser'], ['announce', T('Annonce (Jour J)', 'Announcement (D-day)')], ['followup', T('Suivi', 'Follow-up')], ['other', T('Autre', 'Other')]];
const FBK = () => [['comment', T('Commentaires', 'Comments')], ['downloads', T('Téléchargements', 'Downloads')], ['endorsements', 'Endorsements'], ['stars', T('Étoiles', 'Stars')], ['views', T('Vues', 'Views')], ['other', T('Autre', 'Other')]];
const LANGS = [['fr', 'FR'], ['en', 'EN'], ['es', 'ES'], ['it', 'IT']];
let PLAT = {}; const mkPlat = () => ({ youtube: ['YouTube', '#ef4444', 'play', true], reddit: ['Reddit', '#f97316', 'bubbles', true], bluesky: ['Bluesky', '#38a0f5', 'at', true], github: ['GitHub', '#9ca3af', 'code', true], nexus: ['Nexus Mods', '#f59e0b', 'box', true], site: [T('Site web', 'Website'), '#4ade80', 'globe', true], instagram: ['Instagram', '#d4537d', 'cam', false], discord: ['Discord', '#8b8ff8', 'bubble', false], other: [T('Autre', 'Other'), '#9ca3af', 'mega', false] });
const platOf = ch => ({ nexus: 'nexus', reddit: 'reddit', discord: 'discord', youtube: 'youtube', github: 'github', bluesky: 'bluesky', x: 'bluesky', instagram: 'instagram' }[ch?.kind] || (ch?.site ? 'site' : 'other'));
const SITE = 'ancientrealms.example';
const MOD = 'Ancient Realms HD 1.4';
const NEXUS = 'https://www.nexusmods.com/skyrimspecialedition/mods/48210';

/* ---------- données d'exemple (lancement : aujourd'hui) ---------- */
function makeData() {
  let n = 0; const id = p => (p || 'i') + ++n;
  const ch = (name, kind, url, notes, extra = {}) => ({ id: id('c'), name, kind, url, notes, ...extra });
  const chans = [
    ch('Nexus Mods', 'nexus', 'https://www.nexusmods.com', T('Page du mod, actualités et commentaires : le canal principal des joueurs.', 'Mod page, news and comments: the main channel for players.')),
    ch('Reddit', 'reddit', 'https://www.reddit.com/r/skyrimmods', T('Une annonce par version. Auto-promotion autorisée le week-end seulement, flair « Release ».', 'One announcement per release. Self-promotion only allowed on weekends, “Release” flair.')),
    ch('Discord', 'discord', 'https://discord.com', T('Salon #nouveautés du serveur de la communauté. Demander avant de poster dans un autre salon.', 'The community server’s #new-releases channel. Ask before posting in any other channel.')),
    ch('YouTube', 'youtube', 'https://studio.youtube.com', T('Shorts pour les teasers, vidéo complète pour le jour J.', 'Shorts for teasers, a full video for D-day.')),
    ch('GitHub Releases', 'github', 'https://github.com', ''),
    ch('Bluesky / X', 'bluesky', 'https://bsky.app', ''),
    ch('Instagram', 'instagram', 'https://www.instagram.com', T('Visuels carrés, hashtags en fin de légende.', 'Square visuals, hashtags at the end of the caption.')),
    ch(T('Site du projet', 'Project website'), 'other', 'https://' + SITE, '', { site: true })];
  const byK = (k, i = 0) => chans.filter(c => c.kind === k)[i].id;
  const mk = (title, off, kind, ms, status = 'idea', x = {}) => ({ id: id('p'), title, t: day(off), ch: kind === 'site' ? chans[7].id : byK(kind), ms, status, drafts: {}, link: '', notes: '', stat: null, fb: [], ...x });
  const gain = (o, g) => (o == null ? null : Math.max(0, o - Math.round(o * g)));
  const stat = (v, l, c, s, d, g = .08, auto = true, ago = 3) => ({ v, l, c, s, d, p1: { v: gain(v, g), l: gain(l, g), c: gain(c, g), s: gain(s, g), d: gain(d, g) }, p7: { v: gain(v, g * 4), l: gain(l, g * 4), c: gain(c, g * 4), s: gain(s, g * 4), d: gain(d, g * 4) }, auto, t: Date.now() - ago * 36e5 });
  const ms = [['prep', -14, 'other', T('Préparation', 'Preparation')], ['teaser', -7, 'teaser', T('Teaser', 'Teaser')], ['preview', -3, 'teaser', T('Aperçu', 'Preview')], ['launch', 0, 'announce', T('Lancement', 'Launch')], ['follow', 3, 'followup', T('Suivi', 'Follow-up')], ['review', 30, 'followup', T('Bilan', 'Review')]]
    .map(([k, o, kind, title]) => ({ id: 'm_' + k, t: day(o), kind, title }));
  const mid = k => 'm_' + k;
  const NEXUS = 'https://www.nexusmods.com/skyrimspecialedition/mods/48210';
  const posts = [
    mk(T('Page du mod et fichiers prêts', 'Mod page and files ready'), -12, 'nexus', mid('prep'), 'published', { link: NEXUS, stat: stat(5120, 96, 5, null, 1240, .05) }),
    mk(T('Captures, bannière et courte vidéo', 'Screenshots, banner and short video'), -10, 'instagram', mid('prep'), 'published'),
    mk(T('Teaser : quelque chose arrive', 'Teaser: something is coming'), -7, 'bluesky', mid('teaser'), 'published', { link: 'https://bsky.app/profile/aelwyn.example/post/3kq2', stat: stat(null, 64, 7, 21, null, .04), fb: [{ id: id('f'), t: day(-6), kind: 'comment', value: 7, text: T('Réactions sympathiques sous le teaser', 'Friendly reactions under the teaser') }], drafts: { fr: 'Quelque chose arrive dans 7 jours… 👀\nAncient Realms HD 1.4 : des paysages en 4K qui ne coûtent pas d’images par seconde.\nRendez-vous le jour J !', en: 'Something is coming in 7 days… 👀\nAncient Realms HD 1.4: 4K landscapes that don’t cost you frames.\nSee you on D-day!' } }),
    mk(T('Visuel teaser', 'Teaser visual'), -7, 'instagram', mid('teaser'), 'published', { link: 'https://www.instagram.com/p/C9yEfGh/', stat: stat(1150, 98, 9, 0, null, .03, false, 30) }),
    mk(T('Aperçu de la fonction principale', 'Preview of the main feature'), -3, 'discord', mid('preview'), 'published', { link: 'https://discord.com/channels/1/2/3' }),
    mk(T('Vidéo courte de démonstration', 'Short demo video'), -2, 'youtube', mid('preview'), 'published', { link: 'https://www.youtube.com/shorts/aB3dEf9GhIj', stat: stat(3420, 210, 18, 0, null, .18, true, 1),
      fb: [{ id: id('f'), t: day(-1), kind: 'comment', value: 1, author: 'dovah_fan', text: T('Superbe travail ! Est-ce que ça tourne sur une carte de 8 Go ?', 'Great work! Does it run on an 8 GB card?'), unread: true }, { id: id('f'), t: day(0), kind: 'comment', value: 1, author: 'frostbite_88', text: T('La roche du nord est magnifique. Une version 1K pour les petites configs ?', 'The northern rock is gorgeous. A 1K version for low-end rigs?'), unread: true }, { id: id('f'), t: day(0), kind: 'views', value: 3420, text: '' }] }),
    mk(T('Billet de sortie sur le site', 'Release post on the website'), -1, 'site', mid('preview'), 'published', { link: 'https://' + SITE + '/news/1-4', stat: stat(640, null, null, null, null, .1, true, 2) }),
    mk(T('Annonce de sortie sur Reddit', 'Release announcement on Reddit'), 0, 'reddit', mid('launch'), 'approved', { drafts: {
      fr: `${MOD} est disponible : des paysages en 4K sans sacrifier vos images par seconde\n\nBonjour à tous,\n\nJe viens de publier ${MOD}, un projet fait sur mon temps libre :\n\n- Textures 4K de terrain, de roches et de montagnes\n- Mipmaps régénérées pour garder votre fluidité\n- Option 2K légère pour les cartes de 8 Go\n\nTéléchargement : ${NEXUS}\n\nVos retours, bugs et idées sont les bienvenus. Merci d'avance !`,
      en: `${MOD} is out: 4K landscapes without sacrificing your frame rate\n\nHi everyone,\n\nI've just released ${MOD}, a project I build in my spare time:\n\n- 4K terrain, rock and mountain textures\n- Regenerated mipmaps to keep your frame rate\n- Lightweight 2K option for 8 GB cards\n\nDownload: ${NEXUS}\n\nFeedback, bug reports and ideas are very welcome. Thanks in advance!` }, notes: T('Poster le samedi matin, flair « Release ». Répondre aux premiers commentaires dans l’heure.', 'Post on Saturday morning, “Release” flair. Answer the first comments within the hour.') }),
    mk(T('Page Nexus publiée', 'Nexus page published'), 0, 'nexus', mid('launch'), 'draft', { drafts: {
      fr: `Ancient Realms HD — des paysages en 4K\n\nTextures de terrain, de roches et de montagnes en 4K, avec une option 2K légère.\nPrérequis : aucun. Installation : gestionnaire de mods, ordre de chargement libre.\nVos retours sont les bienvenus dans les commentaires.`,
      en: `Ancient Realms HD — 4K landscapes\n\n4K terrain, rock and mountain textures, with a lightweight 2K option.\nRequirements: none. Install: any mod manager, load order doesn't matter.\nFeedback is welcome in the comments.` } }),
    mk(T('Présentation sur Discord', 'Introduction on Discord'), 0, 'discord', mid('launch'), 'draft', { drafts: {
      fr: `Bonjour ! Je viens de publier ${MOD} : des paysages en 4K, avec des mipmaps régénérées pour garder vos images par seconde. Gratuit, retours bienvenus.\nLien : ${NEXUS}\nSi ce n'est pas le bon salon, dites-le-moi et je retire le message.`,
      en: `Hi! I've just released ${MOD}: 4K landscapes with regenerated mipmaps to keep your frame rate. Free, feedback welcome.\nLink: ${NEXUS}\nIf this isn't the right channel, let me know and I'll remove the message.` } }),
    mk(T('Vidéo de présentation', 'Presentation video'), 1, 'youtube', mid('launch'), 'idea'),
    mk(T('Post « merci et retours »', '“Thanks and feedback” post'), 7, 'reddit', mid('follow'), 'idea'),
    mk(T('Bilan et prochaine version', 'Review and next version'), 30, 'github', mid('review'), 'idea')];
  const msg = (off, kind, dir, subject, body, to) => ({ id: id('m'), t: day(off) - 36e5 * 3, kind, dir, subject, body, to: to || '', mail: false });
  const contacts = [
    { id: id('k'), name: 'Nora Quill', kind: 'youtuber', url: 'https://www.youtube.com/@quillcast', email: 'nora@quillcast.example', lang: 'en', status: 'contacted', next: day(-1), coverage: '', notes: T('Chaîne « Quillcast » : tests de mods visuels, ~120 k abonnés. Préfère les captures en 4K.', '“Quillcast” channel: visual mod reviews, ~120k subs. Prefers 4K screenshots.'),
      messages: [msg(-7, 'first', 'sent', 'Proposal: Ancient Realms HD 1.4 launch', 'Hi Nora,\n\nI\'m Aelwyn. I\'m preparing “Ancient Realms HD 1.4 launch” and I think your audience might like it.\n\nIt\'s free and I\'m not asking anything in return; I\'m happy to answer any question.\n\nThanks for your time,\nAelwyn', 'nora@quillcast.example')] },
    { id: id('k'), name: 'Théo Marchand', kind: 'youtuber', url: 'https://www.youtube.com/@grimoire-moddeur', email: 'theo@grimoire-moddeur.example', lang: 'fr', status: 'toContact', next: null, coverage: '', notes: T('« Le Grimoire du Moddeur », chaîne francophone. Aime les mods légers.', '“Le Grimoire du Moddeur”, French-speaking channel. Likes lightweight mods.'), messages: [] },
    { id: id('k'), name: 'Pixel Prairie Gazette', kind: 'press', url: 'https://pixelprairie.example', email: 'tips@pixelprairie.example', lang: 'en', status: 'replied', next: null, coverage: '', notes: '', messages: [
      msg(-9, 'first', 'sent', 'Proposal: Ancient Realms HD 1.4 launch', 'Hi Pixel Prairie team,\n\nI\'m preparing “Ancient Realms HD 1.4 launch” and I think your readers might like it.\n\nIt\'s free; happy to send screenshots.\n\nThanks,\nAelwyn', 'tips@pixelprairie.example'),
      { ...msg(-2, 'reply', 'received', 'Re: Proposal: Ancient Realms HD 1.4 launch', 'Thanks for reaching out! We\'d love to cover the launch. Could you send us three screenshots (4K) and the Nexus link on D-day morning?\n\nCheers,\nJune, Pixel Prairie Gazette', 'tips@pixelprairie.example'), mail: true }] },
    { id: id('k'), name: 'Skyline Modders', kind: 'discord', url: 'https://discord.com/invite/skyline', email: '', lang: 'en', status: 'followedUp', next: day(3), coverage: '', notes: T('Serveur Discord de 8 000 membres. Salon #nouveautés.', '8,000-member Discord server. #new-releases channel.'), messages: [
      msg(-6, 'first', 'sent', 'Proposal: Ancient Realms HD 1.4 launch', 'Hi,\n\nCould I announce my mod in #new-releases on launch day?\n\nThanks,\nAelwyn', ''), msg(-1, 'followUp', 'sent', 'Following up: Ancient Realms HD 1.4 launch', 'Hi,\n\nJust a quick follow-up about my announcement. No worries if it isn\'t a fit.\n\nThanks,\nAelwyn', '')] },
    { id: id('k'), name: 'Elias Grant', kind: 'youtuber', url: 'https://www.youtube.com/@dovahdigest', email: 'elias@dovahdigest.example', lang: 'en', status: 'covered', next: null, coverage: 'https://www.youtube.com/watch?v=Qw8Lm2xYz0A', notes: T('« Dovah Digest » : a présenté la version 1.3.', '“Dovah Digest”: featured version 1.3.'), messages: [
      msg(-40, 'first', 'sent', 'Proposal: Ancient Realms HD 1.3', 'Hi Elias,\n\n…', 'elias@dovahdigest.example'), { ...msg(-38, 'reply', 'received', 'Re: Proposal', 'Sure, send it over!', 'elias@dovahdigest.example'), mail: false }] }];
  const camp = (name, event, notes, live) => ({ id: id('x'), name, event, notes, ms: live ? ms : [], posts: live ? posts : [], contacts: live ? contacts : [] });
  const c1 = camp(T('Lancement d’Ancient Realms HD 1.4', 'Ancient Realms HD 1.4 launch'), day(0), T('Message central : des paysages en 4K qui ne coûtent pas de performances.\nPublic : joueurs de Skyrim SE sur cartes de 8 Go.', 'Core message: 4K landscapes that don’t cost performance.\nAudience: Skyrim SE players on 8 GB cards.'), true);
  const c2 = camp(T('Exemple : lancement de mon mod', 'Example: my mod’s launch'), day(21), T('Campagne d’exemple, à adapter ou à supprimer.', 'Example campaign, to adapt or delete.'), false);
  const watch = [
    { id: id('w'), name: 'SkyBloom Shaders', kind: 'github', ref: 'ghostdev/skybloom-shaders', notes: '', checked: Date.now() - 4 * 864e5, hist: [{ t: Date.now() - 20 * 864e5, v: 'v1.3.0', pub: Date.now() - 21 * 864e5 }, { t: Date.now() - 6 * 864e5, v: 'v1.3.0', pub: Date.now() - 21 * 864e5 }] },
    { id: id('w'), name: 'Frostfall Toolkit', kind: 'nexus', ref: 'skyrimspecialedition/66001', notes: T('Prérequis de ma page de mod.', 'Requirement of my mod page.'), checked: Date.now() - 4 * 864e5, hist: [{ t: Date.now() - 4 * 864e5, v: '4.2', pub: Date.now() - 34 * 864e5, dl: 871950, end: 61402 }] }];
  return { camps: [c1, c2], chans, watch, id, nextCheck: Date.now() + 36e5 };
}

/* Nom de l'appli : lettre minuscule colorée dans tous les textes (CSS Custom Highlight API), sauf dans les menus déroulants. */
function brandHL(root, name, key) {
  if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return () => {};
  const k = [...name].findIndex(c => c >= 'a' && c <= 'z'); let raf = 0;
  const run = () => {
    raf = 0; const rs = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.includes(name) && !n.parentElement.closest('.lc,.hd-pop,.mono,option,textarea,script,style') ? 1 : 3) });
    for (let n; (n = tw.nextNode());) { let i = -1; while ((i = n.nodeValue.indexOf(name, i + 1)) >= 0) { const r = new Range(); r.setStart(n, i + k); r.setEnd(n, i + k + 1); rs.push(r); } }
    CSS.highlights.set(key, new Highlight(...rs));
  };
  const obs = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); }); obs.observe(root, { childList: true, subtree: true, characterData: true }); run();
  return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); CSS.highlights.delete(key); };
}

const TABS = ['today', 'calendar', 'posts', 'contacts', 'stats', 'feedback', 'watch', 'channels', 'browser'];
const TI = { today: 'sun', calendar: 'calendar', posts: 'doc', contacts: 'people', stats: 'chart', feedback: 'bubbles', watch: 'eye', channels: 'mega', browser: 'globe', agent: 'spark' };
const TN = () => ({ today: T('Aujourd’hui', 'Today'), calendar: T('Calendrier', 'Calendar'), posts: T('Publications', 'Posts'), contacts: 'Contacts', stats: T('Statistiques', 'Statistics'), feedback: T('Retours', 'Feedback'), watch: T('Veille', 'Monitoring'), channels: T('Canaux', 'Channels'), browser: T('Navigateur', 'Browser'), agent: T('Agent IA', 'AI agent') });
const HEAD = () => ({ today: T('Ce qui demande votre attention maintenant.', 'What needs your attention right now.'), calendar: T('Jalons et publications, mois par mois.', 'Milestones and posts, month by month.'), posts: T('Textes, suivi et lien de chaque publication.', 'Texts, tracking and link of each post.'), contacts: T('Youtubeurs, presse, sites : qui contacter, quand relancer.', 'YouTubers, press, sites: who to contact, when to follow up.'), stats: T('Ce qui a été diffusé pour la campagne, en chiffres.', 'What went out for the campaign, in numbers.'), feedback: T('Commentaires et réponses reçus, publication par publication.', 'Comments and replies received, post by post.'), watch: T('Versions des produits suivis et rapport de la semaine.', 'Versions of watched products and the weekly report.'), channels: T('Les endroits où vous publiez.', 'The places where you publish.'), browser: T('Les sites de la campagne, sans quitter hERALD.', 'The campaign’s sites, without leaving hERALD.') });
const RULE = () => T('hERALD ne publie jamais ; il n’envoie un e-mail que sur votre clic.', 'hERALD never publishes; it only sends an email when you click.');
const RULE_LONG = () => T('hERALD ne publie rien : il prépare vos textes, les copie dans le presse-papiers et suit vos publications. Il n’envoie un e-mail de démarchage que sur votre clic, après confirmation, par l’app Mail. La veille ne fait que lire des pages publiques (GitHub, Nexus).', 'hERALD publishes nothing: it prepares your texts, copies them to the clipboard and tracks your posts. It only sends an outreach email when you click, after confirmation, through the Mail app. Monitoring only reads public pages (GitHub, Nexus).');

export function open(app) {
  css('css/demos/hERALD.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, minw: 900, minh: 600, bare: true, cls: 'socle hd-win',
    onclose: w => { w.dead = true; w.cleanup && w.cleanup(); },
    build: w => build(w, app) });
}

function build(w, app) {
  PLAT = mkPlat();
  const alive = () => !w.dead, D = makeData(), timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); return t; };
  const st = { tab: 'today', ci: 0, q: '', selTodo: null, selPost: D.camps[0].posts[7].id, selContact: D.camps[0].contacts[0].id, selFb: null, selWatch: null, selChan: null, month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime(),
    pFilter: null, pChan: null, cFilter: 'all', period: 'campaign', itab: 'text', lang: T('fr', 'en'), agentOn: true, agentOpen: false, scopeTask: false, mail: 'mail', icon: 'dock', inbox: 0, inboxLog: [], backup: null, statsChecked: Date.now() - 36e5 * 3, watchChecked: false, busy: false };
  const C = () => D.camps[st.ci] || null, posts = () => (C() ? C().posts : []), contacts = () => (C() ? C().contacts : []);
  const post = id => posts().find(p => p.id === id), contact = id => contacts().find(c => c.id === id), chan = id => D.chans.find(c => c.id === id);
  const root = dv('hd'), side = h('aside', { class: 'hd-side' }), main = h('main', { class: 'hd-main' }), agentEl = h('aside', { class: 'hd-agent', hidden: true });
  const layers = [], pop = dv('hd-pop'); pop.hidden = true;
  const eHead = dv('hd-head'), eBody = dv('hd-body'), eStatus = dv('hd-status hd-panel');
  main.append(eHead, eBody, eStatus);
  root.append(dv('hd-title', wm.lights(w)), side, main, agentEl, pop);
  root.firstChild.setAttribute('data-drag', '');
  w.unbrand = brandHL(root, 'hERALD', 'hd-brand');
  let view = null;

  /* ---------- composants ---------- */
  const btn = (l, cls, fn, o = {}) => h('button', { class: 'hd-b ' + (cls || ''), onclick: fn, ...o }, l);
  const badge = (t, k = '') => sp('hd-badge ' + k, t);
  const stBadge = s => badge(stLabel(s), STK[s]);
  const panel = (c, ...k) => dv('hd-panel ' + (c || ''), ...k);
  const empty = t => dv('hd-empty', h('p', {}, t));
  const lbl = (t, ...k) => dv('hd-fld', dv('hd-lbl', t), ...k);
  const eyebrow = t => dv('hd-eyebrow', t);
  const meta = (t, c = '') => dv('hd-meta ' + c, t);
  const inp = (v, fn, o = {}) => h('input', { class: 'hd-in', value: v ?? '', oninput: e => fn(e.target.value), autocomplete: 'off', spellcheck: 'false', ...o });
  const area = (v, fn, o = {}) => { const a = h('textarea', { class: 'hd-in ta', oninput: e => fn(e.target.value), spellcheck: 'false', ...o }); a.value = v || ''; return a; };
  const sel = (opts, v, fn, cls) => h('select', { class: 'hd-sel ' + (cls || ''), onchange: e => fn(e.target.value) }, opts.map(([k, l]) => h('option', { value: k, selected: k === v }, l)));
  const seg = (opts, cur, fn, cls) => { const el = dv('hd-seg ' + (cls || '')); opts.forEach(([k, l]) => { const b = h('button', { class: k === cur ? 'on' : '', 'aria-pressed': String(k === cur), onclick: () => { el.querySelectorAll('button').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); sfx.tick(); fn(k); } }, l); el.append(b); }); return el; };
  const chk = (label, on, fn) => h('label', { class: 'hd-chk' }, h('input', { type: 'checkbox', checked: on, onchange: e => { sfx.tick(); fn(e.target.checked); } }), h('i', {}), h('span', {}, label));
  const callout = (k, t) => dv('hd-call ' + k, ic(k === 'wn' ? 'warn' : 'info', 16), sp('', t));
  const sectionBar = (title, ...right) => dv('hd-sbar', sp('hd-eyebrow', title), sp('fl'), ...right);
  const spin = () => sp('hd-spin');
  const demo = m => toast({ icon: icon(app.id), title: 'hERALD', body: m });
  const copyBtn = (label, textFn, cls, dis) => { const b = h('button', { class: 'hd-b ' + (cls || ''), disabled: dis, onclick: async () => { try { await navigator.clipboard.writeText(textFn()); } catch {} sfx.pop(); const o = b.textContent; b.textContent = T('Copié ✓', 'Copied ✓'); b.classList.add('done'); later(() => { b.textContent = o; b.classList.remove('done'); }, 1400); } }, label); return b; };
  const countUp = (el, to, fmt = nf, from = 0) => { if (reduced() || to == null) { el.textContent = fmt(to); return; } const t0 = performance.now(), D_ = 700; const step = t => { if (!alive() || !el.isConnected) return; const k = clamp((t - t0) / D_, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

  /* ---------- menus contextuels et feuilles ---------- */
  const hidePop = () => { pop.hidden = true; pop.replaceChildren(); };
  const showPop = (items, at, o = {}) => {
    pop.replaceChildren(...items.map(it => (it === '-' ? h('hr') : it[0] === '__' ? dv('hd-pl', it[1]) : h('button', { class: 'hd-mi' + (it[2]?.on ? ' on' : ''), disabled: it[2]?.off, onclick: () => { hidePop(); it[1](); } }, sp('ck', it[2]?.on ? '✓' : ''), sp('', it[0])))));
    pop.hidden = false; pop.style.minWidth = (o.min || 200) + 'px';
    const s = S.scale || 1, rr = root.getBoundingClientRect(); let x, y;
    if (at.getBoundingClientRect) { const r = at.getBoundingClientRect(); x = (r.left - rr.left) / s; y = (r.bottom - rr.top) / s + 4; if (o.up) y = (r.top - rr.top) / s - pop.offsetHeight - 4; } else { x = (at.x - rr.left) / s; y = (at.y - rr.top) / s; }
    x = clamp(x, 8, root.clientWidth - pop.offsetWidth - 8); y = clamp(y, 40, root.clientHeight - pop.offsetHeight - 8);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  };
  const closeModal = () => { const l = layers.pop(); l && l.remove(); };
  const sheet = (title, body, foot, wd = 560) => {
    const scrim = dv('hd-scrim', h('div', { class: 'hd-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title || '', style: { width: wd + 'px' } }, dv('hd-sbody hd-scroll', title ? h('h2', { class: 'hd-h2' }, title) : null, body), foot ? dv('hd-shfoot', foot) : null));
    layers.push(scrim); root.append(scrim); sfx.click(); hidePop();
    const close = () => { const i = layers.indexOf(scrim); if (i >= 0) { layers.splice(i, 1); scrim.remove(); } };
    const f = scrim.querySelector('.hd-shfoot .hd-b.pri') || scrim.querySelector('input,textarea,select'); f && f.focus({ preventScroll: true }); return close;
  };
  const confirmBox = (title, msg, label, fn, danger) => { const close = sheet(title, msg ? h('p', { class: 'hd-p' }, msg) : null, [btn(T('ANNULER', 'CANCEL'), '', () => close()), btn(label, danger ? 'dg' : 'pri', () => { close(); fn(); })], 440); };
  w.away = e => { if (!pop.hidden && !pop.contains(e.target)) hidePop(); }; addEventListener('pointerdown', w.away, true);

  /* ---------- calculs ---------- */
  const unread = p => p.fb.filter(f => f.unread).length;
  const unreadAll = () => posts().reduce((a, p) => a + unread(p), 0);
  const total = (p, k) => { const it = p.fb.filter(f => f.kind === k); return k === 'comment' || k === 'other' ? it.reduce((a, f) => a + f.value, 0) : (it.sort((a, b) => b.t - a.t)[0] || { value: 0 }).value; };
  const dueC = c => WAITING(c.status) && c.next != null && sod(c.next) <= sod(Date.now());
  const platOfPost = p => platOf(chan(p.ch));
  const dlt = (s, per) => { if (per === 'campaign') return s; const b = per === 'day' ? s.p1 : s.p7; const f = k => (s[k] == null ? null : Math.max(0, s[k] - (b[k] ?? 0))); return { v: f('v'), l: f('l'), c: f('c'), s: f('s'), d: f('d') }; };
  const sum = (a, k) => a.reduce((x, y) => x + (y[k] || 0), 0);
  function summary(per) {
    const rows = posts().filter(p => p.stat).map(p => ({ p, plat: platOfPost(p), s: p.stat, d: dlt(p.stat, per), g: (() => { const d = dlt(p.stat, 'day'); return d.v != null ? d.v : (d.l || 0) + (d.c || 0) + (d.s || 0); })() }));
    const siteRows = rows.filter(r => r.plat === 'site'), other = rows.filter(r => r.plat !== 'site');
    const ds = rows.map(r => r.d);
    const plats = [...new Set(rows.map(r => r.plat))].map(k => { const rr = rows.filter(r => r.plat === k); return { k, v: sum(rr.map(r => r.d), 'v'), i: sum(rr.map(r => r.d), 'l') + sum(rr.map(r => r.d), 'c') + sum(rr.map(r => r.d), 's'), dl: sum(rr.map(r => r.d), 'd') }; });
    return { rows, views: sum(other.map(r => r.d), 'v'), inter: sum(ds, 'l') + sum(ds, 'c') + sum(ds, 's'), dl: sum(ds, 'd'), site: sum(siteRows.map(r => r.d), 'v'), best: rows.slice().sort((a, b) => b.g - a.g)[0], plats };
  }
  const todos = () => {
    const c = C(); if (!c) return []; const out = [], now = Date.now();
    posts().forEach(p => { if (p.status !== 'published') { if (sameDay(p.t, now)) out.push({ id: 'pt' + p.id, kind: 'today', post: p.id, title: p.title, meta: stLabel(p.status), ic: 'plane' }); else if (p.t < now) out.push({ id: 'pl' + p.id, kind: 'late', post: p.id, title: p.title, meta: T('en retard', 'late'), ic: 'alert' }); } });
    posts().filter(p => p.status === 'published' && !p.link.trim()).forEach(p => out.push({ id: 'nl' + p.id, kind: 'nolink', post: p.id, title: p.title, meta: T('lien à ajouter', 'link to add'), ic: 'linkp' }));
    posts().filter(p => unread(p)).forEach(p => out.push({ id: 'fb' + p.id, kind: 'fb', post: p.id, title: p.title, meta: nr(unread(p)), ic: 'bubble' }));
    contacts().forEach(k => { if (dueC(k)) out.push({ id: 'cf' + k.id, kind: 'follow', contact: k.id, title: k.name, meta: T('relance le ', 'follow-up on ') + fshort(k.next), ic: 'mail' }); else if (WAITING(k.status)) out.push({ id: 'ct' + k.id, kind: 'track', contact: k.id, title: k.name, meta: k.next != null ? T('relance le ', 'follow-up on ') + fshort(k.next) : stLabel(k.status), ic: 'hourglass' }); });
    return out;
  };
  const todoCount = () => todos().filter(t => t.kind !== 'track').length;
  const stLabelC = s => CSS_().find(x => x[0] === s)[1];
  const nextMs = () => { const t = sod(Date.now()); return (C()?.ms || []).filter(m => m.t >= t).sort((a, b) => a.t - b.t); };

  /* ---------- barre latérale ---------- */
  const order = () => [...TABS.slice(0, 8), ...(st.agentOn ? ['agent'] : []), 'browser'];
  const count = k => (k === 'today' ? todoCount() : k === 'feedback' ? unreadAll() : k === 'contacts' ? contacts().filter(dueC).length : 0);
  const cdChip = c => { const d = daysTo(c.event); return sp('hd-cd ' + (d === 0 ? 'ok' : d < 0 ? '' : d <= 7 ? 'wn' : 'ac'), d > 0 ? T('J-', 'D-') + d : d === 0 ? T('Jour J', 'D-day') : T('J+', 'D+') + -d); };
  function drawSide() {
    const c = C(), N = TN(), ord = order();
    const row = (k) => { const n = count(k); const act = k === 'agent' ? st.agentOpen : st.tab === k && !(st.agentOpen && st.agentOn);
      return h('button', { class: 'hd-sr' + (act ? ' on' : ''), title: N[k], 'aria-label': N[k], 'aria-current': act ? 'page' : null, disabled: k === 'agent' && !c, onclick: () => (k === 'agent' ? toggleAgent() : go(k)) }, ic(TI[k], 15), sp('t', N[k]), n ? sp('hd-n', n) : null); };
    const grp = (t, ks) => dv('hd-grp', dv('hd-gt', t), ks.map(row));
    const done = posts().filter(p => p.status === 'published').length, tot = posts().length, pct = tot ? Math.round(done / tot * 100) : 0;
    fill(side, dv('hd-brand', h('b', { html: brand('hERALD', HC) })),
      h('button', { class: 'hd-pick', 'aria-label': T('Campagnes', 'Campaigns'), onclick: e => campMenu(e.currentTarget) }, sp('dot'), sp('t nm', c ? c.name : T('Aucune campagne', 'No campaign')), c ? cdChip(c) : null, ic('chud', 12, 'sub')),
      dv('hd-sscroll hd-scroll', grp(T('Campagne', 'Campaign'), ['today', 'calendar', 'posts']), grp(T('Démarchage', 'Outreach'), ['contacts']), grp(T('Résultats', 'Results'), ['stats', 'feedback', 'watch']), grp(T('Outils', 'Tools'), ['channels', ...(st.agentOn ? ['agent'] : []), 'browser'])),
      dv('hd-sfoot', row0('gear', T('Réglages', 'Settings'), settingsSheet), row0('info', T('À propos de hERALD', 'About hERALD'), aboutSheet), h('hr'),
        dv('hd-prog t', dv('hd-pr', sp('', T(`${done} / ${tot} publiées`, `${done} / ${tot} published`)), sp('fl'), sp('hd-ts', tot ? pct + ' %' : '—')), dv('hd-bar', h('i', { style: { width: pct + '%' } }))),
        h('button', { class: 'hd-inb t' + (st.inbox ? ' wn' : ''), title: T('Boîte de dépôt', 'Drop box'), onclick: () => { if (st.inbox) { st.inbox = 0; drawSide(); settingsSheet(); } else demo(T('Ouvrirait le dossier de dépôt dans le Finder.', 'Would open the drop-box folder in the Finder.')); } }, sp('dot'), sp('', st.inbox ? T(`${st.inbox} fichier${st.inbox > 1 ? 's' : ''} traité${st.inbox > 1 ? 's' : ''}`, `${st.inbox} file${st.inbox > 1 ? 's' : ''} processed`) : T('Boîte de dépôt à jour', 'Drop box up to date')))));
    function row0(k, label, fn) { return h('button', { class: 'hd-sr', title: label, 'aria-label': label, onclick: fn }, ic(k, 15), sp('t', label)); }
  }
  const campMenu = at => {
    showPop([...D.camps.map((c, i) => [c.name, () => { st.ci = i; st.selPost = null; st.selContact = null; st.selTodo = null; go(st.tab, true); }, { on: i === st.ci }]), '-', [T('Nouvelle campagne', 'New campaign'), addCampaign], [T('Modifier la campagne', 'Edit campaign'), campaignSheet, { off: !C() }], [T('Supprimer la campagne', 'Delete campaign'), delCampaign, { off: !C() }], '-', ['__', 'Plan'],
      [T('Exporter le plan…', 'Export plan…'), () => demo(T('Enregistrerait le plan dans un fichier .herald.', 'Would save the plan to a .herald file.'))], [T('Importer un plan…', 'Import a plan…'), () => demo(T('Ouvrirait le sélecteur de fichiers de macOS.', 'Would open the macOS file picker.'))], [T('Ouvrir la boîte de dépôt', 'Open the drop box'), () => demo(T('Ouvrirait le dossier de dépôt dans le Finder.', 'Would open the drop-box folder in the Finder.'))],
      [T('Ajouter la campagne d’exemple', 'Add the example campaign'), () => { if (!D.camps.some(c => c.sample)) { const e = makeData().camps[1]; e.sample = true; e.id = D.id('x'); D.camps.push(e); } st.ci = D.camps.length - 1; go(st.tab, true); }]], at, { min: 232 });
  };
  function addCampaign() { const c = { id: D.id('x'), name: T('Nouvelle campagne', 'New campaign'), event: day(30), notes: '', ms: [], posts: [], contacts: [] }; D.camps.push(c); st.ci = D.camps.length - 1; st.selPost = null; sfx.pop(); go('today', true); campaignSheet(); }
  function delCampaign() { const c = C(); if (!c) return; confirmBox(T('Supprimer la campagne', 'Delete campaign'), T(`Supprimer la campagne « ${c.name} » et toutes ses publications ?`, `Delete the campaign “${c.name}” and all its posts?`), T('Supprimer la campagne', 'Delete campaign'), () => { D.camps.splice(st.ci, 1); st.ci = clamp(st.ci - 1, 0, Math.max(0, D.camps.length - 1)); st.selPost = null; st.selContact = null; go(st.tab, true); }, true); }
  function campaignSheet() {
    const c = C(); if (!c) return; const e = { name: c.name, ev: iso(c.event), notes: c.notes };
    const close = sheet(T('Modifier la campagne', 'Edit campaign'), dv('hd-form', lbl(T('Nom', 'Name'), inp(e.name, v => (e.name = v))), lbl(T('Date de l’événement', 'Event date'), h('input', { class: 'hd-in', type: 'date', value: e.ev, onchange: ev => (e.ev = ev.target.value) })), lbl(T('Message central et notes', 'Core message and notes'), area(e.notes, v => (e.notes = v), { rows: 5 }))),
      [btn(T('ANNULER', 'CANCEL'), '', () => close()), btn(T('ENREGISTRER', 'SAVE'), 'pri', () => { c.name = e.name.trim() || c.name; c.event = fromIso(e.ev) || c.event; c.notes = e.notes; close(); go(st.tab, true); })], 520);
  }

  /* ---------- en-tête, barre d'état ---------- */
  function drawHead() {
    const N = TN(), t = st.tab, has = !!C(), searchable = !['stats', 'browser'].includes(t);
    const np = [T('Nouvelle publication', 'New post'), () => newPost()], prim = { today: np, calendar: np, posts: np, contacts: [T('Nouveau contact', 'New contact'), newContact] }[t];
    const si = h('input', { class: 'hd-sin', value: st.q, placeholder: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), spellcheck: 'false', oninput: e => { st.q = e.target.value; clr.hidden = !st.q; view?.refresh?.(); } });
    const clr = h('button', { class: 'hd-sx', hidden: !st.q, 'aria-label': T('Effacer la recherche', 'Clear search'), onclick: () => { st.q = ''; si.value = ''; clr.hidden = true; view?.refresh?.(); si.focus({ preventScroll: true }); } }, ic('xc', 14));
    w.search = si;
    fill(eHead, dv('hd-ht', h('h1', {}, N[t]), h('p', {}, HEAD()[t])), searchable ? dv('hd-search', ic('search', 13, 'sub'), si, clr) : null, prim && has ? btn(prim[0], 'pri', prim[1]) : null);
  }
  const fitStatus = () => { eStatus.classList.remove('tight'); if ([...eStatus.children].some(c => c.scrollWidth > c.clientWidth + 1)) eStatus.classList.add('tight'); };
  function drawStatus() {
    const next = Math.max(st.statsChecked + 36e5, Date.now()), c = C();
    fill(eStatus, st.busy ? spin() : null, sp('hd-stc', st.statsChecked ? T(`Relevé : ${fstamp(st.statsChecked)} · prochain : ${fstamp(next)}`, `Last check: ${fstamp(st.statsChecked)} · next: ${fstamp(next)}`) : T('Aucun relevé pour l’instant', 'No statistics check yet')), sp('sepd', '·'), sp('hd-stw', T(`Veille : ${D.watch.length} produit${D.watch.length > 1 ? 's' : ''}`, `Monitoring: ${D.watch.length} product${D.watch.length > 1 ? 's' : ''}`)), sp('fl'), sp('hd-rule', RULE())); fitStatus();
  }

  /* ---------- navigation ---------- */
  function go(tab, force) {
    if (tab !== st.tab || force) { if (tab !== st.tab) st.q = ''; st.tab = tab; }
    view?.dispose?.(); hidePop(); drawHead(); drawSide(); drawStatus();
    const c = C();
    if (!c && !['channels', 'watch', 'browser'].includes(tab)) { view = null; fill(eBody, panel('hd-nocamp', empty(T('Aucune campagne. Créez-en une pour planifier vos publications.', 'No campaign. Create one to plan your posts.')), btn(T('Nouvelle campagne', 'New campaign'), 'pri', addCampaign))); }
    else { view = V[tab](); fill(eBody, view.el); }
    agentEl.hidden || drawAgent();
  }
  const refreshAll = () => { drawSide(); drawStatus(); view?.refresh?.(); view?.detail?.(); };
  const refreshLite = () => { drawSide(); view?.refresh?.(); };
  const openPost = id => { st.selPost = id; go('posts'); };
  const openUrl = u => { if (!u) return; B.open(u); go('browser'); };

  /* ---------- liste + détail ---------- */
  function split(o) {
    const lp = panel('hd-listp hd-scroll'), dp = panel('hd-detp'), el = dv('hd-split', lp, dp);
    const v = { el, list() { fill(lp, o.list()); }, detail() { fill(dp, o.detail()); }, refresh() { v.list(); }, dispose: o.dispose };
    v.list(); v.detail(); return v;
  }
  const row = (o) => h('button', { class: 'hd-ir' + (o.on ? ' on' : '') + (o.dim ? ' dim' : ''), onclick: e => { o.fn(e); syncAgent(); }, 'aria-pressed': o.on ? 'true' : null }, dv('hd-ii' + (o.tint ? ' ' + o.tint : ''), ic(o.ic, 13)), sp('hd-it', o.title), o.meta ? sp('hd-im ' + (o.mc || ''), o.meta) : null, o.trail || null);
  const match = (...t) => { const q = st.q.trim().toLowerCase(); return !q || t.some(x => (x || '').toLowerCase().includes(q)); };

  /* ---------- Aujourd'hui ---------- */
  const V = {};
  V.today = () => {
    const kpis = dv('hd-kpis'), s1 = () => summary('day');
    const kpi = (l, v, sub, fn) => { const val = sp('hd-val'); const t = dv('hd-kpi', dv('hd-eyebrow', l), val, dv('hd-meta', sub || ' ')); fn ? val.textContent = v : countUp(val, v); return t; };
    const drawK = () => { const s = s1(), m = nextMs()[0]; fill(kpis, kpi(T('Vues +24 h', 'Views +24 h'), s.views), kpi(T('Interactions', 'Interactions'), s.inter), kpi(T('Téléchargements', 'Downloads'), s.dl), kpi(T('Prochaine étape', 'Next step'), m ? (daysTo(m.t) === 0 ? T('Jour J', 'D-day') : T('J-', 'D-') + daysTo(m.t)) : '—', m ? m.title : T('Aucun jalon à venir', 'No upcoming milestone'), true)); };
    drawK();
    const v = split({
      list: () => { const items = todos().filter(t => match(t.title, t.meta)); return [sectionBar(T('À faire', 'To do'), sp('hd-meta', items.length)), items.length ? null : dv('hd-pad', meta(T('Rien à faire aujourd’hui.', 'Nothing to do today.'))),
        items.map(t => row({ on: st.selTodo === t.id, ic: t.ic, tint: t.kind === 'track' ? '' : 'br', title: t.title, meta: t.meta, mc: t.kind === 'late' ? 'dg' : t.kind === 'follow' ? 'wn' : '', fn: () => { st.selTodo = t.id; if (t.post) st.selPost = t.post; if (t.contact) st.selContact = t.contact; v.refresh(); v.detail(); } }))]; },
      detail: () => { const t = todos().find(x => x.id === st.selTodo); const host = dv('hd-fill'); if (t?.contact && contact(t.contact)) return contactDetail(t.contact); if (t?.post && post(t.post)) { mountInspector(host, t.post); return host; }
        const up = nextMs().slice(0, 3); return dv('hd-pad', eyebrow(T('Prochains jours', 'Coming days')), up.map(m => dv('hd-up', sp('hd-meta d', fday(m.t)), sp('nm', m.title), sp('fl'), badge(MSK().find(x => x[0] === m.kind)[1]))), up.length ? null : meta(T('Aucun jalon à venir', 'No upcoming milestone')), sp('fl'), meta(T('Choisissez une ligne pour l’ouvrir ici.', 'Pick a line to open it here.'))); } });
    const wrap = dv('hd-col', kpis, v.el);
    return { el: wrap, refresh() { drawK(); v.refresh(); }, detail: v.detail };
  };

  /* ---------- Calendrier ---------- */
  V.calendar = () => {
    const el = dv('hd-panel hd-cal'), bar = dv('hd-calbar'), wd = dv('hd-wd'), grid = dv('hd-grid');
    el.append(bar, wd, grid);
    const first = () => new Date(st.month), wk = new Intl.DateTimeFormat(LG(), { weekday: 'short' });
    const fw = lang => (lang === 'fr' ? 1 : 0);
    const draw = () => {
      const m = first(), fwk = fw(T('fr', 'en')), off = (m.getDay() - fwk + 7) % 7, cnt = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), cells = Math.ceil((off + cnt) / 7) * 7;
      fill(bar, h('button', { class: 'hd-b sq', 'aria-label': T('Mois précédent', 'Previous month'), onclick: () => { st.month = new Date(m.getFullYear(), m.getMonth() - 1, 1).getTime(); draw(); } }, ic('chl', 14)), h('h2', { class: 'hd-mh' }, cap(m.toLocaleDateString(LG(), { month: 'long', year: 'numeric' }))), h('button', { class: 'hd-b sq', 'aria-label': T('Mois suivant', 'Next month'), onclick: () => { st.month = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime(); draw(); } }, ic('chr', 14)),
        btn(T('Aujourd’hui', 'Today'), 'ter', () => { const n = new Date(); st.month = new Date(n.getFullYear(), n.getMonth(), 1).getTime(); draw(); }), btn(T('Jour J', 'D-day'), 'ter', () => { const n = new Date(C().event); st.month = new Date(n.getFullYear(), n.getMonth(), 1).getTime(); draw(); }), sp('fl'), STS().map(([k]) => stBadge(k)));
      fill(wd, Array.from({ length: 7 }, (_, i) => sp('', wk.format(new Date(2024, 0, 7 + ((i + fwk) % 7))).toUpperCase().replace('.', ''))));
      grid.style.gridTemplateRows = `repeat(${cells / 7},minmax(0,1fr))`;
      fill(grid, Array.from({ length: cells }, (_, i) => { const d = new Date(m.getFullYear(), m.getMonth(), 1 - off + i, 12), t = d.getTime(), inM = d.getMonth() === m.getMonth(), today = sameDay(t, Date.now());
        const ps = posts().filter(p => sameDay(p.t, t) && match(p.title, chan(p.ch)?.name, p.notes)), ms_ = C().ms.filter(x => sameDay(x.t, t)), ev = sameDay(C().event, t);
        const cell = dv('hd-day' + (inM ? '' : ' out') + (today ? ' today' : ''), dv('hd-dn', h('b', {}, d.getDate()), ev ? ic('star', 11, 'wn') : null), ms_.map(x => dv('hd-ms', x.title)), dv('hd-chips', ps.map(p => h('button', { class: 'hd-pc', title: `${chan(p.ch)?.name || ''} · ${p.title} · ${stLabel(p.status)}`, onclick: () => openPost(p.id) }, sp('d ' + STK[p.status]), ic(CHI[chan(p.ch)?.kind] || 'mega', 10, 'sub'), sp('', p.title)))));
        const add = () => { newPost(t); };
        cell.addEventListener('contextmenu', e => { e.preventDefault(); showPop([[T('Nouvelle publication ce jour', 'New post on this day'), add]], { x: e.clientX, y: e.clientY }); });
        cell.addEventListener('dblclick', e => { if (!e.target.closest('.hd-pc')) add(); });
        return cell; }));
    };
    draw(); return { el, refresh: draw };
  };

  /* ---------- Publications ---------- */
  function newPost(t) { const p = { id: D.id('p'), title: T('Nouvelle publication', 'New post'), t: t || day(0), ch: D.chans[0]?.id, ms: null, status: 'idea', drafts: {}, link: '', notes: '', stat: null, fb: [] }; C().posts.push(p); st.selPost = p.id; sfx.pop(); st.pFilter = null; st.pChan = null; if (st.tab !== 'posts') go('posts'); else { refreshAll(); } }
  V.posts = () => {
    const lateP = p => p.status !== 'published' && sod(p.t) < sod(Date.now());
    const v = split({
      list: () => { const rows = posts().filter(p => (!st.pFilter || p.status === st.pFilter) && (!st.pChan || p.ch === st.pChan) && match(p.title, chan(p.ch)?.name, p.notes));
        const opts = [['', T(`Toutes (${posts().length})`, `All (${posts().length})`)], ...STS()], fb = seg(opts, st.pFilter || '', k => { st.pFilter = k || null; v.list(); }, 'hsm hd-fseg'), fs = sel(opts, st.pFilter || '', k => { st.pFilter = k || null; v.list(); }, 'hd-fsel'); fs.setAttribute('aria-label', T('Statut', 'Status'));
        const chb = h('button', { class: 'hd-ib' + (st.pChan ? ' on' : ''), title: T('Canal', 'Channel'), 'aria-label': T('Canal', 'Channel'), onclick: e => showPop([[T('Tous les canaux', 'All channels'), () => { st.pChan = null; v.list(); }, { on: !st.pChan }], '-', ...D.chans.map(c => [c.name, () => { st.pChan = c.id; v.list(); }, { on: st.pChan === c.id }])], e.currentTarget) }, ic('chud', 13));
        return [dv('hd-lf', fb, fs, sp('fl'), chb), rows.length ? null : dv('hd-pad', meta(T('Aucune publication.', 'No post.'))),
          rows.map(p => row({ on: p.id === st.selPost, dim: p.status === 'published' && p.id !== st.selPost, ic: CHI[chan(p.ch)?.kind] || 'mega', title: p.title, meta: fdm(p.t), mc: lateP(p) ? 'dg' : '', trail: stBadge(p.status), fn: () => { st.selPost = p.id; v.list(); v.detail(); } }))]; },
      detail: () => { if (st.selPost && post(st.selPost)) { const host = dv('hd-fill'); mountInspector(host, st.selPost); return host; } return empty(T('Choisissez une publication.', 'Choose a post.')); } });
    return v;
  };
  function mountInspector(host, id) {
    const p = post(id); if (!p) { fill(host, empty(T('Choisissez une publication.', 'Choose a post.'))); return; }
    const body = dv('hd-ibody'), cnt = sp('hd-meta');
    const upd = () => { cnt.textContent = T(`${(p.drafts[st.lang] || '').length} caractères`, `${(p.drafts[st.lang] || '').length} characters`); };
    const rebuild = () => mountInspector(host, id);
    const changed = () => { refreshLite(); };
    const statusMenu = e => showPop(STS().map(([k, l]) => [l, () => { p.status = k; st.pubFlash = null; sfx.tick(); changed(); rebuild(); }, { on: p.status === k }]), e.currentTarget, { min: 150 });
    const header = dv('hd-ihead', h('input', { class: 'hd-in hd-tt', value: p.title, 'aria-label': T('Titre', 'Title'), oninput: e => { p.title = e.target.value; refreshLite(); } }),
      dv('hd-r2', h('input', { class: 'hd-in dt', type: 'date', value: iso(p.t), 'aria-label': 'Date', onchange: e => { p.t = fromIso(e.target.value) || p.t; changed(); } }), sel([['', '—'], ...D.chans.map(c => [c.id, c.name])], p.ch || '', v => { p.ch = v || null; changed(); }, 'ch'), h('button', { class: 'hd-stb', title: T('« Publié » se coche à la main, une fois que vous avez publié vous-même.', '“Published” is set by hand, once you have posted it yourself.'), onclick: statusMenu }, stBadge(p.status), ic('chd', 10, 'sub'))));
    const tabs = seg([['text', T('Texte', 'Text')], ['numbers', T('Chiffres', 'Numbers')], ['feedback', T('Retours', 'Feedback')], ['notes', 'Notes']], st.itab, k => { st.itab = k; drawTab(); });
    const drawTab = () => {
      if (st.itab === 'text') { const ta = area(p.drafts[st.lang] || '', v => { p.drafts[st.lang] = v; upd(); }, { class: 'hd-in ta big', 'aria-label': T('Texte', 'Text') }); ta.className = 'hd-in ta big'; const cn = chan(p.ch)?.notes;
        fill(body, dv('hd-r2 one', seg(LANGS, st.lang, k => { st.lang = k; ta.value = p.drafts[k] || ''; upd(); }), sp('fl'), cnt), cn ? dv('hd-note', cn) : null, ta); upd(); }
      else if (st.itab === 'numbers') { const s = p.stat; fill(body, s ? [dv('hd-tiles3', [[T('Vues', 'Views'), s.v], [T('Interactions', 'Interactions'), s.l == null && s.c == null && s.s == null ? null : (s.l || 0) + (s.c || 0) + (s.s || 0)], [T('Téléchargements', 'Downloads'), s.d]].map(([l, x]) => dv('hd-tile', dv('hd-meta', l), dv('hd-val hsm', nf(x))))), meta(T('Relevé le ', 'Checked ') + fstamp(s.t))] : meta(T('Aucun relevé pour cette publication.', 'No statistics for this post yet.')), btn(T('Saisir des chiffres', 'Enter numbers'), '', () => manualSheet(p, () => { drawTab(); refreshLite(); }), { style: { alignSelf: 'flex-start' } })); }
      else if (st.itab === 'feedback') { const it = p.fb.slice().sort((a, b) => b.t - a.t); fill(body, dv('hd-r2 one', meta(it.length ? String(it.length) : T('Aucun retour noté', 'No feedback recorded')), sp('fl'), btn(T('Ouvrir dans Retours', 'Open in Feedback'), '', () => { st.selFb = id; go('feedback'); openFb(id); })), dv('hd-fbl hd-scroll', it.map(f => dv('hd-fbr', sp('hd-meta d', fday(f.t)), h('b', {}, f.author ? 'u/' + f.author : `${FBK().find(x => x[0] === f.kind)[1]} ${nf(f.value)}`), sp('tx', f.text))))); }
      else fill(body, dv('hd-notes', lbl(T('Jalon', 'Milestone'), sel([['', '—'], ...C().ms.map(m => [m.id, `${fday(m.t)} · ${m.title}`])], p.ms || '', v => (p.ms = v || null))), dv('hd-fld grow', dv('hd-lbl', 'Notes'), area(p.notes, v => (p.notes = v))),
        dv('hd-r2 one', st.agentOn ? btn(T('Discuter avec l’agent', 'Chat with the agent'), '', () => { st.scopeTask = true; st.agentOpen = true; applyAgent(); }) : null, sp('fl'), btn(T('Supprimer la publication', 'Delete post'), 'ter', () => confirmBox(T('Supprimer la publication', 'Delete post'), T(`Supprimer « ${p.title} » ?`, `Delete “${p.title}”?`), T('Supprimer la publication', 'Delete post'), () => { C().posts = posts().filter(x => x.id !== id); st.selPost = null; go(st.tab, true); }, true)))));
    };
    const hint = dv('hd-meta hd-hint'), showHint = () => { hint.textContent = st.pubFlash === id ? T('Bien joué : hERALD n’a rien publié, c’est vous qui l’avez fait.', 'Well done: hERALD published nothing, you did.') : p.status === 'published' ? (p.link.trim() ? '' : T('Ajoutez le lien de la publication pour la suivre.', 'Add the post’s link to track it.')) : T('Copiez le texte puis publiez-le vous-même sur le canal.', 'Copy the text, then post it yourself on the channel.'); };
    showHint();
    const mark = btn(p.status === 'published' ? T('Publié ✓', 'Published ✓') : T('Marquer publié', 'Mark published'), 'pri hlg', () => { p.status = 'published'; st.pubFlash = id; sfx.done(); changed(); rebuild(); const b = host.querySelector('.hd-stb .hd-badge'); b && !reduced() && b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }, { disabled: p.status === 'published' });
    const foot = dv('hd-ifoot', inp(p.link, v => { p.link = v; st.pubFlash = null; showHint(); }, { placeholder: T('Lien après publication', 'Link after publishing'), 'aria-label': T('Lien après publication', 'Link after publishing') }), dv('hd-r2 one', copyBtn(T('COPIER', 'COPY'), () => p.drafts[st.lang] || ''), sp('fl'), mark));
    fill(host, dv('hd-insp', header, tabs, body, hint, foot)); drawTab();
  }
  function manualSheet(p, done) {
    const s = p.stat || { v: null, l: null, c: null, s: null, d: null }, e = { ...s }, f = (k, l) => lbl(l, h('input', { class: 'hd-in', type: 'number', min: '0', value: e[k] ?? '', oninput: ev => (e[k] = ev.target.value === '' ? null : Math.max(0, +ev.target.value)) }));
    const close = sheet(T('Saisir des chiffres', 'Enter numbers'), dv('hd-form', h('p', { class: 'hd-p mut' }, T('Pour Instagram, Facebook, Discord ou X : recopiez les compteurs affichés sous la publication. Laissez vide ce que vous ne connaissez pas.', 'For Instagram, Facebook, Discord or X: copy the counters shown under the post. Leave blank what you don’t know.')), dv('hd-two5', f('v', T('Vues', 'Views')), f('l', T('J’aime', 'Likes')), f('c', T('Comm.', 'Comm.')), f('s', T('Partages', 'Shares')), f('d', T('Téléch.', 'Downl.')))),
      [btn(T('ANNULER', 'CANCEL'), '', () => close()), btn(T('ENREGISTRER', 'SAVE'), 'pri', () => { p.stat = { ...e, p1: p.stat?.p1 || { v: 0, l: 0, c: 0, s: 0, d: 0 }, p7: p.stat?.p7 || { v: 0, l: 0, c: 0, s: 0, d: 0 }, auto: false, t: Date.now() }; close(); done?.(); })], 560);
  }

  /* ---------- Contacts ---------- */
  function newContact() { const k = { id: D.id('k'), name: T('Nouveau contact', 'New contact'), kind: 'youtuber', url: '', email: '', lang: T('fr', 'en'), status: 'toContact', next: null, coverage: '', notes: '', messages: [] }; C().contacts.push(k); st.selContact = k.id; sfx.pop(); if (st.tab !== 'contacts') go('contacts'); else refreshAll(); }
  V.contacts = () => {
    let note = null;
    const v = split({
      list: () => { const rows = contacts().filter(k => (st.cFilter === 'all' || (st.cFilter === 'youtubers' ? k.kind === 'youtuber' : st.cFilter === 'press' ? k.kind === 'press' : k.kind !== 'youtuber' && k.kind !== 'press')) && match(k.name, k.email, k.url, k.notes));
        const can = contacts().some(k => k.email);
        return [dv('hd-lf', seg([['all', T('Tous', 'All')], ['youtubers', T('Youtubeurs', 'YouTubers')], ['press', T('Presse', 'Press')], ['others', T('Autres', 'Others')]], st.cFilter, k => { st.cFilter = k; v.list(); }, 'hsm'), sp('fl'), btn(T('Relever les réponses', 'Check replies'), '', scan, { disabled: !can || st.mail !== 'mail', title: st.mail === 'mail' ? '' : T('La lecture des réponses demande l’app Mail (Réglages).', 'Reading replies needs the Mail app (Settings).') })),
          note ? dv('hd-lnote ' + note[1], note[0]) : null, rows.length ? null : dv('hd-pad', meta(T('Aucun contact.', 'No contact.'))),
          rows.map(k => { const due = dueC(k); return row({ on: k.id === st.selContact, ic: CTI[k.kind], tint: due ? 'wn' : '', title: k.name, meta: WAITING(k.status) && k.next != null ? T('relance le ', 'follow-up on ') + fshort(k.next) : '', mc: due ? 'wn' : '', trail: badge(stLabelC(k.status), CSK[k.status]), fn: () => { st.selContact = k.id; v.list(); v.detail(); } }); })]; },
      detail: () => (st.selContact && contact(st.selContact) ? contactDetail(st.selContact) : empty(T('Choisissez un contact.', 'Choose a contact.'))) });
    async function scan() {
      const lst = v.el.querySelector('.hd-lf .hd-b'); lst && (lst.disabled = true, lst.prepend(spin())); await wait(reduced() ? 0 : 900); if (!alive()) return;
      const k = contacts().find(x => WAITING(x.status) && x.email && x.id === contacts()[0].id);
      if (k) { k.messages.push({ id: D.id('m'), t: Date.now() - 6e4, kind: 'reply', dir: 'received', subject: 'Re: ' + (k.messages.find(m => m.dir === 'sent')?.subject || 'Proposal'), body: T('Hello ! Merci pour le message. Je regarde votre mod ce week-end et je vous dis ça rapidement.\n\nNora', 'Hi! Thanks for the message. I\'ll look at your mod this weekend and get back to you soon.\n\nNora'), to: k.email, mail: true }); k.status = 'replied'; k.next = null; note = [T('1 nouvelle réponse lue dans Mail', '1 new reply read from Mail'), 'ok']; sfx.notif(); }
      else note = [T('Aucune nouvelle réponse dans Mail.', 'No new reply in Mail.'), ''];
      drawSide(); drawStatus(); v.list(); if (k && st.selContact === k.id) v.detail();
    }
    return v;
  };
  const MAILT = (kind, k) => {
    const c = C(), code = k.lang, dt = new Date(c.event).toLocaleDateString(code === 'fr' ? 'fr-FR' : code === 'es' ? 'es-ES' : code === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }), me = 'Aelwyn', nm = k.name, cn = c.name;
    const first = { fr: [`Proposition : ${cn}`, `Bonjour ${nm},\n\nJe suis ${me}. Je prépare « ${cn} » (${dt}) et je pense que cela pourrait intéresser votre audience.\n\n${c.notes}\n\nC'est gratuit et je ne demande rien en échange ; je reste disponible pour toute question.\n\nMerci pour votre temps,\n${me}`], en: [`Proposal: ${cn}`, `Hi ${nm},\n\nI'm ${me}. I'm preparing “${cn}” (${dt}) and I think your audience might like it.\n\n${c.notes}\n\nIt's free and I'm not asking anything in return; I'm happy to answer any question.\n\nThanks for your time,\n${me}`],
      es: [`Propuesta: ${cn}`, `Hola ${nm}:\n\nSoy ${me}. Preparo «${cn}» (${dt}) y creo que podría interesar a tu audiencia.\n\n${c.notes}\n\nEs gratis y no pido nada a cambio; quedo a tu disposición para cualquier pregunta.\n\nGracias por tu tiempo,\n${me}`], it: [`Proposta: ${cn}`, `Ciao ${nm},\n\nSono ${me}. Sto preparando «${cn}» (${dt}) e penso che possa interessare al tuo pubblico.\n\n${c.notes}\n\nÈ gratuito e non chiedo nulla in cambio; resto a disposizione per qualsiasi domanda.\n\nGrazie per il tempo,\n${me}`] };
    const fol = { fr: [`Relance : ${cn}`, `Bonjour ${nm},\n\nJe me permets une courte relance à propos de « ${cn} » (${dt}). Si le sujet vous intéresse, je suis disponible pour répondre à vos questions ; sinon, aucun souci.\n\nMerci,\n${me}`], en: [`Following up: ${cn}`, `Hi ${nm},\n\nJust a quick follow-up about “${cn}” (${dt}). If it's of interest, I'm happy to answer any questions; if not, no worries at all.\n\nThanks,\n${me}`],
      es: [`Seguimiento: ${cn}`, `Hola ${nm}:\n\nUn breve seguimiento sobre «${cn}» (${dt}). Si te interesa, estoy disponible para responder a tus preguntas; si no, no hay problema.\n\nGracias,\n${me}`], it: [`Sollecito: ${cn}`, `Ciao ${nm},\n\nUn breve sollecito riguardo a «${cn}» (${dt}). Se ti interessa, sono a disposizione per qualsiasi domanda; altrimenti nessun problema.\n\nGrazie,\n${me}`] };
    const [subject, body] = (kind === 'followUp' ? fol : first)[code] || (kind === 'followUp' ? fol : first).en; return { subject, body };
  };
  function contactDetail(id, ed0) {
    const k = contact(id), host = dv('hd-cdet hd-scroll');
    const E = ed0 || (() => { const d = k.messages.filter(m => m.dir === 'draft').sort((a, b) => b.t - a.t)[0]; if (d) return { to: d.to || k.email, subject: d.subject, body: d.body, kind: d.kind, draft: d.id }; const t = MAILT(WAITING(k.status) ? 'followUp' : 'first', k); return { to: k.email, subject: t.subject, body: t.body, kind: WAITING(k.status) ? 'followUp' : 'first', draft: null }; })();
    let expanded = null, note = st.flash && st.flash.id === id ? st.flash.note : null; st.flash = null; const chg = () => { drawSide(); view?.refresh?.(); };
    const f = (label, ctl) => lbl(label, ctl);
    const head = dv('hd-ihead', h('input', { class: 'hd-in hd-tt', value: k.name, 'aria-label': T('Nom', 'Name'), oninput: e => { k.name = e.target.value; chg(); } }), dv('hd-r2 one', sel(CTK(), k.kind, v => { k.kind = v; chg(); }), sel(CSS_(), k.status, v => { k.status = v; chg(); }), sp('fl')));
    const fiche = dv('hd-form', dv('hd-r2 top', f('E-mail', inp(k.email, v => { k.email = v; E.to = E.to || v; })), f(T('Langue', 'Language'), seg(LANGS, k.lang, v => { k.lang = v; }))),
      f(T('Site ou chaîne', 'Site or channel'), dv('hd-r2 one', inp(k.url, v => { k.url = v; }, { placeholder: 'https://…' }), btn(T('Ouvrir', 'Open'), '', () => openUrl(k.url)))),
      dv('hd-r2 top', f(T('Prochaine relance', 'Next follow-up'), (() => { const dtI = h('input', { class: 'hd-in dt', type: 'date', value: k.next != null ? iso(k.next) : '', disabled: k.next == null, onchange: e => { k.next = fromIso(e.target.value); chg(); } }); return dv('hd-r2 one', h('label', { class: 'hd-sw' }, h('input', { type: 'checkbox', checked: k.next != null, onchange: e => { k.next = e.target.checked ? day(8) : null; dtI.disabled = !e.target.checked; dtI.value = k.next != null ? iso(k.next) : ''; chg(); } }), h('i', {})), dtI); })()),
        f(T('Lien obtenu (article, vidéo)', 'Coverage link'), dv('hd-r2 one', inp(k.coverage, v => { k.coverage = v; }, { placeholder: 'https://…' }), h('button', { class: 'hd-b sq', 'aria-label': T('Ouvrir', 'Open'), onclick: () => openUrl(k.coverage) }, ic('ext', 14))))),
      f('Notes', area(k.notes, v => { k.notes = v; }, { style: { height: '64px' } })), dv('hd-r2 one', sp('fl'), btn(T('Supprimer le contact', 'Delete contact'), 'ter', () => confirmBox(T('Supprimer le contact', 'Delete contact'), T(`Supprimer le contact « ${k.name} » ?`, `Delete the contact “${k.name}”?`), T('Supprimer le contact', 'Delete contact'), () => { C().contacts = contacts().filter(x => x.id !== id); st.selContact = null; go(st.tab, true); }, true))));
    const thread = dv('hd-thr'), drawThread = () => { const ms = k.messages.slice().sort((a, b) => b.t - a.t);
      fill(thread, eyebrow(T('Fil des messages', 'Messages')), ms.length ? null : meta(T('Aucun message pour l’instant.', 'No message yet.')), ms.map(m => [h('button', { class: 'hd-mr', 'aria-expanded': String(expanded === m.id), onclick: () => { expanded = expanded === m.id ? null : m.id; drawThread(); } }, sp('hd-meta d', fday(m.t)), badge({ draft: T('Brouillon', 'Draft'), sent: T('Envoyé', 'Sent'), received: T('Reçu', 'Received') }[m.dir], m.dir === 'sent' ? 'ok' : m.dir === 'received' ? 'wn' : ''), sp('nm', m.subject || { first: T('Premier contact', 'First contact'), followUp: T('Relance', 'Follow-up'), reply: T('Réponse', 'Reply'), note: 'Note' }[m.kind]), ic(expanded === m.id ? 'chd' : 'chd', 10, 'sub' + (expanded === m.id ? ' up' : ''))),
        expanded === m.id ? dv('hd-mb', dv('tx', m.body), m.mail ? dv('hd-r2 end', btn(T('Mettre à la corbeille de Mail', 'Move to the Mail trash'), 'ter', () => { m.mail = false; sfx.click(); drawThread(); })) : null) : null]));
    };
    const toI = inp(E.to, v => (E.to = v)), subI = inp(E.subject, v => (E.subject = v)), bodyA = area(E.body, v => (E.body = v), { style: { height: '176px' } });
    const noteEl = dv(''), sendB = btn(T('Envoyer', 'Send'), 'pri hlg', () => confirmBox(T(`Envoyer à ${E.to} ?`, `Send to ${E.to}?`), T('Le message part par votre app Mail. (Démo : rien ne part vraiment.)', 'The message is sent through your Mail app. (Demo: nothing really leaves.)'), T('Envoyer', 'Send'), send));
    const saveB = btn(T('Enregistrer le brouillon', 'Save draft'), 'hlg', saveDraft);
    const refreshBtns = () => { sendB.disabled = !(E.to.trim() && E.subject && E.body); saveB.disabled = !(E.subject || E.body); };
    [toI, subI, bodyA].forEach(x => x.addEventListener('input', refreshBtns));
    const drawNote = () => fill(noteEl, note ? callout('in', note) : null);
    const editor = dv('hd-form', dv('hd-r2 one', eyebrow(T('Nouveau message', 'New message')), sp('fl'), btn(T('Modèle', 'Template'), 'ter', e => showPop([[T('Premier contact', 'First contact'), () => tpl('first')], [T('Relance', 'Follow-up'), () => tpl('followUp')]], e.currentTarget, { min: 160 }), { 'aria-haspopup': 'menu' })), f(T('À', 'To'), toI), f(T('Objet', 'Subject'), subI), bodyA, noteEl,
      dv('hd-r2 one end', saveB, sendB), dv('hd-meta', T('L’envoi passe par l’app Mail, uniquement sur votre clic.', 'Sent through the Mail app, only when you click.')));
    function tpl(kd) { const t = MAILT(kd, k); E.kind = kd; E.subject = t.subject; E.body = t.body; subI.value = t.subject; bodyA.value = t.body; refreshBtns(); }
    function saveDraft() { const m = { id: E.draft || D.id('m'), t: Date.now(), kind: E.kind, dir: 'draft', subject: E.subject, body: E.body, to: E.to, mail: false }; const i = k.messages.findIndex(x => x.id === m.id); i >= 0 ? (k.messages[i] = m) : k.messages.push(m); E.draft = m.id; note = T('Brouillon enregistré.', 'Draft saved.'); drawNote(); drawThread(); sfx.click(); }
    function send() {
      k.messages = k.messages.filter(m => m.id !== E.draft); k.messages.push({ id: D.id('m'), t: Date.now(), kind: E.kind, dir: 'sent', subject: E.subject, body: E.body, to: E.to, mail: false });
      if (!k.email) k.email = E.to; k.status = E.kind === 'first' ? 'contacted' : 'followedUp'; k.next = day(8); sfx.pop();
      st.flash = { id, note: T('Envoyé (démo : aucun e-mail ne part vraiment). Relance programmée dans 8 jours.', 'Sent (demo: no email really leaves). Follow-up set in 8 days.') };
      demo(T(`Message envoyé à ${E.to} (démo : rien ne part vraiment).`, `Message sent to ${E.to} (demo: nothing really leaves).`));
      refreshAll(); const dp = view?.el?.querySelector('.hd-detp'); if (dp && !reduced()) { const pl = ic('plane', 26, 'fly'); dp.append(pl); later(() => pl.remove(), 1300); }
    }
    fill(host, head, fiche, thread, editor); drawThread(); drawNote(); refreshBtns(); return host;
  }

  /* ---------- Statistiques ---------- */
  V.stats = () => {
    const el = dv('hd-panel hd-statw hd-scroll'), pend = {}; let busy = false;
    const draw = (anim) => {
      const s = summary(st.period), c = C(), miss = posts().filter(p => p.status === 'published' && !p.link.trim()), wait_ = posts().filter(p => p.link && !p.stat), kk = (l, v, sub) => { const val = sp('hd-val'); anim ? countUp(val, v) : (val.textContent = nf(v)); return dv('hd-kpi', dv('hd-eyebrow', l), val, dv('hd-meta', sub)); };
      const tbl = dv('hd-stab', dv('hd-str hd', sp('', T('Publication', 'Post')), ...[T('Vues', 'Views'), T('J’aime', 'Likes'), T('Comm.', 'Comm.'), T('Partages', 'Shares'), T('Téléch.', 'Downl.'), '24 h'].map(x => sp('n', x)), sp('src', T('Relevé', 'Reading'))), s.rows.length ? null : dv('hd-str', empty(T('Aucun relevé : ajoutez le lien de vos publications, puis Actualiser.', 'No statistics: add your posts’ links, then Refresh.'))),
        s.rows.map(r => { const [nm, col, icn] = PLAT[r.plat]; return h('div', { class: 'hd-str', title: r.p.link, ondblclick: () => openUrl(r.p.link) }, dv('pc', ic(icn, 14, ''), dv('', h('b', {}, r.p.title), h('small', {}, `${nm} · ${fday(r.p.t)}`))), ...[r.d.v, r.d.l, r.d.c, r.d.s, r.d.d].map(x => sp('n', nf(x))), sp('n ' + (r.g > 0 ? 'ok' : ''), r.g > 0 ? '+' + nf(r.g) : '—'), dv('src', badge(r.s.auto ? 'auto' : T('saisi', 'entered'), r.s.auto ? 'ok' : 'wn'), h('small', {}, fstamp(r.s.t).split(',')[0]))); }),
        wait_.map(p => dv('hd-str hwt', dv('pc', ic(PLAT[platOfPost(p)][2], 14), h('b', {}, p.title)), sp('hd-meta wtm', PLAT[platOfPost(p)][3] ? T('en attente du premier relevé', 'waiting for the first reading') : T('à saisir à la main', 'to enter by hand')), PLAT[platOfPost(p)][3] ? null : btn(T('Saisir des chiffres', 'Enter numbers'), 'hsm', () => manualSheet(p, () => draw())))));
      fill(el, dv('hd-pad wide', dv('hd-r2', seg([['campaign', T('Toute la campagne', 'Whole campaign')], ['day', '24 h'], ['week', T('7 jours', '7 days')]], st.period, k => { st.period = k; draw(true); }), sp('fl'), busy ? spin() : null,
        btn(T('Saisir des chiffres', 'Enter numbers'), '', () => { const p = posts().find(x => !PLAT[platOfPost(x)][3]) || posts()[0]; p && manualSheet(p, () => draw()); }), copyBtn(T('COPIER LE RAPPORT', 'COPY REPORT'), () => report(s)), btn(T('ACTUALISER', 'REFRESH'), 'pri', refresh, { disabled: busy })),
        miss.length ? dv('hd-miss', dv('hd-eyebrow wn', T('Publiées sans lien', 'Published without a link')), meta(T('Collez le lien de chaque publication pour que hERALD relève ses chiffres.', 'Paste each post’s link so hERALD can read its numbers.')), miss.map(p => dv('hd-r2 one', ic(PLAT[platOfPost(p)][2], 14), sp('mt', `${fday(p.t)} · ${p.title}`), inp(pend[p.id] || '', v => (pend[p.id] = v), { placeholder: 'https://…' }), btn(T('Ajouter', 'Add'), '', () => { p.link = (pend[p.id] || '').trim(); if (p.link) { sfx.pop(); refreshAll(); draw(); refresh(); } })))) : null,
        dv('hd-kpis', kk(T('Vues', 'Views'), s.views, T('toutes plateformes', 'all platforms')), kk(T('Interactions', 'Interactions'), s.inter, T('j’aime, commentaires, partages', 'likes, comments, shares')), kk(T('Téléchargements', 'Downloads'), s.dl, T('GitHub et Nexus', 'GitHub and Nexus')), kk(T('Visites du site', 'Site visits'), s.site, SITE)),
        s.best && s.best.g > 0 ? dv('hd-fire', ic('flame', 15), T(`En forme : « ${s.best.p.title} » (+${nf(s.best.g)} en 24 h)`, `On fire: “${s.best.p.title}” (+${nf(s.best.g)} in 24 h)`)) : null,
        chartBox(), dv('hd-plats', s.plats.map(t => { const [nm, col, icn] = PLAT[t.k]; return dv('hd-plat', h('b', { style: { color: col } }, ic(icn, 14), nm), meta([t.v > 0 ? `${nf(t.v)} ${T('vues', 'views')}` : null, t.i > 0 ? `${nf(t.i)} ${T('interactions', 'interactions')}` : null, t.dl > 0 ? `${nf(t.dl)} ${T('téléch.', 'downl.')}` : null].filter(Boolean).join(' · ') || '—')); })),
        tbl, meta(T('Lecture seule : hERALD lit des compteurs publics (YouTube, Reddit, Bluesky, GitHub, Nexus, GoatCounter) et ne publie jamais rien. Double-clic sur une ligne : ouvrir la publication.', 'Read only: hERALD reads public counters (YouTube, Reddit, Bluesky, GitHub, Nexus, GoatCounter) and never publishes anything. Double-click a row to open the post.'))));
    };
    const report = s => `# ${T('Statistiques', 'Statistics')} · ${C().name}\n\n${T('Relevé du', 'Checked')} ${fstamp(st.statsChecked)}\n\n| ${T('Publication', 'Post')} | ${T('Vues', 'Views')} | ${T('J’aime', 'Likes')} | ${T('Comm.', 'Comm.')} |\n|---|---:|---:|---:|\n${s.rows.map(r => `| ${r.p.title} | ${nf(r.d.v)} | ${nf(r.d.l)} | ${nf(r.d.c)} |`).join('\n')}\n`;
    const chartBox = () => { const rows = summary('campaign').rows.filter(r => r.s.v != null), days = 13, t0 = sod(day(-days)), W = 640, Hh = 160, pl = 44, pb = 24, pt = 20, xs = i => pl + (W - pl - 12) * (i / days); const plats = [...new Set(rows.map(r => r.plat))];
      const ser = k => Array.from({ length: days + 1 }, (_, i) => rows.filter(r => r.plat === k).reduce((a, r) => { const x = (sod(day(-days + i)) - sod(r.p.t)) / (sod(Date.now()) - sod(r.p.t) || 1); return a + (x < 0 ? 0 : r.s.v * (1 - Math.pow(1 - clamp(x, 0, 1), 2.4))); }, 0));
      const S_ = plats.map(k => [k, ser(k)]), mx = Math.max(1, ...S_.flatMap(x => x[1])), nice = Math.ceil(mx / 1000) * 1000, ys = v => Hh - pb - (Hh - pb - pt) * (v / nice);
      const g = [0, .25, .5, .75, 1].map(f => `<line class="g" x1="${pl}" x2="${W - 12}" y1="${ys(nice * f)}" y2="${ys(nice * f)}"/><text class="t" x="${pl - 6}" y="${ys(nice * f) + 3}" text-anchor="end">${nf(Math.round(nice * f))}</text>`).join('');
      const xl = Array.from({ length: days + 1 }, (_, i) => i % 2 === 0 ? `<text class="t" x="${xs(i)}" y="${Hh - 6}" text-anchor="middle">${fshort(day(-days + i))}</text>` : '').join('');
      const mk = C().ms.filter(m => m.t >= t0 && sod(m.t) <= sod(Date.now())).map(m => { const i = Math.round((sod(m.t) - t0) / 864e5); return `<line class="m" x1="${xs(i)}" x2="${xs(i)}" y1="${pt - 6}" y2="${Hh - pb}"/><text class="mt" x="${i > days - 3 ? xs(i) - 3 : xs(i) + 3}" y="${pt - 8}" text-anchor="${i > days - 3 ? 'end' : 'start'}">${m.title.replace(/&/g, '&amp;')}</text>`; }).join('');
      const ls = S_.map(([k, a]) => `<path class="ln" pathLength="1" d="${a.map((v, i) => (i ? 'L' : 'M') + xs(i).toFixed(1) + ' ' + ys(v).toFixed(1)).join(' ')}" stroke="${PLAT[k][1]}"/>` + a.map((v, i) => i % 2 === 0 || i === days ? `<circle cx="${xs(i).toFixed(1)}" cy="${ys(v).toFixed(1)}" r="2.2" fill="${PLAT[k][1]}"/>` : '').join('')).join('');
      return dv('hd-chart', eyebrow(T('Vues cumulées par plateforme', 'Cumulative views by platform')), dv('hd-svg', h('span', { html: `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${T('Vues cumulées par plateforme', 'Cumulative views by platform')}">${g}${xl}${mk}${ls}</svg>` })), dv('hd-leg', plats.map(k => sp('', h('i', { style: { background: PLAT[k][1] } }), PLAT[k][0]))));
    };
    async function refresh() {
      if (busy) return; busy = true; st.busy = true; drawStatus(); draw(); await wait(reduced() ? 0 : 1300); if (!alive()) return;
      posts().forEach(p => { if (p.link && !p.stat && PLAT[platOfPost(p)][3]) { const k = platOfPost(p); p.stat = { v: k === 'reddit' ? null : 420, l: 212, c: 31, s: k === 'bluesky' ? 14 : 0, d: k === 'nexus' || k === 'github' ? 96 : null, p1: { v: 0, l: 0, c: 0, s: 0, d: 0 }, p7: { v: 0, l: 0, c: 0, s: 0, d: 0 }, auto: true, t: Date.now() }; }
        else if (p.stat && p.stat.auto) { const gv = k => (p.stat[k] == null ? null : p.stat[k] + Math.round(p.stat[k] * (.01 + Math.random() * .03)) + 1); ['v', 'l', 'c', 's', 'd'].forEach(k => { p.stat[k] = gv(k); }); p.stat.t = Date.now(); } });
      st.statsChecked = Date.now(); busy = false; st.busy = false; sfx.done(); drawStatus(); refreshLite(); draw(true);
    }
    draw(true); return { el, refresh: () => draw() };
  };

  /* ---------- Retours ---------- */
  const openFb = id => { st.selFb = id; const p = post(id); if (p) { st.fresh = new Set(p.fb.filter(f => f.unread).map(f => f.id)); p.fb.forEach(f => { f.unread = false; }); } drawSide(); };
  V.feedback = () => {
    const F = { kind: 'comment', value: 1, date: iso(Date.now()), text: '' }; let msg = '';
    const v = split({
      list: () => posts().filter(p => match(p.title, chan(p.ch)?.name, p.notes)).sort((a, b) => ((a.status === 'published' ? 0 : 1) - (b.status === 'published' ? 0 : 1)) || a.t - b.t).map(p => { const u = unread(p); return row({ on: p.id === st.selFb, ic: u ? 'bubble' : 'bubble', tint: u ? 'br' : '', title: p.title, meta: p.fb.length ? `${T('Commentaires', 'Comments')} ${nf(total(p, 'comment'))}` : T('Aucun retour noté', 'No feedback recorded'), trail: u ? badge(nr(u), 'ac') : stBadge(p.status), fn: () => { openFb(p.id); v.list(); v.detail(); } }); }),
      detail: () => { const p = post(st.selFb); if (!p) return empty(T('Choisissez une publication pour noter ses retours.', 'Choose a post to record its feedback.')); const fresh = st.fresh || new Set();
        const lst = dv('hd-fbl hd-scroll'), drawL = () => fill(lst, p.fb.length ? p.fb.slice().sort((a, b) => b.t - a.t).map(f => dv('hd-fb', sp('hd-meta d', fday(f.t)), badge(FBK().find(x => x[0] === f.kind)[1], f.kind === 'comment' ? 'ac' : ''), f.author ? dv('who', dv('', h('b', {}, 'u/' + f.author), fresh.has(f.id) ? badge(T('Nouveau', 'New'), 'ok') : null), dv('tx', f.text)) : [h('b', { class: 'v' }, nf(f.value)), sp('tx', f.text)], sp('fl'), f.url ? h('button', { class: 'hd-ib', title: T('Ouvrir la réponse sur Reddit', 'Open the reply on Reddit'), 'aria-label': T('Ouvrir la réponse sur Reddit', 'Open the reply on Reddit'), onclick: () => openUrl(f.url) }, ic('ext', 14)) : null, h('button', { class: 'hd-ib', 'aria-label': T('Supprimer', 'Delete'), onclick: () => { p.fb = p.fb.filter(x => x !== f); sfx.click(); drawL(); v.list(); } }, ic('trash', 14)))) : empty(T('Aucun retour noté', 'No feedback recorded')));
        const note = dv('hd-meta ok'); note.textContent = msg; drawL();
        return dv('hd-pad full', dv('hd-r2 one', h('h2', { class: 'hd-bh' }, p.title), sp('fl'), p.link ? btn(T('Ouvrir', 'Open'), '', () => openUrl(p.link)) : null),
          dv('hd-tiles', FBK().filter(k => k[0] !== 'other').map(([k, l]) => dv('hd-tile hrow', sp('hd-meta', l), h('b', {}, nf(total(p, k)))))),
          dv('hd-add', lbl(T('Type', 'Type'), sel(FBK(), F.kind, x => (F.kind = x))), lbl(T('Valeur', 'Value'), h('input', { class: 'hd-in', type: 'number', min: '0', value: F.value, oninput: e => (F.value = +e.target.value || 0) })), lbl('Date', h('input', { class: 'hd-in dt', type: 'date', value: F.date, onchange: e => (F.date = e.target.value) }))),
          dv('hd-r2 one end', lbl(T('Commentaire ou note', 'Comment or note'), inp('', x => (F.text = x), { 'aria-label': T('Commentaire ou note', 'Comment or note') })), btn(T('Ajouter', 'Add'), 'pri hlg', () => { p.fb.push({ id: D.id('f'), t: fromIso(F.date) || Date.now(), kind: F.kind, value: F.value, text: F.text.trim() }); F.text = ''; F.value = 1; sfx.pop(); v.detail(); v.list(); })),
          dv('hd-r2 one', note, sp('fl'), btn(T('Importer un CSV…', 'Import CSV…'), '', () => { p.fb.push({ id: D.id('f'), t: day(0), kind: 'stars', value: 4, text: T('Note moyenne importée', 'Imported average rating') }, { id: D.id('f'), t: day(-1), kind: 'endorsements', value: 12, text: '' }); msg = T('2 retours importés.', '2 feedback items imported.'); sfx.pop(); v.detail(); v.list(); })), h('hr', { class: 'hd-hr' }), lst); } });
    return v;
  };

  /* ---------- Veille ---------- */
  V.watch = () => {
    const F = { ref: '', name: '' }; let err = '', checking = false;
    const rel = () => D.watch.filter(x => x.hist.length && Date.now() - x.hist[x.hist.length - 1].pub < 7 * 864e5 && (x.hist.length < 2 || x.hist[x.hist.length - 1].v !== x.hist[x.hist.length - 2].v));
    let v;
    function add() { const t = F.ref.trim(); const gh = t.match(/github\.com\/([\w.-]+\/[\w.-]+)/i) || t.match(/^([\w.-]+\/[\w.-]+)$/), nx = t.match(/nexusmods\.com\/(\w+)\/mods\/(\d+)/i);
      if (!gh && !nx) { err = T('Adresse non reconnue : dépôt GitHub ou page de mod Nexus.', 'Address not recognised: GitHub repository or Nexus mod page.'); v.list(); return; }
      const ref = nx ? nx[1] + '/' + nx[2] : gh[1]; if (D.watch.some(x => x.ref === ref)) { err = T('Déjà dans la liste.', 'Already in the list.'); v.list(); return; }
      const nm = F.name.trim() || ref.split('/').pop(); D.watch.push({ id: D.id('w'), name: nm, kind: nx ? 'nexus' : 'github', ref, notes: '', checked: null, hist: [] }); F.ref = F.name = ''; err = ''; sfx.pop(); drawStatus(); v.list(); }
    async function check() { checking = true; v.list(); st.busy = true; drawStatus(); await wait(reduced() ? 0 : 1200); if (!alive()) return; checking = false; st.busy = false; let found = false;
      D.watch.forEach(x => { x.checked = Date.now(); if (!x.hist.length) x.hist.push({ t: Date.now(), v: x.kind === 'github' ? 'v0.9.2' : '1.0', pub: Date.now() - 12 * 864e5 }); else if (!st.watchChecked && x.kind === 'github' && x.name === 'SkyBloom Shaders') { x.hist.push({ t: Date.now(), v: 'v1.4.0', pub: Date.now() - 864e5 }); found = true; } });
      st.watchChecked = true; sfx[found ? 'notif' : 'done'](); drawStatus(); v.list(); v.detail(); if (found) demo(T('SkyBloom Shaders : nouvelle version v1.4.0 repérée.', 'SkyBloom Shaders: new version v1.4.0 spotted.')); }
    const watchDetail = x => { const last = x.hist[x.hist.length - 1]; return dv('hd-pad full', dv('hd-r2 one', dv('hd-col2', h('h2', { class: 'hd-bh' }, x.name), dv('hd-meta mono', `${x.kind === 'github' ? 'GitHub' : 'Nexus'} · ${x.ref}`)), sp('fl'), btn(T('Ouvrir', 'Open'), '', () => openUrl(x.kind === 'github' ? 'https://github.com/' + x.ref : 'https://www.nexusmods.com/' + x.ref.replace('/', '/mods/'))), btn(T('Supprimer', 'Delete'), 'ter', () => { D.watch = D.watch.filter(y => y !== x); st.selWatch = null; drawStatus(); v.list(); v.detail(); })),
      meta(x.checked ? T('Vérifié le ', 'Checked ') + fstamp(x.checked) : T('Pas encore vérifié', 'Not checked yet')), lbl('Notes', inp(x.notes, y => (x.notes = y))), eyebrow(T('Historique', 'History')),
      x.hist.length ? dv('hd-scroll', x.hist.slice().reverse().map(s => dv('hd-hrow', sp('hd-meta w150', fstamp(s.t)), sp('mono ac w90', s.v), sp('hd-meta', T('publiée le ', 'published ') + fday(s.pub)), s.dl ? sp('hd-meta', '⬇︎ ' + nf(s.dl)) : null, s.end ? sp('hd-meta', '👍 ' + nf(s.end)) : null))) : empty(T('Aucun relevé pour l’instant.', 'No reading yet.'))); };
    const report = () => { const r = rel(), pub = posts().filter(p => p.status === 'published' && p.t >= day(-6)), up = posts().filter(p => p.status !== 'published' && p.t >= sod(Date.now()) && p.t <= day(7)), fbs = posts().flatMap(p => p.fb.filter(f => f.t >= day(-6)).map(f => [p, f]));
      const sec = (t, ls) => dv('hd-rsec', dv('hd-eyebrow wn', t), ls.map(l => dv('hd-rli', sp('', '•'), sp('', l))));
      const secs = [[T('Nouvelles versions repérées', 'New versions spotted'), r.length ? r.map(x => `${x.name} — ${x.hist[x.hist.length - 1].v} (${fday(x.hist[x.hist.length - 1].pub)})`) : [T('Aucune nouvelle version cette semaine.', 'No new version this week.')]],
        [T('Dernières versions connues', 'Latest known versions'), D.watch.map(x => `${x.name} — ${x.hist.length ? x.hist[x.hist.length - 1].v : T('Pas encore vérifié', 'Not checked yet')}`)],
        [T('Nos publications', 'Our posts'), pub.length ? pub.map(p => `${fday(p.t)} · ${chan(p.ch)?.name || '—'} · ${p.title}`) : [T('Rien à signaler.', 'Nothing to report.')]],
        [T('Retours reçus', 'Feedback received'), fbs.length ? fbs.map(([p, f]) => `${p.title} · ${FBK().find(x => x[0] === f.kind)[1]} ${nf(f.value)}${f.text ? ' — ' + f.text : ''}`) : [T('Rien à signaler.', 'Nothing to report.')]],
        [T('À publier dans les 7 jours', 'To post within 7 days'), up.length ? up.map(p => `${fday(p.t)} · ${chan(p.ch)?.name || '—'} · ${p.title} (${stLabel(p.status)})`) : [T('Rien à signaler.', 'Nothing to report.')]]];
      const md = () => `# ${T('Rapport de la semaine', 'Weekly report')}\n\n` + secs.map(([t, l]) => `## ${t}\n${l.map(x => '- ' + x).join('\n')}`).join('\n\n');
      return dv('hd-pad full hd-scroll', dv('hd-r2 one', dv('hd-col2', h('h2', { class: 'hd-bh big' }, T('Rapport de la semaine', 'Weekly report')), meta(T(`Du ${fday(day(-6))} au ${fday(day(0))}`, `${fday(day(-6))} to ${fday(day(0))}`))), sp('fl'), copyBtn(T('Copier en Markdown', 'Copy as Markdown'), md)), secs.map(([t, l]) => sec(t, l)), meta(T('Rapport calculé à partir des relevés de la veille et de vos retours notés.', 'Report built from the monitoring readings and your recorded feedback.'))); };

    v = split({
      list: () => [row({ on: st.selWatch == null, ic: 'doc', title: T('Rapport de la semaine', 'Weekly report'), meta: `${fshort(day(-6))} – ${fshort(day(0))}`, fn: () => { st.selWatch = null; v.list(); v.detail(); } }),
        sectionBar(T('Produits surveillés', 'Watched products'), checking ? spin() : null, btn(T('VÉRIFIER', 'CHECK'), 'pri hsm', check, { disabled: checking || !D.watch.length })),
        dv('hd-wadd', inp(F.ref, x => (F.ref = x), { placeholder: T('URL GitHub ou Nexus (ou propriétaire/dépôt)', 'GitHub or Nexus URL (or owner/repo)'), 'aria-label': 'URL' }), dv('hd-r2 one', inp(F.name, x => (F.name = x), { placeholder: T('Nom (facultatif)', 'Name (optional)') }), btn(T('Ajouter', 'Add'), '', add)), err ? dv('hd-meta dg', err) : null),
        D.watch.filter(x => match(x.name, x.ref, x.notes)).map(x => row({ on: x.id === st.selWatch, ic: 'box', title: x.name, meta: x.hist.length ? x.hist[x.hist.length - 1].v : T('Pas encore vérifié', 'Not checked yet'), mc: 'ac', trail: badge(x.kind === 'github' ? 'GitHub' : 'Nexus'), fn: () => { st.selWatch = x.id; v.list(); v.detail(); } }))],
      detail: () => { const x = D.watch.find(y => y.id === st.selWatch); return x ? watchDetail(x) : report(); } });
    return v;
  };

  /* ---------- Canaux ---------- */
  V.channels = () => {
    const v = split({
      list: () => [sectionBar(T('Canaux', 'Channels'), btn(T('Ajouter', 'Add'), 'hsm', () => { const c = { id: D.id('c'), name: T('Nouveau canal', 'New channel'), kind: 'other', url: '', notes: '' }; D.chans.push(c); st.selChan = c.id; sfx.pop(); v.list(); v.detail(); })),
        D.chans.filter(c => match(c.name, c.url, c.notes)).map(c => row({ on: c.id === st.selChan, ic: CHI[c.kind], title: c.name, meta: (n => T(`${n} publication${n > 1 ? 's' : ''}`, `${n} post${n > 1 ? 's' : ''}`))(D.camps.flatMap(x => x.posts).filter(p => p.ch === c.id).length), fn: () => { st.selChan = c.id; v.list(); v.detail(); } }))],
      detail: () => { const c = chan(st.selChan); if (!c) return empty(T('Choisissez un canal.', 'Choose a channel.'));
        return dv('hd-pad full', dv('hd-r2 top', lbl(T('Nom', 'Name'), inp(c.name, x => { c.name = x; v.list(); })), lbl('Type', sel(CHK(), c.kind, x => { c.kind = x; v.list(); }, 'w160'))), lbl(T('Adresse', 'Address'), dv('hd-r2 one', inp(c.url, x => (c.url = x), { placeholder: 'https://…' }), btn(T('Ouvrir', 'Open'), '', () => openUrl(c.url)))),
          dv('hd-fld grow', dv('hd-lbl', T('Règles et notes (auto-promotion, salons autorisés…)', 'Rules and notes (self-promotion, allowed channels…)')), area(c.notes, x => (c.notes = x))), dv('hd-r2 one end', btn(T('Supprimer', 'Delete'), 'ter', () => { D.chans = D.chans.filter(x => x !== c); st.selChan = null; v.list(); v.detail(); }))); } });
    return v;
  };

  /* ---------- Navigateur intégré (pages fictives, aucun réseau) ---------- */
  const B = { tabs: [], sel: null, n: 0,
    open(u, fresh) { const url = B.norm(u); let t = fresh || !B.cur() ? B.add() : B.cur(); B.sel = t.id; B.load(t, url); },
    add() { const t = { id: ++B.n, url: '', hist: [], pos: -1, title: '' }; B.tabs.push(t); B.sel = t.id; return t; },
    cur() { return B.tabs.find(t => t.id === B.sel) || B.tabs[0]; },
    norm(s) { s = (s || '').trim(); if (!s) return ''; if (/^[a-z]+:\/\//i.test(s)) return s; if (!s.includes(' ') && s.includes('.')) return 'https://' + s; return 'https://duckduckgo.com/?q=' + encodeURIComponent(s); },
    load(t, url, noPush) { if (!noPush) { t.hist = t.hist.slice(0, t.pos + 1); t.hist.push(url); t.pos = t.hist.length - 1; } t.url = url; try { t.title = new URL(url).hostname.replace(/^www\./, ''); } catch { t.title = url; } } };
  V.browser = () => {
    const el = panel('hd-brw'), bar = dv('hd-bbar'), tabsEl = dv('hd-btabs'), pg = dv('hd-bpg hd-scroll'); el.append(bar, tabsEl, pg);
    if (!B.tabs.length) B.add();
    const draw = () => { const t = B.cur(), addr = h('input', { class: 'hd-in', value: t.url, placeholder: T('Adresse ou recherche', 'Address or search'), 'aria-label': T('Adresse ou recherche', 'Address or search'), spellcheck: 'false', onkeydown: e => { if (e.key === 'Enter') { const u = B.norm(e.target.value); if (u) { B.load(t, u); draw(); } } } });
      const ib = (k, l, fn, dis) => h('button', { class: 'hd-b ter sq', title: l, 'aria-label': l, disabled: dis, onclick: fn }, ic(k, 15));
      fill(bar, ib('chl', T('Précédent', 'Back'), () => { t.pos--; B.load(t, t.hist[t.pos], true); draw(); }, t.pos <= 0), ib('chr', T('Suivant', 'Forward'), () => { t.pos++; B.load(t, t.hist[t.pos], true); draw(); }, t.pos >= t.hist.length - 1), ib('reload', T('Recharger', 'Reload'), () => { drawPage(true); }, !t.url), addr, ib('compass', T('Ouvrir dans le navigateur du Mac', 'Open in the Mac’s browser'), () => demo(T('Ouvrirait la page dans le navigateur du Mac.', 'Would open the page in the Mac’s browser.')), !t.url), ib('plus', T('Nouvel onglet', 'New tab'), () => { B.add(); draw(); }));
      fill(tabsEl, B.tabs.length > 1 ? B.tabs.map(x => dv('hd-bt' + (x.id === t.id ? ' on' : ''), h('button', { class: 'tl', onclick: () => { B.sel = x.id; draw(); } }, x.title || T('Nouvel onglet', 'New tab')), h('button', { class: 'tx', 'aria-label': T('Fermer l’onglet', 'Close tab'), onclick: () => { B.tabs = B.tabs.filter(y => y !== x); if (!B.tabs.length) B.add(); B.sel = B.cur().id; draw(); } }, ic('x', 10)))) : null);
      tabsEl.hidden = B.tabs.length < 2; drawPage(); };
    const drawPage = async reload => { const t = B.cur(); if (!t.url) { fill(pg, empty(T('Les liens des publications, contacts et canaux s’ouvrent ici. ⌥-clic : navigateur du Mac.', 'Links from posts, contacts and channels open here. ⌥-click: the Mac’s browser.'))); return; }
      let host = ''; try { host = new URL(t.url).hostname.replace(/^www\./, ''); } catch {}
      const key = Object.keys(SITES).find(k => host.includes(k)) || 'other', [nm, col] = SITES[key], path = t.url.replace(/^https?:\/\/[^/]+/, '') || '/';
      const pageEl = dv('hd-wp', h('div', { class: 'hd-wph', style: { '--wc': col } }, sp('hlg', nm), sp('fl'), sp('hlk', T('Se connecter', 'Log in'))), dv('hd-wpb', h('h2', {}, pageTitle(key, path, host)), dv('hd-wpc', dv('hd-wpi'), dv('', h('p', {}, T('Page de démonstration : aucune connexion réseau n’est établie, le contenu ci-dessous est fictif.', 'Demo page: no network connection is made, the content below is fictional.')), h('p', { class: 'mut' }, t.url))), dv('hd-wpl', [1, 2, 3, 4].map(i => h('div', { class: 'ln', style: { width: (96 - i * 11) + '%' } })))));
      if (reload && !reduced()) { fill(pg, dv('hd-empty', spin())); await wait(500); if (!alive()) return; } fill(pg, pageEl); };
    draw(); return { el, refresh() {}, dispose() {} };
  };
  const SITES = { nexusmods: ['NEXUS MODS', '#d98f40'], reddit: ['reddit', '#ff4500'], youtube: ['YouTube', '#e53935'], github: ['GitHub', '#24292f'], bsky: ['Bluesky', '#1185fe'], discord: ['Discord', '#5865f2'], instagram: ['Instagram', '#d4537d'], ancientrealms: [T('Ancient Realms', 'Ancient Realms'), '#6b8e4e'], other: ['Web', '#667085'] };
  const pageTitle = (k, path, host) => { const p = posts().find(x => x.link && x.link.includes(path.split('?')[0]) && path.length > 2); const c = contacts().find(x => (x.url && x.url.includes(host)) || (path.length > 1 && x.coverage?.includes(path))); return p ? p.title : c ? c.name : ({ nexusmods: 'Ancient Realms HD — 4K Landscapes', reddit: T('Annonce de sortie', 'Release announcement'), youtube: T('Vidéo de démonstration', 'Demo video'), github: 'ghostdev / skybloom-shaders', discord: T('Serveur de la communauté', 'Community server') }[k] || host); };

  /* ---------- Agent IA (réponses écrites d'avance, aucune requête) ---------- */
  const A = { threads: new Map(), busy: null, session: '', subs: [], cancel: 0, n: 0, usage: 0, tick: 0, val: '' };
  const tgt = () => (st.scopeTask ? (st.selPost && post(st.selPost) ? 'p:' + st.selPost : null) : 'c');
  const thread = k => { if (!A.threads.has(k)) A.threads.set(k, { messages: [], tokens: 0 }); return A.threads.get(k); };
  function toggleAgent() { st.agentOpen = !st.agentOpen; if (st.agentOpen) st.scopeTask = false; sfx.click(); applyAgent(); }
  function applyAgent() {
    const on = st.agentOpen && st.agentOn; root.classList.toggle('ag', on); agentEl.hidden = !on;
    /* comme dans l'appli, la fenêtre s'élargit pour le volet (puis revient à sa largeur) ; sa largeur minimale suit */
    if (on) { w.o.minw = 1060; if (!w.max && w.w < 1060) { st.prevW = w.w; w.w = Math.min(1100, 1600 - w.x); w.el.style.width = w.w + 'px'; } }
    else { w.o.minw = 900; if (st.prevW && !w.max) { w.w = Math.max(900, st.prevW); w.el.style.width = w.w + 'px'; } st.prevW = null; }
    drawSide(); if (on) drawAgent();
  }
  const syncAgent = () => { if (!agentEl.hidden && st.scopeTask) drawAgent(); };
  const QUICK = () => [[T('Rédiger le brouillon', 'Write the draft'), 'draft'], [T('Améliorer l’accroche', 'Improve the hook'), 'hook'], [T('Traduire', 'Translate'), 'translate'], [T('Vérifier avant publication', 'Check before publishing'), 'check'], [T('Et ensuite ?', 'What next?'), 'next']];
  /* mini-Markdown : **gras**, `code`, listes */
  const md = src => { const el = dv('hd-md'); let ul = null; const inl = s => { const f = document.createDocumentFragment(); s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach(x => f.append(x.startsWith('**') ? h('b', {}, x.slice(2, -2)) : x.startsWith('`') ? h('code', {}, x.slice(1, -1)) : x)); return f; };
    src.split('\n').forEach(l => { if (/^\s*- /.test(l)) { if (!ul || ul.tagName !== 'UL') { ul = h('ul'); el.append(ul); } ul.append(h('li', {}, inl(l.replace(/^\s*- /, '')))); } else if (/^\s*\d+\. /.test(l)) { if (!ul || ul.tagName !== 'OL') { ul = h('ol'); el.append(ul); } ul.append(h('li', {}, inl(l.replace(/^\s*\d+\. /, '')))); } else { ul = null; if (l.trim()) el.append(h('p', {}, inl(l))); } }); return el; };
  const reply = (target, text, kind) => {
    const p = target.startsWith('p:') ? post(target.slice(2)) : null, chn = p ? chan(p.ch)?.name : '', q = x => T(`« ${x} »`, `“${x}”`), ttl = p ? q(p.title) : T('la campagne', 'the campaign'), L = st.lang;
    if (kind == null) kind = /publi(e|er|sh)\b|envoie|send it|post it/i.test(text) && p ? 'publish' : /traduis|translate|espagnol|italien|spanish|italian/i.test(text) ? 'translate' : /accroche|hook/i.test(text) ? 'hook' : /brouillon|draft|r[ée]dige|write/i.test(text) ? 'draft' : /v[ée]rifi|check|relis|proofread/i.test(text) ? 'check' : /ensuite|next|reste|left/i.test(text) ? 'next' : 'generic';
    const mkDraft = (lang, pp) => { const k = chan(pp.ch)?.kind, link = pp.link || NEXUS;
      const t = { fr: { reddit: `${MOD} est disponible : la 4K sans sacrifier la fluidité\n\nBonjour à tous,\n\nJe viens de publier ${MOD} : textures 4K de terrain et de roches, mipmaps régénérées, option 2K légère.\n\nTéléchargement : ${link}\n\nVos retours sont les bienvenus !`, youtube: `${MOD} : des paysages en 4K qui ne coûtent rien à votre fluidité. Lien de téléchargement en description.`, def: `${MOD} est sorti : des paysages en 4K sans sacrifier vos images par seconde. Gratuit, retours bienvenus.\nLien : ${link}` },
        en: { reddit: `${MOD} is out: 4K without sacrificing smoothness\n\nHi everyone,\n\nI've just released ${MOD}: 4K terrain and rock textures, regenerated mipmaps and a lightweight 2K option.\n\nDownload: ${link}\n\nFeedback is welcome!`, youtube: `${MOD}: 4K landscapes that cost your frame rate nothing. Download link in the description.`, def: `${MOD} is out: 4K landscapes without sacrificing your frame rate. Free, feedback welcome.\nLink: ${link}` },
        es: { def: `${MOD} ya está disponible: paisajes en 4K sin sacrificar tus fps. Gratis, comentarios bienvenidos.\nEnlace: ${link}` }, it: { def: `${MOD} è disponibile: paesaggi in 4K senza sacrificare gli fps. Gratis, commenti benvenuti.\nLink: ${link}` } }[lang]; return t[k] || t.def; };
    const it = (pp, field, label, old, nw, extra = {}) => ({ id: pp.id + field + (extra.val || ''), post: pp.id, ptitle: pp.title, field, label, old, new: nw, ...extra });
    const fl = l => `${T('Brouillon', 'Draft')} · ${l.toUpperCase()}`, sub = [];
    let out;
    const bare = posts().find(y => !Object.values(y.drafts).some(Boolean) && y.status !== 'published');
    if (kind === 'publish') out = { text: T(`Je ne publie jamais rien : c'est votre rôle, et c'est voulu. Pour ${ttl}, le texte est prêt dans l'onglet Texte ; il ne reste qu'à le copier et à le poster sur ${chn || 'le canal'}.\n\nJe peux seulement proposer le statut ci-dessous.`, `I never publish anything: that's your job, by design. For ${ttl}, the text is ready in the Text tab; all that's left is to copy it and post it on ${chn || 'the channel'}.\n\nI can only propose the status below.`), items: [it(p, 'status', T('Statut', 'Status'), stLabel(p.status), stLabel('published'), { val: 'published' }), ...(p.status !== 'approved' ? [it(p, 'status', T('Statut', 'Status'), stLabel(p.status), stLabel('approved'), { val: 'approved' })] : [])] };
    else if (kind === 'draft' && p) out = { text: T(`J'ai rédigé le brouillon de ${ttl} pour ${chn || 'son canal'}, dans le ton du reste de la campagne. Relisez-le avant de le copier.`, `I've written the draft of ${ttl} for ${chn || 'its channel'}, matching the tone of the rest of the campaign. Proofread it before copying it.`), items: [it(p, 'd:fr', fl('fr'), p.drafts.fr || '', mkDraft('fr', p)), it(p, 'd:en', fl('en'), p.drafts.en || '', mkDraft('en', p))] };
    else if (kind === 'hook' && p) { const old = p.drafts[L] || '', first = old.split('\n')[0] || '', nw = T('Vos montagnes méritent mieux qu’un flou de 2012.', 'Your mountains deserve better than a 2012 blur.');
      out = { text: T(`Trois accroches pour ${ttl} :\n\n1. **Ancient Realms HD 1.4 : la 4K sans la douleur.**\n2. **Vos montagnes méritent mieux qu'un flou de 2012.**\n3. **La 4K pour tous : même sur une carte de 8 Go.**\n\nJe vous propose la n° 2 : elle est concrète et un peu drôle.`, `Three hooks for ${ttl}:\n\n1. **Ancient Realms HD 1.4: 4K without the pain.**\n2. **Your mountains deserve better than a 2012 blur.**\n3. **4K for everyone: even on an 8 GB card.**\n\nI'd go with number 2: it's concrete and a little funny.`), items: [it(p, 'hook', T(`Accroche (${L.toUpperCase()})`, `Hook (${L.toUpperCase()})`), first, nw, { full: old ? old.replace(first, nw) : nw })] }; }
    else if (kind === 'translate' && p) { sub.push(T('Traductions', 'Translations')); out = { text: T(`J'ouvre une sous-session pour traduire ${ttl} dans les langues manquantes, en gardant le ton. Voici l'espagnol et l'italien.`, `I opened a sub-session to translate ${ttl} into the missing languages, keeping the tone. Here are Spanish and Italian.`), items: [it(p, 'd:es', fl('es'), p.drafts.es || '', mkDraft('es', p)), it(p, 'd:it', fl('it'), p.drafts.it || '', mkDraft('it', p))] }; }
    else if (kind === 'check') { const miss = []; if (p) { if (p.status === 'published' && !p.link.trim()) miss.push(T('le lien de la publication est vide', 'the post’s link is empty')); if (!Object.values(p.drafts).some(Boolean)) miss.push(T('aucun brouillon rédigé', 'no draft written')); if (!p.notes) miss.push(T('pas de note sur le meilleur moment pour publier', 'no note about the best time to post')); } else posts().forEach(x => { if (x.status === 'published' && !x.link.trim()) miss.push(T(`« ${x.title} » est publiée sans lien`, `“${x.title}” is published without a link`)); if (x.status === 'idea' && sameDay(x.t, Date.now())) miss.push(T(`« ${x.title} » est prévue aujourd'hui mais reste une idée`, `“${x.title}” is due today but is still an idea`)); });
      out = { text: T(`Relecture de ${ttl} :\n\n- Cohérence avec le plan : correcte\n- Fautes : aucune repérée\n${miss.length ? miss.map(x => `- À corriger : ${x}`).join('\n') : '- Rien ne manque'}\n\nJe ne modifie rien sans votre clic.`, `Review of ${ttl}:\n\n- Consistency with the plan: fine\n- Mistakes: none spotted\n${miss.length ? miss.map(x => `- To fix: ${x}`).join('\n') : '- Nothing missing'}\n\nI won't change anything without your click.`), items: p && p.status === 'draft' && Object.values(p.drafts).some(Boolean) ? [it(p, 'status', T('Statut', 'Status'), stLabel(p.status), stLabel('approved'), { val: 'approved' })] : [] }; }
    else if (kind === 'next') { const td = todos().filter(x => x.kind !== 'track').slice(0, 4); out = { text: T(`Il vous reste, dans l'ordre :\n\n${td.map((x, i) => `${i + 1}. **${x.title}** (${x.meta})`).join('\n') || '1. Rien d\'urgent'}\n\nPensez à copier chaque texte puis à le publier vous-même.`, `What's left, in order:\n\n${td.map((x, i) => `${i + 1}. **${x.title}** (${x.meta})`).join('\n') || '1. Nothing urgent'}\n\nRemember to copy each text and post it yourself.`), items: [] }; }
    else if (['draft', 'hook', 'translate'].includes(kind) && bare) out = { text: T(`Je prépare le brouillon des publications qui n'en ont pas encore : voici une proposition pour ${q(bare.title)}.`, `I'm drafting the posts that don't have one yet: here is a proposal for ${q(bare.title)}.`), items: [it(bare, 'd:fr', fl('fr'), '', mkDraft('fr', bare)), it(bare, 'd:en', fl('en'), '', mkDraft('en', bare))] };
    else out = { text: T(`Voilà ce que je vois pour ${ttl} : ${p ? `statut « ${stLabel(p.status)} », canal ${chn || '—'}, ${Object.values(p.drafts).filter(Boolean).length} brouillon(s).` : `${posts().length} publications, dont ${posts().filter(x => x.status === 'published').length} déjà publiées.`}\n\nVous pouvez me demander de **rédiger**, **traduire**, **vérifier** ou **améliorer l'accroche**. Je propose, vous décidez.`, `Here is what I see for ${ttl}: ${p ? `status “${stLabel(p.status)}”, channel ${chn || '—'}, ${Object.values(p.drafts).filter(Boolean).length} draft(s).` : `${posts().length} posts, ${posts().filter(x => x.status === 'published').length} already published.`}\n\nYou can ask me to **write**, **translate**, **check** or **improve the hook**. I propose, you decide.`), items: [] };
    out.sub = sub[0]; return out;
  };
  const applyItems = items => { const undo = []; let ign = 0; items.forEach(i => { const p = post(i.post); if (!p) return;
    if (i.field === 'status') { if (i.val === 'published') { ign++; return; } undo.push({ p, f: 'status', old: p.status }); p.status = i.val; }
    else if (i.field.startsWith('d:')) { const l = i.field.slice(2); undo.push({ p, f: i.field, old: p.drafts[l] }); p.drafts[l] = i.new; }
    else if (i.field === 'hook') { undo.push({ p, f: 'd:' + st.lang, old: p.drafts[st.lang] }); p.drafts[st.lang] = i.full; } }); return { undo, ign }; };
  const undoItems = u => u.forEach(x => { if (x.f === 'status') x.p.status = x.old; else x.p.drafts[x.f.slice(2)] = x.old; });
  const tokens = s => Math.round(s.length / 3.4) + 380, cost = n => (n * 0.000012).toLocaleString(LG(), { style: 'currency', currency: T('EUR', 'USD'), maximumFractionDigits: 2 });
  /* éléments permanents : le champ de saisie n'est jamais reconstruit (pas de perte de focus ni de texte) */
  const AG = {};
  const updSend = () => { const tg = tgt(); AG.send.disabled = !AG.ta.value.trim() || !!A.busy || !tg; AG.quick.disabled = !!A.busy || !tg; };
  const sendNow = () => { const q = AG.ta.value.trim(), tg = tgt(); if (q && !A.busy && tg) ask(tg, q); };
  AG.head = dv('hd-ahead'); AG.conv = dv('hd-conv hd-scroll');
  AG.ta = h('textarea', { class: 'hd-in ta', placeholder: T('Votre demande… (Entrée pour envoyer, ⇧Entrée pour un retour à la ligne)', 'Your request… (Return to send, ⇧Return for a new line)'), 'aria-label': T('Votre demande', 'Your request'), rows: 3, spellcheck: 'false', oninput: updSend, onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendNow(); } } });
  AG.send = btn(T('ENVOYER', 'SEND'), 'pri hsm', sendNow, { disabled: true });
  AG.quick = btn(T('Actions rapides', 'Quick actions'), 'ter hsm', e => showPop(QUICK().map(([l, k]) => [l, () => ask(tgt(), l, k)]), e.currentTarget, { min: 210, up: true }), { 'aria-haspopup': 'menu' });
  fill(agentEl, AG.head, AG.conv, dv('hd-comp', AG.ta, dv('hd-r2 one', AG.quick, sp('fl'), AG.send), dv('hd-meta', T('L’agent lit et conseille, il ne publie jamais. Ses propositions de modifications (notes, brouillons, statut) ne s’appliquent que d’un clic de votre part, et s’annulent.', 'The agent reads and advises, it never publishes. Its proposed changes (notes, drafts, status) apply only when you click, and can be undone.'))));
  async function ask(target, text, kind) {
    if (A.busy || !target) return; const th = thread(target), my = ++A.cancel, r = reply(target, text, kind);
    th.messages.push({ id: ++A.n, role: 'user', text, t: Date.now() }); AG.ta.value = '';
    if (!A.session) A.session = [...Array(8)].map(() => '0123456789abcdef'[Math.random() * 16 | 0]).join('');
    A.busy = { target, status: T('Réfléchit…', 'Thinking…'), t0: Date.now() }; drawAgent();
    const subS = T('Ouvre une sous-session…', 'Opening a sub-session…');
    for (const [s, ms] of [[T('Réfléchit…', 'Thinking…'), 650], [T('Lit : fiche de la tâche', 'Reading: task sheet'), 650], [r.sub ? subS : T('Rédige la réponse…', 'Writing the answer…'), 750]]) {
      if (!alive() || A.cancel !== my) return; A.busy.status = s; if (r.sub && s === subS && !A.subs.includes(r.sub)) A.subs.push(r.sub); drawAgent(); await wait(reduced() ? 0 : ms); }
    if (!alive() || A.cancel !== my) return;
    const m = { id: ++A.n, role: 'agent', text: r.text, t: Date.now(), items: r.items, applied: null, dismissed: false, picked: null, streaming: true, usage: tokens(r.text + r.items.map(x => x.new).join('')) };
    th.messages.push(m); th.tokens += m.usage; A.usage += m.usage; A.busy = { ...A.busy, streaming: true }; drawAgent();
    const bt = AG.conv.querySelector(`[data-m="${m.id}"] .hd-bt`); if (bt) await stream(bt, r.text, { think: 0, cps: 240, alive: () => alive() && A.cancel === my });
    if (!alive()) return; m.streaming = false; A.busy = null; drawAgent(); sfx.done();
  }
  function drawAgent() {
    const tg = tgt(), th = tg ? thread(tg) : null, p = tg && tg.startsWith('p:') ? post(tg.slice(2)) : null, title = tg === 'c' ? C().name : p ? p.title : '', ib = (k, l, fn, dis) => h('button', { class: 'hd-ib', title: l, 'aria-label': l, disabled: dis, onclick: fn }, ic(k, 14));
    fill(AG.head, dv('hd-ah', sp('hd-eyebrow', T('Agent IA', 'AI agent')), sp('fl'), ib('trash', T('Effacer', 'Clear'), () => { th.messages.length = 0; drawAgent(); }, !th || !th.messages.length), ib('gear', T('Configurer l’agent…', 'Set up the agent…'), agentSheet), ib('x', T('Fermer le volet', 'Close the panel'), toggleAgent)),
      seg([['c', T('Campagne', 'Campaign')], ['t', T('Tâche sélectionnée', 'Selected task')]], st.scopeTask ? 't' : 'c', k => { st.scopeTask = k === 't'; drawAgent(); }), title ? dv('hd-at', title) : null,
      tg ? dv('hd-r2 one', badge('hERALD', 'ac'), sp('mono sub nm', A.session ? A.session + '…' : T('session créée au premier message', 'session created with the first message'))) : null, tg && A.session ? dv('hd-r2', copyBtn(T('Copier la commande de reprise', 'Copy the resume command'), () => `cd "~/Documents/hERALD" && claude --resume ${A.session}`, 'hsm')) : null,
      A.subs.length ? dv('hd-r2', sp('hd-eyebrow', T('Sous-sessions', 'Sub-sessions')), A.subs.map(s => copyBtn(s, () => `claude --resume ${A.session}`, 'hsm'))) : null,
      A.usage ? dv('hd-meta', T(`Consommation · discussion : ${nf(th?.tokens || 0)} jetons · campagne : ${nf(A.usage)} jetons (${cost(A.usage)})`, `Usage · chat: ${nf(th?.tokens || 0)} tokens · campaign: ${nf(A.usage)} tokens (${cost(A.usage)})`)) : null);
    fill(AG.conv, th ? [th.messages.length ? null : empty(T('Posez une question ou demandez un travail : rédiger, traduire, vérifier, préparer la suite.', 'Ask a question or request a job: write, translate, check, prepare what comes next.')), th.messages.map(bubble),
      A.busy && A.busy.target === tg && !A.busy.streaming ? dv('hd-busy', spin(), dv('hbt', sp('bs', A.busy.status), dv('hd-meta el', T('depuis 0 s', 'for 0 s'))), btn(T('Arrêter', 'Stop'), 'hsm', () => { A.cancel++; A.busy = null; drawAgent(); })) : null] : empty(T('Sélectionnez une tâche dans les publications pour en discuter avec l’agent.', 'Select a task in Posts to talk about it with the agent.')));
    { const bs = AG.conv.querySelectorAll('.hd-bub'), lb = bs[bs.length - 1]; AG.conv.scrollTop = lb && lb.classList.contains('ag') && lb.offsetHeight > AG.conv.clientHeight - 24 ? lb.offsetTop - AG.conv.offsetTop - 4 : AG.conv.scrollHeight; } updSend(); clearInterval(A.tick);
    const el = AG.conv.querySelector('.hd-busy .el'); if (el) { A.tick = setInterval(() => { if (!alive() || !el.isConnected || !A.busy) return clearInterval(A.tick); const n = Math.round((Date.now() - A.busy.t0) / 1000); el.textContent = T(`depuis ${n} s`, `for ${n} s`); }, 500); timers.add(A.tick); }
  }
  function bubble(m) {
    const me = m.role === 'user', b = dv('hd-bub ' + (me ? 'me' : 'ag')); b.dataset.m = m.id;
    if (me) b.append(dv('tx', m.text)); else if (m.streaming) b.append(dv('hd-bt')); else { b.append(md(m.text)); if (m.items.length) b.append(proposal(m)); b.append(dv('hd-meta cap', `${fstamp(m.t)} · ${nf(m.usage)} ${T('jetons', 'tokens')} · ${cost(m.usage)}`)); }
    return b;
  }
  function proposal(m) {
    const chosen = m.picked || (m.picked = new Set(m.items.map(i => i.id))), card = dv('hd-prop'), paint = () => {
      fill(card, eyebrow(T('Proposition de l’agent', 'Agent’s proposal')),
        m.applied ? dv('hd-meta', T(`${m.undo.length} champ${m.undo.length > 1 ? 's' : ''} modifié${m.undo.length > 1 ? 's' : ''}.`, `${m.undo.length} field${m.undo.length > 1 ? 's' : ''} changed.`) + (m.ign ? ' ' + T('« Publié » se coche à la main : statut ignoré.', '“Published” is ticked by hand: status ignored.') : '')) : null,
        m.applied || m.dismissed ? null : m.items.map(i => dv('hd-diff', h('label', { class: 'hd-chk' }, h('input', { type: 'checkbox', checked: chosen.has(i.id), onchange: e => { e.target.checked ? chosen.add(i.id) : chosen.delete(i.id); paint(); } }), h('i', {}), dv('', h('b', {}, i.label), h('small', {}, i.ptitle))), dv('hd-cmp', dv('', h('small', {}, T('Avant', 'Before')), h('pre', {}, i.old || T('(vide)', '(empty)'))), dv('', h('small', {}, T('Après', 'After')), h('pre', { class: 'new' }, i.new))))),
        dv('hd-r2 one', m.applied ? [badge(T('Appliquée le ', 'Applied ') + fstamp(m.applied), 'ok'), btn(T('Annuler', 'Undo'), 'hsm', () => { undoItems(m.undo); m.applied = null; m.ign = 0; sfx.click(); refreshAll(); paint(); })]
          : m.dismissed ? badge(T('Ignorée', 'Dismissed'))
          : [btn(chosen.size === m.items.length ? T('Appliquer', 'Apply') : T(`Appliquer la sélection (${chosen.size})`, `Apply selection (${chosen.size})`), 'pri hsm', () => { const r = applyItems(m.items.filter(i => chosen.has(i.id))); m.undo = r.undo; m.ign = r.ign; m.applied = Date.now(); sfx.pop(); refreshAll(); paint(); }, { disabled: !chosen.size }), btn(T('Ignorer', 'Dismiss'), 'ter hsm', () => { m.dismissed = true; paint(); })]));
    }; paint(); return card;
  }
  function agentSheet() {
    const e = { kind: 'claude' }; const tr = dv('');
    const close = sheet(T('Agent IA', 'AI agent'), dv('hd-form', lbl(T('Agent', 'Agent'), seg([['claude', 'Claude Code'], ['command', T('Autre agent (commande)', 'Other agent (command)')], ['openai', T('ChatGPT / API OpenAI', 'ChatGPT / OpenAI API')]], e.kind, k => (e.kind = k))), chk(T('Mode léger (recommandé)', 'Light mode (recommended)'), true, () => {}), meta(T('Claude Code démarre sans vos serveurs MCP, skills, hooks ni CLAUDE.md : une demande consomme environ cent fois moins de jetons.', 'Claude Code starts without your MCP servers, skills, hooks or CLAUDE.md: a request uses about a hundred times fewer tokens.')),
      lbl(T('Nom de la session', 'Session name'), inp('hERALD', () => {})), meta(T('Toutes vos demandes arrivent dans cette session de Claude Code ; vous la retrouvez par son nom (commande « claude --resume »).', 'All your requests land in this Claude Code session; find it by its name (“claude --resume” command).')),
      lbl(T('Contexte joint à vos demandes', 'Context sent with your requests'), dv('hd-r2', chk(T('Brouillons', 'Drafts'), true, () => {}), chk(T('Statistiques', 'Statistics'), true, () => {}), chk(T('Notes de la campagne', 'Campaign notes'), true, () => {}))), meta(T('La fiche de la tâche est toujours jointe. Rien n’est envoyé ailleurs qu’à l’agent que vous avez choisi.', 'The task sheet is always attached. Nothing is sent anywhere but to the agent you chose.')),
      dv('hd-r2 one', btn(T('Tester l’agent', 'Test the agent'), '', () => { tr.replaceChildren(spin()); later(() => { fill(tr, sp('hd-meta ok', T('✓ Prêt : Claude Code, dossier de travail accessible.', '✓ Ready: Claude Code, working folder accessible.'))); sfx.done(); }, 900); }), tr)),
      [btn(T('TERMINÉ', 'DONE'), 'pri', () => close())], 560);
  }

  /* ---------- Réglages et À propos ---------- */
  function settingsSheet() {
    const e = { agent: st.agentOn, mail: st.mail, icon: st.icon }; const upd = sp('hd-meta', T(`Version installée : ${VERSION}`, `Installed version: ${VERSION}`)), bk = sp('hd-meta', st.backup ? T('Dernière sauvegarde : ', 'Last backup: ') + fstamp(st.backup) : T('Aucune sauvegarde pour l’instant.', 'No backup yet.'));
    const secret = (ph) => h('input', { class: 'hd-in', type: 'password', placeholder: ph || '', autocomplete: 'off', 'aria-label': ph || '' });
    const body = dv('hd-form',
      lbl(T('Clé API Nexus (facultative)', 'Nexus API key (optional)'), secret(), meta(T('Sert seulement à lire les pages de mods Nexus surveillées. Gardée dans le trousseau macOS, jamais dans le plan ni l’export. (Démo : rien n’est enregistré.)', 'Only used to read the watched Nexus mod pages. Stored in the macOS keychain, never in the plan or the export. (Demo: nothing is stored.)'))),
      lbl(T('Clé API YouTube (statistiques des vidéos)', 'YouTube API key (video statistics)'), secret(), dv('hd-r2 one', meta(T('Gratuite : Google Cloud > YouTube Data API v3 > Identifiants > Clé API.', 'Free: Google Cloud > YouTube Data API v3 > Credentials > API key.')), sp('fl'), btn(T('Ouvrir Google Cloud', 'Open Google Cloud'), 'ter hsm', () => openUrlClose('https://console.cloud.google.com')))),
      lbl(T('Reddit (appli de type script, lecture seule)', 'Reddit (script app, read only)'), dv('hd-r2 one', inp('', () => {}, { placeholder: T('Identifiant de l’appli (client ID)', 'App ID (client ID)') }), secret(T('Secret', 'Secret'))), dv('hd-r2 one', meta(T('Reddit refuse les lectures anonymes : créez une appli « script » gratuite.', 'Reddit refuses anonymous reads: create a free “script” app.')), sp('fl'), btn(T('Ouvrir Reddit', 'Open Reddit'), 'ter hsm', () => openUrlClose('https://www.reddit.com/prefs/apps')))),
      dv('hd-r2 top', lbl(T('Site web', 'Website'), inp(SITE, () => {})), lbl('GoatCounter', inp('ancientrealms', () => {}))), meta(T('Compteur de visites gratuit, sans cookies.', 'Free visit counter, no cookies.')),
      lbl(T('Mises à jour', 'Updates'), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), true, () => {}), dv('hd-r2 one', btn(T('Rechercher une mise à jour', 'Check for updates'), '', async ev => { const b = ev.currentTarget; b.disabled = true; upd.textContent = T('Recherche en cours…', 'Checking…'); await wait(reduced() ? 0 : 1000); if (!alive()) return; b.disabled = false; upd.textContent = T(`hERALD est à jour (version ${VERSION}).`, `hERALD is up to date (version ${VERSION}).`); sfx.done(); }), upd)),
      lbl(T('Sauvegarde iCloud des plans', 'iCloud backup of your plans'), chk(T('Sauvegarder les plans dans iCloud Drive', 'Back up plans to iCloud Drive'), true, () => {}), dv('hd-r2', btn(T('Sauvegarder maintenant', 'Back up now'), '', () => { st.backup = Date.now(); bk.textContent = T('Dernière sauvegarde : ', 'Last backup: ') + fstamp(st.backup); sfx.done(); }), btn(T('Restaurer…', 'Restore…'), '', () => demo(T('Ouvrirait le sélecteur de fichiers de macOS.', 'Would open the macOS file picker.'))), btn(T('Afficher dans le Finder', 'Show in Finder'), 'ter', () => demo(T('Ouvrirait iCloud Drive › hERALD › Sauvegardes.', 'Would open iCloud Drive › hERALD › Backups.')))), bk, meta(T('Un instantané par jour (30 gardés), 20 s après chaque modification. Un plan vide n’est jamais sauvegardé.', 'One snapshot per day (30 kept), 20 s after each change. An empty plan is never backed up.'))),
      lbl(T('Client de messagerie', 'Mail client'), seg([['mail', 'Mail'], ['other', T('Autre client', 'Other client')]], e.mail, k => (e.mail = k)), meta(T('Aucun mot de passe n’est demandé : hERALD passe par l’app Mail déjà connectée à vos comptes. macOS demande une autorisation à la première utilisation.', 'No password is asked: hERALD uses the Mail app already signed in to your accounts. macOS asks for permission on first use.'))),
      lbl(T('Icône de l’appli', 'App icon'), seg([['dock', 'Dock'], ['menubar', T('Barre de menus', 'Menu bar')], ['both', T('Les deux', 'Both')]], e.icon, k => (e.icon = k))),
      lbl(T('Agent IA (facultatif)', 'AI agent (optional)'), dv('hd-r2 one', chk(T('Discuter avec un agent IA depuis hERALD', 'Chat with an AI agent from hERALD'), e.agent, v => (e.agent = v)), sp('fl'), btn(T('Configurer l’agent…', 'Set up the agent…'), '', () => { agentSheetFromSettings(); })), meta(T('Désactivé par défaut : hERALD fonctionne très bien sans agent. Activé, chaque tâche et la campagne ont une discussion avec l’agent de votre choix (Claude Code, Codex, ChatGPT…).', 'Off by default: hERALD works perfectly without an agent. When on, every task and the campaign get a chat with the agent of your choice (Claude Code, Codex, ChatGPT…).'))),
      lbl(T('Données', 'Data'), dv('hd-r2 one', sp('mono sub nm', '~/Library/Application Support/hERALD/plan.json'), sp('fl'), btn(T('Afficher dans le Finder', 'Show in Finder'), 'ter hsm', () => demo(T('Ouvrirait le dossier des données.', 'Would open the data folder.'))))),
      lbl(T('Boîte de dépôt', 'Drop box'), dv('hd-r2 one', sp('mono sub nm', '~/Library/Application Support/hERALD/Inbox'), sp('fl'), btn(T('Afficher dans le Finder', 'Show in Finder'), 'ter hsm', () => demo(T('Ouvrirait le dossier de dépôt.', 'Would open the drop-box folder.')))), meta(T('Déposez ici des fichiers JSON de changements (ou un plan .herald) : hERALD les fusionne aussitôt dans le plan, sans écraser vos saisies. Le script herald_add les écrit pour vous. Rien n’est jamais publié.', 'Drop JSON change files (or a .herald plan) here: hERALD merges them into the plan right away, without overwriting what you typed. The herald_add script writes them for you. Nothing is ever published.')), dv('hd-log mono', st.inboxLog.length ? st.inboxLog.slice().reverse().join('\n') : T('Aucun fichier traité pour l’instant.', 'No file processed yet.'))),
      callout('in', RULE_LONG()));
    const close = sheet(T('Réglages', 'Settings'), body, [btn(T('ANNULER', 'CANCEL'), '', close_), btn(T('ENREGISTRER', 'SAVE'), 'pri', () => { st.mail = e.mail; st.icon = e.icon; const was = st.agentOn; st.agentOn = e.agent; if (!st.agentOn) { st.agentOpen = false; applyAgent(); } else if (!was) sfx.pop(); close_(); drawSide(); view?.refresh?.(); })], 620);
    function close_() { closeModal(); }
    function openUrlClose(u) { closeModal(); openUrl(u); }
    function agentSheetFromSettings() { agentSheet(); }
  }
  function aboutSheet() {
    const close = sheet(null, dv('hd-about', h('img', { src: icon(app.id), alt: '', width: 84, height: 84 }), h('h2', { html: brand('hERALD', HC) }), meta(T('Version ', 'Version ') + VERSION), h('p', {}, T('Gestion de campagnes de communication pour moddeurs.', 'Communication campaign management for modders.')), h('p', { class: 'au' }, 'Starbudweiser & Claude Code (Anthropic)'), h('p', {}, T('Licence MIT', 'MIT License')), meta(RULE_LONG()), meta(T('Fourni en l’état, sans garantie. Vérifiez vos textes avant de publier.', 'Provided as is, without warranty. Check your texts before publishing.'))), [btn(T('TERMINÉ', 'DONE'), 'pri', () => closeModal())], 380);
  }

  /* ---------- clavier, dépôt automatique, nettoyage ---------- */
  w.key = e => {
    if (S.active !== w) return;
    if (e.key === 'Escape') { if (!pop.hidden) { hidePop(); e.stopPropagation(); } else if (layers.length) { e.preventDefault(); e.stopPropagation(); closeModal(); } return; }
    if ((e.metaKey || e.ctrlKey) && !e.altKey && /^[1-9]$/.test(e.key) && !layers.length) { const k = order()[+e.key - 1]; if (k) { e.preventDefault(); e.stopPropagation(); k === 'agent' ? (st.agentOn && C() && toggleAgent()) : go(k); } }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f' && !layers.length && w.search?.isConnected) { e.preventDefault(); e.stopPropagation(); w.search.focus({ preventScroll: true }); w.search.select(); }
  };
  addEventListener('keydown', w.key, true);
  /* un script (herald_add) dépose un fichier dans la boîte de dépôt : la publication apparaît toute seule */
  later(() => { if (!C() || st.ci !== 0) return; const p = { id: D.id('p'), title: T('Remercier les premiers testeurs', 'Thank the first testers'), t: day(2), ch: D.chans[2].id, ms: 'm_follow', status: 'idea', drafts: {}, link: '', notes: T('Ajouté par la boîte de dépôt.', 'Added through the drop box.'), stat: null, fb: [] }; C().posts.push(p); st.inbox = 1; st.inboxLog.push(`${new Date().toISOString().slice(0, 19)}Z  ${T('ajout-testeurs.json : 1 ajout(s), 0 mise(s) à jour', 'add-testers.json: 1 addition(s), 0 update(s)')}`); sfx.notif(); drawSide(); view?.refresh?.(); }, 40000);
  const ro = new ResizeObserver(() => fitStatus()); ro.observe(eStatus);
  w.cleanup = () => { ro.disconnect(); timers.forEach(t => (clearTimeout(t), clearInterval(t))); removeEventListener('keydown', w.key, true); removeEventListener('pointerdown', w.away, true); clearInterval(A.tick); A.cancel++; w.unbrand && w.unbrand(); };
  go('today', true);
  return root;
}
