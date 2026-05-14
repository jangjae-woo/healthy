// 평생사주 — timeline1 "시기별 흐름" (섹션 ANGLE: 시기 — 돈 제외, money1 담당)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.7 (2026-05-15) — Session C 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const timeline1: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "시기별 흐름"입니다. 대운과 세운을 활용하되 날짜 확정 예언처럼 말하지 말고, 흐름과 준비 방향으로 설명하세요.
★ **돈·재산 흐름은 money1 섹션에서 이미 다뤘으므로 이 섹션에선 절대 다루지 마세요**. 일·관계·인생 단계·건강·심리 등 비재무 영역만 집중.
2026년 흐름 sub에서는 위 처방 데이터의 방향·계절·시간대 중 올해 흐름과 맞는 1~2개만 자연스럽게 녹이세요.

${injectLifetimePoolsBlock({
  sectionId: "timeline1",
  mainFactor: "대운",
  scenarios: [
    { key: "t1_current_daewoon", pickCount: 1 },
    { key: "t1_2026_flow", pickCount: 1 },
    { key: "t1_future_flow", pickCount: 1 },
  ],
})}

${buildAllocationBlock("timeline1")}`;
