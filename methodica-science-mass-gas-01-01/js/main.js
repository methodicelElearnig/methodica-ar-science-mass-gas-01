'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 01 — רכיב 1: בואו נלמד משהו חדש · methodica-science-mass-gas-01-01
   PPTX slides 2–26. Character selection, hook, teaching (two learning
   paths), shared summary, warm-up.
   Path structure (plan §13 Q3): "סרטון" = slide 11;
   "ניסויים" = slides 15–19 (observations, each followed by its "מה היה
   לנו פה?" summary — תיקונים לאחר הפקה slides 4–6); both converge on the flip
   cards (slides 20–21), then slide 22 ("סיכום הקנייה - משותף לשתי השיטות").
   Custom components: js/widgets.js (window.P01).
   ═══════════════════════════════════════════════════════════ */
const WRONG_FINAL = ['الإجابة غير صحيحة.', 'الإجابة الصحيحة معروضة.'];
const CH = (pose) => ({ 'character-1': 'assets/img/character/character-1-default.gif', 'character-2': 'assets/img/character/character-2-default.png' });
/* Character-select cards (slide 3): muted loop that plays like a GIF only
   while the card is hovered / keyboard-focused; rests on its first frame. */
const SELECT_MEDIA = { 'character-1': 'assets/img/character/character-1-select.mp4', 'character-2': 'assets/img/character/character-2-select.mp4' };
const PATH_START = { video: 'video', 'hands-on': 'obs-intro' };
const seen = new Set();          // screens whose timed reveals already played this session

/* Instructional video (slide 11) — YouTube https://youtu.be/lXBGIz2y78A.
   Embedded via the IFrame API so "ended" still gates המשך; if the API
   script can't load, המשך unlocks rather than trapping the learner. */
const VIDEO_YT = 'lXBGIz2y78A';
/* Open-question stops (post-production request). t = seconds, just after the
   narrator's line ends (YouTube transcript: 0:23–0:32, 0:56–1:02, 1:21–1:28).
   The last stop ends the video — the flip cards cover the rest of it. */
const VIDEO_QS = [
  { t: 32, q: 'في رأيكم، ما هي المادة التي شغلت مكانًا في الكوب ولم تسمح للماء بالدخول؟', btn: 'لمتابعة الفيديو' },
  { t: 62, q: 'ما هو برأيكم الشيء الذي يميّز حجم الغاز؟', btn: 'لمتابعة الفيديو' },
  { t: 86, q: 'اكتبوا ظاهرة واحدة في حياتنا اليومية ترتبط باستخدام الغاز:', btn: 'لإنهاء الفيديو', end: true }
];

/* Thought bubble (PPTX cloudCallout, slides 7–8): cloud outline + three
   tail dots; dot positions per instance live in style.css. */
function cloud(cls, html, reveal) {
  return '<div class="cloud ' + cls + '" data-reveal="' + reveal + '">' +
    '<svg class="cloud-shape" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true"><path d="M40 30A25 25 0 0 1 80 15A28 28 0 0 1 130 12A25 25 0 0 1 170 30A22 22 0 0 1 185 70A25 25 0 0 1 155 105A25 25 0 0 1 110 112A28 28 0 0 1 60 108A25 25 0 0 1 22 85A30 30 0 0 1 40 30Z"/></svg>' +
    '<i class="cloud-dot"></i><i class="cloud-dot"></i><i class="cloud-dot"></i>' +
    '<p class="cloud-text">' + html + '</p></div>';
}

/* Observation summary (תיקונים לאחר הפקה, slides 4–6) — shown after each
   observation; tabs keep the observation it closes as current. */
function obsSummary(n, paras) {
  return {
    render: () => P01.tabs(n) +
      '<div class="os-content"><h1 class="os-title" data-reveal="1">ماذا كان لدينا هنا؟</h1>' +
      '<div class="os-text" data-reveal="2">' + paras.map(p => '<p>' + p + '</p>').join('') + '</div></div>' + P01.toggle(),
    enter(el, api) { P01.tabsSync(el, P01.obs); P01.toggleSync(el, api, PATH_START, 'hands-on'); }
  };
}

function bubbleSeq(el, key, delay) {   // first bubble on entry, second after `delay` ms (slides 7, 8)
  const late = el.querySelectorAll('[data-late]');
  if (seen.has(key)) { late.forEach(b => b.classList.remove('is-pending')); return; }
  seen.add(key);
  late.forEach(b => b.classList.add('is-pending'));
  setTimeout(() => late.forEach(b => b.classList.remove('is-pending')), delay);
}

window.PART = {
  part: '01',
  media: { characters: {
    default: CH(),
    'balloons-two-hands': { 'character-1': 'assets/img/character/character-1-balloons-two-hands.mp4', 'character-2': 'assets/img/character/character-2-balloons-two-hands.mp4' },   /* slide 4 */
    'balloon-uninflated': { 'character-1': 'assets/img/character/character-1-balloon-uninflated.mp4', 'character-2': 'assets/img/character/character-2-balloon-uninflated.mp4' },   /* slide 6 */
    'point-head': { 'character-1': 'assets/img/character/character-1-point-head.mp4', 'character-2': 'assets/img/character/character-2-point-head.mp4' },   /* slide 9 */
    'popcorn': { 'character-1': 'assets/img/character/character-1-popcorn.mp4', 'character-2': 'assets/img/character/character-2-popcorn.mp4' },   /* slide 10 — לצפות בסרטון */
    'lab-coat-goggles': { 'character-1': 'assets/img/character/character-1-lab-coat-goggles.mp4', 'character-2': 'assets/img/character/character-2-lab-coat-goggles.mp4' },   /* slide 10 — לנסות בעצמי; slide 15 obs-intro */
    'stretch-side': { 'character-1': 'assets/img/character/character-1-stretch-side.mp4', 'character-2': 'assets/img/character/character-2-stretch-side.mp4' }   /* slide 24 */
  } },
  series: {},
  hooks: {
    /* S0 — slide 3 · TwoOptionSelection · character choice.
       Right = green (character-1, holding a paper boat), left = purple
       (character-2, holding an inflated balloon) — PPTX layout + note. */
    'char-select': {
      render: () => P01.twoOption({
        title: 'من سيرافقنا في التعلّم؟', subtitle: 'اختاروا شخصية',
        cards: [
          { value: 'character-2', pose: 'select', char: 'character-2', aria: 'شخصية بنفسجية تمسك بالون منفوخ' },
          { value: 'character-1', pose: 'select', char: 'character-1', aria: 'شخصية خضراء تحمل قاربًا ورقيًا' }
        ] }),
      enter(el, api) {
        /* Each card shows its own character (not the selected one). */
        el.querySelectorAll('.char-select-slot').forEach(s => {
          if (s.firstChild) return;
          s.innerHTML = '<video class="char-media char-select-video" src="' + SELECT_MEDIA[s.dataset.char] + '" muted loop playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-hidden="true"></video>';
          const v = s.firstChild, card = s.closest('.option-card');
          const play = () => { const p = v.play(); if (p) p.catch(() => {}); };
          const stop = () => { if (card.matches(':hover') || card.matches(':focus-visible')) return; v.pause(); v.currentTime = 0; };
          card.addEventListener('pointerenter', play); card.addEventListener('focus', () => { if (card.matches(':focus-visible')) play(); });
          card.addEventListener('pointerleave', stop); card.addEventListener('blur', stop);
        });
        /* Part 01 never restores a stored selection (720 companion rule). */
        P01.twoOptionWire(el, api, window.lomdaState.pickedThisSession, v => { window.lomdaState.pickedThisSession = v; api.setCharacter(v); });
      },
      canAdvance: () => !!window.lomdaState.pickedThisSession
    },

    /* S3 — slide 6 · HookOpenQuestion · Continue enabled once something is typed (QA #26). */
    hypothesis: {
      render: () =>
        '<div class="hy-input" data-reveal="1"><textarea class="oq-textarea" id="hy-text" placeholder="اكتبوا هنا فرضيتكم" aria-label="اكتبوا هنا فرضيتكم"></textarea></div>' +
        '<div class="hy-char" data-reveal="2"><div class="bubble"><p>فكّروا في فرضية:</p><p>لماذا لم ينتفخ البالون؟</p></div><div class="char-slot" data-pose="balloon-uninflated"></div></div>' +
        '<div class="hy-note" data-reveal="3"><p>لاحقًا في الوحدة سنفحص فرضيتكم ونكتشف</p><p>ما الذي كان في القنينة ومنع البالون من الانتفاخ.</p></div>',
      enter(el, api) {
        const ta = el.querySelector('#hy-text');
        ta.value = window.lomdaState.hypothesis || '';
        api.enableContinue(el, !!ta.value.trim());
        if (!ta._wired) { ta._wired = true; ta.addEventListener('input', () => { window.lomdaState.hypothesis = ta.value; api.enableContinue(el, !!ta.value.trim()); }); }
      },
      canAdvance: () => !!(window.lomdaState.hypothesis || '').trim()
    },

    /* S4 — slide 7 (layout: תיקונים לאחר הפקה, slide 1) · מסך ללא תבנית · girl's thought cloud first, father after 2 s. */
    bbq: {
      render: () =>
        '<div class="st-card" data-reveal="1"><p>عائلة كوهين اشترت شواية غاز جديدة ودعت كل العائلة إلى "شواء" في حديقة بيتهم.</p><p>ضمن التحضيرات، اشترى الأب لمشواة الغاز أسطوانة غاز طهي بكتلة 5 كغم.</p></div>' +
        '<div class="bbq-img" data-reveal="2"><img src="assets/img/content/bbq.jpg" alt="أب وابنته بجانب مشواة غاز وأسطوانة غاز"><span class="kg-tag" dir="ltr">5 KG</span></div>' +
        cloud('bbq-girl', 'لماذا تُقاس <b>كتلة</b><br>أسطوانة غاز الطبخ<br>ولا يُقاس <b>حجمها</b>؟', 3) +
        '<div class="bubble bbq-dad" data-late><p>الغازات تتمدد ويمكن ضغطها، <b>وحجمها يكون دائمًا مساويًا لحجم الوعاء الذي توجد فيه</b>.</p><p>في المقابل، <b>تبقى كتلتها ثابتة</b> ولذلك عند شراء غاز الطهي يُدفع الثمن حسب الكتلة وليس حسب الحجم.</p></div>',
      enter(el) { bubbleSeq(el, 'bbq', 2000); }
    },

    /* S5 — slide 8 (layout: תיקונים לאחר הפקה, slide 2) · מסך ללא תבנית · Saar's thought cloud first, mother's bubble after 2 s.
       Photos: <אמא וסער> (left, ice rink) / <אבא ונטע> (right, beach). */
    twins: {
      render: () =>
        '<div class="st-card st-card--twins" data-reveal="1"><p>سامر ولينا - توأمان في التاسعة من العمر، حصل كلٌّ منهما على بالون متطابق في عيد ميلادهما.</p><p>نقل الأب لينا للتنزه في البحر، ونقلت الأم سامر للتزلج على الجليد.</p><p>لمّا أرسل كل منهما صورةً للآخر، لاحظا فرقًا بين البالونات الخاصة بهما.</p></div>' +
        '<div class="tw-phones" data-reveal="2">' +
          '<div class="tw-phone tw-phone--saar"><img src="assets/img/content/twins-mom-saar.webp" alt="الأم و"سامر" في ملعب التزلج على الجليد مع بالون صغير"></div>' +
          '<div class="tw-phone tw-phone--neta"><img src="assets/img/content/twins-dad-neta.webp" alt="الأب ولينا على شاطئ البحر مع بالون كبير"></div>' +
        '</div>' +
        cloud('tw-boy', 'لماذا بالون<br>لينا أكبر؟', 3) +
        '<div class="bubble tw-mom" data-late><p>الهواء الموجود في البالونات هو غاز.</p><p><b>يتأثر حجم الغاز بدرجة الحرارة.</b></p><p>عندما يسخن الغاز فإنه <b>يتمدد</b> ويشغل حجمًا أكبر.</p><p>عندما يبرد الغاز فإنه <b>ينكمش</b> ويشغل حجمًا أصغر، لذلك يبدو بالون سامر أصغر.</p></div>',
      enter(el) { bubbleSeq(el, 'twins', 2000); }
    },

    /* S6 — slide 9 (layout: תיקונים לאחר הפקה, slide 3) · summary text (top) on entry; Continue #1 reveals the left
       bubble; Continue #2 advances. GIF: pointing at its head. */
    'lets-start': {
      render: () =>
        '<div class="ls-stage"><div class="ls-right" data-reveal="1"><p>تعرفنا على خاصيتين للغاز:</p><p>1. <b>الغاز قابل للتمدد والانضغاط</b> – حجمه يكون دائمًا مساويًا لحجم الوعاء الذي يوجد فيه.</p><p>2. <b>يتأثر حجم الغاز بدرجة الحرارة –</b> في الحرارة <b>يتمدد</b> وفي البرودة <b>ينكمش.</b></p></div>' +
        '<div class="char-slot ls-char" data-pose="point-head"></div>' +
        '<div class="bubble ls-left">لا تقلقوا، سنحرص على تذكيركم بالخصائص في الأماكن المناسبة.</div></div>',
      enter(el) { el.classList.remove('is-step2-anim'); el.classList.toggle('is-step2', !!window.lomdaState.letsStart2); },
      onNext() {
        if (!window.lomdaState.letsStart2) { window.lomdaState.letsStart2 = true; document.querySelector('[data-key="lets-start"]').classList.add('is-step2', 'is-step2-anim'); return false; }
      }
    },

    /* S7 — slide 10 · TwoOptionSelection · learning path.
       Right = "לצפות בסרטון" (popcorn GIF), left = "לנסות בעצמי" (lab coat GIF). */
    'path-select': {
      render: () => P01.twoOption({
        title: 'كيف تريدون أن تتعلموا في الدقائق القادمة؟', subtitle: 'اختاروا بين خيارين',
        cards: [
          { value: 'hands-on', pose: 'lab-coat-goggles', label: 'أن أجرب بنفسي', aria: 'أن أجرّب بنفسي — الشخصية ترتدي معطف مختبر ونظارات واقية' },
          { value: 'video', pose: 'popcorn', label: 'مشاهدة فيديو', aria: 'مشاهدة الفيديو — الشخصية تتناول الفشار' }
        ] }),
      enter(el, api) {
        /* Card animations play (looping) only while the card is hovered / keyboard-focused. */
        el.querySelectorAll('.option-card').forEach(card => {
          const v = card.querySelector('.char-slot video');
          if (!v) return;
          v.removeAttribute('autoplay'); v.autoplay = false; v.loop = true;
          v.pause(); try { v.currentTime = 0; } catch (e) {}
          if (card._hoverWired) return; card._hoverWired = true;
          const play = () => { const p = v.play(); if (p) p.catch(() => {}); };
          const stop = () => { if (card.matches(':hover') || card.matches(':focus-visible')) return; v.pause(); try { v.currentTime = 0; } catch (e) {} };
          card.addEventListener('pointerenter', play); card.addEventListener('focus', () => { if (card.matches(':focus-visible')) play(); });
          card.addEventListener('pointerleave', stop); card.addEventListener('blur', stop);
        });
        P01.twoOptionWire(el, api, window.lomdaState.pathPicked ? window.lomdaState.learningPath : null,
          v => { window.lomdaState.pathPicked = true; api.setLearningPath(v); });
      },
      canAdvance: () => !!window.lomdaState.pathPicked,
      onNext(api) { api.goTo(api.indexOf(PATH_START[window.lomdaState.learningPath])); return false; }
    },

    /* ─── Video path ─── */
    /* V1 — slide 11 · instructional video (script: slides 12–14). */
    video: {
      render: () =>
        '<div class="vd-head" data-reveal="1"><h1 class="select-title">حجم الغاز</h1><p class="select-subtitle vd-sub">شاهدوا الباحثة وهي تُجري ملاحظات وتتوصل إلى استنتاجات!</p></div>' +
        '<div class="vd-frame" data-reveal="2"><div class="vd-video" id="vd-yt"></div></div>' +
        '<div class="scq-hint-overlay vd-q-overlay hidden"><div class="scq-hint-popup vd-q-popup" role="dialog" aria-modal="true" aria-labelledby="vd-q-title">' +
        '<p class="vd-q-title" id="vd-q-title"></p>' +
        '<textarea class="oq-textarea vd-q-text" placeholder="اكتبوا هنا إجابتكم" aria-labelledby="vd-q-title"></textarea>' +
        '<button class="scq-hint-close vd-q-btn" type="button" disabled></button></div></div>' +
        P01.toggle(),
      enter(el, api) {
        P01.toggleSync(el, api, PATH_START, 'video');
        const L = window.lomdaState;
        const qs = L.videoQs = L.videoQs || { done: [], answers: [] };
        const watched = () => { L.videoWatched = true; api.enableContinue(el, true); };
        api.enableContinue(el, !!L.videoWatched);
        /* Question popup: the video stays paused until the learner answers. */
        const ov = el.querySelector('.vd-q-overlay'), ta = ov.querySelector('.vd-q-text'), btn = ov.querySelector('.vd-q-btn');
        const ask = n => {
          el._q = n;
          ov.querySelector('.vd-q-title').textContent = VIDEO_QS[n].q;
          btn.textContent = VIDEO_QS[n].btn;
          ta.value = qs.answers[n] || ''; btn.disabled = !ta.value.trim();
          ov.classList.remove('hidden'); ta.focus();
        };
        if (el._q != null) ask(el._q);   // left the screen mid-question: show it again
        if (el._yt) return;
        el._yt = true;
        let player;
        ta.addEventListener('input', () => { qs.answers[el._q] = ta.value; btn.disabled = !ta.value.trim(); });
        btn.addEventListener('click', () => {
          const n = el._q; el._q = null;
          qs.done.push(n); ov.classList.add('hidden');
          if (VIDEO_QS[n].end) watched(); else player.playVideo();
        });
        /* Polled continuously (not only while PLAYING) so a seek made while
           paused / buffering is caught too. Skipping past an unanswered stop
           snaps back to it — the earliest one first — so no question is missed. */
        /* Leaving the screen (המשך / חזרה / toggle) pauses the video — the engine has no exit hook. */
        new MutationObserver(() => {
          if (!el.classList.contains('active') && player && player.pauseVideo) player.pauseVideo();
        }).observe(el, { attributes: true, attributeFilter: ['class'] });
        const check = () => {
          if (el._q != null || !player || !player.getCurrentTime || !el.classList.contains('active')) return;
          const now = player.getCurrentTime(), n = VIDEO_QS.findIndex((c, k) => now >= c.t && qs.done.indexOf(k) < 0);
          if (n < 0) return;
          player.pauseVideo();
          if (now > VIDEO_QS[n].t + 1) { player.seekTo(VIDEO_QS[n].t, true); player.pauseVideo(); }   // seekTo from ENDED can auto-play
          ask(n);
        };
        const make = () => player = new YT.Player('vd-yt', {
          videoId: VIDEO_YT,
          /* fs: 0 — the question popup can't show over YouTube's own fullscreen */
          playerVars: Object.assign({ rel: 0, playsinline: 1, hl: 'he', fs: 0 }, /^https?:/.test(location.protocol) ? { origin: location.origin } : {}),
          events: {
            onReady: () => setInterval(check, 200),
            onStateChange: e => {
              if (e.data !== YT.PlayerState.ENDED) return;
              /* scrubbed to the end: unanswered stops still have to be asked */
              if (qs.done.length < VIDEO_QS.length) check(); else watched();
            }
          }
        });
        if (window.YT && YT.Player) { make(); return; }
        window.onYouTubeIframeAPIReady = make;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = watched;
        document.head.appendChild(tag);
      },
      canAdvance: () => !!window.lomdaState.videoWatched
    },

    /* ─── Hands-on path ─── */
    /* H0 — slide 15 · observation intro. No observation tabs on this screen (they start at obs1). */
    'obs-intro': {
      render: () =>
        '<div class="oi-stage"><div class="bubble oi-bubble" data-reveal="1">لنستكشف خاصية أخرى للغاز.<br/>قوموا بإجراء الملاحظات الثلاث التالية.</div>' +
        '<div class="char-slot oi-char" data-pose="lab-coat-goggles" data-loop="1"></div></div>' + P01.toggle(),
      enter(el, api) { P01.toggleSync(el, api, PATH_START, 'hands-on'); }
    },
    obs1: {
      render: () => P01.tabs(1) + P01.W1.render() + P01.toggle(),
      enter(el, api) { P01.tabsSync(el, P01.obs); P01.toggleSync(el, api, PATH_START, 'hands-on');
        if (!el._w) { el._w = true; P01.W1.wire(el, api); } P01.W1.paint(el); api.enableContinue(el, P01.W1.state.phase === 3); },
      canAdvance: () => P01.W1.state.phase === 3
    },
    'obs1-sum': obsSummary(1, [
      'الهواء الموجود داخل قنينة الزجاج <b>يشغل حيزًا</b>.',
      'في المرحلة الأولى، كانت القنينة مغلقة ومحكمة. لم يكن بإمكان الهواء الذي بداخلها الخروج، ولذلك لم يُفسَح مكان للماء الذي حاولنا صبه بالداخل.<br>نتيجة لذلك، <b>لم يدخل الماء إلى القنينة وانسكب إلى الخارج</b>.',
      'في المرحلة الثانية أزلنا السدادة.<br>الآن أصبح بإمكان الهواء الخروج من القنينة، ليفسح المجال للماء، <b>وتمكّن الماء من الدخول مكانه</b>.'
    ]),
    obs2: {
      render: () => P01.tabs(2) + P01.W2.render() + P01.toggle(),
      enter(el, api) { P01.tabsSync(el, P01.obs); P01.toggleSync(el, api, PATH_START, 'hands-on');
        if (!el._w) { el._w = true; P01.W2.wire(el, api); } P01.W2.paint(el); api.enableContinue(el, P01.W2.state.step > 6); },
      canAdvance: () => P01.W2.state.step > 6
    },
    'obs2-sum': obsSummary(2, [
      'عندما أدخلنا الكوب بشكل مستقيم في الماء، <b>الهواء الموجود بداخله احتلّ حيّزًا</b>، ولم يتمكن الماء من ترطيب قارب الورق.',
      'عندما أدخلنا الكوب بشكل مائل، <b>هرب جزء من الهواء من الكوب</b> واستطاع الماء الدخول إليه وتبليل قارب الورق.'
    ]),
    obs3: {
      render: () => P01.tabs(3) + P01.W3.render() + P01.toggle(),
      enter(el, api) { P01.tabsSync(el, P01.obs); P01.toggleSync(el, api, PATH_START, 'hands-on');
        if (!el._w) { el._w = true; P01.W3.wire(el, api); } P01.W3.paint(el); api.enableContinue(el, P01.W3.state.step > 4); },
      canAdvance: () => P01.W3.state.step > 4
    },
    'obs3-sum': obsSummary(3, [
      'عندما سحبنا مكبس المحقنة، <b>تمدد الهواء داخل المحقنة وملأها</b>.',
      'بعد أن أغلقنا فتحة المحقنة بسدادة مطاطية، <b>لم يستطع الهواء الموجود بداخلها الخروج.</b> لذلك، عندما حاولنا دفع المكبس إلى الداخل، انضغط الهواء وانغلق المكبس قليلًا – لكن ليس حتى النهاية.',
      'عندما أزلنا السدادة، <b>استطاع الهواء الخروج</b> من المحقنة وإفساح المجال للمكبس، ولذلك تمكّنا من دفعه حتى النهاية.'
    ]),
    /* ─── Shared: both paths ─── */
    /* H4 — slides 20+21 · FlipCardsReveal (one screen). Reached from obs3
       (hands-on) and from the video (video path). RTL order
       right→left: balloon · straw · vacuum. */
    flipcards: {
      render: () =>
        '<div class="select-content fc-content"><div class="select-head" data-reveal="1"><h1 class="select-title">كيف نستخدم الخصائص الفريدة للغازات في حياتنا اليومية؟</h1><p class="select-subtitle">حوّلوا البطاقات إلى شرح</p></div>' +
        P01.flip([
          { aria: 'شفط الغبار', img: 'assets/img/content/fc-vacuum.jpg', back: ['هل ساعدنا الوالدين وشفطنا الغبار في البيت؟', 'يدفع محرك المكنسة الهواء إلى الخارج، ويسمح لهواء الغرفة بالدخول إليها، فيجرف معه الغبار&nbsp;والأوساخ.'] },
          { aria: 'الشرب بالماصة', img: 'assets/img/content/fc-straw.jpg', back: ['هل شربنا باستخدام ماصة؟', 'عندما نسحب الهواء من القشة، نُفرِغ فيها مكانًا.', 'الهواء المحيط بالكوب يدفع المشروب إلى الأعلى، فيرتفع داخل القشّة إلى المكان الذي أصبح فارغًا.'] },
          { aria: 'نفخ بالون', img: 'assets/img/content/fc-balloon.jpg', back: ['نفخنا بالونًا ليوم الميلاد؟ لقد زِدنا كمية الهواء في البالون فتَمدَّد وشَدَّ المطاط.'] }
        ]) + '</div>' + P01.toggle(),
      enter(el, api) { P01.toggleSync(el, api, PATH_START, null); P01.flipWire(el, api); },   // pill = the path the learner came from
      canAdvance: () => P01.flipDone()          // A4: keyboard advance respects the flip-all gate
    },

    /* ─── Shared summary ─── */
    /* S8 — slide 22 · OrderedDragAndDropQuestion · no hint, no feedback (§13 Q7). */
    'summary-dnd': {
      cfg: {
        title: 'ماذا تعلمنا؟',
        body: ['طابقوا بين الصور والجمل التي تلخّص ما تعلّمناه حتى الآن.', 'اسحبوا كل صورة إلى المكان المناسب لها. (السحب إلى مكان غير صحيح لن يكون ممكنًا)'],
        /* Slide 7 (post-production fixes): one image per box; the two balloons
           are a single tile. Pool order is shuffled relative to the solved
           PPTX layout — DOM is LTR, so reading right→left the targets go
           t2·t3·t1 and no tile sits above its own box. */
        tiles: [
          { id: 'ron-1',    img: 'assets/img/content/dnd-ron-1.jpg',   target: 't1', alt: 'بالون داخل قنينة', cover: true },
          { id: 'balloons', imgs: ['assets/img/content/dnd-balloon-full.png', 'assets/img/content/dnd-balloon-empty.png'], target: 't3', alt: 'بالون منفوخ وبالون فارغ من الهواء' },
          { id: 'syringe',  img: 'assets/img/content/dnd-syringe.jpg', target: 't2', alt: 'هواء داخل محقنة', cover: true }
        ],
        /* DOM order = RTL visual order right→left */
        targets: [
          { id: 't1', text: ['الهواء غاز يشغل حيزًا، وله حجم<br>مثل جميع الغازات.', 'هو يمنع مادة أخرى من الدخول إلى الوعاء طالما<br>ليس لديها طريقة للخروج.'] },
          { id: 't2', text: ['على عكس المواد الصلبة والسوائل، ليس للغازات شكل ثابت، فهي تتمدد ويمكن ضغطها.', 'حجمها دائمًا مثل حجم الوعاء<br>الذي توجد فيه'] },
          { id: 't3', text: ['الحرارة المحيطة بالغازات تؤثر<br>على حجمها.', 'يؤدي التسخين إلى تمدد الغازات، بينما يؤدي التبريد إلى انضغاطها.'] }
        ]
      },
      render(cfg) { return P01.dnd(this.cfg); },
      enter(el, api) { P01.dndWire(el, this.cfg, api); },
      canAdvance() { return P01.dndState.submitted; }      // every tile placed
    },

    /* S12 — slide 26: character + bubble appear only after a wrong final answer. */
    'def-scq': {
      enter(el, api) {
        const st = api.qState('def-scq');
        el.classList.toggle('show-char', st.done && !st.correct);
      }
    },

    /* S10 — slide 24: the stretch clip loops (exception to play-once). */
    'warmup-intro': {
      enter(el) { el.querySelectorAll('.char-slot video').forEach(v => { v.loop = true; v.play().catch(() => {}); }); }
    }
  },

  /* A16 (decision B2): part-01 learner state that must survive a cross-part
     round trip. The character choice is deliberately NOT restored here
     (part 01 never pre-selects — 720 companion rule). */
  saveState() {
    const L = window.lomdaState, pick = {};
    ['hypothesis', 'letsStart2', 'pathPicked', 'videoWatched', 'videoQs'].forEach(k => { if (L[k] !== undefined) pick[k] = L[k]; });
    return { w1: P01.W1.state, w2: P01.W2.state, w3: P01.W3.state, obs: [...P01.obs], flipped: [...P01.flipped],
             dnd: P01.dndState, seen: [...seen], lomda: pick };
  },
  loadState(x) {
    if (x.w1) Object.assign(P01.W1.state, x.w1);
    if (x.w2) Object.assign(P01.W2.state, x.w2, { _live: null });
    if (x.w3) { Object.assign(P01.W3.state, x.w3); P01.W3.state.flow = null; }
    (x.obs || []).forEach(n => P01.obs.add(n));
    (x.flipped || []).forEach(n => P01.flipped.add(n));
    if (x.dnd) Object.assign(P01.dndState, x.dnd);
    (x.seen || []).forEach(k => seen.add(k));
    Object.assign(window.lomdaState, x.lomda || {});
  },

  onResolve(cfg, st, api) {
    if (cfg.key === 'def-scq' && !st.correct) {
      const el = document.querySelector('[data-key="def-scq"]');
      el.classList.add('show-char'); api.fillCharSlots(el);
    }
  },

  screens: [
    { key: 'char-select', type: 'content', button: 'اخترتُ', gated: true },
    /* S1 — slides 4+5 · SCQImage · hook text + the slide 5 question on one
       screen; slide 5's <רון 2> image + bubble dropped. One attempt, no hint,
       correct = ג (producer decision 2026-10-15). */
    { key: 'hook-balloon', type: 'scq', attempts: 1, top: 64,
      image: { src: 'assets/img/content/ron-1.jpg', alt: 'رامي يحاول نفخ بالون داخل قنينة' },
      title: 'ماذا سيحدث للبالون؟',
      body: ['في إطار رهان مع صديقه، يحاول رامي نفخ بالون داخل قنينة.', '<b>اختاروا الإجابة التي تبدو لكم صحيحة:</b>'],
      options: [
        { id: 'a', text: 'سينتفخ البالون ويملأ القنينة' },
        { id: 'b', text: 'سينتفخ البالون في الجزء العلوي فقط' },
        { id: 'c', text: 'البالون لن ينتفخ تقريبًا' },
        { id: 'd', text: 'سينفجر البالون داخل القنينة' }
      ],
      correct: 'c',
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['سينتفخ بالون رامي بالكاد عندما ينفخ فيه داخل القنينة.', 'لماذا؟ تابعوا التعلم وستكتشفون.'] },
        final:   { title: ['الإجابة غير صحيحة.'], body: ['سينتفخ بالون رامي بالكاد عندما ينفخ فيه داخل القنينة.', 'لماذا؟ تابعوا التعلم وستكتشفون.'] }
      } },
    { key: 'hypothesis', type: 'content', gated: true },
    { key: 'bbq', type: 'content' },
    { key: 'twins', type: 'content' },
    { key: 'lets-start', type: 'content' },
    { key: 'path-select', type: 'content', button: 'اخترتُ', gated: true },
    { key: 'video', type: 'content', next: { screen: 'flipcards' } },
    { key: 'obs-intro', type: 'content', back: 'path-select' },            // A7: Back without a trail
    { key: 'obs1', type: 'content', gated: true },
    { key: 'obs1-sum', type: 'content' },
    { key: 'obs2', type: 'content', gated: true },
    { key: 'obs2-sum', type: 'content' },
    { key: 'obs3', type: 'content', gated: true },
    { key: 'obs3-sum', type: 'content' },
    { key: 'flipcards', type: 'content', gated: true,
      back: () => window.lomdaState.learningPath === 'video' ? 'video' : 'obs3-sum' },   // A7
    { key: 'summary-dnd', type: 'content', button: 'متابعة', gated: true,
      back: 'flipcards' },   // A7

    /* S9 — slide 23 · DropdownQuestion · one attempt, hint always. PPTX
       incorrect title is authored as a single line (kept as written). */
    { key: 'dropdown', type: 'scq', attempts: 1, hintPolicy: 'always', top: 90,
      body: ['<b>دعونا نصوغ معًا تعريفًا للحجم يناسب السوائل والمواد الصلبة، وكما تعلّمنا الآن - يناسب الغازات أيضًا:</b>'],
      dropdown: { before: 'حجم المادة هو', after: ' الذي تشغله في الحيّز.' },
      options: [{ id: 'weight', text: 'الوزن' }, { id: 'space', text: 'الفراغ' }, { id: 'color', text: 'اللون' }, { id: 'mass', text: 'الكتلة' }],
      correct: 'space',
      hint: { title: 'فكروا في الهواء داخل بالون', body: ['كيف يؤثر وجود الهواء على جدران البالون المطاطية؟'] },   // title replaces the default "רמז"
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['حجم المادة هو الحيز الذي تشغله في الفضاء.<br>هذا التعريف صحيح لجميع حالات المادة - السائلة والصلبة والغازية أيضًا.'] },
        final:   { title: ['الإجابة غير صحيحة.'], body: ['حجم المادة هو الحيز الذي تشغله في الفضاء.<br>هذا التعريف صحيح لجميع حالات المادة - السائلة والصلبة والغازية أيضًا.'] }
      } },

    /* S10 — slide 24 · מסך הזנקה · warm-up intro. GIF: side stretches. */
    { key: 'warmup-intro', type: 'transition', pose: 'stretch-side', button: 'خذوني إلى الأسئلة',
      lines: [{ role: 'title', text: 'ماذا بقيَ عالقًا في عقولنا؟' }, { role: 'lead', text: 'سؤالان بسيطان للإحماء قبل أن نتقدم' }] },

    /* S11 — slide 25 · TrueFalseQuestion (Figma 4827:28896, one statement) · one attempt · no progress bar. */
    { key: 'tf', type: 'scq', attempts: 1, hintPolicy: 'always', top: 110,
      title: 'هل الجملة التالية صحيحة أم غير صحيحة؟',
      statement: 'الهواء يشغل مكانًا في الفضاء، ولذلك له حجم.',
      options: [{ id: 'true', text: 'صحيح' }, { id: 'false', text: 'غير صحيح' }],
      correct: 'true',
      hint: { body: ['<b>فكّروا في التجربة الخاصة بالكوب المقلوب</b>', 'ما الذي منع الماء من الدخول إلى الكوب؟'] },
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['حجم المادة هو الفراغ - المكان الذي تشغله في الفضاء.<br>هذا التعريف صحيح لجميع حالات المادة - السائلة والصلبة وكذلك الغازية.'] },
        final:   { title: WRONG_FINAL,     body: ['حجم المادة هو الفراغ - المكان الذي تشغله في الفضاء.<br>هذا التعريف صحيح لجميع حالات المادة - السائلة والصلبة وكذلك الغازية.'] }
      } },

    /* S12 — slide 26 · SingleChoiceQuestion · hint always · 2 attempts (§13 C7). */
    { key: 'def-scq', type: 'scq', hintPolicy: 'always', top: 110,
      body: ['ما هو التعريف الصحيح للحجم؟'],
      options: [
        { id: 'a', text: 'كمية المادة الموجودة في جسم معين' },
        { id: 'b', text: 'وزن مادة معينة' },
        { id: 'c', text: 'الحيز الذي تشغله المادة في الفضاء' },
        { id: 'd', text: 'درجة حرارة مادة معينة' }
      ],
      correct: 'c',
      hint: { body: ['<b>فكّروا، بِمَ يتعلّق الحجم؟</b>', 'بالكمية؟ بالوزن؟ بالمكان؟ بدرجة الحرارة؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['الحجم هو الحيز الذي تشغله المادة في الفراغ. هذا التعريف صحيح لكل مادة - صلبة أو سائلة أو غازية.'] },
        final:   { title: WRONG_FINAL,   body: ['الحجم هو الحيز الذي تشغله المادة في الفراغ. هذا التعريف صحيح لكل مادة - صلبة أو سائلة أو غازية.'] }
      },
      extraHtml: '<div class="def-char"><div class="bubble">حتى لو أخطأت، لا داعي للقلق، التعلّم الجيد يتضمّن أخطاء!</div><div class="char-slot" data-pose="shrug-smile"></div></div>',
      next: { part: '02' } }
  ]
};
