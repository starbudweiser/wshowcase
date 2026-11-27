/* Saison 2, chapitre 12 (2/2) : l'attraction au bord de la route. Le socle est vide ; la meule a roulé derrière la pelote de ficelle
   géante, avec le lapin dedans, qui la mange. Une brioche sucrée (échoppe de souvenirs) contre un morceau : affaire résolue.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, nextChapter, mid, tip } from './s2_common.js';

/* pelote géante et son socle de béton, en avant-plan de ce qui est derrière (la meule) */
const BALL = (() => { const p = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; p.push([247 + Math.cos(a) * 54, 66 + Math.sin(a) * 52]); } return [...p, [301, 66], [304, 106], [304, 126], [186, 126], [189, 106], [193, 66]]; })();

export default {
  id: 's2_12b', hd: true, bg: 's2/d_sammax_b.webp', music: 's2_12_detectives', amb: ['desert', 0.35], steps: 'dirt',
  persp: [135, 0.33, 270, 0.62], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffe2b8', k: 0.14 },
  walk: [[[238, 132], [328, 134], [398, 146], [478, 156], [478, 268], [4, 268], [4, 204], [238, 200]]],
  fg: [{ y: 126, polys: [BALL] }],
  start: { x: 196, y: 236, dir: 'r' },
  hot: [
    { id: 's12sign', rect: [30, 8, 186, 128] }, { id: 's12stand', rect: [15, 128, 232, 195], at: [200, 208], dir: 'l' },
    { id: 's12twine', rect: [192, 14, 302, 112], at: [252, 150] }, { id: 's12shack', rect: [369, 62, 480, 154], at: [420, 172] },
    { id: 's12fence', rect: [330, 109, 368, 142] }, { id: 's12road', rect: [0, 96, 190, 118] }, { id: 's12hills', rect: [190, 70, 370, 92] }
  ],
  preload: ['s2:p_twinebuckets', 's2:sam_wolf', 's2:max'],
  ents: [
    { id: 's12cart', spr: 's2:p_cart12', x: 82, y: 252, hot: true, at: [150, 252], block: [60, 7], name: 'n.s12cart' },
    { id: 'sam', spr: 's2:sam', x: 300, y: 214, hot: true, at: [262, 226] },
    { id: 'cheesegiant', spr: 's2:p_cheesegiant', x: 302, y: 121, hot: true, at: [318, 150] },   /* à moitié cachée derrière la pelote */
    { id: 'buckets', spr: 's2:p_twinebuckets', x: 246, y: 127, scale: 0.64, visible: false, hot: false, noShadow: true },
    { id: 'max', spr: 's2:max', x: 350, y: 156, hot: false, visible: false }
  ],

  async enter(g, how) {
    if (g.flag('traded')) { const m = g.ent('max'); m.visible = true; m.hot = true; g.cinePos = null; }
    else g.cinePos = { max: [312, 70] };   /* le lapin parle de l'intérieur de la meule */
    if (how.intro) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
  },
  async intro(g) {
    g.hero.front = true; await g.fade(0, 900);
    await g.say('hero', 'c12.road.hero'); g.face(g.ent('sam').x); await g.say('sam', 'c12.missing.sam');
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id);
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 's12stand':
        if (verb === 'look') { await g.say('hero', 'c12.look.stand.1'); if (!F('standSeen')) { g.set('standSeen'); await g.say('sam', 'c12.look.stand.2'); } return true; }
        break;
      case 's12sign': if (verb === 'look') { await g.say('hero', 'look.s12sign'); return true; } break;
      case 's12twine': if (verb === 'look') { await g.say('hero', 'c12.look.twine'); return true; } break;
      case 's12shack':
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (g.has('sweetroll') || F('traded')) { await g.say('hero', 'take.s12shack.more'); return true; }
          twinkle(g, 430, 128); g.sfx('pop'); g.give('sweetroll'); await g.say('hero', 'take.s12shack'); return true;
        }
        break;
      case 'cheesegiant':
        if (F('traded')) break;
        if (verb === 'look') { await g.say('hero', 'c12.look.cheese'); return true; }
        if (verb === 'talk') {
          if (!F('cheeseTalk')) { g.set('cheeseTalk'); await g.say('max', 'c12.talk.cheese.1'); await g.say('hero', 'c12.talk.cheese.2'); await g.say('sam', 'c12.talk.cheese.3'); await g.say('max', 'c12.talk.cheese.4'); return true; }
          await g.say('max', 'c12.talk.cheese.1'); return true;
        }
        if (verb === 'use' && item === 'sweetroll') { await g.cut(() => this.trade(g)); return true; }
        if (verb === 'use' && item && item.startsWith('cheese')) { await g.say('hero', 'c12.use.cheese.bad'); await g.say('max', 'c12.use.cheese.bad.max'); await g.say('narr', 'c12.use.cheese.bad.narr'); return true; }
        break;
      case 'sam':
        if (verb === 'talk') { await g.say('hero', 'c12.talk.sam.1'); await g.say('sam', 'c12.talk.sam.2'); return true; }
        break;
      case 'max':
        if (verb === 'talk') { await g.say('max', 'c12.end.max'); return true; }
        break;
      case 's12cart': if (verb === 'look') { await g.say('hero', 'look.s12cart'); return true; } break;
    }
    return false;
  },

  async wab(g, id) {
    const e = g.ent(id);
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 's12twine': {   /* la plus grosse pelote de seaux du monde */
        const B = g.ent('buckets');
        g.face(247); await zap(g, 247, 70, { from: tip(g), peak: () => { B.visible = true; } }); g.chk();
        await g.say('hero', 'c12.wk.twine'); await g.wait(500); await zap(g, 247, 70, { peak: () => { B.visible = false; } }); g.chk(); await g.say('hero', 's12.wk.back'); return;
      }
      case 'sam': await wabSwap(g, e, 's2:sam_wolf', [['sam', 'c12.wk.dog.1'], ['hero', 'c12.wk.dog.2']], 's12.wk.back'); return;
      case 'max': if (!e || !e.visible) break; await wabSwap(g, e, 's2:max_calm', [['max', 'c12.wk.rabbit.1'], ['sam', 'c12.wk.rabbit.2'], ['hero', 'c12.wk.rabbit.3']], 's12.wk.back'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  },

  /* brioche contre morceau : le lapin sort de la meule, affaire résolue */
  async trade(g) {
    const C = g.ent('cheesegiant'), M = g.ent('max'), S = g.ent('sam');
    await g.say('hero', 'c12.use.sweetroll.1'); g.drop('sweetroll');
    await zap(g, ...mid(g, C), { peak: () => { M.visible = true; M.hot = true; g.cinePos = null; }, cols: ['#ffd166', '#ffffff', '#f4b942'] }); g.chk(); g.face(M.x);
    await g.say('max', 'c12.use.sweetroll.2'); twinkle(g, M.x, M.y - 30, '#ffd166'); g.sfx('pop'); g.give('cheese12'); g.set('traded');
    g.face(S.x); await g.say('sam', 'c12.use.sweetroll.3'); await g.say('hero', 'c12.use.sweetroll.hero');
    await g.say('hero', 'c12.end.hero'); await g.say('sam', 'c12.end.sam'); g.face(M.x); await g.say('max', 'c12.end.max'); await g.say('narr', 'c12.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_12');
  }
};
