# Étude de faisabilité : le jeu d'aventure point & click de wSHOWCASE

Projet : mini-jeu d'aventure (esprit LucasArts / Sierra, années 90) dans une fenêtre du faux Mac, sur le bureau Skyrim.
Ce document répond aux questions techniques posées, puis fixe l'architecture et le plan de la première scène.
Rédigé le 11/11/2026. **Conclusion : faisable, sans dépendance, léger. Recommandation : moteur maison en Canvas 2D.**

---

## 1. Résumé des décisions proposées

| Sujet | Décision proposée | Alternative |
|---|---|---|
| Moteur | **Maison**, Canvas 2D + modules ES, ~40 Ko | Phaser 3 (~1 Mo) |
| Résolution interne | **320 × 180** (16:9), pixels gros, mise à l'échelle entière du navigateur | 480 × 270 (plus fin) |
| Interface de jeu | Verbes, inventaire, phrase et dialogues en **HTML** par-dessus le canvas, police pixel | tout dans le canvas |
| Cadre autour du jeu (menu, options, sauvegarde) | **Socle** | n/a |
| Entrées | Pointer Events (souris + tactile), même code | n/a |
| Sauvegarde | `localStorage` (`wsc.pc.save`), automatique à chaque événement | export/import JSON |
| Décors | **FLUX 3 Klein local → réduction 320×180 → palette commune 48 couleurs → retouche** (essai concluant, voir §7) | peindre à la main |
| Personnages | Générés par script Python (calques de pixels, animation cohérente), pas par IA | FLUX + retouche |
| Sons | **Synthèse Web Audio** (comme `js/audio.js`), musique originale en boucle synthétisée | fichiers de `RESSOURCES` |
| Voix | Aucune (texte + « blips » de dialogue) | Qwen3-TTS local, plus tard |
| Chargement | À la demande, au double-clic sur l'icône ; une scène = un chargement | n/a |

---

## 2. Phaser ou moteur maison

Ce qu'il faut : une scène 2D fixe, des sprites, un clic = une action, de la marche sur un plan, des dialogues, un inventaire.
Pas de physique, pas de particules, pas de caméra complexe.

| Critère | Phaser 3 | Moteur maison |
|---|---|---|
| Poids | environ 1 Mo (≈ 350 Ko compressé), imposé dès le clic | **~40 Ko** de moteur |
| Étape de build | aucune si chargé depuis un `.min.js` du dépôt, mais le dépôt grossit | aucune, modules ES comme le reste du site |
| Ce qu'il apporte | rendu, boucle, audio, tweens, entrées, atlas | rien d'inutile |
| Ce qu'il n'apporte **pas** | verbes, inventaire, dialogues, marche sur polygones, scripts de scène : à écrire quand même | idem, à écrire |
| Pixel art net | possible, réglages à faire (`pixelArt`, `roundPixels`) | `imageSmoothingEnabled = false` + CSS `image-rendering: pixelated` |
| Intégration dans une fenêtre `wm.js` | canvas géré par Phaser, redimensionnement à surveiller | un `<canvas>` dans `.wbody`, contrôle total |
| Cohérence avec le site | corps étranger (licence, mises à jour) | même style que `js/demos/*` |
| Faire évoluer / déboguer | il faut connaître Phaser | on lit tout le code |

**Choix : moteur maison.** Le gain de Phaser (boucle, atlas, audio) tient en quelques dizaines de lignes ; le coût (1 Mo, dépendance
externe, dépôt plus lourd) est disproportionné pour un easter egg « léger ».
Le moteur est écrit comme une petite bibliothèque d'aventure : si le jeu grossit, rien n'empêche de le garder.

---

## 3. Résolution et rendu

- Canvas **320 × 180** (16:9). Les décors d'âge d'or sont en 320 × 200, mais le 16:9 se loge mieux dans la fenêtre et dans le site.
- Mise à l'échelle par CSS (`width/height: 100%`, `image-rendering: pixelated`), le faux Mac étant déjà mis à l'échelle
  par `S.scale` : l'entier exact n'est pas garanti de toute façon, le rendu reste net car les pixels sont gros.
- La constante `W,H` est une seule valeur du moteur : passer à 480 × 270 est un changement de constante + nouveaux décors.
- Rendu : fond (image) → sprites triés par `y` (profondeur) → calques d'avant-plan (zones du décor redessinées par-dessus les
  personnages, ex. auvent du marchand) → effets. Mise à l'échelle des personnages selon `y` (perspective LucasArts).
- Boucle `requestAnimationFrame` ; arrêtée quand la fenêtre est fermée ou réduite (`onclose`, événement `wins`) : zéro coût au repos.
- Mode `prefers-reduced-motion` : désactive le tremblement d'écran et les flashs.

## 4. Intégration dans le faux Mac (`js/wm.js`)

- `wm.open({ id: 'pointclick', appId: 'pointclick', title, w, h, cls: 'pcwin', space: 'skyrim', build, onclose })` comme `js/player.js`.
  Fenêtre d'environ 980 × 700 : barre de titre + scène 16:9 (960 × 540 à l'échelle ×3) + bandeau de verbes (≈ 150).
  Le stage visible fait 766 px de haut (900 − barre des menus − Dock) : la fenêtre loge, et le jeu s'adapte si on la redimensionne
  (`ResizeObserver` sur `.wbody`, le canvas garde son ratio, bandes noires sinon).
- **Chargement à la demande** : un clic sur l'icône fait `import('./pointclick/boot.js')`, qui seul tire le moteur, la scène et le décor.
  Au démarrage du site : 0 octet de plus.
- **Un seul accroc dans `js/spaces.js`** (consigne : modification minimale). L'essai abandonné (commit `2f4144e`) accrochait son icône
  par un objet `EXTRA` écrit en dur dans `spaces.js` avec une branche `if (a.fx)` dans `run` et dans le rendu du libellé.
  Proposition : un petit registre `js/eggs.js` (une ligne par easter egg : id, bureau, icône, libellé fr/en, fonction de chargement),
  et dans `spaces.js` trois retouches génériques seulement : importer `EGGS`, l'ajouter à `deskList`, et laisser `run` appeler `a.load()`
  quand il existe. Les deux sessions parallèles (point & click, déchirure 3D) n'ajoutent alors chacune qu'**une ligne dans `eggs.js`**,
  et le `spaces.js` est identique des deux côtés : fusion sans conflit si les deux branches reprennent ce même patch.
- Coordonnées souris : `getBoundingClientRect()` du canvas (tient compte de la transformation `scale` du faux Mac), jamais `clientX` brut.
- Focus : les raccourcis clavier du jeu (Échap = menu, 1–5 = verbes, Espace = passer la réplique) ne répondent que si la fenêtre est la
  fenêtre active (`S.active`), pour ne pas interférer avec ⌘K et ⌥← ⌥→ du site.
- Aucune requête réseau : le jeu n'envoie rien (la mention « les démos n'envoient aucune donnée » reste vraie).
- Non listé dans Finder / Spotlight (c'est un easter egg) ; accessible par l'icône et, pourquoi pas, par un lien profond `#skyrim/seau`.

## 5. Souris et tactile

Un seul code, Pointer Events, sur le canvas :

| Geste | Effet |
|---|---|
| Survol (souris) | la phrase du bas se met à jour : « Utiliser Seau avec marchand » ; curseur en forme de main |
| Clic | applique le verbe choisi à la cible ; sur le décor vide : marcher jusque-là |
| Clic droit | action par défaut de la cible (Regarder) |
| Tactile : toucher | choisit la cible, puis un petit menu de 5 verbes apparaît sur place (pas de survol sur mobile) |
| Appui long | Regarder |
| Clavier | 1–5 = verbes, Échap = menu, Espace/Entrée = passer la réplique, Tab = objets cliquables en surbrillance (accessibilité) |

Le geste de glissement horizontal du faux Mac (changer de bureau) est bloqué au-dessus de la fenêtre de jeu (`stopPropagation`
sur `touchstart/touchend` du canvas), sinon un balayage dans le jeu changerait de bureau.

## 6. Sauvegarde

- `localStorage`, via le même `store` que le site (`wsc.pc.save`), try/catch autour de chaque accès (navigation privée).
- Contenu : version du format, scène courante, position du héros, liste d'objets d'inventaire, drapeaux d'histoire (`flags`),
  objets déplacés dans les scènes, langue du jeu, compteur de choux, etc. Quelques centaines d'octets.
- Sauvegarde **automatique** à chaque changement d'état important ; menu : *Continuer*, *Nouvelle partie*, *Exporter / Importer* (JSON copié
  dans le presse-papiers : permet de reprendre ailleurs sans compte).
- `version` + fonction de migration pour pouvoir faire évoluer le jeu sans casser les parties.

## 7. Production des graphismes

**Essai réalisé** (11/11/2026, 16 s de calcul local, gratuit) : prompt FLUX 3 Klein 1280×720 « pixel art, 90s adventure game background,
VGA palette, warm saturated… village nordique », puis réduction Lanczos à 320 × 180 et quantification à 32 couleurs avec tramage
Floyd–Steinberg (script Pillow, 27 Ko en PNG indexé). Résultat dans `easter eggs/pointclick/etude/essai_rue_320x180.png` (et la version
480 × 270, 67 Ko). Rendu chaud et saturé, très proche de l'esprit voulu ; défauts à retoucher à la main : arêtes un peu molles,
détails parasites sur les toits, absence de lisibilité des zones cliquables (à repeindre par-dessus).

Chaîne retenue :

1. **Décor** : FLUX 3 Klein (`flux-image`, 1280×720, graines fixées, préfixe de style commun à tous les décors) → réduction à 320×180 →
   quantification sur une **palette maîtresse unique de 48 couleurs** (même jeu de couleurs pour tout le jeu = cohérence) → retouche manuelle
   par script (nettoyage, anti-bavure, ciel) → PNG indexé.
2. **Calques d'avant-plan** : zones du décor à repasser devant les personnages, définies par polygones dans le fichier de scène
   (pas d'image supplémentaire : on redessine la même image, découpée).
3. **Personnages** (héros, marchand, garde, cheval, géant…) : **générés par script Python** à partir de calques de pixels (corps,
   armure, casque à cornes…) : animation de marche cohérente (4 images côté, 1 de face, 1 de dos), variantes (marchand avec un seau sur la tête).
   L'IA ne sait pas produire une marche cohérente image par image ; un script, si. Les visages se dessinent à la main au pixel.
4. **Objets d'inventaire** : 16 × 16 ou 24 × 24, dessinés par script ou FLUX puis réduits.
5. **Fiche des 5 bugs** : chaque bug a son effet visuel (seau qui flotte, cheval vertical, objet dans les étoiles, choux qui s'entassent,
   charrette qui explose) en petites animations par code (translation, rotation, particules de pixels).
6. Scripts et prompts conservés dans `easter eggs/pointclick/tools/` : tout est régénérable, rien n'est téléchargé.

**Droits** : aucune image, aucun son, aucune voix, aucune musique ni aucun logo de Bethesda ou des jeux LucasArts / Sierra. Les noms de
lieux (Rivebois, Blancherive) et la mythologie du jeu (Enfant de Dragon, bugs célèbres) relèvent de la parodie : personnages et dialogues
entièrement originaux, aucun nom propre de personnage repris.

## 8. Sons et musique

- **SFX et musique synthétisés** par Web Audio, sans fichier : pas, clic, ramassage, clang du seau, boing du cheval, « pouf » physique,
  bruitage de dialogue (« blip » par lettre, hauteur selon le personnage). Même technique que `js/audio.js` (sons du faux Mac) ; le jeu
  respecte le réglage de son du site (`sfx.on`, `sfx.vol`).
- **Musique** : petite boucle originale (mode dorien, flûte + bourdon synthétisés, ~16 mesures), composée en code. Poids : quelques Ko.
- La banque `RESSOURCES` (SFX de pas, musiques) reste utilisable pour des **échantillons courts** (pas sur sol, poules…). À éviter : musiques
  Epidemic Sound, dont la licence interdit la redistribution des fichiers bruts dans un dépôt public. SFX gratuits : à vérifier un par un.
- Autoplay : le moteur audio ne démarre qu'au premier clic dans le jeu (règle des navigateurs) ; bouton son dans le menu.

## 9. Textes, langues, interface

- **Textes du jeu** : un fichier par langue, `js/pointclick/lang/fr.js` (rédigé en premier) et `en.js`, mêmes clés, aucun texte en dur dans le code.
  Chargé dynamiquement selon `lang()` du site (`js/i18n.js`) ; changement de langue à chaud (événement `lang`).
- **Texte de l'interface du site** (titre de fenêtre, libellé d'icône) : `js/i18n.js` comme le reste, ou le registre `js/eggs.js` (fr/en).
- **Cadre autour du jeu** (écran-titre, Nouvelle partie / Continuer / Options / Exporter, boîte de dialogue de pause) : composants **Socle**
  (`Dialog`, `Button`, `Segmented`), avec le nom de l'appli selon la règle (« m » coloré dans les fenêtres, pas dans les menus).
- **Dans la partie** : barre de 5 verbes + inventaire dans le style du genre (police pixel, palette chaude du jeu) : c'est le jeu, pas une appli.
  La police pixel sera une police libre (OFL) copiée dans `assets/pointclick/` avec sa licence, ou une police de la banque `RESSOURCES`.
- Dialogues : bulles au-dessus des têtes (LucasArts), couleur par personnage, `Espace` pour accélérer.

## 10. Structure des fichiers

```
js/eggs.js                          registre des easter eggs (une ligne par œuf)
js/spaces.js                        3 retouches génériques : EGGS dans deskList, run → a.load()
js/pointclick/
  boot.js                           ouvre la fenêtre (wm.open), crée le moteur, charge la scène de départ
  engine/
    game.js                         boucle, état, changement de scène, cinématiques (async/await)
    input.js                        pointer events souris/tactile, survol, appui long, clavier
    walk.js                         zone de marche (polygones), A* sur grille, échelle de profondeur
    render.js                       fond, tri par y, calques d'avant-plan, sprites, effets
    ui.js                           verbes, inventaire, phrase du bas, bulles (DOM)
    dialog.js                       file de répliques, choix de dialogue
    save.js                         sérialisation, migrations, export/import
    sound.js                        Web Audio : SFX synthétisés, musique, blips
    lang.js                         chargement des textes par langue
  scenes/
    rue.js                          scène 1 : zones, objets, personnages, scripts
  data/
    items.js                        objets d'inventaire (id, icône, combinaisons)
  lang/fr.js, en.js                 tous les textes du jeu
css/pointclick.css                  fenêtre, bandeau de verbes, écran-titre (Socle + style du genre)
assets/pointclick/
  rue.png                           décor (palette indexée)
  hero.png, merchant.png, ...       planches de sprites
  items.png                         icônes d'objets
  font.woff2 (+ licence)            police pixel
easter eggs/pointclick/
  ETUDE.md                          ce document
  etude/                            images d'essai
  tools/                            scripts de génération des décors et sprites (Python, flux-image)
```

Un sol = un fichier de scène ; ajouter une scène = ajouter un fichier dans `scenes/`, des phrases dans `lang/`, une image dans `assets/`.

## 11. Moteur : modèle de scène et de script

Une scène est un objet de données et de petites fonctions asynchrones, lisibles :

```js
export default {
  id: 'rue', bg: 'assets/pointclick/rue.png',
  walk: [[[20,150],[300,150],[310,175],[10,175]]],          // polygones marchables
  hotspots: [{ id: 'merchant', poly: [...], name: 'n.merchant', default: 'look' }],
  async on(verb, id, g) {                                    // g = API du moteur
    if (verb === 'use' && id === 'merchant' && g.item === 'bucket') {
      await g.walkTo('merchant'); await g.say('hero', 'rue.bucket1'); g.set('merchant', 'blind'); ...
    }
  }
}
```

- API `g` : `say`, `walkTo`, `face`, `give`, `take`, `has`, `flag/set`, `wait`, `anim`, `shake`, `sfx`, `goto(scene)`.
- Pendant une cinématique l'entrée est verrouillée (sauf *passer la réplique*).
- Réponses par défaut drôles pour toute combinaison verbe × cible non prévue (c'est le cœur de l'humour du genre).

## 12. Les cinq mécaniques de bugs dans le moteur

| Bug | Besoin moteur | Scène prévue |
|---|---|---|
| 1. Vol par seau interposé | objet d'inventaire « Seau » + cible PNJ ; état `blind` du PNJ (sprite avec seau sur la tête, ne réagit plus au vol) | **1. Rue principale (livrée en premier)** |
| 2. Équitation verticale | PNJ-monture ; déplacement à 90° (zone de marche verticale à l'état `riding`) | 2. Chemin du moulin |
| 3. Programme spatial des géants | PNJ géant ; trajectoire balistique d'un objet (ou du héros) hors écran, retour avec la gravité | 3. Prairie des géants |
| 4. Anomalie physique des choux | compteur d'objets empilés dans un conteneur ; emballement visuel (jitter) puis explosion de pixels | 4. Marché / charrette |
| 5. Garde « flèche dans le genou » | **service transversal** : tout garde peut interrompre une action (probabilité) ; bloque une sortie | présent dès la scène 1 |

## 13. Scène 1 : « Rue principale de Rivebois » (livrable 3)

Décor : rue de terre au soleil couchant, maisons à toits de chaume, étal du marchand à gauche, pont de pierre et rivière au fond,
sortie au fond (pont) gardée par un garde. Ton : parodie nostalgique, déclaration d'amour aux 15 ans du jeu.

Chaîne de l'énigme :
1. Le héros arrive, fauché, un casque à cornes sur la tête (*Regarder* soi-même : gag sur la visibilité des cornes).
2. Le **marchand** refuse de vendre le **rouleau au miel** (l'objet clé) et garde un œil sur son étal : *Prendre* échoue (« Je vous vois »).
3. Un **seau** traîne près du puits / de la maison : *Prendre*.
4. *Utiliser* **Seau** sur le **marchand** : il se retrouve le seau sur la tête, aveugle et amnésique (« Qui suis-je ? Pourquoi suis-je sombre ? »).
5. *Prendre* le **rouleau au miel** : réussi. *Parler* au marchand (désormais perdu) : dialogue absurde.
6. Le **garde** du pont : *Utiliser* le rouleau avec lui l'amadoue (ou il rappelle qu'il « était aventurier avant d'avoir pris une flèche dans le genou ») :
   fin du chapitre 1 « À suivre… » vers le chemin du moulin.

Autres éléments cliquables, pour les blagues : poules, panneau, puits, maison fermée, rivière, ciel, soi-même, inventaire.
Verbes : **Aller vers, Prendre, Utiliser, Parler, Regarder** (+ « avec » pour Utiliser). Inventaire de 8 emplacements.

## 14. Poids estimés

| Élément | Taille |
|---|---|
| Moteur (JS, non minifié) | 35–45 Ko |
| Scène 1 (JS + textes fr/en) | 15–20 Ko |
| Décor scène 1 (PNG indexé 320×180) | 25–35 Ko |
| Sprites + objets + police | 40–80 Ko |
| **Total à l'ouverture** | **< 200 Ko** |
| Jeu complet (5–6 scènes) | 0,8 à 1,5 Mo, chargé scène par scène |

GitHub Pages compresse en gzip : environ le tiers de ces valeurs en transfert.

## 15. Risques

| Risque | Parade |
|---|---|
| Cohérence visuelle entre décors IA | préfixe de style commun, palette maîtresse unique, retouche |
| Personnages animés | scripts de sprites (pas d'IA) ; héros d'abord, autres ensuite |
| Humour et traduction | dialogues fr écrits en premier, puis adaptation (pas une traduction littérale) en anglais |
| Fusion avec la 2ᵉ session (`spaces.js`) | registre `eggs.js` ; patch `spaces.js` identique des deux côtés |
| Propriété intellectuelle | parodie, personnages et décors originaux, aucune ressource de Bethesda ni des jeux cités |
| Tactile peu précis | menu de verbes contextuel, cibles agrandies (zones ≥ 24 px de décor) |

## 16. Plan

1. Étude soumise à Stéphan (cette étape).
2. Moteur de base + scène 1 jouable de bout en bout (décor FLUX retouché, héros et marchand scriptés).
3. Essais dans le navigateur (wCLAUDE), captures.
4. Scènes suivantes (une par bug), à la demande, une à la fois.

---

# Addendum (11/11/2026) : décisions de Stéphan et état de la réalisation

## Décisions validées

| Question | Réponse |
|---|---|
| Moteur | Moteur maison (Canvas 2D) |
| Résolution | **480 × 270** (plus fin que 320 × 180) |
| Musique et bruitages | Synthèse originale |
| Voix | Texte seul + « blips » |
| Icône du bureau | Seau à cornes, libellé « Seau » / « Bucket » |
| Style | **Au plus près de « Simon the Sorcerer »** (référence donnée : https://www.ppa.pl/gry/simon-the-sorcerer-ii.html) |

Relecture de la référence : décors peints très saturés avec tramage VGA, personnages petits mais détaillés aux proportions adultes,
visages ironiques, contours sombres, panneau de commande bronze et rouge sombre sous la scène. **Les premiers sprites dessinés par code
(têtes énormes, trop « enfantins ») ont été abandonnés** : les personnages sont maintenant peints par FLUX 3 Klein local, puis détourés
et réduits (voir ci-dessous).

## Ce qui a changé par rapport à l'étude

- **Personnages** : générés par FLUX (fond magenta, style « cartoon peint à la main, ironique, proportions adultes »), détourés par
  `tools/sprites_pixelize.py` (clé couleur, contour sombre de 1 px, 56 couleurs, même facteur d'échelle pour toutes les poses d'un personnage).
  Poses du héros par édition avec image de référence (profil, foulée), de face pour parler. Chaîne complète rejouable :
  `tools/gen_chars.sh`, `gen_variants.sh`, `gen_items.sh`, puis `tools/build_sprites.sh`.
- **Décor** : FLUX 1280×720 → 480×270, 64 couleurs (`tools/gen_rue.sh`, `tools/bg_pixelize.py`). Repères de Skyrim ajoutés sur demande de
  Stéphan : dragon dans le ciel, Gorge du Monde et ses marches, mammouth et géant au loin, pignons en têtes de dragon, enseigne d'auberge
  au géant endormi, scierie, fleurs bleues de montagne, choux et fromages à l'étal, charrette (clin d'œil au bug des choux).
- **Animation** : 2 poses de profil (+ rebond et inversion horizontale) pour la marche, pose de face pour parler (léger écrasement en
  rythme), pas de dessin image par image. Le marchand a 2 états (normal, seau sur la tête, bras levés).
- **Accroche dans `js/spaces.js`** : 5 lignes (import de `EGGS`, ajout à `deskList`, `run` appelle `a.load()`, libellé `a.label()`,
  remise à zéro des positions). Le reste est dans `js/eggs.js` (une ligne par œuf).
- **Panneau** : style des aventures peintes (bronze et rouge sombre), verbes en deux lignes, huit emplacements d'inventaire, phrase du bas.
  Écran-titre, fin de chapitre : composants Socle (`.socle`, `.sbtn`).

## Structure réelle

```
js/eggs.js                          registre des easter eggs
js/pointclick/boot.js               ouvre la fenêtre (wm.open), charge le moteur à la demande
js/pointclick/engine/game.js        boucle, rendu, entrées, verbes, inventaire, dialogues, scripts async, cinématiques, sauvegarde, fin
js/pointclick/engine/walk.js        zone de marche (polygones) + A* sur grille + lissage
js/pointclick/engine/sound.js       SFX et musique synthétisés (Web Audio), respecte le réglage de son du site
js/pointclick/engine/lang.js        textes par langue (valeur en tableau = réplique aléatoire)
js/pointclick/engine/save.js        sauvegarde localStorage (wsc.pc.save), export/import JSON
js/pointclick/data/sheets.js        registre des sprites et objets d'inventaire
js/pointclick/scenes/rue.js         scène 1 : zones, personnages, scripts de l'énigme du seau
js/pointclick/lang/fr.js, en.js     tous les textes (≈ 250 clés par langue)
css/pointclick.css                  fenêtre, panneau de verbes, dialogues, écran-titre
assets/pointclick/                  rue.png, spr/*.png, icon.png, police VT323 (OFL)
easter eggs/pointclick/tools/       scripts de génération (FLUX) et de pixellisation
```

Poids chargé à l'ouverture : environ 350 Ko (moteur + textes ≈ 60 Ko, décor 70 Ko, sprites 40 Ko, police 150 Ko).

## Sources d'écriture (indiquées par Stéphan)

Culture « meme » de Skyrim et bugs du moteur physique : Reddit r/skyrim (programme spatial des géants, mammouths qui tombent du ciel),
vidéos de bugs et compilations de glitchs de physique, Know Your Meme (flèche dans le genou, rouleau sucré volé, PNJ arrogant qui répète
ses répliques), r/SkyrimMemes (furtivité absurde, « ce doit être le vent »). Principe retenu : **clins d'œil reformulés, jamais de
réplique recopiée mot pour mot** (le texte est une parodie originale ; aucun nom propre de personnage n'est repris).
Déjà dans la scène 1 : le garde à la flèche dans le genou (répété comme un tic), « ce doit être le vent » devant un marchand au seau sur la tête,
le garde qui devine « on vous a volé votre rouleau ? » (inversé : le héros vient le voler), la poule intouchable, le cri « FUS RO DAH ».
Réservé aux scènes suivantes : le PNJ arrogant en boucle propulsé par un « coup de massue » improvisé, le cavalier sans tête qui a perdu
son cheval, le mannequin d'armure qui bouge quand on tourne le dos (scène de maison), le papillon qui propulse en l'air.

## À faire / limites connues

- Marche à deux poses seulement : un cycle plus fluide demande des poses supplémentaires (FLUX en édition, ~80 s par pose).
- Pas de détourage manuel fin : quelques franges de couleur sur les sprites, à retoucher.
- Tactile : menu de verbes au toucher écrit mais non testé sur appareil ; clavier (1 à 5, Espace, Échap) testé.
- Scènes 2 à 5 (cheval vertical, géants, choux, gardes) : à faire, une par une.

---

# Addendum 2 (12/11/2026) : décor vivant et scène 2

## Décor vivant sur tous les écrans (`js/pointclick/engine/ambient.js`)

Chaque scène déclare une liste `ambient`. Types disponibles : **dragon** (sprite à deux poses d'ailes qui traverse le ciel en boucle, cliquable),
**oiseaux** (« v » qui battent des ailes), **water** (rivière : chaque ligne du décor ondule + éclats de lumière), **wheel** (roue de moulin :
disque du décor qui tourne), **bob** (animal qui respire, ex. le mammouth), **sway** (fleurs et herbes dans le vent), **smoke** (cheminée),
**glow** (lueur vacillante). Tout est calculé à partir de l'image du décor : aucun fichier de plus.
Le dragon peint a été retiré du décor de la scène 1 (retouche FLUX) et remplacé par un vrai sprite.

## Scène 2 : « Le chemin du moulin » (`js/pointclick/scenes/mill.js`)

Équitation verticale : potager → **carotte** → la donner au **cheval** → *Utiliser le cheval* : il galope jusqu'à la falaise puis la gravit à
90 degrés (sprite du cavalier pivoté, secousses d'écran, bruitages) → corniche → **meule de fromage dorée** → redescente → sortie → fin
du chapitre 2 (teaser du chapitre 3, les géants). La meule servira d'appât dans la scène des géants. Passage entre les scènes : pont de la
scène 1, fondu au noir. Nouveaux visuels FLUX : décor du moulin, dragon (2 poses), cheval, cheval + héros, carotte, meule
(`tools/gen_scene2.sh`, puis `tools/build_sprites.sh`).

## Musiques (une par scène, `js/pointclick/engine/sound.js`)

Entièrement synthétisées (Web Audio, aucun fichier audio, compositions originales) avec l'esprit de la musique de Skyrim : modes nordiques
(ré dorien, la dorien, ré éolien), réverbération de grande salle, **chœur d'hommes** (scies désaccordées + formants « a » + vibrato),
**cuivres graves**, **cordes**, luth, flûte, violon, **tambours de guerre**. Aucune mélodie n'est reprise du jeu.
- `rue` (Rivebois) : calme et large, cordes, luth en arpèges, flûte, bourdon grave.
- `mill` (moulin) : gigue de voyage à 6/8, violon, luth, bodhrán.
- `meadow` (géants) : marche épique, chœur d'hommes, cuivres, tambours de guerre, roulement à la fin de la boucle.
Chaque piste dure 8 mesures en boucle ; au changement de scène, fondu enchaîné (1,2 s). Une scène peut forcer sa piste avec `music: 'id'`.
Volume vérifié à l'analyseur (pics 0,11 à 0,24 : pas de saturation).

## Scène 3 : « La prairie des géants » (`js/pointclick/scenes/meadow.js`)

Décor FLUX reconnaissable : palais de bois de Blancherive sur sa colline, route, crâne de mammouth, tripodes, feu de camp, rampe et
**cercle de lancement** du programme spatial des géants. Personnages : le **géant** (2 poses : au repos, massue levée) et **Nazim**, noble
arrogant du Quartier des Nuages qui répète ses phrases en boucle et barre la route (clin d'œil aux PNJ des mèmes).
Énigme : *Utiliser la meule dorée sur le géant* → il demande qui taper : *moi* (le héros part en orbite et retombe, gag répétable), *le noble*
(le géant l'envoie dans le ciel, la meule est mangée, Nazim rejoint le **seau en orbite** et tourne dans le ciel pour de bon), ou *personne*.
Route libre → fin du chapitre 3. Nouveau type de décor vivant : **orbit** (sprite minuscule qui tourne dans le ciel, cliquable : le seau de la
scène 1 et Nazim). Visuels : `tools/gen_scene3.sh` puis `tools/build_sprites.sh`. La scène 2 enchaîne maintenant sur la scène 3 (fondu).
Reste à faire : scène 4 (cinquante choux dans la petite charrette), scène 5 (gardes et flèche dans le genou).

## Sélecteur de scène et ajout de scènes

Chaque scène atteinte est mémorisée (hors sauvegarde, elle survit à « Nouvelle partie »). Le menu (≡) affiche alors « Choisir une scène » avec un bouton
par chapitre atteint : il repart au début de la scène avec l'état attendu (inventaire et drapeaux). Ajouter une scène : créer `scenes/<id>.js`,
ajouter une ligne dans `scenes/index.js` (`CHAPTERS`, avec son état d'entrée) et les clés `ch.<id>` dans `lang/fr.js` et `lang/en.js`.
La sauvegarde automatique (scène, drapeaux, inventaire, position) reste en place pour « Continuer ».

## Sprites animés et tenues du lore (état final de cette étape)

- **Tenues** : héros (casque de fer à cornes, plastron clouté, manteau de fourrure, bouclier), marchand nordique (tunique à col de fourrure, tablier, clés), garde de Blancherive (casque de fer, cotte de mailles, tabard au cheval blanc), cheval sellé. `tools/gen_anim.sh`.
- **Personnages animés par images** (`data/sheets.js`, table `ANIM`, état repos / parole / marche choisi par `Game.frame()`) : héros (marche en 4 temps, face, parole), marchand,
  garde, poule, cheval, géant, Nazim, aveugles (tâtonnement) et leur danse une fois éclairés. Les images d'un personnage partagent l'échelle et sont recentrées sur leur centre de masse.
- **Décor animé par images** (`tools/gen_regions.py` -> `assets/pointclick/anim/`, type d'ambiance `frames`) : rivières, roues de moulin, mammouth, flammes, herbes et fleurs.
  Oiseaux (`flock`), fumée (`puffs`) et dragon à 4 poses d'ailes sont aussi des sprites (`tools/gen_anim2.sh`). Les anciens effets par déformation de pixels (water, wheel, sway, bob) ne sont plus utilisés.
- Correctif du détourage : les trous du masque (peau proche du fond magenta) sont comblés, sinon des « nervures » noires apparaissaient.

---
## Scènes 4 à 10 (12/11/2026) : le jeu fait dix scènes

Le jeu complet compte dix chapitres. Images : `tools/gen_scenes4_10.sh` (décors et personnages FLUX), puis `tools/build_sprites.sh`. Textes : `lang/fr2.js` / `en2.js`
(fusionnés dans fr.js / en.js). Musiques : générées par `mkTrack` dans `engine/sound.js` (gamme, progression, instruments, rythme, graine fixe).
Chaque scène a son « aveugle » (Fiat lux = 10 sur 10) et un enchaînement par fondu ; le sélecteur de scène connaît les 10 chapitres.

| # | Scène | Énigme / clin d'œil |
|---|---|---|
| 4 | `market` Le marché aux choux | 5 × dix choux dans la petite charrette : tremblement, puis envol de la charrette et pluie de choux (physique des objets empilés) |
| 5 | `gate` La porte de la ville | Le garde « flèche dans le genou » : on retire la flèche, il repart à l'aventure et en reprend une aussitôt ; la flèche reste dans l'inventaire |
| 6 | `house` La maison de la veuve | Mannequin d'armure devant la porte : il ne bouge que quand on lui tourne le dos (regarder par la fenêtre) |
| 7 | `ford` Le gué du cavalier | Cavalier sans tête : une citrouille du champ lui sert de tête, il galope ravi |
| 8 | `wood` Le bois des papillons | Un papillon géant propulse le héros par-dessus le mur (deux tentatives) |
| 9 | `hall` La longue salle | Compagne « jurée de porter vos fardeaux » dans l'encadrement de la porte : on lui confie une enclume (coffre) |
| 10 | `party` La fête des quinze ans | Le dragon allume les quinze bougies ; déclaration d'amour à Skyrim ; fin du jeu (`end10`) |

Aveugles : chou (garçon de ferme), casque (veilleur), panier, botte (barde), champignon (ermite), bannière (servante), chapeau de fête (tambour).
Limites : un seul sprite par aveugle (pas d'animation de repos ni de danse par images), pas de décor animé par images dans ces scènes (dragon, oiseaux et fumées seulement).
