# xAPI reporting — methodica-ar-science-mass-gas-01

> **Arabic twin (2026-11-15).** This file came with the port of the Hebrew unit `methodica-science-mass-gas-01`
> (`4aaffe3`); ids and keys are retargeted to the Arabic identity (`methodica-ar-…`, `/720/ar/science/mass-gas/01/`).
> The dated history below is the Hebrew unit's. Arabic specifics: [README](../README.md#arabic-build).

Added 2026-11-01 following `2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`
and the MOE request of 2026-10-19 (`Documentation/MOE/דיוק ביישום תקן XAPI.docx`).

## Lineage

| file | from | changes |
|---|---|---|
| `unit-js/10-identity.js` | mass-liquid-02 (2026-10-25) | this unit's prefix / unit id |
| `unit-js/20-xapi.js` | mass-liquid-02 (2026-10-25) | none (header note, one example slug) |
| `unit-js/25-report.js`, `unit-css/25-report.css` | mass-liquid-02 | none (byte for byte) |
| `unit-js/40-resume.js` | mass-liquid-02 | `UI_CHARACTER_KEY`, `RESULT_KEYS` (none), `NAV_EDGE_KEY` |
| `unit-js/50-loader.js` | mass-liquid-02 | header note only |
| `unit-js/90-boot.js` | mass-liquid-02 | `hideCrossPartBack` is a no-op (the engine gates its own Back) |
| `unit-js/70-engine-bridge.js` | **new** (role of percent-05 `70-platform.js`) | seams, call sites, the four resume hooks |
| `_test/xapi-720-k.js` | mass-liquid-02 | `__reset` keys |

The other units call the layer from per-screen `script.js` code. Here one data engine
(`shared/engine.js` → each part's `js/engine.js`) drives all six parts, so the engine calls the
bridge (`lms(...)`, a no-op without the layer) and the bridge holds every call site once:

| engine event | bridge (`window.LOMDA_LMS`) | layer call |
|---|---|---|
| `goTo` tail | `onScreen(n)` | `xapiOnScreen(n)` item initialized/completed pairs, `scheduleResumeSave()`, D-8 end button |
| every graded attempt (`qCheck`) | `onAnswered(n, ok, isLast)` | `xapiAnswered(item, q, ok, isLast, {choices:[index], value})`, `flushResumeSave()` |
| hint opened (`openHint`, after its guards) | `onHint(n)` | `xapiRequestedHint(item, q)` (once per question, hints ledger) |
| learning path confirmed (01 בחרתי, a switch on the path toggle) | `pathChosen(p)` | `selected` / `learning-type`, object = component, `response` = the path item's `mediaFormat`, on every confirmed choice and every path switch (2026-11-12; was once per distinct path). `setLearningPath` → `onPath(p)` only saves |
| target outside the part (`advanceScreen`) | `onPartEnd(n)` | `xapiEndComponent(xapiPartResult(), button)`; returns `false` (stay) unless `DEV_NAV` |
| part code: DnD board complete | `answered('summary-dnd', true, true, {pairs})` | matching response |
| part code: YouTube `onStateChange` | `youtubeState(e, 'video')` | `xapiYouTubeState(e, '006')` played / paused |

Per part, `PART.xapi` at the end of `js/main.js` maps **every screen key** to its catalogue item
(null = none), names the engine-graded questions and the success threshold. The bridge derives
`SCREEN_TO_SUBCONTENT` (screen index → `[item, page]`), `XAPI_COMP_SLUG/ID`, `XAPI_EVAL_ITEMS`,
`XAPI_ITEM_RESULT`, `XAPI_METADATA_FILE`, `TOTAL_SCREENS`, `currentScreen`, `goTo`.

## Statements

- Component: `initialized` on every launch; `completed` on the part's last click — pass **and** fail —
  with `{success, score.scaled}` over all graded catalogue questions (unanswered = wrong). Nothing at
  unit level.
- Item: `initialized` when a screen of a new item is entered (again on every re-entry), `completed`
  once (ledger); an evaluated item is closed only after an `answered` (B-1). Item result = its graded
  questions only (01-002 has an ungraded open q2), single-item parts 05/06 = the part result.
- `answered` on every attempt, `answered.last` on the resolving one; `result.response` = the metadata
  string(s) in the xAPI format of the metadata `questionType` (20-xapi.js `xapiResponse`):
  choice → `answers[index]`; true-false → `true`/`false`; matching → `S[.]T[,]…`, placed pairs in
  `correctAnswers` order. The engine passes the option **index**, so a `<br>`, a tooltip or an info
  button in the label never reaches the statement; `docs-and-tools/check-labels.js` asserts the
  on-screen labels equal the metadata strings in the same order.
- Ungraded open questions (01-002/q2 hypothesis, 01-006/q1–q3 video stops; "other" without
  `correctAnswers`) send no `answered` — decision 2026-11-01, as in liquid-02 / body-matter-01.
- `requested` (hint): object = the question, `helpType: hint` (library).
- `played` / `paused`: YouTube video of 01-006, object = item 006, `time` extension.
- `selected` (learning-type): response = the path's on-screen name (`לצפות בסרטון` / `לנסות בעצמי`).

## Catalogue map

| part | screens → items | graded | success |
|---|---|---|---|
| 01 | char-select 001 · hook-balloon, hypothesis 002 · bbq 003 · twins, lets-start 004 · **path-select 005** · **video 006** · **obs-intro/obs1/obs1-sum 007 · obs2* 008 · obs3* 009** · flipcards 010 · summary-dnd 011 · dropdown 012 · warmup-intro — · tf 013 · def-scq 014 | 002/q1, 011/q1 (matching), 012/q1, 013/q1 (true-false), 014/q1 | ≥ 0.6 |
| 02 | intro — · q1–q5 → 001–005 | 5 × choice | ≥ 0.8 (the "4 of 5" on screen) |
| 03 | intro, basic-end, stdb-intro — · q1–q6 → 001–006 | 6 × choice | ≥ 0.6 |
| 04 | intro, enrichment-intro — · q1–q4 → 001–004 · enrichment 005 | 4 × choice | ≥ 0.6 |
| 05 | intro — · scenario, a–d → 001 (q1–q4) | 4 × choice | ≥ 0.75 (3 of 4) |
| 06 | as 05 | 4 × choice | ≥ 0.75 |

Split item (QA 2026-10-26): the catalogue already has the split shape — 005 is the method choice
(no questions), 006 the video path, 007–009 the three simulations, 010 the shared flip cards; both
paths are mapped (D-5). No resume migration was needed (no earlier state document existed).
The catalogue for Kata is this repo's `metadata/` (component files `updatedAt` 2026-10-29), not
`QA/2026-10-26/split-method-choice-final/methodica-ar-science-mass-gas-01-01.json` (2026-10-22): same
item ids, but the repo version declares 006/q1–q3 and has the later titles / informationToBot —
owner decision 2026-11-01.

## Routing

Cross-part navigation (part 01 → 02, 02 → 03 / 03 `stdb-intro` on ≥ 4/5, 03 → 04, 04 → 05, 05 → 06 or
the end, the entry screen's Back to the previous part) runs **only under `DEV_NAV`** (`?dev=1` and no
`?registration`; `index_dev.html` sets it). In a platform launch the last click sends `completed`,
disables the button and stays: Kata routes by the catalogue (`order`, `recommendedAfterFail`). The
part-02 "skip Basic" shortcut therefore exists only in the local walkthrough — decision 2026-11-01.

## Checks

`node _test/verify-report.js` (static, 500+ assertions) and the browser walk in `_test/README.md`.
