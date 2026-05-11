// 4장 반복 패턴 결정론 태그 계산 (정통화)
// build-context (LLM 프롬프트 주입)와 result page (PatternTagsCard 표시) 양쪽 공용 — 일관성 보장
//
// 정통화 (2026-05-10):
//   단순 식상≥3=감정폭발 룰 폐기. 일주 외격(양인·괴강)·신살·충·관인상생 결합 패턴.
//   각 태그는 명리적 근거가 명확한 결합으로 도출.
import type { SajuAnalysis } from "../saju-calculator";
import type { SoloDuration } from "./types";

const SIK = ["식신", "상관"];
const INN = ["정인", "편인", "효신"];
const GWAN = ["정관", "편관", "칠살"];
const JAE = ["정재", "편재"];
const BIG = ["비견", "겁재"];

function countSip(saju: SajuAnalysis, names: string[]): number {
  const sip = saju.sipseong as Record<string, { stem: string; branch: string } | null>;
  const all = [
    sip.year?.stem, sip.year?.branch,
    sip.month?.stem, sip.month?.branch,
    sip.day?.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
  return all.filter(s => names.some(n => s.includes(n))).length;
}

function hasSinsal(saju: SajuAnalysis, key: string): boolean {
  return (saju.sinsal ?? []).some(s => s.includes(key));
}

export function derivePatternTags(saju: SajuAnalysis, duration: SoloDuration): string[] {
  const tags: string[] = [];
  const sik = countSip(saju, SIK);
  const inn = countSip(saju, INN);
  const gwan = countSip(saju, GWAN);
  const jae = countSip(saju, JAE);
  const big = countSip(saju, BIG);

  // 1. 감정 폭발 — 식상 강(≥3) + 양인 또는 괴강 (단순 식상 강만으론 부족, 외격 결합)
  if (sik >= 3 && (hasSinsal(saju, "양인") || hasSinsal(saju, "괴강"))) {
    tags.push("#감정 폭발");
  }
  // 1-b. 감정 폭발 — 상관 단독 강 (상관은 식신보다 폭발적)
  else if (sik >= 4) {
    tags.push("#감정 폭발");
  }

  // 2. 속에 쌓음 — 식상 약(≤1) + 인성 강(≥2) (안으로 정리하는 결)
  if (sik <= 1 && inn >= 2) {
    tags.push("#속에 쌓음");
  }
  // 2-b. 식상 0 단독 — 양면 풀이 룰에 따라 신중한 결
  else if (sik === 0 && inn === 0) {
    tags.push("#신중한 표현");
  }

  // 3. 회피·곱씹기 — 인성 강(≥3) + 원진 또는 자형 신살
  if (inn >= 3 && (hasSinsal(saju, "원진") || hasSinsal(saju, "자형"))) {
    tags.push("#회피·곱씹기");
  }
  // 3-b. 인성 강 단독 — 사색·곱씹는 결
  else if (inn >= 4) {
    tags.push("#회피·곱씹기");
  }

  // 4. 책임감 함정 — 관성 강(≥2) + 인성 강(≥2) (관인상생, 부담)
  if (gwan >= 2 && inn >= 2) {
    tags.push("#책임감 함정");
  }
  // 4-b. 관성 4개 이상 — 단순 부담 과다
  else if (gwan >= 4) {
    tags.push("#책임감 함정");
  }

  // 5. 자기 잃음 — 재성 강(≥3) + 비겁 약(≤1) (자기 결 흔들림)
  if (jae >= 3 && big <= 1) {
    tags.push("#자기 잃음");
  }

  // 6. 독선 — 비겁 강(≥3) + 관성 약(≤1) (틀에 안 갇힘)
  if (big >= 3 && gwan <= 1) {
    tags.push("#독선·자기중심");
  }

  // 7. 변화 갈망 — 역마살 보유 + 재성/관성 강
  if (hasSinsal(saju, "역마") && (jae >= 2 || gwan >= 2)) {
    tags.push("#변화 갈망");
  }

  // 8. 도화 끌림 — 도화살 또는 홍염살 보유 (유혹·자극에 흔들림)
  if (hasSinsal(saju, "도화") || hasSinsal(saju, "홍염")) {
    tags.push("#도화 끌림");
  }

  // 9. 솔로 기간 분기 (일관 유지)
  if (duration === "gt_3y") tags.push("#오랜 결핍");
  if (duration === "lt_6m") tags.push("#이별 잔재");

  // 폴백
  if (tags.length === 0) tags.push("#일상의 결");

  return tags;
}
