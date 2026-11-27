#!/bin/zsh
# Visuels d'ambiance de la proposition « crossover » (10 chapitres de plus). FLUX 3 Klein local, gratuit, passe par la file calcul-lourd.
# Relançable : saute ce qui existe. Usage : gen_crossover.sh [id…]  (sans argument : tout)
cd "$(dirname "$0")/../work/crossover" || exit 1
ST="hand-painted 1990s PC point-and-click adventure game scene, painterly VGA-era look like classic British fantasy adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no text, no letters, no logo, no watermark, no frame"
H="The hero is exactly the man from the reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style."
typeset -A P
P[p_orbiteb]="$H The hero appears only ONCE in the whole picture: high up in the starry night sky, tiny, flung upward in a long comic arc, arms and legs flailing, leaving a sparkling trail. Far below, a festive Nordic village party in the style of Skyrim: paper lanterns, banquet tables, a big round birthday cake with fifteen lit candles, snowy mountains, fireworks. A colossal clumsy giant in furs, as tall as the houses, has just clapped his enormous hands and looks up, delighted. The party guests are ordinary Nordic villagers without helmets, all looking up at the sky. $ST"
P[r_matrixb]="$H A dark shabby room with a red leather armchair, lit by green light, with columns of glowing green falling symbols in the background windows. A calm bald man in a long black leather coat and small round dark sunglasses stands facing the hero and holds out his two open hands, palms up: on his left palm lies one small red potion bottle, on his right palm lies one small blue potion bottle. There are exactly two potion bottles in the whole picture, nothing else in his hands. The hero leans forward with a greedy grin, reaching out with both hands toward both bottles at once, not touching them yet. $ST"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    out="${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 53 + 707 ))
    if [[ "${P[$id]}" == "$H"* ]]; then flux-image "${P[$id]}" -i hero.png -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1
    else flux-image "${P[$id]}" -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1; fi
    echo "$(date +%H:%M:%S) ok $out"
  done
done
