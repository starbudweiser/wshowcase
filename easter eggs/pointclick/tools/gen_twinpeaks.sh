#!/bin/zsh
# Twin Peaks : le petit homme en rouge est une personne de petite taille (références de Stéphan, 24/11).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
RM="a middle-aged man with dwarfism, a little person of short stature about four feet tall with the natural proportions of a little person, slicked-back light brown hair, a calm enigmatic half-smile, a bright red suit with a matching red shirt with a wide open collar and no tie, black shoes"
P[c_redman3]="Full body from the top of the head down to his shoes, with empty magenta space above and below: $RM, doing a slow strange dance, knees slightly bent, both hands open at chest height, palms facing forward. $SP"
P[r_twinpeaksb]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A strange dreamlike room surrounded on all sides by heavy red velvet curtains, a black-and-white zigzag chevron floor, an antique white marble statue of a woman, two tall slender floor lamps shaped like inverted cones, and black leather armchairs. Three separate figures, from left to right: first the hero, standing confused; second $RM, dancing in the middle of the room, small next to the hero; third the mad prince from the second reference picture, same face, same coat split purple and red, lounging in a black armchair, holding a cup of coffee and a small plate with a slice of cherry pie. Each wears only his own clothes. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 109 + 6363 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -i p_sheo_2.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
