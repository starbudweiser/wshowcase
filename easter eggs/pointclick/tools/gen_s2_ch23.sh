#!/bin/zsh
# Saison 2, chapitre 23 (projections) : file de génération (appartement ensoleillé avec coin labo, intérieur de la petite pièce en
# plastique et en pique-nique, boîte de beignets, meule, photo du bateau, lames ; expert en boîte de beignets ; boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; K=$PS/c_analyst3_1.png; Z=$PS/c_sister4_2.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="A bright sunny Miami apartment in the 2000s, very clean and tidy: big window on the left with palm trees and blue sky outside, a beige sofa, in the middle a neat desk with a microscope and a row of glass slides, an empty picture frame on the wall above the desk, on the right a closed plain white wooden door in the back wall; light wooden floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_miami_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_dexter.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_plastic23 $sd "a small room seen through a doorway, entirely covered with clear plastic sheeting on the walls, floor and ceiling, very clean, cold light, filling the whole picture edge to edge, no objects."
  i p_picnic23 $sd "a small room seen through a doorway turned into a sunny picnic spot: green grass on the floor, a red and white checkered tablecloth with a wicker basket, little birds, flowers, painted blue sky on the walls, filling the whole picture edge to edge."
  i p_donuts23 $sd "one open pink cardboard box of a dozen glazed donuts with colorful sprinkles."
  i i_cheese23 $sd "one round wheel of yellow cheese with a hole in the middle like a giant donut, a pink ribbon around it."
  i p_photo23 $sd "one framed photograph of a sleek white speedboat on blue sea, in a simple wooden frame."
  i p_photorow23 $sd "one framed photograph of an old wooden Nordic rowboat with two oars on a grey river, in a simple wooden frame."
  i p_slides23 $sd "a neat row of thin slices of yellow cheese lying where glass microscope slides should be, on a little white tray."
  i p_dexdonuts23 $sd "one huge open pink box of glazed donuts standing upright like a person, with a polite little smile drawn on the lid, cartoon style."
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l dexter_i "the polite forensic expert of the image." "he stays in place, alive and calm: breathes, blinks, a small polite smile, tilts his head as if analysing something, then comes back to the starting pose." 3 $K 2501
l dexter_t "the polite forensic expert of the image." "he talks in place calmly and politely: the mouth opens and closes clearly as if speaking a line, then he comes back to the starting pose." 2.5 $K 2502
l sister_i "the police officer woman of the image." "she stays in place, alive and impatient: breathes, rolls her eyes, shifts her weight, crosses her arms, then comes back to the starting pose." 3 $Z 2503
l sister_t "the police officer woman of the image." "she talks in place energetically: the mouth opens and closes clearly as if speaking a line, an exasperated gesture, then she comes back to the starting pose." 2.5 $Z 2504
echo fini
