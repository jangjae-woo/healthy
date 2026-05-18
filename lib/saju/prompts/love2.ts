// 평생사주 — love2 "인연의 결 (세부)" (섹션 ANGLE: 선택)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const love2: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "인연의 결"입니다. love1(거리)에서 다룬 거리감과 겹치지 않게 — 여기선 "가까이 두면 좋은 사람·피해야 할 인연·관계가 깊어지는 계기" 선택의 결만 다루세요.
결혼·인연 영역은 현재 결혼 상태 단정 X — 미혼·이혼·사별·결혼 유지 모든 케이스 가능하게 조건 어조로.
${buildAllocationBlock("love2")}

[중복 방지]
love1의 거리감 결론을 반복하지 말고, 여기선 "어떤 사람을 곁에 두는가 / 어떤 신호를 피하는가 / 무엇이 관계를 깊게 하는가"로 분리하세요.`;
