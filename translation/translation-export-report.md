# Translation Export Report — Target 09, נפח של גז

**Module:** methodica-science-mass-gas-01
**Export type:** first export (no earlier translation export existed for this unit)
**Date:** 2026-10-31
**Languages:** Hebrew (he) → Arabic (ar). Every `<target>` cell is empty.
**Regenerate:** `python3 translation/tools/extract_translations.py` (it only reads the build, never writes to it)

## Files

| File | What it is |
|---|---|
| `methodica-science-mass-gas-01-he-ar.xlsx` | For the translator: one row per string, a yellow column for the Arabic, and a second sheet listing the screens |
| `methodica-science-mass-gas-01-he-ar.xlf` | The same units as XLIFF 1.2, for a CAT tool |
| `translation-screen-manifest.csv` | One row per screen: id, screen key, title, type, file, number of units |
| `tools/extract_translations.py` | The extractor |

## Totals

| | Count |
|---|---|
| Units | **595** (463 distinct Hebrew strings, ≈ 4,840 words) |
| From JS (`main.js` screen data, part 01 `widgets.js`, shared engine) | 563 |
| From HTML (`index.html`: page title, "מצאתם בעיה?", image-zoom dialog, root redirect page) | 32 |
| Units whose source holds HTML tags (`<b>`, `<br>`, `<span …>`) | 157 |
| Screens in the manifest | 55 (+ one "99" row per part and 2 rows for part 00) |

Units per part: 00 → 21, 01 → 179, 02 → 83, 03 → 84, 04 → 71, 05 → 84, 06 → 73.

## IDs

`09-PP-SS-NNN`: target 09, part (00–06), screen (its position in the part's `PART.screens`, matching the engine's `s<i>`), running number. The screen key (`q1`, `obs2`, `summary-dnd`…) is in its own column and note.

- **Part 00** is the module root (`index.html`, the redirect page, screen 00) and the **shared engine** (`shared/engine.js`, screen 99). The engine is the same file in every part, so its 19 strings ("המשך", "צדקתי?", "שנמשיך?", "אפשר רמז?", "חזרה לשאלה", "בחרו תשובה", "שאלה N"…) appear once. Their translation applies to all six parts.
- **Screen 99** in each part is text that belongs to no single screen: the page title, the "מצאתם בעיה?" button, the image-zoom dialog labels, and shared constants such as `WRONG_FINAL` ("התשובה אינה נכונה." / "התשובה הנכונה מוצגת.").

## How this unit differs from earlier exports

All text in this unit lives in JavaScript data (`window.PART` in each `js/main.js`), not in the HTML. The extractor therefore:
- maps each string to its screen through the `screens[]` entry or the `hooks{}` block for that screen key;
- splits JS strings that hold markup blocks (`<div>…<p>…</p></div>`) into their Hebrew text runs and Hebrew attributes (aria-label, placeholder, alt). Those units carry the note "נלקח מתוך מקטע HTML בקוד";
- handles strings cut in the middle of a tag (`'-back">חזרה</button>'`, `'<nav aria-label="ניווט שאלות" data-series="'`) by taking only the Hebrew.

## Notes for the translator

1. **HTML tags:** translate the text and keep the tags in place. `<b>` marks emphasis that has to stay on the matching words, and `<br>` is a line break from the script.
2. **Repeated strings:** 76 Hebrew strings appear more than once (208 units), e.g. "נכון מאוד!" ×21, "התשובה אינה נכונה." ×9, "מצאתם בעיה?" ×6. Translate them the same way every time.
3. **Joined strings (105 units):** pieces of one sentence that the code joins with `+`, usually a long question split into lines (`'…<br>' + '…'`), or "שאלה " + number. They are marked in the notes column. Translate them so the sentence still reads correctly once the pieces are joined, and keep the `<br>` breaks roughly where they are.
4. **Hebrew inside an attribute (1 unit, 09-02-03-005):** option ב in part 02 Q3 has a tooltip (`data-tip`, `aria-label`) inside the option text. Translate the tooltip text along with the visible text.
5. **Peak sub-parts:** "סעיף א:" … "סעיף ד:" in parts 05/06 are section labels. Use the Arabic letters the curriculum uses (أ/ب/ج/د).

## Not covered by this export (needs separate localization)

- **Text inside images:** `methodica-science-mass-gas-01-04/assets/img/content/two-vessels-tap.svg` draws Hebrew as SVG text ("כלי ראשון", "כלי שני", "ברז", "בכל פעם הונח בכלי הראשון:", "טבעת כסף", "מיץ פטל", "גז צבעוני"). The image's alt text is in the export, but the drawing needs an Arabic copy. No one has checked raster images (jpg/png/gif) for Hebrew baked into the picture. Someone should check them by eye.
- **Video and audio:** the instructional video (YouTube `lXBGIz2y78A`, part 01) has Hebrew narration. The character clips and the hamster video are muted. None of these is covered here.
- **Production placeholders:** "GIF מהסרטון — בהפקה" (09-01-15-014) is a placeholder that is replaced before delivery. Translate it only if it is still in the build at translation time.
- **Metadata / reporting:** not part of this unit's build and not included.
- **CSS:** the only Hebrew in the CSS is in comments. Nothing to translate.

## Verification

| Check | Result |
|---|---|
| XML well-formed | ✅ |
| Duplicate ids | ✅ 0 (595 unique) |
| All `<target>` empty | ✅ |
| Comments, `<script>` and `<style>` excluded | ✅ |
| Separate sweep: every Hebrew word in the HTML/JS (outside comments) appears in a unit from the same file | ✅ 0 missed (the 2 words the sweep flagged are inside code comments) |
| Build files modified | ✅ none (only `translation/` was written) |
