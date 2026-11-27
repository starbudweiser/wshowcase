#!/bin/zsh
# Saison 2 : pas sonores d'un sol, découpés automatiquement dans un enregistrement de marche (banque de ressources) :
# 6 pas isolés (début détecté par silencedetect), fondu de fin, volume réduit -> assets/pointclick/sfx/step_<sol>_<0-5>.mp3.
# Usage : s2_steps.sh <enregistrement> <sol> [seuil_dB=-38]
src="$1"; kind="$2"; thr="${3:--38}"; R="$(cd "$(dirname "$0")/../../.." && pwd)"; mkdir -p "$R/assets/pointclick/sfx"
ons=($(ffmpeg -hide_banner -i "$src" -af "silencedetect=n=${thr}dB:d=0.1" -f null - 2>&1 | awk '/silence_end/{print $5}'))
i=0; for t in $ons; do
  (( i >= 6 )) && break; awk "BEGIN{exit !($t > 0.05)}" || continue
  ffmpeg -v error -y -ss $(awk "BEGIN{printf \"%.3f\", $t-0.02}") -t 0.32 -i "$src" -af "afade=t=out:st=0.24:d=0.08,volume=-4dB" -ac 1 -ar 44100 -b:a 48k "$R/assets/pointclick/sfx/step_${kind}_$i.mp3" && i=$((i+1))
done
echo "$kind : $i pas"
