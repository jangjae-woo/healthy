// 사람 눈 QA 보조 요약
//
// 랜덤 가족 N건을 만들어 동물/케이스/부모카드/주의 표현 빈도를 센다.
// 목적은 산식 판정이 아니라, 사람이 읽기 전에 반복/과잉 패턴 후보를 찾는 것.

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { buildFacts } from '../lib/youa/facts-builder.mjs';

const N = parseInt(process.argv[2] ?? '100', 10);

const HOUR_OPTIONS = [
  '자시 (23:30~01:29)', '축시 (01:30~03:29)', '인시 (03:30~05:29)',
  '묘시 (05:30~07:29)', '진시 (07:30~09:29)', '사시 (09:30~11:29)',
  '오시 (11:30~13:29)', '미시 (13:30~15:29)', '신시 (15:30~17:29)',
  '유시 (17:30~19:29)', '술시 (19:30~21:29)', '해시 (21:30~23:29)',
];

const WATCH_WORDS = [
  '위축',
  '부담',
  '과잉 자극',
  '평가',
  '잃을 수',
  '오래 남',
  '과부하',
];

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

function inc(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

function pct(n, total) {
  return Math.round((n / total) * 100);
}

function printCount(title, map, total, limit = 20) {
  console.log(title);
  console.log('-'.repeat(75));
  for (const [key, count] of Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, limit)) {
    const p = pct(count, total);
    console.log(`  ${key.padEnd(20)} ${String(count).padStart(4)}  ${String(p + '%').padStart(4)}  ${'█'.repeat(Math.round(p / 2))}`);
  }
  console.log();
}

const animalCount = {};
const animalCaseCount = {};
const cardPatternCount = {};
const cardAxisCount = {};
const cardFactorCount = {};
const watchWordCount = {};
const watchSamples = [];
const noCardCases = [];
let families = 0;
let cardTotal = 0;

for (let i = 0; i < N; i++) {
  try {
    const child = makeFixture({ role: 'child', index: i, startY: 2020, endY: 2023, gender: Math.random() < 0.5 ? '여' : '남' });
    const mother = makeFixture({ role: 'mother', index: i, startY: 1980, endY: 1995, gender: '여' });
    const father = makeFixture({ role: 'father', index: i, startY: 1978, endY: 1993, gender: '남' });
    const facts = buildFacts({ childSaju: child, motherSaju: mother, fatherSaju: father, testDate: '2026-05-17' });
    families++;

    inc(animalCount, facts.animal.name);
    inc(animalCaseCount, facts.animal.caseLabel);

    for (const [side, cards] of [['어머님', facts.matrixCards.motherCards], ['아버님', facts.matrixCards.fatherCards]]) {
      if (cards.length === 0) noCardCases.push(`${i + 1} ${side} card=0`);
      for (const card of cards) {
        cardTotal++;
        inc(cardPatternCount, card.pattern);
        inc(cardAxisCount, card.axisKorean);
        inc(cardFactorCount, card.factorKorean);

        const text = `${card.header} ${card.tone}`;
        for (const word of WATCH_WORDS) {
          if (text.includes(word)) {
            inc(watchWordCount, word);
            if (watchSamples.length < 12) {
              watchSamples.push(`${side}: ${card.axisKorean}×${card.factorKorean} [${card.pattern}] ${card.header}`);
            }
          }
        }
      }
    }
  } catch (error) {
    noCardCases.push(`${i + 1} failed: ${error.message}`);
  }
}

console.log('='.repeat(75));
console.log(` 사람 눈 QA 보조 요약 (${families}/${N}가족, 카드 ${cardTotal}장)`);
console.log('='.repeat(75));
console.log();

printCount('동물 분포', animalCount, families);
printCount('동물 케이스 분포', animalCaseCount, families);
printCount('매트릭스 카드 패턴 분포', cardPatternCount, cardTotal);
printCount('매트릭스 카드 축 분포', cardAxisCount, cardTotal);
printCount('매트릭스 카드 자녀 요인 분포', cardFactorCount, cardTotal);
printCount('주의 표현 빈도', watchWordCount, cardTotal);

if (watchSamples.length > 0) {
  console.log('주의 표현 샘플');
  console.log('-'.repeat(75));
  for (const sample of watchSamples) console.log(`  - ${sample}`);
  console.log();
}

if (noCardCases.length > 0) {
  console.log('카드/생성 이상 후보');
  console.log('-'.repeat(75));
  for (const item of noCardCases.slice(0, 20)) console.log(`  - ${item}`);
  console.log();
}

console.log('판정 메모');
console.log('-'.repeat(75));
console.log('  이 스크립트는 실패/통과를 판정하지 않는다.');
console.log('  특정 축·문구가 과하게 반복되면 사람 눈 QA에서 먼저 확인한다.');
console.log('='.repeat(75));
