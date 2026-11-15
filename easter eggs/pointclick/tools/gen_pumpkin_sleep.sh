#!/bin/zsh
# Cavalier à citrouille (fête) : ses 4 poses de coucher recalculées entières par FLUX, chacune à partir de la pose du cavalier sans
# tête déjà validée (2e référence : pose, place, taille) et de son guide avec citrouille (1re référence : apparence).
# Planches simplifiées (15/11/2026) : guide, s'étire, plie les antérieurs, couché replié, dort ; réveil = coucher à l'envers.
cd "$(dirname "$0")/../work/sleep" || exit 1
K="The headless horseman from the first picture, with his carved jack-o'-lantern pumpkin as a head, on his black horse, in exactly the same pose, place and size as the rider and horse in the second picture. Same hand-painted 1990s point-and-click adventure art style, same colors, same bold dark outlines, same bronze armor, same tattered dark cape. Exactly one pumpkin head, sitting on the rider's shoulders. Whole horse and rider entirely visible, plain flat solid magenta background, no shadow, no ground, no text."
e(){ out="horseman_pumpkin/$1"; [ -f "$out" ] || flux-image "$K $5" -i horseman_pumpkin/guide.png -i "horseman/$2" -b "horseman_pumpkin/$3" -o "$out" -s 1536x1024 --seed $4 >/dev/null 2>&1 && echo "ok $1" || echo "ÉCHEC $1"; }
for s in 1 2 3; do
  e k_stretch_$s.png k_stretch_2.png box_stretch.json $((9100+s)) "The horse lowers its head toward the ground while the rider in the saddle stretches both arms high above his shoulders, his carved pumpkin face yawning."
  e k_kneel_$s.png k_kneel_6.png box_kneel.json $((9110+s)) "The horse is halfway through lying down, its front legs folding under its chest; the rider sits in the saddle holding the reins, his carved pumpkin face drowsy with half-closed eyes."
  e k_fold_$s.png k_fold_3.png box_fold.json $((9120+s)) "The horse lies on the ground, all four legs folded under its body, head raised; the rider still sits upright in the saddle, his carved pumpkin face sleepy."
  e k_sleep_$s.png k_sleep_1.png box_sleep.json $((9130+s)) "The horse lies asleep on the ground, its muzzle resting on the ground, eyes closed; the rider has fallen asleep slumped forward over the horse's neck, arms dangling, his pumpkin head resting on the horse's mane, the carved pumpkin face with closed sleepy eyes."
done
echo fini
