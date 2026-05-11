// sub11 — 3장 5th "운명을 잡는 한 수" (표준형 + 매트릭스 백그라운드)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub11Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, true)}

${getVariantInstruction("standard")}

${buildFactorGuide(11)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub11 페이지 정체성 — "운명을 잡는 한 수"]

이 페이지는 ${ctx.name}님이 짝꿍을 만났을 때 인연을 놓치지 않는 결정적 행동 한 가지를 풀어드리는 자리.
페이지 결론: 잡는 한 수가 무엇인지 한 줄로 단언.

【본문 풀이 방향】
식상(食傷) 표현 + 재성(財星) + 일간 표현으로 결정적 한 수.
"먼저 한 박자 다가가기" / "기다리기" / "솔직하게 말하기" / "관찰하기" 중 사주가 짚어주는 결.

【룰 11 매트릭스 백그라운드】
페어 톤: ${ctx.pairLabel.tone}
→ 이 톤이 두 결의 결합이 깊어지는 방향. 캐릭터 이름 X.

【룰 5 적용】
식상·재성·일간 sub01·03·11 등장 가능 — 회수형 활용.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 결정적 한 수 명확.
- 마지막 줄: 다음 페이지(결혼 시기)로 미끼.

이제 ${ctx.name}님의 sub11을 표준형으로 작성하세요.
`;
}
