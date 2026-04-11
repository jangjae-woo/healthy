import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin,
  STEM_HANJA, BRANCH_HANJA,
  type SajuAnalysis,
} from "@/lib/saju-calculator";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 3가지만 풀이해주세요.
간지(예: 경금 일간, 편관 강함 등)를 구체적으로 언급하세요.

1. **사주원국 분석** - 일주를 중심으로 전체 구조. 일간의 강약과 특성.
2. **오행 분석** - 강한/부족한 오행의 영향. 용신 활용법.
3. **타고난 성격과 기질** - 십성 구조로 보는 성격. 장점과 주의점.

한국어 경어체로 작성해주세요.`,

    // 섹션 2: 운세 흐름
    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 3가지만 풀이해주세요.

4. **대운 흐름** - 현재 대운과 향후 흐름. 몇 살에 어떤 운이 오는지 구체적으로.
5. **2026년 세운** - 병오년(丙午年)이 이 사주에 미치는 영향. 일간과 병오의 관계.
6. **재물운** - 재성과 오행으로 보는 돈복. 사업·투자 적합성.

한국어 경어체로 작성해주세요.`,

    // 섹션 3: 인연 & 미래
    (d, ctx) => `당신은 40년 경력의 정통 명리학 전문가입니다.
이름: ${d.name} / 성별: ${d.gender} / 생년월일: ${d.year}.${d.month}.${d.day}(${d.calendarType}) / 시간: ${d.hour}

${ctx}

위 사주 데이터를 반드시 활용해 아래 4가지만 풀이해주세요.

7. **연애·결혼운** - 일지(배우자궁) 십성과 도화살로 보는 인연. 결혼 시기.
8. **직업·적성** - 십성과 용신으로 잘 맞는 분야. 피해야 할 직업.
9. **건강** - 부족한 오행으로 주의할 신체 부위.
10. **종합 조언** - ${d.name}님 사주의 핵심 메시지. 인생 방향.

한국어 경어체로 작성해주세요.`,
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
    const sectionIdx = Math.max(0, Math.min(2, (parseInt(section) || 1) - 1));
    const promptFns = SECTION_PROMPTS[type] || SECTION_PROMPTS.saju;
    const prompt = promptFns[sectionIdx](data, ctx, sajuAnalysis);
    const maxTokens = SECTION_TOKENS[sectionIdx];

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    return NextResponse.json({
      result: content.text,
      // 섹션 1에만 사주 데이터 포함 (한 번만 전송)
      sajuData: sectionIdx === 0 ? sajuAnalysis : undefined,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
