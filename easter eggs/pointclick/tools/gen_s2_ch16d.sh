#!/bin/zsh
# Saison 2, chapitre 16 : élèves du premier plan animés (2es prises : 1res, un gobelet en double et une fourchette devenue cuillère) (bandes gauche et droite du décor, boucle parfaite : même image au début et à la fin).
cd "$(dirname "$0")/.." || exit 1
P="CAMERA: static locked-off shot, the camera never moves, no zoom. SUBJECT: teenage students in long black school robes sitting side by side at a long wooden dining table set with golden goblets and plates, in a castle hall at night, painted illustration. ACTION: the students stay seated in place and stay alive and calm: they breathe, blink slowly, glance at each other, one slightly turns his head toward his neighbour and back; their hands stay resting on the table, nobody picks anything up, the table, the plates, the cutlery and the goblets never move and nothing new appears; nobody stands up, nobody leaves, every face stays exactly the same person, nobody new appears."
for s in left right; do out="work/s2play/ltx/hall_${s}2.mp4"; [ -f "$out" ] || video-locale "$P" -o "$out" -d 3 -s 576x320 -i work/s2play/hall_$s.png -i work/s2play/hall_$s.png --seed 1721 -- --no-audio >/dev/null 2>&1 && echo "ok $s"; done
echo fini
