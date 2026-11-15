#!/usr/bin/env node
/* Back and path-switch reporting — 2026-11-12, two monday items:
   B (13454123722): a Back from a half-answered item must not send its 'completed'. Before the fix the
     Back closed the item with the failed result (success:false, scaled 0) and the doneItems ledger then
     swallowed the real 'completed' after the learner came back and answered right.
   T (13451706244): every confirmed path choice and every switch on the path toggle sends 'selected' /
     learning-type; video -> hands-on -> video used to send two (once-per-path ledger).

   Drives the real parts in jsdom (the score-contract.js loader: index.html scripts from disk, the CDN
   library replaced by an inline recorder), by clicks.
     mkdir -p /tmp/lomda-test && cd /tmp/lomda-test && npm install jsdom
     NODE_PATH=/tmp/lomda-test/node_modules node _test/back-and-path.js
   Exit 1 on any failure. */
'use strict';
const fs = require('fs'), path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('SKIPPED: jsdom not on NODE_PATH'); process.exit(0); }

const ROOT = path.resolve(__dirname, '..');
const SLUG = 'methodica-science-mass-gas-01';
const PARTS = ['01', '02', '03', '04', '05', '06'];
let fails = 0, passes = 0;
const ok = (cond, msg, detail) => { if (cond) passes++; else { fails++; console.log('✗ ' + msg + (detail ? '\n    -> ' + detail : '')); } };

function load(part) {
  const dir = path.join(ROOT, SLUG + '-' + part);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const stripped = html.replace(/<script src="([^"]+)"><\/script>/g, '<!--script:$1-->').replace(/<script>[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(stripped, { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'http://localhost:8765/' + SLUG + '-' + part + '/index.html?registration=BP-TEST' });
  const w = dom.window;
  for (const m of ['play', 'pause', 'load']) w.HTMLMediaElement.prototype[m] = function () { return m === 'play' ? Promise.resolve() : undefined; };
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  const errors = [];
  w.console.error = (...a) => errors.push(a.map(String).join(' '));
  w.addEventListener('error', (e) => errors.push('page error: ' + (e.error && e.error.stack || e.message)));
  const sent = []; let doc = null;
  w.XAPI_USING_G = true; w.xapiItemAnswered = {}; w.xapiCompletedObjects = {};
  w.METADATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', SLUG + '-' + part + '.json'), 'utf8').replace(/^﻿/, ''));
  w.sendStatement720 = (verb, type, result, ctx) => {
    if (verb.split('.')[0] === 'answered' && ctx && ctx.parentId) w.xapiItemAnswered[ctx.parentId] = true;   // as the library does
    sent.push({ verb, result: result || null, ctx: ctx || null });
  };
  w.loadState720 = () => doc;
  w.saveState720 = (id, o) => { doc = JSON.parse(JSON.stringify(o)); return true; };
  w.saveState720Debounced = (id, o) => { doc = JSON.parse(JSON.stringify(o)); };
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    const u = m[1];
    if (/^https?:/.test(u)) continue;
    const s = w.document.createElement('script');
    s.textContent = fs.readFileSync(path.join(dir, u.split('?')[0]), 'utf8') + '\n//# sourceURL=' + u;
    try { w.document.body.appendChild(s); } catch (e) { errors.push(u + ': ' + (e && e.stack || e)); }
  }
  const itemDone = (item) => sent.filter((s) => s.verb === 'completed' && s.ctx && s.ctx.objectId && /-(\d{3})\/?$/.exec(s.ctx.objectId) && /-(\d{3})\/?$/.exec(s.ctx.objectId)[1] === item);
  return { w, sent, errors, itemDone };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 0));
async function start(r) { await tick(); r.w.readUnitState(); r.w._resumeReady = true; }
function click(w, el) { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); }
function check(r, n, id) {
  const sec = r.w.document.getElementById('s' + n);
  click(r.w, sec.querySelector('.q-opt[data-id="' + id + '"]'));
  click(r.w, r.w.document.getElementById('s' + n + '-check'));
}

(async () => {
  /* ── B: wrong once -> Back -> nothing; return -> right -> forward -> exactly one completed, success:true ── */
  let covered = 0;
  for (const part of PARTS) {
    const probe = load(part); await start(probe);
    const api = probe.w.LOMDA, S2S = probe.w.SCREEN_TO_SUBCONTENT, EVAL = probe.w.XAPI_EVAL_ITEMS;
    const it = (n) => S2S[n] && S2S[n][0];
    const n = api.screens.findIndex((cfg, i) => i > 0 && i + 1 < api.screens.length && cfg.type === 'scq' && cfg.mode !== 'peak'
      && (cfg.attempts || 2) >= 2 && EVAL[it(i)] && it(i - 1) && it(i - 1) !== it(i) && it(i + 1) !== it(i));
    if (n < 0) continue;
    covered++; console.log('B: part ' + part + ', screen ' + api.screens[n].key);
    const r = load(part); await start(r);
    const L = r.w.LOMDA, cfg = L.screens[n], item = it(n), tag = part + ' B ' + cfg.key + ' (item ' + item + ')';
    const wrong = [...r.w.document.querySelectorAll('#s' + n + ' .q-opt')].map((o) => o.dataset.id).find((id) => id !== cfg.correct);
    L.goTo(n - 1); L.goTo(n);
    check(r, n, wrong);
    ok(r.w.XAPI_Q_RESULTS && Object.keys(r.w.XAPI_Q_RESULTS).some((k) => k.split('/')[0] === item), tag + ': the wrong first try is recorded');
    L.goBack();
    ok(L.current === n - 1, tag + ': Back goes to the previous screen', String(L.current));
    ok(r.itemDone(item).length === 0, tag + ': no completed on the Back', JSON.stringify(r.itemDone(item).map((s) => s.result)));
    L.goTo(n);
    check(r, n, cfg.correct);
    L.goTo(n + 1);
    const done = r.itemDone(item);
    ok(done.length === 1, tag + ': exactly one completed after the right answer and a forward move', String(done.length));
    ok(done[0] && done[0].result && done[0].result.success === true, tag + ': completed success:true', JSON.stringify(done[0] && done[0].result));
    ok(r.errors.length === 0, tag + ': no console.error', r.errors.slice(0, 2).join(' | '));
  }
  ok(covered >= 3, 'B covered in at least 3 parts', String(covered));

  /* ── T: בחרתי video -> toggle hands-on -> toggle video -> click the active tab: 3 selected, video / hands-on / video ── */
  {
    const r = load('01'); await start(r);
    const L = r.w.LOMDA, doc = r.w.document, tag = '01 T';
    const sel = () => r.sent.filter((s) => s.verb === 'selected');
    const toggle = (p) => click(r.w, doc.querySelector('#s' + L.current + ' .path-toggle__opt[data-path="' + p + '"]'));
    const ps = L.indexOf('path-select');
    L.goTo(ps);
    click(r.w, doc.querySelector('#s' + ps + ' .option-card[data-value="video"]'));
    ok(sel().length === 0, tag + ': a card click does not report');
    L.advanceScreen();                                         // בחרתי
    ok(L.current === L.indexOf('video'), tag + ': בחרתי goes to the video screen', String(L.current));
    toggle('hands-on'); await tick(400);
    ok(L.current === L.indexOf('obs-intro'), tag + ': the toggle goes to the hands-on path', String(L.current));
    ok(r.itemDone('006').length === 1, tag + ': the switch closes the video item (006)');
    toggle('video'); await tick(400);
    ok(L.current === L.indexOf('video'), tag + ': the toggle goes back to the video path', String(L.current));
    ok(r.itemDone('007').length === 1, tag + ': the switch to the earlier path still closes the hands-on item (007, hub)');
    toggle('video'); await tick(400);                          // the already-active tab
    const s = sel();
    ok(s.length === 3, tag + ': three selected (choice + two switches; the active tab adds none)', String(s.length));
    ok(JSON.stringify(s.map((x) => x.result && x.result.response)) === JSON.stringify(['video', 'interactive-content', 'video']),
      tag + ': responses video, interactive-content, video', JSON.stringify(s.map((x) => x.result && x.result.response)));
    ok(s.every((x) => x.ctx && x.ctx.category === 'learning-type'), tag + ': category learning-type');
    ok(r.errors.length === 0, tag + ': no console.error', r.errors.slice(0, 2).join(' | '));
  }

  console.log('\n' + passes + ' passed, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})();
