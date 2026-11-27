#!/bin/zsh
# Reprises des visuels manquants de la proposition crossover v2 (chapitres sans image, Sacré Graal, Wabbajack).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_crossover_c.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
STL="hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame"
ST="$STL, no text, no letters"
H="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style."
typeset -A P R
P[r_sammaxb]="$H A sunny desert roadside attraction along a dusty highway: a giant wheel of yellow cheese as big as a house on a wooden platform, a large blank weathered billboard, a vintage 1960s police sedan painted plain black and white with no lettering and no number plate. Next to the hero stand a tall anthropomorphic brown dog detective walking upright in a grey suit and grey fedora hat, calm and deadpan, and a small hyperactive white rabbit-like creature with a huge toothy grin bouncing on the hero's shoulder. There is no writing anywhere in the picture. $ST"
P[r_sammaxc]="$H A sunny desert roadside attraction along a dusty highway: a giant wheel of yellow cheese as big as a house on a wooden platform, a large blank weathered billboard, a vintage 1960s police sedan painted plain black and white with no lettering at all. Next to the hero stand a tall anthropomorphic brown dog detective walking upright in a grey suit and grey fedora hat, calm and deadpan, and, perched on the hero's shoulder, a small hyperactive white rabbit-like creature with long ears, a tiny pink rabbit nose and a huge toothy grin. There is no writing anywhere in the picture. $ST"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    out="${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 89 + 511 ))
    refs=(-i hero.png); [ -n "${R[$id]}" ] && refs+=(-i "${R[$id]}")
    flux-image "${P[$id]}" $refs -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
