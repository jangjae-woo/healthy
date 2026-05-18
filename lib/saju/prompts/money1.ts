// 평생사주 — money1 "돈과 현실 감각" (섹션 ANGLE: 행동)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const money1: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "돈과 현실 감각"입니다. 재성만 단독으로 보지 말고 식상, 비겁, 관성, 전체 강약과 함께 판단하세요. 시기별 재산 흐름은 이 섹션의 첫 sub에서만 다루고, timeline 섹션은 일·관계·인생 흐름 중심으로 다루므로 시기 영역 중복을 피하세요.
${buildAllocationBlock("money1")}

[중복 방지]
돈을 "좋다/나쁘다"로 단정하지 말고, 시기·관리·새는 패턴·선택 기준으로 역할을 분리하세요. timeline1·timeline2 섹션의 시기 영역과 결론이 겹치지 않게 — money1은 "재산 흐름" / timeline1은 "일·관계·인생 흐름" 분리.`;
