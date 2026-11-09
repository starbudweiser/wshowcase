# wSHOWCASE

**Try Starbudweiser's Mac apps live, inside a Mac in your browser, before downloading them.**
*Testez les applications Mac de Starbudweiser en direct, dans un Mac affiché dans votre navigateur, avant de les télécharger.*

## About

- **Authors:** Starbudweiser & Claude Code (Anthropic)
- **License:** MIT. © 2026 Starbudweiser.
- Provided as is, without warranty. The demos run entirely in your browser and send no data.
- The same information is in the site: Apple menu › *About wSHOWCASE*.

## How it works

A 16:9 Mac boots in the page (startup chime included), with two virtual desktops:

| Desktop | Link | Content |
|---|---|---|
| Skyrim Mac Toolkit | `#skyrim` | the 15 Skyrim apps (this is the link used by skyrimtools.com) |
| Utilities | `#util` | the 17 other apps |

Deep links also open an app directly: `#skyrim/mTRANSLATOR`, `#util/mSTICK`.

- Finder (Gallery, Icons and List views), Dock with magnification, Spotlight (`⌘K`), Control Center, System Settings (10 wallpapers, light and dark themes, interface sounds).
- Interactive replicas of **sKYCRASH**, **mTRANSLATOR**, **mCLEAN** (menu bar) and **mSTICK** (sticky notes). Every other app opens as a guided tour of its real screenshots.
- French and English; the language follows the browser.
- No build step: plain HTML, CSS and ES modules, served as is by GitHub Pages.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Maintain the app list (author side)

`data/apps.json` is the single source of truth. Icons live in `assets/icons/<id>.png` (256 px), screenshots in `assets/shots/{fr,en}/<id>_<n>.jpg`.

```bash
tools/apps.py list                      # list the apps
tools/apps.py add mNEWAPP --space util --icon path/icon.png --accent '#0a84ff' --fr 'Description' --en 'Description'
tools/apps.py remove mSTICK             # remove an app
tools/apps.py sync                      # refresh versions and download flags from GitHub Releases
```

An app is downloadable only if its GitHub repository is public and has a release; otherwise the site shows "Coming soon".
To make an app an interactive replica, add `demos/<id>.js` and set `"demo": "<id>"` in the data file.

`tools/gen_wallpapers.sh` regenerates the wallpapers locally with FLUX 3 Klein.

## Notes

- Interface sounds and the startup chime are synthesized in the browser (Web Audio); no audio file is shipped and the original Apple recording is not used.
- `maquettes/` and `docs/` keep the design proposals and the design trail (PDF).
