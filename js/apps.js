/* Lancement des applis : change de bureau si besoin, puis démo interactive (applis phares) ou parcours guidé. */
import { S, appById, emit } from './core.js';
import { go } from './spaces.js';
import * as finder from './finder.js';
import * as system from './system.js';
import * as tour from './tour.js';

export async function launch(id) {
  const app = appById(id); if (!app) return;
  if (app.space !== S.cur) await go(app.space);
  if (app.demo) {
    try { (await import(`./demos/${app.demo}.js`)).open(app); }
    catch (e) { console.error(e); tour.open(app); }
  } else tour.open(app);
}
export const openFinder = o => finder.open(o);
export const openSettings = tab => system.openSettings(tab);
export const openAbout = () => system.openAbout();
export const power = what => emit('power', what);
export function download(app) {
  if (app.download) window.open(`https://github.com/${S.owner}/${app.repo}/releases/latest`, '_blank', 'noopener');
}
export const repoUrl = app => `https://github.com/${S.owner}/${app.repo}`;
