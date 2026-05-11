// ════════════════════════════════════════════════════════════════════
// 세운(歲運) 분석 — 매년의 운기. 현재 년도 천간·지지가 사주에 미치는 영향
// 자평진전·적천수 정통 — 대운 안에서 세운 결합으로 1년 단위 흐름.
//
// 분석:
//   1. 세운 천간 → 일간 기준 십성
//   2. 세운 지지 → 사주 4지지와 합·충·원진 결합
//   3. 세운 천간이 사주 천간과 합·충 있는지
//   4. 종합 점수 (긍정·중립·부정)
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

const STEM_ELEM_SE: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};
const YANG_STEMS_SE = new Set(["갑", "병", "무", "경", "임"]);

// 60갑자 순서 (2024년 = 갑진 기준)
const STEMS_60 = ["갑","을","병","정","무","기","경","신","임","계"];
const BRANCHES_60 = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

const STEM_CHUNG_SE: Record<string, string> = {
  갑: "경", 경: "갑", 을: "신", 신: "을",
  병: "임", 임: "병", 정: "계", 계: "정",
};
const STEM_HAP_SE: Record<string, { partner: string; element: string }> = {
  갑: { partner: "기", element: "토" },
  기: { partner: "갑", element: "토" },
  을: { partner: "경", element: "금" },
  경: { partner: "을", element: "금" },
  병: { partner: "신", element: "수" },
  신: { partner: "병", element: "수" },
  정: { partner: "임", element: "목" },
  임: { partner: "정", element: "목" },
  무: { partner: "계", element: "화" },
  계: { partner: "무", element: "화" },
};
const BRANCH_CHUNG_SE: Record<string, string> = {
  자: "오", 오: "자", 축: "미", 미: "축",
  인: "신", 신: "인", 묘: "유", 유: "묘",
  진: "술", 술: "진", 사: "해", 해: "사",
};
const BRANCH_HAP_SE: Record<string, string> = {
  자: "축", 축: "자", 인: "해", 해: "인",
  묘: "술", 술: "묘", 진: "유", 유: "진",
  사: "신", 신: "사", 오: "미", 미: "오",
};
const BRANCH_WONJIN_SE: Record<string, string> = {
  자: "미", 미: "자", 축: "오", 오: "축",
  인: "유", 유: "인", 묘: "신", 신: "묘",
  진: "해", 해: "진", 사: "술", 술: "사",
};

function sipseongOf(ilgan: string, otherStem: string): string {
  const ilElem = STEM_ELEM_SE[ilgan];
  const otherElem = STEM_ELEM_SE[otherStem];
  if (!ilElem || !otherElem) return "비견";
  const sameYinYang = YANG_STEMS_SE.has(ilgan) === YANG_STEMS_SE.has(otherStem);
  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  if (otherElem === ilElem) return sameYinYang ? "비견" : "겁재";
  if (generates[ilElem] === otherElem) return sameYinYang ? "식신" : "상관";
  if (controls[ilElem] === otherElem) return sameYinYang ? "편재" : "정재";
  if (controls[otherElem] === ilElem) return sameYinYang ? "편관" : "정관";
  return sameYinYang ? "편인" : "정인";
}

// 년도 → 갑자 변환 (입춘 무시 단순 산법, 대략 정확 ±1일 오차)
// 1984년 = 갑자 기준. (year - 1984) % 60
export function yearToGanji(year: number): { stem: string; branch: string; ganji: string } {
  const offset = ((year - 1984) % 60 + 60) % 60;
  const stem = STEMS_60[offset % 10];
  const branch = BRANCHES_60[offset % 12];
  return { stem, branch, ganji: stem + branch };
}

export interface SeunResult {
  year: number;
  ganji: string;       // "병오"
  stem: string;
  branch: string;
  cheongan_sip: string;     // 세운 천간이 일간에게 작용하는 십성
  branch_relations: string[];  // ["일지 자축 합", "월지 인신 충", ...]
  stem_relations: string[];    // ["일간과 정관", "월간과 갑경 충", ...]
  net_score: number;           // 긍정 - 부정 (-10 ~ +10)
  tone: "강한 호운" | "보통 호운" | "중립" | "보통 흉운" | "강한 흉운";
  detail: string;
}

export function deriveSeun(saju: SajuAnalysis, currentYear: number): SeunResult {
  const { stem: yearStem, branch: yearBranch, ganji } = yearToGanji(currentYear);
  const ilgan = saju.ilgan;

  // 1. 세운 천간 → 일간 기준 십성
  const cheonganSip = sipseongOf(ilgan, yearStem);

  // 2. 세운 지지 vs 사주 4지지 합·충·원진
  const branchRelations: string[] = [];
  const sajuBranches: { pos: string; b: string }[] = [
    { pos: "년지", b: saju.pillars.year.branch },
    { pos: "월지", b: saju.pillars.month.branch },
    { pos: "일지", b: saju.pillars.day.branch },
  ];
  if (saju.pillars.hour) sajuBranches.push({ pos: "시지", b: saju.pillars.hour.branch });

  let branchScore = 0;
  for (const sb of sajuBranches) {
    if (BRANCH_CHUNG_SE[yearBranch] === sb.b) {
      branchRelations.push(`${sb.pos} ${sb.b}와 충 (불안정)`);
      branchScore -= sb.pos === "일지" ? 3 : 2;
    }
    if (BRANCH_HAP_SE[yearBranch] === sb.b) {
      branchRelations.push(`${sb.pos} ${sb.b}와 육합 (안정·관계 결)`);
      branchScore += sb.pos === "일지" ? 3 : 2;
    }
    if (BRANCH_WONJIN_SE[yearBranch] === sb.b) {
      branchRelations.push(`${sb.pos} ${sb.b}와 원진 (감정 자극)`);
      branchScore -= sb.pos === "일지" ? 2 : 1;
    }
  }

  // 3. 세운 천간 vs 사주 천간 합·충
  const stemRelations: string[] = [];
  const sajuStems: { pos: string; s: string }[] = [
    { pos: "년간", s: saju.pillars.year.stem },
    { pos: "월간", s: saju.pillars.month.stem },
  ];
  if (saju.pillars.hour) sajuStems.push({ pos: "시간", s: saju.pillars.hour.stem });

  let stemScore = 0;
  // 일간과 세운 천간 관계 (식상·재성·관성·인성·비겁 점수)
  const sipScore: Record<string, number> = {
    정관: 2, 정재: 2, 정인: 2, 식신: 2, 비견: 1,
    편관: 1, 편재: 1, 편인: 0, 상관: -1, 겁재: -1,
  };
  stemScore += sipScore[cheonganSip] ?? 0;
  stemRelations.push(`일간과 ${cheonganSip} (${(sipScore[cheonganSip] ?? 0) >= 0 ? "긍정" : "부정"})`);

  for (const ss of sajuStems) {
    if (STEM_CHUNG_SE[yearStem] === ss.s) {
      stemRelations.push(`${ss.pos} ${ss.s}와 천간 충`);
      stemScore -= 2;
    }
    if (STEM_HAP_SE[yearStem]?.partner === ss.s) {
      stemRelations.push(`${ss.pos} ${ss.s}와 천간 합`);
      stemScore += 1;
    }
  }

  const netScore = stemScore + branchScore;
  let tone: SeunResult["tone"];
  if (netScore >= 5) tone = "강한 호운";
  else if (netScore >= 2) tone = "보통 호운";
  else if (netScore >= -1) tone = "중립";
  else if (netScore >= -4) tone = "보통 흉운";
  else tone = "강한 흉운";

  const detail = `${currentYear}년(${ganji}년) — 일간과 ${cheonganSip}, 점수 ${netScore} (${tone})`;

  return {
    year: currentYear,
    ganji,
    stem: yearStem,
    branch: yearBranch,
    cheongan_sip: cheonganSip,
    branch_relations: branchRelations,
    stem_relations: stemRelations,
    net_score: netScore,
    tone,
    detail,
  };
}
