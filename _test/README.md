# Tests — methodica-ar-science-mass-gas-01

Not shipped.

## Static

```
node _test/verify-report.js
```

Ids vs `metadata/`, screen map completeness, page contract (script order, one `?v=`, boot cover,
report dialogs), library letter / regex, the 2026-10-14 rule (no window.close / open / alert), D-1
(no YT.Player on a placeholder), engine copies = `shared/`, and `docs-and-tools/check-labels.js`
(on-screen options = metadata answers). Exit 1 on any failure.

## Score contract (jsdom)

```
NODE_PATH=/tmp/lomda-test/node_modules node _test/score-contract.js
```

MOE QA runbook §4 "ציון ומעבר" for the parts that promise "K of N" on their first screen
(`PART.xapi.threshold`, 2026-11-09 — part 03): drives the real part in jsdom by clicks; every count
0…N with the harder questions right / wrong, the gate at K−1 and K, and a reload at the gate (the
state document's payload + ledger, applied as `50-loader.js` does). jsdom must live outside this
OneDrive tree (`mkdir -p /tmp/lomda-test && cd /tmp/lomda-test && npm install jsdom`). Exit 1 on any failure.

## Back and path switch (jsdom)

```
NODE_PATH=/tmp/lomda-test/node_modules node _test/back-and-path.js
```

2026-11-12, monday 13454123722 (B) and 13451706244 (T). B, in every part with an evaluated question
that has an earlier item (02, 03, 04): wrong first try → Back → no item `completed`; return → right →
forward → exactly one, `success:true`. T, part 01: בחרתי video → toggle hands-on → toggle video → a click
on the active tab gives three `selected` (video, interactive-content, video), and both switches close the
item they leave (the path starts are B-2 hubs). On the old `20-xapi.js` 8 checks fail; without the hubs 1.

## Browser walk (offline stub)

Serve the repo (`python scripts/serve.py`, port 8765) and open a part with the stub library — on
localhost only, `50-loader.js` honours `?xapiLib`:

```
http://localhost:8765/methodica-ar-science-mass-gas-01-02/index.html?registration=t1&xapiLib=../_test/xapi-720-k.js&resetState
```

Console: `__stmts()` (statement log, survives reloads), `__state()` (the state document), `__dupes()`
(duplicate `completed`), `__failWrites(413)`, `__reset()`. Start every walk with `&resetState` — a
`__reset()` followed by a navigation is undone by the leaving page's own save.

Walk per part: answer wrong then right (→ `answered`, `answered.last`), open a hint twice (→ one
`requested`), reload mid-question (→ same screen, marks painted, only `initialized` re-sent), finish
(→ item `completed`s, component `completed`, the button disabled, no navigation). Part 01 also: the
path choice (→ `selected` learning-type), the DnD (→ matching response), the video (`YT.get('vd-yt-frame')`
`.playVideo()` / `.pauseVideo()` → `played` / `paused` on item 006). Without `?registration` and with
`?dev=1` the parts route to each other as before.

Never submit the issue-report form in a test: it posts to the Google Form shared by every 720 unit.
