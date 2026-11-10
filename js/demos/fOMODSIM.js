/* fOMODSIM : réplique fidèle du simulateur d'installateurs FOMOD. Accueil, ouverture d'un mod, trois colonnes (actions, étapes, aperçu), étapes conditionnelles
   pilotées par des flags, dossier Data simulé (options « Auto »), infos du mod, staging avec arborescence et journal. Mods d'exemple fictifs : aucun fichier n'est lu. */
import { h, brand, wait, reduced, clamp, sfx, toast, icon, T, num, css, wm, dlBtn } from './kit.js';
css('css/demos/fOMODSIM.css');

const COLOR = '#1677dc';
const rng = seed => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };

/* ---------------------------- mods d'exemple (fictifs) ---------------------------- */
const O = (id, nm, ds, o = {}) => ({ id, name: T(...nm), desc: T(...ds), type: 'Optional', flags: {}, files: [], ...o });
const FL = (sd, dd, names, kb, prio = 1) => names.map((n, i) => ({ src: `${sd}/${n}`, dst: `${dd}/${n}`, kb: Array.isArray(kb) ? kb[i % kb.length] : kb, prio }));
const RESPX = f => (f.RES === '1K' ? 96 : f.RES === '4K' ? 640 : 192);
const TERR = ['tamriel_0', 'tamriel_1', 'mountain', 'mountain_n', 'grass', 'snow', 'road'].map(n => n + '.dds');

function modAncient() {
  const land = (tone, seed, sub) => f => ({ kind: 'land', tone, seed, px: RESPX(f), sub });
  const res = (key, label, kb) => FL(`01 Textures ${key}/textures/ancient/terrain`, 'textures/ancient/terrain', TERR, kb, 1);
  return {
    id: 'ar', name: 'Ancient Realms HD', author: 'Starfall Studio', version: '2.4.1', website: 'https://example.com/ancient-realms-hd', file: 'Ancient Realms HD-2-4-1.zip',
    description: T('Ancient Realms HD est une refonte complète des textures des paysages de Skyrim : terrain, falaises, rochers et ruines, en 1K, 2K ou 4K.\nCet installateur permet de choisir la résolution, le style du terrain et les patchs de compatibilité adaptés à votre ordre de chargement.',
      'Ancient Realms HD is a complete texture overhaul for the landscapes of Skyrim: terrain, cliffs, rocks and ruins, in 1K, 2K or 4K.\nThis installer lets you pick the resolution, the terrain style and the compatibility patches that fit your load order.'),
    required: [...FL('00 Core', '.', ['Ancient Realms HD.esp'], 14, 0), ...FL('00 Core/textures/ancient/core', 'textures/ancient/core', ['dirt01.dds', 'dirt01_n.dds', 'stone01.dds'], 2731, 0), ...FL('00 Core/SKSE/Plugins', 'SKSE/Plugins', ['AncientRealms.ini'], 1, 0)],
    steps: [
      { name: T('Résolution des textures', 'Texture resolution'), groups: [{ name: T('Résolution du paysage', 'Landscape resolution'), type: 'ExactlyOne', options: [
        O('r1', ['1K — Léger', '1K — Light'], ['Petites textures (1024 px) pour les cartes graphiques de 4 Go et les gros ordres de chargement. Le terrain proche paraît un peu flou.', 'Small textures (1024 px) for 4 GB graphics cards and big load orders. Close-up terrain looks a little soft.'], { flags: { RES: '1K' }, files: res('1K', '1K', 683), img: land('std', 4, '1K') }),
        O('r2', ['2K — Équilibré', '2K — Balanced'], ['Textures de qualité (2048 px) : des détails nets pour un faible coût en performances. Recommandé pour la plupart des joueurs.', 'High quality textures (2048 px): sharp details with a small performance cost. Recommended for most players.'], { type: 'Recommended', flags: { RES: '2K' }, files: res('2K', '2K', 2731), img: land('std', 4, '2K') }),
        O('r4', ['4K — Ultra', '4K — Ultra'], ['Textures ultra détaillées (4096 px), environ 3,2 Go de mémoire vidéo. Débloque les options de parallaxe à l’étape suivante.', 'Ultra detailed textures (4096 px), about 3.2 GB of video memory. Unlocks the parallax options in the next step.'], { flags: { RES: '4K' }, files: res('4K', '4K', 10923), img: land('std', 4, '4K') })] }] },
      { name: T('Terrain et rochers', 'Terrain & rocks'), groups: [
        { name: T('Style du terrain', 'Terrain style'), type: 'ExactlyOne', options: [
          O('t1', ['Standard', 'Standard'], ['La toundra herbeuse classique, avec de la terre battue et des chemins usés. Le style par défaut de Skyrim.', 'The classic grassy tundra, with packed dirt and worn paths. The default Skyrim look.'], { type: 'Recommended', flags: { TERRAIN: 'STD' }, files: FL('02 Terrain/standard', 'textures/ancient/terrain/style', ['standard_a.dds', 'standard_b.dds'], 1400, 1), img: land('std', 11) }),
          O('t2', ['Enneigé', 'Snowy'], ['Un sol recouvert de neige jusqu’aux portes de Fendeval. Idéal pour un hiver éternel.', 'Snow-covered ground all the way to the gates of Falkreath. Ideal for an eternal winter.'], { flags: { TERRAIN: 'SNOW' }, files: FL('02 Terrain/snow', 'textures/ancient/terrain/style', ['snow_a.dds', 'snow_b.dds'], 1400, 1), img: land('snow', 12) }),
          O('t3', ['Volcanique', 'Volcanic'], ['Cendres sombres et veines de lave incandescentes : pour les terres de Vendeaume et les ambiances de fin du monde.', 'Dark ash and glowing lava veins: for the lands of Solstheim and end-of-the-world moods.'], { flags: { TERRAIN: 'LAVA' }, files: FL('02 Terrain/lava', 'textures/ancient/terrain/style', ['lava_a.dds', 'lava_b.dds'], 1400, 1), img: land('lava', 13) })] },
        { name: T('Rochers et falaises', 'Rocks and cliffs'), type: 'Any', options: [
          O('k1', ['Falaises de basalte', 'Basalt cliffs'], ['Des colonnes de basalte taillées à la verticale sur les falaises du nord.', 'Vertical basalt columns on the cliffs of the north.'], { files: FL('03 Rocks/basalt', 'textures/ancient/rocks', ['basalt01.dds', 'basalt01_n.dds', 'basalt02.dds', 'basalt02_n.dds'], 1500, 1), img: () => ({ kind: 'basalt', px: 320, seed: 3 }) }),
          O('k2', ['Rochers moussus', 'Mossy boulders'], ['Gros blocs recouverts de mousse, parfaits pour les marais et les forêts.', 'Large boulders covered in moss, perfect for swamps and forests.'], { files: FL('03 Rocks/moss', 'textures/ancient/rocks', ['moss01.dds', 'moss01_n.dds', 'moss02.dds'], 1500, 1), img: () => ({ kind: 'moss', px: 320, seed: 5 }) }),
          O('k3', ['Pierres dwemer', 'Dwemer stones'], ['Blocs de bronze gravés de glyphes, pour les ruines dwemer. Fusionne les trois variantes en un seul plugin.', 'Bronze blocks carved with glyphs, for Dwemer ruins. Merges all three variants into one plugin.'], { files: [...FL('03 Rocks/dwemer', 'textures/ancient/rocks', ['dwemer01.dds', 'dwemer01_n.dds'], 1800, 1), ...FL('03 Rocks/dwemer', '.', ['Ancient Realms - Dwemer.esp'], 9, 1)], img: () => ({ kind: 'dwemer', px: 320, seed: 8 }) })] }] },
      { name: T('Parallaxe et détails', 'Parallax & detail'), visible: f => f.RES === '4K', groups: [
        { name: T('Moteur de parallaxe', 'Parallax runtime'), type: 'Any', options: [O('p0', ['Parallax Runtime', 'Parallax Runtime'], ['Requis par les textures de parallaxe. Toujours installé.', 'Required by the parallax textures. Always installed.'], { type: 'Required', files: FL('04 Parallax/runtime', 'SKSE/Plugins', ['ParallaxRuntime.dll'], 240, 2) })] },
        { name: T('Relief', 'Relief'), type: 'AtMostOne', options: [
          O('p1', ['Parallaxe (complexe)', 'Parallax (complex)'], ['Relief réel sur le terrain et la roche. Très gourmand : à réserver aux cartes puissantes.', 'True relief on terrain and rock. Very demanding: keep it for powerful cards.'], { flags: { PARALLAX: 'COMPLEX' }, files: FL('04 Parallax/complex', 'textures/ancient/parallax', ['tamriel_p.dds', 'mountain_p.dds', 'rocks_p.dds'], 5461, 2), img: f => ({ kind: 'relief', px: 640, seed: 2 }) }),
          O('p2', ['Parallaxe (léger)', 'Parallax (light)'], ['Un relief plus discret, avec un bon compromis performances et rendu.', 'A subtler relief, with a good balance between performance and looks.'], { flags: { PARALLAX: 'LIGHT' }, files: FL('04 Parallax/light', 'textures/ancient/parallax', ['tamriel_p.dds', 'mountain_p.dds'], 2731, 2), img: f => ({ kind: 'relief', px: 192, seed: 2 }) })] },
        { name: T('Détails', 'Detail'), type: 'Any', options: [O('p3', ['Cartes de normales de détail', 'Detail normal maps'], ['Ajoute du micro-relief aux roches de montagne. Priorité basse : ne remplace aucun fichier de la résolution choisie.', 'Adds micro-relief to mountain rocks. Low priority: does not replace any file of the chosen resolution.'], { files: FL('04 Detail', 'textures/ancient/terrain', ['mountain_n.dds', 'detail_rock_n.dds'], 2731, 0) })] }] },
      { name: T('Patchs de compatibilité', 'Compatibility patches'), groups: [{ name: T('Mods détectés', 'Detected mods'), type: 'Any', options: [
        O('c1', ['Patch SkyUI', 'SkyUI patch'], ['Ajoute les icônes d’inventaire des textures du mod. Présélectionné quand skyui_se.esp est détecté dans Data.', 'Adds the mod’s inventory icons. Preselected when skyui_se.esp is detected in Data.'], { dep: { plugin: 'skyui_se.esp', present: 'Recommended', absent: 'Optional' }, files: FL('05 Patches', '.', ['AncientRealms_SkyUI.esp'], 12, 3) }),
        O('c2', ['Patch JK’s Skyrim', 'JK’s Skyrim patch'], ['Aligne les textures d’architecture de Blancherive avec JK’s Skyrim. Inutilisable sans jks skyrim.esp.', 'Aligns the Whiterun architecture textures with JK’s Skyrim. Not usable without jks skyrim.esp.'], { dep: { plugin: 'jks skyrim.esp', present: 'Recommended', absent: 'NotUsable' }, files: [...FL('05 Patches/JK', 'textures/ancient/architecture', ['wrbuilding01.dds', 'wrbuilding01_n.dds'], 2731, 3), ...FL('05 Patches/JK', '.', ['AncientRealms_JKs.esp'], 11, 3)] }),
        O('c3', ['Patch ELFX Exteriors', 'ELFX Exteriors patch'], ['Corrige l’éclairage des falaises avec ELFX Exteriors. Inutilisable sans elfx - exteriors.esp.', 'Fixes cliff lighting with ELFX Exteriors. Not usable without elfx - exteriors.esp.'], { dep: { plugin: 'elfx - exteriors.esp', present: 'Recommended', absent: 'NotUsable' }, files: FL('05 Patches/ELFX', '.', ['AncientRealms_ELFX.esp'], 11, 3) })] }] },
      { name: T('Finitions', 'Finishing touches'), groups: [{ name: T('Extras', 'Extras'), type: 'Any', options: [
        O('x1', ['Cartes spéculaires pour ENB', 'ENB-friendly specular maps'], ['Des cartes spéculaires adaptées aux préréglages ENB. En 4K, active aussi une texture de terrain supplémentaire (installation conditionnelle).', 'Specular maps tuned for ENB presets. In 4K it also enables an extra terrain texture (conditional install).'], { flags: { ENB: '1' }, files: FL('06 Extras/ENB', 'textures/ancient/terrain', ['tamriel_s.dds', 'mountain_s.dds'], 2731, 1) }),
        O('x2', ['Lisez-moi et sources', 'Readme and sources'], ['Installe la documentation et les fichiers sources dans le dossier Docs.', 'Installs the documentation and source files in the Docs folder.'], { files: FL('06 Extras/Docs', 'Docs/AncientRealmsHD', ['readme.txt', 'changelog.txt'], 6, 1) })] }] }],
    conditional: [
      { label: T('4K + ENB', '4K + ENB'), when: f => f.RES === '4K' && f.ENB === '1', files: FL('07 Conditional', 'textures/ancient/terrain', ['tamriel_s_4k.dds'], 10923, 1) },
      { label: T('Terrain enneigé', 'Snowy terrain'), when: f => f.TERRAIN === 'SNOW', files: FL('07 Conditional', 'textures/ancient/terrain', ['snow_sparkle.dds'], 683, 1) }]
  };
}
function modFrost() {
  return {
    id: 'fl', name: 'Frostline Lighting SE', author: 'Hollow Pine', version: '1.0.3', website: 'https://example.com/frostline-lighting', file: 'Frostline Lighting SE-1-0-3.7z',
    description: T('Frostline Lighting SE remplace l’éclairage extérieur de Skyrim par des préréglages doux ou rudes, avec des options pour le brouillard et les bougies.', 'Frostline Lighting SE replaces the exterior lighting of Skyrim with soft or harsh presets, with options for fog and candles.'),
    required: FL('00 Core', '.', ['Frostline Lighting.esp'], 10, 0),
    steps: [
      { name: T('Préréglage d’éclairage', 'Lighting preset'), groups: [{ name: T('Ambiance', 'Mood'), type: 'ExactlyOne', options: [
        O('a', ['Aube douce', 'Soft dawn'], ['Une lumière douce et dorée, avec des ombres légères.', 'A soft, golden light with gentle shadows.'], { type: 'Recommended', files: FL('01 Soft', 'SKSE/Plugins/Lighting', ['soft.json'], 4, 1), img: () => ({ kind: 'land', tone: 'std', px: 320, seed: 21 }) }),
        O('b', ['Neutre', 'Neutral'], ['Un éclairage proche de l’original, avec un meilleur contraste.', 'Lighting close to the original, with better contrast.'], { files: FL('01 Neutral', 'SKSE/Plugins/Lighting', ['neutral.json'], 4, 1), img: () => ({ kind: 'land', tone: 'snow', px: 320, seed: 22 }) }),
        O('c', ['Hiver rude', 'Harsh winter'], ['Un éclairage froid et dur, des nuits très sombres.', 'Cold, hard lighting and very dark nights.'], { files: FL('01 Harsh', 'SKSE/Plugins/Lighting', ['harsh.json'], 4, 1), img: () => ({ kind: 'land', tone: 'lava', px: 320, seed: 23 }) })] }] },
      { name: T('Options', 'Options'), groups: [{ name: T('Réglages', 'Tweaks'), type: 'Any', options: [
        O('d', ['Correction du scintillement des bougies', 'Candle flicker fix'], ['Réduit le scintillement des sources de lumière intérieures.', 'Reduces the flicker of interior light sources.'], { files: FL('02 Options', 'SKSE/Plugins/Lighting', ['candles.json'], 3, 1) }),
        O('e', ['Brouillard -20 %', 'Fog -20%'], ['Éclaircit le brouillard : utile avec les préréglages sombres.', 'Thins out the fog: useful with the dark presets.'], { files: FL('02 Options', 'SKSE/Plugins/Lighting', ['fog.json'], 3, 1) })] }] }],
    conditional: []
  };
}
const SIM_PLUGINS = ['skyrim.esm', 'update.esm', 'dawnguard.esm', 'hearthfires.esm', 'dragonborn.esm', 'skyui_se.esp', 'skee64.dll', 'cbpc.dll', 'hdtsmp64.dll', 'jks skyrim.esp', 'elfx - exteriors.esp', 'lanterns of skyrim ii.esm', 'windhelm_braziers.esp'];
const PAL = {
  std: { sky: '#b9cbd8', sun: '#f3ead2', far: '#8aa0b3', mid: '#667d92', cap: '#e7eef5', ground: '#566b3f', ground2: '#4a5d36', tree: '#2f4a35' },
  snow: { sky: '#dbe5ee', sun: '#ffffff', far: '#b4c3d3', mid: '#cdd9e5', cap: '#ffffff', ground: '#f0f4f8', ground2: '#e2e9f0', tree: '#51657a' },
  lava: { sky: '#3b211c', sun: '#ff8a3d', far: '#5a2d24', mid: '#3a2320', cap: '#7a3a28', ground: '#241816', ground2: '#1b110f', tree: '#120c0b', lava: '#ff6a2b' }
};
/* aperçus d'options : scènes à plat dessinées dans un canvas ; la résolution choisie change la netteté (pixels agrandis en 1K) */
function paint(cv, d) {
  const W = d.px || 192, H = Math.round((W * 9) / 16); cv.width = W; cv.height = H; cv.classList.toggle('px', W < 300);
  const g = cv.getContext('2d'), k = W / 640, r = rng(d.seed || 7), R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x * k, y * k, w * k, h * k); };
  const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath(); g.fill(); };
  const ell = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x * k, y * k, rx * k, ry * k, 0, 0, 7); g.fill(); };
  if (d.kind === 'land') {
    const P = PAL[d.tone || 'std'];
    R(0, 0, 640, 360, P.sky); ell(470, 96, 36, 36, P.sun);
    for (const [base, amp, col, step] of [[190, 70, P.far, 46], [236, 52, P.mid, 34]]) {
      const pts = [[0, 360]]; for (let x = 0; x <= 640 + step; x += step) pts.push([x, base - r() * amp]); pts.push([640, 360]); poly(pts, col);
      if (d.tone !== 'lava') pts.slice(1, -1).forEach(([x, y]) => poly([[x - step * 0.28, y + step * 0.3], [x, y], [x + step * 0.28, y + step * 0.3]], P.cap));
    }
    R(0, 276, 640, 84, P.ground); for (let i = 0; i < 14; i++) R(r() * 600, 280 + r() * 70, 40 + r() * 70, 6 + r() * 8, P.ground2);
    if (d.tone === 'lava') { g.strokeStyle = P.lava; g.lineWidth = Math.max(1, 3 * k); for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * 640, y = 288; g.moveTo(x * k, y * k); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 70; y += 10 + r() * 14; g.lineTo(x * k, y * k); } g.stroke(); } }
    else for (let i = 0; i < 18; i++) { const x = r() * 640, y = 262 + r() * 40, hh = 24 + r() * 26; poly([[x - 9, y + hh], [x, y], [x + 9, y + hh]], P.tree); }
  } else if (d.kind === 'basalt') {
    R(0, 0, 640, 360, '#262a2e'); let x = 0; while (x < 640) { const cw = 28 + r() * 26; R(x, 0, cw - 3, 360, r() > 0.5 ? '#33383d' : '#2d3237'); R(x, 0, 3, 360, '#4a525a'); x += cw; }
  } else if (d.kind === 'moss') {
    R(0, 0, 640, 360, '#4b5a3a'); R(0, 190, 640, 170, '#56673f');
    for (let i = 0; i < 6; i++) { const x = 60 + r() * 520, y = 200 + r() * 110, rx = 50 + r() * 50; ell(x, y, rx, rx * 0.62, '#6b6f68'); ell(x, y - rx * 0.22, rx * 0.86, rx * 0.34, '#6f8a45'); }
  } else if (d.kind === 'dwemer') {
    R(0, 0, 640, 360, '#3a3631'); for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) { R(col * 72 - (row % 2) * 36, row * 60, 70, 58, r() > 0.5 ? '#4a443c' : '#433e37'); R(col * 72 - (row % 2) * 36, row * 60 + 56, 70, 3, '#a07a3c'); }
    poly([[320, 90], [372, 180], [320, 270], [268, 180]], '#a07a3c'); poly([[320, 120], [350, 180], [320, 240], [290, 180]], '#3a3631');
  } else if (d.kind === 'relief') {
    R(0, 0, 640, 360, '#2c3036'); for (let i = 0; i < 9; i++) { const y = 360 - i * 40; poly([[0, y], [160 + r() * 80, y - 30 - r() * 20], [330, y - 10], [470, y - 40 - r() * 20], [640, y - 8], [640, 360], [0, 360]], `hsl(210 ${8 + i * 2}% ${18 + i * 5}%)`); }
  } else {
    R(0, 0, 640, 360, '#1f2a36'); R(0, 250, 640, 110, '#243342'); poly([[0, 250], [140, 130], [260, 250]], '#2b3d4f'); poly([[200, 250], [380, 90], [560, 250]], '#314659'); ell(520, 80, 30, 30, '#d9b45a');
  }
}

/* ---------------------------- fenêtre ---------------------------- */
export function open(app) {
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 680, y: 92, minw: 940, minh: 560, bare: true, cls: 'socle', onclose: w => { w.dead = true; }, build: w => build(app, w) });
}

const fmtSize = kb => (kb < 1024 ? kb.toFixed(1).replace('.', T(',', '.')) + ' ' + T('Ko', 'KB') : (kb / 1024).toFixed(2).replace('.', T(',', '.')) + ' ' + T('Mo', 'MB'));

function build(app, w) {
  const alive = () => !w.dead && root.isConnected;
  const pause = ms => (reduced() ? Promise.resolve() : wait(ms));
  const MODS = [modAncient(), modFrost()];
  const st = { mod: null, sel: new Set(), touched: new Set(), cur: 0, installed: new Set(), dataPath: null, stagingPath: null, preview: null, written: new Set(), busy: false };
  let closeModal = null, lastCount = null;

  /* ---------- session d'installation (règles FOMOD de Mod Organizer 2) ---------- */
  const opts = i => st.mod.steps[i].groups.flatMap(g => g.options);
  const typeOf = o => (!o.dep ? o.type : st.installed.has(o.dep.plugin) ? o.dep.present : o.dep.absent);
  const auto = o => !!o.dep && st.installed.has(o.dep.plugin);
  function walk(stopAt = Infinity) {
    const v = [], flags = {};
    st.mod.steps.forEach((s, i) => { if (i >= stopAt) return; if (!s.visible || s.visible({ ...flags })) { v.push(i); opts(i).forEach(o => st.sel.has(o.id) && Object.assign(flags, o.flags)); } });
    return { v, flags };
  }
  const visibleSteps = () => walk().v;
  function applyDefaults(i) {
    opts(i).forEach(o => st.sel.delete(o.id));
    for (const g of st.mod.steps[i].groups) {
      const single = g.type === 'ExactlyOne' || g.type === 'AtMostOne', t = o => typeOf(o);
      if (g.type === 'All') { g.options.forEach(o => st.sel.add(o.id)); continue; }
      g.options.filter(o => t(o) === 'Required').forEach(o => st.sel.add(o.id));
      const rec = g.options.filter(o => t(o) === 'Recommended');
      if (rec.length) (single ? rec.slice(0, 1) : rec).forEach(o => st.sel.add(o.id));
      else if (g.type === 'ExactlyOne' || g.type === 'AtLeastOne') { const f = g.options.find(o => t(o) !== 'NotUsable'); if (f && !g.options.some(o => st.sel.has(o.id))) st.sel.add(f.id); }
    }
  }
  const refreshUntouched = () => st.mod.steps.forEach((s, i) => { if (!st.touched.has(i)) applyDefaults(i); });
  function toggle(o, g, i) {
    const t = typeOf(o);
    if (g.type === 'All' || t === 'Required') return false;
    if (t === 'NotUsable' && !st.sel.has(o.id)) return false;
    const ids = g.options.map(x => x.id), chosen = ids.filter(id => st.sel.has(id));
    if (g.type === 'ExactlyOne') { if (chosen.includes(o.id)) return false; ids.forEach(id => st.sel.delete(id)); st.sel.add(o.id); }
    else if (g.type === 'AtMostOne') { const was = chosen.includes(o.id); ids.forEach(id => st.sel.delete(id)); if (!was) st.sel.add(o.id); }
    else if (g.type === 'AtLeastOne') { if (chosen.includes(o.id)) { if (chosen.length === 1) return false; st.sel.delete(o.id); } else st.sel.add(o.id); }
    else st.sel.has(o.id) ? st.sel.delete(o.id) : st.sel.add(o.id);
    st.touched.add(i); refreshUntouched(); return true;
  }

  /* ---------- staging (priorités, flags, installations conditionnelles) ---------- */
  function buildStaging() {
    const map = new Map(), log = []; let total = 0;
    const place = (f, from) => {
      const key = f.dst.toLowerCase(), ex = map.get(key);
      if (ex && f.prio < ex.prio) { log.push(`  [${T('ignoré', 'ignored')}] ${f.src} -> ${f.dst} (prio ${f.prio} < ${ex.prio})`); return; }
      total += ex ? f.kb - ex.kb : f.kb; log.push(`  [+ ${T('fichier', 'file')}] ${f.src} -> ${f.dst} (prio: ${f.prio})`); map.set(key, { dst: f.dst, kb: f.kb, from, prio: f.prio });
    };
    log.push(`[${T('Fichiers requis', 'Required files')} (requiredInstallFiles)]`); st.mod.required.forEach(f => place(f, T('(requis)', '(required)')));
    const { v, flags } = walk();
    v.flatMap(i => opts(i).filter(o => st.sel.has(o.id))).forEach(o => { log.push(`\n[${o.name}]`); o.files.forEach(f => place(f, o.name)); });
    st.mod.conditional.filter(c => c.when(flags)).forEach((c, i) => { if (!i) log.push(`\n[${T('Installations conditionnelles', 'Conditional installs')} (conditionalFileInstalls)]`); log.push(`  (${c.label})`); c.files.forEach(f => place(f, c.label)); });
    const items = [...map.values()].sort((a, b) => a.dst.toLowerCase().localeCompare(b.dst.toLowerCase()));
    return { items, log, total };
  }
  const flagCount = () => Object.keys(walk().flags).length;

  /* ---------- gabarits ---------- */
  const lights = wm.lights(w);
  const bar = h('div', { class: 'fsim-bar', 'data-drag': '' }, lights, h('b', { html: brand('fOMODSIM', COLOR), style: { fontSize: '15px', letterSpacing: '.025em', color: 'var(--s-ts)', marginLeft: '6px' } }), dlBtn(app));
  const wrap = h('div', { class: 'fsim-wrap' });
  const root = h('div', { class: 'fsim', tabindex: '-1' }, bar, wrap);
  const mono = h('span', { class: 'mono' }), flags = h('span', { class: 'fl' });
  const hdTitle = h('h1', {});
  const closeBtn = h('button', { class: 'sbtn sec sm', onclick: () => closeMod(), title: T('Fermer le mod en cours et revenir à l’écran d’accueil', 'Close current mod and return to welcome screen') }, T('← Fermer le mod', '← Close mod'));
  const hdr = h('div', { class: 'fsim-hd' }, h('span', { class: 'bolt' }, '⚡'), hdTitle, closeBtn, h('span', { class: 'sep' }, '|'), mono, h('span', { class: 'sep' }, '|'), flags);
  const stage = h('div', { style: { display: 'contents' } });
  wrap.append(hdr, stage);

  /* --- fenêtres modales --- */
  function modal(build, cls, width) {
    closeModal && closeModal(false);
    const scrim = h('div', { class: 'fsim-scrim' }), panel = h('div', { class: cls, role: 'dialog', 'aria-modal': 'true', tabindex: '-1', style: width ? { width: `min(${width}px,100%)` } : null });
    scrim.append(panel); root.append(scrim); wrap.inert = true;
    const close = (restore = true) => { if (!scrim.isConnected) return; scrim.remove(); if (closeModal === close) { closeModal = null; wrap.inert = false; restore && root.focus({ preventScroll: true }); } };
    close.sticky = cls === 'fsim-load'; closeModal = close; build(panel, close);
    if (!reduced()) panel.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
    setTimeout(() => (panel.querySelector('[data-def]') || panel).focus({ preventScroll: true }), 30);
    return close;
  }
  function alertBox(title, msg, buttons = [{ label: 'OK', kind: 'acc' }]) {
    modal((p, close) => {
      p.append(h('img', { src: icon('fOMODSIM'), alt: '' }), h('div', { class: 'tx' }, h('b', {}, title), h('p', {}, msg), h('div', { class: 'fsim-acts' }, buttons.map((b, i) => h('button', { class: 'sbtn sm sent ' + (b.kind || ''), 'data-def': i === (buttons.length > 1 ? 1 : 0) ? '' : null, onclick: () => { close(); b.fn && b.fn(); } }, b.label)))));
      p.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); const b = buttons[buttons.length > 1 ? 1 : 0]; close(); b.fn && b.fn(); } };
    }, 'fsim-alert');
  }
  const sheetHead = (title, close, closeLabel = true) => h('div', { class: 'fsim-sh' }, h('h4', {}, title), closeLabel ? h('button', { class: 'sbtn sec sm', onclick: close }, T('Fermer', 'Close')) : null);
  /* sélecteur à liste (faux panneau d'ouverture) */
  const reveal = el => { const l = el.parentElement; if (el.offsetTop < l.scrollTop) l.scrollTop = el.offsetTop; else if (el.offsetTop + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = el.offsetTop + el.offsetHeight - l.clientHeight; };
  function chooser(title, msg, items, onPick, label, onCancel) {
    sfx.click();
    modal((p, close) => {
      let cur = items.find(i => !i.off) || items[0], btns;
      const apply = () => btns.forEach((b, i) => { b.classList.toggle('on', items[i] === cur); b.setAttribute('aria-pressed', items[i] === cur); });
      const pick = it => { if (!it || it.off) return; close(); onPick(it); };
      const cancel = () => { close(); onCancel && onCancel(); };
      btns = items.map(it => h('button', { class: 'fsim-li', disabled: !!it.off, onclick: () => { cur = it; sfx.tick(); apply(); }, ondblclick: () => pick(it) }, h('span', {}, it.label), it.hint ? h('span', { class: 'mu' }, it.hint) : null));
      apply();
      p.append(h('div', {}, h('h4', {}, title), h('p', { class: 'fsim-mu', style: { marginTop: '4px', fontSize: '12px' } }, msg)), h('div', { class: 'fsim-list' }, btns),
        h('div', { class: 'fsim-acts' }, h('button', { class: 'sbtn sm sent sec', onclick: cancel }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn sm sent acc', 'data-def': '', onclick: () => pick(cur) }, label || T('Ouvrir', 'Open'))));
      p.onkeydown = e => {
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const ok = items.filter(i => !i.off), j = clamp(ok.indexOf(cur) + (e.key === 'ArrowDown' ? 1 : -1), 0, ok.length - 1); cur = ok[j]; sfx.tick(); apply(); const nb = btns[items.indexOf(cur)]; nb.focus({ preventScroll: true }); reveal(nb); }
        else if (e.key === 'Enter' && !e.target.closest('.sbtn')) { e.preventDefault(); pick(cur); }
      };
    }, 'fsim-sheet', 560);
  }

  /* ---------- accueil ---------- */
  function showWelcome() {
    st.mod = null; closeBtn.hidden = true; hdr.querySelectorAll('.sep').forEach(e => (e.hidden = true)); mono.hidden = true; flags.textContent = T('Skyrim SE/AE • En attente d’archive', 'Skyrim SE/AE • Waiting for archive');
    hdTitle.innerHTML = brand('fOMODSIM', COLOR); hdTitle.className = '';
    const link = (label, fn) => h('button', { onclick: fn }, label);
    stage.replaceChildren(h('div', { class: 'fsim-welcome' }, h('div', { class: 'fsim-wcard' },
      h('img', { src: icon('fOMODSIM'), alt: '' }), h('h2', { html: brand('fOMODSIM', COLOR) }),
      h('p', { class: 'sub' }, T('Ouvrez ou glissez-déposez une archive de mod Skyrim pour explorer les étapes d’installation, tester les conditions logiques et simuler le staging sans modifier vos fichiers de jeu.', 'Open or drag-and-drop a Skyrim mod archive to explore installation steps, test logical conditions, and simulate staging without altering your game files.')),
      h('div', { class: 'fsim-drop' }, h('span', { class: 'ic' }, '📥'), h('b', {}, T('Glissez-déposez votre archive ici', 'Drag and drop your archive here')),
        h('small', { html: T('Formats pris en charge : <span class="fm">.ZIP</span>, <span class="fm">.7Z</span>, <span class="fm">.RAR</span> ou dossier décompressé', 'Supported formats: <span class="fm">.ZIP</span>, <span class="fm">.7Z</span>, <span class="fm">.RAR</span> or uncompressed folder') }),
        h('button', { class: 'sbtn act', onclick: () => pickArchive() }, '📁  ' + T('Charger une archive (ZIP, 7Z, RAR)', 'Load an archive (ZIP, 7Z, RAR)'))),
      h('div', { class: 'fsim-links' }, link('📂  ' + T('Charger un dossier décompressé', 'Load uncompressed folder'), () => pickArchive(true)), h('i', {}, '•'), link('🧪  ' + T('Charger le mod démo Ancient Realms HD', 'Load demo mod Ancient Realms HD'), () => loadMod(MODS[0], MODS[0].file))),
      h('div', { class: 'fsim-foot' }, h('span', {}, T('Moteur FOMOD 100 % autonome', '100% standalone FOMOD engine')), h('span', {}, T('Aucune installation de Skyrim requise', 'No Skyrim installation required'))))));
    const drop = stage.querySelector('.fsim-drop');
    drop.ondragover = e => { e.preventDefault(); }; drop.ondrop = e => { e.preventDefault(); if (e.dataTransfer.files.length) alertBox(T('Démo', 'Demo'), T('Aucun fichier de votre ordinateur n’est lu dans la démo. Choisissez une archive d’exemple.', 'No file from your computer is read in the demo. Pick a sample archive.'), [{ label: T('Choisir une archive', 'Pick an archive'), kind: 'acc', fn: () => pickArchive() }]); };
  }
  function pickArchive(folder) {
    chooser(folder ? T('Sélectionner le dossier du mod FOMOD décompressé', 'Select the extracted FOMOD mod folder') : T('Sélectionner l’archive du mod FOMOD', 'Select the FOMOD mod archive'), T('Choisissez dans la liste (démo : aucun fichier n’est lu).', 'Pick from the list (demo: no file is read).'),
      [{ label: (folder ? '📂 ' : '📦 ') + (folder ? 'Ancient Realms HD (' + T('décompressé', 'unpacked') + ')' : MODS[0].file), hint: T('mod FOMOD', 'FOMOD mod'), mod: MODS[0] },
        { label: (folder ? '📂 ' : '📦 ') + (folder ? 'Frostline Lighting SE (' + T('décompressé', 'unpacked') + ')' : MODS[1].file), hint: T('mod FOMOD', 'FOMOD mod'), mod: MODS[1] },
        { label: (folder ? '📂 ' : '📦 ') + (folder ? 'Random Textures (' + T('décompressé', 'unpacked') + ')' : 'Random Textures-4821.zip'), hint: T('sans installateur', 'no installer'), bad: true }],
      it => (it.bad ? loadBad(it.label.slice(3)) : loadMod(it.mod, it.label.slice(3))));
  }
  async function loadBad(name) {
    await showLoading(name); if (!alive()) return;
    alertBox(T('ModuleConfig.xml introuvable', 'ModuleConfig.xml not found'), T('L’archive a été ouverte avec succès mais aucun fichier « fomod/ModuleConfig.xml » n’a été détecté.\nAssurez-vous qu’il s’agit bien d’une archive contenant un installateur FOMOD pour Skyrim.', 'The archive was opened successfully but no \'fomod/ModuleConfig.xml\' file was found.\nMake sure it is an archive that contains a FOMOD installer for Skyrim.'));
  }
  async function showLoading(name) {
    modal((p, close) => {
      p.append(h('div', { class: 'fsim-spin' }), h('b', {}, T('Chargement du mod FOMOD', 'Loading FOMOD mod')), h('div', { class: 'st' }, T(`Extraction et analyse de : ${name}...`, `Extracting and analysing: ${name}...`)), h('small', {}, T('Extraction en mémoire et génération de l’installateur à 3 colonnes...', 'In-memory extraction and 3-column installer generation...')));
    }, 'fsim-load'); sfx.tick();
    const mine = closeModal; await pause(1100); if (!alive()) return; mine && mine();
  }
  async function loadMod(mod, name) {
    await showLoading(name || mod.file); if (!alive()) return;
    st.mod = mod; st.sel = new Set(); st.touched = new Set(); st.cur = 0; st.written = new Set(); lastCount = null;
    refreshUntouched(); st.cur = visibleSteps()[0] ?? 0; showSim(); sfx.open();
  }
  function closeMod() { sfx.close(); showWelcome(); }

  /* ---------- simulateur ---------- */
  const dataLine = h('button', { class: 'fsim-data', onclick: () => dataSheet() });
  const destSpan = h('span', {});
  const genBtn = h('button', { class: 'sbtn acc gen', onclick: () => generate() }, T('GÉNÉRER LE STAGING', 'GENERATE STAGING'));
  const stepTitle = h('h3', {}), stepPos = h('span', { class: 'mono' });
  const groupsEl = h('div', { class: 'fsim-groups' });
  const backBtn = h('button', { class: 'sbtn sec', onclick: () => prev() }, T('← RETOUR', '← BACK'));
  const nextBtn = h('button', { class: 'sbtn acc', onclick: () => next() });
  const descEl = h('div', { class: 'fsim-desc' });
  const pv = h('button', { class: 'fsim-pv', 'aria-label': T('Cliquer pour afficher dans sa taille réelle', 'Click to view full size'), title: T('Cliquer pour afficher dans sa taille réelle', 'Click to view full size'), onclick: () => bigPreview() });
  const left = h('div', { class: 'fsim-col fsim-left' },
    h('button', { class: 'sbtn act', onclick: () => openSheet(), title: T('Ouvrir un FOMOD (.zip, dossier, ou démo)', 'Open a FOMOD (.zip, folder, or demo)') }, '📦  ' + T('Ouvrir un FOMOD', 'Open a FOMOD')),
    h('button', { class: 'sbtn sec', onclick: () => infoSheet() }, 'ℹ️  ' + T('Infos du mod', 'Mod info')), h('button', { class: 'sbtn sec', onclick: () => dataSheet() }, '📁  ' + T('Dossier Skyrim Data...', 'Skyrim Data folder...')), dataLine,
    h('div', { class: 'fsim-grow' }), h('button', { class: 'sbtn sec', onclick: () => stagingDir() }, '📁  ' + T('Destination du Staging...', 'Staging destination...')),
    h('div', { class: 'fsim-dest' }, h('small', {}, T('Destination :', 'Destination:')), destSpan), genBtn);
  const center = h('div', { class: 'fsim-col' }, h('div', { class: 'fsim-ch' }, stepTitle, stepPos), groupsEl, h('div', { class: 'fsim-nav' }, backBtn, nextBtn));
  const right = h('div', { class: 'fsim-col fsim-right' }, h('div', { class: 'fsim-eye' }, '📖  ' + T('Instructions et description', 'Instructions & Description')), descEl, pv);
  const cols = h('div', { class: 'fsim-cols' }, left, center, right);

  function showSim() {
    closeBtn.hidden = false; hdr.querySelectorAll('.sep').forEach(e => (e.hidden = false)); mono.hidden = false; hdTitle.textContent = st.mod.name;
    stage.replaceChildren(cols); drawLeft(); stepChanged(); sync();
  }
  const drawLeft = () => {
    const n = st.installed.size;
    dataLine.replaceChildren(st.dataPath ? h('span', {}, h('b', {}, T('Data :', 'Data:') + ' '), h('i', {}, st.dataPath.split('/').pop())) : h('span', {}, h('b', {}, T('Data :', 'Data:') + ' '), h('i', { style: { fontStyle: 'italic' } }, T('(non défini)', '(not set)'))),
      st.dataPath ? h('small', { class: 'ok' }, `(${n} ${T('fichiers détectés', 'files detected')})`) : h('small', {}, T('(Cliquez pour simuler Skyrim)', '(Click to simulate Skyrim)')));
    destSpan.textContent = st.stagingPath || T('Bureau (Desktop)', 'Desktop');
  };
  function sync() {
    const v = visibleSteps(), pos = Math.max(1, v.indexOf(st.cur) + 1), total = v.length, last = st.cur >= v[v.length - 1];
    mono.textContent = T(`Étape ${pos} / ${total}`, `Step ${pos} / ${total}`); stepPos.textContent = `${pos} / ${total}`;
    const fc = flagCount(); flags.textContent = fc ? T(`${fc} flags actifs`, `${fc} active flags`) : 'Skyrim SE/AE'; flags.title = Object.entries(walk().flags).map(([k, x]) => `${k} = ${x}`).join('\n');
    if (lastCount !== null && lastCount !== total && !reduced()) { mono.classList.remove('fsim-flash'); void mono.offsetWidth; mono.classList.add('fsim-flash'); if (total > lastCount) sfx.pop(); }
    lastCount = total; backBtn.disabled = pos <= 1; nextBtn.disabled = total === 0; nextBtn.textContent = last ? T('TERMINER L’INSTALLATION', 'FINISH INSTALLATION') : T('CONTINUER →', 'CONTINUE →');
    groupsEl.querySelectorAll('.fsim-o').forEach(b => {
      const o = b._o, on = st.sel.has(o.id), t = typeOf(o);
      b.classList.toggle('on', on); b.classList.toggle('off', t === 'NotUsable' && !on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.querySelector('.tg') && b.querySelector('.tg').remove();
      const tag = auto(o) ? [T('Auto', 'Auto'), '', T('Dépendance détectée dans votre dossier Data', 'Dependency detected in your Data folder')] : t === 'Required' ? [T('Requis', 'Required'), 'mu', T('Requis', 'Required')] : t === 'NotUsable' && !on ? [T('Inutilisable', 'Not usable'), 'mu', T('Inutilisable', 'Not usable')] : null;
      if (tag) b.append(h('span', { class: 'tg ' + tag[1], title: tag[2] }, tag[0]));
    });
  }
  function renderStep() {
    const s = st.mod.steps[st.cur]; stepTitle.textContent = s ? s.name : T('Aucune étape FOMOD trouvée.', 'No FOMOD steps found.');
    groupsEl.replaceChildren(...(s ? s.groups.map(g => {
      const single = g.type === 'ExactlyOne' || g.type === 'AtMostOne';
      return h('div', { class: 'fsim-g' }, h('div', { class: 'fsim-gh' }, h('b', {}, g.name), h('small', {}, single ? T('Choix unique', 'Single choice') : T('Choix multiple', 'Multiple choice'))),
        g.options.map(o => { const b = h('button', { class: 'fsim-o', role: single ? 'radio' : 'checkbox', onclick: () => pick(o, g), onmouseenter: () => hover(o), onfocus: () => hover(o) }, h('i', { class: 'fsim-ind ' + (single ? 'ci' : 'sq') }), h('span', { class: 'nm' }, o.name)); b._o = o; return b; }));
    }) : []));
    groupsEl.scrollTop = 0;
  }
  function stepChanged() {
    renderStep(); const s = st.mod.steps[st.cur], first = s && (opts(st.cur).find(o => st.sel.has(o.id)) || opts(st.cur)[0]);
    first ? hover(first) : (st.preview = null); sync();
  }
  const fixCurrent = () => { const v = visibleSteps(); if (!v.includes(st.cur)) st.cur = v.filter(i => i < st.cur).pop() ?? v[0]; };
  function pick(o, g) {
    const ok = toggle(o, g, st.cur);
    if (ok) { sfx.tick(); fixCurrent(); sync(); }
    else sfx.close();
    hover(o);
  }
  function hover(o) {
    st.preview = o; descEl.textContent = o.desc || T('(Aucune description disponible pour cette option)', '(No description available for this option)');
    const f = walk().flags, d = o.img ? o.img(f) : { kind: 'banner', px: 320 }; st.pvd = d;
    pv.replaceChildren(); const cv = h('canvas', { 'aria-hidden': 'true' }); pv.append(cv); paint(cv, d);
    pv.disabled = !o.img;
    pv.append(h('div', { class: 'ttl' }, o.img ? o.name : T('Aperçu FOMOD', 'FOMOD Preview'), h('small', {}, o.img ? (d.sub ? T('Aperçu ', 'Preview ') + d.sub : T('Aperçu de l’option', 'Option preview')) : T('Option de configuration du mod', 'Mod configuration option'))), o.img ? h('span', { class: 'zoom' }, '🔍 ' + T('Agrandir', 'Enlarge')) : null);
  }
  function next() {
    const v = visibleSteps(), later = v.find(i => i > st.cur);
    if (later !== undefined) { st.cur = later; sfx.click(); stepChanged(); } else generate();
  }
  function prev() { const v = visibleSteps(), earlier = v.filter(i => i < st.cur).pop(); if (earlier !== undefined) { st.cur = earlier; sfx.click(); stepChanged(); } }

  /* ---------- feuilles ---------- */
  function openSheet() {
    modal((p, close) => {
      const choice = (title, badge, desc, fn) => h('button', { class: 'fsim-choice', onclick: () => { close(); fn(); } }, h('div', { class: 'r' }, h('b', {}, title), h('span', {}, badge)), h('small', {}, desc));
      const demo = m => h('button', { class: 'fsim-choice', style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, onclick: () => { close(); loadMod(m, m.file); } }, h('b', { style: { color: 'var(--s-ts)', fontWeight: 600 } }, m.name), h('span', { style: { color: 'var(--s-acct)', fontSize: '11px' } }, T('Charger →', 'Load →')));
      p.append(sheetHead('📦  ' + T('Ouvrir un FOMOD', 'Open a FOMOD'), close), h('div', { class: 'fsim-eye' }, T('Depuis votre ordinateur', 'From your computer')),
        choice(T('📦 Parcourir une archive (.ZIP, .RAR, .7Z)', '📦 Browse an archive (.ZIP, .RAR, .7Z)'), T('Support complet', 'Full support'), T('Sélectionnez directement votre archive téléchargée (.zip, .rar ou .7z). Extraction et simulation instantanées.', 'Pick your downloaded archive (.zip, .rar or .7z). Instant extraction and simulation.'), () => pickArchive()),
        choice(T('📂 Parcourir un dossier décompressé', '📂 Browse an uncompressed folder'), T('Dossier local', 'Local folder'), T('Si vous avez déjà extrait votre mod dans un répertoire local sur votre disque, sélectionnez directement ce dossier.', 'If you have already extracted your mod to a local folder, pick that folder.'), () => pickArchive(true)),
        h('div', { class: 'fsim-eye', style: { marginTop: '4px' } }, T('MODS DE DÉMONSTRATION RÉALISTES INTÉGRÉS', 'BUILT-IN REALISTIC DEMO MODS')), demo(MODS[0]), demo(MODS[1]));
      p.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    }, 'fsim-sheet', 560);
  }
  function infoSheet() {
    modal((p, close) => {
      const m = st.mod;
      p.append(h('div', { class: 'fsim-sh' }, h('h4', { style: { color: 'var(--x-act)' } }, m.name)),
        h('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } }, h('span', { class: 'fsim-mu' }, h('b', {}, T('Auteur', 'Author') + ' : '), m.author || '—'), h('span', { style: { color: 'var(--s-acct)' } }, h('b', {}, 'Version : '), m.version || '1.0')),
        h('div', { class: 'fsim-mu' }, h('b', {}, T('Site Web', 'Website') + ' : '), h('span', { class: 'fsim-link' }, m.website)),
        h('div', { class: 'fsim-sh', style: { border: 0, padding: 0 } }, h('b', { style: { color: 'var(--s-t)' } }, T('Description', 'Description') + ' :')), h('div', { class: 'fsim-pre', style: { fontFamily: 'inherit', fontSize: '13.5px', lineHeight: 1.6 } }, m.description),
        h('div', { class: 'fsim-acts' }, h('button', { class: 'sbtn sm sent sec', 'data-def': '', onclick: close }, T('Fermer', 'Close'))));
      p.onkeydown = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } };
    }, 'fsim-sheet', 600);
  }
  function dataSheet(init) {
    modal((p, close) => {
      let path = init ? init.path : st.dataPath, plugins = new Set(init ? init.plugins : st.installed);
      const box = h('span', {}), listEl = h('div', { class: 'fsim-pre' }), cnt = h('div', { class: 'fsim-mu', style: { fontWeight: 600 } });
      const draw = () => { box.textContent = path || T('(Aucun dossier sélectionné)', '(No folder selected)'); const arr = [...plugins].sort(); cnt.textContent = T(`Plugins et DLL détectés (${arr.length}) :`, `Detected plugins and DLLs (${arr.length}):`); listEl.textContent = arr.length ? arr.join('\n') : T('(Aucun plugin détecté)', '(No plugin detected)'); };
      const simulate = () => { sfx.pop(); path = 'C:/Program Files/Steam/steamapps/common/Skyrim Special Edition/Data'; plugins = new Set(SIM_PLUGINS); draw(); };
      const browse = () => chooser(T('Sélectionner le dossier Skyrim Data', 'Select the Skyrim Data folder'), T('Choisissez dans la liste (démo : aucun fichier n’est lu).', 'Pick from the list (demo: no file is read).'),
        [{ label: '📁 /Users/Shared/Skyrim Special Edition/Data', hint: T('Skyrim SE + SkyUI', 'Skyrim SE + SkyUI'), pl: ['skyrim.esm', 'update.esm', 'dawnguard.esm', 'skyui_se.esp', 'skee64.dll'] }, { label: '📁 /Users/Shared/Skyrim Clean/Data', hint: T('installation propre', 'clean install'), pl: ['skyrim.esm', 'update.esm'] }],
        it => { sfx.pop(); dataSheet({ path: it.label.slice(3), plugins: it.pl }); }, null, () => dataSheet({ path, plugins }));
      p.append(sheetHead('📂  ' + T('Dossier Data de Skyrim (détection automatique)', 'Skyrim Data folder (automatic detection)'), close),
        h('p', { class: 'fsim-mu' }, T('fOMODSIM peut inspecter votre dossier Skyrim Special Edition/Data pour pré-sélectionner automatiquement les options requises ou compatibles.', 'fOMODSIM can inspect your Skyrim Special Edition/Data folder to pre-select required or compatible options automatically.')),
        h('div', { class: 'fsim-pathbox' }, h('small', {}, T('Répertoire actuellement lié :', 'Currently linked folder:')), box),
        h('div', { class: 'fsim-acts', style: { justifyContent: 'flex-start' } }, h('button', { class: 'sbtn sm sent sec', onclick: browse }, T('📁 Parcourir le disque...', '📁 Browse disk...')), h('button', { class: 'sbtn sm sent sec', onclick: simulate }, T('⚡ Simuler les plugins Skyrim (CBPC, SkyUI, skee64)', '⚡ Simulate Skyrim plugins (CBPC, SkyUI, skee64)'))),
        cnt, listEl, h('div', { class: 'fsim-acts' }, h('button', { class: 'sbtn sm sent acc', 'data-def': '', onclick: () => { close(); applyData(path, plugins); } }, T('Valider et fermer', 'Confirm & Close'))));
      draw(); p.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    }, 'fsim-sheet', 580);
  }
  function applyData(path, plugins) {
    st.dataPath = path; st.installed = new Set(plugins); st.touched = new Set(); refreshUntouched(); drawLeft();
    if (st.mod) { fixCurrent(); stepChanged(); }
    sfx.done();
  }
  function bigPreview() {
    if (!st.preview || !st.preview.img) return; sfx.click();
    const o = st.preview, d = st.pvd;
    modal((p, close) => {
      const cv = h('canvas', { 'aria-label': o.name }); paint(cv, { ...d, px: d.px < 300 ? d.px : 1280 });
      const dim = d.px < 100 ? '1024 × 576' : d.px < 300 ? '2048 × 1152' : '4096 × 2304';
      p.append(sheetHead(T(`Aperçu taille réelle — ${o.name}`, `Actual size preview — ${o.name}`), close, false), h('div', { class: 'fsim-big' }, cv),
        h('div', { class: 'fsim-acts' }, h('span', { class: 'fsim-mu', style: { fontSize: '12px' } }, T(`Dimensions : ${dim} px (taille réelle)`, `Dimensions: ${dim} px (actual size)`)), h('span', { class: 'sp' }), h('button', { class: 'sbtn sm sent sec', 'data-def': '', onclick: close }, T('Fermer', 'Close'))));
      p.querySelector('.fsim-acts').style.justifyContent = 'space-between';
      p.onkeydown = e => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } };
    }, 'fsim-sheet', 900);
  }

  /* ---------- staging ---------- */
  function stagingDir(then) {
    chooser(T('Sélectionner le dossier de destination du Staging', 'Select the staging destination folder'), T('Choisissez dans la liste (démo : aucun fichier n’est écrit).', 'Pick from the list (demo: no file is written).'),
      [{ label: '📁 /Users/Shared/Desktop' }, { label: '📁 /Users/Shared/Downloads' }, { label: '📁 /Users/Shared/Skyrim/MO2/mods' }], it => { st.stagingPath = it.label.slice(3); drawLeft(); sfx.pop(); then && then(); });
  }
  function generate() {
    if (!st.mod || st.busy) return;
    if (!st.stagingPath) { sfx.close(); return alertBox(T('Aucun dossier de staging', 'No staging folder'), T('Aucun dossier de destination n’a été choisi pour le staging.\n\nSélectionnez le dossier où écrire les fichiers qui seraient installés.', 'No destination folder has been chosen for the staging.\n\nSelect the folder where the files that would be installed should be written.'),
      [{ label: T('Annuler', 'Cancel'), kind: 'sec' }, { label: T('Choisir un dossier…', 'Choose a folder…'), kind: 'acc', fn: () => stagingDir(generate) }]); }
    const target = `${st.stagingPath}/${st.mod.name}`;
    if (st.written.has(target)) return alertBox(T(`Le dossier « ${st.mod.name} » existe déjà`, `The folder “${st.mod.name}” already exists`), T('Son contenu sera remplacé par le nouveau staging (les fichiers d’un staging précédent seront supprimés).', 'Its content will be replaced by the new staging (files from a previous staging will be deleted).'),
      [{ label: T('Annuler', 'Cancel'), kind: 'sec' }, { label: T('Remplacer', 'Replace'), kind: 'acc', fn: () => write(target) }]);
    write(target);
  }
  async function write(target) {
    st.busy = true; genBtn.disabled = true; const res = buildStaging();
    modal((p) => { p.append(h('div', { class: 'fsim-spin' }), h('b', {}, T('Chargement du mod FOMOD', 'Loading FOMOD mod')), h('div', { class: 'st' }, T('Écriture du staging (lecture des fichiers dans l’archive)…', 'Writing the staging (reading files from the archive)…'))); }, 'fsim-load');
    const mine = closeModal; await pause(900); st.busy = false; if (!alive()) return; genBtn.disabled = false; st.written.add(target); mine && mine(false);
    sfx.done(); resultSheet(res, target);
  }
  function resultSheet(res, target) {
    modal((p, close) => {
      let tab = 0; const body = h('div', { style: { display: 'contents' } });
      const rows = [], seen = new Set();
      res.items.forEach(it => { const parts = it.dst.split('/'); let cur = ''; for (let i = 0; i < parts.length - 1; i++) { cur = cur ? `${cur}/${parts[i]}` : parts[i]; if (!seen.has(cur)) { seen.add(cur); rows.push({ d: i, n: parts[i], s: T('Dossier', 'Folder'), f: '', fold: true }); } } rows.push({ d: parts.length - 1, n: parts[parts.length - 1], s: fmtSize(it.kb), f: it.from }); });
      const seg = h('div', { class: 'fsim-seg', role: 'tablist' }, [T('Fichiers installés', 'Installed files'), T('Journal de staging', 'Staging log')].map((l, i) => h('button', { role: 'tab', class: i === 0 ? 'on' : '', onclick: () => { tab = i; seg.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); sfx.tick(); draw(); } }, l)));
      const draw = () => {
        if (tab === 0) body.replaceChildren(h('div', { class: 'fsim-tree' }, h('div', { class: 'fsim-tr hd' }, h('span', {}, T('Destination dans Data', 'Destination in Data')), h('span', {}, T('Taille', 'Size')), h('span', {}, T('Source (option)', 'Source option'))),
          h('div', { class: 'fsim-tbody' }, rows.map(r => h('div', { class: 'fsim-tr' + (r.fold ? ' fold' : '') }, h('span', { style: { paddingLeft: r.d * 16 + 'px' }, title: r.n }, r.n), h('span', {}, r.s), h('span', { title: r.f }, r.f))))));
        else body.replaceChildren(h('pre', { class: 'fsim-pre', tabindex: '0' }, res.log.join('\n')));
      };
      draw();
      p.append(h('div', { class: 'fsim-sh' }, h('h4', { style: { color: 'var(--s-ok)' } }, '✓  ' + T('Staging généré avec succès !', 'Staging generated!'))),
        h('div', { class: 'fsim-mu' }, T(`${res.items.length} fichiers préparés • Taille totale : `, `${res.items.length} files prepared • Total size: `), h('b', {}, fmtSize(res.total)), T(' • Destination : ', ' • Destination: '), h('span', { style: { color: 'var(--s-acct)' } }, target)),
        seg, body, h('div', { class: 'fsim-acts' }, h('button', { class: 'sbtn sm sent sec', onclick: () => { sfx.pop(); toast({ icon: icon('fOMODSIM'), title: 'fOMODSIM', body: T('Démo : aucun fichier ZIP n’est écrit.', 'Demo: no ZIP file is written.') }); } }, T('📦 Exporter en archive ZIP', '📦 Export as a ZIP archive')), h('span', { class: 'sp' }), h('button', { class: 'sbtn sm sent sec', 'data-def': '', onclick: close }, T('Fermer', 'Close'))));
      p.querySelector('.fsim-acts').style.justifyContent = 'space-between';
      p.style.height = '100%'; p.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    }, 'fsim-sheet', 860);
  }

  /* ---------- clavier ---------- */
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape' && closeModal) { e.preventDefault(); !closeModal.sticky && closeModal(); return; }
    if (closeModal || !st.mod || e.metaKey || e.ctrlKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && !nextBtn.disabled) { e.preventDefault(); next(); } else if (e.key === 'ArrowLeft' && !backBtn.disabled) { e.preventDefault(); prev(); }
  });
  showWelcome();
  setTimeout(() => root.isConnected && root.focus({ preventScroll: true }), 60);
  return root;
}
