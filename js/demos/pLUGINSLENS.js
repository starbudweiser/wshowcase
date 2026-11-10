/* Réplique interactive de pLUGINSLENS (interface Socle) : arbre des plugins, recherche, fiche d'enregistrement (FormID, drapeaux, sous-enregistrements en texte ou en hexadécimal),
   éditeurs de FormList, de mots-clés et de globales, outils (où est-il utilisé, doublons, comparaison, statistiques), annuler / rétablir et enregistrement d'une copie.
   Les plugins sont générés en mémoire (fictifs) : aucun fichier n'est lu, rien n'est écrit. */
import { h, brand, clamp, T, wm, sfx, icon, toast, css, num } from './kit.js';

/* ---------------- octets ---------------- */
const hx = (v, w = 8) => (v >>> 0).toString(16).toUpperCase().padStart(w, '0');
const bz = n => new Uint8Array(n);
const bstr = s => Uint8Array.from([...new TextEncoder().encode(s), 0]);
const bu32 = v => Uint8Array.of(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255);
const bf32 = v => new Uint8Array(new Float32Array([v]).buffer);
const rd32 = d => ((d[0] | (d[1] << 8) | (d[2] << 16) | (d[3] << 24)) >>> 0);
const rdf32 = d => new Float32Array(d.slice(0, 4).buffer)[0];
const hexBytes = d => [...d].map(b => hx(b, 2)).join(' ');
const isText = d => d.length > 1 && d[d.length - 1] === 0 && [...d.slice(0, -1)].every(b => (b >= 32 && b < 127) || b === 9 || b === 10 || b === 13);
const textOf = d => new TextDecoder().decode(d.length && d[d.length - 1] === 0 ? d.slice(0, -1) : d);
const parseHex = s => { const t = s.replace(/[\s,]/g, ''); return /^([0-9a-f]{2})*$/i.test(t) ? Uint8Array.from(t.match(/../g) || [], x => parseInt(x, 16)) : null; };
const hash = s => { let x = 2166136261; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };
const rngf = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R4 = (rnd, n) => Uint8Array.from({ length: n }, () => (rnd() * 256) | 0);
const nice = e => e.replace(/_AOS$|^NRO_|^AOS_|_AOS/g, '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/_/g, ' ');
const u32Hint = d => (d.length === 4 ? `u32 ${rd32(d)} · i32 ${rd32(d) | 0} · f32 ${+rdf32(d).toPrecision(7)} · form ${hx(rd32(d))}` : '');
const RFLAGS = [[0x20, 'Supprimé', 'Deleted'], [0x400, 'Persistant (surtout REFR)', 'Persistent (mostly REFR)'], [0x800, 'Désactivé au départ', 'Initially disabled'], [0x1000, 'Ignoré', 'Ignored'], [0x40000, 'Compressé', 'Compressed']];
const TES4FLAGS = [[0x1, 'Fichier maître', 'Master file'], [0x80, 'Chaînes localisées', 'Localized strings'], [0x200, 'Maître léger (ESL)', 'Light master (ESL)']];

/* ---------------- plugins d'exemple ---------------- */
const many = (pre, kinds, suf) => pre.flatMap(p => kinds.map(k => `${p}${k}01${suf}`));
const AOS_SPEC = [
  ['GMST', ['!fAudioMasterVolume', '!fAudioMusicVolume', '!fAudioDialogueVolume', '!fAudioFootstepVolume', '!fAudioEffectsVolume']],
  ['KYWD', ['AOS_DragonBreath', 'AOS_RoarShout', 'AOS_FootstepHeavy', 'WAF_TreeSnow', 'SPIKEArmor_AOS', 'AOS_ImpactMetal']],
  ['RACE', ['!DragonRace', '!NordRace', '!OrcRace', '!ArgonianRace']],
  ['ASPC', ['ExtDragonLair_AOS', 'IntNordHall_AOS', 'IntCave_AOS', 'ExtForest_AOS', 'ExtMountainPeak_AOS']],
  ['MGEF', ['MagFlameCloak_AOS', 'MagFrostCloak_AOS', 'MagDragonFlameImpact_AOS', 'MagLightningBolt_AOS', 'MagWabbajackImpact_AOS']],
  ['STAT', ['AOSMarkerSound01', 'AOSMarkerSound02', 'AOSMarkerAmbient']],
  ['PROJ', [['DA15WabbajackProjectile_AOS', { id: 0x847 }], ['DLC2FireStormProjectile01_AOS', { id: 0x848 }], ['DragonIceSpikeVolleyProjectile_AOS', { id: 0x84A }], ['FireBallProjectile01_AOS', { id: 0x84B }], ['FireboltDragonProjectile01_AOS', { id: 0x84C }], ['FireboltExpertProjectile01_AOS', { id: 0x84D }],
    ['FireboltProjectile01_AOS', { id: 0x84E }], ['FireboltStormProjectileAlduinDeath_AOS', { id: 0x84F }], ['FireboltStormProjectileSlow01_AOS', { id: 0x850 }], ['FlamesProjectile_AOS', { id: 0x851 }], ['FrostIcicleProjectile01_AOS', { id: 0x852 }], ['FrostIcicleProjectile02_AOS', { id: 0x853 }]]],
  ['HAZD', ['FireTrapHazard_AOS', 'FrostCloudHazard_AOS', 'PoisonGasHazard_AOS']],
  ['EXPL', ['DragonFireExplosion_AOS', 'FireballExplosion_AOS', 'IceSpikeExplosion_AOS', 'LightningExplosion_AOS']],
  ['IPCT', ['FXDragonBreathImpact_AOS', 'FXDragonRoarImpact_AOS', 'FXFireImpact_AOS', 'FXFrostImpact_AOS', 'FXStoneImpact_AOS', 'FXMetalImpact_AOS']],
  ['ARMA', ['DragonplateArmorAA_AOS', 'DLC1KeeperArmorAA_AOS', 'NordicCarvedArmorAA_AOS']],
  ['SNDR', many(['NPCDragon', 'VOCShout', 'MAGFlame', 'MAGFrost', 'NPCHorse', 'FSTWood', 'FSTStone'], ['Roar', 'Flap', 'Foot', 'Hurt', 'Idle', 'Death'], '_AOS')],
  ['FLST', [['AOS_DragonSoundList', { fl: ['NPCDragonRoar01_AOS', 'NPCDragonFlap01_AOS', 'NPCDragonFlap01_AOS', 'NPCDragonHurt01_AOS', 0x05000F00, 0x00013ABC] }], ['AOS_ImpactFxList', { fl: ['FXDragonBreathImpact_AOS', 'FXFireImpact_AOS', 'FXFrostImpact_AOS'] }]]],
  ['GLOB', [['AOS_MasterVolume', { gt: 'f', val: 0.8 }], ['AOS_EnableDragonRoarEcho', { gt: 's', val: 1 }], ['AOS_DragonEchoDelay', { gt: 'f', val: 0.35 }]]]
];
const NRO_SPEC = [
  ['STAT', many(['NRO_Brazier', 'NRO_Pillar', 'NRO_Wall', 'NRO_Arch', 'NRO_Stairs', 'NRO_Rubble'], ['A', 'B', 'C', 'D', 'E'], '')],
  ['AMMO', ['NRO_AncientArrow', 'NRO_NordicBolt', 'NRO_RuinsDart']],
  ['KYWD', ['NRO_RuinsWeapon', 'WAF_TreeSnow', 'NRO_AncientRelic']],
  ['WEAP', [['NRO_AncientNordicSword', { kw: [0x0001E711, 'NRO_RuinsWeapon', 'NRO_AncientRelic'] }], ['NRO_AncientNordicBattleaxe', { kw: [0x0006D932, 'NRO_RuinsWeapon'] }], ['NRO_AncientNordicBow', { kw: ['NRO_RuinsWeapon'] }], ['NRO_RuinsDagger', { kw: [0x0001E713, 0x0001E71A] }]]],
  ['FLST', [['NRO_RuinsWeaponList', { fl: ['NRO_AncientNordicSword', 'NRO_AncientNordicBattleaxe', 'NRO_AncientNordicBow', 0x0002F000] }]]],
  ['GLOB', [['NRO_RuinsDifficulty', { gt: 'l', val: 2 }], ['NRO_SpawnChance', { gt: 'f', val: 0.25 }]]]
];
const MODS = ['Skyrim.esm', 'Update.esm', 'Dawnguard.esm', 'HearthFires.esm', 'Dragonborn.esm'];

function subsFor(t, e, rnd, o) {
  const path = (d, x = e) => bstr(`${d}\\${x.replace(/_AOS$/, '')}.nif`), ref = () => bu32(((rnd() * 3) | 0) << 24 | (0x800 + ((rnd() * 0x2f00) | 0)));
  const z12 = bz(12);
  switch (t) {
    case 'GMST': return [['DATA', bf32(+(rnd() * 2).toFixed(2))]];
    case 'KYWD': return [['CNAM', bu32((rnd() * 0xFFFFFF) | 0)]];
    case 'RACE': return [['FULL', bstr(nice(e))], ['DESC', bstr('Race description.')], ['DATA', R4(rnd, 128)]];
    case 'ASPC': return [['OBND', z12], ['SNAM', ref()], ['RDAT', ref()], ['BNAM', bu32(0)]];
    case 'MGEF': return [['FULL', bstr(nice(e))], ['MDOB', ref()], ['DNAM', bstr('<mag> points of damage.')], ['DATA', R4(rnd, 152)]];
    case 'STAT': return [['OBND', z12], ['MODL', path('Markers')], ['MODT', R4(rnd, 24)], ['DNAM', R4(rnd, 8)]];
    case 'PROJ': return [['OBND', z12], ['MODL', path('Magic')], ['MODT', R4(rnd, 84)], ['DATA', R4(rnd, 92)]];
    case 'HAZD': return [['OBND', z12], ['MODL', path('Effects')], ['DATA', R4(rnd, 32)]];
    case 'EXPL': return [['OBND', z12], ['MODL', path('Effects')], ['DATA', R4(rnd, 52)]];
    case 'IPCT': return [['MODL', path('Effects\\Impacts')], ['DATA', R4(rnd, 24)], ['DODT', R4(rnd, 36)]];
    case 'ARMA': return [['BOD2', R4(rnd, 8)], ['RNAM', ref()], ['DNAM', R4(rnd, 12)], ['MOD2', path('Armor\\Dragonplate')]];
    case 'SNDR': return [['CNAM', bu32(0x53444E52)], ['GNAM', ref()], ['SNAM', ref()], ['BNAM', R4(rnd, 6)]];
    case 'AMMO': return [['OBND', z12], ['FULL', bstr(nice(e))], ['MODL', path('Weapons\\Ammo')], ['DATA', R4(rnd, 20)]];
    case 'WEAP': return [['OBND', z12], ['FULL', bstr(nice(e))], ['MODL', path('Weapons\\Nordic')], ['DATA', R4(rnd, 10)], ['DNAM', R4(rnd, 100)]];
    case 'GLOB': return [['FNAM', Uint8Array.of(o.gt.charCodeAt(0))], ['FLTV', bf32(o.val)]];
    default: return [];
  }
}
function makePlugin(name, masters, author, desc, spec, { lite = false } = {}) {
  const P = { name, masters, locked: false, dirty: false, undo: [], redo: [], log: [], groups: [], collapsed: false, exp: new Set() };
  const local = masters.length, used = new Set(), sub = (t, d) => ({ t, d, m: null });
  spec.forEach(([, items]) => items.forEach(it => { if (Array.isArray(it) && it[1].id) used.add((local << 24) | it[1].id); }));
  let next = (local << 24) | 0x800; const alloc = () => { while (used.has(next)) next++; used.add(next); return next++; };
  P.header = { p: P, t: 'TES4', id: 0, flags: 0, subs: [sub('HEDR', Uint8Array.from([0x9A, 0x99, 0xD9, 0x3F, 0xD2, 0x09, 0, 0, 0x75, 0xFB, 0, 0])), sub('CNAM', bstr(author)), sub('SNAM', bstr(desc)), ...masters.flatMap(m => [sub('MAST', bstr(m)), sub('DATA', bz(8))])] };
  const fix = [];
  spec.forEach(([t, items]) => {
    const g = { t, recs: [] }; let k = 0;
    items.forEach((it, i) => {
      let [e, o] = Array.isArray(it) ? it : [it, {}]; const ovr = e[0] === '!'; if (ovr) e = e.slice(1);
      if (lite && !o.id && t !== 'FLST' && t !== 'GLOB' && i % 7 === 3) return;
      const rnd = rngf(hash(e + t)), id = ovr ? ((rnd() * (local || 1)) | 0) << 24 | (0x1000 + ((rnd() * 0x2f000) | 0)) : o.id ? (local << 24) | o.id : alloc();
      const subs = [sub('EDID', bstr(e)), ...subsFor(t, e, rnd, o).map(([a, b]) => sub(a, b))];
      if (lite && t !== 'FLST' && i % 11 === 5) { const m = subs.find(s => s.t === 'MODL' || s.t === 'MOD2'); if (m) m.d = bstr(textOf(m.d).replace('.nif', '_lite.nif')); }
      const r = { p: P, t, id, flags: ovr ? 0 : 0, subs }; g.recs.push(r); if (o.fl || o.kw) fix.push([r, o]); k++;
    });
    if (lite && t === 'SNDR') ['NPCDragonRoar02_AOS', 'NPCDragonRoar03_AOS', 'VOCShoutFus01_AOS'].forEach(e => { const rnd = rngf(hash(e)); g.recs.push({ p: P, t, id: alloc(), flags: 0, subs: [sub('EDID', bstr(e)), ...subsFor(t, e, rnd, {}).map(([a, b]) => sub(a, b))] }); });
    P.groups.push(g);
  });
  const all = [...P.groups.flatMap(g => g.recs)], find = e => all.find(r => textOf(r.subs[0].d) === e);
  fix.forEach(([r, o]) => {
    const ids = (o.fl || o.kw).map(x => (typeof x === 'number' ? x : (find(x) || { id: 0x05000F01 }).id));
    if (o.fl) r.subs.push(...ids.map(v => sub('LNAM', bu32(v))));
    else r.subs.splice(4, 0, sub('KSIZ', bu32(ids.length)), sub('KWDA', Uint8Array.from(ids.flatMap(v => [...bu32(v)]))));
  });
  all.filter(r => r.t === 'ASPC').forEach(r => { const s = all.filter(x => x.t === 'SNDR'); if (s.length) r.subs.find(x => x.t === 'SNAM').d = bu32(s[(hash(textOf(r.subs[0].d)) % s.length)].id); });
  all.filter(r => r.t === 'MGEF').forEach(r => { const s = all.filter(x => x.t === 'EXPL'); if (s.length) r.subs.find(x => x.t === 'MDOB').d = bu32(s[(hash(textOf(r.subs[0].d)) % s.length)].id); });
  return P;
}
const SAMPLES = () => [
  { n: 'Nordic Ruins Overhaul.esp', mk: () => makePlugin('Nordic Ruins Overhaul.esp', MODS.slice(0, 3), 'Eliana Brandt', 'Rebuilds the Nordic ruins with new statics and weapons.', NRO_SPEC), info: T('3 maîtres', '3 masters') },
  { n: 'Audio Overhaul Skyrim.esp', mk: () => makePlugin('Audio Overhaul Skyrim.esp', MODS, 'David Jegutidse', 'Audio Overhaul for Skyrim Special Edition\r\n{{BASH:Sound}}', AOS_SPEC), info: T('5 maîtres', '5 masters') },
  { n: 'Audio Overhaul Skyrim - Lite.esp', mk: () => makePlugin('Audio Overhaul Skyrim - Lite.esp', MODS, 'David Jegutidse', 'Lighter version of Audio Overhaul.', AOS_SPEC, { lite: true }), info: T('5 maîtres', '5 masters') }
];

/** Feuille modale plate au-dessus de la fenêtre (Échap ferme, Tab reste dans la feuille). */
function sheet(root, { title, body, foot, width = 440, label, cls = '' }) {
  const prev = document.activeElement;
  const card = h('div', { class: 'x-sheet ' + cls, role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || 'pLUGINSLENS', style: { width: width + 'px' } }, title ? h('div', { class: 'x-st' }, title) : null, body, foot ? h('div', { class: 'x-sf' }, foot) : null);
  const back = h('div', { class: 'x-back' }, card);
  const close = () => { back.remove(); const f = prev && prev.isConnected && prev !== document.body ? prev : root; f.focus({ preventScroll: true }); };
  back.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('button:not(:disabled),input,select,textarea')]; if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus({ preventScroll: true }); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus({ preventScroll: true }); e.preventDefault(); }
    }
  });
  root.append(back);
  (card.querySelector('[data-first]') || card.querySelector('.acc:not(:disabled)') || card.querySelector('input,textarea,select') || card.querySelector('button')).focus({ preventScroll: true });
  return { close, card };
}

/** Raccourcis clavier valables tant que cette fenêtre est la fenêtre active (même si le focus est tombé sur la page) ; l'écouteur se retire tout seul à la fermeture. */
function hotkeys(w, root, fn) {
  const on = e => { if (!root.isConnected) { removeEventListener('keydown', on); return; } if (w.el.classList.contains('active') && !root.querySelector(':scope > .x-back')) fn(e); };
  addEventListener('keydown', on); return () => removeEventListener('keydown', on);
}

export function open(app) {
  css('css/demos/pLUGINSLENS.css');
  return wm.open({ id: 'app:' + app.id, appId: app.id, title: app.id, w: 1100, h: 700, minw: 880, minh: 540, bare: true, cls: 'socle', onclose: w => { w.dead = true; w.cleanup && w.cleanup(); },
    build: w => {
      const plugins = []; let cur = null, active = null, q = '', sortMode = 'file', filt = [], recent = [], pins = [], dragRecs = [], flashText = '', flashT = 0, menuEl = null;
      const root = h('div', { class: 'pluginslens', tabindex: '-1' });
      const treeEl = h('div', { class: 'p-tree', tabindex: '0', role: 'tree', 'aria-label': T('Plugins', 'Plugins') }), detEl = h('div', { class: 'p-det', tabindex: '-1' }), foot = h('div', { class: 'p-foot' });
      const openBtn = h('button', { class: 'sbtn act', onclick: () => openDialog() }, T('Ouvrir des plugins', 'Open plugins'));
      const qIn = h('input', { class: 'p-in p-q', type: 'search', placeholder: T('Rechercher un EditorID, un FormID ou un type', 'Search for an EditorID, a FormID or a type'), 'aria-label': T('Rechercher', 'Search'), autocomplete: 'off', spellcheck: 'false', oninput: e => { q = e.target.value; renderTree(); } });
      const sortSel = h('select', { class: 'p-in', 'aria-label': T('Tri', 'Sort'), onchange: e => { sortMode = e.target.value; renderTree(); } }, [['file', T('Ordre du fichier', 'File order')], ['edid', T('Tri : EditorID', 'Sort: EditorID')], ['formid', T('Tri : FormID', 'Sort: FormID')]].map(([v, l]) => h('option', { value: v }, l)));
      const gIn = h('input', { class: 'p-in p-g', type: 'text', placeholder: T('Groupes : WEAP, ARMO…', 'Groups: WEAP, ARMO…'), 'aria-label': T('Groupes', 'Groups'), autocomplete: 'off', spellcheck: 'false', oninput: e => { filt = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean); renderTree(); } });
      const menuBtn = h('button', { class: 'sbtn', 'aria-haspopup': 'menu', onclick: () => toggleMenu() }, T('Menu', 'Menu') + ' ▾');
      const hd = h('div', { class: 'p-hd' }, h('b', { html: brand(app.id, app.accent) }), openBtn, qIn, sortSel, gIn, menuBtn);
      const div = h('div', { class: 'p-div', role: 'separator', 'aria-orientation': 'vertical', 'aria-label': T('Largeur de l’arbre', 'Tree width') });
      root.append(h('div', { class: 'p-tb', 'data-drag': '' }, wm.lights(w), h('div', { class: 'p-tt', html: brand(app.id, app.accent) + ' · ' + T('éditeur ESP/ESM', 'ESP/ESM editor') })), hd, h('div', { class: 'p-main' }, treeEl, div, detEl), foot);
      div.addEventListener('pointerdown', e => { div.setPointerCapture(e.pointerId); div.classList.add('drag'); const x0 = e.clientX, w0 = treeEl.offsetWidth, s = treeEl.offsetWidth / (treeEl.getBoundingClientRect().width || 1); const mv = ev => { treeEl.style.setProperty('--tw', clamp(w0 + (ev.clientX - x0) * s, 200, root.offsetWidth * .6) + 'px'); }; const up = () => { div.classList.remove('drag'); div.removeEventListener('pointermove', mv); div.removeEventListener('pointerup', up); }; div.addEventListener('pointermove', mv); div.addEventListener('pointerup', up); });

      /* ---------------- modèle ---------------- */
      const all = P => [P.header, ...P.groups.flatMap(g => g.recs)];
      const edid = r => { const s = r.subs.find(x => x.t === 'EDID'); return s ? textOf(s.d) : ''; };
      const label = r => `${r.t} ${edid(r) || hx(r.id)}`;
      const owner = (id, P) => ((id >>> 24) < P.masters.length ? P.masters[id >>> 24] : P.name + ' ' + T('(ce fichier)', '(this file)'));
      const ownerName = (id, P) => ((id >>> 24) < P.masters.length ? P.masters[id >>> 24] : P.name);
      const findRec = (P, id) => all(P).find(x => x.id === id && x !== P.header) || null;
      const resolve = (P, v) => { if ((v >>> 24) >= P.masters.length) return findRec(P, v); const mp = plugins.find(x => x.name === P.masters[v >>> 24]); return mp ? all(mp).find(x => x !== mp.header && (x.id & 0xFFFFFF) === (v & 0xFFFFFF) && (x.id >>> 24) >= mp.masters.length) || null : null; };
      const xref = (src, P) => { if (src.p === P) return src.id; const own = ownerName(src.id, src.p), mi = P.masters.indexOf(own); return mi >= 0 ? ((mi << 24) | (src.id & 0xFFFFFF)) >>> 0 : null; };
      const nextId = P => Math.max(...all(P).filter(x => x !== P.header && (x.id >>> 24) === P.masters.length).map(x => x.id)) + 1;
      const hhmmss = () => new Date().toTimeString().slice(0, 8);
      const sortRecs = rs => (sortMode === 'edid' ? [...rs].sort((a, b) => edid(a).localeCompare(edid(b))) : sortMode === 'formid' ? [...rs].sort((a, b) => a.id - b.id) : rs);
      const recDead = r => r.dead || !plugins.includes(r.p);

      function flash(msg) { flashText = msg; drawFoot(); clearTimeout(flashT); flashT = setTimeout(() => { flashText = ''; if (!w.dead) drawFoot(); }, 2800); }
      function drawFoot() {
        let t = flashText, cls = '';
        if (!t) {
          const n = plugins.length;
          if (!n) t = T('Aucun fichier chargé', 'No file loaded');
          else if (active) t = T(`${active.name} · ${num(all(active).length - 1)} enregistrements · ${active.masters.length} maîtres`, `${active.name} · ${num(all(active).length - 1)} records · ${active.masters.length} masters`) + (active.dirty ? T(' · modifié', ' · modified') : '') + (n > 1 ? T(` · ${n} plugins ouverts`, ` · ${n} plugins open`) : '');
          else t = T(`${n} plugins ouverts`, `${n} plugins open`);
          if (plugins.some(p => p.dirty)) cls = 'wn';
        }
        foot.textContent = t; foot.className = 'p-foot ' + cls; foot.title = t;
      }
      /* historique : chaque modification enregistre de quoi l'annuler et la rétablir ; les frappes successives sur un même champ sont fusionnées */
      function op(P, key, lbl, undo, redo, rec) {
        const now = Date.now(), top = P.undo[P.undo.length - 1];
        if (key && top && top.key === key && now - top.t < 1500) { top.redo = redo; top.t = now; }
        else { P.undo.push({ key, t: now, label: lbl, undo, redo, rec: rec || cur }); if (P.undo.length > 200) P.undo.shift(); P.log.push(`${hhmmss()}  ${lbl}`); }
        P.redo.length = 0; P.dirty = true; drawFoot(); const ph = treeEl.querySelector(`.t-ph[data-p="${P.name}"]`); if (ph) ph.classList.add('dirty');
      }
      function locked(P) { if (P.locked) { flash(T(`${P.name} est verrouillé : déverrouillez-le pour le modifier.`, `${P.name} is locked: unlock it to edit it.`)); sfx.tick(); return true; } return false; }
      function undoRedo(redo) {
        const P = active || plugins[0]; if (!P) return; const st = redo ? P.redo : P.undo, o = st.pop(); if (!o) return flash(T('Rien à ' + (redo ? 'rétablir' : 'annuler'), 'Nothing to ' + (redo ? 'redo' : 'undo')));
        (redo ? o.redo : o.undo)(); (redo ? P.undo : P.redo).push(o); P.log.push(`${hhmmss()}  ${redo ? T('Rétabli', 'Redone') : T('Annulé', 'Undone')} : ${o.label}`); sfx.click(); renderTree();
        const tg = o.rec || cur; if (tg && !recDead(tg)) showRecord(tg, !!o.rec); else { cur = null; showMessage(T('Enregistrement supprimé.', 'Record deleted.')); }
        flash((redo ? T('Rétabli : ', 'Redone: ') : T('Annulé : ', 'Undone: ')) + o.label);
      }

      /* ---------------- arbre ---------------- */
      const typeTag = r => h('span', { class: 't-ty' }, r.t);
      function recRow(r, cls, showPl) {
        const row = h('div', { class: 't-row ' + cls + (r === cur ? ' on' : ''), role: 'treeitem', draggable: r !== r.p.header ? 'true' : null, title: `${label(r)} · ${hx(r.id)}` }, typeTag(r), h('span', { class: 't-ed' }, edid(r)), showPl ? h('span', { class: 't-pl' }, r.p.name) : null, h('span', { class: 't-id' }, hx(r.id)));
        row._rec = r; return row;
      }
      function renderTree() {
        [qIn, sortSel, gIn].forEach(x => { x.disabled = !plugins.length; });
        const sel0 = !q.trim() && cur && [...treeEl.querySelectorAll('.t-row:not(.top)')].find(x => x._rec === cur), off0 = sel0 ? sel0.offsetTop - treeEl.scrollTop : 0, top = treeEl.scrollTop; treeEl.replaceChildren();
        if (q.trim()) {
          const s = q.trim(), up = s.toUpperCase(), low = s.toLowerCase(), types = new Set(plugins.flatMap(P => all(P).map(r => r.t))), isType = types.has(up) && up.length === 4;
          let hits = plugins.flatMap(P => all(P).filter(r => (!filt.length || filt.includes(r.t)) && (isType ? r.t === up : edid(r).toLowerCase().includes(low) || hx(r.id).includes(up))));
          const total = hits.length; hits = sortMode === 'file' ? hits : sortMode === 'edid' ? hits.sort((a, b) => edid(a).localeCompare(edid(b))) : hits.sort((a, b) => a.id - b.id);
          hits.slice(0, 300).forEach(r => treeEl.append(recRow(r, 'flat', plugins.length > 1)));
          if (total > 300) treeEl.append(h('div', { class: 't-note' }, T('Seuls les 300 premiers résultats sont affichés. Affinez la recherche.', 'Only the first 300 results are shown. Refine your search.')));
          if (!total) treeEl.append(h('div', { class: 't-note' }, T('Aucun résultat', 'No results')));
          treeEl.scrollTop = 0; return;
        }
        const sec = (title, recs, clear) => { if (!recs.length) return; treeEl.append(h('div', { class: 't-row t-sec' }, h('span', { class: 't-ed' }, title), clear ? h('button', { class: 't-mini', 'data-act': 'clear' }, T('Vider', 'Clear')) : null)); recs.forEach(r => treeEl.append(recRow(r, 'top', plugins.length > 1))); };
        recent = recent.filter(r => !recDead(r)); pins = pins.filter(r => !recDead(r));
        sec(T('Récemment consultés', 'Recently viewed'), recent, true); sec(T('Épinglés', 'Pinned'), pins, false);
        plugins.forEach(P => {
          treeEl.append(h('div', { class: 't-row t-ph' + (P.dirty ? ' dirty' : ''), 'data-p': P.name, 'data-act': 'toggle' }, h('span', { class: 't-chev' + (P.collapsed ? '' : ' open') }, '›'), h('span', { class: 'nm' }, P.name),
            h('button', { class: 't-mini' + (P.locked ? ' on' : ''), 'data-act': 'lock', 'aria-pressed': P.locked }, P.locked ? T('Déverrouiller', 'Unlock') : T('Verrouiller', 'Lock')), h('button', { class: 't-mini', 'data-act': 'close' }, T('Fermer', 'Close'))));
          if (P.collapsed) return;
          treeEl.append(recRow(P.header, 'top', false));
          P.groups.filter(g => !filt.length || filt.includes(g.t)).forEach(g => {
            const open = P.exp.has(g.t); treeEl.append(h('div', { class: 't-row t-g', 'data-act': 'group', 'data-p': P.name, 'data-g': g.t, role: 'treeitem', 'aria-expanded': open }, h('span', { class: 't-chev' + (open ? ' open' : '') }, '›'), h('span', { class: 't-ed' }, 'Top ' + g.t)));
            if (open) sortRecs(g.recs).forEach(r => treeEl.append(recRow(r, '', false)));
          });
        });
        if (!plugins.length) treeEl.append(h('div', { class: 't-note' }, T('Aucun fichier chargé', 'No file loaded')));
        const sel1 = sel0 && [...treeEl.querySelectorAll('.t-row:not(.top)')].find(x => x._rec === cur);
        treeEl.scrollTop = sel1 ? sel1.offsetTop - off0 : top;
      }
      const markSel = () => treeEl.querySelectorAll('.t-row').forEach(el => el.classList.toggle('on', !!el._rec && el._rec === cur));
      const ensureVisible = el => { if (!el) return; const t = el.offsetTop, b = t + el.offsetHeight; if (t < treeEl.scrollTop + 28) treeEl.scrollTop = Math.max(0, t - 40); else if (b > treeEl.scrollTop + treeEl.clientHeight) treeEl.scrollTop = b - treeEl.clientHeight + 4; };
      treeEl.addEventListener('click', e => {
        const row = e.target.closest('.t-row'); if (!row) return; const act = (e.target.closest('[data-act]') || {}).dataset?.act;
        const P = plugins.find(x => x.name === row.dataset.p);
        if (act === 'clear') { recent = []; sfx.tick(); renderTree(); }
        else if (act === 'lock') { P.locked = !P.locked; sfx.click(); flash(P.locked ? T(`${P.name} est verrouillé.`, `${P.name} is locked.`) : T(`${P.name} est déverrouillé.`, `${P.name} is unlocked.`)); renderTree(); if (cur && cur.p === P) showRecord(cur, false); }
        else if (act === 'close') closePlugin(P);
        else if (act === 'toggle') { P.collapsed = !P.collapsed; active = P; sfx.tick(); renderTree(); drawFoot(); }
        else if (act === 'group') { const g = row.dataset.g; P.exp.has(g) ? P.exp.delete(g) : P.exp.add(g); active = P; sfx.tick(); renderTree(); drawFoot(); }
        else if (row._rec) showRecord(row._rec);
      });
      treeEl.addEventListener('dragstart', e => { const r = e.target.closest('.t-row')?._rec; if (!r || r === r.p.header) return e.preventDefault(); dragRecs = [r]; e.dataTransfer.setData('text/plain', 'pluginlens-record'); e.dataTransfer.effectAllowed = 'copy'; });
      treeEl.addEventListener('dragend', () => { dragRecs = []; });
      treeEl.addEventListener('keydown', e => {
        const rows = [...treeEl.querySelectorAll('.t-row')].filter(x => x._rec && !x.classList.contains('top'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = rows.findIndex(x => x._rec === cur), n = rows[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, rows.length - 1)]; if (n) { showRecord(n._rec, false); markSel(); ensureVisible(n); } }
        else if ((e.key === 'Backspace' || e.key === 'Delete') && cur && cur !== cur.p.header) { e.preventDefault(); deleteRecord(cur); }
      });
      /* dépôt de fichiers du bureau : l'appli les ouvre, la démo explique qu'elle ne lit rien */
      root.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
      root.addEventListener('drop', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); flash(T('Cette démo ne lit aucun fichier : utilisez « Ouvrir des plugins » pour essayer avec des exemples.', 'This demo reads no file: use “Open plugins” to try with samples.')); } });

      function showRecord(r, select = true) {
        cur = r; active = r.p; if (r !== r.p.header) { recent = [r, ...recent.filter(x => x !== r)].slice(0, 12); }
        if (select && !q.trim()) { if ((!r.p.exp.has(r.t) && r !== r.p.header) || r.p.collapsed) { r.p.exp.add(r.t); r.p.collapsed = false; } renderTree(); }
        else markSel();
        if (select) ensureVisible([...treeEl.querySelectorAll('.t-row.on')].pop());
        detEl.replaceChildren(recordPage(r)); detEl.scrollTop = 0; drawFoot(); keepFocus();
      }
      const keepFocus = () => { const a = document.activeElement; if (!a || a === document.body || !root.contains(a)) root.focus({ preventScroll: true }); };
      function showWelcome() { detEl.replaceChildren(h('div', { class: 'p-detc' }, h('div', { class: 'p-welcome' }, h('h2', {}, T('Glissez un ou plusieurs fichiers .ESP, .ESM ou .ESL ici', 'Drop one or more .ESP, .ESM or .ESL files here')), h('p', {}, T('Tout est analysé localement. Aucune installation de Skyrim n’est nécessaire.', 'Everything is analyzed locally. No Skyrim installation is required.')), h('button', { class: 'sbtn acc', onclick: () => openDialog() }, T('Ouvrir des plugins', 'Open plugins'))))); }
      function showMessage(t) { detEl.replaceChildren(h('div', { class: 'p-detc' }, h('div', { class: 'p-msg' }, t))); keepFocus(); }

      /* ---------------- fiche d'enregistrement ---------------- */
      function recordPage(r) {
        const P = r.p, lock = P.locked, page = h('div', { class: 'p-page' }), isH = r === P.header;
        const meta = h('p', { class: 'p-meta' }), title = h('h2', { class: 'p-title' });
        const drawTitle = () => { title.textContent = `${r.t}  ${edid(r)}`; meta.textContent = T(`${P.name} · Propriétaire : ${owner(r.id, P)}`, `${P.name} · Owner: ${owner(r.id, P)}`); };
        const hexF = (name, get, set) => { const inp = h('input', { class: 'p-hexf', value: hx(get()), spellcheck: 'false', disabled: lock, 'aria-label': name }); inp.oninput = () => { if (!/^[0-9a-f]{1,8}$/i.test(inp.value.trim())) return inp.classList.add('bad'); inp.classList.remove('bad'); const v = parseInt(inp.value.trim(), 16) >>> 0; if (v !== get()) set(v); }; return [h('label', { class: 'p-hx' }, h('span', {}, name), inp), inp]; };
        const [idF] = hexF(T('FormID (hex)', 'FormID (hex)'), () => r.id, v => { const o = r.id; op(P, 'id' + r.t + o, T(`FormID modifié sur ${label(r)}`, `FormID changed on ${label(r)}`), () => { r.id = o; }, () => { r.id = v; }); r.id = v; drawTitle(); const row = [...treeEl.querySelectorAll('.t-row')].find(x => x._rec === r); if (row) row.querySelector('.t-id').textContent = hx(v); });
        const [flF, flInp] = hexF(T('Flags (hex)', 'Flags (hex)'), () => r.flags, v => { const o = r.flags; op(P, 'fl' + label(r), T(`Flags modifiés sur ${label(r)}`, `Flags changed on ${label(r)}`), () => { r.flags = o; }, () => { r.flags = v; }); r.flags = v; syncFlags(); });
        const flagBtns = [];
        const syncFlags = () => flagBtns.forEach(([b, bit]) => { const on = (r.flags & bit) !== 0; b.setAttribute('aria-checked', on); b.firstChild.className = 'cb' + (on ? ' on' : ''); b.firstChild.textContent = on ? '✓' : ''; });
        (isH ? TES4FLAGS : RFLAGS).forEach(([bit, fr, en]) => { const b = h('button', { class: 'p-fl', role: 'checkbox', disabled: lock, onclick: () => { const o = r.flags, v = (r.flags & bit) ? (r.flags & ~bit) >>> 0 : (r.flags | bit) >>> 0; op(P, null, `${T(fr, en)} ${T('sur', 'on')} ${label(r)}`, () => { r.flags = o; }, () => { r.flags = v; }); r.flags = v; flInp.value = hx(v); flInp.classList.remove('bad'); sfx.tick(); syncFlags(); } }, h('span', { class: 'cb' }), h('span', {}, T(fr, en))); flagBtns.push([b, bit]); });
        const pin = h('button', { class: 'p-plb', onclick: () => { pins.includes(r) ? pins = pins.filter(x => x !== r) : pins.push(r); pin.textContent = pins.includes(r) ? T('Désépingler', 'Unpin') : T('Épingler', 'Pin'); sfx.tick(); if (!q.trim()) renderTree(); } }, pins.includes(r) ? T('Désépingler', 'Unpin') : T('Épingler', 'Pin'));
        if (lock) page.append(h('div', { class: 'p-lock' }, T(`${P.name} est verrouillé. Déverrouillez-le depuis l’arbre pour le modifier.`, `${P.name} is locked. Unlock it from the tree to edit it.`)));
        page.append(title, h('div', { class: 'p-hexs' }, idF, flF), meta,
          h('div', { class: 'p-acts' }, h('button', { class: 'p-plb', disabled: lock, onclick: () => addSub(r) }, T('Ajouter un sous-enregistrement', 'Add a subrecord')), h('button', { class: 'p-plb', disabled: lock || isH, onclick: () => cloneRecord(r) }, T('Cloner', 'Clone')), h('button', { class: 'p-plb', disabled: lock || isH, onclick: () => deleteRecord(r) }, T('Supprimer', 'Delete')), pin, h('button', { class: 'p-plb', onclick: () => whereUsed(r) }, T('Où est-il utilisé ?', 'Where is it used?'))),
          h('div', { class: 'p-flags' }, flagBtns.map(([b]) => b)));
        drawTitle(); syncFlags();
        if (r.t === 'FLST') page.append(flPanel(r)); if (r.t === 'GLOB') page.append(globPanel(r)); if (r.subs.some(s => s.t === 'KWDA')) page.append(kwPanel(r));
        const hidden = s => (r.t === 'FLST' && s.t === 'LNAM') || (r.t === 'GLOB' && (s.t === 'FNAM' || s.t === 'FLTV')) || s.t === 'KSIZ' || s.t === 'KWDA';
        r.subs.filter(s => !hidden(s)).forEach(s => page.append(subEditor(r, s, drawTitle)));
        return page;
      }
      function subEditor(r, s, drawTitle) {
        const P = r.p; let mode = s.m || (isText(s.d) ? 't' : 'h');
        const ta = h('textarea', { class: 'p-ta', spellcheck: 'false', rows: 1, readOnly: P.locked, 'aria-label': s.t }), meta = h('span', { class: 'p-sm' }), hint = h('span', { class: 'p-sm' });
        const modeBtn = h('button', { class: 'p-plb', onclick: () => { mode = mode === 't' ? 'h' : 't'; s.m = mode; paint(); sfx.tick(); } });
        const upd = () => { meta.textContent = T(`${s.d.length} octets`, `${s.d.length} bytes`); hint.textContent = u32Hint(s.d); modeBtn.textContent = mode === 't' ? T('Hexadécimal', 'Hexadecimal') : T('Texte', 'Text'); };
        const size = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight + 2, 12 * 19 + 14) + 'px'; };
        const paint = () => { ta.value = mode === 't' ? textOf(s.d) : hexBytes(s.d); ta.classList.remove('bad'); upd(); size(); };
        ta.addEventListener('input', () => {
          if (P.locked) return; let nd; if (mode === 't') nd = bstr(ta.value); else { nd = parseHex(ta.value); if (!nd) { ta.classList.add('bad'); return; } ta.classList.remove('bad'); }
          const old = s.d; op(P, 'sub' + label(r) + s.t + r.subs.indexOf(s), T(`Modifié ${s.t} dans ${label(r)}`, `Edited ${s.t} in ${label(r)}`), () => { s.d = old; }, () => { s.d = nd; }); s.d = nd; upd(); size();
          if (s.t === 'EDID') { drawTitle(); const row = [...treeEl.querySelectorAll('.t-row')].find(x => x._rec === r); if (row) { const e = row.querySelector('.t-ed'); if (e) e.textContent = edid(r); } }
        });
        const pick = s.d.length === 4 ? h('button', { class: 'p-plb', disabled: P.locked, onclick: () => pickRecord({ onPick: t => { const x = xref(t, P); if (x == null) return flash(T(`${t.p.name} n’est pas un maître de ${P.name}.`, `${t.p.name} is not a master of ${P.name}.`)); const old = s.d, nd = bu32(x); op(P, null, T(`${s.t} défini sur ${label(t)} via le sélecteur`, `${s.t} set to ${label(t)} via the picker`), () => { s.d = old; }, () => { s.d = nd; }); s.d = nd; paint(); } }) }, T('Choisir…', 'Choose…')) : null;
        const rm = h('button', { class: 'p-plb', disabled: P.locked, onclick: () => { if (locked(P)) return; const old = r.subs, i = old.indexOf(s), nw = old.filter(x => x !== s); op(P, null, T(`Retiré ${s.t} de ${label(r)}`, `Removed ${s.t} from ${label(r)}`), () => { r.subs = old; }, () => { r.subs = nw; }); r.subs = nw; box.remove(); sfx.tick(); } }, T('Retirer', 'Remove'));
        const box = h('div', { class: 'p-box' }, h('div', { class: 'p-sh' }, h('span', { class: 'p-sn' }, s.t), meta, hint, h('span', { class: 'sp' }), modeBtn, pick, rm), ta);
        paint(); requestAnimationFrame(size); return box;
      }
      function addSub(r) {
        if (locked(r.p)) return; const P = r.p, inp = h('input', { class: 'x-f', maxlength: 4, placeholder: 'FULL', 'aria-label': T('Type de sous-enregistrement', 'Subrecord type'), 'data-first': '' });
        const go = () => { const t = inp.value.trim(); if ([...t].length !== 4) return inp.focus({ preventScroll: true }); s.close(); const nw = [...r.subs, { t, d: new Uint8Array(0), m: null }], old = r.subs; op(P, null, T(`Ajouté ${t} à ${label(r)}`, `Added ${t} to ${label(r)}`), () => { r.subs = old; }, () => { r.subs = nw; }); r.subs = nw; showRecord(r, false); };
        const s = sheet(root, { title: T('Ajouter un sous-enregistrement', 'Add a subrecord'), width: 440, body: h('div', { class: 'x-sb' }, h('span', { class: 'x-note2' }, T('Type de sous-enregistrement (quatre caractères, ex. FULL) :', 'Subrecord type (four characters, e.g. FULL):')), inp), foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: go }, 'OK')] });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      }
      function cloneRecord(r) {
        const P = r.p; if (locked(P)) return; const g = P.groups.find(x => x.recs.includes(r)); let base = edid(r), n = 2; const names = new Set(all(P).map(edid)); let nm = base + '_Copy'; while (names.has(nm)) nm = `${base}_Copy${n++}`;
        const c = { p: P, t: r.t, id: nextId(P), flags: r.flags, subs: r.subs.map(s => ({ ...s, d: s.d.slice() })) }; const e = c.subs.find(s => s.t === 'EDID'); if (e) e.d = bstr(nm);
        const i = g.recs.indexOf(r) + 1; op(P, null, T(`Cloné ${label(r)} en ${hx(c.id)}`, `Cloned ${label(r)} as ${hx(c.id)}`), () => { g.recs.splice(g.recs.indexOf(c), 1); c.dead = true; }, () => { g.recs.splice(i, 0, c); c.dead = false; }, c); g.recs.splice(i, 0, c);
        sfx.pop(); showRecord(c); flash(T(`Cloné en ${hx(c.id)}`, `Cloned as ${hx(c.id)}`));
      }
      function deleteRecord(r) {
        const P = r.p; if (locked(P) || r === P.header) return;
        const s = sheet(root, { width: 460, label: app.id, body: h('div', { class: 'x-al' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('b', {}, T('Supprimer cet enregistrement ? Les enregistrements qui y font référence seront cassés.', 'Delete this record? Records that reference it will be broken.')), h('p', {}, label(r) + ' · ' + hx(r.id)))),
          foot: [h('button', { class: 'sbtn', 'data-first': '', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn dgx', onclick: () => { s.close(); const g = P.groups.find(x => x.recs.includes(r)), i = g.recs.indexOf(r); op(P, null, T(`Supprimé ${r.t} ${edid(r)}`, `Deleted ${r.t} ${edid(r)}`), () => { g.recs.splice(i, 0, r); r.dead = false; }, () => { g.recs.splice(g.recs.indexOf(r), 1); r.dead = true; }, r); g.recs.splice(i, 1); r.dead = true; cur = null; sfx.close(); renderTree(); showMessage(T('Enregistrement supprimé.', 'Record deleted.')); drawFoot(); } }, T('Supprimer', 'Delete'))] });
      }

      /* FormList */
      function flPanel(r) {
        const P = r.p, box = h('div', { class: 'p-box' }), L = () => r.subs.filter(s => s.t === 'LNAM');
        const setL = (list, lbl, k) => { if (locked(P)) return; const nonL = r.subs.filter(s => s.t !== 'LNAM'), nw = [nonL[0], ...list, ...nonL.slice(1)], old = r.subs; op(P, null, lbl, () => { r.subs = old; }, () => { r.subs = nw; }); r.subs = nw; draw(); if (k > 0) flash(T(`${k} entrée(s) retirée(s)`, `${k} entry(ies) removed`)); };
        const rec = s => (s.d.length === 4 ? resolve(P, rd32(s.d)) : null);
        const sortBy = f => [...L()].sort((a, b) => f(a, b));
        function draw() {
          const ents = L(), lk = P.locked, btn = (txt, fn, dis) => h('button', { class: 'p-plb', disabled: dis || lk, onclick: fn }, txt);
          const rows = ents.map((s, i) => {
            const v = s.d.length === 4 ? rd32(s.d) : null, t = rec(s);
            const lbl = t ? h('button', { class: 'p-lnk', onclick: () => showRecord(t) }, `${t.t}  ${edid(t)}` + (t.p !== P ? `  (${t.p.name})` : '')) : h('span', { class: 'l' }, v == null ? T('L’entrée ne fait pas 4 octets', 'The entry is not 4 bytes long') : (v >>> 24) < P.masters.length ? T(`de ${P.masters[v >>> 24]} (non ouvert)`, `from ${P.masters[v >>> 24]} (not open)`) : T('introuvable dans ce fichier', 'not found in this file'));
            const mv = d => { const j = i + d, a = [...ents]; [a[i], a[j]] = [a[j], a[i]]; setL(a, T(`Entrées réordonnées dans ${label(r)}`, `Entries reordered in ${label(r)}`)); };
            return h('div', { class: 'p-ent' }, h('span', { class: 'i' }, `${i + 1}.`), h('span', { class: 'f' }, v == null ? T('invalide', 'invalid') : hx(v)), h('span', { class: 'l' }, lbl), btn(T('Monter', 'Up'), () => mv(-1), i === 0), btn(T('Descendre', 'Down'), () => mv(1), i === ents.length - 1), btn(T('Retirer', 'Remove'), () => setL(ents.filter(x => x !== s), T(`Entrée retirée de ${label(r)}`, `Entry removed from ${label(r)}`))));
          });
          const nm = s => { const t = rec(s); return t ? edid(t).toLowerCase() : '￿'; };
          box.replaceChildren(h('p', { class: 'p-bt' }, T(`Entrées (${ents.length}). Glissez des enregistrements depuis l’arbre, y compris d’autres plugins ouverts.`, `Entries (${ents.length}). Drag records from the tree, including from other open plugins.`)),
            h('div', { class: 'p-acts' }, btn(T('Importer…', 'Import…'), () => importList()), h('button', { class: 'p-plb', onclick: () => exportList() }, T('Exporter…', 'Export…')), btn(T('Trier par nom', 'Sort by name'), () => setL(sortBy((a, b) => nm(a).localeCompare(nm(b))), T(`Entrées triées dans ${label(r)}`, `Entries sorted in ${label(r)}`))), btn(T('Trier par FormID', 'Sort by FormID'), () => setL(sortBy((a, b) => rd32(a.d) - rd32(b.d)), T(`Entrées triées dans ${label(r)}`, `Entries sorted in ${label(r)}`))),
              btn(T('Retirer les doublons', 'Remove duplicates'), () => { const seen = new Set(), keep = ents.filter(s => { const k = hx(rd32(s.d)); if (seen.has(k)) return false; seen.add(k); return true; }); setL(keep, T(`Doublons retirés de ${label(r)}`, `Duplicates removed from ${label(r)}`), ents.length - keep.length); }),
              btn(T('Retirer les entrées cassées', 'Remove broken entries'), () => { const keep = ents.filter(s => s.d.length === 4 && (rec(s) || (rd32(s.d) >>> 24) < P.masters.length)); setL(keep, T(`Entrées cassées retirées de ${label(r)}`, `Broken entries removed from ${label(r)}`), ents.length - keep.length); })),
            ...(rows.length ? rows : [h('div', { class: 'p-mut' }, T('Vide. Déposez des enregistrements ici.', 'Empty. Drop records here.'))]));
        }
        function addEntries(recs) { if (locked(P)) return; const add = recs.map(t => ({ t: xref(t, P), src: t })).filter(x => x.t != null); if (add.length < recs.length) flash(T('Un enregistrement vient d’un plugin qui n’est pas un maître de celui-ci.', 'A record comes from a plugin that is not a master of this one.')); if (!add.length) return; setL([...L(), ...add.map(x => ({ t: 'LNAM', d: bu32(x.t), m: null }))], T(`Ajouté ${add.length} entrée(s) à ${label(r)}`, `Added ${add.length} entry(ies) to ${label(r)}`)); flash(T(`${add.length} entrée(s) ajoutée(s)`, `${add.length} entry(ies) added`)); sfx.pop(); }
        function exportList() { textDialog({ title: T(`Exporter ${label(r)}`, `Export ${label(r)}`), hint: T('EditorID quand il est connu, sinon FormID hexadécimal.', 'EditorID when known, otherwise hexadecimal FormID.'), value: L().map(s => { const t = rec(s); return t ? edid(t) : hx(rd32(s.d)); }).join('\n'), ok: T('Fermer', 'Close'), readOnly: true }); }
        function importList() {
          textDialog({ title: T(`Importer dans ${label(r)}`, `Import into ${label(r)}`), hint: T('Un EditorID ou un FormID hexadécimal à 8 chiffres par ligne. Les FormID suivent la numérotation de ce plugin. Les lignes commençant par # sont ignorées.', 'One EditorID or 8-digit hexadecimal FormID per line. FormIDs follow this plugin’s numbering. Lines starting with # are ignored.'), value: '', ok: T('Importer', 'Import'), onOk: txt => {
            const add = [], bad = []; txt.split('\n').map(x => x.trim()).filter(x => x && !x.startsWith('#')).forEach(x => { if (/^[0-9a-f]{8}$/i.test(x)) add.push(parseInt(x, 16) >>> 0); else { const t = all(P).find(y => edid(y) === x); t ? add.push(t.id) : bad.push(x); } });
            if (add.length) setL([...L(), ...add.map(v => ({ t: 'LNAM', d: bu32(v), m: null }))], T(`Ajouté ${add.length} entrée(s) à ${label(r)}`, `Added ${add.length} entry(ies) to ${label(r)}`)); flash(T(`${add.length} entrée(s) ajoutée(s)`, `${add.length} entry(ies) added`));
            if (bad.length) infoBox(T(`Introuvables (${bad.length}) :\n`, `Not found (${bad.length}):\n`) + bad.slice(0, 30).join('\n')); } });
        }
        box.addEventListener('dragover', e => { if (dragRecs.length) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; box.classList.add('drop'); } });
        box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.classList.remove('drop'); });
        box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('drop'); if (dragRecs.length) addEntries(dragRecs); });
        draw(); return box;
      }
      /* mots-clés */
      function kwPanel(r) {
        const P = r.p, box = h('div', { class: 'p-box' }), ids = () => { const d = r.subs.find(s => s.t === 'KWDA')?.d || new Uint8Array(0), o = []; for (let i = 0; i + 4 <= d.length; i += 4) o.push(rd32(d.slice(i, i + 4))); return o; };
        const setK = (list, lbl) => { if (locked(P)) return; const old = r.subs, nw = old.map(s => (s.t === 'KSIZ' ? { ...s, d: bu32(list.length) } : s.t === 'KWDA' ? { ...s, d: Uint8Array.from(list.flatMap(v => [...bu32(v)])) } : s)); op(P, null, lbl, () => { r.subs = old; }, () => { r.subs = nw; }); r.subs = nw; draw(); };
        function draw() {
          const l = ids();
          box.replaceChildren(h('p', { class: 'p-bt' }, T(`Mots-clés (${l.length})`, `Keywords (${l.length})`)), ...l.map(v => { const t = resolve(P, v); return h('div', { class: 'p-ent' }, h('span', { class: 'f' }, hx(v)), t ? h('button', { class: 'p-lnk', onclick: () => showRecord(t) }, edid(t) || t.t) : h('span', { class: 'l' }, (v >>> 24) < P.masters.length ? T(`de ${P.masters[v >>> 24]}`, `from ${P.masters[v >>> 24]}`) : T('introuvable', 'not found')), h('span', { class: 'l' }), h('button', { class: 'p-plb', disabled: P.locked, onclick: () => setK(l.filter(x => x !== v), T(`Mot-clé retiré de ${label(r)}`, `Keyword removed from ${label(r)}`)) }, T('Retirer', 'Remove'))); }),
            h('div', { class: 'p-acts' }, h('button', { class: 'p-plb', disabled: P.locked, onclick: () => pickRecord({ type: 'KYWD', hint: T('Choisissez un enregistrement KYWD.', 'Choose a KYWD record.'), onPick: t => { const x = xref(t, P); if (x == null) return; if (l.includes(x)) return flash(T('Ce mot-clé est déjà présent', 'This keyword is already there')); setK([...l, x], T(`Mot-clé ajouté à ${label(r)}`, `Keyword added to ${label(r)}`)); } }) }, T('Ajouter un mot-clé…', 'Add a keyword…'))));
        }
        box.addEventListener('dragover', e => { if (dragRecs.length) { e.preventDefault(); box.classList.add('drop'); } });
        box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.classList.remove('drop'); });
        box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('drop'); if (locked(P)) return; const l = ids(); let n = 0; dragRecs.forEach(t => { const x = xref(t, P); if (x != null && !l.includes(x)) { l.push(x); n++; } }); if (n) setK(l, T(`Ajouté ${n} mot(s)-clé(s) à ${label(r)}`, `Added ${n} keyword(s) to ${label(r)}`)); });
        draw(); return box;
      }
      /* variable globale */
      function globPanel(r) {
        const P = r.p, fn = r.subs.find(s => s.t === 'FNAM'), fv = r.subs.find(s => s.t === 'FLTV'), ty = { s: 'Short', l: 'Long', f: 'Float' };
        const sel = h('select', { class: 'p-sel', disabled: P.locked, 'aria-label': T('Type', 'Type'), onchange: e => { const o = fn.d, nd = Uint8Array.of(e.target.value.charCodeAt(0)); op(P, null, T(`Type modifié pour ${label(r)}`, `Type changed for ${label(r)}`), () => { fn.d = o; }, () => { fn.d = nd; }); fn.d = nd; } }, Object.entries(ty).map(([k, v]) => h('option', { value: k, selected: String.fromCharCode(fn.d[0]) === k }, v)));
        const val = h('input', { class: 'p-gv', value: String(+rdf32(fv.d).toPrecision(7)), disabled: P.locked, 'aria-label': T('Valeur', 'Value'), oninput: e => { const f = parseFloat(e.target.value); if (!Number.isFinite(f)) return; const o = fv.d, nd = bf32(f); op(P, 'glob' + label(r), T(`Valeur modifiée pour ${label(r)}`, `Value changed for ${label(r)}`), () => { fv.d = o; }, () => { fv.d = nd; }); fv.d = nd; } });
        return h('div', { class: 'p-box' }, h('p', { class: 'p-bt' }, T('Variable globale', 'Global variable')), h('div', { class: 'p-ent' }, h('span', { class: 'p-mut' }, T('Type', 'Type')), sel, h('span', { class: 'p-mut' }, T('Valeur', 'Value')), val), h('span', { class: 'p-meta' }, T('Toutes les globales stockent leur valeur en flottant, quel que soit leur type.', 'All globals store their value as a float, whatever their type.')));
      }

      /* ---------------- dialogues ---------------- */
      function infoBox(msg) { const s = sheet(root, { width: 460, label: app.id, body: h('div', { class: 'x-al' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('p', {}, msg))), foot: [h('button', { class: 'sbtn acc', onclick: () => s.close() }, 'OK')] }); }
      function textDialog({ title, hint, value, ok, onOk, readOnly }) {
        const ta = h('textarea', { class: 'x-ta', spellcheck: 'false', readOnly: !!readOnly, 'aria-label': title }); ta.value = value;
        const s = sheet(root, { title, width: 560, body: h('div', { class: 'x-sb' }, h('span', { class: 'x-note2' }, hint), ta), foot: readOnly ? [h('button', { class: 'sbtn acc', onclick: () => s.close() }, ok)] : [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: () => { const v = ta.value; s.close(); onOk(v); } }, ok)] });
        if (!readOnly) ta.focus({ preventScroll: true });
      }
      /** Liste de résultats cliquable : sections, messages et enregistrements. */
      function listDialog({ title, note, rows, top, width = 640 }) {
        const list = h('div', { class: 'x-list' });
        const draw = rs => list.replaceChildren(...rs.map(x => x.sec ? h('div', { class: 'x-sec' }, x.sec) : x.msg ? h('div', { class: 'x-msg' }, x.msg) : h('button', { class: 'x-li', onclick: () => { s.close(); showRecord(x.rec); } }, h('span', { class: 'ty' }, x.rec.t), h('span', { class: 'n' }, edid(x.rec) || hx(x.rec.id)), h('small', {}, x.suffix || ''))));
        const s = sheet(root, { title, width, body: h('div', { class: 'x-sb' }, note ? h('span', { class: 'x-note2' }, note) : null, top ? top(draw) : null, list), foot: [h('button', { class: 'sbtn acc', onclick: () => s.close() }, T('Fermer', 'Close'))], cls: top || rows.length > 8 ? 'big' : '' });
        draw(rows); return { draw };
      }
      function pickRecord({ type, hint, onPick }) {
        const inp = h('input', { class: 'x-f', placeholder: T('Rechercher un EditorID, un FormID ou un type', 'Search for an EditorID, a FormID or a type'), 'aria-label': T('Rechercher', 'Search'), autocomplete: 'off' }), list = h('div', { class: 'x-list' });
        const draw = () => { const low = inp.value.trim().toLowerCase(), up = low.toUpperCase(); const hits = plugins.flatMap(P => all(P).filter(x => x !== P.header && (!type || x.t === type) && (!low || edid(x).toLowerCase().includes(low) || hx(x.id).includes(up) || x.t === up))).slice(0, 200); list.replaceChildren(...(hits.length ? hits.map(x => h('button', { class: 'x-li', onclick: () => { s.close(); onPick(x); } }, h('span', { class: 'ty' }, x.t), h('span', { class: 'n' }, edid(x)), h('small', {}, `${hx(x.id)}${plugins.length > 1 ? '  ' + x.p.name : ''}`))) : [h('div', { class: 'x-msg' }, T('Aucun résultat', 'No results'))])); };
        const s = sheet(root, { title: T('Choisir un enregistrement', 'Choose a record'), width: 600, cls: 'big', body: h('div', { class: 'x-sb' }, hint ? h('span', { class: 'x-note2' }, hint) : null, inp, list), foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel'))] });
        inp.addEventListener('input', draw); draw(); inp.focus({ preventScroll: true });
      }

      /* ---------------- outils ---------------- */
      function whereUsed(r) {
        const rows = []; plugins.forEach(Q => all(Q).forEach(x => x.subs.forEach(s => { if (s.d.length === 4 && x !== r) { const t = xref(r, Q); if (t != null && rd32(s.d) === t) rows.push({ rec: x, suffix: `·${s.t}` + (plugins.length > 1 ? `  (${Q.name})` : '') }); } })));
        listDialog({ title: T(`Où est utilisé : ${label(r)}`, `Where used: ${label(r)}`), note: T('Heuristique : tout sous-enregistrement de 4 octets dont la valeur égale ce FormID (renuméroté pour chaque plugin). Peut inclure des faux positifs et ignore les champs qui ne font pas 4 octets.', 'Heuristic: any 4-byte subrecord whose value equals this FormID (renumbered for each plugin). May include false positives and ignores fields that are not 4 bytes.'), rows: rows.length ? rows : [{ msg: T('Aucun enregistrement ouvert n’a de champ de 4 octets égal à ce FormID.', 'No open record has a 4-byte field equal to this FormID.') }] });
      }
      function duplicates() {
        const byId = new Map(), byE = new Map(), rows = [];
        plugins.forEach(P => all(P).forEach(x => { if (x === P.header) return; const k = P.name + hx(x.id); (byId.get(k) || byId.set(k, []).get(k)).push(x); const e = edid(x); if (e) (byE.get(e) || byE.set(e, []).get(e)).push(x); }));
        const di = [...byId.values()].filter(l => l.length > 1), de = [...byE.values()].filter(l => l.length > 1);
        if (di.length) { rows.push({ sec: T('FORMID EN DOUBLE DANS UN PLUGIN', 'DUPLICATE FORMIDS WITHIN A PLUGIN') }); di.forEach(l => l.forEach(x => rows.push({ rec: x, suffix: `(${x.p.name})` }))); }
        if (de.length) { rows.push({ sec: T('EDITORID PARTAGÉS (MÊME NOM, ENREGISTREMENTS DIFFÉRENTS)', 'SHARED EDITORIDS (SAME NAME, DIFFERENT RECORDS)') }); de.slice(0, 120).forEach(l => l.forEach(x => rows.push({ rec: x, suffix: `(${x.p.name})` }))); }
        if (!di.length && !de.length) rows.push({ msg: T('Aucun EditorID ni FormID en double dans les plugins ouverts.', 'No duplicate EditorIDs or FormIDs in the open plugins.') });
        listDialog({ title: T('Doublons', 'Duplicates'), note: T('Des FormID en double dans un même plugin sont invalides et doivent être corrigés. Des EditorID partagés entre plugins sont souvent normaux (surcharges).', 'Duplicate FormIDs within one plugin are invalid and must be fixed. EditorIDs shared between plugins are often normal (overrides).'), rows });
      }
      function comparePlugins() {
        if (plugins.length < 2) return flash(T('Ouvrez au moins deux plugins pour les comparer', 'Open at least two plugins to compare them'));
        let a = 0, b = 1; const sel = (v, set) => h('select', { class: 'x-sel', onchange: e => { set(+e.target.value); } }, plugins.map((P, i) => h('option', { value: i, selected: i === v }, P.name)));
        const key = x => x.t + ' ' + edid(x), ser = x => x.subs.map(s => s.t + hexBytes(s.d)).join('|');
        const go = draw => { const A = plugins[a], B = plugins[b]; if (A === B) return draw([{ msg: T('Choisissez deux plugins différents.', 'Choose two different plugins.') }]); const ma = new Map(all(A).filter(x => x !== A.header && edid(x)).map(x => [key(x), x])), mb = new Map(all(B).filter(x => x !== B.header && edid(x)).map(x => [key(x), x]));
          const added = [...mb].filter(([k]) => !ma.has(k)).map(([, x]) => x), removed = [...ma].filter(([k]) => !mb.has(k)).map(([, x]) => x), changed = [...mb].filter(([k, x]) => ma.has(k) && ser(ma.get(k)) !== ser(x)).map(([, x]) => x), rows = [];
          [[T(`Seulement dans ${B.name}`, `Only in ${B.name}`), added], [T(`Seulement dans ${A.name}`, `Only in ${A.name}`), removed], [T('Modifiés (même EditorID, sous-enregistrements différents)', 'Modified (same EditorID, different subrecords)'), changed]].forEach(([t, l]) => { if (l.length) { rows.push({ sec: `${t.toUpperCase()} (${l.length})` }); l.slice(0, 200).forEach(x => rows.push({ rec: x, suffix: `(${x.p.name})` })); } });
          draw(rows.length ? rows : [{ msg: T('Aucune différence trouvée par EditorID.', 'No differences found by EditorID.') }]); sfx.pop(); };
        let ctl; const L = listDialog({ title: T('Comparer deux plugins', 'Compare two plugins'), note: T('Associe les enregistrements par type et EditorID : idéal pour deux versions d’un même plugin.', 'Matches records by type and EditorID: ideal for two versions of the same plugin.'), rows: [], width: 760, top: draw => { ctl = draw; return h('div', { class: 'x-row' }, h('span', {}, T('A :', 'A:')), sel(a, v => { a = v; }), h('span', {}, T('B :', 'B:')), sel(b, v => { b = v; }), h('button', { class: 'sbtn acc', onclick: () => go(draw) }, T('Comparer', 'Compare'))); } });
        go(ctl);
      }
      function stats() {
        const P = active; if (!P) return; const cnt = new Map(); all(P).forEach(x => { if (x !== P.header) cnt.set(x.t, (cnt.get(x.t) || 0) + 1); });
        const rows = [{ msg: T(`Enregistrements : ${num(all(P).length - 1)}`, `Records: ${num(all(P).length - 1)}`) }, { msg: T('Maîtres : ', 'Masters: ') + (P.masters.length ? P.masters.join(', ') : T('aucun', 'none')) }, { sec: T('ENREGISTREMENTS PAR TYPE', 'RECORDS BY TYPE') }, ...[...cnt].sort((x, y) => y[1] - x[1]).map(([t, n]) => ({ msg: `${t}    ${num(n)}` }))];
        listDialog({ title: P.name, rows, width: 480 });
      }
      function showLog() { const P = active; if (!P) return; textDialog({ title: T(`Journal des modifications — ${P.name}`, `Change log — ${P.name}`), hint: T('Session en cours uniquement.', 'Current session only.'), value: P.log.length ? P.log.join('\n') : T('Aucune modification enregistrée pendant cette session.', 'No changes recorded during this session.'), ok: T('Fermer', 'Close'), readOnly: true }); }
      function newFormList() {
        const P = active || plugins[0]; if (!P || locked(P)) return; const inp = h('input', { class: 'x-f', placeholder: 'MyFormList', 'aria-label': 'EditorID', 'data-first': '' });
        const go = () => { const e = inp.value.trim(); if (!e) return inp.focus({ preventScroll: true }); s.close(); let g = P.groups.find(x => x.t === 'FLST'); const made = !g; if (!g) g = { t: 'FLST', recs: [] }; const c = { p: P, t: 'FLST', id: nextId(P), flags: 0, subs: [{ t: 'EDID', d: bstr(e), m: null }] };
          op(P, null, T(`Nouvelle FormList ${e}`, `New FormList ${e}`), () => { g.recs.splice(g.recs.indexOf(c), 1); c.dead = true; if (made) P.groups.splice(P.groups.indexOf(g), 1); }, () => { g.recs.push(c); c.dead = false; if (made && !P.groups.includes(g)) P.groups.push(g); }, c); g.recs.push(c); if (made) P.groups.push(g); showRecord(c); sfx.pop(); };
        const s = sheet(root, { title: T('Nouvelle FormList…', 'New FormList…'), width: 440, body: h('div', { class: 'x-sb' }, h('span', { class: 'x-note2' }, T(`Dans ${P.name} : EditorID de la nouvelle FormList.`, `In ${P.name}: EditorID of the new FormList.`)), inp), foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: go }, 'OK')] });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      }
      function saveCopy() {
        const P = active || plugins[0]; if (!P) return flash(T('Aucun fichier chargé', 'No file loaded'));
        const inp = h('input', { class: 'x-f', value: P.name.replace(/(\.\w+)$/, ' (modifié)$1').replace('(modifié)', T('(modifié)', '(modified)')), 'aria-label': T('Nom du fichier', 'File name'), 'data-first': '' });
        const go = () => { const n = inp.value.trim() || P.name; s.close(); P.dirty = false; renderTree(); drawFoot(); sfx.done(); toast({ icon: icon(app.id), title: app.id, body: T(`Copie enregistrée : ${n}. Le plugin d’origine n’est pas modifié.`, `Copy saved: ${n}. The original plugin is untouched.`) }); };
        const s = sheet(root, { title: T('Enregistrer une copie…', 'Save a copy…'), width: 520, body: h('div', { class: 'x-sb' }, h('span', { class: 'x-note2' }, T('Les modifications sont enregistrées dans une copie : votre plugin d’origine n’est jamais écrasé.', 'Changes are saved as a copy: your original plugin is never overwritten.')), inp), foot: [h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn acc', onclick: go }, T('Enregistrer', 'Save'))] });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      }
      function closePlugin(P) {
        const done = () => { plugins.splice(plugins.indexOf(P), 1); if (active === P) active = plugins[0] || null; if (cur && cur.p === P) { cur = null; plugins.length ? showMessage(T('Plugin fermé.', 'Plugin closed.')) : showWelcome(); } if (!plugins.length) showWelcome(); sfx.close(); renderTree(); drawFoot(); };
        if (!P.dirty) return done();
        const s = sheet(root, { width: 460, label: app.id, body: h('div', { class: 'x-al' }, h('img', { src: icon(app.id), alt: '' }), h('div', {}, h('b', {}, T(`${P.name} a des modifications non enregistrées.`, `${P.name} has unsaved changes.`)), h('p', {}, T('Fermer quand même ?', 'Close anyway?')))), foot: [h('button', { class: 'sbtn acc', 'data-first': '', onclick: () => s.close() }, T('Annuler', 'Cancel')), h('button', { class: 'sbtn dgx', onclick: () => { s.close(); done(); } }, T('Fermer', 'Close'))] });
      }
      function openDialog() {
        const samples = SAMPLES(), ch = new Set(), list = h('div', { class: 'x-list' });
        const ok = h('button', { class: 'sbtn acc', disabled: true, onclick: () => { s.close(); load(samples.filter(x => ch.has(x.n))); } }, T('Ouvrir', 'Open'));
        const draw = () => { list.replaceChildren(...samples.map(x => { const isOpen = plugins.some(p => p.name === x.n); return h('button', { class: 'x-li', role: 'checkbox', 'aria-checked': ch.has(x.n), disabled: isOpen, onclick: () => { ch.has(x.n) ? ch.delete(x.n) : ch.add(x.n); sfx.tick(); draw(); } }, h('span', { class: 'cb' + (ch.has(x.n) ? ' on' : '') }, ch.has(x.n) ? '✓' : ''), h('span', { class: 'n' }, x.n), h('small', {}, isOpen ? T('déjà ouvert', 'already open') : x.info)); })); ok.disabled = !ch.size; ok.textContent = T('Ouvrir', 'Open') + (ch.size ? ` (${ch.size})` : ''); };
        const s = sheet(root, { title: T('Ouvrir des plugins', 'Open plugins'), width: 520, body: h('div', { class: 'x-sb' }, h('span', { class: 'x-note2' }, T('Plugins Skyrim', 'Skyrim plugins') + ' (*.esp *.esm *.esl)'), list),
          foot: [h('span', { class: 'x-note' }, T('Plugins d’exemple générés dans le navigateur : rien n’est lu sur votre ordinateur.', 'Sample plugins generated in the browser: nothing is read from your computer.')), h('button', { class: 'sbtn', onclick: () => s.close() }, T('Annuler', 'Cancel')), ok] });
        draw();
      }
      function load(list) { list.forEach(x => { if (!plugins.some(p => p.name === x.n)) { const P = x.mk(); plugins.push(P); active = cur ? cur.p : P; } }); if (plugins.length && !cur) detEl.replaceChildren(h('div', { class: 'p-detc' }, h('div', { class: 'p-msg' }, T('Choisissez un enregistrement dans l’arbre, ou cherchez un EditorID.', 'Pick a record in the tree, or search for an EditorID.')))); sfx.pop(); renderTree(); drawFoot(); }

      /* ---------------- menu (équivalent de la barre des menus de l'appli) ---------------- */
      function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; removeEventListener('pointerdown', away, true); } }
      const away = e => { if (!root.isConnected) { removeEventListener('pointerdown', away, true); return; } if (menuEl && !menuEl.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); };
      w.cleanup = () => { closeMenu(); offKeys(); };
      function toggleMenu() {
        if (menuEl) return closeMenu(); sfx.click(); const P = active;
        const it = (l, fn, k, dis) => h('button', { class: 'p-mi', role: 'menuitem', disabled: dis, onclick: () => { closeMenu(); fn(); } }, l, k ? h('kbd', {}, k) : null);
        menuEl = h('div', { class: 'p-menu', role: 'menu', style: { top: hd.offsetTop + hd.offsetHeight + 4 + 'px', right: '12px' } },
          h('div', { class: 'p-ms' }, T('FICHIER', 'FILE')), it(T('Ouvrir des plugins…', 'Open plugins…'), openDialog, '⌘O'), it(T('Enregistrer une copie…', 'Save a copy…'), saveCopy, '⌘S', !plugins.length), it(T('Fermer le plugin actif', 'Close the active plugin'), () => P && closePlugin(P), '⌘W', !P),
          h('div', { class: 'p-mh' }), h('div', { class: 'p-ms' }, T('ÉDITION', 'EDIT')), it(T('Annuler la modification', 'Undo'), () => undoRedo(false), '⌘Z', !P || !P.undo.length), it(T('Rétablir', 'Redo'), () => undoRedo(true), '⇧⌘Z', !P || !P.redo.length), it(T('Nouvelle FormList…', 'New FormList…'), newFormList, '', !P),
          h('div', { class: 'p-mh' }), h('div', { class: 'p-ms' }, T('OUTILS', 'TOOLS')), it(T('Doublons…', 'Duplicates…'), duplicates, '', !plugins.length), it(T('Comparer deux plugins…', 'Compare two plugins…'), comparePlugins, '', plugins.length < 2), it(T('Statistiques…', 'Statistics…'), stats, '', !P), it(T('Journal des modifications…', 'Change log…'), showLog, '', !P));
        root.append(menuEl); setTimeout(() => addEventListener('pointerdown', away, true), 0);
      }
      root.addEventListener('keydown', e => { if (e.key === 'Escape' && menuEl) { closeMenu(); menuBtn.focus({ preventScroll: true }); } });
      const offKeys = hotkeys(w, root, e => {
        if (!(e.metaKey || e.ctrlKey)) return; const k = e.key.toLowerCase(), field = e.target.closest && e.target.closest('input,textarea,select');
        if (k === 'o') { e.preventDefault(); openDialog(); } else if (k === 's') { e.preventDefault(); saveCopy(); } else if (k === 'w') { e.preventDefault(); if (active) closePlugin(active); }
        else if (k === 'z' && !field) { e.preventDefault(); undoRedo(e.shiftKey); } else if (k === 'f') { e.preventDefault(); qIn.focus({ preventScroll: true }); qIn.select(); }
      });

      /* ---------------- démarrage : deux plugins ouverts, comme dans l'appli ---------------- */
      const [nro, aos] = SAMPLES(); plugins.push(nro.mk(), aos.mk()); active = plugins[1]; plugins[1].exp.add('PROJ');
      renderTree(); showRecord(plugins[1].header, false); drawFoot();
      return root;
    } });
}
