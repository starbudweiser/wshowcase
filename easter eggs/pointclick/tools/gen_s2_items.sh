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
# chapitre 11 : métamorphoses du Wabbajack
P[p_chicken11]="one yellow rubber chicken toy with a red comb and a wide open beak, a small metal pulley wheel attached to its back by a hook, as if ready to slide along a rope. $IT"
P[p_mammoth11]="one small woolly mammoth calf with THREE heads side by side on one body, each head with its own little trunk and tusks, shaggy brown fur, standing on four legs, cute and absurd, about knee high. $IT"
# objets de la besace de toute la saison : le Cri (la Voix) et la bourse de septims
P[i_shout]="one glowing blue circle of ancient carved dragon claw-scratch runes, three slashing angular marks inside a round stone medallion, crackling with bright blue magical energy and wind swirls, no readable letters. $IT"
P[i_septims]="one small brown leather coin purse tied with a string, a few shiny gold coins spilling out of it. $IT"
# chapitre 12
P[i_sweetroll]="one golden glazed sweet roll bun with white icing dripping over the top, round and plump. $IT"
P[i_cheese12]="one whole wheel of pale yellow cheese with holes, a big rabbit-shaped bite missing from its edge. $IT"
P[p_car12]="one old 1960s black and white American police sedan car with a red rotating light on the roof, seen from the side in three-quarter view facing left, whole car visible. $IT"
P[p_cart12]="one old medieval wooden farm cart with two big spoked wooden wheels and a wooden bench, a red rotating police light absurdly mounted on its front post, seen from the side in three-quarter view facing left, whole cart visible, no horse. $IT"
P[p_cheesegiant]="one gigantic wheel of yellow cheese with holes standing upright on its edge, as tall as a man, with a rabbit-shaped hole bitten through its side. $IT"
P[p_twinebuckets]="one giant ball made entirely of hundreds of old wooden buckets with iron bands stuck together into a sphere, as tall as a house, on a round concrete pedestal. $IT"
for arg in "$@"; do
  id=${arg%%:*}; seed=${arg#*:}; [ "$seed" = "$arg" ] && seed=1
  out="work/s2play/items/${id}_${seed}.png"; [ -f "$out" ] && continue
  flux-image "${P[$id]}" -s 768x768 --seed "$seed" -o "$out"
done
