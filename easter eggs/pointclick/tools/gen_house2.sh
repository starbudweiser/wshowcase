#!/bin/zsh
# Le docteur House, pose de la référence de Stéphan avec les bonnes proportions de canne (moitié de sa taille).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
HO="a sardonic doctor in his late forties with short messy dark brown hair, intense blue eyes and heavy stubble, a charcoal grey suit blazer over an open-collared light blue shirt with a white t-shirt underneath, dark trousers and sneakers, no lab coat, a wristwatch with a brown leather strap, leaning on a dark wooden walking cane with a curved crook handle, a bored contemptuous stare"
P[c_house5]="Full body from the top of the head down to his sneakers, with empty magenta space above and below: $HO. He stands straight, glaring at the viewer with a stern frown. His dark wooden walking cane is a normal short cane whose length is about half of his height, from the floor to his wrist. He holds it lifted off the ground, vertically in front of his body, both hands clasped one above the other around the middle of the shaft at belly height, so the curved derby handle is at chest height and the rubber tip hangs in the air at knee height, well above the floor. $SP, no text"
P[c_house6]="Full body from the top of the head down to his sneakers, with empty magenta space above and below: $HO. He stands straight facing the viewer with a stern frown. He holds his short dark wooden cane up off the floor, vertically in front of his chest and belly, like a gentleman holding a closed umbrella upright: his two hands, one on top of the other, grip the lower part of the shaft at belly height, the curved derby handle sticks up next to his left shoulder, and the bottom tip of the cane stops at the level of his knees. There is a clear gap of empty space between the tip of the cane and the floor; the cane does not touch the ground. $SP, no text"
P[c_house7]="Full body from the top of the head down to his sneakers, with empty magenta space above and below: $HO. Standing upright, arms bent, he clutches his walking cane in front of his torso with both fists stacked one above the other at the height of his belt buckle; the cane rises straight up from his fists to a curved handle beside his left shoulder, and below his fists only a short piece of the cane hangs down to mid-thigh. Both of his feet stand on the ground with nothing between them; the cane is lifted, carried, not leaning on the floor. Stern glaring frown. $SP, no text"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 107 + 5151 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
