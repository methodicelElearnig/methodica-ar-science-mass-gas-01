# methodica-science-mass-gas-01 — מדעים · יעד 9 · נפח של גז

720 Science unit built from `מדעים_יעד 9_020826_להפקה.pptx` (v6.7, "תיקוף פנימי").
Six self-contained parts, one per PPTX רכיב. Canvas 1280×710, fixed-centred letterbox.

| Part | PPTX slides | Content | Exit |
|---|---|---|---|
| `-01` | 2–26 | Character select, hook, 2 learning paths (video / hands-on experiments), summary DnD, dropdown, warm-up | → 02 |
| `-02` | 27–33 | Standard practice 1 (5 Q, pass ≥ 4) | pass → 03 `#screen=stdb-intro` · fail → 03 |
| `-03` | 34–43 | Basic practice (4 Q) + Standard B (2 Q) | → 04 |
| `-04` | 44–50 | Advanced practice (4 Q) + enrichment article (1654 newspaper) | → 05 |
| `-05` | 51–57, 69 | Peak question (4 sections, 2 attempts + feedback per section; slides 58/59 dropped) | ≥ 3 → END · < 3 → 06 |
| `-06` | 60–66, 69 | Second-chance peak question (same rules; slides 67/68 dropped) | ≥ 3 → END · < 3 → unit ends on section ד's feedback |

## Layout
```
shared/                 ← SOURCE OF TRUTH for the engine (edit here only)
  engine.js engine.css  data-driven screen engine (templates, question/peak controllers, navigation)
  fonts/ ui/            Calibri/Arial note (no font files), flag + hint icons
  index_dev.template.html
scripts/
  sync-shared.sh        copies shared/ + the system-animation motion engine into every part (+ drift check)
  serve.py              local static server (python3 scripts/serve.py → http://127.0.0.1:8765)
methodica-science-mass-gas-01-NN/
  index.html            production entry
  index_dev.html        DEV bar (screen jumping via postMessage)
  js/main.js            window.PART — this part's screens/content/routing (all PPTX text lives here)
  js/engine.js js/motion.js   synced copies — do not edit
  css/style.css         part-specific styles · css/engine.css css/motion.css synced copies
  assets/img/{content,character}  assets/fonts  assets/video
  (part 01 also has js/widgets.js — the three experiment simulations, flip cards, DnD, path toggle)
```
After editing anything in `shared/`, run `./scripts/sync-shared.sh`.

## Engine notes
- Screens are rendered from `PART.screens` (types: `transition`, `scq`, `peak-feedback`, `content` + hooks).
- Cross-part Back: session route stack (`sessionStorage`, key `methodica-science-mass-gas-01:navStack`), lands on the exact screen left (`#screen=<key>`). Forward re-cross of a branch replays the recorded destination.
- Character: `localStorage` `methodica-science-mass-gas-01:selectedCharacter` = `character-1` (green) | `character-2` (purple). Part 01's selection screen never pre-selects from storage.
- Completion: "סיימתי" calls `completeUnit()` only (local flag `…:unitCompleted`). No LMS/xAPI yet — add reporting inside `completeUnit()` later.
- Deep link for testing: `index.html#screen=<key>` (keys are in each `main.js`).

## Decisions applied (planning §13)
Answer keys follow the PPTX feedback text (the outlined option on slides 29/37/38/49 is the "selected" mock state) · slide 32 = Q4/5 · slide 43 = Std-B Q2/2, correct = מיקה · slide 26 = 2 attempts · slides 23/25 = 1 attempt · warm-up/summary unscored · Basic has no gate · peak sections use the original peak template (2 attempts, hint only after the first wrong attempt, immediate per-section feedback from the slide 58/59 · 67/68 explanations; accumulated feedback screens and the slide 52 "תדעו אם צדקתם רק אחרי..." bubble dropped — producer decision 2026-10-04) · path toggle fixed (לנסות בעצמי right) · observation tabs sequential · experiments by direct manipulation.

## Placeholders — must be replaced before delivery
- **Character media**: the part 01 selection cards use the real hover loops (`-01/assets/img/character/character-{1,2}-select.mp4`, from `green_boat.mp4` / `purple_balloon.mp4`, cropped to 400×600, audio removed); the slide 4 hook pose `balloons-two-hands` uses `character-{1,2}-balloons-two-hands.mp4` (from `*_2balloon.mp4`). Every other pose uses the two PPTX placeholders (`assets/img/character/character-{1,2}-default.*`). Real poses (≈19 per character, see planning §7) go into `PART.media.characters[pose][character-N]` in each `main.js` (image or muted MP4 — the engine handles both).
- **Instructional video** (part 01 `video` screen, script = PPTX slides 12–14): set `VIDEO_SRC` in `-01/js/main.js`; this enables native controls + Continue gating on `ended`.
- **Hamster video** (part 06 `scenario`): currently the PPTX reference image with a "סרטון בהפקה" tag.
- **Flip-card fronts** (part 01 `flipcards`): GIFs from the instructional video — placeholder tiles.
- **Twins photos** (slide 8, `<אבא ונטע>` / `<אמא וסער>`): phone-frame placeholders.
- **Experiment artwork** (slides 16–19): inline SVG placeholder apparatus in `-01/js/widgets.js`; state machines stay when art is swapped.
- All content photos are the PPTX-embedded images (resized). `יהלי` must be regenerated (narrower tape); `פקק גומי` needs a better image; part 05 intro image name is missing in the PPTX; Envato images need licensed downloads.
- Custom-screen visuals (scenarios with timed bubbles, observation hub, widgets, newspaper, peak feedback) are local layouts — no Figma template was reachable; replace once designs exist. Newspaper font = Frank Ruhl Libre (placeholder choice).

## Not done yet
- `system-animation` per-screen pass, `responsiveness` analysis and `lomda-qa-publish` audit.
- Content-expert confirmation of answer keys; Figma section links to finish the visual inventory.
