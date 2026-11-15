#!/usr/bin/env node
/* Score contract (MOE QA runbook §4 "ציון ומעבר") — 2026-11-09, fixes 1/2/4/5 of the 08.11 sheet.
   A part that promises "K of N" on its first screen (PART.xapi.threshold): success and score.scaled come
   from one count of those N questions (the harder ones never enter), success ⇔ scaled ≥ K/N, and below
   K the part ends at the gate — one component 'completed' success:false, the button disabled, the harder
   screens never reached — also after a reload with the ledger.

   Drives the real part in jsdom (its index.html scripts from disk, the CDN library replaced by an inline
   recorder), answering by clicks: right = the correct option, wrong = two wrong options (final wrong).
     mkdir -p /tmp/lomda-test && cd /tmp/lomda-test && npm install jsdom
     NODE_PATH=/tmp/lomda-test/node_modules node _test/score-contract.js
   Exit 1 on any failure. */
'use strict';
const fs = require('fs'), path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); } catch (e) { console.log('SKIPPED: jsdom not on NODE_PATH'); process.exit(0); }

const ROOT = path.resolve(__dirname, '..');
const SLUG = 'methodica-ar-science-mass-gas-01';
const CONTRACT = {
  '03': { K: 3, N: 4, threshold: ['q1', 'q2', 'q3', 'q4'], challenge: ['q5', 'q6'], gate: 'q4', next: 'basic-end' }
};
let fails = 0, passes = 0;
const ok = (cond, msg, detail) => { if (cond) passes++; else { fails++; console.log('✗ ' + msg + (detail ? '\n    -> ' + detail : '')); } };

function load(part, saved) {
  const dir = path.join(ROOT, SLUG + '-' + part);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const stripped = html.replace(/<script src="([^"]+)"><\/script>/g, '<!--script:$1-->').replace(/<script>[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(stripped, { runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'http://localhost:8765/' + SLUG + '-' + part + '/index.html?registration=SC-TEST' });
  const w = dom.window;
  for (const m of ['play', 'pause', 'load']) w.HTMLMediaElement.prototype[m] = function () { return m === 'play' ? Promise.resolve() : undefined; };
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  const errors = [];
  w.console.error = (...a) => errors.push(a.map(String).join(' '));
  w.addEventListener('error', (e) => errors.push('page error: ' + (e.error && e.error.stack || e.message)));
  /* the inline recorder standing in for the CDN library */
  const sent = []; let doc = saved ? JSON.parse(JSON.stringify(saved)) : null;
  w.XAPI_USING_G = true; w.xapiItemAnswered = {}; w.xapiCompletedObjects = {};
  w.METADATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', SLUG + '-' + part + '.json'), 'utf8').replace(/^﻿/, ''));
  w.sendStatement720 = (verb, type, result, ctx) => sent.push({ verb, result: result || null, ctx: ctx || null });
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
  return { w, sent, errors, doc: () => doc,
    comps: () => sent.filter((s) => s.verb === 'completed' && !(s.ctx && s.ctx.objectId)) };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const L = (w) => w.LOMDA;
async function start(r) {
  await tick();
  r.w.readUnitState(); r.w._resumeReady = true;
}
function click(w, el) { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); }
/* answer screen `key`: right → the correct option; wrong → two different wrong options */
function answer(r, key, right) {
  const w = r.w, api = L(w), n = api.indexOf(key), cfg = api.screens[n];
  api.goTo(n);
  const sec = w.document.getElementById('s' + n);
  const ids = [...sec.querySelectorAll('.q-opt')].map((o) => o.dataset.id);
  const picks = right ? [cfg.correct] : ids.filter((id) => id !== cfg.correct).slice(0, 2);
  for (const id of picks) {
    click(w, sec.querySelector('.q-opt[data-id="' + id + '"]'));
    click(w, w.document.getElementById('s' + n + '-check'));
  }
  return n;
}

(async () => {
  for (const part of Object.keys(CONTRACT)) {
    const C = CONTRACT[part];
    /* result for every count, with the harder set all right / all wrong */
    for (let k = 0; k <= C.N; k++) for (const chal of [false, true]) {
      const r = load(part); await start(r);
      C.threshold.forEach((key, i) => answer(r, key, i < k));
      C.challenge.forEach((key) => answer(r, key, chal));
      const res = r.w.xapiPartResult();
      const tag = part + ' result ' + k + '/' + C.N + (chal ? ' + harder right' : ' + harder wrong');
      ok(res.success === (k >= C.K), tag + ': success = correct ≥ ' + C.K, JSON.stringify(res));
      ok(Math.abs(res.score.scaled - Math.round(k / C.N * 10000) / 10000) < 1e-9, tag + ': scaled = correct / ' + C.N + ' (harder set not counted)', JSON.stringify(res));
      ok(res.success === (res.score.scaled >= C.K / C.N - 1e-9), tag + ': success ⇔ scaled ≥ K/N');
      ok(r.errors.length === 0, tag + ': no console.error', r.errors.slice(0, 2).join(' | '));
    }
    /* the gate, K−1 and K (runbook §4: one round with Y−1 correct, one with Y) */
    for (const k of [C.K - 1, C.K]) {
      const r = load(part); await start(r);
      let n = 0;
      C.threshold.forEach((key, i) => { n = answer(r, key, i < k); });
      const btn = r.w.document.getElementById('s' + n + '-check');
      click(r.w, btn);                                   // "שנמשיך?" on the gate question
      const at = L(r.w).current;
      const tag = part + ' gate ' + k + '/' + C.N;
      if (k < C.K) {
        click(r.w, btn);                                 // a second click on the stopped gate
        const comps = r.comps();
        ok(comps.length === 1, tag + ': exactly one completed for two clicks', String(comps.length));
        ok(comps[0] && comps[0].result.success === false && Math.abs(comps[0].result.score.scaled - k / C.N) < 1e-3,
           tag + ': completed success:false, scaled ' + (k / C.N), JSON.stringify(comps[0] && comps[0].result));
        ok(at === n, tag + ': stays on the gate screen, harder screens not shown', String(at));
        ok(btn.disabled && btn.getAttribute('aria-disabled') === 'true', tag + ': button disabled, aria-disabled');
        /* reload with the saved state document (the ledger + the answers) */
        const r2 = load(part, r.doc()); await start(r2);
        const st2 = r2.w.eval('_unitState');
        ok(!!(st2 && st2.payload) && r2.w.alreadySent('done', r2.w.currentPartSlug()), tag + ' resume: the saved document carries the payload and the ledger');
        r2.w.applyExecutionState(st2 && st2.payload, n);   // what 50-loader.js does on a platform launch
        const restored = C.threshold.filter((key) => { const q = r2.w.PART.xapi.questions[key]; return r2.w.XAPI_Q_RESULTS[q.item + '/' + q.q] === true; }).length;
        ok(restored === k && L(r2.w).current === n, tag + ' resume: answers and screen restored', restored + ' right @' + L(r2.w).current);
        const btn2 = r2.w.document.getElementById('s' + n + '-check');
        ok(btn2 && btn2.disabled, tag + ' resume: button disabled after a reload with the ledger', btn2 && btn2.textContent);
        click(r2.w, btn2); L(r2.w).advanceScreen();
        ok(r2.comps().length === 0 && L(r2.w).current === n, tag + ' resume: no second completed, still on the gate screen',
           r2.comps().length + ' @' + L(r2.w).current);
        ok(r2.errors.length === 0, tag + ' resume: no console.error', r2.errors.slice(0, 2).join(' | '));
      } else {
        ok(r.comps().length === 0 && at === L(r.w).indexOf(C.next), tag + ': no completed, continues to ' + C.next, r.comps().length + ' @' + at);
      }
      ok(r.errors.length === 0, tag + ': no console.error', r.errors.slice(0, 2).join(' | '));
    }
  }
  console.log('\n' + passes + ' passed, ' + fails + ' failed');
  process.exit(fails ? 1 : 0);
})();
