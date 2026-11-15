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
const SLUG = 'methodica-science-mass-gas-01';
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

/* labels */
const lab = cp.spawnSync(process.execPath, [path.join(ROOT, 'docs-and-tools', 'check-labels.js')], { encoding: 'utf8' });
const labBad = (lab.stdout || '').split('\n').filter(l => l.startsWith('✗'));
labBad.forEach(l => ok(false, 'labels: ' + l));
ok(lab.status === 0, 'labels: check-labels.js exits 0');

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
