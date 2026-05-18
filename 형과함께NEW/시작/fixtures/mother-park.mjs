// 어머님 박지영 사주 fixture (Phase 1-B)
// 사주: 戊辰年 乙卯月 丁亥日 丙午時 (정화 일간, 음화)
// 명리 정통 매핑 적용 (v2.1 통칭 6셋 정합)
//
// 시안 위반 항목 (v1):
//   - "정인 88 강함" → 실제는 편인 (乙卯 본기 乙 = 편인)
//   - "식신 75 강함" → 실제는 상관 (戊辰 본기 戊 = 상관)
//   - "정재 52" → 정재 자체가 사주에 없음 (午 = 비견 본기)
//   - "조후 95 균형" → 실제는 양기 편중 (화3+토3+목3 vs 금0+수1)
//
// 작성: 2026-05-16

const POSITION_WEIGHT = {
  일간: 1.0, 월령: 1.0, 일지: 0.8, 월간: 0.7,
  시간: 0.5, 시지: 0.5, 연간: 0.4, 연지: 0.4,
};

const G = { 본기: 25, 중기: 12, 여기: 5, 천간자: 10, 지지본기자: 8, 월령사령본기: 30 };

// 卯월(목왕) → 목=왕 / 화=상 / 토=휴 / 금=수 / 수=사
const WANGSANG_AT_MYO = { 목: 1.5, 화: 1.2, 토: 1.0, 금: 0.7, 수: 0.5 };

export const PARK_JIYOUNG_SAJU = {
  parent: {
    name: '박지영',
    role: 'mother',
  },

  pillars: {
    year:  { stem: '무', branch: '진' }, // 戊辰
    month: { stem: '을', branch: '묘' }, // 乙卯
    day:   { stem: '정', branch: '해' }, // 丁亥 (일간)
    hour:  { stem: '병', branch: '오' }, // 丙午
  },
  ilgan: '정',
  ilju: '정해',
  yinyang: '음',
  ilganElement: '화',
  monthBranch: '묘',
  monthBranchElement: '목',

  // 정통 십성 매핑 (정화 음화 기준)
  sipseong: {
    year:  { stem: '상관', branch: '상관' },   // 戊=상관(火→土 음↔양) / 辰 본기 戊 = 상관
    month: { stem: '편인', branch: '편인' },   // 乙=편인(木→火 음↔음) / 卯 본기 乙 = 편인
    day:   { stem: '본인', branch: '정관' },   // 丁=본인 / 亥 본기 壬=정관(水→火 음↔양)
    hour:  { stem: '겁재', branch: '비견' },   // 丙=겁재(같은 火 음↔양) / 午 본기 丁 = 비견
  },

  jijangan: {
    year:  { branch: '진', main: '무', mid: '을', sub: '계' },
    month: { branch: '묘', main: '을', mid: null, sub: null },
    day:   { branch: '해', main: '임', mid: '갑', sub: null },
    hour:  { branch: '오', main: '정', mid: '기', sub: null },
  },

  // ─── 6셋 통칭 인자 (정통 매핑) ───
  factorStrength: {
    인성: {
      // 정화 음화 기준 인성 = 木 (목생화). 정인=甲(양목), 편인=乙(음목)
      // 乙(월간) + 卯본기 乙(편인) + 辰여기 乙(편인) + 亥중기 갑(정인)
      positions: [
        { place: '월간', stem: '乙', sipseong: '편인',
          rawStrength: G.천간자 + G.본기,
          positionWeight: POSITION_WEIGHT.월간 },
        { place: '월령본기', stem: '乙', sipseong: '편인',
          rawStrength: G.월령사령본기 + G.지지본기자,
          positionWeight: POSITION_WEIGHT.월령 },
        { place: '연지중기', stem: '乙', sipseong: '편인',
          rawStrength: G.중기,
          positionWeight: POSITION_WEIGHT.연지 },
        { place: '일지중기', stem: '甲', sipseong: '정인',
          rawStrength: G.중기,
          positionWeight: POSITION_WEIGHT.일지 },
      ],
      wangsang: WANGSANG_AT_MYO.목,
      // (10+25)*0.7 + (30+8)*1.0 + 12*0.4 + 12*0.8 = 24.5 + 38 + 4.8 + 9.6 = 76.9 × 1.5 = 115.35 → 클램프 100
      weightedStrength: 100,
      isBongi: true,
    },
    식상: {
      // 식신=己(음토), 상관=戊(양토)
      // 戊(연간) + 辰본기 戊(상관)
      positions: [
        { place: '연간', stem: '戊', sipseong: '상관',
          rawStrength: G.천간자 + G.본기,
          positionWeight: POSITION_WEIGHT.연간 },
        { place: '연지본기', stem: '戊', sipseong: '상관',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.연지 },
        { place: '시지중기', stem: '己', sipseong: '식신',
          rawStrength: G.중기,
          positionWeight: POSITION_WEIGHT.시지 },
      ],
      wangsang: WANGSANG_AT_MYO.토,
      // (10+25)*0.4 + 8*0.4 + 12*0.5 = 14 + 3.2 + 6 = 23.2 × 1.0 = 23.2
      weightedStrength: 23,
      isBongi: false,
    },
    관성: {
      // 정관=壬(양수), 편관=癸(음수)
      // 亥본기 壬(정관) + 辰여기 癸(편관)
      positions: [
        { place: '일지', stem: '壬', sipseong: '정관',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.일지 },
        { place: '연지여기', stem: '癸', sipseong: '편관',
          rawStrength: G.여기,
          positionWeight: POSITION_WEIGHT.연지 },
      ],
      wangsang: WANGSANG_AT_MYO.수,
      // 8*0.8 + 5*0.4 = 6.4 + 2 = 8.4 × 0.5 = 4.2
      weightedStrength: 4,
      isBongi: false,
    },
    재성: {
      // 정재=辛(음금), 편재=庚(양금)
      // 사주에 금 0개 — 자리 X
      positions: [],
      wangsang: WANGSANG_AT_MYO.금,
      weightedStrength: 0,
      isBongi: false,
    },
    비겁: {
      // 비견=丁(음화), 겁재=丙(양화)
      // 丙(시간) + 午본기 丁(비견)
      positions: [
        { place: '시간', stem: '丙', sipseong: '겁재',
          rawStrength: G.천간자 + G.본기,
          positionWeight: POSITION_WEIGHT.시간 },
        { place: '시지본기', stem: '丁', sipseong: '비견',
          rawStrength: G.지지본기자,
          positionWeight: POSITION_WEIGHT.시지 },
        { place: '시지중기', stem: '己', sipseong: null, // 己는 식신, 비겁 X. 잘못 — 무시
          rawStrength: 0,
          positionWeight: POSITION_WEIGHT.시지 },
      ],
      wangsang: WANGSANG_AT_MYO.화,  // 비겁은 화 (정화 일간)
      // (10+25)*0.5 + 8*0.5 = 17.5 + 4 = 21.5 × 1.2 = 25.8
      weightedStrength: 26,
      isBongi: false,
    },
    조후: {
      // 화·토·목 강세 vs 금·수 약세
      // 화3 + 토3 + 목3 vs 금0 + 수1 = 차이 8 (양기 강 편중)
      label: '양기·열기 우세',
      direction: 'hot',
      차이: 8,
      balanced: false,
      weightedStrength: 10,  // 매우 편중
      isBongi: false,
    },
    // 동적 특수 슬롯
    특수: {
      type: '천을귀인',
      detail: '정화 천을귀인 = 해·유. 일지 亥 자리 ✓',
      weightedStrength: 60,
      isBongi: false,
    },
  },

  sinsal: {
    천을귀인: { present: true, branches: ['해'], score50: 50 },
    양인:    { present: false, score50: 0 },  // 정화 양인 = 巳. 사주에 巳 없음
    역마살:  { present: false, score50: 0 },  // 신자진 그룹 역마 = 인. 사주에 인 없음
    문창귀인: { present: false, score50: 0 },  // 정화 문창 = 유. 사주에 유 없음
    화개살:  { present: true, branches: ['진'], score50: 50 },  // 신자진 그룹 화개 = 진. 진 자리 ✓
    도화살:  { present: false, score50: 0 },
  },

  unseong: {
    year:  { branch: '진', stage: '쇠' },   // 정화의 진 = 쇠
    month: { branch: '묘', stage: '병' },
    day:   { branch: '해', stage: '태' },   // 약세
    hour:  { branch: '오', stage: '건록' }, // 강세
  },
  has12UnseongStrong: true,   // 午 = 건록
  has12UnseongWeak: true,     // 亥 = 태

  shinkang: {
    score: 5.0,
    level: '신강',  // 인성·비겁 강해서 신강
    detail: '월령 卯=인성월령 +3, 통근(진토 -1, 해수 -1.5, 오화 +2), 천간(戊 -1, 乙 +1.5, 丙 +1.5) = 4.5 ≈ 5',
  },

  branchInteractions: {
    합: [],
    충: [],
    형: [],
    해: [{ pair: ['인', '해'], type: '해' }],  // 사실 인이 없으니 해 X. 진오해 X. → 없음
    원진: [],
  },

  elements: {
    목: 2.5,  // 乙·卯본기 + 진여기 + 해중기 (寅亥합 X, 합 자체 없음)
    화: 3.0,  // 丁(일간)·丙·午본기
    토: 2.0,  // 戊·진본기 + 오중기
    금: 0,
    수: 0.8,  // 해본기 + 진중기
  },

  child: '김수민',  // 자녀 참조
};

// 헬퍼 (자녀 fixture와 동일 인터페이스)
export function oheangPercent(saju, element) {
  const total = Object.values(saju.elements).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return Math.round((saju.elements[element] / total) * 100);
}

export function summarize(saju = PARK_JIYOUNG_SAJU) {
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
