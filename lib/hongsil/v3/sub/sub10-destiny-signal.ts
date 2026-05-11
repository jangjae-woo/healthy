// sub10 — 3장 4th "운명을 알아보는 단서" (표준형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub10Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("standard")}

${buildFactorGuide(10)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub10 페이지 정체성 — "운명을 알아보는 단서"]

이 페이지는 인연이 다가올 때 ${ctx.name}님의 일상에 켜지는 작은 신호를 풀어드리는 자리.
페이지 결론: 만남이 임박했을 때 ${ctx.name}님이 일상에서 느낄 결의 신호 단언.

【본문 풀이 방향】
천을귀인(天乙貴人) + 역마살(驛馬殺) + 신살 작용으로 일상 신호.
"갑자기 익숙한 길이 새로워 보임", "꿈에 비슷한 사람이 자주 등장", "이상하게 한 장소가 자꾸 떠오름" 같은 결.
${ctx.name}님 사주에 어떤 신살이 있고 그게 어떻게 신호로 작용하는지.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 일상 신호 2~3개 구체.
- 마지막 줄: 다음 페이지(잡는 한 수)로 미끼.

이제 ${ctx.name}님의 sub10을 표준형으로 작성하세요.
`;
}
