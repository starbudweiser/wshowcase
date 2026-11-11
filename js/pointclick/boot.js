/* Ouverture du jeu dans une fenêtre du faux Mac. Chargé à la demande (double-clic sur l'icône « Seau »). */
import { h } from '../util.js';
import * as wm from '../wm.js';
import { lang } from '../i18n.js';
import { S, on } from '../core.js';

let game = null, cssDone = false, hooked = false;
const T = (fr, en) => (lang() === 'fr' ? fr : en);

export async function open() {
  if (wm.wins.has('pointclick')) { wm.open({ id: 'pointclick' }); return; }
  if (!cssDone) { cssDone = true; document.head.append(h('link', { rel: 'stylesheet', href: 'css/pointclick.css' })); }
  const { Game } = await import('./engine/game.js');
  let root;
  wm.open({
    id: 'pointclick', appId: 'pointclick', title: T('Le Seau de Rivebois', 'The Bucket of Riverwood'), w: 980, h: 700, minw: 560, minh: 420, cls: 'pcwin', space: 'skyrim',
    build: () => { root = h('div'); game = new Game(root); game.init(); window.pcGame = game; return root; },
    onclose: () => { if (game) { game.destroy(); game = null; window.pcGame = null; } }
  });
  if (!hooked) {
    hooked = true;
    on('lang', l => { if (game) game.setLang(l); });
    addEventListener('keydown', e => { if (game && S.active && S.active.id === 'pointclick' && !e.metaKey && !e.ctrlKey && !e.altKey) game.key(e); });
  }
}
