#!/bin/zsh
# Détoure et réduit tous les sprites FLUX (work/) vers assets/pointclick/spr/. Relancer après toute régénération.
D="$(cd "$(dirname "$0")" && pwd)"; W="$D/../work"
P(){ python3 -I "$D/sprites_pixelize.py" "$@"; }
rm -f "$W/scales.json"
P hero_front "$W/ch_hero_32.png" 92
P hero_side "$W/pose_hero_walkA.png" 0 --like hero_front --bright 1.6
[ -f "$W/var_hero_stride.png" ] && P hero_stride "$W/var_hero_stride.png" 0 --like hero_front --bright 1.6
P merchant "$W/ch_merchant_51.png" 82
[ -f "$W/var_merchant_bucket.png" ] && P merchant_bucket "$W/var_merchant_bucket.png" 0 --like merchant
P guard "$W/ch_guard_62.png" 96
H="$W/ch_hen_74.png"; [ -f "$H" ] || H="$W/ch_hen_71.png"; P hen "$H" 30 40
P bucket "$W/item_bucket.png" 26 40
P honey "$W/item_honey.png" 18 40
# scène 2 et décor vivant
P dragon_up "$W/dragon_up.png" 64
P dragon_down "$W/dragon_down.png" 0 --like dragon_up
P horse "$W/ch_horse.png" 90
P horse_ride "$W/var_horse_ride.png" 0 --like horse
[ -f "$W/item_carrot.png" ] && P carrot "$W/item_carrot.png" 18 40
[ -f "$W/item_cheese.png" ] && P cheese "$W/item_cheese.png" 22 40
# scène 3
P giant "$W/ch_giant.png" 170
[ -f "$W/var_giant_swing.png" ] && P giant_swing "$W/var_giant_swing.png" 0 --like giant
P nazim "$W/ch_nazim.png" 96
# les aveugles (Pourquoi il fait si sombre ?) et leurs versions éclairées
P blind_pot "$W/blind_pot.png" 84
P lit_pot "$W/lit_pot.png" 0 --like blind_pot
P blind_sack "$W/blind_sack.png" 88
P lit_sack "$W/lit_sack.png" 0 --like blind_sack
P blind_hat "$W/blind_hat.png" 88
P lit_hat "$W/lit_hat.png" 0 --like blind_hat
