// 부모 6축 + 부모-자녀 매트릭스 편중 QA
//
// 이관 전 검증용. 자녀 1명 + 부모 2명 랜덤 사주를 만들어
// 부모 6축 분포, 강한 축 선택, 매트릭스 카드 패턴 편중을 확인한다.

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';

const N = parseInt(process.argv[2] ?? '300', 10);
const HOUR_OPTIONS = [
  '자시 (23:30~01:29)', '축시 (01:30~03:29)', '인시 (03:30~05:29)',
  '묘시 (05:30~07:29)', '진시 (07:30~09:29)', '사시 (09:30~11:29)',
  '오시 (11:30~13:29)', '미시 (13:30~15:29)', '신시 (15:30~17:29)',
  '유시 (17:30~19:29)', '술시 (19:30~21:29)', '해시 (21:30~23:29)',
];
const AXES = ['ongi', 'jungsim', 'ilgwan', 'jayul', 'pyohyeon', 'baram'];
const AXIS_KO = {
  ongi: '온기',
  jungsim: '중심',
  ilgwan: '일관',
  jayul: '자율',
  pyohyeon: '표현',
  baram: '바람',
};

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

function pct(count, total) {
  return Math.round((count / total) * 100);
}

function axisStats(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / values.length);
  return {
    avg,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
    low: values.filter(v => v <= 40).length,
    mid: values.filter(v => v >= 41 && v <= 65).length,
    high: values.filter(v => v >= 66).length,
  };
}

console.log('='.repeat(75));
console.log(` 부모 6축 + 매트릭스 QA (${N}가족, 부모 2명 기준)`);
console.log('='.repeat(75));

const axisValues = Object.fromEntries(AXES.map(k => [k, []]));
const strongAxisCount = Object.fromEntries(AXES.map(k => [k, 0]));
const patternCount = {};
const cardAxisCount = Object.fromEntries(AXES.map(k => [k, 0]));
const cardFactorCount = {};
const parentCardCount = { mother: 0, father: 0 };
const failures = [];

for (let i = 0; i < N; i++) {
  try {
    const child = makeFixture({ role: 'child', index: i, startY: 2020, endY: 2023, gender: Math.random() < 0.5 ? '여' : '남' });
    const mother = makeFixture({ role: 'mother', index: i, startY: 1980, endY: 1995, gender: '여' });
    const father = makeFixture({ role: 'father', index: i, startY: 1978, endY: 1993, gender: '남' });
    const facts = buildFacts({ childSaju: child, motherSaju: mother, fatherSaju: father, testDate: '2026-05-17' });

    for (const axes of [facts.motherAxes, facts.fatherAxes]) {
      for (const k of AXES) {
        axisValues[k].push(axes[k].score);
      }
    }
    for (const a of facts.matrixCards.motherStrongAxes) strongAxisCount[a.key]++;
    for (const a of facts.matrixCards.fatherStrongAxes) strongAxisCount[a.key]++;

    for (const [side, cards] of [['mother', facts.matrixCards.motherCards], ['father', facts.matrixCards.fatherCards]]) {
      parentCardCount[side] += cards.length;
      for (const c of cards) {
        patternCount[c.pattern] = (patternCount[c.pattern] ?? 0) + 1;
        cardAxisCount[c.axis] = (cardAxisCount[c.axis] ?? 0) + 1;
        cardFactorCount[c.factorKorean] = (cardFactorCount[c.factorKorean] ?? 0) + 1;
      }
    }
  } catch (e) {
    failures.push(e.message);
  }
}

const families = N - failures.length;
const parentCount = families * 2;
const cardTotal = Object.values(patternCount).reduce((a, b) => a + b, 0);

console.log(`성공 ${families}/${N}, 실패 ${failures.length}`);
console.log();

console.log('부모 6축 점수 분포');
console.log('-'.repeat(75));
console.log('  축      평균  표준편차  최소  최대   낮음  중간  높음');
console.log('-'.repeat(75));
for (const k of AXES) {
  const d = axisStats(axisValues[k]);
  console.log(`  ${AXIS_KO[k].padEnd(4)}  ${d.avg.toFixed(1).padStart(5)}   ${d.std.toFixed(1).padStart(5)}   ${String(d.min).padStart(3)}   ${String(d.max).padStart(3)}   ${String(pct(d.low, parentCount) + '%').padStart(4)}  ${String(pct(d.mid, parentCount) + '%').padStart(4)}  ${String(pct(d.high, parentCount) + '%').padStart(4)}`);
}
console.log();

console.log('강한 부모축 선택 빈도');
console.log('-'.repeat(75));
for (const k of AXES) {
  const p = pct(strongAxisCount[k], Object.values(strongAxisCount).reduce((a, b) => a + b, 0));
  console.log(`  ${AXIS_KO[k].padEnd(4)}  ${String(strongAxisCount[k]).padStart(4)}  ${String(p + '%').padStart(4)}  ${'█'.repeat(Math.round(p / 2))}`);
}
console.log();

console.log('매트릭스 카드 패턴 분포');
console.log('-'.repeat(75));
for (const [k, v] of Object.entries(patternCount).sort((a, b) => b[1] - a[1])) {
  const p = pct(v, cardTotal);
  console.log(`  ${k.padEnd(16)} ${String(v).padStart(4)}  ${String(p + '%').padStart(4)}  ${'█'.repeat(Math.round(p / 2))}`);
}
console.log();

console.log('매트릭스 카드 축 분포');
console.log('-'.repeat(75));
for (const k of AXES) {
  const p = pct(cardAxisCount[k], cardTotal);
  console.log(`  ${AXIS_KO[k].padEnd(4)}  ${String(cardAxisCount[k]).padStart(4)}  ${String(p + '%').padStart(4)}  ${'█'.repeat(Math.round(p / 2))}`);
}
console.log();

console.log('매트릭스 카드 자녀 요인 분포');
console.log('-'.repeat(75));
for (const [k, v] of Object.entries(cardFactorCount).sort((a, b) => b[1] - a[1])) {
  const p = pct(v, cardTotal);
  console.log(`  ${k.padEnd(4)}  ${String(v).padStart(4)}  ${String(p + '%').padStart(4)}  ${'█'.repeat(Math.round(p / 2))}`);
}
console.log('='.repeat(75));
