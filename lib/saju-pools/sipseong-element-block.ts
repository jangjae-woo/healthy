// ⭐ V2.1.5 (2026-05-15) — 십성-오행 매핑 표 (평생사주용)
//
// 자도인 V2.1.3에서 만든 매핑 표를 평생사주에도 적용.
// 자도인은 app/api/generate/route.ts에 직접 박혀 있어서, 평생사주는 별도 lib로 이식.
// 미래 V2.2에서 통합 리팩터 예정.

// 일간 한글 → 오행 매핑
export const STEM_TO_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

// 오행 어휘 풀 (풀 대명사 폐기 → 오행 어휘 치환용)
export const ELEMENT_VOCAB: Record<string, string[]> = {
  목: ["나무의 기운", "성장하는 결", "올라가는 결", "곧게 뻗는 결"],
  화: ["불의 기운", "환한 결", "발산하는 결", "따뜻한 결"],
  토: ["흙의 기운", "받쳐주는 결", "안정하는 결", "두텁게 쌓는 결"],
  금: ["금속의 기운", "단단한 결", "정돈하는 결", "결단의 결"],
  수: ["물의 기운", "흐르는 결", "고요한 결", "스며드는 결"],
};

// 일간 기준 십성-오행 매핑
export function getSipseongElementMap(ilgan: string): Record<string, string> {
  const ilganElem = STEM_TO_ELEMENT[ilgan] ?? "목";
  const cycle = ["목", "화", "토", "금", "수"];
  const idx = cycle.indexOf(ilganElem);
  return {
    비겁: cycle[idx],
    식상: cycle[(idx + 1) % 5],
    재성: cycle[(idx + 2) % 5],
    관성: cycle[(idx + 4) % 5],
    인성: cycle[(idx + 3) % 5],
  };
}

// 본인 십성-오행 매핑 블록 (buildHeader에 박힘)
export function buildSipseongElementBlock(ilgan: string): string {
  const map = getSipseongElementMap(ilgan);
  const ilganElem = STEM_TO_ELEMENT[ilgan] ?? "목";
  const vocab = (el: string) => ELEMENT_VOCAB[el]?.[0] ?? `${el}의 기운`;
  return `[★ 십성-오행 자동 매핑 — 본인 일간 ${ilgan}(${ilganElem}) 기준. 풀 대명사 치환 시 반드시 이 매핑 사용]
- 비겁(比劫) = ${map.비겁}의 기운 (예: "${vocab(map.비겁)}")
- 식상(食傷) = ${map.식상}의 기운 (예: "${vocab(map.식상)}")
- 재성(財星) = ${map.재성}의 기운 (예: "${vocab(map.재성)}")
- 관성(官星) = ${map.관성}의 기운 (예: "${vocab(map.관성)}")
- 인성(印星) = ${map.인성}의 기운 (예: "${vocab(map.인성)}")
⚠️ ⭐ V2.2.6 강화 — 인자를 가리킬 때는 항상 인자명(일간·관성·재성·식상·인성·비겁·용신·격국) 또는 구체 오행(${map.비겁}·${map.인성}·${map.식상}·${map.재성}·${map.관성}) 명사로 직접 표기. 다음 추상 풀 대명사들은 무엇을 가리키는지 모호해서 본문 가치 0이므로 사용 금지: "본인 결" / "타고난 결" / "중심 기운" / "그 흐름" / "그 흐름의 기운" / "그 결의 흐름" / "그 기운의 결" / "그 기운의 기운" / "앞서 본 결" / "앞서 본 흐름" / "그 신살의 결" / "내면의 자리" / "사주의 결".
⚠️ "인성 오행"·"비겁 오행" 같은 십성+오행 합성 비문 절대 X. "인성(印星)" + "${map.인성} 오행" 분리 표현.`;
}
