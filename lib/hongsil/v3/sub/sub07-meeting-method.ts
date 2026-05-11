// sub07 — 3장 1st "내게 맞는 만남 방식 — 자만추 vs 인만추 vs 결정사" (대비형 3분류)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub07Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("contrast")}

${buildFactorGuide(7)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub07 페이지 정체성 — "자만추 vs 인만추 vs 결정사" (3분류 대비형)]

이 페이지는 ${ctx.name}님에게 가장 잘 맞는 만남 자리를 풀어드리는 자리.
페이지 결론: 3가지 자리 중 어느 쪽에서 인연이 가장 잘 다가오는지 단언.

【본문 풀이 방향】
자만추(自然滿) — 자연스러운 자리, 화개살(華蓋殺) 약·도화 활성·일상 사람 인연
인만추(人滿) — 지인 소개 자리, 인성 강·천을귀인·믿음 인연
결정사 — 결혼정보사 자리, 화개살 강·인성 깊음·계획 인연

${ctx.name}님 사주에서 어느 자리가 가장 잘 작동하는지 단언.

【룰 5 적용】
도화살은 sub01·02 등장 — 회수형.
홍염살도 sub02 등장 — 회수형.
화개살(華蓋殺) + 인성(印星) 새 인자로 노출.

【대비형 3분류】
②-A 자만추 짧게
②-B 인만추 짧게
②-C 결정사 짧게
④ 본인 위치 단언 — 3개 중 어느 자리

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 3분류 모두 짧게 짚되 본인 단언이 핵심.
- 마지막 줄: 다음 페이지(짝꿍 미리 보기)로 미끼.

이제 ${ctx.name}님의 sub07을 대비형으로 작성하세요.
`;
}
