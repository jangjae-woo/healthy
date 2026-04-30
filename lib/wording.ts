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

/** 한글 받침에 따른 목적격 조사(을/를) */
function withObjectParticle(s: string): string {
  if (!s) return s;
  const last = s.charCodeAt(s.length - 1);
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const hasJongseong = (last - 0xAC00) % 28 !== 0;
    return hasJongseong ? `${s}을` : `${s}를`;
  }
  return `${s}을`;
}

/** 한글 받침에 따른 도구격 조사(으로/로) — ㄹ 받침은 '로' */
function withInstrumentalParticle(s: string): string {
  if (!s) return s;
  const last = s.charCodeAt(s.length - 1);
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const jong = (last - 0xAC00) % 28;
    if (jong === 0 || jong === 8) return `${s}로`; // 받침 없음 or ㄹ
    return `${s}으로`;
  }
  return `${s}으로`;
}

/**
 * 부모-아이 한 줄 궁합 카피 (직관적 매트릭스)
 * 패턴: "[아이의 결]에 [부모의 결]을 [동사] 사이"
 * - 1순위: 일간 관계로 큰 구도 결정 (비화 / 상생 / 상극)
 * - 2순위: 부모가 채워주는 오행(aHelpsB)으로 부모의 결 확정
 * - 부모 역할별 동사·결 어휘 차별화 → 같은 관계·같은 오행이어도 카피 분리
 */
export function parentChildOneLiner(
  compat: { ilganRelation: string; elementBalance: { aHelpsB: string[] } },
  role: "mom" | "dad" = "mom",
  childElement?: string,
  parentElement?: string,
  seedString?: string,
): string {
  const ilgan = compat.ilganRelation || "";
  const helps = compat.elementBalance?.aHelpsB ?? [];
  const isMom = role === "mom";
  const parentLabel = isMom ? "엄마" : "아빠";

  // 사주 해시 → 변형 인덱스 (0~2)
  const variantIdx = (() => {
    if (!seedString) return 0;
    let h = 0;
    for (let i = 0; i < seedString.length; i++) h = (h * 31 + seedString.charCodeAt(i)) | 0;
    return Math.abs(h) % 3;
  })();

  // 아이의 결 (강한 면 — 일간 오행 기반)
  const CHILD_TRAIT: Record<string, string> = {
    목: "뻗어가는 마음",
    화: "뜨거운 마음",
    토: "묵직한 의지",
    금: "날카로운 결단",
    수: "깊이 잠긴 마음",
  };
  // 부모 일간 오행 → 자연 비유 (5종)
  const PARENT_IMAGERY: Record<string, string> = {
    목: "봄풀 같은 부드러운",
    화: "햇살 같은 환한",
    토: "들판 같은 너른",
    금: "보석 같은 맑은",
    수: "강물 같은 깊은",
  };

  // ── 주 매트릭스 (helps 있음) — 5 × 5 × 3 변형 ─────────────────
  // 엄마: "[parent_imagery] 결로, [gift]으로 [trait]을 [verb_variant] 사이"
  const MOM_BY_HELPS_V: Record<string, { gift: string; verbs: [string, string, string] }> = {
    목: { gift: "유연함", verbs: ["부드럽게 풀어주는", "살며시 어루만지는", "가만히 펼쳐주는"] },
    화: { gift: "따스한 온기", verbs: ["살며시 데워주는", "환하게 비춰주는", "부드럽게 감싸주는"] },
    토: { gift: "포근한 품", verbs: ["가만히 감싸안는", "묵묵히 받쳐주는", "따뜻이 다독이는"] },
    금: { gift: "단단한 손길", verbs: ["조용히 다독이는", "차분히 잡아주는", "흔들림 없이 지켜주는"] },
    수: { gift: "잔잔한 결", verbs: ["살며시 가라앉혀주는", "부드럽게 다스려주는", "깊이 받아주는"] },
  };
  const DAD_BY_HELPS_V: Record<string, { gift: string; verbs: [string, string, string] }> = {
    목: { gift: "새로운 길", verbs: ["활짝 열어주는", "넓게 펼쳐주는", "또렷이 보여주는"] },
    화: { gift: "환한 등불", verbs: ["앞에서 비춰주는", "환하게 밝혀주는", "또렷이 비춰주는"] },
    토: { gift: "든든한 기둥", verbs: ["단단히 세워주는", "묵직하게 받쳐주는", "흔들림 없이 받쳐주는"] },
    금: { gift: "곧은 방향", verbs: ["흔들림 없이 잡아주는", "곧고 단단히 잡아주는", "또렷이 가르쳐주는"] },
    수: { gift: "고요한 분별", verbs: ["차분히 일러주는", "조용히 가르쳐주는", "깊이 일깨워주는"] },
  };

  if (helps.length > 0) {
    const trait = (childElement && CHILD_TRAIT[childElement]) || "흩어지는 마음";
    const parentImg = (parentElement && PARENT_IMAGERY[parentElement]) || "";
    const map = isMom ? MOM_BY_HELPS_V : DAD_BY_HELPS_V;
    const cell = map[helps[0]];
    if (cell) {
      const verb = cell.verbs[variantIdx];
      const prefix = parentImg ? `${parentLabel}의 ${parentImg} 결로, ` : "";
      if (isMom) {
        return `${prefix}${withInstrumentalParticle(cell.gift)} ${withObjectParticle(trait)} ${verb} 사이`;
      }
      return `${prefix}${trait}에 ${withObjectParticle(cell.gift)} ${verb} 사이`;
    }
  }

  // ── 폴백 (helps 없음) — 부모오행 × 일간관계 × 아이 trait × 3 변형 ─────────
  // 형식: "[parent_label]의 [parent_imagery] 결이 아이의 [trait]을 [fallback_verb] 사이"
  const trait = (childElement && CHILD_TRAIT[childElement]) || "흩어지는 마음";
  const parentImg = (parentElement && PARENT_IMAGERY[parentElement]) || "타고난";

  // 일간 관계별 fallback verb 변형 (역할별 3변형)
  const FALLBACK_VERBS: Record<string, { mom: [string, string, string]; dad: [string, string, string] }> = {
    "비화": {
      mom: ["닮은 결로 마음을 나누는", "같은 결로 함께 흐르는", "닮은 결로 가만히 통하는"],
      dad: ["닮은 결로 어깨 나란히 가는", "같은 결로 함께 걷는", "닮은 결로 든든히 함께하는"],
    },
    "상극_부모→아이": {
      mom: ["곧게 빚어주는", "단단히 다듬어주는", "정성껏 어루만지는"],
      dad: ["단단히 단련시켜 주는", "굳건히 잡아주는", "곧고 단단히 가르쳐주는"],
    },
    "상극_아이→부모": {
      mom: ["묵묵히 받쳐주는", "가만히 감싸안는", "조용히 받아주는"],
      dad: ["곧게 받아주는", "흔들림 없이 받쳐주는", "단단히 품어주는"],
    },
    "상생_부모→아이": {
      mom: ["포근히 감싸 키워주는", "따뜻이 길러주는", "부드럽게 키워내는"],
      dad: ["든든히 밀어주며 키워주는", "굳건히 받쳐 키워주는", "묵직하게 길러주는"],
    },
    "상생_아이→부모": {
      mom: ["따뜻하게 받아주는", "환하게 받아주는", "포근히 받아주는"],
      dad: ["든든하게 받아주는", "넉넉히 받아주는", "묵직하게 받아주는"],
    },
  };
  let key = "비화";
  if (ilgan.includes("비화")) key = "비화";
  else if (ilgan.includes("상극") && ilgan.includes("당신이 상대를 제어")) key = "상극_부모→아이";
  else if (ilgan.includes("상극") && ilgan.includes("상대가 당신을 제어")) key = "상극_아이→부모";
  else if (ilgan.includes("상생") && ilgan.includes("당신이 상대를 살림")) key = "상생_부모→아이";
  else if (ilgan.includes("상생") && ilgan.includes("상대가 당신을 살림")) key = "상생_아이→부모";

  const verbSet = FALLBACK_VERBS[key];
  const verb = (isMom ? verbSet.mom : verbSet.dad)[variantIdx];
  return `${parentLabel}의 ${parentImg} 결이 아이의 ${withObjectParticle(trait)} ${verb} 사이`;
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
