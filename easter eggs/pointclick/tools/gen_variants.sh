#!/bin/zsh
# Variantes des personnages (édition FLUX 3 Klein avec image de référence) + poule seule.
cd "$(dirname "$0")/../work" || exit 1
K="Exactly the same character, same costume, same art style, same colors, same plain flat magenta background, full body, no shadow."
[ -f var_merchant_bucket.png ] || flux-image "$K A wooden bucket with iron bands is stuck over his entire head, covering his eyes and nose, only the mustache and chin stick out below the bucket, arms raised in panic." -i ch_merchant_51.png -o var_merchant_bucket.png -s 1024x1024 --seed 81 >/dev/null 2>&1; echo ok bucket
[ -f var_hero_stride.png ] || flux-image "$K The character walking to the right in full right side profile, mid-stride with the back leg pushed far behind with the heel lifted and the front leg stepping far forward, arms swinging, determined smirk." -i pose_hero_walkA.png -o var_hero_stride.png -s 1024x1024 --seed 44 >/dev/null 2>&1; echo ok stride
flux-image "One single plump white hen standing in profile, pecking, hand-painted 1990s adventure game art, bold dark outlines, plain flat solid magenta background, no shadow, no text" -o ch_hen_74.png -s 1024x1024 --seed 74 >/dev/null 2>&1; echo ok hen
echo done
