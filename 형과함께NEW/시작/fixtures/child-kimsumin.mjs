// 자녀 김수민 양 사주 fixture (Phase 0-C v2 — 재작성)
// 사주: 壬子年 庚申月 乙亥日 戊寅時 (을목 일간, 만 4세 0개월)
//
// v1 폐기 사유: 시안 점수에 맞추는 회로 + 위치 가중치 누락
// v2 원칙:
//   - 시안 점수와 무관, 명리 통설 기반 사주 사실만 박음
//   - 인자별 위치(positions) 명시 + 위치 가중치 적용된 weightedStrength 사전 산출
//   - factors.mjs는 weightedStrength × 등급 × 부호만 처리
//
// 작성: 2026-05-16

// ─── 위치 가중치 표 (2_child_6factors.md) ───
export const POSITION_WEIGHT = {
  일간: 1.0,
  월령: 1.0,   // = 월지
  일지: 0.8,
  월간: 0.7,
  시간: 0.5,
  시지: 0.5,
  연간: 0.4,
  연지: 0.4,
};

// ─── 명리 강도 가산 표 (룰 ①) ───
// 본기·중기·여기 가산 + 천간·지지 글자 수
// 단순화: 한 위치의 인자가 본기·중기·여기 중 어느 것이냐에 따라 가산
const STRENGTH_GAIN = {
  본기: 25,      // 통근 본기 또는 지지 본기 자리
  중기: 12,
  여기: 5,
  천간자: 10,    // 천간에 자리한 한 글자
  지지본기자: 8, // 지지 본기로 자리
  월령사령본기: 30,  // 인자가 월지 본기로 자리하면 추가
};

// 왕상휴수사 보정 (월령 기준)
// 申월(금왕) → 수=상 / 토=휴 / 화=수 / 목=사 / 금=왕
const WANGSANGHYUSU_AT_SHIN = {
  금: 1.5,  // 왕
  수: 1.2,  // 상
  토: 1.0,  // 휴
  화: 0.7,  // 수
  목: 0.5,  // 사
};

export const KIMSUMIN_SAJU = {
  child: {
    name: '김수민',
    gender: 'female',
    birthDate: '2022-02-15',
    age: '만 4세 0개월',
  },

  // ─── 사주 8자 ───
  pillars: {
    year:  { stem: '임', branch: '자' }, // 壬子
    month: { stem: '경', branch: '신' }, // 庚申
    day:   { stem: '을', branch: '해' }, // 乙亥 (일간)
    hour:  { stem: '무', branch: '인' }, // 戊寅
  },
  ilgan: '을',
  ilju: '을해',
  yinyang: '음',
  ilganElement: '목',
  monthBranch: '신',
  monthBranchElement: '금',  // 왕상휴수사 기준

  // ─── 십성 매핑 (을목 기준, 룰 정통) ───
  sipseong: {
    year:  { stem: '정인', branch: '편인' },
    month: { stem: '정관', branch: '정관' },
    day:   { stem: '본인', branch: '정인' },
    hour:  { stem: '정재', branch: '겁재' },
  },

  // ─── 지지장간 ───
  jijangan: {
    year:  { branch: '자', main: '계', mid: null, sub: null },
    month: { branch: '신', main: '경', mid: '임', sub: '무' },
    day:   { branch: '해', main: '임', mid: '갑', sub: null },
    hour:  { branch: '인', main: '갑', mid: '병', sub: '무' },
  },

  // ─── 6셋 통칭 인자: positions + weightedStrength 사전 산출 ───
  // weightedStrength = Σ(positionRawStrength × positionWeight)
  // 산출 표는 결정사항메모 결정 1 참조
  factorStrength: {
    인성: {
      // 정인·편인 통칭. 자리 = 壬(년간) + 子본기 계(편인) + 申중기 임(정인) + 亥본기 임(정인)
      positions: [
        { place: '연간', stem: '壬', sipseong: '정인',
          rawStrength: STRENGTH_GAIN.천간자 + STRENGTH_GAIN.본기,  // 천간 자리 10 + 통근 본기 25 (壬은 자·해 본기에 통근)
          positionWeight: POSITION_WEIGHT.연간 },  // 0.4
        { place: '연지', stem: '癸', sipseong: '편인',
          rawStrength: STRENGTH_GAIN.지지본기자,    // 지지 본기 자리 8
          positionWeight: POSITION_WEIGHT.연지 },  // 0.4
        { place: '월지중기', stem: '壬', sipseong: '정인',
          rawStrength: STRENGTH_GAIN.중기,         // 월령 자리에 중기로 자리 12
          positionWeight: POSITION_WEIGHT.월령 },  // 1.0
        { place: '일지', stem: '壬', sipseong: '정인',
          rawStrength: STRENGTH_GAIN.지지본기자,    // 일지 본기 8
          positionWeight: POSITION_WEIGHT.일지 },  // 0.8
      ],
      wangsang: WANGSANGHYUSU_AT_SHIN.수,  // 수 = 상 ×1.2
      // 계산: (10+25)*0.4 + 8*0.4 + 12*1.0 + 8*0.8 = 14 + 3.2 + 12 + 6.4 = 35.6
      // × 1.2 = 42.7 → 클램프 100
      weightedStrength: 43,
      isBongi: true,  // 사주의 본기 인자 중 하나
    },
    식상: {
      // 寅중기 병(상관) 1자만
      positions: [
        { place: '시지중기', stem: '丙', sipseong: '상관',
          rawStrength: STRENGTH_GAIN.중기,
          positionWeight: POSITION_WEIGHT.시지 },
      ],
      wangsang: WANGSANGHYUSU_AT_SHIN.화,  // 화 = 수 ×0.7
      // 12 * 0.5 * 0.7 = 4.2
      weightedStrength: 4,
      isBongi: false,
    },
    관성: {
      // 庚(월간) + 申본기 경(정관) — 매우 강
      positions: [
        { place: '월간', stem: '庚', sipseong: '정관',
          rawStrength: STRENGTH_GAIN.천간자 + STRENGTH_GAIN.본기,  // 천간 10 + 통근 본기 25
          positionWeight: POSITION_WEIGHT.월간 },  // 0.7
        { place: '월령본기', stem: '庚', sipseong: '정관',
          rawStrength: STRENGTH_GAIN.월령사령본기 + STRENGTH_GAIN.지지본기자,  // 월령 본기 30 + 본기 자리 8
          positionWeight: POSITION_WEIGHT.월령 },  // 1.0
      ],
      wangsang: WANGSANGHYUSU_AT_SHIN.금,  // 금 = 왕 ×1.5
      // (10+25)*0.7 + (30+8)*1.0 = 24.5 + 38 = 62.5
      // × 1.5 = 93.75 → 클램프 100
      weightedStrength: 94,
      isBongi: true,  // 정관격
    },
    재성: {
      // 戊(시간) + 申여기 무 + 寅여기 무
      positions: [
        { place: '시간', stem: '戊', sipseong: '정재',
          rawStrength: STRENGTH_GAIN.천간자,  // 천간 자리 10 (지지 통근 X)
          positionWeight: POSITION_WEIGHT.시간 },  // 0.5
        { place: '월지여기', stem: '戊', sipseong: '정재',
          rawStrength: STRENGTH_GAIN.여기,  // 여기 5
          positionWeight: POSITION_WEIGHT.월령 },  // 1.0
        { place: '시지여기', stem: '戊', sipseong: '정재',
          rawStrength: STRENGTH_GAIN.여기,  // 여기 5
          positionWeight: POSITION_WEIGHT.시지 },  // 0.5
      ],
      wangsang: WANGSANGHYUSU_AT_SHIN.토,  // 토 = 휴 ×1.0
      // 10*0.5 + 5*1.0 + 5*0.5 = 5 + 5 + 2.5 = 12.5
      // × 1.0 = 12.5
      weightedStrength: 13,
      isBongi: false,
    },
    비겁: {
      // 亥중기 갑(겁재) + 寅본기 갑(겁재)
      positions: [
        { place: '일지중기', stem: '甲', sipseong: '겁재',
          rawStrength: STRENGTH_GAIN.중기,  // 12
          positionWeight: POSITION_WEIGHT.일지 },  // 0.8
        { place: '시지', stem: '甲', sipseong: '겁재',
          rawStrength: STRENGTH_GAIN.지지본기자,  // 본기 자리 8
          positionWeight: POSITION_WEIGHT.시지 },  // 0.5
      ],
      wangsang: WANGSANGHYUSU_AT_SHIN.목,  // 목 = 사 ×0.5
      // 12*0.8 + 8*0.5 = 9.6 + 4 = 13.6
      // × 0.5 = 6.8
      weightedStrength: 7,
      isBongi: false,
    },
    조후: {
      // 한열 분포: 수3 + 금2 vs 목1 + 화0 + 토1
      // 차이 = (수+금) - (목+화) = 5 - 1 = 4 (한기 편중)
      label: '한습 편중',
      direction: 'cold',
      차이: 4,
      balanced: false,  // 차이 ≥ 4 → 강 편중
      // 만족 본기 감산 / 흔들림 본기 가산
      weightedStrength: 25,  // 차이 4 = 균형 25점만 (불균형이면 만족 감산 강)
      isBongi: false,
    },
    // 동적 특수 슬롯 (Q1 = 동적)
    특수: {
      type: '천을귀인',
      detail: '을일간 천을귀인 = 子·申. 둘 다 자리 (연지·월지)',
      // 강도 산출: 자리 1개당 50, 2개 = 100? 룰 명확화 필요. 일단 자리 2개 = 강 80
      weightedStrength: 80,
      isBongi: false,
    },
  },

  // ─── 신살 (룰 50점 정량값 변환) ───
  // 자리 있으면 50점 여기 가산 (해당 요인 본기 +0.2)
  sinsal: {
    천을귀인: { present: true, branches: ['자', '신'], score50: 50 },
    양인:    { present: true, branches: ['인'], score50: 50, position: '시지' },
    역마살:  { present: true, branches: ['인'], score50: 50, position: '시지' },
    문창귀인: { present: false, score50: 0 },
    화개살:  { present: false, score50: 0 },
    도화살:  { present: false, score50: 0 },
  },

  // ─── 12운성 (을목 기준) ───
  unseong: {
    year:  { branch: '자', stage: '병' },
    month: { branch: '신', stage: '태' },     // 약세
    day:   { branch: '해', stage: '사' },
    hour:  { branch: '인', stage: '제왕' },  // 강세
  },
  has12UnseongStrong: true,   // 寅 = 제왕
  has12UnseongWeak: true,     // 申 = 태

  // ─── 신강 ───
  shinkang: {
    score: 1.0,
    level: '중화',
    detail: '월령 申=관성월령 -3, 통근(자해+3 인+2), 천간(壬+1.5 庚-1.5 戊-1) = 1.0',
  },

  // ─── 일지 관계·합·충 ───
  branchInteractions: {
    합: [{ pair: ['해', '인'], type: '육합', hwa: '목', strength: '강' }],
    충: [{ pair: ['신', '인'], type: '육충' }],  // 寅申충
    형: [],
    해: [],
    원진: [],
  },

  // ─── 오행 분포 ───
  elements: {
    목: 1.5,
    화: 0.3,
    토: 1.4,
    금: 2.0,
    수: 2.8,
  },
};

// 오행 백분율 계산
export function oheangPercent(saju, element) {
  const total = Object.values(saju.elements).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return Math.round((saju.elements[element] / total) * 100);
}

// 인자 weightedStrength 검증용 (수동 산출)
export function recomputeWeightedStrength(factor) {
  if (!factor.positions) return factor.weightedStrength;
  const sum = factor.positions.reduce((acc, p) =>
    acc + p.rawStrength * p.positionWeight, 0);
  const wangsang = factor.wangsang ?? 1.0;
  return Math.min(100, Math.round(sum * wangsang));
}

// 요약
export function summarize(saju = KIMSUMIN_SAJU) {
  return {
    name: saju.child.name,
    saju8: Object.values(saju.pillars).map(p => `${p.stem}${p.branch}`).join(' '),
    ilgan: saju.ilgan,
    bongi: Object.entries(saju.factorStrength)
      .filter(([, v]) => v.isBongi)
      .map(([k]) => k),
    shinkang: saju.shinkang.level,
    johu: saju.factorStrength.조후.label,
    specialSlot: saju.factorStrength.특수.type,
    factorStrengths: Object.fromEntries(
      Object.entries(saju.factorStrength).map(([k, v]) => [k, v.weightedStrength])
    ),
  };
}
