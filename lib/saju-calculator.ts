// ─────────────────────────────────────────────
// 사주 계산 엔진 - 십성 / 대운 / 신살 / 오행
// ─────────────────────────────────────────────

export const STEMS = ['갑','을','병','정','무','기','경','신','임','계'] as const;
export const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const;
export type Stem   = typeof STEMS[number];
export type Branch = typeof BRANCHES[number];

// 천간 오행/음양
const STEM_ELEM: Record<Stem, string> = {
  갑:'목', 을:'목', 병:'화', 정:'화', 무:'토',
  기:'토', 경:'금', 신:'금', 임:'수', 계:'수',
};
const STEM_YY: Record<Stem, '양'|'음'> = {
  갑:'양', 을:'음', 병:'양', 정:'음', 무:'양',
  기:'음', 경:'양', 신:'음', 임:'양', 계:'음',
};

// 지지 오행/음양
const BRANCH_ELEM: Record<Branch, string> = {
  자:'수', 축:'토', 인:'목', 묘:'목', 진:'토', 사:'화',
  오:'화', 미:'토', 신:'금', 유:'금', 술:'토', 해:'수',
};
const BRANCH_YY: Record<Branch, '양'|'음'> = {
  자:'양', 축:'음', 인:'양', 묘:'음', 진:'양', 사:'음',
  오:'양', 미:'음', 신:'양', 유:'음', 술:'양', 해:'음',
};

// 오행 상생/상극
const GENERATES: Record<string,string> = { 목:'화', 화:'토', 토:'금', 금:'수', 수:'목' };
const CONTROLS:  Record<string,string> = { 목:'토', 화:'금', 토:'수', 금:'목', 수:'화' };

// 천간 한자
export const STEM_HANJA: Record<Stem, string> = {
  갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊',
  기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸',
};
export const BRANCH_HANJA: Record<Branch, string> = {
  자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳',
  오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥',
};

// ─── 십성 계산 ────────────────────────────────
export function getSipseong(ilgan: string, target: string, isBranch: boolean): string {
  const te = isBranch ? BRANCH_ELEM[target as Branch] : STEM_ELEM[target as Stem];
  const ty = isBranch ? BRANCH_YY[target as Branch]   : STEM_YY[target as Stem];
  const ie = STEM_ELEM[ilgan as Stem];
  const iy = STEM_YY[ilgan as Stem];
  if (!te || !ie) return '─';
  const same = iy === ty;
  if (te === ie)                        return same ? '비견' : '겁재';
  if (GENERATES[ie]  === te)            return same ? '식신' : '상관';
  if (CONTROLS[ie]   === te)            return same ? '편재' : '정재';
  if (CONTROLS[te]   === ie)            return same ? '편관' : '정관';
  if (GENERATES[te]  === ie)            return same ? '편인' : '정인';
  return '─';
}

// 십성 길흉 색상
export const SIPSEONG_COLOR: Record<string, string> = {
  비견:'#a78bfa', 겁재:'#f87171',
  식신:'#34d399', 상관:'#fb923c',
  편재:'#fbbf24', 정재:'#fbbf24',
  편관:'#f43f5e', 정관:'#60a5fa',
  편인:'#c084fc', 정인:'#818cf8',
};

// ─── 60갑자 인덱스 ────────────────────────────
function gIdx(stem: string, branch: string): number {
  const si = STEMS.indexOf(stem as Stem);
  const bi = BRANCHES.indexOf(branch as Branch);
  for (let n = 0; n < 60; n++) {
    if (n % 10 === si && n % 12 === bi) return n;
  }
  return 0;
}
function gAt(idx: number): { stem: string; branch: string } {
  const n = ((idx % 60) + 60) % 60;
  return { stem: STEMS[n % 10], branch: BRANCHES[n % 12] };
}

// ─── 절기 날짜 계산 (manseryeok 내부 공식) ────
const SOLAR_TERM_BASE = [
  5.4055, 20.12,   3.87,  18.73,  5.63, 20.646,
  4.81,  20.1,    5.52,  21.04,   5.678, 21.37,
  7.108, 22.83,   7.5,   23.13,   7.646, 23.042,
  8.318, 23.438,  7.438, 22.36,   7.18,  21.94,
];
// 절(節)만 사용: index 0,2,4,6,8,10,12,14,16,18,20,22
const JEL_INDICES = [0,2,4,6,8,10,12,14,16,18,20,22];

function getSolarTermDate(year: number, termIndex: number): Date {
  const yc = year % 100;
  const day = Math.floor(SOLAR_TERM_BASE[termIndex] + 0.2422 * yc) - Math.floor(yc / 4);
  const month = Math.floor(termIndex / 2);
  return new Date(year, month, day);
}

// 생년월일 기준 가장 가까운 절기 날짜
function getNearestJeol(birth: Date, forward: boolean): Date {
  const y = birth.getFullYear();
  const candidates: Date[] = [];
  for (const yr of [y - 1, y, y + 1]) {
    for (const ti of JEL_INDICES) {
      candidates.push(getSolarTermDate(yr, ti));
    }
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());

  if (forward) {
    for (const d of candidates) {
      if (d > birth) return d;
    }
    return candidates[candidates.length - 1];
  } else {
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i] < birth) return candidates[i];
    }
    return candidates[0];
  }
}

// ─── 연주 계산 (입춘 기준 연도 조정) ────────────
export function calcYearPillar(year: number, month: number, day: number): { stem: string; branch: string } {
  const date = new Date(year, month - 1, day);
  const lichun = getSolarTermDate(year, 2);
  const adjYear = date < lichun ? year - 1 : year;
  const idx  = ((adjYear - 4) % 10 + 10) % 10;
  const bidx = ((adjYear - 4) % 12 + 12) % 12;
  return { stem: STEMS[idx], branch: BRANCHES[bidx] };
}

// ─── 월주 계산 (라이브러리 절기 공식 버그 대체) ──
const TERM_TO_BRANCH: Record<number, string> = {
  0:'축', 2:'인', 4:'묘', 6:'진', 8:'사', 10:'오',
  12:'미', 14:'신', 16:'유', 18:'술', 20:'해', 22:'자',
};
const BRANCH_MONTH_STEP: Record<string, number> = {
  인:2, 묘:3, 진:4, 사:5, 오:6, 미:7, 신:8, 유:9, 술:10, 해:11, 자:12, 축:13,
};

export function calcMonthPillar(year: number, month: number, day: number): { stem: string; branch: string } {
  const date = new Date(year, month - 1, day);
  const lichun = getSolarTermDate(year, 2);
  const adjYear = date < lichun ? year - 1 : year;

  let termI = 0;
  for (let i = 0; i < 24; i += 2) {
    if (date >= getSolarTermDate(adjYear, i)) termI = i;
    else break;
  }
  // 입춘 이전 날짜: 해당 연도의 입춘 전 절기도 추가 체크 (예: 1월 소한)
  if (adjYear < year) {
    for (let i = 0; i < 24; i += 2) {
      const td = getSolarTermDate(year, i);
      if (td >= lichun) break;
      if (date >= td) termI = i;
    }
  }

  const branch = TERM_TO_BRANCH[termI];
  const yearStemIdx = ((adjYear - 4) % 10 + 10) % 10;
  const stemIdx = ((yearStemIdx % 5) * 2 + BRANCH_MONTH_STEP[branch]) % 10;
  return { stem: STEMS[stemIdx], branch };
}

// ─── 대운 계산 ────────────────────────────────
export interface DaeunCycle {
  age: number;
  stem: string;
  branch: string;
  ganji: string;
}

export interface DaeunResult {
  number: number;       // 대운수 (시작 나이)
  direction: '순행' | '역행';
  cycles: DaeunCycle[]; // 8개 대운
}

export function calcDaeun(
  birthYear: number, birthMonth: number, birthDay: number,
  yearStem: string, monthPillar: { stem: string; branch: string },
  gender: string
): DaeunResult {
  const isYangYear = STEM_YY[yearStem as Stem] === '양';
  const isMale = gender === '남';
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

  // 대운수 계산
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  const jeol = getNearestJeol(birthDate, isForward);
  const diffDays = Math.round(Math.abs(jeol.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const daeunNumber = Math.max(1, Math.round(diffDays / 3));

  // 대운 간지 생성 (8개)
  const baseIdx = gIdx(monthPillar.stem, monthPillar.branch);
  const cycles: DaeunCycle[] = [];
  for (let i = 1; i <= 8; i++) {
    const idx = isForward ? baseIdx + i : baseIdx - i;
    const { stem, branch } = gAt(idx);
    cycles.push({
      age: daeunNumber + (i - 1) * 10,
      stem, branch,
      ganji: stem + branch,
    });
  }

  return { number: daeunNumber, direction: isForward ? '순행' : '역행', cycles };
}

// ─── 신살 계산 ────────────────────────────────
// 삼합 그룹
const SAMHAP_GROUPS = [
  { members: ['신','자','진'], dohwa: '유', yeokma: '인' },
  { members: ['인','오','술'], dohwa: '묘', yeokma: '신' },
  { members: ['해','묘','미'], dohwa: '자', yeokma: '사' },
  { members: ['사','유','축'], dohwa: '오', yeokma: '해' },
];

// 천을귀인 지지 (일간 기준)
const CHEONEUL: Record<string, string[]> = {
  갑: ['축','미'], 무: ['축','미'], 경: ['축','미'],
  을: ['자','신'], 기: ['자','신'],
  병: ['해','유'], 정: ['해','유'],
  신: ['인','오'],
  임: ['묘','사'], 계: ['묘','사'],
};

export function calcSinsal(
  yearBranch: string, dayBranch: string, ilgan: string,
  allBranches: string[], allStems: string[] = [],
  monthBranch: string = '', dayStem: string = ''
): string[] {
  const sinsal: string[] = [];
  const hasB = (b: string) => allBranches.includes(b);
  const hasS = (s: string) => allStems.includes(s);

  // ── 귀인 (8) ──
  // 천을귀인 (일간 기준)
  if ((CHEONEUL[ilgan]||[]).some(b => hasB(b))) sinsal.push('천을귀인');

  // 천덕귀인 (월지 기준)
  const CHEONDEOK: Record<string, {type:'stem'|'branch', val:string}> = {
    인:{type:'stem',val:'정'}, 묘:{type:'branch',val:'신'}, 진:{type:'stem',val:'임'},
    사:{type:'stem',val:'신'}, 오:{type:'branch',val:'해'}, 미:{type:'stem',val:'갑'},
    신:{type:'stem',val:'계'}, 유:{type:'branch',val:'인'}, 술:{type:'stem',val:'병'},
    해:{type:'stem',val:'을'}, 자:{type:'branch',val:'사'}, 축:{type:'stem',val:'경'},
  };
  const cd = CHEONDEOK[monthBranch];
  if (cd && (cd.type==='stem' ? hasS(cd.val) : hasB(cd.val))) sinsal.push('천덕귀인');

  // 월덕귀인 (월지 삼합 → 양간)
  const WOLDEOK: Record<string,string> = {
    인:'병',오:'병',술:'병', 신:'임',자:'임',진:'임',
    해:'갑',묘:'갑',미:'갑', 사:'경',유:'경',축:'경',
  };
  if (WOLDEOK[monthBranch] && hasS(WOLDEOK[monthBranch])) sinsal.push('월덕귀인');

  // 태극귀인 (일간 기준)
  const TAEGEUK: Record<string,string[]> = {
    갑:['자','오'], 을:['자','오'], 병:['묘','유'], 정:['묘','유'],
    무:['진','술','축','미'], 기:['진','술','축','미'],
    경:['인','해'], 신:['인','해'], 임:['사','신'], 계:['사','신'],
  };
  if ((TAEGEUK[ilgan]||[]).some(b => hasB(b))) sinsal.push('태극귀인');

  // 문창귀인 (일간 기준)
  const MUNCHANG: Record<string,string> = {
    갑:'사', 을:'오', 병:'신', 정:'유', 무:'신',
    기:'유', 경:'해', 신:'자', 임:'인', 계:'묘',
  };
  if (MUNCHANG[ilgan] && hasB(MUNCHANG[ilgan])) sinsal.push('문창귀인');

  // 학당귀인 (일간 기준)
  const HAKDANG: Record<string,string> = {
    갑:'해', 을:'오', 병:'인', 정:'유', 무:'인',
    기:'유', 경:'사', 신:'자', 임:'신', 계:'묘',
  };
  if (HAKDANG[ilgan] && hasB(HAKDANG[ilgan])) sinsal.push('학당귀인');

  // 복성귀인 (일간 기준)
  const BOKSUNG: Record<string,string[]> = {
    갑:['인'], 을:['축','해'], 병:['자','술'], 정:['유'], 무:['신'],
    기:['미'], 경:['오'], 신:['사'], 임:['진'], 계:['묘'],
  };
  if ((BOKSUNG[ilgan]||[]).some(b => hasB(b))) sinsal.push('복성귀인');

  // 금여 (일간 기준)
  const GEUMYEO: Record<string,string> = {
    갑:'진', 을:'사', 병:'미', 정:'신', 무:'미',
    기:'신', 경:'술', 신:'해', 임:'축', 계:'인',
  };
  if (GEUMYEO[ilgan] && hasB(GEUMYEO[ilgan])) sinsal.push('금여');

  // ── 12신살 (년지 기준, 주요 8개) ──
  const S12: Record<string, Record<string,string>> = {
    신자진:{장성:'자',반안:'축',역마:'인',화개:'진',겁살:'사',재살:'오',망신:'해',도화:'유'},
    인오술:{장성:'오',반안:'미',역마:'신',화개:'술',겁살:'해',재살:'자',망신:'사',도화:'묘'},
    해묘미:{장성:'묘',반안:'진',역마:'사',화개:'미',겁살:'신',재살:'유',망신:'인',도화:'자'},
    사유축:{장성:'유',반안:'술',역마:'해',화개:'축',겁살:'인',재살:'묘',망신:'신',도화:'오'},
  };
  const groupMap: Record<string,string> = {
    신:'신자진',자:'신자진',진:'신자진', 인:'인오술',오:'인오술',술:'인오술',
    해:'해묘미',묘:'해묘미',미:'해묘미', 사:'사유축',유:'사유축',축:'사유축',
  };
  const others = allBranches.filter(b => b !== yearBranch && b);
  const g = S12[groupMap[yearBranch]];
  if (g) {
    if (others.includes(g.장성)) sinsal.push('장성살');
    if (others.includes(g.반안)) sinsal.push('반안살');
    if (others.includes(g.역마)) sinsal.push('역마살');
    if (others.includes(g.화개)) sinsal.push('화개살');
    if (others.includes(g.겁살)) sinsal.push('겁살');
    if (others.includes(g.재살)) sinsal.push('재살');
    if (others.includes(g.망신)) sinsal.push('망신살');
    if (others.includes(g.도화)) sinsal.push('도화살');
  }

  // ── 흉살 (7) ──
  // 양인살 (일간 기준)
  const YANGIN: Record<string,string> = {
    갑:'묘', 을:'인', 병:'오', 정:'사', 무:'오',
    기:'사', 경:'유', 신:'신', 임:'자', 계:'해',
  };
  if (YANGIN[ilgan] && hasB(YANGIN[ilgan])) sinsal.push('양인살');

  // 괴강살 (일주 기준)
  const GOEGANG = ['경진','경술','임진','임술','무술'];
  if (GOEGANG.includes(dayStem + dayBranch)) sinsal.push('괴강살');

  // 백호살 (모든 기둥 검사 — 간단히 일주만)
  const BAEKHO = ['갑진','을미','병술','정축','무진','임술','계축'];
  if (BAEKHO.includes(dayStem + dayBranch)) sinsal.push('백호살');

  // 현침살 (갑·신·묘·오 중 2개 이상)
  const HYEONCHIM_S = ['갑','신'];
  const HYEONCHIM_B = ['묘','오','신'];
  const hcCount = allStems.filter(s => HYEONCHIM_S.includes(s)).length
                + allBranches.filter(b => HYEONCHIM_B.includes(b)).length;
  if (hcCount >= 2) sinsal.push('현침살');

  // 탕화살 (인·오·축 중 2개 이상)
  const TANGHWA = ['인','오','축'];
  if (allBranches.filter(b => TANGHWA.includes(b)).length >= 2) sinsal.push('탕화살');

  // 원진살 (일지와 타 지지 쌍)
  const WONJIN: Record<string,string> = {
    자:'미', 축:'오', 인:'유', 묘:'신', 진:'해', 사:'술',
    미:'자', 오:'축', 유:'인', 신:'묘', 해:'진', 술:'사',
  };
  const dayOthers = allBranches.filter(b => b !== dayBranch && b);
  if (WONJIN[dayBranch] && dayOthers.includes(WONJIN[dayBranch])) sinsal.push('원진살');

  // 귀문관살 (일지와 타 지지 쌍)
  const GWIMUN: Record<string,string> = {
    자:'유', 축:'오', 인:'미', 묘:'신', 진:'해', 사:'술',
    유:'자', 오:'축', 미:'인', 신:'묘', 해:'진', 술:'사',
  };
  if (GWIMUN[dayBranch] && dayOthers.includes(GWIMUN[dayBranch])) sinsal.push('귀문관살');

  // ── 고독/특수 (4) ──
  // 고신살 (년지 기준)
  const GOSIN: Record<string,string> = {
    해:'인',자:'인',축:'인', 인:'사',묘:'사',진:'사',
    사:'신',오:'신',미:'신', 신:'해',유:'해',술:'해',
  };
  if (GOSIN[yearBranch] && others.includes(GOSIN[yearBranch])) sinsal.push('고신살');

  // 과숙살 (년지 기준)
  const GWASUK: Record<string,string> = {
    해:'술',자:'술',축:'술', 인:'축',묘:'축',진:'축',
    사:'진',오:'진',미:'진', 신:'미',유:'미',술:'미',
  };
  if (GWASUK[yearBranch] && others.includes(GWASUK[yearBranch])) sinsal.push('과숙살');

  // 홍염살 (일간 기준)
  const HONGYEOM: Record<string,string> = {
    갑:'오', 을:'오', 병:'인', 정:'미', 무:'진',
    기:'진', 경:'술', 신:'유', 임:'신', 계:'신',
  };
  if (HONGYEOM[ilgan] && hasB(HONGYEOM[ilgan])) sinsal.push('홍염살');

  // 공망 (일주 기준, 60갑자 순)
  const GM: Record<string,string[]> = {
    갑자:['술','해'],을축:['술','해'],병인:['술','해'],정묘:['술','해'],무진:['술','해'],
    기사:['술','해'],경오:['술','해'],신미:['술','해'],임신:['술','해'],계유:['술','해'],
    갑술:['신','유'],을해:['신','유'],병자:['신','유'],정축:['신','유'],무인:['신','유'],
    기묘:['신','유'],경진:['신','유'],신사:['신','유'],임오:['신','유'],계미:['신','유'],
    갑신:['오','미'],을유:['오','미'],병술:['오','미'],정해:['오','미'],무자:['오','미'],
    기축:['오','미'],경인:['오','미'],신묘:['오','미'],임진:['오','미'],계사:['오','미'],
    갑오:['진','사'],을미:['진','사'],병신:['진','사'],정유:['진','사'],무술:['진','사'],
    기해:['진','사'],경자:['진','사'],신축:['진','사'],임인:['진','사'],계묘:['진','사'],
    갑진:['인','묘'],을사:['인','묘'],병오:['인','묘'],정미:['인','묘'],무신:['인','묘'],
    기유:['인','묘'],경술:['인','묘'],신해:['인','묘'],임자:['인','묘'],계축:['인','묘'],
    갑인:['자','축'],을묘:['자','축'],병진:['자','축'],정사:['자','축'],무오:['자','축'],
    기미:['자','축'],경신:['자','축'],신유:['자','축'],임술:['자','축'],계해:['자','축'],
  };
  const gmB = GM[dayStem + dayBranch];
  if (gmB && gmB.some(b => hasB(b))) sinsal.push('공망');

  return [...new Set(sinsal)];
}

// ─── 오행 분포 계산 ───────────────────────────
export type Elements = { 목: number; 화: number; 토: number; 금: number; 수: number };

const JIJANGAN: Record<Branch, Array<{stem: Stem; weight: number}>> = {
  자: [{stem:'임', weight:0.1}, {stem:'계', weight:0.9}],
  축: [{stem:'계', weight:0.1}, {stem:'신', weight:0.2}, {stem:'기', weight:0.7}],
  인: [{stem:'무', weight:0.1}, {stem:'병', weight:0.3}, {stem:'갑', weight:0.6}],
  묘: [{stem:'갑', weight:0.1}, {stem:'을', weight:0.9}],
  진: [{stem:'을', weight:0.1}, {stem:'계', weight:0.3}, {stem:'무', weight:0.6}],
  사: [{stem:'무', weight:0.1}, {stem:'경', weight:0.3}, {stem:'병', weight:0.6}],
  오: [{stem:'병', weight:0.1}, {stem:'기', weight:0.2}, {stem:'정', weight:0.7}],
  미: [{stem:'정', weight:0.1}, {stem:'을', weight:0.3}, {stem:'기', weight:0.6}],
  신: [{stem:'무', weight:0.1}, {stem:'임', weight:0.3}, {stem:'경', weight:0.6}],
  유: [{stem:'경', weight:0.1}, {stem:'신', weight:0.9}],
  술: [{stem:'신', weight:0.1}, {stem:'정', weight:0.3}, {stem:'무', weight:0.6}],
  해: [{stem:'무', weight:0.1}, {stem:'갑', weight:0.3}, {stem:'임', weight:0.6}],
};

// ─── 합충 상수 (자평명리학파) ──────────────────
const CHEONGAN_HAP: Array<{pair: [Stem, Stem]; hwa: string}> = [
  {pair: ['갑','기'], hwa: '토'},
  {pair: ['을','경'], hwa: '금'},
  {pair: ['병','신'], hwa: '수'},
  {pair: ['정','임'], hwa: '목'},
  {pair: ['무','계'], hwa: '화'},
];
const JIJI_SAMHAP: Array<{members: [Branch, Branch, Branch]; hwa: string}> = [
  {members: ['신','자','진'], hwa: '수'},
  {members: ['해','묘','미'], hwa: '목'},
  {members: ['인','오','술'], hwa: '화'},
  {members: ['사','유','축'], hwa: '금'},
];
const JIJI_YUKHAP: Array<{pair: [Branch, Branch]; hwa: string}> = [
  {pair: ['자','축'], hwa: '토'},
  {pair: ['인','해'], hwa: '목'},
  {pair: ['묘','술'], hwa: '화'},
  {pair: ['진','유'], hwa: '금'},
  {pair: ['사','신'], hwa: '수'},
  {pair: ['오','미'], hwa: '화'},
];
const JIJI_YUKCHUNG: Array<[Branch, Branch]> = [
  ['자','오'], ['축','미'], ['인','신'], ['묘','유'], ['진','술'], ['사','해'],
];

export function calcElements(stems: string[], branches: string[]): Elements {
  const e: Elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const add = (el: string, v: number) => { if (el in e) (e as Record<string,number>)[el] += v; };

  // ── 1. 천간합 (자평명리학파: 일간 참여 합 + 월령득시 → 화, 나머지는 합이불화 -30%) ──
  const stemMult: number[] = stems.map(() => 1.0);
  const stemHwa: boolean[] = stems.map(() => false);
  const moonElem = branches.length >= 2 ? BRANCH_ELEM[branches[1] as Branch] : '';

  for (const {pair, hwa} of CHEONGAN_HAP) {
    const ia = stems.indexOf(pair[0]);
    const ib = stems.indexOf(pair[1]);
    if (ia === -1 || ib === -1) continue;
    const ilganParticipates = ia === 2 || ib === 2; // 일간(day stem, index 2)이 합에 참여
    if (ilganParticipates && moonElem === hwa) {
      stemHwa[ia] = true;
      stemHwa[ib] = true;
      add(hwa, 2.0);
    } else {
      stemMult[ia] *= 0.7;
      stemMult[ib] *= 0.7;
    }
  }
  for (let i = 0; i < stems.length; i++) {
    if (stemHwa[i]) continue;
    const el = STEM_ELEM[stems[i] as Stem];
    if (el) add(el, stemMult[i]);
  }

  // ── 2. 지지육충: 충 발생 지지 -30% ──
  const branchMult: number[] = branches.map(() => 1.0);
  for (const [a, b] of JIJI_YUKCHUNG) {
    const ia = branches.indexOf(a);
    const ib = branches.indexOf(b);
    if (ia !== -1 && ib !== -1) {
      branchMult[ia] *= 0.7;
      branchMult[ib] *= 0.7;
    }
  }

  // ── 3. 지지삼합: 완전삼합 → 화 오행 완전 전환, 반합 → 수 +0.5 보너스 ──
  const branchHwa: boolean[] = branches.map(() => false);
  for (const {members, hwa} of JIJI_SAMHAP) {
    const indices = members.map(m => branches.indexOf(m)).filter(i => i !== -1);
    if (indices.length === 3) {
      let total = 0;
      for (const i of indices) {
        branchHwa[i] = true;
        const jj = JIJANGAN[branches[i] as Branch];
        if (jj) for (const {weight} of jj) total += weight * branchMult[i];
      }
      add(hwa, total);
    } else if (indices.length === 2) {
      add(hwa, 0.5);
    }
  }

  // ── 4. 지지육합: 삼합 우선, 두 지지의 30% → 화 오행 전환 ──
  const branchYukHwaEl: (string|null)[] = branches.map(() => null);
  for (const {pair, hwa} of JIJI_YUKHAP) {
    const ia = branches.indexOf(pair[0]);
    const ib = branches.indexOf(pair[1]);
    if (ia === -1 || ib === -1) continue;
    if (branchHwa[ia] || branchHwa[ib]) continue;
    branchYukHwaEl[ia] = hwa;
    branchYukHwaEl[ib] = hwa;
  }

  // ── 5. 기본 지장간 계산 ──
  for (let i = 0; i < branches.length; i++) {
    if (branchHwa[i]) continue;
    const jj = JIJANGAN[branches[i] as Branch];
    if (!jj) continue;
    const yukHwa = branchYukHwaEl[i];
    for (const {stem, weight} of jj) {
      const el = STEM_ELEM[stem];
      if (!el) continue;
      const w = weight * branchMult[i];
      if (yukHwa) {
        add(el, w * 0.7);
        add(yukHwa, w * 0.3);
      } else {
        add(el, w);
      }
    }
  }

  for (const k of Object.keys(e) as (keyof Elements)[]) {
    if (e[k] < 0) e[k] = 0;
  }
  return e;
}

// 용신 추천 (오행 부족한 것 중 일간을 돕는 오행)
export function getYongsin(ilgan: string, elements: Elements): string {
  const ie = STEM_ELEM[ilgan as Stem];
  // 내 오행을 생해주는 오행과 같은 오행을 찾음
  const helpful = [
    ie,                    // 비겁 (자신과 같은 오행)
    Object.keys(GENERATES).find(k => GENERATES[k] === ie) ?? '', // 인성 (나를 생하는)
  ].filter(Boolean);

  // 오행 중 가장 부족한 것이 helpful에 해당하면 그것이 용신
  const sorted = Object.entries(elements).sort((a,b) => a[1]-b[1]);
  for (const [el] of sorted) {
    if (helpful.includes(el)) return el;
  }
  return helpful[0] ?? ie;
}

// ─── 신살 이름/설명 ────────────────────────────
export const SINSAL_INFO: Record<string, { icon: string; desc: string; category: string }> = {
  // 귀인 (吉星)
  천을귀인: { icon: '⭐', desc: '위기 때마다 귀인이 나타나 도움을 줍니다. 최고의 길성.', category: '귀인' },
  천덕귀인: { icon: '☀️', desc: '하늘이 내린 덕으로 평생 안정과 복을 누립니다.', category: '귀인' },
  월덕귀인: { icon: '🌙', desc: '어머니의 덕과 가정의 평화를 상징합니다.', category: '귀인' },
  태극귀인: { icon: '☯️', desc: '영적 감각과 신비로운 기운이 있습니다.', category: '귀인' },
  문창귀인: { icon: '📚', desc: '학문·시험·예술에 재능이 뛰어납니다.', category: '귀인' },
  학당귀인: { icon: '🎓', desc: '공부와 지혜가 깊어 교육·연구에 적합합니다.', category: '귀인' },
  복성귀인: { icon: '✨', desc: '평생 복과 행운이 따르는 길성입니다.', category: '귀인' },
  금여:    { icon: '💰', desc: '재물과 배우자 복, 풍족한 삶을 상징합니다.', category: '귀인' },
  // 12신살 (주요 8개)
  장성살: { icon: '⚔️', desc: '리더십과 권위, 큰 조직을 이끌 기운이 있습니다.', category: '12신살' },
  반안살: { icon: '🏇', desc: '명예와 출세, 말년 복이 있는 길성입니다.', category: '12신살' },
  역마살: { icon: '🏇', desc: '활동력이 강하고 여행·이동·변화가 많습니다.', category: '12신살' },
  화개살: { icon: '🎨', desc: '예술·종교·학문에 깊은 인연이 있습니다.', category: '12신살' },
  도화살: { icon: '🌸', desc: '매력과 인기, 이성운이 뛰어납니다.', category: '12신살' },
  겁살:   { icon: '⚡', desc: '외부로부터의 예기치 않은 손실이나 충격을 조심하세요.', category: '12신살' },
  재살:   { icon: '🔥', desc: '관재·재앙이 따를 수 있어 신중한 처신이 필요합니다.', category: '12신살' },
  망신살: { icon: '💔', desc: '실수로 인한 망신·손실을 조심해야 합니다.', category: '12신살' },
  // 흉살
  양인살:   { icon: '🗡️', desc: '강한 추진력과 기운. 군경·의료 분야에 적합합니다.', category: '흉살' },
  괴강살:   { icon: '⚡', desc: '강인한 의지와 극단적 성향. 성공 아니면 실패.', category: '흉살' },
  백호살:   { icon: '🐯', desc: '사고·수술·혈광을 각별히 조심해야 합니다.', category: '흉살' },
  현침살:   { icon: '📍', desc: '날카로운 말과 손재주. 의료·침술업에 인연이 있습니다.', category: '흉살' },
  탕화살:   { icon: '🔥', desc: '화상·사고·충동을 조심해야 합니다.', category: '흉살' },
  원진살:   { icon: '😤', desc: '원망·갈등을 쉽게 쌓음. 인간관계에 주의가 필요합니다.', category: '흉살' },
  귀문관살: { icon: '👁️', desc: '예민하고 영적 감각이 뛰어나나 신경쇠약을 조심하세요.', category: '흉살' },
  // 고독/특수
  고신살:   { icon: '🌑', desc: '고독한 기운. 배우자 인연이 늦게 오는 경향.', category: '특수' },
  과숙살:   { icon: '🌑', desc: '고독한 기운. 여성에게 더 강하게 작용합니다.', category: '특수' },
  홍염살:   { icon: '🌹', desc: '이성을 끄는 매력과 강한 연애운이 있습니다.', category: '특수' },
  공망:     { icon: '⭕', desc: '해당 방면의 성취가 허무하거나 공허해지는 자리.', category: '특수' },
};

// ─── 전체 분석 타입 ────────────────────────────
export interface SajuAnalysis {
  pillars: {
    year:  { stem: string; branch: string };
    month: { stem: string; branch: string };
    day:   { stem: string; branch: string };
    hour:  { stem: string; branch: string } | null;
  };
  ilgan: string;
  sipseong: {
    year:  { stem: string; branch: string };
    month: { stem: string; branch: string };
    day:   { stem: string; branch: string };
    hour:  { stem: string; branch: string } | null;
  };
  elements: Elements;
  yongsin: string;
  daeun: DaeunResult;
  sinsal: string[];
  isHourUnknown: boolean;
}
