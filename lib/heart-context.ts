// "우리 아이의 마음" 섹션 — 사주 기반 결정론 컨텍스트 빌더
// 약한 사주 종속 페이지를 대체하기 위한 사전 계산값 + 단계별 톤 가이드

import type { SajuAnalysis } from "./saju-calculator";
import type { AgeStage } from "./age-stage";

// ── 1. 십성 5분류 깊이 풀이 ────────────────────────────
const SIP_CORE: Record<string, { name: string; meaning: string }> = {
  비겁: { name: "자기를 세움", meaning: "자기 주관·존재감" },
  식상: { name: "표현·창의", meaning: "마음을 바깥으로 펼침" },
  재성: { name: "손에 잡으려는", meaning: "결과·물건·소유에 손이 가는 결" },
  관성: { name: "절제·규율", meaning: "기다림·책임" },
  인성: { name: "받아들임·사색", meaning: "흡수·성찰" },
};
const SIP_BY_STAGE: Record<AgeStage, Record<string, string>> = {
  infant: {
    비겁: "사주에 자기를 세우는 결이 자리 잡고 있어, 앞으로 자기 주관이 분명한 자녀로 자라날 결",
    식상: "사주에 표현·창의의 결이 있어, 앞으로 마음을 풍부히 펼치는 자녀로 자라날 결",
    재성: "사주에 결과를 챙기는 감각이 자리 잡고 있어, 앞으로 손에 잡히는 결과를 잘 챙기는 자녀로 자라날 결",
    관성: "사주에 절제·규율의 결이 있어, 앞으로 차분히 흐름을 따라가는 자녀로 자라날 결",
    인성: "사주에 사색·흡수의 결이 깊이 자리 잡고 있어, 앞으로 깊이 받아들이고 사색하는 자녀로 자라날 결",
  },
  preschool: {
    비겁: "내가 먼저 / 내가 골라 — 또래와 부딪히면서도 자기 자리 챙김",
    식상: "이야기·노래·놀이로 마음을 펼침 — 말과 표현이 활발",
    재성: "장난감·간식 욕심 — 좋아하는 걸 손에 쥐려 함",
    관성: "차례·규칙을 배우는 결 — 약속 지키기 시도",
    인성: "궁금증·질문이 많고 듣는 걸 좋아함",
  },
  elementary: {
    비겁: "자기 주관이 분명 — 친구 사이에서 리더가 되거나 옹고집",
    식상: "창작·발표 좋아함 — 만들고 표현하는 데 빛남",
    재성: "용돈·물건·결과를 챙기는 감각",
    관성: "숙제·규율을 잘 받아들임 — 책임감",
    인성: "학습·감수성 — 깊이 사색하고 흡수하는 결",
  },
  secondary: {
    비겁: "정체성을 세우는 시기 — 자기 소신",
    식상: "개성 표현·창작·SNS — 자기를 드러냄",
    재성: "실리·결과를 챙기는 결단력",
    관성: "책임·진로·자기조절",
    인성: "사색·자기성찰·진학 학습",
  },
};

export function buildSipseongDeepContext(
  counts: { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number },
  stage: AgeStage,
): string {
  const order: Array<keyof typeof counts> = ["비겁", "식상", "재성", "관성", "인성"];
  const sorted = [...order].sort((a, b) => counts[b] - counts[a]);
  const lines = sorted.map((k) => {
    const v = Math.round((counts[k] ?? 0) * 10) / 10;
    const strong = v >= 2 ? "강함" : v >= 1 ? "중간" : "약함";
    const stageLine = SIP_BY_STAGE[stage][k] ?? "";
    return `- ${k}(${SIP_CORE[k].name}) ${v} [${strong}] — ${stageLine}`;
  });
  return [
    "[다섯 색깔의 결 — 십성 5분류 사전 계산]",
    ...lines,
    `★ 가장 강한 1개와 가장 약한 1개를 본문에서 짚어주세요. 위 단계별 일상 묘사를 그대로 또는 가벼운 변주로 활용.`,
  ].join("\n");
}

// ── 1.5. 6요인 행동 결 — 결정론 본문 매트릭스 (충돌 차단용) ──────────
// 6요인 페이지(### 6가지 행동 결의 강도)와 다섯 색깔의 결 페이지(십성 5분류)가
// 같은 프롬프트 안에서 어휘 충돌 → AI 가 십성 풀이 어휘를 6요인 본문에 spillover.
// 이 매트릭스는 6요인 본문을 결정론으로 픽스해 spillover 차단.
const SIX_FACTOR_TOP1_DAILY: Record<string, Record<AgeStage, string>> = {
  활동성: {
    infant: "앞으로 자녀는 몸으로 세상을 탐색하며 에너지를 채우는 결을 보일 것이며, 새 자극에 빠르게 반응하는 활기찬 모습이 자주 드러날 것입니다.",
    preschool: "자녀는 뛰어다니고 새 놀이에 거침없이 뛰어드는 결을 자주 보이며, 정적인 활동보다 몸을 움직이는 환경에서 더 빛납니다.",
    elementary: "자녀는 활동·운동·새 도전에서 가장 빛나는 결을 보이며, 한 자리에 오래 앉아 있는 것보다 몸을 움직이는 환경에서 집중력이 살아납니다.",
    secondary: "자녀는 다양한 활동·도전·새 경험을 통해 자기 결을 키우며, 정적인 환경보다 능동적으로 움직이는 환경에서 자기다움을 발휘합니다.",
  },
  표현력: {
    infant: "앞으로 자녀는 자신의 마음을 풍부히 드러내는 결을 자주 보이며, 표정·몸짓·작은 소리로 마음을 환히 펼치는 모습이 두드러질 것입니다.",
    preschool: "자녀는 이야기·노래·놀이로 마음을 펼치는 결을 자주 보이며, 자신의 생각과 감정을 자연스럽게 말과 행동으로 드러냅니다.",
    elementary: "자녀는 발표·창작·이야기에서 가장 빛나며, 자신의 마음을 환히 드러내고 주변과 소통하는 데 거침없는 모습을 자주 보입니다.",
    secondary: "자녀는 자기 표현·창작·소통에서 자기다움을 발휘하며, 마음을 풍부히 드러내는 결로 또래·세상과 자연스럽게 연결됩니다.",
  },
  감수성: {
    infant: "앞으로 자녀는 작은 자극·소리·분위기에 깊이 반응하는 결을 보이며, 주변의 미묘한 변화도 섬세히 알아차리는 결이 두드러질 것입니다.",
    preschool: "자녀는 사람의 감정·분위기·이야기에 깊이 공감하는 결을 자주 보이며, 섬세한 감각으로 주변을 흡수합니다.",
    elementary: "자녀는 책·음악·예술·사람의 감정에 깊이 반응하는 결을 보이며, 풍부한 내면을 가꾸는 데 자연스럽게 끌립니다.",
    secondary: "자녀는 예술·문학·심리·사람의 결에 깊이 끌리며, 섬세한 감각과 풍부한 내면으로 자기 세계를 깊이 가꿉니다.",
  },
  끈기: {
    infant: "앞으로 자녀는 한 가지에 차분히 머무르는 결을 자주 보이며, 익숙한 자극·놀이를 반복하면서 깊이 익혀가는 모습이 두드러질 것입니다.",
    preschool: "자녀는 좋아하는 한 가지를 길게 파고드는 결을 보이며, 다양한 자극보다 한 영역을 깊이 익히는 데서 만족을 얻습니다.",
    elementary: "자녀는 좋아하는 한 영역을 꾸준히 파고드는 결을 보이며, 시간이 지날수록 깊이 있는 결과를 만들어내는 결이 두드러집니다.",
    secondary: "자녀는 한 분야에 길게 몰입하는 결로 자기 길을 닦으며, 빠른 성과보다 꾸준한 축적에서 자기다움을 발휘합니다.",
  },
  창의성: {
    infant: "앞으로 자녀는 같은 자극도 새롭게 변형하며 노는 결을 보이며, 정해진 방식보다 자기만의 방식으로 풀어내는 모습이 두드러질 것입니다.",
    preschool: "자녀는 놀이·그림·이야기에서 자기만의 방식으로 풀어내는 결을 자주 보이며, 정해진 틀보다 자유로운 변형에서 빛납니다.",
    elementary: "자녀는 새 아이디어·창작·문제 해결에서 자기만의 방식을 만들어내는 결을 보이며, 틀에 갇히지 않는 발상이 두드러집니다.",
    secondary: "자녀는 창작·기획·새 시도에서 자기다움을 발휘하며, 기존 방식을 자기만의 결로 재해석하는 데 자연스럽게 끌립니다.",
  },
  자기조절: {
    infant: "앞으로 자녀는 자기 페이스를 차분히 지키는 결을 자주 보이며, 강한 자극에도 한 박자 늦춰 반응하는 안정된 모습이 두드러질 것입니다.",
    preschool: "자녀는 차례·약속·기다림을 차분히 받아들이는 결을 보이며, 충동보다 절제된 흐름에서 더 빛납니다.",
    elementary: "자녀는 규칙·약속·자기 관리에서 안정된 결을 보이며, 차분히 자기 페이스를 지키는 모습이 일상에서 자주 드러납니다.",
    secondary: "자녀는 자기 관리·책임·진로에서 단단한 결을 보이며, 흔들리지 않는 페이스로 자기 길을 닦아갑니다.",
  },
};

// 옵션 E (사용자 모델): 직설 단점 + 보완 방법 2단 구조
// 미화·우회 X (이전 결함: "끈기 약 → 다양성 즐김" 같은 정반대 윤색 차단)
// 충격적·단정적 부정 X (R020 ban 의도 유지: "무능함" 같은 단어 금지)
// 부모 보완 방법 동반 (사용자 균형 모델)
const SIX_FACTOR_WEAK_PHRASE: Record<string, Record<AgeStage, string>> = {
  활동성: {
    infant: "에너지가 차분한 편 — 활동량이 적은 결입니다. 부모님께서 짧은 산책·놀이를 자주 권해주시면 활기가 자연스럽게 채워집니다.",
    preschool: "에너지가 차분한 편 — 활발한 놀이보다 정적인 활동을 선호합니다. 부모님께서 가벼운 신체 놀이를 함께 권해주시면 활동성이 자라납니다.",
    elementary: "에너지가 차분한 편 — 활동량이 적고 정적인 환경을 선호합니다. 부모님께서 운동·외출 기회를 정기적으로 마련해주시면 활기가 살아납니다.",
    secondary: "에너지가 차분한 편 — 활동적 도전보다 안정된 환경을 선호합니다. 부모님께서 새 경험·도전 기회를 부드럽게 권해주시면 활동성이 자라납니다.",
  },
  표현력: {
    infant: "마음을 밖으로 잘 드러내지 않는 편입니다. 부모님께서 자녀의 표정·몸짓도 함께 읽어주시고 작은 표현을 인정해주시면 마음이 자연스럽게 펼쳐집니다.",
    preschool: "감정·생각을 안에서 다지는 편 — 말로 펼치기보다 신중합니다. 부모님께서 자녀의 침묵을 기다려주시고 짧은 표현도 격려해주시면 표현력이 자라납니다.",
    elementary: "표현보다 관찰이 우선인 편 — 자기 생각을 잘 드러내지 않습니다. 부모님께서 일상에서 의견을 자연스럽게 묻고 들어주시면 표현이 자라납니다.",
    secondary: "마음을 안에서 다지는 편 — 외부 표현이 신중합니다. 부모님께서 자녀의 의견을 자주 물어주시고 결정에 반영해주시면 표현력이 자라납니다.",
  },
  감수성: {
    infant: "주변 미묘한 변화에 둔감한 편 — 강한 자극에도 흔들리지 않는 결입니다. 부모님께서 풍부한 자극(음악·자연·이야기)을 함께 나눠주시면 감수성이 자연스럽게 자라납니다.",
    preschool: "감정 변화에 휘둘리지 않는 차분한 편 — 섬세한 결을 잘 알아차리지 못합니다. 부모님께서 그림책·이야기로 다양한 감정을 함께 짚어주시면 감수성이 자라납니다.",
    elementary: "섬세한 자극보다 큰 그림·행동에 끌리는 편 — 미묘한 결을 놓치기 쉽습니다. 부모님께서 음악·예술·자연을 함께 즐기시면 감수성이 자라납니다.",
    secondary: "감성보다 실리·실용에 끌리는 편 — 미묘한 결의 가치를 잘 못 봅니다. 부모님께서 예술·문학·심리 같은 풍부한 자극을 함께 나눠주시면 감수성이 자라납니다.",
  },
  끈기: {
    infant: "꾸준함이 약한 편 — 한 가지에 오래 머물기보다 새 자극으로 옮겨가는 결입니다. 부모님께서 짧은 활동을 반복해주시고 마무리할 때마다 함께 인정해주시면, 자연스럽게 머무는 힘이 자라납니다.",
    preschool: "꾸준함이 약한 편 — 한 가지를 길게 파고들기보다 자주 바꾸는 결입니다. 부모님께서 짧은 단계로 나눠 끝맺음을 함께 챙겨주시면, 점점 길게 머무는 힘이 자라납니다.",
    elementary: "꾸준함이 약한 편 — 한 영역을 길게 파지 못하고 옮겨가는 결입니다. 부모님께서 작은 목표를 단계별로 함께 설정해주시면, 끈기가 자연스럽게 자라납니다.",
    secondary: "꾸준함이 약한 편 — 한 가지에 길게 묶이기 어려운 결입니다. 부모님께서 자녀의 페이스를 존중하되 작은 완성을 자주 인정해주시면, 끈기가 자라납니다.",
  },
  창의성: {
    infant: "익숙한 방식·반복된 자극이 더 편한 편 — 새 발상이 어려운 결입니다. 부모님께서 같은 놀이도 변형해보시고 작은 새 시도를 격려해주시면, 창의성이 자연스럽게 자라납니다.",
    preschool: "정해진 틀·익숙한 놀이가 편안한 편 — 자유로운 변형이 어렵습니다. 부모님께서 정답을 강요하지 않으시고 자녀만의 방식을 인정해주시면, 창의성이 자라납니다.",
    elementary: "새 발상보다 정리된 절차에서 빛나는 편 — 자유로운 발상이 어려운 결입니다. 부모님께서 다양한 시도를 격려해주시면, 창의성이 자라납니다.",
    secondary: "정립된 길을 따라가는 편 — 새 기획·시도가 어려운 결입니다. 부모님께서 자녀의 자유로운 의견을 자주 물어주시면, 창의성이 자라납니다.",
  },
  자기조절: {
    infant: "충동·욕구가 솔직한 편 — 자기 페이스 조율이 어려운 결입니다. 부모님께서 일관된 약속·규칙을 함께 지켜주시고 차분한 분위기를 마련해주시면, 자기조절이 자연스럽게 자라납니다.",
    preschool: "차례·기다림이 어려운 편 — 충동이 먼저 움직이는 결입니다. 부모님께서 짧은 기다림부터 함께 연습하고 성공을 인정해주시면, 자기조절이 자라납니다.",
    elementary: "자기 페이스 조율이 어려운 편 — 외부 자극에 쉽게 휘둘립니다. 부모님께서 일정·규칙을 함께 짚어주시면, 자기조절이 자라납니다.",
    secondary: "자기 관리에 외부 구조가 도움되는 편 — 충동이 강한 결입니다. 부모님께서 일관된 기준·약속을 함께 지켜주시면, 자기조절이 자라납니다.",
  },
};

const SIX_FACTOR_PARENT_GUIDE: Record<string, string> = {
  활동성: "부모님께서 자녀가 마음껏 움직이고 새 자극을 만날 수 있는 환경을 마련해주시면 이 결이 더 깊이 자라납니다.",
  표현력: "부모님께서 자녀의 이야기·표현을 끝까지 들어주시고 마음껏 드러낼 수 있는 환경을 마련해주시면 이 결이 더 깊이 자라납니다.",
  감수성: "부모님께서 자녀의 섬세한 감각을 인정해주시고 풍부한 자극(책·음악·자연)을 함께 나눠주시면 이 결이 더 깊이 자라납니다.",
  끈기: "부모님께서 자녀가 좋아하는 한 가지를 충분히 깊이 파고들 수 있는 시간을 보장해주시면 이 결이 더 깊이 자라납니다.",
  창의성: "부모님께서 자녀의 자유로운 발상을 인정해주시고 정해진 답을 강요하지 않으시면 이 결이 더 깊이 자라납니다.",
  자기조절: "부모님께서 자녀의 차분한 페이스를 존중해주시고 일관된 약속·규칙을 함께 지켜주시면 이 결이 더 깊이 자라납니다.",
};

const SIX_FACTOR_CHILD_OUTRO: Record<string, string> = {
  활동성: "활기찬 결로 세상과 만나는 자녀로 자라날 결입니다",
  표현력: "마음을 환히 드러내며 세상과 풍부히 소통하는 자녀로 자라날 결입니다",
  감수성: "섬세한 감각과 풍부한 내면으로 자기 결을 깊이 가꾸는 자녀로 자라날 결입니다",
  끈기: "한 분야를 차분히 깊이 파고드는 자녀로 자라날 결입니다",
  창의성: "자기만의 방식으로 세상을 새롭게 풀어내는 자녀로 자라날 결입니다",
  자기조절: "차분하고 단단한 페이스로 자기 길을 닦아가는 자녀로 자라날 결입니다",
};

// 영아(0~35개월) milestone 어휘 — 사주 풀이 본문에 결부 금지 (lib/age-stage.ts ban list 동기화)
// 결정론 매트릭스가 ban 검열 layer 를 우회하므로, 매트릭스 출력에 직접 검증 적용.
const FORBIDDEN_INFANT_MILESTONES = [
  "옹알이", "뒤집기", "기기", "잡고 일어서기", "걷기", "기어가기",
  "잠투정", "밤잠 설침", "보채기", "안아달라기", "안기다", "안기기", "안기는",
  "이유식", "젖", "기저귀", "낯가림", "분리불안", "눈맞춤",
  "까꿍", "박수", "손뼉", "흉내내기",
];

function validateSixFactorMilestoneBan(text: string, stage: AgeStage, contextLabel: string): void {
  if (stage !== "infant") return;
  for (const w of FORBIDDEN_INFANT_MILESTONES) {
    if (text.includes(w)) {
      throw new Error(`[6요인 매트릭스 milestone 위반] 영아 단계 ban 어휘 '${w}' 가 ${contextLabel} 에 포함됨. lib/heart-context.ts 매트릭스 점검 필요.`);
    }
  }
}

export function buildSixFactorBodyContext(
  sixFactor: Record<string, number>,
  stage: AgeStage,
  childName: string,
  childGender: string,
): string {
  const sorted = Object.entries(sixFactor).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).map(([k]) => k);
  const top1 = top3[0] ?? "표현력";
  const weakest = sorted[sorted.length - 1]?.[0] ?? "자기조절";
  const childLabel = `${childName}${childGender === "남" ? "군" : "양"}`;
  const top3Display = top3.join("·");

  const lineDaily = SIX_FACTOR_TOP1_DAILY[top1]?.[stage] ?? "";
  const weakPhrase = SIX_FACTOR_WEAK_PHRASE[weakest]?.[stage] ?? "";
  // 옵션 E: weakPhrase 가 이미 직설 단점 + 보완 방법 2단 구조라 그대로 사용 (이전 wrapper 제거)
  const lineWeak = weakPhrase ? `반면 ${weakPhrase}` : "";
  const lineParent = SIX_FACTOR_PARENT_GUIDE[top1] ?? "";
  const lineOutro = `${childLabel}은 ${SIX_FACTOR_CHILD_OUTRO[top1] ?? "자기 결을 차분히 키우는 자녀로 자라날 결입니다"}.`;

  const body = `${childLabel}의 가장 두드러진 행동 결은 **${top3Display}** 입니다. ${lineDaily} ${lineWeak} ${lineParent} ${lineOutro}`;

  // 영아 단계: milestone 어휘 자동 검증 (매트릭스 결정론이 ban 검열 우회 차단)
  validateSixFactorMilestoneBan(body, stage, `6요인 본문 (TOP1=${top1}, WEAK=${weakest})`);

  return [
    "[6가지 행동 결의 강도 — 결정론 본문 (그대로 출력 강제)]",
    "★★★ 아래 본문 한 단락을 정확히 그대로 출력하세요. AI 자유 풀이·변형·임의 추가·문장 재배치 절대 금지.",
    "★ 본문 어휘에는 차트 라벨(활동성·표현력·감수성·끈기·창의성·자기조절)만 등장 — 십성 풀이 어휘(자기를 세우는 기운, 표현하는 기운, 절제하는 기운 등) 절대 노출 X.",
    "",
    body,
  ].join("\n");
}

// ── 2. 신살(神煞) 카드 — 발달 단계별 의미 ──────────────────────
const SINSAL_BY_STAGE: Record<string, Record<AgeStage, string>> = {
  도화살: {
    infant: "사주에 매력의 결이 있어, 앞으로 사람들에게 자연스럽게 사랑받는 자녀로 자라날 결",
    preschool: "귀여움·매력으로 또래와 어른 모두에게 사랑받는 결",
    elementary: "친구들 사이에서 인기 있고 분위기를 살리는 결",
    secondary: "매력·인기·이성에 끌림을 받는 결",
  },
  역마살: {
    infant: "사주에 활동·이동의 결이 있어, 앞으로 새로운 경험을 즐기며 자라날 결",
    preschool: "뛰기·외출·새 환경을 좋아하는 결",
    elementary: "여행·이동·새 경험을 즐기는 결",
    secondary: "해외·이동·새 도전 좋아함 / 진로의 폭이 넓음",
  },
  천을귀인: {
    infant: "사주에 귀인의 결이 자리 잡고 있어, 앞으로 도와주는 어른과 인연이 닿는 자녀로 자라날 결",
    preschool: "어른·친척·선생님이 잘 챙겨주는 결",
    elementary: "좋은 선생님·친구가 결정적 순간에 도와주는 결",
    secondary: "인생 멘토·결정적 인연을 만나는 결",
  },
  문창귀인: {
    infant: "사주에 학문·문예의 결이 자리 잡고 있어, 앞으로 책·이야기·언어를 즐기는 자녀로 자라날 결",
    preschool: "책·이야기·언어를 즐기는 결",
    elementary: "학습·문예·글쓰기에 강점이 있는 결",
    secondary: "학문·진학·문예 분야에서 두각",
  },
  학당귀인: {
    infant: "사주에 학습의 결이 자리 잡고 있어, 앞으로 차분히 깊이 배우는 자녀로 자라날 결",
    preschool: "선생님 말씀을 잘 따라가는 결",
    elementary: "공부 자세가 차분하고 깊이 있는 결",
    secondary: "꾸준한 학습·진학에 강점",
  },
  복성귀인: {
    infant: "사주에 복덕의 결이 있어, 앞으로 행운이 따르는 자녀로 자라날 결",
    preschool: "행운이 따라오는 결",
    elementary: "행운·복이 따르는 결",
    secondary: "행운과 복덕이 함께하는 결",
  },
  태극귀인: {
    // 명리 정확 의미: 음양 조화·시작과 끝을 다스리는 큰 그릇·종합 통합 (꿰뚫어 보는 통찰 X — 그건 현침·문창의 의미)
    infant: "사주에 음양 조화·종합의 결이 있어, 앞으로 한 분야를 끝까지 가는 큰 그릇의 자녀로 자라날 결",
    preschool: "음양의 균형·시작과 끝을 짓는 결",
    elementary: "한 분야를 끝까지 마무리하는 종합 판단의 결",
    secondary: "음양 조화로 큰 그릇을 이루는 결",
  },
  화개살: {
    infant: "사주에 사색·예술의 결이 깊이 자리 잡고 있어, 앞으로 자기 결을 깊게 가꾸는 자녀로 자라날 결",
    preschool: "혼자 놀이·예술·종교적 분위기를 좋아함",
    elementary: "예술·철학·종교에 끌리는 결",
    secondary: "예술·철학·종교성이 두드러지는 결",
  },
  장성살: {
    infant: "사주에 강한 의지의 결이 자리 잡고 있어, 앞으로 단단한 결단력을 키워가는 자녀로 자라날 결",
    preschool: "리더 기질이 보이기 시작",
    elementary: "친구 사이에서 리더 역할",
    secondary: "리더십·통솔력의 결",
  },
};

export function buildSinsalContext(sinsal: string[], stage: AgeStage): string {
  if (!sinsal || sinsal.length === 0) {
    return "[타고난 신살의 결] (없음 — 평범하고 안정적인 사주)";
  }
  const lines = sinsal
    .filter((s) => SINSAL_BY_STAGE[s])
    .map((s) => `- **${s}** — ${SINSAL_BY_STAGE[s][stage]}`);
  return [
    "[타고난 신살의 결 — 사주 8글자에서 자동 추출]",
    ...(lines.length ? lines : sinsal.map((s) => `- ${s} (특수 결)`)),
    "★ 위 신살 중 가장 두드러진 1~2개를 본문에서 일상 장면으로 풀어주세요. 신살 한자 명칭은 본문에 노출 X — 의미만 풀어쓰기.",
  ].join("\n");
}

// ── 3. 합·충 자리 — 사주 8글자 내 만남과 부딪힘 ──────────────────
const BRANCH_HAP: Record<string, string[]> = {
  자: ["축"], 축: ["자"],
  인: ["해"], 해: ["인"],
  묘: ["술"], 술: ["묘"],
  진: ["유"], 유: ["진"],
  사: ["신"], 신: ["사"],
  오: ["미"], 미: ["오"],
};
const BRANCH_CHUNG: Record<string, string> = {
  자: "오", 오: "자",
  축: "미", 미: "축",
  인: "신", 신: "인",
  묘: "유", 유: "묘",
  진: "술", 술: "진",
  사: "해", 해: "사",
};
const BRANCH_TO_KOR: Record<string, string> = {
  자: "잔잔히 흐르는 결", 축: "묵직하게 받쳐주는 결",
  인: "뻗어가는 결", 묘: "부드럽게 자라는 결",
  진: "신비로운 결", 사: "지혜로운 불의 결",
  오: "활기찬 불의 결", 미: "포근한 흙의 결",
  신: "예리한 결단의 결", 유: "맑게 빛나는 결",
  술: "충직한 흙의 결", 해: "푸근한 깊이의 결",
};

export function buildMeetClashContext(saju: SajuAnalysis, stage: AgeStage): string {
  const branches = [
    saju.pillars.year?.branch,
    saju.pillars.month?.branch,
    saju.pillars.day?.branch,
    saju.pillars.hour?.branch,
  ].filter(Boolean) as string[];
  const meets: string[] = [];
  const clashes: string[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i], b = branches[j];
      if ((BRANCH_HAP[a] ?? []).includes(b)) {
        meets.push(`${BRANCH_TO_KOR[a]} ↔ ${BRANCH_TO_KOR[b]}`);
      }
      if (BRANCH_CHUNG[a] === b) {
        clashes.push(`${BRANCH_TO_KOR[a]} ⚡ ${BRANCH_TO_KOR[b]}`);
      }
    }
  }
  const stageHint = {
    infant: "영아: 사주적 안정 자리 / 자극 자리. 미래 예고 톤으로만 풀이 — 현재 행동(잠·울음·떼)에 사주 결을 결부시키지 말 것.",
    preschool: "유아: 어울리는 만남 = 재미·호감 / 부딪히는 자극 = 활동에서 부딪히는 결",
    elementary: "초등: 어울리는 만남 = 잘 통하는 친구·관계 / 부딪히는 자극 = 갈등·좌절 패턴",
    secondary: "중·고등: 어울리는 만남 = 깊은 인연 / 부딪히는 자극 = 정체성 흔들림 자리",
  }[stage];
  return [
    "[결이 만나고 부딪히는 자리 — 사주 8글자 내 분석]",
    `잘 어울리는 만남: ${meets.length ? meets.join(" / ") : "없음"}`,
    `부딪히는 자극: ${clashes.length ? clashes.join(" / ") : "없음"}`,
    `★ ${stageHint}`,
    `★ "충(冲)·합(合)" 한자 명칭은 본문에 노출 X. "잘 어울리는 자리·부딪히는 자리"로 풀어쓰기. "상극·충" 같은 강한 부정 한자도 절대 X.`,
  ].join("\n");
}

// ── 4. 용신 — 평생 빛나는 결 (단계별 부모/자녀 역할 비중) ──────────
const YONGSIN_HINT: Record<AgeStage, string> = {
  infant: "★ 영아 단계 — 용신은 부모가 환경으로 채워주는 결. 미래 예고 톤으로만 풀이 — '앞으로 ~한 결로 자랄 것입니다' 형태. 현재 행동 묘사 X.",
  preschool: "★ 유아 단계 — 부모 80% / 자녀 20%. 부모가 환경과 놀이로 채워주고 자녀는 첫 시도.",
  elementary: "★ 초등 단계 — 부모 50% / 자녀 50%. 함께 채워가는 결.",
  secondary: "★ 중·고등 단계 — 자녀 80% / 부모 20%. 자녀 스스로 채워가고 부모는 곁에서 응원.",
};
// 일간 → 오행 매핑 (천간 10간)
const STEM_TO_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const ELEM_KOR_LOCAL: Record<string, string> = {
  목: "나무의 결", 화: "불의 결", 토: "흙의 결",
  금: "쇠의 결", 수: "물의 결",
};

export function buildYongsinContext(
  yongsin: string,
  stage: AgeStage,
  sajuChild?: SajuAnalysis,
): string {
  const ilganElem = sajuChild ? STEM_TO_ELEM[sajuChild.ilgan] : "";
  const isYongsinSameAsIlgan = !!ilganElem && ilganElem === yongsin;
  const lines: string[] = [
    "[평생 빛나는 결 — 용신(用神, 사주에서 채워야 할 가장 중요한 결)]",
    `용신: ${yongsin || "특정 없음"}`,
  ];
  if (sajuChild) {
    lines.push(`자녀 일간 오행: ${ilganElem} (${ELEM_KOR_LOCAL[ilganElem] ?? ilganElem})`);
    if (isYongsinSameAsIlgan) {
      lines.push(
        `🔴 **일간 = 용신 케이스 (자녀 본질과 채워야 할 결이 같음)**:`,
        `- 자녀 본질도 ${ELEM_KOR_LOCAL[yongsin]}, 평생 채워가면 빛나는 결도 ${ELEM_KOR_LOCAL[yongsin]}.`,
        `- ✅ "이 결은 자녀의 타고난 본질과도 닿아 있으며" 같은 표현 OK.`,
        `- ✅ 권장 톤: "본질이 곧 빛내야 할 결" / "타고난 결을 더 강화하는".`,
      );
    } else {
      lines.push(
        `🔴 **일간 ≠ 용신 케이스 (자녀 본질과 채워야 할 결이 다름)**:`,
        `- 자녀 본질: ${ELEM_KOR_LOCAL[ilganElem]} / 평생 채워가면 빛나는 결: ${ELEM_KOR_LOCAL[yongsin]}.`,
        `- ❌ **절대 금지**: "본질과 닿아 있다", "타고난 본질과 통한다" 같은 본질-용신 동일시 표현 (사주에 모순).`,
        `- ✅ **권장 형식**: "자녀의 타고난 본질은 ${ELEM_KOR_LOCAL[ilganElem]}이지만, 평생 채워가면 빛나는 한 결은 ${ELEM_KOR_LOCAL[yongsin]}입니다. 본질의 ${ELEM_KOR_LOCAL[ilganElem]}이 ${ELEM_KOR_LOCAL[yongsin]}을 만나면..." 형태로 두 결을 분명히 구분.`,
      );
    }
  }
  lines.push(
    YONGSIN_HINT[stage],
    "★ '용신' 한자 단어는 본문에 노출 X. '평생 채워주면 빛나는 한 결'로 풀어쓰기.",
    "★ 부모/자녀 역할 비중을 본문에 자연스럽게 반영 (영아=부모 가이드, 중고등=자녀 자기결정).",
  );
  return lines.join("\n");
}
