#!/bin/zsh
# Saison 2 : sprite de jeu du capitaine fantôme (chapitre 11) recalculé en entier d'après sa fiche validée, sans halo ni fumée autour
# de lui (le halo vert du fiche se mêlait au fond magenta : franges roses au détourage). L'aura, les volutes et la lumière verte sont
# dessinées par le moteur (fx2.js). FLUX 3 Klein local (file calcul-lourd), relançable.
cd "$(dirname "$0")/.." || exit 1; mkdir -p work/s2play/persos
REF="${PS:-work/crossover/persos}/c_lechuck_1.png"
K="Exactly the same ghost pirate captain as in the reference picture: same face, same black beard, same tricorn hat, same long dark coat with gold buttons, same pose with his raised clawed hand, same pale translucent green skin, same painted style. No glowing aura, no smoke, no mist, no wisps and no light around him: clean sharp outlines on a plain flat solid magenta background, full body, no shadow, no ground, no text."
for seed in 1 2 3; do out="work/s2play/persos/lechuck_clean_$seed.png"; [ -f "$out" ] || flux-image "$K" -i "$REF" -s 1024x1280 --seed $seed -o "$out"; done
