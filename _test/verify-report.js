#!/usr/bin/env node
/* Static checks of the reporting / resume wiring — run before every commit that touches
   unit-js/, shared/engine.js, a part's index.html / js/main.js or metadata/.
     node _test/verify-report.js
   Exit 1 on any failure. No browser, no dependencies (Node's vm only). The behavioural checks —
   statement flow, resume, D-8 — are the browser walk in _test/README.md, against _test/xapi-720-k.js.

   What it asserts (ADDING-REPORTING-AND-RESUME.md §10, as it applies to this engine-driven unit):
     ids        XAPI_ID_PREFIX + component slug + '/' === metadata id; every item suffix and qN the
                parts name exists in metadata/; every metadata item has a screen (D-2); every graded
                metadata question is reported by some screen (D-9; "other" without correctAnswers
                excepted); no reserved delimiter [,] [.] [:] inside a metadata answer string
    map         every screen key of every part is in PART.xapi.items
    pages       every part loads the layer in the contract order with ONE ?v=, has the boot cover,
                the three report dialogs inside #app and ../unit-css/25-report.css
    library     50-loader.js: the -k library and an XAPI_USING_G regex that matches it
    rules       no window.close / window.open( / CLOSE_LEARNING_MODULE / alert( (2026-10-14); no
                YT.Player built on a placeholder with a videoId (D-1 token leak); the engine copies
                in the parts equal shared/engine.js
    labels      docs-and-tools/check-labels.js (on-screen options = metadata answers)               */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SLUG = 'methodica-ar-science-mass-gas-01';
const PARTS = ['01', '02', '03', '04', '05', '06'];
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log('✗ ' + msg); } };

/* identity */
const idCtx = { window: {}, location: { search: '' }, URLSearchParams };
vm.createContext(idCtx);
vm.runInContext(rd('unit-js/10-identity.js'), idCtx);
const PREFIX = vm.runInContext('XAPI_ID_PREFIX', idCtx);
const unitMeta = JSON.parse(rd(`metadata/${SLUG}_unit.json`));
ok(idCtx.window.XAPI_UNIT_ID === unitMeta.id, `XAPI_UNIT_ID ${idCtx.window.XAPI_UNIT_ID} = unit metadata id ${unitMeta.id}`);

function loadPart(n) {
  const ctx = { window: {}, document: { addEventListener() {}, querySelector() { return null; } }, console, location: { search: '', hash: '' } };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  const dir = path.join(ROOT, `${SLUG}-${n}`, 'js');
  if (fs.existsSync(path.join(dir, 'widgets.js'))) {
    try { vm.runInContext(fs.readFileSync(path.join(dir, 'widgets.js'), 'utf8'), ctx); } catch (e) { /* DOM-bound; PART only needs P01 names */ }
  }
  vm.runInContext(fs.readFileSync(path.join(dir, 'main.js'), 'utf8'), ctx, { filename: `${n}/main.js` });
  return ctx.window.PART;
}

const short = u => String(u).replace(/\/+$/, '').split('/').pop();
let V = null;
for (const n of PARTS) {
  const comp = `${SLUG}-${n}`;
  const meta = JSON.parse(rd(`metadata/${comp}.json`));
  ok(meta.id === PREFIX + comp + '/', `${n}: component id ${meta.id} = prefix + slug + '/'`);
  const PART = loadPart(n);
  const X = PART.xapi || {};
  ok(!!PART.xapi, `${n}: PART.xapi declared`);
  const items = X.items || {}, qs = X.questions || {};
  const metaItems = {};
  meta.subContent.forEach(it => { metaItems[short(it.id).split('-').pop()] = it; ok(it.id === meta.id + short(it.id) + '/', `${n}: item id shape ${it.id}`); });
  PART.screens.forEach(s => ok(s.key in items, `${n}: screen "${s.key}" in PART.xapi.items`));
  Object.keys(items).forEach(k => {
    ok(PART.screens.some(s => s.key === k), `${n}: PART.xapi.items "${k}" is a screen`);
    if (items[k]) ok(!!metaItems[items[k]], `${n}: item ${items[k]} (screen ${k}) in metadata`);
  });
  Object.keys(metaItems).forEach(sfx => ok(Object.values(items).includes(sfx), `${n}: metadata item ${sfx} has a screen (D-2)`));
  /* the learning paths ('selected' / learning-type, guide §6.3a, 2026-11-02): each path's item exists,
     its mediaFormat is the catalogue's, and it is the item of the screen the path starts on */
  Object.keys(X.paths || {}).forEach(p => {
    const d = X.paths[p], it = metaItems[d.item];
    ok(!!it && it.mediaFormat === d.mediaFormat, `${n}: path "${p}" -> item ${d.item}, mediaFormat ${d.mediaFormat} = catalogue ${it && it.mediaFormat}`);
  });
  if (n === '01') {
    ok(Object.keys(X.paths || {}).sort().join() === 'hands-on,video', `01: PART.xapi.paths declares both learning paths`);
    ok(X.paths && items.video === X.paths.video.item && items['obs-intro'] === X.paths['hands-on'].item,
      `01: each path's item is the item of its first screen (video, obs-intro)`);
  }
  const reported = {};
  Object.keys(qs).forEach(k => {
    const q = qs[k], it = metaItems[q.item];
    ok(!!it && (it.questions || []).some(m => short(m.questionId) === q.q), `${n}: question ${q.item}/${q.q} (screen ${k}) in metadata`);
    ok(items[k] === q.item, `${n}: screen ${k} question item ${q.item} = its screen item ${items[k]}`);
    reported[q.item + '/' + q.q] = 1;
  });
  meta.subContent.forEach(it => (it.questions || []).forEach(m => {
    const key = short(it.id).split('-').pop() + '/' + short(m.questionId);
    const graded = (m.correctAnswers || []).length > 0;
    if (graded) ok(reported[key], `${n}: graded metadata question ${key} is reported (D-9)`);
    else ok(m.questionType === 'other', `${n}: ungraded question ${key} is "other" (silent by decision)`);
    const strs = JSON.stringify([m.answers, m.correctAnswers]);
    ok(!/\[,\]|\[\.\]|\[:\]/.test(strs), `${n}: no reserved delimiter in ${key} answers`);
  }));

  /* page contract */
  const html = rd(`${comp}/index.html`);
  const order = ['../unit-js/10-identity.js', '../unit-js/20-xapi.js', '../unit-js/25-report.js', '../unit-js/40-resume.js',
                 '../unit-js/50-loader.js', 'js/main.js', 'js/engine.js', '../unit-js/70-engine-bridge.js', '../unit-js/90-boot.js'];
  const srcs = [...html.matchAll(/<script src="([^"?]+)\?v=([^"]+)"/g)];
  const pos = order.map(f => srcs.findIndex(m => m[1] === f));
  ok(pos.every(p => p >= 0) && pos.every((p, i) => !i || p > pos[i - 1]), `${n}: script order ${order.join(' > ')}`);
  ok(srcs[srcs.length - 1] && srcs[srcs.length - 1][1] === '../unit-js/90-boot.js', `${n}: 90-boot.js is the last script`);
  const vs = new Set([...html.matchAll(/\?v=([\w-]+)"/g)].map(m => m[1]));
  ok(vs.size === 1, `${n}: one ?v= in the page (${[...vs].join(', ')})`);
  V = V || [...vs][0];
  ok(vs.has(V), `${n}: ?v= ${[...vs][0]} equals the other parts' (${V})`);
  ok(/href="\.\.\/unit-css\/25-report\.css\?v=/.test(html), `${n}: 25-report.css linked`);
  ok(/<div id="boot-cover"/.test(html), `${n}: boot cover`);
  const app = html.slice(html.indexOf('<div id="app">'), html.indexOf('</div><!-- /#app -->'));
  ['report-modal', 'report-thanks-modal', 'report-confirm-modal'].forEach(id =>
    ok(new RegExp(`<div id="${id}"[^>]*\\n\\s*class="report-modal-overlay"\\n\\s*hidden`).test(app.replace(/\r/g, '')), `${n}: #${id} inside #app, hidden`));
  ok(rd(`${comp}/js/engine.js`) === rd('shared/engine.js'), `${n}: js/engine.js = shared/engine.js`);
  ok(rd(`${comp}/css/engine.css`) === rd('shared/engine.css'), `${n}: css/engine.css = shared/engine.css`);
}

/* library letter */
const loader = rd('unit-js/50-loader.js');
const lib = /RESUME_ENABLED \? '(xapi-720-\w)\.js'/.exec(loader);
const re = /XAPI_USING_G = \/(.+?)\/\.test\(LIB720\)/.exec(loader);
ok(lib && lib[1] === 'xapi-720-l', 'loader: RESUME_ENABLED loads xapi-720-l.js (leave save, 14.11.26)');
ok(lib && re && new RegExp(re[1]).test(lib[1] + '.js'), 'loader: XAPI_USING_G regex matches the library it loads');
ok(re && new RegExp(re[1]).test('xapi-720-l.js'), 'loader: regex matches the _test stub name');
/* Hardening C1/C2 (14.11.26): every part raises __resumeInFlight inline on a registration= launch and
   preloads exactly the URLs 50-loader.js builds */
PARTS.forEach(n => {
  const h = rd(`${SLUG}-${n}/index.html`);
  ok(/if \(\/\[\?&\]registration=\/\.test\(location\.search\)\) window\.__resumeInFlight = true;/.test(h), `${n}: inline __resumeInFlight on registration=`);
  ok(h.includes('href="https://lomdot.education.gov.il/metodica/720active/common/xapiwrapper.min.js"') && h.includes('href="https://lomdot.education.gov.il/metodica/720active/common/xapi-720-l.js"') && h.includes('<link rel="preconnect" href="https://kata.cet.ac.il">'), `${n}: preload of xapiwrapper + xapi-720-l + Kata preconnect`);
});

/* rules over every shipped script */
const jsFiles = [...fs.readdirSync(path.join(ROOT, 'unit-js')).map(f => 'unit-js/' + f),
  ...PARTS.flatMap(n => fs.readdirSync(path.join(ROOT, `${SLUG}-${n}`, 'js')).map(f => `${SLUG}-${n}/js/${f}`))];
jsFiles.forEach(f => {
  const s = rd(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(!/window\.close\s*\(|window\.open\s*\(|CLOSE_LEARNING_MODULE|\balert\s*\(/.test(s), `${f}: no window.close / window.open / CLOSE_LEARNING_MODULE / alert`);
  ok(!/new YT\.Player\(\s*['"]/.test(s) && !/videoId\s*:/.test(s), `${f}: no YT.Player on a placeholder / videoId (D-1)`);
  ok(!/xapiZoneAnswer|xapiFieldsAnswer|xapiMultiAnswer/.test(s), `${f}: no retired 'id=value | …' response helpers`);
});
ok(/youtube-nocookie\.com\/embed\//.test(rd(`${SLUG}-01/js/main.js`)), '01: YouTube iframe built by the part (youtube-nocookie)');

/* 'selected' / learning-type on the CONFIRMED choice only (2026-11-02): setLearningPath runs on a card
   click, a toggle click and every path-screen entry, so the engine's onPath must not report; part 01's
   בחרתי and the toggle click call LOMDA_LMS.pathChosen -> xapiSelectedLearningType (every time, 2026-11-12) */
{
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const br = strip(rd('unit-js/70-engine-bridge.js')), xa = strip(rd('unit-js/20-xapi.js'));
  const onPath = (/onPath:\s*function[\s\S]*?\n  \},/.exec(br) || [''])[0];
  ok(onPath && !/sendStatement|xapiSelectedLearningType/.test(onPath), 'bridge: onPath saves the path but reports nothing');
  ok(/pathChosen:\s*function\s*\(p\)\s*\{\s*xapiSelectedLearningType\(p\);/.test(br), 'bridge: pathChosen reports through xapiSelectedLearningType');
  ok(/var XAPI_LEARNING_PATHS = _BX\.paths \|\| \{\};/.test(br), 'bridge: XAPI_LEARNING_PATHS comes from PART.xapi.paths');
  /* every confirmed choice / switch reports (2026-11-12, monday 13451706244): no once-per-path ledger */
  const sel = (/function xapiSelectedLearningType[\s\S]*?\n\}/.exec(xa) || [''])[0];
  ok(/XAPI_USING_G[\s\S]{0,300}?sendStatement720\('selected', 'onlinelesson', \{ response: p\.mediaFormat \}, \{ category: 'learning-type' \}\)/.test(sel)
    && !/sendStatementOnce|'picks'/.test(sel),
    '20-xapi: xapiSelectedLearningType sends directly on every call (no picks ledger), after the USING_G guard');
  const m01 = strip(rd(`${SLUG}-01/js/main.js`)), w01 = strip(rd(`${SLUG}-01/js/widgets.js`));
  ok(/onNext\(api\)\s*\{\s*if \(window\.LOMDA_LMS && window\.LOMDA_LMS\.pathChosen\) window\.LOMDA_LMS\.pathChosen\(window\.lomdaState\.learningPath\);/.test(m01),
    '01: path-select בחרתי (onNext) reports the chosen path');
  const tgl = (/t\.addEventListener\('click'[\s\S]*?\}\);/.exec(w01) || [''])[0];
  ok(/api\.setLearningPath\(p\)[\s\S]*?window\.LOMDA_LMS\.pathChosen\(p\)/.test(tgl), '01: the path toggle click reports the new path');
  ok(!/pathChosen/.test((/function twoOptionWire[\s\S]*?\n  \}/.exec(w01) || [''])[0]), '01: a card click (twoOptionWire) does not report');
}

/* Arabic build (as methodica-ar-science-mass-liquid-02 _test/verify-report.js §8). What a learner sees
   must be Arabic. Hebrew is allowed only in comments, console messages and REPORT_TYPE_LABELS (the
   value posted to the issue form every 720 unit shares); the learner sees REPORT_TYPE_DISPLAY. */
{
  const HEB = /[\u0590-\u05FF]/;
  const noBlock = s => s.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ''));
  const noLine = s => s.replace(/(^|[\s;{}(,])\/\/.*$/gm, '$1');
  const noHtml = s => s.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));
  const hebLines = (s, f) => s.split('\n').map((l, i) => [f + ':' + (i + 1), l]).filter(([, l]) => HEB.test(l)).map(([w, l]) => w + ' ' + l.trim().slice(0, 80));
  const code = s => noLine(noBlock(s));
  for (const p of PARTS) {
    const dir = `${SLUG}-${p}`;
    const html = rd(`${dir}/index.html`);
    ok(/<html lang="ar" dir="rtl">/.test(html), `${p}: index.html is lang="ar" dir="rtl"`);
    const heb = [].concat(
      hebLines(code(noHtml(html)), 'index.html'),
      hebLines(code(rd(`${dir}/js/main.js`)), 'main.js'),
      p === '01' ? hebLines(code(rd(`${dir}/js/widgets.js`)), 'widgets.js') : [],
      hebLines(noBlock(rd(`${dir}/css/style.css`)), 'style.css'));
    ok(heb.length === 0, `${p}: no Hebrew outside comments — ${heb.slice(0, 3).join(' | ')}`);
  }
  const eng = hebLines(code(rd('shared/engine.js')), 'engine.js').concat(hebLines(noBlock(rd('shared/engine.css')), 'engine.css'));
  ok(eng.length === 0, `shared engine: no Hebrew outside comments — ${eng.slice(0, 3).join(' | ')}`);
  ok(/<html lang="ar" dir="rtl">/.test(rd('index.html')) && !HEB.test(noHtml(rd('index.html'))), 'root index.html: Arabic');
  for (const f of fs.readdirSync(path.join(ROOT, 'unit-css'))) {
    const heb = hebLines(noBlock(rd(`unit-css/${f}`)), f);
    ok(heb.length === 0, `unit-css/${f}: no Hebrew outside comments — ${heb.slice(0, 3).join(' | ')}`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'unit-js'))) {
    const c = code(rd(`unit-js/${f}`))
      .replace(/console\.\w+\([\s\S]*?\);/g, '')
      .replace(/var REPORT_TYPE_LABELS = \{[\s\S]*?\};/, '')
      .replace(/\[׳’ʼ\]/g, '');   // _xapiNorm folds the Hebrew geresh — a character class, not text
    const heb = hebLines(c, f);
    ok(heb.length === 0, `unit-js/${f}: no Hebrew outside comments, console and REPORT_TYPE_LABELS — ${heb.slice(0, 3).join(' | ')}`);
  }
  const report = rd('unit-js/25-report.js');
  ok(/valSpan\.textContent = REPORT_TYPE_DISPLAY\[hidden\.value\]/.test(report) && /'technical':\s*'[\u0600-\u06FF]/.test(report.slice(report.indexOf('var REPORT_TYPE_DISPLAY'))),
    'report: the type dropdown shows REPORT_TYPE_DISPLAY (Arabic)');
  ok(/var REPORT_TYPE_LABELS = \{\s*'technical':\s*'[\u0590-\u05FF]/.test(report), 'report: REPORT_TYPE_LABELS (posted to the shared form) stays Hebrew');
  ok(!/Assistant/.test(noBlock(rd('unit-css/25-report.css') + rd('shared/engine.css'))), 'fonts: no Assistant font (Arabic build uses Calibri)');
  const xa = rd('unit-js/20-xapi.js');
  ok(/var _XAPI_BIDI = \/\[\\u061C\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF\]\/g;/.test(xa) && /s\.replace\(_XAPI_BIDI, ''\)/.test(xa),
    '20-xapi: _xapiNorm strips the invisible bidi marks (written as \\u escapes)');
  const m01 = rd(`${SLUG}-01/js/main.js`);
  ok(/hl=ar&/.test(m01) && !/hl[=:] ?'?he/.test(m01), '01: YouTube player language is Arabic (hl=ar)');
  ok(/onReady: \(\) => \{ keepTitle\(\);/.test(m01) && /onStateChange: e => \{\s*keepTitle\(\);/.test(m01), '01: the Arabic iframe title is re-applied on ready and on every state change');
  ok(/const VIDEO_YT = 'l3KqVtKepxA';/.test(m01) && /\{ t: 43,/.test(m01) && /\{ t: 86,/.test(m01) && /\{ t: 119,[^\n]*end: true/.test(m01), '01: Arabic video and its stops (0:43, 1:26, 1:59)');
  ok(/var NAV_EDGE_KEY = 'lomda_nav_edges::methodica-ar-science-mass-gas-01';/.test(rd('unit-js/40-resume.js')), 'resume: NAV_EDGE_KEY is the Arabic unit key');
  ok(/const LOMDA_ID = 'methodica-ar-science-mass-gas-01';/.test(rd('shared/engine.js')), 'engine: LOMDA_ID (storage namespace) is the Arabic unit key');
  const src = ['index.html', 'shared/engine.js', 'shared/index_dev.template.html', 'scripts/sync-shared.sh']
    .concat(fs.readdirSync(path.join(ROOT, 'unit-js')).map(f => `unit-js/${f}`))
    .concat(PARTS.flatMap(p => [`${SLUG}-${p}/index.html`, `${SLUG}-${p}/js/main.js`]));
  const heIds = src.filter(f => /methodica[-_]science[-_]mass[-_]gas|720active\/science\/mass-gas/.test(code(noHtml(rd(f)))));
  ok(heIds.length === 0, `identity: no Hebrew-unit slug or prefix left in code (outside comments) — ${heIds.join(', ')}`);
}

/* Kata patterns (2026-11-15, from the read-back after the draft create — _test/kata-patterns.json):
   for every question Kata grades, the response 20-xapi.js builds from the metadata's correctAnswers
   is one of Kata's correctXapiResponsesPattern strings (MOE runbook §3). Questions with an empty
   pattern (the ungraded open questions) are skipped. */
{
  const PATS = JSON.parse(rd('_test/kata-patterns.json'));
  let checked = 0;
  for (const p of PARTS) {
    const meta = JSON.parse(rd(`metadata/${SLUG}-${p}.json`));
    const ctx = { window: { METADATA: meta }, console: { warn() {}, log() {}, error() {} }, location: { search: '' }, URLSearchParams };
    ctx.window.window = ctx.window;
    vm.createContext(ctx);
    vm.runInContext('var window = this.window; var METADATA = window.METADATA; var XAPI_COMP_ID = METADATA.id; var XAPI_COMP_SLUG = ' + JSON.stringify(`${SLUG}-${p}`) + ';', ctx);
    vm.runInContext(rd('unit-js/20-xapi.js'), ctx);
    for (const it of meta.subContent || []) {
      const suffix = it.id.replace(/\/+$/, '').split('-').pop();
      for (const q of it.questions || []) {
        const qid = q.questionId.replace(/\/+$/, ''), pat = PATS[qid];
        ok(qid in PATS, `kata-patterns: ${qid} is in the Kata read-back`);
        if (!pat || !pat.length) continue;
        const ca = q.correctAnswers || [];
        const spec = q.questionType === 'choice' ? { choices: ca }
          : q.questionType === 'true-false' ? { value: ca[0] }
          : q.questionType === 'matching' ? { pairs: ca.map(c => ({ source: c.source, target: c.target })) }
          : { text: ca[0] };
        ctx.__a = [suffix, qid.split('/').pop(), spec];
        const r = vm.runInContext('xapiResponse(__a[0], __a[1], __a[2])', ctx);
        ok(pat.includes(r.response), `kata-patterns: ${p}-${suffix}/${qid.split('/').pop()} builds a Kata pattern — built ${JSON.stringify(r.response).slice(0, 80)}`);
        checked++;
      }
    }
  }
  ok(checked === 28, `kata-patterns: 28 graded questions checked (got ${checked})`);
}

/* labels */
const lab =cp.spawnSync(process.execPath, [path.join(ROOT, 'docs-and-tools', 'check-labels.js')], { encoding: 'utf8' });
const labBad = (lab.stdout || '').split('\n').filter(l => l.startsWith('✗'));
labBad.forEach(l => ok(false, 'labels: ' + l));
ok(lab.status === 0, 'labels: check-labels.js exits 0');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
