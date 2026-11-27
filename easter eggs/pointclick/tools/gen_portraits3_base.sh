#!/bin/zsh
# Portraits du héros, 3e version (27/11/2026) : Stéphan trouve le bouclier démesuré et de taille variable d'une pose à l'autre.
# Base : bouclier rond modeste (à peine plus large que les épaules), centré dans le dos, seul son haut dépasse derrière la nuque et les épaules.
cd "$(dirname "$0")/../work" || exit 1; mkdir -p hp3
F="close-up bust portrait of the same Nordic warrior, head and shoulders, same horned iron helmet, same blond braided hair, same face, same fur collar and riveted armor, same painting style, plain flat solid magenta background, no text, no border."
SH="A MODEST round wooden shield with one single iron rim is strapped flat on the middle of his back, perfectly centered behind his spine. The shield is only slightly wider than his shoulders: just its upper edge peeks out behind his neck and a little beyond each shoulder, its top edge at the level of his ears, well below the helmet horns. The shield is small relative to him, never huge, never a giant disc framing his head."
# 2e essai : la référence est la vue de face validée pour la nuit (views/pv_front_9.png), dont le bouclier a la bonne proportion
for s in 1211 1212 1213 1214; do [ -f hp3/base_$s.png ] || flux-image "$F Looking straight at the viewer with a wry smirk, eyebrows slightly raised. The same shield as in the reference, same small size: only its rim peeks out behind his shoulders. Head-and-shoulders close-up, slightly closer than the reference, empty flat magenta space around him." -i views/pv_front_9.png -o hp3/base_$s.png -s 1280x1024 --seed $s >/dev/null 2>&1; echo "ok $s"; done
