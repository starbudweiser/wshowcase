# Audit du pipeline : « Le Seau de Rivebois », avant la saison 2 (27/11/2026)

Audit en lecture seule, fait pour décider quoi reprendre des propositions (Codixel, PixelFX, Dot / Anti-Slop, Quest-n-Click). Rien n'est adopté.

## 1. Moteur (`js/pointclick/engine/`, environ 3 100 lignes, JS pur, aucune dépendance)
- **`game.js`** (861 lignes) : boucle, scènes, verbes, inventaire, dialogues, sauvegarde.
  - Canvas logique 480 × 270. Il passe à 960 × 540 (`k = 2`) pour les scènes `hd` de la saison 2 en rendu 2000.
  - L'interface (pièce des verbes, besace, bulles HTML) se pose par-dessus la scène.
  - API des scènes : `flag / set / count / has / give / drop / ent / say / ask / cut / wait / until / walkTo / walkEnt / fly / fade / card / goScene / end`.
  - `act()` appelle `scene.on(g, verbe, cible, objet)`. Sans réponse, la réplique par défaut vient de `look.<id>` / `use.<a>.<b>` / `def.*`.
  - Sauvegarde : `{ scene, flags, inv, hero }`. Elle est reportée pendant une cinématique (`cutN`), pour qu'un rechargement ne bloque jamais la partie.
- **Effets** :
  - `fx2.js` (S2, haute définition) : éclair du Wabbajack avec `peak()`, feux d'artifice, étincelles, fumée. Lumière **déjà additive** (`'lighter'`, halos pré-rendus lisses) pour `scene.fx.lights`, `glints`, `flies` et `e.aura`.
  - Éclairage des personnages par `scene.light` (teinte et lampes).
  - `ambient.js` (S1) : nuées d'oiseaux, poissons, roue en 3D, dragon, images de décor en boucle.
  - `night.js` (coucher de nuit S1), `winks.js` (clins d'œil), `glass.js`, `genie.js` (indices).
- **Scènes** (`js/pointclick/scenes/`) :
  - Une scène est un module JS : données (`bg`, `walk`, `fg`, `hot`, `ents`, `persp`, `light`, `fx`, `video`) plus code (`enter`, `intro`, `on`, `tick`, `wab`…).
  - **Les énigmes sont du code**, pas un graphe déclaré.
  - Registre : `scenes/index.js`, avec `CHAPTERS` (S1 : 10) et `CHAPTERS2` (S2 : 11 à 28, plus 17k / 17g selon la langue). Un chapitre peut avoir plusieurs salles (suffixes `b` / `c`).
  - Outils communs S2 : `s2_common.js` (Wabbajack, Sheogorath, chapitre suivant).
- **Données** :
  - `data/sheets.js` (S1) : `SPR` (nom → PNG), `ANIM` (`idle / talk / walk / walkF / walkB / walkQF / walkQB`, `fps`, `stride`), `HERO` (vues et cycles), `SLEEP`.
  - `data/sheets_s2.js` : `HERO2`, `HERO_LIFE` (cycles LTX par vue `r / l / f / b`), `LIFE` (boucles de repos, parole et marche par personnage), `ITEMS`, `COLORS`.
  - **`FACE_L` n'existe nulle part** dans le code. Les vues gauche et droite de S2 sont dessinées séparément, sans miroir.
- **Textes** : `lang/fr.js` et `en.js` (plus `fr2`, `s2_*`, `s2x_*`, `genie_*`). Mêmes clés ; une valeur en tableau donne une réplique tirée au hasard.
- **Pas de `CLAUDE.md` de projet** (ni à la racine du dépôt, ni dans `easter eggs/pointclick/`). La doc de méthode est dans `ETUDE.md`, `docs/` et les mémoires de Stéphan.

## 2. Assets (`assets/pointclick/`, 282 Mo)
- **S1** : décors PNG 480 × 270 à la racine (`rue.png`…), sprites `spr/*.png`, animations de décor `anim/<id>_<n>.png` plus `anim/index.json`, `sleep/`, `intro/`, `amb/` et `music/`.
- **S2** :
  - `s2/d_*.webp` : décors 960 × 540 ;
  - `s2/spr/*.webp` : sprites densité 2, nommés `s2:<nom>` ;
  - `s2/anim/<base>/<n>.webp` : 112 boucles LTX, décrites par `anim.json { fps, n, stride }` ;
  - `s2/cards/`, et des vidéos `v_*.mp4` (mer, hall) ;
  - `s2/90/` : la même saison convertie en années 90.
- **Nommage** : `d_` décor, `i_` objet, `p_` métamorphose ou personnage secondaire, `r_` vignette, suffixes `_i` (repos), `_t` (parole) et `_w` (marche) pour les boucles.

## 3. Génération
- `tools/gen_*.sh` (zsh) : des files de commandes `flux-image "<prompt>" [-i ref] -s WxH --seed N -o work/…`, c'est-à-dire **FLUX 3 Klein en MLX** par la commande locale.
  - Pas de diffusers, pas de Python FLUX ad hoc.
  - Styles fixés en tête de script (`ST`, `IT`) : « hand-painted 2000s point-and-click ».
- **`tools/gen_pixelart.py` n'existe pas.** La pixellisation se fait par :
  - `bg_pixelize.py` (décors 480 × 270, 64 couleurs, Floyd-Steinberg) ;
  - `sprites_pixelize.py` ;
  - `s2_retro.py` (S2 vers années 90 : décors 64 couleurs tramées ; sprites moitié taille, 56 couleurs sans tramage, contour d'un pixel ; palette commune par animation).
- **Marche** : pose clé FLUX, vidéo LTX sur place, puis `walk_cycle.py` (détourage, cadre commun, dérive compensée, palette commune, boucle). Méthode validée.
  - Aussi : `s2_cycle.py`, `s2_life_extract.sh`, `toon_*`, `key_fusion.py`.
- **Voix** : `gen_voices*.py`, `casting_s2.py`, `voices_manifest.mjs`.

## 4. Rendus années 90 / 2000
- **S1** : toujours années 90 (480 × 270, 64 couleurs).
- **S2** :
  - rendu 2000 par défaut (960 × 540, webp pleine couleur) ;
  - bascule `pc.s2retro` vers `s2/90/` (480 × 270), par `applyLook()` en cours de partie ;
  - les vidéos ont un repli en images converties (`video[].low`).

## 5. Conséquences pour les propositions
- **Validation des énigmes** : pas de graphe à lire, mais l'API des scènes est assez petite pour **faire jouer les vraies scènes** par un faux moteur. C'est le principe du solveur `--prove` de Quest-n-Click, réécrit en 250 lignes sans dépendance : `tools/check_softlock.mjs`, voir le §6.
- **Lumière** : une couche additive existe déjà en S2 (lisse, haute définition). La nouveauté PixelFX tient à trois choses :
  - des **pixels nets tramés**, cohérents avec le rendu 90 ;
  - des **effets à phases** ;
  - un **tampon couleur** séparé.
  Essai fait : voir le §7.
- **Codixel** : un seul fichier JS sous licence MIT, hors ligne, rigging par os sur **une** image. Intéressant pour les personnages secondaires (règle « 4-5 images par étape »). Il retouche une image générée, d'où l'essai isolé.
- **Dot / Anti-Slop** : rien d'utile au jeu (consignes génériques ; Dot passe par des API payantes ; Anti-Slop sans licence, orienté interface).

## 6. Vérificateur anti-blocage : résultats (`node tools/check_softlock.mjs`)
- **Méthode** :
  - les vraies scènes, les bouchons du moteur, l'appel de `peak()` des éclairs ;
  - une exploration en largeur de tous les verbes sur toutes les cibles et de chaque objet sur chaque cible ;
  - chaque branche des `g.ask`, élaguée quand un menu revient sans rien changer ;
  - une remontée depuis les sorties du chapitre.
- **Durée** : S2 entière en environ 10 s, S1 (sauf la rue) en moins d'une seconde.
- **Blocage réel, chapitre 13 (Minecraft)** : si le héros monte dans la tour par le Wabbajack (`use wabbajack -> hero`, possible dès que le mur est ouvert) **sans avoir pris le seau d'eau** (`bucket13`), il est coincé en haut (`s2_13b`). La seule sortie est le saut, qui demande `waterbucket13`, et rien ne permet de redescendre. 61 états bloqués, tous de cette cause.
- **Actions qui plantent** (pas un blocage : l'erreur est attrapée, rien ne se passe) :
  - `s2_11` : « prendre » le grog **dans l'inventaire** : `this.mid(g, e)` avec `e` absent ;
  - `s2_13b` : « prendre » le cube de fromage dans l'inventaire : même cause ;
  - `s2_14` : utiliser `cheese12` sur l'idole depuis l'inventaire : `swap()` lit `e.x` d'un acteur absent.
- **Branches mortes en partie normale** (pas des bugs) :
  - `giantMet` (prairie : le héros arrive toujours avec le fromage) ;
  - `counterRoll` (café : il a déjà la brioche).
- **Rue (chapitre 1)** : trop d'états (compteurs `tries`, `btalk`, `blocks`). Lancé jusqu'à 500 000 états ; résultat dans `work/softlock_rapport.txt`.
- **Limites** :
  - l'état interne aux modules (`let` hors de l'objet scène) n'est pas remis à zéro ;
  - les `tick()` ne sont pas joués ;
  - les nombres des objets scène (horloges) sont exclus de la clé ;
  - les compteurs au-delà de 12 sont ramenés modulo 12.

## 7. Couche de lumière (essai)
Fichiers :
- `engine/lightfx.js` ;
- `data/lightfx_essai.js` (réglages de `s2_11`) ;
- 2 lignes dans `game.js`.

Elle ne s'active qu'avec `?lightfx` ; sans ce paramètre, rien n'est calculé.
- **Tampon couleur** : Uint32, trame de Bayer. **Tampon lumière** : Float32, additif, en paliers tramés. Les deux sont agrandis sans lissage.
- **Torches** : lanternes et fenêtres de la taverne.
- **Objet clé** : il signale le tonneau aux biscuits, puis la caisse à la croix quand le héros a la carte. Phases : préparation 0,7 s, action 0,22 s, retombée 1,3 s, toutes les 6 s.
- **Captures** : `work/essai_lumiere/` (rendus 2000 et 90, sans couche, puis préparation, action, retombée, zoom × 4).
- **Constat** :
  - très cohérent en **rendu 90** (la trame se fond dans la palette 64 couleurs) ;
  - en **rendu 2000**, la trame en damier se voit sur les décors peints : il faudrait la lueur lisse existante en 2000 et la trame en 90 seulement ;
  - l'effet à phases sur l'objet clé fonctionne, mais c'est un indice visuel fort : à réserver au génie, ou à un mode « aide ».
