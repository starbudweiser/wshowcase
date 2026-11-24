#!/bin/zsh
# Marche du héros en trois quarts (24/11/2026, reprise de la saison 1) : vers l'avant-droite (il s'approche) et vers l'arrière-droite
# (il s'éloigne vers le fond). 4 poses par vue (contact, passage, autre contact, autre passage), 3 graines chacune, choix sur planche.
# Références : hero_front (ch2_hero) pour le costume, vue de dos (hb_stand) pour le bouclier. La gauche = miroir dans le moteur.
# FLUX 3 Klein local, gratuit, relançable (saute ce qui existe). Sorties : work/h34/.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p h34
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body from the top of the horns to the soles of the boots, no shadow."
SH="His round wooden shield with the riveted iron rim and the four-pointed iron star is strapped flat on the middle of his back, same size as in the references."
FR="walking diagonally toward the viewer and to the right, seen in a three-quarter front view: his chest and face turned halfway between the viewer and the right side of the picture, his whole body heading toward the lower right corner"
BK="walking diagonally away from the viewer toward the upper right, seen in a three-quarter rear view: his back turned to the viewer, his body and head turned halfway toward the right side of the picture, a sliver of his right cheek visible, heading into the distance on the right"
e(){ out="h34/$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
for s in 1 2 3; do
  e fr_a_$s.png $((1100+s)) "$K The character $FR. Contact pose: his right leg stretched forward with the heel touching the ground, his left leg behind on its toes, his left arm swinging forward, his right arm back. Serious focused expression, mouth closed, no smile." -i ch2_hero.png
  e fr_p_$s.png $((1110+s)) "$K The character $FR. Passing pose: standing on his straight right leg, his left knee lifted and passing under his body, both arms close to his body. Serious focused expression, mouth closed, no smile." -i ch2_hero.png
  e fr_b_$s.png $((1120+s)) "$K The character $FR. Contact pose: his left leg stretched forward with the heel touching the ground, his right leg behind on its toes, his right arm swinging forward, his left arm back. Serious focused expression, mouth closed, no smile." -i ch2_hero.png
  e fr_q_$s.png $((1130+s)) "$K The character $FR. Passing pose: standing on his straight left leg, his right knee lifted and passing under his body, both arms close to his body. Serious focused expression, mouth closed, no smile." -i ch2_hero.png
  e bk_a_$s.png $((1140+s)) "$K The character $BK. Contact pose: his right leg stretched forward away from us, his left leg behind on its toes showing the sole of the boot, his left arm swinging forward, his right arm back. $SH" -i ch2_hero.png -i hb_stand.png
  e bk_p_$s.png $((1150+s)) "$K The character $BK. Passing pose: standing on his straight right leg, his left knee lifted and passing under his body, arms close to his body. $SH" -i ch2_hero.png -i hb_stand.png
  e bk_b_$s.png $((1160+s)) "$K The character $BK. Contact pose: his left leg stretched forward away from us, his right leg behind on its toes showing the sole of the boot, his right arm swinging forward, his left arm back. $SH" -i ch2_hero.png -i hb_stand.png
  e bk_q_$s.png $((1170+s)) "$K The character $BK. Passing pose: standing on his straight left leg, his right knee lifted and passing under his body, arms close to his body. $SH" -i ch2_hero.png -i hb_stand.png
done
echo fini
