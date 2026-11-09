#!/usr/bin/env python3
"""Gère data/apps.json : list | remove <id> | add <id> ... | sync (versions via gh).
Exemples :
  tools/apps.py list
  tools/apps.py remove mSTICK
  tools/apps.py add mNEWAPP --space util --repo mNEWAPP --icon ~/chemin/icon.png --accent '#0a84ff' --fr 'Description' --en 'Description'
  tools/apps.py sync
"""
import argparse, json, os, shutil, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
F = os.path.join(ROOT, 'data', 'apps.json')
load = lambda: json.load(open(F, encoding='utf-8'))
def save(d): json.dump(d, open(F, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('ok')
def gh(path):
    r = subprocess.run(['gh', 'api', path], capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 else None
def main():
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('list'); sp.add_parser('sync')
    r = sp.add_parser('remove'); r.add_argument('id')
    a = sp.add_parser('add'); a.add_argument('id'); a.add_argument('--space', default='util'); a.add_argument('--repo')
    a.add_argument('--icon'); a.add_argument('--accent', default='#0a84ff'); a.add_argument('--kind', default='app')
    for l in ('fr', 'en', 'es', 'it'): a.add_argument('--' + l, default='')
    n = ap.parse_args(); d = load()
    if n.cmd == 'list':
        for x in d['apps']: print(f"{x['space']:6} {x['id']:14} {'dl' if x.get('download') else '--'} {x.get('version','')}")
    elif n.cmd == 'remove':
        d['apps'] = [x for x in d['apps'] if x['id'] != n.id]; save(d)
        p = os.path.join(ROOT, 'assets', 'icons', n.id + '.png'); os.path.exists(p) and os.remove(p)
    elif n.cmd == 'add':
        if n.icon: shutil.copy(os.path.expanduser(n.icon), os.path.join(ROOT, 'assets', 'icons', n.id + '.png'))
        tag = {l: getattr(n, l) or n.fr or n.en for l in ('fr', 'en', 'es', 'it')}
        d['apps'].append({'id': n.id, 'space': n.space, 'repo': n.repo or n.id, 'accent': n.accent, 'kind': n.kind,
                          'desk': False, 'demo': None, 'shots': 0, 'download': False, 'version': '', 'tag': tag})
        save(d); print('Lancez ensuite : tools/apps.py sync')
    elif n.cmd == 'sync':
        for x in d['apps']:
            info = gh(f"repos/starbudweiser/{x['repo']}"); rel = gh(f"repos/starbudweiser/{x['repo']}/releases/latest")
            pub = bool(info) and info.get('visibility') == 'public' and not info.get('private')
            x['download'] = bool(pub and rel); x['version'] = (rel or {}).get('tag_name', '').lstrip('v') if x['download'] else ''
            print(x['id'], x['download'], x['version'])
        save(d)
main()
