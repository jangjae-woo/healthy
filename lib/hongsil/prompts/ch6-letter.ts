// 6장. 홍도인의 마지막 한 마디 (1 풀이 — 편지)
import { HongsilEntryChoice } from "../types";
import { buildHongsilChoiceContext } from "./shared-context";

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
  return `당신은 홍도인(紅道人). ${c.name}님께 마지막 편지를 드립니다. 1~5장의 결을 한 흐름으로 묶고, **사용자 호명 + 사주 핵심 + 응원·당부**로 마무리. "~에요" 어미. 편지 톤 (시적·다정·진심).

${choiceCtx}

━━━ ${c.name}님 핵심 ━━━
일간: ${c.ilgan}
${c.meCharacter ? `홍실 캐릭터: ${c.meCharacter}` : ""}
${c.destinyCharacter ? `운명 짝꿍: ${c.destinyCharacter} 결의 사람` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[6장 룰]
- 1개 \`### 소제목\` (편지 한 통).
- 분량 400~500자, 3~4 단락 — 편지 형식.
- 첫 줄: "${c.name}님께," 같은 호명.
- 1~5장 결을 자연스럽게 1~2 문장씩 회상 (우리가 본 결).
- 마지막 단락: 응원·당부 + 짧은 명언 한 줄 ("운명의 두 사람은 보이지 않는 붉은 실로 묶여 있어요" 같은 톤).
- 끝: "— 홍도인 드림" 서명.
- **Q1(${choice.duration}) + Q2(${choice.desire}) 결합 톤 분기**:
  - lt_6m = "이별의 결을 정리하시고 다음 사랑을"
  - 6m_to_1y = "회복기를 거치셨으니 다음 인연이 곧"
  - 1y_to_3y = "본인의 결이 단단해졌어요, 좋은 인연 가까이"
  - gt_3y = "오랜 솔로의 결, 이제 새 시작"
  - never = "첫 사랑을 향한 마음을 응원"
- 욕망(${choice.desire})별 미세 톤 조정.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 홍도인의 마지막 편지
편지 한 통.
`;
}
