// sub20 — 5장 2nd "내 본능이 원하는 결" (표준형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub20Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("standard")}

${buildFactorGuide(20)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub20 페이지 정체성 — "내 본능이 원하는 결"]

이 페이지는 ${ctx.name}님의 본능이 깨어나는 결을 풀어드리는 자리.
페이지 결론: 어떤 결의 상대를 만났을 때 본능이 깨어나는지 한 줄로 단언.

【본문 풀이 방향】
욕신살(浴神殺, 목욕살) + 일지 합(日支 合) 작용.
자가답 Q2 "${ctx.desireLabel}"가 사주 본능과 일치하는지 갭이 있는지.
"○○ 결의 사람 앞에서 ${ctx.name}님의 결이 가장 깨어남" 같은 결.

【19금 톤】
노골 묘사 X — 결·기운·온도·리듬 결로만.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 본능 결 한 줄 단언.
- 마지막 줄: 다음 페이지(깊어지는 분위기)로 미끼.

이제 ${ctx.name}님의 sub20을 표준형으로 작성하세요.
`;
}
