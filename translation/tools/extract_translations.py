#!/usr/bin/env python3
"""
extract_translations.py — Target 09, נפח של גז: translation export (he → ar).

Reads every learner-facing Hebrew string in the build and writes, into translation/:
  methodica-science-mass-gas-01-he-ar.xlf    XLIFF 1.2, one <trans-unit> per string, empty <target>
  methodica-science-mass-gas-01-he-ar.xlsx   the same units as a spreadsheet for the translator
  translation-screen-manifest.csv            one row per screen

Read-only against the build. Run from the repo root:
    python3 translation/tools/extract_translations.py

Where the text lives in this unit
  The parts are data-driven: each part's js/main.js (window.PART) holds all PPTX text — screens[],
  hooks{} (custom-screen markup) and top-level constants. Part 01 adds js/widgets.js (simulations,
  path toggle, flip cards, DnD). The shared engine (shared/engine.js, synced unchanged into every
  part) holds the runtime chrome: buttons, hint dialog, progress nav, retry feedback. Each part's
  index.html holds the page title, the "מצאתם בעיה?" button and the image-zoom dialog.

What counts as a unit
  JS    Every string literal (', ", `) holding Hebrew, comments skipped. A literal that is plain text
        or text with inline markup only (b, br, span…) is one unit, tags kept. A literal holding
        block markup (div, p, textarea…) is split: each run of Hebrew text with inline markup is a
        unit, each Hebrew attribute (aria-label, alt, placeholder, data-tip…) is a unit.
        Concatenated pieces stay separate units; the note says so.
  HTML  Same splitting rule applied to the page; comments, <script> and <style> skipped.

IDs are 09-PP-SS-NNN: part, screen (index in PART.screens, as the engine's s<i>; 99 = text not
tied to one screen; part 00 = the module root page and the shared engine), running number.
The engine is extracted once (part 00) because every part runs the same copy.
"""
import bisect
import csv
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "translation"
SLUG = "methodica-science-mass-gas-01"
TARGET = "09"
PARTS = ["01", "02", "03", "04", "05", "06"]

HEB = re.compile(r"[֐-׿]")
WS = re.compile(r"\s+")
MARKUP = re.compile(r"<[a-zA-Z/!]")
INLINE = {"span", "b", "strong", "em", "i", "u", "sup", "sub", "br", "wbr", "small", "a",
          "bdi", "bdo", "mark", "s", "q", "abbr", "code", "kbd"}
SKIP_TAGS = {"script", "style", "noscript"}
SKIP_ATTRS = {"class", "id", "style", "src", "href"}

ROLE_BY_TAG = {
    "h1": "heading", "h2": "heading", "h3": "subheading", "h4": "subheading", "p": "paragraph",
    "li": "list-item", "button": "button-label", "label": "label", "option": "option",
    "title": "page-title", "th": "table-header", "td": "table-cell", "figcaption": "caption",
    "legend": "label", "text": "svg-text", "tspan": "svg-text",
}
ROLE_BY_ATTR = {"alt": "image-alt", "aria-label": "aria-label", "title": "tooltip",
                "placeholder": "placeholder", "data-tip": "tooltip-text",
                "aria-roledescription": "aria-roledescription"}

# top-level constants in a part's main.js that belong to one screen (others stay at 99)
TOPLEVEL_SCREEN = {"VIDEO_QS": "video"}

# part 01 js/widgets.js: the first line matching a marker opens that screen's block
WIDGET_MARKERS = [
    ("function toggle(", "path-select"), ("function tabs(", "obs1"), ("const W1", "obs1"),
    ("const W2", "obs2"), ("const W3", "obs3"), ("function obsDone", None),
    ("function flip(", "flipcards"), ("function dnd(", "summary-dnd"),
]


def norm(s):
    return WS.sub(" ", s).strip()


def has_heb(s):
    return bool(s) and bool(HEB.search(s))


def inline_only(el):
    return all(d.name in INLINE for d in el.descendants if isinstance(d, Tag))


def selector(el):
    s = el.name
    if el.get("id"):
        s += "#" + el["id"]
    cls = el.get("class") or []
    if cls:
        s += "." + ".".join(cls[:2])
    return s


def heb_attrs_inside(el):
    return any(has_heb(" ".join(v) if isinstance(v, list) else v)
               for d in [el] + el.find_all(True) for k, v in d.attrs.items() if k not in SKIP_ATTRS)


class Unit:
    def __init__(self, part, screen, source, role, loc, element="", context=""):
        self.part, self.screen, self.source = part, screen, source
        self.role, self.loc, self.element, self.context = role, loc, element, context
        self.notes = []
        self.id = ""


# ── markup splitting (HTML pages and markup-bearing JS literals) ──────────────────────────────
def markup_pieces(soup):
    """Yield (source, role, element, note) for every Hebrew text run / attribute in a soup."""
    out = []

    def emit_attrs(el):
        for k, v in el.attrs.items():
            if k in SKIP_ATTRS or k.startswith("on"):
                continue
            v = " ".join(v) if isinstance(v, list) else v
            if has_heb(v):
                out.append((norm(v), ROLE_BY_ATTR.get(k, "attribute:" + k), selector(el) + f"[{k}]", ""))

    def visit(el, top=False):
        if not top:
            emit_attrs(el)
        if not has_heb(el.get_text()):
            for d in el.find_all(True):
                emit_attrs(d)
            return
        if not top and el.name not in ("html", "body", "head") and inline_only(el):
            note = "attr" if any(heb_attrs_inside(c) for c in el.find_all(True)) else ""
            out.append((norm(el.decode_contents()), ROLE_BY_TAG.get(el.name, "text"), selector(el), note))
            return
        for ch in el.children:
            if isinstance(ch, Tag):
                visit(ch)
            elif isinstance(ch, NavigableString) and has_heb(str(ch)):
                out.append((norm(str(ch)), "text", ("" if top else selector(el) + " (loose text)"), ""))

    visit(soup, top=True)
    return out


def clean_soup(text):
    soup = BeautifulSoup(text, "html.parser")
    for c in soup.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for t in soup.find_all(SKIP_TAGS):
        t.decompose()
    return soup


ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
LEAD = re.compile(r"^([^<]*?)>")
TRAIL = re.compile(r"<[^>]*$")


def fragment_pieces(text):
    """A JS literal cut mid-tag ('-back">חזרה</button>', '<nav aria-label="…" data-x="'):
    take the Hebrew attributes from the partial tags at either end, split the rest normally."""
    out, body = [], text
    m = LEAD.match(body)
    if m and ('"' in m.group(1) or not m.group(1).strip()):
        head = m.group(1)
        for k, v in ATTR.findall(head):
            if has_heb(v):
                out.append((norm(v), ROLE_BY_ATTR.get(k, "attribute:" + k), f"(partial tag)[{k}]", ""))
        rest = ATTR.sub("", head)
        if has_heb(rest):   # tail of an attribute value joined in code: '. לחצו להפוך">'
            out.append((norm(rest.strip().strip('"')), "attribute-fragment", "(partial tag)", ""))
        body = body[m.end():]
    m = TRAIL.search(body)
    if m:
        for k, v in ATTR.findall(m.group(0)):
            if has_heb(v):
                out.append((norm(v), ROLE_BY_ATTR.get(k, "attribute:" + k), f"(partial tag)[{k}]", ""))
        body = body[:m.start()]
    if not MARKUP.search(body):   # attributes only: 'aria-label="רמז"'
        for k, v in ATTR.findall(body):
            if has_heb(v):
                out.append((norm(v), ROLE_BY_ATTR.get(k, "attribute:" + k), f"(attribute)[{k}]", ""))
        body = ATTR.sub("", body)
        if has_heb(body):
            out.append((norm(body), "text", "", ""))
        return out
    return out + markup_pieces(clean_soup(body))


VOID = {"br", "wbr", "img", "input", "hr", "source"}


def is_fragment(text):
    t = text.strip()
    lead = LEAD.match(t)
    opened = [n for n in re.findall(r"<([a-zA-Z][\w-]*)", t) if n.lower() not in VOID]
    closed = re.findall(r"</([a-zA-Z][\w-]*)", t)
    return bool((lead and ('"' in lead.group(1) or not lead.group(1).strip())) or TRAIL.search(t)
                or (not MARKUP.search(t) and ATTR.search(t)) or len(opened) != len(closed))


def html_units(path, rel, part, screen):
    soup = clean_soup(path.read_text(encoding="utf-8"))
    units = []
    for src, role, el, note in markup_pieces(soup):
        u = Unit(part, screen, src, role, rel, el)
        if note:
            u.notes.append("attr")
        units.append(u)
    # sourceline is lost in markup_pieces; locate by first occurrence for the reader
    text = path.read_text(encoding="utf-8")
    for u in units:
        probe = HEB.search(u.source) and re.search(r"[֐-׿][^\s<\"]*", u.source).group(0)
        i = text.find(probe)
        u.loc = f"{rel}:{text.count(chr(10), 0, i) + 1 if i >= 0 else 0}"
    return units


# ── JS ────────────────────────────────────────────────────────────────────────────────────────
REGEX_PRE = set("(,=:[!&|?{};+-*%<>~^")
KEY_BEFORE = re.compile(r"([A-Za-z_$][\w$-]*)'?\s*:\s*\[?\s*$")


def js_literals(src):
    """Yield (start, end, text) for every string literal, skipping comments and regex literals."""
    i, n, prev = 0, len(src), ""
    while i < n:
        c = src[i]
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == "/" and (prev in REGEX_PRE or prev == ""):
            j, in_cls = i + 1, False
            while j < n and src[j] != "\n":
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "[":
                    in_cls = True
                elif src[j] == "]":
                    in_cls = False
                elif src[j] == "/" and not in_cls:
                    break
                j += 1
            i, prev = j + 1, "x"
            continue
        if c in "'\"`":
            j, buf = i + 1, []
            while j < n and src[j] != c:
                if src[j] == "\\" and j + 1 < n:
                    buf.append(src[j:j + 2])
                    j += 2
                    continue
                if c == "`" and src[j] == "$" and j + 1 < n and src[j + 1] == "{":
                    depth, k = 1, j + 2
                    while k < n and depth:
                        depth += {"{": 1, "}": -1}.get(src[k], 0)
                        k += 1
                    buf.append(src[j:k])
                    j = k
                    continue
                buf.append(src[j])
                j += 1
            yield i, j + 1, "".join(buf)
            i, prev = j + 1, "x"
            continue
        if not c.isspace():
            prev = c
        i += 1


def unescape_js(s):
    s = s.replace("\\n", "\n").replace("\\'", "'").replace('\\"', '"').replace("\\`", "`")
    s = re.sub(r"\\u([0-9A-Fa-f]{4})", lambda m: chr(int(m.group(1), 16)), s)
    return s.replace("\\\\", "\\")


def main_js_screen_map(lines, keys):
    """Screen key (or None) per line of a part's main.js."""
    at, cur, section = [], None, ""
    for ln in lines:
        if re.match(r"^\S", ln):
            m = re.match(r"^(?:const|let|var|function)\s+([\w$]+)", ln)
            cur, section = (TOPLEVEL_SCREEN.get(m.group(1)) if m else None), ""
        m = re.match(r"^  (\w+)\s*:", ln)
        if m:
            cur, section = None, m.group(1)
        if section == "hooks":
            m = re.match(r"^    '?([\w-]+)'?\s*:", ln)
            if m and m.group(1) in keys:
                cur = m.group(1)
        elif section == "screens":
            m = re.match(r"^    \{\s*key:\s*'([\w-]+)'", ln)
            if m:
                cur = m.group(1)
        at.append(cur)
    return at


def widgets_screen_map(lines):
    at, cur = [], None
    for ln in lines:
        for marker, key in WIDGET_MARKERS:
            if ln.lstrip().startswith(marker):
                cur = key
        at.append(cur)
    return at


def js_units(path, rel, part, screen_at=None):
    """screen_at: list of screen key per line (None = not tied to a screen)."""
    src = path.read_text(encoding="utf-8")
    lines = src.split("\n")
    line_start = [0]
    for ln in lines:
        line_start.append(line_start[-1] + len(ln) + 1)

    units = []
    for start, end, raw in js_literals(src):
        if not has_heb(raw):
            continue
        lno = bisect.bisect_right(line_start, start) - 1
        before = src[line_start[lno]:start]
        after = src[end:src.find("\n", end) if src.find("\n", end) >= 0 else len(src)]
        km = KEY_BEFORE.search(before)
        key = km.group(1) if km else ""
        concat = before.rstrip().endswith("+") or after.lstrip().startswith("+")
        if not concat:  # a sentence wrapped over lines: 'a<br>' +\n 'b'
            prev_line = lines[lno - 1].rstrip() if lno else ""
            concat = prev_line.endswith("+") and before.strip() == ""
        ctx = norm(lines[lno])[:160]
        screen = screen_at[lno] if screen_at else None
        text = unescape_js(raw)
        loc = f"{rel}:{lno + 1}"

        pieces = []
        if is_fragment(text):
            for s, role, el, note in fragment_pieces(text):
                pieces.append((s, role, el, note, True))
        elif MARKUP.search(text) and not inline_only(BeautifulSoup(text, "html.parser")):
            for s, role, el, note in markup_pieces(clean_soup(text)):
                pieces.append((s, role, el, note, True))
        else:
            soup = BeautifulSoup(text, "html.parser")
            note = "attr" if heb_attrs_inside(soup) and soup.find(True) else ""
            body = norm(text) if "\n" not in text else text.strip()
            pieces.append((body, "js:" + key if key else "js-string", "", note, False))

        for s, role, el, note, split in pieces:
            u = Unit(part, screen, s, role, loc, el, ctx)
            if note:
                u.notes.append("attr")
            if concat:
                u.notes.append("concat")
            if split:
                u.notes.append("split")
            if "${" in s:
                u.notes.append("placeholder")
            units.append(u)
    return units


# ── main ──────────────────────────────────────────────────────────────────────────────────────
NOTE_HE = {
    "concat": "חלק ממשפט שמחובר בקוד — לתרגם כך שיתחבר נכון עם השורות הסמוכות",
    "attr": "בתוך הקוד יש טקסט עברי במאפיין (aria-label / data-tip) — לתרגם גם אותו ולהשאיר את התגיות",
    "split": "נלקח מתוך מקטע HTML בקוד",
    "placeholder": "יש ${...} — להשאיר כמו שהוא",
}
NOTE_EN = {
    "concat": "part of a + concatenation: translate so the joined sentence still reads correctly",
    "attr": "holds Hebrew inside an attribute (aria-label / data-tip): translate it too, keep the tags",
    "split": "taken from a markup fragment inside a JS string",
    "placeholder": "keep ${...} placeholders unchanged",
}


def main():
    units, screens = [], []   # screens: (part, idx, key, type, title, file)

    # Part 00 — module root page + the shared engine (one copy for all parts)
    units += html_units(ROOT / "index.html", "index.html", "00", 0)
    units += js_units(ROOT / "shared/engine.js", "shared/engine.js", "00")

    for p in PARTS:
        d = ROOT / f"{SLUG}-{p}"
        main_js = d / "js/main.js"
        src_lines = main_js.read_text(encoding="utf-8").split("\n")
        order, types = [], {}
        for ln in src_lines:
            m = re.match(r"^    \{\s*key:\s*'([\w-]+)'\s*,\s*type:\s*'([\w-]+)'", ln)
            if m:
                order.append(m.group(1))
                types[m.group(1)] = m.group(2)
        idx = {k: i for i, k in enumerate(order)}

        part_units = html_units(d / "index.html", f"{d.name}/index.html", p, None)
        part_units += js_units(main_js, f"{d.name}/js/main.js", p, main_js_screen_map(src_lines, set(order)))
        if (d / "js/widgets.js").exists():
            wl = (d / "js/widgets.js").read_text(encoding="utf-8").split("\n")
            part_units += js_units(d / "js/widgets.js", f"{d.name}/js/widgets.js", p, widgets_screen_map(wl))
        for u in part_units:
            u.screen = idx[u.screen] if u.screen in idx else 99
        units += part_units

        for k in order:
            first = next((u for u in part_units if u.screen == idx[k] and u.loc.endswith(".js:" + u.loc.split(":")[-1])
                          and "main.js" in u.loc), None)
            title = norm(re.sub(r"<[^>]+>", " ", first.source))[:70] if first else ""
            screens.append((p, idx[k], k, types[k], title, f"{d.name}/js/main.js"))

    for u in units:
        if u.part == "00":
            u.screen = 0 if u.loc.startswith("index.html") else 99

    # stable order: part, screen, file, line; number per screen
    files = {k: i for i, k in enumerate(dict.fromkeys(u.loc.rsplit(":", 1)[0] for u in units))}
    units.sort(key=lambda u: (u.part, u.screen, files[u.loc.rsplit(":", 1)[0]], int(u.loc.rsplit(":", 1)[1] or 0)))
    seq = {}
    for u in units:
        k = (u.part, u.screen)
        seq[k] = seq.get(k, 0) + 1
        u.id = f"{TARGET}-{u.part}-{u.screen:02d}-{seq[k]:03d}"

    sinfo = {(p, n): (key, t, title) for p, n, key, t, title, _ in screens}

    def screen_key(u):
        if u.part == "00":
            return "root" if u.screen == 0 else "engine"
        return sinfo.get((u.part, u.screen), ("chrome",))[0]

    def screen_title(u):
        if u.part == "00":
            return "Module root redirect page" if u.screen == 0 else "Shared engine — runtime chrome used on every part"
        if u.screen == 99:
            return "Part-wide chrome / strings not tied to one screen"
        return sinfo.get((u.part, u.screen), ("", "", ""))[2]

    def screen_type(u):
        if u.screen == 99 or u.part == "00":
            return "chrome"
        return sinfo.get((u.part, u.screen), ("", "", ""))[1]

    OUT.mkdir(exist_ok=True)
    # XLIFF
    xl = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
          f'  <file original="{SLUG}" source-language="he" target-language="ar" datatype="html" '
          'tool-id="claude-code-translation-export">',
          "    <header>",
          "      <note>Target/learning-objective 09 — נפח של גז (Volume of a gas), 720-series Hebrew "
          "e-learning module. Parts 01-06 plus pseudo-part 00 (module root page and the shared engine, "
          "which every part runs unchanged). Sources holding HTML tags keep them: translate the text, "
          "keep the tags. No production files were modified to produce this export.</note>",
          "    </header>", "    <body>"]
    for u in units:
        xl.append(f'      <trans-unit id="{u.id}">')
        xl.append(f"        <source>{escape(u.source)}</source>")
        xl.append("        <target></target>")
        xl.append(f'        <note from="screen-id">{TARGET}-{u.part}-{u.screen:02d}</note>')
        xl.append(f'        <note from="screen-key">{escape(screen_key(u))}</note>')
        t = screen_title(u)
        if t:
            xl.append(f'        <note from="screen-title">{escape(t)}</note>')
        xl.append(f'        <note from="screen-type">{escape(screen_type(u))}</note>')
        xl.append(f'        <note from="element-role">{escape(u.role)}</note>')
        if u.element:
            xl.append(f'        <note from="element">{escape(u.element)}</note>')
        if u.context:
            xl.append(f'        <note from="js-context">{escape(u.context)}</note>')
        for n in u.notes:
            xl.append(f'        <note from="translator">{escape(NOTE_EN[n])}</note>')
        xl.append(f'        <note from="source-location">{escape(u.loc)}</note>')
        xl.append("      </trans-unit>")
    xl += ["    </body>", "  </file>", "</xliff>", ""]
    (OUT / f"{SLUG}-he-ar.xlf").write_text("\n".join(xl), encoding="utf-8")

    # manifest
    cnt = {}
    for u in units:
        cnt[(u.part, u.screen)] = cnt.get((u.part, u.screen), 0) + 1
    rows = [[f"{TARGET}-00-00", "root", "Module root redirect page", "chrome", "index.html", cnt.get(("00", 0), 0)],
            [f"{TARGET}-00-99", "engine", "Shared engine — runtime chrome", "chrome", "shared/engine.js",
             cnt.get(("00", 99), 0)]]
    for p in PARTS:
        rows += [[f"{TARGET}-{p}-{n:02d}", k, title, t, f, cnt.get((p, n), 0)]
                 for pp, n, k, t, title, f in screens if pp == p]
        rows.append([f"{TARGET}-{p}-99", "chrome", "Part-wide chrome / strings not tied to one screen", "chrome",
                     f"{SLUG}-{p}/index.html + js", cnt.get((p, 99), 0)])
    with open(OUT / "translation-screen-manifest.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["screen_id", "screen_key", "screen_title", "screen_type", "source_file", "units"])
        w.writerows(rows)

    # xlsx
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    wb = Workbook()
    ws = wb.active
    ws.title = "תרגום"
    ws.sheet_view.rightToLeft = True
    ws.append(["מזהה", "חלק", "מסך", "מפתח מסך", "תפקיד הטקסט", "טקסט מקור (עברית)", "תרגום (ערבית)",
               "הערות", "מיקום בקוד"])
    for u in units:
        ws.append([u.id, u.part, f"{u.screen:02d}", screen_key(u), u.role, u.source, "",
                   "; ".join(NOTE_HE[n] for n in u.notes), u.loc])
    for i, wdt in enumerate([15, 6, 6, 16, 18, 60, 60, 34, 40]):
        ws.column_dimensions[chr(65 + i)].width = wdt
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="2F6FA3")
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
        row[6].fill = PatternFill("solid", fgColor="FFF7D6")
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:I{len(units) + 1}"
    ms = wb.create_sheet("מסכים")
    ms.sheet_view.rightToLeft = True
    ms.append(["מזהה מסך", "מפתח", "כותרת", "סוג", "קובץ", "יחידות"])
    for r in rows:
        ms.append(r)
    for i, wdt in enumerate([12, 16, 50, 14, 45, 8]):
        ms.column_dimensions[chr(65 + i)].width = wdt
    wb.save(OUT / f"{SLUG}-he-ar.xlsx")

    by_part = {}
    for u in units:
        by_part[u.part] = by_part.get(u.part, 0) + 1
    ids = [u.id for u in units]
    print(f"units={len(units)} unique_ids={len(set(ids))} by_part={dict(sorted(by_part.items()))}")
    print(f"screens={len(screens)} screen99={sum(1 for u in units if u.screen == 99)} "
          f"html_tags={sum(1 for u in units if '<' in u.source)} "
          f"js={sum(1 for u in units if '.js:' in u.loc)} html={sum(1 for u in units if '.html:' in u.loc)}")
    for n in NOTE_EN:
        print(f"  note {n}: {sum(1 for u in units if n in u.notes)}")


if __name__ == "__main__":
    sys.exit(main())
