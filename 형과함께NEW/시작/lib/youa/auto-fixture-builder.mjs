// 자동 fixture 빌더 (Phase 7 캘리브레이션용)
//
// 사주 8자 입력 → fixture 형식 자동 산출
// factorStrength·sinsal·unseong·shinkang·조후 모두 룰 기반 자동 계산
//
// 작성: 2026-05-17

import {
  STEM_ELEM, STEM_YY, BRANCH_ELEM, BRANCHES, JIJANGAN,
  getSipseong, sipseongToTong, getShinkang, calcElements,
  calcSinsal, calcBranchInteractions, calcUnseong, calcJohu,
} from './saju-helpers.mjs';

const POSITION_WEIGHT = {
  일간: 1.0, 월령: 1.0, 일지: 0.8, 월간: 0.7,
  시간: 0.5, 시지: 0.5, 연간: 0.4, 연지: 0.4,
};
const G = { 본기: 25, 중기: 12, 여기: 5, 천간자: 10, 지지본기자: 8, 월령사령본기: 30 };

// 왕상휴수사 (월령 오행 기준)
const WANGSANG = {
  목: { 목: 1.5, 화: 1.2, 토: 0.7, 금: 0.5, 수: 1.0 },
  화: { 화: 1.5, 토: 1.2, 금: 0.7, 수: 0.5, 목: 1.0 },
  토: { 토: 1.5, 금: 1.2, 수: 0.7, 목: 0.5, 화: 1.0 },
  금: { 금: 1.5, 수: 1.2, 목: 0.7, 화: 0.5, 토: 1.0 },
  수: { 수: 1.5, 목: 1.2, 화: 0.7, 토: 0.5, 금: 1.0 },
};

// 통칭별 어느 천간이 거기 속하는지 (일간 기준)
function tongToStems(ilgan, tong) {
  const ie = STEM_ELEM[ilgan];
  const iy = STEM_YY[ilgan];
  const stems = [];
  for (const s of Object.keys(STEM_ELEM)) {
    const tongOfS = sipseongToTong(getSipseong(ilgan, s));
    if (tongOfS === tong) stems.push(s);
  }
  return stems;
}

// 한 통칭 인자의 weightedStrength 산출
function calcFactorStrength(ilgan, pillars, tong, monthElem) {
  const positions = [];
  const places = [
    { key: 'year',  stem: pillars.year.stem,  branch: pillars.year.branch,  stemPos: '연간', branchPos: '연지' },
    { key: 'month', stem: pillars.month.stem, branch: pillars.month.branch, stemPos: '월간', branchPos: '월령' },
    { key: 'day',   stem: pillars.day.stem,   branch: pillars.day.branch,   stemPos: '일간', branchPos: '일지' },
    { key: 'hour',  stem: pillars.hour.stem,  branch: pillars.hour.branch,  stemPos: '시간', branchPos: '시지' },
  ];

  const tongStems = new Set(tongToStems(ilgan, tong));

  for (const p of places) {
    // 천간 (단, 일간 본인은 비겁 본기로만 계산)
    if (p.key !== 'day' && tongStems.has(p.stem)) {
      positions.push({
        place: p.stemPos,
        stem: p.stem,
        rawStrength: G.천간자 + G.본기,  // 천간 자리 + 통근 본기 가능성 (단순화)
        positionWeight: POSITION_WEIGHT[p.stemPos],
      });
    }
    // 지지장간
    const jj = JIJANGAN[p.branch] ?? [];
    for (const { stem, type } of jj) {
      if (!tongStems.has(stem)) continue;
      const isMonth = p.branchPos === '월령';
      const rawBase = type === '본기' ? G.본기 : type === '중기' ? G.중기 : G.여기;
      const monthBonus = (isMonth && type === '본기') ? G.월령사령본기 : 0;
      const charBonus = type === '본기' ? G.지지본기자 : 0;
      positions.push({
        place: `${p.branchPos}${type === '본기' ? '본기' : type === '중기' ? '중기' : '여기'}`,
        stem,
        rawStrength: rawBase + monthBonus + charBonus,
        positionWeight: POSITION_WEIGHT[p.branchPos],
      });
    }
  }

  // 비겁은 일간 자신 포함
  if (tong === '비겁') {
    positions.push({
      place: '일간', stem: ilgan,
      rawStrength: G.천간자 + G.본기,
      positionWeight: POSITION_WEIGHT.일간,
    });
  }

  // 왕상휴수사 보정 (해당 통칭 오행)
  // 통칭 첫 stem의 오행 사용 (예: 인성 = 일간 생하는 오행)
  let tongElem = null;
  if (tong === '비겁') tongElem = STEM_ELEM[ilgan];
  else if (positions[0]) tongElem = STEM_ELEM[positions[0].stem];

  const wangsang = tongElem && monthElem ? WANGSANG[monthElem]?.[tongElem] ?? 1.0 : 1.0;

  // 합산
  const rawSum = positions.reduce((acc, p) => acc + p.rawStrength * p.positionWeight, 0);
  const weightedStrength = Math.min(100, Math.round(rawSum * wangsang));

  return { positions, wangsang, weightedStrength };
}

// 자녀 사주 → fixture
export function buildChildFixture(pillars, info = {}) {
  const ilgan = pillars.day.stem;
  const ilji = pillars.day.branch;
  const yinyang = STEM_YY[ilgan];
  const ilganElement = STEM_ELEM[ilgan];
  const monthBranch = pillars.month.branch;
  const monthBranchElement = BRANCH_ELEM[monthBranch];

  const allStems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, pillars.hour.stem];
  const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch];
  const otherStems = [pillars.year.stem, pillars.month.stem, pillars.hour.stem];

  // 신강
  const shinkangResult = getShinkang(ilgan, monthBranch, allBranches, otherStems);

  // 오행
  const elements = calcElements(allStems, allBranches);

  // 신살
  const sinsal = calcSinsal(ilgan, pillars.year.branch, allBranches);

  // 합·충
  const branchInteractions = calcBranchInteractions(pillars.day.branch, [pillars.year.branch, pillars.month.branch, pillars.hour.branch]);

  // 12운성
  const unseongResult = calcUnseong(ilgan, allBranches);

  // 조후
  const johu = calcJohu(elements);

  // 6셋 통칭 강도
  const factorStrength = {};
  for (const tong of ['인성', '식상', '관성', '재성', '비겁']) {
    factorStrength[tong] = calcFactorStrength(ilgan, pillars, tong, monthBranchElement);
    factorStrength[tong].isBongi = factorStrength[tong].weightedStrength >= 60;
  }
  factorStrength.조후 = {
    ...johu,
    isBongi: false,
  };

  // 특수 슬롯 (가장 두드러진 신살)
  let special = null;
  if (sinsal.양인.present) special = { type: '양인', weightedStrength: 80 };
  else if (sinsal.천을귀인.present) special = { type: '천을귀인', weightedStrength: 70 };
  else if (sinsal.도화살.present) special = { type: '도화살', weightedStrength: 60 };
  else if (!johu.balanced && johu.차이 >= 4) special = { type: '조후편중', weightedStrength: 50 };
  factorStrength.특수 = special ?? { type: '없음', weightedStrength: 0 };

  return {
    child: { name: info.name ?? '검증용', gender: info.gender ?? 'female', birthDate: info.birthDate ?? '2022-01-01', age: info.age ?? '만 4세' },
    pillars,
    ilgan, ilju: `${ilgan}${ilji}`, yinyang, ilganElement, monthBranch, monthBranchElement,
    sipseong: {
      year:  { stem: getSipseong(ilgan, pillars.year.stem),  branch: getSipseong(ilgan, pillars.year.branch) },
      month: { stem: getSipseong(ilgan, pillars.month.stem), branch: getSipseong(ilgan, pillars.month.branch) },
      day:   { stem: '본인', branch: getSipseong(ilgan, pillars.day.branch) },
      hour:  { stem: getSipseong(ilgan, pillars.hour.stem),  branch: getSipseong(ilgan, pillars.hour.branch) },
    },
    jijangan: {
      year:  { branch: pillars.year.branch, ...flattenJjangan(pillars.year.branch) },
      month: { branch: pillars.month.branch, ...flattenJjangan(pillars.month.branch) },
      day:   { branch: pillars.day.branch, ...flattenJjangan(pillars.day.branch) },
      hour:  { branch: pillars.hour.branch, ...flattenJjangan(pillars.hour.branch) },
    },
    factorStrength,
    sinsal,
    unseong: {
      year:  { branch: pillars.year.branch,  stage: unseongResult.list[0].stage },
      month: { branch: pillars.month.branch, stage: unseongResult.list[1].stage },
      day:   { branch: pillars.day.branch,   stage: unseongResult.list[2].stage },
      hour:  { branch: pillars.hour.branch,  stage: unseongResult.list[3].stage },
    },
    has12UnseongStrong: unseongResult.hasStrong,
    has12UnseongWeak: unseongResult.hasWeak,
    shinkang: shinkangResult,
    branchInteractions,
    elements,
  };
}

function flattenJjangan(branch) {
  const jj = JIJANGAN[branch] ?? [];
  return {
    main: jj.find(j => j.type === '본기')?.stem ?? null,
    mid:  jj.find(j => j.type === '중기')?.stem ?? null,
    sub:  jj.find(j => j.type === '여기')?.stem ?? null,
  };
}
