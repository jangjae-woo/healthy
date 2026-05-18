// 평생사주 — personality2 "타고난 재능의 방향" (섹션 ANGLE: 능력)
import { buildHeader, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const personality2: PromptFn = (d, ctx) => `${buildHeader(d, ctx)}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "타고난 재능의 방향"입니다. 내부 룰은 강점, 재능, 일하는 방식, 공부와 성장 방식입니다.
앞 장에서 성격 근거를 읽은 독자에게 이어 말하듯 작성하고, 본문은 생활어 중심으로 풀어주세요.
${buildAllocationBlock("personality2")}

[중복 방지]
"잘한다", "재능이 있다" 같은 칭찬을 반복하지 말고, 관찰력·정리력·추진력·설득력·버티는 힘처럼 서로 다른 생활어로 나누세요.`;
