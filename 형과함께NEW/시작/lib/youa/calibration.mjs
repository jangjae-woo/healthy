// 캘리브레이션 (Phase 7)
//
// 100개 무작위 사주 → 6요인 분포 분석
// 이상 분포: 낮음 25~30% / 중간 40~50% / 높음 25~30%
//
// 작성: 2026-05-17

import { STEMS, BRANCHES } from './saju-helpers.mjs';
import { buildChildFixture } from './auto-fixture-builder.mjs';
import { calcAll6Factors } from './factors.mjs';

// 1. 무작위 사주 8자 생성 (60갑자 + 12지지 조합)
// 단순화: 갑자~계해 60갑자 중 랜덤 4개 (실제 만세력 룰 무시 — 분포 검증만 목적)
function randomPillar() {
  const stem = STEMS[Math.floor(Math.random() * 10)];
  const branch = BRANCHES[Math.floor(Math.random() * 12)];
  // 천간×지지 = 양양 또는 음음만 가능 (양천간 + 양지지, 음천간 + 음지지)
  return { stem, branch };
}

// 사주의 천간·지지는 음양이 같아야 (60갑자 룰)
// 단순화: 임의 생성 후 음양 맞춤
import { STEM_YY, BRANCH_YY } from './saju-helpers.mjs';
function validPillar() {
  for (let i = 0; i < 50; i++) {
    const stem = STEMS[Math.floor(Math.random() * 10)];
    const branch = BRANCHES[Math.floor(Math.random() * 12)];
    if (STEM_YY[stem] === BRANCH_YY[branch]) return { stem, branch };
  }
  return { stem: '갑', branch: '자' };
}

export function generateRandomSaju() {
  const pillars = {
    year: validPillar(),
    month: validPillar(),
    day: validPillar(),
    hour: validPillar(),
  };
  return pillars;
}

// 2. N개 샘플 생성 + 점수 산출
export function calibrate(N = 100) {
  const samples = [];
  const failures = [];

  for (let i = 0; i < N; i++) {
    try {
      const pillars = generateRandomSaju();
      const fixture = buildChildFixture(pillars);
      const factors = calcAll6Factors(fixture);
      samples.push({ pillars, fixture, factors });
    } catch (e) {
      failures.push({ i, error: e.message });
    }
  }

  // 분포 분석
  const distribution = {};
  for (const k of ['hwalgi', 'josim', 'manjok', 'heundeullim', 'eoullim', 'kkeungi']) {
    const scores = samples.map(s => s.factors[k].score);
    const low = scores.filter(s => s <= 40).length;
    const mid = scores.filter(s => s >= 41 && s <= 65).length;
    const high = scores.filter(s => s >= 66).length;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const std = Math.sqrt(scores.reduce((acc, s) => acc + (s - avg) ** 2, 0) / scores.length);

    distribution[k] = {
      lowCount: low, midCount: mid, highCount: high,
      lowPct: Math.round((low / scores.length) * 100),
      midPct: Math.round((mid / scores.length) * 100),
      highPct: Math.round((high / scores.length) * 100),
      avg: Math.round(avg * 10) / 10,
      std: Math.round(std * 10) / 10,
      min, max,
      histogram: makeHistogram(scores),
    };
  }

  // 동물 매칭 분포
  const animalDist = { tiger: 0, rabbit: 0, horse: 0, pig: 0, sheep: 0, cow: 0, dragon: 0 };
  for (const s of samples) {
    const factors = s.factors;
    const sorted = Object.entries(factors).sort((a, b) => b[1].score - a[1].score);
    const top = sorted[0][0];
    const animalMap = { hwalgi: 'tiger', josim: 'rabbit', manjok: 'horse', heundeullim: 'pig', eoullim: 'sheep', kkeungi: 'cow' };
    const allMid = sorted.every(([, v]) => v.score >= 41 && v.score <= 65);
    if (allMid || sorted[0][1].score <= 65) animalDist.dragon++;
    else animalDist[animalMap[top]]++;
  }

  return {
    N,
    successCount: samples.length,
    failureCount: failures.length,
    distribution,
    animalDist,
    samples,
  };
}

function makeHistogram(scores, bins = 10) {
  const histogram = Array(bins).fill(0);
  for (const s of scores) {
    const idx = Math.min(bins - 1, Math.floor(s / (100 / bins)));
    histogram[idx]++;
  }
  return histogram;
}

// 이상 분포 평가
export function evaluateDistribution(distribution) {
  const evaluation = {};
  for (const [k, d] of Object.entries(distribution)) {
    const issues = [];
    if (d.lowPct < 15) issues.push('낮음 비율 부족 (이상 25~30%)');
    if (d.lowPct > 40) issues.push('낮음 비율 과다 (이상 25~30%)');
    if (d.midPct < 30) issues.push('중간 비율 부족 (이상 40~50%)');
    if (d.midPct > 60) issues.push('중간 비율 과다 (이상 40~50%)');
    if (d.highPct < 15) issues.push('높음 비율 부족 (이상 25~30%)');
    if (d.highPct > 40) issues.push('높음 비율 과다 (이상 25~30%)');
    evaluation[k] = {
      ok: issues.length === 0,
      issues,
      verdict: issues.length === 0 ? '✓ 정상' : `⚠ ${issues.length}건 위반`,
    };
  }
  return evaluation;
}
