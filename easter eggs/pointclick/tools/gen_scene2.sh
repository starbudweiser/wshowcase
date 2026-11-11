#!/bin/zsh
# Images de la scène 2 et de l'animation ambiante (FLUX 3 Klein local, gratuit). Relançable : saute ce qui existe.
cd "$(dirname "$0")/../work" || exit 1
SP="full body game sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic proportions, detailed painterly shading, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
SC="hand-painted cartoon 1990s PC adventure game background, VGA 256-color look with dithering, bold dark outlines, warm saturated colors, golden hour, humorous storybook fantasy, no text, no people, no animals"
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" >/dev/null 2>&1; echo "ok $out"; }
# scène 1 sans le dragon peint (il devient un sprite qui vole)
g sky_22_nodragon.png "Remove the flying dragon from the golden sky. Fill the sky with matching clouds and sky colors. Keep everything else exactly identical." -i sky_22.png -s 1280x720 --seed 7
# dragon : ailes levées puis ailes basses
g dragon_up.png "A large brown dragon flying, seen in full side profile facing left, wings raised high, long neck and tail. $SP" -s 1024x1024 --seed 101
g dragon_down.png "Exactly the same dragon, same style and colors, same magenta background, now with both wings swept down below its body in a downstroke, same side profile facing left." -i dragon_up.png -s 1024x1024 --seed 102
# scène 2 : décor (3 graines)
P2="Wide scenic riverside trail in a Nordic snowy-mountain fantasy valley in the style of Skyrim: a big wooden sawmill with a large water wheel at the left, a wooden hitching post, a small vegetable garden with carrots behind a wooden fence, a flat dirt path in the lower half, a river with rocks, and on the right a tall sheer vertical rock cliff wall with a narrow flat ledge high up near its top, pine forest, snowy peaks and clouds. $SC"
for s in 121 122 123; do g "mill_$s.png" "$P2" -s 1280x720 --seed $s; done
# cheval et cavalier
g ch_horse.png "A sturdy brown Nordic horse standing in full side profile facing right, with a saddle and a blond mane, patient grumpy expression. $SP" -s 1024x1024 --seed 111
g var_horse_ride.png "The horned-helmet hero from the first image sitting in the saddle of the horse from the second image, riding to the right in full side profile, same art style, same plain flat magenta background, no shadow." -i ch_hero_32.png -i ch_horse.png -s 1024x1024 --seed 112
# objets
IT="hand-painted 1990s adventure game inventory item icon, bold dark outlines, saturated warm colors, detailed painterly shading, centered on a plain flat solid magenta background, no shadow, no text, no characters, no faces"
g item_carrot.png "A single fresh orange carrot with green leaves. $IT" -s 1024x1024 --seed 131
g item_cheese.png "A single large golden cheese wheel with a wedge cut out, slightly glowing. $IT" -s 1024x1024 --seed 132
echo done
