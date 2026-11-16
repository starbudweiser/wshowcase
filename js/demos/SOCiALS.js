/* Réplique interactive de SOCiALS (interface Socle) : barre latérale « les gens d'abord » (qui vous attend, où, depuis quand ; « Plus tard » qui revient à l'heure dite, « Fait » qui range),
   liste des services avec une session isolée par compte, mise en veille et mémoire mesurée, le Calme (Tout de suite / Par moments, résumé, proches, règle par service), ajout d'un service.
   Conversations dessinées, prénoms inventés, aucune marque reproduite au-delà d'une pastille de couleur : rien n'est lu, rien n'est envoyé. */
import { S, emit } from '../core.js';
import { h, T, sfx, toast, wm, icon as appIcon, brand, clamp, num, reduced } from './kit.js';
import { lang } from '../i18n.js';
import { cssReady, macMenu, closeMenus, menuOpenFor, sheet, aboutWin, bhtml } from './mLINKS.js';

const ID = 'SOCiALS', BRAND = '#15a4ed', CSS2 = 'css/demos/SOCiALS.css';
const X = v => (Array.isArray(v) ? T(v[0], v[1]) : v);
const NOW = 12 * 60 + 52; /* vendredi, 12:52 */

/* ====================================================================== catalogue ====================================================================== */
const IG = 'linear-gradient(45deg,#fdc468,#fa7e1e,#d62976,#962fbf,#4f5bd5)';
const SV = {
  wa: { n: 'WhatsApp', c: '#25d366', g: 'W', cat: 'msg', mem: 380 }, ms: { n: 'Messenger', c: '#0a7cff', bg: 'linear-gradient(45deg,#0a7cff,#a033ff,#ff5c87)', g: 'M', cat: 'msg', mem: 350 },
  tg: { n: 'Telegram', c: '#2aabee', g: 'T', cat: 'msg', mem: 260 }, sg: { n: 'Signal', c: '#3a76f0', g: 'S', cat: 'msg', mem: 240 },
  ig: { n: 'Instagram', c: '#d62976', bg: IG, g: 'I', cat: 'soc', mem: 420 }, fb: { n: 'Facebook', c: '#1877f2', g: 'f', cat: 'soc', mem: 440 }, x: { n: 'X', c: '#3a3a3c', g: 'X', cat: 'soc', mem: 330 },
  li: { n: 'LinkedIn', c: '#0a66c2', g: 'in', cat: 'soc', mem: 360 }, bs: { n: 'Bluesky', c: '#1185fe', g: 'B', cat: 'soc', mem: 250 }, rd: { n: 'Reddit', c: '#ff4500', g: 'R', cat: 'soc', mem: 310 },
  dc: { n: 'Discord', c: '#5865f2', g: 'D', cat: 'work', mem: 510 }, sl: { n: 'Slack', c: '#4a154b', g: 'S', cat: 'work', mem: 460 }, tm: { n: 'Teams', c: '#6264a7', g: 'T', cat: 'work', mem: 520 },
  gl: { n: 'Gmail', c: '#ea4335', g: 'G', cat: 'work', mem: 340 }, ol: { n: 'Outlook', c: '#0f6cbd', g: 'O', cat: 'work', mem: 330 },
  yt: { n: 'YouTube', c: '#ff0000', g: '▶', cat: 'vid', mem: 480 }, tt: { n: 'TikTok', c: '#222', g: '♪', cat: 'vid', mem: 400 }, tw: { n: 'Twitch', c: '#9146ff', g: 'T', cat: 'vid', mem: 430 }
};
const CATS = () => [['all', T('Tous', 'All')], ['msg', T('Messageries', 'Messaging')], ['soc', T('Réseaux', 'Social')], ['work', T('Travail', 'Work')], ['vid', T('Vidéo', 'Video')]];

/* ====================================================================== données ====================================================================== */
let D = null, uidN = 0, running = false, extra = null, inQ = 0;
const views = new Set();
const uid = p => p + (++uidN);
const mm = n => String(n).padStart(2, '0');
const tm = min => { const hh = Math.floor(min / 60) % 24, m = min % 60; return lang() === 'fr' ? hh + ':' + mm(m) : ((hh % 12) || 12) + ':' + mm(m) + ' ' + (hh < 12 ? 'AM' : 'PM'); };
const hr = n => (lang() === 'fr' ? n + ' h' : ((n % 12) || 12) + (n < 12 ? ' AM' : ' PM'));
const dur = m => (m < 1 ? T('à l’instant', 'just now') : m < 60 ? T(`${m} min`, `${m} min`) : T(`${Math.floor(m / 60)} h`, `${Math.floor(m / 60)} h`));
const mem = a => (a.on ? SV[a.svc].mem + (a.jit || 0) : 0);
const fmem = mb => (mb >= 1024 ? (mb / 1024).toLocaleString(T('fr-FR', 'en-US'), { maximumFractionDigits: 1 }) + ' ' + T('Go', 'GB') : num(Math.round(mb)) + ' ' + T('Mo', 'MB'));
function seed() {
  const a = (svc, label, on, jit) => ({ id: uid('a'), svc, label, on, jit });
  const accts = [a('wa', ['Perso', 'Personal'], true, 22), a('wa', ['Pro', 'Work'], false, 41), a('tg', '', true, 12), a('ig', '', true, 35), a('sl', 'Atlas', false, 30), a('gl', '', false, 18), a('dc', '', false, 26)];
  const [wp, wpro, tg, ig, sl, gl] = accts.map(x => x.id);
  const m = (me, t, at) => ({ me, t, at });
  const P = (name, acct, snip, at, unread, st, msgs, o = {}) => ({ id: uid('p'), name, acct, snip, at, unread, st, msgs, close: false, ...o });
  const people = [
    P('Léa Martin', wp, ['J’ai réservé chez Fernand, 20 h 30.', 'I booked at Fernand’s, 8:30 pm.'], 768, 3, 'wait', [
      m(0, ['Coucou ! Tu es toujours partant pour samedi soir ?', 'Hey! Are you still in for Saturday night?'], 758), m(1, ['Carrément. On se retrouve où ?', 'Definitely. Where do we meet?'], 760),
      m(0, ['J’ai réservé chez Fernand, 20 h 30.', 'I booked at Fernand’s, 8:30 pm.'], 765), m(0, ['Karim vient aussi, il te demande l’heure.', 'Karim is coming too, he asks what time.'], 768)], { close: true }),
    P('Karim Benali', tg, ['Tu passes à quelle heure samedi ?', 'What time are you coming by Saturday?'], 751, 1, 'wait', [m(1, ['Je prends le pain en route.', 'I’ll grab the bread on the way.'], 740), m(0, ['Tu passes à quelle heure samedi ?', 'What time are you coming by Saturday?'], 751)]),
    P('Équipe Atlas', sl, ['Sophie : la démo passe à jeudi 10 h', 'Sophie: the demo moves to Thursday 10 am'], 740, 3, 'wait', [m(0, ['Sophie : on est prêts pour la démo ?', 'Sophie: are we ready for the demo?'], 731), m(1, ['Presque, il me manque les chiffres.', 'Almost, I still miss the numbers.'], 735), m(0, ['Sophie : la démo passe à jeudi 10 h', 'Sophie: the demo moves to Thursday 10 am'], 740)], { close: true }),
    P('Julien Dubois', gl, ['Le devis est en pièce jointe.', 'The quote is attached.'], 545, 1, 'wait', [m(0, ['Bonjour, voici le devis pour la salle. Dites-moi si cela vous convient.', 'Hello, here is the quote for the hall. Let me know if it suits you.'], 545)]),
    P('Nina Costa', ig, ['On se voit lundi ?', 'See you Monday?'], 700, 0, 'later', [m(0, ['On se voit lundi ?', 'See you Monday?'], 700)], { back: { day: 3, min: 540 } }),
    P('Maman', wp, ['Bisous, à dimanche.', 'Love you, see you Sunday.'], 700, 0, 'recent', [m(1, ['Je passe dimanche avec le gâteau.', 'I’ll come Sunday with the cake.'], 695), m(0, ['Bisous, à dimanche.', 'Love you, see you Sunday.'], 700)], { close: true }),
    P('Sophie Laurent', ig, ['Merci pour les photos !', 'Thanks for the photos!'], 672, 0, 'recent', [m(1, ['Je t’envoie les photos ce soir.', 'I’ll send you the photos tonight.'], 660), m(0, ['Merci pour les photos !', 'Thanks for the photos!'], 672)]),
    P('Marc Roux', wpro, ['Réunion confirmée.', 'Meeting confirmed.'], 640, 0, 'recent', [m(0, ['Réunion confirmée, 14 h salle B.', 'Meeting confirmed, 2 pm, room B.'], 640)]),
    P('Camille Roux', wpro, ['Photo', 'Photo'], 600, 0, 'recent', [m(0, ['Photo', 'Photo'], 600)])
  ];
  return { lang: lang(), accts, people, mode: 'now', moments: [9, 13, 18], rules: { wa: 'rest', ig: 'moments', sl: 'work', tg: 'rest' }, focus: true, sleepIdle: true, delay: 15, dnd: false, held: [], digests: [], cur: null, view: 'people', q: '', loading: null, ov: null, tab: 'calm', draft: {} };
}
const data = () => { if (!D) D = seed(); return D; };
const acct = id => data().accts.find(a => a.id === id);
const person = id => data().people.find(p => p.id === id);
const aname = a => SV[a.svc].n + (a.label ? ' · ' + X(a.label) : '');
const DAYL = n => [['aujourd’hui', 'today'], ['demain', 'tomorrow'], ['dimanche', 'Sunday'], ['lundi', 'Monday']][n], DAYS = n => [['', ''], ['dem.', 'Tomorrow'], ['dim.', 'Sun'], ['lun.', 'Mon']][n];
const backTxt = b => T(`${DAYL(b.day)[0]} à ${tm(b.min)}`, `${DAYL(b.day)[1]} at ${tm(b.min)}`);
const pn = p => (acct(p.acct) ? aname(acct(p.acct)) : '');
const repaint = () => views.forEach(v => v.paint && v.paint());
const lastSnip = p => X(p.snip);
const waiting = () => data().people.filter(p => p.st === 'wait').sort((a, b) => b.at - a.at);
const totalUnread = () => waiting().reduce((n, p) => n + p.unread, 0);
const nextMoment = () => { const ms = [...data().moments].sort((a, b) => a - b); return ms.find(x => x * 60 > NOW) ?? ms[0]; };
const effective = p => { const r = data().rules[acct(p.acct).svc] || 'rest'; if (p.close) return 'now'; const e = r === 'rest' ? data().mode : r; return e === 'work' ? (NOW >= 540 && NOW < 1080 ? 'now' : 'moments') : e; };

/* ====================================================================== actions ====================================================================== */
function wake(a) {
  if (a.on) return; a.on = true; data().loading = a.id; sfx.tick();
  setTimeout(() => { if (data().loading === a.id) data().loading = null; repaint(); }, reduced() ? 0 : 950); repaint();
}
function sleepAcct(a) { if (!a.on) return; const c = data().cur; if (c && ((c.k === 'p' && person(c.id).acct === a.id) || (c.k === 'a' && c.id === a.id))) data().cur = null; a.on = false; sfx.tick(); }
function sleepIdle() {
  const c = data().cur, keep = c ? (c.k === 'p' ? person(c.id).acct : c.k === 'a' ? c.id : null) : null; let n = 0;
  data().accts.forEach(a => { if (a.on && a.id !== keep) { a.on = false; n++; } });
  sfx.done(); toast({ icon: appIcon(ID), title: ID, body: n ? T(`${n} services mis en veille. Sessions conservées.`, `${n} services put to sleep. Sessions kept.`) : T('Aucun service inactif.', 'No idle service.') }); repaint();
}
function openP(id) {
  const p = person(id); if (!p) return; data().cur = { k: 'p', id }; p.unread = 0; const a = acct(p.acct); if (a && !a.on) wake(a); sfx.tick(); repaint();
}
function doneP(p) { p.st = 'recent'; p.unread = 0; p.remind = false; if (data().cur && data().cur.id === p.id) data().cur = null; sfx.done(); repaint(); }
const LATER = () => [
  { l: T('Ce soir', 'This evening'), min: 20 * 60, day: 0 }, { l: T('Demain matin', 'Tomorrow morning'), min: 540, day: 1 },
  { l: T('Après-demain', 'The day after tomorrow'), min: 540, day: 2 }, { l: T('Lundi matin', 'Monday morning'), min: 540, day: 3 }];
function laterP(p, o) {
  p.st = 'later'; p.back = { day: o.day, min: o.min }; if (data().cur && data().cur.id === p.id) data().cur = null;
  sfx.pop(); toast({ icon: appIcon(ID), title: p.name, body: T(`${p.name} revient ${backTxt(p.back)}.`, `${p.name} is back ${backTxt(p.back)}.`) }); repaint();
}
function backP(p) {
  p.st = 'wait'; p.remind = true; p.at = NOW; p.unread = Math.max(1, p.unread); sfx.notif();
  toast({ icon: appIcon(ID), title: p.name, body: T('Rappel : ' + lastSnip(p), 'Reminder: ' + lastSnip(p)) }); repaint();
}
function laterMenu(anchor, p) {
  macMenu(anchor, [{ label: T('Me le rappeler', 'Remind me'), disabled: true }, { sep: 1 }, ...LATER().map(o => ({ label: o.l, fn: () => laterP(p, o) }))], { align: 'left' });
}
function personMenu(e, p) {
  const a = acct(p.acct);
  macMenu({ x: e.clientX, y: e.clientY }, [{ label: T('Ouvrir dans ' + SV[a.svc].n, 'Open in ' + SV[a.svc].n), fn: () => openP(p.id) }, { label: T('Marquer comme traité', 'Mark as done'), disabled: p.st !== 'wait', fn: () => doneP(p) },
    { label: T('Plus tard…', 'Later…'), disabled: p.st !== 'wait', sub: LATER().map(o => ({ label: o.l, fn: () => laterP(p, o) })) }, { sep: 1 },
    { label: T('Toujours me prévenir', 'Always notify me'), check: p.close, fn: () => { p.close = !p.close; repaint(); } }, { label: T('Retirer de la liste', 'Remove from list'), fn: () => { data().people = data().people.filter(x => x !== p); if (data().cur && data().cur.id === p.id) data().cur = null; repaint(); } }]);
}
const INQ = () => [
  { who: 'Maman', svc: 'wa', t: ['Tu peux m’appeler ce soir ? Rien de grave.', 'Can you call me tonight? Nothing serious.'] }, { who: 'Camille Roux', svc: 'wa', t: ['Les photos du chantier sont parties.', 'The site photos are on their way.'] },
  { who: 'Karim Benali', svc: 'tg', t: ['Finalement, 21 h chez Fernand ?', 'Actually, 9 pm at Fernand’s?'] }, { who: 'Thomas Girard', svc: 'tg', t: ['On se cale un café cette semaine ?', 'Shall we set a coffee this week?'] }];
function receive() {
  const q = INQ()[inQ++ % 4], d = data();
  let p = d.people.find(x => x.name === q.who);
  if (!p) { const a = d.accts.find(x => x.svc === q.svc); p = { id: uid('p'), name: q.who, acct: a.id, snip: q.t, at: NOW, unread: 0, st: 'recent', msgs: [], close: false }; d.people.push(p); }
  const a = acct(p.acct), eff = effective(p);
  if (eff === 'moments') { d.held.push({ p: p.id, t: q.t }); sfx.tick(); repaint(); return; }
  if (!a.on) a.on = true;
  p.msgs.push({ me: 0, t: q.t, at: NOW }); p.snip = q.t; p.at = NOW; p.st = 'wait'; p.remind = false;
  if (!(d.cur && d.cur.k === 'p' && d.cur.id === p.id)) p.unread++;
  if (eff === 'now' && !d.dnd) toast({ icon: appIcon(ID), title: p.name, body: X(q.t) + (p.close && d.mode === 'moments' ? '  ★' : '') });
  repaint();
}
function deliver() {
  const d = data(); if (!d.held.length) return; const hh = nextMoment(), lines = new Map();
  d.held.forEach(x => { const p = person(x.p); if (!p) return; p.msgs.push({ me: 0, t: x.t, at: NOW }); p.snip = x.t; p.at = NOW; p.unread++; if (p.st !== 'wait') p.st = 'wait'; if (!lines.has(p.id)) lines.set(p.id, { p: p.id, n: 0, t: x.t }); const l = lines.get(p.id); l.n++; l.t = x.t; });
  const total = d.held.length; d.held = [];
  d.digests = [{ id: uid('d'), hh, total, lines: [...lines.values()] }]; d.cur = { k: 'd', id: d.digests[0].id };
  sfx.notif(); toast({ icon: appIcon(ID), title: T(`Résumé de ${hr(hh)}`, `${hr(hh)} summary`), body: T(`${total} messages de ${lines.size} personnes`, `${total} messages from ${lines.size} people`) }); repaint();
}

/* ====================================================================== icônes ====================================================================== */
const I = (d, w = 1.7) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  clock: I('<circle cx="8" cy="8" r="6"/><path d="M8 4.6V8l2.2 1.4"/>'), check: I('<path d="m3 8.4 3.2 3.1L13 4.5"/>', 1.9), gear: I('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.6v1.7M8 12.7v1.7M1.6 8h1.7M12.7 8h1.7M3.5 3.5l1.2 1.2M11.3 11.3l1.2 1.2M3.5 12.5l1.2-1.2M11.3 4.7l1.2-1.2"/>', 1.5),
  moon: I('<path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z"/>'), plus: I('<path d="M8 3v10M3 8h10"/>', 1.9), search: I('<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/>'), send: I('<path d="M2.5 8 13.5 2.5 9 13.5 7.5 9z"/>', 1.5),
  x: I('<path d="m4 4 8 8M12 4l-8 8"/>', 1.6), star: I('<path d="m8 1.8 1.9 4 4.3.5-3.2 3 .9 4.3L8 11.4 4.1 13.6l.9-4.3-3.2-3 4.3-.5z"/>', 1.3), bell: I('<path d="M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.4H2.8zM6.6 14h2.8"/>', 1.4), chev: I('<path d="m4 6 4 4 4-4"/>', 1.6),
  lock: I('<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/>', 1.4), spin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9" opacity=".9"/></svg>'
};

/* ====================================================================== petites briques ====================================================================== */
const pill = (svc, cls = '') => h('span', { class: 'socl-pill ' + cls, style: { background: SV[svc].bg || SV[svc].c }, 'aria-hidden': 'true' }, SV[svc].g);
const hue = s => { let n = 0; for (const c of s) n = (n * 37 + c.charCodeAt(0)) % 360; return n; };
const ini = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
function av(p, big) {
  const hh = hue(p.name);
  return h('span', { class: 'socl-av' + (big ? ' big' : ''), style: { background: `linear-gradient(135deg,hsl(${hh} 70% 62%),hsl(${(hh + 40) % 360} 65% 48%))` } }, ini(p.name), p.acct && acct(p.acct) ? pill(acct(p.acct).svc, 'bd') : null);
}
const btn = (cls, html, label, fn) => h('button', { class: cls, 'aria-label': label, title: label, html, onclick: e => { e.stopPropagation(); fn(e); } });
function toggle(on, fn, label) { const b = h('button', { class: 'socl-sw' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(!!on), 'aria-label': label, onclick: () => { fn(!on); } }, h('i')); return b; }
const selBtn = (txt, fn) => { const b = h('button', { class: 'socl-sel', onclick: () => fn(b) }, h('span', {}, txt), h('i', { html: IC.chev })); return b; };
const ruleName = r => ({ rest: T('Comme le reste', 'Like the rest'), now: T('Tout de suite', 'Right away'), moments: T('Par moments', 'At set times'), silent: T('Silencieux', 'Silent'), work: T(`Tout de suite, de ${hr(9)} à ${hr(18)}`, `Right away, ${hr(9)} to ${hr(18)}`) })[r];

/* ====================================================================== fenêtre ====================================================================== */
function openMain(app) {
  const A = { ...app, accent: BRAND };
  return wm.open({ id: 'app:' + ID, appId: ID, title: ID, w: 1100, h: 700, minw: 780, minh: 500, cls: 'socle mlkx-win', onclose: w => { w.dead = true; views.delete(w.view); closeMenus(); },
    build: w => { w.render = () => { views.delete(w.view); w.body.innerHTML = ''; w.body.append(ui(w, A)); const t = w.el.querySelector('.wt'); t && (t.textContent = ID); }; return ui(w, A); } });
}
function ui(w, A) {
  const d = data();
  const root = h('div', { class: 'mlkx-root socl', tabindex: '-1' }), side = h('aside', { class: 'socl-side' }), main = h('main', { class: 'socl-main' }), ovl = h('div', { class: 'socl-ovl' });
  root.append(h('div', { class: 'socl-cols' }, side, main), ovl);
  const q = h('input', { class: 'mlkx-field', type: 'search', placeholder: T('Rechercher une personne', 'Search people'), 'aria-label': T('Rechercher une personne', 'Search people'), value: d.q });
  const seg = h('div', { class: 'mlkx-seg socl-seg', role: 'tablist' });
  const list = h('div', { class: 'socl-list' }), strip = h('div', { class: 'socl-strip' });
  q.addEventListener('input', () => { d.q = q.value; drawList(); });
  side.append(h('div', { class: 'socl-sh' }, seg, q), list, strip);

  /* ---------- barre latérale ---------- */
  function drawSeg() {
    seg.replaceChildren(...[['people', T('Personnes', 'People')], ['services', T('Services', 'Services')]].map(([k, l]) => h('button', { role: 'tab', 'aria-pressed': String(d.view === k), onclick: () => { d.view = k; q.placeholder = k === 'people' ? T('Rechercher une personne', 'Search people') : T('Rechercher un service', 'Search for a service'); sfx.tick(); drawSeg(); drawList(); } }, l)));
    q.placeholder = d.view === 'people' ? T('Rechercher une personne', 'Search people') : T('Rechercher un service', 'Search for a service');
  }
  const head = (txt, n) => h('div', { class: 'socl-eb' }, h('span', {}, txt), n != null ? h('em', {}, String(n)) : null);
  function row(p) {
    const a = acct(p.acct), cur = d.cur && d.cur.k === 'p' && d.cur.id === p.id, isL = p.st === 'later', isW = p.st === 'wait';
    const r = h('div', { class: 'socl-row' + (cur ? ' on' : '') + (isL ? ' lt' : '') + (p.st === 'recent' ? ' rc' : ''), role: 'button', tabindex: '0', 'data-p': p.id, onclick: () => openP(p.id), oncontextmenu: e => { e.preventDefault(); personMenu(e, p); },
      onkeydown: e => { if (e.key === 'Enter') openP(p.id); } }, av(p),
      h('div', { class: 'socl-rt' },
        h('div', { class: 'socl-r1' }, h('b', {}, p.name), p.close ? h('i', { class: 'socl-star', html: IC.star, title: T('Toujours me prévenir', 'Always notify me') }) : null, h('span', { class: 'socl-rtime' }, isL ? [h('i', { class: 'socl-ico', html: IC.clock }), (p.back.day ? X(DAYS(p.back.day)) + ' ' : '') + tm(p.back.min)] : tm(p.at))),
        isL ? null : h('div', { class: 'socl-r2' }, p.remind ? h('span', { class: 'socl-rem' }, T('Rappel', 'Reminder') + ' · ') : null, lastSnip(p)),
        isW ? h('div', { class: 'socl-r3' }, pn(p) + ' · ' + T('depuis ', 'for ') + dur(NOW - p.at)) : isL ? h('div', { class: 'socl-r3' }, T('Revient ', 'Back ') + backTxt(p.back)) : null),
      isW && p.unread ? h('span', { class: 'socl-cnt' }, String(p.unread)) : null,
      isW ? h('div', { class: 'socl-ra' }, btn('socl-ib', IC.clock, T('Plus tard', 'Later'), e => laterMenu(e.currentTarget, p)), btn('socl-ib', IC.check, T('Fait', 'Done'), () => doneP(p))) : null,
      isL ? h('div', { class: 'socl-ra' }, btn('socl-ib', IC.bell, T('Simuler l’heure dite', 'Simulate the set time'), () => backP(p))) : null);
    void a; return r;
  }
  function peopleList() {
    const s = d.q.trim().toLowerCase(), f = p => !s || p.name.toLowerCase().includes(s), out = [];
    d.digests.forEach(g => out.push(h('div', { class: 'socl-row dg' + (d.cur && d.cur.k === 'd' ? ' on' : ''), role: 'button', tabindex: '0', onclick: () => { d.cur = { k: 'd', id: g.id }; sfx.tick(); repaint(); }, onkeydown: e => e.key === 'Enter' && (d.cur = { k: 'd', id: g.id }, repaint()) },
      h('span', { class: 'socl-dgi', html: IC.bell }), h('div', { class: 'socl-rt' }, h('div', { class: 'socl-r1' }, h('b', {}, T(`Résumé de ${hr(g.hh)}`, `${hr(g.hh)} summary`))), h('div', { class: 'socl-r2' }, T(`${g.total} messages de ${g.lines.length} personnes`, `${g.total} messages from ${g.lines.length} people`))))));
    const w = waiting().filter(f), l = d.people.filter(p => p.st === 'later' && f(p)), rc = d.people.filter(p => p.st === 'recent' && f(p)).sort((a, b) => b.at - a.at);
    out.push(head(T('Vous attendent', 'Waiting for you'), w.length));
    if (w.length) w.forEach(p => out.push(row(p))); else out.push(h('div', { class: 'socl-calm' }, h('b', {}, T('Tout est calme.', 'All is calm.')), h('span', {}, T('Personne ne vous attend.', 'No one is waiting for you.'))));
    if (l.length) { out.push(head(T('Plus tard', 'Later'))); l.forEach(p => out.push(row(p))); }
    if (rc.length) { out.push(head(T('Récemment', 'Recent'))); rc.forEach(p => out.push(row(p))); }
    return out;
  }
  function svcList() {
    const s = d.q.trim().toLowerCase(), as = d.accts.filter(a => !s || aname(a).toLowerCase().includes(s)), tot = d.accts.reduce((n, a) => n + mem(a), 0), on = d.accts.filter(a => a.on).length, mx = Math.max(...d.accts.map(a => SV[a.svc].mem + 60));
    const out = [h('div', { class: 'socl-memh' }, h('div', {}, h('b', {}, T('Mémoire utilisée', 'Memory used')), h('span', {}, T(`${on} actifs sur ${d.accts.length}`, `${on} active of ${d.accts.length}`))), h('strong', {}, fmem(tot))),
      h('button', { class: 'mlkx-btn sm socl-sleepall', onclick: sleepIdle }, T('Mettre les services inactifs en veille', 'Put idle services to sleep')), head(T('Comptes', 'Accounts'), as.length)];
    if (!as.length) out.push(h('div', { class: 'socl-calm' }, h('span', {}, T('Aucun service ajouté.', 'No services added.'))));
    as.forEach(a => {
      const cur = d.cur && d.cur.k === 'a' && d.cur.id === a.id;
      out.push(h('div', { class: 'socl-row sv' + (cur ? ' on' : '') + (a.on ? '' : ' zz'), role: 'button', tabindex: '0', onclick: () => { d.cur = { k: 'a', id: a.id }; if (!a.on) wake(a); sfx.tick(); repaint(); }, onkeydown: e => e.key === 'Enter' && e.currentTarget.click(),
        oncontextmenu: e => { e.preventDefault(); macMenu({ x: e.clientX, y: e.clientY }, [{ label: a.on ? T('Mettre en veille', 'Put to sleep') : T('Réveiller', 'Wake up'), fn: () => { a.on ? sleepAcct(a) : wake(a); repaint(); } }, { sep: 1 }, { label: T('Supprimer…', 'Remove…'), danger: true, fn: () => askRemove(a) }]); } },
        pill(a.svc, 'lg'), h('div', { class: 'socl-rt' }, h('div', { class: 'socl-r1' }, h('b', {}, SV[a.svc].n), a.label ? h('span', { class: 'socl-lab' }, X(a.label)) : null),
          h('div', { class: 'socl-r3' }, a.on ? fmem(mem(a)) : T('En veille', 'Asleep')), h('div', { class: 'socl-bar' }, h('i', { style: { width: (a.on ? mem(a) / mx * 100 : 0) + '%' } }))),
        h('div', { class: 'socl-ra' }, btn('socl-ib', IC.moon, a.on ? T('Mettre en veille', 'Put to sleep') : T('Réveiller', 'Wake up'), () => { a.on ? sleepAcct(a) : wake(a); repaint(); }))));
    });
    return out;
  }
  function drawList() { const sc = list.scrollTop; list.replaceChildren(...(d.view === 'people' ? peopleList() : svcList())); list.scrollTop = sc; }
  function drawStrip() {
    strip.replaceChildren(h('div', { class: 'socl-eb' }, h('span', {}, T('Services', 'Services'))), h('div', { class: 'socl-dots' },
      ...d.accts.map(a => { const un = d.people.filter(p => p.acct === a.id && p.st === 'wait').reduce((n, p) => n + p.unread, 0);
        return h('button', { class: 'socl-dot' + (a.on ? '' : ' zz') + (d.cur && d.cur.k === 'a' && d.cur.id === a.id ? ' on' : ''), title: aname(a) + (a.on ? '' : ' · ' + T('En veille', 'Asleep')), 'aria-label': aname(a), onclick: () => { d.cur = { k: 'a', id: a.id }; if (!a.on) wake(a); sfx.tick(); repaint(); } }, pill(a.svc, 'lg'), un ? h('i', { class: 'socl-red' }) : null); }),
      h('button', { class: 'socl-dot add', title: T('Ajouter un service', 'Add a service'), 'aria-label': T('Ajouter un service', 'Add a service'), html: IC.plus, onclick: () => openOv('add') })));
  }

  /* ---------- zone principale ---------- */
  let inp = null;
  function drawMain() {
    const had = inp && document.activeElement === inp; if (inp) d.draft[d.cur && d.cur.id] = inp.value; inp = null;
    const c = d.cur, p = c && c.k === 'p' ? person(c.id) : null, a = p ? acct(p.acct) : c && c.k === 'a' ? acct(c.id) : null;
    main.replaceChildren();
    const tbar = h('div', { class: 'socl-tb' });
    const chip = p ? h('div', { class: 'socl-chip' }, av(p), h('div', {}, h('b', {}, p.name), h('span', {}, pn(p) + ' · ' + tm(p.at)))) : a ? h('div', { class: 'socl-chip' }, pill(a.svc, 'lg'), h('div', {}, h('b', {}, SV[a.svc].n), h('span', {}, a.label ? X(a.label) : T('Session isolée', 'Isolated session')))) : c && c.k === 'd' ? h('div', { class: 'socl-chip' }, h('span', { class: 'socl-dgi', html: IC.bell }), h('div', {}, h('b', {}, T(`Résumé de ${hr(d.digests[0].hh)}`, `${hr(d.digests[0].hh)} summary`)))) : h('div', { class: 'socl-chip nm', html: bhtml(ID, ID, BRAND) });
    const cap = h('div', { class: 'socl-cap' }, h('button', { disabled: !(p && p.st === 'wait'), onclick: e => laterMenu(e.currentTarget, p) }, h('i', { html: IC.clock }), T('Plus tard', 'Later')), h('button', { disabled: !(p && p.st === 'wait'), onclick: () => doneP(p) }, h('i', { html: IC.check }), T('Fait', 'Done')));
    tbar.append(chip, cap, h('div', { class: 'socl-tbr' },
      btn('socl-tbb' + (d.dnd ? ' on' : ''), IC.moon, T('Ne pas déranger', 'Do Not Disturb'), () => { d.dnd = !d.dnd; sfx.tick(); repaint(); }),
      btn('socl-tbb', IC.gear, T('Réglages', 'Settings'), () => openOv('calm'))));
    const body = h('div', { class: 'socl-body' });
    if (a && !a.on) body.append(h('div', { class: 'socl-plate' }, pill(a.svc, 'xl'), h('b', {}, T('En veille', 'Asleep')), h('span', {}, T('Ce service ne consomme plus de mémoire. Il se recharge au clic, session conservée.', 'This service uses no memory. It reloads on click, session kept.')), h('button', { class: 'mlkx-btn pri', onclick: () => wake(a) }, T('Réveiller', 'Wake up'))));
    else if (a && d.loading === a.id) body.append(h('div', { class: 'socl-plate' }, pill(a.svc, 'xl'), h('i', { class: 'socl-spin', html: IC.spin }), h('span', {}, T('Chargement de ' + SV[a.svc].n + '…', 'Loading ' + SV[a.svc].n + '…'))));
    else if (p) body.append(chat(p, a));
    else if (a) body.append(inbox(a));
    else if (c && c.k === 'd') body.append(digest(d.digests[0]));
    else body.append(welcome());
    main.append(tbar, body);
    if (p && inp) { inp.value = d.draft[p.id] || ''; if (had) inp.focus({ preventScroll: true }); }
    const ms = main.querySelector('.socl-msgs'); if (ms) ms.scrollTop = ms.scrollHeight;
  }
  function chat(p, a) {
    const msgs = h('div', { class: 'socl-msgs' }, h('div', { class: 'socl-day' }, T('Aujourd’hui', 'Today')));
    p.msgs.forEach(m => msgs.append(h('div', { class: 'socl-m' + (m.me ? ' me' : '') }, h('div', { class: 'socl-bub', style: m.me ? { background: SV[a.svc].c } : null }, m.raw || X(m.t)), h('span', {}, tm(m.at)))));
    inp = h('input', { class: 'mlkx-field socl-in', type: 'text', placeholder: T('Entrez un message', 'Type a message'), 'aria-label': T('Entrez un message', 'Type a message') });
    const send = () => { const v = inp.value.trim(); if (!v) return; p.msgs.push({ me: 1, raw: v, at: NOW }); p.snip = [v, v]; d.draft[p.id] = ''; inp.value = ''; if (p.st === 'recent') p.at = NOW; sfx.tick(); repaint(); inp && inp.focus({ preventScroll: true }); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    return h('div', { class: 'socl-chat' }, h('div', { class: 'socl-svh', style: { '--sc': SV[a.svc].c } }, pill(a.svc), h('b', {}, aname(a)), h('span', {}, T('session isolée', 'isolated session'))), msgs,
      h('div', { class: 'socl-compose' }, inp, h('button', { class: 'mlkx-btn pri ico', html: IC.send, 'aria-label': T('Envoyer', 'Send'), onclick: send })));
  }
  function inbox(a) {
    const ps = d.people.filter(p => p.acct === a.id).sort((x, y) => y.at - x.at);
    return h('div', { class: 'socl-inbox' }, h('div', { class: 'socl-svh', style: { '--sc': SV[a.svc].c } }, pill(a.svc), h('b', {}, aname(a)), h('span', {}, T('session isolée', 'isolated session'))),
      h('div', { class: 'socl-ib2' }, ps.length ? ps.map(p => h('button', { class: 'socl-ir', onclick: () => openP(p.id) }, av(p), h('div', { class: 'socl-rt' }, h('div', { class: 'socl-r1' }, h('b', {}, p.name), h('span', { class: 'socl-rtime' }, tm(p.at))), h('div', { class: 'socl-r2' }, lastSnip(p))), p.st === 'wait' && p.unread ? h('span', { class: 'socl-cnt' }, String(p.unread)) : null))
        : h('div', { class: 'socl-calm' }, h('span', {}, T('Aucune conversation pour l’instant.', 'No conversation yet.')))));
  }
  function digest(g) {
    return h('div', { class: 'socl-digest' }, h('h3', { class: 'mlkx-heading' }, T(`Résumé de ${hr(g.hh)}`, `${hr(g.hh)} summary`)), h('p', { class: 'mlkx-muted' }, T(`${g.total} messages de ${g.lines.length} personnes`, `${g.total} messages from ${g.lines.length} people`)),
      h('div', { class: 'socl-dl' }, g.lines.map(l => { const p = person(l.p); return h('button', { class: 'socl-ir', onclick: () => openP(p.id) }, av(p), h('div', { class: 'socl-rt' }, h('div', { class: 'socl-r1' }, h('b', {}, p.name)), h('div', { class: 'socl-r2 wrap' }, X(l.t))), l.n > 1 ? h('span', { class: 'socl-cnt' }, String(l.n)) : null); })),
      h('div', { class: 'socl-dfoot' }, h('i', { html: IC.lock }), h('span', {}, T('Rédigé sur votre Mac', 'Written on your Mac')), h('button', { class: 'mlkx-btn sm', onclick: () => { g.lines.forEach(l => person(l.p).st === 'wait' && doneP(person(l.p))); d.digests = d.digests.filter(x => x !== g); d.cur = null; repaint(); } }, T('Tout ranger', 'Clear all'))));
  }
  function welcome() {
    const n = waiting().length;
    return h('div', { class: 'socl-plate wlc' }, h('img', { src: appIcon(ID), alt: '', class: 'socl-wi' }), h('h3', { class: 'socl-wt', html: T('Les gens d’abord.', 'People first.') }),
      h('span', { html: n ? bhtml(T(`${n} personnes vous attendent.`, `${n} people are waiting for you.`), ID, BRAND) : T('Personne ne vous attend.', 'No one is waiting for you.') }),
      h('span', { class: 'mlkx-sub', html: bhtml(T('Chaque message reçu fait apparaître son auteur dans la barre latérale, quel que soit le service. Un clic ouvre la conversation.', 'Each message received shows its author in the sidebar, whatever the service. One click opens the conversation.'), ID, BRAND) }),
      h('button', { class: 'mlkx-btn', onclick: () => openOv('add') }, T('Ajouter un service', 'Add a service')));
  }

  /* ---------- feuilles : Calme, Équilibre, ajout ---------- */
  function askRemove(a) {
    sheet(root, { title: T(`Supprimer « ${aname(a)} » ?`, `Remove “${aname(a)}”?`), text: T('La session, les cookies et les données de ce compte seront effacés de ce Mac. Rien n’est supprimé sur le service lui-même.', 'The session, cookies and data of this account will be cleared from this Mac. Nothing is deleted on the service itself.'),
      buttons: [{ label: T('Annuler', 'Cancel') }, { label: T('Supprimer', 'Remove'), kind: 'tdg', fn: () => { d.accts = d.accts.filter(x => x !== a); d.people = d.people.filter(p => p.acct !== a.id); if (d.cur && ((d.cur.k === 'a' && d.cur.id === a.id) || (d.cur.k === 'p' && !person(d.cur.id)))) d.cur = null; sfx.pop(); repaint(); } }] });
  }
  let add = null;
  function openOv(k, tab) { if (k === 'add') add = { cat: 'all', q: '', sel: null, label: '' }; d.ov = k; if (tab) d.tab = tab; else if (k === 'calm') d.tab = 'calm'; sfx.click(); drawOv(); }
  function closeOv() { d.ov = null; drawOv(); main.focus && root.focus({ preventScroll: true }); }
  let ovScroll = 0;
  function drawOv() {
    const keep = ovl.querySelector('.socl-pbody'); if (keep) ovScroll = keep.scrollTop; ovl.replaceChildren(); if (!d.ov) return;
    const scrim = h('div', { class: 'mlkx-scrim socl-scrim', onclick: e => { if (e.target === scrim) closeOv(); }, onkeydown: e => { if (e.key === 'Escape') { e.stopPropagation(); closeOv(); } } });
    const panel = h('div', { class: 'socl-panel', role: 'dialog', 'aria-label': d.ov === 'add' ? T('Ajouter un service', 'Add a service') : T('Réglages', 'Settings') });
    const body = h('div', { class: 'socl-pbody' });
    body.append(...(d.ov === 'add' ? addBody() : setBody()).filter(Boolean));
    const foot = h('div', { class: 'socl-pfoot' }, ...(d.ov === 'add' ? addFoot() : [h('button', { class: 'mlkx-btn pri', onclick: closeOv }, T('Terminé', 'Done'))]));
    panel.append(...(d.ov === 'add' ? [] : [h('div', { class: 'mlkx-seg socl-tabs' }, [['calm', T('Le calme', 'Calm')], ['bal', T('Équilibre', 'Balance')]].map(([k, l]) => h('button', { 'aria-pressed': String(d.tab === k), onclick: () => { d.tab = k; ovScroll = 0; sfx.tick(); drawOv(); } }, l)))]), body, foot);
    if (d.ov === 'add') panel.prepend(h('h3', { class: 'mlkx-heading' }, T('Ajouter un service', 'Add a service')), h('p', { class: 'mlkx-muted socl-ps' }, T('Chaque compte garde sa propre session, séparée des autres. Ajoutez-en autant que vous voulez.', 'Each account keeps its own session, separate from the others. Add as many as you like.'))), panel.insertBefore(body, foot);
    scrim.append(panel); ovl.append(scrim); body.scrollTop = ovScroll; (panel.querySelector('input') || panel.querySelector('.mlkx-btn.pri')).focus({ preventScroll: true });
  }
  function setBody() {
    if (d.tab === 'bal') {
      const tot = d.accts.reduce((n, a) => n + mem(a), 0);
      return [h('h3', { class: 'mlkx-heading' }, T('Équilibre', 'Balance')), h('p', { class: 'mlkx-muted socl-ps' }, T('Un service en veille ne consomme plus de mémoire. Il se recharge au clic, session conservée.', 'A sleeping service uses no memory. It reloads on click, session kept.')),
        h('div', { class: 'socl-box' }, h('div', { class: 'socl-fr' }, h('div', {}, h('b', {}, T('Mettre en veille les services inactifs', 'Put idle services to sleep')), h('small', {}, T('Après un délai sans activité', 'After a period without activity'))), toggle(d.sleepIdle, v => { d.sleepIdle = v; sfx.tick(); drawOv(); }, T('Mettre en veille les services inactifs', 'Put idle services to sleep'))),
          h('div', { class: 'socl-fr' }, h('b', {}, T('Délai', 'Delay')), h('div', { class: 'mlkx-seg' }, [5, 15, 30, 60].map(m => h('button', { 'aria-pressed': String(d.delay === m), disabled: !d.sleepIdle, onclick: () => { d.delay = m; sfx.tick(); drawOv(); } }, m + ' min'))))),
        h('div', { class: 'socl-eb' }, h('span', {}, T('Mémoire utilisée', 'Memory used')), h('em', {}, fmem(tot))),
        h('div', { class: 'socl-box' }, d.accts.map(a => h('div', { class: 'socl-fr' }, h('div', { class: 'socl-fl' }, pill(a.svc), h('b', {}, aname(a))), h('span', { class: 'mlkx-sub socl-num' }, a.on ? fmem(mem(a)) : T('En veille', 'Asleep'))))),
        h('button', { class: 'mlkx-btn', onclick: () => { sleepIdle(); drawOv(); } }, T('Mettre les services inactifs en veille', 'Put idle services to sleep'))];
    }
    const heldN = d.held.length, heldP = new Set(d.held.map(x => x.p)).size, svcs = [...new Set(d.accts.map(a => a.svc))];
    return [h('h3', { class: 'mlkx-heading' }, T('Le calme', 'Calm')), h('p', { class: 'mlkx-muted socl-ps' }, T('Choisissez quand les messages vous parviennent. Vos proches passent toujours.', 'Choose when messages reach you. Your close contacts always get through.')),
      h('div', { class: 'mlkx-seg socl-mode' }, [['now', T('Tout de suite', 'Right away')], ['moments', T('Par moments', 'At set times')]].map(([k, l]) => h('button', { 'aria-pressed': String(d.mode === k), onclick: () => { d.mode = k; sfx.tick(); drawOv(); } }, l))),
      d.mode === 'moments' ? h('div', { class: 'socl-sec' }, h('div', { class: 'socl-eb' }, h('span', {}, T('Moments', 'Times'))),
        h('div', { class: 'socl-chips' }, [...d.moments].sort((a, b) => a - b).map(m => h('span', { class: 'socl-mc' }, tm(m * 60), d.moments.length > 1 ? h('button', { 'aria-label': T('Retirer', 'Remove') + ' ' + tm(m * 60), html: IC.x, onclick: () => { d.moments = d.moments.filter(x => x !== m); sfx.tick(); drawOv(); } }) : null)),
          d.moments.length < 6 ? h('button', { class: 'socl-mc add', onclick: e => macMenu(e.currentTarget, [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].filter(x => !d.moments.includes(x)).map(x => ({ label: tm(x * 60), fn: () => { d.moments.push(x); drawOv(); } })), { align: 'left' }) }, h('i', { html: IC.plus }), T('Ajouter', 'Add')) : null),
        h('p', { class: 'mlkx-sub socl-hint' }, T('Entre deux moments, rien ne sonne : un résumé arrive à l’heure dite.', 'Between two times, nothing rings: a summary arrives at the set time.')),
        h('div', { class: 'socl-held' }, h('div', {}, h('b', {}, T('Prochain résumé', 'Next summary') + ' : ' + tm(nextMoment() * 60)), h('small', {}, heldN ? T(`${heldN} messages de ${heldP} personnes mis de côté`, `${heldN} messages from ${heldP} people set aside`) : T('Rien de mis de côté pour l’instant.', 'Nothing set aside yet.'))),
          h('button', { class: 'mlkx-btn sm', disabled: !heldN, onclick: () => { deliver(); closeOv(); } }, T('Voir maintenant', 'See now')))) : null,
      h('div', { class: 'socl-sec' }, h('div', { class: 'socl-eb' }, h('span', {}, T('Toujours me prévenir', 'Always notify me'))),
        h('div', { class: 'socl-close' }, d.people.filter(p => p.close).map(p => h('button', { class: 'socl-cl', title: T('Retirer', 'Remove') + ' ' + p.name, onclick: () => { p.close = false; sfx.tick(); drawOv(); } }, av(p, true), h('span', {}, p.name.split(' ')[0]))),
          h('button', { class: 'socl-cl add', onclick: e => macMenu(e.currentTarget, d.people.filter(p => !p.close).map(p => ({ label: p.name, fn: () => { p.close = true; sfx.tick(); drawOv(); } })), { align: 'left' }) }, h('span', { class: 'socl-av big plus', html: IC.plus }), h('span', {}, T('Ajouter', 'Add')))),
        h('p', { class: 'mlkx-sub socl-hint' }, T('Vos proches passent tout de suite, même par moments et pendant une concentration.', 'Your close contacts get through right away, even at set times and during a Focus.'))),
      h('div', { class: 'socl-sec' }, h('div', { class: 'socl-eb' }, h('span', {}, T('Par service', 'Per service'))),
        h('div', { class: 'socl-box' }, svcs.map(s => h('div', { class: 'socl-fr' }, h('div', { class: 'socl-fl' }, pill(s), h('b', {}, SV[s].n)), selBtn(ruleName(d.rules[s] || 'rest'), b => macMenu(b, ['rest', 'now', 'work', 'moments', 'silent'].map(r => ({ label: ruleName(r), check: (d.rules[s] || 'rest') === r, fn: () => { d.rules[s] = r; drawOv(); } })), { align: 'left' })))),
          h('div', { class: 'socl-fr' }, h('div', {}, h('b', {}, T('Suivre la concentration du Mac', 'Follow the Mac Focus')), h('small', {}, T('Pendant « Travail », seuls vos proches passent.', 'During “Work”, only your close contacts get through.'))), toggle(d.focus, v => { d.focus = v; sfx.tick(); drawOv(); }, T('Suivre la concentration du Mac', 'Follow the Mac Focus'))))),
      h('div', { class: 'socl-try' }, h('span', { class: 'mlkx-sub' }, T('Essai : voir comment un message est traité avec ces réglages.', 'Try it: see how a message is handled with these settings.')), h('button', { class: 'mlkx-btn sm', onclick: () => { receive(); drawOv(); } }, T('Recevoir un message', 'Receive a message')))];
  }
  function addBody() {
    const grid = h('div', { class: 'socl-grid', role: 'listbox' }), tabs = h('div', { class: 'mlkx-seg socl-cats' }), ql = h('input', { class: 'mlkx-field', type: 'search', placeholder: T('Rechercher un service', 'Search for a service'), 'aria-label': T('Rechercher un service', 'Search for a service'), value: add.q });
    const label = h('input', { class: 'mlkx-field', type: 'text', placeholder: T('Perso', 'Personal'), 'aria-label': T('Libellé du compte', 'Account label'), value: add.label, disabled: !add.sel }); label.addEventListener('input', () => { add.label = label.value; });
    const fg = () => { const s = add.q.trim().toLowerCase(); return Object.entries(SV).filter(([, v]) => (add.cat === 'all' || v.cat === add.cat) && (!s || v.n.toLowerCase().includes(s))); };
    const dg = () => { grid.replaceChildren(...(fg().map(([k, v]) => h('button', { class: 'socl-gi' + (add.sel === k ? ' on' : ''), role: 'option', 'aria-selected': String(add.sel === k), onclick: () => { add.sel = k; sfx.tick(); label.disabled = false; dg(); updFoot(); } }, pill(k, 'lg'), h('span', {}, v.n))) || []));
      if (!fg().length) grid.append(h('div', { class: 'socl-calm' }, h('span', {}, T('Aucun résultat', 'No results')))); };
    const dt = () => tabs.replaceChildren(...CATS().map(([k, l]) => h('button', { 'aria-pressed': String(add.cat === k), onclick: () => { add.cat = k; dt(); dg(); } }, l)));
    ql.addEventListener('input', () => { add.q = ql.value; dg(); }); dt(); dg();
    return [ql, tabs, grid, h('div', { class: 'socl-lbl' }, h('b', {}, T('Libellé du compte', 'Account label')), label, h('small', { class: 'mlkx-sub' }, T('Facultatif. Utile pour distinguer deux comptes du même service.', 'Optional. Helps tell two accounts of the same service apart.')))];
  }
  let addBtn = null; const updFoot = () => { if (addBtn) { addBtn.disabled = !add.sel; addBtn.textContent = add.sel ? T('Ajouter ' + SV[add.sel].n, 'Add ' + SV[add.sel].n) : T('Ajouter', 'Add'); } };
  function addFoot() {
    addBtn = h('button', { class: 'mlkx-btn pri', disabled: true, onclick: () => { if (!add.sel) return; const a = { id: uid('a'), svc: add.sel, label: add.label.trim(), on: true, jit: 15 }; d.accts.push(a); d.cur = { k: 'a', id: a.id }; d.loading = a.id; setTimeout(() => { if (d.loading === a.id) d.loading = null; repaint(); }, reduced() ? 0 : 900); d.ov = null; sfx.done(); repaint(); } }, T('Ajouter', 'Add')); updFoot();
    return [h('button', { class: 'mlkx-btn', onclick: closeOv }, T('Annuler', 'Cancel')), addBtn];
  }

  w.view = { paint: () => { drawSeg(); drawList(); drawStrip(); drawMain(); if (d.ov !== 'add') drawOv(); } }; w.view.paint.w = w; views.add(w.view);
  w.openOv = openOv;
  drawSeg(); drawList(); drawStrip(); drawMain(); drawOv();
  return root;
}

/* ====================================================================== barre des menus et cycle de vie ====================================================================== */
const mainWin = () => wm.wins.get('app:' + ID);
function menuItems(app) {
  const n = waiting().length;
  return [{ label: T('Ouvrir ' + ID, 'Open ' + ID), fn: () => openMain(app) }, { sep: 1 }, { label: n ? T(`${n} personnes vous attendent`, `${n} people are waiting`) : T('Personne ne vous attend', 'No one is waiting'), disabled: true },
    { label: T('Mettre les services inactifs en veille', 'Put idle services to sleep'), fn: () => sleepIdle() }, { label: T('Recevoir un message (démonstration)', 'Receive a message (demo)'), fn: () => receive() },
    { label: T('Réglages…', 'Settings…'), fn: () => { openMain(app); setTimeout(() => { const w = mainWin(); w && w.openOv && w.openOv('calm'); }, 60); } },
    { label: T('À propos de ' + ID, 'About ' + ID), fn: () => aboutWin(app, { brandColor: BRAND, tagline: () => T('Toutes vos messageries et réseaux sociaux dans une seule fenêtre : une session isolée par compte, les gens d’abord, le calme.', 'All your messaging apps and social networks in a single window: one isolated session per account, people first, calm.'), credit: () => T('Inspiré de Franz, sans lien avec ses auteurs.', 'Inspired by Franz, with no connection to its authors.') }) },
    { sep: 1 }, { label: T('Quitter ' + ID, 'Quit ' + ID), fn: () => quit() }];
}
function quit() { closeMenus(); [...wm.wins.values()].filter(w => w.appId === ID).forEach(w => wm.close(w.id)); extra = null; running = false; D = null; S.extras.delete(ID); emit('extras'); sfx.close(); }
function install(app) {
  running = true; extra = h('button', { class: 'mb extra', 'aria-label': ID, title: ID }, h('img', { class: 'xicon', src: appIcon(ID), alt: '' }));
  extra.addEventListener('click', () => (menuOpenFor(extra) ? closeMenus() : macMenu(extra, menuItems(app))));
  extra.addEventListener('contextmenu', e => { e.preventDefault(); macMenu(extra, menuItems(app)); });
  S.extras.set(ID, { el: extra, quit }); emit('extras');
}
export async function open(app) {
  await cssReady(CSS2); data();
  if (!running) install(app);
  openMain(app);
}
