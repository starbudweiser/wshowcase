/* mO2FLATTENER : réplique fidèle de l'assembleur d'instance Mod Organizer 2. Cartes 1 (instance), 2 (configurations), 3 (adaptation au Mac),
   assemblage avec journal et progression, bilan Mac avec annulation. Données d'exemple : aucun fichier n'est lu ni copié. */
import { h, brand, wait, reduced, clamp, sfx, toast, icon, T, num, css, wm, dlBtn } from './kit.js';
css('css/demos/mO2FLATTENER.css');

const COLOR = '#e5483a';
const MO2 = '/Users/Shared/Skyrim/MO2', NOLVUS = '/Users/Shared/Nolvus/MO2', DL = '/Users/Shared/Downloads';
const INST = {
  [MO2]: { profiles: { Default: 21834, Survival: 21973, Testing: 588 } },
  [NOLVUS]: { profiles: { 'Nolvus Awakening': 35462 } },
  [DL]: { profiles: null }
};
const BOTTLES = () => [
  { id: 'Skyrim', engine: 'D3DMetal', net8: true, bs: { state: 'ok', version: '1.4.2' } },
  { id: 'Gaming', engine: 'DXVK', net8: false, bs: { state: 'outdated', version: '1.2.0', minimum: '1.4.0', archive: { name: 'Bottled Shaders 1.4.2.7z', folder: 'mABBAJACK' } } }
];
const FOLDERS = {
  mo2: () => [[MO2, T('412 mods · 3 profils', '412 mods · 3 profiles')], [NOLVUS, T('1 200 mods · 1 profil', '1,200 mods · 1 profile')], [DL, T('aucun dossier profiles', 'no profiles folder')]],
  dest: () => [['/Users/Shared/Skyrim/Flattened', T('n’existe pas encore', 'does not exist yet')], ['/Users/Shared/Games/Skyrim Special Edition', T('copie propre', 'clean copy')], ['/Volumes/Games/Skyrim Stock', T('disque externe', 'external drive')]],
  plug: () => [['/Users/Shared/Skyrim/AppData', ''], ['/Users/Shared/Skyrim/CrossOver/AppData/Local/Skyrim Special Edition', T('dans la bouteille', 'inside the bottle')]],
  ini: () => [['/Users/Shared/Skyrim/Documents', ''], ['/Users/Shared/Skyrim/CrossOver/Documents/My Games/Skyrim Special Edition', T('dans la bouteille', 'inside the bottle')]]
};

/* correctifs de l'adaptation au Mac (textes de mackit) */
const FIXES = () => ({
  engine: { game: false, t: T('Moteur graphique DXMT', 'DXMT graphics engine'), files: ['cxbottle.conf'], lines: ['CX_GRAPHICS_BACKEND=dxmt'],
    d: b => T(`La bouteille CrossOver utilise ${b.engine}. Elle passe sur DXMT, le moteur graphique que demandent Bottled Shaders et DLSS (réglage CX_GRAPHICS_BACKEND de cxbottle.conf).`, `The CrossOver bottle uses ${b.engine}. It switches to DXMT, the graphics engine Bottled Shaders and DLSS need (CX_GRAPHICS_BACKEND in cxbottle.conf).`) },
  dlss: { game: true, t: T('Pont mDLSS (DLSS)', 'mDLSS bridge (DLSS)'), files: ['d3d11.dll', 'BottledShaders.ini'], lines: ['UpscaleMethod = 3'],
    d: () => T('Pose le pont mDLSS (d3d11.dll) à côté de SkyrimSE.exe et règle Bottled Shaders sur DLSS. Sans lui, DLSS affiche un écran noir sous DXMT.', 'Puts the mDLSS bridge (d3d11.dll) next to SkyrimSE.exe and sets Bottled Shaders to DLSS. Without it, DLSS shows a black screen under DXMT.') },
  display: { game: true, t: T('SSE Display Tweaks pour DXMT', 'SSE Display Tweaks for DXMT'), files: ['SSEDisplayTweaks.ini'], lines: ['SwapEffect = 3', 'SwapBufferCount = 3', 'VideoMemorySizeMb = 8192'],
    d: () => T('Règle trois lignes de SSEDisplayTweaks.ini (SwapEffect, SwapBufferCount, VideoMemorySizeMb) pour que l’affichage fonctionne sous DXMT.', 'Sets three lines of SSEDisplayTweaks.ini (SwapEffect, SwapBufferCount, VideoMemorySizeMb) so the display works under DXMT.') },
  dups: { game: true, t: T('DLL en double avec Bottled Shaders', 'DLLs duplicated by Bottled Shaders'), files: ['TerrainHelper.dll', 'InverseSquareLighting.dll'], lines: [],
    d: () => T('Écarte TerrainHelper.dll, InverseSquareLighting.dll : Bottled Shaders les intègre déjà, et deux copies font planter le jeu. Les fichiers sont gardés dans la sauvegarde.', 'Sets aside TerrainHelper.dll, InverseSquareLighting.dll: Bottled Shaders already includes them, and two copies crash the game. The files are kept in the backup.') },
  compiler: { game: false, t: T('Compilateur de shaders de Microsoft', 'Microsoft shader compiler'), files: ['d3dcompiler_47.dll'], lines: [],
    d: () => T('Remplace le compilateur de shaders de Wine, qui ne compile pas Community Shaders, par celui de Microsoft (d3dcompiler_47.dll, fourni avec .NET 8).', 'Replaces Wine’s shader compiler, which cannot compile Community Shaders, with Microsoft’s (d3dcompiler_47.dll, provided with .NET 8).') },
  overrides: { game: false, t: T('Substitutions de DLL Wine', 'Wine DLL overrides'), files: [], lines: [],
    d: () => T('Déclare d3d11, dxgi en « native,builtin » dans le registre de la bouteille pour que le jeu charge les DLL de son dossier.', 'Sets d3d11, dxgi to “native,builtin” in the bottle’s registry so the game loads the DLLs from its folder.') }
});
const ORDER = ['engine', 'dlss', 'display', 'dups', 'compiler', 'overrides'];
const NO_NET8 = () => T('.NET 8 n’est pas installé dans la bouteille : le compilateur de Microsoft ne peut pas être posé.', '.NET 8 is not installed in the bottle: Microsoft’s compiler cannot be put in place.');

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 680, y: 92, minw: 780, minh: 480, bare: true, cls: 'socle',
    onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const S0 = { mo2: MO2, profiles: Object.keys(INST[MO2].profiles), profile: 'Default', modlist: MO2 + '/profiles/Default/modlist.txt', dest: '/Users/Shared/Skyrim/Flattened',
    hard: false, stopErr: true, cpPlug: true, plug: '/Users/Shared/Skyrim/AppData', cpIni: true, ini: '/Users/Shared/Skyrim/Documents',
    kit: false, bottle: 'Skyrim', how: 'first', run: 'idle', stop: false, status: 'idle', statusProfile: 'Default', report: null, built: {}, undoBusy: false };
  const alive = () => !w.dead && root.isConnected;
  const pause = ms => (reduced() ? Promise.resolve() : wait(ms));
  const bottles = BOTTLES(), bottle = () => bottles.find(b => b.id === S0.bottle) || bottles[0];
  let closeModal = null, macTimer = 0;

  /* ---------- briques ---------- */
  const field = (label, key, ph, browse, noBrowse) => {
    const inp = h('input', { class: 'o2f-in', value: S0[key], placeholder: ph || '', spellcheck: 'false', autocomplete: 'off', 'aria-label': label,
      oninput: e => { S0[key] = e.target.value; macSoon(); }, onkeydown: e => { if (e.key === 'Enter' && key === 'mo2') scanProfiles(S0.mo2); } });
    const btn = h('button', { class: 'o2f-t3', onclick: browse }, T('Parcourir', 'Browse'));
    return { inp, btn, row: h('div', { class: 'o2f-fr' }, h('label', { title: label }, label), inp, btn) };
  };
  const setField = (f, key, v) => { S0[key] = v; f.inp.value = v; };
  const chk = (label, on, fn) => {
    const b = h('button', { class: 'o2f-chk', role: 'checkbox', 'aria-checked': String(!!on), onclick: () => { const v = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', v); b.firstChild.textContent = v ? '✓' : ''; sfx.tick(); fn(v); } }, h('i', {}, on ? '✓' : ''), h('span', {}, label));
    return b;
  };
  const eyebrow = s => h('div', { class: 'o2f-eyebrow' }, s);
  const muted = (s, cls = '') => h('div', { class: 'o2f-mut ' + cls }, s);

  /* ---------- carte 1 ---------- */
  const fMo2 = field(T('Dossier MO2 / MODS :', 'MO2 / MODS Folder:'), 'mo2', T('Sélectionnez le dossier MODS ou la racine de MO2...', 'Select the MODS directory or MO2 root folder...'), () => pickFolder(T('Dossier MO2 / MODS', 'MO2 / MODS folder'), FOLDERS.mo2(), p => { setField(fMo2, 'mo2', p); scanProfiles(p); }));
  const sel = h('select', { class: 'o2f-sel', 'aria-label': T('Profil MO2 :', 'MO2 Profile:'), onchange: e => { S0.profile = e.target.value; profileSelected(); } });
  const fList = field(T('Fichier modlist.txt :', 'modlist.txt File:'), 'modlist', '', () => pickFolder(T('Fichier modlist.txt', 'modlist.txt file'), modlists(), p => { setField(fList, 'modlist', p); macSoon(); }));
  const fDest = field(T('Racine du jeu cible :', 'Target Game Root:'), 'dest', T('Ex : /chemin/vers/Skyrim Special Edition', 'e.g. /path/to/Skyrim Special Edition'), () => pickFolder(T('Racine du jeu cible', 'Target game root'), FOLDERS.dest(), p => { setField(fDest, 'dest', p); macSoon(true); }));
  const card1 = h('section', { class: 'o2f-card' }, h('div', { class: 'o2f-ct' }, T('1. INSTANCE SOURCE & RÉPERTOIRE DU JEU (RACINE)', '1. SOURCE INSTANCE & GAME ROOT DIRECTORY')),
    fMo2.row, h('div', { class: 'o2f-fr nb' }, h('label', {}, T('Profil MO2 :', 'MO2 Profile:')), sel), fList.row, fDest.row,
    chk(T('Hors APFS, utiliser des liens physiques (Hardlinks) — Décoché = Copie complète. Sur APFS, copie instantanée sans place en plus.', 'Outside APFS, use hardlinks — Unchecked = Full copy. On APFS, instant copy that uses no extra space.'), S0.hard, v => { S0.hard = v; }),
    chk(T('Arrêter immédiatement l’assemblage en cas d’erreur de copie', 'Stop assembly immediately on copy error'), S0.stopErr, v => { S0.stopErr = v; }));

  /* ---------- carte 2 ---------- */
  const mkOpt = (label, onKey, pKey, ph, browse) => {
    const inp = h('input', { class: 'o2f-in', value: S0[pKey], placeholder: ph || '', spellcheck: 'false', autocomplete: 'off', 'aria-label': label, oninput: e => { S0[pKey] = e.target.value; } });
    const btn = h('button', { class: 'o2f-t3', onclick: browse }, T('Parcourir', 'Browse'));
    const c = chk(label, S0[onKey], v => { S0[onKey] = v; inp.disabled = !v; btn.disabled = !v; });
    return { inp, row: h('div', { class: 'o2f-chk2' }, c, inp, btn) };
  };
  const oPlug = mkOpt(T('Copier plugins.txt (AppData) :', 'Copy plugins.txt (AppData):'), 'cpPlug', 'plug', '', () => pickFolder(T('Copier plugins.txt (AppData)', 'Copy plugins.txt (AppData)'), FOLDERS.plug(), p => { S0.plug = p; oPlug.inp.value = p; }));
  const oIni = mkOpt(T('Copier INIs (Documents) :', 'Copy INIs (Documents):'), 'cpIni', 'ini', '', () => pickFolder(T('Copier INIs (Documents)', 'Copy INIs (Documents)'), FOLDERS.ini(), p => { S0.ini = p; oIni.inp.value = p; }));
  const card2 = h('section', { class: 'o2f-card' }, h('div', { class: 'o2f-ct' }, T('2. DÉPLOIEMENT DES CONFIGURATIONS DU JEU', '2. GAME CONFIGURATION & PLUGINS DEPLOYMENT')), oPlug.row, oIni.row);

  /* ---------- carte 3 : adaptation au Mac ---------- */
  const macHost = h('div', { class: 'o2f-card-body', style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
  const card3 = h('section', { class: 'o2f-card' }, h('div', { class: 'o2f-ct' }, T('3. ADAPTATION AU MAC (DXMT, ENB, DLSS)', '3. MAC ADAPTATION (DXMT, ENB, DLSS)')), macHost);
  const rowsOf = kit => [
    [T('Dans le dossier', 'In the folder'), kit ? T('Pont DLSS (d3d11.dll), réglages de SSE Display Tweaks, DLL en double écartées (gardées dans _MAC_BACKUP).', 'DLSS bridge (d3d11.dll), SSE Display Tweaks settings, duplicate DLLs set aside (kept in _MAC_BACKUP).') : T('Rien n’est modifié : ni pont DLSS, ni réglages, ni fichier écarté.', 'Nothing is changed: no DLSS bridge, no settings, no file set aside.')],
    [T('Dans la bouteille', 'In the bottle'), kit ? T('La bouteille est modifiée : moteur DXMT, DLL forcées, compilateur de shaders de Microsoft.', 'The bottle is changed: DXMT engine, forced DLLs, Microsoft shader compiler.') : T('Rien n’est modifié.', 'Nothing is changed.')],
    [T('Ensuite', 'Afterwards'), kit ? T('Le dossier fonctionne avec cette bouteille. Le copier vers Windows ou une autre bouteille le casserait, sauf après « Tout annuler ».', 'The folder works with this bottle. Copying it to Windows or another bottle would break it, unless you use “Undo all” first.') : T('Copiez le dossier où vous voulez : Windows, CrossOver, Wine… Rien de propre au Mac n’est ajouté (pas de pont DLSS).', 'Copy the folder wherever you like: Windows, CrossOver, Wine… Nothing Mac-specific is added (no DLSS bridge).')],
    [T('Annulation', 'Undo'), kit ? T('Tout s’annule depuis le bilan, correctif par correctif ou d’un coup.', 'Everything can be undone from the report, fix by fix or all at once.') : T('Rien à annuler.', 'Nothing to undo.')]
  ];
  const modeOpt = (kit, title, lead) => h('button', { class: 'o2f-mode' + (S0.kit === kit ? ' on' : ''), role: 'radio', 'aria-checked': String(S0.kit === kit), onclick: () => { if (S0.kit !== kit) { S0.kit = kit; sfx.tick(); renderMac(); } } },
    h('div', { class: 'tt' }, h('i', { class: 'rad' }), title),
    h('div', { class: 'bd' }, muted(lead), h('div', { class: 'o2f-grid' }, rowsOf(kit).flatMap(([a, b]) => [eyebrow(a), muted(b)]))));
  const fixCard = (f, b) => h('div', { class: 'o2f-row' }, h('b', {}, f.t), muted(f.d(b)),
    f.files.length ? h('div', { class: 'o2f-meta' }, T('Fichiers touchés', 'Files touched') + ' : ' + f.files.join(', ')) : null, f.lines.length ? h('pre', { class: 'ln' }, f.lines.join('\n')) : null);
  const bsBlock = (bs, shown) => {
    if (!bs || !shown.includes(bs.state)) return null;
    const txt = bs.state === 'ok' ? T(`Bottled Shaders ${bs.version} : à jour.`, `Bottled Shaders ${bs.version}: up to date.`) : T(`Bottled Shaders ${bs.version} : à mettre à jour (au moins ${bs.minimum}).`, `Bottled Shaders ${bs.version}: needs an update (at least ${bs.minimum}).`);
    const act = bs.state !== 'ok';
    return h('div', { class: 'o2f-row o2f-center' }, h('b', {}, 'Bottled Shaders'), muted(txt),
      act ? muted(T(`Archive trouvée : ${bs.archive.name} (${bs.archive.folder})`, `Archive found: ${bs.archive.name} (${bs.archive.folder})`)) : null,
      act ? h('div', { class: 'o2f-meta' }, T('mO2FLATTENER ne l’installe pas : installez-la dans votre instance MO2 comme un mod, puis relancez l’assemblage.', 'mO2FLATTENER does not install it: install it in your MO2 instance like any mod, then run the assembly again.')) : null,
      act ? h('button', { class: 'o2f-t3 fit', onclick: () => toast({ icon: icon('mO2FLATTENER'), title: 'mO2FLATTENER', body: T('Démo : le Finder ne s’ouvre pas ici.', 'Demo: the Finder does not open here.') }) }, T('Afficher dans le Finder', 'Show in Finder')) : null);
  };
  const planFixes = (b, exists) => {
    const F = FIXES(), todo = [], skipped = [];
    for (const id of ORDER) {
      if (F[id].game && !exists) continue;
      if (id === 'compiler' && !b.net8) { skipped.push({ f: F[id], why: NO_NET8() }); continue; }
      todo.push({ id, f: F[id] });
    }
    return { todo, skipped };
  };
  function renderMac() {
    const kit = S0.kit, b = bottle(), dest = S0.dest.trim(), exists = !!S0.built[dest], prev = exists ? S0.built[dest].fixes.length : 0;
    const kids = [muted(T('Comment utiliserez-vous le jeu assemblé ?', 'How will you use the assembled game?')),
      modeOpt(false, T('Dossier universel (Stock)', 'Universal folder (Stock)'), T('Le dossier est livré tel que l’assemblage le produit : rien n’est ajouté ni modifié.', 'The folder is delivered exactly as the assembly produces it: nothing is added or changed.')),
      modeOpt(true, T('Pour une bouteille CrossOver (kit DXMT mORTEX)', 'For a CrossOver bottle (mORTEX DXMT kit)'), T('Prépare le jeu pour CrossOver sur Mac avec le kit DXMT de mORTEX : moteur graphique DXMT, pont DLSS, réglages d’affichage et DLL de la bouteille.', 'Gets the game ready for CrossOver on Mac with the mORTEX DXMT kit: DXMT graphics engine, DLSS bridge, display settings and bottle DLLs.'))];
    if (kit) {
      const bsel = h('select', { class: 'o2f-sel', 'aria-label': T('Bouteille CrossOver :', 'CrossOver bottle:'), onchange: e => { S0.bottle = e.target.value; S0.how = 'manual'; sfx.tick(); renderMac(); } }, bottles.map(x => h('option', { value: x.id, selected: x.id === S0.bottle }, x.id)));
      kids.push(h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, h('div', { class: 'o2f-fr nb' }, h('label', {}, T('Bouteille CrossOver :', 'CrossOver bottle:')), bsel),
        h('div', { class: 'o2f-meta o2f-hint' }, S0.how === 'manual' ? T('Choisie par vos soins.', 'Chosen by you.') : S0.how === 'detected' ? T('Détectée : elle contient la racine du jeu.', 'Detected: it contains the game root.') : T('Première bouteille CrossOver trouvée ; modifiable.', 'First CrossOver bottle found; you can change it.'))));
      if (!dest) kids.push(muted(T('Indiquez la racine du jeu cible (section 1) pour voir ce qui sera adapté.', 'Enter the target game root (section 1) to see what will be adapted.')));
      else {
        if (prev) kids.push(muted(T(`Une adaptation précédente est présente dans ce dossier (${prev} correctif(s)) : elle sera annulée avant le nouvel assemblage, puis le jeu sera adapté de nouveau.`, `A previous adaptation is present in this folder (${prev} fix(es)): it will be undone before the new assembly, then the game will be adapted again.`)));
        if (!exists) kids.push(muted(T('Le jeu cible n’existe pas encore. Seuls les correctifs de la bouteille sont annoncés ; ceux qui dépendent des fichiers du jeu (pont DLSS, SSE Display Tweaks, doublons) seront examinés à la fin de l’assemblage et détaillés dans le bilan, où vous pourrez les annuler.', 'The target game does not exist yet. Only the bottle fixes are announced; those that depend on the game’s files (DLSS bridge, SSE Display Tweaks, duplicates) will be examined at the end of the assembly and detailed in the report, where you can undo them.')));
        const { todo, skipped } = planFixes(b, exists);
        if (todo.length) kids.push(eyebrow(T('Sera appliqué', 'Will be applied')), ...todo.map(x => fixCard(x.f, b)));
        if (skipped.length) kids.push(eyebrow(T('Ne sera pas fait', 'Will not be done')), ...skipped.map(x => muted(`${x.f.t} — ${x.why}`)));
        if (exists) kids.push(bsBlock(b.bs, ['outdated', 'unknown']));
        kids.push(muted(T('Les fichiers d’origine sont copiés dans le dossier _MAC_BACKUP du jeu : tout s’annule après l’assemblage.', 'The original files are copied into the game’s _MAC_BACKUP folder: everything can be undone after the assembly.')));
      }
    }
    macHost.replaceChildren(...kids.filter(Boolean));
  }
  const macSoon = now => { clearTimeout(macTimer); macTimer = setTimeout(() => alive() && S0.run === 'idle' && renderMac(), now ? 10 : 450); };

  /* ---------- actions, progression, journal ---------- */
  const startBtn = h('button', { class: 'sbtn act', onclick: () => start() }, '📦  ' + T('LANCER L’ASSEMBLAGE COMPLET', 'START COMPLETE ASSEMBLY'));
  const stopBtn = h('button', { class: 'sbtn stop', disabled: true, onclick: () => stopRun() }, '🛑  ' + T('INTERROMPRE L’ASSEMBLAGE', 'ABORT ASSEMBLY'));
  const barFill = h('i'), prog = h('div', { class: 'o2f-prog', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 0 }, barFill);
  const pre = h('pre', { tabindex: '0', 'aria-label': T('Journal des opérations', 'Operations log') });
  const logCard = h('section', { class: 'o2f-card o2f-log' }, h('div', { class: 'o2f-eyebrow', style: { marginBottom: '12px' } }, T('JOURNAL DES OPÉRATIONS', 'OPERATIONS LOG')), pre);
  const repHost = h('div', { style: { display: 'contents' } });
  const hdSt = h('span', { class: 'st', 'aria-live': 'polite' });
  const stText = () => {
    const k = S0.status, base = 'Skyrim SE/AE • ';
    if (k === 'idle') return base + (S0.statusProfile || T('En attente de configuration', 'Waiting for configuration'));
    return base + ({ analyzing: T('Analyse des priorités en RAM...', 'Analyzing priorities in RAM...'), running: T('Assemblage accéléré en cours...', 'Accelerated assembly in progress...'), mac: T('Adaptation au Mac en cours...', 'Mac adaptation in progress...'),
      done: T('Assemblage terminé', 'Assembly finished'), stopped: T('Assemblage interrompu', 'Assembly aborted'), error: T('Erreur rencontrée', 'Error encountered') })[k];
  };
  const setStatus = k => { S0.status = k; hdSt.textContent = stText(); };
  const setProg = p => { S0.progress = p; barFill.style.width = p + '%'; prog.setAttribute('aria-valuenow', p); };
  const L = s => { const bottom = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 40; pre.append((pre.firstChild ? '\n' : '') + s); if (bottom) pre.scrollTop = pre.scrollHeight; };
  const syncRun = () => {
    const running = S0.run !== 'idle';
    startBtn.disabled = running; stopBtn.disabled = S0.run !== 'running';
    [card1, card2, card3].forEach(c => { c.classList.toggle('lock', running); c.inert = running; });
  };

  /* ---------- profils ---------- */
  const mo2Key = p => { p = p.trim().replace(/\/+$/, ''); return INST[p] !== undefined ? p : p.replace(/\/mods$/, ''); };
  const inst = p => INST[mo2Key(p)];
  function drawProfiles() {
    sel.replaceChildren(...S0.profiles.map(p => h('option', { value: p, selected: p === S0.profile }, p)));
    sel.value = S0.profile;
  }
  function scanProfiles(base) {
    const i = inst(base), prof = i && i.profiles;
    S0.profiles = prof ? Object.keys(prof) : []; S0.profile = ''; S0.statusProfile = '';
    if (!prof) { L(T('[AVERTISSEMENT] Aucun dossier \'profiles\' détecté dans ', '[WARNING] No \'profiles\' folder found in ') + base); drawProfiles(); setStatus('idle'); sfx.close(); return; }
    S0.profile = S0.profiles[0]; drawProfiles(); profileSelected(true);
  }
  function profileSelected() {
    const base = mo2Key(S0.mo2);
    if (!S0.profile || !inst(S0.mo2)) return;
    setField(fList, 'modlist', `${base}/profiles/${S0.profile}/modlist.txt`); S0.statusProfile = S0.profile; if (S0.run === 'idle') setStatus('idle'); sfx.tick();
  }
  const modlists = () => { const i = inst(S0.mo2), base = mo2Key(S0.mo2); return [...(i && i.profiles ? Object.keys(i.profiles).map(p => [`${base}/profiles/${p}/modlist.txt`, p]) : []), [DL + '/modlist.txt', T('fichier isolé', 'loose file')]]; };
  const validModlist = p => modlists().some(([x]) => x === p.trim()) || p.trim() === DL + '/modlist.txt';

  /* ---------- feuilles et alertes ---------- */
  function modal(build, cls) {
    closeModal && closeModal();
    const scrim = h('div', { class: 'o2f-scrim' }), panel = h('div', { class: cls, role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
    scrim.append(panel); root.append(scrim); wrap.inert = true;
    const close = () => { if (!scrim.isConnected) return; scrim.remove(); if (closeModal === close) { closeModal = null; wrap.inert = false; root.focus({ preventScroll: true }); } };
    closeModal = close; build(panel, close);
    if (!reduced()) panel.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    setTimeout(() => (panel.querySelector('[data-def]') || panel).focus({ preventScroll: true }), 30);
    return close;
  }
  function alertBox(kind, title, msg) {
    modal((p, close) => {
      p.append(h('img', { src: icon('mO2FLATTENER'), alt: '' }), h('div', { class: 'tx' }, h('b', {}, title), h('p', {}, msg), h('div', { class: 'o2f-acts' }, h('button', { class: 'sbtn sm sent acc', 'data-def': '', onclick: close }, 'OK'))));
      p.onkeydown = e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); close(); } };
    }, 'o2f-alert');
    kind === 'ok' ? sfx.done() : sfx.close();
  }
  function pickFolder(title, items, onPick) {
    sfx.click();
    modal((p, close) => {
      let cur = items[0][0], btns;
      const apply = () => btns.forEach((b, i) => { b.classList.toggle('on', items[i][0] === cur); b.setAttribute('aria-pressed', items[i][0] === cur); });
      const pick = v => { close(); onPick(v); };
      btns = items.map(([path, hint]) => h('button', { class: 'o2f-li', onclick: () => { cur = path; sfx.tick(); apply(); }, ondblclick: () => pick(path) }, h('span', {}, '📁 ' + path), hint ? h('span', { class: 'mu' }, hint) : null));
      apply();
      p.append(h('div', {}, h('h4', {}, title), h('p', { class: 'msg' }, T('Choisissez dans la liste (démo : aucun fichier n’est lu).', 'Pick from the list (demo: no file is read).'))), h('div', { class: 'o2f-list' }, btns),
        h('div', { class: 'o2f-acts' }, h('button', { class: 'sbtn sm sent', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn sm sent acc', 'data-def': '', onclick: () => pick(cur) }, T('Ouvrir', 'Open'))));
      p.onkeydown = e => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = clamp(items.findIndex(x => x[0] === cur) + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1); cur = items[i][0]; apply(); btns[i].focus({ preventScroll: true }); }
        else if (e.key === 'Enter' && !e.target.closest('.sbtn')) { e.preventDefault(); pick(cur); }
      };
    }, 'o2f-sheet');
  }

  /* ---------- assemblage ---------- */
  async function start() {
    if (S0.run !== 'idle') return;
    const err = T('Erreur', 'Error');
    const i = inst(S0.mo2);
    if (!S0.mo2.trim() || !i) return alertBox('err', err, T('Le dossier MO2 ou MODS spécifié est introuvable.', 'The specified MO2 or MODS directory was not found.'));
    if (!validModlist(S0.modlist)) return alertBox('err', err, T('Le fichier modlist.txt spécifié est introuvable.', 'The specified modlist.txt file was not found.'));
    if (!S0.dest.trim()) return alertBox('err', err, T('Veuillez définir le dossier racine de destination du jeu.', 'Please specify a target game root directory.'));
    if (S0.cpPlug && !S0.plug.trim()) return alertBox('err', err, T('Veuillez définir le dossier de destination pour plugins.txt.', 'Please choose a destination folder for plugins.txt.'));
    if (S0.cpIni && !S0.ini.trim()) return alertBox('err', err, T('Veuillez définir le dossier de destination pour les fichiers INI.', 'Please choose a destination folder for INI files.'));
    sfx.click();
    const dest = S0.dest.trim(), kit = S0.kit, b = bottle(), prevFix = S0.built[dest] ? S0.built[dest].fixes.length : 0;
    const prof = i.profiles ? i.profiles[S0.profile] : undefined, total = prof || 21834;
    S0.run = 'running'; S0.stop = false; S0.report = null; pre.textContent = ''; repHost.replaceChildren(); setProg(0); setStatus('analyzing'); syncRun();
    const live = () => alive() && !S0.stop;
    L(T(`[*] Analyse de l'ordre de priorité : modlist.txt`, '[*] Analyzing priority order: modlist.txt')); await pause(350);
    L(T('[*] Indexation rapide en mémoire des fichiers uniques...', '[*] Fast RAM indexation of unique files in progress...')); await pause(500);
    if (!alive()) return;
    setStatus('running');
    if (prevFix) { L(T(`[*] Adaptation au Mac précédente annulée avant le nouvel assemblage (${prevFix} correctif(s)).`, `[*] Previous Mac adaptation undone before the new assembly (${prevFix} fix(es)).`)); await pause(250); }
    L(T(`[*] Dossier racine : ${dest}`, `[*] Root folder: ${dest}`)); L(T(`[*] Dossier Data   : ${dest}/Data`, `[*] Data folder: ${dest}/Data`));
    L(T('[*] Filtres actifs : exclusion des .pdb, .mohidden et dossiers inertes', '[*] Active filters: excluding .pdb, .mohidden, and junk folders')); await pause(300);
    L(T(`[*] Indexation terminée : ${total} fichiers finaux uniques à déployer.`, `[*] Indexing complete: ${total} unique final files to deploy.`));
    L(T('[*] Démarrage de la copie optimisée multi-thread...', '[*] Starting optimized multi-threaded copy...'));
    /* copie */
    const dur = reduced() ? 0 : clamp(900 + total * 0.2, 1000, 5200), t0 = performance.now(); let lastLog = 0;
    await new Promise(res => {
      const step = now => {
        if (!live()) return res();
        const k = dur ? clamp((now - t0) / dur, 0, 1) : 1, copied = Math.floor(k * total);
        setProg(Math.min(95, Math.floor(k * 95)));
        while (lastLog + 500 <= copied && lastLog + 500 < total) { lastLog += 500; L(T(`    [${lastLog}/${total}] fichiers déployés...`, `    [${lastLog}/${total}] files deployed...`)); if (lastLog % 2000 === 0) sfx.tick(); }
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    if (!alive()) return;
    if (S0.stop) return stopped();
    L(T(`    [${total}/${total}] fichiers déployés...`, `    [${total}/${total}] files deployed...`));
    if (S0.cpPlug) { await pause(250); L(T(`[+] plugins.txt déployé dans : ${S0.plug}/plugins.txt`, `[+] plugins.txt deployed to: ${S0.plug}/plugins.txt`)); }
    if (S0.cpIni) for (const n of ['Skyrim.ini', 'SkyrimPrefs.ini']) { await pause(200); L(T(`[+] Configuration ${n} copiée.`, `[+] Configuration ${n} copied.`)); }
    let report;
    if (!kit) { await pause(300); L(T('[*] Dossier universel : aucune adaptation au Mac, rien n’a été modifié.', '[*] Universal folder: no Mac adaptation, nothing was changed.')); report = { mode: 'stock', items: [], undone: 0 }; }
    else {
      setStatus('mac'); setProg(97); S0.run = 'mac'; syncRun(); await pause(450);
      L(T('[*] Adaptation au Mac : analyse du jeu...', '[*] Mac adaptation: checking the game...'));
      const { todo, skipped } = planFixes(b, true), items = [];
      await pause(400);
      for (const x of todo) { L(T(`    [Mac] À appliquer : ${x.f.t}`, `    [Mac] To apply: ${x.f.t}`)); await pause(160); }
      for (const x of skipped) { L(T(`    [Mac] Ignoré : ${x.f.t}`, `    [Mac] Skipped: ${x.f.t}`)); await pause(120); }
      for (const x of todo) { await pause(380); if (!alive()) return; L(T(`[+] Mac : ${x.f.t} — appliqué.`, `[+] Mac: ${x.f.t} — applied.`)); sfx.tick(); items.push({ id: x.id, status: 'applied', t: x.f.t, d: x.f.d(b), files: x.f.files, undoable: true }); }
      skipped.forEach(x => items.push({ id: 'compiler', status: 'skipped', t: x.f.t, why: x.why }));
      items.sort((a, c) => ORDER.indexOf(a.id) - ORDER.indexOf(c.id));
      await pause(250);
      L(T(`[*] Adaptation au Mac terminée : ${todo.length} appliqué(s), 0 échoué(s), ${skipped.length} ignoré(s).`, `[*] Mac adaptation finished: ${todo.length} applied, 0 failed, ${skipped.length} skipped.`));
      report = { mode: 'kit', items, undone: 0, bs: b.bs, dest };
      S0.built[dest] = { fixes: todo.map(x => x.id) };
    }
    if (!alive()) return;
    if (!kit) S0.built[dest] = { fixes: [] };
    setProg(100); L('\n' + T(`[SUCCÈS] Assemblage terminé (${total} fichiers uniques traités).`, `[SUCCESS] Assembly finished (${total} unique files processed).`));
    S0.report = report; S0.run = 'idle'; setStatus('done'); syncRun(); renderMac(); renderReport(true);
    pre.scrollTop = pre.scrollHeight; sfx.done();
    await pause(350); if (!alive()) return;
    alertBox('ok', T('Succès', 'Success'), T('L’assemblage complet du jeu s’est terminé avec succès !', 'Game assembly completed successfully!'));
    toast({ icon: icon('mO2FLATTENER'), title: 'mO2FLATTENER', body: T(`${num(total)} fichiers dans « ${dest.split('/').pop()} ».`, `${num(total)} files in “${dest.split('/').pop()}”.`) });
  }
  function stopRun() {
    if (S0.run !== 'running') return; S0.stop = true; setStatus('stopped'); L('\n' + T('[INTERRUPTION] Demande d’arrêt envoyée au moteur...', '[ABORT] Stop signal sent to worker engine...')); sfx.close();
  }
  async function stopped() {
    S0.run = 'idle'; syncRun(); renderMac(); await pause(200); if (!alive()) return;
    alertBox('err', T('Erreur', 'Error'), T('L’assemblage a été interrompu par l’utilisateur.', 'Assembly was stopped by user.'));
  }

  /* ---------- bilan Mac ---------- */
  function renderReport(animate) {
    const r = S0.report; if (!r) { repHost.replaceChildren(); return; }
    const stock = r.mode === 'stock', items = r.items, appliedLeft = items.some(x => x.status === 'applied'), undoable = items.some(x => x.undoable);
    let summary, cls = 'o2f-mut';
    if (stock) { summary = T('Aucune adaptation : le dossier est tel que l’assemblage l’a produit, rien n’a été modifié. Copiez-le où vous voulez.', 'No adaptation: the folder is exactly as the assembly produced it, nothing was changed. Copy it wherever you like.'); cls = 'o2f-soft'; }
    else if (S0.undoBusy) summary = T('Annulation…', 'Undoing…');
    else if (r.undone > 0 && !appliedLeft) { summary = T('Tout est annulé : le jeu est revenu à son état d’avant l’adaptation.', 'Everything is undone: the game is back to its state before the adaptation.'); cls = 'o2f-soft'; }
    else summary = T('Assemblage terminé. Voici ce que l’adaptation au Mac a fait.', 'Assembly complete. Here is what the Mac adaptation did.');
    const item = it => {
      const chip = it.status === 'skipped' ? ['wn', T('Ignoré', 'Skipped')] : ['ok', T('Appliqué', 'Applied')];
      return h('div', { class: 'o2f-rep' }, h('span', { class: 'chip2 ' + chip[0] }, chip[1]),
        h('div', { class: 'col' }, h('b', {}, it.t), muted(it.status === 'skipped' ? it.why : it.d), it.files && it.files.length ? h('div', { class: 'o2f-meta' }, T('Fichiers touchés', 'Files touched') + ' : ' + it.files.join(', ')) : null),
        it.undoable ? h('button', { class: 'o2f-t3 fit', disabled: S0.undoBusy, onclick: () => undo(it.id) }, T('Annuler', 'Undo')) : h('span'));
    };
    const notes = [r.undone > 0 && appliedLeft ? T(`${r.undone} correctif(s) annulé(s).`, `${r.undone} fix(es) undone.`) : null, appliedLeft ? T('Gardez le dossier _MAC_BACKUP à la racine du jeu : il contient les fichiers d’origine nécessaires pour annuler.', 'Keep the _MAC_BACKUP folder at the root of the game: it holds the original files needed to undo.') : null].filter(Boolean);
    const card = h('section', { class: 'o2f-card', 'aria-label': T('Bilan Mac', 'Mac report') }, h('div', { class: 'o2f-ct' }, stock ? T('DOSSIER UNIVERSEL', 'UNIVERSAL FOLDER') : T('BILAN MAC', 'MAC REPORT')), h('div', { class: cls }, summary),
      ...items.map(item), stock ? null : bsBlock(r.bs, ['stock', 'outdated', 'unknown', 'ok']),
      undoable ? h('div', { class: 'o2f-center' }, h('button', { class: 'o2f-t3 fit', disabled: S0.undoBusy, onclick: () => undo('all') }, T('Tout annuler', 'Undo all'))) : null,
      notes.length ? h('div', { class: 'o2f-meta', style: { textAlign: 'center' } }, notes.join(' ')) : null);
    repHost.replaceChildren(card);
    if (animate && !reduced()) { card.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'ease-out' }); setTimeout(() => alive() && scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }), 120); }
    else if (animate) scroller.scrollTop = scroller.scrollHeight;
  }
  async function undo(target) {
    const r = S0.report; if (!r || S0.undoBusy || S0.run !== 'idle') return;
    S0.undoBusy = true; sfx.click(); renderReport(); await pause(650); if (!alive()) return;
    const gone = r.items.filter(x => x.undoable && (target === 'all' || x.id === target));
    gone.forEach(x => L(T(`[+] Mac : ${x.t} — annulé.`, `[+] Mac: ${x.t} — undone.`)));
    r.items = r.items.filter(x => !gone.includes(x)); r.undone += gone.length; const dst = Object.keys(S0.built).find(k => S0.built[k].fixes.length);
    if (dst) S0.built[dst].fixes = S0.built[dst].fixes.filter(id => !gone.some(x => x.id === id));
    S0.undoBusy = false; renderReport(); renderMac(); sfx.pop();
  }

  /* ---------- assemblage de la fenêtre ---------- */
  const head = h('header', { class: 'o2f-head' }, h('span', { class: 'bolt' }, '⚡'), h('h1', {}, h('span', { html: brand('mO2FLATTENER', COLOR) }), ' · ' + T('Assembleur d’Instance Mod Organizer 2', 'Mod Organizer 2 Instance Flattener')), hdSt);
  const scroller = h('div', { class: 'o2f-scroll' }, card1, card2, card3, h('div', { class: 'o2f-actions' }, startBtn, stopBtn), prog, logCard, repHost);
  const wrap = h('div', { class: 'o2f-wrap' }, head, scroller);
  const bar = h('div', { class: 'o2f-bar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('mO2FLATTENER', COLOR), style: { fontSize: '15px', letterSpacing: '.025em', color: 'var(--s-ts)', marginLeft: '6px' } }), dlBtn(app));
  const root = h('div', { class: 'o2f', tabindex: '-1' }, bar, wrap);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && closeModal) { e.preventDefault(); closeModal(); } });
  drawProfiles(); setStatus('idle'); syncRun(); renderMac();
  oPlug.inp.disabled = !S0.cpPlug; oIni.inp.disabled = !S0.cpIni;
  return root;
}
