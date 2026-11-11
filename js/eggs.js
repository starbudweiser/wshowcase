/* Registre des easter eggs du bureau : une entrée par œuf, chargé à la demande au double-clic (rien n'est téléchargé avant). */
import { lang } from './i18n.js';
const T = (fr, en) => (lang() === 'fr' ? fr : en);

export const EGGS = [
  { id: 'Seau', space: 'skyrim', desk: true, src: 'assets/pointclick/icon.png', label: () => T('Seau', 'Bucket'), load: () => import('./pointclick/boot.js').then(m => m.open()) }
];
