/* Boîte à outils commune aux démos : fenêtre Socle, barre de titre, texte bilingue, CSS propre à chaque démo, extra de barre des menus, IA de démonstration. */
import { lang } from '../i18n.js';
export { winOf as win, titleOf as bar, dlBtn, fmt, menu as menuExtra } from './engine.js';
export { stream, aiBadge } from './ai.js';
export { toast } from '../system.js';
export { icon, S } from '../core.js';
export { h, brand, wait, reduced, clamp, $, esc } from '../util.js';
export { sfx } from '../audio.js';
export * as wm from '../wm.js';
export { launch, download } from '../apps.js';
/** Texte bilingue : T('français', 'english'). */
export const T = (fr, en) => (lang() === 'fr' ? fr : en);
export const num = n => n.toLocaleString(lang() === 'fr' ? 'fr-FR' : 'en-US');
/** Charge une feuille de style propre à la démo (une seule fois). */
export function css(url) {
  if (document.querySelector(`link[data-k="${url}"]`)) return;
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; l.dataset.k = url; document.head.append(l);
}
