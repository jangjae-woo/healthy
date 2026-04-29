// 사주명리원 톤 — 부정적 표현 부드럽게 변환
// calcCompatibility 결과의 거친 명리 용어("상극", "충")를 부드러운 표현으로.
// calcCompatibility 자체는 무수정 (평생사주에 영향 X).

/**
 * 일간 관계 부드러운 표현
 * - "상극 (당신이 상대를 제어)" → "다듬어 주는 결 (당신 → 상대)"
 * - "비화" → "닮은 결 (比和)"
 */
export function softenIlganRelation(raw: string, aLabel = "당신", bLabel = "상대"): string {
  if (raw.includes("상극") && raw.includes("당신이 상대를 제어")) {
    return `${aLabel}이 ${bLabel}을 단단하게 다듬어 주는 사이`;
  }
  if (raw.includes("상극") && raw.includes("상대가 당신을 제어")) {
    return `${bLabel}이 ${aLabel}을 곧게 단련시켜 주는 사이`;
  }
  if (raw.includes("상생") && raw.includes("당신이 상대를 살림")) {
    return `${aLabel}이 ${bLabel}을 따뜻하게 키워 주는 사이`;
  }
  if (raw.includes("상생") && raw.includes("상대가 당신을 살림")) {
    return `${bLabel}이 ${aLabel}을 든든하게 받쳐 주는 사이`;
  }
  if (raw.includes("비화")) {
    return "서로 같은 본질로 거울처럼 비추는 사이";
  }
  return raw;
}

/**
 * 일지 관계 부드러운 표현
 * - 충(沖) 단어를 "자극의 결"로
 * - 형(刑)도 "단련의 결"로
 */
export function softenIljiRelation(raw: string): string {
  if (!raw || raw === "특별한 관계 없음") return raw;
  let s = raw;
  // 어머니 친화 톤 — 한자 명리 용어 빼고 결의 의미만
  s = s.replace(/육충/g, "결이 다른 만남");
  s = s.replace(/육합/g, "잘 어울리는 만남");
  s = s.replace(/삼합/g, "깊이 통하는 만남");
  s = s.replace(/일지\s*충/g, "결이 다른 만남");
  s = s.replace(/형(?!성|식|태|상)/g, "단련시키는 결");
  s = s.replace(/파/g, "흩어지는 결");
  s = s.replace(/해(?!당|결|석|소)/g, "엇갈리는 결");
  return s;
}

/**
 * 충(沖) 배열 부드러운 표현
 * - ["인신충", "묘유충"] → "인신·묘유 (자극의 결)"
 */
export function softenChungList(chungs: string[]): string {
  if (!chungs.length) return "없음";
  // 6충(六沖) — 결의 성격으로 직관 풀이 (12지 동물·한자 모두 제거)
  const CHUNG_FRIENDLY: Record<string, string> = {
    "자오충": "차분한 결과 활달한 결의 만남",
    "오자충": "차분한 결과 활달한 결의 만남",
    "축미충": "묵직한 결과 부드러운 결의 만남",
    "미축충": "묵직한 결과 부드러운 결의 만남",
    "인신충": "용기 있는 결과 영리한 결의 만남",
    "신인충": "용기 있는 결과 영리한 결의 만남",
    "묘유충": "부드러운 결과 단단한 결의 만남",
    "유묘충": "부드러운 결과 단단한 결의 만남",
    "진술충": "신비한 결과 충직한 결의 만남",
    "술진충": "신비한 결과 충직한 결의 만남",
    "사해충": "예리한 결과 푸근한 결의 만남",
    "해사충": "예리한 결과 푸근한 결의 만남",
  };
  const softened = chungs.map((c) => CHUNG_FRIENDLY[c] ?? "서로 다른 결의 만남");
  return softened.join(", ");
}

/**
 * 한자 + 한글 음 표기
 * - "用神" → "用神(용신)"
 */
export const HANJA_READING: Record<string, string> = {
  用神: "용신",
  本氣: "본기",
  神煞: "신살",
  日柱: "일주",
  日干: "일간",
  日支: "일지",
  比和: "비화",
};
