#!/bin/zsh
# Portraits du héros en gros plan (la nuit, quand il vient parler au joueur), tous dérivés d'une même base cadrée large où son bouclier
# rond est entier sur son dos, derrière l'épaule gauche : le bouclier est présent et jamais coupé dans toutes les poses.
# Remplace les portraits de gen_hero.sh, gen_knock.sh et gen_poses.sh. FLUX local, gratuit. Puis : build_sprites.sh
cd "$(dirname "$0")/../work" || exit 1
SZ=1280x1024
SH="His large round wooden shield with an iron rim and a central iron boss stays strapped on his back, the whole round shield visible behind his left shoulder on the left side of the picture, entirely inside the frame, never cut off."
B="No border, no frame, full-bleed flat solid magenta background. The same close-up portrait, same framing, same horned helmet and face, same painting style. $SH"
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s $SZ --seed $seed >/dev/null 2>&1; echo "ok $out"; }
# base (choisie parmi deux essais : graine 851, depuis l'ancien portrait hp_old/hp_neutral.png)
F="close-up bust portrait of the same character, head and shoulders, same horned iron helmet, same face, same painting style, plain flat solid magenta background, no text."
e hp_neutral.png hp_old/hp_neutral.png 851 "$F Looking straight at the viewer with a wry smirk, eyebrows slightly raised. He wears his large round wooden shield with an iron rim and a central iron boss strapped on his back: the whole round shield is clearly visible behind his left shoulder on the left side of the picture, entirely inside the frame, never cut off. Wide framing with empty flat magenta space all around him."
e hp_talk.png hp_neutral.png 842 "$B Mouth wide open talking, eyebrows raised."
e hp_blink.png hp_neutral.png 843 "$B Eyes closed, wry smirk."
e hp_sleepy.png hp_neutral.png 844 "$B Half-closed tired eyes, a yawning wide open mouth."
e hp_knock1.png hp_neutral.png 871 "$B His armored gloved fist is raised in the foreground very close to the viewer, knuckles huge, knocking on a glass screen, his face slightly behind it looking at the viewer expectantly with raised eyebrows."
e hp_knock2.png hp_neutral.png 862 "$B His gloved fist is pulled back near his shoulder after knocking, head tilted, eyebrows raised, listening with a questioning look."
n=890
for p in "point:pointing his index finger straight at the viewer, eyebrows raised" "shrug:shrugging with both palms up beside his face, awkward smile" "plead:hands pressed together pleading, big puppy eyes" "think:holding his right hand up to his face with his fingers and thumb clearly touching his chin, thinking hard, one eyebrow raised" "wave:waving one hand at the viewer, friendly grin" "lean:leaning very close to the viewer, face slightly bigger, squinting suspiciously"; do
  k=${p%%:*}; d=${p#*:}; n=$((n+2))
  e hp_${k}.png hp_neutral.png $n "$B He is $d, mouth closed."
  e hp_${k}_t.png hp_${k}.png $((n+1)) "$B Exactly the same pose and gesture, same hands, but his mouth is wide open talking."
done
echo done
