// 평생사주 — money2 "일과 직업의 방향" (섹션 ANGLE: 환경)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.6 (2026-05-15) — Session B 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const money2: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "일과 직업의 방향"입니다. 특정 직업명을 단정하지 말고, 어떤 일의 방식과 환경이 맞는지 설명하세요. 위 처방 데이터 중 방향·색·환경에 해당하는 것 1~2개를 일 환경 묘사에 자연스럽게 녹임 (예: "서쪽 창가 자리에서 차분히 정리하는 결").

[★★★ V2.1.9 사업·직장 분기 강화 (사용자 강조)]
"잘 맞는 일의 성향" sub (money2-1): 사업·직장 양면 분기 의무.
- 비겁·식상 강하고 관성 약하면 "사업·독립 결" 우세
- 관성·인성 강하면 "직장·조직 결" 우세
- 관인상생이나 양면형이면 두 결 모두 가능 + 어느 자리가 더 환한지 설명

"직업으로 빛나는 시기" sub (money2-4): 사업 도전 적기 / 직장 안정 자리 분리 의무.
- 사업 도전 적기 = 비겁·재성 대운이 자리하는 연령대 (구체)
- 직장 안정 자리 = 관성 대운 자리하는 연령대 (구체)
- 사업·직장 양면형 사주면 두 자리 모두 언급

${injectLifetimePoolsBlock({
  sectionId: "money2",
  mainFactor: "관성",
  scenarios: [
    { key: "m2_work_style", pickCount: 1 },
    { key: "m2_org_or_solo", pickCount: 1 },
    { key: "m2_avoid_environment", pickCount: 1 },
    { key: "m2_career_shine_period", pickCount: 1 },
  ],
})}

${buildAllocationBlock("money2")}

[중복 방지]
앞 장의 재능 이야기를 반복하지 말고, 여기서는 역할·환경·속도·책임 범위에 집중하세요.`;
