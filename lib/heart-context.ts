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
export function buildYongsinContext(yongsin: string, stage: AgeStage): string {
  return [
    "[평생 빛나는 결 — 용신(用神, 사주에서 채워야 할 가장 중요한 결)]",
    `용신: ${yongsin || "특정 없음"}`,
    YONGSIN_HINT[stage],
    "★ '용신' 한자 단어는 본문에 노출 X. '평생 채워주면 빛나는 한 결'로 풀어쓰기.",
    "★ 부모/자녀 역할 비중을 본문에 자연스럽게 반영 (영아=부모 가이드, 중고등=자녀 자기결정).",
  ].join("\n");
}
