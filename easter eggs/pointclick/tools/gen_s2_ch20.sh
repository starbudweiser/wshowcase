#!/bin/zsh
# Saison 2, chapitre 20 (le seau qui tremble) : file de génération (enclos sous la pluie, cuisine en inox, héros accroupi, poule géante,
# petits monstres et leurs brioches, chèvre, guirlandes, ambre, papillon, mammouth à chapeau, frigo ; boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"; K=$PS/c_paleo4_1.png; T=$PS/c_trex.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no animals, no dinosaurs, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="The same rainy tropical night as in the reference picture, seen wider and emptier: a muddy jungle clearing at night under heavy rain, on the right a tall broken electric fence with thick cables snapped and sagging between huge concrete posts, dense dark jungle behind it; on the left a small wooden shelter hut with a flat roof; a wooden post planted in the mud in the middle with a frayed rope tied to it; puddles reflecting a cold moonlight; the muddy ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no animals, no car. $ST"
for sd in 1 2 3; do out="work/s2play/d_paddock_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_jurassic.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A big industrial stainless steel restaurant kitchen at night: long shiny steel worktops and shelves with pots and pans, a big double-door steel fridge on the right wall, a swinging door with a small round window on the left, cold blue light from a window and warm light from a hood lamp, a tiled floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no animals. $ST"
for sd in 1 2 3; do out="work/s2play/d_kitchen_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_goat20 $sd "one small white goat with little horns, standing calmly, seen from the side facing left."
  i p_garland20 $sd "one long string of colorful glowing fairy light bulbs and festive tinsel garland, hanging in a wide shallow curve, seen from the front."
  i p_amber20 $sd "one polished piece of golden amber stone with a small mosquito trapped inside, resting on a little wooden display stand."
  i p_amberfly20 $sd "the same little wooden display stand but empty, with a beautiful blue and black butterfly with glowing wings resting on top of it."
  i i_butterfly20 $sd "one beautiful blue and black butterfly with glowing iridescent wings, wings open."
  i p_rolls20 $sd "two round iced sweet rolls with white icing, side by side on the floor, each with two big round staring cartoon eyes, looking suspicious."
  i i_cheese20 $sd "one round wheel of cheese covered in frost and little ice crystals, very cold, a pale yellow rind."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f hero_crouch20 $sd "Exactly the same character as in the reference picture, same face, same horned helmet, same armor, kilt and boots, now crouching low in a sneaky stealth pose, knees bent, one hand raised, tiptoeing, a very serious concentrated face, seen in three-quarter view facing right." $HS/sel_34_right.png 2200
  f chicken20 $sd "A gigantic angry farm hen as big as the dinosaur of the reference picture, white and brown feathers, a red comb, a furious vengeful look, wings half spread, seen from the side facing left, in the same painted style as the reference picture." $T 2210
  f raptors20 $sd "Two small clever feathered raptor dinosaurs standing side by side on their hind legs, one of them reaching up with a clawed hand as if to open a door handle, cunning eyes, seen from the side facing left, comical rather than scary." $T 2220
  f mammoth20 $sd "A woolly mammoth wearing exactly the same wide-brimmed beige hat and red bandana as the paleontologist of the reference picture, the same grumpy squinting expression, standing, seen from the side facing left." $K 2230
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="It keeps exactly the same viewing angle, the same face and the same look for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l paleo_i "the paleontologist of the image." "he stays in place, alive and nervous: breathes, squints, glances around anxiously, adjusts his hat, then comes back to the starting pose." 3 $K 2201
l paleo_t "the paleontologist of the image." "he talks in place in a nervous whisper: the mouth opens and closes clearly as if speaking a line, eyes wide, then he comes back to the starting pose." 2.5 $K 2202
w(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 960x768 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
w trex_i "the huge dinosaur of the image, the whole body visible with a margin." "it stays in place, alive and menacing: breathes heavily, its head sways slowly and sniffs the air, its tiny arms twitch, its tail swings a little, then it comes back to the starting pose." 3 $T 2203
w trex_t "the huge dinosaur of the image, the whole body visible with a margin." "it roars in place: the huge mouth opens wide and closes, the head shakes, then it comes back to the starting pose." 2.5 $T 2204
echo fini
