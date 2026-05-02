// 자녀 캐릭터 단일 진실 원천 (Single Source of Truth)
// 모든 매트릭스·차트·AI 본문이 이 시드 한 곳에서 자녀 데이터를 받는다.
// 같은 사주 → 모든 페이지가 100% 일관된 캐릭터 묘사 보장.
//
// Phase 3 (옵션 D) 의 핵심 — 분산 데이터 source 12+ 곳을 단일 시드로 통합.

import type { SajuAnalysis } from "./saju-calculator";
import { getSipseongCounts } from "./parent-child-charts";
import type { AgeStage } from "./age-stage";

// ── 일간(10간) → 자연 메타포 (opener-seed.ts 와 동일 — sync 유지) ──
const ILGAN_METAPHOR: Record<string, string> = {
  갑: "곧게 뻗는 큰 나무",
  을: "부드럽게 뻗는 봄풀",
  병: "환하게 비추는 햇살",
  정: "따스히 번지는 등불",
  무: "한 자리에 뿌리내리는 너른 들판",
  기: "모든 것을 받아내는 부드러운 흙",
  경: "단단히 벼린 강철",
  신: "투명하게 빛나는 보석",
  임: "도도하게 흐르는 큰 강물",
  계: "깊이 잠긴 맑은 샘물",
};

// ── 일간 → 오행 매핑 (10간) ──
const STEM_TO_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

// ── 양일간 ──
const YANG_STEMS = ["갑", "병", "무", "경", "임"];

// ── 오행 한국어 ──
const ELEM_KOR: Record<string, string> = {
  목: "나무의 결", 화: "불의 결", 토: "흙의 결",
  금: "쇠의 결", 수: "물의 결",
};

// ── 6요인 라벨 (route.ts sixFactor 와 동일 — sync) ──
type SixFactorKey = "활동성" | "표현력" | "감수성" | "끈기" | "창의성" | "자기조절";

// ── 오행 명리 관계 (자녀 일간 ↔ 환경 강 오행) ──
// 자원 프레임 ban 의 부작용 (수극화 → "수가 화 도움" 정반대 윤색) 차단용
type ElementRelationType = "비화" | "자녀생환경" | "환경생자녀" | "자녀극환경" | "환경극자녀";

interface ElementRelation {
  type: ElementRelationType;
  description: string;     // 시드 블록 표시용
  bodyHint: string;         // 본문 톤 가이드
}

function inferElementRelation(childElem: string, topElem: string): ElementRelation {
  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  if (childElem === topElem) return {
    type: "비화",
    description: `${childElem} ↔ ${topElem} = 비화 (같은 결로 흐름)`,
    bodyHint: "자녀 본질과 환경이 같은 결 — 본질이 환경에서 자연스럽게 강화됨",
  };
  if (generates[childElem] === topElem) return {
    type: "자녀생환경",
    description: `${childElem} → ${topElem} = 상생 (자녀가 환경 살림)`,
    bodyHint: "자녀 본질이 환경을 자연스럽게 키워주는 결",
  };
  if (generates[topElem] === childElem) return {
    type: "환경생자녀",
    description: `${topElem} → ${childElem} = 상생 (환경이 자녀 살림)`,
    bodyHint: "환경이 자녀 본질을 든든히 키워주는 결",
  };
  if (controls[childElem] === topElem) return {
    type: "자녀극환경",
    description: `${childElem} → ${topElem} = 상극 (자녀가 환경 단정히 다스림)`,
    bodyHint: "자녀 본질이 환경을 단정하게 다스리는 결",
  };
  if (controls[topElem] === childElem) return {
    type: "환경극자녀",
    description: `${topElem} → ${childElem} = 상극 (환경이 자녀 본질에 도전 자극)`,
    bodyHint: "환경이 자녀 본질을 차분히 가다듬어 단단하게 만드는 결",
  };
  return {
    type: "비화",
    description: `${childElem} ↔ ${topElem} (관계 모호)`,
    bodyHint: "자녀 본질과 환경이 자연스럽게 흐름",
  };
}

/**
 * 자녀 캐릭터 시드 — 모든 페이지가 이 인터페이스만 참조.
 * 새 페이지 추가 시 이 시드에서 필요한 필드를 가져다 쓰고, 직접 계산 X.
 */
export interface ChildSeed {
  // ── 일간 (자녀 본질의 핵) ──
  ilgan: string;
  ilganElement: string;
  ilganPolarity: "양" | "음";
  ilganMetaphor: string;

  // ── 오행 분포 ──
  elements: Record<string, number>;
  elementPercents: Record<string, number>;
  topElement: string;
  weakElement: string;

  // ── 십성 분포 ──
  sipCounts: { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number };
  topSipseong: string;
  weakSipseong: string;

  // ── 외향/내향 (음양 분포) ──
  yangPct: number;
  yinPct: number;
  introExtroDirection: "외향" | "내향";

  // ── 6요인 행동 결 ──
  sixFactor: Record<SixFactorKey, number>;
  sixFactorTop1: SixFactorKey;
  sixFactorTop3: SixFactorKey[];
  sixFactorWeakest: SixFactorKey;

  // ── 자녀 캐릭터 한 줄 요약 (모든 페이지 인용) ──
  characterSummary: string;

  // ── 오행 명리 관계 (옵션 A — 명리 정확성 회복) ──
  elementRelation: ElementRelation;

  // ── 메타 ──
  childName: string;
  childGender: "남" | "여";
  childLabel: string;
  childAgeStage: AgeStage;
}

/**
 * 사주 계산 결과 → 자녀 캐릭터 시드.
 * route.ts buildParentChildPrompt 의 분산 계산을 한 함수로 통합.
 */
export function buildChildSeed(
  sajuChild: SajuAnalysis,
  childName: string,
  childGender: "남" | "여",
  childAgeStage: AgeStage,
): ChildSeed {
  // ── 일간 ──
  const ilgan = sajuChild.ilgan;
  const ilganElement = STEM_TO_ELEM[ilgan] ?? "";
  const ilganPolarity: "양" | "음" = YANG_STEMS.includes(ilgan) ? "양" : "음";
  const ilganMetaphor = ILGAN_METAPHOR[ilgan] ?? "";

  // ── 오행 분포 ──
  const elements = (sajuChild.elements ?? {}) as Record<string, number>;
  const elTotal = Object.values(elements).reduce((s, v) => s + v, 0) || 1;
  const elementPercents: Record<string, number> = {};
  for (const k of ["목", "화", "토", "금", "수"]) {
    elementPercents[k] = Math.round(((elements[k] ?? 0) / elTotal) * 100);
  }
  const elemSorted = Object.entries(elementPercents).sort((a, b) => b[1] - a[1]);
  const topElement = elemSorted[0]?.[0] ?? "토";
  const weakElement = elemSorted[elemSorted.length - 1]?.[0] ?? "수";

  // ── 십성 분포 ──
  const sipCounts = getSipseongCounts(sajuChild);
  const sipSorted = (Object.entries(sipCounts) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1]);
  const topSipseong = sipSorted[0]?.[0] ?? "비겁";
  const weakSipseong = sipSorted[sipSorted.length - 1]?.[0] ?? "관성";

  // ── 외향/내향 (음양 분포) ──
  const yangScore = (elements.목 ?? 0) + (elements.화 ?? 0) + (elements.토 ?? 0) * 0.5;
  const yinScore = (elements.금 ?? 0) + (elements.수 ?? 0) + (elements.토 ?? 0) * 0.5;
  const yyTotal = yangScore + yinScore || 1;
  const yangPct = Math.round((yangScore / yyTotal) * 100);
  const yinPct = 100 - yangPct;
  const introExtroDirection: "외향" | "내향" = yangPct >= yinPct ? "외향" : "내향";

  // ── 6요인 (route.ts 와 동일 공식 — SSOT 원칙) ──
  const isYang = ilganPolarity === "양";
  const sixFactor: Record<SixFactorKey, number> = {
    활동성: Math.min(100, Math.round((elements.목 ?? 0) + (elements.화 ?? 0) + (isYang ? 15 : 0) + sipCounts.비겁 * 5)),
    표현력: Math.min(100, Math.round(sipCounts.식상 * 18 + (elements.화 ?? 0) * 0.8)),
    감수성: Math.min(100, Math.round(sipCounts.인성 * 18 + (elements.수 ?? 0) * 0.8)),
    끈기: Math.min(100, Math.round(sipCounts.비겁 * 12 + (elements.토 ?? 0) * 0.8)),
    창의성: Math.min(100, Math.round(sipCounts.식상 * 14 + (elements.화 ?? 0) * 0.5 + (elements.목 ?? 0) * 0.4 + (isYang ? 10 : 0))),
    자기조절: Math.min(100, Math.round(sipCounts.관성 * 18 + (elements.금 ?? 0) * 0.5)),
  };
  const sixFactorSorted = (Object.entries(sixFactor) as Array<[SixFactorKey, number]>)
    .sort((a, b) => b[1] - a[1]);
  const sixFactorTop3 = sixFactorSorted.slice(0, 3).map(([k]) => k);
  const sixFactorTop1 = sixFactorTop3[0] ?? "표현력";
  const sixFactorWeakest = sixFactorSorted[sixFactorSorted.length - 1]?.[0] ?? "자기조절";

  // ── 자녀 캐릭터 한 줄 요약 (모든 페이지 인용) ──
  const childLabel = `${childName}${childGender === "남" ? "군" : "양"}`;
  const characterSummary = `${ilganMetaphor} 같은 ${childLabel} (${ELEM_KOR[ilganElement] ?? ilganElement} 본질, ${introExtroDirection}적 결, ${sixFactorTop1}이 가장 두드러짐)`;

  // ── 오행 명리 관계 (옵션 A) ──
  const elementRelation = inferElementRelation(ilganElement, topElement);

  return {
    ilgan, ilganElement, ilganPolarity, ilganMetaphor,
    elements, elementPercents, topElement, weakElement,
    sipCounts, topSipseong, weakSipseong,
    yangPct, yinPct, introExtroDirection,
    sixFactor, sixFactorTop1, sixFactorTop3, sixFactorWeakest,
    characterSummary,
    elementRelation,
    childName, childGender, childLabel, childAgeStage,
  };
}

/**
 * 시드를 프롬프트 헤더 블록으로 직렬화.
 * route.ts 의 [기본 데이터] 섹션 직후에 삽입 → 모든 페이지가 이 블록 인용.
 */
export function buildChildSeedPromptBlock(seed: ChildSeed): string {
  return [
    "━━━ ★★★ 자녀 캐릭터 시드 (Single Source of Truth — 모든 페이지 일관 강제) ━━━",
    "★ 모든 페이지 본문은 아래 시드와 100% 일관되게 묘사. 모순·변형 절대 금지.",
    "",
    `[자녀 본질]`,
    `- 일간: ${seed.ilgan} (${seed.ilganElement}, ${seed.ilganPolarity})`,
    `- 일간 메타포: "${seed.ilganMetaphor}" ← 자도인 첫마디·자녀 본질 묘사 시 이 메타포 사용`,
    `- 캐릭터 한 줄: ${seed.characterSummary}`,
    "",
    `[오행 분포 — 차트와 100% 일치]`,
    `- 강한 결: ${seed.topElement} (${seed.elementPercents[seed.topElement]}%, ${ELEM_KOR[seed.topElement] ?? seed.topElement})`,
    `- 약한 결: ${seed.weakElement} (${seed.elementPercents[seed.weakElement]}%, ${ELEM_KOR[seed.weakElement] ?? seed.weakElement})`,
    `- 전체: 목 ${seed.elementPercents.목}% / 화 ${seed.elementPercents.화}% / 토 ${seed.elementPercents.토}% / 금 ${seed.elementPercents.금}% / 수 ${seed.elementPercents.수}%`,
    "",
    `[십성 분포 — 다섯 색깔의 결]`,
    `- 가장 강한 십성: ${seed.topSipseong} (${seed.sipCounts[seed.topSipseong as keyof typeof seed.sipCounts]}개)`,
    `- 가장 약한 십성: ${seed.weakSipseong} (${seed.sipCounts[seed.weakSipseong as keyof typeof seed.sipCounts]}개)`,
    "",
    `[외향/내향 — 음양 분포]`,
    `- ${seed.introExtroDirection}적 결 (양 ${seed.yangPct}% / 음 ${seed.yinPct}%)`,
    "",
    `[6요인 행동 결]`,
    `- TOP3: ${seed.sixFactorTop3.join("·")}`,
    `- 가장 약한 결: ${seed.sixFactorWeakest}`,
    "",
    `[자녀 본질 vs 환경 — 명리 관계] (옵션 A — 명리 정확성 회복)`,
    `- 자녀 일간 오행: ${seed.ilganElement} (${seed.ilganMetaphor})`,
    `- 강한 환경 오행: ${seed.topElement} (${seed.elementPercents[seed.topElement]}%)`,
    `- 명리 관계: ${seed.elementRelation.description}`,
    `- 본문 톤 가이드: ${seed.elementRelation.bodyHint}`,
    `- 🔴 자원 프레임 + 명리 정확성 균형: 명리 관계를 정확히 반영하되 부모 부담 X. 명리적 부정 관계(상극)를 긍정으로 윤색하면 정반대 해석 발생 (예: 수극화 → "수가 화 도와줌" 잘못된 풀이).`,
    "",
    `🔴 위 시드는 차트·매트릭스·본문 모두의 단일 진실 원천. 본문이 시드와 모순되면 사용자 화면에서 차트와 본문이 정반대로 보이는 명백한 오류 → 신뢰도 직격.`,
    "",
    `🔴 **강 결 표현 원칙** (가장 중요):`,
    `- 강한 십성 (${seed.topSipseong}) · 강한 오행 (${seed.topElement}) 은 자녀가 **이미 타고난 결**. 능동·자족 표현으로만 묘사.`,
    `- ✅ 권장 (페이지별 다양화 — 같은 어휘 반복 회피): "이미 ~한 결을 깊이 머금은 자녀" / "타고난 ~한 결을 자연스럽게 펼쳐가는 자녀" / "자기 결을 자라가는 자녀" / "자기 호흡으로 단단해지는 자녀" / "차분한 흐름 속에서 빛나는 자녀"`,
    `- ❌ 금지: "~ 시간이 **필요한** 자녀" / "~을 **채워줘야** 하는 자녀" / "~이 **부족한** 자녀" — 강 결을 결핍 표현으로 묘사 = 시드 모순.`,
    `- 약 결 (${seed.weakElement} 오행 / ${seed.weakSipseong} 십성) 만 "~ 부모님께서 채워주시면 빛나는" 같은 보충 표현 사용 가능.`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].join("\n");
}
