#!/bin/zsh
# Caméos et aveuglés par vidéo LTX (24/11/2026, méthode validée par Stéphan) : depuis l'image A existante de chaque personnage,
# vidéo en boucle (même image au début et à la fin), caméra qui suit ; tools/walk_cycle.py en extrait 8 images.
# LTX-2.5 local, gratuit, relançable (saute ce qui existe). Sorties : work/walks/ltx/wk_<k>_loop.mp4, lit_<k>_loop.mp4.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p walks/ltx
CAM="CAMERA: locked-off tracking shot that follows the character at exactly his speed, so he stays at the same place and at the same size in the center of the frame for the whole shot."
ENV="He keeps exactly the same viewing angle for the whole shot, never turning. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
L(){ out="walks/ltx/$1_loop.mp4"; img="$2"; act="$3"; seed="$4"; [ -f "$out" ] || video-locale "$CAM SUBJECT: the character of the image. ACTION: $act $ENV" -o "$out" -d 2.5 -s 1024x1024 -i "$img" -i "$img" --seed $seed -- --no-audio >/dev/null 2>&1; echo "ok $out"; }
W="he walks to the right in strict side profile with a steady natural walking gait: heel strike, the legs alternating regularly, the knees bending, the arms swinging opposite to the legs, every step the same length, keeping his attitude and everything he carries exactly the same."
n=300
for k in explorer buster kids barbarian wizard halfling handyman simon pirate graham agent arthur lancelot merlin karadoc perceval mevanwi guenievre leodagan seli tavernier guethenoc roparzh troll; do
  n=$((n+1)); L wk_$k wk_${k}_a.png "$W" $n
done
L wk_racer wk_racer_a.png "the flying reptile flaps its big leathery wings in a steady regular rhythm, flying in place, its body and head staying level." 330
L wk_owl wk_owl_a.png "the owl flaps its wings in a steady regular rhythm, flying in place, its body staying level." 331
n=340
for k in pot sack hat cabbage helmet basket boot mushroom banner partyhat; do
  n=$((n+1)); L lit_$k lit_$k.png "the overjoyed character skips happily toward the viewer in a regular joyful hop, both arms raised in celebration, a huge smile, hopping from one foot to the other in rhythm." $n
done
# 2e passage (24/11) : objet tenu qui changeait de forme (chasseur de fantômes, bricoleur) ou disparaissait (bâton de Merlin)
W2="$W The object he holds stays exactly the same in his hand for the whole shot, same shape, same size, never changing and never disappearing."
L wk_buster2 wk_buster_a.png "$W2" 361; L wk_handyman2 wk_handyman_a.png "$W2" 362; L wk_merlin2 wk_merlin_a.png "$W2" 363
echo fini
