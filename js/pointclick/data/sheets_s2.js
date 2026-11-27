/* Saison 2 (scènes `hd` : canevas 960 × 540, coordonnées logiques 480 × 270 inchangées).
   Sprites pleine couleur à densité 2 (1 pixel d'image = ½ unité logique = 1 pixel du canevas) : assets/pointclick/s2/spr/<nom>.webp (années 90 : s2/90/spr/<nom>.png),
   nommés « s2:<nom> » dans les scènes. Détourage : easter eggs/pointclick/tools/s2_assets.py. */

/* couleur des bulles par personnage (id = « who » des dialogues de crossover/dialogues) */
export const COLORS = {
  sheo: '#e9a2ff', guybrush: '#ffe9a8', swordmaster: '#ff9a7a', parrot: '#9cf08f', lechuck: '#7dffb6',
  max: '#ffffff', sam: '#c8b48a', villager: '#c9a77a', creeper: '#8de07a', indy: '#e0b070', doc: '#e6f0ff', hat: '#c0a070', potions: '#b8c0d0',
  coconut: '#e0d0a0', ni: '#c8e0a0', blackknight: '#b0b0c0', perceval: '#9fc8ff', arthur: '#ffb070', karadoc: '#ff8a80',
  barbarian: '#ffb080', luckdragon: '#f4e8ff', house: '#cfe0ff', paleo: '#f0d090', trex: '#a0e070', kid: '#ffd080', girl: '#ffb0c8',
  flower: '#ff8070', redman: '#ff6060', agent: '#d0d8ff', loglady: '#e0c8a0', dexter: '#ffa070', sister: '#ffc0a0', morpheus: '#90e0a0',
  agentm: '#a0ffb0', spoonkid: '#e0ffe0', wizard: '#e8e8f8', demon: '#ff7040', halfling: '#c0e890', charmer: '#ffd0a0', joker: '#ffe080',
  nervpaleo: '#d0c0ff', singer: '#ffc0e0', madsci: '#b8f0ff', grandson: '#ffe870', bluegenie: '#8fd8ff', ai: '#fff0a0', turret: '#ffffff'
};

/* objets de la saison 2 (icône de besace et curseur) ; noms `n.<id>` dans lang/s2x_*.js */
export const ITEMS = {
  wabbajack: { spr: 's2:i_wabbajack' },
  cracker: { spr: 's2:i_cracker' }, map: { spr: 's2:i_map' }, grog: { spr: 's2:i_grog' }, rootbeer: { spr: 's2:i_rootbeer' }, cheese_nl: { spr: 's2:i_cheese_nl' },
  sweetroll: { spr: 's2:i_sweetroll' }, cheese12: { spr: 's2:i_cheese12' },
  shout: { spr: 's2:i_shout' }, septims: { spr: 's2:i_septims' },
  wood13: { spr: 's2:i_wood13' }, waterbucket13: { spr: 's2:i_waterbucket13' }, cheesecube: { spr: 's2:i_cheesecube' }, idol: { spr: 's2:p_idol14' }, cheese14: { spr: 's2:i_cheese14' }, cable15: { spr: 's2:i_cable15' }, cheese15: { spr: 's2:i_cheese15' }, flower16: { spr: 's2:i_flower16' }, cheese16: { spr: 's2:i_cheese16' }, grail17: { spr: 's2:p_grail17' }, cheese17k: { spr: 's2:i_cheese17k' }, lavender: { spr: 's2:i_lavender17' }, cheese17g: { spr: 's2:i_cheese17g' }, cheese18: { spr: 's2:i_cheese18' }, marker19: { spr: 's2:i_marker19' }, potion19: { spr: 's2:i_potion19' }, cheese19: { spr: 's2:p_sandwich19' }, butterfly20: { spr: 's2:i_butterfly20' }, cheese20: { spr: 's2:i_cheese20' }, cheese21: { spr: 's2:i_cheese21' }, coffee22: { spr: 's2:i_coffee22' }, pie22: { spr: 's2:i_pie22' }, cheese22: { spr: 's2:i_cheese22' }, cheese23: { spr: 's2:i_cheese23' }, cheese24: { spr: 's2:i_cheese24' }, ring25: { spr: 's2:p_ring25' }, cheese25: { spr: 's2:i_cheese25' }
};

/* héros S2 : six vues en pied (poses fixes de repli) ; cycles LTX : marche (profils, face, dos), repos vivant et parole par vue */
export const HERO2 = { l: 's2:hero_pl', r: 's2:hero_pr', ql: 's2:hero_ql', qr: 's2:hero_qr', f: 's2:hero_f', b: 's2:hero_b' };
export const HERO_LIFE = { walk: { r: 'hero_wr', l: 'hero_wl', f: 'hero_wf', b: 'hero_wb' }, idle: { ql: 'hero_iql', qr: 'hero_iqr', f: 'hero_if' }, talk: { ql: 'hero_tql', qr: 'hero_tqr', f: 'hero_tf' } };
export function heroFrame2(g, h, moving, s) {
  if (h.forceSpr) return h.forceSpr;   /* forme imposée par une scène (héros en cubes du chapitre 13) */
  if (moving) {
    const v = h.back || h.quarter === 'qb' ? 'b' : h.front ? 'f' : h.dir === 'l' ? 'l' : 'r', base = HERO_LIFE.walk[v], A = g.s2anim && g.s2anim[base];
    const f = A && g.life(base, Math.floor(h.walkD / ((A.stride || 9) * s))); if (f) return f;
    return v === 'b' ? HERO2.b : v === 'f' ? HERO2.f : HERO2[v];
  }
  const view = h.back ? 'b' : h.front ? 'f' : h.dir === 'l' ? 'ql' : 'qr'; if (view === 'b') return HERO2.b;
  const f = (h.talk && g.lifeAt(HERO_LIFE.talk[view], g.now)) || g.lifeIdle(HERO_LIFE.idle[view], g.now, 1);   /* parle, sinon repos vivant */
  return f || HERO2[view];
}
/* personnages : sprite de base -> boucles LTX (repos vivant, parole) ; anim.json donne le nombre d'images et la cadence */
export const LIFE = {
  's2:guybrush': { idle: 'guybrush_i', talk: 'guybrush_t' }, 's2:swordmaster': { idle: 'swordmaster_i', talk: 'swordmaster_t' },
  's2:lechuck': { idle: 'lechuck2_i', talk: 'lechuck2_t' }, 's2:sheo': { idle: 'sheo_i', talk: 'sheo_t' }, 's2:parrot': { idle: 'parrot_i', talk: 'parrot_t' },
  's2:max': { idle: 'max_i', talk: 'max_t' }, 's2:sam': { idle: 'sam_i', talk: 'sam_t' },
  's2:villager': { idle: 'villager_i', talk: 'villager_t' }, 's2:creeper': { idle: 'creeper_i', walk: 'creeper_w' },
  's2:indy': { idle: 'indy_i', talk: 'indy_t' }, 's2:p_snakes14': { idle: 'snakes14_i' },
  's2:doc': { idle: 'doc_i', talk: 'doc_t' }, 's2:boy15': { idle: 'boy15_i' },
  's2:hat16': { idle: 'hat_i', talk: 'hat_t' }, 's2:potions': { idle: 'potions_i', talk: 'potions_t' }, 's2:bat16': { idle: 'bat16_i' }, 's2:owl16': { idle: 'owl16_i' },
  's2:arthur': { idle: 'arthur_i', talk: 'arthur_t' }, 's2:perceval': { idle: 'perceval_i', talk: 'perceval_t' }, 's2:karadoc': { idle: 'karadoc_i', talk: 'karadoc_t' },
  's2:coconut': { idle: 'coconut_i', talk: 'coconut_t' }, 's2:ni': { idle: 'ni_i', talk: 'ni_t' }, 's2:bk': { idle: 'bk_i', talk: 'bk_t' }, 's2:rabbit17': { idle: 'rabbit17_i' },
  's2:barbarian': { idle: 'barbarian_i', talk: 'barbarian_t' }, 's2:luckdragon': { idle: 'luckdragon_i', talk: 'luckdragon_t' }, 's2:house': { idle: 'house_i', talk: 'house_t' }, 's2:paleo': { idle: 'paleo_i', talk: 'paleo_t' }, 's2:trex': { idle: 'trex_i', talk: 'trex_t' }, 's2:kid': { idle: 'kid_i', talk: 'kid_t' }, 's2:girl': { idle: 'girl_i', talk: 'girl_t' }, 's2:flower': { idle: 'flower_i' }, 's2:redman': { idle: 'redman_i', talk: 'redman_t' }, 's2:loglady': { idle: 'loglady_i', talk: 'loglady_t' }, 's2:agent': { idle: 'agent_i', talk: 'agent_t' }, 's2:dexter': { idle: 'dexter_i', talk: 'dexter_t' }, 's2:sister': { idle: 'sister_i', talk: 'sister_t' }, 's2:morpheus': { idle: 'morph_i', talk: 'morph_t' }, 's2:agentm': { idle: 'agentm_i', talk: 'agentm_t' }, 's2:spoonkid': { idle: 'spoonkid_i' }, 's2:wizard': { idle: 'wizard_i', talk: 'wizard_t' }, 's2:demon': { idle: 'demon_i' }, 's2:halfling': { idle: 'halfling_i', talk: 'halfling_t' }
};
export const lifeBases = sc => [...new Set([...Object.values(HERO_LIFE).flatMap(o => Object.values(o)), ...(sc.ents || []).flatMap(e => Object.values(LIFE[e.spr] || {}))])];
export const PRELOAD = [...Object.values(HERO2), ...Object.values(ITEMS).map(i => i.spr)];

/* ombre de contact (ellipse douce) */
let shadow = null;
export function shadowImg() {
  if (shadow) return shadow; shadow = document.createElement('canvas'); shadow.width = 64; shadow.height = 64; const x = shadow.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(8,6,14,.95)'); g.addColorStop(0.55, 'rgba(8,6,14,.5)'); g.addColorStop(1, 'rgba(8,6,14,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return shadow;
}
/* éclairage d'un sprite par le décor : teinte d'ambiance (multiplication), puis lumière chaude d'une source (lanterne, fenêtre) qui
   frappe le côté tourné vers elle, d'autant plus forte qu'il en est proche ; la transparence d'origine est rétablie à la fin */
export function lit(im, L, e, [a]) {
  const w = im.width, h = im.height; if (a.width !== w || a.height !== h) { a.width = w; a.height = h; }
  const x = a.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, w, h); x.drawImage(im, 0, 0);
  if (L.tint) { x.globalCompositeOperation = 'multiply'; x.globalAlpha = L.k ?? 0.35; x.fillStyle = L.tint; x.fillRect(0, 0, w, h); }
  for (const S of L.lamps || []) {
    const d = Math.hypot(e.x - S.x, (e.y - S.y) * 0.8), f = Math.max(0, 1 - d / S.r); if (f <= 0) continue;
    const toR = S.x > e.x !== !!e.flip, g = x.createLinearGradient(toR ? w : 0, 0, toR ? 0 : w, 0); g.addColorStop(0, S.col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'soft-light'; x.globalAlpha = Math.min(1, f * (S.k ?? 0.8)); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-over';
  return a;
}
/* recoloration d'un sprite : mode « color » (teinte et saturation imposées, luminosité d'origine gardée), transparence rétablie */
export function tinted(im, col, k, b) {
  const w = im.width, h = im.height; if (b.width !== w || b.height !== h) { b.width = w; b.height = h; }
  const x = b.getContext('2d'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, w, h); x.drawImage(im, 0, 0);
  x.globalCompositeOperation = 'color'; x.globalAlpha = k; x.fillStyle = col; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-over';
  return b;
}
/* masque de fondu des bords d'une zone vidéo (edges : côtés à fondre, parmi 'l', 'r', 't', 'b') */
export function featherMask(w, h, f, edges = 'lrtb') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-out';
  const G = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(rx, ry, rw, rh); };
  if (edges.includes('l')) G(0, 0, f, 0, 0, 0, f, h); if (edges.includes('r')) G(w, 0, w - f, 0, w - f, 0, f, h);
  if (edges.includes('t')) G(0, 0, 0, f, 0, 0, w, f); if (edges.includes('b')) G(0, h, 0, h - f, 0, h - f, w, f);
  return c;
}
