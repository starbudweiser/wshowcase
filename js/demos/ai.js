/* Petit assistant IA de démonstration : texte écrit au fil de l'eau après une courte réflexion. Aucune requête n'est envoyée : les réponses sont écrites d'avance. */
import { h, wait, reduced } from '../util.js';
import { sfx } from '../audio.js';

export const aiBadge = label => h('span', { class: 'aibadge' }, label || 'IA');

/* Écrit `text` dans `el` caractère par caractère. Retourne une promesse résolue à la fin. */
export async function stream(el, text, { think = 700, cps = 90, alive = () => true } = {}) {
  el.textContent = ''; el.classList.add('aithink');
  if (!reduced()) await wait(think);
  el.classList.remove('aithink'); if (!alive()) return;
  if (reduced()) { el.textContent = text; return; }
  const node = document.createTextNode(''), caret = h('i', { class: 'caret' }); el.append(node, caret);
  const step = Math.max(1, Math.round(cps / 60));
  for (let i = 0; i < text.length; i += step) {
    if (!alive()) return;
    node.data = text.slice(0, i + step);
    if (i % 14 === 0) sfx.tick();
    await wait(16);
  }
  node.data = text; caret.remove();
}
