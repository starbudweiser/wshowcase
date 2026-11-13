#!/bin/zsh
# Mains du héros qui nettoient la vitre de l'écran : sa vraie main gantée (même style que ses portraits en gros plan), avec l'avant-bras
# qui monte du bas de l'image, plaquée contre la vitre côté joueur. Une image par façon de nettoyer. FLUX local, gratuit.
# Puis : build_sprites.sh (lignes « mains du héros »).
cd "$(dirname "$0")/../work" || exit 1
B="Same character and same painting style as the reference portrait: his right hand in a worn brown leather glove with an iron-plated cuff and his fur-trimmed armored sleeve. Extreme close-up of ONLY the hand and the long forearm, seen from the front as if pressed against a glass window right in front of the viewer, the forearm rising straight up from the bottom edge of the picture, the hand at the top. No face, no body, no glass, no frame. Plain flat solid magenta background, no shadow, no text."
e(){ out="$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$B $*" -i hp_neutral.png -o "$out" -s 576x1536 --seed $seed >/dev/null 2>&1; echo "ok $out"; }
e hand_palm.png 951 "The open palm and spread fingers pressed flat against the glass, wiping."
e hand_rag.png 952 "The fist clutches a crumpled greyish linen cloth rag pressed against the glass, wiping."
e hand_leaf.png 953 "The hand holds a large crinkled green cabbage leaf pressed flat against the glass like a sponge."
e hand_duster.png 954 "The hand holds the wooden handle of a fluffy cream-coloured feather duster, the feathers at the top."
e hand_sleeve.png 955 "The hand is a loose fist and the fur-trimmed sleeve cuff is pressed against the glass, rubbing with the sleeve."
e hand_finger.png 956 "The hand points one extended index finger pressed against the glass, scraping with the fingertip, the other fingers folded."
e hand_breath.png 957 "The open palm, fingers together, held flat and slightly tilted, polishing in circles."
echo done
