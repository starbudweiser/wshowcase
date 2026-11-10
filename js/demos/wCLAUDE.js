/* wCLAUDE : un navigateur que n'importe quel agent IA compatible MCP pilote. Démo : le navigateur (onglets, barre d'adresse, iPhone, Trousseau, Téléchargements, relais humain) sur des sites fictifs,
   et un agent qui s'en sert avec les vrais outils browser_*. Rien n'est envoyé : tout est joué dans la page. */
import { dlBtn, toast, icon, h, brand, esc, wait, reduced, clamp, sfx, wm, T, css, stream } from './kit.js';
import { lang } from '../i18n.js';

const BRAND = '#d97757'; /* couleur argile du « w », relevée sur le logo */
const AGENT = 'Claude Code';
const bt = s => esc(s).split('wCLAUDE').join(brand('wCLAUDE', BRAND)); /* nom de l'appli coloré dans un texte */
const loadCss = u => new Promise(res => { css(u); const l = document.querySelector(`link[data-k="${u}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res); l.addEventListener('error', res); setTimeout(res, 4000); });
const price = p => (lang() === 'fr' ? p + ' €' : '$' + p);

const IC = {
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', fwd: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', reload: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>', key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  down: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>'
};
const svg = k => { const t = document.createElement('template'); t.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`; return t.content.firstChild; };

/* ---------- sites fictifs ---------- */
const PROD = [
  { id: 'k2', n: 'Keyboard K2', p: 79, mech: true, s: ['75 %', 'Hot-swap', ['Switches linéaires', 'Linear switches']] }, { id: 'pro65', n: 'Keyboard Pro 65', p: 94, mech: true, s: ['65 %', 'USB-C', ['Switches tactiles', 'Tactile switches']] },
  { id: 'gamer', n: 'Gamer RGB 104', p: 119, mech: true, s: ['100 %', 'RGB', ['Switches clic', 'Clicky switches']] }, { id: 'tkl', n: 'Keyboard TKL Wireless', p: 129, mech: true, s: ['TKL', 'Bluetooth', ['Switches linéaires', 'Linear switches']] },
  { id: 'slim', n: 'Slim Office 100', p: 39, mech: false, s: ['100 %', 'Membrane', 'USB'] }
];
const HOST = u => u.split('/')[0];
const SITES = { 'clavier.example': ['C', '#d97757'], 'partage.example': ['P', '#4a8ad8'], 'reseau.example': ['R', '#b5527f'] };
function parse(raw) {
  let u = raw.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!u) return null;
  if (!u.split('/')[0].includes('.')) return { url: 'clavier.example/recherche?q=' + encodeURIComponent(raw.trim()), page: 'results', title: T('Résultats', 'Results') + ' · Clavier&Co', st: { q: raw.trim() } };
  const [host, ...rest] = u.split('/'), path = rest.join('/');
  if (host === 'clavier.example') {
    if (!path) return { url: u, page: 'shop', title: 'Clavier&Co', st: {} };
    if (path.startsWith('recherche')) { const q = decodeURIComponent((path.split('q=')[1] || '').replace(/\+/g, ' ')); return { url: u, page: 'results', title: T('Résultats', 'Results') + ' · Clavier&Co', st: { q } }; }
    const pr = PROD.find(x => path === x.id || path === 'produit/' + x.id); if (pr) return { url: 'clavier.example/' + pr.id, page: 'product', title: pr.n, st: { id: pr.id } };
    if (path.startsWith('compte')) return { url: u, page: 'login', title: T('Connexion', 'Sign in') + ' · Clavier&Co', st: { step: 'form' } };
    if (path.startsWith('commandes')) return { url: u, page: 'orders', title: T('Mes commandes', 'My orders'), st: {} };
  }
  if (host === 'partage.example') return { url: u, page: 'upload', title: T('Partage de fichiers', 'File sharing'), st: { file: null, prog: 0, sent: false } };
  if (host === 'reseau.example') return { url: 'reseau.example/@stephan', page: 'profile', title: '@stephan', st: {} };
  return { url: u, page: 'nf', title: T('Page introuvable', 'Page not found'), st: {} };
}

export async function open(app) {
  await loadCss('css/demos/wCLAUDE.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 680, y: 96, minw: 880, minh: 520, bare: true, cls: 'socle wclaude',
    onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => { const mk = () => make(app, w); w.redraw = () => { w.stop && w.stop(); w.body.replaceChildren(mk()); }; return mk(); } });
}

function make(app, w) {
  const life = { dead: false }; let bubbleTimer = 0; const timers = new Set();
  w.stop = () => { life.dead = true; clearTimeout(bubbleTimer); timers.forEach(clearTimeout); A.cancel = true; if (B.handoff) B.handoff.resolve('cancel'); };
  const alive = () => !life.dead && !w.dead;
  const after = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); return t; };
  const B = { tabs: [], active: 0, next: 1, mobile: new Set(), downloads: [], logged: false, agent: null, handoff: null, pop: null, editing: false };
  const A = { run: false, cancel: false, task: 'a', n: 0, total: 1, tabId: 0 };
  const root = h('div', { class: 'wc-root' });
  const mkTab = (raw) => { const e = raw ? parse(raw) : { url: '', page: 'new', title: '', st: {} }; return { id: B.next++, hist: [e], i: 0, loading: false }; };
  B.tabs.push(mkTab()); B.active = B.tabs[0].id;
  const tab = () => B.tabs.find(t => t.id === B.active) || B.tabs[0];
  const entry = () => tab().hist[tab().i];
  const siteOf = e => HOST(e.url || '');
  const isMobile = () => B.mobile.has(siteOf(entry()));

  /* ---------- chrome : onglets, navigation, relais humain ---------- */
  const tabsEl = h('div', { class: 'wc-tabs', 'data-drag': '' }), tl = h('div', { class: 'wc-tl', role: 'tablist' }), newB = h('button', { class: 'wc-ib', 'aria-label': T('Nouvel onglet', 'New tab'), title: T('Nouvel onglet', 'New tab'), onclick: () => newTab() }, svg('plus'));
  const bubSlot = h('div', { class: 'wc-bubs', style: { display: 'contents' } });
  tabsEl.append(wm.lights(w), tl, newB, h('div', { class: 'wc-sp' }), bubSlot);
  const back = h('button', { class: 'wc-ib', 'aria-label': T('Page précédente', 'Back'), title: T('Page précédente', 'Back'), onclick: () => hist(-1) }, svg('back')), fwd = h('button', { class: 'wc-ib', 'aria-label': T('Page suivante', 'Forward'), title: T('Page suivante', 'Forward'), onclick: () => hist(1) }, svg('fwd'));
  const reload = h('button', { class: 'wc-ib', onclick: () => { if (tab().loading) { tab().loading = false; drawNav(); } else go(entry().url || '', { reload: true }); } });
  const addr = h('input', { class: 'wc-addr', type: 'text', spellcheck: 'false', autocomplete: 'off', placeholder: T('Saisissez une adresse ou une recherche', 'Enter an address or a search'), 'aria-label': T('Adresse', 'Address'),
    onfocus: () => { B.editing = true; setTimeout(() => addr.select(), 0); }, onblur: () => { B.editing = false; drawNav(); },
    onkeydown: e => { if (e.key === 'Enter') { const v = addr.value; B.editing = false; addr.blur(); if (v.trim()) go(v); } else if (e.key === 'Escape') { B.editing = false; drawNav(); addr.blur(); } } });
  const mobB = h('button', { class: 'wc-nb', onclick: () => toggleMobile() }, svg('phone'), h('span', { class: 'lb' }, T('iPhone', 'iPhone')));
  const kcB = h('button', { class: 'wc-nb', title: T('Remplir l’identifiant de ce site depuis le Trousseau', 'Fill in this site’s sign-in from the Keychain'), onclick: () => userKeychain() }, svg('key'), h('span', { class: 'lb' }, T('Trousseau', 'Keychain')));
  const dlB = h('button', { class: 'wc-nb', onclick: () => { B.pop = B.pop === 'dl' ? null : 'dl'; sfx.tick(); drawPop(); } }, svg('down'), h('span', { class: 'lb' }, T('Téléchargements', 'Downloads')), h('span', { class: 'ct' }));
  const load = h('i', { class: 'wc-load' });
  const nav = h('div', { class: 'wc-nav' }, back, fwd, reload, addr, mobB, kcB, dlB, load);
  const hand = h('section', { class: 'wc-hand', hidden: true });
  const view = h('div', { class: 'wc-view' }), gut = h('aside', { class: 'wc-gut' }, h('b', {}, T('Version iPhone', 'iPhone version')), h('span', {})), cur = h('i', { class: 'wc-cur' }); let page = h('div', { class: 'wc-page' });
  view.append(gut, page, cur);
  const br = h('div', { class: 'wc-br' }, tabsEl, nav, hand, view);

  const hostLabel = () => siteOf(entry());
  function drawTabs() {
    const agTab = B.agent && Date.now() - B.agent.at < 5000 ? B.agent.tab : null;
    tl.replaceChildren(...B.tabs.map(t => { const e = t.hist[t.i], site = SITES[HOST(e.url || '')];
      return h('div', { class: 'wc-tab' + (t.id === B.active ? ' on' : '') + (t.id === agTab ? ' ag' : ''), 'data-nodrag': '', role: 'tab', 'aria-selected': t.id === B.active, tabindex: '0', title: e.title || T('Nouvel onglet', 'New tab'),
        onclick: ev => { if (ev.target.closest('.x')) return; B.active = t.id; sfx.tick(); drawAll(); }, onkeydown: ev => { if (ev.key === 'Enter') { B.active = t.id; drawAll(); } } },
      h('i', { class: 'fv', style: site && t.id !== agTab ? { background: site[1] } : {} }, t.id === agTab ? svg('sparkles') : site ? site[0] : svg('globe')), h('span', { class: 'tt' }, t.loading && !e.title ? T('Chargement…', 'Loading…') : e.title || T('Nouvel onglet', 'New tab')),
      h('button', { class: 'x', 'aria-label': T('Fermer l’onglet', 'Close tab'), title: T('Fermer l’onglet', 'Close tab'), onclick: () => closeTab(t.id) }, svg('x'))); }));
    newB.disabled = B.tabs.length >= 6;
  }
  const ACT = { navigate: ['navigation', 'navigation'], read: ['lecture de la page', 'reading the page'], click: ['clic', 'click'], tap: ['appui tactile', 'touch tap'], type: ['saisie', 'typing'], upload: ['envoi de fichiers', 'file upload'], wait: ['attente', 'waiting'], downloads: ['téléchargements', 'downloads'], mobile: ['version iPhone', 'iPhone version'],
    keychain: ['identifiant du Trousseau', 'Keychain sign-in'], tabs: ['onglets', 'tabs'], handoff: ['attente de votre action', 'waiting for you'], screenshot: ['capture d’écran', 'screenshot'] };
  function drawBubble() {
    clearTimeout(bubbleTimer); const a = B.agent, left = a ? 5000 - (Date.now() - a.at) : 0;
    if (left <= 0) { bubSlot.replaceChildren(); return; }
    bubSlot.replaceChildren(h('div', { class: 'wc-bub', role: 'status' }, h('i', {}, svg('sparkles')), h('span', {}, `${AGENT} : ${T(ACT[a.act][0], ACT[a.act][1])}`)));
    bubbleTimer = setTimeout(() => { if (alive()) { drawBubble(); drawTabs(); } }, left + 50);
  }
  function drawNav() {
    const t = tab(), e = entry();
    back.disabled = t.i < 1; fwd.disabled = t.i >= t.hist.length - 1;
    reload.replaceChildren(svg(t.loading ? 'x' : 'reload')); reload.title = t.loading ? T('Arrêter le chargement', 'Stop loading') : T('Recharger la page', 'Reload page'); reload.setAttribute('aria-label', reload.title);
    if (!B.editing) addr.value = e.url ? 'https://' + e.url : '';
    const site = siteOf(e); mobB.classList.toggle('on', isMobile()); mobB.setAttribute('aria-pressed', isMobile()); mobB.disabled = !site;
    mobB.title = site ? (isMobile() ? T(`Revenir à la version ordinateur pour ${site}`, `Back to the desktop version for ${site}`) : T(`Afficher ${site} en version iPhone`, `Show ${site} as the iPhone version`)) : T('Ouvrez d’abord un site.', 'Open a site first.');
    const act = B.downloads.filter(d => d.pct < 100).length; dlB.querySelector('.ct').textContent = B.downloads.length ? (act || B.downloads.length) : ''; dlB.style.color = act ? 'var(--s-ok)' : '';
    load.classList.toggle('go', !!t.loading);
  }
  function drawHand() {
    const o = B.handoff; hand.hidden = !o; if (!o) { hand.replaceChildren(); return; }
    hand.replaceChildren(h('span', { class: 'hi' }, svg('sparkles')), h('div', { class: 'ht' }, h('b', {}, T(`${AGENT} attend votre action`, `${AGENT} is waiting for you`)), h('span', { class: 'rs' }, o.reason)),
      h('button', { class: 'sbtn', onclick: () => o.resolve('cancel') }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn act', onclick: () => o.resolve('done') }, T('C’est fait', 'Done')));
  }
  function drawPop() {
    br.querySelector('.wc-pop') && br.querySelector('.wc-pop').remove(); if (!B.pop) return;
    const p = h('div', { class: 'wc-pop', role: 'dialog' });
    if (B.pop === 'dl') p.append(h('h4', {}, T('Téléchargements', 'Downloads')), ...(B.downloads.length ? B.downloads.map(d => h('div', { class: 'dlr' }, h('b', {}, d.name), h('span', {}, d.pct < 100 ? `${d.pct} %` : T('Terminé', 'Done') + ' · ~/Downloads/wCLAUDE'))) : [h('p', {}, T('Aucun téléchargement pour l’instant.', 'No downloads yet.'))]),
      h('button', { class: 'row', onclick: () => { B.pop = null; drawPop(); toast({ icon: icon(app.id), title: app.id, body: T('Ouvrirait ~/Downloads/wCLAUDE dans le Finder.', 'Would open ~/Downloads/wCLAUDE in the Finder.') }); } }, T('Ouvrir le dossier des téléchargements', 'Open the downloads folder')));
    else if (B.pop === 'kc') p.append(h('h4', {}, T('Quel compte utiliser ?', 'Which account should be used?')), h('button', { class: 'row', onclick: () => { B.pop = null; drawPop(); keychainFill('user'); } }, 'stephan@example.com'), h('p', {}, T('Aucun autre identifiant de clavier.example dans le Trousseau.', 'No other sign-in for clavier.example in the Keychain.')));
    br.append(p);
  }
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && B.pop) { B.pop = null; drawPop(); } });
  br.addEventListener('pointerdown', e => { if (B.pop && !e.target.closest('.wc-pop,.wc-nb')) { B.pop = null; drawPop(); } });

  /* ---------- navigation ---------- */
  async function go(raw, o = {}) {
    const t = tab(), e = parse(raw); if (!e) return;
    if (e.page === 'orders' && !B.logged) { e.page = 'login'; e.url = 'clavier.example/compte'; e.title = T('Connexion', 'Sign in') + ' · Clavier&Co'; e.st = { step: 'form' }; }
    t.loading = true; drawNav(); drawTabs(); sfx.tick(); await wait(reduced() ? 0 : 380); if (!alive() || !t.loading) return;
    t.loading = false; if (o.reload) t.hist[t.i] = { ...e, st: t.hist[t.i].st }; else { t.hist = t.hist.slice(0, t.i + 1); t.hist.push(e); t.i++; }
    drawAll(true);
  }
  function hist(d) { const t = tab(), i = t.i + d; if (i < 0 || i >= t.hist.length) return; t.i = i; sfx.tick(); drawAll(true); }
  function newTab(raw, quiet) { if (B.tabs.length >= 6) return null; const t = mkTab(raw); B.tabs.push(t); B.active = t.id; sfx.pop(); drawAll(true); if (!raw && !quiet) after(() => addr.focus({ preventScroll: true }), 0); return t; }
  function closeTab(id) { const i = B.tabs.findIndex(t => t.id === id); B.tabs.splice(i, 1); if (!B.tabs.length) B.tabs.push(mkTab()); if (B.active === id) B.active = B.tabs[Math.min(i, B.tabs.length - 1)].id; sfx.close(); drawAll(true); }
  function toggleMobile(on) { const s = siteOf(entry()); if (!s) return; const v = on === undefined ? !B.mobile.has(s) : on; v ? B.mobile.add(s) : B.mobile.delete(s); sfx.swap(); drawAll(true); }
  function drawAll(fade) { drawTabs(); drawNav(); drawHand(); drawView(fade); drawBubble(); }

  /* ---------- pages ---------- */
  const kb = (seed = 3) => h('div', { class: 'wc-kb' }, ...Array.from({ length: 30 }, (_, i) => h('i', { class: (i % 11 === 10 ? 'w ' : '') + ((i * seed) % 13 === 0 ? 'a' : '') })));
  const site = () => h('header', { class: 'wc-site' }, h('b', {}, 'Clavier&Co'), h('nav', {}, h('span', {}, T('Accueil', 'Home')), h('span', {}, T('Offres', 'Deals')), h('span', {}, T('Panier', 'Cart'))));
  const open1 = id => go('clavier.example/' + id);
  const card = p => h('button', { class: 'wc-card', 'data-id': p.id, onclick: () => open1(p.id) }, kb(p.p % 7 + 2), h('b', {}, p.n), h('span', {}, (p.mech ? T('Mécanique', 'Mechanical') : 'Membrane') + ' · ' + p.s[0]), h('span', { class: 'pr' }, price(p.p)));
  const PAGES = {
    new: () => h('div', { class: 'wc-new' }, h('img', { src: icon(app.id), alt: '' }), h('h1', { html: brand('wCLAUDE', BRAND) }), h('p', {}, T('Le navigateur que votre agent IA pilote pour vous : onglets, envois de fichiers de toute taille, téléchargements rangés, version iPhone par site.', 'The browser your AI agent drives for you: tabs, file uploads of any size, tidy downloads, iPhone version per site.'))),
    shop: () => h('div', {}, site(), h('div', { class: 'wc-c' }, h('h2', {}, T('Trouvez le bon clavier', 'Find the right keyboard')), h('p', {}, T('Mécaniques, sans fil, compacts : livraison en 48 h.', 'Mechanical, wireless, compact: 48 h delivery.')),
      (() => { const f = h('input', { class: 'wc-fld', 'data-r': 'q', placeholder: T('Rechercher un produit…', 'Search a product…'), 'aria-label': T('Rechercher un produit', 'Search a product'), onkeydown: e => { if (e.key === 'Enter') go('clavier.example/recherche?q=' + encodeURIComponent(f.value)); } });
        return h('div', { class: 'wc-srch' }, f, h('button', { class: 'wc-sb', 'data-r': 'go', onclick: () => go('clavier.example/recherche?q=' + encodeURIComponent(f.value)) }, T('Chercher', 'Search'))); })(),
      h('h3', {}, T('Nos sélections', 'Our picks')), h('div', { class: 'wc-grid' }, ...[PROD[0], PROD[2], PROD[4]].map(card)))),
    results: e => { const q = (e.st.q || '').toLowerCase().replace(/é/g, 'e'), toks = q.split(/\s+/).filter(Boolean);
      const list = PROD.filter(p => { const hay = (p.n + ' clavier keyboard ' + (p.mech ? 'mecanique mechanical' : 'membrane')).toLowerCase(); return toks.every(t0 => hay.includes(t0)); });
      return h('div', {}, site(), h('div', { class: 'wc-c' }, h('h2', {}, T(`Résultats pour « ${e.st.q || ''} »`, `Results for “${e.st.q || ''}”`)), h('p', { 'data-r': 'count' }, T(`${list.length} produit${list.length > 1 ? 's' : ''}`, `${list.length} product${list.length === 1 ? '' : 's'}`)),
        list.length ? h('div', { class: 'wc-grid' }, ...list.map(card)) : h('p', {}, T('Aucun produit ne correspond.', 'No product matches.')))); },
    product: e => { const p = PROD.find(x => x.id === e.st.id); const add = h('button', { class: 'wc-sb', 'data-r': 'add', onclick: () => { add.textContent = T('Ajouté ✓', 'Added ✓'); sfx.pop(); } }, T('Ajouter au panier', 'Add to cart'));
      return h('div', {}, site(), h('div', { class: 'wc-c' }, h('div', { class: 'wc-prod' }, kb(p.p % 7 + 2), h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, h('h2', {}, p.n), h('h3', {}, price(p.p)), h('ul', {}, ...p.s.map(x => h('li', {}, Array.isArray(x) ? T(x[0], x[1]) : x)), h('li', {}, p.mech ? T('Clavier mécanique', 'Mechanical keyboard') : T('Clavier à membrane', 'Membrane keyboard'))), add)))); },
    login: e => { const st = e.st; const box = st.step === 'form' ? h('div', { class: 'wc-box' }, h('h3', {}, T('Connexion', 'Sign in')),
        h('label', {}, T('Adresse e-mail', 'Email address')), h('input', { class: 'wc-fld', 'data-r': 'email', type: 'text', value: st.email || '', autocomplete: 'off', oninput: ev => { st.email = ev.target.value; } }),
        h('label', {}, T('Mot de passe', 'Password')), h('input', { class: 'wc-fld', 'data-r': 'pw', type: 'password', value: st.pw ? '••••••••••' : '', autocomplete: 'off', oninput: ev => { st.pw = ev.target.value || ''; } }),
        h('button', { class: 'wc-sb', 'data-r': 'login', onclick: () => { if (!st.email || !st.pw) { st.err = true; drawView(); return; } st.step = 'cap'; sfx.tick(); drawView(); } }, T('Se connecter', 'Sign in')), st.err ? h('small', { style: { color: '#b91c1c' } }, T('Saisissez votre adresse e-mail et votre mot de passe.', 'Enter your email address and your password.')) : null) :
        h('div', { class: 'wc-box' }, h('h3', {}, T('Vérification de sécurité', 'Security check')), h('p', {}, T('Ce site demande une vérification humaine avant de continuer.', 'This site asks for a human check before continuing.')),
          (() => { const b = h('button', { 'data-r': 'cap', 'aria-label': T('Je ne suis pas un robot', 'I am not a robot'), 'aria-checked': !!st.solved, role: 'checkbox', onclick: async () => { if (st.solved || st.busy) return; st.busy = true; b.className = 'sp'; await wait(reduced() ? 0 : 800); if (!alive()) return; st.busy = false; st.solved = true; sfx.done(); drawView(); } }, st.solved ? '✓' : '');
            if (st.solved) b.className = 'ok'; return h('div', { class: 'wc-cap' }, b, h('span', {}, T('Je ne suis pas un robot', 'I am not a robot')), h('small', {}, T('Vérification', 'Check'))); })(),
          h('button', { class: 'wc-sb', 'data-r': 'cont', disabled: !st.solved, onclick: () => { B.logged = true; go('clavier.example/commandes'); } }, T('Continuer', 'Continue')));
      return h('div', {}, site(), h('div', { class: 'wc-c' }, box)); },
    orders: () => { const rows = [[1042, T('3 nov. 2026', 'Nov 3, 2026'), 129, 'facture-2026-1042.pdf', T('Livrée', 'Delivered')], [987, T('12 oct. 2026', 'Oct 12, 2026'), 79, 'facture-2026-0987.pdf', T('Livrée', 'Delivered')], [931, T('2 sept. 2026', 'Sep 2, 2026'), 39, 'facture-2026-0931.pdf', T('Livrée', 'Delivered')]];
      return h('div', {}, site(), h('div', { class: 'wc-c' }, h('h2', {}, T('Mes commandes', 'My orders')), h('table', { class: 'wc-tb' }, h('thead', {}, h('tr', {}, ...[T('N°', 'No.'), 'Date', 'Total', T('Statut', 'Status'), T('Facture', 'Invoice')].map(x => h('th', {}, x)))),
        h('tbody', {}, ...rows.map(([n, d, p, f, s], i) => h('tr', {}, h('td', {}, '#' + n), h('td', {}, d), h('td', {}, price(p)), h('td', {}, h('span', { class: 'wc-tag' }, s)), h('td', {}, h('button', { class: 'wc-lnk', 'data-r': i ? 'inv' + n : 'inv', onclick: () => download(f, 6 + i) }, T('Télécharger', 'Download'))))))))); },
    upload: e => { const st = e.st; return h('div', {}, h('header', { class: 'wc-site' }, h('b', {}, 'Partage'), h('nav', {}, h('span', {}, T('Envoyer', 'Send')), h('span', {}, T('Mes liens', 'My links')))), h('div', { class: 'wc-c' }, h('h2', {}, T('Envoyer un fichier', 'Send a file')), h('p', {}, T('Jusqu’à 2 Go par fichier. Lien de partage valable 7 jours.', 'Up to 2 GB per file. Share link valid for 7 days.')),
      st.file ? h('div', { class: 'wc-file' }, h('div', { style: { flex: 1, minWidth: 0 } }, h('b', {}, st.file.n), h('br'), h('small', {}, st.file.size), st.prog > 0 ? h('div', { class: 'wc-pbar', style: { marginTop: '8px' } }, h('i', { style: { width: st.prog + '%' } })) : null),
        st.sent ? h('span', { class: 'wc-ok' }, T('Envoyé ✓', 'Sent ✓')) : h('button', { class: 'wc-sb', 'data-r': 'send', disabled: st.prog > 0, onclick: () => sendFile(e) }, T('Envoyer', 'Send'))) :
        h('div', { class: 'wc-drop' }, h('span', {}, T('Glissez un fichier ici', 'Drag a file here')), h('button', { class: 'wc-sb g', 'data-r': 'choose', onclick: () => chooseFile(e) }, T('Choisir un fichier', 'Choose a file'))),
      st.sent ? h('p', { class: 'wc-ok', 'data-r': 'link' }, T('Lien de partage : ', 'Share link: ') + 'partage.example/f/8Kx2') : null)); },
    profile: () => h('div', {}, h('div', { class: 'wc-de wc-gate' }, h('div', { class: 'wc-av' }), h('h2', {}, '@stephan'), h('p', { 'data-r': 'gate' }, T('Ce profil ne s’affiche que sur iPhone.', 'This profile only shows on iPhone.')), h('div', { class: 'wc-qr' }, ...Array.from({ length: 81 }, (_, i) => h('i', { class: (i * 7 + (i >> 2)) % 3 ? '' : 'o' }))), h('p', {}, T('Ouvrez l’application mobile pour le voir.', 'Open the mobile app to view it.'))),
      h('div', { class: 'wc-mo' }, h('div', { class: 'wc-c' }, h('div', { style: { display: 'flex', gap: '16px', alignItems: 'center' } }, h('div', { class: 'wc-av' }), h('div', {}, h('h3', {}, '@stephan'), h('p', { 'data-r': 'bio' }, T('Applis Mac, vidéo et un peu de Skyrim.', 'Mac apps, video and a bit of Skyrim.')))),
        h('p', {}, T('9 publications · 1 204 abonnés', '9 posts · 1,204 followers')), h('div', { class: 'wc-ph' }, ...['#f472b6', '#38bdf8', '#fbbf24', '#4ade80', '#c084fc', '#fb923c', '#60a5fa', '#f87171', '#2dd4bf'].map(c => h('i', { style: { background: c } })))))),
    nf: () => h('div', {}, h('div', { class: 'wc-c' }, h('h2', {}, T('Page introuvable', 'Page not found')), h('p', {}, T('Cette adresse n’existe pas dans la démo. Essayez clavier.example, partage.example ou reseau.example.', 'This address does not exist in the demo. Try clavier.example, partage.example or reseau.example.'))))
  };
  function drawView(fade) {
    const e = entry(), mo = isMobile() && e.page !== 'new';
    view.classList.toggle('mo', mo); gut.querySelector('span').textContent = siteOf(e);
    const pg = h('div', { class: 'wc-page' + (e.page === 'new' ? ' dark' : '') + (fade ? ' wc-fade' : '') }, PAGES[e.page](e));
    const st = page.scrollTop; page.replaceWith(pg); page = pg; pg.scrollTop = fade ? 0 : st;
    pg.addEventListener('pointerdown', () => { if (B.pop) { B.pop = null; drawPop(); } });
  }
  /* envois et téléchargements (visiteur comme agent) */
  function chooseFile(e) { e.st.file = { n: 'rushes_trailer.mov', size: lang() === 'fr' ? '241 Mo' : '241 MB' }; sfx.pop(); drawView(); }
  async function sendFile(e) { const st = e.st; for (let p = 0; p <= 100; p += 5) { st.prog = p; if (entry() === e && alive()) drawView(); await wait(reduced() ? 0 : 90); if (!alive()) return; } st.sent = true; sfx.done(); if (entry() === e) drawView(); }
  async function download(name, mb) {
    const d = { name, pct: 0 }; B.downloads.push(d); drawNav(); sfx.click();
    for (let p = 0; p <= 100; p += 10) { d.pct = p; drawNav(); if (B.pop === 'dl') drawPop(); await wait(reduced() ? 0 : 70 + mb * 4); if (!alive()) return; }
    sfx.done(); drawNav(); if (B.pop === 'dl') drawPop(); toast({ icon: icon(app.id), title: app.id, body: T(`Téléchargé : ${name}`, `Downloaded: ${name}`) }); return d;
  }

  /* ---------- Trousseau : l'agent ne voit jamais le mot de passe ---------- */
  function approve() {
    return new Promise(res => {
      const close = v => { sc.remove(); res(v); };
      const el = h('div', { class: 'wc-dlg', role: 'alertdialog', tabindex: '-1', onkeydown: e => { if (e.key === 'Escape') close(false); } }, h('div', { class: 'hd' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('h3', {}, T('Autoriser le remplissage ?', 'Allow filling in?')),
        h('p', { html: bt(T('wCLAUDE veut remplir votre identifiant stephan@example.com sur clavier.example. Le mot de passe ne sera jamais transmis à l’agent.', 'wCLAUDE wants to fill in your stephan@example.com sign-in on clavier.example. The password is never passed to the agent.')) }))),
      h('div', { class: 'acts' }, h('button', { class: 'sbtn', onclick: () => close(false) }, T('Refuser', 'Deny')), h('button', { class: 'sbtn act', onclick: () => close(true) }, T('Autoriser', 'Allow'))));
      const sc = h('div', { class: 'wc-scrim' }, el); root.append(sc); sfx.open(); el.focus({ preventScroll: true });
    });
  }
  async function keychainFill(by) {
    const e = entry(); if (e.page !== 'login' || e.st.step !== 'form') { toast({ icon: icon(app.id), title: app.id, body: T('Aucun champ d’identifiant sur cette page.', 'No sign-in field on this page.') }); return false; }
    const ok = await approve(); if (!alive()) return false;
    if (!ok) { toast({ icon: icon(app.id), title: app.id, body: T('Remplissage annulé : l’accord n’a pas été donné.', 'Filling cancelled: approval was not given.') }); return false; }
    e.st.email = 'stephan@example.com'; e.st.pw = true; e.st.err = false; sfx.done(); drawView(); if (by === 'user') toast({ icon: icon(app.id), title: app.id, body: T('Identifiant de stephan@example.com rempli.', 'Sign-in for stephan@example.com filled in.') }); return true;
  }
  function userKeychain() {
    const e = entry(); if (HOST(e.url) !== 'clavier.example') { toast({ icon: icon(app.id), title: app.id, body: T(`Aucun identifiant de ${HOST(e.url) || 'ce site'} dans le Trousseau.`, `No sign-in for ${HOST(e.url) || 'this site'} in the Keychain.`) }); return; }
    B.pop = B.pop === 'kc' ? null : 'kc'; sfx.tick(); drawPop();
  }

  /* ---------- l'agent : outils browser_* joués pas à pas ---------- */
  const side = h('aside', { class: 'wc-ag' }), chat = h('div', { class: 'wc-chat', 'aria-live': 'polite' }), prog = h('i'), runB = h('button', { class: 'sbtn act', onclick: () => runTask() }, T('Lancer la tâche', 'Run the task'));
  const TASKS = [
    { id: 'a', t: ['Trouver un clavier', 'Find a keyboard'], p: ['Trouvez un clavier mécanique à moins de 100 € et ouvrez sa fiche.', 'Find a mechanical keyboard under $100 and open its page.'], n: 9 },
    { id: 'b', t: ['Télécharger une facture', 'Download an invoice'], p: ['Connectez-vous à mon compte clavier.example et téléchargez ma dernière facture.', 'Sign in to my clavier.example account and download my latest invoice.'], n: 12 },
    { id: 'c', t: ['Envoyer une vidéo de 241 Mo', 'Upload a 241 MB video'], p: ['Envoyez la vidéo rushes_trailer.mov (241 Mo) sur partage.example.', 'Upload rushes_trailer.mov (241 MB) to partage.example.'], n: 6 },
    { id: 'd', t: ['Ouvrir un profil mobile', 'Open a mobile profile'], p: ['Ouvrez le profil @stephan sur reseau.example : il ne s’affiche que sur iPhone.', 'Open the @stephan profile on reseau.example: it only shows on iPhone.'], n: 5 }
  ];
  const tk = () => TASKS.find(x => x.id === A.task);
  let mcpOpen = false;
  function drawSide() {
    const sc = chat.scrollTop;
    side.replaceChildren(h('div', { class: 'wc-agh' }, h('h3', {}, T('Agent IA', 'AI agent')), dlBtn(app)),
      h('p', { class: 'wc-sub' }, h('b', {}, AGENT), T(' · connecté par MCP · 33 outils', ' · connected through MCP · 33 tools')),
      h('div', { class: 'wc-tasks' }, ...TASKS.map(x => h('button', { class: 'wc-task' + (A.task === x.id ? ' on' : ''), disabled: A.run, onclick: () => { A.task = x.id; sfx.tick(); chat.replaceChildren(); prog.style.width = '0%'; drawSide(); } }, h('b', {}, T(x.t[0], x.t[1])), h('small', {}, '« ' + T(x.p[0], x.p[1]) + ' »')))),
      h('div', { class: 'wc-prog' }, prog), chat,
      h('div', { class: 'wc-agf' }, A.run ? h('button', { class: 'sbtn', onclick: () => { A.cancel = true; if (B.handoff) B.handoff.resolve('cancel'); } }, T('Arrêter', 'Stop')) : runB,
        h('button', { class: 'sbtn', onclick: copyMcp }, T('Copier la configuration MCP', 'Copy MCP configuration')), mcpOpen ? h('pre', { class: 'wc-mcp' }, MCP) : null));
    runB.disabled = A.run; chat.scrollTop = sc;
  }
  const MCP = 'claude mcp add --scope user wclaude -- "$HOME/Applications/Applications Personnelles/wCLAUDE.app/Contents/Resources/app/app/bin/wclaude-mcp"';
  async function copyMcp() { try { await navigator.clipboard.writeText(MCP); } catch { /* sans presse-papiers */ } mcpOpen = true; sfx.done(); drawSide(); toast({ icon: icon(app.id), title: app.id, body: T('Configuration copiée. Collez-la dans les réglages MCP de votre agent.', 'Configuration copied. Paste it into your agent’s MCP settings.') }); }

  /** Une ligne du journal : outil, argument, résultat. */
  async function tool(name, arg, act, fn, res) {
    if (A.cancel || !alive()) throw 'cancel';
    if (A.tabId && B.active !== A.tabId && B.tabs.some(t => t.id === A.tabId)) { B.active = A.tabId; drawAll(true); }
    const ic = h('i', { class: 'ic sp' }), sp = h('span', {}), row = h('div', { class: 'wc-tc' }, ic, h('div', {}, h('b', {}, name + (arg ? '  ' + arg : '')), sp)); chat.append(row); chat.scrollTop = chat.scrollHeight;
    B.agent = { act, at: Date.now(), tab: B.active }; drawBubble(); drawTabs(); sfx.tick();
    let out; try { out = await fn(); } catch (e) { if (e && e.refused) { row.classList.add('no'); ic.className = 'ic'; ic.textContent = '✕'; sp.textContent = e.refused; A.n++; prog.style.width = (A.n / A.total * 100) + '%'; return null; } throw e; }
    if (!alive()) throw 'cancel';
    ic.className = 'ic'; ic.textContent = '✓'; sp.textContent = typeof res === 'function' ? res(out) : res || ''; A.n++; prog.style.width = (A.n / A.total * 100) + '%'; chat.scrollTop = chat.scrollHeight; await wait(reduced() ? 0 : 160); return out;
  }
  const rel = el => { const vr = view.getBoundingClientRect(), r = el.getBoundingClientRect(), k = vr.width / view.offsetWidth || 1; return [(r.left - vr.left + r.width / 2) / k, (r.top - vr.top + Math.min(r.height / 2, 16)) / k]; };
  async function moveTo(el) { if (!el) throw 'cancel'; const [x, y] = rel(el); cur.style.opacity = 1; cur.style.transform = `translate(${x}px,${y}px)`; await wait(reduced() ? 0 : 650); }
  async function aclick(el) { await moveTo(el); const [x, y] = rel(el), ring = h('i', { class: 'wc-ring', style: { left: x + 'px', top: y + 'px' } }); view.append(ring); after(() => ring.remove(), 600); cur.classList.add('dn'); sfx.click(); await wait(160); cur.classList.remove('dn'); el.click(); await wait(reduced() ? 0 : 250); }
  async function atype(input, text) { await aclick(input); input.focus({ preventScroll: true }); for (let i = 1; i <= text.length; i++) { input.value = text.slice(0, i); input.dispatchEvent(new Event('input')); sfx.tick(); await wait(reduced() ? 0 : 50); } }
  const q = sel => { const el = page.querySelector(sel); if (!el) throw 'cancel'; return el; };
  const waitNav = async () => { for (let i = 0; i < 40 && tab().loading; i++) await wait(50); await wait(reduced() ? 0 : 120); };
  const ask = async (kind, reason) => new Promise(res => { B.handoff = { reason, resolve: v => { B.handoff = null; drawHand(); res(v); } }; drawHand(); sfx.notif(); toast({ icon: icon(app.id), title: app.id, body: T(`${AGENT} attend votre action : ${reason}`, `${AGENT} is waiting for you: ${reason}`) }); });
  const say = async text => { const el = h('div', { class: 'wc-msg ai' }); chat.append(el); chat.scrollTop = chat.scrollHeight; await stream(el, text, { think: 500, cps: 120, alive: () => { chat.scrollTop = chat.scrollHeight; return alive(); } }); chat.scrollTop = chat.scrollHeight; };

  const TASK_FN = {
    async a() {
      const mq = T('clavier mécanique', 'mechanical keyboard');
      await tool('browser_tabs', 'list', 'tabs', async () => wait(300), () => T(`${B.tabs.length} onglet : Nouvel onglet`, `${B.tabs.length} tab: New tab`));
      await tool('browser_navigate', 'clavier.example', 'navigate', async () => { await go('clavier.example'); await waitNav(); }, T('Page chargée : Clavier&Co', 'Page loaded: Clavier&Co'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('champ de recherche (ref=e7), bouton Chercher (ref=e9)', 'search field (ref=e7), Search button (ref=e9)'));
      await tool('browser_click', 'ref=e7', 'click', async () => aclick(q('[data-r=q]')), T('champ de recherche', 'search field'));
      await tool('browser_type', `ref=e7 "${mq}"`, 'type', async () => atype(q('[data-r=q]'), mq), T('texte saisi', 'text typed'));
      await tool('browser_click', 'ref=e9', 'click', async () => { await aclick(q('[data-r=go]')); await waitNav(); }, T('Chercher', 'Search'));
      const n = page.querySelectorAll('.wc-card').length, under = [...page.querySelectorAll('.wc-card')].filter(c => PROD.find(p => p.id === c.dataset.id).p < 100).length;
      await tool('browser_snapshot', '', 'read', async () => wait(400), T(`${n} résultats, dont ${under} sous 100 €`, `${n} results, ${under} under $100`));
      await tool('browser_tabs', 'open clavier.example/k2', 'tabs', async () => { const t = newTab(null, true); A.tabId = t.id; await go('clavier.example/k2'); await waitNav(); return t; }, T('onglet 2 ouvert : Keyboard K2', 'tab 2 opened: Keyboard K2'));
      await tool('browser_screenshot', '', 'screenshot', async () => wait(500), T(`fiche Keyboard K2 · ${price(79)}`, `Keyboard K2 page · ${price(79)}`));
      await say(T(`J’ai ouvert la fiche du Keyboard K2 (${price(79)}) dans un nouvel onglet : c’est le moins cher des claviers mécaniques sous ${price(100)}.`, `I opened the Keyboard K2 page (${price(79)}) in a new tab: it is the cheapest mechanical keyboard under ${price(100)}.`));
    },
    async b() {
      await tool('browser_navigate', 'clavier.example/compte', 'navigate', async () => { await go('clavier.example/compte'); await waitNav(); }, T('Page chargée : Connexion', 'Page loaded: Sign in'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('formulaire : e-mail (ref=e4), mot de passe (ref=e5), Se connecter (ref=e6)', 'form: email (ref=e4), password (ref=e5), Sign in (ref=e6)'));
      await tool('browser_type', 'ref=e5 "••••••"', 'type', async () => { await moveTo(q('[data-r=pw]')); throw { refused: T('Refusé : champ de mot de passe. Utilisez browser_keychain_fill.', 'Refused: password field. Use browser_keychain_fill.') }; }, '');
      const ok = await tool('browser_keychain_fill', '', 'keychain', async () => { const f = keychainFill('agent'); await wait(100); const r = await f; if (!r) throw { refused: T('Remplissage annulé : l’accord n’a pas été donné.', 'Filling cancelled: approval was not given.') }; return r; }, T('identifiant de stephan@example.com rempli (mot de passe non transmis)', 'sign-in for stephan@example.com filled in (password not passed on)'));
      if (!ok) { await say(T('Vous n’avez pas autorisé le Trousseau : je m’arrête ici, rien n’a été saisi.', 'You did not allow the Keychain: I stop here, nothing was typed.')); return; }
      await tool('browser_click', 'ref=e6 "Se connecter"', 'click', async () => aclick(q('[data-r=login]')), T('Se connecter', 'Sign in'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('vérification humaine demandée (case « Je ne suis pas un robot »)', 'human check requested (“I am not a robot” box)'));
      let again = false;
      for (;;) {
        const r = await tool('browser_request_user', '', 'handoff', () => ask('captcha', again ? T('La vérification n’est pas terminée. Cochez la case dans la fenêtre wCLAUDE, puis cliquez sur C’EST FAIT.', 'The check is not finished. Tick the box in the wCLAUDE window, then click DONE.') : T('Le site demande une vérification humaine. Faites-la dans la fenêtre wCLAUDE, puis cliquez sur C’EST FAIT.', 'The site asks for a human check. Do it in the wCLAUDE window, then click DONE.')), v => (v === 'done' ? T('l’utilisateur a terminé', 'the user is done') : T('annulé', 'cancelled')));
        if (r === 'cancel' || A.cancel) throw 'cancel';
        await tool('browser_snapshot', '', 'read', async () => wait(300), () => (entry().st.solved ? T('vérification réussie, bouton Continuer actif', 'check passed, Continue button enabled') : T('la vérification est toujours là', 'the check is still there')));
        if (entry().st.solved) break; again = true;
      }
      await tool('browser_click', 'ref=e8 "Continuer"', 'click', async () => { await aclick(q('[data-r=cont]')); await waitNav(); }, T('Continuer', 'Continue'));
      await tool('browser_page_text', '', 'read', async () => wait(400), T('3 commandes ; la dernière : n° 1042, 129 €', '3 orders; the latest: no. 1042, $129'));
      await tool('browser_click', 'ref=e11 "Télécharger"', 'click', async () => { await aclick(q('[data-r=inv]')); }, T('téléchargement lancé', 'download started'));
      await tool('browser_downloads', 'wait', 'downloads', async () => { for (let i = 0; i < 60 && B.downloads.some(d => d.pct < 100); i++) await wait(80); }, T('facture-2026-1042.pdf · ~/Downloads/wCLAUDE · terminé', 'facture-2026-1042.pdf · ~/Downloads/wCLAUDE · done'));
      await say(T('Connecté sans que j’aie vu votre mot de passe. La facture n° 1042 est dans ~/Downloads/wCLAUDE, sous son vrai nom.', 'Signed in without me ever seeing your password. Invoice no. 1042 is in ~/Downloads/wCLAUDE, under its real name.'));
    },
    async c() {
      await tool('browser_navigate', 'partage.example', 'navigate', async () => { await go('partage.example'); await waitNav(); }, T('Page chargée : Partage de fichiers', 'Page loaded: File sharing'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('zone de dépôt, bouton Choisir un fichier (ref=e3)', 'drop zone, Choose a file button (ref=e3)'));
      await tool('browser_upload_files', 'ref=e3 rushes_trailer.mov', 'upload', async () => { await wait(500); chooseFile(entry()); await wait(300); }, T('241 Mo transmis tels quels au moteur du navigateur (DOM.setFileInputFiles) : aucune limite de taille, aucune copie', '241 MB handed straight to the browser engine (DOM.setFileInputFiles): no size limit, no copy'));
      await tool('browser_click', 'ref=e5 "Envoyer"', 'click', async () => aclick(q('[data-r=send]')), T('Envoyer', 'Send'));
      await tool('browser_wait_for', 'text="Envoyé"', 'wait', async () => { for (let i = 0; i < 100 && !entry().st.sent; i++) await wait(100); }, T('« Envoyé » est apparu', '“Sent” appeared'));
      await tool('browser_page_text', '', 'read', async () => wait(300), 'partage.example/f/8Kx2');
      await say(T('rushes_trailer.mov (241 Mo) est en ligne : partage.example/f/8Kx2. Aucun plafond de taille n’a joué.', 'rushes_trailer.mov (241 MB) is online: partage.example/f/8Kx2. No size cap got in the way.'));
    },
    async d() {
      await tool('browser_navigate', 'reseau.example/@stephan', 'navigate', async () => { await go('reseau.example/@stephan'); await waitNav(); }, T('Page chargée : @stephan', 'Page loaded: @stephan'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('« Ce profil ne s’affiche que sur iPhone. »', '“This profile only shows on iPhone.”'));
      await tool('browser_mobile_mode', 'reseau.example on', 'mobile', async () => { await wait(300); toggleMobile(true); await wait(500); }, T('version iPhone : agent utilisateur iPhone, écran de 390 px, tactile (retenu pour ce site)', 'iPhone version: iPhone user agent, 390 px screen, touch (remembered for this site)'));
      await tool('browser_snapshot', '', 'read', async () => wait(400), T('profil visible : @stephan · 9 publications · 1 204 abonnés', 'profile visible: @stephan · 9 posts · 1,204 followers'));
      await tool('browser_screenshot', '', 'screenshot', async () => wait(500), T('capture de la version iPhone', 'screenshot of the iPhone version'));
      await say(T('Le profil n’existait que sur mobile : j’ai passé reseau.example en version iPhone, et il s’affiche. Le réglage est retenu pour ce site.', 'The profile only existed on mobile: I switched reseau.example to the iPhone version, and it shows. The setting is remembered for this site.'));
    }
  };
  async function runTask() {
    if (A.run) return; const t = tk();
    Object.assign(A, { run: true, cancel: false, n: 0, total: t.n, tabId: B.active }); B.pop = null; drawPop(); chat.replaceChildren(); prog.style.width = '0%'; cur.style.opacity = 0; sfx.click(); drawSide();
    chat.append(h('div', { class: 'wc-msg me' }, T(t.p[0], t.p[1])));
    try { await TASK_FN[t.id](); if (alive()) { prog.style.width = '100%'; sfx.done(); } }
    catch (e) { if (e !== 'cancel') { console.error(e); } if (alive()) { chat.append(h('div', { class: 'wc-msg' }, T('Tâche arrêtée.', 'Task stopped.'))); } }
    if (!alive()) return; A.run = false; cur.style.opacity = 0; B.handoff = null; drawHand(); drawSide(); chat.scrollTop = chat.scrollHeight; drawBubble();
  }

  root.append(br, side); drawSide(); drawAll();
  return root;
}
