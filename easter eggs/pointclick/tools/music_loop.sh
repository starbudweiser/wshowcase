#!/bin/zsh
# Musique Flow -> boucle sans couture : coupe le fondu final, fond les 2 dernières secondes dans les 2 premières, normalise.
# Usage : music_loop.sh source.mp3 <id>   -> assets/pointclick/music/<id>.mp3
src="$1"; id="$2"; R="$(cd "$(dirname "$0")/../../.." && pwd)"; out="$R/assets/pointclick/music/$id.mp3"; mkdir -p "${out:h}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src"); E=${dur%.*}
while (( E > 20 )); do v=$(ffmpeg -hide_banner -ss $((E-1)) -t 1 -i "$src" -af volumedetect -f null - 2>&1 | awk '/mean_volume/{print int($5)}'); (( v > -28 )) && break; E=$((E-1)); done
ffmpeg -hide_banner -loglevel error -y -i "$src" -filter_complex "[0:a]atrim=0:2,asetpts=N/SR/TB,afade=t=in:d=2[h];[0:a]atrim=$((E-2)):$E,asetpts=N/SR/TB,afade=t=out:d=2[t];[h][t]amix=inputs=2:normalize=0[x];[0:a]atrim=2:$((E-2)),asetpts=N/SR/TB[b];[x][b]concat=n=2:v=0:a=1,loudnorm=I=-20:TP=-2[o]" -map "[o]" -ar 44100 -b:a 128k "$out"
echo "$id : boucle de $((E-2)) s"
