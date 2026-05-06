// 인연 6점수 산출 — calcCompatibility 결과를 6개 영역으로 재가중치
// (격리: lib/saju-calculator의 read-only 타입만 사용)
import type { CompatibilityResult, SajuAnalysis } from "../saju-calculator";

export interface InyeonScores {
  inyeon: number;        // 2장
  seonggyeok: number;    // 3장
  emotion: number;       // 4장
  physical: number;      // 5장
  finance: number;       // 6장
  marriage: number;      // 7장
}

function clamp(n: number, lo = 10, hi = 99): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function scoreLabel(s: number): string {
  if (s >= 70) return "운명적인 궁합이에요";
  if (s >= 40) return "괜찮은 궁합이에요";
  return "개선 여지가 있어요";
}

// 일간 관계 가중치
function ilganWeight(rel: string): number {
  if (rel.includes("비화")) return 60;
  if (rel.includes("상생 (상대가")) return 80;     // 받는 쪽
  if (rel.includes("상생 (당신이")) return 72;     // 주는 쪽
  if (rel.includes("상극 (상대가")) return 30;
  return 35;
}

// 오행 보완도 (서로 채워주는 정도)
function elementBalanceScore(c: CompatibilityResult): number {
  const aHelps = c.elementBalance.aHelpsB.length;
  const bHelps = c.elementBalance.bHelpsA.length;
  const sharedWeak = c.elementBalance.sharedWeak.length;
  return clamp(50 + aHelps * 8 + bHelps * 8 - sharedWeak * 6);
}

// 지지 관계 보너스 (삼합·육합 +, 충 −)
function branchBonus(c: CompatibilityResult): number {
  const samhap = c.branchRelations.samhap.length * 10;
  const yukhap = c.branchRelations.yukhap.length * 6;
  const chung = c.branchRelations.chung.length * 8;
  return samhap + yukhap - chung;
}

// 신살 공유 — 깊은 인연 신호
function sharedSinsalBonus(c: CompatibilityResult): number {
  return Math.min(c.sharedSinsal.length * 5, 15);
}

export function computeInyeonScores(
  a: SajuAnalysis,
  b: SajuAnalysis,
  compat: CompatibilityResult,
): InyeonScores {
  const ilgan = ilganWeight(compat.ilganRelation);
  const elem = elementBalanceScore(compat);
  const branch = branchBonus(compat);
  const sinsal = sharedSinsalBonus(compat);

  // 2장 인연 — compat.score 그대로 (이미 종합)
  const inyeon = clamp(compat.score);

  // 3장 성격 — 일간 관계 비중 ↑
  const seonggyeok = clamp(ilgan * 0.7 + elem * 0.3 + branch * 0.2);

  // 4장 감정 — 신살·일지·원진 중심 (sinsal + branch에 가중)
  const emotion = clamp(50 + branch * 0.6 + sinsal - (compat.weaknesses.length * 4));

  // 5장 체질 — 오행 보완 핵심
  const physical = clamp(elem * 0.8 + ilgan * 0.2 + branch * 0.15);

  // 6장 재물 — 오행 균형 + 일간(받는 쪽 가산)
  const aIsReceiving = compat.ilganRelation.includes("상생 (상대가");
  const finance = clamp(elem * 0.6 + ilgan * 0.4 + (aIsReceiving ? 8 : 0));

  // 7장 혼인 — 인연 + 성격 + 신살 종합 (현실적 결합 가중)
  const marriage = clamp(inyeon * 0.4 + seonggyeok * 0.3 + emotion * 0.2 + sinsal);

  // a, b는 향후 일간별 미세 조정용 (현재는 compat 기반으로 충분)
  void a; void b;

  return { inyeon, seonggyeok, emotion, physical, finance, marriage };
}

export function scoreLabelFor(score: number): string {
  return scoreLabel(score);
}

// 4구간 자산 곡선 — 대운 흐름과 재성 강약을 토대로 추정
// 실제 한국 평균 순자산 기준 추정치 (참고용)
export function estimateAssetCurve(s: SajuAnalysis): { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[] {
  // 일간 강약 단계
  const elements = s.elements;
  const total = elements.목 + elements.화 + elements.토 + elements.금 + elements.수;
  // 재성 = 일간이 극하는 오행
  const STEM_TO_ELEM: Record<string, keyof typeof elements> = {
    갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토",
    경: "금", 신: "금", 임: "수", 계: "수",
  };
  const ilganElem = STEM_TO_ELEM[s.ilgan];
  const CONTROLS: Record<string, keyof typeof elements> = {
    목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
  };
  const jaeseongElem = CONTROLS[ilganElem];
  const jaeseongRatio = total > 0 ? elements[jaeseongElem] / total : 0;

  // 재성이 풍부할수록 청년기·중년기 폭발적 상승
  const peak = 6 + Math.round(jaeseongRatio * 60); // 6~36억
  const young = Math.max(1, Math.round(peak * 0.45));
  const middle = peak;
  const late = Math.round(peak * (jaeseongRatio > 0.25 ? 1.05 : 0.85));
  return [
    { phase: "초년기", value: 1 },
    { phase: "청년기", value: young },
    { phase: "중년기", value: middle },
    { phase: "말년기", value: late },
  ];
}

export function estimateTogetherCurve(
  a: ReturnType<typeof estimateAssetCurve>,
  b: ReturnType<typeof estimateAssetCurve>,
  scoreFinance: number,
): { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[] {
  const synergy = 1 + (scoreFinance - 50) / 100; // 0.5 ~ 1.5
  return a.map((p, i) => ({
    phase: p.phase,
    value: Math.round((p.value + b[i].value) * synergy),
  }));
}
