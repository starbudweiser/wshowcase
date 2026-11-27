#!/bin/zsh
# Saison 2, chapitre 27 (Fus Ro Dub Dub), 1re file : le seul chapitre en dessin animé. Vues clés du héros dessiné (d'après la fiche
# validée sel_toon), garage, objets (soucoupe, charrette volante, boîte à bouton, fromages, pile, pistolet), variantes du savant.
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/toon
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"; T=$HS/sel_toon.png
TOON="flat colors, thick clean black outlines, simple cel shading, modern adult animated sitcom cartoon style"
ST="background art of a modern adult animated sitcom cartoon, $TOON, wide establishing shot at eye level, empty scene with no people, no creatures, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single cartoon object, $TOON, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="A cluttered suburban home garage at night in a cartoon: a long workbench on the left covered with flasks, beakers, wires and strange gadgets, a pegboard full of tools, shelves of junk, a closed garage door at the back, a bare concrete wall on the right with nothing on it, cables on the floor; in the middle an open empty floor; the concrete floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no car, no portal. $ST"
for sd in 1 2 3; do out="work/s2play/d_garage27_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_rick.jpg -s 1280x720 --seed $sd -o "$out"; done
h(){ out="work/s2play/toon/$1_$2.png"; [ -f "$out" ] || flux-image "Exactly the same cartoon Viking character as in the reference picture, same design, same proportions, same horned helmet, blond ponytail, fur collar, brown studded armour, pleated kilt, fur boots and round shield on the back, same $TOON. $3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i $T -s 1024x1280 --seed $(( 2900 + $2 )) -o "$out"; }
for sd in 1 2; do
  h toon_pr $sd "Seen in strict side profile facing right, standing straight, arms relaxed, looking ahead to the right."
  h toon_f $sd "Seen from the front, facing the camera, standing straight, arms relaxed, worried face."
  h toon_b $sd "Seen from behind, his back to the camera, the round shield on his back, standing straight."
done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_saucer27 $sd "one small battered flying saucer car with a glass dome and little landing legs, seen from the front, three-quarter view."
  i p_cart27 $sd "one old wooden Nordic farm cart floating in the air on little blue rocket flames, seen in three-quarter view."
  i p_box27 $sd "one small grey metal box with one big round silver button on top."
  i p_gun27 $sd "one chunky green and grey sci-fi portal gun pistol with a glowing green tube, lying on its side."
  i p_cheesetalk27 $sd "one round wheel of yellow cheese with a big cartoon face, eyes open and mouth open as if talking."
  i p_cheeseshout27 $sd "one round wheel of yellow cheese with a big cartoon face shouting furiously, mouth wide open, with sound lines."
  i i_cheese27 $sd "one round wheel of yellow cheese wearing a tiny golden crown, no face."
  i p_cheesepile27 $sd "a messy pile of about fifteen round wheels of yellow cheese, some with silly cartoon faces, heaped on the floor."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f madsci_gun27 $sd "Exactly the same old cartoon scientist as in the reference picture, same face, same spiky grey hair, same white lab coat, same $TOON, but he holds a chunky green sci-fi portal gun pistol pointed up with a smug look." $PS/c_madsci2_1.png 2950
  f p_pickle27 $sd "A green pickle standing upright with the face of the old cartoon scientist of the reference picture, same spiky grey hair and unibrow, a delighted grin, no body, no arms, no legs, $TOON." $PS/c_madsci2_1.png 2960
done
echo fini
