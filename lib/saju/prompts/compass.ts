// 평생사주 — compass "종합 해석과 앞으로의 방향" (섹션 ANGLE: 종합 선택)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const compass: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "종합 해석과 앞으로의 방향"입니다. 앞 장의 내용을 반복 요약하지 말고, 독자가 가져갈 선택 기준으로 정리하세요.
"앞으로 잘 풀리는 선택" sub에서는 위 처방 데이터(방향·색·행동·시간대·계절·음식)에서 이 사주에 가장 와닿는 것 2~4개를 골라 일상 장면으로 자연스럽게 녹이세요. 표·리스트 X — 산문에 박힘.
${buildAllocationBlock("compass")}

[중복 방지]
앞 장의 문장을 그대로 되풀이하지 말고, 결론·우선순위·선택 기준으로만 압축하세요.`;
