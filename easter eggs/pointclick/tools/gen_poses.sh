#!/bin/zsh
# Poses du héros en gros plan (nuit, nettoyage de l'écran) : chaque pose bouche fermée + bouche ouverte. FLUX local, gratuit.
cd "$(dirname "$0")/../work" || exit 1
B="No border, no frame, full-bleed flat solid magenta background. The same close-up portrait, same horned helmet and face, same painting style."
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
n=880
for p in "point:pointing his index finger straight at the viewer, eyebrows raised" "shrug:shrugging with both palms up beside his face, awkward smile" "plead:hands pressed together pleading, big puppy eyes" "think:one hand on his chin, thinking, one eyebrow raised" "wave:waving one hand at the viewer, friendly grin" "lean:leaning very close to the viewer, face slightly bigger, squinting suspiciously"; do
  k=${p%%:*}; d=${p#*:}; n=$((n+2))
  e hp_${k}.png hp_neutral.png $n "$B He is $d, mouth closed."
  e hp_${k}_t.png hp_${k}.png $((n+1)) "$B Exactly the same pose and gesture, same hands, but his mouth is wide open talking."
done
echo done
