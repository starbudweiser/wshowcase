#!/bin/zsh
# Sprites du nettoyage de la vitre, de bout en bout (18/11/2026) : poses choisies (work/hero_clean/choix.json)
#   1. incrustation professionnelle par Fusion 21 (DeltaKeyer, fond propre, matte intérieure) : tools/key_fusion.py
#   2. sprites à l'échelle du portrait de nuit + mesures visage / contact : tools/hero_clean_sprites.py -> assets/pointclick/spr/hc_*.png, js/pointclick/data/clean.js
# Passe par la file calcul-lourd (un seul calcul lourd à la fois sur ce Mac).
[ -z "$CALCUL_LOURD_TIENT" ] && exec "$HOME/.local/bin/calcul-lourd" "$0" "$@"
set -e
T=${0:A:h}; PY="$HOME/Modèles IA/FLUX3-Klein/.venv/bin/python"
export KEY_SRC="$T/../work/hero_clean" KEY_OUT="$T/../work/hero_clean/key"
export KEY_LIST=$("$PY" -c "import json; print(','.join(sorted(set(json.load(open('$KEY_SRC/choix.json')).values()))))")
"$PY" "$T/key_fusion.py" prep
~/.claude/skills/fusion/fu_run.sh stop >/dev/null; sleep 2            # Render Node neuf : il se fige parfois après une longue session
timeout 900 ~/.claude/skills/fusion/fu_run.sh "$T/key_fusion.py"
~/.claude/skills/fusion/fu_run.sh stop >/dev/null
"$PY" -I "$T/hero_clean_sprites.py"
