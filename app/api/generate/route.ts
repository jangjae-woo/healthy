export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin,
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "@/lib/saju-calculator";

const GEMINI_MODEL = "gemini-2.5-flash";

const HOUR_MAP: Record<string, number> = {
  "모름": 12, "자시(23-01)": 23, "축시(01-03)": 1, "인시(03-05)": 3,
  "묘시(05-07)": 5, "진시(07-09)": 7, "사시(09-11)": 9, "오시(11-13)": 11,
  "미시(13-15)": 13, "신시(15-17)": 15, "유시(17-19)": 17,
  "술시(19-21)": 19, "해시(21-23)": 21,
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

    const pillars: SajuAnalysis['pillars'] = {
      year:  { stem: p.year.heavenlyStem,  branch: p.year.earthlyBranch },
      month: { stem: p.month.heavenlyStem, branch: p.month.earthlyBranch },
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
    const sinsal   = calcSinsal(pillars.year.branch, pillars.day.branch, ilgan, allBranches);

    return { pillars, ilgan, sipseong, elements, yongsin, daeun, sinsal, isHourUnknown };
  } catch (e) {
    console.error('사주 계산 오류:', e);
    return null;
  }
}

// ─── 사주 데이터 → 프롬프트 컨텍스트 ─────────
function buildCtx(s: SajuAnalysis, name: string): string {
  const h = (st: string) => STEM_HANJA[st as keyof typeof STEM_HANJA] ?? st;
  const b = (br: string) => BRANCH_HANJA[br as keyof typeof BRANCH_HANJA] ?? br;
  const pp = (p: {stem:string;branch:string}|null) => p ? `${h(p.stem)}${b(p.branch)}(${p.stem}${p.branch})` : '미상';

  const elemSummary = (Object.entries(s.elements) as [string,number][])
    .map(([el,n])=>`${ELEM_DESC[el]}(${n})`)
    .join(', ');
  const strong = (Object.entries(s.elements) as [string,number][]).filter(([,n])=>n>=2).map(([el])=>el).join('/') || '없음';
  const weak   = (Object.entries(s.elements) as [string,number][]).filter(([,n])=>n===0).map(([el])=>el).join('/') || '없음';

  const daeunStr = s.daeun.cycles.slice(0,6)
    .map(c=>`${c.age}세 ${h(c.stem)}${b(c.branch)}운`).join(' → ');

  const ssRow = (label: string, p:{stem:string;branch:string}|null) =>
    p ? `${label}: 천간 ${p.stem}(${SS_DESC[p.stem]?.split('-')[0]??p.stem}) / 지지 ${p.branch}(${SS_DESC[p.branch]?.split('-')[0]??p.branch})` : '';

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
【신살】${s.sinsal.join(', ') || '없음'}`.trim();
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
✗ 포맷 금지: # 단독 제목(예: "# 제목") 사용 절대 금지, ▶ 기호 사용 절대 금지
✗ 허용 포맷 외 사용 금지: 오직 ## 제목, ### 소제목, **굵게**, - 불릿 4가지만 허용

[필수 규칙]
✓ 간지 이름 반드시 언급 (예: "월간 편관이 일간 임수를 극하므로...")
✓ 조건부 해석 사용 (예: "편재가 강하지만 비겁이 많아 재물이 빠져나가는 구조")
✓ ${d.name}님의 이름과 일간을 본문에 자연스럽게 포함
✓ 반드시 완전한 문장으로 끝낼 것 — 문장 중간에서 절대 끊기지 말 것
✓ 풀이 맨 첫 줄에 반드시 핵심 한 줄 요약을 아래 형식으로 작성할 것:
[요약: 이 사주에서 가장 핵심적인 사실 1문장 — 구체적이고 날카롭게]`;
}

// ─── 새 섹션별 프롬프트 (평생 사주 풀이용) ───
const SAJU_PROMPTS: Record<string, PromptFn> = {

  personality1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**강점과 약점**
${d.name}님의 일간(${d.name}님 본인)과 전체 십성 구조에서 나오는 타고난 강점 3가지를 각각 한 단락씩 설명하세요.
- 반드시 구체적인 간지(예: "월간 정인이 일간을 생하므로")를 근거로 제시
- 강점이 발휘되는 구체적 상황(직업·관계·위기 시 등) 명시
- 이어서 주의해야 할 약점 2가지: 어떤 상황에서 어떻게 발현되는지 구체적으로

**겉모습 VS 속마음**
- 남들이 보는 외적 모습: 월간(${d.month}월생 기준 월간 십성)이 만드는 인상, 처음 만난 사람이 느끼는 분위기
- 혼자 있을 때 진짜 모습: 일간과 일지의 조합이 만드는 내면 세계
- 이 두 모습의 간극이 왜 생기는지, 그 간극이 삶에서 어떤 갈등을 만드는지 오행 논리로 설명

한국어 경어체. 날카롭되 따뜻하게.`,

  personality2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**일주 DNA**
${d.name}님의 일주(일간+일지 조합)를 깊이 분석하세요.

1. 이 일주 조합이 만드는 고유한 성격 패턴 — 다른 일주와 명확히 구별되는 특징
2. 일간과 일지의 오행 관계(생·극·비화)가 내면에 만드는 긴장과 에너지
3. 이 조합에서 나오는 숨겨진 재능 — 스스로도 잘 모르는 강점
4. 평생 반복해서 만나게 될 삶의 과제와 그것을 푸는 열쇠
5. 이 일주를 가진 사람이 40대 이후 어떻게 변화하는지

각 항목을 구체적인 간지 관계로 설명하세요. 추상적 표현 금지.
한국어 경어체.`,

  money1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**재물과 나의 관계**
1. 재성(편재·정재)이 이 사주 어디에 있고 어떤 강도인지 먼저 명시
2. 이 배치가 만드는 돈 버는 방식 — 사업형인지 직장형인지, 어떤 방식으로 돈을 모으는지
3. 재성과 일간의 관계: 재물을 잘 다루는지, 아니면 재물이 와도 빠져나가는 구조인지
4. 재물운이 좋아지는 시기(대운·연도 구체적으로): ${d.year}년생 기준 몇 세, 몇 년대

**돈이 새는 이유**
1. 이 사주에서 재물 손실을 일으키는 구체적 십성 충돌 또는 오행 관계 명시
2. 실제 삶에서 어떤 패턴으로 돈이 빠져나가는지 (예: "비겁이 강해 형제·친구에게 돈을 잃는 경향")
3. 이 패턴을 막는 구체적 행동 지침 2가지

한국어 경어체.`,

  money2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**나의 일**
1. 용신(${d.name}님 사주의 용신) 오행으로 보는 잘 맞는 업종·직무·환경 — 구체적 직업명 3개 이상
2. 관성·재성의 배치로 보는 이상적인 업무 스타일 (조직형 vs 독립형, 기획형 vs 실행형 등)
3. 절대 맞지 않는 직업 유형과 그 이유 — 오행 충극 근거 제시
4. 이 사주가 일에서 가장 빛나는 조건 (어떤 환경, 어떤 포지션)

**커리어 타이밍**
1. 지금 대운(현재 ${new Date().getFullYear()}년 기준)이 커리어에 어떤 영향을 주는지
2. 이직·창업·승진에 유리한 대운과 연도를 구체적으로 (예: "37세~47세 ○○운에 전환점")
3. 반드시 피해야 할 시기와 이유
4. 2026~2030년 커리어 흐름 요약 (1~2문장씩)

한국어 경어체.`,

  love1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**맞는 사람 / 안 맞는 사람**
1. 오행 상생 기준: 이 사람의 부족한 오행을 채워주는 상대 오행과 그런 사람의 실제 성격·직업 특성
2. 십성 기준: 일지(배우자궁)의 십성이 끌리는 상대방 유형 구체적으로
3. 절대 맞지 않는 타입: 오행 상극·십성 충돌 기준, 왜 충돌하는지 설명 포함
4. "그래도 자꾸 끌리는" 유형 — 왜 안 맞는 줄 알면서도 끌리는지 사주 구조로 설명

**반복 관계 패턴**
1. 이 사람이 인간관계·연애에서 반복하는 행동 패턴 2가지 — 구체적 상황 묘사
2. 그 패턴이 어떤 십성·오행 구조에서 나오는지 근거 제시
3. 패턴을 인식하고 변화하는 방법 — 추상적 조언 금지, 행동 지침으로

한국어 경어체. 공감하되 솔직하게.`,

  love2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**사랑하는 방법**
${d.name}님만의 사랑 방식을 아래 5가지 측면으로 분석하세요:

1. 호감 표현 방식: 좋아하는 사람에게 어떻게 표현하는지 (일간·식상 기준)
2. 연애 중 역할: 리드형인지 서포트형인지, 어떤 역할에서 편안한지
3. 사랑에서 가장 중요하게 여기는 것 — 안정인지, 자유인지, 인정인지 (일지·관성·식상 근거)
4. 상처받는 패턴: 어떤 상황에서 가장 상처받고 어떻게 반응하는지
5. 상대방이 이 사람을 사랑하는 법: 어떻게 대해줄 때 마음이 열리는지

각 항목마다 구체적 간지 근거 포함. 한국어 경어체. 따뜻하고 솔직하게.`,

  love3: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**파트너와 결혼**
1. 일지(배우자궁) 십성으로 보는 배우자의 성격·직업·오행 특성 구체적으로
2. 결혼 후 실제 부부 관계의 역학 — 누가 주도하고, 어디서 마찰이 생기는지
3. 결혼 적기: 대운 흐름 기준 구체적 나이대 또는 연도 제시 (${d.year}년생 기준)
4. 결혼 생활에서 주의할 점 2가지 — 구체적 상황 묘사

**귀인**
1. 이 사주에서 귀인 역할을 하는 십성 유형 — 어떤 사람이 귀인인지
2. 귀인을 만나기 좋은 장소·상황·시기
3. 귀인을 알아보는 법과 관계를 유지하는 방법
4. 현재 대운 기준 귀인 운이 언제 강해지는지

한국어 경어체.`,

  health: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**건강 분석**
1. 부족한 오행과 그 오행이 지배하는 신체 기관 명시 (오행-신체 대응 기준)
   - 목(木): 간·담·근육·눈 / 화(火): 심장·소장·혈관 / 토(土): 위·비장·소화기
   - 금(金): 폐·대장·피부·뼈 / 수(水): 신장·방광·생식기·뇌
2. 이 사주 구조에서 생기기 쉬운 질환 또는 신체 증상 2~3가지 구체적으로
3. 특정 대운에서 건강이 취약해지는 시기와 이유
4. ${d.name}님이 특히 주의해야 할 연령대

**건강 지키는 법**
용신 오행(${d.name}님 사주 용신 기준)을 기반으로:
1. 유익한 음식 5가지 이상 (구체적 식품명)
2. 해로운 음식 또는 습관
3. 추천 운동 유형 (유산소/무산소, 실내/실외, 경쟁형/개인형 등)
4. 유익한 생활 환경 (방향, 색깔, 시간대)
5. 정신 건강을 위한 구체적 루틴 1가지

한국어 경어체.`,

  hidden: (d, ctx, s) => `${buildHeader(d, ctx)}

[풀이 요청]

**숨겨진 잠재력**
1. 이 사주에서 본인도 잘 모르는 숨겨진 재능 — 어떤 십성·지지 조합에서 나오는지 근거 포함
2. 그 재능이 어떤 상황에서 폭발적으로 발현되는지 구체적 시나리오
3. 지금까지 이 잠재력이 발현되지 못한 이유 — 사주 구조상 어떤 걸림돌이 있는지
4. 이 잠재력을 꽃피우기 위해 지금 당장 할 수 있는 것 1가지

**신살 풀이**
${s?.sinsal && s.sinsal.length > 0
  ? `이 사주에는 ${s.sinsal.join(', ')}이(가) 있습니다.
각 신살마다:
- 이 신살이 이 사주 구조에서 구체적으로 어떤 방식으로 발현되는지
- 긍정적 활용법과 주의할 상황
- 이 신살이 강하게 발동하는 시기 (나이 또는 대운)`
  : `이 사주에는 특별한 신살이 없습니다.
대신 일주와 월지의 관계에서 숨겨진 특수 기운을 분석하세요.
신살 없는 사주의 의미와 장단점을 설명하세요.`}

한국어 경어체.`,

  timeline1: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**지나온 대운**
대운 데이터를 보고 시기별로 분석하세요:
- 초반 대운(1~20대): 어떤 기운이었고 어떤 일이 있었을지
- 중반 대운(20~40대): 어떤 변화가 왔고 어떤 선택의 기로가 있었을지
- 각 대운의 십성이 일간과 어떻게 작용했는지 — 좋았던 시기와 힘들었던 시기를 구체적으로

**지금 이 시기**
${new Date().getFullYear()}년 현재 기준:
1. 지금 대운의 간지와 그 의미 — 일간에게 어떤 작용을 하는지
2. 지금 시기의 명리학적 테마 (예: "이 시기는 관성운으로 사회적 책임이 커지는 때")
3. 지금 가장 중요한 선택이나 행동 — 구체적으로
4. 언제부터 다음 대운이 시작되고 어떻게 달라지는지

한국어 경어체.`,

  timeline2: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**향후 5년 세운 풀이 (2026~2030)**

아래 각 연도를 반드시 개별 분석하세요:

2026년 (병오년·丙午): 일간과의 관계, 재물·직업·연애 각각 흐름
2027년 (정미년·丁未): 일간과의 관계, 재물·직업·연애 각각 흐름
2028년 (무신년·戊申): 일간과의 관계, 재물·직업·연애 각각 흐름
2029년 (기유년·己酉): 일간과의 관계, 재물·직업·연애 각각 흐름
2030년 (경술년·庚戌): 일간과의 관계, 재물·직업·연애 각각 흐름

각 연도마다:
- 세운 천간이 일간과 어떤 관계(생·극·합·충)인지
- 세운 지지가 일지·월지와 어떤 작용(합·충·형·파)인지
- 이 상호작용이 실제 삶에서 어떻게 나타나는지 구체적으로
- 가장 주의해야 할 달 또는 시기 (상반기/하반기 구분)
- 이 해에 꼭 해야 할 것, 하지 말아야 할 것

마지막에: 5년 전체 관통 키워드 1줄 요약

한국어 경어체.`,

  compass: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**용신**
1. 이 사주의 용신이 무엇인지 — 왜 그 오행이 용신인지 오행 균형 논리로 설명
2. 용신이 부족할 때 실제 삶에서 어떤 증상이 나타나는지 (기분, 건강, 관계, 재물 각각)
3. 용신 기운이 들어오는 시기(대운·세운)에 어떤 변화가 오는지 과거·미래 사례로

**오늘부터 할 수 있는 것**
용신 오행을 일상에서 채우는 구체적 방법:
- 행운의 색깔 (2~3가지, 어떤 옷·소품에 활용할지)
- 유익한 방향 (사무실 자리, 침실 머리 방향, 외출 시 방향)
- 행운의 숫자와 활용법
- 유익한 음식·음료 (구체적으로 5가지 이상)
- 추천 운동 및 활동
- 아침 루틴 1가지 (오늘부터 바로 실천 가능한 것)

**이 사주로 살아가는 법**
${d.name}님에게만 해당하는 삶의 지침:
1. 이 사주의 가장 큰 강점을 삶에서 극대화하는 방법
2. 이 사주의 약점이 발동하는 신호와 그 순간 할 수 있는 것
3. 10년 후 ${d.name}님이 되어 있을 모습 — 긍정적 시나리오
4. 그 모습에 도달하기 위한 핵심 한 마디

한국어 경어체.`,

  closing: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]

**인생 키워드**
${d.name}님의 사주 전체를 관통하는 핵심 키워드 5개를 선정하세요.
반드시 이 사주 데이터에서 근거가 도출되는 키워드여야 합니다 (누구에게나 해당하는 키워드 금지).

형식:
**키워드** — [이 키워드가 이 사주에서 나오는 이유: 구체적 간지 근거 포함 1문장]

**운학선인의 당부**
${d.name}님 사주의 가장 핵심적인 메시지를 담은 마지막 말씀.
- 정확히 3문장
- 시적이지만 구체적 — 추상적 위로 금지
- 이 사람의 일간과 용신을 반드시 자연 비유로 녹여낼 것
- 읽는 사람이 가슴에 새기고 싶어지는 문장

한국어 경어체, 시적인 톤.`,
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

    const ctx = sajuAnalysis ? buildCtx(sajuAnalysis, data.name) : '';

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
      maxTokens = 3000;
    } else {
      const sectionIdx = Math.max(0, Math.min(2, (parseInt(section) || 1) - 1));
      const promptFns = SECTION_PROMPTS[type] || SECTION_PROMPTS.saju;
      prompt = promptFns[sectionIdx](data, ctx, sajuAnalysis);
      maxTokens = SECTION_TOKENS[sectionIdx];
    }

    // ── Gemini API (generateContent → SSE 변환) ──
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      return NextResponse.json({ error: "AI 호출 실패" }, { status: 500 });
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const encoder = new TextEncoder();
    const lines: string[] = [];

    if (sajuAnalysis && section === "opener") {
      lines.push(`data: ${JSON.stringify({ t: 'm', d: sajuAnalysis })}\n\n`);
    }
    const CHUNK = 20;
    for (let i = 0; i < aiText.length; i += CHUNK) {
      lines.push(`data: ${JSON.stringify({ t: 'x', v: aiText.slice(i, i + CHUNK) })}\n\n`);
    }
    lines.push('data: [DONE]\n\n');

    const body = encoder.encode(lines.join(''));

    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
