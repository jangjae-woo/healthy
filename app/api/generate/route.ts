import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin, calcMonthPillar, calcYearPillar,
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "@/lib/saju-calculator";

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
- 결혼 적기: 구체적 나이대 또는 대운명 제시
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
    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 2가지만 풀이해주세요.

1. **2026년 총운** - 병오년이 이 사주에 어떤 의미인지. 일간과 병오의 기운 관계. 올해 핵심 키워드.
2. **재물운** - 재성 흐름과 병오년 영향. 수입·지출·투자 운세.

한국어 경어체로 작성해주세요.`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 3가지만 풀이해주세요.

3. **연애·관계운** - 도화살·배우자궁과 병오년. 현재 연인·결혼 전망.
4. **건강운** - 오행 균형과 병오년. 올해 주의할 신체 부위.
5. **직업·사업운** - 관성·재성과 병오년. 커리어·승진·이직·창업 전망.

한국어 경어체로 작성해주세요.`,

    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

2026년 병오년(丙午年)을 기준으로 아래 3가지만 풀이해주세요.

6. **월별 운세** - 상반기(1~6월)와 하반기(7~12월) 흐름. 좋은 달과 주의할 달.
7. **올해의 행운 키워드** - 용신 기반 행운의 색깔, 방향, 숫자, 음식.
8. **${d.name}님께 드리는 2026년 핵심 조언** - 올해 반드시 기억할 한마디.

한국어 경어체로 작성해주세요.`,
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
      return `당신은 30년 경력의 정통 명리학 전문가이자 이사택일(移徙擇日) 전문가입니다.

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
      return `당신은 30년 경력의 작명(作名) 전문가이자 명리학 대가입니다.

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
✓ **내면 독백 예시 최소 1회**: 그 기질을 가진 사람이 실제로 속으로 하는 생각을 작은따옴표로 인용.
   좋은 예: "'왜 이 사람들은 이렇게 단순한 걸 못 알아볼까?' 하고 답답했던 순간이 많으셨을 겁니다"
   좋은 예: "'내가 굳이 이걸 설명해야 하나?' 하는 생각을 자주 하실 겁니다"
✓ **반복되는 일상 패턴** 묘사: 특정 사건 말고 "회의·대화·관계에서 자주 일어나는 순간" 으로.
   예: "대화 중 상대의 논리가 뚫리는 게 보이는데 굳이 지적 안 하고 넘어가는 때"
✓ **직업 중립 언어**: "일", "사람들", "관계", "프로젝트" 같이 어떤 직군에도 통하는 단어 사용

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

### 결혼 적기
대운 흐름 기준 반드시 2년 이내 구간으로 특정할 것 (예: "○○세~○○세", "○○년~○○년"). 넓은 범위(10년·20대 등) 절대 금지.

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
  ? s.sinsal.map(ss => `### 신살 풀이 — ${ss}
이 신살이 이 사주 구조에서 구체적으로 어떤 방식으로 발현되는지. 긍정적 활용법과 주의할 상황. 이 신살이 강하게 발동하는 시기(나이 또는 대운).`).join('\n\n')
  : `### 신살 없는 사주의 의미
이 사주에는 특별한 신살이 없습니다. 일주와 월지의 관계에서 숨겨진 특수 기운을 분석하세요. 신살 없는 사주의 의미와 장단점.`}

한국어 경어체.`,

  timeline1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 7개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.
각 연령대에 해당하는 대운 간지를 반드시 명시하고, 그 대운이 일간에게 생인지 극인지 분석하세요.

### 10대 — [이 시기의 핵심 키워드]
10대에 해당하는 대운 간지와 의미. 학업·가정환경·성격 형성에 어떤 영향을 주는지.

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

[풀이 요청]
아래 4개의 ### 소제목을 순서대로 각각 독립적으로 작성하세요. 각 소제목은 하나의 페이지가 됩니다. 각 소제목 아래 내용은 2~3문단 이내로 제한하세요.

### 용신이란 무엇인가
이 사주의 용신이 무엇인지. 왜 그 오행이 용신인지 오행 균형 논리로. 용신이 부족할 때 실제 삶에서 어떤 증상이 나타나는지.

### 행운의 색깔·방향·숫자
용신 오행 기반 행운의 색깔(2~3가지), 유익한 방향(사무실·침실), 행운의 숫자와 활용법.

### 오늘부터 실천할 루틴
용신 기운을 일상에서 채우는 구체적 방법. 아침 루틴 1가지, 저녁 루틴 1가지. 이번 주 당장 실천할 수 있는 것 1가지를 구체적으로.

### 이 사주로 살아가는 법
이 사주의 강점을 극대화하는 방법. 약점이 발동하는 신호와 그 순간 할 수 있는 것. 10년 후 ${d.name}님이 되어 있을 긍정적 모습을 2~3문장으로 생생하게 그려주세요. 마지막으로 ${d.name}님에게 전하는 진심 어린 응원 한 문단(3~4문장)으로 마무리하세요.

한국어 경어체.`,

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

// ─── API 핸들러 ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, section, ...data } = body;

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
