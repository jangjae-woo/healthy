// sub13 — 4장 1st "자꾸 끌리는 가짜 인연" (경고형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub13Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("warning")}

${buildFactorGuide(13)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub13 페이지 정체성 — "자꾸 끌리는 가짜 인연" (경고형)]

이 페이지는 ${ctx.name}님이 자꾸 끌리지만 사실은 가짜인 결의 사람을 짚어드리는 자리.
페이지 결론: 가짜 인연의 결이 무엇인지 한 줄로 단언.

【본문 풀이 방향】
편관(偏官) 작용 + 통제/자유 결의 위험한 끌림 + 기신(忌神) 작용.
"잘해주는데 마음이 식음", "강한 사람한테 자꾸 빠짐", "결국 같은 패턴 반복" 같은 결.
경고지만 차분하게. 겁주는 톤 X.

【룰 5 적용】
정관은 sub05·06 등장 — 회수형.
편관은 sub06 등장 — 회수형 또는 새 강조.

【경고형 슬롯 ⑤ 해법 짧게】
"이 끌림은 ○○ 신호니까 ㅡㅡ 자리에서 한 번 멈춰 보세요" 패턴.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락 빈 줄 분리.
- 분량 440~630자.
- 톤 — 경고지만 차분. 친한 언니가 차분히 짚어주는 결.
- 마지막 줄: 다음 페이지(같은 결말 이유)로 미끼.

이제 ${ctx.name}님의 sub13을 경고형으로 작성하세요.
`;
}
