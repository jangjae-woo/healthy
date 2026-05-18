// 랜덤 가족 검토용 HTML 생성
//
// mock LLM 본문까지 붙인 17p 보고서 여러 건을 하나의 HTML 파일로 만든다.
// 사용자가 브라우저에서 직접 읽고 어색한 카드/문구를 표시하기 위한 산출물.

import fs from 'node:fs';
import path from 'node:path';
import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';
import { mockLLMResponse } from '../lib/youa/mock-llm.mjs';
import { parseLLMOutput, attachLLMTextToFacts } from '../lib/youa/output-parser.mjs';
import { validateLLMOutput } from '../lib/youa/output-validator.mjs';
import { renderReport } from '../lib/youa/render.mjs';

const N = parseInt(process.argv[2] ?? '5', 10);
const OUT_DIR = path.resolve('review');
const OUT_FILE = path.join(OUT_DIR, `youa-review-samples-${N}.html`);

const HOUR_OPTIONS = [
  '자시 (23:30~01:29)', '축시 (01:30~03:29)', '인시 (03:30~05:29)',
  '묘시 (05:30~07:29)', '진시 (07:30~09:29)', '사시 (09:30~11:29)',
  '오시 (11:30~13:29)', '미시 (13:30~15:29)', '신시 (15:30~17:29)',
  '유시 (17:30~19:29)', '술시 (19:30~21:29)', '해시 (21:30~23:29)',
];

const LEVEL = { low: '낮음', mid: '중간', high: '높음' };

function randDateInRange(startY, endY) {
  const y = startY + Math.floor(Math.random() * (endY - startY + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const dMax = new Date(y, m, 0).getDate();
  const d = 1 + Math.floor(Math.random() * dMax);
  return { y, m, d };
}

function randHour() {
  return HOUR_OPTIONS[Math.floor(Math.random() * HOUR_OPTIONS.length)];
}

function makeFixture({ role, index, startY, endY, gender }) {
  const { y, m, d } = randDateInRange(startY, endY);
  const hour = randHour();
  const core = computeFullSajuCore({ year: y, month: m, day: d, hour, calendar: '양력', gender });
  if (!core) throw new Error('saju core failed');
  return sajuCoreToFixture(core, {
    name: `${role}${index}`,
    gender: gender === '여' ? 'female' : 'male',
    birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    role,
    testDate: '2026-05-17',
  });
}

function sajuLine(fixture) {
  return Object.values(fixture.pillars).map(p => `${p.stem}${p.branch}`).join(' ');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function factorSummary(facts) {
  return Object.values(facts.childFactors)
    .map(f => `<span>${f.factorKorean} ${LEVEL[f.level]}</span>`)
    .join('');
}

function cardSummary(cards) {
  return cards
    .map(c => `<li>${escapeHtml(c.axisKorean)} x ${escapeHtml(c.factorKorean)} <b>${escapeHtml(c.pattern)}</b><br>${escapeHtml(c.header)}</li>`)
    .join('');
}

function sampleBlock(index) {
  const child = makeFixture({ role: 'child', index, startY: 2020, endY: 2023, gender: Math.random() < 0.5 ? '여' : '남' });
  const mother = makeFixture({ role: 'mother', index, startY: 1980, endY: 1995, gender: '여' });
  const father = makeFixture({ role: 'father', index, startY: 1978, endY: 1993, gender: '남' });
  const facts = buildFacts({ childSaju: child, motherSaju: mother, fatherSaju: father, testDate: '2026-05-17' });
  const parsed = parseLLMOutput(mockLLMResponse(facts));
  const validation = validateLLMOutput(parsed, facts);
  const rendered = renderReport(attachLLMTextToFacts(facts, parsed));

  return `
    <section class="sample" id="sample-${index + 1}">
      <div class="sample-summary">
        <div class="summary-title">샘플 ${index + 1} · ${escapeHtml(facts.child.fullTitle)} · ${escapeHtml(facts.animal.name)} (${escapeHtml(facts.animal.caseLabel)})</div>
        <div class="summary-grid">
          <div>
            <h2>사주/요인</h2>
            <p>${escapeHtml(sajuLine(child))} / 일간 ${escapeHtml(child.ilgan)} / 신강 ${escapeHtml(child.shinkang.level)}</p>
            <div class="factor-tags">${factorSummary(facts)}</div>
            <p class="${validation.valid ? 'ok' : 'bad'}">validator: ${validation.valid ? '통과' : '실패'}${validation.valid ? '' : ` (${validation.violations.length}건)`}</p>
          </div>
          <div>
            <h2>어머님 카드</h2>
            <ul>${cardSummary(facts.matrixCards.motherCards)}</ul>
          </div>
          <div>
            <h2>아버님 카드</h2>
            <ul>${cardSummary(facts.matrixCards.fatherCards)}</ul>
          </div>
        </div>
      </div>
      ${rendered}
    </section>
  `;
}

const style = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4efe9; color: #333; font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; }
  .topbar { position: sticky; top: 0; z-index: 10; background: #2d2521; color: #fff; padding: 12px 16px; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
  .topbar h1 { font-size: 17px; margin: 0 0 6px; }
  .topbar p { margin: 0; color: #e8d8ca; font-size: 12px; }
  .toc { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .toc a { color: #fff; text-decoration: none; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 3px 9px; font-size: 12px; }
  .sample { padding: 18px 8px 36px; border-bottom: 5px solid #d8c6b8; }
  .sample-summary { max-width: 920px; margin: 0 auto 18px; background: #fff; border: 1px solid #e8d8ca; border-radius: 12px; padding: 16px; box-shadow: 0 3px 16px rgba(0,0,0,.06); }
  .summary-title { font-size: 18px; font-weight: 800; color: #b54d2d; margin-bottom: 10px; }
  .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .summary-grid h2 { font-size: 13px; margin: 0 0 6px; color: #6d4b36; }
  .summary-grid p, .summary-grid li { font-size: 12px; margin: 4px 0; color: #555; }
  .summary-grid ul { margin: 0; padding-left: 16px; }
  .factor-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .factor-tags span { background: #f7eadf; border: 1px solid #ead1bd; border-radius: 999px; padding: 2px 8px; font-size: 11px; color: #7a4b2f; }
  .ok { color: #2e7d32 !important; font-weight: 700; }
  .bad { color: #c62828 !important; font-weight: 700; }
  .page { max-width: 420px; margin: 0 auto 20px; padding: 30px 20px; background: white; border-radius: 14px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); min-height: 640px; position: relative; }
  .page-num { position: absolute; top: 14px; right: 18px; color: #aaa; font-size: 11px; }
  .chapter-header { padding: 12px 18px; border-radius: 10px; margin-bottom: 22px; font-size: 18px; font-weight: 700; display: inline-block; }
  .ch-hwalgi { background: #FFE5DA; color: #c84d20; }
  .ch-josim { background: #E5F2D1; color: #5d8225; }
  .ch-manjok { background: #FFF6CC; color: #b89400; }
  .ch-heundeullim { background: #EBDAF5; color: #6e4099; }
  .ch-eoullim { background: #FFE0E8; color: #c44366; }
  .ch-kkeungi { background: #DBE9F5; color: #2d5a8a; }
  .ch-parent { background: #F0E7DC; color: #8a6332; }
  .ch-outro { background: #F5E4D8; color: #a16a3a; }
  .score-box { background: #fef9f6; border-left: 4px solid #d97757; padding: 12px 14px; border-radius: 8px; margin: 16px 0; font-size: 13px; }
  .llm-placeholder { background: #ecf6f5; border: 1px dashed #6ba8a8; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #3d7373; font-style: italic; margin: 8px 0; }
  .llm-content { background: #fdfaf6; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 13px; color: #444; line-height: 1.7; }
  .radar-wrap { display: flex; justify-content: center; margin: 20px 0; }
  .radar { width: 100%; max-width: 320px; }
  .radar-label { font-size: 12px; font-weight: 600; fill: #555; }
  .radar-score { font-size: 10px; fill: #d97757; font-weight: 700; }
  .bar-row { display: flex; align-items: center; margin: 8px 0; gap: 8px; }
  .bar-name { width: 48px; font-size: 12px; font-weight: 600; color: #555; }
  .bar-track { flex: 1; height: 11px; background: #f0ebe5; border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; }
  .bar-score { width: 44px; text-align: right; font-size: 12px; font-weight: 700; color: #d97757; }
  .bar-label { width: 62px; font-size: 11px; }
  .level-low { color: #2d5a8a; font-weight: 600; }
  .level-mid { color: #888; font-weight: 600; }
  .level-high { color: #c84d20; font-weight: 600; }
  .bipolar-section { margin: 24px 0; }
  .bipolar-title { text-align: center; font-size: 14px; font-weight: 700; color: #444; margin-bottom: 4px; }
  .bipolar-subtitle { text-align: center; font-size: 11px; color: #888; margin-bottom: 14px; }
  .bipolar-list { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
  .bipolar-item { border-bottom: 1px solid #f0ebe5; cursor: pointer; }
  .bipolar-row { display: grid; grid-template-columns: 1fr 60px 1fr 22px; gap: 6px; align-items: center; padding: 12px 10px; }
  .bp-low-mini { text-align: right; font-size: 10.5px; color: #888; }
  .bp-high-mini { text-align: left; font-size: 10.5px; color: #c84d20; font-weight: 500; }
  .bipolar-label { padding: 5px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; text-align: center; }
  .bp-toggle { font-size: 15px; color: #9a9a9a; text-align: center; font-weight: 700; line-height: 1; }
  .bipolar-detail { display: none; padding: 0 14px 14px; background: #faf6f1; }
  .bipolar-item.expanded .bipolar-detail { display: block; }
  .bp-full { font-size: 11px; padding: 8px 10px; margin: 6px 0; border-radius: 6px; }
  .bp-low-full { background: #f8f5f1; color: #666; border-left: 3px solid #bbb; }
  .bp-high-full { background: #fff5ec; color: #444; border-left: 3px solid #d97757; }
  .bp-low-full::before { content: "낮음 - "; color: #999; font-weight: 600; }
  .bp-high-full::before { content: "높음 - "; color: #d97757; font-weight: 600; }
  .bp-hwalgi { background: #FFE5DA; color: #c84d20; }
  .bp-josim { background: #E5F2D1; color: #5d8225; }
  .bp-manjok { background: #FFF6CC; color: #b89400; }
  .bp-heundeullim { background: #EBDAF5; color: #6e4099; }
  .bp-eoullim { background: #FFE0E8; color: #c44366; }
  .bp-kkeungi { background: #DBE9F5; color: #2d5a8a; }
  .saju8-box { background: #faf6f1; padding: 14px; border-radius: 10px; margin: 14px 0; }
  .saju8-title { font-size: 12px; color: #888; margin-bottom: 10px; }
  .saju8-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; }
  .saju8-cell { background: white; padding: 8px 4px; border-radius: 6px; border: 1px solid #eee; }
  .saju8-cell .pos { font-size: 10px; color: #aaa; }
  .saju8-cell .char { font-size: 18px; font-weight: 700; color: #555; }
  .saju8-cell.day .char { color: #d97757; font-size: 22px; }
  .saju8-info { font-size: 11px; color: #666; margin-top: 10px; text-align: center; }
  .factor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
  .factor-card { padding: 10px 12px; border-radius: 10px; }
  .factor-card .icon { font-size: 14px; }
  .factor-card .name { font-size: 12px; font-weight: 700; }
  .factor-card .kind { font-size: 10px; color: #666; margin: 2px 0 6px; }
  .factor-card .strength-bar { height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; margin: 5px 0; }
  .factor-card .strength-fill { height: 100%; border-radius: 3px; }
  .factor-card .strength-label { font-size: 10.5px; font-weight: 700; }
  .factor-card .position { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 9.5px; color: #888; margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(0,0,0,0.08); }
  .factor-card .card-toggle { color: #aaa; font-size: 13px; font-weight: 700; line-height: 1; }
  .factor-card .note { font-size: 9.5px; color: #999; margin-top: 4px; font-style: italic; }
  .factor-card .card-detail { display: none; font-size: 10.5px; line-height: 1.65; color: #555; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.08); }
  .factor-card.expanded .card-detail { display: block; }
  .factor-table { background: #fef9f6; padding: 14px; border-radius: 10px; margin: 14px 0; }
  .factor-table h4 { font-size: 12px; color: #666; margin-bottom: 10px; font-weight: 600; }
  .factor-row { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .factor-positive, .factor-negative { background: #fff; padding: 12px 14px; border-radius: 8px; }
  .factor-positive { border-left: 4px solid #95C540; }
  .factor-negative { border-left: 4px solid #d97757; }
  .factor-positive .ftitle { font-size: 12px; font-weight: 700; color: #5d8225; display: block; margin-bottom: 8px; }
  .factor-negative .ftitle { font-size: 12px; font-weight: 700; color: #c84d20; display: block; margin-bottom: 8px; }
  .factor-positive ul, .factor-negative ul { list-style: none; font-size: 12px; color: #555; line-height: 1.65; padding-left: 0; margin: 0; }
  .factor-positive li, .factor-negative li { padding: 3px 0; }
  .factor-positive li::before { content: "✓ "; color: #95C540; font-weight: 700; }
  .factor-negative li::before { content: "⚠ "; color: #d97757; font-weight: 700; }
  .han { font-family: "Times New Roman", serif; color: #777; display: inline-block; margin-left: 2px; line-height: 1.25; }
  .matrix-card { padding: 14px 16px; border-radius: 12px; margin: 12px 0; }
  .syn-card { background: linear-gradient(135deg, #fff5e8 0%, #fef0d8 100%); border-left: 4px solid #d4a838; }
  .con-card { background: linear-gradient(135deg, #f5f5f7 0%, #eaeaef 100%); border-left: 4px solid #8a8a9e; }
  .amb-card { background: linear-gradient(135deg, #fdf0e6 0%, #fae0c8 100%); border-left: 4px solid #c4a578; }
  .matrix-card .header { font-size: 13px; font-weight: 700; }
  .syn-card .header { color: #8a6e1a; }
  .con-card .header { color: #5a5a73; }
  .matrix-card .sub { font-size: 11px; color: #888; margin-bottom: 10px; }
  .matrix-card .body { font-size: 12px; color: #444; line-height: 1.7; }
  .tip-box { background: linear-gradient(135deg, #f5f8e8 0%, #ecf4d5 100%); padding: 14px; border-radius: 12px; margin: 16px 0; border: 1px solid #d4e4a8; }
  .tip-box .tip-label { font-size: 12px; color: #5d8225; font-weight: 700; margin-bottom: 10px; }
  .tip-box .tip-item { background: white; padding: 12px 14px; border-radius: 8px; margin: 8px 0; border-left: 3px solid #95C540; }
  .tip-box .tip-item .tip-title { font-weight: 700; color: #5d8225; font-size: 13px; margin-bottom: 5px; }
  .tip-box .tip-item .tip-desc { font-size: 12px; color: #555; line-height: 1.65; }
  .strength-box, .care-box { background: white; padding: 12px 14px; border-radius: 10px; margin: 10px 0; }
  .strength-box .title { color: #c84d20; font-weight: 600; font-size: 13px; }
  .care-box .title { color: #5d8225; font-weight: 600; font-size: 13px; }
  .strength-box ul, .care-box ul { list-style: none; padding-left: 2px; margin: 8px 0 0; }
  .strength-box li, .care-box li { font-size: 12.5px; line-height: 1.75; color: #555; margin: 5px 0; }
  .gunghap { background: #faf6f1; padding: 18px; border-radius: 14px; margin: 18px 0; text-align: center; }
  .gunghap-summary { text-align: center; font-size: 12px; color: #666; margin-top: 14px; padding: 12px 14px; background: white; border-radius: 8px; }
  .cover { min-height: 640px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: linear-gradient(180deg, #fef0e6 0%, #fdfaf6 100%); }
  .cover .title { font-size: 26px; font-weight: 800; color: #c84d20; margin-bottom: 12px; }
  .cover .subtitle { font-size: 13px; color: #888; margin-bottom: 28px; }
  .cover .info { font-size: 12px; color: #555; line-height: 1.9; }
  .cover .jado-mark { margin-top: 40px; font-size: 11px; color: #aaa; }
  .disclaimer { background: #fafaf8; padding: 10px 14px; border-radius: 8px; font-size: 11px; color: #888; margin: 18px 0; border: 1px dashed #ddd; }
  .transition-page { background: linear-gradient(180deg, #fef9f6 0%, #faf0e8 100%); display: flex; flex-direction: column; justify-content: center; }
  .transition-content { text-align: center; padding: 30px 0; }
  .transition-icon { font-size: 42px; }
  .transition-title { font-size: 18px; font-weight: 700; color: #c84d20; line-height: 1.6; }
  .transition-divider { width: 36px; height: 2px; background: #d97757; margin: 20px auto; opacity: 0.5; }
  .transition-body { font-size: 13px; line-height: 1.9; color: #555; margin: 14px 0; }
  .transition-body.emphasis { font-weight: 600; color: #c84d20; }
  .preview-item { display: flex; gap: 10px; padding: 12px 14px; background: #faf6f1; border-radius: 10px; margin-bottom: 8px; }
  .preview-num { font-size: 18px; color: #d97757; font-weight: 700; }
  .preview-title { font-weight: 700; color: #444; font-size: 13px; }
  .preview-desc { font-size: 11px; color: #777; }
  .value-message { background: linear-gradient(135deg, #fef0e6 0%, #fdfaf6 100%); padding: 20px 16px; border-radius: 12px; text-align: center; }
  .value-mark { font-size: 20px; }
  .value-message p { font-size: 12px; }
  .value-final { font-weight: 700; color: #c84d20; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #eee; text-align: left; }
  th { background: #f8f5f1; color: #555; }
  h3 { font-size: 15px; font-weight: 700; margin: 16px 0 8px; color: #444; }
  p { font-size: 13px; line-height: 1.75; color: #444; margin: 10px 0; }
  @media (max-width: 760px) { .summary-grid { grid-template-columns: 1fr; } }
`;

const samples = [];
for (let i = 0; i < N; i++) samples.push(sampleBlock(i));

const toc = Array.from({ length: N }, (_, i) => `<a href="#sample-${i + 1}">샘플 ${i + 1}</a>`).join('');
const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>자도인 랜덤 샘플 ${N}건</title>
  <style>${style}</style>
</head>
<body>
  <div class="topbar">
    <h1>자도인 랜덤 샘플 ${N}건</h1>
    <p>검토 포인트: 동물 매칭이 납득되는지, 부모 카드 문구가 과하지 않은지, 같은 패턴이 지겹게 반복되는지.</p>
    <div class="toc">${toc}</div>
  </div>
  ${samples.join('\n')}
</body>
</html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');

console.log(OUT_FILE);
