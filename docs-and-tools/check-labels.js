#!/usr/bin/env node
/* Label audit: every graded screen's on-screen options must equal the
   metadata `answers` strings (MOE 2026-10-19 — result.response is built
   from metadata strings, so a relabelled option would report a string the
   learner never saw). Reads each part's js/main.js (window.PART) and its
   PART.xapi map; prints one line per question and exits 1 on a mismatch.
   Usage: node docs-and-tools/check-labels.js                              */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SLUG = 'methodica-science-mass-gas-01';

/* Visible text of an option's HTML: tooltips/info buttons dropped, tags
   stripped, whitespace collapsed — the same normalisation the bridge uses. */
function plain(html) {
  return String(html)
    .replace(/<span class="tip-btn"[^>]*>[\s\S]*?<\/span>/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPart(n) {
  const dir = path.join(ROOT, `${SLUG}-${n}`, 'js');
  const ctx = { window: {}, document: { addEventListener() {}, querySelector() { return null; } },
    console, location: { search: '', hash: '' } };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(dir, 'main.js'), 'utf8'), ctx, { filename: 'main.js' });
  return ctx.window.PART;
}

let bad = 0;
for (const n of ['01', '02', '03', '04', '05', '06']) {
  const PART = loadPart(n);
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'metadata', `${SLUG}-${n}.json`), 'utf8'));
  const x = PART.xapi;
  if (!x) { console.log(`part ${n}: no PART.xapi — skipped`); continue; }
  for (const scr of PART.screens) {
    const q = x.questions && x.questions[scr.key];
    if (!q) continue;
    const item = meta.subContent.find(it => it.id.endsWith(`-${q.item}/`));
    const mq = item && (item.questions || []).find(mm => mm.questionId.endsWith('/' + q.q));
    if (!mq) { console.log(`✗ ${n}/${scr.key}: no metadata question ${q.item}/${q.q}`); bad++; continue; }
    if (mq.questionType === 'matching') {
      /* widget DnD (part 01): tiles name the sources (aria-label = alt), boxes the targets */
      const dcfg = PART.hooks && PART.hooks[scr.key] && PART.hooks[scr.key].cfg;
      if (!dcfg) { console.log(`· ${n}/${scr.key} → ${q.item}/${q.q} matching (no widget cfg)`); continue; }
      const src = mq.answers.source, tgt = mq.answers.target, diffs = [];
      dcfg.tiles.forEach(t => { if (!src.includes(plain(t.alt))) diffs.push(`tile «${plain(t.alt)}» not in answers.source`); });
      dcfg.targets.forEach((t, i) => { const s = plain(t.text.join(' ')); if (s !== tgt[i]) diffs.push(`box #${i + 1} screen «${s}» ≠ metadata «${tgt[i]}»`); });
      if (diffs.length) { bad++; console.log(`✗ ${n}/${scr.key} → ${q.item}/${q.q} matching\n    ` + diffs.join('\n    ')); }
      else console.log(`✓ ${n}/${scr.key} → ${q.item}/${q.q} matching (${dcfg.tiles.length} pairs)`);
      continue;
    }
    if (mq.questionType === 'true-false') {
      const ids = (scr.options || []).map(o => o.id).join(',');
      const ok = ids === 'true,false' && JSON.stringify(mq.answers) === '["true","false"]';
      if (!ok) bad++;
      console.log(`${ok ? '✓' : '✗'} ${n}/${scr.key} → ${q.item}/${q.q} true-false (option ids ${ids}; metadata ${JSON.stringify(mq.answers)})`);
      continue;
    }
    if (mq.questionType !== 'choice') { console.log(`· ${n}/${scr.key} → ${q.item}/${q.q} ${mq.questionType} (not a label check)`); continue; }
    const opts = (scr.options || scr.cards || []).map(o => plain(o.text != null ? o.text : (o.label || '')));
    const ans = mq.answers || [];
    const diffs = [];
    if (opts.length !== ans.length) diffs.push(`count ${opts.length} vs ${ans.length}`);
    opts.forEach((t, i) => { if (t !== ans[i]) diffs.push(`#${i + 1} screen «${t}» ≠ metadata «${ans[i]}»`); });
    if (diffs.length) { bad++; console.log(`✗ ${n}/${scr.key} → ${q.item}/${q.q}\n    ` + diffs.join('\n    ')); }
    else console.log(`✓ ${n}/${scr.key} → ${q.item}/${q.q} (${opts.length} options)`);
  }
}
console.log(bad ? `\n${bad} mismatch(es)` : '\nall labels match the metadata');
process.exit(bad ? 1 : 0);
