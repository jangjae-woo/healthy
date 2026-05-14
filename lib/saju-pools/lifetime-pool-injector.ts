// ⭐ V2.1.5 (2026-05-15) — 평생사주 풀 주입 헬퍼
//
// 자도인 pool-injector.ts의 평생사주판.
// 각 섹션 prompt(personality1.ts 등)에서 ${injectLifetimePoolsBlock({...})} 한 줄로 호출.

import { injectLifetimeTimeResolution, type LifetimeSectionId } from "./lifetime-time-resolution";
import { injectLifetimeFactorAttribute, type LifetimeFactorId } from "./lifetime-factor-attributes";
import { injectLifetimeScenario, type LifetimeScenarioKey } from "./lifetime-scenario-pool";

export interface LifetimePoolBlockSpec {
  sectionId: LifetimeSectionId;
  mainFactor: LifetimeFactorId;
  scenarios?: Array<{ key: LifetimeScenarioKey; pickCount?: number }>;
}

/**
 * 섹션 prompt에 박힐 풀 블록 한 덩어리 생성.
 * 시간 해상도 + 인자 속성 매트릭스 + 가정문 풀을 한 번에 주입.
 */
export function injectLifetimePoolsBlock(spec: LifetimePoolBlockSpec): string {
  const parts: string[] = [];

  // 1. 시간 해상도
  parts.push(injectLifetimeTimeResolution(spec.sectionId));

  // 2. 인자 속성 매트릭스
  parts.push(injectLifetimeFactorAttribute(spec.mainFactor, spec.sectionId));

  // 3. 가정문 풀
  if (spec.scenarios) {
    for (const s of spec.scenarios) {
      parts.push(injectLifetimeScenario(s.key, s.pickCount ?? 1));
    }
  }

  return parts.join("\n\n");
}
