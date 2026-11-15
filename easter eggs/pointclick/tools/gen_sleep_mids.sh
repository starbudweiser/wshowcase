#!/bin/zsh
# Poses à mi-chemin entre deux poses clés validées (même personnage, même cadre) : découpent les grands changements de posture
# que LTX ne sait pas interpoler sans coupure. FLUX reçoit les deux images clés en référence. Relançable. Passe par calcul-lourd.
cd "$(dirname "$0")/../work/sleep" || exit 1
K="Same character, same art style, same colors, same camera, same scale and same ground level as both reference pictures. Full body entirely visible, plain flat solid magenta background, no shadow, no ground, no text."
m(){ ch="$1"; out="$2"; a="$3"; b="$4"; seed="$5"; shift 5; f="$ch/$out"; [ -f "$f" ] || flux-image "$K $*" -i "$ch/$a" -i "$ch/$b" -o "$f" -s 1536x1024 --seed $seed >/dev/null 2>&1; echo "ok $f"; }
for s in 1 2; do
  m giant mid_settlesleep_$s.png k_settle_1.png k_sleep_2.png 820$s "The giant in the in-between pose exactly halfway between the two pictures: rolling from his side onto his back, his head moving onto his club, one hand moving toward his belly, eyes nearly closed. Exactly one club."
  m giant mid_propwake_$s.png k_prop_1.png k_wake_2.png 821$s "The giant in the in-between pose exactly halfway between the two pictures: sitting up halfway, his upper body tilted back at forty-five degrees, both hands pressed on the ground behind him, his arms still low, his mouth starting to open in a yawn, his club lying on the ground beside him. Exactly one club."
  m giant mid_wakerise_$s.png k_wake_2.png k_rise_3.png 822$s "The giant in the in-between pose exactly halfway between the two pictures: still sitting, his arms lowered, one hand grabbing the handle of his club on the ground, pulling one knee up under him. Exactly one club."
  m giant mid_risestart_$s.png k_rise_3.png guide.png 823$s "The giant in the in-between pose exactly halfway between the two pictures: rising from his kneeling position, half standing with bent knees, one hand on his knee, the other hand lifting his club. Exactly one club."
  m nazim mid_sitlean_$s.png k_sit_2.png k_lean_2.png 824$s "The nobleman in the in-between pose exactly halfway between the two pictures: still sitting, uncrossing his legs, leaning back a little, both hands moving behind him toward the ground."
  m nazim mid_leansettle_$s.png k_lean_2.png k_settle_2.png 825$s "The nobleman in the in-between pose exactly halfway between the two pictures: lowering himself from his elbows onto his back, his shoulders halfway down to the ground, knees bent."
  m nazim mid_propwake_$s.png k_prop_1.png k_wake_2.png 826$s "The nobleman in the in-between pose exactly halfway between the two pictures: sitting up halfway, his upper body tilted back at forty-five degrees, both hands pressed on the ground behind him, blinking, hair messy."
done
# Poses de rupture (breakdowns) : là où les intervalles ToonCrafter sautent encore (pivot du corps, grand écart de hauteur).
# Chacune est cadrée par sa propre boîte (box_<nom>.json, hauteur à mi-chemin des deux poses) : sans boîte, FLUX recopie l'une des deux.
mb(){ ch="$1"; out="$2"; a="$3"; b="$4"; seed="$5"; box="$6"; shift 6; f="$ch/$out"; [ -f "$f" ] || flux-image "$K $*" -i "$ch/$a" -i "$ch/$b" -b "$ch/box_$box.json" -o "$f" -s 1536x1024 --seed $seed || echo "ECHEC $f"; echo "ok $f"; }
H="The giant in the in-between pose exactly halfway between the two pictures:"; N="The nobleman in the in-between pose exactly halfway between the two pictures:"
for s in 1 2 3 4; do
  mb giant mid_pivot_$s.png k_sit_2.png mid_sitlean_1.png 827$s sit "$H sitting on the ground, swinging his legs around, both knees bent and raised in front of his chest, his feet flat on the ground pointing toward the viewer, leaning back slightly with one hand behind him on the ground, his club sliding off his shoulder. Exactly one club."
done
for s in 1 2 3; do
  mb giant bd_yawncrouch_$s.png k_yawn_3.png k_crouch_1.png 828$s yawncrouch "$H his arms coming down from the yawn, one hand bringing his club down onto his shoulder, his knees bending into a half crouch, his back hunching forward, his mouth closing. Exactly one club."
  mb giant bd_propmpw_$s.png k_prop_1.png mid_propwake_2.png 829$s propmpw "$H still lying on his side, pushing himself up on his elbow and his other hand, his shoulders and chest lifting off the ground, his legs still stretched out on the ground, his club lying on the ground beside him. Exactly one club."
  mb giant bd_wakerise_$s.png k_wake_2.png k_rise_3.png 830$s wakerise "$H still sitting on the ground, his arms coming down from the stretch, leaning forward, one hand planted flat on the ground, tucking one leg under him to roll onto one knee, his other hand gripping the handle of his club on the ground. Exactly one club."
  mb nazim bd_sleepprop_$s.png k_sleep_3.png k_prop_1.png 831$s sleepprop "$N still lying on his back, waking up, lifting his head and shoulders off the ground, one elbow starting to push on the ground, his eyes half open."
  mb nazim bd_propmpw_$s.png k_prop_1.png mid_propwake_2.png 832$s propmpw "$N still lying on his side, pushing himself up on his elbow and his other hand, his shoulders lifting off the ground, his legs still stretched out, blinking."
  mb nazim bd_wakerise_$s.png k_wake_2.png k_rise_3.png 833$s wakerise "$N still sitting on the ground, his arms coming down, leaning forward, one hand planted flat on the ground, tucking one leg under him to roll onto one knee, his robe spreading on the ground."
done
echo fini

# 14/11 : gourdin continu (choix de Stéphan : il garde l'oreiller, le gourdin ne bouge que dans ses mains). Le gourdin reste là où il
# dormait (c_wake.png, club_fix.py) ; pour se relever, le géant le ramasse de la main droite (côté gauche de l'image), celle qui le
# porte sur l'épaule dans la pose debout.
for s in 1 2 3; do
  mb giant k_riseR_$s.png c_wake.png k_rise_3.png 834$s rise "The giant kneeling on one knee, getting up from the ground, the same kneeling pose as the second picture, but now his RIGHT hand (on the left side of the picture) grips the handle of his club, whose heavy end still rests on the ground at the left side of the picture, exactly where the club lies in the first picture. His other hand rests on his raised knee. Exactly one club."
done
# pose 5b : il pose le gourdin (main droite sur le manche, gros bout déjà au sol à sa place définitive, celle de c_msl.png)
for s in 1 2 3; do
  mb giant bd_lay_$s.png mid_pivot_2.png c_msl.png 835$s sit "The giant sitting on the ground like in the first picture, legs bent, leaning back on his other hand, his RIGHT hand (on the left side of the picture) lowering his club: he still holds the end of its handle, the heavy end of the club already rests on the ground at the left side of the picture, exactly where the club lies in the second picture. Nothing on his shoulder. Exactly one club."
done
