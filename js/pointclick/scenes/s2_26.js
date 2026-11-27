/* Saison 2, chapitre 26 (1/3) : « Celui qui cherchait la meule ». Le café de La Cruche percée, son grand canapé orange et ses
   rires enregistrés qui tombent après chaque chute. La seule meule du quartier est dans le sandwich du paléontologue, au frigo
   d'en face. Retour au café pour la fin : le paléontologue effondré, la chanson du fromage qui pue, la rime soufflée.
   Coordonnées logiques 480 × 270 (décor 960 × 540). */
import { zap, twinkle } from '../engine/fx2.js';
import { wabZap, wabSwap, sheoPops, nextChapter, mid } from './s2_common.js';

/* rires enregistrés (bruitage, jamais de voix) */
let lastLaugh = 0;
export function laugh(g) { lastLaugh = (lastLaugh % 3) + 1; g.sfx('fileFx', 'laugh' + lastLaugh, 0.45); }
const TABLE = [[76, 196], [242, 196], [242, 258], [76, 258]];

export default {
  id: 's2_26', hd: true, bg: 's2/d_cafe26.webp', music: 's2_26_cafe', amb: ['party', 0.1], steps: 'wood',
  persp: [176, 0.62, 268, 0.86], walkK: 1.9, blockR: [16, 6],
  light: { tint: '#ffe2c0', k: 0.06 },
  walk: [[[4, 182], [430, 182], [476, 196], [476, 268], [4, 268]]],
  fg: [{ y: 232, polys: [TABLE] }],
  start: { x: 300, y: 240, dir: 'l' },
  fx: {
    lights: [{ x: 92, y: 40, r: 70, col: '#ffd890', a: 0.2, fl: 0.03 }, { x: 260, y: 70, r: 60, col: '#ffd890', a: 0.18, fl: 0.03 }, { x: 310, y: 60, r: 60, col: '#ffd890', a: 0.18, fl: 0.03 }],
    steam: [{ x: 398, y: 96, w: 4, rate: 1.4, a: 0.25 }]
  },
  hot: [
    { id: 's26door', rect: [430, 20, 480, 190], at: [446, 204], dir: 'r' }, { id: 's26sign', rect: [330, 15, 402, 50] },
    { id: 's26gorilla', rect: [22, 10, 80, 95] }, { id: 's26counter', rect: [240, 100, 420, 180], at: [330, 196], dir: 'b' }
  ],
  preload: ['s2:p_bench26', 's2:p_guard17', 's2:singer_lute26', 's2:i_waterbucket13'],
  ents: [
    { id: 'sofa26', spr: 's2:p_sofa26', x: 158, y: 200, scale: 0.72, hot: true, at: [160, 214], block: [80, 8], name: 'n.sofa26' },
    { id: 'mug26', spr: 's2:p_mug26', x: 200, y: 240, bob: 28, scale: 0.33, noShadow: true, hot: true, at: [262, 232], block: [84, 14], name: 'n.mug26' },
    { id: 'charmer', spr: 's2:charmer', x: 46, y: 240, hot: true, at: [84, 262], name: 'n.charmer' },
    { id: 'joker', spr: 's2:joker', x: 262, y: 194, hot: true, at: [300, 210], flip: true, name: 'n.joker' },
    { id: 'singer', spr: 's2:singer', x: 396, y: 218, flip: true, hot: true, at: [360, 232], name: 'n.singer' },
    { id: 'nervpaleo', spr: 's2:nervpaleo', x: 168, y: 196, hot: true, at: [262, 232], visible: false, name: 'n.nervpaleo' },
    { id: 'sheo', spr: 's2:sheo', x: 300, y: 240, hot: false, visible: false, aura: { col: '#c77dff', r: 0.6, a: 0.35, wisps: 3 } }
  ],

  async enter(g, how) {
    const F = k => g.flag(k), song = !!(F('theft') && !F('sung'));
    if (F('tookMug') || g.has('mug26') || g.has('bucket26')) g.ent('mug26').visible = false;
    g.ent('charmer').visible = !F('leftCafe') || song; g.ent('joker').visible = !F('leftCafe') || song;
    g.ent('nervpaleo').visible = song;
    if (song) { Object.assign(g.ent('charmer'), { x: 46, y: 240 }); Object.assign(g.hero, { x: 300, y: 240, dir: 'l' }); }
    if (how.back) { Object.assign(g.hero, { x: 440, y: 206, dir: 'l' }); g.fade(0, 600); }
    if (how.intro || song) g.fx.fade = { from: 1, to: 1, t0: g.now, ms: 0.01, a: 1 };
    this.notes = null;
  },
  async intro(g) {
    if (g.flag('theft') && !g.flag('sung')) return this.consolation(g);
    g.hero.front = true;
    await g.card(`assets/pointclick/s2/cards/r_friends_${g.lang === 'fr' ? 'fr' : 'en'}.webp`, g.T('ch.s2_26'));
    const C = g.ent('charmer'), J = g.ent('joker'); g.face(C.x);
    await g.say('charmer', 'c26.wake.1'); laugh(g); await g.wait(700); await g.say('hero', 'c26.wake.2');
    g.face(J.x); await g.say('joker', 'c26.wake.3'); laugh(g); await g.say('hero', 'c26.wake.4'); await g.say('narr', 'c26.wake.narr');
  },

  /* l'enseigne peinte (texte traduit), derrière les acteurs ; les notes de la chanson, devant */
  drawBack(g, c) {
    c.save(); c.font = 'bold 9px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(60,34,18,0.88)'; c.fillText(g.T('sign26'), 366, 34, 60); c.globalAlpha = 0.25; c.fillStyle = '#fff2d0'; c.fillText(g.T('sign26'), 366.5, 33.5, 60); c.restore();
  },
  draw(g, c) {
    if (!this.notes) return; const S = g.ent('singer'), t = g.now;
    c.save(); c.font = 'bold 11px Georgia, serif'; c.textAlign = 'center';
    for (let i = 0; i < 5; i++) { const u = ((t * 0.5 + i / 5) % 1); c.globalAlpha = Math.sin(u * Math.PI) * 0.9; c.fillStyle = i % 2 ? '#ffe9a8' : '#ffc0e0'; c.fillText(i % 2 ? '♪' : '♫', S.x - 24 + Math.sin(u * 6 + i) * 10, S.y - 120 - u * 50); }
    c.restore();
  },

  async on(g, verb, id, item) {
    const F = k => g.flag(k), e = g.ent(id), J = g.ent('joker'), C = g.ent('charmer');
    if (verb === 'use' && (item === 'wabbajack' || (id === 'wabbajack' && item))) { await g.cut(() => this.wab(g, item === 'wabbajack' ? id : item)); return true; }
    switch (id) {
      case 'charmer':
        if (verb === 'look') { await g.say('hero', 'look.charmer'); return true; }
        if (verb === 'talk') { await g.say('hero', 'c26.talk.charmer.1'); await g.say('charmer', 'c26.talk.charmer.2'); laugh(g); await g.say('hero', 'c26.talk.charmer.3'); return true; }
        break;
      case 'joker':
        if (verb === 'look') { await g.say('hero', 'look.joker'); return true; }
        if (verb === 'talk') {
          if (!F('joker1')) { g.set('joker1'); await g.say('joker', 'c26.talk.joker.1'); laugh(g); await g.say('hero', 'c26.talk.joker.2'); return true; }
          if (!F('knowsFridge')) { g.set('knowsFridge'); await g.say('hero', 'c26.talk.cheese.1'); await g.say('joker', 'c26.talk.cheese.2'); return true; }
          await g.say('joker', 'c26.gag.1'); laugh(g); await g.say('hero', 'c26.gag.2'); return true;
        }
        break;
      case 'singer':
        if (verb === 'look') { await g.say('hero', 'look.singer'); return true; }
        if (verb === 'talk') { await g.say('singer', 'c26.talk.singer.1'); await g.say('hero', 'c26.talk.singer.2'); await g.say('singer', 'c26.talk.singer.3'); laugh(g); return true; }
        break;
      case 'nervpaleo':
        if (verb === 'look') { await g.say('hero', 'look.nervpaleo'); return true; }
        if (verb === 'talk') { await g.say('nervpaleo', 'c26.song.paleo'); return true; }
        break;
      case 'sofa26':
        if (verb === 'look') { await g.say('hero', 'c26.look.couch'); return true; }
        if (verb === 'use' || verb === 'take') { if (item) break; g.hero.back = true; await g.wait(500); await g.say('hero', 'c26.gag.laugh'); g.hero.back = false; laugh(g); return true; }
        break;
      case 'mug26':
        if (verb === 'look') { await g.say('hero', 'c26.look.mug'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) { twinkle(g, e.x, e.y - e.bob - 6, '#ffffff'); e.visible = false; g.set('tookMug'); g.give('mug26'); return true; }
        break;
      case 's26counter':
        if (verb === 'look') { await g.say('hero', 'look.s26counter'); return true; }
        if (verb === 'take' || (verb === 'use' && !item)) {
          if (g.has('sweetroll') || F('fed') || F('counterRoll')) { await g.say('hero', 's26.counter.none'); return true; }
          g.set('counterRoll'); g.sfx('pop'); g.give('sweetroll'); await g.say('hero', 's26.counter.take'); return true;
        }
        break;
      case 's26sign': if (verb === 'look') { await g.say('hero', 'c26.look.sign'); return true; } break;
      case 's26gorilla': if (verb === 'look') { await g.say('hero', 'c26.look.gorilla'); return true; } break;
      case 's26door':
        if (verb === 'look') { await g.say('hero', 'look.s26door'); return true; }
        if (verb === 'use' || verb === 'walk') { g.set('leftCafe'); await g.fade(1, 600); setTimeout(() => g.goScene('s2_26b', { intro: true }), 0); return true; }
        break;
    }
    return false;
  },

  /* tout le monde au café : le paléontologue s'effondre, la chanteuse chante, le héros souffle la rime */
  async consolation(g) {
    const P = g.ent('nervpaleo'), S = g.ent('singer'), C = g.ent('charmer'), J = g.ent('joker');
    await g.fade(0, 900); g.face(P.x);
    await g.say('nervpaleo', 'c26.theft.paleo.2'); laugh(g); await g.wait(500);
    g.face(S.x); await g.say('singer', 'c26.song.singer');
    this.notes = true; g.sfx('jingle'); await g.say('singer', 'c26.song.1'); await g.say('singer', 'c26.song.2'); this.notes = null;
    await g.say('hero', 'c26.song.hero'); this.notes = true; g.sfx('jingle'); await g.say('singer', 'c26.song.3'); this.notes = null; laugh(g);
    g.face(P.x); await g.say('nervpaleo', 'c26.song.paleo'); await g.say('narr', 'c26.song.narr'); g.set('sung');
    await sheoPops(g, 'c26.end.sheo'); g.face(C.x); await g.say('charmer', 'c26.end.charmer'); laugh(g);
    await g.say('hero', 'c26.end.hero'); await g.say('narr', 'c26.end.narr');
    await g.fade(1, 1200); nextChapter(g, 's2_26');
  },

  async wab(g, id) {
    const e = g.ent(id), J = g.ent('joker');
    if (id === 'hero') { await g.say('hero', 'wab.self'); return; }
    switch (id) {
      case 'sofa26': await wabSwap(g, e, 's2:p_bench26', [['hero', 'c26.wk.couch'], ...(J.visible ? [['joker', 'c26.wk.couch.joker']] : [])], 's26.wk.back'); laugh(g); return;
      case 'singer': await wabSwap(g, e, 's2:singer_lute26', [['singer', 'c26.wk.guitar.singer'], ['hero', 'c26.wk.guitar.hero']], 's26.wk.back'); return;
      case 'joker': await wabSwap(g, e, 's2:p_guard17', [['joker', 'c26.wk.joker']], 's26.wk.back', { flip: true }); laugh(g); return;
      case 'mug26':
        if (g.has('mug26')) { await wabZap(g, null, null, ['#ffffff', '#c8a060']); g.drop('mug26'); g.give('bucket26'); await g.say('hero', 'c26.wk.mug'); return; }
        await wabSwap(g, e, 's2:i_waterbucket13', [['hero', 'c26.wk.mug']], null, { scale: 0.16 }); return;
      case 'bucket26': await wabZap(g, null, null); await g.say('hero', 'look.bucket26'); return;
    }
    await wabZap(g, e, null); await g.say('hero', 'wab.none');
  }
};
