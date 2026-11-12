/* « Où est passé le soleil ? » : une clé par scène (donc par personnage), 6 variantes de même texte pour 6 intonations différentes (voix dans assets/pointclick/voice). */
const SCENES = ['rue', 'mill', 'meadow', 'market', 'gate', 'house', 'ford', 'wood', 'hall', 'party'];
export const darkKeys = line => Object.fromEntries(SCENES.map(s => ['blind.dark.' + s, Array(6).fill(line)]));
