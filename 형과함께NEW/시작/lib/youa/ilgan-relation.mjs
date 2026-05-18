// 부모-자녀 일간 관계 5유형 (Phase 2)
//
// 룰 22 (6_rules.md): 천간합 > 다른 관계
// 명리 정정 (Phase 0-B 결과): 火生木 같은 자연 비유 X, 정통 십성 우선
//
// 5유형:
//   1. 천간합 (5쌍: 갑기·을경·병신·정임·무계)
//   2. 부모→자녀 생 (부모 일간이 자녀를 생) → 자녀 사주에 부모 = 인성
//   3. 자녀→부모 생 (자녀 일간이 부모를 생) → 자녀 입장 부모 = 식상
//   4. 동기 (같은 오행) → 자녀 입장 부모 = 비겁
//   5. 부모→자녀 극 (부모가 자녀를 극) → 자녀 사주에 부모 = 관성
//   6. 자녀→부모 극 (자녀가 부모를 극) → 자녀 입장 부모 = 재성
//
// 작성: 2026-05-16

// 천간 오행·음양
const STEM_ELEM = {
  '갑': '목', '을': '목', '병': '화', '정': '화',
  '무': '토', '기': '토', '경': '금', '신': '금',
  '임': '수', '계': '수',
};
const STEM_YINYANG = {
  '갑': '양', '을': '음', '병': '양', '정': '음',
  '무': '양', '기': '음', '경': '양', '신': '음',
  '임': '양', '계': '음',
};

// 오행 상생·상극
const GENERATES = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' };
const CONTROLS  = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' };

// 천간합 5쌍 + 화 오행
const CHEONGAN_HAP = [
  { pair: ['갑', '기'], hwa: '토', name: '갑기합화토' },
  { pair: ['을', '경'], hwa: '금', name: '을경합화금' },
  { pair: ['병', '신'], hwa: '수', name: '병신합화수' },
  { pair: ['정', '임'], hwa: '목', name: '정임합화목' },
  { pair: ['무', '계'], hwa: '화', name: '무계합화화' },
];

// 십성 매핑 (자녀 일간 기준 부모 일간이 무슨 십성인지)
function getSipseong(childIlgan, parentIlgan) {
  const ce = STEM_ELEM[childIlgan];
  const cy = STEM_YINYANG[childIlgan];
  const pe = STEM_ELEM[parentIlgan];
  const py = STEM_YINYANG[parentIlgan];
  const samePol = cy === py;

  if (ce === pe) return samePol ? '비견' : '겁재';
  if (GENERATES[ce] === pe) return samePol ? '식신' : '상관';
  if (CONTROLS[ce] === pe)  return samePol ? '편재' : '정재';
  if (CONTROLS[pe] === ce)  return samePol ? '편관' : '정관';
  if (GENERATES[pe] === ce) return samePol ? '편인' : '정인';
  return null;
}

// 통칭 매핑
const SIPSEONG_TO_TONG = {
  '비견': '비겁', '겁재': '비겁',
  '식신': '식상', '상관': '식상',
  '편재': '재성', '정재': '재성',
  '편관': '관성', '정관': '관성',
  '편인': '인성', '정인': '인성',
};

// 일간 비유 (룰 14: 큰 X / 작은 X)
const ILGAN_BIYU = {
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

// 메인 함수
export function calcIlganRelation(childIlgan, parentIlgan, parentLabel) {
  if (!childIlgan || !parentIlgan) return null;

  // 1. 천간합 확인 (우선)
  for (const hap of CHEONGAN_HAP) {
    if ((hap.pair[0] === childIlgan && hap.pair[1] === parentIlgan)
     || (hap.pair[1] === childIlgan && hap.pair[0] === parentIlgan)) {
      return {
        type: 'hap',
        typeLabel: '천간합',
        hapName: hap.name,
        hapHwa: hap.hwa,
        sipseong: getSipseong(childIlgan, parentIlgan),
        sipseongTong: SIPSEONG_TO_TONG[getSipseong(childIlgan, parentIlgan)],
        parentLabel,
        childIlgan,
        parentIlgan,
        childBiyu: ILGAN_BIYU[childIlgan],
        parentBiyu: ILGAN_BIYU[parentIlgan],
        toneA: `${parentLabel} ${parentIlgan}과 자녀 ${childIlgan}이 ${hap.name}을 이루는 관계입니다. 두 결이 합해 새로운 결(${hap.hwa})을 함께 만드는 흐름입니다.`,
      };
    }
  }

  // 2. 십성 관계
  const sipseong = getSipseong(childIlgan, parentIlgan);
  const sipseongTong = SIPSEONG_TO_TONG[sipseong];

  const ce = STEM_ELEM[childIlgan];
  const pe = STEM_ELEM[parentIlgan];

  // 동기
  if (ce === pe) {
    return {
      type: 'donggi',
      typeLabel: '동기 (비겁)',
      sipseong, sipseongTong,
      parentLabel, childIlgan, parentIlgan,
      childBiyu: ILGAN_BIYU[childIlgan],
      parentBiyu: ILGAN_BIYU[parentIlgan],
      toneA: `${parentLabel}과 자녀 모두 ${ce} 오행으로 비슷한 결을 가진 관계입니다. 자녀 입장에서 ${parentLabel}은 ${sipseong}(${sipseongTong})으로 자리합니다.`,
    };
  }

  // 부모 → 자녀 생 (부모가 자녀를 생, 자녀 입장 인성)
  if (GENERATES[pe] === ce) {
    return {
      type: 'parentGivesChild',
      typeLabel: '부모 → 자녀 생 (받쳐주는 결)',
      sipseong, sipseongTong,
      parentLabel, childIlgan, parentIlgan,
      childBiyu: ILGAN_BIYU[childIlgan],
      parentBiyu: ILGAN_BIYU[parentIlgan],
      toneA: `${parentLabel} ${parentIlgan}(${pe})이 자녀 ${childIlgan}(${ce})를 ${pe}생${ce}으로 생하는 관계입니다. 자녀 입장에서 ${parentLabel}은 ${sipseong}(${sipseongTong})으로, 받쳐주는 결로 자리합니다.`,
    };
  }

  // 자녀 → 부모 생 (자녀가 부모를 생, 자녀 입장 식상)
  if (GENERATES[ce] === pe) {
    return {
      type: 'childGivesParent',
      typeLabel: '자녀 → 부모 생 (자녀가 부모를 보태드림)',
      sipseong, sipseongTong,
      parentLabel, childIlgan, parentIlgan,
      childBiyu: ILGAN_BIYU[childIlgan],
      parentBiyu: ILGAN_BIYU[parentIlgan],
      toneA: `자녀 ${childIlgan}(${ce})이 ${parentLabel} ${parentIlgan}(${pe})를 ${ce}생${pe}으로 생하는 관계입니다. 자녀 입장에서 ${parentLabel}은 ${sipseong}(${sipseongTong})으로, 자녀가 ${parentLabel}의 결을 보태드리는 흐름입니다.`,
    };
  }

  // 부모 → 자녀 극 (부모가 자녀를 극, 자녀 입장 관성)
  if (CONTROLS[pe] === ce) {
    return {
      type: 'parentControlsChild',
      typeLabel: '부모 → 자녀 극 (기준을 주는 결)',
      sipseong, sipseongTong,
      parentLabel, childIlgan, parentIlgan,
      childBiyu: ILGAN_BIYU[childIlgan],
      parentBiyu: ILGAN_BIYU[parentIlgan],
      toneA: `${parentLabel} ${parentIlgan}(${pe})이 자녀 ${childIlgan}(${ce})를 ${pe}극${ce}으로 극하는 관계입니다. 자녀 입장에서 ${parentLabel}은 ${sipseong}(${sipseongTong})으로, 명확한 기준과 절제를 주는 결로 자리합니다.`,
    };
  }

  // 자녀 → 부모 극 (자녀가 부모를 극, 자녀 입장 재성)
  if (CONTROLS[ce] === pe) {
    return {
      type: 'childControlsParent',
      typeLabel: '자녀 → 부모 극 (자녀가 부모를 결과로 봄)',
      sipseong, sipseongTong,
      parentLabel, childIlgan, parentIlgan,
      childBiyu: ILGAN_BIYU[childIlgan],
      parentBiyu: ILGAN_BIYU[parentIlgan],
      toneA: `자녀 ${childIlgan}(${ce})이 ${parentLabel} ${parentIlgan}(${pe})를 ${ce}극${pe}으로 극하는 관계입니다. 자녀 입장에서 ${parentLabel}은 ${sipseong}(${sipseongTong})으로 자리합니다.`,
    };
  }

  return null;
}

// 자녀 사주에서 본 부모 십성 (차원 B, 룰 31)
// 자녀 사주의 정인·편인 = 어머니 자리 / 정관·편관 = 아버지 자리(여자)·자녀(남자)
export function getParentSipseongInChildSaju(childFactorStrength) {
  return {
    어머니궁: {
      sipseong: '인성', // 정인 + 편인
      tongMyeong: '받쳐주는 기운',
      strength: childFactorStrength.인성?.weightedStrength ?? 0,
    },
    아버지궁: {
      sipseong: '관성', // 정관 + 편관 (여자아이 기준)
      tongMyeong: '절제하는 기운',
      strength: childFactorStrength.관성?.weightedStrength ?? 0,
    },
  };
}

// 모든 부모-자녀 관계 통합
export function calcAllIlganRelations(childIlgan, motherIlgan, fatherIlgan) {
  return {
    mother: motherIlgan ? calcIlganRelation(childIlgan, motherIlgan, '어머님') : null,
    father: fatherIlgan ? calcIlganRelation(childIlgan, fatherIlgan, '아버님') : null,
  };
}
