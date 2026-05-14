// 자도인 V2 — 풀 주입 헬퍼
// 청월당 5사전 + 수미상관 회로를 sub 프롬프트에 박는 단일 진입점.
//
// 사용 위치: app/api/generate/route.ts 안 ch3Body / ch5Body / outroBody 템플릿 리터럴
// 호출 예: ${injectPoolsBlock({ chapterId: "ch3", subId: "calm_environment", mainFactor: "오행" })}

import { injectTimeResolution, type ChapterId } from "./chapter-time-resolution"
import { injectFactorAttribute, type FactorId, type ChapterDomain } from "./factor-attributes"
import { injectScenario, type ScenarioKey } from "./scenario-pool"
import { injectDialogPool, type DialogCategory } from "./dialog-pool"
import { injectCoreMetaphor, type Ilgan } from "./signature-metaphor"
import { injectMechanism, type MechanismKey, INSIGHT_4STEP_RULE } from "./mechanism-pool"
import { injectBodyPool } from "./body-pool"
import { injectFoodPool } from "./food-pool"

export { INSIGHT_4STEP_RULE }

export interface PoolBlockSpec {
  chapterId: ChapterId
  subId: string                    // 식별용 라벨 (디버그용)
  mainFactor: FactorId             // 본 sub의 메인 인자
  scenarios?: Array<{ key: ScenarioKey; pickCount?: number }>
  dialogs?: Array<{ category: DialogCategory; insertCount?: number }>
  mechanisms?: Array<{ key: MechanismKey; pickCount?: number }>
  includeBodyPool?: boolean        // ch7 sub1 전용
  includeFoodPool?: boolean        // ch7 sub2 전용
}

/**
 * sub 프롬프트에 박힐 풀 블록 한 덩어리 생성.
 * 시간 해상도 + 인자 속성 매트릭스 + 가정문 풀 + 대사 풀을 한 번에 주입.
 */
export function injectPoolsBlock(spec: PoolBlockSpec): string {
  const parts: string[] = []

  // 1. 시간 해상도
  parts.push(injectTimeResolution(spec.chapterId))

  // 2. 인자 속성 매트릭스 (ch1·outro는 일반 챕터 도메인 아님 → 스킵)
  if (spec.chapterId !== "ch1" && spec.chapterId !== "outro") {
    parts.push(injectFactorAttribute(spec.mainFactor, spec.chapterId as ChapterDomain))
  }

  // 3. 가정문 풀
  if (spec.scenarios) {
    for (const s of spec.scenarios) {
      parts.push(injectScenario(s.key, s.pickCount ?? 1))
    }
  }

  // 4. 대사 풀
  if (spec.dialogs) {
    for (const d of spec.dialogs) {
      parts.push(injectDialogPool(d.category, d.insertCount ?? 1))
    }
  }

  // 5. 메커니즘 풀 (깨달음 포인트용)
  if (spec.mechanisms) {
    for (const m of spec.mechanisms) {
      parts.push(injectMechanism(m.key, m.pickCount ?? 1))
    }
  }

  // 6. 신체 풀 (ch7 sub1)
  if (spec.includeBodyPool) {
    parts.push(injectBodyPool())
  }

  // 7. 음식 풀 (ch7 sub2)
  if (spec.includeFoodPool) {
    parts.push(injectFoodPool())
  }

  return parts.join("\n\n")
}

/**
 * outroBody 전용 풀 블록. 핵심 비유 회수 의무 룰 포함.
 */
export function injectOutroPoolsBlock(ilgan: Ilgan): string {
  return [
    injectTimeResolution("outro"),
    injectCoreMetaphor(ilgan),
  ].join("\n\n")
}
