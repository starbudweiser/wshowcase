# Saison 2 du point & click (crossover) — état et plan

Proposition : `crossover.html` (artifact privé https://claude.ai/artifact/BfYNc2q3hebzp61ECw82yp).
Prototypes de rendu : https://claude.ai/artifact/Hbie6aV5LJGNajt7JZMpVR (`tools/proto_rendu_s2.py`).

## Décidé par Stéphan (23/11/2026)
- Pirouette : Sheogorath s'invite à la fête (seau-portail, une meule de fromage par monde, fondue finale) ;
  chaque chapitre s'ouvre sur « Hé, toi. T'es enfin réveillé. »
- Le Wabbajack est l'outil central des énigmes ; le héros le garde à la fin (bonus dans les chapitres 1 à 10).
- 15 chapitres (11 à 25) : Monkey Island, Sam & Max, Minecraft, Indiana Jones, Retour vers le futur, Harry Potter,
  Table ronde, Conan + L'Histoire sans fin, Jurassic Park, Stranger Things, Twin Peaks, Dexter, Matrix,
  Seigneur des Anneaux, Portal (finale).
- Épisodes de rechange par langue : chapitre 17 = Kaamelott (FR) / Sacré Graal (EN).
- Rendu : 960 × 540, 16 millions de couleurs (double exact du canevas 480 × 270 de la saison 1). Le style peint
  FLUX ne change pas ; seules la définition et la palette changent.

## Fait
- Scripts courts des 15 chapitres + rechange, avec les clins d'œil « Wabbajack sur… ».
- Visuels d'ambiance de tous les chapitres, contrôlés, exportés en 960 × 540 (`img/`). Sources FLUX dans
  `work/crossover/` (ignoré par git), scripts `tools/gen_crossover*.sh`.

## À faire
1. Planches de personnages des 15 chapitres (à valider avant toute pose).
2. Moteur : canevas 960 × 540, saison 1 affichée ×2 sans changement ; interface et police mises à l'échelle.
3. Wabbajack : réserve d'effets génériques (une douzaine d'images faites une fois), réactions par point chaud,
   carnet des métamorphoses.
4. Choix de l'épisode selon la langue (registre des chapitres avec variantes fr/en, l'autre version jouable en bonus).
5. **Génie des indices en HD** (demandé par Stéphan le 23/11, note de la session du jeu) :
   - en ligne en saison 1 (commit 6ad66b8 sur main) : `js/pointclick/engine/genie.js`, `data/hints.js`,
     `lang/genie_fr.js`, `lang/genie_en.js` ;
   - 6 poses validées et 3 accessoires, sources FLUX 1024 × 1280 dans `work/genie/` de la branche
     `claude/easter-egg-pointclick-6eb4be` (ignoré par git) : base `genie_2`, poses `pose_idle2_3`, `pose_talk_2`,
     `pose_tada_1`, `pose_flat_1`, `pose_scorch_2`, accessoires `lamp_2`, `mound_2`, `portal_3` ; aujourd'hui
     réduites à 112 px en couleurs limitées par `sprites_pixelize.py` ;
   - le style peint ne changeant pas, il suffit de redétourer les mêmes sources au double (≈ 224 px de haut), sans
     réduction de couleurs. Si une pose devait changer : la recalculer entière avec genie_2 comme référence, puis
     planche à valider (jamais de retouche) ;
   - adapter les effets de `genie.js` écrits pour 480 × 270 (positions, tailles, faux écran de chargement) ;
   - ajouter dans `hints.js` les étapes des chapitres 11 à 25 (et de Sacré Graal), 3 indices gradués par étape
     en FR/EN, voix du génie générée depuis le casting mCASTING (clé `genie`).
6. Textes FR/EN, voix (casting mCASTING d'abord), sons, intégration et essais.
