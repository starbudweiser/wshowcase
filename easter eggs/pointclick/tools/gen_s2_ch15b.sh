#!/bin/zsh
# Saison 2, chapitre 15 : place, 2e passe (1re : éclairs peints dans le ciel, figés ; l'orage animé est fait par le moteur).
cd "$(dirname "$0")/.." || exit 1
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no vehicles, no horses, no logo, no watermark, no frame, no text, no letters, no writing"
P="A small 1950s American town square at night under heavy rain: in the center, a big courthouse with a tall clock tower and a large round lit clock face whose hands are stopped; a long electric cable sags from the top of the clock tower down to an old iron lamp post standing on the left of the square; a wooden park bench next to the lamp post; trees and old shop fronts with warm windows on both sides; the sky is covered with dark heavy rolling storm clouds, NO lightning bolt anywhere; wet cobblestone and asphalt ground with rain puddles and reflections fills the whole lower half of the picture, flat and walkable from left to right. Nobody, no car, no cart, no horse. $ST"
for sd in 4 5 6; do out="work/s2play/d_square_$sd.png"; [ -f "$out" ] || flux-image "$P" -i work/s2play/d_square_1.png -s 1280x720 --seed $sd -o "$out"; done
echo fini
