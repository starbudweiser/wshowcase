/* Réplique interactive de sKYCRASH (interface Socle) : analyse rapide des journaux, audit approfondi, lecture d'un journal, assistant IA, export, purge, réglages.
   Les journaux et les réponses de l'assistant sont des exemples écrits d'avance : rien n'est lu, rien n'est envoyé. */
import { h, brand, esc, wait, reduced, T, wm, sfx, icon, toast, css } from './kit.js';
import { setLang, lang } from '../i18n.js';

const pad = n => String(n).padStart(2, '0');
const GAME_DIR = '/Users/Shared/Skyrim/Skyrim Special Edition/';
const SEV = { 2: ['CRITIQUE', 'CRITICAL', 'd'], 1: ['AVERTISSEMENT', 'WARNING', 'w'], 0: ['INFO', 'INFO', 'o'] };

/* ---- journaux d'exemple ---- */
const crashBody = ({ exc, addr, ram, stack, texts = [], plugins = [], extra = [] }) => [
  'Skyrim SSE v1.6.1170', 'CrashLoggerSSE v1-14-0-0 Jul 22 2025 21:03:12', '', `Unhandled exception "${exc}" at ${addr}`, '',
  'SYSTEM SPECS:', '\tOS: Microsoft Windows 10 Pro v10.0.19045 (CrossOver 25.1)', '\tCPU: GenuineIntel VirtualApple @ 2.50GHz', '\tGPU #1: Apple M2 Pro (D3DMetal)', `\tPHYSICAL MEMORY: ${ram}`, '\tGPU MEMORY: 3.10/21.33 GB', '',
  'PROBABLE CALL STACK:', ...stack.map((s, i) => `\t[${String(i).padStart(2)}] ${s}`), '', ...extra, 'STACK:', ...texts, '\t[RSP+38  ] 0x7F9476C6DDA0     (void*)', '\t[RSP+40  ] 0x7F9476C6DD88     (void*)', '',
  'PLUGINS:', '\t[ 0]  Skyrim.esm', '\t[ 1]  Update.esm', '\t[ 2]  Dawnguard.esm', '\t[ 3]  HearthFires.esm', '\t[ 4]  Dragonborn.esm', ...plugins, ''];
const plain = (...l) => l;

function makeLogs() {
  const R = {
    mem: { exc: 'EXCEPTION_ACCESS_VIOLATION', addr: '0x7FF6A4D4A2F0 SkyrimSE.exe+0D4A2F0', ram: '15.20 GB/16.00 GB',
      stack: ['0x7FF6A4D4A2F0 SkyrimSE.exe+0D4A2F0 -> 10882+0x30  BSTextureDB::Load', '0x7FF6A4D1B6C0 SkyrimSE.exe+0D1B6C0', '0x7FF6A4B93D10 SkyrimSE.exe+0B93D10  TESObjectCELL::LoadTerrain', '0x7FFA11C04C21 d3d11.dll+0004C21', '0x7FF6A4B0A9D0 SkyrimSE.exe+0B0A9D0'],
      texts: ['\t[RSP+10  ] 0x2F59B240         (char*) "Textures\\terrain\\whiterun\\whiterun_ultra_8k.dds"', '\t[RSP+18  ] 0x2F59B2A0         (char*) "Textures\\terrain\\whiterun\\whiterun_ultra_8k_n.dds"'],
      plugins: ['\t[FE:0A3] Common Clothes and Armors.esp', '\t[FE:0A4] Whiterun Rebuilt - 8K Textures.esp'] },
    enb: { exc: 'EXCEPTION_ACCESS_VIOLATION', addr: '0x7FFB2C1A9E40 ENBSeries.dll+0009E40', ram: '9.80 GB/16.00 GB',
      stack: ['0x7FFB2C1A9E40 ENBSeries.dll+0009E40', '0x7FF6A4C0F120 SkyrimSE.exe+0C0F120', '0x7FFB2C1A3310 ENBSeries.dll+0003310', '0x7FFB1E5A31A0 CommunityShaders.dll+00031A0', '0x7FFA11C04C21 d3d11.dll+0004C21', '0x7FFB2C1A7710 ENBSeries.dll+0007710'],
      texts: [], plugins: ['\t[FE:0A3] RealisticWaterTwo.esp', '\t[FE:0A4] CommunityShaders.esp'], extra: ['MODULES:', '\tENBSeries.dll   (d3d11 proxy)', '\tCommunityShaders.dll', '\td3d11.dll', ''] },
    pap: { exc: 'EXCEPTION_ACCESS_VIOLATION', addr: '0x7FF6A4B0A9D0 SkyrimSE.exe+0B0A9D0', ram: '8.40 GB/16.00 GB',
      stack: ['0x7FF6A4B0A9D0 SkyrimSE.exe+0B0A9D0 -> 38920+0x30  Actor::UpdateAI', '0x7FF6A4B09C30 SkyrimSE.exe+0B09C30', '0x7FF6A4E71A50 SkyrimSE.exe+0E71A50  BSScript::Internal::VirtualMachine::RunQueue', '0x7FFA3C8E2210 PapyrusUtil.dll+0002210'],
      texts: ['\tFORM: 000A2C94 "Dremora Lord"  script SummonController.pex', '\tStack depth: 14 235 frames (limit 15 000)'], plugins: ['\t[ 5]  Common Clothes and Armors.esp', '\t[FE:0A2] Summoners Reloaded.esp'] }
  };
  const crash = (n, when, key, aud) => ({ n, when, crash: true, err: 'Unhandled exception "EXCEPTION_ACCESS_VIOLATION" at ' + R[key].addr, aud, lines: crashBody(R[key]) });
  const ln = (n, when, err, lines) => ({ n, when, err, lines, aud: null });
  const s1 = n => T(`${n}× dans la pile d’appels`, `${n}× in the call stack`);
  return [
    crash('crash-2026-11-09-21-14-07.log', '09/11 21:14', 'mem', { sus: [
      ['[' + T('mémoire', 'memory') + ']', 17, T('RAM à 95 % au moment du crash', 'RAM at 95 % at crash time')], ['Whiterun Rebuilt - 8K Textures.esp', 12, T('cité 4×', 'cited 4×')], ['[texture]', 5, T('2 lignes « texture »', '2 “texture” lines')]], finds: [
      [1, T('RAM presque saturée au moment du crash (95 %)', 'RAM nearly saturated at crash time (95 %)'), '15.20 GB/16.00 GB', [], T('Réduire textures/mods gourmands, fermer les applications, pagefile.', 'Reduce textures/heavy mods, close applications, pagefile.')],
      [1, T('Plugins cités dans le crash log', 'Plugins cited in the crash log'), 'Whiterun Rebuilt - 8K Textures.esp, Common Clothes and Armors.esp', [], T('Désactiver ces plugins un par un (ou dichotomie) pour confirmer.', 'Disable these plugins one by one (or by bisection) to confirm.')],
      [1, T('Texture ou ressource corrompue / format non supporté', 'Corrupt texture or resource / unsupported format'), T('2 occurrence(s)', '2 occurrence(s)'), ['Textures\\terrain\\whiterun\\whiterun_ultra_8k.dds', 'Textures\\terrain\\whiterun\\whiterun_ultra_8k_n.dds'], T('Vérifier les textures récentes (format BC7/BC1, mipmaps), réinstaller le mod incriminé.', 'Check recent textures (BC7/BC1 format, mipmaps), reinstall the offending mod.')],
      [0, T('Mémoire unifiée : la « VRAM » annoncée n’est pas dédiée', 'Unified memory: the reported “VRAM” is not dedicated'), T('Le GPU partage la RAM du Mac (21.33 Go annoncés pour 16.00 Go de RAM) : seule la RAM compte.', 'The GPU shares the Mac’s RAM (21.33 GB reported for 16.00 GB of RAM): only RAM counts.'), [], T('Surveiller la pression mémoire de macOS ; fermer les applications gourmandes.', 'Watch macOS memory pressure; close demanding applications.')]] }),
    ln('Papyrus.0.log', '09/11 21:14', '[11/09/2026 - 09:14:02PM] error: Cannot open store for class "sethirelingrehire3dnpc", missing file?', plain(
      '[11/09/2026 - 09:09:44PM] Papyrus log opened (PC)', '[11/09/2026 - 09:09:45PM] Update budget: 1.200000ms (Extra tasklet budget: 1.200000ms, Load screen budget: 500.000000ms)', '[11/09/2026 - 09:09:45PM] Memory page: 128 (min) 512 (max) 153600 (max total)',
      '[11/09/2026 - 09:12:31PM] VM is freezing...', '[11/09/2026 - 09:12:31PM] VM is frozen', '[11/09/2026 - 09:12:31PM] Saving game...', '[11/09/2026 - 09:12:32PM] VM is thawing...', '[11/09/2026 - 09:14:02PM] error: Cannot open store for class "sethirelingrehire3dnpc", missing file?')),
    ln('TrueDirectionalMovement.log', '09/11 21:09', '[00:12:09.274] [ 268 ] [W] Failed to obtain IDRC API', plain('[00:12:09.201] [ 268 ] [I] True Directional Movement 2.3.6 loaded', '[00:12:09.226] [ 268 ] [I] Found SmoothCam API', '[00:12:09.274] [ 268 ] [W] Failed to obtain IDRC API')),
    ln('SmoothCam.log', '09/11 21:09', '[00:12:09.162] [ 268 ] [W] Failed to dispatch API message to \'hdtsmp64\'', plain('[00:12:09.098] [ 268 ] [I] SmoothCam 2.0.5 loaded', '[00:12:09.140] [ 268 ] [I] Registered API with TrueDirectionalMovement', '[00:12:09.162] [ 268 ] [W] Failed to dispatch API message to \'hdtsmp64\'')),
    ln('skse64.log', '09/11 21:09', null, plain(
      'SKSE64 runtime: initialize (version = 2.2.6 01061170 01DD571C6E3CB52A, os = 6.2 (9200))', 'imagebase = 0000000140000000', 'plugin directory = C:\\Games\\Skyrim Special Edition\\Data\\SKSE\\Plugins\\',
      'checking plugin C:\\Games\\Skyrim Special Edition\\Data\\SKSE\\Plugins\\\\ActorLimitFix.dll', 'plugin ...\\ActorLimitFix.dll (00000001 ActorLimitFix 00000005) loaded correctly (handle 1)',
      'checking plugin C:\\Games\\Skyrim Special Edition\\Data\\SKSE\\Plugins\\\\msdia140.dll', 'plugin ...\\msdia140.dll (00000000 00000000) no version data 0 (handle 0)', 'checking plugin C:\\Games\\Skyrim Special Edition\\Data\\SKSE\\Plugins\\\\SmoothCam.dll', 'plugin ...\\SmoothCam.dll (00000001 SmoothCam 02000005) loaded correctly (handle 2)')),
    ln('EngineFixes.log', '09/11 21:09', null, plain('[2026-11-09 21:09:12.044] [I] SSE Engine Fixes 6.0.2 loaded', '[2026-11-09 21:09:12.051] [I] installed save game max size patch', '[2026-11-09 21:09:12.052] [I] installed memory manager patch (tbbmalloc)', '[2026-11-09 21:09:12.060] [I] installed misc memory access error fixes')),
    ln('po3_Tweaks.log', '09/11 21:09', null, plain('[21:09:12] [I] powerofthree\'s Tweaks 1.4.2 loaded', '[21:09:12] [I] Fix: Bow Zoom Camera - installed', '[21:09:12] [I] Fix: Sound Descriptor Tweak - installed')),
    ln('SSEDisplayTweaks.log', '09/11 21:09', '[21:09:13] [error] Failed to apply borderless upscaling (running through a compatibility layer)', plain('[21:09:13] [I] SSE Display Tweaks 0.6.2 loaded', '[21:09:13] [I] Frame rate limit: 60', '[21:09:13] [error] Failed to apply borderless upscaling (running through a compatibility layer)')),
    ln('StealthFixes.log', '09/11 21:09', null, plain('[21:09:13] [I] Stealth Fixes 1.2 loaded', '[21:09:13] [I] hooks installed')),
    ln('CrashLogger.log', '09/11 21:09', null, plain('[2026-11-09 21:09:11.980] [I] Crash Logger SSE v1.14.0 loaded', '[2026-11-09 21:09:11.981] [I] Runtime: 1.6.1170', '[2026-11-09 21:09:11.984] [I] Crash handler installed')),
    ln('JContainers64.log', '09/11 21:09', null, plain('JContainers 4.2.9 for SE loaded', 'database: 0 objects restored from the save')),
    ln('ENBHelperSE.log', '09/11 21:09', null, plain('ENBHelperSE 1.0.7 loaded', 'ENB Series 0.505 found (d3d11 proxy)')),
    crash('crash-2026-11-09-20-02-51.log', '09/11 20:02', 'enb', { sus: [
      ['ENBSeries.dll', 9, s1(5)], ['[' + T('graphique', 'graphics') + '] ENB/d3d11', 6, T('composants chargés', 'components loaded')]], finds: [
      [1, T('Problème de rendu / shader / pilote graphique', 'Rendering / shader / graphics driver problem'), T('3 occurrence(s)', '3 occurrence(s)'), ['ENBSeries.dll+0009E40', 'CommunityShaders.dll+00031A0'], T('Désactiver ENB/ReShade/DXVK-D3DMetal en test, vérifier la couche de compatibilité (Wine/CrossOver/GPTK), baisser les réglages graphiques et les effets de particules.', 'Disable ENB/ReShade/DXVK-D3DMetal as a test, check the compatibility layer (Wine/CrossOver/GPTK), lower graphics settings and particle effects.')],
      [0, T('Moteur graphique sous Wine : D3DMetal (GPTK)', 'Graphics engine under Wine: D3DMetal (GPTK)'), T('DirectX 11/12 est traduit vers Metal par la couche d’Apple intégrée à CrossOver.', 'DirectX 11/12 is translated to Metal by Apple’s layer built into CrossOver.'), [], T('Avec ENB/ReShade, vérifier que d3d11 est en override « native, builtin » ; en cas de crash graphique, tester le backend DXVK de la bouteille (un changement à la fois).', 'With ENB/ReShade, check that d3d11 is overridden as “native, builtin”; on a graphics crash, try the bottle’s DXVK backend (one change at a time).')]] }),
    crash('crash-2026-11-08-18-40-12.log', '08/11 18:40', 'pap', { sus: [
      ['[script]', 6, T('3 lignes « script »', '3 “script” lines')], ['SummonController.pex', 4, T('cité 3×', 'cited 3×')], ['Common Clothes and Armors.esp', 3, T('cité 1×', 'cited 1×')]], finds: [
      [1, T('Moteur de script (Papyrus) impliqué', 'Script engine (Papyrus) involved'), T('3 occurrence(s)', '3 occurrence(s)'), ['Stack depth: 14 235 frames (limit 15 000)'], T('Scripts surchargés ou mods retirés en cours de partie : consulter Papyrus.0.log, nettoyer la sauvegarde (ReSaver).', 'Overloaded scripts or mods removed mid-playthrough: check Papyrus.0.log, clean the save (ReSaver).')]] })
  ];
}
/* signalements propres à skse64.log (le journal est « vert » à la liste : le moteur d'audit le relève quand même) */
const SKSE_AUD = () => ({ sus: [['msdia140.dll', 5, T('refusé/en erreur au chargement SKSE', 'refused/errored at SKSE load')]], finds: [
  [2, T('Plugin SKSE en échec : msdia140.dll', 'SKSE plugin failed: msdia140.dll'), '', ['plugin ...\\msdia140.dll (00000000 00000000) no version data 0 (handle 0)'], T('Mettre à jour le plugin pour la version du jeu/SKSE, ou le retirer.', 'Update the plugin for the game/SKSE version, or remove it.')],
  [0, T('SKSE 2.2.6 — runtime 1.6.1170', 'SKSE 2.2.6 — runtime 1.6.1170'), '', [], '']] });
const EXTRA_FILES = () => [
  { n: 'Papyrus.1.log', err: '[11/08/2026 - 06:38:10PM] error: Cannot open store for class "dbm_mcm", missing file?' },
  { n: 'ENBHelperPlus.log', err: null }, { n: 'crash-2026-10-07-22-35-01.log', err: 'Unhandled exception "EXCEPTION_ACCESS_VIOLATION" at 0x0002D51C2FA4' }];

/* ---- réponses de l'assistant : sections VERDICT / CAUSE / CONFIANCE / PREUVES / ACTIONS / MANQUE ---- */
const ANSWERS = () => ({
  mem: [['verdict', T('Le dernier crash (09/11, 21:14) est un manque de mémoire au chargement des textures de terrain 8K près de Blancherive.', 'The last crash (09/11, 21:14) is a memory shortage while loading the 8K terrain textures near Whiterun.')],
    ['cause', T('`SkyrimSE.exe+0D4A2F0` lit une texture que le jeu n’a pas pu allouer : la mémoire unifiée du Mac était pleine à 95 % (15,2 Go sur 16).', '`SkyrimSE.exe+0D4A2F0` reads a texture the game could not allocate: the Mac’s unified memory was 95 % full (15.2 of 16 GB).')],
    ['confiance', T('Élevée.', 'High.')],
    ['preuves', [T('`BSTextureDB::Load` est en haut de la pile d’appels dans `crash-2026-11-09-21-14-07.log`.', '`BSTextureDB::Load` is at the top of the call stack in `crash-2026-11-09-21-14-07.log`.'), T('`Whiterun Rebuilt - 8K Textures.esp` est cité 4 fois dans le même rapport.', '`Whiterun Rebuilt - 8K Textures.esp` is cited 4 times in the same report.'), T('La mémoire était à 95 % quand le jeu a planté.', 'Memory was at 95 % when the game crashed.'), T('SSE Engine Fixes et l’Address Library correspondent à votre jeu (1.6.1170) : ils ne sont pas en cause.', 'SSE Engine Fixes and the Address Library match your game (1.6.1170): they are not the cause.')]],
    ['actions', [T('Remplacez le pack 8K par sa version 2K, ou désactivez-le le temps d’un test.', 'Replace the 8K pack with its 2K version, or disable it for a test.'), T('Fermez les autres applications avant de lancer le jeu.', 'Close other applications before launching the game.'), T('Rejouez, puis cliquez sur **Analyser les logs** : aucun nouveau crash ne doit apparaître.', 'Play again, then click **Analyze logs**: no new crash should appear.')], true],
    ['manque', T('Le rapport ne dit pas quelle texture se chargeait. Un crash dans la même zone avec le pack 2K écarterait le pack.', 'The report doesn’t say which texture was loading. A crash in the same area with the 2K pack would rule the pack out.')]],
  enb: [['verdict', T('Le crash de 20 h 02 vient d’ENB, pas d’un mod.', 'The 20:02 crash comes from ENB, not from a mod.')],
    ['cause', T('`ENBSeries.dll` est cité 5 fois dans la pile d’appels de `crash-2026-11-09-20-02-51.log`, et Community Shaders s’injecte lui aussi dans `d3d11.dll`.', '`ENBSeries.dll` is cited 5 times in the call stack of `crash-2026-11-09-20-02-51.log`, and Community Shaders also injects into `d3d11.dll`.')],
    ['confiance', T('Moyenne.', 'Medium.')],
    ['preuves', [T('`ENBSeries.dll+0009E40` est le point de crash.', '`ENBSeries.dll+0009E40` is the crash point.'), T('`CommunityShaders.dll` apparaît dans la même pile.', '`CommunityShaders.dll` shows up in the same stack.')]],
    ['actions', [T('Gardez un seul des deux : ENB ou Community Shaders.', 'Keep only one of the two: ENB or Community Shaders.'), T('Supprimez les fichiers de l’autre à la racine du jeu.', 'Remove the other one’s files from the game root.'), T('Avec ENB, vérifiez que `d3d11` est en override « native, builtin » dans la bouteille.', 'With ENB, check that `d3d11` is overridden as “native, builtin” in the bottle.')], true],
    ['manque', T('Je ne connais pas le preset ENB utilisé.', 'I don’t know which ENB preset you use.')]],
  pap: [['verdict', T('Le crash du 08/11 est un script d’invocation qui ne s’arrête jamais.', 'The 08/11 crash is a summoning script that never stops.')],
    ['cause', T('`SummonController.pex` empile les appels : 14 235 niveaux, pour une limite de 15 000.', '`SummonController.pex` keeps stacking calls: 14,235 levels, for a limit of 15,000.')],
    ['confiance', T('Élevée.', 'High.')],
    ['preuves', [T('`Stack depth: 14 235 frames (limit 15 000)` dans `crash-2026-11-08-18-40-12.log`.', '`Stack depth: 14 235 frames (limit 15 000)` in `crash-2026-11-08-18-40-12.log`.'), T('`Actor::UpdateAI` en haut de la pile, sur « Dremora Lord ».', '`Actor::UpdateAI` at the top of the stack, on “Dremora Lord”.')]],
    ['actions', [T('Désactivez le mod d’invocation concerné (`Summoners Reloaded.esp`).', 'Disable the summoning mod involved (`Summoners Reloaded.esp`).'), T('Chargez une sauvegarde antérieure, ou nettoyez-la avec ReSaver.', 'Load an earlier save, or clean it with ReSaver.')], true],
    ['manque', T('Je ne vois pas la date de la sauvegarde où le script a démarré.', 'I can’t see the date of the save where the script started.')]],
  skse: [['verdict', T('`msdia140.dll` n’est pas un plugin SKSE : SKSE le refuse au chargement.', '`msdia140.dll` is not an SKSE plugin: SKSE refuses it at load time.')],
    ['cause', T('C’est une bibliothèque de débogage de Microsoft, déposée par erreur dans `Data\\SKSE\\Plugins`. Le journal indique `no version data`.', 'It is a Microsoft debugging library, dropped by mistake into `Data\\SKSE\\Plugins`. The log says `no version data`.')],
    ['confiance', T('Élevée.', 'High.')],
    ['preuves', [T('`plugin ...\\msdia140.dll (00000000 00000000) no version data 0 (handle 0)` dans `skse64.log`.', '`plugin ...\\msdia140.dll (00000000 00000000) no version data 0 (handle 0)` in `skse64.log`.'), T('Les autres plugins se chargent correctement (SKSE 2.2.6, jeu 1.6.1170).', 'The other plugins load correctly (SKSE 2.2.6, game 1.6.1170).')]],
    ['actions', [T('Retirez `msdia140.dll` du dossier des plugins SKSE.', 'Remove `msdia140.dll` from the SKSE plugins folder.'), T('Relancez le jeu et vérifiez `skse64.log`.', 'Restart the game and check `skse64.log`.')], true],
    ['manque', T('Je ne sais pas quel mod a installé ce fichier.', 'I don’t know which mod installed that file.')]],
  purge: [['verdict', T('Vous pouvez purger sans risque : l’analyse garde l’historique.', 'You can purge safely: the analysis keeps the history.')],
    ['cause', T('Les rapports de crash sont archivés avant la purge ; seuls les autres journaux (SKSE, Papyrus) sont supprimés.', 'Crash reports are archived before the purge; only the other logs (SKSE, Papyrus) are deleted.')],
    ['actions', [T('Exportez d’abord le diagnostic (⌘E) si vous voulez le partager.', 'Export the diagnostic first (⌘E) if you want to share it.'), T('Cliquez sur **Purger les logs**, jouez, puis relancez l’analyse.', 'Click **Purge logs**, play, then run the analysis again.')], true]],
  none: [['verdict', T('Il n’y a aucun journal à analyser pour l’instant.', 'There is no log to analyze right now.')],
    ['actions', [T('Jouez jusqu’au prochain crash : la surveillance des dossiers le détectera.', 'Play until the next crash: folder monitoring will pick it up.'), T('Vérifiez les dossiers de logs dans **Réglages…**.', 'Check the log folders in **Settings…**.')], true]],
  other: [['verdict', T('Je ne trouve pas cela dans vos journaux.', 'I can’t find that in your logs.')],
    ['actions', [T('Demandez-moi la cause du dernier crash, ce que font les textures 8K, ENB, un script Papyrus ou l’erreur `msdia140.dll`.', 'Ask me about the cause of the last crash, the 8K textures, ENB, a Papyrus script or the `msdia140.dll` error.')], true]]
});
const pickAnswer = q => (/enb|shader|d3d|reshade|graph|community/i.test(q) ? 'enb' : /script|papyrus|summon|invoc|stack|pile/i.test(q) ? 'pap' : /msdia|skse|plugin|dll|version|address/i.test(q) ? 'skse' : /purg|supprim|delet|safe|sûr|sur |archiv|effac/i.test(q) ? 'purge' : /crash|plant|cause|m[ée]moire|memory|ram|texture|8k|2k|whiterun|blancherive|expli|why|pourquoi/i.test(q) ? 'mem' : 'other');
const TITLES = () => ({ verdict: 'VERDICT', cause: 'CAUSE', confiance: T('CONFIANCE', 'CONFIDENCE'), preuves: T('PREUVES', 'EVIDENCE'), actions: 'ACTIONS', manque: T('MANQUE', 'MISSING') });
const inline = txt => txt.split(/(\*\*[^*]+\*\*|`[^`]+`)/).filter(Boolean).map(p => (p.startsWith('**') ? h('strong', {}, p.slice(2, -2)) : p.startsWith('`') ? h('code', {}, p.slice(1, -1)) : p));
function answerDom(blocks) {
  const tt = TITLES(), root = h('div', { class: 'k-txt' });
  blocks.forEach(([key, body, num]) => {
    if (Array.isArray(body)) {
      root.append(h('span', { class: `k-l k-${key}` }, h('i', {}, tt[key])));
      body.forEach((b, i) => root.append(h('span', { class: `k-b k-${key}` }, h('i', {}, num ? `${i + 1}.` : '–'), h('span', { class: 'k-body' }, inline(b)))));
    } else if (key === 'confiance') root.append(h('span', { class: 'k-l k-confiance' }, h('i', {}, tt[key]), h('span', { class: /^(élev|high)/i.test(body) ? 'k-lv-ok' : /^(moy|med)/i.test(body) ? 'k-lv-wn' : 'k-lv-dg' }, body)));
    else root.append(h('span', { class: `k-l k-${key}` }, h('i', {}, tt[key]), h('span', { class: 'k-body' }, inline(body))));
  });
  return root;
}
/* Écrit le contenu de `el` peu à peu en gardant sa mise en forme : on vide les nœuds texte puis on les remplit dans l'ordre. */
async function reveal(el, alive, scroller) {
  const nodes = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (tw.nextNode()) nodes.push([tw.currentNode, tw.currentNode.data]);
  if (reduced()) return;
  nodes.forEach(([n]) => { n.data = ''; });
  const caret = h('i', { class: 'k-caret' }); el.append(caret);
  const total = nodes.reduce((a, [, t]) => a + t.length, 0), step = Math.max(2, Math.ceil(total / 300)); let k = 0;
  for (const [n, t] of nodes) {
    n.parentNode && n.parentNode.insertBefore(caret, n.nextSibling);
    for (let i = 0; i < t.length; i += step) { if (!alive()) return; n.data = t.slice(0, i + step); if (scroller) scroller.scrollTop = scroller.scrollHeight; if (k++ % 8 === 0) sfx.tick(); await wait(16); }
    n.data = t;
  }
  caret.remove();
}

/** Feuille modale plate au-dessus de la fenêtre (Échap ferme, Tab reste dans la feuille). */
function sheet(root, { title, body, foot, width = 440, label, cls = '' }) {
  const prev = document.activeElement;
  const card = h('div', { class: 'x-sheet ' + cls, role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'sKYCRASH', style: { width: width + 'px' } }, title ? h('div', { class: 'x-st' }, title) : null, body, foot ? h('div', { class: 'x-sf' }, foot) : null);
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
  (card.querySelector('[data-first]') || card.querySelector('.act:not(:disabled)') || card.querySelector('.acc:not(:disabled)') || card.querySelector('input,select') || card.querySelector('button')).focus({ preventScroll: true });
  return { close, card };
}

/** Raccourcis clavier valables tant que cette fenêtre est la fenêtre active (même si le focus est tombé sur la page) ; l'écouteur se retire tout seul à la fermeture. */
function hotkeys(w, root, fn) {
  const on = e => { if (!root.isConnected) { removeEventListener('keydown', on); return; } if (w.el.classList.contains('active') && !root.querySelector(':scope > .x-back')) fn(e); };
  addEventListener('keydown', on); return () => removeEventListener('keydown', on);
}

export function open(app) {
  css('css/demos/sKYCRASH.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1080, h: 680, minw: 920, minh: 540, bare: true, cls: 'socle', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); },
    build: w => {
      const alive = () => !w.dead && root.isConnected;
      let logs = makeLogs(), mode = 'scan', busy = false, auditBusy = false, chatBusy = false, auditDone = false, think = 0, lastFile = null, kbBusy = false;
      const cfg = { lang: 'auto', gameDir: GAME_DIR, watch: true, mortex: true, folders: [GAME_DIR.replace('Skyrim Special Edition/', '') + 'Skyrim Special Edition/SKSE', '/Users/Shared/Skyrim/Documents/My Games/Skyrim Special Edition/Logs/Script'], provider: 'gemini', gmodel: 'gemini-2.5-flash', gkey: '', ourl: 'http://localhost:11434', omodel: 'llama3.1', jev: '', skills: true, web: false, anon: true, kbAuto: true };
      const kb = { n: 22, when: '02/11 21:07', failed: 1 };
      const root = h('div', { class: 'skycrash', tabindex: '-1' });
      const rep = h('div', { class: 'k-rep', role: 'region', tabindex: '0', 'aria-label': T('Rapport', 'Report') });
      const list = h('div', { class: 'k-logs' });
      const chat = h('div', { class: 'k-chat', role: 'log', tabindex: '0', 'aria-label': T('Conversation avec l’assistant', 'Conversation with the assistant') });
      const kbEl = h('span', { class: 'k-kb' });
      const input = h('input', { class: 'k-in', type: 'text', placeholder: T('Votre question…', 'Your question…'), 'aria-label': T('Votre question', 'Your question'), autocomplete: 'off', onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); send(); } } });
      const sendBtn = h('button', { class: 'sbtn acc', onclick: () => send() }, T('Envoyer', 'Send'));
      const analyzeBtn = h('button', { class: 'sbtn act', onclick: () => analyze() }, T('Analyser les logs', 'Analyze logs'));
      const auditBtn = h('button', { class: 'sbtn acc', onclick: () => runAudit() }, T('Audit approfondi', 'Deep audit'));
      const explainBtn = h('button', { class: 'sbtn', onclick: () => explain() }, T('Expliquer le crash', 'Explain the crash'));
      const exportBtn = h('button', { class: 'sbtn', title: T('Un seul fichier avec tout le contexte du plantage, à transmettre (⌘E)', 'One file with the whole crash context, to share (⌘E)'), onclick: () => exportDiag() }, T('Exporter le diagnostic…', 'Export diagnostic…'));
      const purgeBtn = h('button', { class: 'sbtn dgr', title: T('Supprime les .log / .log0 des répertoires configurés', 'Deletes the .log / .log0 files of the configured folders'), onclick: () => purge() }, T('Purger les logs', 'Purge logs'));
      root.append(
        h('div', { class: 'k-tb', 'data-drag': '' }, wm.lights(w), h('div', { class: 'k-tt', html: brand(app.id, app.accent) })),
        h('div', { class: 'k-main' },
          h('div', { class: 'k-left' },
            h('div', { class: 'k-btns' }, analyzeBtn, auditBtn, h('button', { class: 'sbtn', onclick: () => pickFile() }, T('Fichier…', 'File…')), h('button', { class: 'sbtn', title: T('Langue, dossiers de logs, IA, base de connaissances (⌘,)', 'Language, log folders, AI, knowledge base (⌘,)'), onclick: () => settings() }, T('Réglages…', 'Settings…'))),
            rep, list, h('div', { class: 'k-bot' }, exportBtn, purgeBtn)),
          h('div', { class: 'k-right' }, h('div', { class: 'k-ah' }, h('h3', {}, T('Assistant IA', 'AI Assistant')), kbEl), chat, h('div', { class: 'k-ask' }, input, sendBtn), explainBtn)));

      /* ---- rapport ---- */
      const line = (parts, i) => h('div', { class: 'k-ln', style: { '--i': i } }, ...(Array.isArray(parts) ? parts : [parts]).map(p => (typeof p === 'string' ? p : h('span', { class: p[1] || '' }, p[0]))));
      const setRep = lines => { rep.replaceChildren(...lines.map((l, i) => line(l, i))); rep.scrollTop = 0; };
      const crashes = () => logs.filter(l => l.crash);
      function scanLines() {
        const out = [[['● SKYRIM', 'w b']]]; const err = [...logs.filter(l => l.crash), ...logs.filter(l => !l.crash)].filter(l => l.err);
        if (!logs.length) out.push([[T('  Aucun fichier .log trouvé. Configurez les dossiers dans Réglages… > Dossiers de logs.', '  No .log file found. Set up the folders in Settings… > Log folders.'), '']]);
        else if (!err.length) out.push([['  ✅ ' + T('Aucun problème détecté.', 'No problem detected.'), 'o']]);
        else err.forEach(l => out.push([`  • [SKSE] ${l.n} : `, [l.err, 'd']]));
        return out;
      }
      function analyze() { if (auditBusy) return; sfx.click(); mode = 'scan'; lastFile = null; setRep(scanLines()); }
      function auditLines() {
        const cs = crashes(); const sus = new Map(), finds = [];
        const pool = logs.map(l => (l.n === 'skse64.log' ? { ...l, aud: SKSE_AUD() } : l));
        pool.forEach(l => (l.aud ? l.aud.sus.forEach(([n, sc, why]) => { const e = sus.get(n) || { n, sc: 0, why: why + ` (${l.n})` }; e.sc += sc; sus.set(n, e); }) : null));
        cs.forEach((l, i) => finds.push([2, T(`Crash détecté : EXCEPTION_ACCESS_VIOLATION${i === 0 ? ' (le plus récent)' : ''}`, `Crash detected: EXCEPTION_ACCESS_VIOLATION${i === 0 ? ' (most recent)' : ''}`), l.n, [l.err], T('Analyser le module fautif et la pile d’appels ci-dessous.', 'Analyze the faulty module and the call stack below.'), T(`Fichier ${l.n}`, `File ${l.n}`)]));
        pool.forEach(l => (l.aud ? l.aud.finds.forEach(f => finds.push([f[0], f[1], l.n, f[3], f[4], f[2]])) : null));
        const ranked = [...sus.values()].sort((a, b) => b.sc - a.sc).slice(0, 8);
        const out = [[[T(`AUDIT — suspect principal : ${ranked[0].n}`, `AUDIT — main suspect: ${ranked[0].n}`), 'w b']], [[T(`Installation : ${cfg.gameDir}`, `Installation: ${cfg.gameDir}`), 's']], []];
        out.push([[T('Suspects classés', 'Ranked suspects'), 'b t']]);
        ranked.forEach((s, i) => out.push([[`  ${i + 1}. ${s.n} `, i === 0 ? 'd' : ''], [T(`(score ${s.sc}) ${s.why}`, `(score ${s.sc}) ${s.why}`), 's']]));
        out.push([]);
        finds.sort((a, b) => b[0] - a[0]).forEach(f => {
          out.push([[`[${SEV[f[0]][lang() === 'fr' ? 0 : 1]}] `, SEV[f[0]][2] + ' b'], `${f[1]} — ${f[2]}`]);
          if (f[5]) out.push([['    ' + f[5], 'm']]);
          f[3].slice(0, 2).forEach(e => out.push([['    > ' + e, 's']]));
          if (f[4]) out.push([['    ' + T(`Piste : ${f[4]}`, `Lead: ${f[4]}`), 'a']]);
        });
        return out;
      }
      async function runAudit() {
        if (auditBusy) return; sfx.click();
        if (!logs.length) { mode = 'none'; setRep([[T('Aucun log à auditer. Configurez les dossiers dans Réglages… > Dossiers de logs.', 'No log to audit. Set up the folders in Settings… > Log folders.')]]); return; }
        auditBusy = true; auditBtn.disabled = true; mode = 'busy'; setRep([[T('Audit en cours…', 'Audit in progress…')]]);
        await wait(reduced() ? 0 : 1100); if (!alive()) return;
        auditBusy = false; auditBtn.disabled = false; auditDone = true; mode = 'audit'; setRep(auditLines()); sfx.done();
      }

      /* ---- liste des journaux ---- */
      function drawList(fresh) {
        list.replaceChildren();
        if (!logs.length) {
          list.append(h('div', { class: 'k-none' }, h('p', {}, T('Aucun journal pour le moment. Au prochain crash, la surveillance des dossiers le signalera.', 'No log yet. At the next crash, folder monitoring will flag it.')), h('button', { class: 'k-link', onclick: () => simulateCrash() }, T('Démo : simuler un crash', 'Demo: simulate a crash'))));
          return;
        }
        logs.forEach(l => list.append(h('button', { class: 'k-lr' + (fresh === l ? ' new' : ''), title: l.n, onclick: () => viewLog(l) }, h('span', { class: 'k-dot' + (l.err ? ' err' : '') }), h('b', {}, l.n), h('small', {}, `SKYRIM · SKSE · ${l.when}`))));
      }
      function viewLog(l) {
        sfx.tick();
        const view = h('div', { class: 'k-view', tabindex: '0', role: 'region', 'aria-label': l.n }, ...l.lines.map(t => h('div', { class: /(failed|error|cannot|missing|exception|access violation|null pointer)/i.test(t) ? 'hit' : '' }, t)));
        const s = sheet(root, { title: T(`Lecture : ${l.n}`, `Reading: ${l.n}`), width: 760, cls: 'big', body: h('div', { class: 'x-sb' }, view), foot: [h('button', { class: 'sbtn', 'data-first': '', onclick: () => s.close() }, T('Fermer', 'Close'))] });
      }
      function simulateCrash() {
        const d = new Date(), name = `crash-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}.log`;
        const src = makeLogs()[0]; const nl = { ...src, n: name, when: `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}` };
        logs.unshift(nl); drawList(nl); sfx.pop();
        if (cfg.watch) {
          toast({ icon: icon(app.id), title: app.id, body: T(`Nouveau crash détecté : ${name}`, `New crash detected: ${name}`) });
          mode = 'scan'; setRep(scanLines()); setTimeout(() => { if (alive() && !auditBusy) runAudit(); }, 1200);
        }
      }

      /* ---- fichier unique ---- */
      function pickFile() {
        const files = EXTRA_FILES(); let sel = 0;
        const lst = h('div', { class: 'x-list' }), draw = () => lst.replaceChildren(...files.map((f, i) => h('button', { class: 'x-li' + (i === sel ? ' on' : ''), onclick: () => { sel = i; sfx.tick(); draw(); } }, h('span', { class: 'n' }, h('b', {}, f.n), h('small', {}, '/Users/Shared/Skyrim/Documents/My Games/Skyrim Special Edition/SKSE')))));
        const s = sheet(root, { title: T('Ouvrir Log', 'Open Log'), width: 560, body: h('div', { class: 'x-sb' }, h('span', { class: 'm' }, '*.log, *.txt'), lst),
          foot: [h('span', { class: 'x-note' }, T('Fichiers d’exemple : rien n’est lu sur votre ordinateur.', 'Sample files: nothing is read from your computer.')), h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { s.close(); const f = files[sel]; mode = 'file'; sfx.pop(); setRep([f.err ? [`• ${f.n} : `, [f.err, 'd']] : [['✅ ' + T(`Aucun problème détecté dans ${f.n}.`, `No problem detected in ${f.n}.`), 'o']]]); } }, T('Ouvrir', 'Open'))] });
        draw();
      }

      /* ---- export du diagnostic (feuille d'enregistrement) ---- */
      function exportDiag() {
        if (!logs.length) return info(T('Aucun log à exporter. Configurez les dossiers dans Réglages… > Dossiers de logs.', 'No log to export. Set up the folders in Settings… > Log folders.'));
        const d = new Date(), name = h('input', { class: 'k-f', value: `sKYCRASH-diagnostic-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.md`, 'aria-label': T('Nom du fichier', 'File name'), 'data-first': '' });
        const s = sheet(root, { title: T('Exporter le diagnostic', 'Export diagnostic'), width: 520, body: h('div', { class: 'x-sb' }, h('div', { class: 'k-row' }, h('label', { class: 'k-rl', style: { width: '96px' } }, T('Enregistrer sous :', 'Save as:')), h('div', { class: 'k-rc' }, name)), h('div', { class: 'k-row' }, h('label', { class: 'k-rl', style: { width: '96px' } }, T('Où :', 'Where:')), h('div', { class: 'k-rc' }, h('span', { class: 'm' }, T('Bureau', 'Desktop')))),
          h('p', { class: 'k-note' }, T('Un seul fichier avec tout le contexte du plantage : audit, installation vérifiée, extraits de logs. Les chemins personnels sont anonymisés.', 'One file with the whole crash context: audit, verified installation, log excerpts. Personal paths are anonymized.'))),
          foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { const n = name.value.trim() || 'diagnostic.md'; s.close(); doExport(n); } }, T('Enregistrer', 'Save'))] });
        name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); s.card.querySelector('.acc').click(); } });
      }
      async function doExport(n) {
        exportBtn.disabled = true; sfx.click(); await wait(reduced() ? 0 : 700); if (!alive()) return;
        exportBtn.disabled = false; auditDone = true; mode = 'audit'; setRep(auditLines()); sfx.done();
        toast({ icon: icon(app.id), title: app.id, body: T(`Diagnostic exporté : ${n}`, `Diagnostic exported: ${n}`) });
      }

      /* ---- purge ---- */
      function alertBox(msg, buttons, title) {
        const s = sheet(root, { width: 460, label: title || app.id, body: h('div', { class: 'x-al' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('b', {}, title || msg.split('\n')[0]), title ? h('p', {}, msg) : (msg.includes('\n') ? h('p', {}, msg.split('\n').slice(1).join('\n').trim()) : null))), foot: buttons(() => s.close()) });
        return s;
      }
      const info = msg => alertBox(msg, close => [h('button', { class: 'sbtn acc', onclick: close }, 'OK')]);
      function purge() {
        if (!logs.length) return info(T('Aucun fichier log à supprimer.', 'No log file to delete.'));
        const nCrash = logs.filter(l => l.crash).length, n = logs.length - nCrash;
        const dirs = cfg.folders.join('\n');
        alertBox(T(`Supprimer définitivement ${n} fichier(s) log ?\n\nDossiers concernés :\n${dirs}\n\n${nCrash ? `Les ${nCrash} rapport(s) de plantage sont archivés dans « Crash archive » : l’historique les garde.\n` : ''}Les autres logs sont supprimés : action irréversible.`,
          `Permanently delete ${n} log file(s)?\n\nFolders concerned:\n${dirs}\n\n${nCrash ? `The ${nCrash} crash report(s) are archived in “Crash archive”: the history keeps them.\n` : ''}The other logs are deleted: this cannot be undone.`),
        close => [h('button', { class: 'sbtn', 'data-first': '', onclick: close }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn dgx', onclick: () => { close(); doPurge(n, nCrash); } }, T('Supprimer', 'Delete'))], T('Purger les logs', 'Purge logs'));
      }
      function doPurge(n, k) {
        logs = []; auditDone = false; sfx.pop(); drawList(); mode = 'scan'; setRep(scanLines());
        toast({ icon: icon(app.id), title: app.id, body: T(`${n} fichier(s) supprimé(s). ${k} rapport(s) de plantage archivé(s).`, `${n} file(s) deleted. ${k} crash report(s) archived.`) });
      }

      /* ---- assistant ---- */
      const drawChat = () => { if (!chat.childElementCount) chat.append(h('div', { class: 'k-ph' }, T('Posez une question sur le dernier crash…', 'Ask a question about the last crash…'))); };
      const toBottom = () => { chat.scrollTop = chat.scrollHeight; };
      function msg(cls, who, content) { chat.querySelector('.k-ph')?.remove(); const m = h('div', { class: 'k-msg' }, h('span', { class: 'k-who ' + cls }, who), content); chat.append(m); toBottom(); return m; }
      function explain() { if (chatBusy) return; input.value = T('Quelle est la cause la plus probable du dernier crash ? Que dois-je vérifier en premier ?', 'What is the most likely cause of the last crash? What should I check first?'); send(); }
      async function send() {
        const q = input.value.trim(); if (!q || chatBusy) return;
        input.value = ''; chatBusy = true; explainBtn.disabled = true; sfx.click();
        msg('you', T('Vous', 'You'), h('div', { class: 'k-txt k-body' }, q));
        const wt = h('div', { class: 'k-think' }, T('Assistant réfléchit', 'Assistant is thinking'), h('i'), h('i'), h('i')); chat.append(wt); toBottom();
        const dots = setInterval(() => { think++; sendBtn.textContent = '●'.repeat(think % 3 + 1); }, 350); sendBtn.disabled = true; sendBtn.textContent = '●';
        await wait(reduced() ? 0 : 1300); clearInterval(dots); wt.remove(); sendBtn.disabled = false; sendBtn.textContent = T('Envoyer', 'Send'); if (!alive()) return;
        const key = !logs.length ? 'none' : (!crashes().length && ['mem', 'enb', 'pap'].includes(pickAnswer(q)) ? 'none' : pickAnswer(q));
        const body = answerDom(ANSWERS()[key]); const m = msg('ai', T('Assistant', 'Assistant'), body);
        if (!auditDone && logs.length && key !== 'none') { auditDone = true; mode = 'audit'; setRep(auditLines()); }
        await reveal(body, alive, chat); if (!alive()) return;
        chatBusy = false; explainBtn.disabled = false; sfx.done(); toBottom(); input.focus({ preventScroll: true }); m.classList.add('done');
      }

      /* ---- base de connaissances ---- */
      function drawKb() {
        kbEl.title = kb.failed ? 'Reddit r/skyrimmods : timeout' : '';
        kbEl.textContent = kbBusy ? T('Base de connaissances : mise à jour…', 'Knowledge base: updating…') : !cfg.kbAuto ? T('Base de connaissances : veille désactivée', 'Knowledge base: monitoring off')
          : T(`Base de connaissances : ${kb.n} sources, mise à jour ${kb.when}`, `Knowledge base: ${kb.n} sources, updated ${kb.when}`) + (kb.failed ? T(` — ${kb.failed} en échec`, ` — ${kb.failed} failed`) : '');
      }

      /* ---- réglages (feuille) ---- */
      function settings(startTab = 'general') {
        const d = { ...cfg, folders: [...cfg.folders] }; let tab = startTab, selFolder = -1, status = '';
        const tabs = [['general', T('Général', 'General')], ['folders', T('Dossiers de logs', 'Log folders')], ['ai', T('IA', 'AI')], ['kb', T('Base de connaissances', 'Knowledge base')]];
        const bar = h('div', { class: 'ssegs', role: 'tablist' }), set = h('div', { class: 'k-set' }), stat = h('p', { class: 'k-stat', 'aria-live': 'polite' });
        const row = (label, ...c) => h('div', { class: 'k-row' }, h('label', { class: 'k-rl' }, label), h('div', { class: 'k-rc' }, ...c));
        const fld = (key, o = {}) => h('input', { class: 'k-f', type: o.type || 'text', value: d[key] ?? '', placeholder: o.ph || '', autocomplete: 'off', spellcheck: 'false', 'aria-label': o.label || key, oninput: e => { d[key] = e.target.value; } });
        const chk = (key, label) => h('button', { class: 'k-ck', role: 'checkbox', 'aria-checked': !!d[key], onclick: e => { d[key] = !d[key]; sfx.tick(); const b = e.currentTarget; b.setAttribute('aria-checked', d[key]); b.firstChild.className = 'cb' + (d[key] ? ' on' : ''); b.firstChild.textContent = d[key] ? '✓' : ''; } }, h('span', { class: 'cb' + (d[key] ? ' on' : '') }, d[key] ? '✓' : ''), h('span', {}, label));
        const seg = (key, opts) => h('div', { class: 'ssegs' }, opts.map(([v, l]) => h('button', { class: d[key] === v ? 'on' : '', onclick: e => { d[key] = v; sfx.tick(); [...e.currentTarget.parentNode.children].forEach(b => b.classList.toggle('on', b === e.currentTarget)); } }, l)));
        const setStat = t => { status = t; stat.textContent = t; };
        const pools = ['/Users/Shared/Skyrim/MO2/overwrite/SKSE', '/Users/Shared/Skyrim/Documents/My Games/Skyrim Special Edition/Logs/Script/Papyrus'];
        function draw() {
          bar.replaceChildren(...tabs.map(([k, l]) => h('button', { class: tab === k ? 'on' : '', role: 'tab', 'aria-selected': tab === k, onclick: () => { tab = k; sfx.tick(); draw(); } }, l)));
          set.replaceChildren();
          if (tab === 'general') {
            const lg = h('select', { class: 'k-f', 'aria-label': T('Langue', 'Language'), onchange: e => { d.lang = e.target.value; } }, [['auto', T('Automatique (système)', 'Automatic (system)')], ['fr', 'Français'], ['en', 'English']].map(([v, l]) => h('option', { value: v, selected: d.lang === v }, l)));
            set.append(row(T('Langue', 'Language'), lg), row(T('Dossier du jeu', 'Game folder'), fld('gameDir', { ph: T('Auto (CrossOver) — ou dossier contenant SkyrimSE.exe', 'Auto (CrossOver) — or folder containing SkyrimSE.exe'), label: T('Dossier du jeu', 'Game folder') }),
              h('button', { class: 'sbtn', onclick: () => { d.gameDir = d.gameDir === GAME_DIR ? '/Volumes/Games/Skyrim Special Edition/' : GAME_DIR; draw(); sfx.tick(); } }, T('Choisir…', 'Choose…'))),
              row(T('Surveillance', 'Monitoring'), chk('watch', T('Surveiller les dossiers : nouveau crash = notification + audit automatique', 'Watch the folders: new crash = notification + automatic audit'))),
              row(T('Échange avec mORTEX', 'Exchange with mORTEX'), chk('mortex', T('Exporter les analyses pour mORTEX (fichier crash_events.jsonl, sans chemin personnel)', 'Export analyses for mORTEX (crash_events.jsonl file, no personal paths)'))));
          } else if (tab === 'folders') {
            const fl = h('div', { class: 'k-fl', role: 'listbox' });
            const df = () => fl.replaceChildren(...d.folders.map((f, i) => h('button', { class: 'k-fi' + (i === selFolder ? ' on' : ''), role: 'option', 'aria-selected': i === selFolder, title: f, onclick: () => { selFolder = i; sfx.tick(); df(); rm.disabled = false; } }, f)));
            const rm = h('button', { class: 'sbtn', disabled: selFolder < 0, onclick: () => { d.folders.splice(selFolder, 1); selFolder = -1; rm.disabled = true; df(); sfx.tick(); } }, T('Retirer', 'Remove'));
            set.append(h('p', { class: 'k-note', html: esc(T('Dossiers où ', 'Folders where ')) + brand(app.id, app.accent) + esc(T(' cherche les logs de crash, SKSE et Papyrus. Le dossier SKSE (journal SKSE et rapports de Crash Logger) est toujours analysé, même s’il n’est pas dans la liste.', ' looks for crash, SKSE and Papyrus logs. The SKSE folder (SKSE log and Crash Logger reports) is always analyzed, even if it is not in the list.')) }),
              h('p', { class: 'k-ssub' }, 'SKYRIM'), fl, h('div', { class: 'k-rc' }, h('button', { class: 'sbtn', onclick: () => { const nx = pools.find(p => !d.folders.includes(p)); if (nx) { d.folders.push(nx); df(); sfx.tick(); } else setStat(T('Plus de dossier d’exemple à ajouter.', 'No more sample folders to add.')); } }, T('Ajouter…', 'Add…')), rm));
            df();
          } else if (tab === 'ai') {
            set.append(row(T('Fournisseur', 'Provider'), seg('provider', [['gemini', 'gemini'], ['ollama', 'ollama']])),
              row(T('Modèle Gemini', 'Gemini model'), fld('gmodel'), h('button', { class: 'sbtn', onclick: () => setStat(T('6 modèle(s) Gemini disponible(s).', '6 Gemini model(s) available.')) }, T('Actualiser', 'Refresh'))),
              row(T('Clé API Gemini', 'Gemini API key'), fld('gkey', { type: 'password', ph: T('Coller la clé API', 'Paste the API key') })),
              row(T('URL Ollama', 'Ollama URL'), fld('ourl')), row(T('Modèle Ollama', 'Ollama model'), fld('omodel'), h('button', { class: 'sbtn', onclick: () => setStat(T('Liste indisponible (Ollama ne répond pas). Vous pouvez saisir le nom du modèle.', 'List unavailable (Ollama is not responding). You can type the model name.')) }, T('Actualiser', 'Refresh'))),
              row(T('Clé Jev (vérification)', 'Jev key (check)'), fld('jev', { type: 'password', ph: T('Facultatif : clé TypeSafe', 'Optional: TypeSafe key') }), h('button', { class: 'sbtn', onclick: () => setStat(T('Ouvre la console TypeSafe dans votre navigateur.', 'Opens the TypeSafe console in your browser.')) }, T('Voir le solde ↗', 'View balance ↗'))),
              row('', h('p', { class: 'k-note' }, T('Ce mois-ci : 12 requête(s) Jev · 8 420 jetons (6 110 en entrée, 2 310 en sortie), comptés par l’appli. Le solde de crédits n’est visible que sur la console TypeSafe.', 'This month: 12 Jev request(s) · 8,420 tokens (6,110 in, 2,310 out), counted by the app. The credit balance is only visible on the TypeSafe console.'))),
              row(T('Connaissances', 'Knowledge'), chk('skills', T('Utiliser les fiches de connaissances modding Skyrim (dossier skills/)', 'Use the Skyrim modding knowledge sheets (skills/ folder)'))),
              row('', chk('web', T('Recherche web Google (Gemini uniquement, plus lent)', 'Google web search (Gemini only, slower)'))),
              row(T('Confidentialité', 'Privacy'), chk('anon', T('Anonymiser les chemins et e-mails avant envoi à Gemini', 'Anonymize paths and e-mails before sending to Gemini'))),
              h('p', { class: 'k-note' }, T('La clé est stockée dans le Trousseau macOS (jamais en clair dans la config). Avec Gemini, le rapport d’audit et des extraits de logs sont envoyés à Google. Ollama reste 100 % local.', 'The key is stored in the macOS Keychain (never in plain text in the config). With Gemini, the audit report and log excerpts are sent to Google. Ollama stays 100 % local.')));
          } else {
            const upd = h('button', { class: 'sbtn', disabled: kbBusy, onclick: async () => { upd.disabled = true; kbBusy = true; drawKb(); setStat(T('Mise à jour de la base de connaissances…', 'Updating the knowledge base…')); sfx.click(); await wait(reduced() ? 0 : 1600); kbBusy = false; if (!alive()) return; const dt = new Date(); kb.when = `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`; kb.failed = 0; drawKb(); upd.disabled = false; sfx.done(); setStat(T('Base de connaissances : 22 source(s) mise(s) à jour, 0 en échec.', 'Knowledge base: 22 source(s) updated, 0 failed.')); lastUpd.textContent = T(`Dernière mise à jour de la base : ${dt.toLocaleDateString('fr-FR')} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`, `Last knowledge base update: ${dt.toLocaleDateString('en-GB')} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`); } }, T('Mettre à jour maintenant', 'Update now'));
            const lastUpd = h('p', { class: 'k-note' }, T('Dernière mise à jour de la base : 02/11/2026 21:07', 'Last knowledge base update: 02/11/2026 21:07'));
            set.append(row(T('Veille', 'Monitoring'), chk('kbAuto', T('Veille automatique : mettre à jour la base de connaissances (GitHub, Steam, Reddit, SKSE)', 'Automatic monitoring: update the knowledge base (GitHub, Steam, Reddit, SKSE)'))), row('', upd), row('', lastUpd));
          }
          stat.textContent = status;
        }
        const s = sheet(root, { title: T('Réglages', 'Settings'), width: 680, cls: 'big', body: h('div', { class: 'x-sb' }, bar, set, stat),
          foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn act', onclick: () => { s.close(); apply(d); } }, 'OK')] });
        draw();
      }
      function apply(d) {
        const lg = d.lang, was = cfg.watch; Object.assign(cfg, d, { gameDir: d.gameDir.trim() || GAME_DIR }); drawKb(); sfx.click();
        if (lg !== 'auto' && lg !== lang()) setLang(lg);
        else if (!was && cfg.watch) toast({ icon: icon(app.id), title: app.id, body: T('Surveillance des dossiers activée.', 'Folder monitoring enabled.') });
      }

      /* ---- clavier : ⌘E exporter, ⌘, réglages ---- */
      w.cleanup = hotkeys(w, root, e => {
        if (!(e.metaKey || e.ctrlKey)) return;
        if (e.key.toLowerCase() === 'e') { e.preventDefault(); exportDiag(); } else if (e.key === ',') { e.preventDefault(); settings(); }
      });

      drawKb(); drawChat(); drawList(); setRep(scanLines());
      return root;
    } });
}
