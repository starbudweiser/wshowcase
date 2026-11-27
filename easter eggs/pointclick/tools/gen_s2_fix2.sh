#!/bin/zsh
# Corrections d’après les références de Stéphan (suite) : paléontologue rasé, chapeau de paille.
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
P[c_paleo4]="Full body from the top of the hat down to his boots, with empty magenta space above and below: a clean-shaven middle-aged paleontologist with short greying brown hair, a light straw wide-brimmed hat with a pinched crown and a dark band, a long-sleeved blue denim shirt with the sleeves rolled up to the forearms, a red bandana knotted around his neck, beige pleated khaki trousers, a brown leather belt with a brass buckle, a wristwatch, brown boots, holding a big fossil claw, squinting suspiciously. $SP"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 97 + 2525 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
