import { store } from './util.js';
export const S = { apps: [], spaces: [], owner: 'starbudweiser', cur: 'skyrim', scale: 1, active: null, rectOf: () => null, extras: new Map() };
export const bus = new EventTarget();
export const emit = (n, d) => bus.dispatchEvent(new CustomEvent(n, { detail: d }));
export const on = (n, f) => bus.addEventListener(n, e => f(e.detail));
export const appById = id => S.apps.find(a => a.id === id);
export const spaceById = id => S.spaces.find(s => s.id === id);
export const icon = id => `assets/icons/${id}.png`;
export const WALLS = [
  { id: 'aurore', tone: 'light', n: { fr: 'Aurore', en: 'Aurora', es: 'Aurora', it: 'Aurora' } },
  { id: 'dune', tone: 'light', n: { fr: 'Dune', en: 'Dune', es: 'Duna', it: 'Duna' } },
  { id: 'brume', tone: 'light', n: { fr: 'Brume', en: 'Mist', es: 'Bruma', it: 'Foschia' } },
  { id: 'ocean', tone: 'light', n: { fr: 'Océan', en: 'Ocean', es: 'Océano', it: 'Oceano' } },
  { id: 'prairie', tone: 'light', n: { fr: 'Prairie', en: 'Meadow', es: 'Pradera', it: 'Prateria' } },
  { id: 'nuit', tone: 'dark', n: { fr: 'Nuit', en: 'Night', es: 'Noche', it: 'Notte' } },
  { id: 'nordique', tone: 'dark', n: { fr: 'Nordique', en: 'Nordic', es: 'Nórdico', it: 'Nordico' } },
  { id: 'braises', tone: 'dark', n: { fr: 'Braises', en: 'Embers', es: 'Brasas', it: 'Braci' } },
  { id: 'verre', tone: 'dark', n: { fr: 'Verre', en: 'Glass', es: 'Cristal', it: 'Vetro' } },
  { id: 'dragon', tone: 'dark', n: { fr: 'Dragon', en: 'Dragon', es: 'Dragón', it: 'Drago' } }
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
