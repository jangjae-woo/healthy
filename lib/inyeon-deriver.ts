// V1 인연 시각화용 결정론 derive 함수들.
// V2 lib/inyeon/* 와 별개 (V2는 두 사람 궁합용, 이건 V1 솔로용).
import type { SajuAnalysis } from "@/lib/saju-calculator";

const STEM_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
};

const ELEMENT_ESSENCE: Record<string, string> = {
  목: "곧고 자라는 결",
  화: "빛나고 펼치는 결",
  토: "품고 안정시키는 결",
  금: "다듬고 결단하는 결",
  수: "흐르고 지혜로운 결",
};

export function deriveEssenceKeywords(saju: SajuAnalysis): string[] {
  const keywords: string[] = [];

  // 1. 일간 본질
  const elem = STEM_ELEMENT[saju.ilgan];
  if (elem && ELEMENT_ESSENCE[elem]) keywords.push(ELEMENT_ESSENCE[elem]);

  // 2. 강한 오행
  const elemEntries = Object.entries(saju.elements) as [string, number][];
  if (elemEntries.length > 0) {
    const strongest = elemEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
    if (strongest[1] > 0) keywords.push(`${strongest[0]}(${strongest[0]}) 기운 강함`);
  }

  // 3. 약한 오행 (채울 자리)
  if (elemEntries.length > 0) {
    const weakest = elemEntries.reduce((a, b) => (a[1] < b[1] ? a : b));
    if (weakest[1] === 0) keywords.push(`${weakest[0]} 기운 채울 자리`);
  }

  // 4. 매력 신살 1개 (있으면)
  const charm = saju.sinsal.find((s) => /도화|홍염|천을/.test(s));
  if (charm) keywords.push(charm);

  // 5. 용신
  if (saju.yongsin) keywords.push(`용신 ${saju.yongsin}`);

  return keywords.slice(0, 5);
}

export function deriveCharmSinsal(saju: SajuAnalysis): { name: string; hanja: string; has: boolean; meaning: string }[] {
  const ss = saju.sinsal;
  return [
    { name: "도화살", hanja: "桃花", has: ss.some((s) => s.includes("도화")), meaning: "사랑받고 빛나는 매력의 결" },
    { name: "홍염살", hanja: "紅艶", has: ss.some((s) => s.includes("홍염")), meaning: "은은히 끌어당기는 매력의 결" },
    { name: "천을귀인", hanja: "天乙", has: ss.some((s) => s.includes("천을")), meaning: "귀한 인연이 도와주는 자리" },
  ];
}

export function deriveInyeonKeywords(saju: SajuAnalysis): string[] {
  const keywords: string[] = [];
  const elem = STEM_ELEMENT[saju.ilgan];
  if (elem === "목") keywords.push("성장하는 인연");
  else if (elem === "화") keywords.push("빛나는 인연");
  else if (elem === "토") keywords.push("안정된 인연");
  else if (elem === "금") keywords.push("단단한 인연");
  else if (elem === "수") keywords.push("흐르는 인연");

  // 매력 신살 기반
  const sinsal = saju.sinsal;
  if (sinsal.some((s) => s.includes("도화"))) keywords.push("사랑받는 결");
  if (sinsal.some((s) => s.includes("홍염"))) keywords.push("은은한 매력");
  if (sinsal.some((s) => s.includes("천을"))) keywords.push("귀한 인연 만남");

  // 용신 기반
  if (saju.yongsin) keywords.push(`${saju.yongsin} 기운에서 깊어지는 인연`);

  // 강한 오행 기반
  const elemEntries = Object.entries(saju.elements) as [string, number][];
  if (elemEntries.length > 0) {
    const strongest = elemEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
    if (strongest[1] >= 3) keywords.push(`${strongest[0]} 결의 사람과 끌림`);
  }

  return keywords.slice(0, 5);
}

// ─── 일간 끌림 매트릭스 (三-1) ─────────────────────
const ATTRACTION_MAP: Record<string, { elem: string; hanja: string; rel: string; meaning: string }[]> = {
  목: [
    { elem: "목", hanja: "木", rel: "비화(比和)", meaning: "함께 자라는 결" },
    { elem: "화", hanja: "火", rel: "식상(食傷)", meaning: "펼쳐주는 결" },
    { elem: "토", hanja: "土", rel: "재성(財星)", meaning: "끌어당기는 결" },
    { elem: "금", hanja: "金", rel: "관성(官星)", meaning: "단련시키는 결" },
    { elem: "수", hanja: "水", rel: "인성(印星)", meaning: "받아주는 결" },
  ],
  화: [
    { elem: "화", hanja: "火", rel: "비화(比和)", meaning: "함께 빛나는 결" },
    { elem: "토", hanja: "土", rel: "식상(食傷)", meaning: "펼쳐주는 결" },
    { elem: "금", hanja: "金", rel: "재성(財星)", meaning: "끌어당기는 결" },
    { elem: "수", hanja: "水", rel: "관성(官星)", meaning: "단련시키는 결" },
    { elem: "목", hanja: "木", rel: "인성(印星)", meaning: "받아주는 결" },
  ],
  토: [
    { elem: "토", hanja: "土", rel: "비화(比和)", meaning: "함께 안정시키는 결" },
    { elem: "금", hanja: "金", rel: "식상(食傷)", meaning: "펼쳐주는 결" },
    { elem: "수", hanja: "水", rel: "재성(財星)", meaning: "끌어당기는 결" },
    { elem: "목", hanja: "木", rel: "관성(官星)", meaning: "단련시키는 결" },
    { elem: "화", hanja: "火", rel: "인성(印星)", meaning: "받아주는 결" },
  ],
  금: [
    { elem: "금", hanja: "金", rel: "비화(比和)", meaning: "함께 단단해지는 결" },
    { elem: "수", hanja: "水", rel: "식상(食傷)", meaning: "펼쳐주는 결" },
    { elem: "목", hanja: "木", rel: "재성(財星)", meaning: "끌어당기는 결" },
    { elem: "화", hanja: "火", rel: "관성(官星)", meaning: "단련시키는 결" },
    { elem: "토", hanja: "土", rel: "인성(印星)", meaning: "받아주는 결" },
  ],
  수: [
    { elem: "수", hanja: "水", rel: "비화(比和)", meaning: "함께 흐르는 결" },
    { elem: "목", hanja: "木", rel: "식상(食傷)", meaning: "펼쳐주는 결" },
    { elem: "화", hanja: "火", rel: "재성(財星)", meaning: "끌어당기는 결" },
    { elem: "토", hanja: "土", rel: "관성(官星)", meaning: "단련시키는 결" },
    { elem: "금", hanja: "金", rel: "인성(印星)", meaning: "받아주는 결" },
  ],
};

export function deriveAttraction(saju: SajuAnalysis) {
  const elem = STEM_ELEMENT[saju.ilgan];
  if (!elem) return [];
  return ATTRACTION_MAP[elem] || [];
}

// ─── 사자성어 카드 (序-2, 終-2) ─────────────────────
const SAJA_MAP: { sinsal?: string; elem?: string; saja: string; hangul: string; meaning: string }[] = [
  { sinsal: "도화", saja: "桃花有紅", hangul: "도화유홍", meaning: "사랑받는 결이 가까이 머무는 인연" },
  { sinsal: "홍염", saja: "紅艶千里", hangul: "홍염천리", meaning: "은은한 매력이 멀리까지 닿는 인연" },
  { sinsal: "천을", saja: "天賜良緣", hangul: "천사양연", meaning: "하늘이 정해주신 귀한 인연" },
  { elem: "목", saja: "木向春陽", hangul: "목향춘양", meaning: "봄볕 따라 자라나는 인연의 결" },
  { elem: "화", saja: "紅燭照夜", hangul: "홍촉조야", meaning: "어둠을 밝히는 정성 어린 인연" },
  { elem: "토", saja: "厚德載物", hangul: "후덕재물", meaning: "품 넓어 사람을 받아내는 결" },
  { elem: "금", saja: "金石之交", hangul: "금석지교", meaning: "금처럼 단단한 약속의 인연" },
  { elem: "수", saja: "上善若水", hangul: "상선약수", meaning: "물처럼 흐르며 깊어지는 인연" },
];

export function deriveSaja(saju: SajuAnalysis): { saja: string; hangul: string; meaning: string } {
  for (const m of SAJA_MAP) {
    if (m.sinsal && saju.sinsal.some((s) => s.includes(m.sinsal!))) {
      return { saja: m.saja, hangul: m.hangul, meaning: m.meaning };
    }
  }
  const elem = STEM_ELEMENT[saju.ilgan];
  for (const m of SAJA_MAP) {
    if (m.elem && m.elem === elem) {
      return { saja: m.saja, hangul: m.hangul, meaning: m.meaning };
    }
  }
  return SAJA_MAP[0];
}

// ─── 이상형 십성 카드 (三-2) ─────────────────────
const IDEAL_TYPE_LABELS: Record<string, { hanja: string; meaning: string }> = {
  정관: { hanja: "正官", meaning: "단정하고 책임감 있는 결" },
  편관: { hanja: "偏官", meaning: "강단 있고 매력적인 결" },
  정재: { hanja: "正財", meaning: "성실하고 안정된 결" },
  편재: { hanja: "偏財", meaning: "활달하고 재능 있는 결" },
};

function _allSipseong(saju: SajuAnalysis): string[] {
  const sip = saju.sipseong;
  return [
    sip.year.stem, sip.year.branch,
    sip.month.stem, sip.month.branch,
    sip.day.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
}

export function deriveIdealType(saju: SajuAnalysis): { name: string; hanja: string; meaning: string; count: number }[] {
  const counts: Record<string, number> = { 정관: 0, 편관: 0, 정재: 0, 편재: 0 };
  const all = _allSipseong(saju);
  for (const s of all) {
    for (const k of Object.keys(counts)) {
      if (s.includes(k)) counts[k]++;
    }
  }
  return Object.entries(counts).map(([name, count]) => ({
    name,
    hanja: IDEAL_TYPE_LABELS[name].hanja,
    meaning: IDEAL_TYPE_LABELS[name].meaning,
    count,
  }));
}

// ─── 십성 4축 강도 (二-1) ─────────────────────
export function deriveSipseongAxes(saju: SajuAnalysis): { 식상: number; 재성: number; 관성: number; 비겁: number; 인성: number } {
  const counts = { 식상: 0, 재성: 0, 관성: 0, 비겁: 0, 인성: 0 };
  const all = _allSipseong(saju);
  for (const s of all) {
    if (s.includes("식신") || s.includes("상관")) counts.식상++;
    else if (s.includes("정재") || s.includes("편재")) counts.재성++;
    else if (s.includes("정관") || s.includes("편관") || s.includes("칠살")) counts.관성++;
    else if (s.includes("비견") || s.includes("겁재")) counts.비겁++;
    else if (s.includes("정인") || s.includes("편인") || s.includes("효신")) counts.인성++;
  }
  return counts;
}

// ─── 자극(충) 검출 (二-3) ─────────────────────
const BRANCH_CHUNG: [string, string, string][] = [
  ["자", "오", "子-午"],
  ["축", "미", "丑-未"],
  ["인", "신", "寅-申"],
  ["묘", "유", "卯-酉"],
  ["진", "술", "辰-戌"],
  ["사", "해", "巳-亥"],
];

export function deriveJaguk(saju: SajuAnalysis): { pair: string; hangul: string; meaning: string }[] {
  const branches = [
    saju.pillars.year.branch,
    saju.pillars.month.branch,
    saju.pillars.day.branch,
    saju.pillars.hour?.branch,
  ].filter(Boolean) as string[];
  const items: { pair: string; hangul: string; meaning: string }[] = [];
  for (const [a, b, hanja] of BRANCH_CHUNG) {
    if (branches.includes(a) && branches.includes(b)) {
      items.push({ pair: hanja, hangul: `${a}-${b}`, meaning: "변화를 부르는 자극의 결" });
    }
  }
  return items;
}

// ─── 용신 환경 (四-1) ─────────────────────
const YONGSIN_ENV: Record<string, { time: string; space: string; activity: string }> = {
  목: { time: "이른 아침 · 봄", space: "서점 · 산책로 · 식물원", activity: "책 · 자연 · 새 시작" },
  화: { time: "낮 · 여름", space: "예술 공간 · 밝은 카페", activity: "공연 · 전시 · 표현" },
  토: { time: "오후 · 환절기", space: "지인 소개 · 작은 모임", activity: "익숙한 자리 · 가까운 동네" },
  금: { time: "저녁 · 가을", space: "도서관 · 정돈된 공간", activity: "운동 · 정리 · 결단" },
  수: { time: "밤 · 겨울", space: "물가 · 여행지 · 조용한 곳", activity: "여행 · 대화 · 깊은 자리" },
};

export function deriveYongsinEnv(saju: SajuAnalysis) {
  const y = saju.yongsin;
  if (!y) return null;
  for (const key of Object.keys(YONGSIN_ENV)) {
    if (y.includes(key)) return { elem: key, ...YONGSIN_ENV[key] };
  }
  return null;
}

// ─── 세운 4년 그리드 (五-3) ─────────────────────
export const SEUN_4 = [
  { year: 2027, ganji: "정미", hanja: "丁未" },
  { year: 2028, ganji: "무신", hanja: "戊申" },
  { year: 2029, ganji: "기유", hanja: "己酉" },
  { year: 2030, ganji: "경술", hanja: "庚戌" },
];

// ─── 2026 병오년 (五-2) ─────────────────────
export function deriveByeongo(saju: SajuAnalysis): { selfElem: string; yearElem: string; rel: string; meaning: string } {
  const selfElem = STEM_ELEMENT[saju.ilgan] || "?";
  const yearElem = "화";
  let rel: string, meaning: string;
  if (selfElem === yearElem) {
    rel = "비화(比和)";
    meaning = "올해의 결이 본인 결과 같아 함께 빛나는 한 해";
  } else if (selfElem === "목") {
    rel = "상생(相生) — 본인이 살리는 결";
    meaning = "본인 기운이 올해를 펼쳐주는 한 해";
  } else if (selfElem === "토") {
    rel = "상생(相生) — 본인을 살리는 결";
    meaning = "올해가 본인을 키워주는 한 해";
  } else if (selfElem === "금") {
    rel = "단련(鍛鍊)";
    meaning = "올해가 본인을 단련시키는 한 해";
  } else if (selfElem === "수") {
    rel = "자극(刺戟)";
    meaning = "변화를 부르는 자극의 한 해";
  } else {
    rel = "지원(支援)";
    meaning = "본인 결과 어울리는 흐름의 한 해";
  }
  return { selfElem, yearElem, rel, meaning };
}
