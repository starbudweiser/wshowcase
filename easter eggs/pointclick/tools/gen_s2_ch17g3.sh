#!/bin/zsh
# Saison 2, chapitre 17 (version anglaise) : route, 3e passe : la scène de la route n°5, peinte dans le style et les couleurs du pont (cohérence des deux scènes).
cd "$(dirname "$0")/.." || exit 1
P="Exactly the same scene as the first reference picture (a dirt road coming from the left foreground and going off into the woods on the right, an old tree stump on the left, a small grey castle with ramparts on a green hill in the background), but painted in the painting style, the colors and the light of the second reference picture: hand-painted 2000s 2D point-and-click adventure game background, painterly, bold dark outlines, warm muted colors. NO cave, no cliff, no bones, no bridge, no stream. Nobody, no animals, no text."
for sd in 7 8; do out="work/s2play/d_road17_$sd.png"; [ -f "$out" ] || flux-image "$P" -i work/s2play/d_road17_5.png -i work/s2play/d_gorge17_2.png -s 1280x720 --seed $sd -o "$out"; done
echo fini
