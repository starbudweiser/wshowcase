#!/bin/zsh
# Portrait du héros qui frappe à l'écran : poing en avant (impact) et poing retiré. FLUX local, gratuit.
cd "$(dirname "$0")/../work" || exit 1
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
e hp_knock1.png hp_neutral.png 871 "No border, no frame, full-bleed flat solid magenta background. The same close-up portrait, same horned helmet and face, same painting style, same plain flat magenta background. His armored gloved fist is raised in the foreground very close to the viewer, knuckles huge, knocking on a glass screen, his face slightly behind it looking at the viewer expectantly with raised eyebrows."
e hp_knock2.png hp_neutral.png 862 "The same close-up portrait, same horned helmet and face, same painting style, same plain flat magenta background. His gloved fist is pulled back near his shoulder after knocking, head tilted, eyebrows raised, listening with a questioning look."
echo done
