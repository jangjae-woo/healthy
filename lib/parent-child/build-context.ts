// 부모자녀 build-context — 해석 기획 오케스트레이터 (2026-05-13)
// hongsil build-context의 SIPSEONG_STANDARD_DEFINITIONS + SOLO_MODE_GUARD 패턴 차용.
// 자도인 톤으로 변형.

import type { SajuAnalysis } from "../saju-calculator";
import {
  deriveParentChildInterpretationPlan,
  parentChildInterpretationPlanBlock,
  type ParentChildPlanScope,
  // ⭐ Step B (2026-05-14) — 연령 톤 강제 룰
  classifyAgeStageFromYear,
  parentChildAgeToneBlock,
} from "./interpretation-plan";
import { parentChildSubDistribution, type ParentChildChapterScope } from "./sub-distribution";
// ⭐ Step A (2026-05-14) — 부모자녀 사주 처방 helper
import {
  deriveParentChildPrescription,
  parentChildPrescriptionBlock,
} from "./yongsin-prescription";

// ────────────────────────────────────────────────────────────────
// 십성 표준 정의 — 한 풀이 안 같은 십성을 다른 정의로 묘사 금지
// hongsil의 SIPSEONG_STANDARD_DEFINITIONS와 동일 구조 (자녀 톤 키워드 미세 조정)
// ────────────────────────────────────────────────────────────────
export const PARENT_CHILD_SIPSEONG_STANDARD_DEFINITIONS = `
[★★★★★ 십성 표준 정의 — 본문 어디에서든 같은 정의로 통일. 챕터마다 정의를 다르게 쓰지 말 것]
- 비겁(比劫: 비견·겁재) = 나(자녀)와 같은 오행. 키워드는 자기 결·자기 기준·또래 감각·독립성.
- 식상(食傷: 식신·상관) = 자녀가 생하는 기운. 키워드는 표현·발산·창의·전달.
- 재성(財星: 정재·편재) = 자녀가 극하는 기운. 키워드는 현실감·결과 챙김·결단·실용 감각.
- 관성(官星: 정관·편관) = 자녀를 극하는 기운. 키워드는 약속·기준·책임·규율·절제.
- 인성(印星: 정인·편인) = 자녀를 생하는 기운. 키워드는 받아들임·사색·배움·내적 지지.

[★ 강·약 표현 룰]
- 강·약 판정은 traits-block-v2의 "가중 십성 카운트(위치·충합·합화 반영)" 수치를 기준점으로만 사용.
- 한 풀이 안에서 같은 십성을 "강하게"와 "부족"·"약함"으로 모순되게 묘사 X.
- 정관과 편관, 정재와 편재처럼 같은 묶음 안의 두 십성이 다르게 작동할 때만 그 차이를 명시.
- 결핍 낙인 금지 — "약해서 채워" 대신 "옅게 자리한 X의 결" 양반사주 톤.
`;

// ────────────────────────────────────────────────────────────────
// 가족 풀이 모드 가드 — 자녀 사주 + 입력된 부모 사주만 사용
// hongsil SOLO_MODE_GUARD의 부모자녀 버전. 입력 안 된 가족 환각 차단.
// ────────────────────────────────────────────────────────────────
export function parentChildModeGuard(hasMom: boolean, hasDad: boolean): string {
  const inputDescription = hasMom && hasDad
    ? "자녀 + 어머님 + 아버님 3명의 사주"
    : hasMom
      ? "자녀 + 어머님 2명의 사주 (아버님 입력 없음)"
      : hasDad
        ? "자녀 + 아버님 2명의 사주 (어머님 입력 없음)"
        : "자녀 1명의 사주만";

  const missingClause = hasMom && hasDad
    ? ""
    : hasMom
      ? "- 아버님 사주는 입력되지 않음 → 아버님 사주 인자(비겁·식상·재성·관성·인성·일간·일지·신강·신약·용신) 단정 절대 금지.\n- 아버님은 일반적 부모 호칭으로만 언급 가능 (예: \"아버님께서는…\" 같은 사주 인자 인용 X)."
      : hasDad
        ? "- 어머님 사주는 입력되지 않음 → 어머님 사주 인자 단정 절대 금지.\n- 어머님은 일반적 부모 호칭으로만 언급 가능 (예: \"어머님께서는…\" 같은 사주 인자 인용 X)."
        : "- 부모 사주 미입력 → 부모 사주 인자 단정 절대 금지. 부모는 일반적 양육자로만 언급.";

  return `
[★★★★★ 가족 풀이 모드 — 입력: ${inputDescription}]
- 입력된 가족(자녀 + 명시된 부모)의 사주 인자만 사용 가능.
- 입력되지 않은 가족의 사주 인자(비겁·식상·재성·관성·인성·일간·일지·신강·신약·용신) 환각 단정 절대 금지.
${missingClause}
- 가족 간 관계 묘사 시 사주 인자가 아니라 행동·말투·태도·생활 장면으로만 묘사.
- 예: "어머님께서는 자기 의지가 분명하셔서" (OK) / "어머님의 비겁 기운이 강하셔서" (X — 단 어머님 사주 입력된 경우만 OK)
`;
}

// ────────────────────────────────────────────────────────────────
// 부모자녀 컨텍스트 블록 통합 빌더
// route.ts buildParentChildPromptV2에서 호출해 prompt 시작 부분에 prepend.
// ────────────────────────────────────────────────────────────────
export interface BuildParentChildContextOpts {
  sajuChild: SajuAnalysis;
  childName: string;
  hasMom: boolean;
  hasDad: boolean;
  scope: ParentChildPlanScope;          // ch1~ch6 + outro
  chapterScope?: ParentChildChapterScope; // sub 분배 — outro엔 없음
  childBirthYear?: number;              // ⭐ Step B: 연령 톤 분기용 (optional, 미지정 시 elementary로 fallback)
}

/**
 * 부모자녀 prompt 시작 부분에 prepend할 컨텍스트 블록.
 * 순서:
 * 1. 가족 풀이 모드 가드
 * 2. 십성 표준 정의
 * 3. 해석 기획 (5 lens + 챕터 정책)
 * 4. sub 분배 (chapterScope 있을 때만)
 */
export function buildParentChildContext(opts: BuildParentChildContextOpts): string {
  const { sajuChild, childName, hasMom, hasDad, scope, chapterScope, childBirthYear } = opts;

  const plan = deriveParentChildInterpretationPlan(sajuChild, childName);
  const planBlock = parentChildInterpretationPlanBlock(plan, scope);
  const modeGuard = parentChildModeGuard(hasMom, hasDad);
  const subDistribution = chapterScope ? parentChildSubDistribution(chapterScope) : "";
  // ⭐ Step A: 자녀 사주 결정론 처방 (용신 보정 + 약한 결 처방 + 신살 활용 + 세운 + 일간 팁)
  const prescription = deriveParentChildPrescription(sajuChild);
  const prescriptionBlock = parentChildPrescriptionBlock(prescription);
  // ⭐ Step B: 연령 톤 강제 룰 (영유아·학령기·청소년 어휘 분기)
  const ageStage = childBirthYear ? classifyAgeStageFromYear(childBirthYear) : "elementary";
  const ageToneBlock = parentChildAgeToneBlock(ageStage);

  return [
    modeGuard,
    ageToneBlock,  // 연령 톤 (가장 먼저 — LLM이 어휘 선택 시 첫 기준)
    PARENT_CHILD_SIPSEONG_STANDARD_DEFINITIONS,
    prescriptionBlock,
    planBlock,
    subDistribution,
  ].filter(Boolean).join("\n\n");
}
