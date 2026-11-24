# Saison 2 du point & click (crossover) — état et plan

Proposition : `crossover.html` (artifact privé https://claude.ai/artifact/BfYNc2q3hebzp61ECw82yp).
Prototypes de rendu : https://claude.ai/artifact/Hbie6aV5LJGNajt7JZMpVR (`tools/proto_rendu_s2.py`).

## Décidé par Stéphan (23/11/2026)
- Pirouette : Sheogorath s'invite à la fête (seau-portail, une meule de fromage par monde, fondue finale) ;
  chaque chapitre s'ouvre sur « Hé, toi. T'es enfin réveillé. »
- Le Wabbajack est l'outil central des énigmes ; le héros le garde à la fin (bonus dans les chapitres 1 à 10).
- 16 chapitres (11 à 26) : Monkey Island, Sam & Max, Minecraft, Indiana Jones, Retour vers le futur, Harry Potter,
  Table ronde, Conan + L'Histoire sans fin, intermède du docteur House (19), Jurassic Park, Stranger Things,
  Twin Peaks, Dexter, Matrix, Seigneur des Anneaux, Portal (finale, où House revient diagnostiquer Sheogorath).
  Monkey Island : avec l'apprenti pirate blond (Guybrush) et le capitaine fantôme (LeChuck), vaincu à la bière de racine.
  House ne dit que ses répliques cultes, courtes et détournées (« Tout le monde ment », « C'est jamais le lupus »,
  « Les gens ne changent pas »).
- Épisodes de rechange par langue : chapitre 17 = Kaamelott (FR) / Sacré Graal (EN).
- Rendu : 960 × 540, 16 millions de couleurs (double exact du canevas 480 × 270 de la saison 1). Le style peint
  FLUX ne change pas ; seules la définition et la palette changent.

## Exigence de mise en scène (Stéphan, 24/11/2026, plus forte encore qu'en saison 1)
« On va vers le mieux » (évolution années 90 → 2000) : les bugs restent une parodie dans les dialogues, jamais dans le
rendu. Remarques faites sur la saison 1 (charrette dessinée devant ses passagers, bois coupé au bord de l'écran,
charrette qui traverse une échoppe, passage derrière le pont par simple réduction de taille, membres figés pendant les
déplacements, personnages plats comme découpés), donc pour toutes les scènes et animations de la saison 2 :
- occultation correcte par des avant-plans (calques devant / derrière, personnages dans un véhicule assis dedans) ;
- cadrages sans bord coupé ni vide ;
- trajectoires qui suivent la perspective du décor (pont, rampes, chemins), avec une échelle continue selon la profondeur ;
- vrais cycles de marche (profil, face, dos) pour chaque personnage qui se déplace, pas seulement le héros ;
- personnages qui se tournent selon leur direction et vers leur interlocuteur ; animés aussi quand ils ne parlent pas.

### Méthode des cycles de marche (imposée le 24/11/2026 après les retours sur la saison 1)
Cycles faits pose par pose en FLUX rejetés (« il boite ») : corps qui pivote d'une image à l'autre, équipement qui
change ou saute, pas inégaux, cheval qui trotte puis se cabre. Désormais, pour chaque personnage et chaque vue :
1. une seule pose clé, vérifiée (zoom sur mains, pieds, équipement) ;
2. une vidéo LTX de marche sur place à partir de cette pose, caméra qui suit le personnage ;
3. extraction d'un cycle de 8 images (même cadre, même palette), contrôlé image par image avant de le montrer :
   phase des jambes, bras opposés aux jambes, équipement constant.
Outils de la saison 1, à reprendre : `tools/gen_walk_ltx.sh` et `tools/walk_cycle.py` (branche
`claude/easter-egg-pointclick-6eb4be`, pas encore commités au 24/11 : attendre le signal de la session principale).

## Fait
- Scripts courts des 15 chapitres + rechange, avec les clins d'œil « Wabbajack sur… ».
- Visuels d'ambiance de tous les chapitres, contrôlés, exportés en 960 × 540 (`img/`). Sources FLUX dans
  `work/crossover/` (ignoré par git), scripts `tools/gen_crossover*.sh`.
- Planches de personnages (39, Sheogorath et Wabbajack compris) : une image FLUX par personnage, fond magenta,
  contrôlée de près ; costumes vérifiés sur des sources en ligne (Dexter d'après la référence de Stéphan : polo corail,
  lunettes au col ; jamais le visage des acteurs). Sources `work/crossover/persos/`, sélection `tools/persos_export.py`
  → `crossover/persos/`, scripts `tools/gen_persos_s2*.sh`, `gen_dexter.sh`.
- Bible de développement en PDF, français et anglais : `docs/saison2_bible_fr.pdf`, `docs/saison2_bible_en.pdf`
  (contenu `tools/s2_content.py`, génération `tools/saison2_pdf.py` ; à relancer après chaque changement).

## À faire
1. Planches de personnages validées par Stéphan le 23/11, après reprises d’après ses références (Dexter, sa sœur, Arthur, Perceval, Karadoc, Indiana, Conan, le paléontologue, Sam & Max ; Morpheus homme noir, Gandalf très grand). Suite : poses clés (planche avant toute animation).
2. Moteur : canevas 960 × 540, saison 1 affichée ×2 sans changement ; interface et police mises à l'échelle.
   **Héros orienté** (demande de Stéphan, 24/11) : comme en saison 1, il se tourne vers son interlocuteur et vers la
   direction où on le fait marcher (vues gauche, droite, face, dos au rendu 960 × 540). Les visuels S2 le respectent déjà
   (références `work/crossover/hero_left.png`, `hero_front.png`, `hero_right.png`, tirées des vues de la saison 1).
   **Expressions du héros** (demande de Stéphan, 24/11) : plus de sourire figé au repos ; série de visages par vue
   (neutre, perplexe, agacé, surpris, inquiet, blasé, satisfait, dégoûté) choisie par réplique et par réaction ;
   visage neutre et clignements quand il ne parle pas. Les nouveaux visuels donnent une expression précise au héros.
   **Vues du héros S2 faites** (24/11) : profil gauche, trois-quarts gauche, face, trois-quarts droit, profil droit, dos,
   en pied, même costume (pagne de cuir plissé à sacoches), expression neutre : `work/crossover/hero_s2/sel_*.png`
   (script `tools/gen_hero_s2_views.sh`). Scènes refaites avec elles (héros tourné vers son interlocuteur, expression précise) : pont (Cri de profil), Indiana, Sam & Max, Monkey Island, puis Minecraft, Retour vers le futur, Harry Potter, Kaamelott, Conan, House, Jurassic Park, Stranger Things, Dexter, Matrix et Portal (`tools/gen_s2_scenes_vues2.sh`, `gen_s2_scenes_vues3.sh`).
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
   - ajouter dans `hints.js` les étapes des chapitres 11 à 26 (et de Sacré Graal), 3 indices gradués par étape
     en FR/EN, voix du génie générée depuis le casting mCASTING (clé `genie`).
6. Textes FR/EN, voix, sons, intégration et essais. **Casting en cours** (24/11) : projet mCASTING « Jeu point & click —
   saison 2 » (42 personnages, voix proposée + rechange, `tools/casting_s2.py` → `crossover/casting_s2_*.json`).
   Choix de Stéphan : House a la voix du narrateur (gag, le narrateur s'en offusque), clones de la bibliothèque pour
   l'archéologue, le savant, le paléontologue et le barbare ; voix de la saison 1 reprises pour Arthur, Perceval,
   Karadoc et le magicien. Reste : écoute et validation par Stéphan, puis `write_casting`.
