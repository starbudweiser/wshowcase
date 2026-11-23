#!/bin/zsh
# Sam & Max d’après les références de Stéphan (pas d’armes : le Wabbajack sert d’arme dans le jeu).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
DG="a tall anthropomorphic cartoon dog detective walking upright, short smooth brown fur, a long snout with a black nose, long floppy ears, a big cheerful toothy grin, a grey-blue suit with a white shirt and a wide tie with diagonal blue and black stripes, a matching grey-blue fedora hat, big bare brown dog feet without shoes"
RB="a small hyperactive cartoon rabbit-like creature with a smooth plain white body and no clothes, very long upright ears with pink insides, small round black dot eyes, a tiny pink nose, a huge wide grin full of small pointed teeth, skinny arms and legs, big white feet"
P[c_dog3]="Full body from the top of the hat down to his feet, with empty magenta space above and below: $DG, one hand in his pocket, the other hand raised casually. $SP"
P[c_rabbit2]="Full body from the tips of the ears down to the feet, with empty magenta space above and below: $RB, standing with arms spread wide in excitement. $SP"
P[r_sammaxb]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A sunny desert roadside attraction along a dusty highway: a giant wheel of yellow cheese as big as a house on a wooden platform, a large blank weathered billboard, a vintage 1960s police sedan painted plain black and white with no lettering at all. Two separate figures stand side by side, from left to right: first $DG; second the hero, with $RB perched on his shoulder. Each wears only his own clothes. There is no writing anywhere in the picture. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
P[r_sammaxd]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A sunny desert roadside attraction along a dusty highway: a giant wheel of yellow cheese as big as a house on a wooden platform, a large blank weathered billboard, a vintage 1960s police sedan painted plain black and white with no lettering at all. Two separate figures stand side by side, from left to right: first $DG; second the hero, with $RB perched on his shoulder. Each wears only his own clothes. There is no writing anywhere in the picture. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 101 + 3737 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
