/* Textes de l'interface : français (rédigé en premier) et anglais. Les autres langues viendront plus tard. */
import { store } from './util.js';
import { emit } from './core.js';
export const LANGS = ['fr', 'en'];
let L = 'fr';
const D = {
  fr: {
    'l.eyebrow': '{n} applications pour Mac', 'l.h1a': 'Essayez-les ici.', 'l.h1b': 'Installez-les ensuite.',
    'l.lead': 'Un Mac complet dans votre navigateur, avec deux bureaux. Ouvrez une appli, servez-vous-en, puis téléchargez-la si elle vous convient.',
    'l.cta': 'Allumer le Mac', 'l.skyrimlink': 'Vous venez de skyrimtools.com ? Bureau Skyrim ›', 'l.nav1': 'Skyrim Mac Toolkit', 'l.nav2': 'Utilitaires',
    'l.tip': 'Son activé : montez le volume pour le démarrage.', 'l.rotate': 'Pour une meilleure expérience, utilisez un ordinateur ou tournez votre appareil.',
    'l.foot': 'Fait par Starbudweiser et Claude Code (Anthropic). Licence MIT.', 'b.skip': 'Cliquez ou appuyez sur une touche pour passer',
    'm.aboutApp': 'À propos de wSHOWCASE', 'm.about': 'À propos de {app}', 'm.aboutFinder': 'À propos de wSHOWCASE', 'm.settings': 'Réglages système…', 'm.wallpaper': 'Fond d’écran…',
    'm.restart': 'Redémarrer…', 'm.shutdown': 'Éteindre…', 'm.download': 'Télécharger {app}…', 'm.quit': 'Quitter {app}', 'm.file': 'Fichier', 'm.newFinder': 'Nouvelle fenêtre du Finder',
    'm.close': 'Fermer la fenêtre', 'm.view': 'Présentation', 'm.go': 'Aller', 'm.search': 'Rechercher…', 'm.window': 'Fenêtre', 'm.minimize': 'Réduire', 'm.zoom': 'Zoom', 'm.help': 'Aide',
    'm.helpSite': 'Site skyrimtools.com', 'm.helpGh': 'Profil GitHub', 'm.changeWall': 'Changer le fond d’écran…', 'm.cleanup': 'Ranger les icônes', 'm.resetDesk': 'Remettre les icônes à leur place',
    'f.icons': 'Icônes', 'f.list': 'Liste', 'f.gallery': 'Galerie', 'f.search': 'Rechercher', 'f.spaces': 'Bureaux', 'f.tags': 'Étiquettes', 'f.tag.menubar': 'Barre des menus',
    'f.tag.demo': 'Démo interactive', 'f.tag.dl': 'Téléchargeables', 'f.empty': 'Aucune application ne correspond.', 'f.name': 'Nom', 'f.kind': 'Type', 'f.demo': 'Démo', 'f.version': 'Version',
    'f.kindApp': 'Application', 'f.kindMenu': 'Barre des menus', 'f.demoLive': 'Démo interactive', 'f.demoTour': 'Parcours guidé', 'f.source': 'Code source', 'f.try': 'Ouvrir la démo',
    'f.download': 'Télécharger', 'f.shots': 'Voir les captures', 'f.soon': 'Bientôt disponible', 'f.edition': 'Édition', 'f.tierDemo': 'Démo limitée · activation complète payante',
    'cc.title': 'Centre de contrôle', 'cc.appearance': 'Apparence', 'cc.light': 'Clair', 'cc.dark': 'Sombre', 'cc.auto': 'Auto', 'cc.sound': 'Son', 'cc.lang': 'Langue', 'cc.wallpaper': 'Fond d’écran',
    's.title': 'Réglages système', 's.wall': 'Fond d’écran', 's.look': 'Apparence', 's.sound': 'Son', 's.lang': 'Langue', 's.wallFor': 'Pour le bureau {s}', 's.wallTes': 'The Elder Scrolls', 's.wallGen': 'Général', 's.soundOn': 'Sons d’interface', 's.volume': 'Volume', 's.chime': 'Son de démarrage', 's.play': 'Écouter',
    'sp.ph': 'Rechercher une appli ou une commande', 'sp.app': 'Application', 'sp.cmd': 'Commande', 'sp.none': 'Aucun résultat.', 'sp.dark': 'Passer en mode sombre', 'sp.light': 'Passer en mode clair',
    'sp.wall': 'Changer le fond d’écran', 'sp.rand': 'Fond d’écran au hasard', 'sp.goto': 'Aller à {s}', 'sp.sound': 'Activer ou couper le son',
    'a.ver': 'Version {v}', 'a.desc': 'Essayez mes applications Mac dans un faux Mac, directement dans votre navigateur, avant de les télécharger.', 'a.license': 'Licence MIT. © 2026 Starbudweiser.',
    'a.asis': 'Fourni en l’état, sans garantie.', 'a.note': 'Les démos tournent dans votre navigateur et n’envoient aucune donnée.',
    'n.welcome': 'Bienvenue', 'n.body': 'Ouvrez une appli du Dock. ⌘K pour chercher, ⌥← ⌥→ pour changer de bureau.',
    't.step': 'Étape {i} sur {n}', 't.tour': 'Présentation', 't.prev': 'Précédent', 't.next': 'Suivant', 't.play': 'Lecture', 't.pause': 'Pause', 't.noshots': 'Pas encore de capture pour cette appli.',
    'sk.logs': 'JOURNAUX', 'sk.analyze': 'ANALYSER', 'sk.empty': 'Choisissez un journal puis lancez l’analyse. Aucun fichier n’est modifié.', 'sk.hint': 'Journaux d’exemple', 'sk.raw': 'Journal brut', 'sk.lines': 'lignes',
    'sk.s1': 'Lecture du journal…', 'sk.s2': 'Résolution des symboles…', 'sk.s3': 'Recherche du coupable…', 'sk.cause': 'Cause probable', 'sk.frames': 'Appels en cause', 'sk.crash': 'Crash', 'sk.suspect': 'Suspect', 'sk.sound': 'Sain',
    'sk.high': 'Grave', 'sk.medium': 'Moyen',
    'sk.aiBtn': 'EXPLIQUER AVEC L’IA', 'sk.aiTitle': 'ASSISTANT IA', 'sk.ai1': 'Le crash vient du chargement simultané de deux textures de terrain, en 4K et en 8K. La mémoire vidéo atteint 7 982 Mo sur 8 192 : la carte n’a plus de place pour la zone suivante. Retirez le pack 8K, puis relancez le jeu : la zone devrait se charger sans planter.', 'sk.ai2': 'ENB et Community Shaders appliquent tous deux leur rendu par d3d11.dll. Quand les deux sont actifs, ils s’écrasent l’un l’autre et le jeu plante dans ENBSeries.dll. Gardez-en un seul et supprimez les fichiers de l’autre à la racine du jeu.', 'sk.ai3': 'Un script Papyrus d’invocation ne s’arrête jamais : la pile d’appels dépasse 14 000 niveaux, tout près de la limite de 15 000. Le coupable est SummonController.pex. Désactivez ce mod d’invocation et chargez une sauvegarde antérieure.',
    'sk.v1.t': 'Conflit de textures', 'sk.v1.d': 'Deux textures de terrain en 4K et 8K saturent la mémoire vidéo au chargement de la zone.', 'sk.v1.a': 'Retirez l’un des deux mods de textures ou passez à une version 2K, puis relancez le jeu.',
    'sk.v2.t': 'Conflit entre ENB et Community Shaders', 'sk.v2.d': 'Les deux injectent leur rendu dans d3d11.dll en même temps, ce qui provoque le plantage.', 'sk.v2.a': 'Gardez un seul des deux, puis supprimez l’autre de la racine du jeu.',
    'sk.v3.t': 'Script en boucle', 'sk.v3.d': 'Un script Papyrus invoque des créatures sans fin : la pile d’appels dépasse 14 000 niveaux.', 'sk.v3.a': 'Désactivez le mod d’invocation concerné et chargez une sauvegarde antérieure.',
    'tr.translate': 'TRADUIRE', 'tr.project': 'PROJETS', 'tr.glossary': 'GLOSSAIRE', 'tr.status': 'Statut', 'tr.wait': 'En attente', 'tr.done': 'Traduit', 'tr.edit': 'Modifié', 'tr.ok': 'Validé', 'tr.validate': 'VALIDER TOUT',
    'u.mb': 'Mo', 'e.selN': '{n} sélectionné(s)', 'e.sel': '{n} sélectionné(s) · {s}', 'e.eligible': 'Éligible', 'e.notEligible': 'Non éligible', 'e.flagged': '{n} plugin(s) marqué(s) ESL', 'e.freed': '{s} libérés', 'e.again': 'RECOMMENCER', 'e.next': 'SUIVANT', 'e.preview': 'APERÇU', 'e.result': 'Résultat de l’installation', 'e.filesN': '{n} fichier(s) installé(s)', 'e.menuHint': 'L’appli est dans la barre des menus. Cliquez sur son icône.',
    'kk.press': 'Appuyez sur une touche', 'kk.history': 'DERNIÈRES TOUCHES', 'kk.di': 'DIRECTINPUT', 'kk.imgui': 'IMGUI', 'kk.note': 'Les codes s’écrivent tels quels dans les .ini de Skyrim et les menus de mods.',
    'mc.intro': 'L’anneau est dans la barre des menus. Cliquez dessus.', 'mc.app': 'Applications', 'mc.wired': 'Système', 'mc.comp': 'Compressée', 'mc.cache': 'Cache', 'mc.freem': 'Libre', 'mc.gb': 'Go',
    'mc.used': '{u} Go utilisés sur {n}', 'mc.pressure': 'Pression mémoire élevée', 'mc.good': 'Pression mémoire normale', 'mc.free': 'LIBÉRER', 'mc.quit': 'Quitter', 'mc.freed': '{g} Go libérés',
    'ms.intro': 'Déplacez les notes, écrivez dessus, changez leur couleur.', 'ms.already': 'Vos notes sont déjà sur le bureau.', 'ms.new': 'Nouvelle note', 'ms.reset': 'Remettre les notes d’exemple',
    'ms.note': 'Note', 'ms.del': 'Supprimer la note', 'ms.n1': 'Appeler Léa avant 18 h', 'ms.n2': 'Idée : mettre les démos sur le site', 'ms.n3': 'Sauvegarde du Mac vendredi'
  },
  en: {
    'l.eyebrow': '{n} Mac apps', 'l.h1a': 'Try them here.', 'l.h1b': 'Install them after.',
    'l.lead': 'A full Mac in your browser, with two desktops. Open an app, use it, then download it if you like it.',
    'l.cta': 'Turn on the Mac', 'l.skyrimlink': 'Coming from skyrimtools.com? Skyrim desktop ›', 'l.nav1': 'Skyrim Mac Toolkit', 'l.nav2': 'Utilities',
    'l.tip': 'Sound on: turn your volume up for the startup.', 'l.rotate': 'For the best experience, use a computer or rotate your device.',
    'l.foot': 'Made by Starbudweiser and Claude Code (Anthropic). MIT license.', 'b.skip': 'Click or press any key to skip',
    'm.aboutApp': 'About wSHOWCASE', 'm.about': 'About {app}', 'm.aboutFinder': 'About wSHOWCASE', 'm.settings': 'System Settings…', 'm.wallpaper': 'Wallpaper…',
    'm.restart': 'Restart…', 'm.shutdown': 'Shut Down…', 'm.download': 'Download {app}…', 'm.quit': 'Quit {app}', 'm.file': 'File', 'm.newFinder': 'New Finder Window',
    'm.close': 'Close Window', 'm.view': 'View', 'm.go': 'Go', 'm.search': 'Search…', 'm.window': 'Window', 'm.minimize': 'Minimize', 'm.zoom': 'Zoom', 'm.help': 'Help',
    'm.helpSite': 'skyrimtools.com website', 'm.helpGh': 'GitHub profile', 'm.changeWall': 'Change Wallpaper…', 'm.cleanup': 'Clean Up', 'm.resetDesk': 'Reset Icon Positions',
    'f.icons': 'Icons', 'f.list': 'List', 'f.gallery': 'Gallery', 'f.search': 'Search', 'f.spaces': 'Desktops', 'f.tags': 'Tags', 'f.tag.menubar': 'Menu bar',
    'f.tag.demo': 'Interactive demo', 'f.tag.dl': 'Downloadable', 'f.empty': 'No app matches.', 'f.name': 'Name', 'f.kind': 'Kind', 'f.demo': 'Demo', 'f.version': 'Version',
    'f.kindApp': 'Application', 'f.kindMenu': 'Menu bar', 'f.demoLive': 'Interactive demo', 'f.demoTour': 'Guided tour', 'f.source': 'Source code', 'f.try': 'Open the demo',
    'f.download': 'Download', 'f.shots': 'See screenshots', 'f.soon': 'Coming soon', 'f.edition': 'Edition', 'f.tierDemo': 'Limited demo · full activation is paid',
    'cc.title': 'Control Center', 'cc.appearance': 'Appearance', 'cc.light': 'Light', 'cc.dark': 'Dark', 'cc.auto': 'Auto', 'cc.sound': 'Sound', 'cc.lang': 'Language', 'cc.wallpaper': 'Wallpaper',
    's.title': 'System Settings', 's.wall': 'Wallpaper', 's.look': 'Appearance', 's.sound': 'Sound', 's.lang': 'Language', 's.wallFor': 'For the {s} desktop', 's.wallTes': 'The Elder Scrolls', 's.wallGen': 'General', 's.soundOn': 'Interface sounds', 's.volume': 'Volume', 's.chime': 'Startup sound', 's.play': 'Play',
    'sp.ph': 'Search an app or a command', 'sp.app': 'Application', 'sp.cmd': 'Command', 'sp.none': 'No results.', 'sp.dark': 'Switch to dark mode', 'sp.light': 'Switch to light mode',
    'sp.wall': 'Change the wallpaper', 'sp.rand': 'Random wallpaper', 'sp.goto': 'Go to {s}', 'sp.sound': 'Turn sound on or off',
    'a.ver': 'Version {v}', 'a.desc': 'Try my Mac apps in a fake Mac, right in your browser, before downloading them.', 'a.license': 'MIT license. © 2026 Starbudweiser.',
    'a.asis': 'Provided as is, without warranty.', 'a.note': 'Demos run in your browser and send no data.',
    'n.welcome': 'Welcome', 'n.body': 'Open an app from the Dock. ⌘K to search, ⌥← ⌥→ to switch desktops.',
    't.step': 'Step {i} of {n}', 't.tour': 'Overview', 't.prev': 'Previous', 't.next': 'Next', 't.play': 'Play', 't.pause': 'Pause', 't.noshots': 'No screenshot for this app yet.',
    'sk.logs': 'LOGS', 'sk.analyze': 'ANALYZE', 'sk.empty': 'Pick a log, then run the analysis. No file is modified.', 'sk.hint': 'Sample logs', 'sk.raw': 'Raw log', 'sk.lines': 'lines',
    'sk.s1': 'Reading the log…', 'sk.s2': 'Resolving symbols…', 'sk.s3': 'Finding the culprit…', 'sk.cause': 'Probable cause', 'sk.frames': 'Calls involved', 'sk.crash': 'Crash', 'sk.suspect': 'Suspect', 'sk.sound': 'Clean',
    'sk.high': 'Severe', 'sk.medium': 'Medium',
    'sk.aiBtn': 'EXPLAIN WITH AI', 'sk.aiTitle': 'AI ASSISTANT', 'sk.ai1': 'The crash comes from two terrain textures, 4K and 8K, loading at the same time. Video memory reaches 7,982 MB of 8,192: the card has no room left for the next area. Remove the 8K pack, then restart the game: the area should load without crashing.', 'sk.ai2': 'ENB and Community Shaders both apply their rendering through d3d11.dll. When both are active they overwrite each other and the game crashes in ENBSeries.dll. Keep only one and delete the other’s files from the game root.', 'sk.ai3': 'A Papyrus summoning script never stops: the call stack goes past 14,000 levels, right at the 15,000 limit. The culprit is SummonController.pex. Disable that summoning mod and load an earlier save.',
    'sk.v1.t': 'Texture conflict', 'sk.v1.d': 'Two 4K and 8K terrain textures fill the video memory when the area loads.', 'sk.v1.a': 'Remove one of the two texture mods or switch to a 2K version, then restart the game.',
    'sk.v2.t': 'ENB and Community Shaders clash', 'sk.v2.d': 'Both inject their rendering into d3d11.dll at the same time, which crashes the game.', 'sk.v2.a': 'Keep only one of them and remove the other from the game root.',
    'sk.v3.t': 'Runaway script', 'sk.v3.d': 'A Papyrus script summons creatures endlessly: the call stack exceeds 14,000 levels.', 'sk.v3.a': 'Disable the summoning mod involved and load an earlier save.',
    'tr.translate': 'TRANSLATE', 'tr.project': 'PROJECTS', 'tr.glossary': 'GLOSSARY', 'tr.status': 'Status', 'tr.wait': 'Pending', 'tr.done': 'Translated', 'tr.edit': 'Edited', 'tr.ok': 'Approved', 'tr.validate': 'APPROVE ALL',
    'u.mb': 'MB', 'e.selN': '{n} selected', 'e.sel': '{n} selected · {s}', 'e.eligible': 'Eligible', 'e.notEligible': 'Not eligible', 'e.flagged': '{n} plugin(s) flagged ESL', 'e.freed': '{s} freed', 'e.again': 'START OVER', 'e.next': 'NEXT', 'e.preview': 'PREVIEW', 'e.result': 'Installation result', 'e.filesN': '{n} file(s) installed', 'e.menuHint': 'The app is in the menu bar. Click its icon.',
    'kk.press': 'Press a key', 'kk.history': 'LATEST KEYS', 'kk.di': 'DIRECTINPUT', 'kk.imgui': 'IMGUI', 'kk.note': 'The codes go as they are into Skyrim .ini files and mod menus.',
    'mc.intro': 'The ring is in the menu bar. Click it.', 'mc.app': 'Apps', 'mc.wired': 'System', 'mc.comp': 'Compressed', 'mc.cache': 'Cache', 'mc.freem': 'Free', 'mc.gb': 'GB',
    'mc.used': '{u} GB used of {n}', 'mc.pressure': 'High memory pressure', 'mc.good': 'Normal memory pressure', 'mc.free': 'FREE UP', 'mc.quit': 'Quit', 'mc.freed': '{g} GB freed',
    'ms.intro': 'Drag the notes, type on them, change their color.', 'ms.already': 'Your notes are already on the desktop.', 'ms.new': 'New note', 'ms.reset': 'Restore sample notes',
    'ms.note': 'Note', 'ms.del': 'Delete note', 'ms.n1': 'Call Lea before 6 pm', 'ms.n2': 'Idea: put the demos on the site', 'ms.n3': 'Mac backup on Friday'
  }
};
export const lang = () => L;
export function t(k, v) {
  let s = (D[L] && D[L][k]) ?? D.en[k] ?? D.fr[k] ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.replaceAll(`{${a}}`, b);
  return s;
}
export const tag = a => a.tag[L] || a.tag.en || a.tag.fr;
export const sname = s => s.name[L] || s.name.en || s.name.fr;
export function initLang() {
  const saved = store.get('lang', null);
  L = LANGS.includes(saved) ? saved : ((navigator.languages || [navigator.language || 'en'])[0] || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  document.documentElement.lang = L;
}
export function setLang(l) {
  if (!LANGS.includes(l) || l === L) return;
  L = l; store.set('lang', l); document.documentElement.lang = l; emit('lang', l);
}
export function applyStatic() {
  document.querySelectorAll('[data-i]').forEach(e => { if (/^\d+$/.test(e.dataset.i)) return; e.textContent = t(e.dataset.i, e.dataset.n ? { n: e.dataset.n } : null); });
  document.querySelectorAll('[data-ia]').forEach(e => e.setAttribute('aria-label', t(e.dataset.ia)));
  document.title = L === 'fr' ? 'wSHOWCASE : testez mes applications Mac avant de les télécharger' : 'wSHOWCASE: try my Mac apps before you download them';
}
