#!/bin/zsh
# Coucher du géant : son gourdin lancé casse un élément du décor. État « après » de ce coin du décor, calculé en entier par FIBO
# (édition sur consigne, sans masque) à partir du coin d'origine agrandi ×8 ; repassé ensuite à la résolution et à la palette du décor
# (tools/decor_casse.py). Prairie : la tour de guet en bois de gauche s'effondre ; fête : une guirlande de lanternes tombe.
cd "$(dirname "$0")/../work/sleep/decor" || exit 1
for s in 1 2 3; do
  [ -f meadow_apres_$s.png ] || fibo-image "Pixel art landscape, same picture. The tall wooden watchtower made of crossed logs has collapsed: it now lies broken on the ground as a low pile of snapped logs and planks behind the big animal skull. Where the tower stood, the mountains and the clouds behind are now visible. Everything else stays exactly the same: same skull, same grass, same mountains, same clouds, same pixel art style, same colors." -i meadow_avant_x8.png -o meadow_apres_$s.png -s 896x1200 --seed 940$s >/dev/null 2>&1 || echo "ECHEC meadow $s"; echo ok meadow $s
  [ -f party_apres_$s.png ] || fibo-image "Pixel art festival, same picture. The string of paper lanterns and pennants between the two wooden poles has snapped in the middle: both broken halves now hang down along the poles, and several lanterns have fallen onto the banquet table below, one of them broken. Everything else stays exactly the same: same poles, same tables, same grass, same hill, same pixel art style, same colors." -i party_avant_x8.png -o party_apres_$s.png -s 800x640 --seed 941$s >/dev/null 2>&1 || echo "ECHEC party $s"; echo ok party $s
done
# fête, 2e série : consigne stricte (la 1re série redessinait les lanternes et supprimait les fanions)
for s in 4 5 6; do
  [ -f party_apres_$s.png ] || fibo-image "Pixel art festival, exactly the same picture with the same tiny triangular colored pennants and the same small glowing yellow paper lanterns, same size and same style. Only change: the rope between the two wooden poles has snapped in the middle, so the pennants and lanterns of that rope now hang down vertically from the two poles in two broken strands, and two of the small lanterns lie fallen on the banquet table below. Do not add new lanterns, do not enlarge anything; the poles, tables, grass, hill and colors stay exactly the same." -i party_avant_x8.png -o party_apres_$s.png -s 800x640 --seed 941$s >/dev/null 2>&1 || echo "ECHEC party $s"; echo ok party $s
done

# fête, 3e série : agrandissement ×4 adouci (à ×8, FIBO redessine les lanternes en grand)
for s in 7 8 9; do
  [ -f party_apres_$s.png ] || fibo-image "Same pixel art picture, unchanged style and scale. Only change: the rope of small pennants and tiny lanterns between the two wooden poles is snapped in the middle and its two halves hang down along the poles; two tiny lanterns lie on the table below. Nothing else changes." -i party_avant_x4.png -o party_apres_$s.png -s 400x320 --seed 941$s >/dev/null 2>&1 || echo "ECHEC party $s"; echo ok party $s
done
# prairie, 2e série (remarque de Stéphan : le tas flottait à mi-hauteur de l'ancienne tour) : le tas est au pied de la tour, sur l'herbe
for s in 4 5 6 7; do
  [ -f meadow_apres_$s.png ] || fibo-image "Pixel art landscape, same picture. The tall wooden watchtower has fallen down: it now lies flat on the grass at its foot as a low heap of snapped logs and planks, on the ground at the same level as the bottom of the big animal skull, mostly hidden behind the skull, a few logs scattered on the grass beside it. Nothing of the tower rises above the top of the skull anymore: where the tower stood, only the mountains, the hills and the clouds behind are visible. Everything else stays exactly the same: same skull, same grass, same mountains, same clouds, same pixel art style, same colors." -i meadow_avant_x8.png -o meadow_apres_$s.png -s 896x1200 --seed 942$s >/dev/null 2>&1 || echo "ECHEC meadow $s"; echo ok meadow $s
done
echo fini
