#!/bin/zsh
# Bois des papillons, décor refait (19/11/2026, revue du jeu) : l'ancien décor avait la mare sur tout le premier plan, le héros marchait sur l'eau.
# Même composition (référence : l'ancien décor), mais un large sol de feuilles praticable au premier plan et la mare réduite au coin inférieur droit.
cd "$(dirname "$0")/../work" || exit 1
SC="hand-painted cartoon 1990s PC adventure game background, VGA 256-color look with dithering, bold dark outlines, warm saturated colors, humorous storybook fantasy, no text, no people, no animals"
P="Exactly the same enchanted autumn forest clearing as in the reference picture, same style, same colors, same composition: the same giant glowing mushrooms on the left, the same mossy ruined stone wall too high to climb on the right, the same shafts of light and floating sparkles at the top, the same trees. Only change: the whole bottom of the picture is now a wide flat open ground covered with fallen golden and red leaves, a natural forest path where people can walk, from the left mushrooms to the right; the pond with lily pads is now small and only in the lower right corner of the picture. $SC"
for s in 1 2 3 4; do
  [ -f wood_bank_$s.png ] && continue
  flux-image "$P" -i wood.png -o wood_bank_$s.png -s 1280x720 --seed $((8100+s)) >/dev/null 2>&1 && echo "ok wood_bank_$s.png" || echo "ÉCHEC $s"
done
echo fini
