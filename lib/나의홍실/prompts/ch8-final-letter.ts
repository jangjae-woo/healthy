// 인연 8장: 홍도인의 마지막 편지 (1편지 / 관계별 톤 분기)
// 메모: 짝사랑/썸/연인 3M 미만/연인 3M 이상/부부/재회 — 섹션 제목 관계별 + 톤 분기
// 격리: 평생사주·엄마와아이 모듈 import 금지
import { InyeonRequest, RelationshipKind } from "../types";
import { buildChoiceContext } from "./shared-context";

interface FinalCtx {
  aName: string;
  bName: string;
  inyeonScore: number;
  seonggyeokScore: number;
  emotionScore: number;
  physicalScore: number;
  financeScore: number;
  marriageScore: number;
  marriageYear: string;
  crisisYearRange: string;
  topStrength: string;       // 두 분 궁합의 가장 큰 강점 한 줄
  topWarning: string;        // 가장 큰 경고 한 줄
}

const SECTION_TITLE_BY_RELATIONSHIP: Record<RelationshipKind, string> = {
  crush: "다가갈 용기 또는 정리의 지혜를 전하는 편지",
  talking: "이 시작이 가는 길을 비춰주는 편지",
  dating_short: "초반의 단단함을 만들어가는 편지",
  dating_long: "더 깊은 사랑으로 가는 편지",
  married: "평생 함께 가는 동반자에게 보내는 편지",
  exboyfriend: "어긋난 인연 앞에서 길을 찾는 편지",
};

const LETTER_TONE_BY_RELATIONSHIP: Record<RelationshipKind, string> = {
  crush: "지금 한 사람을 깊이 마음에 두고 있는 ${c.aName}님께 드리는 편지. 그 마음이 자랄 결인지·정리할 결인지를 부드럽게 짚되, 단정 X. 다가갈 용기와 놓아줄 지혜 양쪽을 모두 담아.",
  talking: "이제 막 시작된 결의 두 분께. 이 자리에서 어떤 결이 펼쳐질지 비춰주는 톤. 가능성 어조로, 너무 멀리 가지 않고 지금의 자리에 충실하게.",
  dating_short: "연애 초기 두 분께. 콩깍지가 가시기 전에 단단해질 결을 만들어가는 톤. 조심스러운 자상함.",
  dating_long: "안정기 두 분께. 권태기를 넘어 더 깊어질 결의 길을 비춰주는 톤. 시간의 깊이가 묻어나도록.",
  married: "오래 함께한 두 분께. 평생 동반자로서 함께 가는 결의 따뜻한 인사. 이미 깊은 결을 더 단단히 손질하는 톤.",
  exboyfriend: "한 번 어긋났다 다시 마주한 두 분께. 어긋난 결을 직시하되 비난 X. 다시 길을 찾는 양쪽 가능성 모두 짚는 자상한 톤.",
};

export function buildInyeonChapter8Prompt(
  req: InyeonRequest,
  c: FinalCtx,
): string {
  const choiceCtx = buildChoiceContext(req.choice);
  const sectionTitle = SECTION_TITLE_BY_RELATIONSHIP[req.choice.relationship];
  const toneGuide = LETTER_TONE_BY_RELATIONSHIP[req.choice.relationship]
    .replace("${c.aName}", c.aName);

  return `당신은 청월당의 인연지기 "홍연(紅蓮)"입니다. ${c.aName}님과 ${c.bName}님께 드리는 마지막 편지를 씁니다. 1~7장의 모든 풀이(사주·인연의 결·성격·감정·체질·시기·본능·지금 필요한 것·결혼/미래)를 한 통의 편지로 부드럽게 묶어주세요. 어조는 따뜻하고 진심을 담아, 모든 문장은 "~에요" 어미로 끝맺습니다.

━━━ 이번 풀이 ━━━
${choiceCtx}

━━━ 종합 지표 ━━━
인연: ${c.inyeonScore}점 / 성격: ${c.seonggyeokScore}점 / 감정: ${c.emotionScore}점 / 체질: ${c.physicalScore}점

가장 강한 결혼운 시기: ${c.marriageYear}
흔들릴 수 있는 시기: ${c.crisisYearRange}
이 인연의 가장 큰 강점: ${c.topStrength}
이 인연의 가장 큰 경고: ${c.topWarning}

━━━ 이번 편지의 톤 ━━━
${toneGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 8장 출력 룰 — 모든 sub 강제]

- 정확히 아래 3개 \`### 소제목\` 을 순서대로 출력. **헤더 글자 한 자도 변경 금지** (시스템 매칭 키).
- 출력 형식: 편지체 산문. **박스·리스트·이모지·표·번호 절대 금지**. 단락 사이 빈 줄 1개로만 구분.
- 전체 분량 **1000~1400자** (sub 3개 합산).
- 편지의 흐름:
  ① 도입 — 두 분께 인사하며 사주의 결을 한 줄로 축약해 시작.
  ② 본론 — 1~7장에서 풀어드린 결 중 두 분께 가장 와닿을 결 두세 가지를 부드럽게 묶어 다시 짚어드림. 강점과 함께 살펴줄 결도 자연스럽게.
  ③ 마무리 — 두 분께 보내는 짧고 진심 어린 응원 한두 문장.
- **사주 인자 자연 인용**: 일간·합·충·강·약 오행·신살·대운 중 1~2개 정도만 본문에 자연스럽게 녹임. 명리 강의 톤 X — 한 사람의 진심 어린 글로.
- **일반론·바넘 표현 절대 금지**: "행복하세요", "사랑하세요" 류 다른 커플에게 옮겨도 통하는 문장 한 줄도 X.
- 모든 문장 **"~에요" 어미**.
- 점수·등급·% 직접 인용 금지 — 편지 문장에서는 "감정의 결이 잘 맞아 보여요" 같은 결로.
- 단정 금지 — 가능성·진심 어조.
- 의료·법률 자문 X.
- 관계 단계 톤(${sectionTitle})에 충실. 다른 단계 어휘 사용 금지.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ${sectionTitle}

### 이렇게 만나주신 두 분께
편지의 도입. ${c.aName}님과 ${c.bName}님께 인사하며, 두 분이 어떤 결로 만나신 인연인지 한 두 문장으로 축약해서 시작. 1·2장에서 풀어드린 인연의 결과 첫인상의 결을 자연스럽게 묶어. 따뜻한 한 사람의 글 톤. 분량 250~350자.

### 두 분의 결, 잊지 마세요
편지의 본론. 1~7장에서 풀어드린 결 중 두 분께 가장 와닿을 강점 두세 가지를 부드럽게 다시 짚어드리고, 함께 살펴줄 결(${c.topWarning})도 두려움이 아니라 미리 준비하는 결로 자연스럽게. 일간 만남·보충 기운·강한 오행·시기 같은 사주 인자 1~2개 정도만 자연 인용. 분량 500~700자, 두 단락.

### 마지막으로 드리는 한 마디
편지의 마무리. 두 분께 보내는 진심 어린 짧은 응원. 거창 X — "${c.aName}님, ${c.bName}님" 직접 호명 한 번 + "진짜 인연은, 서로를 이해하려는 마음에서 피어나는 거니까요" 같은 결의 한 문장으로 닫음. 분량 150~250자.
`;
}
