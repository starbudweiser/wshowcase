#!/bin/zsh
# Corrections demandées par Stéphan (23/11) : Morpheus est un homme noir, Gandalf est très grand (planches et scènes).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_persos_s2.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p persos
SP="full body game character sprite, hand-painted 2D point-and-click adventure game art of the early 2000s, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, the whole figure visible with a margin around it, three-quarter view, plain flat solid magenta background, no shadow, no ground, no text"
IT="single game item, hand-painted 2D point-and-click adventure game art of the early 2000s, detailed painterly shading, bold dark outlines, saturated colors, the whole object visible with a margin, plain flat solid magenta background, no shadow, no text"
typeset -A P
MO="a calm tall bald Black man with dark brown skin, small round dark pince-nez sunglasses, a long dark green-black leather coat over a dark vest and tie"
WZ="a very tall lanky old wizard, much taller than everyone around him, standing straight, with a long grey beard, a tall pointed grey hat, long grey robes, a grey cloak and a gnarled wooden staff, annoyed expression"
P[c_morph2]="Full body from the top of the head down to his boots, with empty magenta space above and below: $MO, holding out his two open hands, palms up: one small red potion bottle on one palm, one small blue potion bottle on the other. $SP"
P[c_wizard2]="Full body from the top of the hat down to his boots, with empty magenta space above and below: $WZ. $SP"
P[r_matrixc]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. A dark shabby room with a red leather armchair, lit by green light, with columns of glowing green falling symbols in the background windows. Facing the hero stands $MO: on his open left palm lies one small red potion bottle. The hero already holds one small blue potion bottle in one hand and reaches greedily with his other hand toward the red one. Exactly two potion bottles in the whole picture. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
P[r_anneauxb]="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style. Inside a colossal dark dwarven underground hall with giant stone pillars, on a narrow stone bridge over a fiery abyss: $WZ, towering head and shoulders above the hero, glares down at him, while the hero shouts with all his might, a visible blue rippling shockwave of sound bursting from his mouth toward a huge horned shadow demon of fire and smoke at the other end of the bridge. hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame, no text, no letters"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    if [[ $id == c_* ]]; then out="persos/${id}_$s.png"; else out="${id}_$s.png"; fi
    [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 83 + 1313 ))
    if [[ $id == c_* ]]; then flux-image "${P[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
