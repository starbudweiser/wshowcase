#!/bin/zsh
# Portraits du héros en gros plan, refaits le 27/11/2026 : les anciens montraient deux boucliers superposés (deux cerclages).
# Bouclier centré dans le dos (demande de Stéphan, 27/11).
# Étape 1 : nouvelle base calculée en entier (aucune retouche), d'après le portrait au bouclier unique du 13/11 (work/hp_neutral.png).
# Étape 2 (POSES=1) : toutes les poses calculées en entier depuis la base choisie (work/hp2/base.png). FLUX local. Puis build_sprites.sh.
cd "$(dirname "$0")/../work" || exit 1
mkdir -p hp2; SZ=1280x1024
SH="Exactly ONE large round wooden shield strapped flat against the MIDDLE of his back, perfectly centered behind his spine: its round iron rim peeks out symmetrically behind BOTH shoulders and rises behind his neck and the back of his helmet, like a disc centered behind him. ONE single iron rim around the edge, plain wooden planks, no second rim, no inner ring, no doubled outline, never shifted to one side, never held on one shoulder. The whole shield stays inside the frame."
F="close-up bust portrait of the same Nordic warrior, head and shoulders, same horned iron helmet, same blond braided hair, same face, same fur collar and riveted armor, same painting style, plain flat solid magenta background, no text, no border."
e(){ out="$1"; ref="$2"; seed="$3"; shift 3; [ -f "$out" ] || flux-image "$@" -i "$ref" -o "$out" -s $SZ --seed $seed >/dev/null 2>&1; echo "ok $out"; }
if [ -z "$POSES" ]; then
  for s in 1101 1102 1103 1104; do e hp2/base_$s.png hp_neutral.png $s "$F Looking straight at the viewer with a wry smirk, eyebrows slightly raised. $SH Wide framing with empty flat magenta space all around him."; done
  echo done; exit 0
fi
B="No border, no frame, full-bleed flat solid magenta background. The same close-up portrait, same framing, same horned helmet and face, same painting style. $SH"
R=hp2/base.png
[ -f hp2/hp_neutral.png ] || cp $R hp2/hp_neutral.png
e hp2/hp_talk.png $R 842 "$B Mouth wide open talking, eyebrows raised."
e hp2/hp_blink.png $R 843 "$B Eyes closed, wry smirk."
e hp2/hp_sleepy.png $R 844 "$B Half-closed tired eyes, a yawning wide open mouth."
e hp2/hp_knock1.png $R 871 "$B His armored gloved fist is raised in the foreground very close to the viewer, knuckles huge, knocking on a glass screen, his face slightly behind it looking at the viewer expectantly with raised eyebrows."
e hp2/hp_knock2.png $R 862 "$B His gloved fist is pulled back near his shoulder after knocking, head tilted, eyebrows raised, listening with a questioning look."
n=890
for p in "point:pointing his index finger straight at the viewer, eyebrows raised" "shrug:shrugging with both palms up beside his face, elbows bent, awkward smile" "plead:hands pressed together pleading, big puppy eyes" "think:holding his right hand up to his face with his fingers and thumb clearly touching his chin, thinking hard, one eyebrow raised" "wave:waving one hand at the viewer, friendly grin" "lean:leaning very close to the viewer, face slightly bigger, squinting suspiciously"; do
  k=${p%%:*}; d=${p#*:}; n=$((n+2))
  e hp2/hp_${k}.png $R $n "$B He is $d, mouth closed."
  e hp2/hp_${k}_t.png hp2/hp_${k}.png $((n+1)) "$B Exactly the same pose and gesture, same hands, but his mouth is wide open talking."
done
echo done
