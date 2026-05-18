import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIRS = [
  path.join(ROOT, 'cache'),
  path.resolve(ROOT, '..', '..', 'lib', 'youa-engine', 'youa', 'block-cache-data'),
];

const FACTORS = {
  hwalgi: '활기',
  josim: '조심',
  manjok: '만족',
  heundeullim: '흔들림',
  eoullim: '어울림',
  kkeungi: '끈기',
};

const LEVELS = ['매우낮음', '낮음', '중간', '높음', '매우높음'];

const CAUSES = {
  general: {
    label: '전체 흐름',
    make: '전체 사주 흐름이 이 결을 만들고',
    press: '전체 사주 흐름이 이 결을 조절합니다',
    daily: '상황에 따라 반응의 크기가 달라질 수 있습니다',
    tip: '점수만 보지 말고 아이가 어느 장면에서 편안해지는지 함께 봐주십시오',
  },
  gwanseong: {
    label: '관성',
    make: '규칙, 책임감, 기준을 세우는 관성의 기운이 이 결을 만들고',
    press: '규칙과 긴장이 먼저 올라오는 관성의 기운이 이 결을 조절합니다',
    daily: '정해진 기준이 분명할 때 안정되지만, 기준이 빠르게 들어오면 몸이 먼저 긴장할 수 있습니다',
    tip: '규칙은 짧게 알려 주고, 아이가 받아들일 시간을 따로 두는 편이 좋습니다',
  },
  inseong: {
    label: '인성',
    make: '받아들이고 보호받으려는 인성의 기운이 이 결을 만들고',
    press: '안쪽으로 머무르며 확인하려는 인성의 기운이 이 결을 조절합니다',
    daily: '낯선 자극보다 익숙한 사람과 공간 안에서 훨씬 부드럽게 반응합니다',
    tip: '먼저 안심시키고 다음 행동을 안내하면 아이의 반응이 자연스럽게 따라옵니다',
  },
  siksang: {
    label: '식상',
    make: '말, 움직임, 표현으로 풀어내는 식상의 기운이 이 결을 만들고',
    press: '표현이 한꺼번에 올라오는 식상의 기운이 이 결을 흔들 수 있습니다',
    daily: '말하고 움직이며 풀 때 에너지가 살아나지만, 자극이 많으면 산만해질 수 있습니다',
    tip: '표현을 막기보다 순서와 시간을 정해 주면 장점이 안정적으로 살아납니다',
  },
  jaeseong: {
    label: '재성',
    make: '현실 감각과 손에 잡히는 결과를 보는 재성의 기운이 이 결을 만들고',
    press: '결과 확인과 기대가 앞서는 재성의 기운이 이 결을 조절합니다',
    daily: '눈에 보이는 보상이나 완성감이 있을 때 반응이 살아나기 쉽습니다',
    tip: '큰 목표보다 바로 확인할 수 있는 작은 단계를 만들어 주면 좋습니다',
  },
  bigyeop: {
    label: '비겁',
    make: '자기 힘과 자기 페이스를 지키는 비겁의 기운이 이 결을 만들고',
    press: '자기 방식이 강해지는 비겁의 기운이 이 결을 조절합니다',
    daily: '스스로 해 보려는 마음이 살아날 때 집중이 좋아지지만, 간섭이 많으면 버티려 할 수 있습니다',
    tip: '선택지를 주고 직접 해 보는 시간을 보장하면 아이의 결이 안정됩니다',
  },
  yangin: {
    label: '양인',
    make: '강한 추진력과 버티는 힘을 가진 양인의 기운이 이 결을 만들고',
    press: '강하게 밀고 나가려는 양인의 기운이 이 결을 조절합니다',
    daily: '하고 싶은 방향이 분명할 때 힘이 살아나지만, 막히면 반응이 거칠어질 수 있습니다',
    tip: '힘을 꺾기보다 안전한 범위 안에서 쓸 수 있는 통로를 만들어 주십시오',
  },
  johu_imbalance: {
    label: '조후 불균형',
    make: '기운의 온도와 습도 차이가 큰 조후 흐름이 이 결을 만들고',
    press: '조후의 치우침이 몸과 마음의 반응을 조절합니다',
    daily: '컨디션, 날씨, 피로도에 따라 같은 상황에서도 반응 차이가 크게 보일 수 있습니다',
    tip: '무리하게 밀기보다 먹고 쉬고 움직이는 기본 리듬을 먼저 맞춰 주는 편이 좋습니다',
  },
  chilsal_sinyak: {
    label: '칠살/신약',
    make: '강한 압박과 예민한 대응이 함께 작용하는 칠살/신약 흐름이 이 결을 만들고',
    press: '압박을 먼저 느끼는 칠살/신약 흐름이 이 결을 조절합니다',
    daily: '갑작스러운 요구나 큰소리에 마음이 먼저 움츠러들 수 있습니다',
    tip: '지시보다 예고가 먼저이고, 예고 뒤에는 짧은 확인 시간이 필요합니다',
  },
  gwanin_sangsaeng: {
    label: '관인상생',
    make: '기준과 보호가 이어지는 관인상생의 흐름이 이 결을 만들고',
    press: '기준을 안정감으로 바꾸려는 관인상생 흐름이 이 결을 조절합니다',
    daily: '납득되는 설명과 신뢰하는 어른의 안내가 있을 때 반응이 좋아집니다',
    tip: '왜 해야 하는지 짧게 설명한 뒤, 아이가 해낼 수 있는 자리까지 같이 가 주십시오',
  },
  unseong_strong: {
    label: '12운성 강세',
    make: '12운성의 힘 있는 자리감이 이 결을 만들고',
    press: '몸의 반응이 빠르게 올라오는 12운성 강세가 이 결을 조절합니다',
    daily: '좋아하는 장면에서는 빠르게 살아나지만, 흥분도 함께 커질 수 있습니다',
    tip: '시작 전과 마무리 전에 짧은 리듬을 만들어 주면 과열이 줄어듭니다',
  },
  unseong_weak: {
    label: '12운성 약세',
    make: '12운성의 조심스러운 자리감이 이 결을 만들고',
    press: '에너지를 아껴 쓰려는 12운성 약세가 이 결을 조절합니다',
    daily: '처음부터 크게 반응하기보다 천천히 살피고 뒤늦게 마음을 여는 편입니다',
    tip: '빠른 참여보다 관찰 시간을 먼저 인정해 주면 아이가 덜 부담스러워합니다',
  },
  neutral_strength: {
    label: '중화',
    make: '한쪽으로 치우치지 않는 중화의 흐름이 이 결을 만들고',
    press: '상황을 보며 균형을 맞추려는 중화의 흐름이 이 결을 조절합니다',
    daily: '극단적으로 튀기보다 상황에 맞춰 반응을 조절하려는 모습이 보입니다',
    tip: '아이의 반응을 재촉하지 말고, 선택 기준을 분명히 보여 주면 좋습니다',
  },
};

const CAUSE_KEYS = Object.keys(CAUSES);
const ALIAS = {
  johu_imbalance: 'johu-imbalance',
  chilsal_sinyak: 'chilsal-sinyak',
  gwanin_sangsaeng: 'gwanin-sangsaeng',
  unseong_strong: 'unseong-strong',
  unseong_weak: 'unseong-weak',
  neutral_strength: 'neutral-strength',
};

function cacheKey(key) {
  return ALIAS[key] ?? key;
}

function levelTone(level, factor) {
  if (level === '매우낮음' || level === '낮음') {
    return `${factor}이 밖으로 크게 드러나기보다 안쪽에서 조절되는 편입니다`;
  }
  if (level === '매우높음' || level === '높음') {
    return `${factor}이 생활 장면에서 비교적 분명하게 관찰되는 편입니다`;
  }
  return `${factor}이 상황에 따라 드러나는 정도가 달라지는 중간 결입니다`;
}

function isHighLevel(level) {
  return level === '높음' || level === '매우높음';
}

function isLowLevel(level) {
  return level === '낮음' || level === '매우낮음';
}

function tipTitles({ factorKey, level, maker, suppressor }) {
  const causes = new Set([maker, suppressor]);
  const titles = {
    time: '하루 리듬을 예측 가능하게 잡기',
    communication: '짧게 말하고 반응을 기다리기',
    environment: '편안한 조건을 반복해 주기',
  };

  if (factorKey === 'josim') {
    titles.time = isHighLevel(level) ? '새 환경 적응 시간을 충분히 보장' : '낯선 장면을 가볍게 경험시키기';
    titles.communication = isHighLevel(level) ? '"천천히 봐도 돼" 안전 신호 자주 주기' : '멈춰야 할 선을 짧게 알려 주기';
    titles.environment = isHighLevel(level) ? '갑작스러운 어른 행동 피하기' : '탐색해도 되는 범위를 먼저 정하기';
  } else if (factorKey === 'hwalgi') {
    titles.time = isHighLevel(level) ? '활동 뒤 쉬는 시간을 먼저 잡기' : '몸이 풀리는 시작 시간을 주기';
    titles.communication = isHighLevel(level) ? '짧고 분명한 말로 방향 잡기' : '작은 반응도 먼저 알아봐 주기';
    titles.environment = isHighLevel(level) ? '움직여도 되는 공간을 따로 마련' : '부담 없는 움직임부터 열어 주기';
  } else if (factorKey === 'heundeullim') {
    titles.time = isHighLevel(level) ? '감정이 가라앉는 순서 만들기' : '익숙한 안정 리듬을 유지하기';
    titles.communication = isHighLevel(level) ? '감정을 먼저 받아 주고 설명하기' : '괜찮다는 확인을 짧게 반복하기';
    titles.environment = isHighLevel(level) ? '자극이 몰리는 시간을 줄이기' : '무리 없는 변화부터 천천히 주기';
  } else if (factorKey === 'eoullim') {
    titles.time = isHighLevel(level) ? '사람 만난 뒤 혼자 쉬는 시간 두기' : '관계에 들어갈 준비 시간을 주기';
    titles.communication = isHighLevel(level) ? '마음을 대신 정리해 말해 주기' : '대답을 재촉하지 않고 기다리기';
    titles.environment = isHighLevel(level) ? '관계 자극의 양을 조절하기' : '익숙한 사람부터 연결해 주기';
  } else if (factorKey === 'kkeungi') {
    titles.time = isHighLevel(level) ? '끝까지 해낼 시간을 보호하기' : '짧은 완성 경험부터 쌓기';
    titles.communication = isHighLevel(level) ? '중간에 끊기 전 예고하기' : '한 번에 하나씩만 제안하기';
    titles.environment = isHighLevel(level) ? '집중 흐름을 방해하지 않기' : '선택지를 줄여 시작을 쉽게 만들기';
  } else if (factorKey === 'manjok') {
    titles.time = isHighLevel(level) ? '좋아하는 마음을 충분히 누리게 하기' : '즐거운 신호를 작게 자주 만들기';
    titles.communication = isHighLevel(level) ? '좋았던 장면을 말로 되짚어 주기' : '마음에 드는지 천천히 물어보기';
    titles.environment = isHighLevel(level) ? '만족이 오래 가는 루틴 만들기' : '편안함을 느낄 단서를 늘리기';
  }

  if (causes.has('johu_imbalance') || causes.has('johu-imbalance')) {
    titles.environment = '컨디션이 흔들리는 조건 줄이기';
  }
  if (causes.has('chilsal_sinyak') || causes.has('chilsal-sinyak')) {
    titles.time = '갑작스러운 전환을 미리 줄이기';
    titles.communication = '지시보다 예고를 먼저 주기';
  }
  if (causes.has('unseong_strong') || causes.has('unseong-strong')) {
    titles.time = '올라온 에너지를 천천히 마무리';
  }
  if (causes.has('unseong_weak') || causes.has('unseong-weak')) {
    titles.time = '준비 시간을 넉넉히 두기';
  }

  return titles;
}

function causeCareLine(cause, factor) {
  if (cause === 'johu_imbalance') return '컨디션과 피로도에 따라 반응 차이가 커질 수 있으니, 생활 리듬과 자극의 양을 먼저 살펴 주십시오';
  if (cause === 'chilsal_sinyak') return '강한 요구보다 짧은 예고와 확인이 먼저 들어가야 아이가 덜 움츠러듭니다';
  if (cause === 'unseong_strong') return '에너지가 빠르게 올라오는 날에는 마무리 리듬을 먼저 정해 주는 편이 좋습니다';
  if (cause === 'unseong_weak') return '처음부터 참여시키기보다 지켜보고 들어올 시간을 충분히 주십시오';
  return `${CAUSES[cause]?.label ?? '이 흐름'}이 ${factor}에 작용하는 장면을 살피고, 아이가 편안해지는 조건을 반복해서 만들어 주십시오`;
}

function makeBlock({ factorKey, level, maker, suppressor }) {
  const factor = FACTORS[factorKey];
  const makerCause = CAUSES[maker];
  const suppressorCause = CAUSES[suppressor];
  const titles = tipTitles({ factorKey, level, maker, suppressor });
  return {
    key: `factorCause|slot1_4_5_6|${factorKey}|${level}|maker=${cacheKey(maker)}|suppressor=${cacheKey(suppressor)}`,
    slot: '1_4_5_6',
    factor,
    factorKey,
    level,
    makerCause: cacheKey(maker),
    suppressorCause: cacheKey(suppressor),
    whyIntro: `{childName}의 {factor}은 사주에서 ${makerCause.label}의 흐름과 ${suppressorCause.label}의 흐름이 함께 결합되어 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다.`,
    whyMechanism: [
      `${makerCause.make} ${suppressorCause.press}. 그래서 {childName}의 {factor}은 단순히 높고 낮은 점수 하나로만 보기보다, 만드는 힘과 조절하는 힘이 어디에서 오는지를 함께 봐야 합니다.`,
      `${makerCause.label} 쪽은 {factor}을 밖으로 드러내는 재료가 되고, ${suppressorCause.label} 쪽은 그 속도와 강도를 조절하는 역할을 합니다. ${levelTone(level, '{factor}')} 이 흐름은 아이가 일부러 그렇게 행동한다기보다 사주 안의 결이 상황을 만났을 때 나타나는 방식에 가깝습니다.`,
      `따라서 {childName}에게 필요한 것은 {factor}을 억지로 키우거나 줄이는 것이 아니라, ${makerCause.label}의 장점은 살리고 ${suppressorCause.label}의 부담은 낮춰 주는 환경입니다. 이렇게 봐야 아이의 결을 더 정확하게 이해할 수 있습니다.`,
    ],
    dailyBody: [
      `{childName}은 {factor}과 관련된 장면에서 ${makerCause.daily}. 동시에 ${suppressorCause.daily}. 이 두 흐름이 함께 있기 때문에 같은 아이라도 장소, 사람, 피로도에 따라 반응이 달라질 수 있습니다.`,
      `일상에서는 {factor} 점수 자체보다 반응이 올라오는 조건을 살피는 것이 중요합니다. ${makerCause.label}의 흐름이 편안하게 살아나는 장면을 늘리고, ${suppressorCause.label}의 부담이 커지는 장면은 조금 덜어 주면 {childName}의 결이 훨씬 자연스럽게 보입니다.`,
    ],
    parentingTipTime: {
      title: titles.time,
      body: `${makerCause.tip}. 시간표는 촘촘하게 채우기보다 시작과 마무리만 일정하게 잡아 주는 편이 좋습니다.`,
    },
    parentingTipCommunication: {
      title: titles.communication,
      body: `${suppressorCause.tip}. 설명이 길어지면 핵심이 흐려질 수 있으니, 짧게 말하고 아이 반응을 확인하는 방식이 잘 맞습니다.`,
    },
    parentingTipEnvironment: {
      title: titles.environment,
      body: `${causeCareLine(maker, '{factor}')}. 익숙한 순서, 예측 가능한 공간, 부담을 낮춘 선택지가 {childName}의 {factor}을 안정시킵니다.`,
    },
  };
}

const blocks = [];

function causeFlowName(causeKey) {
  if (causeKey === 'general') return '전체 사주 흐름';
  return `${CAUSES[causeKey]?.label ?? '사주 흐름'}의 흐름`;
}

function causeBurdenName(causeKey) {
  if (causeKey === 'general') return '전체 흐름';
  return CAUSES[causeKey]?.label ?? '사주 흐름';
}

function hasKoreanFinalConsonant(text) {
  const match = String(text).match(/[가-힣](?=[^가-힣]*$)/);
  if (!match) return false;
  const code = match[0].charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

function subjectLabel(label) {
  return `${label}${hasKoreanFinalConsonant(label) ? '이' : '가'}`;
}

function causeCareText(causeKey, factor) {
  if (causeKey === 'gwanseong') return `규칙과 기준이 들어가는 장면에서는 말의 속도를 낮추고, ${factor}이 안정될 시간을 함께 두십시오`;
  if (causeKey === 'inseong') return `익숙한 사람과 안정된 공간을 먼저 마련해 주면 ${factor}의 결이 부드럽게 열립니다`;
  if (causeKey === 'siksang') return `표현할 통로를 막기보다 말, 움직임, 놀이로 풀 수 있는 자리를 따로 열어 주십시오`;
  if (causeKey === 'jaeseong') return `결과를 빨리 확인시키기보다 작은 완성감을 자주 경험하게 해 주십시오`;
  if (causeKey === 'bigyeop') return `아이의 선택을 인정하되 선택지가 너무 넓어지지 않도록 범위를 먼저 정해 주십시오`;
  if (causeKey === 'yangin') return `강한 힘을 꺾기보다 안전한 범위 안에서 쓸 수 있는 통로를 만들어 주십시오`;
  if (causeKey === 'gwanin_sangsaeng') return `이유를 짧게 설명하고 해낼 수 있는 자리까지 같이 가 주면 아이가 덜 흔들립니다`;
  if (causeKey === 'johu_imbalance') return `컨디션과 피로도에 따라 반응 차이가 커질 수 있으니 생활 리듬과 자극의 양을 먼저 살펴 주십시오`;
  if (causeKey === 'chilsal_sinyak') return `강한 요구보다 짧은 예고와 확인이 먼저 들어가야 아이가 덜 위축됩니다`;
  if (causeKey === 'unseong_strong') return `에너지가 빠르게 올라오는 날에는 마무리 리듬을 먼저 정해 주는 편이 좋습니다`;
  if (causeKey === 'unseong_weak') return `처음부터 참여시키기보다 지켜보고 들어올 시간을 충분히 주십시오`;
  return `익숙한 순서와 예측 가능한 공간을 반복해 주십시오`;
}

function refineFactorBlock(block, { maker, suppressor }) {
  const makerFlow = causeFlowName(maker);
  const suppressorFlow = causeFlowName(suppressor);
  const makerLabel = CAUSES[maker]?.label ?? '사주 흐름';
  const suppressorLabel = CAUSES[suppressor]?.label ?? '사주 흐름';

  if (maker === suppressor) {
    block.whyIntro = `{childName}의 {factor}은 사주에서 ${makerFlow}이 반복해서 강조되며 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다.`;
  } else if (maker === 'general') {
    block.whyIntro = `{childName}의 {factor}은 사주에서 전체 사주 흐름 위에 ${suppressorFlow}이 함께 작용해 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다.`;
  } else if (suppressor === 'general') {
    block.whyIntro = `{childName}의 {factor}은 사주에서 ${makerFlow}이 중심이 되고, 전체 사주 흐름이 함께 조절하며 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다.`;
  } else {
    block.whyIntro = `{childName}의 {factor}은 사주에서 ${makerFlow}과 ${suppressorFlow}이 함께 작용해 나온 결과입니다. 어떤 인자들이 어떻게 작용했는지 살펴봅니다.`;
  }

  if (maker === suppressor) {
    block.dailyBody = [
      `{childName}은 {factor}과 관련된 장면에서 ${CAUSES[maker].daily}. 같은 흐름이 반복되기 때문에 반응이 비교적 선명하게 보일 수 있지만, 장소와 피로도에 따라 강도는 달라질 수 있습니다.`,
      `일상에서는 {factor}을 좋고 나쁨으로만 보지 말고, ${makerLabel}이 편안하게 살아나는 조건을 살피는 것이 중요합니다. 그 조건이 맞으면 {childName}의 결이 훨씬 자연스럽게 드러납니다.`,
    ];
  } else if (maker === 'general' || suppressor === 'general') {
    const focused = maker === 'general' ? suppressor : maker;
    const focusedLabel = CAUSES[focused]?.label ?? '사주 흐름';
    block.dailyBody = [
      `{childName}은 {factor}과 관련된 장면에서 ${CAUSES[focused].daily}. 여기에 전체 사주 흐름이 더해지면서 같은 아이라도 장소, 사람, 피로도에 따라 반응의 강도가 달라질 수 있습니다.`,
      `일상에서는 {factor}이 자연스럽게 살아나는 조건을 찾는 것이 중요합니다. ${focusedLabel}의 부담이 커지는 장면은 조금 덜어 주고, 아이가 편안하게 반응하는 순서를 반복해 주면 좋습니다.`,
    ];
  } else {
    block.dailyBody = [
      `{childName}은 {factor}과 관련된 장면에서 ${CAUSES[maker].daily}. 동시에 ${CAUSES[suppressor].daily}. 이 두 흐름이 함께 있기 때문에 같은 아이라도 장소, 사람, 피로도에 따라 반응이 달라질 수 있습니다.`,
      `일상에서는 {factor}의 크기보다 반응이 살아나는 조건을 살피는 것이 중요합니다. ${subjectLabel(makerLabel)} 편안하게 살아나는 장면은 늘리고, ${suppressorLabel}의 부담이 커지는 장면은 조금 덜어 주면 {childName}의 결이 훨씬 자연스럽게 보입니다.`,
    ];
  }

  block.parentingTipEnvironment.body = `${causeCareText(maker, '{factor}')}. 익숙한 순서, 예측 가능한 공간, 부담을 낮춘 선택지가 {childName}의 {factor}을 안정시킵니다.`;
}

for (const factorKey of Object.keys(FACTORS)) {
  for (const level of LEVELS) {
    for (const maker of CAUSE_KEYS) {
      for (const suppressor of CAUSE_KEYS) {
        const block = makeBlock({ factorKey, level, maker, suppressor });
        refineFactorBlock(block, { maker, suppressor });
        blocks.push(block);
      }
    }
  }
}

const payload = {
  schemaVersion: 'youa-numbered-combo-cache-v1',
  blockSet: 'factorCause',
  generatedAt: new Date().toISOString(),
  count: blocks.length,
  blocks,
};

for (const outDir of OUT_DIRS) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'factor-cause-blocks.json'), JSON.stringify(payload, null, 2), 'utf8');

  const indexPath = path.join(outDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const files = (index.files ?? []).filter(file => file.name !== 'factor-cause-blocks.json');
    files.push({ name: 'factor-cause-blocks.json', count: blocks.length });
    index.files = files;
    index.totalBlocks = files.reduce((sum, file) => sum + Number(file.count ?? 0), 0);
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
}

console.log(`factor-cause-blocks.json generated: ${blocks.length} blocks`);
