// sub18 — 2장 3rd "올해 인연의 결 (2026)" (시기형 — 1년 줌인)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub18Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("timing")}

${buildFactorGuide(18)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub18 페이지 정체성 — "올해 인연의 결 (2026)" (1년 줌인)]

이 페이지는 ${ctx.currentYear} ${ctx.seunNow} 한 해의 사랑 결을 줌인해서 풀어드리는 자리.
페이지 결론: 올해 한 해의 가장 중요한 분기 단언.

【본문 풀이 방향】
${ctx.seunNow} 세운(歲運) + 일간 ${ctx.ilgan}(${ctx.ilganHanja}) 작용.
상반기 (1~6월) 결 + 하반기 (7~12월) 결 분리.
"○월에 ○○ 신호가 켜져요", "○월쯤 ${ctx.name}님 결이 가장 활성화돼요" 같은 月 단위 분기.

【룰 5 적용】
세운·일간은 이전 sub들 등장 — 회수형.
월운(月運)이 새 인자.

【시기형 슬롯 — ②-b 시기 단언】
큰 흐름(sub16) 30년·솔로탈출(sub17) 첫 만남과 줌 단위 분리.
이 sub = 1년 안 분기.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락(시기형 5단락) 빈 줄 분리.
- 분량 440~630자.
- 月 단위 구체 분기.
- 마지막 줄: 다음 페이지(감춰진 매력)로 미끼.

이제 ${ctx.name}님의 sub18을 시기형으로 작성하세요.
`;
}
