// sub16 — 2장 1st "인생 전체, 사랑의 큰 흐름" (시기형)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub16Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("timing")}

${buildFactorGuide(16)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub16 페이지 정체성 — "인생 전체, 사랑의 큰 흐름" (시기형 — 30년 단위)]

이 페이지는 ${ctx.name}님 사주의 사랑이 인생 전체에서 어떤 결로 흘러왔고 흘러갈지 큰 그림을 풀어드리는 자리.
페이지 결론: 사주가 보여주는 사랑의 큰 흐름 한 줄.

【본문 풀이 방향】
대운(大運) 30년 흐름 — ${ctx.daeunLine}.
어느 대운 구간에 사랑 자리가 가장 잘 열렸고, 어느 구간에 멈췄는지.
60세 이후 대운 절대 인용 X. 30~50대 사이에서만 사랑 결 도출.
현재 ${ctx.age}세 ${ctx.daeunNow} 위치 기준 과거 회상 + 미래 전망.

【시기형 슬롯 — ②-b 시기 단언】
"20대 ○○ 대운엔 ○○ 결로 사랑이 흘렀고", "30대 ○○ 대운부터 ○○ 결의 사랑이 열려요" 패턴.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락(시기형 5~6단락) 빈 줄 분리.
- 분량 440~630자.
- 큰 흐름 단언 — 솔로 탈출(sub17)과 다름.
- 마지막 줄: 다음 페이지(솔로 탈출 시기)로 미끼.

이제 ${ctx.name}님의 sub16을 시기형으로 작성하세요.
`;
}
