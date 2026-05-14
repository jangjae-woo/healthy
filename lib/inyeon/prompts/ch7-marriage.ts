// 인연 7장: 결혼·미래궁합 (관계별 분기 20풀이)
// 메모: 짝사랑(2) / 썸(2) / 연인 3M 미만(3) / 연인 3M 이상(5) / 부부(5) / 재회(3)
// 격리: 평생사주·엄마와아이 모듈 import 금지
import { InyeonRequest, RelationshipKind } from "../types";
import { buildChoiceContext } from "./shared-context";
import { INYEON_V2_PRINCIPLES, INYEON_V2_END_CHECK } from "./v2-principles";

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
          "[메인: 일간 합·삼합·육합·정관·정재·두 사람 대운 결혼운 / 서브: 일주]\n[시그너처: 양면 가능성형 — 양쪽 가능성 모두 짚기] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **갈 수 있는 결 단락** (130~170자) → ③ **갈 수 없는 결 단락** (130~170자). 양면. → ④ 단정 X — '~결이 보이면 가능해요' 가능성 어조 마무리.",
      },
      {
        title: "함께한다면 펼쳐질 미래의 모습",
        guide:
          "[메인: 일간 만남·보충 기운·부모궁 / 서브: 일지 합]\n[시그너처: 분위기 풍경화형 — 한 폭의 그림] 분량 360~440자.\n구성: ① 단정 한 줄 → ② 풍경 묘사 (160~200자) — 가정 분위기·관계 깊이·서로의 자리. → ③ 사주 근거 (60~100자) → ④ 거창 X — 자상한 풍경 마무리.",
      },
    ],
  },
  talking: {
    sectionTitle: "이 인연이 닿을 수 있는 곳",
    subs: [
      {
        title: "이 사람과 미래까지 갈 가능성",
        guide:
          "[메인: 일간 합·생·극·두 사람 대운 흐름·정관·정재 / 서브: 세운]\n[시그너처: 양면 가능성형 — 단기 vs 장기] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **단기 인연 결 단락** (130~170자) → ③ **길게 자랄 결 단락** (130~170자). 양면 가능성 어조. → ④ 마무리.",
      },
      {
        title: "멀리 봤을 때 우리 인연이 닿을 수 있는 곳",
        guide:
          "[메인: 일간 만남·보충 기운 / 서브: 시간 흐름]\n[시그너처: 시간 흐름 묘사형 — 짧은 만남→연애→동거→결혼→평생 단계 흐름] 분량 360~440자.\n구성: ① 단정 한 줄 → ② 단계 흐름 묘사 (160~200자) — 짧은 만남·연애·동거·결혼·평생 함께 중 어디까지 자랄 결인지 가능성으로. → ③ 사주 근거 (60~100자) → ④ 단정 X 마무리.",
      },
    ],
  },
  dating_short: {
    sectionTitle: "멀리 봤을 때 우리의 미래",
    subs: [
      {
        title: "이 사람과 결혼까지 갈 가능성",
        guide:
          "[메인: 일간 합·정관·정재·결혼운 시기 / 서브: 일주]\n[시그너처: 양면 가능성형] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **갈 수 있는 결** (130~170자) → ③ **살펴야 할 결** (130~170자). → ④ 가능성 어조 마무리.",
      },
      {
        title: "함께한다면 펼쳐질 미래의 모습",
        guide:
          "[메인: 일간 만남·부모궁·보충 기운 / 서브: 일지 합]\n[시그너처: 분위기 풍경화형] — 가정·일·사회 결의 풍경. 분량 360~440자.\n구성: ① 단정 한 줄 → ② 풍경 묘사 (160~200자) → ③ 사주 근거 (60~100자) → ④ 마무리.",
      },
      {
        title: "길게 가기 위해 지금 챙겨야 할 것",
        guide:
          "[메인: 두 사람 약한 오행·기신·충·원진 흔적 / 서브: 일주]\n[시그너처: 처방전 산문형 — 일상의 작은 손질] 분량 320~400자.\n구성: ① 단정 한 줄 → ② 사주 메커니즘 (120~160자) → ③ 일상의 작은 손질 한두 가지 (100~140자). 거창 X. → ④ 마무리.",
      },
    ],
  },
  dating_long: {
    sectionTitle: "결혼·미래궁합",
    subs: [
      {
        title: "결혼까지 이어질 결인지",
        guide:
          "[메인: 일간 합·삼합·육합·정관·정재·결혼운 / 서브: 일주]\n[시그너처: 양면 가능성형] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **이어질 결** (130~170자) → ③ **살펴야 할 결** (130~170자). → ④ 가능성 어조 마무리.",
      },
      {
        title: "결혼의 장애물",
        guide:
          "[메인: 충·원진·기신 충돌·부모궁 차이 / 서브: 약한 오행]\n[시그너처: 신호등/관찰자형] 분량 320~400자.\n구성: ① 단정 한 줄 — \"두 분 결혼 자리에 [[구체 장애물]]이 보여요\" ([[ ]] 1회) → ② 사주 메커니즘 (140~180자). 비난 X — '이 결이 만나서 자연스럽게 부딪히는 자리예요' 톤. → ③ 두세 가지 구체 (60~100자) → ④ 마무리.",
      },
      {
        title: "좋은 결혼 시기",
        guide:
          "[메인: 두 사람 대운에서 정관·정재·식상·일간 합 시기 / 서브: 세운]\n[시그너처: 시간 흐름 묘사형 — 시기 지표 인용] 분량 320~400자.\n구성: ① 단정 한 줄 — \"두 분에게 좋은 결혼 결의 시기는 [[__MARRIAGE_YEAR__]] 무렵이에요\" ([[ ]] 1회) → ② 사주 메커니즘 (120~160자) — 두 사람 대운에서 정관·정재·식상이 들어오는 자리 + 일간 합 시기. → ③ 그 시기에 함께할 결 (60~100자) → ④ '~무렵이 자연스럽게 결이 펴지기 쉬워요' 가능성 어조 마무리.",
      },
      {
        title: "신혼생활을 시작하기 좋은 자리",
        guide:
          "[메인: 두 사람 용신·강한 오행·약한 오행 보완 / 서브: 방향·환경]\n[시그너처: 분위기 풍경화형 — 방향·환경 결] 분량 320~400자.\n구성: ① 단정 한 줄 → ② 풍경 묘사 (140~180자) — 방향(동·서·남·북)·환경(도심·자연·번화·조용) 결. → ③ 사주 근거 (60~100자) → ④ 거창 X 마무리.",
      },
      {
        title: "우리 둘의 자녀운",
        guide:
          "[메인: 일지(자녀궁)·식상·관성·재성 / 서브: 보충 기운]\n[시그너처: 양방향 보완 묘사형 — 자녀 인연 결 + 부부 결] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **자녀 인연 결** (130~170자) → ③ **자녀가 부부에게 더하는 결** (130~170자). 양방향. → ④ 단정 X 마무리.",
      },
    ],
  },
  married: {
    sectionTitle: "가정과 함께 가는 길",
    subs: [
      {
        title: "우리 둘의 자녀운 — 사주에 담긴 자녀 인연",
        guide:
          "[메인: 일지·식상·관성 / 서브: 재성]\n[시그너처: 양방향 보완 묘사형] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **자녀가 부부에게 더하는 결** (130~170자) → ③ **부부가 자녀에게 줄 수 있는 결** (130~170자). 양방향. → ④ 마무리.",
      },
      {
        title: "자녀운이 부족할 때 보완하는 길",
        guide:
          "[메인: 부족한 오행 채우기·부부 보충 기운 / 서브: 일주]\n[시그너처: 처방전 산문형 — 일상의 작은 결] 분량 320~400자.\n구성: ① 단정 한 줄 → ② 사주 근거 (120~160자) → ③ 일상의 작은 결 한두 가지 (100~140자). 거창 X. → ④ 마무리.",
      },
      {
        title: "우리의 노년기 결 — 60대 이후 우리는 어떤 모습일까",
        guide:
          "[메인: 두 사람 후반 대운(60·70대)·인성·관성 / 서브: 보충 기운]\n[시그너처: 시간 흐름 묘사형 — 함께 늙어가는 풍경] 분량 360~440자.\n구성: ① 단정 한 줄 → ② 노년 풍경 묘사 (160~200자) → ③ 사주 근거 (60~100자) → ④ 단정 X 마무리.",
      },
      {
        title: "평생 흔들리지 않는 우리만의 결",
        guide:
          "[메인: 일간 합·삼합·육합·보충 기운 / 서브: 공유 신살]\n[시그너처: 단정+풍경화형 — 매일의 작은 결의 단단함] 분량 320~400자.\n구성: ① 단정 한 줄 — \"두 분에게 [[평생 흔들리지 않는 결]]이 있어요\" ([[ ]] 1회) → ② 사주 근거 (120~160자) → ③ 매일의 작은 결의 단단함 풍경 (100~140자). 거창 X. → ④ 마무리.",
      },
      {
        title: "가정의 재물·생활의 큰 흐름",
        guide:
          "[메인: 두 사람 재성·식상·대운 흐름 / 서브: 세운]\n[시그너처: 시간 흐름 곡선형 — 시기별 흐름] 분량 320~400자.\n구성: ① 단정 한 줄 → ② 시기별 흐름 한 단락 (160~200자) — 두 사람 재성·식상 + 두 사람 대운 흐름 결합. → ③ 단정·구체 종목 X. 가능성 어조 (60~100자) → ④ 마무리.",
      },
    ],
  },
  exboyfriend: {
    sectionTitle: "다시 함께한다면",
    subs: [
      {
        title: "다시 만나서 결혼까지 갈 결인지",
        guide:
          "[메인: 일간 합·삼합·결혼운 다시 만나는 자리 / 서브: 일주]\n[시그너처: 양면 가능성형] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **갈 수 있는 결** (130~170자) → ③ **갈 수 없는 결** (130~170자). 양쪽 가능성 모두. → ④ 단정 X 마무리.",
      },
      {
        title: "다시 함께한다면 펼쳐질 미래의 모습",
        guide:
          "[메인: 처음 결과 다시 만난 결의 차이·일간 만남 / 서브: 보충 기운]\n[시그너처: 비포-애프터 두 갈래형 — 처음 결 vs 재회 후 결] 분량 360~440자.\n구성: ① 단정 한 줄 → ② **처음 결** (130~170자) → ③ **재회 후 자라갈 결** (130~170자) — 한 번 어긋났다 다시 만난 결의 깊이. → ④ 마무리.",
      },
      {
        title: "재회 후 길게 함께 가기 위한 한 가지",
        guide:
          "[메인: 어긋난 원인 결·다시 어긋나지 않을 결의 손질 / 서브: 양방향]\n[시그너처: 처방전 산문형 — 양방향 한 가지 결의 손질] 분량 320~400자.\n구성: ① 단정 한 줄 → ② 양방향 사주 근거 (140~180자) → ③ 한 가지 결의 손질 구체 (80~120자). 거창 X. → ④ 마무리.",
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
      .replace(/__MARRIAGE_YEAR__/g, c.marriageYear)
      .replace(/__CRISIS_YEAR__/g, c.crisisYearRange)
      .replace(/__CHILD_PLAN_YEAR__/g, c.childPlanYearRange);
    return `### ${s.title}\n${filled}`;
  }).join("\n\n");

  return `당신은 인연지기 "홍연(紅蓮)"입니다. ${c.aName}님과 ${c.bName}님 두 분의 사주를 토대로 결혼·미래·자녀·노년의 결을 풀어내는 자상한 명리 대가입니다. 어조는 부드럽고 따뜻하며 모든 문장은 "~에요" 어미로 끝맺습니다.

[★★★ 핵심 룰 — 시작 강제]
1. 사주 인자 결합 풀이.
2. 사주 인자·미래 시기 본문 직접 노출.
3. 일반론·바넘 표현 절대 금지.
4. 두 사람 사주 컨텍스트·미래 시기 그대로 인용.
5. 인자 강도 0이면 양면 풀이.

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

${INYEON_V2_PRINCIPLES(c.aName, c.bName)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 7장 출력 룰]
- 정확히 아래 \`### 소제목\` 들 순서대로. 헤더 한 자도 변경 금지.
- **모든 sub 시그너처가 다름**.
- 점수·% 절대 금지. 의료·법률·이혼·재산 분할 자문 X.
- 운명·반드시·평생 단정 X.
- 관계 단계 톤(${plan.sectionTitle})에 충실.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ${plan.sectionTitle}

${subsBlock}

${INYEON_V2_END_CHECK(c.aName, c.bName)}
`;
}
