# methodica-ar-science-mass-gas-01 — علوم · حجم الغاز (Arabic)

The Arabic twin of the Hebrew 720 unit **`methodica-science-mass-gas-01`** (science, target 9, "volume of a gas").

- **Functionality** is the Hebrew unit's, as of its commit `4aaffe3` (2026-11-14).
- **Every text the learner sees** is Arabic.
- **Layout:** six self-contained parts, one per PPTX רכיב, on a 1280×710 canvas in a fixed, centred letterbox.

The exits below are the content routing. In a platform (Kata) launch, every part ends with its own xAPI
`completed` and stays on its last screen, and Kata decides what comes next. The cross-part hops run only in the
local walkthrough (`index_dev.html`, `?dev=1`).

| Part | Content | Exit |
|---|---|---|
| `-01` | Character select, hook, 2 learning paths (video / hands-on experiments), summary DnD, dropdown, warm-up | → 02 |
| `-02` | Standard practice 1 (5 Q, pass ≥ 4) | pass → 03 `#screen=stdb-intro` · fail → 03 |
| `-03` | Basic practice (4 Q, below 3 of 4 the part ends at Q4) + Standard B (2 Q) | → 04 |
| `-04` | Advanced practice (4 Q) + enrichment article (1654 newspaper) | → 05 |
| `-05` | Peak question (4 sections, 2 attempts + feedback per section) | ≥ 3 → END · < 3 → 06 |
| `-06` | Second-chance peak question (same rules) | ≥ 3 → END · < 3 → unit ends on the last section's feedback |

## Arabic build

### Origin
- **Forked from Hebrew `02c7518`** (2026-10-31) and translated.
- **Arabic-only commits since then:**
  - Arabic review fixes.
  - The Arabic instructional video `l3KqVtKepxA`, with question stops at 0:43, 1:26 and 1:59.
- **Ported to Hebrew `4aaffe3` on 2026-11-15** with a 3-way merge from the fork point. That brought:
  - reporting, the issue report and resume (including the 03.11 hardening and the save on leave, `xapi-720-l.js`);
  - Back never closes an item (B-2), and `selected` on every path switch (T);
  - the part 03 threshold gate;
  - lazy media and `unit-assets/`;
  - the part 04 / 05 CSS relocations.

### Identity
As `methodica-ar-science-mass-liquid-02`; Hebrew and Arabic never share an id or a stored state.
- **Folders:** `methodica-ar-science-mass-gas-01-0N`.
- **Ids:** `XAPI_ID_PREFIX` = `https://lomdot.education.gov.il/metodica/720/ar/science/mass-gas/01/`.
- **Unit id and storage:** unit id and engine `LOMDA_ID` = `methodica-ar-science-mass-gas-01`.
- **Storage keys:**
  - `methodica-ar-science-mass-gas-01:navStack`
  - `…:selectedCharacter`
  - `methodica_ar_science_mass_gas_01_selectedCharacter`
  - `lomda_nav_edges::methodica-ar-science-mass-gas-01`
- **The shared xAPI library** stays at `…/720active/common/`.

### Learner text
- **Arabic everywhere:** the engine UI, every part, the issue-report dialogs, and the YouTube player (`hl=ar`).
- **Iframe title:** the Arabic `title` is re-applied on ready and on every state change.
- **Hebrew is kept on purpose only in:**
  - `REPORT_TYPE_LABELS` in `unit-js/25-report.js`. It is the value posted to the issue form all 720 units share; the learner sees `REPORT_TYPE_DISPLAY`.
  - Console messages, comments, and the developer-only `index_dev.html` bar.

### Fonts
Calibri, with Arial as fallback. No font files are shipped.

### Arabic layout tweaks
- `.scq-answers` max-content.
- `.tf-answers` options.
- A wide `.scq-hint`.
- 01 `.wg-w1-label--word` nowrap.
- 03 q2/q4 answer widths.

### Arabic media
- 03 `hani.jpg`: the bag is labelled in Arabic.
- 03 `character-{1,2}-holding.mp4`.
- 04 `two-vessels-tap.png`, in place of the Hebrew `.svg`.

### Responses
- **`_xapiNorm`** strips the invisible bidi marks (`_XAPI_BIDI`, guide §6.3c rule 5).
- **The Arabic screens carry LRMs** for display. Responses are the metadata strings, so these marks never reach a response.

### Metadata
- **What it is:** an Arabic catalogue, `metadata/methodica-ar-*`, whose ids are all under `/720/ar/`.
- **Structure:** question ids, types, answer order and flags equal the Hebrew unit's current `metadata/`, including the 12.11 Kata sync.
- **`informationToBot` stays Hebrew**, as in liquid-02.
- **Matching item 01-011:** its sources equal the Arabic DnD tile `alt`s.

### Kata
- **Where the components go:** inside the Hebrew unit (parent-unit mode). **There is no Arabic unit in Kata.**
- **Status:** created as **draft**.
- **No `-Publish` without MOE's written approval.** See `docs-and-tools/SEND-METADATA.md`.

## Layout
```
shared/                 ← SOURCE OF TRUTH for the engine (edit here only)
  engine.js engine.css  data-driven screen engine (templates, question/peak controllers, navigation)
  index_dev.template.html
unit-assets/            flag + hint icons, character media shared by several parts (one copy)
unit-js/ unit-css/      720 platform layer — xAPI reporting, issue report, resume (shared by all parts)
metadata/               the Arabic catalogue (unit + 6 components) — source of every reported id
_test/                  verify-report.js (static + Arabic build checks) · score-contract.js · back-and-path.js ·
                        write-guard.js (jsdom) · xapi-720-k.js / xapi-720-l.js (offline library stubs) · README
docs-and-tools/         REPORT-XAPI · RESUME · SEND-METADATA · RETRIEVE-METADATA · check-labels.js ·
                        reencode-media.py (+ media-display-boxes.json) · send/retrieve-metadata.ps1 ·
                        build-package.ps1 · package-allowlist.ps1 · verify-package.ps1
scripts/
  sync-shared.sh        copies shared/engine.* + the system-animation motion engine into every part (+ drift check)
  serve.py              local static server (python3 scripts/serve.py → http://127.0.0.1:8765)
methodica-ar-science-mass-gas-01-NN/
  index.html            production entry
  index_dev.html        DEV bar (screen jumping via postMessage)
  js/main.js            window.PART — this part's screens/content/routing (all learner text lives here)
                        + PART.xapi at the end: screen key → catalogue item, graded questions, pass threshold
  js/engine.js js/motion.js   synced copies — do not edit
  css/style.css         part-specific styles · css/engine.css css/motion.css synced copies
  assets/img/{content,character}  assets/video   (shared media: ../unit-assets/)
  (part 01 also has js/widgets.js — the three experiment simulations, flip cards, DnD, path toggle)
translation/            the Hebrew → Arabic translation export the Arabic texts were made from (not shipped)
```
After editing anything in `shared/`, run `./scripts/sync-shared.sh`.

## Checks
```
node _test/verify-report.js
NODE_PATH=/tmp/lomda-test/node_modules node _test/score-contract.js
NODE_PATH=/tmp/lomda-test/node_modules node _test/back-and-path.js
NODE_PATH=/tmp/lomda-test/node_modules node _test/write-guard.js
```
- **Browser walk:** use the offline stub, as described in `_test/README.md`.
- **Engine, reporting and resume behaviour** is the Hebrew unit's. See its README and `docs-and-tools/REPORT-XAPI.md`, `RESUME.md`.
- **Keeping this unit in step with the Hebrew one:** port each Hebrew fix here as "same change as the Hebrew twin", as liquid-02 does.
