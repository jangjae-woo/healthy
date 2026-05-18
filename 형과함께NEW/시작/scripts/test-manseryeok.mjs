// manseryeok + saju-core 연동 테스트
// 김수민 양 2022-02-15 인시 (양력) → 사주 8자 변환 확인

import { computeFullSajuCore } from '../lib/saju-core/saju-core.ts';

const result = computeFullSajuCore({
  year: 2022,
  month: 2,
  day: 15,
  hour: '인시 (03:30~05:29)',
  calendar: '양력',
  gender: '여',
});

if (!result) {
  console.error('❌ 변환 실패');
  process.exit(1);
}

console.log('✅ 만세력 변환 성공');
console.log('=====================================');
console.log(`사주 8자: ${result.pillars.year.stem}${result.pillars.year.branch} ${result.pillars.month.stem}${result.pillars.month.branch} ${result.pillars.day.stem}${result.pillars.day.branch} ${result.pillars.hour?.stem}${result.pillars.hour?.branch}`);
console.log(`일간: ${result.ilgan}`);
console.log(`신강: ${result.shinkang}`);
console.log(`용신: ${result.yongsin}`);
console.log(`신살: ${result.sinsal.join(', ')}`);
console.log(`오행:`, result.elements);
console.log(`십성:`, result.sipseong);
console.log('=====================================');
console.log('시작 폴더의 수동 fixture (KIMSUMIN_SAJU):');
console.log('  사주: 壬子 庚申 乙亥 戊寅');
console.log('  일간: 을');
console.log('');
console.log('manseryeok 변환 결과와 비교 → 일치 여부 확인');
