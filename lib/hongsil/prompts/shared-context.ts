// 나의 홍실 V3 — Q1·Q2·Q3 → 톤 가이드 변환
import {
  HongsilEntryChoice,
  SOLO_DURATION_LABEL,
  LOVE_DESIRE_LABEL,
  LOVE_STYLE_LABEL,
  SoloDuration,
  LoveDesire,
  LoveStyle,
} from "../types";

export function buildHongsilChoiceContext(c: HongsilEntryChoice): string {
  return `[Q1 솔로 기간] ${SOLO_DURATION_LABEL[c.duration]}
[Q2 원하는 사랑] ${LOVE_DESIRE_LABEL[c.desire]}
[Q3 본인 사랑 스타일] ${LOVE_STYLE_LABEL[c.style]}
[톤 가이드]
- ${durationTone(c.duration)}
- ${desireTone(c.desire)}
- ${styleTone(c.style)}`;
}

function durationTone(d: SoloDuration): string {
  switch (d) {
    case "lt_6m":     return "이별 직후 회복기 — '곧 골든타임 다가옴' 톤. 위로+희망.";
    case "6m_to_1y":  return "회복기 거침 — '다음 인연이 가까워지는 결' 톤.";
    case "1y_to_3y":  return "안정 솔로 — '준비 끝, 다가올 인연 기다림' 톤.";
    case "gt_3y":     return "긴 솔로 — '기다림 vs 행동 결정 시기' 깊은 자각 톤.";
    case "never":     return "모태솔로 — '첫 인연을 향한 응원' 톤. 과거 패턴 풀이 X. 예방·기대 톤만.";
  }
}
function desireTone(d: LoveDesire): string {
  switch (d) {
    case "stable":    return "안정·깊이 갈망 — 정관·정재 본능 강조";
    case "intense":   return "강렬·자극 갈망 — 편관·편재 본능 강조";
    case "natural":   return "편안·흐름 갈망 — 식상·재성 본능 강조";
    case "marriage":  return "약속·미래 갈망 — 정관·정재 + 안정형 결혼 톤";
  }
}
function styleTone(s: LoveStyle): string {
  switch (s) {
    case "direct":   return "본인 직진형 — 자가 인식과 사주 결과 갭 분석";
    case "careful":  return "본인 신중형 — 자가 인식과 사주 결과 갭 분석";
    case "miyldang": return "본인 밀당형 — 자가 인식과 사주 결과 갭 분석";
    case "distant":  return "본인 거리 두는 편 — 다가가야 할지 검토";
    case "passive":  return "본인 수동형 — 적극성 끌어내는 결 짚기";
    case "balance":  return "본인 균형형 — 상황별 변화 강조";
  }
}
