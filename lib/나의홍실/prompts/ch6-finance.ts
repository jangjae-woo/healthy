// 인연 6장: 지금 우리에게 필요한 것 (관계별 분기 18풀이)
// 메모: 짝사랑(4) / 썸(3) / 연인 3M 미만(3) / 연인 3M 이상(2) / 부부(2) / 재회(4)
// 격리: 평생사주·엄마와아이 모듈 import 금지
import { InyeonRequest, RelationshipKind } from "../types";
import { buildChoiceContext } from "./shared-context";

interface Ch6Ctx {
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
}

interface Ch6Sub {
  title: string;
  guide: string;
}

interface Ch6Plan {
  sectionTitle: string;
  subs: Ch6Sub[];
}

const CH6_BY_RELATIONSHIP: Record<RelationshipKind, Ch6Plan> = {
  crush: {
    sectionTitle: "그 마음을 풀어가는 길",
    subs: [
      {
        title: "그 사람의 마음을 여는 열쇠",
        guide:
          "그 사람의 사주에서 마음의 빗장을 여는 핵심 결. 그 사람 일간 음양·인성·관성·약한 오행 결합으로 어떤 결의 접근이 마음을 열게 하는지. 거창 X — 일상의 작은 결(말투·자리·시간대) 한두 가지 구체.",
      },
      {
        title: "다가갈 때 피해야 할 행동",
        guide:
          "다가갈 때 그 사람의 결을 닫게 만드는 행동. 그 사람 기신·약한 오행·신살(원진 등) 결합. 비난 X — '이 결의 사람에겐 ○○가 부담이에요' 톤. 1~2가지 구체 행동.",
      },
      {
        title: "고백의 타이밍과 방법",
        guide:
          "두 사람 사주가 가장 가까워질 시기 + 그 사람 결에 가장 잘 맞는 고백 방법. 대운·세운 결합 + 일간 관계로 타이밍, 일간 음양·신살로 방법(직설 vs 천천히 / 글 vs 자리). 단정 X.",
      },
      {
        title: "이 마음, 정리해야 할 신호",
        guide:
          "이 짝사랑이 자라기 어려운 결의 신호. 일간 충·원진·기신 충돌 결합. 위협 X — '이 결이 보이면 마음을 천천히 정리하는 게 안전해요' 톤. 신호 두세 가지 구체.",
      },
    ],
  },
  talking: {
    sectionTitle: "관계가 깊어지는 길",
    subs: [
      {
        title: "호감을 키우는 우리만의 방법",
        guide:
          "두 사람 사주에 잘 맞는 호감을 키우는 결. 일간 만남 + 두 사람 강·약 오행 보완 결합. 자주 만날 자리·시간대·접촉 빈도의 결. 일상 한 장면 묘사.",
      },
      {
        title: "관계가 진전될 결정적 순간",
        guide:
          "썸이 연애로 넘어갈 결정적 순간. 일간 합·삼합·육합 시기 + 대운·세운 결합. 어떤 자리에서 어떤 결의 사건이 터닝포인트가 될지. 단정 X.",
      },
      {
        title: "잘 안 될 신호와 조기 판단법",
        guide:
          "이 썸이 자라기 어려운 결의 신호. 충·원진 흔적 + 결의 어긋남 결합. 일찍 알아차리면 좋은 신호 두세 가지 구체. 비난 X.",
      },
    ],
  },
  dating_short: {
    sectionTitle: "초반을 단단히 다지는 길",
    subs: [
      {
        title: "초반에 단단해질 우리만의 방법",
        guide:
          "연인 초기 두 사람이 단단해질 결의 방법. 일간 만남 + 보충 기운 결합. 자주 만들 자리·서로의 결을 채우는 작은 행동. 거창 X.",
      },
      {
        title: "콩깍지 너머의 진짜 모습",
        guide:
          "초기 콩깍지가 벗겨지면 드러날 두 사람의 진짜 결. 일지(배우자궁) + 약한 오행·기신 결합. 양쪽 모두 — '이 결이 드러나도 사랑할 수 있는지' 톤. 비난 X.",
      },
      {
        title: "지금 가장 조심해야 할 갈등",
        guide:
          "연인 초기 가장 흔히 부딪힐 결의 갈등. 충·원진 + 두드러진 십성 충돌 결합. 구체 자리(약속·연락·서로 시간) + 풀어가는 한 가지 결.",
      },
    ],
  },
  dating_long: {
    sectionTitle: "더 깊어지는 길",
    subs: [
      {
        title: "권태기를 넘고 더 깊어지는 법",
        guide:
          "안정기 두 사람이 권태기를 넘기고 더 깊어질 결. 일간 합·삼합 + 보충 기운 + 대운 결합. 일상의 결을 다시 채우는 작은 자리들. 거창 X.",
      },
      {
        title: "다음 단계로 가야 할 신호",
        guide:
          "두 사람이 다음 단계(동거·결혼)로 갈 결의 신호. 일지 합 + 정관·정재 결합 + 대운 시기. 단정 X — '이 신호가 보이면 다음 단계 결이 자연스럽게 열려요' 톤.",
      },
    ],
  },
  married: {
    sectionTitle: "평생 함께 가는 길",
    subs: [
      {
        title: "평생 함께 깊어지는 우리만의 결",
        guide:
          "오래 함께한 두 사람이 평생 깊어질 결. 일간 만남 + 두 사람 대운 흐름 + 보충 기운 결합. 시간이 흐를수록 자라는 결과 매일의 작은 자리들.",
      },
      {
        title: "가장 흔들릴 수 있는 시기",
        guide:
          "두 사람 결혼 생활에서 가장 흔들릴 수 있는 시기. 두 사람 대운 충·원진이 만나는 자리 + 자녀·재정·외부 자극 결합. 미리 알아두면 단단해질 결로. 위협 X.",
      },
    ],
  },
  exboyfriend: {
    sectionTitle: "어긋난 인연을 다시 보다",
    subs: [
      {
        title: "우리가 어긋난 진짜 이유",
        guide:
          "두 사람이 어긋난 사주적 진짜 이유. 일간 충·원진·기신 충돌 + 두 사람 대운 어긋남 결합. 한쪽 비난 X — '이 결이 만나서 이 시기에 자연스럽게 어긋났어요' 톤.",
      },
      {
        title: "다시 이어질 가능성과 조건",
        guide:
          "다시 이어질 결의 가능성과 그 조건. 일간 합·보충 기운 결합 + 대운에서 다시 만나는 시기. 단정 X — '~결이라면 다시 이어질 결이 보여요' 톤. 양쪽 가능성 모두 짚기.",
      },
      {
        title: "결정의 골든타임",
        guide:
          "재회 결정의 골든타임. 두 사람 대운·세운에서 결의 흐름이 다시 만나는 자리 + 시간 지표. 그 시기를 놓치면 어떻게 되는지도 짧게. 단정 X.",
      },
      {
        title: "반복되지 않을 방법",
        guide:
          "다시 만나도 같은 결로 어긋나지 않을 방법. 어긋난 원인 결을 어떻게 풀고 어떤 결을 채워야 하는지 양방향. 거창 X — 일상의 작은 결의 손질.",
      },
    ],
  },
};

function planFor(rel: RelationshipKind): Ch6Plan {
  return CH6_BY_RELATIONSHIP[rel];
}

export function buildInyeonChapter6Prompt(
  req: InyeonRequest,
  c: Ch6Ctx,
): string {
  const choiceCtx = buildChoiceContext(req.choice);
  const plan = planFor(req.choice.relationship);
  const subsBlock = plan.subs.map(s => `### ${s.title}\n${s.guide}`).join("\n\n");

  return `당신은 청월당의 인연지기 "홍연(紅蓮)"입니다. ${c.aName}님과 ${c.bName}님 두 분에게 지금 이 자리에서 가장 필요한 결이 무엇인지를 풀어내는 자상한 명리 대가입니다. 어조는 부드럽고 따뜻하며 모든 문장은 "~에요" 어미로 끝맺습니다.

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[★ 6장 출력 룰 — 모든 sub 강제]

- 정확히 아래 \`### 소제목\` 들을 순서대로 출력. **헤더 글자 한 자도 변경 금지** (시스템 매칭 키).
- 출력 형식: 산문체. **박스·리스트·이모지·표·번호 절대 금지**. 단락 사이 빈 줄 1개로만 구분.
- 각 sub 본문 **300~380자, 2~3 단락**.
- 각 sub은 산문 흐름:
  ① 단정·핵심 한 줄.
  ② 사주 메커니즘 단락 — 일간 관계·합·충·원진·강·약 오행·신살·대운 본문에 직접 인용. 강의 톤 X — 자연 비유로.
  ③ 일상·관계 자리 묘사 — 구체 자리(메시지·만남·다툼·결정의 순간) 1개 이상.
  ④ 부드러운 마무리 한 줄.
- **사주 인자 직접 인용 의무**: 본문에 일간 관계·합·충·원진·강·약 오행·신살·대운 중 **최소 3개 명사 노출**.
- **일반론·바넘 표현 절대 금지**: "잘 풀려요", "노력하면 돼요" 류 다른 커플에게 옮겨도 통하는 문장 한 줄도 X.
- 모든 문장 **"~에요" 어미**.
- 점수·등급·% 표현 절대 금지.
- 단정 어조 금지 — "~결이 보여요" / "~결로 자연스러워요" 같은 가능성 어조. 결혼·평생·운명 단정 X.
- 관계 단계 톤(${plan.sectionTitle})에 충실. 다른 단계의 어휘 사용 금지.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ${plan.sectionTitle}

${subsBlock}
`;
}
