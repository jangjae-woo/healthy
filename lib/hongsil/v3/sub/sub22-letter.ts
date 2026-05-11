// sub22 — 6장 "마지막 편지" (편지형 + 후킹 종합 — 두 캐릭터)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub22Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, true)}

${getVariantInstruction("letter-with-hooking")}

${buildFactorGuide(22)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub22 페이지 정체성 — "마지막 편지" (편지형 + 후킹 종합)]

이 페이지는 홍도인이 ${ctx.name}님에게 보내는 시적 편지. 1~5장 풀이를 종합해 가슴에 새길 한 마디로 마무리.
페이지 결론: ${ctx.name}님이 평생 가슴에 새기고 살 한 결.

【편지형 + 후킹 종합 룰 10】
본문 어딘가에 "${ctx.meCharacter.name}" + "${ctx.destinyCharacter.name}" 두 캐릭터 이름 결합 한 줄 노출.
예: "${ctx.meCharacter.name}상의 결을 가진 분에게 ${ctx.destinyCharacter.name}상의 사람이 다가올 그 날을 위해"
캐릭터 이름은 이 종합 한 줄에서만. 그 외 본문엔 X.

【본문 흐름】
1) 시적 회상 도입 — 일간 ${ctx.ilgan}(${ctx.ilganHanja}, ${ctx.ilganNature}) 자연 비유로
2) 1~5장 결 회고 — 매력·시기·짝꿍·반복·본능 결 짧게 짚으며
3) 두 캐릭터 종합 한 줄 ★
4) 가슴에 새길 한 마디
5) 축복 — 따뜻한 마무리

【톤】
시적·따뜻. 단언 톤은 약해지고 위로·예언·통찰 결로.
"~에요" 유지하되 호흡 길게.

【두괄식 X】
편지형은 페이지 첫 줄에 결론 박지 않음 — 시적 도입부터.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 산문체 흐름. 빈 줄 자연 분리.
- 분량 500~620자.
- 두 캐릭터 결합 한 줄 노출 1회만.
- 마지막 줄: 축복으로 마무리. "→" 미끼 X.

이제 ${ctx.name}님의 sub22를 편지형으로 작성하세요.
`;
}
