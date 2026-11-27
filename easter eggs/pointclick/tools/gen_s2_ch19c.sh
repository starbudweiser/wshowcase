#!/bin/zsh
# Saison 2, chapitre 19 : radio du genou, 2e passe sans référence (1re : le thorax de la référence restait).
cd "$(dirname "$0")/.." || exit 1
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
for sd in 3 4; do out="work/s2play/items/p_xrayknee19_$sd.png"; [ -f "$out" ] || flux-image "one hospital light box mounted on a wall with a dark grey metal frame, glowing white, showing a side x-ray film of a single human knee joint: the thigh bone, the kneecap and the shin bone, with a whole arrow stuck right through the knee, arrowhead and feathers clearly visible, seen from the front. $IT" -s 1024x768 --seed $sd -o "$out"; done
echo fini
