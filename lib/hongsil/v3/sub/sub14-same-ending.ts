// sub14 — 4장 2nd "매번 같은 결말의 이유" (경고형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub14Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("warning")}

${buildFactorGuide(14)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub14 페이지 정체성 — "매번 같은 결말의 이유" (경고형)]

이 페이지는 ${ctx.name}님의 사주 빈자리가 만드는 반복 결말의 사주적 이유를 풀어드리는 자리.
페이지 결론: 같은 결말 반복의 핵심 이유 한 줄.

【본문 풀이 방향】
약한 십성 (${ctx.ohaengWeak} 부족 + 약한 십성) + 공망(空亡) + 일지 작용.
"항상 같은 사람한테 끌림", "끝낼 때 비슷한 모양으로", "그 다음 사람도 비슷" 같은 패턴.
${ctx.name}님 자가답 Q1 "${ctx.durationLabel}"이 사주적으로 어떻게 이어졌는지 자연 연결.

【룰 5 적용】
일지는 sub08·09 등장 — 회수형.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 톤 — 진단이지 비난 X. 따뜻하게 짚어줌.
- 마지막 줄: 다음 페이지(굴레 벗어나기)로 미끼.

이제 ${ctx.name}님의 sub14를 경고형으로 작성하세요.
`;
}
