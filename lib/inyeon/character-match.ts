// ════════════════════════════════════════════════════════════════════
// 인연 — "나는 솔로" 캐릭터 결정론 분류
// 사주 → 6 여캐(옥순/현숙/정숙/순자/영숙/영자) 또는 5 남캐(영철/영호/광수/영수/상철)
// 우선순위 캐스케이드 — 1순위부터 검사, 미매칭 시 fallback.
//
// 격리: 이 파일은 인연 전용. 자도인·평생사주·연애사주 영향 X.
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "../saju-calculator";

export type FemaleCharacter = "옥순" | "현숙" | "정숙" | "순자" | "영숙" | "영자";
export type MaleCharacter = "영철" | "영호" | "광수" | "영수" | "상철";
export type CharacterName = FemaleCharacter | MaleCharacter;

export interface CharacterMatch {
  name: CharacterName;
  innerImage: string;
  signal: string;
  color: string;       // UI용 (Tailwind hex)
  enLabel: string;     // 영문 라벨 (UI 보조)
}

// ─── 신호 추출 헬퍼 ─────────────────────
const YANG_ILGAN = new Set(["갑", "병", "무", "경", "임"]);

function deriveSipCounts(saju: SajuAnalysis): {
  식상: number; 재성: number; 정관: number; 편관: number; 관성: number;
  비겁: number; 인성: number;
} {
  const counts = { 식상: 0, 재성: 0, 정관: 0, 편관: 0, 관성: 0, 비겁: 0, 인성: 0 };
  const sip = saju.sipseong;
  const all = [
    sip.year.stem, sip.year.branch,
    sip.month.stem, sip.month.branch,
    sip.day.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
  for (const s of all) {
    if (s.includes("식신") || s.includes("상관")) counts.식상++;
    else if (s.includes("정재") || s.includes("편재")) counts.재성++;
    else if (s.includes("정관")) { counts.정관++; counts.관성++; }
    else if (s.includes("편관") || s.includes("칠살")) { counts.편관++; counts.관성++; }
    else if (s.includes("비견") || s.includes("겁재")) counts.비겁++;
    else if (s.includes("정인") || s.includes("편인") || s.includes("효신")) counts.인성++;
  }
  return counts;
}

function hasDohwa(saju: SajuAnalysis): boolean {
  return (saju.sinsal ?? []).some(s => s.includes("도화"));
}

function isYangIlgan(saju: SajuAnalysis): boolean {
  return YANG_ILGAN.has(saju.ilgan);
}

function isBalanced(saju: SajuAnalysis): boolean {
  // 균형 사주 — 어떤 오행도 0이 아니고, 강한 오행 비율 35% 미만
  const e = saju.elements;
  const total = e.목 + e.화 + e.토 + e.금 + e.수;
  if (total === 0) return false;
  const allPresent = e.목 > 0 && e.화 > 0 && e.토 > 0 && e.금 > 0 && e.수 > 0;
  if (!allPresent) return false;
  const max = Math.max(e.목, e.화, e.토, e.금, e.수);
  return max / total < 0.35;
}

// ─── 캐릭터 메타 ─────────────────────
const FEMALE_META: Record<FemaleCharacter, Omit<CharacterMatch, "name" | "signal">> = {
  옥순: { innerImage: "자유분방·솔직 직진녀", color: "#ec4899", enLabel: "BOLD HEART" },
  현숙: { innerImage: "쿨·시크 차도녀·완벽주의", color: "#a855f7", enLabel: "COOL CITY" },
  정숙: { innerImage: "강단·성숙·안정·차분", color: "#3b82f6", enLabel: "CALM PILLAR" },
  순자: { innerImage: "활발·애교·감수성·마이웨이", color: "#eab308", enLabel: "BRIGHT CHARM" },
  영숙: { innerImage: "참한·맞춰주는·다정·부드러운", color: "#14b8a6", enLabel: "WARM GRACE" },
  영자: { innerImage: "무난·평범·따스함·일상적", color: "#22c55e", enLabel: "DAILY GLOW" },
};

const MALE_META: Record<MaleCharacter, Omit<CharacterMatch, "name" | "signal">> = {
  영철: { innerImage: "자신감·매력 자연스러운", color: "#dc2626", enLabel: "STEADY FLAME" },
  영호: { innerImage: "포용력·외향·인싸·점잖", color: "#f97316", enLabel: "OPEN WAVE" },
  광수: { innerImage: "이지적·진중·깊이·신중", color: "#1e40af", enLabel: "DEEP THINKER" },
  영수: { innerImage: "중후·진중·안정·든든한", color: "#92400e", enLabel: "STRONG PILLAR" },
  상철: { innerImage: "무난·편안·밸런스·부담 없는", color: "#64748b", enLabel: "EASY BREEZE" },
};

// ─── 여자 캐릭터 분류 (우선순위 캐스케이드) ─────────────────────
export function matchFemaleCharacter(saju: SajuAnalysis): CharacterMatch {
  const c = deriveSipCounts(saju);
  const dohwa = hasDohwa(saju);
  const yang = isYangIlgan(saju);

  // 1순위 옥순 (strict) — 식상강 + 도화 + 양일간
  if (c.식상 >= 3 && dohwa && yang) {
    return { name: "옥순", signal: "식상강 + 도화살 + 양일간 — 솔직 직진의 결", ...FEMALE_META.옥순 };
  }
  // 2순위 현숙 — 편관+식상 결합 + (도화 또는 양)
  if (c.편관 >= 1 && c.식상 >= 2 && (dohwa || yang)) {
    return { name: "현숙", signal: "편관·식상 결합 + 도화/양 — 시크 완벽주의의 결", ...FEMALE_META.현숙 };
  }
  // 2.5순위 현숙 (편관강 fallback) — 편관 강한데 식상 부족해도 시크함은 같음
  if (c.편관 >= 2 && yang) {
    return { name: "현숙", signal: "편관강 + 양일간 — 카리스마·완벽주의의 결", ...FEMALE_META.현숙 };
  }
  // 3순위 정숙 (strict) — 정관+인성 안정 + 재성 결합
  if (c.정관 >= 1 && c.인성 >= 2 && c.재성 >= 1) {
    return { name: "정숙", signal: "정관·인성 안정 + 재성 결합 — 강단·성숙의 결", ...FEMALE_META.정숙 };
  }
  // 3.5순위 정숙 (재성 옵션) — 인성강 + 정관 → 차분한 강단
  if (c.정관 >= 1 && c.인성 >= 3) {
    return { name: "정숙", signal: "정관 + 인성강 — 차분하고 깊은 강단의 결", ...FEMALE_META.정숙 };
  }
  // 4순위 순자 — 식상강 + 음일간 + 비겁 활성
  if (c.식상 >= 3 && !yang && c.비겁 >= 2) {
    return { name: "순자", signal: "식상강 + 음일간 + 비겁 활성 — 활발·애교의 결", ...FEMALE_META.순자 };
  }
  // 4.5순위 순자 (음일간 식상강) — 비겁 약해도 음일간+식상강은 애교형
  if (c.식상 >= 3 && !yang) {
    return { name: "순자", signal: "식상강 + 음일간 — 발랄한 감수성의 결", ...FEMALE_META.순자 };
  }
  // 5순위 옥순 (fallback) — 식상강 + 양일간 (도화 X여도 직진형)
  if (c.식상 >= 3 && yang) {
    return { name: "옥순", signal: "식상강 + 양일간 — 직진·솔직한 결", ...FEMALE_META.옥순 };
  }
  // 6순위 영숙 (strict) — 정관+식상 균형 + 인성 결합
  if (c.정관 >= 1 && c.식상 >= 2 && c.인성 >= 1) {
    return { name: "영숙", signal: "정관·식상 균형 + 인성 결합 — 참하고 다정한 결", ...FEMALE_META.영숙 };
  }
  // 6.5순위 영숙 (느슨) — 정관·인성 있고 식상 1 이상
  if (c.정관 >= 1 && c.인성 >= 1 && c.식상 >= 1) {
    return { name: "영숙", signal: "정관·인성·식상 균형 — 참한 다정의 결", ...FEMALE_META.영숙 };
  }
  // 7순위 영자 (fallback) — 균형 사주 또는 그 외
  return {
    name: "영자",
    signal: isBalanced(saju) ? "균형 사주 — 무난하고 일상적인 결" : "일반 사주 — 평범하고 따스한 결",
    ...FEMALE_META.영자,
  };
}

// ─── 남자 캐릭터 분류 (우선순위 캐스케이드) ─────────────────────
export function matchMaleCharacter(saju: SajuAnalysis): CharacterMatch {
  const c = deriveSipCounts(saju);
  const dohwa = hasDohwa(saju);
  const yang = isYangIlgan(saju);

  // 1순위 영철 (strict) — 식상강 + 도화 + 양일간
  if (c.식상 >= 3 && dohwa && yang) {
    return { name: "영철", signal: "식상강 + 도화살 + 양일간 — 자연스러운 자신감의 결", ...MALE_META.영철 };
  }
  // 2순위 영호 — 정관 + 식상 + 비겁 결합
  if (c.정관 >= 1 && c.식상 >= 2 && c.비겁 >= 2) {
    return { name: "영호", signal: "정관·식상·비겁 결합 — 포용력 있는 인싸의 결", ...MALE_META.영호 };
  }
  // 3순위 광수 (strict) — 인성강 + 정관 + 깊이
  if (c.인성 >= 3 && c.정관 >= 1) {
    return { name: "광수", signal: "인성강 + 정관 — 이지적·진중·깊이의 결", ...MALE_META.광수 };
  }
  // 3.5순위 광수 (인성 매우 강) — 정관 없어도 인성≥4면 진중·깊이
  if (c.인성 >= 4) {
    return { name: "광수", signal: "인성 매우 강 — 깊이·신중함의 결", ...MALE_META.광수 };
  }
  // 4순위 영수 — 정관·인성 안정
  if (c.정관 >= 1 && c.인성 >= 2) {
    return { name: "영수", signal: "정관·인성 안정 — 중후하고 든든한 결", ...MALE_META.영수 };
  }
  // 4.5순위 영철 (fallback) — 식상강 양일간 (도화 X여도 자신감)
  if (c.식상 >= 3 && yang) {
    return { name: "영철", signal: "식상강 + 양일간 — 자신감 있는 결", ...MALE_META.영철 };
  }
  // 4.7순위 영호 (느슨) — 정관+식상 (비겁 약해도 사교형)
  if (c.정관 >= 1 && c.식상 >= 2) {
    return { name: "영호", signal: "정관·식상 결합 — 점잖은 외향형의 결", ...MALE_META.영호 };
  }
  // 4.8순위 영수 (인성 단독) — 정관 없어도 인성≥2면 차분·중후
  if (c.인성 >= 2) {
    return { name: "영수", signal: "인성 안정 — 차분하고 중후한 결", ...MALE_META.영수 };
  }
  // 5순위 상철 (fallback) — 균형 + 재성·식상 안정
  return {
    name: "상철",
    signal: isBalanced(saju) ? "균형 사주 + 재성·식상 안정 — 편안하고 부담 없는 결" : "일반 사주 — 무난하고 편안한 결",
    ...MALE_META.상철,
  };
}

// ─── 통합 진입점 ─────────────────────
export function matchCharacter(saju: SajuAnalysis, gender: "남" | "여"): CharacterMatch {
  return gender === "여" ? matchFemaleCharacter(saju) : matchMaleCharacter(saju);
}

// ─── 끌리는 이상형 — 본인 사주 부족 십성을 보충하는 반대 성별 캐릭터 ─────────
// 원리: 사주에서 부족한 결을 가진 사람에게 끌림. 보완 매칭.
export function deriveIdealType(saju: SajuAnalysis, myGender: "남" | "여"): CharacterMatch {
  const c = deriveSipCounts(saju);
  const oppositeGender: "남" | "여" = myGender === "여" ? "남" : "여";

  // 부족 십성 우선순위:
  // 정관 부족 → 안정·책임감 받쳐주는 결 (영수)
  // 인성 부족 → 깊이·받침 (광수)
  // 식상 부족 → 표현·활기 (영철 / 옥순)
  // 비겁 부족 → 함께 가는 결 (영호 / 순자)
  // 재성 부족 → 현실 안내 (영자 / 상철)

  if (myGender === "여") {
    // 여자가 끌리는 남자
    if (c.정관 <= 1 && c.인성 <= 1) {
      return { name: "영수", signal: "정관·인성 부족 — 안정과 깊이를 받쳐주는 중후한 결에 끌림", ...MALE_META.영수 };
    }
    if (c.인성 <= 1 && c.정관 >= 2) {
      return { name: "광수", signal: "인성 부족 — 깊이 있고 사색적인 진중한 결에 끌림", ...MALE_META.광수 };
    }
    if (c.식상 <= 1) {
      return { name: "영철", signal: "식상 부족 — 표현 풍부하고 자연스러운 자신감에 끌림", ...MALE_META.영철 };
    }
    if (c.비겁 <= 1) {
      return { name: "영호", signal: "비겁 부족 — 함께 가는 사교적이고 든든한 결에 끌림", ...MALE_META.영호 };
    }
    return { name: "상철", signal: "균형 사주 — 부담 없고 편안한 결에 끌림", ...MALE_META.상철 };
  } else {
    // 남자가 끌리는 여자
    if (c.인성 <= 1 && c.정관 <= 1) {
      return { name: "정숙", signal: "정관·인성 부족 — 차분하고 강단 있는 안정의 결에 끌림", ...FEMALE_META.정숙 };
    }
    if (c.식상 <= 1 && isYangIlgan(saju)) {
      return { name: "옥순", signal: "식상 부족 + 양일간 — 솔직 직진의 활기 있는 결에 끌림", ...FEMALE_META.옥순 };
    }
    if (c.식상 <= 1) {
      return { name: "순자", signal: "식상 부족 — 발랄하고 애교 있는 감수성에 끌림", ...FEMALE_META.순자 };
    }
    if (c.인성 <= 1) {
      return { name: "영숙", signal: "인성 부족 — 다정하고 받쳐주는 부드러운 결에 끌림", ...FEMALE_META.영숙 };
    }
    if (c.편관 >= 2) {
      return { name: "현숙", signal: "편관강 — 시크하고 도시적인 완벽주의 결에 끌림", ...FEMALE_META.현숙 };
    }
    return { name: "영자", signal: "균형 사주 — 무난하고 따스한 일상적 결에 끌림", ...FEMALE_META.영자 };
  }
}
