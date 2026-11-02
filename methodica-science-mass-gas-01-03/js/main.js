'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 03 — רכיב 3: זמן תרגול #2 · methodica-science-mass-gas-01-03
   PPTX slides 34–43: "תרגול בסיסי" (35–40) + "תרגול סטנדרטי 2" (41–43).
   Entry (decision B9): from part 02 fail → Basic intro (S0);
                        from part 02 pass → Standard-B intro ('stdb-intro').
   Basic: 4 Q, hint always (slide 35), 2 attempts, "X מתוך 4".
          Pass ≥3 stated on slide 35, but no fail path exists → no gate (B1).
   Standard B: 2 Q, hint after 1 wrong, no threshold → part 04.
   Slide 43 note says "שאלה 4 מתוך 6 תרגול סטנדרטי 1" — it is Std-B Q2 of 2
   (plan §13 C3). Answer keys from the PPTX feedback text (§13 C1).
   ═══════════════════════════════════════════════════════════ */
const WRONG_FINAL = ['الإجابة غير صحيحة.', 'الإجابة الصحيحة معروضة.'];

window.PART = {
  part: '03',
  media: {
    characters: {
      default: { 'character-1': 'assets/img/character/character-1-default.gif', 'character-2': 'assets/img/character/character-2-default.png' },
      /* slide 35 — lifting small weights (from green_lift.mp4 / purple_lift.mp4, cropped to the feet, audio removed) */
      weights: { 'character-1': 'assets/img/character/character-1-weights.mp4', 'character-2': 'assets/img/character/character-2-weights.mp4' },
      /* slide 40 — holding the air bag, bike tire and beach ball (from green_/purple_holding3items.mp4, cropped, audio removed) */
      'holding-bag-tire-ball': { 'character-1': 'assets/img/character/character-1-holding.mp4', 'character-2': 'assets/img/character/character-2-holding.mp4' },
      /* slide 41 — cheerleader pompoms (from green_/purple_cheer.mp4, cropped to the feet, audio removed) */
      pompoms: { 'character-1': 'assets/img/character/character-1-cheer.mp4', 'character-2': 'assets/img/character/character-2-cheer.mp4' }
    }
  },
  series: {
    basic: { keys: ['q1', 'q2', 'q3', 'q4'], mode: 'scored', passThreshold: 3 },
    stdb:  { keys: ['q5', 'q6'], mode: 'scored' }
  },
  hooks: {
    /* S0 — the weights clip loops (like part 02's intro; overrides the play-once default). */
    intro: { enter(el) { const v = el.querySelector('.char-slot video'); if (v) { v.loop = true; v.play().catch(() => {}); } } }
  },
  screens: [
    /* S0 — slide 35 · מסך הזנקה לפני תרגול בסיסי · GIF: lifting small weights */
    { key: 'intro', type: 'transition', pose: 'weights', button: 'يمكن البدء!',
      lines: [
        { role: 'lead', text: 'التمرين هو أفضل طريقة لتعزيز التعلم' },
        { role: 'title', text: '4 أسئلة' },
        { role: 'strong', text: 'وهناك تلميح منذ البداية! أجيبوا بشكل صحيح عن 3 أسئلة أو أكثر (75%) للانتقال إلى المرحلة التالية.' }
      ] },

    /* Q1 — slide 36 · SingleChoiceQuestion */
    { key: 'q1', type: 'scq', series: 'basic', hintPolicy: 'always',
      body: ['هل الهواء مادة؟'],
      answersWidth: 400,
      options: [
        { id: 'a', text: 'نعم، الهواء مادة' },
        { id: 'b', text: 'لا، الهواء ليس مادة' },
        { id: 'c', text: 'فقط إذا كان موجودًا داخل وعاء' },
        { id: 'd', text: 'فقط إذا كان مخلوطًا بغاز آخر' }
      ],
      correct: 'a',
      hint: { body: ['<b>للهواء حجم وهو يشغل حيزًا.</b>', 'هل الشيء الذي يشغل حيزًا هو مادة؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['حتى لو لم نرَ الهواء، فهو مادة لها حجم<br>تشغل مكانًا في الفراغ، كما رأينا في الملاحظات المختلفة.'] },
        final:   { title: WRONG_FINAL,   body: ['حتى لو لم نرَ الهواء، فهو مادة لها حجم<br>تشغل مكانًا في الفراغ، كما رأينا في الملاحظات المختلفة.'] }
      } },

    /* Q2 — slide 37 · SingleChoiceQuestionImage · <ליאו> */
    { key: 'q2', type: 'scq', series: 'basic', hintPolicy: 'always',
      image: { src: 'assets/img/content/leo.jpg', alt: 'ليث ينفخ كرة بحر' },
      body: ['ليث ينفخ كرة بحر. الكرة أصبحت تقريبًا ممتلئة وليث يريدها أن تكون كبيرة<br>قدر الإمكان، لكنه يشعر أنه أصبح من الصعب جدًا عليه إدخال الهواء إلى الكرة.',
             '<b>لماذا يَصعُب على ليث إدخال الهواء إلى الكرة؟</b>'],
      options: [
        { id: 'a', text: 'الهواء في الكرة ثقيل جدًا، ومن الصعب الإمساك بالكرة ونفخها' },
        { id: 'b', text: 'ليث صغير جدًا على نفخ كرة بحر كبيرة إلى هذا الحد' },
        { id: 'c', text: 'يوجد بالفعل الكثير من الهواء داخل البالون ولا يوجد فيه تقريبًا مكان لهواء إضافي' },
        { id: 'd', text: 'الكرة ممتلئة بمياه البحر ولا يوجد فيها مكان للهواء' }
      ],
      correct: 'c',
      hint: { body: ['<b>هل يوجد شيء داخل الكرة يمنع الهواء من الدخول؟</b>'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['<span class="q2-fb-lead">الهواء مادة لها حجم، ولذلك فهو يشغل حيزًا داخل الكرة.</span>', 'عندما تكون الكرة ممتلئة، لا يبقى تقريبًا مكان لهواء إضافي، ولذلك يصعب الاستمرار في نفخها.'] },
        final:   { title: WRONG_FINAL,   body: ['<span class="q2-fb-lead">الهواء مادة لها حجم، ولذلك فهو يشغل حيزًا داخل الكرة.</span>', 'عندما تكون الكرة ممتلئة، لا يبقى تقريبًا مكان لهواء إضافي، ولذلك يصعب الاستمرار في نفخها.'] }
      } },

    /* Q3 — slide 38 · SingleChoiceQuestionImage · <צמיג אופניים> */
    { key: 'q3', type: 'scq', series: 'basic', hintPolicy: 'always',
      image: { src: 'assets/img/content/bike-tire.jpg', alt: 'مدرّب ينفخ إطار دراجة هوائية' },
      body: ['في نادٍ لركوب الدراجات، علّم المدرّب الأطفال كيف يتم نفخ الإطار.<br>وأوضح أنه بعد النفخ يصبح الإطار صلبًا، وأضاف أنه لو قاموا بقياس<br>كتلته لاكتشفوا أن كتلته ازدادت قليلًا.',
             '<b>ماذا تُعلّمنا هذه الظاهرة؟</b>'],
      options: [
        { id: 'a', text: 'للهواء حجم، لكن ليست له كتلة على الإطلاق' },
        { id: 'b', text: 'الهواء يُمتص داخل مطاط الإطار ولذلك يصبح صلبًا' },
        { id: 'c', text: 'للهواء حجم وكتلة أيضًا' },
        { id: 'd', text: 'من المحتمل أن تضيف المضخة مادة ما إلى الإطار بالإضافة إلى الهواء' }
      ],
      correct: 'c',
      hint: { body: ['<b>إذا ارتفعت كتلة الإطار</b>', 'ماذا أُضيف إليه أثناء النفخ بالهواء؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['حقيقة أن الإطار انتفخ وزادت كتلته تدل على أن للهواء حجمًا وكتلة أيضًا.'] },
        final:   { title: WRONG_FINAL,   body: ['حقيقة أن الإطار انتفخ وزادت كتلته تدل على أن للهواء حجمًا وكتلة أيضًا.'] }
      } },

    /* Q4 — slide 39 · SingleChoice/Bubble (no bubble shape on the slide) · <חני> */
    { key: 'q4', type: 'scq', series: 'basic', hintPolicy: 'always',
      image: { src: 'assets/img/content/hani.jpg', alt: 'هنادي تُمسِك كيسًا مُحكَم الإغلاق' },
      body: ['عادت هنادي من زيارة إلى القدس وأحضرت معها داخل كيس محكم الإغلاق "هواء جبال صافٍ كالنبيذ".<br>قال لها أخوها: "إذا وضعتِ الكيس في الخارج في يوم حار، فسينتفخ قليلًا"!',
             '<b>هل أخو هنادي محق؟</b>'],
      options: [
        { id: 'a', text: 'نعم، لأن الحرارة تحوّل الهواء إلى مادة جديدة تشغل حيزًا أكبر' },
        { id: 'b', text: 'نعم، لأن الغاز يتمدد عندما تكون درجات الحرارة المحيطة به مرتفعة' },
        { id: 'c', text: 'لا، لأن حجم الهواء يبقى دائمًا ثابتًا' },
        { id: 'd', text: 'لا، لأن الغاز لا يمكن ضغطه إلا إذا كانت درجات الحرارة المحيطة به منخفضة' }
      ],
      correct: 'b',
      hint: { body: ['<b>ما الذي يؤثر على حجم الغازات؟</b>'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['تعلمنا أن الغازات تتمدد في درجات الحرارة المرتفعة،<br>لذلك سينتفخ الكيس قليلًا إذا بقي في الخارج في يوم حار.'] },
        final:   { title: WRONG_FINAL,   body: ['تعلمنا أن الغازات تتمدد في درجات الحرارة المرتفعة،<br>لذلك سينتفخ الكيس قليلًا إذا بقي في الخارج في يوم حار.'] }
      } },

    /* S5 — slide 40 · מסך ללא תבנית → TransitionScreen bubble variant.
       GIF: holding the air bag, bike tire and beach ball. */
    { key: 'basic-end', type: 'transition', pose: 'holding-bag-tire-ball', lines: [],
      bubble: 'حاولوا دمج كل ما فهمتموه من هذا التمرين في بقية الوحدة!' },

    /* S6 — slide 41 · Standard-B intro (entry point for Std-1 passers). GIF: cheerleader pompoms. */
    { key: 'stdb-intro', type: 'transition', pose: 'pompoms',
      lines: [
        { role: 'lead', text: 'عمل رائع!' },
        { role: 'title', text: 'فيما يلي تمرينان إضافيان بمستوى صعوبة أعلى.' }
      ],
      bubble: 'أنا واثق من أنكم ستنجحون!' },

    /* Q5 — slide 42 · SingleChoiceQuestion · Standard B 1/2 */
    { key: 'q5', type: 'scq', series: 'stdb', hintPolicy: 'afterWrong',
      body: ['أي من الادعاءات التالية صحيحة؟'],
      options: [
        { id: 'a', text: 'للمادة الصلبة والسائل حجم ثابت، أما حجم الغاز فهو كحجم الوعاء الذي يوجد فيه' },
        { id: 'b', text: 'للمادة الصلبة والسائل والغاز حجم ثابت لا يتغيّر' },
        { id: 'c', text: 'للمادة الصلبة حجم ثابت، أما السائل والغاز فيملآن كل حجم الوعاء الذي يوجدان فيه' },
        { id: 'd', text: 'للمادة الصلبة والسائلة والغازية حجم يتغير حسب حجم الوعاء الذي توجد فيه' }
      ],
      correct: 'a',
      hint: { body: ['<b>قارنوا بين حالات التجمع الثلاث.</b>', 'أيّ منهما يحافظ على حجم ثابت، وأيّ منهما يأخذ حجم الوعاء الذي يوجد فيه؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['للمادة الصلبة والسائلة حجم ثابت.', 'في المقابل، لا يمتلك الغاز حجمًا ثابتًا، فهو يتمدد أو يمكن ضغطه، ويكون حجمه مساويًا لحجم الوعاء الذي يوجد فيه.'] },
        final:   { title: WRONG_FINAL,   body: ['للمادة الصلبة والسائلة حجم ثابت.', 'في المقابل، لا يمتلك الغاز حجمًا ثابتًا، فهو يتمدد أو يمكن ضغطه، ويكون حجمه مساويًا لحجم الوعاء الذي يوجد فيه.'] }
      } },

    /* Q6 — slide 43 · image-choice (3 cards; no template named in the PPTX).
       Cards show each child's channel line (the slide's speech bubbles);
       physical order left→right = אדם, מיקה, ירדן (PPTX note). Correct: מיקה. */
    { key: 'q6', type: 'scq', series: 'stdb', hintPolicy: 'afterWrong',
      body: ['لآدم وريم وميرا قنوات YouTube تهتم بالعلوم.<br>كل واحد منهم يريد أن يرفع فيديو يحل سؤالًا علميًا - سؤالًا يمكن فحصه بتجربة.',
             '<strong>من من الأطفال يرفع الفيديو الأنسب؟</strong>'],
      /* Speech-bubble layout (slide 43): images side by side, every bubble
         centred under its card on two lines (QA). */
      cards: [
        { id: 'adam',   img: 'assets/img/content/card-adam.jpg',   label: 'أهلًا يا أصدقائي، اليوم سنحاول أن نكتشف:<br>ما هو أجمل لون في العالم؟',
          bubble: { x: '50%', y: 274, cls: 'bubble--tail-top icq-bubble--center' } },
        { id: 'mika',   img: 'assets/img/content/card-mika.jpg',   label: 'اليوم سنحاول أن نتأكد: هل للغاز حجم؟<br>لا تنسوا الإعجاب بالفيديو والاشتراك في القناة!',
          bubble: { x: '50%', y: 274, cls: 'bubble--tail-top icq-bubble--center' } },
        { id: 'yarden', img: 'assets/img/content/card-yarden.jpg', label: 'متابعين أعزاء، سنحاول اليوم أن نكتشف:<br>أي حيوان هو الأذكى في العالم؟',
          bubble: { x: '50%', y: 274, cls: 'bubble--tail-top icq-bubble--center' } }
      ],
      correct: 'mika',
      hint: { body: ['<b>كيف يمكن الإجابة على هذا السؤال؟</b>'] },
      feedback: {
        correct: { title: ['إجابة صحيحة!'], body: ['السؤال العلمي هو سؤال يمكن اختباره عن طريق الملاحظة أو التجربة.', 'في العلم لا يُكتفى بالآراء أو التفضيلات الشخصية، بل يُبحث عن إجابات يمكن إثباتها بالأدلة.'] },
        final:   { title: WRONG_FINAL,     body: ['السؤال العلمي هو سؤال يمكن اختباره عن طريق الملاحظة أو التجربة.', 'في العلم لا يُكتفى بالآراء أو التفضيلات الشخصية، بل يُبحث عن إجابات يمكن إثباتها بالأدلة.'] }
      },
      next: { part: '04' } }
  ]
};
