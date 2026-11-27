#!/bin/zsh
# Saison 2, chapitre 25 (suite) : le casque à cornes du héros, seul (Wabbajack + anneau : le héros devient invisible, le casque reste).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/items
HS="${HS:-work/crossover/hero_s2}"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
for sd in 1 2; do out="work/s2play/items/p_helmet25_$sd.png"; [ -f "$out" ] || flux-image "Exactly the same horned Nordic helmet as the one worn by the warrior in the reference picture, same shape, same metal, same horns, alone and empty, nobody wearing it, nothing inside, seen in three-quarter view facing right. $IT" -i "$HS/sel_34_right.png" -s 1024x768 --seed $sd -o "$out"; done
# 2es prises : le casque seul (1res : la tête du héros venait avec, visage compris)
for sd in 3 4; do out="work/s2play/items/p_helmet25_$sd.png"; [ -f "$out" ] || flux-image "one empty horned Nordic iron helmet floating in the air: rounded grey steel dome with rows of rivets, a thin brass band around the rim, two big curved pale horns, seen in three-quarter view facing right, the dark hollow inside slightly visible from below; no head, no face, no hair, no person, nobody wearing it. $IT" -s 1024x768 --seed $sd -o "$out"; done
echo fini
