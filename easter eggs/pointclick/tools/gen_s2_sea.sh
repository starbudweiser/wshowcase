#!/bin/zsh
# Saison 2, chapitre 11 : mer et galion animés sur la seule bande mer + ciel du décor (au-dessus de la rambarde), boucle parfaite
# (même image au début et à la fin). 1er essai sur le décor entier : une vague montait sur le quai. LTX-2.5 local (file calcul-lourd).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
P="CAMERA: static locked-off wide shot, the camera never moves, no zoom. SUBJECT: a moonlit tropical sea at night with an old pirate ship anchored on the left. ACTION: the pirate ship slowly rocks and pitches on the gentle swell, its bow rising and falling, its masts swaying slowly from side to side; gentle waves roll continuously across the whole dark sea surface, with moving ripples and shimmering moonlight reflections; the night clouds drift slowly. The wooden posts and the rope railing in the foreground stay perfectly still and dry; the water stays far below them and never rises. Nobody."
for seed in 501 502; do out="work/s2play/ltx/sea_strip_$seed.mp4"; [ -f "$out" ] || video-locale "$P" -o "$out" -d 4 -s 1088x384 -i work/s2play/sea_strip.png -i work/s2play/sea_strip.png --seed $seed -- --no-audio >/dev/null 2>&1 && echo "ok $seed"; done
