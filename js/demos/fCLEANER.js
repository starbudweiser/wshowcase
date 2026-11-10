/* Réplique interactive de fCLEANER (interface Socle) : choisir un dossier, analyser (simulation), lire le journal, purger après confirmation.
   Les dossiers sont des arborescences fictives en mémoire : les motifs de détection sont ceux de l'appli et décident vraiment de ce qui est repéré. Rien n'est lu ni supprimé. */
import { h, brand, esc, wait, reduced, clamp, T, wm, sfx, icon, toast, css } from './kit.js';
import { setLang, lang } from '../i18n.js';

/* ---- motifs de l'appli (insensibles à la casse, testés sur le nom seul) ---- */
const FILE_RX = new RegExp([
  '^thumbs\\.db$', '^desktop\\.ini$', '^\\.DS_Store$', '\\.mohidden$', '\\.modgroups$', '^modgroups\\.json$', '^vortex\\.deployment\\.json$', '^_{0,2}folder_managed_by_vortex$', '\\.vortex_backup', '\\.vortex_lnk$',
  '^(collection\\.json|collection\\.meta|manifest\\.json)$', '\\.(bak|tmp|crdownload)$', ' - cop(y|ie|ia)\\.[^.]+$', ' - [©▒¥\\?]+\\.[^.]+$', '\\.(pdn|xcf|psd)$', '\\.(docx?|rtf|odt)$', '^(dummy texture|faketexture)\\.dds$',
  '^(readme|read_me|read me|lisezmoi|lisez_moi|lisez moi|instructions?|changelog|licen[sc]e|eula|copying)\\.(txt|md)$'].map(p => `(?:${p})`).join('|'), 'i');
const DIR_RX = new RegExp(['\\.mohidden$', ' - cop(y|ie|ia)$', '^__vortex_', '^\\.vortex_staging$', '^_{0,2}folder_managed_by_vortex$', '^modgroups$'].map(p => `(?:${p})`).join('|'), 'i');

/* ---- arborescences d'exemple : lignes « chemin:taille » (octets, ou 12K, 2.4M) ---- */
const hash = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return (x >>> 0) % 1000 / 1000; };
const rng = (s, a, b) => Math.round(a + hash(s) * (b - a));
const mod = (name, extra = []) => { const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_'); return [`mods/${name}/${name}.esp:${rng(name, 2e4, 2e6)}`, `mods/${name}/meshes/${slug}/main.nif:${rng(name + 'm', 3e5, 9e6)}`, `mods/${name}/textures/${slug}/main_d.dds:${rng(name + 't', 1e6, 2.2e7)}`, ...extra.map(e => `mods/${name}/${e}`)]; };
const CLEAN_MODS = ['Unofficial Patch Hub', 'Better Rivers', 'Lantern of Souls', 'Obsidian Mountain Fogs', 'Rustic Windmills', 'Noble Hearth Cabin', 'Moonpath Ambience', 'Bandit Camps Rework', 'Wolf Pack Behaviors'];
const SAMPLES = [
  { path: '/Users/Shared/Skyrim/MO2', fr: 'Instance Mod Organizer 2, 31 mods', en: 'Mod Organizer 2 instance, 31 mods', lines: [
    'ModOrganizer.ini:4K', 'profiles/Default/modlist.txt:18K', 'profiles/Default/plugins.txt:6K', 'downloads/Frost Patch-2041-2-0-1.7z.crdownload:5M', 'downloads/desktop.ini:0',
    ...CLEAN_MODS.flatMap(n => mod(n)),
    ...mod('Ancient Realms HD', ['desktop.ini:0', 'Readme.txt:7K', 'source.psd:38M', 'textures/ancient/stone_d.dds:4M']),
    ...mod('Frost Patch', ['Frost Patch.esp.bak:312K', 'Thumbs.db:12K']),
    ...mod('Dragon Rework', ['CHANGELOG.md:3K', 'License.txt:2K', 'modgroups/default.modgroups:5K', 'modgroups/notes.json:1K']),
    ...mod('Whiterun Reborn', ['.DS_Store:6K', 'Whiterun Reborn - copy/Whiterun Reborn.esp:1.4M', 'Whiterun Reborn - copy/meshes/walls.nif:2.2M']),
    ...mod('Nordic Ruins Overhaul', ['Nordic Ruins Overhaul - Copie.esp:1.1M', 'LisezMoi.txt:4K', 'preview.xcf:12M']),
    ...mod('Immersive Weapons Patch', ['instructions.txt:2K', 'weapons_notes.txt:3K', 'IWP.esp.tmp:0']),
    ...mod('Animated Whistling', ['.DS_Store:6K', 'readme.txt:7']),
    ...mod('A Closer Look', ['A Closer Look.esp.bak:2K', 'Thumbs.db:12K']),
    ...mod('Better Dragon Bones', ['faketexture.dds:1K', 'dummy texture.dds:1K']),
    ...mod('Elegant Cloaks', ['guide.docx:240K', 'notes.rtf:12K', 'cloak.pdn:2.1M', 'Elegant Cloaks.esp.mohidden:48K']),
    ...mod('Hearthfire Extensions', ['meshes/old_door.nif.mohidden:20K']),
    ...mod('Agatha - Redguard Preset', ['desktop.ini:0', 'Readme.txt:7', 'source.psd:2'])] },
  { path: '/Users/Shared/Skyrim/Vortex Collection', fr: 'Collection Nexus déployée par Vortex', en: 'Nexus collection deployed by Vortex', lines: [
    'vortex.deployment.json:84K', 'collection.json:230K', 'manifest.json:2K', '__folder_managed_by_vortex:0', 'ActiveMods.json.vortex_backup:12K', 'Engine.log.vortex_backup:90K',
    'Data/Skyrim.esm.vortex_lnk:0', 'Data/Update.esm.vortex_lnk:0', 'Data/textures/terrain.dds.vortex_lnk:0', 'Data/Frost Patch.esp:312K', 'Data/Dragon Rework.esp:1.1M', 'Data/Rustic Windmills.esp:96K', 'Data/meshes/main.nif:4.4M', 'Data/Readme.txt:9K',
    '.vortex_staging/Ancient Realms HD/Ancient Realms HD.esp:1.4M', '.vortex_staging/Ancient Realms HD/textures/stone.dds:18M', '.vortex_staging/Frost Patch/Frost Patch.esp:312K',
    '__vortex_staging_old/readme.txt:7K', '__vortex_staging_old/Wolf Pack Behaviors/pack.esp:210K', 'Data/modgroups/default.modgroups:3K'] },
  { path: '/Users/Shared/Skyrim/Clean Install', fr: 'Installation propre, rien à purger', en: 'Clean install, nothing to purge', lines: [
    'Data/Skyrim.esm:240M', 'Data/Update.esm:12M', 'Data/meshes/actors/character/body.nif:1.6M', 'Data/textures/terrain/whiterun_d.dds:22M', 'Data/Frost Patch.esp:312K', 'Data/Dragon Rework.esp:1.1M', 'Data/Interface/fonts_en.txt:14K'] }
];
const parseSize = s => { const m = /^([\d.]+)([KMG]?)$/.exec(s); return Math.round(parseFloat(m[1]) * ({ '': 1, K: 1024, M: 1048576, G: 1073741824 })[m[2]]); };
const buildTree = lines => {
  const root = { n: '', kids: new Map() };
  for (const ln of lines) {
    const i = ln.lastIndexOf(':'), parts = ln.slice(0, i).split('/'), size = parseSize(ln.slice(i + 1)); let cur = root;
    parts.forEach((p, k) => { if (k === parts.length - 1) cur.kids.set(p, { n: p, size }); else { if (!cur.kids.has(p)) cur.kids.set(p, { n: p, kids: new Map() }); cur = cur.kids.get(p); } });
  }
  return root;
};
const treeSize = n => (n.kids ? [...n.kids.values()].reduce((a, k) => a + treeSize(k), 0) : n.size);
/* Parcours descendant : un dossier parasite est retenu en bloc et n'est pas exploré. */
function scan(root) {
  const files = [], dirs = [];
  const walk = (node, rel) => {
    for (const k of node.kids.values()) {
      const p = rel ? rel + '/' + k.n : k.n;
      if (k.kids) { if (DIR_RX.test(k.n)) dirs.push({ path: p, size: treeSize(k), node: k, parent: node }); else walk(k, p); }
      else if (FILE_RX.test(k.n)) files.push({ path: p, size: k.size, node: k, parent: node });
    }
  };
  walk(root, ''); return { files, dirs };
}
const fmtSize = b => (b < 1024 ? `${b} ${T('octets', 'bytes')}` : b < 1048576 ? (b / 1024).toFixed(1) + ' ' + T('Ko', 'KB') : b < 1073741824 ? (b / 1048576).toFixed(2) + ' ' + T('Mo', 'MB') : (b / 1073741824).toFixed(2) + ' ' + T('Go', 'GB'));

/* ---- règles de filtrage (fenêtre d'aide) ---- */
const RULES = [
  [['1. Caches et fichiers système', '1. OS caches and system files'], [['`thumbs.db` (miniatures Windows)', '`thumbs.db` (Windows thumbnail cache)'], ['`desktop.ini` (réglages de dossier Windows)', '`desktop.ini` (Windows folder settings)'], ['`.DS_Store` (métadonnées macOS)', '`.DS_Store` (macOS metadata)']]],
  [['2. Mod Organizer 2', '2. Mod Organizer 2'], [['Fichiers et dossiers masqués : `*.mohidden`', 'Hidden files and folders: `*.mohidden`']]],
  [['3. xEdit (SSEEdit / FO4Edit)', '3. xEdit (SSEEdit / FO4Edit)'], [['Groupes de mods : `*.modgroups`, `modgroups.json`', 'Modgroup files: `*.modgroups`, `modgroups.json`'], ['Dossiers : `modgroups/`', 'Folders: `modgroups/`']]],
  [['4. Vortex et collections Nexus Mods', '4. Vortex and Nexus Mods collections'], [['Déploiement : `vortex.deployment.json`', 'Deployment: `vortex.deployment.json`'], ['Marqueurs : `folder_managed_by_vortex`, `__folder_managed_by_vortex`', 'Markers: `folder_managed_by_vortex`, `__folder_managed_by_vortex`'],
    ['Sauvegardes : `ActiveMods.json.vortex_backup`, `Engine.log.vortex_backup`, `*.vortex_backup*`', 'Backups: `ActiveMods.json.vortex_backup`, `Engine.log.vortex_backup`, `*.vortex_backup*`'], ['Liens symboliques résiduels : `*.vortex_lnk`', 'Residual symlinks: `*.vortex_lnk`'],
    ['Métadonnées Nexus : `collection.json`, `collection.meta`, `manifest.json`', 'Nexus metadata: `collection.json`, `collection.meta`, `manifest.json`'], ['Dossiers temporaires : `__vortex_*`, `.vortex_staging/`', 'Staging folders: `__vortex_*`, `.vortex_staging/`']]],
  [['5. Sauvegardes, temporaires et doublons', '5. Backups, temporary files and duplicates'], [['Sauvegardes : `*.bak`, `*.tmp`, `*.crdownload`', 'Backups: `*.bak`, `*.tmp`, `*.crdownload`'], ['Copies de fichiers : ` - copy.*`, ` - copie.*`, ` - copia.*`', 'File copies: ` - copy.*`, ` - copie.*`, ` - copia.*`'], ['Dossiers doublons : ` - copy`, ` - copie`, ` - copia`', 'Duplicate folders: ` - copy`, ` - copie`, ` - copia`']]],
  [['6. Documents bureautiques', '6. Office documents'], [['Traitements de texte : `*.doc`, `*.docx`, `*.rtf`, `*.odt`', 'Word processing: `*.doc`, `*.docx`, `*.rtf`, `*.odt`']]],
  [['7. Sources graphiques et fichiers factices', '7. Graphics sources and dummy files'], [['Projets graphiques : `*.pdn`, `*.xcf`, `*.psd`', 'Graphics projects: `*.pdn`, `*.xcf`, `*.psd`'], ['Textures de test : `dummy texture.dds`, `faketexture.dds`', 'Test textures: `dummy texture.dds`, `faketexture.dds`']]],
  [['8. Documentation et licences uniquement', '8. Documentation and licenses only'], [['Notices : `readme`, `read_me`, `lisezmoi`, `instructions`, `changelog` (.txt/.md)', 'Guides: `readme`, `read_me`, `instructions`, `changelog` (.txt/.md)'], ['Licences : `license`, `licence`, `eula`, `copying` (.txt/.md)', 'Licenses: `license`, `licence`, `eula`, `copying` (.txt/.md)']]]
];
const codeSpans = txt => txt.split('`').map((c, i) => (i % 2 ? h('code', {}, c) : c));

/** Feuille modale plate au-dessus de la fenêtre (Échap ferme, Tab reste dans la feuille). */
function sheet(root, { title, body, foot, width = 440, label }) {
  const prev = document.activeElement;
  const card = h('div', { class: 'x-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'fCLEANER', style: { width: width + 'px' } }, title ? h('div', { class: 'x-st' }, title) : null, body, foot ? h('div', { class: 'x-sf' }, foot) : null);
  const back = h('div', { class: 'x-back' }, card);
  const close = () => { back.remove(); const f = prev && prev.isConnected && prev !== document.body ? prev : root; f.focus({ preventScroll: true }); };
  back.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button:not(:disabled),input,select')]; if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus({ preventScroll: true }); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus({ preventScroll: true }); e.preventDefault(); }
    }
  });
  root.append(back);
  (card.querySelector('[data-first]') || card.querySelector('.acc:not(:disabled)') || card.querySelector('button')).focus({ preventScroll: true });
  return { close, card };
}

/** Raccourcis clavier valables tant que cette fenêtre est la fenêtre active (même si le focus est tombé sur la page) ; l'écouteur se retire tout seul à la fermeture. */
function hotkeys(w, root, fn) {
  const on = e => { if (!root.isConnected) { removeEventListener('keydown', on); return; } if (w.el.classList.contains('active') && !root.querySelector(':scope > .x-back')) fn(e); };
  addEventListener('keydown', on); return () => removeEventListener('keydown', on);
}

export function open(app) {
  css('css/demos/fCLEANER.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 920, h: 640, minw: 720, minh: 560, bare: true, cls: 'socle', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); },
    build: w => {
      const alive = () => !w.dead && root.isConnected;
      const fs = SAMPLES.map(s => ({ ...s, tree: buildTree(s.lines) }));
      let busy = false, scanned = null, tone = '', statusText = '';
      const root = h('div', { class: 'fcleaner', tabindex: '-1' });
      const input = h('input', { class: 'f-in', type: 'text', spellcheck: 'false', autocomplete: 'off', placeholder: T('Choisissez le dossier assemblé ou la collection à nettoyer.', 'Choose the assembled folder or collection to clean.'), 'aria-label': T('Dossier à nettoyer', 'Folder to clean') });
      const log = h('div', { class: 'f-log', role: 'log', 'aria-live': 'off', tabindex: '0' });
      const st = h('p', { class: 'f-st', 'aria-live': 'polite' });
      const chooseBtn = h('button', { class: 'sbtn', onclick: () => pickFolder() }, T('Choisir un dossier', 'Choose a folder'));
      const rulesBtn = h('button', { class: 'sbtn', onclick: () => showRules() }, T('Règles de filtrage', 'Filtering rules'));
      const purgeBtn = h('button', { class: 'sbtn', onclick: () => askPurge() }, T('Purger les résidus', 'Purge leftovers'));
      const scanBtn = h('button', { class: 'sbtn acc', onclick: () => start(false) }, T('ANALYSER', 'SCAN'));
      const broom = h('span', { class: 'f-bro', 'aria-hidden': 'true' }, '🧹');
      const langBtns = ['fr', 'en'].map(l => h('button', { class: lang() === l ? 'on' : '', 'aria-pressed': lang() === l, onclick: () => setLang(l) }, l.toUpperCase()));
      root.append(
        h('div', { class: 'f-tb', 'data-drag': '' }, wm.lights(w), h('div', { class: 'f-tt', html: brand(app.id, app.accent) + esc(' – ' + T('Nettoyeur d’instance', 'Instance cleaner')) })),
        h('div', { class: 'f-body' },
          h('div', { class: 'f-p raised' }, h('div', { class: 'f-hd' }, h('b', {}, broom, ' ', h('span', { html: brand(app.id, app.accent) })), h('div', { class: 'f-lang', role: 'group', 'aria-label': T('Langue', 'Language') }, langBtns)),
            h('p', { class: 'f-desc' }, T('Purge les résidus d’assemblage d’une instance ou d’une collection (MO2, Vortex, Nexus) : métadonnées, modgroups xEdit, caches système, sauvegardes (.BAK), doublons, documents bureautiques, sources graphiques (.PSD, .XCF, .PDN), lisez-moi et licences.',
              'Purges assembly leftovers from an instance or a collection (MO2, Vortex, Nexus): metadata, xEdit modgroups, OS caches, backups (.BAK), duplicates, office documents, graphics sources (.PSD, .XCF, .PDN), readmes and licenses.'))),
          h('div', { class: 'f-p f-path' }, input, chooseBtn),
          h('div', { class: 'f-p log' }, h('h3', {}, T('Journal', 'Log')), log),
          h('div', { class: 'f-p f-act' }, st, rulesBtn, purgeBtn, scanBtn)));

      /* ---- journal : lignes de morceaux colorés [texte, ton, gras] ---- */
      const seg = (t, c, b) => h('span', { class: (c || '') + (b ? ' b' : '') }, t);
      const addLine = parts => { const d = h('div', {}, ...parts.map(p => (typeof p === 'string' ? p : seg(...p)))); log.append(d); log.scrollTop = log.scrollHeight; return d; };
      const clearLog = () => log.replaceChildren();
      const setStatus = (text, t = '') => { statusText = text; tone = t; st.textContent = text; st.className = 'f-st ' + t; };
      const trimmed = () => input.value.trim().replace(/\/+$/, '');
      const current = () => fs.find(s => s.path.toLowerCase() === trimmed().toLowerCase());
      const refresh = () => { input.disabled = busy; chooseBtn.disabled = busy; rulesBtn.disabled = busy; scanBtn.disabled = busy; purgeBtn.disabled = !(!busy && scanned && scanned.path === current()?.path); };
      const idle = () => setStatus(current() ? T('Dossier prêt. Lancez l’analyse.', 'Folder ready. Run the scan.') : T('Choisissez un dossier pour commencer.', 'Choose a folder to get started.'));
  
      input.addEventListener('input', () => { if (scanned && scanned.path !== current()?.path) scanned = null; if (!busy) { idle(); tone = ''; } refresh(); });
      w.cleanup = hotkeys(w, root, e => {
        if (e.key === 'Enter' && !busy && (e.target === input || e.target === root || e.target === log || e.target === document.body)) { e.preventDefault(); start(false); }
      });

      function chosen(s, silent) {
        input.value = s.path; scanned = null; clearLog();
        addLine([[T('📁 Dossier sélectionné : ', '📁 Selected folder: ')], [s.path, 'a']]); idle(); refresh(); if (!silent) sfx.tick();
      }
      function pickFolder() {
        let sel = current() || fs[0];
        const list = h('div', { class: 'x-list', role: 'radiogroup' }), draw = () => list.replaceChildren(...fs.map(s => h('button', { class: 'x-li', role: 'radio', 'aria-checked': s === sel, onclick: () => { sel = s; sfx.tick(); draw(); } },
          h('span', { class: 'rd' + (s === sel ? ' on' : '') }), h('span', { class: 'n' }, h('b', {}, s.path), h('small', {}, T(s.fr, s.en))))));
        const sh = sheet(root, { title: T('Choisir le dossier à nettoyer', 'Choose the folder to clean'), width: 560,
          body: h('div', { class: 'x-sb' }, list),
          foot: [h('span', { class: 'x-note' }, T('Dossiers d’exemple : rien n’est lu sur votre ordinateur.', 'Sample folders: nothing is read from your computer.')), h('button', { class: 'sbtn', onclick: () => sh.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { sh.close(); chosen(sel); } }, T('Choisir', 'Choose'))] });
        draw();
      }
      function showRules() {
        const fr = lang() === 'fr';
        const lines = RULES.map(([t, items]) => h('div', {}, h('h4', {}, fr ? t[0] : t[1]), h('ul', {}, items.map(([a, b]) => h('li', {}, codeSpans(fr ? a : b))))));
        const note = h('p', {}, ...T('**Protégé :** tous les autres fichiers `.txt` de configuration des mods sont conservés.', '**Protected:** all other mod configuration `.txt` files are kept.').split('**').map((c, i) => (i % 2 ? h('b', {}, codeSpans(c)) : codeSpans(c))).flat());
        const sh = sheet(root, { width: 600, label: T('Règles de filtrage', 'Filtering rules'),
          body: h('div', { class: 'x-sb' }, h('h3', { class: 'x-h' }, T('📋 Éléments ciblés par la purge', '📋 Items targeted by the purge')), h('div', { class: 'f-rules', tabindex: '0' }, ...lines, note)),
          foot: [h('button', { class: 'sbtn acc', 'data-first': '', onclick: () => sh.close() }, T('Fermer', 'Close'))] });
      }
      function alertBox(title, msg, buttons, icn = true) {
        const sh = sheet(root, { width: 440, label: title, body: h('div', { class: 'x-al' }, icn ? h('img', { src: icon(app.id), alt: '' }) : null, h('div', {}, title === app.id ? h('b', { html: brand(app.id, app.accent) }) : h('b', {}, title), h('p', {}, msg))), foot: buttons(() => sh.close()) });
        return sh;
      }

      /* ---- analyse et purge ---- */
      async function start(clean) {
        if (busy) return;
        const s = current();
        if (!s) { alertBox('fCLEANER', T('Ce dossier n’existe pas ou n’est plus accessible. Choisissez-en un autre avec « Choisir un dossier ».', 'This folder does not exist or is no longer reachable. Choose another one with “Choose a folder”.'), close => [h('button', { class: 'sbtn acc', onclick: close }, 'OK')]); return; }
        const mode = clean ? T('PURGE', 'PURGE') : T('SIMULATION, aucune modification', 'DRY RUN, nothing is changed');
        busy = true; refresh(); clearLog(); setStatus(T(`Traitement en cours (${mode})…`, `Processing (${mode})…`)); sfx.click();
        addLine([[T('Dossier :', 'Folder:'), 'a', 1], ' ' + s.path]); addLine([[T('Mode :', 'Mode:'), 'a', 1], ' ' + mode]);
        await wait(reduced() ? 0 : 320); if (!alive()) return;
        const found = scan(s.tree);
        if (!found.files.length && !found.dirs.length) {
          addLine([]); addLine([[T('✓ Aucun résidu détecté. Le dossier est propre.', '✓ No leftovers detected. The folder is clean.'), 'o']]);
          busy = false; scanned = null; setStatus(T('Analyse terminée : aucun résidu.', 'Scan complete: no leftovers.'), 'ok'); refresh(); sfx.done(); return;
        }
        const total = found.files.reduce((a, x) => a + x.size, 0) + found.dirs.reduce((a, x) => a + x.size, 0);
        addLine([]); addLine([[T(`Détectés : ${found.files.length} fichier(s), ${found.dirs.length} dossier(s), ${fmtSize(total)}`, `Detected: ${found.files.length} file(s), ${found.dirs.length} folder(s), ${fmtSize(total)}`), '', 1]]); addLine([]);
        const items = [...found.files.map(x => ({ ...x, dir: false })), ...found.dirs.map(x => ({ ...x, dir: true }))];
        const gap = reduced() ? 0 : clamp(1700 / items.length, 10, 46), nb = '  ';
        let i = 0;
        for (const it of items) {
          if (!alive()) return;
          if (!clean) addLine([nb, [it.dir ? T('[DOSSIER DÉTECTÉ]', '[FOLDER DETECTED]') : T('[DÉTECTÉ]', '[DETECTED]'), 'w'], ` ${it.path}${it.dir ? '/' : ''} (${fmtSize(it.size)})`]);
          else { it.parent.kids.delete(it.node.n); addLine([nb, [it.dir ? T('[DOSSIER SUPPRIMÉ]', '[FOLDER DELETED]') : T('[SUPPRIMÉ]', '[DELETED]'), 'd'], it.dir ? ` ${it.path}/` : ` ${it.path} (${fmtSize(it.size)})`]); }
          if (i++ % 3 === 0) sfx.tick(); if (gap) await wait(gap);
        }
        if (!alive()) return;
        addLine([]); busy = false;
        if (clean) {
          const sum = T(`Purge terminée : ${found.files.length} fichier(s) et ${found.dirs.length} dossier(s) supprimés.`, `Purge complete: ${found.files.length} file(s) and ${found.dirs.length} folder(s) deleted.`);
          addLine([['✓ ' + sum, 'o']]); scanned = null; setStatus(sum, 'ok'); refresh(); sfx.done();
          broom.classList.remove('sweep'); void broom.offsetWidth; broom.classList.add('sweep');
          toast({ icon: icon(app.id), title: app.id, body: sum });
          alertBox(T('Purge terminée', 'Purge complete'), sum, close => [h('button', { class: 'sbtn acc', onclick: close }, 'OK')]);
        } else {
          const sum = T(`Analyse terminée : ${found.files.length} fichier(s) et ${found.dirs.length} dossier(s) à purger.`, `Scan complete: ${found.files.length} file(s) and ${found.dirs.length} folder(s) to purge.`);
          addLine([['✓ ' + sum, 'a']]); addLine([[T('Rien n’a été supprimé. Cliquez sur « Purger les résidus » pour les supprimer.', 'Nothing was deleted. Click “Purge leftovers” to delete them.'), 'm']]);
          scanned = { path: s.path, files: found.files.length, dirs: found.dirs.length }; setStatus(sum); refresh(); sfx.pop();
        }
      }
      function askPurge() {
        if (!scanned) return;
        alertBox(T('Purger les résidus', 'Purge leftovers'), T(`Supprimer définitivement ${scanned.files} fichier(s) et ${scanned.dirs} dossier(s) détectés ?\n\nLes autres fichiers .TXT des mods ne sont pas touchés. Cette opération est irréversible.`, `Permanently delete ${scanned.files} detected file(s) and ${scanned.dirs} folder(s)?\n\nOther mod .TXT files are not touched. This cannot be undone.`),
          close => [h('button', { class: 'sbtn acc', 'data-first': '', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn dgr', onclick: () => { close(); start(true); } }, T('Supprimer', 'Delete'))]);
      }

      chosen(fs[0], true);
      return root;
    } });
}
