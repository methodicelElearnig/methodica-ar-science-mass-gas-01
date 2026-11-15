# Live verification — `selected` / learning-type on the part-01 choice, 2026-11-02

Package `../../deployments/2026-11-02` (commit `9497e1b`). Why: step 10 of the `selected` / learning-type
plan — this unit reported from the engine's `onPath` (a card click, a toggle click and every entry into a
path screen), with the path's on-screen label as `response`; it now reports only the confirmed choice
(בחרתי) and the path toggle click, once per path, with the chosen path item's `mediaFormat` (guide
`Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md` §6.3a).

## CDN upload

All 10 files are **byte-identical** to the package (cache-busted downloads compared with `cmp`):

| File | Bytes |
|---|---|
| `unit-js/20-xapi.js` | 46,216 |
| `unit-js/70-engine-bridge.js` | 12,897 |
| `-01/js/main.js` | 39,033 |
| `-01/js/widgets.js` | 67,790 |
| `-01/index.html` | 8,197 |
| `-02 … -06/index.html` | 8,148 each |

The live metadata `metadata/methodica-science-mass-gas-01-01.json` (30,987 bytes) is unchanged and
identical to the package: 006 `video`, 007 `interactive-content` — the values the statement's `response`
copies. The files that differ from the package in line endings only were not re-uploaded; their live
content equals the package's (CR-stripped compare of `10-identity.js`, `25-report.js`, `25-report.css`,
`-02/js/main.js`).

## Live part 01 (CDN page, `sendStatement720` captured in the page — nothing sent to Kata)

`https://lomdot.education.gov.il/metodica/720/science/mass-gas/01/methodica-science-mass-gas-01-01/index.html`

- Loads `20-xapi.js`, `js/widgets.js`, `js/main.js` and `70-engine-bridge.js` at `?v=20261102`;
  `XAPI_LEARNING_PATHS` = `video` → 006 `video`, `hands-on` → 007 `interactive-content`.
- path-select: two card clicks → **no** `selected` (before: one per distinct card).
- בחרתי on video → the `video` screen and **one** statement: verb `selected`, objectType `onlinelesson`
  (the library uses the component id), `{ category: 'learning-type' }`, `result.response` = **`video`**.
- Back to path-select, בחרתי again → nothing (picks ledger).
- Hands-on toggle → `obs-intro` and **one** `selected`, `response` = **`interactive-content`**.
- Video toggle → `video` and nothing (already reported). Entering the path screens (which re-asserts the
  path through `onPath`) reported nothing.

The reload case (picks restored from the state document; nothing re-sent) was walked locally with the stub
library before upload — see `../../deployments/2026-11-02/DEPLOY.md`.

## Not checked here

- The statement as stored in Kata — a platform launch (`?slxapi=`) is needed; the platform team checks it
  after our notice (`Documentation/MOE/NOTE-TO-PLATFORM-selected-learning-type-2026-11-02.md`).
- How the platform / bot reads `response` = `mediaFormat` (agreed deviation from v2.7's `contentType`).
