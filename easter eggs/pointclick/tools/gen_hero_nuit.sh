#!/bin/zsh
# Nuit du héros (15/11/2026) : poses clés FLUX, toutes à partir de sa vue de face choisie par Stéphan (work/hero_nuit/v_front.png = pv_front_9).
#  - portrait : parole, clignement, 5 gestes (montrer, hausser les épaules, supplier, réfléchir, saluer) avec une image intermédiaire
#    chacun, frappe à la vitre en 3 temps (élan, frappe, poing écrasé contre la vitre) ;
#  - approche vers l'écran : en pied, aux genoux, à la taille (2e référence : le héros en pied), puis le portrait ; le départ la rejoue à l'envers.
# Images entières, plusieurs graines, choix sur planche. FLUX 3 Klein local, gratuit, relançable (saute ce qui existe).
cd "$(dirname "$0")/../work/hero_nuit" || exit 1
B="Exactly the same character as in the reference picture: same face, same horned iron helmet, same blond hair, same fur collar, same riveted armor and leather straps, same round wooden shield strapped on his back centered behind him, same bare hands and leather bracers, same hand-painted 1990s point-and-click adventure art style, same colors, same bold outlines. Same close-up framing, same camera, same scale, seen from the front. Plain flat solid green background, no text."
p(){ out="$1"; seed="$2"; shift 2; [ -f "$out" ] || flux-image "$B $*" -i v_front.png -o "$out" -s 1280x1024 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
A="The same viking hero as in the two reference pictures (face and helmet from the first, whole body, kilt, boots and shield from the second), same hand-painted 1990s point-and-click adventure art style, same colors, same bold outlines, seen from the front, walking straight toward the viewer at night, curious frown, peering at the viewer as if he had just noticed a window. Plain flat solid green background, no shadow, no ground, no text."
a(){ out="$1"; seed="$2"; box="$3"; shift 3; [ -f "$out" ] || flux-image "$A $*" -i v_front.png -i ref_body_front.png -b "$box" -o "$out" -s 1280x1024 --seed $seed >/dev/null 2>&1 && echo "ok $out" || echo "ÉCHEC $out"; }
echo '[{"id":1,"desc":"the viking hero, full body from helmet to boots","bbox":[0.03,0.34,0.98,0.66]}]' > box_ap1.json
echo '[{"id":1,"desc":"the viking hero seen from the knees up","bbox":[0.0,0.2,1.0,0.8]}]' > box_ap2.json
echo '[{"id":1,"desc":"the viking hero seen from the waist up","bbox":[0.0,0.1,1.0,0.9]}]' > box_ap3.json
for s in 1 2 3; do
  a ap1_$s.png $((500+s)) box_ap1.json "Full body entirely visible from the horns to the boots, one boot stepping forward, arms swinging naturally."
  a ap2_$s.png $((510+s)) box_ap2.json "Seen from the knees up, bigger and closer, one foot forward, arms swinging naturally, leaning slightly forward."
  a ap3_$s.png $((520+s)) box_ap3.json "Seen from the waist up, very close to the viewer, leaning forward, squinting curiously at the viewer through the glass."
  p talk_$s.png $((530+s)) "Looking at the viewer, mouth wide open talking, eyebrows raised."
  p blink_$s.png $((540+s)) "Looking at the viewer with both eyes closed in a blink, same wry smirk."
  p point_$s.png $((550+s)) "Pointing his index finger straight at the viewer, his right arm stretched toward the viewer, the foreshortened hand big in the lower left of the picture, knowing smirk."
  p shrug_$s.png $((560+s)) "Shrugging: both open palms turned up at shoulder height on each side, eyebrows raised, awkward smile."
  p plead_$s.png $((570+s)) "Pleading: both hands pressed together under his chin, big puppy eyes, hopeful smile."
  p think_$s.png $((580+s)) "Thinking: one hand stroking his chin, eyes looking up to the side, pursed lips."
  p wave_$s.png $((590+s)) "Waving at the viewer: his open right hand raised high beside his head, palm toward the viewer, big friendly smile."
  p knockA_$s.png $((600+s)) "Pulling his right fist back beside his shoulder, ready to knock on the glass of the screen in front of him, determined frown."
  p knockB_$s.png $((610+s)) "Knocking on the glass of the screen in front of him: his right fist thrust toward the viewer, the fist big in the foreground in the lower left of the picture, mouth open calling out."
  p knockC_$s.png $((620+s)) "His right fist pressed flat against the glass of the screen right in front of the viewer, the knuckles squashed and flattened as if against a window pane, the fist big in the foreground, wincing grimace."
done
for s in 1 2; do
  p pointA_$s.png $((630+s)) "Raising his right hand toward the viewer at chest height, the index finger starting to point, halfway through the gesture."
  p shrugA_$s.png $((640+s)) "Starting to shrug: both hands rising at waist height on each side, palms beginning to turn up, eyebrows rising."
  p pleadA_$s.png $((650+s)) "Bringing both hands together in front of his chest, about to press them together, eyebrows rising."
  p thinkA_$s.png $((660+s)) "Raising one hand toward his chin, halfway through the gesture, eyes starting to look up."
  p waveA_$s.png $((670+s)) "Raising his open right hand at shoulder height, halfway through a wave, smile widening."
done
echo fini
