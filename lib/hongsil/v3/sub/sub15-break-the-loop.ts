// sub15 — 4장 3rd "이 굴레, 어떻게 벗어날까?" (경고형 — 해법 중심)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub15Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("warning")}

${buildFactorGuide(15)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub15 페이지 정체성 — "이 굴레, 어떻게 벗어날까?" (해법 중심)]

이 페이지는 sub13·14에서 짚어드린 굴레를 끊는 결의 해법을 풀어드리는 자리.
페이지 결론: 굴레 벗어나는 한 줄 처방.

【본문 풀이 방향】
용신(${ctx.yongsin}) + 인성(印星) 보강 + 희신(${ctx.huisin}) 활용.
"○○한 결의 자리에 자주 가세요", "○○를 의식하지 마세요", "○○ 결의 사람한테 마음 열어 보세요" 같은 행동 가이드.
이론이 아니라 일상에서 적용 가능한 결.

【경고형 슬롯 ⑤ 해법 메인】
이 sub는 해법이 본문의 절반. 구체 행동 2~3개 묘사.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 행동 가이드 구체.
- 마지막 줄: 다음 페이지(인생 큰 흐름)로 미끼.

이제 ${ctx.name}님의 sub15를 해법 중심으로 작성하세요.
`;
}
