#!/bin/zsh
# Dexter refait d’après la référence de Stéphan (allure : polo corail, lunettes au col ; pas le visage de l’acteur).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
DX="a polite forensic analyst in his thirties with tousled light brown hair, a sly polite half-smile and calm watchful eyes, wearing a short-sleeved coral orange polo shirt with a chest pocket and a pair of sunglasses hooked in its open placket, khaki trousers"
P[c_analyst2]="Full body: $DX, holding an open box of pink donuts with both hands. $SP"
P[r_dexterb]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A tidy sunny Miami police forensic lab: microscopes, glass slides, a window showing palm trees and the sea. Next to the hero stands $DX, holding an open box of donuts in one hand and a magnifying glass in the other, studying pink raspberry jam splatters mixed with birthday cake crumbs on the hero's armor. In the background, a small room covered in clear plastic sheeting. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
P[c_analyst3]="Full body from the top of the head down to his brown shoes, with empty magenta space above the head and below the shoes, small figure in the frame: $DX, holding an open box of pink donuts with both hands. $SP"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    out="${id}_$s.png"; [[ $id == c_* ]] && out="persos/${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 61 + 909 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
