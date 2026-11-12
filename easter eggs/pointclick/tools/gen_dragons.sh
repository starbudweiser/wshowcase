#!/bin/zsh
# Dragons de plusieurs espèces (4 poses d'ailes chacun) : glace, braise (noir), marais (vert), jeune doré. FLUX local, gratuit, relançable.
cd "$(dirname "$0")/../work" || exit 1
SP="hand-painted 1990s PC adventure game sprite, bold dark outlines, saturated colors, plain flat solid magenta background, no shadow, no text"
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 >/dev/null 2>&1; echo "ok $out"; }
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
n=900
for d in "frost:a pale blue and white ice dragon with crystalline icy spikes and frosty translucent wings" "ember:a huge black dragon with glowing orange-red cracks like lava on its scales and tattered dark wings" "moss:a green swamp dragon with mossy scales, leathery wings and horned head" "gold:a small young golden dragon with a bright yellow belly, short horns and big cheerful wings"; do
  k=${d%%:*}; desc=${d#*:}; n=$((n+10))
  g dr_${k}_up.png "A $desc flying seen in full side profile facing left, wings raised high above its back, long tail. $SP" --seed $n
  e dr_${k}_mid1.png dr_${k}_up.png $((n+1)) "Exactly the same dragon, same style and colors, same magenta background, wings held half raised halfway between up and down, same side profile facing left."
  e dr_${k}_down.png dr_${k}_up.png $((n+2)) "Exactly the same dragon, same style and colors, same magenta background, wings swept down below its body, same side profile facing left."
  e dr_${k}_mid2.png dr_${k}_up.png $((n+3)) "Exactly the same dragon, same style and colors, same magenta background, wings held level straight out to the sides, same side profile facing left."
done
echo done
