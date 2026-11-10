/* nEXUSWATCH : surveille les pages Nexus Mods et transforme les rapports de bugs en plan de développement, avec ou sans IA (optionnelle). */
import { icon } from '../core.js';
import { h, brand, wait } from '../util.js';
import { t, lang } from '../i18n.js';
import { sfx } from '../audio.js';
import * as wm from '../wm.js';
import { download } from '../apps.js';
import { toast } from '../system.js';
import { stream, aiBadge } from './ai.js';

const T = (fr, en) => (lang() === 'fr' ? fr : en);
const num = n => n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US');
const PRIO = () => ({ critical: [T('Critique', 'Critical'), 'dg', 0], high: [T('Haute', 'High'), 'wn', 1], medium: [T('Moyenne', 'Medium'), 'acc', 2], low: [T('Basse', 'Low'), 'mut', 3] });
const TRACK = () => [['triage', T('À trier', 'To triage')], ['progress', T('En cours', 'In progress')], ['released', T('Correctif publié', 'Fix released')]];

function mods() {
  return [
    { n: 'Ancient Realms HD', v: '1.3.2', unread: 3, stats: [[T('Téléchargements', 'Downloads'), 12480, 84], ['Endorsements', 1906, 12], [T('Téléch. uniques', 'Unique DLs'), 5233, 31]], spark: [4, 6, 5, 8, 7, 9, 12, 10, 14, 13, 16, 15],
      posts: [[T('Super mod, merci !', 'Great mod, thanks!'), 'aela_77', 0, 'praise'], [T('Plantage à Blancherive', 'Crash in Whiterun'), 'dovah_fan', 12, 'bug', 1], [T('Une version ESL est-elle prévue ?', 'Is an ESL version planned?'), 'light_master', 3, 'feature'], [T('Comment l’installer avec MO2 ?', 'How do I install it with MO2?'), 'new_nord', 5, 'question'], [T('Texture violette sur les armures', 'Purple texture on armors'), 'iron_nord', 4, 'bug', 2]],
      bugs: [
        { id: 1, title: T('Plantage au chargement de Blancherive', 'Crash when loading Whiterun'), prio: 'critical', who: 'dovah_fan', ago: T('2 j', '2 d'), track: 'triage', status: T('Ouvert', 'Open'),
          msg: T('Le jeu plante en entrant en ville par la porte nord depuis la 1.3.2. Journal joint : le crash arrive toujours au même endroit.', 'The game crashes when I enter the city from the north gate since 1.3.2. Log attached: the crash always happens at the same spot.'),
          action: T('Fournir un pack de textures 4K de remplacement.', 'Ship a replacement 4K texture pack.'), boost: 0,
          ai: { cause: T('Les textures de terrain 8K du nouveau pack dépassent la mémoire vidéo des cartes 8 Go. L’erreur survient au chargement de la cellule de Blancherive (BSTextureDB::Load dans le journal).', 'The 8K terrain textures of the new pack exceed the video memory of 8 GB cards. The error occurs when the Whiterun cell loads (BSTextureDB::Load in the log).'),
            fix: T('Publier un pack 4K, réduire les mipmaps du pack 8K et ajouter la configuration minimale sur la page du mod.', 'Release a 4K pack, reduce the 8K pack mipmaps and add the minimum setup to the mod page.'), test: T('Charger Blancherive sur une carte 8 Go avant et après le pack 4K.', 'Load Whiterun on an 8 GB card before and after the 4K pack.'), risk: T('Élevé : bloque tous les joueurs concernés.', 'High: blocks every affected player.') } },
        { id: 2, title: T('Texture violette sur les armures', 'Purple texture on armors'), prio: 'high', who: 'iron_nord', ago: T('3 j', '3 d'), track: 'triage', status: T('Ouvert', 'Open'),
          msg: T('Depuis la mise à jour, les armures lourdes apparaissent violettes.', 'Since the update, heavy armors show up purple.'), action: T('Corriger les chemins de texture dans les .nif.', 'Fix the texture paths in the .nif files.'), boost: 0,
          ai: { cause: T('Des fichiers de texture ont été renommés dans la 1.3.2 mais les .nif pointent encore vers les anciens noms.', 'Texture files were renamed in 1.3.2 but the .nif files still point to the old names.'), fix: T('Corriger les chemins dans les .nif ou restaurer les anciens noms de fichiers.', 'Fix the paths in the .nif files or restore the old file names.'), test: T('Équiper chaque armure lourde et vérifier le rendu.', 'Equip each heavy armor and check the rendering.'), risk: T('Moyen : visuel seulement.', 'Medium: visual only.') } },
        { id: 3, title: T('Ralentissements à Markarth', 'Slowdowns in Markarth'), prio: 'medium', who: 'stone_mage', ago: T('4 j', '4 d'), track: 'progress', status: T('Ouvert', 'Open'),
          msg: T('Les images par seconde sont divisées par deux à Markarth avec le mod actif.', 'Frames per second are cut in half in Markarth with the mod on.'), action: T('Alléger le script d’ambiance.', 'Lighten the ambience script.'), boost: -2,
          ai: { cause: T('Le script d’ambiance se relance toutes les 0,1 s pour chaque PNJ de la ville.', 'The ambience script re-runs every 0.1 s for each NPC in the city.'), fix: T('Passer l’intervalle à 1 s et ne traiter que les PNJ proches du joueur.', 'Raise the interval to 1 s and only process NPCs near the player.'), test: T('Mesurer les images par seconde pendant 60 s à Markarth.', 'Measure frames per second for 60 s in Markarth.'), risk: T('Moyen : gêne sans bloquer.', 'Medium: annoying, not blocking.') } },
        { id: 4, title: T('Option introuvable dans le MCM', 'Option missing in the MCM'), prio: 'low', who: 'quiet_scribe', ago: T('5 j', '5 d'), track: 'triage', status: T('Résolu d’après l’auteur', 'Solved per the author'),
          msg: T('Je ne trouve pas le réglage du rayon d’effet. — Ah, c’était dans l’onglet « Avancé », merci.', 'I cannot find the effect radius setting. — Ah, it was in the “Advanced” tab, thanks.'), action: T('Ajouter une infobulle vers l’onglet Avancé.', 'Add a tooltip pointing to the Advanced tab.'), boost: 0,
          ai: { cause: T('L’option existe, mais se trouve dans l’onglet « Avancé » du MCM.', 'The option exists but lives in the MCM “Advanced” tab.'), fix: T('Ajouter une infobulle et une ligne dans la description du mod.', 'Add a tooltip and a line in the mod description.'), test: T('Ouvrir le MCM et retrouver l’option en moins de dix secondes.', 'Open the MCM and find the option in under ten seconds.'), risk: T('Faible.', 'Low.') } }] },
    { n: 'Frost Patch', v: '2.0.1', unread: 0, stats: [[T('Téléchargements', 'Downloads'), 3920, 21], ['Endorsements', 410, 3], [T('Téléch. uniques', 'Unique DLs'), 1760, 9]], spark: [2, 3, 3, 4, 3, 5, 4, 4, 6, 5, 5, 6], posts: [[T('Merci pour le patch', 'Thanks for the patch'), 'frosty', 0, 'praise']],
      bugs: [{ id: 1, title: T('Conflit avec un mod de météo', 'Clash with a weather mod'), prio: 'high', who: 'cold_front', ago: T('1 j', '1 d'), track: 'triage', status: T('Ouvert', 'Open'), msg: T('Le brouillard disparaît quand les deux mods sont actifs.', 'Fog disappears when both mods are on.'), action: T('Ajuster l’ordre de chargement et publier un patch.', 'Adjust the load order and ship a patch.'), boost: 0,
        ai: { cause: T('Les deux mods écrasent le même enregistrement de météo.', 'Both mods override the same weather record.'), fix: T('Déplacer le patch après le mod de météo.', 'Move the patch after the weather mod.'), test: T('Lancer une tempête de neige et vérifier le brouillard.', 'Trigger a snowstorm and check the fog.'), risk: T('Moyen.', 'Medium.') } }] },
    { n: 'Dragon Rework', v: '0.9.4', unread: 1, stats: [[T('Téléchargements', 'Downloads'), 780, 6], ['Endorsements', 95, 1], [T('Téléch. uniques', 'Unique DLs'), 402, 4]], spark: [1, 1, 2, 1, 2, 2, 3, 2, 2, 3, 3, 3], posts: [[T('Les dragons volent à l’envers', 'Dragons fly backwards'), 'sky_watch', 2, 'bug', 1]],
      bugs: [{ id: 1, title: T('Les dragons volent à l’envers', 'Dragons fly backwards'), prio: 'medium', who: 'sky_watch', ago: T('6 h', '6 h'), track: 'triage', status: T('Ouvert', 'Open'), msg: T('Après un combat, le dragon repart en marche arrière.', 'After a fight, the dragon flies off backwards.'), action: T('Corriger le graphe d’animation.', 'Fix the animation graph.'), boost: 0,
        ai: { cause: T('Une variable d’animation reste à « recul » après la fin du combat.', 'An animation variable stays on “backward” after combat ends.'), fix: T('Réinitialiser la variable à la sortie du combat.', 'Reset the variable when combat ends.'), test: T('Provoquer trois combats de suite et observer le départ du dragon.', 'Trigger three fights in a row and watch the dragon leave.'), risk: T('Moyen.', 'Medium.') } }] }
  ];
}

export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1060, h: 650, minw: 860, minh: 500, bare: true, cls: 'socle', onclose: w => { w.dead = true; clearInterval(w.timer); },
    build: w => {
      const M = mods(); let mi = 0, tab = 'bugs', sel = 0, ai = true, jev = false, planAi = false;
      const root = h('div', { class: 'skw nxw' }), side = h('aside', { class: 'sside' }), main = h('main', { class: 'smain' });
      const aiSw = h('div', { class: 'ssegs' }), count = h('span', { class: 'mut mono' });
      root.append(h('div', { class: 'sbar', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('nEXUSWATCH', app.accent) }), h('span', { class: 'mut', style: { marginLeft: '10px' } }, T('Prochaine vérification dans ', 'Next check in '), count), aiSw), side, main);
      let secs = 252; count.textContent = '4:12'; w.timer = setInterval(() => { secs = secs > 0 ? secs - 1 : 299; count.textContent = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'); }, 1000);
      const alive = () => !w.dead;
      const cur = () => M[mi], bugs = () => cur().bugs;
      const drawAi = () => { aiSw.innerHTML = ''; aiSw.append(h('span', { class: 'mut' }, T('Assistance IA', 'AI support')), ...[[false, T('Sans IA', 'No AI')], [true, T('Claude', 'Claude')]].map(([v, l]) => h('button', { class: ai === v ? 'on' : '', onclick: () => { ai = v; sfx.tick(); draw(); } }, l))); };
      const drawSide = () => {
        side.innerHTML = ''; side.append(h('div', { class: 'sh' }, T('MODS SURVEILLÉS', 'WATCHED MODS')));
        M.forEach((m, i) => side.append(h('button', { class: 'sit' + (i === mi ? ' on' : ''), onclick: () => { mi = i; sel = 0; planAi = false; sfx.tick(); draw(); } }, h('span', {}, m.n), m.unread ? h('i', { class: 'badge' }, m.unread) : null)));
        side.append(h('div', { class: 'sh sp' }, T('SUIVI DE VERSION', 'VERSION WATCH')), h('div', { class: 'wrow' }, h('span', {}, 'SKSE64'), h('small', { class: 'ok mono' }, '2.2.6')), h('div', { class: 'wrow' }, h('span', {}, 'ENB Series'), h('small', { class: 'mut mono' }, 'v0.505')), h('div', { class: 'wrow' }, h('span', {}, 'Community Shaders'), h('small', { class: 'mut mono' }, '1.1.4')));
      };
      const tabs = () => h('div', { class: 'ntabs' }, [['stats', 'Stats'], ['posts', 'Posts'], ['bugs', 'Bugs'], ['audit', T('Audit', 'Audit')]].map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; sfx.tick(); draw(); } }, l, k === 'bugs' ? h('i', { class: 'badge' }, bugs().length) : null)));
      const head = () => h('div', { class: 'shead' }, h('div', {}, h('h3', {}, cur().n), h('div', { class: 'mut' }, 'v' + cur().v + ' · ' + T('Nexus Mods · Skyrim SE', 'Nexus Mods · Skyrim SE'))), h('button', { class: 'sbtn', onclick: () => download(app), disabled: !app.download }, t('f.download')));
      const prio = p => h('span', { class: 'prio ' + PRIO()[p][1] }, PRIO()[p][0]);
      const stats = () => { const m = cur(); return h('div', { class: 'nstats' }, h('div', { class: 'statrow' }, m.stats.map(([l, v, d]) => h('div', { class: 'statc' }, h('span', { class: 'mut' }, l), h('b', {}, num(v)), h('small', { class: 'ok' }, '+' + d + ' / 24 h'))), h('div', { class: 'statc' }, h('span', { class: 'mut' }, T('Rapports de bugs', 'Bug reports')), h('b', {}, bugs().length), h('small', { class: 'wn' }, bugs().filter(b => b.track !== 'released').length + T(' ouverts', ' open')))),
        h('div', { class: 'scard' }, h('div', { class: 'sh' }, T('TÉLÉCHARGEMENTS, 12 DERNIÈRES HEURES', 'DOWNLOADS, LAST 12 HOURS')), h('div', { class: 'spark' }, m.spark.map((v, i) => h('i', { style: { height: (v / Math.max(...m.spark) * 100) + '%', animationDelay: i * 40 + 'ms' } })))),
        h('div', { class: 'scard tight' }, h('div', { class: 'frow2' }, h('span', { class: 'mut' }, T('Fichiers', 'Files')), h('span', { class: 'ok' }, T('Aucun fichier en quarantaine', 'No file in quarantine'))), h('div', { class: 'frow2' }, h('span', { class: 'mut' }, T('Dernière vérification', 'Last check')), h('span', {}, T('il y a 48 s', '48 s ago'))))); };
      const posts = () => { const P = cur().posts, box = h('div', { class: 'scard tight grow' }); const tagL = { bug: ['Bug', 'dg'], feature: [T('Demande', 'Request'), 'acc'], question: ['Question', 'wn'], praise: [T('Remerciement', 'Thanks'), 'ok'] };
        const rows = P.map(([ti, who, rep, kind, tr], i) => { const chip = h('span', { class: 'jev' }); chip.style.animationDelay = i * 160 + 'ms'; const row = h('div', { class: 'prow' }, h('div', { class: 'bt' }, h('b', {}, ti), h('small', { class: 'mut' }, who + ' · ' + rep + T(' réponses', ' replies'))), chip, h('em', { class: 'mut small' }, tr && jev ? T('déjà au suivi #' + tr, 'already tracked #' + tr) : '')); if (jev) { const [l, c] = tagL[kind]; chip.className = 'jev chip ' + c; chip.textContent = l; } return row; });
        box.append(...rows); return h('div', { class: 'nposts' }, h('div', { class: 'sact', style: { marginTop: 0, alignItems: 'center' } }, h('span', { class: 'mut' }, T('Tri par Jev (optionnel) : repère les bugs et les demandes.', 'Sorting by Jev (optional): spots bugs and requests.')), h('button', { class: 'sbtn acc', onclick: () => { jev = true; sfx.pop(); draw(); } }, T('TRIER AVEC JEV', 'SORT WITH JEV'))), box); };
      const bugsTab = () => {
        const list = bugs(), b = list[Math.min(sel, list.length - 1)], aiBox = h('div', { class: 'aicard' });
        const L = h('div', { class: 'blist nbl' }, list.map((x, i) => h('button', { class: 'bi' + (x === b ? ' on' : ''), onclick: () => { sel = i; sfx.tick(); draw(); } }, h('span', { class: 'bt' }, h('b', {}, x.title), h('small', {}, '#' + x.id + ' · ' + x.who + ' · ' + x.ago)), prio(x.prio))));
        const track = h('div', { class: 'ssegs left' }, h('span', { class: 'mut' }, T('Suivi local', 'Local tracking')), ...TRACK().map(([k, l]) => h('button', { class: b.track === k ? 'on' : '', onclick: () => { b.track = k; sfx.tick(); draw(); } }, l)));
        const btnAi = h('button', { class: 'sbtn acc', disabled: !ai, title: ai ? '' : T('Activez l’assistance IA (optionnelle)', 'Turn AI support on (optional)'), onclick: async () => {
          btnAi.disabled = true; sfx.click(); aiBox.innerHTML = ''; const parts = [[T('CAUSE PROBABLE', 'PROBABLE CAUSE'), b.ai.cause], [T('ACTION CONSEILLÉE', 'SUGGESTED ACTION'), b.ai.fix], [T('TEST À FAIRE', 'TEST TO RUN'), b.ai.test], [T('RISQUE', 'RISK'), b.ai.risk]];
          aiBox.append(h('div', { class: 'aihd' }, aiBadge(T('AUDIT IA', 'AI AUDIT')), h('span', { class: 'mut' }, 'Claude · ' + T('par bug', 'per bug'))));
          for (const [l, tx] of parts) { const p = h('p', {}), s = h('div', { class: 'sh' }, l); aiBox.append(s, p); await stream(p, tx, { think: l === parts[0][0] ? 900 : 250, alive }); if (!alive()) return; }
          sfx.done(); btnAi.disabled = false; }
        }, T('AUDIT IA', 'AI AUDIT'));
        const detail = h('div', { class: 'ndetail' }, h('div', { class: 'shead' }, h('div', { class: 'ht' }, h('h3', {}, b.title)), h('div', { class: 'row-chips' }, prio(b.prio), h('span', { class: 'chip' }, 'Nexus : ' + b.status))), h('div', { class: 'scard' }, h('div', { class: 'sh' }, T('MESSAGE DU JOUEUR', 'PLAYER MESSAGE') + ' · ' + b.who), h('p', {}, b.msg)), track,
          h('div', { class: 'sact', style: { marginTop: 0 } }, h('button', { class: 'sbtn', onclick: () => { sfx.pop(); toast({ icon: icon(app.id), title: app.id, body: T('Rapport Markdown copié pour la correction.', 'Markdown report copied for the fix.') }); } }, T('COPIER POUR CORRECTION', 'COPY FOR A FIX')), btnAi), aiBox);
        return h('div', { class: 'nbugs' }, L, detail);
      };
      const sorted = () => [...bugs()].sort((a, b) => (PRIO()[a.prio][2] + (planAi ? a.boost : 0)) - (PRIO()[b.prio][2] + (planAi ? b.boost : 0)));
      const audit = () => {
        const SUM = T('Le plantage de Blancherive passe en tête : il touche tous les joueurs à 8 Go de mémoire vidéo. Les ralentissements de Markarth remontent d’un cran, car le correctif est court. L’option du MCM peut être traitée par une simple infobulle.', 'The Whiterun crash goes first: it hits every player with 8 GB of video memory. The Markarth slowdowns move up a notch because the fix is short. The MCM option only needs a tooltip.');
        const sumEl = h('p', { class: 'aisum' }, planAi ? SUM : ''), pr = h('pre', { class: 'sraw promptbox' });
        const rows = sorted().map((b, i) => h('div', { class: 'arow' }, h('span', { class: 'mono mut' }, i + 1), prio(b.prio), h('div', { class: 'bt' }, h('b', {}, b.title), h('small', { class: 'mut' }, b.action)), planAi ? h('span', { class: 'aibadge small' }, 'IA') : null));
        const btnPlan = h('button', { class: 'sbtn acc', disabled: !ai || planAi, title: ai ? '' : T('Activez l’assistance IA (optionnelle)', 'Turn AI support on (optional)'), onclick: async () => { btnPlan.disabled = true; sfx.click(); const s = sumEl; s.parentElement.classList.add('on');
          await stream(s, SUM, { alive }); if (!alive()) return; planAi = true; sfx.done(); draw(); } }, T('ANALYSER LE PLAN AVEC L’IA', 'ANALYZE THE PLAN WITH AI'));
        const btnPrompt = h('button', { class: 'sbtn', onclick: async () => { sfx.click(); const L = sorted(); const tx = T('Mission : corriger « ' + cur().n + ' » (v' + cur().v + ').\n\nBugs par priorité :\n', 'Mission: fix “' + cur().n + '” (v' + cur().v + ').\n\nBugs by priority:\n') + L.map((b, i) => (i + 1) + '. [' + PRIO()[b.prio][0].toUpperCase() + '] ' + b.title + '\n   « ' + b.msg + ' »\n   → ' + b.action).join('\n') + T('\n\nMéthode : reproduire, corriger, tester, puis rédiger le rapport de version.\nRapport attendu : correctifs, fichiers modifiés, tests réalisés.', '\n\nMethod: reproduce, fix, test, then write the release report.\nExpected report: fixes, files changed, tests run.'); pr.parentElement.classList.add('on'); await stream(pr, tx, { think: 300, cps: 180, alive }); } }, T('PROMPT DE CORRECTION', 'FIX PROMPT'));
        return h('div', { class: 'naudit' }, h('div', { class: 'sact', style: { marginTop: 0, alignItems: 'center' } }, h('span', { class: 'mut' }, planAi ? T('Plan reclassé avec l’aide de l’IA.', 'Plan re-ranked with AI help.') : T('Plan de développement classé par priorité, sans IA.', 'Development plan ranked by priority, without AI.')), btnPlan, btnPrompt),
          h('div', { class: 'scard tight' }, h('div', { class: 'sh' }, T('PLAN DE DÉVELOPPEMENT', 'DEVELOPMENT PLAN')), ...rows), h('div', { class: 'aicard' + (planAi ? '' : ' hid') }, h('div', { class: 'aihd' }, aiBadge(T('ANALYSE IA', 'AI ANALYSIS')), h('span', { class: 'mut' }, 'Claude')), sumEl), h('div', { class: 'scard hid grow' }, h('div', { class: 'sh' }, T('PRÊT À COLLER DANS L’AGENT DE CODE', 'READY TO PASTE INTO THE CODING AGENT')), pr));
      };
      function draw() { drawAi(); drawSide(); main.innerHTML = ''; main.append(head(), tabs(), tab === 'stats' ? stats() : tab === 'posts' ? posts() : tab === 'bugs' ? bugsTab() : audit()); }
      draw(); return root;
    } });
}
