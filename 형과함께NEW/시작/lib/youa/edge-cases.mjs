// 7가지 edge case fixture (Phase 8)
//
// 각 케이스: 사주 8자 + 검증 룰
// buildChildFixture로 자동 fixture 생성 → buildFacts → 통과 여부 평가
//
// 작성: 2026-05-17

import { buildChildFixture } from './auto-fixture-builder.mjs';
import { buildFacts } from './facts-builder.mjs';
import { matchAnimal } from './animal.mjs';
import { KIMSUMIN_SAJU } from '../../fixtures/child-kimsumin.mjs';
import { PARK_JIYOUNG_SAJU } from '../../fixtures/mother-park.mjs';
import { KIM_JAEHUN_SAJU } from '../../fixtures/father-kim.mjs';

// 부모 사주를 자동 생성 (부모용 fixture 빌더로)
function makeParent(pillars, name, role) {
  const base = buildChildFixture(pillars, { name });
  return {
    parent: { name, role },
    pillars: base.pillars,
    ilgan: base.ilgan,
    ilju: base.ilju,
    yinyang: base.yinyang,
    ilganElement: base.ilganElement,
    monthBranch: base.monthBranch,
    monthBranchElement: base.monthBranchElement,
    sipseong: base.sipseong,
    jijangan: base.jijangan,
    factorStrength: base.factorStrength,
    sinsal: base.sinsal,
    unseong: base.unseong,
    has12UnseongStrong: base.has12UnseongStrong,
    has12UnseongWeak: base.has12UnseongWeak,
    shinkang: base.shinkang,
    branchInteractions: base.branchInteractions,
    elements: base.elements,
  };
}

// ─── Edge Case 1: 부모 1명만 (어머님) ───
export const CASE1_MOTHER_ONLY = {
  name: '부모 1명만 — 어머님',
  description: '아버님 미입력. 14p 보고서로 자동 단축.',
  childSaju: KIMSUMIN_SAJU,
  motherSaju: PARK_JIYOUNG_SAJU,
  fatherSaju: null,
  expectations: {
    reportPageCount: 14,
    hasFatherCards: false,
    fatherIlganRelation: null,
  },
};

// ─── Edge Case 2: 균형형 규칙 (모든 요인 mid → 용) ───
// percentile 보정 이후 "겉보기 오행 균형 fixture"가 곧 all-mid를 보장하지 않는다.
// 그래서 동물 분기 자체는 합성 factorScores로 직접 검증한다.
export const CASE2_BALANCED = {
  name: '균형형 자녀 — 용',
  description: '6요인 모두 mid → 동물 = 용',
  childSaju: buildChildFixture({
    year:  { stem: '갑', branch: '인' },
    month: { stem: '정', branch: '묘' },
    day:   { stem: '무', branch: '진' },
    hour:  { stem: '신', branch: '유' },
  }, { name: '균형 양', gender: 'female', birthDate: '2022-04-10', age: '만 4세' }),
  motherSaju: PARK_JIYOUNG_SAJU,
  fatherSaju: KIM_JAEHUN_SAJU,
  expectations: {
    syntheticAnimal: {
      factors: {
        hwalgi: { score: 52, level: 'mid' },
        josim: { score: 50, level: 'mid' },
        manjok: { score: 48, level: 'mid' },
        heundeullim: { score: 54, level: 'mid' },
        eoullim: { score: 49, level: 'mid' },
        kkeungi: { score: 51, level: 'mid' },
      },
      type: '용',
      case: 'C',
    },
  },
};

// ─── Edge Case 3: 상위 비등 규칙 (top1-top3 ≤ 6 → 케이스 B) ───
export const CASE3_TOP_TIE = {
  name: '상위 비등 자녀',
  description: 'top1-top3 차이 ≤6 → 케이스 B',
  childSaju: buildChildFixture({
    year:  { stem: '경', branch: '신' },
    month: { stem: '경', branch: '신' },
    day:   { stem: '을', branch: '미' },
    hour:  { stem: '갑', branch: '신' },
  }, { name: '비등 양', gender: 'female', birthDate: '2020-08-15', age: '만 5세' }),
  motherSaju: PARK_JIYOUNG_SAJU,
  fatherSaju: KIM_JAEHUN_SAJU,
  expectations: {
    syntheticAnimal: {
      factors: {
        hwalgi: { score: 82, level: 'high' },
        josim: { score: 80, level: 'high' },
        manjok: { score: 77, level: 'high' },
        heundeullim: { score: 41, level: 'mid' },
        eoullim: { score: 36, level: 'mid' },
        kkeungi: { score: 22, level: 'low' },
      },
      type: '호랑이',
      case: 'B',
    },
  },
};

// ─── Edge Case 4: 한쪽 오행 집중 자녀 (낮은 요인 다수) ───
// percentile 보정 이후 식상 원점수만으로 "약"을 단정하지 않고, 고객용 6요인 low 다수를 검증한다.
export const CASE4_NO_BONGI = {
  name: '한쪽 오행 집중 자녀',
  description: '비겁만 강한 fixture에서 고객용 6요인 low가 다수 나오는지 확인',
  childSaju: buildChildFixture({
    year:  { stem: '갑', branch: '인' },
    month: { stem: '갑', branch: '인' },
    day:   { stem: '갑', branch: '인' },
    hour:  { stem: '갑', branch: '인' },
  }, { name: '비겁 군', gender: 'male', birthDate: '2022-02-15', age: '만 4세' }),
  motherSaju: PARK_JIYOUNG_SAJU,
  fatherSaju: KIM_JAEHUN_SAJU,
  expectations: {
    childLowFactorMinimum: 4,
  },
};

// ─── Edge Case 5: 모두 충돌 (시너지 1장 강제 추가 — 룰 24) ───
// 부모가 바람(편재+정재+칠살) 본기 강 + 자녀가 신중·공감·정서 본기 강
export const CASE5_ALL_CONFLICT = {
  name: '모두 충돌 → 시너지 강제 추가',
  description: '부모 바람 강 + 자녀 신중·공감·정서 강 → 충돌만 가능. 룰 24 시너지 강제 추가',
  childSaju: KIMSUMIN_SAJU,  // 자녀 = 조심·어울림·끈기 강
  // 가상 아버님: 재성·관성 강 (바람 본기)
  motherSaju: null,
  fatherSaju: makeParent({
    year:  { stem: '경', branch: '신' },
    month: { stem: '갑', branch: '인' },
    day:   { stem: '경', branch: '오' },
    hour:  { stem: '갑', branch: '오' },
  }, '바람 강', 'father'),
  expectations: {
    fatherCardsMinimum: 2,
  },
};

// ─── Edge Case 6: 천간합 + 충 동시 (천간합 우선) ───
// 자녀 을 + 어머님 경 (을경합) + 어머님 일지에 자녀 일지와 충
export const CASE6_HAP_AND_CHUNG = {
  name: '천간합 + 충 동시 (천간합 우선)',
  description: '자녀 을 + 부모 경 = 을경합 + 일지 충 동시 발생. 룰 22 천간합 우선',
  childSaju: KIMSUMIN_SAJU,  // 일간 을, 일지 해
  motherSaju: makeParent({
    year:  { stem: '경', branch: '신' },
    month: { stem: '갑', branch: '인' },
    day:   { stem: '경', branch: '사' },  // 일지 사 → 자녀 일지 해와 충 (사해 충)
    hour:  { stem: '갑', branch: '오' },
  }, '합충 어머님', 'mother'),
  fatherSaju: null,
  expectations: {
    motherRelationType: 'hap',
  },
};

// ─── Edge Case 7: 부모 상위축 픽 ───
// percentile 보정 이후 이 fixture는 high 축이 생긴다. 핵심은 카드 선택용 상위축이 비지 않는지다.
export const CASE7_PARENT_ALL_WEAK = {
  name: '부모 상위축 픽',
  description: '부모 6축 보정 후에도 카드 선택용 상위축이 비지 않는지 확인',
  childSaju: KIMSUMIN_SAJU,
  motherSaju: makeParent({
    year:  { stem: '갑', branch: '인' },
    month: { stem: '정', branch: '묘' },
    day:   { stem: '무', branch: '진' },
    hour:  { stem: '신', branch: '유' },
  }, '균형 어머님', 'mother'),
  fatherSaju: null,
  expectations: {
    motherStrongAxesMinimum: 2,
  },
};

export const ALL_CASES = [
  CASE1_MOTHER_ONLY,
  CASE2_BALANCED,
  CASE3_TOP_TIE,
  CASE4_NO_BONGI,
  CASE5_ALL_CONFLICT,
  CASE6_HAP_AND_CHUNG,
  CASE7_PARENT_ALL_WEAK,
];

// ─── 케이스 자동 평가 ───
export function evaluateCase(testCase) {
  const facts = buildFacts({
    childSaju: testCase.childSaju,
    motherSaju: testCase.motherSaju,
    fatherSaju: testCase.fatherSaju,
    testDate: '2026-05-17',
  });

  const checks = [];
  const exp = testCase.expectations;

  // 페이지 수
  if (exp.reportPageCount !== undefined) {
    checks.push({
      name: '페이지 수',
      expected: exp.reportPageCount,
      actual: facts.meta.reportPageCount,
      pass: facts.meta.reportPageCount === exp.reportPageCount,
    });
  }

  // 아버님 카드 없음
  if (exp.hasFatherCards === false) {
    checks.push({
      name: '아버님 카드 없음',
      expected: '0장',
      actual: facts.matrixCards.fatherCards.length + '장',
      pass: facts.matrixCards.fatherCards.length === 0,
    });
  }

  // 동물 타입
  if (exp.animalType) {
    checks.push({
      name: '동물 타입',
      expected: exp.animalType,
      actual: facts.animal.type,
      pass: facts.animal.type === exp.animalType,
    });
  }

  // 동물 케이스
  if (exp.animalCase) {
    checks.push({
      name: '동물 케이스',
      expected: exp.animalCase,
      actual: facts.animal.case,
      pass: facts.animal.case === exp.animalCase || facts.animal.case === exp.animalCase + '-border',
    });
  }

  // 합성 동물 분기 검증
  if (exp.syntheticAnimal) {
    const animal = matchAnimal(exp.syntheticAnimal.factors);
    checks.push({
      name: '합성 동물 타입',
      expected: exp.syntheticAnimal.type,
      actual: animal.animal.name,
      pass: animal.animal.name === exp.syntheticAnimal.type,
    });
    checks.push({
      name: '합성 동물 케이스',
      expected: exp.syntheticAnimal.case,
      actual: animal.case,
      pass: animal.case === exp.syntheticAnimal.case,
    });
  }

  // 인성 약
  if (exp.inseongStrengthLow) {
    const v = facts.parentFactorCards.mother?.find(c => c.label === '인성')?.strength;
    checks.push({
      name: '자녀 인성 강도 약',
      expected: '< 30',
      actual: testCase.childSaju.factorStrength.인성.weightedStrength,
      pass: testCase.childSaju.factorStrength.인성.weightedStrength < 30,
    });
  }

  // 식상 약
  if (exp.siksangStrengthLow) {
    checks.push({
      name: '자녀 식상 강도 약',
      expected: '< 30',
      actual: testCase.childSaju.factorStrength.식상.weightedStrength,
      pass: testCase.childSaju.factorStrength.식상.weightedStrength < 30,
    });
  }

  // 고객용 자녀 6요인 low 개수
  if (exp.childLowFactorMinimum !== undefined) {
    const lowCount = Object.values(facts.childFactors).filter(v => v.level === 'low').length;
    checks.push({
      name: `자녀 low 요인 ≥ ${exp.childLowFactorMinimum}개`,
      expected: `≥ ${exp.childLowFactorMinimum}`,
      actual: lowCount,
      pass: lowCount >= exp.childLowFactorMinimum,
    });
  }

  // 아버님 카드 최소 N장
  if (exp.fatherCardsMinimum) {
    checks.push({
      name: `아버님 카드 ≥ ${exp.fatherCardsMinimum}장`,
      expected: `≥ ${exp.fatherCardsMinimum}`,
      actual: facts.matrixCards.fatherCards.length,
      pass: facts.matrixCards.fatherCards.length >= exp.fatherCardsMinimum,
    });
  }

  // 어머님 일간 관계 천간합
  if (exp.motherRelationType) {
    checks.push({
      name: '어머님 일간 관계 = 천간합',
      expected: exp.motherRelationType,
      actual: facts.ilganRelations.mother?.type,
      pass: facts.ilganRelations.mother?.type === exp.motherRelationType,
    });
  }

  // 어머님 fallback 픽
  if (exp.motherStrongAxesFallback) {
    const motherAxes = facts.motherAxes;
    const allBelow66 = motherAxes && Object.values(motherAxes).every(a => a.score < 66);
    const pickedCount = facts.matrixCards.motherStrongAxes.length;
    checks.push({
      name: '부모 6축 모두 <66 + fallback 픽',
      expected: 'fallback 작동',
      actual: `모두<66=${allBelow66}, 픽 ${pickedCount}장`,
      pass: allBelow66 && pickedCount > 0,
    });
  }

  // 어머님 상위축 최소 개수
  if (exp.motherStrongAxesMinimum !== undefined) {
    const pickedCount = facts.matrixCards.motherStrongAxes.length;
    checks.push({
      name: `어머님 상위축 ≥ ${exp.motherStrongAxesMinimum}개`,
      expected: `≥ ${exp.motherStrongAxesMinimum}`,
      actual: pickedCount,
      pass: pickedCount >= exp.motherStrongAxesMinimum,
    });
  }

  // 공통 검증: 폼 깨짐 없음
  // - 매트릭스 카드가 부모 별로 픽됨 (입력된 부모만)
  if (testCase.motherSaju && facts.matrixCards.motherCards.length === 0) {
    checks.push({
      name: '어머님 카드 0장 (폼 깨짐 위험)',
      expected: '> 0',
      actual: 0,
      pass: false,
    });
  }
  if (testCase.fatherSaju && facts.matrixCards.fatherCards.length === 0) {
    checks.push({
      name: '아버님 카드 0장 (폼 깨짐 위험)',
      expected: '> 0',
      actual: 0,
      pass: false,
    });
  }

  // 일간 비유 빈 값 검증
  if (facts.child.ilganBiyu === '' || facts.child.ilganBiyu === undefined) {
    checks.push({
      name: '자녀 일간 비유 누락',
      expected: '값 있음',
      actual: '빈 값',
      pass: false,
    });
  }

  const passCount = checks.filter(c => c.pass).length;
  return {
    case: testCase,
    facts,
    checks,
    passCount,
    totalCount: checks.length,
    overallPass: checks.every(c => c.pass),
  };
}

// 전체 케이스 실행
export function runAllCases() {
  return ALL_CASES.map(evaluateCase);
}
