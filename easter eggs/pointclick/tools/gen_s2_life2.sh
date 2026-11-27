#!/bin/zsh
# Saison 2 : reprises des marches du héros (1re prise : le buste oscillait entre profil et trois-quarts). Consigne plus stricte,
# deux graines de plus par vue ; tools/s2_cycle.py mesure le pivot du buste, on garde la meilleure prise après contrôle à l'œil.
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
HS="${HS:-work/crossover/hero_s2}"
TRK="CAMERA: locked-off tracking shot that follows the character at exactly his speed, so he stays at the same place and at the same size in the center of the frame for the whole shot."
WALK="he walks with a steady natural walking gait: heel strike, the legs alternating regularly, the knees bending, the arms swinging opposite to the legs, every step the same length."
STRICT="His shoulders, chest and hips keep exactly the same orientation for the whole shot: the torso never twists, never turns toward the viewer and never turns away; only the legs and arms move. His usual smirk is gone, no smile at all, a blasé deadpan face. He keeps the same costume and everything he carries. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
w(){ out="work/s2play/ltx/$1.mp4"; [ -f "$out" ] || video-locale "$TRK SUBJECT: the character of the image. ACTION: $WALK $2 $STRICT" -o "$out" -d 2.5 -s 768x960 -i "$3" -i "$3" --seed $4 -- --no-audio >/dev/null 2>&1 && echo "ok $1"; }
for sd in 2 3; do
  w hero_wr$sd "He walks to the right in strict side profile." $HS/sel_profile_right.png $((610+sd))
  w hero_wl$sd "He walks to the left in strict side profile." $HS/sel_profile_left.png $((620+sd))
done
echo fini
