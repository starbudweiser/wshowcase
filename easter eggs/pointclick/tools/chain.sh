#!/bin/zsh
# Enchaîne les calculs d'animation : poses -> décor animé -> sprites du décor.
D="$(cd "$(dirname "$0")" && pwd)"
while kill -0 84698 2>/dev/null; do sleep 15; done
python3 -I "$D/gen_regions.py"
"$D/gen_anim2.sh"
echo chain-done
