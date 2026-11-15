# Optimization report — methodica-science-mass-gas-01 (2026-11-01)

Done before the reporting/resume work, as in methodica-science-mass-liquid-02 and
methodica-science-body-matter-01 (guide §15). Rule from the owner's decision of 2026-10-22: **every
file keeps its format** — no WebP/MP4 conversion of GIF/PNG, no minification.

## Result

| folder | before (a527d48) | after | saved |
|---|---:|---:|---:|
| methodica-science-mass-gas-01-01 | 6,408,835 | 2,197,928 | 66 % |
| methodica-science-mass-gas-01-02 | 2,120,228 | 819,686 | 61 % |
| methodica-science-mass-gas-01-03 | 3,031,961 | 1,862,506 | 39 % |
| methodica-science-mass-gas-01-04 | 6,465,752 | 2,458,768 | 62 % |
| methodica-science-mass-gas-01-05 | 5,448,108 | 1,474,864 | 73 % |
| methodica-science-mass-gas-01-06 | 5,057,891 | 736,611 | 85 % |
| unit-assets/ (new, shared by all parts) | — | 1,115,832 | |
| **total shipped** | **28,532,775** | **10,666,195** | **63 %** |

## Steps

1. **Unreferenced files removed** (14 files, 2.9 MB): a file is unreferenced when its name occurs in
   none of its part's `js/`, `css/` or `index.html`. 01: `dnd-bowl-boat.jpg`, `dnd-gas-tank.png`,
   `phone-photo-placeholder.png`, `ron-2.jpg`; 02: `sarah-sister.jpg`; 05: `michal.jpg`,
   `michal-step-1/2/3.jpg`, `michal-vacuum-bag.png`, `michal-vacuum-main.png`; 06:
   `hamster-drinker.mp4`, `hamster-drinker-poster.jpg`, `hamster-drinker-ref.png`.
2. **Hoisted to `unit-assets/`** — byte-identical copies that every part (or two parts) carried:
   the fonts, the flag-button PNGs, the hint icon, the default character GIF/PNG, the stretch clips
   (01/02) and the running clips (05/06). Referenced as `../unit-assets/…` from `js/main.js` and as
   `../../unit-assets/…` from `css/engine.css`. `shared/fonts` and `shared/ui` are gone;
   `scripts/sync-shared.sh` no longer copies fonts/icons into the parts.
3. **Fonts**: only Assistant 400 / 600 / 700 are used (no rule asks for 200, 300, 500 or 800 — every
   such weight occurred only in its own `@font-face`); the four unused faces and their
   `@font-face` rules are removed. (The single `font-weight: 900` is the Frank Ruhl Libre headline
   in part 04, not Assistant.)
4. **Re-encoded in place** by `docs-and-tools/reencode-media.py` (port of liquid-02's script; GIF and
   WebP added) — 39 images (−5.2 MB) and 27 videos (−6.4 MB); one row per file in
   `MEDIA-CHANGES.md`. Target = 2 × the largest box each file is drawn in, measured in the real
   pages on 2026-11-01 (`media-display-boxes.json`, zoomable images also get the 620×600 zoom
   stage). GIFs keep every frame (the script checks the frame count and discards an output that
   changed it).
5. **Lazy media** (`shared/engine.js` `deferMedia` / `wakeMedia`): the engine builds every screen
   at boot, so all of a part's images and autoplay videos used to load at once. Images now carry
   `loading="lazy"`; decorative autoplay videos get their `src` when their screen is entered. Part
   06 at boot now loads the scenario poster and the entry clip only (was: the hamster clip three
   times).

## Checked

- Every part opened in the browser: no broken image (`naturalWidth === 0`), no font load error,
  the flag button and hint icon resolve from `unit-assets/`, the part-05 GIF and the part-04
  photographs (palette PNG) look as before; the part-06 clip starts on entering its screen.
- `scripts/sync-shared.sh` → "OK — no drift".
- `translation/tools/extract_translations.py` re-run: all 595 trans-unit ids unchanged (only the
  `source-location` line notes of `shared/engine.js` move).

## Not done (by decision)

- No format change (GIF → MP4, PNG → WebP/JPG, TTF → WOFF2), no minification.
- The two identical files `dnd-ron-1.jpg` / `ron-1.jpg` in part 01 stay: they are drawn at
  different sizes, and the DnD tile copy is now 25 KB.
