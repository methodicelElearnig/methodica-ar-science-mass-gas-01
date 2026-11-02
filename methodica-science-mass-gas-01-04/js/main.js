'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 04 — רכיב 4: בואו נאתגר את עצמנו · methodica-science-mass-gas-01-04
   PPTX slides 44–50: "תרגול מתקדם" (45–49) + "פריט העשרה" (50).
   Advanced: 4 Q, hint after 1 wrong, 2 attempts, "X מתוך 4".
   No threshold stated → no gate; → part 05 after the enrichment item.
   Slide 47 is named SCQImage but has no image → text-only (decision B5).
   Answer keys from the PPTX feedback text (§13 C1; slide 49's outline
   marks a different option than the feedback — feedback wins).
   ═══════════════════════════════════════════════════════════ */
const WRONG_FINAL = ['الإجابة غير صحيحة.', 'الإجابة الصحيحة معروضة.'];

window.PART = {
  part: '04',
  media: {
    characters: {
      default: { 'character-1': 'assets/img/character/character-1-default.gif', 'character-2': 'assets/img/character/character-2-default.png' },
      sunglasses: { 'character-1': 'assets/img/character/character-1-sunglasses.mp4', 'character-2': 'assets/img/character/character-2-sunglasses.mp4' },
      /* enrichment lead-in — reading a book (from green_/purple_reading.mp4, scaled to 600, audio removed) */
      reading: { 'character-1': 'assets/img/character/character-1-reading.mp4', 'character-2': 'assets/img/character/character-2-reading.mp4' }
    }
  },
  series: {
    adv: { keys: ['q1', 'q2', 'q3', 'q4'], mode: 'scored' }
  },
  hooks: {
    /* S5 — slide 50 · פריט העשרה · מסך ללא תבנית. "Old newspaper" styling
       with an antique-looking font (PPTX note). Visual is a local build —
       no Figma template exists for it (plan §6). */
    enrichment: {
      render: () =>
        '<div class="np-wrap">' +
          '<p class="np-intro">اقرأوا المقال التالي من عام 1654</p>' +
          '<article class="np-paper" style="background-image:url(assets/img/content/newspaper-paper.png)">' +
            '<header class="np-masthead"><h2 class="np-headline">تجربة نصفي كرة ماغدبورغ</h2></header>' +
            '<div class="np-body">' +
              '<figure class="np-fig zoomable"><img src="assets/img/content/magdeburg.png" alt="خيول تسحب نصفي كرة ماغدبورغ">' +
                '<button class="img-zoom-btn" type="button" data-zoom-src="assets/img/content/magdeburg.png" aria-label="تكبير الصورة"><svg class="img-zoom-btn__icon" viewBox="0 0 20.7149 20.9231" fill="none"><path d="M8 1C11.8661 1 15 4.13371 15 7.99902C15 11.8643 11.8661 14.998 8 14.998C4.1339 14.998 1 11.8643 1 7.99902C1 4.13371 4.13389 1 8 1Z" stroke="currentColor" stroke-width="2"/><path d="M12.6221 14.188L14.2657 12.6141L19.928 18.5274C20.3626 18.9813 20.347 19.7016 19.8931 20.1362C19.4392 20.5708 18.7189 20.5552 18.2843 20.1013L12.6221 14.188Z" fill="currentColor"/></svg></button>' +
              '</figure>' +
              '<div class="np-text">' +
                '<div class="np-col">' +
                '<p><b>العالِم ورئيس بلدية ماغدبورغ، أوتو فون غيريكه، أجرى تجربة استثنائية وأظهر قوة ضغط الهواء.</b></p>' +
                '<p>استخدم فون غيريكه مضخة خاصة لتفريغ الهواء ابتكرها، لسحب الهواء من داخل كرة نحاسية مكوَّنة من نصفين - كل واحد منهما بقطر نحو نصف متر!</p>' +
                '<p>بعد تفريغ الهواء، تم ربط 15 حصانًا بكل جزء من أجزاء الكرة، وقد سحبت الأحصنة أجزاء الكرة في اتجاهين مختلفين في محاولة لفصلها.</p>' +
                '</div><div class="np-col">' +
                '<p>على الرغم من القوة الكبيرة للخيول، <b>بقي نصفا الكرة ملتصقين ببعضهما ولم ينفصلا.</b></p>' +
                '<p>فسّر فون غيريكه أنه عندما يُسحب الهواء الموجود داخل الكرة إلى الخارج، <b>يُمارس ضغط الهواء المحيط بالكرة قوةً هائلةً على جدرانها</b>، لدرجة أن ثلاثين حصانًا لم تتمكن من التغلب عليها!</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</article>' +
        '</div>'
    }
  },
  screens: [
    /* S0 — slide 45 · transition · GIF: sunglasses on, looking at the learner */
    { key: 'intro', type: 'transition', pose: 'sunglasses', loop: true,
      lines: [
        { role: 'title', text: 'وقت لـ 4 أسئلة متقدمة<br>وبعض المفاجآت الشيّقة الأخرى...' },
        { role: 'sub', text: '(هذا يعني أننا تقدّمنا في المستوى)' }
      ] },

    /* Q1 — slide 46 · SingleChoice/Bubble · <פינג פונג> + 3 name-labelled bubbles */
    { key: 'q1', type: 'scq', series: 'adv', hintPolicy: 'afterWrong',
      image: { src: 'assets/img/content/ping-pong.jpg', alt: 'يُدخل المُرشد كرة بينغ بونغ مهشَّمة في كوب ماء ساخن' },
      bubbles: [
        { text: '<b>آية:</b> الماء الساخن تسرَّب إلى الكرة ودفع الانبعاج إلى الخارج', x: 20, y: -18, w: 58 },
        { text: '<b>سيف:</b> سخن الهواء الموجود داخل الكرة وتمدد ودفع الانبعاج إلى الخارج', x: -6, y: 68, w: 56, cls: 'bubble--tail-top' },
        { text: '<b>ميخائيل:</b> سخن البلاستيك وعادت الكرة إلى شكلها', x: 58, y: 68, w: 46, cls: 'bubble--tail-top' }
      ],
      body: ['خلال نادي تنس الطاولة، انبعجت الكرة فقام المدرب بوضعها في كوب به ماء ساخن.<br>بعد دقيقة اختفى الانبعاج، وعادت الكرة إلى شكلها الأصلي.',
             'أي الأطفال يقدّم التفسير العلمي الأكثر منطقية لما حدث؟'],
      options: [
        { id: 'ayala', text: 'آية' },
        { id: 'michael', text: 'ميخائيل' },
        { id: 'dor', text: 'سيف' }
      ],
      correct: 'dor',
      hint: { body: ['<b>ما هي المادة الموجودة داخل الكرة؟</b>', 'كيف يمكن للتسخين أن يؤثر على هذه المادة؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['عندما سخن الهواء الموجود داخل الكرة، زاد حجمه وتمدد ودفع جدران الكرة حتى عادت&nbsp;إلى&nbsp;شكلها&nbsp;الأصلي.'] },
        final:   { title: WRONG_FINAL,   body: ['عندما سخن الهواء الموجود داخل الكرة، زاد حجمه وتمدد ودفع جدران الكرة حتى عادت&nbsp;إلى&nbsp;شكلها&nbsp;الأصلي.'] }
      } },

    /* Q2 — slide 47 · text-only (B5) */
    { key: 'q2', type: 'scq', series: 'adv', hintPolicy: 'afterWrong', dense: true, cls: 'q-wide',
      body: ['في إطار تجربة في العلوم، ضغطت إحدى الطالبات على قنينة بلاستيكية <b>مغلقة</b>، بينما ضغط طالب آخر على قنينة بلاستيكية <b>مفتوحة</b>.',
             'قال المعلم:',
             'من الأصعب سحق قنينة بلاستيكية مغلقة مقارنة بقنينة بلاستيكية مفتوحة. عندما ضغط التلاميذ على القنينتين، القنينة المفتوحة<br>انسحقت بسهولة بينما القنينة المغلقة لم تغيّر شكلها تقريبًا. تُفسَّر هذه الملاحظة بأنه في القنينة المفتوحة يخرج الهواء إلى الخارج ويسمح للقنينة بالانكماش، بينما في القنينة المغلقة يكون الهواء محبوسًا، فينضغط قليلًا ويُمارس قوة دفع على جدران القنينة تمنع سحقها.',
             '<b>لماذا تُعتبر كلمات المعلم حجة علمية؟</b>'],
      options: [
        { id: 'b', text: 'تستند إلى ما يمكن رؤيته' },
        { id: 'c', text: 'هي تشرح بشكل صحيح سلوك الغاز' },
        { id: 'a', text: 'هم يربطون بين الملاحظة المستخلَصة من التجربة والتفسير العلمي الذي يبرر ادعاءً معينًا' },
        { id: 'd', text: 'هذه حجج علمية لأنها قيلت على لسان معلم للعلوم' }
      ],
      correct: 'a',
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['تتضمّن الحجة العلمية ادّعاءً وتبريرًا يستندان إلى<br>أدلة من التجارب والملاحظات.'] },
        final:   { title: WRONG_FINAL,   body: ['تتضمّن الحجة العلمية ادّعاءً وتبريرًا يستندان إلى<br>أدلة من التجارب والملاحظات.'] }
      } },

    /* Q3 — slide 48 · SingleChoiceQuestion */
    { key: 'q3', type: 'scq', series: 'adv', hintPolicy: 'afterWrong', dense: true, cls: 'q-wide',
      body: ['نسرين وأخوها الصغير قرّرا أن يمزحا مع الوالدين.<br>' +
             'قاموا بنفخ قفاز مطاطي، وأغلقوه جيدًا، ووضعوه في الثلاجة حتى يظن الوالدان أنه يد شخص ما.<br>' +
             'في صباح اليوم التالي فتحت الأم الثلاجة وصاحت بدهشة: "مَن وضع هنا قفاز مطاط منفوخًا قليلًا؟"',
             '<b>ماذا حدث للهواء الموجود داخل القفاز؟</b>'],
      options: [
        { id: 'a', text: 'أدَّت درجة الحرارة المنخفضة في الثلاجة إلى اختفاء جزء من الهواء، فانكمش القفاز' },
        { id: 'b', text: 'درجة الحرارة المنخفضة في الثلاجة جعلت الهواء يتحول إلى سائل وتقلّص القفاز' },
        { id: 'c', text: 'انخفاض درجة الحرارة في الثلاجة جعل الهواء يبرد، فقلّ حجمه وانكمش القفاز' },
        { id: 'd', text: 'درجة الحرارة المنخفضة في الثلاجة أحدثت ثقبًا في القفاز، ولذلك خرج جزء من الهواء' }
      ],
      correct: 'c',
      hint: { body: ['<b>حاولوا تذكّر تأثير درجة الحرارة على خصائص الغاز.</b>'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['عندما بردَ الهواء، انكمش وشغل حجمًا أصغر، ولذلك بدا القفاز أيضًا أقل انتفاخًا.'] },
        final:   { title: WRONG_FINAL,   body: ['عندما بردَ الهواء، انكمش وشغل حجمًا أصغر، ولذلك بدا القفاز أيضًا أقل انتفاخًا.'] }
      } },

    /* Q4 — slide 49 · SingleChoiceQuestion */
    { key: 'q4', type: 'scq', series: 'adv', hintPolicy: 'afterWrong', dense: true,
      image: { src: 'assets/img/content/two-vessels-tap.png', alt: 'وعاءان مغلقان متصلان من أعلى بأنبوب فيه صنبور. في الوعاء الأول توضع في كل مرة إحدى هذه المواد: خاتم فضة، عصير توت أو غاز ملوّن' },
      body: ['في المختبر، تم توصيل وعاءين مغلقين بواسطة أنبوب متصل بصنبور.<br>في الوعاء الأول، وُضعت في كل مرة مادة مختلفة: خاتم فضة، عصير توت أو غاز ملوّن.<br>بعد فتح الصنبور، أُتيحَ للمادة الانتقال بين الوعاءين.',
             '<b>أي من الجمل التالية يصف بشكل أفضل ما سيحدث؟</b>'],
      options: [
        { id: 'c', text: 'خاتم الفضة والعصير سينتشران في الوعاءين. سيبقى الغاز في الوعاء الأول' },
        { id: 'd', text: 'لن يُغيّر أي من المواد مكانه بعد فتح الصنبور' },
        { id: 'a', text: 'الخاتم الفضي وعصير التوت سيبقيان في الوعاء. أما الغاز الملون فسينتشر في الوعائين' },
        { id: 'b', text: 'ستنتشر جميع المواد في الوعاءين بالتساوي' }
      ],
      correct: 'a',
      hint: { body: ['<b>ماذا يحدث لحجم المادة الصلبة والسائل والغاز؟</b>', 'هل تتصرف جميعها بنفس الطريقة؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['للمادة الصلبة والسائلة حجم ثابت، ولذلك فإن فتح الصنبور لن يغيّر حجمهما.', 'في المقابل، يتمدد الغاز ويملأ كل الحجم المتاح له.'] },
        final:   { title: WRONG_FINAL,   body: ['للمادة الصلبة والسائلة حجم ثابت، ولذلك فإن فتح الصنبور لن يغيّر حجمهما.', 'في المقابل، يتمدد الغاز ويملأ كل الحجم المتاح له.'] }
      } },

    /* S5a — enrichment lead-in before the article (client request) */
    { key: 'enrichment-intro', type: 'transition', pose: 'reading',
      lines: [
        { role: 'title', text: 'لحظة للإثراء' },
        { role: 'sub', text: 'في الشاشة التالية ستقرأون عن تجربة علمية مذهلة حول موضوع ضغط الهواء.<br>واحدة من أشهر التجارب في العالم.' }
      ] },

    /* S5 — slide 50 · enrichment article (see hooks.enrichment) → part 05 */
    { key: 'enrichment', type: 'content', next: { part: '05' } }
  ]
};
