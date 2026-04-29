// 사주명리원 톤 — 부정적 표현 부드럽게 변환
// calcCompatibility 결과의 거친 명리 용어("상극", "충")를 부드러운 표현으로.
// calcCompatibility 자체는 무수정 (평생사주에 영향 X).

/**
 * 아이 이름 + 성별별 호칭
 * - "여" → "전아인양"
 * - "남" → "전아인군"
 * - 그 외(빈값/모름) → 그대로
 */
export function withChildHonorific(name: string, gender?: string): string {
  if (!name) return name;
  if (gender === "여") return `${name}양`;
  if (gender === "남") return `${name}군`;
  return name;
}

/**
 * 한글 이름 + 받침에 따른 주격 조사(이/가)
 * - "김수지" → "김수지가"
 * - "전아인" → "전아인이"
 */
export function withSubjectParticle(name: string): string {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  // 한글 음절 범위 가-힣 (0xAC00 ~ 0xD7A3)
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const hasJongseong = (last - 0xAC00) % 28 !== 0;
    return hasJongseong ? `${name}이` : `${name}가`;
  }
  return `${name}이`;
}

/**
 * 부모-아이 한 줄 궁합 카피
 * - 부모가 아이에게 보충해주는 오행(aHelpsB)을 동사구로 변환
 * - 일간 관계가 비화면 "닮은 결로 함께 가는"
 * - 일간 관계가 상극(부모→아이)이면 "곧은 방향을 단련시켜 주는"
 * - 그 외 채울 게 없으면 "닮은 결을 나누는"
 * 결과: "[동사구] 사이"
 */
export function parentChildOneLiner(compat: {
  ilganRelation: string;
  elementBalance: { aHelpsB: string[] };
}): string {
  const ilgan = compat.ilganRelation || "";
  const helps = compat.elementBalance?.aHelpsB ?? [];

  const ELEM_VERB: Record<string, string> = {
    토: "안정의 결을 채워주는",
    금: "단단한 방향을 잡아주는",
    수: "차분한 지혜를 더해주는",
    목: "성장의 결을 키워주는",
    화: "따뜻한 활기를 더해주는",
  };

  if (helps.length > 0) {
    const first = helps[0];
    const verb = ELEM_VERB[first];
    if (verb) return `${verb} 사이`;
  }
  if (ilgan.includes("비화")) return "닮은 결로 함께 가는 사이";
  if (ilgan.includes("상극") && ilgan.includes("당신이 상대를 제어")) {
    return "곧은 방향을 단련시켜 주는 사이";
  }
  return "닮은 결을 나누는 사이";
}

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
