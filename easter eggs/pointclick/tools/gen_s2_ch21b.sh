#!/bin/zsh
# Saison 2, chapitre 21 : salon, 2e passe sans lettres ni guirlande (1re : alphabet peint faux ; le moteur dessine l'alphabet et les ampoules).
cd "$(dirname "$0")/.." || exit 1
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook style, wide establishing shot at eye level, empty scene with no people, no logo, no watermark, no frame, no text, no letters, no writing"
A="A cozy 1980s American living room at night, like the reference picture but the back wall is a big plain stretch of old cream flowery wallpaper with NO letters, NO writing and NO Christmas lights at all, an empty wall; a brown flowery sofa on the left, a wooden coffee table in the middle, an old television set on the right, a corded telephone and a lamp on a side table; orange shag carpet fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 4 5 6; do out="work/s2play/d_living_$sd.png"; [ -f "$out" ] || flux-image "$A" -i work/s2play/d_living_2.png -s 1280x720 --seed $sd -o "$out"; done
echo fini
