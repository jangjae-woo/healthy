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
  allBranches: string[]
): string[] {
  const sinsal: string[] = [];
  const others = allBranches.filter(b => b !== yearBranch && b !== dayBranch && b);

  // 도화살: 연지 기준 삼합 그룹에서 도화 지지가 다른 기둥에 있으면
  for (const g of SAMHAP_GROUPS) {
    if (g.members.includes(yearBranch)) {
      if (others.includes(g.dohwa)) sinsal.push('도화살');
      if (others.includes(g.yeokma)) sinsal.push('역마살');
      break;
    }
  }

  // 천을귀인: 일간 기준 귀인 지지가 사주에 있으면
  const guiJis = CHEONEUL[ilgan] || [];
  if (allBranches.some(b => guiJis.includes(b))) {
    sinsal.push('천을귀인');
  }

  // 겁살: 연지 기준
  const GEOBSAL: Record<string, string> = {
    신:'사', 자:'사', 진:'사',
    인:'해', 오:'해', 술:'해',
    해:'신', 묘:'신', 미:'신',
    사:'인', 유:'인', 축:'인',
  };
  const geob = GEOBSAL[yearBranch];
  if (geob && allBranches.filter(b => b === geob).length > 0) {
    sinsal.push('겁살');
  }

  return [...new Set(sinsal)]; // 중복 제거
}

// ─── 오행 분포 계산 ───────────────────────────
export type Elements = { 목: number; 화: number; 토: number; 금: number; 수: number };

export function calcElements(
  stems: string[], branches: string[]
): Elements {
  const e: Elements = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const s of stems) {
    const el = STEM_ELEM[s as Stem];
    if (el && el in e) (e as Record<string,number>)[el]++;
  }
  for (const b of branches) {
    const el = BRANCH_ELEM[b as Branch];
    if (el && el in e) (e as Record<string,number>)[el]++;
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
export const SINSAL_INFO: Record<string, { icon: string; desc: string }> = {
  도화살: { icon: '🌸', desc: '매력이 넘쳐 이성에게 인기가 많고 연애 복이 있습니다.' },
  역마살: { icon: '🏇', desc: '활동력이 강하고 여행·이동·변화가 많은 삶을 살게 됩니다.' },
  천을귀인: { icon: '⭐', desc: '위기 때마다 귀인이 나타나 도움을 줍니다. 최고의 길성.' },
  겁살: { icon: '⚡', desc: '외부로부터 예기치 않은 손실이나 충격을 조심해야 합니다.' },
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
