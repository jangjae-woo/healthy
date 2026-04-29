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
  text: string;                  // 프롬프트에 그대로 박을 멀티라인 시드
}

function ilganRelationLabel(parentElem: string, childElem: string): string {
  if (parentElem === childElem) return "비화 — 같은 본질의 결";
  if (GENERATES[parentElem] === childElem) return "상생, 부모가 아이에게 흘려주는 결";
  if (GENERATES[childElem] === parentElem) return "상생, 아이가 부모를 받쳐주는 결";
  if (CONTROLS[parentElem] === childElem) return "상극, 부모가 아이를 다듬는 결";
  if (CONTROLS[childElem] === parentElem) return "상극, 아이가 부모를 단련시키는 결";
  return "관계 미상";
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

  const text = [
    `[${parentRole} ${parentName}]: ${STEM_HANJA[pIlgan]}${pElem} — ${ILGAN_IMAGERY[pIlgan]}`,
    `[아이 ${childName}]: ${STEM_HANJA[cIlgan]}${cElem} — ${ILGAN_IMAGERY[cIlgan]}`,
    `[일간 관계]: ${ilganRel}`,
    `[${parentRole}→아이 결의 역할]: ${sipseong}(${sipHanja}) — ${tone}`,
    `[${parentRole}이 아이에게 채워주는 오행]: ${helpsElement ?? "특별히 없음"}${fillsQuality ? ` (${fillsQuality})` : ""}`,
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
