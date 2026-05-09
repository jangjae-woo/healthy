// ════════════════════════════════════════════════════════════════════
// 인연 — 6×5 = 30 짝꿍 매트릭스 (한 줄 라벨)
// 메모장 기반. 빈 cell 없음.
// 사용: getPairLabel("옥순", "영철") → { label, tone }
// ════════════════════════════════════════════════════════════════════

import type { FemaleCharacter, MaleCharacter } from "./character-match";

export interface PairLabel {
  label: string;       // 본문 결합용 한 줄 라벨
  tone: string;        // 추가 톤 키워드
}

const MATRIX: Record<FemaleCharacter, Record<MaleCharacter, PairLabel>> = {
  옥순: {
    영철: { label: "빠르게 뜨거워지는 결", tone: "직진+자신감 — 만나자마자 불꽃 일는 사이" },
    영호: { label: "직진+사교, 모임 중심", tone: "활발+인싸 — 사람들 안에서 가장 빛나는 사이" },
    광수: { label: "직진녀가 진중함을 깨우는 결", tone: "활기가 깊이를 흔드는 사이" },
    영수: { label: "활기+중후 시너지", tone: "솔직함이 든든함과 만나 안정되는 사이" },
    상철: { label: "직진녀가 끌고 편안남이 받침", tone: "한 명이 이끌고 한 명이 받쳐주는 균형" },
  },
  현숙: {
    영철: { label: "시크+자신감 도시 모던", tone: "스타일과 매력이 부딪혀 빛나는 도시적 사이" },
    영호: { label: "시크+인싸 모던 활기", tone: "차도녀가 사교 안에서 풀리는 사이" },
    광수: { label: "둘 다 진중·깊이, 도시 차분", tone: "도시적 깊이를 함께 나누는 차분한 사이" },
    영수: { label: "시크+중후 안정 도시", tone: "스타일과 든든함이 만나는 안정된 사이" },
    상철: { label: "시크의 강함을 풀어주는 편안", tone: "차가움을 부드럽게 녹여주는 사이" },
  },
  정숙: {
    영철: { label: "강단+자신감 안정+활기", tone: "성숙함과 자신감이 만나 균형 좋은 사이" },
    영호: { label: "강단+인싸 든든 사교", tone: "안정 위에 활기를 더하는 사이" },
    광수: { label: "둘 다 진중, 가장 깊이 있는 결", tone: "성숙한 깊이가 두 겹 — 30대 이상 추천" },
    영수: { label: "강단+중후 가장 안정", tone: "이 매트릭스에서 가장 안정된 결합" },
    상철: { label: "강단+편안 시너지", tone: "성숙함이 편안함을 만나 자연스러운 사이" },
  },
  순자: {
    영철: { label: "애교+자신감 활기 가득", tone: "발랄함과 자신감이 만나 즐거운 사이" },
    영호: { label: "활발+사교 가장 즐거움", tone: "이 매트릭스에서 가장 활기 넘치는 결합" },
    광수: { label: "애교녀가 진중남 풀어주는 결", tone: "활기가 깊이를 부드럽게 깨우는 사이" },
    영수: { label: "애교+중후 따스함", tone: "발랄함이 든든함을 만나 안정되는 사이" },
    상철: { label: "애교+편안 부담 없는 다정", tone: "가장 부담 없이 다정한 사이" },
  },
  영숙: {
    영철: { label: "참한+자신감 균형", tone: "다정함과 매력이 만나는 균형 좋은 사이" },
    영호: { label: "참한+인싸 부드러운 사교", tone: "다정함이 사교 안에서 빛나는 사이" },
    광수: { label: "참한+진중 깊이 안정", tone: "부드러움이 깊이를 만나는 안정된 사이" },
    영수: { label: "참한+중후 가장 평화", tone: "이 매트릭스에서 가장 평화로운 결합" },
    상철: { label: "참한+편안 따뜻한 일상", tone: "일상이 따뜻하게 흐르는 사이" },
  },
  영자: {
    영철: { label: "일상+자신감 활기 채움", tone: "평범함에 자신감이 활기를 더하는 사이" },
    영호: { label: "일상+사교 부담 없는 활기", tone: "일상이 사교로 자연스럽게 펼쳐지는 사이" },
    광수: { label: "일상+진중 차분 안정", tone: "평범함과 깊이가 만나 차분한 사이" },
    영수: { label: "일상+중후 평온", tone: "평범함과 든든함의 평온한 사이" },
    상철: { label: "둘 다 균형 가장 부담 없음", tone: "이 매트릭스에서 가장 부담 없는 결합" },
  },
};

export function getPairLabel(female: FemaleCharacter, male: MaleCharacter): PairLabel {
  return MATRIX[female]?.[male] ?? { label: "두 사람만의 결", tone: "고유한 인연" };
}

// 성별 무관하게 (a, b)에서 여자/남자 추출 후 짝꿍 라벨 반환
export function getPairLabelFor(
  aGender: "남" | "여",
  aChar: string,
  bGender: "남" | "여",
  bChar: string,
): PairLabel | null {
  if (aGender === "여" && bGender === "남") {
    return getPairLabel(aChar as FemaleCharacter, bChar as MaleCharacter);
  }
  if (aGender === "남" && bGender === "여") {
    return getPairLabel(bChar as FemaleCharacter, aChar as MaleCharacter);
  }
  // 동성 커플 — 매트릭스 미지원
  return null;
}
