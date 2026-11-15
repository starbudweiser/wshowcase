#!/bin/zsh
# Calcule les poses clés du coucher de nuit listées par tools/sleep_keys.py (work/sleep/jobs.tsv). FLUX 3 Klein local, gratuit.
# Relançable : saute les images déjà faites. Un calcul à la fois. Argument facultatif : autre liste (work/sleep/jobs_x.tsv).
D="$(cd "$(dirname "$0")" && pwd)"; J="$D/../work/sleep/${1:-jobs.tsv}"
[ -f "$J" ] || python3 -I "$D/sleep_keys.py"
while IFS=$'\t' read -r out seed guide box prompt; do
  [ -f "$out" ] && continue
  flux-image "$prompt" -i "$guide" -b "$box" -o "$out" -s 1536x1024 --seed "$seed" >/dev/null 2>&1 && echo "ok ${out:t}" || echo "ÉCHEC ${out:t}"
done < "$J"
echo fini
