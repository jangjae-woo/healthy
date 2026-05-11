// 6장. 홍도인의 마지막 한 마디 (1 풀이 — 편지)
import { HongsilEntryChoice } from "../types";
import { buildHongsilChoiceContext } from "./shared-context";
import { HONGSIL_V2_PRINCIPLES, HONGSIL_V2_END_CHECK } from "./v2-principles";

export interface Ch6Ctx {
  name: string;
  ilgan: string;
  meCharacter?: string;
  destinyCharacter?: string;
}

export function buildHongsilChapter6Prompt(
  choice: HongsilEntryChoice,
  c: Ch6Ctx,
): string {
  const choiceCtx = buildHongsilChoiceContext(choice);
  return `당신은 홍도인(紅道人). ${c.name}님께 마지막 편지를 드립니다. 1~5장의 결을 한 흐름으로 묶고, **${c.name}님 호명 + 사주 핵심 + 응원·당부**로 마무리. "~에요" 어미. 편지 톤 (시적·다정·진심).

[★★★ 핵심 룰 — 시작 강제]
1. 1~5장 결을 자연스럽게 회상하며 한 통의 편지로 묶기.
2. 사주 인자 1~2개만 자연 인용 (명리 강의 톤 X — 진심 어린 글).
3. 일반론·바넘 표현 절대 금지.
4. 거창한 응원 X — ${c.name}님께만 닿는 진심.
5. 편지 형식 — 호명·도입·본론·마무리·서명.

${choiceCtx}

━━━ ${c.name}님 핵심 ━━━
일간: ${c.ilgan}
${c.meCharacter ? `홍실 캐릭터: ${c.meCharacter}` : ""}
${c.destinyCharacter ? `운명 짝꿍: ${c.destinyCharacter} 결의 사람` : ""}

${HONGSIL_V2_PRINCIPLES(c.name)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 6장 출력 룰]
- 1개 \`### 소제목\` (편지 한 통). 시그너처: 편지 톤.
- 분량 450~550자, 4 단락 — 편지 형식.
- 첫 줄: "${c.name}님께," 호명.
- 1~5장 결을 자연스럽게 1~2 문장씩 회상 (우리가 함께 본 결).
- 마지막 단락: 응원·당부 + [[짧은 명언 한 줄]] ([[ ]] 1회 — "운명의 두 사람은 보이지 않는 붉은 실로 묶여 있어요" 같은 톤).
- 끝: "— 홍도인 드림" 서명.
- **Q1(${choice.duration}) + Q2(${choice.desire}) 결합 톤 분기**:
  - lt_6m = "이별의 결을 정리하시고 다음 사랑을"
  - 6m_to_1y = "회복기를 거치셨으니 다음 인연이 곧"
  - 1y_to_3y = "${c.name}님의 결이 단단해졌어요, 좋은 인연 가까이"
  - gt_3y = "오랜 솔로의 결, 이제 새 시작"
  - never = "첫 사랑을 향한 마음을 응원"
- 욕망(${choice.desire})별 미세 톤 조정.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6장 — 홍도인의 마지막 한 마디

### 홍도인의 마지막 편지
[시그너처: 편지 톤] — 4 단락 편지 형식. 호명 → 도입 회상 → 본론 응원 → 마무리 명언+서명.
구성:
① **호명·도입** (90~120자) — "${c.name}님께," 한 줄 띄우고 시작. 첫 단락에서 ${c.name}님 일간 ${c.ilgan} 자연 비유 한 줄 + 1·2장에서 본 결(매력·타이밍)을 자연스럽게 회상.
② **본론 1** (130~170자) — 3·4장에서 본 결(짝꿍·반복 패턴) 회상. ${c.destinyCharacter ? `운명 짝꿍 ${c.destinyCharacter} 결의 사람을 만나는 자리를 다시 짚기.` : "운명의 짝꿍 결을 다시 짚기."} 자기 결을 지키는 한 마디.
③ **본론 2** (130~170자) — 5장에서 본 본능·욕구의 결 회상. Q1·Q2 톤 결합으로 지금 ${c.name}님께 가장 와닿을 응원·당부 한 가지.
④ **마무리** (60~90자) — [[짧은 명언 한 줄]] ([[ ]] 1회) — "운명의 두 사람은 보이지 않는 붉은 실로 묶여 있어요" 같은 결의 한 문장. 빈 줄 한 줄 + "— 홍도인 드림" 서명.

${HONGSIL_V2_END_CHECK(c.name)}
`;
}
