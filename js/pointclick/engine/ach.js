/* Succès du jeu, gardés à part de la sauvegarde (ils survivent à « Nouvelle partie »). */
import { store } from '../../util.js';
const KEY = 'pc.ach';
export const BLINDS = ['rue', 'mill', 'meadow'];
export const getAch = () => { const a = store.get(KEY, null); return a && Array.isArray(a.lit) ? a : { lit: [], done: [] }; };
/* un aveugle de plus éclairé ; renvoie le compte et si « Fiat lux » vient d'être débloqué */
export function light(id) {
  const a = getAch(); if (!a.lit.includes(id)) a.lit.push(id);
  const all = BLINDS.every(x => a.lit.includes(x)); let first = false;
  if (all && !a.done.includes('fiatlux')) { a.done.push('fiatlux'); first = true; }
  store.set(KEY, a); return { count: a.lit.filter(x => BLINDS.includes(x)).length, total: BLINDS.length, all, first };
}
