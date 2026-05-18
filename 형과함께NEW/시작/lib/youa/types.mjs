// facts JSON 스키마 정의 (Phase 3)
//
// 결정론 산출 결과를 단일 JSON으로 통합.
// 클라이언트 컴포넌트와 LLM 프롬프트가 양쪽에서 이 JSON을 입력으로 받음.
// 스키마 잠금 후 변경은 전체 모듈 영향 — 신중히.
//
// 작성: 2026-05-16

/**
 * @typedef {'low' | 'mid' | 'high'} ScoreLevel
 *
 * @typedef {Object} ScoreResult
 * @property {string} factor - 코드 키 (예: 'hwalgi', 'ongi')
 * @property {string} factorKorean - 한글 이름
 * @property {number} score - 0~100
 * @property {ScoreLevel} level
 *
 * @typedef {Object} ChildInfo
 * @property {string} name - 자녀 이름
 * @property {'female' | 'male'} gender
 * @property {string} title - 호칭 ('양' 또는 '군')
 * @property {string} fullTitle - "김수민 양"
 * @property {string} birthDate - 2022-02-15
 * @property {string} age - "만 4세 0개월"
 * @property {string} saju8 - "壬子 庚申 乙亥 戊寅"
 * @property {string} ilgan - "을"
 * @property {string} ilju - "을해"
 * @property {string} ilganElement - "목"
 * @property {string} ilganBiyu - "작은 나무 (새순·풀)"
 * @property {'양' | '음'} yinyang
 *
 * @typedef {Object} ParentInfo
 * @property {string} name - 부모 이름
 * @property {'mother' | 'father'} role
 * @property {string} label - "어머님" 또는 "아버님"
 * @property {string} saju8
 * @property {string} ilgan
 * @property {string} ilju
 * @property {string} ilganElement
 * @property {string} ilganBiyu
 *
 * @typedef {Object} FactorCard - 부모 사주 인자 카드 (8-a, 8-b)
 * @property {string} key - 'inseong' | 'siksang' | 'gwanseong' | 'jaeseong' | 'bigeop' | 'special'
 * @property {string} label - 카드 헤더 (예: '인성', '특수: 양인')
 * @property {string} tongMyeong - 호명 (예: '받쳐주는 기운')
 * @property {number} strength - 0~100
 * @property {string} strengthLabel - '강함' | '평이함' | '옅음' | '균형' | '편중'
 * @property {string} primaryPosition - '월간·본기 통근' 등
 * @property {boolean} present - 자리 있음?
 * @property {string} icon - 이모지
 * @property {string} color - HEX
 *
 * @typedef {Object} AnimalResult
 * @property {string} type - 'tiger' | 'rabbit' | 'horse' | 'pig' | 'sheep' | 'cow' | 'dragon'
 * @property {string} name - '호랑이' | '토끼' | ...
 * @property {string} emoji
 * @property {string} color
 * @property {string} oneLine
 * @property {'A' | 'A-border' | 'B' | 'C'} case
 * @property {string} caseLabel
 * @property {string} caseTone - 안내 박스 ③번 톤 (룰 29)
 * @property {Array<{key: string, factorKorean: string, score: number, label: string}>} top3
 *
 * @typedef {Object} IlganRelation
 * @property {string} type - 'hap' | 'donggi' | 'parentGivesChild' | 'childGivesParent' | 'parentControlsChild' | 'childControlsParent'
 * @property {string} typeLabel
 * @property {string} sipseong - 십성 (예: '식신', '정관')
 * @property {string} sipseongTong - 통칭 (예: '식상', '관성')
 * @property {string} toneA - 차원 A 톤 (일간 직접 관계)
 * @property {string} [hapName] - 천간합 케이스만
 *
 * @typedef {Object} ParentSipseongInChildSaju
 * @property {{sipseong: string, tongMyeong: string, strength: number}} 어머니궁
 * @property {{sipseong: string, tongMyeong: string, strength: number}} 아버지궁
 *
 * @typedef {Object} MatrixCard
 * @property {string} axis - 축 코드 키
 * @property {string} axisKorean
 * @property {number} axisScore
 * @property {string} factor - 요인 코드 키
 * @property {string} factorKorean
 * @property {number} factorScore
 * @property {string} tone - 본기 톤 한 줄
 * @property {string} pattern - 'strong_synergy' | 'synergy' | ...
 * @property {string} header - 결합 결과 직접 표현 (룰 23)
 * @property {number} cellStrength
 * @property {boolean} isSynergy
 * @property {boolean} isConflict
 * @property {boolean} isAmbivalent
 *
 * @typedef {Object} Facts - 전체 facts JSON 스키마
 * @property {Object} meta
 * @property {number} meta.reportPageCount - 17 (양쪽) | 14 (한쪽)
 * @property {boolean} meta.hasMother
 * @property {boolean} meta.hasFather
 * @property {string} meta.testDate - 검사일 (YYYY-MM-DD)
 * @property {string} meta.version - facts 스키마 버전
 *
 * @property {ChildInfo} child
 * @property {ParentInfo} [mother]
 * @property {ParentInfo} [father]
 *
 * @property {Object<string, ScoreResult>} childFactors - hwalgi, josim, manjok, heundeullim, eoullim, kkeungi
 * @property {Object<string, ScoreResult>} [motherAxes] - ongi, jungsim, ilgwan, jayul, pyohyeon, baram
 * @property {Object<string, ScoreResult>} [fatherAxes]
 *
 * @property {AnimalResult} animal
 *
 * @property {Object} ilganRelations
 * @property {IlganRelation} [ilganRelations.mother]
 * @property {IlganRelation} [ilganRelations.father]
 * @property {ParentSipseongInChildSaju} ilganRelations.parentSipseongInChildSaju
 *
 * @property {Object} matrixCards
 * @property {MatrixCard[]} matrixCards.motherCards
 * @property {MatrixCard[]} matrixCards.fatherCards
 * @property {Array<{key: string, korean: string, score: number}>} matrixCards.motherStrongAxes
 * @property {Array<{key: string, korean: string, score: number}>} matrixCards.fatherStrongAxes
 *
 * @property {Object} parentFactorCards - 인자 카드 6셋 (8-a, 8-b 페이지용)
 * @property {FactorCard[]} [parentFactorCards.mother]
 * @property {FactorCard[]} [parentFactorCards.father]
 *
 * @property {Object} childOverview - p.3 자녀 6요인 한눈에 페이지용
 * @property {Object<string, {strength: number, label: string, positions: string[]}>} childOverview.factorStrengths - 자녀 사주 6셋 강도
 */

// 스키마 버전 — 변경 시 마이너 +0.1, 호환 깨지면 메이저 +1
export const FACTS_SCHEMA_VERSION = '1.0.0';

// 인자 카드 6셋 정적 매핑 (인성·식상·관성·재성·비겁·특수)
export const INJA_CARD_DEF = {
  인성: {
    key: 'inseong',
    label: '인성',
    tongMyeong: '받쳐주는 기운',
    icon: '♥',
    color: '#c4a578',
  },
  식상: {
    key: 'siksang',
    label: '식상',
    tongMyeong: '표현하는 기운',
    icon: '🍃',
    color: '#6ba8a8',
  },
  관성: {
    key: 'gwanseong',
    label: '관성',
    tongMyeong: '절제하는 기운',
    icon: '⚙',
    color: '#5b7ba8',
  },
  재성: {
    key: 'jaeseong',
    label: '재성',
    tongMyeong: '결과의 기운',
    icon: '💰',
    color: '#d4a838',
  },
  비겁: {
    key: 'bigeop',
    label: '비겁',
    tongMyeong: '같은 결의 기운',
    icon: '◆',
    color: '#a78bfa',
  },
  // 특수 슬롯 — 동적 (양인·천을귀인·도화·문창 등 사주별 두드러진 1개)
  // 동적이라 key/label/icon 사주별 결정
};

export const SPECIAL_FACTOR_DEF = {
  양인:    { key: 'special-yangin',    label: '양인 (羊刃)',       tongMyeong: '결단하는 기운',          icon: '⚡', color: '#8a5fa8' },
  천을귀인: { key: 'special-cheoneuli', label: '천을귀인 (天乙貴人)', tongMyeong: '사람을 끌어들이는 기운', icon: '★', color: '#d4a838' },
  도화살:  { key: 'special-dohwa',     label: '도화살 (桃花殺)',    tongMyeong: '사람 끄는 매력의 기운',   icon: '✿', color: '#FF8FA3' },
  문창귀인: { key: 'special-munchang',  label: '문창귀인 (文昌貴人)', tongMyeong: '학문의 기운',            icon: '✎', color: '#5b7ba8' },
  화개살:  { key: 'special-hwagae',    label: '화개살 (華蓋殺)',    tongMyeong: '깊이 사색하는 기운',       icon: '☸', color: '#8a6332' },
  역마살:  { key: 'special-yeokma',    label: '역마살 (驛馬殺)',    tongMyeong: '움직이는 기운',           icon: '🏇', color: '#c84d20' },
};

// 강도 구간 라벨
export function strengthLabel(strength) {
  if (strength >= 66) return '강함';
  if (strength >= 41) return '평이함';
  if (strength >= 10) return '옅음';
  return '없음';
}

// 조후 라벨
export function johuLabel(johu) {
  if (johu.balanced) return '균형';
  if (johu.direction === 'hot') return '양기·열기 우세';
  if (johu.direction === 'cold') return '한기·습기 우세';
  return '편중';
}

// 자녀 호칭
export function childTitle(gender) {
  return gender === 'female' ? '양' : '군';
}
