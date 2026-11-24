#!/bin/zsh
# Cycles de marche par vidéo LTX (24/11/2026) : depuis une pose clé vérifiée, le personnage marche sur place, la caméra le suit
# (il reste au même endroit et à la même taille) ; tools/walk_cycle.py en extrait ensuite un cycle complet de 8 images (même cadre,
# même palette, aucune glissade). LTX-2.5 local, gratuit, relançable (saute ce qui existe). Usage : gen_walk_ltx.sh nom [nom...]
cd "$(dirname "$0")/../work" || exit 1; mkdir -p walks/ltx
CAM="CAMERA: locked-off tracking shot that follows the character at exactly his walking speed, so he stays at the same place and at the same size in the center of the frame for the whole shot."
ENV="ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
GAIT="a steady natural walking gait: heel strike, the legs alternating regularly, the knees bending, the arms swinging gently opposite to the legs, the body bobbing slightly, every step the same length"
# LOOP=1 : la pose clé sert aussi d'image de fin (LTX doit y revenir) : l'angle de vue reste le même et le cycle boucle (24/11 : sans
# cela, le 3/4 arrière du héros pivotait peu à peu vers un dos pur et la culotte du géant changeait de couleur)
L(){ if [ -n "$LOOP" ]; then out="walks/ltx/$1_loop.mp4"; else out="walks/ltx/$1.mp4"; fi; img="$2"; subj="$3"; seed="$4"
  [ -f "$out" ] && { echo "ok $out"; return; }
  if [ -n "$LOOP" ]; then video-locale "$CAM SUBJECT: $subj He keeps exactly the same viewing angle for the whole shot, never turning. $ENV" -o "$out" -d 2.5 -s 1024x1024 -i "$img" -i "$img" --seed $((seed + 100)) -- --no-audio >/dev/null 2>&1
  else video-locale "$CAM SUBJECT: $subj $ENV" -o "$out" -d 4 -s 1024x1024 -i "$img" --seed $seed -- --no-audio >/dev/null 2>&1; fi; echo "ok $out"; }
for n in "$@"; do case $n in
  hero_qb) L hero_qb h34/bk_a_2.png "the horned-helmet viking seen in three-quarter rear view, his back and his round shield turned to us. ACTION: he walks away from the viewer diagonally toward the upper right with $GAIT; his shield stays strapped flat on his back." 51;;
  hero_qf) L hero_qf h34/fr_a_1.png "the horned-helmet viking seen in three-quarter front view. ACTION: he walks diagonally toward the viewer and to the right with $GAIT; serious focused face, no smile." 52;;
  guard_s) L guard_s walks/key/$KEY "the town guard in strict right side profile. ACTION: he walks to the right with $GAIT; he keeps his spear upright in his far hand, its butt never touching the ground, and his shield steady on his near arm." 53;;
  follower_b) L follower_b walks/key/$KEY "the woman with the huge overloaded backpack, seen exactly from behind. ACTION: she walks straight away from the viewer with $GAIT; the backpack and everything sticking out of it stay exactly the same, only bouncing slightly with her steps." 54;;
  ride_s) L ride_s walks/key/$KEY "the horse with the viking rider, in strict right side profile. ACTION: the horse walks to the right at a calm regular four-beat walk, lifting and placing its four hooves one after the other, its head nodding gently with each step, its tail swaying; the rider sits still in the saddle, swaying slightly with the horse, holding the reins." 55;;
  follower_s) L follower_s walks/follower_sA_1.png "the woman in armor with the huge overloaded backpack, in strict right side profile. ACTION: she walks to the right with $GAIT; the backpack and everything sticking out of it stay exactly the same, only bouncing slightly with her steps." 56;;
  follower_f) L follower_f walks/follower_fA_2.png "the woman in armor with the huge overloaded backpack, seen exactly from the front. ACTION: she walks straight toward the viewer with $GAIT; the backpack and everything sticking out of it stay exactly the same." 57;;
  giant_s) L giant_s walks/giant_sA_1.png "the huge bald giant carrying his wooden club on his shoulder, in strict right side profile. ACTION: he walks to the right with a heavy slow $GAIT; the club stays on his shoulder, held by the same hand." 58;;
  horseman_g) L horseman_g walks/horseman_gA_1.png "the headless horseman on his black horse, in strict right side profile. ACTION: the horse gallops to the right at a steady regular gallop, its legs moving in a natural galloping sequence, mane and tail flying, the rider's cloak fluttering; the rider stays in the saddle." 59;;
  guard_f) L guard_f walks/key/$KEY "the town guard seen exactly from the front. ACTION: he walks straight toward the viewer with $GAIT; he keeps his spear upright in his hand, its butt never touching the ground, and his shield steady on his other arm." 60;;
  guard_b) L guard_b walks/key/$KEY "the town guard seen exactly from behind. ACTION: he walks straight away from the viewer with $GAIT; he keeps his spear upright in his hand, its butt never touching the ground, and his shield steady on his other arm." 61;;
esac; done
echo fini
