// 평생사주 — personality2 "타고난 재능의 방향" (섹션 ANGLE: 능력)
import { buildHeader, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.5 (2026-05-15) — 청월당 풀 시스템 평생사주 적용
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const personality2: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "타고난 재능의 방향"입니다. 내부 룰은 강점, 재능, 일하는 방식, 공부와 성장 방식입니다.
앞 장에서 성격 근거를 읽은 독자에게 이어 말하듯 작성하고, 본문은 생활어 중심으로 풀어주세요.

${injectLifetimePoolsBlock({
  sectionId: "personality2",
  mainFactor: "식상",
  scenarios: [
    { key: "p2_natural_strength", pickCount: 1 },
    { key: "p2_learning_style", pickCount: 1 },
    { key: "p2_stage_environment", pickCount: 1 },
    { key: "p2_blocking_habit", pickCount: 1 },
  ],
})}

${buildAllocationBlock("personality2")}

[중복 방지]
"잘한다", "재능이 있다" 같은 칭찬을 반복하지 말고, 관찰력·정리력·추진력·설득력·버티는 힘처럼 서로 다른 생활어로 나누세요.`;
