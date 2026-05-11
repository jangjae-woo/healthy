// sub12 — 3장 6th "그 짝꿍과 결혼이 가까워지는 자리" (시기형 + 매트릭스 백그라운드)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub12Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, true)}

${getVariantInstruction("timing")}

${buildFactorGuide(12)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub12 페이지 정체성 — "그 짝꿍과 결혼이 가까워지는 자리" (시기형)]

이 페이지는 짝꿍과의 결합이 깊어져 결혼 자리까지 가까워지는 대운·시점을 단언하는 자리.
페이지 결론: 결혼 자리가 가까워지는 구체 대운·시기 한 줄.

【본문 풀이 방향】
관성 대운 + 재성 대운 + 일주 합 + 일지 합 시기 조합.
${ctx.daeunLine} 흐름 중 결혼 자리로 작동하는 대운 단언.

【시기형 슬롯 — ②-b 시기 단언】
구체 시기 표현: "30대 초반 ○○ 대운에", "○○세 ○○운에 진입할 즈음", "병오년(2026)부터 시작하는 결".
60대 이후 대운은 절대 인용 X.

【룰 11 매트릭스 백그라운드】
페어 톤: ${ctx.pairLabel.tone}
→ 두 결의 결합이 깊어지는 시기 톤. 캐릭터 이름 X.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락(또는 시기형 5단락) 빈 줄 분리.
- 분량 440~630자.
- 구체 대운·세 단위 시기 명확.
- 마지막 줄: 다음 페이지(가짜 인연)로 미끼.

이제 ${ctx.name}님의 sub12를 시기형으로 작성하세요.
`;
}
