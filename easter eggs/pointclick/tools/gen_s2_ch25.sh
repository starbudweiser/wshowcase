#!/bin/zsh
# Saison 2, chapitre 25 (vous ne passerez pas) : file de génération (pont de pierre sur l'abîme, colline au trou rond et sa table,
# crabe de vase, anneau, aigles et poules, tas de meules, magicien au seau ; boucles LTX du magicien, du démon, du petit être).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; K=$PS/c_wizard2_2.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no creatures, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="The same dark underground dwarven hall as in the reference picture, seen wider and emptier: a narrow ancient stone bridge without railings crosses a bottomless chasm from the left foreground to the right, huge carved stone pillars rising into the darkness, a deep orange fiery glow coming up from the abyss far below; the stone bridge floor fills the lower part of the picture, flat and walkable from left to right. Nobody, no demon, no fire creature. $ST"
for sd in 1 2 3; do out="work/s2play/d_bridge25_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_anneaux.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A cozy green rolling hill country in the sunny morning: on the left, a little house dug into a grassy hill with a perfectly round green wooden door and round windows; in the middle, a long wooden garden table with a white embroidered tablecloth, completely empty; a flower garden and a winding path; on the right, a big grey rock outcrop; blue sky with soft clouds; the grass ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no birds. $ST"
for sd in 1 2 3; do out="work/s2play/d_shire25_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_crab25 $sd "one big mud crab with a muddy brown shell, small eyes on stalks and big pincers, walking sideways, seen in three-quarter view."
  i p_ring25 $sd "one simple plain gold ring lying on a stone, shining softly."
  i p_eagles25 $sd "two huge majestic brown eagles perched side by side on top of a grey rock, wings folded, proud."
  i p_hens25 $sd "two plump white hens perched side by side on top of a grey rock, looking silly."
  i p_cheeses25 $sd "a big pyramid of forty round wheels of yellow cheese stacked on a white embroidered tablecloth, with mushrooms and a few flowers around."
  i i_cheese25 $sd "one round wheel of golden cheese with a little sprig of parsley and a tiny flag on a toothpick without any text."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f wizard_bucket25 $sd "Exactly the same old grey wizard as in the reference picture, same face, same long grey beard, same pointed hat and grey robes, same pose, but instead of his wooden staff he holds up an old wooden bucket with iron bands with an outraged look." $K 2700
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same look for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l wizard_i "the old grey wizard of the image leaning on his staff." "he stays in place, alive and impatient: breathes, strokes his beard, taps his staff, mutters, then comes back to the starting pose." 3 $K 2701
l wizard_t "the old grey wizard of the image leaning on his staff." "he talks in place solemnly: the mouth opens and closes clearly under the beard as if speaking a line, eyebrows raised, then he comes back to the starting pose." 2.5 $K 2702
l halfling_i "the small curly-haired halfling with hairy feet of the image holding a plate." "he stays in place, alive and hungry: breathes, looks at the food on his plate, licks his lips, wiggles his toes, then comes back to the starting pose." 3 $PS/c_halfling.png 2703
l halfling_t "the small curly-haired halfling with hairy feet of the image holding a plate." "he talks in place cheerfully: the mouth opens and closes clearly as if speaking a line, a big smile, then he comes back to the starting pose." 2.5 $PS/c_halfling.png 2704
w(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 960x768 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
w demon_i "the huge fiery winged demon of the image, the whole body visible with a margin." "it stays in place, alive and menacing: breathes heavily, the flames on its body flicker and dance, its wings slowly open a little and close, it growls, then it comes back to the starting pose." 3 $PS/c_demon.png 2705
echo fini
