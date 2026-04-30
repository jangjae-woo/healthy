// 자도인 차트·추론 라이브러리
// 8지능 추론, 대운 타임라인 색깔 결정, 십성 분류
// 평생사주 코드는 0줄 건드리지 않음.

import type { SajuAnalysis } from "./saju-calculator";

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const BRANCH_ELEM: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};

// ── 8지능 ──────────────────────────────
export interface IntelligenceCard {
  name: string;       // "언어", "논리수학" 등
  icon: string;       // 이모지
  score: number;      // 추론 점수
  desc: string;       // 한 줄 설명
  basis: string;      // 사주 근거
}

const INTEL_META: Record<string, { icon: string; desc: string }> = {
  언어: { icon: "言", desc: "말과 글로 마음을 전하는 재능" },
  논리수학: { icon: "數", desc: "원리와 패턴을 꿰뚫는 분석력" },
  공간시각: { icon: "形", desc: "이미지와 공간을 다루는 감각" },
  신체운동: { icon: "體", desc: "몸으로 표현하고 움직이는 재능" },
  음악: { icon: "音", desc: "리듬과 멜로디에 반응하는 감수성" },
  대인관계: { icon: "人", desc: "사람의 마음을 읽는 친화력" },
  자기성찰: { icon: "省", desc: "내면을 깊이 들여다보는 사색력" },
  자연친화: { icon: "自", desc: "생명과 자연을 사랑하는 감각" },
};

function collectSipseong(saju: SajuAnalysis): string[] {
  const ss = saju.sipseong;
  const arr: string[] = [
    ss.year.stem, ss.year.branch,
    ss.month.stem, ss.month.branch,
    ss.day.branch,
  ];
  if (ss.hour) {
    arr.push(ss.hour.stem, ss.hour.branch);
  }
  return arr;
}

function countAny(arr: string[], ...targets: string[]): number {
  return arr.filter((s) => targets.includes(s)).length;
}

/**
 * 사주 → 8지능 강도 추론. top 3 반환.
 */
export function infer8Intelligences(saju: SajuAnalysis): IntelligenceCard[] {
  const ss = collectSipseong(saju);
  const elem = STEM_ELEM[saju.ilgan] ?? "수";

  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  const scores: Record<string, number> = {
    언어: insong * 1 + siksang * 1.5,
    논리수학: gwansong * 2 + insong * 0.5,
    공간시각: siksang * 1,
    신체운동: bigyeop * 1.5,
    음악: siksang * 1.5,
    대인관계: bigyeop * 1 + jaesong * 1.5,
    자기성찰: insong * 2,
    자연친화: jaesong * 1,
  };
  // 친절한 사주 근거 풀이 — 십성을 모르는 부모도 이해 가능
  const basis: Record<string, string> = {
    언어:
      `사주에 인성(흡수·사색하는 결)이 ${insong}, 식상(표현하는 결)이 ${siksang}로 함께 있어서, ` +
      `읽고 흡수한 것을 말과 글로 풀어내는 결이 자연스럽게 자랍니다.`,
    논리수학:
      `사주에 관성(체계·규율을 좋아하는 결)이 ${gwansong}로 강해서, ` +
      `규칙과 원리를 따라가며 답을 찾아내는 결이 두드러집니다.`,
    공간시각:
      `사주에 식상(표현하는 결)이 ${siksang}로 풍부해, ` +
      `머릿속의 그림·구조를 시각으로 만들어내는 감각이 활발합니다.`,
    신체운동:
      `사주에 비겁(자기 주관·주도하는 결)이 ${bigyeop}로 강해서, ` +
      `자기 몸으로 직접 부딪히고 움직이며 표현하려는 결이 큽니다.`,
    음악:
      `사주에 식상(표현하는 결)이 ${siksang}로 풍부해, ` +
      `소리와 리듬에 민감하게 반응하고 자기 감정을 가락으로 풀어내는 결이 있습니다.`,
    대인관계:
      `사주에 비겁(자기 주관) ${bigyeop}, 재성(관계로 끌리는 결) ${jaesong}이 함께 있어, ` +
      `자기 결이 분명하면서도 사람들을 자연스럽게 끌어당기는 친화력이 있습니다.`,
    자기성찰:
      `사주에 인성(깊이 사색하는 결)이 ${insong}로 강해서, ` +
      `혼자 마음 안을 들여다보고 자기를 곱씹는 시간을 자연스럽게 가집니다.`,
    자연친화:
      `사주에 재성(현실·생명에 끌리는 결)이 ${jaesong}로 있어, ` +
      `자연·동물·식물에 자석처럼 끌리고 그 안에서 안정을 얻는 결이 있습니다.`,
  };

  // 일간 오행 보강
  if (elem === "목") { scores["언어"] += 1; scores["자연친화"] += 1.5; }
  if (elem === "화") { scores["음악"] += 1.5; scores["공간시각"] += 1; }
  if (elem === "토") { scores["대인관계"] += 1.5; scores["자연친화"] += 1; }
  if (elem === "금") { scores["논리수학"] += 1.5; scores["신체운동"] += 1; }
  if (elem === "수") { scores["자기성찰"] += 1.5; scores["언어"] += 1; }

  // 일지 오행 약간
  const dayBranchElem = BRANCH_ELEM[saju.pillars.day.branch] ?? "토";
  if (dayBranchElem === "목") scores["자연친화"] += 0.5;
  if (dayBranchElem === "화") scores["음악"] += 0.5;
  if (dayBranchElem === "수") scores["자기성찰"] += 0.5;

  // top 3
  const sorted = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // top 3에 아무것도 없는 극단 케이스 fallback
  if (sorted.length < 3) {
    const fallbacks = ["대인관계", "자기성찰", "자연친화"];
    for (const f of fallbacks) {
      if (sorted.length >= 3) break;
      if (!sorted.find((s) => s[0] === f)) sorted.push([f, 0.5]);
    }
  }

  return sorted.map(([name, score]) => ({
    name,
    score,
    icon: INTEL_META[name]?.icon ?? "✨",
    desc: INTEL_META[name]?.desc ?? "",
    basis: basis[name] ?? `일간 ${saju.ilgan}(${elem})`,
  }));
}

// ── 대운 타임라인 ──────────────────────────────
export interface DaeunHighlight {
  age: number;
  ageEnd: number;
  ganji: string;
  stem: string;
  branch: string;
  stemElem: string;
  branchElem: string;
  // 평가: 'gold'(빛나는) | 'good'(좋음) | 'normal' | 'caution'(주의)
  rating: "gold" | "good" | "normal" | "caution";
}

const ELEM_GENERATES: Record<string, string> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};
const ELEM_CONTROLS: Record<string, string> = {
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

/**
 * 대운 8개를 용신 기준으로 평가 — 부모 친화적으로 완화.
 * 천간 또는 지지 중 하나라도 용신과 일치 = gold
 * 천간 또는 지지가 용신을 생함 = good
 * 천간 AND 지지 둘 다 용신을 극함 = caution (조건 강화 — 한 쪽만 극이면 normal)
 * 나머지 = normal
 */
export function evaluateDaeunTimeline(saju: SajuAnalysis): DaeunHighlight[] {
  const yongsin = saju.yongsin; // 부족한 오행
  return saju.daeun.cycles.map((cycle) => {
    const stemElem = STEM_ELEM[cycle.stem] ?? "토";
    const branchElem = BRANCH_ELEM[cycle.branch] ?? "토";
    let rating: DaeunHighlight["rating"] = "normal";
    if (stemElem === yongsin || branchElem === yongsin) {
      rating = "gold";
    } else if (
      ELEM_GENERATES[stemElem] === yongsin ||
      ELEM_GENERATES[branchElem] === yongsin
    ) {
      rating = "good";
    } else if (
      // 천간 AND 지지 둘 다 극할 때만 caution (한 쪽만 극이면 normal로 둠)
      ELEM_CONTROLS[stemElem] === yongsin &&
      ELEM_CONTROLS[branchElem] === yongsin
    ) {
      rating = "caution";
    }
    return {
      age: cycle.age,
      ageEnd: cycle.age + 9,
      ganji: cycle.ganji,
      stem: cycle.stem,
      branch: cycle.branch,
      stemElem,
      branchElem,
      rating,
    };
  });
}

// ── 십성 5범주 (레이더 차트용) ──────────────────────────────
export interface SipseongCount {
  비겁: number; 식상: number; 재성: number; 관성: number; 인성: number;
}

export function getSipseongCounts(saju: SajuAnalysis): SipseongCount {
  const cat: SipseongCount = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  // 자리별 가중치 — 월지(月支)가 사주의 뿌리라 가장 강함, 일지·시지 보조
  const cl = (ss: string, weight: number = 1) => {
    if (["비견", "겁재"].includes(ss)) cat.비겁 += weight;
    else if (["식신", "상관"].includes(ss)) cat.식상 += weight;
    else if (["편재", "정재"].includes(ss)) cat.재성 += weight;
    else if (["편관", "정관"].includes(ss)) cat.관성 += weight;
    else if (["편인", "정인"].includes(ss)) cat.인성 += weight;
  };
  const ss = saju.sipseong;
  cl(ss.year.stem);          cl(ss.year.branch);            // 년주: 기본 1점
  cl(ss.month.stem);         cl(ss.month.branch, 1.5);      // 월지: ★ 가중 1.5 (격국의 뿌리)
  // 일간(日干)은 본인 자신이라 십성 대상이 아님 — 카운트하지 않음
  cl(ss.day.branch, 1.2);                                   // 일지: 가중 1.2 (배우자궁·내 마음의 자리)
  if (ss.hour) { cl(ss.hour.stem); cl(ss.hour.branch); }    // 시주: 기본 1점

  // 소수점 1자리 반올림 (UI 표시 안정화)
  for (const k of Object.keys(cat) as (keyof SipseongCount)[]) {
    cat[k] = Math.round(cat[k] * 10) / 10;
  }
  return cat;
}

export const SIPSEONG_DESC: Record<keyof SipseongCount, string> = {
  비겁: "자립·경쟁",
  식상: "표현·창의",
  재성: "돈·결과",
  관성: "절제·규율",
  인성: "학습·사색",
};

// ── 사고 유형 2x2 매트릭스 ──────────────────────────────
// y축: 논리(+) ↔ 감각(-)
// x축: 직관(-) ↔ 관계(+)
export interface ThinkingType {
  x: number;            // -1.0 ~ +1.0 (직관 ↔ 관계)
  y: number;            // -1.0 ~ +1.0 (감각 ↔ 논리)
  dominant: "논리형" | "감각형" | "직관형" | "관계형";
  desc: string;
}
export function inferThinkingType(saju: SajuAnalysis): ThinkingType {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  const logic = gwansong * 1.5 + (elem.금 ?? 0) * 0.6;
  const sense = siksang * 1.5 + (elem.화 ?? 0) * 0.6;
  const intuition = insong * 1.5 + (elem.수 ?? 0) * 0.6;
  const relation = jaesong * 1.5 + (elem.토 ?? 0) * 0.4;

  // 정규화 (-1 ~ +1)
  const yRaw = logic - sense;
  const xRaw = relation - intuition;
  const yMax = Math.max(Math.abs(yRaw), Math.abs(logic + sense), 1);
  const xMax = Math.max(Math.abs(xRaw), Math.abs(relation + intuition), 1);
  const y = Math.max(-1, Math.min(1, yRaw / yMax));
  const x = Math.max(-1, Math.min(1, xRaw / xMax));

  // 가장 큰 1개 결정
  const scores: Array<{ name: ThinkingType["dominant"]; v: number; desc: string }> = [
    { name: "논리형", v: logic, desc: "원리와 규칙을 따라 차분히 분석하는 결" },
    { name: "감각형", v: sense, desc: "보고 듣고 느낀 그대로 즉각 반응하는 결" },
    { name: "직관형", v: intuition, desc: "한눈에 본질을 꿰뚫어 보는 깊은 통찰" },
    { name: "관계형", v: relation, desc: "사람과 상황을 함께 헤아리는 마음" },
  ];
  scores.sort((a, b) => b.v - a.v);
  return { x, y, dominant: scores[0].name, desc: scores[0].desc };
}

// ── 친구 사귀는 스타일 2x2 매트릭스 ──────────────────────────────
// y축: 적극적(+) ↔ 관찰적(-)
// x축: 이끄는(-) ↔ 함께(+)
export interface FriendStyle {
  x: number;            // -1 ~ +1 (이끄는 ↔ 함께)
  y: number;            // -1 ~ +1 (관찰 ↔ 적극)
  dominant: "이끄는 결" | "중재하는 결" | "관찰하는 결" | "어우러지는 결";
  desc: string;
  basis: string;        // 📌 사주 근거 — 결정론적 한 줄 (한글 풀이 + 한자 병기)
}
export function inferFriendStyle(saju: SajuAnalysis): FriendStyle {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const isYang = ["갑", "병", "무", "경", "임"].includes(saju.ilgan);
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  const active = siksang * 1.2 + bigyeop * 0.8 + (elem.화 ?? 0) * 0.5 + (isYang ? 1 : 0);
  const observe = insong * 1.2 + (elem.수 ?? 0) * 0.6;
  const lead = bigyeop * 1.0 + gwansong * 0.6 + (isYang ? 0.5 : 0);
  const together = jaesong * 1.0 + (elem.토 ?? 0) * 0.5 + insong * 0.3;

  const yRaw = active - observe;
  const xRaw = together - lead;
  const yMax = Math.max(active + observe, Math.abs(yRaw), 1);
  const xMax = Math.max(lead + together, Math.abs(xRaw), 1);
  const y = Math.max(-1, Math.min(1, yRaw / yMax));
  const x = Math.max(-1, Math.min(1, xRaw / xMax));

  let dominant: FriendStyle["dominant"];
  let desc: string;
  let basis: string;
  // 📌 사주 근거 — 한글 풀이(한자 병기) + 결론 화살표
  const insongLabel = `받아들임의 결(印) ${insong}개`;
  const siksangLabel = `표현(食) ${siksang}개`;
  const bigyeopLabel = `자기주장(比劫) ${bigyeop}개`;
  const gwansongLabel = `책임(官) ${gwansong}개`;
  const jaesongLabel = `연결(財) ${jaesong}개`;
  if (y >= 0 && x < 0) {
    dominant = "이끄는 결";
    desc = "친구들 앞에서 방향을 세우고 분위기를 이끄는 모습";
    basis = `${bigyeopLabel} · ${gwansongLabel}\n→ 방향 세우는 리더형`;
  } else if (y >= 0 && x >= 0) {
    dominant = "중재하는 결";
    desc = "친구들 사이를 연결하고 어울려 노는 모습";
    basis = `${siksangLabel} · ${jaesongLabel}\n→ 사람 사이 잇는 중재형`;
  } else if (y < 0 && x < 0) {
    dominant = "관찰하는 결";
    desc = "한 발짝 떨어져 살피며 깊이 다가가는 모습";
    basis = `${insongLabel} · ${siksangLabel}\n→ 멀리서 살피는 관찰형`;
  } else {
    dominant = "어우러지는 결";
    desc = "조용히 곁에 머물며 자연스럽게 함께하는 모습";
    basis = `${insongLabel} · ${jaesongLabel}\n→ 곁에 머무는 동반형`;
  }
  return { x, y, dominant, desc, basis };
}

// ── 통하는 훈육 4채널 ──────────────────────────────
export interface DisciplineChannel {
  name: string;       // "단호함"
  score: number;      // 0~100
  desc: string;
}
export function inferDisciplineChannels(saju: SajuAnalysis): DisciplineChannel[] {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  // 자녀에게 통하는 훈육 = 자녀가 흡수 잘하는 결
  const raw: Record<string, { v: number; desc: string }> = {
    "단호함": { v: gwansong * 1.5 + (elem.금 ?? 0) * 0.5, desc: "분명한 선과 짧은 말이 닿는 결" },
    "부드러움": { v: insong * 1.5 + (elem.수 ?? 0) * 0.5, desc: "여유와 다정한 톤이 닿는 결" },
    "논리": { v: gwansong * 0.8 + insong * 1.0 + (elem.금 ?? 0) * 0.4, desc: "이유를 설명해주면 흡수하는 결" },
    "감정": { v: siksang * 1.2 + jaesong * 0.5 + (elem.화 ?? 0) * 0.5, desc: "감정에 이름 붙여주면 풀리는 결" },
  };
  const max = Math.max(...Object.values(raw).map((r) => r.v), 1);
  return Object.entries(raw).map(([name, r]) => ({
    name,
    score: Math.round((r.v / max) * 100),
    desc: r.desc,
  }));
}

// 📌 통하는 훈육 차트의 사주 근거 — 결정론 한 줄 (TOP1 채널 기반)
export function inferDisciplineBasis(saju: SajuAnalysis): string {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");
  // 가장 강한 채널 식별 (inferDisciplineChannels 와 동일 공식)
  const channels: Record<string, number> = {
    "단호함": gwansong * 1.5 + (elem.금 ?? 0) * 0.5,
    "부드러움": insong * 1.5 + (elem.수 ?? 0) * 0.5,
    "논리": gwansong * 0.8 + insong * 1.0 + (elem.금 ?? 0) * 0.4,
    "감정": siksang * 1.2 + jaesong * 0.5 + (elem.화 ?? 0) * 0.5,
  };
  const top = Object.entries(channels).sort((a, b) => b[1] - a[1])[0][0];
  switch (top) {
    case "단호함":
      return `책임(官) ${gwansong}개 · 금(金) ${Math.round(elem.금 ?? 0)}\n→ 분명한 선·짧은 말이 닿는 결`;
    case "부드러움":
      return `받아들임의 결(印) ${insong}개 · 수(水) ${Math.round(elem.수 ?? 0)}\n→ 다정한 톤·여유 있는 설명이 닿는 결`;
    case "논리":
      return `받아들임(印) ${insong}개 · 책임(官) ${gwansong}개\n→ 이유를 풀어주면 흡수하는 결`;
    case "감정":
      return `표현(食) ${siksang}개 · 화(火) ${Math.round(elem.화 ?? 0)}\n→ 감정에 이름 붙여주면 풀리는 결`;
    default:
      return `받아들임(印) ${insong}개 · 표현(食) ${siksang}개\n→ 자녀 결에 맞춘 톤이 가장 잘 닿음`;
  }
}

// ── 절대 하면 안 되는 5가지 — 위험도 카드 ──────────────────────────────
export interface DangerCard {
  name: string;        // 풀어쓴 이름 ("다른 아이와 비교하는 말")
  level: number;       // 1~5 (별 갯수)
  why: string;         // 짧은 이유 (한 줄)
  sajuBasis: string;   // 사주 근거 (top 2에 표시)
}
export function inferDangerCards(saju: SajuAnalysis): DangerCard[] {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  const raw: Record<string, { v: number; why: string; sajuBasis: string }> = {
    "다른 아이와 비교하는 말": {
      v: bigyeop * 1.5 + (elem.화 ?? 0) * 0.4,
      why: "자기 자존이 강한 자녀라 비교는 마음을 깊이 다칩니다",
      sajuBasis: `사주의 비겁(자기를 세우는 결)이 ${bigyeop}로 강하고 자기 자존이 단단합니다. 이 자녀는 자기 길을 스스로 인정받고 싶어해서, 다른 아이와의 비교는 그 단단한 자존을 직접 깎아내리는 칼이 됩니다.`,
    },
    "무조건적인 부정과 비난": {
      v: siksang * 1.5 + (elem.화 ?? 0) * 0.4,
      why: "표현하려는 결을 막으면 마음이 안으로 닫힙니다",
      sajuBasis: `사주의 식상(표현하는 결)이 ${siksang}로 강해 마음을 바깥으로 풀어내려는 결이 큽니다. 이 표현 욕구를 부정·비난으로 막으면 자녀는 점점 입을 닫고 안으로만 삭이게 됩니다.`,
    },
    "일방적인 강요와 지시": {
      v: bigyeop * 1.0 + (elem.목 ?? 0) * 0.5 + Math.max(0, 4 - gwansong),
      why: "자기 결대로 가고 싶은 자녀라 강요는 반발로 이어집니다",
      sajuBasis: `사주의 비겁이 ${bigyeop}이고 관성(절제하는 결)이 ${gwansong}로 자기 길을 가려는 결이 강한 편입니다. 일방적인 강요는 이 자기 결과 정면 충돌해 오히려 더 단단한 고집으로 돌아옵니다.`,
    },
    "감정을 무시하는 태도": {
      v: insong * 1.0 + jaesong * 1.0 + (elem.토 ?? 0) * 0.4,
      why: "인정받고 싶은 결이 강한 자녀라 무시는 큰 상처입니다",
      sajuBasis: `사주의 인성(${insong})과 재성(${jaesong})이 합쳐져 사람과의 결을 깊이 흡수하는 자녀입니다. 감정을 모른 척하거나 무시하면 "내 마음은 가치 없다"는 신호로 받아들여 자존감이 무너집니다.`,
    },
    "과도한 걱정과 간섭": {
      v: insong * 1.5 + (elem.수 ?? 0) * 0.5,
      why: "사색이 깊은 자녀라 부모 걱정까지 떠안으면 짓눌립니다",
      sajuBasis: `사주의 인성(사색하는 결)이 ${insong}로 강하고 마음을 깊이 곱씹는 자녀입니다. 부모의 걱정·간섭까지 무겁게 떠안으면 자기 사색의 공간이 좁아져 숨이 막히게 됩니다.`,
    },
  };
  const max = Math.max(...Object.values(raw).map((r) => r.v), 1);
  return Object.entries(raw).map(([name, r]) => ({
    name,
    level: Math.max(1, Math.min(5, Math.round((r.v / max) * 5))),
    why: r.why,
    sajuBasis: r.sajuBasis,
  }));
}

// ── 가이드 섹션 핵심 3가지 — 사주에서 본 양육 핵심 ─────────────────
export interface GuideHighlight {
  num: number;          // 1·2·3
  color: string;        // 카드 컬러
  emoji: string;
  title: string;        // "강압은 절대 통하지 않아요"
  basis: string;        // "비겁이 강해 강제할수록 정반대로 작동"
}
export function inferGuideHighlights(saju: SajuAnalysis): GuideHighlight[] {
  const ss = collectSipseong(saju);
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  // 모든 후보를 가중치로 점수 매겨 top 3 추출
  const candidates: Array<GuideHighlight & { score: number }> = [
    {
      num: 0, color: "#f87171", emoji: "⚠️",
      title: "강압은 절대 통하지 않아요",
      basis: `비겁(자기 주관)이 ${bigyeop}로 강해 강제할수록 정반대로 작동`,
      score: bigyeop * 2,
    },
    {
      num: 0, color: "#34d399", emoji: "🤲",
      title: "자율을 줄수록 협력합니다",
      basis: `식상·비겁 ${siksang + bigyeop}회 — 스스로 결정할 때 가장 빛나는 결`,
      score: siksang * 1.5 + bigyeop * 1.0,
    },
    {
      num: 0, color: "#a78bfa", emoji: "🪟",
      title: "표현 통로를 천천히 열어주세요",
      basis: siksang === 0
        ? "식상 부족 — 마음을 안으로 삭이는 결, 안전한 표현 환경이 핵심"
        : `식상 ${siksang}회 — 표현 욕구가 크니 들어주는 시간이 핵심`,
      score: 6 - siksang, // 식상 적을수록 더 핵심
    },
    {
      num: 0, color: "#60a5fa", emoji: "📋",
      title: "예측 가능한 일상이 안정을 줘요",
      basis: `관성(규율 흡수) ${gwansong}회 — 규칙적 리듬이 닿는 결`,
      score: gwansong * 1.8,
    },
    {
      num: 0, color: "#fbbf24", emoji: "🌸",
      title: "감정에 이름 붙여주세요",
      basis: `인성(흡수·곱씹는 결) ${insong}, 재성 ${jaesong} — 감정 인정이 핵심 통로`,
      score: insong * 1.3 + jaesong * 0.8,
    },
    {
      num: 0, color: "#7dd3c0", emoji: "🌱",
      title: "기다림이 가장 큰 약입니다",
      basis: `인성·관성 ${insong + gwansong}회 — 충분한 시간이 있을 때 결이 자라는 자녀`,
      score: insong * 0.8 + gwansong * 0.6,
    },
  ];
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3).map((c, i) => ({ ...c, num: i + 1 }));
}

// ── 떼·고집 4가지 트리거 — 사주에서 본 떼의 뿌리 ──────────────────
export interface TantrumTrigger {
  name: string;       // "비견·겁재 강도"
  subtitle: string;   // '"내가 옳다는 결" — 5회'
  score: number;      // 0-100
  color: string;
}
export function inferTantrumTriggers(
  saju: SajuAnalysis,
  ageStage?: "infant" | "preschool" | "elementary" | "secondary",
): TantrumTrigger[] {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const sinsal = saju.sinsal ?? [];
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");

  // 1. 비견·겁재 강도 — "내가 옳다는 결"
  const bigyeopScore = Math.min(100, Math.round((bigyeop / 5) * 100));
  // 2. 불의 결 — 감정 솟구침
  const fireMax = Math.max(elem.목 ?? 0, elem.화 ?? 0, elem.토 ?? 0, elem.금 ?? 0, elem.수 ?? 0, 1);
  const firePct = Math.round(((elem.화 ?? 0) / fireMax) * 100);
  const fireScore = Math.min(100, firePct);
  // 3. 양인살·괴강 발동 — 격발성
  const yanginActive = sinsal.includes("양인살") || sinsal.includes("괴강살");
  const yanginScore = yanginActive ? 82 : Math.min(100, Math.round((bigyeop / 4) * 60));
  // 4. 절제 회로 (土·관성) — 멈출 수 있는 힘
  // 관성(0~5)과 토 비율(0~50%)을 50/50으로 합쳐 0~100 범위로 정규화
  const toMax = elem.토 ?? 0;
  const restraintScore = Math.min(
    100,
    Math.round((Math.min(gwansong, 5) / 5) * 50 + (Math.min(toMax, 50) / 50) * 50),
  );

  // subtitle 단위 통일 — 4개 막대 모두 0~100% 로 환산해 비교 가능하게
  const yanginPhrase = yanginActive
    ? ageStage === "infant"
      ? "한 번 터지면 오래 가는 결"
      : ageStage === "preschool"
      ? "한 번 폭발하면 길어지는 떼"
      : "한 번 폭발하면 강함"
    : ageStage === "infant"
    ? "평소엔 잠잠 — 피로·졸림 누적 시"
    : "잠재 — 스트레스 누적 시";
  return [
    {
      name: "비견·겁재 강도",
      subtitle: `"내가 옳다는 결" — ${bigyeopScore}%`,
      score: bigyeopScore,
      color: "#a78bfa",
    },
    {
      name: "불의 결(火)",
      subtitle: `"감정이 뜨겁게 솟구침" — ${firePct}%`,
      score: fireScore,
      color: "#f87171",
    },
    {
      name: ageStage === "infant" ? "강한 감정 결" : ageStage === "preschool" ? "큰 떼 결" : "격렬한 감정 결",
      subtitle: `${yanginPhrase} — ${yanginScore}%`,
      score: yanginScore,
      color: "#fb7185",
    },
    {
      name: "절제 회로(土)",
      subtitle: `"멈출 수 있는 힘" — ${restraintScore}%`,
      score: restraintScore,
      color: "#fbbf24",
    },
  ];
}

// ── 친구 갈등 부모 개입 거리 (0=가까이 ~ 100=멀리) ─────────────────
export interface FriendDistance {
  position: number;    // 0~100
  label: string;       // "중간 거리 — 지켜보다 신호가 올 때만"
  basis: string;       // 사주 근거 한 줄
}
export function inferFriendDistance(saju: SajuAnalysis): FriendDistance {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");

  // 자기 주관·표현이 강하면 멀리 / 인성·수 많고 사색 깊으면 살짝 가까이
  const farScore = bigyeop * 1.5 + siksang * 1.0 + (elem.화 ?? 0) * 0.3;
  const closeScore = insong * 1.2 + (elem.수 ?? 0) * 0.4;
  const raw = farScore - closeScore; // 양수면 멀리, 음수면 가까이
  // 0~100 정규화 (50이 중간)
  const position = Math.max(15, Math.min(85, Math.round(50 + raw * 8)));

  let label: string;
  let basis: string;
  // 📌 사주 근거 — 한글 풀이(한자 병기) + 결론 화살표 (FriendStyle과 동일 포맷)
  const insongLabel = `받아들임의 결(印) ${insong}개`;
  const siksangLabel = `표현(食) ${siksang}개`;
  const bigyeopLabel = `자기주장(比劫) ${bigyeop}개`;
  if (position >= 70) {
    label = "멀리 — 자녀 스스로 풀게 두기";
    basis = `${bigyeopLabel} · ${siksangLabel}\n→ 자존이 단단해 부모 개입이 오히려 거슬림`;
  } else if (position >= 45) {
    label = "중간 거리 — 지켜보다 신호가 올 때만";
    basis = `${bigyeopLabel} · ${insongLabel}\n→ 자기주장과 사색이 균형 — 신호 올 때만`;
  } else {
    label = "가까이 — 곁에서 마음 함께 풀어주기";
    basis = `${insongLabel} · 수(水) ${Math.round(elem.수 ?? 0)}\n→ 사색 깊고 혼자 곱씹기 쉬워 곁에서 풀기`;
  }
  return { position, label, basis };
}

// ── 잠자리·식습관 4채널 게이지 ─────────────────────────────────────
export interface LifestyleChannel {
  name: string;       // "수면"
  emoji: string;
  level: "low" | "mid" | "high";  // 자녀 결의 필요도
  score: number;       // 0-100
  desc: string;        // "푹 자야 회복되는 결 — 9시간 이상 권장"
}
export function inferLifestyle(saju: SajuAnalysis): LifestyleChannel[] {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");

  // 수면 — 인성·수 많으면 깊은 잠 필요
  const sleepNeed = (insong * 1.5 + (elem.수 ?? 0) * 0.8) / 6;
  const sleepScore = Math.min(100, Math.round(60 + sleepNeed * 25));
  // 식사 — 토 많으면 안정 / 적으면 변화 필요
  const earth = elem.토 ?? 0;
  const mealScore = earth >= 2 ? Math.min(100, 50 + earth * 10) : Math.min(100, 75 + (3 - earth) * 5);
  // 움직임 — 화·목·비겁 많으면 활동량 多
  const moveNeed = ((elem.화 ?? 0) * 0.7 + (elem.목 ?? 0) * 0.5 + bigyeop * 0.6) / 6;
  const moveScore = Math.min(100, Math.round(50 + moveNeed * 35));
  // 디지털 — 식상·화 많으면 유의 (자극에 빨림)
  const digitalRisk = (siksang * 1.0 + (elem.화 ?? 0) * 0.6) / 5;
  const digitalScore = Math.min(100, Math.round(40 + digitalRisk * 40));

  const lvl = (s: number): "low" | "mid" | "high" => (s >= 70 ? "high" : s >= 45 ? "mid" : "low");

  return [
    {
      name: "수면",
      emoji: "🌙",
      score: sleepScore,
      level: lvl(sleepScore),
      desc: insong >= 2
        ? "사색이 깊은 결 — 충분한 잠(9시간↑)이 회복의 핵심"
        : "보통 권장 — 8~9시간 규칙적 잠이 안정을 줍니다",
    },
    {
      name: "식사",
      emoji: "🍚",
      score: mealScore,
      level: lvl(mealScore),
      desc: earth >= 2
        ? "안정형 — 같은 시간·같은 자리에서 먹을 때 마음도 안정"
        : "변화형 — 새로운 메뉴·다양한 색깔이 식욕을 자극",
    },
    {
      name: "움직임",
      emoji: "🏃",
      score: moveScore,
      level: lvl(moveScore),
      desc: moveScore >= 70
        ? "에너지 큰 결 — 매일 30분 이상 몸 쓰는 활동 필요"
        : "차분한 결 — 무리한 활동보다 가벼운 산책·스트레칭이 맞음",
    },
    {
      name: "디지털",
      emoji: "📱",
      score: digitalScore,
      level: lvl(digitalScore),
      desc: digitalScore >= 70
        ? "자극에 빠지기 쉬운 결 — 하루 1시간 이내, 잠 1시간 전 차단"
        : "비교적 안전한 결 — 1.5~2시간 이내 자기 조절 연습",
    },
  ];
}

// ── 디지털·미디어 안전·위험 게이지 ─────────────────────────────────
export interface DigitalGauge {
  safeMin: number;     // 권장 분
  safeMax: number;
  riskLevel: number;   // 0-100
  riskLabel: "낮음" | "보통" | "높음";
  basis: string;
}
export function inferDigitalGauge(saju: SajuAnalysis, ageCap?: number): DigitalGauge {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const siksang = countAny(ss, "식신", "상관");
  const fire = elem.화 ?? 0;

  // 자극 흡수율: 불의 결 + 식상이 클수록 빨림
  const absorb = fire * 1.0 + siksang * 0.8;
  const riskLevel = Math.min(100, Math.round((absorb / 6) * 100));
  let riskLabel: "낮음" | "보통" | "높음";
  let safeMin: number, safeMax: number;
  let basis: string;
  // 📌 사주 근거 — 한글 풀이(한자 병기) + 결론 화살표 (통일 포맷)
  const fireLabel = `불의 결(火) ${Math.round(fire)}`;
  const siksangLabel = `표현(食) ${siksang}개`;
  if (riskLevel >= 70) {
    riskLabel = "높음";
    safeMin = 30; safeMax = 60;
    basis = `${fireLabel} · ${siksangLabel}\n→ 자극에 즉각 빨려 들어가 — 짧고 끊는 사용 필수`;
  } else if (riskLevel >= 40) {
    riskLabel = "보통";
    safeMin = 60; safeMax = 90;
    basis = `${fireLabel} · ${siksangLabel}\n→ 자극과 차분함 균형 — 정해진 시간·콘텐츠로 자율 연습`;
  } else {
    riskLabel = "낮음";
    safeMin = 90; safeMax = 120;
    basis = `${fireLabel} · ${siksangLabel}\n→ 자극에 차분한 결 — 도구로 잘 활용 가능`;
  }
  // 발달 단계 상한(보건복지부 권고) 적용 — 영아 30/유아 60/초등 120/중고등 180
  if (typeof ageCap === "number" && ageCap > 0) {
    if (safeMax > ageCap) safeMax = ageCap;
    if (safeMin > ageCap) safeMin = Math.max(0, ageCap - 30);
  }
  return { safeMin, safeMax, riskLevel, riskLabel, basis };
}

// ── 진로 6각형 레이더 ──────────────────────────────
export interface JobRadarItem {
  name: string;        // "만드는 결" 등
  shortName: string;   // "만들기"
  score: number;       // 0~100
  desc: string;        // 한 줄
}
export function inferJobRadar(saju: SajuAnalysis): JobRadarItem[] {
  const ss = collectSipseong(saju);
  const elem = saju.elements as Record<string, number>;
  const stemElem = STEM_ELEM[saju.ilgan] ?? "수";
  const isYang = ["갑", "병", "무", "경", "임"].includes(saju.ilgan);

  const insong = countAny(ss, "편인", "정인");
  const siksang = countAny(ss, "식신", "상관");
  const bigyeop = countAny(ss, "비견", "겁재");
  const gwansong = countAny(ss, "편관", "정관");
  const jaesong = countAny(ss, "편재", "정재");

  const raw: Record<string, number> = {
    "만드는 결":   bigyeop * 1.2 + (elem.토 ?? 0) * 0.5 + (elem.금 ?? 0) * 0.4,
    "탐구하는 결": insong * 1.5 + (elem.수 ?? 0) * 0.6,
    "표현하는 결": siksang * 1.5 + (elem.화 ?? 0) * 0.5,
    "돕는 결":     jaesong * 1.0 + bigyeop * 0.5 + (elem.토 ?? 0) * 0.4,
    "이끄는 결":   bigyeop * 1.0 + gwansong * 0.8 + (isYang ? 1.5 : 0),
    "정리하는 결": gwansong * 1.5 + (elem.금 ?? 0) * 0.5,
  };
  // 일간 보강
  if (stemElem === "목") { raw["탐구하는 결"] += 0.5; raw["만드는 결"] += 0.3; }
  if (stemElem === "화") { raw["표현하는 결"] += 0.8; raw["이끄는 결"] += 0.4; }
  if (stemElem === "토") { raw["돕는 결"] += 0.8; raw["만드는 결"] += 0.4; }
  if (stemElem === "금") { raw["정리하는 결"] += 0.8; raw["만드는 결"] += 0.3; }
  if (stemElem === "수") { raw["탐구하는 결"] += 0.8; }

  // 정규화 (max → 100)
  const maxV = Math.max(...Object.values(raw), 1);
  const desc: Record<string, { short: string; line: string }> = {
    "만드는 결":   { short: "만들기",   line: "손과 몸으로 무엇을 만들어내는 결" },
    "탐구하는 결": { short: "탐구",     line: "원리와 답을 깊이 파고드는 결" },
    "표현하는 결": { short: "표현",     line: "마음을 그림·말·소리로 풀어내는 결" },
    "돕는 결":     { short: "돕기",     line: "사람을 보살피고 함께하는 결" },
    "이끄는 결":   { short: "리더",     line: "앞에 서서 방향을 세우는 결" },
    "정리하는 결": { short: "정리",     line: "흩어진 것을 질서 있게 다듬는 결" },
  };
  const ORDER = ["만드는 결", "탐구하는 결", "표현하는 결", "돕는 결", "이끄는 결", "정리하는 결"];
  return ORDER.map((name) => ({
    name,
    shortName: desc[name].short,
    score: Math.round((raw[name] / maxV) * 100),
    desc: desc[name].line,
  }));
}

// ──────────────────────────────────────────────────────────────────
// 부모-자녀 비교 추론 (PART 4 / PART 5 시각화용)
// ──────────────────────────────────────────────────────────────────

const ELEM_KOR: Record<string, { kor: string; emoji: string }> = {
  목: { kor: "나무의 결", emoji: "🌱" },
  화: { kor: "불의 결", emoji: "🔥" },
  토: { kor: "흙의 결", emoji: "⛰️" },
  금: { kor: "쇠의 결", emoji: "🪨" },
  수: { kor: "물의 결", emoji: "💧" },
};

// ── 오행 분포 비교 (parent vs child) ─────────────────────────────
export interface ElementCompare {
  parent: { 목: number; 화: number; 토: number; 금: number; 수: number };
  child: { 목: number; 화: number; 토: number; 금: number; 수: number };
  similar: { elem: string; kor: string; emoji: string };       // 가장 닮은 오행
  different: { elem: string; kor: string; emoji: string };     // 가장 차이나는 오행
  parentStrong: { elem: string; kor: string; emoji: string };  // 부모만 강한 오행
  childStrong: { elem: string; kor: string; emoji: string };   // 자녀만 강한 오행
}
export function inferElementCompare(parent: SajuAnalysis, child: SajuAnalysis): ElementCompare {
  // 백분율 정규화
  const norm = (e: SajuAnalysis["elements"]) => {
    const total = (e.목 ?? 0) + (e.화 ?? 0) + (e.토 ?? 0) + (e.금 ?? 0) + (e.수 ?? 0) || 1;
    return {
      목: Math.round(((e.목 ?? 0) / total) * 100),
      화: Math.round(((e.화 ?? 0) / total) * 100),
      토: Math.round(((e.토 ?? 0) / total) * 100),
      금: Math.round(((e.금 ?? 0) / total) * 100),
      수: Math.round(((e.수 ?? 0) / total) * 100),
    };
  };
  const p = norm(parent.elements);
  const c = norm(child.elements);
  const ELEMS = ["목", "화", "토", "금", "수"] as const;

  // 가장 닮은 오행 (절대차이 최소·둘 다 5+ 이상)
  let similarElem: string = "토", similarDiff = 999;
  for (const e of ELEMS) {
    const diff = Math.abs(p[e] - c[e]);
    if ((p[e] >= 5 || c[e] >= 5) && diff < similarDiff) { similarDiff = diff; similarElem = e; }
  }
  // 가장 차이나는 오행
  let diffElem: string = "수", maxDiff = 0;
  for (const e of ELEMS) {
    const diff = Math.abs(p[e] - c[e]);
    if (diff > maxDiff) { maxDiff = diff; diffElem = e; }
  }
  // 부모만 강한 / 자녀만 강한
  let pStrongElem = "토", pStrong = 0;
  let cStrongElem = "토", cStrong = 0;
  for (const e of ELEMS) {
    const pAdv = p[e] - c[e];
    const cAdv = c[e] - p[e];
    if (pAdv > pStrong) { pStrong = pAdv; pStrongElem = e; }
    if (cAdv > cStrong) { cStrong = cAdv; cStrongElem = e; }
  }
  const wrap = (e: string) => ({ elem: e, kor: ELEM_KOR[e].kor, emoji: ELEM_KOR[e].emoji });
  return {
    parent: p, child: c,
    similar: wrap(similarElem),
    different: wrap(diffElem),
    parentStrong: wrap(pStrongElem),
    childStrong: wrap(cStrongElem),
  };
}

// ── 일간 관계의 결 (생/극/비화) ─────────────────────────────────
export interface IlganRelation {
  parentStem: string;       // "갑"
  parentHanja: string;       // "甲"
  parentElem: string;        // "목"
  parentKor: string;         // "나무의 결"
  childStem: string;
  childHanja: string;
  childElem: string;
  childKor: string;
  type: "생" | "극" | "비화";  // 관계 종류
  direction: "→" | "←" | "↔" | "=";
  label: string;             // "엄마가 아이를 키우는 결" 같은 부드러운 라벨
  color: string;             // 관계별 색깔
  emoji: string;
  sameYinYang: boolean;      // 음양 일치 여부 (비화일 때 의미)
  detail: string;            // 한 단락 풀이
}
const STEM_HANJA_MAP: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
const YANG_STEMS = ["갑", "병", "무", "경", "임"];
const ELEM_GEN: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const ELEM_CTL: Record<string, string> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export function inferIlganRelation(parent: SajuAnalysis, child: SajuAnalysis, parentLabel: string = "부모"): IlganRelation {
  const pStem = parent.ilgan, cStem = child.ilgan;
  const pElem = STEM_ELEM[pStem] ?? "토";
  const cElem = STEM_ELEM[cStem] ?? "토";
  const pYang = YANG_STEMS.includes(pStem);
  const cYang = YANG_STEMS.includes(cStem);
  const sameYinYang = pYang === cYang;

  let type: IlganRelation["type"];
  let direction: IlganRelation["direction"];
  let label: string;
  let color: string;
  let emoji: string;
  let detail: string;

  if (pElem === cElem) {
    // 비화 — 자원 프레임: 비춰주는·풀어내는
    type = "비화";
    direction = sameYinYang ? "=" : "↔";
    color = "#a78bfa";
    emoji = "🪞";
    label = sameYinYang
      ? "닮은 결로 서로를 비춰주는 사이"
      : "같은 본질을 다른 길로 풀어내는 사이";
    detail = sameYinYang
      ? `${parentLabel}와 아이 모두 ${ELEM_KOR[pElem].kor}의 본질을 지녔습니다. 같은 방향을 보고 같은 방식으로 마음을 쓰는 깊은 동행입니다.`
      : `같은 ${ELEM_KOR[pElem].kor}의 본질을 서로 다른 길로 풀어내는 사이입니다. 닮음 속의 다름이 서로의 결을 더 풍부하게 만들어 줍니다.`;
  } else if (ELEM_GEN[pElem] === cElem) {
    // 부모 → 자녀 (생) — 자원 프레임: 키워주는
    type = "생"; direction = "→";
    color = "#34d399"; emoji = "🌱";
    label = `${ELEM_KOR[pElem].kor}이 ${ELEM_KOR[cElem].kor}을 키워주는 결`;
    detail = `${parentLabel}의 ${ELEM_KOR[pElem].kor}이 아이의 ${ELEM_KOR[cElem].kor}을 자연스럽게 키워주는 사이입니다. 가만히 있어도 따뜻한 흐름이 ${parentLabel}에서 자녀로 흘러갑니다.`;
  } else if (ELEM_GEN[cElem] === pElem) {
    // 자녀 → 부모 (생) — 자원 프레임: 새 활력 채워주는
    type = "생"; direction = "←";
    color = "#7dd3c0"; emoji = "🌿";
    label = `아이의 ${ELEM_KOR[cElem].kor}이 ${parentLabel}에게 새 활력을 채워주는 결`;
    detail = `아이의 ${ELEM_KOR[cElem].kor}이 ${parentLabel}에게 새로운 활력을 채워주는 사이입니다. 자녀에게서 ${parentLabel}가 함께 회복하고 자라는 흐름이 자연스럽게 흘러갑니다.`;
  } else if (ELEM_CTL[pElem] === cElem) {
    // 부모 → 자녀 (극) — 자원 프레임 + X3 조건 명시 (명리 진실 일부 보존)
    type = "극"; direction = "→";
    color = "#fbbf24"; emoji = "🌳";
    label = `${ELEM_KOR[pElem].kor}이 ${ELEM_KOR[cElem].kor}에 단단한 뿌리가 되어주는 결`;
    detail = `${parentLabel}의 곧은 ${ELEM_KOR[pElem].kor}과 아이의 유연한 ${ELEM_KOR[cElem].kor}이 만나, 적절히 닿으면 단단한 뿌리가 되어주는 사이입니다. 자녀의 페이스에 맞춰 다가가실 때 깊은 가르침이 되어 자녀의 결이 단단하게 자라납니다.`;
  } else if (ELEM_CTL[cElem] === pElem) {
    // 자녀 → 부모 (극) — 자원 프레임 + X3 조건 명시
    type = "극"; direction = "←";
    color = "#fb923c"; emoji = "✨";
    label = `아이의 ${ELEM_KOR[cElem].kor}이 ${parentLabel}에게 새 시야를 열어주는 결`;
    detail = `아이의 ${ELEM_KOR[cElem].kor}과 ${parentLabel}의 ${ELEM_KOR[pElem].kor}이 만나, 자연스럽게 닿을 때 새로운 시야가 서로에게 열리는 사이입니다. ${parentLabel}가 자녀에게서 자기 결을 다시 발견하고 함께 자라나는 동행입니다.`;
  } else {
    // 기본 (이론적으로 불가)
    type = "비화"; direction = "↔";
    color = "#94a3b8"; emoji = "✨";
    label = "서로 다른 결을 가진 사이";
    detail = "서로 다른 본질을 지녀 보완해 가는 사이입니다.";
  }

  return {
    parentStem: pStem,
    parentHanja: STEM_HANJA_MAP[pStem] ?? pStem,
    parentElem: pElem,
    parentKor: ELEM_KOR[pElem].kor,
    childStem: cStem,
    childHanja: STEM_HANJA_MAP[cStem] ?? cStem,
    childElem: cElem,
    childKor: ELEM_KOR[cElem].kor,
    type, direction, label, color, emoji, sameYinYang, detail,
  };
}

// ── 채워주는 / 부족한 기운 흐름 ────────────────────────────────
export interface FlowGiven {
  parentGives: Array<{ elem: string; kor: string; emoji: string; intensity: number }>; // 부모가 자녀에게 흘려주는 오행
  bothLack: Array<{ elem: string; kor: string; emoji: string }>;                       // 둘 다 약한 오행
  // 두 분 입력 시 겹침/보완 라벨
  overlapLabel?: string;       // "엄마와 아빠가 같이 채우는 기운"
  complementLabel?: string;    // "엄마는 ~, 아빠는 ~ 다른 결로 보완"
}
export function inferFlowGiven(
  parent: SajuAnalysis,
  child: SajuAnalysis,
  otherParent?: SajuAnalysis | null,
): FlowGiven {
  const norm = (e: SajuAnalysis["elements"]) => {
    const total = (e.목 ?? 0) + (e.화 ?? 0) + (e.토 ?? 0) + (e.금 ?? 0) + (e.수 ?? 0) || 1;
    return {
      목: ((e.목 ?? 0) / total) * 100,
      화: ((e.화 ?? 0) / total) * 100,
      토: ((e.토 ?? 0) / total) * 100,
      금: ((e.금 ?? 0) / total) * 100,
      수: ((e.수 ?? 0) / total) * 100,
    } as Record<string, number>;
  };
  const p = norm(parent.elements);
  const c = norm(child.elements);
  const ELEMS = ["목", "화", "토", "금", "수"];

  // 부모가 자녀에게 채워줌: 부모는 충분(15+)이고 자녀는 부족(15-)
  const parentGives: FlowGiven["parentGives"] = [];
  const bothLack: FlowGiven["bothLack"] = [];
  for (const e of ELEMS) {
    if (p[e] >= 18 && c[e] < 15) {
      parentGives.push({ elem: e, kor: ELEM_KOR[e].kor, emoji: ELEM_KOR[e].emoji, intensity: Math.round(p[e] - c[e]) });
    }
    if (p[e] < 12 && c[e] < 12) {
      bothLack.push({ elem: e, kor: ELEM_KOR[e].kor, emoji: ELEM_KOR[e].emoji });
    }
  }
  parentGives.sort((a, b) => b.intensity - a.intensity);

  // 두 분 입력 시 — 다른 부모가 채우는 기운과 겹침/보완
  let overlapLabel: string | undefined, complementLabel: string | undefined;
  if (otherParent) {
    const o = norm(otherParent.elements);
    const otherGives: string[] = [];
    for (const e of ELEMS) {
      if (o[e] >= 18 && c[e] < 15) otherGives.push(e);
    }
    const myGives = parentGives.map((g) => g.elem);
    const overlap = myGives.filter((e) => otherGives.includes(e));
    const onlyMine = myGives.filter((e) => !otherGives.includes(e));
    if (overlap.length > 0) {
      overlapLabel = `${overlap.map((e) => ELEM_KOR[e].kor).join("·")} — 두 분이 함께 채워주는 결`;
    }
    if (onlyMine.length > 0) {
      complementLabel = `${onlyMine.map((e) => ELEM_KOR[e].kor).join("·")} — 다른 부모와 다르게 보완하는 결`;
    }
  }

  return { parentGives, bothLack, overlapLabel, complementLabel };
}
