#!/bin/zsh
# Poses clés des cycles de marche, méthode LTX (24/11/2026) : les cycles faits pose par pose en FLUX n'avaient aucune continuité
# (corps qui pivote, lance qui saute, sac qui change, cheval qui trotte puis se cabre). Maintenant : UNE pose clé par personnage et
# par vue (ici, 3 graines, choix vérifié), puis une vidéo LTX de marche sur place (tools/gen_walk_ltx.sh) dont on extrait un cycle.
# FLUX 3 Klein local, gratuit, relançable. Sorties : work/walks/key/.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p walks/key
K="Exactly the same character, same face, same costume, same art style and colors, same plain flat magenta background, full body from head to feet with a margin all around, no shadow."
e(){ out="walks/key/$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$@" -o "$out" -s 1024x1024 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
for s in 1 2 3; do
  e guard_s_$s.png $((2300+s)) "$K The guard in a strict pure right side profile, walking to the right in mid-stride: we see only his left side, his chest and face turned fully to the right, the emblem of his tabard seen from the side. He holds his spear upright in his right hand, on the far side of his body, its butt lifted well above the ground, never touching it. His round shield is strapped on his left arm, on the near side, seen almost edge-on. Bored neutral expression, mouth closed." -i ch2_guard.png
  e follower_b_$s.png $((2310+s)) "$K The woman seen exactly from behind, walking straight away from the viewer in mid-stride, her back turned to us: her huge overloaded backpack covers her back, with the swords, the chicken and the loaves sticking out of the top exactly as in the reference, her red skirt below it, her armored legs and boots. Both arms visible at her sides." -i ch_follower.png
  e ride_s_$s.png $((2320+s)) "$K The horse with the horned-helmet viking riding in the saddle, in a strict pure right side profile, walking to the right at a calm walk: the near front leg stepping forward, the far hind leg pushing back, two hooves on the ground. The viking has the same adult proportions as in the second reference image, a serious focused expression, no smile, holding the reins with both hands, his boot in the stirrup." -i var_horse_ride2.png -i ch2_hero.png
  e guard_f_$s.png $((2330+s)) "$K The guard seen exactly from the front, walking straight toward the viewer in mid-stride, his left foot stepping toward us. He holds his spear upright in his right hand, its butt lifted well above the ground, never touching it. His round shield is on his left arm. Bored neutral expression, mouth closed." -i ch2_guard.png
  e guard_b_$s.png $((2340+s)) "$K The guard seen exactly from behind, walking straight away from the viewer in mid-stride, his back turned to us, his left foot stepping forward. He holds his spear upright in his right hand, its butt lifted well above the ground, never touching it. His round shield is on his left arm. His tabard seen from behind, plain, with no emblem on the back." -i ch2_guard.png
done
echo fini
