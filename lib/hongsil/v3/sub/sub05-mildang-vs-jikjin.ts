// sub05 — 1장 5th "밀당녀 vs 직진녀" (대비형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub05Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("contrast")}

${buildFactorGuide(5)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub05 페이지 정체성 — "밀당녀 vs 직진녀" (대비형)]

이 페이지는 사주 결과 자가답을 정면 대조해 ${ctx.name}님이 어떤 결인지 단언하는 자리.
페이지 결론: 사주가 보여주는 결 — 직진형 / 신중형 / 밀당형 / 거리형 / 수동형 / 균형형 중 사주 인자로 결정.

【본문 풀이 방향】
관성 + 일주 음양 + 비겁 + 신강신약 + 천을귀인 결합.
자가답 "Q3 사랑 스타일: ${ctx.styleLabel}"과 사주 결을 정면 대조.
일치하면 — "[[자가 인식과 사주 일치]] — 결단력 강한 결" 톤.
갭이 있으면 — "본인이 ○○이라 생각하지만 사주는 ○○. 그 갭이 ${ctx.name}님의 [[빈틈]]" 톤.

【대비형 슬롯】
②-A 단락: A 결 (예: 밀당의 결) 짧게 풀이
②-B 단락: B 결 (예: 직진의 결) 짧게 풀이
④ 본인 어디: 사주가 본인을 어느 결로 단정 + 자가답과 비교

【룰 5 적용】
식상은 sub01·03 등장 — 회수형.
신강신약은 sub03 등장 — 회수형.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- [[ ]] 골드 강조 1~2회 (갭 분석 핵심에서).
- 마지막 줄: 다음 페이지(끌리는 vs 잘 맞는)로 미끼.

이제 ${ctx.name}님의 sub05를 대비형으로 작성하세요.
`;
}
