// 36셀 매트릭스 = 부모 6축 × 자녀 6요인 (Phase 2)
//
// 데이터: 4_matrix_36.md
// 룰 23 헤더 변환 (결합 결과 직접 표현)
// 룰 24 카드 구성 (어머님 2 + 아버님 2, 한쪽 모두 충돌이면 시너지 1장 추가)
// 룰 16 점수 노출 X (서브 줄에 한 번만)
//
// 작성: 2026-05-16

// 패턴 분류
export const PATTERN = {
  STRONG_SYNERGY: 'strong_synergy',  // 강한 시너지
  SYNERGY:        'synergy',          // 시너지
  COMPLEMENT:     'complement',       // 보완
  AMBIVALENT:     'ambivalent',       // 양면
  CONFLICT_RISK:  'conflict_risk',    // 충돌 위험
  STRONG_CONFLICT:'strong_conflict',  // 강한 충돌
};

const P = PATTERN;

// ─── 36셀 매트릭스 데이터 ───
// 행 = 부모 6축, 열 = 자녀 6요인
// 각 셀 = { tone, pattern, header(자녀 이름 자리 {n}) }
export const MATRIX_36 = {
  ongi: {
    hwalgi:      { tone: '활기로운 결을 따뜻하게 안아주는 결 — 에너지 분출을 받아줌',
                   pattern: P.SYNERGY,
                   header: '{n}의 활기를 {p}이 따뜻하게 받아주는 자리' },
    josim:       { tone: '신중한 결의 수줍음을 따뜻하게 풀어주는 결 — 안전 기지',
                   pattern: P.SYNERGY,
                   header: '{n}의 신중함을 {p}이 따뜻하게 풀어주는 자리' },
    manjok:      { tone: '낙관 결의 즐거움을 함께 누리는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 만족을 {p}이 함께 누리는 자리' },
    heundeullim: { tone: '예민한 결의 회복을 가장 빨리 도와주는 결 — 정서 회복 본기',
                   pattern: P.STRONG_SYNERGY,
                   header: '{n}이 흔들릴 때 {p}이 안정시키는 자리' },
    eoullim:     { tone: '공감 결의 감정 흡수를 따뜻하게 받아주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 공감을 {p}이 따뜻하게 받아주는 자리' },
    kkeungi:     { tone: '인내 결의 노력을 따뜻하게 인정해주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 끈기를 {p}이 따뜻하게 인정해주는 자리' },
  },
  jungsim: {
    hwalgi:      { tone: '활기로운 결에 명확한 한계를 주는 결 — 에너지 방향 제시',
                   pattern: P.STRONG_SYNERGY,
                   header: '{n}의 활기에 {p}이 방향을 잡아주는 자리' },
    josim:       { tone: '신중한 결에 안전 신호를 미리 주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 신중함에 {p}이 안전 신호를 주는 자리' },
    manjok:      { tone: '낙관 결에 기준의 명확함을 더하는 결',
                   pattern: P.COMPLEMENT,
                   header: '{n}의 만족에 {p}이 기준을 더하는 자리' },
    heundeullim: { tone: '예민한 결이 흔들릴 때 안정의 축이 되는 결',
                   pattern: P.SYNERGY,
                   header: '{n}이 흔들릴 때 {p}이 단단한 축이 되는 자리' },
    eoullim:     { tone: '공감 결에 자기 자리를 잃지 않을 기준을 주는 결',
                   pattern: P.COMPLEMENT,
                   header: '{n}의 공감에 {p}이 자기 자리를 지키게 하는 자리' },
    kkeungi:     { tone: '인내 결을 단단한 기준으로 받쳐주는 결',
                   pattern: P.STRONG_SYNERGY,
                   header: '{p}의 기준이 {n}의 끈기를 받쳐주는 자리' },
  },
  ilgwan: {
    hwalgi:      { tone: '활기로운 결에 예측 가능한 리듬을 주는 결',
                   pattern: P.COMPLEMENT,
                   header: '{n}의 활기에 {p}이 리듬을 주는 자리' },
    josim:       { tone: '신중한 결에 안전한 일상을 만들어주는 결 — 안정 본기',
                   pattern: P.STRONG_SYNERGY,
                   header: '{n}의 신중함에 {p}이 안전한 일상을 만들어주는 자리' },
    manjok:      { tone: '낙관 결에 안정된 일상 흐름을 주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 만족에 {p}이 안정된 흐름을 주는 자리' },
    heundeullim: { tone: '예민한 결의 정서 회복에 가장 큰 약 — 같은 시간·같은 자리',
                   pattern: P.STRONG_SYNERGY,
                   header: '{p}의 한결같음이 {n}의 정서를 가라앉히는 자리' },
    eoullim:     { tone: '공감 결에 예측 가능한 관계 환경을 주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 공감에 {p}이 예측 가능한 관계 환경을 주는 자리' },
    kkeungi:     { tone: '인내 결의 꾸준함과 부모 꾸준함이 만나는 결',
                   pattern: P.STRONG_SYNERGY,
                   header: '{n}의 끈기와 {p}의 꾸준함이 함께 가는 자리' },
  },
  jayul: {
    hwalgi:      { tone: '활기로운 결을 막지 않고 흐를 자리를 주는 결',
                   pattern: P.STRONG_SYNERGY,
                   header: '{n}의 활기에 {p}이 흐를 자리를 주는 자리' },
    josim:       { tone: '신중한 결을 재촉하지 않고 기다려주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 신중함을 {p}이 기다려주는 자리' },
    manjok:      { tone: '낙관 결에 자기 페이스의 즐거움을 허락하는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 만족을 {p}이 자기 페이스로 허락하는 자리' },
    heundeullim: { tone: '예민한 결이 감정을 안에서 풀 시간을 주는 결',
                   pattern: P.SYNERGY,
                   header: '{n}이 흔들릴 때 {p}이 풀 시간을 주는 자리' },
    eoullim:     { tone: '공감 결의 관계를 부모가 침범하지 않는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 공감 관계를 {p}이 침범하지 않는 자리' },
    kkeungi:     { tone: '인내 결을 부모가 끝까지 끌어가지 않고 자기 페이스 허락',
                   pattern: P.COMPLEMENT,
                   header: '{n}의 끈기를 {p}이 자기 페이스로 허락하는 자리' },
  },
  pyohyeon: {
    hwalgi:      { tone: '활기로운 결에 부모 표현이 크게 닿는 결 — 자극의 크기 조절 필요',
                   pattern: P.CONFLICT_RISK,
                   header: '{p}의 표현이 {n}의 활기에 크게 닿을 수 있는 자리' },
    josim:       { tone: '신중한 결에 부모 표현의 속도가 빠르게 느껴질 수 있는 결',
                   pattern: P.CONFLICT_RISK,
                   header: '{p}의 표현이 {n}의 신중함보다 앞서갈 수 있는 자리' },
    manjok:      { tone: '낙관 결과 부모 표현이 함께 환해지는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 만족과 {p}의 표현이 함께 환해지는 자리' },
    heundeullim: { tone: '예민한 결에 부모 표현이 깊이 새겨지는 결 — 칭찬·야단 모두 강하게',
                   pattern: P.AMBIVALENT,
                   header: '{p}의 표현이 {n}의 마음에 깊이 새겨지는 자리' },
    eoullim:     { tone: '공감 결과 부모 표현이 함께 흐르는 결',
                   pattern: P.SYNERGY,
                   header: '{n}의 공감과 {p}의 표현이 함께 흐르는 자리' },
    kkeungi:     { tone: '인내 결에 부모 표현이 격려가 되는 결',
                   pattern: P.SYNERGY,
                   header: '{p}의 표현이 {n}의 끈기에 격려가 되는 자리' },
  },
  baram: {
    hwalgi:      { tone: '활기로운 결을 결과로 몰아 에너지 소진 위험',
                   pattern: P.CONFLICT_RISK,
                   header: '{p}의 기대가 {n}의 활기를 소진시킬 수 있는 자리' },
    josim:       { tone: '신중한 결에 결과 압력은 속도를 빠르게 느끼게 하는 결',
                   pattern: P.STRONG_CONFLICT,
                   header: '{p}의 기대가 {n}의 신중함보다 앞서갈 수 있는 자리' },
    manjok:      { tone: '낙관 결의 즐거움이 결과 확인에 묶여 옅어지는 결',
                   pattern: P.CONFLICT_RISK,
                   header: '{p}의 결과 확인이 {n}의 만족을 옅어지게 할 수 있는 자리' },
    heundeullim: { tone: '예민한 결에 결과 압력이 깊게 새겨질 수 있는 결',
                   pattern: P.STRONG_CONFLICT,
                   header: '{p}의 기대가 {n}의 마음에 깊게 남을 수 있는 자리' },
    eoullim:     { tone: '공감 결이 부모 기대를 많이 흡수해 자기 결이 흐려질 수 있는 자리',
                   pattern: P.STRONG_CONFLICT,
                   header: '{p}의 기대를 {n}이 많이 흡수할 수 있는 자리' },
    kkeungi:     { tone: '인내 결과 부모 바람이 만나 추진력과 높은 긴장을 함께 만드는 결',
                   pattern: P.AMBIVALENT,
                   header: '{p}의 기대가 {n}의 끈기에 추진력과 긴장을 동시에 주는 자리' },
  },
};

// ─── 매트릭스 매칭 함수 ───
// 1. 부모 6축 점수 → 강한 축 추출 (≥66) + fallback (상위 2축)
// 2. 자녀 6요인 모든 점수와 셀 매칭
// 3. 시너지·충돌 카드 분리
// 4. 룰 24 카드 구성 룰 적용
const SYNERGY_PATTERNS = [P.STRONG_SYNERGY, P.SYNERGY, P.COMPLEMENT];
const CONFLICT_PATTERNS = [P.CONFLICT_RISK, P.STRONG_CONFLICT];
// AMBIVALENT는 별도 (강 분류 시 충돌 쪽으로)

const FACTOR_NAMES = {
  hwalgi: '활기', josim: '조심', manjok: '만족',
  heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기',
};
const AXIS_NAMES = {
  ongi: '온기', jungsim: '중심', ilgwan: '일관',
  jayul: '자율', pyohyeon: '표현', baram: '바람',
};

// 부모 강한 축 추출 (≥66 우선, 0개면 fallback 상위 2)
export function pickStrongAxes(axes) {
  const sorted = Object.entries(axes).sort((a, b) => b[1].score - a[1].score);
  const strong = sorted.filter(([, v]) => v.score >= 66);
  if (strong.length >= 1) return strong;
  // Fallback: 상위 2축
  return sorted.slice(0, 2);
}

// 한 부모 카드 매칭
// parentAxes = 부모 6축 {ongi: {score, level, ...}, ...}
// childFactors = 자녀 6요인 {hwalgi: {score, level, ...}, ...}
// parentName = "어머님" or "아버님"
// childName = "김수민 양"
export function matchParentCards(parentAxes, childFactors, parentName, childName) {
  const strongAxes = pickStrongAxes(parentAxes);
  const cards = [];

  for (const [axisKey, axisData] of strongAxes) {
    // 자녀 6요인 모두와 매칭
    for (const [factorKey, factorData] of Object.entries(childFactors)) {
      const cell = MATRIX_36[axisKey]?.[factorKey];
      if (!cell) continue;

      // 자녀 점수가 의미 있는 경우만 (극단 점수 우선)
      // 시너지: 자녀 점수가 본기 매칭 (요인 ≥ 66) 또는 자녀 점수 무관 시너지
      // 충돌: 자녀 점수가 본기 매칭 (요인 ≥ 66, 특히 신중·공감·정서)

      // 점수 기반 카드 강도
      const cellStrength = (axisData.score + factorData.score) / 2;

      cards.push({
        axis: axisKey,
        axisKorean: AXIS_NAMES[axisKey],
        axisScore: axisData.score,
        axisLevel: axisData.level,
        factor: factorKey,
        factorKorean: FACTOR_NAMES[factorKey],
        factorScore: factorData.score,
        factorLevel: factorData.level,
        tone: cell.tone,
        pattern: cell.pattern,
        header: cell.header
          .replace('{n}', childName)
          .replace('{p}', parentName),
        cellStrength,
        isSynergy: SYNERGY_PATTERNS.includes(cell.pattern),
        isConflict: CONFLICT_PATTERNS.includes(cell.pattern),
        isAmbivalent: cell.pattern === P.AMBIVALENT,
      });
    }
  }
  return cards;
}

// 카드 구성 룰 (룰 24) 적용 — 한 부모당 2장 (시너지·충돌 균형)
export function selectFinalCards(allCards) {
  // 자녀 본기 매칭 우선 (자녀 점수 ≥ 66인 요인 카드 우선)
  const sorted = [...allCards].sort((a, b) => {
    // 1. 자녀 요인 상위권 우선
    const aHigh = a.factorLevel === 'high' ? 1 : 0;
    const bHigh = b.factorLevel === 'high' ? 1 : 0;
    if (aHigh !== bHigh) return bHigh - aHigh;
    // 2. cellStrength 큰 순
    return b.cellStrength - a.cellStrength;
  });

  const synergies = sorted.filter(c => c.isSynergy || c.isAmbivalent);
  const conflicts = sorted.filter(c => c.isConflict);

  let picked;
  if (conflicts.length === 0) {
    // 모두 시너지 → 시너지 2장
    picked = synergies.slice(0, 2);
  } else if (synergies.length === 0) {
    // 모두 충돌 → 충돌 2장 + 시너지 1장 (룰 24, 균형 보장)
    // 단 시너지가 0개면 충돌 2장만
    picked = conflicts.slice(0, 2);
  } else {
    // 기본: 시너지 1 + 충돌 1
    picked = [synergies[0], conflicts[0]];
  }

  return picked;
}

// 통합 함수 — 부모 양쪽 카드 픽
export function matchAllCards(motherAxes, fatherAxes, childFactors, childName, hasMother = true, hasFather = true) {
  const result = {
    motherCards: [],
    fatherCards: [],
    motherStrongAxes: [],
    fatherStrongAxes: [],
  };

  if (hasMother && motherAxes) {
    const all = matchParentCards(motherAxes, childFactors, '어머님', childName);
    result.motherCards = selectFinalCards(all);
    result.motherStrongAxes = pickStrongAxes(motherAxes).map(([k, v]) => ({ key: k, korean: AXIS_NAMES[k], score: v.score }));
  }

  if (hasFather && fatherAxes) {
    const all = matchParentCards(fatherAxes, childFactors, '아버님', childName);
    result.fatherCards = selectFinalCards(all);
    result.fatherStrongAxes = pickStrongAxes(fatherAxes).map(([k, v]) => ({ key: k, korean: AXIS_NAMES[k], score: v.score }));
  }

  return result;
}
