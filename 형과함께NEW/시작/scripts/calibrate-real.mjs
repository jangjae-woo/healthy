// 진짜 만세력 기반 100개 캘리브레이션
//
// 무작위 양력 생일 (2020-01-01 ~ 2023-12-31) + 12시지 → 진짜 만세력 → 6요인 점수
// 분포 분석 → 이상 범위 (낮음 25~30 / 중간 40~50 / 높음 25~30) 검증
//
// 작성: 2026-05-17

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { calcAll6Factors } from '../lib/youa/factors.mjs';
import { matchAnimal } from '../lib/youa/animal.mjs';

const N = parseInt(process.argv[2] ?? '100', 10);

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

console.log(`═══════════════════════════════════════════════════════════════`);
console.log(` 진짜 만세력 기반 ${N}개 캘리브레이션`);
console.log(`═══════════════════════════════════════════════════════════════\n`);

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
      name: `샘플${i}`, gender: gender === '여' ? 'female' : 'male',
      birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      role: 'child', testDate: '2026-05-17',
    });
    const factors = calcAll6Factors(fixture);
    samples.push({ pillars: core.pillars, factors, ilgan: core.ilgan, shinkang: core.shinkang });
  } catch (e) {
    failCount++;
  }
}
const t1 = performance.now();

console.log(`✓ ${samples.length}/${N} 성공 / ${failCount} 실패 (${Math.round(t1 - t0)}ms)\n`);

// ─── 분포 분석 ───
const FACTOR_KO = { hwalgi: '활기', josim: '조심', manjok: '만족', heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기' };

console.log(`📊 6요인 분포 (이상: 낮음 25~30 / 중간 40~50 / 높음 25~30)`);
console.log('─'.repeat(75));
console.log('  요인     평균  표준편차  최소  최대   낮음  중간  높음   판정');
console.log('─'.repeat(75));

const dist = {};
for (const k of ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi']) {
  const scores = samples.map(s => s.factors[k].score);
  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const std = Math.sqrt(scores.reduce((acc, s) => acc + (s - avg) ** 2, 0) / scores.length);
  const levels = samples.map(s => s.factors[k].level);
  const low = levels.filter(s => s === 'low').length;
  const mid = levels.filter(s => s === 'mid').length;
  const high = levels.filter(s => s === 'high').length;
  const lowPct = Math.round((low / scores.length) * 100);
  const midPct = Math.round((mid / scores.length) * 100);
  const highPct = Math.round((high / scores.length) * 100);

  const issues = [];
  if (lowPct < 15) issues.push(`낮음↓`);
  if (lowPct > 40) issues.push(`낮음↑`);
  if (midPct < 30) issues.push(`중간↓`);
  if (midPct > 60) issues.push(`중간↑`);
  if (highPct < 15) issues.push(`높음↓`);
  if (highPct > 40) issues.push(`높음↑`);

  const verdict = issues.length === 0 ? '✓' : `⚠ ${issues.join(' ')}`;

  dist[k] = { avg, std, low, mid, high, lowPct, midPct, highPct, issues, ok: issues.length === 0 };

  console.log(`  ${FACTOR_KO[k].padEnd(4)}    ${String(avg.toFixed(1)).padStart(4)}    ${String(std.toFixed(1)).padStart(4)}   ${String(Math.min(...scores)).padStart(3)}   ${String(Math.max(...scores)).padStart(3)}   ${String(lowPct + '%').padStart(4)}  ${String(midPct + '%').padStart(4)}  ${String(highPct + '%').padStart(4)}   ${verdict}`);
}
console.log();

// ─── 동물 매칭 분포 ───
const animalCount = { 호랑이: 0, 토끼: 0, 말: 0, 돼지: 0, 양: 0, 소: 0, 용: 0 };
for (const s of samples) {
  const matched = matchAnimal(s.factors);
  animalCount[matched.animal.name]++;
}

console.log(`🐮 동물 매칭 분포`);
console.log('─'.repeat(75));
for (const [k, c] of Object.entries(animalCount)) {
  const pct = Math.round((c / samples.length) * 100);
  const bar = '█'.repeat(Math.round(pct / 2));
  console.log(`  ${k.padEnd(4)}  ${String(c).padStart(3)}  ${String(pct + '%').padStart(4)}  ${bar}`);
}
console.log();

// ─── 신강 분포 ───
const shinkangCount = {};
for (const s of samples) {
  shinkangCount[s.shinkang] = (shinkangCount[s.shinkang] ?? 0) + 1;
}
console.log(`💪 신강 레벨 분포`);
console.log('─'.repeat(75));
for (const level of ['극약', '태약', '신약', '중화', '신강', '태강', '극왕']) {
  const c = shinkangCount[level] ?? 0;
  const pct = Math.round((c / samples.length) * 100);
  console.log(`  ${level.padEnd(4)}  ${String(c).padStart(3)}  ${pct}%`);
}
console.log();

// ─── 종합 판정 ───
const fails = Object.entries(dist).filter(([, d]) => !d.ok);
console.log('═'.repeat(75));
if (fails.length === 0) {
  console.log('✅ 캘리브레이션 통과 — 모든 6요인 이상 분포');
} else {
  console.log(`⚠ ${fails.length}개 요인 분포 위반:`);
  for (const [k, d] of fails) {
    console.log(`  - ${FACTOR_KO[k]}: ${d.issues.join(', ')}`);
  }
  console.log('\n조정 권고:');
  console.log('  ① SHINKANG_SCORE 매핑 조정 (중화 50 → 35)');
  console.log('  ② 정규화 ÷6 → ÷5 또는 ÷7');
  console.log('  ③ GRADE 본기 1.0 → 0.8');
  console.log('  ④ 본기 매핑 재검토 (Phase 0-B 봉인 풀기)');
}
console.log('═'.repeat(75));
