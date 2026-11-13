/* Sprites (assets/pointclick/spr/<fichier>.png, déjà à la taille du jeu : ils se dessinent à l'échelle de perspective) et objets d'inventaire.
   ANIM : animation par images, choisie selon l'état du personnage (idle = repos, talk = parle, walk = se déplace). `fps` = images par seconde. */
const f = (n, files) => files.forEach(x => (SPR[n + '.' + x] = n + '_' + x));
export const SPR = {
  'hero.front': 'hero_front', 'bucket': 'bucket', 'honey': 'honey', 'merchant': 'merchant', 'merchant.bucket': 'merchant_bucket',
  'guard': 'guard', 'hen': 'hen', 'horse': 'horse', 'horse.ride': 'horse_ride', 'carrot': 'carrot', 'cheese': 'cheese',
  'dragon.up': 'dragon_up', 'dragon.down': 'dragon_down', 'dragon.mid1': 'dragon_mid1', 'dragon.mid2': 'dragon_mid2',
  'bird.1': 'bird_1', 'bird.2': 'bird_2', 'bird.3': 'bird_3', 'puff': 'puff', 'fish': 'fish', 'hand.palm': 'hand_palm', 'hand.rag': 'hand_rag', 'hand.leaf': 'hand_leaf', 'hand.duster': 'hand_duster', 'hand.sleeve': 'hand_sleeve', 'hand.finger': 'hand_finger', 'hand.breath': 'hand_breath',
  'giant': 'giant', 'giant.swing': 'giant_swing', 'nazim': 'nazim',
  'blind.pot': 'blind_pot', 'blind.sack': 'blind_sack', 'blind.hat': 'blind_hat', 'lit.pot': 'lit_pot', 'lit.sack': 'lit_sack', 'lit.hat': 'lit_hat',
  /* scènes 4 à 10 */
  'farmer': 'farmer', 'cart': 'cart', 'cabbage': 'cabbage', 'arrow': 'arrow', 'mannequin': 'mannequin', 'horseman': 'horseman', 'horseman.pumpkin': 'horseman_pumpkin', 'pumpkin': 'pumpkin',
  'butterfly': 'butterfly', 'butterfly.2': 'butterfly2', 'follower': 'follower', 'anvil': 'anvil', 'cake': 'cake', 'cake.lit': 'cake_lit',
  'blind.cabbage': 'blind_cabbage', 'lit.cabbage': 'lit_cabbage', 'blind.helmet': 'blind_helmet', 'lit.helmet': 'lit_helmet', 'blind.basket': 'blind_basket', 'lit.basket': 'lit_basket',
  'blind.boot': 'blind_boot', 'lit.boot': 'lit_boot', 'blind.mushroom': 'blind_mushroom', 'lit.mushroom': 'lit_mushroom', 'blind.banner': 'blind_banner', 'lit.banner': 'lit_banner',
  'blind.partyhat': 'blind_partyhat', 'lit.partyhat': 'lit_partyhat'
};
f('hero', ['walkA', 'walkP', 'walkB', 'stand', 'talk', 'idle2']); f('merchant', ['idle2', 'talk1', 'talk2']); f('guard', ['idle2', 'talk', 'walkA', 'walkB']);
f('hen', ['peck', 'walk']); f('horse', ['idle2', 'walkA', 'walkB']); f('giant', ['idle2', 'talk', 'walkA', 'walkB']); f('nazim', ['idle2', 'talk']);
f('blind', ['pot2', 'sack2', 'hat2']); f('lit', ['pot2', 'sack2', 'hat2']);

['frost', 'ember', 'moss', 'gold'].forEach(k => ['up', 'mid1', 'down', 'mid2'].forEach(q => (SPR[k + '.' + q] = 'dragon_' + k + '_' + q)));   /* dragons d'autres espèces (tools/gen_dragons.sh) */
/* clins d'œil (tools/gen_winks.sh) : deux images par personnage */
const WK = ['explorer', 'buster', 'kids', 'barbarian', 'wizard', 'halfling', 'handyman', 'simon', 'pirate', 'graham', 'agent', 'arthur', 'lancelot', 'merlin', 'karadoc', 'perceval', 'mevanwi', 'guenievre', 'leodagan', 'seli', 'tavernier', 'guethenoc', 'roparzh'];
WK.forEach(k => { SPR['wk.' + k] = 'wk_' + k + '_a'; SPR['wk.' + k + '.b'] = 'wk_' + k + '_b'; });
Object.assign(SPR, { 'wk.boulder': 'wk_boulder', 'wk.ghost': 'wk_ghost_a', 'wk.ghost.b': 'wk_ghost_b', 'wk.racer': 'wk_racer_a', 'wk.racer.b': 'wk_racer_b', 'wk.tentacle': 'wk_tentacle_a', 'wk.tentacle.b': 'wk_tentacle_b',
  'wk.owl': 'wk_owl_a', 'wk.owl.b': 'wk_owl_b', 'wk.owl.f': 'wk_owl_f', 'wk.troll': 'wk_troll_a', 'wk.troll.b': 'wk_troll_b', 'wk.horsearmor': 'wk_horsearmor' });
const NEWB = ['cabbage', 'helmet', 'basket', 'boot', 'mushroom', 'banner', 'partyhat'];
NEWB.forEach(k => { SPR['blind.' + k + '2'] = 'blind_' + k + '2'; SPR['lit.' + k + '2'] = 'lit_' + k + '2'; });
export const ANIM = {
  'merchant': { idle: ['merchant', 'merchant.idle2'], talk: ['merchant.talk1', 'merchant.talk2', 'merchant'], fps: { idle: 0.7, talk: 6 } },
  'guard': { idle: ['guard', 'guard.idle2'], talk: ['guard', 'guard.talk'], walk: ['guard.walkA', 'guard', 'guard.walkB', 'guard'], fps: { idle: 0.5, talk: 6, walk: 5 } },
  'hen': { idle: ['hen', 'hen.peck'], walk: ['hen.walk', 'hen'], fps: { idle: 1.1, walk: 6 } },
  'horse': { idle: ['horse', 'horse.idle2'], walk: ['horse.walkA', 'horse', 'horse.walkB', 'horse'], fps: { idle: 0.5, walk: 5 } },
  'giant': { idle: ['giant', 'giant.idle2'], talk: ['giant.talk', 'giant'], walk: ['giant.walkA', 'giant', 'giant.walkB', 'giant'], fps: { idle: 0.45, talk: 6, walk: 3 } },
  'nazim': { idle: ['nazim', 'nazim.idle2'], talk: ['nazim.talk', 'nazim'], fps: { idle: 0.5, talk: 6 } },
  'blind.pot': { idle: ['blind.pot', 'blind.pot2'], fps: { idle: 1.6 } }, 'blind.sack': { idle: ['blind.sack', 'blind.sack2'], fps: { idle: 1.6 } }, 'blind.hat': { idle: ['blind.hat', 'blind.hat2'], fps: { idle: 1.6 } },
  'lit.pot': { idle: ['lit.pot', 'lit.pot2'], walk: ['lit.pot', 'lit.pot2'], fps: { idle: 5, walk: 6 } },
  'lit.sack': { idle: ['lit.sack', 'lit.sack2'], walk: ['lit.sack', 'lit.sack2'], fps: { idle: 5, walk: 6 } },
  'lit.hat': { idle: ['lit.hat', 'lit.hat2'], walk: ['lit.hat', 'lit.hat2'], fps: { idle: 5, walk: 6 } }
};
WK.forEach(k => { ANIM['wk.' + k] = { idle: ['wk.' + k], walk: ['wk.' + k, 'wk.' + k + '.b'], fps: { idle: 1, walk: 6 } }; });
Object.assign(ANIM, { 'wk.ghost': { idle: ['wk.ghost', 'wk.ghost.b'], walk: ['wk.ghost', 'wk.ghost.b'], fps: { idle: 3, walk: 3 } }, 'wk.racer': { idle: ['wk.racer', 'wk.racer.b'], walk: ['wk.racer', 'wk.racer.b'], fps: { idle: 8, walk: 8 } },
  'wk.tentacle': { idle: ['wk.tentacle'], walk: ['wk.tentacle', 'wk.tentacle.b'], fps: { idle: 1, walk: 5 } }, 'wk.owl': { idle: ['wk.owl', 'wk.owl.b'], walk: ['wk.owl', 'wk.owl.b'], fps: { idle: 6, walk: 6 } },
  'wk.troll': { idle: ['wk.troll', 'wk.troll.b'], walk: ['wk.troll', 'wk.troll.b'], fps: { idle: 2, walk: 2 } } });
NEWB.forEach(k => {
  ANIM['blind.' + k] = { idle: ['blind.' + k, 'blind.' + k + '2'], fps: { idle: 1.6 } };
  ANIM['lit.' + k] = { idle: ['lit.' + k, 'lit.' + k + '2'], walk: ['lit.' + k, 'lit.' + k + '2'], fps: { idle: 5, walk: 6 } };
});
/* le héros : marche en 4 temps, debout de profil, face (repos / parole) */
/* animations détaillées du héros (tools/gen_hero.sh) : marche de profil en 8 phases, de face, de dos, parole, gestes, portrait ; repli sur les anciennes images si une manque */
['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'sIdle', 'sTalk1', 'sTalk2', 'sReach', 'sPick', 'fWalkA', 'fWalkP', 'fWalkB', 'fBlink', 'fTalk2', 'fShrug', 'fSurprise', 'bStand', 'bWalkA', 'bWalkB', 'pNeutral', 'pTalk', 'pBlink', 'pSleepy', 'pKnock1', 'pKnock2', 'pPoint', 'pPointT', 'pShrug', 'pShrugT', 'pPlead', 'pPleadT', 'pThink', 'pThinkT', 'pWave', 'pWaveT', 'pLean', 'pLeanT'].forEach(k => (SPR['hero.' + k] = 'hero_' + k));
export const HERO = {
  walk: ['hero.w1', 'hero.w2', 'hero.w3', 'hero.w4', 'hero.w5', 'hero.w6', 'hero.w7', 'hero.w8'], walkOld: ['hero.walkA', 'hero.walkP', 'hero.walkB', 'hero.walkP'],
  walkF: ['hero.fWalkA', 'hero.fWalkP', 'hero.fWalkB', 'hero.fWalkP'], walkB: ['hero.bWalkA', 'hero.bStand', 'hero.bWalkB', 'hero.bStand'],
  stand: 'hero.stand', standB: 'hero.bStand', idleSide: ['hero.stand', 'hero.sIdle'], talkSide: ['hero.sTalk1', 'hero.sTalk2', 'hero.sTalk1', 'hero.stand'],
  idleFront: ['hero.front', 'hero.idle2'], talk: ['hero.front', 'hero.talk', 'hero.fTalk2', 'hero.talk'], blink: 'hero.fBlink',
  portrait: { neutral: 'hero.pNeutral', talk: 'hero.pTalk', blink: 'hero.pBlink', sleepy: 'hero.pSleepy' }
};
export const ITEMS = { bucket: { spr: 'bucket' }, honey: { spr: 'honey' }, carrot: { spr: 'carrot' }, cheese: { spr: 'cheese' }, cabbage: { spr: 'cabbage' }, arrow: { spr: 'arrow' }, pumpkin: { spr: 'pumpkin' }, anvil: { spr: 'anvil' } };
