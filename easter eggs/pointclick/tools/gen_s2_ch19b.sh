#!/bin/zsh
# Saison 2, chapitre 19 : radio du genou (oubliée dans la 1re file), d'après le négatoscope retenu.
cd "$(dirname "$0")/.." || exit 1
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
for sd in 1 2; do out="work/s2play/items/p_xrayknee19_$sd.png"; [ -f "$out" ] || flux-image "Exactly the same hospital light box as in the reference picture, same frame, same angle, but the glowing film now shows an x-ray of a human knee with an arrow stuck right through it, the arrowhead and the shaft clearly visible. $IT" -i work/s2play/items/p_xray19_1.png -s 1024x768 --seed $sd -o "$out"; done
echo fini
