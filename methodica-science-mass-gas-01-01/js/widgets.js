'use strict';
/* ═══════════════════════════════════════════════════════════
   Part 01 — custom interactive components (loaded before main.js).
     P01.twoOption   TwoOptionSelection (character / learning path)
     P01.toggle      learning-path toggle (position-locked, §13 C12)
     P01.tabs        observation tabs — sequential progress only (B4a)
     P01.widget1/2/3 "מסך יישומון" simulations (B4b: direct manipulation,
                     mechanics derived from each slide's PPTX notes)
     P01.flip        FlipCardsReveal (720-templates FlipCardsReveal.md)
     P01.dnd         ordered drag-and-drop, wrong drop snaps back (slide 22)
   The experiment apparatus is drawn as inline SVG placeholder art so the
   scripted physical behaviour can animate; swap for final artwork later
   without changing the state machines.
   ═══════════════════════════════════════════════════════════ */
window.P01 = (function () {
  const NS = 'http://www.w3.org/2000/svg';

  /* Pointer → SVG user space (robust to the #app scale transform). */
  function svgPt(svg, e) {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  /* Generic drag on an SVG element; cb.move(pt, start) / cb.end(pt, start). */
  function dragSvg(svg, el, cb) {
    el.addEventListener('pointerdown', e => {
      if (cb.enabled && !cb.enabled()) return;
      e.preventDefault(); e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const start = svgPt(svg, e);
      el.classList.add('wg-dragging');
      el._moved = false;
      const mv = ev => { const p = svgPt(svg, ev); if (Math.hypot(p.x - start.x, p.y - start.y) > 6) el._moved = true; cb.move && cb.move(p, start); };
      const up = ev => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('wg-dragging');
        cb.end && cb.end(svgPt(svg, ev), start);
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  const $ = (root, sel) => root.querySelector(sel);
  const setT = (el, x, y, r) => el.setAttribute('transform', 'translate(' + x + ' ' + y + ')' + (r ? ' rotate(' + r + ')' : ''));
  const anim = (dur, step, done) => {
    const t0 = performance.now();
    const f = now => { const k = Math.min(1, (now - t0) / dur); step(k); if (k < 1) requestAnimationFrame(f); else if (done) done(); };
    requestAnimationFrame(f);
  };
  const ease = k => 1 - Math.pow(1 - k, 3);

  /* ─── TwoOptionSelection ─────────────────────────────────── */
  function twoOption(cfg) {
    // DOM order is LTR (T6 .option-cards direction:ltr): cfg.cards = [left, right]
    return '<div class="select-content">' +
      '<div class="select-head" data-reveal="1"><h1 class="select-title">' + cfg.title + '</h1><p class="select-subtitle">' + cfg.subtitle + '</p></div>' +
      '<div class="option-cards" role="radiogroup" aria-label="' + cfg.subtitle + '" data-reveal="2" data-reveal-fade>' +
      cfg.cards.map(c => '<div class="option-card" role="radio" aria-checked="false" tabindex="0" data-value="' + c.value + '" aria-label="' + c.aria + '">' +
        '<div class="option-card-img">' + (c.char ? '<div class="char-select-slot" data-char="' + c.char + '"></div>'   /* fixed character, filled by the hook — not the engine's selected-character slot */
          : c.pose ? '<div class="char-slot" data-pose="' + c.pose + '"></div>' : '') + '</div>' +
        (c.label ? '<div class="option-card-labels"><span class="option-card-name">' + c.label + '</span></div>' : '') + '</div>').join('') +
      '</div></div>';
  }
  function twoOptionWire(el, api, current, onPick) {
    const cards = el.querySelectorAll('.option-card');
    const paint = v => cards.forEach(c => { const on = c.dataset.value === v; c.classList.toggle('selected', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); });
    paint(current);
    api.enableContinue(el, !!current);
    if (el._wired) return; el._wired = true;
    cards.forEach(c => {
      const pick = () => { onPick(c.dataset.value); paint(c.dataset.value); api.enableContinue(el, true); };
      c.addEventListener('click', pick);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }

  /* ─── Learning-path toggle (fixed: לנסות בעצמי right, לצפות בסרטון left) ─── */
  function toggle() {
    return '<div class="path-toggle" role="radiogroup" aria-label="طريقة التعلم">' +
      '<button type="button" class="path-toggle__opt" role="radio" data-path="hands-on">أن أجرب بنفسي</button>' +
      '<button type="button" class="path-toggle__opt" role="radio" data-path="video">مشاهدة فيديو</button>' +
      '<span class="path-toggle__pill" aria-hidden="true"></span></div>';
  }
  /* Entry sync renders from authoritative state with transitions
     suppressed; a live click animates (720 "Learning-path toggle"). */
  function toggleSync(el, api, starts, screenPath) {
    const t = $(el, '.path-toggle'); if (!t) return;
    /* A6: the active pill is the path this screen belongs to (PPTX: slide 11
       video pill, slides 15–21 hands-on pill), never a stale stored value. */
    if (screenPath && window.lomdaState.learningPath !== screenPath) api.setLearningPath(screenPath);
    const path = screenPath || window.lomdaState.learningPath || 'hands-on';
    t.classList.add('no-anim'); t.dataset.active = path;
    t.querySelectorAll('.path-toggle__opt').forEach(b => b.setAttribute('aria-checked', b.dataset.path === path ? 'true' : 'false'));
    void t.offsetWidth; t.classList.remove('no-anim');
    if (t._wired) return; t._wired = true;
    t.addEventListener('click', e => {
      const b = e.target.closest('.path-toggle__opt'); if (!b) return;
      const p = b.dataset.path; if (p === window.lomdaState.learningPath) return;
      api.setLearningPath(p); t.dataset.active = p;
      setTimeout(() => api.goTo(api.indexOf(starts[p])), 260);
    });
  }

  /* ─── Observation tabs (sequential, progress only) ─── */
  function tabs(active) {
    return '<ol class="obs-tabs" aria-label="ملاحظات">' + [1, 2, 3].map(n =>
      '<li class="obs-tab" data-n="' + n + '"' + (n === active ? ' aria-current="step"' : '') + '>ملاحظة ' + n + '</li>').join('') + '</ol>';
  }
  function tabsSync(el, done) {   // done = Set of completed observation numbers
    el.querySelectorAll('.obs-tab').forEach(t => {
      const n = +t.dataset.n;
      t.classList.toggle('is-done', done.has(n));
      t.classList.toggle('is-current', t.hasAttribute('aria-current'));
    });
  }

  /* ═══════════════════════════════════════════════════════════
     WIDGET 1 — slides 16+17 (one screen, two phases).
     Phase A: drag the blue flask onto the funnel → it pours → water
     fills the funnel only and spills over (sealed joint, air trapped).
     Phase B: drag the cork off the side arm (the trapped funnel water
     drains) → drag the flask again → the bottle fills.
     Art: real photos (assets/img/content/w1-*). w1-scene.jpg is the lab
     table built from the apparatus photo (cork, hand and watermark
     retouched out; wall and table extended past the viewBox so meet-
     letterboxing never shows an edge). The cork is its own image on top.
     Water is drawn in the apparatus photo's own pixel space (group P,
     = the 730×984 crop at photo x330 y140) with multiply blend.
     ═══════════════════════════════════════════════════════════ */
  const W1 = {
    state: { phase: 0 },        // 0 pour#1 · 1 remove cork · 2 pour#2 · 3 done
    STEPS: ['1. اسكبوا الماء داخل قنينة الزجاج:', '2. الآن، أزيلوا السدادة الموجودة في طرف ذراع الزجاج الجانبية وحاولوا مرة أخرى.'],
    P: { x: 353.8, y: 92.4, s: 0.66 },    // apparatus crop placement inside w1-scene (viewBox units)
    HOME: { x: 1010, y: 703 },            // flask bottom-centre on the stage floor
    MOUTH: { x: -1, y: -221 },            // flask mouth relative to its bottom-centre
    POUR: { x: 851, y: 80, r: -100 },     // tilted pose: mouth lands over the funnel
    CORK: { x: 623, y: 496 }, CORK_OFF: { x: 680, y: 880, r: 80 },   // photo px
    FUNNEL_Y: [255, 68], BOTTLE_Y: [905, 862, 640],                   // photo px levels
    render() {
      const P = this.P, C = this.CORK, img = 'assets/img/content/';
      const BOTTLE = 'M255 440 L372 440 L510 820 C518 850 514 878 488 892 C440 905 190 905 142 892 C116 878 110 850 118 820 Z';
      const FUN = 'M118 68 L508 68 L352 255 L258 255 Z';
      return '<div class="wg-wrap wg-wrap--w1">' +
        '<ol class="wg-steps wg-steps--staged">' + this.STEPS.map((t, k) => '<li data-step="' + (k + 1) + '">' + t + '</li>').join('') + '</ol>' +
        '<div class="wg-stage wg-stage--w1">' +
        '<svg class="wg-svg wg-svg--w1" viewBox="0 0 1400 750" role="img" aria-label="قنينة زجاجية مع قمع موصل بإحكام، وذراع جانبية مع سدادة من الفلين، ووعاء فيه ماء أزرق">' +
          '<defs>' +
            /* liquid: deep blue body (matches the flask photo), darker toward the
               glass walls, a lit surface ellipse at the level (perspective) */
            '<linearGradient id="w1-water-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a66ff"/><stop offset="1" stop-color="#0a2cc0"/></linearGradient>' +
            '<linearGradient id="w1-surf-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c3ff"/><stop offset="1" stop-color="#3f74ff"/></linearGradient>' +
            '<filter id="w1-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>' +
            '<clipPath id="w1-blevel"><rect data-w1-bwater x="0" y="905" width="730" height="0"/></clipPath>' +
            '<clipPath id="w1-flevel"><rect data-w1-fwater x="0" y="255" width="730" height="0"/></clipPath>' +
            '<clipPath id="w1-funnel-clip"><path d="' + FUN + '"/></clipPath>' +
            '<clipPath id="w1-bottle-clip"><path d="' + BOTTLE + '"/></clipPath>' +
          '</defs>' +
          '<image href="' + img + 'w1-scene.jpg" x="-300" y="-150" width="2000" height="1050" class="wg-w1-scene"/>' +
          '<g transform="translate(' + P.x + ' ' + P.y + ') scale(' + P.s + ')">' +
            '<g clip-path="url(#w1-bottle-clip)">' +
              '<g clip-path="url(#w1-blevel)" class="wg-w1-liquid"><rect x="90" y="420" width="450" height="510" class="wg-w1-water"/><path d="' + BOTTLE + '" class="wg-w1-edge"/></g>' +
              '<ellipse data-w1-bsurf class="wg-w1-surface"/></g>' +
            '<rect data-w1-stem x="292" y="258" width="36" height="0" class="wg-w1-water wg-w1-liquid"/>' +
            '<g clip-path="url(#w1-funnel-clip)">' +
              '<g clip-path="url(#w1-flevel)" class="wg-w1-liquid"><rect x="100" y="60" width="430" height="200" class="wg-w1-water"/><path d="' + FUN + '" class="wg-w1-edge"/></g>' +
              '<ellipse data-w1-fsurf class="wg-w1-surface"/></g>' +
            '<g data-w1-spill opacity="0">' +
              /* overflow = water leaking OUT: a wet lip over the rim, drops falling
                 off both rim edges (left → straight to the counter; right → onto
                 the side arm, then dripping off its underside), and a puddle
                 spreading round the base (masked off the bottle itself). */
              '<ellipse data-w1-rim cx="313" cy="57" rx="210" ry="14" class="wg-w1-wetrim"/>' +
              '<g data-w1-drips>' +
                [[98, 66, 'long', 0], [101, 66, 'long', 0.16], [97, 66, 'long', 0.33], [100, 66, 'long', 0.49],
                 [524, 66, 'mid', 0.05], [521, 66, 'mid', 0.19], [525, 66, 'mid', 0.33],
                 [530, 560, 'low', 0.1], [527, 560, 'low', 0.27], [531, 560, 'low', 0.41]]
                  .map(([x, y, k, d]) => '<g class="wg-w1-drip wg-w1-drip--' + k + '" style="animation-delay:' + d + 's">' +
                    '<path d="M' + x + ' ' + (y - 13) + ' C' + (x + 8) + ' ' + (y - 2) + ' ' + (x + 10) + ' ' + (y + 9) + ' ' + x + ' ' + (y + 11) + ' C' + (x - 10) + ' ' + (y + 9) + ' ' + (x - 8) + ' ' + (y - 2) + ' ' + x + ' ' + (y - 13) + ' Z" class="wg-w1-drop"/>' +
                    '<circle cx="' + (x - 3) + '" cy="' + (y + 1) + '" r="2.4" class="wg-w1-drop-hl"/></g>').join('') +
              '</g>' +
              '<mask id="w1-pud-mask" maskUnits="userSpaceOnUse" x="-100" y="800" width="900" height="250"><rect x="-100" y="800" width="900" height="250" fill="#fff"/>' +
                '<path d="M118 820 C112 860 124 902 152 916 L478 916 C506 902 518 860 512 820 Z" fill="#000"/></mask>' +
              '<g mask="url(#w1-pud-mask)"><ellipse data-w1-pud cx="315" cy="928" data-rx="290" data-ry="20" class="wg-w1-puddle"/>' +
                '<ellipse data-w1-pudhl cx="300" cy="924" data-rx="230" data-ry="9" class="wg-w1-puddle-hl"/></g>' +
            '</g>' +
            '<g data-w1-cork class="wg-grab" role="button" aria-label="سدادة الفلّين" tabindex="-1" transform="translate(' + C.x + ' ' + C.y + ')">' +
              '<image href="' + img + 'w1-cork.png" x="-50" y="-50" width="101" height="100"/></g>' +
          '</g>' +
          '<g data-w1-label>' +
            '<foreignObject x="10" y="240" width="285" height="130"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label">قمع متصل بشكل محكم <b>تمامًا</b> بالقنينة.</p></foreignObject>' +
            '<path d="M300 290 L506 286" class="wg-w1-arrow"/><path d="M488 270 L514 286 L489 302" class="wg-w1-arrow"/>' +
            /* "אוויר" — the lower part of the glass bottle */
            '<foreignObject x="170" y="590" width="130" height="60"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">هواء</p></foreignObject>' +
            '<path d="M310 620 L486 640" class="wg-w1-arrow"/><path d="M466 622 L494 641 L462 654" class="wg-w1-arrow"/>' +
          '</g>' +
          '<path data-w1-stream d="M634 121 C618 130 594 146 582 209" class="wg-stream wg-w1-stream" opacity="0"/>' +
          '<rect data-w1-drop x="310" y="-10" width="510" height="330" rx="24" class="wg-dropzone"/>' +
          '<g data-w1-flask class="wg-grab">' +
            '<ellipse cx="0" cy="0" rx="78" ry="8" class="wg-w1-shadow"/>' +
            '<image data-w1-flask-full href="' + img + 'w1-flask-full.png" x="-90" y="-223" width="180" height="223"/>' +
            '<image data-w1-flask-empty href="' + img + 'w1-flask-empty.png" x="-90" y="-223" width="180" height="223" opacity="0"/>' +
          '</g>' +
          /* "מים" — the blue water in the flask (hidden while the flask is moved) */
          '<g data-w1-water-label class="wg-w2-noptr">' +
            '<foreignObject x="1200" y="540" width="130" height="60"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">ماء</p></foreignObject>' +
            '<path d="M1192 570 L1080 630" class="wg-w1-arrow"/><path d="M1090 608 L1073 634 L1104 633" class="wg-w1-arrow"/>' +
          '</g>' +
        '</svg></div>' +
        '</div>';
    },
    /* inner walls at height y (photo px) → [left, right]; used to size the surface ellipse */
    WALLS: {
      '[data-w1-bwater]': { surf: '[data-w1-bsurf]', at: y => [255 - (y - 440) * 137 / 380, 372 + (y - 440) * 138 / 380] },
      '[data-w1-fwater]': { surf: '[data-w1-fsurf]', at: y => [118 + (y - 68) * 140 / 187, 508 - (y - 68) * 156 / 187] }
    },
    level(el, sel, top, base) {   // liquid from base (bottom) up to top, in photo px
      const r = $(el, sel), h = Math.max(0, base - top); r.setAttribute('y', Math.min(top, base)); r.setAttribute('height', h);
      const w = this.WALLS[sel]; if (!w) return;
      const s = $(el, w.surf), [l, rr] = w.at(top), rx = Math.max(0, (rr - l) / 2);
      s.style.display = h > 4 ? '' : 'none';
      s.setAttribute('cx', (l + rr) / 2); s.setAttribute('cy', top); s.setAttribute('rx', rx); s.setAttribute('ry', Math.min(rx * 0.085, h));
    },
    paint(el) {
      const st = this.state, F = this.FUNNEL_Y, B = this.BOTTLE_Y;
      const step = st.phase === 0 ? 1 : st.phase < 3 ? 2 : 3;   // staged like widget 3: each step appears under the previous one
      el.querySelectorAll('.wg-steps li').forEach(li => {
        const n = +li.dataset.step;
        li.classList.toggle('is-shown', n <= step); li.classList.toggle('is-current', n === step); li.classList.toggle('is-done', n < step);
      });
      $(el, '[data-w1-label]').style.visibility = st.phase === 0 ? 'visible' : 'hidden';
      $(el, '[data-w1-water-label]').style.visibility = st.phase === 0 ? 'visible' : 'hidden';
      const cork = $(el, '[data-w1-cork]');
      cork.classList.toggle('wg-grab-on', st.phase === 1);
      cork.setAttribute('tabindex', st.phase === 1 ? '0' : '-1');
      if (st.phase >= 2) setT(cork, this.CORK_OFF.x, this.CORK_OFF.y, this.CORK_OFF.r); else setT(cork, this.CORK.x, this.CORK.y);
      /* A12: the spill streams only show during the spill animation */
      $(el, '[data-w1-spill]').setAttribute('opacity', 0);
      this.level(el, '[data-w1-fwater]', st.phase === 1 ? F[1] : F[0], F[0]);
      this.level(el, '[data-w1-bwater]', st.phase === 3 ? B[2] : st.phase === 2 ? B[1] : B[0], B[0]);
      this.level(el, '[data-w1-stem]', 300, 300);
      const flask = $(el, '[data-w1-flask]');
      setT(flask, this.HOME.x, this.HOME.y);
      $(el, '[data-w1-flask-full]').setAttribute('opacity', st.phase === 3 ? 0 : 1);
      $(el, '[data-w1-flask-empty]').setAttribute('opacity', st.phase === 3 ? 1 : 0);
      flask.classList.toggle('wg-grab-on', st.phase === 0 || st.phase === 2);
      $(el, '[data-w1-drop]').classList.remove('is-hot');
    },
    wire(el, api) {
      const svg = $(el, '.wg-svg'), flask = $(el, '[data-w1-flask]'), cork = $(el, '[data-w1-cork]'), drop = $(el, '[data-w1-drop]');
      const st = this.state, self = this, H = this.HOME, M = this.MOUTH, P = this.P, waterLabel = $(el, '[data-w1-water-label]');
      /* hit = the flask's mouth OR body is anywhere in the column above the
         funnel (no upper bound: lifting the flask high still counts) */
      const inCol = (x, y) => x > 300 && x < 830 && y < 330;
      const overFunnel = (p, s) => { const bx = H.x + p.x - s.x, by = H.y + p.y - s.y; return inCol(bx + M.x, by + M.y) || inCol(bx, by + M.y / 2); };
      let busy = false;
      dragSvg(svg, flask, {
        enabled: () => !busy && (st.phase === 0 || st.phase === 2),
        move(p, s) { setT(flask, H.x + p.x - s.x, H.y + p.y - s.y); drop.classList.add('is-armed'); drop.classList.toggle('is-hot', overFunnel(p, s)); waterLabel.style.visibility = 'hidden'; },
        end(p, s) {
          drop.classList.remove('is-hot', 'is-armed');
          if (!overFunnel(p, s)) { setT(flask, H.x, H.y); self.paint(el); return; }   // missed → back to the table
          busy = true;
          self.pour(el, st.phase === 0 ? 'spill' : 'fill', () => {
            st.phase = st.phase === 0 ? 1 : 3; busy = false; self.paint(el);
            if (st.phase === 3) { api.enableContinue(el, true); window.P01.obsDone(1); }
          });
        }
      });
      /* Cork (decision B10): drag it off OR click it — a discrete action.
         Once it is off, the water held up in the funnel drains in. */
      const C = this.CORK, OFF = this.CORK_OFF, F = this.FUNNEL_Y, B = this.BOTTLE_Y;
      let corkBusy = false;
      const popCork = (fx, fy) => {
        if (corkBusy || st.phase !== 1) return; corkBusy = true;
        fx = fx == null ? C.x : fx; fy = fy == null ? C.y : fy;
        anim(450, k => setT(cork, fx + (OFF.x - fx) * ease(k), fy + (OFF.y - fy) * ease(k), OFF.r * k), () => {
          self.level(el, '[data-w1-stem]', 300, 620);
          anim(1300, k => { self.level(el, '[data-w1-fwater]', F[1] + (F[0] - F[1]) * k, F[0]); self.level(el, '[data-w1-bwater]', B[0] - (B[0] - B[1]) * k, B[0]); },
            () => { corkBusy = false; st.phase = 2; self.paint(el); });
        });
      };
      dragSvg(svg, cork, {
        enabled: () => st.phase === 1 && !corkBusy,
        move(p, s) { setT(cork, C.x + (p.x - s.x) / P.s, C.y + (p.y - s.y) / P.s); },
        end(p, s) {
          const d = Math.hypot(p.x - s.x, p.y - s.y);
          if (d < 6 || d >= 40) { popCork(C.x + (p.x - s.x) / P.s, C.y + (p.y - s.y) / P.s); return; }   // click, or pulled off far enough
          setT(cork, C.x, C.y);                                                                           // short drag → snaps back
        }
      });
      cork.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); popCork(); } });
    },
    pour(el, mode, done) {
      const flask = $(el, '[data-w1-flask]'), stream = $(el, '[data-w1-stream]'), sp = $(el, '[data-w1-spill]'),
            full = $(el, '[data-w1-flask-full]'), empty = $(el, '[data-w1-flask-empty]'),
            F = this.FUNNEL_Y, B = this.BOTTLE_Y, T = this.POUR, H = this.HOME, self = this;
      setT(flask, T.x, T.y, T.r); flask.classList.add('is-pouring');
      stream.setAttribute('opacity', 1);
      const back = () => { stream.setAttribute('opacity', 0); setT(flask, H.x, H.y); flask.classList.remove('is-pouring'); };
      if (mode === 'spill') {
        const rim = $(el, '[data-w1-rim]'), drips = $(el, '[data-w1-drips]'), pud = el.querySelectorAll('[data-w1-pud], [data-w1-pudhl]');
        const flow = k => {
          rim.setAttribute('opacity', Math.min(1, k * 5));                         // water rises over the lip…
          drips.style.display = k > 0.05 ? '' : 'none';                            // …and drips off the edges
          const q = ease(Math.max(0, (k - 0.3) / 0.7));                            // the puddle spreads round the base
          pud.forEach(p => { p.setAttribute('rx', p.dataset.rx * q); p.setAttribute('ry', p.dataset.ry * q); });
        };
        flow(0);
        anim(1400, k => self.level(el, '[data-w1-fwater]', F[0] - (F[0] - F[1]) * k, F[0]), () => {
          sp.setAttribute('opacity', 1);
          anim(2400, flow, () => {
            back();
            setTimeout(() => anim(900, k => sp.setAttribute('opacity', 1 - k), done), 1100);   // A12: the overflow clears after the spill
          });
        });
      } else {
        self.level(el, '[data-w1-stem]', 300, 620);
        anim(2200, k => {
          self.level(el, '[data-w1-fwater]', F[0] - 60 * Math.sin(Math.PI * k), F[0]);   // water passes through the funnel
          self.level(el, '[data-w1-bwater]', B[1] - (B[1] - B[2]) * k, B[0]);
          full.setAttribute('opacity', 1 - k); empty.setAttribute('opacity', k);
        }, () => { back(); done(); });
      }
    }
  };

  /* ═══════════════════════════════════════════════════════════
     WIDGET 2 — slide 18 (6 staged steps, like widget 3). Paper boat · cup · bowl of water.
     1 drag the boat into the cup (sticks to the bottom)
     2 turn the cup over (click the rotate button) and drag it into the bowl
       STRAIGHT — the button flips it upright ↔ inverted; trapped air
       keeps the water out
     3 drag the cup out, click it → the boat pops out onto the table, dry;
       the cup turns upright again by itself
     4 stick the boat back in
     5 turn the cup over and dip it TILTED — in this step the button
       turns it over on a tilt (straight is not possible); air bubbles out and
       the water fills the cup up to the boat
     6 drag the cup out, click it → the boat pops out wet, crumpled, dripping
       (a few drips, then it stops)
     Art: real photos (assets/img/content/w2-*). w2-scene.jpg is the bowl
     photo (AI watermark retouched out) with the lab table extended to the
     right; the SVG works in its pixel space. The glass is a white-ground
     cut-out drawn with multiply so it reads as transparent. The cup is
     two groups with one transform: back (boat inside) and front (glass),
     with the cup water between them.
     ═══════════════════════════════════════════════════════════ */
  const W2 = {
    state: { step: 1, rot: 0, inBowl: false, boat: 'table' },   // boat: table|cup|out-dry|out-wet
    STEPS: ['1. ألصقوا قارب الورق بقاع الكوب.',
            '2. اقلبوا الكوب وأدخلوه في وعاء الماء بشكل مستقيم.',
            '3. أخرجوا الكوب، اضغطوا على القارب وتحققوا - هل ابتلّ؟',
            '4. ألصقوا القارب مرة أخرى بقاع الكوب.',
            '5. اقلبوا الكوب وأدخلوه مرة أخرى في وعاء الماء. هذه المرة أدخلوه مائلًا على الجانب.',
            '6. أخرجوا الكوب، اضغطوا على القارب وتحققوا - هل ابتلّ؟'],
    S: 0.58,                                   // cup photo (294×383) → scene px
    IN: [[12, 30], [282, 30], [252, 296], [42, 296]],   // cup interior in cup-photo px (mouth first)
    BOAT_IN: 35,                               // boat centre inside the cup (local y, stuck to the floor)
    HOME: { x: 930, y: 849 }, BOWL: { x: 505, y: 752 },
    LAND: { x: 1105, y: 937 }, TABLE: { x: 1160, y: 935 },
    KNOB: { x: 1052, y: 700 },
    /* the bowl's water body in scene px (surface ≈ y 728) */
    WATER: 'M262 728 C330 716 680 716 748 728 L750 742 C746 800 734 842 710 872 C678 916 620 946 505 950 C390 946 332 916 300 872 C276 842 264 800 260 742 Z',
    render() {
      const img = 'assets/img/content/', S = this.S;
      const inPath = 'M' + this.IN.map(p => p.join(' ')).join(' L') + ' Z';
      let bubbles = '';
      for (let k = 0; k < 7; k++) bubbles += '<circle class="wg-w2-bubble" r="' + (5 + (k % 3) * 2) + '" cx="' + ((k % 4) * 9 - 14) + '" cy="0" style="animation-delay:' + (k * 0.17).toFixed(2) + 's"/>';
      return '<div class="wg-wrap wg-wrap--w2">' +
        '<ol class="wg-steps wg-steps--staged">' + this.STEPS.map((t, k) => '<li data-step="' + (k + 1) + '">' + t + '</li>').join('') + '</ol>' +
        '<div class="wg-stage wg-stage--w2">' +
        '<svg class="wg-svg" viewBox="200 616 1070 464" preserveAspectRatio="xMidYMid slice" role="img" aria-label="قصعة ماء، كوب زجاجي، وقارب ورقي على طاولة المختبر">' +
          '<defs>' +
            '<clipPath id="w2-water-clip"><path d="' + this.WATER + '"/></clipPath>' +
            '<clipPath id="w2-cup-clip"><path data-w2-clip d="' + inPath + '"/></clipPath>' +
          '</defs>' +
          '<image href="' + img + 'w2-scene.jpg" x="0" y="0" width="1522" height="1175" class="wg-w1-scene"/>' +
          /* cup — back: the boat stuck to its floor */
          '<g data-w2-cupback class="wg-w2-noptr">' +
            '<image data-w2-boatin href="' + img + 'w2-boat.png" x="-60" y="' + (this.BOAT_IN - 25.5) + '" width="120" height="51"/>' +
            '<image data-w2-boatin-wet href="' + img + 'w2-boat-wet.png" x="-57" y="' + (this.BOAT_IN - 23) + '" width="114" height="46" opacity="0"/>' +
          '</g>' +
          /* water inside the cup (scene coords, level stays horizontal) */
          '<rect data-w2-cupwater x="200" y="1100" width="1000" height="0" clip-path="url(#w2-cup-clip)" class="wg-w2-water wg-w2-noptr"/>' +
          /* cup — front: the glass (drag / click target) */
          '<g data-w2-cup class="wg-grab">' +
            '<g class="wg-w2-glass" transform="scale(' + S + ') translate(-147 -191.5)"><image href="' + img + 'w2-cup.png" width="294" height="383"/></g>' +
          '</g>' +
          /* the bowl water tints whatever is submerged in it */
          '<rect x="200" y="650" width="700" height="350" clip-path="url(#w2-water-clip)" class="wg-w2-water wg-w2-tint wg-w2-noptr"/>' +
          /* trapped air: the submerged part of the cup interior stays clear */
          '<g clip-path="url(#w2-water-clip)" class="wg-w2-noptr"><rect data-w2-air x="200" y="600" width="1000" height="500" clip-path="url(#w2-cup-clip)" class="wg-w2-air" opacity="0"/></g>' +
          '<g data-w2-bubbles class="wg-w2-noptr" style="display:none">' + bubbles + '</g>' +
          /* rotate button — fixed beside the cup; a click turns the cup over */
          '<g data-w2-rot class="wg-rot" role="button" aria-label="قَلب الكوب" transform="translate(' + this.KNOB.x + ' ' + this.KNOB.y + ') scale(1.5)">' +
            '<circle r="18" class="wg-rot-knob"/><path d="M-7 -3 A8 8 0 1 1 -3 7" class="wg-rot-arrow"/><path d="M-9 -8 L-7 -2 L-1 -4" class="wg-rot-arrow"/></g>' +
          /* boat on the table (start / popped out) */
          '<g data-w2-boat class="wg-grab"><g>' +
            '<rect x="-70" y="-40" width="140" height="80" fill="transparent"/>' +
            '<image data-w2-boat-dry href="' + img + 'w2-boat.png" x="-60" y="-25.5" width="120" height="51"/>' +
            '<image data-w2-boat-wet href="' + img + 'w2-boat-wet.png" x="-57" y="-23" width="114" height="46" opacity="0"/>' +
            '<g data-w2-drips style="display:none"><path d="M-52 -6 l0 9" class="wg-drip"/><path d="M-4 8 l0 9" class="wg-drip"/><path d="M50 -6 l0 9" class="wg-drip"/></g>' +
          '</g></g>' +
          '<ellipse data-w2-bowlzone cx="505" cy="790" rx="275" ry="180" class="wg-dropzone"/>' +
          /* labels, like widget 1 (step 1 only; hidden while the boat is dragged) */
          '<g data-w2-labels class="wg-w2-noptr">' +
            '<foreignObject x="760" y="652" width="90" height="46"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">ماء</p></foreignObject>' +
            '<path d="M790 700 L700 776" class="wg-w1-arrow"/><path d="M704 754 L694 781 L722 775" class="wg-w1-arrow"/>' +
            '<foreignObject x="1010" y="652" width="96" height="46"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">هواء</p></foreignObject>' +
            '<path d="M1040 700 L958 790" class="wg-w1-arrow"/><path d="M961 767 L953 795 L980 786" class="wg-w1-arrow"/>' +
            '<foreignObject x="1105" y="780" width="140" height="46"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">قارب ورقي</p></foreignObject>' +
            '<path d="M1175 828 L1166 892" class="wg-w1-arrow"/><path d="M1155 873 L1165 899 L1178 875" class="wg-w1-arrow"/>' +
          '</g>' +
        '</svg></div></div>';
    },
    /* cup pose: centre + rotation; a tilted cup at home is lifted off the table */
    cupPose() {
      const st = this.state;
      if (st.inBowl) return { x: this.BOWL.x, y: this.BOWL.y, r: st.rot };
      return { x: this.HOME.x, y: this.HOME.y - 40 * Math.abs(Math.sin(st.rot * Math.PI / 180)), r: st.rot };
    },
    /* cup-local (scaled) point → scene point */
    toScene(c, lx, ly) {
      const a = c.r * Math.PI / 180;
      return { x: c.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.y + lx * Math.sin(a) + ly * Math.cos(a) };
    },
    interior(c) { const S = this.S; return this.IN.map(p => this.toScene(c, (p[0] - 147) * S, (p[1] - 191.5) * S)); },
    setCup(el, c) {
      const tr = 'translate(' + c.x + ' ' + c.y + ') rotate(' + c.r + ')';
      $(el, '[data-w2-cupback]').setAttribute('transform', tr);
      $(el, '[data-w2-cup]').setAttribute('transform', tr);
      $(el, '[data-w2-clip]').setAttribute('transform', tr + ' scale(' + this.S + ') translate(-147 -191.5)');
      el._w2cup = c;
    },
    cupWater(el, top) {   // scene y of the water surface inside the cup; null = empty
      const w = $(el, '[data-w2-cupwater]');
      if (top == null) { w.setAttribute('height', 0); return; }
      w.setAttribute('y', top); w.setAttribute('height', Math.max(0, 1100 - top));
    },
    moveCup(el, to, dur, done) {
      const from = el._w2cup || to, self = this;
      anim(dur, k => { const e = ease(k); self.setCup(el, { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, r: from.r + (to.r - from.r) * e }); }, done);
    },
    paint(el) {
      const st = this.state;
      if (st.step === 4 && st.rot !== 0) st.rot = 0;          // the cup turns upright after the first check
      el.querySelectorAll('.wg-steps li').forEach(li => {
        const n = +li.dataset.step;
        li.classList.toggle('is-shown', n <= st.step); li.classList.toggle('is-current', n === st.step); li.classList.toggle('is-done', n < st.step);
      });
      const c = this.cupPose(); this.setCup(el, c);
      const inCup = st.boat === 'cup', wetIn = st.step >= 6;
      $(el, '[data-w2-boatin]').setAttribute('opacity', inCup && !wetIn ? 1 : 0);
      $(el, '[data-w2-boatin-wet]').setAttribute('opacity', inCup && wetIn ? 1 : 0);
      const cup = $(el, '[data-w2-cup]');
      cup.classList.toggle('wg-grab-on', [2, 3, 5, 6].includes(st.step));
      /* boat outside the cup: on the table (start), or landed beside the cup after the check */
      const boat = $(el, '[data-w2-boat]'), out = st.boat === 'out-dry' || st.boat === 'out-wet';
      boat.style.display = inCup ? 'none' : '';
      const at = out ? this.LAND : this.TABLE; setT(boat, at.x, at.y);
      boat.classList.toggle('wg-grab-on', (st.step === 1 && st.boat === 'table') || (st.step === 4 && st.boat === 'out-dry'));
      $(el, '[data-w2-boat-dry]').setAttribute('opacity', st.boat === 'out-wet' ? 0 : 1);
      $(el, '[data-w2-boat-wet]').setAttribute('opacity', st.boat === 'out-wet' ? 1 : 0);
      const drips = $(el, '[data-w2-drips]');
      drips.style.display = st.boat === 'out-wet' ? '' : 'none';
      drips.querySelectorAll('.wg-drip').forEach((d, k) => { d.classList.add('is-dripping'); d.style.animationDelay = (k * 0.3) + 's'; });
      /* straight dip (step 3 in the bowl): trapped air keeps the water out */
      $(el, '[data-w2-air]').setAttribute('opacity', st.inBowl && st.step === 3 ? 1 : 0);
      this.cupWater(el, st.inBowl && st.step === 6 ? Math.min(...this.interior(c).map(p => p.y)) - 4 : null);
      $(el, '[data-w2-bubbles]').style.display = 'none';
      $(el, '[data-w2-rot]').style.display = (st.step === 2 || st.step === 5) && !st.inBowl && inCup ? '' : 'none';
      $(el, '[data-w2-bowlzone]').classList.remove('is-hot');
      $(el, '[data-w2-labels]').style.visibility = st.step === 1 ? 'visible' : 'hidden';
    },
    wire(el, api) {
      const svg = $(el, '.wg-svg'), st = this.state, self = this;
      const cup = $(el, '[data-w2-cup]'), rot = $(el, '[data-w2-rot]'), boat = $(el, '[data-w2-boat]'), zone = $(el, '[data-w2-bowlzone]');
      const inBowlZone = q => ((q.x - 505) / 275) ** 2 + ((q.y - 790) / 180) ** 2 < 1;
      const nearCup = q => Math.abs(q.x - self.HOME.x) < 110 && Math.abs(q.y - self.HOME.y) < 150;
      let busy = false;
      /* boat → cup (steps 1 and 4; the cup is upright then) */
      dragSvg(svg, boat, {
        enabled: () => !busy && ((st.step === 1 && st.boat === 'table') || (st.step === 4 && st.boat === 'out-dry')),
        move(p, s) { const o = st.boat === 'table' ? self.TABLE : self.LAND; setT(boat, o.x + p.x - s.x, o.y + p.y - s.y); $(el, '[data-w2-labels]').style.visibility = 'hidden'; },
        end(p, s) {
          const o = st.boat === 'table' ? self.TABLE : self.LAND, q = { x: o.x + p.x - s.x, y: o.y + p.y - s.y };
          if (nearCup(q) && st.rot === 0 && !st.inBowl) { st.boat = 'cup'; st.step = st.step === 1 ? 2 : 5; }
          self.paint(el);
        }
      });
      /* rotate button — a click turns the cup over (and back again).
         Step 2 turns it straight upside down; step 5 upside down on a tilt. */
      const turnCup = () => {
        if (busy || !(st.step === 2 || st.step === 5) || st.inBowl || st.boat !== 'cup') return;
        st.rot = st.rot === 0 ? (st.step === 5 ? 145 : 180) : 0;
        busy = true; self.moveCup(el, self.cupPose(), 450, () => { busy = false; self.paint(el); });
      };
      rot.setAttribute('tabindex', '0');
      rot.addEventListener('click', turnCup);
      rot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turnCup(); } });
      /* cup → bowl (steps 2/5) and back out (steps 3/6) */
      let c0 = null;
      const centre = (p, s) => ({ x: c0.x + p.x - s.x, y: c0.y + p.y - s.y });
      dragSvg(svg, cup, {
        enabled: () => !busy && (((st.step === 2 || st.step === 5) && !st.inBowl && st.boat === 'cup') || ((st.step === 3 || st.step === 6) && st.inBowl)),
        move(p, s) {
          if (!c0) c0 = self.cupPose();
          const q = centre(p, s); self.setCup(el, { x: q.x, y: q.y, r: st.rot });
          if (st.inBowl) { $(el, '[data-w2-air]').setAttribute('opacity', 0); self.cupWater(el, null); }
          zone.classList.toggle('is-hot', !st.inBowl && inBowlZone(q));
        },
        end(p, s) {
          zone.classList.remove('is-hot');
          if (!c0) { self.paint(el); return; }
          const q = centre(p, s); c0 = null;
          if (!st.inBowl) {
            const ok = inBowlZone(q) && ((st.step === 2 && st.rot === 180) || (st.step === 5 && (st.rot === 145 || st.rot === 215)));
            if (!ok) { busy = true; self.moveCup(el, self.cupPose(), 250, () => { busy = false; self.paint(el); }); return; }   // wrong pose / missed → back
            st.inBowl = true; busy = true;
            self.moveCup(el, self.cupPose(), 300, () => {
              if (st.step === 2) { st.step = 3; busy = false; self.paint(el); return; }
              self.flood(el, () => { st.step = 6; busy = false; self.paint(el); });
            });
          } else {
            if (!inBowlZone(q)) { st.inBowl = false; if (st.step === 6) st.rot = 180; }   // lifted out (water drains)
            busy = true; self.moveCup(el, self.cupPose(), 300, () => { busy = false; self.paint(el); });
          }
        }
      });
      /* click the lifted cup → the boat pops out and lands on the table */
      cup.addEventListener('click', () => {
        if (cup._moved) { cup._moved = false; return; }     // the click that ends a drag is not a boat tap
        if (busy || st.inBowl || st.boat !== 'cup' || !(st.step === 3 || st.step === 6)) return;
        busy = true;
        const wet = st.step === 6, c = self.cupPose(), from = self.toScene(c, 0, self.BOAT_IN), F = self.LAND;
        st.boat = wet ? 'out-wet' : 'out-dry';
        $(el, '[data-w2-boatin]').setAttribute('opacity', 0); $(el, '[data-w2-boatin-wet]').setAttribute('opacity', 0);
        boat.style.display = ''; boat.classList.remove('wg-grab-on');
        $(el, '[data-w2-boat-dry]').setAttribute('opacity', wet ? 0 : 1); $(el, '[data-w2-boat-wet]').setAttribute('opacity', wet ? 1 : 0);
        anim(750, k => {
          const e = k, hop = Math.sin(Math.PI * k) * 220;
          setT(boat, from.x + (F.x - from.x) * e, from.y + (F.y - from.y) * e - hop, c.r + (360 - c.r) * e);
        }, () => {
          if (wet) { st.step = 7; busy = false; self.paint(el); api.enableContinue(el, true); window.P01.obsDone(2); return; }
          self.paint(el);
          self.moveCup(el, { x: self.HOME.x, y: self.HOME.y, r: 0 }, 500, () => { st.rot = 0; st.step = 4; busy = false; self.paint(el); });
        });
      });
    },
    /* tilted dip: air escapes from the higher lip, water rises up to the boat */
    flood(el, done) {
      const c = this.cupPose(), pts = this.interior(c), self = this;
      const lip = pts[0].y < pts[1].y ? pts[0] : pts[1];            // higher mouth corner
      const bottom = Math.max(...pts.map(p => p.y)), top = Math.min(...pts.map(p => p.y)) - 4;
      const bub = $(el, '[data-w2-bubbles]');
      bub.setAttribute('transform', 'translate(' + lip.x + ' ' + lip.y + ')'); bub.style.display = '';
      const dry = $(el, '[data-w2-boatin]'), wet = $(el, '[data-w2-boatin-wet]');
      anim(1900, k => {
        self.cupWater(el, bottom - (bottom - top) * k);
        const w = Math.max(0, Math.min(1, (k - 0.7) / 0.25));        // the boat soaks once the water reaches it
        dry.setAttribute('opacity', 1 - w); wet.setAttribute('opacity', w);
      }, () => { bub.style.display = 'none'; done(); });
    }
  };

  /* ═══════════════════════════════════════════════════════════
     WIDGET 3 — slide 19 (4 staged steps; each appears when the previous
     one is done). Syringe plunger + rubber stopper.
     1 pull the plunger all the way out (fills with air)
     2 seal the tip with the rubber stopper (drag it onto the tip)
     3 push the plunger — it stops about halfway (trapped air); released,
       the compressed air pushes it back out
     4 remove the stopper (drag it off or click it) and push the plunger
       all the way in
     Art: vector, redrawn after the PPTX <מזרק סגור>/<מזרק פתוח> photos and
     sharing one palette with the rubber stopper (the PPTX <פקק גומי> image
     is 46×89 px — too small), so both read as one set. Layers, back to
     front: plunger (rod + thumb, seen through the glass) · glass barrel ·
     rubber seal · air · glass highlights · graduations. Coordinates = the original photo's
     pixel space (group S), so the scale 0–5 matches the seal travel.
     ═══════════════════════════════════════════════════════════ */
  const W3 = {
    state: { step: 1, p: 0, sealed: false, flow: null },    // p: 0 = fully in, 1 = fully out · flow: air gust 'in' / 'out'
    STEPS: ['1. اسحبوا مكبس المحقنة إلى الخارج حتى النهاية.', '2. أغلقوا المِحقَن (السرنجة) باستخدام سدادة المطاط.', '3. ادفعوا المكبس.', '4. انزعوا سدادة المطاط ثم حاولوا مرة أخرى دفع المكبس.'],
    S: { x: 210, y: 80 },                        // syringe photo placement (viewBox units)
    DX: 380,                                     // plunger travel in photo px (seal 0 → 5 mark)
    SEAL_X: 80, ROD_X: 239,                      // seal / rod image x at p = 0
    CHAMBER: { x0: 92, y0: 88, y1: 170 },        // air space: tip side → seal face, below the digits
    STOP_REST: { x: 260, y: 340 }, STOP_ON: { x: 8, y: 115 },   // stopper centre, photo px
    SEALED_MIN: 0.5,                             // trapped air halves → plunger stops at half
    render() {
      const S = this.S, U = (this.DX / 5);       // one scale unit (ml) in px
      let dots = '', ticks = '';
      for (let k = 1; k <= 25; k++) {             // 5 minor ticks per unit; major + digit on each unit
        const x = (this.SEAL_X + 3 + k * U / 5).toFixed(1), major = k % 5 === 0;
        ticks += '<line x1="' + x + '" x2="' + x + '" y1="' + (major ? 94 : 110) + '" y2="' + (major ? 158 : 142) + '"' + (major ? ' class="is-major"' : '') + '/>' +
          (major ? '<text x="' + x + '" y="86">' + k / 5 + '</text>' : '');
      }
      for (let k = 0; k < 18; k++) dots += '<circle class="wg-w3-air" r="5" data-k="' + k + '"/>';
      return '<div class="wg-wrap wg-wrap--w3">' +
        '<ol class="wg-steps wg-steps--staged">' + this.STEPS.map((t, k) => '<li data-step="' + (k + 1) + '">' + t + '</li>').join('') + '</ol>' +
        '<div class="wg-stage wg-stage--w3">' +
        '<svg class="wg-svg" viewBox="0 0 1700 460" role="img" aria-label="حقنة ذات مكبس وسدادة مطاطية">' +
          '<defs>' +
            '<linearGradient id="w3-rubber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6a6a"/><stop offset=".22" stop-color="#565656"/><stop offset=".6" stop-color="#3a3a3a"/><stop offset="1" stop-color="#232323"/></linearGradient>' +
            '<linearGradient id="w3-rubber-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#454545"/><stop offset="1" stop-color="#2a2a2a"/></linearGradient>' +
            '<linearGradient id="w3-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".16" stop-color="#e3ebf1" stop-opacity=".45"/><stop offset=".55" stop-color="#d5dee5" stop-opacity=".3"/><stop offset=".86" stop-color="#c3cfd8" stop-opacity=".45"/><stop offset="1" stop-color="#aebcc7" stop-opacity=".7"/></linearGradient>' +
            '<linearGradient id="w3-plastic" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fa"/><stop offset=".35" stop-color="#e2e7eb"/><stop offset=".7" stop-color="#cbd2d8"/><stop offset="1" stop-color="#e6eaee"/></linearGradient>' +
          '</defs>' +
          '<g transform="translate(' + S.x + ' ' + S.y + ')">' +
            /* plunger: rod starts at the seal's back face, runs out through the flange */
            '<g data-w3-plunger class="wg-grab" role="slider" aria-label="مكبس الحقنة" aria-valuemin="0" aria-valuemax="100" tabindex="-1">' +
              '<g data-w3-rod transform="translate(' + this.ROD_X + ' 0)">' +
                '<rect x="-116" y="83" width="954" height="62" rx="4" fill="url(#w3-plastic)" class="wg-w3-line"/>' +
                '<path d="M-110 114 H834" class="wg-w3-rib"/>' +
                '<rect x="834" y="44" width="28" height="140" rx="12" fill="url(#w3-plastic)" class="wg-w3-line"/>' +
              '</g></g>' +
            /* glass barrel: nozzle · cone · body · collar · flange */
            '<g class="wg-w3-still">' +
              '<rect x="2" y="98" width="68" height="34" rx="6" fill="url(#w3-glass)" class="wg-w3-line"/>' +
              '<path d="M86 54 L68 96 L68 134 L86 177 Z" fill="url(#w3-glass)" class="wg-w3-line"/>' +
              '<rect x="80" y="52" width="522" height="127" rx="7" fill="url(#w3-glass)" class="wg-w3-line"/>' +
              '<rect x="566" y="48" width="36" height="135" rx="5" fill="url(#w3-glass)" class="wg-w3-line"/>' +
              '<rect x="598" y="2" width="22" height="222" rx="10" fill="url(#w3-plastic)" class="wg-w3-line" opacity=".92"/>' +
            '</g>' +
            /* rubber seal: same rubber as the stopper, two sealing rings */
            '<g data-w3-seal class="wg-w3-still" transform="translate(' + this.SEAL_X + ' 0)">' +
              '<rect x="0" y="57" width="43" height="117" rx="6" fill="url(#w3-rubber)"/>' +
              '<rect x="2" y="54" width="12" height="123" rx="5" fill="url(#w3-rubber-rim)"/>' +
              '<rect x="28" y="54" width="12" height="123" rx="5" fill="url(#w3-rubber-rim)"/>' +
            '</g>' +
            '<g data-w3-air class="wg-w3-still">' + dots + '</g>' +
            '<g class="wg-w3-still">' +
              '<rect x="92" y="60" width="468" height="6" rx="3" fill="#fff" opacity=".8"/>' +
              '<rect x="92" y="166" width="468" height="4" rx="2" fill="#fff" opacity=".4"/>' +
              '<rect x="8" y="103" width="56" height="4" rx="2" fill="#fff" opacity=".7"/>' +
            '</g>' +
            '<g class="wg-w3-still wg-w3-scale" direction="ltr">' + ticks + '</g>' +
            '<g data-w3-arrow class="wg-w3-still">' +
              '<foreignObject x="1206" y="-68" width="130" height="60"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">مكبس</p></foreignObject>' +
              '<path d="M1200 -30 L1118 40" class="wg-w1-arrow"/><path d="M1124 14 L1112 46 L1145 39" class="wg-w1-arrow"/></g>' +
            /* "אוויר" — points into the air space (shown while there is air in the syringe) */
            '<g data-w3-airlabel class="wg-w3-still">' +
              '<foreignObject x="20" y="236" width="130" height="60"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">هواء</p></foreignObject>' +
              '<path d="M120 238 L160 168" class="wg-w1-arrow"/><path d="M142 180 L162 164 L166 189" class="wg-w1-arrow"/></g>' +
            /* air gust at the tip: flows in while pulling, out while pushing (open syringe only) */
            '<g data-w3-gust class="wg-w3-still wg-w3-gust">' +
              '<path d="M-150 84 q20 -16 40 0 t40 0 t40 0 t15 0"/>' +
              '<path d="M-190 115 q20 -16 40 0 t40 0 t40 0 t40 0 t15 0"/>' +
              '<path d="M-140 146 q20 -16 40 0 t40 0 t40 0 t5 0"/>' +
            '</g>' +
            '<rect data-w3-tipzone x="-70" y="40" width="160" height="150" class="wg-dropzone" rx="16"/>' +
            /* "פקק גומי" — beside the stopper at rest (hidden while it is dragged / sealed) */
            '<g data-w3-stoplabel class="wg-w3-still">' +
              '<foreignObject x="356" y="310" width="260" height="60"><p xmlns="http://www.w3.org/1999/xhtml" class="wg-w1-label wg-w1-label--word">سدادة مطاطية</p></foreignObject>' +
              '<path d="M350 340 L304 340" class="wg-w1-arrow"/><path d="M320 326 L302 340 L320 354" class="wg-w1-arrow"/></g>' +
            /* rubber stopper: a cap, closed end left, open end towards the tip */
            '<g data-w3-stopper class="wg-grab" role="button" aria-label="السدادة المطاطية" tabindex="-1">' +
              '<rect x="-46" y="-56" width="92" height="112" fill="transparent"/>' +
              '<g class="wg-w3-stopper">' +
                '<ellipse cx="0" cy="44" rx="34" ry="6" class="wg-w3-stopper-shadow"/>' +
                '<rect x="-30" y="-40" width="60" height="80" rx="9" fill="url(#w3-rubber)"/>' +
                '<rect x="22" y="-40" width="10" height="80" rx="4" fill="url(#w3-rubber-rim)"/>' +
                '<path d="M-24 -31 H18" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>' +
                '<path d="M-27 34 H20" stroke="#000" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>' +
              '</g></g>' +
          '</g>' +
        '</svg></div></div>';
    },
    paint(el) {
      const st = this.state, dx = this.DX * st.p, C = this.CHAMBER;
      el.querySelectorAll('.wg-steps li').forEach(li => {
        const n = +li.dataset.step;
        li.classList.toggle('is-shown', n <= st.step); li.classList.toggle('is-current', n === st.step); li.classList.toggle('is-done', n < st.step);
      });
      setT($(el, '[data-w3-rod]'), this.ROD_X + dx, 0);
      setT($(el, '[data-w3-seal]'), this.SEAL_X + dx, 0);
      const plunger = $(el, '[data-w3-plunger]'), stopper = $(el, '[data-w3-stopper]');
      const pOn = st.step === 1 || st.step === 3 || st.step === 4, sOn = st.step === 2 || st.step === 4;
      plunger.classList.toggle('wg-grab-on', pOn); plunger.setAttribute('tabindex', pOn ? '0' : '-1');
      plunger.setAttribute('aria-valuenow', Math.round(st.p * 100));
      stopper.classList.toggle('wg-grab-on', sOn); stopper.setAttribute('tabindex', sOn ? '0' : '-1');
      const at = st.sealed ? this.STOP_ON : this.STOP_REST;
      setT(stopper, at.x, at.y);
      stopper.classList.toggle('is-on', st.sealed);
      $(el, '[data-w3-stoplabel]').style.display = st.sealed ? 'none' : '';
      $(el, '[data-w3-arrow]').style.display = st.step === 1 && st.p < 0.03 ? '' : 'none';
      $(el, '[data-w3-airlabel]').style.display = st.p > 0.35 && !st.flow ? '' : 'none';
      const gust = $(el, '[data-w3-gust]');
      gust.classList.toggle('is-in', st.flow === 'in'); gust.classList.toggle('is-out', st.flow === 'out');
      $(el, '[data-w3-tipzone]').classList.remove('is-hot');
      /* air: open syringe → constant density (air flows in / out through the
         tip); sealed → constant amount, squeezed into the shorter space */
      const n = st.sealed ? 18 : Math.round(18 * st.p), x1 = this.SEAL_X + dx - 4, span = Math.max(6, x1 - C.x0);
      el.querySelectorAll('.wg-w3-air').forEach((d, k) => {
        d.style.display = k < n ? '' : 'none';
        const col = k % 6, row = Math.floor(k / 6);
        d.setAttribute('cx', C.x0 + (col + 0.5 + (row % 2 ? 0.25 : -0.25)) * span / 6);
        d.setAttribute('cy', C.y0 + 8 + row * (C.y1 - C.y0 - 16) / 2);
      });
    },
    wire(el, api) {
      const svg = $(el, '.wg-svg'), st = this.state, self = this;
      const plunger = $(el, '[data-w3-plunger]'), stopper = $(el, '[data-w3-stopper]'), zone = $(el, '[data-w3-tipzone]');
      const atTip = q => q.x > -70 && q.x < 90 && q.y > 40 && q.y < 190;
      let springing = false;
      /* sealed: the plunger gets stiffer past 0.62 and stops at SEALED_MIN */
      const clampP = v => {
        if (!st.sealed) return Math.max(0, Math.min(1, v));
        const soft = 0.62; if (v < soft) v = soft - (soft - v) * 0.4;
        return Math.max(self.SEALED_MIN, Math.min(1, v));
      };
      /* gust direction follows the plunger while the syringe is open; it fades shortly after the plunger stops */
      let flowT = 0;
      const flow = (from, to) => {
        if (st.sealed || Math.abs(to - from) < 1e-4) return;
        st.flow = to > from ? 'in' : 'out';
        clearTimeout(flowT); flowT = setTimeout(() => { st.flow = null; self.paint(el); }, 350);
      };
      const settle = () => {
        if (st.step === 1 && st.p >= 0.97) { st.p = 1; st.step = 2; }
        else if (st.step === 3 && st.p <= self.SEALED_MIN + 0.02) st.step = 4;
        else if (st.step === 4 && !st.sealed && st.p <= 0.03) { st.p = 0; st.step = 5; api.enableContinue(el, true); window.P01.obsDone(3); }
        self.paint(el);
        /* released while sealed → the squeezed air pushes the plunger back out */
        if (st.sealed && st.p < 1) {
          springing = true; const from = st.p;
          anim(500, k => { st.p = from + (1 - from) * ease(k); self.paint(el); }, () => { springing = false; });
        }
      };
      let p0 = null;
      dragSvg(svg, plunger, {
        enabled: () => !springing && (st.step === 1 || st.step === 3 || st.step === 4),   // A5: inert in step 2 (sealing)
        move(p, s) {
          if (p0 === null) p0 = st.p;
          const prev = st.p;
          st.p = clampP(p0 + (p.x - s.x) / self.DX); flow(prev, st.p);
          self.paint(el);
        },
        end() { p0 = null; settle(); }
      });
      plunger.addEventListener('keydown', e => {
        if (springing || !(st.step === 1 || st.step === 3 || st.step === 4)) return;
        const d = e.key === 'ArrowRight' ? 0.1 : e.key === 'ArrowLeft' ? -0.1 : e.key === 'End' ? 1 : e.key === 'Home' ? -1 : 0;
        if (!d) return;
        e.preventDefault(); e.stopPropagation();   // not screen navigation
        const prev = st.p;
        st.p = clampP(st.p + d); flow(prev, st.p); self.paint(el);
        clearTimeout(plunger._kt); plunger._kt = setTimeout(settle, 450);
      });
      /* stopper: drag it onto the tip (step 2); drag it off or click it (step 4, decision B10) */
      const rest = this.STOP_REST, on = this.STOP_ON;
      const unseal = (fx, fy) => {
        st.sealed = false; stopper.classList.remove('is-on');
        fx = fx == null ? on.x : fx; fy = fy == null ? on.y : fy;
        anim(420, k => setT(stopper, fx + (rest.x - fx) * ease(k), fy + (rest.y - fy) * ease(k)), () => self.paint(el));
      };
      const seal = () => { st.sealed = true; st.step = 3; self.paint(el); };
      dragSvg(svg, stopper, {
        enabled: () => !springing && ((st.step === 2 && !st.sealed) || (st.step === 4 && st.sealed)),
        move(p, s) {
          const from = st.sealed ? on : rest;
          $(el, '[data-w3-stoplabel]').style.display = 'none';
          setT(stopper, from.x + p.x - s.x, from.y + p.y - s.y);
          zone.classList.toggle('is-hot', !st.sealed && atTip({ x: from.x + p.x - s.x, y: from.y + p.y - s.y }));
        },
        end(p, s) {
          zone.classList.remove('is-hot');
          const from = st.sealed ? on : rest, c = { x: from.x + p.x - s.x, y: from.y + p.y - s.y }, d = Math.hypot(p.x - s.x, p.y - s.y);
          if (st.step === 2 && atTip(c)) return seal();
          if (st.step === 4 && st.sealed && (d < 6 || !atTip(c))) return unseal(c.x, c.y);   // click, or pulled off
          self.paint(el);                                                                      // missed → back
        }
      });
      stopper.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (st.step === 2 && !st.sealed) seal();
        else if (st.step === 4 && st.sealed) unseal();
      });
    }
  };

  /* ─── Observation completion bookkeeping (tabs) ─── */
  const obs = new Set();
  function obsDone(n) { obs.add(n); }

  /* ─── FlipCardsReveal ─── */
  function flip(cards) {
    return '<div class="option-cards frc-row" role="group" aria-label="بطاقات — اضغطوا للقلب" data-reveal="2" data-reveal-fade>' +
      cards.map((c, k) => '<div class="frc-card-wrap"><button class="frc-card" type="button" data-index="' + k + '" aria-expanded="false" aria-label="' + c.aria + '. اضغطوا للقلب">' +
        '<div class="frc-card-inner"><div class="frc-card-front">' +
          (c.img ? '<img src="' + c.img + '" alt="' + c.aria + '">' : '<div class="frc-placeholder"><span class="ct-placeholder-tag">GIF من الفيديو — قيد الإنتاج</span></div>') +
        '</div><div class="frc-card-back" aria-hidden="true"><div class="frc-card-back-content">' + c.back.map(t => '<p>' + t + '</p>').join('') + '</div></div></div>' +
        '</button></div>').join('') + '</div>';
  }
  const flipped = new Set();
  const FLIP_COUNT = 3;
  function flipDone() { return flipped.size >= FLIP_COUNT; }
  function flipWire(el, api) {
    api.enableContinue(el, flipDone());
    /* A16: a restored card that was opened is shown opened */
    el.querySelectorAll('.frc-card').forEach(b => {
      if (flipped.has(b.dataset.index) && !b.classList.contains('is-flipped')) {
        b.classList.add('is-flipped'); b.querySelector('.frc-card-back').setAttribute('aria-hidden', 'false');
      }
      const on = b.classList.contains('is-flipped'); b.setAttribute('aria-expanded', on);
    });
    if (el._flipWired) return; el._flipWired = true;
    el.querySelectorAll('.frc-card').forEach(b => b.addEventListener('click', () => {
      const on = !b.classList.contains('is-flipped');
      b.classList.toggle('is-flipped', on); b.setAttribute('aria-expanded', on);
      b.querySelector('.frc-card-back').setAttribute('aria-hidden', on ? 'false' : 'true');
      flipped.add(b.dataset.index);
      api.enableContinue(el, flipDone());
      api.saveState();
    }));
  }

  /* ─── Ordered drag-and-drop (slide 22) ─────────────────────
     Each tile has exactly one correct statement box; a wrong drop snaps
     back to the pool with inline rejection feedback. Each box gets one drop
     slot per tile that belongs to it. */
  const dndState = { placed: {}, submitted: false };   // tileId → targetId · submitted = board complete
  function dnd(cfg) {
    return '<div class="dnd-wrap">' +
      '<div class="dnd-head" data-reveal="1"><h1 class="select-title">' + cfg.title + '</h1>' + cfg.body.map(t => '<p class="dnd-instr">' + t + '</p>').join('') + '</div>' +
      '<div class="dnd-pool" data-reveal="2">' + cfg.tiles.map(t =>
        '<div class="dnd-slot" data-slot="' + t.id + '"><div class="dnd-tile' + (t.imgs ? ' is-multi' : '') + '" data-tile="' + t.id + '" data-target="' + t.target + '" role="button" tabindex="0" aria-label="' + t.alt + '">' +
        (t.imgs || [t.img]).map(src => '<img src="' + src + '" alt="" draggable="false"' + (t.cover ? ' class="is-cover"' : '') + '>').join('') + (t.overlay ? '<span class="dnd-overlay" dir="ltr">' + t.overlay + '</span>' : '') + '</div></div>').join('') + '</div>' +
      '<div class="dnd-targets" data-reveal="3">' + cfg.targets.map(tg =>
        '<div class="dnd-target" data-target-id="' + tg.id + '" role="button" tabindex="0" aria-label="' + tg.text.join(' ').replace(/<br>/g, ' ') + '"><div class="dnd-target-slots">' + '<span class="dnd-drop"></span>'.repeat(cfg.tiles.filter(t => t.target === tg.id).length) + '</div>' +
        '<div class="dnd-target-text">' + tg.text.map(t => '<p>' + t + '</p>').join('') + '</div></div>').join('') + '</div>' +
      '<p class="dnd-status" role="status" aria-live="polite" aria-atomic="true"></p></div>';
  }
  function dndPaint(el, cfg, api) {
    el.querySelectorAll('.dnd-tile').forEach(t => {
      const tg = dndState.placed[t.dataset.tile];
      const home = tg ? [...el.querySelectorAll('[data-target-id="' + tg + '"] .dnd-drop')].find(d => !d.firstElementChild || d.firstElementChild === t)
                      : el.querySelector('[data-slot="' + t.dataset.tile + '"]');
      if (home && t.parentElement !== home) home.appendChild(t);
      t.classList.toggle('is-placed', !!tg);
      t.setAttribute('aria-disabled', String(!!tg));
      t.tabIndex = tg ? -1 : 0;
    });
    /* Wrong drops snap back, so a full board is always correct — no check
       step: "שנמשיך?" is enabled once every tile is placed (post-production fix). */
    const done = dndState.submitted = cfg.tiles.every(t => dndState.placed[t.id]);
    const btn = el.querySelector('.btn-continue');
    btn.disabled = !done; btn.textContent = 'متابعة';
    el.classList.toggle('dnd-locked', done);
  }
  function dndWire(el, cfg, api) {
    dndPaint(el, cfg, api);
    if (el._dndWired) return; el._dndWired = true;
    let picked = null, suppressClick = false;
    const status = el.querySelector('.dnd-status');
    let announceTimer;
    function announce(message) {
      clearTimeout(announceTimer);
      status.textContent = '';
      announceTimer = setTimeout(() => { status.textContent = message; }, 30);
    }
    function select(tile) {
      picked = tile;
      el.querySelectorAll('.dnd-tile').forEach(t => {
        t.classList.toggle('is-selected', t === tile);
        t.setAttribute('aria-pressed', String(t === tile));
      });
    }
    function place(tile, box) {
      if (dndState.placed[tile.dataset.tile] || dndState.submitted) return;
      if (box.dataset.targetId !== tile.dataset.target) {
        // Restart feedback even when the same wrong target is tried repeatedly.
        clearTimeout(box._dndRejectTimer);
        box.classList.remove('is-wrong');
        void box.offsetWidth;
        box.classList.add('is-wrong');
        box._dndRejectTimer = setTimeout(() => box.classList.remove('is-wrong'), 650);
        announce('');
        return;
      }
      clearTimeout(box._dndRejectTimer);
      box.classList.remove('is-wrong');
      dndState.placed[tile.dataset.tile] = tile.dataset.target;
      select(null);
      dndPaint(el, cfg, api); api.saveState();
      announce(dndState.submitted ? 'جميع الصور في المكان المناسب. يمكن المتابعة.' : 'الصورة في المكان المناسب.');
    }
    el.querySelectorAll('.dnd-tile, .dnd-target').forEach(control => {
      control.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault(); e.stopPropagation(); control.click();
      });
      control.addEventListener('click', e => {
        if ((suppressClick && e.detail !== 0) || dndState.submitted) return;
        // A placed tile is nested in its target: do not treat its click as a target choice.
        if (e.target.closest('.dnd-tile') && !control.matches('.dnd-tile')) return;
        if (control.matches('.dnd-tile')) {
          if (dndState.placed[control.dataset.tile]) return;
          select(control);
          announce(control.getAttribute('aria-label') + ' تم اختيارها. اختاروا الجملة المناسبة.');
        } else if (picked) place(picked, control);
        else announce('اختاروا أولًا صورة، ثم الجملة المناسبة.');
      });
    });
    el.querySelectorAll('.dnd-tile').forEach(t => t.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !e.isPrimary) return;
      if (dndState.placed[t.dataset.tile] || dndState.submitted) return;
      e.preventDefault();
      const app = document.getElementById('app');
      const r = t.getBoundingClientRect(), s = api.toCanvas(e), ar = app.getBoundingClientRect();
      const scale = ar.width / 1280;
      const ghost = t.cloneNode(true); ghost.classList.add('dnd-ghost');
      const gx0 = (r.left - ar.left) / scale, gy0 = (r.top - ar.top) / scale;
      Object.assign(ghost.style, { left: gx0 + 'px', top: gy0 + 'px', width: r.width / scale + 'px', height: r.height / scale + 'px' });
      el.appendChild(ghost); t.classList.add('is-lifted');
      const mv = ev => { const c = api.toCanvas(ev); ghost.style.left = gx0 + c.x - s.x + 'px'; ghost.style.top = gy0 + c.y - s.y + 'px';
        el.querySelectorAll('.dnd-target').forEach(b => b.classList.toggle('is-hot', b === hit(ev))); };
      const hit = ev => { ghost.style.display = 'none'; const u = document.elementFromPoint(ev.clientX, ev.clientY); ghost.style.display = ''; return u && u.closest('.dnd-target'); };
      const up = ev => {
        window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
        const box = hit(ev); ghost.remove(); t.classList.remove('is-lifted');
        el.querySelectorAll('.dnd-target').forEach(b => b.classList.remove('is-hot'));
        if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 6) return;
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        select(null);
        if (box && el.contains(box)) place(t, box);
      };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }));
  }

  return { twoOption, twoOptionWire, toggle, toggleSync, tabs, tabsSync, obs, obsDone,
           W1, W2, W3, flip, flipWire, flipDone, flipped, dnd, dndWire, dndState };
})();
