/* CAREERDeSK : réplique de l'appli (Socle : sombre, plat). Vues : Aujourd'hui, Offres (collecte, texte collé, score, analyse IA), Candidatures (liste ou pipeline par étape,
   relance, lettre rédigée par l'IA), Entreprises (enrichissement depuis les registres officiels), Mon dossier. Version de démonstration limitée : l'activation complète, payante,
   débloque les fonctions marquées d'un cadenas. Toutes les données sont fictives, rien n'est lu, envoyé ni écrit : l'IA et la collecte sont simulées. */
import { h, brand, wait, reduced, stream, toast, icon, sfx, wm, T, css, dlBtn, aiBadge } from './kit.js';

const CSS = 'css/demos/CAREERDeSK.css';
const NAME = 'CAREERDeSK';
const nb = () => brand(NAME, 'var(--s-acct)');
const PROFILE = ['Photoshop', 'Illustrator', 'InDesign', 'Figma', 'After Effects'];
const SVG = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  jobs: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>', apps: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  co: '<path d="M4 21V5l8-2v18M12 9h8v12M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2"/>', me: '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  check: '<path d="m5 12 5 5 9-10"/>', bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
};
const ic = (k, s = 15) => h('span', { class: 'cd-ic', html: `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[k]}</svg>` });
const dv = (c, ...k) => h('div', { class: c }, ...k.flat(Infinity));
const sp = (c, ...k) => h('span', { class: c }, ...k.flat(Infinity));
const bar = (cls, pct) => dv('cd-bar', h('div', { class: 'cd-fill ' + cls, style: { width: pct + '%' } }));
const fill = (el, ...k) => { el.replaceChildren(...k.flat(Infinity).filter(x => x != null && x !== false)); return el; };
const day = o => { const d = new Date(); d.setDate(d.getDate() + o); return d; };
const fd = o => day(o).toLocaleDateString(T('fr-FR', 'en-GB'), { day: 'numeric', month: 'short', year: 'numeric' });
const money = n => (n == null ? '—' : T(`${Math.round(n / 1000)} k€`, `€${Math.round(n / 1000)}k`));
const when = o => (o == null ? '' : o < 0 ? T('en retard', 'overdue') : o === 0 ? T("aujourd'hui", 'today') : o === 1 ? T('demain', 'tomorrow') : T(`dans ${o} j`, `in ${o} d`));

/* ---------- données d'exemple (fictives) ---------- */
const STG = () => [['toSend', T('À envoyer', 'To send')], ['sent', T('Envoyée', 'Sent')], ['follow', T('À relancer', 'To follow up')], ['interview', T('Entretien', 'Interview')], ['offer', T('Proposition', 'Offer')], ['rejected', T('Refusée', 'Declined')]];
const stName = k => STG().find(s => s[0] === k)[1];
const HL = { good: ['Saine', 'Healthy', 'ok'], watch: ['À surveiller', 'To watch', 'wn'], unknown: ['Santé inconnue', 'Health unknown', ''] };
function makeData() {
  const co = (id, name, city, act, size, health, rich, x = {}) => ({ id, name, city, act: T(...act), size: T(...size), health, rich, ...x });
  const cos = [
    co('lumen', 'Atelier Lumen Création', 'Nantes', ['Agence de publicité', 'Advertising agency'], ['10 à 19 salariés', '10 to 19 employees'], 'good', 1, { siren: '900 100 201', form: 'SAS', naf: '73.11Z', born: 2014, boss: ['Hélène Orsay', T('Présidente', 'President')], ca: [1305000, 1450000], net: 96000 }),
    co('brume', 'Studio Brume & Fils', 'Nantes', ['Design spécialisé', 'Specialised design'], ['3 à 5 salariés', '3 to 5 employees'], 'watch', 1, { siren: '900 100 302', form: 'SARL', naf: '74.10Z', born: 2018, boss: ['Marc Delorme', T('Gérant', 'Manager')], ca: [342000, 380000], net: -22000 }),
    co('opale', 'Maison Opale Éditions', 'Angers', ['Édition de livres', 'Book publishing'], ['50 à 99 salariés', '50 to 99 employees'], 'good', 1, { siren: '900 100 403', form: 'SA', naf: '58.11Z', born: 2003, boss: ['Julien Vasseur', T('Directeur général', 'CEO')], ca: [8300000, 9200000], net: 410000 }),
    co('vent', 'Coopérative Vent Debout', 'Rennes', ['Spectacle vivant', 'Live performance'], ['20 à 49 salariés', '20 to 49 employees'], 'good', 1, { siren: '900 100 504', form: 'SCOP', naf: '90.01Z', born: 2011, boss: ['Inès Barrau', T('Co-gérante', 'Co-manager')], ca: [1900000, 2100000], net: 54000 }),
    co('pixel', 'Pixelfarm Interactive', 'Nantes', ['Programmation informatique', 'Software development'], ['10 à 19 salariés', '10 to 19 employees'], 'good', 1, { siren: '900 100 605', form: 'SAS', naf: '62.01Z', born: 2020, boss: ['Sacha Pelletier', T('Président', 'President')], ca: [990000, 1100000], net: 38000 }),
    co('nord', 'Cabinet Nordique Conseil', 'Lyon', ['Conseil de gestion', 'Management consulting'], ['100 à 199 salariés', '100 to 199 employees'], 'watch', 1, { siren: '900 100 807', form: 'SAS', naf: '70.22Z', born: 2008, boss: ['Rosalie Maurel', T('Présidente', 'President')], ca: [17900000, 18400000], net: -310000 }),
    co('aube', 'Association Aube Claire', 'Saint-Nazaire', ['Organisation à adhésion', 'Membership organisation'], ['6 à 9 salariés', '6 to 9 employees'], 'unknown', 0, { siren: '900 100 100', form: T('Association', 'Association'), naf: '94.99Z', born: 2009, boss: ['Paul Garnier', T('Directeur', 'Director')], ca: [610000, 640000], net: 8000 }),
    co('marmelade', 'Studio Marmelade Animation', 'Rennes', ['Production audiovisuelle', 'Audiovisual production'], ['6 à 9 salariés', '6 to 9 employees'], 'good', 0, { siren: '900 101 100', form: 'SAS', naf: '59.11A', born: 2016, boss: ['Zoé Tanguy', T('Présidente', 'President')], ca: [860000, 920000], net: 41000 }),
    co('aurore', 'Imprimerie Nouvelle Aurore', 'Saint-Herblain', ['Imprimerie', 'Printing'], ['20 à 49 salariés', '20 to 49 employees'], 'watch', 1, { siren: '900 101 009', form: 'SAS', naf: '18.12Z', born: 1989, boss: ['Bruno Esnault', T('Président', 'President')], ca: [4700000, 4800000], net: -150000 }),
    co('cerf', 'Théâtre du Grand Cerf', 'Angers', ['Salle de spectacles', 'Performing arts venue'], ['20 à 49 salariés', '20 to 49 employees'], 'good', 1, { siren: '900 100 908', form: T('Association', 'Association'), naf: '90.04Z', born: 1998, boss: ['Lucie Marchal', T('Directrice', 'Director')], ca: [3200000, 3300000], net: 21000 }),
    co('trois', 'Librairie des Trois Ponts', 'Nantes', ['Librairie', 'Bookshop'], ['3 à 5 salariés', '3 to 5 employees'], 'good', 1, { siren: '900 101 201', form: 'SARL', naf: '47.61F', born: 2012, boss: ['Mathis Rolland', T('Gérant', 'Manager')], ca: [590000, 610000], net: 12000 })];
  const DESC = T('Rattaché(e) à la direction artistique, vous concevez et déclinez les supports de communication des clients (print, web, réseaux) et suivez la fabrication jusqu\'à la livraison.', 'Reporting to the art director, you design and adapt client communication materials (print, web, social) and follow production through to delivery.');
  const job = (id, title, co, city, ct, sal, sk, score, days, st, src = 'France Travail') => ({ id, title: T(...title), co, city, ct, sal, sk, score, days, st, src, desc: DESC });
  const jobs = [
    job('g1', ['Graphiste maquettiste (H/F)', 'Layout graphic designer (M/F)'], 'lumen', 'Nantes (44)', 'CDI', [32000, 36000], ['Photoshop', 'Illustrator', 'InDesign'], 92, 1, 'applied'),
    job('g4', ['Motion designer', 'Motion designer'], 'pixel', 'Nantes (44)', 'CDI', [34000, 40000], ['After Effects', 'Figma'], 88, 4, 'applied', 'Apec'),
    job('g3', ['Chargé(e) de communication visuelle', 'Visual communication officer'], 'opale', 'Angers (49)', 'CDI', [30000, 34000], ['InDesign', 'Photoshop'], 76, 3, 'applied', 'Adzuna'),
    job('g2', ['Directeur(trice) artistique junior', 'Junior art director'], 'brume', 'Nantes (44)', 'CDD', [26400, 31200], ['Illustrator', 'Figma'], 81, 2, 'applied', 'Welcome to the Jungle'),
    job('g7', ['Assistant(e) de production graphique', 'Graphic production assistant'], 'vent', 'Rennes (35)', 'CDD', [22800, 25200], ['Photoshop', 'InDesign'], 74, 7, 'applied'),
    job('g6', ['Responsable studio graphique', 'Graphic studio manager'], 'nord', 'Lyon (69)', 'CDI', [42000, 48000], ['Figma', 'InDesign', 'Gestion de projet'], 58, 6, 'applied', T('Site carrière', 'Careers site')),
    job('g5', ['Graphiste, service communication', 'Graphic designer, communication team'], 'aube', 'Saint-Nazaire (44)', 'CDD', null, ['Illustrator', 'InDesign'], 69, 5, 'new', T('Emploi public', 'Public sector')),
    job('g8', ['Designer d\'interface (UI)', 'UI designer'], 'pixel', 'Nantes (44)', 'Freelance', [350, 450], ['Figma', 'Sketch'], 64, 9, 'new', 'LinkedIn'),
    job('g10', ['Illustrateur(trice) éditorial(e)', 'Editorial illustrator'], 'opale', 'Angers (49)', 'Freelance', null, ['Illustrator', 'Photoshop'], 82, 12, 'new', 'Welcome to the Jungle'),
    job('g11', ['Community manager visuel', 'Visual community manager'], 'brume', 'Nantes (44)', 'CDD', [24000, 27600], ['Photoshop', 'Canva'], 55, 14, 'new', 'Adzuna')];
  const ap = (id, job, co, title, stage, contact, email, due, hist, prio = 0) => ({ id, job, co, title, stage, contact, email, due, hist, prio, docs: [] });
  const H = (o, fr, en) => [o, T(fr, en)];
  const apps = [
    ap('a2', 'g4', 'pixel', jobs[1].title, 'sent', 'Sacha Pelletier', 'jobs@pixelfarm.example', -1, [H(-8, 'Candidature envoyée via la plateforme', 'Application sent through the platform')], 2),
    ap('a7', null, 'aube', T('Candidature spontanée', 'Unsolicited application'), 'offer', 'Paul Garnier', 'direction@aube-claire.example', null, [H(-10, 'Appel avec Paul Garnier : proposition reçue', 'Call with Paul Garnier: offer received')], 3),
    ap('a4', 'g2', 'brume', jobs[3].title, 'toSend', '', '', 1, [], 3),
    ap('a5', 'g7', 'vent', jobs[4].title, 'toSend', '', '', null, []),
    ap('a1', 'g1', 'lumen', jobs[0].title, 'interview', 'Hélène Orsay', 'contact@atelier-lumen.example', 2, [H(-12, 'Candidature envoyée', 'Application sent'), H(-6, 'Réponse : invitation à un entretien', 'Reply: invitation to an interview'), H(2, 'Entretien avec Hélène Orsay', 'Interview with Hélène Orsay')], 2),
    ap('a3', 'g3', 'opale', jobs[2].title, 'follow', 'Aurélie Tessier', 'rh@opale-editions.example', 0, [H(-15, 'Candidature envoyée', 'Application sent'), H(-7, 'Relance envoyée', 'Follow-up sent')]),
    ap('a6', 'g6', 'nord', jobs[5].title, 'sent', '', '', 4, [H(-5, 'Candidature envoyée par LinkedIn', 'Application sent through LinkedIn')], 1),
    ap('a8', null, 'lumen', T('Infographiste print (H/F)', 'Print graphic artist (M/F)'), 'rejected', '', '', null, [H(-25, 'Candidature envoyée', 'Application sent'), H(-9, 'Réponse négative', 'Negative reply')])];
  return { cos, jobs, apps, mailed: 0 };
}

/* Textes écrits d'avance par la « IA » (les lettres restent en français, comme dans l'appli). */
const letter = (j, c) => `Madame, Monsieur,\n\nDepuis six ans, je transforme des idées en supports clairs et chaleureux : identités visuelles, éditions imprimées, campagnes pour le web. Votre offre « ${j.title} » à ${j.city.replace(/ \(\d+\)/, '')} décrit exactement le travail que je voudrais faire chez ${c.name}.\n\nChez Les Quatre Vents, j'ai refondu douze identités visuelles et mis en place une chaîne de production qui a réduit de moitié les allers-retours avec l'imprimeur. Je travaille chaque jour avec ${j.sk.filter(s => PROFILE.includes(s)).join(', ') || 'Illustrator'}, et je suis à l'aise pour suivre un projet de la première maquette à la livraison.\n\nJe serais heureuse de vous montrer mon portfolio et d'échanger sur vos prochains projets.\n\nCordialement,\nCamille Lavande`;
const relance = (a, c) => `Bonjour ${a.contact || ''},\n\nJe me permets de revenir vers vous au sujet de ma candidature au poste « ${a.title} », envoyée il y a une semaine. Elle m'est toujours chère : l'univers de ${c.name} correspond à ce que je sais faire.\n\nSi mon profil vous intéresse, je suis disponible pour un échange à votre convenance.\n\nBien cordialement,\nCamille Lavande`;
const analysis = j => {
  const ok = j.sk.filter(s => PROFILE.includes(s)), no = j.sk.filter(s => !PROFILE.includes(s));
  return T(`Verdict : ${j.score >= 80 ? 'fort' : j.score >= 65 ? 'moyen' : 'faible'}.\n\nVous couvrez ${ok.length} outil(s) sur ${j.sk.length} demandé(s) (${ok.join(', ') || 'aucun'}).\n${no.length ? 'À combler : ' + no.join(', ') + '.\n' : ''}\nConseils : mettez en avant la refonte de douze identités visuelles et la chaîne de production print ; joignez un portfolio de trois projets.\nQuestions utiles : quelle est la part de print et de web ? L'équipe compte-t-elle un directeur artistique ?`,
    `Verdict: ${j.score >= 80 ? 'strong' : j.score >= 65 ? 'moderate' : 'weak'}.\n\nYou cover ${ok.length} of ${j.sk.length} requested tools (${ok.join(', ') || 'none'}).\n${no.length ? 'To bridge: ' + no.join(', ') + '.\n' : ''}\nAdvice: highlight the twelve brand identities you redesigned and the print production workflow; attach a three-project portfolio.\nUseful questions: what is the print/web split? Does the team have an art director?`);
};

/* ---------- fenêtre ---------- */
export function open(app) {
  css(CSS);
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1020, h: 650, minw: 760, minh: 500, bare: true, cls: 'socle', onclose: w => { w.dead = true; },
    build: w => {
      const D = makeData(), by = (l, id) => D[l].find(x => x.id === id);
      const st = { view: 'today', jobTab: 'new', jobSel: null, appMode: 'list', appSel: 'a2', coSel: null, open: new Set() };
      const root = h('div', { class: 'cdesk', tabindex: '-1' });
      const side = h('nav', { class: 'cd-side' }), main = h('div', { class: 'cd-main' });
      const alive = () => !w.dead;
      const go = (v, x = {}) => { Object.assign(st, x, { view: v }); sfx.tick(); draw(); };

      /* feuille modale plate (Échap ferme) */
      function sheet({ title, body, foot, width = 460 }) {
        const card = h('div', { class: 'cd-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, style: { width: width + 'px' } }, h('div', { class: 'cd-st' }, title), h('div', { class: 'cd-sb' }, body), foot ? h('div', { class: 'cd-sf' }, foot) : null);
        const back = h('div', { class: 'cd-back' }, card);
        const close = () => { back.remove(); root.focus({ preventScroll: true }); };
        back.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
        back.addEventListener('mousedown', e => { if (e.target === back) close(); });
        root.append(back); (card.querySelector('.acc,input,textarea,button') || card).focus?.({ preventScroll: true });
        return { close, card };
      }
      /* fonction de l'activation complète */
      const locked = what => {
        sfx.click();
        const s = sheet({ title: T('Fonction de l’activation complète', 'Full activation feature'), width: 470,
          body: [h('p', {}, T(`« ${what} » est débloqué par l’activation complète de `, `“${what}” is unlocked by the full activation of `), h('b', { html: nb() }), T('. Cette démonstration est une version limitée : l’activation complète, payante, lève ces limites.', '. This demo is a limited version: the paid full activation lifts these limits.')),
            h('p', { class: 'mut' }, T('Rien n’est envoyé ni enregistré dans cette démonstration.', 'Nothing is sent or saved in this demo.'))],
          foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Plus tard', 'Later')), dlBtn(app)] });
      };
      const lockBtn = (label, what, cls = '') => h('button', { class: 'sbtn cd-lk ' + cls, onclick: () => locked(what ?? label) }, ic('lock', 13), label);

      /* ---------- pièces communes ---------- */
      const badge = (txt, k = '') => sp('cd-bd ' + k, txt);
      const scoreTxt = s => (s >= 80 ? [T('Très bien pour vous', 'Great match'), 'ok'] : s >= 65 ? [T('Bien pour vous', 'Good match'), 'ac'] : [T('Assez bien', 'Fair match'), 'wn']);
      const jobSub = j => `${by('cos', j.co).name} · ${j.city} · ${j.ct}`;
      const dueApps = () => D.apps.filter(a => a.stage === 'follow' || (a.stage === 'sent' && a.due != null && a.due <= 0));
      const toSend = () => D.apps.filter(a => a.stage === 'toSend');
      const bucket = a => (['toSend', 'follow'].includes(a.stage) || (a.stage === 'sent' && a.due != null && a.due <= 0) || a.stage === 'offer' ? 0 : a.stage === 'rejected' ? 2 : 1);
      const nextAct = a => {
        const c = by('cos', a.co).name;
        return { toSend: [T(`Envoyer votre candidature à ${c}.`, `Send your application to ${c}.`), 'neu'], sent: a.due != null && a.due <= 0 ? [T(`Relancer ${c} aujourd'hui.`, `Follow up with ${c} today.`), 'wn'] : [T(`Attendre la réponse de ${c}.`, `Wait for ${c}'s reply.`), 'ac'],
          follow: [T(`Relancer ${c} aujourd'hui.`, `Follow up with ${c} today.`), 'wn'], interview: [T(`Préparer l'entretien avec ${c}.`, `Prepare the interview with ${c}.`), 'ok'], offer: [T(`Répondre à la proposition de ${c}.`, `Reply to the offer from ${c}.`), 'wn'], rejected: [T('Terminée.', 'Closed.'), 'neu'] }[a.stage];
      };
      const addApp = j => {
        if (D.apps.some(a => a.job === j.id || (!by('jobs', j.id) && a.co === j.co && a.title === j.title))) return;
        D.apps.unshift({ id: 'n' + D.apps.length, job: by('jobs', j.id) ? j.id : null, co: j.co, title: j.title, stage: 'toSend', contact: '', email: '', due: null, hist: [[0, T('Candidature créée depuis l’offre', 'Application created from the job')]], prio: 0, docs: [] });
        j.st = 'applied'; sfx.pop();
      };

      /* ---------- rédaction assistée (IA simulée) ---------- */
      function writer(a, kind) {
        const c = by('cos', a.co), j = a.job ? by('jobs', a.job) : { title: a.title, city: c.city, sk: PROFILE.slice(0, 2) };
        const label = kind === 'relance' ? T('Lettre de relance', 'Follow-up letter') : T('Lettre de motivation', 'Cover letter');
        const out = h('textarea', { class: 'cd-ta', spellcheck: 'false', readonly: true, 'aria-label': label }), note = h('small', { class: 'mut' });
        let token = 0;
        const gen = async () => {
          const me = ++token; save.disabled = true; again.disabled = true;
          note.textContent = T('Rédaction à partir de l’offre, de votre profil et du ton choisi…', 'Writing from the job post, your profile and the chosen tone…');
          const text = kind === 'relance' ? relance(a, c) : letter(j, c);
          out.readOnly = true; out.value = ''; let i = 0;
          if (reduced()) out.value = text; else while (i < text.length && me === token && alive()) { i += 5; out.value = text.slice(0, i); out.scrollTop = out.scrollHeight; if (i % 25 === 0) sfx.tick(); await wait(16); }
          if (me !== token) return; out.value = text; out.readOnly = false; save.disabled = false; again.disabled = false;
          note.textContent = T('Relisez et corrigez : l’IA propose, vous décidez. Rien n’est envoyé.', 'Read and edit: the AI suggests, you decide. Nothing is sent.');
        };
        const save = h('button', { class: 'sbtn acc', onclick: () => { a.docs.push({ t: label + ' : ' + c.name, k: label, o: 0 }); a.hist.push([0, T(`${label} enregistrée`, `${label} saved`)]); s.close(); sfx.done(); st.open.add(a.id + 'doc'); draw(); toast({ icon: icon(app.id), title: NAME, body: T('Lettre enregistrée dans la candidature.', 'Letter saved in the application.') }); } }, T('ENREGISTRER', 'SAVE'));
        const again = h('button', { class: 'sbtn', onclick: () => { sfx.click(); gen(); } }, T('Nouvelle version', 'New version'));
        const s = sheet({ title: label + ' : ' + c.name, width: 600,
          body: [dv('cd-row', aiBadge(T('IA', 'AI')), note), out, h('small', { class: 'mut' }, T('', 'Letters are written in French, as in the app.'))],
          foot: [lockBtn(T('Exporter en PDF', 'Export as PDF'), T('Exporter en PDF', 'Export as PDF')), h('button', { class: 'sbtn', onclick: () => { navigator.clipboard?.writeText(out.value).catch(() => {}); toast({ icon: icon(app.id), title: NAME, body: T('Texte copié.', 'Text copied.') }); } }, T('Copier', 'Copy')), again, save] });
        gen();
      }

      /* ---------- collecte d'offres (simulée) ---------- */
      const POOL = () => [
        { id: 'p1', title: T('Graphiste packaging (H/F)', 'Packaging graphic designer (M/F)'), co: 'aurore', city: 'Saint-Herblain (44)', ct: 'CDI', sal: [30000, 34000], sk: ['Illustrator', 'Photoshop'], score: 84, days: 0, src: 'France Travail' },
        { id: 'p2', title: T('Motion designer junior', 'Junior motion designer'), co: 'marmelade', city: 'Rennes (35)', ct: 'CDD', sal: [25200, 28800], sk: ['After Effects', 'Photoshop'], score: 86, days: 0, src: 'Adzuna' },
        { id: 'p3', title: T('Chargé(e) de communication', 'Communication officer'), co: 'cerf', city: 'Angers (49)', ct: 'CDI', sal: [29000, 33000], sk: ['InDesign', 'Figma'], score: 73, days: 0, src: T('Emploi public', 'Public sector') }];
      function collect() {
        const srcs = [['France Travail', 1], ['Adzuna', 1], [T('Emploi public', 'Public sector'), 1], [T('Pages surveillées', 'Watched pages'), 0]].map(([n, on]) => ({ n, on })), log = h('div', { class: 'cd-log' });
        const go_ = h('button', { class: 'sbtn acc', onclick: run }, T('RECHERCHER', 'SEARCH'));
        const boxes = srcs.map(x => { const cb = h('span', { class: 'cb' + (x.on ? ' on' : '') }, x.on ? '✓' : ''), b = h('button', { class: 'cd-chk', role: 'checkbox', 'aria-checked': !!x.on, onclick: () => { x.on = !x.on; b.setAttribute('aria-checked', x.on); cb.className = 'cb' + (x.on ? ' on' : ''); cb.textContent = x.on ? '✓' : ''; sfx.tick(); } }, cb, x.n); return b; });
        const kw = h('input', { class: 'cd-in', value: T('graphiste, motion', 'graphic designer, motion'), 'aria-label': T('Mots-clés', 'Keywords') });
        async function run() {
          go_.disabled = true; log.replaceChildren();
          const rows = srcs.filter(x => x.on); let n = 0;
          for (const { n: name } of rows) { const r = h('div', { class: 'cd-lr' }, sp('', name), sp('mut', '…')); log.append(r); if (!reduced()) await wait(520); if (!alive()) return; n = Math.min(3, n + 1); r.lastChild.textContent = T(`${n === 1 ? 6 : 4} offres lues`, `${n === 1 ? 6 : 4} jobs read`); r.lastChild.className = 'ok'; sfx.tick(); }
          const add = POOL().filter(p => !D.jobs.some(j => j.id === p.id)).map(p => ({ ...p, st: 'new', desc: D.jobs[0].desc, fresh: 1 }));
          D.jobs.unshift(...add); st.jobTab = 'new'; st.jobSel = add[0]?.id ?? null; sfx.done(); draw();
          log.append(h('div', { class: 'cd-lr' }, sp('ok', T(`${add.length} nouvelles offres triées par adéquation avec votre profil.`, `${add.length} new jobs ranked by fit with your profile.`))));
          go_.textContent = T('FERMER', 'CLOSE'); go_.disabled = false; go_.onclick = () => s.close();
        }
        const s = sheet({ title: T('Chercher de nouvelles offres', 'Search for new jobs'), width: 520,
          body: [h('p', { class: 'mut' }, T('Sources officielles et pages que vous avez choisies : rien d’exploré sans votre demande.', 'Official sources and pages you chose: nothing is crawled without your request.')), h('div', { class: 'cd-chks' }, boxes), kw, log, h('p', { class: 'mut cd-demo' }, ic('lock', 12), T('Démo : 3 résultats par recherche. L’activation complète les lève.', 'Demo: 3 results per search. Full activation lifts the limit.'))],
          foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), go_] });
      }
      function paste() {
        const ta = h('textarea', { class: 'cd-ta cd-short', 'aria-label': T('Texte de l’annonce', 'Job post text'), value: T('Librairie des Trois Ponts recrute un(e) directeur(trice) artistique print (CDI), Nantes. Vous concevez nos catalogues et affiches. Maîtrise d’InDesign et Photoshop. 31 à 35 k€.', 'Librairie des Trois Ponts is hiring a print art director (permanent), Nantes. You design our catalogues and posters. InDesign and Photoshop required. €31-35k.') });
        const ok = h('button', { class: 'sbtn acc', onclick: async () => { ok.disabled = true; ok.textContent = '…'; if (!reduced()) await wait(700); if (!alive()) return; const j = { id: 'pp', title: T('Directeur(trice) artistique print', 'Print art director'), co: 'trois', city: 'Nantes (44)', ct: 'CDI', sal: [31000, 35000], sk: ['InDesign', 'Photoshop'], score: 77, days: 0, st: 'new', src: T('Texte collé', 'Pasted text'), desc: D.jobs[0].desc, fresh: 1 }; if (!by('jobs', 'pp')) D.jobs.unshift(j); st.jobTab = 'new'; st.jobSel = 'pp'; s.close(); sfx.done(); draw(); } }, T('ANALYSER', 'ANALYSE'));
        const s = sheet({ title: T('J’ai trouvé une annonce', 'I found a job post'), width: 540, body: [h('p', { class: 'mut' }, T('Collez le texte d’une annonce (LinkedIn, Indeed ou autre) : CAREERDeSK en extrait le poste, la société et le contrat. Rien n’est exploré automatiquement.', 'Paste a job post (LinkedIn, Indeed or other): CAREERDeSK extracts the role, company and contract. Nothing is crawled automatically.')), ta], foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), ok] });
      }

      /* ---------- vues ---------- */
      function viewToday() {
        const due = dueApps(), ts = toSend(), good = D.jobs.filter(j => j.st === 'new' && j.score >= 80).length, sent = D.apps.filter(a => a.stage !== 'toSend').length;
        const row = (t, p, btn) => dv('cd-task', dv('', h('b', {}, t), h('p', {}, p)), btn);
        return [dv('cd-head', dv('cd-date', day(0).toLocaleDateString(T('fr-FR', 'en-GB'), { weekday: 'long', day: 'numeric', month: 'long' })), h('h2', {}, T('Bonjour Camille. Voici ce que vous pouvez faire aujourd’hui.', 'Hello Camille. Here is what you can do today.'))),
          dv('cd-cols', dv('cd-card cd-grow', h('h3', {}, T('À faire aujourd’hui', 'To do today')),
            due.length ? row(T(`${due.length} relance${due.length > 1 ? 's' : ''} à faire`, `${due.length} follow-up${due.length > 1 ? 's' : ''} to send`), T(`Sans réponse depuis plusieurs jours : ${due.map(a => by('cos', a.co).name).join(', ')}. Un court message suffit.`, `No reply for several days: ${due.map(a => by('cos', a.co).name).join(', ')}. A short message is enough.`), h('button', { class: 'sbtn act', onclick: () => go('apps', { appSel: due[0].id }) }, T('Relancer', 'Follow up'))) : null,
            ts.length ? row(T(`${ts.length} candidature${ts.length > 1 ? 's' : ''} à envoyer`, `${ts.length} application${ts.length > 1 ? 's' : ''} to send`), T(`${ts.map(a => by('cos', a.co).name).join(', ')}. Écrivez la lettre, envoyez-la, puis passez-la à « Envoyée ».`, `${ts.map(a => by('cos', a.co).name).join(', ')}. Write the letter, send it, then move it to “Sent”.`), h('button', { class: 'sbtn', onclick: () => go('apps', { appSel: ts[0].id }) }, T('Préparer l’envoi', 'Prepare to send'))) : null,
            good ? row(T(`${good} offre${good > 1 ? 's' : ''} vous correspondent bien`, `${good} job${good > 1 ? 's' : ''} fit you well`), T('Lisez-les et ajoutez à vos candidatures celles qui vous intéressent.', 'Read them and add the ones you like to your applications.'), h('button', { class: 'sbtn', onclick: () => go('jobs', { jobTab: 'new' }) }, T('Voir les offres', 'See jobs'))) : null,
            !due.length && !ts.length && !good ? h('p', { class: 'mut' }, T('Rien d’urgent. Lancez une recherche pour trouver de nouvelles offres.', 'Nothing urgent. Run a search to find new jobs.')) : null),
          dv('cd-card cd-side2', h('h3', {}, T('Où vous en êtes', 'Where you stand')), dv('cd-stats', [[sent, T('envoyées', 'sent')], [D.apps.filter(a => a.stage === 'sent' || a.stage === 'follow').length, T('en attente', 'waiting')], [D.apps.filter(a => a.stage === 'interview').length, T('entretiens', 'interviews')]].map(([n, l]) => dv('', h('b', {}, String(n)), h('small', {}, l)))),
            h('p', { class: 'mut' }, T('Vous obtenez une réponse dans 50 % des cas, en 13 jours en moyenne.', 'You get a reply in 50% of cases, after 13 days on average.'))))];
      }

      function jobDetail(j) {
        const c = by('cos', j.co), ok = j.sk.filter(s => PROFILE.includes(s)), no = j.sk.filter(s => !PROFILE.includes(s)), [sl, sk] = scoreTxt(j.score), box = h('div', { class: 'cd-ai', 'aria-live': 'polite' });
        const sal = j.sal ? (j.sal[0] > 1000 ? `${money(j.sal[0])} – ${money(j.sal[1])} ${T('/ an', '/ yr')}` : `${j.sal[0]} – ${j.sal[1]} € ${T('/ jour', '/ day')}`) : T('Salaire non précisé', 'Salary not stated');
        return dv('cd-det', h('h2', {}, j.title), dv('cd-sub', jobSub(j)), dv('cd-chips', badge(sl, sk), badge(sal), badge(T('Source : ', 'Source: ') + j.src), badge(T(`il y a ${j.days || 0} j`, `${j.days || 0} d ago`))),
          dv('cd-sec', h('h4', {}, T('Adéquation avec votre dossier', 'Fit with your file')), dv('cd-meter', bar(sk, j.score), sp('', j.score + ' %')), dv('cd-tags', ok.map(s => badge('✓ ' + s, 'ok')), no.map(s => badge(s, 'neu')))),
          dv('cd-sec', h('h4', {}, T('L’annonce', 'The post')), h('p', {}, j.desc)),
          dv('cd-sec', dv('cd-row', h('h4', {}, T('Analyse de l’IA', 'AI analysis')), aiBadge(T('IA', 'AI'))), box, h('button', { class: 'sbtn', onclick: async e => { e.target.disabled = true; await stream(box, analysis(j), { alive, cps: 140 }); e.target.disabled = false; } }, T('Analyser avec l’IA', 'Analyse with AI'))),
          dv('cd-acts', j.st === 'new' ? [h('button', { class: 'sbtn', onclick: () => { j.st = 'dismissed'; st.jobSel = null; sfx.click(); draw(); } }, T('Écarter', 'Dismiss')), h('button', { class: 'sbtn', onclick: () => { j.st = 'kept'; sfx.click(); draw(); } }, T('Garder', 'Keep')), h('button', { class: 'sbtn act', onclick: () => { addApp(j); go('apps', { appSel: D.apps.find(a => a.job === j.id).id }); } }, T('Ajouter aux candidatures', 'Add to applications'))]
            : j.st === 'applied' ? [sp('mut', T('Déjà dans vos candidatures.', 'Already in your applications.')), h('button', { class: 'sbtn', onclick: () => go('apps', { appSel: (D.apps.find(a => a.job === j.id) || {}).id }) }, T('Ouvrir la candidature', 'Open the application'))]
            : [h('button', { class: 'sbtn', onclick: () => { j.st = 'new'; draw(); } }, T('Remettre à trier', 'Back to sort')), j.st === 'kept' ? h('button', { class: 'sbtn act', onclick: () => { addApp(j); go('apps', { appSel: D.apps.find(a => a.job === j.id).id }); } }, T('Ajouter aux candidatures', 'Add to applications')) : null]));
      }
      function viewJobs() {
        const tabs = [['new', T('À trier', 'To sort')], ['kept', T('Gardées', 'Kept')], ['dismissed', T('Écartées', 'Dismissed')]];
        const list = D.jobs.filter(j => (st.jobTab === 'new' ? j.st === 'new' : j.st === st.jobTab));
        if (!list.some(j => j.id === st.jobSel)) st.jobSel = list[0]?.id ?? null;
        const sel = st.jobSel && by('jobs', st.jobSel);
        return [dv('cd-bar2', h('h2', {}, T('Offres', 'Jobs')), dv('cd-tools', lockBtn(T('Recherches automatiques', 'Automatic searches'), T('Recherches automatiques chaque jour', 'Daily automatic searches')), h('button', { class: 'sbtn', onclick: paste }, T('J’ai trouvé une annonce', 'I found a job post')), h('button', { class: 'sbtn act', onclick: collect }, ic('search', 13), T('Chercher de nouvelles offres', 'Search for new jobs')))),
          dv('cd-tabs', tabs.map(([k, l]) => h('button', { class: st.jobTab === k ? 'on' : '', onclick: () => { st.jobTab = k; sfx.tick(); draw(); } }, l, k === 'new' ? sp('cd-n', String(D.jobs.filter(j => j.st === 'new').length)) : null))),
          dv('cd-split', dv('cd-list', list.length ? list.map(j => { const [l, k] = scoreTxt(j.score); return h('button', { class: 'cd-li' + (j.id === st.jobSel ? ' on' : '') + (j.fresh ? ' fresh' : ''), onclick: () => { st.jobSel = j.id; sfx.tick(); draw(); } }, h('b', {}, j.title), h('small', {}, jobSub(j)), sp('cd-sc ' + k, l)); }) : h('p', { class: 'mut cd-empty' }, T('Rien ici pour le moment.', 'Nothing here yet.'))),
            dv('cd-pane', sel ? jobDetail(sel) : h('p', { class: 'mut cd-empty' }, T('Sélectionnez une offre.', 'Select a job.'))))];
      }

      function stageBar(a) {
        const steps = [[T('Envoyée', 'Sent'), ['sent', 'follow', 'interview', 'offer', 'rejected']], [T('Relance', 'Follow-up'), ['follow', 'interview', 'offer', 'rejected']], [T('Entretien', 'Interview'), ['interview', 'offer']], [T('Réponse', 'Reply'), ['offer', 'rejected']]];
        return dv('cd-steps', steps.map(([l, on], i) => dv('cd-stp' + (on.includes(a.stage) ? ' on' : '') + (steps[i + 1] && !steps[i + 1][1].includes(a.stage) && on.includes(a.stage) ? ' cur' : ''), dv('cd-dot'), sp('', l))));
      }
      function appDetail(a) {
        const c = by('cos', a.co), [txt, k] = nextAct(a), isDue = k === 'wn' && a.stage !== 'offer';
        const mv = s => { a.stage = s; a.hist.push([0, T(`Étape : ${stName(s)}`, `Step: ${stName(s)}`)]); if (s === 'sent') a.due = 7; sfx.pop(); draw(); };
        const sect = (key, title, right, body) => dv('cd-acc' + (st.open.has(a.id + key) ? ' open' : ''), h('button', { class: 'cd-acch', 'aria-expanded': st.open.has(a.id + key), onclick: () => { const q = a.id + key; st.open.has(q) ? st.open.delete(q) : st.open.add(q); sfx.tick(); draw(); } }, h('b', {}, title), sp('mut', right), sp('cd-chev', '›')), st.open.has(a.id + key) ? dv('cd-accb', body) : null);
        return dv('cd-det', h('h2', {}, a.title), dv('cd-sub', `${c.name} · ${c.city} · ${T('priorité', 'priority')} ${[T('normale', 'normal'), T('basse', 'low'), T('haute', 'high'), T('urgente', 'urgent')][a.prio]}`),
          a.stage !== 'toSend' ? stageBar(a) : null,
          dv('cd-next ' + (isDue ? 'due' : k), h('b', {}, a.stage === 'toSend' ? T('Prochaine étape', 'Next step') : isDue ? T('C’est le moment de relancer', 'Time to follow up') : T('Prochaine étape', 'Next step')), h('p', {}, a.stage === 'follow' || isDue ? T('Sans réponse depuis 7 jours. L’IA rédige le message à partir de l’annonce et de la lettre que vous avez envoyée.', 'No reply for 7 days. The AI writes the message from the job post and the letter you sent.') : txt),
            dv('cd-acts l', a.stage === 'toSend' ? [h('button', { class: 'sbtn act', onclick: () => writer(a, 'lettre') }, T('Écrire la lettre', 'Write the letter')), h('button', { class: 'sbtn', onclick: () => mv('sent') }, T('Marquer comme envoyée', 'Mark as sent'))]
              : isDue ? [h('button', { class: 'sbtn act', onclick: () => writer(a, 'relance') }, T('Écrire la relance', 'Write the follow-up')), h('button', { class: 'sbtn', onclick: () => { a.stage = 'sent'; a.due = 3; sfx.click(); draw(); } }, T('Me le rappeler dans 3 jours', 'Remind me in 3 days'))]
              : a.stage === 'interview' ? [h('button', { class: 'sbtn act', onclick: () => toast({ icon: icon(app.id), title: NAME, body: T('Questions probables et points à préparer générés par l’IA (simulation).', 'Likely questions and talking points generated by the AI (simulation).') }) }, T('Préparer l’entretien', 'Prepare the interview'))] : [])),
          sect('c', T('Contact', 'Contact'), a.contact ? `${a.contact} · ${a.email}` : T('Aucun contact', 'No contact'), h('p', {}, a.contact ? `${a.contact} — ${a.email}` : T('Ajoutez le nom et l’e-mail de la personne à relancer.', 'Add the name and email of the person to follow up.'))),
          sect('doc', T('Lettre de motivation & lettre de relance', 'Cover letter & follow-up letter'), a.docs.length ? '' : T('Aucune', 'None'), [a.docs.map(d => dv('cd-doc', ic('mail'), dv('', h('b', {}, d.t), h('small', {}, `${d.k} · ${fd(0)}`)), h('button', { class: 'sbtn', onclick: () => toast({ icon: icon(app.id), title: NAME, body: T('Aperçu A4 ouvert dans l’appli (non simulé ici).', 'A4 preview opens in the app (not simulated here).') }) }, T('Ouvrir', 'Open')))), dv('cd-acts l', h('button', { class: 'sbtn', onclick: () => writer(a, 'lettre') }, T('Écrire', 'Write')))]),
          sect('s', T('Étape', 'Step'), stName(a.stage), dv('cd-seg', STG().map(([s, l]) => h('button', { class: a.stage === s ? 'on' : '', onclick: () => mv(s) }, l)))),
          sect('h', T('Notes et historique', 'Notes and history'), T(`${a.hist.length} échange${a.hist.length > 1 ? 's' : ''}`, `${a.hist.length} entr${a.hist.length > 1 ? 'ies' : 'y'}`), a.hist.length ? a.hist.slice().sort((x, y) => y[0] - x[0]).map(([o, t]) => dv('cd-ev', sp('mut', fd(o)), sp('', t))) : h('p', { class: 'mut' }, T('Aucun échange pour le moment.', 'No activity yet.'))),
          h('p', { class: 'mut cd-auto' }, T('Les modifications sont enregistrées automatiquement.', 'Changes are saved automatically.')));
      }
      function viewApps() {
        const sel = by('apps', st.appSel) || D.apps[0];
        const modes = [['list', T('Liste', 'List')], ['board', T('Par étape', 'By step')]];
        const head = dv('cd-bar2', h('h2', {}, T('Candidatures', 'Applications')), dv('cd-seg2', modes.map(([k, l]) => h('button', { class: st.appMode === k ? 'on' : '', onclick: () => { st.appMode = k; sfx.tick(); draw(); } }, l))), lockBtn(T('Trouver des entreprises', 'Find companies'), T('Prospection d’entreprises du métier', 'Prospecting companies in your field')));
        if (st.appMode === 'board') return [head, dv('cd-board', STG().map(([s, l]) => dv('cd-col', dv('cd-colh', l, sp('mut', String(D.apps.filter(a => a.stage === s).length))), D.apps.filter(a => a.stage === s).map(a => h('button', { class: 'cd-card2' + (s === 'rejected' ? ' dim' : ''), onclick: () => { st.appSel = a.id; st.appMode = 'list'; sfx.tick(); draw(); } }, h('b', {}, a.title), h('small', {}, by('cos', a.co).name), dv('cd-meta', a.job ? badge(by('jobs', a.job).ct) : null, a.job ? badge(scoreTxt(by('jobs', a.job).score)[0], scoreTxt(by('jobs', a.job).score)[1]) : null, a.due != null && s !== 'rejected' ? badge(when(a.due), a.due <= 0 ? 'wn' : '') : null))))))];
        const grp = [[T('À faire', 'To do'), 0], [T('En attente', 'Waiting'), 1], [T('Terminées', 'Finished'), 2]];
        return [head, dv('cd-split ap', dv('cd-list', grp.map(([t, b]) => { const rows = D.apps.filter(a => bucket(a) === b); return rows.length ? [dv('cd-gh', t, sp('mut', String(rows.length))), rows.map(a => { const [x, k] = nextAct(a); return h('button', { class: 'cd-li' + (a.id === sel.id ? ' on' : ''), onclick: () => { st.appSel = a.id; sfx.tick(); draw(); } }, h('b', {}, a.title), h('small', {}, by('cos', a.co).name), sp('cd-sc ' + k, x)); })] : null; })), dv('cd-pane', appDetail(sel)))];
      }

      function coDetail(c) {
        const fin = c.ca, delta = Math.round((fin[1] - fin[0]) / fin[0] * 100), [hl, he, hk] = HL[c.health], mx = Math.max(...fin);
        if (!c.rich) return dv('cd-det', h('h2', {}, c.name), dv('cd-sub', `${c.city} · ${c.act}`), dv('cd-sec', h('p', { class: 'mut' }, T('Pas encore enrichie. L’appli interroge la base officielle des entreprises (SIREN, dirigeants, comptes publiés) et en tire un indicateur de santé.', 'Not enriched yet. The app queries the official company registry (SIREN, leaders, published accounts) and derives a health indicator.')),
          dv('cd-log', c.steps || ''), h('button', { class: 'sbtn act', onclick: async e => { e.target.disabled = true; const log = e.target.previousSibling; log.replaceChildren(); for (const t of [T('Recherche du SIREN…', 'Looking up the SIREN…'), T('Dirigeants et forme juridique…', 'Leaders and legal form…'), T('Comptes publiés 2022-2023…', 'Published accounts 2022-2023…'), T('Indicateur de santé…', 'Health indicator…')]) { log.append(dv('cd-lr', sp('', t), sp('ok', '✓'))); sfx.tick(); if (!reduced()) await wait(480); if (!alive()) return; } c.rich = 1; sfx.done(); draw(); toast({ icon: icon(app.id), title: NAME, body: T(`${c.name} enrichie depuis le registre officiel.`, `${c.name} enriched from the official registry.`) }); } }, T('Enrichir depuis les registres', 'Enrich from official registries'))));
        const g = (l, v) => dv('cd-kv', h('small', {}, l), h('b', {}, v));
        return dv('cd-det', h('h2', {}, c.name), dv('cd-sub', `${c.city} · ${c.act}`), dv('cd-chips', badge(hl.length ? T(hl, he) : '', hk), badge(c.size), badge(c.form)),
          dv('cd-grid', g('SIREN', c.siren), g(T('Activité (NAF)', 'Activity (NAF)'), c.naf), g(T('Créée en', 'Founded'), String(c.born)), g(T('Dirigeant', 'Leader'), `${c.boss[0]}, ${c.boss[1]}`)),
          dv('cd-sec', h('h4', {}, T('Comptes publiés', 'Published accounts')), dv('cd-fin', [[2022, fin[0]], [2023, fin[1]]].map(([y, v]) => dv('cd-fr', sp('', String(y)), bar('ac', Math.round(v / mx * 100)), sp('', money(v))))), h('p', { class: 'mut' }, c.net >= 0 ? T(`Bénéficiaire en 2023 (${money(c.net)}), chiffre d’affaires ${delta >= 0 ? 'en hausse' : 'en baisse'} de ${Math.abs(delta)} % sur un an.`, `Profitable in 2023 (${money(c.net)}), revenue ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)}% year on year.`) : T(`Perte nette en 2023 (${money(c.net)}) : à surveiller avant de postuler.`, `Net loss in 2023 (${money(c.net)}): worth checking before applying.`))),
          dv('cd-acts', sp('mut', T(`${D.jobs.filter(j => j.co === c.id).length} offre(s) liée(s)`, `${D.jobs.filter(j => j.co === c.id).length} linked job(s)`)), h('button', { class: 'sbtn', onclick: () => { addApp({ id: 'sp' + c.id, title: T('Candidature spontanée', 'Unsolicited application'), co: c.id }); go('apps', { appSel: D.apps[0].id }); } }, T('Candidature spontanée', 'Unsolicited application'))));
      }
      function viewCos() {
        const sel = by('cos', st.coSel) || D.cos[0]; st.coSel = sel.id;
        return [dv('cd-bar2', h('h2', {}, T('Entreprises', 'Companies'), sp('cd-n', String(D.cos.length))), dv('cd-tools', lockBtn(T('Trouver des entreprises', 'Find companies'), T('Prospection d’entreprises du métier', 'Prospecting companies in your field')))),
          dv('cd-split co', dv('cd-table', dv('cd-th', sp('', T('Société', 'Company')), sp('', T('Ville', 'City')), sp('', T('Finances', 'Finances'))), D.cos.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => h('button', { class: 'cd-tr' + (c.id === sel.id ? ' on' : ''), onclick: () => { st.coSel = c.id; sfx.tick(); draw(); } }, dv('', h('b', {}, c.name), h('small', {}, c.act)), sp('', c.city), c.rich ? badge(T(HL[c.health][0], HL[c.health][1]), HL[c.health][2]) : badge(T('Non enrichie', 'Not enriched'))))), dv('cd-pane', coDetail(sel)))];
      }
      function viewMe() {
        const f = (l, v) => dv('cd-kv', h('small', {}, l), h('b', {}, v));
        return [dv('cd-bar2', h('h2', {}, T('Mon dossier', 'My file')), h('button', { class: 'sbtn', onclick: () => toast({ icon: icon(app.id), title: NAME, body: T('L’import du CV (PDF) remplit ce dossier par l’IA : non simulé ici.', 'Importing your CV (PDF) fills this file with AI: not simulated here.') }) }, T('Importer mon CV (.PDF)', 'Import my CV (.PDF)'))),
          dv('cd-me', dv('cd-meter', bar('ok', 100), sp('', T('100 % — votre dossier est complet', '100% — your file is complete'))),
            dv('cd-grid', f(T('Nom complet', 'Full name'), 'Camille Lavande'), f(T('Votre métier en une ligne', 'Your job in one line'), T('Graphiste et chargée de communication visuelle', 'Graphic designer and visual communication officer')), f(T('Ville', 'City'), 'Nantes'), f(T('Départements recherchés', 'Departments searched'), '44, 49'), f(T('Contrats souhaités', 'Desired contracts'), 'CDI, CDD'), f(T('Situation', 'Status'), T('En poste, ouverte aux opportunités', 'Employed, open to opportunities'))),
            dv('cd-sec', h('h4', {}, T('Savoir-faire', 'Skills')), dv('cd-tags', PROFILE.map(s => badge(s, 'ac')), [T('Identité visuelle', 'Brand identity'), T('Mise en page', 'Layout'), T('Motion design', 'Motion design')].map(s => badge(s)))),
            h('p', { class: 'mut' }, T('Ces informations servent à repérer les offres qui vous correspondent et à écrire vos lettres. Rien n’est inventé. Profil fictif.', 'This information is used to spot matching jobs and write your letters. Nothing is made up. Fictional profile.')))];
      }

      /* ---------- cadre ---------- */
      const NAV = [['today', T('Aujourd’hui', 'Today'), 'sun'], ['jobs', T('Offres', 'Jobs'), 'jobs'], ['apps', T('Candidatures', 'Applications'), 'apps'], ['companies', T('Entreprises', 'Companies'), 'co'], ['me', T('Mon dossier', 'My file'), 'me']];
      const badgeN = k => (k === 'jobs' ? D.jobs.filter(j => j.st === 'new').length : k === 'apps' ? dueApps().length : k === 'companies' ? D.cos.length : 0);
      function draw() {
        fill(side, h('div', { class: 'cd-logo', html: nb() }), NAV.map(([k, l, i]) => h('button', { class: 'cd-nav' + (st.view === k ? ' on' : ''), onclick: () => go(k) }, ic(i), sp('', l), badgeN(k) ? sp('cd-n' + (k === 'apps' ? ' wn' : ''), String(badgeN(k))) : null)),
          dv('cd-demo-card', h('b', {}, ic('lock', 12), T('Version de démonstration', 'Demo version')), h('small', {}, T('Fonctions limitées. L’activation complète, payante, les débloque.', 'Limited features. The paid full activation unlocks them.')), dlBtn(app)));
        const v = { today: viewToday, jobs: viewJobs, apps: viewApps, companies: viewCos, me: viewMe }[st.view];
        fill(main, v());
      }
      root.append(h('div', { class: 'cd-tb', 'data-drag': '' }, wm.lights(w), h('div', { class: 'cd-tt', html: nb() })), dv('cd-body', side, main));
      draw();
      return root;
    } });
}
