// 자도인(慈道人) 엄마-아이 궁합 — 점수 후처리
// calcCompatibility는 연인용으로 설계됐기에, 부모-자식 관계의 본질에 맞게 점수를 재산정.
// 평생사주·남녀궁합 코드는 0줄 건드리지 않음.

import type { CompatibilityResult } from "./saju-calculator";

/**
 * 부모-자식 관계 본질을 반영한 점수 조정.
 *
 * 명리학적 근거:
 * - 천륜(天倫): 부모-자식은 끊을 수 없는 인연 → 베이스 가산
 * - 일간 상극: 연인은 억누름이지만, 부모-자식은 가르침·다듬음 → 페널티 완화
 * - 일지 충: 부부는 침실 갈등이지만, 부모-자식은 사춘기 자아 형성 → 페널티 완화
 * - 오행 보충 (엄마→아이): 양육의 본질 자체 → 추가 가산
 */
export function adjustForParentChild(compat: CompatibilityResult): CompatibilityResult {
  let score = compat.score;

  // 1) 천륜 베이스 가산
  score += 12;

  // 2) 일간 상극이면 회복 (가르침의 의미)
  if (compat.ilganRelation.includes("상극")) {
    score += 6;
  }

  // 3) 일지 충 완화 (사춘기는 자연스러운 과정)
  const chungs = compat.branchRelations.chung.length;
  score += chungs * 3;

  // 4) 엄마가 아이에게 보충해주는 오행이 있으면 가산 (양육 본질)
  score += compat.elementBalance.aHelpsB.length * 2;

  // 5) 아이가 엄마에게 가져다주는 기운도 약간 가산
  score += compat.elementBalance.bHelpsA.length * 1;

  // 6) 둘 다 부족한 오행이 있으면 약간 차감 (서로 채워주지 못하는 부분)
  score -= compat.elementBalance.sharedWeak.length * 1;

  // 7) 삼합·육합은 그대로 가산 효과 유지 (이미 calcCompatibility에 반영됨)
  // 부모-자식에서도 합은 통하기 좋음

  // 클램프
  score = Math.max(45, Math.min(98, Math.round(score)));

  // 라벨 재산정 (가족 관계 톤)
  const scoreLabel = labelForParentChild(score);

  return { ...compat, score, scoreLabel };
}

function labelForParentChild(score: number): string {
  if (score >= 90) return "천륜의 깊은 인연";
  if (score >= 85) return "타고난 자모지정";
  if (score >= 80) return "서로를 빛나게 하는 사이";
  if (score >= 75) return "함께 자라는 인연";
  if (score >= 70) return "서로의 결을 맞춰가는 인연";
  if (score >= 65) return "서로를 채워주는 사이";
  if (score >= 60) return "이해로 다져가는 인연";
  if (score >= 55) return "서로 배워가는 인연";
  return "노력으로 단단해지는 인연";
}
