// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 자도인 보고서 규칙 카탈로그 (옵션 D Phase 5)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 이 파일의 목적:
// 1. 자도인 보고서의 모든 핵심 규칙을 한 곳에 명시 (분산 ban·require 통합)
// 2. 충돌 페어를 명시적으로 선언하고 해소 방식 문서화
// 3. 매트릭스·차트·후처리가 규칙을 위반하지 않는지 자동 검증
// 4. 새 규칙 추가 시 충돌 검증 워크플로우 강제
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 새 규칙 추가 워크플로우 (회귀 사이클 종결의 핵심)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Step 1. 새 규칙을 CORE_RULES 에 추가
//   - id, type, scope, source, description 필수
//   - 어떤 데이터·페이지·매트릭스를 다루는지 명확히
//
// Step 2. 충돌 가능성 분석
//   - 같은 어휘에 ban/require 양방향 규칙 없는지 검토
//   - 같은 페이지에 형식·내용 강제 충돌 없는지
//   - 매트릭스 데이터가 새 ban 어휘 포함하는지 검증
//   - 충돌 발견 시 KNOWN_CONFLICTS 에 페어 추가 + resolution 명시
//
// Step 3. validateRulesAgainstSeed(sampleSeed) 실행 → 위반 0 확인
//
// Step 4. 실제 prompt/matrix 코드 변경
//
// Step 5. 배포 후 사용자 검증 (모든 회귀 패턴 catalog 의 known issue 와 비교)
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { ChildSeed } from "./child-seed";
import { buildSixFactorBodyContext } from "./heart-context";
import { enforceHanjaBan, enforceChartConsistency } from "./text-postprocess";

// ─── 규칙 타입 정의 ─────────────────────────────────────────────────

export type RuleType = "ban" | "require" | "format";
export type RuleScope = "global" | "page-specific" | "matrix" | "post-process";
export type RulePriority = "★★★" | "★★" | "★";

export interface Rule {
  id: string;
  type: RuleType;
  scope: RuleScope;
  priority: RulePriority;
  source: string; // 코드 위치 (파일명:라인 또는 함수명)
  description: string;
  conflictsWith?: string[]; // 충돌하는 규칙 ID
  resolution?: string; // 충돌 해소 방식
}

// ─── 핵심 14 규칙 카탈로그 (Phase 1 인벤토리 → Phase 2~4 정리 결과) ──

export const CORE_RULES: Record<string, Rule> = {
  // ─── A. 호칭·인칭 (3) ───
  R001: {
    id: "R001",
    type: "require",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1217 + text-postprocess.ts:30-49",
    description: "호칭 통일: 본문에서 '엄마/아빠' → '어머님/아버님' 강제. 조사도 통일.",
    conflictsWith: ["R002", "R014"],
    resolution: "R002: 헤더 라인 예외. R014: opener-seed 의 '엄마/아빠' 라벨은 본문 출력 전 후처리에서 변환.",
  },
  R002: {
    id: "R002",
    type: "format",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1218 + components/ParentChildSlideResult.tsx:HEADER_SYNONYMS",
    description: "마크다운 헤더 (## ### 등) 라인은 호칭 통일 적용 X. 표준 형식 유지 (시스템 매칭 의존).",
    conflictsWith: ["R001"],
    resolution: "R001 의 예외 — softenNegatives 가 헤더 라인 보호 (정규식 /^#{1,4}\\s/).",
  },
  R070: {
    id: "R070",
    type: "format",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1237",
    description: "응답에 8개 ## 대섹션 헤더 빠짐없이 출력 강제. 첫 섹션 '## 자도인의 첫마디' 도 본문 앞에 출력.",
    resolution: "프롬프트 명시 강제 + parseSections 의 HEADER_SYNONYMS 동의어 매칭으로 회수.",
  },

  // ─── B. 한자·전문 용어 ban (3) ───
  R010: {
    id: "R010",
    type: "ban",
    scope: "page-specific",
    priority: "★★★",
    source: "route.ts:1391 (6요인 페이지) + text-postprocess.ts:enforceHanjaBan",
    description: "십성 한자 (식상·인성·비겁·관성·재성·식신·상관 등 15개) 본문 노출 금지. 6요인 페이지 한정.",
    conflictsWith: ["R011"],
    resolution: "R011 (다섯 색깔의 결 페이지) 와 page-scope 분리. SSOT 시드로 페이지 어휘 격리.",
  },
  R011: {
    id: "R011",
    type: "require",
    scope: "page-specific",
    priority: "★★★",
    source: "lib/heart-context.ts:SIP_BY_STAGE",
    description: "다섯 색깔의 결 페이지에서 십성 풀이 어휘 ('자기를 세우는 기운', '표현하는 기운' 등) 사용.",
    conflictsWith: ["R010"],
    resolution: "R010 (6요인 페이지) 와 page-scope 분리. 다섯 색깔의 결 페이지 한정 require.",
  },
  R012: {
    id: "R012",
    type: "ban",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1226 (자원 프레임 절대 원칙) + text-postprocess.ts:enforceHanjaBan",
    description: "합·충 한자 (沖·冲·相剋·刑) 본문 노출 금지. 부정 한자 (양인살·괴강·공망·칠살·흉) 도 포함.",
    resolution: "프롬프트 명시 ban + Phase 4 후처리 layer 가 한자 자동 제거.",
  },

  // ─── C. 데이터 정합성 (2) ───
  R030: {
    id: "R030",
    type: "require",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1297 + 1302 + child-seed.ts:buildChildSeedPromptBlock",
    description: "차트 분류 (강함/중간/약함) 그대로 따를 것. SSOT 시드의 강한 결·약한 결을 본문에서 인용.",
    conflictsWith: ["R032"],
    resolution: "Phase 4 enforceChartConsistency 가 약한 결을 강하게 묘사 시 자동 교정.",
  },
  R032: {
    id: "R032",
    type: "ban",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1033 + 1298 + 1303",
    description: "약함 묶어 '균형/안정/조화' 표현 금지. 약한 결은 정직하게 약하다고 묘사.",
    resolution: "프롬프트 ban + 6요인 매트릭스의 강/약 양상 사전이 약 결을 자원 톤으로 사전 정의.",
  },

  // ─── D. 매트릭스 결정론 출력 (5 → 1 카테고리) ───
  R040: {
    id: "R040",
    type: "require",
    scope: "matrix",
    priority: "★★★",
    source: "route.ts:1444 (회복) + 1665 (시너지) + 1684 (갈등) + 1710 (선물) + 1383 (6요인)",
    description: "결정론 매트릭스 5개 (회복·시너지·갈등·선물·6요인) 그대로 출력 강제. AI 자유 풀이 X.",
    conflictsWith: ["R050"],
    resolution: "매트릭스 텍스트 자체에 ban 어휘 포함 X. validateSixFactorMilestoneBan 함수가 빌드 시 검증.",
  },
  R045: {
    id: "R045",
    type: "format",
    scope: "page-specific",
    priority: "★★★",
    source: "route.ts:1253 (자도인 첫마디 5/6문장 구조)",
    description: "자도인 첫마디 정확히 5문장 (한 부모) 또는 6문장 (양친) 구조 강제.",
    resolution: "opener-seed 매트릭스가 imagery·동사·자녀 마무리 문구를 사전 결정.",
  },

  // ─── E. 영아 milestone ban (1) ───
  R050: {
    id: "R050",
    type: "ban",
    scope: "page-specific",
    priority: "★★★",
    source: "lib/age-stage.ts:40-43 + lib/heart-context.ts:FORBIDDEN_INFANT_MILESTONES + text-postprocess.ts (영아 한정)",
    description: "영아 단계 milestone 어휘 (옹알이·뒤집기·잠투정·까꿍·박수 등 23개) 사주 풀이 본문 노출 금지.",
    conflictsWith: ["R040"],
    resolution: "validateSixFactorMilestoneBan 이 매트릭스 출력 시점에 자동 검증·throw. 친구 페이지 예외 (R053 재정의).",
  },

  // ─── F. 보고서 방향·구조 (3) ───
  R091: {
    id: "R091",
    type: "require",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1213 + 1276",
    description: "명리 방향이 자녀→부모일지라도 보고서는 부모→자녀 방향으로 reframe.",
    resolution: "프롬프트 명시 + opener-seed 의 응답 동사가 부모→자녀 방향으로 사전 결정.",
  },
  R092: {
    id: "R092",
    type: "require",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1232 + 1277",
    description: "모든 본문 마지막 한 문장은 자녀 영향 마무리. '${childLabel}은 ~한 자녀로 자라간다' 형태.",
    resolution: "프롬프트 명시 + 매트릭스의 lineOutro 가 자녀 영향 마무리 사전 결정.",
  },

  // ─── G. 부정 어휘 ban (1) ───
  R020: {
    id: "R020",
    type: "ban",
    scope: "global",
    priority: "★★★",
    source: "route.ts:1226 + text-postprocess.ts:NEGATIVE_REPLACEMENTS",
    description: "강 부정 어휘 23개 (억누르다·짓누르다·압박·꺾다·다치다·위협·위축 등) 본문 노출 금지.",
    conflictsWith: ["R040"],
    resolution: "프롬프트 ban + softenNegatives 후처리가 명사형·한자 자동 치환. 갈등·위험 카드 매트릭스 직접 작성 시 ban 준수.",
  },
};

// ─── 알려진 충돌 페어 + 해소 방식 명시 ──────────────────────────────

export interface ConflictPair {
  a: string; // 규칙 ID
  b: string; // 규칙 ID
  description: string;
  resolution: string;
  status: "resolved" | "monitored" | "open";
}

export const KNOWN_CONFLICTS: ConflictPair[] = [
  {
    a: "R001",
    b: "R002",
    description: "호칭 통일 vs 헤더 형식 유지",
    resolution: "softenNegatives 가 헤더 라인 (^#{1,4}\\s) 보호. 본문만 통일 적용.",
    status: "resolved",
  },
  {
    a: "R010",
    b: "R011",
    description: "십성 어휘: 6요인 페이지 ban / 다섯 색깔 페이지 require — 같은 프롬프트 내 양방향 규칙",
    resolution: "Phase 3 SSOT + Phase 4 후처리 layer. 6요인 매트릭스가 결정론으로 차트 라벨만 사용.",
    status: "resolved",
  },
  {
    a: "R040",
    b: "R050",
    description: "매트릭스 그대로 출력 vs 영아 milestone ban — 매트릭스 텍스트가 ban 우회 위험",
    resolution: "validateSixFactorMilestoneBan 검증 함수가 매트릭스 출력 시점에 자동 throw. 다른 매트릭스 확장 시 같은 패턴 적용.",
    status: "resolved",
  },
  {
    a: "R040",
    b: "R020",
    description: "매트릭스 그대로 출력 vs 부정 어휘 ban — 갈등·위험 카드는 갈등 본질 묘사 필요",
    resolution: "갈등·위험 카드 매트릭스는 자원 톤 어휘로 작성 (다듬는 결·강한 자극 결 등). 직접 부정 어휘 사용 X.",
    status: "monitored",
  },
  {
    a: "R030",
    b: "AI 자유 작문",
    description: "차트 데이터 그대로 vs AI 가 명리 합·충 풀이로 점프 — 차트와 본문 정반대 묘사",
    resolution: "Phase 3 SSOT 시드 블록이 본문에 명시 % 수치 제공. Phase 4 enforceChartConsistency 가 자동 교정.",
    status: "resolved",
  },
];

// ─── 자동 검증 함수 (새 규칙 추가 시 안전망) ─────────────────────────

export interface RuleViolation {
  ruleId: string;
  source: string;
  reason: string;
  sampleText?: string;
}

/**
 * 매트릭스가 ban 규칙을 우회하지 않는지 검증.
 * Phase 4 후처리 layer 와 매트릭스 검증 함수의 통합 검증.
 *
 * 호출 예: validateRulesAgainstSeed(sampleSeed) → RuleViolation[]
 * 위반 0 = 새 규칙 추가 안전. 위반 발견 = 규칙 충돌 또는 매트릭스 수정 필요.
 */
export function validateRulesAgainstSeed(seed: ChildSeed): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // ── R050: 영아 milestone ban (6요인 매트릭스 검증) ──
  if (seed.childAgeStage === "infant") {
    try {
      buildSixFactorBodyContext(seed.sixFactor, seed.childAgeStage, seed.childName, seed.childGender);
      // 통과 = ban 어휘 0
    } catch (e) {
      violations.push({
        ruleId: "R050",
        source: "lib/heart-context.ts buildSixFactorBodyContext",
        reason: `매트릭스에 영아 milestone 어휘 포함: ${String(e)}`,
      });
    }
  }

  // ── R012: 한자 ban 후처리 검증 (sample 텍스트로) ──
  const sampleHanjaCases = [
    "기운(인성)이 강하게 자리",
    "천간 병신합(天干 丙辛合)으로",
    "재성(財星)의 결",
  ];
  for (const sample of sampleHanjaCases) {
    const filtered = enforceHanjaBan(sample);
    if (filtered.includes("(") && /[一-鿿]/.test(filtered)) {
      violations.push({
        ruleId: "R012",
        source: "lib/text-postprocess.ts enforceHanjaBan",
        reason: `한자 ban 후처리가 패턴 누락: ${sample} → ${filtered}`,
        sampleText: sample,
      });
    }
  }

  // ── R030/R032: 차트-본문 정합 자동 교정 검증 ──
  const weakElemKor: Record<string, string> = { 목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물" };
  const weakKor = weakElemKor[seed.weakElement];
  if (weakKor) {
    const sampleText = `${weakKor}의 결이 강하게 솟구치는 결이 있습니다.`;
    const corrected = enforceChartConsistency(sampleText, seed);
    if (corrected.includes("강하게 솟구치")) {
      violations.push({
        ruleId: "R030",
        source: "lib/text-postprocess.ts enforceChartConsistency",
        reason: `약한 결 (${seed.weakElement}) 의 강 양상 묘사가 자동 교정 안 됨`,
        sampleText,
      });
    }
  }

  return violations;
}

/**
 * 새 규칙 추가 시 충돌 가능성 사전 검증.
 *
 * Step 1: 같은 어휘에 ban/require 양방향 있는지 검토
 * Step 2: 매트릭스 데이터가 새 ban 어휘 포함하는지 검증
 * Step 3: 페이지 scope 분리가 명확한지 확인
 *
 * 사용 예: 새 ban 어휘 추가 전에 호출 → 위반 발견 시 KNOWN_CONFLICTS 에 페어 추가 + resolution 작성.
 */
export function checkNewRuleConflicts(
  newRule: Rule,
  sampleSeed: ChildSeed,
): { conflicts: ConflictPair[]; violations: RuleViolation[]; safe: boolean } {
  const conflicts: ConflictPair[] = [];
  const violations: RuleViolation[] = [];

  // 1. 명시된 충돌 ID 검증
  if (newRule.conflictsWith) {
    for (const conflictId of newRule.conflictsWith) {
      const existing = CORE_RULES[conflictId];
      if (existing) {
        const knownPair = KNOWN_CONFLICTS.find(
          (p) => (p.a === newRule.id && p.b === conflictId) || (p.a === conflictId && p.b === newRule.id),
        );
        if (!knownPair) {
          conflicts.push({
            a: newRule.id,
            b: conflictId,
            description: `${newRule.description} ↔ ${existing.description}`,
            resolution: newRule.resolution ?? "(미정)",
            status: "open",
          });
        }
      }
    }
  }

  // 2. 시드 기반 검증
  const seedViolations = validateRulesAgainstSeed(sampleSeed);
  violations.push(...seedViolations);

  return {
    conflicts,
    violations,
    safe: conflicts.length === 0 && violations.length === 0,
  };
}

// ─── 카탈로그 통계 (런타임 자기 점검) ───────────────────────────────

export function getRulesCatalogStats() {
  const rules = Object.values(CORE_RULES);
  return {
    totalRules: rules.length,
    byType: {
      ban: rules.filter((r) => r.type === "ban").length,
      require: rules.filter((r) => r.type === "require").length,
      format: rules.filter((r) => r.type === "format").length,
    },
    byPriority: {
      "★★★": rules.filter((r) => r.priority === "★★★").length,
      "★★": rules.filter((r) => r.priority === "★★").length,
      "★": rules.filter((r) => r.priority === "★").length,
    },
    knownConflicts: KNOWN_CONFLICTS.length,
    resolvedConflicts: KNOWN_CONFLICTS.filter((c) => c.status === "resolved").length,
    monitoredConflicts: KNOWN_CONFLICTS.filter((c) => c.status === "monitored").length,
    openConflicts: KNOWN_CONFLICTS.filter((c) => c.status === "open").length,
  };
}
