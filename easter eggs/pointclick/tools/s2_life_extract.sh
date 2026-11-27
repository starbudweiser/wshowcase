#!/bin/zsh
# Saison 2 : vidéos LTX d'un chapitre -> boucles de jeu (tools/s2_cycle.py), puis leurs versions années 90 (tools/s2_retro.py).
# Saute ce qui n'existe pas encore (vidéo absente ou vide). Usage : s2_life_extract.sh [base…] ; PS / HS = fiches et vues du héros.
cd "$(dirname "$0")/.." || exit 1
PY="$HOME/Modèles IA/FLUX3-Klein/.venv/bin/python"; PS="${PS:-work/crossover/persos}"; HS="${HS:-work/crossover/hero_s2}"; V=work/s2play/ltx
typeset -A K H O ALT
k(){ K[$1]="$2"; H[$1]="$3"; O[$1]="$4"; }
k hero_wr $HS/sel_profile_right.png 400 "--walk --n=12 --despill=all"; k hero_wl $HS/sel_profile_left.png 400 "--walk --n=12 --despill=all"
ALT[hero_wr]=hero_wr2; ALT[hero_wl]=hero_wl2   # 2e prises : buste constant (1res : pivot entre profil et trois-quarts)
ALT[hero_tqr]=hero_tqr2; ALT[hero_if]=hero_if2   # 2e prises : visage pince-sans-rire (1res : un sourire revenait)
ALT[max_i]=max_i3; ALT[max_t]=max_t3   # 3es prises : même visage du début à la fin (1res : il devenait un lapin mignon)
ALT[creeper_i]=creeper_i2   # 2e prise : toujours face à nous (1re : elle tournait sur elle-même)
ALT[bk_t]=bk_t2   # 2e prise : épée immobile (1re : épée floue aux reflets verts)
ALT[luckdragon_i]=luckdragon_i2; ALT[luckdragon_t]=luckdragon_t2   # 2es prises en plan large (1res : gros plan sur la tête)
k hero_wf $HS/sel_front.png 400 "--walk --n=12 --despill=all"; k hero_wb $HS/sel_back.png 400 "--walk --n=12 --despill=all"
k hero_iql $HS/sel_34_left.png 400 "--n=24 --despill=all"; k hero_iqr $HS/sel_34_right.png 400 "--n=24 --despill=all"; k hero_if $HS/sel_front.png 400 "--n=24 --despill=all"
k hero_tql $HS/sel_34_left.png 400 "--n=20 --despill=all"; k hero_tqr $HS/sel_34_right.png 400 "--n=20 --despill=all"; k hero_tf $HS/sel_front.png 400 "--n=20 --despill=all"
k guybrush_i $PS/c_guybrush_1.png 370 "--n=24 --despill=all"; k guybrush_t $PS/c_guybrush_1.png 370 "--n=20 --despill=all"
k swordmaster_i $PS/c_pirate.png 385 "--n=24"; k swordmaster_t $PS/c_pirate.png 385 "--n=20"
k lechuck2_i work/s2play/persos/lechuck_clean_1.png 440 "--n=24 --despill=all"; k lechuck2_t work/s2play/persos/lechuck_clean_1.png 440 "--n=20 --despill=all"
k sheo_i $PS/c_sheo.png 400 "--n=24"; k sheo_t $PS/c_sheo.png 400 "--n=20"
k max_i $PS/c_rabbit2_1.png 270 "--n=24"; k max_t $PS/c_rabbit2_1.png 270 "--n=20"
k sam_i $PS/c_dog3_2.png 380 "--n=24"; k sam_t $PS/c_dog3_2.png 380 "--n=20"
k villager_i $PS/c_villager.png 360 "--n=24"; k villager_t $PS/c_villager.png 360 "--n=20"
k creeper_i $PS/c_creeper.png 330 "--n=24 --despill=all"; k creeper_w $PS/c_creeper.png 330 "--walk --n=12 --despill=all"
k indy_i $PS/c_archeo2_1.png 380 "--n=24"; k indy_t $PS/c_archeo2_1.png 380 "--n=20"
k snakes14_i work/s2play/items/p_snakes14_1.png 180 "--n=24 --despill=all"
k doc_i $PS/c_doc2.png 400 "--n=24"; k doc_t $PS/c_doc2.png 400 "--n=20"
k boy15_i work/s2play/persos/boy15_1.png 330 "--n=24"
k hat_i $PS/c_hat.png 120 "--n=24 --despill=all"; k hat_t $PS/c_hat.png 120 "--n=20 --despill=all"
k potions_i $PS/c_potions2.png 400 "--n=24 --despill=all"; k potions_t $PS/c_potions2.png 400 "--n=20 --despill=all"
k bat16_i work/s2play/persos/bat16_1.png 120 "--n=16 --despill=all"; k owl16_i work/s2play/persos/owl16_1.png 260 "--n=24 --despill=all"
k arthur_i $PS/c_king2_2.png 400 "--n=24"; k arthur_t $PS/c_king2_2.png 400 "--n=20"
k perceval_i $PS/c_knight_dim2_2.png 410 "--n=24"; k perceval_t $PS/c_knight_dim2_2.png 410 "--n=20"
k karadoc_i $PS/c_knight_fat4_2.png 390 "--n=24"; k karadoc_t $PS/c_knight_fat4_2.png 390 "--n=20"
k coconut_i $PS/c_coconut.png 400 "--n=24"; k coconut_t $PS/c_coconut.png 400 "--n=20"
k ni_i $PS/c_ni.png 440 "--n=24 --despill=all"; k ni_t $PS/c_ni.png 440 "--n=20 --despill=all"
k bk_i $PS/c_blackknight.png 400 "--n=24 --despill=all"; k bk_t $PS/c_blackknight.png 400 "--n=20 --despill=all"
k rabbit17_i $PS/c_killerrabbit.png 120 "--n=24"
k barbarian_i $PS/c_barbarian2_2.png 420 "--n=24"; k barbarian_t $PS/c_barbarian2_2.png 420 "--n=20"
k luckdragon_i $PS/c_luckdragon.png 260 "--n=24"; k luckdragon_t $PS/c_luckdragon.png 260 "--n=20"
k house_i $PS/c_house7_2.png 400 "--n=24"; k house_t $PS/c_house7_2.png 400 "--n=20"
k paleo_i $PS/c_paleo4_1.png 400 "--n=24"; k paleo_t $PS/c_paleo4_1.png 400 "--n=20"
k trex_i $PS/c_trex.png 380 "--n=24 --despill=all"; k trex_t $PS/c_trex.png 380 "--n=20 --despill=all"
k parrot_i $PS/c_parrot.png 110 "--n=24 --despill=all"; k parrot_t $PS/c_parrot.png 110 "--n=20 --despill=all"
# --despill=all : nettoyage du rose du fond sur toute la silhouette, seulement pour qui ne porte aucun magenta ni violet
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(${(k)K})
for b in $ids; do
  src="$V/${ALT[$b]:-$b}.mp4"
  [ -s "$src" ] || { echo "— $b : pas de vidéo"; continue; }
  "$PY" tools/s2_cycle.py "$src" $b "${K[$b]}" ${H[$b]} ${=O[$b]} && "$PY" tools/s2_retro.py anim $b
done
