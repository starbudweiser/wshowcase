import { store } from './util.js';
export const S = { apps: [], spaces: [], owner: 'starbudweiser', cur: 'skyrim', scale: 1, active: null, rectOf: () => null, extras: new Map() };
export const bus = new EventTarget();
export const emit = (n, d) => bus.dispatchEvent(new CustomEvent(n, { detail: d }));
export const on = (n, f) => bus.addEventListener(n, e => f(e.detail));
export const appById = id => S.apps.find(a => a.id === id);
export const spaceById = id => S.spaces.find(s => s.id === id);
export const icon = id => `assets/icons/${id}.png`;
export const WALLS = [
  { id: 'tes_whiterun', cat: 'tes', n: { fr: 'Blancherive', en: 'Whiterun' } },
  { id: 'tes_hrothgar', cat: 'tes', n: { fr: 'Haut-Hrothgar', en: 'High Hrothgar' } },
  { id: 'tes_rift', cat: 'tes', n: { fr: 'Le Rift', en: 'The Rift' } },
  { id: 'tes_winterhold', cat: 'tes', n: { fr: 'Winterhold', en: 'Winterhold' } },
  { id: 'tes_solitude', cat: 'tes', n: { fr: 'Solitude', en: 'Solitude' } },
  { id: 'tes_markarth', cat: 'tes', n: { fr: 'Markarth', en: 'Markarth' } },
  { id: 'tes_dwemer', cat: 'tes', n: { fr: 'Ruines dwemer', en: 'Dwemer ruins' } },
  { id: 'tes_moons', cat: 'tes', n: { fr: 'Masser et Secunda', en: 'Masser and Secunda' } },
  { id: 'tes_oblivion', cat: 'tes', n: { fr: 'Porte d’Oblivion', en: 'Oblivion Gate' } },
  { id: 'tes_sovngarde', cat: 'tes', n: { fr: 'Sovngarde', en: 'Sovngarde' } },
  { id: 'aurore', cat: 'gen', n: { fr: 'Aurore', en: 'Aurora' } },
  { id: 'dune', cat: 'gen', n: { fr: 'Dune', en: 'Dune' } },
  { id: 'brume', cat: 'gen', n: { fr: 'Brume', en: 'Mist' } },
  { id: 'ocean', cat: 'gen', n: { fr: 'Océan', en: 'Ocean' } },
  { id: 'prairie', cat: 'gen', n: { fr: 'Prairie', en: 'Meadow' } },
  { id: 'nuit', cat: 'gen', n: { fr: 'Nuit', en: 'Night' } },
  { id: 'nordique', cat: 'gen', n: { fr: 'Nordique', en: 'Nordic' } },
  { id: 'braises', cat: 'gen', n: { fr: 'Braises', en: 'Embers' } },
  { id: 'verre', cat: 'gen', n: { fr: 'Verre', en: 'Glass' } },
  { id: 'dragon', cat: 'gen', n: { fr: 'Dragon', en: 'Dragon' } }
];
export async function loadData() {
  const d = await (await fetch('data/apps.json')).json();
  S.apps = d.apps; S.spaces = d.spaces; S.owner = d.owner;
}
/* Thème : auto | light | dark */
export function applyTheme(mode) {
  store.set('theme', mode);
  const dark = mode === 'dark' || (mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.mode = mode;
  emit('theme', { mode, dark });
}
export const themeMode = () => document.documentElement.dataset.mode || 'auto';
