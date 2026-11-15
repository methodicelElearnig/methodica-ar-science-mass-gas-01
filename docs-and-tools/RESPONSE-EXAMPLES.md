# result.response examples — methodica-science-mass-gas-01

Captured 2026-11-01 from the local walk against `_test/xapi-720-k.js` (object ids shortened to the
component/item suffix). Format per MOE 2026-10-19 / xAPI-Data §4.1.6.1: the metadata string(s),
byte for byte, with the xAPI delimiters.

| verb | object | response | result |
|---|---|---|---|
| answered | 02-001/q1 | `למזוג את המיץ בצורה מהירה יותר שתדחוף אותו פנימה` | success false, scaled 0 |
| requested | 02-001/q1 | — (`helpType: hint`) | |
| answered.last | 02-001/q1 | `להסיר את נייר הדבק כדי שאוויר יוכל לצאת מהבקבוק` | success true, scaled 1 |
| answered.last | 02-003/q1 | `החושים שלנו עלולים להטעות אותנו ולכן נבדוק טענות בעזרת ראיות אובייקטיביות שאפשר לחזור ולמדוד` (the on-screen label has a `<br>` and a tooltip — neither is reported) | success true |
| completed | component 02 | — | success true, scaled 0.8 |
| answered.last | 01-002/q1 | `הבלון כמעט ולא יתנפח` | success true |
| completed | 01-002/ | — | success true, scaled 1 (q2, the ungraded hypothesis, does not count) |
| selected | component 01 | `לצפות בסרטון` (category learning-type) | |
| played / paused | 01-006/ | — (time 0.05 / 3.53) | |
| answered.last | 01-011/q1 (matching) | `בלון בתוך בקבוק[.]אוויר הוא גז שתופס מקום, יש לו נפח כמו לכל הגזים. הוא מונע מחומר אחר להיכנס לכלי כל עוד אין לו איך לצאת.[,]אוויר בתוך מזרק[.]בניגוד למוצקים ולנוזלים, …[,]בלון מנופח ובלון חסר אוויר[.]הטמפרטורה בסביבת הגזים …` | success true |
| answered.last | 01-012/q1 (dropdown, choice) | `משקל` | success false |
| answered.last | 01-013/q1 (true-false) | `true` | success true |
| completed | component 06 (fail ending) | — | success false, scaled 0 |
| completed | component 04 (last screen = article, "המשך") | — | success true, scaled 1 |
