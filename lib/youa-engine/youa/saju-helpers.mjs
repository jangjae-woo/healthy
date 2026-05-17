// 사주 헬퍼 (Phase 7)
// saju-calculator.ts의 핵심 부분을 .mjs로 포팅
// 시작 폴더 캘리브레이션용 — saju-site 이관 시 saju-calculator.ts 사용
//
// 작성: 2026-05-17

export const STEMS = ['갑','을','병','정','무','기','경','신','임','계'];
export const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

export const STEM_ELEM = {
  갑:'목', 을:'목', 병:'화', 정:'화', 무:'토',
  기:'토', 경:'금', 신:'금', 임:'수', 계:'수',
};
export const STEM_YY = {
  갑:'양', 을:'음', 병:'양', 정:'음', 무:'양',
  기:'음', 경:'양', 신:'음', 임:'양', 계:'음',
};
export const BRANCH_ELEM = {
  자:'수', 축:'토', 인:'목', 묘:'목', 진:'토', 사:'화',
  오:'화', 미:'토', 신:'금', 유:'금', 술:'토', 해:'수',
};
export const BRANCH_YY = {
  자:'양', 축:'음', 인:'양', 묘:'음', 진:'양', 사:'음',
  오:'양', 미:'음', 신:'양', 유:'음', 술:'양', 해:'음',
};

const GENERATES = { 목:'화', 화:'토', 토:'금', 금:'수', 수:'목' };
const CONTROLS  = { 목:'토', 화:'금', 토:'수', 금:'목', 수:'화' };

// 지지장간 (본기·중기·여기) + 가중치
export const JIJANGAN = {
  자: [{ stem:'임', weight: 0.1, type: '여기' }, { stem:'계', weight: 0.9, type: '본기' }],
  축: [{ stem:'계', weight: 0.1, type: '여기' }, { stem:'신', weight: 0.2, type: '중기' }, { stem:'기', weight: 0.7, type: '본기' }],
  인: [{ stem:'무', weight: 0.1, type: '여기' }, { stem:'병', weight: 0.3, type: '중기' }, { stem:'갑', weight: 0.6, type: '본기' }],
  묘: [{ stem:'갑', weight: 0.1, type: '여기' }, { stem:'을', weight: 0.9, type: '본기' }],
  진: [{ stem:'을', weight: 0.1, type: '여기' }, { stem:'계', weight: 0.3, type: '중기' }, { stem:'무', weight: 0.6, type: '본기' }],
  사: [{ stem:'무', weight: 0.1, type: '여기' }, { stem:'경', weight: 0.3, type: '중기' }, { stem:'병', weight: 0.6, type: '본기' }],
  오: [{ stem:'병', weight: 0.1, type: '여기' }, { stem:'기', weight: 0.2, type: '중기' }, { stem:'정', weight: 0.7, type: '본기' }],
  미: [{ stem:'정', weight: 0.1, type: '여기' }, { stem:'을', weight: 0.3, type: '중기' }, { stem:'기', weight: 0.6, type: '본기' }],
  신: [{ stem:'무', weight: 0.1, type: '여기' }, { stem:'임', weight: 0.3, type: '중기' }, { stem:'경', weight: 0.6, type: '본기' }],
  유: [{ stem:'경', weight: 0.1, type: '여기' }, { stem:'신', weight: 0.9, type: '본기' }],
  술: [{ stem:'신', weight: 0.1, type: '여기' }, { stem:'정', weight: 0.3, type: '중기' }, { stem:'무', weight: 0.6, type: '본기' }],
  해: [{ stem:'무', weight: 0.1, type: '여기' }, { stem:'갑', weight: 0.3, type: '중기' }, { stem:'임', weight: 0.6, type: '본기' }],
};

// 십성 산출 (일간 vs 다른 천간/지지 본기)
export function getSipseong(ilgan, target) {
  const ie = STEM_ELEM[ilgan];
  const iy = STEM_YY[ilgan];
  const isBranch = BRANCHES.includes(target);
  // 지지면 본기 천간으로 변환
  const targetStem = isBranch ? JIJANGAN[target].find(j => j.type === '본기').stem : target;
  const te = STEM_ELEM[targetStem];
  const ty = STEM_YY[targetStem];
  const same = iy === ty;
  if (te === ie)              return same ? '비견' : '겁재';
  if (GENERATES[ie] === te)   return same ? '식신' : '상관';
  if (CONTROLS[ie]  === te)   return same ? '편재' : '정재';
  if (CONTROLS[te]  === ie)   return same ? '편관' : '정관';
  if (GENERATES[te] === ie)   return same ? '편인' : '정인';
  return '?';
}

// 십성 → 통칭 매핑
export function sipseongToTong(sipseong) {
  return {
    '비견': '비겁', '겁재': '비겁',
    '식신': '식상', '상관': '식상',
    '편재': '재성', '정재': '재성',
    '편관': '관성', '정관': '관성',
    '편인': '인성', '정인': '인성',
  }[sipseong];
}

// 신강 산출 (saju-calculator 그대로)
export function getShinkang(ilgan, monthBranch, allBranches, otherStems) {
  const ie = STEM_ELEM[ilgan];
  if (!ie) return { level: '중화', score: 0 };
  let score = 0;
  const monthElem = BRANCH_ELEM[monthBranch];
  if (monthElem === ie)                  score += 4;
  else if (GENERATES[monthElem] === ie)  score += 3;
  else if (GENERATES[ie] === monthElem)  score -= 2;
  else if (CONTROLS[ie] === monthElem)   score -= 2;
  else if (CONTROLS[monthElem] === ie)   score -= 3;
  for (const b of allBranches) {
    if (b === monthBranch) continue;
    const be = BRANCH_ELEM[b];
    if (be === ie)                  score += 2;
    else if (GENERATES[be] === ie)  score += 1.5;
    else if (GENERATES[ie] === be)  score -= 1;
    else if (CONTROLS[ie] === be)   score -= 1;
    else if (CONTROLS[be] === ie)   score -= 1.5;
  }
  for (const s of otherStems) {
    const se = STEM_ELEM[s];
    if (se === ie)                  score += 1.5;
    else if (GENERATES[se] === ie)  score += 1.5;
    else if (GENERATES[ie] === se)  score -= 1;
    else if (CONTROLS[ie] === se)   score -= 1;
    else if (CONTROLS[se] === ie)   score -= 1.5;
  }
  let level;
  if (score <= -8) level = '극약';
  else if (score <= -4) level = '태약';
  else if (score <= -1) level = '신약';
  else if (score <=  2) level = '중화';
  else if (score <=  5) level = '신강';
  else if (score <=  9) level = '태강';
  else level = '극왕';
  return { level, score: Math.round(score * 10) / 10 };
}

// 오행 분포 (단순화 — 천간·지지 본기·중기·여기 가중치)
export function calcElements(stems, branches) {
  const e = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const s of stems) {
    const el = STEM_ELEM[s];
    if (el) e[el] += 1.0;
  }
  for (const b of branches) {
    const jj = JIJANGAN[b] ?? [];
    for (const { stem, weight } of jj) {
      const el = STEM_ELEM[stem];
      if (el) e[el] += weight;
    }
  }
  return e;
}

// 신살 (양인·천을귀인·역마살·화개살·도화살·문창귀인)
const YANGIN = { 갑:'묘', 을:'인', 병:'오', 정:'사', 무:'오', 기:'사', 경:'유', 신:'신', 임:'자', 계:'해' };
const CHEONEUL = {
  갑:['축','미'], 무:['축','미'], 경:['축','미'],
  을:['자','신'], 기:['자','신'],
  병:['해','유'], 정:['해','유'],
  신:['인','오'],
  임:['묘','사'], 계:['묘','사'],
};
const MUNCHANG = { 갑:'사', 을:'오', 병:'신', 정:'유', 무:'신', 기:'유', 경:'해', 신:'자', 임:'인', 계:'묘' };
// 12신살 (년지 삼합 그룹 기준)
const GROUP_MAP = { 신:'신자진',자:'신자진',진:'신자진', 인:'인오술',오:'인오술',술:'인오술', 해:'해묘미',묘:'해묘미',미:'해묘미', 사:'사유축',유:'사유축',축:'사유축' };
const S12 = {
  신자진: { 역마: '인', 화개: '진', 도화: '유' },
  인오술: { 역마: '신', 화개: '술', 도화: '묘' },
  해묘미: { 역마: '사', 화개: '미', 도화: '자' },
  사유축: { 역마: '해', 화개: '축', 도화: '오' },
};

export function calcSinsal(ilgan, yearBranch, allBranches) {
  const result = {
    양인:    { present: false, branches: [], score50: 0 },
    천을귀인: { present: false, branches: [], score50: 0 },
    역마살:  { present: false, branches: [], score50: 0 },
    화개살:  { present: false, branches: [], score50: 0 },
    도화살:  { present: false, branches: [], score50: 0 },
    문창귀인: { present: false, branches: [], score50: 0 },
  };
  if (allBranches.includes(YANGIN[ilgan])) {
    result.양인 = { present: true, branches: [YANGIN[ilgan]], score50: 50 };
  }
  const cheoneuli = (CHEONEUL[ilgan] ?? []).filter(b => allBranches.includes(b));
  if (cheoneuli.length > 0) {
    result.천을귀인 = { present: true, branches: cheoneuli, score50: 50 };
  }
  if (allBranches.includes(MUNCHANG[ilgan])) {
    result.문창귀인 = { present: true, branches: [MUNCHANG[ilgan]], score50: 50 };
  }
  const group = GROUP_MAP[yearBranch];
  if (group) {
    const g = S12[group];
    if (allBranches.includes(g.역마)) result.역마살 = { present: true, branches: [g.역마], score50: 50 };
    if (allBranches.includes(g.화개)) result.화개살 = { present: true, branches: [g.화개], score50: 50 };
    if (allBranches.includes(g.도화)) result.도화살 = { present: true, branches: [g.도화], score50: 50 };
  }
  return result;
}

// 일지 합·충 (간단)
const YUKHAP = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']];
const YUKCHUNG = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];
export function calcBranchInteractions(dayBranch, otherBranches) {
  const all = [dayBranch, ...otherBranches];
  const hap = [], chung = [];
  for (const [a, b] of YUKHAP) {
    if (all.includes(a) && all.includes(b)) hap.push({ pair: [a, b], type: '육합' });
  }
  for (const [a, b] of YUKCHUNG) {
    if (all.includes(a) && all.includes(b)) chung.push({ pair: [a, b], type: '육충' });
  }
  return { 합: hap, 충: chung, 형: [], 해: [], 원진: [] };
}

// 12운성 (단순화 — 12장생 표 기반)
const UNSEONG_TABLE = {
  // 일간별 지지 → 운성 단계 (12장생 순환표)
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
export function calcUnseong(ilgan, branches) {
  const u = branches.map(b => ({ branch: b, stage: UNSEONG_TABLE[ilgan]?.[b] ?? '' }));
  return {
    list: u,
    hasStrong: u.some(x => UNSEONG_STRONG.includes(x.stage)),
    hasWeak: u.some(x => UNSEONG_WEAK.includes(x.stage)),
  };
}

// 조후 (간이) — 화·목·토 vs 금·수 차이
export function calcJohu(elements) {
  const warmth = elements.목 + elements.화;
  const cold = elements.금 + elements.수;
  const diff = Math.abs(warmth - cold);
  const balanced = diff <= 1;
  const direction = warmth > cold ? 'hot' : 'cold';
  const strength = balanced ? 95 : Math.max(0, 100 - diff * 15);
  return { 차이: Math.round(diff * 10) / 10, balanced, direction, weightedStrength: Math.round(strength), label: balanced ? '균형' : (direction === 'hot' ? '양기 우세' : '한기 우세') };
}
