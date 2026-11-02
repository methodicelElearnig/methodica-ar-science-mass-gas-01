'use strict';
/* ═══════════════════════════════════════════════════════════
   shared/engine.js — methodica-science-mass-gas-01 (Target 9, נפח של גז)
   SOURCE OF TRUTH for every part's js/engine.js — edit here, then run
   scripts/sync-shared.sh. Never edit a part's copy directly.

   A part page provides `window.PART` (js/main.js) *before* this file:
     PART = {
       part: '02',                        // this part's number
       screens: [ {key, type, ...}, … ],  // ordered screen configs
       series:  { std1: {keys:[…], mode:'scored'|'peak'} },
       media:   { characters: {pose: {'character-1': src, …}} },
       hooks:   { [key]: {enter(el,api), render(cfg)->html} }  // custom screens
     }
   Screen types rendered here: transition · scq · peak-feedback · content ·
   html (custom markup string / hook). Each renders into a
   <section class="screen" id="sN" data-screen="N" data-key="key">.

   Architecture ported from Target 6 (session route stack, #last, DEV
   bridge, popup system, zoom, nav-label reservation) with the fixes the
   planning audit called for: namespaced+validated character key, one
   data-driven question controller instead of per-screen copies, route
   replay on forward re-cross, deep links by screen key, final-frame hold
   for decorative video (no seek-to-0).
   ═══════════════════════════════════════════════════════════ */
(function () {
  const LOMDA_ID = 'methodica-science-mass-gas-01';
  const NS = LOMDA_ID + ':';
  const PART = window.PART;
  const THIS_PART = LOMDA_ID + '-' + PART.part;
  const SCREENS = PART.screens;
  const KEY_TO_INDEX = {};
  SCREENS.forEach((s, i) => { KEY_TO_INDEX[s.key] = i; });

  /* ─── Storage helpers (never throw) ─────────────────────── */
  const store = {
    get(area, k, dflt) { try { const v = window[area].getItem(NS + k); return v === null ? dflt : JSON.parse(v); } catch (e) { return dflt; } },
    set(area, k, v)    { try { window[area].setItem(NS + k, JSON.stringify(v)); } catch (e) {} },
    del(area, k)       { try { window[area].removeItem(NS + k); } catch (e) {} }
  };

  /* ─── Companion character (cross-part, localStorage) ─────── */
  const CHARACTERS = ['character-1', 'character-2'];
  function getCharacter() {
    const v = store.get('localStorage', 'selectedCharacter', null);
    return CHARACTERS.includes(v) ? v : 'character-1';
  }
  function setCharacter(id) {
    if (CHARACTERS.includes(id)) store.set('localStorage', 'selectedCharacter', id);
    window.lomdaState.selectedCharacter = getCharacter();
  }
  function charSrc(pose) {
    const map = (PART.media && PART.media.characters) || {};
    const ch = getCharacter();
    return (map[pose] && map[pose][ch]) || (map.default && map.default[ch]) || '';
  }
  function isVideo(src) { return /\.(mp4|webm|mov)(\?|$)/i.test(src); }
  function charMediaHtml(pose, extraCls, loop) {
    return '<div class="char-slot ' + (extraCls || '') + '" data-pose="' + pose + '"' + (loop ? ' data-loop="1"' : '') + '></div>';
  }
  /* Decorative media contract: autoplay once, muted, no loop, no controls,
     hold the final frame (no seek back to 0 — prohibited by 720-templates).
     Exception: a slot with data-loop (screen cfg `loop: true`) loops. */
  function fillCharSlots(root) {
    root.querySelectorAll('.char-slot').forEach(slot => {
      const src = charSrc(slot.dataset.pose);
      if (!src) { slot.innerHTML = ''; return; }
      if (slot.dataset.src === src) {
        const v = slot.querySelector('video');
        if (v) { try { v.currentTime = 0; } catch (e) {} v.play().catch(() => {}); }
        return;
      }
      slot.dataset.src = src;
      slot.innerHTML = isVideo(src)
        ? '<video class="char-media" src="' + src + '" autoplay' + (slot.dataset.loop ? ' loop' : '') + ' muted playsinline disablepictureinpicture disableremoteplayback controlsList="nodownload noremoteplayback nofullscreen noplaybackrate" aria-hidden="true"></video>'
        : '<img class="char-media" src="' + src + '" alt="" aria-hidden="true">';
    });
  }

  /* ─── Global learner state ──────────────────────────────── */
  window.lomdaState = window.lomdaState || {};
  window.lomdaState.selectedCharacter = getCharacter();
  window.lomdaState.learningPath = store.get('sessionStorage', 'learningPath', null);

  /* ─── Cross-part route stack (sessionStorage, T6 pattern + screen key) ─
     Each forward hop pushes {part, key} of the screen being left; Back on
     this part's entry screen pops it and lands on exactly that screen. */
  const STACK_K = 'navStack';
  const stackRead  = () => { const a = store.get('sessionStorage', STACK_K, []); return Array.isArray(a) ? a : []; };
  const stackWrite = a => store.set('sessionStorage', STACK_K, a);
  /* Every cross-part hop carries the launch query verbatim (?slxapi,
     ?registration, QA flags…) — the platform identifies the session by it. */
  function partUrl(slug, screenKey) {
    return '../' + slug + '/index.html' + window.location.search + (screenKey ? '#screen=' + screenKey : '');
  }
  function goToPart(partNum, screenKey) {
    const st = stackRead();
    st.push({ part: THIS_PART, key: SCREENS[currentScreen].key });
    stackWrite(st);
    store.set('sessionStorage', 'entry:' + partNum, screenKey || null);
    store.set('sessionStorage', 'arrival', 'forward');   // A16: a forward arrival starts a fresh Back trail
    saveState();
    window.location.href = partUrl(LOMDA_ID + '-' + partNum, screenKey);
  }
  function hasPrevPart() { return stackRead().length > 0; }
  function goToPrevPart() {
    const st = stackRead();
    const prev = st.pop();
    if (!prev) return;
    stackWrite(st);
    store.set('sessionStorage', 'arrival', 'back');      // A16: keep the restored Back trail
    saveState();
    window.location.href = partUrl(prev.part, prev.key);
  }

  /* Recorded branch destinations — re-crossing a resolved boundary forward
     replays the recorded target instead of re-evaluating on cold state
     (_global-components → Back navigation in a branched journey). */
  function routeReplay(key, compute) {
    const k = 'route:' + PART.part + ':' + key;
    const rec = store.get('sessionStorage', k, null);
    if (rec) return rec;
    const t = compute();
    if (t && t.part) store.set('sessionStorage', k, t);   // only cross-part edges are replayed
    return t;
  }

  /* ─── Scale — fixed-centred letterbox (decision B7) ──────── */
  let appScale = 1;
  function scaleApp() {
    const app = document.getElementById('app');
    appScale = Math.min(window.innerWidth / 1280, window.innerHeight / 710);
    app.style.transform = 'scale(' + appScale + ')';
    app.style.left = Math.round((window.innerWidth - 1280 * appScale) / 2) + 'px';
    app.style.top  = Math.round((window.innerHeight - 710 * appScale) / 2) + 'px';
    /* Letterbox side margin in canvas px — the bottom bar bleeds into it (engine.css --side-ext) */
    app.style.setProperty('--side-ext', Math.max(0, (window.innerWidth / appScale - 1280) / 2) + 'px');
    /* Letterbox top/bottom margin in canvas px — modal backdrops bleed into it (engine.css --top-ext) */
    app.style.setProperty('--top-ext', Math.max(0, (window.innerHeight / appScale - 710) / 2) + 'px');
  }

  /* ─── Text helpers ──────────────────────────────────────── */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  /* Content strings may carry authored inline markup (<b>, tooltip spans)
     — they are authored in main.js, never learner input. */
  const paras = (arr, cls) => (arr || []).map(t => '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + t + '</p>').join('');

  /* ═══════════════════════════════════════════════════════════
     RENDERERS
     ═══════════════════════════════════════════════════════════ */
  const FLAG_HTML = '';   // flag button lives once in #app (index.html)

  function backBtn(i, cls) {
    return '<button class="scq-back ' + (cls || '') + '" type="button" data-act="back" id="s' + i + '-back">عودة</button>';
  }

  function renderTransition(cfg, i) {
    const lines = (cfg.lines || []).map(l => {
      const tag = l.role === 'title' ? 'h1' : 'p';
      return '<' + tag + ' class="tr-' + l.role + '">' + l.text + '</' + tag + '>';
    }).join('');
    const bubble = cfg.bubble ? '<div class="bubble ' + (cfg.bubbleCls || '') + '">' + paras([].concat(cfg.bubble)) + '</div>' : '';
    const media = cfg.pose ? '<div class="tr-media-wrap" data-reveal="2" data-reveal-fade><div class="tr-media-clip">' + charMediaHtml(cfg.pose, '', cfg.loop) + '</div>' + bubble + '</div>' : '';
    return '<div class="tr-content"><div class="tr-text" data-reveal="1">' + lines + '</div>' + media + '</div>' +
      '<button class="btn-continue" type="button" data-act="' + (cfg.act || 'next') + '">' + (cfg.button || 'متابعة') + '</button>' +
      (cfg.noBack ? '' : backBtn(i, 'btn-back-abs'));
  }

  function renderProgress(seriesKey) {
    const ser = PART.series[seriesKey];
    let h = '<nav class="progress-question" aria-label="التنقل بين الأسئلة" data-series="' + seriesKey + '">';
    ser.keys.forEach((k, idx) => {
      if (idx) h += '<div class="progress-question__connector" data-connector="' + idx + '"></div>';
      h += '<div class="progress-question__item" data-question="' + (idx + 1) + '"><div class="progress-question__icon"></div>' +
           '<span class="progress-question__label">سؤال ' + (idx + 1) + '</span></div>';
    });
    return h + '</nav>';
  }

  function renderImage(cfg) {
    const im = cfg.image;
    if (!im) return '';
    const bubbles = (cfg.bubbles || []).map(b =>
      '<div class="bubble ' + (b.cls || '') + '" style="left:' + b.x + '%;top:' + b.y + '%;width:' + b.w + '%">' + paras([].concat(b.text)) + '</div>').join('');
    const variant = cfg.bubbles ? 'scq-img--bubbles' : 'scq-img--std';
    /* image.video — decorative muted loop in the media slot (no zoom). */
    if (im.video) return '<div class="scq-img ' + variant + ' scq-img--video" data-reveal="2"><div class="scq-img-inner">' +
      '<video src="' + im.video + '"' + (im.src ? ' poster="' + im.src + '"' : '') + ' autoplay muted loop playsinline disablepictureinpicture' +
      ' aria-label="' + esc(im.alt || '') + '"></video></div>' + bubbles + '</div>';
    return '<div class="scq-img ' + variant + '" data-reveal="2"><div class="scq-img-inner">' +
      '<img src="' + im.src + '" alt="' + esc(im.alt || '') + '">' +
      '<button class="img-zoom-btn" type="button" data-zoom-src="' + im.src + '" aria-label="تكبير الصورة">' +
      '<svg class="img-zoom-btn__icon" viewBox="0 0 20.7149 20.9231" fill="none"><path d="M8 1C11.8661 1 15 4.13371 15 7.99902C15 11.8643 11.8661 14.998 8 14.998C4.1339 14.998 1 11.8643 1 7.99902C1 4.13371 4.13389 1 8 1Z" stroke="currentColor" stroke-width="2"/><path d="M12.6221 14.188L14.2657 12.6141L19.928 18.5274C20.3626 18.9813 20.347 19.7016 19.8931 20.1362C19.4392 20.5708 18.7189 20.5552 18.2843 20.1013L12.6221 14.188Z" fill="currentColor"/></svg>' +
      '</button></div>' + bubbles + '</div>';
  }

  function renderScq(cfg, i) {
    /* nav:false — series is scored but shows no Progress Question nav
       (peak: sub-parts א/ב/ג/ד are one question, never counted as items). */
    const progress = cfg.series && PART.series[cfg.series].nav !== false ? renderProgress(cfg.series) : '';
    const title = cfg.title ? '<p class="scq-title">' + cfg.title + '</p>' : '';
    const body = paras(cfg.body, 'scq-body' + (cfg.dense ? ' scq-body--dense' : ''));
    const table = cfg.table ? '<table class="q-table"><thead><tr>' + cfg.table.head.map(h => '<th>' + h + '</th>').join('') +
      '</tr></thead><tbody>' + cfg.table.rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>' : '';
    let answers;
    if (cfg.cards) {
      /* Speech-bubble variant: a card with `bubble: {x, y, w, cls}` shows its
         label as a bubble positioned (px) relative to the card, plus a radio dot. */
      const bubbled = cfg.cards.some(c => c.bubble);
      const px = v => typeof v === 'number' ? v + 'px' : v;   /* numbers = px; strings pass through ('50%', 'max-content') */
      answers = '<div class="icq-cards' + (bubbled ? ' icq-cards--bubbles' : '') + '" role="radiogroup">' + cfg.cards.map(c =>
        '<button class="icq-card q-opt" type="button" role="radio" aria-checked="false" data-id="' + c.id + '">' +
        '<span class="icq-card-frame"><img src="' + c.img + '" alt="' + esc(c.label) + '"></span>' +
        (c.bubble
          ? '<span class="icq-radio" aria-hidden="true"></span><span class="bubble icq-bubble ' + (c.bubble.cls || '') +
            '" style="left:' + px(c.bubble.x) + ';top:' + px(c.bubble.y) + ';width:' + px(c.bubble.w || 'max-content') + '">' + c.label + '</span>'
          : '<span class="icq-card-label">' + c.label + '</span>') +
        '</button>').join('') + '</div>';
      const inner = '<div class="icq-content"><div class="icq-header" data-reveal="1">' + title + body + '</div>' + answers + '</div>';
      return progress + inner + renderBar(cfg, i) + renderPopup(i) + renderHint(cfg, i);
    }
    if (cfg.dropdown) {
      /* DropdownQuestion — single blank inside a sentence (720-templates
         DropdownQuestion.md, single variant). Options are .q-opt so the
         shared controller handles select/check/attempts/feedback. */
      const d = cfg.dropdown;
      const dd = '<span class="dq-dropdown-wrap"><button class="dq-btn" type="button" data-empty="true" aria-haspopup="listbox" aria-expanded="false" data-act="dq-toggle">' +
        '<span class="dq-selected">' + (d.placeholder || 'اختاروا إجابة') + '</span>' +
        '<svg class="dq-chevron" width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true"><path d="M1 1l7 6 7-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<ul class="dq-list hidden" role="listbox">' + cfg.options.map(o => '<li class="dq-option q-opt" role="option" tabindex="0" data-id="' + o.id + '">' + o.text + '</li>').join('') + '</ul></span>';
      /* <div>, not <p>: a <ul> inside a <p> makes the parser close the paragraph early */
      const sentence = '<div class="dq-sentence">' + d.before + dd + d.after + '</div>';
      return '<div class="scq-question scq-question--text"' + (cfg.series ? '' : ' style="top:' + (cfg.top || 96) + 'px"') + '><div class="scq-textcol"><div class="scq-qtext" data-reveal="1">' + title + body + '</div>' + sentence + '</div></div>' +
        (cfg.extraHtml || '') + renderBar(cfg, i) + renderPopup(i) + renderHint(cfg, i);
    }
    const opts = cfg.options.map(o =>
      '<button class="scq-opt q-opt" type="button" role="radio" aria-checked="false" data-id="' + o.id + '">' +
      '<span class="scq-radio"></span><span class="scq-opt-text">' + o.text + '</span></button>').join('');
    /* TrueFalseQuestion (Figma 4827:28896): statement and the two 128px
       pills share one row — statement at the reading start (right). */
    answers = cfg.statement
      ? '<div class="tf-row" data-reveal="2"><p class="tf-statement" id="s' + i + '-tf">' + cfg.statement + '</p>' +
        '<div class="scq-answers tf-answers" role="radiogroup" aria-labelledby="s' + i + '-tf">' + opts + '</div></div>'
      : '<div class="scq-answers' + (cfg.inline ? ' scq-answers--inline' : '') + '" role="radiogroup" data-reveal="3">' + opts + '</div>';
    /* tableSlot:'media' — the data table sits in the media column (SCQImage
       layout), as the PPTX places it (slide 57: table left, stem right). */
    const tableInMedia = cfg.table && cfg.tableSlot === 'media';
    const textCol = '<div class="scq-textcol"><div class="scq-qtext" data-reveal="1">' + title + body + (tableInMedia ? '' : table) + '</div>' + answers + '</div>';
    const media = tableInMedia ? '<div class="scq-img scq-img--table" data-reveal="2">' + table + '</div>' : renderImage(cfg);
    const qCls = ((cfg.image || tableInMedia) ? 'scq-question' : 'scq-question scq-question--text') + (cfg.statement ? ' scq-question--tf' : '');
    const top = cfg.series ? '' : ' style="top:' + (cfg.top || 72) + 'px"';
    return progress + '<div class="' + qCls + '"' + top + '>' + media + textCol + '</div>' +
      (cfg.extraHtml || '') + renderBar(cfg, i) + renderPopup(i) + renderHint(cfg, i);
  }

  function renderBar(cfg, i) {
    const hint = cfg.hint
      ? '<button class="scq-hint" type="button" data-act="hint" id="s' + i + '-hint"><span>هل يمكنني الحصول على تلميح؟</span>' +
        '<img class="scq-hint-ico" src="assets/img/icon-idea-blue.svg" alt=""></button>' : '';
    return '<div class="scq-bar"><div class="scq-bar-main">' +
      '<button class="scq-check" type="button" data-act="check" id="s' + i + '-check" disabled>هل إجابتي صحيحة؟</button>' + hint +
      '</div>' + backBtn(i) + '</div>';
  }
  function renderPopup(i) {
    return '<div class="scq-popup m-popup hidden" id="s' + i + '-popup" role="status" aria-live="polite">' +
      '<div class="scq-popup-header"><div class="scq-popup-title" id="s' + i + '-popup-title"></div></div>' +
      '<div class="scq-popup-body" id="s' + i + '-popup-body"></div></div>';
  }
  function renderHint(cfg, i) {
    if (!cfg.hint) return '';
    /* A hint that opens with a bold line uses that line as its title (in
       place of the default "רמז") — the same treatment as slide 23. */
    let title = cfg.hint.title, body = [].concat(cfg.hint.body || []);
    const lead = !title && /^<b>([^<]*)<\/b>$/.exec((body[0] || '').trim());
    if (lead) { title = lead[1]; body = body.slice(1); }
    const leadCls = (title ? ' scq-hint-popup--lead' : '') + ((cfg.hint.plain || (title && !body.length)) ? ' scq-hint-popup--plain' : '');   // one-line hint: regular weight
    return '<div class="scq-hint-overlay hidden" id="s' + i + '-hint-overlay" data-hint-backdrop>' +
      '<div class="scq-hint-popup' + leadCls + '" role="dialog" aria-modal="true" ' +
      (title ? 'aria-labelledby="s' + i + '-hint-title"' : 'aria-label="تلميح"') + '>' +
      '<div class="scq-hint-content"><div class="scq-hint-text">' +
      (title ? '<p class="scq-hint-title" id="s' + i + '-hint-title">' + title + '</p>'
             : '<p class="scq-hint-title scq-hint-title--icon" aria-hidden="true"></p>') +   // no title: bulb only, no "רמז" word
      (body.length ? '<div class="scq-hint-body">' + paras(body) + '</div>' : '') + '</div></div>' +
      '<button class="scq-hint-close" type="button" data-act="hint-close">عودة إلى السؤال</button></div></div>';
  }

  function renderPeakFeedback(cfg, i) {
    const v = cfg.variants;
    const block = (name, d) =>
      '<div class="pf-wrap pf-variant hidden" data-variant="' + name + '">' +
      '<div class="pf-char"><div class="bubble bubble--tail-left">' + paras([d.bubble]) + '</div>' + charMediaHtml(d.pose) + '</div>' +
      '<div class="pf-card pf-card--' + name + '"><p class="pf-title">' + d.title.join('<br>') + '</p>' +
      cfg.items.map(it => '<div class="pf-item"><p class="pf-item-head">' + it.head + '</p>' + paras(it.body, 'pf-item-body') + '</div>').join('') +
      '</div></div>';
    return block('success', v.success) + block('partial', v.partial) +
      '<button class="btn-continue" type="button" data-act="next">متابعة</button>' + backBtn(i, 'btn-back-abs');
  }

  function renderContent(cfg, i) {
    return (PART.hooks[cfg.key] && PART.hooks[cfg.key].render ? PART.hooks[cfg.key].render(cfg, api) : (cfg.html || '')) +
      (cfg.noContinue ? '' : '<button class="btn-continue" type="button" data-act="next"' + (cfg.gated ? ' disabled' : '') + '>' + (cfg.button || 'متابعة') + '</button>') +
      (cfg.noBack ? '' : backBtn(i, 'btn-back-abs'));
  }

  const RENDER = { transition: renderTransition, scq: renderScq, 'peak-feedback': renderPeakFeedback, content: renderContent };

  function buildScreens() {
    const app = document.getElementById('app');
    const anchor = document.getElementById('screens-anchor');
    SCREENS.forEach((cfg, i) => {
      const sec = document.createElement('section');
      sec.className = 'screen' + (cfg.cls ? ' ' + cfg.cls : '');
      sec.id = 's' + i;
      sec.dataset.screen = i;
      sec.dataset.key = cfg.key;
      sec.innerHTML = (RENDER[cfg.type] || renderContent)(cfg, i);
      app.insertBefore(sec, anchor);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     QUESTION CONTROLLER (SingleChoiceQuestion family)
     modes: 'scored' (practice) · 'ungraded' (warm-up, still gives
     feedback) · 'peak' (records silently, feedback deferred).
     ═══════════════════════════════════════════════════════════ */
  const Q = {};            // key → runtime state
  function qState(key) {
    return Q[key] || (Q[key] = { selected: null, attempts: 0, lastWrong: null, done: false, correct: null, recorded: null });
  }
  const RETRY = { bg: '#ffdbdc', title: ['الإجابة غير صحيحة.'], body: ['هل نحاول مرة أخرى؟'] };

  function qEl(i) { return document.getElementById('s' + i); }
  function qOpts(i) { return qEl(i).querySelectorAll('.q-opt'); }

  function qPaint(i) {
    const cfg = SCREENS[i], st = qState(cfg.key), peak = cfg.mode === 'peak';
    const peakLocked = peak && peakState().submitted;
    /* After a peak submit the scored answer (recorded) is what is shown. */
    const sel = peakLocked ? st.recorded : st.selected;
    qOpts(i).forEach(o => {
      const id = o.dataset.id;
      o.classList.remove('selected', 'correct', 'wrong');
      const showMarks = (!peak && st.done) || peakLocked;
      if (showMarks) {
        if (id === cfg.correct) o.classList.add('correct');
        else if (id === sel) o.classList.add('wrong');
      } else if (!peak && st.lastWrong && id === st.lastWrong && id === st.selected) {
        o.classList.add('wrong');
      } else if (id === sel) o.classList.add('selected');
      o.setAttribute('aria-checked', id === sel ? 'true' : 'false');
      o.disabled = (!peak && st.done) || peakLocked;
    });
    if (cfg.dropdown) {
      const btn = qEl(i).querySelector('.dq-btn');
      const shown = st.done && !st.correct ? cfg.correct : st.selected;   // final wrong → solution shown in the blank
      const opt = cfg.options.find(o => o.id === shown);
      btn.querySelector('.dq-selected').textContent = opt ? opt.text : (cfg.dropdown.placeholder || 'اختاروا إجابة');
      btn.dataset.empty = opt ? 'false' : 'true';
      btn.classList.toggle('dq-correct', st.done);
      btn.classList.toggle('dq-wrong', !st.done && !!st.lastWrong && st.lastWrong === st.selected);
      btn.disabled = st.done;
      if (st.done && !btn.querySelector('.dq-check-ico')) btn.insertAdjacentHTML('beforeend', '<span class="dq-check-ico" aria-hidden="true"></span>');
      if (!st.done) btn.querySelector('.dq-check-ico')?.remove();
      btn.querySelector('.dq-chevron').style.display = st.done ? 'none' : '';
    }
    const chk = document.getElementById('s' + i + '-check');
    if (peak) {
      const recordedHere = st.recorded !== null && st.recorded === st.selected;
      chk.textContent = (recordedHere || peakLocked) ? 'متابعة' : 'هل إجابتي صحيحة؟';
      chk.disabled = !(recordedHere || peakLocked || st.selected);
      /* B1: an unconfirmed change to a recorded answer blocks leaving */
      const back = document.getElementById('s' + i + '-back');
      if (back) back.disabled = peakDirty(i);
    } else if (st.done) {
      chk.textContent = cfg.doneLabel || 'متابعة'; chk.disabled = false;   // e.g. 'סיימתי' on the last peak section
      /* B2: a resolved routing question with no target ends the unit here */
      const endsHere = typeof cfg.next === 'function' && !cfg.next(cfg.series ? seriesScore(cfg.series) : null, api);
      chk.style.visibility = endsHere ? 'hidden' : '';
    } else {
      chk.textContent = 'هل إجابتي صحيحة؟';
      chk.disabled = !st.selected || st.selected === st.lastWrong;
    }
    const hint = document.getElementById('s' + i + '-hint');
    if (hint) {
      const avail = cfg.hintPolicy === 'always' || st.attempts > 0;
      hint.style.visibility = (avail && !st.done && !peakLocked) ? 'visible' : 'hidden';
    }
  }

  function qSelect(i, id) {
    const cfg = SCREENS[i], st = qState(cfg.key);
    if (cfg.mode === 'peak') { if (peakState().submitted) return; }
    else if (st.done) return;
    if (cfg.mode !== 'peak') dismissRetry(i);
    st.selected = id;
    qPaint(i);
    saveState();
  }

  function qCheck(i) {
    const cfg = SCREENS[i], st = qState(cfg.key);
    if (cfg.mode === 'peak') return peakCheck(i);
    if (st.done) return advanceScreen();
    if (!st.selected) return;
    st.attempts++;
    const ok = st.selected === cfg.correct;
    const max = cfg.attempts || 2;
    if (ok || st.attempts >= max) {
      st.done = true; st.correct = ok;
      showPopup(i, ok ? cfg.feedback.correct : cfg.feedback.final, ok ? '#edf8ed' : '#ffdbdc');
      closeHint(i);
      if (PART.onResolve) PART.onResolve(cfg, st, api);
    } else {
      st.lastWrong = st.selected;
      showPopup(i, RETRY, RETRY.bg);
    }
    qPaint(i);
    syncProgress(i);
    saveState();
  }

  function qEnter(i) {
    qPaint(i);
    syncProgress(i);
    qEl(i).querySelectorAll('.dq-list').forEach(l => l.classList.add('hidden'));
    const cfg = SCREENS[i], st = qState(cfg.key);
    if (cfg.mode !== 'peak' && st.done) {
      showPopup(i, st.correct ? cfg.feedback.correct : cfg.feedback.final, st.correct ? '#edf8ed' : '#ffdbdc');
    }
  }

  /* ─── Feedback popup (draggable, no close; T6 system) ─── */
  function showPopup(i, fb, bg) {
    const p = document.getElementById('s' + i + '-popup');
    if (!p || !fb) return;
    p.style.background = bg || fb.bg;
    resetPopupPosition(p);
    document.getElementById('s' + i + '-popup-title').innerHTML = paras(fb.title);
    document.getElementById('s' + i + '-popup-body').innerHTML = paras(fb.body);
    p.classList.remove('hidden');
  }
  function dismissRetry(i) {
    const cfg = SCREENS[i], st = qState(cfg.key);
    if (st.done) return;
    const p = document.getElementById('s' + i + '-popup');
    if (!p || p.classList.contains('hidden')) return;
    if (window.Motion && Motion.dismissPopup) Motion.dismissPopup(p); else p.classList.add('hidden');
  }
  function resetPopupPosition(p) { p.style.left = ''; p.style.top = 'auto'; p.style.bottom = '76px'; }   /* left: engine.css (aligned with the bar's check button) */
  let popupDrag = null;
  function toCanvas(e) {
    const app = document.getElementById('app');
    return { x: (e.clientX - (parseFloat(app.style.left) || 0)) / appScale, y: (e.clientY - (parseFloat(app.style.top) || 0)) / appScale };
  }
  document.addEventListener('pointerdown', e => {
    const p = e.target.closest('.scq-popup');
    if (!p) return;
    const c = toCanvas(e);
    const top = isNaN(parseFloat(p.style.top)) ? p.offsetTop : parseFloat(p.style.top);
    p.style.top = top + 'px'; p.style.bottom = 'auto';
    popupDrag = { el: p, offX: c.x - p.offsetLeft, offY: c.y - top };
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!popupDrag) return;
    if (e.buttons === 0) { popupDrag = null; return; }
    const c = toCanvas(e), p = popupDrag.el, app = document.getElementById('app');
    const ext = parseFloat(app.style.getPropertyValue('--side-ext')) || 0;   /* the popup may sit in the letterbox margin, like the bar */
    p.style.left = Math.max(-ext, Math.min(c.x - popupDrag.offX, app.offsetWidth + ext - p.offsetWidth)) + 'px';
    p.style.top  = Math.max(0, Math.min(c.y - popupDrag.offY, app.offsetHeight - 74 - p.offsetHeight)) + 'px';
  });
  window.addEventListener('pointerup', () => { popupDrag = null; });
  window.addEventListener('pointercancel', () => { popupDrag = null; });

  /* ─── Hint overlay ─── */
  function openHint(i) {
    const cfg = SCREENS[i], st = qState(cfg.key);
    if (st.done) return;
    document.getElementById('s' + i + '-hint-overlay')?.classList.remove('hidden');
  }
  function closeHint(i) { document.getElementById('s' + i + '-hint-overlay')?.classList.add('hidden'); }

  /* ─── Progress nav (generic renderer; state derived from Q) ─── */
  function seriesItemState(seriesKey, key) {
    const ser = PART.series[seriesKey], st = qState(key);
    if (ser.mode === 'peak') {
      if (peakState().submitted) return st.recorded === SCREENS[KEY_TO_INDEX[key]].correct ? 'correct' : 'incorrect';
      return st.recorded !== null ? 'answered' : 'not-answered';
    }
    if (!st.done) return 'not-answered';
    return st.correct ? 'correct' : 'incorrect';
  }
  function syncProgress(i) {
    const cfg = SCREENS[i];
    if (!cfg.series) return;
    const nav = qEl(i).querySelector('.progress-question');
    if (!nav) return;
    const ser = PART.series[cfg.series];
    const states = ser.keys.map(k => {
      let s = seriesItemState(cfg.series, k);
      if (k === cfg.key && (s === 'not-answered' || s === 'answered')) s = 'current';
      return s;
    });
    ser.keys.forEach((k, idx) => {
      const item = nav.querySelector('[data-question="' + (idx + 1) + '"]');
      const icon = item.querySelector('.progress-question__icon');
      const label = item.querySelector('.progress-question__label');
      icon.className = 'progress-question__icon' + (states[idx] !== 'not-answered' ? ' progress-question__icon--' + states[idx] : '');
      const visited = states[idx] !== 'not-answered';
      label.classList.toggle('progress-question__label--visited', visited);
      const target = KEY_TO_INDEX[k];
      /* Peak series (decision B12): dots are progress display only. */
      const nav_ok = ser.mode !== 'peak' && visited && target !== i;
      item.style.cursor = nav_ok ? 'pointer' : '';
      item.onclick = nav_ok ? () => goTo(target) : null;
      if (idx > 0) {
        const conn = nav.querySelector('[data-connector="' + idx + '"]');
        const prev = states[idx - 1];
        conn.classList.toggle('progress-question__connector--visited', prev === 'correct' || prev === 'incorrect' || prev === 'answered');
      }
    });
  }

  /* Series score: correct on any allowed attempt counts; a revealed
     solution after the final wrong attempt does not. */
  function seriesScore(seriesKey) {
    return PART.series[seriesKey].keys.filter(k => {
      const st = qState(k);
      return PART.series[seriesKey].mode === 'peak' ? st.recorded === SCREENS[KEY_TO_INDEX[k]].correct : st.done && st.correct;
    }).length;
  }

  /* ═══════════════════════════════════════════════════════════
     PEAK CONTROLLER (decisions B3a/B3b): "צדקתי?" records the answer
     silently → button becomes "שנמשיך?". Answers stay editable via Back
     until section ד is confirmed; then everything locks and the
     accumulated feedback screen shows (success = all correct, partial =
     any wrong; pass/fail routing separately by ≥ passThreshold).
     ═══════════════════════════════════════════════════════════ */
  function peakState() { return window.lomdaState.peak || (window.lomdaState.peak = { submitted: false }); }
  /* B1 (fix A15): a recorded peak answer whose selection was changed without
     pressing "צדקתי?" again — Back / forward / keys are blocked until the
     learner confirms the new answer or re-selects the recorded one. */
  function peakDirty(i) {
    const cfg = SCREENS[i];
    if (!cfg || cfg.mode !== 'peak' || peakState().submitted) return false;
    const st = qState(cfg.key);
    return st.recorded !== null && st.selected !== st.recorded;
  }
  function peakCheck(i) {
    const cfg = SCREENS[i], st = qState(cfg.key), ps = peakState();
    if (ps.submitted || (st.recorded !== null && st.recorded === st.selected)) return advanceScreen();
    if (!st.selected) return;
    st.recorded = st.selected;
    qPaint(i); syncProgress(i);
    saveState();
  }
  function enterPeakFeedback(i) {
    const cfg = SCREENS[i], ser = PART.series[cfg.series];
    const score = seriesScore(cfg.series);
    const variant = score === ser.keys.length ? 'success' : 'partial';
    const el = qEl(i);
    el.querySelectorAll('.pf-variant').forEach(v => v.classList.toggle('hidden', v.dataset.variant !== variant));
    const btn = el.querySelector('[data-act="next"]');
    const target = cfg.next ? cfg.next(score, api) : null;
    btn.classList.toggle('hidden', !target);          // B2: part-06 fail ends here
    window.lomdaState.peakScore = score;
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════════════════════ */
  let currentScreen = 0;
  const history = [];       // in-part screen trail for branched Back
  let entryIndex = 0;

  /* ─── Per-part learner state (decision B2 "restore and lock", fix A16) ─
     sessionStorage, so a new browser session starts clean. Covers question
     states, the peak submit flag, the in-part Back trail and anything the
     part adds via PART.saveState()/loadState() (part-01 widgets). Restored
     on load → answered questions re-render resolved and locked. */
  const STATE_K = 'state:' + PART.part;
  function saveState() {
    store.set('sessionStorage', STATE_K, {
      q: Q, peak: window.lomdaState.peak || null, history: history.slice(),
      extra: typeof PART.saveState === 'function' ? PART.saveState(api) : null
    });
  }
  function loadState() {
    const s = store.get('sessionStorage', STATE_K, null);
    if (!s || typeof s !== 'object') return;
    if (s.q) Object.keys(s.q).forEach(k => { Object.assign(qState(k), s.q[k]); });
    if (s.peak) window.lomdaState.peak = s.peak;
    if (Array.isArray(s.history)) s.history.forEach(n => { if (n >= 0 && n < SCREENS.length) history.push(n); });
    if (s.extra && typeof PART.loadState === 'function') PART.loadState(s.extra, api);
  }

  function goTo(n, opts) {
    if (n < 0 || n >= SCREENS.length) return;
    document.querySelectorAll('.scq-popup, .scq-hint-overlay').forEach(el => el.classList.add('hidden'));
    closeImageZoom();
    document.querySelectorAll('.tip-pop').forEach(el => el.remove());
    const prev = document.querySelector('.screen.active');
    if (prev && window.Motion) Motion.cancel(prev);
    if (prev) prev.classList.remove('active');
    if (!(opts && opts.noHistory) && prev && +prev.dataset.screen !== n) history.push(+prev.dataset.screen);
    currentScreen = n;
    const next = qEl(n);
    next.classList.add('active');
    if (window.Motion) Motion.reveal(next);
    enterScreen(n);
    saveState();
  }

  function enterScreen(n) {
    const cfg = SCREENS[n], el = qEl(n);
    fillCharSlots(el);
    if (cfg.type === 'scq') qEnter(n);
    if (cfg.type === 'peak-feedback') enterPeakFeedback(n);
    const hook = PART.hooks && PART.hooks[cfg.key];
    if (hook && hook.enter) hook.enter(el, api, cfg);
    const back = document.getElementById('s' + n + '-back');
    if (back) back.style.visibility = (n === entryIndex && !hasPrevPart() && !history.length) ? 'hidden' : '';
  }

  function goBack() {
    if (peakDirty(currentScreen)) return;                                   // B1
    if (history.length) { goTo(history.pop(), { noHistory: true }); return; }
    /* Optional branch-aware Back target, used only when there is no trail
       (deep link / cross-part return without history) — fix A7. */
    const bk = SCREENS[currentScreen].back;
    if (bk) {
      const k = typeof bk === 'function' ? bk(api) : bk;
      if (KEY_TO_INDEX[k] != null) { goTo(KEY_TO_INDEX[k], { noHistory: true }); return; }
    }
    if (currentScreen > entryIndex) { goTo(currentScreen - 1, { noHistory: true }); return; }
    goToPrevPart();
  }

  /* Gate on resolved state (not correctness) — _global-components → Advance gates. */
  function canAdvance(n) {
    const cfg = SCREENS[n];
    if (cfg.type === 'scq') {
      const st = qState(cfg.key);
      return cfg.mode === 'peak' ? st.recorded !== null && !peakDirty(n) : st.done;
    }
    const hook = PART.hooks && PART.hooks[cfg.key];
    if (hook && hook.canAdvance) return hook.canAdvance(api, cfg);
    return true;
  }

  function resolveTarget(cfg) {
    if (!cfg.next) return { screen: currentScreen + 1 };
    if (typeof cfg.next === 'function') {
      const score = cfg.series ? seriesScore(cfg.series) : null;
      return routeReplay(cfg.key, () => cfg.next(score, api));
    }
    return cfg.next;
  }

  function advanceScreen() {
    if (!canAdvance(currentScreen)) return;
    const cfg = SCREENS[currentScreen];
    const hook = PART.hooks && PART.hooks[cfg.key];
    if (hook && hook.onNext && hook.onNext(api, cfg) === false) return;   // hook consumed the step
    /* Peak: leaving the last section submits the whole question (locks all
       sections). Every path forward — button or keyboard — goes through
       here. A section left unanswered sends the learner back to it. */
    if (cfg.mode === 'peak' && !peakState().submitted) {
      const ser = PART.series[cfg.series];
      if (cfg.key === ser.keys[ser.keys.length - 1]) {
        const missing = ser.keys.find(k => qState(k).recorded === null);
        if (missing) { goTo(KEY_TO_INDEX[missing]); return; }
        peakState().submitted = true;
        saveState();
      }
    }
    const t = resolveTarget(cfg);
    if (!t) return;
    /* Last peak section: its feedback screen ends the unit in place */
    if (t.complete || t.finish) {
      const chk = document.getElementById('s' + currentScreen + '-check');
      if (chk) chk.disabled = true;
      if (t.complete) completeUnit();
      return;
    }
    if (t.part) { goToPart(t.part, t.screen || null); return; }
    const n = typeof t.screen === 'string' ? KEY_TO_INDEX[t.screen] : t.screen;
    if (n != null && n < SCREENS.length) goTo(n);
  }

  /* Completion — decision B6: single handler, local only for now. The
     LMS/xAPI layer will hook in here later without touching UI code. */
  function completeUnit() {
    store.set('localStorage', 'unitCompleted', { at: new Date().toISOString(), part: PART.part });
    window.lomdaState.unitCompleted = true;
    document.querySelectorAll('[data-act="complete"]').forEach(b => { b.disabled = true; });
    if (typeof PART.onComplete === 'function') PART.onComplete(api);
  }

  /* ─── Image zoom (T6 06 clone-based, scale-aware) ─── */
  function openImageZoom(btn) {
    const modal = document.getElementById('img-zoom-modal');
    const stage = document.getElementById('img-zoom-modal-stage');
    const wrapper = btn.closest('.scq-img-inner, .zoomable');
    if (!modal || !stage || !wrapper) return;
    const clone = wrapper.cloneNode(true);
    clone.querySelectorAll('.img-zoom-btn').forEach(b => b.remove());
    clone.classList.add('img-zoom-clone');
    stage.innerHTML = ''; stage.appendChild(clone);
    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false');
    const rect = wrapper.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const srcW = rect.width / appScale, srcH = rect.height / appScale;
    const maxW = sr.width / appScale - 40, maxH = sr.height / appScale - 40;
    if (srcW && srcH) {
      clone.style.width = srcW + 'px'; clone.style.height = srcH + 'px';
      clone.style.transform = 'scale(' + Math.min(maxW / srcW, maxH / srcH) + ')';
    }
  }
  function closeImageZoom() {
    const modal = document.getElementById('img-zoom-modal');
    if (!modal) return;
    modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true');
    const stage = document.getElementById('img-zoom-modal-stage'); if (stage) stage.innerHTML = '';
  }

  /* ─── Inline tooltip ─── */
  function toggleTip(btn) {
    const open = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.tip-pop').forEach(el => el.remove());
    document.querySelectorAll('.tip-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (open) return;
    const pop = document.createElement('span');
    pop.className = 'tip-pop'; pop.setAttribute('role', 'tooltip');
    pop.textContent = btn.dataset.tip;
    btn.closest('.tip').appendChild(pop);
    btn.setAttribute('aria-expanded', 'true');
  }
  function closeTips() {
    document.querySelectorAll('.tip-pop').forEach(el => el.remove());
    document.querySelectorAll('.tip-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  /* Opens on hover; click only opens (touch), so hover + click never toggles it shut */
  document.addEventListener('mouseover', e => {
    const btn = e.target.closest && e.target.closest('.tip-btn');
    if (btn && btn.getAttribute('aria-expanded') !== 'true') toggleTip(btn);
  });
  document.addEventListener('mouseout', e => {
    const btn = e.target.closest && e.target.closest('.tip-btn');
    if (btn && !btn.contains(e.relatedTarget)) closeTips();
  });

  /* ─── Delegated input ─── */
  document.addEventListener('click', e => {
    const zoom = e.target.closest('[data-zoom-src]');
    if (zoom) { openImageZoom(zoom); return; }
    if (e.target.closest('[data-zoom-close="true"]')) { closeImageZoom(); return; }
    const tip = e.target.closest('.tip-btn');
    if (tip) { e.preventDefault(); if (tip.getAttribute('aria-expanded') !== 'true') toggleTip(tip); return; }
    if (e.target.closest('.tip-pop')) return;
    if (!e.target.closest('.tip')) document.querySelectorAll('.tip-pop').forEach(el => el.remove());
    const hb = e.target.closest('[data-hint-backdrop]');
    if (hb && e.target === hb) { hb.classList.add('hidden'); return; }
    const opt = e.target.closest('.q-opt');
    if (opt && !opt.disabled) {
      qSelect(currentScreen, opt.dataset.id);
      const list = opt.closest('.dq-list');
      if (list) { list.classList.add('hidden'); list.previousElementSibling.setAttribute('aria-expanded', 'false'); }
      return;
    }
    if (!e.target.closest('.dq-dropdown-wrap')) document.querySelectorAll('.dq-list').forEach(l => { l.classList.add('hidden'); l.previousElementSibling.setAttribute('aria-expanded', 'false'); });
    const act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    switch (act.dataset.act) {
      case 'next': advanceScreen(); break;
      case 'back': goBack(); break;
      case 'check': qCheck(currentScreen); break;
      case 'hint': openHint(currentScreen); break;
      case 'hint-close': closeHint(currentScreen); break;
      case 'complete': completeUnit(); break;
      case 'dq-toggle': {
        const list = act.nextElementSibling, open = list.classList.contains('hidden');
        if (open) dismissRetry(currentScreen);
        list.classList.toggle('hidden', !open); act.setAttribute('aria-expanded', open ? 'true' : 'false');
        break;
      }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('textarea, input')) return;
    /* span.tip-btn (tooltip inside a .q-opt button, where a nested <button> is invalid) */
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('span.tip-btn')) {
      e.preventDefault(); e.stopPropagation(); toggleTip(e.target); return;
    }
    if (e.key === 'ArrowLeft') advanceScreen();
    if (e.key === 'ArrowRight') goBack();
    if (e.key === 'Escape') {
      closeHint(currentScreen); closeImageZoom();
      document.querySelectorAll('.tip-pop').forEach(el => el.remove());
    }
  });

  /* ─── Nav-button width reservation (T6 Foundation rule) ─── */
  const NAV_SEL = '.btn-continue, .scq-back, .scq-hint, .scq-check';
  let navBusy = false;
  function wrapNavLabel(btn) {
    let wrap = [...btn.children].find(c => c.classList.contains('nav-label'));
    if (wrap) { const cur = wrap.firstElementChild; if (cur && wrap.dataset.label !== cur.textContent) wrap.dataset.label = cur.textContent; return; }
    let carrier = null;
    for (const n of btn.childNodes) {
      if (n.nodeType === 3 && n.nodeValue.trim()) { carrier = n; break; }
      if (!carrier && n.nodeType === 1 && n.tagName === 'SPAN') carrier = n;
    }
    if (!carrier) return;
    const label = carrier.textContent.trim(); if (!label) return;
    wrap = document.createElement('span'); wrap.className = 'nav-label'; wrap.dataset.label = label;
    const inner = document.createElement('span'); inner.textContent = label; wrap.appendChild(inner);
    btn.replaceChild(wrap, carrier);
  }
  function initNavLabels() {
    document.querySelectorAll(NAV_SEL).forEach(btn => {
      wrapNavLabel(btn);
      if (btn._navObs) return;
      btn._navObs = true;
      new MutationObserver(recs => {
        if (navBusy) return; navBusy = true;
        try { recs.forEach(r => { let t = r.target; while (t && t.nodeType === 3) t = t.parentNode; while (t && !(t.matches && t.matches(NAV_SEL))) t = t.parentElement; if (t) wrapNavLabel(t); }); }
        finally { navBusy = false; }
      }).observe(btn, { childList: true, subtree: true, characterData: true });
    });
  }

  /* ─── Public API for part hooks ─── */
  const api = {
    LOMDA_ID, PART, goTo, goBack, advanceScreen, goToPart, completeUnit,
    getCharacter, setCharacter, charSrc, fillCharSlots, store,
    qState, seriesScore, peakState, indexOf: k => KEY_TO_INDEX[k],
    get current() { return currentScreen; },
    saveState,
    setLearningPath(p) { window.lomdaState.learningPath = p; store.set('sessionStorage', 'learningPath', p); },
    enableContinue(el, on) { const b = el.querySelector('.btn-continue'); if (b) b.disabled = !on; },
    toCanvas
  };
  window.LOMDA = api;

  /* ─── Boot ─── */
  /* Screens are built synchronously while the parser is still at this
     script (end of <body>), i.e. BEFORE DOMContentLoaded — motion.js
     attaches its popup observers (watchPopups) on DOMContentLoaded and
     must find every rendered .m-popup. */
  buildScreens();

  function boot() {
    /* A16: restore this part's learner state before the first screen enters.
       A forward arrival keeps answers (locked) but starts a fresh Back trail
       — Back from the entry screen must return to the previous part. */
    const arrival = store.get('sessionStorage', 'arrival', null);
    store.del('sessionStorage', 'arrival');
    loadState();
    if (arrival === 'forward') history.length = 0;
    window.addEventListener('pagehide', saveState);
    initNavLabels();
    scaleApp();
    window.addEventListener('resize', scaleApp);
    // Entry: deep link (#screen=key | #last) or the recorded entry screen
    const m = /^#screen=([\w-]+)$/.exec(location.hash);
    const recEntry = store.get('sessionStorage', 'entry:' + PART.part, null);
    let start = 0;
    if (recEntry != null && KEY_TO_INDEX[recEntry] != null) entryIndex = KEY_TO_INDEX[recEntry];
    if (m && KEY_TO_INDEX[m[1]] != null) start = KEY_TO_INDEX[m[1]];
    else if (location.hash === '#last') start = SCREENS.length - 1;
    else start = entryIndex;
    // A deep link may land before the recorded entry (never the case in
    // this unit's journeys); clamp the Back floor so it stays reachable.
    if (start < entryIndex) entryIndex = start;
    queueMicrotask(() => {
      currentScreen = start;
      const el = qEl(start);
      el.classList.add('active');
      if (window.Motion) Motion.reveal(el);
      enterScreen(start);
    });
    // DEV bridge (index_dev.html)
    window.addEventListener('message', e => {
      if (!e.data || e.data.type !== 'DEV_GOTO') return;
      const n = parseInt(e.data.screen, 10);
      if (!isNaN(n)) goTo(n);
    });
    if (window.parent !== window) window.parent.postMessage({ type: 'DEV_READY', total: SCREENS.length }, '*');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
