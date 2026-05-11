// sub06 — 1장 6th "내가 끌리는 사람 vs 나에게 잘 맞는 사람" (대비형 + 매트릭스 백그라운드)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock, buildCharacterBlock } from "../shared-context";

export function buildSub06Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, true)}

${getVariantInstruction("contrast")}

${buildFactorGuide(6)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub06 페이지 정체성 — "내가 끌리는 사람 vs 나에게 잘 맞는 사람"]

이 페이지는 ${ctx.name}님이 본능적으로 빠지는 결과 사주가 실제로 짚어주는 적합한 결의 차이를 풀어드리는 자리.
페이지 결론: 끌림과 적합이 같은지 다른지 단언. 같으면 축복, 다르면 갭 인식.

【본문 풀이 방향】
끌리는 결 = 편관(偏官) + 편재(偏財) — 자극·갈증·강한 인상
잘 맞는 결 = 정관(正官) + 정재(正財) — 안정·신뢰·지속

${ctx.name}님 사주에서 어느 쪽이 강한지 보고, 본인이 평소 빠지는 결과 사주의 적합 결을 정면 대조.

【룰 11 매트릭스 백그라운드】
페어 라벨: ${ctx.pairLabel.label}
페어 톤: ${ctx.pairLabel.tone}
→ 이 톤이 "적합" 결의 방향. 단, 캐릭터 이름 본문 노출 X.

【대비형 슬롯】
②-A 끌리는 결 (편관·편재 작용)
②-B 잘 맞는 결 (정관·정재 작용)
④ 본인 위치 단언 — 두 결 같은가 다른가

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 끌림 vs 적합 명확 대비.
- 마지막 줄: 다음 페이지(만남 방식)로 미끼.

이제 ${ctx.name}님의 sub06을 대비형으로 작성하세요.
`;
}
