// ════════════════════════════════════════════════════════════════════
// 통근(通根) 분석 — 일간이 지지에 같은 오행으로 뿌리 내림
// 자평진전 정통 — 통근 강도가 일간 강약·신강신약의 핵심.
//
// 통근 강도:
//   본기 통근 = +3.0 (지지 본기 = 일간 오행)
//   중기 통근 = +1.5
//   여기 통근 = +0.7
//   투간 보정: 그 천간이 사주에 투출되었으면 ×1.3 (뿌리·줄기 모두 단단)
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

const STEM_ELEM_TG: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

// 지장간 (월지·년지·일지·시지 모두 같은 매핑)
const BRANCH_JIJANGGAN_TG: Record<string, { 본기: string; 중기?: string; 여기?: string }> = {
  자: { 본기: "계" },
  축: { 본기: "기", 중기: "계", 여기: "신" },
  인: { 본기: "갑", 중기: "병", 여기: "무" },
  묘: { 본기: "을" },
  진: { 본기: "무", 중기: "을", 여기: "계" },
  사: { 본기: "병", 중기: "무", 여기: "경" },
  오: { 본기: "정", 중기: "기" },
  미: { 본기: "기", 중기: "정", 여기: "을" },
  신: { 본기: "경", 중기: "임", 여기: "무" },
  유: { 본기: "신" },
  술: { 본기: "무", 중기: "신", 여기: "정" },
  해: { 본기: "임", 중기: "갑" },
};

export interface TonggeunResult {
  totalScore: number;             // 통근 총점 (높을수록 일간 단단)
  level: "튼튼" | "보통" | "약함" | "고립";
  positions: { pillar: "year" | "month" | "day" | "hour"; branch: string; tier: "본기" | "중기" | "여기"; stem: string; score: number }[];
  detail: string;
  hasBongi: boolean;              // 본기 통근 1개 이상
  recommendation: string;
}

export function deriveTonggeun(saju: SajuAnalysis): TonggeunResult {
  const ilgan = saju.ilgan;
  const ilElem = STEM_ELEM_TG[ilgan] ?? "토";

  // 사주 천간 (투간 보정용 — 일간 제외)
  const allStems = [
    saju.pillars.year.stem, saju.pillars.month.stem,
    ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
  ];

  const positions: TonggeunResult["positions"] = [];
  const checkBranch = (pillar: "year" | "month" | "day" | "hour", branch: string | undefined) => {
    if (!branch) return;
    const jjg = BRANCH_JIJANGGAN_TG[branch];
    if (!jjg) return;

    // 본기 검사
    if (STEM_ELEM_TG[jjg.본기] === ilElem) {
      let score = 3.0;
      if (allStems.includes(jjg.본기)) score *= 1.3;  // 투간 보정
      // 월지·일지 가중
      if (pillar === "month") score *= 1.3;
      if (pillar === "day") score *= 1.2;
      positions.push({ pillar, branch, tier: "본기", stem: jjg.본기, score });
    }
    // 중기 검사
    if (jjg.중기 && STEM_ELEM_TG[jjg.중기] === ilElem) {
      let score = 1.5;
      if (allStems.includes(jjg.중기)) score *= 1.3;
      if (pillar === "month") score *= 1.3;
      if (pillar === "day") score *= 1.2;
      positions.push({ pillar, branch, tier: "중기", stem: jjg.중기, score });
    }
    // 여기 검사
    if (jjg.여기 && STEM_ELEM_TG[jjg.여기] === ilElem) {
      let score = 0.7;
      if (allStems.includes(jjg.여기)) score *= 1.3;
      if (pillar === "month") score *= 1.3;
      if (pillar === "day") score *= 1.2;
      positions.push({ pillar, branch, tier: "여기", stem: jjg.여기, score });
    }
  };

  checkBranch("year", saju.pillars.year.branch);
  checkBranch("month", saju.pillars.month.branch);
  checkBranch("day", saju.pillars.day.branch);
  checkBranch("hour", saju.pillars.hour?.branch);

  const totalScore = positions.reduce((a, b) => a + b.score, 0);
  const hasBongi = positions.some(p => p.tier === "본기");

  let level: TonggeunResult["level"];
  if (totalScore >= 6.0) level = "튼튼";
  else if (totalScore >= 3.0) level = "보통";
  else if (totalScore >= 1.0) level = "약함";
  else level = "고립";

  const detail = positions.length === 0
    ? `일간 ${ilgan}(${ilElem}) — 4지지에 ${ilElem} 오행 통근 자리 없음 — 고립`
    : `일간 ${ilgan}(${ilElem}) 통근 ${positions.length}자리 (${positions.map(p => `${p.pillar}支 ${p.branch} ${p.tier}`).join("·")}) — 총점 ${totalScore.toFixed(1)}`;

  const recommendation = (() => {
    if (level === "튼튼") return "일간 뿌리 깊고 자기 결 흔들림 없음 — 신강 경향";
    if (level === "보통") return "통근 적당 — 균형형, 외부 결 받아들이며 자기 결 유지";
    if (level === "약함") return "뿌리 옅음 — 외부 받침(인성·비겁) 있어야 자라남";
    return "고립 — 종격 흐름 가능성. 강한 십성에 따르는 결";
  })();

  return { totalScore: Math.round(totalScore * 10) / 10, level, positions, detail, hasBongi, recommendation };
}
