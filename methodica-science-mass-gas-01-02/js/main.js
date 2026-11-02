'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 02 — רכיב 2: זמן תרגול · methodica-science-mass-gas-01-02
   PPTX slides 27–33 (section "תרגול סטנדרטי 1").
   Standard practice 1: 5 questions, pass ≥ 4 (80%, slide 28).
   Hint after 1 wrong · 2 attempts · progress "שאלה X מתוך 5".
   Exit routing (decision B9): pass → part 03 at the Standard-B intro
   (skips Basic); fail → part 03 Basic intro.
   Answer keys = the option the PPTX feedback text restates (plan §13 C1).
   Rendering/behaviour: js/engine.js (synced from shared/).
   ═══════════════════════════════════════════════════════════ */
const WRONG_FINAL = ['الإجابة غير صحيحة.', 'الإجابة الصحيحة معروضة.'];

window.PART = {
  part: '02',
  media: {
    characters: {
      /* Placeholders from the PPTX until the character repository poses
         arrive. Pose ids: plan §7. */
      default: { 'character-1': 'assets/img/character/character-1-default.gif', 'character-2': 'assets/img/character/character-2-default.png' },
      /* slide 28 — stretching (same clips as part 01 slide 24) */
      'interlock-stretch': { 'character-1': 'assets/img/character/character-1-stretch-side.mp4', 'character-2': 'assets/img/character/character-2-stretch-side.mp4' }
    }
  },
  series: {
    std1: { keys: ['q1', 'q2', 'q3', 'q4', 'q5'], mode: 'scored', passThreshold: 4 }
  },
  hooks: {
    /* S0 — the stretching clip loops (per review request; overrides the play-once default). */
    intro: { enter(el) { const v = el.querySelector('.char-slot video'); if (v) { v.loop = true; v.play().catch(() => {}); } } }
  },
  screens: [
    /* S0 — slide 28 · מסך הזנקה (TransitionScreen). GIF: interlocking fingers & stretching. */
    { key: 'intro', type: 'transition', pose: 'interlock-stretch', button: 'يمكن البدء!',
      lines: [
        { role: 'lead', text: 'أنهينا مرحلة التعلم، سننتقل إلى التمرين الأول ونجيب عن' },
        { role: 'title', text: '5 أسئلة' },
        { role: 'lead', text: 'يجب الإجابة بشكل صحيح عن 4 أسئلة على الأقل.' }
      ] },

    /* Q1 — slide 29 · SingleChoiceQuestionImage · image <יהלי> (PPTX asks to regenerate with narrower tape) */
    { key: 'q1', type: 'scq', series: 'std1', hintPolicy: 'afterWrong',
      image: { src: 'assets/img/content/yahali.jpg', alt: 'ياسمين تحاول صب العصير عبر قمع ملصق بالقنينة' },
      body: ['تريد ياسمين أن تملأ القنينة بالعصير الذي أعدّته.<br>' +
             'هي تستخدم قمعًا، وكي لا يتحرك تقوم بلصقه بالقنينة<br>' +
             'بواسطة شريط لاصق قوي أغلق الفجوة بين القنينة والقمع بشكل كامل،<br>' +
             'لكن العصير لم يدخل إلى القنينة!',
             '<b>ماذا يجب أن تفعل ياسمين حتى يدخل العصير إلى القنينة؟</b>'],
      options: [
        { id: 'a', text: 'لصب العصير بشكل أسرع يدفعه إلى الداخل' },
        { id: 'b', text: 'تسخين القنينة قليلًا كي تدفع الحرارة العصير إلى الداخل' },
        { id: 'c', text: 'إزالة الشريط اللاصق حتى يتمكن الهواء من الخروج من القنينة' },
        { id: 'd', text: 'إمالة القنينة قليلًا على جانبها' }
      ],
      correct: 'c',
      hint: { body: ['<b>ما الذي يشغل المكان داخل القنينة؟</b>', 'ماذا يمكن لياسمين أن تفعل لإفساح المجال للعصير؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['الهواء يشغل كل حجم القنينة وليس أمامه طريق<br>للخروج لأن ياسمين ألصقت القمع بالقنينة.<br>إزالة الشريط اللاصق ستسمح للهواء بالخروج<br>وللعصير بالدخول.'] },
        final:   { title: WRONG_FINAL,   body: ['الهواء يشغل كل حجم القنينة وليس أمامه طريق<br>للخروج لأن ياسمين ألصقت القمع بالقنينة.<br>إزالة الشريط اللاصق ستسمح للهواء بالخروج<br>وللعصير بالدخول.'] }
      } },

    /* Q2 — slide 30 · SingleChoiceQuestionImage · image <אחותה של שרה> */
    { key: 'q2', type: 'scq', series: 'std1', hintPolicy: 'afterWrong',
      image: { src: 'assets/img/content/sarah-sister.gif', alt: 'تُدخِل فتاة قنينة فارغة في حوض السباحة وتخرج منها فقاعات هواء' },
      body: ['أخت سارة الصغيرة كانت تلعب في حوض السباحة بقنينة بلاستيكية فارغة.<br>' +
             'أدخلت القنينة إلى حوض السباحة لملئها بالماء فاندهشت<br>' +
             'فقاعات هواء تخرج من القنينة قبل أن يدخل إليها الماء.',
             '<b>لماذا خرجت فقاعات هواء من القنينة؟</b>'],
      options: [
        { id: 'a', text: 'لا يوجد للهواء حجم خاص به، ولذلك يتحوّل إلى فقاعات عندما يكون داخل الماء' },
        { id: 'b', text: 'الهواء الموجود خارج حوض السباحة انحبس داخل الماء وخرج على شكل فقاعات هواء' },
        { id: 'c', text: 'عندما دخل الماء إلى القنينة، شكّل فقاعات هواء' },
        { id: 'd', text: 'الهواء الذي كان داخل القنينة خرج إلى الخارج لإفساح المجال للماء' }
      ],
      correct: 'd',
      hint: { title: 'ماذا كان في القنينة قبل أن توضع في الماء؟', plain: true },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['الهواء الذي كان داخل القنينة كان يشغل حيزًا.<br>لكي يتمكن الماء من الدخول، خرج الهواء إلى الخارج على شكل فقاعات.<br>هذا دليل على أن للهواء حجمًا وأنه يشغل حيزًا.'] },
        final:   { title: WRONG_FINAL,   body: ['الهواء الذي كان داخل القنينة كان يشغل حيزًا.<br>لكي يتمكن الماء من الدخول، خرج الهواء إلى الخارج على شكل فقاعات.<br>هذا دليل على أن للهواء حجمًا وأنه يشغل حيزًا.'] }
      } },

    /* Q3 — slide 31 · SingleChoiceQuestion (text only) */
    { key: 'q3', type: 'scq', series: 'std1', hintPolicy: 'afterWrong',
      body: ['تقول معلّمة العلوم إنكم ستُجرون اليوم تجربة للتحقق مما إذا كان الهواء يشغل حيّزًا.<br>' +
             'يقول يوسف إنه لا حاجة إلى تجربة لمعرفة أن الهواء يشغل حيّزًا.',
             'اختاروا الجملة التي تفسّر بأفضل شكل لماذا من المهم في العلم الاعتماد على الأدلة، وليس فقط على ما يبدو منطقيًا.'],
      options: [
        { id: 'a', text: 'إذا بدا الادّعاء منطقيًا للجميع، فلا حاجة إلى اختباره بالتجربة مرارًا وتكرارًا' },
        { id: 'b', text: 'قد تضلّلنا حواسنا، لذلك سنتحقق من الادّعاءات باستخدام أدلة <span class="tip">موضوعية<span class="tip-btn" role="button" tabindex="0" aria-expanded="false" aria-label="ما هي الأدلة الموضوعية؟" data-tip="الأدلة الموضوعية: حقائق وبيانات يمكن إثباتها وقياسها بشكل مستقل، دون الاعتماد على رأي أو تفسير أو شعور شخصي.">i</span></span> يمكن تكرار قياسها' },
        { id: 'c', text: 'التجربة والدليل هدفهما أن يُظهرا من جديد ما هو معروف لدينا أصلًا' },
        { id: 'd', text: 'يكفي أن يرى شخص واحد شيئًا ما بعينيه ويبلّغ عنه للجميع حتى يُعتبر ذلك دليلًا علميًا مُثبتًا' }
      ],
      correct: 'b',
      hint: { body: ['<b>رأي أم ادّعاء؟</b>', 'فكروا في الفرق بين شيء يبدو منطقيًا،<br>وبين شيء تم اختباره ويمكن تكراره وقياسه مرة بعد أخرى.'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['في العِلم لا يَكفي أن يَبدو الأمر منطقيًا.', 'يتم فحص كل ادعاء من خلال أدلة موضوعية يمكن قياسها وتكرارها، لأن حواسنا قد تخدعنا.'] },
        final:   { title: WRONG_FINAL,   body: ['في العِلم لا يَكفي أن يَبدو الأمر منطقيًا.', 'يتم فحص كل ادعاء من خلال أدلة موضوعية يمكن قياسها وتكرارها، لأن حواسنا قد تخدعنا.'] }
      } },

    /* Q4 — slide 32 · SingleChoice/Bubble · image <צ'יפס> + 3 conversation bubbles.
       PPTX note says "שאלה 5 מתוך 5"; by section order this is question 4 (plan §13 C2). */
    { key: 'q4', type: 'scq', series: 'std1', hintPolicy: 'afterWrong',
      image: { src: 'assets/img/content/chips.jpg', alt: 'وائل ونور يمسكان كيس شيبس' },
      bubbles: [
        { text: 'هي ليست فارغة، بل مملوءة بالنيتروجين،<br>هذا غاز يحافظ على الطعم<br>ويمنع تكسّر رقائق البطاطس.', x: 12, y: -14, w: 74 },
        { text: 'ما هذا؟ فقط للمواد الصلبة<br>والسوائل حجم!', x: 2, y: 48, w: 50, cls: 'bubble--tail-up' },
        { text: 'هل تتذكر أننا تعلمنا أن الغازات أيضًا لها حجم؟', x: 28, y: 84, w: 70, cls: 'bubble--tail-up' }
      ],
      body: ['وائل اشترى كيس شيبس من الدكان. <br>' +
             'توجّه إلى نور وقال: "المسي، الكيس يبدو نصف فارغ".',
             '<b>اقرأوا تكملة المحادثة واختاروا الادّعاء الصحيح:</b>'],
      options: [
        { id: 'a', text: 'الغاز ليس له شكل ثابت، ولذلك ليس له حجم' },
        { id: 'b', text: 'الغاز في الكيس، لكن فقط رقائق البطاطس تشغل حيزًا' },
        { id: 'c', text: 'للغاز أيضًا حجم، ولذلك فهو يشغل حيزًا' },
        { id: 'd', text: 'للمواد الصلبة والسوائل فقط حجم، وليس للغاز' }
      ],
      correct: 'c',
      hint: { body: ['<b>فكروا في الملاحظات التي رأيناها</b>', 'هل يهم أن نرى المادة أو لا نراها، لكي نحدد أنها تشغل حيزًا؟'] },
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['الغاز الموجود داخل كيس رقائق البطاطس يشغل حيزًا،<br>لذلك فإن الكيس ليس شبه فارغ، بل هو مملوء جزئيًا برقائق البطاطس وجزئيًا بغاز النيتروجين.', 'كما تعلّمنا من الملاحظات المختلفة، للغازات أيضًا حجم، وهي تملأ كل الفراغ الحر في المكان الذي توجد فيه.'] },
        final:   { title: WRONG_FINAL,     body: ['الغاز الموجود داخل كيس رقائق البطاطس يشغل حيزًا،<br>لذلك فإن الكيس ليس شبه فارغ، بل هو مملوء جزئيًا برقائق البطاطس وجزئيًا بغاز النيتروجين.', 'كما تعلّمنا من الملاحظات المختلفة، للغازات أيضًا حجم، وهي تملأ كل الفراغ الحر في المكان الذي توجد فيه.'] }
      } },

    /* Q5 — slide 33 · SingleChoiceQuestion (text only) — series end, routes out of the part. */
    { key: 'q5', type: 'scq', series: 'std1', hintPolicy: 'afterWrong',
      body: ['أي من الخصائص التالية تُميّز الغازات، لكنها لا تُميّز المواد الصلبة أو السوائل؟'],
      options: [
        { id: 'a', text: 'تحتل دائمًا حيزًا في الفراغ' },
        { id: 'b', text: 'لها حجم يمكن قياسه' },
        { id: 'c', text: 'تملأ كل حجم الوعاء الذي توجد فيه' },
        { id: 'd', text: 'لها كتلة يمكن قياسها' }
      ],
      correct: 'c',
      hint: { body: ['<b>فكّروا:</b>', 'أي من هذه الخصائص تنتمي إلى المواد الصلبة أو السوائل، وما هي الخاصية الفريدة التي تخص الغازات وحدها؟'] },
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['لكل المواد: الصلبة والسائلة والغازية حجم، ولها كتلة.', 'الغازات وحدها لا تحافظ على حجم ثابت: فهي تتمدد،<br>وقابلة للانضغاط، وتملأ دائمًا كل حجم الوعاء الذي توجد فيه.'] },
        final:   { title: WRONG_FINAL,     body: ['لكل المواد: الصلبة والسائلة والغازية حجم، ولها كتلة.', 'الغازات وحدها لا تحافظ على حجم ثابت: فهي تتمدد،<br>وقابلة للانضغاط، وتملأ دائمًا كل حجم الوعاء الذي توجد فيه.'] }
      },
      /* B9: ≥4/5 → Standard B intro in part 03 (skip Basic); else Basic. */
      next: score => score >= 4 ? { part: '03', screen: 'stdb-intro' } : { part: '03' } }
  ]
};
