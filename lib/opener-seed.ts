// 자도인 첫마디 — 결정론 시드 빌더
// 사주 계산값(일간 오행 + 십성 + 보충 오행)을 기반으로 시적 첫마디의 토대 문자열을 만든다.
// AI는 이 시드를 받아 시적으로만 다듬는다 (예시 문장을 복붙하지 않도록 통상 메타포 금지 규칙과 함께).

import { getSipseong, type SajuAnalysis } from "./saju-calculator";

// ── 사전: 일간(10간) → 자연 비유 ─────────────────────────────────────
const ILGAN_IMAGERY: Record<string, string> = {
  갑: "곧게 뻗는 큰 나무",
  을: "부드럽게 뻗는 봄풀",
  병: "환하게 비추는 햇살",
  정: "따스히 번지는 등불",
  무: "한 자리에 뿌리내리는 너른 들판",
  기: "모든 것을 받아내는 부드러운 흙",
  경: "단단히 다듬어진 칼날",
  신: "투명하게 빛나는 보석",
  임: "도도하게 흐르는 큰 강물",
  계: "깊이 잠긴 맑은 샘물",
};

// ── 사전: 일간(10간) × 자녀에게 줄 수 있는 응답 동사 (3변형) ─────────
// imagery와 동사 일치 강제 — AI가 imagery·동사 모순 만들지 못하게 사전화
const ILGAN_RESPONSE_VERBS: Record<string, [string, string, string]> = {
  갑: ["곧은 방향을 그어주는", "위로 자라나도록 곁에 서는", "함께 자라가는 그늘이 되는"],
  을: ["부드럽게 풀어주는", "유연함을 더해주는", "살랑이며 받아주는"],
  병: ["환하게 비춰주는", "온기를 더해주는", "빛을 흘려주는"],
  정: ["따뜻이 다독이는", "은은히 비춰주는", "가까이서 빛이 되어주는"],
  무: ["너르게 받아주는", "자리를 내어주는", "든든히 받쳐주는"],
  기: ["부드럽게 품어주는", "넉넉히 받아주는", "자라게 돕는"],
  경: ["단단한 울타리가 되어주는", "곧은 결단을 보여주는", "흔들림 없이 지켜주는"],
  신: ["맑은 결단을 일러주는", "선명한 길을 비춰주는", "단정한 결을 보여주는"],
  임: ["도도한 흐름으로 받쳐주는", "깊이를 더해주는", "흐름의 길을 열어주는"],
  계: ["잔잔히 받아주는", "차분한 깊이를 더해주는", "조용히 흘러주는"],
};

// 사주 해시 → 변형 인덱스 (0~2) 결정
function pickVariant(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 3;
}

// 부모 일간 → 자녀에게 줄 응답 동사 (사주 해시 기반)
export function pickParentResponseVerb(parentIlgan: string, seedString: string): string {
  const verbs = ILGAN_RESPONSE_VERBS[parentIlgan];
  if (!verbs) return "함께하는";
  return verbs[pickVariant(seedString)];
}

// ── 사전: 자녀 일간 오행 × 마무리 문구 (3변형) ─────────────
// 자녀 영향 마무리에서 imagery 일치 + 긍정 인상 + 명리 정확 강제
const CHILD_GROWTH_PHRASES: Record<string, [string, string, string]> = {
  목: ["곧게 뻗어 자라가는", "유연하게 새 결을 펼치는", "위로 한결같이 자라가는"],
  화: ["환하게 빛을 펼쳐가는", "따뜻한 활기로 자라는", "환한 표현을 풍부히 펼치는"],
  토: ["자기 자리를 단단히 다져가는", "넉넉하고 든든히 자라는", "흔들림 없이 자기 결을 가꾸는"],
  금: ["맑은 결단을 키워가는", "곧고 단단히 자라는", "선명한 결을 다듬어가는"],
  수: ["깊은 지혜를 흘려가는", "차분히 흐름을 키우는", "잔잔히 자기 결을 깊여가는"],
};

// 자녀 일간 오행 → 마무리 문구 (사주 해시 기반)
export function pickChildGrowthPhrase(childElement: string, seedString: string): string {
  const phrases = CHILD_GROWTH_PHRASES[childElement];
  if (!phrases) return "자기 결을 차분히 키워가는";
  return phrases[pickVariant(seedString)];
}

// ── 사전: 천간 한자 ─────────────────────────────────────
const STEM_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

// ── 사전: 천간 → 오행 ─────────────────────────────────────
const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

// ── 오행 상생/상극 ─────────────────────────────────────
const GENERATES: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

// ── 사전: 십성(10성) → 결의 톤 ─────────────────────────────────────
const SIPSEONG_TONE: Record<string, string> = {
  비견: "어깨를 나란히 하는 동지의 결",
  겁재: "함께 부딪히며 자라는 결",
  식신: "있는 그대로 흘려보내며 키워내는 결",
  상관: "스스로의 빛을 뻗어내는 결",
  편재: "넓게 펼쳐 다스리는 결",
  정재: "꾸준히 모으고 지켜내는 결",
  편관: "단단히 갈고 닦아주는 결",
  정관: "곧은 길을 안내하는 결",
  편인: "묵묵히 곁에서 받쳐주는 결",
  정인: "수용하고 기다리며 길러내는 결",
};
const SIPSEONG_HANJA: Record<string, string> = {
  비견: "比肩", 겁재: "劫財",
  식신: "食神", 상관: "傷官",
  편재: "偏財", 정재: "正財",
  편관: "偏官", 정관: "正官",
  편인: "偏印", 정인: "正印",
};

// ── 사전: 오행 → 채움 결 묘사 ─────────────────────────────────────
const ELEM_QUALITY: Record<string, string> = {
  목: "유연함·성장의 결",
  화: "환함·표현의 결",
  토: "안정·포근함의 결",
  금: "단단함·결단의 결",
  수: "차분함·지혜의 결",
};

// ── 사전: 십성 5분류(군) → 톤 ─────────────────────────────────────
const SIPSEONG_GROUP_TONE: Record<string, string> = {
  비겁: "자기를 세우는 결",
  식상: "표현·창의의 결",
  재성: "끌어모으는 결",
  관성: "절제·기다림의 결",
  인성: "사색·받아들임의 결",
};

export interface OpenerSeed {
  parentLabel: "엄마" | "아빠";
  parentName: string;
  parentIlgan: string;
  parentHanja: string;
  parentElement: string;
  parentImagery: string;
  childName: string;
  childIlgan: string;
  childHanja: string;
  childElement: string;
  childImagery: string;
  ilganRelationLabel: string;
  parentSipseong: string;       // 10성 그대로 ("정인" 등)
  parentSipseongHanja: string;  // "正印"
  parentSipseongTone: string;   // 톤 풀이
  fillsElement: string | null;
  fillsQuality: string | null;
  reframeHint: string;            // "부모 → 아이 영향" 방향성 강제용
  responseVerb: string;           // imagery 일치 응답 동사 (자녀에게)
  childGrowthPhrase: string;      // 자녀 imagery 일치 마무리 문구
  text: string;                  // 프롬프트에 그대로 박을 멀티라인 시드
}

function ilganRelationLabel(parentElem: string, childElem: string): string {
  if (parentElem === childElem) return "비화 — 같은 본질의 결";
  if (GENERATES[parentElem] === childElem) return "상생, 부모가 아이에게 흘려주는 결";
  if (GENERATES[childElem] === parentElem) return "상생, 아이가 부모를 받쳐주는 결";
  // "상극" 단어 일반 인식 부정 → 풀어쓰기로 강제 (시드에서 사라지면 AI가 본문에 못 옮김)
  if (CONTROLS[parentElem] === childElem) return "부모의 결이 아이의 결을 곧게 다듬어 주는 만남";
  if (CONTROLS[childElem] === parentElem) return "아이의 결이 부모의 결을 단단히 다져주는 만남";
  return "관계 미상";
}

// 보고서는 항상 "부모 → 아이 영향" 방향으로 마무리 — 명리 방향이 자녀→부모일지라도 reframe.
function reframeToChildImpact(parentElem: string, childElem: string, parentRole: "엄마" | "아빠"): string {
  // 명리 방향이 child→parent인 경우, 부모 행동을 받아주기·울타리·돌려주기로 reframe
  if (parentElem === childElem) {
    return `${parentRole}는 아이와 같은 본질의 결을 가졌으니, 본문은 두 사람이 같은 결로 통하며 ${parentRole}의 안정이 아이에게 같은 자리를 내주는 형태로 마무리. 마지막 문장은 반드시 "아이가 ~한 자녀로 자라난다"로.`;
  }
  if (GENERATES[parentElem] === childElem) {
    return `명리적으로 부모가 아이에게 결을 흘려주는 방향. 본문은 ${parentRole}가 아이에게 결을 키워주는 톤. 마지막 문장: "아이가 ~한 자녀로 자라난다".`;
  }
  if (GENERATES[childElem] === parentElem) {
    return `명리적으로는 자녀가 부모를 살리는 방향이지만, 보고서는 부모→자녀 영향으로 reframe. ${parentRole}는 아이의 결을 받아 안정으로 응답하며 든든한 울타리가 되어주는 톤. 마지막 문장은 반드시 "아이가 ${parentRole} 곁에서 ~한 자녀로 자라난다".`;
  }
  if (CONTROLS[parentElem] === childElem) {
    return `명리적으로 부모가 아이를 다듬는 방향. 본문은 ${parentRole}가 아이의 결을 곧게 잡아주는 톤. 마지막 문장: "아이가 ~한 자녀로 자라난다".`;
  }
  if (CONTROLS[childElem] === parentElem) {
    return `명리적으로는 자녀가 부모를 다스리는 방향이지만, 보고서는 부모→자녀 영향으로 reframe. ${parentRole}는 아이의 강한 결을 받아주며 든든한 울타리가 되어 아이가 자기 자리를 잡고 성장하도록 받쳐주는 톤. 마지막 문장은 반드시 "아이가 ${parentRole} 곁에서 ~한 자녀로 자라난다".`;
  }
  return `본문 마지막 문장은 반드시 "아이가 ~한 자녀로 자라난다"로 끝낼 것.`;
}

export function buildOpenerSeed(
  parent: SajuAnalysis | null,
  child: SajuAnalysis,
  parentRole: "엄마" | "아빠",
  parentName: string,
  childName: string,
  helpsElement: string | null,
): OpenerSeed | null {
  if (!parent) return null;
  const pIlgan = parent.ilgan;
  const cIlgan = child.ilgan;
  const pElem = STEM_ELEM[pIlgan];
  const cElem = STEM_ELEM[cIlgan];
  if (!pElem || !cElem) return null;

  const ilganRel = ilganRelationLabel(pElem, cElem);
  const sipseong = getSipseong(pIlgan, cIlgan, false);
  const tone = SIPSEONG_TONE[sipseong] ?? "";
  const sipHanja = SIPSEONG_HANJA[sipseong] ?? "";
  const fillsQuality = helpsElement ? ELEM_QUALITY[helpsElement] ?? null : null;
  const reframeHint = reframeToChildImpact(pElem, cElem, parentRole);
  // 사주 해시로 응답 동사 결정 — 같은 사주는 같은 결과, 다른 사주는 다른 결과
  const seedString = `${parentName}-${childName}-${pIlgan}-${cIlgan}`;
  const responseVerb = pickParentResponseVerb(pIlgan, seedString);
  const childGrowthPhrase = pickChildGrowthPhrase(cElem, seedString);

  const text = [
    `[${parentRole} ${parentName}]: ${STEM_HANJA[pIlgan]}${pElem} — ${ILGAN_IMAGERY[pIlgan]}`,
    `[아이 ${childName}]: ${STEM_HANJA[cIlgan]}${cElem} — ${ILGAN_IMAGERY[cIlgan]}`,
    `[일간 관계]: ${ilganRel}`,
    `[${parentRole}이 자녀에게 줄 응답 동사 (imagery 일치, 사주 해시 결정)]: "${responseVerb}"`,
    `[자녀 마무리 문구 (imagery 일치, 긍정 인상)]: "${childGrowthPhrase} 자녀로 자라날 것입니다"`,
    `[${parentRole}이 아이에게 채워주는 오행]: ${helpsElement ?? "특별히 없음"}${fillsQuality ? ` (${fillsQuality})` : ""}`,
    `[방향성 reframe]: ${reframeHint}`,
  ].join("\n");

  return {
    parentLabel: parentRole,
    parentName,
    parentIlgan: pIlgan,
    parentHanja: STEM_HANJA[pIlgan],
    parentElement: pElem,
    parentImagery: ILGAN_IMAGERY[pIlgan],
    childName,
    childIlgan: cIlgan,
    childHanja: STEM_HANJA[cIlgan],
    childElement: cElem,
    childImagery: ILGAN_IMAGERY[cIlgan],
    ilganRelationLabel: ilganRel,
    parentSipseong: sipseong,
    parentSipseongHanja: sipHanja,
    parentSipseongTone: tone,
    fillsElement: helpsElement,
    fillsQuality,
    reframeHint,
    responseVerb,
    childGrowthPhrase,
    text,
  };
}

// ── 아이의 강점·약점 십성 군(群) — getSipseongCounts 결과를 톤 라벨로 ──
export function describeChildSipseongStrength(
  counts: { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number },
): { strong: string[]; weak: string[] } {
  const entries = Object.entries(counts) as Array<[keyof typeof counts, number]>;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const strong = sorted.slice(0, 2).map(([k]) => `${k}(${SIPSEONG_GROUP_TONE[k] ?? ""})`);
  const weak = sorted.slice(-2).reverse().map(([k]) => `${k}(${SIPSEONG_GROUP_TONE[k] ?? ""})`);
  return { strong, weak };
}

// ── 분포 사실 분류 (강/중/약) — AI 윤색 방지용 결정론 사실 주입 ──
// 오행 분포: percent (0~100). 강함 ≥25, 약함 <15, 그 외 중간.
export function classifyElementDistribution(
  elements: Record<string, number>,
): { text: string; isBalanced: boolean } {
  const order = ["목", "화", "토", "금", "수"];
  const ELEM_KOR_LABEL: Record<string, string> = {
    목: "木(자라남)",
    화: "火(빛남)",
    토: "土(안정)",
    금: "金(단단함)",
    수: "水(지혜)",
  };
  const strong: string[] = [];
  const mid: string[] = [];
  const weak: string[] = [];
  order.forEach((el) => {
    const v = Math.round(elements[el] ?? 0);
    const label = `${ELEM_KOR_LABEL[el]} ${v}%`;
    if (v >= 25) strong.push(label);
    else if (v >= 15) mid.push(label);
    else weak.push(label);
  });
  // 균형 판정: 모든 오행이 ±5%p 안 (max-min ≤ 10)
  const vals = order.map((el) => elements[el] ?? 0);
  const isBalanced = Math.max(...vals) - Math.min(...vals) <= 10;
  const text = [
    `- 강함: ${strong.length ? strong.join(" · ") : "(없음)"}`,
    `- 중간: ${mid.length ? mid.join(" · ") : "(없음)"}`,
    `- 약함: ${weak.length ? weak.join(" · ") : "(없음)"}`,
    `- 전체 균형 여부: ${isBalanced ? "균형(±5%p 이내)" : "불균형 — '균형' 단어 사용 금지"}`,
  ].join("\n");
  return { text, isBalanced };
}

// 십성 분포: count (총합 ≈8). 강함 ≥2, 약함 <1, 그 외 중간.
export function classifySipseongDistribution(
  counts: { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number },
): { text: string; isBalanced: boolean } {
  const order: Array<keyof typeof counts> = ["비겁", "식상", "재성", "관성", "인성"];
  const SIP_LABEL: Record<string, string> = {
    비겁: "비겁(자기를 세움)",
    식상: "식상(표현·창의)",
    재성: "재성(돈·물건의 결)",
    관성: "관성(절제·규율)",
    인성: "인성(사색·받아들임)",
  };
  const strong: string[] = [];
  const mid: string[] = [];
  const weak: string[] = [];
  order.forEach((k) => {
    const v = Math.round((counts[k] ?? 0) * 10) / 10;
    const label = `${SIP_LABEL[k]} ${v}`;
    if (v >= 2) strong.push(label);
    else if (v >= 1) mid.push(label);
    else weak.push(label);
  });
  const vals = order.map((k) => counts[k] ?? 0);
  const isBalanced = Math.max(...vals) - Math.min(...vals) <= 1.5;
  const text = [
    `- 강함: ${strong.length ? strong.join(" · ") : "(없음)"}`,
    `- 중간: ${mid.length ? mid.join(" · ") : "(없음)"}`,
    `- 약함: ${weak.length ? weak.join(" · ") : "(없음)"}`,
    `- 전체 균형 여부: ${isBalanced ? "균형(차이 ≤1.5)" : "불균형 — '균형' 단어 사용 금지"}`,
  ].join("\n");
  return { text, isBalanced };
}
