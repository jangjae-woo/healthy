// 랜덤 가족 QA 샘플 출력
//
// 사람이 읽으며 동물/6요인/부모 매트릭스 문맥을 확인하기 위한 요약.

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';

const N = parseInt(process.argv[2] ?? '10', 10);
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

function factorLine(factors) {
  return Object.values(factors)
    .map(f => `${f.factorKorean}:${LEVEL[f.level]}(${f.score}백분위)`)
    .join(' / ');
}

function cardLine(cards) {
  return cards.map(c => `${c.axisKorean}×${c.factorKorean} [${c.pattern}] ${c.header}`).join('\n    ');
}

console.log('='.repeat(75));
console.log(` 랜덤 가족 QA 샘플 ${N}건`);
console.log('='.repeat(75));

for (let i = 0; i < N; i++) {
  const child = makeFixture({ role: 'child', index: i, startY: 2020, endY: 2023, gender: Math.random() < 0.5 ? '여' : '남' });
  const mother = makeFixture({ role: 'mother', index: i, startY: 1980, endY: 1995, gender: '여' });
  const father = makeFixture({ role: 'father', index: i, startY: 1978, endY: 1993, gender: '남' });
  const facts = buildFacts({ childSaju: child, motherSaju: mother, fatherSaju: father });

  console.log(`\n[${i + 1}] ${facts.child.fullTitle} ${sajuLine(child)} / 일간 ${child.ilgan} / 신강 ${child.shinkang.level}`);
  console.log(`  6요인: ${factorLine(facts.childFactors)}`);
  console.log(`  동물: ${facts.animal.name} (${facts.animal.caseLabel})`);
  console.log(`  어머님 강축: ${facts.matrixCards.motherStrongAxes.map(a => a.korean).join(', ')}`);
  console.log(`  어머님 카드:\n    ${cardLine(facts.matrixCards.motherCards)}`);
  console.log(`  아버님 강축: ${facts.matrixCards.fatherStrongAxes.map(a => a.korean).join(', ')}`);
  console.log(`  아버님 카드:\n    ${cardLine(facts.matrixCards.fatherCards)}`);
}

console.log('\n' + '='.repeat(75));
