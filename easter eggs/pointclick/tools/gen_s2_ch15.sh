#!/bin/zsh
# Saison 2, chapitre 15 (88 lieues à l'heure) : file de génération (place sous l'orage, charrettes, garçon, métamorphoses, boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"; K=$PS/c_doc2.png
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no vehicles, no horses, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
for sd in 1 2 3; do out="work/s2play/d_square_$sd.png"; [ -f "$out" ] || flux-image "The same small 1950s American town square as in the reference picture, seen wider and emptier, at night during a thunderstorm: on the right, a big courthouse with a tall clock tower and a large round lit clock face whose hands are stopped; a long electric cable hangs from the top of the clock tower down to an old lamp post standing on the left side of the street; a wooden park bench on the left near the lamp post; old shop fronts with dark windows in the background; dark stormy sky with lightning clouds, rain puddles on the wet asphalt street that crosses the whole lower half of the picture, flat and walkable from left to right. Nobody, no car, no cart, no horse. $ST" -i crossover/img/r_retour.jpg -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_cart15 $sd "one old medieval wooden farm cart with two big spoked wheels and a wooden bench, harnessed to a calm brown horse, the whole cart and horse seen from the side facing left."
  i p_cart15s $sd "one old medieval wooden farm cart completely covered with shiny brushed stainless steel panels, two gull-wing doors opened upward like wings, glowing blue coils and a little speed dial on the front, harnessed to a calm brown horse, the whole cart and horse seen from the side facing left."
  i p_cart15n $sd "one old medieval wooden farm cart completely covered with shiny brushed stainless steel panels, two gull-wing doors opened upward like wings, glowing blue coils, harnessed to a sturdy shaggy Nordic horse with long fur, braided mane and fur saddle blanket, the whole cart and horse seen from the side facing left."
done
i p_board15 1 "one old wooden skateboard with red wheels, seen from the side."
i p_photo15 1 "one small old framed family photograph standing on its little stand, the photo showing a vague smiling group, a simple wooden frame."
i i_cable15 1 "one coil of thick black electric cable with a big copper clamp at its end."
i i_cheese15 1 "one round wheel of very aged dark yellow cheese with a thick wrinkled rind, a small paper label tied with string."
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f boy15 $sd "A 1950s teenage boy with short brown hair, a puffy red sleeveless vest over a denim jacket, jeans and sneakers, standing relaxed with one hand in his pocket, a curious look, in the same painted style as the reference picture, seen in three-quarter view facing left." $K 940
  f doc_hair $sd "Exactly the same tall old scientist as in the reference picture, same face, same white lab coat, same goggles, same pose, but his wild white hair now stands straight up one meter high like a huge electrified white column crackling with tiny sparks, a delighted astonished face." $K 950
  f hero_kid $sd "Exactly the same character as in the reference picture but turned into a small boy of about eight years old: the same horned iron helmet much too big for his head, the same fur collar, studded armor, leather kilt and fur boots in child size, a round child face with the same blond ponytail, a delighted surprised look, standing, seen in three-quarter view facing left." $HS/sel_34_left.png 960
  f hero_bucket $sd "Exactly the same character as in the reference picture, same armor, same kilt, same boots, same pose, but an old wooden bucket with iron bands is stuck upside down over his head and helmet, covering his eyes and nose, only his chin and blond ponytail stick out below it, seen in three-quarter view facing left." $HS/sel_34_left.png 970
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="He keeps exactly the same viewing angle, the same face and the same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l doc_i "the old scientist of the image." "he stays in place, alive and agitated: breathes fast, blinks, glances nervously around, scratches his wild hair, small excited hand gestures, then comes back to the starting pose." 3 $K 981
l doc_t "the old scientist of the image." "he talks excitedly in place: the mouth opens and closes clearly as if speaking a line, eyes wide, eyebrows jumping, waving one hand, then comes back to the starting pose." 2.5 $K 982
echo fini
