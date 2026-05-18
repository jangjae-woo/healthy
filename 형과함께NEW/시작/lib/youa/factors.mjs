// 자녀 6요인 점수 산출 (Phase 1-A v2 — 재작성)
//
// v1 폐기 사유: 위치 가중치 누락 + 임의 임계값 + 명리 강도/오행% 혼용
// v2 원칙:
//   - 위치 가중치는 fixture의 weightedStrength에 이미 반영됨
//   - factors 함수는 weightedStrength × 등급(본기 1.0 / 상조 0.5 / 여기 0.2) × 부호만
//   - 임의 임계값 0개. 룰 그대로
//   - 캘리브레이션 대상: 신강 점수 매핑 + 정규화 ÷6 (Phase 7)
//
// 공식 (2_child_6factors.md):
//   요인 총점 = clamp(50 + Σ(인자 점수 × 부호) / 6, 0, 100)
//   구간: 낮음 0~40 / 중간 41~65 / 높음 66~100
//
// 작성: 2026-05-16

import { oheangPercent } from '../../fixtures/child-kimsumin.mjs';

// ─── 요인 기여 등급 ───
export const GRADE = {
  본기: 1.0,
  상조: 0.5,
  여기: 0.2,
};

// ─── 신강 레벨 → 점수 매핑 (Phase 7 캘리브레이션 대상) ───
export const SHINKANG_SCORE = {
  '극약': 5,
  '태약': 20,
  '신약': 35,
  '중화': 50,
  '신강': 70,
  '태강': 85,
  '극왕': 95,
};

// ─── 구간 분류 ───
function level(score) {
  if (score <= 40) return 'low';
  if (score <= 65) return 'mid';
  return 'high';
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function legacyScore(sum) {
  return Math.round(clamp(50 + sum / 6, 0, 100));
}

function rawBase0Score(sum) {
  return Math.round(clamp(sum / 6, -100, 100));
}

function factorResult(factor, factorKorean, sum, trace) {
  const score = legacyScore(sum);
  const base0Score = rawBase0Score(sum);

  return {
    factor,
    factorKorean,
    score,
    level: level(score),
    sum,
    trace,
    base0Score,
  };
}

// ─── 고객용 점수 보정 프로필 ───
// 명리 공식에서 나온 원점수는 각 요인마다 평균·분산이 다르다.
// 원점수를 그대로 동물/라벨에 쓰면 특정 요인만 계속 이기는 쏠림이 생기므로,
// 2020~2023 유아 실만세력 100개 1차 캘리브레이션 기준으로 공통 스케일에 맞춘다.
export const FACTOR_CALIBRATION = {
  hwalgi:      { mean: 64.9, std: 9.8 },
  josim:       { mean: 64.7, std: 11.4 },
  manjok:      { mean: 62.3, std: 8.0 },
  heundeullim: { mean: 53.8, std: 7.1 },
  eoullim:     { mean: 64.0, std: 9.6 },
  kkeungi:     { mean: 68.3, std: 13.7 },
};

const TARGET_MEAN = 55;
const TARGET_STD = 18;

// ─── base0 raw -> percentile 프로필 ───
// 2020~2023 유아 실만세력 500개 표본에서 산출한 1차 기준표.
// score는 이 표본 안의 상대 위치이며, raw 명리 강도는 base0Score/rawScore에 보존한다.
export const FACTOR_PERCENTILE_PROFILE = {
  hwalgi: [
    { p: 0, raw: -7 }, { p: 10, raw: 2 }, { p: 25, raw: 8 },
    { p: 50, raw: 15 }, { p: 75, raw: 23 }, { p: 90, raw: 29 }, { p: 100, raw: 43 },
  ],
  josim: [
    { p: 0, raw: -21 }, { p: 10, raw: -4 }, { p: 25, raw: 4 },
    { p: 50, raw: 14 }, { p: 75, raw: 23 }, { p: 90, raw: 28 }, { p: 100, raw: 42 },
  ],
  manjok: [
    { p: 0, raw: -8 }, { p: 10, raw: 2 }, { p: 25, raw: 7 },
    { p: 50, raw: 13 }, { p: 75, raw: 18 }, { p: 90, raw: 23 }, { p: 100, raw: 35 },
  ],
  heundeullim: [
    { p: 0, raw: -15 }, { p: 10, raw: -7 }, { p: 25, raw: -2 },
    { p: 50, raw: 2 }, { p: 75, raw: 8 }, { p: 90, raw: 10 }, { p: 100, raw: 27 },
  ],
  eoullim: [
    { p: 0, raw: -7 }, { p: 10, raw: 5 }, { p: 25, raw: 8 },
    { p: 50, raw: 14 }, { p: 75, raw: 21 }, { p: 90, raw: 26 }, { p: 100, raw: 39 },
  ],
  kkeungi: [
    { p: 0, raw: -15 }, { p: 10, raw: -1 }, { p: 25, raw: 7 },
    { p: 50, raw: 16 }, { p: 75, raw: 29 }, { p: 90, raw: 37 }, { p: 100, raw: 47 },
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

function calibrateFactor(result) {
  const profile = FACTOR_CALIBRATION[result.factor];
  if (!profile || !profile.std) return result;

  const rawScore = result.score;
  const calibratedScore = Math.round(clamp(
    TARGET_MEAN + ((rawScore - profile.mean) / profile.std) * TARGET_STD,
    5,
    95,
  ));

  return {
    ...result,
    rawScore,
    rawLevel: result.level,
    score: calibratedScore,
    level: level(calibratedScore),
    calibration: {
      method: 'zscore-v1',
      profile,
      targetMean: TARGET_MEAN,
      targetStd: TARGET_STD,
    },
  };
}

function percentileFactor(result) {
  const profile = FACTOR_PERCENTILE_PROFILE[result.factor];
  const rawBase0 = result.base0Score;
  const percentile = interpolatePercentile(rawBase0, profile);
  if (percentile == null) return calibrateFactor(result);

  const rawScore = result.score;
  const score = Math.round(clamp(percentile, 0, 100));

  return {
    ...result,
    rawScore,
    rawLevel: result.level,
    score,
    level: percentileLevel(score),
    calibration: {
      method: 'percentile-v1',
      profile,
      source: '2020-2023-real-manseryeok-500-v1',
      rawKey: 'base0Score',
    },
  };
}

function hasUnknownHour(saju) {
  return !!saju.isHourUnknown || !saju.pillars?.hour?.stem || !saju.pillars?.hour?.branch;
}

function softenUnknownHourScore(result) {
  const score = result.score;
  // 출생시간 미상은 시주 인자를 "없음"으로 단정하지 않는다.
  // 연월일 중심 결과가 극단으로 치우치면 중간권으로 살짝 당겨 표시한다.
  if (score > 25 && score < 75) {
    return {
      ...result,
      hourUnknown: true,
      confidence: 'date-only',
      calibration: {
        ...result.calibration,
        hourUnknownAdjustment: 'none-mid-range',
      },
    };
  }

  const softened = Math.round(clamp(50 + (score - 50) * 0.65, 20, 80));
  return {
    ...result,
    preHourUnknownScore: score,
    preHourUnknownLevel: result.level,
    hourUnknown: true,
    confidence: 'date-only',
    score: softened,
    level: percentileLevel(softened),
    calibration: {
      ...result.calibration,
      hourUnknownAdjustment: 'center-pull-0.65',
    },
  };
}

function capHourInfluence(result, dateOnlyResult) {
  if (!dateOnlyResult) return result;
  const capped = Math.round(clamp(
    result.score,
    dateOnlyResult.score - 5,
    dateOnlyResult.score + 5,
  ));

  if (capped === result.score) {
    return {
      ...result,
      dateOnlyScore: dateOnlyResult.score,
      confidence: 'full-hour',
      calibration: {
        ...result.calibration,
        hourInfluenceCap: 'none-within-5',
      },
    };
  }

  return {
    ...result,
    preHourCapScore: result.score,
    preHourCapLevel: result.level,
    dateOnlyScore: dateOnlyResult.score,
    confidence: 'full-hour-capped',
    score: capped,
    level: percentileLevel(capped),
    calibration: {
      ...result.calibration,
      hourInfluenceCap: 'max-5',
    },
  };
}

function calcAll6FactorsUncapped(saju) {
  const raw = {
    hwalgi: calcHwalgi(saju),
    josim: calcJosim(saju),
    manjok: calcManjok(saju),
    heundeullim: calcHeundeullim(saju),
    eoullim: calcEoullim(saju),
    kkeungi: calcKkeungi(saju),
  };

  return Object.fromEntries(
    Object.entries(raw).map(([key, result]) => [key, percentileFactor(result)]),
  );
}

// ─── 활기 점수 산출 ───
// 룰 표 (2_child_6factors.md 요인 1):
//   본기 +1.0: 식상 강도 / 양인 / 신강 강도
//   상조 +0.5: 화 오행% / 목 오행% / 양일간
//   여기 +0.2: 역마살 / 12운성 강세
//   본기 -1.0: (없음)
//   상조 -0.5: 음일간 / 수 오행% / 인성 강도(식상 억제)
//   여기 -0.2: 12운성 약세
export function calcHwalgi(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';

  // ── 본기 (+) ──
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const yangInScore = saju.sinsal.양인?.present ? saju.sinsal.양인.score50 : 0;
  const shinkang = SHINKANG_SCORE[saju.shinkang.level] ?? 50;

  sum += sikSang * GRADE.본기;
  trace.push(`+ 식상 본기: ${sikSang} × 1.0 = ${(sikSang * 1.0).toFixed(1)}`);

  sum += yangInScore * GRADE.본기;
  trace.push(`+ 양인 본기: ${yangInScore} × 1.0 = ${(yangInScore * 1.0).toFixed(1)}`);

  sum += shinkang * GRADE.본기;
  trace.push(`+ 신강 본기 (${saju.shinkang.level}): ${shinkang} × 1.0 = ${(shinkang * 1.0).toFixed(1)}`);

  // ── 상조 (+) ──
  const hwaPct = oheangPercent(saju, '화');
  const mokPct = oheangPercent(saju, '목');
  sum += hwaPct * GRADE.상조;
  trace.push(`+ 화 오행 상조: ${hwaPct}% × 0.5 = ${(hwaPct * 0.5).toFixed(1)}`);

  sum += mokPct * GRADE.상조;
  trace.push(`+ 목 오행 상조: ${mokPct}% × 0.5 = ${(mokPct * 0.5).toFixed(1)}`);

  if (isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 양일간 상조: 50 × 0.5 = 25.0`);
  }

  // ── 여기 (+) ──
  if (saju.sinsal.역마살?.present) {
    sum += saju.sinsal.역마살.score50 * GRADE.여기;
    trace.push(`+ 역마살 여기: ${saju.sinsal.역마살.score50} × 0.2 = ${(saju.sinsal.역마살.score50 * 0.2).toFixed(1)}`);
  }
  if (saju.has12UnseongStrong) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 12운성 강세 여기: 50 × 0.2 = 10.0`);
  }

  // ── 상조 (−) ──
  if (!isYang) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 음일간 상조: 50 × 0.5 = -25.0`);
  }
  const suPct = oheangPercent(saju, '수');
  sum -= suPct * GRADE.상조;
  trace.push(`- 수 오행 상조: ${suPct}% × 0.5 = -${(suPct * 0.5).toFixed(1)}`);

  const inseong = saju.factorStrength.인성.weightedStrength;
  sum -= inseong * GRADE.상조;
  trace.push(`- 인성 강도 상조 (식상 억제): ${inseong} × 0.5 = -${(inseong * 0.5).toFixed(1)}`);

  // ── 여기 (−) ──
  if (saju.has12UnseongWeak) {
    sum -= 50 * GRADE.여기;
    trace.push(`- 12운성 약세 여기: 50 × 0.2 = -10.0`);
  }

  return factorResult('hwalgi', '활기', sum, trace);
}

// ─── 조심 점수 산출 ───
// 룰 표 (2_child_6factors.md 요인 2):
//   본기 +1.0: 정관 + 편관(칠살) + 인성 → 통칭화: 관성 + 인성
//   상조 +0.5: 음일간 / 토 오행%
//   여기 +0.2: 12운성 약세 / 화개살(내면)
//   본기 -1.0: 양인 (거침의 본기)
//   정액 -50: 관성 무존재
//   상조 -0.5: 식상 강 + 관성 약 결합
export function calcJosim(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;

  // 본기 (+)
  sum += gwanSeong * GRADE.본기;
  trace.push(`+ 관성 본기: ${gwanSeong} × 1.0 = ${(gwanSeong * 1.0).toFixed(1)}`);

  sum += inSeong * GRADE.본기;
  trace.push(`+ 인성 본기: ${inSeong} × 1.0 = ${(inSeong * 1.0).toFixed(1)}`);

  // 상조 (+)
  if (!isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 음일간 상조: 50 × 0.5 = 25.0`);
  }
  const toPct = oheangPercent(saju, '토');
  sum += toPct * GRADE.상조;
  trace.push(`+ 토 오행 상조: ${toPct}% × 0.5 = ${(toPct * 0.5).toFixed(1)}`);

  // 여기 (+)
  if (saju.has12UnseongWeak) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 12운성 약세 여기: 50 × 0.2 = 10.0`);
  }
  if (saju.sinsal.화개살?.present) {
    sum += saju.sinsal.화개살.score50 * GRADE.여기;
    trace.push(`+ 화개살 여기: ${saju.sinsal.화개살.score50} × 0.2 = ${(saju.sinsal.화개살.score50 * 0.2).toFixed(1)}`);
  }

  // 본기 (−)
  if (saju.sinsal.양인?.present) {
    sum -= saju.sinsal.양인.score50 * GRADE.본기;
    trace.push(`- 양인 본기 (거침): ${saju.sinsal.양인.score50} × 1.0 = -${(saju.sinsal.양인.score50 * 1.0).toFixed(1)}`);
  }

  // 정액 (−)
  if (!hasUnknownHour(saju) && gwanSeong < 10) {
    sum -= 50;
    trace.push(`- 관성 무존재 정액: -50`);
  }

  // 상조 (−)
  if (sikSang >= 50 && gwanSeong < 30) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 식상 강 + 관성 약 상조: 50 × 0.5 = -25.0`);
  }

  return factorResult('josim', '조심', sum, trace);
}

// ─── 만족 점수 산출 ───
// 룰 표 (요인 3):
//   본기 +1.0: 조후 균형 / 식신 (통칭화: 식상)
//   상조 +0.5: 천을귀인 / 관인상생 / 양일간 + 화 강
//   여기 +0.2: 문창귀인 / 일주 안정
//   본기 -1.0: 조후 불균형 (차이 ≥ 4)
//   상조 -0.5: 칠살 강 + 일간 약 (통칭화: 관성 강 + 신약) / 충·해 3개 이상
export function calcManjok(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const johu = saju.factorStrength.조후;

  // 본기 (+)
  // 조후 균형: balanced=true (차이 ≤ 1) → 50점
  if (johu.balanced) {
    sum += 50 * GRADE.본기;
    trace.push(`+ 조후 균형 본기: 50 × 1.0 = 50.0`);
  }
  sum += sikSang * GRADE.본기;
  trace.push(`+ 식상 본기: ${sikSang} × 1.0 = ${(sikSang * 1.0).toFixed(1)}`);

  // 상조 (+)
  if (saju.sinsal.천을귀인?.present) {
    sum += saju.sinsal.천을귀인.score50 * GRADE.상조;
    trace.push(`+ 천을귀인 상조: ${saju.sinsal.천을귀인.score50} × 0.5 = ${(saju.sinsal.천을귀인.score50 * 0.5).toFixed(1)}`);
  }
  const gwanInSangsaeng = (gwanSeong + inSeong) / 2 >= 50 ? 50 : 0;
  if (gwanInSangsaeng > 0) {
    sum += gwanInSangsaeng * GRADE.상조;
    trace.push(`+ 관인상생 상조: ${gwanInSangsaeng} × 0.5 = ${(gwanInSangsaeng * 0.5).toFixed(1)}`);
  }
  const hwaPct = oheangPercent(saju, '화');
  if (isYang && hwaPct >= 20) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 양일간 + 화 강 상조: 50 × 0.5 = 25.0`);
  }

  // 여기 (+)
  if (saju.sinsal.문창귀인?.present) {
    sum += saju.sinsal.문창귀인.score50 * GRADE.여기;
    trace.push(`+ 문창귀인 여기: ${saju.sinsal.문창귀인.score50} × 0.2 = ${(saju.sinsal.문창귀인.score50 * 0.2).toFixed(1)}`);
  }
  const stable = saju.factorStrength.관성.weightedStrength >= 30
              && saju.factorStrength.인성.weightedStrength >= 30
              && saju.factorStrength.재성.weightedStrength >= 30;
  if (stable) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 일주 안정 여기: 50 × 0.2 = 10.0`);
  }

  // 본기 (−)
  if (johu.차이 >= 4) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 조후 불균형(차이 ${johu.차이}) 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 (−)
  if (gwanSeong >= 50 && isShinyak) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 칠살(관성) 강 + 신약 상조: 50 × 0.5 = -25.0`);
  }
  const chungHaeWonjin = (saju.branchInteractions?.충?.length ?? 0)
                       + (saju.branchInteractions?.해?.length ?? 0)
                       + (saju.branchInteractions?.원진?.length ?? 0);
  if (chungHaeWonjin >= 3) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 충·해·원진 3개 이상 상조: 50 × 0.5 = -25.0`);
  }

  return factorResult('manjok', '만족', sum, trace);
}

// ─── 흔들림 점수 산출 ───
// 룰 표 (요인 4):
//   본기 +1.0: 조후 불균형(극단) / 충 개수 / 칠살 강 + 신약
//   상조 +0.5: 해 개수 / 원진 개수 / 기신 강도
//   여기 +0.2: 12운성 약세 / 형 개수
//   본기 -1.0: 조후 균형
//   상조 -0.5: 일주 안정 / 관인상생
export function calcHeundeullim(saju) {
  let sum = 0;
  const trace = [];

  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const johu = saju.factorStrength.조후;

  // 본기 (+)
  if (johu.차이 >= 4) {
    sum += 50 * GRADE.본기;
    trace.push(`+ 조후 불균형(차이 ${johu.차이}) 본기: 50 × 1.0 = 50.0`);
  }
  const chungCount = saju.branchInteractions?.충?.length ?? 0;
  if (chungCount > 0) {
    sum += chungCount * 50 * GRADE.본기;
    trace.push(`+ 충 ${chungCount}개 본기: ${chungCount * 50} × 1.0 = ${(chungCount * 50).toFixed(1)}`);
  }
  if (gwanSeong >= 50 && isShinyak) {
    sum += 50 * GRADE.본기;
    trace.push(`+ 칠살(관성) 강 + 신약 본기: 50 × 1.0 = 50.0`);
  }

  // 상조 (+)
  const haeCount = saju.branchInteractions?.해?.length ?? 0;
  if (haeCount > 0) {
    sum += haeCount * 50 * GRADE.상조;
    trace.push(`+ 해 ${haeCount}개 상조: ${haeCount * 50} × 0.5 = ${(haeCount * 50 * 0.5).toFixed(1)}`);
  }
  const wonjinCount = saju.branchInteractions?.원진?.length ?? 0;
  if (wonjinCount > 0) {
    sum += wonjinCount * 50 * GRADE.상조;
    trace.push(`+ 원진 ${wonjinCount}개 상조: ${wonjinCount * 50} × 0.5 = ${(wonjinCount * 50 * 0.5).toFixed(1)}`);
  }
  // 기신 강도 — fixture에 별도 명시 X. 룰 명확화 필요 → Phase 7 검토. 일단 스킵
  // trace.push(`(기신 강도 미구현)`);

  // 여기 (+)
  if (saju.has12UnseongWeak) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 12운성 약세 여기: 50 × 0.2 = 10.0`);
  }
  const hyeongCount = saju.branchInteractions?.형?.length ?? 0;
  if (hyeongCount > 0) {
    sum += hyeongCount * 50 * GRADE.여기;
    trace.push(`+ 형 ${hyeongCount}개 여기: ${hyeongCount * 50} × 0.2 = ${(hyeongCount * 50 * 0.2).toFixed(1)}`);
  }

  // 본기 (−)
  if (johu.balanced) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 조후 균형 본기: 50 × 1.0 = -50.0`);
  }

  // 상조 (−)
  const stable = saju.factorStrength.관성.weightedStrength >= 30
              && saju.factorStrength.인성.weightedStrength >= 30
              && saju.factorStrength.재성.weightedStrength >= 30;
  if (stable) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 일주 안정 상조: 50 × 0.5 = -25.0`);
  }
  const gwanInSangsaeng = (gwanSeong + inSeong) / 2 >= 50 ? 50 : 0;
  if (gwanInSangsaeng > 0) {
    sum -= gwanInSangsaeng * GRADE.상조;
    trace.push(`- 관인상생 상조: ${gwanInSangsaeng} × 0.5 = -${(gwanInSangsaeng * 0.5).toFixed(1)}`);
  }

  return factorResult('heundeullim', '흔들림', sum, trace);
}

// ─── 어울림 점수 산출 ───
// 룰 표 (요인 5):
//   본기 +1.0: 일지 합·반합·암합 개수 / 천을귀인 / 도화살
//   상조 +0.5: 인성 / 수 오행% / 목 오행%
//   여기 +0.2: 문창귀인 / 화개살
//   정액 -50: 인성 무존재
//   상조 -0.5: 양인 + 양일간 결합 (거친 결)
//   여기 -0.2: 식상+비겁만 강
export function calcEoullim(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';
  const inSeong = saju.factorStrength.인성.weightedStrength;
  const sikSang = saju.factorStrength.식상.weightedStrength;
  const biGeop = saju.factorStrength.비겁.weightedStrength;

  // 본기 (+): 어울림은 인성 자체보다 관계 접점 인자를 중심으로 본다.
  const hapCount = saju.branchInteractions?.합?.length ?? 0;
  if (hapCount > 0) {
    sum += hapCount * 50 * GRADE.본기;
    trace.push(`+ 일지 합 ${hapCount}개 본기: ${hapCount * 50} × 1.0 = ${(hapCount * 50).toFixed(1)}`);
  }
  if (saju.sinsal.천을귀인?.present) {
    sum += saju.sinsal.천을귀인.score50 * GRADE.본기;
    trace.push(`+ 천을귀인 본기: ${saju.sinsal.천을귀인.score50} × 1.0 = ${(saju.sinsal.천을귀인.score50 * 1.0).toFixed(1)}`);
  }
  if (saju.sinsal.도화살?.present) {
    sum += saju.sinsal.도화살.score50 * GRADE.본기;
    trace.push(`+ 도화살 본기: ${saju.sinsal.도화살.score50} × 1.0 = ${(saju.sinsal.도화살.score50 * 1.0).toFixed(1)}`);
  }

  // 상조 (+)
  sum += inSeong * GRADE.상조;
  trace.push(`+ 인성 상조: ${inSeong} × 0.5 = ${(inSeong * 0.5).toFixed(1)}`);

  const suPct = oheangPercent(saju, '수');
  const mokPct = oheangPercent(saju, '목');
  sum += suPct * GRADE.상조;
  trace.push(`+ 수 오행 상조: ${suPct}% × 0.5 = ${(suPct * 0.5).toFixed(1)}`);
  sum += mokPct * GRADE.상조;
  trace.push(`+ 목 오행 상조: ${mokPct}% × 0.5 = ${(mokPct * 0.5).toFixed(1)}`);

  // 여기 (+)
  if (saju.sinsal.문창귀인?.present) {
    sum += saju.sinsal.문창귀인.score50 * GRADE.여기;
    trace.push(`+ 문창귀인 여기: ${saju.sinsal.문창귀인.score50} × 0.2 = ${(saju.sinsal.문창귀인.score50 * 0.2).toFixed(1)}`);
  }

  // 정액 (−)
  if (!hasUnknownHour(saju) && inSeong < 10) {
    sum -= 50;
    trace.push(`- 인성 무존재 정액: -50`);
  }

  // 상조 (−)
  if (saju.sinsal.양인?.present && isYang) {
    sum -= saju.sinsal.양인.score50 * GRADE.상조;
    trace.push(`- 양인+양일간 결합(거친 결) 상조: ${saju.sinsal.양인.score50} × 0.5 = -${(saju.sinsal.양인.score50 * 0.5).toFixed(1)}`);
  }

  // 여기 (−)
  // 식상+비겁만 강 = 인성·관성·재성 모두 약하고 식상·비겁만 강
  const onlySikBigeop = sikSang >= 50 && biGeop >= 50
                     && inSeong < 30 && saju.factorStrength.관성.weightedStrength < 30 && saju.factorStrength.재성.weightedStrength < 30;
  if (onlySikBigeop) {
    sum -= 50 * GRADE.여기;
    trace.push(`- 식상+비겁만 강 여기: 50 × 0.2 = -10.0`);
  }

  return factorResult('eoullim', '어울림', sum, trace);
}

// ─── 모든 6요인 산출 (통합) ───
export function calcAll6Factors(saju) {
  const calibrated = calcAll6FactorsUncapped(saju);

  if (!hasUnknownHour(saju) && saju.dateOnlySaju) {
    const dateOnly = Object.fromEntries(
      Object.entries(calcAll6FactorsUncapped(saju.dateOnlySaju))
        .map(([key, result]) => [key, softenUnknownHourScore(result)]),
    );
    return Object.fromEntries(
      Object.entries(calibrated).map(([key, result]) => [key, capHourInfluence(result, dateOnly[key])]),
    );
  }

  if (!hasUnknownHour(saju)) return calibrated;

  return Object.fromEntries(
    Object.entries(calibrated).map(([key, result]) => [key, softenUnknownHourScore(result)]),
  );
}

// ─── 끈기 점수 산출 ───
// 룰 표 (2_child_6factors.md 요인 6):
//   본기 +1.0: 정관 강도 / 정인 강도 / 관인상생 조합
//   상조 +0.5: 토 오행% / 음일간 / 12운성 강세
//   여기 +0.2: 일주 안정 / 천을귀인
//   본기 -1.0: 양인(충동) / 편관(칠살) + 신약
//   상조 -0.5: 식상 과다 + 관성 약 / 충 3개 이상
//   정액 -50: 관성 무존재
//
// 통칭 6셋 적용: 정관 → 관성 / 정인 → 인성 (편관·편인 포함). 단 칠살+신약 본기 감산은 별도 처리 필요
export function calcKkeungi(saju) {
  let sum = 0;
  const trace = [];

  const isYang = saju.yinyang === '양';

  // ── 본기 (+) ──
  const gwanSeong = saju.factorStrength.관성.weightedStrength;
  const inSeong = saju.factorStrength.인성.weightedStrength;
  // 관인상생 조합 = 관성·인성 둘 다 자리 + 일정 강도 이상 (룰 명확 안 됨)
  // 결정: 두 인자 weightedStrength 평균이 50점 이상이면 관인상생 강 (50점)
  const gwanInSangsaeng = (gwanSeong + inSeong) / 2 >= 50 ? 50 : 0;

  sum += gwanSeong * GRADE.본기;
  trace.push(`+ 관성 본기: ${gwanSeong} × 1.0 = ${(gwanSeong * 1.0).toFixed(1)}`);

  sum += inSeong * GRADE.본기;
  trace.push(`+ 인성 본기: ${inSeong} × 1.0 = ${(inSeong * 1.0).toFixed(1)}`);

  sum += gwanInSangsaeng * GRADE.본기;
  trace.push(`+ 관인상생 본기: ${gwanInSangsaeng} × 1.0 = ${(gwanInSangsaeng * 1.0).toFixed(1)}`);

  // ── 상조 (+) ──
  const toPct = oheangPercent(saju, '토');
  sum += toPct * GRADE.상조;
  trace.push(`+ 토 오행 상조: ${toPct}% × 0.5 = ${(toPct * 0.5).toFixed(1)}`);

  if (!isYang) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 음일간 상조: 50 × 0.5 = 25.0`);
  }
  if (saju.has12UnseongStrong) {
    sum += 50 * GRADE.상조;
    trace.push(`+ 12운성 강세 상조: 50 × 0.5 = 25.0`);
  }

  // ── 여기 (+) ──
  if (saju.sinsal.천을귀인?.present) {
    sum += saju.sinsal.천을귀인.score50 * GRADE.여기;
    trace.push(`+ 천을귀인 여기: ${saju.sinsal.천을귀인.score50} × 0.2 = ${(saju.sinsal.천을귀인.score50 * 0.2).toFixed(1)}`);
  }
  // 일주 안정 = 정관·정인·정재 조합 (룰 명확 안 됨)
  // 결정: 관성·인성·재성 weightedStrength가 모두 ≥ 30이면 일주 안정 (50점)
  const stable = saju.factorStrength.관성.weightedStrength >= 30
              && saju.factorStrength.인성.weightedStrength >= 30
              && saju.factorStrength.재성.weightedStrength >= 30;
  if (stable) {
    sum += 50 * GRADE.여기;
    trace.push(`+ 일주 안정 여기: 50 × 0.2 = 10.0`);
  }

  // ── 본기 (−) ──
  if (saju.sinsal.양인?.present) {
    sum -= saju.sinsal.양인.score50 * GRADE.본기;
    trace.push(`- 양인 본기 (충동): ${saju.sinsal.양인.score50} × 1.0 = -${(saju.sinsal.양인.score50 * 1.0).toFixed(1)}`);
  }

  // 칠살(편관) + 신약 — 통칭 관성에서 편관 분리 못 함
  // 결정: 관성 강 + 신약 결합 시 감산
  const isShinyak = ['극약', '태약', '신약'].includes(saju.shinkang.level);
  if (gwanSeong >= 50 && isShinyak) {
    sum -= 50 * GRADE.본기;
    trace.push(`- 칠살+신약 본기: 50 × 1.0 = -50.0`);
  }

  // ── 상조 (−) ──
  const sikSang = saju.factorStrength.식상.weightedStrength;
  if (sikSang >= 50 && gwanSeong < 30) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 식상 과다 + 관성 약 상조: 50 × 0.5 = -25.0`);
  }
  const chungCount = (saju.branchInteractions?.충 ?? []).length;
  if (chungCount >= 3) {
    sum -= 50 * GRADE.상조;
    trace.push(`- 충 3개 이상 상조: 50 × 0.5 = -25.0`);
  }

  // ── 정액 감산 ──
  if (!hasUnknownHour(saju) && gwanSeong < 10) {
    sum -= 50;
    trace.push(`- 관성 무존재 정액: -50`);
  }

  return factorResult('kkeungi', '끈기', sum, trace);
}
