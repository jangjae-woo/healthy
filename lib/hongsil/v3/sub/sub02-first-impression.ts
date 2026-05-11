// sub02 — 1장 2nd "이성이 처음 보는 나의 결" (표준형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub02Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("standard")}

${buildFactorGuide(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub02 페이지 정체성 — "이성이 처음 보는 나의 결"]

이 페이지는 ${ctx.name}님이 이성과 처음 마주한 그 1초의 시각 인상을 풀어드리는 자리.
페이지 결론: 이성 앞에 처음 섰을 때 ${ctx.name}님에게서 가장 먼저 비치는 결이 무엇인지 한 줄로 단언.

【본문 풀이 방향】
일주 ${ctx.ilju}(${ctx.iljuHanja}) 60갑자 결의 외형 인상 + 일간 음양 + 도화살·홍염살이 외형에 어떻게 비치는지.
"처음 봤을 때 표정·눈빛·분위기"의 결을 자연 비유 한 컷으로 그려내세요.

【룰 5 적용 — 중복 회수】
도화살이 sub01에서 이미 등장했다면 한자 노출 X. "앞서 말씀드린 매혹의 결" 식 회수.
홍염살은 이 페이지가 첫 등장 — 한자 1회 노출.

【룰 10 — 캐릭터 단어 0회】
옥순·현숙·정숙·순자·영숙·영자·영철·영식·영호·광수·영수·상철 단어 본문에 절대 X.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- "${ctx.name}님" 자연 호명 3~5회.
- 마지막 줄: 다음 페이지(썸 단계)로 자연스러운 미끼.

이제 ${ctx.name}님의 sub02를 표준형으로 작성하세요.
`;
}
