#!/bin/zsh
# Détoure et réduit tous les sprites FLUX (work/) vers assets/pointclick/spr/. Relancer après toute régénération.
# Les images d'une même animation partagent le facteur d'échelle du personnage (--like) et sont recentrées sur leur centre de masse.
D="$(cd "$(dirname "$0")" && pwd)"; W="$D/../work"
P(){ python3 -I "$D/sprites_pixelize.py" "$@"; }
rm -f "$W/scales.json"
# héros (tenue de fer nordique) : face, marche de profil en 3 images, debout de profil, parole, repos
P hero_front "$W/ch2_hero.png" 92
for f in walkA walkP walkB stand talk idle2; do P hero_$f "$W/an_hero_$f.png" 0 --like hero_front; done
# marchand
P merchant "$W/ch2_merchant.png" 82
for f in idle2 talk1 talk2; do P merchant_$f "$W/an_merchant_$f.png" 0 --like merchant; done
P merchant_bucket "$W/an_merchant_bucket.png" 0 --like merchant
# garde de Blancherive
P guard "$W/ch2_guard.png" 96
for f in idle2 talk walkA walkB; do P guard_$f "$W/an_guard_$f.png" 0 --like guard; done
# poule, objets
H="$W/ch_hen_74.png"; P hen "$H" 30 40
for f in peck walk; do P hen_$f "$W/an_hen_$f.png" 0 --like hen; done
P bucket "$W/item_bucket.png" 26 40
P honey "$W/item_honey.png" 18 40
# scène 2
P dragon_up "$W/dragon_up.png" 64
P dragon_down "$W/dragon_down.png" 0 --like dragon_up
P dragon_mid1 "$W/dragon_mid1.png" 0 --like dragon_up
P dragon_mid2 "$W/dragon_mid2.png" 0 --like dragon_up
P bird_1 "$W/bird_1.png" 12
for f in 2 3; do P bird_$f "$W/bird_$f.png" 0 --like bird_1; done
P puff "$W/puff.png" 16
P horse "$W/ch2_horse.png" 90
for f in idle2 walkA walkB; do P horse_$f "$W/an_horse_$f.png" 0 --like horse; done
P horse_ride "$W/var_horse_ride2.png" 0 --like horse
P carrot "$W/item_carrot.png" 18 40
P cheese "$W/item_cheese.png" 22 40
# scène 3
P giant "$W/ch_giant.png" 170
for f in idle2 talk walkA walkB; do P giant_$f "$W/an_giant_$f.png" 0 --like giant; done
P giant_swing "$W/var_giant_swing.png" 0 --like giant
P nazim "$W/ch_nazim.png" 96
for f in idle2 talk; do P nazim_$f "$W/an_nazim_$f.png" 0 --like nazim; done
# les aveugles et leurs versions éclairées (danse)
P blind_pot "$W/blind_pot.png" 84;   P blind_pot2 "$W/an_pot_grope2.png" 0 --like blind_pot;   P lit_pot "$W/lit_pot.png" 0 --like blind_pot;   P lit_pot2 "$W/an_pot_dance2.png" 0 --like blind_pot
P blind_sack "$W/blind_sack.png" 88; P blind_sack2 "$W/an_sack_grope2.png" 0 --like blind_sack; P lit_sack "$W/lit_sack.png" 0 --like blind_sack; P lit_sack2 "$W/an_sack_dance2.png" 0 --like blind_sack
P blind_hat "$W/blind_hat.png" 88;   P blind_hat2 "$W/an_hat_grope2.png" 0 --like blind_hat;   P lit_hat "$W/lit_hat.png" 0 --like blind_hat;   P lit_hat2 "$W/an_hat_dance2.png" 0 --like blind_hat
# scènes 4 à 10 (relancer après tools/gen_scenes4_10.sh) : ne traite que les images déjà calculées
Q(){ n="$1"; f="$2"; shift 2; [ -f "$W/$f" ] && P "$n" "$W/$f" "$@"; }
Q farmer ch_farmer.png 90
Q cart ch_cart.png 56
Q cabbage item_cabbage.png 22 40
Q arrow item_arrow.png 22 40
Q mannequin ch_mannequin.png 100
Q horseman ch_horseman.png 130
Q horseman_pumpkin var_horseman_pumpkin.png 0 --like horseman
Q pumpkin item_pumpkin.png 22 40
Q butterfly ch_butterfly.png 40
Q butterfly2 var_butterfly2.png 0 --like butterfly
Q follower ch_follower.png 98
Q anvil item_anvil.png 22 40
Q cake ch_cake.png 76
Q cake_lit var_cake_lit.png 0 --like cake
for k in cabbage helmet basket boot mushroom banner partyhat; do Q blind_$k blind_$k.png 86; Q lit_$k lit_$k.png 0 --like blind_$k; Q blind_${k}2 an_${k}_grope2.png 0 --like blind_$k; Q lit_${k}2 an_${k}_dance2.png 0 --like blind_$k; done

# héros détaillé (relancer après tools/gen_hero.sh)
for n in 1 2 3 4 5 6 7 8; do Q hero_w$n hw_$n.png 0 --like hero_front; done
Q hero_sIdle hs_idle2.png 0 --like hero_front; Q hero_sTalk1 hs_talk1.png 0 --like hero_front; Q hero_sTalk2 hs_talk2.png 0 --like hero_front; Q hero_sReach hs_reach.png 0 --like hero_front; Q hero_sPick hs_pick.png 0 --like hero_front
Q hero_fWalkA hf_walkA.png 0 --like hero_front; Q hero_fWalkP hf_walkP.png 0 --like hero_front; Q hero_fWalkB hf_walkB.png 0 --like hero_front; Q hero_fBlink hf_blink.png 0 --like hero_front
Q hero_fTalk2 hf_talk2.png 0 --like hero_front; Q hero_fShrug hf_shrug.png 0 --like hero_front; Q hero_fSurprise hf_surprise.png 0 --like hero_front
Q hero_bStand hb_stand.png 0 --like hero_front; Q hero_bWalkA hb_walkA.png 0 --like hero_front; Q hero_bWalkB hb_walkB.png 0 --like hero_front
Q hero_pNeutral hp_neutral.png 250 72 --fill; Q hero_pTalk hp_talk.png 0 --like hero_pNeutral --fill; Q hero_pBlink hp_blink.png 0 --like hero_pNeutral --fill; Q hero_pSleepy hp_sleepy.png 0 --like hero_pNeutral --fill

# dragons d'autres espèces (relancer après tools/gen_dragons.sh)
Q dragon_frost_up dr_frost_up.png 72; Q dragon_ember_up dr_ember_up.png 78; Q dragon_moss_up dr_moss_up.png 66; Q dragon_gold_up dr_gold_up.png 48
for k in frost ember moss gold; do for q in mid1 down mid2; do Q dragon_${k}_$q dr_${k}_$q.png 0 --like dragon_${k}_up; done; done

# clins d'œil (relancer après tools/gen_winks.sh)
Wk(){ k="$1"; h="$2"; Q wk_${k}_a wk_${k}_a.png $h; Q wk_${k}_b wk_${k}_b.png 0 --like wk_${k}_a; }
Wk explorer 88; Wk buster 88; Wk kids 84; Wk barbarian 100; Wk wizard 100; Wk halfling 62; Wk handyman 88; Wk simon 78; Wk pirate 88; Wk graham 84; Wk agent 90
Wk ghost 58; Wk racer 46; Wk tentacle 64; Wk owl 40; Wk troll 48; Q wk_boulder wk_boulder.png 64; Q wk_owl_f wk_owl_f.png 0 --like wk_owl_a; Q wk_horsearmor wk_horsearmor.png 0 --like horse

Q hero_pKnock1 hp_knock1.png 0 --like hero_pNeutral --fill; Q hero_pKnock2 hp_knock2.png 0 --like hero_pNeutral --fill
