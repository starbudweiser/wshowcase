#!/bin/zsh
# Aveugles animés puis décors animés des scènes 4 à 10 (une seule file de calcul).
D="$(cd "$(dirname "$0")" && pwd)"
zsh "$D/gen_anim3.sh"
python3 -I "$D/gen_regions.py" market gate house ford wood hall party
echo chain-done
