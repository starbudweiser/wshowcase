/* hdCLEANER : nettoyeur de disque. Réplique de l'interface réelle (Aperçu, Nettoyage, Applications, Carte) avec des données d'exemple : rien n'est lu ni supprimé. */
import { dlBtn, toast, icon, h, brand, esc, wait, reduced, clamp, sfx, wm, T, css } from './kit.js';
import { lang } from '../i18n.js';

const BRAND = '#A78BFA'; /* couleur du « hd » relevée sur le logo */
const bt = s => esc(s).split('hdCLEANER').join(brand('hdCLEANER', BRAND)); /* nom de l'appli coloré dans un texte */
const loc = () => (lang() === 'fr' ? 'fr-FR' : 'en-US');
const fmtN = (n, d = 1) => n.toLocaleString(loc(), { maximumFractionDigits: d, minimumFractionDigits: 0 });
/** Taille en Mo vers texte. */
const sz = mb => {
  const fr = lang() === 'fr';
  if (mb <= 0) return '0 ' + (fr ? 'Mo' : 'MB');
  if (mb >= 1048576) return fmtN(mb / 1048576) + ' ' + (fr ? 'To' : 'TB');
  if (mb >= 1024) return fmtN(mb / 1024) + ' ' + (fr ? 'Go' : 'GB');
  if (mb >= 10) return fmtN(Math.round(mb), 0) + ' ' + (fr ? 'Mo' : 'MB');
  if (mb >= 1) return fmtN(mb) + ' ' + (fr ? 'Mo' : 'MB');
  return fmtN(Math.max(1, Math.round(mb * 1024)), 0) + ' ' + (fr ? 'Ko' : 'KB');
};
const loadCss = u => new Promise(res => { css(u); const l = document.querySelector(`link[data-k="${u}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res); l.addEventListener('error', res); setTimeout(res, 800); });

/* ---------- icônes au trait ---------- */
const I = {
  overview: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  clean: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  apps: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
  map: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  eye: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  disk: '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="6" fill="currentColor"/>'
};
const svg = (k, box = 24) => { const t = document.createElement('template'); t.innerHTML = `<svg viewBox="0 0 ${box} ${box}" aria-hidden="true">${I[k]}</svg>`; return t.content.firstChild; };

/* ---------- catégories : id, couleur, sort (d supprimé, t Corbeille, a mot de passe, s instantané), cochée d'office ---------- */
const CATS = [['appCaches', '#2DD4BF', 'd', 1], ['appLogs', '#FACC15', 'd', 1], ['browserData', '#F97316', 'd', 1], ['devCaches', '#F472B6', 'd', 0], ['trash', '#38BDF8', 'd', 0], ['downloads', '#A3A3A3', 't', 0],
  ['mailDownloads', '#818CF8', 't', 0], ['largeFiles', '#EC4899', 't', 0], ['leftovers', '#EF4444', 't', 0], ['iosBackups', '#4ADE80', 't', 0], ['iosPhotoCache', '#C084FC', 'd', 1], ['musicCache', '#FB7185', 'd', 1],
  ['iosUpdates', '#60A5FA', 'd', 0], ['installers', '#8B5CF6', 't', 0], ['screenshots', '#FB923C', 't', 0], ['systemCaches', '#22D3EE', 'a', 0], ['systemLogs', '#FDE047', 'a', 0], ['snapshots', '#94A3B8', 's', 0], ['languages', '#F59E0B', 'a', 0]];
const META = Object.fromEntries(CATS.map(([id, color, disp, pre]) => [id, { color, disp, pre }]));
const TXT = {
  appCaches: ["Caches d'applis", 'App caches', "Fichiers temporaires que les applis recréent seules. Les caches d'Apple et ceux, longs à refaire, des modèles d'IA sont laissés de côté.", "Temporary files that apps recreate on their own. Apple's caches and slow-to-rebuild AI model caches are left alone."],
  appLogs: ["Journaux d'applis", 'App logs', "Historiques techniques des applis, utiles seulement pour diagnostiquer une panne.", 'Technical app histories, only useful to diagnose a problem.'],
  browserData: ['Caches de navigateurs', 'Browser caches', "Fichiers temporaires d'Internet uniquement : l'historique, les cookies et les mots de passe ne sont pas touchés.", 'Temporary Internet files only: history, cookies and passwords are not touched.'],
  devCaches: ['Caches de développement', 'Developer caches', 'Xcode, simulateurs, Homebrew, npm, pip… Se retéléchargent ou se recompilent au besoin.', 'Xcode, simulators, Homebrew, npm, pip… Downloaded or rebuilt again when needed.'],
  trash: ['Corbeille', 'Trash', "Ce qui s'y trouve est effacé pour de bon.", 'What is in there is erased for good.'],
  downloads: ['Téléchargements', 'Downloads', "À trier vous-même : rien n'est coché d'office.", 'Yours to sort: nothing is ticked for you.'],
  mailDownloads: ['Pièces jointes de Mail', 'Mail attachments', 'Pièces jointes que Mail a enregistrées sur le disque. Elles restent dans vos messages.', 'Attachments Mail saved to disk. They stay in your messages.'],
  largeFiles: ['Gros fichiers', 'Large files', 'Fichiers de votre dossier personnel au-dessus de la taille choisie dans les réglages.', 'Files in your home folder above the size set in Settings.'],
  leftovers: ["Restes d'applis désinstallées", 'Uninstalled app leftovers', "Dossiers, conteneurs et préférences portant l'identifiant d'une appli absente de ce Mac. Vérifiez avant de cocher.", 'Folders, containers and preferences named after an app that is not on this Mac. Check before ticking.'],
  iosBackups: ['Sauvegardes iPhone et iPad', 'iPhone and iPad backups', "Copies complètes d'un appareil. À supprimer seulement si vous n'en avez plus besoin.", 'Full copies of a device. Remove them only if you no longer need them.'],
  iosPhotoCache: ['Cache photo iOS', 'iOS photo cache', 'Photos converties pour la synchronisation avec un iPhone ou un iPad.', 'Photos converted for syncing with an iPhone or iPad.'],
  musicCache: ['Cache de Musique', 'Music cache', "Fichiers temporaires de l'appli Musique. Votre bibliothèque n'est pas touchée.", 'Temporary files of the Music app. Your library is not touched.'],
  iosUpdates: ['Mises à jour iOS', 'iOS software updates', "Fichiers de mise à jour d'iPhone et d'iPad téléchargés par le Mac.", 'iPhone and iPad update files downloaded by the Mac.'],
  installers: ["Paquets d'installation", 'Installer packages', "Images disque et paquets (.dmg, .pkg, .iso…) et installeurs de macOS (« Installer macOS… »), inutiles une fois l'installation faite.", 'Disk images and packages (.dmg, .pkg, .iso…) and macOS installers ("Install macOS…"), no use once installed.'],
  screenshots: ["Captures d'écran", 'Screenshots', 'Captures trouvées sur le Bureau et dans votre dossier de captures.', 'Screenshots found on the Desktop and in your screenshots folder.'],
  systemCaches: ['Caches système', 'System caches', "Caches de /Library laissés par des applis. Demande votre mot de passe. Les caches d'Apple sont laissés de côté.", "Caches in /Library left by apps. Asks for your password. Apple's caches are left alone."],
  systemLogs: ['Journaux système', 'System logs', "Journaux et rapports d'incident du système, journaux archivés de /var/log. Le journal en cours n'est pas touché. Demande votre mot de passe.", 'System logs and crash reports, archived logs from /var/log. The log in use is not touched. Asks for your password.'],
  snapshots: ['Instantanés Time Machine', 'Time Machine snapshots', "Copies locales que Time Machine garde sur ce disque. Leur taille n'est pas affichée par macOS ; l'espace est rendu à leur suppression. Demande votre mot de passe.", 'Local copies Time Machine keeps on this disk. macOS does not show their size; the space is returned when they are deleted. Asks for your password.'],
  languages: ['Langues inutilisées', 'Unused languages', "Retire des applis installées les langues que vous n'utilisez pas. Cela modifie les applis (leur signature peut devenir invalide) : réservé à celles que vous maîtrisez. Apple et l'App Store sont exclus. Jamais coché d'office. Demande votre mot de passe.", 'Removes languages you do not use from installed apps. This modifies the apps (their signature may become invalid): only for apps you know well. Apple and App Store apps are excluded. Never ticked for you. Asks for your password.']
};
const title = c => T(TXT[c][0], TXT[c][1]);
const help = c => T(TXT[c][2], TXT[c][3]);
const tag = c => ({ d: T('Supprimé directement', 'Deleted directly'), t: T('Mis à la Corbeille', 'Moved to the Trash'), a: T('Supprimé avec votre mot de passe', 'Deleted with your password'), s: T('Supprimé avec votre mot de passe', 'Deleted with your password') }[META[c].disp]);

/* ---------- données d'exemple : [nom, Mo, drapeaux (u = appli ouverte, a = mot de passe, p = Mo purgeables)] ---------- */
const shot = (d, t) => T(`Capture d’écran ${d} à ${t}.png`, `Screenshot ${d} at ${t}.png`);
const BASE = { appCaches: '~/Library/Caches', appLogs: '~/Library/Logs', browserData: '~/Library/Caches', devCaches: '~/Library', trash: '~/.Trash', downloads: '~/Downloads', mailDownloads: '~/Library/Mail Downloads', largeFiles: '~',
  leftovers: '~/Library/Application Support', iosBackups: '~/Library/Application Support/MobileSync/Backup', iosPhotoCache: '~/Library/Caches', musicCache: '~/Library/Caches', iosUpdates: '~/Library/iTunes/iPhone Software Updates',
  installers: '~/Downloads', screenshots: '~/Desktop', systemCaches: '/Library/Caches', systemLogs: '/var/log', snapshots: 'snapshot:', languages: '/Applications' };
const DATA = () => ({
  appCaches: [['com.blackmagic-design.DaVinciResolve', 704], ['com.spotify.client', 912, 'u'], ['com.adobe.AfterEffects', 640], ['com.figma.Desktop', 318], ['com.tinyspeck.slackmacgap', 241], ['com.microsoft.VSCode', 176], ['com.hnc.Discord', 154], ['notion.id', 133], ['com.getdropbox.dropbox', 96]],
  appLogs: [['Adobe After Effects 2026', 88], ['DaVinci Resolve', 64], ['Slack', 31, 'u'], ['Zoom', 22], ['Homebrew', 12], ['CoreSimulator', 41]],
  browserData: [['Google Chrome', 1126, 'u'], ['Arc', 520], ['Safari', 420], ['Firefox', 310]],
  devCaches: [['Xcode DerivedData', 6348], ['CoreSimulator Caches', 3174], ['Homebrew', 1434], ['CocoaPods', 553], ['npm (_cacache)', 861], ['pip', 420]],
  trash: [['Ancien projet (copie).zip', 2150], ['Dossier sans titre', 340], ['IMG_4412.MOV', 880]],
  downloads: [['rushes_interview.mov', 3481], ['export_final.mp4', 1843], ['ancient_realms_hd-4412.zip', 1229], ['wallpapers_pack.zip', 620], ['présentation_v3.key', 210], ['facture_octobre.pdf', 0.4]],
  mailDownloads: [['Photos_vacances.zip', 142], ['rapport_Q3.pdf', 18], ['Contrat_prestation.pdf', 3.2], ['devis_studio.xlsx', 1.1]],
  largeFiles: [['Windows 11.pvm', 18637], ['Skyrim_Backup_2026.7z', 8601], ['rushes_2025-12.braw', 7475], ['render_trailer_v2.mov', 5222], ['Dataset_voix.tar', 2560]],
  leftovers: [['com.skype.skype', 224], ['com.parallels.desktop.console', 88], ['com.teamviewer.TeamViewer', 51], ['com.macpaw.CleanMyMac4', 36], ['Adobe Photoshop 2022', 340]],
  iosBackups: [['00008130-001A4D2E0E9B001E', 25190]],
  iosPhotoCache: [['PhotoSync.cache', 1434]],
  musicCache: [['com.apple.Music', 420]],
  iosUpdates: [['iPhone16,1_19.4_Restore.ipsw', 7372]],
  installers: [['Install macOS Tahoe.app', 14131, 'a'], ['DaVinci_Resolve_21.1_Mac.dmg', 6042], ['Xcode_26.xip', 3174], ['wCLAUDE-1.1.0.pkg', 96]],
  screenshots: [[shot('2026-11-08', '21.14.07'), 3.4], [shot('2026-11-07', '18.40.12'), 2.8], [shot('2026-11-03', '14.22.10'), 4.1], [shot('2026-10-29', '09.05.44'), 1.9], [shot('2026-10-21', '16.31.02'), 3.6], [shot('2026-10-12', '11.18.37'), 2.2]],
  systemCaches: [['Adobe', 640], ['com.adobe.acc.installer', 380], ['Microsoft', 210]],
  systemLogs: [['DiagnosticReports', 88], ['system.log.1.gz', 12], ['install.log.0.gz', 6]],
  snapshots: [['com.apple.TimeMachine.2026-11-09-170338.local', 0, 'p9216'], ['com.apple.TimeMachine.2026-11-09-100321.local', 0, 'p9216'], ['com.apple.TimeMachine.2026-11-08-230012.local', 0, 'p9216']],
  languages: [['Discord', 64], ['Notion', 71], ['Figma', 52], ['Visual Studio Code', 38]]
});
const mkItems = () => Object.entries(DATA()).flatMap(([cat, list]) => list.map(([name, mb, f = '']) => ({ id: cat + ':' + name, cat, name, mb, u: f.includes('u'), a: f.includes('a'), ps: +(f.match(/p(\d+)/) || [0, 0])[1], gone: false, ex: false })));
const fileLike = n => /\.(zip|mov|mp4|pdf|png|key|xlsx|7z|tar|dmg|pkg|xip|ipsw|braw|gz|bz2|iso|plist)$/i.test(n);
const itemPath = it => (BASE[it.cat].endsWith(':') ? BASE[it.cat] : BASE[it.cat] + '/' + it.name);
const disp = it => (it.a ? 'a' : META[it.cat].disp);

/* ---------- applications installées : [nom, couleur, initiales, ouverte, fichiers liés [nom, Mo, dossier]] ---------- */
const APPS = () => [
  ['Adobe After Effects 2026', '#7C6CF2', 'Ae', 0, [['Adobe After Effects 2026.app', 3481, '/Applications'], ['Adobe/After Effects', 1126, '~/Library/Application Support'], ['com.adobe.AfterEffects', 640, '~/Library/Caches'], ['Adobe After Effects 2026', 88, '~/Library/Logs'], ['com.adobe.AfterEffects.plist', 0.1, '~/Library/Preferences']]],
  ['Parallels Desktop', '#D6454B', 'Pd', 0, [['Parallels Desktop.app', 612, '/Applications'], ['com.parallels.desktop.console', 88, '~/Library/Containers'], ['Parallels', 154, '~/Library/Application Support'], ['com.parallels.desktop.console.plist', 0.1, '~/Library/Preferences']]],
  ['Spotify', '#3FAE6A', 'Sp', 1, [['Spotify.app', 412, '/Applications'], ['com.spotify.client', 912, '~/Library/Caches'], ['Spotify', 204, '~/Library/Application Support'], ['com.spotify.client.plist', 0.1, '~/Library/Preferences']]],
  ['Slack', '#B5527F', 'Sl', 0, [['Slack.app', 389, '/Applications'], ['com.tinyspeck.slackmacgap', 241, '~/Library/Caches'], ['Slack', 118, '~/Library/Application Support'], ['Slack', 31, '~/Library/Logs'], ['com.tinyspeck.slackmacgap.plist', 0.1, '~/Library/Preferences']]],
  ['Figma', '#C2603B', 'Fi', 0, [['Figma.app', 301, '/Applications'], ['com.figma.Desktop', 318, '~/Library/Caches'], ['Figma', 96, '~/Library/Application Support'], ['com.figma.Desktop.plist', 0.1, '~/Library/Preferences']]],
  ['Discord', '#6670D9', 'Di', 0, [['Discord.app', 268, '/Applications'], ['com.hnc.Discord', 154, '~/Library/Caches'], ['discord', 122, '~/Library/Application Support']]],
  ['Zoom', '#4A8AD8', 'Zo', 0, [['zoom.us.app', 236, '/Applications'], ['us.zoom.xos', 64, '~/Library/Application Support'], ['us.zoom.xos.plist', 0.1, '~/Library/Preferences'], ['zoom.us', 22, '~/Library/Logs']]],
  ['VLC', '#D98A2B', 'Vl', 0, [['VLC.app', 168, '/Applications'], ['org.videolan.vlc', 12, '~/Library/Preferences'], ['org.videolan.vlc', 9, '~/Library/Caches']]]
].map(([n, c, ini, run, rel]) => ({ n, c, ini, run: !!run, rel: rel.map(([rn, mb, dir]) => ({ n: rn, mb, dir })), gone: false }));

/* ---------- carte du disque : D = dossier, F = fichier (ou dossier replié) ---------- */
const D = (n, ...c) => ({ n, c });
const F = (n, s) => ({ n, s });
const finish = (node, p = null) => { node.p = p; if (node.c) { node.c.forEach(k => finish(k, node)); node.s = node.c.reduce((a, k) => a + k.s, 0); node.c.sort((a, b) => b.s - a.s); } return node; };
const TREE = () => finish(D('stephan',
  D('Library', D('Developer', F('Xcode', 16590), F('CoreSimulator', 9625), F('DerivedData', 6348)), D('Application Support', F('Adobe', 17715), F('DaVinci Resolve', 10035), F('Steam', 7066), F('Google', 2662), F('Slack', 2355)),
    D('Containers', F('com.parallels.desktop', 7577), F('com.apple.mail', 3174), F('com.apple.Photos', 2150), F('Autres', 1536)), D('Caches', F('com.blackmagic-design', 704), F('com.spotify.client', 912), F('Autres', 5300)), F('Mail', 3891)),
  D('Movies', F('Rushes 2026', 59392), D('Exports', F('Trailer_Skyrim_v3.mov', 11264), F('Teaser_mORTEX.mov', 6144), F('Interviews', 4096)), F('Archives vidéo', 17408)),
  D('Documents', D('Projets', F('Skyrim Mac Toolkit', 11264), F('Clients', 5120), F('Divers', 3072)), F('Scans', 7168), F('Backup_docs.7z', 5120)),
  D('Downloads', F('rushes_interview.mov', 3481), F('export_final.mp4', 1843), F('ancient_realms_hd-4412.zip', 1229), F('Divers', 12800)),
  D('Pictures', F('Photos Library.photoslibrary', 19456), F('Captures', 5120)), F('Music', 14336), F('Desktop', 3072)));
const PAL = ['#38bdf8', '#fbbf24', '#4ade80', '#c084fc', '#f97316', '#f87171'];

/** Disposition « treemap » (carrés), éléments triés par taille décroissante. */
function squarify(list, x, y, w, hh) {
  const total = list.reduce((a, k) => a + k.s, 0) || 1, k0 = (w * hh) / total, out = [];
  let rest = list.map(i => ({ i, a: i.s * k0 }));
  while (rest.length) {
    const short = Math.min(w, hh), worst = (r, s) => Math.max((short * short * Math.max(...r.map(q => q.a))) / (s * s), (s * s) / (short * short * Math.min(...r.map(q => q.a))));
    let k = 0, best = Infinity;
    while (k < rest.length) { const cand = rest.slice(0, k + 1), wst = worst(cand, cand.reduce((a, q) => a + q.a, 0)); if (k > 0 && wst > best) break; best = wst; k++; }
    const row = rest.splice(0, k), s = row.reduce((a, q) => a + q.a, 0);
    if (w >= hh) { const cw = s / hh; let cy = y; row.forEach(q => { const ch = q.a / cw; out.push({ i: q.i, x, y: cy, w: cw, h: ch }); cy += ch; }); x += cw; w -= cw; }
    else { const rh = s / w; let cx = x; row.forEach(q => { const cw = q.a / rh; out.push({ i: q.i, x: cx, y, w: cw, h: rh }); cx += cw; }); y += rh; hh -= rh; }
  }
  return out;
}

export async function open(app) {
  await loadCss('css/demos/hdCLEANER.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1040, h: 660, y: 96, minw: 900, minh: 560, bare: true, cls: 'socle hd',
    onclose: w => { w.dead = true; w.stop && w.stop(); },
    build: w => { const mk = () => make(app, w); w.redraw = () => { w.stop && w.stop(); w.body.replaceChildren(mk()); }; return mk(); } });
}

function make(app, w) {
  const life = { dead: false }; let ro = null, raf = 0;
  w.stop = () => { life.dead = true; ro && ro.disconnect(); cancelAnimationFrame(raf); };
  const alive = () => !life.dead && !w.dead;
  const S = { mode: 'overview', phase: 'idle', scanned: false, seen: new Set(), cur: null, fresh: null, prog: 0, cancel: false, cat: 'appCaches', sel: new Set(), report: null, dlg: null, items: mkItems(), apps: APPS(), app: null, rel: new Set(), q: '',
    used: 524288, total: 1017856, purge: 27648, dAvail: 0, tree: null, node: null, pick: null, mapped: false, mapping: false, mapN: 0 };
  S.dAvail = S.total - S.used;
  const MODES = [[null, ['overview']], [['Nettoyer', 'Clean'], ['clean', 'apps']], [['Analyser', 'Analyze'], ['map']]];
  const MNAME = { overview: ['Aperçu', 'Overview'], clean: ['Nettoyage', 'Cleaning'], apps: ['Applications', 'Applications'], map: ['Carte', 'Map'] };
  const MSUB = {
    overview: () => (S.scanned ? T('Analysé à l’instant', 'Scanned just now') : T('Pas encore analysé', 'Not scanned yet')),
    clean: () => T('Cochez ce que vous voulez libérer. Rien n’est supprimé avant votre accord.', 'Tick what you want to free up. Nothing is deleted before you agree.'),
    apps: () => T('Désinstallez une appli avec les fichiers qu’elle a laissés. Tout part à la Corbeille.', 'Uninstall an app with the files it left behind. Everything goes to the Trash.'),
    map: () => T('Ce qui occupe votre espace, dossier par dossier.', 'What takes up your space, folder by folder.')
  };
  const root = h('div', { class: 'hd-root' }), side = h('aside', { class: 'hd-side' }), main = h('main', { class: 'hd-main' }), body = h('div', { class: 'hd-body' }, side, main);
  root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('hdCLEANER', BRAND) }), dlBtn(app)), body);

  /* ----- calculs ----- */
  const present = it => !it.gone && !it.ex;
  const itemsOf = c => (S.seen.has(c) ? S.items.filter(i => i.cat === c && present(i)) : []);
  const totalOf = c => itemsOf(c).reduce((a, i) => a + i.mb, 0);
  const selected = () => S.items.filter(i => present(i) && S.sel.has(i.id) && S.seen.has(i.cat));
  const gain = its => its.reduce((a, i) => a + (i.mb || i.ps), 0);
  const safeItems = () => S.items.filter(i => present(i) && S.seen.has(i.cat) && META[i.cat].pre && !i.u);
  const idle = () => S.phase === 'idle';
  const catState = c => { const it = itemsOf(c), n = it.filter(i => S.sel.has(i.id)).length; return !n ? 'off' : n === it.length ? 'on' : 'mix'; };

  /* ----- barre latérale ----- */
  const freeEl = h('b'), freeSub = h('span'), meter = h('i');
  const drawFoot = () => { freeEl.textContent = sz(S.dAvail); meter.style.width = ((S.used / S.total) * 100) + '%'; };
  function drawSide() {
    side.replaceChildren(h('div', { class: 'hd-wm' }, svg('disk', 100)));
    MODES.forEach(([g, ms]) => {
      if (g) side.append(h('div', { class: 'hd-grp' }, T(g[0], g[1])));
      ms.forEach(m => side.append(h('button', { class: 'hd-nav' + (S.mode === m ? ' on' : ''), onclick: () => go(m) }, svg(m), h('span', {}, T(MNAME[m][0], MNAME[m][1])))));
    });
    freeSub.textContent = T('libres sur Macintosh HD', 'free on Macintosh HD');
    side.append(h('div', { class: 'hd-sp' }), h('div', { class: 'hd-foot' }, freeEl, freeSub, h('div', { class: 'hd-meter' }, meter)));
    drawFoot();
  }
  const tween = (from, to, ms, fn) => new Promise(res => {
    if (reduced() || ms <= 0) { fn(to); return res(); }
    const t0 = performance.now(); const tick = t => { if (!alive()) return res(); const k = clamp((t - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3); fn(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(tick); else res(); }; raf = requestAnimationFrame(tick);
  });

  /* ----- briques d'interface ----- */
  const head = (mode, acts) => h('div', { class: 'hd-ph' }, h('div', {}, h('h2', {}, T(MNAME[mode][0], MNAME[mode][1])), h('p', {}, !idle() && mode === 'overview' ? (S.phase === 'scanning' ? T('Analyse : ', 'Scanning: ') + (S.cur ? title(S.cur) : '') : T('Nettoyage…', 'Cleaning…')) : MSUB[mode]())), h('div', { class: 'hd-acts' }, acts),
    !idle() && mode === 'overview' ? h('div', { class: 'hd-prog hd-pbar' }, h('i', { style: { width: S.prog + '%' } })) : null);
  const cbw = (state, fn, label, off) => h('button', { class: 'hd-cbw', 'aria-label': label, disabled: !!off, onclick: e => { e.stopPropagation(); fn(); } }, h('i', { class: 'hd-cb ' + state }));
  const line = ({ color, title: tt, help: hp, size, badge, safe, onclick, extra, fresh }) => h(onclick ? 'button' : 'div', { class: 'hd-line' + (fresh ? ' in' : ''), onclick },
    h('span', { class: 'hd-ico', style: { background: `color-mix(in srgb, ${color} 18%, transparent)` } }, h('i', { style: { background: color } })),
    h('div', { class: 'hd-lt' }, h('span', {}, h('b', {}, tt), badge ? h('em', { class: 'hd-badge ' + (safe ? 'ok' : 'wn') }, badge) : null), h('small', { html: bt(hp) })), extra, h('span', { class: 'hd-sz' }, size));
  const work = label => h('div', { class: 'hd-work' }, h('span', {}, label), h('div', { class: 'hd-prog' }, h('i', { style: { width: S.prog + '%' } })));
  const foot = (left, right) => h('div', { class: 'hd-bot' }, left, right);
  const reportMsg = () => {
    const r = S.report; if (!r) return h('div', { class: 'hd-msg' });
    const parts = [r.freed > 0 ? T(`${sz(r.freed)} libérés.`, `${sz(r.freed)} freed.`) : '', r.trashed > 0 ? T(`${sz(r.trashed)} à la Corbeille.`, `${sz(r.trashed)} in the Trash.`) : ''].filter(Boolean);
    return h('div', { class: 'hd-msg ok' }, parts.join(' '));
  };
  const busyBar = () => foot(work(S.phase === 'scanning' ? T('Analyse : ', 'Scanning: ') + (S.cur ? title(S.cur) : '') : T('Nettoyage…', 'Cleaning…')), h('button', { class: 'sbtn', onclick: () => { S.cancel = true; } }, T('Annuler', 'Cancel')));

  /* ----- dialogue de confirmation ----- */
  function ask(o) { S.dlg = o; sfx.open(); drawDlg(); }
  function drawDlg() {
    root.querySelector('.hd-scrim') && root.querySelector('.hd-scrim').remove();
    const d = S.dlg; if (!d) return;
    const close = () => { S.dlg = null; drawDlg(); };
    const el = h('div', { class: 'hd-dlg', role: 'dialog', 'aria-label': d.title, tabindex: '-1', onkeydown: e => { if (e.key === 'Escape') close(); } },
      h('h3', {}, d.title), ...d.lines.map(([t, wn]) => h('p', { class: wn ? 'wn' : '' }, t)),
      h('div', { class: 'hd-acts' }, h('button', { class: 'sbtn', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn act', onclick: () => { close(); d.ok(); } }, d.button)));
    root.append(h('div', { class: 'hd-scrim', onpointerdown: e => { if (e.target.classList.contains('hd-scrim')) close(); } }, el));
    el.focus({ preventScroll: true });
  }

  /* ----- Aperçu ----- */
  function viewOverview() {
    const safe = safeItems(), g = gain(safe), busy = !idle();
    const acts = [h('button', { class: 'sbtn', disabled: busy, onclick: scan }, T('Tout analyser', 'Scan everything')),
      h('button', { class: 'sbtn act', disabled: busy || !safe.length, onclick: () => { S.sel = new Set(safe.map(i => i.id)); go('clean'); askClean(); } }, T('Nettoyer les éléments sûrs', 'Clean safe items') + ` (${sz(g)})`)];
    const rows = CATS.map(([c]) => [c, totalOf(c)]).filter(([c, t]) => t > 0 && c !== 'snapshots').sort((a, b) => b[1] - a[1]);
    const found = rows.reduce((a, r) => a + r[1], 0), other = Math.max(S.used - found, 0), free = S.total - S.used;
    const seg = rows.map(([c, t]) => [META[c].color, t]).concat([['var(--s-sub)', other], ['var(--s-ctl)', free]]);
    const trash = totalOf('trash'), snaps = itemsOf('snapshots');
    const list = h('div', { class: 'hd-list' });
    if (rows.length) list.append(h('div', { class: 'hd-panel', style: { marginBottom: '12px' } }, ...rows.map(([c, t]) => {
      const safeC = META[c].pre;
      return line({ color: META[c].color, title: title(c), help: T(`Éléments : ${itemsOf(c).length}`, `Items: ${itemsOf(c).length}`) + ' · ' + tag(c), size: sz(t), badge: safeC ? T('Sûr à nettoyer', 'Safe to clean') : T('À vérifier', 'Review first'), safe: safeC, fresh: S.fresh === c && S.phase === 'scanning', onclick: () => { S.cat = c; go('clean'); } });
    })));
    list.append(h('div', { class: 'hd-panel' },
      line({ color: 'var(--s-sub)', title: T('Autres données', 'Everything else'), help: T('macOS, documents, photos : hdCLEANER n’y touche pas', 'macOS, documents and photos: hdCLEANER leaves them alone'), size: sz(other) }),
      S.purge > 0 ? line({ color: 'var(--s-sub)', title: T('Espace purgeable', 'Purgeable space'), help: T('Instantanés Time Machine et caches que macOS peut libérer', 'Time Machine snapshots and caches macOS can free'), size: sz(S.purge),
        extra: snaps.length ? h('button', { class: 'sbtn sm', onclick: e => { e.stopPropagation(); S.sel = new Set(snaps.map(i => i.id)); S.cat = 'snapshots'; go('clean'); askClean(); } }, T('Libérer', 'Free up')) : null }) : null,
      line({ color: 'var(--s-bd)', title: T('Libre', 'Free'), help: T('Disponible pour de nouveaux fichiers', 'Available for new files'), size: sz(free) })));
    if (trash > 0) list.append(h('p', { class: 'hd-note', style: { marginTop: '12px' } }, T(`${sz(trash)} de l’espace utilisé sont déjà dans la Corbeille. La vider dans le Finder les libère.`, `${sz(trash)} of the used space is already in the Trash. Emptying it in the Finder frees it.`)));
    if (!S.scanned && !busy) list.append(h('p', { class: 'hd-note', style: { marginTop: '12px' } }, T('L’analyse ne modifie rien.', 'Scanning changes nothing.')));
    return [head('overview', acts),
      h('div', { class: 'hd-big' }, h('b', {}, sz(S.used)), h('span', {}, T(`utilisés sur ${sz(S.total)}`, `used of ${sz(S.total)}`))),
      h('div', { class: 'hd-use' }, ...seg.map(([c, t]) => h('i', { style: { flexGrow: Math.max(t, 1), flexBasis: 0, background: c } }))), list];
  }

  /* ----- Nettoyage ----- */
  function viewClean() {
    const busy = !idle(), split = S.scanned || S.seen.size > 0;
    const acts = S.scanned && idle() ? h('button', { class: 'sbtn', onclick: scan }, T('Relancer', 'Rescan')) : !split ? h('button', { class: 'sbtn act', disabled: busy, onclick: scan }, T('Analyser', 'Scan')) : null;
    const cats = h('div', { class: 'hd-panel' }, h('div', { class: 'hd-phd' }, h('b', {}, T('Catégories', 'Categories')), h('span', {}, T('Taille', 'Size'))),
      h('div', { class: 'hd-list' }, ...CATS.map(([c]) => {
        const it = itemsOf(c), seen = S.seen.has(c), t = totalOf(c);
        const row = h('div', { class: 'hd-crow' + (S.cat === c ? ' on' : '') + (!it.length ? ' zero' : ''), role: 'button', tabindex: '0', onclick: () => { S.cat = c; sfx.tick(); render(); }, onkeydown: e => { if (e.key === 'Enter') { S.cat = c; render(); } } },
          cbw(catState(c), () => { const on = catState(c) === 'off'; it.forEach(i => (on ? S.sel.add(i.id) : S.sel.delete(i.id))); sfx.tick(); render(); }, title(c), !it.length || busy),
          h('i', { class: 'hd-dot', style: { background: META[c].color } }), h('b', {}, title(c)), h('small', {}, !seen ? '…' : t > 0 ? sz(t) : it.length ? it.length : '–'));
        return row;
      })));
    const its = itemsOf(S.cat);
    const itemsP = h('div', { class: 'hd-panel' }, h('div', { class: 'hd-phd' }, h('b', {}, title(S.cat)), h('span', {}, tag(S.cat))), h('p', { class: 'hd-help' }, help(S.cat)),
      its.length ? h('div', { class: 'hd-list' }, ...its.map(it => h('div', { class: 'hd-irow', title: itemPath(it) },
        cbw(S.sel.has(it.id) ? 'on' : 'off', () => { S.sel.has(it.id) ? S.sel.delete(it.id) : S.sel.add(it.id); sfx.tick(); render(); }, it.name, busy), svg(fileLike(it.name) && it.cat !== 'snapshots' ? 'file' : 'folder'),
        h('b', {}, it.name), it.u ? h('span', { class: 'hd-use2' }, T('En cours', 'In use')) : null, h('small', {}, it.mb > 0 ? sz(it.mb) : '–'),
        S.cat === 'snapshots' ? null : h('button', { class: 'hd-tool', title: T('Afficher dans le Finder', 'Show in Finder'), onclick: () => { sfx.click(); toast({ icon: icon(app.id), title: T('Afficher dans le Finder', 'Show in Finder'), body: itemPath(it) }); } }, svg('search')),
        h('button', { class: 'hd-tool', title: T('Ne plus proposer', 'Stop suggesting this'), onclick: () => { it.ex = true; S.sel.delete(it.id); sfx.pop(); toast({ icon: icon(app.id), title: app.id, body: T(`« ${it.name} » ne sera plus proposé.`, `“${it.name}” will no longer be suggested.`) }); render(); } }, svg('eye'))))) :
        h('div', { class: 'hd-empty' }, T('Rien à nettoyer ici.', 'Nothing to clean here.')));
    const welcome = h('div', { class: 'hd-panel grow' }, h('div', { class: 'hd-empty' }, h('b', {}, T('Analysez votre disque pour voir ce qui peut être libéré.', 'Scan your disk to see what can be freed.')), h('small', {}, T('L’analyse ne modifie rien.', 'Scanning changes nothing.'))));
    const sel = selected();
    const bot = busy ? busyBar() : foot(S.report ? reportMsg() : h('div', { class: 'hd-msg' }), split ? [h('span', { class: 'hd-gain' }, T('Espace à récupérer : ', 'Space to recover: '), h('b', {}, sz(gain(sel)))),
      h('button', { class: 'sbtn act', disabled: !sel.length, onclick: askClean }, T('Nettoyer', 'Clean'))] : null);
    return [head('clean', acts), split ? h('div', { class: 'hd-split' }, cats, itemsP) : welcome, bot];
  }
  function askClean() {
    const sel = selected(); if (!sel.length) return;
    const sum = d => sel.filter(i => disp(i) === d).reduce((a, i) => a + i.mb, 0), snaps = sel.filter(i => i.cat === 'snapshots').length;
    const lines = [];
    if (sum('d') > 0) lines.push([T(`${sz(sum('d'))} seront effacés pour de bon (caches et fichiers qui se recréent seuls, Corbeille).`, `${sz(sum('d'))} will be erased for good (caches and files that recreate themselves, Trash).`)]);
    if (sum('t') > 0) lines.push([T(`${sz(sum('t'))} iront à la Corbeille : vous pourrez les récupérer, et l’espace sera rendu quand vous la viderez.`, `${sz(sum('t'))} will go to the Trash: you can get them back, and the space returns once you empty it.`)]);
    if (sum('a') > 0) lines.push([T(`${sz(sum('a'))} seront supprimés avec votre mot de passe d’administrateur.`, `${sz(sum('a'))} will be deleted with your administrator password.`)]);
    if (snaps) lines.push([T(`${snaps} instantané(s) Time Machine local(aux) seront supprimés avec votre mot de passe d’administrateur.`, `${snaps} local Time Machine snapshot(s) will be deleted with your administrator password.`)]);
    if (sel.some(i => i.cat === 'languages')) lines.push([T('Les langues retirées modifient les applis : si l’une d’elles refuse de s’ouvrir, réinstallez-la.', 'Removed languages modify the apps: if one refuses to open, reinstall it.'), 1]);
    if (sel.some(i => i.u)) lines.push([T('Certains éléments appartiennent à une appli ouverte : fermez-la d’abord pour éviter un souci.', 'Some items belong to an open app: quit it first to avoid trouble.'), 1]);
    if (sel.some(i => disp(i) === 'a' || i.cat === 'snapshots')) lines.push([T('Démo : aucun mot de passe n’est demandé ici.', 'Demo: no password is asked here.')]);
    ask({ title: T(`Nettoyer ${sel.length} élément(s) ?`, `Clean ${sel.length} item(s)?`), lines, button: T('Nettoyer', 'Clean'), ok: doClean });
  }

  /* ----- analyse et nettoyage ----- */
  async function scan() {
    if (!idle()) return;
    Object.assign(S, { phase: 'scanning', cancel: false, seen: new Set(), scanned: false, report: null, prog: 0, cur: null, fresh: null }); S.sel.clear(); sfx.click(); render();
    for (let i = 0; i < CATS.length; i++) {
      if (!alive() || S.cancel) break;
      const c = CATS[i][0]; S.cur = c; S.prog = (i / CATS.length) * 100; render();
      await wait(reduced() ? 0 : 130 + (i % 3) * 40); if (!alive()) return;
      S.seen.add(c); S.fresh = c; sfx.tick();
    }
    if (!alive()) return;
    S.phase = 'idle'; S.cur = null; S.fresh = null; S.scanned = S.seen.size > 0;
    S.items.forEach(i => { if (META[i.cat].pre && !i.u && S.seen.has(i.cat) && present(i)) S.sel.add(i.id); });
    render(); sfx.done();
  }
  async function doClean() {
    const sel = selected(); if (!sel.length || !idle()) return;
    Object.assign(S, { phase: 'cleaning', cancel: false, report: null, prog: 0 }); sfx.click(); render();
    let freed = 0, trashed = 0, n = 0; const step = reduced() ? 0 : clamp(1500 / sel.length, 50, 140);
    for (const it of sel) {
      if (!alive() || S.cancel) break; await wait(step); if (!alive()) return;
      it.gone = true; S.sel.delete(it.id); n++;
      if (disp(it) === 't') { trashed += it.mb; S.items.push({ id: 'trash:' + it.name, cat: 'trash', name: it.name, mb: it.mb, u: false, a: false, ps: 0, gone: false, ex: false }); } else freed += it.mb || it.ps;
      if (it.ps) S.purge = Math.max(0, S.purge - it.ps);
      S.prog = (n / sel.length) * 100; sfx.tick(); render();
    }
    if (!alive()) return;
    const from = S.dAvail; S.used -= freed; S.phase = 'idle'; S.report = { freed, trashed }; render(); sfx.done();
    toast({ icon: icon(app.id), title: app.id, body: [freed > 0 ? T(`${sz(freed)} libérés.`, `${sz(freed)} freed.`) : '', trashed > 0 ? T(`${sz(trashed)} à la Corbeille.`, `${sz(trashed)} in the Trash.`) : ''].filter(Boolean).join(' ') });
    await tween(from, from + freed, 900, v => { S.dAvail = v; drawFoot(); }); if (alive()) { S.dAvail = S.total - S.used; drawFoot(); }
  }

  /* ----- Applications ----- */
  function viewApps() {
    const busy = !idle(), a = S.app; let q = S.q.trim().toLowerCase();
    const list = h('div', { class: 'hd-list' });
    const drawList = () => { list.replaceChildren(...S.apps.filter(x => !x.gone && (!q || x.n.toLowerCase().includes(q))).sort((x, y) => appSize(y) - appSize(x)).map(x => h('button', { class: 'hd-arow' + (a === x ? ' on' : ''), onclick: () => { S.app = x; S.rel = new Set(x.rel.map(r => r.n + r.dir)); sfx.tick(); render(); } },
      h('i', { class: 'hd-aic', style: { background: x.c } }, x.ini), h('b', {}, x.n), h('small', {}, sz(appSize(x)))))); };
    const search = h('input', { class: 'hd-search', type: 'search', placeholder: T('Rechercher une appli', 'Search for an app'), 'aria-label': T('Rechercher une appli', 'Search for an app'), value: S.q, oninput: e => { S.q = e.target.value; q = S.q.trim().toLowerCase(); drawList(); } });
    drawList();
    const left = h('div', { class: 'hd-panel' }, search, list);
    let right;
    if (a) {
      right = h('div', { class: 'hd-panel' }, h('div', { class: 'hd-phd' }, h('b', {}, a.n), h('span', {}, T('Mis à la Corbeille', 'Moved to the Trash'))), h('p', { class: 'hd-help' }, T('L’appli et les fichiers cochés iront à la Corbeille.', 'The app and the ticked files will go to the Trash.')),
        h('div', { class: 'hd-list' }, ...a.rel.map((r, i) => { const k = r.n + r.dir; return h('div', { class: 'hd-rrow' }, cbw(S.rel.has(k) ? 'on' : 'off', () => { S.rel.has(k) ? S.rel.delete(k) : S.rel.add(k); sfx.tick(); render(); }, r.n, busy),
          svg(i === 0 ? 'apps' : fileLike(r.n) ? 'file' : 'folder'), h('div', {}, h('b', {}, r.n), i ? h('small', {}, r.dir) : null), h('span', {}, sz(r.mb))); })));
    } else right = h('div', { class: 'hd-panel' }, h('div', { class: 'hd-empty' }, h('b', {}, T('Choisissez une appli à désinstaller.', 'Choose an app to uninstall.')), h('small', {}, T('Une appli absente de la liste ? Glissez-la ici.', 'App missing from the list? Drag it here.'))));
    const rel = a ? a.rel.filter(r => S.rel.has(r.n + r.dir)) : [], g = rel.reduce((s, r) => s + r.mb, 0);
    const bot = busy ? busyBar() : foot(S.report ? reportMsg() : h('div', { class: 'hd-msg' }), a ? [a.run ? h('span', { class: 'hd-run' }, T('Fermez d’abord cette appli.', 'Quit this app first.')) : null, h('span', { class: 'hd-gain' }, T('Espace à récupérer : ', 'Space to recover: '), h('b', {}, sz(g))),
      h('button', { class: 'sbtn act', disabled: !rel.length || a.run, onclick: () => ask({ title: T(`Désinstaller ${a.n} ?`, `Uninstall ${a.n}?`), lines: [[T(`${sz(g)} iront à la Corbeille : vous pourrez les récupérer, et l’espace sera rendu quand vous la viderez.`, `${sz(g)} will go to the Trash: you can get them back, and the space returns once you empty it.`)]], button: T('Désinstaller', 'Uninstall'), ok: uninstall }) }, T('Désinstaller', 'Uninstall'))] : null);
    return [head('apps', null), h('div', { class: 'hd-split' }, left, right), bot];
  }
  const appSize = x => x.rel.reduce((s, r) => s + r.mb, 0);
  async function uninstall() {
    const a = S.app, rel = a.rel.filter(r => S.rel.has(r.n + r.dir)); if (!rel.length) return;
    Object.assign(S, { phase: 'cleaning', cancel: false, report: null, prog: 0 }); sfx.click(); render();
    for (let i = 0; i < rel.length; i++) { await wait(reduced() ? 0 : 170); if (!alive()) return; S.prog = ((i + 1) / rel.length) * 100; sfx.tick(); render(); }
    const t = rel.reduce((s, r) => s + r.mb, 0);
    rel.forEach(r => S.items.push({ id: 'trash:' + r.n + r.dir, cat: 'trash', name: r.n, mb: r.mb, u: false, a: false, ps: 0, gone: false, ex: false }));
    if (rel.length === a.rel.length) a.gone = true; else a.rel = a.rel.filter(r => !S.rel.has(r.n + r.dir));
    S.app = null; S.phase = 'idle'; S.report = { freed: 0, trashed: t }; render(); sfx.done();
    toast({ icon: icon(app.id), title: app.id, body: T(`${a.n} : ${sz(t)} à la Corbeille.`, `${a.n}: ${sz(t)} in the Trash.`) });
  }

  /* ----- Carte ----- */
  function viewMap() {
    const acts = [h('button', { class: 'sbtn act', disabled: S.mapping, onclick: mapIt }, T('Cartographier', 'Map it'))];
    let panel;
    if (S.mapping) panel = h('div', { class: 'hd-panel grow' }, h('div', { class: 'hd-empty' }, h('b', {}, T('Analyse… ', 'Scanning… ') + `${fmtN(S.mapN, 0)} ` + T('éléments', 'items')), h('small', {}, sz(S.mapMb || 0))));
    else if (!S.mapped) panel = h('div', { class: 'hd-panel grow' }, h('div', { class: 'hd-phd' }, h('b', {}, T('Carte', 'Map')), h('span', {}, '')), h('div', { class: 'hd-empty' }, h('small', {}, T('Clic : sélectionner · double-clic : ouvrir un dossier. Les dossiers et fichiers sont dessinés proportionnellement à leur taille sur le disque.', 'Click: select · double-click: open a folder. Folders and files are drawn in proportion to their size on disk.'))));
    else {
      const cur = S.node, trail = []; for (let n = cur; n; n = n.p) trail.unshift(n);
      const nav = n => { S.node = n; S.pick = null; S.anim = true; sfx.tick(); render(); };
      const crumb = h('div', { class: 'hd-crumb' }); trail.forEach((n, i) => { if (i) crumb.append(svg('chev')); crumb.append(h('button', { onclick: () => nav(n) }, n.n)); });
      const box = h('div', { class: 'hd-map' }); panel = h('div', { class: 'hd-panel grow' }, crumb, box);
      let first = true; const anim = S.anim; S.anim = false;
      const lay = () => {
        const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return; box.replaceChildren();
        squarify(cur.c.filter(k => k.s > 0), 0, 0, W, H).forEach((t, i) => {
          const el = h('div', { class: 'hd-tile' + (S.pick === t.i ? ' sel' : ''), title: `${t.i.n} · ${sz(t.i.s)}`, style: { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px', animation: anim && first ? '' : 'none', animationDelay: (i * 25) + 'ms',
            background: `color-mix(in srgb, ${PAL[i % PAL.length]} 80%, var(--s-surf))` },
          onclick: () => { S.pick = t.i; sfx.tick(); box.querySelectorAll('.hd-tile').forEach(x => x.classList.toggle('sel', x === el)); const old = main.lastElementChild; old.replaceWith(mapBot()); }, ondblclick: () => { if (t.i.c) { nav(t.i); sfx.pop(); } } },
          t.w > 56 && t.h > 30 ? [h('b', {}, t.i.n), h('small', {}, sz(t.i.s))] : null);
          box.append(el);
        });
        first = false;
      };
      ro && ro.disconnect(); ro = new ResizeObserver(lay); ro.observe(box);
    }
    const mapBot = () => {
      const p = S.pick, prot = p && p.n === 'Library' && !p.p.p;
      return foot(h('div', { class: 'hd-msg' + (prot ? ' wn' : S.mapMsg ? ' ok' : '') }, p ? `${p.n} · ${sz(p.s)}` + (prot ? ' — ' + T('Élément protégé : à supprimer depuis le Finder.', 'Protected item: delete it from the Finder.') : '') : S.mapMsg || (S.mapped ? T('Clic : sélectionner · double-clic : ouvrir un dossier.', 'Click: select · double-click: open a folder.') : '')),
        p ? [p.c ? h('button', { class: 'sbtn', onclick: () => { S.node = p; S.pick = null; S.anim = true; sfx.pop(); render(); } }, T('Ouvrir', 'Open')) : null,
          h('button', { class: 'sbtn', disabled: prot, onclick: () => ask({ title: T(`Mettre « ${p.n} » à la Corbeille ?`, `Move “${p.n}” to the Trash?`), lines: [[T(`${sz(p.s)} seront rendus quand la Corbeille sera vidée.`, `${sz(p.s)} will be recovered once the Trash is emptied.`)]], button: T('Mettre à la Corbeille', 'Move to Trash'), ok: () => trashNode(p) }) }, T('Mettre à la Corbeille', 'Move to Trash'))] : null);
    };
    const bot = mapBot();
    return [head('map', acts), panel, bot];
  }
  async function mapIt() {
    if (S.mapping) return; S.mapping = true; S.mapped = false; S.pick = null; S.mapMsg = ''; S.mapN = 0; S.mapMb = 0; sfx.click(); render();
    const total = 281000; await tween(0, 1, 1500, v => { S.mapN = Math.round(v * 412380); S.mapMb = v * total; if (alive() && S.mode === 'map') { const b = main.querySelector('.hd-empty b'), s = main.querySelector('.hd-empty small'); if (b) b.textContent = T('Analyse… ', 'Scanning… ') + fmtN(S.mapN, 0) + ' ' + T('éléments', 'items'); if (s) s.textContent = sz(S.mapMb); } });
    if (!alive()) return; S.tree = S.tree || TREE(); S.node = S.tree; S.mapped = true; S.mapping = false; S.anim = true; render(); sfx.done();
  }
  function trashNode(n) {
    const sz0 = n.s, p = n.p; p.c = p.c.filter(k => k !== n); for (let q = p; q; q = q.p) q.s -= sz0; S.pick = null; S.mapMsg = T(`« ${n.n} » est à la Corbeille (${sz(sz0)}).`, `“${n.n}” is in the Trash (${sz(sz0)}).`); S.anim = true; sfx.done(); render();
    toast({ icon: icon(app.id), title: app.id, body: S.mapMsg });
  }

  /* ----- navigation ----- */
  const VIEW = { overview: viewOverview, clean: viewClean, apps: viewApps, map: viewMap };
  let lastMode = null;
  function render() {
    if (!alive()) return;
    const sc = lastMode === S.mode ? [...main.querySelectorAll('.hd-list')].map(e => e.scrollTop) : [];
    main.replaceChildren(...VIEW[S.mode]().filter(Boolean)); lastMode = S.mode;
    main.querySelectorAll('.hd-list').forEach((e, i) => { if (sc[i]) e.scrollTop = sc[i]; });
    side.querySelectorAll('.hd-nav').forEach((b, i) => b.classList.toggle('on', ['overview', 'clean', 'apps', 'map'][i] === S.mode));
  }
  function go(m) { if (S.mode === m) return render(); S.mode = m; S.report = null; S.mapMsg = ''; if (m !== 'map') ro && ro.disconnect(); sfx.click(); render(); }
  drawSide(); render();
  return root;
}
