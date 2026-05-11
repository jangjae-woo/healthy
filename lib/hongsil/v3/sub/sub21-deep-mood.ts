// sub21 — 5장 3rd "둘이 가장 깊어지는 분위기" (비유 강조형 + 매트릭스 백그라운드)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub21Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, true)}

${getVariantInstruction("metaphor-emphasis")}

${buildFactorGuide(21)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub21 페이지 정체성 — "둘이 가장 깊어지는 분위기" (비유 강조형)]

이 페이지는 ${ctx.name}님과 짝꿍 둘만의 자리에서 가장 깊어지는 분위기·시간을 풀어드리는 자리.
페이지 결론: 친밀의 결이 가장 뜨거워지는 자리·시간대 한 줄.

【본문 풀이 방향】
일지·용신·일간 음양의 결합으로 친밀 자리.
"늦은 밤보다 새벽이 짙어요" / "야외보다 작은 방이 깊어요" / "말보다 침묵이 결이 켜져요" 같은 자리·시간 결.

【룰 11 매트릭스 백그라운드】
페어 톤: ${ctx.pairLabel.tone}
→ 두 결의 친밀 결 방향. 캐릭터 이름 X.

【비유 강조형 — ③ 비유 앞으로】
Lead 직후 자연 비유 한 컷.

【룰 5 적용】
일지·용신·일간 음양 모두 이전 sub들 등장 — 회수형.

【19금 톤】
노골 묘사 X — 분위기·결만.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 5~6단락 빈 줄 분리.
- 분량 440~630자.
- 자리·시간대 구체.
- 마지막 줄: 다음 페이지(마지막 편지)로 미끼.

이제 ${ctx.name}님의 sub21을 비유 강조형으로 작성하세요.
`;
}
