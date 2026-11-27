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
k hero_wf $HS/sel_front.png 400 "--walk --n=12 --despill=all"; k hero_wb $HS/sel_back.png 400 "--walk --n=12 --despill=all"
k hero_iql $HS/sel_34_left.png 400 "--n=24 --despill=all"; k hero_iqr $HS/sel_34_right.png 400 "--n=24 --despill=all"; k hero_if $HS/sel_front.png 400 "--n=24 --despill=all"
k hero_tql $HS/sel_34_left.png 400 "--n=20 --despill=all"; k hero_tqr $HS/sel_34_right.png 400 "--n=20 --despill=all"; k hero_tf $HS/sel_front.png 400 "--n=20 --despill=all"
k guybrush_i $PS/c_guybrush_1.png 370 "--n=24 --despill=all"; k guybrush_t $PS/c_guybrush_1.png 370 "--n=20 --despill=all"
k swordmaster_i $PS/c_pirate.png 385 "--n=24"; k swordmaster_t $PS/c_pirate.png 385 "--n=20"
k lechuck2_i work/s2play/persos/lechuck_clean_1.png 440 "--n=24 --despill=all"; k lechuck2_t work/s2play/persos/lechuck_clean_1.png 440 "--n=20 --despill=all"
k sheo_i $PS/c_sheo.png 400 "--n=24"; k sheo_t $PS/c_sheo.png 400 "--n=20"
k max_i $PS/c_rabbit2_1.png 270 "--n=24"; k max_t $PS/c_rabbit2_1.png 270 "--n=20"
k sam_i $PS/c_dog3_2.png 380 "--n=24"; k sam_t $PS/c_dog3_2.png 380 "--n=20"
k parrot_i $PS/c_parrot.png 110 "--n=24 --despill=all"; k parrot_t $PS/c_parrot.png 110 "--n=20 --despill=all"
# --despill=all : nettoyage du rose du fond sur toute la silhouette, seulement pour qui ne porte aucun magenta ni violet
ids=("$@"); [ ${#ids} -eq 0 ] && ids=(${(k)K})
for b in $ids; do
  src="$V/${ALT[$b]:-$b}.mp4"
  [ -s "$src" ] || { echo "— $b : pas de vidéo"; continue; }
  "$PY" tools/s2_cycle.py "$src" $b "${K[$b]}" ${H[$b]} ${=O[$b]} && "$PY" tools/s2_retro.py anim $b
done
