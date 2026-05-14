import type { SajuAnalysis } from "../saju-calculator";

export type HongsilPlanScope = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

type Category = "self" | "expression" | "reality" | "standard" | "support";

type PlanCategory = Category | "balanced";

export interface HongsilInterpretationPlan {
  name: string;
  topElement: string;
  weakElement: string;
  shinkang: string;
  primaryCategory: PlanCategory;
  secondaryCategory: PlanCategory;
  openingTone: string;
  speedLens: string;
  expressionLens: string;
  conflictLens: string;
  recoveryLens: string;
}

const CATEGORY_TERMS: Record<Category, string[]> = {
  self: ["비견", "겁재"],
  expression: ["식신", "상관"],
  reality: ["정재", "편재"],
  standard: ["정관", "편관", "칠살"],
  support: ["정인", "편인", "효신"],
};

const CATEGORY_SCENE: Record<PlanCategory, string> = {
  self: "자기 리듬과 함께 가는 감각",
  expression: "마음을 표현하고 풀어내는 방식",
  reality: "현실감과 관계를 운영하는 감각",
  standard: "약속, 기준, 책임을 대하는 태도",
  support: "마음을 받아들이고 오래 생각하는 방식",
  balanced: "전체 균형에서 드러나는 관계의 결",
};

function elementRank(saju: SajuAnalysis, direction: "top" | "weak"): string {
  const entries = Object.entries(saju.elements as Record<string, number>)
    .filter(([, value]) => Number.isFinite(value));
  if (!entries.length) return "전체";
  entries.sort((a, b) => direction === "top" ? b[1] - a[1] : a[1] - b[1]);
  return entries[0]?.[0] ?? "전체";
}

function sipseongValues(saju: SajuAnalysis): string[] {
  const raw = saju.sipseong as unknown as Record<string, Record<string, string | undefined>>;
  return Object.values(raw)
    .flatMap((v) => Object.values(v ?? {}))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

function categoryRank(saju: SajuAnalysis): Array<[Category, number]> {
  const values = sipseongValues(saju);
  return (Object.keys(CATEGORY_TERMS) as Category[])
    .map((category) => {
      const count = values.reduce((sum, value) => (
        sum + CATEGORY_TERMS[category].filter((term) => value.includes(term)).length
      ), 0);
      return [category, count] as [Category, number];
    })
    .sort((a, b) => b[1] - a[1]);
}

function hasWeakSelf(shinkang: string): boolean {
  return ["신약", "태약", "극약"].some((word) => shinkang.includes(word));
}

function hasStrongSelf(shinkang: string): boolean {
  return ["신강", "태강", "극왕", "극강"].some((word) => shinkang.includes(word));
}

function openingTone(primary: PlanCategory, shinkang: string): string {
  if (hasWeakSelf(shinkang)) return "초반에는 상대의 반응을 읽고 속도를 맞추려는 결이 먼저 보입니다.";
  if (hasStrongSelf(shinkang)) return "초반에는 자기 기준과 호감의 방향이 비교적 선명하게 드러납니다.";
  if (primary === "expression") return "호감이 생기면 말투, 표정, 작은 표현에서 티가 납니다.";
  if (primary === "support") return "마음이 바로 튀어나오기보다 오래 관찰한 뒤 깊어지는 쪽입니다.";
  if (primary === "reality") return "좋아하는 마음도 실제 관계로 굴러갈 수 있는지를 같이 봅니다.";
  if (primary === "standard") return "가볍게 흔들리기보다 믿을 만한 태도와 선을 먼저 확인합니다.";
  return "관계 안에서 자기만의 속도와 상대의 온도를 함께 살핍니다.";
}

function speedLens(primary: PlanCategory, shinkang: string): string {
  if (hasWeakSelf(shinkang)) return "서두르기보다 확인하고 익숙해지는 시간이 있을 때 마음이 안정됩니다.";
  if (hasStrongSelf(shinkang)) return "끌림이 분명해지면 관계의 방향을 먼저 정하고 싶어질 수 있습니다.";
  if (primary === "standard") return "확실한 태도와 약속이 보일 때 관계 속도가 붙습니다.";
  if (primary === "expression") return "대화가 잘 풀리는 순간부터 마음의 속도가 빨라집니다.";
  return "편안한 반복과 자연스러운 만남 속에서 속도가 정리됩니다.";
}

function expressionLens(primary: PlanCategory, secondary: PlanCategory): string {
  if (primary === "expression" || secondary === "expression") return "표현은 말보다 분위기, 장난, 반응으로 먼저 살아납니다.";
  if (primary === "support" || secondary === "support") return "표현 전 생각이 길어져도 마음의 깊이는 쉽게 얕아지지 않습니다.";
  if (primary === "reality" || secondary === "reality") return "말보다 챙김, 일정, 현실적인 배려로 호감을 보여주는 편입니다.";
  if (primary === "standard" || secondary === "standard") return "가벼운 고백보다 책임 있는 태도로 마음을 증명하려 합니다.";
  return "표현은 상대와의 안전한 거리감이 만들어질수록 자연스럽게 풀립니다.";
}

function conflictLens(primary: PlanCategory, weakElement: string): string {
  if (primary === "self") return "각자의 방식이 강해질 때 고집 싸움처럼 보일 수 있어, 먼저 목적을 맞추는 게 중요합니다.";
  if (primary === "expression") return "말의 온도가 빨라질 때 오해가 생기기 쉬워, 감정보다 의도를 먼저 정리해야 합니다.";
  if (primary === "reality") return "현실 문제를 혼자 계산하려 할 때 서운함이 쌓일 수 있습니다.";
  if (primary === "standard") return "기준이 높아지는 순간 상대가 평가받는 느낌을 받을 수 있습니다.";
  if (primary === "support") return "생각을 오래 품고 있으면 상대는 거리감으로 받아들일 수 있습니다.";
  return `${weakElement}의 결이 약하게 드러나는 지점에서는 반응이 늦거나 과해질 수 있습니다.`;
}

function recoveryLens(primary: PlanCategory): string {
  if (primary === "self") return "회복은 누가 맞는지보다 서로의 방식을 인정하는 데서 시작됩니다.";
  if (primary === "expression") return "회복은 솔직한 한마디와 부드러운 농담으로 다시 열립니다.";
  if (primary === "reality") return "회복은 말보다 구체적인 약속과 실제 행동이 빠릅니다.";
  if (primary === "standard") return "회복은 믿을 수 있는 기준을 다시 세울 때 안정됩니다.";
  if (primary === "support") return "회복은 재촉하지 않고 마음을 정리할 시간을 줄 때 깊어집니다.";
  return "회복은 감정의 원인과 다음 행동을 함께 정리할 때 가장 자연스럽습니다.";
}

export function deriveHongsilInterpretationPlan(
  saju: SajuAnalysis,
  name: string,
): HongsilInterpretationPlan {
  const shinkang = (saju as SajuAnalysis & { shinkang?: string }).shinkang ?? "중화";
  const ranked = categoryRank(saju);
  const primaryCategory: PlanCategory = ranked[0]?.[1] ? ranked[0][0] : "balanced";
  const secondaryCategory: PlanCategory = ranked[1]?.[1] ? ranked[1][0] : "balanced";
  const topElement = elementRank(saju, "top");
  const weakElement = elementRank(saju, "weak");

  return {
    name,
    topElement,
    weakElement,
    shinkang,
    primaryCategory,
    secondaryCategory,
    openingTone: openingTone(primaryCategory, shinkang),
    speedLens: speedLens(primaryCategory, shinkang),
    expressionLens: expressionLens(primaryCategory, secondaryCategory),
    conflictLens: conflictLens(primaryCategory, weakElement),
    recoveryLens: recoveryLens(primaryCategory),
  };
}

const CHAPTER_POLICY: Record<HongsilPlanScope, string> = {
  ch1: "1장은 근거 신뢰 페이지입니다. '내 매력은?'은 한문 병기 근거 3~6개까지 허용하고, 나머지 소제목도 핵심 근거 1~3개를 짧게 회상할 수 있습니다. 단, 모든 한문·전문용어는 같은 문단에서 쉬운 자리 설명과 생활어 해석을 붙입니다.",
  ch2: "2장은 사랑의 타이밍 페이지입니다. 대운·세운 같은 계산값은 과다 반복하지 않되, 소제목마다 필요한 근거 1~2개는 한문 병기와 함께 허용합니다. 반드시 시기·속도·준비감으로 번역합니다.",
  ch3: "3장은 끌리는 사람과 관계 방향 페이지입니다. 배우자궁·일지·용신 등 핵심 근거 1~3개를 제한적으로 보여줄 수 있습니다. 단, 겉으로 보이는 태도와 만남 장면으로 바로 해석합니다.",
  ch4: "4장은 반복 패턴 페이지입니다. 한문 근거는 소제목당 0~2개만 허용합니다. 약한 축·기신·충돌 근거는 낙인 없이 반복되는 관계 장면으로 번역합니다.",
  ch5: "5장은 끌림과 본능 페이지입니다. 도화·홍염·식상 등 핵심 근거는 소제목당 0~2개만 허용하고, 온도, 거리, 반응, 표현 습관으로 바로 풀어씁니다.",
  ch6: "6장은 종합 편지 페이지입니다. 사주 근거를 길게 나열하지 않되, 필요하면 핵심 근거 1~2개만 짧게 회상하고 독자가 가져갈 문장으로 정리합니다.",
};

export function hongsilInterpretationPlanBlock(
  plan: HongsilInterpretationPlan,
  scope: HongsilPlanScope,
): string {
  return `
[★★★★★ 홍실 해석 기획 레이어 - 기존 챕터 지시보다 우선]
목표: 070 이미지처럼 한문 병기와 자리 설명을 섞어 근거감을 만들고, ${plan.name}님의 연애 장면으로 번역한다.

현재 챕터 정책:
- ${CHAPTER_POLICY[scope]}

전체 판단 요약:
- 중심 렌즈: ${CATEGORY_SCENE[plan.primaryCategory]}
- 보조 렌즈: ${CATEGORY_SCENE[plan.secondaryCategory]}
- 강하게 보이는 오행은 "${plan.topElement}", 약하게 드러나는 오행은 "${plan.weakElement}"로 보고 내부 근거로만 사용한다.
- 첫인상 톤: ${plan.openingTone}
- 관계 속도: ${plan.speedLens}
- 표현 방식: ${plan.expressionLens}
- 반복 패턴: ${plan.conflictLens}
- 회복 방향: ${plan.recoveryLens}

생활어 슬롯 운영:
- "내 매력은?"에서 사주 근거를 충분히 공개한 뒤, 이후 파트는 소제목마다 필요한 근거 1~3개만 짧게 회상하고 아래 슬롯의 생활어로 해석한다.
- "내 매력은?"은 예외다. 이후 소제목에서는 이미 등장한 한문 병기와 사주근거명을 다시 쓰지 않는다.
- 파트가 달라도 한 번 나온 한문 병기/사주근거명은 재사용 금지다. 새 근거가 필요하면 아직 쓰지 않은 근거만 1~3개 사용하고, 이미 쓴 근거는 생활어로만 이어간다.
- 같은 생활어 핵심 단어는 한 소제목 안에서 2회 이상 반복하지 않는다.
- "앞에서 본", "이 흐름", "이 결", "이 리듬", "이 구조" 같은 연결어를 반복하지 않는다. 필요하면 바로 장면으로 들어간다.
- 생활어도 중복되면 AI스럽게 보이므로, 각 소제목은 배정된 슬롯을 메인으로 쓰고 다른 슬롯은 보조로만 1회 허용한다.
- 슬롯 예시: 표현=말투·리액션·메시지 / 속도=텀·타이밍·기다림 / 기준=약속·선·일관성 / 끌림=시선·호기심·설렘 / 안정=편안함·지속성·생활 리듬 / 패턴=서운함·과열·거리두기 / 회복=다시 말하기·조율·선택

출력 제어:
- 한자 병기와 전문용어는 "금지"가 아니라 "근거감 형성용으로 제한 허용"한다.
- 각 소제목에는 한문/사주근거 1~3개를 쓸 수 있다. ch1 "내 매력은?"은 근거 공개 페이지이므로 3~6개까지 허용한다.
- 단, "내 매력은?" 이후에는 이미 한 번 나온 한문 병기/사주근거명을 반복하지 않는다. 반복할 필요가 있으면 그 근거를 직접 호출하지 말고 ${plan.name}님 사주에 맞는 일상 장면·행동·말투로 그 의미를 드러낸다.
- 한문·전문용어를 썼다면 반드시 같은 문단에서 자리 설명과 쉬운 해석을 붙인다. 예: "일간(나를 상징하는 기운)인 갑목(甲木)", "일지(마음 안쪽과 배우자궁을 보는 자리)".
- 같은 근거를 다시 말해야 할 때는 길게 반복하지 말고, 1~2개만 짧게 회상한 뒤 바로 생활 장면으로 들어간다.
- "신약한 사주", "비겁이 없어", "식상이 약해", "부족해서 보완", "혼자 짊어짐", "감정을 삭임", "벽처럼 느껴짐" 패턴은 금지한다.
- 자연 비유를 늘어놓지 말고, 독자가 실제 연애에서 겪는 말투·속도·반응·선택 장면으로 쓴다.

상징어 생활어 번역 룰:
- 명리 상징은 내부 해석에만 사용하고, 본문에는 일반 독자가 바로 이해할 수 있는 생활어로 바꾼다.
- 동물 상징 직접 출력 금지: 쥐, 소, 호랑이, 토끼, 용, 뱀, 말, 양, 원숭이, 닭, 개, 돼지.
- "닭처럼 정결하다", "용처럼 크다", "쥐처럼 빠르다"처럼 동물 성질을 사람 성향으로 바로 연결하지 않는다.
- 자연 상징도 ch2~ch6에서는 최소화한다. "이슬처럼", "큰 나무처럼", "강물처럼"보다 차분함, 기준감, 관찰력, 속도, 거리감, 표현 방식으로 쓴다.
- 예: "계유 일주라 닭처럼 정결하고 예리하다" 금지. "겉으로는 차분하지만, 가까워질수록 말투와 분위기 변화를 섬세하게 알아차리는 편"처럼 번역한다.
`;
}
