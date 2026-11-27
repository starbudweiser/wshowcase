#!/bin/zsh
# Saison 2, chapitre 21 (le mur des mots) : file de génération (salon des années 80 au mur alphabet, sous-sol du jeu de rôle, frigo
# à l'envers, gaufres, talkie-walkie, jonquille géante, héros en figurine ; boucles LTX de l'enfant, de la fille et de la créature).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="A cozy 1980s American living room at night: on the back wall, an old flowery wallpaper with the 26 letters of the alphabet A to Z hand painted in big black capital letters in three rows, A to H on the top row, I to Q on the middle row, R to Z on the bottom row, each letter with one colored Christmas light bulb hanging just above it on a long string of lights; orange shag carpet, a brown sofa on the left, a wooden coffee table, an old television set on the right, a corded telephone on a side table; warm lamplight; the carpet fills the whole lower third of the picture, flat and walkable from left to right. Nobody. Only those alphabet letters, no other text. $ST"
for sd in 1 2 3; do out="work/s2play/d_living_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_stranger.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A 1980s wood-panelled basement at night: a big table in the middle covered with a fantasy game map, little painted lead figurines, dice and character sheets, a hanging lamp above it; old armchairs, posters without text, a staircase going up on the right; the floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no text, no letters. $ST, no text, no letters, no writing"
for sd in 1 2 3; do out="work/s2play/d_basement_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_fridge21 $sd "one old 1980s cream-colored refrigerator lying upside down on its top, its door facing down against the floor, seen in three-quarter view."
  i p_waffles21 $sd "one empty open cardboard box of frozen waffles lying on a little wooden side table, a few crumbs."
  i p_wafflesrolls21 $sd "one open cardboard box of frozen waffles overflowing with round iced sweet rolls, on a little wooden side table."
  i p_walkie21 $sd "one big chunky 1980s walkie-talkie with a long antenna, standing upright."
  i p_daffodil21 $sd "one giant yellow daffodil flower as tall as a man, with big leaves, standing in a little pile of earth, smiling sweetly, seen from the front."
  i i_cheese21 $sd "one round wheel of cheese slightly squashed and flattened, a cream rind with dust on it, as if it had stayed under a refrigerator."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f hero_fig21 $sd "Exactly the same character as in the reference picture, but turned into a small painted lead tabletop game miniature standing on a round black plastic base: the same horned helmet, armor, kilt and boots, painted a bit clumsily, the eyes painted slightly crooked, a shiny metal look, seen from the front." $HS/sel_front.png 2300
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="It keeps exactly the same viewing angle, the same face and the same look for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l kid_i "the boy of the image holding a walkie-talkie." "he stays in place, alive and excited: breathes, glances around, lifts the walkie-talkie a little toward his mouth and lowers it, then comes back to the starting pose." 3 $PS/c_kid2.png 2301
l kid_t "the boy of the image holding a walkie-talkie." "he talks in place quickly and excitedly: the mouth opens and closes clearly as if speaking a line, then he comes back to the starting pose." 2.5 $PS/c_kid2.png 2302
l girl_i "the serious girl with a shaved head of the image." "she stays in place, alive and calm: breathes slowly, blinks, tilts her head slightly, stares, then comes back to the starting pose." 3 $PS/c_girl.png 2303
l girl_t "the serious girl with a shaved head of the image." "she talks in place in very few words: the mouth opens and closes clearly as if saying one short word, then she comes back to the starting pose." 2.5 $PS/c_girl.png 2304
l flower_i "the creature of the image with a head that opens like a flower." "it stays in place, alive and menacing: its petal-shaped head slowly opens and closes, it breathes, its long fingers twitch, then it comes back to the starting pose." 3 $PS/c_flower.png 2305
echo fini
