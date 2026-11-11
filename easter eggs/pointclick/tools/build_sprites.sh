#!/bin/zsh
# Détoure et réduit tous les sprites FLUX (work/) vers assets/pointclick/spr/. Relancer après toute régénération.
D="$(cd "$(dirname "$0")" && pwd)"; W="$D/../work"
P(){ python3 -I "$D/sprites_pixelize.py" "$@"; }
rm -f "$W/scales.json"
P hero_front "$W/ch_hero_32.png" 92
P hero_side "$W/pose_hero_walkA.png" 0 --like hero_front --bright 1.3
[ -f "$W/var_hero_stride.png" ] && P hero_stride "$W/var_hero_stride.png" 0 --like hero_front --bright 1.3
P merchant "$W/ch_merchant_51.png" 82
[ -f "$W/var_merchant_bucket.png" ] && P merchant_bucket "$W/var_merchant_bucket.png" 0 --like merchant
P guard "$W/ch_guard_62.png" 96
H="$W/ch_hen_74.png"; [ -f "$H" ] || H="$W/ch_hen_71.png"; P hen "$H" 30 40
P bucket "$W/item_bucket.png" 26 40
P honey "$W/item_honey.png" 18 40
