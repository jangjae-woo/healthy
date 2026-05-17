// 부모 6축 점수 산출 (Phase 1-B)
//
// 룰: 3_parent_6axes.md
// 부모 6축 = 온기·중심·일관·자율·표현·바람
// 내부 로직만 (결과지 본문 노출 X — 36셀 매트릭스 매칭용)
//
// 자녀 factors와 동일 공식: weightedStrength × 등급 × 부호
// 통칭 6셋 적용 (정관/편관 → 관성, 정인/편인 → 인성, 식신/상관 → 식상, 정재/편재 → 재성)
//
// 작성: 2026-05-16

import { GRADE, SHINKANG_SCORE } from './factors.mjs';

function level(score) {
  if (score <= 40) return 'low';
  if (score <= 65) return 'mid';
  return 'high';
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

export const PARENT_AXIS_PERCENTILE_PROFILE = {
  ongi: [
    { p: 0, raw: 45 }, { p: 10, raw: 58 }, { p: 25, raw: 63 },
    { p: 50, raw: 70 }, { p: 75, raw: 76 }, { p: 90, raw: 81 }, { p: 100, raw: 95 },
  ],
  jungsim: [
    { p: 0, raw: 45 }, { p: 10, raw: 59 }, { p: 25, raw: 64 },
    { p: 50, raw: 71 }, { p: 75, raw: 76 }, { p: 90, raw: 82 }, { p: 100, raw: 97 },
  ],
  ilgwan: [
    { p: 0, raw: 47 }, { p: 10, raw: 56 }, { p: 25, raw: 60 },
    { p: 50, raw: 65 }, { p: 75, raw: 73 }, { p: 90, raw: 78 }, { p: 100, raw: 88 },
  ],
  jayul: [
    { p: 0, raw: 36 }, { p: 10, raw: 47 }, { p: 25, raw: 54 },
    { p: 50, raw: 64 }, { p: 75, raw: 78 }, { p: 90, raw: 85 }, { p: 100, raw: 97 },
  ],
  pyohyeon: [
    { p: 0, raw: 32 }, { p: 10, raw: 46 }, { p: 25, raw: 53 },
    { p: 50, raw: 62 }, { p: 75, raw: 80 }, { p: 90, raw: 89 }, { p: 100, raw: 100 },
  ],
  baram: [
    { p: 0, raw: 42 }, { p: 10, raw: 59 }, { p: 25, raw: 64 },
    { p: 50, raw: 72 }, { p: 75, raw: 85 }, { p: 90, raw: 94 }, { p: 100, raw: 100 },
  ],
};

function percentileLevel(score) {
  if (score <= 25) return 'low';
  if (score <= 75) return 'mid';
  return 'high';
}

function interpolatePercentile(raw, profile) {
  if (!profile?.length) return null;
  if (raw <= profile[0].raw) return profile[0].p;
  const last = profile[profile.length - 1];
  if (raw >= last.raw) return last.p;

  for (let i = 1; i < profile.length; i++) {
    const prev = profile[i - 1];
    const next = profile[i];
    if (raw <= next.raw) {
      if (next.raw === prev.raw) return next.p;
      const ratio = (raw - prev.raw) / (next.raw - prev.raw);
      return prev.p + ratio * (next.p - prev.p);
    }
  }
  return last.p;
}

function axisResult(axis, axisKorean, rawScore, sum, trace) {
  const profile = PARENT_AXIS_PERCENTILE_PROFILE[axis];
  const percentile = interpolatePercentile(rawScore, profile);
  const score = percentile == null ? rawScore : Math.round(clamp(percentile, 0, 100));
  return {
    axis,
    axisKorean,
    score,
    level: percentileLevel(score),
    rawScore,
    rawLevel: level(rawScore),
    sum,
    trace,
    calibration: percentile == null ? { method: 'raw' } : {
      method: 'parent-axis-percentile-v1',
      profile,
      source: '1978-1995-real-manseryeok-1000-v1',
    },
  };
}

function oheangPercent(saju, element) {
  const total = Object.values(saju.elements).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return Math.round((saju.elements[element] / total) * 100);
}

// ─── 온기 (Warmth) — 정서적 수용·공감 ───
// 본기 +: 정인 + 식신 + 조후 균형 → 인성 + 식상 + 조후
// 상조 +: 음일간 + 천을귀인 + 관인상생
// 여기 +: 일주 안정
// 본기 -: 칠살 강 + 인성 부재 → (관성 강 + 인성 < 10)
// 상조 -: 양인 + 조후 극단 편중
// 여기 -: 식상+비겁만 강
export function calcOngi(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const biGeop = saju.factorStrength.비겁.weightedStrength;
  const johu = saju.factorStrength.조후;

  // 본기 +
  sum += inSeong * GRADE.본기;
  trace.push(`+ 인성 본기: ${inSeong} × 1.0 = ${inSeong.toFixed(1)}`);
  sum += sikSang * GRADE.본기;
  trace.push(`+ 식상 본기: ${sikSang} × 1.0 = ${sikSang.toFixed(1)}`);
  if (johu.balanced) {
    sum += 50 * GRADE.본기;
    trace.push(`+ 조후 균형 본기: 50 × 1.0 = 50.0`);
  }

  // 상조 +
  if (!isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 음일간 상조: 50 × 0.5 = 25.0`);
  }
  if (saju.sinsal.천을귀인?.present) {
    sum += saju.sinsal.천을귀인.score50 * GRADE.상조;
    trace.push(`+ 천을귀인 상조: ${saju.sinsal.천을귀인.score50} × 0.5 = ${(saju.sinsal.천을귀인.score50 * 0.5).toFixed(1)}`);
  }
  const gwanInSangsaeng = (gwanSeong + inSeong) / 2 >= 50 ? 50 : 0;
  if (gwanInSangsaeng > 0) {
    sum += gwanInSangsaeng * GRADE.상조;
    trace.push(`+ 관인상생 상조: ${gwanInSangsaeng} × 0.5 = ${(gwanInSangsaeng * 0.5).toFixed(1)}`);
  }

  // 여기 +
  const stable = gwanSeong >= 30 && inSeong >= 30 && saju.factorStrength.재성.weightedStrength >= 30;
  if (stable) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 일주 안정 여기: 50 × 0.2 = 10.0`);
  }

  // 본기 -
  if (gwanSeong >= 50 && inSeong < 10) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 칠살(관성) 강 + 인성 부재 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 -
  if (saju.sinsal.양인?.present) {
    sum -= saju.sinsal.양인.score50 * GRADE.상조;
    trace.push(`- 양인 본기 강 상조: ${saju.sinsal.양인.score50} × 0.5 = -${(saju.sinsal.양인.score50 * 0.5).toFixed(1)}`);
  }
  if (johu.차이 >= 4) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 조후 극단 편중 상조: 50 × 0.5 = -25.0`);
  }

  // 여기 -
  if (sikSang >= 50 && biGeop >= 50 && inSeong < 30 && gwanSeong < 30 && saju.factorStrength.재성.weightedStrength < 30) {
    sum -= 50 * GRADE.여기;
    trace.push(`- 식상+비겁만 강 여기: 50 × 0.2 = -10.0`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('ongi', '온기', score, sum, trace);
}

// ─── 중심 (Structure) — 기준·통제·일관성 ───
// 본기 +: 정관 + 양인 + 신강 → 관성 + 양인 + 신강
// 상조 +: 양일간 + 12운성 강세 + 편관(칠살) 강 → 관성 강은 본기에 이미 포함, 양일간만 분리
// 여기 +: 토 오행
// 정액 -: 관성 무존재
// 상조 -: 신약 + 인성 과다 / 식상 강 + 관성 약
// 여기 -: 비겁 약
export function calcJungsim(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const biGeop = saju.factorStrength.비겁.weightedStrength;
  const shinkang = SHINKANG_SCORE[saju.shinkang.level] ?? 50;
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);

  // 본기 +
  sum += gwanSeong * GRADE.본기;
  trace.push(`+ 관성 본기: ${gwanSeong} × 1.0 = ${gwanSeong.toFixed(1)}`);
  if (saju.sinsal.양인?.present) {
    sum += saju.sinsal.양인.score50 * GRADE.본기;
    trace.push(`+ 양인 본기: ${saju.sinsal.양인.score50} × 1.0 = ${saju.sinsal.양인.score50.toFixed(1)}`);
  }
  sum += shinkang * GRADE.본기;
  trace.push(`+ 신강 본기 (${saju.shinkang.level}): ${shinkang} × 1.0 = ${shinkang.toFixed(1)}`);

  // 상조 +
  if (isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 양일간 상조: 50 × 0.5 = 25.0`);
  }
  if (saju.has12UnseongStrong) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 12운성 강세 상조: 50 × 0.5 = 25.0`);
  }

  // 여기 +
  const toPct = oheangPercent(saju, '토');
  sum += toPct * GRADE.여기;
  trace.push(`+ 토 오행 여기: ${toPct}% × 0.2 = ${(toPct * 0.2).toFixed(1)}`);

  // 정액 -
  if (gwanSeong < 10) {
    sum -= 50;
    trace.push(`- 관성 무존재 정액: -50`);
  }

  // 상조 -
  if (isShinyak && inSeong >= 70) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 신약 + 인성 과다 상조: 50 × 0.5 = -25.0`);
  }
  if (sikSang >= 50 && gwanSeong < 30) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 식상 강 + 관성 약 상조: 50 × 0.5 = -25.0`);
  }

  // 여기 -
  if (biGeop < 20) {
    sum -= 50 * GRADE.여기;
    trace.push(`- 비겁 약 여기: 50 × 0.2 = -10.0`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('jungsim', '중심', score, sum, trace);
}

// ─── 일관 (Consistency) — 예측가능성·꾸준함 ───
// 본기 +: 토 오행 + 관인상생 + 일주 안정
// 상조 +: 관성 + 인성 + 조후 균형
// 여기 +: 음일간 + 12운성 강세
// 본기 -: 충 3개 이상
// 상조 -: 칠살 강+신약 + 조후 극단
// 여기 -: 상관+양인 결합
export function calcIlgwan(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const johu = saju.factorStrength.조후;
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);

  // 본기 +
  const toPct = oheangPercent(saju, '토');
  sum += toPct * GRADE.본기;
  trace.push(`+ 토 오행 본기: ${toPct}% × 1.0 = ${toPct.toFixed(1)}`);

  const gwanInSangsaeng = (gwanSeong + inSeong) / 2 >= 50 ? 50 : 0;
  sum += gwanInSangsaeng * GRADE.본기;
  trace.push(`+ 관인상생 본기: ${gwanInSangsaeng} × 1.0 = ${gwanInSangsaeng.toFixed(1)}`);

  const stable = gwanSeong >= 30 && inSeong >= 30 && saju.factorStrength.재성.weightedStrength >= 30;
  if (stable) {
    sum += 50 * GRADE.본기;
    trace.push(`+ 일주 안정 본기: 50 × 1.0 = 50.0`);
  }

  // 상조 +
  sum += gwanSeong * GRADE.상조;
  trace.push(`+ 관성 상조: ${gwanSeong} × 0.5 = ${(gwanSeong * 0.5).toFixed(1)}`);
  sum += inSeong * GRADE.상조;
  trace.push(`+ 인성 상조: ${inSeong} × 0.5 = ${(inSeong * 0.5).toFixed(1)}`);
  if (johu.balanced) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 조후 균형 상조: 50 × 0.5 = 25.0`);
  }

  // 여기 +
  if (!isYang) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 음일간 여기: 50 × 0.2 = 10.0`);
  }
  if (saju.has12UnseongStrong) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 12운성 강세 여기: 50 × 0.2 = 10.0`);
  }

  // 본기 -
  const chungCount = saju.branchInteractions?.충?.length ?? 0;
  if (chungCount >= 3) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 충 ${chungCount}개 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 -
  if (gwanSeong >= 50 && isShinyak) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 칠살 강+신약 상조: 50 × 0.5 = -25.0`);
  }
  if (johu.차이 >= 4) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 조후 극단 편중 상조: 50 × 0.5 = -25.0`);
  }

  // 여기 -
  // 상관+양인 결합 — 통칭 식상 강 + 양인 동시
  if (sikSang >= 50 && saju.sinsal.양인?.present) {
    sum -= 50 * GRADE.여기;
    trace.push(`- 상관+양인 결합 여기: 50 × 0.2 = -10.0`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('ilgwan', '일관', score, sum, trace);
}

// ─── 자율 (Autonomy) — 자율 부여·기다림 ───
// 본기 +: 식상 + 재성 + 신강신약 균형(중화)
// 상조 +: 음일간 + 인성 약 + 식상 강 조합
// 여기 +: 양인 부재 + 12운성 균형
// 본기 -: 인성 과다 (≥ 70)
// 상조 -: 관성 과다 / 비겁 강 + 식상 약
// 여기 -: 양인 본기 강
export function calcJayul(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const jaeSeong = saju.factorStrength.재성.weightedStrength;
  const biGeop = saju.factorStrength.비겁.weightedStrength;

  // 본기 +
  sum += sikSang * GRADE.본기;
  trace.push(`+ 식상 본기: ${sikSang} × 1.0 = ${sikSang.toFixed(1)}`);
  sum += jaeSeong * GRADE.본기;
  trace.push(`+ 재성 본기: ${jaeSeong} × 1.0 = ${jaeSeong.toFixed(1)}`);
  if (saju.shinkang.level === '중화') {
    sum += 50 * GRADE.본기;
    trace.push(`+ 신강신약 균형(중화) 본기: 50 × 1.0 = 50.0`);
  }

  // 상조 +
  if (!isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 음일간 상조: 50 × 0.5 = 25.0`);
  }
  if (inSeong < 30 && sikSang >= 50) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 인성 약 + 식상 강 조합 상조: 50 × 0.5 = 25.0`);
  }

  // 여기 +
  if (!saju.sinsal.양인?.present) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 양인 부재 여기: 50 × 0.2 = 10.0`);
  }

  // 본기 -
  if (inSeong >= 70) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 인성 과다 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 -
  if (gwanSeong >= 70) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 관성 과다 상조: 50 × 0.5 = -25.0`);
  }
  if (biGeop >= 50 && sikSang < 30) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 비겁 강 + 식상 약 상조: 50 × 0.5 = -25.0`);
  }

  // 여기 -
  if (saju.sinsal.양인?.present) {
    sum -= saju.sinsal.양인.score50 * GRADE.여기;
    trace.push(`- 양인 본기 강 여기: ${saju.sinsal.양인.score50} × 0.2 = -${(saju.sinsal.양인.score50 * 0.2).toFixed(1)}`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('jayul', '자율', score, sum, trace);
}

// ─── 표현 (Expression) — 마음·기대 표출 ───
// 본기 +: 상관 + 식신 → 식상 통칭
// 상조 +: 양일간 + 도화살 + 재성(식상→재성 흐름)
// 여기 +: 양인 + 화 오행
// 정액 -: 식상 무존재
// 본기 -: 인성 과다 (식상 직접 통제)
// 상조 -: 음일간 + 신약
export function calcPyohyeon(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const jaeSeong = saju.factorStrength.재성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);

  // 본기 +
  sum += sikSang * GRADE.본기 * 2;  // 식신+상관 둘 다 본기 (통칭 식상 ×2)
  trace.push(`+ 식상 본기 (식신+상관 ×2): ${sikSang} × 2.0 = ${(sikSang * 2).toFixed(1)}`);

  // 상조 +
  if (isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 양일간 상조: 50 × 0.5 = 25.0`);
  }
  if (saju.sinsal.도화살?.present) {
    sum += saju.sinsal.도화살.score50 * GRADE.상조;
    trace.push(`+ 도화살 상조: ${saju.sinsal.도화살.score50} × 0.5 = ${(saju.sinsal.도화살.score50 * 0.5).toFixed(1)}`);
  }
  // 식상→재성 흐름 (식상 ≥ 30 AND 재성 ≥ 30)
  if (sikSang >= 30 && jaeSeong >= 30) {
    sum += jaeSeong * GRADE.상조;
    trace.push(`+ 식상→재성 흐름 상조: ${jaeSeong} × 0.5 = ${(jaeSeong * 0.5).toFixed(1)}`);
  }

  // 여기 +
  if (saju.sinsal.양인?.present) {
    sum += saju.sinsal.양인.score50 * GRADE.여기;
    trace.push(`+ 양인 여기 (외적 발현): ${saju.sinsal.양인.score50} × 0.2 = ${(saju.sinsal.양인.score50 * 0.2).toFixed(1)}`);
  }
  const hwaPct = oheangPercent(saju, '화');
  sum += hwaPct * GRADE.여기;
  trace.push(`+ 화 오행 여기: ${hwaPct}% × 0.2 = ${(hwaPct * 0.2).toFixed(1)}`);

  // 정액 -
  if (sikSang < 10) {
    sum -= 50;
    trace.push(`- 식상 무존재 정액: -50`);
  }

  // 본기 -
  if (inSeong >= 70) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 인성 과다 (식상 직접 통제) 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 -
  if (!isYang && isShinyak) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 음일간 + 신약 상조: 50 × 0.5 = -25.0`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('pyohyeon', '표현', score, sum, trace);
}

// ─── 바람 (Expectation) — 결과·성취 압력 ⚠️ 가장 살펴줄 축 ───
// 본기 +: 편재 + 정재 + 칠살 → 재성 통칭 + 관성(편관만이지만 통칭화 OK)
// 상조 +: 정관 강 + 양인 + 양일간
// 여기 +: 비겁(경쟁) + 양간 결합
// 본기 -: 재성 무존재 + 관성 무존재
// 상조 -: 식상 강 + 재성 약 (과정 즐김) / 음일간 + 신약
export function calcBaram(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const jaeSeong = saju.factorStrength.재성.weightedStrength;
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const biGeop = saju.factorStrength.비겁.weightedStrength;
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);

  // 본기 +
  sum += jaeSeong * GRADE.본기 * 2;  // 정재+편재 둘 다 본기
  trace.push(`+ 재성 본기 (정재+편재 ×2): ${jaeSeong} × 2.0 = ${(jaeSeong * 2).toFixed(1)}`);
  sum += gwanSeong * GRADE.본기;  // 칠살 (통칭으로 정관 포함)
  trace.push(`+ 관성(칠살) 본기: ${gwanSeong} × 1.0 = ${gwanSeong.toFixed(1)}`);

  // 상조 +
  if (saju.sinsal.양인?.present) {
    sum += saju.sinsal.양인.score50 * GRADE.상조;
    trace.push(`+ 양인 상조: ${saju.sinsal.양인.score50} × 0.5 = ${(saju.sinsal.양인.score50 * 0.5).toFixed(1)}`);
  }
  if (isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 양일간 상조: 50 × 0.5 = 25.0`);
  }

  // 여기 +
  sum += biGeop * GRADE.여기;
  trace.push(`+ 비겁(경쟁의 결) 여기: ${biGeop} × 0.2 = ${(biGeop * 0.2).toFixed(1)}`);

  // 본기 -
  if (jaeSeong < 10 && gwanSeong < 10) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 재성+관성 모두 무존재 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 -
  if (sikSang >= 50 && jaeSeong < 30) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 식상 강 + 재성 약 (과정 즐김) 상조: 50 × 0.5 = -25.0`);
  }
  if (!isYang && isShinyak) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 음일간 + 신약 상조: 50 × 0.5 = -25.0`);
  }

  const score = Math.round(clamp(50 + sum / 6, 0, 100));
  return axisResult('baram', '바람', score, sum, trace);
}

// ─── 모든 6축 통합 ───
export function calcAll6Axes(saju) {
  return {
    ongi: calcOngi(saju),
    jungsim: calcJungsim(saju),
    ilgwan: calcIlgwan(saju),
    jayul: calcJayul(saju),
    pyohyeon: calcPyohyeon(saju),
    baram: calcBaram(saju),
  };
}
