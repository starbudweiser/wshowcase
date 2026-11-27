/* Saison 2, chapitre 14 : le temple de l'idole. Réveil sur une dalle piégée (fléchettes) ; la fosse aux serpents barre le chemin de
   l'autel : le Wabbajack en fait des saucisses, le héros traverse en mangeant ; une meule de la besace remplace l'idole au même poids…
   et un rocher dévale du tunnel : le Wabbajack en fait une meule géante, qui l'écrase quand même, mais plus doucement.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle, hit, splinters } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid, tip } from './s2_common.js';

const PIT = [[88, 159], [398, 159], [398, 221], [88, 221]];          /* ouverture de la fosse : serpents et saucisses n'apparaissent que dedans */
const PATH = [[200, 156], [290, 156], [296, 228], [194, 228]];        /* passage à travers la fosse une fois pleine de saucisses */
const CHEESES = ['cheese_nl', 'cheese12', 'cheesecube'];

export default {
  id: 's2_14', hd: true, bg: 's2/d_temple.webp', music: 's2_14_archeo', amb: ['forest', 0.25], steps: 'dirt',
  persp: [140, 0.34, 268, 0.68], walkK: 1.9, blockR: [16, 6],
  /* temple sombre éclairé par deux torches */
  light: { tint: '#c8a888', k: 0.32, lamps: [{ x: 36, y: 30, r: 230, col: '#ffa040', k: 0.85 }, { x: 446, y: 30, r: 230, col: '#ffa040', k: 0.85 }] },
  walk: [[[4, 228], [476, 228], [476, 268], [4, 268]], [[100, 137], [390, 137], [398, 157], [90, 157]]],
  fx: { lights: [{ x: 36, y: 34, r: 30, col: '#ffb040', a: 0.75, fl: 0.45 }, { x: 446, y: 30, r: 30, col: '#ffb040', a: 0.75, fl: 0.45 }], glints: [] },
  start: { x: 234, y: 240, dir: 'r' },
  hot: [
    { id: 's14darts', rect: [76, 96, 116, 110] }, { id: 's14tunnel', rect: [206, 17, 280, 82] }, { id: 's14torch', rect: [0, 10, 50, 170] }, { id: 's14torch', rect: [430, 10, 480, 170] },
    { id: 's14trap', rect: [195, 212, 274, 251], at: [300, 246] }, { id: 's14pit', poly: PIT, at: [244, 232] }, { id: 's14altar', rect: [200, 82, 302, 136], at: [276, 150] }
  ],
  preload: ['s2:p_sausages14', 's2:p_hen14', 's2:p_boulder14', 's2:p_wheel14', 's2:i_dart14', 's2:indy_eel', 's2:indy_horned', 's2:indy_guard'],
  ents: [
    /* la fosse remplie par deux tas à taille réelle (un seul tas agrandi donnait des serpents et des saucisses géants) */
    { id: 'snakes', spr: 's2:p_snakes14', x: 166, y: 232, scale: 1.0, hot: false, noShadow: true, solid: false, clip: PIT, z: -100 },
    { id: 'snakes2', spr: 's2:p_snakes14', x: 322, y: 234, scale: 1.0, hot: false, noShadow: true, solid: false, clip: PIT, z: -101, flip: true, ph: 1.3 },
    { id: 'indy', spr: 's2:indy', x: 330, y: 240, hot: true, at: [296, 246] },
    { id: 'indyhat', x: 330, y: 241, hot: true, hit: [320, 122, 342, 134], solid: false, noShadow: true, at: [296, 246] },
    { id: 'indywhip', x: 330, y: 242, hot: true, hit: [318, 170, 340, 196], solid: false, noShadow: true, at: [296, 246] },
    { id: 'idol', spr: 's2:p_idol14', x: 244, y: 109, scale: 0.36, hot: true, solid: false, noShadow: true, at: [276, 150] },
    { id: 'boulder', spr: 's2:p_boulder14', x: 243, y: 82, scale: 0.4, hot: false, visible: false, noShadow: false, solid: false },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k);
    if (F('sausages')) { for (const id of ['snakes', 'snakes2']) g.ent(id).spr = 's2:p_sausages14'; g.addWalk(PATH.map(p => p.slice())); }
    if (F('idolSwap')) g.ents = g.ents.filter(e => e.id !== 'idol');
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true;
    await g.card('assets/pointclick/s2/cards/r_indiana.webp', g.T('ch.s2_14'));
    const indy = g.ent('indy');
    await g.say('indy', 'c14.wake.1'); g.face(indy.x); await g.say('hero', 'c14.wake.2');
    g.hero.front = false; g.face(150); await this.darts(g); await g.say('narr', 'c14.wake.3'); await g.say('hero', 'c14.wake.4');
    g.face(indy.x); await g.say('indy', 'c14.wake.5'); await g.say('hero', 'c14.wake.6'); await g.say('indy', 'c14.wake.7'); await g.say('hero', 'c14.wake.8');
  },
  /* fléchettes qui jaillissent du mur de gauche… et ratent tout */
  async darts(g) {
    g.sfx('whoosh');
    for (let i = 0; i < 3; i++) { const y = g.hero.y - 30 - i * 14; g.fly('s2:i_dart14', [96, 104 + i * 2], [480, y], 420, 6, 0, 0.5).catch(() => {}); await g.wait(130); }
    await g.wait(500); hit(g, 470, g.hero.y - 40, '#c9965a');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), back = g.hero.y < 190;
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'indy': case 'indyhat': case 'indywhip':
        if (verb === 'talk') { await g.say('indy', 'c14.talk.indy.1'); await g.say('hero', 'c14.talk.indy.2'); return true; }
        if (verb === 'look') { await g.say('hero', id === 'indyhat' ? 'c14.look.hat' : id === 'indywhip' ? 'c14.look.whip' : 'look.indy'); return true; }
        break;
      case 's14pit':
        if (verb === 'look') {
          if (F('sausages')) { await g.say('hero', 'look.s14pitsaus'); return true; }
          await g.say('hero', 'c14.look.pit'); if (!F('pitTalk')) { g.set('pitTalk'); g.face(g.ent('indy').x); await g.say('indy', 'c14.pit.indy'); await g.say('hero', 'c14.pit.hero'); } return true;
        }
        if (verb === 'use' || verb === 'walk') {
          if (!F('sausages')) { await g.say('hero', 's14.pit.first'); return true; }
          await g.cut(async () => { await g.walkTo(back ? 244 : 244, back ? 232 : 150); await g.say('hero', 's14.cross'); }); return true;
        }
        break;
      case 's14altar': case 'idol':
        if (!back && !F('sausages')) { await g.say('hero', 's14.pit.first'); return true; }
        if (verb === 'look') { await g.say('hero', 'c14.look.idol'); if (!F('idolTalk')) { g.set('idolTalk'); await g.say('indy', 'c14.idol.indy'); } return true; }
        if (verb === 'use' && item && CHEESES.includes(item) && g.ent('idol')) {   /* pas sur l'idole déjà dans la besace */ await g.cut(() => this.swap(g, item)); return true; }
        if (verb === 'use' && item === 'idol') { await g.say('hero', 'def.useWith'); return true; }
        if ((verb === 'take' || verb === 'use') && !item && id === 'idol') { await g.say('hero', 'c14.look.idol'); await g.say('indy', 'c14.idol.indy'); return true; }
        break;
      case 'boulder':
        if (verb === 'look') { await g.say('narr', 'c14.boulder.narr'); return true; }
        break;
      case 's14trap': if (verb === 'use' || verb === 'walk') { await g.say('hero', 'use.s14trap'); return true; } break;
    }
    return false;
  },

  /* une meule de la besace sur le socle, pile le poids de l'idole… et le rocher dévale */
  async swap(g, cheese) {
    const I = g.ent('idol'), B = g.ent('boulder'), h = g.hero; g.face(I.x);
    await g.say('hero', 'c14.use.cheese.1'); g.drop(cheese); twinkle(g, I.x, I.y - 6, '#ffd166');
    g.ents = g.ents.filter(e => e !== I); g.give('idol'); g.set('idolSwap'); await g.say('indy', 'c14.use.cheese.2');
    await g.wait(500); g.shake(900, 3); g.sfx('clang'); await g.say('indy', 'c14.use.cheese.3');
    /* le rocher sort du tunnel, dévale les marches ; le héros fuit à travers la fosse jusqu'à l'avant-scène */
    B.visible = true; B.x = 243; B.y = 82; B.scale = 0.36; B.rot = 0;
    const roll = (x1, y1, ms) => { const x0 = B.x, y0 = B.y, s0 = B.scale, t0 = g.now; return g.until(() => { const u = Math.min(1, (g.now - t0) / (ms / 1000)); B.x = x0 + (x1 - x0) * u; B.y = y0 + (y1 - y0) * u; B.scale = g.persp(B.y) * 1.6; B.rot -= 0.12;   /* plus haut que le héros */ return u >= 1; }); };
    g.say('narr', 'c14.boulder.narr').catch(() => {});
    const run = g.walkTo(244, 248); await roll(243, 150, 1400); await run; g.chk();
    await roll(243, 222, 900); g.shake(400, 3); B.hot = true; g.set('boulder');
    g.face(B.x); await g.say('hero', 'c14.boulder.hero');
  },

  async wab(g, id) {
    const e = g.ent(id), indy = g.ent('indy');
    switch (id) {
      case 's14pit': {   /* les serpents deviennent des saucisses : il traverse en mangeant */
        if (g.flag('sausages')) break;
        await zap(g, 243, 196, { from: tip(g), peak: () => { for (const id2 of ['snakes', 'snakes2']) g.ent(id2).spr = 's2:p_sausages14'; }, cols: ['#ff9a5a', '#ffd166', '#ffffff'] }); g.chk();
        g.set('sausages'); g.addWalk(PATH.map(p => p.slice()));
        await g.say('hero', 'c14.wab.snakes.1'); await g.walkTo(244, 150); await g.say('indy', 'c14.wab.snakes.2'); await g.say('narr', 'c14.wab.snakes.narr'); return;
      }
      case 'boulder': {   /* une meule géante… qui l'écrase quand même */
        if (!g.flag('boulder')) break; const h = g.hero;
        await zap(g, ...mid(g, e), { from: tip(g), peak: () => { e.spr = 's2:p_wheel14'; }, cols: ['#ffd166', '#fff1b0', '#ffffff'] }); g.chk();
        await g.say('hero', 'c14.wab.boulder.1');
        const x0 = e.x, y0 = e.y, t0 = g.now; await g.until(() => { const u = Math.min(1, (g.now - t0) / 0.7); e.x = x0 + (h.x - x0) * u; e.y = y0 + (h.y + 2 - y0) * u; e.scale = g.persp(e.y) * 1.6; e.rot = (e.rot || 0) - 0.15; return u >= 1; });
        e.rot = 0; h.visible = false; g.shake(500, 4); splinters(g, h.x, h.y - 4, 12); g.sfx('clang');
        await g.say('hero', 'c14.wab.boulder.2'); await g.say('indy', 'c14.wab.boulder.indy'); await g.say('hero', 'c14.wab.boulder.hero2');
        await zap(g, h.x, h.y - 30, { peak: () => { e.visible = false; e.hot = false; h.visible = true; h.front = true; }, cols: ['#ffd166', '#fff1b0'] }); g.chk();
        twinkle(g, h.x, h.y - 40, '#ffd166'); g.give('cheese14'); await g.say('narr', 'c14.wab.boulder.narr');
        /* l'idole : chacun son musée */
        g.face(indy.x); await g.say('indy', 'c14.gag.1'); await g.say('hero', 'c14.gag.2'); g.drop('idol'); await g.say('hero', 'c14.gag.3'); await g.say('indy', 'c14.gag.indy');
        await g.say('hero', 'c14.end.hero'); await g.say('narr', 'c14.end.narr');
        await g.fade(1, 1200); nextChapter(g, 's2_14'); return;
      }
      case 'indywhip': await wabSwap(g, indy, 's2:indy_eel', [['indy', 'c14.wk.whip.1'], ['hero', 'c14.wk.whip.2']], 's14.wk.back'); return;
      case 'indyhat': await wabSwap(g, indy, 's2:indy_horned', [['indy', 'c14.wk.hat.1'], ['hero', 'c14.wk.hat.2']], null); return;
      case 'indy': await wabSwap(g, indy, 's2:indy_guard', [['indy', 'c14.wk.indy.1'], ['indy', 'c14.wk.indy.2'], ['hero', 'c14.wk.indy.hero']], 's14.wk.back'); return;
      case 'idol': {   /* une poule dorée qui s'envole… et revient en idole */
        if (!e) break; const p0 = [e.x, e.y - 8];
        await zap(g, ...p0, { from: tip(g), peak: () => { e.visible = false; }, cols: ['#ffd166', '#fff1b0', '#ffffff'] }); g.chk();
        g.sfx('whoosh'); await g.fly('s2:p_hen14', p0, [120, -30], 1100, 20, 0, 0.3); g.chk();
        await g.say('indy', 'c14.wk.idol.1'); await g.say('hero', 'c14.wk.idol.2'); await sheoPops(g, 'c14.wk.idol.sheo');
        await g.fly('s2:p_hen14', [120, -30], p0, 900, -10, 0, 0.3); g.chk();
        await zap(g, ...p0, { peak: () => { e.visible = true; } }); g.chk(); await g.say('hero', 's14.wk.back'); return;
      }
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
