// 사주 변환 stub (Phase 6)
//
// 시작 폴더 환경에서는 정확한 만세력 변환 불가 (manseryeok npm 필요).
// saju-site 이관 시 lib/saju-core.ts의 computeFullSajuCore() 사용.
//
// 본 stub:
//   - 알려진 fixture 생년월일과 매칭되면 fixture 반환
//   - 매칭 안 되면 정규화 입력만 반환 (실제 사주 8자 X)
//
// 작성: 2026-05-17

import { KIMSUMIN_SAJU } from '../../fixtures/child-kimsumin.mjs';
import { PARK_JIYOUNG_SAJU } from '../../fixtures/mother-park.mjs';
import { KIM_JAEHUN_SAJU } from '../../fixtures/father-kim.mjs';
import { calcAge } from './input-validator.mjs';

// 알려진 fixture (Phase 6 시뮬레이션용)
const KNOWN_FIXTURES = [
  { birthDate: '2022-02-15', name: '김수민', role: 'child', saju: KIMSUMIN_SAJU },
  { birthDate: '1988-04-20', name: '박지영', role: 'mother', saju: PARK_JIYOUNG_SAJU },
  { birthDate: '1985-09-15', name: '김재훈', role: 'father', saju: KIM_JAEHUN_SAJU },
];

// 폼 입력 → fixture 매핑 또는 stub
export function convertToSaju(formInput, role) {
  // fixture 매핑 시도
  const fixture = KNOWN_FIXTURES.find(f =>
    f.birthDate === formInput.birthDate && f.name === formInput.name && f.role === role
  );
  if (fixture) {
    return { source: 'fixture', saju: fixture.saju };
  }

  // 매칭 안 되면 stub (실제 saju-site 이관 시 computeFullSajuCore 사용)
  const age = role === 'child' ? calcAge(formInput.birthDate, formInput.testDate ?? new Date().toISOString().slice(0, 10)) : null;

  return {
    source: 'stub',
    warning: '실제 사주 변환은 saju-site 이관 후 manseryeok 라이브러리로 동작. 현재 fixture 미매칭으로 stub 사용.',
    saju: {
      [role]: role === 'child'
        ? { name: formInput.name, gender: formInput.gender, birthDate: formInput.birthDate, age: age?.label }
        : { name: formInput.name, role },
      pillars: null,  // 실제 변환 필요
      ilgan: null,
    },
  };
}

// 폼 전체 → 사주 3인분 변환
export function convertFormToSajuSet(formInput) {
  const childResult = convertToSaju(formInput.child, 'child');
  const motherResult = formInput.mother ? convertToSaju(formInput.mother, 'mother') : null;
  const fatherResult = formInput.father ? convertToSaju(formInput.father, 'father') : null;

  const allMatched = childResult.source === 'fixture'
                  && (!motherResult || motherResult.source === 'fixture')
                  && (!fatherResult || fatherResult.source === 'fixture');

  return {
    childSaju: childResult.saju,
    motherSaju: motherResult?.saju ?? null,
    fatherSaju: fatherResult?.saju ?? null,
    allMatched,
    warnings: [
      childResult.warning,
      motherResult?.warning,
      fatherResult?.warning,
    ].filter(Boolean),
  };
}
