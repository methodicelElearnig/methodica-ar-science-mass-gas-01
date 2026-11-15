'use strict';
/* ═══════════════════ Engine bridge — the parts' side of the 720 platform layer ═══════════════════
   methodica-ar-science-mass-gas-01 (2026-11-01). The other units call the shared layer (20-xapi,
   40-resume, 50-loader) from per-screen script.js code and declare its per-part seams at the
   bottom of each script.js. This unit's six parts are driven by one data engine (js/engine.js,
   synced from shared/engine.js), so the seams and the call sites live here, once, and are derived
   from each part's own config:

     PART.xapi = {
       items:     { '<screen key>': '<item suffix>' | null },   every screen, in metadata/ terms
       questions: { '<screen key>': { item, q } },             the engine-graded questions
       pass:      0.6,                                         success threshold of the part
       threshold: { K, questions: [[keys]] }                   optional: the part's screen-1 promise
                                                               "K of N" — then the part result is
                                                               that count only (xapiPartResult)
       itemMirrorsPart: '<item>',                              optional: a single-item part whose
                                                               item result IS the part result
       paths: { '<path>': { item, mediaFormat } }             optional: the learning paths — each
     }                                                         path's item and that item's catalogue
                                                               mediaFormat, the 'selected' response

   Role in the other units' terms (cf. methodica-math-percent-05/unit-js/70-platform.js):
     • the seams     SCREEN_TO_SUBCONTENT, XAPI_COMP_SLUG/ID, XAPI_EVAL_ITEMS, XAPI_METADATA_FILE,
                     XAPI_ITEM_RESULT, TOTAL_SCREENS, currentScreen, goTo, resetScreenState
     • the call sites window.LOMDA_LMS — the engine calls it (lms(...) in js/engine.js) on every
                     screen change, graded attempt, opened hint, path choice and on the part's last
                     click; part code calls answered() / youtubeState() for its own widgets
     • the 4 hooks   capturePartPayload / applyResumeVars / applyResumeDom / restoreScreenUI, from
                     the engine's own learner-state snapshot (the one it already kept per tab)

   Loaded after js/engine.js (it needs window.LOMDA) and before ../unit-js/90-boot.js.
   result.response follows MOE 2026-10-19 (Documentation/MOE/דיוק ביישום תקן XAPI.docx): the
   engine hands over the picked OPTION INDEX, and 20-xapi.js emits the metadata string at that
   index byte for byte — so a line break or a tooltip in the on-screen label can never leak into
   the statement. docs-and-tools/check-labels.js asserts that the on-screen labels equal those
   metadata strings, in the same order. */

var _BP = window.PART;
var _BX = _BP.xapi || {};
var _BE = window.LOMDA;

var XAPI_COMP_SLUG     = 'methodica-ar-science-mass-gas-01-' + _BP.part;
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/' + XAPI_COMP_SLUG + '.json';
var XAPI_LEARNING_PATHS = _BX.paths || {};   /* read by 20-xapi.js xapiSelectedLearningType */
var TOTAL_SCREENS      = _BP.screens.length;

/* screen index -> [item suffix, page within the item]; null = no catalogue item */
var SCREEN_TO_SUBCONTENT = (function () {
  var map = {}, pages = {};
  _BP.screens.forEach(function (cfg, n) {
    var item = (_BX.items || {})[cfg.key];
    if (item === undefined) console.warn('[xAPI] screen "' + cfg.key + '" is missing from PART.xapi.items');
    if (!item) { map[n] = null; return; }
    pages[item] = (pages[item] || 0) + 1;
    map[n] = [item, pages[item]];
  });
  return map;
})();

/* B-2 hubs (20-xapi.js _xapiIsBackward, 2026-11-12): the first screen of each learning path. A switch on
   the path toggle into the earlier path is a lower screen, but it is a choice, not a Back: it must close
   the item it leaves, as before. */
var XAPI_HUB_SCREENS = {};
Object.keys(_BX.paths || {}).forEach(function (p) {
  var item = _BX.paths[p].item;
  for (var n = 0; n < TOTAL_SCREENS; n++) if (SCREEN_TO_SUBCONTENT[n] && SCREEN_TO_SUBCONTENT[n][0] === item) { XAPI_HUB_SCREENS[n] = 1; break; }
});

/* items that carry an engine- or widget-graded question */
var XAPI_EVAL_ITEMS = {};
Object.keys(_BX.questions || {}).forEach(function (k) { XAPI_EVAL_ITEMS[_BX.questions[k].item] = 1; });

/* Item results. 20-xapi.js's default scores an item over EVERY question its metadata declares; an
   item that mixes a graded question with an ungraded open one (01-002: q1 choice, q2 the
   hypothesis, "other") would then close at 0.5 / success false after a right answer. So each
   graded item is scored over its graded questions only (those with correctAnswers) — and a
   single-item part (05, 06) closes its item with the part's own verdict. */
var XAPI_ITEM_RESULT = {};
Object.keys(XAPI_EVAL_ITEMS).forEach(function (item) {
  XAPI_ITEM_RESULT[item] = function () {
    if (item === _BX.itemMirrorsPart) return xapiPartResult();
    var keys = _bGradedKeys().filter(function (k) { return k.split('/')[0] === item; });
    var answered = keys.filter(function (k) { return k in XAPI_Q_RESULTS; });
    if (!answered.length) return null;
    var ok = keys.filter(function (k) { return XAPI_Q_RESULTS[k] === true; }).length;
    return { success: ok === keys.length, score: { scaled: Math.round(ok / keys.length * 10000) / 10000 } };
  };
});

/* the globals 40-resume.js / 50-loader.js / 25-report.js read at call time */
Object.defineProperty(window, 'currentScreen', { get: function () { return _BE.current; }, configurable: true });
function goTo(n) { _BE.goTo(n, { noHistory: true }); }
function resetScreenState(n) {
  var el = document.getElementById('s' + n);
  if (el) _BE.fillCharSlots(el);   // the character was re-adopted from the state document
}

/* In a platform launch (a ?registration) the Kata state document is the learner's state; the
   engine then skips its per-tab sessionStorage copy. Without one (local run, CDN QA) nothing is
   captured, so the localStorage fallback document never moves the learner. */
function _bOwnsState() {
  return !!RESUME_ENABLED && /[?&]registration=/.test(window.location.search);
}

/* ── Scores ── every catalogue question that has a correct answer counts; success against the
   part's threshold. XAPI_Q_RESULTS (20-xapi.js) is the only source, the same truth the 'answered'
   statements carried. Unanswered = not correct. */
function _bGradedKeys() {
  var out = [];
  try {
    ((window.METADATA && window.METADATA.subContent) || []).forEach(function (it) {
      var item = String(it.id).replace(/\/+$/, '').split('-').pop();
      if (!XAPI_EVAL_ITEMS[item]) return;
      (it.questions || []).forEach(function (q) {
        if (q.correctAnswers && q.correctAnswers.length) out.push(item + '/' + shortId(q.questionId));
      });
    });
  } catch (e) {}
  if (!out.length) Object.keys(_BX.questions || {}).forEach(function (k) { out.push(_BX.questions[k].item + '/' + _BX.questions[k].q); });
  return out;
}
/* 2026-11-09 (08.11 sheet fixes 1, 2, 4): a part whose first screen promises "K of N" declares
   PART.xapi.threshold. success and score.scaled then come from one count of those N questions — a
   question counts once, and only when all its keys are right (decided 09.11) — and the harder
   questions after them keep their 'answered' but stay out of the part result. xapiGateStopped is the
   same count, for a part that stops below K (fix 5). */
function xapiThresholdCorrect() {
  return _BX.threshold.questions.filter(function (subs) {
    return subs.every(function (k) { return XAPI_Q_RESULTS[k] === true; });
  }).length;
}
function xapiGateStopped() {
  return !!_BX.threshold && xapiThresholdCorrect() < _BX.threshold.K;
}
function xapiPartResult() {
  var T = _BX.threshold;
  if (T) {
    var okT = xapiThresholdCorrect(), nT = T.questions.length;
    return { success: okT >= T.K, score: { scaled: Math.round(okT / nT * 10000) / 10000 } };
  }
  var keys = _bGradedKeys();
  var ok = keys.filter(function (k) { return XAPI_Q_RESULTS[k] === true; }).length;
  var scaled = keys.length ? ok / keys.length : 1;
  return { success: scaled >= (_BX.pass || 0.6), score: { scaled: Math.round(scaled * 10000) / 10000 } };
}

/* ── The part's last click ── a target outside the part (another part / the unit's end). */
function _bIsTerminal(n) {
  var nx = _BP.screens[n] && _BP.screens[n].next;
  return !!nx && (typeof nx === 'function' || !!(nx.part || nx.complete || nx.finish));
}
function _bEndButton(n) {
  var el = document.getElementById('s' + n);
  return document.getElementById('s' + n + '-check') || (el && el.querySelector('.btn-continue'));
}
/* D-8: a finished component's last button stays disabled — after a reload, or Back and forward
   again. The ledger decides (xapiComponentEnded), never the screen position. */
function _bPaintEnded(n) {
  if (!_bIsTerminal(n) || typeof xapiComponentEnded !== 'function' || !xapiComponentEnded()) return;
  var b = _bEndButton(n);
  if (b) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
}

/* The visible text of an option label (HTML) — only for the label check below. */
function _bPlain(html) {
  var d = document.createElement('div');
  d.innerHTML = String(html == null ? '' : html);
  d.querySelectorAll('.tip-btn').forEach(function (x) { x.remove(); });
  d.querySelectorAll('br').forEach(function (x) { x.replaceWith(' '); });
  return d.textContent.replace(/\s+/g, ' ').trim();
}

/* The engine's graded question -> the response spec: the picked option's INDEX (choice) and, for
   a true-false question, the boolean. 20-xapi.js picks the field the metadata questionType needs. */
function _bSpec(cfg, item, q) {
  var list = cfg.options || cfg.cards || [];
  var sel = _BE.qState(cfg.key).selected;
  var idx = -1;
  for (var i = 0; i < list.length; i++) if (list[i].id === sel) { idx = i; break; }
  try {
    var m = xapiQMeta(item, q);
    if (m.questionType === 'choice' && Array.isArray(m.answers) && idx >= 0) {
      var shown = _bPlain(list[idx].text != null ? list[idx].text : list[idx].label);
      if (_xapiNorm(shown) !== _xapiNorm(m.answers[idx]))
        console.warn('[xAPI] on-screen label differs from metadata answers[' + idx + ']', item, q, shown, '≠', m.answers[idx]);
    }
  } catch (e) {}
  return { choices: idx >= 0 ? [idx] : [], value: sel === 'true' };
}

window.LOMDA_LMS = {
  ownsState: _bOwnsState,
  partNavAllowed: function () { return !!DEV_NAV; },

  /* goTo tail (and the engine's own saves): item init/complete pairs, debounced state save */
  onScreen: function (n) {
    _bPaintEnded(n);
    try { xapiOnScreen(n); } catch (e) {}
    scheduleResumeSave();
  },
  onSave: function () { scheduleResumeSave(); },

  /* one graded attempt of an engine question */
  onAnswered: function (n, ok, isLast) {
    var cfg = _BP.screens[n], q = (_BX.questions || {})[cfg.key];
    if (!q) return;
    xapiAnswered(q.item, q.q, ok, isLast, _bSpec(cfg, q.item, q.q));
    flushResumeSave();
  },

  /* a widget's own graded answer (part 01 summary DnD): spec as 20-xapi.js xapiResponse takes it */
  answered: function (key, ok, isLast, spec) {
    var q = (_BX.questions || {})[key];
    if (!q) { console.warn('[xAPI] answered: no PART.xapi.questions["' + key + '"]'); return; }
    if (resumeIsPainting()) return;
    xapiAnswered(q.item, q.q, ok, isLast, spec);
    flushResumeSave();
  },

  onHint: function (n) {
    var q = (_BX.questions || {})[_BP.screens[n].key];
    if (q) xapiRequestedHint(q.item, q.q);
  },

  /* the engine's setLearningPath — a card click, a toggle click, and every entry into a path screen
     (toggleSync re-asserts the screen's own path): the path is state, so it is saved; it is NOT reported
     here (until 02.11.26 it was, so a learner who clicked both cards reported both) */
  onPath: function (p) {
    if (resumeIsPainting() || !p) return;
    flushResumeSave();
  },

  /* the learning-path choice CONFIRMED — part 01's בחרתי (path-select onNext) and the path toggle
     (js/widgets.js toggleSync): 'selected' / learning-type, every time (2026-11-12)
     (20-xapi.js xapiSelectedLearningType; guide §6.3a) */
  pathChosen: function (p) {
    xapiSelectedLearningType(p);
  },

  /* the part's last click: component 'completed' (pass or fail), button disabled; in a platform
     launch the engine stops here (false), under DEV_NAV it goes on to the next part as before */
  onPartEnd: function (n) {
    try { xapiEndComponent(xapiPartResult(), _bEndButton(n)); } catch (e) { console.error('[xAPI] part end', e); }
    flushResumeSave();
    return DEV_NAV ? undefined : false;
  },

  /* YouTube onStateChange -> played/paused on the item of the screen key */
  youtubeState: function (e, key) {
    var item = (_BX.items || {})[key];
    if (item) xapiYouTubeState(e, item);
  }
};

/* ── The four resume hooks (40-resume.js) ── */
function capturePartPayload() {
  if (!_bOwnsState()) return null;
  var n = _BE.current;
  return {
    currentScreen: n,
    key: _BP.screens[n] ? _BP.screens[n].key : null,
    snap: JSON.parse(JSON.stringify(_BE.snapshot())),
    xr: Object.assign({}, XAPI_Q_RESULTS)
  };
}
/* applyExecutionState calls this twice (around its goTo); the engine's goTo does not reset
   state, so the second call is skipped. The screen is re-resolved by KEY, so a part whose screens
   were reordered in a later version still lands on the same screen. */
var _bApplied = null;
function applyResumeVars(st) {
  if (!st || st === _bApplied) return;
  _bApplied = st;
  if (st.key) { var k = _BE.indexOf(st.key); if (k != null) st.currentScreen = k; }
  if (st.xr) {
    Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });
    Object.assign(XAPI_Q_RESULTS, st.xr);
  }
  _BE.restoreSnapshot(st.snap);
}
/* The engine paints every screen from its state on entry (qPaint, PART hooks' enter), so there is
   no separate DOM pass and no per-screen painter. */
function applyResumeDom(st) {}
function restoreScreenUI(n) { _bPaintEnded(n); }
