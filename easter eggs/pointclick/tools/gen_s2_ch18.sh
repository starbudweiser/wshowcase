#!/bin/zsh
# Saison 2, chapitre 18 (la roue de la douleur) : file de génération (plaine enneigée de la roue, pays dévoré par le Néant, roue,
# meule, lecteur, barbare poète, chien, dragon de Skyrim, envol, Néant, gruyère, fondue ; boucles LTX du barbare et du dragon blanc).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items work/s2play/persos work/s2play/ltx
PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no animals, no logo, no watermark, no frame, no text, no letters, no writing"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
A="The same frozen barbarian wasteland as in the reference picture, seen wider and emptier: a flat snowy plain with a big circular trodden track in the snow in the middle of the picture, as if something had been pushed round and round for years, but NOTHING stands in its center; dark rocky mountains far away, a grey cloudy sky with a pale cold light; a few dead bushes and an old broken chain lying in the snow; the snow ground fills the whole lower half of the picture, flat and walkable from left to right. Nobody, no wheel, no post, no dragon. $ST"
for sd in 1 2 3; do out="work/s2play/d_wheel_$sd.png"; [ -f "$out" ] || flux-image "$A" -i crossover/img/r_conan.jpg -s 1280x720 --seed $sd -o "$out"; done
B="A strange fairy-tale country: on the left, a dark misty swamp with dead grey trees and murky still water; in the middle, a grassy rocky hill with a few twisted trees and wildflowers; on the right, the green land goes on toward a far horizon under a big dramatic sky with pink and golden clouds; the grass ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody, no animals. $ST"
for sd in 1 2 3; do out="work/s2play/d_nothing_$sd.png"; [ -f "$out" ] || flux-image "$B" -s 1280x720 --seed $sd -o "$out"; done
i(){ out="work/s2play/items/$1_$2.png"; [ -f "$out" ] || flux-image "$3 $IT" -s 1024x768 --seed $2 -o "$out"; }
for sd in 1 2; do
  i p_wheel18 $sd "one big old wooden capstan: a thick vertical wooden post planted in the ground with four long heavy horizontal wooden push bars crossing at its middle, worn iron bands, seen in three-quarter view."
  i p_wheelcheese18 $sd "one huge round wheel of golden yellow cheese standing upright on its edge like a wheel, a dark rind, seen from the front."
  i p_reader18 $sd "the face of a boy of about ten with brown hair and big curious eyes, seen from below as if he were looking down into a book, his face framed by the torn edge of an old paper page, soft and dreamy like a vision in the sky."
  i p_boy18 $sd "one boy of about ten with brown hair, a 1980s jacket, jeans and sneakers, holding a big old leather book with a plain cover, falling and flailing, seen from the side."
  i p_dog18 $sd "one huge fluffy white dog with a long body, big floppy ears and a happy tongue out, lying down, seen from the side facing left."
  i p_skydragon18 $sd "one big menacing dragon with dark grey-brown scales, horns and huge leathery wings spread, flying, seen from the side facing right."
  i p_ride18 $sd "a long white furry flying dragon with pink pearly scales and a dog-like head, flying through the air like a snake, with a small Viking warrior wearing a horned iron helmet riding happily on his back, seen from the side facing right."
  i p_nothing18 $sd "one huge swirling vortex of pure darkness and nothingness, black and deep violet, with torn edges of landscape being sucked into it, roughly round."
  i p_gruyere18 $sd "one huge round slab of swiss gruyere cheese full of big round holes, standing upright, golden yellow, roughly round."
  i p_fondue18 $sd "a wide flat pool of bubbling molten yellow cheese fondue seen from slightly above, filling the whole picture edge to edge, glossy, with a few bubbles."
  i i_cheese18 $sd "one wedge of swiss gruyere cheese with big round holes, golden yellow."
done
f(){ out="work/s2play/persos/$1_$2.png"; [ -f "$out" ] || flux-image "$3 The whole figure visible with a margin, plain flat solid magenta background, no shadow, no ground, no text." -i "$4" -s 1024x1280 --seed $(( $5 + $2 )) -o "$out"; }
for sd in 1 2; do
  f poet18 $sd "Exactly the same massively muscular barbarian as in the reference picture, same face, same long black hair, same fur loincloth and boots, but now dreamy and poetic: a soft velvet beret on his head, a long white quill in one hand and an unrolled parchment in the other, looking up at the sky with a romantic sigh, standing." $PS/c_barbarian2_2.png 2000
done
FIX="CAMERA: static locked-off full shot, the camera never moves, no zoom."
MAG="It keeps exactly the same viewing angle, the same face and the same look for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
l(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$FIX SUBJECT: $2 ACTION: $3 $MAG" -o "$out" -d $4 -s 768x960 -i "$5" -i "$5" --seed $6 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
l barbarian_i "the massively muscular barbarian of the image, both hands on his sword." "he stays in place, alive and brooding: breathes deeply, his chest rises, he frowns, glances to the side, flexes his shoulders, then comes back to the starting pose." 3 $PS/c_barbarian2_2.png 2001
l barbarian_t "the massively muscular barbarian of the image, both hands on his sword." "he talks in place in a deep slow voice: the mouth opens and closes clearly as if speaking a short line, a stern face, then he comes back to the starting pose." 2.5 $PS/c_barbarian2_2.png 2002
l luckdragon_i "the white furry dragon with a dog-like head of the image." "it stays in place, alive and happy: its long furry body undulates gently, it blinks, smiles, its ears twitch, then it comes back to the starting pose." 3 $PS/c_luckdragon.png 2003
l luckdragon_t "the white furry dragon with a dog-like head of the image." "it talks in place with a warm happy laugh: the mouth opens and closes clearly as if speaking a line, the ears move, then it comes back to the starting pose." 2.5 $PS/c_luckdragon.png 2004
echo fini
