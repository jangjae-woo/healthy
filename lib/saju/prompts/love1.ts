// 평생사주 — love1 "사람과 인연" (섹션 ANGLE: 거리)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.6 (2026-05-15) — Session B 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const love1: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "사람과 인연"입니다. 연애, 가족, 가까운 사람과의 거리감을 통합해서 설명하세요. 위 처방 데이터의 방향·색·시간대 중 인연 자리와 어울리는 것 1개만 자연스럽게 녹임 (예: "남쪽 햇볕 들이는 자리에서 사람과 가까워지는 결").
결혼·인연 영역은 현재 결혼 상태 단정 X — 미혼·이혼·사별·결혼 유지 모든 케이스 가능하게 조건 어조로.

${injectLifetimePoolsBlock({
  sectionId: "love1",
  mainFactor: "일지",
  scenarios: [
    { key: "l1_attractive_type", pickCount: 1 },
    { key: "l1_comfort_distance", pickCount: 1 },
    { key: "l1_long_term_seat", pickCount: 1 },
    { key: "l1_repeated_pattern", pickCount: 1 },
  ],
})}

${buildAllocationBlock("love1")}

[중복 방지]
사람이 좋다, 배려한다는 표현만 반복하지 말고, 가까워지는 속도·표현 방식·거리감·안정 조건으로 나누세요.`;
