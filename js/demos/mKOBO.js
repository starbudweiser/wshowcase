/* Réplique interactive de mKOBO : trouver des livres, BD et livres audio gratuits et légaux, les envoyer sur la liseuse Kobo ou dans Google Drive.
   Recherche, filtres (type, langue, sources), vignettes / liste, sélection, envois animés (téléchargement, KEPUB, copie), « Ma liseuse », fiche avec résumé traduit,
   boutique Kobo dans un tiroir (Trousseau, téléchargement) et réglages. Catalogue d'exemple : rien n'est téléchargé ni envoyé. */
import { css, h, T, win, bar, sw, dialog, toast, icon, sfx, wait, reduced } from './tk.js';
const CSS = 'css/demos/mKOBO.css';
const SRC = { gut: 'Project Gutenberg', wik: 'Wikisource', arc: 'Internet Archive', lv: 'LibriVox', beq: 'BEQ · Québec', pc: 'Pepper&Carrot' };
const B = (id, title, author, kind, lang, src, o = {}) => ({ id, title, author, kind, lang, src, fmt: kind === 'audio' ? 'MP3' : kind === 'comic' ? 'CBZ' : 'EPUB', ...o });
const BOOKS = [
  B(1, 'Vingt mille lieues sous les mers', 'Jules Verne', 'book', 'fr', 'gut', { pop: 9, yr: 1870, fr: 'Le professeur Aronnax embarque à bord du Nautilus, sous-marin du mystérieux capitaine Nemo, pour un tour du monde sous les mers.', en: 'Professor Aronnax boards the Nautilus, the submarine of the enigmatic Captain Nemo, for a journey around the world beneath the seas.' }),
  B(2, 'Le Comte de Monte-Cristo', 'Alexandre Dumas', 'book', 'fr', 'gut', { pop: 9, yr: 1844, fr: 'Trahi et emprisonné au château d’If, Edmond Dantès s’évade, découvre un trésor et prépare sa vengeance.', en: 'Betrayed and jailed in the Château d’If, Edmond Dantès escapes, finds a treasure and plans his revenge.' }),
  B(3, 'Madame Bovary', 'Gustave Flaubert', 'book', 'fr', 'gut', { pop: 8, yr: 1857, fr: 'Emma, mariée à un médecin de campagne, rêve d’une vie romanesque qui la mène à sa perte.', en: 'Emma, married to a country doctor, dreams of a romantic life that leads to her ruin.' }),
  B(4, 'Les Misérables', 'Victor Hugo', 'book', 'fr', 'gut', { pop: 9, yr: 1862, fr: 'Jean Valjean, ancien forçat, cherche la rédemption sous le regard obstiné de l’inspecteur Javert.', en: 'Jean Valjean, a former convict, seeks redemption under the relentless eye of Inspector Javert.' }),
  B(5, 'Candide, ou l’optimisme', 'Voltaire', 'book', 'fr', 'gut', { pop: 7, yr: 1759, fr: 'Conte philosophique : Candide traverse le monde et ses malheurs en croyant que tout est pour le mieux.', en: 'A philosophical tale: Candide crosses the world and its misfortunes believing all is for the best.' }),
  B(6, 'Les enchantements de la forêt', 'André Theuriet', 'book', 'fr', 'gut', { pop: 3, yr: 1890, sumLang: 'en', en: '“Les enchantements de la forêt” is a children’s novel from the late 19th century. It follows a provincial boy whose imagination, fired by fairy tales and the allure of the woods, sparks quests both comic and perilous. (This is an automatically generated summary.)', fr: 'Les enchantements de la forêt est un roman pour enfants de la fin du XIXe siècle. Il suit un petit garçon de province dont l’imagination, nourrie de contes de fées et de l’appel des bois, déclenche des quêtes à la fois comiques et périlleuses. (Ce résumé est généré automatiquement.)' }),
  B(7, 'Le Horla', 'Guy de Maupassant', 'book', 'fr', 'wik', { pop: 6, yr: 1887, fr: 'Journal d’un homme qui se croit hanté par un être invisible.', en: 'The diary of a man who believes he is haunted by an invisible being.' }),
  B(8, 'Les Fleurs du mal', 'Charles Baudelaire', 'book', 'fr', 'wik', { pop: 6, yr: 1857, fr: 'Recueil de poèmes qui a bouleversé la poésie française.', en: 'A poetry collection that upended French poetry.' }),
  B(9, 'Les Soirées de Médan', 'Zola, Huysmans, Maupassant et al.', 'book', 'fr', 'beq', { pop: 4, yr: 1880, fr: 'Six nouvelles du groupe de Médan autour d’Émile Zola.', en: 'Six short stories by the Médan group around Émile Zola.' }),
  B(10, 'Le Grand Chef des Aucas', 'Gustave Aimard', 'book', 'fr', 'beq', { pop: 3, yr: 1858, fr: 'Roman d’aventures dans les pampas d’Amérique du Sud.', en: 'An adventure novel set on the South American pampas.' }),
  B(11, 'Les trappeurs de l’Arkansas', 'Gustave Aimard', 'book', 'fr', 'beq', { pop: 3, yr: 1858, fr: 'Trappeurs, Indiens et chercheurs d’or dans l’Ouest américain.', en: 'Trappers, Native Americans and gold seekers in the American West.' }),
  B(12, 'Bel-Ami', 'Guy de Maupassant', 'book', 'fr', 'arc', { pop: 5, yr: 1885, fr: 'L’ascension d’un séducteur sans scrupules dans le Paris de la presse.', en: 'The rise of an unscrupulous charmer in the Paris of the press.' }),
  B(13, 'Pride and Prejudice', 'Jane Austen', 'book', 'en', 'gut', { pop: 9, yr: 1813, fr: 'Elizabeth Bennet et M. Darcy apprennent à vaincre leurs préjugés.', en: 'Elizabeth Bennet and Mr Darcy learn to overcome their prejudices.', sumLang: 'en' }),
  B(14, 'Heart of Darkness', 'Joseph Conrad', 'book', 'en', 'arc', { pop: 6, yr: 1899, fr: 'Remontée du fleuve Congo vers le mystérieux Kurtz.', en: 'A journey up the Congo to the enigmatic Kurtz.', sumLang: 'en' }),
  B(15, 'Frankenstein', 'Mary Shelley', 'book', 'en', 'gut', { pop: 8, yr: 1818, fr: 'Un jeune savant donne la vie à une créature qui se retourne contre lui.', en: 'A young scientist gives life to a creature that turns on him.', sumLang: 'en' }),
  B(16, 'Walden', 'Henry David Thoreau', 'book', 'en', 'arc', { pop: 5, yr: 1854, fr: 'Deux ans de vie simple dans les bois.', en: 'Two years of simple living in the woods.', sumLang: 'en' }),
  B(17, 'Pepper&Carrot 01 — Potion of Flight', 'David Revoy', 'comic', 'fr', 'pc', { pop: 8, yr: 2014, fr: 'Les aventures de la petite sorcière Pepper et de son chat Carrot. BD libre (CC-BY 4.0).', en: 'The adventures of little witch Pepper and her cat Carrot. Free comic (CC-BY 4.0).' }),
  B(18, 'Pepper&Carrot 02 — Rainbow potions', 'David Revoy', 'comic', 'fr', 'pc', { pop: 8, yr: 2014, fr: 'Les potions arc-en-ciel de Pepper. BD libre (CC-BY 4.0).', en: 'Pepper’s rainbow potions. Free comic (CC-BY 4.0).' }),
  B(19, 'Pepper&Carrot 03 — The secret ingredients', 'David Revoy', 'comic', 'fr', 'pc', { pop: 7, yr: 2014, fr: 'Les ingrédients secrets de la sorcellerie. BD libre (CC-BY 4.0).', en: 'The secret ingredients of witchcraft. Free comic (CC-BY 4.0).' }),
  B(20, 'Little Nemo in Slumberland (1905)', 'Winsor McCay', 'comic', 'en', 'arc', { pop: 5, yr: 1905, fr: 'Les rêves extravagants du petit Nemo, planches du domaine public.', en: 'Little Nemo’s extravagant dreams, public-domain pages.', sumLang: 'en' }),
  B(21, 'Vingt mille lieues sous les mers', 'Jules Verne', 'audio', 'fr', 'lv', { pop: 7, dur: '11:20:18', fr: 'Lu par des bénévoles de LibriVox.', en: 'Read by LibriVox volunteers.' }),
  B(22, 'Le Horla', 'Guy de Maupassant', 'audio', 'fr', 'lv', { pop: 5, dur: '1:02:44', fr: 'Lu par des bénévoles de LibriVox.', en: 'Read by LibriVox volunteers.' }),
  B(23, 'Pride and Prejudice', 'Jane Austen', 'audio', 'en', 'lv', { pop: 8, dur: '11:35:02', fr: 'Lu par des bénévoles de LibriVox.', en: 'Read by LibriVox volunteers.' })
];
const MORE = ['Germinal|Émile Zola', 'Notre-Dame de Paris|Victor Hugo', 'Les Trois Mousquetaires|Alexandre Dumas', 'Le Rouge et le Noir|Stendhal', 'Salammbô|Gustave Flaubert', 'Carmen|Prosper Mérimée', 'Le Père Goriot|Honoré de Balzac', 'Tartuffe|Molière'];
const STORE = [['Le Petit Prince', 'Antoine de Saint-Exupéry', '6,99 €'], ['L’Étranger', 'Albert Camus', '7,49 €'], ['Les Fleurs du mal', 'Charles Baudelaire', 'Gratuit', 1], ['Sapiens', 'Yuval Noah Harari', '9,99 €'], ['Dune', 'Frank Herbert', '8,99 €'], ['Germinal', 'Émile Zola', 'Gratuit', 1]];
const hue = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const grad = b => { const x = hue(b.title); return `linear-gradient(155deg,hsl(${x} 55% 38%),hsl(${(x + 48) % 360} 50% 22%))`; };

export function open(app) {
  css(CSS);
  return win(app, 1120, 720, w => {
    const st = { nav: 'disc', q: '', kind: 'all', view: 'grid', langs: new Set(['fr', 'en']), srcs: new Set(Object.keys(SRC)), sel: new Set(), insp: null, kobo: true, jobs: [], dev: [{ title: 'Candide, ou l’optimisme', author: 'Voltaire', fmt: 'EPUB', size: '0,3 Mo' }, { title: 'Walden', author: 'Henry David Thoreau', fmt: 'EPUB', size: '0,5 Mo' }],
      more: 0, store: false, orig: false, free: 28.8, run: false, kepub: true, byAuthor: true, eject: false, login: false, dl: null, sq: '' };
    const root = h('div', { class: 'tk mk' }), side = h('aside', { class: 'tk-side mk-side' }), main = h('div', { class: 'tk-main mk-main' }), insp = h('aside', { class: 'mk-insp' });
    const all = () => [...BOOKS, ...MORE.slice(0, st.more).map((m, i) => B(100 + i, m.split('|')[0], m.split('|')[1], 'book', 'fr', 'gut', { pop: 2, fr: 'Classique du domaine public.', en: 'Public-domain classic.' }))];
    const byId = id => all().find(b => b.id === id);
    const match = b => (!st.q || (b.title + ' ' + b.author).toLowerCase().includes(st.q.toLowerCase()));
    const base = () => all().filter(b => st.srcs.has(b.src) && (st.langs.size === 0 || st.langs.has(b.lang)) && match(b)).sort((a, b) => b.pop - a.pop);
    const list = () => base().filter(b => st.kind === 'all' || b.kind === st.kind);
    const cnt = k => base().filter(b => k === 'all' || b.kind === k).length;
    const kc = b => b.kind === 'audio' ? 'wn' : 'ok';
    const compat = b => b.kind === 'audio' ? T('Drive · téléphone', 'Drive · phone') : T('Compatible Kobo', 'Kobo compatible');
    const KL = { book: T('Livres', 'Books'), comic: T('BD', 'Comics'), audio: 'Audio' };
    const summary = b => (b.sumLang && b.sumLang !== T('fr', 'en')) ? { text: st.orig ? b[b.sumLang] : b[T('fr', 'en')], tr: true } : { text: b[T('fr', 'en')] };
    const toggle = id => { st.sel.has(id) ? st.sel.delete(id) : st.sel.add(id); sfx.tick(); drawMain(); drawInsp(); };

    /* ——— panneau latéral ——— */
    const drawSide = () => {
      side.innerHTML = '';
      const nav = (id, g, l, n) => h('button', { class: 'tk-nav' + (st.nav === id ? ' on' : ''), onclick: () => { st.nav = id; sfx.tick(); draw(); } }, h('span', { class: 'g' }, g), l, n ? h('em', {}, String(n)) : null);
      side.append(nav('disc', '⌕', T('Découvrir', 'Discover')), nav('dev', '▥', T('Ma liseuse', 'My e-reader'), st.kobo ? st.dev.length : 0), nav('jobs', '↗', T('Envois', 'Sends'), st.jobs.length),
        h('div', { class: 'tk-h' }, T('Bibliothèques gratuites', 'Free libraries')),
        h('div', { class: 'mk-srcs' }, ...Object.entries(SRC).map(([k, n]) => h('label', { class: 'mk-src' }, h('input', { type: 'checkbox', checked: st.srcs.has(k), onchange: e => { e.target.checked ? st.srcs.add(k) : st.srcs.delete(k); sfx.tick(); draw(); } }), h('span', {}, n), h('em', {}, String(all().filter(b => b.src === k && match(b) && (st.langs.size === 0 || st.langs.has(b.lang))).length))))),
        h('div', { class: 'tk-h' }, T('Boutique officielle', 'Official store')),
        h('button', { class: 'tk-btn mk-store', onclick: () => { st.store = true; sfx.click(); drawStore(); } }, '🛍  ' + T('Boutique Kobo (Rakuten)', 'Kobo store (Rakuten)'), h('span', {}, '↗')),
        h('p', { class: 'mk-note' }, T('S’ouvre dans l’appli : connecte-toi une fois, la session reste. Les livres de la boutique arrivent sur la liseuse par ton compte Kobo ; un fichier téléchargé sans protection peut être envoyé d’ici.', 'Opens inside the app: sign in once, the session stays. Store books reach the reader through your Kobo account; an unprotected downloaded file can be sent from here.')),
        h('div', { class: 'tk-h' }, T('Langue', 'Language')),
        h('div', { class: 'mk-chips' }, h('button', { class: 'tk-pill' + (!st.langs.size ? ' on' : ''), onclick: () => { st.langs.clear(); sfx.tick(); draw(); } }, T('Toutes les langues', 'All languages')),
          ...[['fr', T('Français', 'French')], ['en', T('Anglais', 'English')], ['es', T('Espagnol', 'Spanish')], ['it', T('Italien', 'Italian')]].map(([c, l]) => h('button', { class: 'tk-pill' + (st.langs.has(c) ? ' on' : ''), onclick: () => { st.langs.has(c) ? st.langs.delete(c) : st.langs.add(c); sfx.tick(); draw(); } }, (st.langs.has(c) ? '✓ ' : '') + l))),
        h('p', { class: 'mk-note' }, T('La Kobo ne lit que les livres audio de sa boutique : les MP3 gratuits sont copiés sur Google Drive, pour ton téléphone.', 'The Kobo only plays audiobooks from its own store: free MP3s are copied to Google Drive, for your phone.')));
    };

    /* ——— galerie ——— */
    const cover = (b, big) => h('div', { class: 'mk-cv' + (big ? ' big' : ''), style: { background: grad(b) } }, h('span', { class: 'fmt' }, b.fmt), h('b', {}, b.title.replace(/ — .*/, '')), h('small', {}, b.author.split(',')[0]), b.kind === 'audio' ? h('i', { class: 'ph' }, '🎧') : null);
    const card = b => { const on = st.sel.has(b.id);
      return h('div', { class: 'mk-card' + (on ? ' on' : ''), onclick: () => toggle(b.id) },
        h('div', { class: 'mk-cw' }, cover(b), h('span', { class: 'mk-ck' + (on ? ' on' : '') }, on ? '✓' : ''), h('button', { class: 'mk-i', title: T('Détails', 'Details'), onclick: e => { e.stopPropagation(); st.insp = b.id; st.orig = false; sfx.tick(); drawInsp(); } }, 'ⓘ')),
        h('div', { class: 'mk-t' }, b.title), h('div', { class: 'mk-a' }, b.author), h('div', { class: 'mk-tags' }, h('span', { class: 'tk-chip ' + kc(b) }, compat(b)), h('span', { class: 'tk-chip' }, b.lang.toUpperCase())));
    };
    const row = b => { const on = st.sel.has(b.id);
      return h('div', { class: 'mk-row' + (on ? ' on' : ''), onclick: () => toggle(b.id) }, h('span', { class: 'mk-ck' + (on ? ' on' : '') }, on ? '✓' : ''), h('div', { class: 'mk-th', style: { background: grad(b) } }),
        h('div', { class: 'mk-rt' }, h('b', {}, b.title), h('span', {}, b.author + ' · ' + SRC[b.src])), h('span', { class: 'mk-rk' }, KL[b.kind]), h('span', { class: 'mk-rf' }, b.fmt + (b.dur ? ' · ' + b.dur : '')), h('span', { class: 'tk-chip' }, b.lang.toUpperCase()),
        h('span', { class: 'tk-chip ' + kc(b) }, compat(b)), h('button', { class: 'tk-ico', onclick: e => { e.stopPropagation(); st.insp = b.id; st.orig = false; drawInsp(); } }, 'ⓘ'));
    };
    const drawMain = () => {
      main.innerHTML = '';
      if (st.nav === 'dev') return drawDevice();
      if (st.nav === 'jobs') return drawJobs();
      const L = list();
      const tabs = h('div', { class: 'mk-tabs' }, ...[['all', T('Tout', 'All')], ['book', KL.book], ['comic', KL.comic], ['audio', KL.audio]].map(([k, l]) => h('button', { class: 'mk-tab' + (st.kind === k ? ' on' : ''), onclick: () => { st.kind = k; sfx.tick(); drawMain(); } }, l, h('em', {}, String(cnt(k))))));
      const tools = h('div', { class: 'mk-tools' }, tabs, h('span', { class: 'tk-sp' }), h('span', { class: 'mk-lg' }, '🌐 ' + (st.langs.size ? [...st.langs].map(x => x.toUpperCase()).join(' · ') : T('Toutes', 'All'))),
        h('div', { class: 'mk-seg' }, h('button', { class: 'tk-ico' + (st.view === 'grid' ? ' on' : ''), onclick: () => { st.view = 'grid'; sfx.tick(); drawMain(); } }, '▦'), h('button', { class: 'tk-ico' + (st.view === 'list' ? ' on' : ''), onclick: () => { st.view = 'list'; sfx.tick(); drawMain(); } }, '☰')));
      const body = h('div', { class: 'tk-scroll mk-gal' }, L.length ? h('div', { class: st.view === 'grid' ? 'mk-grid' : 'mk-list' }, ...L.map(st.view === 'grid' ? card : row)) : h('p', { class: 'tk-dim mk-empty' }, st.kind === 'comic' && !st.q ? T('Cherche une BD par titre ou par auteur.', 'Search for a comic by title or author.') : T('Aucun résultat.', 'No results.')),
        h('div', { class: 'mk-more' }, st.more < MORE.length ? h('button', { class: 'tk-pill', onclick: () => { st.more = Math.min(MORE.length, st.more + 4); sfx.click(); draw(); } }, T('Afficher plus de résultats', 'Show more results')) : null));
      main.append(tools, body, sendBar());
    };
    const sendBar = () => {
      const picked = [...st.sel].map(byId).filter(Boolean), au = picked.filter(b => b.kind === 'audio').length;
      const bar_ = h('div', { class: 'mk-send' + (picked.length ? ' on' : '') });
      if (!picked.length) return bar_;
      const canKobo = st.kobo && au < picked.length;
      bar_.append(h('b', {}, T(`${picked.length} sélectionné${picked.length > 1 ? 's' : ''}`, `${picked.length} selected`)), h('span', { class: 'tk-dim' }, au ? T(`${au} audio : Drive seulement`, `${au} audio: Drive only`) : ''), h('span', { class: 'tk-sp' }),
        h('button', { class: 'tk-btn', onclick: () => { st.sel.clear(); sfx.tick(); drawMain(); drawInsp(); } }, T('Vider', 'Clear')),
        h('button', { class: 'tk-btn', onclick: () => send('drive') }, T('Envoyer sur Drive', 'Send to Drive')),
        h('button', { class: 'tk-btn pri', disabled: !canKobo, title: canKobo ? '' : T('Branche la liseuse Kobo en USB', 'Plug in the Kobo over USB'), onclick: () => send('kobo') }, T('Envoyer sur la Kobo', 'Send to the Kobo')));
      return bar_;
    };

    /* ——— envois ——— */
    const STG = () => [T('En attente', 'Waiting'), T('Recherche du fichier', 'Resolving'), T('Téléchargement', 'Downloading'), T('Conversion KEPUB', 'KEPUB conversion'), T('Copie', 'Copying'), T('Terminé', 'Done')];
    const send = dest => {
      const picked = [...st.sel].map(byId).filter(b => b && (dest === 'drive' || b.kind !== 'audio'));
      if (!picked.length) return;
      st.jobs = st.jobs.filter(j => j.stage < 5);
      picked.forEach(b => st.jobs.push({ b, dest, stage: 0, p: 0 }));
      st.sel.clear(); st.nav = 'jobs'; sfx.click(); draw(); run();
    };
    const run = async () => {
      if (st.run) return; st.run = true;
      for (let j; (j = st.jobs.find(x => x.stage === 0));) {
        const step = async (s, ms) => { j.stage = s; j.p = 0; if (st.nav === 'jobs') drawMain(); await wait(reduced() ? 40 : ms); };
        await step(1, 450); j.stage = 2;
        for (let i = 1; i <= 10; i++) { j.p = i / 10; if (st.nav === 'jobs') upd(j); await wait(reduced() ? 10 : 110); }
        if (j.dest === 'kobo' && j.b.fmt === 'EPUB' && st.kepub) await step(3, 500);
        await step(4, 380); j.stage = 5; j.p = 1;
        if (j.dest === 'kobo') { st.dev.unshift({ title: j.b.title, author: j.b.author, fmt: j.b.fmt === 'EPUB' && st.kepub ? 'KEPUB' : j.b.fmt, size: j.b.fmt === 'CBZ' ? '4,1 Mo' : '0,6 Mo' }); st.free = Math.max(0, st.free - .004); }
        sfx.done(); draw();
      }
      st.run = false;
      if (st.jobs.length) toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Envoi terminé.', 'Transfer finished.') });
    };
    const upd = j => { const e = main.querySelector(`[data-j="${st.jobs.indexOf(j)}"] i`); if (e) e.style.width = j.p * 100 + '%'; };
    const drawJobs = () => {
      main.append(h('div', { class: 'mk-tools' }, h('b', { class: 'mk-h' }, T('Envois', 'Sends')), h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn', onclick: () => { st.jobs = st.jobs.filter(j => j.stage < 5); draw(); } }, T('Effacer les terminés', 'Clear finished'))),
        h('div', { class: 'tk-scroll mk-gal' }, st.jobs.length ? st.jobs.map((j, i) => h('div', { class: 'mk-job', 'data-j': i }, h('div', { class: 'mk-th', style: { background: grad(j.b) } }), h('div', { class: 'mk-rt' }, h('b', {}, j.b.title), h('span', {}, (j.dest === 'kobo' ? 'Kobo' : 'Google Drive') + ' · ' + STG()[j.stage])),
          h('div', { class: 'tk-bar2 mk-pb' }, h('i', { style: { width: j.p * 100 + '%' } })), h('span', { class: 'tk-chip ' + (j.stage === 5 ? 'ok' : 'ac') }, j.stage === 5 ? '✓' : STG()[j.stage]))) : h('p', { class: 'tk-dim mk-empty' }, T('Aucun envoi en cours. Sélectionne des titres dans Découvrir.', 'No sends yet. Select titles in Discover.'))));
    };
    const drawDevice = () => {
      main.append(h('div', { class: 'mk-tools' }, h('b', { class: 'mk-h' }, T('Ma liseuse', 'My e-reader'))), h('div', { class: 'tk-scroll mk-gal' },
        st.kobo ? [h('div', { class: 'tk-card mk-dev' }, h('div', {}, h('b', {}, 'Kobo Libra Colour'), h('div', { class: 'tk-dim' }, `USB · N428 · ${T('micrologiciel', 'firmware')} 4.45`)), h('div', { class: 'mk-sp' }, h('div', { class: 'tk-bar2' }, h('i', { style: { width: (100 - st.free / 29 * 100) + '%' } })), h('span', { class: 'tk-dim' }, T(`${st.free.toFixed(1).replace('.', ',')} Go libres sur 29 Go`, `${st.free.toFixed(1)} GB free of 29 GB`))),
          h('button', { class: 'tk-btn', onclick: () => { st.kobo = false; sfx.click(); toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Kobo éjectée en toute sécurité.', 'Kobo ejected safely.') }); draw(); } }, T('Éjecter', 'Eject'))),
          h('div', { class: 'tk-h' }, T('Livres sur la liseuse', 'Books on the e-reader')), h('div', { class: 'mk-list' }, ...st.dev.map(d => h('div', { class: 'mk-row' }, h('div', { class: 'mk-th', style: { background: grad({ title: d.title }) } }), h('div', { class: 'mk-rt' }, h('b', {}, d.title), h('span', {}, d.author)), h('span', { class: 'mk-rf' }, d.fmt), h('span', { class: 'tk-dim' }, d.size))))]
          : h('div', { class: 'mk-empty' }, h('p', { class: 'tk-dim' }, T('Kobo débranchée. Branche la liseuse en USB pour voir ses livres.', 'Kobo not connected. Plug the e-reader in over USB to see its books.')), h('button', { class: 'tk-btn pri', onclick: () => { st.kobo = true; sfx.done(); draw(); } }, T('Brancher la Kobo (démo)', 'Connect the Kobo (demo)')))));
    };

    /* ——— fiche ——— */
    const drawInsp = () => {
      insp.innerHTML = ''; const b = st.insp && byId(st.insp); insp.hidden = !b; if (!b) return;
      const s = summary(b), on = st.sel.has(b.id);
      insp.append(h('button', { class: 'tk-ico mk-x', onclick: () => { st.insp = null; drawInsp(); } }, '✕'), cover(b, 1), h('h4', {}, b.title), h('div', { class: 'tk-dim' }, b.author),
        h('div', { class: 'mk-tags' }, h('span', { class: 'tk-chip ac' }, KL[b.kind]), h('span', { class: 'tk-chip' }, b.lang.toUpperCase()), b.yr ? h('span', { class: 'tk-chip' }, String(b.yr)) : null, h('span', { class: 'tk-chip ' + kc(b) }, compat(b))),
        h('div', { class: 'tk-dim' }, T('Source : ', 'Source: ') + SRC[b.src]), h('p', { class: 'mk-sum' }, s.text), s.tr ? h('button', { class: 'mk-lnk', onclick: () => { st.orig = !st.orig; drawInsp(); } }, st.orig ? T('Voir la traduction', 'Show translation') : T('Traduit automatiquement par macOS · Voir l’original', 'Translated automatically by macOS · Show original')) : null,
        h('div', { class: 'tk-h' }, T('Fichier à envoyer', 'File to send')), h('div', { class: 'tk-card mk-file' }, '▤ ' + b.fmt + (b.dur ? ' · ' + b.dur : '')),
        h('div', { class: 'tk-sp' }), h('div', { class: 'mk-acts' }, h('button', { class: 'tk-btn', onclick: () => toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Ouvre la page de la source dans le navigateur.', 'Opens the source page in the browser.') }) }, '↗ ' + T('Page source', 'Source page')), h('button', { class: 'tk-btn pri', onclick: () => toggle(b.id) }, on ? '✓ ' + T('Sélectionné', 'Selected') : T('Sélectionner', 'Select'))));
    };

    /* ——— boutique Kobo (tiroir) ——— */
    const dr = h('div', { class: 'mk-drawer' }), tab = h('button', { class: 'mk-tabdr', onclick: () => { st.store = true; sfx.click(); drawStore(); } }, '⌃ ' + T('Boutique', 'Store'));
    const drawStore = () => {
      dr.classList.toggle('open', st.store); if (st.store) st.opened = true; tab.hidden = st.store || !st.opened; dr.innerHTML = '';
      const q = (st.sq || st.q || '').toLowerCase(), items = STORE.filter(x => !q || (x[0] + x[1]).toLowerCase().includes(q));
      dr.append(h('div', { class: 'mk-grip', onclick: () => { st.store = false; sfx.tick(); drawStore(); } }, h('span', {}, '⌄'), h('i')),
        h('div', { class: 'mk-nav' }, h('button', { class: 'tk-ico' }, '‹'), h('button', { class: 'tk-ico' }, '›'), h('button', { class: 'tk-ico' }, '↻'), h('input', { class: 'tk-in', value: 'https://www.kobo.com/fr/fr/search' + (st.q ? '?query=' + st.q : ''), readonly: true }), st.login ? h('button', { class: 'tk-ico', title: T('Oublier l’identifiant', 'Forget login'), onclick: () => { st.login = false; drawStore(); } }, '🔑') : null),
        !st.login ? h('div', { class: 'mk-call' }, '🔑 ' + T('Enregistrer cet identifiant dans le Trousseau ? Il sera rempli à ta prochaine connexion.', 'Save this login in the Keychain? It will be filled in next time you sign in.'), h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn sm pri', onclick: () => { st.login = true; sfx.done(); drawStore(); } }, T('Enregistrer', 'Save')), h('button', { class: 'tk-btn sm', onclick: () => { st.login = true; drawStore(); } }, T('Non', 'No'))) : null,
        st.dl ? h('div', { class: 'mk-call' }, '⬇ ' + T(`${st.dl} enregistré dans Téléchargements`, `${st.dl} saved in Downloads`), h('span', { class: 'tk-sp' }), h('button', { class: 'tk-btn sm pri', onclick: () => { const t = st.dl.replace('.epub', ''); st.dev.unshift({ title: t, author: '', fmt: 'EPUB', size: '0,4 Mo' }); st.dl = null; sfx.done(); toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Envoyé sur la Kobo.', 'Sent to the Kobo.') }); drawStore(); draw(); } }, T('Envoyer sur la Kobo', 'Send to the Kobo')), h('button', { class: 'tk-btn sm', onclick: () => { st.dl = null; drawStore(); } }, '✕')) : null,
        h('div', { class: 'mk-page' }, h('div', { class: 'mk-sh' }, h('b', {}, 'Rakuten Kobo'), h('input', { class: 'tk-in', placeholder: T('Rechercher un titre, un auteur…', 'Search a title, an author…'), value: st.sq, oninput: e => { st.sq = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { const f = dr.querySelector('.mk-sh input'); drawStore(); dr.querySelector('.mk-sh input').focus(); dr.querySelector('.mk-sh input').setSelectionRange(st.sq.length, st.sq.length); }, 350); } })),
          h('div', { class: 'tk-dim mk-res' }, T(`${items.length} résultats`, `${items.length} results`)),
          ...items.map(x => h('div', { class: 'mk-it' }, h('div', { class: 'mk-th', style: { background: grad({ title: x[0] }) } }), h('div', { class: 'mk-rt' }, h('b', {}, x[0]), h('span', {}, x[1])), h('b', { class: 'mk-pr' }, x[2]),
            h('button', { class: 'tk-btn sm' + (x[3] ? '' : ' pri'), onclick: () => { if (x[3]) { st.dl = x[0] + '.epub'; sfx.done(); } else { sfx.click(); toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Achat simulé : dans l’appli, le livre arrive sur la liseuse par ton compte Kobo (Wi-Fi).', 'Simulated purchase: in the app, the book reaches the reader through your Kobo account (Wi-Fi).') }); } drawStore(); } }, x[3] ? T('Télécharger l’EPUB', 'Download EPUB') : T('Acheter', 'Buy'))))));
    };

    /* ——— barre du haut et réglages ——— */
    const q = h('input', { class: 'tk-in mk-q', type: 'search', placeholder: T('Titre, auteur, série…', 'Title, author, series…'), 'aria-label': 'search', oninput: e => { st.q = e.target.value; if (st.nav !== 'disc') st.nav = 'disc'; draw(); } });
    const pills = h('span', { class: 'mk-pills' });
    const drawPills = () => { pills.innerHTML = ''; pills.append(h('button', { class: 'mk-pill', onclick: () => { st.kobo = !st.kobo; sfx.click(); draw(); } }, h('i', { class: st.kobo ? 'ok' : '' }), st.kobo ? 'Kobo Libra Colour' : T('Kobo débranchée', 'Kobo not connected'), st.kobo ? h('small', {}, `USB · ${st.free.toFixed(1).replace('.', ',')} ${T('Go libres', 'GB free')}`) : null),
      h('button', { class: 'mk-pill', onclick: () => toast({ icon: icon('mKOBO'), title: 'mKOBO', body: T('Dossier Google Drive : Mon Drive › Livres', 'Google Drive folder: My Drive › Books') }) }, '☁ ' + T('Dossier Drive', 'Drive folder')),
      h('button', { class: 'tk-ico', title: T('Réglages', 'Settings'), onclick: settings }, '⚙')); };
    const settings = () => { const r = (l, on, k) => h('div', { class: 'mk-set' }, h('span', {}, l), sw(on, v => { st[k] = v; })); dialog(root, T('Réglages', 'Settings'), h('div', { class: 'mk-sets' }, r(T('Classer par auteur', 'Sort by author'), st.byAuthor, 'byAuthor'), r(T('Convertir en KEPUB (affichage plus fluide)', 'Convert to KEPUB (smoother display)'), st.kepub, 'kepub'), r(T('Éjecter la liseuse après l’envoi', 'Eject the e-reader after sending'), st.eject, 'eject'), h('p', { class: 'tk-dim' }, T('Dossier sur la liseuse : mKOBO · Mise à jour automatique : activée', 'Folder on the e-reader: mKOBO · Automatic updates: on'))), [T('Fermer', 'Close'), 'pri']); };
    const draw = () => { drawPills(); drawSide(); drawMain(); drawInsp(); };
    main.append(); root.append(bar(app, w, q, h('span', { class: 'tk-sp' }), pills), h('div', { class: 'tk-body' }, side, main, insp), dr, tab);
    draw(); drawStore(); return root;
  });
}
