/* iCONIQ : réplique interactive de la bibliothèque d'icônes (inspirée d'IconJar) : barre latérale, grille, inspecteur, import,
   portails d'icônes (détection et mode capture sur un site fictif) et lien direct avec MiCONE. Données d'exemple : aucun fichier lu, aucun réseau. */
import { h, brand, T, css, icon, sfx, wm, download, clamp, reduced, wait, num } from './kit.js';
import { t, lang } from '../i18n.js';

const BRAND = '#8b5cf6';
const svg = d => d;
/* ---------- icônes d'exemple (24 × 24, traits) ---------- */
const BASE = {
  nav: [['home', 'maison accueil house', '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'], ['search', 'loupe recherche find', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'], ['menu', 'hamburger liste', '<path d="M4 6h16M4 12h16M4 18h16"/>'],
    ['arrow-left', 'flèche gauche retour', '<path d="M19 12H5m6-6-6 6 6 6"/>'], ['arrow-right', 'flèche droite suivant', '<path d="M5 12h14m-6-6 6 6-6 6"/>'], ['arrow-up', 'flèche haut', '<path d="M12 19V5m-6 6 6-6 6 6"/>'], ['arrow-down', 'flèche bas', '<path d="M12 5v14m-6-6 6 6 6-6"/>'],
    ['chevron-right', 'chevron', '<path d="m9 6 6 6-6 6"/>'], ['external-link', 'lien externe', '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'], ['map-pin', 'lieu carte position', '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'],
    ['compass', 'boussole', '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'], ['globe', 'monde web', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>']],
  media: [['play', 'lecture lire', '<path d="M7 4.5v15l12-7.5z"/>'], ['pause', 'pause', '<path d="M8 5v14M16 5v14"/>'], ['music', 'musique note', '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'], ['video', 'vidéo caméra', '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3z"/>'],
    ['image', 'photo image', '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5L6 20"/>'], ['camera', 'appareil photo', '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'],
    ['mic', 'micro audio', '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'], ['volume', 'son haut-parleur', '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'], ['headphones', 'casque écouteurs', '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'],
    ['film', 'cinéma pellicule', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'], ['disc', 'disque cd', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>'], ['monitor', 'écran ordinateur', '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>']],
  comm: [['mail', 'courrier message', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'], ['message', 'bulle discussion chat', '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>'], ['phone', 'téléphone appel', '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'],
    ['bell', 'cloche notification', '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'], ['share', 'partager', '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>'], ['send', 'envoyer avion papier', '<path d="m21 3-9.5 18-2.5-7.5L1.5 11z"/><path d="m21 3-12 10.5"/>'],
    ['at-sign', 'arobase email', '<circle cx="12" cy="12" r="3.5"/><path d="M15.5 8.5v5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8"/>'], ['users', 'groupe équipe', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14a6.5 6.5 0 0 1 3.5 6"/>'], ['user', 'profil personne', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
    ['link', 'lien chaîne', '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'], ['paperclip', 'pièce jointe trombone', '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.2 17.2a1.7 1.7 0 0 1-2.4-2.4L14.5 7"/>'], ['bookmark', 'marque-page signet', '<path d="M6 3h12v18l-6-4.5L6 21z"/>']],
  tools: [['settings', 'réglages engrenage', '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'],
    ['sliders', 'curseurs ajustements', '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'], ['lock', 'cadenas sécurité', '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'], ['key', 'clé', '<circle cx="8" cy="15" r="4.5"/><path d="m11.5 11.5 8-8M16 7l3 3M14 9l2 2"/>'],
    ['shield', 'bouclier protection', '<path d="M12 3 4.5 6v6c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/>'], ['trash', 'corbeille supprimer', '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'], ['edit', 'crayon modifier', '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'], ['copy', 'copier dupliquer', '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'],
    ['download', 'télécharger', '<path d="M12 4v11m-5-5 5 5 5-5M4 20h16"/>'], ['upload', 'envoyer téléverser', '<path d="M12 16V5m-5 5 5-5 5 5M4 20h16"/>'], ['grid', 'grille vignettes', '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'], ['list', 'liste', '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>'],
    ['tag', 'étiquette', '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'], ['heart', 'cœur favori amour', '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'], ['star', 'étoile favori', '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'],
    ['clock', 'horloge heure temps', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'], ['calendar', 'calendrier date', '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'], ['sun', 'soleil jour', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/>'], ['moon', 'lune nuit', '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'],
    ['cloud', 'nuage', '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z"/>'], ['zap', 'éclair énergie', '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'], ['code', 'code développeur', '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>'], ['chart', 'graphique statistiques', '<path d="M4 20V4M4 20h16"/><path d="m8 15 3.5-4 3 2.5L20 7"/>']]
};
const WEB = [['cart', 'panier achat', '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3.5H5l2.6 11.5h11.2l2-8H6.2"/>'], ['gift', 'cadeau', '<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12M12 9C9.5 9 7.5 8 8 6.2S11.6 5 12 9c.4-4 3-4.5 4-2.8S14.5 9 12 9z"/>'], ['coffee', 'café tasse', '<path d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'],
  ['wallet', 'portefeuille argent', '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>'], ['truck', 'camion livraison', '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'], ['package', 'colis boîte', '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>'],
  ['book', 'livre lecture', '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/>'], ['bulb', 'ampoule idée', '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'], ['flame', 'flamme feu', '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 0 1.5.7 2.5 1.5 2.5C10 8.5 10.5 5.5 12 3z"/>'],
  ['droplet', 'goutte eau', '<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>'], ['mountain', 'montagne', '<path d="m2 20 7-12 4 6 2.5-4L22 20z"/>'], ['anchor', 'ancre bateau', '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 13H3a9 9 0 0 0 18 0h-2M8 11h8"/>'], ['crown', 'couronne roi', '<path d="m3 7 4.5 4L12 5l4.5 6L21 7l-2 12H5z"/>'],
  ['trophy', 'trophée coupe', '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M10 18h4"/>'], ['target', 'cible objectif', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'], ['rocket', 'fusée lancement', '<path d="M12 3c3.5 2 5 6 4 11l-4 3-4-3c-1-5 .5-9 4-11z"/><circle cx="12" cy="10" r="1.6"/><path d="M8 14l-3 3 2 .5M16 14l3 3-2 .5M10 20l2 2 2-2"/>'],
  ['umbrella', 'parapluie pluie', '<path d="M3 12a9 9 0 0 1 18 0zM12 12v6a2 2 0 0 0 4 0"/>']];
const JAR = [['scissors', 'ciseaux couper', '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="m8 7.5 12 10M8 16.5 20 6.5"/>'], ['ruler', 'règle mesure', '<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v4M10 8v3M14 8v4M18 8v3"/>'], ['hammer', 'marteau', '<path d="m14 7 3 3-8 8-3-3zM12 5l3-2 6 6-2 3"/>'], ['plug', 'prise branchement', '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>'],
  ['palette', 'peinture couleurs', '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2.2-.5-1.3.4-2.3 1.7-2.3H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>'], ['printer', 'imprimante', '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>'], ['save', 'disquette enregistrer', '<path d="M4 4h13l3 3v13H4z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'], ['database', 'base de données', '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'],
  ['eye', 'œil voir', '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'], ['help', 'aide question', '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h0"/>']];
const FOLDER_PICTOS = [['plus', 'ajouter', '<path d="M12 5v14M5 12h14"/>'], ['minus', 'retirer', '<path d="M5 12h14"/>'], ['x', 'fermer croix', '<path d="m6 6 12 12M18 6 6 18"/>'], ['check', 'valider coche', '<path d="m5 12.5 4.5 4.5L19 7.5"/>'], ['check-circle', 'validé', '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>'], ['alert', 'attention avertissement', '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h0"/>'], ['info', 'information', '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h0"/>'], ['maximize', 'agrandir', '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>']];
const FOLDER_PATH = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="COLOR" stroke="none"/>';
const FOLDERS = [['dossier-bleu', '#56acf0'], ['dossier-vert', '#34c759'], ['dossier-orange', '#ff9f0a'], ['dossier-rouge', '#ff453a'], ['dossier-violet', '#9b6dff'], ['dossier-graphite', '#8c8c94']];
const APPS_ONLY_MICONE = ['mSTAGRAM', 'qLOOKS', 'qNOTES'];
const APP_NAMES = ['ARCHiVES', 'MiCONE', 'csSETTINGS', 'eSLIFY', 'fCLEANER', 'fOLDERFUSE', 'fOMODSIM', 'hERALD', 'hdCLEANER', 'iCONIQ', 'kEYKODES', 'kYNEDIT', 'mABBAJACK', 'mBACKUP', 'mBAE', 'mCLEAN', 'mDESK', 'mLINKS', 'mO2FLATTENER', 'mORTEX', 'mSILENCE', 'mSIZER', 'mSPACES', 'mSTICK', 'mTRANSLATOR', 'nEXUSWATCH', 'pLUGINSLENS', 'sKYCRASH', 'wCLAUDE'];
const stripHtml = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const DAY = 86400000;

/* ---------- jeu de données ---------- */
function seed() {
  const now = Date.now(); let n = 0;
  const lib = { icons: [], colls: [], groups: [], portals: [] };
  const mkSvg = (name, tags, inner, coll, extra = {}) => ({ id: 'i' + ++n, name, tags: lang() === 'fr' ? stripHtml(tags).split(' ').slice(0, 2).join(', ') : name.split('-').slice(0, 2).join(', '), kw: stripHtml(tags), fmt: 'svg', w: 24, h: 24, coll, starred: false, added: now - (n * 1.7 + 3) * DAY, used: 0, size: 380 + inner.length * 2 + (n % 7) * 31, svg: inner, ...extra });
  lib.groups.push({ id: 'g-ui', name: T('Interface', 'Interface'), parent: null }, { id: 'g-app', name: T('Applications', 'Applications'), parent: null });
  lib.colls.push({ id: 'micone', name: 'MiCONE', group: null, kind: 'micone' }, { id: 'c-nav', name: 'Navigation', group: 'g-ui', kind: 'user' }, { id: 'c-media', name: T('Médias', 'Media'), group: 'g-ui', kind: 'user' }, { id: 'c-comm', name: 'Communication', group: 'g-ui', kind: 'user' }, { id: 'c-tools', name: T('Outils', 'Tools'), group: 'g-ui', kind: 'user' },
    { id: 'c-apps', name: T('Icônes d’applis', 'App icons'), group: 'g-app', kind: 'user' }, { id: 'c-fold', name: T('Dossiers', 'Folders'), group: 'g-app', kind: 'user' }, { id: 'c-web', name: 'Glyphhub', group: null, kind: 'portal' });
  [['nav', 'c-nav'], ['media', 'c-media'], ['comm', 'c-comm'], ['tools', 'c-tools']].forEach(([k, c]) => BASE[k].forEach(([nm, tg, inner]) => lib.icons.push(mkSvg(nm, tg, inner, c))));
  FOLDERS.forEach(([nm, col]) => lib.icons.push(mkSvg(nm, 'dossier folder', FOLDER_PATH.replace('COLOR', col), 'c-fold', { colored: true })));
  APP_NAMES.forEach((nm, i) => lib.icons.push({ id: 'i' + ++n, name: nm, tags: '', fmt: 'png', w: 256, h: 256, coll: 'c-apps', starred: false, added: now - (n * 1.2 + 6) * DAY, used: 0, size: 9000 + (nm.length * 777) % 7000 + i * 90, png: icon(nm), colored: true }));
  APPS_ONLY_MICONE.forEach((nm, i) => lib.icons.push({ id: 'i' + ++n, name: nm.toLowerCase(), tags: 'micone', fmt: 'png', w: 256, h: 256, coll: 'micone', starred: false, added: now - (i + 1) * 0.4 * DAY, used: 0, size: 14000 + i * 1300, png: icon(nm), colored: true, link: `app:/Users/stephan/Pictures/${nm.toLowerCase()}.png` }));
  ['heart', 'star', 'home', 'camera', 'music', 'mail', 'rocket'].forEach(nm => { const i = lib.icons.find(x => x.name === nm); if (i) i.starred = true; });
  ['camera', 'heart', 'settings', 'search', 'play'].forEach((nm, k) => { const i = lib.icons.find(x => x.name === nm); if (i) i.used = now - (k + 1) * 3600000 * 5; });
  lib.portals.push({ id: 'p1', name: 'Glyphhub', url: 'https://glyphhub.example', search: 'https://glyphhub.example/search?q={q}' });
  lib.nextId = () => 'i' + ++n; lib.stamp = () => now;
  return lib;
}

const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });
const ico = (d, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const G = { all: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>', star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', app: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="17" cy="7" r="2" fill="currentColor"/>', folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', coll: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="m21 15-5-5-8 8"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>', plus: '<path d="M12 5v14M5 12h14"/>', chL: '<path d="m15 6-6 6 6 6"/>', chR: '<path d="m9 6 6 6-6 6"/>', reload: '<path d="M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7"/>', x: '<path d="m6 6 12 12M18 6 6 18"/>', home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>', scope: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>', insp: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', exp: '<path d="M12 16V5m-5 5 5-5 5 5M4 20h16"/>', code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>', fold: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', sort: '<path d="M7 4v16m-3-3 3 3 3-3M17 20V4m-3 3 3-3 3 3"/>', bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9M12 3v9M12 12h9M12 12v9" opacity=".5"/>', sq: '<rect x="4" y="4" width="16" height="16" rx="2"/>', imp: '<path d="M12 4v11m-5-5 5 5 5-5M4 20h16"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' };
const BRAND_MARK = `<svg viewBox="0 0 640 640" width="22" height="22" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="26"><rect x="45" y="45" width="250" height="250" rx="56"/><rect x="345" y="45" width="250" height="250" rx="56"/><rect x="45" y="345" width="250" height="250" rx="56"/></g><rect x="345" y="345" width="250" height="250" rx="56" fill="currentColor"/></svg>`;

export async function open(app) {
  await sheetReady('css/demos/iCONIQ.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, x: 250, y: 84, minw: 880, minh: 520, bare: true, cls: 'socle iconiq', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

function build(app, w) {
  const alive = () => !w.dead && w.el.isConnected;
  const lib = seed();
  const st = { item: { k: 'all' }, search: '', sel: new Set(), anchor: null, tile: 112, bg: 'checker', sort: 'name', insp: true, open: new Set(['g-ui']), cap: false, imported: new Set() };
  const root = h('div', { class: 'iconiq-root', tabindex: '-1' });
  const side = h('aside', { class: 'iconiq-side' }), mainEl = h('section', { class: 'iconiq-main' });
  let layer = null, menuEl = null, menuOff = null, drag = null, toastEl = null, toastT = 0, portalCtl = null;
  const fmtDate = ms => new Intl.DateTimeFormat(lang() === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(ms);
  const scaleOf = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
  const local = (cx, cy) => { const r = root.getBoundingClientRect(), s = scaleOf(); return [(cx - r.left) / s, (cy - r.top) / s]; };
  const collName = id => (lib.colls.find(c => c.id === id) || {}).name || '';
  const byId = id => lib.icons.find(i => i.id === id);

  /* ---------- petits utilitaires d'interface ---------- */
  function say(msg) {
    clearTimeout(toastT); toastEl && toastEl.remove(); toastEl = h('div', { class: 'iconiq-toast', role: 'status' }, msg); root.append(toastEl);
    toastEl.animate([{ opacity: 0, transform: 'translate(-50%,8px)' }, { opacity: 1, transform: 'translate(-50%,0)' }], { duration: reduced() ? 1 : 180, easing: 'ease-out' });
    toastT = setTimeout(() => { if (toastEl) { const el = toastEl; toastEl = null; el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => el.remove(); } }, 2600);
  }
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } document.querySelectorAll('.iconiq-submenu').forEach(e => e.remove()); if (menuOff) { document.removeEventListener('pointerdown', menuOff, true); menuOff = null; } }
  /* menu : items = [{ l, fn, sub, on, off, danger }] | '-' ; ancré sous un élément ou au point (x, y) de la fenêtre */
  function menu(items, at) {
    closeMenu();
    const mk = (list, cls) => h('div', { class: 'iconiq-menu ' + cls, role: 'menu' }, list.map(it => it === '-' ? h('hr', {}) : h('button', { class: 'iconiq-mi' + (it.danger ? ' dg' : ''), role: 'menuitem', disabled: it.off, 'aria-haspopup': it.sub ? 'true' : null },
      h('i', {}, it.on ? '✓' : ''), h('span', {}, it.l), it.sub ? h('em', {}, '›') : null)));
    const el = mk(items, ''); root.append(el); menuEl = el;
    const btns = [...el.querySelectorAll('.iconiq-mi')], flat = items.filter(i => i !== '-');
    let x, y;
    if (at.getBoundingClientRect) { const r = at.getBoundingClientRect(), [lx, ly] = local(r.left, r.bottom); x = at.dataset.right ? lx + r.width / scaleOf() - el.offsetWidth : lx; y = ly + 4; } else [x, y] = at;
    el.style.left = clamp(x, 8, root.offsetWidth - el.offsetWidth - 8) + 'px'; el.style.top = clamp(y, 8, root.offsetHeight - el.offsetHeight - 8) + 'px';
    let subEl = null;
    btns.forEach((b, i) => { const it = flat[i];
      const openSub = () => { subEl && subEl.remove(); subEl = null; if (!it.sub) return; subEl = mk(it.sub, 'iconiq-submenu'); root.append(subEl); const br = b.getBoundingClientRect(), [sx, sy] = local(br.right, br.top);
        subEl.style.left = clamp(sx + 2, 8, root.offsetWidth - subEl.offsetWidth - 8) + 'px'; subEl.style.top = clamp(sy - 4, 8, root.offsetHeight - subEl.offsetHeight - 8) + 'px';
        [...subEl.querySelectorAll('.iconiq-mi')].forEach((sb, j) => { const si = it.sub.filter(q => q !== '-')[j]; sb.onclick = () => { closeMenu(); sfx.tick(); si.fn && si.fn(); }; }); };
      b.onmouseenter = openSub; b.onclick = () => { if (it.sub) return openSub(); closeMenu(); sfx.tick(); it.fn && it.fn(); }; });
    menuOff = e => { if (!alive()) return closeMenu(); if (!e.target.closest || !e.target.closest('.iconiq-menu')) closeMenu(); };
    setTimeout(() => menuEl === el && document.addEventListener('pointerdown', menuOff, true), 0);
  }
  /* boîte de dialogue : feuille centrée sur la fenêtre, filet 1 px, voile */
  function dialog(title, body, foot, o = {}) {
    closeDialog(); const card = h('div', { class: 'iconiq-dlg', style: { width: (o.w || 440) + 'px' }, role: 'dialog', 'aria-label': title }, title ? h('h3', {}, title) : null, body, foot ? h('div', { class: 'iconiq-foot' }, foot) : null);
    layer = h('div', { class: 'iconiq-scrim', onpointerdown: e => { if (e.target === layer && !o.modal) closeDialog(); } }, card); root.append(layer);
    card.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 1 : 180, easing: 'ease-out' });
    const f = card.querySelector('input,textarea'); if (f) requestAnimationFrame(() => { f.focus({ preventScroll: true }); f.select && f.select(); }); return card;
  }
  function closeDialog() { if (layer) { layer.remove(); layer = null; } }
  const btn = (label, fn, cls = '', dis) => h('button', { class: 'iconiq-btn ' + cls, onclick: fn, disabled: dis }, label);
  const ib = (path, label, fn, on, dis) => h('button', { class: 'iconiq-ib' + (on ? ' on' : ''), 'aria-label': label, title: label, onclick: fn, disabled: dis, html: ico(path) });

  /* ---------- données dérivées ---------- */
  const groupColls = gid => { const out = []; const walk = g => { lib.colls.filter(c => c.group === g && c.kind !== 'micone').forEach(c => out.push(c.id)); lib.groups.filter(x => x.parent === g).forEach(x => walk(x.id)); }; walk(gid); return out; };
  function visible() {
    const it = st.item; let list = lib.icons;
    if (it.k === 'starred') list = list.filter(i => i.starred); else if (it.k === 'recent') list = list.filter(i => i.used).sort((a, b) => b.used - a.used);
    else if (it.k === 'coll') list = list.filter(i => i.coll === it.id); else if (it.k === 'group') { const cs = groupColls(it.id); list = list.filter(i => cs.includes(i.coll)); }
    const q = stripHtml(st.search.trim());
    if (q) list = list.filter(i => stripHtml(i.name + ' ' + i.tags + ' ' + (i.kw || '')).includes(q));
    if (it.k === 'recent' && !q) return list;
    const s = st.sort; return [...list].sort((a, b) => s === 'added' ? b.added - a.added : s === 'size' ? b.size - a.size : a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
  }
  const title = () => { const it = st.item; return it.k === 'all' ? T('Toutes les icônes', 'All icons') : it.k === 'starred' ? T('Favoris', 'Favorites') : it.k === 'recent' ? T('Utilisées récemment', 'Recently used') : it.k === 'coll' ? collName(it.id) : it.k === 'group' ? lib.groups.find(g => g.id === it.id).name : (lib.portals.find(p => p.id === it.id) || {}).name; };
  const selected = () => [...st.sel].map(byId).filter(Boolean);

  /* ---------- barre latérale ---------- */
  function row(item, glyph, label, count, level = 0, chev) {
    const on = st.item.k === item.k && st.item.id === item.id;
    const el = h('button', { class: 'iconiq-row' + (on ? ' on' : ''), style: { '--lv': level }, 'data-coll': item.k === 'coll' ? item.id : null, onclick: () => { if (item.k === 'group') { st.open.has(item.id) ? st.open.delete(item.id) : st.open.add(item.id); } st.item = item; st.sel.clear(); sfx.tick(); drawSide(); drawMain(); },
      oncontextmenu: e => { e.preventDefault(); rowMenu(item, e); } }, chev == null ? h('i', { class: 'iconiq-chv' }) : h('i', { class: 'iconiq-chv', html: ico(chev ? '<path d="m6 9 6 6 6-6"/>' : '<path d="m9 6 6 6-6 6"/>', 10) }), h('i', { class: 'iconiq-gl', html: ico(glyph, 16) }), h('span', { class: 'iconiq-rt' }, label), count != null ? h('small', {}, count) : null);
    return el;
  }
  const header = (label, add) => h('div', { class: 'iconiq-hd' }, h('span', {}, label.toUpperCase()), add);
  function tree(parent, level) {
    const out = [];
    lib.groups.filter(g => g.parent === parent).forEach(g => { const open = st.open.has(g.id); out.push(row({ k: 'group', id: g.id }, open ? G.fold : G.fold, g.name, null, level, open)); if (open) out.push(...tree(g.id, level + 1)); });
    lib.colls.filter(c => c.group === parent && c.kind !== 'micone' && c.kind !== 'portal').forEach(c => out.push(row({ k: 'coll', id: c.id }, G.coll, c.name, lib.icons.filter(i => i.coll === c.id).length, level, null)));
    return out;
  }
  function drawSide() {
    const keep = list && list.scrollTop; side.innerHTML = '';
    const lights = h('div', { class: 'iconiq-top', 'data-drag': '' }, wm.lights(w), h('span', { class: 'iconiq-mark', html: BRAND_MARK }), h('b', { html: brand('iCONIQ', BRAND) }));
    list = h('div', { class: 'iconiq-list' });
    const mc = lib.colls.find(c => c.kind === 'micone');
    list.append(row({ k: 'all' }, G.all, T('Toutes les icônes', 'All icons'), lib.icons.length), row({ k: 'starred' }, G.star, T('Favoris', 'Favorites')), row({ k: 'recent' }, G.clock, T('Utilisées récemment', 'Recently used')),
      row({ k: 'coll', id: mc.id }, G.app, mc.name, lib.icons.filter(i => i.coll === mc.id).length));
    list.append(header(T('Bibliothèque', 'Library'), ib(G.plus, T('Nouvelle collection', 'New collection'), e => menu([{ l: T('Nouvelle collection', 'New collection'), fn: () => nameDialog('collection', null) }, { l: T('Nouveau groupe', 'New group'), fn: () => nameDialog('group', null) }], e.currentTarget))), ...tree(null, 0));
    list.append(header(T('Portails', 'Portals'), ib(G.plus, T('Ajouter un portail', 'Add a portal'), () => portalSheet())));
    lib.portals.forEach(p => list.append(row({ k: 'portal', id: p.id }, G.globe, p.name)));
    if (!lib.portals.length) list.append(h('p', { class: 'iconiq-hint' }, T('Aucun portail. Ajoutez l’adresse d’un site d’icônes avec +.', 'No portal. Add the address of an icon site with +.')));
    side.append(lights, list, h('div', { class: 'iconiq-dl' }, btn(t('f.download'), () => download(app), '', !app.download))); if (keep) list.scrollTop = keep;
  }
  let list = null;
  function rowMenu(item, e) {
    const [x, y] = local(e.clientX, e.clientY);
    if (item.k === 'coll') { const c = lib.colls.find(q => q.id === item.id); if (c.kind === 'micone') return;
      menu([{ l: T('Renommer…', 'Rename…'), fn: () => nameDialog('rename-c', c) }, { l: T('Déplacer vers', 'Move to'), sub: [{ l: T('Racine', 'Top level'), fn: () => { c.group = null; drawSide(); } }, ...lib.groups.map(g => ({ l: g.name, fn: () => { c.group = g.id; st.open.add(g.id); drawSide(); } }))] }, '-', { l: T('Supprimer', 'Delete'), danger: true, fn: () => removeColl(c) }], [x, y]); }
    else if (item.k === 'group') { const g = lib.groups.find(q => q.id === item.id);
      menu([{ l: T('Nouvelle collection', 'New collection'), fn: () => nameDialog('collection', g.id) }, { l: T('Nouveau groupe', 'New group'), fn: () => nameDialog('group', g.id) }, { l: T('Renommer…', 'Rename…'), fn: () => nameDialog('rename-g', g) }, '-', { l: T('Supprimer', 'Delete'), danger: true, fn: () => removeGroup(g) }], [x, y]); }
    else if (item.k === 'portal') { const p = lib.portals.find(q => q.id === item.id); menu([{ l: T('Modifier le portail…', 'Edit portal…'), fn: () => portalSheet(p) }, '-', { l: T('Supprimer', 'Delete'), danger: true, fn: () => { lib.portals = lib.portals.filter(q => q !== p); if (st.item.id === p.id) st.item = { k: 'all' }; drawSide(); drawMain(); } }], [x, y]); }
  }
  function nameDialog(kind, ref) {
    const isRename = kind.startsWith('rename'), field = h('input', { class: 'iconiq-field', value: kind === 'rename-i' ? ref.name : kind === 'rename-c' || kind === 'rename-g' ? ref.name : '', placeholder: T('Nom', 'Name'), 'aria-label': T('Nom', 'Name') });
    const ttl = kind === 'rename-i' ? T('Nouveau nom de l’icône', 'New name for the icon') : isRename ? T('Renommer…', 'Rename…') : kind === 'group' ? T('Nouveau groupe', 'New group') : T('Nouvelle collection', 'New collection');
    const ok = () => { const v = field.value.trim(); if (!v) return; sfx.pop();
      if (kind === 'rename-i') ref.name = v; else if (kind === 'rename-c' || kind === 'rename-g') ref.name = v;
      else if (kind === 'group') { const g = { id: 'g' + Date.now(), name: v, parent: ref }; lib.groups.push(g); if (ref) st.open.add(ref); st.item = { k: 'group', id: g.id }; st.open.add(g.id); }
      else { const c = { id: 'c' + Date.now(), name: v, group: ref, kind: 'user' }; lib.colls.push(c); if (ref) st.open.add(ref); st.item = { k: 'coll', id: c.id }; st.sel.clear(); }
      closeDialog(); drawSide(); drawMain(); };
    field.onkeydown = e => { if (e.key === 'Enter') ok(); };
    dialog(ttl, field, [btn(T('ANNULER', 'CANCEL'), closeDialog, 'ter'), btn(isRename ? T('RENOMMER', 'RENAME') : T('CRÉER', 'CREATE'), ok, 'pri')], { w: 380 });
  }
  function removeColl(c) { const n = lib.icons.filter(i => i.coll === c.id).length;
    confirmDialog(T(`Supprimer la collection « ${c.name} » ?`, `Delete the “${c.name}” collection?`), n ? T(`Ses ${n} icône(s) sont retirées de la bibliothèque d’iCONIQ. Cette action est définitive.`, `Its ${n} icon(s) are removed from the iCONIQ library. This cannot be undone.`) : T('Cette collection est vide.', 'This collection is empty.'), () => { lib.icons = lib.icons.filter(i => i.coll !== c.id); lib.colls = lib.colls.filter(q => q !== c); if (st.item.id === c.id) st.item = { k: 'all' }; st.sel.clear(); drawSide(); drawMain(); }); }
  function removeGroup(g) { const cs = groupColls(g.id); const kill = lib.icons.filter(i => cs.includes(i.coll)).length;
    confirmDialog(T(`Supprimer le groupe « ${g.name} » ?`, `Delete the “${g.name}” group?`), T(`Ses collections et ${kill} icône(s) sont retirées de la bibliothèque d’iCONIQ. Cette action est définitive.`, `Its collections and ${kill} icon(s) are removed from the iCONIQ library. This cannot be undone.`), () => {
      const ids = new Set(); const walk = x => { ids.add(x); lib.groups.filter(q => q.parent === x).forEach(q => walk(q.id)); }; walk(g.id);
      lib.icons = lib.icons.filter(i => !cs.includes(i.coll)); lib.colls = lib.colls.filter(c => !ids.has(c.group)); lib.groups = lib.groups.filter(q => !ids.has(q.id)); st.item = { k: 'all' }; st.sel.clear(); drawSide(); drawMain(); }); }
  function confirmDialog(msg, info, go, label) {
    dialog(null, h('div', { class: 'iconiq-alert' }, h('b', {}, msg), h('p', {}, info)), [btn(T('ANNULER', 'CANCEL'), closeDialog, 'ter'), btn(label || T('Supprimer', 'Delete'), () => { closeDialog(); go(); }, 'dng')], { w: 400 });
  }
  function deleteIcons(list) { if (!list.length) return;
    confirmDialog(T(`Supprimer ${list.length} icône(s) ?`, `Delete ${list.length} icon(s)?`), T('Les fichiers sont retirés de la bibliothèque d’iCONIQ. Cette action est définitive.', 'The files are removed from the iCONIQ library. This cannot be undone.'), () => {
      const ids = new Set(list.map(i => i.id)); lib.icons = lib.icons.filter(i => !ids.has(i.id)); st.sel.clear(); sfx.close(); say(T(`${list.length} icône(s) supprimée(s)`, `${list.length} icon(s) deleted`)); drawSide(); drawMain(); }); }

  /* ---------- actions sur les icônes ---------- */
  const copyIcon = i => { i.used = Date.now(); sfx.pop(); say(T(`« ${i.name} » copiée`, `“${i.name}” copied`)); if (st.item.k === 'recent') drawGrid(); else drawSide(); };
  const star = list => { const all = list.every(i => i.starred); list.forEach(i => { i.starred = !all; }); sfx.tick(); if (st.item.k === 'starred') { st.sel.clear(); drawMain(); } else { drawSide(); drawGrid(); drawInsp(); } };
  const exportPng = (list, px) => { sfx.done(); say(T(`${list.length} fichier(s) exporté(s)`, `${list.length} file(s) exported`)); };
  const moveTo = (list, cid) => { if (!list.length) return; list.forEach(i => { i.coll = cid; }); sfx.pop(); say(T(`${list.length} icône(s) déplacée(s) vers « ${collName(cid)} »`, `${list.length} icon(s) moved to “${collName(cid)}”`)); st.sel.clear(); drawSide(); drawMain(); };
  function iconMenu(i, e) {
    const tg = st.sel.has(i.id) ? selected() : [i], [x, y] = local(e.clientX, e.clientY);
    menu([{ l: T('Copier', 'Copy'), fn: () => copyIcon(i) }, i.fmt === 'svg' ? { l: T('Copier le code SVG', 'Copy SVG code'), fn: () => { sfx.pop(); say(T('Code SVG copié', 'SVG code copied')); } } : null,
      { l: tg.every(q => q.starred) ? T('Retirer des favoris', 'Remove from favorites') : T('Ajouter aux favoris', 'Add to favorites'), fn: () => star(tg) }, '-',
      { l: T('Exporter en PNG', 'Export as PNG'), sub: [64, 128, 256, 512, 1024].map(s => ({ l: s + ' px', fn: () => exportPng(tg, s) })) }, { l: T('Exporter les fichiers d’origine…', 'Export original files…'), fn: () => exportPng(tg) },
      { l: T('Afficher dans le Finder', 'Show in Finder'), fn: () => say('~/Library/Application Support/iCONIQ/Files/' + collName(i.coll) + '/' + i.name + '.' + i.fmt) }, tg.length === 1 ? { l: T('Renommer…', 'Rename…'), fn: () => nameDialog('rename-i', i) } : null,
      { l: T('Déplacer vers', 'Move to'), sub: lib.colls.filter(c => c.kind !== 'micone').map(c => ({ l: c.name, fn: () => moveTo(tg, c.id) })) }, '-', { l: T('Supprimer', 'Delete'), danger: true, fn: () => deleteIcons(tg) }].filter(Boolean), [x, y]);
  }

  /* ---------- zone principale : bibliothèque ---------- */
  const search = h('input', { class: 'iconiq-search', type: 'search', placeholder: T('Rechercher une icône ou une étiquette', 'Search an icon or a tag'), 'aria-label': T('Rechercher une icône ou une étiquette', 'Search an icon or a tag'), oninput: e => { st.search = e.target.value; st.sel.clear(); drawGrid(); drawInsp(); drawStatus(); } });
  let gridWrap, gridEl, inspEl, statusEl, titleEl, count = null;
  const cellEls = new Map();
  const svgFor = i => i.png ? h('img', { src: i.png, alt: '', draggable: false, loading: 'lazy' }) : h('span', { class: 'iconiq-svg' + (i.colored ? ' col' : ''), html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${i.svg}</svg>` });
  function cell(i) {
    const c = h('div', { class: 'iconiq-cell' + (st.sel.has(i.id) ? ' sel' : ''), 'data-id': i.id, role: 'option', 'aria-selected': st.sel.has(i.id), tabindex: -1 },
      h('div', { class: 'iconiq-pv' }, svgFor(i), i.starred ? h('i', { class: 'iconiq-st', html: ico(G.star, 10).replace('fill="none"', 'fill="currentColor"') }) : null), h('span', { class: 'iconiq-nm' }, i.name));
    c.addEventListener('pointerdown', e => cellDown(e, i, c)); c.addEventListener('contextmenu', e => { e.preventDefault(); if (!st.sel.has(i.id)) { st.sel = new Set([i.id]); st.anchor = i.id; syncSel(); } iconMenu(i, e); });
    cellEls.set(i.id, c); return c;
  }
  function syncSel() { cellEls.forEach((c, id) => { const on = st.sel.has(id); c.classList.toggle('sel', on); c.setAttribute('aria-selected', on); }); drawInsp(); drawStatus(); }
  function drawGrid() {
    if (!gridEl) return; cellEls.clear(); gridEl.innerHTML = ''; const list = visible(); gridWrap.classList.toggle('empty', !list.length);
    if (!list.length) { const none = !st.search && st.item.k === 'all' && !lib.icons.length;
      gridEl.append(h('div', { class: 'iconiq-empty' }, h('span', { class: 'iconiq-bigmark', html: BRAND_MARK.replace('width="22" height="22"', 'width="90" height="90"') }),
        none ? [h('b', {}, T('Votre bibliothèque est vide', 'Your library is empty')), h('p', {}, T('Importez votre bibliothèque IconJar, un dossier d’icônes, ou parcourez un portail pour y piocher des icônes. Elles arrivent aussi toutes seules depuis MiCONE.', 'Import your IconJar library or an icon folder, or browse a portal to pick icons from it. They also arrive on their own from MiCONE.')), importButton()]
          : h('b', { class: 'mut' }, st.search ? T('Aucune icône ne correspond à la recherche.', 'No icon matches the search.') : T('Cette collection est vide.', 'This collection is empty.')),
        !none && !st.search && st.item.k === 'coll' ? h('p', {}, T('Glissez-y des icônes depuis une autre collection, ou importez-en.', 'Drag icons into it from another collection, or import some.')) : null)); return; }
    const frag = document.createDocumentFragment(); list.forEach(i => frag.append(cell(i))); gridEl.append(frag);
  }
  function drawStatus() {
    if (!statusEl) return; const n = visible().length;
    statusEl.firstChild.textContent = T(`${n} icônes`, `${n} icons`) + (st.sel.size ? ' · ' + T(`${st.sel.size} sélectionnée(s)`, `${st.sel.size} selected`) : '');
  }
  function importButton() {
    const b = h('button', { class: 'sbtn act iconiq-imp', 'aria-haspopup': 'menu', onclick: e => menu([{ l: T('Bibliothèque ou jar IconJar…', 'IconJar library or jar…'), fn: () => doImport('jar') }, { l: T('Dossier d’icônes…', 'Icon folder…'), fn: () => doImport('folder') }, { l: T('Fichiers SVG / PNG…', 'SVG / PNG files…'), fn: () => doImport('files') }], e.currentTarget) }, T('IMPORTER', 'IMPORT')); b.dataset.right = '1'; return b;
  }
  function drawMain() {
    if (st.item.k === 'portal') { mainEl.innerHTML = ''; gridEl = null; portalCtl = portalView(lib.portals.find(p => p.id === st.item.id)); mainEl.append(portalCtl.el); return; }
    portalCtl = null; mainEl.innerHTML = '';
    titleEl = h('h2', {}, title()); search.value = st.search;
    const bar = h('div', { class: 'iconiq-bar', 'data-drag': '' }, titleEl, h('span', { class: 'iconiq-gap' }), h('div', { class: 'iconiq-sf' }, h('i', { html: ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 13) }), search), ib(G.insp, T('Afficher / masquer le détail', 'Show / hide details'), () => { st.insp = !st.insp; drawMain(); }, st.insp), importButton());
    gridEl = h('div', { class: 'iconiq-grid', role: 'listbox', 'aria-multiselectable': 'true', style: { '--t': st.tile + 'px' } }); gridWrap = h('div', { class: 'iconiq-gridwrap' }, gridEl);
    gridWrap.addEventListener('pointerdown', marqueeDown);
    const bgBtn = h('button', { class: 'iconiq-ib', 'aria-label': T('Fond des icônes transparentes', 'Background behind transparent icons'), title: T('Fond des icônes transparentes', 'Background behind transparent icons'), html: ico(G.bg), onclick: e => menu([['checker', T('Transparent', 'Transparent')], ['light', T('Fond clair', 'Light background')], ['dark', T('Fond sombre', 'Dark background')]].map(([k, l]) => ({ l, on: st.bg === k, fn: () => { st.bg = k; applyBg(); } })), e.currentTarget) });
    const sortBtn = h('button', { class: 'iconiq-ib', 'aria-label': T('Trier par', 'Sort by'), title: T('Trier par', 'Sort by'), html: ico(G.sort), onclick: e => menu([['name', T('Nom', 'Name')], ['added', T('Date d’ajout', 'Date added')], ['size', T('Taille', 'Size')]].map(([k, l]) => ({ l, on: st.sort === k, fn: () => { st.sort = k; drawGrid(); } })), e.currentTarget) });
    const slider = h('input', { type: 'range', min: 72, max: 200, value: st.tile, 'aria-label': T('Taille des vignettes', 'Thumbnail size'), title: T('Taille des vignettes', 'Thumbnail size'), oninput: e => { st.tile = +e.target.value; gridEl.style.setProperty('--t', st.tile + 'px'); } });
    statusEl = h('div', { class: 'iconiq-status' }, h('span', { class: 'iconiq-count' }), h('span', { class: 'iconiq-gap' }), bgBtn, sortBtn, h('i', { class: 'iconiq-szl', html: ico('<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>', 10) }), slider, h('i', { class: 'iconiq-szl', html: ico('<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>', 14) }));
    inspEl = h('aside', { class: 'iconiq-insp' + (st.insp ? '' : ' hid') });
    mainEl.append(bar, h('div', { class: 'iconiq-lib' }, h('div', { class: 'iconiq-center' }, gridWrap, statusEl), inspEl)); applyBg(); drawGrid(); drawInsp(); drawStatus();
  }
  const applyBg = () => { if (gridEl) { gridEl.dataset.bg = st.bg; inspEl && (inspEl.dataset.bg = st.bg); } };

  /* ---------- sélection : clic, ⌘ / ⇧, cadre de sélection, glisser vers une collection ---------- */
  function cellDown(e, i, c) {
    if (e.button !== 0) return; e.stopPropagation(); closeMenu();
    const sx = e.clientX, sy = e.clientY, mod = e.metaKey || e.ctrlKey, shift = e.shiftKey; let moved = false, ghost = null, hot = null;
    const was = st.sel.has(i.id);
    if (!mod && !shift && !was) { st.sel = new Set([i.id]); st.anchor = i.id; syncSel(); }
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      if (!moved) { moved = true; if (!st.sel.has(i.id)) { st.sel = new Set([i.id]); syncSel(); } const n = st.sel.size; ghost = h('div', { class: 'iconiq-ghost' }, svgFor(i), n > 1 ? h('b', {}, n) : null); root.append(ghost); drag = true; w.el.classList.add('iconiq-dragging'); }
      const [lx, ly] = local(ev.clientX, ev.clientY); ghost.style.transform = `translate(${lx - 24}px,${ly - 24}px)`;
      const under = document.elementFromPoint(ev.clientX, ev.clientY), r = under && under.closest && under.closest('.iconiq-row[data-coll]');
      if (hot !== r) { hot && hot.classList.remove('drop'); hot = r; hot && hot.dataset.coll !== 'micone' && hot.classList.add('drop'); if (hot && hot.dataset.coll === 'micone') hot = null; }
    };
    const up = ev => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (moved) { ghost.remove(); drag = null; w.el.classList.remove('iconiq-dragging'); if (hot) { const cid = hot.dataset.coll; hot.classList.remove('drop'); if (cid !== st.item.id || st.item.k !== 'coll') moveTo(selected(), cid); } return; }
      if (mod) { st.sel.has(i.id) ? st.sel.delete(i.id) : st.sel.add(i.id); st.anchor = i.id; }
      else if (shift && st.anchor) { const ids = visible().map(q => q.id), a = ids.indexOf(st.anchor), b = ids.indexOf(i.id); if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; st.sel = new Set(ids.slice(lo, hi + 1)); } }
      else if (was) { st.sel = new Set([i.id]); st.anchor = i.id; if (ev.detail >= 2) copyIcon(i); }
      syncSel();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  function marqueeDown(e) {
    if (e.button !== 0 || e.target.closest('.iconiq-cell')) return; closeMenu();
    const mod = e.metaKey || e.ctrlKey || e.shiftKey, base = mod ? new Set(st.sel) : new Set(), sc = scaleOf(), rect = gridWrap.getBoundingClientRect(); let box = null;
    const sx = (e.clientX - rect.left) / sc + gridWrap.scrollLeft, sy = (e.clientY - rect.top) / sc + gridWrap.scrollTop; let moved = false;
    const move = ev => {
      const cx = (ev.clientX - rect.left) / sc + gridWrap.scrollLeft, cy = (ev.clientY - rect.top) / sc + gridWrap.scrollTop;
      if (!moved && Math.hypot(cx - sx, cy - sy) < 4) return; moved = true;
      if (!box) { box = h('div', { class: 'iconiq-marq' }); gridWrap.append(box); }
      const x0 = Math.min(sx, cx), y0 = Math.min(sy, cy), x1 = Math.max(sx, cx), y1 = Math.max(sy, cy);
      Object.assign(box.style, { left: x0 + 'px', top: y0 + 'px', width: x1 - x0 + 'px', height: y1 - y0 + 'px' });
      const next = new Set(base);
      cellEls.forEach((c, id) => { const r = c.getBoundingClientRect(), lx = (r.left - rect.left) / sc + gridWrap.scrollLeft, ly = (r.top - rect.top) / sc + gridWrap.scrollTop; if (lx < x1 && lx + r.width / sc > x0 && ly < y1 && ly + r.height / sc > y0) next.add(id); });
      if (next.size !== st.sel.size || [...next].some(id => !st.sel.has(id))) { st.sel = next; syncSel(); }
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); box && box.remove(); if (!moved && !mod) { st.sel.clear(); syncSel(); } };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  }

  /* ---------- inspecteur ---------- */
  function drawInsp() {
    if (!inspEl) return; inspEl.innerHTML = ''; const sel = selected();
    if (!sel.length) return inspEl.append(h('p', { class: 'iconiq-none' }, T('Sélectionnez une icône pour voir son détail.', 'Select an icon to see its details.')));
    if (sel.length > 1) {
      return inspEl.append(h('div', { class: 'iconiq-pad' }, h('h3', {}, T(`${sel.length} icônes sélectionnées`, `${sel.length} icons selected`)),
        btn(sel.every(i => i.starred) ? T('Retirer des favoris', 'Remove from favorites') : T('Ajouter aux favoris', 'Add to favorites'), () => star(sel)),
        btn(T('Exporter en PNG', 'Export as PNG') + ' ▾', e => menu([64, 128, 256, 512, 1024].map(s => ({ l: s + ' px', fn: () => exportPng(sel, s) })), e.currentTarget)), btn(T('Exporter les fichiers d’origine…', 'Export original files…'), () => exportPng(sel)),
        btn(T('Déplacer vers', 'Move to') + ' ▾', e => menu(lib.colls.filter(c => c.kind !== 'micone').map(c => ({ l: c.name, fn: () => moveTo(sel, c.id) })), e.currentTarget)), btn(T('Supprimer', 'Delete'), () => deleteIcons(sel))));
    }
    const i = sel[0], nameF = h('input', { class: 'iconiq-field', value: i.name, 'aria-label': T('Nom', 'Name') }), tagF = h('input', { class: 'iconiq-field', value: i.tags, placeholder: T('séparées par des virgules', 'comma-separated'), 'aria-label': T('Étiquettes', 'Tags') });
    const commit = () => { const v = nameF.value.trim() || i.name; i.name = v; i.tags = tagF.value; const nm = cellEls.get(i.id); if (nm) nm.querySelector('.iconiq-nm').textContent = v; chips.replaceChildren(...chipList()); };
    [nameF, tagF].forEach(f => { f.onkeydown = e => { if (e.key === 'Enter') { commit(); f.blur(); } }; f.onblur = commit; });
    const chipList = () => i.tags.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6).map(tg => h('span', { class: 'iconiq-chip' }, tg));
    const chips = h('div', { class: 'iconiq-chips' }, chipList());
    const info = (k, v, link) => h('div', { class: 'iconiq-info' }, h('span', {}, k), link ? h('a', { href: '#', onclick: e => { e.preventDefault(); say(v); } }, v) : h('b', { title: v }, v));
    inspEl.append(h('div', { class: 'iconiq-pad' }, h('div', { class: 'iconiq-big' }, svgFor(i)),
      h('label', {}, T('Nom', 'Name'), nameF), h('label', {}, T('Étiquettes', 'Tags'), tagF, chips),
      h('div', { class: 'iconiq-infos' }, info(T('Format', 'Format'), i.fmt.toUpperCase() + (i.fmt === 'png' ? ` · ${i.w}×${i.h}` : '')), info(T('Collection', 'Collection'), collName(i.coll)), info(T('Ajoutée', 'Added'), fmtDate(i.added)), i.source ? info(T('Source', 'Source'), i.source, true) : null, i.link ? info(T('Suivi', 'Linked'), i.link) : null),
      btn(T('Copier', 'Copy'), () => copyIcon(i), 'pri'),
      h('div', { class: 'iconiq-acts' }, ib(i.starred ? G.star : G.star, i.starred ? T('Retirer des favoris', 'Remove from favorites') : T('Ajouter aux favoris', 'Add to favorites'), () => star([i]), i.starred), ib(G.exp, T('Exporter en PNG', 'Export as PNG'), e => menu([64, 128, 256, 512, 1024].map(s => ({ l: s + ' px', fn: () => exportPng([i], s) })), e.currentTarget)),
        ib(G.code, T('Copier le code SVG', 'Copy SVG code'), () => { sfx.pop(); say(T('Code SVG copié', 'SVG code copied')); }, false, i.fmt !== 'svg'), ib(G.fold, T('Afficher dans le Finder', 'Show in Finder'), () => say('~/Library/Application Support/iCONIQ/Files/' + collName(i.coll) + '/' + i.name + '.' + i.fmt)), h('span', { class: 'iconiq-gap' }), ib(G.trash, T('Supprimer', 'Delete'), () => deleteIcons([i])))));
  }

  /* ---------- import (simulé) ---------- */
  const IMPORTS = { jar: { pool: JAR, group: T('Icônes pro', 'Pro icons'), title: n => T(`Import de « ${n} » (IconJar)`, `Importing “${n}” (IconJar)`), file: 'Icônes pro.ijlibrary', colls: [T('Bureau', 'Office'), T('Atelier', 'Workshop')] }, folder: { pool: FOLDER_PICTOS, group: null, title: n => T(`Import du dossier « ${n} »`, `Importing folder “${n}”`), file: 'Pictos', colls: [T('Pictos', 'Pictos')] }, files: { pool: [], group: null, title: () => '', file: '', colls: [T('Fichiers importés', 'Imported files')] } };
  async function doImport(kind, fromDrop) {
    if (st.imported.has(kind) && kind !== 'files') return say(T('Déjà importé.', 'Already imported.'));
    const cfg = IMPORTS[kind]; const pool = kind === 'files' ? [...FOLDER_PICTOS.slice(4).map(x => [x[0] + '-2', x[1], x[2]]), ...JAR.slice(0, 2).map(x => [x[0] + '-2', x[1], x[2]])] : cfg.pool;
    if (kind === 'files' && st.imported.has('files')) return say(T('Déjà importé.', 'Already imported.'));
    st.imported.add(kind);
    const bar = h('i'), detail = h('span', {}), pct = h('span', { class: 'iconiq-pct' }, '0 %');
    dialog(null, h('div', { class: 'iconiq-prog' }, h('b', {}, kind === 'files' ? T('Import de 6 fichiers', 'Importing 6 files') : cfg.title(cfg.file)), h('div', { class: 'iconiq-pbar' }, bar), h('div', { class: 'iconiq-prow' }, detail, pct)), null, { w: 440, modal: true });
    sfx.click(); const now = Date.now(), colls = cfg.colls.map((nm, k) => ({ id: 'c' + now + k, name: nm, group: null, kind: 'user' }));
    let g = null; if (cfg.group) { g = { id: 'g' + now, name: cfg.group, parent: null }; colls.forEach(c => { c.group = g.id; }); }
    const items = pool.map(([nm, tg, inner], k) => ({ id: lib.nextId(), name: nm, tags: lang() === 'fr' ? stripHtml(tg).split(' ').slice(0, 2).join(', ') : nm.split('-').slice(0, 2).join(', '), kw: stripHtml(tg), fmt: 'svg', w: 24, h: 24, coll: colls[k % colls.length].id, starred: false, added: now - k * 3600000, used: 0, size: 380 + inner.length * 2, svg: inner }));
    for (let k = 0; k < items.length; k++) { if (!alive()) return; detail.textContent = items[k].name + '.svg'; bar.style.width = ((k + 1) / items.length * 100) + '%'; pct.textContent = Math.round((k + 1) / items.length * 100) + ' %'; sfx.tick(); await wait(reduced() ? 0 : 110); }
    if (!alive()) return; closeDialog(); if (g) { lib.groups.push(g); st.open.add(g.id); } colls.forEach(c => lib.colls.push(c)); lib.icons.push(...items);
    st.item = g ? { k: 'group', id: g.id } : { k: 'coll', id: colls[0].id }; st.sel = new Set(); sfx.done();
    say(T(`${items.length} icônes importées dans ${colls.length} collections.`, `${items.length} icons imported into ${colls.length} collections.`)); drawSide(); drawMain();
  }

  /* ---------- portail d'icônes : site fictif, détection et mode capture ---------- */
  function portalSheet(p) {
    const f = { name: p ? p.name : '', url: p ? p.url : '', search: p ? p.search : '' };
    const inp = (k, ph, lbl) => h('label', {}, lbl, h('input', { class: 'iconiq-field', value: f[k], placeholder: ph, oninput: e => { f[k] = e.target.value; chk(); } }));
    const save = btn(T('ENREGISTRER', 'SAVE'), () => { if (!valid()) return; sfx.pop(); if (p) { p.name = f.name.trim(); p.url = f.url.trim(); p.search = f.search.trim(); } else { const np = { id: 'p' + Date.now(), name: f.name.trim(), url: f.url.trim(), search: f.search.trim() }; lib.portals.push(np); st.item = { k: 'portal', id: np.id }; } closeDialog(); drawSide(); drawMain(); }, 'pri');
    const valid = () => f.name.trim() && /^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(f.url.trim()); const chk = () => { save.disabled = !valid(); }; chk();
    dialog(p ? T('Modifier le portail…', 'Edit portal…') : T('Ajouter un portail', 'Add a portal'), h('div', { class: 'iconiq-form' }, inp('name', 'Glyphhub', T('Nom du portail', 'Portal name')), inp('url', 'https://glyphhub.example', T('Adresse du portail', 'Portal address')),
      inp('search', 'https://…/search?q={q}', T('Adresse de recherche (facultatif)', 'Search address (optional)')), h('p', { class: 'iconiq-hint' }, T('Mettez {q} à la place du mot cherché. Sans adresse de recherche, iCONIQ remplit le champ de recherche du site.', 'Put {q} where the search word goes. Without a search address, iCONIQ fills in the site’s own search field.'))), [btn(T('ANNULER', 'CANCEL'), closeDialog, 'ter'), save], { w: 480 });
  }
  function portalView(portal) {
    const POOL = [...WEB, ...JAR.slice(4), ...BASE.media.slice(0, 4)].map(([nm, tg, inner]) => ({ nm, tg: stripHtml(tg), inner }));
    const hist = [{ q: '' }]; let pos = 0, loading = false; const picked = new Set(); let cands = [], detecting = false, panel = false, target = '';
    const host = portal.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), site = portal.name;
    const addr = h('input', { class: 'iconiq-addr', value: '', 'aria-label': T('Adresse de la page', 'Page address'), onkeydown: e => { if (e.key === 'Enter') { const m = addr.value.match(/[?&]q=([^&]*)/); go(m ? decodeURIComponent(m[1]) : ''); } } });
    const q = h('input', { class: 'iconiq-q', type: 'search', placeholder: T(`Rechercher sur ${site}`, `Search on ${site}`), 'aria-label': T(`Rechercher sur ${site}`, `Search on ${site}`), onkeydown: e => { if (e.key === 'Enter') go(q.value.trim()); } });
    const pageEl = h('div', { class: 'iconiq-page' }), panelEl = h('aside', { class: 'iconiq-cand hid' }), hint = h('div', { class: 'iconiq-caphint hid' }, T('Mode capture : cliquez sur une icône pour l’ajouter à iCONIQ', 'Capture mode: click an icon to add it to iCONIQ'));
    const back = ib(G.chL, T('Page précédente', 'Back'), () => nav(-1)), fwd = ib(G.chR, T('Page suivante', 'Forward'), () => nav(1)), rel = ib(G.reload, T('Recharger', 'Reload'), () => reload()), cap = ib(G.scope, T('Mode capture : cliquez sur une icône de la page pour l’ajouter', 'Capture mode: click an icon on the page to add it'), () => { st.cap = !st.cap; cap.classList.toggle('on', st.cap); hint.classList.toggle('hid', !st.cap); pageEl.classList.toggle('cap', st.cap); });
    const detect = h('button', { class: 'sbtn act iconiq-imp', onclick: () => runDetect() }, T('DÉTECTER', 'DETECT'));
    const bar = h('div', { class: 'iconiq-bar iconiq-pbar2', 'data-drag': '' }, back, fwd, rel, ib(G.home, T('Page d’accueil du portail', 'Portal home page'), () => go('')), h('div', { class: 'iconiq-addrw' }, h('i', { html: ico(G.lock, 11) }), addr), h('div', { class: 'iconiq-sf q' }, h('i', { html: ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 13) }), q), cap, detect);
    const results = qq => POOL.filter(i => !qq || i.nm.includes(stripHtml(qq)) || i.tg.includes(stripHtml(qq)));
    const iconTile = i => h('button', { class: 'iconiq-wi', 'data-nm': i.nm, onclick: () => { if (st.cap) capture(i); } }, h('span', { class: 'iconiq-wsvg', html: `<svg viewBox="0 0 24 24" aria-hidden="true">${i.inner}</svg>` }), h('span', {}, i.nm));
    function render() {
      const cur = hist[pos]; addr.value = `https://${host}${cur.q ? '/search?q=' + encodeURIComponent(cur.q) : '/'}`; back.disabled = pos === 0; fwd.disabled = pos >= hist.length - 1; q.value = cur.q || '';
      const list = results(cur.q);
      pageEl.innerHTML = ''; pageEl.append(h('div', { class: 'iconiq-wh' }, h('b', {}, site), h('span', {}, T('Icônes · Packs · Tarifs', 'Icons · Packs · Pricing'))),
        h('h4', {}, cur.q ? T(`${list.length} résultat(s) pour « ${cur.q} »`, `${list.length} result(s) for “${cur.q}”`) : T('Des icônes pour tous vos projets', 'Icons for all your projects')),
        h('div', { class: 'iconiq-wsearch' }, h('input', { placeholder: T('Rechercher une icône…', 'Search an icon…'), value: cur.q || '', 'aria-label': T('Rechercher une icône', 'Search an icon'), onkeydown: e => { if (e.key === 'Enter') go(e.target.value.trim()); } }), h('button', { onclick: e => go(e.currentTarget.previousSibling.value.trim()) }, T('Chercher', 'Search'))),
        list.length ? h('div', { class: 'iconiq-wgrid' }, list.map(iconTile)) : h('p', { class: 'iconiq-wnone' }, T('Aucun résultat.', 'No results.')));
      pageEl.scrollTop = 0;
    }
    async function load(fn) { loading = true; rel.innerHTML = ico(G.x); pageEl.classList.add('loading'); await wait(reduced() ? 0 : 320); if (!alive() || portalCtl == null) return; loading = false; rel.innerHTML = ico(G.reload); pageEl.classList.remove('loading'); fn(); render(); }
    function go(qq) { hist.splice(pos + 1); hist.push({ q: qq }); pos++; sfx.tick(); load(() => 0); closePanel(); }
    function nav(d) { pos = clamp(pos + d, 0, hist.length - 1); sfx.tick(); load(() => 0); closePanel(); }
    function reload() { if (loading) { loading = false; rel.innerHTML = ico(G.reload); return; } load(() => 0); }
    function closePanel() { panel = false; panelEl.classList.add('hid'); picked.clear(); cands = []; }
    async function runDetect() {
      panel = true; detecting = true; panelEl.classList.remove('hid'); sfx.click(); drawPanel(); await wait(reduced() ? 0 : 650); if (!alive()) return; detecting = false; cands = results(hist[pos].q).map(i => ({ ...i, key: i.nm })); picked.clear(); drawPanel(); sfx.done();
    }
    const targetOpts = () => [['', T(`Collection « ${site} »`, `“${site}” collection`)], ...lib.colls.filter(c => c.kind === 'user').map(c => [c.id, c.name])];
    function drawPanel() {
      panelEl.innerHTML = '';
      panelEl.append(h('div', { class: 'iconiq-ph' }, h('b', {}, T('Icônes de la page', 'Page icons')), h('small', {}, cands.length), h('span', { class: 'iconiq-gap' }), ib(G.reload, T('Détecter à nouveau', 'Detect again'), () => runDetect()), ib(G.x, T('Fermer', 'Close'), closePanel)));
      const body = h('div', { class: 'iconiq-pbody' });
      if (detecting) body.append(h('div', { class: 'iconiq-spin' })); else if (!cands.length) body.append(h('p', { class: 'iconiq-none' }, T('Aucune icône détectée sur cette page. Faites défiler la page puis relancez la détection, ou utilisez le mode capture.', 'No icon detected on this page. Scroll the page and detect again, or use capture mode.')));
      else body.append(h('div', { class: 'iconiq-cg' }, cands.map(c => h('button', { class: 'iconiq-cc' + (picked.has(c.key) ? ' on' : ''), 'aria-pressed': picked.has(c.key), title: c.nm, onclick: () => { picked.has(c.key) ? picked.delete(c.key) : picked.add(c.key); sfx.tick(); drawPanel(); } }, h('span', { class: 'iconiq-wsvg', html: `<svg viewBox="0 0 24 24" aria-hidden="true">${c.inner}</svg>` }), h('i', { html: picked.has(c.key) ? ico('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.5 3 3 6-6.5" stroke="#fff"/>', 16) : ico('<circle cx="12" cy="12" r="9"/>', 16) })))));
      const sel = h('button', { class: 'iconiq-sel', onclick: e => menu(targetOpts().map(([v, l]) => ({ l, on: target === v, fn: () => { target = v; drawPanel(); } })), e.currentTarget) }, h('span', {}, (targetOpts().find(o => o[0] === target) || targetOpts()[0])[1]), h('i', {}, '⌄'));
      panelEl.append(body, h('div', { class: 'iconiq-pf' }, h('div', { class: 'iconiq-pt' }, h('span', {}, T('Dans', 'Into')), sel),
        h('div', { class: 'iconiq-pbtns' }, btn(picked.size === cands.length && cands.length ? T('Tout désélectionner', 'Deselect all') : T('Tout sélectionner', 'Select all'), () => { picked.size === cands.length ? picked.clear() : cands.forEach(c => picked.add(c.key)); sfx.tick(); drawPanel(); }, '', !cands.length),
          btn(picked.size ? T(`Ajouter (${picked.size})`, `Add (${picked.size})`) : T('Ajouter', 'Add'), () => addIcons(cands.filter(c => picked.has(c.key))), 'pri', !picked.size))));
    }
    function destColl() { if (target) return target; let c = lib.colls.find(x => x.kind === 'portal' && x.name === site); if (!c) { c = { id: 'cp' + Date.now(), name: site, group: null, kind: 'portal' }; lib.colls.push(c); } return c.id; }
    function addIcons(list) {
      if (!list.length) return; const dest = destColl(); let n = 0;
      list.forEach(c => { if (lib.icons.some(i => i.coll === dest && i.name === c.nm)) return; n++; lib.icons.push({ id: lib.nextId(), name: c.nm, tags: lang() === 'fr' ? c.tg.split(' ').slice(0, 2).join(', ') : c.nm.split('-').slice(0, 2).join(', '), kw: c.tg, fmt: 'svg', w: 24, h: 24, coll: dest, starred: false, added: Date.now(), used: 0, size: 380 + c.inner.length * 2, svg: c.inner, source: `https://${host}/icon/${c.nm}` }); });
      if (!n) return say(T('Déjà dans la collection.', 'Already in the collection.')); sfx.pop(); say(T(`${n} icône(s) ajoutée(s) à « ${collName(dest)} »`, `${n} icon(s) added to “${collName(dest)}”`)); picked.clear(); if (panel) drawPanel(); drawSide();
    }
    function capture(i) { const el = pageEl.querySelector(`[data-nm="${i.nm}"]`); el && el.animate([{ outlineColor: '#fbbf24', boxShadow: '0 0 0 0 rgba(251,191,36,.7)' }, { boxShadow: '0 0 0 10px rgba(251,191,36,0)' }], { duration: reduced() ? 1 : 450 }); addIcons([{ ...i, key: i.nm }]); }
    cap.classList.toggle('on', st.cap); hint.classList.toggle('hid', !st.cap); pageEl.classList.toggle('cap', st.cap);
    render(); drawPanel();
    return { el: h('div', { class: 'iconiq-portal' }, bar, h('div', { class: 'iconiq-pcols' }, h('div', { class: 'iconiq-web' }, pageEl, hint), panelEl)) };
  }

  /* ---------- lien avec MiCONE : les icônes exportées arrivent seules dans la collection « MiCONE » ---------- */
  function pullMicone() {
    const q = window.__wscIconiq; if (!q || !q.length) return;
    const got = q.splice(0); const mc = lib.colls.find(c => c.kind === 'micone');
    got.forEach(g => { const exist = lib.icons.find(i => i.link === 'app:' + g.name); const base = { name: g.name, png: g.url, fmt: 'png', w: 1024, h: 1024, colored: true, size: 52000, link: 'app:' + g.name };
      if (exist) Object.assign(exist, base, { added: exist.added }); else lib.icons.push({ id: lib.nextId(), tags: 'micone', coll: g.coll && g.coll !== '' ? (lib.colls.find(c => c.id === g.coll) ? g.coll : mc.id) : mc.id, starred: false, added: Date.now(), used: 0, ...base }); });
    sfx.notif(); say(T(`${got.length} icône(s) reçue(s) de MiCONE`, `${got.length} icon(s) received from MiCONE`)); drawSide(); if (st.item.k !== 'portal') { drawGrid(); drawStatus(); }
  }
  const poll = setInterval(() => { if (!alive()) return clearInterval(poll); pullMicone(); }, 700);

  /* ---------- glisser-déposer de fichiers (démonstration : aucun fichier lu) et clavier ---------- */
  let dropEl = null;
  root.addEventListener('dragover', e => { if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); if (!dropEl) { dropEl = h('div', { class: 'iconiq-drop' }, h('b', {}, T('Déposez pour importer', 'Drop to import')), h('span', {}, T('Bibliothèque IconJar, dossier d’icônes ou fichiers SVG / PNG', 'IconJar library, icon folder or SVG / PNG files'))); root.append(dropEl); } });
  root.addEventListener('dragleave', e => { if (e.target === root || e.relatedTarget == null) { dropEl && dropEl.remove(); dropEl = null; } });
  root.addEventListener('drop', e => { e.preventDefault(); dropEl && dropEl.remove(); dropEl = null; say(T('Démo : vos fichiers ne sont pas lus. Voici des icônes d’exemple.', 'Demo: your files are not read. Here are sample icons.')); doImport('files'); });
  const onKey = e => {
    if (!alive()) return document.removeEventListener('keydown', onKey); if (!w.el.classList.contains('active')) return;
    if (e.key === 'Escape') { if (layer) closeDialog(); else if (menuEl) closeMenu(); else if (st.sel.size) { st.sel.clear(); syncSel(); } return; }
    if (e.target.matches && e.target.matches('input,textarea') || st.item.k === 'portal' || layer) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); st.sel = new Set(visible().map(i => i.id)); syncSel(); }
    else if (mod && e.key.toLowerCase() === 'c' && st.sel.size) { e.preventDefault(); copyIcon(selected()[0]); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && st.sel.size) { e.preventDefault(); deleteIcons(selected()); }
    else if (e.key === 'f' && !mod && st.sel.size) star(selected());
  };
  document.addEventListener('keydown', onKey);

  root.append(side, h('div', { class: 'iconiq-vline' }), mainEl);
  drawSide(); drawMain();
  return root;
}
