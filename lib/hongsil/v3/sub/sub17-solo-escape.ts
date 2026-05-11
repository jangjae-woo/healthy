// sub17 — 2장 2nd "솔로 탈출은 언제?" (시기형 — 가까운 미래)
import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import { type HongsilV3Context, buildSajuContextBlock } from "../shared-context";

export function buildSub17Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${getVariantInstruction("timing")}

${buildFactorGuide(17)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub17 페이지 정체성 — "솔로 탈출은 언제?" (시기형 — 가까운 미래)]

이 페이지는 ${ctx.name}님의 솔로가 끝나는 가까운 시점을 단언하는 자리.
페이지 결론: 첫 만남 시점이 언제인지 구체 시기로 단언.

【본문 풀이 방향】
가까운 대운·세운 + 역마살(驛馬殺) + 관성 진입 시기.
현재 ${ctx.age}세, 자가답 Q1 "${ctx.durationLabel}" 자연 인용.
"올해 ○월", "내년 ○월", "○○세 ○○운 진입할 즈음" 같은 구체 시기.

【룰 5 적용】
역마살은 sub10 등장 — 회수형.
세운은 sub04 등장 가능 — 회수형.

【시기형 슬롯 — ②-b 시기 단언 핵심】
큰 흐름(sub16)과 다름 — 가까운 미래 단위.
60대 이후 시기 절대 X.

【룰 10 — 캐릭터 단어 0회】

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 출력]
- 본문만. 슬롯 헤더 X.
- 6단락(시기형 5단락) 빈 줄 분리.
- 분량 440~630자.
- 구체 시기 명확. 모호한 "언젠가" X.
- 마지막 줄: 다음 페이지(2026 올해)로 미끼.

이제 ${ctx.name}님의 sub17을 시기형으로 작성하세요.
`;
}
