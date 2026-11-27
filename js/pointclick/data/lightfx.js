/* Réglages de la couche de lumière tramée (engine/lightfx.js : rendu 90 au grain 480, rendu 2000 en trame fine 960), scène par scène. Pour l'instant : s2_11, le quai des
   pirates (nuit). Torches : lueur (et flamme en pixels, sauf flame: false) des lanternes et fenêtres de la taverne (mêmes points que scene.fx.lights).
   `key` (objet clé qui s'illumine : préparation, éclat, retombée) est un indice visuel fort : désactivé, à réserver au génie ou à un
   mode « aide » ; exemple gardé en commentaire. */
export const LIGHTFX = {
  s2_11: {
    lightK: 0.9,
    torches: [
      { x: 442, y: 79, r: 30, flame: false }, { x: 467, y: 82, r: 26, flame: false },   /* fenêtres : lueur seule */
      { x: 349, y: 73, r: 24, w: 3, col: '#ffc860' }, { x: 461, y: 110, r: 22, w: 3 }   /* lanterne suspendue, lampe du comptoir */
    ],
    /* key: g => (g.has('map') && !g.flag('crateOpen') ? [100, 252] : !g.has('cracker') && !g.flag('learned') ? [28, 214] : null),
    keyFx: { col: '#ffd166', every: 6, prep: 0.7, act: 0.22, fall: 1.3 } */
  }
};
