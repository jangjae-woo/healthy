import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";

// Vercel 함수 최대 실행 시간 — Hobby plan 한도(60초). 처방 1 (차트 결과 직접 주입) 으로 프롬프트 압축돼 60초 내 응답 가능 예상.
// 만약 mom·dad 섹션 다시 잘리면 Pro plan 업그레이드 후 300 으로 복구.
export const maxDuration = 60;
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin, calcMonthPillar, calcYearPillar,
  calcCompatibility,
  STEM_HANJA, BRANCH_HANJA, SINSAL_INFO,
  type SajuAnalysis, type CompatibilityResult,
} from "@/lib/saju-calculator";
import { adjustForParentChild } from "@/lib/parent-child-compat";
import { pickFamilySajaSeongeo, pickFamilyTrioSaja, inferGiftCard, inferSynergyCards, type FamilySajaSeongeo } from "@/lib/parent-child-traits";
import {
  infer8Intelligences,
  inferJobRadar,
  inferThinkingType,
  inferFriendStyle,
  inferFriendDistance,
  inferDisciplineChannels,
  inferDangerCards,
  getSipseongCounts,
  inferElementCompare,
  inferFlowGiven,
} from "@/lib/parent-child-charts";
import { pickSajaSeongeo, type SajaSeongeoResult } from "@/lib/matching-images";
import { buildOpenerSeed, describeChildSipseongStrength, classifyElementDistribution, classifySipseongDistribution } from "@/lib/opener-seed";
import { buildPrescriptionSet, pickWeakestElement } from "@/lib/element-prescription";
import { classifyAgeStage, ageStageKor, ageToneGuide, dailyDigitalLimit } from "@/lib/age-stage";
import { buildSipseongDeepContext, buildSinsalContext, buildMeetClashContext, buildYongsinContext, buildSixFactorBodyContext } from "@/lib/heart-context";
import { buildChildSeed, buildChildSeedPromptBlock } from "@/lib/child-seed";

const GEMINI_MODEL = "gemini-2.5-flash";

const HOUR_MAP: Record<string, number> = {
  "시간 모름": 12, "모름": 12,
  "자시 (23:30~01:29)": 0,  "축시 (01:30~03:29)": 2,  "인시 (03:30~05:29)": 4,
  "묘시 (05:30~07:29)": 6,  "진시 (07:30~09:29)": 8,  "사시 (09:30~11:29)": 10,
  "오시 (11:30~13:29)": 12, "미시 (13:30~15:29)": 14, "신시 (15:30~17:29)": 16,
  "유시 (17:30~19:29)": 18, "술시 (19:30~21:29)": 20, "해시 (21:30~23:29)": 22,
};

const ELEM_DESC: Record<string, string> = {
  목:'木(목)-성장·창의', 화:'火(화)-열정·표현', 토:'土(토)-신뢰·안정',
  금:'金(금)-의리·결단', 수:'水(수)-지혜·직관',
};
const SS_DESC: Record<string, string> = {
  비견:'비견-형제·독립', 겁재:'겁재-경쟁·재물변동',
  식신:'식신-재능·먹을복', 상관:'상관-예술·자유',
  편재:'편재-사업·투자', 정재:'정재-고정수입·성실',
  편관:'편관-권력·도전', 정관:'정관-명예·안정직장',
  편인:'편인-특수기술·고독', 정인:'정인-학문·자격증',
};

// ─── 사주 계산 ────────────────────────────────
function computeFullSaju(
  year: number, month: number, day: number,
  hourStr: string, isLunar: boolean, gender: string
): SajuAnalysis | null {
  try {
    const hour = HOUR_MAP[hourStr] ?? 12;
    const isHourUnknown = hourStr === "모름";
    const p = calculateFourPillars({ year, month, day, hour, minute: 0, isLunar });

    const correctedYear  = calcYearPillar(year, month, day);
    const correctedMonth = calcMonthPillar(year, month, day);
    const pillars: SajuAnalysis['pillars'] = {
      year:  correctedYear,
      month: correctedMonth,
      day:   { stem: p.day.heavenlyStem,   branch: p.day.earthlyBranch },
      hour:  isHourUnknown ? null : { stem: p.hour.heavenlyStem, branch: p.hour.earthlyBranch },
    };
    const ilgan = pillars.day.stem;
    const ss = (stem: string, branch: string) => ({
      stem:   getSipseong(ilgan, stem,   false),
      branch: getSipseong(ilgan, branch, true),
    });
    const sipseong: SajuAnalysis['sipseong'] = {
      year:  ss(pillars.year.stem,  pillars.year.branch),
      month: ss(pillars.month.stem, pillars.month.branch),
      day:   ss(pillars.day.stem,   pillars.day.branch),
      hour:  isHourUnknown || !pillars.hour ? null : ss(pillars.hour.stem, pillars.hour.branch),
    };
    const allStems    = [pillars.year.stem, pillars.month.stem, pillars.day.stem,    ...(pillars.hour ? [pillars.hour.stem]   : [])];
    const allBranches = [pillars.year.branch,pillars.month.branch,pillars.day.branch,...(pillars.hour ? [pillars.hour.branch] : [])];
    const elements = calcElements(allStems, allBranches);
    const yongsin  = getYongsin(ilgan, elements);
    const daeun    = calcDaeun(year, month, day, pillars.year.stem, pillars.month, gender);
    const sinsal   = calcSinsal(
      pillars.year.branch, pillars.day.branch, ilgan,
      allBranches, allStems,
      pillars.month.branch, pillars.day.stem
    );

    return { pillars, ilgan, sipseong, elements, yongsin, daeun, sinsal, isHourUnknown };
  } catch (e) {
    console.error('사주 계산 오류:', e);
    return null;
  }
}

// ─── 합·충·형 분석 ────────────────────────────
function buildInteractions(stems: string[], branches: string[]): string {
  const r: string[] = [];

  // 천간합
  const STEM_HAP: [string,string,string][] = [
    ['갑','기','土화'],['을','경','金화'],['병','신','水화'],
    ['정','임','木화'],['무','계','火화'],
  ];
  for (const [a,b,res] of STEM_HAP)
    if (stems.includes(a)&&stems.includes(b)) r.push(`천간 ${a}${b}합(${res})`);

  // 지지충
  const CHUNG: [string,string][] = [
    ['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해'],
  ];
  for (const [a,b] of CHUNG)
    if (branches.includes(a)&&branches.includes(b)) r.push(`${a}${b}충(沖)`);

  // 지지합
  const BRANCH_HAP: [string,string][] = [
    ['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미'],
  ];
  for (const [a,b] of BRANCH_HAP)
    if (branches.includes(a)&&branches.includes(b)) r.push(`${a}${b}합(合)`);

  // 삼합 (2개 이상이면 반합)
  const SAMHAP: [string,string,string,string][] = [
    ['해','묘','미','木국'],['인','오','술','火국'],
    ['사','유','축','金국'],['신','자','진','水국'],
  ];
  for (const [a,b,c,name] of SAMHAP) {
    const hit = [a,b,c].filter(x=>branches.includes(x));
    if (hit.length===3) r.push(`삼합 ${name} 완성(${hit.join('')})`);
    else if (hit.length===2) r.push(`반합 ${name}(${hit.join('')})`);
  }

  // 형
  if (['인','사','신'].filter(x=>branches.includes(x)).length>=2)
    r.push(`인사신 삼형(${['인','사','신'].filter(x=>branches.includes(x)).join('')})`);
  if (['축','술','미'].filter(x=>branches.includes(x)).length>=2)
    r.push(`축술미 삼형(${['축','술','미'].filter(x=>branches.includes(x)).join('')})`);
  if (branches.includes('자')&&branches.includes('묘')) r.push('자묘 상형');

  return r.length>0 ? `【합·충·형】${r.join(' / ')}` : '';
}

// ─── 사주 데이터 → 프롬프트 컨텍스트 ─────────
function buildCtx(s: SajuAnalysis, name: string): string {
  const h = (st: string) => STEM_HANJA[st as keyof typeof STEM_HANJA] ?? st;
  const b = (br: string) => BRANCH_HANJA[br as keyof typeof BRANCH_HANJA] ?? br;
  const pp = (p: {stem:string;branch:string}|null) => p ? `${h(p.stem)}${b(p.branch)}(${p.stem}${p.branch})` : '미상';

  const totalElem = (Object.values(s.elements) as number[]).reduce((a,b)=>a+b,0) || 1;
  const elemSummary = (Object.entries(s.elements) as [string,number][])
    .sort((a,b)=>b[1]-a[1])
    .map(([el,n])=>`${ELEM_DESC[el]} ${Math.round(n/totalElem*100)}%`)
    .join(' / ');
  const strong = (Object.entries(s.elements) as [string,number][])
    .filter(([,n])=>n/totalElem>=0.22).map(([el])=>el).join('/') || '없음';
  const weak   = (Object.entries(s.elements) as [string,number][])
    .filter(([,n])=>n/totalElem<0.10).map(([el])=>el).join('/') || '없음';

  const daeunStr = s.daeun.cycles.slice(0,6)
    .map(c=>`${c.age}세 ${h(c.stem)}${b(c.branch)}운`).join(' → ');

  const ssRow = (label: string, p:{stem:string;branch:string}|null) =>
    p ? `${label}: 천간 ${p.stem}(${SS_DESC[p.stem]?.split('-')[0]??p.stem}) / 지지 ${p.branch}(${SS_DESC[p.branch]?.split('-')[0]??p.branch})` : '';

  const allStems2    = [s.pillars.year.stem, s.pillars.month.stem, s.pillars.day.stem, ...(s.pillars.hour?[s.pillars.hour.stem]:[])];
  const allBranches2 = [s.pillars.year.branch, s.pillars.month.branch, s.pillars.day.branch, ...(s.pillars.hour?[s.pillars.hour.branch]:[])];
  const interactions = buildInteractions(allStems2, allBranches2);

  return `
【사주원국】연주:${pp(s.pillars.year)} 월주:${pp(s.pillars.month)} 일주:${pp(s.pillars.day)} 시주:${pp(s.pillars.hour)}
【일간(${name}님 본인)】${s.ilgan}(${h(s.ilgan)}) = ${
  s.ilgan==='갑'?'양목·거목·추진력':s.ilgan==='을'?'음목·초목·유연함':
  s.ilgan==='병'?'양화·태양·활동적':s.ilgan==='정'?'음화·촛불·헌신적':
  s.ilgan==='무'?'양토·산·포용력':s.ilgan==='기'?'음토·논밭·꼼꼼함':
  s.ilgan==='경'?'양금·강철·강직함':s.ilgan==='신'?'음금·보석·예리함':
  s.ilgan==='임'?'양수·바다·지혜':  '음수·샘물·감수성'}
【십성 구조】
${ssRow('연주',s.sipseong.year)}
${ssRow('월주',s.sipseong.month)}
일지(배우자궁): ${s.sipseong.day.branch}(${SS_DESC[s.sipseong.day.branch]??s.sipseong.day.branch})
${s.sipseong.hour?ssRow('시주',s.sipseong.hour):'시주: 미상'}
【오행 분포】${elemSummary}
강한 오행: ${strong} / 부족한 오행: ${weak} / 용신: ${s.yongsin}(${ELEM_DESC[s.yongsin]})
【대운(${s.daeun.direction}·${s.daeun.number}세 시작)】${daeunStr}
【신살】${s.sinsal.join(', ') || '없음'}
${interactions}`.trim();
}

// ─── 섹션별 프롬프트 ──────────────────────────
type PromptFn = (d: Record<string,string>, ctx: string, s: SajuAnalysis|null) => string;

const SECTION_PROMPTS: Record<string, PromptFn[]> = {

  saju: [
    // 섹션 1: 사주 기본 분석
    (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**사주원국 분석**
일주(일간+일지)를 중심으로 전체 사주 구조를 분석하세요.
- 일간의 강약: 월지 기준 득령/실령 여부, 조력 십성이 얼마나 있는지
- 전체 오행 구조에서 이 일간이 처한 상황 — 압박받는지, 설기되는지, 안정적인지
- 가장 두드러진 십성 1~2개가 이 사람의 삶에서 어떻게 나타나는지

**오행 분석**
- 강한 오행: 실제 삶에서 어떻게 과잉으로 나타나는지
- 부족한 오행: 어떤 결핍감 또는 어려움으로 나타나는지
- 용신 오행: 왜 이것이 용신인지 논리적 근거, 용신 운이 오면 어떤 변화가 오는지

**타고난 성격과 기질**
- 누구에게나 해당하는 표현 금지. 반드시 구체적 간지 근거 포함
- 장점: 이 십성 구조에서 나오는 차별화된 강점
- 주의점: 이 사주 구조가 만드는 반복적 함정

한국어 경어체.`,

    // 섹션 2: 운세 흐름
    (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**대운 흐름**
- 현재 대운의 간지와 그 의미 — 일간에게 생인지 극인지
- 지금 시기의 테마: 성장기인지, 안정기인지, 전환기인지
- 다음 대운이 언제 시작되고 어떻게 달라지는지
- 대운 중 주목할 나이대를 최소 2개 구체적으로

**2026년 세운**
- 병오년(丙午) 천간 병(丙)이 일간과 어떤 관계인지 (생·극·합·충 명시)
- 지지 오(午)가 월지·일지와 어떤 작용인지 (합·충·형 명시)
- 이 상호작용이 2026년 재물·직업·관계에 어떻게 나타나는지
- 2026년 상반기와 하반기 흐름 구분

**재물운**
- 재성 위치와 강약 먼저 명시
- 이 사주 구조에서 돈이 들어오는 방식과 나가는 방식
- 재물운이 좋아지는 조건 (어떤 운이 와야 하는지)

한국어 경어체.`,

    // 섹션 3: 인연 & 미래
    (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**연애·결혼운**
- 일지(배우자궁) 십성으로 보는 배우자 유형 구체적으로
- 연애 패턴: 어떻게 시작되고 어떻게 끝나는 경향이 있는지
- 결혼 인연의 기운이 흐르는 시기: 부드럽게 시기 구간만 제시(예: "○○년~○○년 무렵 인연 기운이 강합니다"). "가장 좋습니다", "최적의 시기" 같은 단정 금지. 이미 결혼한 분에게도 자연스럽게 해석되는 톤 유지
- 신살 중 도화살·홍염살 해당 시 연애에 미치는 영향

**직업·적성**
- 용신 기반 잘 맞는 직업 3가지 이상 (구체적 직업명)
- 십성 기준 이상적인 업무 환경과 포지션
- 절대 피해야 할 직업 유형과 이유

**건강**
- 부족한 오행으로 보는 취약 신체 부위 (오행-신체 대응 명시)
- 현재 나이대에서 특히 주의해야 할 부분

**종합 조언**
${d.name}님 사주의 핵심 메시지를 3문장으로. 이 사람만에 해당하는 구체적 인생 방향.

한국어 경어체.`,
  ],

  "new-year": [
    (d, ctx) => `당신은 40년 경력의 정통 명리학 대가 "세도인(歲道人)"입니다. 한 해(歲)의 기운을 풀이하는 도인으로, 정중하고 엄중한 명리학자의 톤을 유지합니다.

이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 2가지를 풀이해주세요.

### 2026년 총운
병오년이 이 사주에 어떤 의미인지. 일간과 병오의 기운 관계. 올해 핵심 키워드 한 줄.

### 재물운
재성 흐름과 병오년 영향. 수입·지출·투자 결.

[규칙]
- 트렌디 표현·신조어·이모지 절대 금지
- 부정적 단어 회피 (상극·충 → 부드럽게)
- 한자는 한글 음 병기 (예: 比劫(비겁))
- 한국어 경어체, 정중한 흐름`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 대가 "세도인(歲道人)"입니다.

이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 3가지를 풀이해주세요.

### 연애·관계운
도화살·배우자궁과 병오년. 현재 연인·결혼 전망. (단정 금지, "결로 보입니다" 어조)

### 건강운
오행 균형과 병오년. 올해 주의할 신체 부위.

### 직업·사업운
관성·재성과 병오년. 커리어·승진·이직·창업 전망.

[규칙: 트렌디 표현·이모지 금지 / 부정 단어 회피 / 한자 한글 병기 / 정중한 경어체]`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 대가 "세도인(歲道人)"입니다.

이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 3가지를 풀이해주세요.

### 월별 운세
상반기(1~6월)와 하반기(7~12월) 흐름. 좋은 달과 주의할 달.

### 올해의 행운 키워드
용신 기반 행운의 색깔, 방향, 숫자, 음식.

### ${d.name}님께 드리는 2026년 세도인의 한마디
올해 반드시 기억할 한마디. 시적이지만 구체적. 일간·용신을 자연 비유로 녹일 것.

[규칙: 트렌디 표현·이모지 금지 / 부정 단어 회피 / 한자 한글 병기 / 정중한 경어체]`,
  ],

  "saju-love": [
    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 2가지만 풀이해주세요.

1. **나의 연애 스타일** - 일간과 식상·비겁으로 보는 사랑 패턴. 연애할 때 내 모습.
2. **이상형** - 일지(배우자궁) 십성으로 보는 나에게 맞는 상대의 특징.

따뜻하고 공감 가는 톤으로, 한국어 경어체로 작성해주세요.`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 3가지만 풀이해주세요.

3. **궁합이 잘 맞는 띠·생월** - 삼합·오행 기준으로 잘 맞는 상대.
4. **인연이 오는 시기** - 대운과 2026년 세운 기준. 인연의 시기.
5. **연애에서 나의 약점** - 주의해야 할 연애 패턴. 반복되는 문제.

따뜻하고 공감 가는 톤으로, 한국어 경어체로 작성해주세요.`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 3가지만 풀이해주세요.

6. **현재 연애 중이라면** - 이 관계의 미래 가능성. 지금 관계에 대한 조언.
7. **결혼운과 시기** - 대운 흐름으로 보는 결혼 시기. 배우자의 특징.
8. **${d.name}님만을 위한 연애 조언** - 사랑에서 꼭 기억할 핵심 메시지.

따뜻하고 공감 가는 톤으로, 한국어 경어체로 작성해주세요.`,
  ],

  moving: [
    (d, ctx, s) => {
      const elemEntries = s ? (Object.entries(s.elements) as [string, number][]) : [];
      const weak = elemEntries.filter(([, n]) => n === 0).map(([el]) => el).join(', ') || '없음';
      const ilgan = s?.ilgan ?? '?';
      const yongsin = s?.yongsin ?? '?';
      return `당신은 30년 경력의 정통 명리학 대가 "정도인(定道人)"입니다. 자리를 정하는 길(定) — 이사택일(移徙擇日)을 풀이하는 도인으로, 정중하고 엄중한 명리학자의 톤을 유지합니다.

이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType})
이사 희망 시기: ${d.moveYear}년 ${d.moveMonth}월

${ctx ? `━━━ 사주 원국 ━━━\n${ctx}\n━━━━━━━━━━━━━━━━━━━` : '(사주 원국 미제공)'}

【손없는 날 기준】
음력 9일, 10일, 19일, 20일, 29일, 30일이 손없는 날입니다.
사방을 다니는 손(煞)이 없어 이사·개업·이전에 가장 좋은 날입니다.

${d.moveYear}년 ${d.moveMonth}월 이사 택일 풀이를 아래 4개의 ### 소제목 순서대로 작성하세요.

### 손없는 날 목록
${d.moveYear}년 ${d.moveMonth}월 음력 9·10·19·20·29·30일을 양력으로 환산한 정확한 날짜 목록:
형식 → **○월 ○일(요일)** — 음력 ${d.moveMonth}월 ○○일

### ${d.name}님 사주와 날짜 분석
일간 ${ilgan}, 부족한 오행(${weak})을 중심으로 위 손없는 날 각각이 이 사주에 어떤지 간략 평가하세요.
좋은 날: 구체적 이유(오행·천간지지 근거). 피할 날: 충극 이유.

### 최적 이사 날짜 TOP 3
**1위: ○월 ○일** — 이유(1문장)
**2위: ○월 ○일** — 이유(1문장)
**3위: ○월 ○일** — 이유(1문장)

### 이사 방향 · 시간대 조언
용신(${yongsin}) 기반 유리한 방향과 피할 방향. 이사 시작 적합한 시간대(구체적 시간 명시).

한국어 경어체. 정확하고 실용적으로 작성하세요.`;
    },
  ],

  naming: [
    (d, ctx, s) => {
      const elemEntries = s ? (Object.entries(s.elements) as [string, number][]) : [];
      const weak = elemEntries.filter(([, n]) => n === 0).map(([el]) => el).join(', ') || '균형 잡힘';
      const strong = elemEntries.filter(([, n]) => n >= 2).map(([el]) => el).join(', ') || '없음';
      return `당신은 30년 경력의 정통 작명(作名) 대가 "황도인(煌道人)"입니다. 이름을 빛내는 길(煌) — 사주 부족을 채우는 정통 작명을 풀이하는 도인으로, 정중하고 엄중한 명리학자의 톤을 유지합니다.

성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType})
성(姓): ${d.lastName}
원하는 이름 느낌: "${d.feeling}"

${ctx ? `━━━ 사주 원국 ━━━\n${ctx}\n━━━━━━━━━━━━━━━━━━━` : '(사주 원국 미제공)'}

【발음오행 기준】 ㄱ·ㅋ=木 / ㄴ·ㄷ·ㄹ·ㅌ=火 / ㅇ·ㅎ=土 / ㅅ·ㅈ·ㅊ=金 / ㅁ·ㅂ·ㅍ=水
강한 오행: ${strong} / 부족한 오행(보완 필요): ${weak}

이름 3개를 아래 형식으로 정확히 작성하세요:

### 추천 이름 ① — ${d.lastName}◯◯
**한자:** [성 한자(음)] [이름 한자1(음)] [이름 한자2(음)]
**뜻:** [한자 조합 뜻 — 자연스러운 2문장]
**발음오행:** 이름 초성 → ◯(오행) + ◯(오행) = 오행 상생 설명
**수리사격:** 원격 ○획(길·흉) · 형격 ○획(길·흉) · 이격 ○획(길·흉) · 정격 ○획(길·흉)
**추천 이유:** 부족한 오행(${weak}) 보완 방식 + "${d.feeling}" 느낌 반영 이유. (2문장)

### 추천 이름 ② — ${d.lastName}◯◯
[동일 형식]

### 추천 이름 ③ — ${d.lastName}◯◯
[동일 형식]

주의: 실존 한자만 사용. 세 이름은 서로 다른 느낌(강한·부드러운·세련된)으로 구성. 한국어 경어체.`;
    },
  ],

  face: [
    (d, ctx, s) => `당신은 40년 경력의 정통 관상가이자 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx || '(생년월일 미제공)'}

관상(觀相)과 사주(四柱)를 함께 보는 통합 풀이로 아래 2가지만 작성해주세요.
${s ? `일간이 ${s.ilgan}임을 관상과 반드시 연결하세요.` : ''}

1. **얼굴의 기운과 전체 관상** - 일간 오행이 만들어내는 얼굴 기운. 이목구비의 특성과 인상.
2. **타고난 성격과 기질** - 관상과 사주가 일치하는 성격. 강점과 주의점.

따뜻하고 신비로운 톤으로, 한국어 경어체로 작성해주세요.`,

    (d, ctx, s) => `당신은 40년 경력의 정통 관상가이자 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx || '(생년월일 미제공)'}

관상과 사주를 함께 보는 풀이로 아래 3가지만 작성해주세요.
${s ? `일지 ${s.pillars.day.branch}(배우자궁)와 용신 ${s.yongsin}을 반드시 활용하세요.` : ''}

3. **연애운과 배우자운** - 관상으로 보는 인연. 배우자궁 십성과 연결.
4. **재물운** - 이마·코 관상으로 보는 재물. 재성 흐름과 연결.
5. **직업운과 적성** - 눈썹·눈 관상으로 보는 직업. 용신과 맞는 분야.

따뜻하고 신비로운 톤으로, 한국어 경어체로 작성해주세요.`,

    (d, ctx, s) => `당신은 40년 경력의 정통 관상가이자 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx || '(생년월일 미제공)'}

관상과 사주를 함께 보는 풀이로 아래 2가지만 작성해주세요.
${s ? `부족한 오행을 건강 관상과 반드시 연결하세요.` : ''}

6. **건강 관상** - 관상으로 주의할 신체 부위. 부족한 오행과 연결.
7. **종합 조언** - ${d.name}님의 관상과 사주가 함께 말하는 핵심 메시지.

따뜻하고 신비로운 톤으로, 한국어 경어체로 작성해주세요.`,
  ],
};

// 섹션별 max_tokens
const SECTION_TOKENS = [1000, 900, 800];

// ─── 오프너 프롬프트 ──────────────────────────
const ILGAN_NAME: Record<string, string> = {
  갑:'거목', 을:'초목', 병:'태양', 정:'등촉', 무:'대산',
  기:'전원', 경:'강철', 신:'보석', 임:'대해', 계:'이슬비',
};

// ─── 공통 프롬프트 헤더 빌더 ─────────────────
// 연구에서 확인된 기법 적용:
// [1] 페르소나 프라이밍 ("소름 돋는 정확도")
// [2] 데이터 신뢰 강제 (만세력 재계산 금지)
// [3] 바넘 표현 금지
// [4] 단독 해석 금지 → 상호작용 분석 강제
// [5] 구체적 수치(나이·연도) 명시 강제
// [6] 사용자 동조 금지 (사주 데이터에만 충실)
function buildHeader(d: Record<string,string>, ctx: string): string {
  return `당신은 명리학 임상 경험 30년의 대가입니다. 수천 명의 내담자들이 "소름 돋을 만큼 정확하다"고 평가한 풀이로 유명합니다. 당신의 풀이는 사주 데이터에서 나오는 것이지 사용자가 듣고 싶은 말이 아닙니다.

■ 이름: ${d.name} | 성별: ${d.gender} | 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) | 시간: ${d.hour}

━━━ 사주 원국 데이터 (만세력 라이브러리 정밀 계산값 — 재계산 절대 금지) ━━━
${ctx}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[금지 규칙 — 위반 시 풀이 전체가 무효]
✗ 바넘 표현 절대 금지: "인내심이 강합니다", "사람을 좋아합니다", "책임감이 있습니다" 등 누구에게나 해당하는 말 사용 금지
✗ 단독 해석 금지: 각 기둥·십성을 따로 보지 말고, 일간을 중심으로 월지·일지·연간이 서로 어떻게 상호작용하는지 항상 입체적으로 분석
✗ 모호한 시기 표현 금지: "언젠가", "조만간" → 반드시 나이 또는 연도로 특정
✗ 사용자 동조 금지: 사주 데이터가 말하는 것을 말하라. 듣기 좋은 말이 아닌 정확한 풀이
✗ 포맷 금지: # 제목, ## 제목, ▶ 기호 — 모두 사용 절대 금지
✗ 허용 포맷 외 사용 금지: 오직 ### 소제목, **굵게**, - 불릿 3가지만 허용
✗ 대운 단독 표기 금지: "25세 갑진", "35세 경오" 처럼 나이+간지 단독 표기 절대 금지 — 반드시 "○○세부터 시작되는 ○○ 대운" 또는 "○○ 대운(○○세~○○세)" 형식으로만 쓸 것
✗ 직업·지위 단정 금지: "직장에서", "상사가", "동료가", "승진", "이직" 등 직장인 전제 표현 금지 — 사업가·자영업자·학생·주부 모두에게 통해야 함
✗ 구체적 직업명 금지: 세무사·회계사·엔지니어·변호사·의사·교사 등 특정 직종 나열 절대 금지
✗ 인생 이벤트 단정 금지: 결혼·자녀·부동산 등 특정 상황을 이미 겪었다고 단정하지 말 것

[문체 필수 규칙 — 이 방식으로만 써야 풀이가 먹힘]
✓ **기질(氣質) 중심 서술**: 상황 대신 "이 사람의 타고난 성향" 으로 풀어라. 이 성향이 어디서든 나타나는 패턴을 묘사.
✓ **반복되는 일상 패턴** 묘사: 특정 사건 말고 "회의·대화·관계에서 자주 일어나는 순간" 으로.
   예: "대화 중 상대의 논리가 뚫리는 게 보이는데 굳이 지적 안 하고 넘어가는 때"
✓ **직업 중립 언어**: "일", "사람들", "관계", "프로젝트" 같이 어떤 직군에도 통하는 단어 사용

[도입 중복 금지 규칙 — 매우 중요]
✗ **절대 금지**: 섹션 첫 문장에 "${d.name}님의 일간은 ○○으로" "○○ 일간이라 ~~한 기질을" 같은 일간 소개·재설명
✗ **절대 금지**: "큰 나무처럼 뻗어나가는", "따뜻한 태양처럼" 같은 일간별 자연 비유 **재설명** (이건 오직 첫 섹션 personality1·opener에서만)
✗ **절대 금지**: 각 섹션 도입부에 이름 호명으로 시작 ("${d.name}님은...") — 본론부터 바로
✓ **본론 직진**: 첫 문장부터 기질·내면 독백·구체 인사이트로 바로 들어갈 것
   좋은 예: "당신의 내면에는 늘 '이것만은 물러설 수 없다' 하는 선이 하나 있습니다"
   좋은 예: "대화 도중 상대의 논리가 뚫리는 게 보이는데도 굳이 지적하지 않는 순간이 잦으실 겁니다"
✓ 일간·용신·십성은 **근거로 스치듯** 쓰되 재설명 금지
   좋은 예: "뻗어나가는 갑목(甲木)의 기운이 막히면 유난히 답답함을 느끼게 되는데..."
✓ 이름 호명은 **필요 시에만** (본론 중간에 자연스럽게) — 도입부 호명 금지

[전통 한자 표현 & 시적 표현 규칙]
✓ **한자 사자성어 섹션당 1~2개만** 자연스럽게 삽입. 맥락에 맞을 때만.
   재운대통(財運大通)·관운형통(官運亨通)·인덕구비(人德俱備)·전화위복(轉禍爲福)·
   천우신조(天佑神助)·길운접래(吉運接來)·신왕재왕(身旺財旺)·오기조화(五氣調和) 등
✓ **한자 옆에 반드시 한글 의미 병기**: "재운대통(財運大通) — 큰 재물의 기운이 열림"
✓ **시적·자연 비유** 적극 사용: "봄의 기운이 찾아오는 해", "겨울의 고요가 깃드는 시기",
   "때가 무르익는 해", "달빛 아래 엮이는 실"
✓ **시기별 흐름(대운·세운)** 섹션에서는 **삼재(三災)** 개념 활용 가능 시 언급
   (들삼재·눌삼재·날삼재 3년 구분)
✗ 한자 남발 금지 (한문 교과서 느낌). 맥락 안 맞으면 쓰지 말 것
✗ 한글 의미 없이 한자만 덩그러니 쓰는 것 금지
✗ "용신" 단어 절대 사용 금지 → "가장 필요한 에너지", "보원지기(補元之氣)" 등 풀어쓰기

[필수 규칙]
✓ 간지 이름 반드시 언급 (예: "월간 편관이 일간 임수를 극하므로...")
✓ 조건부 해석 사용 (예: "편재가 강하지만 비겁이 많아 재물이 빠져나가는 구조")
✓ ${d.name}님의 이름과 일간을 본문에 자연스럽게 포함
✓ 반드시 완전한 문장으로 끝낼 것 — 문장 중간에서 절대 끊기지 말 것
✓ 풀이 맨 첫 줄에 반드시 핵심 한 줄 요약을 아래 형식으로 작성할 것:
[요약: 이 사주에서 가장 핵심적인 사실 1문장 — 구체적이고 날카롭게]
✓ [요약:] 작성 직후 바로 첫 번째 ### 소제목으로 시작할 것
✓ ### 소제목 하나당 하나의 핵심 포인트만 — 여러 포인트를 하나의 ### 아래 나열 금지
✓ ### 소제목 하나당 본문은 최대 3문단(약 150자) 이내로 제한`;
}

// ─── 새 섹션별 프롬프트 (평생 사주 풀이용) ───
const SAJU_PROMPTS: Record<string, PromptFn> = {

  personality1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 5개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 타고난 강점 ① — [핵심 강점 이름]
일간과 십성 구조에서 나오는 첫 번째 강점. 구체적 간지 근거(예: "월간 정인이 일간을 생하므로") + 이 강점이 직업·관계·위기 상황에서 어떻게 발휘되는지.

### 타고난 강점 ② — [핵심 강점 이름]
두 번째 강점. 첫 번째와 다른 측면. 구체적 간지 근거 포함.

### 타고난 강점 ③ — [핵심 강점 이름]
세 번째 강점. 어떤 분야·환경에서 빛나는지 구체적으로.

### 반복되는 약점 — [약점 이름]
이 사주 구조가 만드는 반복적 함정 2가지. 어떤 상황에서 어떻게 발현되는지 구체적으로.

### 겉모습 VS 속마음
- 남들이 보는 외적 모습: 월간 십성이 만드는 인상
- 혼자 있을 때 진짜 모습: 일간+일지 조합의 내면 세계
- 두 모습의 간극이 삶에서 만드는 갈등 (오행 논리로)

한국어 경어체. 날카롭되 따뜻하게.`,

  personality2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 일주 DNA — 고유한 성격 패턴
${d.name}님 일주(일간+일지 조합)가 만드는 고유한 성격 패턴. 다른 일주와 명확히 구별되는 특징. 일간과 일지의 오행 관계(생·극·비화)가 내면에 만드는 긴장과 에너지.

### 숨겨진 재능
이 일주 조합에서 나오는 숨겨진 재능 — 스스로도 잘 모르는 강점. 구체적 간지 근거 포함.

### 평생의 과제와 열쇠
평생 반복해서 만나게 될 삶의 과제와 그것을 푸는 열쇠. 어떤 간지 작용에서 이 과제가 생기는지.

### 40대 이후의 변화
이 일주를 가진 사람이 40대 이후 어떻게 변화하는지. 어떤 대운에서 어떤 전환이 오는지.

추상적 표현 금지. 한국어 경어체.`,

  money1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 재성의 위치와 강도
재성(편재·정재)이 이 사주 어디에 있고 어떤 강도인지. 이 배치가 만드는 돈 버는 방식(사업형/직장형, 어떻게 돈을 모으는지).

### 재물과 일간의 관계
재성과 일간의 관계 — 재물을 잘 다루는지, 아니면 재물이 와도 빠져나가는 구조인지. 오행 논리로 설명.

### 재물운이 좋아지는 시기
${d.year}년생 기준 재물운이 좋아지는 대운과 연도를 구체적으로(몇 세, 몇 년대). 그 이유(어떤 오행·십성이 들어오기 때문인지).

### 돈이 새는 이유와 대처법
이 사주에서 재물 손실을 일으키는 구체적 십성 충돌 또는 오행 관계. 실제 삶에서 어떤 패턴으로 돈이 빠져나가는지. 이 패턴을 막는 구체적 행동 지침 2가지.

한국어 경어체.`,

  money2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 5개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 잘 맞는 일의 성향
용신 오행으로 보는 이 사람이 빛나는 '일의 성격'. **절대 특정 직업명(세무사·회계사·엔지니어·변호사 등) 나열 금지.** 대신 "정확성을 요하는 분야", "사람을 다루는 일", "디테일을 놓치지 않는 일" 같이 성향·방향·요구되는 역량 중심으로 서술. 어떤 환경(조직/독립, 대기업/스타트업 등)이 맞는지도 포함.

### 이상적인 업무 스타일
관성·재성 배치로 보는 이상적인 업무 스타일(조직형 vs 독립형, 기획형 vs 실행형 등). 이 사주가 일에서 가장 빛나는 조건.

### 피해야 할 일의 성향
절대 맞지 않는 '일의 성격'과 그 이유 — 오행 충극 근거 제시. **특정 직업명 금지.** "반복 업무", "감정 소모가 큰 일" 같이 성향 중심으로 서술.

### 지금 대운과 커리어
지금 대운(${new Date().getFullYear()}년 기준)이 커리어에 어떤 영향을 주는지. 이직·창업·승진에 유리한 시기와 피해야 할 시기.

### 2026~2030 커리어 흐름
각 연도(2026~2030) 커리어 흐름을 1~2문장씩 요약. 전환점이 되는 해와 이유.

한국어 경어체.`,

  love1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 잘 맞는 상대
오행 상생 기준: 부족한 오행을 채워주는 상대 오행과 그런 사람의 실제 성격·직업 특성. 일지(배우자궁) 십성이 끌리는 상대방 유형.

### 안 맞는 상대
절대 맞지 않는 타입: 오행 상극·십성 충돌 기준, 왜 충돌하는지 설명 포함.

### 그래도 자꾸 끌리는 유형
왜 안 맞는 줄 알면서도 끌리는 타입이 있는지 사주 구조로 설명.

### 반복되는 관계 패턴
인간관계·연애에서 반복하는 행동 패턴 2가지. 어떤 십성·오행 구조에서 나오는지. 패턴을 인식하고 변화하는 구체적 행동 지침.

한국어 경어체. 공감하되 솔직하게.`,

  love2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 5개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 호감 표현 방식
좋아하는 사람에게 어떻게 표현하는지. 일간·식상 기준으로 구체적 간지 근거 포함.

### 연애 중 역할
리드형인지 서포트형인지, 어떤 역할에서 편안한지. 이 사주 구조의 근거.

### 사랑에서 가장 중요하게 여기는 것
안정인지, 자유인지, 인정인지. 일지·관성·식상 근거로 설명.

### 상처받는 패턴
어떤 상황에서 가장 상처받고 어떻게 반응하는지. 오행·십성 근거 포함.

### 상대방이 이 사람을 사랑하는 법
어떻게 대해줄 때 마음이 열리는지. 구체적인 행동·태도로 설명.

한국어 경어체. 따뜻하고 솔직하게.`,

  love3: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 배우자의 특성
일지(배우자궁) 십성으로 보는 배우자의 성격·직업·오행 특성 구체적으로.

### 결혼 후 부부 관계
결혼 후 실제 부부 관계의 역학 — 누가 주도하고, 어디서 마찰이 생기는지. 결혼 생활에서 주의할 점 2가지.

### 결혼 인연의 기운이 흐르는 시기
대운 흐름에서 결혼·인연의 기운이 강하게 흐르는 구간 1~2개를 제시하세요 (예: "○○년~○○년 무렵", "○○세 전후").
✗ 단정적 표현 절대 금지 — "가장 좋습니다", "최적의 시기입니다", "이때 결혼해야 합니다" 같은 확정적 단언 금지
✗ "지금까지 미혼이었다면 이 시기가 적기" 식의 추궁성 표현 금지
✓ 부드러운 표현 — "이 시기에 인연의 기운이 강하게 흐릅니다", "○○년 무렵 결혼 인연이 가까워질 수 있는 흐름이 나타납니다"
✓ 이미 결혼하신 분에게도 어색하지 않게 — "이미 인연을 만나셨다면 이 시기는 관계가 한층 깊어지는 흐름이 됩니다" 같은 양방향 해석 가능한 문장 1줄 포함
✓ 사주는 시기의 기운을 보는 것이지, 인생 사건을 단정하는 것이 아님을 톤으로 전달

### 귀인을 만나는 법
이 사주에서 귀인 역할을 하는 십성 유형. 귀인을 만나기 좋은 장소·상황·시기. 현재 대운 기준 귀인 운이 언제 강해지는지.

한국어 경어체.`,

  health: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
먼저 이 섹션의 핵심을 2~3문장으로 자연스럽게 요약해 주세요 (### 소제목 없이 일반 문장으로만). 그런 다음 아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 취약한 신체 부위
부족한 오행과 그 오행이 지배하는 신체 기관(목=간·담, 화=심장·혈관, 토=소화기, 금=폐·피부, 수=신장·뇌). 이 사주 구조에서 생기기 쉬운 질환 또는 신체 증상 2~3가지.

### 건강이 취약해지는 시기
특정 대운에서 건강이 취약해지는 시기와 이유. ${d.name}님이 특히 주의해야 할 연령대.

### 유익한 음식과 해로운 음식
용신 오행 기반 유익한 음식 5가지(구체적 식품명). 해로운 음식 또는 습관.

### 추천 운동과 생활 환경
추천 운동 유형. 유익한 생활 환경(방향, 색깔, 시간대). 정신 건강을 위한 구체적 루틴 1가지.

한국어 경어체.`,

  hidden: (d, ctx, s) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 ### 소제목들을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 숨겨진 재능
이 사주에서 본인도 잘 모르는 숨겨진 재능. 어떤 십성·지지 조합에서 나오는지 근거 포함. 그 재능이 어떤 상황에서 폭발적으로 발현되는지 구체적 시나리오.

### 잠재력이 막혀 있는 이유
지금까지 이 잠재력이 발현되지 못한 이유(사주 구조상 어떤 걸림돌). 이 잠재력을 꽃피우기 위해 지금 당장 할 수 있는 것 1가지.

${s?.sinsal && s.sinsal.length > 0
  ? s.sinsal.map(ss => {
      const info = SINSAL_INFO[ss];
      const titleSuffix = info ? ` (${info.hanja}) — ${info.subtitle}` : '';
      return `### 신살 풀이 — ${ss}${titleSuffix}
이 신살이 이 사주 구조에서 구체적으로 어떤 방식으로 발현되는지. 긍정적 활용법과 주의할 상황. 이 신살이 강하게 발동하는 시기(나이 또는 대운).`;
    }).join('\n\n')
  : `### 신살 없는 사주의 의미
이 사주에는 특별한 신살이 없습니다. 일주와 월지의 관계에서 숨겨진 특수 기운을 분석하세요. 신살 없는 사주의 의미와 장단점.`}

한국어 경어체.`,

  timeline1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 6개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.
각 연령대에 해당하는 대운 간지를 반드시 명시하고, 그 대운이 일간에게 생인지 극인지 분석하세요.

### 20대 — [이 시기의 핵심 키워드]
20대 대운 간지와 의미. 사회 진출·연애·자아 확립 측면에서의 흐름.

### 30대 — [이 시기의 핵심 키워드]
30대 대운 간지와 의미. 커리어·결혼·재물 측면에서의 흐름. 좋은 시기와 주의할 시기.

### 40대 — [이 시기의 핵심 키워드]
40대 대운 간지와 의미. 사업·승진·가정 안정 측면에서의 흐름.

### 50대 — [이 시기의 핵심 키워드]
50대 대운 간지와 의미. 인생 전환점·건강·노후 준비 측면에서의 흐름.

### 60대 — [이 시기의 핵심 키워드]
60대 대운 간지와 의미. 은퇴·인간관계·건강 측면에서의 흐름.

### 70대 이후 — [이 시기의 핵심 키워드]
70대 이후 대운 간지와 의미. 노년의 삶의 질과 핵심 과제.

한국어 경어체.`,

  timeline2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 5개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 2026년 병오년 풀이
병오년(丙午) 천간·지지가 일간·일지·월지와 어떤 관계인지. 재물·직업·연애 흐름. 상반기와 하반기 구분.

### 2027년 정미년 풀이
정미년(丁未) 천간·지지와 일간의 관계. 재물·직업·연애 흐름. 주의할 시기.

### 2028년 무신년 풀이
무신년(戊申) 천간·지지와 일간의 관계. 재물·직업·연애 흐름. 주의할 시기.

### 2029~2030년 풀이
기유년(己酉, 2029)과 경술년(庚戌, 2030) 흐름. 각각 1~2문단으로 핵심만.

### 5년 전체 키워드
2026~2030년 전체를 관통하는 핵심 키워드와 조언 한 마디.

한국어 경어체.`,

  compass: (d, ctx) => `${buildHeader(d, ctx)}

[핵심 요약 페이지에서 ${d.name}님에게 이미 공개된 아이템 — 이 값들을 그대로 존중해서 다시 언급할 것. 새 값 만들기 절대 금지]
${d.overviewContent || '(핵심 요약 데이터 없음 — 이 경우 아이템을 새로 만들지 말고 "수호 동물", "궁합 보석", "행운 색깔" 같이 총칭으로만 언급)'}

[풀이 요청]
아래 2개의 ### 소제목으로 작성하세요. 각 소제목은 하나의 페이지입니다. 각 소제목 아래 내용은 2~3문단 이내로 간결하게.

[중요한 금지사항]
✗ "용신" 단어 절대 사용 금지 — "가장 필요한 에너지", "보충해야 할 기운" 등 풀어쓴 표현만
✗ 위 핵심 요약에 있는 아이템과 다른 값을 만들어 내면 안 됨 (수호동물·보석·색깔·숫자·식물 값이 달라지면 풀이 전체가 무효)
✗ 이모지(🐯💎🎨🔢🌸🐾) 사용 금지
✗ 불릿(-) 나열 금지 — 흐르는 산문으로만
✗ 아침·저녁 루틴 같은 잔소리 금지

### 이 사주를 빛나게 하는 길
이 사주의 가장 뛰어난 부분(강점) 2~3문장으로 응축. 그 강점을 극대화하려면 일상에서 어떤 방향으로 움직여야 하는지 구체적 지침. 강점이 가장 빛나는 상황 하나를 생생하게 묘사.

### 부족함을 채우는 길
이 사주의 부족한 부분(약점) 2~3문장으로 응축. 위 핵심 요약에 나와 있는 ${d.name}님의 수호 동물·궁합 식물·궁합 보석·행운 색깔·행운 숫자·궁합 동물을 **흐르는 산문 안에** 자연스럽게 엮어서 이렇게 활용하면 약점이 보완된다는 식으로 풀어 쓰세요. 카탈로그 나열 금지, 한두 개 아이템을 중심 비유로 삼아 부드럽게.

마지막 문단은 ${d.name}님에게 전하는 따뜻한 응원 2~3문장으로 마무리.

한국어 경어체, 문학적 흐름 유지.`,

  closing: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 2개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다.

### 인생 키워드
${d.name}님의 사주를 관통하는 핵심 키워드 5개. 반드시 이 사주 데이터에서 근거가 도출되는 키워드만(누구에게나 해당하는 키워드 금지).
형식: **키워드** — 이 키워드가 이 사주에서 나오는 이유(구체적 간지 근거 1문장)

### 묵도인의 당부
${d.name}님 사주의 가장 핵심적인 메시지를 담은 마지막 말씀.
- 정확히 3문장
- 시적이지만 구체적 — 추상적 위로 금지
- 일간과 용신을 자연 비유로 녹여낼 것
- 읽는 사람이 가슴에 새기고 싶어지는 문장

한국어 경어체, 시적인 톤.`,

  overview: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
${d.name}님의 사주를 바탕으로 아래 형식 그대로 작성하세요. ### 소제목 금지.

--- 운세 요약 (각 항목 정확히 2문장) ---

💰 재물·직업운
이 사주의 돈 버는 방식과 재물 흐름의 핵심. 주의할 점 1가지 포함.

🌿 건강운
이 사주에서 가장 취약한 신체 부위와 생활 습관 핵심 조언.

🤝 연애·관계운
이 사주의 연애 스타일과 인연 흐름의 핵심.

--- 나만의 사주 아이템 (각 항목: 이름만, 이유는 한 문장) ---

🐯 수호 동물: [동물 이름] — [이 사주 오행·간지와 어울리는 이유 한 문장]
🌸 궁합 식물: [식물 이름] — [이유 한 문장]
🎨 행운 색깔: [색깔 이름] — [이유 한 문장]
🔢 행운 숫자: [숫자 1~2개] — [이유 한 문장]
🐾 궁합 동물: [실제 키울 수 있는 애완동물 이름] — [이 사주 오행과 어울리는 이유 한 문장]
💎 궁합 보석: [보석 이름] — [이유 한 문장]

구체적 간지·오행 근거 포함. 한국어 경어체.`,

  qa: (d) => `당신은 30년 경력 명리학 대가 묵도인입니다.

아래는 ${d.name}님의 평생 사주 전체 풀이 요약입니다:

${d.summaries}

위 풀이를 바탕으로 내담자의 질문에 답해주세요:
"${d.question}"

- 위 풀이 요약에서 이 질문과 관련된 내용을 근거로 직접 답할 것
- 3~5문단 이내로 핵심적으로
- ### 소제목 없이 자연스러운 문단으로
- 어항·반려동물·이사 방향 같은 생활 질문도 이 사람의 사주 특성에 맞게 구체적으로 답할 것
- 바넘 표현 금지

한국어 경어체.`,
};

// ─── 엄마-아이 궁합 프롬프트 ──────────────────────────────
//
// ★★★ 새 ban/require 규칙 추가 시 — 반드시 lib/rules-catalog.ts 워크플로우 따를 것 ★★★
//
//   Step 1. CORE_RULES 에 새 규칙 등록 (id, type, scope, source, description)
//   Step 2. 충돌 가능성 분석 → KNOWN_CONFLICTS 에 페어 + resolution 명시
//   Step 3. validateRulesAgainstSeed(sampleSeed) 실행 → 위반 0 확인
//   Step 4. 이 함수의 prompt 또는 매트릭스 코드 변경
//   Step 5. 배포 후 검증
//
// 회귀 사이클 종결의 핵심 — 새 규칙 추가 시 충돌 검증 자동화로 회귀 차단.
//
function buildParentChildPrompt(
  d: Record<string, string>,
  sajuChild: SajuAnalysis,
  sajuMom: SajuAnalysis | null,
  sajuDad: SajuAnalysis | null,
  momCompat: CompatibilityResult | null,
  dadCompat: CompatibilityResult | null,
  saja: FamilySajaSeongeo
): string {
  const hasMom = !!sajuMom;
  const hasDad = !!sajuDad;
  const ctxMom = sajuMom ? buildCtx(sajuMom, d.momName) : "";
  const ctxDad = sajuDad ? buildCtx(sajuDad, d.dadName) : "";
  const ctxChild = buildCtx(sajuChild, d.childName);
  // 닮은 결/다른 결 — 차트와 정합 (AI hallucination 차단)
  const momCompare = sajuMom ? inferElementCompare(sajuMom, sajuChild) : null;
  const dadCompare = sajuDad ? inferElementCompare(sajuDad, sajuChild) : null;
  // 흐름 차트 — 차트와 본문 element 정합 (결함 1 차단)
  const momFlow = sajuMom ? inferFlowGiven(sajuMom, sajuChild, sajuDad ?? undefined) : null;
  const dadFlow = sajuDad ? inferFlowGiven(sajuDad, sajuChild, sajuMom ?? undefined) : null;
  // 한 가지 선물 — 결정론 매트릭스 (자녀 일간 오행 × 부모 역할)
  const momGift = sajuMom ? inferGiftCard(sajuChild, "엄마") : null;
  const dadGift = sajuDad ? inferGiftCard(sajuChild, "아빠") : null;
  // 시너지 카드 — 결정론 매트릭스 (자녀 일간 오행 × 부모 역할)
  const momSynergy = sajuMom ? inferSynergyCards(sajuChild, "엄마") : null;
  const dadSynergy = sajuDad ? inferSynergyCards(sajuChild, "아빠") : null;
  const childLabel = d.childGender === "남" ? "아들" : "딸";

  // ── 자녀 발달 단계 (시드 빌드에 필요 — 일찍 계산) ──
  const childAgeStage = classifyAgeStage(
    parseInt(d.childYear ?? "0") || 0,
    parseInt(d.childMonth ?? "1") || 1,
    parseInt(d.childDay ?? "1") || 1,
  );

  // ── ★★★ 자녀 캐릭터 시드 (Single Source of Truth) ──
  // Phase 3: 분산 계산 12+ 곳을 단일 시드로 통합. 모든 매트릭스·차트·본문이 이 시드 참조.
  const childSeed = buildChildSeed(
    sajuChild,
    d.childName ?? "자녀",
    (d.childGender === "여" ? "여" : "남") as "남" | "여",
    childAgeStage,
  );

  // ── 시드에서 derived 변수 (기존 코드 호환성 유지) ──
  const childElem = childSeed.elements;
  const yangPctCalc = childSeed.yangPct;
  const yinPctCalc = childSeed.yinPct;
  const introExtroDirection = childSeed.introExtroDirection;
  const sipCounts = childSeed.sipCounts;
  const sixFactor = childSeed.sixFactor;
  const sixFactorTop3 = childSeed.sixFactorTop3.join(' · ');

  // ── 사전 계산: 시각화 차트와 AI 본문 일관성 강제 ──
  const intel8 = infer8Intelligences(sajuChild);
  const jobRadar = inferJobRadar(sajuChild);
  const thinkingT = inferThinkingType(sajuChild);
  const friendS = inferFriendStyle(sajuChild);
  const friendDist = inferFriendDistance(sajuChild);
  const discipline = inferDisciplineChannels(sajuChild);
  const dangerC = inferDangerCards(sajuChild);
  const intel8Top3 = intel8.map(i => i.name).join(' · ');
  const intel8Names = intel8.map(i => i.name);
  const jobSorted = [...jobRadar].sort((a, b) => b.score - a.score);
  const jobTop3Names = jobSorted.slice(0, 3).map(j => j.name);
  const jobTop3 = jobTop3Names.join(' · ');
  const jobTop1 = jobSorted[0];
  const jobAvoid = [...jobRadar].sort((a, b) => a.score - b.score)[0];
  const disciplineBest = [...discipline].sort((a, b) => b.score - a.score)[0];
  const disciplineWorst = [...discipline].sort((a, b) => a.score - b.score)[0];
  const dangerSorted = [...dangerC].sort((a, b) => b.level - a.level);
  // (6요인 sixFactor·sixFactorTop3 은 위 childSeed 에서 derived — 중복 계산 제거됨)

  // 첫마디용 결정론 시드 — 사주 계산값(일간 비유 + 십성 톤 + 보충 오행)
  const momSeed = buildOpenerSeed(
    sajuMom, sajuChild, "엄마",
    d.momName ?? "어머님", d.childName ?? "자녀",
    momCompat?.elementBalance.aHelpsB[0] ?? null,
  );
  const dadSeed = buildOpenerSeed(
    sajuDad, sajuChild, "아빠",
    d.dadName ?? "아버님", d.childName ?? "자녀",
    dadCompat?.elementBalance.aHelpsB[0] ?? null,
  );
  const childSipStrength = describeChildSipseongStrength(sipCounts);

  // 분포 사실 분류 — AI가 약함을 균형으로 윤색하는 것 방지
  const elementDist = classifyElementDistribution(sajuChild.elements as Record<string, number>);
  const sipseongDist = classifySipseongDistribution(sipCounts);

  // childAgeStage 는 위 시드 빌드 직전에 이미 계산됨 — 여기선 derived 만
  const childToneGuide = ageToneGuide(childAgeStage);
  const sixFactorBodyCtx = buildSixFactorBodyContext(
    sixFactor,
    childAgeStage,
    d.childName ?? "자녀",
    d.childGender ?? "남",
  );
  const childDigitalLimit = dailyDigitalLimit(childAgeStage);

  // 회복 처방 매트릭스 — 약한 오행 + 발달 단계 + 사주 해시 기반 (5×4×6×3 = 360 풀)
  const childAge = (() => {
    const y = parseInt(d.childYear ?? "0") || 0;
    if (!y) return 7;
    const now = new Date();
    return Math.max(0, now.getFullYear() - y);
  })();
  const weakestElem = pickWeakestElement(sajuChild.elements as Record<string, number>);
  const presSeed = `${d.childName ?? ""}-${d.childYear ?? ""}-${d.childMonth ?? ""}-${d.childDay ?? ""}`;
  const prescription = buildPrescriptionSet(weakestElem, childAge, presSeed, childAgeStage);

  // "우리 아이의 마음" 사주 결정론 컨텍스트 — 약한 페이지 4개 대체용
  const sipseongDeepCtx = buildSipseongDeepContext(sipCounts, childAgeStage);
  const sinsalCtx = buildSinsalContext(sajuChild.sinsal ?? [], childAgeStage);
  const meetClashCtx = buildMeetClashContext(sajuChild, childAgeStage);
  const yongsinCtx = buildYongsinContext(sajuChild.yongsin ?? "", childAgeStage, sajuChild);
  const ageStageContext = `
━━━ 자녀 발달 단계 — 톤·어휘 가이드 (★ 모든 본문에 반드시 적용) ━━━
[현재 단계: ${ageStageKor(childAgeStage)}]
${childToneGuide}
★ 위 단계의 톤 가이드는 첫마디·마음·가이드·재능·진로·엄마/아빠 결 등 **모든 슬라이드 본문**에 일관 적용.
`;
  const distributionContext = `
━━━ 아이 결 분포 — 사주 계산 사실 (★ 반드시 이대로 묘사) ━━━
[아이 오행 분포 (100% 기준)]
${elementDist.text}

[아이 십성 분포 (8글자 기준)]
${sipseongDist.text}

★ "균형/안정/조화"라는 단어 사용 조건: 위 "전체 균형 여부"가 "균형"일 때만 사용 가능. "불균형"이면 절대 금지.
★ 두 약한 결을 묶어서 "둘이 균형"이라 묘사하지 말 것. 약함은 약함, 강함은 강함으로 사실대로.
★ "약함" 카테고리에 있는 결은 본문에서 약하다는 사실(부족·미흡·여린 결 등)을 정직하게 표현. 윤색 금지.
`;

  // 가족 통합 컨텍스트 (둘 다 있을 때 — 모순 방지)
  const familyContext = (hasMom && hasDad && momCompat && dadCompat) ? `
━━━ 가족 통합 컨텍스트 (★ 모순 방지를 위해 반드시 따를 것) ━━━
[엄마가 ${d.childName}에게 보충해주는 기운]: ${momCompat.elementBalance.aHelpsB.join('·') || '없음'}
[아빠가 ${d.childName}에게 보충해주는 기운]: ${dadCompat.elementBalance.aHelpsB.join('·') || '없음'}
[엄마와 ${d.childName}의 일간 관계]: ${momCompat.ilganRelation}
[아빠와 ${d.childName}의 일간 관계]: ${dadCompat.ilganRelation}
[엄마와 ${d.childName}의 일지 충돌]: ${momCompat.branchRelations.chung.join(', ') || '없음'}
[아빠와 ${d.childName}의 일지 충돌]: ${dadCompat.branchRelations.chung.join(', ') || '없음'}

★ PART 4(엄마)와 PART 5(아빠)는 위 데이터를 반드시 일관되게 따를 것.
★ "엄마가 채워주는 기운"과 "아빠가 채워주는 기운"이 겹치면 "두 분이 함께 ~을 채워줍니다", 다르면 "엄마는 ~, 아빠는 ~ 서로 다른 결로 보완합니다" 식으로 비교 명시.
★ 두 부모의 일간 관계가 같으면 "두 분 모두 ~한 결로 만나심", 다르면 "엄마는 ~, 아빠는 ~ 서로 다른 결의 만남" 식.
` : "";

  // ── 아이 현재 나이 자동 계산 + 단계 분류 ──
  const childYearN = parseInt(d.childYear) || 0;
  const childMonthN = parseInt(d.childMonth) || 1;
  const childDayN = parseInt(d.childDay) || 1;
  const now = new Date();
  let age = now.getFullYear() - childYearN;
  const beforeBirthday =
    now.getMonth() + 1 < childMonthN ||
    (now.getMonth() + 1 === childMonthN && now.getDate() < childDayN);
  if (beforeBirthday) age -= 1;
  if (age < 0) age = 0;

  let stage: string;
  let stageHint: string;
  if (age <= 5) {
    stage = "영유아 (0~5세)";
    stageHint = "현재는 아직 어려서 재능·진로는 '앞으로 ~할 가능성이 높습니다' 같은 미래 시제로. 양육 방향과 환경 조성에 무게.";
  } else if (age <= 12) {
    stage = "초등 학령기 (6~12세)";
    stageHint = "재능이 조금씩 드러나기 시작하는 시기. '지금 ~한 모습이 보일 것'과 '앞으로 ~로 발전할 가능성' 혼합. 학습 스타일·관심 분야 강조.";
  } else if (age <= 18) {
    stage = "중·고등학생 (13~18세)";
    stageHint = "사춘기·진로 결정이 가까운 시기. '이미 ~한 면이 나타나고 있을 것', '앞으로 진로에서 ~방향이 어울림'. 사춘기 갈등을 현재진행형으로.";
  } else if (age <= 25) {
    stage = "청년기 (19~25세)";
    stageHint = "독립·진로가 본격화되는 시기. 부모는 조언자 위치. '이미 ~한 길을 걷고 있거나 시작하고 있을 것'. 사춘기는 과거형, 진로 발현은 현재진행형.";
  } else {
    stage = "성인 자녀 (26세+)";
    stageHint = "이미 자기 길을 걷는 성인. 부모는 인생 동반자. '~로 살아오셨을 것', '앞으로 ~한 인생 후반'. 양육보다는 관계 본질 중심.";
  }

  return `당신은 30년 경력의 정통 명리학 대가 "자도인(慈道人)"입니다. 1000년 동양 사주명리학을 현대 한국 부모의 일상 언어로 재표현하는 도인으로, 부모와 자녀 사이의 결을 풀이합니다. 양육 상담사도 발달 전문가도 아닙니다 — 사주에서 도출된 자녀의 결을 부모가 일상에서 알아볼 수 있도록 풀어주고, 그 결에 맞는 다가가는 길을 가볍게 짚어줍니다. 풀이는 부모의 자녀를 "들여다본 듯한" 독백 어조로 진행되며, 부모를 위로하거나 다독이지 않습니다.

${hasMom ? `━━━ 엄마(${d.momName}) 사주 ━━━
${ctxMom}
` : ''}${hasDad ? `
━━━ 아빠(${d.dadName}) 사주 ━━━
${ctxDad}
` : ''}
━━━ ${childLabel}(${d.childName}) 사주 ━━━
${ctxChild}

━━━ 아이 현재 단계 ━━━
${d.childName} 현재 만 ${age}세 — ${stage}
[작성 시제·관점 가이드] ${stageHint}

━━━ 자동 계산된 궁합 지표 ━━━
• 가족 인연의 결 (표지 키워드): "${saja.keyword}" — ${saja.meaning}
• 표지 부제 (메타포): ${saja.subtitle}
${hasMom && momCompat ? `• [엄마-아이] 일간 관계: ${momCompat.ilganRelation} — ${momCompat.ilganDetail}
• [엄마-아이] 엄마가 채워주는 기운: ${momCompat.elementBalance.aHelpsB.join('·') || '없음'}
• [엄마-아이] 아이가 가져다주는 기운: ${momCompat.elementBalance.bHelpsA.join('·') || '없음'}
• [엄마-아이] 일지 관계: ${momCompat.branchRelations.ilji}
• [엄마-아이] 지지 충: ${momCompat.branchRelations.chung.join(', ') || '없음'}
• [엄마-아이] 강점: ${momCompat.strengths.join(' / ') || '없음'}
• [엄마-아이] 주의점: ${momCompat.weaknesses.join(' / ') || '없음'}` : ''}
${hasDad && dadCompat ? `• [아빠-아이] 일간 관계: ${dadCompat.ilganRelation} — ${dadCompat.ilganDetail}
• [아빠-아이] 아빠가 채워주는 기운: ${dadCompat.elementBalance.aHelpsB.join('·') || '없음'}
• [아빠-아이] 아이가 가져다주는 기운: ${dadCompat.elementBalance.bHelpsA.join('·') || '없음'}
• [아빠-아이] 일지 관계: ${dadCompat.branchRelations.ilji}
• [아빠-아이] 지지 충: ${dadCompat.branchRelations.chung.join(', ') || '없음'}
• [아빠-아이] 강점: ${dadCompat.strengths.join(' / ') || '없음'}
• [아빠-아이] 주의점: ${dadCompat.weaknesses.join(' / ') || '없음'}` : ''}
${familyContext}
${ageStageContext}
${distributionContext}

${buildChildSeedPromptBlock(childSeed)}

━━━ ★ 호칭 가이드 (반드시 준수) ━━━
${hasMom && hasDad
  ? `둘 다 입력됨. 일반 호칭은 "부모님" 사용. PART 4 안에서만 "어머니", PART 5 안에서만 "아버지" 사용. 다른 PART의 호칭은 "부모님"으로.`
  : hasMom
  ? `엄마만 입력됨. 호칭은 "어머니" 그대로 사용.`
  : `아빠만 입력됨. 호칭은 모두 "아버지"로. PART 4(엄마와 우리 아이)는 출력하지 말 것 — 자동 생략됨.`}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[★★ 자도인의 톤 — 묵도인 도원의 정통 화법 차용 (가장 중요)]

✓ **본론 직진**: 도입부에 "${d.childName}는 ~한 자녀입니다" 같은 소개로 시작 금지.
   대신 자녀의 내면부터 직진. "**안에는 한 번 끓어오르면 멈추기 어려운 결이 있습니다**" 같이.

✓ **조심스러운 관찰 어조 — 단정 금지**:
   ❌ 너무 확정적: "~보여집니다" / "~하실 겁니다" / "~순간이실 겁니다"
   ✅ 부드러운 관찰: "~보여집니다" / "~나타나곤 합니다" / "~한 경우가 있습니다" / "~한 모습이 종종 보여요" / "~순간이 있곤 합니다"
   예: "**마트에서 떼쓰는 모습이 자주 보여집니다**"
   예: "**갑자기 조용해질 때가 가장 화난 순간일 수 있습니다**"
   예: "**작은 변화에도 마음이 떨리는 순간이 종종 있곤 합니다**"
   예: "**자기만의 세계에 집중하는 모습이 자주 나타나곤 합니다**"
   ★ 어머니에게 "당신은 이걸 볼 것이다" 라는 단정 톤 절대 금지. 사주 결의 가능성·경향을 부드럽게 묘사.

✓ **반복되는 일상 한 장면 묘사**: 추상 X. 시나리오 한 줄로.
   예: "**게임에서 졌을 때, 줄을 서다 누가 새치기했을 때 — 그 순간 손이 먼저 나갑니다**"
   예: "**친구 집에서 자기 차례를 기다리다 못 참고 끼어들 때**"

✗ **부모 다독임·위로 절대 금지**:
   - "어머니 잘못이 아니에요" 절대 사용 X
   - "어머니는 잘 해오고 계세요" 절대 사용 X
   - "너무 걱정하지 마세요" 절대 사용 X
   - "아이는 건강하게 자랄 거예요" 절대 사용 X
   - "어머니, 힘드시죠" 같은 공감 표현 절대 사용 X
   자도인은 상담사가 아닙니다. 부모 감정을 다독이지 않고 자녀의 결을 들여다봅니다.

✓ **마지막 한 줄은 사주적 미래상으로 — 짧게**:
   부모를 위로하지 않고 사주가 드러내는 가능성을 짧게 짚어줌.
   예: "**이 결을 다듬으면 결단력 강한 리더로 자라나는 사주입니다**"
   예: "**조용히 깊이 자기 길을 찾아가는 사주입니다**"

[양육 가이드 흐름 권장 — 강제 아님]
각 ### 안에서 자유로운 흐름으로 풀이하되, 다음 요소들을 자연스럽게 포함:
- 사주 결 (짧게) → 자녀 내면 묘사 (독백 톤) → 일상 장면 → 다가가는 길 (구체 행동) → 사주적 미래상 (부모 다독임 X)

[★★ 의학·진단 용어 절대 금지 — 법률 안전]

✗ 절대 사용 금지 (의료법 위험):
   ADHD / 주의력결핍 / 과잉행동 / 자폐 / ASD / 자폐스펙트럼 / 우울증 / 우울장애 /
   불안장애 / 공황장애 / 강박장애 / 분노조절장애 / 충동조절장애 / 적대적반항장애 / ODD /
   발달장애 / 지적장애 / 언어장애 / 학습장애 / 틱장애 / 뚜렛 / 애착장애 /
   "치료" / "처방" (자도인의 처방은 OK이지만 의료 처방 X) / "병원 가보세요" /
   "정신과 상담받으세요" / "OO 증상이 있습니다" / "전문가 진단이 필요합니다"

✓ 안전한 우회 (사주적 표현):
   ADHD/산만 → "**한 곳에 오래 머물지 못하는 결**"
   자폐 성향 → "**자기 세계가 깊은 결**" / "**다른 사람과의 결이 천천히 열리는 자녀**"
   우울 → "**마음이 무겁게 가라앉는 결**" / "**기운이 안으로 깊어지는 시기**"
   불안 → "**예민하게 흔들리는 결**" / "**작은 변화에도 마음이 떨리는 결**"
   분노/욱 → "**한순간 끓어오르는 결**" / "**욱하는 마음이 자주 올라오는 결**"
   반항 → "**틀에 부딪히고 싶어하는 결**" / "**자기 길로 가고 싶은 마음이 큰 결**"
   치료 → "**돌봄**" / "**다가가는 길**" / "**결을 부드럽게 다듬는 방법**"

[★ 어머니 친화 톤 — 한자 풀어쓰기]
이 풀이를 받는 어머니는 사주 용어를 거의 모릅니다. 모든 명리 용어는 다음 변환표대로 풀어쓰세요. 한자는 처음 등장 시에만 한 번 괄호 병기 가능, 이후엔 풀어쓰기만:

【용어 변환표 — 반드시 적용】
일간(日干) → "타고난 본질"
일지(日支) → "마음의 자리"
월지(月支) → "사회성의 결"
시지(時支) → "삶의 결말 자리"
오행 → "다섯 가지 자연의 결 (목·화·토·금·수)"
木(목) → "나무의 결 (자라남)"
火(화) → "불의 결 (빛남·열정)"
土(토) → "흙의 결 (안정·품)"
金(금) → "쇠의 결 (단단함·결단)"
水(수) → "물의 결 (지혜·흐름)"
십성 → "기질의 다섯 색깔"
비겁(비견·겁재) → "자기를 세우는 기운"
식상(식신·상관) → "표현하는 기운"
재성(편재·정재) → "끌리는 기운"
관성(편관·정관) → "절제하는 기운"
인성(편인·정인) → "사색하는 기운"
용신(用神) → "꼭 채워야 할 기운"
대운 → "10년 단위 인생 흐름"
세운 → "한 해의 흐름"
신살 → "특별한 기운의 자리"
합·충 → "결의 만남" / "결의 부딪힘"
격국(格局) → "인생의 큰 그림"

[★★★ 자녀 보고서 절대 원칙 — 모든 섹션 공통]
- 본문은 항상 **"부모가 자녀에게 미치는 영향"** 을 그릴 것 (이 보고서의 본질).
- 🔴 **호칭 통일 절대 강제**: 본문 출력 시 "**엄마**" → "**어머님**", "**아빠**" → "**아버님**" 으로 통일. 조사도 "아빠가/아빠의/아빠는/아빠와" → "아버님께서/아버님의/아버님은/아버님과" 로 일관. "어머니" 도 가능하지만 "어머님" 이 우선. (본 프롬프트 안 instruction의 "엄마"/"아빠" 는 데이터 라벨일 뿐이며, 본문에선 절대 그대로 노출 금지.)
- 🔴 **마크다운 헤더 (## / ### / #### 등) 라인은 호칭 통일 적용 X**: 헤더 라인은 반드시 표준 형식 그대로 출력 — "## 엄마와 우리 아이", "## 아빠와 우리 아이" 형식 유지. ❌ "## 어머님과 우리 아이" "## 아버님과 우리 아이" 절대 금지 (시스템 매칭 실패 → 보고서 깨짐). 본문 (헤더 아닌 줄) 에서만 어머님/아버님 사용.
- 명리 방향이 자녀→부모일지라도(자녀가 부모를 살리는 흐름, 자녀가 부모를 다듬는 흐름 등), 보고서는 **부모→자녀 방향으로 reframe**. 부모가 그 결을 받아 자녀에게 어떻게 응답하고 영향을 주는지로 풀이.

🌟 **자원 프레임 절대 원칙** — 부모 부담·죄책감 유발 금지:
- 부모를 **"자녀에게 줄 수 있는 자원·선물"** 으로 위치시킬 것. "부모의 결이 자녀에게 [동사]" 형식이라면 동사는 항상 긍정·자원형으로.
- ✅ 권장 동사: 받쳐주다 / 세워주다 / 키워주다 / 비춰주다 / 채워주다 / 짚어주다 / 길을 비춰주다 / 단단한 뿌리가 되어주다 / 활력을 채워주다 / 시야를 열어주다
- ❌ 절대 금지 동사·표현 (부모가 자녀에게 부정적 영향을 준다고 읽히는 모든 어휘):
  "억누르다·억누를", "짓누르다·짓누를", "눌러주다", "압박하다·압박되다·압박적", "위협하다·위협적", "위축되다·위축될", "꺾다·꺾이다·꺾는", "다치다·다치게 하다", "무너뜨리다·무너지다", "약하게 만들다·약화시키다", "거슬리다·거슬리게 하다", "지배하다·다스리다·통제하다", "휘두르다·휘둘리다", "강요하다", "짓밟다", "마음을 다치게 하다", "자녀를 ~하게 만들 수 있다 (부정형)", "~할 위험이 있다", "~할 우려가 있다"
- ❌ 절대 금지 한자 (강 부정): "상극(相剋)", "충(沖·冲)", "흉(凶)", "양인살", "괴강", "공망", "칠살", "형(刑)"
- ✅ 부모 행동 권고 톤: "조심스럽게 다가가야" 대신 "**자녀의 페이스에 맞춰 다가가시면**", "주의해야" 대신 "**한 박자 늦춰 주시면**", "경계해야" 대신 "**자녀의 호흡을 살피시면**"
- ✅ 자녀 결도 강점으로: "부드러운 흙의 결" 대신 "**유연하고 받아들이는 흙의 결**", "약한 결" 대신 "**섬세한 결**" 등 — 부모-자녀 모두 강점 보유자로 묘사
- ✅ 조건+가이드 함께 (단, 부담 없는 톤): "**이 결이 빛나려면** ~ 해주셔야" 같은 조건부 부담 표현 금지. 대신 "**이 결은 ~ 할 때 자연스럽게 빛납니다**" 또는 "**~ 다가가실 때 깊은 가르침이 됩니다**" 같은 단정·자연 톤 사용. 구체 행동(예: "결정 전 5분 자녀 의견 듣기") 1~2개는 권장형으로 부드럽게 명시.
- 부정 어휘를 자연스럽게 풀어쓸 수 없을 때라도 위 자원 프레임 동사로 대체 가능. 부모가 보고 부담을 느끼는 어떤 표현도 금지.
- **모든 본문 마지막 한 문장은 자녀 영향(child impact)으로 마무리** (R092 — 의도 강제·형식 자유):
  - ✅ **의도 강제**: 부모 영향 마무리 X, 자녀 부담 X. 자녀가 어떻게 자라나는지에 초점.
  - ✅ **형식 자유 (페이지별 차별화)**: "~한 자녀로 자라간다" / "~한 결로 빛난다" / "~한 사주임을 의미합니다" / "~한 빛으로 깊이 자라남" 등 **페이지 주제와 정합한 다양한 형식 권장**.
  - 🔴 **페이지마다 같은 어휘·형식 마무리 반복 금지** (예: "자기 페이스로 자라난다" 가 5+ 페이지 등장 = 사용자 인지 단조로움).
  - ✅ 페이지별 권장 어휘 풀: 자기 결·자기 호흡·자기 박자·차분한 흐름·안정된 흐름·타고난 빛 — 한 보고서 내에서 다양화.
- 🔴 **마무리 자연 연결 강제** — 마무리 문장이 본문과 떠있는 느낌이 안 나도록 **앞 문장과의 연결 다리** 필수:
  - ❌ 금지 (붕 뜬 마무리): "...강한 자기 주장을 펼치는 모습이 나타날 수 있습니다. 자녀는 자신의 감정 흐름을 조율하며 성장해나가는 자녀로 자라날 것입니다." (앞-마무리 논리 점프)
  - ✅ 권장 (자연 연결): "...강한 자기 주장을 펼치는 모습이 나타날 수 있습니다. **이런 결을 부모님이 짚어주실 때**, 자녀는 자신의 감정 흐름을 조율하며 성장해나가는 자녀로 자라날 것입니다."
  - 연결 패턴 예시: "이런 결을 부모님이 짚어주실 때", "자녀의 호흡을 살피며 다가가실 때", "자녀의 페이스를 존중하실 때", "이 결이 자연스럽게 자라가는 환경에서", "부모님의 따뜻한 응원 속에서"
  - 마무리 문장 직전에 위 연결 다리 1구절 자연스럽게 삽입 → 마무리가 본문 흐름에서 자연스럽게 우러나오는 톤.
- ✗ "어머님이/아빠가 ~로 자라난다·빛난다" 같은 부모 영향 마무리 절대 금지 (보고서 방향 어긋남).
- imagery와 동사 일치 강제: 큰 나무→자라남·뻗음, 칼날→다듬음·결단, 햇살→비춤·따뜻함, 들판→받음·자리잡음, 강물→흐름·깊이. imagery와 어긋나는 동사 사용 금지.

[출력 형식]
- 12개의 대섹션을 순서대로 작성. 대섹션 헤더는 반드시 \`## \` (샵 2개 + 띄어쓰기) 로 시작.
- ★★★ **응답에 8개의 \`## \` 대섹션 헤더를 빠짐없이 그대로 다시 출력**. 첫 섹션 \`## 자도인의 첫마디\` 도 반드시 본문 앞에 출력할 것. (프롬프트 안의 \`## \` 는 템플릿일 뿐 — 응답에는 그대로 다시 써야 매칭됨. 헤더 누락 시 보고서 첫 페이지가 빈칸으로 나옴.)
- 각 대섹션 안의 소제목은 \`### \` (샵 3개 + 띄어쓰기) 로 시작. 각 \`### \` 가 한 페이지가 됩니다.
- 각 \`### \` 아래 본문은 약 260~340자, 2~3문단. 너무 길지 않게.
- 첫 대섹션 "자도인의 첫마디"만 \`### \` 없이 한 단락(2~3문장)으로.
- 안내 메모(괄호로 묶인 지시문)는 출력하지 말고, 본문만 출력할 것.
- 어려운 한자 명리 용어 직접 사용 금지. 대신 풀어쓰기 + (괄호 한자) 보조.
- 자연·일상 비유 적극 권장 — 어머니가 머릿속에 그림을 그릴 수 있게.
- ★ **모든 페이지 본문에 핵심 단어/구절을 \`**굵게**\`로 강조** — 가독성을 위한 규칙. 한 페이지(280~360자)당 **정확히 2~3개**만 \`**...**\` 마크다운으로 감싸기. 그 이상은 강조 효과가 죽고 페이지가 한 색으로 도배되어 보이므로 금지.
  - 좋은 예: "${d.childName}는 **깊은 사색의 시간**을 통해 **자기만의 세계**를 구축하며, 새로운 환경에서는 **충분히 탐색하고 숙고하는** 모습이 자주 보여집니다."
  - 나쁜 예 (강조 0개): "${d.childName}는 깊은 사색의 시간을 통해 자기만의 세계를 구축합니다."
- ★ 단, 한 줄 전체를 \`**...**\`로 감싸지 말 것 (그건 부제목으로 인식됨). 줄 안의 단어/구절만.
- ★ 불릿(•/-) 항목에서도 핵심 명사구는 반드시 \`**굵게**\` (예: "• **깊은 지혜와 통찰력** (물 기운이 강해서)").

## 자도인의 첫마디
${d.momName}님과 ${d.childName} ${childLabel}의 인연을 **정확히 ${hasDad ? "6문장" : "5문장"} 한 단락**의 시적이고 임팩트 있는 첫마디로 풀어주세요. 보고서의 첫 표지이므로 짧고 강렬해야 합니다.

[결 데이터 — 엄마와 아이]
${momSeed?.text ?? "(엄마 사주 미입력)"}

${hasDad ? `[결 데이터 — 아빠와 아이]
${dadSeed?.text ?? "(아빠 사주 미입력)"}

` : ""}[★★★ 5문장 구조 (반드시 이 흐름·문장 수 준수)]
${hasDad
  ? `1. **도입 (한 문장)**: 어머니 ${d.momName}님의 [엄마 imagery]와 아버지 ${d.dadName}님의 [아빠 imagery]가 한 자리에 만남을 그릴 것.
2. **자녀 자리 (한 문장)**: ${d.childName}${d.childGender === '남' ? '군' : '양'}이 [아이 imagery]의 결로 두 분 사이에 태어남을 그릴 것.
3. **어머니 응답 (한 문장)**: 어머니의 결이 자녀에게 "${momSeed?.responseVerb ?? "함께하는"}" 톤으로 어떤 영향을 주는지.
4. **아버지 응답 (한 문장)**: 아버지의 결이 자녀에게 "${dadSeed?.responseVerb ?? "함께하는"}" 톤으로 어떤 영향을 주는지.
5. **자녀 영향 마무리 (한 문장)**: "${d.childName}${d.childGender === '남' ? '군' : '양'}은 두 결 사이에서 **${momSeed?.childGrowthPhrase ?? dadSeed?.childGrowthPhrase ?? "자기 결을 차분히 키워가는"}** 자녀로 자라날 것입니다" 형태로 (시드의 [자녀 마무리 문구]를 그대로 또는 가벼운 변주로 사용. "자기만의 깊은 세계" 같은 부정 인상 표현 절대 금지).
6. **마지막 한 줄 (한 문장)**: "이제 자도인이 세 분의 결을 차근차근 풀어드리겠습니다." (양친 케이스 — 엄마·아빠·자녀 세 사람)`
  : `1. **부모 imagery (한 문장)**: 어머니/아버지 ${d.momName}님은 [imagery]의 결을 타고나셨음.
2. **자녀 imagery (한 문장)**: ${d.childName}${d.childGender === '남' ? '군' : '양'}은 [아이 imagery]의 결을 지니고 태어났음.
3. **만남의 핵심 (한 문장)**: 두 결이 만나 어머니/아버지가 자녀에게 "${momSeed?.responseVerb ?? dadSeed?.responseVerb ?? "함께하는"}" 톤으로 어떤 만남을 이루는지.
4. **자녀 영향 마무리 (한 문장)**: "${d.childName}${d.childGender === '남' ? '군' : '양'}은 어머니/아버지 곁에서 **${momSeed?.childGrowthPhrase ?? dadSeed?.childGrowthPhrase ?? "자기 결을 차분히 키워가는"}** 자녀로 자라날 것입니다" 형태로 (시드의 [자녀 마무리 문구]를 그대로 또는 가벼운 변주로 사용. "자기만의 깊은 세계" 같은 부정 인상 표현 절대 금지).
5. **마지막 한 줄 (한 문장)**: "이제 자도인이 두 분의 결을 차근차근 풀어드리겠습니다."`}

[★★★ 절대 원칙]
- **imagery·동사 일치 강제**: 시드의 응답 동사를 그대로 또는 가벼운 변주로만 사용. 큰 나무가 다듬는다·칼날이 수용한다 같은 모순 절대 금지.
- **부모→자녀 영향 방향 강제**: 명리 방향이 자녀→부모일지라도 보고서는 부모가 자녀에게 영향을 주는 톤으로. "어머님이/아빠가 자라난다" 같은 부모 영향 마무리 절대 금지.
- **마무리는 반드시 자녀 영향**: "${d.childName}${d.childGender === '남' ? '군' : '양'}은 ~한 자녀로 자라날 것입니다."

[엄격 금지]
- ✗ 통상 메타포 절대 사용 금지: "한 박자 빠르게/늦춰", "발맞추다", "속도", "기다려주는 마음" 등.
- ✗ 5단계·6~8문장 같은 긴 구조 X — 정확히 위 ${hasDad ? "6" : "5"}문장만.
- ✗ 사주 한자 명리 용어(편재·정인·일간·일지 등) 본문 직접 노출 금지. 풀어쓰기.
- 🔴 부정 어휘·한자 ban — 위 [★★★ 자녀 보고서 절대 원칙] 의 자원 프레임 절대 원칙 그대로 적용.
- ✗ 부모 다독임·자녀 명령·단정·영어 단어 금지.

[형식]
- 정확히 ${hasDad ? "6" : "5"}문장 한 단락 (### 없이 단일 페이지).
- 핵심 단어/구절 **정확히 2~3개**만 \`**굵게**\`. 그 이상 X.
- ★★★ 자녀 호칭 — "${d.childName}${d.childGender === '남' ? '군' : '양'}" 형태 강제. 이름만 단독 사용 금지. 받침 조사 규칙 (을·은·이·의·과).

## 한눈에 보는 우리 아이

### 본질 한 호흡
${d.childName}의 **타고난 본질**이 만드는 핵심 성향을 한 호흡으로 풀어주세요. 자연 비유로 시작 (예: "햇살처럼 밝은 아이", "깊이 흐르는 강물 같은 아이"). 캐치프레이즈 한 줄 + 본질 한 단락. ★ "결" 단어 사용 자제 — 직관적 단어로.

🔴 **이 페이지는 일간 본질 + 오행 본질만 — 다른 페이지 영역 침범 금지** (옵션 3 정보 격리):
- ✅ 사용 가능: 시드의 **일간 메타포** (${childSeed.ilganMetaphor}) + **강한 오행** (${childSeed.topElement}) + **약한 오행** (${childSeed.weakElement}) + 일간 풀이 (자연 비유)
- ❌ **6요인 정보 (활동성·표현력·감수성·끈기·창의성·자기조절) 사용 금지** → 그건 "## 우리 아이의 마음 / ### 6가지 행동 결의 강도" 페이지 영역
- ❌ **십성 5분류 정보 (자기를 세움·표현함·끌림·절제함·사색함) 사용 금지** → 그건 "## 우리 아이의 마음 / ### 다섯 색깔의 결" 페이지 영역
- ❌ "외부 자극에 민감 반응", "주변 변화 섬세히 알아차리는" 같은 6요인(감수성) 풀이 어휘 절대 X
- ✅ **분량은 자연스럽게**: 일간 + 오행 본질로 한 단락 채우기 어려우면 짧아도 OK (180~280자 OK). 빈약함 채우려 다른 페이지 정보 끌어오지 말 것.

🔴 **명리 관계 정확 어휘 사전 — 자원 프레임 + 명리 정확성 균형 (옵션 B)**:
시드의 [자녀 본질 vs 환경 — 명리 관계] 의 type (현재: **${childSeed.elementRelation.type}**) 에 따라 다음 어휘만 사용:

- **비화** (자녀 일간 = 강 환경): "본질이 같은 결로 강화되는 / 같은 결이 깊이 흐르는"
- **자녀생환경** (자녀가 환경 살림): "본질이 환경을 자연스럽게 키워주는"
- **환경생자녀** (환경이 자녀 살림): "환경이 본질을 든든히 키워주는"
- **자녀극환경** (자녀가 환경 다듬음): "본질이 환경을 단정하게 다스리는"
- **환경극자녀** (환경이 자녀 본질에 도전 자극): "환경이 본질을 차분히 가다듬어 단단하게 만드는"

🔴 **자원 프레임 ban 부작용 차단 — 절대 금지**:
- ❌ **환경극자녀** (예: 수극화 — 자녀 케이스) 인데 "환경이 본질을 도와주는·살려주는·마르지 않게 하는" 으로 풀이 X (명리 정반대 윤색 — 사용자 신뢰도 직격)
- ❌ **자녀극환경** 인데 "환경이 자녀를 보호하는" 으로 풀이 X (방향 반대)
- ✅ **명리 방향성을 정확히 따르되** 자원 톤 어휘 사용 ("다듬는·단단하게·차분히 가다듬는·키워주는·강화되는" 등)
- ✅ 부모 가이드 한 줄: "부모님께서 자녀의 호흡을 살피며 다가가실 때, 이 결이 더 단단하게 자라날 것입니다" 같은 톤

🔴 **시드 강 결을 결핍 표현으로 묘사 절대 금지**:
- 위 [자녀 캐릭터 시드] 의 강한 십성·강한 오행 (현재 자녀: 강 십성=${childSeed.topSipseong}, 강 오행=${childSeed.topElement}) 은 자녀가 **이미 타고난 결**.
- ❌ 금지 패턴: "강 결인데 ~한 시간이 **필요한** 자녀", "~ 결을 **채워줘야** 하는 자녀", "~ 결이 **부족한** 자녀" — 강 결을 결핍 표현으로 묘사 = 시드와 모순 (사용자 신뢰도 직격).
- ✅ 권장 패턴 (강 결 묘사):
  - "이미 ~한 결을 깊이 머금은 자녀"
  - "타고난 ${childSeed.ilganMetaphor} 같은 본질이 ~로 자연스럽게 펼쳐지는 자녀"
  - "타고난 ${childSeed.ilganMetaphor}의 빛이 자녀의 본질로 깊이 자라남" (B 옵션 — 본질 페이지 고유 마무리, "자기 페이스" 같은 안전 어휘 다른 페이지와 반복 회피)
- ✅ 약 결만 "부모님께서 ~ 채워주시면" / "~ 시간이 도움되는" 같은 보충 표현 사용 가능. 강 결은 절대 X.

### 기질 5각도
${d.childName}의 다섯 기운(나무·불·흙·쇠·물) 분포 풀이. 위 [아이 오행 분포]의 강함/중간/약함 분류를 **반드시 그대로 따를 것**. 가장 강한 기운과 가장 약한 기운이 만드는 ${d.childName}만의 두드러진 모습 + 채워주면 좋은 부분을 한 단락으로. 차트 수치 직접 언급 X, 일상 행동·성향으로 풀어주세요.
★ 약함 카테고리의 두 기운을 묶어 "균형/안정/조화"로 표현 금지 — 둘 다 약하면 둘 다 약하다고 정직하게.
★ "균형"이라는 단어는 [아이 오행 분포]의 "전체 균형 여부"가 "균형"일 때만 사용 가능. "불균형"이면 절대 사용 금지.

<!-- 십성 5분류 풀이는 "## 우리 아이의 마음 / ### 다섯 색깔의 결" 한 곳에만 — 한눈 섹션 중복 페이지 제거 (옵션 1) -->
<!-- 차트(십성 5각)는 한눈 섹션에 그대로 유지 — 사용자 인지 흐름: 한눈 차트 → 마음 풀이 -->

### 강점·주의점 카드
※ 페이지 위에 카드 그리드가 자동 표시됩니다. 본문은 아래 형식을 **반드시** 그대로 따라주세요 (파서가 직접 읽음).

★★★ **반드시 이 형식 그대로 출력** (다른 텍스트·서론·해설 일체 금지):

[강점]
• [이모지] **키워드(3~8글자)** — 일상에서 어떻게 보이는지 한 장면 (한 줄)
• [이모지] **키워드(3~8글자)** — 일상에서 어떻게 보이는지 한 장면 (한 줄)
• [이모지] **키워드(3~8글자)** — 일상에서 어떻게 보이는지 한 장면 (한 줄)

[주의점]
• [이모지] **키워드(3~8글자)** — 일상에서 어떻게 보이는지 한 장면 (한 줄)
• [이모지] **키워드(3~8글자)** — 일상에서 어떻게 보이는지 한 장면 (한 줄)

★ **이모지 선택 규칙**:
- 각 카드의 키워드와 의미가 딱 들어맞는 이모지 1개를 \`•\` 다음에 붙일 것
- 5장 카드의 이모지가 모두 달라야 함 (강점 3·주의점 2 = 5개 모두 고유)
- 사주 풀이 정서에 맞는 자연스러운 이모지 (장난스러운 이모지 X)

[이모지 가이드 — 의미별 추천 (참고용. 더 적합한 게 있으면 자유롭게 선택)]
- 사색·지혜·깊이·탐구 → 🔍 / 📚 / 🌌
- 관찰·예민·통찰 → 👁️ / 🔭
- 끈기·꾸준·뚝심 → 🌱 / ⛰️ / 🌳
- 감각·섬세·미적·예술 → 🎨 / 🌸 / 🦋
- 온화·따뜻·품·다정 → ☀️ / 🤲 / 🫶
- 표현·말·창의 → 💬 / 🎤 / ✨
- 리더십·당당·주도 → 👑 / 🦁
- 우정·어울림·협력 → 🤝 / 🌈
- 활발·에너지·실천 → ⚡ / 🏃 / 🔥
- 꿈·이상·상상 → ☁️ / 🪐 / 🌠
- 책임·약속·성실 → 🛡️ / 📋
- 정직·올곧음 → 🌿 / 🪨

[주의점용 추천]
- 고집·완고·반복 → 🔒 / 🗿
- 외로움·혼자·고독 → 🌙 / 🍂
- 결정 늦음·신중 → ⏳ / 🐢
- 감정 욱·폭발 → 🌋 / 💥
- 변화 두려움·낯섦 → 🌊 / 🍃
- 마음 닫음·시간 걸림 → 🚪 / 🗝️
- 비교·경쟁 → ⚖️
- 욕심·소유 → 💎

[좋은 예 — 이 형식 그대로]
[강점]
• 🔍 **깊이 사색하는 지혜** — 혼자 책을 읽거나 골똘히 생각에 잠기는 시간이 자주 보여집니다
• 🌱 **끝까지 가는 끈기** — 친구가 포기하는 순간에도 마지막까지 해내곤 합니다
• ☀️ **품어주는 온화함** — 갈등이 생긴 친구들 사이를 자연스럽게 누그러뜨리는 모습이 있습니다

[주의점]
• 🌙 **외로움을 느끼는 면** — 친구들과 어울려 놀다가도 혼자만의 시간이 필요해질 때가 있습니다
• ⏳ **결정이 느린 면** — 메뉴 하나를 고를 때도 충분히 살펴보고 정하는 편입니다

[나쁜 예 — 절대 금지]
• 깊은 지혜 (편관의 결이 강하게 작용하여) ← 사주 용어·"결" 직접 노출 금지
• 🔍 깊은 지혜 — ... ← 이모지 옆에 \`**\` 굵게 마크다운 빠짐 금지
• 🔍 **사색** | 🔍 **관찰** ← 이모지 중복 절대 금지

[규칙]
- 괄호 안에 **사주 용어(편관·식상·인성·비겁·관성·재성·일간·일지·결 등)** 절대 넣지 말 것
- 괄호 대신 \`—\` (em dash)로 일상 장면 1줄 연결
- 키워드(굵게 부분)는 반드시 \`**...**\` 마크다운으로 감싸고 3~8글자
- \`[강점]\` 정확히 강점 3개, \`[주의점]\` 정확히 주의점 2개. 줄바꿈·갯수 어기지 말 것
- **5개 카드의 이모지는 모두 서로 달라야 함**
- ★★ **표준 한국어 사전 단어·구만 사용**. "서둠/뭐둠/끄둠" 같은 임의 줄임말·신조어 금지. 길이를 줄이려고 단어를 잘라내지 말 것 — 8글자에 안 맞으면 다른 표준 단어로 대체 (예: "표현의 서투름"이 7자라 그대로 사용. "서둠"으로 줄이지 말 것).

## 우리 아이의 마음

### 외향-내향 스펙트럼
${d.childName}이 양 기운(목·화) 과 음 기운(금·수) 중 어느 쪽으로 기우는지를 일상 모습으로 풀어주세요.

★★★ **반드시 다음 계산 결과를 따를 것**:
- 사주 계산: **${introExtroDirection}적 성향이 ${Math.max(yangPctCalc, yinPctCalc)}%로 ${(() => {
  const dom = Math.max(yangPctCalc, yinPctCalc);
  if (dom >= 65) return "두드러짐";
  if (dom >= 55) return "우세";
  return "약간 우세";
})()}** (양 ${yangPctCalc}% / 음 ${yinPctCalc}%)
- 따라서 본문은 반드시 **${introExtroDirection}적인 자녀**로 묘사할 것 (반대 방향 절대 금지). 단, ${Math.max(yangPctCalc, yinPctCalc) < 55 ? "**약간 우세** 케이스이므로 '두드러진다·강하게' 같은 단정 표현 금지. '살짝 기우는·조금 더 편한·은은히 우세한' 같은 부드러운 톤으로." : Math.max(yangPctCalc, yinPctCalc) < 65 ? "'우세한' 톤으로 (강한 단정 X)." : "'두드러진다·강하게' 톤으로."}
${introExtroDirection === "외향"
  ? `- 외향 묘사: "사람·활동 속에서 에너지를 얻는다", "왁자지껄한 곳에서 더 빛난다", "처음 만난 사람과도 빨리 친해진다"`
  : `- 내향 묘사: "혼자 사색하며 에너지를 충전한다", "조용한 곳을 선호한다", "소수의 친한 친구와 깊이 교류한다"`}

★ **구체적인 % 수치는 본문에 절대 언급하지 말 것** (페이지 위에 자동 시각화 막대가 표시됩니다). 대신 일상 행동·선호로 한 단락 묘사. 친구 관계·새 환경에서 어떻게 반응하는지 구체적 장면 1~2개 포함.

### 6가지 행동 결의 강도
${sixFactorBodyCtx}

[엄격 규칙 — 결정론 본문이지만 안전장치 명시]
- ★★★ 위 본문을 정확히 그대로 출력. 자유 풀이·문장 추가·재배치·요약 절대 금지.
- ✗ 십성 한자 절대 금지: 식상·인성·비겁·관성·재성·비견·겁재·정재·편재·정관·편관·정인·편인·식신·상관
- ✗ 십성 풀이 어휘 절대 금지: "표현하는 기운", "자기를 세우는 기운", "절제·규율의 기운", "받아들임·사색의 기운", "손에 잡히는 것을 챙기려는 기운"
- ✅ 차트 라벨 어휘만 등장 가능: 활동성·표현력·감수성·끈기·창의성·자기조절

### 다섯 색깔의 결 (십성 5분류)
${sipseongDeepCtx}

위 사전 계산 결과를 바탕으로 한 단락(3~4문장)으로 풀어주세요. 가장 강한 결과 가장 약한 결의 대비를 일상 장면으로. 사주 용어(비겁·식상·재성·관성·인성) 본문 노출 금지 — 위에서 정의한 한국어 결로만.
★ 재성을 묘사할 때 "끌리는" 같은 수동 표현 금지 — "손에 잡으려는·쥐려는·챙기는·잡으려 하는" 같은 능동 표현으로.

🔴 **강(强)/약(弱) 양상 정확 어휘 사전 — 명리 역해석 차단** (이 표현만 사용. AI 자의적 풀이 금지):
[강(强) 양상 — "강함" 결을 묘사할 때]
- 비겁 강: 자기 주장이 분명한 결 / 자기 자리를 챙기는 결 / 독립적이고 단단한 결
- 식상 강: 표현이 풍부한 결 / 끼·창의를 발산하는 결 / 마음을 환히 드러내는 결
- 재성 강: 결과·소유에 손이 가는 감각 / 챙기려는 손길이 분명한 결
- 관성 강: 절제·규율이 자연스러운 결 / 책임감·약속을 지키는 결
- 인성 강: 깊이 사색하는 결 / 받아들임·흡수가 자연스러운 결

[약(弱) 양상 — "약함" 결을 묘사할 때]
- **비겁 약: 자기 주장이 부드러운 결 / 남의 의견을 잘 받아들이는 결 / 결정 시 부모님께서 함께 짚어주시면 빛나는 결** (❌ "굽히지 않다", "고집", "강하게 주장", "자기 중심적" 절대 금지)
- 식상 약: 속을 내비치기 신중한 결 / 표현보다 관찰·사색이 우선인 결 (❌ "끼 발산", "거침없는 표현" 금지)
- 재성 약: 결과·소유에 욕심이 부드러운 결 / 손에 잡으려는 마음이 가벼운 결 (❌ "챙기는 감각이 분명" 금지)
- **관성 약: 충동·욕구가 솔직한 결 / 자유로운 결 / 자기 페이스 조율에 부모님의 따뜻한 안내가 도움되는 결** (❌ "통제력 강", "규율 엄격", "스스로 제어 잘함" 금지)
- 인성 약: 행동·체험 우선인 결 / 손발이 먼저 움직이는 결 (❌ "깊이 사색", "차분한 흡수" 금지)

🔴 **두 가지 약점 묶음 금지 + 약 결을 강 양상 어휘로 묘사 금지** — 약 결은 각각 독립 문장으로, 위 [약(弱) 양상] 어휘만 사용. 강 양상 어휘로 풀이하면 명리 역해석 (자녀 사주 결을 정반대로 풀이하는 치명적 오류).

### 타고난 신살의 결
${sinsalCtx}

위 신살 중 가장 두드러진 1~2개를 골라 한 단락(3~4문장)으로 풀어주세요. 어머니가 일상에서 발견할 수 있는 장면 1~2개 포함. 신살 한자 명칭 본문 노출 금지.

★ **신살별 정확 어휘 가이드 (의역 차단)**:
- **태극귀인(太極貴人)**: ❌ "꿰뚫어 보는·핵심 파악·예리한 통찰" 금지 (현침·문창과 혼동) → ✅ "음양 조화·시작과 끝을 다스리는 큰 그릇·한 분야 끝까지 마무리·종합·통합·균형 시야·깊이 몰입"
- **현침살(懸針)**: ✅ "꿰뚫어 보는·남이 보지 못하는 것을 보는 눈·예리한 통찰"
- **문창귀인(文昌)**: ✅ "학문·문장의 별·글과 말로 빛나는 결"
- **천을귀인(天乙)**: ✅ "어려움에 귀한 도움·결정적 인연"
- **양인살(羊刃)**: ✅ "강한 의지·결단의 순간 빛나는 힘" (자원 톤)
- **화개살(華蓋)**: ✅ "예술·학문의 별·자기만의 세계 깊이 가꾸는"
- **도화살(桃花)**: ✅ "사람을 끌어당기는 매력·사랑받는 결"
★ 신살별 의미가 명리적으로 정확해야 합니다. 다른 신살 의미 임의 차용 X.

### 결이 만나고 부딪히는 자리
${meetClashCtx}

위 사전 계산 결과를 바탕으로 한 단락(3~4문장)으로 풀어주세요. "충/합" 한자 명칭 본문 노출 금지.

🔴 **4가지 거시 케이스별 본문 가이드** (사전 계산 결과 따라 분기):
- **합 + 충 모두 있음**: 양면 다 풀이. "잘 어울리는 자극도 있고, 부딪히는 자극도 있는 결" 톤. 합·충 각각 1문장씩.
- **합만 있음**: 잘 어울리는 자극·시간·환경 위주. "자녀가 ~할 때 가장 자연스럽게 흐릅니다" 톤.
- **충만 있음**: 부딪히는 자극·답답함의 자리. "~한 자극이 누적되면 결이 흔들릴 수 있습니다" 톤.
- **합·충 모두 없음**: ❌ "드러나지 않는다" 단순 단정 금지. ✅ "사주 안에서 큰 합·충 자리가 도드라지지 않아, 자녀의 결이 **비교적 안정된 흐름** 속에서 **차분히 자라나는 사주**입니다. 급격한 변화나 강한 자극보다는 **꾸준하고 일관된 환경**이 자녀의 결을 가장 잘 살립니다." 톤으로 안정형 사주의 의미를 적극적으로 풀이 (단순 부정형 X). 마무리: "**안정된 흐름 속에서 자녀의 결이 단단해지는 사주임을 의미합니다**" 같이 "자기 페이스" 어휘 사용 X (다른 페이지와 반복 회피).
- 모든 케이스에서 자녀의 일상 장면 1~2개 포함.

${childAgeStage === "infant" ? `<!-- 영아 단계: "회복과 환경" 섹션 미생성 (보편 육아 상식과 변별 약함, 렌더에서도 숨김) -->
★ 영아(0~35개월) 케이스이므로 **"### 회복과 환경" 섹션은 출력하지 마세요**. "회복", "처방", "환경 카드", "[자녀]", "[부모]" 같은 블록을 어떤 형태로도 작성 금지.` : `### 회복과 환경 — 우리 아이의 회복 처방
※ 페이지 위에 카드 그리드가 자동 표시됩니다.

★★★ **6개 카드는 사주 보충 처방 매트릭스에서 결정론으로 도출되었습니다. 아래 [매트릭스 결과]를 그대로 출력하세요. 일반 양육 상식·임의 추가 절대 금지.**

[매트릭스 결과 — 약한 오행: ${weakestElem}, 발달 단계 기반]

(근거)
${d.childName}는 ${weakestElem}의 결(${weakestElem === "목" ? "성장·유연" : weakestElem === "화" ? "활기·표현" : weakestElem === "토" ? "안정·신뢰" : weakestElem === "금" ? "단단함·결단" : "지혜·고요"})이 부족해, 그 결이 채워질 때 가장 빨리 마음이 회복됩니다. 위 한 줄은 그대로 자연스럽게 풀어 쓰되, 사주 용어 노출 X.

[자녀]
• ${prescription.immediate.emoji} **즉효 처방** — ${prescription.immediate.text}
• ${prescription.daily.emoji} **일상 처방** — ${prescription.daily.text}
• ${prescription.avoid.emoji} **피해야 할 결** — ${prescription.avoid.text}

[부모]
• ${prescription.space.emoji} **공간** — ${prescription.space.text}
• ${prescription.sense.emoji} **감각** — ${prescription.sense.text}
• ${prescription.rhythm.emoji} **리듬** — ${prescription.rhythm.text}

[엄격 규칙]
- ★★ 위 [매트릭스 결과]의 **6개 카드를 글자 하나도 바꾸지 말고 그대로 출력**. 이모지·키워드·본문 모두 동일.
- ★★ "근거" 줄은 위 한 줄을 그대로 또는 자연스럽게 풀어쓰기만 허용. 다른 처방·환경·일반 양육 팁을 추가하지 말 것.
- ★ 사주 용어(편관·식상·인성·관성·재성·일간·결 등) 본문에 직접 노출 금지.
- ★ 매트릭스 외의 처방·환경 어떤 것도 추가하지 말 것 (이 카드들은 사주 보충 원칙으로 결정된 사실).`}

### 평생 빛나는 결 (용신)
${yongsinCtx}

위 사전 계산 결과를 바탕으로 한 단락(3~4문장)으로 풀어주세요. 이 자녀가 평생 채워가면 빛나는 한 결이 무엇인지, 발달 단계에 맞는 부모/자녀 역할 비중을 자연스럽게 반영. 용신 한자 단어 본문 노출 금지 — "평생 채워주면 빛나는 한 결"로.

🔴 **"채워가다" 의 추상성 해소 — 구체적 풀이 필수**:
- "${d.childName}이/가 평생 채워가면 빛나는" 같은 모호한 표현으로만 끝내지 말 것.
- ❌ 금지 패턴: "${d.childName}이 평생 채워가면 빛나는 한 결은 불의 결(火)입니다." 만 단정형 (무엇을·어떻게 채우는지 모호)
- 🔴 **추상 풀이 어휘 절대 금지** (옵션 3 — 사용자 발견 결함): "환한 빛", "따뜻한 사람들", "활기찬 활동", "차분한 흐름의 시간", "단정한 환경" 같은 명리 풀이 어휘를 행동 가이드 자리에 사용 X. 이런 어휘는 "결이 무엇인지" 묘사일 뿐, 부모가 무엇을 할지 구체적 행동 가이드 X.
- ✅ 권장 패턴 (자녀 일간 오행에 맞는 구체 행동 1~2개 인용):
  "${d.childName}**에게 평생 가까이 두면 빛나는** 한 결은 [오행]의 결입니다. **[구체 행동 1], [구체 행동 2]**이 자녀의 결을 빛내줍니다." (예: 화 케이스 → "햇볕 산책 30분, 노래·춤 놀이가 자녀의 결을 빛내줍니다")
- ✅ **오행별 구체 행동 — 본문에 1~2개 반드시 명시**:
  - 목(木): 식물 가까이 두기·공원 산책·새싹 관찰·아침 햇살 30분·푸른빛 환경
  - 화(火): 햇볕 산책 30분·노래·춤 놀이·따뜻한 친구·가족과 자주 만남·신체 활동·발표·역할 놀이·붉은빛/주황 환경
  - 토(土): 같은 시간·같은 자리에서 식사·꾸준한 잠자리 의식·흙 만지기·텃밭·정원 활동·황색 환경
  - 금(金): 정돈된 책상·맑은 공기 환기·짧고 명료한 대화·결단력 길러주는 선택 놀이·흰빛 환경
  - 수(水): 깊은 잠·물놀이·욕조 휴식·도서관·조용한 사색 시간·검정/짙은 푸른빛 환경
- ✅ **발달 단계별 행동 분기**:
  - 영아(0~35개월): 부모 주도 환경 설정 위주 (예: "햇볕 좋은 창가에서 30분 안고 흔들기")
  - 유아(36~72개월): 부모 + 자녀 함께 활동 (예: "공원에서 함께 햇볕 산책")
  - 초등·중고등: 자녀 자율 활동 + 부모 응원 (예: "야외 운동을 자녀 스스로 선택할 수 있게")

## 실전 양육 가이드

${childAgeStage === "infant" || childAgeStage === "preschool" ? `<!-- 영아·유아 단계: 떼·고집 두 섹션 미생성 (이 시기 떼는 발달적 본능, 사주 트리거로 풀이 부적절) -->
★ 영아·유아(0~72개월) 케이스이므로 **"### 떼·고집·반항의 진짜 이유"와 "### 떼·고집 대처 단계별 매뉴얼" 두 섹션은 출력하지 마세요**. "떼", "고집", "반항", "트리거", "비견·겁재 강도", "불의 결", "강한 감정 결", "절제 회로", "STOP→NAME→GUIDE", "멈춤·인정·안내" 같은 블록을 어떤 형태로도 작성 금지.` : `### 떼·고집·반항의 진짜 이유
※ 페이지 위에 4가지 트리거 막대 차트가 자동 표시됩니다 (비견·겁재 강도 / 불의 결 / 양인살 발동 / 절제 회로).

본문은 산문 한 단락 (3~5줄). 형식:
1) "${d.childName}${d.childGender === '남' ? '군' : '양'}의 떼·고집은 단순한 응석이 아닙니다." 로 시작
2) 가장 강하게 작동하는 트리거(차트의 TOP1)를 짚어 한 줄
3) 떼는 "내 자리를 인정받지 못했다"는 신호로 읽으라는 부드러운 한 줄로 마무리

★ 사주 용어(비겁·식상·관성 등)는 차트에 이미 표시됨. 본문은 **부모가 일상에서 알아챌 수 있는 행동 신호**로 풀어쓸 것.
★ 4가지 트리거를 본문에서 다시 나열 X.

### 떼·고집 대처 단계별 매뉴얼
※ 페이지 위에 STOP→NAME→GUIDE 3단계 타임라인 카드가 자동 표시됩니다.

본문은 짧은 도입 한 줄 + 3단계 형식 출력. **반드시 아래 형식 그대로**:

도입 한 줄: "떼를 쓸 때 부모도 같이 끓어오르면 불에 기름을 붓는 것과 같아요. 3단계 순서를 지키면 폭발이 30초~1분 안에 가라앉습니다."

**1단계 — 멈춤**: 그 순간 같이 끓어오르지 않기. 한 호흡 쉬고 거리 두기.
**2단계 — 인정**: "지금 화가 났구나" 감정에 이름 붙이기. 옳고 그름은 잠시 보류.
**3단계 — 안내**: 가라앉은 다음 부드럽지만 분명한 선 한 줄.

★ 정확히 위 3단계 패턴(\`**N단계 — 키워드**: 본문\`) 사용. 단계명은 "멈춤·인정·안내" 고정.`}

### 친구 사귀는 스타일
★★★ **반드시 다음 사전 계산 결과만 사용**: 친구 관계 스타일 = **${friendS.dominant}** (페이지 위 4분면 매트릭스와 동일).
다른 스타일로 묘사 절대 금지. ${friendS.dominant}이 또래 관계에서 어떻게 드러나는지 + 친구 수보다 우정의 깊이 + 부모가 살펴볼 한 가지 관찰 포인트.

### 친구 갈등 시 부모 개입 거리
※ 페이지 위에 거리 슬라이더가 자동 표시됩니다 (가까이 ↔ 멀리 사이 권장 위치).

🔴 **차트 결과 — 반드시 본문에 반영**: 이 자녀의 권장 거리 = **${friendDist.label}** (슬라이더 위치 ${friendDist.position}/100, ${friendDist.position < 45 ? "가까이" : friendDist.position < 70 ? "중간" : "멀리"} 영역).
- ❌ **차트와 정반대 묘사 절대 금지** — 차트가 "가까이" 인데 본문은 "한 걸음 떨어져 지켜봐" 같은 멀리 톤 X. 차트가 "멀리" 인데 본문은 "곁에서 함께 풀어줘" 같은 가까이 톤 X.
- ✅ 본문은 차트 라벨 (${friendDist.label.split(" — ")[0]}) 톤으로 일관 묘사.

본문은 한 단락(2~3줄). 슬라이더에 표시된 거리가 왜 이 자녀에게 맞는지 일상 장면으로 풀어쓰기. 사주 용어 직접 노출 X. 부모가 어떻게 거리를 잡으면 좋을지 한 줄 가이드.${childAgeStage === "infant" || childAgeStage === "preschool" ? `
🔴 **영아·유아(0~72개월) 케이스 — 본문 전 문장 미래 톤 일관 강제**:
- 이 시기 자녀는 친구 갈등이 본격화되기 전 단계 (영아: 병행 놀이 / 유아: 단순 다툼)
- ❌ 절대 금지 (전 문장 모두): "지금 ~한다", "아직은 ~하는 시기", "갈등이 생기면 ~해주세요", "자녀가 자기만의 방식으로 친구들과 소통하고 관계를 맺는" 같은 **현재형·단정형 표현 일체**
- ✅ **모든 동사를 미래형으로 통일**: "~할 것입니다", "~하게 될 것입니다", "~해질 것입니다", "~보실 것입니다", "~할 시기가 옵니다"
- ✅ 권장 본문 모범 예시 (차트 거리 = ${friendDist.position < 45 ? "가까이" : friendDist.position < 70 ? "중간" : "멀리"}):
  ${friendDist.position < 45
    ? `"${d.childName}${d.childGender === '남' ? '군' : '양'}이 자라면서 친구 관계가 본격화될 시기가 오면, 부모님께서 **곁에서 마음을 함께 풀어주시면** 좋을 결입니다. 앞으로 자녀는 친구와의 사소한 갈등도 깊이 곱씹는 결을 보일 텐데, 그때 부모님께서 따뜻한 대화로 **함께 이야기 나눠주시면** 자녀의 마음이 자연스럽게 풀어질 것입니다. ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결은 부모님의 가까운 응원 속에서 단단하게 자라날 것입니다."`
    : friendDist.position < 70
    ? `"${d.childName}${d.childGender === '남' ? '군' : '양'}이 자라면서 친구 관계가 본격화될 시기가 오면, 부모님께서 **지켜보시다 신호가 올 때만 다가가시면** 좋을 결입니다. 앞으로 자녀는 스스로 친구 갈등을 풀어가는 시도를 하게 될 텐데, 부모님의 적절한 거리감이 자녀의 자율성을 키워줄 것입니다. ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결은 부모님의 균형 잡힌 거리 속에서 자기만의 페이스로 자라날 것입니다."`
    : `"${d.childName}${d.childGender === '남' ? '군' : '양'}이 자라면서 친구 관계가 본격화될 시기가 오면, 부모님께서 **한 걸음 떨어져 자녀 스스로 풀게 두시면** 좋을 결입니다. 앞으로 자녀는 자존이 단단해 부모 개입을 오히려 거슬려할 텐데, 부모님의 은은한 믿음이 자녀의 결을 단단하게 만들어 줄 것입니다. ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결은 부모님의 따뜻한 거리 속에서 자기만의 페이스로 자라날 것입니다."`}
- ✅ 부모가 **미리 알아두는 안내 형식**. 현재 갈등 있는 것처럼 단정 X.
- ✅ "아직은", "지금은" 같은 시간 부사 사용 금지 — 모든 시제를 **앞으로 / 자라면서 / 시기가 오면** 으로 통일.` : ''}

<!-- 전 연령: "통하는 훈육 vs 역효과 훈육" 섹션 미생성 (4채널 분류가 보편 양육서와 겹쳐 사주 변별력 약함) -->
★ **"### 통하는 훈육 vs 역효과 훈육" 섹션은 어떤 연령에서도 출력하지 마세요**. "단호함", "부드러움", "논리적 설명", "감정적 훈육", "잘 통하는 훈육", "역효과 훈육" 같은 표현을 어떤 형태로도 작성 금지.

${childAgeStage === "infant" || childAgeStage === "preschool" ? `<!-- 영아·유아 단계: 칭찬·잠자리·디지털·자존감 4섹션 미생성 (보편 양육서와 변별 약함, 영아엔 언어 발달 미충족) -->
★ 영아·유아(0~72개월) 케이스이므로 다음 4개 섹션은 모두 출력하지 마세요:
- ### 통하는 칭찬 vs 역효과 칭찬
- ### 잠자리·식습관 안정 조건
- ### 디지털·미디어 균형
- ### 자존감 보호 — 무너졌을 때 부모의 말
관련 표현 ("통하는 칭찬", "역효과 칭찬", "수면·식사·움직임·디지털 게이지", "자존감 카드", "부모의 한 마디", "[좋은 칭찬]", "[역효과 칭찬]", "[멘트]") 일체 작성 금지.` : `### 통하는 칭찬 vs 역효과 칭찬
※ 페이지 위에 좌우 대비 카드가 자동 표시됩니다 (통하는 칭찬 3 vs 역효과 칭찬 3).

★★★ **반드시 이 형식 그대로 출력** (다른 텍스트·서론·해설 일체 금지):

[좋은 칭찬]
• [이모지] **실제 멘트(쌍따옴표 없이)** — 왜 이 칭찬이 닿는지 한 줄
• [이모지] **실제 멘트** — 왜 닿는지 한 줄
• [이모지] **실제 멘트** — 왜 닿는지 한 줄

[역효과 칭찬]
• [이모지] **실제 멘트** — 왜 역효과인지 한 줄
• [이모지] **실제 멘트** — 왜 역효과인지 한 줄
• [이모지] **실제 멘트** — 왜 역효과인지 한 줄

[좋은 예]
[좋은 칭찬]
• 👍 **포기 안 하고 끝까지 했네** — 결과보다 과정을 짚어주는 칭찬이 끈기의 결을 키웁니다
• 💛 **네가 그렇게 결정한 이유 멋지다** — 자기 주관을 인정해주는 결이 자존감의 뿌리가 됩니다
• ✨ **너 자체가 좋아, 무슨 일이든** — 존재 자체를 인정받을 때 마음이 가장 안정됩니다

[역효과 칭찬]
• 🚫 **역시 천재네** — 결과만 칭찬하면 실패가 두려워 도전을 피하게 됩니다
• ⚠ **다른 친구보다 잘했어** — 비교 칭찬은 자기 자존이 강한 자녀의 마음을 흔듭니다
• 📉 **착하구나** — 추상적 칭찬은 무엇을 인정받았는지 모호해 흡수가 안 됩니다

★ 6개 카드 이모지 모두 다름. 멘트는 부모가 실제로 쓸 수 있는 자연스러운 한국어.

### 잠자리·식습관 안정 조건
※ 페이지 위에 4채널 게이지(수면·식사·움직임·디지털)가 자동 표시됩니다.

본문은 한 단락(3~4줄). 게이지에서 가장 "높음"으로 뜬 채널 1~2개를 짚어 일상에서 어떻게 챙겨주면 좋은지 구체적 장면으로. 사주 용어 직접 노출 X.

### 디지털·미디어 균형
※ 페이지 위에 디지털 위험도 게이지·권장 시간이 자동 표시됩니다.

본문은 한 단락(2~3줄). 게이지의 권장 시간을 어떻게 적용할지, 차단보다 자율 연습으로 가는 길 한 줄. 사주 용어 노출 X.

### 자존감 보호 — 무너졌을 때 부모의 말
※ 페이지 위에 부모의 한 마디 카드 3장이 자동 표시됩니다.

★★★ **반드시 이 형식 그대로 출력**:

[멘트]
• [이모지] **시나리오(친구·학교·실패 중 하나)** — 그 순간 부모가 건넬 실제 한 마디(쌍따옴표 안에 자연스러운 한국어)
• [이모지] **시나리오** — 실제 한 마디
• [이모지] **시나리오** — 실제 한 마디

[좋은 예]
[멘트]
• 🌸 **친구에게 거절당했을 때** — 그 마음 많이 아팠겠다. 너 잘못이 아니야, 그냥 결이 안 맞은 거야
• 🌿 **시험·발표 망쳤을 때** — 결과보다 너가 도전한 게 더 멋졌어. 다음에도 그 결로 가자
• 🕊️ **자기를 미워하는 말 할 때** — 너가 너를 그렇게 보면 안 돼. 엄마 눈에는 너의 빛이 보여

★ 시나리오 3개는 모두 다른 상황. 멘트는 시적이지 않게, 부모가 실제로 입에 담을 자연스러운 톤.`}

### 절대 하면 안 되는 5가지
※ 페이지 위에 5장의 위험도 카드가 자동 표시됩니다 (가장 치명적인 2개는 빨간 강조 + 사주 근거 박스).

★★★ **반드시 다음 사전 계산 결과만 사용**: 가장 치명적인 1순위 = **${dangerSorted[0].name}**, 2순위 = **${dangerSorted[1].name}** (카드와 동일).

본문에는 **카드의 5가지를 다시 나열하지 말 것**. 다음 형식으로 **2문장 한 단락**으로 압축:
"${d.childName}${d.childGender === '남' ? '군' : '양'}에게 가장 조심해야 할 한 가지는 **${dangerSorted[0].name}** 입니다." 로 시작 → 부모가 무의식적으로 하기 쉬운 말·행동 한 줄 경고로 마무리. 총 2문장 분량.

★ 사주 근거(비겁·식상·인성 등 십성 용어)는 카드에서 이미 다루므로 본문에서는 **일상 행동·말투·장면 중심**으로. 십성 용어 직접 언급 X.
★ 절대 5개 항목을 불릿으로 나열 X. 길게 쓰지 말 것 — 카드 정보와 중복되지 않게 압축적으로.

${hasMom ? `## 엄마와 우리 아이

### 엄마 vs 아이 사주 비교
※ 페이지 위에 5각 레이더(엄마 vs 아이 오행 분포 겹친 차트)가 자동 표시됩니다.

본문은 한 단락(2~3줄). 차트의 **가장 비슷한 비중의 결: ${momCompare?.similar.kor ?? "—"}** 과 **가장 비중이 다른 결: ${momCompare?.different.kor ?? "—"}** 이 일상에서 어떻게 드러나는지 풀어쓰기.

🔴 **비중 정보 (반드시 본문 톤에 반영)**:
- 닮은 결 (${momCompare?.similar.kor ?? "—"}) — 어머니 ${momCompare?.similar.parentPct ?? 0}% / 자녀 ${momCompare?.similar.childPct ?? 0}% / 평균 ${momCompare?.similar.avgPct ?? 0}%
- 다른 결 (${momCompare?.different.kor ?? "—"}) — 어머니 ${momCompare?.different.parentPct ?? 0}% / 자녀 ${momCompare?.different.childPct ?? 0}%

🔴 **평균 비중별 본문 톤 분기 (반드시 일치)**:
- 평균 **≤20%** (둘 다 약함): "두 분 모두 ${momCompare?.similar.kor} 의 결이 **약한 편**" 톤. ❌ "활기찬 열정" 같이 강한 결로 표현 금지. ✅ "외부에서 보충하면 좋은 결" 같은 부드러운 톤.
- 평균 **21~30%** (둘 다 적당): "두 분 모두 ${momCompare?.similar.kor} 의 결이 **적당히** 자리 잡고 있음" 톤.
- 평균 **≥30%** (둘 다 강함): "두 분 모두 ${momCompare?.similar.kor} 의 결이 **두드러지게** 강함" 톤.

🔴 **AI hallucination 차단**: 위 차트가 명시한 **두 결만** 본문에 사용. 차트에 없는 다른 오행 절대 임의 추가 금지.
✅ "닮은 결"의 의미: **두 분의 사주에서 비슷한 비중을 차지하는 결** (절대량이 아닌 비율). 비중도 본문에 반영.
차트 수치 (%) 직접 노출 X. 사주 용어(일간·비화 등) 노출 X.

### 일간 관계의 결
※ 페이지 위에 일간 관계 카드(좌-중-우 흐름)가 자동 표시됩니다.

본문은 한 단락(2~3줄). 카드에 표시된 관계(키우는·다듬는·닮은)가 ${d.momName}님과 ${d.childName}의 일상에 어떻게 펼쳐지는지 부드러운 톤으로. 한자·"일간"·"비화" 등 사주 용어 직접 언급 X — "~의 본질이 만나는 결"·"엄마의 결이 아이를 ~" 식 풀어쓰기.
🔴 부정 어휘·한자 ban — [★★★ 자녀 보고서 절대 원칙] 그대로 적용.
★ 본문 마지막은 **균형형 마무리 두 문장** 권장 — 자원(가르침이 뿌리가 됨) + 한계(지나치지 않을 때) 함께 표현:

[형식]
"[부모 호칭]의 [관계 키워드]이 자녀에게 [자원 메타포: 단단한 뿌리·따뜻한 빛·새 시야 등]가 되어주는 결입니다. 다만 [부드러운 한계 조건: 너무 빠르거나 강하게 닿지 않을 때 / 자녀의 페이스를 침범하지 않을 때 / 한 박자 늦춰 다가가실 때], ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결이 자기 박자로 단단하게 자라납니다."

[좋은 예 — 극(剋) 관계]
"아버님의 확고한 가르침이 자녀에게 단단한 뿌리가 되어주는 결입니다. 다만 너무 빠르거나 강하게 닿지 않을 때, ${d.childName}양의 결이 자기 박자로 단단하게 자라납니다."

[좋은 예 — 생(生) 관계]
"어머님의 따뜻한 결이 자녀에게 자라남을 키워주는 결입니다. 다만 자녀의 호흡을 지켜보며 다가가실 때, ${d.childName}양의 결이 자기 색으로 자연스럽게 피어납니다."

❌ 절대 금지: "다음 페이지", "후속 페이지" 같은 메타 언급. "부작용", "위험", "조심해야"·"주의해야" 같은 의학·경고 어휘.
✅ 자원(긍정) + 부드러운 조건(한계) 둘 다 인정하는 균형 톤. 부모 자긍심 + 적절한 행동 가이드 함께.

### 엄마가 채워주는 vs 부족한 기운
※ 페이지 위에 흐름 차트(엄마 → 아이 채워주는 결 + 둘 다 약한 결)가 자동 표시됩니다.

[차트 결과 — 반드시 이대로만 본문에 사용]
- 가장 큰 채워주는 결: ${momFlow?.parentGives[0]?.kor ?? "(없음 — 임계값 미달)"}${momFlow?.parentGives[0] ? ` (+${momFlow.parentGives[0].intensity}%)` : ""}
- 두 번째: ${momFlow?.parentGives[1]?.kor ?? "(없음)"}
- 둘 다 약한 결: ${momFlow?.bothLack.map(b => b.kor).join("·") || "(없음)"}
- Fallback 케이스: ${(momFlow?.parentGives.length ?? 0) === 0 ? "예 — 차트가 'fallback' 메시지로 표시됨" : "아니오"}

🔴 **AI hallucination 차단 — 본문 작성 규칙**:
- 본문은 위 차트 결과의 element 만 사용. 다른 오행(예: 차트에 없는 "쇠의 결" 같은 것) 임의 추가 절대 금지.
- Fallback "예" 케이스: "특별히 채워주는 결은 없고, 두 분 모두 ${momFlow?.bothLack[0]?.kor ?? "어떤"} 결이 약하니..." 톤으로 작성. element 단정 금지.
- Fallback "아니오" 케이스: "어머님께서 채워주는 가장 큰 기운은 **${momFlow?.parentGives[0]?.kor ?? ""}**입니다..." 톤. 차트 element 그대로 인용.

본문은 한 단락(2~3줄). 사주 용어 노출 X.${hasDad ? '\n★ 아빠도 입력 — 아빠 섹션과 겹치는 결은 차트가 자동 표시하므로 본문에서 다시 짚지 말 것.' : ''}

### 잘 통하는 영역 — 시너지
※ 페이지 위에 시너지 카드 3장이 자동 표시됩니다.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (자녀 일간 오행 기반, 어휘 변경 절대 금지)**:

[시너지]
• ${momSynergy?.[0]?.emoji ?? "🎨"} **${momSynergy?.[0]?.keyword ?? "함께하는 활동"}** — ${momSynergy?.[0]?.body ?? "두 분의 결이 자연스럽게 어우러집니다"}
• ${momSynergy?.[1]?.emoji ?? "🌿"} **${momSynergy?.[1]?.keyword ?? "조용한 공간"}** — ${momSynergy?.[1]?.body ?? "차분한 환경에서 마음이 가장 잘 통합니다"}
• ${momSynergy?.[2]?.emoji ?? "💬"} **${momSynergy?.[2]?.keyword ?? "마음 나누는 시간"}** — ${momSynergy?.[2]?.body ?? "두 분의 친밀함을 키웁니다"}

🔴 위 매트릭스 결과를 **이모지·키워드·본문 모두 그대로** 출력. AI 가 임의로 변경 X. 일반 양육 어휘 (그림·도서관·잠자리 대화 등) 첨가 금지 — 위 결정론 결과만 사용.

### 갈등이 반복되는 지점
※ 페이지 위에 충돌 카드 2~3장이 자동 표시됩니다.

★★★ **반드시 이 형식 그대로 출력** (각 카드는 세 줄: 본문 + 📌 사주 근거 + 💡 가이드):

[갈등]
• [이모지] **엄마의 결 ↔ 아이의 결** — 그 차이가 일상에서 어떻게 부딪히는지 한 줄
  📌 엄마 [십성/오행 카운트] vs 아이 [십성/오행 카운트]
  💡 어머님이 어떻게 보완하시면 좋을지 부드러운 행동 한 줄
• [이모지] **엄마의 결 ↔ 아이의 결** — 한 줄
  📌 엄마 [...] vs 아이 [...]
  💡 어머님 가이드 한 줄

[좋은 예]
[갈등]
• ⚡ **서두름 ↔ 느림** — 엄마가 다음 일정을 챙기는 사이 아이는 자기 호흡으로 머무르고 싶어 합니다
  📌 엄마 식상(食) 3 vs 아이 인성(印) 3
  💡 결정 전 5분 자녀의 시간을 두시면 자녀의 결이 자기 흐름으로 자랍니다
• 🌊 **계획 ↔ 즉흥** — 엄마는 정리된 흐름을 좋아하고 아이는 떠오르는 대로 움직이고 싶어합니다
  📌 엄마 정관(官) 2 vs 아이 식상(食) 1
  💡 큰 틀만 정해주시고 세부는 자녀가 선택할 여백을 남겨 주세요

★ 2~3개 모두 키워드 짧게(2~4글자), 충돌이 어떤 일상 장면에서 드러나는지 구체적으로.
★ 📌 사주 근거 한 줄은 **사전 계산 결과의 십성/오행 카운트**만 사용. 한글 풀이(한자 병기) + 카운트 형식. 추측·해석 금지.
★ 💡 가이드 한 줄은 **장면 처방형** — 부모가 즉시 입에 담거나 행동할 수 있는 구체 행동 (예: "결정 전 5분 기다림", "한 마디로 시작", "큰 틀만 정해주기"). 추상 표현 X.

### 엄마가 의식적으로 조절할 점
※ 페이지 위에 선물 박스 카드(큰 1장)가 자동 표시됩니다.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (자녀 일간 오행 기반, 어휘 변경 절대 금지)**:

[선물]
${momGift?.emoji ?? "🎁"} **${momGift?.keyword ?? "있는 그대로 봐주기"}** — ${momGift?.quote ?? "어머님의 결이 가장 빛나는 길입니다"}

🔴 위 매트릭스 결과를 **이모지·키워드·본문 모두 그대로** 출력. AI 가 임의로 변경 X. 마크다운 \`**...**\` 강조도 그대로 유지.

` : ''}${hasDad ? `## 아빠와 우리 아이

### 아빠 vs 아이 사주 비교
※ 페이지 위에 5각 레이더(아빠 vs 아이 오행 분포 겹친 차트)가 자동 표시됩니다.

본문은 한 단락(2~3줄). 차트의 **가장 비슷한 비중의 결: ${dadCompare?.similar.kor ?? "—"}** 과 **가장 비중이 다른 결: ${dadCompare?.different.kor ?? "—"}** 을 일상 장면으로 풀어쓰기. 아버님 특유의 "기둥의 결"(안정·방향성) 관점.

🔴 **비중 정보 (반드시 본문 톤에 반영)**:
- 닮은 결 (${dadCompare?.similar.kor ?? "—"}) — 아버지 ${dadCompare?.similar.parentPct ?? 0}% / 자녀 ${dadCompare?.similar.childPct ?? 0}% / 평균 ${dadCompare?.similar.avgPct ?? 0}%
- 다른 결 (${dadCompare?.different.kor ?? "—"}) — 아버지 ${dadCompare?.different.parentPct ?? 0}% / 자녀 ${dadCompare?.different.childPct ?? 0}%

🔴 **평균 비중별 본문 톤 분기 (반드시 일치)**:
- 평균 **≤20%** (둘 다 약함): "두 분 모두 ${dadCompare?.similar.kor} 의 결이 **약한 편**" 톤. ❌ "활기찬 열정" 같은 강한 결로 묘사 금지. ✅ "외부에서 보충하면 좋은 결" 톤.
- 평균 **21~30%** (둘 다 적당): "두 분 모두 ${dadCompare?.similar.kor} 의 결이 **적당히** 자리 잡고 있음" 톤.
- 평균 **≥30%** (둘 다 강함): "두 분 모두 ${dadCompare?.similar.kor} 의 결이 **두드러지게** 강함" 톤.

🔴 **AI hallucination 차단**: 위 차트가 명시한 **두 결만** 본문에 사용. 차트에 없는 다른 오행 임의 추가 금지.
✅ "닮은 결"의 의미: **두 분의 사주에서 비슷한 비중을 차지하는 결** (절대량이 아닌 비율). 비중도 본문에 반영.${hasMom ? '\n★ 어머님 비교(PART 4)와 톤·내용 자연스럽게 이어지되, 아버님 특유 결 강조 — 부드러움보다 기둥·방향성.' : ''}

### 일간 관계의 결
※ 페이지 위에 일간 관계 카드가 자동 표시됩니다.

본문은 한 단락(2~3줄). 카드의 관계가 ${d.dadName}님과 ${d.childName}의 일상에 어떻게 드러나는지.${hasMom ? '\n★ 엄마-아이 일간 관계와 같으면 "두 분 모두 ~한 결로 만나심", 다르면 "엄마와 다른 결로 보완하시는 아빠" 식 한 줄.' : ''}
🔴 부정 어휘·한자 ban — [★★★ 자녀 보고서 절대 원칙] 그대로 적용. "다듬는 결" 카드라도 "단단히 받쳐주는 결"·"방향을 짚어주는 결" 등 부드러운 어휘만 사용.${hasMom ? `
🔴 **자녀 본질 묘사 중복 금지** (mom 섹션 Part 05 와 차별화):
- mom 섹션이 자녀를 "환하게 비추는 불의 본질" / "햇살 같은 결" / "밝게 빛나는" 등으로 묘사했으니, dad 섹션은 **다른 측면**으로 표현.
- ✅ dad 섹션 자녀 묘사 권장 어휘: "따뜻하게 자라나는 빛" / "안에서 영그는 햇살" / "꽃봉오리 같은 결" / "아직 펼쳐질 가능성의 빛" — 자녀의 잠재력·자라남 측면 강조.
- ✅ 또는 자녀 본질 묘사 짧게 또는 생략, 대신 만남·관계 묘사에 집중 ("두 결이 만나면..." 같은 시작).
- ❌ mom 섹션과 동일한 자녀 묘사 어휘 절대 반복 금지.` : ""}
${hasMom ? `★ 본문 마지막은 **균형형 마무리 두 문장** 권장 — 자원(가르침이 뿌리가 됨) + 한계(지나치지 않을 때) 함께 표현 (mom 섹션과 동일 패턴이지만 어휘는 다르게).` : ''}
★ 본문 마지막은 **균형형 마무리 두 문장** 권장 — 자원(가르침이 뿌리가 됨) + 한계(지나치지 않을 때) 함께 표현:

[형식]
"[부모 호칭]의 [관계 키워드]이 자녀에게 [자원 메타포: 단단한 뿌리·따뜻한 빛·새 시야 등]가 되어주는 결입니다. 다만 [부드러운 한계 조건: 너무 빠르거나 강하게 닿지 않을 때 / 자녀의 페이스를 침범하지 않을 때 / 한 박자 늦춰 다가가실 때], ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결이 자기 박자로 단단하게 자라납니다."

[좋은 예 — 극(剋) 관계]
"아버님의 확고한 가르침이 자녀에게 단단한 뿌리가 되어주는 결입니다. 다만 너무 빠르거나 강하게 닿지 않을 때, ${d.childName}양의 결이 자기 박자로 단단하게 자라납니다."

[좋은 예 — 생(生) 관계]
"어머님의 따뜻한 결이 자녀에게 자라남을 키워주는 결입니다. 다만 자녀의 호흡을 지켜보며 다가가실 때, ${d.childName}양의 결이 자기 색으로 자연스럽게 피어납니다."

❌ 절대 금지: "다음 페이지", "후속 페이지" 같은 메타 언급. "부작용", "위험", "조심해야"·"주의해야" 같은 의학·경고 어휘.
✅ 자원(긍정) + 부드러운 조건(한계) 둘 다 인정하는 균형 톤. 부모 자긍심 + 적절한 행동 가이드 함께.

### 아빠가 채워주는 vs 부족한 기운
※ 페이지 위에 흐름 차트가 자동 표시됩니다.

[차트 결과 — 반드시 이대로만 본문에 사용]
- 가장 큰 채워주는 결: ${dadFlow?.parentGives[0]?.kor ?? "(없음 — 임계값 미달)"}${dadFlow?.parentGives[0] ? ` (+${dadFlow.parentGives[0].intensity}%)` : ""}
- 두 번째: ${dadFlow?.parentGives[1]?.kor ?? "(없음)"}
- 둘 다 약한 결: ${dadFlow?.bothLack.map(b => b.kor).join("·") || "(없음)"}
- Fallback 케이스: ${(dadFlow?.parentGives.length ?? 0) === 0 ? "예 — 차트가 'fallback' 메시지로 표시됨" : "아니오"}

🔴 **AI hallucination 차단 + 부모 간 중복 차단**:
- 본문은 위 차트 결과의 element 만 사용. 다른 오행 임의 추가 절대 금지.
- Fallback "예" 케이스: "특별히 채워주는 결은 없고, 두 분 모두 ${dadFlow?.bothLack[0]?.kor ?? "어떤"} 결이 약하니..." 톤. element 단정 금지.
- Fallback "아니오" 케이스: "아버님께서 채워주는 가장 큰 기운은 **${dadFlow?.parentGives[0]?.kor ?? ""}**입니다..." 톤.${hasMom ? `
- 🔴 **엄마 섹션(Part 05)과 키워드·element 중복 금지**: 엄마 섹션이 같은 element 를 다뤘다면 dad 섹션은 다른 측면(아빠 특유의 안정·방향성·기둥의 결)으로 풀이. 아빠가 다루는 element 가 엄마와 다르면 본문에서 그 차이를 명시 ("어머님이 ~ 결이라면 아버님은 ~ 결").` : ""}

본문은 한 단락(2~3줄). 사주 용어 노출 X.${hasMom ? '\n★ 엄마와 겹치는 결은 차트가 자동 표시 — 본문에서 다시 짚지 말 것. 아빠만 흘려주는 결 위주로.' : ''}

### 잘 통하는 영역 — 시너지
※ 페이지 위에 시너지 카드 3장이 자동 표시됩니다.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (자녀 일간 오행 기반, 어휘 변경 절대 금지)**:

[시너지]
• ${dadSynergy?.[0]?.emoji ?? "🌳"} **${dadSynergy?.[0]?.keyword ?? "함께하는 활동"}** — ${dadSynergy?.[0]?.body ?? "두 분의 결이 자연스럽게 어우러집니다"}
• ${dadSynergy?.[1]?.emoji ?? "🏞️"} **${dadSynergy?.[1]?.keyword ?? "넓은 공간"}** — ${dadSynergy?.[1]?.body ?? "자녀가 자기 길을 펼칩니다"}
• ${dadSynergy?.[2]?.emoji ?? "💪"} **${dadSynergy?.[2]?.keyword ?? "도전 격려"}** — ${dadSynergy?.[2]?.body ?? "자녀의 결을 단단히 받쳐줍니다"}

🔴 위 매트릭스 결과를 **이모지·키워드·본문 모두 그대로** 출력. AI 가 임의로 변경 X. 일반 양육 어휘 첨가 금지 — 위 결정론 결과만 사용.${hasMom ? '\n★ mom 시너지 (Part 05) 와 겹치는 카드가 있어도 그대로 출력 (parentRole 분기로 mom·dad 메타포가 다르게 설계됨).' : ''}

### 갈등이 반복되는 지점
※ 페이지 위에 충돌 카드 2~3장이 자동 표시됩니다.

★★★ **반드시 이 형식 그대로 출력** (각 카드는 세 줄: 본문 + 📌 사주 근거 + 💡 가이드):

[갈등]
• [이모지] **아빠의 결 ↔ 아이의 결** — 일상 장면 한 줄
  📌 아빠 [십성/오행 카운트] vs 아이 [십성/오행 카운트]
  💡 아버님이 어떻게 보완하시면 좋을지 부드러운 행동 한 줄
• [이모지] **아빠의 결 ↔ 아이의 결** — 한 줄
  📌 아빠 [...] vs 아이 [...]
  💡 아버님 가이드 한 줄

[좋은 예]
[갈등]
• 🛡️ **명확함 ↔ 즉흥** — 아빠가 정해진 길을 이야기할 때 아이는 자기만의 방식으로 흐르려 합니다
  📌 아빠 비겁(比) 2 vs 아이 식신(食) 3
  💡 큰 방향만 정해주시고 세부는 자녀가 선택할 여백을 남겨 주세요

★ 2~3개. 아빠 특유 결(단호함·기준·방향성)과 아이의 결이 부딪히는 지점.${hasMom ? '\n★ 엄마와 겹치는 갈등은 다시 쓰지 말고 아빠만의 갈등으로.' : ''}
★ 📌 사주 근거 한 줄은 **사전 계산 결과의 십성/오행 카운트**만 사용. 한글 풀이(한자 병기) + 카운트 형식. 추측·해석 금지.
★ 💡 가이드 한 줄은 **장면 처방형** — 아버님이 즉시 입에 담거나 행동할 수 있는 구체 행동. 추상 표현 X.

### 아빠가 의식적으로 조절할 점
※ 페이지 위에 선물 박스 카드가 자동 표시됩니다.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (자녀 일간 오행 기반, 어휘 변경 절대 금지)**:

[선물]
${dadGift?.emoji ?? "🎁"} **${dadGift?.keyword ?? "흔들림 없는 자리"}** — ${dadGift?.quote ?? "아버님의 결이 가장 빛나는 길입니다"}

🔴 위 매트릭스 결과를 **이모지·키워드·본문 모두 그대로** 출력. AI 가 임의로 변경 X. 마크다운 \`**...**\` 강조도 그대로 유지.

` : ''}## 강점·재능·진로

### 타고난 재능 영역
★★★ **반드시 다음 사전 계산 결과만 사용**: 이 자녀의 TOP 3 재능 = **${intel8Top3}** (페이지 위 카드와 동일).
이 외 다른 재능은 절대 언급하지 말 것. 위 3가지를 어떤 환경에서 빛내는지 한 단락으로 풀어주세요.

### 호기심·끌림 영역
이 자녀가 자석처럼 끌리는 분야. 일간 오행 + 식상·인성 조합으로 도출 — "손에 잡히는 것" / "이야기·사람" / "수와 패턴" / "자연·생명" / "소리·움직임" 중 어디에 자꾸 멈춰 서는지. 이 호기심을 막지 말고 따라가도록.

### 사고 유형
★★★ **반드시 다음 사전 계산 결과만 사용**: 이 자녀의 사고 유형 = **${thinkingT.dominant}** (페이지 위 매트릭스와 동일).
다른 유형으로 묘사 절대 금지. ${thinkingT.dominant}이 ${d.childName}의 일상에서 어떻게 드러나는지 + 사주 근거 한 단락으로.

### 학습 스타일
시각형(보면서 이해) / 청각형(들으면서 이해) / 체험형(만지고 움직이면서 이해) / 토론형(말로 풀면서 이해) 중 어떤 결로 배우는지. 사주 근거 한 줄.

### 효과적 학습 환경
이 자녀가 가장 잘 집중하는 환경. 조용한 혼자 vs 시끌벅적 함께 / 정리된 공간 vs 자유로운 공간 / 일정한 시간 vs 유연한 시간. 사주 결에서 도출. 어머니가 어떤 환경을 만들어주면 좋은지.

### 진로 적합 vs 피해야 할 영역
★★★ **반드시 다음 사전 계산 결과만 사용** (페이지 위 6각 레이더와 동일):
- 가장 닿는 결 TOP 3 = **${jobTop3}** (1위: ${jobTop1.name} ${jobTop1.score}점)
- 가장 약해 피해야 할 결 = **${jobAvoid.name}** (${jobAvoid.score}점)

위 TOP 3가 어떤 환경에서 빛나는지 + ${jobAvoid.name}이 왜 이 자녀에게 부담이 되는지 한 단락으로 풀어주세요.
**다른 진로 결은 절대 언급 X. 직업명 단정 금지 — 결과 분야 중심.**

## 자도인의 마지막 당부

### 자도인의 마지막 한마디
${d.momName}님과 ${d.childName} 사이의 인연을 관통하는 가장 핵심적인 메시지. 정확히 4~6문장. 시적이지만 구체적. 자연 비유로 녹일 것. 칼릴 지브란의 《예언자》 자녀 편 한 구절을 자연스럽게 인용 — 예: "당신의 자녀는 당신의 자녀가 아닙니다. 그들은 생명 그 자체의 아들과 딸입니다." 부모 다독임 표현 절대 금지 — 사주적 미래상으로 마무리.

마지막에 빈 줄 하나 띄고 다음 한 줄을 정확히 그대로 출력 (글자 그대로):
"※ 본 풀이는 사주명리학을 현시대 어머니의 언어로 재표현한 양육 안내이며, 의학적 진단·치료가 아닙니다. 자녀의 결은 사주에 환경·경험이 더해져 만들어집니다."

[규칙]
- 두 분 모두에게 따뜻한 시선 (아이를 평가·단정하지 말고 이해하기)
- "${d.momName}님이", "${d.childName}가/${d.childName}는" 자연스럽게 호명
- 구체적 간지·오행·십성 근거 반드시 포함 (바넘 금지)
- 한자 사자성어 섹션당 1~2개 가능 (모자상생·천륜지정·자모지애·청출어람·대기만성 등 의미 한글 병기)
- 어머니에게 죄책감 주는 표현 금지 (예: "엄마가 잘못해서~" X)
- 아이를 단정 짓는 표현 금지 (예: "이 아이는 평생 ~할 것" X) — "~할 가능성이 높습니다" 같은 가능성으로
- 특정 직업명 단정 금지 (의사·변호사 등) — 분야·성향으로 표현
- 천재·영재 같은 단어를 남발하면 가벼워 보이니, 정말 두드러질 때만 신중히 사용
- 아이 현재 단계(${stage}) 가이드대로 시제·관점 일관 유지
- ★ 점수·숫자·등급·만점·% 같은 정량 평가 표현 절대 사용 금지 (사주는 점수 매기는 게 아니라 결을 읽는 것)
- ★ 트렌디 표현·신조어 절대 금지 (도파민·갓생·꿀이 떨어지는·찰떡·MZ·겉바속촉 등) — 이곳은 정통 사주명리학 도원이며, 엄중하고 정중한 명리학자의 톤만 사용
- ★ 부정적 신살 명칭 사용 금지 (망신·백호·재살·탕화·원진·고신·과숙·공망 등) — 사주에 그런 기운이 있더라도 부드럽게 표현
- ★ 시기 언급은 반드시 현재 이후만 (이미 지나간 과거 시기를 들춰내지 말 것). 다가올 시기는 대략적으로 ("앞으로 ~한 시기에", "사춘기에 들어서면" 등)
- ★ 이모지·이모티콘 사용 금지 (일반 본문 한정 — 시너지·갈등·선물·회복·강점 카드 페이지는 결정론 매트릭스의 이모지 그대로 출력 OK).
- ★ 각 ### 소제목 아래 본문은 약 280~360자, 2~3문단 일관 유지 (각 ### 가 한 페이지). 너무 짧거나 너무 길지 않게 슬라이드 간 분량 균형. 단, 첫 섹션 "자도인의 첫마디"만 ### 없이 한 단락(2~3문장)
- ★ 핵심 사주 용어(일간·일지·월지·신살명·오행·격국·용신), 인물 이름, 결론적 표현은 반드시 **굵게**(마크다운) 처리하여 가독성을 높일 것 — 예: "**일간은 갑목(甲木)**으로", "**채워주는 火의 기운**", "**천을귀인(天乙貴人)이 든 자리**". 한 문단당 2~3개 정도의 굵게 마크업이 자연스러움
- "아이"라는 호칭보다 "자녀"라는 호칭을 기본으로 사용 ("자녀의 일주", "자녀가 ~합니다")
- ★★ 이곳은 사주명리학에 뿌리를 둔 양육 자문 도원입니다. 모든 풀이는 사주 근거에서 출발해야 하며, **사주 결을 토대로 한 양육 가이드는 적극 권장** (떼쓰기 대응법, 친구 관계, 잠자리·식습관, 디지털 기기 등 — 단 반드시 사주 근거에서 도출). 그러나 사주와 무관한 일반 육아 팁(예: "10시 전에 재우세요" 같은 시간표, "당근을 먹이세요" 같은 식단 매뉴얼)은 금지. 양육 가이드는 "이 자녀의 OO 결이 강하기 때문에 OO한 방향이 닿습니다" 식으로 사주 결과 연결해서 풀이
- 🔴 부정 어휘·한자 ban — 위 [★★★ 자녀 보고서 절대 원칙] 의 자원 프레임 절대 원칙 그대로 적용.
- ★ 한자를 사용할 때는 반드시 한글 음을 함께 표기 — 예: "用神(용신)", "本氣(본기)", "天德貴人(천덕귀인)", "比和(비화)". 한자만 단독 사용 X, 한자 옆 괄호로 한글 음 병기 필수
- ★ **사자성어 정확화 가이드 — 어머니/딸 vs 어머니/아들 구분 필수**:
  ✗ 모자상생(母子相生) — "모자"는 어머니·아들 한정. **딸 자녀에게는 절대 사용 금지**.
  ✗ 청출어람(青出於藍) — "쪽에서 나온 푸른빛이 쪽보다 더 푸르다" = 자녀가 부모보다 뛰어나다는 뜻. **"어머니를 빛나게 하는 자식" 같은 부정확한 풀이 절대 금지**. 사용 시 정확한 뜻으로만 ("자녀가 어머니의 결을 이어 더 깊이 자라난다" 식).
  ✓ 성별 중립 안전 사자성어:
   - 천륜지정(天倫之情) — 하늘이 맺어준 부모자식의 정
   - 자모지애(慈母之愛) — 자애로운 어머니의 사랑
   - 부모은중(父母恩重) — 부모의 은혜가 깊고 무거움
   - 모녀상생(母女相生) — 어머니와 딸의 상생 (딸 자녀일 때만)
   - 모자상생(母子相生) — 어머니와 아들의 상생 (아들 자녀일 때만)
   - 대기만성(大器晚成) — 큰 그릇은 늦게 이루어짐
   - 적선지가(積善之家) — 선을 쌓은 집안
  ★ 사자성어를 쓸 때 그 뜻이 이 자녀·이 가족에게 정말 맞는지 신중히 판단. 안 맞으면 사용 금지.
- ★ **시기 언급은 0~25세 범위 내에서만** — 30대 이후, 40대 이후, "인생 후반" 같은 먼 미래 표현 절대 사용 금지. 자도인은 어린 자녀를 둔 어머니 자문이며, 0-25세 양육에 집중.
- ★★ **부모 다독임·위로 표현 영구 차단**: "어머니 잘못이 아니에요" / "어머니는 잘 해오고 계세요" / "너무 걱정 마세요" / "아이는 건강하게 자랄 거예요" / "어머니, 힘드시죠" / "괜찮습니다, OO하시면 됩니다" 같은 위로·다독임 표현 절대 사용 금지. 자도인은 상담사가 아니라 사주 도인입니다. 풀이는 사주에서 도출된 자녀의 결을 들여다보는 독백이며, 부모 감정 케어가 아닙니다.
- ★ **단정 표현 → 가능성 어조**: "이 아이는 OO합니다" 단정 금지. "**~한 모습이 자주 보여집니다**" / "**~한 결이 올라올 수 있습니다**" / "**~한 순간이 잦으실 겁니다**" 같은 패턴 추정 어조로 일관 유지.
- ★ **본론 직진**: 도입부에 "${d.childName}는 ~한 자녀입니다" 또는 "${d.childName}님은 OO 일간이라" 같은 호명·일간 소개로 시작 금지. 바로 자녀의 내면부터 직진.
- 한국어 경어체, 날카롭되 따뜻하게. 시적이지만 구체적.`;
}

// ─── 관계 유형별 분기 헬퍼 (홍도인 매칭 전용) ──
// 펫(반려동물)은 정통 사주명리학 영역 밖이라 매칭 대상에서 제외
type MatchingRelCategory = "romantic" | "social" | "family" | "fan" | "custom";
function relCategoryOf(relType: string): MatchingRelCategory {
  if (["썸남썸녀", "연인", "배우자", "전연인", "전배우자"].includes(relType)) return "romantic";
  if (["친구", "직장동료", "사업파트너"].includes(relType)) return "social";
  if (["형제자매"].includes(relType)) return "family";
  if (["아이돌과팬", "아이돌과아이돌"].includes(relType)) return "fan";
  return "custom";
}

// 섹션 7·8을 관계 유형별로 다르게 작성
function getRelSections(cat: MatchingRelCategory, d: Record<string,string>, compat: CompatibilityResult) {
  const ilji = compat.branchRelations.ilji;
  switch (cat) {
    case "romantic":
      return {
        s7Header: "둘만의 시간의 결",
        s7Body: `일지(日支) 관계 — ${ilji}. 배우자궁(配偶宮)에서 본 두 분만의 친밀함의 결. 손을 잡는 결, 마음을 여는 결, 함께 잠드는 결. 신뢰·끌림·답답함의 미묘한 결을 정중하고 시적으로 풀어주세요. 절대 노골적·저속한 표현 금지.`,
        s8Header: "인연의 깊이",
        s8Body: `지지 합·충 종합 — 삼합/육합이 있으면 "운명적", 충이 많으면 "도전적". **결혼·평생 인연**까지 갈 가능성을 두 사람 사주 구조로 평가.`,
      };
    case "social":
      return {
        s7Header: "함께 있을 때의 결",
        s7Body: `일지(日支) 관계 — ${ilji}. 두 분이 같은 자리에 있을 때 느껴지는 결 — 편안함·긴장감·말이 잘 통하는지. 일·놀이·대화에서 어떤 합이 맞는지. 한쪽이 답답할 수 있는 순간도 솔직하게.`,
        s8Header: "이 인연이 흘러갈 결",
        s8Body: `지지 합·충 종합. 삼합/육합이 강하면 "오랜 인연의 결", 충이 많으면 "들고 나는 결". 이 관계가 **얼마나 깊어지고 오래 갈 인연**인지를 사주 구조로 가늠. 결혼·연애 같은 표현 절대 사용 금지.`,
      };
    case "family":
      return {
        s7Header: "함께 있는 자리의 결",
        s7Body: `일지(日支) 관계 — ${ilji}. 가족이라는 자리에서 두 분이 함께 있을 때의 결. 닮은 결과 다른 결, 어디서 안심하고 어디서 부딪히는지. 가족이기에 더 솔직하게.`,
        s8Header: "함께 갈 길의 결",
        s8Body: `지지 합·충 종합. 형제·가족 인연은 평생 가는 결이지만, 그 결이 **가까이 갈 결인지·멀리 두고 보는 결인지**를 사주 구조로. 결혼·연애 같은 표현 절대 사용 금지.`,
      };
    case "fan":
      return {
        s7Header: "교감의 결",
        s7Body: `일지(日支) 관계 — ${ilji}. 직접 가까이 만나지 않아도 사주 결로 이어지는 교감. 한쪽이 무대 위에 있고 한쪽이 객석에 있는 거리감 안에서도 통하는 결. (혹은 같은 무대에 선 두 멤버라면 무대 안의 결.)`,
        s8Header: "오래 갈 인연인지",
        s8Body: `지지 합·충 종합. 이 인연이 **잠깐 스쳐가는 결인지·오래 마음에 남는 결인지**. 사주 구조로 가늠. 결혼·연애 같은 표현 절대 사용 금지.`,
      };
    case "custom":
      return {
        s7Header: "함께 있을 때의 결",
        s7Body: `일지(日支) 관계 — ${ilji}. 두 분이 같은 자리에 있을 때 느껴지는 결. 어디서 편하고 어디서 어색한지. 관계의 톤에 맞춰 정중하게.`,
        s8Header: "이 인연이 흘러갈 결",
        s8Body: `지지 합·충 종합. 이 관계가 **얼마나 깊어지고 오래 갈 인연**인지. 결혼 같은 단정 금지.`,
      };
  }
}

// ─── 궁합 프롬프트 ──────────────────────────────
function buildMatchingPrompt(
  d: Record<string,string>,
  sajuA: SajuAnalysis,
  sajuB: SajuAnalysis,
  compat: CompatibilityResult,
  saja: SajaSeongeoResult
): string {
  const ctxA = buildCtx(sajuA, d.myName);
  const ctxB = buildCtx(sajuB, d.partnerName);
  const relType = d.relationshipType || "";
  const relLabel = d.relationshipLabel || (relType ? relType : "두 분의 인연");
  const cat = relCategoryOf(relType);
  const rs = getRelSections(cat, d, compat);
  const relGuide =
    cat === "romantic" ? "이 인연은 로맨틱한 결입니다. 감정·끌림·평생 인연 같은 톤 자연스럽게 사용 가능. 친밀함의 결을 풀 때는 정중하고 시적으로, 절대 노골적이지 않게."
    : cat === "social" ? "이 인연은 사회적 인연(친구·동료·파트너)입니다. 결혼·연애·끌림 같은 로맨틱 표현 절대 금지. 우정·신뢰·동행·일의 결 중심으로."
    : cat === "family" ? "이 인연은 가족 인연(형제·자매)입니다. 결혼·연애 표현 절대 금지. 핏줄·평생 동행·닮음과 다름의 결로."
    : cat === "fan" ? "이 인연은 팬덤·무대 위의 인연입니다. 직접적 친밀감보다 거리감 안의 교감·동경·소속감의 결로. 결혼·연애 표현 절대 금지."
    : "관계 유형이 명시적이지 않습니다. 정중하고 보편적인 인연의 결로 풀이.";
  return `당신은 30년 경력의 정통 명리학 대가 "홍도인(紅道人)"입니다. 붉은 실(紅絲)에 묶인 모든 인연 — 연인·부부·친구·동료·가족·팬과 우상까지 — 의 결을 사주만으로 꿰뚫어 봅니다.

━━━ 이번 풀이의 인연 유형 ━━━
관계: ${relLabel}
[톤 가이드] ${relGuide}

━━━ 당신(${d.myName}) 사주 ━━━
${ctxA}

━━━ 상대(${d.partnerName}) 사주 ━━━
${ctxB}

━━━ 자동 계산된 궁합 지표 ━━━
• 인연의 결: ${saja.hanja} ${saja.hangul} — ${saja.meaning}
• 일간 관계: ${compat.ilganRelation} — ${compat.ilganDetail}
• 당신이 상대에게 보충하는 기운: ${compat.elementBalance.aHelpsB.join('·') || '없음'}
• 상대가 당신에게 보충하는 기운: ${compat.elementBalance.bHelpsA.join('·') || '없음'}
• 둘 다 부족한 기운: ${compat.elementBalance.sharedWeak.join('·') || '없음'}
• 일지(배우자궁) 관계: ${compat.branchRelations.ilji}
• 지지 삼합: ${compat.branchRelations.samhap.join(', ') || '없음'}
• 지지 육합: ${compat.branchRelations.yukhap.join(', ') || '없음'}
• 지지 충: ${compat.branchRelations.chung.join(', ') || '없음'}
• ${d.myName}님 신살: ${sajuA.sinsal.join(', ') || '특별한 신살 없음'}
• ${d.partnerName}님 신살: ${sajuB.sinsal.join(', ') || '특별한 신살 없음'}
• 두 분 공유 신살: ${compat.sharedSinsal.join(', ') || '없음'}
• 관계의 강점: ${compat.strengths.join(' / ') || '없음'}
• 관계의 주의점: ${compat.weaknesses.join(' / ') || '없음'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[출력 형식 — 매우 중요]
- 13개의 대섹션을 순서대로 작성. 대섹션 헤더는 반드시 \`## \` (샵 2개 + 띄어쓰기) 로 시작.
- 각 대섹션 안의 소제목은 \`### \` (샵 3개 + 띄어쓰기) 로 시작. 각 \`### \` 가 한 페이지가 됩니다.
- 각 \`### \` 아래 본문은 약 280~360자, 2~3문단 일관 유지.
- "선인의 첫마디", "한 줄 궁합" 두 섹션만 \`### \` 없이 한 단락으로.
- 안내 메모(괄호로 묶인 지시문)는 출력하지 말고, 본문만 출력할 것.

## 선인의 첫마디
이 두 분의 인연에 대한 시적인 2~3문장 인사. "${d.myName}님"과 "${d.partnerName}님"의 이름을 언급하고, 두 분의 일간 기질을 자연에 비유해 시작.

## 한 줄 궁합
이 두 분 인연의 핵심을 사자성어 "${saja.hangul}(${saja.hanja}) — ${saja.meaning}"로 풀이. 왜 이 사자성어가 어울리는지 일간·합·충 등 핵심 이유 1~2가지를 2~3문장으로. (점수·숫자·등급 표현 절대 사용 금지)

## 전생 인연

### 전생에 두 분은 어떤 사이였습니까
★★ **반드시 첫 문장으로 정확히 다음 한 줄을 출력하세요 (그대로 복사):**
"이 풀이는 도교(道敎)와 민간 명리(命理)에서 다루는 결로, 정통 자평명리(子平命理)의 본기(本氣)는 아닙니다."

그 다음 줄바꿈 후, 두 분의 일주(日柱) 닮음, 합(合)의 결, 충(沖)의 결을 토대로 전생에 두 분이 어떤 사이였는지를 풀이하세요. 다음 8가지 중 한 가지를 골라:
- 다정한 친구 / 깊은 연인 / 결연한 부부 / 부모자식 / 스승제자 / 운명적 라이벌 / 빚진 자와 갚는 자 / 처음 만난 영혼
사주 근거 한 줄 포함. 단정 금지 — "~결로 보입니다" 같은 가능성 어조.

### 이번 생에서 풀어야 할 결
전생에 두 분 사이에 미완으로 남은 결이 이번 생에서 어떻게 다시 만나졌는지. 이번 생에서 함께 풀어야 할 과제 한 가지를 부드럽게 짚어주세요. 단정 금지 — "~결로 보입니다" 같은 가능성 어조.

## 두 사람의 본질

### ${d.myName}님의 본질
${d.myName}님 일간(日干)과 일지(日支)에서 도출되는 본질. 다른 사람과 명확히 구별되는 결. 이 사람만의 캐치프레이즈 한 줄.

### ${d.partnerName}님의 본질
${d.partnerName}님 일간과 일지에서 도출되는 본질. 첫 번째와 다른 결. 캐치프레이즈 한 줄.

### 두 결의 만남
두 분의 일간 오행이 만나서 만드는 결. 어떻게 다른지, 그 다름이 관계에서 어떻게 작용하는지.

### 두 결의 닮음
일견 다르게 보여도 두 분이 통하는 지점. 일지·월지·격국에서 닮은 결을 찾아 짚어주기.

## 이 인연을 만난 이유

### 우주가 두 분을 만나게 한 이유
두 분의 용신(用神)·부족 오행·십성 역할을 종합해, 우주가 두 분을 만나게 한 이유를 풀이. "채움" / "가르침" / "미완의 결 마무리" / "위로" / "흔들어 깨우기" / "함께 통과해야 할 과제" 중 가장 두드러지는 결을 골라 깊이 있게.

### ${d.myName}님이 ${d.partnerName}님에게 주는 선물
${d.myName}님 사주에서 ${d.partnerName}님에게 자연스럽게 흘러가는 가장 큰 선물 한 가지. 보충 오행이나 십성 역할로 구체적 근거.

### ${d.partnerName}님이 ${d.myName}님에게 주는 선물
반대 방향. ${d.partnerName}님이 ${d.myName}님에게 주는 가장 큰 선물 한 가지.

## 우리 둘의 기운

### ${d.myName}님이 채워주는 기운
${d.myName}님이 ${d.partnerName}님에게 자연스럽게 채워주는 오행. 그 기운이 ${d.partnerName}님 사주 어디를 채우는지.

### ${d.partnerName}님이 채워주는 기운
${d.partnerName}님이 ${d.myName}님에게 채워주는 오행. 어떤 면을 보충하는지.

### 부딪히는 기운
서로 다듬어 주는 결(상극을 부드럽게 표현). 한쪽이 너무 강해지지 않도록 견제하는 결. 이 결이 관계에 어떤 자극이 되는지.

### 함께 채워야 할 기운
두 분 모두에게 부족한 오행. 두 분이 함께 의식적으로 끌어와야 할 결.

### 두 분의 오행 보석
두 분 각자 강한 오행이 만나서 만드는 시너지. 가장 큰 강점이 어디서 발휘되는지.

## 관계의 언어

### ${d.myName}님에게 ${d.partnerName}님은
십성 관점에서 ${d.partnerName}님이 ${d.myName}님에게 어떤 자리(정관·편재·식신 등)인지. 그 십성이 어떤 결로 작용하는지.

### ${d.partnerName}님에게 ${d.myName}님은
반대 방향. ${d.myName}님이 ${d.partnerName}님에게 어떤 십성 자리인지.

### 빛나는 신살의 자리
두 분의 긍정 신살(천을귀인·천덕귀인·문창·홍염·도화 등)이 관계에 어떻게 작용하는지. 부정 신살명은 사용 금지.

### 12운성의 자리
두 분 일간이 서로의 일지에서 어떤 12운성(생·왕·묘·절 등)에 해당하는지. 그 자리가 관계에 주는 결.

### 서로 주고받는 결
십성 + 신살을 종합해서 두 분이 서로에게 주는 것과 받는 것. 균형이 잘 맞는지, 한쪽으로 기우는지.

## 두 사람의 시선

### 처음 만났을 때의 결
두 분이 처음 만났을 때(혹은 만난다면) 서로에게 어떻게 보였을지. 일간 오행·일지의 첫인상 작용.

### ${d.myName}님이 본 ${d.partnerName}님
${d.myName}님 일간·십성 구조에서 ${d.partnerName}님이 어떻게 비치는지. 어떤 면에 끌리고 어떤 면이 답답한지. 솔직한 속마음.

### ${d.partnerName}님이 본 ${d.myName}님
반대 방향. ${d.partnerName}님 시선에서 본 ${d.myName}님.

### 서로에게 진짜 바라는 것
말로는 잘 못하지만 깊이 바라는 것. 사주 구조에서 도출되는 숨은 마음.

## ${rs.s7Header}

### 함께 있을 때의 결
${rs.s7Body}

### 깊어지는 순간의 결
두 분 사이가 가장 깊어지는 순간 — 어떤 상황·시간·결에서 둘 사이가 진해지는지. 사주 구조로.

### 둘만의 시간·공간
두 분에게 가장 잘 어울리는 함께하는 시간대·공간의 결. 용신 오행 활용. 흐르는 산문으로.

## 누가 더 깊이 끌리고 있는가

### ${d.myName}님이 끌리는 결
${d.myName}님 일간·일지가 ${d.partnerName}님에게서 자석처럼 끌리는 부분. 정재·정관·식상·도화·홍염 등의 작용으로 풀이. 의식적으로 끌리는 면 + 무의식적으로 끌리는 면 양쪽으로.

### ${d.partnerName}님이 끌리는 결
반대 방향. ${d.partnerName}님이 ${d.myName}님의 어떤 결에 끌리는지. 양쪽 끌림이 균형인지, 한쪽으로 기울고 있는지를 마지막 한 줄로 짚어주세요.

## ${rs.s8Header}

### 합의 결
지지 삼합·육합이 만드는 운명적 결. 이 결이 두 분을 어떻게 묶고 있는지.

### 자극의 결
지지 충·형이 만드는 자극 (부드럽게 표현). 이 자극이 관계를 깊게 하기도 위태롭게 하기도 한다는 양면.

### 결을 깊게 만드는 길
${rs.s8Body}

## 함께하는 시간

### 두 분 대운의 만남
앞으로 10년, 두 분의 대운이 어떻게 맞물려 흘러갈지. 같은 결로 흐르는지, 엇갈리는지.

### 빛나는 시기
두 분이 함께 빛나는 시기 (구체 연령대 또는 연도). 어떤 대운이 와서 무엇이 발현되는지.

### 단련되는 시기
함께 단련되는 시기 (충·형이 작용하는 시기). 어떻게 넘기면 좋은지.

### 평생 흐름의 한 줄
두 분 인연 전체를 관통하는 한 줄 키워드 (예: "들고 나며 깊어지는 인연", "초년부터 끝까지 곁에 머무는 인연").

## 다가오는 시기

### 올해(2026)의 결
2026년 병오년(丙午) 천간·지지가 두 분 사주에 어떻게 작용하는지. 두 분 사이에 흐르는 기운.

### 내년(2027)의 결
2027년 정미년(丁未)의 결. 두 분의 결이 어떤 흐름으로 가는지.

### 그 너머의 흐름
2028년 무신년(戊申)부터 2030년 경술년(庚戌)까지 큰 흐름. 함께 통과할 결을 한 단락으로.

## 두 분의 길

### 함께 가꿀 환경
용신 오행 기준, 두 분이 함께 채우면 좋은 환경(방향·색·계절·풍경) — 흐르는 산문으로.

### 함께 누릴 자연·음식
용신 오행 기준 음식·자연·풍경. 두 분만의 결을 가꾸는 일상의 풍경.

### 함께 잡을 일상의 결
두 분이 함께 잡으면 좋은 일상의 작은 결(특정 활동 단정 X, 결·태도 중심).

### 함께 피해야 할 환경
두 분 모두에게 무리가 되는 결. 부드럽게.

## 관계의 그림자와 빛

### 관계의 빛
관계의 보석 같은 부분. 두 분만 가질 수 있는 강점.

### 결의 다른 면
반복되는 결의 차이 (단점이 아닌 "다름"으로 표현). 어떤 상황에서 어긋나는지.

### ${d.myName}님이 ${d.partnerName}님과 잘 지내려면
${d.myName}님 시선에서 ${d.partnerName}님과 잘 지내는 구체적 조언 1~2가지.

### ${d.partnerName}님이 ${d.myName}님과 잘 지내려면
반대 방향. 두 분 모두에게 동등한 조언.

### 만약 흐름이 잠시 끊긴다면
인연의 흐름이 잠시 갈라진다 해도 사주 합·충 + 대운 흐름으로 봤을 때 다시 만나는 결인지를 부드럽게. "헤어짐", "이별" 같은 단어 절대 사용 금지 — "흐름이 잠시 끊긴다" / "결이 멀어진다" 같은 우회. 단정 금지. 양방향 가능성 ("다시 흐를 수도, 그대로 멀어질 수도 있는 결") 으로 정중하게.

## 홍도인의 마지막 당부

### 두 분의 인연 키워드
${d.myName}님과 ${d.partnerName}님 사이의 인연을 관통하는 핵심 키워드 5개. 반드시 두 분 사주 데이터에서 도출되는 키워드만.
형식: **키워드** — 이 키워드가 이 인연에서 나오는 이유(구체적 간지 근거 1문장).

### 홍도인의 마지막 한마디
이 인연의 가장 핵심적인 메시지. 정확히 3~4문장. 시적이지만 구체적. 일간·용신을 자연 비유로 녹일 것. 두 분이 가슴에 새기고 싶어지는 문장.

[규칙]
- 두 분 모두에게 동등한 관점 (한쪽만 비난·칭찬 금지)
- "${d.myName}님이", "${d.partnerName}님이" 처럼 두 이름 자연스럽게 번갈아 호명
- 구체적 간지·오행·십성 근거 반드시 포함
- 바넘 표현 금지 (누구에게나 해당하는 뻔한 말 금지)
- 한자 사자성어 섹션당 1~2개 가능 (동상이몽·부창부수·천생연분 등, 의미 한글 병기)
- ★ 점수·숫자·등급·만점·% 같은 정량 평가 표현 절대 사용 금지 (사주는 점수 매기는 게 아니라 결을 읽는 것)
- ★ 트렌디 표현·신조어 절대 금지 (도파민·갓생·꿀이 떨어지는·찰떡·MZ·겉바속촉·갓생 X) — 이곳은 정통 사주명리학 도원(道院)이며, 엄중하고 정중한 사주명리학자의 톤만 사용
- ★ 부정적 신살 명칭 사용 금지 (망신·백호·재살·탕화·원진·고신·과숙·공망 등) — 사주에 그런 기운이 있더라도 "약간의 거리감", "혼자 있고 싶은 시간" 같이 부드럽게 표현
- ★ 시기 언급은 반드시 현재 이후만 (과거 시점 X). 미래는 대략적으로
- ★ 이모지·이모티콘 절대 사용 금지 (어떤 그림 문자도 X) — 정통 사주명리학 글이며, 한자·한글·문장부호만 사용
- ★ 각 ### 소제목 아래 본문은 약 280~360자, 2~3문단 일관 유지 (각 ### 가 한 페이지). 너무 짧거나 너무 길지 않게 슬라이드 간 분량 균형. 단, "선인의 첫마디"·"한 줄 궁합" 두 섹션만 ### 없이 한 단락(2~3문장)
- ★ 핵심 사주 용어(일간·일지·월지·신살명·오행·격국·용신), 인물 이름, 결론적 표현은 반드시 **굵게**(마크다운) 처리하여 가독성을 높일 것 — 예: "**일간은 갑목(甲木)**으로", "**채워주는 火의 기운**", "**천을귀인(天乙貴人)이 든 자리**". 한 문단당 2~3개 정도의 굵게 마크업이 자연스러움
- ★★ 부정적 단어 절대 사용 금지: "상극", "충(沖)", "흉(凶)", "약점", "흠", "단점" 같은 거친 표현 금지. 대신 부드러운 표현으로 — "상극" → "다듬어 주는 결" / "단련시켜 주는 결" / "결의 다름". "충" → "자극의 결" / "변화를 부르는 결"
- ★ 한자를 사용할 때는 반드시 한글 음을 함께 표기 — 예: "天生緣分(천생연분)", "比和(비화)". 한자만 단독 사용 X, 한자 옆 괄호로 한글 음 병기 필수
- 한국어 경어체, 정중하고 문학적인 흐름`;
}

// ─── API 핸들러 ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, section, ...data } = body;

    // ─── 가족 인연 풀이 (parent-child) — 엄마·아빠·아이 조건부 ───
    if (type === 'parent-child') {
      const hasMom = !!(data.momYear && data.momName);
      const hasDad = !!(data.dadYear && data.dadName);
      if (!hasMom && !hasDad) {
        return NextResponse.json({ error: "부모 한 분 이상 입력해주세요" }, { status: 400 });
      }
      const sajuChild = computeFullSaju(
        parseInt(data.childYear), parseInt(data.childMonth), parseInt(data.childDay),
        data.childHour ?? "모름",
        data.childCalendar === "음력",
        data.childGender ?? "남"
      );
      if (!sajuChild) {
        return NextResponse.json({ error: "자녀 사주 분석 실패" }, { status: 400 });
      }
      const sajuMom = hasMom ? computeFullSaju(
        parseInt(data.momYear), parseInt(data.momMonth), parseInt(data.momDay),
        data.momHour ?? "모름",
        data.momCalendar === "음력",
        "여"
      ) : null;
      const sajuDad = hasDad ? computeFullSaju(
        parseInt(data.dadYear), parseInt(data.dadMonth), parseInt(data.dadDay),
        data.dadHour ?? "모름",
        data.dadCalendar === "음력",
        "남"
      ) : null;
      if (hasMom && !sajuMom) {
        return NextResponse.json({ error: "엄마 사주 분석 실패" }, { status: 400 });
      }
      if (hasDad && !sajuDad) {
        return NextResponse.json({ error: "아빠 사주 분석 실패" }, { status: 400 });
      }
      const momCompat = sajuMom ? adjustForParentChild(calcCompatibility(sajuMom, sajuChild)) : null;
      const dadCompat = sajuDad ? adjustForParentChild(calcCompatibility(sajuDad, sajuChild)) : null;
      // 닮은 결/다른 결 — 차트와 정합 (AI hallucination 차단용)
      const momCompare = sajuMom ? inferElementCompare(sajuMom, sajuChild) : null;
      const dadCompare = sajuDad ? inferElementCompare(sajuDad, sajuChild) : null;
      // 가족 사자성어 — 둘 다 있으면 trio, 한 명이면 dyad
      const primaryCompat = momCompat || dadCompat!;
      const familySaja = (hasMom && hasDad && sajuMom && sajuDad)
        ? pickFamilyTrioSaja(sajuMom, sajuDad, sajuChild)
        : pickFamilySajaSeongeo(
            primaryCompat,
            data.childGender,
            sajuMom ?? sajuDad ?? undefined,
            sajuChild,
            sajuMom ? "엄마" : "아빠",
          );
      const prompt = buildParentChildPrompt(
        data, sajuChild, sajuMom, sajuDad, momCompat, dadCompat, familySaja
      );

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 40000, thinkingConfig: { thinkingBudget: 0 } },
          }),
        }
      );
      if (!res.ok || !res.body) return NextResponse.json({ error: "생성 실패" }, { status: 500 });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const enqueue = (obj: Record<string, unknown>) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          enqueue({ t: 'm', d: {
            sajuMom, sajuDad, sajuChild,
            momCompat, dadCompat,
            hasMom, hasDad,
          } });
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const json = JSON.parse(line.slice(6));
                const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) enqueue({ t: 'x', v: text });
              } catch {}
            }
          }
          enqueue({ t: 'd' });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // ─── 궁합 (matching) 처리 ───
    if (type === 'matching' && section === 'matching') {
      const sajuA = computeFullSaju(
        parseInt(data.myYear), parseInt(data.myMonth), parseInt(data.myDay),
        data.myHour ?? "모름",
        data.myCalendar === "음력",
        data.myGender ?? "남"
      );
      const sajuB = computeFullSaju(
        parseInt(data.partnerYear), parseInt(data.partnerMonth), parseInt(data.partnerDay),
        data.partnerHour ?? "모름",
        data.partnerCalendar === "음력",
        data.partnerGender ?? "남"
      );
      if (!sajuA || !sajuB) {
        return NextResponse.json({ error: "사주 분석 실패" }, { status: 400 });
      }
      const compat = calcCompatibility(sajuA, sajuB);
      const matchingSaja = pickSajaSeongeo(compat);
      const prompt = buildMatchingPrompt(data, sajuA, sajuB, compat, matchingSaja);

      // 스트리밍 응답
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 40000, thinkingConfig: { thinkingBudget: 0 } },
          }),
        }
      );
      if (!res.ok || !res.body) return NextResponse.json({ error: "생성 실패" }, { status: 500 });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const enqueue = (obj: Record<string, unknown>) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          enqueue({ t: 'm', d: { sajuA, sajuB, compat } });
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const json = JSON.parse(line.slice(6));
                const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) enqueue({ t: 'x', v: text });
              } catch {}
            }
          }
          enqueue({ t: 'd' });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // 사주 분석
    let sajuAnalysis: SajuAnalysis | null = null;
    if (data.year && data.month && data.day) {
      sajuAnalysis = computeFullSaju(
        parseInt(data.year), parseInt(data.month), parseInt(data.day),
        data.hour ?? "모름",
        data.calendarType === "음력",
        data.gender ?? "남"
      );
    }

    const ctx = sajuAnalysis != null ? buildCtx(sajuAnalysis, data.name) : '';

    let prompt: string;
    let maxTokens: number;

    if (section === "opener") {
      // 시적인 첫마디 (2문장) — 페르소나 프라이밍 + 개인화 강제
      const iname = ILGAN_NAME[sajuAnalysis?.ilgan ?? ''] ?? '자연';
      const ilgan = sajuAnalysis?.ilgan ?? '?';
      const yongsin = sajuAnalysis?.yongsin ?? '';
      prompt = `당신은 30년 경력의 명리학 대가입니다. 내담자의 일간을 자연에 비유해 그 사람의 본질을 꿰뚫는 첫마디로 유명합니다.

이름: ${data.name} / 일간: ${ilgan}(${iname}) / 용신: ${yongsin}

이 사람에 대한 첫마디를 정확히 2문장으로 작성하세요.

규칙:
- 반드시 일간(${iname})의 자연적 특성을 비유로 사용
- 첫 문장: 이 사람의 본질적 특성 (일간 기반)
- 둘째 문장: 이 사람만의 특별한 가능성 또는 과제 (용신·사주 구조 기반)
- 누구에게나 해당하는 표현 금지 — ${data.name}님에게만 해당하는 문장
- "~입니다" 어체, 2문장만, 한국어

나쁜 예: "${data.name}님은 따뜻한 마음을 가진 분입니다. 주변을 밝게 합니다." (바넘 표현)
좋은 예: "${data.name}님은 깊은 바다처럼 고요하지만 모든 것을 품는 분입니다. 차가운 물이 따뜻한 불을 만나는 지금, 오랜 기다림이 비로소 꽃을 피울 때입니다."`;
      maxTokens = 200;
    } else if (SAJU_PROMPTS[section]) {
      // 새 평생 사주 섹션
      prompt = SAJU_PROMPTS[section](data, ctx, sajuAnalysis);
      maxTokens = section === 'qa' ? 3000 : section === 'overview' ? 2500 : 3000;
    } else {
      const sectionIdx = Math.max(0, Math.min(2, (parseInt(section) || 1) - 1));
      const promptFns = SECTION_PROMPTS[type] || SECTION_PROMPTS.saju;
      prompt = promptFns[sectionIdx](data, ctx, sajuAnalysis);
      maxTokens = type === 'naming' ? 2500 : type === 'moving' ? 1800 : SECTION_TOKENS[sectionIdx];
    }

    // ── Gemini API 스트리밍 ──
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${process.env.GOOGLE_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return NextResponse.json({ error: "AI 호출 실패" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const geminiBody = geminiRes.body!;

    const readable = new ReadableStream({
      async start(controller) {
        if (sajuAnalysis && section === "opener") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'm', d: sajuAnalysis })}\n\n`));
        }
        const reader = geminiBody.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (!raw) continue;
              try {
                const chunk = JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
                const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'x', v: text })}\n\n`));
                }
              } catch { continue; }
            }
          }
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
