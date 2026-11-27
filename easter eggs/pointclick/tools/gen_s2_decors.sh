#!/bin/zsh
# Saison 2 : décors jouables vides (même lieu que l'illustration du chapitre, sans personnages, cadrage large, sol praticable).
# FLUX 3 Klein local (file calcul-lourd). Relançable : saute ce qui existe. Usage : gen_s2_decors.sh <id>[:graine] …
cd "$(dirname "$0")/.." || exit 1
mkdir -p work/s2play
ST="hand-painted 2000s 2D point-and-click adventure game background, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, wide establishing shot at eye level, empty scene with no people, no characters, no animals, no creatures, no logo, no watermark, no frame, no text, no letters"
typeset -A P R
P[d_monkey]="The exact same place as in the reference picture, seen wider and emptier: a moonlit tropical pirate harbour at night. A long wide wooden dock with weathered planks fills the whole lower half of the picture, receding slightly toward the back, flat and walkable from the left edge to the right edge. On the far left in the background, a dark old pirate ship at anchor on the calm sea under the full moon. On the right, a wooden tavern with glowing yellow windows and an open doorway, a wooden porch, an empty wooden parrot perch standing on the porch. A few wooden barrels along the right side and two mooring posts at the left edge of the dock. Palm trees, night clouds. Nobody on the dock. $ST"; R[d_monkey]=crossover/img/r_monkey.jpg
for arg in "$@"; do
  id=${arg%%:*}; seed=${arg#*:}; [ "$seed" = "$arg" ] && seed=1
  out="work/s2play/${id}_${seed}.png"; [ -f "$out" ] && continue
  flux-image "${P[$id]}" -i "${R[$id]}" -s 1280x720 --seed "$seed" -o "$out"
done
