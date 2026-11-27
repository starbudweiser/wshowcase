#!/bin/zsh
# Saison 2 : reprise du repos de la créature verte (1re prise : elle tournait sur elle-même et montrait son dos sans visage).
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/ltx
PS="${PS:-work/crossover/persos}"; K=$PS/c_creeper.png
P="CAMERA: static locked-off full shot, the camera never moves, no zoom. SUBJECT: the green blocky creature of the image. ACTION: it stays in place facing the viewer for the whole shot, never turning around: it sways slightly from side to side on its four stubby legs, its sad face blinks slowly, its body swells a little and shrinks back as if breathing before a hiss, then comes back to the starting pose. It keeps exactly the same viewing angle, the same shape and the same colors. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery."
for sd in 2 3; do out="work/s2play/ltx/creeper_i$sd.mp4"; [ -f "$out" ] || video-locale "$P" -o "$out" -d 3 -s 768x960 -i $K -i $K --seed $((815+sd)) -- --no-audio >/dev/null 2>&1 && echo "ok creeper_i$sd"; done
