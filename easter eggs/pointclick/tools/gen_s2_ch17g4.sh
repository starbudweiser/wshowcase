#!/bin/zsh
# Saison 2, chapitre 17 (version anglaise) : parole du chevalier noir, 2e prise (1re : épée floue aux reflets verts quand il l'agitait).
cd "$(dirname "$0")/.." || exit 1; PS="${PS:-work/crossover/persos}"
out=work/s2play/ltx/bk_t2.mp4; [ -f "$out" ] || video-locale "CAMERA: static locked-off full shot, the camera never moves, no zoom. SUBJECT: the black knight in full armour of the image. ACTION: he talks in place with bravado: the helmet nods slightly with each word as if speaking a line, the shoulders move a little; his sword and his shield stay perfectly still in his hands, he does not swing them, then he comes back to the starting pose. He keeps exactly the same viewing angle and the same armour for the whole shot. ENV: plain flat solid magenta background, perfectly uniform, no ground, no shadow, no scenery." -o "$out" -d 2.5 -s 768x960 -i $PS/c_blackknight.png -i $PS/c_blackknight.png --seed 1916 -- --no-audio >/dev/null 2>&1 && echo "ok bk_t2"
echo fini
