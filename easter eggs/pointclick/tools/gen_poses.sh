#!/bin/zsh
# Poses d'un personnage à partir d'une image de référence (édition FLUX 3 Klein). Usage : gen_poses.sh nom reference.png
cd "$(dirname "$0")/../work" || exit 1
n="$1"; ref="$2"; K="Exactly the same character, same costume, same art style, same colors, same plain flat magenta background, full body, no shadow."
flux-image "$K The character walking to the right in full right side profile, right leg stepping far forward, left arm swinging forward, mouth closed, wry smirk." -i "$ref" -o "pose_${n}_walkA.png" -s 1024x1024 --seed 41 >/dev/null 2>&1 && echo ok A
flux-image "$K The character walking to the right in full right side profile, left leg stepping far forward, right arm swinging forward, mouth closed, wry smirk." -i "$ref" -o "pose_${n}_walkB.png" -s 1024x1024 --seed 42 >/dev/null 2>&1 && echo ok B
flux-image "$K The character standing facing the viewer in a relaxed pose, arms at sides, mouth wide open as if talking." -i "$ref" -o "pose_${n}_talk.png" -s 1024x1024 --seed 43 >/dev/null 2>&1 && echo ok T
