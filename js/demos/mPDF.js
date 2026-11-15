/* mPDF : réplique interactive du lecteur / éditeur PDF. Mode « liseuse » : la fenêtre épouse la page, la barre d'outils glisse du haut (pointeur au bord haut, ⌥⌘T),
   le panneau Pages (miniatures + sommaire) et le panneau Notes glissent sur la page. Outils, objets déplaçables / redimensionnables, annuler / rétablir,
   formulaire, recherche, affichages, présentation. Le document est un faux PDF dessiné en HTML ; tout reste en mémoire, rien n'est lu ni écrit.
   Le menu de l'appli (À propos, Fichier, Édition, Présentation, Outils, Pages, Aller…) s'ouvre par un clic droit dans la fenêtre. */
import { h, brand, T, css, toast, icon, sfx, wm, clamp, S, $ } from './kit.js';
import { macMenu, macAlert, aboutWin } from './mDESK.js';

const ID = 'mPDF', BRAND = '#f9514c', CSS = 'css/demos/mPDF.css', PW = 595, PH = 842, GREEN = '#2f6f4f', RED = '#d93025';
const sheetReady = url => new Promise(res => { css(url); const l = document.querySelector(`link[data-k="${url}"]`); if (!l || l.sheet) return res(); l.addEventListener('load', res, { once: true }); l.addEventListener('error', res, { once: true }); setTimeout(res, 1500); });
const svgi = (d, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  sideL: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9.5 4.5v15"/>', sideR: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M14.5 4.5v15"/>',
  select: '<path d="M6 3.5 19 10.2l-6.2 1.9-2.4 6.3z"/>', text: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M8.5 9.5h7M12 9.5v6"/>',
  eraser: '<path d="M4.8 14.6 13.4 6a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8l-6.6 6.6H8.2z"/><path d="M8.6 10.8l4.6 4.6M12 19.6h7.5"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.8-4.4 3.5 3 2.6-2.2 4.1 3.6"/>', check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  hl: '<path d="m9 14 6.5-6.5 3 3L12 17H9z"/><path d="M9 17l-3 3h4.5M14.3 8.7l3 3"/>', pen: '<path d="M5 19l1-4.2L16.3 4.5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L9.2 18z"/><path d="m14.5 6.3 3.2 3.2"/>',
  more: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="2.6"/>', disp: '<circle cx="12" cy="12" r="9"/><circle cx="11" cy="11" r="3.6"/><path d="m13.8 13.8 3 3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'
};
const sample = s => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
const IMGS = {
  photo: { name: 'Paysage.jpg', w: 240, h: 160, src: sample('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4e8"/><stop offset="1" stop-color="#f6d9b0"/></linearGradient></defs><rect width="240" height="160" fill="url(#s)"/><circle cx="188" cy="42" r="16" fill="#fff4cf"/><path d="M0 122 52 54 84 92 120 40 190 122z" fill="#5a7391"/><path d="M104 56l16-16 14 17-14 5-8-6z" fill="#fff" opacity=".85"/><path d="M0 160V120c40-10 80 6 120 2s80-14 120-2v40z" fill="#3f7a52"/><path d="M50 142q70-14 140 0" stroke="#9fd0e8" stroke-width="6" fill="none" opacity=".75"/></svg>') },
  logo: { name: 'Logo-club.png', w: 110, h: 110, src: sample(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110"><circle cx="55" cy="55" r="52" fill="${GREEN}"/><circle cx="78" cy="38" r="9" fill="#f4e3a1"/><path d="M12 82 42 36 60 62 72 46 100 82z" fill="#e8f1ec"/><path d="M30 82 42 62 52 76 40 82z" fill="#cfe2d8"/></svg>`) },
  sign: { name: 'Signature.png', w: 150, h: 56, src: sample('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 56"><path d="M6 38c10-26 18-30 20-22s-12 30-6 30 16-26 24-24-4 22 4 20 14-14 20-12-6 14 2 14 14-8 20-8M82 44c14 2 36-4 58-12" fill="none" stroke="#1b2a6b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>') }
};
const FONTS = { helv: ['Helvetica', '"Helvetica Neue",Helvetica,Arial,sans-serif'], times: ['Times', '"Times New Roman",Times,serif'], cour: ['Courier', '"Courier New",Courier,monospace'] };
const PERSIST = new Set(['select', 'hand', 'highlight', 'underline', 'strike', 'pen']);
const MARK = new Set(['highlight', 'underline', 'strike']);
const KIND_TOOL = { highlight: 'hl', underline: 'ul', strike: 'st' };
const tname = k => ({ select: T('Sélection', 'Select'), hand: T('Main (déplacer)', 'Hand (move)'), highlight: T('Surligner', 'Highlight'), underline: T('Souligner', 'Underline'), strike: T('Barrer', 'Strike Through'), note: T('Note', 'Note'), text: T('Zone de texte', 'Text Box'),
  pen: T('Stylo', 'Pen'), rect: T('Rectangle', 'Rectangle'), ellipse: T('Ellipse', 'Ellipse'), arrow: T('Flèche', 'Arrow'), whiteout: T('Gomme (masquer, puis écrire par-dessus : double-clic)', 'Eraser (hide, then write over it: double-click)'), check: T('Coche ✓', 'Check ✓'), cross: T('Croix ✗', 'Cross ✗') })[k];
const kindName = a => ({ hl: T('Surlignage', 'Highlight'), ul: T('Soulignement', 'Underline'), st: T('Barré', 'Strike'), note: T('Note', 'Note'), text: T('Texte', 'Text') })[a.t] || T('Annotation', 'Annotation');
const KIND_TITLE = () => ({ form: T('Fiche d’inscription', 'Registration form'), program: T('Programme de la saison', 'Season programme'), equipment: T('Équipement conseillé', 'Recommended gear'), rules: T('Règlement intérieur', 'House rules'),
  tariffs: T('Tarifs et contacts', 'Fees and contacts'), annex: T('Annexe : attestation d’assurance', 'Appendix: insurance certificate') });

/* ====================================================================== contenu du faux PDF (595 × 842 pt) ====================================================================== */
const A = (x, y, txt, s = '', w) => h('div', { class: 'pt', style: `left:${x}px;top:${y}px;${w ? `width:${w}px;` : ''}${s}` }, txt);
const R = (x, y, w, hh, s = '') => h('div', { class: 'pt', style: `left:${x}px;top:${y}px;width:${w}px;height:${hh}px;${s}` });
const LOGO = `<svg viewBox="0 0 110 110" width="40" height="40"><circle cx="55" cy="55" r="52" fill="${GREEN}"/><circle cx="78" cy="38" r="9" fill="#f4e3a1"/><path d="M12 82 42 36 60 62 72 46 100 82z" fill="#e8f1ec"/></svg>`;
const head = (title, sub) => [h('div', { class: 'pt', style: 'left:48px;top:36px', html: LOGO }), A(100, 36, title, 'font-size:21px;font-weight:700;color:#1d2b24;white-space:nowrap'), A(100, 64, sub, 'font-size:10px;color:#6b746f;white-space:nowrap'), R(48, 92, 499, 2, `background:${GREEN}`)];
const foot = () => A(48, 806, T('Les Marmottes alpines · Club de randonnée · Saison 2027', 'Alpine Marmots · Hiking club · 2027 season'), 'font-size:8px;color:#8a918d;white-space:nowrap');
const H2 = (x, y, txt) => A(x, y, txt, `font-size:12.5px;font-weight:700;color:${GREEN};white-space:nowrap`);
const SUB = () => T('Club de randonnée Les Marmottes alpines · saison 2027', 'Alpine Marmots Hiking Club · 2027 season');

function content(pg, live, D, onDirty) {
  const k = pg.kind;
  if (k === 'blank' || k === 'photo') return [];
  if (k === 'form') {
    const val = n => D.form[pg.id + ':' + n];
    const inp = (n, x, y, w, hh = 22, ta) => { const el = h(ta ? 'textarea' : 'input', { class: 'fld', type: ta ? false : 'text', style: `left:${x}px;top:${y}px;width:${w}px;height:${hh}px`, 'data-n': n, spellcheck: 'false', disabled: !live, 'aria-label': n }); el.value = val(n) || ''; if (live) el.addEventListener('input', () => { D.form[pg.id + ':' + n] = el.value; onDirty(); }); return el; };
    const cb = (n, x, y, label) => { const box = h('input', { type: 'checkbox', class: 'fld mpdf-cbx', style: `left:${x}px;top:${y}px`, disabled: !live, 'aria-label': label }); box.checked = !!val(n); if (live) box.addEventListener('change', () => { D.form[pg.id + ':' + n] = box.checked; onDirty(); sfx.tick(); }); return [box, A(x + 21, y + 1, label, 'font-size:10.5px;white-space:nowrap')]; };
    const lb = (x, y, txt) => A(x, y, txt, 'font-size:8.5px;color:#6b746f;white-space:nowrap');
    return [...head(T('Fiche d’inscription 2027', 'Registration form 2027'), SUB()),
      H2(48, 110, T('1. Vos coordonnées', '1. Your details')),
      lb(48, 134, T('Nom', 'Last name')), inp('nom', 48, 146, 240), lb(308, 134, T('Prénom', 'First name')), inp('prenom', 308, 146, 240),
      lb(48, 180, T('Adresse e-mail', 'E-mail address')), inp('mail', 48, 192, 240), lb(308, 180, T('Téléphone', 'Phone')), inp('tel', 308, 192, 240),
      lb(48, 226, T('Date de naissance', 'Date of birth')), inp('naiss', 48, 238, 140), lb(208, 226, T('Ville', 'City')), inp('ville', 208, 238, 340),
      H2(48, 282, T('2. Votre niveau', '2. Your level')),
      ...cb('niv1', 48, 306, T('Débutant', 'Beginner')), ...cb('niv2', 200, 306, T('Intermédiaire', 'Intermediate')), ...cb('niv3', 372, 306, T('Confirmé', 'Experienced')),
      H2(48, 340, T('3. Options', '3. Options')),
      ...cb('opt1', 48, 364, T('Assurance randonnée (12 €)', 'Hiking insurance (€12)')), ...cb('opt2', 308, 364, T('Location de crampons', 'Crampon rental')),
      ...cb('opt3', 48, 388, T('Covoiturage depuis la ville', 'Carpool from the city')), ...cb('opt4', 308, 388, T('Lettre d’information', 'Newsletter')),
      H2(48, 428, T('4. Remarques', '4. Remarks')), inp('rem', 48, 450, 500, 62, true),
      H2(48, 534, T('5. Date et signature', '5. Date and signature')),
      lb(48, 558, T('Date', 'Date')), inp('date', 48, 570, 140), lb(308, 558, T('Signature', 'Signature')), R(308, 570, 240, 58, 'border:1px dashed #9aa39e'),
      A(48, 650, T('Conditions d’inscription', 'Registration terms'), 'font-size:10.5px;font-weight:700;color:#1d2b24'),
      A(48, 668, T('L’inscription est valable pour la saison 2027 et donne accès à toutes les sorties du programme. Elle devient définitive à la réception de la présente fiche complétée, accompagnée du règlement de la cotisation. Un certificat médical de moins de trois ans est demandé pour les sorties de niveau confirmé.', 'Registration is valid for the 2027 season and gives access to every outing in the programme. It becomes final once this completed form is received together with the membership fee. A medical certificate dated within three years is required for experienced-level outings.'), 'font-size:9.2px;color:#444;line-height:1.5', 499),
      A(48, 726, T('Les informations recueillies servent uniquement à la gestion du club. Vous pouvez demander à tout moment leur rectification ou leur suppression auprès du bureau.', 'The information collected is used only to run the club. You can ask for it to be corrected or deleted at any time by contacting the committee.'), 'font-size:9.2px;color:#444;line-height:1.5', 499), foot()];
  }
  if (k === 'program') {
    const rows = [[T('18 janv.', 'Jan 18'), T('Raquettes · Col des Aravis', 'Snowshoes · Col des Aravis'), 1, '350 m'], [T('1 févr.', 'Feb 1'), T('Ski de randonnée · Belledonne', 'Ski touring · Belledonne'), 2, '900 m'], [T('8 mars', 'Mar 8'), T('Raquettes · Plateau de Beauregard', 'Snowshoes · Plateau de Beauregard'), 1, '400 m'],
      [T('12 avr.', 'Apr 12'), T('Boucle des lacs · Chartreuse', 'Lakes loop · Chartreuse'), 2, '750 m'], [T('17 mai', 'May 17'), T('Crêtes du Vercors', 'Vercors ridges'), 3, '1 100 m'], [T('14 juin', 'Jun 14'), T('Lac Blanc · Aiguilles Rouges', 'Lac Blanc · Aiguilles Rouges'), 2, '800 m'],
      [T('5 juil.', 'Jul 5'), T('Vallon de la Vanoise', 'Vanoise valley'), 3, '1 300 m'], [T('6 sept.', 'Sep 6'), T('Tour du Pic de l’Étoile', 'Pic de l’Étoile loop'), 2, '950 m']];
    const lvl = n => [T('Débutant', 'Beginner'), T('Intermédiaire', 'Intermediate'), T('Confirmé', 'Experienced')][n - 1];
    const tab = h('div', { class: 'pt mpdf-tbl', style: 'left:48px;top:142px;width:499px' }, h('div', { class: 'mpdf-tr mpdf-trh' }, ...[T('Date', 'Date'), T('Sortie', 'Outing'), T('Niveau', 'Level'), T('Dénivelé', 'Climb')].map(x => h('span', {}, x))),
      ...rows.map(r => h('div', { class: 'mpdf-tr' }, h('span', {}, r[0]), h('span', { style: 'font-weight:600' }, r[1]), h('span', {}, lvl(r[2])), h('span', {}, r[3]))));
    return [...head(T('Programme de la saison', 'Season programme'), SUB()),
      A(48, 106, T('Huit sorties à la journée, de la neige de janvier aux crêtes de septembre. Départ à 7 h 30 devant le local du club.', 'Eight day outings, from January snow to September ridges. Departure at 7:30 am in front of the club house.'), 'font-size:10.5px;color:#444;line-height:1.45', 499), tab,
      H2(48, 470, T('Bon à savoir', 'Good to know')),
      A(48, 492, T('Le point de rendez-vous et les horaires précis sont confirmés par la lettre d’information la semaine précédant chaque sortie. En cas de météo défavorable, l’animateur peut modifier l’itinéraire ou annuler la sortie : l’information est envoyée la veille avant 18 h.', 'The meeting point and exact times are confirmed in the newsletter the week before each outing. In bad weather the leader may change the route or cancel the outing: the information is sent the evening before, by 6 pm.'), 'font-size:10.5px;color:#333;line-height:1.5', 499),
      A(48, 570, T('Le pique-nique est tiré du sac. Chaque participant porte sa trousse de premiers secours ; le club fournit une balise de secours par groupe. Les chiens ne sont pas admis, afin de protéger la faune de montagne et le troupeau de moutons des estives.', 'Lunch is carried in the backpack. Everyone carries a first-aid kit; the club supplies one emergency beacon per group. Dogs are not allowed, to protect mountain wildlife and the summer-pasture flocks.'), 'font-size:10.5px;color:#333;line-height:1.5', 499),
      R(48, 660, 499, 70, 'background:#eef4f0;border-left:4px solid ' + GREEN), A(64, 672, T('Sortie d’initiation', 'Introductory outing'), `font-size:11px;font-weight:700;color:${GREEN}`), A(64, 690, T('La première sortie de raquettes est ouverte aux curieux : venez essayer le matériel avant de vous inscrire, sans engagement.', 'The first snowshoe outing is open to the curious: come and try the equipment before you sign up, no commitment.'), 'font-size:10px;color:#333;line-height:1.45', 468), foot()];
  }
  if (k === 'equipment') {
    const li = arr => arr.map(x => '• ' + x).join('\n');
    return [...head(T('Équipement conseillé', 'Recommended gear'), SUB()),
      H2(48, 112, T('Indispensable', 'Essential')), A(48, 134, li([T('Chaussures de randonnée montantes', 'Ankle-high hiking boots'), T('Sac à dos de 25 à 35 litres', 'Backpack, 25 to 35 litres'), T('Veste imperméable et respirante', 'Waterproof, breathable jacket'), T('Gourde de 1,5 litre minimum', 'Water bottle, 1.5 litres minimum'), T('Lunettes de soleil et crème solaire', 'Sunglasses and sunscreen'), T('Trousse de premiers secours', 'First-aid kit')]), 'font-size:10.5px;line-height:1.75;white-space:pre-line;color:#222', 240),
      H2(308, 112, T('Selon la saison', 'Depending on the season')), A(308, 134, li([T('Raquettes et bâtons (hiver)', 'Snowshoes and poles (winter)'), T('Gants et bonnet chauds', 'Warm gloves and hat'), T('Guêtres en cas de neige profonde', 'Gaiters for deep snow'), T('Frontale avec piles de rechange', 'Headlamp with spare batteries'), T('Chapeau de soleil (été)', 'Sun hat (summer)'), T('Couverture de survie', 'Emergency blanket')]), 'font-size:10.5px;line-height:1.75;white-space:pre-line;color:#222', 240),
      h('div', { class: 'pt', style: 'left:48px;top:310px;width:499px;height:150px;border-radius:6px;overflow:hidden', html: '<svg viewBox="0 0 499 150" width="499" height="150"><defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d6ee"/><stop offset="1" stop-color="#f7e6c8"/></linearGradient></defs><rect width="499" height="150" fill="url(#eq)"/><circle cx="410" cy="36" r="16" fill="#fff3c4"/><path d="M0 120 90 44 150 92 230 22 330 112 390 70 499 124V150H0z" fill="#6a85a3"/><path d="M200 38l30-16 22 20-18 7-10-9z" fill="#fff" opacity=".9"/><path d="M0 150V122c80-16 160 4 250 0s170-14 249 0v28z" fill="#3f7a52"/></svg>' }),
      A(48, 468, T('Le sommet de la Dent du Chat, un matin de fin de printemps.', 'The summit of the Dent du Chat, on a late spring morning.'), 'font-size:8.5px;color:#7a827e;font-style:italic'),
      H2(48, 500, T('Conseil de l’animateur', 'Leader’s advice')),
      A(48, 522, T('Préparez le sac la veille et pesez-le : au-delà de 8 kg pour une sortie à la journée, c’est qu’il y a trop de choses. Mieux vaut une couche chaude de plus qu’un sixième sandwich. Les chaussures neuves se rodent sur de petites balades avant la première grande sortie.', 'Pack the bag the day before and weigh it: beyond 8 kg for a day outing, something is too much. A spare warm layer beats a sixth sandwich. New boots should be broken in on short walks before the first big outing.'), 'font-size:10.5px;color:#333;line-height:1.5', 499),
      R(48, 620, 499, 60, 'background:#fdf3e1;border-left:4px solid #e0a02c'), A(64, 632, T('Prêt de matériel', 'Equipment loan'), 'font-size:11px;font-weight:700;color:#946414'), A(64, 650, T('Le club prête des raquettes, des bâtons et quelques sacs aux nouveaux adhérents pour la première saison.', 'The club lends snowshoes, poles and a few backpacks to new members for their first season.'), 'font-size:10px;color:#333;line-height:1.4', 468), foot()];
  }
  if (k === 'rules') {
    const art = [[T('Article 1 · Engagement', 'Article 1 · Commitment'), T('S’inscrire à une sortie, c’est s’engager à y participer ou à prévenir l’animateur au plus tard la veille. Un groupe se compose de dix personnes au plus.', 'Signing up for an outing means committing to attend or to warn the leader by the day before at the latest. A group has ten people at most.')],
      [T('Article 2 · Animateur', 'Article 2 · Leader'), T('L’animateur choisit l’itinéraire, le rythme et les pauses. Ses décisions, notamment le demi-tour en cas de doute, s’appliquent à tous sans discussion.', 'The leader chooses the route, the pace and the breaks. Their decisions, notably turning back when in doubt, apply to everyone without discussion.')],
      [T('Article 3 · Groupe', 'Article 3 · Group'), T('Le groupe reste uni : personne ne devance l’animateur ni ne reste en arrière sans le signaler. Le dernier du groupe est désigné au départ.', 'The group stays together: nobody goes ahead of the leader or falls behind without saying so. The last person in line is named at the start.')],
      [T('Article 4 · Environnement', 'Article 4 · Environment'), T('Nous restons sur les sentiers, ne cueillons rien, remportons tous nos déchets et respectons le silence aux abords des zones de nidification.', 'We stay on the trails, pick nothing, take all our litter home and keep quiet near nesting areas.')],
      [T('Article 5 · Sécurité', 'Article 5 · Safety'), T('En cas d’accident, l’animateur donne l’alerte et organise les secours. Chacun signale ses problèmes de santé et ses traitements avant le départ.', 'In an accident the leader raises the alarm and organises the rescue. Everyone reports health issues and treatments before departure.')],
      [T('Article 6 · Responsabilité', 'Article 6 · Liability'), T('Le club est assuré pour ses sorties. Les dommages causés par un participant ignorant ces consignes restent à sa charge.', 'The club is insured for its outings. Damage caused by a participant ignoring these rules remains their own responsibility.')]];
    return [...head(T('Règlement intérieur', 'House rules'), SUB()), h('div', { class: 'pt flow', style: 'left:48px;top:114px;width:499px' }, art.map(([a, b]) => h('div', { class: 'mpdf-art' }, h('b', {}, a), h('p', {}, b)))), foot()];
  }
  if (k === 'tariffs') {
    const rows = [[T('Adhésion adulte', 'Adult membership'), '45 €'], [T('Adhésion jeune (moins de 18 ans)', 'Youth membership (under 18)'), '25 €'], [T('Assurance randonnée', 'Hiking insurance'), '12 €'], [T('Location de crampons', 'Crampon rental'), T('5 € par sortie', '€5 per outing')], [T('Covoiturage', 'Carpool'), T('Partage des frais', 'Cost sharing')]];
    const bars = [4, 6, 9, 12, 15, 17, 11, 8]; const mx = Math.max(...bars), lab = T(['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Sep'], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Sep']);
    const chart = `<svg viewBox="0 0 499 150" width="499" height="150"><line x1="0" y1="120" x2="499" y2="120" stroke="#c9cfcb"/>${bars.map((v, i) => `<rect x="${14 + i * 61}" y="${120 - v / mx * 104}" width="38" height="${v / mx * 104}" rx="3" fill="${GREEN}" opacity="${.45 + v / mx * .55}"/><text x="${33 + i * 61}" y="136" font-size="9" text-anchor="middle" fill="#6b746f">${lab[i]}</text><text x="${33 + i * 61}" y="${114 - v / mx * 104}" font-size="9" text-anchor="middle" fill="#333">${v}</text>`).join('')}</svg>`;
    return [...head(T('Tarifs et contacts', 'Fees and contacts'), SUB()), H2(48, 112, T('Cotisations 2027', '2027 fees')),
      h('div', { class: 'pt mpdf-tbl two', style: 'left:48px;top:134px;width:499px' }, ...rows.map(r => h('div', { class: 'mpdf-tr' }, h('span', {}, r[0]), h('span', { style: 'text-align:right;font-weight:600' }, r[1])))),
      H2(48, 312, T('Participants par sortie en 2026', 'Participants per outing in 2026')), h('div', { class: 'pt', style: 'left:48px;top:336px', html: chart }),
      H2(48, 510, T('Nous contacter', 'Contact us')), A(48, 532, T('Bureau du club : contact@marmottes-alpines.example\nPermanence : le mardi de 18 h à 19 h 30, au local du club\nResponsable des sorties : sorties@marmottes-alpines.example', 'Club office: contact@marmottes-alpines.example\nOpen: Tuesdays, 6 pm to 7:30 pm, at the club house\nOutings coordinator: sorties@marmottes-alpines.example'), 'font-size:10.5px;line-height:1.8;white-space:pre-line;color:#222', 499),
      R(48, 640, 499, 80, 'background:#eef4f0;border-radius:6px'), A(64, 654, T('Merci de votre confiance', 'Thank you for your trust'), `font-size:12px;font-weight:700;color:${GREEN}`), A(64, 674, T('Le club vit grâce à ses bénévoles. Si vous souhaitez encadrer une sortie ou aider à l’organisation, parlez-en au bureau : toutes les bonnes volontés sont les bienvenues.', 'The club runs on volunteers. If you would like to lead an outing or help organise, talk to the committee: every helping hand is welcome.'), 'font-size:10px;color:#333;line-height:1.45', 468), foot()];
  }
  /* annexe */
  return [...head(T('Annexe : attestation d’assurance', 'Appendix: insurance certificate'), T('Modèle à compléter par l’assureur', 'Template to be completed by the insurer')),
    A(48, 120, T('Nous soussignés, société d’assurance, attestons que l’adhérent désigné ci-dessous est couvert pour la pratique de la randonnée pédestre et de la raquette à neige dans le cadre des activités du club, pour la durée de la saison 2027.', 'We, the undersigned insurance company, certify that the member named below is covered for hiking and snowshoeing within club activities, for the length of the 2027 season.'), 'font-size:11px;line-height:1.55;color:#222', 499),
    ...[[T('Nom de l’adhérent', 'Member name'), 190], [T('Numéro de contrat', 'Contract number'), 250], [T('Période de validité', 'Validity period'), 310]].map(([l, y]) => [A(48, y, l, 'font-size:9px;color:#6b746f'), R(48, y + 14, 330, 1, 'background:#9aa39e')]).flat(),
    A(48, 400, T('Garanties : responsabilité civile, dommages corporels, rapatriement.', 'Cover: third-party liability, personal injury, repatriation.'), 'font-size:11px;color:#222'), A(48, 470, T('Fait à ______________________, le ______________', 'Done at ______________________, on ______________'), 'font-size:11px;color:#222'), A(330, 520, T('Cachet et signature de l’assureur', 'Insurer’s stamp and signature'), 'font-size:9px;color:#6b746f'), R(330, 536, 217, 90, 'border:1px dashed #9aa39e'), foot()];
}
/* ====================================================================== application ====================================================================== */
export async function open(app) {
  await sheetReady(CSS);
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 500, h: 708, x: 560, y: 88, minw: 420, minh: 360, bare: true, cls: 'socle mpdf', onclose: w => { w.dead = true; w.stop && w.stop(); }, build: w => build(app, w) });
}

function build(app, w) {
  let uid = 0; const nid = p => p + (++uid);
  const mkPage = (kind, extra = {}) => ({ id: nid('p'), kind, rot: 0, ann: [], ...extra });
  const D = { pages: ['form', 'program', 'equipment', 'rules', 'tariffs'].map(k => mkPage(k)), form: {} };
  let tool = 'select', fit = 'width', kMan = 1, K = 1, mode = 'cont', cur = 0, sel = null, side = 'left', pagesOn = false, notesOn = false, tab = 'thumbs', barOn = false, menuOpen = 0, hideT = 0, hudT = 0, searching = false;
  let q = '', hits = [], hitI = -1, undo = [], redo = [], dirty = false, editing = null, panning = false, present = null, fmtOpen = false;
  let root, scroll, docEl, barEl, barRow, pagesDr, notesDr, thumbsEl, outlineEl, notesList, hudEl, fmtEl, searchIn, cardEl = null, barItems = [], toolBtns = new Map(), ro = null, presentEl = null;
  const els = new Map();
  const pageById = id => D.pages.find(p => p.id === id), idxOf = id => D.pages.findIndex(p => p.id === id);
  const dim = pg => (pg.rot % 180 ? { w: PH, h: PW } : { w: PW, h: PH });
  const markDirty = () => { dirty = true; };
  const sc = () => S.scale || 1;
  const alive = () => !w.dead && w.el.isConnected;

  /* ---------- annuler / rétablir (instantanés) ---------- */
  const snap = () => JSON.stringify({ p: D.pages, f: D.form });
  function pushUndo(before) { if (before === snap()) return; undo.push(before); if (undo.length > 120) undo.shift(); redo = []; dirty = true; drawNotes(); }
  function restore(s) { const o = JSON.parse(s); D.pages = o.p; D.form = o.f; sel = null; closeCard(); cur = clamp(cur, 0, D.pages.length - 1); refresh(); }
  const doUndo = () => { if (!undo.length) return false; redo.push(snap()); restore(undo.pop()); sfx.tick(); return true; };
  const doRedo = () => { if (!redo.length) return false; undo.push(snap()); restore(redo.pop()); sfx.tick(); return true; };
  const act = (fn, goto) => { const before = snap(); fn(); pushUndo(before); sel = null; if (goto != null) cur = clamp(goto, 0, D.pages.length - 1); refresh(); if (goto != null) goTo(cur); };

  /* ---------- géométrie ---------- */
  function geom(wr, inn, pg, k) {
    const d = dim(pg); wr.style.width = d.w * k + 'px'; wr.style.height = d.h * k + 'px'; wr.style.setProperty('--u', (1 / k).toFixed(4) + 'px');
    inn.style.transform = { 0: `scale(${k})`, 90: `translate(${PH * k}px,0) rotate(90deg) scale(${k})`, 180: `translate(${PW * k}px,${PH * k}px) rotate(180deg) scale(${k})`, 270: `translate(0,${PW * k}px) rotate(270deg) scale(${k})` }[pg.rot % 360];
  }
  function toPage(id, cx, cy) {
    const e = els.get(id), r = e.wr.getBoundingClientRect(), lw = parseFloat(e.wr.style.width) || r.width, s = r.width / lw || 1;
    const X = (cx - r.left) / s / K, Y = (cy - r.top) / s / K, pg = pageById(id);
    return { 0: [X, Y], 90: [Y, PH - X], 180: [PW - X, PH - Y], 270: [PW - Y, X] }[pg.rot % 360];
  }
  function layout() {
    if (!alive() || !scroll) return;
    const W0 = scroll.clientWidth, H0 = scroll.clientHeight; if (!W0) return;
    const cols = mode === 'two' || mode === 'twoc' ? 2 : 1, gap = 6, mw = Math.max(...D.pages.map(p => dim(p).w)), mh = Math.max(...D.pages.map(p => dim(p).h));
    K = fit === 'width' ? (W0 - (cols - 1) * gap) / (cols * mw) : fit === 'page' ? Math.min((W0 - (cols - 1) * gap) / (cols * mw), H0 / mh) : kMan;
    K = clamp(K, .15, 4);
    els.forEach((e, id) => { const pg = pageById(id); pg && geom(e.wr, e.inn, pg, K); });
    const single = mode === 'single' || mode === 'two';
    docEl.classList.toggle('center', single || fit === 'page');
    [...docEl.children].forEach(row => { row.hidden = single && ![...row.children].some(c => c.dataset.id === D.pages[cur].id); });
  }

  /* ---------- annotations ---------- */
  const NOTE_SVG = '<svg viewBox="0 0 22 22" width="100%" height="100%"><path d="M2.5 2.5h17v12l-5 5h-12z" fill="#ffd84a" stroke="#b58a00" stroke-width="1.3" stroke-linejoin="round"/><path d="M14.5 19.5v-5h5" fill="#f0bd1f" stroke="#b58a00" stroke-width="1.2" stroke-linejoin="round"/><path d="M6 7.5h10M6 11h7" stroke="#8a6a00" stroke-width="1.3" stroke-linecap="round"/></svg>';
  function paint(el, a) {
    el.style.left = a.x + 'px'; el.style.top = a.y + 'px'; el.style.width = a.w + 'px'; if (a.t !== 'text') el.style.height = a.h + 'px';
    if (a.t === 'text') { Object.assign(el.style, { fontSize: a.s + 'px', fontFamily: FONTS[a.f][1], fontWeight: a.b ? 700 : 400, fontStyle: a.i ? 'italic' : 'normal', color: a.c || '#1b1b1b' }); if (!el.isContentEditable) el.textContent = a.txt; }
    else if (a.t === 'check') el.innerHTML = '<svg viewBox="0 0 18 18" width="100%" height="100%" preserveAspectRatio="none"><path d="M2.5 9.5 7 14 15.5 4" fill="none" stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
    else if (a.t === 'cross') el.innerHTML = '<svg viewBox="0 0 18 18" width="100%" height="100%" preserveAspectRatio="none"><path d="M3.5 3.5 14.5 14.5M14.5 3.5 3.5 14.5" fill="none" stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
    else if (a.t === 'image') { if (!el.firstChild) el.innerHTML = `<img src="${IMGS[a.img].src}" alt="" draggable="false">`; }
    else if (a.t === 'rect' || a.t === 'ellipse') { el.style.border = `2px solid ${RED}`; el.style.borderRadius = a.t === 'ellipse' ? '50%' : '2px'; }
    else if (a.t === 'wo') el.style.background = '#fff';
    else if (a.t === 'note') { if (!el.firstChild) el.innerHTML = NOTE_SVG; el.title = a.txt || ''; }
    else if (a.t === 'arrow') {
      const W = a.w, H = a.h, [x0, y0, x1, y1] = a.p, X0 = x0 * W, Y0 = y0 * H, X1 = x1 * W, Y1 = y1 * H, th = Math.atan2(Y1 - Y0, X1 - X0), L = 13, hd = [th + 2.7, th - 2.7].map(t => `${(X1 + Math.cos(t) * L).toFixed(1)},${(Y1 + Math.sin(t) * L).toFixed(1)}`);
      el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="overflow:visible"><line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y1}" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/><polyline points="${hd[0]} ${X1.toFixed(1)},${Y1.toFixed(1)} ${hd[1]}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (a.t === 'pen') el.innerHTML = `<svg width="${a.w}" height="${a.h}" viewBox="0 0 ${a.w} ${a.h}" style="overflow:visible"><polyline points="${a.pts.map(p => (p[0] * a.w).toFixed(1) + ',' + (p[1] * a.h).toFixed(1)).join(' ')}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function annEl(a) {
    const el = h('div', { class: 'an an-' + a.t, 'data-a': a.id });
    if (a.t === 'hl' || a.t === 'ul' || a.t === 'st') { el.classList.add('an-mk'); a.rects.forEach(r => el.append(h('i', { class: 'mk-r', style: `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px` }))); return el; }
    paint(el, a); return el;
  }
  const resizable = a => !['hl', 'ul', 'st', 'note'].includes(a.t);
  function selBox(a) {
    const b = h('div', { class: 'mpdf-sel', style: `left:${a.x}px;top:${a.y}px;width:${a.w}px;height:${a.h}px` });
    if (resizable(a)) (a.t === 'text' ? ['w', 'e'] : ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']).forEach(d => b.append(h('i', { class: 'mpdf-hd d-' + d, 'data-d': d })));
    return b;
  }
  function drawAnn(pg) {
    const e = els.get(pg.id); if (!e) return;
    e.an.replaceChildren(...pg.ann.map(annEl));
    pg.ann.forEach(a => { if (a.t === 'text') { const el = e.an.querySelector(`[data-a="${a.id}"]`); if (el) a.h = Math.max(14, el.offsetHeight); } });
    if (sel && sel.pg === pg.id) { const a = pg.ann.find(x => x.id === sel.id); if (a) e.an.append(selBox(a)); }
    updThumb(pg.id);
  }
  function setSel(pgId, aid) {
    const old = sel; sel = pgId ? { pg: pgId, id: aid } : null;
    if (old && (!sel || old.pg !== sel.pg)) { const p = pageById(old.pg); p && drawAnn(p); }
    if (sel) drawAnn(pageById(sel.pg)); else if (old) { const p = pageById(old.pg); p && drawAnn(p); }
    updFmt();
  }
  const selAnn = () => { if (!sel) return null; const p = pageById(sel.pg); return p ? p.ann.find(x => x.id === sel.id) || null : null; };
  const annNode = (id, aid) => els.get(id) && els.get(id).an.querySelector(`[data-a="${aid}"]`);
  const place = (el, a) => { if (!el) return; el.style.left = a.x + 'px'; el.style.top = a.y + 'px'; el.style.width = a.w + 'px'; if (!el.classList.contains('an-text')) el.style.height = a.h + 'px'; };
  function startMove(e, id, a) {
    if (a.t === 'hl' || a.t === 'ul' || a.t === 'st') return;
    const before = snap(), p0 = toPage(id, e.clientX, e.clientY), o = { x: a.x, y: a.y }; let moved = false;
    const mv = ev => { const p = toPage(id, ev.clientX, ev.clientY), dx = p[0] - p0[0], dy = p[1] - p0[1]; if (!moved && Math.hypot(dx, dy) * K < 3) return; moved = true; a.x = o.x + dx; a.y = o.y + dy; place(annNode(id, a.id), a); place(els.get(id).an.querySelector('.mpdf-sel'), a); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (moved) { pushUndo(before); updThumb(id); } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  function startResize(e, id, a, dir) {
    const before = snap(), p0 = toPage(id, e.clientX, e.clientY), o = { x: a.x, y: a.y, w: a.w, h: a.h }, ratio = o.w / o.h, keep = a.t === 'image' && dir.length === 2; let moved = false;
    const mv = ev => {
      const p = toPage(id, ev.clientX, ev.clientY), dx = p[0] - p0[0], dy = p[1] - p0[1]; moved = true;
      let nw = o.w, nh = o.h;
      if (dir.includes('e')) nw = o.w + dx; if (dir.includes('w')) nw = o.w - dx; if (dir.includes('s')) nh = o.h + dy; if (dir.includes('n')) nh = o.h - dy;
      nw = Math.max(12, nw); nh = Math.max(12, nh); if (keep) nh = nw / ratio;
      a.w = nw; if (a.t !== 'text') a.h = nh;
      a.x = dir.includes('w') ? o.x + o.w - nw : o.x; a.y = dir.includes('n') ? o.y + o.h - (a.t === 'text' ? a.h : nh) : o.y;
      const el = annNode(id, a.id); if (a.t === 'arrow' || a.t === 'pen') paint(el, a); place(el, a);
      if (a.t === 'text' && el) a.h = Math.max(14, el.offsetHeight);
      place(els.get(id).an.querySelector('.mpdf-sel'), a);
    };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (moved) { pushUndo(before); updThumb(id); } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  function startEdit(id, a, before = snap(), fresh = false) {
    const el = annNode(id, a.id); if (!el) return; const pg = pageById(id);
    editing = { id, a }; el.contentEditable = 'true'; el.spellcheck = false; el.classList.add('editing'); el.focus({ preventScroll: true });
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const fin = () => {
      el.removeEventListener('blur', fin); editing = null; const txt = el.innerText.replace(/\n+$/, '');
      if (!txt.trim()) { pg.ann = pg.ann.filter(x => x !== a); sel = null; if (!fresh) pushUndo(before); }
      else { const ch = txt !== a.txt; a.txt = txt; if (ch || fresh) pushUndo(before); }
      if (alive()) { drawAnn(pg); drawNotes(); updFmt(); }
    };
    el.addEventListener('blur', fin);
  }
  async function askNote(initial) { const r = await macAlert({ app, title: T('Texte de la note', 'Note text'), buttons: [T('OK', 'OK'), T('Annuler', 'Cancel')], cancel: 1, field: { value: initial || '', placeholder: T('Votre note…', 'Your note…') } }); return r.i === 0 ? r.value.trim() : null; }
  const newAnn = (t, o) => ({ id: nid('a'), t, x: 0, y: 0, w: 18, h: 18, ...o });
  function add(pg, a, keepTool) { pg.ann.push(a); sel = { pg: pg.id, id: a.id }; drawAnn(pg); drawNotes(); updFmt(); if (!keepTool && !PERSIST.has(tool)) setTool('select'); }

  function startTool(e, pg) {
    const id = pg.id, p0 = toPage(id, e.clientX, e.clientY);
    if (tool === 'hand') { panning = true; const sx = e.clientX, sy = e.clientY, ox = scroll.scrollLeft, oy = scroll.scrollTop; root.classList.add('panning');
      const mv = ev => { scroll.scrollLeft = ox - (ev.clientX - sx) / sc(); scroll.scrollTop = oy - (ev.clientY - sy) / sc(); }; const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); root.classList.remove('panning'); panning = false; };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); return; }
    if (tool === 'text') { const before = snap(), a = newAnn('text', { x: p0[0] - 4, y: p0[1] - 10, w: 170, h: 20, txt: '', s: 12, f: 'helv', b: 0, i: 0, c: '#1b1b1b' }); add(pg, a); setTimeout(() => alive() && startEdit(id, a, before, true), 30); return; }
    if (tool === 'check' || tool === 'cross') { const before = snap(); add(pg, newAnn(tool, { x: p0[0] - 9, y: p0[1] - 9 })); pushUndo(before); sfx.tick(); return; }
    if (tool === 'note') { const before = snap(); askNote('').then(t => { if (!alive() || t == null) return; add(pg, newAnn('note', { x: p0[0] - 11, y: p0[1] - 11, w: 22, h: 22, txt: t })); pushUndo(before); }); return; }
    if (['pen', 'rect', 'ellipse', 'arrow', 'whiteout'].includes(tool)) {
      const before = snap(), layer = els.get(id).an, tl = tool === 'whiteout' ? 'wo' : tool, a = newAnn(tl, {}); let node = null; const pts = [p0];
      const mv = ev => {
        const p = toPage(id, ev.clientX, ev.clientY);
        if (tl === 'pen') { pts.push(p); const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x = Math.min(...xs), y = Math.min(...ys); a.x = x; a.y = y; a.w = Math.max(1, Math.max(...xs) - x); a.h = Math.max(1, Math.max(...ys) - y); a.pts = pts.map(q => [(q[0] - x) / a.w, (q[1] - y) / a.h]); }
        else { const x = Math.min(p0[0], p[0]), y = Math.min(p0[1], p[1]); a.x = x; a.y = y; a.w = Math.max(1, Math.abs(p[0] - p0[0])); a.h = Math.max(1, Math.abs(p[1] - p0[1])); if (tl === 'arrow') a.p = [(p0[0] - x) / a.w, (p0[1] - y) / a.h, (p[0] - x) / a.w, (p[1] - y) / a.h]; }
        if (!node) { node = annEl(a); layer.append(node); } else { paint(node, a); }
      };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (node) node.remove(); const ok = tl === 'pen' ? pts.length > 2 : a.w > 5 || a.h > 5; if (ok) { add(pg, a, tl === 'pen'); pushUndo(before); if (tl === 'pen') { sel = null; drawAnn(pg); } } else drawAnn(pg); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    }
  }
  /* surlignage / soulignement / barré : sur le texte sélectionné */
  function markSelection() {
    const s = getSelection(); if (!s || s.isCollapsed || !s.rangeCount) return; const r = s.getRangeAt(0); if (!root.contains(r.commonAncestorContainer)) return;
    const base = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentNode, rects = [];
    const wk = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
    for (let n = wk.nextNode(); n; n = wk.nextNode()) { if (!r.intersectsNode(n) || !n.parentNode.closest('.mpdf-pgc')) continue; const rr = document.createRange(); rr.selectNodeContents(n); if (n === r.startContainer) rr.setStart(n, r.startOffset); if (n === r.endContainer) rr.setEnd(n, r.endOffset); [...rr.getClientRects()].forEach(q => q.width > 1 && q.height > 1 && rects.push(q)); }
    if (!rects.length) return;
    const txt = s.toString().replace(/\s+/g, ' ').trim(), before = snap(), byPage = new Map(); let first = true;
    rects.forEach(q => { const cx = q.left + q.width / 2, cy = q.top + q.height / 2; for (const [id, e] of els) { const b = e.wr.getBoundingClientRect(); if (cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom) { (byPage.get(id) || byPage.set(id, []).get(id)).push(q); break; } } });
    byPage.forEach((list, id) => {
      const pg = pageById(id), out = list.map(q => { const a = toPage(id, q.left, q.top), b = toPage(id, q.right, q.bottom); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; });
      const x = Math.min(...out.map(o => o[0])), y = Math.min(...out.map(o => o[1])), x2 = Math.max(...out.map(o => o[0] + o[2])), y2 = Math.max(...out.map(o => o[1] + o[3]));
      pg.ann.push(newAnn(KIND_TOOL[tool], { x, y, w: x2 - x, h: y2 - y, rects: out, txt: first ? txt : '' })); first = false; drawAnn(pg);
    });
    s.removeAllRanges(); pushUndo(before); drawNotes(); sfx.tick();
  }

  /* ---------- opérations sur les pages ---------- */
  const cloneAnn = a => ({ ...JSON.parse(JSON.stringify(a)), id: nid('a') });
  function duplicatePage(i) { const src = D.pages[i]; act(() => { const np = { ...JSON.parse(JSON.stringify(src)), id: nid('p'), ann: src.ann.map(cloneAnn) }; Object.keys(D.form).filter(k => k.startsWith(src.id + ':')).forEach(k => { D.form[np.id + k.slice(src.id.length)] = D.form[k]; }); D.pages.splice(i + 1, 0, np); }, i + 1); }
  function blankAfter(i) { act(() => D.pages.splice(i + 1, 0, mkPage('blank')), i + 1); }
  function rotatePage(i, d) { act(() => { D.pages[i].rot = (D.pages[i].rot + d + 360) % 360; }, i); }
  function removePage(i) { if (D.pages.length < 2) { sfx.tick(); toast({ icon: icon(app.id), title: app.id, body: T('Un document garde au moins une page.', 'A document keeps at least one page.') }); return; } act(() => D.pages.splice(i, 1), Math.min(i, D.pages.length - 2)); }
  function movePage(from, to) { if (to === from || to === from + 1) return; act(() => { const [p] = D.pages.splice(from, 1); D.pages.splice(to > from ? to - 1 : to, 0, p); }, to > from ? to - 1 : to); }
  function insertFile(f, at) { act(() => { D.pages.splice(at, 0, f === 'pdf' ? mkPage('annex') : mkPage('photo', { ann: [newAnn('image', { img: 'photo', x: 48, y: 160, w: 499, h: 332 })] })); }, at); }
  function placeImage(key, pg, p) { const im = IMGS[key], wd = key === 'photo' ? 240 : key === 'logo' ? 90 : 150, hd = wd * im.h / im.w, before = snap(); const x = p ? p[0] - wd / 2 : PW / 2 - wd / 2, y = p ? p[1] - hd / 2 : PH / 2 - hd / 2; add(pg, newAnn('image', { img: key, x, y, w: wd, h: hd }), true); setTool('select'); pushUndo(before); sfx.pop(); }
  const curPage = () => D.pages[clamp(cur, 0, D.pages.length - 1)];
  function imageMenu(anchor, at) { macMenu(anchor, [{ head: T('Insérer une image', 'Insert Image') }, ...Object.entries(IMGS).map(([k, im]) => ({ l: im.name, fn: () => placeImage(k, curPage(), at) }))], { onclose: unlock }); lock(); }
  function dropMenu(x, y, f, pg) {
    const i = idxOf(pg.id), a = anchorAt(x, y);
    const items = [...(f === 'img' ? [{ l: T('Placer l’image ici', 'Place Image Here'), fn: () => placeImage('photo', pg, toPage(pg.id, x, y)) }, { sep: 1 }] : []),
      { l: f === 'img' ? T(`Nouvelle page avant la page ${i + 1}`, `New Page Before Page ${i + 1}`) : T(`Insérer avant la page ${i + 1}`, `Insert Before Page ${i + 1}`), fn: () => insertFile(f, i) },
      { l: f === 'img' ? T(`Nouvelle page après la page ${i + 1}`, `New Page After Page ${i + 1}`) : T(`Insérer après la page ${i + 1}`, `Insert After Page ${i + 1}`), fn: () => insertFile(f, i + 1) }];
    macMenu(a, items, { onclose: () => { a.remove(); unlock(); } }); lock();
  }
  function pageMenu(x, y, i) {
    const a = anchorAt(x, y);
    macMenu(a, [{ l: T('Insérer un PDF ou une image ici…', 'Insert PDF or Image Here…'), fn: () => insertFile('pdf', i + 1) }, { l: T('Page vierge après', 'Blank Page After'), fn: () => blankAfter(i) }, { l: T('Dupliquer', 'Duplicate'), fn: () => duplicatePage(i) }, { sep: 1 },
      { l: T('Pivoter à gauche', 'Rotate Left'), fn: () => rotatePage(i, -90) }, { l: T('Pivoter à droite', 'Rotate Right'), fn: () => rotatePage(i, 90) }, { sep: 1 }, { l: T('Supprimer la page', 'Delete Page'), fn: () => removePage(i) }], { onclose: () => { a.remove(); unlock(); } }); lock();
  }
  function anchorAt(x, y) { const a = h('div', { class: 'mpdf-anchor', style: { left: x + 'px', top: y + 'px' } }); document.body.append(a); return a; }
  const lock = () => { menuOpen++; clearTimeout(hideT); }, unlock = () => { menuOpen = Math.max(0, menuOpen - 1); scheduleHide(1100); };

  /* ---------- recherche ---------- */
  const fold = s => { let o = '', m = []; for (let i = 0; i < s.length; i++) { const n = s[i].normalize('NFD').replace(/\p{M}/gu, '').toLowerCase(); for (const c of n) { o += c; m.push(i); } } return { o, m }; };
  function clearMarks() { els.forEach(e => e.c.querySelectorAll('.mpdf-hit').forEach(m => { const p = m.parentNode; m.replaceWith(...m.childNodes); p.normalize(); })); }
  function runSearch(term, keep) {
    q = term.trim(); clearMarks(); hits = []; if (!keep) hitI = -1;
    if (!q) { hudEl.classList.remove('on', 'sticky'); return; }
    const needle = fold(q).o;
    D.pages.forEach(pg => { const e = els.get(pg.id); if (!e) return; const wk = document.createTreeWalker(e.c, NodeFilter.SHOW_TEXT), nodes = []; for (let n = wk.nextNode(); n; n = wk.nextNode()) if (!n.parentNode.closest('textarea,input')) nodes.push(n);
      nodes.forEach(n => { const f = fold(n.nodeValue), spans = []; let i = f.o.indexOf(needle); while (i >= 0) { spans.push([f.m[i], f.m[i + needle.length - 1] + 1]); i = f.o.indexOf(needle, i + needle.length); }
        for (let j = spans.length - 1; j >= 0; j--) { const r = document.createRange(); r.setStart(n, spans[j][0]); r.setEnd(n, spans[j][1]); const m = h('span', { class: 'mpdf-hit' }); r.surroundContents(m); } }); });
    hits = D.pages.flatMap(pg => { const e = els.get(pg.id); return e ? [...e.c.querySelectorAll('.mpdf-hit')] : []; });
    if (!keep && hits.length) hitI = 0; hitI = Math.min(hitI, hits.length - 1); paintHit(!keep);
  }
  function paintHit(go) {
    hits.forEach((m, i) => m.classList.toggle('cur', i === hitI));
    hudEl.textContent = hits.length ? T(`${hits.length} résultat(s) · ${hitI + 1} / ${hits.length}`, `${hits.length} result(s) · ${hitI + 1} / ${hits.length}`) : T('Aucun résultat', 'No results'); hudEl.classList.add('on', 'sticky');
    if (go && hits[hitI]) { const m = hits[hitI], id = m.closest('.mpdf-pg').dataset.id, i = idxOf(id); if (mode === 'single' || mode === 'two') { cur = i; layout(); }
      const r = m.getBoundingClientRect(), sr = scroll.getBoundingClientRect(); scroll.scrollTop += (r.top + r.height / 2 - (sr.top + sr.height / 2)) / sc(); scroll.scrollLeft += (r.left + r.width / 2 - (sr.left + sr.width / 2)) / sc() * 0; markThumbs(); }
  }
  function stepHit(d) { if (!hits.length) { searchIn && searchIn.focus(); return; } hitI = (hitI + d + hits.length) % hits.length; paintHit(true); sfx.tick(); }
  const reapplySearch = () => { if (q) runSearch(q, true); };

  /* ---------- navigation ---------- */
  function hud(txt, sticky, ms = 1500) { if (hudEl.classList.contains('sticky') && !sticky) return; hudEl.textContent = txt; hudEl.classList.add('on'); clearTimeout(hudT); if (!sticky) hudT = setTimeout(() => hudEl.classList.remove('on'), ms); }
  const pageHud = () => hud(T(`Page ${cur + 1} sur ${D.pages.length}`, `Page ${cur + 1} of ${D.pages.length}`));
  function goTo(i, smooth) {
    i = clamp(i, 0, D.pages.length - 1); const was = cur; cur = i;
    if (mode === 'single' || mode === 'two') { layout(); scroll.scrollTop = 0; }
    else { const e = els.get(D.pages[i].id); if (e) scroll.scrollTo({ top: e.wr.parentNode.offsetTop, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' }); }
    markThumbs(); if (i !== was) pageHud();
  }
  let scrollRaf = 0;
  function onScroll() {
    if (scrollRaf || mode === 'single' || mode === 'two') return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; if (!alive()) return; const y = scroll.scrollTop + scroll.clientHeight * .35; let idx = 0, n = 0;
      for (const row of docEl.children) { if (row.offsetTop <= y) idx = n; n += row.children.length; if (row.offsetTop > y) break; }
      const rows = [...docEl.children]; let c = 0; rows.forEach((row, ri) => { if (row.offsetTop <= y) c = ri; }); const first = rows.slice(0, c).reduce((s, r) => s + r.children.length, 0);
      if (first !== cur) { cur = first; markThumbs(); pageHud(); } void idx; });
  }
  function setMode(m) { mode = m; drawPages(); goTo(cur); }
  function zoomBy(f) { const base = K; fit = null; kMan = clamp(base * f, .2, 4); layout(); }
  function setTool(t) { tool = t; root.className = root.className.replace(/\bmpdf-t-\S+/g, '').trim() + ' mpdf-t-' + t; toolBtns.forEach((b, k) => b.classList.toggle('on', k === t || (k === 'more' && ['hand', 'underline', 'strike', 'note', 'rect', 'ellipse', 'arrow', 'cross'].includes(t)))); if (t !== 'select') { closeCard(); } }

  /* ---------- carte « gomme » : écrire, image, supprimer ---------- */
  function closeCard() { cardEl && cardEl.remove(); cardEl = null; }
  function eraserCard(pg, a) {
    closeCard(); const e = els.get(pg.id), node = annNode(pg.id, a.id); if (!node) return; const r = node.getBoundingClientRect(), rr = root.getBoundingClientRect(), s = sc();
    const btn = (ic, label, tip, fn) => h('button', { class: 'mpdf-cb', title: tip, 'aria-label': tip, onclick: ev => { ev.stopPropagation(); closeCard(); fn(); } }, h('span', { html: svgi(ic, 17) }), label ? h('span', {}, label) : null);
    cardEl = h('div', { class: 'mpdf-card' }, btn('<path d="M5 6h14M12 6v13M9 19h6"/>', T('Écrire', 'Write'), T('Écrire du texte ici', 'Write text here'), () => { const before = snap(), t = newAnn('text', { x: a.x + 3, y: a.y + 2, w: Math.max(60, a.w - 6), h: 16, txt: '', s: 12, f: 'helv', b: 0, i: 0, c: '#1b1b1b' }); add(pg, t, true); setTimeout(() => alive() && startEdit(pg.id, t, before, true), 30); }),
      btn(IC.photo, T('Image', 'Image'), T('Placer une image ici…', 'Place an image here…'), () => imageMenu(cardAnchor(r), [a.x + a.w / 2, a.y + a.h / 2])),
      btn('<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>', '', T('Supprimer la gomme', 'Delete eraser'), () => { const before = snap(); pg.ann = pg.ann.filter(x => x !== a); sel = null; pushUndo(before); drawAnn(pg); drawNotes(); }));
    root.append(cardEl); const cw = cardEl.offsetWidth, ch = cardEl.offsetHeight; let y = (r.bottom - rr.top) / s + 8; if (y + ch > root.clientHeight - 8) y = (r.top - rr.top) / s - ch - 8;
    cardEl.style.left = clamp((r.left + r.width / 2 - rr.left) / s - cw / 2, 8, root.clientWidth - cw - 8) + 'px'; cardEl.style.top = clamp(y, 8, root.clientHeight - ch - 8) + 'px'; void e;
  }
  const cardAnchor = r => anchorAt(r.left, r.bottom);

  /* ---------- barre de format du texte ---------- */
  function updFmt() {
    const a = selAnn(), on = !!a && a.t === 'text'; fmtEl.hidden = !on; if (!on) return;
    fmtEl.replaceChildren();
    const chg = fn => { const before = snap(); fn(a); pushUndo(before); drawAnn(pageById(sel.pg)); updFmt(); };
    const font = h('select', { 'aria-label': T('Police', 'Font'), title: T('Police', 'Font'), onchange: ev => chg(x => { x.f = ev.target.value; }) }, Object.entries(FONTS).map(([k, v]) => h('option', { value: k, selected: a.f === k }, v[0])));
    const bt = (lab, tip, fn, on) => h('button', { class: 'mpdf-fb' + (on ? ' on' : ''), title: tip, 'aria-label': tip, onclick: fn }, lab);
    fmtEl.append(font, h('span', { class: 'fsep' }), bt('−', T('Taille', 'Size'), () => chg(x => { x.s = clamp(x.s - 1, 6, 72); })), h('span', { class: 'fval', title: T('Taille', 'Size') }, a.s), bt('+', T('Taille', 'Size'), () => chg(x => { x.s = clamp(x.s + 1, 6, 72); })), h('span', { class: 'fsep' }),
      bt('B', T('Gras', 'Bold'), () => chg(x => { x.b = x.b ? 0 : 1; }), a.b), bt('I', T('Italique', 'Italic'), () => chg(x => { x.i = x.i ? 0 : 1; }), a.i));
    fmtEl.querySelectorAll('.mpdf-fb')[2].style.fontWeight = 700; fmtEl.querySelectorAll('.mpdf-fb')[3].style.fontStyle = 'italic';
  }

  /* ---------- rendu des pages ---------- */
  function mkPageEl(pg) {
    const wr = h('div', { class: 'mpdf-pg', 'data-id': pg.id }), inn = h('div', { class: 'mpdf-pin' }), c = h('div', { class: 'mpdf-pgc' }, content(pg, true, D, markDirty)), an = h('div', { class: 'mpdf-ann' });
    inn.append(c, an); wr.append(inn); els.set(pg.id, { wr, inn, c, an }); drawAnn(pg); return wr;
  }
  function drawPages() {
    if (!docEl) return; els.clear(); docEl.replaceChildren(); const cols = mode === 'two' || mode === 'twoc' ? 2 : 1;
    for (let i = 0; i < D.pages.length; i += cols) { const row = h('div', { class: 'mpdf-row' }); for (let j = i; j < Math.min(i + cols, D.pages.length); j++) row.append(mkPageEl(D.pages[j])); docEl.append(row); }
    layout(); reapplySearch();
  }
  function mini(pg, k) {
    const wr = h('div', { class: 'mpdf-pg mpdf-mini' }), inn = h('div', { class: 'mpdf-pin' }); inn.append(h('div', { class: 'mpdf-pgc' }, content(pg, false, D, () => {})), h('div', { class: 'mpdf-ann' }, pg.ann.map(annEl))); wr.append(inn); geom(wr, inn, pg, k); return wr;
  }
  const TW = 124;
  function thumbItem(pg, i) {
    const it = h('div', { class: 'mpdf-th' + (i === cur ? ' on' : ''), 'data-id': pg.id, role: 'option', 'aria-label': T(`Page ${i + 1}`, `Page ${i + 1}`) }, h('div', { class: 'mpdf-thm' }, mini(pg, TW / dim(pg).w)), h('span', { class: 'mpdf-thn' }, i + 1));
    it.addEventListener('pointerdown', ev => { if (ev.button === 0) startDrag(ev, { type: 'page', idx: i, pg }); });
    it.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); pageMenu(ev.clientX, ev.clientY, i); });
    return it;
  }
  function drawThumbs() { if (!thumbsEl) return; thumbsEl.replaceChildren(...D.pages.map(thumbItem)); }
  function updThumb(id) { if (!thumbsEl) return; const it = thumbsEl.querySelector(`[data-id="${id}"]`), pg = pageById(id); if (!it || !pg) return; it.querySelector('.mpdf-thm').replaceChildren(mini(pg, TW / dim(pg).w)); }
  function markThumbs() { if (!thumbsEl) return; [...thumbsEl.children].forEach((t, i) => t.classList.toggle('on', i === cur)); const t = thumbsEl.children[cur]; if (t && pagesOn) { const r = t.getBoundingClientRect(), s = thumbsEl.getBoundingClientRect(); if (r.top < s.top || r.bottom > s.bottom) thumbsEl.scrollTop += (r.top - s.top) / sc() - 20; } }
  function drawOutline() {
    if (!outlineEl) return; const T2 = KIND_TITLE(), seen = new Set(), rows = [];
    D.pages.forEach((p, i) => { if (!seen.has(p.kind) && T2[p.kind]) { seen.add(p.kind); rows.push([T2[p.kind], i]); } });
    outlineEl.replaceChildren(...(rows.length ? rows.map(([t, i]) => h('button', { class: 'mpdf-ol', onclick: () => { sfx.tick(); goTo(i, true); } }, h('span', {}, t), h('em', {}, i + 1))) : [h('p', { class: 'mpdf-empty' }, T('Pas de sommaire dans ce document.', 'This document has no outline.'))]));
  }
  function drawNotes() {
    if (!notesList) return; const rows = [];
    D.pages.forEach((pg, i) => pg.ann.forEach(a => { if (['hl', 'ul', 'st', 'note', 'text'].includes(a.t)) rows.push({ pg, a, i }); }));
    notesList.replaceChildren(...(rows.length ? rows.map(({ pg, a, i }) => h('div', { class: 'mpdf-nr' + (sel && sel.id === a.id ? ' on' : ''), onclick: () => { goTo(i, true); setSel(pg.id, a.id); drawNotes(); } },
      h('div', { class: 'nh' }, h('b', {}, kindName(a)), h('span', {}, T(`p. ${i + 1}`, `p. ${i + 1}`))), h('p', {}, a.txt || '—'),
      h('div', { class: 'na' }, (a.t === 'note' || a.t === 'text') ? h('button', { class: 'mpdf-lk', onclick: async ev => { ev.stopPropagation(); if (a.t === 'note') { const t = await askNote(a.txt); if (t != null && alive()) { const before = snap(); a.txt = t; pushUndo(before); drawAnn(pg); drawNotes(); } } else { goTo(i, true); setSel(pg.id, a.id); setTimeout(() => startEdit(pg.id, a), 40); } } }, T('Modifier le texte…', 'Edit Text…')) : null,
        h('button', { class: 'mpdf-lk dg', onclick: ev => { ev.stopPropagation(); const before = snap(); pg.ann = pg.ann.filter(x => x !== a); if (sel && sel.id === a.id) sel = null; pushUndo(before); drawAnn(pg); drawNotes(); updFmt(); } }, T('Supprimer', 'Delete'))))) : [h('p', { class: 'mpdf-empty' }, T('Aucune note. Surlignez du texte ou ajoutez une note.', 'No notes. Highlight text or add a note.'))]));
  }
  function refresh() { drawPages(); drawThumbs(); drawOutline(); drawNotes(); updFmt(); markThumbs(); }

  /* ---------- glisser-déposer (pages, fichiers d'exemple) ---------- */
  function startDrag(e, spec) {
    if (e.button !== 0) return; const sx = e.clientX, sy = e.clientY; let ghost = null, on = false, tgt = null;
    const stage = $('#stage'), toSt = (cx, cy) => { const b = stage.getBoundingClientRect(); return [(cx - b.left) / sc(), (cy - b.top) / sc()]; };
    const clear = () => { root.querySelectorAll('.ins-b,.ins-a,.mpdf-drop').forEach(n => n.classList.remove('ins-b', 'ins-a', 'mpdf-drop')); };
    const mv = ev => {
      if (!on) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; on = true; getSelection().removeAllRanges();
        ghost = spec.type === 'page' ? h('div', { class: 'mpdf-ghost' }, h('div', { class: 'mpdf-thm' }, mini(spec.pg, TW * .7 / dim(spec.pg).w)), h('span', {}, spec.idx + 1)) : h('div', { class: 'mpdf-ghost file' }, h('span', { html: svgi(spec.f === 'pdf' ? '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>' : IC.photo, 18) }), h('span', {}, spec.name));
        $('#layer').append(ghost); root.classList.add('mpdf-dnd'); }
      const [gx, gy] = toSt(ev.clientX, ev.clientY); ghost.style.left = gx + 8 + 'px'; ghost.style.top = gy + 8 + 'px';
      clear(); tgt = null; const el = document.elementFromPoint(ev.clientX, ev.clientY), th = el && el.closest && el.closest('.mpdf-th'), pgEl = el && el.closest && el.closest('.mpdf-pg:not(.mpdf-mini)');
      if (th && thumbsEl.contains(th)) { const r = th.getBoundingClientRect(), i = [...thumbsEl.children].indexOf(th), after = ev.clientY > r.top + r.height / 2; th.classList.add(after ? 'ins-a' : 'ins-b'); tgt = { list: true, at: after ? i + 1 : i }; }
      else if (el && pagesDr.contains(el) && thumbsEl.contains(el)) { tgt = { list: true, at: D.pages.length }; thumbsEl.lastElementChild && thumbsEl.lastElementChild.classList.add('ins-a'); }
      else if (pgEl && spec.type === 'file') { pgEl.classList.add('mpdf-drop'); tgt = { page: pgEl.dataset.id }; }
    };
    const up = ev => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('keydown', esc, true);
      if (!on) return; ghost.remove(); clear(); root.classList.remove('mpdf-dnd');
      if (!tgt) return;
      if (spec.type === 'page' && tgt.list) { if (ev.altKey) { const src = spec.pg; act(() => { const np = { ...JSON.parse(JSON.stringify(src)), id: nid('p'), ann: src.ann.map(cloneAnn) }; Object.keys(D.form).filter(k => k.startsWith(src.id + ':')).forEach(k => { D.form[np.id + k.slice(src.id.length)] = D.form[k]; }); D.pages.splice(tgt.at, 0, np); }, tgt.at); } else movePage(spec.idx, tgt.at); sfx.pop(); }
      else if (spec.type === 'file' && tgt.list) { insertFile(spec.f, tgt.at); sfx.pop(); }
      else if (spec.type === 'file' && tgt.page) dropMenu(ev.clientX, ev.clientY, spec.f, pageById(tgt.page));
    };
    const esc = ev => { if (ev.key === 'Escape') { tgt = null; up(ev); } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('keydown', esc, true);
  }

  /* ---------- barre d'outils, panneaux ---------- */
  const tb = (ic, label, tip, fn, key) => { const b = h('button', { class: 'mpdf-tb', title: tip, 'aria-label': tip, onclick: fn }, h('span', { class: 'ti', html: svgi(IC[ic], 18) }), h('span', { class: 'tx' }, label)); key && toolBtns.set(key, b); return b; };
  function setBar(v, anim = true) {
    clearTimeout(hideT); if (v === barOn) return; barOn = v; barEl.classList.toggle('on', v); root.classList.toggle('bar-on', v); void anim;
    const tl = root.querySelector('.mpdf-tl'); tl && tl.classList.toggle('on', v); if (!v) { searchIn && searchIn.blur(); }
  }
  const scheduleHide = ms => { clearTimeout(hideT); hideT = setTimeout(() => { if (!alive() || !barOn || menuOpen || searching || (searchIn && document.activeElement === searchIn)) return; setBar(false); }, ms); };
  function onMove(e) {
    if (panning) return; const r = root.getBoundingClientRect(), y = (e.clientY - r.top) / sc();
    if (y <= 44) { if (!barOn) setBar(true); else clearTimeout(hideT); } else if (barOn && y > 60) scheduleHide(1100);
  }
  function setPages(v) { pagesOn = v; if (v) notesOn = false; root.classList.toggle('pages-on', pagesOn); root.classList.toggle('notes-on', notesOn); if (v) { markThumbs(); const t = thumbsEl.children[cur]; t && (thumbsEl.scrollTop = Math.max(0, t.offsetTop - 40)); } }
  function setNotes(v) { notesOn = v; if (v) { pagesOn = false; drawNotes(); } root.classList.toggle('pages-on', pagesOn); root.classList.toggle('notes-on', notesOn); }
  function setSide(s) { side = s; buildBar(); applySide(); fitBar(); }
  function applySide() { pagesDr.classList.toggle('right', side === 'right'); notesDr.classList.toggle('right', side !== 'right'); }
  function displayMenu(anchor) {
    lock(); macMenu(anchor, [{ l: T('Agrandir', 'Zoom In'), k: '⌘+', fn: () => zoomBy(1.25) }, { l: T('Réduire', 'Zoom Out'), k: '⌘−', fn: () => zoomBy(.8) }, { l: T('Ajuster à la largeur', 'Fit Width'), k: '⌘9', fn: () => { fit = 'width'; layout(); } }, { l: T('Ajuster à la page', 'Fit Page'), k: '⌘8', fn: () => { fit = 'page'; layout(); } }, { sep: 1 },
      ...[['single', T('Une page', 'Single Page')], ['cont', T('Défilement continu', 'Continuous Scroll')], ['two', T('Deux pages', 'Two Pages')], ['twoc', T('Deux pages en continu', 'Two Pages Continuous')]].map(([m, l]) => ({ l, check: mode === m, fn: () => setMode(m) })), { sep: 1 },
      { l: T('Pages à gauche', 'Pages on Left'), check: side === 'left', fn: () => setSide('left') }, { l: T('Pages à droite', 'Pages on Right'), check: side === 'right', fn: () => setSide('right') }], { onclose: unlock });
  }
  function toolsMenu(anchor) { lock(); macMenu(anchor, ['hand', 'underline', 'strike', 'note', 'rect', 'ellipse', 'arrow', 'cross'].map(t => ({ l: tname(t).replace(/ \(.*/, ''), check: tool === t, fn: () => { setTool(t); sfx.tick(); } })), { onclose: unlock }); }
  function buildBar() {
    toolBtns = new Map(); barItems = []; const old = barEl;
    const tt = k => tb({ select: 'select', text: 'text', whiteout: 'eraser', check: 'check', highlight: 'hl', pen: 'pen' }[k], { select: T('Sélection', 'Select'), text: T('Texte', 'Text'), whiteout: T('Gomme', 'Eraser'), check: T('Coche', 'Check'), highlight: T('Surligner', 'Highlight'), pen: T('Stylo', 'Pen') }[k], tname(k), () => { setTool(k); sfx.tick(); }, k);
    const pagesBtn = tb(side === 'right' ? 'sideR' : 'sideL', T('Pages', 'Pages'), T('Panneau des pages', 'Pages Panel'), () => { sfx.tick(); setPages(!pagesOn); }), notesBtn = tb(side === 'right' ? 'sideL' : 'sideR', T('Notes', 'Notes'), T('Panneau des notes', 'Notes Panel'), () => { sfx.tick(); setNotes(!notesOn); });
    const imgBtn = tb('photo', T('Image', 'Image'), T('Insérer une image…', 'Insert Image…'), () => imageMenu(imgBtn)), moreBtn = tb('more', T('Formes', 'Shapes'), T('Plus d’outils', 'More Tools'), () => toolsMenu(moreBtn), 'more'), dispBtn = tb('disp', T('Affichage', 'Display'), T('Affichage', 'Display'), () => displayMenu(dispBtn));
    const grp = (...b) => h('div', { class: 'mpdf-grp' }, ...b), dv = () => h('i', { class: 'mpdf-dv' });
    const nav = grp(tt('select')), edit = grp(tt('text'), tt('whiteout'), imgBtn), ann = grp(tt('check'), tt('highlight'), tt('pen'), moreBtn), d1 = dv(), d2 = dv(), d3 = dv(), flex = h('i', { class: 'mpdf-flex' });
    searchIn = h('input', { class: 'mpdf-find', type: 'search', placeholder: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), spellcheck: 'false', value: q });
    const sbtn = h('button', { class: 'mpdf-tb mpdf-sbtn', title: T('Rechercher', 'Search'), 'aria-label': T('Rechercher', 'Search'), onclick: () => { searching = true; barEl.classList.add('searching'); fitBar(); searchIn.focus(); } }, h('span', { class: 'ti', html: svgi(IC.search, 18) }), h('span', { class: 'tx' }, T('Rechercher', 'Search')));
    const field = h('div', { class: 'mpdf-sf' }, searchIn);
    let deb = 0; searchIn.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => alive() && runSearch(searchIn.value), 260); });
    searchIn.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { clearTimeout(deb); if (searchIn.value.trim() === q && hits.length) stepHit(ev.shiftKey ? -1 : 1); else runSearch(searchIn.value); } else if (ev.key === 'Escape') { searchIn.value = ''; runSearch(''); searchIn.blur(); } });
    searchIn.addEventListener('search', () => { if (!searchIn.value) runSearch(''); });
    searchIn.addEventListener('blur', () => { if (!searchIn.value) { searching = false; barEl.classList.remove('searching'); fitBar(); } scheduleHide(1100); });
    const items = side === 'right' ? [[notesBtn, 1000], [d1, 800], [nav, 800], [d2, 800], [edit, 950], [d3, 700], [ann, 700], [flex, 100], [dispBtn, 600], [field, 900], [sbtn, 900], [pagesBtn, 1000]] : [[pagesBtn, 1000], [d1, 800], [nav, 800], [d2, 800], [edit, 950], [d3, 700], [ann, 700], [flex, 100], [dispBtn, 600], [field, 900], [sbtn, 900], [notesBtn, 1000]];
    barRow = h('div', { class: 'mpdf-row-bar' }, items.map(i => i[0])); barItems = items.map(([el, pr]) => ({ el, pr }));
    const bar = h('div', { class: 'mpdf-bar' + (barOn ? ' on' : ''), 'data-drag': '' }, barRow, h('i', { class: 'mpdf-hair' })); bar.classList.toggle('searching', searching);
    if (old) old.replaceWith(bar); barEl = bar; setTool(tool); return bar;
  }
  function fitBar() {
    if (!barRow || !alive()) return; const compact = root.clientWidth < 700; barEl.classList.toggle('compact', compact);
    barItems.forEach(i => { i.el.hidden = false; });
    const isCompactSearch = compact; barItems.forEach(i => { if (i.el.classList.contains('mpdf-sf')) i.el.hidden = isCompactSearch && !searching; if (i.el.classList.contains('mpdf-sbtn')) i.el.hidden = !isCompactSearch || searching; });
    if (compact && searching) { barItems.forEach(i => { if (i.pr < 900 && !i.el.classList.contains('mpdf-flex')) i.el.hidden = true; }); return; }
    const avail = barRow.clientWidth, gapW = parseFloat(getComputedStyle(barRow).columnGap) || 8, total = () => { const vis = barItems.filter(i => !i.el.hidden && i.el.offsetWidth > 0 && !i.el.classList.contains('mpdf-flex')); return vis.reduce((s, i) => s + i.el.offsetWidth, 0) + vis.length * gapW; };
    const order = [...barItems].filter(i => !i.el.hidden && !i.el.classList.contains('mpdf-flex')).sort((a, b) => a.pr - b.pr);
    for (const i of order) { if (total() <= avail) break; i.el.hidden = true; }
  }

  /* ---------- menu de l'appli (clic droit) ---------- */
  function mainMenu(x, y) {
    const clampY = Math.min(y, $('#stage').getBoundingClientRect().bottom - 330 * sc()), a = anchorAt(x, clampY), P = curPage();
    const tools = ['select', 'hand', 'highlight', 'underline', 'strike', 'note', 'text', 'pen', 'rect', 'ellipse', 'arrow', 'whiteout', 'check', 'cross'];
    const items = [{ l: T('À propos de mPDF', 'About mPDF'), fn: showAbout }, { sep: 1 }, { l: T('Réglages…', 'Settings…'), k: '⌘,', fn: () => showSettings() }, { l: T('Rechercher les mises à jour…', 'Check for Updates…'), fn: checkUpdates }, { sep: 1 },
      { l: T('Fichier', 'File'), sub: [{ l: T('Enregistrer', 'Save'), k: '⌘S', fn: save }, { l: T('Imprimer…', 'Print…'), k: '⌘P', fn: () => toast({ icon: icon(app.id), title: app.id, body: T('Démo : l’impression n’est pas disponible ici.', 'Demo: printing is not available here.') }) }, { sep: 1 }, { l: T('Fermer', 'Close'), k: '⌘W', fn: () => wm.close(w.id) }] },
      { l: T('Édition', 'Edit'), sub: [{ l: T('Annuler', 'Undo'), k: '⌘Z', dis: !undo.length, fn: doUndo }, { l: T('Rétablir', 'Redo'), k: '⇧⌘Z', dis: !redo.length, fn: doRedo }, { sep: 1 }, { l: T('Rechercher', 'Find'), k: '⌘F', fn: focusSearch }, { l: T('Résultat suivant', 'Find Next'), k: '⌘G', fn: () => stepHit(1) }, { l: T('Résultat précédent', 'Find Previous'), k: '⇧⌘G', fn: () => stepHit(-1) }] },
      { l: T('Présentation', 'View'), sub: [{ l: T('Afficher / masquer la barre d’outils', 'Show / Hide Toolbar'), k: '⌥⌘T', fn: () => setBar(!barOn) }, { l: T('Panneau des pages', 'Pages Panel'), k: '⌃⌘S', check: pagesOn, fn: () => setPages(!pagesOn) }, { l: T('Pages à gauche', 'Pages on Left'), check: side === 'left', fn: () => setSide('left') }, { l: T('Pages à droite', 'Pages on Right'), check: side === 'right', fn: () => setSide('right') }, { l: T('Panneau des notes', 'Notes Panel'), k: '⌥⌘N', check: notesOn, fn: () => setNotes(!notesOn) }, { sep: 1 },
        { l: T('Agrandir', 'Zoom In'), k: '⌘+', fn: () => zoomBy(1.25) }, { l: T('Réduire', 'Zoom Out'), k: '⌘−', fn: () => zoomBy(.8) }, { l: T('Taille réelle', 'Actual Size'), k: '⌘0', fn: () => { fit = null; kMan = 1.333; layout(); } }, { l: T('Ajuster à la largeur', 'Fit Width'), k: '⌘9', fn: () => { fit = 'width'; layout(); } }, { l: T('Ajuster à la page', 'Fit Page'), k: '⌘8', fn: () => { fit = 'page'; layout(); } }, { sep: 1 },
        ...[['single', T('Une page', 'Single Page')], ['cont', T('Défilement continu', 'Continuous Scroll')], ['two', T('Deux pages', 'Two Pages')], ['twoc', T('Deux pages en continu', 'Two Pages Continuous')]].map(([m, l]) => ({ l, check: mode === m, fn: () => setMode(m) })), { sep: 1 },
        { l: T('Pivoter à gauche', 'Rotate Left'), k: '⌘L', fn: () => rotatePage(cur, -90) }, { l: T('Pivoter à droite', 'Rotate Right'), k: '⌘R', fn: () => rotatePage(cur, 90) }, { sep: 1 }, { l: T('Plein écran', 'Full Screen'), k: '⌃⌘F', fn: () => wm.toggleMax(w.id) }, { l: T('Présentation plein écran', 'Presentation Mode'), k: '⌥⌘P', fn: startPresent }] },
      { l: T('Outils', 'Tools'), sub: tools.map(t => ({ l: tname(t).replace(/ \(.*/, ''), check: tool === t, fn: () => setTool(t) })) },
      { l: T('Pages', 'Pages'), sub: [{ l: T('Insérer une image…', 'Insert Image…'), k: '⇧⌘I', sub: Object.entries(IMGS).map(([k, im]) => ({ l: im.name, fn: () => placeImage(k, P) })) }, { l: T('Insérer des pages depuis un fichier…', 'Insert Pages from File…'), k: '⌥⌘O', fn: () => insertFile('pdf', cur + 1) }, { sep: 1 },
        { l: T('Insérer une page vierge', 'Insert Blank Page'), k: '⇧⌘N', fn: () => blankAfter(cur) }, { l: T('Dupliquer la page', 'Duplicate Page'), k: '⇧⌘D', fn: () => duplicatePage(cur) }, { l: T('Supprimer la page', 'Delete Page'), k: '⌘⌫', fn: () => removePage(cur) }] },
      { l: T('Aller', 'Go'), sub: [{ l: T('Page suivante', 'Next Page'), k: '⌥⌘]', fn: () => goTo(cur + 1, true) }, { l: T('Page précédente', 'Previous Page'), k: '⌥⌘[', fn: () => goTo(cur - 1, true) }, { l: T('Première page', 'First Page'), fn: () => goTo(0, true) }, { l: T('Dernière page', 'Last Page'), fn: () => goTo(D.pages.length - 1, true) }, { sep: 1 }, { l: T('Aller à la page…', 'Go to Page…'), k: '⌥⌘G', fn: gotoDialog }] },
      { sep: 1 }, { l: T('Quitter mPDF', 'Quit mPDF'), k: '⌘Q', fn: () => wm.close(w.id) }];
    lock(); macMenu(a, items, { onclose: () => { a.remove(); unlock(); } });
  }
  async function gotoDialog() { const r = await macAlert({ app, title: T('Aller à la page', 'Go to Page'), text: T(`Numéro de page (1 à ${D.pages.length})`, `Page number (1 to ${D.pages.length})`), buttons: [T('OK', 'OK'), T('Annuler', 'Cancel')], cancel: 1, field: { value: String(cur + 1) } }); if (r.i === 0) { const n = parseInt(r.value, 10); if (n >= 1 && n <= D.pages.length) goTo(n - 1, true); } }
  const save = () => { dirty = false; sfx.done(); toast({ icon: icon(app.id), title: app.id, body: T('Enregistré (démonstration : aucun fichier n’est écrit).', 'Saved (demo: no file is written).') }); };
  const checkUpdates = () => macAlert({ app, title: T('mPDF est à jour.', 'mPDF is up to date.'), text: T('Vous utilisez la dernière version (1.1.8).', 'You have the latest version (1.1.8).') });
  const focusSearch = () => { setBar(true); searching = true; barEl.classList.add('searching'); fitBar(); searchIn.focus(); searchIn.select(); };
  function showAbout() { aboutWin(app, { h: 440, version: () => T('Version 1.1.8', 'Version 1.1.8'), lines: () => [[T('Lecteur PDF rapide et léger pour macOS.', 'A fast, lightweight PDF reader for macOS.')], [T('Starbudweiser & Claude Code (Anthropic)', 'Starbudweiser & Claude Code (Anthropic)')], [T('Licence MIT. © 2026 Starbudweiser.', 'MIT License. © 2026 Starbudweiser.'), 'mut'], [T('Fourni en l’état, sans garantie.', 'Provided as is, without warranty.'), 'mut'], [T('DESKTOP MAC TOOLKIT', 'DESKTOP MAC TOOLKIT'), 'mut']] }); }
  function showSettings() {
    wm.open({ id: 'mpdf-settings', appId: app.id, title: T('Réglages', 'Settings'), w: 420, h: 250, x: 560, y: 140, resizable: false, bare: true, cls: 'socle mpdf-setw', build: ww => {
      const draw = () => { const cbx = (label, on) => { const b = h('button', { class: 'mpdf-sc' + (on ? ' on' : ''), role: 'checkbox', 'aria-checked': on, onclick: () => { b.classList.toggle('on'); b.setAttribute('aria-checked', b.classList.contains('on')); sfx.tick(); } }, h('i', {}, on ? '✓' : ''), h('span', {}, label)); b.addEventListener('click', () => { b.firstChild.textContent = b.classList.contains('on') ? '✓' : ''; }); return b; };
        return h('div', { class: 'mpdf-set' }, h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(ww), h('b', {}, T('Réglages', 'Settings'))), h('div', { class: 'mpdf-setb' }, cbx(T('Installer automatiquement les mises à jour', 'Install updates automatically'), true), cbx(T('Détourer automatiquement les images importées', 'Automatically remove the background of imported images'), false),
          h('div', {}, h('button', { class: 'sbtn', onclick: checkUpdates }, T('Rechercher les mises à jour', 'Check for Updates'))), h('p', { class: 'mut' }, T('Version 1.1.8', 'Version 1.1.8')))); };
      ww.render = () => { ww.body.replaceChildren(draw()); }; return draw(); } });
  }
  /* présentation plein écran */
  function startPresent() {
    let i = cur; presentEl && presentEl.remove(); closeCard();
    const el = h('div', { class: 'mpdf-present', tabindex: '0' }); presentEl = el;
    const draw = () => { el.replaceChildren(); const pg = D.pages[i], d = dim(pg), k = Math.min(root.clientWidth / d.w, root.clientHeight / d.h); el.append(mini(pg, k)); };
    const nav = d => { i = clamp(i + d, 0, D.pages.length - 1); draw(); sfx.tick(); };
    const end = () => { el.remove(); presentEl = null; cur = i; goTo(i); root.focus({ preventScroll: true }); };
    el.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') end(); else if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); nav(1); } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(ev.key)) { ev.preventDefault(); nav(-1); } });
    el.addEventListener('click', ev => nav(ev.offsetX > el.clientWidth / 2 || true ? 1 : -1)); el.addEventListener('contextmenu', ev => { ev.preventDefault(); end(); });
    root.append(el); draw(); el.focus();
  }

  /* ---------- clavier ---------- */
  function onKey(e) {
    const t = e.target; if (t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) { if (e.key === 'Escape' && t.isContentEditable) { e.preventDefault(); t.blur(); } return; }
    const m = e.metaKey || e.ctrlKey, k = e.key, c = e.code;
    if (m && c === 'KeyZ') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
    else if (m && c === 'KeyF' && !e.altKey && !e.ctrlKey) { e.preventDefault(); focusSearch(); }
    else if (m && c === 'KeyF' && e.ctrlKey && e.metaKey) { e.preventDefault(); wm.toggleMax(w.id); }
    else if (m && c === 'KeyG') { e.preventDefault(); if (e.altKey) gotoDialog(); else stepHit(e.shiftKey ? -1 : 1); }
    else if (m && c === 'KeyS' && !e.ctrlKey) { e.preventDefault(); save(); }
    else if (m && c === 'KeyS' && e.ctrlKey && e.metaKey) { e.preventDefault(); setPages(!pagesOn); }
    else if (m && e.altKey && c === 'KeyT') { e.preventDefault(); setBar(!barOn); if (barOn) scheduleHide(2400); }
    else if (m && e.altKey && c === 'KeyN') { e.preventDefault(); setNotes(!notesOn); }
    else if (m && e.altKey && c === 'KeyP') { e.preventDefault(); startPresent(); }
    else if (m && e.shiftKey && c === 'KeyN') { e.preventDefault(); blankAfter(cur); }
    else if (m && e.shiftKey && c === 'KeyD') { e.preventDefault(); duplicatePage(cur); }
    else if (m && e.shiftKey && c === 'KeyI') { e.preventDefault(); imageMenu(barEl.querySelector('.mpdf-tb')); }
    else if (m && (k === '+' || k === '=')) { e.preventDefault(); zoomBy(1.25); }
    else if (m && k === '-') { e.preventDefault(); zoomBy(.8); }
    else if (m && k === '0') { e.preventDefault(); fit = null; kMan = 1.333; layout(); }
    else if (m && k === '9') { e.preventDefault(); fit = 'width'; layout(); }
    else if (m && k === '8') { e.preventDefault(); fit = 'page'; layout(); }
    else if (m && c === 'KeyL') { e.preventDefault(); rotatePage(cur, -90); }
    else if (m && c === 'KeyR') { e.preventDefault(); rotatePage(cur, 90); }
    else if (m && k === 'Backspace') { e.preventDefault(); removePage(cur); }
    else if (m && c === 'Comma') { e.preventDefault(); showSettings(); }
    else if (m && c === 'KeyW') { e.preventDefault(); wm.close(w.id); }
    else if (!m && (k === 'Delete' || k === 'Backspace')) { const a = selAnn(); if (a) { e.preventDefault(); const pg = pageById(sel.pg), before = snap(); pg.ann = pg.ann.filter(x => x !== a); sel = null; pushUndo(before); drawAnn(pg); drawNotes(); updFmt(); sfx.tick(); } }
    else if (k === 'Escape') { if (sel) setSel(null); else if (tool !== 'select') setTool('select'); closeCard(); }
    else if (!m && (mode === 'single' || mode === 'two')) { if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); goTo(cur + (mode === 'two' ? 2 : 1)); } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); goTo(cur - (mode === 'two' ? 2 : 1)); } }
    else if (!m) { const H0 = scroll.clientHeight; if (k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); scroll.scrollBy({ top: H0 - 40 }); } else if (k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); scroll.scrollBy({ top: -(H0 - 40) }); } else if (k === 'ArrowDown') { e.preventDefault(); scroll.scrollBy({ top: 60 }); } else if (k === 'ArrowUp') { e.preventDefault(); scroll.scrollBy({ top: -60 }); } else if (k === 'Home') { e.preventDefault(); goTo(0, true); } else if (k === 'End') { e.preventDefault(); goTo(D.pages.length - 1, true); } }
  }

  const gk = e => { if (!alive() || S.active !== w || presentEl || menuOpen || document.querySelector('.mdesk-alert')) return; onKey(e); };
  document.addEventListener('keydown', gk, true);

  /* ---------- souris sur les pages ---------- */
  function onDown(e) {
    if (e.button !== 0) return; const t = e.target; if (!t.closest) return;
    if (t.closest('.mpdf-bar,.mpdf-dr,.mpdf-fmt,.mpdf-card,.mpdf-present')) return; closeCard();
    const wr = t.closest('.mpdf-pg'); if (!wr) return;
    const id = wr.dataset.id, pg = pageById(id); if (!pg) return;
    if (!t.closest('input,textarea,select,[contenteditable="true"]')) root.focus({ preventScroll: true });
    if (t.closest('input,textarea,select,[contenteditable="true"]')) return;
    const hd = t.closest('.mpdf-hd'); if (hd) { const a = selAnn(); if (a) { e.preventDefault(); startResize(e, id, a, hd.dataset.d); return; } }
    const an = t.closest('.an');
    if (an && (tool === 'select' || tool === 'text')) { const a = pg.ann.find(x => x.id === an.dataset.a); if (a) { e.preventDefault(); if (!sel || sel.id !== a.id) { setSel(id, a.id); drawNotes(); } if (tool === 'text' && a.t === 'text') { setTimeout(() => alive() && startEdit(id, a), 30); return; } startMove(e, id, a); return; } }
    if (tool === 'select') { if (sel) setSel(null); drawNotes(); return; }
    if (MARK.has(tool)) { if (sel) setSel(null); return; }
    e.preventDefault(); if (sel) setSel(null); startTool(e, pg);
  }
  function onDbl(e) {
    const an = e.target.closest && e.target.closest('.an'), wr = e.target.closest && e.target.closest('.mpdf-pg'); if (!an || !wr) return; const pg = pageById(wr.dataset.id), a = pg.ann.find(x => x.id === an.dataset.a); if (!a) return;
    if (a.t === 'text') setTimeout(() => startEdit(pg.id, a), 20); else if (a.t === 'wo') eraserCard(pg, a);
    else if (a.t === 'note') askNote(a.txt).then(t => { if (t != null && alive()) { const before = snap(); a.txt = t; pushUndo(before); drawAnn(pg); drawNotes(); } });
  }

  /* ---------- construction de l'interface ---------- */
  function ui() {
    root = h('div', { class: 'mpdf-root mpdf-t-' + tool + (pagesOn ? ' pages-on' : '') + (notesOn ? ' notes-on' : ''), tabindex: '-1' });
    scroll = h('div', { class: 'mpdf-scroll' }); docEl = h('div', { class: 'mpdf-doc' }); scroll.append(docEl);
    hudEl = h('div', { class: 'mpdf-hud', 'aria-live': 'polite' }); fmtEl = h('div', { class: 'mpdf-fmt', hidden: true });
    thumbsEl = h('div', { class: 'mpdf-thumbs', role: 'listbox' }); outlineEl = h('div', { class: 'mpdf-outline' }); notesList = h('div', { class: 'mpdf-nl' });
    const tabs = h('div', { class: 'mpdf-seg' }, [['thumbs', T('Pages', 'Pages')], ['outline', T('Sommaire', 'Outline')]].map(([k, l]) => h('button', { class: tab === k ? 'on' : '', 'aria-pressed': tab === k, onclick: () => { tab = k; sfx.tick(); tabs.querySelectorAll('button').forEach((b, i) => { const on = ['thumbs', 'outline'][i] === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); pagesDr.classList.toggle('t-outline', tab === 'outline'); } }, l)));
    const files = h('div', { class: 'mpdf-files' }, h('p', {}, T('Fichiers d’exemple à glisser entre deux pages, ou sur une page :', 'Sample files to drag between two pages, or onto a page:')), h('div', {}, [['pdf', 'Annexe.pdf'], ['img', 'Photo.jpg']].map(([f, n]) => { const c = h('div', { class: 'mpdf-chip', title: n }, h('span', { html: svgi(f === 'pdf' ? '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>' : IC.photo, 16) }), h('span', {}, n)); c.addEventListener('pointerdown', ev => { ev.preventDefault(); startDrag(ev, { type: 'file', f, name: n }); }); return c; })));
    pagesDr = h('aside', { class: 'mpdf-dr mpdf-pages' + (tab === 'outline' ? ' t-outline' : '') + (side === 'right' ? ' right' : ''), 'aria-label': T('Panneau des pages', 'Pages Panel') }, tabs, thumbsEl, outlineEl, files);
    notesDr = h('aside', { class: 'mpdf-dr mpdf-notes' + (side === 'right' ? '' : ' right'), 'aria-label': T('Panneau des notes', 'Notes Panel') }, h('h4', {}, T('Notes', 'Notes')), notesList);
    barEl = null; buildBar();
    const tl = h('div', { class: 'mpdf-tl' + (barOn ? ' on' : ''), 'data-nodrag': '' }, wm.lights(w));
    root.append(scroll, hudEl, fmtEl, pagesDr, notesDr, barEl, tl);
    root.addEventListener('pointerdown', onDown); root.addEventListener('dblclick', onDbl);
    root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', () => barOn && scheduleHide(900));
    root.addEventListener('pointerup', () => { if (MARK.has(tool)) setTimeout(() => alive() && markSelection(), 0); });
    scroll.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('contextmenu', ev => { ev.preventDefault(); if (ev.target.closest('.mpdf-th')) return; mainMenu(ev.clientX, ev.clientY); });
    root.addEventListener('wheel', ev => { if (ev.ctrlKey) { ev.preventDefault(); zoomBy(ev.deltaY < 0 ? 1.1 : .9); } }, { passive: false });
    ro && ro.disconnect(); ro = new ResizeObserver(() => { if (!alive()) return; layout(); fitBar(); }); ro.observe(root);
    w.stop = () => { document.removeEventListener('keydown', gk, true); ro && ro.disconnect(); clearTimeout(hideT); clearTimeout(hudT); presentEl && presentEl.remove(); };
    return root;
  }
  /* la barre de défilement et les panneaux suivent la fenêtre ; premier affichage : la barre se montre un instant, puis se range */
  w.render = () => { const keepScroll = scroll ? scroll.scrollTop : 0; closeCard(); w.body.replaceChildren(ui()); drawPages(); drawThumbs(); drawOutline(); drawNotes(); updFmt(); applySide(); setTool(tool); fitBar(); scroll.scrollTop = keepScroll; markThumbs(); if (q) runSearch(q, true); };
  const r0 = ui();
  requestAnimationFrame(() => { if (!alive()) return; drawPages(); drawThumbs(); drawOutline(); drawNotes(); applySide(); setTool('select'); fitBar(); setBar(true); scheduleHide(2400); hud(T('Pointeur en haut : barre d’outils · clic droit : menus de l’appli', 'Pointer at the top: toolbar · right-click: app menus'), false, 5000); root.focus({ preventScroll: true }); });
  return r0;
}
