#!/bin/zsh
# Images des scènes 4 à 10 (FLUX 3 Klein local, gratuit). Relançable : saute ce qui existe. Ordre : scène par scène.
cd "$(dirname "$0")/../work" || exit 1
SP="full body game sprite, hand-painted 1990s PC point-and-click adventure game art, sarcastic cartoon style with realistic adult proportions, detailed painterly shading, bold dark outlines, saturated warm colors, plain flat solid magenta background, no shadow, no text"
IT="single game item icon, hand-painted 1990s PC point-and-click adventure game art, bold dark outlines, saturated colors, plain flat solid magenta background, no shadow, no text"
SC="hand-painted cartoon 1990s PC adventure game background, VGA 256-color look with dithering, bold dark outlines, warm saturated colors, humorous storybook fantasy, no text, no people, no animals"
LIT="The same man, same clothes, same art style and colors, same magenta background, but with nothing covering his face at all: his whole face is visible with wide open amazed delighted eyes and a huge joyful open-mouth smile, both arms raised up in celebration, dancing."
g(){ out="$1"; shift; [ -f "$out" ] || flux-image "$@" -o "$out" >/dev/null 2>&1; echo "ok $out"; }
# 4 marché aux choux
g market.png "A bustling Nordic market square at golden hour in the style of Skyrim's Whiterun: wooden stalls with colorful awnings, thatched half-timbered houses, cobbled square, a big wooden crate heaped with green cabbages on the left, a narrow dirt road leaving to the right between two houses, snowy mountains far behind, lanterns. $SC" -s 1280x720 --seed 401
g ch_farmer.png "A stout cheerful Nordic farm woman in a green wool dress with a white apron, hair in a braid, holding a pitchfork, proud grin, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 411
g ch_cart.png "A small rickety wooden hand cart with two wheels and wooden handles, empty, seen from the side, comical. $SP" -s 1024x1024 --seed 412
g item_cabbage.png "A fat green cabbage. $IT" -s 512x512 --seed 413
g blind_cabbage.png "A thin Nordic farm boy in patched brown clothes, a huge green cabbage pulled down over his whole head covering his eyes, both arms stretched out in front groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 414
g lit_cabbage.png "$LIT" -i blind_cabbage.png -s 1024x1024 --seed 415
# 5 porte de la ville
g gate.png "A stone city gate of a Nordic walled town in the style of Skyrim's Whiterun: massive wooden double doors under a stone arch, two squat watchtowers with banners, a guard post with a barrel and a bench, dirt road leading up to the gate, pine trees, mountains, late afternoon sun. $SC" -s 1280x720 --seed 501
g item_arrow.png "A single wooden arrow with grey feathers, lying diagonally. $IT" -s 512x512 --seed 511
g blind_helmet.png "A Nordic city watchman in a leather jerkin, a huge oversized iron helmet pulled all the way down over his eyes and nose, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 512
g lit_helmet.png "$LIT" -i blind_helmet.png -s 1024x1024 --seed 513
# 6 maison
g house.png "Interior of a cozy Nordic wooden longhouse room in the style of Skyrim: a stone hearth with a crackling fire on the left, a table with bread and a candle, a fur bed in the back, a wooden door on the right, a small window, weapon rack and shelves with pots, empty floor space in the middle, warm firelight. $SC" -s 1280x720 --seed 601
g ch_mannequin.png "A full suit of dented Nordic iron armor with a horned helmet standing on a wooden armor stand like a mannequin, arms slightly out, menacing but silly, standing in full front view. $SP" -s 1024x1024 --seed 611
g blind_basket.png "A chubby Nordic man in a linen shirt and trousers, a big woven wicker laundry basket turned upside down and pulled down over his whole head covering his eyes, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 612
g lit_basket.png "$LIT" -i blind_basket.png -s 1024x1024 --seed 613
# 7 gué du cavalier
g ford.png "A misty twilight river ford in a gloomy Nordic fantasy swamp: a crumbling old stone bridge over dark water, twisted dead trees, a pumpkin patch with orange pumpkins on the left, crows, a purple and orange sunset sky, fog, a muddy path crossing to the right. $SC" -s 1280x720 --seed 701
g ch_horseman.png "A spooky headless horseman on a black horse, dark rusty armor and a tattered cloak, a hollow empty neck opening where the head should be and no head at all, holding the reins, sad slumped posture, comical not scary, side three-quarter view. $SP" -s 1024x1024 --seed 711
g var_horseman_pumpkin.png "The same headless horseman on the same black horse, same style and background, but now he has a carved glowing jack-o-lantern pumpkin sitting on his shoulders as a head, grinning happily, proud posture." -i ch_horseman.png -s 1024x1024 --seed 712
g item_pumpkin.png "A big orange pumpkin with a short green stem. $IT" -s 512x512 --seed 713
g blind_boot.png "A scruffy wandering Nordic bard in a colorful jester-like tunic with a lute on his back, a huge muddy leather boot pulled down over his whole head covering his eyes, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 714
g lit_boot.png "$LIT" -i blind_boot.png -s 1024x1024 --seed 715
# 8 forêt aux papillons
g wood.png "An enchanted autumn forest clearing in a Nordic fantasy world: giant glowing mushrooms, golden and red leaves, a mossy ruined stone wall too high to climb across the path on the right, a pond with lily pads, shafts of light, floating sparkles. $SC" -s 1280x720 --seed 801
g ch_butterfly.png "A giant glowing blue and purple butterfly with wide open wings, big cute eyes, sparkles, front view. $SP" -s 1024x1024 --seed 811
g var_butterfly2.png "The same giant glowing butterfly, same style and background, but with its wings folded up closed above its body." -i ch_butterfly.png -s 1024x1024 --seed 812
g blind_mushroom.png "A bearded old Nordic hermit alchemist in a green robe with a big pouch, a giant red spotted mushroom cap pulled down over his whole head covering his eyes, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 813
g lit_mushroom.png "$LIT" -i blind_mushroom.png -s 1024x1024 --seed 814
# 9 couloir de la longue maison
g hall.png "A long Nordic jarl's longhouse hall interior in the style of Skyrim: a narrow stone-and-timber corridor with torches, red banners, fur rugs, a heavy wooden door at the far right end with a narrow doorway, a carved wooden throne at the left, firelight. $SC" -s 1280x720 --seed 901
g ch_follower.png "A stern loyal female Nordic warrior in steel armor carrying an absurdly huge overloaded backpack stacked with sacks, pots, swords, a wheel of cheese and a chicken, bent under the weight but still standing dutifully, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 911
g item_anvil.png "A heavy black iron blacksmith anvil. $IT" -s 512x512 --seed 912
g blind_banner.png "A thin Nordic palace maid in a plain dress, a long red embroidered banner tapestry draped over her whole head covering her eyes, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 913
g lit_banner.png "$LIT" -i blind_banner.png -s 1024x1024 --seed 914
# 10 fête des quinze ans
g party.png "A joyful open-air birthday celebration at dusk before a Nordic walled city on a hill in the style of Skyrim: long wooden banquet tables with food, strings of lanterns, colorful banners, confetti, fireworks in a purple and gold sky, a round empty wooden table in the foreground center, grass field, snowy mountains. $SC" -s 1280x720 --seed 1001
g ch_cake.png "A huge multi-tier birthday cake decorated with a dragon made of icing, fifteen unlit white candles on top, comical, front view. $SP" -s 1024x1024 --seed 1011
g var_cake_lit.png "The same birthday cake, same style and background, but all fifteen candles are lit with small bright flames." -i ch_cake.png -s 1024x1024 --seed 1012
g blind_partyhat.png "A cheerful Nordic drummer with a big hand drum, a giant striped conical party hat pulled down over his whole face covering his eyes, both arms stretched out groping blindly, comical, standing in full front three-quarter view. $SP" -s 1024x1024 --seed 1013
g lit_partyhat.png "$LIT" -i blind_partyhat.png -s 1024x1024 --seed 1014
echo done
