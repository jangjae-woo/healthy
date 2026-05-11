// sub09 — 3장 3rd "짝꿍의 첫인상과 분위기" (표준형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub09Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("standard")}

${buildFactorGuide(9)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub09 페이지 정체성 — "짝꿍의 첫인상과 분위기"]

이 페이지는 ${ctx.name}님이 짝꿍을 처음 마주했을 때 보이는 시각 인상·분위기·말투·표정을 풀어드리는 자리.
페이지 결론: 짝꿍의 시각 첫인상의 결을 한 줄로 단언.

【본문 풀이 방향】
일지(${ctx.iljuHanja[1]}, 배우자궁) + ${ctx.gender === "여" ? "정관(正官)/편관(偏官)" : "정재(正財)/편재(偏財)"} + 용신(${ctx.yongsin}).
짝꿍의 직업군·말투·표정·분위기를 구체 결로 묘사.

【룰 5 적용】
일지(日支)는 sub08 등장 — 회수형.

【룰 10 — 캐릭터 단어 0회】
sub08에서 짝꿍 캐릭터 단언했지만, 이 페이지엔 캐릭터 이름 노출 X. 결만.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 짝꿍 외형 평가 X — 분위기·결만.
- 마지막 줄: 다음 페이지(운명 단서)로 미끼.

이제 ${ctx.name}님의 sub09를 표준형으로 작성하세요.
`;
}
