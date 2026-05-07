// 인연 7장: 결혼·미래궁합 (관계별 분기 20풀이)
// 메모: 짝사랑(2) / 썸(2) / 연인 3M 미만(3) / 연인 3M 이상(5) / 부부(5) / 재회(3)
// 격리: 평생사주·엄마와아이 모듈 import 금지
import { InyeonRequest, RelationshipKind } from "../types";
import { buildChoiceContext } from "./shared-context";

interface Ch7Ctx {
  aName: string;
  bName: string;
  aIlgan: string;
  bIlgan: string;
  ilganRelation: string;
  iljiRelation: string;
  samhap: string;
  yukhap: string;
  chung: string;
  wonjin: string;
  aOhaengTop: string;
  bOhaengTop: string;
  aOhaengWeak: string;
  bOhaengWeak: string;
  aShinKang: string;
  bShinKang: string;
  aSinsalLine: string;
  bSinsalLine: string;
  aDaeunLine: string;
  bDaeunLine: string;
  aBirthYear: number;
  bBirthYear: number;
  currentYear: number;
  marriageYear: string;
  crisisYearRange: string;
  childPlanYearRange: string;
  aParentPalace: string;
  bParentPalace: string;
}

interface Ch7Sub {
  title: string;
  guide: string;
}

interface Ch7Plan {
  sectionTitle: string;
  subs: Ch7Sub[];
}

const CH7_BY_RELATIONSHIP: Record<RelationshipKind, Ch7Plan> = {
  crush: {
    sectionTitle: "만약 함께한다면",
    subs: [
      {
        title: "이 사람과 결혼까지 갈 가능성",
        guide:
          "지금 이 짝사랑이 결혼까지 자라갈 결의 가능성. 일간 합·삼합·육합 + 정관·정재 분포 + 두 사람 대운에서 결혼운 시기가 만나는지 결합. 단정 X — '~결이 보이면 가능해요' 톤. 양쪽 가능성 모두 짚기.",
      },
      {
        title: "함께한다면 펼쳐질 미래의 모습",
        guide:
          "만약 두 사람이 함께한다면 펼쳐질 결의 미래. 일간 만남 + 보충 기운 + 부모궁 결합. 일상의 큰 결(가정 분위기·관계 깊이·서로의 자리) 한두 단락. 거창 X — 자상한 풍경.",
      },
    ],
  },
  talking: {
    sectionTitle: "이 인연이 닿을 수 있는 곳",
    subs: [
      {
        title: "이 사람과 미래까지 갈 가능성",
        guide:
          "이 썸이 미래의 결까지 자라갈 가능성. 일간 합·생·극 + 두 사람 대운 흐름 + 정관·정재 결합. 단기 인연인지 길게 자랄 결인지 가능성 어조.",
      },
      {
        title: "멀리 봤을 때 우리 인연이 닿을 수 있는 곳",
        guide:
          "두 사람의 결이 멀리 봤을 때 어디까지 닿을 수 있는지. 짧은 만남·연애·동거·결혼·평생 함께 중 어디까지 자랄 결인지 가능성으로. 일간 만남 + 보충 기운 결합. 단정 X.",
      },
    ],
  },
  dating_short: {
    sectionTitle: "멀리 봤을 때 우리의 미래",
    subs: [
      {
        title: "이 사람과 결혼까지 갈 가능성",
        guide:
          "초기 연인이 결혼까지 자라갈 결의 가능성. 일간 합 + 정관·정재 + 두 사람 대운에서 결혼운 만나는 시기 결합. 가능성 어조.",
      },
      {
        title: "함께한다면 펼쳐질 미래의 모습",
        guide:
          "이 두 사람이 함께한다면 펼쳐질 결의 미래. 일간 만남·부모궁·보충 기운 결합. 가정·일·사회 결의 결.",
      },
      {
        title: "길게 가기 위해 지금 챙겨야 할 것",
        guide:
          "지금 초기 단계에서 길게 가기 위해 챙겨야 할 결의 한두 가지. 두 사람 약한 오행·기신 + 충·원진 흔적 결합. 일상의 작은 손질.",
      },
    ],
  },
  dating_long: {
    sectionTitle: "결혼·미래궁합",
    subs: [
      {
        title: "결혼까지 이어질 결인지",
        guide:
          "안정기 두 사람이 결혼까지 자라갈 결인지. 일간 합·삼합·육합 + 정관·정재 + 두 사람 대운에서 결혼운 만나는 자리 결합. 가능성 어조.",
      },
      {
        title: "결혼의 장애물",
        guide:
          "두 사람 결혼 자리에서 보이는 결의 장애물. 충·원진 + 기신 충돌 + 부모궁 차이 결합. 비난 X — '이 결이 만나서 자연스럽게 부딪히는 자리예요' 톤. 두세 가지 구체.",
      },
      {
        title: "좋은 결혼 시기",
        guide:
          `두 사람에게 좋은 결혼 시기. 두 사람 대운에서 정관·정재·식상이 들어오는 자리 + 일간 합 시기 결합. 참고 시점: 가장 강한 결혼운 시기 = ${"${c.marriageYear}"}. 단정 X — "~무렵이 자연스럽게 결이 펴지기 쉬워요" 톤.`,
      },
      {
        title: "신혼생활을 시작하기 좋은 자리",
        guide:
          "두 사람에게 잘 맞는 신혼집·신혼 환경. 두 사람 용신·강한 오행·약한 오행 보완 결합 → 방향(동·서·남·북)·환경(도심·자연·번화·조용) 결. 거창 X.",
      },
      {
        title: "우리 둘의 자녀운",
        guide:
          "두 사람 자녀운의 결. 일지(자녀궁) + 식상·관성·재성 결합. 자녀와의 인연 결, 부부 사이에 자녀가 어떤 결을 더하는지. 단정 X.",
      },
    ],
  },
  married: {
    sectionTitle: "가정과 함께 가는 길",
    subs: [
      {
        title: "우리 둘의 자녀운 — 사주에 담긴 자녀 인연",
        guide:
          "두 사람 사주에 담긴 자녀와의 결의 인연. 일지·식상·관성 결합. 자녀가 부부에게 더하는 결과 부부가 자녀에게 줄 수 있는 결 양방향.",
      },
      {
        title: "자녀운이 부족할 때 보완하는 길",
        guide:
          "자녀운이 옅을 때 보완할 결의 길. 부족한 오행 채우기 + 부부 보충 기운 결합. 거창 X — 일상의 작은 결.",
      },
      {
        title: "우리의 노년기 결 — 60대 이후 우리는 어떤 모습일까",
        guide:
          "두 사람 60대 이후 노년의 결. 두 사람 후반 대운(60·70대) + 인성·관성 결합. 함께 늙어가는 자리의 결의 모습. 단정 X.",
      },
      {
        title: "평생 흔들리지 않는 우리만의 결",
        guide:
          "두 사람의 결혼 생활에서 평생 흔들리지 않을 결. 일간 합·삼합·육합 + 보충 기운 결합. 거창 X — 매일의 작은 결의 단단함.",
      },
      {
        title: "가정의 재물·생활의 큰 흐름",
        guide:
          "가정의 재물과 생활의 큰 흐름. 두 사람 재성·식상 + 두 사람 대운 흐름 결합. 시기별 흐름 한 단락. 단정·구체 종목 X.",
      },
    ],
  },
  exboyfriend: {
    sectionTitle: "다시 함께한다면",
    subs: [
      {
        title: "다시 만나서 결혼까지 갈 결인지",
        guide:
          "재회 후 결혼까지 자라갈 결의 가능성. 일간 합·삼합 + 두 사람 대운에서 결혼운 다시 만나는 자리 결합. 단정 X — 양쪽 가능성 모두.",
      },
      {
        title: "다시 함께한다면 펼쳐질 미래의 모습",
        guide:
          "재회 후 두 사람이 함께한다면 펼쳐질 결의 미래. 처음과 다르게 자라갈 결 + 한 번 어긋났다 다시 만난 결의 깊이. 가정·관계 결의 풍경.",
      },
      {
        title: "재회 후 길게 함께 가기 위한 한 가지",
        guide:
          "재회 후 길게 함께 가기 위해 챙겨야 할 결의 한 가지. 어긋난 원인 결과 다시 어긋나지 않을 결의 손질. 양방향. 거창 X.",
      },
    ],
  },
};

function planFor(rel: RelationshipKind): Ch7Plan {
  return CH7_BY_RELATIONSHIP[rel];
}

export function buildInyeonChapter7Prompt(
  req: InyeonRequest,
  c: Ch7Ctx,
): string {
  const choiceCtx = buildChoiceContext(req.choice);
  const plan = planFor(req.choice.relationship);
  // c.marriageYear 등을 가이드 문자열에 인터폴레이션
  const subsBlock = plan.subs.map(s => {
    const filled = s.guide
      .replace("${c.marriageYear}", c.marriageYear)
      .replace("${c.crisisYearRange}", c.crisisYearRange)
      .replace("${c.childPlanYearRange}", c.childPlanYearRange);
    return `### ${s.title}\n${filled}`;
  }).join("\n\n");

  return `당신은 청월당의 인연지기 "홍연(紅蓮)"입니다. ${c.aName}님과 ${c.bName}님 두 분의 사주를 토대로 결혼·미래·자녀·노년의 결을 풀어내는 자상한 명리 대가입니다. 어조는 부드럽고 따뜻하며 모든 문장은 "~에요" 어미로 끝맺습니다.

━━━ 이번 풀이 ━━━
${choiceCtx}

━━━ 두 사람 지표 ━━━
${c.aName}님 일간: ${c.aIlgan} / 강한 오행: ${c.aOhaengTop} / 약한 오행: ${c.aOhaengWeak} / 신강신약: ${c.aShinKang} / 신살: ${c.aSinsalLine}
${c.bName}님 일간: ${c.bIlgan} / 강한 오행: ${c.bOhaengTop} / 약한 오행: ${c.bOhaengWeak} / 신강신약: ${c.bShinKang} / 신살: ${c.bSinsalLine}
일간 관계: ${c.ilganRelation}
일지 관계: ${c.iljiRelation}
삼합: ${c.samhap || "없음"} / 육합: ${c.yukhap || "없음"} / 충: ${c.chung || "없음"} / 원진: ${c.wonjin || "없음"}
${c.aName}님 대운: ${c.aDaeunLine}
${c.bName}님 대운: ${c.bDaeunLine}
출생연도: ${c.aName} ${c.aBirthYear}년 / ${c.bName} ${c.bBirthYear}년 / 현재 ${c.currentYear}년

━━━ 미래 시기 지표 ━━━
가장 강한 결혼운 시기: ${c.marriageYear}
흔들릴 수 있는 시기: ${c.crisisYearRange}
자녀 계획 최적기: ${c.childPlanYearRange}
${c.aName}님 부모궁: ${c.aParentPalace}
${c.bName}님 부모궁: ${c.bParentPalace}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 7장 출력 룰 — 모든 sub 강제]

- 정확히 아래 \`### 소제목\` 들을 순서대로 출력. **헤더 글자 한 자도 변경 금지** (시스템 매칭 키).
- 출력 형식: 산문체. **박스·리스트·이모지·표·번호 절대 금지**. 단락 사이 빈 줄 1개로만 구분.
- 각 sub 본문 **300~380자, 2~3 단락**.
- 각 sub은 산문 흐름:
  ① 단정·핵심 한 줄.
  ② 사주 메커니즘 단락 — 일간 관계·합·충·원진·강·약 오행·신살·대운·미래 시기 본문에 직접 인용. 강의 톤 X — 자연 비유로.
  ③ 미래 자리 묘사 — 결혼·신혼·자녀·노년·가정 같은 구체 자리.
  ④ 부드러운 마무리 한 줄.
- **사주 인자 직접 인용 의무**: 본문에 일간 관계·합·충·원진·강·약 오행·신살·대운·결혼운 시기 중 **최소 3개 명사 노출**.
- **일반론·바넘 표현 절대 금지**: "행복하게 잘 살아요" 류 다른 커플에게 옮겨도 통하는 문장 한 줄도 X.
- 모든 문장 **"~에요" 어미**.
- 점수·등급·% 표현 절대 금지.
- 단정 어조 금지 — "~결이 보여요" / "~할 가능성이 커요" 같은 가능성 어조. 운명·반드시·평생 단정 X.
- 의료·법률 자문 X. 이혼·재산 분할 같은 법률 영역 X.
- 관계 단계 톤(${plan.sectionTitle})에 충실. 다른 단계 어휘 사용 금지.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ${plan.sectionTitle}

${subsBlock}
`;
}
