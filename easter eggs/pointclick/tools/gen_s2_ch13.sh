#!/bin/zsh
# Saison 2, chapitre 13 (le monde en cubes) : file de génération (décors, accessoires, héros en cubes, boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no characters, no animals, no creatures, no logo, no watermark, no frame, no text, no letters"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
CUBE="in a strange sunny world where everything is made of big cubes: blocky square trees with cubic green leaves, cubic grass hills, square clouds"
d(){ out="work/s2play/$1_$2.png"; [ -f "$out" ] || flux-image "$3" ${4:+-i} ${4:+$4} -s 1280x720 --seed $2 -o "$out"; }
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 768x768 --seed $2 -o "$out"; }
for sd in 1 2 3; do
  d d_mine_a $sd "The same blocky world as in the reference picture, seen wider and emptier, $CUBE. On the right, a tall tower built of grey stone cubes, its arched doorway at the base completely walled up with grey stone blocks. In the middle left, a small round well made of stone cubes with an empty wooden rim. A waterfall made of blue blocks in the background, a square yellow sun in the upper left of the sky. A flat grassy ground made of cubes fills the whole lower half of the picture, walkable from left to right. Nobody, no animals. $ST" crossover/img/r_minecraft.jpg
  d d_mine_b $sd "Seen from the very top of a tall tower built of grey stone cubes, $CUBE: the flat top platform of the tower with low crenellated stone block battlements fills the lower part of the picture, and far below, a wide view over the blocky world: cubic trees, cubic hills, a river of blue blocks, tiny square fields; blue sky with square clouds, a square yellow sun. An empty small stone pedestal in the middle of the platform. Nobody. $ST" crossover/img/r_minecraft.jpg
done
i p_sheep13 1 "one cute sheep made entirely of cubes, a boxy white woolly body, a square grey head, four square legs, standing, seen in three-quarter view facing left."
i p_sunround13 1 "one big round glowing yellow sun, a perfect circle with soft painted rays, slightly embarrassed face drawn on it."
i i_wood13 1 "one cube-shaped block of wood, its sides showing bark and its top showing the tree rings, perfectly cubic."
i i_waterbucket13 1 "one old wooden bucket with iron bands, full to the brim with clear blue water."
i i_cheesecube 1 "one perfectly cube-shaped block of yellow cheese with round holes, like a cubic cheese wheel, wax rind on its edges."
i p_puddle13 1 "one flat square puddle of clear blue water seen from slightly above, a thin layer of water made of one flat block, little splashes."
i p_doorway13 1 "one open arched doorway in a wall of grey stone cubes, freshly blown open with ragged broken block edges and rubble cubes on the ground, a staircase made of grey stone cubes going up inside the dark tower, seen from the front."
for sd in 1 2; do out="work/s2play/persos/hero_cube_$sd.png"; [ -f "$out" ] || flux-image "Exactly the same character as in the reference picture, same horned iron helmet, same fur collar, same studded armor, same leather kilt and boots, same colors, but his whole body made of big cubes and blocks like a blocky voxel figure: square head, boxy arms and legs, standing, seen in three-quarter view facing right, a surprised expression, no smile. The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i $HS/sel_34_right.png -s 1024x1280 --seed $((800+sd)) -o "$out"; done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same shape and the same colors for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$2 SUBJECT: the character of the image. ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l villager_i "$FIX" "the blocky villager stays in place, alive: breathes, blinks, his big nose twitching, his unibrow moving, small nods of his square head, arms folded, then comes back to the starting pose." 3 $PS/c_villager.png 811
l villager_t "$FIX" "the blocky villager talks in place: his mouth under the big nose moves as if saying hmm, his unibrow goes up and down, small nods, then comes back to the starting pose." 2.5 $PS/c_villager.png 812
l creeper_i "$FIX" "the green blocky creature stays in place, alive: it sways slightly on its stubby legs, its sad face blinks, its body swells a little as if about to hiss, then comes back to the starting pose." 3 $PS/c_creeper.png 813
l creeper_w "CAMERA: locked-off tracking shot that follows the creature at exactly its speed, so it stays at the same place and at the same size in the center of the frame for the whole shot." "the green blocky creature shuffles forward with its four short stubby block legs moving in a steady regular rhythm, keeping the same viewing angle, never turning." 2.5 $PS/c_creeper.png 814
echo fini
