/* HORIZONs : réplique interactive de l'appli (Socle sombre), recherche de logement en location.
   Écrans : Annonces (retenues / à vérifier / écartées, avec la raison du verdict), Portails, Suivi (étapes, relances, notes),
   Critères (Indispensable / Souhaité / Indifférent, effet immédiat sur les annonces), Dossier (pièces par personne, PDF filigrané,
   vérification d'une demande de bailleur), Réglages (dont la version de démonstration et l'activation complète).
   Version de démonstration limitée, activation complète payante : signalée discrètement (pastille de la barre latérale et Réglages).
   Données d'exemple entièrement fictives ; aucun réseau, aucune lecture ni envoi réel. */
import { h, brand, wait, toast, icon, sfx, wm, T, css, stream } from './kit.js';

const ID = 'HORIZONs', HC = '#f59e0b', VERSION = '1.1.0';
const LG = () => T('fr-FR', 'en-US');
const bn = () => brand(ID, HC);
const nf = n => (n == null ? '—' : n.toLocaleString(LG()));
const eur = n => nf(n) + ' €';
const day = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return d.getTime(); };
const sod = t => new Date(t).setHours(0, 0, 0, 0);
const fday = t => new Date(t).toLocaleDateString(LG(), { day: 'numeric', month: 'short', year: 'numeric' });
const fshort = t => new Date(t).toLocaleDateString(LG(), { day: 'numeric', month: 'short' });
const iso = t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return y ? new Date(y, m - 1, d, 12).getTime() : null; };
const E = (tag, cls, ...k) => h(tag, cls ? { class: cls } : {}, ...k);
const SV = {
  home: '<path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  list: '<path d="M4 5h16v14H4zM8 9h8M8 13h8"/>', sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/>', folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>', check: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="m8 12 3 3 5-6" stroke="#14391f" stroke-width="2.4"/>',
  xc: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M9 9l6 6M15 9l-6 6" stroke="#4a1c1c" stroke-width="2.4"/>', q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4M12 16.5h.01"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>', users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.4 0 4 1.8 4 4.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
};
const ic = (k, s = 16, c = '') => h('span', { class: 'hz-ic ' + c, html: `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SV[k]}</svg>` });

/* ---------- libellés ---------- */
const STAGES = () => [['spotted', T('Repérée', 'Spotted')], ['contacted', T('Contactée', 'Contacted')], ['visitPlanned', T('Visite prévue', 'Visit planned')], ['visited', T('Visitée', 'Visited')], ['dossierSent', T('Dossier envoyé', 'File sent')], ['accepted', T('Acceptée', 'Accepted')], ['refused', T('Refusée', 'Refused')], ['archived', T('Classée', 'Archived')]];
const stName = k => STAGES().find(s => s[0] === k)[1];
const CLOSED = ['accepted', 'refused', 'archived'];
const SRC = { seloger: 'SeLoger', leboncoin: 'LeBonCoin', pap: 'PAP', bienici: 'Bien’ici', manual: null };
const srcName = k => SRC[k] || T('Saisie manuelle', 'Added by hand');
const CITIES = ['Vence', 'Cagnes-sur-Mer', 'Saint-Laurent-du-Var', 'Villeneuve-Loubet', 'La Colle-sur-Loup', 'Tourrettes-sur-Loup', 'Nice', 'Antibes'];
const OUT = () => ({ none: T('Pas d’extérieur', 'No outdoor space'), under10: T('Extérieur de moins de 10 m²', 'Outdoor space under 10 m²'), from10to20: T('Extérieur de 10 à 20 m²', 'Outdoor space of 10 to 20 m²'), over20: T('Extérieur de plus de 20 m²', 'Outdoor space over 20 m²') });
const FLR = () => ({ ground: T('Rez-de-chaussée', 'Ground floor'), first: T('1er étage', '1st floor'), second: T('2e étage ou plus', '2nd floor or higher') });
const IMP = () => [['required', T('Indispensable', 'Must have')], ['desired', T('Souhaité', 'Wish')], ['ignored', T('Indifférent', 'Don’t care')]];
const impName = m => IMP().find(i => i[0] === m)[1];
const CNAME = () => ({ zone: T('Zone', 'Area'), rent: T('Loyer', 'Rent'), surface: T('Surface', 'Surface'), rooms: T('Pièces', 'Rooms'), furnished: T('Ameublement', 'Furnishing'), outdoor: T('Extérieur', 'Outdoor space'), floor: T('Étage', 'Floor'), parking: T('Stationnement', 'Parking'), cellar: T('Cave', 'Cellar'), fees: T('Frais d’agence', 'Agency fees'), travel: T('Trajet', 'Journey') });
const VERD = () => ({ retained: [T('Retenue', 'Retained'), 'ok'], toCheck: [T('À vérifier', 'To check'), 'wn'], rejected: [T('Écartée', 'Rejected'), 'dg'] });

/* ---------- données fictives ---------- */
function makeData() {
  let n = 0;
  const L = (src, ti, rent, ch, s, r, city, o = {}) => ({ id: ++n, src, ti, rent, ch, s, r, city, furn: false, fees: false, out: null, flr: null, elev: null, park: null, cel: null, trip: null, age: 3, seen: true, hidden: false,
    desc: T('Logement non meublé, sans frais d’agence. Disponible rapidement.', 'Unfurnished, no agency fees. Available soon.'), ...o });
  const ls = [
    L('seloger', T('Villa 4 pièces avec jardin, Vence', '4-room villa with garden, Vence'), 2150, 90, 92, 4, 'Vence', { out: 'over20', flr: 'ground', park: 1, cel: true, trip: 24, age: 0, desc: T('Villa lumineuse de 92 m² au calme, rez-de-jardin de 35 m², garage, cave. Non meublée. Disponible immédiatement.', 'Bright 92 m² villa in a quiet street, 35 m² garden level, garage, cellar. Unfurnished. Available immediately.') }),
    L('leboncoin', T('T3 avec terrasse, Cagnes-sur-Mer', '3-room flat with terrace, Cagnes-sur-Mer'), 1890, 70, 71, 3, 'Cagnes-sur-Mer', { out: 'from10to20', flr: 'first', elev: true, park: 1, cel: true, trip: 26, age: 1, desc: T('Appartement de 71 m², premier étage avec ascenseur, terrasse de 12 m², place de parking et cave.', '71 m² flat on the first floor with a lift, 12 m² terrace, parking space and cellar.') }),
    L('pap', T('T3 proche des écoles, Saint-Laurent-du-Var', '3-room flat near schools, Saint-Laurent-du-Var'), 2250, 120, 68, 3, 'Saint-Laurent-du-Var', { out: 'under10', flr: 'second', elev: true, park: 1, cel: null, trip: 19, age: 0, seen: false, desc: T('Appartement de 68 m² au 3e étage avec ascenseur, petit balcon, parking en sous-sol.', '68 m² flat on the 3rd floor with a lift, small balcony, underground parking.') }),
    L('bienici', T('Maison 4 pièces, Villeneuve-Loubet', '4-room house, Villeneuve-Loubet'), 2280, 0, null, 4, 'Villeneuve-Loubet', { age: 2, seen: false, desc: T('Maison 4 pièces dans un lotissement calme. Surface et extérieur non précisés dans l’annonce.', '4-room house in a quiet development. Surface and outdoor space are not stated in the listing.') }),
    L('seloger', T('T4 avec vue, La Colle-sur-Loup', '4-room flat with a view, La Colle-sur-Loup'), 2400, 150, 85, 4, 'La Colle-sur-Loup', { out: 'over20', flr: 'first', elev: true, park: 2, cel: true, trip: 31, age: 15, fees: true, desc: T('Appartement 4 pièces de 85 m², terrasse de 20 m², parking, cave.', '4-room 85 m² flat, 20 m² terrace, parking, cellar.') }),
    L('leboncoin', T('T2 centre ancien, Vence', '2-room flat in the old town, Vence'), 1450, 40, 58, 2, 'Vence', { out: 'none', flr: 'second', elev: false, park: 0, cel: false, trip: 22, age: 3, desc: T('Charmant deux pièces de 58 m², deuxième étage sans ascenseur.', 'Charming 58 m² two-room flat on the second floor, no lift.') }),
    L('pap', T('T3 résidence neuve, Nice', '3-room flat in a new building, Nice'), 1900, 100, 72, 3, 'Nice', { out: 'under10', flr: 'first', elev: true, park: 1, cel: true, trip: 15, age: 5, desc: T('Appartement de 72 m² en résidence neuve, balcon, parking, cave.', '72 m² flat in a new building, balcony, parking, cellar.') }),
    L('bienici', T('T3 meublé avec jardin, Tourrettes-sur-Loup', 'Furnished 3-room flat with garden, Tourrettes-sur-Loup'), 2100, 60, 70, 3, 'Tourrettes-sur-Loup', { furn: true, out: 'over20', flr: 'ground', park: 1, cel: false, trip: 28, age: 4, desc: T('Appartement meublé de 70 m² en rez-de-jardin, jardin de 25 m², parking.', 'Furnished 70 m² garden-level flat, 25 m² garden, parking.') }),
    L('seloger', T('T3 lumineux, Vence centre', 'Bright 3-room flat, central Vence'), null, 80, 70, 3, 'Vence', { out: 'under10', flr: 'second', elev: false, park: 1, cel: true, trip: 23, age: 4, desc: T('Appartement de 70 m² au 2e étage sans ascenseur, balcon de 6 m², cave. Loyer à demander à l’agence.', '70 m² flat on the 2nd floor, no lift, 6 m² balcony, cellar. Ask the agency for the rent.') }),
    L('pap', T('T3 familial, Cagnes-sur-Mer', '3-room family flat, Cagnes-sur-Mer'), 1950, 90, 66, 3, 'Cagnes-sur-Mer', { fees: true, out: 'from10to20', flr: 'first', elev: true, park: 1, cel: false, trip: 27, age: 6, desc: T('Appartement de 66 m² avec loggia de 11 m², parking. Honoraires d’agence à la charge du locataire.', '66 m² flat with an 11 m² loggia, parking. Agency fees payable by the tenant.') }),
    L('manual', T('T3 en rez-de-jardin, Vence', 'Garden-level 3-room flat, Vence'), 1980, 0, 74, 3, 'Vence', { out: 'over20', flr: 'ground', park: 1, cel: true, trip: 24, age: 0, seen: false, desc: T('T3 en rez-de-jardin à Vence, 74 m². Loyer 1 980 € charges comprises. Jardin privatif de 30 m², cave, 1 place de parking. Non meublé, sans frais d’agence. Disponible immédiatement.', 'Garden-level 3-room flat in Vence, 74 m². Rent €1,980 including charges. 30 m² private garden, cellar, 1 parking space. Unfurnished, no agency fees. Available immediately.') }),
    L('seloger', T('T3 avec jardin partagé, Tourrettes-sur-Loup', '3-room flat with shared garden, Tourrettes-sur-Loup'), 2050, 70, 70, 3, 'Tourrettes-sur-Loup', { out: 'from10to20', flr: 'first', elev: true, park: 1, cel: true, trip: 29, age: 6 }),
    L('leboncoin', T('Maison de village, La Colle-sur-Loup', 'Village house, La Colle-sur-Loup'), 2200, 0, 78, 4, 'La Colle-sur-Loup', { out: 'under10', flr: 'ground', park: 1, cel: true, trip: 30, age: 7 }),
    L('pap', T('T3 vue mer, Villeneuve-Loubet', '3-room flat with sea view, Villeneuve-Loubet'), 2180, 90, 72, 3, 'Villeneuve-Loubet', { out: 'from10to20', flr: 'second', elev: true, park: 1, cel: false, trip: 25, age: 8 }),
    L('bienici', T('T4 duplex, Vence', '4-room duplex, Vence'), 2290, 110, 88, 4, 'Vence', { out: 'from10to20', flr: 'first', elev: false, park: 2, cel: true, trip: 24, age: 9 }),
    L('seloger', T('T3 rénové, Saint-Laurent-du-Var', 'Renovated 3-room flat, Saint-Laurent-du-Var'), 2100, 80, 69, 3, 'Saint-Laurent-du-Var', { out: 'from10to20', flr: 'first', elev: true, park: 1, cel: true, trip: 20, age: 10 }),
    L('pap', T('T3 résidence calme, Cagnes-sur-Mer', '3-room flat in a quiet building, Cagnes-sur-Mer'), 1980, 90, 68, 3, 'Cagnes-sur-Mer', { out: 'from10to20', flr: 'first', elev: true, park: 1, cel: true, trip: 27, age: 11 }),
    L('leboncoin', T('T4 familial, Vence', '4-room family flat, Vence'), 2250, 100, 90, 4, 'Vence', { out: 'over20', flr: 'ground', park: 1, cel: true, trip: 25, age: 12 })];
  ls.forEach(l => { l.t = day(-l.age); });
  const A = (lid, stage, fu, notes, ev = []) => ({ lid, stage, fu: fu == null ? null : day(fu), notes, remind: fu != null, hist: [{ t: day(-8), txt: T('Ajoutée au suivi', 'Added to follow-up') }, ...ev] });
  const apps = [
    A(1, 'visitPlanned', 1, T('Visite jeudi à 17 h avec l’agence. Demander le montant du dépôt de garantie.', 'Visit on Thursday at 5 pm with the agency. Ask about the security deposit.'), [{ t: day(-4), txt: T('Contactée : message envoyé', 'Contacted: message sent') }, { t: day(-2), txt: T('Visite prévue jeudi 17 h', 'Visit planned Thursday 5 pm') }]),
    A(2, 'dossierSent', 2, T('Dossier envoyé par e-mail. Relancer sans réponse sous 3 jours.', 'File sent by e-mail. Follow up in 3 days if there is no reply.'), [{ t: day(-6), txt: T('Visitée', 'Visited') }, { t: day(-2), txt: T('Dossier envoyé (PDF)', 'File sent (PDF)') }]),
    A(9, 'contacted', 0, T('Premier message envoyé, en attente de réponse.', 'First message sent, waiting for a reply.'), [{ t: day(-1), txt: T('Contactée : message envoyé', 'Contacted: message sent') }]),
    A(3, 'spotted', null, '', []), A(4, 'visited', 4, T('Visité : jardin plus petit que prévu, à comparer.', 'Visited: smaller garden than expected, to compare.'), [{ t: day(-3), txt: T('Visitée', 'Visited') }]),
    A(10, 'refused', null, T('Frais d’agence trop élevés.', 'Agency fees too high.'), [{ t: day(-5), txt: T('Refusée', 'Refused') }]),
    A(12, 'spotted', null, '', []), A(13, 'spotted', null, '', []), A(14, 'contacted', 1, T('Message envoyé, visite possible samedi.', 'Message sent, visit possible on Saturday.'), []),
    A(15, 'visitPlanned', 3, T('Visite samedi à 10 h, demander les charges réelles.', 'Visit on Saturday at 10 am, ask for the actual charges.'), []),
    A(16, 'visited', 5, T('Belle luminosité, parking à vérifier.', 'Very bright, parking to check.'), []), A(17, 'dossierSent', 4, T('Dossier envoyé, réponse attendue.', 'File sent, waiting for an answer.'), []), A(18, 'refused', null, T('Loué à un autre dossier.', 'Rented to another applicant.'), [])];
  const dc = (k, label, date, exp) => ({ k, label, date: day(date), exp: exp == null ? null : day(exp) });
  const people = [
    { id: 1, name: 'Camille Laurent', role: 'tenant', docs: [dc('identity', T('Carte d’identité', 'ID card'), -980, 1100), dc('address', T('Quittance de loyer', 'Rent receipt'), -40), dc('job', T('Attestation employeur', 'Employer letter'), -60), dc('pay', T('Bulletin de septembre', 'September payslip'), -43), dc('pay', T('Bulletin d’août', 'August payslip'), -73), dc('tax', T('Avis d’imposition 2025', '2025 tax notice'), -115), dc('rib', 'RIB', -300)] },
    { id: 2, name: 'Noa Laurent', role: 'spouse', docs: [dc('identity', T('Passeport', 'Passport'), -1250, 40), dc('job', T('Contrat de travail', 'Employment contract'), -374), dc('pay', T('Bulletin de septembre', 'September payslip'), -43)] },
    { id: 3, name: 'Sacha Bernard', role: 'guarantor', docs: [dc('identity', T('Carte d’identité', 'ID card'), -1650, 700), dc('tax', T('Avis d’imposition 2025', '2025 tax notice'), -115)] }];
  return { ls, apps, people, id: () => ++n + 100 };
}
const KINDS = () => [['identity', T('Pièce d’identité', 'ID document'), 1], ['address', T('Justificatif de domicile (quittances ou hébergement)', 'Proof of address (rent receipts or hosting)'), 1], ['job', T('Contrat de travail ou attestation employeur', 'Employment contract or employer letter'), 1], ['pay', T('Bulletins de salaire (3 derniers)', 'Payslips (last 3)'), 3], ['tax', T('Avis d’imposition', 'Tax notice'), 2], ['rib', 'RIB', 1]];
const OPTK = () => [['bal', T('Bilans (indépendant)', 'Accounts (self-employed)')], ['kbis', T('Extrait Kbis', 'Kbis extract')], ['visale', T('Garantie Visale', 'Visale guarantee')], ['ins', T('Attestation d’assurance habitation', 'Home insurance certificate')]];
const ROLE = r => ({ tenant: T('Locataire', 'Tenant'), spouse: T('Conjoint', 'Spouse'), guarantor: T('Garant', 'Guarantor') }[r]);
/* pièces qu'un bailleur n'a pas le droit d'exiger (décret 2015-1437), repérées dans la demande collée */
const FORB = () => [[/photo d.?identit|id photo|passport photo/i, T('Photographie d’identité (hors pièce d’identité)', 'ID photograph (besides the ID document)')], [/carte vitale|social security card/i, T('Carte Vitale ou attestation de sécurité sociale', 'Health insurance card')], [/relev[ée]s? (de compte|bancaire)|bank statements?/i, T('Relevés de compte bancaire', 'Bank statements')], [/bonne tenue/i, T('Attestation de bonne tenue de compte', 'Good account standing certificate')], [/casier|criminal record/i, T('Extrait de casier judiciaire', 'Criminal record extract')], [/dossier m[ée]dical|medical/i, T('Dossier médical', 'Medical records')], [/ch[èe]que de r[ée]servation|reservation cheque/i, T('Chèque de réservation', 'Reservation cheque')], [/pr[ée]l[èe]vement|direct debit/i, T('Autorisation de prélèvement automatique', 'Direct debit authorisation')]];

export function open(app) {
  css('css/demos/HORIZONs.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, minw: 900, minh: 560, bare: true, cls: 'socle hz-win',
    onclose: w => { w.dead = true; w.cleanup && w.cleanup(); }, build: w => build(w, app) });
}

function build(w, app) {
  const D = makeData(), timers = new Set(), alive = () => !w.dead;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive()) fn(); }, ms); timers.add(t); };
  const K = { zone: { m: 'required', cities: ['Vence', 'Cagnes-sur-Mer', 'Saint-Laurent-du-Var', 'Villeneuve-Loubet', 'La Colle-sur-Loup', 'Tourrettes-sur-Loup'] }, rent: { m: 'required', v: 2300 }, surface: { m: 'required', v: 65 }, rooms: { m: 'required', min: 3, max: 4 }, furnished: { m: 'required', v: false },
    outdoor: { m: 'desired', v: 10 }, floor: { m: 'desired' }, parking: { m: 'desired', v: 1 }, cellar: { m: 'desired' }, fees: { m: 'desired' }, travel: { m: 'desired', v: 30 } };
  const st = { view: 'listings', tab: 'toSee', q: '', sort: 'new', sel: 1, selApp: 1, refreshed: false, busy: false, activated: false,
    profile: T('Couple avec un enfant, deux salaires en CDI, garant disponible. Disponibles pour visiter en soirée et le samedi.', 'Couple with one child, two permanent salaries, guarantor available. Free to visit in the evening and on Saturdays.'),
    request: T('Merci d’envoyer : pièce d’identité, 3 relevés de compte, une photo d’identité, avis d’imposition et votre carte Vitale.', 'Please send: ID document, 3 bank statements, an ID photo, tax notice and your Health insurance card.'),
    forb: null, dossierListing: 1, set: { mail: true, watch: true, login: false, auto: true, provider: 'claude' } };
  const root = E('div', 'hz'), side = h('aside', { class: 'hz-side' }), main = h('main', { class: 'hz-main' });
  root.append(E('div', 'hz-title', wm.lights(w), h('span', {}, 'HORIZONs')), side, main);
  root.firstChild.setAttribute('data-drag', '');
  const get = id => D.ls.find(l => l.id === id), appOf = lid => D.apps.find(a => a.lid === lid);

  /* ---------- évaluation d'une annonce selon les critères ---------- */
  function evaluate(l) {
    const rows = [], N = CNAME(), add = (k, s, dt) => { if (K[k].m !== 'ignored') rows.push({ k, name: N[k], st: s, imp: K[k].m, dt: dt || '' }); };
    const U = 'unknown', M = 'met', F = 'failed';
    add('zone', K.zone.cities.includes(l.city) ? M : F, l.city);
    add('rent', l.rent == null ? U : l.rent <= K.rent.v ? M : F, l.rent == null ? '' : `${eur(l.rent)} · max. ${eur(K.rent.v)}`);
    add('surface', l.s == null ? U : l.s >= K.surface.v ? M : F, l.s == null ? '' : `${l.s} m² · min. ${K.surface.v} m²`);
    add('rooms', l.r == null ? U : l.r >= K.rooms.min && l.r <= K.rooms.max ? M : F, l.r == null ? '' : T(`${l.r} pièces · de ${K.rooms.min} à ${K.rooms.max}`, `${l.r} rooms · ${K.rooms.min} to ${K.rooms.max}`));
    add('furnished', l.furn == null ? U : l.furn === K.furnished.v ? M : F, l.furn == null ? '' : l.furn ? T('Meublé', 'Furnished') : T('Non meublé', 'Unfurnished'));
    const o = l.out, big = { from10to20: 10, over20: 20 }[o];
    add('outdoor', o == null ? U : (big && big >= K.outdoor.v) ? M : (!big && (o === 'none' ? 0 : 10) <= K.outdoor.v) ? F : U, o ? OUT()[o] : '');
    add('floor', l.flr == null ? U : l.flr === 'second' && l.elev === false ? F : M, l.flr == null ? '' : FLR()[l.flr] + (l.flr === 'second' ? (l.elev ? T(' · ascenseur', ' · lift') : T(' · sans ascenseur', ' · no lift')) : ''));
    add('parking', l.park == null ? U : l.park >= K.parking.v ? M : F, l.park == null ? '' : T(`${l.park} place${l.park > 1 ? 's' : ''}`, `${l.park} space${l.park > 1 ? 's' : ''}`));
    add('cellar', l.cel == null ? U : l.cel ? M : F, l.cel == null ? '' : l.cel ? T('Cave', 'Cellar') : T('Pas de cave', 'No cellar'));
    add('fees', l.fees == null ? U : !l.fees ? M : F, l.fees == null ? '' : l.fees ? T('Frais d’agence à votre charge', 'Agency fees payable by you') : T('Sans frais d’agence', 'No agency fees'));
    add('travel', l.trip == null ? U : l.trip <= K.travel.v ? M : F, l.trip == null ? '' : `${l.trip} min · max. ${K.travel.v}`);
    const req = rows.filter(r => r.imp === 'required'), wish = rows.filter(r => r.imp === 'desired');
    const verdict = req.some(r => r.st === F) ? 'rejected' : req.some(r => r.st === U) ? 'toCheck' : 'retained';
    return { rows, verdict, wm: wish.filter(r => r.st === M).length, wt: wish.length };
  }
  const evals = () => new Map(D.ls.map(l => [l.id, evaluate(l)]));
  const visible = (l, ev, tab) => { const v = ev.get(l.id).verdict; return tab === 'hidden' ? l.hidden : !l.hidden && (tab === 'toSee' ? v !== 'rejected' : tab === 'retained' ? v === 'retained' : tab === 'toCheck' ? v === 'toCheck' : v === 'rejected'); };
  const reasonOf = e => { const r = e.rows.find(x => x.st === (e.verdict === 'rejected' ? 'failed' : 'unknown') && x.imp === 'required'); return r ? (e.verdict === 'rejected' ? T('Ne convient pas : ', 'Does not fit: ') : T('À vérifier : ', 'To check: ')) + r.name.toLowerCase() : ''; };

  /* ---------- composants ---------- */
  const btn = (l, cls, fn, o = {}) => h('button', { class: 'hz-b ' + (cls || ''), onclick: fn, ...o }, l);
  const tag = (t, k = '') => h('span', { class: 'hz-tag ' + k }, t);
  const vtag = v => tag(VERD()[v][0], VERD()[v][1]);
  const inp = (v, fn, o = {}) => h('input', { class: 'hz-in ' + (o.cls || ''), value: v ?? '', onchange: e => fn(e.target.value), ...o });
  const sel = (opts, v, fn) => h('select', { class: 'hz-sel', onchange: e => fn(e.target.value) }, opts.map(([k, l]) => h('option', { value: k, selected: k === v }, l)));
  const seg = (opts, cur, fn) => E('div', 'hz-seg', opts.map(([k, l]) => h('button', { class: (k === cur ? 'on ' : '') + (k === 'required' ? 'r' : ''), onclick: () => fn(k) }, l)));
  let sheetEl = null;
  const closeSheet = () => { sheetEl?.remove(); sheetEl = null; };
  const sheet = (...k) => { closeSheet(); const s = E('div', 'hz-sheet', ...k); sheetEl = E('div', 'hz-scrim', s); sheetEl.addEventListener('pointerdown', e => { if (e.target === sheetEl) closeSheet(); }); root.append(sheetEl); return s; };
  const note = t => toast({ icon: icon(app.id), title: 'HORIZONs', body: t });
  const demoNote = T('Démo : rien n’est enregistré ni envoyé.', 'Demo: nothing is saved or sent.');

  /* ---------- barre latérale ---------- */
  function renderSide() {
    const ev = evals(), news = D.ls.filter(l => !l.seen && !l.hidden && ev.get(l.id).verdict !== 'rejected').length;
    const late = D.apps.filter(a => a.remind && a.fu != null && !CLOSED.includes(a.stage) && sod(a.fu) <= sod(Date.now())).length;
    const nav = (k, label, ico, badge, red) => h('button', { class: 'hz-nav' + (st.view === k ? ' on' : ''), onclick: () => go(k) }, ic(ico, 17), E('span', 't', label), badge ? E('span', 'hz-n' + (red ? ' red' : ''), String(badge)) : null);
    side.replaceChildren(h('div', { class: 'hz-brand', html: bn() }), nav('listings', T('Annonces', 'Listings'), 'home', news), nav('portals', T('Portails', 'Portals'), 'globe'), nav('pipeline', T('Suivi', 'Follow-up'), 'list', late, true),
      nav('criteria', T('Critères', 'Criteria'), 'sliders'), nav('dossier', T('Dossier', 'Application file'), 'folder'), nav('settings', T('Réglages', 'Settings'), 'gear'), E('div', 'hz-fill'),
      h('button', { class: 'hz-demo', onclick: activation }, h('b', {}, ic('lock', 13), st.activated ? T('Version complète', 'Full version') : T('Version de démonstration', 'Demo version')),
        h('span', {}, st.activated ? T('Toutes les fonctions sont débloquées.', 'All features are unlocked.') : T('Fonctions limitées. L’activation complète les débloque.', 'Some features are limited. Full activation unlocks them.'))));
  }
  const go = k => { st.view = k; render(); };
  function render() { renderSide(); const v = { listings, portals, pipeline, criteria, dossier, settings }[st.view](); main.replaceChildren(v); }

  /* ---------- Annonces ---------- */
  function listings() {
    const ev = evals(), tabs = ['toSee', 'retained', 'toCheck', 'rejected', 'hidden'], TN = { toSee: T('À voir', 'To see'), retained: T('Retenues', 'Retained'), toCheck: T('À vérifier', 'To check'), rejected: T('Écartées', 'Rejected'), hidden: T('Masquées', 'Hidden') };
    let rows = D.ls.filter(l => visible(l, ev, st.tab));
    const q = st.q.trim().toLowerCase(); if (q) rows = rows.filter(l => (l.ti + ' ' + l.city + ' ' + l.desc).toLowerCase().includes(q));
    rows.sort(st.sort === 'wish' ? (a, b) => ev.get(b.id).wm - ev.get(a.id).wm || b.t - a.t : st.sort === 'rent' ? (a, b) => (a.rent ?? 1e9) - (b.rent ?? 1e9) : (a, b) => b.t - a.t || b.id - a.id);
    const list = E('div', 'hz-list');
    if (!rows.length) list.append(h('p', { class: 'hz-m', style: { padding: '14px 4px' } }, T('Aucune annonce dans cette liste.', 'No listings in this list.')));
    rows.forEach(l => {
      const e = ev.get(l.id), rs = e.verdict !== 'retained' ? reasonOf(e) : '';
      list.append(h('button', { class: 'hz-row' + (st.sel === l.id ? ' sel' : ''), onclick: () => { st.sel = l.id; l.seen = true; render(); } }, E('div', 'hz-th', ic('home', 22)),
        E('div', '', E('div', 'hz-rt', !l.seen ? E('span', 'nw') : null, l.ti), E('div', 'hz-rs', [l.rent != null ? eur(l.rent) : null, l.s != null ? l.s + ' m²' : null, l.r != null ? T(`${l.r} pièces`, `${l.r} rooms`) : null, l.city].filter(Boolean).join(' · ')),
          E('div', 'hz-rf', vtag(e.verdict), E('span', '', T(`Souhaits ${e.wm}/${e.wt}`, `Wishes ${e.wm}/${e.wt}`)), E('span', 'fl'), E('span', '', srcName(l.src))),
          rs ? E('div', 'hz-s', rs) : null)));
    });
    const top = E('div', 'hz-bar');
    const upd = btn(st.busy ? T('Lecture des alertes…', 'Reading alerts…') : T('Mettre à jour les annonces', 'Update listings'), 'amb lg', refresh, { disabled: st.busy });
    top.append(upd, btn(T('Ajouter une annonce', 'Add a listing'), 'lg', addSheet));
    const col = E('div', 'hz-lcol', st.set.mail ? null : E('div', 'hz-banner', T('Accès à Apple Mail à autoriser (Réglages)', 'Apple Mail access to allow (Settings)')), top,
      E('div', 'hz-tabs', tabs.map(t => h('button', { class: 'hz-chip' + (st.tab === t ? ' on' : ''), onclick: () => { st.tab = t; render(); } }, TN[t], h('i', {}, String(D.ls.filter(l => visible(l, ev, t)).length))))),
      E('div', 'hz-find', h('input', { class: 'hz-in', placeholder: T('Rechercher (titre, commune, texte)', 'Search (title, town, text)'), value: st.q, oninput: e => { st.q = e.target.value; const p = e.target.selectionStart; render(); const i = main.querySelector('.hz-find input'); i.focus(); i.setSelectionRange(p, p); } }),
        sel([['new', T('Plus récentes', 'Newest')], ['wish', T('Le plus de souhaits', 'Most wishes')], ['rent', T('Loyer croissant', 'Rent, low to high')]], st.sort, v => { st.sort = v; render(); })), list);
    return E('div', 'hz-ls', col, detail(ev));
  }
  function detail(ev) {
    const l = get(st.sel), box = E('div', 'hz-det');
    if (!l || !ev.get(l.id)) { box.append(E('div', 'none', T('Choisissez une annonce.', 'Choose a listing.'))); return box; }
    const e = ev.get(l.id), a = appOf(l.id), grp = (s, title) => { const r = e.rows.filter(x => x.st === s); return r.length ? [E('div', 'g', title), ...r.map(x => E('div', 'hz-wr', ic(s === 'met' ? 'check' : s === 'failed' ? 'xc' : 'q', 15, s === 'met' ? 'ok' : s === 'failed' ? 'dg' : 'wn'), h('span', {}, x.name), E('span', 'imp', impName(x.imp)), x.dt ? E('span', 'dt', '— ' + x.dt) : null))] : []; };
    box.append(h('h1', { class: 'hz-h1', style: { fontSize: '17px' } }, l.ti), E('div', 'hz-pr', h('b', {}, l.rent == null ? T('Loyer non indiqué', 'Rent not stated') : eur(l.rent)), l.rent != null ? E('span', 'hz-m', T('par mois, charges comprises', 'a month, charges included')) : null),
      E('div', 'hz-chips', [l.s != null ? l.s + ' m²' : null, l.r != null ? T(`${l.r} pièces`, `${l.r} rooms`) : null, l.city].filter(Boolean).map(t => E('span', 'hz-chip st', t))), vtag(e.verdict),
      E('div', 'hz-acts', a ? btn(T('Voir dans le suivi', 'See in follow-up'), 'pri', () => { st.selApp = l.id; go('pipeline'); }) : btn(T('Ajouter au suivi', 'Add to follow-up'), 'pri', () => { D.apps.push({ lid: l.id, stage: 'spotted', fu: null, notes: '', remind: false, hist: [{ t: Date.now(), txt: T('Ajoutée au suivi', 'Added to follow-up') }] }); st.selApp = l.id; note(T('Annonce ajoutée au suivi.', 'Listing added to follow-up.')); render(); }),
        btn(T('Rédiger un message', 'Draft a message'), '', () => draftSheet(l)), btn(T('Préparer le dossier', 'Prepare the file'), '', () => { st.dossierListing = l.id; if (!a) D.apps.push({ lid: l.id, stage: 'spotted', fu: null, notes: '', remind: false, hist: [{ t: Date.now(), txt: T('Ajoutée au suivi', 'Added to follow-up') }] }); go('dossier'); }),
        btn(l.hidden ? T('Réafficher', 'Show again') : T('Masquer', 'Hide'), 'ter', () => { l.hidden = !l.hidden; render(); })),
      h('h2', { class: 'hz-h2' }, T('Pourquoi ce verdict', 'Why this verdict')), E('div', 'hz-why', grp('met', T('Convient', 'Fits')), grp('failed', T('Ne convient pas', 'Does not fit')), grp('unknown', T('À vérifier', 'To check'))),
      h('h2', { class: 'hz-h2' }, T('Texte de l’annonce', 'Listing text')), E('div', 'hz-desc', l.desc), E('div', 'hz-s', T(`Reçue de ${srcName(l.src)} le ${fday(l.t)}`, `Received from ${srcName(l.src)} on ${fday(l.t)}`)));
    return box;
  }
  async function refresh() {
    if (st.busy) return; st.busy = true; render(); sfx.tick();
    await wait(1500); if (!alive()) return; st.busy = false;
    if (!st.refreshed) {
      st.refreshed = true;
      const extra = [{ src: 'leboncoin', ti: T('T3 avec jardin, Vence', '3-room flat with garden, Vence'), rent: 2090, ch: 80, s: 72, r: 3, city: 'Vence', furn: false, fees: false, out: 'over20', flr: 'ground', park: 1, cel: true, trip: 24, desc: T('Appartement de 72 m² en rez-de-jardin, jardin de 40 m², parking et cave. Alerte e-mail LeBonCoin reçue ce matin.', '72 m² garden-level flat, 40 m² garden, parking and cellar. LeBonCoin e-mail alert received this morning.') },
        { src: 'seloger', ti: T('T4 spacieux, Cagnes-sur-Mer', 'Spacious 4-room flat, Cagnes-sur-Mer'), rent: 2480, ch: 120, s: 92, r: 4, city: 'Cagnes-sur-Mer', furn: false, fees: false, out: 'from10to20', flr: 'first', elev: true, park: 2, cel: true, trip: 26, desc: T('Appartement de 92 m², terrasse de 14 m², deux places de parking, cave.', '92 m² flat, 14 m² terrace, two parking spaces, cellar.') }]
        .map(x => ({ id: D.id(), age: 0, t: Date.now(), seen: false, hidden: false, elev: null, ...x }));
      D.ls.unshift(...extra); st.tab = 'toSee';
      note(T('2 nouvelles annonces : 1 retenue, 1 écartée (loyer au-dessus du maximum).', '2 new listings: 1 retained, 1 rejected (rent above your maximum).'));
    } else note(T('Aucune nouvelle annonce pour l’instant.', 'No new listings for now.'));
    render();
  }
  function addSheet() {
    const url = h('input', { class: 'hz-in', placeholder: T('Adresse de l’annonce (facultatif)', 'Listing address (optional)') }), ta = h('textarea', { class: 'hz-ta', rows: 7, placeholder: T('ou collez le texte de l’annonce :', 'or paste the listing text:') });
    ta.value = T('Appartement T3 à Cagnes-sur-Mer, 70 m². Loyer 1 920 € charges comprises. Terrasse de 15 m², cave et parking. Non meublé, sans frais d’agence.', '3-room flat in Cagnes-sur-Mer, 70 m². Rent €1,920 including charges. 15 m² terrace, cellar and parking. Unfurnished, no agency fees.');
    const s = sheet(h('h2', {}, T('Ajouter une annonce', 'Add a listing')), url, ta, E('p', 'hz-s', T('Avec une adresse et sans texte, HORIZONs lit cette seule page, une fois, à votre demande. (Démo : rien n’est lu en ligne.)', 'With an address and no text, HORIZONs reads that single page, once, on your request. (Demo: nothing is read online.)')),
      E('div', 'hz-bt', btn(T('Annuler', 'Cancel'), '', closeSheet), btn(T('Ajouter', 'Add'), 'pri', () => {
        const t = ta.value, num = re => { const m = t.replace(/[  ]/g, ' ').match(re); return m ? +m[1].replace(/\s/g, '') : null; };
        const city = CITIES.find(c => t.toLowerCase().includes(c.toLowerCase())) || 'Vence', rent = num(/(\d[\d ]*\d)\s*€/) ?? num(/€\s*(\d[\d,]*)/), surf = num(/(\d+)\s*m²/), rooms = num(/\bT(\d)/i) ?? num(/(\d)\s*pi[èe]ces/);
        const o = /jardin de (\d+)|terrasse de (\d+)/i.exec(t), sz = o ? +(o[1] || o[2]) : null, low = t.toLowerCase();
        const l = { id: D.id(), src: 'manual', ti: (rooms ? 'T' + rooms : T('Logement', 'Home')) + ', ' + city, rent, ch: 0, s: surf, r: rooms, city, furn: /non meubl/.test(low) ? false : /meubl/.test(low) ? true : null, fees: /sans frais/.test(low) ? false : null,
          out: /jardin|terrasse|balcon|loggia/.test(low) ? (sz == null ? null : sz >= 20 ? 'over20' : sz >= 10 ? 'from10to20' : 'under10') : null, flr: null, elev: null, park: /parking|garage/.test(low) ? 1 : null, cel: /cave/.test(low) ? true : null, trip: null, age: 0, t: Date.now(), seen: false, hidden: false, desc: t.trim() || T('Annonce saisie à la main.', 'Listing added by hand.') };
        D.ls.unshift(l); st.sel = l.id; st.tab = 'toSee'; closeSheet(); render();
      })));
    s.style.width = '480px';
  }

  /* ---------- Messages (brouillons) ---------- */
  function draftSheet(l, kindIn) {
    const KD = () => [['first', T('Premier contact', 'First contact')], ['visit', T('Demande de visite', 'Visit request')], ['file', T('Envoi du dossier', 'Sending the file')], ['follow', T('Relance', 'Follow-up')]];
    let kind = kindIn || 'first';
    const TX = k => {
      const ti = l.ti, who = 'Camille Laurent';
      const fr = { first: [`Votre annonce : ${ti}`, `Bonjour,\n\nVotre annonce « ${ti} » correspond à ce que nous cherchons. Nous sommes un couple avec un enfant, tous deux en CDI, et un garant est disponible. Le logement est-il toujours libre ?\n\nNous pouvons envoyer notre dossier complet dès aujourd’hui.\n\nCordialement,\n${who}`],
        visit: [`Demande de visite : ${ti}`, `Bonjour,\n\nNous aimerions visiter « ${ti} ». Nous sommes disponibles en soirée en semaine et le samedi toute la journée. Quel créneau vous conviendrait ?\n\nCordialement,\n${who}`],
        file: [`Dossier de location : ${ti}`, `Bonjour,\n\nSuite à notre visite, veuillez trouver ci-joint notre dossier de location pour « ${ti} » (pièces d’identité, justificatifs de revenus, avis d’imposition, garant).\n\nNous restons à votre disposition pour tout complément.\n\nCordialement,\n${who}`],
        follow: [`Suite à notre dossier : ${ti}`, `Bonjour,\n\nNous nous permettons de revenir vers vous au sujet de notre dossier pour « ${ti} ». Avez-vous pu l’étudier ? Nous sommes toujours très intéressés.\n\nCordialement,\n${who}`] };
      const en = { first: [`Your listing: ${ti}`, `Hello,\n\nYour listing “${ti}” matches what we are looking for. We are a couple with one child, both on permanent contracts, and a guarantor is available. Is the property still available?\n\nWe can send our complete file today.\n\nKind regards,\n${who}`],
        visit: [`Visit request: ${ti}`, `Hello,\n\nWe would like to visit “${ti}”. We are available on weekday evenings and all day on Saturdays. Which time would suit you?\n\nKind regards,\n${who}`],
        file: [`Rental application: ${ti}`, `Hello,\n\nFollowing our visit, please find attached our rental application for “${ti}” (ID documents, proof of income, tax notices, guarantor).\n\nWe remain at your disposal for anything else you may need.\n\nKind regards,\n${who}`],
        follow: [`Following our application: ${ti}`, `Hello,\n\nWe are following up on our application for “${ti}”. Have you been able to review it? We are still very interested.\n\nKind regards,\n${who}`] };
      return (lang_fr() ? fr : en)[k];
    };
    const lang_fr = () => T('fr', 'en') === 'fr';
    const subj = h('input', { class: 'hz-in', readonly: true }), body = E('div', 'hz-draft'), kindSel = sel(KD(), kind, v => { kind = v; run(); });
    const mk = () => { const [s, b] = TX(kind); subj.value = s; return b; };
    let my = 0; const run = async () => { const me = ++my, b = mk(); body.textContent = ''; await stream(body, b, { think: 600, cps: 260, alive: () => alive() && my === me }); };
    const s = sheet(h('h2', {}, T('Rédiger un message', 'Draft a message')), E('div', 'hz-line', h('span', { class: 'hz-m' }, T('Type de message', 'Message type')), kindSel, E('span', 'hz-s', T('Rédigé avec Claude (clé de votre choix) · démo', 'Written with Claude (the key of your choice) · demo'))),
      E('div', 'hz-fld', h('label', {}, T('Objet', 'Subject')), subj), body,
      E('p', 'hz-s', T('Relisez avant d’envoyer. Pour un envoi de dossier, joignez le PDF généré dans l’écran Dossier.', 'Read it over before sending. When sending the file, attach the PDF generated in the Application file screen.')),
      E('div', 'hz-bt', btn(T('Copier', 'Copy'), '', () => { try { navigator.clipboard.writeText(subj.value + '\n\n' + body.textContent); } catch {} note(T('Message copié.', 'Message copied.')); }), btn(T('Ouvrir dans Mail', 'Open in Mail'), '', () => note(demoNote)),
        btn(T('Marquer comme envoyé', 'Mark as sent'), 'pri', () => { const a = appOf(l.id); if (a) { a.hist.push({ t: Date.now(), txt: T('Message envoyé : ', 'Message sent: ') + KD().find(k => k[0] === kind)[1].toLowerCase() }); if (a.stage === 'spotted') { a.stage = 'contacted'; } } note(T('Noté dans l’historique.', 'Noted in the history.')); closeSheet(); render(); }), btn(T('Fermer', 'Close'), '', closeSheet)));
    s.style.width = '520px'; run();
  }

  /* ---------- Portails ---------- */
  function portals() {
    const P = [['SeLoger', 5, T('Alertes e-mail lues', 'E-mail alerts read'), true], ['LeBonCoin', 5, T('Alertes e-mail lues', 'E-mail alerts read'), true], ['PAP', 4, T('Alertes e-mail lues', 'E-mail alerts read'), true], ['Bien’ici', 3, T('Alertes e-mail lues', 'E-mail alerts read'), true], ['Logic-Immo', 0, T('Aucune alerte reçue', 'No alerts received'), false], ['Vizzit', 0, T('Aucune alerte reçue', 'No alerts received'), false]];
    const S1 = [[T('Location Vence, 3 pièces, jusqu’à 2 300 €', 'Rental Vence, 3 rooms, up to €2,300'), 'SeLoger', 4, T('il y a 2 h', '2 h ago'), true], [T('Cagnes-sur-Mer, appartement, 65 m² minimum', 'Cagnes-sur-Mer, flat, 65 m² minimum'), 'PAP', 6, T('il y a 2 h', '2 h ago'), true], [T('Saint-Laurent-du-Var, T3 / T4', 'Saint-Laurent-du-Var, 3 / 4 rooms'), 'LeBonCoin', 2, T('il y a 5 h', '5 h ago'), false]];
    const A1 = [['Agence Horizon Azur (exemple)', 'Vence', true], ['Cabinet des Oliviers (exemple)', 'Cagnes-sur-Mer', true], ['Immo Provence Littoral (exemple)', 'Saint-Laurent-du-Var', false]];
    const row = (...k) => E('div', 'hz-kv', ...k);
    return E('div', 'hz-view hz-scroll hz-pad', h('h1', { class: 'hz-h1' }, T('Portails', 'Portals')), E('p', 'hz-m', T('HORIZONs lit les alertes e-mail des portails dans Apple Mail (lecture seule), ou une page à la fois dans le navigateur intégré. Jamais d’exploration automatique d’un portail qui l’interdit.', 'HORIZONs reads portal alert e-mails in Apple Mail (read-only), or one page at a time in the built-in browser. It never crawls a portal that forbids it.')),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Alertes e-mail', 'E-mail alerts')), P.map(p => row(h('span', { style: { width: '150px', color: 'var(--ts)' } }, p[0]), tag(p[3] ? T('Alertes actives', 'Alerts on') : T('À créer', 'To set up'), p[3] ? 'ok' : ''), E('span', 'hz-m', p[3] ? `${p[1]} ${T('annonces ce mois-ci', 'listings this month')}` : p[2])))),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Recherches surveillées (relues toutes les 3 heures)', 'Watched searches (re-read every 3 hours)')), S1.map(s => row(h('span', { style: { width: 'auto', flex: 1, color: 'var(--ts)' } }, s[0]), E('span', 'hz-s', `${s[1]} · ${s[2]} ${T('annonces', 'listings')} · ${s[3]}`), tag(s[4] ? T('Active', 'On') : T('En pause', 'Paused'), s[4] ? 'ok' : '')))),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Agences du secteur', 'Local agencies')), E('p', 'hz-s', T('Trouvées dans OpenStreetMap et le répertoire officiel des entreprises. Noms d’exemple.', 'Found in OpenStreetMap and the official business register. Example names.')),
        A1.map(a => row(h('span', { style: { width: 'auto', flex: 1, color: 'var(--ts)' } }, a[0]), E('span', 'hz-s', a[1]), tag(a[2] ? T('Surveillée', 'Watched') : T('Non surveillée', 'Not watched'), a[2] ? 'ok' : '')))),
      btn(T('Importer cette page', 'Import this page'), '', () => note(demoNote)));
  }

  /* ---------- Suivi ---------- */
  function pipeline() {
    const cols = STAGES().slice(0, 5), open_ = D.apps.filter(a => !CLOSED.includes(a.stage)), closed = D.apps.filter(a => CLOSED.includes(a.stage));
    const card = a => { const l = get(a.lid), late = a.remind && a.fu != null && sod(a.fu) <= sod(Date.now()); return h('button', { class: 'hz-card' + (st.selApp === a.lid ? ' sel' : ''), onclick: () => { st.selApp = a.lid; render(); } }, h('b', {}, l.ti), E('div', 'm', [l.rent != null ? eur(l.rent) : null, l.s != null ? l.s + ' m²' : null, l.city].filter(Boolean).join(' · ')), a.remind && a.fu != null ? E('div', 'bell' + (late ? ' late' : ''), ic('bell', 13), fday(a.fu)) : null); };
    const board = E('div', 'hz-board', cols.map(([k, n]) => { const xs = open_.filter(a => a.stage === k); return E('div', 'hz-col', E('div', 'hd', `${n} (${xs.length})`), xs.map(card)); }),
      E('div', 'hz-col cl', h('button', { class: 'hd hz-b ter sm', style: { justifyContent: 'flex-start' }, onclick: () => { st.showClosed = !st.showClosed; render(); } }, `${st.showClosed ? '⌄' : '›'} ${T('Terminées', 'Closed')} (${closed.length})`), st.showClosed ? closed.map(card) : null));
    if (!D.apps.length) return E('div', 'hz-view', E('div', 'hz-det', E('div', 'none', T('Aucune annonce suivie.', 'No listings followed.'))));
    const a = appOf(st.selApp);
    return E('div', 'hz-view', h('div', { style: { display: 'flex', flex: 1, minHeight: 0 } }, board, a ? apDetail(a) : null));
  }
  function apDetail(a) {
    const l = get(a.lid), order = STAGES().slice(0, 5).map(s => s[0]), next = order[order.indexOf(a.stage) + 1];
    const setStage = k => { a.hist.push({ t: Date.now(), txt: stName(k) }); a.stage = k; render(); };
    const ta = h('textarea', { class: 'hz-ta', rows: 4, oninput: e => { a.notes = e.target.value; } }); ta.value = a.notes;
    return E('aside', 'hz-apd', h('h3', { class: 'hz-h2' }, l.ti), E('div', 'hz-s', [l.rent != null ? eur(l.rent) : null, l.city].filter(Boolean).join(' · ')),
      E('div', 'hz-fld', h('label', {}, T('Étape', 'Stage')), sel(STAGES(), a.stage, setStage)), next ? btn(T('Étape suivante : ', 'Next stage: ') + stName(next), 'pri', () => setStage(next)) : null,
      E('div', 'hz-fld', h('label', {}, T('Relance', 'Follow-up')), E('div', 'hz-line', h('button', { class: 'hz-sw' + (a.remind ? ' on' : ''), 'aria-label': T('Me rappeler de relancer', 'Remind me to follow up'), onclick: () => { a.remind = !a.remind; if (a.remind && a.fu == null) a.fu = day(3); render(); } }), E('span', '', T('Me rappeler de relancer', 'Remind me to follow up')),
        a.remind ? h('input', { class: 'hz-in', type: 'date', value: a.fu != null ? iso(a.fu) : '', onchange: e => { a.fu = fromIso(e.target.value); render(); } }) : null), a.remind ? E('span', 'hz-s', T('Une notification vous le rappellera ce jour-là à 9 h.', 'A notification will remind you on that day at 9 am.')) : null),
      E('div', 'hz-fld', h('label', {}, T('Notes', 'Notes')), ta, E('span', 'hz-s', T('Enregistrées automatiquement.', 'Saved automatically.'))),
      E('div', 'hz-fld', h('label', {}, T('Historique', 'History')), E('div', 'hz-hist', [...a.hist].reverse().map(x => E('div', '', h('time', {}, fshort(x.t)), h('span', {}, x.txt))))),
      E('div', 'hz-line', btn(T('Voir l’annonce', 'See the listing'), '', () => { st.sel = l.id; st.tab = 'toSee'; go('listings'); }), btn(T('Rédiger un message', 'Draft a message'), '', () => draftSheet(l, a.stage === 'dossierSent' ? 'follow' : a.stage === 'spotted' ? 'first' : 'visit'))));
  }

  /* ---------- Critères ---------- */
  function criteria() {
    const ev = evals(), N = D.ls.length, c = { retained: 0, toCheck: 0, rejected: 0 }; ev.forEach(e => c[e.verdict]++);
    const impact = k => { const m = K[k].m; if (m === 'ignored') return E('span', 'hz-imp', ''); let f = 0, u = 0; ev.forEach(e => { const r = e.rows.find(x => x.k === k); if (r) { if (r.st === 'failed') f++; else if (r.st === 'unknown') u++; } });
      return m === 'required' ? (f ? E('span', 'hz-imp dg', T(`Écarte ${f} annonce${f > 1 ? 's' : ''}`, `Rejects ${f} listing${f > 1 ? 's' : ''}`)) : u ? E('span', 'hz-imp wn', T(`${u} à vérifier`, `${u} to check`)) : E('span', 'hz-imp', T('N’écarte aucune annonce', 'Rejects no listing'))) : E('span', 'hz-imp', f ? T(`${f} ne conviennent pas`, `${f} do not fit`) : u ? T(`${u} à vérifier`, `${u} to check`) : T('Toutes conviennent', 'All fit')); };
    const num = (k, f, o = {}) => inp(K[k][f], v => { K[k][f] = +v || 0; render(); }, { type: 'number', cls: 'num', ...o });
    const row = (k, val) => E('div', 'hz-cr', E('span', 'nm', CNAME()[k]), seg(IMP(), K[k].m, v => { K[k].m = v; render(); }), E('div', 'hz-val', ...[].concat(val)), impact(k));
    const zone = E('div', 'hz-val', CITIES.map(ct => h('button', { class: 'hz-chip' + (K.zone.cities.includes(ct) ? ' on' : ''), onclick: () => { const z = K.zone.cities, i = z.indexOf(ct); i < 0 ? z.push(ct) : z.splice(i, 1); render(); } }, ct)));
    const th = (t, hint, ...r) => E('div', 'hz-theme', h('h2', { class: 'hz-h2' }, t), E('p', '', hint), ...r);
    return E('div', 'hz-view hz-scroll hz-pad', h('h1', { class: 'hz-h1' }, T('Critères', 'Criteria')), E('p', 'hz-m', T('Indiquez ce que vous cherchez. « Indispensable » écarte une annonce qui ne convient pas, « Souhaité » la fait monter dans le classement, « Indifférent » n’en tient pas compte.', 'Tell us what you are looking for. “Must have” rejects a listing that does not fit, “Wish” ranks it higher, “Don’t care” ignores it.')),
      E('div', 'hz-res', h('b', {}, T(`Sur ${N} annonces reçues :`, `Out of ${N} listings received:`)), ' ', T(`${c.retained} retenues, ${c.toCheck} à vérifier, ${c.rejected} écartées.`, `${c.retained} retained, ${c.toCheck} to check, ${c.rejected} rejected.`)),
      th(T('Localisation', 'Location'), T('Une annonce convient si elle se trouve dans l’une des communes ou dans le rayon (l’un des deux suffit).', 'A listing fits if it is in one of the towns or within the radius (either is enough).'), E('div', 'hz-cr', E('span', 'nm', CNAME().zone), seg(IMP(), K.zone.m, v => { K.zone.m = v; render(); }), zone, impact('zone'))),
      th(T('Budget', 'Budget'), T('Loyer charges comprises, tel qu’indiqué dans l’annonce.', 'Rent including charges, as stated in the listing.'), row('rent', [T('Jusqu’à ', 'Up to '), num('rent', 'v'), T('€ par mois', '€ a month')]), row('fees', [T('Pas de frais d’agence à la charge du locataire', 'No agency fees payable by the tenant')])),
      th(T('Logement', 'Home'), T('Taille, ameublement et date d’entrée.', 'Size, furnishing and move-in date.'), row('surface', [T('Au moins ', 'At least '), num('surface', 'v'), 'm²']), row('rooms', [num('rooms', 'min'), T('à', 'to'), num('rooms', 'max'), T('pièces', 'rooms')]), row('furnished', [sel([['n', T('Non meublé', 'Unfurnished')], ['y', T('Meublé', 'Furnished')]], K.furnished.v ? 'y' : 'n', v => { K.furnished.v = v === 'y'; render(); })])),
      th(T('Extérieur et confort', 'Outdoor space and comfort'), T('Repérés dans le texte des annonces par l’analyse des textes (Jev, facultatif).', 'Spotted in the listing text by the text analysis (Jev, optional).'), row('outdoor', [T('Au moins ', 'At least '), num('outdoor', 'v'), 'm²']), row('floor', [T('Rez-de-jardin, rez-de-chaussée ou ascenseur', 'Garden level, ground floor or lift')]), row('parking', [T('Au moins ', 'At least '), num('parking', 'v'), T('place', 'space')]), row('cellar', [T('Cave souhaitée', 'Cellar wanted')])),
      th(T('Trajets', 'Journeys'), T('Durée en voiture depuis le centre de la commune de l’annonce (Plans d’Apple). Lieu d’exemple.', 'Driving time from the centre of the listing’s town (Apple Maps). Example place.'), row('travel', [T('Jusqu’à ', 'Up to '), num('travel', 'v'), T('min vers École des Mimosas, Nice', 'min to École des Mimosas, Nice')])));
  }

  /* ---------- Dossier ---------- */
  const done = (p, k, n) => p.docs.filter(d => d.k === k && !(d.exp && sod(d.exp) < sod(Date.now()))).length >= n;
  const nDone = p => KINDS().filter(([k, , n]) => done(p, k, n)).length;
  function dossier() {
    const view = E('div', 'hz-view hz-scroll hz-pad');
    const person = p => {
      const dk = ([k, label, n]) => { const ds = p.docs.filter(d => d.k === k), ok = done(p, k, n), cls = ok ? 'ok' : ds.length ? 'part' : 'miss';
        return E('div', 'hz-dk', E('div', 'l', E('span', 'hz-dot ' + cls), E('span', 'nm', label), n > 1 ? h('small', {}, `${ds.length}/${n}`) : null, btn(T('Ajouter', 'Add'), 'ter sm', () => { p.docs.push({ k, label: DL(k), date: Date.now(), exp: k === 'identity' ? day(1800) : null }); render(); })),
          ds.map(d => E('div', 'hz-df', ic('doc', 14), E('span', 'fn', h('b', {}, d.label), fshort(d.date) + ' ' + new Date(d.date).getFullYear(), d.exp ? '  ' + T('valable jusqu’au ', 'valid until ') + fday(d.exp) : ''), btn(T('Aperçu', 'Preview'), 'lnk sm', () => previewSheet(d)), btn(T('Retirer', 'Remove'), 'lnk sm', () => { p.docs.splice(p.docs.indexOf(d), 1); render(); })))); };
      return E('div', 'hz-pc', E('div', 'top', ic(p.role === 'tenant' ? 'user' : 'users', 16, 'hz-m'), h('b', {}, p.name), E('span', 'hz-m', ROLE(p.role)), E('span', 'fl'), E('span', 'cnt' + (nDone(p) === 6 ? ' ok' : ''), T(`${nDone(p)} pièces sur 6`, `${nDone(p)} of 6 documents`))),
        E('div', 'hint', T('Glissez un fichier sur une ligne pour l’ajouter.', 'Drag a file onto a row to add it.')), KINDS().map(dk), OPTK().map(([, l]) => E('div', 'hz-dk', E('div', 'l', E('span', 'hz-dot'), E('span', 'nm', l), E('span', 'hz-opt', T('Facultatif', 'Optional')), btn(T('Ajouter', 'Add'), 'ter sm', () => note(demoNote))))));
    };
    const DL = k => ({ identity: T('Carte d’identité', 'ID card'), address: T('Quittance de loyer', 'Rent receipt'), job: T('Attestation employeur', 'Employer letter'), pay: T('Bulletin de salaire', 'Payslip'), tax: T('Avis d’imposition', 'Tax notice'), rib: 'RIB' }[k]);
    const apps = D.apps.filter(a => !CLOSED.includes(a.stage));
    const fl = get(st.dossierListing) || get(apps[0]?.lid);
    view.append(E('div', 'hz-line', h('h1', { class: 'hz-h1', style: { flex: 1 } }, T('Dossier', 'Application file')), btn(T('Ajouter la personne', 'Add a person'), '', () => { D.people.push({ id: D.id(), name: T('Nouvelle personne', 'New person'), role: 'guarantor', docs: [] }); render(); })),
      E('p', 'hz-m', T('Les pièces justificatives de chaque personne du foyer, chiffrées sur ce Mac, pour préparer un dossier de location en un clic.', 'The supporting documents of each household member, encrypted on this Mac, to prepare a rental application in one click.')),
      E('div', 'hz-people', D.people.map(person)),
      E('div', 'hz-sec', h('h2', { class: 'hz-h2' }, T('Générer le dossier', 'Generate the file')), E('p', 'hz-m', T('Un PDF avec une page de garde et vos pièces valides, chacune marquée « Document exclusivement destiné à la location du logement … ».', 'A PDF with a cover page and your valid documents, each marked “Document intended exclusively for the rental of the property …”.')),
        E('div', 'hz-line', apps.length ? sel(apps.map(a => [String(a.lid), get(a.lid).ti]), String(fl.id), v => { st.dossierListing = +v; render(); }) : E('span', 'hz-m', T('Suivez d’abord une annonce (écran Annonces) pour générer son dossier.', 'Follow a listing first (Listings screen) to generate its file.')), btn(T('Préparer le dossier', 'Prepare the file'), 'pri', () => pdfSheet(fl), { disabled: !apps.length }))),
      E('div', 'hz-sec', h('h2', { class: 'hz-h2' }, T('Vérifier la demande d’un bailleur', 'Check a landlord’s request')), E('p', 'hz-m', T('Collez la liste des pièces demandées : HORIZONs signale celles que la loi interdit d’exiger.', 'Paste the list of requested documents: HORIZONs flags those the law forbids a landlord to require.')), reqBox()),
      E('div', 'hz-sec', h('h2', { class: 'hz-h2' }, T('Présentation du foyer', 'Household introduction')), E('p', 'hz-m', T('Quelques lignes pour vos messages aux agences : qui vous êtes, votre situation, garant, disponibilités pour visiter.', 'A few lines for your messages to agencies: who you are, your situation, guarantor, availability for visits.')), (() => { const t = h('textarea', { class: 'hz-ta', rows: 3, oninput: e => { st.profile = e.target.value; } }); t.value = st.profile; return t; })(),
        E('p', 'hz-s', T('Liste des pièces fixée par le décret 2015-1437 : un bailleur ne peut pas en exiger d’autres. Les bulletins de plus de 3 mois et les pièces périmées sont signalés.', 'List of documents set by decree 2015-1437: a landlord cannot require any others. Payslips older than 3 months and expired documents are flagged.'))));
    return view;
  }
  function reqBox() {
    const ta = h('textarea', { class: 'hz-ta', rows: 3, oninput: e => { st.request = e.target.value; } }); ta.value = st.request;
    const out = E('div', '');
    const run = () => { const hits = FORB().filter(([re]) => re.test(ta.value)); out.replaceChildren(hits.length ? E('div', 'hz-forb', h('b', {}, T('Pièces que le bailleur ne peut pas exiger :', 'Documents the landlord cannot require:')), h('ul', {}, hits.map(x => h('li', {}, x[1])))) : E('div', 'hz-okbox', T('Aucune pièce interdite détectée dans cette demande.', 'No forbidden document detected in this request.'))); };
    return E('div', '', ta, E('div', 'hz-line', btn(T('Vérifier', 'Check'), '', run)), out);
  }
  function previewSheet(d) {
    const s = sheet(h('h2', {}, d.label), E('div', 'hz-pdf', h('h3', {}, d.label), h('p', {}, T('Aperçu fictif d’une pièce du coffre. Le fichier original n’est ni modifié ni supprimé.', 'Fictional preview of a vault document. The original file is neither modified nor deleted.')), h('p', {}, fday(d.date))), E('div', 'hz-bt', btn(T('Fermer', 'Close'), '', closeSheet)));
    s.style.width = '440px';
  }
  function pdfSheet(l) {
    const people = D.people, miss = people.slice(0, 2).some(p => nDone(p) < 6), items = [];
    people.forEach(p => p.docs.filter(d => !(d.exp && sod(d.exp) < sod(Date.now()))).forEach(d => items.push(`${p.name.split(' ')[0]} : ${d.label}`)));
    const wm_ = T(`Document exclusivement destiné à la location du logement « ${l.ti} »`, `Document intended exclusively for the rental of the property “${l.ti}”`);
    const page = E('div', 'hz-pdf', E('div', 'wmk', Array.from({ length: 7 }, () => h('div', {}, wm_))), h('h3', {}, T('Dossier de location', 'Rental application')), h('p', {}, T('Logement : ', 'Property: ') + l.ti), h('p', {}, T('Généré le ', 'Generated on ') + fday(Date.now())), h('p', { style: { marginTop: '12px', fontWeight: 700 } }, T('Pièces jointes', 'Attached documents')), h('ol', {}, items.slice(0, 10).map(t => h('li', {}, t))));
    const s = sheet(h('h2', {}, T('Générer le dossier', 'Generate the file')), miss ? E('div', 'hz-banner', T('Des pièces obligatoires manquent ou sont périmées : le dossier sera incomplet.', 'Required documents are missing or expired: the file will be incomplete.')) : null, page,
      E('div', 'hz-bt', btn(T('Annuler', 'Cancel'), '', closeSheet), btn(T('Enregistrer le PDF', 'Save the PDF'), 'pri', () => { closeSheet(); note(T('Dossier enregistré : Dossier-location.pdf. ', 'File saved: Rental-application.pdf. ') + demoNote); })));
    s.style.width = '470px';
  }

  /* ---------- Réglages, activation, À propos ---------- */
  const PROV = [['claude', 'Claude'], ['openai', 'OpenAI'], ['gemini', 'Gemini'], ['mistral', 'Mistral'], ['groq', 'Groq']];
  function settings() {
    const sw = k => h('button', { class: 'hz-sw' + (st.set[k] ? ' on' : ''), onclick: () => { st.set[k] = !st.set[k]; render(); } });
    const kv = (l, ...k) => E('div', 'hz-kv', h('span', {}, l), ...k);
    return E('div', 'hz-view hz-scroll hz-pad', E('div', 'hz-set', h('h1', { class: 'hz-h1', style: { marginBottom: '12px' } }, T('Réglages', 'Settings')),
      E('div', 'hz-card2 demo', h('h3', { class: 'hz-h3' }, T('Version de démonstration', 'Demo version')), E('p', 'hz-m', st.activated ? T('Version complète activée. Merci !', 'Full version activated. Thank you!') : T('Certaines fonctions sont limitées dans cette version de démonstration. L’activation complète (payante) les débloque.', 'Some features are limited in this demo version. Full activation (paid) unlocks them.')),
        st.activated ? null : btn(T('Activer la version complète', 'Activate the full version'), 'amb', activation)),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Annonces', 'Listings')), kv(T('Apple Mail', 'Apple Mail'), sw('mail'), E('span', 'hz-s', T('Lecture seule des alertes des portails ; aucun e-mail n’est modifié.', 'Read-only access to portal alerts; no e-mail is changed.'))),
        kv(T('Veille', 'Watching'), sw('watch'), E('span', 'hz-s', T('Notification des nouvelles annonces retenues.', 'Notification of new retained listings.'))), kv(T('Analyse des textes', 'Text analysis'), tag(T('Jev : prêt (démo)', 'Jev: ready (demo)'), 'ok'), E('span', 'hz-s', T('Repère extérieur, étage, parking, cave, frais d’agence…', 'Spots outdoor space, floor, parking, cellar, agency fees…')))),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Rédaction des messages', 'Message drafting')), E('p', 'hz-s', T('Rédige vos messages aux agences avec le service et le modèle de votre choix. Votre clé reste dans le Trousseau macOS.', 'Drafts your messages to agencies with the service and model of your choice. Your key stays in the macOS Keychain.')),
        kv(T('Service', 'Service'), sel(PROV, st.set.provider, v => { st.set.provider = v; })), kv(T('Clé', 'Key'), h('input', { class: 'hz-in', type: 'password', placeholder: '••••••••••••', style: { width: '220px' } }), tag(T('Prêt (démo)', 'Ready (demo)'), 'ok'))),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('Démarrage et mises à jour', 'Startup and updates')), kv(T('À l’ouverture de session', 'At login'), sw('login')), kv(T('Mises à jour', 'Updates'), sw('auto'), E('span', 'hz-s', T('Installer automatiquement', 'Install automatically'))), kv('', btn(T('Rechercher une mise à jour', 'Check for updates'), 'sm', () => note(T('HORIZONs est à jour.', 'HORIZONs is up to date.'))))),
      E('div', 'hz-card2', h('h3', { class: 'hz-h3' }, T('À propos', 'About')), kv('', btn(T('À propos de HORIZONs', 'About HORIZONs'), 'sm', aboutSheet)))));
  }
  function activation() {
    let b2;
    const key = h('input', { class: 'hz-in', placeholder: 'XXXX-XXXX-XXXX-XXXX', disabled: st.activated });
    const s = sheet(h('h2', {}, T('Version complète', 'Full version')), E('p', 'hz-m', st.activated ? T('Cette copie est activée : toutes les fonctions sont débloquées.', 'This copy is activated: all features are unlocked.') : T('Vous utilisez la version de démonstration, dont certaines fonctions sont limitées. L’activation complète est payante ; elle débloque toutes les fonctions.', 'You are using the demo version, in which some features are limited. Full activation is paid; it unlocks every feature.')),
      st.activated ? null : E('div', 'hz-fld', h('label', {}, T('Clé d’activation', 'Activation key')), key), E('p', 'hz-s', T('Démo : le site de démonstration n’active rien et n’envoie aucune donnée.', 'Demo: this showcase activates nothing and sends no data.')),
      E('div', 'hz-bt', btn(T('Fermer', 'Close'), '', closeSheet), st.activated ? null : (b2 = btn(T('Activer', 'Activate'), 'amb', () => { st.activated = true; closeSheet(); note(T('Version complète activée (simulation).', 'Full version activated (simulation).')); render(); }))));
    s.style.width = '440px';
  }
  function aboutSheet() {
    const s = sheet(E('div', 'hz-abt', h('img', { src: icon(app.id), alt: '', width: 64, height: 64 }), E('div', '', h('h2', { html: bn() }), E('div', 'hz-m', T('Version ', 'Version ') + VERSION + ' · ' + (st.activated ? T('complète', 'full') : T('démonstration', 'demo'))))),
      E('p', 'hz-m', T('Recherche de logement en location : annonces triées selon vos critères, suivi de chaque dossier, pièces justificatives chiffrées sur votre Mac et dossier PDF filigrané. Tout reste sur votre Mac.', 'Rental home search: listings sorted by your criteria, follow-up of each application, supporting documents encrypted on your Mac and a watermarked PDF file. Everything stays on your Mac.')),
      E('p', 'hz-s', 'Starbudweiser & Claude Code (Anthropic) · © 2026'), E('div', 'hz-bt', btn(T('Terminé', 'Done'), 'pri', closeSheet)));
    s.style.width = '420px';
  }

  w.cleanup = () => { timers.forEach(clearTimeout); sheetEl = null; };
  render();
  return root;
}
