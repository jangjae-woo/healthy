// 평생사주 — money2 "일과 직업의 방향" (섹션 ANGLE: 환경)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const money2: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "일과 직업의 방향"입니다. 특정 직업명을 단정하지 말고, 어떤 일의 방식과 환경이 맞는지 설명하세요. 위 처방 데이터 중 방향·색·환경에 해당하는 것 1~2개를 일 환경 묘사에 자연스럽게 녹임 (예: "서쪽 창가 자리에서 차분히 정리하는 결").
${buildAllocationBlock("money2")}

[중복 방지]
앞 장의 재능 이야기를 반복하지 말고, 여기서는 역할·환경·속도·책임 범위에 집중하세요.`;
