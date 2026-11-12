#!/bin/zsh
# Ambiances sonores de chaque décor (boucles de ~27 s) : MOSS-SoundEffect en local (`bruitage-locale`), gratuit ; bouclage sans raccord puis mp3 mono dans assets/pointclick/amb/.
cd "$(dirname "$0")/../../.." || exit 1
mkdir -p "easter eggs/pointclick/work/amb" assets/pointclick/amb
g(){ id="$1"; seed="$2"; shift 2; w="easter eggs/pointclick/work/amb/$id.wav"; o="assets/pointclick/amb/$id.mp3"
  [ -f "$o" ] && { echo "ok $id (existe)"; return; }
  bruitage-locale "$*" -o "$w" -d 30 --seed $seed >/dev/null 2>&1
  [ -f "$w" ] || { echo "ECHEC $id"; return; }
  ffmpeg -y -v error -i "$w" -filter_complex "[0]atrim=3:30,asetpts=PTS-STARTPTS[m];[0]atrim=0:3,asetpts=PTS-STARTPTS[h];[m][h]acrossfade=d=3:c1=tri:c2=tri" -ac 1 -ar 44100 -b:a 64k "$o"; echo "ok $id"; }
g village 31 "Peaceful countryside farm village in the middle ages, open air: birds singing, chickens clucking, a rooster far away, cows mooing in a distant meadow, wind in the trees, a stream trickling, no cars, no engines, no traffic, no modern sounds, rural and pastoral"
g mill 12 "Rushing mountain stream beside a wooden watermill: flowing and splashing water, a slow creaking wooden water wheel turning, gentle wind in pine trees, a few birds"
g camp 13 "Windswept grassy tundra: strong steady wind over the grass, a crackling campfire nearby, distant deep rumbling thuds of giant footsteps, a lone bird of prey crying in the sky"
g market 34 "Small rural medieval village market in the countryside, outdoors: a few calm voices murmuring far away, chickens and geese, a goat bleating, a donkey, birds, a wooden cart wheel creaking on dirt, a distant church bell, no cars, no engines, no traffic, no modern city sounds"
g gate 35 "Countryside near an old stone fort in a pine forest: wind in pine trees, birds singing, cloth banners flapping gently, a horse snorting, a distant crow, no cars, no engines, no modern sounds"
g house 16 "Cozy wooden house interior: crackling fireplace with popping logs, occasional wood creaks, soft wind outside against the walls, a very distant dog barking"
g swamp 17 "Misty swamp at dusk: croaking frogs, crows cawing in the distance, trickling water, cold wind through dead trees, an owl hooting, eerie and quiet"
g forest 18 "Enchanted autumn forest: gentle wind in dry leaves, many small birds singing, crickets, water droplets falling into a pond, soft magical twinkling chimes shimmering in the air"
g hall 19 "Large stone longhouse hall interior: low echoing room tone, torches crackling, distant footsteps with reverb, deep wind in the rafters, wood creaking"
g party 40 "Rustic village feast outdoors in the countryside at night: villagers laughing and cheering in the distance, crackling bonfire, clinking wooden mugs, crickets, occasional firework pops, no cars, no engines, no modern sounds"
g night 21 "Quiet night in the countryside: loud chirping crickets, soft breeze, an occasional owl hoot, a distant dog bark"
echo done
