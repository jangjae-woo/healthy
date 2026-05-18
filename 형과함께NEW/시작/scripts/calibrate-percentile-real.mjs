// 진짜 만세력 기반 percentile 캘리브레이션
//
// 같은 표본에서 calcAll6Factors()의 base0Score를 기준 분포로 삼아
// raw base0 점수 -> percentile 점수로 변환한다.
//
// 목적:
// - 기존 z-score 보정안과 형 제안안(base 0 + percentile + 어울림 재매핑)을 비교
// - percentile 자체가 사용자 노출 점수로 적합한지 분포와 동물 편중을 확인

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { calcAll6Factors } from '../lib/youa/factors.mjs';

const N = parseInt(process.argv[2] ?? '500', 10);
const FACTORS = ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi'];
const FACTOR_KO = {
  hwalgi: '활기',
  josim: '조심',
  manjok: '만족',
  heundeullim: '흔들림',
  eoullim: '어울림',
  kkeungi: '끈기',
};
const ANIMAL_MAP = {
  hwalgi: '호랑이',
  josim: '토끼',
  manjok: '말',
  heundeullim: '돼지',
  eoullim: '양',
  kkeungi: '소',
};
const HOUR_OPTIONS = [
  '자시 (23:30~01:29)', '축시 (01:30~03:29)', '인시 (03:30~05:29)',
  '묘시 (05:30~07:29)', '진시 (07:30~09:29)', '사시 (09:30~11:29)',
  '오시 (11:30~13:29)', '미시 (13:30~15:29)', '신시 (15:30~17:29)',
  '유시 (17:30~19:29)', '술시 (19:30~21:29)', '해시 (21:30~23:29)',
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

function percentileFromSorted(sorted, raw) {
  const below = sorted.filter(v => v < raw).length;
  const equal = sorted.filter(v => v === raw).length;
  const midpointRank = below + equal / 2;
  return Math.round((midpointRank / sorted.length) * 100);
}

function percentileLevel(p) {
  if (p <= 25) return 'low';
  if (p <= 75) return 'mid';
  return 'high';
}

function displayLevel(p) {
  if (p <= 30) return 'low';
  if (p <= 70) return 'mid';
  return 'high';
}

function stats(scores, levelFn) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(scores.reduce((acc, s) => acc + (s - avg) ** 2, 0) / scores.length);
  const low = scores.filter(s => levelFn(s) === 'low').length;
  const mid = scores.filter(s => levelFn(s) === 'mid').length;
  const high = scores.filter(s => levelFn(s) === 'high').length;
  return {
    avg,
    std,
    min: Math.min(...scores),
    max: Math.max(...scores),
    lowPct: Math.round((low / scores.length) * 100),
    midPct: Math.round((mid / scores.length) * 100),
    highPct: Math.round((high / scores.length) * 100),
  };
}

function animalDistribution(samples, scoreKey, levelFn) {
  const count = { 호랑이: 0, 토끼: 0, 말: 0, 돼지: 0, 양: 0, 소: 0, 용: 0 };
  for (const s of samples) {
    const sorted = Object.entries(s.factors)
      .map(([key, value]) => ({ key, score: value[scoreKey] }))
      .sort((a, b) => b.score - a.score);
    const allMid = sorted.every(v => levelFn(v.score) === 'mid');
    if (allMid || levelFn(sorted[0].score) !== 'high') count.용++;
    else count[ANIMAL_MAP[sorted[0].key]]++;
  }
  return count;
}

console.log('='.repeat(75));
console.log(` 진짜 만세력 기반 percentile 캘리브레이션 (${N}개)`);
console.log('='.repeat(75));

const samples = [];
let failCount = 0;
const t0 = performance.now();

for (let i = 0; i < N; i++) {
  try {
    const { y, m, d } = randDateInRange(2020, 2023);
    const hour = randHour();
    const gender = Math.random() < 0.5 ? '여' : '남';
    const core = computeFullSajuCore({ year: y, month: m, day: d, hour, calendar: '양력', gender });
    if (!core) { failCount++; continue; }
    const fixture = sajuCoreToFixture(core, {
      name: `샘플${i}`,
      gender: gender === '여' ? 'female' : 'male',
      birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      role: 'child',
      testDate: '2026-05-17',
    });
    const factors = calcAll6Factors(fixture);
    samples.push({ fixture, factors });
  } catch {
    failCount++;
  }
}

const profiles = {};
for (const k of FACTORS) {
  profiles[k] = samples.map(s => s.factors[k].base0Score).sort((a, b) => a - b);
}

for (const sample of samples) {
  for (const k of FACTORS) {
    sample.factors[k].percentileScore = percentileFromSorted(profiles[k], sample.factors[k].base0Score);
  }
}

const t1 = performance.now();
console.log(`성공 ${samples.length}/${N}, 실패 ${failCount}, ${Math.round(t1 - t0)}ms\n`);

function printDistribution(title, scoreKey, levelFn) {
  console.log(title);
  console.log('-'.repeat(75));
  console.log('  요인     평균  표준편차  최소  최대   낮음  중간  높음');
  console.log('-'.repeat(75));
  for (const k of FACTORS) {
    const d = stats(samples.map(s => s.factors[k][scoreKey]), levelFn);
    console.log(`  ${FACTOR_KO[k].padEnd(4)}    ${d.avg.toFixed(1).padStart(4)}    ${d.std.toFixed(1).padStart(4)}   ${String(d.min).padStart(3)}   ${String(d.max).padStart(3)}   ${String(d.lowPct + '%').padStart(4)}  ${String(d.midPct + '%').padStart(4)}  ${String(d.highPct + '%').padStart(4)}`);
  }
  console.log();
}

printDistribution('A. 현재 기본 고객용 score 분포 (숫자 임계값 참고 0~40/41~65/66~100)', 'score', s => s <= 40 ? 'low' : s <= 65 ? 'mid' : 'high');
printDistribution('B. base0 raw 분포 (-100~100, 참고용)', 'base0Score', s => s < -10 ? 'low' : s <= 10 ? 'mid' : 'high');
printDistribution('C. percentile 분포 (사분위 라벨 0~25/26~75/76~100)', 'percentileScore', percentileLevel);
printDistribution('D. percentile 표시 분포 (시안 친화 라벨 0~30/31~70/71~100)', 'percentileScore', displayLevel);

function printAnimals(title, scoreKey, levelFn) {
  console.log(title);
  console.log('-'.repeat(75));
  const dist = animalDistribution(samples, scoreKey, levelFn);
  for (const [name, count] of Object.entries(dist)) {
    const pct = Math.round((count / samples.length) * 100);
    console.log(`  ${name.padEnd(4)}  ${String(count).padStart(3)}  ${String(pct + '%').padStart(4)}  ${'█'.repeat(Math.round(pct / 2))}`);
  }
  console.log();
}

printAnimals('동물 분포: 현재 기본 고객용 score', 'score', s => s <= 40 ? 'low' : s <= 65 ? 'mid' : 'high');
printAnimals('동물 분포: percentile 사분위 라벨', 'percentileScore', percentileLevel);
printAnimals('동물 분포: percentile 시안 친화 라벨', 'percentileScore', displayLevel);

console.log('percentile 프로필 요약');
console.log('-'.repeat(75));
for (const k of FACTORS) {
  const p = profiles[k];
  const q = idx => p[Math.min(p.length - 1, Math.max(0, Math.floor(idx * (p.length - 1))))];
  console.log(`  ${FACTOR_KO[k]} base0 p10=${q(0.10)}, p25=${q(0.25)}, p50=${q(0.50)}, p75=${q(0.75)}, p90=${q(0.90)}`);
}
console.log('='.repeat(75));
