'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 05 — רכיב 5: שאלת שיא · methodica-science-mass-gas-01-05
   PPTX slides 51–57 (+ slide 69 END for passers).
   Peak question: 4 sections, hint after the first wrong attempt (producer decision 2026-10-04). Per producer decision
   (2026-10-04) the sections follow the original peak template: 2 attempts
   and immediate feedback per section (overrides the PPTX note "משוב בסיום
   כל הסעיפים"). The accumulated feedback slides 58/59 are dropped; their
   per-section explanations are the section popups. The slide 52 bubble
   ("תדעו אם צדקתם רק אחרי...") is dropped for the same reason.
   Routing from section ד: ≥3/4 → END (slide 69, duplicated in part 06 — §13 Q2);
            <3/4 → part 06 (second chance).
   The scenario screen (slide 53) has no hint button: the note
   "רמז מופיע תמיד" has no hint content on that slide (§13 Q10).
   ═══════════════════════════════════════════════════════════ */
const WRONG_FINAL = ['الإجابة غير صحيحة.', 'الإجابة الصحيحة معروضة.'];

window.PART = {
  part: '05',
  media: {
    characters: {
      default: { 'character-1': 'assets/img/character/character-1-default.gif', 'character-2': 'assets/img/character/character-2-default.png' },
      /* slide 52 — running toward the finish line (green_/purple_running.mp4), looping */
      'running-finish': { 'character-1': 'assets/img/character/character-1-running.mp4', 'character-2': 'assets/img/character/character-2-running.mp4' }
    }
  },
  series: {
    peak: { keys: ['a', 'b', 'c', 'd'], mode: 'scored', passThreshold: 3, nav: false }   // sub-parts of one question — no progress nav
  },
  hooks: {
    /* S1 — slide 53 · scenario (מסך ללא תבנית). Single composite image (מיכל + 3 steps) with
       zoom button (FullImageWithTextOverlay - C, Figma 982:10589); tooltip on "שסתום" (PPTX note, verbatim). */
    scenario: {
      render: () =>
        '<div class="ct-wrap">' +
          '<div class="ct-media" data-reveal="2">' +
            '<div class="zoomable" style="position:relative;width:560px;height:418px">' +
              '<img class="ct-composite" src="assets/img/content/michal-vacuum-bag.gif" alt="ميسون تسحب الهواء من الكيس الذي يحتوي على البطانية باستخدام مكنسة كهربائية، فيتقلص الكيس ليصبح حزمة مسطحة" style="width:100%;height:100%;display:block">' +
              '<button class="img-zoom-btn" type="button" data-zoom-src="assets/img/content/michal-vacuum-bag.gif" aria-label="تكبير الصورة">' +
                '<svg class="img-zoom-btn__icon" viewBox="0 0 20.7149 20.9231" fill="none" aria-hidden="true"><path d="M8 1C11.8661 1 15 4.13371 15 7.99902C15 11.8643 11.8661 14.998 8 14.998C4.1339 14.998 1 11.8643 1 7.99902C1 4.13371 4.13389 1 8 1Z" stroke="currentColor" stroke-width="2"/><path d="M12.6221 14.188L14.2657 12.6141L19.928 18.5274C20.3626 18.9813 20.347 19.7016 19.8931 20.1362C19.4392 20.5708 18.7189 20.5552 18.2843 20.1013L12.6221 14.188Z" fill="currentColor"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="ct-text" data-reveal="1">' +
            '<p>أرادت ميسون تخزين بطانية شتوية سميكة في الخزانة.<br/>' +
            'أدخلتها في كيس خاص به <span class="tip">صمام<button class="tip-btn" type="button" aria-expanded="false" aria-label="ما هو الصمام؟" data-tip="الصمام فتحة أحادية الاتجاه تسمح للهواء بالتدفق في اتجاه واحد فقط.">i</button></span><br>' +
            'لشفط الهواء والإحكام.<br>' +
            'هي وصّلت مكنسة كهربائية وشغّلتها - الكيس<br>' +
            'والبطانية تقلّصتا إلى حزمة رقيقة ومسطّحة.</p>' +
            '<p>عندما فتحت ميسون الكيس، دخل الهواء<br/>وعادت البطانية إلى حجمها الأصلي.</p>' +
          '</div>' +
        '</div>',
      /* the GIF plays 2 rounds only — restart it on every entry (screens are pre-rendered at load) */
      enter: (el) => {
        const img = el.querySelector('.ct-composite');
        if (img) img.src = 'assets/img/content/michal-vacuum-bag.gif?r=' + Date.now();
      }
    }
  },
  screens: [
    /* S0 — slide 52 · TransitionScreen (מסך הזנקה שאלת שיא). Looping clip: running near the finish line. */
    { key: 'intro', type: 'transition', pose: 'running-finish', loop: true,
      lines: [
        { role: 'lead', text: 'كلّ الاحترام!' },
        { role: 'lead', text: 'إذا لم تنجحوا في الإجابة بشكل صحيح عن بعض الأسئلة،' },
        { role: 'lead', text: 'من المهم أن تفهموا ما الذي ما زال غير واضح.' },
        { role: 'title', text: 'الآن يأتي السؤال الأهم' },
        { role: 'lead', text: 'تتكون من 4 بنود. عليكم النجاح في 3 منها على الأقل.' }
      ] },

    { key: 'scenario', type: 'content' },

    /* סעיף א — slide 54 */
    { key: 'a', type: 'scq', series: 'peak', hintPolicy: 'afterWrong', cls: 'q-wide',
      body: ['<b>البند أ:</b>', 'ما الذي جعل الكيس الذي يحتوي على البطانية يتحول إلى حزمة رقيقة ومسطحة بعد أن شفطت ميسون الهواء منه؟'],
      options: [
        { id: 'a', text: 'تقلَّصت البطانية نفسها أثناء الشفط، ولذلك احتلَّت الحزمة مساحة أقل' },
        { id: 'b', text: 'الهواء الذي كان محبوسًا داخل البطانية سُحب إلى الخارج، ولذلك تقلّص الحجم الذي كان يشغله' },
        { id: 'c', text: 'ألياف البطانية نفسها انكمشت أثناء عملية الشفط، ولذلك احتلت الحزمة مساحة أقل' },
        { id: 'd', text: 'الحرارة الناتجة أثناء عمل المكنسة الكهربائية (الشفاط) أدت إلى انكماش الهواء في العبوة' }
      ],
      correct: 'b',
      hint: { body: ['<b>ماذا كان يشغل حيزًا داخل البطانية نفسها؟</b>', 'ما الذي سبّبه ما فعلته ميسون؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['<b>تم سحب الهواء الذي بين ألياف البطانية إلى الخارج، والحجم الذي كان يشغله تقلّص.</b>', 'عندما سحبت ميسون الهواء إلى الخارج، لم تكن هناك مادة أخرى<br>تملأ مكانه، ولذلك تقلّص حجم العبوة.'] },
        final:   { title: WRONG_FINAL,   body: ['<b>تم سحب الهواء الذي بين ألياف البطانية إلى الخارج، والحجم الذي كان يشغله تقلّص.</b>', 'عندما سحبت ميسون الهواء إلى الخارج، لم تكن هناك مادة أخرى<br>تملأ مكانه، ولذلك تقلّص حجم العبوة.'] }
      } },

    /* סעיף ב — slide 55 */
    { key: 'b', type: 'scq', series: 'peak', hintPolicy: 'afterWrong', cls: 'q-wide',
      body: ['<b>البند ب:</b>', 'لماذا عادت البطانية إلى حجمها الأصلي بمجرد أن فتحت ميسون الكيس؟'],
      options: [
        { id: 'a', text: 'تَوقَّفَ عمل الشفّاط وعادت البطانية إلى شكلها الأصلي' },
        { id: 'b', text: '"تذكَّرت" البطانية شكلها الأصلي وتمددت من تلقاء نفسها' },
        { id: 'c', text: 'حرارة المكنسة الكهربائية جعلت البطانية تسخن وتنتفخ' },
        { id: 'd', text: 'عاد الهواء ليملأ كل الفراغات الفارغة داخل البطانية' }
      ],
      correct: 'd',
      hint: { body: ['ماذا دخل إلى الكيس في اللحظة التي فُتح فيها الصمام؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['<b>الهواء يملأ من جديد الفراغات بين ألياف البطانية.</b>', 'فتح الصمام جعل الهواء يدخل مرة أخرى إلى الكيس ويملأ الفراغات بين ألياف البطانية، ولذلك عادت إلى حجمها الأصلي.'] },
        final:   { title: WRONG_FINAL,   body: ['<b>الهواء يملأ من جديد الفراغات بين ألياف البطانية.</b>', 'فتح الصمام جعل الهواء يدخل مرة أخرى إلى الكيس ويملأ الفراغات بين ألياف البطانية، ولذلك عادت إلى حجمها الأصلي.'] }
      } },

    /* סעיף ג — slide 56 · SCQImage <מיכל ואורי> + אורי's claim bubble */
    { key: 'c', type: 'scq', series: 'peak', hintPolicy: 'afterWrong', cls: 'q-img-fit fb-wide',
      image: { src: 'assets/img/content/michal-ori.jpg', alt: 'ميسون وأمير بجانب كيس البطانية' },
      bubbles: [{ text: 'انكمش الكيس لأن شفط الهواء ضغط البطانية نفسها.', x: 49, y: 30, w: 46, cls: 'bubble--tail-top-left' }],   // tail just below אורי's mouth
      body: ['<b>البند ج:</b>', 'قدّم أمير، أخو ميسون الكبير، ادّعاءً بخصوص ما حدث.',
             '<b>أي من الجمل التالية صيغت كحجة علمية تدحض كلامه؟</b>'],
      options: [
        { id: 'a', text: 'لا يخفى على أحد أن سحب الهواء لا يغير ألياف البطانية، لذلك لا يمكن أن يكون أمير محقًا' },
        { id: 'b', text: 'لا أعتقد أنه من المنطقي أن تنكمش ألياف البطانية بسبب شفط الهواء، لذلك لا يمكن أن يكون ادعاء أمير صحيحًا' },
        { id: 'c', text: 'لو كانت البطانية تنكمش، لما كانت تعود إلى حجمها الأصلي عندما يعود الهواء، وبذلك تكون كمية الهواء بداخلها هي التي تغيّرت وليست هي نفسها.' },
        { id: 'd', text: 'يمكن التحقق مما يدّعيه أمير إذا قِسنا كتلة البطانية قبل الشفط وبعده' }
      ],
      correct: 'c',
      hint: { body: ['ما الذي يجب أن تتضمنه الحجة العلمية الجيدة؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['<b>لو كانت الألياف تتقلص، لما عادت البطانية إلى حجمها الأصلي<br>عندما يعود الهواء، ولذلك فإن الهواء هو الذي تغيّر وليس الألياف.</b>', 'يجب أن تتضمن الحجة العلمية الجيدة ادّعاءً، وأدلّة، وتبريرًا يربط بينهما.'] },
        final:   { title: WRONG_FINAL,   body: ['<b>لو كانت الألياف تتقلص، لما عادت البطانية إلى حجمها الأصلي<br>عندما يعود الهواء، ولذلك فإن الهواء هو الذي تغيّر وليس الألياف.</b>', 'يجب أن تتضمن الحجة العلمية الجيدة ادّعاءً، وأدلّة، وتبريرًا يربط بينهما.'] }
      } },

    /* סעיף ד — slide 57 · SCQ + data table */
    { key: 'd', type: 'scq', series: 'peak', hintPolicy: 'afterWrong', doneLabel: 'انتهيت', cls: 'q-table-screen q-wide-media', tableSlot: 'media',   // A1: table left, as on slide 57
      body: ['<b>البند د:</b>', 'عبّأت دانا 3 بطانيات متطابقة في 3 أكياس إغلاق خاصة، وفي كل مرة شفطت كمية مختلفة من الهواء.<br>' +
             'فيما يلي القياسات التي أجرتها بخصوص سُمك الحزمة التي تم الحصول عليها.', '<b>ماذا يمكن أن نستنتج من البيانات الموجودة في الجدول؟</b>'],
      table: { head: ['كمية الهواء التي تم شفطها من الكيس', 'سُمك الحزمة الناتجة بالسنتيمتر'],
               rows: [['ربع الهواء', '18'], ['نصف الهواء', '12'], ['تقريبًا كل الهواء', '4']] },
      options: [
        { id: 'a', text: 'سُمك الحزمة لا يتغير تقريبًا،<br>حتى عند سحب كميات مختلفة من الهواء' },
        { id: 'b', text: 'كلما سحبنا هواءً أكثر، أصبحت العبوة أرقّ، لأن الهواء كان يشغل جزءًا من حجمها' },
        { id: 'c', text: 'كلما سُحِب هواء أكثر أصبحت العبوة أكثر سماكة، لأنه يبقى مكان أكثر داخل الكيس' },
        { id: 'd', text: 'كلما سُحب هواء أكثر، انضغطت ألياف البطانية أكثر، ولذلك تصبح الحزمة أرق.' }
      ],
      correct: 'b',
      hint: { body: ['<b>قارنوا بين صفوف الجدول.</b>', 'ماذا يحدث كلما قلّت كمية الهواء؟'] },
      feedback: {
        correct: { title: ['صحيح جدًا‎!'], body: ['<b>كلما شُفط المزيد من الهواء، يصبح الكيس أرقّ لأن الهواء كان يشغل جزءًا من حجمه.</b>', 'يتبين من الجدول اتجاه واضح: كلما سحبنا هواءً أكثر، أصبحت العبوة أرق، لأن الهواء الموجود بداخلها يشغل حيزًا أقل.'] },
        final:   { title: WRONG_FINAL,   body: ['<b>كلما شُفط المزيد من الهواء، يصبح الكيس أرقّ لأن الهواء كان يشغل جزءًا من حجمه.</b>', 'يتبين من الجدول اتجاه واضح: كلما سحبنا هواءً أكثر، أصبحت العبوة أرق، لأن الهواء الموجود بداخلها يشغل حيزًا أقل.'] }
      },
      next: score => score >= 3 ? { complete: true } : { part: '06' } },
  ]
};
