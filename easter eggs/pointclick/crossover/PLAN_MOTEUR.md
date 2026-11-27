# Saison 2 dans le moteur — plan d'intégration (27/11/2026)

## Décidé par Stéphan (27/11/2026)
- **Maquette d'abord** : chapitre 11 jouable vite (décor vide FLUX, fiches détourées en poses fixes) pour tester
  énigmes et dialogues ; animations LTX (parole, marche) ensuite, avant toute mise en ligne.
- **Illustrations `r_*` = vignette d'ouverture** de chaque chapitre (plein écran avec le titre), puis décor jouable.
- **Expressions du héros sur face et profils** (8 visages) ; trois-quarts et dos restent neutres.
- **Saison 2 ouverte après la fin de la saison 1** (chapitres 11-28 dans le menu) ; en local, `?s2` ouvre tout.
- **Effets visuels animés de qualité et pertinents, surtout** (27/11) : chaque scène et chaque action marquante a son
  effet, dessiné en pleine définition (`js/pointclick/engine/fx2.js` : lumière additive, halos, ondes de choc, éclairs,
  fumée, étincelles) : éclair du Wabbajack, métamorphoses, aura des fantômes et des créatures magiques, feux d'artifice,
  lumières vivantes du décor (lanternes, fenêtres, reflets de lune, lucioles, brume, néons…), apparitions de Sheogorath.
- **Transition de rendu au début de la saison 2** (27/11) : la vignette du chapitre 11 s'affiche en rendu années 90
  (480 × 270, 64 couleurs tramées, palette propre à l'image comme en saison 1), puis deux balayages lumineux font passer
  aux couleurs puis à la définition des années 2000. **Option « Saison 2 : rendu années 90 »** dans le menu Options pour
  jouer toute la saison en rendu années 90 (filtre WebGL de `scaler.js`, palette de 64 couleurs par scène `palette.js`).
- **Décors vivants** (27/11) : mer qui ondule et galion qui tangue dans la première scène (vidéo LTX en boucle du décor) ;
  chaque décor a ses mouvements (eau, feuillages, fumées, foules…).
- **Personnages vivants dans tous les épisodes** (27/11) : jamais immobiles en attendant de parler ; repos vivant
  (respiration, regards, gestes) et vraie parole, en boucles LTX depuis la pose validée (même image au début et à la fin),
  plus marches LTX. Le simple étirement pendant la parole ne suffit plus.
- **Tout monter de deux crans en qualité de réalisation : tout se joue dans les détails** (27/11) : ombres de contact,
  éclairage du décor sur les personnages (nuit, lanternes), transitions, sons, finitions de chaque plan.

## Constat
- **Prêt** : 19 dialogues (999 répliques, FR/EN), 1 881 voix (82 Mo, mp3 40 kb/s comme la saison 1), 19 musiques déjà
  dans `assets/pointclick/music/s2_*.mp3`, 56 fiches de personnages, 23 illustrations de scène.
- **Manque pour jouer** :
  - les illustrations `crossover/img/r_*.jpg` ont les personnages peints dedans et un cadrage serré : ce sont des
    affiches, pas des décors où l'on marche ;
  - les fiches `crossover/persos/*.jpg` sont une pose de présentation sur fond magenta : aucun sprite de jeu ;
  - héros S2 : 6 vues fixes (`work/crossover/hero_s2/sel_*.png`), aucun cycle de marche, aucune parole ;
  - aucun objet d'inventaire, aucune transformation du Wabbajack, aucun point chaud ni zone de marche ;
  - prologue (fête du chapitre 10 → Sheogorath → seau-portail) : aucune réplique écrite.

## Architecture du moteur
1. **Coordonnées logiques inchangées (480 × 270)** pour l'interface, la pièce des verbes, les bulles, les zones de
   marche, les points chauds et les scripts. Une scène S2 déclare `hd: true` : canevas 960 × 540, dessin à ×2, sprites
   S2 à densité 2 (pleine définition), lissage activé. Les scènes S1 gardent leur canevas 480 × 270 : rendu et filtres
   (pixels nets, Scale2x…) identiques au pixel près.
2. **Registre** `js/pointclick/scenes/index.js` : chapitres `s2_11` à `s2_28` ; le 17 en deux variantes
   (`lang: 'fr'` Kaamelott, `lang: 'en'` Sacré Graal), l'autre version jouable en bonus dans le menu.
3. **Textes** : `tools/s2_lang.py` convertit `crossover/dialogues/*.json` en `js/pointclick/lang/s2_fr.js` et
   `s2_en.js` (mêmes clés `cNN.*`), chargés avec la saison 1. Une couleur de bulle par personnage.
4. **Voix** : copie de `work/crossover/voices/<fr|en>/` vers `assets/pointclick/voice/<fr|en>/` (suivi par git comme
   la saison 1, +82 Mo). **Musique** : `music: 's2_11_pirates'`… par scène.
5. **Héros S2** : planche `HERO2` (profils, trois-quarts, face, dos), orientation selon la marche et l'interlocuteur
   (comme en S1), expression choisie par réplique d'après `emo` (table emo → 8 visages), neutre et clignements au repos.
6. **Wabbajack** : dans la besace dès le chapitre 11 ; « utiliser le Wabbajack sur X » → effet commun (éclair + pouf
   de fumée, une douzaine d'images faites une fois), puis sprite transformé ou réplique ; carnet des métamorphoses.
7. Nuit, clins d'œil et vitrail de la S1 coupés en S2 au départ (faits pour 480 × 270 et les personnages S1).
8. Génie des indices en HD et étapes 11-28 : après le premier chapitre jouable.

## Production graphique manquante (images entières, poses validées sur planche, cycles LTX)
Par chapitre :
- 1 décor vide 960 × 540 (FLUX, illustration en référence, même lieu sans personnages, cadrage plus large, sol
  praticable, avant-plans séparés si besoin) ; Friends en FR et en EN ;
- par personnage : pose clé de jeu (tourné vers son interlocuteur) + parole (vidéo LTX sur place → 4-5 images) ;
  cycle de marche LTX (profil, face, dos) seulement s'il se déplace ;
- 3 à 5 objets (icône de besace + objet posé) ;
- 4 cibles du Wabbajack → sprite transformé (ou effet seul quand le gag est sonore).
Commun : héros S2 complet, héros dessin animé (chapitre 27), Sheogorath (fin de chaque chapitre), Wabbajack, effet.
Ordre de grandeur : ~20 décors, ~45 personnages, ~70 objets, ~75 transformations, ~80 vidéos LTX et ~500 images
FLUX, une à la fois (file calcul-lourd) : plusieurs jours de calcul, avec une planche à valider par chapitre.

## Ordre des étapes
1. Moteur : `hd`, registre, textes, voix, musique, héros S2 provisoire (vues fixes).
2. Chapitre 11 de bout en bout : décor vide, poses et parole des personnages, objets, transformations → planches →
   animations → intégration → essais dans le navigateur, son coupé → commit local.
3. Héros S2 complet (cycles LTX des 4 vues, parole, clignements, expressions), utile à tous les chapitres.
4. Chapitres 12 à 28, par lots de 2 ou 3, planche validée à chaque lot.
5. Génie HD et indices, prologue (à écrire), passage depuis la fin de la S1, Wabbajack en bonus dans la S1.

## Chapitre 11 en détail
- Décor : quai de nuit, navire fantôme à gauche, taverne à droite (perroquet sur son perchoir), tonneaux, statue de
  singe (cible du Wabbajack).
- Personnages : apprenti pirate, maître d'armes, perroquet, capitaine fantôme, Sheogorath, héros.
- Objets : biscuit, carte au trésor, chope de grog → bière de racine, fromage de Hollande, Wabbajack.
- Déroulé : réveil (l'apprenti) → biscuit au perroquet, il récite les réparties → duel en trois manches (choix,
  l'apprenti souffle) → carte → le capitaine fantôme confisque le fromage → Wabbajack sur la chope → bière de racine
  sur le fantôme → feu d'artifice vert → fromage → Sheogorath → chapitre 12.
- Trou du script : d'où vient le biscuit ? Proposition : sur un tonneau devant la taverne ; réplique « prendre » à
  écrire et à voiser (réplique générique en attendant).

## État au 27/11/2026 (nuit)
### Fait
- Moteur : scènes `hd` 960 × 540 (S1 inchangée), sprites S2 à densité 2, menu « Saison 2 » (ouvert après la S1 ou avec `?s2`),
  vignettes d'ouverture dessinées sur le canevas, transition années 90 → 2000 au début de la saison, option rendu années 90
  (images converties par `tools/s2_retro.py`), effets `fx2.js`, ombres, éclairage du décor sur les personnages, zones de
  décor en vidéo (`scene.video`), boucles LTX de repos / parole / marche (`assets/pointclick/s2/anim.json`), pas sonores
  selon le sol (`scene.steps`), ambiance par scène (`scene.amb`).
- Textes et voix de toute la saison branchés (`tools/s2_lang.py`, `tools/s2_voices_install.sh`).
- Chapitre 11 jouable de bout en bout : décor vide, mer et galion animés, héros avec marches LTX (profils, face, dos),
  capitaine fantôme recalculé sans halo, Wabbajack (arc, fumée, métamorphoses), duel, feux d'artifice, Sheogorath.
- Chapitre 12 (Sam & Max) jouable : route du désert puis attraction (voiture → charrette, gyrophare musical, lapin calme,
  chien loup-garou, pelote de seaux, meule géante cachée derrière la pelote, brioche de l'échoppe).
- Chapitre 13 (monde en cubes) jouable : pied de la tour (créature verte qui fait sauter le mur, soleil rond, mouton
  qui change de couleur, paysage en fromage), haut de la tour (héros en cubes, meule cubique), saut amorti par le seau d'eau.
- Chapitre 14 (temple de l'idole) jouable : réveil sur la dalle piégée (fléchettes), fosse aux serpents changée en
  saucisses (on traverse en mangeant), meule de la besace contre l'idole, rocher qui dévale changé en meule géante ;
  métamorphoses de l'archéologue (anguille, casque à cornes, garde de Skyrim), idole en poule dorée.
- Chapitre 15 (88 lieues à l'heure) jouable : place de l'horloge sous l'orage (pluie, éclairs d'ambiance, tonnerre,
  pas sur la pierre), charrette changée en charrette d'acier puis en cheval nordique qui grimpe à la tour, câble tendu
  jusqu'à l'horloge, le Cri appelle la foudre (trop tôt : foudre sur le banc) ; métamorphoses du savant (coiffure),
  de l'horloge (héros enfant), du panneau, de la photo (héros au seau) ; savant et garçon animés en boucles LTX.
- Chapitre 16 (le Choixseau) jouable : grande salle (bougies flottantes qui montent et descendent, chacune avec sa lueur,
  plafond étoilé scintillant, brouhaha), chapeau parlant en boucles LTX changé en seau qui répartit le héros assis à
  « RIVEBOIS » (applaudissements, feux d'artifice), puis cachot des potions (feu et braises, vapeur du chaudron, professeur
  en boucles LTX) : fleur de montagne bleue dans le chaudron (vapeur rose), fondue si on y met du fromage ; métamorphoses :
  fromages flottants, neige dans la salle, poule postale, chauve-souris, baguette-carotte. Retour dans la salle pour la fin.
- Objets de toute la saison dans la besace : Wabbajack, le Cri (repli générique `s2.shout.none` + onde de choc), les septims.
- Personnages animés en boucles LTX pour les chapitres 11 à 16 (reprises quand le visage dérivait ou que le personnage tournait).
### Chaîne de production d'un chapitre (outils)
1. Décor vide : `tools/gen_s2_decors.sh` (3 graines) → `tools/s2_assets.py decor` + `tools/s2_retro.py decor`.
2. Personnages et objets : fiche validée détourée (`s2_assets.py sprite`), objets `tools/gen_s2_items.sh`.
3. Vie : `tools/gen_s2_life.sh` (vidéos LTX en boucle) → `tools/s2_life_extract.sh` (boucles + versions années 90) ;
   contrôler chaque planche `work/s2play/ltx/sheet_*.jpg` (pivot du buste, sourire, franges roses).
4. Décor animé : bande du décor en vidéo LTX (`tools/gen_s2_sea.sh` pour modèle) → `tools/s2_video.py`.
5. Scène `js/pointclick/scenes/s2_NN.js` (points chauds, zones de marche, avant-plans, lumières, effets), marquer `built`.
### À faire
- Chapitre 11 : boucles de repos et parole de l'apprenti, du maître d'armes, de Sheogorath et du perroquet (en calcul) ;
  sprites des métamorphoses (poulet en caoutchouc à poulie, mammouth à trois têtes) ; voix de la réplique du narrateur
  sur la transition (`nar.s2up`) et des répliques écrites à la main (regards, biscuit) ; expressions du héros (8 visages,
  face et profils, en boucles de parole LTX par émotion).
- Chapitres 17 à 28 sur la même chaîne.
- Génie des indices en HD, prologue (fête de la S1 → Sheogorath), validation des décors et animations par Stéphan.
- **Twin Peaks (22), petit homme en rouge** (validé par Stéphan) : ses 6 répliques `envers` ont leur voix retournée
  (FR/EN, livrées) ; le moteur les sous-titre toujours, en bas de l'écran façon télévision (`ENVERS` dans
  `js/pointclick/lang/s2_meta.js`, généré par `tools/s2_lang.py`), et joue ses boucles à l'envers pendant ces répliques.
  La réplique du héros sous Wabbajack (`c22.use.wab.redman.hero`) est aussi `envers` : voix retournée et sous-titre forcé,
  mais ses animations restent à l'endroit. Dans la scène : l'entité du petit homme porte `rev: true` (toutes ses animations à l'envers) ; pendant `c22.use.wab.redman`
  (« dans le bon sens », à l'endroit, sans sous-titre forcé), poser `fwd: true` le temps de la réplique.
