// sub04 — 1장 4th "사랑하면 변하는 나" (반전형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub04Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("twist")}

${buildFactorGuide(4)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub04 페이지 정체성 — "사랑하면 변하는 나" (반전형)]

이 페이지는 사랑 전 ${ctx.name}님과 사랑 후 ${ctx.name}님 두 결을 명시 대비하는 자리.
페이지 결론: 사랑에 빠지면 ${ctx.name}님이 어떤 결로 변하는지 한 줄로 단언.

【본문 풀이 방향】
일주 합·충 + 관성 + 비겁 + 일간 음양 변화로 사랑 전후의 결 변화.
자가답 "Q3 사랑 스타일: ${ctx.styleLabel}"이 평소엔 일상에서 어떻게 드러나는지 + 사랑하면 어떻게 변하는지.
자가답과 사주 결의 갭이 있으면 자연스럽게 드러나도록 (예: 평소 거리 두지만 사랑하면 적극으로).

【반전형 슬롯 — ⑤ 이면 메인 격상】
② 사랑 전 단락 (평소 결) + ②-c 사랑 후 단락 (변형 결) 두 갈래 명시.
두 단락은 빈 줄로 시각 분리.
"다만" 전환어로 두 결의 만남을 한 줄 마무리.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 사랑 전 / 사랑 후 두 단락 명확 대비.
- 마지막 줄: 다음 페이지(밀당녀 vs 직진녀)로 미끼.

이제 ${ctx.name}님의 sub04를 반전형으로 작성하세요.
`;
}
