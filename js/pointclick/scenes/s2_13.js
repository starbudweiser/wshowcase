/* Saison 2, chapitre 13 (1/2) : le monde en cubes, au pied de la tour. La meule cubique est murée en haut de la tour : un bloc de bois
   (arbre frappé à mains nues) attire la créature verte jusqu'au mur, qui saute avec elle ; rond, le héros glisse sur l'escalier de
   blocs : le Wabbajack le rend cubique trois secondes, le temps de monter (s2_13b). Retour par le saut, amorti par le seau d'eau.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, confetti, shout, explode, splash, twinkle } from '../engine/fx2.js';
import { wabZap, sheoPops, nextChapter, mid, tip } from './s2_common.js';
import { HERO2 } from '../data/sheets_s2.js';

const SHEEP = ['#ff5a5a', '#5a8cff', '#58d36a', '#ffd84a', '#c46bff', '#ff9a3c'];

export default {
  id: 's2_13', hd: true, bg: 's2/d_mine_a.webp', music: 's2_13_blocs', amb: ['forest', 0.3], steps: 'dirt',
  persp: [160, 0.33, 268, 0.66], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#fff0c8', k: 0.1 },
  walk: [[[10, 170], [95, 165], [95, 224], [196, 224], [196, 165], [322, 158], [326, 206], [478, 212], [478, 268], [10, 268]]],
  start: { x: 150, y: 248, dir: 'r' },
  /* cascade et soleil carré qui scintillent */
  fx: { glints: [{ rect: [272, 100, 320, 150], n: 10, col: '#e8f6ff', s: 2.2 }], lights: [{ x: 128, y: 27, r: 34, col: '#fff2a0', a: 0.35, fl: 0, breathe: 1.1 }] },
  hot: [
    { id: 's13tree', rect: [0, 26, 90, 144], at: [70, 200], dir: 'l' }, { id: 's13sun', rect: [110, 10, 146, 42] }, { id: 's13fall', rect: [268, 90, 322, 154] },
    { id: 's13dirt', rect: [246, 100, 270, 136] }, { id: 's13well', rect: [99, 160, 191, 219], at: [146, 236] },
    { id: 's13door', rect: [356, 94, 431, 189], at: [394, 214] }
  ],
  preload: ['s2:hero_cube', 's2:p_doorway13', 's2:p_sunround13', 's2:p_puddle13'],
  ents: [
    { id: 'villager', spr: 's2:villager', x: 236, y: 214, hot: true, at: [204, 232] },
    { id: 'creeper', spr: 's2:creeper', x: 58, y: 230, hot: true, at: [96, 238], rawSpeed: true },
    { id: 'sheep', spr: 's2:p_sheep13', x: 284, y: 172, scale: 0.48, hot: true, solid: false, flip: true },
    { id: 'bucket13', spr: 's2:i_waterbucket13', x: 116, y: 170, z: 60, scale: 0.4, hot: true, solid: false, noShadow: true, at: [100, 236], name: 'n.waterbucket13' },
    { id: 'doorway', spr: 's2:p_doorway13', x: 394, y: 192, scale: 0.66, hot: false, visible: false, noShadow: true, solid: false },
    { id: 'sunround', spr: 's2:p_sunround13', x: 128, y: 43, scale: 0.38, hot: false, visible: false, noShadow: true, noLight: true, solid: false },
    { id: 'puddle', spr: 's2:p_puddle13', x: 246, y: 254, scale: 0.5, hot: false, visible: false, noShadow: true, solid: false },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 230, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('wallOpen')) { g.ent('doorway').visible = true; g.ents = g.ents.filter(e => e.id !== 'creeper'); }
    if (F('bucketTaken')) g.ents = g.ents.filter(e => e.id !== 'bucket13');
    if (how.fall) { g.hero.visible = false; g.ent('puddle').visible = false; }
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g, how) {
    if (how.fall) return this.fall(g);
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_minecraft.webp', g.T('ch.s2_13'));
    const v = g.ent('villager');
    await g.say('villager', 'c13.wake.1'); g.face(v.x); await g.say('hero', 'c13.wake.2'); await g.say('narr', 'c13.wake.3');
    await g.say('hero', 'c13.wake.4'); await g.say('villager', 'c13.wake.5'); g.face(394, 60); await g.say('hero', 'c13.look.tower');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'villager':
        if (verb === 'talk') { await g.say('hero', 'c13.talk.villager.1'); await g.say('villager', 'c13.talk.villager.2'); await g.say('hero', 'c13.talk.villager.3'); return true; }
        if (verb === 'use' && item === 'septims') { await g.say('hero', 'c13.use.septims.bad'); await g.say('villager', 'c13.use.septims.bad.v'); await g.say('hero', 'c13.use.septims.bad.hero'); return true; }
        break;
      case 'creeper':
        if (verb === 'look') { await g.say('hero', 'c13.look.creeper'); return true; }
        if (verb === 'talk') { await g.cut(async () => { g.shake(200, 1); await g.say('creeper', 'c13.talk.creeper.1'); g.hero.path = []; await g.walkTo(Math.min(g.hero.x + 40, 300), 248); g.face(e.x); await g.say('hero', 'c13.talk.creeper.2'); }); return true; }
        if (verb === 'use' && item === 'wood13') { await g.cut(() => this.blast(g)); return true; }
        break;
      case 's13tree':
        if (verb === 'look') { await g.say('hero', 'c13.look.tree'); return true; }
        if ((verb === 'use' || verb === 'take') && !item) {
          if (g.has('wood13') || F('wallOpen')) { await g.say('hero', 'c13.use.tree.1'); return true; }
          await g.cut(async () => { for (let i = 0; i < 3; i++) { g.sfx('clang'); g.shake(150, 2); await g.wait(260); } twinkle(g, 56, 150, '#c99b5a'); g.sfx('pop'); g.give('wood13'); await g.say('hero', 'c13.use.tree.1'); });
          return true;
        }
        break;
      case 'bucket13': case 's13well':
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (F('bucketTaken')) break; const b = g.ent('bucket13');
          if (b) { twinkle(g, b.x, b.y - 8, '#9ad8ff'); g.ents = g.ents.filter(x => x !== b); }
          g.set('bucketTaken'); g.sfx('pop'); g.give('waterbucket13'); await g.say('hero', 'c13.look.waterbucket'); await g.say('hero', 's13.take.bucket'); return true;
        }
        if (verb === 'look' && id === 'bucket13') { await g.say('hero', 'c13.look.waterbucket'); return true; }
        break;
      case 's13door':
        if (F('wallOpen')) {
          if (verb === 'look') { await g.say('hero', 'c13.look.stairs'); return true; }
          if (verb === 'use' || verb === 'walk') { await g.cut(() => this.slip(g)); return true; }
          break;
        }
        if (verb === 'use' && item === 'shout') { await g.cut(async () => { const h = g.hero; shout(g, h.x + 14, h.y - 50, 1); g.shake(400, 3); await g.say('hero', 'c13.use.shout.bad'); }); return true; }
        break;
    }
    return false;
  },

  /* la créature suit le bloc de bois jusqu'au mur, qui saute avec elle */
  async blast(g) {
    const c = g.ent('creeper'), h = g.hero; g.face(c.x);
    await g.say('hero', 'c13.use.wood.1'); g.drop('wood13');
    const follow = g.walkEnt('creeper', 362, 204, 34); await g.walkTo(398, 214); g.face(c.x);
    await g.say('creeper', 'c13.use.wood.2'); await follow; g.face(c.x);
    await g.say('hero', 'c13.use.wood.3'); await g.walkTo(232, 252); g.face(c.x);
    const t0 = g.now; await g.until(() => { const u = (g.now - t0) / 1.4; c.kz = 1 + 0.18 * u + 0.05 * Math.sin(u * 40); c.tint = u > 0.5 && Math.floor(u * 12) % 2 ? '#ffffff' : null; c.tintK = 0.55; return u >= 1; }); g.chk();
    explode(g, 380, 176); c.visible = false; c.hot = false; g.ent('doorway').visible = true; g.set('wallOpen');
    await g.wait(1200); g.ents = g.ents.filter(x => x !== c);
    await g.say('narr', 'c13.use.wood.narr');
  },

  /* rond, il glisse sur les marches carrées */
  async slip(g) {
    const h = g.hero; await g.walkTo(394, 200); h.back = true; await g.wait(300); g.sfx('whoosh');
    const y0 = h.y; await g.until(() => { h.y = Math.min(214, h.y + 1.6); return h.y >= 214; }); h.back = false; h.front = true; g.shake(200, 2);
    await g.say('hero', 'c13.use.stairs.bad'); await g.say('narr', 'c13.use.stairs.narr'); h.y = Math.max(y0, 214);
  },

  async wab(g, id) {
    const e = g.ent(id), h = g.hero;
    switch (id) {
      case 'hero': {   /* cubique trois secondes, juste le temps de monter */
        if (!g.flag('wallOpen')) { await g.say('hero', 'wab.self'); return; }
        await g.walkTo(394, 214); g.face(394);
        await zap(g, h.x, h.y - 45, { peak: () => { h.forceSpr = 's2:hero_cube'; } }); g.chk();
        await g.say('hero', 'c13.wab.hero.1');
        await g.walkTo(394, 196); h.back = true;
        const t0 = g.now; await g.until(() => { const u = (g.now - t0) / 1.2; h.alpha = Math.max(0, 1 - u); h.y = 196 - 10 * u; h.bob = Math.abs(Math.sin(u * 12)) * 3; return u >= 1; });
        setTimeout(() => g.goScene('s2_13b', { intro: true, cube: true }), 0); return;
      }
      case 'creeper': {   /* elle explose en confettis… et revient */
        await wabZap(g, e, null); await g.say('creeper', 'c13.wk.creeper.1'); const [cx, cy] = mid(g, e);
        confetti(g, cx, cy, 80); g.sfx('pop'); e.visible = false; await g.say('hero', 'c13.wk.creeper.2'); await g.wait(900);
        await zap(g, cx, cy, { peak: () => { e.visible = true; }, cols: ['#58d36a', '#b6ff7d', '#ffffff'] }); g.chk(); await g.say('hero', 's13.creeper.back'); return;
      }
      case 'villager': await wabZap(g, e, null); shout(g, e.x - 8, e.y - 70, h.x < e.x ? -1 : 1); g.shake(500, 3); await g.say('villager', 'c13.wk.villager.1'); await g.say('hero', 'c13.wk.villager.2'); return;
      case 's13sun': {   /* le soleil devient rond : tout le monde est choqué */
        const S = g.ent('sunround'); g.face(128, 30); await zap(g, 128, 27, { from: tip(g), peak: () => { S.visible = true; }, cols: ['#fff2a0', '#ffd166', '#ffffff'] }); g.chk();
        await g.say('villager', 'c13.wk.sun.1'); await g.say('hero', 'c13.wk.sun.2'); await g.wait(400);
        await zap(g, 128, 27, { peak: () => { S.visible = false; }, cols: ['#fff2a0', '#ffd166'] }); g.chk(); await g.say('hero', 's13.wk.back'); return;
      }
      case 'sheep': {   /* une couleur à chaque coup */
        const n = g.count('sheepWab'); await wabZap(g, e, () => { e.tint = SHEEP[(n - 1) % SHEEP.length]; }); g.sfx('pop');
        await g.say('hero', 'c13.wk.sheep.1'); if (n === 1) await g.say('narr', 'c13.wk.sheep.2'); return;
      }
      case 's13dirt': {   /* tout le paysage en fromage, trois secondes de paradis */
        const bg = g.bg, ch = await g.img(g.bgPath({ hd: true, bg: 's2/d_mine_cheese.webp' })); g.face(258, 118);
        await zap(g, 258, 118, { from: tip(g), peak: () => { if (ch) g.bg = ch; }, cols: ['#ffd166', '#fff1b0', '#f4b942'] }); g.chk();
        await g.say('hero', 'c13.wk.dirt.1'); await sheoPops(g, 'c13.wk.dirt.sheo');
        await zap(g, 258, 118, { peak: () => { g.bg = bg; }, cols: ['#ffd166', '#fff1b0'] }); g.chk(); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* retour du haut de la tour : la chute, le seau d'eau versé à temps, la flaque */
  async fall(g) {
    const h = g.hero, P = g.ent('puddle'); h.x = 246; h.y = 254; h.front = true; await g.fade(0, 500);
    g.cinePos = { hero: [246, 70] };
    const fly = g.fly(HERO2.f, [246, -90], [246, 254], 1300, 0, 0.4, g.persp(254));
    await g.wait(550); await g.say('hero', 'c13.use.water.1'); P.visible = true; splash(g, 246, 254);
    await fly; splash(g, 246, 254); g.shake(300, 2); h.visible = true; g.cinePos = null; g.drop('waterbucket13');
    await g.say('hero', 'c13.use.water.2');
    await g.say('hero', 'c13.gag'); g.face(g.ent('villager').x); await g.say('villager', 'c13.gag.v'); await g.say('hero', 'c13.gag.hero');
    await g.say('hero', 'c13.end.hero'); await g.say('villager', 'c13.end.villager'); await g.say('narr', 'c13.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_13');
  }
};
