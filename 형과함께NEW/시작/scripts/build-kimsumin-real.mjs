// 진짜 만세력 기반 김수민 양 fixture 생성 + 점수 산출
//
// 2022-02-15 인시 양력 → manseryeok → fixture → 6요인 점수
//
// 시작 폴더 수동 fixture (KIMSUMIN_SAJU)와 비교
// 작성: 2026-05-17

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';
import { sajuCoreToFixture } from '../lib/youa/core-to-fixture.mjs';
import { calcAll6Factors } from '../lib/youa/factors.mjs';
import { KIMSUMIN_SAJU } from '../fixtures/child-kimsumin.mjs';

console.log('═══════════════════════════════════════');
console.log(' 김수민 양 진짜 만세력 vs 수동 fixture 비교');
console.log('═══════════════════════════════════════\n');

// 1. 진짜 만세력 변환
const core = computeFullSajuCore({
  year: 2022, month: 2, day: 15,
  hour: '인시 (03:30~05:29)',
  calendar: '양력',
  gender: '여',
});

if (!core) {
  console.error('❌ 만세력 변환 실패');
  process.exit(1);
}

// 2. fixture 변환
const realFixture = sajuCoreToFixture(core, {
  name: '김수민',
  gender: 'female',
  birthDate: '2022-02-15',
  role: 'child',
  testDate: '2026-05-17',
});

// 3. 점수 산출
const realFactors = calcAll6Factors(realFixture);
const manualFactors = calcAll6Factors(KIMSUMIN_SAJU);

// ─── 사주 비교 ───
console.log('📋 사주 8자 비교');
console.log('-'.repeat(60));
const fmt = (p) => `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour?.stem ?? '?'}${p.hour?.branch ?? '?'}`;
console.log(`  수동 fixture: ${fmt(KIMSUMIN_SAJU.pillars)} (일간 ${KIMSUMIN_SAJU.ilgan})`);
console.log(`  진짜 만세력: ${fmt(realFixture.pillars)} (일간 ${realFixture.ilgan})`);
console.log();

console.log('🔮 사주 메타 비교');
console.log('-'.repeat(60));
console.log(`  수동: 신강 ${KIMSUMIN_SAJU.shinkang.level} / 일간 비유 작은 나무`);
console.log(`  진짜: 신강 ${realFixture.shinkang.level} / 일간 비유 ${realFixture.ilganBiyu}`);
console.log();

// ─── 인자 강도 비교 ───
console.log('💪 6셋 통칭 인자 강도 비교');
console.log('-'.repeat(60));
console.log('              수동 → 진짜 만세력');
for (const tong of ['인성', '식상', '관성', '재성', '비겁', '조후']) {
  const m = KIMSUMIN_SAJU.factorStrength[tong]?.weightedStrength ?? '-';
  const r = realFixture.factorStrength[tong]?.weightedStrength ?? '-';
  const bongi = realFixture.factorStrength[tong]?.isBongi ? ' [본기]' : '';
  console.log(`  ${tong.padEnd(4)}     ${String(m).padStart(3)} → ${String(r).padStart(3)}${bongi}`);
}
console.log(`  특수      ${KIMSUMIN_SAJU.factorStrength.특수?.type ?? '-'} → ${realFixture.factorStrength.특수.type}`);
console.log();

// ─── 6요인 점수 비교 ───
console.log('🎯 6요인 점수 비교 (수동 fixture vs 진짜 만세력)');
console.log('-'.repeat(60));
console.log('              수동       진짜      차이');
const LEVEL_KO = { low: '낮음', mid: '중간', high: '높음' };
for (const k of ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi']) {
  const m = manualFactors[k];
  const r = realFactors[k];
  const diff = r.score - m.score;
  const sign = diff > 0 ? '+' : '';
  console.log(`  ${m.factorKorean.padEnd(4)}     ${String(m.score).padStart(3)} (${LEVEL_KO[m.level]})  ${String(r.score).padStart(3)} (${LEVEL_KO[r.level]})  ${sign}${diff}`);
}
console.log();

// ─── 동물 매칭 비교 ───
console.log('🐮 동물 매칭');
console.log('-'.repeat(60));
function pickAnimal(factors) {
  const sorted = Object.entries(factors).sort((a, b) => b[1].score - a[1].score);
  const allMid = sorted.every(([, v]) => v.score >= 41 && v.score <= 65);
  if (allMid || sorted[0][1].score <= 65) return '용';
  const animalMap = { hwalgi: '호랑이', josim: '토끼', manjok: '말', heundeullim: '돼지', eoullim: '양', kkeungi: '소' };
  return animalMap[sorted[0][0]];
}
console.log(`  수동: ${pickAnimal(manualFactors)}`);
console.log(`  진짜: ${pickAnimal(realFactors)}`);
console.log();

// ─── 결과 fixture 저장용 ───
console.log('💾 진짜 만세력 fixture (저장용)');
console.log('-'.repeat(60));
console.log(JSON.stringify({
  사주8자: fmt(realFixture.pillars),
  일간: realFixture.ilgan,
  일주: realFixture.ilju,
  일간비유: realFixture.ilganBiyu,
  신강: realFixture.shinkang.level,
  조후: realFixture.factorStrength.조후.label,
  본기인자: Object.entries(realFixture.factorStrength)
    .filter(([, v]) => v.isBongi)
    .map(([k]) => k),
  특수슬롯: realFixture.factorStrength.특수.type,
  '6요인': Object.fromEntries(
    Object.entries(realFactors).map(([k, v]) => [v.factorKorean, `${v.score} (${LEVEL_KO[v.level]})`])
  ),
}, null, 2));
