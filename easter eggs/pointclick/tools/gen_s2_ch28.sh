#!/bin/zsh
# Saison 2, chapitre 28 (le gâteau est un mensonge, finale) : file de génération (deux salles de test, fête de Rivebois ; cube,
# caméra et pomme de terre, meule lestée, gâteau en carton et vrai gâteau ; héros au seau, Sheogorath au casque ; boucles LTX).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no creatures, no logo, no watermark, no frame, no text, no letters, no writing, no numbers"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters, no numbers"
A="A clean futuristic white science test chamber: walls of square white and pale grey panels, a heavy closed round-cornered metal door with orange lights in the right wall, a glass tube coming down from the ceiling on the left like a dispenser, a big round red floor button on a white base in the middle of the floor, a blank square sign panel high on the back wall with nothing written on it, an observation window high up; cold bluish light; the white tiled floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_test28_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_portal.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A second clean futuristic white science test chamber, taller: walls of square white panels and a big flat bare white wall on the left, a high white ledge platform on the upper right of the back wall reachable only by flying, a little round table on that ledge with nothing on it, black metal panels on the right wall, cold bluish light; the white tiled floor fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_test28b_$sd.png"; [ -f "$out" ] || flux-image "$B" -i crossover/img/r_portal.jpg -s 1280x720 --seed $sd -o "$out"; done
C="A cozy Nordic medieval village square at night during a big festival: timber houses with snowy roofs, garlands of glowing paper lanterns strung between the houses, long wooden tables with bread, a giant black iron cauldron of bubbling melted cheese fondue on a fire in the middle, warm firelight, a starry sky with green northern lights; the trodden snowy ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 1 2 3; do out="work/s2play/d_party28_$sd.png"; [ -f "$out" ] || flux-image "$C" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_cube28 $sd "one grey metal companion cube with rounded corners and a pink heart painted in a circle on each face."
  i p_camera28 $sd "one small white rounded security camera on a wall arm, with one big glowing yellow round eye, looking smug."
  i p_potato28 $sd "one brown potato with a small glowing yellow round eye stuck in it, two little wires hanging, looking grumpy."
  i p_cheese28 $sd "one heavy round wheel of yellow cheese held by thick steel bands like a weight, futuristic, very clean."
  i p_cake28 $sd "one fake birthday cake made of painted brown cardboard, flat cut-out, with one candle simply drawn on it."
  i p_cakereal28 $sd "one magnificent real three-tier birthday cake with red jam dripping and fifteen lit candles on top."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f hero_bucket28 $sd "Exactly the same Nordic warrior as in the reference picture, same face, same blond hair, same armour, fur and boots, same pose seen from the front, but he wears no helmet at all: an old wooden bucket with iron bands sits upside down on his head instead, a relieved smile." $HS/sel_front.png 3000
  f sheo_helmet28 $sd "Exactly the same mad prince as in the reference picture, same face, same beard, same clothes and colors, same pose, but he proudly wears a Nordic iron helmet with two big curved horns on his head." $PS/c_sheo.png 3010
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="Same viewing angle, same face and same clothes for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l turret_i "the small white turret robot on three legs of the image with one red eye." "it stays in place, alive and cute: the red eye glows softly, it tilts its body left and right a little, its side panels twitch, then it comes back to the starting pose." 3 $PS/c_turret.png 3021
echo fini
# héros au seau de l'épilogue (fiche du chapitre 15) : repos et parole
l hero_bucket_i "the Nordic warrior of the image with an old wooden bucket stuck upside down on his head over his eyes." "he stays in place, alive and relieved: breathes, his shoulders relax, he shifts his weight, the bucket stays on his head, then he comes back to the starting pose." 3 work/s2play/persos/hero_bucket_1.png 3031
l hero_bucket_t "the Nordic warrior of the image with an old wooden bucket stuck upside down on his head over his eyes." "he talks in place: the mouth opens and closes clearly under the bucket as if speaking a line, one hand gestures, the bucket stays on his head, then he comes back to the starting pose." 2.5 work/s2play/persos/hero_bucket_1.png 3032
echo fini2
