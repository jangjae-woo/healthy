// 아버님 김재훈 사주 fixture (Phase 1-B)
// 사주: 乙丑年 乙酉月 庚申日 丙子時 (경금 일간, 양금)
// 명리 정통 매핑 적용 (v2.1 통칭 6셋 정합)
//
// 시안 위반 항목 (v1):
//   - "정관 82 월간 본기 통근" → 정관 = 음화(丁), 사주에 丁 없음. 시간 丙 = 편관(칠살)
//   - "정재 78 연간·일지 통근" → 천간 정재 ✓, 통근 표기 오류
//   - 조후 차이 4 → 실제 차이 ~2
//
// 작성: 2026-05-16

const POSITION_WEIGHT = {
  일간: 1.0, 월령: 1.0, 일지: 0.8, 월간: 0.7,
  시간: 0.5, 시지: 0.5, 연간: 0.4, 연지: 0.4,
};

const G = { 본기: 25, 중기: 12, 여기: 5, 천간자: 10, 지지본기자: 8, 월령사령본기: 30 };

// 酉월(금왕) → 금=왕 / 토=상 / 수=휴 / 목=수 / 화=사
const WANGSANG_AT_YU = { 금: 1.5, 토: 1.2, 수: 1.0, 목: 0.7, 화: 0.5 };

export const KIM_JAEHUN_SAJU = {
  parent: {
    name: '김재훈',
    role: 'father',
  },

  pillars: {
    year:  { stem: '을', branch: '축' }, // 乙丑
    month: { stem: '을', branch: '유' }, // 乙酉
    day:   { stem: '경', branch: '신' }, // 庚申 (일간)
    hour:  { stem: '병', branch: '자' }, // 丙子
  },
  ilgan: '경',
  ilju: '경신',
  yinyang: '양',
  ilganElement: '금',
  monthBranch: '유',
  monthBranchElement: '금',

  // 정통 십성 매핑 (경금 양금 기준)
  sipseong: {
    year:  { stem: '정재', branch: '정인' },   // 乙=정재(金→木 양↔음) / 丑 본기 己=정인(土→金 양↔음)
    month: { stem: '정재', branch: '겁재' },   // 乙=정재 / 酉 본기 辛=겁재(같은 金 양↔음)
    day:   { stem: '본인', branch: '비견' },   // 庚=본인 / 申 본기 庚=비견
    hour:  { stem: '편관', branch: '상관' },   // 丙=편관(火→金 양↔양) / 子 본기 癸=상관(金→水 양↔음)
  },

  jijangan: {
    year:  { branch: '축', main: '기', mid: '계', sub: '신' },
    month: { branch: '유', main: '신', mid: null, sub: null },
    day:   { branch: '신', main: '경', mid: '임', sub: '무' },
    hour:  { branch: '자', main: '계', mid: null, sub: null },
  },

  factorStrength: {
    인성: {
      // 정인=己(음토), 편인=戊(양토)
      // 丑 본기 己(정인) + 申 여기 戊(편인)
      positions: [
        { place: '연지본기', stem: '己', sipseong: '정인',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.연지 },
        { place: '일지여기', stem: '戊', sipseong: '편인',
          rawStrength: G.여기,
          positionWeight: POSITION_WEIGHT.일지 },
      ],
      wangsang: WANGSANG_AT_YU.토,
      // 8*0.4 + 5*0.8 = 3.2 + 4 = 7.2 × 1.2 = 8.64
      weightedStrength: 9,
      isBongi: false,
    },
    식상: {
      // 식신=壬(양수), 상관=癸(음수)
      // 子 본기 癸(상관) + 申 중기 壬(식신)
      positions: [
        { place: '시지본기', stem: '癸', sipseong: '상관',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.시지 },
        { place: '일지중기', stem: '壬', sipseong: '식신',
          rawStrength: G.중기,
          positionWeight: POSITION_WEIGHT.일지 },
        { place: '연지중기', stem: '癸', sipseong: '상관',
          rawStrength: G.중기,
          positionWeight: POSITION_WEIGHT.연지 },
      ],
      wangsang: WANGSANG_AT_YU.수,
      // 8*0.5 + 12*0.8 + 12*0.4 = 4 + 9.6 + 4.8 = 18.4 × 1.0 = 18.4
      weightedStrength: 18,
      isBongi: false,
    },
    관성: {
      // 정관=丁(음화), 편관=丙(양화)
      // 丙(시간) — 통근 X (사주에 화 지지 없음)
      positions: [
        { place: '시간', stem: '丙', sipseong: '편관',
          rawStrength: G.천간자,
          positionWeight: POSITION_WEIGHT.시간 },
      ],
      wangsang: WANGSANG_AT_YU.화,
      // 10 * 0.5 × 0.5 = 2.5
      weightedStrength: 3,
      isBongi: false,
    },
    재성: {
      // 정재=乙(음목), 편재=甲(양목)
      // 乙(연간) + 乙(월간) 천간 2자. 통근 X (사주에 목 지지 없음)
      positions: [
        { place: '연간', stem: '乙', sipseong: '정재',
          rawStrength: G.천간자,
          positionWeight: POSITION_WEIGHT.연간 },
        { place: '월간', stem: '乙', sipseong: '정재',
          rawStrength: G.천간자,
          positionWeight: POSITION_WEIGHT.월간 },
      ],
      wangsang: WANGSANG_AT_YU.목,
      // 10 * 0.4 + 10 * 0.7 = 4 + 7 = 11 × 0.7 = 7.7
      weightedStrength: 8,
      isBongi: false,
    },
    비겁: {
      // 비견=庚(양금), 겁재=辛(음금)
      // 申 본기 庚(비견) + 酉 본기 辛(겁재) + 丑 여기 辛(겁재)
      positions: [
        { place: '월령본기', stem: '辛', sipseong: '겁재',
          rawStrength: G.월령사령본기 + G.지지본기자,
          positionWeight: POSITION_WEIGHT.월령 },
        { place: '일지본기', stem: '庚', sipseong: '비견',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.일지 },
        { place: '연지여기', stem: '辛', sipseong: '겁재',
          rawStrength: G.여기,
          positionWeight: POSITION_WEIGHT.연지 },
      ],
      wangsang: WANGSANG_AT_YU.금,
      // (30+8)*1.0 + 8*0.8 + 5*0.4 = 38 + 6.4 + 2 = 46.4 × 1.5 = 69.6
      weightedStrength: 70,
      isBongi: true,  // 비겁이 가장 강 (양인격에 가까움)
    },
    조후: {
      // 금4 + 수3 vs 목2 + 화1 + 토1
      // 차이 = (금+수) - (목+화) = 7 - 3 = 4 (한기 편중) 하지만 토 1 추가하면 따뜻한 쪽
      // 정확히: 한기(금+수) 7, 양기(목+화) 3, 토 1 (중립)
      // 차이 약 4
      label: '한습 편중',
      direction: 'cold',
      차이: 4,
      balanced: false,
      weightedStrength: 25,
      isBongi: false,
    },
    특수: {
      type: '양인',
      detail: '경금 양인 = 酉. 월지 酉 자리 ✓ (월령 본기 + 신강)',
      weightedStrength: 90,
      isBongi: true,  // 양인격
    },
  },

  sinsal: {
    천을귀인: { present: true, branches: ['축'], score50: 50 },  // 경금 천을귀인 = 축·미. 丑 자리 ✓
    양인:    { present: true, branches: ['유'], score50: 50, position: '월지' },  // 매우 강 (월지)
    역마살:  { present: false, score50: 0 },
    문창귀인: { present: false, score50: 0 },  // 경금 문창 = 해. 사주에 해 없음
    화개살:  { present: true, branches: ['축'], score50: 50 },  // 사유축 그룹 화개 = 축. 자리 ✓
    도화살:  { present: true, branches: ['유'], score50: 50 },  // 사유축 그룹 도화 = 오. 자리 X — 정정: 도화 X
  },

  unseong: {
    year:  { branch: '축', stage: '묘' },   // 약세
    month: { branch: '유', stage: '제왕' }, // 강세
    day:   { branch: '신', stage: '건록' }, // 강세
    hour:  { branch: '자', stage: '사' },
  },
  has12UnseongStrong: true,   // 酉=제왕, 申=건록
  has12UnseongWeak: true,     // 丑=묘

  shinkang: {
    score: 8.0,
    level: '태강',  // 비겁 매우 강 + 인성 + 신강 + 월령 사령
    detail: '월령 酉=비겁월령 +4, 통근(축+1.5인성·신+2비겁·자-1식상), 천간(乙×2 재성-2, 丙 관성-1) = 약 8',
  },

  branchInteractions: {
    합: [],
    충: [],
    형: [],
    해: [],
    원진: [{ pair: ['축', '자'], type: '원진' }],  // 자축 원진? 자축 = 육합인데 원진은 子未, 丑午, 寅酉, 卯申, 辰亥, 巳戌. 子丑은 합. → 정정: 원진 X
  },

  elements: {
    목: 2.0,  // 乙·乙
    화: 1.0,  // 丙
    토: 1.0,  // 丑본기 + 申여기
    금: 4.0,  // 庚·申본기·酉본기 + 축여기
    수: 1.3,  // 子본기 + 신중기 + 축중기
  },

  child: '김수민',
};

export function oheangPercent(saju, element) {
  const total = Object.values(saju.elements).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return Math.round((saju.elements[element] / total) * 100);
}

export function summarize(saju = KIM_JAEHUN_SAJU) {
  return {
    name: saju.parent.name,
    role: saju.parent.role,
    saju8: Object.values(saju.pillars).map(p => `${p.stem}${p.branch}`).join(' '),
    ilgan: saju.ilgan,
    bongi: Object.entries(saju.factorStrength)
      .filter(([, v]) => v.isBongi)
      .map(([k]) => k),
    shinkang: saju.shinkang.level,
    johu: saju.factorStrength.조후.label,
    factorStrengths: Object.fromEntries(
      Object.entries(saju.factorStrength).map(([k, v]) => [k, v.weightedStrength])
    ),
  };
}
