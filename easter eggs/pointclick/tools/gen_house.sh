#!/bin/zsh
# Le docteur House, chapitre intermède de la saison 2 (demande de Stéphan du 23/11).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
HO="a sardonic doctor in his late forties with short messy dark brown hair, intense blue eyes and heavy stubble, a charcoal grey suit blazer over an open-collared light blue shirt with a white t-shirt underneath, dark trousers and sneakers, no lab coat, a wristwatch with a brown leather strap, leaning on a dark wooden walking cane with a curved crook handle, a bored contemptuous stare"
P[c_house]="Full body from the top of the head down to his sneakers, with empty magenta space above and below: $HO. $SP, no text"
P[r_house]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A 2000s hospital diagnostic office with glass walls, a big whiteboard on which only the word LUPUS is written in large marker letters and crossed out with a big red line, a light box with x-rays, a hospital bed. Two separate people, from left to right: first the hero, sitting on the edge of the hospital bed in his armor, puzzled; second $HO, standing and pointing at the hero with his cane. Each person wears only his own clothes. No other writing anywhere. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 103 + 4949 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
