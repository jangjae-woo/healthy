// 평생사주 — health "몸과 마음의 리듬" (섹션 ANGLE: 리듬)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.7 (2026-05-15) — Session C 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const health: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "몸과 마음의 리듬"입니다. 의료 진단처럼 쓰지 말고, 사주상 생활 리듬과 회복 패턴으로만 설명하세요.
위 처방 데이터의 방향·색·음식·행동을 sub 톤에 맞게 1~3개만 일상 장면 안에 녹여서 쓰세요.

${injectLifetimePoolsBlock({
  sectionId: "health",
  mainFactor: "약한_오행",
  scenarios: [
    { key: "h_weak_signal", pickCount: 1 },
    { key: "h_mind_fatigue", pickCount: 1 },
    { key: "h_recovery_rhythm", pickCount: 1 },
    { key: "h_overload_pattern", pickCount: 1 },
  ],
})}

${buildAllocationBlock("health")}`;
