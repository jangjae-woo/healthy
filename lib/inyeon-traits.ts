// V1 인연 — 명리학 결정론 매핑 5층 시스템
// 어떤 사주가 들어와도 본인 맞춤 풀이가 나오게 사전 매핑.
// LLM은 이 매핑만 풀이 — 임의 일반론·바넘 표현 차단.

import type { SajuAnalysis } from "@/lib/saju-calculator";

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

const BRANCH_ELEM: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목",
  진: "토", 사: "화", 오: "화", 미: "토",
  신: "금", 유: "금", 술: "토", 해: "수",
};

// ─── 1층: 십성 강약 행동 풀 ─────────────────────
const SIP_TRAITS = {
  식상: {
    강: ["말이 끊이지 않음", "표현이 풍부", "가만히 못 있음", "분위기 메이커", "사람 시선 모음", "감정 그대로 드러남"],
    약: ["속이 깊음", "말이 적음", "행동으로 보여줌", "조용한 자리 선호", "마음 표현이 어려움"],
  },
  재성: {
    강: ["현실 감각이 좋음", "활달", "사람을 끌어당김", "물질 감각이 있음", "사람을 챙김"],
    약: ["마음이 우선", "물질에 무심", "계산이 약함", "받기보다 줌"],
  },
  관성: {
    강: ["책임감이 강함", "단정함", "절제하는 결", "약속을 잘 지킴", "규칙을 따름"],
    약: ["빈틈이 자주 노출", "자유로움", "계획대로 안 따름", "즉흥적", "자기 통제가 약함"],
  },
  비겁: {
    강: ["자존심이 강함", "독립적", "스스로 결정함", "친구가 많음", "지지 않음"],
    약: ["혼자 결정이 어려움", "의지할 사람을 찾음", "외로움을 잘 탐"],
  },
  인성: {
    강: ["생각이 깊음", "잘 받아들임", "배움이 많음", "품이 넓음"],
    약: ["자수성가형", "혼자 일으킴", "받기 어색함", "마음이 닫힘"],
  },
};

// ─── 2층: 일주 25 조합 (일간 오행 × 일지 오행) ─────────────────────
const ILJU_INNER_OUTER: Record<string, { outer: string; inner: string; combo: string }> = {
  "목-목": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "또 자라고 또 자라려는 의지", combo: "한결같은 사람, 다만 변화가 어려움" },
  "목-화": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "안에 빛이 있어 표현이 많음", combo: "활발하고 표현이 많은 사람" },
  "목-토": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "안은 안정을 원함", combo: "야망과 안정 사이에서 균형 찾는 사람" },
  "목-금": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "속은 단단해 결단력 있음", combo: "솔직하지만 한 번 결정하면 흔들리지 않는 사람" },
  "목-수": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "속은 흐르고 깊음", combo: "곧지만 유연한, 받아들임이 있는 사람" },

  "화-목": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안에서 또 자라고 싶음", combo: "끊임없이 새로움을 찾는 빛나는 사람" },
  "화-화": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안도 빛이 강함", combo: "강렬한 사람, 다만 휴식이 필요" },
  "화-토": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안은 따뜻하고 안정", combo: "사람의 안식처가 되는 따뜻한 사람" },
  "화-금": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "속은 단단하고 절제", combo: "카리스마와 절제를 함께 가진 사람" },
  "화-수": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "속은 차분하고 깊음", combo: "표현은 화려하나 속은 깊은 사람" },

  "토-목": { outer: "안정시키고 품는 결, 묵직함", inner: "안은 자라고 싶은 결", combo: "겉은 차분하나 속에 야망이 있는 사람" },
  "토-화": { outer: "안정시키고 품는 결, 묵직함", inner: "안은 빛나고 싶음", combo: "겉은 무겁지만 속은 표현하고 싶은 사람" },
  "토-토": { outer: "안정시키고 품는 결, 묵직함", inner: "안도 안정", combo: "한결같은 안식처 같은 사람" },
  "토-금": { outer: "안정시키고 품는 결, 묵직함", inner: "속은 단단하고 결단", combo: "묵직한데 결정은 빠른 사람" },
  "토-수": { outer: "안정시키고 품는 결, 묵직함", inner: "속은 흐르고 받아들임", combo: "묵직하지만 마음은 깊고 유연한 사람" },

  "금-목": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 자라고 싶음", combo: "단단해 보이지만 속은 자라고 싶은 사람" },
  "금-화": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 빛나고 싶음", combo: "겉은 차갑지만 속은 뜨거운 사람" },
  "금-토": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 따뜻함", combo: "겉은 단단한데 속은 따뜻한 사람" },
  "금-금": { outer: "다듬고 단단해지는 결, 결단력", inner: "안도 단단", combo: "강한 결의 사람, 다만 부드러움이 필요" },
  "금-수": { outer: "다듬고 단단해지는 결, 결단력", inner: "속은 흐르고 깊음", combo: "단단한 결단력에 깊은 통찰을 가진 사람" },

  "수-목": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 자라려는 의지", combo: "유연하지만 안에 단단한 의지가 있는 사람" },
  "수-화": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 빛나고 싶음", combo: "차분해 보이지만 속은 표현하고 싶은 사람" },
  "수-토": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 안정", combo: "유연하고 안정된 사람" },
  "수-금": { outer: "흐르고 받아들이는 결, 유연함", inner: "속은 단단하고 결단", combo: "부드러운데 결정은 단호한 사람" },
  "수-수": { outer: "흐르고 받아들이는 결, 유연함", inner: "안도 깊음", combo: "끝없이 깊은 사람, 다만 표현이 적음" },
};

// ─── 3층: 신살 8종 매력 ─────────────────────
const SINSAL_CHARM: { key: string; hanja: string; name: string; charm: string }[] = [
  { key: "도화", hanja: "桃花", name: "도화살", charm: "사람 모이는 자리에 자연스럽게 시선을 받음" },
  { key: "홍염", hanja: "紅艶", name: "홍염살", charm: "은은한 매력, 말 안 해도 사람을 끌어당김" },
  { key: "천을", hanja: "天乙", name: "천을귀인", charm: "어려울 때 누군가 먼저 손을 내밀어 줌" },
  { key: "문창", hanja: "文昌", name: "문창귀인", charm: "지식과 말 잘함이 매력으로 작용함" },
  { key: "화개", hanja: "華蓋", name: "화개살", charm: "예술적 깊이, 고독을 잘 견디는 결" },
  { key: "역마", hanja: "驛馬", name: "역마살", charm: "움직임 많은 자리에서 인연을 만남" },
  { key: "장성", hanja: "將星", name: "장성살", charm: "강한 카리스마, 사람을 이끄는 결" },
  { key: "월덕", hanja: "月德", name: "월덕귀인", charm: "따뜻한 인덕, 사람들이 의지하는 결" },
];

// ─── 4층 + 5층: 어울리는 상대 / 피해야 할 상대 ─────────────────────
function deriveSipCounts(saju: SajuAnalysis): Record<string, number> {
  const counts: Record<string, number> = { 식상: 0, 재성: 0, 관성: 0, 비겁: 0, 인성: 0 };
  const sip = saju.sipseong;
  const all = [
    sip.year.stem, sip.year.branch,
    sip.month.stem, sip.month.branch,
    sip.day.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
  for (const s of all) {
    if (s.includes("식신") || s.includes("상관")) counts.식상++;
    else if (s.includes("정재") || s.includes("편재")) counts.재성++;
    else if (s.includes("정관") || s.includes("편관") || s.includes("칠살")) counts.관성++;
    else if (s.includes("비견") || s.includes("겁재")) counts.비겁++;
    else if (s.includes("정인") || s.includes("편인") || s.includes("효신")) counts.인성++;
  }
  return counts;
}

// ─── 통합 derive ─────────────────────
export interface InyeonTraits {
  selfStrong: { sip: string; count: number; traits: string[] }[];
  selfWeak: { sip: string; traits: string[] }[];
  innerOuter: { outer: string; inner: string; combo: string };
  charms: { hanja: string; name: string; charm: string }[];
  matchingPrimary: { type: string; behavior: string };
  matchingBlankFiller: { type: string; behavior: string } | null;
  avoidPartners: string[];
  oneLineSelf: string;
  ilganElem: string;
  iljiElem: string;
}

const PRIMARY_PARTNER_BY_STRONG: Record<string, { type: string; behavior: string }> = {
  식상: { type: "印星(인성)이 두텁게 자리한 사람", behavior: "당신의 그 많은 말을 끊지 않고 들어주고, 당신의 표현을 즐겁게 받아주는 결" },
  비겁: { type: "正官(정관)이 자리한 사람", behavior: "책임감 있게 함께 가는 결, 당신의 자존심을 흔들지 않으면서도 단단히 지켜주는 사람" },
  재성: { type: "比劫(비겁)이 자리한 사람", behavior: "친구처럼 옆에 동등하게 머무는 결, 당신의 활달함을 부담스러워하지 않는 사람" },
  관성: { type: "食傷(식상)이 자리한 사람", behavior: "당신의 단정함을 풀어주고, 함께 있으면 마음이 가벼워지는 결" },
  인성: { type: "財星(재성)이 자리한 사람", behavior: "현실로 끌어내 주는 결, 당신을 바깥 세상으로 부드럽게 안내하는 사람" },
};

const BLANK_FILLER_BY_WEAK: Record<string, { type: string; behavior: string }> = {
  관성: { type: "印星(인성)이 두터운 사람", behavior: "자주 드러나는 빈틈을 따뜻하게 봐주고, 단정 짓지 않는 결" },
  인성: { type: "印星(인성)이 강한 사람", behavior: "당신을 받아주고 품어주는 결, 혼자 짊어지지 않게 해주는 사람" },
  식상: { type: "食傷(식상)이 강한 사람", behavior: "당신의 속을 끌어내주는 결, 표현을 자연스럽게 만들어주는 사람" },
  재성: { type: "財星(재성)이 자리한 사람", behavior: "현실을 챙겨주는 결, 마음만 우선이지 않게 균형을 잡아주는 사람" },
  비겁: { type: "比劫(비겁)이 자리한 사람", behavior: "친구처럼 옆에 함께 있는 결, 혼자가 아니게 해주는 사람" },
};

const AVOID_BY_STRONG: Record<string, string[]> = {
  식상: ["食傷이 강한 사람 — 서로 표현만 많아 들어줄 사람이 없는 결", "官星이 차갑게 강한 사람 — 당신의 빈틈을 답답하게 여길 결"],
  비겁: ["比劫이 강한 사람 — 자존심이 부딪히는 결", "印星이 약한 사람 — 당신을 받아주지 못하는 결"],
  재성: ["財星이 강한 사람 — 현실 계산이 부딪히는 결"],
  관성: ["官星이 강한 사람 — 둘 다 단정하기만 하여 풀림이 없는 결"],
  인성: ["印星이 강한 사람 — 둘 다 받아만 주려 하여 흐름이 멈추는 결"],
};

export function deriveInyeonTraits(saju: SajuAnalysis): InyeonTraits {
  const counts = deriveSipCounts(saju);

  // 강한 십성 (3+) / 약한 십성 (0)
  const selfStrong: { sip: string; count: number; traits: string[] }[] = [];
  const selfWeak: { sip: string; traits: string[] }[] = [];
  const order = ["식상", "재성", "관성", "비겁", "인성"];
  for (const s of order) {
    const c = counts[s];
    if (c >= 3) selfStrong.push({ sip: s, count: c, traits: SIP_TRAITS[s as keyof typeof SIP_TRAITS].강 });
    else if (c === 0) selfWeak.push({ sip: s, traits: SIP_TRAITS[s as keyof typeof SIP_TRAITS].약 });
  }
  // 강한 십성 없으면 가장 많은 1개를 fallback
  if (selfStrong.length === 0) {
    const max = order.reduce((a, b) => (counts[a] >= counts[b] ? a : b));
    if (counts[max] > 0) {
      selfStrong.push({ sip: max, count: counts[max], traits: SIP_TRAITS[max as keyof typeof SIP_TRAITS].강.slice(0, 3) });
    }
  }

  // 일주 겉/속
  const ilganElem = STEM_ELEM[saju.ilgan] ?? "토";
  const iljiElem = BRANCH_ELEM[saju.pillars.day.branch] ?? "토";
  const innerOuter = ILJU_INNER_OUTER[`${ilganElem}-${iljiElem}`] ?? {
    outer: "고유한 결",
    inner: "깊은 결",
    combo: "단단한 결을 가진 사람",
  };

  // 신살 매력
  const charms: { hanja: string; name: string; charm: string }[] = [];
  for (const ss of SINSAL_CHARM) {
    if (saju.sinsal.some((s) => s.includes(ss.key))) {
      charms.push({ hanja: ss.hanja, name: ss.name, charm: ss.charm });
    }
  }

  // 어울리는 상대 1차 (강한 십성 기준)
  const primaryStrong = selfStrong[0]?.sip ?? "식상";
  const matchingPrimary = PRIMARY_PARTNER_BY_STRONG[primaryStrong] ?? PRIMARY_PARTNER_BY_STRONG["식상"];

  // 빈틈 채움 (약한 십성 우선순위: 관성 > 인성 > 식상 > 재성 > 비겁)
  const blankPriority = ["관성", "인성", "식상", "재성", "비겁"];
  let matchingBlankFiller: { type: string; behavior: string } | null = null;
  for (const wp of blankPriority) {
    if (selfWeak.some((w) => w.sip === wp)) {
      matchingBlankFiller = BLANK_FILLER_BY_WEAK[wp];
      break;
    }
  }

  // 피해야 할 상대
  const avoidPartners: string[] = [];
  for (const ss of selfStrong) {
    const items = AVOID_BY_STRONG[ss.sip] ?? [];
    avoidPartners.push(...items);
  }

  // 종합 한 줄
  const strongLabel = selfStrong.length > 0
    ? selfStrong.map((s) => s.sip).join("·") + "이 강한"
    : "균형 있는";
  const weakLabel = selfWeak.length > 0
    ? selfWeak.map((w) => w.sip).join("·") + "이 비어 있어 빈틈을 가진"
    : "단단한";
  const oneLineSelf = `${strongLabel}, ${weakLabel}, ${innerOuter.combo}`;

  return {
    selfStrong, selfWeak,
    innerOuter,
    charms,
    matchingPrimary,
    matchingBlankFiller,
    avoidPartners: avoidPartners.slice(0, 3),
    oneLineSelf,
    ilganElem,
    iljiElem,
  };
}

// 프롬프트에 박을 텍스트로 직렬화
export function traitsToPromptBlock(t: InyeonTraits, name: string): string {
  const lines: string[] = [];
  lines.push(`━━━ ${name}님 자동 매핑 (이 매핑만 따라 풀이 — 임의 일반론 금지) ━━━`);
  lines.push("");

  // 강한 십성
  if (t.selfStrong.length > 0) {
    lines.push("[강한 십성 + 행동 풀]");
    for (const s of t.selfStrong) {
      lines.push(`- ${s.sip}(${s.count}개): ${s.traits.join(" / ")}`);
    }
  }
  // 약한 십성
  if (t.selfWeak.length > 0) {
    lines.push("");
    lines.push("[비어 있는 십성 + 빈틈 풀]");
    for (const w of t.selfWeak) {
      lines.push(`- ${w.sip}(0개): ${w.traits.join(" / ")}`);
    }
  }
  // 일주 겉/속
  lines.push("");
  lines.push("[일주 — 겉과 속의 차이]");
  lines.push(`- 겉(보여지는 모습): ${t.innerOuter.outer}`);
  lines.push(`- 속(진짜 모습): ${t.innerOuter.inner}`);
  lines.push(`- 결합 한 줄: "${t.innerOuter.combo}"`);
  // 신살
  lines.push("");
  lines.push("[보유 신살 + 매력 행동]");
  if (t.charms.length === 0) {
    lines.push("- (특별한 매력 신살 없음 — 일간 본질에서 매력 도출)");
  } else {
    for (const c of t.charms) {
      lines.push(`- ${c.hanja}(${c.name}): ${c.charm}`);
    }
  }
  // 어울리는 상대
  lines.push("");
  lines.push("[어울리는 상대]");
  lines.push(`- 1차: ${t.matchingPrimary.type}`);
  lines.push(`  행동: ${t.matchingPrimary.behavior}`);
  if (t.matchingBlankFiller) {
    lines.push(`- 2차 (빈틈 채움): ${t.matchingBlankFiller.type}`);
    lines.push(`  행동: ${t.matchingBlankFiller.behavior}`);
  }
  // 피해야 할 상대
  if (t.avoidPartners.length > 0) {
    lines.push("");
    lines.push("[피해야 할 상대]");
    for (const a of t.avoidPartners) {
      lines.push(`- ${a}`);
    }
  }
  // 종합 한 줄
  lines.push("");
  lines.push(`[종합 정의 한 줄] "${t.oneLineSelf}"`);

  return lines.join("\n");
}
