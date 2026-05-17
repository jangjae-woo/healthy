// SajuAnalysisCore → fixture 변환기 (진짜 만세력 기반)
//
// saju-core.ts의 computeFullSajuCore() 결과를 시작 폴더 fixture 형식으로 변환.
// 시작 폴더의 auto-fixture-builder.mjs (simplified)를 대체.
//
// 작성: 2026-05-17

import {
  STEM_HANJA, BRANCH_HANJA, calcElements, getDayMasterStrength,
} from '../saju-core/saju-calculator.ts';

// 한자 → 한글 매핑 (saju-core는 한글 천간지지 사용. 만약 한자라면 변환)
// 이미 saju-core는 한글 사용 ('갑', '을' 등) — 변환 불필요

// 천간 오행·음양 (saju-helpers.mjs에서 가져와도 되지만 명시적으로)
const STEM_ELEM = {
  갑:'목', 을:'목', 병:'화', 정:'화', 무:'토',
  기:'토', 경:'금', 신:'금', 임:'수', 계:'수',
};
const STEM_YY = {
  갑:'양', 을:'음', 병:'양', 정:'음', 무:'양',
  기:'음', 경:'양', 신:'음', 임:'양', 계:'음',
};
const BRANCH_ELEM = {
  자:'수', 축:'토', 인:'목', 묘:'목', 진:'토', 사:'화',
  오:'화', 미:'토', 신:'금', 유:'금', 술:'토', 해:'수',
};

// 지지장간
const JIJANGAN = {
  자: { main:'계', mid:null, sub:'임' },
  축: { main:'기', mid:'신', sub:'계' },
  인: { main:'갑', mid:'병', sub:'무' },
  묘: { main:'을', mid:null, sub:'갑' },
  진: { main:'무', mid:'계', sub:'을' },
  사: { main:'병', mid:'경', sub:'무' },
  오: { main:'정', mid:'기', sub:'병' },
  미: { main:'기', mid:'을', sub:'정' },
  신: { main:'경', mid:'임', sub:'무' },
  유: { main:'신', mid:null, sub:'경' },
  술: { main:'무', mid:'정', sub:'신' },
  해: { main:'임', mid:'갑', sub:'무' },
};

// 위치 가중치
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

// 십성 → 통칭
function sipseongToTong(sipseong) {
  return {
    '비견': '비겁', '겁재': '비겁',
    '식신': '식상', '상관': '식상',
    '편재': '재성', '정재': '재성',
    '편관': '관성', '정관': '관성',
    '편인': '인성', '정인': '인성',
  }[sipseong];
}

// 일간 기준 통칭에 속하는 천간 목록
function tongToStems(ilgan, tong) {
  const ie = STEM_ELEM[ilgan];
  const iy = STEM_YY[ilgan];
  const GEN = { 목:'화', 화:'토', 토:'금', 금:'수', 수:'목' };
  const CTR = { 목:'토', 화:'금', 토:'수', 금:'목', 수:'화' };

  const stems = [];
  for (const s of Object.keys(STEM_ELEM)) {
    if (s === ilgan && tong !== '비겁') continue;
    const te = STEM_ELEM[s];
    const ty = STEM_YY[s];
    const same = iy === ty;
    let sipseong;
    if (te === ie) sipseong = same ? '비견' : '겁재';
    else if (GEN[ie] === te) sipseong = same ? '식신' : '상관';
    else if (CTR[ie] === te) sipseong = same ? '편재' : '정재';
    else if (CTR[te] === ie) sipseong = same ? '편관' : '정관';
    else if (GEN[te] === ie) sipseong = same ? '편인' : '정인';
    else continue;
    if (sipseongToTong(sipseong) === tong) stems.push(s);
  }
  return stems;
}

// 6셋 통칭 인자 강도 산출
function calcFactorStrength(ilgan, pillars, tong, monthElem) {
  const positions = [];
  const tongStems = new Set(tongToStems(ilgan, tong));

  const places = [
    { key: 'year',  stem: pillars.year.stem,  branch: pillars.year.branch,  stemPos: '연간', branchPos: '연지' },
    { key: 'month', stem: pillars.month.stem, branch: pillars.month.branch, stemPos: '월간', branchPos: '월령' },
    { key: 'day',   stem: pillars.day.stem,   branch: pillars.day.branch,   stemPos: '일간', branchPos: '일지' },
    { key: 'hour',  stem: pillars.hour?.stem, branch: pillars.hour?.branch, stemPos: '시간', branchPos: '시지' },
  ];

  for (const p of places) {
    if (!p.stem) continue;
    // 천간 (일간 본인은 비겁 본기로만)
    if (p.key !== 'day' && tongStems.has(p.stem)) {
      positions.push({
        place: p.stemPos,
        stem: p.stem,
        rawStrength: G.천간자 + G.본기,
        positionWeight: POSITION_WEIGHT[p.stemPos],
      });
    }
    // 지지장간
    const jj = JIJANGAN[p.branch];
    if (!jj) continue;
    if (jj.main && tongStems.has(jj.main)) {
      const isMonth = p.branchPos === '월령';
      const monthBonus = isMonth ? G.월령사령본기 : 0;
      positions.push({
        place: `${p.branchPos}본기`,
        stem: jj.main,
        rawStrength: G.본기 + monthBonus + G.지지본기자,
        positionWeight: POSITION_WEIGHT[p.branchPos],
      });
    }
    if (jj.mid && tongStems.has(jj.mid)) {
      positions.push({
        place: `${p.branchPos}중기`,
        stem: jj.mid,
        rawStrength: G.중기,
        positionWeight: POSITION_WEIGHT[p.branchPos],
      });
    }
    if (jj.sub && tongStems.has(jj.sub)) {
      positions.push({
        place: `${p.branchPos}여기`,
        stem: jj.sub,
        rawStrength: G.여기,
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

  // 왕상휴수사 보정
  let tongElem = null;
  if (tong === '비겁') tongElem = STEM_ELEM[ilgan];
  else if (positions.length > 0) tongElem = STEM_ELEM[positions[0].stem];

  const wangsang = tongElem && monthElem ? WANGSANG[monthElem]?.[tongElem] ?? 1.0 : 1.0;
  const rawSum = positions.reduce((acc, p) => acc + p.rawStrength * p.positionWeight, 0);
  const weightedStrength = Math.min(100, Math.round(rawSum * wangsang));

  return { positions, wangsang, weightedStrength };
}

// 조후 산출
function calcJohu(elements) {
  const warmth = (elements.목 ?? 0) + (elements.화 ?? 0);
  const cold = (elements.금 ?? 0) + (elements.수 ?? 0);
  const diff = Math.abs(warmth - cold);
  const balanced = diff <= 1;
  const direction = warmth > cold ? 'hot' : 'cold';
  const strength = balanced ? 95 : Math.max(0, 100 - diff * 15);
  return {
    차이: Math.round(diff * 10) / 10,
    balanced, direction,
    weightedStrength: Math.round(strength),
    label: balanced ? '균형' : (direction === 'hot' ? '양기·열기 우세' : '한기·습기 우세'),
    isBongi: false,
  };
}

// 신살 배열 → SinsalSet 형식
function sinsalArrayToSet(sinsalArr, ilgan, allBranches, yearBranch) {
  const result = {
    천을귀인: { present: false, branches: [], score50: 0 },
    양인:    { present: false, branches: [], score50: 0 },
    역마살:  { present: false, branches: [], score50: 0 },
    화개살:  { present: false, branches: [], score50: 0 },
    도화살:  { present: false, branches: [], score50: 0 },
    문창귀인: { present: false, branches: [], score50: 0 },
  };

  // saju-core의 calcSinsal은 '양인살' 명으로 저장
  if (sinsalArr.includes('천을귀인')) result.천을귀인 = { present: true, branches: [], score50: 50 };
  if (sinsalArr.includes('양인살')) result.양인 = { present: true, branches: [], score50: 50 };
  if (sinsalArr.includes('역마살')) result.역마살 = { present: true, branches: [], score50: 50 };
  if (sinsalArr.includes('화개살')) result.화개살 = { present: true, branches: [], score50: 50 };
  if (sinsalArr.includes('도화살')) result.도화살 = { present: true, branches: [], score50: 50 };
  if (sinsalArr.includes('문창귀인')) result.문창귀인 = { present: true, branches: [], score50: 50 };

  return result;
}

// 12운성 (saju-helpers의 표 재사용)
const UNSEONG_TABLE = {
  갑: { 해:'장생',자:'목욕',축:'관대',인:'건록',묘:'제왕',진:'쇠',사:'병',오:'사',미:'묘',신:'절',유:'태',술:'양' },
  을: { 오:'장생',사:'목욕',진:'관대',묘:'건록',인:'제왕',축:'쇠',자:'병',해:'사',술:'묘',유:'절',신:'태',미:'양' },
  병: { 인:'장생',묘:'목욕',진:'관대',사:'건록',오:'제왕',미:'쇠',신:'병',유:'사',술:'묘',해:'절',자:'태',축:'양' },
  정: { 유:'장생',신:'목욕',미:'관대',오:'건록',사:'제왕',진:'쇠',묘:'병',인:'사',축:'묘',자:'절',해:'태',술:'양' },
  무: { 인:'장생',묘:'목욕',진:'관대',사:'건록',오:'제왕',미:'쇠',신:'병',유:'사',술:'묘',해:'절',자:'태',축:'양' },
  기: { 유:'장생',신:'목욕',미:'관대',오:'건록',사:'제왕',진:'쇠',묘:'병',인:'사',축:'묘',자:'절',해:'태',술:'양' },
  경: { 사:'장생',오:'목욕',미:'관대',신:'건록',유:'제왕',술:'쇠',해:'병',자:'사',축:'묘',인:'절',묘:'태',진:'양' },
  신: { 자:'장생',해:'목욕',술:'관대',유:'건록',신:'제왕',미:'쇠',오:'병',사:'사',진:'묘',묘:'절',인:'태',축:'양' },
  임: { 신:'장생',유:'목욕',술:'관대',해:'건록',자:'제왕',축:'쇠',인:'병',묘:'사',진:'묘',사:'절',오:'태',미:'양' },
  계: { 묘:'장생',인:'목욕',축:'관대',자:'건록',해:'제왕',술:'쇠',유:'병',신:'사',미:'묘',오:'절',사:'태',진:'양' },
};
const UNSEONG_STRONG = ['장생', '관대', '건록', '제왕'];
const UNSEONG_WEAK = ['태', '묘', '절'];

// 합·충 계산
const YUKHAP = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']];
const HWA_MAP = { '자축':'토','축자':'토', '인해':'목','해인':'목', '묘술':'화','술묘':'화', '진유':'금','유진':'금', '사신':'수','신사':'수', '오미':'화','미오':'화' };
const YUKCHUNG = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];

function calcBranchInteractions(branches) {
  const hap = [], chung = [];
  for (const [a, b] of YUKHAP) {
    if (branches.includes(a) && branches.includes(b)) {
      hap.push({ pair: [a, b], type: '육합', hwa: HWA_MAP[a + b], strength: '강' });
    }
  }
  for (const [a, b] of YUKCHUNG) {
    if (branches.includes(a) && branches.includes(b)) {
      chung.push({ pair: [a, b], type: '육충' });
    }
  }
  return { 합: hap, 충: chung, 형: [], 해: [], 원진: [] };
}

// 특수 슬롯 자동 선택
function pickSpecialSlot(sinsal, johu) {
  if (sinsal.양인.present) return { type: '양인', weightedStrength: 90, isBongi: true };
  if (sinsal.천을귀인.present) return { type: '천을귀인', weightedStrength: 80, isBongi: false };
  if (sinsal.도화살.present) return { type: '도화살', weightedStrength: 60, isBongi: false };
  if (!johu.balanced && johu.차이 >= 4) {
    return { type: '조후편중', detail: johu.label, weightedStrength: 50, isBongi: false };
  }
  if (sinsal.문창귀인.present) return { type: '문창귀인', weightedStrength: 50, isBongi: false };
  if (sinsal.화개살.present) return { type: '화개살', weightedStrength: 50, isBongi: false };
  if (sinsal.역마살.present) return { type: '역마살', weightedStrength: 50, isBongi: false };
  return { type: '없음', weightedStrength: 0, isBongi: false };
}

// 일간 비유
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

// 만 나이
function calcAgeLabel(birthDate, refDate) {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ry, rm, rd] = refDate.split('-').map(Number);
  let years = ry - by;
  let months = rm - bm;
  if (rd < bd) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return `만 ${years}세 ${months}개월`;
}

// ─── 메인 변환 함수 ───
// SajuAnalysisCore + info → fixture
export function sajuCoreToFixture(core, info) {
  const ilgan = core.ilgan;
  const monthBranch = core.pillars.month.branch;
  const monthBranchElement = BRANCH_ELEM[monthBranch];
  const ilji = core.pillars.day.branch;

  const allBranches = [
    core.pillars.year.branch, core.pillars.month.branch,
    core.pillars.day.branch, core.pillars.hour?.branch,
  ].filter(Boolean);

  // 신살
  const sinsal = sinsalArrayToSet(core.sinsal, ilgan, allBranches, core.pillars.year.branch);

  // 6셋 통칭 강도
  const pillars = {
    year: core.pillars.year,
    month: core.pillars.month,
    day: core.pillars.day,
    hour: core.pillars.hour ?? { stem: '', branch: '' },
  };
  const factorStrength = {};
  for (const tong of ['인성', '식상', '관성', '재성', '비겁']) {
    factorStrength[tong] = calcFactorStrength(ilgan, pillars, tong, monthBranchElement);
    factorStrength[tong].isBongi = factorStrength[tong].weightedStrength >= 60;
  }
  factorStrength.조후 = calcJohu(core.elements);
  factorStrength.특수 = pickSpecialSlot(sinsal, factorStrength.조후);

  const dateOnlyPillars = {
    year: core.pillars.year,
    month: core.pillars.month,
    day: core.pillars.day,
    hour: { stem: '', branch: '' },
  };
  const dateOnlyBranches = [
    core.pillars.year.branch,
    core.pillars.month.branch,
    core.pillars.day.branch,
  ];
  const dateOnlyStems = [
    core.pillars.year.stem,
    core.pillars.month.stem,
    core.pillars.day.stem,
  ];
  const dateOnlyOtherStems = [
    core.pillars.year.stem,
    core.pillars.month.stem,
  ];
  const dateOnlyElements = calcElements(dateOnlyStems, dateOnlyBranches);
  const dateOnlyFactorStrength = {};
  for (const tong of ['인성', '식상', '관성', '재성', '비겁']) {
    dateOnlyFactorStrength[tong] = calcFactorStrength(ilgan, dateOnlyPillars, tong, monthBranchElement);
    dateOnlyFactorStrength[tong].isBongi = dateOnlyFactorStrength[tong].weightedStrength >= 60;
  }
  dateOnlyFactorStrength.조후 = calcJohu(dateOnlyElements);
  dateOnlyFactorStrength.특수 = pickSpecialSlot(sinsal, dateOnlyFactorStrength.조후);

  // 12운성
  const unseong = {
    year:  { branch: core.pillars.year.branch,  stage: UNSEONG_TABLE[ilgan]?.[core.pillars.year.branch] ?? '' },
    month: { branch: core.pillars.month.branch, stage: UNSEONG_TABLE[ilgan]?.[core.pillars.month.branch] ?? '' },
    day:   { branch: core.pillars.day.branch,   stage: UNSEONG_TABLE[ilgan]?.[core.pillars.day.branch] ?? '' },
    hour:  { branch: core.pillars.hour?.branch ?? '', stage: core.pillars.hour ? (UNSEONG_TABLE[ilgan]?.[core.pillars.hour.branch] ?? '') : '' },
  };
  const has12UnseongStrong = Object.values(unseong).some(u => UNSEONG_STRONG.includes(u.stage));
  const has12UnseongWeak = Object.values(unseong).some(u => UNSEONG_WEAK.includes(u.stage));
  const dateOnlyUnseong = {
    year:  unseong.year,
    month: unseong.month,
    day:   unseong.day,
    hour:  { branch: '', stage: '' },
  };
  const dateOnlyHas12UnseongStrong = Object.values(dateOnlyUnseong).some(u => UNSEONG_STRONG.includes(u.stage));
  const dateOnlyHas12UnseongWeak = Object.values(dateOnlyUnseong).some(u => UNSEONG_WEAK.includes(u.stage));

  // 합·충
  const branchInteractions = calcBranchInteractions(allBranches);
  const dateOnlyBranchInteractions = calcBranchInteractions(dateOnlyBranches);

  // 신강 (saju-core가 7단계로 줌)
  const shinkang = { score: 0, level: core.shinkang, detail: `saju-core 산출` };
  const dateOnlyShinkang = {
    score: 0,
    level: getDayMasterStrength(ilgan, monthBranch, dateOnlyBranches, dateOnlyOtherStems).level,
    detail: '연월일 기준 산출',
  };

  // 지지장간
  const jijangan = {};
  for (const k of ['year', 'month', 'day', 'hour']) {
    const br = core.pillars[k]?.branch;
    if (!br) { jijangan[k] = { branch: '', main: null, mid: null, sub: null }; continue; }
    const jj = JIJANGAN[br] ?? {};
    jijangan[k] = { branch: br, main: jj.main, mid: jj.mid, sub: jj.sub };
  }

  const refDate = info.testDate ?? new Date().toISOString().slice(0, 10);

  const base = {
    pillars,
    isHourUnknown: !!core.isHourUnknown || !core.pillars.hour,
    ilgan,
    ilju: `${ilgan}${ilji}`,
    yinyang: STEM_YY[ilgan],
    ilganElement: STEM_ELEM[ilgan],
    monthBranch, monthBranchElement,
    sipseong: {
      year:  core.sipseong.year,
      month: core.sipseong.month,
      day:   { stem: '본인', branch: core.sipseong.day.branch },
      hour:  core.sipseong.hour ?? { stem: '', branch: '' },
    },
    jijangan,
    factorStrength,
    sinsal,
    unseong,
    has12UnseongStrong, has12UnseongWeak,
    shinkang,
    branchInteractions,
    elements: core.elements,
    ilganBiyu: ILGAN_BIYU[ilgan],
  };

  base.dateOnlySaju = {
    ...base,
    pillars: dateOnlyPillars,
    isHourUnknown: true,
    factorStrength: dateOnlyFactorStrength,
    unseong: dateOnlyUnseong,
    has12UnseongStrong: dateOnlyHas12UnseongStrong,
    has12UnseongWeak: dateOnlyHas12UnseongWeak,
    shinkang: dateOnlyShinkang,
    branchInteractions: dateOnlyBranchInteractions,
    elements: dateOnlyElements,
  };

  if (info.role === 'child') {
    return {
      child: {
        name: info.name,
        gender: info.gender,
        birthDate: info.birthDate,
        age: calcAgeLabel(info.birthDate, refDate),
      },
      ...base,
    };
  } else {
    return {
      parent: { name: info.name, role: info.role },
      ...base,
    };
  }
}
