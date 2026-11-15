# Resume — methodica-ar-science-mass-gas-01

> **Arabic twin (2026-11-15).** This file came with the port of the Hebrew unit `methodica-science-mass-gas-01`
> (`4aaffe3`); ids and keys are retargeted to the Arabic identity (`methodica-ar-…`, `/720/ar/science/mass-gas/01/`).
> The dated history below is the Hebrew unit's. Arabic specifics: [README](../README.md#arabic-build).

Kata xAPI State API, one document per component (`?registration`), state id
`execution-state::<component slug>`, document v5 (`unit-js/40-resume.js`, from mass-liquid-02):

```js
{ v: 5, component: 'methodica-ar-science-mass-gas-01-0N',
  payload: { currentScreen, key, snap, xr },   // 70-engine-bridge.js capturePartPayload()
  done, doneItems, hints, picks,               // ledgers: completed / item completed / hints / selected
  ui: { character }, results: {} }
```

- `snap` is the engine's own learner-state snapshot — the object it always kept per tab in
  sessionStorage (`q` question states incl. attempts / last wrong pick, `peak`, the in-part Back
  `history`, the part's `PART.saveState()` extras — part 01: simulations W1–W3, observations, flipped
  cards, DnD board, hypothesis, video-stop answers — and the learning `path`). `xr` is
  `XAPI_Q_RESULTS`. `key` is the screen key (the landing screen is resolved by key, not index).
- **Who owns the state:** with a `?registration` (a platform launch) the document does, and the
  engine skips its sessionStorage copy at boot; without one (local run, CDN QA) the engine keeps its
  per-tab behaviour and the bridge captures no payload, so the localStorage fallback document never
  moves the learner (its ledgers still dedupe — use `?resetState` to start clean).
- **Writes:** debounced on every screen change and engine save; synchronous after every graded
  attempt, the DnD answer, the path choice and the part's end; on pagehide / visibilitychange (known
  issue: Chrome may block the sync write on unload — bounded to < 800 ms of screen position).
- **Restore:** `50-loader.js` → `applyExecutionState`: sending muted, `applyResumeVars` (engine
  `restoreSnapshot` + `XAPI_Q_RESULTS`), `goTo(landing)`, the engine paints the screen from state on
  entry (answered questions locked with their marks and feedback, widgets from their state), D-8 end
  button, `xapiSeedAnsweredFromResume`, then the landing item's `initialized`.
- **Character:** chosen in part 01, kept in `ui.character` of each component's document and cached
  in localStorage `methodica_science_mass_gas_01_selectedCharacter` (the engine's own
  `methodica-ar-science-mass-gas-01:selectedCharacter` stays the fallback without the layer). Part 01's
  selection screen still never pre-selects (720 companion rule).
- Boot cover in every page; `?resetState` clears document and caches.

Verified locally 2026-11-01 against `_test/xapi-720-k.js`: reload mid-question (part 03, after a
wrong first attempt) lands on the same question with the wrong pick marked and finishes with
`answered.last`; reload after the end (part 02) lands on the last screen with the end button
disabled and re-sends only `initialized`.
