// ════════════════════════════════════════════════════════════════════
// sub01 — 1장 1st "내 매력은?" (후킹형 + 룰 10 여자 캐릭터 직접 노출)
// 페이지 1/22 — 사이트 전체 첫 후킹
// ════════════════════════════════════════════════════════════════════

import { HONGSIL_V3_SYSTEM } from "../system";
import { getVariantInstruction } from "../variant-dispatcher";
import { buildFactorGuide } from "../factor-compression";
import {
  type HongsilV3Context,
  buildSajuContextBlock,
  buildCharacterBlock,
} from "../shared-context";

export function buildSub01Prompt(ctx: HongsilV3Context): string {
  return `${HONGSIL_V3_SYSTEM(ctx.name)}

${buildSajuContextBlock(ctx)}

${buildCharacterBlock(ctx, false)}

${getVariantInstruction("hooking")}

${buildFactorGuide(1)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ sub01 페이지 정체성 — "내 매력은?"]

이 페이지는 ${ctx.name}님이 받아보는 24p 풀이의 **첫 페이지**. 사이트 전체 첫 후킹.
페이지 결론: ${ctx.name}님의 평소 매력의 본질이 무엇인지 한 줄로 단언 + 캐릭터 단언으로 강한 첫인상.

【후킹형 캐릭터 단언 — 룰 10 적용】
본인 캐릭터: ${ctx.meCharacter.name}
캐릭터 내적 이미지: ${ctx.meCharacter.innerImage}
사주 결정 신호: ${ctx.meCharacter.signal}

→ Lead 첫 문장에 "${ctx.name}님은 [[${ctx.meCharacter.name}상의 결]]을 가진 분이에요" 형식 단언.
→ 두 번째 문장에 캐릭터 내적 이미지("${ctx.meCharacter.innerImage}") 결을 한 줄로 부연.
→ ${ctx.meCharacter.name} 이름은 Lead·Close에서만 노출. ②③④⑤ 슬롯엔 캐릭터 이름 X.

【본문 풀이 방향】
평소 ${ctx.name}님이 사람들 사이에서·혼자 있을 때 발산하는 매력의 본질.
사람들에게 자연스럽게 비치는 결을 자연 비유로 그려내고, 그 결이 일상의 어떤 자리에서 켜지는지 장면 2~3개로 보여드리세요.

【사주 인자 우선 노출】
${ctx.meCharacter.signal}의 1차 인자(예: 식상·도화살·양일간)를 ② 근거 단락에 한자 1회씩 자연 인용.
+ 본인의 일간(${ctx.ilgan}/${ctx.ilganHanja}) 자연 비유 — "${ctx.ilganNature}" — ② 또는 ③에 1회.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[★ 출력 형식]
- 본문만 출력. 슬롯 헤더(① Lead 등) 노출 X.
- 6단락. 빈 줄 1개로 시각 분리.
- 분량 합계 440~630자.
- [[ ${ctx.meCharacter.name}상의 결 ]] 같은 골드 강조는 Lead의 첫 단언 한 번만 사용 (두 번 이상 X).
- "${ctx.name}님" 직접 호명 본문에 자연스럽게 3~5회.
- 사주 인자 한자 괄호 표기는 ② 근거 단락에 자연스럽게 녹임.

[참고 — 예시 톤 (참조용. 그대로 복사 X)]
"${ctx.name}님은 [[${ctx.meCharacter.name}상의 결]]을 가진 분이에요. ${ctx.meCharacter.innerImage}, 자신의 마음을 그대로 표현하시는 분이지요.

그 결의 바탕에는 [1차 인자 한자] 자리한 까닭이 있어요. 여기에 [보강 인자]까지 함께 놓여 있어, 평소부터 [결의 핵심]의 결을 은은하게 발산하는 결이지요.

이 결을 자연에 빗대보면, [자연 비유 한 컷]처럼 굳이 손을 흔들지 않아도 시선이 모이고, 그 결을 따라 사람이 다가오는 분이에요.

이 결이 가장 잘 보이는 자리는 일상 곳곳이에요. [장면 1]. [장면 2]. [장면 3, 짧게].

다만 그 환한 결의 안쪽에는, 사랑할 때 누구보다 깊이 빠지는 [짧은 반전 결]도 함께 자리해 있어요.

그래서 ${ctx.name}님 매력의 본질은, ${ctx.meCharacter.name}상 [한 줄 시그너처]의 결이에요. 다만 이성 앞에서는 이 결이 또 다른 모습으로 켜져요 →"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이제 ${ctx.name}님의 첫 페이지를 후킹형으로 풀어 한 글 모양으로 작성하세요. 6단락 빈 줄 분리. 본문만.
`;
}
