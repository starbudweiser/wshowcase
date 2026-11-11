# Reprise : sprites animés (en pause, pour économiser le quota)

État : le jeu committé fonctionne tel quel. Les deux fichiers `*.animation.*` de ce dossier sont la version « animée » (tenues Skyrim, images par
personnage, `ANIM`) : ils ne doivent remplacer `js/pointclick/data/sheets.js` et `tools/build_sprites.sh` qu'une fois toutes les images calculées.

Calculs locaux (gratuits) lancés en arrière-plan, relançables (ils sautent ce qui existe) :
- `tools/gen_anim.sh` : nouvelles tenues (`work/ch2_*.png`, faites) puis ~35 poses (`work/an_*.png`).
- `tools/gen_regions.py` : décor animé par images (rivière, roues, mammouth, flammes, herbes) -> `assets/pointclick/anim/`.

Reste à faire (peu de code) : 1) `zsh tools/build_sprites.sh` ; 2) copier les deux fichiers `wip/` à leur place ; 3) dans `game.js` : état d'animation
des entités (`ANIM`, `HERO`) dans `update()` / `drawEnt()` ; 4) type d'ambiance `frames` (lit `anim/index.json`) à la place de water/wheel/sway/bob ;
5) oiseaux, dragon (4 poses), fumée et flammes en sprites ; 6) remplacer `hero.side/stride` dans `update()`.
