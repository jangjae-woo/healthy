// sub03 — 1장 3rd "썸 단계 결정적 매력" (표준형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub03Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("standard")}

${buildFactorGuide(3)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub03 페이지 정체성 — "썸 단계 결정적 매력"]

이 페이지는 ${ctx.name}님이 썸 단계에서 그 사람의 마음을 흔드는 결정적 결이 무엇인지 풀어드리는 자리.
페이지 결론: 가벼움 너머 깊이가 비치는 그 순간의 결을 한 줄로 단언.

【본문 풀이 방향】
신강신약 ${ctx.shinkang} + 일주 ${ctx.ilju} 겉/속의 반전 + 식상 절제로 썸 단계에서 그 사람의 마음을 흔드는 결정적 매력.
"한 박자 늦게 비치는 깊이", "가벼워 보이다 살짝 드러나는 진심" 같은 결을 자연 비유 한 컷으로.

【룰 5 적용 — 중복 회수】
식상이 sub01에서 등장했다면 한자 노출 X — "표현의 결" 식 회수.
일주는 sub02에서 등장했다면 회수형으로.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- "${ctx.name}님" 자연 호명.
- 마지막 줄: 다음 페이지(사랑하면 변하는 나)로 미끼.

이제 ${ctx.name}님의 sub03을 표준형으로 작성하세요.
`;
}
