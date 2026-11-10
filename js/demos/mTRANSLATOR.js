/* Réplique interactive de mTRANSLATOR (interface Socle) : ouvrir un plugin d'exemple, dictionnaires SST, traduction automatique,
   protection des balises, validation ligne à ligne, enregistrement. Données fictives : aucun fichier n'est lu, aucun réseau. */
import { lang } from '../i18n.js';
import { h, brand, esc, wait, reduced, clamp, T, num, sfx, wm, toast, icon, download, css, S } from './kit.js';
css('css/demos/mTRANSLATOR.css');

/* Nom d'appli dans les textes : la lettre minuscule initiale prend la couleur du logo (règle Socle), jamais dans un menu déroulant. */
const NAMES = { mORTEX: '#f59e0b', mABBAJACK: '#5aa9ff', csSETTINGS: '#38bdf8', mTRANSLATOR: '#4285f4' }, NRE = /\b(mORTEX|mABBAJACK|csSETTINGS|mTRANSLATOR)\b/;
function tint(el) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => (NRE.test(n.nodeValue) && !n.parentNode.closest('.lc,input,textarea,select,option,[data-nobrand],.mtx-pop,.mtr-menu,.mbj-menu,.csx-menu') ? 1 : 3) }), list = [];
  while (tw.nextNode()) list.push(tw.currentNode);
  list.forEach(n => { const sp = document.createElement('span'); sp.innerHTML = esc(n.nodeValue).replace(new RegExp(NRE.source, 'g'), m => brand(m, NAMES[m])); n.replaceWith(...sp.childNodes); });
}

/* ---------- icônes (traits fins) ---------- */
const P = {
  open: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', save: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z', undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', swap: 'M4 7h12l-3-3M20 17H8l3 3',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13', layers: 'M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  home: 'M3 11l9-8 9 8M5 10v10h14V10', check: 'M4 12l5 5L20 6', down: 'M6 9l6 6 6-6', copy: 'M9 9h11v11H9zM5 15V5a2 2 0 0 1 2-2h8', x: 'M6 6l12 12M18 6L6 18'
};
const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const ic = n => h('span', { class: 'mtr-ico', html: svg(n), style: { display: 'inline-grid' } });
const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="6" width="40" height="52" rx="6"/><path d="M22 6v14l5-4 5 4V6"/><path d="M24 48l8-20 8 20M27.5 41h9"/></svg>';

/* ---------- données d'exemple : { fr, es, it } ---------- */
const L3 = (fr, es, it) => ({ fr, es, it });
const R = (formId, edid, type, src, st, o = {}) => ({ formId, edid, type, src, st, ...o });
const PROJECTS = {
  skyrim: { game: 'Skyrim Special Edition', base: 'Wyrmstooth_Localisation', ext: 'esp', recs: [
    R('0001D401', 'WT_QuestIntro_Stage10', 'QUST', 'Speak to <Alias=Lorie> at the Bannered Mare in Whiterun.', 'ok', { tr: L3('Parlez à <Alias=Lorie> à la Jument Pavoisée de Blancherive.', 'Habla con <Alias=Lorie> en la Yegua Engalanada de Carrera Blanca.', 'Parla con <Alias=Lorie> alla Giumenta Imbandierata di Whiterun.') }),
    R('0001D402', 'WT_DragonBane_Blade', 'WEAP', 'Wyrmfang Greatsword', 'ok', { tr: L3('Espadon de Croc-de-Wyrm', 'Mandoble Colmillo de Wyrm', 'Spadone Zanna di Wyrm') }),
    R('0001D403', 'WT_DragonBane_Desc', 'DESC', 'Deals <mag> points of frost damage and reduces dragon resistance by <25>%.', 'ok', { tr: L3('Inflige <mag> points de dégâts de givre et réduit la résistance des dragons de <25> %.', 'Inflige <mag> puntos de daño de escarcha y reduce la resistencia de los dragones un <25> %.', 'Infligge <mag> punti di danno da gelo e riduce la resistenza dei draghi del <25>%.') }),
    R('0001D404', 'WT_Dial_Captain_01', 'DIAL', 'The winds around Wyrmstooth Island are cursed. No normal boat can cross without magical warding.', 'todo', { sst: [85, L3('Les vents autour de l’île sont maudits. Aucun bateau ordinaire ne peut traverser sans protection magique.', 'Los vientos alrededor de la isla están malditos. Ningún barco normal puede cruzar sin protección mágica.', 'I venti attorno all’isola sono maledetti. Nessuna barca normale può attraversare senza una protezione magica.')],
      ai: L3('Les vents qui soufflent autour de l’île de Wyrmstooth sont maudits. Aucun bateau ordinaire ne peut la traverser sans protection magique.', 'Los vientos que soplan alrededor de la isla de Wyrmstooth están malditos. Ningún barco normal puede cruzarla sin protección mágica.', 'I venti attorno all’isola di Wyrmstooth sono maledetti. Nessuna barca normale può attraversarla senza una protezione magica.') }),
    R('0001D405', 'WT_Dial_Captain_02', 'INFO', 'Hold on tight, <Alias=Player>! We are approaching the volcanic ridge.', 'todo', { ai: L3('Accrochez-vous bien, <Alias=Player> ! Nous approchons de la crête volcanique.', '¡Agárrate fuerte, <Alias=Player>! Nos acercamos a la cresta volcánica.', 'Tieniti forte, <Alias=Player>! Ci stiamo avvicinando alla cresta vulcanica.') }),
    R('0001D406', 'WT_Book_AncientJournal', 'BOOK', '<font face="$HandwrittenFont" size="20">Day 14:</font>\n\nThe beast sleeps within the barrow.[pagebreak]<font face="$HandwrittenFont" size="20">Day 15:</font>\n\nThe seals are trembling. May the Divines protect us.', 'ok', {
      tr: L3('<font face="$HandwrittenFont" size="20">Jour 14 :</font>\n\nLa bête sommeille au cœur du tertre.[pagebreak]<font face="$HandwrittenFont" size="20">Jour 15 :</font>\n\nLes sceaux tremblent. Que les Divins nous protègent.', '<font face="$HandwrittenFont" size="20">Día 14:</font>\n\nLa bestia duerme dentro del túmulo.[pagebreak]<font face="$HandwrittenFont" size="20">Día 15:</font>\n\nLos sellos tiemblan. Que los Divinos nos protejan.', '<font face="$HandwrittenFont" size="20">Giorno 14:</font>\n\nLa bestia dorme nel tumulo.[pagebreak]<font face="$HandwrittenFont" size="20">Giorno 15:</font>\n\nI sigilli tremano. Che i Divini ci proteggano.') }),
    R('0001D406B', 'WT_Book_ExpeditionLog', 'BOOK', 'Volume I: The Lost Ruins of Wyrmstooth\n\nWe set camp beneath the shadow of the mountain.[pagebreak]Volume II: The Catacombs\n\nOnly ash and whispering stones remain.', 'todo', {
      ai: L3('Volume I : Les ruines perdues de Wyrmstooth\n\nNous avons dressé le camp à l’ombre de la montagne.[pagebreak]Volume II : Les catacombes\n\nIl ne reste que de la cendre et des pierres qui murmurent.', 'Volumen I: Las ruinas perdidas de Wyrmstooth\n\nInstalamos el campamento a la sombra de la montaña.[pagebreak]Volumen II: Las catacumbas\n\nSolo quedan cenizas y piedras susurrantes.', 'Volume I: Le rovine perdute di Wyrmstooth\n\nAbbiamo piantato il campo all’ombra della montagna.[pagebreak]Volume II: Le catacombe\n\nRestano solo cenere e pietre sussurranti.') }),
    R('0001D407', 'WT_MCM_Setting_Difficulty', 'MCM', 'Dragon Combat AI Behavior\nSelect between Vanilla tactics or Enhanced aerial sweep attacks.', 'partial', { tr: L3('Comportement IA des dragons\nChoisissez entre tactiques classiques ou attaques en piqué améliorées.', 'Comportamiento de IA de los dragones\nElige entre tácticas clásicas o ataques aéreos mejorados.', 'Comportamento IA dei draghi\nScegli tra tattiche classiche o attacchi aerei potenziati.') }),
    R('0001D408', 'WT_Spell_FrostBreath_Name', 'SPEL', 'Glacial Torrent', 'ok', { tr: L3('Torrent glacial', 'Torrente glacial', 'Torrente glaciale') }),
    R('0001D409', 'WT_Item_AncientAmulet', 'ARMO', 'Amulet of the Old Gods', 'same'),
    R('0001D40A', 'WT_Error_Tag_Missing', 'MESG', 'Welcome back, <Alias=Player>! You have %d new bounties waiting.', 'partial', { tr: L3('Bon retour ! Vous avez de nouvelles primes en attente.', '¡Bienvenido de nuevo! Tienes nuevas recompensas pendientes.', 'Bentornato! Hai nuove taglie in attesa.'),
      ai: L3('Bon retour, <Alias=Player> ! Vous avez %d nouvelles primes en attente.', '¡Bienvenido de nuevo, <Alias=Player>! Tienes %d recompensas nuevas pendientes.', 'Bentornato, <Alias=Player>! Hai %d nuove taglie in attesa.') }),
    R('0001D40B', 'WT_Location_Fort', 'ACTI', 'Enter Forgotten Crypt', 'ok', { tr: L3('Pénétrer dans la crypte oubliée', 'Entrar en la cripta olvidada', 'Entra nella cripta dimenticata') }),
    R('0001D40C', 'WT_Dial_Necro_Combat', 'INFO', 'You should have stayed in the warm taverns of the south!', 'todo', { ai: L3('Vous auriez dû rester dans les chaudes tavernes du sud !', '¡Deberías haberte quedado en las cálidas tabernas del sur!', 'Avresti dovuto restare nelle calde taverne del sud!') }),
    R('0001D40D', 'WT_Door_Locked', 'MESG', 'This door is locked.', 'todo', { sst: [100, L3('Cette porte est verrouillée.', 'Esta puerta está cerrada con llave.', 'Questa porta è chiusa a chiave.')] }),
    R('0001D40E', 'WT_Msg_NewLocation', 'MESG', 'You have discovered a new location.', 'todo', { sst: [100, L3('Vous avez découvert un nouveau lieu.', 'Has descubierto un nuevo lugar.', 'Hai scoperto un nuovo luogo.')] }),
    R('0001D40F', 'WT_Potion_Healing', 'ALCH', 'Potion of Minor Healing', 'todo', { sst: [100, L3('Potion de soins mineurs', 'Poción de salud menor', 'Pozione di cura minore')] })] },
  fo4: { game: 'Fallout 4', base: 'SimSettlements2_Chapter3', ext: 'esp', recs: [
    R('0005F101', 'SS2_Plot_Industrial_01', 'ACTI', 'Scrap Scavenger Station', 'ok', { tr: L3('Poste de récupération de bric-à-brac', 'Puesto de recuperación de chatarra', 'Stazione di recupero rottami') }),
    R('0005F102', 'SS2_Holotape_HQ_Log', 'BOOK', 'COMMAND LOG #402\nSupplies running critically low. Gunner scouts spotted near the Commonwealth border.', 'ok', { tr: L3('JOURNAL DE COMMANDEMENT #402\nRavitaillement dangereusement bas. Éclaireurs des Artilleurs repérés près de la frontière du Commonwealth.', 'REGISTRO DE MANDO #402\nSuministros peligrosamente bajos. Exploradores Artilleros avistados cerca de la frontera de la Commonwealth.', 'REGISTRO DI COMANDO #402\nRifornimenti pericolosamente scarsi. Esploratori degli Artiglieri avvistati vicino al confine del Commonwealth.') }),
    R('0005F103', 'SS2_Quest_RadioBroadcast', 'QUST', 'Tune your Pip-Boy radio to frequency 88.4 to establish contact with Jake.', 'todo', { ai: L3('Réglez la radio de votre Pip-Boy sur la fréquence 88,4 pour entrer en contact avec Jake.', 'Sintoniza la radio de tu Pip-Boy en la frecuencia 88.4 para contactar con Jake.', 'Sintonizza la radio del tuo Pip-Boy sulla frequenza 88.4 per contattare Jake.') }),
    R('0005F104', 'SS2_Terminal_Output', 'MESG', 'Warning: Structural integrity at %d%%. Evacuate sector immediately.', 'ok', { tr: L3('Avertissement : intégrité structurelle à %d%%. Évacuez le secteur immédiatement.', 'Advertencia: integridad estructural al %d%%. Evacue el sector inmediatamente.', 'Avviso: integrità strutturale al %d%%. Evacuare subito il settore.') }),
    R('0005F105', 'SS2_Dial_Jake_Intro', 'DIAL', 'Look around you, kid. What do you see? A wasteland, or the foundation of a new nation?', 'todo', { ai: L3('Regarde autour de toi, gamin. Qu’est-ce que tu vois ? Un désert, ou les fondations d’une nouvelle nation ?', 'Mira a tu alrededor, chaval. ¿Qué ves? ¿Un páramo o los cimientos de una nueva nación?', 'Guardati intorno, ragazzo. Che cosa vedi? Un deserto o le fondamenta di una nuova nazione?') }),
    R('0005F106', 'SS2_Msg_Happiness', 'MESG', 'Settlement happiness has increased.', 'todo', { sst: [100, L3('Le bonheur de la colonie a augmenté.', 'La felicidad del asentamiento ha aumentado.', 'La felicità dell’insediamento è aumentata.')] })] },
  sf: { game: 'Starfield', base: 'Constellation_Overhaul', ext: 'esm', recs: [
    R('0009A001', 'SF_ShipPart_GravDrive', 'ARMO', 'Relativity IV Quantum Grav Drive', 'ok', { tr: L3('Astromoteur quantique Relativité IV', 'Motor gravitatorio cuántico Relatividad IV', 'Motore gravitazionale quantico Relatività IV') }),
    R('0009A002', 'SF_Perk_Astrodynamics_Desc', 'DESC', 'Increases maximum grav jump range by 30% and reduces he-3 fuel consumption.', 'ok', { tr: L3('Augmente la portée maximale de saut gravitationnel de 30 % et réduit la consommation d’hélium-3.', 'Aumenta el alcance máximo del salto gravitatorio un 30 % y reduce el consumo de helio-3.', 'Aumenta del 30% la portata massima del salto gravitazionale e riduce il consumo di elio-3.') }),
    R('0009A003', 'SF_Dial_Sarah_Artifact', 'DIAL', 'When I touch the artifact, the celestial music feels almost like a memory rather than an echo.', 'todo', { ai: L3('Quand je touche l’artefact, la musique céleste ressemble presque à un souvenir plutôt qu’à un écho.', 'Cuando toco el artefacto, la música celestial parece casi un recuerdo más que un eco.', 'Quando tocco l’artefatto, la musica celeste sembra quasi un ricordo più che un’eco.') }),
    R('0009A004', 'SF_Msg_FuelCritical', 'MESG', 'Fuel level critical.', 'todo', { sst: [100, L3('Niveau de carburant critique.', 'Nivel de combustible crítico.', 'Livello di carburante critico.')] })] }
};
const LANGS = { fr: 'Français', es: 'Español', it: 'Italiano' };
const TYPE_COL = { QUST: '#0ea5e9', WEAP: '#ef4444', DESC: '#8b5cf6', DIAL: '#14b8a6', INFO: '#3b82f6', BOOK: '#d97706', MCM: '#16a34a', SPEL: '#a855f7', ARMO: '#ea580c', MESG: '#64748b', ACTI: '#0891b2', ALCH: '#22c55e' };
const BATCH = [['IronholdArmory.esp', 'Skyrim SE', 1240, 1102], ['WinterfellQuests.esp', 'Skyrim SE', 3870, 3329], ['AmberRealm.esm', 'Skyrim SE', 612, 498]];
const TOK = /<[^>\n]+>|\[pagebreak\]|%[0-9.]*[sdif]|\n/g;
const tagList = s => s.match(/<[^>\n]+>|\[pagebreak\]|%[0-9.]*[sdif]/g) || [];
const words = s => s.trim().split(/\s+/).filter(Boolean).length;

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 690, x: 250, y: 88, minw: 940, minh: 640, bare: true, cls: 'socle mtr-win', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); }, build: w => build(app, w) });
}

function build(app, w) {
  const root = h('div', { class: 'mtr', tabindex: '-1' });
  const L = lang();
  const st = { mode: 'simple', tl: ['es', 'it'].includes(L) ? L : 'fr', view: 'home', proj: null, key: '', sel: 0, filter: 'all', q: '', type: 'all', hist: [], learned: 0, dict: { official: true, local: true }, engine: 'gemini', busy: false };
  let ui = {}, menuEl = null, msgTimer = 0;
  const alive = () => !w.dead;
  const recs = () => st.proj.recs;
  const cur = () => (st.proj ? recs()[st.sel] : null);
  const fileName = () => `${st.proj.base}_${st.tl.toUpperCase()}.${st.proj.ext}`;

  /* ---------- logique du texte ---------- */
  const missing = r => {
    if (!r.target) return [];
    const t = tagList(r.target), out = [];
    for (const g of tagList(r.src)) { const k = t.indexOf(g); if (k < 0) out.push(g); else t.splice(k, 1); }
    return out;
  };
  const kind = r => (r.status === 'todo' ? 'todo' : missing(r).length ? 'warn' : r.status === 'same' && !r.valid ? 'same' : r.status === 'partial' ? 'partial' : 'ok');
  const done = r => r.status === 'ok' || (r.status === 'same' && r.valid);
  const diagOf = r => (r.status === 'todo' && r.sst && st.dict.official ? { score: r.sst[0], text: r.sst[1][st.tl] } : { score: 0 });
  const stats = () => {
    const a = recs();
    return { total: a.length, done: a.filter(done).length, todo: a.filter(r => r.status === 'todo').length, partial: a.filter(r => r.status === 'partial' && !missing(r).length).length, warn: a.filter(r => r.status !== 'todo' && missing(r).length).length, same: a.filter(r => r.status === 'same' && !r.valid).length,
      exact: a.filter(r => diagOf(r).score === 100).length, fuzzy: a.filter(r => { const d = diagOf(r); return d.score >= 70 && d.score < 100; }).length, mod: a.filter(r => r.status === 'todo' && diagOf(r).score === 0).length, dirty: a.filter(r => r.dirty).length };
  };
  function tagged(text, brk) {
    const out = []; let last = 0, m; TOK.lastIndex = 0;
    while ((m = TOK.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const g = m[0];
      if (g === '\n') out.push(h('span', { class: 'mtr-nl' }, '↵'), brk ? '\n' : null);
      else if (g === '[pagebreak]') out.push(h('span', { class: 'mtr-tg pb', title: T('Saut de page de livre (ne jamais traduire)', 'Book page break (never translate)') }, '[pagebreak]'));
      else if (g[0] === '%') out.push(h('span', { class: 'mtr-tg fmt', title: T('Variable à conserver', 'Variable to keep') }, g));
      else out.push(h('span', { class: 'mtr-tg', title: T('Balise de jeu préservée', 'Game tag preserved') }, g));
      last = m.index + g.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  const statusText = r => ({ todo: T('Non traduit', 'Untranslated'), ok: T('Traduit et validé', 'Translated & validated'), partial: T('Traduit, à vérifier', 'Translated, to review'), same: T('Identique à l’original', 'Identical to the original'), warn: T('Alerte de balises', 'Tag alert') }[kind(r)]);
  const say = msg => { if (!ui.msg) return; ui.msg.textContent = msg; clearTimeout(msgTimer); msgTimer = setTimeout(() => { if (alive()) refreshStat(); }, 3600); };
  const offs = new Set(); w.cleanup = () => { clearTimeout(msgTimer); offs.forEach(f => f()); };
  const mine = () => S.active === w && !w.min;

  /* ---------- historique (annuler) ---------- */
  const snap = list => st.hist.push(list.map(r => [r, { ...r }]));
  const undo = () => {
    const last = st.hist.pop();
    if (!last) return say(T('Rien à annuler.', 'Nothing to undo.'));
    last.forEach(([r, b]) => Object.assign(r, b)); sfx.click(); refreshAll(); say(T('Dernière action annulée.', 'Last action undone.'));
  };

  /* ---------- menus déroulants ---------- */
  const closeMenu = () => { if (menuEl) { menuEl.remove(); menuEl = null; } };
  root.addEventListener('pointerdown', e => { if (menuEl && !menuEl.contains(e.target) && !e.target.closest('[data-menu]')) closeMenu(); }, true);
  function popMenu(anchor, items, head) {
    const had = menuEl && menuEl.dataset.for === anchor.dataset.menu; closeMenu(); if (had) return;
    const m = h('div', { class: 'mtr-menu', 'data-for': anchor.dataset.menu }, head ? h('div', { class: 'mtr-mh' }, head) : null,
      items.map(it => h('button', { class: it.on ? 'on' : '', onclick: () => { closeMenu(); it.fn(); } }, it.label)));
    root.append(m); menuEl = m;
    const a = anchor.getBoundingClientRect(), r = root.getBoundingClientRect(), sc = S.scale || 1;
    m.style.top = (a.bottom - r.top) / sc + 4 + 'px'; m.style.left = Math.max(8, Math.min((a.left - r.left) / sc, root.clientWidth - m.offsetWidth - 8)) + 'px';
  }

  /* ---------- feuilles (fenêtres internes) ---------- */
  function sheet(title, body, foot, wide) {
    const close = () => { sh.remove(); document.removeEventListener('keydown', esc, true); offs.delete(close); w.el.focus({ preventScroll: true }); };
    const esc = e => { if (e.key === 'Escape' && mine()) { e.stopPropagation(); if (!st.busy) close(); } };
    const sh = h('div', { class: 'mtr-sheet', onpointerdown: e => { if (e.target === sh && !st.busy) close(); } },
      h('div', { class: 'mtr-pan' + (wide ? ' wide' : ''), role: 'dialog', 'aria-label': title },
        h('div', { class: 'mtr-ph2' }, h('h4', {}, title), h('button', { class: 'x', 'aria-label': T('Fermer', 'Close'), onclick: () => { if (!st.busy) close(); } }, '×')),
        h('div', { class: 'mtr-pbd' }, body), foot ? h('div', { class: 'mtr-pft' }, foot) : null));
    document.addEventListener('keydown', esc, true); offs.add(close); root.append(sh); tint(sh); sh.firstChild.setAttribute('tabindex', '-1'); sh.firstChild.focus({ preventScroll: true });
    sh.firstChild.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    return { close, el: sh };
  }

  /* ---------- barre de titre ---------- */
  function barEl() {
    const seg = h('div', { class: 'ssegs' }, ['simple', 'expert'].map(m => h('button', { class: st.mode === m ? 'on' : '', onclick: () => { if (st.mode !== m) { st.mode = m; sfx.click(); render(); } } }, m === 'simple' ? 'Simple' : 'Expert')));
    const pair = h('button', { class: 'mtr-pair', 'data-menu': 'tl', onclick: e => popMenu(e.currentTarget, Object.entries(LANGS).map(([c, n]) => ({ label: n, on: c === st.tl, fn: () => setTarget(c) })), T('Langue cible', 'Target language')) },
      h('i', {}, 'English'), '→', h('b', {}, LANGS[st.tl]), ic('down'));
    ui.modif = h('span', { class: 'mtr-modif', hidden: true });
    return h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand(app.id, app.accent) }), h('span', { class: 'mtr-sub' }, '— ' + T('Traducteur de mods Bethesda pour macOS', 'Bethesda Mod Translator for macOS')),
      h('div', { class: 'mtr-bar' }, seg, ui.modif, st.view === 'edit' ? h('button', { class: 'sbtn sm', onclick: goHome }, ic('home'), ' ', T('Accueil', 'Home')) : null, pair,
        h('button', { class: 'sbtn sm', disabled: !app.download, onclick: () => download(app) }, T('Télécharger', 'Download'))));
  }
  function setTarget(c) {
    if (c === st.tl) return; st.tl = c; sfx.click();
    if (st.proj) { const k = st.key; loadProject(k, true); say(T(`Projet rechargé en ${LANGS[c]}.`, `Project reloaded in ${LANGS[c]}.`)); } else render();
  }
  function goHome() { st.view = 'home'; st.proj = null; sfx.click(); render(); }

  /* ---------- accueil ---------- */
  function homeView() {
    const home = h('div', { class: 'mtr-home', 'data-drop': T('Déposez votre fichier Bethesda ici', 'Drop your Bethesda file here') },
      h('div', { class: 'mtr-logo', html: LOGO }),
      h('h1', { html: brand(app.id, app.accent) }), h('div', { class: 'mtr-tag' }, T('Traducteur de plugins Bethesda · Édition macOS', 'Bethesda Plugin Translator · macOS Edition')),
      h('div', { class: 'mtr-lead' }, T('Ouvrez ou déposez un fichier .strings, .dlstrings, .ilstrings, .esp, .esm ou .pex.', 'Open or drop a .strings, .dlstrings, .ilstrings, .esp, .esm or .pex file.')),
      h('div', { class: 'mtr-btns' },
        h('button', { class: 'sbtn', onclick: batchSheet }, ic('layers'), T('Traitement par lots', 'Batch processing')),
        h('button', { class: 'sbtn act', onclick: openSheet }, ic('open'), T('OUVRIR UN FICHIER', 'OPEN A FILE')),
        h('button', { class: 'sbtn', onclick: dictSheet }, ic('book'), T('Dictionnaires', 'Dictionaries'))),
      h('hr', { class: 'mtr-hr' }),
      h('div', { class: 'mtr-demo' }, h('span', {}, T('Ou explorez un projet d’exemple intégré :', 'Or explore a built-in demo project:')),
        h('div', { class: 'mtr-chips' }, [['skyrim', 'Skyrim SE (Wyrmstooth)', ''], ['fo4', 'Fallout 4 (SS2)', ' fo'], ['sf', 'Starfield', ' fo']].map(([k, n, c]) => h('button', { class: 'mtr-pchip' + c, onclick: () => loadProject(k) }, n)))),
      h('button', { class: 'mtr-link', onclick: aboutSheet }, T('À propos', 'About')));
    const ok = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
    home.addEventListener('dragenter', e => { if (ok(e)) { e.preventDefault(); home.classList.add('drop'); } });
    home.addEventListener('dragover', e => { if (ok(e)) { e.preventDefault(); home.classList.add('drop'); } });
    home.addEventListener('dragleave', e => { if (!home.contains(e.relatedTarget)) home.classList.remove('drop'); });
    home.addEventListener('drop', e => { if (!ok(e)) return; e.preventDefault(); home.classList.remove('drop'); loadProject('skyrim'); toast({ icon: icon(app.id), title: app.id, body: T('Démo : votre fichier n’est pas lu, un plugin d’exemple est ouvert.', 'Demo: your file is not read, a sample plugin is opened instead.') }); });
    return home;
  }
  function openSheet() {
    const s = sheet(T('Ouvrir un plugin ou un texte MCM', 'Open a plugin or an MCM text'), [
      h('p', {}, T('Démo : choisissez un plugin d’exemple. Vos propres fichiers ne sont jamais lus.', 'Demo: pick a sample plugin. Your own files are never read.')),
      h('div', { class: 'mtr-files' }, [['skyrim', 'Skyrim Special Edition'], ['fo4', 'Fallout 4'], ['sf', 'Starfield']].map(([k, g]) => h('button', { class: 'mtr-fl', onclick: () => { s.close(); loadProject(k); } },
        ic('open'), h('span', { class: 'mono' }, `${PROJECTS[k].base}.${PROJECTS[k].ext}`), h('small', {}, `${g} · ${PROJECTS[k].recs.length} ${T('chaînes', 'strings')}`))))],
    h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')));
  }
  function aboutSheet() {
    const s = sheet(T('À propos de mTRANSLATOR', 'About mTRANSLATOR'), [h('p', {}, T('Traduction de mods Bethesda (Skyrim SE, Fallout 4, Starfield), native sur macOS. Inspirée du logiciel de référence xTranslator, compatible avec ses dictionnaires SST.', 'Translation of Bethesda mods (Skyrim SE, Fallout 4, Starfield), native on macOS. Inspired by the reference tool xTranslator, compatible with its SST dictionaries.')),
      h('p', {}, T('Lecture et écriture natives des plugins .esp, .esm, .esl et des tables .strings. Mémoire locale auto-apprenante, Google Traduction ou Gemini, protection des balises du jeu. Licence MIT.', 'Native reading and writing of .esp, .esm, .esl plugins and .strings tables. Self-learning local memory, Google Translate or Gemini, game-tag protection. MIT licence.'))],
    h('button', { class: 'sbtn', onclick: () => s.close() }, T('Fermer', 'Close')));
  }

  /* ---------- projet ---------- */
  function makeProject(key) {
    const d = PROJECTS[key];
    return { game: d.game, base: d.base, ext: d.ext, recs: d.recs.map((r, i) => ({ ...r, id: i, target: r.st === 'todo' ? '' : r.st === 'same' ? r.src : r.tr[st.tl], status: r.st, valid: r.st === 'ok', by: r.st === 'ok' ? '' : r.st === 'partial' ? T('Mémoire', 'Memory') : '', dirty: false })) };
  }
  function loadProject(key, quiet) {
    st.key = key; st.proj = makeProject(key); st.view = 'edit'; st.hist = []; st.q = ''; st.type = 'all'; st.filter = 'all';
    const first = recs().findIndex(r => r.status === 'todo'); st.sel = first < 0 ? 0 : first;
    sfx.open(); render(); if (!quiet) say(T(`Projet d’exemple chargé : ${fileName()} (${st.proj.game})`, `Sample project loaded: ${fileName()} (${st.proj.game})`));
  }

  /* ---------- rendu général ---------- */
  function render() {
    closeMenu(); ui = {}; root.className = 'mtr' + (st.mode === 'expert' ? ' mtr-x' : '');
    root.replaceChildren(barEl(), ...(st.view === 'home' ? [homeView()] : editorView()).filter(Boolean));
    if (st.view === 'edit') { refreshAll(); }
    tint(root);
  }
  function editorView() {
    ui.proj = h('div', { class: 'mtr-proj' }); ui.tool = toolbar(); ui.diag = h('div', { class: 'mtr-diag' }); ui.why = h('div', { class: 'mtr-why', hidden: true });
    ui.hd = h('div', { class: 'mtr-hd' }, h('span', { title: T('Statut de traduction', 'Translation status') }, T('ST.', 'ST.')),
      st.mode === 'expert' ? [h('span', {}, 'FORMID'), h('span', {}, 'TYPE'), h('span', {}, T('ID ÉDITEUR', 'EDITOR ID'))] : null, h('span', {}, T('ORIGINAL (VO)', 'ORIGINAL')), h('span', {}, T('TRADUCTION', 'TRANSLATION') + ` (${LANGS[st.tl].toUpperCase()}) & ${T('INDICATEUR', 'INDICATOR')}`));
    ui.rows = h('div', { class: 'mtr-rows', onscroll: closeMenu }); ui.ed = h('section', { class: 'mtr-ed' });
    ui.stat = h('div', { class: 'mtr-stat' }, ui.msg = h('span', {}), h('span', { class: 'sp' }), h('span', { class: 'sc' }));
    return [ui.proj, ui.tool, st.mode === 'expert' ? ui.diag : null, ui.why, h('div', { class: 'mtr-tab' }, ui.hd, ui.rows), ui.ed, ui.stat];
  }
  function refreshAll() { refreshHead(); drawRows(); drawEditor(); }

  /* ---------- en-tête, barre d'outils, diagnostic, barre d'état ---------- */
  function toolbar() {
    const b = (cls, ico, label, fn, title) => h('button', { class: 'sbtn sm ' + cls, title: title || '', onclick: fn }, ico ? ic(ico) : null, label ? [' ', label] : null);
    const find = h('label', { class: 'mtr-find' }, h('span', { html: svg('search') }), ui.q = h('input', { type: 'search', placeholder: T('Chercher un texte', 'Search for a text'), 'aria-label': T('Chercher', 'Search'), value: st.q, oninput: e => { st.q = e.target.value; drawRows(); } }));
    const seg = h('div', { class: 'ssegs', role: 'group', 'aria-label': T('Lignes affichées', 'Rows shown') },
      ui.segTodo = h('button', { onclick: () => setFilter('todo') }), ui.segAll = h('button', { onclick: () => setFilter('all') }));
    const validate = h('button', { class: 'sbtn act sm go', title: T('Valider la ligne et passer à la suivante (F10)', 'Validate the line and go to the next (F10)'), onclick: () => validateNext(false) }, ic('check'), st.mode === 'expert' ? T('VALIDER', 'VALIDATE') : T('VALIDER ET SUIVANT', 'VALIDATE AND NEXT'), h('kbd', {}, 'F10'));
    const open = b('go', 'open', T('Ouvrir', 'Open'), openSheet), save = b('go', 'save', T('Enregistrer', 'Save'), saveSheet, '⌘S'), auto = b('go', 'spark', T('Traduire (IA)', 'Auto-translate'), () => aiSheet(null), T('Traduire automatiquement les textes restants', 'Automatically translate the remaining texts')), un = b('go', 'undo', T('Annuler', 'Undo'), undo, '⌘Z');
    if (st.mode === 'simple') return h('div', { class: 'mtr-tool' }, open, save, auto, un, seg, find, h('span', { class: 'sp' }), validate);
    ui.dictBtn = b('go', 'book', '', dictSheet);
    const type = h('button', { class: 'sbtn sm go', 'data-menu': 'type', onclick: e => popMenu(e.currentTarget, [{ label: T('Tous les types', 'All types'), on: st.type === 'all', fn: () => setType('all') }, ...[...new Set(recs().map(r => r.type))].sort().map(t => ({ label: t, on: st.type === t, fn: () => setType(t) }))], T('TYPE D’ENREGISTREMENT', 'RECORD TYPE')) }, ic('layers'), ' ', ui.typeLab = h('span'), ic('down'));
    return h('div', { class: 'mtr-tool x2' },
      h('div', { class: 'mtr-tr' }, open, save, auto, un, ui.dictBtn, h('span', { class: 'sp' }), validate, b('ico', 'chart', '', statsSheet, T('Statistiques et rapport', 'Statistics and report')), b('ico', 'swap', '', replaceSheet, T('Rechercher et remplacer', 'Find and replace')), b('ico', 'layers', '', batchSheet, T('Traitement par lots', 'Batch processing'))),
      h('div', { class: 'mtr-tr' }, seg, type, find));
  }
  function setFilter(f) { st.filter = f; sfx.tick(); const v = visible(); if (!v.includes(st.sel) && v.length) st.sel = v[0]; refreshHead(); drawRows(); drawEditor(); }
  function setType(t) { st.type = t; const v = visible(); if (!v.includes(st.sel) && v.length) st.sel = v[0]; refreshHead(); drawRows(); drawEditor(); }

  function refreshHead() {
    if (!st.proj) return;
    const s = stats(), pct = s.total ? Math.round(s.done / s.total * 100) : 0;
    ui.proj.replaceChildren(ic('open'), h('span', { class: 'lab' }, T('PLUGIN OUVERT', 'OPEN PLUGIN')), h('h3', {}, fileName()),
      h('div', { class: 'mtr-prog' + (pct === 100 ? ' full' : '') }, h('div', { class: 'sprog', role: 'progressbar', 'aria-valuenow': pct }, h('i', { style: { width: pct + '%' } })), h('b', {}, pct + ' % ' + T('traduit', 'translated'))));
    ui.segTodo.textContent = `${T('À traduire', 'To translate')} (${s.todo})`; ui.segAll.textContent = `${T('Tout', 'All')} (${s.total})`;
    ui.segTodo.className = st.filter === 'todo' ? 'on' : ''; ui.segAll.className = st.filter === 'all' ? 'on' : '';
    if (ui.typeLab) ui.typeLab.textContent = T('Type : ', 'Type: ') + (st.type === 'all' ? T('tous', 'all') : st.type);
    if (ui.dictBtn) ui.dictBtn.replaceChildren(ic('book'), ' ', T('Dictionnaires', 'Dictionaries'), h('span', { class: 'chip', style: { marginLeft: '4px' } }, '+' + num(22946 + st.learned)));
    ui.modif.hidden = !s.dirty; ui.modif.textContent = T(`${s.dirty} modif.`, `${s.dirty} edit${s.dirty > 1 ? 's' : ''}`);
    drawDiag(s); refreshStat(s);
  }
  function drawDiag(s) {
    if (st.mode !== 'expert') return;
    ui.diag.hidden = !s.todo; ui.diag.replaceChildren();
    if (!s.todo) return;
    ui.diag.append(h('i', { class: 'dot' }), h('span', {}, T(`${s.todo} ligne(s) non traduite(s) :`, `${s.todo} untranslated line(s):`)));
    if (s.exact) ui.diag.append(h('button', { class: 'mtr-dbtn', style: { '--c': 'var(--s-ok)' }, title: T('Appliquer immédiatement toutes les correspondances exactes du dictionnaire SST (0 ms)', 'Instantly apply every exact SST dictionary match (0 ms)'), onclick: applyExact }, ic('spark'), T(`Appliquer ${s.exact} SST (100 %)`, `Apply ${s.exact} SST (100%)`)));
    if (s.fuzzy) ui.diag.append(h('button', { class: 'mtr-dbtn', onclick: applyFuzzy }, ic('search'), T(`${s.fuzzy} suggestion SST (> 70 %)`, `${s.fuzzy} partial SST match (> 70%)`)));
    if (s.mod) ui.diag.append(h('button', { class: 'mtr-dbtn', style: { '--c': 'var(--s-acct)' }, onclick: () => aiSheet(null) }, ic('spark'), T(`Traduire ${s.mod} texte(s) inédit(s) par IA`, `Translate ${s.mod} mod text(s) via AI`)));
    ui.diag.append(h('span', { class: 'sp' }), h('button', { class: 'mtr-link', onclick: () => { ui.why.hidden = !ui.why.hidden; if (!ui.why.hidden) fillWhy(); } }, T('Pourquoi ces lignes ?', 'Why these lines?')));
  }
  function fillWhy() {
    ui.why.replaceChildren(
      h('div', {}, h('b', { class: 'ok' }, T('1. Correspondance SST exacte (100 %)', '1. Exact SST match (100%)')), T('La phrase existe à l’identique dans un dictionnaire SST chargé : elle peut être appliquée instantanément.', 'The sentence exists verbatim in a loaded SST dictionary: it can be applied instantly.')),
      h('div', {}, h('b', { class: 'wn' }, T('2. Correspondance partielle (floue)', '2. Partial match (fuzzy)')), T('Le dictionnaire contient une phrase proche. mTRANSLATOR ne l’applique pas d’office, pour éviter les faux positifs : vous relisez.', 'The dictionary has a close sentence. mTRANSLATOR does not apply it automatically to avoid false positives: you review it.')),
      h('div', {}, h('b', { class: 'acc' }, T('3. Texte inédit du mod (0 % SST)', '3. Mod-original text (0% SST)')), T('Ces textes sont de l’auteur du mod et n’existent dans aucun fichier du jeu : ils demandent la traduction automatique.', 'These texts were written by the mod author and exist in no game file: they need automatic translation.')));
  }
  function refreshStat(s) {
    if (!ui.stat || !st.proj) return; s = s || stats();
    ui.msg.replaceChildren(...(st.mode === 'expert' ? [h('span', { style: { color: 'var(--s-ok)' } }, '● '), `mTRANSLATOR v2.5 · ${s.total}/${s.total} ${T('enregistrements', 'records')} · ${T('Format : ', 'Format: ')}${st.proj.ext.toUpperCase()} · ${T('Jeu : ', 'Game: ')}${st.proj.game}`] : [h('b', {}, s.done), ` ${T('traduites sur', 'translated out of')} ${s.total} · ${s.todo} ${T('à traduire', 'to translate')}`]));
    tint(ui.msg); ui.stat.querySelector('.sc').textContent = st.mode === 'expert' ? T('Raccourcis : F10 (valider et suivant) | ⌘S (enregistrer) | ▲▼ (naviguer)', 'Shortcuts: F10 (Validate & Next) | ⌘S (Save) | ▲▼ (Navigate)') : T('F10 : valider et passer à la suivante · ⌘S : enregistrer', 'F10: validate and go to the next · ⌘S: save');
  }

  /* ---------- tableau ---------- */
  function visible() {
    const q = st.q.trim().toLowerCase();
    return recs().map((r, i) => i).filter(i => { const r = recs()[i];
      if (st.filter === 'todo' && r.status !== 'todo') return false; if (st.type !== 'all' && r.type !== st.type) return false;
      return !q || (r.src + ' ' + r.target + ' ' + r.edid + ' ' + r.formId).toLowerCase().includes(q); });
  }
  function stIcon(r) {
    const k = kind(r), g = { ok: '<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>', todo: '●', partial: '◐', same: '=', warn: '!' }[k];
    return h('span', { class: 'mtr-st st-' + k, title: statusText(r), html: g });
  }
  function targetCell(r) {
    const k = kind(r), c = h('div', { class: 'mtr-c tgt' });
    if (r.status === 'todo') {
      const d = diagOf(r);
      if (d.score >= 70) c.append(h('span', { class: 'mtr-ind ' + (d.score === 100 ? 'o' : 'w') }, d.score === 100 ? 'SST 100 %' : `Fuzzy ${d.score} %`),
        h('button', { class: 'mtr-ind ap ' + 'o', title: T('Cliquer pour appliquer la correspondance SST', 'Click to apply the SST match'), onclick: e => { e.stopPropagation(); applyOne(r); } }, T('Appliquer : « ', 'Apply: “') + d.text + (T(' »', '”'))));
      else c.append(h('span', { class: 'mtr-ind b' }, T('Texte du mod (0 % SST)', 'Mod-original (0% SST)')), h('span', { class: 'mtr-em' }, T('Absent du dictionnaire (traduction IA requise)', 'Not in the dictionary (AI translation required)')));
      return c;
    }
    c.append(h('span', { class: 'tx' }, tagged(r.target)));
    if (r.status === 'same') c.append(h('span', { class: 'mtr-ind b' }, T('Identique', 'Identical')));
    if (k === 'warn') c.append(h('span', { class: 'mtr-ind w', title: missing(r).join(' ') }, T('Balise manquante', 'Missing tag')));
    if (r.by && k !== 'ok') c.append(h('span', { class: 'mtr-by' }, r.by));
    return c;
  }
  function rowEl(i) {
    const r = recs()[i], x = st.mode === 'expert';
    return h('div', { class: 'mtr-row' + (i === st.sel ? ' on' : ''), 'data-i': i, role: 'row', onclick: () => select(i) },
      stIcon(r), x ? [h('span', { class: 'mono mtr-fid' }, r.formId), h('span', { class: 'mtr-type', style: { '--tc': TYPE_COL[r.type] || '#aaa' } }, r.type), h('span', { class: 'mono mut mtr-edid', title: r.edid }, r.edid)] : null,
      h('div', { class: 'mtr-c' }, tagged(r.src)), targetCell(r));
  }
  function drawRows() {
    if (!ui.rows) return; const v = visible(), top = ui.rows.scrollTop;
    ui.rows.replaceChildren(...(v.length ? v.map(rowEl) : [h('div', { class: 'mtr-empty' }, st.filter === 'todo' && !stats().todo ? T('Toutes les chaînes affichées sont traduites !', 'All displayed strings are translated!') : T('Aucun enregistrement ne correspond aux filtres.', 'No record matches the current filters.'))]));
    ui.rows.scrollTop = top;
  }
  function updateRow(i, flash) {
    const old = ui.rows.querySelector(`[data-i="${i}"]`); if (!old) return drawRows();
    if (st.filter === 'todo' && recs()[i].status !== 'todo') return drawRows();
    const n = rowEl(i); old.replaceWith(n); if (flash) n.classList.add('flash');
  }
  function keepVisible(i) {
    const el = ui.rows.querySelector(`[data-i="${i}"]`); if (!el) return;
    const t = el.offsetTop, b = t + el.offsetHeight, v = ui.rows;
    if (t < v.scrollTop) v.scrollTop = t; else if (b > v.scrollTop + v.clientHeight) v.scrollTop = b - v.clientHeight;
  }
  function select(i, scroll) {
    if (i === st.sel && !scroll) return; st.sel = i;
    ui.rows.querySelectorAll('.mtr-row.on').forEach(e => e.classList.remove('on'));
    const el = ui.rows.querySelector(`[data-i="${i}"]`); if (el) el.classList.add('on');
    if (scroll) keepVisible(i); drawEditor();
  }
  const neighbor = d => { const v = visible(), k = v.indexOf(st.sel); return v[clamp(k + d, 0, v.length - 1)]; };

  /* ---------- éditeur de ligne ---------- */
  function drawEditor() {
    if (!ui.ed) return; const r = cur(); ui.ed.replaceChildren(); ui.ta = null;
    if (!r || !visible().includes(st.sel)) { ui.ed.append(h('div', { class: 'mtr-empty' }, T('Sélectionnez une chaîne dans la liste ci-dessus pour la traduire.', 'Select a string in the list above to translate it.'))); return; }
    ui.edChip = h('span', {}); ui.cntO = h('span', { class: 'cnt' }); ui.cntT = h('span', { class: 'cnt' }); ui.sug = h('div', { class: 'mtr-sug' });
    ui.ta = h('textarea', { class: 'mtr-ta', spellcheck: 'false', 'aria-label': T('Traduction', 'Translation') + ` (${LANGS[st.tl]})`, placeholder: T('Saisissez la traduction ici…', 'Type the translation here…'), oninput: onType }); ui.ta.value = r.target;
    ui.ed.append(
      h('div', { class: 'mtr-edh' }, h('span', {}, 'FormID : ', h('span', { class: 'mono' }, r.formId)), '|', h('span', {}, 'EDID : ', h('span', { class: 'mono' }, r.edid)), h('span', { class: 'mtr-type', style: { '--tc': TYPE_COL[r.type] || '#aaa' } }, r.type), ui.edChip, h('span', { class: 'sp' }),
        h('button', { class: 'sbtn', onclick: () => step(-1), title: T('Enregistrement précédent (↑)', 'Previous record (↑)') }, '▲ ' + T('Préc.', 'Prev.')), h('button', { class: 'sbtn', onclick: () => step(1), title: T('Enregistrement suivant (↓)', 'Next record (↓)') }, '▼ ' + T('Suiv.', 'Next'))),
      h('div', { class: 'mtr-panes' },
        h('div', { class: 'mtr-pane' }, h('div', { class: 'mtr-ph' }, h('b', {}, T('Source originale (VO)', 'Original source')), ui.cntO, h('button', { class: 'sbtn', onclick: copySrc, title: T('Copier la source dans la traduction', 'Copy the source into the translation') }, ic('copy'), ' ', T('Copier', 'Copy'))),
          h('div', { class: 'mtr-pb' }, tagged(r.src, true)),
          h('div', { class: 'mtr-tgs' }, h('span', {}, T('Balises :', 'Tags:')), tagList(r.src).length ? [...new Set(tagList(r.src))].map(g => h('button', { class: 'mtr-tg' + (g === '[pagebreak]' ? ' pb' : g[0] === '%' ? ' fmt' : ''), title: T('Cliquer pour insérer dans la traduction', 'Click to insert into the translation'), onclick: () => insertTag(g) }, g)) : h('span', {}, '—'))),
        h('div', { class: 'mtr-pane' }, h('div', { class: 'mtr-ph' }, h('b', {}, T('Traduction', 'Translation') + ` (${LANGS[st.tl]})`), ui.cntT,
          ui.aiBtn = h('button', { class: 'sbtn', onclick: () => aiLine(r), title: T('Traduire cette ligne avec l’IA', 'Translate this line with AI') }, ic('spark'), ' ', st.engine === 'gemini' ? T('IA Gemini', 'Gemini AI') : 'Google')),
          ui.ta, ui.sug)),
      h('div', { class: 'mtr-edf' },
        h('button', { class: 'sbtn', onclick: markSame, title: T('Conserver le texte original comme traduction (nom propre, commande)', 'Keep the original text as the translation (proper noun, command)') }, T('Identique (nom propre)', 'Identical (proper noun)')),
        h('button', { class: 'sbtn', onclick: clearLine }, T('Effacer', 'Clear')), h('span', { class: 'sp' }),
        h('button', { class: 'sbtn', onclick: () => validate() }, T('Valider', 'Validate')),
        h('button', { class: 'sbtn acc', onclick: () => validateNext(true) }, T('Valider et suivant non traduit →', 'Validate & next untranslated →'))));
    liveEd(r);
  }
  function liveEd(r) {
    ui.cntO.textContent = `${r.src.length} ${T('car.', 'chars')} • ${words(r.src)} ${T('mots', 'words')}`; ui.cntT.textContent = `${r.target.length} ${T('car.', 'chars')} • ${words(r.target)} ${T('mots', 'words')}`;
    const k = kind(r); ui.edChip.className = 'chip ' + { ok: 'ok', todo: 'dg', partial: 'wn', same: 'acct', warn: 'wn' }[k]; ui.edChip.textContent = '● ' + statusText(r);
    const miss = missing(r), d = diagOf(r); ui.sug.className = 'mtr-sug' + (miss.length ? ' bad' : ''); ui.sug.replaceChildren();
    if (miss.length) ui.sug.append(h('span', { class: 'lb' }, T('Balise manquante :', 'Missing tag:')), ...miss.map(g => h('button', { class: 'mtr-tg bad', title: T('Cliquer pour insérer', 'Click to insert'), onclick: () => insertTag(g) }, g)), h('span', { class: 'msg' }, T('Insérez-la pour valider.', 'Insert it to validate.')));
    else if (r.status === 'todo' && d.score >= 70) ui.sug.append(h('span', { class: 'q' }, h('b', { class: d.score === 100 ? 'ok' : 'wn' }, `SST (${d.score} %) : `), '« ' + d.text + ' »'), h('button', { class: 'sbtn acc', onclick: () => applyOne(r) }, T(`Appliquer (${d.score} %)`, `Apply (${d.score}%)`)));
    else if (r.status === 'todo') ui.sug.append(h('span', { class: 'q' }, h('b', { class: 'acc' }, T('Texte inédit du mod : ', 'Mod-original text: ')), T('absent des dictionnaires SST officiels.', 'not in the official SST dictionaries.')));
    else ui.sug.append(h('span', { class: 'q mut' }, r.target ? T('✓ Balises conformes à l’original', '✓ Tags match the original') : '', r.by ? ' · ' + T('Source : ', 'Source: ') + r.by : ''));
  }
  function onType() {
    const r = cur(); r.target = ui.ta.value; r.dirty = true; r.by = '';
    if (!r.target) r.status = 'todo'; else { r.status = 'partial'; r.valid = false; }
    updateRow(st.sel); liveEd(r); refreshHead();
  }
  function insertTag(g) {
    const ta = ui.ta, a = ta.selectionStart, b = ta.selectionEnd; ta.value = ta.value.slice(0, a) + g + ta.value.slice(b);
    ta.focus({ preventScroll: true }); ta.setSelectionRange(a + g.length, a + g.length); sfx.tick(); onType();
  }
  function copySrc() { const r = cur(); snap([r]); ui.ta.value = r.src; sfx.click(); onType(); ui.ta.focus({ preventScroll: true }); }
  function markSame() { const r = cur(); snap([r]); Object.assign(r, { target: r.src, status: 'same', valid: false, dirty: true, by: '' }); sfx.click(); ui.ta.value = r.target; updateRow(st.sel); liveEd(r); refreshHead(); say(T('Marqué comme identique à l’original (nom propre).', 'Marked as identical to the original (proper noun).')); }
  function clearLine() { const r = cur(); snap([r]); Object.assign(r, { target: '', status: 'todo', valid: false, by: '' }); sfx.click(); ui.ta.value = ''; updateRow(st.sel); liveEd(r); refreshHead(); ui.ta.focus({ preventScroll: true }); }
  function step(d) { const n = neighbor(d); if (n != null) select(n, true); }

  /* ---------- actions de traduction ---------- */
  function setT(r, text, status, by) { Object.assign(r, { target: text, status, valid: status === 'ok', by: by || '', dirty: true }); }
  function applyExact() {
    const list = recs().filter(r => diagOf(r).score === 100); if (!list.length) return say(T('Aucune nouvelle correspondance exacte SST.', 'No new exact SST match found.'));
    snap(list); list.forEach(r => setT(r, diagOf(r).text, 'ok', 'SST 100 %')); sfx.done(); refreshAll(); list.forEach(r => { const e = ui.rows.querySelector(`[data-i="${r.id}"]`); e && e.classList.add('flash'); });
    say(T(`${list.length} traduction(s) SST (100 % exactes) appliquée(s) instantanément.`, `${list.length} SST translation(s) (100% exact) applied instantly.`));
  }
  function applyFuzzy() {
    const list = recs().filter(r => { const d = diagOf(r); return d.score >= 70 && d.score < 100; }); if (!list.length) return;
    snap(list); list.forEach(r => setT(r, diagOf(r).text, 'partial', `SST ${diagOf(r).score} %`)); sfx.pop(); refreshAll();
    say(T(`${list.length} suggestion(s) floue(s) appliquée(s) : relisez-les avant de valider.`, `${list.length} fuzzy suggestion(s) applied: review them before validating.`));
  }
  function applyOne(r) {
    const d = diagOf(r); if (d.score < 70) return; snap([r]); const sc = d.score; setT(r, d.text, sc === 100 ? 'ok' : 'partial', `SST ${sc} %`); sfx.pop();
    st.sel = r.id; refreshHead(); updateRow(r.id, true); drawEditor(); say(T('Suggestion du dictionnaire appliquée.', 'Dictionary suggestion applied.'));
  }
  function aiLine(r) {
    if (st.busy) return; const pick = r.ai ? r.ai[st.tl] : r.tr ? r.tr[st.tl] : r.sst ? r.sst[1][st.tl] : r.src;
    snap([r]); st.busy = true; const ta = ui.ta, btn = ui.aiBtn; if (btn) btn.disabled = true;
    (async () => {
      ta.value = ''; ta.classList.add('aithink'); if (!reduced()) await wait(650); ta.classList.remove('aithink');
      for (let i = 0; i <= pick.length && alive(); i += 3) { ta.value = pick.slice(0, i); if (i % 12 === 0) sfx.tick(); if (!reduced()) await wait(16); }
      st.busy = false; if (!alive()) return;
      setT(r, pick, 'partial', st.engine === 'gemini' ? 'Gemini' : 'Google'); if (cur() === r) { ta.value = pick; updateRow(r.id, true); liveEd(r); } refreshHead(); sfx.done();
      if (btn) btn.disabled = false;
    })();
  }
  function validate() {
    const r = cur(); if (!r) return false;
    if (!r.target) { say(T('Saisissez une traduction avant de valider.', 'Type a translation before validating.')); ui.ta && ui.ta.focus({ preventScroll: true }); return false; }
    if (missing(r).length) { say(T('Balise manquante : insérez-la avant de valider.', 'Missing tag: insert it before validating.')); ui.sug && ui.sug.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 220 }); return false; }
    snap([r]); const was = done(r);
    if (r.status === 'same') r.valid = true; else { r.status = 'ok'; r.valid = true; if (!was) st.learned++; }
    r.by = ''; sfx.tick(); updateRow(r.id, false); if (cur() === r && ui.edChip) liveEd(r); refreshHead();
    const s = stats(); if (s.done === s.total) { sfx.pop(); say(T('Toutes les chaînes sont traduites. Enregistrez avec ⌘S.', 'Every string is translated. Save with ⌘S.')); } else say(T('Enregistrement validé (mémorisé dans le dictionnaire local).', 'Entry validated (saved to the local dictionary).'));
    return true;
  }
  function validateNext(onlyTodo) {
    const before = visible(), k = before.indexOf(st.sel); if (!validate()) return;
    const after = visible(), need = i => { const r = recs()[i]; return onlyTodo ? r.status === 'todo' : r.status === 'todo' || r.status === 'partial' || (r.status === 'same' && !r.valid); };
    let nx = null; for (let j = 1; j <= before.length; j++) { const i = before[(k + j) % before.length]; if (i !== st.sel && after.includes(i) && need(i)) { nx = i; break; } }
    if (nx == null) { nx = before[Math.min(k + 1, before.length - 1)]; if (!after.includes(nx)) nx = after[0]; }
    if (nx == null) { drawEditor(); return; }
    st.sel = nx; drawRows(); keepVisible(nx); drawEditor(); if (ui.ta) ui.ta.focus({ preventScroll: true });
  }

  /* ---------- traduction automatique (IA) ---------- */
  function aiSheet() {
    const todo = recs().filter(r => r.status === 'todo'); if (!todo.length) return say(T('Toutes les chaînes affichées sont traduites !', 'All displayed strings are translated!'));
    const eng = [['gemini', T('Gemini (votre clé)', 'Gemini (your key)'), T('Meilleur pour les dialogues et les livres', 'Best for dialogues and books')], ['google', T('Google Traduction (gratuit)', 'Google Translate (free)'), T('Sans clé, rapide', 'No key, fast')]];
    const opts = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
    const drawOpts = () => opts.replaceChildren(...eng.map(([k, n, d]) => h('button', { class: 'mtr-opt' + (st.engine === k ? ' on' : ''), onclick: () => { st.engine = k; sfx.tick(); drawOpts(); } }, h('i', { class: 'rad' }, st.engine === k ? '✓' : ''), h('span', { class: 't' }, h('b', {}, n), h('small', {}, d)))));
    drawOpts();
    const log = h('pre', { class: 'mtr-log', hidden: true }), bar = h('div', { class: 'sprog', style: { width: '100%' }, hidden: true }, h('i'));
    const go = h('button', { class: 'sbtn act', onclick: () => run() }, T('TRADUIRE', 'TRANSLATE')), cancel = h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel'));
    const s = sheet(T('Traduction automatique', 'Automatic translation'), [h('p', {}, T(`Périmètre à traduire : ${todo.length} élément(s). Les termes connus passent d’abord par le glossaire SST (0 ms), l’IA traduit le reste.`, `Scope to translate: ${todo.length} item(s). Known terms go through the SST glossary first (0 ms); AI translates the rest.`)),
      opts, h('div', { class: 'chips' }, h('span', { class: 'chip ok' }, T('Balises protégées', 'Tags protected')), h('span', { class: 'chip' }, '[pagebreak]'), h('span', { class: 'chip' }, '<Alias=…>'), h('span', { class: 'chip' }, '%d')), bar, log], [cancel, go]);
    async function run() {
      if (st.busy) return; st.busy = true; opts.hidden = true; go.disabled = true; cancel.hidden = true; log.hidden = false; bar.hidden = false; const fill = bar.firstChild; sfx.click();
      const write = t => { log.textContent += t + '\n'; log.scrollTop = log.scrollHeight; }, pause = ms => (reduced() ? 0 : wait(ms)); const t0 = performance.now();
      snap(todo); const name = st.engine === 'gemini' ? 'Gemini' : 'Google Translate';
      write(T('Préparation des lots…', 'Preparing batches…')); await pause(380); write(T('Indexation et déduplication des chaînes…', 'Indexing and deduplicating strings…')); await pause(420); if (!alive()) return;
      const ex = todo.filter(r => diagOf(r).score === 100);
      if (ex.length) { ex.forEach(r => setT(r, diagOf(r).text, 'ok', 'SST 100 %')); write(T(`⚡ ${ex.length} chaîne(s) traduite(s) instantanément via le glossaire SST !`, `⚡ ${ex.length} string(s) translated instantly via the SST glossary!`)); sfx.tick(); refreshAll(); }
      const rest = todo.filter(r => !ex.includes(r)), size = 3, nb = Math.ceil(rest.length / size); let n = ex.length;
      for (let b = 0; b < nb && alive(); b++) {
        const part = rest.slice(b * size, b * size + size); write(T(`⚡ Lot ${b + 1}/${nb} (${part.length} chaîne${part.length > 1 ? 's' : ''}) via ${name}…`, `⚡ Batch ${b + 1}/${nb} (${part.length} string${part.length > 1 ? 's' : ''}) via ${name}…`)); await pause(st.engine === 'gemini' ? 850 : 520);
        part.forEach(r => { const txt = r.ai ? r.ai[st.tl] : (diagOf(r).text || ''); setT(r, txt, 'partial', st.engine === 'gemini' ? 'Gemini' : 'Google'); n++; sfx.tick(); updateRow(r.id, true); });
        fill.style.width = Math.round(n / todo.length * 100) + '%'; refreshHead();
      }
      if (!alive()) return; fill.style.width = '100%'; const secs = Math.max(.1, (performance.now() - t0) / 1000);
      write(T(`Traduction terminée en ${secs.toFixed(1)} s (~${(todo.length / secs).toFixed(1)} chaînes/s)`, `Translation finished in ${secs.toFixed(1)}s (~${(todo.length / secs).toFixed(1)} strings/sec)`));
      st.busy = false; sfx.done(); refreshAll(); const fp = recs().findIndex(r => r.status === 'partial' && r.by === (st.engine === 'gemini' ? 'Gemini' : 'Google')); if (fp >= 0) { st.sel = fp; drawRows(); keepVisible(fp); drawEditor(); }
      go.replaceWith(h('button', { class: 'sbtn act', onclick: () => s.close() }, T('FERMER', 'CLOSE'))); const dn = h('div', { class: 'mtr-done' }, ic('check'), T(`${todo.length} chaînes intégrées. Relisez-les : F10 valide et passe à la suivante.`, `${todo.length} strings added. Review them: F10 validates and moves to the next.`)); log.after(dn);
    }
  }

  /* ---------- dictionnaires, lots, statistiques, remplacer, enregistrer ---------- */
  function dictSheet() {
    const body = h('div'), draw = () => body.replaceChildren(
      h('p', {}, T('Les dictionnaires SST (format xTranslator) donnent les correspondances exactes et approchantes ; la mémoire locale retient chaque ligne que vous validez.', 'SST dictionaries (xTranslator format) give exact and close matches; the local memory remembers every line you validate.')),
      ...[['official', T('Dictionnaire officiel Skyrim SE (' + LANGS[st.tl] + ')', 'Official Skyrim SE dictionary (' + LANGS[st.tl] + ')'), 22946, T('Textes extraits du jeu', 'Texts extracted from the game')], ['local', T('Mémoire locale (auto-apprenante)', 'Local memory (self-learning)'), 1204 + st.learned, T(`${st.learned} ligne(s) apprise(s) pendant cette session`, `${st.learned} line(s) learned this session`)]].map(([k, n, c, d]) =>
        h('div', { class: 'mtr-dr' }, h('div', { class: 'n' }, h('b', {}, n), h('small', {}, d)), h('span', { class: 'v' }, num(c)), h('button', { class: 'mtr-sw' + (st.dict[k] ? ' on' : ''), role: 'switch', 'aria-checked': String(st.dict[k]), 'aria-label': n, onclick: () => { st.dict[k] = !st.dict[k]; sfx.tick(); draw(); if (st.view === 'edit') refreshAll(); } }))),
      h('p', {}, T('Astuce : désactivez le dictionnaire officiel pour voir la différence dans le diagnostic.', 'Tip: switch the official dictionary off to see the difference in the diagnosis.')));
    draw(); const s = sheet(T('Dictionnaires', 'Dictionaries'), body, h('button', { class: 'sbtn', onclick: () => s.close() }, T('Fermer', 'Close')));
  }
  function batchSheet() {
    const rows = BATCH.map(([n, g, c]) => ({ n, g, c, bar: h('i'), res: h('span', { class: 'r' }, T('En attente', 'Pending')) }));
    const list = h('div', {}, rows.map(r => h('div', { class: 'mtr-bat' }, h('div', {}, h('b', {}, r.n), ' ', h('span', { class: 'mut' }, `${r.g} · ${num(r.c)} ${T('chaînes', 'strings')}`)), r.res, h('div', { class: 'sprog' }, r.bar))));
    const go = h('button', { class: 'sbtn act', onclick: run }, T('LANCER', 'START')), cl = h('button', { class: 'sbtn', onclick: () => s.close() }, T('Fermer', 'Close')), sum = h('div', { hidden: true });
    const s = sheet(T('Traitement par lots', 'Batch processing'), [h('p', {}, T('Traduisez plusieurs plugins d’un coup : dictionnaires SST d’abord, IA pour le reste.', 'Translate several plugins at once: SST dictionaries first, AI for the rest.')), list, sum], [cl, go], true);
    async function run() {
      if (st.busy) return; st.busy = true; go.disabled = true; cl.hidden = true; sfx.click(); let ts = 0, tx = 0;
      for (let i = 0; i < rows.length && alive(); i++) {
        const r = rows[i], x = BATCH[i][3]; r.res.textContent = T('Dictionnaires…', 'Dictionaries…');
        for (let p = 0; p <= 10 && alive(); p++) { r.bar.style.width = p * 6 + '%'; if (!reduced()) await wait(55); } r.res.textContent = 'IA…';
        for (let p = 6; p <= 10 && alive(); p++) { r.bar.style.width = p * 10 + '%'; if (!reduced()) await wait(90); }
        r.res.textContent = `✓ SST ${num(x)} · IA ${num(r.c - x)}`; r.res.style.color = 'var(--s-ok)'; ts += x; tx += r.c - x; sfx.tick();
      }
      if (!alive()) return; st.busy = false; sfx.done(); sum.hidden = false; sum.replaceChildren(h('div', { class: 'mtr-done' }, ic('check'), T(`3 plugins · ${num(ts + tx)} chaînes · ${num(ts)} par SST (0 ms) · ${num(tx)} par IA`, `3 plugins · ${num(ts + tx)} strings · ${num(ts)} via SST (0 ms) · ${num(tx)} via AI`)));
      go.replaceWith(h('button', { class: 'sbtn act', onclick: () => s.close() }, T('FERMER', 'CLOSE')));
    }
  }
  function statsSheet() {
    const s = stats(), pct = Math.round(s.done / s.total * 100), types = {}; recs().forEach(r => { (types[r.type] = types[r.type] || [0, 0])[done(r) ? 0 : 1]++; });
    const bar = (lab, n, col) => h('div', { class: 'mtr-br' }, h('span', {}, lab), h('div', { class: 'bar' }, h('i', { style: { width: Math.round(n / s.total * 100) + '%', background: col } })), h('span', { class: 'v' }, n));
    const sh = sheet(T('Statistiques et rapport', 'Statistics and report'), [h('div', { class: 'mtr-sums' }, h('div', {}, h('b', {}, s.total), h('span', {}, T('chaînes', 'strings'))), h('div', {}, h('b', { class: 'ok' }, pct + ' %'), h('span', {}, T('traduit', 'translated'))), h('div', {}, h('b', {}, s.todo), h('span', {}, T('à traduire', 'to translate')))),
      h('div', { class: 'mtr-bars' }, bar(T('Validées', 'Validated'), s.done, 'var(--s-ok)'), bar(T('À relire', 'To review'), s.partial, 'var(--s-wn)'), bar(T('Identiques', 'Identical'), s.same, 'var(--s-acct)'), bar(T('Alertes', 'Alerts'), s.warn, '#fb923c'), bar(T('Non traduites', 'Untranslated'), s.todo, 'var(--s-dg)')),
      h('div', { class: 'chips' }, Object.entries(types).map(([t, [a, b]]) => h('span', { class: 'chip', style: { color: TYPE_COL[t] } }, `${t} ${a}/${a + b}`)))], h('button', { class: 'sbtn', onclick: () => sh.close() }, T('Fermer', 'Close')));
  }
  function replaceSheet() {
    const a = h('input', { placeholder: T('Texte à chercher', 'Text to find'), 'aria-label': T('Chercher', 'Find') }), b = h('input', { placeholder: T('Remplacer par', 'Replace with'), 'aria-label': T('Remplacer par', 'Replace with') }), info = h('p', {}, T('Saisissez le texte à chercher dans les traductions.', 'Type the text to find in the translations.'));
    const hits = () => (a.value ? recs().filter(r => r.status !== 'todo' && r.target.includes(a.value)) : []);
    a.oninput = () => { const n = hits().length; info.textContent = a.value ? (n ? T(`${n} ligne(s) concernée(s).`, `${n} matching line(s).`) : T('Aucune correspondance.', 'No match.')) : T('Saisissez le texte à chercher dans les traductions.', 'Type the text to find in the translations.'); go.disabled = !n; };
    const go = h('button', { class: 'sbtn act', disabled: true, onclick: () => { const l = hits(); snap(l); l.forEach(r => { r.target = r.target.split(a.value).join(b.value); r.status = 'partial'; r.valid = false; r.dirty = true; r.by = ''; }); sfx.done(); s.close(); refreshAll(); say(T(`${l.length} ligne(s) modifiée(s) : relisez-les.`, `${l.length} line(s) changed: review them.`)); } }, T('TOUT REMPLACER', 'REPLACE ALL'));
    const s = sheet(T('Rechercher et remplacer', 'Find and replace'), [h('label', { class: 'mtr-fld' }, T('RECHERCHER', 'FIND'), a), h('label', { class: 'mtr-fld' }, T('REMPLACER PAR', 'REPLACE WITH'), b), info], [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), go]);
    setTimeout(() => a.focus({ preventScroll: true }), 60);
  }
  function saveSheet() {
    let mode = 'over', fmt = 'SST'; const opts = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });
    const ch = h('div', { class: 'ssegs left', hidden: true, style: { margin: '2px 0 0 0' } }), s0 = stats();
    const draw = () => { opts.replaceChildren(...[['over', T('Remplacer le plugin', 'Overwrite the plugin'), T('Une sauvegarde horodatée est créée à côté', 'A timestamped backup is created next to it')], ['copy', T('Enregistrer une copie', 'Save a copy'), fileName().replace('.', '_copy.')], ['exp', T('Exporter…', 'Export…'), T('Dictionnaire SST, XML xTranslator, CSV, TXT ou JSON', 'SST dictionary, xTranslator XML, CSV, TXT or JSON')]].map(([k, n, d]) => h('button', { class: 'mtr-opt' + (mode === k ? ' on' : ''), onclick: () => { mode = k; sfx.tick(); draw(); } }, h('i', { class: 'rad' }, mode === k ? '✓' : ''), h('span', { class: 't' }, h('b', {}, n), h('small', {}, d)))));
      ch.hidden = mode !== 'exp'; ch.replaceChildren(...['SST', 'XML', 'CSV', 'TXT', 'JSON'].map(f => h('button', { class: fmt === f ? 'on' : '', onclick: () => { fmt = f; sfx.tick(); draw(); } }, f))); };
    draw();
    const go = h('button', { class: 'sbtn act', onclick: () => {
      const n = recs().filter(r => r.status !== 'todo' && r.target && r.target !== r.src).length, stamp = '20261110-142210'; sfx.done(); s.close();
      recs().forEach(r => { r.dirty = false; }); refreshHead();
      const body = mode === 'exp' ? T(`Export ${fmt} terminé (${n} entrées).`, `${fmt} export complete (${n} entries).`) : T(`${n} traduction(s) écrite(s) dans ${mode === 'copy' ? fileName().replace('.', '_copy.') : fileName()}. Sauvegarde : ${fileName()}.bak-${stamp}`, `${n} translation(s) written to ${mode === 'copy' ? fileName().replace('.', '_copy.') : fileName()}. Backup: ${fileName()}.bak-${stamp}`);
      toast({ icon: icon(app.id), title: app.id, body }); say(T(`Démo : rien n’est écrit sur votre disque. +${st.learned} dans la base locale.`, `Demo: nothing is written to your disk. +${st.learned} in the local database.`));
    } }, T('ENREGISTRER', 'SAVE'));
    const s = sheet(T('Enregistrer le plugin traduit', 'Save the translated plugin'), [h('p', {}, T(`${s0.done} ligne(s) validée(s) sur ${s0.total}. Aucun fichier n’est réellement écrit dans cette démo.`, `${s0.done} validated line(s) out of ${s0.total}. No file is actually written in this demo.`)), opts, ch], [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), go]);
  }

  /* ---------- clavier ---------- */
  const onKey = e => {
    if (!mine() || st.view !== 'edit' || root.querySelector('.mtr-sheet')) return;
    const mod = e.metaKey || e.ctrlKey, inField = e.target.matches && e.target.matches('textarea,input');
    if (e.key === 'F10' || (mod && e.key === 'Enter')) { e.preventDefault(); validateNext(false); }
    else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveSheet(); }
    else if (mod && e.key.toLowerCase() === 'z' && !inField) { e.preventDefault(); undo(); }
    else if (!inField && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); step(e.key === 'ArrowDown' ? 1 : -1); }
  };
  document.addEventListener('keydown', onKey); offs.add(() => document.removeEventListener('keydown', onKey));
  render(); setTimeout(() => w.el.focus({ preventScroll: true }), 0);
  return root;
}
