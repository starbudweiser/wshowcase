/* Sprites (assets/pointclick/spr/<fichier>.png, déjà à la taille du jeu : ils se dessinent à l'échelle de perspective) et objets d'inventaire.
   ANIM : animation par images, choisie selon l'état du personnage (idle = repos, talk = parle, walk = se déplace). `fps` = images par seconde. */
const f = (n, files) => files.forEach(x => (SPR[n + '.' + x] = n + '_' + x));
export const SPR = {
  'hero.front': 'hero_front', 'bucket': 'bucket', 'honey': 'honey', 'merchant': 'merchant', 'merchant.bucket': 'merchant_bucket',
  'guard': 'guard', 'hen': 'hen', 'horse': 'horse', 'horse.ride': 'horse_ride', 'carrot': 'carrot', 'cheese': 'cheese',
  'dragon.up': 'dragon_up', 'dragon.down': 'dragon_down', 'dragon.mid1': 'dragon_mid1', 'dragon.mid2': 'dragon_mid2',
  'bird.1': 'bird_1', 'bird.2': 'bird_2', 'bird.3': 'bird_3', 'puff': 'puff',
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
NEWB.forEach(k => {
  ANIM['blind.' + k] = { idle: ['blind.' + k, 'blind.' + k + '2'], fps: { idle: 1.6 } };
  ANIM['lit.' + k] = { idle: ['lit.' + k, 'lit.' + k + '2'], walk: ['lit.' + k, 'lit.' + k + '2'], fps: { idle: 5, walk: 6 } };
});
/* le héros : marche en 4 temps, debout de profil, face (repos / parole) */
export const HERO = { walk: ['hero.walkA', 'hero.walkP', 'hero.walkB', 'hero.walkP'], stand: 'hero.stand', idleFront: ['hero.front', 'hero.idle2'], talk: ['hero.front', 'hero.talk'] };
export const ITEMS = { bucket: { spr: 'bucket' }, honey: { spr: 'honey' }, carrot: { spr: 'carrot' }, cheese: { spr: 'cheese' }, cabbage: { spr: 'cabbage' }, arrow: { spr: 'arrow' }, pumpkin: { spr: 'pumpkin' }, anvil: { spr: 'anvil' } };
