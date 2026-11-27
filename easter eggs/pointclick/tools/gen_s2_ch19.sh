#!/bin/zsh
# Saison 2, chapitre 19 (intermède à l'hôpital) : file de génération (salle de diagnostic, tableau blanc et ses variantes en dessins,
# IRM et sarcophage, radios, sandwich, marqueur, casque, héros tête nue, médecin au Wabbajack ; boucles LTX du médecin).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"; K=$PS/c_house7_2.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow"
D="A modern hospital diagnostic room at night, like the one in the reference picture but empty: glass walls with blinds, cold bluish neon lights on the ceiling, on the left a hospital bed with white sheets and a monitor, in the middle back an empty wall, on the back wall on the right an empty space of clear floor in front of a big window onto a dark corridor, a small desk with a coffee mug, papers and a lamp near the right edge, grey linoleum floor; the floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no whiteboard, no machines. $ST"
for sd in 1 2 3; do out="work/s2play/d_hospital_$sd.png"; [ -f "$out" ] || flux-image "$D" -i crossover/img/r_house.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_board19 $sd "one big blank white whiteboard on a metal stand with wheels, completely clean and empty, a marker tray at the bottom, seen from the front, no text."
  i p_mri19 $sd "one big white hospital MRI scanner machine with its round tunnel and its sliding bed, seen in three-quarter view, no text, no logo."
  i p_sarco19 $sd "one ancient Nordic stone sarcophagus standing upright, carved with dragon knotwork, its heavy stone lid slightly ajar with a cold blue glow coming out, seen in three-quarter view."
  i p_xray19 $sd "one hospital light box mounted on a wall, glowing white, showing a chest x-ray film with ribs, seen from the front, no text."
  i p_sandwich19 $sd "one big cheese sandwich on a paper plate, thick slices of yellow cheese, a little paper label stuck on it with a name scribbled, unreadable."
  i i_marker19 $sd "one black whiteboard marker pen with its cap."
  i i_potion19 $sd "one small glass potion bottle with a cork, filled with a glowing pale green liquid, a leather string around its neck."
  i p_helmet19 $sd "one iron Viking helmet with two big curved horns, seen from the side."
done
b(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "Exactly the same whiteboard as in the reference picture, same stand, same frame, same angle, $3 $IT" -i work/s2play/items/p_board19_1.png -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  b p_board19s $sd "but now with three simple black marker doodles drawn on it: a little man shouting a big wave at a flying man, a little man with a bucket on his head, a small wooden cart; and next to them the single word LUPUS? written in red marker."
  b p_board19l $sd "but now completely covered from edge to edge with the word LUPUS written dozens of times in black marker in every size and direction."
  b p_board19h $sd "but now with three simple black marker doodles drawn on it: a little man shouting, a little man with a bucket on his head, a small wooden cart; the word LUPUS crossed out in red, and below in big black capital letters the single word SHEOGORATH circled twice."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f hero_nohelm19 $sd "Exactly the same character as in the reference picture, same face, same armor, kilt and boots, same pose, but without his horned helmet for the first time: his bare head shows a ridiculous flattened mushroom-shaped blond haircut with a bald spot on top, pressed down by years under the helmet, cold red ears, an embarrassed face, seen from the front." $HS/sel_front.png 2100
  f house_wab19 $sd "Exactly the same unshaven grumpy doctor as in the reference picture, same face, same clothes, same pose, but instead of his walking cane he leans on a small twisted wooden magic staff topped with a smiling and a frowning carved face, looking smug." $K 2110
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l house_i "the unshaven grumpy doctor of the image leaning on his cane." "he stays in place, alive and bored: breathes, rolls his eyes, shifts his weight onto his cane, glances sideways with suspicion, then comes back to the starting pose." 3 $K 2101
l house_t "the unshaven grumpy doctor of the image leaning on his cane." "he talks in place with sarcasm: the mouth opens and closes clearly as if speaking a line, one eyebrow raised, a small tilt of the head, then he comes back to the starting pose." 2.5 $K 2102
echo fini
