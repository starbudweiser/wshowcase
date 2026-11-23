#!/bin/zsh
# Reprises (2) des visuels manquants de la proposition crossover v2 (chapitres sans image, Sacré Graal, Wabbajack).
# FLUX 3 Klein local, gratuit, passe par la file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_crossover_c.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
STL="hand-painted 2000s 2D point-and-click adventure game scene, painterly detailed backgrounds like classic adventure games, bold dark outlines, warm saturated colors, humorous storybook fantasy, characters with realistic adult proportions and ironic expressions, wide composition, no logo, no watermark, no frame"
ST="$STL, no text, no letters"
H="The hero is exactly the man from the first reference picture, same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield on his back, same brown kilt and fur-topped boots, same painted style."
typeset -A P R
P[r_conanb]="$H A barren snowy plain under a grey sky. In the centre, a big horizontal wooden mill capstan: a thick wooden post planted in the ground with four long horizontal wooden beams radiating out at waist height, and a circular path worn into the snow around it by walking feet. A very muscular barbarian with long black hair, a fur loincloth and fur boots and the hero each push one beam forward with their chests, walking in a circle, straining. In the sky flies a long wingless dragon shaped like a snake, covered in white fur and pearly pink scales, with a big friendly dog-like head and floppy ears, smiling. On the horizon, a dark swirling void of nothingness eats the landscape. $ST"
P[r_strangerb]="$H A cozy 1980s suburban living room at night with wood-paneled walls. On the wallpaper, painted in neat black capital letters, three tidy rows of the alphabet: ABCDEFGHI on the first row, JKLMNOPQR on the second row, STUVWXYZ on the third row, with a string of colorful Christmas lights above, one bulb above each letter, a few glowing. No other writing anywhere. A floral sofa, a box TV. Three kids with bowl haircuts holding walkie-talkies stare at the hero. Next to the letters, the wallpaper is torn open and a tall slimy creature whose head opens like the petals of a flower pokes out of the wall. $STL"
ids=("$@")
for id in $ids; do
  for s in 1 2; do
    out="${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 97 + 777 ))
    refs=(-i hero.png); [ -n "${R[$id]}" ] && refs+=(-i "${R[$id]}")
    flux-image "${P[$id]}" $refs -s 1280x720 --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
