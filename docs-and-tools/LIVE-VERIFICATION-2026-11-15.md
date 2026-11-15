# Live verification on Kata — 2026-11-15

**Unit:** the Arabic components of `methodica-science-mass-gas-01`, created as **draft** the same day (`SEND-METADATA.md`).

**Pages:** served from the CDN, `https://lomdot.education.gov.il/metodica/720/ar/science/mass-gas/01/` (package `deployments/2026-11-15`, commit `6e31e94`).

**Tools:**
- `Tools/kata-rounds/live-round.mjs`, with a fresh launch link per round from `Tools/full-kata-link/New-KataLaunchLinks.ps1`;
- `Tools/kata-rounds/check-responses.py --coverage`;
- `Tools/moe-qa/Check-Unit720.ps1`.

**Where things are:** the steps, outputs and checker reports are in the project folder, `deployments/kata-rounds/`, outside git. The steps are the Hebrew unit's rounds of 11.11 (phase 3) and 14.11 (R), with Arabic component ids and Arabic typed text. The part 01 video stops changed to 43 / 86 / 119.

**Learner ids:** each round used a new pseudonymous learner, `VADIM-QA-AR-MG01xx-…-1115`.

## Rounds

| Round | Component | Learner | Result | Checked |
|---|---|---|---|---|
| Part 01, correct (`AR-MG0101-Cc`) | 01 | `VADIM-QA-AR-MG0101-Cc-1115` | **PASS** | Covers the whole component on the video path:<br>• `selected «video»`;<br>• `played` / `paused` on item 006;<br>• all three Arabic video stops asked and answered;<br>• DnD 011 matching in `[.]` / `[,]`;<br>• 013 `true`;<br>• `completed true 1`.<br>36 statements, all HTTP 200. |
| Part 01, resume (`AR-MG0101-R`) | 01 | `VADIM-QA-AR-MG0101-R-1115` | **PASS** (all its checks) | • The xAPI library loads before any image.<br>• Reload → same screen, character kept.<br>• Leaving 50 ms after a screen change → that screen restored (leave save).<br>• A write during the load window leaves the document intact.<br>"0 component completed" is expected, because the round stops early (as in the Hebrew R round of 14.11). |
| Part 02, correct | 02 | `VADIM-QA-AR-MG0102-C-1115` | **PASS** | 5/5, `completed true 1` |
| Part 03, correct | 03 | `VADIM-QA-AR-MG0103-C-1115` | **PASS** | 6/6, `completed true 1` |
| Part 03, all wrong | 03 | `VADIM-QA-AR-MG0103-W-1115` | **PASS** | Gate below 3/4: the part ends at Q4, `completed false 0`. |
| Part 04, correct | 04 | `VADIM-QA-AR-MG0104-C-1115` | **PASS** | 4/4, `completed true 1` |
| Part 05, correct | 05 | `VADIM-QA-AR-MG0105-C-1115` | **PASS** | Peak, 4 sections, `completed true 1` |
| Part 06, correct | 06 | `VADIM-QA-AR-MG0106-C-1115` | **PASS** | Peak, 4 sections, `completed true 1` |

### Two earlier part 01 attempts failed because of the test script

Both are kept in `out/`. Nothing in the page was wrong.

1. **`AR-MG0101-C`** used the single-click loop. It stopped at `lets-start`, which by design needs two Continue clicks: the first reveals step 2 (`onNext` returns `false`). The Hebrew team had the same on 11.11 and used `MG0101-Cb`.
2. **`AR-MG0101-Cb`** got past `lets-start`, then stalled on the video. Its seek times were the Hebrew video's (32 / 62 / 86).

## Checks on the recorded rounds

**`check-responses.py --coverage`** (the 6 full rounds, against the Kata unit JSON after the PATCH):

| Check | Result |
|---|---|
| Correct answers matching Kata's `correctXapiResponsesPattern`, character by character | **28 / 28** |
| Mismatches | 0 |
| Answers on an unknown id | 0 |
| Hebrew on the page | 0 |
| Component `completed` sent more than once | none |

Four questions have no `answered`: 01-002 q2 and 01-006 q1–q3. These are the ungraded open questions, so this is expected (guide §12.2). The Hebrew components have the same four.

**`live-round.mjs` Hebrew scan:** 0 Hebrew on every page, in every round. The scan covers text, hidden hints and feedback, `alt`, `title`, `aria-label`, `placeholder`, `data-zoom-alt` and `value`.

## Unit metadata — MOE checker and a PATCH of the parent unit

The first `Check-Unit720.ps1 -UnitKey methodica-science-mass-gas-01` run after the draft create gave: critical 1 · low 3.

The critical finding:
> יש רכיבים בערבית, וחסר arab-sector / druze-sector / bedouin-sector

(The unit has Arabic components, but its `targetSectors` lack `arab-sector` / `druze-sector` / `bedouin-sector`.)

One low finding:
> לכותרת היחידה אין גרסה בערבית

(The unit title has no Arabic version.)

Every other unit with Arabic components already carries those sectors and an `ar` title.

**PATCH, with Vadim's approval (15.11):** `PATCH /api/v1/content-units/methodica-science-mass-gas-01`, after a GET of the unit. The body is the full title object plus the sectors:
- `title` = `{"he": "נפח של גז", "ar": "حجم الغاز"}`;
- `targetSectors` = `state-general, state-religious, arab-sector, druze-sector, bedouin-sector`.

The response was HTTP 200.

**Read-back diff of the whole unit, before vs after:** exactly 4 changed paths (three sectors, `title.ar`). The 12 components were untouched. The unit's `updatedAt` did not move (known Kata behaviour). The before and after snapshots are in `deployments/kata-rounds/unit-patch/`.

`orthodox` was not added. The other units with Arabic twins carry it; that is open for the unit owner.

**Checker after the PATCH:** critical 0 · high 0 · medium 0 · low 2 · to check 0. Both lows are duplicate component names, `שאלת שיא` (05/06) and `السؤال الأكبر` (05/06). The Hebrew unit already had the Hebrew one on 14.11.

## Status

- **Kata:** 6 Arabic components, all **draft**. **Not published: `-Publish` waits for MOE's written approval of the Arabic version.**
- **CDN:** the 2026-11-15 package is live, verified by MD5 (bucket) and by size (CDN).
