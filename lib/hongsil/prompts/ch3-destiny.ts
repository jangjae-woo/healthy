// 3장. 내 짝꿍 미리 보기 (3 풀이)
import { HongsilEntryChoice } from "../types";
import { buildHongsilChoiceContext } from "./shared-context";

export interface Ch3Ctx {
  name: string;
  gender: "남" | "여";
  ilgan: string;
  dayBranch: string;
  ohaengWeak: string;
  sinsalLine: string;
  yongsin: string;
  // 짝꿍 캐릭터 (결정론 ideal 매칭)
  destinyCharacter?: string;
  destinyCharacterImage?: string;
}

export function buildHongsilChapter3Prompt(
  choice: HongsilEntryChoice,
  c: Ch3Ctx,
): string {
  const choiceCtx = buildHongsilChoiceContext(choice);
  const guanType = c.gender === "여" ? "정관·편관" : "정재·편재";
  return `당신은 홍도인(紅道人). ${c.name}님의 운명의 짝꿍을 풀어드리세요. "~에요" 어미.

${choiceCtx}

━━━ ${c.name}님 사주 ━━━
일간: ${c.ilgan} / 일지: ${c.dayBranch}
약한 오행: ${c.ohaengWeak}
신살: ${c.sinsalLine}
용신: ${c.yongsin}
배우자 십성(${c.gender === "여" ? "남자" : "여자"} 시점): ${guanType}
${c.destinyCharacter ? `[운명 짝꿍 결정론] ${c.name}님의 운명 짝꿍 = ${c.destinyCharacter} (${c.destinyCharacterImage}) — 본문 3장 ① 헤드라인에 캐릭터 이름 직접 명시. 변경 X.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3장 룰]
- 3개 \`### 소제목\` 순서대로.
- 산문체 280~360자. 사주 인자 직접 인용. 단정 X.
- 캐릭터 명시는 ① sub만. ②③은 톤만 반영.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 내 짝꿍은 누구일까?
12 캐릭터(여 6 + 남 6) 중 ${c.name}님의 운명 상대. ${c.destinyCharacter ?? "○○"} 같은 결의 사람을 헤드라인에 박음. 본인 일주 + 합 일주 + ${guanType} 십성 + 십성 균형 결합으로 짝꿍의 본질·매력 한 가지 풀이. 만났을 때 알아볼 결의 핵심 한 줄.

### 운명을 알아보는 단서
짝꿍이 다가올 때 결정적 사인. 합 시점 + 신살(천을귀인·역마·도화) + ${guanType} 활성 결합. **Q2(${choice.desire}) 욕망별 사인 강조** — 단단한 사랑이면 "꾸준히 다가오는 신호" / 짜릿하면 "강한 끌림 신호" 등. 일상 장면 1개로 묘사.

### 운명을 잡는 한 수
${c.name}님이 짝꿍 만났을 때 적극 어필·매력 발휘 행동. 본인 강점 십성(식상·재성·정관) + 용신 ${c.yongsin} + 합 시점 결합. **Q3(${choice.style}) 스타일별 행동 가이드** — 직진형 = 본인 그대로 어필 / 신중형 = 용기 한 번 / 거리형 = 이번엔 다가가기 등.
`;
}
