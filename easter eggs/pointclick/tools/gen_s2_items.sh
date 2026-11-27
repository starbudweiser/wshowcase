#!/bin/zsh
# Saison 2 : objets d'inventaire et accessoires posés dans les décors, un objet par image, fond magenta (détourage par s2_assets.py).
# FLUX 3 Klein local (file calcul-lourd). Relançable : saute ce qui existe. Usage : gen_s2_items.sh <id>[:graine] …
cd "$(dirname "$0")/.." || exit 1
mkdir -p work/s2play/items
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text, no letters"
typeset -A P
P[i_cracker]="one round pale golden ship's biscuit cracker with little holes, crumbly edges. $IT"
P[i_map]="one rolled-up old parchment treasure map, half unrolled, showing a red X and a dotted path, tied with a string. $IT"
P[i_grog]="one big wooden tankard of bubbling green pirate grog with foam spilling over, iron hoops around it, a handle on the side. $IT"
P[i_rootbeer]="one big wooden tankard of dark brown root beer with a thick creamy white foam head spilling over, iron hoops, a handle on the side. $IT"
P[i_cheese_nl]="one whole round wheel of Dutch cheese covered in shiny red wax, one slice cut out showing the yellow cheese inside. $IT"
P[i_statue]="one small grey carved stone statue of a monkey with three heads sitting on a little square stone base, mossy, about knee high. $IT"
for arg in "$@"; do
  id=${arg%%:*}; seed=${arg#*:}; [ "$seed" = "$arg" ] && seed=1
  out="work/s2play/items/${id}_${seed}.png"; [ -f "$out" ] && continue
  flux-image "${P[$id]}" -s 768x768 --seed "$seed" -o "$out"
done
