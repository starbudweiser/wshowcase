/* Sauvegarde automatique dans le navigateur (même magasin que le site : clé wsc.pc.save). */
import { store } from '../../util.js';
const KEY = 'pc.save', VERSION = 1;
export const hasSave = () => { const s = store.get(KEY, null); return !!(s && s.v === VERSION && s.scene); };
export const loadSave = () => { const s = store.get(KEY, null); return s && s.v === VERSION ? s : null; };
export const writeSave = st => store.set(KEY, { v: VERSION, ...st });
export const clearSave = () => store.set(KEY, null);
export const exportSave = () => JSON.stringify(loadSave() || {});
export const importSave = txt => { try { const s = JSON.parse(txt); if (s && s.v === VERSION && s.scene) { store.set(KEY, s); return true; } } catch {} return false; };
