/* Registre des chapitres (une scène = un chapitre). Pour ajouter une scène : créer scenes/<id>.js, puis ajouter une ligne ici et les clés
   `ch.<id>` dans lang/fr.js et lang/en.js. `flags` et `inv` : l'état du héros à l'entrée de la scène quand on la choisit depuis le menu. */
export const CHAPTERS = [
  { id: 'rue', flags: {}, inv: [] },
  { id: 'mill', flags: {}, inv: [] },
  { id: 'meadow', flags: { hasCarrot: true, friend: true, cheese: true }, inv: ['cheese'] },
  { id: 'market', flags: {}, inv: [] },
  { id: 'gate', flags: { cartGone: true }, inv: [] },
  { id: 'house', flags: { guardGone: true }, inv: ['arrow'] },
  { id: 'ford', flags: { armorMoved: true }, inv: ['arrow'] },
  { id: 'wood', flags: { horsemanHappy: true }, inv: ['arrow'] },
  { id: 'hall', flags: {}, inv: ['arrow'] },
  { id: 'party', flags: { followerGone: true }, inv: ['arrow'] }
];
/* Saison 2 (crossover, scènes `hd` 960 × 540) : un chapitre par monde, musique propre ; `inv` : Wabbajack et meules des mondes précédents. `lang` : épisode de rechange selon la langue du jeu
   (17 = Kaamelott en français, Sacré Graal en anglais ; l'autre version jouable en bonus). `built` : scène écrite (scenes/<id>.js). */
const C2 = (n, music, o = {}) => ({ id: 's2_' + n, music: 's2_' + music, flags: {}, inv: ['wabbajack', 'shout', 'septims'], ...o });
export const CHAPTERS2 = [
  C2(11, '11_pirates', { built: true }), C2(12, '12_detectives', { built: true, inv: ['wabbajack', 'shout', 'septims', 'cheese_nl'] }), C2(13, '13_blocs', { built: true, inv: ['wabbajack', 'shout', 'septims', 'cheese_nl', 'cheese12'] }), C2(14, '14_archeo', { built: true, inv: ['wabbajack', 'shout', 'septims', 'cheese_nl', 'cheese12', 'cheesecube'] }), C2(15, '15_voyage', { built: true, inv: ['wabbajack', 'shout', 'septims', 'cheese_nl', 'cheese12', 'cheesecube', 'cheese14'] }), C2(16, '16_sorciers', { built: true, inv: ['wabbajack', 'shout', 'septims', 'cheese_nl', 'cheese12', 'cheesecube', 'cheese14', 'cheese15'] }),
  C2('17k', '17_table_fr', { lang: 'fr', bonusOf: 's2_17g' }), C2('17g', '17_table_en', { lang: 'en', bonusOf: 's2_17k' }),
  C2(18, '18_barbare'), C2(19, '19_hopital'), C2(20, '20_dinos'), C2(21, '21_annees80'), C2(22, '22_foret'), C2(23, '23_miami'), C2(24, '24_code'),
  C2(25, '25_comte'), C2(26, '26_cafe'), C2(27, '27_savant'), C2(28, '28_labo')
];
