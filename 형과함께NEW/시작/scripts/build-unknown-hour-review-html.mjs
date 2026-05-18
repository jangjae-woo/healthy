// 시간 모름 조합 검토용 HTML.
// 운영 코드 반영 전, 아이/어머님/아버님의 시간 미상 조합 8가지를 한 화면에서 본다.

import fs from 'node:fs';
import path from 'node:path';
import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';
import { mockLLMResponse } from '../lib/youa/mock-llm.mjs';
import { parseLLMOutput, attachLLMTextToFacts } from '../lib/youa/output-parser.mjs';
import { validateLLMOutput } from '../lib/youa/output-validator.mjs';
import { renderReport } from '../lib/youa/render.mjs';

const OUT_DIR = path.resolve('review');
const OUT_FILE = path.join(OUT_DIR, 'youa-unknown-hour-samples.html');
const BASE_REVIEW = path.join(OUT_DIR, 'youa-review-samples-5.html');

const PEOPLE = {
  child: {
    name: 'child0',
    genderCore: '여',
    genderFixture: 'female',
    role: 'child',
    birthDate: '2021-08-17',
    knownHour: '인시 (03:30~05:29)',
  },
  mother: {
    name: 'mother0',
    genderCore: '여',
    genderFixture: 'female',
    role: 'mother',
    birthDate: '1989-04-21',
    knownHour: '사시 (09:30~11:29)',
  },
  father: {
    name: 'father0',
    genderCore: '남',
    genderFixture: 'male',
    role: 'father',
    birthDate: '1987-11-05',
    knownHour: '술시 (19:30~21:29)',
  },
};

const CASES = [
  { title: '0. 모두 시간 입력', unknown: [] },
  { title: '1. 아이만 시간 모름', unknown: ['child'] },
  { title: '2. 어머님만 시간 모름', unknown: ['mother'] },
  { title: '3. 아버님만 시간 모름', unknown: ['father'] },
  { title: '4. 아이 + 어머님 시간 모름', unknown: ['child', 'mother'] },
  { title: '5. 아이 + 아버님 시간 모름', unknown: ['child', 'father'] },
  { title: '6. 어머님 + 아버님 시간 모름', unknown: ['mother', 'father'] },
  { title: '7. 아이 + 어머님 + 아버님 모두 시간 모름', unknown: ['child', 'mother', 'father'] },
];

function splitDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

function normalizeUnknownHourFixture(fixture, isUnknown) {
  if (!isUnknown) return fixture;
  return {
    ...fixture,
    pillars: {
      ...fixture.pillars,
      hour: { stem: '', branch: '' },
    },
    sipseong: {
      ...fixture.sipseong,
      hour: { stem: '', branch: '' },
    },
    isHourUnknown: true,
  };
}

function makeFixture(key, unknownKeys) {
  const p = PEOPLE[key];
  const isUnknown = unknownKeys.includes(key);
  const d = splitDate(p.birthDate);
  const core = computeFullSajuCore({
    ...d,
    hour: isUnknown ? '시간 모름' : p.knownHour,
    calendar: '양력',
    gender: p.genderCore,
  });
  if (!core) throw new Error(`${key} saju core failed`);
  const fixture = sajuCoreToFixture(core, {
    name: p.name,
    gender: p.genderFixture,
    birthDate: p.birthDate,
    role: p.role,
    testDate: '2026-05-17',
  });
  return normalizeUnknownHourFixture(fixture, isUnknown);
}

function unknownNotice(unknownKeys) {
  if (unknownKeys.length === 0) {
    return '세 사람 모두 출생시간을 입력한 기준 샘플입니다.';
  }
  const labels = unknownKeys.map(k => k === 'child' ? '아이' : k === 'mother' ? '어머님' : '아버님');
  return `${labels.join(' · ')}의 출생시간이 없어 시주는 미상으로 표시했습니다. 본 샘플은 연월일 중심의 큰 기질과 관계 흐름을 보는 기준입니다.`;
}

function normalizeRenderedUnknownHour(html) {
  return html
    .replaceAll('<div class="char">undefined</div>', '<div class="char unknown-hour">미상</div>')
    .replaceAll('undefinedundefined', '시간 미상')
    .replaceAll(' /  / ', ' / 시간 미상 / ');
}

function sampleBlock(item, index) {
  const childSaju = makeFixture('child', item.unknown);
  const motherSaju = makeFixture('mother', item.unknown);
  const fatherSaju = makeFixture('father', item.unknown);
  const facts = buildFacts({ childSaju, motherSaju, fatherSaju, testDate: '2026-05-17' });
  const parsed = parseLLMOutput(mockLLMResponse(facts));
  const validation = validateLLMOutput(parsed, facts);
  const rendered = normalizeRenderedUnknownHour(renderReport(attachLLMTextToFacts(facts, parsed)));
  const unknownLabels = item.unknown.length ? item.unknown.join(', ') : 'none';

  return `
    <section class="sample" id="case-${index}">
      <div class="sample-summary">
        <div class="summary-title">${item.title}</div>
        <div class="unknown-note">${unknownNotice(item.unknown)}</div>
        <div class="summary-grid">
          <div>
            <h2>검토 상태</h2>
            <p>unknown: ${unknownLabels}</p>
            <p class="${validation.valid ? 'ok' : 'bad'}">validator: ${validation.valid ? '통과' : `실패 (${validation.violations.length}건)`}</p>
          </div>
          <div>
            <h2>아이 결과</h2>
            <p>${facts.child.fullTitle} · ${facts.animal.name} · ${facts.animal.caseLabel}</p>
          </div>
          <div>
            <h2>보는 포인트</h2>
            <p>時 칸이 미상으로 자연스럽게 보이는지, 문장이 단정적으로 느껴지는지 확인</p>
          </div>
        </div>
      </div>
      ${rendered}
    </section>
  `;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const baseHtml = fs.existsSync(BASE_REVIEW) ? fs.readFileSync(BASE_REVIEW, 'utf8') : '';
const baseStyle = baseHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const baseScript = baseHtml.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>시간 모름 조합 검토</title>
  <style>
    ${baseStyle}
    .unknown-note { background:#fff8e8;border-left:4px solid #d4a838;border-radius:8px;padding:10px 12px;margin:8px 0 12px;font-size:13px;color:#5d4a1b;line-height:1.7; }
    .unknown-hour { font-size:13px !important;color:#999 !important;font-weight:700;letter-spacing:0 !important; }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>시간 모름 조합 검토</h1>
    <p>아이/어머님/아버님의 출생시간 미상 8가지 조합을 한 번에 비교합니다.</p>
    <div class="toc">${CASES.map((c, i) => `<a href="#case-${i}">${i}</a>`).join('')}</div>
  </div>
  ${CASES.map(sampleBlock).join('\n')}
  <script>${baseScript}</script>
</body>
</html>`;

fs.writeFileSync(OUT_FILE, html, 'utf8');
console.log(OUT_FILE);
