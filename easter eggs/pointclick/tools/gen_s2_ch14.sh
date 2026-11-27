#!/bin/zsh
# Saison 2, chapitre 14 (l'idole et la meule) : file de génération (décor du temple, accessoires, métamorphoses, boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; K=$PS/c_archeo2_1.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no characters, no animals, no snakes, no logo, no watermark, no frame, no text, no letters"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
for sd in 1 2 3; do out="work/s2play/d_temple_$sd.png"; [ -f "$out" ] || flux-image "The same ancient jungle temple as in the reference picture, seen wider and emptier: a long torch-lit stone hall with carved walls, vines and roots, shafts of light from cracks in the ceiling. On the left, the entrance area with a slightly raised square trap flagstone on the floor and small dart holes in the left wall. In the middle of the floor, a wide rectangular sunken pit, empty and dark, cutting the hall from wall to wall. On the right, three stone steps up to a carved altar with an empty round stone pedestal on top. In the back right, a dark sloping corridor opening high in the wall. Flat stone floor walkable on both sides of the pit. Nobody, no snakes. $ST" -i crossover/img/r_indiana.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 768x768 --seed $2 -o "$out"; }
i p_snakes14 1 "a wide flat heap of dozens of tangled brown and green snakes writhing together, seen from slightly above, filling a long rectangle."
i p_sausages14 1 "a wide flat heap of dozens of plump grilled sausages piled together, seen from slightly above, filling a long rectangle."
i p_idol14 1 "one small golden idol statuette of a squat fertility god with a big round head, shiny gold."
i p_hen14 1 "one shiny golden hen made of solid gold, flapping its wings, flying, seen from the side."
i p_boulder14 1 "one huge round grey stone boulder, rough, mossy, perfectly spherical."
i p_wheel14 1 "one huge round wheel of yellow cheese standing upright on its edge, seen from the front, a perfect disc with a waxy rind."
i i_dart14 1 "one small poisoned dart with a red feather tuft, seen from the side, flying to the left."
i i_cheese14 1 "one big round wheel of yellow cheese, a little flattened, with a man-shaped dent in it."
for sd in 1 2; do
  f(){ out="work/s2play/persos/$1_$sd.png"; [ -f "$out" ] || flux-image "$2 the whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i $K -s 1024x1280 --seed $(( $3 + sd )) -o "$out"; }
  f indy_eel "Exactly the same adventurer archaeologist as in the reference picture, same face, same hat, same leather jacket, same clothes, same pose, but instead of his whip he holds a long slippery live eel that wriggles in his hand, a disgusted surprised face." 900
  f indy_horned "Exactly the same adventurer archaeologist as in the reference picture, same face, same leather jacket, same clothes, same pose, but instead of his hat he wears a Nordic iron helmet with two big curved horns, looking very proud and smug." 910
  f indy_guard "A tired town guard of a Nordic fantasy city in the same painted style as the reference picture: an iron helmet with face guard, chainmail under a long yellow tabard with a white horse emblem, a round shield, standing slightly bent with one hand on his knee, a resigned look." 920
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face, the same hat and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $4" -o "$out" -d $5 -s $6 -i "$7" -i "$7" --seed $8 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l indy_i "the adventurer of the image." "he stays in place, alive: breathes, blinks, adjusts his hat brim, glances around warily, coils his whip a little, then comes back to the starting pose." "$MAG" 3 768x960 $K 931
l indy_t "the adventurer of the image." "he talks in place: the mouth opens and closes clearly as if speaking a line, the eyebrows move, a small gesture of the hand, then comes back to the starting pose." "$MAG" 2.5 768x960 $K 932
l snakes14_i "the heap of snakes of the image." "the snakes writhe and slither slowly over each other, heads rising and hissing, tongues flicking, the heap stays at the same place and the same size, then comes back to the starting state." "ENV: plain flat solid magenta background, perfectly uniform." 3 768x768 work/s2play/items/p_snakes14_1.png 933
echo fini
