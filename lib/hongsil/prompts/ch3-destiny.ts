// 3장. 내 짝꿍 미리 보기 (3 풀이)
import { HongsilEntryChoice } from "../types";
import { buildHongsilChoiceContext } from "./shared-context";
import { HONGSIL_V2_PRINCIPLES, HONGSIL_V2_END_CHECK } from "./v2-principles";

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

[★★★ 핵심 룰 — 시작 강제]
1. 정통 자평명리 결합 풀이.
2. 사주 인자(일간·일지·합·${guanType}·용신·신살) 본문 직접 노출.
3. 일반론·바넘 표현 절대 금지.
4. ${c.name}님 사주 컨텍스트 그대로 인용.
5. 인자 강도 0이면 양면 풀이.

${choiceCtx}

━━━ ${c.name}님 사주 ━━━
일간: ${c.ilgan} / 일지: ${c.dayBranch}
약한 오행: ${c.ohaengWeak}
신살: ${c.sinsalLine}
용신: ${c.yongsin}
배우자 십성(${c.gender === "여" ? "남자" : "여자"} 시점): ${guanType}
${c.destinyCharacter ? `[운명 짝꿍 결정론] ${c.name}님의 운명 짝꿍 = ${c.destinyCharacter} (${c.destinyCharacterImage}) — 본문 3장 ① 헤드라인에 캐릭터 이름 직접 명시. 변경 X.` : ""}

${HONGSIL_V2_PRINCIPLES(c.name)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 3장 출력 룰]
- 3개 \`### 소제목\` 순서대로.
- 3 sub의 시그너처가 모두 다름.
- 캐릭터 명시는 ① sub만. ②③은 톤만 반영.
- 단정 X — "~결로 보여요" 가능성 어조.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3장 — 내 짝꿍 미리 보기

### 내 짝꿍은 누구일까?
[메인: 일주 합·${guanType} / 서브: 약한 오행·용신·일간 음양·신살]
[시그너처: 정체성 헤드라인+짝꿍 캐릭터형] — "${c.name}님의 운명 짝꿍은 [[${c.destinyCharacter ?? "○○"} 같은 결]]의 사람이에요" 캐치프레이즈 + 풀이. 분량 380~480자.
구성: ① 헤드라인 한 줄 ([[ ]] 1회) — 12 캐릭터(여 6 + 남 6) 중 결정론 분류된 ${c.destinyCharacter ?? "○○"} 명시. → ② 사주 메커니즘 (160~200자) — ${c.name}님 일주 + 합 일주 + ${guanType} 십성 + 약한 오행·용신·일간 음양 결합으로 짝꿍의 본질·매력 한 가지 풀이. ${guanType} 한자 1회 허용. → ③ 만났을 때 알아볼 결의 핵심 한 줄 묘사 (60~100자) — 그 사람의 첫인상·말투·자세 같은 구체. → ④ 부드러운 마무리. 결정론 분류 — 임의 변경 X.

### 운명을 알아보는 단서
[메인: 신살(천을귀인·역마살·도화살)·세운 / 서브: ${guanType} 활성·일간 음양]
※ ① sub에서 "일주 합" 메인으로 다뤘으므로 여기선 합 인자 메인으로 쓰지 말 것 — 신살·세운 흐름 중심.
[시그너처: 신호등/단서형] — Q2 욕망별 사인 분기 + 일상 한 장면 묘사. 분량 380~480자.
구성: ① 단정 한 줄 — "${c.name}님의 짝꿍이 다가올 때 결정적 사인은 [Q2 욕망별 톤]으로 와요"
**Q2(${choice.desire}) 욕망별 분기**:
- stable = "[[꾸준히 다가오는 신호]] — 약속을 지키는 결, 한결같은 결의 신호"
- intense = "[[강한 끌림 신호]] — 시선이 마주치는 순간 흔들리는 결"
- natural = "[[편안하게 흐르는 신호]] — 처음 본 자리에서 오래 알던 결"
- marriage = "[[안정과 약속의 신호]] — 미래를 함께 그리는 한 마디"
② 사주 메커니즘 (140~180자) — 합 시점(천간합·지지합) + 천을귀인(天乙貴人)·역마살·도화살 등 보유 신살(한자 1회) + ${guanType} 활성기 결합. → ③ 일상 한 장면 묘사 (80~120자) — 그 신호가 어떤 자리에서 오는지 구체 (직장·모임·우연한 자리·소개팅·SNS 등). → ④ "이 신호가 보이면 ${c.name}님의 결이 흔들릴 거예요" 마무리.

### 운명을 잡는 한 수
[메인: 본인 강점 십성·용신 / 서브: ${guanType}·합 시점·일간 음양·신살]
[시그너처: Q3 분기 처방전형] — 자가 답 스타일별 행동 가이드. 분량 380~480자.
구성: ① 단정 한 줄 — "${c.name}님이 운명을 잡는 한 수는 [Q3 스타일별 톤]이에요"
**Q3(${choice.style}) 스타일별 분기**:
- direct = "본인 그대로 어필 — 식상의 결을 솔직하게"
- careful = "용기 한 번 — 평소 거리감 한 발 좁히기"
- miyldang = "밀당을 줄이고 진심 한 마디 — 결정적 순간엔 직진"
- distant = "이번엔 [[먼저 다가가기]] — 거리감을 한 번 깨기"
- passive = "수동을 깨고 [[먼저 신호 보내기]] — 작은 메시지 한 통"
- balance = "결을 보며 자기 페이스 — 상황별 변주"
② 사주 메커니즘 (140~180자) — 본인 강점 십성(식상·재성·정관 중 강한 결) + 용신 ${c.yongsin} + 합 시점 + 일간 음양·신살 결합으로 한 수 풀이. → ③ 구체 행동 1~2가지 (80~120자) — 메시지·만남·자리 잡기 같은 일상 자리. 거창 X. → ④ "${c.name}님이 결을 보고 한 발 움직이는 그 순간이 운명의 자리예요" 마무리.

${HONGSIL_V2_END_CHECK(c.name)}
`;
}
