/* nEXUSWATCH : réplique de l'appli. Surveille des pages Nexus Mods (stats, posts, bugs, fichiers, veille) et transforme les rapports de bugs en plan de
   développement : audit par priorité SANS IA, puis, en option, audit IA par bug et support d'un agent (API ou MCP). Données d'exemple, aucun réseau. */
import { h, brand, wait, reduced, stream, toast, icon, S, sfx, wm, T, num, css, download } from './kit.js';

const NX = '#0ea5e9', MODEL = { anthropic: 'claude-sonnet-5-5', openai: 'gpt-5-mini' };
const P = {
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  oct: '<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M12 8v4M12 16h.01"/>',
  spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
  right: '<path d="m9 6 6 6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m6 15 6-6 6 6"/>', dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', like: '<path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1.3 2 3l-.5 3H19a2 2 0 0 1 2 2.4l-1.3 6A2 2 0 0 1 17.7 20H7"/>'
};
const ic = (k, s = 14, c = '') => h('span', { class: 'nw-ic ' + c, html: `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>` });
const fill = (el, ...k) => { el.replaceChildren(...k.flat(Infinity).filter(x => x != null && x !== false)); return el; };
const MIN = 60000, ago = t => { const m = Math.max(0, Math.floor((Date.now() - t) / MIN)); if (m < 1) return T('à l’instant', 'just now'); if (m < 60) return T(`il y a ${m} min`, `${m} min. ago`); if (m < 1440) { const x = Math.round(m / 60); return T(`il y a ${x} h`, `${x} h ago`); } const x = Math.round(m / 1440); return T(`il y a ${x} j`, `${x} d ago`); };
const at = min => Date.now() - min * MIN;
const fdate = t => { const d = new Date(t), l = T('fr-FR', 'en-US'); return d.toLocaleDateString(l, { dateStyle: 'medium' }) + T(' à ', ' at ') + d.toLocaleTimeString(l, { timeStyle: 'short' }); };
const fday = t => new Date(t).toLocaleDateString(T('fr-FR', 'en-US'), { dateStyle: 'medium' });
const PR = () => ({ critical: [T('Critique', 'Critical'), 3], high: [T('Haute', 'High'), 2], medium: [T('Moyenne', 'Medium'), 1], low: [T('Basse', 'Low'), 0] });
const FOLLOW = () => [['triage', T('À trier', 'To triage')], ['reproduce', T('À reproduire', 'To reproduce')], ['testing', T('En test', 'Testing')], ['fixed', T('Corrigé (local)', 'Fixed (local)')], ['released', T('Correctif publié', 'Fix released')]];
const ACTION = () => ({
  compat: T('recompiler pour la dernière version du jeu et de l’Address Library, puis publier une mise à jour.', 'rebuild for the latest game and Address Library versions, then publish an update.'),
  logs: T('analyser les journaux de crash fournis, reproduire puis corriger.', 'analyse the crash logs provided, reproduce, then fix.'),
  asklogs: T('demander un journal de crash (Crash Logger) et l’ordre de chargement, puis reproduire.', 'ask for a crash log (Crash Logger) and the load order, then reproduce.'),
  fix: T('reproduire et corriger.', 'reproduce and fix.')
});
const num0 = v => v.replace(/^.*?(\d+(\.\d+)*[a-z]?)\s*$/, '$1');

/* ---------- Données d'exemple (fictives) ---------- */
function makeMods() {
  const F = (name, cat, days, ver, total, unique, scan) => ({ name, cat, t: at(days * 1440), ver, total, unique, scan });
  const m1 = {
    id: '48210', name: 'Ancient Realms HD - 4K Landscape Textures', short: 'Ancient Realms HD', domain: 'skyrimspecialedition', author: 'Aelwyn', pub: true, version: '1.3.2', updated: at(5 * 1440), t: at(2),
    end: 1906, dl: 12480, dEnd: 12, dDl: 84, dUq: 31, older: 4,
    files: [F('Ancient Realms HD 1.3.2 - Main (4K)', 'MAIN', 5, '1.3.2', 5120, 2410, 'VERIFIED'), F('Ancient Realms HD 1.3.2 - 8K Pack', 'OPTIONAL', 5, '1.3.2', 1810, 1030, 'QUARANTINED'), F('Ancient Realms HD 1.3.2 - Lite 2K', 'OPTIONAL', 4, '1.3.2', 730, 173, 'MANUALLY_VERIFIED'),
      F('Ancient Realms HD 1.3.1 - Main (4K)', 'ARCHIVED', 31, '1.3.1', 3340, 1200, 'VERIFIED'), F('Ancient Realms HD 1.3.0 - Main (4K)', 'ARCHIVED', 58, '1.3.0', 1480, 420, 'VERIFIED')],
    posts: [
      { id: 'p1', author: 'Aelwyn', own: true, sticky: true, t: at(20160), text: T('Avant de signaler un bug : lisez la page « Installation ». Le pack 8K demande 12 Go de mémoire vidéo ; sur une carte de 8 Go, prenez le pack Main ou la version Lite 2K.', 'Before reporting a bug, read the “Installation” page. The 8K pack needs 12 GB of video memory; on an 8 GB card, take the Main pack or the Lite 2K version.'), replies: [] },
      { id: 'p2', author: 'dovah_fan', role: 'Premium', t: at(190), new: true, text: T('Plantage au chargement de Blancherive depuis la 1.3.2, toujours par la porte nord. Journal de crash joint, carte graphique de 8 Go.', 'Crash when loading Whiterun since 1.3.2, always through the north gate. Crash log attached, 8 GB graphics card.'),
        replies: [{ author: 'Aelwyn', own: true, t: at(140), text: T('Merci, je regarde : cela ressemble à une saturation de la mémoire vidéo. Pouvez-vous essayer le pack Main ?', 'Thanks, I’m looking into it: it looks like video memory running out. Could you try the Main pack?') }, { author: 'dovah_fan', role: 'Premium', t: at(95), new: true, text: T('Avec le pack Main, plus de plantage. Merci !', 'With the Main pack, no more crash. Thanks!') }], tag: { bug: .94, tracked: 'b1' }, kind: 'bug', sum: T('plantage à Blancherive avec le pack 8K', 'crash in Whiterun with the 8K pack'), reply: T('Content que le pack Main règle le plantage ; un pack 4K intermédiaire arrive.', 'Glad the Main pack fixes the crash; a mid-range 4K pack is coming.') },
      { id: 'p3', author: 'light_master', t: at(420), new: true, text: T('Serait-il possible d’avoir une version 1K pour le Steam Deck et les petites configurations ?', 'Could you add a 1K version for the Steam Deck and small setups?'), replies: [], tag: { feature: .91 }, kind: 'feature', sum: T('demande une version 1K', 'asks for a 1K version'), reply: T('Bonne idée : je regarde ce que donne la version Lite 2K sur Steam Deck avant de décider.', 'Good idea: I’ll test the Lite 2K version on Steam Deck before deciding.') },
      { id: 'p4', author: 'new_nord', t: at(1500), text: T('Comment l’installer avec MO2 ? Faut-il le mettre avant ou après Cathedral Landscapes ?', 'How do I install it with MO2? Should it go before or after Cathedral Landscapes?'),
        replies: [{ author: 'Aelwyn', own: true, t: at(1380), text: T('Après : placez-le plus bas dans l’ordre de chargement pour que mes textures l’emportent.', 'After: put it lower in the load order so my textures win.') }] },
      { id: 'p5', author: 'iron_nord', t: at(2900), new: true, text: T('Les armures lourdes sont violettes depuis la mise à jour.', 'Heavy armors are purple since the update.'), replies: [], tag: { bug: .88, tracked: 'b2' }, kind: 'bug', sum: T('armures lourdes violettes', 'purple heavy armors'), reply: T('Merci : c’est suivi dans le tracker, le correctif arrive dans la 1.3.3.', 'Thanks: it’s tracked in the bug tracker, the fix lands in 1.3.3.') },
      { id: 'p6', author: 'stone_mage', t: at(4300), text: T('Magnifique, merci ! Les montagnes autour de Markarth sont incroyables.', 'Beautiful, thank you! The mountains around Markarth look incredible.'), replies: [] },
      { id: 'p7', author: 'nord_wanderer', role: 'Premium', t: at(2), hidden: true, new: true, text: T('Scintillement sur le pont de Vendeaume avec ENB et la 1.3.2. Ça n’arrivait pas avant la mise à jour.', 'Flickering on the Windhelm bridge with ENB and 1.3.2. It did not happen before the update.'), replies: [], tag: { bug: .82 }, kind: 'bug', sum: T('scintillement sur le pont de Vendeaume avec ENB', 'flickering on the Windhelm bridge with ENB'), reply: T('Merci : pouvez-vous joindre votre preset ENB et la liste des mods ?', 'Thanks: could you attach your ENB preset and mod list?') }],
    bugs: [
      { id: 'b1', title: T('Plantage au chargement de Blancherive', 'Crash when loading Whiterun'), status: 'Known issue', priority: 'High', ver: 'Ancient Realms HD 1.3.2', t: at(190), follow: 'testing', prio: 'critical', score: 91, action: 'logs', current: true,
        msgs: [{ author: 'dovah_fan', t: at(4300), text: T('Le jeu plante en entrant dans la ville par la porte nord depuis la 1.3.2. Le journal de crash (Crash Logger) pointe toujours BSTextureDB::Load. GPU : 8 Go, Skyrim SE 1.6.1170, MO2.', 'The game crashes when I enter the city from the north gate since 1.3.2. The crash log (Crash Logger) always points to BSTextureDB::Load. GPU: 8 GB, Skyrim SE 1.6.1170, MO2.') },
          { author: 'Aelwyn', own: true, t: at(3900), text: T('Merci pour le journal. C’est la mémoire vidéo : les textures de terrain 8K dépassent 8 Go. Essayez le pack Main en attendant un correctif.', 'Thanks for the log. It’s video memory: the 8K terrain textures exceed 8 GB. Try the Main pack until a fix ships.') },
          { author: 'dovah_fan', t: at(1200), text: T('Confirmé : le pack Main règle le plantage. Mais j’aimerais garder les montagnes en 8K…', 'Confirmed: the Main pack fixes the crash. But I’d like to keep the mountains in 8K…') },
          { author: 'mara_k', t: at(190), text: T('Même chose ici avec une RTX 3060 Ti (8 Go).', 'Same here with an RTX 3060 Ti (8 GB).') }],
        ai: { sum: T('Plantage au chargement de la cellule de Blancherive (porte nord) depuis la 1.3.2, sur cartes de 8 Go. Le pack Main évite le problème.', 'Crash when loading the Whiterun cell (north gate) since 1.3.2 on 8 GB cards. The Main pack avoids it.'),
          env: T('Skyrim SE 1.6.1170, mod 1.3.2 (pack 8K), MO2, carte de 8 Go (RTX 3060 Ti chez un second joueur). Système et version de Crash Logger non précisés.', 'Skyrim SE 1.6.1170, mod 1.3.2 (8K pack), MO2, 8 GB card (RTX 3060 Ti for a second player). OS and Crash Logger version not given.'),
          repro: T('Entrer dans Blancherive par la porte nord avec le pack 8K : plantage à chaque fois. Reproductible, probablement sur toute carte de 8 Go.', 'Enter Whiterun through the north gate with the 8K pack: crash every time. Reproducible, likely on any 8 GB card.'),
          miss: [T('Pic de mémoire vidéo au moment du plantage (journal complet, pas seulement la pile d’appels).', 'Video memory peak at the time of the crash (full log, not only the call stack).'), T('Mods qui ajoutent d’autres textures de terrain (Cathedral Landscapes, etc.).', 'Other mods that add terrain textures (Cathedral Landscapes, etc.).')],
          causes: [T('Saturation de la mémoire vidéo par les textures de terrain 8K : à confirmer en mesurant la mémoire utilisée dans la cellule.', 'Video memory exhausted by the 8K terrain textures: confirm by measuring the memory used in the cell.'), T('Deux jeux de textures de terrain chargés ensemble (pack 8K + autre mod) : à exclure en vérifiant l’ordre de chargement.', 'Two terrain texture sets loaded together (8K pack + another mod): rule out by checking the load order.')],
          dup: T('Même problème que le post de dovah_fan et le rapport de mara_k ; aucun doublon dans le tracker.', 'Same problem as dovah_fan’s post and mara_k’s report; no duplicate in the tracker.'),
          sev: T('Critique : bloque tous les joueurs à 8 Go. Action : publier un pack 4K intermédiaire et indiquer la configuration minimale sur la page.', 'Critical: blocks every player on 8 GB. Action: ship a mid-range 4K pack and state the minimum setup on the page.'),
          reply: T('Merci pour le journal et les détails ! C’est bien la mémoire vidéo : le pack 8K demande 12 Go. Je prépare un pack 4K intermédiaire ; en attendant, le pack Main fonctionne sur 8 Go.', 'Thanks for the log and the details! It is video memory indeed: the 8K pack needs 12 GB. I’m preparing a mid-range 4K pack; until then the Main pack works on 8 GB.') } },
      { id: 'b2', title: T('Textures violettes sur les armures lourdes', 'Purple textures on heavy armors'), status: 'Looked at', priority: 'Medium', ver: 'Ancient Realms HD 1.3.2', t: at(2900), follow: 'reproduce', prio: 'high', score: 67, action: 'fix', current: true,
        msgs: [{ author: 'iron_nord', t: at(4000), text: T('Depuis la mise à jour, toutes les armures lourdes sont violettes (naine, ébonite, daedrique).', 'Since the update, all heavy armors are purple (Dwarven, Ebony, Daedric).') },
          { author: 'Aelwyn', own: true, t: at(3600), text: T('Je regarde : je pense que des chemins de textures ont changé dans la 1.3.2.', 'Looking into it: I think some texture paths changed in 1.3.2.') },
          { author: 'iron_nord', t: at(2900), text: T('Merci, je garde la 1.3.1 en attendant.', 'Thanks, I’ll stay on 1.3.1 meanwhile.') }],
        ai: { sum: T('Les armures lourdes s’affichent en violet (texture introuvable) depuis la 1.3.2.', 'Heavy armors render purple (missing texture) since 1.3.2.'), env: T('Mod 1.3.2 ; version du jeu, gestionnaire de mods et liste des mods non indiqués.', 'Mod 1.3.2; game version, mod manager and mod list not given.'),
          repro: T('Équiper n’importe quelle armure lourde : reproductible dès l’installation de la 1.3.2.', 'Equip any heavy armor: reproducible as soon as 1.3.2 is installed.'),
          miss: [T('Un exemple de chemin dans le journal des textures manquantes.', 'An example path from the missing-texture log.'), T('Mise à jour par-dessus l’ancienne version ou installation propre ?', 'Update over the old version or clean install?')],
          causes: [T('Fichiers de texture renommés dans la 1.3.2 alors que les .nif visent encore les anciens noms : comparer les chemins des .nif aux fichiers livrés.', 'Texture files renamed in 1.3.2 while the .nif files still target the old names: compare the .nif paths with the shipped files.'), T('Restes de l’ancienne version qui masquent les nouveaux fichiers : demander une installation propre.', 'Leftovers of the old version hiding the new files: ask for a clean install.')],
          dup: T('Aussi signalé dans un post de iron_nord (lié à ce bug).', 'Also reported in a post by iron_nord (linked to this bug).'), sev: T('Majeur, visuel seulement. Action : corriger les chemins dans les .nif et publier la 1.3.3.', 'Major, visual only. Action: fix the paths in the .nif files and publish 1.3.3.'),
          reply: T('Merci du signalement ! Les textures ont été renommées dans la 1.3.2 et quelques .nif pointent encore vers les anciens noms. Un correctif arrive dans la 1.3.3 ; une installation propre devrait aider d’ici là.', 'Thanks for reporting! Textures were renamed in 1.3.2 and a few .nif files still point to the old names. A fix is coming in 1.3.3; a clean install should help until then.') } },
      { id: 'b3', title: T('Ralentissements à Markarth', 'Slowdowns in Markarth'), status: 'New', priority: 'Medium', ver: 'Ancient Realms HD 1.3.2', t: at(300), new: true, follow: 'triage', prio: 'medium', score: 52, action: 'fix', current: true,
        msgs: [{ author: 'stone_mage', t: at(420), text: T('Les images par seconde passent de 60 à 30 à Markarth avec le mod actif, surtout près du marché. Pas de plantage, c’est juste lent.', 'Frames per second drop from 60 to 30 in Markarth with the mod on, mostly near the market. No crash, just slow.') },
          { author: 'ellie_ward', t: at(300), text: T('Pareil sur ma RTX 2070.', 'Same on my RTX 2070.') }],
        ai: { sum: T('Chute de 60 à 30 images par seconde à Markarth, surtout près du marché, sans plantage.', 'Drop from 60 to 30 fps in Markarth, mostly near the market, without a crash.'), env: T('RTX 2070 et une carte non précisée ; mod 1.3.2 ; version du jeu non indiquée.', 'RTX 2070 and an unspecified card; mod 1.3.2; game version not given.'),
          repro: T('Se placer près du marché de Markarth et mesurer les images par seconde avec et sans le mod.', 'Stand near Markarth’s market and measure fps with and without the mod.'),
          miss: [T('Images par seconde avec le pack Main et avec le pack 8K.', 'Fps with the Main pack and with the 8K pack.'), T('Réglages graphiques et résolution.', 'Graphics settings and resolution.')],
          causes: [T('Textures de terrain et de façade en 8K : bande passante mémoire saturée dans une zone dense.', '8K terrain and facade textures: memory bandwidth saturated in a dense area.'), T('Mipmaps absentes sur les textures de la ville : à vérifier dans les fichiers .dds.', 'Missing mipmaps on the city textures: check the .dds files.')],
          dup: T('Lié au plantage de Blancherive (même cause probable : charge de la mémoire vidéo).', 'Related to the Whiterun crash (same likely cause: video memory load).'), sev: T('Moyen : gêne sans bloquer. Action : régénérer les mipmaps et mesurer avant/après.', 'Medium: annoying, not blocking. Action: regenerate the mipmaps and measure before/after.'),
          reply: T('Merci ! Les mipmaps de Markarth sont probablement en cause. Pouvez-vous me donner les images par seconde avec le pack Main ? Je prépare un test.', 'Thanks! Markarth’s mipmaps are the likely culprit. Could you give me the fps with the Main pack? I’m preparing a test.') } },
      { id: 'b4', title: T('Option introuvable dans le MCM', 'Option missing in the MCM'), status: 'Looked at', priority: 'Low', ver: 'Ancient Realms HD 1.3.2', t: at(1700), new: true, follow: 'triage', prio: 'low', score: 21, action: 'fix', solved: true,
        msgs: [{ author: 'quiet_scribe', t: at(2600), text: T('Je ne trouve pas le réglage du rayon d’effet dans le MCM.', 'I can’t find the effect radius setting in the MCM.') }, { author: 'Aelwyn', own: true, t: at(2400), text: T('Il est dans l’onglet « Avancé ».', 'It’s in the “Advanced” tab.') },
          { author: 'quiet_scribe', t: at(1700), text: T('Ah, en fait c’était bien dans l’onglet « Avancé », merci ! Vous pouvez fermer le rapport.', 'Ah, turns out it was in the “Advanced” tab, thanks! You can close the report.') }],
        ai: { sum: T('Le joueur ne trouvait pas le rayon d’effet ; l’option existe dans l’onglet « Avancé » du MCM et le rapporteur l’a retrouvée.', 'The player could not find the effect radius; the option exists in the MCM “Advanced” tab and the reporter found it.'), env: T('Aucune information d’environnement, sans importance ici.', 'No environment information, not needed here.'),
          repro: T('Ouvrir le MCM : l’option est dans l’onglet « Avancé ».', 'Open the MCM: the option is in the “Advanced” tab.'), miss: [T('Rien : le problème est résolu.', 'Nothing: the problem is solved.')],
          causes: [T('Option peu visible : un défaut d’ergonomie, pas un bug.', 'Option hard to spot: a usability gap, not a bug.')], dup: T('Aucun doublon.', 'No duplicate.'), sev: T('Mineur. Action : ajouter une infobulle vers l’onglet « Avancé », puis clore le rapport.', 'Minor. Action: add a tooltip pointing to the “Advanced” tab, then close the report.'),
          reply: T('Merci de l’avoir retrouvée ! J’ajoute une infobulle dans la prochaine version pour que ce soit plus clair. Je ferme le rapport.', 'Glad you found it! I’m adding a tooltip in the next version to make it clearer. Closing the report.') } },
      { id: 'b5', title: T('Tache sombre sur le pont de Blancherive', 'Dark patch on the Whiterun bridge'), status: 'Fixed', priority: 'Low', ver: 'Ancient Realms HD 1.3.1', t: at(30 * 1440), closed: true, follow: 'released', prio: 'low', score: 5, action: 'fix',
        msgs: [{ author: 'tundra_kid', t: at(36 * 1440), text: T('Une tache sombre apparaît sur le pont de Blancherive.', 'A dark patch shows on the Whiterun bridge.') }, { author: 'Aelwyn', own: true, t: at(30 * 1440), text: T('Corrigé dans la 1.3.2, merci !', 'Fixed in 1.3.2, thanks!') }],
        ai: null }],
    report: {
      posts: [T('**dovah_fan** : plantage à Blancherive, déjà suivi dans le tracker. L’auteur a répondu. Réponse suggérée : « Content que le pack Main règle le plantage ; un pack 4K intermédiaire arrive. »', '**dovah_fan**: crash in Whiterun, already in the tracker. The author answered. Suggested reply: “Glad the Main pack fixes the crash; a mid-range 4K pack is coming.”'),
        T('**iron_nord** : armures violettes, déjà suivi. Sans réponse de l’auteur sur le post. Réponse suggérée : « Merci : le correctif arrive dans la 1.3.3. »', '**iron_nord**: purple armors, already tracked. No answer from the author on the post. Suggested reply: “Thanks: the fix lands in 1.3.3.”')],
      feats: [T('**light_master** : une version 1K pour le Steam Deck (1 joueur). Piste : tester la Lite 2K sur Steam Deck.', '**light_master**: a 1K version for the Steam Deck (1 player). Lead: test the Lite 2K on Steam Deck.')],
      stats: T('1 906 endorsements (+12), 12 480 téléchargements (+84), 5 233 uniques (+31). Un fichier en quarantaine : le pack 8K.', '1,906 endorsements (+12), 12,480 downloads (+84), 5,233 unique (+31). One file in quarantine: the 8K pack.')
    }
  };
  const m2 = {
    id: '51377', name: 'Frost Patch - Weather and Fog Fixes', short: 'Frost Patch', domain: 'skyrimspecialedition', author: 'Aelwyn', pub: true, version: '2.0.1', updated: at(12 * 1440), t: at(26),
    err: T('La page du mod ne répond pas (contrôle Cloudflare ou connexion). Réessayez dans un instant.', 'The mod page is not responding (Cloudflare check or connection). Try again in a moment.'),
    end: 410, dl: 3920, dEnd: 3, dDl: 21, dUq: 9, older: 0,
    files: [F('Frost Patch 2.0.1', 'MAIN', 12, '2.0.1', 2610, 1180, 'VERIFIED'), F('Frost Patch 2.0.1 - Weather Compat', 'OPTIONAL', 12, '2.0.1', 1310, 580, 'VERIFIED')],
    posts: [{ id: 'q1', author: 'frosty', t: at(2200), text: T('Merci pour le patch, la neige est enfin cohérente.', 'Thanks for the patch, the snow finally looks consistent.'), replies: [] },
      { id: 'q2', author: 'cold_front', t: at(1000), text: T('Le brouillard disparaît quand je lance une tempête avec un mod de météo. Normal ?', 'The fog disappears when I start a storm with a weather mod. Is that expected?'), replies: [], tag: { bug: .9, tracked: 'c1' }, kind: 'bug', sum: T('brouillard qui disparaît avec un mod de météo', 'fog disappearing with a weather mod'), reply: T('Merci : c’est suivi dans le tracker ; je regarde l’ordre de chargement.', 'Thanks: it’s tracked; I’m checking the load order.') }],
    bugs: [{ id: 'c1', title: T('Conflit avec un mod de météo', 'Clash with a weather mod'), status: 'Known issue', priority: 'High', ver: 'Frost Patch 2.0.1', t: at(1000), follow: 'reproduce', prio: 'high', score: 58, action: 'fix', current: true,
      msgs: [{ author: 'cold_front', t: at(1400), text: T('Le brouillard disparaît quand les deux mods sont actifs.', 'Fog disappears when both mods are on.') }], ai: { sum: T('Le brouillard disparaît quand Frost Patch et un mod de météo sont actifs ensemble.', 'Fog disappears when Frost Patch and a weather mod are active together.'), env: T('Mod 2.0.1 ; nom du mod de météo, version du jeu et ordre de chargement non indiqués.', 'Mod 2.0.1; weather mod name, game version and load order not given.'), repro: T('Lancer une tempête de neige avec les deux mods : le brouillard disparaît.', 'Start a snowstorm with both mods: the fog disappears.'), miss: [T('Le nom exact du mod de météo.', 'The exact weather mod name.'), T('L’ordre de chargement des deux plugins.', 'The load order of both plugins.')], causes: [T('Les deux mods écrasent le même enregistrement de météo : le dernier chargé gagne.', 'Both mods override the same weather record: the last one loaded wins.')], dup: T('Un post de cold_front décrit le même problème.', 'A post by cold_front describes the same problem.'), sev: T('Majeur. Action : déplacer le patch après le mod de météo et publier un correctif de compatibilité.', 'Major. Action: move the patch after the weather mod and publish a compatibility fix.'), reply: T('Merci ! Deux mods écrasent le même enregistrement de météo. Pouvez-vous me donner le nom du mod et l’ordre de chargement ? Un patch de compatibilité suit.', 'Thanks! Two mods override the same weather record. Could you share the mod name and load order? A compatibility patch follows.') } },
      { id: 'c2', title: T('Faute dans le MCM français', 'Typo in the French MCM'), status: 'Fixed', priority: 'Low', ver: 'Frost Patch 2.0.0', t: at(20 * 1440), closed: true, follow: 'released', prio: 'low', score: 4, action: 'fix', msgs: [{ author: 'nordique', t: at(22 * 1440), text: T('« Brouillar » s’écrit avec un D.', '“Brouillar” is missing its D.') }], ai: null }],
    report: { posts: [], feats: [], stats: T('410 endorsements (+3), 3 920 téléchargements (+21), 1 760 uniques (+9).', '410 endorsements (+3), 3,920 downloads (+21), 1,760 unique (+9).') }
  };
  const m3 = {
    id: '55102', name: 'Dragon Rework - Flight and Combat (WIP)', short: 'Dragon Rework', domain: 'skyrimspecialedition', author: 'Aelwyn', pub: false, version: '1.0.0', updated: at(2 * 1440), t: null,
    end: 0, dl: 0, dEnd: 0, dDl: 0, dUq: 0, older: 0, files: [F('Dragon Rework 1.0.0', 'MAIN', 2, '1.0.0', 0, 0, 'QUARANTINED')], posts: [], bugs: [], report: null
  };
  m3.err = T('Ce mod n’est pas encore publié : ses posts et ses bugs seront lus dès sa mise en ligne.', 'This mod is not published yet: its posts and bugs will be read once it goes live.');
  return [m1, m2, m3];
}
const watchItems = () => [
  { id: 1, name: 'Community Shaders', kind: 'github', ref: 'doodlum/skyrim-community-shaders', notes: T('Compatibilité ENB à surveiller.', 'Watch ENB compatibility.'), checked: at(300), hist: [{ t: at(40 * 1440), v: 'v1.1.2', pub: at(41 * 1440) }, { t: at(14 * 1440), v: 'v1.1.3', pub: at(15 * 1440) }, { t: at(6 * 1440), v: 'v1.1.4', pub: at(7 * 1440) }] },
  { id: 2, name: 'Address Library for SKSE Plugins', kind: 'nexus', ref: 'skyrimspecialedition/32444', notes: '', checked: at(300), hist: [{ t: at(30 * 1440), v: '11.1', pub: at(32 * 1440), dl: 2864410, end: 118230 }, { t: at(3 * 1440), v: '11.1', pub: at(32 * 1440), dl: 2871950, end: 118402 }] },
  { id: 3, name: 'ENB Series', kind: 'web', ref: 'https://enbdev.com/download_mod_tesskyrimse.htm', notes: T('Version relevée dans le texte de la page.', 'Version read from the page text.'), checked: at(300), hist: [{ t: at(70 * 1440), v: '0.504' }, { t: at(21 * 1440), v: '0.505' }] }];

/* ---------- Markdown : blocs ['h1'|'h2'|'h3'|'p'|'li'|'ol'|'q'|'hr', texte] ---------- */
const brandText = p => p.split(/(nEXUSWATCH)/).map(x => (x === 'nEXUSWATCH' ? h('span', { html: brand('nEXUSWATCH', NX) }) : x));
const inl = s => s.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).flatMap(p => (p.startsWith('**') ? [h('b', {}, p.slice(2, -2))] : p.startsWith('`') ? [h('code', {}, p.slice(1, -1))] : brandText(p)));
function mdNode(b) {
  const [t, a, c] = b, txt = t === 'ol' ? c : a;
  if (t === 'hr') return { el: h('hr') };
  const tag = { h1: 'h1', h2: 'h2', h3: 'h3', q: 'blockquote' }[t] || 'div', tx = h(tag, { class: t === 'p' ? 'nw-p' : t === 'li' || t === 'ol' ? 'nw-lt' : '' });
  return { el: t === 'li' || t === 'ol' ? h('div', { class: 'nw-li' }, h('i', {}, t === 'li' ? '•' : a + '.'), tx) : tx, tx, txt };
}
const fillMd = n => { if (n.tx) n.tx.replaceChildren(...inl(n.txt)); };
const mdBlocks = blocks => blocks.map(b => { const n = mdNode(b); fillMd(n); return n.el; });
async function mdStream(box, blocks, alive) {
  for (let i = 0; i < blocks.length; i++) {
    const n = mdNode(blocks[i]); box.append(n.el); if (!n.tx) continue;
    const sc = box.closest('.nw-scroll'); if (sc && sc.scrollHeight - sc.scrollTop - sc.clientHeight < 140) sc.scrollTop = sc.scrollHeight;
    await stream(n.tx, n.txt.replace(/\*\*|`/g, ''), { think: i ? 0 : 900, cps: 300, alive: () => alive() && box.isConnected });
    if (!alive() || !box.isConnected) return false; fillMd(n);
  }
  return true;
}
const asText = blocks => blocks.map(b => ({ h1: '# ', h2: '## ', h3: '### ', q: '> ', li: '- ' }[b[0]] || (b[0] === 'ol' ? b[1] + '. ' : '')) + (b[0] === 'ol' ? b[2] : b[1] || '')).join('\n');


/* Nom de l'appli : lettre minuscule colorée dans tous les textes (CSS Custom Highlight API, sans toucher au DOM), sauf dans les menus déroulants. */
function brandHL(root, name, key) {
  if (!window.CSS || !CSS.highlights || typeof Highlight === 'undefined') return () => {};
  const k = [...name].findIndex(c => c >= 'a' && c <= 'z'); let raf = 0;
  const run = () => {
    raf = 0; const rs = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.includes(name) && !n.parentElement.closest('.lc,.hd-pop,option,textarea,script,style') ? 1 : 3) });
    for (let n; (n = tw.nextNode());) { let i = -1; while ((i = n.nodeValue.indexOf(name, i + 1)) >= 0) { const r = new Range(); r.setStart(n, i + k); r.setEnd(n, i + k + 1); rs.push(r); } }
    CSS.highlights.set(key, new Highlight(...rs));
  };
  const obs = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(run); }); obs.observe(root, { childList: true, subtree: true, characterData: true }); run();
  return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); CSS.highlights.delete(key); };
}

export function open(app) {
  css('css/demos/nEXUSWATCH.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, minw: 1080, minh: 620, bare: true, cls: 'socle nw-win',
    onclose: w => { w.dead = true; clearInterval(w.timer); removeEventListener('keydown', w.esc, true); w.unbrand && w.unbrand(); },
    build: w => {
      const alive = () => !w.dead;
      const mods = makeMods(), watch = watchItems();
      const st = { mi: 0, view: 'mod', tab: 'posts', ai: true, method: 'anthropic', jev: false, interval: 15, notify: true, auto: false, arch: false, sort: ['total', -1], bugF: 'open', postF: 'all', busy: false, wbusy: false, wsel: null, newMods: 0, jevUse: [3, 1240, 980, 260] };
      const M = () => mods[st.mi];
      const root = h('div', { class: 'nw' }), side = h('aside', { class: 'nw-side' }), main = h('main', { class: 'nw-main' }), modal = h('div', { class: 'nw-scrim', hidden: true });
      root.append(h('div', { class: 'nw-title', 'data-drag': '' }, wm.lights(w), h('b', { html: brand('nEXUSWATCH', NX) })), side, main, modal);
      const eHead = h('div'), eStats = h('div'), eCall = h('div'), eTabs = h('div'), ePane = h('div', { class: 'nw-pane' });

      /* --- petits composants --- */
      const demo = msg => toast({ icon: icon(app.id), title: 'nEXUSWATCH', body: msg });
      const btn = (label, cls, fn, o = {}) => h('button', { class: 'nw-b ' + (cls || ''), onclick: fn, ...o }, label);
      const badge = (txt, kind = '') => h('span', { class: 'nw-badge ' + kind }, txt);
      const callout = (kind, txt) => h('div', { class: 'nw-call ' + kind }, ic(kind === 'dg' ? 'oct' : 'warn', 16), h('span', {}, txt));
      const empty = txt => h('div', { class: 'nw-empty' }, txt);
      const spin = () => h('i', { class: 'nw-spin', 'aria-hidden': 'true' });
      const seg = (opts, cur, fn) => h('div', { class: 'nw-seg' }, opts.map(([k, l]) => h('button', { class: k === cur ? 'on' : '', onclick: () => { sfx.tick(); fn(k); } }, l)));
      const chk = (label, on, fn, strong) => { const i = h('input', { type: 'checkbox', checked: on, onchange: e => { sfx.tick(); fn(e.target.checked); } }); return h('label', { class: 'nw-chk' + (strong ? ' st' : '') }, i, h('i', {}), h('span', {}, label)); };
      const copy = async (text, el, label) => { try { await navigator.clipboard.writeText(text); } catch {} sfx.pop(); const o = el.textContent; el.textContent = T('Copié', 'Copied'); setTimeout(() => { if (alive()) el.textContent = o; }, 2000); };
      const copyBtn = (label, textFn, cls) => { const b = h('button', { class: 'nw-b ' + (cls || ''), onclick: () => copy(textFn(), b) }, label); return b; };
      const unreadPosts = m => m.posts.filter(p => !p.hidden && (p.new || p.replies.some(r => r.new))).length, unreadBugs = m => m.bugs.filter(b => b.new).length;
      const openBugs = m => m.bugs.filter(b => !b.closed).length, vis = m => m.posts.filter(p => !p.hidden);
      const quarantined = m => m.files.filter(f => f.scan === 'QUARANTINED' && f.cat !== 'ARCHIVED').length;
      const uniq = m => m.files.reduce((a, f) => a + f.unique, 0), postCount = m => vis(m).reduce((a, p) => a + 1 + p.replies.length, 0) + m.older;
      const tagOf = p => (st.jev ? p.tag : null);
      const linked = (m, b) => (st.jev ? vis(m).filter(p => p.tag && p.tag.tracked === b.id).length : 0);

      /* --- audit local (sans IA) et textes pour l'agent --- */
      const plan = m => {
        const PRK = PR(), open = m.bugs.filter(b => !b.closed), solved = open.filter(b => b.solved);
        const items = open.filter(b => !b.solved).map(b => ({ b, reports: 1 + Math.max(b.msgs.length - 1, 0) + linked(m, b), linked: linked(m, b), answered: b.msgs.some(x => x.own) }))
          .sort((a, c) => PRK[c.b.prio][1] - PRK[a.b.prio][1] || c.b.score - a.b.score || c.b.t - a.b.t);
        return { items, solved };
      };
      const localBlocks = m => {
        const { items, solved } = plan(m), PRK = PR(), open = m.bugs.filter(b => !b.closed), vp = vis(m);
        const unanswered = open.filter(b => !b.msgs.some(x => x.own)).length, active = open.filter(b => b.t > Date.now() - 30 * 1440 * MIN).length;
        const bugPosts = vp.filter(p => p.tag && p.tag.bug >= .7), untracked = bugPosts.filter(p => !p.tag.tracked), feats = vp.filter(p => p.tag && p.tag.feature >= .7);
        const out = [['h1', T('Audit des bugs — ', 'Bug audit — ') + m.name], ['p', T(`Établi le ${fdate(Date.now())} à partir des données lues par nEXUSWATCH.`, `Produced on ${fdate(Date.now())} from the data read by nEXUSWATCH.`)], ['h2', T('Synthèse', 'Summary')],
          ['li', T(`${open.length} bugs ouverts sur ${m.bugs.length} · ${unanswered} sans réponse de l’auteur · ${active} actifs ces 30 derniers jours`, `${open.length} open bugs out of ${m.bugs.length} · ${unanswered} without an answer from the author · ${active} active in the last 30 days`)]];
        if (st.jev && vp.length) out.push(['li', T(`${vp.length} posts lus : ${bugPosts.length} signalent un bug (dont ${untracked.length} absents du tracker), ${feats.length} demandent une fonction`, `${vp.length} posts read: ${bugPosts.length} report a bug (${untracked.length} missing from the tracker), ${feats.length} ask for a feature`)]);
        out.push(['li', T('Version actuelle du mod : ', 'Current mod version: ') + m.version], ['h2', T('Plan de développement par priorité', 'Development plan by priority')]);
        if (!items.length) out.push(['p', T('Aucun bug ouvert.', 'No open bug.')]);
        items.forEach((it, i) => {
          const b = it.b, last = Date.now() - b.t;
          out.push(['h3', `${i + 1}. ${b.title} — ${PRK[b.prio][0]}`], ['li', T(`${it.reports} signalement(s) · dernier message ${ago(b.t)} · version ${num0(b.ver)}${b.current ? ' (version actuelle)' : ''}`, `${it.reports} report(s) · last message ${ago(b.t)} · version ${num0(b.ver)}${b.current ? ' (current version)' : ''}`)]);
          if (it.linked) out.push(['li', T(`Aussi signalé dans ${it.linked} post(s)`, `Also reported in ${it.linked} post(s)`)]);
          out.push(['li', it.answered ? T('L’auteur a déjà répondu', 'The author already answered') : T('Sans réponse de l’auteur', 'No answer from the author')], ['li', T('**Action :** ', '**Action:** ') + ACTION()[b.action]], ['q', b.msgs[0].text]);
        });
        if (solved.length) { out.push(['h2', T('À répondre puis fermer', 'Answer, then close')]); solved.forEach(b => out.push(['li', `**${b.title}** — ` + T('l’auteur du rapport indique avoir trouvé la cause : répondre, documenter la solution et fermer.', 'the reporter says they found the cause: answer, document the solution and close.')])); }
        if (st.jev && untracked.length) { out.push(['h2', T('Bugs signalés dans les posts, absents du tracker', 'Bugs reported in posts, missing from the tracker')]); untracked.forEach(p => out.push(['li', `**${p.author}** (${ago(p.t)}) — ${p.text}`])); }
        if (st.jev && feats.length) { out.push(['h2', T('Demandes de fonctions', 'Feature requests')]); feats.forEach(p => out.push(['li', `**${p.author}** (${ago(p.t)}) — ${p.text}`])); }
        out.push(['hr'], ['p', T('Audit établi par nEXUSWATCH sans IA, à partir des pages du mod et du tri Jev. Les messages des joueurs sont cités dans leur langue d’origine.', 'Audit produced by nEXUSWATCH without AI, from the mod pages and Jev sorting. Players’ messages are quoted in their original language.')]);
        return out;
      };
      const agentPrompt = m => {
        const { items, solved } = plan(m), PRK = PR();
        let s = T(`Tu es le développeur du mod « ${m.name} » (page Nexus : nexusmods.com/${m.domain}/mods/${m.id}, version publiée : ${m.version}). Tu travailles dans son code source. Voici les bugs ouverts signalés par les joueurs, classés par priorité par nEXUSWATCH. Traite-les dans cet ordre.`, `You are the developer of the mod “${m.name}” (Nexus page: nexusmods.com/${m.domain}/mods/${m.id}, released version: ${m.version}). You work in its source code. Below are the open bugs reported by players, ranked by priority by nEXUSWATCH. Handle them in this order.`) + '\n\n## ' + T('Plan de développement par priorité', 'Development plan by priority') + '\n\n';
        items.forEach((it, i) => {
          s += `### ${i + 1}. ${it.b.title} — ${PRK[it.b.prio][0]}\n\n- ` + T(`${it.reports} signalement(s) · dernier message ${ago(it.b.t)} · version ${num0(it.b.ver)}`, `${it.reports} report(s) · last message ${ago(it.b.t)} · version ${num0(it.b.ver)}`) + '\n- ' + T('Action : ', 'Action: ') + ACTION()[it.b.action] + '\n';
          it.b.msgs.slice(0, 4).forEach(x => { s += `> **${x.author}** : ${x.text}\n`; }); s += '\n';
        });
        if (solved.length) s += '## ' + T('À répondre puis fermer', 'Answer, then close') + '\n\n' + T('Leurs auteurs disent ces bugs résolus : vérifie-le, puis propose un message de clôture.', 'Their authors say these bugs are solved: check it, then draft a closing message.') + '\n\n' + solved.map(b => '- ' + b.title).join('\n') + '\n\n';
        return s + '## ' + T('Méthode', 'Method') + '\n\n' + T('Pour chaque bug :\n1. Retrouve dans le code la partie concernée et explique la cause probable avant de modifier quoi que ce soit.\n2. Corrige la cause, pas le symptôme, par le plus petit changement possible ; ne touche pas au reste du mod.\n3. Si le signalement ne suffit pas à trouver la cause, ne devine pas : rédige la réponse à poster au joueur pour obtenir ce qui manque (journal de crash ou d’erreurs, liste de mods, versions du jeu, de SKSE ou des outils utilisés).\n4. Indique comment vérifier la correction, en jeu ou dans l’outil.\n\nÀ la fin, fais un compte rendu point par point (corrigé, informations demandées, non reproductible), puis propose la note de version et une réponse courte à poster sur chaque bug corrigé.',
          'For each bug:\n1. Find the relevant part of the code and explain the likely cause before changing anything.\n2. Fix the cause, not the symptom, with the smallest possible change; leave the rest of the mod alone.\n3. If the report is not enough to find the cause, do not guess: write the reply to post to the player to get what is missing (crash or error log, mod list, versions of the game, SKSE or tools used).\n4. Explain how to check the fix, in game or in the tool.\n\nAt the end, report item by item (fixed, information requested, not reproducible), then draft the release notes and a short reply to post on each fixed bug.') + '\n\n' + T('Les messages des joueurs sont cités dans leur langue d’origine.', 'Players’ messages are quoted in their original language.') + '\n';
      };
      const bugBlocks = b => {
        const a = b.ai; if (!a) return [['p', T('Aucun détail à auditer : ce bug est corrigé.', 'Nothing to audit: this bug is fixed.')]];
        return [['h3', T('Résumé', 'Summary')], ['p', a.sum], ['h3', T('Environnement', 'Environment')], ['p', a.env], ['h3', T('Reproduction', 'Reproduction')], ['p', a.repro], ['h3', T('Informations manquantes', 'Missing information')], ...a.miss.map(x => ['li', x]),
          ['h3', T('Causes probables', 'Likely causes')], ...a.causes.map((x, i) => ['ol', i + 1, x]), ['h3', T('Doublons et rapports liés', 'Duplicates and related reports')], ['p', a.dup], ['h3', T('Gravité et prochaine action', 'Severity and next action')], ['p', a.sev], ['h3', T('Réponse suggérée au rapporteur', 'Suggested reply to the reporter')], ['q', a.reply]];
      };
      const modReport = m => {
        const { items } = plan(m), PRK = PR(), r = m.report, out = [['h2', T('Audit des bugs', 'Bug audit')]];
        items.forEach(it => { const a = it.b.ai; out.push(['h3', it.b.title], ['li', T(`**Sources :** tracker et ${it.linked || 1} post(s) · statut Nexus : ${it.b.status} · ${it.b.msgs.length} message(s), dernier ${ago(it.b.t)}`, `**Sources:** tracker and ${it.linked || 1} post(s) · Nexus status: ${it.b.status} · ${it.b.msgs.length} message(s), last ${ago(it.b.t)}`)], ['li', T('**Symptômes :** ', '**Symptoms:** ') + a.sum], ['li', T('**Cause probable :** ', '**Likely cause:** ') + a.causes[0]], ['li', T('**Gravité et action :** ', '**Severity and action:** ') + a.sev]); });
        if (r.posts.length) { out.push(['h2', T('Audit des posts', 'Post audit')]); r.posts.forEach(x => out.push(['li', x])); }
        if (r.feats.length) { out.push(['h2', T('Demandes de fonctions', 'Feature requests')]); r.feats.forEach(x => out.push(['li', x])); }
        out.push(['h2', T('Plan d’action', 'Action plan')]); items.forEach((it, i) => out.push(['ol', i + 1, `**${PRK[it.b.prio][0]}** — ${it.b.title} : ` + it.b.ai.sev.split('Action : ').pop().split('Action: ').pop()]));
        out.push(['ol', items.length + 1, T('Répondre aux posts ci-dessus avec les réponses suggérées, puis fermer « Option introuvable dans le MCM ».', 'Answer the posts above with the suggested replies, then close “Option missing in the MCM”.')], ['h2', T('Statistiques', 'Stats')], ['p', r.stats]);
        return out;
      };

      /* --- barre latérale --- */
      function drawSide() {
        const rows = mods.map((m, i) => {
          const un = unreadPosts(m) + unreadBugs(m), on = st.view === 'mod' && i === st.mi;
          return h('button', { class: 'nw-row' + (on ? ' on' : ''), onclick: () => { st.view = 'mod'; st.mi = i; sfx.tick(); draw(); } }, h('i', { class: 'nw-dot' + (un ? ' on' : '') }),
            h('span', { class: 'nw-rt' }, h('span', { class: 'nw-nm' }, h('span', { class: 'nw-nt', title: m.name }, m.short), un ? h('b', { class: 'nw-cnt' }, un) : null),
              h('span', { class: 'nw-sub' }, m.domain, m.err ? ic('warn', 13, 'wn') : null, quarantined(m) ? ic('oct', 13, 'dg') : null)));
        });
        const won = st.view === 'watch';
        side.replaceChildren(h('div', { class: 'nw-sh' }, h('span', { class: 'nw-eyebrow' }, T('MODS SURVEILLÉS', 'WATCHED MODS')),
          h('button', { class: 'nw-ib', title: T('Tout actualiser', 'Refresh all'), 'aria-label': T('Tout actualiser', 'Refresh all'), disabled: st.busy, onclick: () => refresh(true) }, ic('refresh', 15)), h('button', { class: 'nw-ib', title: T('Ajouter un mod', 'Add a mod'), 'aria-label': T('Ajouter un mod', 'Add a mod'), onclick: addSheet }, ic('plus', 15))),
          h('div', { class: 'nw-list' }, rows, h('hr', { class: 'nw-hr' }), h('button', { class: 'nw-row' + (won ? ' on' : ''), onclick: () => { st.view = 'watch'; sfx.tick(); draw(); } }, h('i', { class: 'nw-dot' }),
            h('span', { class: 'nw-rt' }, h('span', { class: 'nw-nm' }, h('span', { class: 'nw-nt' }, T('Veille', 'Watch')), st.wbusy ? spin() : null), h('span', { class: 'nw-sub' }, T(`${watch.length} produits suivis`, `${watch.length} watched products`), watch.some(x => x.err) ? ic('warn', 13, 'wn') : null)))));
      }

      /* --- en-tête, chiffres, bandeaux, onglets --- */
      const statusTxt = m => (st.busy ? T('Vérification en cours…', 'Checking…') : m.t ? T('Vérifié ', 'Checked ') + ago(m.t) : T('Jamais vérifié', 'Never checked'));
      function drawHead() {
        const m = M(), unread = unreadPosts(m) + unreadBugs(m);
        eHead.replaceChildren(h('div', { class: 'nw-head' }, h('b', { class: 'nw-app', html: brand('nEXUSWATCH', NX) }), h('span', { class: 'nw-mn', title: m.name }, m.short), h('span', { class: 'sp' }),
          st.busy ? spin() : null, h('span', { class: 'nw-st' }, statusTxt(m)),
          btn(T('Tout marquer comme lu', 'Mark all as read'), 'ghost', () => { mods.forEach((x, i) => { if (i === st.mi) { x.posts.forEach(p => { p.new = false; p.replies.forEach(r => { r.new = false; }); }); x.bugs.forEach(b => { b.new = false; }); } }); sfx.tick(); draw(); }, { disabled: !unread }),
          btn(T('Ouvrir la page', 'Open page'), '', () => demo(T('Ouvre la page du mod sur Nexus Mods (désactivé dans la démo).', 'Opens the mod page on Nexus Mods (disabled in the demo).'))),
          h('button', { class: 'nw-b ic', title: T('Réglages', 'Settings'), 'aria-label': T('Réglages', 'Settings'), onclick: settingsSheet }, ic('gear', 16)),
          btn(T('ACTUALISER', 'REFRESH'), 'pri', () => refresh(false), { disabled: st.busy })));
      }
      let tweenId = 0;
      function drawStats(tween) {
        const m = M(), un = [unreadPosts(m), unreadBugs(m)], p = m.pub || m.t != null;
        const tile = (l, v, note, kind) => h('div', { class: 'nw-tile' }, h('div', { class: 'nw-eyebrow', title: l }, l), h('div', { class: 'nw-val' }, v), h('div', { class: 'nw-note ' + (kind || '') }, note || ' '));
        const d = (x, k) => (x ? [T(`+${num(x)} en 24 h`, `+${num(x)} in 24 h`), 'ok'] : [null, '']);
        const vals = { end: m.end, dl: m.dl, uq: uniq(m) }, els = {};
        const vEl = k => (els[k] = h('span', {}, num(vals[k])));
        eStats.replaceChildren(h('div', { class: 'nw-stats' },
          tile(T('Endorsements', 'Endorsements'), vEl('end'), ...d(m.dEnd)), tile(T('Téléchargements', 'Downloads'), vEl('dl'), ...d(m.dDl)), tile(T('DL uniques', 'Unique DLs'), vEl('uq'), ...d(m.dUq)),
          tile('Posts', m.pub && m.t ? num(postCount(m)) : '—', un[0] ? T(`${un[0]} nouveau(x)`, `${un[0]} new`) : '', 'ac'), tile(T('Bugs ouverts', 'Open bugs'), m.pub && m.t ? num(openBugs(m)) : '—', un[1] ? T(`${un[1]} nouveau(x)`, `${un[1]} new`) : '', 'ac'),
          tile('Version', m.version, m.pub || m.files.length ? T('maj ', 'updated ') + ago(m.updated) : '', 'ac')));
        if (tween) { const id = ++tweenId, t0 = performance.now(); const step = now => { if (id !== tweenId || w.dead) return; const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); Object.keys(tween).forEach(key => { if (els[key]) els[key].textContent = num(Math.round(tween[key][0] + (tween[key][1] - tween[key][0]) * e)); }); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
      }
      function drawCall() {
        const m = M(), q = quarantined(m), out = [];
        if (q) out.push(callout('dg', T(`${q} fichier(s) en quarantaine : le contrôle antivirus de Nexus les bloque, les utilisateurs ne peuvent pas les télécharger.`, `${q} file(s) quarantined: Nexus's virus scan blocks them, users cannot download them.`)));
        if (m.err) out.push(callout('wn', m.err));
        eCall.replaceChildren(...out); eCall.className = out.length ? 'nw-calls' : '';
      }
      function drawTabs() {
        const m = M(), t = (k, l, n) => h('button', { class: 'nw-tab' + (st.tab === k ? ' on' : ''), onclick: () => { if (st.tab === k) return; st.tab = k; sfx.tick(); drawTabs(); drawPane(); } }, l, n ? h('b', { class: 'nw-cnt' }, n) : null);
        if (!st.ai && st.tab === 'ai') st.tab = 'posts';
        eTabs.replaceChildren(h('div', { class: 'nw-tabs' }, t('posts', 'Posts', unreadPosts(m)), t('bugs', 'Bugs', unreadBugs(m)), t('files', T('Fichiers', 'Files')), st.ai ? t('ai', T('Audit IA', 'AI audit')) : null));
      }
      const counts = () => { drawSide(); drawHead(); drawStats(); drawTabs(); };
      function draw() { drawSide(); if (st.view === 'watch') return drawWatch(); main.replaceChildren(eHead, eStats, eCall, eTabs, ePane); main.className = 'nw-main'; drawHead(); drawStats(); drawCall(); drawTabs(); drawPane(); }
      function drawPane() { const m = M(); ePane.replaceChildren(st.tab === 'posts' ? postsPane(m) : st.tab === 'bugs' ? bugsPane(m) : st.tab === 'files' ? filesPane(m) : aiPane(m)); }

      /* --- messages, posts --- */
      const msg = (x, sticky, own, isNew) => h('div', { class: 'nw-msg' + (x.own ? ' own' : '') }, h('div', { class: 'nw-mh' }, h('b', {}, x.author || '—'), x.own ? badge(T('Vous', 'You'), 'ac') : x.role ? badge(x.role) : null, sticky ? badge(T('Épinglé', 'Pinned'), 'wn') : null, isNew ? badge(T('Nouveau', 'New'), 'in') : null, h('span', { class: 'sp' }), h('small', {}, fdate(x.t))), h('p', {}, x.text));
      const jevBadges = p => { const t = tagOf(p); if (!t) return []; const o = []; if (t.bug >= .7) o.push(t.tracked ? badge(T('Bug connu', 'Known bug')) : badge('Bug', 'dg')); if (t.feature >= .7) o.push(badge(T('Demande', 'Request'), 'in')); return o; };
      const markLater = (item, kind) => setTimeout(() => { if (w.dead) return; if (kind === 'post' ? M().selPost === item.id : M().selBug === item.id) { item.new = false; if (item.replies) item.replies.forEach(r => { r.new = false; }); counts(); const row = ePane.querySelector(`[data-k="${item.id}"] .nw-dot`); if (row) row.classList.remove('on'); } }, 1300);
      function postsPane(m) {
        const list = vis(m);
        if (!list.length) return empty(T('Aucun post pour l’instant. Les nouveaux messages apparaîtront ici.', 'No posts yet. New messages will show up here.'));
        const f = st.jev ? st.postF : 'all', shown = list.filter(p => f === 'all' || (f === 'bug' ? p.tag && p.tag.bug >= .7 : p.tag && p.tag.feature >= .7));
        if (!m.selPost || !list.find(p => p.id === m.selPost)) m.selPost = null;
        const det = h('div', { class: 'nw-dcol nw-scroll' }), rows = {};
        const detail = () => {
          const p = list.find(x => x.id === m.selPost); if (!p) return det.replaceChildren(empty(T('Sélectionnez un post pour le lire.', 'Select a post to read it.')));
          const t = tagOf(p), tr = t && t.tracked ? m.bugs.find(b => b.id === t.tracked) : null;
          det.replaceChildren(h('div', { class: 'nw-pad' }, jevBadges(p).length ? h('div', { class: 'nw-row2' }, jevBadges(p), tr ? h('span', { class: 'nw-meta' }, T('Déjà dans le tracker : ', 'Already in the tracker: ') + tr.title) : null) : null,
            msg(p, p.sticky, 0, p.new), p.replies.map(r => h('div', { class: 'nw-ind' }, msg(r, 0, 0, r.new))), h('div', { class: 'nw-actr' }, btn(T('Répondre sur Nexus', 'Reply on Nexus'), '', () => demo(T('Ouvre le fil sur Nexus Mods pour répondre (désactivé dans la démo).', 'Opens the thread on Nexus Mods to reply (disabled in the demo).'))))));
          det.scrollTop = 0;
        };
        const lc = h('div', { class: 'nw-lcol nw-scroll' });
        if (st.jev) lc.append(h('div', { class: 'nw-segw' }, seg([['all', T('Tous', 'All')], ['bug', 'Bugs'], ['feature', T('Demandes', 'Requests')]], st.postF, k => { st.postF = k; drawPane(); })));
        shown.forEach(p => { const r = h('button', { class: 'nw-lr' + (p.id === m.selPost ? ' on' : ''), 'data-k': p.id, onclick: () => { m.selPost = p.id; Object.values(rows).forEach(x => x.classList.remove('on')); r.classList.add('on'); sfx.tick(); detail(); markLater(p, 'post'); } },
          h('i', { class: 'nw-dot' + (p.new || p.replies.some(x => x.new) ? ' on' : '') }), h('span', { class: 'nw-lc' }, h('span', { class: 'nw-l1' }, h('b', {}, p.author), p.sticky ? badge(T('Épinglé', 'Pinned'), 'wn') : null, jevBadges(p), h('span', { class: 'sp' }), h('small', {}, ago(p.replies.length ? p.replies[p.replies.length - 1].t : p.t))),
            h('span', { class: 'nw-l2' }, p.text), p.replies.length ? h('span', { class: 'nw-l3' }, T(`${p.replies.length} réponse${p.replies.length > 1 ? 's' : ''}`, `${p.replies.length} ${p.replies.length > 1 ? 'replies' : 'reply'}`)) : null)); rows[p.id] = r; lc.append(r); });
        if (postCount(m) > list.length) lc.append(h('div', { class: 'nw-foot' }, T(`${list.length} derniers fils affichés sur ${postCount(m)} messages`, `Latest ${list.length} threads shown out of ${postCount(m)} messages`)));
        detail(); return h('div', { class: 'nw-split' }, lc, det);
      }

      /* --- bugs --- */
      function bugsPane(m) {
        if (!m.bugs.length) return empty(m.pub ? T('Aucun bug signalé.', 'No bug reported.') : T('Aucun bug signalé.', 'No bug reported.'));
        const f = st.bugF, list = m.bugs.filter(b => f === 'all' || (f === 'open' ? !b.closed : b.new));
        if (!m.selBug || !m.bugs.find(b => b.id === m.selBug)) m.selBug = null;
        const det = h('div', { class: 'nw-dcol nw-scroll' }), rows = {};
        const untracked = st.jev ? vis(m).filter(p => p.tag && p.tag.bug >= .7 && !p.tag.tracked).length : 0;
        const statusKind = s => (/fixed/i.test(s) ? 'ok' : /new/i.test(s) ? 'in' : /looked|known|more info/i.test(s) ? 'wn' : '');
        const detail = () => {
          const b = m.bugs.find(x => x.id === m.selBug); if (!b) return det.replaceChildren(empty(T('Sélectionnez un bug pour voir le rapport.', 'Select a bug to see the report.')));
          const sel = h('select', { class: 'nw-sel', 'aria-label': T('Suivi local', 'Local tracking'), onchange: e => { b.follow = e.target.value; sfx.tick(); const r = rows[b.id]; if (r) r.querySelector('.nw-fb').replaceWith(followBadge(b)); } }, FOLLOW().map(([k, l]) => h('option', { value: k, selected: b.follow === k }, l)));
          const note = h('textarea', { class: 'nw-note-in', spellcheck: 'false', rows: 5, 'aria-label': T('Notes de test', 'Test notes'), oninput: e => { b.note = e.target.value; } }); note.value = b.note || '';
          det.replaceChildren(h('div', { class: 'nw-pad' }, h('h3', { class: 'nw-bh' }, b.title), h('div', { class: 'nw-row2' }, badge(b.status, statusKind(b.status)), h('span', { class: 'nw-meta' }, T(`Version : ${b.ver} · Priorité : ${b.priority} · ${b.msgs.length - 1} réponse${b.msgs.length > 2 ? 's' : ''}`, `Version: ${b.ver} · Priority: ${b.priority} · ${b.msgs.length - 1} ${b.msgs.length > 2 ? 'replies' : 'reply'}`))),
            h('div', { class: 'nw-row2' }, h('span', { class: 'nw-lbl' }, T('Suivi local', 'Local tracking')), sel, h('span', { class: 'nw-grp' },
              copyBtn(T('Copier pour correctif', 'Copy for a fix'), () => `# ${T('Rapport de bug Nexus', 'Nexus bug report')} — ${m.name}\n\n## ${b.title}\n\nStatus: ${b.status} · Priority: ${b.priority} · Version: ${b.ver}\n` + b.msgs.map(x => `\n### ${x.author} — ${fdate(x.t)}\n\n${x.text}\n`).join('') + (b.note ? `\n## Notes\n\n${b.note}\n` : '')),
              btn(T('Ouvrir sur Nexus', 'Open on Nexus'), '', () => demo(T('Ouvre l’onglet des bugs sur Nexus Mods (désactivé dans la démo).', 'Opens the bugs tab on Nexus Mods (disabled in the demo).'))))),
            st.ai ? aiBugBox(m, b) : null, b.msgs.map((x, i) => h('div', { class: i ? 'nw-ind' : '' }, msg(x))),
            h('div', { class: 'nw-fld' }, h('div', { class: 'nw-lbl' }, T('Notes de test (gardées sur ce Mac uniquement)', 'Test notes (kept on this Mac only)')), note)));
          det.scrollTop = 0;
        };
        const followBadge = b => h('span', { class: 'nw-fb' }, badge(FOLLOW().find(x => x[0] === b.follow)[1], b.follow === 'released' ? 'ok' : ''));
        const lc = h('div', { class: 'nw-lcol nw-scroll' }, h('div', { class: 'nw-segw' }, seg([['all', T('Tous', 'All')], ['open', T('Ouverts', 'Open')], ['unread', T('Non lus', 'Unread')]], f, k => { st.bugF = k; drawPane(); })));
        if (untracked) lc.append(h('div', { class: 'nw-segw' }, callout('wn', T(`${untracked} bug(s) signalé(s) dans les posts et absent(s) du tracker : voir le filtre « Bugs » de l’onglet Posts.`, `${untracked} bug(s) reported in the posts but missing from the tracker: see the “Bugs” filter of the Posts tab.`))));
        list.forEach(b => { const r = h('button', { class: 'nw-lr' + (b.id === m.selBug ? ' on' : ''), 'data-k': b.id, onclick: () => { m.selBug = b.id; Object.values(rows).forEach(x => x.classList.remove('on')); r.classList.add('on'); sfx.tick(); detail(); markLater(b, 'bug'); } },
          h('i', { class: 'nw-dot' + (b.new ? ' on' : '') }), h('span', { class: 'nw-lc' }, h('span', { class: 'nw-l1' }, h('b', { class: 'two' }, b.title)), h('span', { class: 'nw-l1' }, badge(b.status, statusKind(b.status)), followBadge(b), h('span', { class: 'sp' }), h('small', {}, ago(b.t))))); rows[b.id] = r; lc.append(r); });
        if (!list.length) lc.append(empty(T('Aucun bug dans ce filtre.', 'No bug in this filter.')));
        detail(); return h('div', { class: 'nw-split' }, lc, det);
      }

      /* --- audit IA par bug --- */
      const api = () => st.method === 'openai' || st.method === 'anthropic';
      function aiBugBox(m, b) {
        const box = h('div', { class: 'nw-ai' }), headEl = h('div', { class: 'nw-aih' }), body = h('div', { class: 'nw-md' });
        let running = false;
        const model = () => (st.method === 'anthropic' ? MODEL.anthropic : MODEL.openai);
        const digest = () => T('Tu audites un rapport de bug Nexus pour son auteur…', 'You audit one bug report of a Nexus Mods mod for its author, who must decide how to fix it…') + `\n\n# ${m.name}\n\n## Bug to audit\n\n### ${b.title}\n\nStatus: ${b.status} · Priority: ${b.priority} · Version: ${b.ver}\n` + b.msgs.map(x => `\n${x.author}${x.own ? ' [author]' : ''} — ${fdate(x.t)}:\n\n> ${x.text}\n`).join('');
        const emptyTxt = () => (api() ? T('Pas encore d’audit. L’IA résume le problème, liste les informations manquantes, classe les causes probables avec ce qu’il faut vérifier dans le mod et propose une réponse au rapporteur.', 'No audit yet. The AI summarises the problem, lists the missing information, ranks the likely causes with what to check in the mod and suggests a reply to the reporter.')
          : st.method === 'export' ? T('Copiez ce bug avec la consigne d’audit, puis collez-le dans votre agent IA : résumé, infos manquantes, causes probables, gravité et réponse au rapporteur.', 'Copy this bug with the audit instructions, then paste it into your AI agent: summary, missing information, likely causes, severity and a reply to the reporter.')
            : T('Demandez à votre agent « audite les bugs de mes mods Nexus » : il lit ce rapport par le serveur MCP (outil get_bug_reports). Vous pouvez aussi copier ce bug avec la consigne d’audit.', 'Ask your agent to “audit the bugs of my Nexus mods”: it reads this report through the MCP server (get_bug_reports tool). You can also copy this bug with the audit instructions.'));
        const paint = () => {
          fill(headEl, h('div', { class: 'nw-aht' }, ic('spark', 17, 'wn'), h('b', { class: 'nw-ait' }, T('Audit IA du bug', 'AI bug audit')), b.audit && api() ? h('span', { class: 'nw-meta' }, T(`Rapport du ${fdate(b.audit.t)} · ${b.audit.model}`, `Report from ${fdate(b.audit.t)} · ${b.audit.model}`)) : null,
            running ? [spin(), h('span', { class: 'nw-meta' }, T('Analyse en cours…', 'Analysing…'))] : null), h('span', { class: 'nw-grp' },
            b.audit && api() ? copyBtn(T('Copier le rapport', 'Copy report'), () => asText(bugBlocks(b))) : null, copyBtn(T('Copier pour l’agent IA', 'Copy for AI agent'), digest),
            api() ? btn(b.audit ? T('RELANCER L’AUDIT', 'RUN AUDIT AGAIN') : T('AUDITER CE BUG', 'AUDIT THIS BUG'), 'pri', run, { disabled: running }) : null));
        };
        const show = () => { body.replaceChildren(...(b.audit && api() ? mdBlocks(bugBlocks(b)) : [h('p', { class: 'nw-p mut' }, emptyTxt())])); };
        async function run() {
          if (running) return; running = true; sfx.click(); b.audit = null; body.replaceChildren(); paint();
          const ok = await mdStream(body, bugBlocks(b), () => alive() && box.isConnected); running = false;
          if (ok) { b.audit = { t: Date.now(), model: model() }; sfx.done(); if (box.isConnected) paint(); } else if (box.isConnected) { show(); paint(); }
        }
        box.append(headEl, body); paint(); show(); return box;
      }

      /* --- fichiers --- */
      function filesPane(m) {
        const archived = m.files.filter(f => f.cat === 'ARCHIVED').length;
        let files = st.arch ? m.files : m.files.filter(f => f.cat !== 'ARCHIVED');
        const [k, dir] = st.sort; files = [...files].sort((a, b) => (typeof a[k] === 'string' ? a[k].localeCompare(b[k], undefined, { numeric: true }) : a[k] - b[k]) * dir);
        const th = (key, label, cls) => h('button', { class: 'nw-th ' + (cls || ''), onclick: () => { st.sort = st.sort[0] === key ? [key, -st.sort[1]] : [key, key === 'name' ? 1 : -1]; sfx.tick(); drawPane(); } }, label, st.sort[0] === key ? ic(st.sort[1] < 0 ? 'down' : 'up', 12) : null);
        const scan = f => (f.scan === 'QUARANTINED' ? badge(T('Quarantaine', 'Quarantined'), 'dg') : ['CLEAN', 'SAFE', 'PASSED', 'SCANNED'].includes(f.scan) ? badge(T('Validé', 'Approved'), 'ok') : badge(f.scan.toLowerCase().replace(/(^|_)(.)/g, (_, a, c) => a + c.toUpperCase())));
        const rows = files.map((f, i) => h('div', { class: 'nw-fr' + (i % 2 ? ' z' : '') }, h('div', { class: 'nw-fn' }, h('b', {}, f.name), h('small', {}, f.cat)), h('span', { class: 'nw-fd' }, fdate(f.t)), h('span', { class: 'mono' }, f.ver), h('span', { class: 'mono' }, num(f.total)), h('span', { class: 'mono' }, num(f.unique)), scan(f)));
        for (let i = files.length; i < 12; i++) rows.push(h('div', { class: 'nw-fr e' + (i % 2 ? ' z' : '') }));
        return h('div', { class: 'nw-files' }, archived ? h('div', { class: 'nw-ftop' }, chk(T(`Afficher les anciennes versions archivées (${archived})`, `Show old archived versions (${archived})`), st.arch, v => { st.arch = v; drawPane(); })) : null,
          m.files.length ? h('div', { class: 'nw-table nw-scroll' }, h('div', { class: 'nw-fr nw-fh' }, th('name', T('Fichier', 'File')), th('t', T('Ajouté le', 'Added')), th('ver', 'Version'), th('total', 'DLs'), th('unique', T('Uniques', 'Unique')), th('scan', T('Contrôle Nexus', 'Nexus scan'))), rows) : empty(T('Aucun fichier publié.', 'No file published.')));
      }

      /* --- audit IA (onglet) : plan par priorité sans IA, rapport IA en option --- */
      function aiPane(m) {
        const box = h('div', { class: 'nw-md' }), bar = h('div', { class: 'nw-abar' }), meth = { export: T('Export Markdown (copier-coller dans n’importe quel agent)', 'Markdown export (paste into any agent)'), openai: T('API compatible OpenAI (OpenAI, Mistral, OpenRouter, Ollama, LM Studio…)', 'OpenAI-compatible API (OpenAI, Mistral, OpenRouter, Ollama, LM Studio…)'), anthropic: T('API Anthropic (Claude)', 'Anthropic API (Claude)'), mcp: T('Serveur MCP (Claude Code, Claude Desktop, Cursor…)', 'MCP server (Claude Code, Claude Desktop, Cursor…)') };
        const useAi = api() && m.rep, canAi = api() && m.report && plan(m).items.length;
        let running = false; const meta = h('div'), pbox = promptBox(m);
        const paint = () => {
          fill(meta, useAi ? h('div', { class: 'nw-meta nw-gen' }, T(`Rapport du ${fdate(m.rep.t)} · ${m.rep.model}`, `Report from ${fdate(m.rep.t)} · ${m.rep.model}`)) : api() && canAi ? h('div', { class: 'nw-meta nw-gen' }, T('Aucun audit pour l’instant. Lancez une analyse pour auditer les rapports de bugs et les posts.', 'No audit yet. Run an analysis to audit bug reports and posts.')) : null);
          fill(bar, h('span', { class: 'nw-meta nw-ell' }, meth[st.method]), h('span', { class: 'sp' }), running ? [spin(), h('span', { class: 'nw-meta' }, T('Analyse en cours…', 'Analysing…'))] : null,
            useAi ? copyBtn(T('Copier le rapport', 'Copy report'), () => asText(modReport(m))) : null, copyBtn(T('Copier pour l’agent IA', 'Copy for AI agent'), () => asText(localBlocks(m))),
            st.method === 'export' ? btn(T('Enregistrer en .md', 'Save as .md'), '', () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([asText(localBlocks(m))], { type: 'text/markdown' })), download: m.short + '.md' }); a.click(); } catch {} }) : null,
            btn(T('Lecture A4', 'A4 reading'), '', () => paperSheet(m, useAi)), api() && canAi ? btn(T('ANALYSER AVEC L’IA', 'ANALYSE WITH AI'), 'pri', run, { disabled: running }) : null);
        };
        const show = () => { box.replaceChildren(...mdBlocks(useAi ? modReport(m) : localBlocks(m))); };
        async function run() {
          if (running) return; running = true; sfx.click(); box.replaceChildren(); m.rep = null; paint();
          const ok = await mdStream(box, modReport(m), () => alive() && box.isConnected); running = false;
          if (ok) { m.rep = { t: Date.now(), model: st.method === 'anthropic' ? MODEL.anthropic : MODEL.openai }; sfx.done(); if (box.isConnected) drawPane(); } else if (box.isConnected) { drawPane(); }
        }
        paint(); show();
        return h('div', { class: 'nw-aipane' }, bar, h('div', { class: 'nw-scroll nw-aibody' }, meta, pbox, box));
      }
      function promptBox(m) {
        let open = false; const tx = h('pre', { class: 'nw-pre', hidden: true }, agentPrompt(m)), chev = h('span', {}, ic('right', 14));
        const head = h('button', { class: 'nw-pbh', 'aria-expanded': 'false', onclick: () => { open = !open; tx.hidden = !open; head.setAttribute('aria-expanded', open); chev.replaceChildren(ic(open ? 'down' : 'right', 14)); sfx.tick(); } }, chev, h('b', {}, T('Prompt pour l’agent qui corrige le mod', 'Prompt for the agent fixing the mod')));
        return h('div', { class: 'nw-pb' }, h('div', { class: 'nw-row2' }, head, h('span', { class: 'sp' }), copyBtn(T('Copier le prompt de correction', 'Copy fix prompt'), () => agentPrompt(m))),
          h('div', { class: 'nw-meta' }, T('À coller dans l’agent de développement (Claude Code, Codex…) ouvert sur le code source du mod.', 'Paste it into the coding agent (Claude Code, Codex…) opened on the mod’s source code.')), tx);
      }

      /* --- lecture A4 (aperçu du rapport en page blanche) --- */
      function paperSheet(m, useAi) {
        const blocks = useAi ? [['h1', T('Audit IA — ', 'AI audit — ') + m.name], ...modReport(m)] : localBlocks(m);
        const html = '<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:16mm}body{font:12px/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#111}h1{font-size:20px}h2{font-size:16px;margin:18px 0 6px}h3{font-size:13px;margin:12px 0 4px}blockquote{margin:4px 0;padding-left:10px;border-left:2px solid #ccc;color:#555}p{margin:4px 0}.l{display:flex;gap:8px;margin:2px 0 2px 8px}</style>' +
          blocks.map(b => { const t = b[0]; if (t === 'hr') return '<hr>'; const x = (t === 'ol' ? b[2] : b[1]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); return t === 'li' ? `<div class="l">•<div>${x}</div></div>` : t === 'ol' ? `<div class="l">${b[1]}.<div>${x}</div></div>` : t === 'q' ? `<blockquote>${x}</blockquote>` : `<${t === 'p' ? 'p' : t}>${x}</${t === 'p' ? 'p' : t}>`; }).join('');
        const page = h('div', { class: 'nw-paper nw-md' }, ...mdBlocks(blocks));
        modal.replaceChildren(h('div', { class: 'nw-sheet wide' }, h('div', { class: 'nw-sh2' }, h('b', {}, T('Rapport', 'Report')), h('span', { class: 'sp' }), copyBtn(T('Copier le rapport', 'Copy report'), () => asText(blocks)), copyBtn(T('Copier le prompt de correction', 'Copy fix prompt'), () => agentPrompt(m)),
          btn(T('Imprimer / PDF…', 'Print / PDF…'), 'pri', () => { const f = h('iframe', { class: 'nw-pf', 'aria-hidden': 'true', srcdoc: html }); f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch {} setTimeout(() => f.remove(), 4000); }; root.append(f); }), btn(T('FERMER', 'CLOSE'), '', closeModal)), h('div', { class: 'nw-scroll nw-paperw' }, page)));
        modal.hidden = false;
      }

      /* --- veille --- */
      const KIND = { github: 'GitHub', nexus: 'Nexus', web: 'Web' };
      const wlabel = x => (x.v ? x.v : T('Page modifiée le ', 'Page changed ') + fday(x.t));
      function drawWatch() {
        main.className = 'nw-main'; let problem = '';
        const sel = watch.find(x => x.id === st.wsel);
        const input = h('input', { class: 'nw-in', placeholder: T('URL GitHub, Nexus ou page web', 'GitHub, Nexus or web page URL'), 'aria-label': 'URL' }), name = h('input', { class: 'nw-in', placeholder: T('Nom (facultatif)', 'Name (optional)'), 'aria-label': T('Nom', 'Name') }), err = h('div', { class: 'nw-err' });
        const add = () => {
          const s = input.value.trim(); let kind, ref; const mm = s.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i), nm = s.match(/nexusmods\.com\/(?:games\/)?([a-z0-9]+)\/mods\/(\d+)/i);
          if (mm) { kind = 'github'; ref = mm[1] + '/' + mm[2]; } else if (nm) { kind = 'nexus'; ref = nm[1] + '/' + nm[2]; } else if (/^https?:\/\/\S+\.\S+/i.test(s)) { kind = 'web'; ref = s; } else if (/^[\w.-]+\/\d+$/.test(s)) { kind = 'nexus'; ref = s; } else if (/^[\w.-]+\/[\w.-]+$/.test(s)) { kind = 'github'; ref = s; }
          if (!kind) { err.textContent = T('Adresse non reconnue : dépôt GitHub, page de mod Nexus ou adresse web (https://…).', 'Address not recognised: GitHub repository, Nexus mod page or web address (https://…).'); sfx.tick(); return; }
          if (watch.some(x => x.kind === kind && x.ref.toLowerCase() === ref.toLowerCase())) { err.textContent = T('Déjà dans la liste.', 'Already in the list.'); return; }
          const it = { id: Date.now(), name: name.value.trim() || (kind === 'web' ? ref.replace(/^https?:\/\//, '').split('/')[0] : ref), kind, ref, notes: '', checked: null, hist: [] }; watch.push(it); st.wsel = it.id; sfx.pop(); drawSide(); drawWatch(); check([it.id]);
        };
        input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); }); name.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        const list = h('div', { class: 'nw-lcol nw-scroll' }, h('div', { class: 'nw-wadd' }, input, h('div', { class: 'nw-row2' }, name, btn(T('AJOUTER', 'ADD'), '', add)), err), h('hr', { class: 'nw-hr2' }),
          watch.length ? watch.map(x => h('button', { class: 'nw-lr' + (x.id === st.wsel ? ' on' : ''), onclick: () => { st.wsel = x.id; sfx.tick(); drawWatch(); } }, h('span', { class: 'nw-lc' }, h('span', { class: 'nw-l1' }, h('b', {}, x.name), h('span', { class: 'sp' }), badge(KIND[x.kind])), h('span', { class: 'nw-l1' }, h('span', { class: 'mono ac' }, x.hist.length ? wlabel(x.hist[x.hist.length - 1]) : T('Pas encore vérifié', 'Not checked yet')), h('span', { class: 'sp' }), x.err ? ic('warn', 13, 'wn') : null)))) : empty(T('Aucun produit suivi.', 'No watched products.')));
        const det = h('div', { class: 'nw-dcol nw-scroll' });
        if (sel) {
          const notes = h('input', { class: 'nw-in', value: sel.notes, 'aria-label': 'Notes', oninput: e => { sel.notes = e.target.value; } });
          det.append(h('div', { class: 'nw-pad' }, h('div', { class: 'nw-row2 one' }, h('div', {}, h('h3', { class: 'nw-bh' }, sel.name), h('div', { class: 'mono sub' }, `${KIND[sel.kind]} · ${sel.ref}`)), btn(T('Ouvrir', 'Open'), '', () => demo(T('Ouvre la page du produit (désactivé dans la démo).', 'Opens the product page (disabled in the demo).'))), btn(T('Retirer', 'Remove'), 'ghost', () => { watch.splice(watch.indexOf(sel), 1); st.wsel = null; sfx.close(); drawSide(); drawWatch(); })),
            h('div', { class: 'nw-meta' }, sel.checked ? T('Vérifié le ', 'Checked ') + fdate(sel.checked) : T('Pas encore vérifié', 'Not checked yet')),
            h('div', { class: 'nw-fld' }, h('div', { class: 'nw-lbl' }, 'Notes'), notes), h('div', { class: 'nw-eyebrow hd' }, T('HISTORIQUE', 'HISTORY')),
            sel.hist.length ? [...sel.hist].reverse().map(x => h('div', { class: 'nw-hrow' }, h('span', { class: 'nw-meta w150' }, fdate(x.t)), h('span', { class: 'mono ac w140' }, wlabel(x)), h('span', { class: 'nw-meta' }, x.pub ? T('publiée le ', 'released ') + fday(x.pub) : ''), x.dl ? h('span', { class: 'nw-meta ic2' }, ic('dl', 13), num(x.dl)) : null, x.end ? h('span', { class: 'nw-meta ic2' }, ic('like', 13), num(x.end)) : null)) : empty(T('Aucun relevé pour l’instant.', 'No readings yet.'))));
        } else det.append(empty(watch.length ? T('Choisissez un produit dans la liste.', 'Pick a product in the list.') : T('Ajoutez un dépôt GitHub ou une page de mod Nexus : nEXUSWATCH relève leur dernière version et vous prévient quand elle change.', 'Add a GitHub repository or a Nexus mod page: nEXUSWATCH reads their latest version and tells you when it changes.')));
        main.replaceChildren(h('div', { class: 'nw-head' }, h('b', { class: 'nw-app', html: brand('nEXUSWATCH', NX) }), h('span', { class: 'nw-mn' }, T('Dernières versions des outils et mods suivis', 'Latest versions of the tools and mods you follow')), h('span', { class: 'sp' }), st.wbusy ? spin() : null, btn(T('VÉRIFIER', 'CHECK'), 'pri', () => check(), { disabled: st.wbusy || !watch.length })), h('div', { class: 'nw-split nw-wsplit' }, list, det));
      }
      async function check(ids) {
        if (st.wbusy) return; st.wbusy = true; sfx.click(); drawSide(); if (st.view === 'watch') drawWatch();
        await wait(reduced() ? 0 : 1300); if (w.dead) return;
        for (const x of watch) {
          if (ids && !ids.includes(x.id)) continue; x.checked = Date.now(); x.err = null;
          if (!x.hist.length) x.hist.push(x.kind === 'github' ? { t: Date.now(), v: 'v2.4.0', pub: at(9 * 1440) } : x.kind === 'nexus' ? { t: Date.now(), v: '1.0.2', pub: at(20 * 1440), dl: 1480, end: 96 } : { t: Date.now() });
          else if (x.id === 1 && !x.bumped) { x.bumped = true; x.hist.push({ t: Date.now(), v: 'v1.1.5', pub: at(1440) }); if (st.notify) toast({ icon: icon(app.id), title: T('Nouvelle version de Community Shaders', 'New version of Community Shaders'), body: T('Version v1.1.5 disponible.', 'Version v1.1.5 is out.') }); }
        }
        st.wbusy = false; drawSide(); if (st.view === 'watch') drawWatch();
      }

      /* --- actualisation d'un mod (ou de tous) : nouveautés, notification, chiffres animés --- */
      async function refresh(all) {
        if (st.busy) return; st.busy = true; sfx.click(); drawSide(); if (st.view === 'mod') drawHead();
        await wait(reduced() ? 0 : 1500); if (w.dead) return;
        const fresh = [], tween = {};
        (all ? mods : [M()]).forEach(m => {
          m.t = Date.now(); if (m.err && m.pub) m.err = null;
          if (m.pub && !m.refreshed && m.posts.some(p => p.hidden)) { m.refreshed = true; const before = { dl: m.dl, end: m.end }; m.posts.forEach(p => { p.hidden = false; }); m.dl += 13; m.end += 2; m.dDl += 13; m.dEnd += 2; { const b2 = m.bugs.find(b => b.id === 'b2'); b2.msgs.push({ author: 'iron_nord', t: Date.now(), text: T('Je confirme : avec la 1.3.1, les armures s’affichent normalement.', 'Confirming: with 1.3.1 the armors look normal.') }); b2.new = true; b2.t = Date.now(); } fresh.push(m); if (mods[st.mi] === m) { tween.dl = [before.dl, m.dl]; tween.end = [before.end, m.end]; } }
        });
        st.busy = false; drawSide();
        if (st.view === 'mod') { drawHead(); drawStats(tween); drawCall(); drawTabs(); drawPane(); }
        fresh.forEach(m => { if (st.notify) toast({ icon: icon(app.id), title: T('Nouveau sur ', 'New on ') + m.name, body: T('1 post(s) ou réponse(s) · 1 bug(s) nouveau(x) ou mis à jour', '1 post(s) or reply(ies) · 1 new or updated bug(s)') }); });
        if (!fresh.length) sfx.tick(); else sfx.done();
      }

      /* --- feuilles : réglages, ajout d'un mod --- */
      const closeModal = () => { modal.hidden = true; modal.replaceChildren(); };
      const sheet = (title, content, foot) => { modal.replaceChildren(h('div', { class: 'nw-sheet' }, h('div', { class: 'nw-scroll nw-sbody' }, h('h2', { class: 'nw-h2' }, title), content), h('div', { class: 'nw-sfoot' }, foot))); modal.hidden = false; const f = modal.querySelector('input:not([readonly]),select'); if (f) f.focus({ preventScroll: true }); };
      w.esc = e => { if (e.key === 'Escape' && !modal.hidden && S.active === w) { e.preventDefault(); e.stopPropagation(); closeModal(); } };
      addEventListener('keydown', w.esc, true);
      function addSheet() {
        const inp = h('input', { class: 'nw-in mono', placeholder: 'https://www.nexusmods.com/skyrimspecialedition/mods/12345', 'aria-label': T('Page du mod', 'Mod page') }), err = h('div', { class: 'nw-err' });
        const go = () => {
          const s = inp.value.trim(), mm = s.match(/nexusmods\.com\/(?:games\/)?([a-z0-9]+)\/mods\/(\d+)/i), id = mm ? mm[2] : /^\d+$/.test(s) ? s : null, dom = mm ? mm[1] : 'skyrimspecialedition';
          if (!id) { err.textContent = T('Adresse non reconnue. Collez l’URL de la page du mod, par exemple https://www.nexusmods.com/skyrimspecialedition/mods/12345.', 'Address not recognised. Paste the mod page URL, for example https://www.nexusmods.com/skyrimspecialedition/mods/12345.'); return; }
          const dup = mods.find(x => x.id === id); if (dup) { err.textContent = T('Ce mod est déjà suivi : ', 'This mod is already watched: ') + dup.name; return; }
          const nm = `${dom} · ${id}`, nmod = { id, name: nm, short: nm, domain: dom, author: '', pub: false, version: '—', updated: Date.now(), t: null, end: 0, dl: 0, dEnd: 0, dDl: 0, dUq: 0, older: 0, files: [], posts: [], bugs: [], report: null, err: T('Ce mod n’est pas encore publié : ses posts et ses bugs seront lus dès sa mise en ligne.', 'This mod is not published yet: its posts and bugs will be read once it goes live.') };
          mods.push(nmod); st.mi = mods.length - 1; st.view = 'mod'; sfx.pop(); closeModal(); draw();
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        sheet(T('Ajouter un mod', 'Add a mod'), h('div', { class: 'nw-fld' }, h('div', { class: 'nw-lbl' }, T('Page du mod (URL Nexus ou identifiant)', 'Mod page (Nexus URL or ID)')), inp, err, h('p', { class: 'nw-meta' }, T('Aucune clé API ni connexion n’est nécessaire : seules les pages publiques du mod sont lues.', 'No API key or login needed: only the mod’s public pages are read.'))), [btn(T('ANNULER', 'CANCEL'), '', closeModal), btn(T('AJOUTER', 'ADD'), 'pri', go)]);
      }
      function settingsSheet() {
        const d = { ai: st.ai, method: st.method, jev: st.jev, interval: st.interval, notify: st.notify, auto: st.auto, upd: true }, body = h('div', { class: 'nw-sbody2' });
        const field = (label, input) => h('div', { class: 'nw-fld' }, h('div', { class: 'nw-lbl' }, label), input);
        const ro = v => h('input', { class: 'nw-in mono', type: 'password', value: v, readonly: true, 'aria-label': 'API key', title: T('Démo : aucune clé n’est demandée ni enregistrée.', 'Demo: no key is asked for or stored.') });
        const mcpJson = '{\n  "mcpServers": {\n    "nexuswatch": { "command": "/Applications/nEXUSWATCH.app/Contents/MacOS/NexusWatch", "args": ["--mcp"] }\n  }\n}';
        const paint = () => {
          const meths = [['export', T('Export Markdown (copier-coller dans n’importe quel agent)', 'Markdown export (paste into any agent)')], ['openai', T('API compatible OpenAI (OpenAI, Mistral, OpenRouter, Ollama, LM Studio…)', 'OpenAI-compatible API (OpenAI, Mistral, OpenRouter, Ollama, LM Studio…)')], ['anthropic', T('API Anthropic (Claude)', 'Anthropic API (Claude)')], ['mcp', T('Serveur MCP (Claude Code, Claude Desktop, Cursor…)', 'MCP server (Claude Code, Claude Desktop, Cursor…)')]];
          const interval = h('select', { class: 'nw-sel', 'aria-label': T('Vérification automatique', 'Automatic check'), onchange: e => { d.interval = +e.target.value; } }, [5, 15, 30, 60, 180].map(n => h('option', { value: n, selected: d.interval === n }, T(`toutes les ${n} min`, `every ${n} min`))));
          const upd = h('span', { class: 'nw-meta' }, T('Version 2.0.0', 'Version 2.0.0')); const ub = btn(T('Rechercher les mises à jour', 'Check for updates'), '', async () => { ub.disabled = true; upd.textContent = T('Recherche…', 'Checking…'); await wait(reduced() ? 0 : 900); if (!w.dead) { upd.textContent = T('À jour (2.0.0)', 'Up to date (2.0.0)'); ub.disabled = false; } });
          fill(body, h('div', { class: 'nw-row2' }, h('span', { class: 'nw-lbl' }, T('Vérification automatique', 'Automatic check')), interval), chk(T('Notifier les nouveaux posts, réponses et bugs', 'Notify new posts, replies and bugs'), d.notify, v => { d.notify = v; }),
            h('p', { class: 'nw-meta' }, T('Aucune clé API ni connexion n’est nécessaire : seules les pages publiques du mod sont lues.', 'No API key or login needed: only the mod’s public pages are read.')), h('hr', { class: 'nw-hr2' }),
            h('div', { class: 'nw-eyebrow' }, T('MISES À JOUR', 'UPDATES')), chk(T('Installer automatiquement les mises à jour', 'Install updates automatically'), true, () => {}), h('div', { class: 'nw-row2' }, ub, h('span', { class: 'sp' }), upd), h('hr', { class: 'nw-hr2' }),
            chk(T('Support agent IA', 'AI agent support'), d.ai, v => { d.ai = v; paint(); }, true), h('p', { class: 'nw-meta' }, T('Reliez nEXUSWATCH à l’agent IA de votre choix pour auditer les rapports de bugs et les posts : bugs à reproduire, informations manquantes, demandes de fonctions, réponses à donner.', 'Connect nEXUSWATCH to the AI agent of your choice to audit bug reports and posts: bugs to reproduce, missing information, feature requests, replies to give.')),
            d.ai ? [h('div', { class: 'nw-row2' }, h('span', { class: 'nw-lbl' }, T('Méthode', 'Method')), h('select', { class: 'nw-sel wide', 'aria-label': T('Méthode', 'Method'), onchange: e => { d.method = e.target.value; paint(); } }, meths.map(([k, l]) => h('option', { value: k, selected: d.method === k }, l)))),
              d.method === 'export' ? h('p', { class: 'nw-meta' }, T('Copiez les stats et les posts avec la consigne de tri, puis collez-les dans l’agent IA de votre choix.', 'Copy the stats and posts with the sorting instructions, then paste them into the AI agent of your choice.')) : null,
              d.method === 'openai' ? [field(T('Adresse de l’API', 'API address'), h('input', { class: 'nw-in mono', value: 'https://api.openai.com/v1', readonly: true, 'aria-label': 'URL' })), field(T('Modèle', 'Model'), h('input', { class: 'nw-in mono', value: MODEL.openai, readonly: true, 'aria-label': T('Modèle', 'Model') })), field(T('Clé API (facultative pour un modèle local, gardée dans le trousseau macOS)', 'API key (optional for a local model, stored in the macOS keychain)'), ro('••••••••••••'))] : null,
              d.method === 'anthropic' ? [field(T('Modèle', 'Model'), h('input', { class: 'nw-in mono', value: MODEL.anthropic, readonly: true, 'aria-label': T('Modèle', 'Model') })), field(T('Clé API (gardée dans le trousseau macOS)', 'API key (stored in the macOS keychain)'), ro('••••••••••••'))] : null,
              api2(d) ? chk(T('Analyser automatiquement quand de nouveaux posts arrivent', 'Analyse automatically when new posts come in'), d.auto, v => { d.auto = v; }) : null,
              d.method === 'mcp' ? h('div', { class: 'nw-mcp' }, h('p', { class: 'nw-meta' }, T('Ajoutez nEXUSWATCH comme serveur MCP dans votre agent : il pourra lire les stats, posts et bugs de vos mods (lecture seule). L’appli doit rester ouverte pour garder les données à jour.', 'Add nEXUSWATCH as an MCP server in your agent: it can then read your mods’ stats, posts and bugs (read only). Keep the app open so the data stays up to date.')), h('pre', { class: 'nw-pre sm' }, mcpJson),
                h('div', { class: 'nw-row2' }, copyBtn(T('Copier la config JSON', 'Copy JSON config'), () => mcpJson), copyBtn(T('Copier la commande Claude Code', 'Copy Claude Code command'), () => 'claude mcp add -s user nexuswatch -- "/Applications/nEXUSWATCH.app/Contents/MacOS/NexusWatch" --mcp'))) : null,
              chk(T('Trier les posts avec Jev (TypeSafe)', 'Sort posts with Jev (TypeSafe)'), d.jev, v => { d.jev = v; paint(); }), h('p', { class: 'nw-meta' }, T('Jev repère les rapports de bugs et les demandes de fonctions noyés dans les posts, et signale les bugs déjà présents dans le tracker. Facultatif : nécessite une clé TypeSafe (typesafe.ai) ; les réponses sont mises en cache.', 'Jev spots the bug reports and feature requests buried in the posts and flags the bugs already in the tracker. Optional: needs a TypeSafe key (typesafe.ai); answers are cached.')),
              d.jev ? [field(T('Clé TypeSafe (gardée dans le trousseau macOS)', 'TypeSafe key (stored in the macOS keychain)'), ro('••••••••••••')), h('p', { class: 'nw-meta mono' }, T(`Ce mois-ci : ${st.jevUse[0]} requêtes Jev · ${num(st.jevUse[1])} jetons (${num(st.jevUse[2])} en entrée, ${num(st.jevUse[3])} en sortie), comptés par nEXUSWATCH.`, `This month: ${st.jevUse[0]} Jev requests · ${num(st.jevUse[1])} tokens (${num(st.jevUse[2])} input, ${num(st.jevUse[3])} output), counted by nEXUSWATCH.`))] : null] : null);
        };
        const api2 = o => o.method === 'openai' || o.method === 'anthropic';
        const save = () => { const ch = d.ai !== st.ai || d.method !== st.method || d.jev !== st.jev; Object.assign(st, { ai: d.ai, method: d.method, jev: d.jev, interval: d.interval, notify: d.notify, auto: d.auto }); sfx.done(); closeModal(); if (ch) { if (!d.ai && st.tab === 'ai') st.tab = 'posts'; draw(); } };
        sheet(T('Réglages', 'Settings'), body, [btn(T('ANNULER', 'CANCEL'), '', closeModal), btn(T('ENREGISTRER', 'SAVE'), 'pri', save)]); paint();
      }

      w.unbrand = brandHL(root, 'nEXUSWATCH', 'nw-brand');
      w.timer = setInterval(() => { if (st.view === 'mod' && !st.busy) { const s = main.querySelector('.nw-st'); if (s) s.textContent = statusTxt(M()); } }, 20000);
      draw(); return root;
    } });
}
