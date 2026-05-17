// 7동물 매칭 + 케이스 분기 (Phase 2)
//
// 룰: 5_visuals.md 매칭 + 6_rules.md 룰 29 케이스 A/B/C
//
// 7동물:
//   호랑이 = 활기 1등 / 토끼 = 조심 / 말 = 만족 / 돼지 = 흔들림 / 양 = 어울림 / 소 = 끈기 / 용 = 균형형
//
// 케이스 분기:
//   A 단독: 상위권 + (1등 - 2등) > 10
//   B 비등: 상위권 + (1등 - 3등) ≤ 6
//   C 균형: 모두 중간권 또는 상위권 없음
//   (둘 다 미충족 시 = A 보더라인 — 본 코드 결정)
//
// 작성: 2026-05-16

export const ANIMAL_MAP = {
  hwalgi:      { name: '호랑이', emoji: '🐯', color: '#FFE5DA', textColor: '#c84d20', resKey: 'activity', oneLine: '활동량이 많고 도전적이며 적극적인 결' },
  josim:       { name: '토끼',   emoji: '🐰', color: '#E5F2D1', textColor: '#5d8225', resKey: 'caution',  oneLine: '조심성이 많고 수줍어 하며 안전을 중시하는 결' },
  manjok:      { name: '말',     emoji: '🐴', color: '#FFF6CC', textColor: '#b89400', resKey: 'positive', oneLine: '낙관적이고 유쾌하며 만족스러운 결' },
  heundeullim: { name: '돼지',   emoji: '🐷', color: '#FFE0E8', textColor: '#c44366', resKey: 'negative', oneLine: '예민하고 민감하며 감정에 충실한 결' },
  eoullim:     { name: '양',     emoji: '🐑', color: '#FFE0E8', textColor: '#c44366', resKey: 'social',   oneLine: '공감적이고 사교적이며 분위기를 잘 읽는 결' },
  kkeungi:     { name: '소',     emoji: '🐮', color: '#DBE9F5', textColor: '#2d5a8a', resKey: 'effortful', oneLine: '인내심이 강하고 끈기 있으며 부지런한 결' },
  // 균형형
  yong:        { name: '용',     emoji: '🐉', color: '#EBDAF5', textColor: '#6e4099', resKey: 'balanced', oneLine: '모든 결이 두루 균형 잡힌, 고른 결' },
};

// 케이스 분기 (룰 29)
export function determineCase(factorScores) {
  const sorted = Object.entries(factorScores)
    .map(([k, v]) => ({ key: k, score: v.score, level: v.level }))
    .sort((a, b) => b.score - a.score);

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  const allMid = sorted.every(s => s.level === 'mid');
  const hourUnknown = Object.values(factorScores).some(v => v.hourUnknown);

  // 출생시간 미상은 시주에서 생기는 세부 결을 확정하지 않는다.
  // 상위축이 압도적이지 않으면 단독 동물보다 균형형으로 보수 판정한다.
  if (hourUnknown && (top1.score < 80 || top1.score - top2.score <= 15)) {
    return { case: 'C', label: '균형형', top: sorted, confidence: 'date-only' };
  }

  // C. 균형형
  if (allMid || top1.level !== 'high') {
    return { case: 'C', label: '균형형', top: sorted, confidence: hourUnknown ? 'date-only' : 'full' };
  }

  // B. 상위 비등 (1등 - 3등 ≤ 6)
  if (top1.score - top3.score <= 6) {
    return { case: 'B', label: '상위 비등', top: sorted, confidence: hourUnknown ? 'date-only' : 'full' };
  }

  // A. 단독 두드러짐 (1등 - 2등 > 10)
  if (top1.score - top2.score > 10) {
    return { case: 'A', label: '단독 두드러짐', top: sorted, confidence: hourUnknown ? 'date-only' : 'full' };
  }

  // A 보더라인 (1등-2등 ≤ 10, 1등-3등 > 6)
  return { case: 'A-border', label: 'A 보더라인 (단독 약함)', top: sorted, confidence: hourUnknown ? 'date-only' : 'full' };
}

// 동물 매칭 (케이스 분기 포함)
export function matchAnimal(factorScores) {
  const caseInfo = determineCase(factorScores);

  let animal;
  if (caseInfo.case === 'C') {
    animal = ANIMAL_MAP.yong;
  } else {
    const top1Key = caseInfo.top[0].key;
    animal = ANIMAL_MAP[top1Key];
  }

  return {
    animal,
    case: caseInfo.case,
    caseLabel: caseInfo.label,
    confidence: caseInfo.confidence ?? 'full',
    top1: caseInfo.top[0],
    top2: caseInfo.top[1],
    top3: caseInfo.top[2],
    sortedScores: caseInfo.top,
  };
}

// 케이스별 안내 박스 ③번 톤 (룰 29)
export function caseToneText(animalResult, childName) {
  const t1 = animalResult.top1;
  const t2 = animalResult.top2;
  const t3 = animalResult.top3;
  const animal = animalResult.animal;
  const factorKo = {
    hwalgi: '활기', josim: '조심', manjok: '만족',
    heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기',
  };

  if (animalResult.case === 'C') {
    return `${childName}은 여섯 결이 모두 비슷한 높이로 자리해 어느 한 결도 두드러지지 않는 균형의 결입니다. **${animal.name}의 결**로 정해드렸어요. 어떤 환경에도 자연스럽게 어울리는 결을 가진 자리입니다.`;
  }

  if (animalResult.case === 'B') {
    return `${childName}은 **${factorKo[t1.key]}**이 가장 두드러져 **${animal.name}의 결**이 본 유형이 되었고, **${factorKo[t2.key]}과 ${factorKo[t3.key]}도 함께 깊어** 세 결이 모이는 자리가 만들어졌어요.`;
  }

  // A 또는 A 보더라인
  return `${childName}은 **${factorKo[t1.key]}**이 가장 두드러져 **${animal.name}의 결**이 본 유형이 되었어요. ${animal.oneLine}이 사주에서 가장 강하게 자리한 결입니다.`;
}
