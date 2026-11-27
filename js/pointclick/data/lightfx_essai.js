/* ESSAI (27/11/2026, non adopté) : réglages de la couche de lumière (engine/lightfx.js), scène par scène. Une seule scène pour l'essai :
   s2_11, le quai des pirates (nuit). Torches : lanternes et fenêtres de la taverne (mêmes points que scene.fx.lights).
   Objet clé : la caisse à la croix quand le héros a la carte et qu'elle n'est pas encore ouverte, sinon le tonneau aux biscuits
   tant que le héros n'a pas de biscuit ; rien une fois les deux faits. */
export const LIGHTFX = {
  s2_11: {
    lightK: 0.9,
    torches: [
      { x: 442, y: 79, r: 30, w: 4 }, { x: 467, y: 82, r: 26, w: 4 },
      { x: 349, y: 73, r: 24, w: 3, col: '#ffc860' }, { x: 461, y: 110, r: 22, w: 3 }
    ],
    key: g => (g.has('map') && !g.flag('crateOpen') ? [100, 252] : !g.has('cracker') && !g.flag('learned') ? [28, 214] : null),
    keyFx: { col: '#ffd166', every: 6, prep: 0.7, act: 0.22, fall: 1.3 }
  }
};
