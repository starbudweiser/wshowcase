#!/bin/zsh
# Sprites d'animation du décor : oiseaux (3 poses d'ailes), volute de fumée, dragon (2 poses d'ailes intermédiaires). FLUX local, gratuit.
cd "$(dirname "$0")/../work" || exit 1
SP="hand-painted 1990s PC adventure game sprite, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 >/dev/null 2>&1; echo "ok $out"; }
g bird_1.png "A single small dark brown bird flying seen from the side, wings raised high above its body. $SP" --seed 601
g bird_2.png "Exactly the same bird, same style, same magenta background, wings held straight out level to the sides, seen from the side." -i bird_1.png --seed 602
g bird_3.png "Exactly the same bird, same style, same magenta background, wings swept down below its body." -i bird_1.png --seed 603
g puff.png "A single round fluffy puff of pale grey-white smoke, soft edges. $SP" --seed 611
g dragon_mid1.png "Exactly the same dragon, same style and colors, same magenta background, wings held half raised halfway between up and down, same side profile facing left." -i dragon_up.png --seed 621
g dragon_mid2.png "Exactly the same dragon, same style and colors, same magenta background, wings held level straight out, same side profile facing left." -i dragon_down.png --seed 622
echo done
