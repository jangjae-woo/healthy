// facts JSON 빌더 (Phase 3)
//
// 입력: 자녀 saju fixture, 부모 saju fixture (있을 수도/없을 수도)
// 출력: Phase 4(컴포넌트)·Phase 5(프롬프트)가 사용할 단일 facts JSON
//
// 작성: 2026-05-16

import { calcAll6Factors } from './factors.mjs';
import { calcAll6Axes } from './parent-axes.mjs';
import { matchAllCards } from './matrix.mjs';
import { matchAnimal, caseToneText, ANIMAL_MAP } from './animal.mjs';
import { calcAllIlganRelations, getParentSipseongInChildSaju } from './ilgan-relation.mjs';
import {
  FACTS_SCHEMA_VERSION, INJA_CARD_DEF, SPECIAL_FACTOR_DEF,
  strengthLabel, johuLabel, childTitle,
} from './types.mjs';

const FACTOR_NAMES = {
  hwalgi: '활기', josim: '조심', manjok: '만족',
  heundeullim: '흔들림', eoullim: '어울림', kkeungi: '끈기',
};

const ANIMAL_TYPES = {
  hwalgi: 'tiger', josim: 'rabbit', manjok: 'horse',
  heundeullim: 'pig', eoullim: 'sheep', kkeungi: 'cow',
  yong: 'dragon',
};

// 부모 사주의 동적 "특수 슬롯" 자동 선택
// 우선순위: 양인 > 천을귀인 > 조후 편중 > 도화 > 문창 > 화개 > 역마
// 룰 명확화: 명리 강도 가장 큰 신살 1개
function pickSpecialSlot(parentSaju) {
  const candidates = [];

  if (parentSaju.sinsal.양인?.present) {
    candidates.push({ type: '양인', strength: parentSaju.sinsal.양인.score50, priority: 7 });
  }
  if (parentSaju.sinsal.천을귀인?.present) {
    candidates.push({ type: '천을귀인', strength: parentSaju.sinsal.천을귀인.score50, priority: 6 });
  }
  if (parentSaju.sinsal.도화살?.present) {
    candidates.push({ type: '도화살', strength: parentSaju.sinsal.도화살.score50, priority: 5 });
  }
  if (parentSaju.sinsal.문창귀인?.present) {
    candidates.push({ type: '문창귀인', strength: parentSaju.sinsal.문창귀인.score50, priority: 4 });
  }
  if (parentSaju.sinsal.화개살?.present) {
    candidates.push({ type: '화개살', strength: parentSaju.sinsal.화개살.score50, priority: 3 });
  }
  if (parentSaju.sinsal.역마살?.present) {
    candidates.push({ type: '역마살', strength: parentSaju.sinsal.역마살.score50, priority: 2 });
  }

  // 조후 편중도 강하면 후보
  if (!parentSaju.factorStrength.조후.balanced && parentSaju.factorStrength.조후.차이 >= 4) {
    candidates.push({
      type: '조후편중',
      strength: 100 - parentSaju.factorStrength.조후.weightedStrength,
      priority: 1,
      direction: parentSaju.factorStrength.조후.direction,
    });
  }

  if (candidates.length === 0) {
    return null;  // 특수 슬롯 없음
  }

  // priority + strength 종합
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.strength - a.strength;
  });

  return candidates[0];
}

// 부모 인자 카드 6셋 빌더
function buildParentFactorCards(parentSaju) {
  if (!parentSaju) return [];

  const cards = [];
  const fs = parentSaju.factorStrength;

  // 5셋 고정 (인성·식상·관성·재성·비겁)
  for (const key of ['인성', '식상', '관성', '재성', '비겁']) {
    const f = fs[key];
    const def = INJA_CARD_DEF[key];
    const strength = f.weightedStrength;
    cards.push({
      key: def.key,
      label: def.label,
      tongMyeong: def.tongMyeong,
      icon: def.icon,
      color: def.color,
      strength,
      strengthLabel: strengthLabel(strength),
      primaryPosition: f.positions?.[0]?.place ?? '자리하지 않음',
      present: strength >= 10,
      positions: (f.positions ?? []).map(p => p.place),
    });
  }

  // 6번 슬롯 — 동적 특수 (또는 조후)
  const special = pickSpecialSlot(parentSaju);
  if (special && special.type !== '조후편중') {
    const def = SPECIAL_FACTOR_DEF[special.type];
    cards.push({
      key: def.key,
      label: def.label,
      tongMyeong: def.tongMyeong,
      icon: def.icon,
      color: def.color,
      strength: special.strength,
      strengthLabel: strengthLabel(special.strength),
      primaryPosition: '동적 슬롯',
      present: true,
      positions: [],
    });
  } else {
    // 조후 카드 (fallback 또는 조후 편중 케이스)
    const johu = fs.조후;
    cards.push({
      key: 'special-johu',
      label: '조후 (調候)',
      tongMyeong: '따뜻함과 차가움의 균형',
      icon: '🌗',
      color: '#9AB5A8',
      strength: johu.weightedStrength,
      strengthLabel: johuLabel(johu),
      primaryPosition: johu.balanced ? '균형' : (johu.direction === 'hot' ? '양기 편중' : '한기 편중'),
      present: true,
      positions: [],
    });
  }

  return cards;
}

// 자녀 인포 빌더
function buildChildInfo(childSaju) {
  const t = childTitle(childSaju.child.gender);
  return {
    name: childSaju.child.name,
    gender: childSaju.child.gender,
    title: t,
    fullTitle: `${childSaju.child.name} ${t}`,
    birthDate: childSaju.child.birthDate,
    age: childSaju.child.age,
    saju8: Object.values(childSaju.pillars).map(p => `${p.stem}${p.branch}`).join(' '),
    pillars: childSaju.pillars,
    ilgan: childSaju.ilgan,
    ilju: childSaju.ilju,
    ilganElement: childSaju.ilganElement,
    ilganBiyu: getIlganBiyu(childSaju.ilgan),
    yinyang: childSaju.yinyang,
  };
}

function buildParentInfo(parentSaju) {
  if (!parentSaju) return undefined;
  return {
    name: parentSaju.parent.name,
    role: parentSaju.parent.role,
    label: parentSaju.parent.role === 'mother' ? '어머님' : '아버님',
    saju8: Object.values(parentSaju.pillars).map(p => `${p.stem}${p.branch}`).join(' '),
    pillars: parentSaju.pillars,
    ilgan: parentSaju.ilgan,
    ilju: parentSaju.ilju,
    ilganElement: parentSaju.ilganElement,
    ilganBiyu: getIlganBiyu(parentSaju.ilgan),
    yinyang: parentSaju.yinyang,
  };
}

// 일간 비유
function getIlganBiyu(ilgan) {
  const m = {
    '갑': '큰 나무 (단단한 줄기·뿌리)',
    '을': '작은 나무 (새순·풀)',
    '병': '큰 불 (한낮의 햇볕)',
    '정': '작은 불 (촛불·등불)',
    '무': '큰 흙 (산·대지)',
    '기': '작은 흙 (들판·정원)',
    '경': '큰 쇠 (도끼·기둥)',
    '신': '작은 쇠 (칼·바늘)',
    '임': '큰 물 (강·바다)',
    '계': '작은 물 (이슬·샘)',
  };
  return m[ilgan] ?? '';
}

// 자녀 6요인 한눈에 페이지용 (p.3)
function buildChildOverview(childSaju) {
  const factorStrengths = {};
  for (const key of ['인성', '식상', '관성', '재성', '비겁', '조후']) {
    const f = childSaju.factorStrength[key];
    factorStrengths[key] = {
      strength: f.weightedStrength,
      label: key === '조후' ? johuLabel(f) : strengthLabel(f.weightedStrength),
      positions: (f.positions ?? []).map(p => p.place),
      isBongi: f.isBongi,
    };
  }
  return { factorStrengths };
}

// ─── 메인 빌더 ───
export function buildFacts({ childSaju, motherSaju, fatherSaju, testDate = new Date().toISOString().slice(0, 10) }) {
  const hasMother = !!motherSaju;
  const hasFather = !!fatherSaju;

  // 결정론 산출
  const childFactors = calcAll6Factors(childSaju);
  const motherAxes = hasMother ? calcAll6Axes(motherSaju) : null;
  const fatherAxes = hasFather ? calcAll6Axes(fatherSaju) : null;

  const childInfo = buildChildInfo(childSaju);
  const animalRaw = matchAnimal(childFactors);

  // 동물 결과 정규화
  const animal = {
    type: ANIMAL_TYPES[animalRaw.case === 'C' ? 'yong' : animalRaw.top1.key],
    name: animalRaw.animal.name,
    emoji: animalRaw.animal.emoji,
    color: animalRaw.animal.color,
    textColor: animalRaw.animal.textColor,
    oneLine: animalRaw.animal.oneLine,
    case: animalRaw.case,
    caseLabel: animalRaw.caseLabel,
    confidence: animalRaw.confidence ?? 'full',
    caseTone: caseToneText(animalRaw, childInfo.fullTitle),
    top3: [animalRaw.top1, animalRaw.top2, animalRaw.top3].map((t, i) => ({
      key: t.key,
      factorKorean: FACTOR_NAMES[t.key],
      score: t.score,
      label: i === 0 ? '가장 두드러짐' : '함께 깊음',
    })),
  };

  // 일간 관계
  const ilganRelationsRaw = calcAllIlganRelations(
    childSaju.ilgan,
    motherSaju?.ilgan,
    fatherSaju?.ilgan,
  );

  // 매트릭스 카드
  const matrixCards = matchAllCards(motherAxes, fatherAxes, childFactors, childInfo.fullTitle, hasMother, hasFather);

  // 부모 인자 카드
  const parentFactorCards = {};
  if (hasMother) parentFactorCards.mother = buildParentFactorCards(motherSaju);
  if (hasFather) parentFactorCards.father = buildParentFactorCards(fatherSaju);

  // 페이지 수
  const reportPageCount = (hasMother && hasFather) ? 17 : 14;

  return {
    meta: {
      reportPageCount,
      hasMother,
      hasFather,
      testDate,
      version: FACTS_SCHEMA_VERSION,
    },

    child: childInfo,
    mother: buildParentInfo(motherSaju),
    father: buildParentInfo(fatherSaju),

    childFactors,
    motherAxes,
    fatherAxes,

    animal,

    ilganRelations: {
      mother: ilganRelationsRaw.mother,
      father: ilganRelationsRaw.father,
      parentSipseongInChildSaju: getParentSipseongInChildSaju(childSaju.factorStrength),
    },

    matrixCards,

    parentFactorCards,

    childOverview: buildChildOverview(childSaju),
  };
}
