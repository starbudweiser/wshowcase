#!/bin/zsh
# Saison 2, chapitre 17 (version anglaise, le Graal façon Monty Python) : file de génération (route de forêt et château moqueur,
# pont du chevalier noir et grotte du lapin, objets et métamorphoses, boucles LTX des personnages).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no animals, no logo, no coat of arms, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="The same green medieval English countryside as in the reference picture, seen wider and emptier: a dirt road crosses the picture from the left foreground to the right edge between old trees and bushes; far in the background on a green hill, a small grey stone castle with crenellated ramparts and towers; on the left, an old tree stump beside the road; on the right, a dense wall of tall bushes and trees closing the way except for the road; cloudy bright sky; the grass and dirt ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_road17_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_graal.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A wild medieval English gorge: on the left, a narrow old wooden plank bridge crosses a small rushing stream from the left foreground toward the middle; in the middle, a grassy clearing; on the right, a grey rocky cliff with a big dark cave entrance surrounded by scattered old white bones and skulls on the ground; on the far left behind the stream, a tall dark rocky crag; cloudy sky; the grass ground of the clearing fills the lower third of the picture from the bridge to the cave, flat and walkable. Nobody, no animal. $ST"
for sd in 1 2 3; do out="work/s2play/d_gorge17_$sd.png"; [ -f "$out" ] || flux-image "$B" -i crossover/img/r_graal.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i i_lavender17 $sd "one small bunch of fresh purple lavender sprigs tied with a string."
  i p_shrub17 $sd "one small round green bush with a few purple lavender flowers, planted in the ground, seen from the side."
  i p_topiary17 $sd "one big green garden hedge carefully trimmed into the shape of a woolly mammoth with long tusks and a raised trunk, a tiny gravel path in front of it, seen from the side facing left."
  i p_grenade17 $sd "one golden holy hand grenade, an orb with a small golden cross on top and jewels, resting on an old tree stump."
  i p_grenadecheese17 $sd "one round golden wheel of cheese with a small golden cross planted on top, resting on an old tree stump."
  i p_horses17 $sd "two real brown medieval horses with saddles and red caparisons standing side by side, seen from the side facing right."
  i p_goat17 $sd "one shaggy white mountain goat with big curved horns, startled, legs spread, as if falling from the sky, seen from the side."
  i p_guard17 $sd "one medieval city guard sitting on the ground, tired and talkative, a round iron helmet with a cloth face mask, a yellow and brown tunic over chainmail, a round wooden shield beside him, an arrow stuck in his knee, seen in three-quarter view facing left."
  i p_dragon17 $sd "one small fierce dragon with white fur instead of scales, long rabbit ears, red glowing eyes and big buck teeth, wings spread, roaring, seen in three-quarter view facing left."
  i i_cheese17g $sd "one tall cylinder of blue-veined English stilton cheese with a crusty brown rind, a small piece cut out."
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l coconut_i "the proud medieval king in armour of the image, holding two coconut halves." "he stays in place, alive and dignified: breathes, looks around proudly, clacks the two coconut halves together twice like horse hooves, then comes back to the starting pose." 3 $PS/c_coconut.png 1901
l coconut_t "the proud medieval king in armour of the image, holding two coconut halves." "he talks in place with great dignity: the mouth opens and closes clearly as if speaking a line, the chin raised, then he comes back to the starting pose." 2.5 $PS/c_coconut.png 1902
l ni_i "the giant knight of the image with antlers on his helmet." "he stays in place, alive and menacing: breathes heavily, points his finger, looks down from his height, then comes back to the starting pose." 3 $PS/c_ni.png 1903
l ni_t "the giant knight of the image with antlers on his helmet." "he shouts in place: the helmet tilts forward with each word as if shouting a short word, the pointing arm jerks, then he comes back to the starting pose." 2.5 $PS/c_ni.png 1904
l bk_i "the black knight in full armour of the image." "he stays in place, alive and defiant: breathes, shifts his weight, raises his sword a little and lowers it, then comes back to the starting pose." 3 $PS/c_blackknight.png 1905
l bk_t "the black knight in full armour of the image." "he talks in place with bravado: the helmet nods with each word as if speaking a line, he shakes his shield, then comes back to the starting pose." 2.5 $PS/c_blackknight.png 1906
l rabbit17_i "the small white rabbit of the image with red eyes." "it stays in place, alive and innocent: it twitches its nose, wiggles its long ears, blinks its red eyes and shows its little teeth, then comes back to the starting pose." 3 $PS/c_killerrabbit.png 1907
echo fini
