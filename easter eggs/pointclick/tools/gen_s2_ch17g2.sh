#!/bin/zsh
# Saison 2, chapitre 17 (version anglaise) : route, 2e passe sans image de référence (1re : la grotte de la référence revenait).
cd "$(dirname "$0")/.." || exit 1
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no animals, no logo, no coat of arms, no watermark, no frame, no text, no letters, no writing"
A="A green medieval English countryside road: a dirt road comes from the left foreground and goes off the right edge of the picture between old trees; far in the background on a green hill, a small grey stone castle with crenellated ramparts and towers; on the left, an old tree stump beside the road; on the right side, a dense wall of tall bushes and old trees, the road disappears between them; NO cave, no cliff, no rocks wall; cloudy bright sky; the grass and dirt ground fills the whole lower third of the picture, flat and walkable from left to right. Nobody. $ST"
for sd in 4 5 6; do out="work/s2play/d_road17_$sd.png"; [ -f "$out" ] || flux-image "$A" -s 1280x720 --seed $sd -o "$out"; done
echo fini
