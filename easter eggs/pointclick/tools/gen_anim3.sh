#!/bin/zsh
# Aveugles des scènes 4 à 10 : 2e image de tâtonnement et 2e image de danse. FLUX local, gratuit. Relançable.
cd "$(dirname "$0")/../work" || exit 1
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body, no shadow."
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
n=700
for k in cabbage:cabbage helmet:helmet basket:basket boot:boot mushroom:mushroom banner:banner partyhat:"party hat"; do
  id=${k%%:*}; obj=${k#*:}; n=$((n+2))
  e an_${id}_grope2.png blind_$id.png $n "$K The character with the $obj covering his eyes groping blindly, arms stretched out to the other side, body twisted."
  e an_${id}_dance2.png lit_$id.png $((n+1)) "$K The character dancing wildly, one leg kicked high, arms flung up to the other side, huge joyful smile."
done
echo done
