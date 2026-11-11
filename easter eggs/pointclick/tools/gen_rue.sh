#!/bin/zsh
# Candidats de décor pour la rue de Rivebois (FLUX 3 Klein local, gratuit). Usage : gen_rue.sh [graines…]
cd "$(dirname "$0")/../work" || exit 1
STYLE="hand-painted cartoon 1990s PC adventure game background, VGA 256-color look with dithering, bold dark outlines, warm saturated colors, golden hour, humorous storybook fantasy, no text, no people"
P="Wide village main street of a Nordic snowy-mountain fantasy hamlet in the style of Skyrim: wooden longhouses with thatched roofs and carved dragon-head ridge ends, a hanging inn sign showing a sleeping giant, a merchant stall at the left with a striped awning, cabbages, cheese wheels, pastries and potions, a small wooden cart beside it, a wide open dirt road in the lower half, a stone bridge over a river on the right, a giant with a mammoth far away in the meadow beyond the river, a huge dragon flying in the golden sky above a tall snowy mountain peak like the Throat of the World with a long stone staircase, a sawmill with a water wheel in the distance, pine trees, blue mountain flowers. $STYLE"
for s in ${@:-21 22 23 24}; do flux-image "$P" -o "sky_$s.png" -s 1280x720 --seed $s >/dev/null 2>&1 && echo "ok $s"; done
