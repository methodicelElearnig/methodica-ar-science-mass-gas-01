# Live Kata verification — methodica-science-mass-gas-01, 2026-11-01

Guide §12 probes against the deployed unit and the real catalogue, run from the Claude desktop
browser pane (Chromium) on the launch URLs minted by `Tools/full-kata-link/New-KataLaunchLinks.ps1
-UnitKey methodica-science-mass-gas-01` (6 components, one registration each, test learner
`VADIM-1234`, platform `https://no-platform.com`). The links carry the reporting token: they live in
the tool's CSV only and were opened through a temporary local launcher page that was deleted
afterwards. **Rotate the token** (the registrations were minted for this run).

Package: `deployments/2026-11-01` from commit `7bf5ecc` (merged to `main` as `11291f4`), uploaded by
the unit owner to `https://lomdot.education.gov.il/metodica/720/science/mass-gas/01/`. Upload verified
**by byte size**: 129 / 129 files match the package. Catalogue: created the same day
(`send-metadata-2026-11-01-create.log`), read back clean. Shared library: `xapi-720-k.js`, 52,370 bytes.

Statements were observed with a counting **pass-through** wrapper on `sendStatement720` (and
`xapiAnswered`), never a replacement. Booleans and status codes only; anything not listed was not observed.

## Component 02 (practice, 5 × choice)

| Probe | Observed |
|---|---|
| R1 preflight | content origin, `?slxapi` + `?registration` (36 chars); scripts `xapiwrapper.min.js`, **`xapi-720-k.js`**, then 10 → 90 in contract order; `XAPI_DISABLED false`, `XAPI_USING_G true`, `DEV_NAV false`, `METADATA.id === XAPI_COMP_ID`, `_resumeReady true`, boot cover gone; `_unitState` = `{v: 5, component: '…-02', payload: null}` — **PASS** |
| R2 first read | `{op: 'load', status: 404, ok: true, reason: 'absent'}` — **PASS** |
| R3 write / read back | `goTo(1)` → `{save, 204}`; `loadState720('execution-state::methodica-science-mass-gas-01-02')` → `{load, 200}`, v5, keys `v, component, payload, done, doneItems, hints, picks, ui, results`, payload `{currentScreen: 1, key: 'q1', snap, xr}` — **PASS** |
| R4 answer + reload | wrong first attempt on q1 → `answered` (success false, response = the metadata text of option a) and a synchronous `{save, 204}`; reload → first read `{load, 200}`, lands on q1, `qState('q1')` = `{selected 'a', attempts 1, lastWrong 'a', done false}`, the wrong option painted, `XAPI_DISABLED` still false — **PASS** |
| Hint | `requested.1` on 001/q1; document `hints['001/q1'] = true` — **PASS** |
| R5 ledger | correct second attempt → `answered.last` (success true) → `completed` 001 (success true) on leaving; document `doneItems['…-02#001'] = true`, `xr['001/q1'] = true`. **After a reload**, q1 ↔ q2 crossed 6 times: 6 × `initialized`, **0 × `completed`** — **PASS** |
| R6 production finish | q5 answered correctly → `answered.last`, `completed` 005; last click → **one** component `completed` `{success: false, scaled: 0.4}` (2 of 5, threshold 0.8); second click sends 0; button `disabled`, `aria-disabled="true"`; `location.pathname` unchanged — **PASS** |
| D-8 after reload | lands on q5, `xapiComponentEnded() === true`, button disabled, a click sends 0 statements — **PASS** |
| R7 `?resetState` | parameter stripped from the URL, `done = {}`, `doneItems = {}`, `xapiComponentEnded() === false`, lands on screen 0, fresh `{save, 204}` — **PASS** |
| Network | every `POST …/xapi/statements` answered 200; state reads 404 (first) / 200, writes 204 |

## Component 01 (instruction, split item 005/006)

| Probe | Observed |
|---|---|
| R1 / R2 | `METADATA.id === XAPI_COMP_ID`, `XAPI_DISABLED false`, `XAPI_USING_G true`, `DEV_NAV false`; first read `{load, 404, absent}`; 2 statement POSTs on load (component + landing item 001) — **PASS** |
| YouTube D-1 (§12 addition 1) | iframe on `www.youtube-nocookie.com`, `referrerPolicy strict-origin-when-cross-origin`, **no `slxapi` / `Bearer` / `forigin` / `registration` in its `src`** — **PASS** |
| Path choice | "לצפות בסרטון" → `initialized` 005, `selected` (category `learning-type`, response `לצפות בסרטון`), `completed` 005, `initialized` 006 — **PASS** |
| played / paused | `played` (time 0.03) and `paused` (time 3.30) on item 006 — **PASS** |
| True/false 013 | "לא נכון" → `answered.last`, response **`false`**, success false; `completed` 013 (success false) — **PASS** |
| Resume | reload → first read `{load, 200}`, lands on `def-scq`; `qState('tf')` restored (`done`, `selected 'false'`), learning path `video` restored, 2 option marks painted on `tf`; re-entering 013 sends `initialized` only (no second `completed`) — **PASS** |

## Components 03–06

| Component | Observed on launch |
|---|---|
| 03, 04, 05, 06 | `METADATA.id === XAPI_COMP_ID`, `XAPI_DISABLED false`, `XAPI_USING_G true`, `DEV_NAV false`, first read `{load, 404, absent}`, the component `initialized` POST answered 200, no failed resource on 06 — **PASS** (preflight only) |

Console (pattern `deferring|unreachable|error|failed`): no messages.

## Not observed (unverified)

- The 01-011 matching and 01-012 dropdown responses live (verified only against the `_test` stub;
  Kata's own `correctXapiResponsesPattern` for 011 equals the string the unit sends).
- The full walks and finish of 01, 03–06, and the peak parts' (05/06) item-mirrors-part result live.
- Kata removing a component on `completed` and routing by `recommendedAfterFail` (no platform frame).
- The issue-report POST from the production origin; multi-tab behaviour; R7 tab close (guide §13).
