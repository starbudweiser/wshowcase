/* Saison 2 : outils communs aux scènes (Wabbajack, apparitions de Sheogorath, passage au chapitre suivant). */
import { zap, confetti } from '../engine/fx2.js';
import { CHAPTERS2 } from './index.js';

/* main du héros qui tient le Wabbajack : départ de l'arc électrique */
export function tip(g) { const h = g.hero, r = g.entRect(h); if (!r) return [h.x, h.y - 40]; const w = r[2] - r[0], hh = r[3] - r[1]; return [h.x + (h.dir === 'l' ? -0.42 : 0.42) * w, r[1] + hh * 0.42]; }
/* centre d'un personnage ou d'un objet */
export function mid(g, e) { const r = g.entRect(e); return r ? [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2 - (e.float || 0)] : [e.x, e.y - 20]; }

/* éclair du Wabbajack sur e ; peak() au plus épais de la fumée (métamorphose invisible) */
export async function wabZap(g, e, peak, cols) { if (e) g.face(e.x); await zap(g, ...(e ? mid(g, e) : [g.hero.x, g.hero.y - 40]), { from: tip(g), peak, cols }); g.chk(); }

/* métamorphose passagère : le sprite change le temps des répliques, puis reprend sa forme dans un second éclair */
export async function wabSwap(g, e, spr, lines, back = 's12.wk.back', o = {}) {
  const old = e.spr, fl = e.flip, sc = e.scale;
  await wabZap(g, e, () => { e.spr = spr; if (o.flip !== undefined) e.flip = o.flip; if (o.scale !== undefined) e.scale = o.scale; });
  for (const [w, k] of lines) await g.say(w, k);
  await g.wait(400); await zap(g, ...mid(g, e), { peak: () => { e.spr = old; e.flip = fl; e.scale = sc; } }); g.chk();
  if (back) await g.say('hero', back);
}

/* Sheogorath surgit (éclair violet et doré, confettis), dit sa réplique ; s'en va en fumée si leave */
export async function sheoPops(g, key, leave = true) {
  const S = g.ent('sheo'), h = g.hero; if (!S) { await g.say('sheo', key); return; }
  S.x = Math.max(70, Math.min(420, h.x + (h.x < 240 ? 80 : -80))); S.y = Math.max(170, Math.min(255, h.y)); S.flip = S.x > h.x;
  await zap(g, S.x, S.y - 45, { peak: () => { S.visible = true; confetti(g, S.x, S.y - 70); }, cols: ['#c77dff', '#ffd166', '#e9a2ff', '#ffffff'] }); g.chk();
  g.face(S.x); await g.say('sheo', key);
  if (leave) { await zap(g, S.x, S.y - 45, { peak: () => { S.visible = false; }, cols: ['#c77dff', '#ffd166', '#e9a2ff'] }); g.chk(); }
}

/* fin d'un chapitre : le prochain chapitre construit de la langue du jeu, sinon « À suivre » */
export function nextChapter(g, cur) {
  const i = CHAPTERS2.findIndex(c => c.id === cur), nx = CHAPTERS2.slice(i + 1).find(c => c.built && (!c.lang || c.lang === (g.lang === 'fr' ? 'fr' : 'en')));
  g.cinePos = null; setTimeout(() => (nx ? g.goScene(nx.id, { intro: true }) : g.end('s2end')), 0);
}
