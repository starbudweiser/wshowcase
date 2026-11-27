#!/bin/zsh
# Saison 2, chapitre 22 (la chambre rouge) : file de génération (chambre aux rideaux rouges, café de la ville, café, tarte, hiboux et
# poules, magnétophone, dame à la meule ; boucles LTX du petit homme, de la dame à la bûche et de l'agent).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="A strange dreamlike room entirely surrounded by tall heavy red velvet curtains from floor to ceiling on all sides, a black and white zigzag chevron patterned floor, two empty dark armchairs on the left, a tall black floor lamp with a soft light, an opening between the curtains on the right, dim red light; the zigzag floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no statue. $ST"
for sd in 1 2 3; do out="work/s2play/d_redroom_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_twinpeaks.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A cozy roadside 1990s small-town diner in the woods at day: a long counter with red stools on the left, a glass pie display with cherry pies on the counter, a coffee machine and pots of coffee, red booths along big windows on the right with tall dark pine trees outside, a wooden shelf high on the back wall; checkered floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no animals. $ST"
for sd in 1 2 3; do out="work/s2play/d_diner_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i i_coffee22 $sd "one white diner mug full of steaming black coffee on a saucer."
  i i_pie22 $sd "one slice of cherry pie with a golden lattice crust and shiny red cherries, on a small plate with a fork."
  i p_owls22 $sd "two stuffed brown owls with big round staring eyes perched side by side on a wooden branch mounted on a little wooden shelf, seen from the front."
  i p_chickens22 $sd "two plump stuffed white hens perched side by side on a wooden branch mounted on a little wooden shelf, staring, seen from the front."
  i p_recorder22 $sd "one small black 1990s micro-cassette tape recorder with a red record button, standing upright."
  i i_cheese22 $sd "one round wheel of cheese with a dark red waxed rind like velvet, a little cherry on top."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f loglady_cheese22 $sd "Exactly the same old lady as in the reference picture, same face, same glasses, same clothes, same pose, but instead of a wooden log she cradles a big round wheel of cheese in her arms with the same tenderness." $PS/c_loglady3.png 2400
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l redman_i "the small man in a red suit of the image." "he dances in place in a strange slow jerky way, snapping his fingers, swaying his shoulders and shuffling his feet without moving away, a strange smile, then he comes back to the starting pose." 3 $PS/c_redman3_1.png 2401
l redman_t "the small man in a red suit of the image." "he talks in place in a strange way: the mouth opens and closes clearly with exaggerated slow movements as if speaking a line, his hands move, then he comes back to the starting pose." 2.5 $PS/c_redman3_1.png 2402
l loglady_i "the old lady of the image holding a log." "she stays in place, alive and mysterious: breathes, blinks behind her glasses, tilts her head toward the log in her arms as if listening to it, then comes back to the starting pose." 3 $PS/c_loglady3.png 2403
l loglady_t "the old lady of the image holding a log." "she talks in place slowly and mysteriously: the mouth opens and closes clearly as if speaking a line, then she comes back to the starting pose." 2.5 $PS/c_loglady3.png 2404
l agent_i "the cheerful agent of the image holding a small tape recorder." "he stays in place, alive and cheerful: breathes, smiles, lifts the tape recorder a little toward his mouth and lowers it, then comes back to the starting pose." 3 $PS/c_agent.png 2405
l agent_t "the cheerful agent of the image holding a small tape recorder." "he talks in place enthusiastically: the mouth opens and closes clearly as if speaking a line, a big smile, then he comes back to the starting pose." 2.5 $PS/c_agent.png 2406
echo fini
