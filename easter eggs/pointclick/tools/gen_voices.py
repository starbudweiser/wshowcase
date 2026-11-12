#!/usr/bin/env python3 -I
"""Voix locales (Qwen3-TTS via `voix-locale`, gratuit) : une réplique = un mp3 mono dans assets/pointclick/voice/<fr|en>/<clé>[.v<n>].mp3.
Usage : gen_voices.py fr|en [limite]   (relançable : saute les fichiers existants ; lit work/voices.json produit par voices_manifest.mjs)"""
import sys, os, json, subprocess, tempfile
R = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
lang = sys.argv[1]; limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10**9; only = sys.argv[3] if len(sys.argv) > 3 else None
L = {'fr': 'french', 'en': 'english'}[lang]
V = {  # personnage : (voix prête, consigne de jeu)
 'hero': ('ryan', 'dry sarcastic young adventurer, deadpan humor, natural pace'),
 'narr': ('aiden', 'deep epic storyteller, slow and solemn'),
 'merchant': ('aiden', 'grumpy suspicious old shopkeeper, gravelly voice, slightly irritated'), 'pmerchant': None,
 'guard': ('aiden', 'gruff tired city guard, flat monotone, a bit sad'), 'gguard': None, 'pguard': None,
 'horse': ('aiden', 'deep slow comedic horse voice, snorting, deadpan'),
 'giant': ('ryan', 'extremely deep booming slow giant voice, shouting angrily, very low pitch'), 'pgiant': None,
 'nazim': ('aiden', 'snobbish arrogant nobleman, nasal, haughty, drawn-out syllables'),
 'farmer': ('serena', 'cheerful hearty farm woman, loud and friendly'),
 'follower': ('vivian', 'stern dutiful warrior woman, deadpan monotone'),
 'horseman': ('aiden', 'hollow ghostly melancholy voice, slow, echoing'), 'phorseman': None,
 'sleepy': ('aiden', 'groggy half-asleep confused man, yawning, mumbling'),
 'hen': ('vivian', 'comedic clucking chicken-like voice'),
}
V['pmerchant'] = V['merchant']; V['gguard'] = V['pguard'] = V['guard']; V['pgiant'] = V['giant']; V['phorseman'] = V['horseman']
def blind_style(k):
    if k == 'blind.dark': return 'plaintive whining lost man complaining, groping in the dark'
    if k.startswith('blind.wow'): return 'amazed overjoyed shouting, tears of joy'
    if k.startswith('blind.sing'): return 'joyful ecstatic singing, excited, dancing'
    return 'confused grumbling man'
items = [o for o in json.load(open(os.path.join(R, 'easter eggs', 'pointclick', 'work', 'voices.json'))) if o['lang'] == lang and (not only or o['who'] == only)]
PV = os.path.expanduser('~/.claude/skills/voix-locale/voix/' + ('doubleur_fr' if lang == 'fr' else 'picard_voice'))
out = os.path.join(R, 'assets', 'pointclick', 'voice', lang); os.makedirs(out, exist_ok=True)
n = 0
for o in items:
    if n >= limit: break
    name = o['key'] + ('' if o['idx'] < 0 else f".v{o['idx']}") + '.mp3'; dst = os.path.join(out, name)
    if os.path.exists(dst): continue
    v = ('aiden', blind_style(o['key'])) if o['who'] == 'blind' else V.get(o['who'], V['hero'])
    tmp = tempfile.mktemp(suffix='.wav')
    cmd = ['voix-locale', o['text'], '-o', tmp, '-l', L]
    cmd += ['-r', PV + '.wav', '-t', open(PV + '.txt').read().strip(), '--speed', '0.92'] if o['who'] == 'narr' else ['-v', v[0], '-s', v[1]]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if os.path.exists(tmp):
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-ac', '1', '-ar', '24000', '-b:a', '40k', dst]); os.remove(tmp)
    n += 1; print('ok', name, flush=True)
print('done', lang, flush=True)
