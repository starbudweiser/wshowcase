#!/bin/zsh
# Saison 2 : livre les voix générées (work/crossover/voices/<fr|en>/cNN.*.mp3, ignoré par git) au jeu, à côté de celles de la
# saison 1 (assets/pointclick/voice/<fr|en>/, suivi par git). Usage : s2_voices_install.sh [dossier source des voix]
cd "$(dirname "$0")/.." || exit 1
SRC="${1:-work/crossover/voices}"; DST="../../assets/pointclick/voice"
for l in fr en; do rsync -a --include='c[0-9]*.mp3' --exclude='*' "$SRC/$l/" "$DST/$l/"; echo "$l : $(ls "$DST/$l" | grep -c '^c[0-9]') voix S2"; done
