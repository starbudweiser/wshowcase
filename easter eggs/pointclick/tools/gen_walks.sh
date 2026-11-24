#!/bin/zsh
# Vrais cycles de marche des secondaires (24/11/2026, reprise de la saison 1) : avant, ils glissaient sur 2 images (ou une seule), le
# passage reprenant leur pose de repos DE FACE au milieu d'une marche de profil. Cycle de 4 poses par vue : contact, passage, autre
# contact, autre passage. Profil pour tous ; face et dos pour le garde et la suiveuse (choix de Stéphan : profil + face + dos).
# Au plus simple (4 images par vue, 2 graines), choix sur planche avant montage. FLUX 3 Klein local, gratuit, relançable. Sorties : work/walks/.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p walks
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body, no shadow."
e(){ out="walks/$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
SA="right leg stretched far forward with the heel touching the ground, left leg far behind on its toes, arms swinging opposite"
SP="passing pose: standing on the straight right leg, the left knee lifted and passing under the body"
SB="left leg stretched far forward with the heel touching the ground, right leg far behind on its toes, arms swinging opposite"
SQ="passing pose: standing on the straight left leg, the right knee lifted and passing under the body"
side(){ n="$1"; ref="$2"; extra="$3"; b="$4"
  for s in 1 2; do
    e ${n}_sA_$s.png $((b+s)) "$K The character walking to the right in full right side profile, contact pose: $SA. $extra" -i $ref
    e ${n}_sP_$s.png $((b+10+s)) "$K The character walking to the right in full right side profile, $SP. $extra" -i $ref
    e ${n}_sB_$s.png $((b+20+s)) "$K The character walking to the right in full right side profile, contact pose: $SB. $extra" -i $ref
    e ${n}_sQ_$s.png $((b+30+s)) "$K The character walking to the right in full right side profile, $SQ. $extra" -i $ref
  done; }
fb(){ n="$1"; ref="$2"; extra="$3"; b="$4"
  for s in 1 2; do
    e ${n}_fA_$s.png $((b+s)) "$K The character walking straight toward the viewer, seen exactly from the front, his left foot stepping forward toward us, arms swinging. $extra" -i $ref
    e ${n}_fP_$s.png $((b+10+s)) "$K The character walking straight toward the viewer, seen exactly from the front, passing step with the feet close together, one knee slightly lifted. $extra" -i $ref
    e ${n}_fB_$s.png $((b+20+s)) "$K The character walking straight toward the viewer, seen exactly from the front, his right foot stepping forward toward us, arms swinging. $extra" -i $ref
    e ${n}_bA_$s.png $((b+30+s)) "$K The character walking straight away from the viewer, seen exactly from behind, his back to us, left foot stepping forward, arms swinging. $extra" -i $ref
    e ${n}_bP_$s.png $((b+40+s)) "$K The character walking straight away from the viewer, seen exactly from behind, his back to us, passing step with the feet close together. $extra" -i $ref
    e ${n}_bB_$s.png $((b+50+s)) "$K The character walking straight away from the viewer, seen exactly from behind, his back to us, right foot stepping forward, arms swinging. $extra" -i $ref
  done; }
side guard ch2_guard.png "He carries his spear upright in his right hand and his round shield on his left arm. Neutral bored expression." 1300
fb guard ch2_guard.png "He carries his spear upright and his round shield." 1340
side follower ch_follower.png "She carries her huge overloaded backpack, same backpack, same armor. Tired grumpy expression." 1400
fb follower ch_follower.png "She carries her huge overloaded backpack, same backpack, same armor." 1440
side giant ch_giant.png "He carries his huge wooden club on his shoulder." 1500
for s in 1 2; do
  e horseman_gA_$s.png $((1600+s)) "$K The headless horseman galloping to the right in full right side profile on his black horse, gallop phase: the horse's front legs stretched forward, hind legs pushing back, mane flying. His cloak flutters behind him." -i ch_horseman.png
  e horseman_gB_$s.png $((1610+s)) "$K The headless horseman galloping to the right in full right side profile on his black horse, gallop phase: all four hooves gathered under the horse's belly, in the air, mane flying." -i ch_horseman.png
  e horseman_gC_$s.png $((1620+s)) "$K The headless horseman galloping to the right in full right side profile on his black horse, gallop phase: the front hooves landing, the hind legs reaching forward under the body." -i ch_horseman.png
  e horseman_gD_$s.png $((1630+s)) "$K The headless horseman galloping to the right in full right side profile on his black horse, gallop phase: one front leg on the ground, the other lifted, hind legs pushing off, body leaning forward." -i ch_horseman.png
  e ride_A_$s.png $((1640+s)) "$K The horse with the horned-helmet hero riding in the saddle, walking to the right in full right side profile: the horse's right front leg stepping forward, the left hind leg pushing back." -i var_horse_ride2.png
  e ride_P_$s.png $((1650+s)) "$K The horse with the horned-helmet hero riding in the saddle, walking to the right in full right side profile: passing step, the horse's legs gathered under the body, one front hoof lifted." -i var_horse_ride2.png
  e ride_B_$s.png $((1660+s)) "$K The horse with the horned-helmet hero riding in the saddle, walking to the right in full right side profile: the horse's left front leg stepping forward, the right hind leg pushing back." -i var_horse_ride2.png
  e ride_Q_$s.png $((1670+s)) "$K The horse with the horned-helmet hero riding in the saddle, walking to the right in full right side profile: passing step, the other front hoof lifted, legs gathered under the body." -i var_horse_ride2.png
done
echo fini
