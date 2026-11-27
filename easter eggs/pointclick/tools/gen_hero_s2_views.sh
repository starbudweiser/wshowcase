#!/bin/zsh
# Saison 2 : vues du héros en pied (profil droit/gauche, trois-quarts droit/gauche, face, dos), expression neutre, fond magenta.
# Servent de références pour orienter le héros vers ses interlocuteurs dans les scènes (demande de Stéphan, 24/11).
# FLUX 3 Klein local, file calcul-lourd. Relançable : saute ce qui existe. Usage : gen_hero_s2_views.sh [id…]
cd "$(dirname "$0")/../work/crossover" || exit 1
mkdir -p hero_s2
BASE="Exactly the same man as in the reference picture: same face, same blond ponytail, same horned iron Viking helmet, same fur-collared studded leather armor, same round wooden shield strapped on his back, same brown leather kilt, same fur-topped boots, same painted style and colors. Full body from the top of the horns down to the boots, with empty space above and below, standing relaxed, arms hanging naturally at his sides, a calm neutral expression with the mouth closed, not smiling."
SP="hand-painted 2D point-and-click adventure game character art of the early 2000s, bold dark outlines, detailed painterly shading, realistic adult proportions, plain flat solid magenta background, no shadow, no ground, no text"
typeset -A P R
P[v_profile_right]="$BASE Seen in strict side profile, facing to the right of the picture: we see only his left side, his nose pointing right, the shield on his back visible behind him. $SP"; R[v_profile_right]=hero.png
P[v_profile_left]="$BASE Seen in strict side profile, facing to the left of the picture: we see only his right side, his nose pointing left, the shield on his back visible behind him. $SP"; R[v_profile_left]=hero_left.png
P[v_34_right]="$BASE Seen in three-quarter view, body and face turned toward the right of the picture. $SP"; R[v_34_right]=hero.png
P[v_34_left]="$BASE Seen in three-quarter view, body and face turned toward the left of the picture. $SP"; R[v_34_left]=hero_left.png
P[v_front]="$BASE Seen straight from the front, facing the viewer, symmetrical stance. $SP"; R[v_front]=hero_front.png
P[v_back]="$BASE Seen straight from behind: we see his back, the round wooden shield strapped on his back covering most of it, the back of the horned helmet and his blond ponytail; his face is not visible. $SP"; R[v_back]=hero.png
# 2e passe : costume complet partout (référence en pied) et vrais profils.
P[v_profile_right_b]="$BASE Pure side view like a frame of a side-scrolling adventure game walk cycle: his whole body is turned 90 degrees to the right, we see only his left side, his face in profile with only one eye visible and his nose silhouetted against the background, pointing right; the round shield on his back is seen edge-on behind him; arms hanging at his sides. $SP"; R[v_profile_right_b]=hero.png
P[v_profile_left_b]="$BASE Pure side view like a frame of a side-scrolling adventure game walk cycle: his whole body is turned 90 degrees to the left, we see only his right side, his face in profile with only one eye visible and his nose silhouetted against the background, pointing left; the round shield on his back is seen edge-on behind him; arms hanging at his sides. $SP"; R[v_profile_left_b]=hero.png
P[v_34_left_b]="$BASE Seen in three-quarter view, his body and face turned toward the LEFT side of the picture (the mirror orientation of the reference picture), arms hanging at his sides, with exactly the same costume details as the reference: leather pouches on the belt, straps, fur-topped boots. $SP"; R[v_34_left_b]=hero.png
P[v_34_right_b]="$BASE Seen in three-quarter view, his body and face turned toward the right side of the picture, arms hanging at his sides (not on his hips). $SP"; R[v_34_right_b]=hero.png
P[v_front_b]="$BASE Seen straight from the front, facing the viewer, symmetrical stance, arms hanging at his sides, with exactly the same costume details as the reference: leather pouches on the belt, straps, pleated leather kilt, fur-topped boots; the shield is on his back, only its rim visible behind his shoulders. $SP"; R[v_front_b]=hero.png
P[v_34_left_c]="$BASE Seen in three-quarter view facing LEFT: his chest, his feet and his face all point toward the left edge of the picture, we see his right shoulder in front and his left shoulder behind, his eyes look to the left; arms hanging at his sides; exactly the same costume details as the reference: leather pouches on the belt, straps, pleated leather kilt, fur-topped boots. $SP"; R[v_34_left_c]=hero.png
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(v_profile_right v_profile_left v_34_right v_34_left v_front v_back)
for id in $ids; do
  for s in 1 2; do
    out="hero_s2/${id}_$s.png"; [ -f "$out" ] && continue
    seed=$(( ${#id} * 1000 + s * 127 + 8181 ))
    flux-image "${P[$id]}" -i "${R[$id]}" -s 1024x1280 --seed $seed -o "$out" >/dev/null 2>&1
    echo "$(date +%H:%M:%S) ok $out"
  done
done
