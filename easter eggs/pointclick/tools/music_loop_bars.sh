#!/bin/zsh
# Musique Flow -> boucle calée sur les mesures : de <début> (un temps fort) sur <mesures> mesures de <durée de mesure> s,
# coupes franches sur les temps forts (micro-fondus anti-clic), normalisée comme music_loop.sh.
# Usage : music_loop_bars.sh source.wav <id> <début_s> <mesure_s> <mesures>   -> assets/pointclick/music/<id>.mp3
src="$1"; id="$2"; t0="$3"; bar="$4"; n="$5"; R="$(cd "$(dirname "$0")/../../.." && pwd)"; out="$R/assets/pointclick/music/$id.mp3"
d=$(python3 -c "print(round($bar*$n,4))"); s=$(python3 -c "print(round($t0-0.005,4))")
ffmpeg -hide_banner -loglevel error -y -ss "$s" -t "$d" -i "$src" -af "afade=t=in:d=0.004,afade=t=out:st=$(python3 -c "print(round($d-0.012,4))"):d=0.012,loudnorm=I=-20:TP=-2" -ar 44100 -b:a 128k "$out"
echo "$id : boucle de $d s ($n mesures)"
