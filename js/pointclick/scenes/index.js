/* Registre des chapitres (une scène = un chapitre). Pour ajouter une scène : créer scenes/<id>.js, puis ajouter une ligne ici et les clés
   `ch.<id>` dans lang/fr.js et lang/en.js. `flags` et `inv` : l'état du héros à l'entrée de la scène quand on la choisit depuis le menu. */
export const CHAPTERS = [
  { id: 'rue', flags: {}, inv: [] },
  { id: 'mill', flags: {}, inv: [] },
  { id: 'meadow', flags: { hasCarrot: true, friend: true, cheese: true }, inv: ['cheese'] }
];
