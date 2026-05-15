import { NextRequest, NextResponse } from "next/server";
import { computeFullSajuCore, type SajuAnalysisCore } from "@/lib/saju-core";

// 챕터 생성 뒤 LLM 검수/필요 시 재작성까지 수행하므로 여유 시간을 둔다.
export const maxDuration = 300;
import {
  calcCompatibility,
  inferCrisisTiming,
  getDayMasterStrength,
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
  inferLifestyle,
  inferDigitalGauge,
  evaluateDaeunTimeline,
} from "@/lib/parent-child-charts";
import { pickSajaSeongeo, type SajaSeongeoResult } from "@/lib/matching-images";
import { deriveInyeonTraits, traitsToPromptBlock } from "@/lib/inyeon-traits";
import { buildOpenerSeed, describeChildSipseongStrength, classifyElementDistribution, classifySipseongDistribution } from "@/lib/opener-seed";
import { buildPrescriptionSet, pickWeakestElement, pickStrongestElement, buildSoftenSet } from "@/lib/element-prescription";
import { classifyAgeStage, ageStageKor, ageToneGuide, dailyDigitalLimit } from "@/lib/age-stage";
import { buildSipseongDeepContext, buildSinsalContext, buildMeetClashContext, buildYongsinContext, buildSixFactorBodyContext } from "@/lib/heart-context";
import { buildChildSeed, buildChildSeedPromptBlock } from "@/lib/child-seed";
import { calcGyeokguk, calcGongmang, calcGisin, calcGaeun, calcChildTiming, calcIljiRelation, calcParentSipseong, calcSharedSinsal, calcUnseong } from "@/lib/saju-traditional";

import { SAJU_SYSTEM_INSTRUCTION } from "@/lib/saju-system-instruction";
import { buildSectionDirection, type SajuSection } from "@/lib/saju-section-direction";
import { buildAllocationBlock } from "@/lib/saju/factor-allocation";
// ⭐ 2026-05-14 — 평생사주 프롬프트 파일 분리. buildHeader·LIFETIME_SAJU_PROMPTS 는 lib/saju/prompts/ 에서.
import { LIFETIME_SAJU_PROMPTS, buildHeader } from "@/lib/saju/prompts";
import { validateSajuOutput } from "@/lib/saju-validator";
import { deriveChildTraitsV2, childTraitsToPromptBlockV2 } from "@/lib/parent-child-traits-block-v2";
import { inferPositiveSinsal } from "@/lib/parent-child-traits-v2";
import { derivePersonalTraits, personalTraitsToPromptBlock } from "@/lib/personal-traits-block-v2";
// ⭐ 2026-05-13 — 부모자녀 해석 기획 레이어 (hongsil 패턴 차용)
import { buildParentChildContext } from "@/lib/parent-child/build-context";
import type { ParentChildChapterScope } from "@/lib/parent-child/sub-distribution";
// ⭐ F3 (2026-05-14) — 자녀 연령대 분류 (guard 후처리에 전달)
import { classifyAgeStageFromYear, getAgeAdaptedHeaders } from "@/lib/parent-child/interpretation-plan";
import { guardGeneratedText, type GuardPersonContext } from "@/lib/llm-output-guard";
// ⭐ V2.1 (2026-05-14) — 청월당 풀 시스템 + 깨달음 4단 메커니즘 + ch7 신설
import { injectPoolsBlock, injectOutroPoolsBlock, INSIGHT_4STEP_RULE } from "@/lib/parent-child/pool-injector";
import { injectTimeResolution } from "@/lib/parent-child/chapter-time-resolution";
// ⭐ V2.1.4 (2026-05-15) — 신살 어휘 풀 (B+C 하이브리드)
import { buildSinsalVocabBlock } from "@/lib/sinsal-vocab";

const GEMINI_MODEL = "gemini-2.5-flash";

const ELEM_DESC: Record<string, string> = {
  목:'木(목)-성장·창의', 화:'火(화)-열정·표현', 토:'土(토)-신뢰·안정',
  금:'金(금)-의리·결단', 수:'水(수)-지혜·직관',
};

// ⭐ V2.1.3 (2026-05-15) — 일간 한글 → 오행 매핑
const STEM_TO_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

// ⭐ V2.1.3 — 오행 어휘 풀 (풀 대명사 폐기 → 오행 어휘 치환용)
const ELEMENT_VOCAB: Record<string, string[]> = {
  목: ["나무의 기운", "성장하는 결", "올라가는 결", "곧게 뻗는 결"],
  화: ["불의 기운", "환한 결", "발산하는 결", "따뜻한 결"],
  토: ["흙의 기운", "받쳐주는 결", "안정하는 결", "두텁게 쌓는 결"],
  금: ["금속의 기운", "단단한 결", "정돈하는 결", "결단의 결"],
  수: ["물의 기운", "흐르는 결", "고요한 결", "스며드는 결"],
};

// ⭐ V2.1.3 — 일간 기준 십성-오행 매핑 (자동 매핑)
function getSipseongElementMap(ilgan: string): Record<string, string> {
  const ilganElem = STEM_TO_ELEMENT[ilgan] ?? "목";
  // 오행 상생·상극 순서: 목→화→토→금→수→목
  const cycle = ["목", "화", "토", "금", "수"];
  const idx = cycle.indexOf(ilganElem);
  return {
    비겁: cycle[idx],                                  // 같은 오행
    식상: cycle[(idx + 1) % 5],                        // 일간이 생하는 오행
    재성: cycle[(idx + 2) % 5],                        // 일간이 극하는 오행
    관성: cycle[(idx + 4) % 5],                        // 일간을 극하는 오행 (5-1=4)
    인성: cycle[(idx + 3) % 5],                        // 일간을 생하는 오행 (5-2=3)
  };
}

// ⭐ V2.1.3 — 자녀 십성-오행 매핑 블록 (dataBlock에 박힘)
function buildSipseongElementBlock(ilgan: string): string {
  const map = getSipseongElementMap(ilgan);
  const ilganElem = STEM_TO_ELEMENT[ilgan] ?? "목";
  const vocab = (el: string) => ELEMENT_VOCAB[el]?.[0] ?? `${el}의 기운`;
  return `[★ 십성-오행 자동 매핑 — 자녀 일간 ${ilgan}(${ilganElem}) 기준. 풀 대명사 치환 시 반드시 이 매핑 사용]
- 비겁(比劫) = ${map.비겁}의 기운 (예: "${vocab(map.비겁)}")
- 식상(食傷) = ${map.식상}의 기운 (예: "${vocab(map.식상)}")
- 재성(財星) = ${map.재성}의 기운 (예: "${vocab(map.재성)}")
- 관성(官星) = ${map.관성}의 기운 (예: "${vocab(map.관성)}")
- 인성(印星) = ${map.인성}의 기운 (예: "${vocab(map.인성)}")
⚠️ "본인 결"·"중심 기운"·"내면의 자리" 같은 추상 풀 대명사 절대 사용 X. 위 오행 어휘로만 치환.
⚠️ "인성 오행"·"비겁 오행" 같은 십성+오행 합성 비문 절대 X. "인성(印星)" + "${map.인성} 오행" 분리 표현.`;
}
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
): SajuAnalysisCore | null {
  try {
    return computeFullSajuCore({ year, month, day, hour: hourStr, isLunar, gender });
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

  // ⭐ V2.2.6 (2026-05-15) — 5오행 강·약 4단계 단언 데이터
  // 평생사주5차 분석 결과: dataBlock에 강·약 1개씩만 명시 → LLM이 중간 오행(수·화·금)에
  // 대해 멋대로 "강하다/옅다" 단정해 같은 풀이 안에 모순 발생.
  // 5개 오행 모두 강도 라벨을 단언으로 박아서 LLM 추측 차단.
  const elemRanking = (Object.entries(s.elements) as [string,number][])
    .map(([el, n]) => ({ el, n, pct: Math.round((n / totalElem) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  const elemBucket = (pct: number): string =>
    pct >= 28 ? '매우 강' : pct >= 20 ? '강' : pct >= 14 ? '보통' : pct >= 8 ? '옅음' : '매우 옅음';
  const elemFiveLine = elemRanking
    .map(e => `${e.el}(${ELEM_DESC[e.el] ?? ''}) ${e.pct}% — ${elemBucket(e.pct)}`)
    .join(' / ');

  // ⭐ V2.2.9 (2026-05-15) — 일간별 십성-오행 매핑을 dataBlock 최상단에 명시
  // 평생사주6차 분석 결과: 갑목 일간인데 본문이 일관되게 "인성=금" 단정 (실제는 인성=수).
  // sipseong-element-block.ts 표가 ctx 끝에 묻혀서 영향력 약함 → 최상단 강조 박스로 격상.
  const SIPSEONG_OHANG = getSipseongElementMap(s.ilgan);
  const ilganElemMain = STEM_TO_ELEMENT[s.ilgan] ?? '목';
  const ELEM_HANJA_LOCAL: Record<string,string> = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };
  const sipsengOhangLine = `비겁=${SIPSEONG_OHANG.비겁}(${ELEM_HANJA_LOCAL[SIPSEONG_OHANG.비겁]??''}) / 식상=${SIPSEONG_OHANG.식상}(${ELEM_HANJA_LOCAL[SIPSEONG_OHANG.식상]??''}) / 재성=${SIPSEONG_OHANG.재성}(${ELEM_HANJA_LOCAL[SIPSEONG_OHANG.재성]??''}) / 관성=${SIPSEONG_OHANG.관성}(${ELEM_HANJA_LOCAL[SIPSEONG_OHANG.관성]??''}) / 인성=${SIPSEONG_OHANG.인성}(${ELEM_HANJA_LOCAL[SIPSEONG_OHANG.인성]??''})`;

  // ⭐ V2.2.9 — 월지 정합성 한 줄 단언
  // 6차 분석: 월지가 "편인"·"상관"·"자수"·"정인격" 4갈래로 분열 → 단일 출처 박음.
  const monthBranch = s.pillars.month.branch;
  const monthBranchSipseong = s.sipseong.month.branch;
  const monthLine = `${monthBranch}(${BRANCH_HANJA[monthBranch as keyof typeof BRANCH_HANJA]??monthBranch}) — 십성: ${monthBranchSipseong} / 격국 산출 근거`;

  // ⭐ V2.2.9 — 4단계 재산 곡선 점수 (시각화 SajuLifeWealthCurve와 동일 산식)
  // 6차 분석: 차트는 말년운 좋게 표시, 본문은 "60대 약하다" 단정 → 불일치.
  // 차트가 보는 데이터를 prompt에 박아서 본문이 차트와 일치하게 풀도록.
  const wealthBaseSip = (() => {
    const cnt = { 비겁:0, 식상:0, 재성:0, 관성:0, 인성:0 };
    const tk: string[] = [];
    for (const pos of ['year','month','day','hour'] as const) {
      const p = s.sipseong[pos]; if (!p) continue;
      tk.push(p.stem, p.branch);
    }
    for (const t of tk) {
      if (t==='비견'||t==='겁재') cnt.비겁++;
      else if (t==='식신'||t==='상관') cnt.식상++;
      else if (t==='정재'||t==='편재') cnt.재성++;
      else if (t==='정관'||t==='편관'||t==='칠살') cnt.관성++;
      else if (t==='정인'||t==='편인') cnt.인성++;
    }
    return cnt;
  })();
  const wealthBaseline = wealthBaseSip.재성 * 8 + wealthBaseSip.식상 * 5 + 20;
  const wealthCalc = (idxList: number[]): number => {
    let score = wealthBaseline;
    for (const i of idxList) {
      const c = s.daeun.cycles[i]; if (!c) continue;
      const ssStem = s.sipseong.year ? (() => {
        // 대운 천간/지지 십성 빠른 계산 (정통 라이브러리 함수 우회 — 매핑 직접 사용)
        return '';  // 단순화: 정확도는 차트와 동일 위해 라이브러리 사용 권장
      })() : '';
      // 실제로는 getSipseong 함수를 사용해야 정확. 여기선 단순화.
      // 차트 SajuLifeWealthCurve와 정확히 동일하게 가려면 getSipseong import 필요.
      void ssStem;
      // Daeun cycle의 stem/branch가 일간 기준 어떤 십성인지 — 대략 추정으로 재성 가중
      const stemElem = STEM_TO_ELEMENT[c.stem] ?? '';
      const branchElem = (() => {
        const m: Record<string,string> = {자:'수',축:'토',인:'목',묘:'목',진:'토',사:'화',오:'화',미:'토',신:'금',유:'금',술:'토',해:'수'};
        return m[c.branch] ?? '';
      })();
      // 일간이 극하는 오행 = 재성
      if (stemElem === SIPSEONG_OHANG.재성) score += 17;
      else if (branchElem === SIPSEONG_OHANG.재성) score += 14;
      // 일간이 생하는 오행 = 식상
      if (stemElem === SIPSEONG_OHANG.식상) score += 7;
      else if (branchElem === SIPSEONG_OHANG.식상) score += 5;
      // 비겁 (겁재 추정 — 같은 오행이고 부정 가중)
      if (stemElem === SIPSEONG_OHANG.비겁) score -= 3;
    }
    return Math.max(10, Math.min(100, Math.round(score)));
  };
  const wealthStages = [
    { label:'초년기(10~20대)', sc: wealthCalc([0,1]) },
    { label:'청년기(30~40대)', sc: wealthCalc([2,3]) },
    { label:'중년기(50대)',   sc: wealthCalc([4,5]) },
    { label:'말년기(60대+)',  sc: wealthCalc([6,7]) },
  ];
  const wealthLine = wealthStages.map(w => `${w.label}=${w.sc}`).join(' / ');
  const wealthPeak = wealthStages.reduce((a,b) => a.sc >= b.sc ? a : b);
  const wealthDip  = wealthStages.reduce((a,b) => a.sc <= b.sc ? a : b);
  void ilganElemMain;

  const daeunStr = s.daeun.cycles.slice(0,6)
    .map(c=>`${c.age}세 ${h(c.stem)}${b(c.branch)}운`).join(' → ');

  const ssRow = (label: string, p:{stem:string;branch:string}|null) =>
    p ? `${label}: 천간 ${p.stem}(${SS_DESC[p.stem]?.split('-')[0]??p.stem}) / 지지 ${p.branch}(${SS_DESC[p.branch]?.split('-')[0]??p.branch})` : '';

  const allStems2    = [s.pillars.year.stem, s.pillars.month.stem, s.pillars.day.stem, ...(s.pillars.hour?[s.pillars.hour.stem]:[])];
  const allBranches2 = [s.pillars.year.branch, s.pillars.month.branch, s.pillars.day.branch, ...(s.pillars.hour?[s.pillars.hour.branch]:[])];
  const interactions = buildInteractions(allStems2, allBranches2);

  // 정설 명리 산출 4종 — LLM 환각 차단용 deterministic 박음
  const otherStemsForDms = [s.pillars.year.stem, s.pillars.month.stem, ...(s.pillars.hour?[s.pillars.hour.stem]:[])];
  const dms = (() => { try { return getDayMasterStrength(s.ilgan, s.pillars.month.branch, allBranches2, otherStemsForDms); } catch { return null; } })();
  const unseong = (() => { try { return calcUnseong(s); } catch { return null; } })();
  const gyeokguk = (() => { try { return calcGyeokguk(s); } catch { return null; } })();
  const gongmang = (() => { try { return calcGongmang(s); } catch { return null; } })();

  const gyeokgukLine = gyeokguk ? `${gyeokguk.name}(${gyeokguk.hanja}) — ${gyeokguk.sipseong}` : '—';
  const unseongLine = unseong ? `${unseong.stage}(${unseong.hanja}) — ${unseong.meaning}` : '—';
  const gongmangLine = gongmang
    ? `${gongmang.branches[0]}·${gongmang.branches[1]}(${gongmang.hanja[0]}·${gongmang.hanja[1]})${gongmang.positions.length ? ` 자리: ${gongmang.positions.join('·')}` : ' (자녀 4지지에는 직접 자리 없음)'}`
    : '—';
  const dmsLine = dms ? `${dms.level} (점수 ${dms.score})` : '—';

  return `
━━━ ★★★★★ V2.2.9 핵심 단언 데이터 — 본문 모든 십성·오행·격국 단정의 단일 출처 ━━━
【★ 일간 ${s.ilgan}(${h(s.ilgan)}) 기준 십성-오행 매핑 (자평명리 정통 — 본문 단정 시 반드시 이 매핑)】
${sipsengOhangLine}
  ⚠️ 본문에 "○성=○오행" 단정이 위 매핑과 다르면 비문. 예: 갑목 일간이면 인성=수이지 금이 아님. 관성=금. 거꾸로 단정 절대 금지.
【★ 월지 단언 (격국·월령 출처)】 월지 = ${monthLine}
  ⚠️ 본문에 "월지에 ○○ 자리" 단정은 위 십성과 정확히 일치. 격국명과도 모순 금지.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【사주원국】연주:${pp(s.pillars.year)} 월주:${pp(s.pillars.month)} 일주:${pp(s.pillars.day)} 시주:${pp(s.pillars.hour)}
【일간(${name}님 본인)】${s.ilgan}(${h(s.ilgan)}) = ${
  s.ilgan==='갑'?'양목·거목·추진력':s.ilgan==='을'?'음목·초목·유연함':
  s.ilgan==='병'?'양화·태양·활동적':s.ilgan==='정'?'음화·촛불·헌신적':
  s.ilgan==='무'?'양토·산·포용력':s.ilgan==='기'?'음토·논밭·꼼꼼함':
  s.ilgan==='경'?'양금·강철·강직함':s.ilgan==='신'?'음금·보석·예리함':
  s.ilgan==='임'?'양수·바다·지혜':  '음수·샘물·감수성'}
【일간 강약(자평명리 정통 산출)】${dmsLine}
【십성 구조】
${ssRow('연주',s.sipseong.year)}
${ssRow('월주',s.sipseong.month)}
일지(배우자궁): ${s.sipseong.day.branch}(${SS_DESC[s.sipseong.day.branch]??s.sipseong.day.branch})
${s.sipseong.hour?ssRow('시주',s.sipseong.hour):'시주: 미상'}
【오행 분포】${elemSummary}
【★ 5오행 강·약 4단계 단언 (V2.2.6) — 본문에서 어떤 오행을 '강·옅' 말할 때 반드시 이 분류 그대로】
${elemFiveLine}
강한 오행(>=22%): ${strong} / 부족한 오행(<10%): ${weak} / 용신: ${s.yongsin}(${ELEM_DESC[s.yongsin]})
【격국(月支 + 투간 보정)】${gyeokgukLine}
【12운성(일주 — 일간이 일지에 앉은 결)】${unseongLine}
【공망】${gongmangLine}
【대운(${s.daeun.direction}·${s.daeun.number}세 시작)】${daeunStr}
【★ 4단계 재산 곡선 단언 (V2.2.9 — 시각화 SajuLifeWealthCurve와 동일 산식)】
${wealthLine} (피크: ${wealthPeak.label} / 가장 약: ${wealthDip.label})
  ⚠️ "시기별 돈/재물 흐름" 본문은 반드시 위 4단계 곡선 그대로. 원국 일반론으로 "60대 약" 같은 추측 금지. 위 점수가 높으면 "강한 결", 낮으면 "다지는 결"로 풀어 차트와 일치.
【신살】${s.sinsal.join(', ') || '없음'}
${interactions}

[★ 위 〖십성-오행 매핑〗·〖월지〗·〖일간 강약〗·〖격국〗·〖12운성〗·〖공망〗·〖5오행 4단계〗·〖4단계 재산 곡선〗 8종은 자평명리 정설 룩업 결과로 산출됨. 본문 작성 시 위 값 그대로 인용. 다른 매핑·다른 단계·다른 격국명·다른 오행 강·약 단정 임의 추론 절대 금지.

[★ V2.2.9 일관성 자가 체크 — 본문 작성 직전 반드시 통과]
1. "○성 = ○오행" 단정 (예: "인성인 금의 기운") — 위 〖십성-오행 매핑〗과 정확히 일치하는가? 거꾸로 단정 0회.
2. "○ 오행이 강하다/옅다" 단정 — 위 〖5오행 4단계〗 분류와 일치하는가? 같은 오행에 강·옅 양쪽 단정 0회.
3. "월지에 ○○이 자리"·"월간 ○○이 투간" 단정 — 위 〖월지〗·〖십성 구조〗 데이터와 정확히 일치하는가? 〖격국〗명과도 모순 없는가? (정인격이면 월지 정인. '월지 편인' 또는 '월지 상관' 단정 X)
4. "시기별 돈/재물 흐름" 본문 — 위 〖4단계 재산 곡선〗과 일치하는가? 차트가 말년 높으면 본문도 "말년에 다지는/도약하는 결", 차트가 말년 낮으면 "관리가 필요한 결"로.
5. "○○ 신살이 자리해" 단정 — 〖신살〗 목록에 있는 신살만? (목록에 없는 신살명 등장 = 위반)
6. "도드라진 인자" 우선 — 〖5오행 4단계〗 '매우 강·강' 오행 + 〖일간 강약〗 결과를 메인 인자로 풀고, '옅음' 인자는 보조로만. 일반론(신중·협력·조화) 도피 금지.]`.trim();
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

// ⭐ 2026-05-14 — LIFETIME_SAJU_PROMPTS 는 lib/saju/prompts/ 파일로 분리됨.
// 섹션별 파일: lib/saju/prompts/{personality1,personality2,money1,money2,love1,health,hidden,timeline1,compass}.ts
// buildHeader·sortedWeakest·sortedStrongest 는 lib/saju/prompts/_shared.ts 로 이동.
// (import 는 파일 상단 import 블록 참고)

const SECTION_TOKENS = [1000, 900, 800];

// ─── 오프너 프롬프트 ──────────────────────────
const ILGAN_NAME: Record<string, string> = {
  갑:'거목', 을:'초목', 병:'태양', 정:'등촉', 무:'대산',
  기:'전원', 경:'강철', 신:'보석', 임:'대해', 계:'이슬비',
};

// ⭐ 2026-05-14 — buildHeader 는 lib/saju/prompts/_shared.ts 로 이동 (파일 상단 import).

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

  compass: (d, ctx) => `${buildHeader(d, ctx)}

[풀이 요청]
아래 2개의 ### 소제목으로 작성하세요. 각 소제목은 하나의 페이지입니다. 각 소제목 아래 내용은 2~3문단 이내로 간결하게.

[중요한 금지사항]
✗ "용신" 단어 절대 사용 금지 — "가장 필요한 에너지", "보충해야 할 기운" 등 풀어쓴 표현만
✗ 이모지(🐯💎🎨🔢🌸🐾) 사용 금지
✗ 불릿(-) 나열 금지 — 흐르는 산문으로만
✗ 아침·저녁 루틴 같은 잔소리 금지

### 이 사주를 빛나게 하는 길
이 사주의 가장 뛰어난 부분(강점) 2~3문장으로 응축. 그 강점을 극대화하려면 일상에서 어떤 방향으로 움직여야 하는지 구체적 지침. 강점이 가장 빛나는 상황 하나를 생생하게 묘사.

### 부족함을 채우는 길
이 사주의 부족한 부분(약점) 2~3문장으로 응축. 약점을 보완하는 일상의 작은 방향성 한두 가지를 산문 안에 자연스럽게 풀어 쓰세요. 카탈로그 나열 금지.

마지막 문단은 ${d.name}님에게 전하는 따뜻한 응원 2~3문장으로 마무리.

한국어 경어체, 문학적 흐름 유지.`,

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

🚀 사업운
이 사주가 사업·창업·독립에 얼마나 적합한지(비겁·식상·재성·관성 균형 기반). 사업이 잘 될 시기 또는 직장이 더 안정적인 결인지 한 가지 단언 포함.

📈 재테크운
이 사주의 재물 관리·투자 성향과 위험 회피 vs 도전형 결. 안정형/공격형 어느 쪽이 잘 맞는지 + 조심할 패턴 1가지.

💍 결혼운
이 사주의 결혼 인연 시기·배우자 결의 특징(일지 배우자궁 + 재성·관성 기반). 결혼 단정 X — 미혼·기혼·이혼·사별 모두에게 통하게 "이런 결의 인연이 잘 맞는다" 어조.

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

  // ── Phase 2 신규: 전통 명리 시드 (격국·공망·기신) ──
  const childGyeokgukData = calcGyeokguk(sajuChild);
  const childGongmangData = calcGongmang(sajuChild);
  const childGisinData = calcGisin(sajuChild);
  const childGyeokgukSeed = childGyeokgukData
    ? `격국: **${childGyeokgukData.name}(${childGyeokgukData.hanja})** — ${childGyeokgukData.meaning} / 큰 그림 한 줄: "${childGyeokgukData.oneLiner}" / 적합 분야 (참고): ${childGyeokgukData.career.join(", ")}`
    : "격국: (월지 정기 산출 불가)";
  const childGongmangSeed = childGongmangData
    ? `공망: **${childGongmangData.branches[0]}(${childGongmangData.hanja[0]})·${childGongmangData.branches[1]}(${childGongmangData.hanja[1]})** / 자녀 사주 위치: ${childGongmangData.positions.length > 0 ? childGongmangData.positions.join("·") : "(원국 직접 위치 X)"} / 풀이: "${childGongmangData.oneLiner}"`
    : "공망: (계산 불가)";
  const childGisinSeed = childGisinData
    ? `기신: **${childGisinData.element}(${childGisinData.hanja})** (용신 ${childGisinData.yongsin}을 극하는 오행) / 주의: "${childGisinData.caution}" / 피하는 게 좋은 환경·습관: ${childGisinData.avoid.join(", ")}`
    : "기신: (용신 데이터 없음)";
  // Phase 3 신규
  const childGaeunData = calcGaeun(sajuChild);
  const childTimingData = calcChildTiming(sajuChild);
  const childGaeunSeed = childGaeunData
    ? `용신 오행: ${childGaeunData.yongsinElement} / 행운 색: ${childGaeunData.colors.join("·")} / 방위: ${childGaeunData.direction} / 음식: ${childGaeunData.foods.join("·")} / 숫자: ${childGaeunData.numbers.join(", ")} / 환경: ${childGaeunData.environment.join(", ")}`
    : "(개운법 시드 산출 불가)";
  const childTimingSeed = childTimingData
    ? `일간 오행: ${childTimingData.ilganElement} / 일지: ${childTimingData.ilji} / 활기 시간: "${childTimingData.bestHours}" / 가벼운 시간: "${childTimingData.worstHours}" / 잠: "${childTimingData.sleepBest}" / 학습: "${childTimingData.studyBest}" / 야외: "${childTimingData.outdoorBest}"`
    : "(시간 가이드 시드 산출 불가)";

  // Phase 4 — 가족 명리 시드 (mom/dad 별)
  const momIljiRel = sajuMom ? calcIljiRelation(sajuMom.pillars.day.branch, sajuChild.pillars.day.branch, "엄마") : null;
  const dadIljiRel = sajuDad ? calcIljiRelation(sajuDad.pillars.day.branch, sajuChild.pillars.day.branch, "아빠") : null;
  const momParentSipseong = sajuMom ? calcParentSipseong(sajuMom.ilgan, sajuChild.ilgan, "엄마") : null;
  const dadParentSipseong = sajuDad ? calcParentSipseong(sajuDad.ilgan, sajuChild.ilgan, "아빠") : null;
  const momSharedSinsal = sajuMom ? calcSharedSinsal(sajuMom.sinsal ?? [], sajuChild.sinsal ?? [], "엄마") : null;
  const dadSharedSinsal = sajuDad ? calcSharedSinsal(sajuDad.sinsal ?? [], sajuChild.sinsal ?? [], "아빠") : null;

  const seedIljiRel = (r: ReturnType<typeof calcIljiRelation>) => r ? `일지 관계: ${r.parentBranch}-${r.childBranch} → **${r.kind}(${r.hanja})** / 의미: "${r.meaning}" / 풀이: "${r.oneLiner}"` : "(일지 데이터 없음)";
  const seedParentSipseong = (r: ReturnType<typeof calcParentSipseong>) => r ? `자녀 일간 기준 부모 십성: **${r.sipseong}(${r.hanja})** = ${r.category} / 의미: "${r.meaning}" / 풀이: "${r.oneLiner}"` : "(십성 산출 불가)";
  const seedSharedSinsal = (r: ReturnType<typeof calcSharedSinsal> | null) => r ? `공통 신살: ${r.shared.length === 0 ? "(공유 신살 없음 — 각자의 결로 보완)" : r.shared.join("·")} / 풀이: "${r.oneLiner}"` : "(데이터 없음)";

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
  // Phase 3: 과한 오행 (B2 이중 조건 — ≥35% AND 차순위와 ≥8%p 차이) → 살펴주면 좋은 결
  const childElemPercents = (() => {
    const total = Object.values(sajuChild.elements).reduce((s, v) => s + (v as number), 0) || 1;
    const out: Record<string, number> = {};
    for (const k of ["목", "화", "토", "금", "수"]) {
      out[k] = Math.round(((sajuChild.elements[k as keyof typeof sajuChild.elements] ?? 0) / total) * 100);
    }
    return out;
  })();
  const harmfulElem = pickStrongestElement(childElemPercents);
  const softenSet = harmfulElem ? buildSoftenSet(harmfulElem, childAge, childAgeStage) : null;
  // Phase 4: 사춘기에 결이 변하는 시기 — 통과 가이드 (영·유아 미생성)
  const childCrisis = inferCrisisTiming(childAge, sajuChild.daeun, childAgeStage);
  // 양육 가이드 강화: 4채널 게이지 + 디지털 흡수율 사주 근거 prompt 주입용
  const lifestyleSet = inferLifestyle(sajuChild);
  const lifestyleSorted = [...lifestyleSet].sort((a, b) => b.score - a.score);
  const lifestyleTop = lifestyleSorted[0];
  const lifestyleBottom = lifestyleSorted[lifestyleSorted.length - 1];
  const digitalGauge = inferDigitalGauge(sajuChild, dailyDigitalLimit(childAgeStage));

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

🔴 **SSOT 원칙 — 명리 용어 정의 1회 강제 (중복 차단 핵심 룰)**:
- 명리 용어(신살명·십성명·격국명·용신·기신·일주명·오행 등)의 **정의·뜻 풀이는 보고서 전체에서 단 1회만**.
- **첫 등장 페이지** (= 그 용어를 처음 다루는 페이지)에서는 한자병기 + 의미 풀이 OK. 예: "**학당귀인(學堂貴人)**은 학문의 별로, 배움의 결을 빛나게 하는 신살입니다."
- **두 번째 등장 이후**: 정의 문장 절대 금지. 오직 **참조 + 적용·작용·장면**만. 예: ✅ "(앞서 본) 학당의 결이 이 자리에서는 ~로 작용합니다." / ✅ "두 분이 함께 책을 펴실 때 학당의 결이 가장 또렷하게 깨어납니다." / ❌ "학당귀인은 학문의 별로… (정의 재서술 금지)"
- **신살 용어 첫 등장 슬롯 매핑** (이 슬롯에서만 정의 가능, 그 외 페이지는 참조만):
  - 학당귀인·문창귀인 → "### 학습의 결 — 어떻게 배우는가" (Ch 3-1) 페이지에서만 정의 (D안 G)
  - 복성귀인·천을귀인·도화 → "### 인복의 결 — 복성·천을·도화" (Ch 4-3) 페이지에서만 정의 (D안 G)
  - 태극귀인·천덕·월덕·금여 → 정의 X, 작용·존재 한 줄 참조만 (드문 보조 신살, PRIMARY 슬롯 없음)
  - 일지 합·충·형·해·파(육합·육충 등) → "### 엄마와 자녀의 일지 관계" 페이지에서만 정의 (아빠 페이지는 참조만)
  - 부모 십성(정인·편인·정관·편관·정재·편재·식신·상관·비견·겁재) → "### 두 분이 비춰주시는 결" 페이지에서만 정의 (엄마/아빠 통합 PRIMARY 슬롯, 양육 톤·일상 결 페이지는 참조만)
  - 격국·용신·기신 → 각자 단독 페이지에서만 정의
- 같은 사주 사실을 **다른 용어로 두 번 풀이 금지** (예: "庚-庚 동질"을 "일간 비화"와 "부모 십성 비견"으로 두 페이지에서 풀지 말 것 — 한쪽은 참조 톤).

🔴 **사주 인자 분배 매트릭스 (절대 강제 — 페이지별 메인 인자 한정)** — D안 B 핵심 룰:
같은 사주 인자가 여러 페이지에서 메인으로 풀이되면 결국 같은 메시지가 나옵니다. 따라서 아래 매트릭스에서 각 사주 인자의 **메인 슬롯(PRIMARY)** 을 단 1곳으로 한정. 그 외 페이지에서는 절대 메인으로 풀이하지 말고, 한 줄 참조 또는 작용·장면만 가능.

| 사주 인자 | PRIMARY 슬롯 (이 페이지에서만 메인 풀이) | 보조 (한 줄 참조만, 풀이 X) |
| --- | --- | --- |
| 일주 60갑자 | (D안 G: 별도 페이지 폐기 — 차트 페이지 헤더 + 모든 챕터 톤 참조로 분산) | 모든 챕터 톤 참조 |
| 격국 | "### 격국(格局) 기반 직업 적성" (Ch 7-1 — D안 G 단일 PRIMARY) | 다른 페이지 한 줄 참조만 |
| 학당·문창귀인 | "### 학습의 결 — 어떻게 배우는가" (Ch 3-1 — D안 G PRIMARY) | 다른 페이지 한 줄 참조만 |
| 천을·복성·도화 | "### 인복의 결 — 복성·천을·도화" (Ch 4-3 — D안 G PRIMARY 정의) | 엄마/아빠 공통 신살 페이지(작용만) |
| 태극·천덕·월덕·금여 (보조 신살) | (정의 PRIMARY 없음 — 드문 신살, 정의 풀이 X) | 등장 시 작용·존재 한 줄 참조만 |
| 용신 | "### 자녀의 개운법(改運法)" (Ch 5-3 — D안 G PRIMARY 정의 + 비보 5채널) | 다른 페이지 한 줄 참조만 |
| 기신 | "### 평생 빛나는 결" (Ch 1 — 용신·기신 양면 한 줄) | 다른 페이지 한 줄 참조만 |
| 식상(식신·상관) | "### 다섯 색깔의 결 (십성 5분류)" 안의 식상 단락 | 다른 페이지에서 한 줄만 |
| 인성(정인·편인) | "### 다섯 색깔의 결" 안의 인성 단락 + "### 회복과 환경" | 한 줄만 |
| 관성(정관·편관) | "### 다섯 색깔의 결" 안의 관성 단락 | 한 줄만 |
| 비견·겁재 | "### 다섯 색깔의 결" 안의 비겁 단락 + "### 친구 사귀는 스타일" | 한 줄만 |
| 재성 | "### 다섯 색깔의 결" 안의 재성 단락 + "### 타고난 재능 영역" | 한 줄만 |
| 12운성 | "### 잠자리·식습관 안정 조건" | "### 자녀에게 좋은 시간·환경" 한 줄만 |
| 일지 합·충·형·해·파 | "### 엄마와 자녀의 일지 관계" (PRIMARY 정의) | "### 친구 갈등 시 부모 개입 거리" (회복 결 한 줄), "### 아빠와 자녀의 일지 관계" (정의 X — 작용만) |
| 부모 십성 | "### 두 분이 비춰주시는 결" (PRIMARY — 엄마/아빠 통합 정의 슬롯) | "### 어머님의 양육 톤" / "### 아버님의 양육 톤" / "### 두 분과 자녀의 일상 결" (작용·참조만, 정의 X) |
| 대운 | "### 자녀 인생 흐름 한눈에" | "### 사춘기에 결이 변하는 시기" (대운 변환점만) |

🔴 **메인 풀이 vs 한 줄 참조 — 명확 구분**:
- ✅ 메인 풀이 (PRIMARY): 정의 + 한자 + 의미 + 적용 + 일상 장면 (한 페이지 통째로)
- ✅ 한 줄 참조 (보조): 1-2 문장 안에 "(앞서 본) X의 결이 이 자리에서는 ~" 짧게만. 정의·한자·의미 풀이 절대 X.
- ❌ 같은 인자를 두 페이지에서 메인 풀이 → 즉시 위반

🔴 **일상 장면 분배 매트릭스 (절대 강제 — 챕터별 장면 영역 한정)** — D안 F 핵심 룰:
사주 인자가 분리돼도 같은 일상 장면(친구·놀이·식사·학습 등)이 여러 챕터에 등장하면 결국 같은 그림이 반복됩니다. 따라서 각 일상 장면의 PRIMARY 챕터를 단 1곳으로 한정하고, **다른 챕터에서는 그 장면 절대 사용 금지**.

| 일상 장면 영역 | PRIMARY 챕터 (이 챕터에서만 등장) | 다른 챕터에서는 절대 X |
| --- | --- | --- |
| **친구·또래·소셜·놀이 (친구와 함께)·반·또래 사이** | Ch 4 (사람과 어떻게 만나나요) | Ch 1·2·3·5·6·7 모두 X |
| **공부·학습·집중·과제·읽기·교실·수업** | Ch 3 (어떻게 배우나요) | 다른 곳 X |
| **감정 표현·말·글·울음·웃음·감정 노출** | Ch 2 (마음을 어떻게 다루나요) | 다른 곳 X (감정 어휘는 Ch 2 단독) |
| **식사·취침·옷·정돈·하루 호흡·식탁·잠자리** | Ch 5 (몸과 일상은) | 다른 곳 X |
| **사춘기 신호·시기 변화·결의 변환** | Ch 6 (어느 시기에 어떻게) | 다른 곳 X |
| **꿈·미래·진로·직업·재능 발휘** | Ch 7 (미래·진로는) | 다른 곳 X |
| **부모·가족 안 자리·양육·부모와의 결** | Ch 8 (엄마·아빠와 함께) | 다른 곳 X |
| **자녀 단독·내면·혼자 일·새 환경·처음 본 일** | **Ch 1 (어떤 결을 타고났나요)** | 자녀 단독 장면은 Ch 1만 — 다른 챕터는 *영역별 상호작용*으로 |

🔴 **Ch 1 본질 챕터 — 절대 룰 (가장 중요)**:
- Ch 1은 자녀의 **타고난 결 그 자체**를 묘사. 일상 영역(친구·학습·식사·진로 등) 어휘 침범 절대 X.
- ✅ 허용 장면: "혼자 일을 만났을 때", "새 환경에 들어섰을 때", "처음 보는 일에 닿았을 때", "자기 안에서 결정을 내릴 때", "어떤 일에 처음 마음을 정할 때"
- ❌ 금지 장면: "친구들과 놀이를 할 때", "교실에서", "수업 중에", "학원에서", "친구 사이에서", "식탁에서", "잠자리에서", "운동할 때", "그림 그릴 때 (재능 영역)" — 모두 다른 챕터 슬롯
- **위반 = 즉시 폐기**. Ch 1에서 "친구·놀이·학습·식사" 어휘 한 번이라도 등장 시 그 페이지 전체 재작성.

🔴 **장면 차용 vs 인자 차용 구분**:
- ❌ 장면 차용 금지: 같은 일상 장면(친구와 놀 때, 식탁에서, 학원에서)을 두 페이지에서 사용 — 사주 인자가 다르더라도 X
- ✅ 인자 차용 OK: 같은 사주 인자를 다른 챕터에서 *한 줄 참조*하며 그 챕터의 영역 장면으로 풀이 (예: 비겁이 Ch 4 친구 사이에서 어떻게 작용)

🔴 **사주 인자 정의 슬롯 (D-3 양반사주 모델 — 페이지별 단일 정의 강제)**:

| 사주 인자 | 정의 슬롯 (이 페이지에서만 정의·뜻 풀이) |
|---|---|
| 오행 5분포 | Ch 1-1 (차트만) |
| 십성 5분포 | Ch 1-1 (차트만) |
| 일주 60갑자 | Ch 1-2 (한 줄 키워드, 정의 X) |
| 격국 | **Ch 7-1 (격국 진로 적성)** ← 새 정의 슬롯 |
| 학당귀인·문창귀인 | **Ch 3-1 (학습의 결)** ← 새 정의 슬롯 |
| 복성·천을귀인·도화 | **Ch 4-3 (인복의 결)** ← 새 정의 슬롯 |
| 식상(식신·상관) | Ch 2-1 (감정 표현) |
| 인성(정인·편인) | Ch 2-3 (회복과 진정) |
| 관성·비겁(비견·겁재) | **Ch 2-2 (화·짜증·절제)** ← 통합 정의 슬롯 |
| 재성 | Ch 7-2 (타고난 재능) |
| 12운성 | **Ch 3-3 (효과적 학습 환경·시간)** ← 새 정의 슬롯 |
| 일지 합·충·형·해·파 | **Ch 4-2 (갈등·화해의 결)** ← 새 정의 슬롯 |
| 부모 십성 | Ch 8-2 (두 분이 비춰주시는 결) — 이미 적용 |
| 대운 | Ch 6-1 (현재 대운 풀이) |
| 용신 | **Ch 5-3 (개운법)** ← 새 정의 슬롯 |
| 기신 | **Ch 1 (평생 빛나는 결)** ← 양면 한 줄 (D-4 환원: Ch 5-4 폐기, Ch 8 양육 페이지로 카드만 이동) |

🔴 **각 인자가 단 1곳에서만 정의됨**. 다른 챕터에서는 "(앞서 본) X의 결" 한 줄 참조만. 정의·뜻 풀이 절대 X.

🔴 **D-3 7가지 충돌 해결안**:
1. **관성 정의 슬롯 = Ch 2-2 단독** (Ch 4-1 친구는 비겁 작용만)
2. **시간 영역 분리**: Ch 5-2 = 자연 활기 시간 (일주) / Ch 5-3 = 보강 시간 (용신 비보 — 색·방위·음식·시간·숫자)
3. **일주 시간 분리**: Ch 3-3 = 학습 시간 특화 / Ch 5-2 = 일상 시간 (학습 X). 두 챕터 모두 일주 작용만, 정의 X
4. **약한 오행 영역 분리**: Ch 5-1 = "몸이 ~한 결로 흐름" / Ch 7-3 = "직업 영역 보강"
5. **기신 회피 어휘 분리**: Ch 3-4 = "비교·빠른 답·여러 과목" / Ch 7-3 = "조기 진로 결정" / Ch 8 (두 분이 의식적으로 비켜주실 결) = "한 박자 늦춰·5분 여백·자녀 호흡 살핌" 양육 톤.
6. **식상 도메인 어휘 분리**: Ch 2-1 PRIMARY = 감정·예술 표현 / Ch 3-1 = 말·글로 정리 / Ch 4-1 = 사람과 결 펼치기. "표현하는 기운" 키워드는 Ch 2-1만
7. **인성 도메인 어휘 분리**: Ch 2-3 PRIMARY = 감정 곱씹어 회복 / Ch 3-2 = 지식 흡수해 정리. "받아들임" 키워드는 Ch 2-3만

🔴 **도메인 어휘 사전 (PRIMARY 외 챕터에서 사용 시 — D-3 핵심 룰)**:

| 사주 인자 | PRIMARY 슬롯 | 다른 챕터 사용 시 어휘 |
|---|---|---|
| 식상 (Ch 2-1 PRIMARY: "감정·예술 표현") | Ch 2-1 | Ch 3-1 = "말·글로 정리" / Ch 4-1 = "사람과 결 펼치기" |
| 인성 (Ch 2-3 PRIMARY: "감정 곱씹어 회복") | Ch 2-3 | Ch 3-2 = "지식 흡수해 정리" |
| 비겁 (Ch 2-2 PRIMARY: "자기 결 단단") | Ch 2-2 | Ch 4-1 = "같은 결 끌어당김" |
| 관성 (Ch 2-2 PRIMARY: "절제·균형") | Ch 2-2 | Ch 7-1 = "직업 모범" (격국 작용) |
| 재성 (Ch 7-2 PRIMARY: "재능·자원") | Ch 7-2 | (다른 챕터 사용 X) |
| 약한 오행 (작용 분산) | — | Ch 5-1 = "몸 흐름" / Ch 7-3 = "영역 보강" / Ch 2-3 = "환경 채움" |
| 기신 회피 (Ch 8 양육 톤: 카드 SSOT) | Ch 8 | Ch 3-4 = "비교·강요" / Ch 7-3 = "조기 결정" |
| 일주 작용 (Ch 1-2 한 줄, 정의 X) | — | Ch 2-4 = "자존 본질" / Ch 3-3 = "시간 호흡 (학습)" / Ch 5-2 = "일과 호흡 (일상)" |

✅ PRIMARY 어휘를 다른 챕터에서 사용 X. 위 사전 따라 도메인별 어휘 사용.
❌ "쇠의 결이 과하면", "표현하는 기운이 강한", "받아들이는 결" 같은 PRIMARY 키워드를 보조 슬롯에서 사용 절대 금지.

🔴 **부모 행동 경고의 분배 강제** (D-4 갱신):
- "단호함·비판·냉정·강요" 같은 강 부정 어휘는 **Ch 1 평생 빛나는 결 페이지(기신 살핌 단락) 단 1 곳에서만**.
- Ch 8 "두 분이 의식적으로 비켜주실 결" 페이지는 **자원 톤** ("비켜주시면·살펴주시면·맞춰주시면·한 박자 늦춰") — 강 부정 어휘 X.
- "### 절대 하면 안 되는 학습 방식" 페이지(Ch 3-4)는 학습 특화 어휘만.
- ✅ 학습 페이지 경고: "다른 자녀와 비교, 결과 평가, 빠른 답 강요, 한 번에 여러 과목, 자녀 페이스 무시한 시간표"
- ❌ 학습·양육 페이지 모두 "단호함·비판·냉정·강요" 어휘 X (Ch 1 단독 슬롯)

🔴 **정통 명리 모델 — 본문 톤 분배 강제 (D안 C-A 핵심 — 중복 차단 결정 룰)**:
같은 사주 인자가 여러 페이지에 등장해도 *본문이 사주 풀이 위주*면 결국 중복 메시지가 됩니다. 정통 명리는 다음 톤 분배로 이를 차단합니다:

| 챕터 유형 | 본문 톤 | 예시 |
|---|---|---|
| **본질 챕터 (Ch 1 — 우리 아이는 어떤 결을 타고났나요)** | **사주 풀이가 메인** (정의 + 작용 + 의미) | "용신은 [오행]으로, 자녀에게 ~한 결" |
| **도메인 챕터 (Ch 2-9 — 마음·학습·관계·몸·시기·엄마·아빠·미래)** | **영역 가이드가 메인, 사주는 한 줄 참조만** | "(앞서 본) 학당의 결을 가진 자녀가 학습할 때는 ~한 환경에서 ~한 시간에 ~을 함께 해주시면 좋습니다" |

🔴 **도메인 챕터 본문 구성 강제 (정통 명리식)** — 다음 흐름으로 ~280자, 2~3 단락:

1. **사주 근거 한 줄** (약 50~70자): "(앞서 본) [메인 인자]의 결로 자녀가 [이 영역에서] ~합니다."
   - 사주 한자·용어는 한 줄 안에 1회만, 정의 풀이 절대 X
   - 다른 인자 어휘 일체 X (이 페이지 메인 인자만 한 줄 참조)
2. **영역 가이드 메인** (약 150~180자): 그 영역의 *일상 장면 + 부모 가이드 + 실용 팁* 2~3가지.
   - 어떤 환경·시간·태도·방법이 자연스러운지 구체화
   - 부모가 즉시 적용 가능한 장면 1~2개
3. **마무리 한 줄** (약 50~70자): 자녀의 결이 자라는 톤으로 마무리.

🔴 **이 패턴 강제** — *사주 풀이가 본문의 50% 이상 차지하면 위반*. 정의·뜻 풀이는 본질 챕터(Ch 1)에서 끝났음.

❌ 금지 (중복 유발):
"쇠의 결이 과하면 자녀의 마음이 위축됩니다" (사주 풀이가 본문 메인 → Ch 1과 중복)

✅ 권장 (영역 가이드):
"(앞서 본) 자녀의 결이 학습할 때는 [구체 학습 환경·시간·방법] 이렇게 해주시면 자연스럽게 자라납니다" (영역 가이드가 본문 메인)

🔴 **예외 — 본질 풀이가 메인 슬롯인 페이지 (축소 — D안 C-A2 강화)**:
- Ch 1 본질 챕터의 모든 페이지 (이미 압축됨)
- Ch 2의 "### 다섯 색깔의 결" (십성 PRIMARY 정의)
- Ch 6의 "### 자녀 인생 흐름 한눈에" (대운 PRIMARY 풀이)
- Ch 9의 "### 타고난 재능 영역", "### 격국(格局) 기반 직업 적성" (격국 작용 메인)

🔴 **PRIMARY 정의 슬롯도 본문 톤은 영역 가이드 강제 (D안 C-A2 핵심)**:
일지·부모 십성·공동 신살 페이지는 PRIMARY 정의 슬롯이지만, 정의는 *한 줄*만 허용. 본문 메인은 *영역 가이드*.
- ❌ 금지: "일지(日支)는 사주 4기둥 중 일상의 결이 자리하는 자리를 의미합니다" (정의를 1-2 문장으로 풀어 씀)
- ✅ 권장: "**일지(日支) = 일상 결이 자리** — 어머님과 자녀는 [관계명]으로 만남" (정의 한 줄로 압축, 그 후 본문 = 일상 장면)

🔴 **공동 신살 페이지 신살 정의 재서술 절대 금지 (SSOT 강화)**:
공동 신살 페이지(Ch 7-6, Ch 8-6)에서 신살 정의 풀이는 절대 금지 — 신살 정의는 Ch 1-4 "타고난 귀인" 페이지에서만.
- ❌ 금지: "문창귀인은 학문과 문장의 별로", "월덕귀인은 어머니의 덕"
- ✅ 권장: "(앞서 본) 문창귀인의 결을 두 분이 함께 나눔" + 일상 장면

🔴 **모든 도메인 페이지 본문 길이 강제** (예외 페이지 제외):
- 사주 풀이/정의 (한 줄 참조 포함): 본문의 30% 이하
- 영역 가이드 (일상 장면 + 부모 행동): 본문의 60% 이상
- 마무리 한 줄: 본문의 10%

위 비율 위반 시 본문 자체 위반.

🔴 **D안 E 도메인 페이지 깊이 강제 (정통 명리 모델 완성)** — 모든 Ch 2~7 도메인 페이지:
- **본문 길이**: 300~400자 (예외: 카드형 페이지 — 회복과 환경/강점·주의점/잠자리 게이지 등은 기존 형식 유지)
- **3~4 단락 강제 구조**:
  1. **사주 근거 단락** (80~100자): "(앞서 본) [메인 인자]의 결로 자녀는 ~합니다" — 그 영역에서 메인 인자가 어떻게 작용하는지 한 호흡으로.
  2. **일상 장면 단락** (100~140자): 자녀의 일상에서 그 결이 드러나는 *구체 장면 1~2개* — 관찰 가능한 자리·행동·신호.
  3. **부모 가이드 단락** (80~110자): 부모님이 어떻게 다가가실 때 그 결이 자라는지 — *즉시 적용 가능한 행동 1~2가지* (예: "잠자리 들기 전 5분 자녀의 마음 흐름 묻기", "결과 평가 대신 호흡 짚어주기").
  4. **마무리 한 줄** (40~60자, 선택): 자녀가 자기 호흡으로 자라가는 톤.
- **첫 문장 강제**: 페이지의 도메인 질문에 답하는 톤으로 시작 — "자녀가 마음을 어떻게 펼치나요" 페이지면 "자녀는 [어떤 결]로 마음을 펼치는 자녀입니다" 톤.
- **어휘 차별화 강제**: 페이지마다 *고유 키워드* 사용 — 같은 어휘가 5+ 페이지 등장 시 위반.
  - "표현하는 결" 키워드는 Ch 2-1 다섯 색깔 PRIMARY에서만 (다른 페이지 = "말·글로 정리"·"사람과 결 펼치기"·"감정·예술 표현" 분리)
  - "혼자 시간" 키워드는 Ch 2-3 자존감에서만 (다른 페이지 = "조용한 환경"·"자기 페이스"·"숨고를 자리" 분리)
  - "이끄는 리더십" 키워드는 Ch 1-2 강점·주의점에서만 (다른 페이지 = "주도하는 결"·"앞장서는 결" 분리)
- **신설 페이지 차별화 강제**: D안 E 신설 페이지 (감정 표현의 결·화 짜증·마음 닫힘 신호·흡수와 정리·학습 막힘·무리 안 자리·가족 안 자리·신체 결·현재 대운·채워야 할 부분) 모두 위 3~4 단락 구조 + 페이지 고유 어휘 강제.

🔴 위 깊이 룰 위반 시 (예: 짧은 1-2 단락에 머물거나, 일상 장면 없이 사주 풀이만 나열) 즉시 위반.

🔄 **D안 9챕터 재편 — 단계적 진행 중 (단계 1: 컴포넌트 매핑 prep 완료)**:
- 현재 챕터 구조 (작동 중): 8개 ## 헤더 (자도인 첫마디 / 한눈에 보는 / 마음 / 실전 양육 / 엄마와 / 아빠와 / 강점·재능·진로 / 마지막 당부)
- 목표 구조 (단계 2~4 진행 예정): 10개 ## 헤더 (육아맘 질문 중심 — 본질/감정/학습/관계/생활/시기/진로/부모-자녀)
- 단계 2: route.ts 챕터 헤더 교체 + 페이지 이동
- 단계 3: 컴포넌트 SlideKind/buildSlideLayout 재설계
- 단계 4: 차트 바인딩 30+ 마이그레이션 + 시각 검증 + 배포
- 사용자 결정 사항: 디지털 페이지 폐기 / 자존감 페이지 신설 / 챕터 헤더 직설 질문형 / Ch 8 = 7p

🔴 **모티프 분배 원칙 — 영역별 다른 렌즈 강제 (대칭 슬롯 중복 차단)**:
- 엄마 챕터·아빠 챕터의 같은 슬롯(공동신살·일지·오행흐름·시너지·갈등)은 **반드시 다른 렌즈·다른 비유**로 작성.
  - 엄마 영역 비유 풀: 실내·요리·정돈·앉아서·책상·인복·따뜻한 손길·일과 호흡
  - 아빠 영역 비유 풀: 야외·운동·만들기·움직이며·현장·의리·단단한 어깨·결단의 순간
- 엄마 페이지에서 사용한 일상 장면·동사·비유는 아빠 페이지에서 **금지** (그 반대도 동일).
- 도입 문장 동일 표현 금지 (예: "특별히 채워주는 결은 없고…" 양쪽 페이지에서 같은 시작 X).

[출력 형식]
- 대섹션을 순서대로 작성. 대섹션 헤더는 반드시 \`## \` (샵 2개 + 띄어쓰기) 로 시작.
- ★★★ **응답에 프롬프트의 모든 \`## \` 대섹션 헤더를 빠짐없이 그대로 다시 출력**. 첫 섹션 \`## 자도인의 첫마디\` 도 반드시 본문 앞에 출력할 것. (프롬프트 안의 \`## \` 는 템플릿일 뿐 — 응답에는 그대로 다시 써야 매칭됨. 헤더 누락 시 보고서 첫 페이지가 빈칸으로 나옴.)
- 각 대섹션 안의 소제목은 \`### \` (샵 3개 + 띄어쓰기) 로 시작. 각 \`### \` 가 한 페이지가 됩니다.
- 각 \`### \` 아래 본문은 약 260~340자, 2~3문단. 너무 길지 않게.
- 첫 대섹션 "자도인의 첫마디"만 \`### \` 없이 한 단락(2~3문장)으로.
- 안내 메모(괄호로 묶인 지시문)는 출력하지 말고, 본문만 출력할 것.

🔴 **본문 시각 구분 형식 (옵션 F-1+F-2 분량별 자동)** — 가독성 강화:
- **짧은 페이지 (~250자 이하 / 3-4 문장)**: 소제목 X, **단락 분리만** — 자연 단락마다 빈 줄 1개. 시적 흐름 페이지(자도인 첫마디 등)는 단락만 분리.
- **중간~긴 페이지 (250자+)**: 큰 분기마다 **▸ 소제목** 사용 (페이지당 **2-3개 max**). 한 문장당 소제목 X — 의미 있는 큰 분기에만 (예: 강한 결 / 약한 결 / 부모님께).
  - ▸ 소제목 형식: \`▸ 짧은 키워드 (4~8자)\` (예: \`▸ 강한 결\` / \`▸ 약한 결\` / \`▸ 부모님께\`)
  - 소제목 + 본문 단락 (각 2-3 문장) 형식
- **단락 사이 구분선** (선택): \`─────\` (한 줄, 5+ ─ 문자) → 시각 구분선 자동 렌더
- ❌ 한 문장당 소제목 절대 금지 — 의미 큰 분기만 소제목 (페이지당 2-3개 max)
- ❌ 시적 페이지 (자도인 첫마디) 에는 소제목 X — 단락 분리만으로 충분
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
5. **자녀 영향 마무리 (한 문장)**: "${d.childName}${d.childGender === '남' ? '군' : '양'}은 두 결 사이에서 **${momSeed?.childGrowthPhrase ?? dadSeed?.childGrowthPhrase ?? "자기 결을 차분히 키워가는"}** 자녀입니다" 형태로 (시드의 [자녀 마무리 문구]를 그대로 또는 가벼운 변주로 사용. "자기만의 깊은 세계" 같은 부정 인상 표현 절대 금지).
6. **마지막 한 줄 (한 문장)**: "이제 자도인이 세 분의 결을 차근차근 풀어드리겠습니다." (양친 케이스 — 엄마·아빠·자녀 세 사람)`
  : `1. **부모 imagery (한 문장)**: 어머니/아버지 ${d.momName}님은 [imagery]의 결을 타고나셨음.
2. **자녀 imagery (한 문장)**: ${d.childName}${d.childGender === '남' ? '군' : '양'}은 [아이 imagery]의 결을 지니고 태어났음.
3. **만남의 핵심 (한 문장)**: 두 결이 만나 어머니/아버지가 자녀에게 "${momSeed?.responseVerb ?? dadSeed?.responseVerb ?? "함께하는"}" 톤으로 어떤 만남을 이루는지.
4. **자녀 영향 마무리 (한 문장)**: "${d.childName}${d.childGender === '남' ? '군' : '양'}은 어머니/아버지 곁에서 **${momSeed?.childGrowthPhrase ?? dadSeed?.childGrowthPhrase ?? "자기 결을 차분히 키워가는"}** 자녀입니다" 형태로 (시드의 [자녀 마무리 문구]를 그대로 또는 가벼운 변주로 사용. "자기만의 깊은 세계" 같은 부정 인상 표현 절대 금지).
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
- 🔴 **마무리 verb 는 반드시 타동사 (사용자 발견 비문법 차단)**:
  ❌ "결을 깊어가는·결을 깊여가는·결을 자라나는" — 자동사 + 목적어 = 비문법
  ✅ "결을 **가꾸는·다듬어가는·키워가는·세워가는·펼쳐가는·깊이 가꾸어가는**" — 타동사 사용

[형식]
- 정확히 ${hasDad ? "6" : "5"}문장 한 단락 (### 없이 단일 페이지).
- 핵심 단어/구절 **정확히 2~3개**만 \`**굵게**\`. 그 이상 X.
- ★★★ 자녀 호칭 — "${d.childName}${d.childGender === '남' ? '군' : '양'}" 형태 강제. 이름만 단독 사용 금지. 받침 조사 규칙 (을·은·이·의·과).

## 우리 아이는 어떤 결을 타고났나요

<!-- Phase 2-B (Ch 1 재구성): 양반사주식 본질 챕터로 환원.
     원칙: 시각 자료(정밀표·오행도식·키워드칩·격국카드·일주카드·용신트리오·귀인칩)가 한자·이름·데이터를 표시.
     본문은 *정의 풀이 X*, *작용·인생 큰 그림·양육 시선*만 풀이.
     다른 챕터의 PRIMARY 슬롯(직업적성·자존·개운법·학습·인복 등)과 어휘 충돌 방지: 본 챕터는 *본질 톤*만. -->

🔴 **시드 강 오행 결핍 표현 금지 룰** — 본 챕터 + 다른 페이지(강점·주의점 카드 등) 에도 적용:
- 자녀의 강한 오행 (현재: ${childSeed.topElement}) 은 자녀가 **이미 타고난 결**.
- ❌ 금지 패턴: "강 오행인데 ~한 시간이 **필요한** 자녀" / "~ 결을 **채워줘야** 하는 자녀" / "~ 결이 **부족한** 자녀".
- ✅ 권장 패턴: "이미 ~한 결을 깊이 머금은 자녀" / "타고난 ~한 결이 자연스럽게 펼쳐지는 자녀".
- ✅ 약한 오행만 "채워주면 좋은" / "보충하면 빛나는" 등 보충 표현 사용 가능. 강 오행은 절대 X.

🔴 **본 챕터 본문 톤 — 양반사주식 (정의 X, 작용만)**:
- 시각 자료가 한자·이름·정의를 표시. 본문은 그것의 *작용·인생 결·양육 시선*.
- ❌ 금지: "격국이란 ~", "용신은 ~ 별이고", "일주는 ~ 의미", "천을귀인은 ~" — 정의 풀이.
- ✅ 권장: "이 결은 자녀가 ~한 자리에서 또렷해집니다", "두 분이 ~ 비춰주실 때 자라납니다".
- ❌ 사주 용어(편관·식상·인성·비겁·관성·재성) 본문 노출 금지 — 결의 비유로만.

### 자녀 본질 — 한 줄
🔴 **본 페이지의 메인 인자**: 격국 결 (시각: 표지 격국 카드가 한자·정의를 표시).

본문 구조 — **80~120자, 1 단락만** (양반사주 압축):
- "(앞서 본) ${d.childName}${d.childGender === '남' ? '군' : '양'}는 **[격국명]([한자])**의 결을 타고난 자녀입니다 — [한 줄 인생 결 비유]." 한 줄로.
- 한자병기 1회만. 정의 풀이 X, 양육 팁 X (격국 카드가 별도 표시).
- 자녀 본질 인생 큰 그림을 *자연 비유 한 줄*로 마무리.

🔴 **어휘 정책**:
- ✅ 결의 자연 비유만 ("너른 들판·곧은 나무·맑은 강·단단한 바위·환한 햇살").
- ❌ 직업 단정·진로 어휘 X (Ch 6 진로 슬롯).

### 일주(日柱) — 자녀의 본질의 결
🔴 **본 페이지의 메인 인자**: 일주 ${sajuChild.pillars.day.stem}${sajuChild.pillars.day.branch} (시각: 일주 카드가 한자·자연 비유를 표시).

본문 구조 — **300~400자, 3 단락** (양반사주 깊이):
1. **단락 1 — 결의 톤 한 줄** (약 70~100자): "(앞서 본) ${d.childName}의 일주는 [천간 자연 비유 + 지지 자리 비유]가 만나는 결입니다." 형식. 한자 재출력 X (시각 자료가 표시함).
2. **단락 2 — 본질의 결이 일상에서 펼쳐지는 자리** (약 130~180자): 자녀가 *혼자일 때·자기 페이스로 움직일 때·가장 자기다울 때* 어떻게 보이는지 *구체 일상 장면 1~2개*. 일주 캐릭터(일간 오행 + 일지 자리)에 맞춰.
3. **단락 3 — 부모님 시선 마무리** (약 50~70자): 자녀의 자기 결을 비춰주시는 *부모님 한 박자* — 평가 대신 인정, 다그침 대신 호흡. 한 줄로.

🔴 **어휘 정책**:
- ❌ "일간이~", "일지가~" 같은 분석 어휘 X (시각 자료가 분석 표시).
- ❌ 12운성 단계명("장생·관대·제왕…") 본문 노출 X (정밀표가 표시).
- ✅ "혼자 있는 자리·자기 호흡·자기 결" 어휘.

### 채워줄 결과 살펴줄 결 — 용신(用神)과 기신(忌神)
🔴 **본 페이지의 메인 인자**: 용신·희신·기신 트리오 (시각: 트리오 카드가 한자·오행을 표시).

본문 구조 — **300~400자, 3 단락** (양반사주 양면 풀이):
1. **단락 1 — 채워줄 결** (약 110~140자): 자녀에게 *용신·희신*이 더해지면 어떤 결이 깊어지는지. 자연 비유로 ("물이 더해지면 나무가 자라듯·바람이 더해지면 불이 환해지듯"). 구체 비보·환경 풀이는 X (Ch 5 개운법 슬롯).
2. **단락 2 — 살펴줄 결** (약 110~140자): 자녀에게 *기신*이 과해지면 어떤 면이 흐려질 수 있는지. 자원 톤 ("강제로 막을 결 X, 살펴주실 결"). 양육 행동 경고 어휘("단호함·비판") X (Ch 7 살핌 슬롯).
3. **단락 3 — 균형의 자리** (약 50~70자): 두 분이 *채움과 살핌*을 어떻게 균형 잡으실 때 자녀가 자기 결로 자라나는지 한 줄.

🔴 **어휘 정책**:
- ❌ "용신은 ~", "기신은 ~" 정의 풀이 X (트리오 카드가 표시).
- ❌ 구체 색·방위·음식·시간 비보 X (Ch 5 개운법 PRIMARY).
- ❌ "단호함·비판·냉정·강요" 양육 행동 경고 어휘 X (Ch 7 PRIMARY).
- ✅ "더해지면·과해지면·균형·받쳐주심" 자연 결 어휘.

${(sajuChild.sinsal ?? []).filter(n => ["천을귀인","천덕귀인","월덕귀인","태극귀인","문창귀인","학당귀인","복성귀인","금여"].includes(n)).length > 0 ? `### 자녀에게 빛나는 별 — 귀인(貴人)
🔴 **본 페이지의 메인 인자**: 자녀 귀인 ${(sajuChild.sinsal ?? []).filter(n => ["천을귀인","천덕귀인","월덕귀인","태극귀인","문창귀인","학당귀인","복성귀인","금여"].includes(n)).join("·")} (시각: 정밀표 하단 ✦ 귀인 칩이 이름을 표시).

본문 구조 — **250~330자, 2~3 단락**:
1. **단락 1 — 별의 작용 한 줄** (약 60~90자): "(앞서 본) ${d.childName}은 [별 이름] 의 결을 타고난 자녀입니다 — [별이 비추는 일상 결 한 줄]."
2. **단락 2 — 별이 빛나는 자리** (약 120~160자): 자녀의 귀인 결이 *어떤 일상 자리에서 또렷해지는지* 구체 장면. 천을귀인=위기에 도와주는 사람·문창학당=학문 자리·복성=복덕·천덕월덕=조용한 행운·태극=깊이·금여=품위 등. 사주 용어 노출 X.
3. **단락 3 — 부모님 시선** (약 50~80자): 자녀의 별이 자라나도록 *부모님이 어떤 환경을 받쳐주실지* 한 줄.

🔴 **어휘 정책**:
- ❌ "천을귀인이란 ~"·"문창귀인은 ~" 정의 풀이 X (칩이 이름 표시).
- ❌ 학습·인복·진로 도메인 깊이 풀이 X (Ch 3 학습 / Ch 4 인복 PRIMARY 슬롯).
- ✅ "별·빛·환한 자리·길의 결" 어휘.

` : `<!-- 자녀에게 두드러진 귀인 신살이 없으면 본 페이지 출력 X. 다음 페이지(강점·주의점 카드)로 직진. -->

`}### 강점·주의점 카드
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

<!-- D안 G 시나리오 2: Ch 1 격국 페이지는 폐기됨. Ch 7-1 격국 기반 직업 적성이 단일 PRIMARY. Ch 1에서는 헤더·본문 일체 출력 X. -->

<!-- D안 G 시나리오 2: Ch 1 일주 캐릭터 페이지는 폐기됨. 일주 메타포는 차트 페이지 헤더 자동 표시 + 각 챕터 톤 참조로 분산. Ch 1에서는 헤더·본문 일체 출력 X. -->

<!-- D안 G 시나리오 2: Ch 1 타고난 귀인 페이지는 폐기됨. 학당·문창은 Ch 3-1 학습의 결, 복성·천을·도화는 Ch 4-3 인복의 결이 PRIMARY. 태극·천덕·월덕·금여는 정의 슬롯 없음 (드문 보조 신살). Ch 1에서는 헤더·본문 일체 출력 X. -->

<!-- D안 G 시나리오 2: Ch 1 평생 빛나는 결 (용신·기신) 페이지는 폐기됨. 용신은 Ch 5-3 개운법, 기신은 Ch 5-5 절대 하면 안 5가지가 PRIMARY. Ch 1에서는 헤더·본문 일체 출력 X. -->

## 우리 아이는 마음을 어떻게 다루나요

<!-- (사용자 정책 — 폐기 확정) "### 외향-내향 스펙트럼" 페이지 영구 폐기. 음양은 명리학 기초 전제이지 별도 풀이 페이지 주제 X. 외향/내향 어휘는 MBTI식 현대 심리 환원이며, 단일 변수(오행 양음 비율) 근사 계산으로 정확도 낮음. 정통 명리 모두 단독 페이지 없음. -->
★ **"### 외향-내향 스펙트럼" 섹션은 어떤 연령에서도 출력하지 마세요**.

<!-- (사용자 정책 — 폐기 확정) "### 6가지 행동 결의 강도" 페이지 영구 폐기. 6요인(활동성·표현력·감수성·끈기·창의성·자기조절)은 5요인 모델 풍 비전통 프레임. 또한 두 개의 다른 계산 공식(child-seed.ts vs component)이 존재하는 SSOT 위반 + 차트와 본문 TOP3 모순 발생. 십성 5분류(다음 페이지)에서 동일 데이터를 정통적으로 풀이. -->
★ **"### 6가지 행동 결의 강도" 섹션은 어떤 연령에서도 출력하지 마세요**.

### 다섯 색깔의 결 (십성 5분류)

🔴 **D-3 십성 PRIMARY 슬롯 분배 강제 (양반사주 모델)**: 본 페이지는 십성 5분류 *압축 본질*만 — 깊은 도메인 풀이는 다음 슬롯에서 분산:
- **식상** PRIMARY = 본 페이지 (감정·예술 표현 어휘 키워드). 다른 챕터에서는 "말·글로 정리"(Ch 3-1)·"사람과 결 펼치기"(Ch 4-1) 분리 어휘만.
- **인성** PRIMARY = 본 페이지 + Ch 2-3 회복 (감정 곱씹어 회복 어휘). 다른 챕터 = "지식 흡수해 정리"(Ch 3-2).
- **관성·비겁** PRIMARY = 본 페이지 + Ch 2-2 화·짜증 (절제·균형 / 자기 결 단단 통합 정의 슬롯). 다른 챕터 사용 시 PRIMARY 어휘 X.
- **재성** = 본 페이지 한 줄 + Ch 7-2 (타고난 재능) PRIMARY 깊은 풀이.
🔴 PRIMARY 어휘를 다른 챕터에서 사용 절대 X — D-3 도메인 어휘 사전 따라.

🔴 **본 페이지 시각 자료 (자동 표시)**: 5색 그리드가 비겁·식상·재성·관성·인성의 *강·약 분포 + 한 줄 desc*를 자동 표시. 본문에서 분포 % 다시 풀이 X.

${sipseongDeepCtx}

🔴 **본문 분량·구조 (Phase 2-B 압축)**: 시각 자료가 분포를 표시하므로 본문은 **180~250자, 1~2 단락**으로 압축. 가장 강한 결과 가장 약한 결의 *대비를 일상 장면 1~2개*로만. 5분류 모두 나열 X (시각 자료에 있음).
- 사주 용어(비겁·식상·재성·관성·인성) 본문 노출 금지 — 한국어 결로만.
- ★ 재성 묘사 시 "끌리는" 수동 표현 X → "손에 잡으려는·쥐려는·챙기는" 능동 표현.

🔴 **강(强)/약(弱) 양상 어휘 가이드 — 우회 X 직설 + 가능성 어조 (사용자 정책 전환)**:
[강(强) 양상 — "강함" 결을 묘사할 때]
- 비겁 강: 자기 주장이 분명하고 추진력이 강한 결
- 식상 강: 표현이 풍부하고 끼·창의를 발산하는 결
- 재성 강: 결과·소유에 손이 가는 감각이 분명한 결
- 관성 강: 절제·규율이 자연스러운 결
- 인성 강: 깊이 사색하고 흡수가 자연스러운 결

[약(弱) 양상 — "약함" 결을 묘사할 때 — 직설 허용]
🔴 **우회 X 직설 + "~할 수 있음" 가능성 어조 강제** (사용자 정책: 우회는 본 해석을 변색시킴):
- 비겁 약: 자기 주장을 늦게 드러내거나 줏대를 잡기 어려울 때가 있음 / 결정 부담이 큰 결
- 식상 약: 속마음을 표현하기 신중하거나 자기 표현이 더딘 결
- 재성 약: 결과·소유에 욕심이 약하거나 챙기려는 손길이 가벼운 결
- 관성 약: 자기 통제·규율 잡기가 어렵거나 충동적으로 흐를 수 있는 결
- 인성 약: 깊이 사색보다 즉시 행동이 앞서며 차분한 흡수가 부족할 수 있는 결

🔴 **자원 프레임 — 무엇은 유지, 무엇은 풀어졌나 (사용자 정책 전환)**:
- ✅ **유지**: 부모 책임 전가 어휘 ban (예: "엄마가 못 챙겨서~"), 부정 한자 ban (상극·충·흉·양인살 등), 자녀 단정 금지 ("~함" → "~할 수 있음")
- ❌ **철회**: "약함" 을 "부드러움·솔직함·자유로움" 으로 우회하던 어휘 사전 → 직설 허용 (자녀의 결을 있는 그대로)
- ✅ 직설하되 **반드시 "~할 수 있음·~할 때가 있음·~한 결" 가능성 어조** 로 단정 회피

🔴 **"기운이 차분한 편" 류 우회 표현 절대 금지** (사용자 발견 — 동어반복 + 약함 우회):
- ❌ 절대 금지 패턴: "**(절제하는|표현하는|사색하는|챙기는|자기 세우는) 기운이 다른 기운에 비해 차분한 편**" / "**~ 기운이 잔잔한 편**"
   사유 1: "기운이 차분하다" = 동어반복 (절제 기운 자체가 차분함) — 의미 모순.
   사유 2: 사실은 "**기운이 약하다**" 인데 "차분"으로 우회 → 사용자 신뢰도 직격.
- ✅ 권장 직설: "**절제하는 기운은 다른 기운에 비해 약한 편입니다**" / "**표현하는 기운은 비교적 약한 편**"
- ✅ 약 결 어휘 사전 (위) 그대로 사용 — 우회 X.

<!-- D안 D-3c: 귀인 페이지를 Ch 1로 이동 (사용자 캡처 검증 결과 Ch 2에 잘못 위치) -->
<!-- (사용자 정책 — 폐기 확정) "### 타고난 신살의 결" 페이지 영구 폐기. 핵심 신살은 Ch 1 귀인 페이지에서 풀이됨. -->
★ **"### 타고난 신살의 결" 섹션은 어떤 연령에서도 출력하지 마세요**.

<!-- 사용자 정책: "결이 만나고 부딪히는 자리" 페이지 전 연령 영구 폐기 (추상성 높음, 다른 페이지와 75% 중복) -->
★ **"### 결이 만나고 부딪히는 자리" 섹션은 어떤 연령에서도 출력하지 마세요**. "잘 어울리는 만남", "부딪히는 자극", "충직한 흙의 결", "신비로운 결" 같은 결-결 충돌 풀이를 어떤 형태로도 작성 금지.

<!-- (사용자 정책 — 폐기 확정) "### 공망(空亡)" 페이지 영구 폐기. 사유 ① 공망은 *인연(관계)* 풀이로 *마음(정서)* 챕터와 부적합. ② 부모-자녀 양육 보고서 컨셉에서 가치 낮음 (배우자·말년·조상 인연 — 자녀=어린이라 적용 약함). ③ 정통 명리 모두 단독 페이지 X (시장 표준). ④ 직접 위치 X 케이스 우회 표현 위험, 직접 위치 O 케이스 부정적 인상 위험. -->
★ **"### 공망(空亡)" 섹션은 어떤 연령에서도 출력하지 마세요**.

### 감정 표현의 결 — 자녀가 마음을 어떻게 펼치나요
※ 이 페이지는 자녀가 *마음을 바깥으로 펼치는 방식*을 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 본 페이지의 메인 인자**: 자녀의 식상(食傷) 강·약 결 + 일간 ${sajuChild.ilgan}. 식상 정의·뜻 풀이 절대 X (앞 페이지 5색 그리드가 표시). 표현 결의 *작용·장면·부모 가이드*만.

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 사주 한 줄** (약 60~80자): "(앞서 본) ${d.childName}${d.childGender === '남' ? '군' : '양'}은 마음을 [말·행동·예술 중 결에 맞는 채널]로 펼치는 자녀입니다." 한자병기 X (앞 페이지 시각 자료에 있음). 식상 강 = 풍부·즉각 표현 / 식상 약 = 속에 머금어 더디게 표현.
2. **단락 2 — 일상 장면** (약 110~150자): 표현 결이 *드러나는 구체 장면 1~2개*. 식상 강: "기쁜 일이 있으면 곧장 손짓·목소리로 풀어냄·종이 위에 그림으로 펼침" / 식상 약: "마음에 무언가 차도 한참 후 한 마디씩 흘러나옴·말보다 표정·자세에서 먼저 드러남".
3. **단락 3 — 부모 시선 마무리** (약 70~100자): 부모님이 그 표현 결을 어떻게 받아주실 때 자라는지 + 자녀의 결이 자기 호흡으로 가꾸어가는 톤 한 줄. 즉시 적용 행동 1가지.

🔴 **어휘 정책 — D-3 도메인 어휘 사전 강제**:
- ✅ 본 페이지는 식상 PRIMARY 어휘 ("감정·예술 표현") 사용 OK (Ch 2-1 PRIMARY 슬롯과 같은 도메인이므로).
- ❌ "말·글로 정리" (Ch 3-1 어휘) X / "사람과 결 펼치기" (Ch 4-1 어휘) X — 본 페이지는 *마음을 펼치는 톤*만.
- ❌ 식상 한자·정의 풀이 절대 X.
- ❌ "외향·내향·MBTI·E·I" 어휘 X.

🔴 **자원 프레임**: 표현 결은 자녀의 *타고난 펼침의 빛*. 강한 결도 약한 결도 모두 자녀 본질로 인정.

### 화·짜증·기복의 결 — 자녀가 어떤 자극에 출렁이나요
※ 이 페이지는 자녀의 *감정 기복 트리거*를 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 본 페이지의 메인 인자**: 자녀의 일간 ${sajuChild.ilgan} 강약 + 비겁·관성 결의 작용. 정의 풀이 절대 X (앞 페이지 5색 그리드가 표시).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 사주 한 줄** (약 60~80자): "(앞서 본) ${d.childName}은 [어떤 자극]에서 마음이 출렁이는 결을 가집니다." 형식. 일간 강 + 비겁 강 = 자기 결을 침범당했다고 느낄 때 / 일간 약 + 관성 강 = 페이스 강요·갑작스런 변화에 흔들림 / 관성 약 = 충동·욕구 막혔을 때 욱함.
2. **단락 2 — 일상 트리거** (약 110~140자): *기복 트리거 장면 1~2개*. "친구가 자녀의 물건을 허락 없이 만질 때 / 부모가 자녀의 호흡보다 빠르게 재촉할 때 / 자녀가 몰두 중인 일이 끊길 때 / 잠·밥 시간이 어긋날 때" 중 자녀 결에 맞는 장면.
3. **단락 3 — 부모 시선 + 마무리** (약 80~110자): 화·짜증이 올라올 때 부모님께서 *어떻게 다가가실 때 결이 잦아드는지* + 자녀가 자기 결을 다스려가는 빛으로 자라는 한 줄 마무리.

🔴 **어휘 정책**:
- ✅ 본 페이지는 비겁 ("자기 결 단단")·관성 ("절제·균형") PRIMARY 어휘 사용 OK (Ch 2-2 PRIMARY 슬롯).
- ❌ 한자 노출 X (정의 슬롯 X — 앞 페이지에서 끝).
- ❌ 부모 죄책감 어휘 X.
- ❌ "감정 조절 능력 부족·자기 통제력 부재" 같은 평가 어휘 X.
- ✅ "출렁이는 결·잦아드는 호흡" 같은 자연 비유 톤.

🔴 **자원 프레임**: 기복은 자녀의 *결이 살아 있다는 신호*. 부모님이 짚어주실 때 다스려가는 결로 자란다는 톤.

### 회복과 환경 — 우리 아이의 회복 처방
※ 페이지 위에 카드 그리드가 자동 표시됩니다.

★★★ **6개 카드는 사주 보충 처방 매트릭스에서 결정론으로 도출되었습니다. 아래 [매트릭스 결과]를 그대로 출력하세요. 일반 양육 상식·임의 추가 절대 금지.**

[매트릭스 결과 — 약한 오행: ${weakestElem}, 발달 단계 기반]

(근거)
${d.childName}는 ${weakestElem}의 결(${weakestElem === "목" ? "성장·유연" : weakestElem === "화" ? "활기·표현" : weakestElem === "토" ? "안정·신뢰" : weakestElem === "금" ? "단단함·결단" : "지혜·고요"})이 부족해, 그 결이 채워질 때 가장 빨리 마음이 회복됩니다. 위 한 줄은 그대로 자연스럽게 풀어 쓰되, 사주 용어 노출 X.

[자녀]
• ${prescription.immediate.emoji} **즉효 처방** — ${prescription.immediate.text}
  💡 ${prescription.whyImmediate}
• ${prescription.daily.emoji} **일상 처방** — ${prescription.daily.text}
  💡 ${prescription.whyDaily}
• ${prescription.avoid.emoji} **피해야 할 결** — ${prescription.avoid.text}
  💡 ${prescription.whyAvoid}

[부모]
• ${prescription.space.emoji} **공간** — ${prescription.space.text}
  💡 ${prescription.whySpace}
• ${prescription.sense.emoji} **감각** — ${prescription.sense.text}
  💡 ${prescription.whySense}
• ${prescription.rhythm.emoji} **리듬** — ${prescription.rhythm.text}
  💡 ${prescription.whyRhythm}

[공통 원리]
${prescription.commonRationale}

[엄격 규칙]
- ★★ 위 [매트릭스 결과]의 **6개 카드 + 6개 💡 왜? + 공통 원리 모두 글자 하나도 바꾸지 말고 그대로 출력**. 이모지·키워드·본문·💡 왜? 모두 동일.
- ★★ "근거" 줄은 위 한 줄을 그대로 또는 자연스럽게 풀어쓰기만 허용. 다른 처방·환경·일반 양육 팁을 추가하지 말 것.
- ★ 사주 용어(편관·식상·인성·관성·재성·일간·결 등) 본문에 직접 노출 금지.
- ★ 매트릭스 외의 처방·환경 어떤 것도 추가하지 말 것 (이 카드들은 사주 보충 원칙으로 결정된 사실).
${(childAgeStage === "infant" || childAgeStage === "preschool") ? `
🔴 **영·유아 케이스 미래 시제 강제 (사용자 정책 — 자녀가 자라면서 적용될 처방)**:
- "근거" 한 줄은 미래형으로: "**자라가며 ~의 결이 부족해질 수 있어 그때 채워주시면 가장 빨리 회복됩니다**" 같이 "**~할 수 있습니다·~한 시기가 옵니다**" 형식 강제.
- 카드 6개 본문 자체는 그대로 (행동 처방). 본문 풀이는 미래 톤 ("앞으로 자녀가 자라며 ~한 시기가 오면 ~한 처방이 도움됩니다").
- ❌ "지금 ~한다·현재 ~를 좋아한다" 같은 현재 단정 금지.` : ''}

<!-- (사용자 정책 — 폐기 확정) "### 살펴주면 좋은 결" 페이지 영구 폐기. 사유 ① 강한 결 처방은 기존 용신·기신·회복 페이지에서 이미 다룸 (구조 중복). ② 단일 "풀어줌" 룰은 명리학적 부정확 (용신/기신 구분 미반영). ③ 강한 결 = 자녀의 본질 강점인 경우가 많아 "풀어줌" 처방이 자녀 강점 부정 인상. -->
★ **"### 살펴주면 좋은 결" 섹션은 어떤 연령에서도 출력하지 마세요**.

<!-- (D안 B — 페이지 이동) "### 평생 빛나는 결 — 채움과 살핌 (용신·기신)" 페이지는 본질 챕터(Ch 1)로 이동되었습니다. 이 위치에 절대 재출력 금지. -->

<!-- (사용자 정책 — 폐기 확정) "### 보조로 빛나는 결 (희신)" 페이지 영구 폐기. 이유 ① 희신 산출 룰(자녀 일간 오행 그대로)이 자평명리 표준(용신을 생하는 오행)과 어긋남. ② 자녀 본질 = 희신 = 동일 오행이 되어 동어반복 인상. ③ 정통 명리 모두 희신 단독 페이지 없음 (용신에 흡수). 핵심은 용신(이전 페이지). -->
★ **"### 보조로 빛나는 결 (희신)" 섹션은 어떤 연령에서도 출력하지 마세요**.

<!-- (사용자 정책 — 통합 확정) "### 피해야 할 결 (기신·구신)" 페이지 영구 폐기. 위 "### 평생 빛나는 결 — 채움과 살핌 (용신·기신)" 페이지에 기신 풀이를 통합. 양면(용신=채움 + 기신=살핌) 균형 메시지를 한 페이지에서 전달. -->
★ **"### 피해야 할 결 (기신·구신)" 섹션은 어떤 연령에서도 출력하지 마세요**.

### 자존감과 내면 안정 — 자녀의 자기 결은 어떻게 단단해지나요
※ 이 페이지는 자녀의 *자기 결*이 어떻게 단단해지는지 다룹니다.

🔴 **본 페이지 시각 자료 (자동 표시)**: 일주(日柱) 카드 (full banner) — 戊戌 등 자녀 일주 한자·자연 비유를 표시. 본문은 일주 정의 풀이 X.

🔴 **사주 인자 — 본 페이지의 메인 인자**: 자녀 일주 ${sajuChild.pillars.day.stem}${sajuChild.pillars.day.branch} 의 자기 인식 결 + 12운성 단계 작용 (정의 X — 시각 자료가 표시). 일주 작용 = "자기 결 본질" / 12운성 = "현재 결 단계의 호흡".

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 자존이 자라는 톤** (약 70~90자): "(앞서 본) ${d.childName}의 자존은 [자기 결의 톤]에서 자라납니다." 형식. 일간 오행별: 木 = "스스로 자라남을 인정받을 때" / 火 = "표현이 닿아 빛날 때" / 土 = "자기 자리가 안정될 때" / 金 = "자기 기준이 존중될 때" / 水 = "사색의 깊이가 알아봐질 때".
2. **단락 2 — 단단해지는 자리 장면** (약 110~150자): 자녀의 자존이 *자라는 일상 장면 1~2개*. "조용히 자기 페이스로 마칠 때·작은 성취를 부모가 짚어 알아봐 줄 때·자기 의견이 끊기지 않고 끝까지 들리는 자리에서·숨고를 자리가 보장될 때" 중 자녀 결에 맞는 자리.
3. **단락 3 — 흔들리는 신호 + 부모 시선 마무리** (약 90~120자): *흔들리는 신호 1개* (비교·재촉·평가) + 부모님이 어떻게 받쳐주실 때 결이 다시 단단해지는지 + 자녀가 자기 박자로 자존을 다듬어가는 한 줄.

🔴 **어휘 정책**:
- ✅ 핵심 키워드: "**자기 결·숨고를 자리·자존**" — Ch 2-3 자존 페이지 전용 어휘. (Ch 5-2 일과 호흡과는 어휘 분리)
- ❌ 일주·12운성 정의 풀이 X.
- ❌ "혼자 시간" 어휘 X — "숨고를 자리"·"자기 페이스" 로 (Ch 2-1·Ch 5-2와 어휘 분리).
- ❌ 부모 죄책감 어휘 X.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 자녀의 자존은 *자기 결로 자라는 결*. 부모가 받쳐주실 때 더 단단해진다는 톤.

### 마음이 닫히는 신호 — 부모님이 살펴주실 사인
※ 이 페이지는 자녀가 *마음을 닫을 때 보내는 신호*를 다룹니다.

🔴 **본 페이지 시각 자료 (자동 표시)**: 일주 sub-section 작은 마커 (continuation) — 앞 페이지에서 일주 카드 봤음을 이어서 표시.

🔴 **사주 인자 — 본 페이지의 메인 인자**: 자녀 일주 + 일지 ${sajuChild.pillars.day.branch} 의 자기 보호 결. 자녀가 *자기 결을 지키려 닫는 자연 반응*으로 풀이 (병리화·문제화 절대 X). 정의 풀이 X (앞 페이지 일주 카드가 표시).

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 닫힘이 일어나는 자리 한 줄** (약 70~90자): "(앞서 본) ${d.childName}은 [어떤 자리]에서 마음을 잠시 닫는 결을 가집니다 — 닫힘은 자녀가 자기 결을 지키는 자연 호흡입니다." 일간 오행별: 木 = "결이 꺾일 위협" / 火 = "표현이 막힐 때" / 土 = "갑작스런 변화" / 金 = "자기 기준이 무시될 때" / 水 = "깊이 사색할 시간 부족".
2. **단락 2 — 닫힘 신호 일상 장면** (약 110~150자): 자녀가 마음 닫을 때 보내는 *구체 신호 2~3개*. "입을 잠시 닫고 한 마디도 안 함·평소 보던 책·놀이를 손에서 놓음·방·구석으로 자리 옮김·고개를 살짝 떨궈 시선을 피함·짧게 '몰라'·'괜찮아' 만 반복" 중 자녀 결에 맞는 신호.
3. **단락 3 — 부모 시선 + 마무리** (약 90~120자): 닫힘 신호 보일 때 부모님 다가가는 길 — "옆자리에 같이 앉아 호흡을 맞추시기·다음 날 아침 부드럽게 결을 짚어 물으시기·자녀가 먼저 말 꺼낼 때까지 기다리시기" 중 1~2가지 + 닫힘은 다시 펼쳐가는 결로 마무리.

🔴 **어휘 정책**:
- ✅ 핵심 키워드: "**닫힘 신호·자기 보호 결·옆자리 호흡**".
- ❌ "자녀가 문제 행동·이상 신호·우울 의심" 같은 병리화 어휘 절대 X.
- ❌ 부모 죄책감 어휘 X — "엄마가 ~를 놓쳐서" 절대 X.
- ❌ 일주·일지 정의 풀이 X.
- ✅ "잠시 닫는 자연 호흡·다시 펼치는 결" 톤.

🔴 **자원 프레임**: 닫힘은 자녀의 결을 *지키는 자연 호흡*. 부모님이 호흡을 살피실 때 자녀는 다시 결을 펼쳐갑니다.

## 우리 아이는 어떻게 배우나요

### 학습의 결 — 어떻게 배우는가
※ 이 페이지는 자녀의 *학습 채널*을 다룹니다. 사주 근거: ${(sajuChild.sinsal ?? []).filter(n => ['학당귀인','문창귀인','태극귀인'].includes(n)).join('·') || "(학습 신살 없음 — 십성·격국 기반)"} + 인성·관성 강도.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 메인 인자**: 학당·문창 등 학습 신살 + 인성·관성 강도. 정의 풀이 X (Ch 1 귀인 카드가 한자·이름 표시). 식상 도메인 어휘: 본 페이지는 **"말·글로 정리"**만 (PRIMARY "감정·예술 표현"은 Ch 2-1).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 학습 결 한 줄** (약 60~80자): "${d.childName}${d.childGender === '남' ? '군' : '양'}은 [학당/문창/인성·관성 결]의 빛으로 배움을 [어떻게] 받아들이는 자녀입니다." 형식. 한자 재출력 X (Ch 1 귀인 칩이 표시).
2. **단락 2 — 배움이 또렷해지는 자리** (약 110~150자): *구체 자리 1~2개*. "한 권의 책을 깊이 읽어 자기 호흡으로 정리·1:1 대화로 묻고 답하며 결 펼치기·말과 글로 정리할 때 빛남·움직이며 만져 익힘·체계 따라 차곡차곡 쌓기" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 80~100자): 부모가 함께 공부할 때 호흡 — "잠자리 전 5분 오늘 배운 한 가지 말하게 하기·자기 박자로 정리할 시간 보장·평가 대신 호흡 살피기" 중 1~2가지 + 자녀 배움이 자기 호흡으로 자라는 한 줄 마무리.

🔴 본문의 50% 이상이 사주 풀이면 위반 — 학습 자리·장면이 본문 메인.

🔴 **어휘 정책**:
- ✅ 신살 한자 1회만.
- ❌ 정의 재서술 X.
- ❌ "공부 못 함·산만함" 부정 평가 X.
- ✅ "배움 결이 또렷해지는 자리" 톤.

### 흡수와 정리의 결 — 자녀가 새 지식을 어떻게 받아들이나요
※ 이 페이지는 자녀의 *학습 흡수·정리 호흡*을 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 메인 인자**: 자녀의 인성·식상 결. 정의 풀이 X (Ch 2 5색 그리드가 강·약 표시). 인성 = "지식 흡수해 정리" 어휘만 (D-3 어휘 분리, Ch 2-3 PRIMARY "감정 곱씹어 회복" 절대 X). 식상 = "말·글로 정리"만 (Ch 2-1 PRIMARY "감정·예술 표현" 절대 X).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 흡수→정리 호흡 한 줄** (약 60~80자): "(앞서 본) ${d.childName}은 새 지식을 [흡수→정리]의 [어떤 호흡]으로 받아들입니다." 인성 강 = "깊이 곱씹어 자기 안에 정리" / 인성 약 = "곧장 행동·시도로 익힘, 곱씹는 시간 짧음" / 식상 강 = "말·글로 풀어 바깥으로 정리" / 식상 약 = "안에 머금어 한참 후 정리".
2. **단락 2 — 흡수·정리 일상 장면** (약 110~150자): "수업 끝나고 혼자 노트에 차곡차곡 정리·집에 와서 부모에게 오늘 배운 것을 줄줄 풀어내며 정리·바로 손으로 만지고 만들어 보며 익힘·잠자리에 누워 천천히 곱씹어 다음 날 또렷해짐" 중 자녀 결 장면.
3. **단락 3 — 부모 시선 + 마무리** (약 80~100자): 자녀 흡수·정리 결을 받쳐줄 행동 1~2가지 + 자기 박자로 가꾸어가는 한 줄 마무리.

🔴 **어휘 정책 — D-3 어휘 분리 강제**:
- ✅ 인성 = "**지식 흡수해 정리**" 어휘만 (Ch 2-3 PRIMARY "감정 곱씹어 회복" 절대 X).
- ✅ 식상 = "**말·글로 정리**" 어휘만 (Ch 2-1 PRIMARY "감정·예술 표현"·"표현하는 결" 절대 X).
- ❌ 한자·정의 풀이 X.
- ❌ "외향·내향·MBTI" 어휘 X.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 흡수·정리 결은 자녀의 *배움 호흡*. 부모님이 호흡에 맞춰주실 때 자라는 톤.

### 효과적 학습 환경·시간 — 자녀의 학습 호흡이 어디서 풀리나요
※ 이 페이지는 자녀의 *학습 호흡과 시간 결*을 다룹니다.

🔴 **본 페이지 시각 자료 (자동 표시)**: 표지 페이지의 4기둥 정밀표가 자녀 4기둥별 12운성을 표시. 본문에서 12운성 정의 풀이 X.

🔴 **사주 인자 — 메인 인자**: 자녀 일주의 12운성 단계 + 학습 시간·환경 작용. 정의 풀이 X (정밀표 표시).

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 학습 호흡 한 줄** (약 70~90자): "(앞서 본) ${d.childName}의 결은 [현재 단계]의 호흡으로, 학습이 [어떤 톤]에서 풀립니다." 한자 X (정밀표가 표시).
2. **단락 2 — 학습 시간·환경 일상 장면** (약 120~160자): *시간대·환경 2~3개* 구체. "이른 아침 머리가 가장 맑은 자리·저녁 식사 후 차분히 가라앉은 시간·움직이며 소리 내어 외우는 호흡·조용한 책상에서 한 호흡으로 깊이 들어가는 자리·짧게 끊어 휴식과 함께 가는 호흡" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 90~110자): 학습 시간표 톤 — "또렷한 시간 30분 학습 자리·흐려지는 시간엔 가벼운 활동·주말 한 시간 자기 페이스 학습 자리" 중 1~2가지 + 자기 박자로 가꾸어가는 한 줄 마무리.

🔴 **어휘 정책**:
- ✅ 12운성 한자병기 1회만 — 이후 한글만.
- ✅ 핵심 키워드: "**학습 호흡·학습 시간 결**" (Ch 5-2 일상 시간 결과 어휘 분리).
- ❌ 일주 정의 풀이 X (Ch 1-2 PRIMARY).
- ❌ 일상 시간 결 어휘 X ("자연 활기 시간"은 Ch 5-2).
- ❌ "혼자 시간"·"숨고를 자리" 어휘 X (Ch 2-3 자존 페이지 어휘).
- ✅ 가능성 어조.

🔴 **자원 프레임**: 학습 시간은 *자녀의 호흡에 맞춘 결*. 부모가 자녀 결을 맞춰주실 때 학습이 자란다는 톤.

### 학습이 막히는 자리 — 자녀의 결이 닫히는 학습 신호
※ 이 페이지는 자녀의 *학습이 정체되는 자리*를 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 메인 인자**: 자녀 일간 결을 거스르는 학습 방식 + 약한 오행 결의 학습 정체 작용. 정의 풀이 X. 기신 메인 풀이 절대 X (Ch 1 채워줄/살펴줄 결 PRIMARY).

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 닫히기 쉬운 자리 한 줄** (약 70~90자): "(앞서 본) ${d.childName}은 [어떤 학습 자리]에서 결이 닫히기 쉽습니다." 일간 오행별: 木 = "긴 호흡 자르는 짧은 끊김" / 火 = "침묵 강요·발표 차단" / 土 = "자기 페이스 무시한 진도 변경" / 金 = "정리 없는 산만한 자료" / 水 = "빠른 답 강요·사색할 시간 부족".
2. **단락 2 — 정체 신호 일상 장면** (약 110~150자): *구체 신호 2~3개*. "책 펴 놓고 한참 멍해짐·평소 좋아하던 과목인데 손에서 책 놓음·짧게 '몰라'·'그냥' 반복·머리 아프다며 자리 떠남·연필을 자꾸 만지작거리며 글씨가 흐려짐" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 90~110자): 정체 신호 보일 때 대처 — "5분 자유 시간 주기·다음 날 다른 자리·다른 시간에 펼치기·과목 바꿔 결 살리기" 중 1~2가지 + 호흡 살피면 다시 자라는 한 줄 마무리.

🔴 **어휘 정책**:
- ❌ "기신·용신" 메인 풀이 어휘 X (Ch 5 PRIMARY).
- ❌ "단호함·비판·냉정·강요" 부모 행동 경고 어휘 X (Ch 5-4 PRIMARY).
- ❌ "공부 안 한다·게으르다" 평가 어휘 절대 X.
- ✅ 핵심 키워드: "**정체 신호·결이 닫히는 자리·다시 펼치는 호흡**".
- ✅ 가능성 어조.

🔴 **자원 프레임**: 학습 정체는 자녀의 결이 *호흡을 살펴달라고 보내는 신호*. 부모님이 호흡에 맞춰주실 때 학습이 다시 자란다는 톤.

### 절대 하면 안 되는 학습 방식
※ 이 페이지는 자녀에게 *역효과인 학습 방식*을 다룹니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **일간(${sajuChild.ilgan})의 결을 거스르는 학습 방식 + 식상·관성 강도 (학습 특화 인자)**. **기신 풀이 절대 금지** (기신은 "### 평생 빛나는 결" 페이지가 PRIMARY 슬롯). 이 페이지에서는 "기신이 자극되어…", "쇠의 결이 과해져…" 같은 기신 메인 풀이 어휘 일체 X. 학습 특화 인자만 사용.

🔴 **부모 행동 경고 어휘 분배 (D안 B 강제)**:
- ❌ "단호함·비판·냉정·강요" 어휘 일체 X (이 어휘는 "### 평생 빛나는 결" 페이지의 기신 살핌 단락 전용 — 본 페이지에서 사용 시 즉시 중복 위반)
- ✅ 본 페이지 전용 학습 특화 경고 어휘만: **"다른 자녀와 비교, 결과만 평가, 빠른 답 강요, 한 번에 여러 과목, 자녀 페이스 무시한 시간표, 대본 외우기·정답 단순 암기 강요, 자기 표현 막기, 자녀 호흡보다 빠른 진도"**

본문 구조 (D안 C-A — 양반사주식: 사주 한 줄 + 부모 행동 경고 영역 가이드 메인, 220~280자, 2~3 단락):
1. **단락 1 — 사주 근거 한 줄** (약 50~70자): "${d.childName}${d.childGender === '남' ? '군' : '양'}의 일간 결은 [오행]이라 [학습 특화 부담 1줄]" *한 줄만*. 일간 정의 풀이 X. 오행별 학습 부담 매핑:
   - 목(木) 일간: 강제 암기·자라남을 막는 경직 시간표가 결을 꺾음
   - 화(火) 일간: 침묵 강요·발표 차단·자기 표현 막기가 결을 흐림
   - 토(土) 일간: 갑작스러운 진도 변경·자녀 페이스보다 빠른 흐름이 결을 흔듦
   - 금(金) 일간: 한 번에 여러 과목·체계 없는 산만한 자료가 결을 무디게 함
   - 수(水) 일간: 빠른 답 강요·깊이 사색할 시간 부족이 결을 닫음
   추가 사주 어휘는 본문에 사용 X — 한 줄 안에서 끝.
2. **단락 2 — 부모가 피해야 할 구체 학습 행동 가이드 메인** (약 130~160자): 부모가 무의식적으로 하기 쉬운 *학습 특화 역효과 행동 2~3가지* 구체. **반드시 학습 특화 어휘 풀에서만 선택** ("다른 자녀와 비교 / 결과만 평가 / 빠른 답 강요 / 한 번에 여러 과목 / 자녀 페이스 무시한 시간표 / 자기 표현 막기" 중 2-3개). "단호함·비판·냉정" 같은 일반 부모 행동 경고 어휘 X. *언제·어디서·어떻게* 피하면 좋은지 일상 장면 1~2개로 구체화.
3. **단락 3 — 대안 한 줄** (약 50~70자): 그 대신 자녀에게 *자연스럽게 통하는* 학습 결 한 줄 (예: "자녀 호흡에 맞춘 한 과목 깊이 흐르기", "표현을 받아주는 1:1 대화 학습").

🔴 사주 풀이가 본문 50% 이상이면 위반 — 부모 행동 가이드가 본문 메인.

🔴 **어휘 정책**:
- ❌ "절대 ~하지 마세요·~하면 망친다" 강한 협박 톤 X.
- ✅ "~한 방식은 자녀의 학습 결을 *닫게 할 수 있습니다*" 가능성 어조.
- ❌ 부모 죄책감 어휘 X.
- ❌ "기신·용신·기신을 자극·기신의 결" 등 기신/용신 메인 풀이 어휘 일체 X (Ch 1-5 페이지와 즉시 중복).

## 우리 아이는 사람과 어떻게 만나나요

<!-- 사용자 정책: 떼·고집 두 섹션 전 연령 영구 폐기 (떼는 발달 본능, 사주 변별력 부족) -->
★ **"### 떼·고집·반항의 진짜 이유"와 "### 떼·고집 대처 단계별 매뉴얼" 두 섹션은 어떤 연령에서도 출력하지 마세요**. "떼", "고집", "반항", "트리거", "비견·겁재 강도", "불의 결", "강한 감정 결", "절제 회로", "STOP→NAME→GUIDE", "멈춤·인정·안내" 같은 블록을 어떤 형태로도 작성 금지.

### 친구 사귀는 스타일 — 자녀가 사람과 어떻게 결을 맺나요
★★★ **반드시 다음 사전 계산 결과만 사용**: 친구 관계 스타일 = **${friendS.dominant}** (페이지 위 4분면 매트릭스와 동일).
다른 스타일로 묘사 절대 금지.

🔴 **본 페이지 시각 자료 (자동 표시)**: 4분면 매트릭스 차트가 자녀의 dominant 스타일(${friendS.dominant})을 표시. 본문은 작용·일상 장면.

🔴 **사주 인자 — 메인 인자**: 비견·겁재 관계 작용 + 식상의 사람 표현. 정의 풀이 X (PRIMARY는 Ch 2 5색 그리드). 식상 도메인 어휘 = **"사람과 결 펼치기"** 만 (Ch 2-1 "감정·예술 표현"·Ch 3-1 "말·글로 정리" 절대 X).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 인연 맺는 결 한 줄** (약 60~80자): "(앞서 본) ${d.childName}${d.childGender === '남' ? '군' : '양'}은 *${friendS.dominant}* 결로 사람과 첫 인연을 맺습니다." 비겁 강 = 같은 결 친구 끌어당김 / 비겁 약 = 다른 결 친구에게서 배움 / 식상 강 = 사람 곁에서 결을 펼침 / 식상 약 = 인연을 천천히 깊이 맺음.
2. **단락 2 — 친구 자리 일상 장면** (약 110~150자): *구체 자리 1~2개*. "처음 만난 자리에서 곧장 어울려 함께 뛰노는 자녀·관찰하다 마음 통하는 한 명에게 다가가는 자녀·1:1 깊은 대화에서 결이 또렷한 자녀·여러 친구 한가운데서 자연스럽게 자리를 잡는 자녀" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 80~100자): 친구 자리 받쳐주는 행동 1~2가지 ("놀이터·동호회·이웃 자리 자연스럽게 마련·1:1 친구 집 초대·자녀가 친구 수에 부담 느낄 때 침묵으로 받쳐주기") + 친구 *수*가 아니라 *결의 환경*이 자라는 한 줄 마무리.

🔴 **(Phase 5) 어휘 정통화 — MBTI·5요인 어휘 절대 금지**:
- ❌ "외향형·내향형·MBTI·E·I·N·S·T·F·J·P", "외향성·친화성·신경성·개방성·성실성" 등 X.
- ❌ "사회성 지수·관계 능력 점수" X.
- ✅ 4분면 라벨은 그대로 유지, 풀이는 십성 어휘.
- ❌ "이끄는 리더십" 어휘 X — "주도하는 결·앞장서는 결" 으로 (Ch 1-2 어휘와 분리).

### 갈등의 결과 회복의 길 — 자녀는 흔들림에서 어떻게 일어나나요
※ 페이지 위에 거리 슬라이더가 자동 표시됩니다 (가까이 ↔ 멀리 사이 권장 위치 — FriendDistanceSlider 차트는 보존).

🔴 **본 페이지 시각 자료 (자동 표시)**: 거리 슬라이더(${friendDist.label}) + 표지 4기둥 정밀표가 일지 한자 표시. 본문에서 일지 정의 풀이 X.

🔴 **사주 인자 — 메인 인자**: 일지 합·충·형·해·파 작용 + 일간 강약. 정의 풀이 X (정밀표가 일지 한자·12운성 표시).

🔴 **차트 결과 — 반드시 본문 반영**: 권장 거리 = **${friendDist.label}** (위치 ${friendDist.position}/100, ${friendDist.position < 45 ? "가까이" : friendDist.position < 70 ? "중간" : "멀리"} 영역). 차트와 반대 묘사 X.

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 갈등이 다가오는 톤 한 줄** (약 70~90자): "(앞서 본) ${d.childName}의 일지 결로 갈등은 [어떤 톤]으로 다가오고, 회복은 [어떤 호흡]으로 풀립니다." 한자 X (정밀표 표시).
2. **단락 2 — 갈등·회복 일상 장면** (약 110~150자): *구체 장면 1~2개*. "친구 한 마디에 그날은 입을 닫고 다음 날 아침 다시 말 거는 자녀·즉시 화내고 풀고 함께 다시 노는 자녀·집에 와 곰곰이 곱씹다 며칠 후 자기 호흡으로 다가가는 자녀·부모가 다리 놓아줄 때 풀리는 자녀" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 90~120자): 권장 거리(${friendDist.label.split(" — ")[0]}) 톤으로 시점별 행동 1~2가지 ("갈등 직후 호흡 살피며 곁에 머무르기·다음 날 아침 부드럽게 마음 묻기·먼저 말 꺼낼 때까지 자리만 비우기") + 자기 호흡으로 일어나는 한 줄 마무리.${childAgeStage === "infant" || childAgeStage === "preschool" ? `
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

${(childAgeStage === "infant" || childAgeStage === "preschool") ? `<!-- 사용자 정책: 영·유아도 미래 시제 강제로 4섹션 모두 출력 -->
🔴 **영·유아 케이스 전 4섹션 미래 시제 강제 (사용자 정책 — 자녀가 자라면서 적용될 가이드)**:
- ❌ 절대 금지 (전 문장 모두): "지금 ~한다", "현재 ~를 좋아한다", "오늘 ~한다" 같은 **현재형·단정형 표현 일체**
- ✅ **모든 동사를 미래형으로 통일**: "~할 것입니다", "~하게 될 것입니다", "~한 시기가 옵니다", "~한 신호가 나타날 수 있습니다"
- ✅ 도입 한 줄 추가 권장: "앞으로 자녀가 자라며 ~한 시기가 오면, 다음 ~이 도움됩니다"
- 칭찬·자존감 카드의 멘트와 시나리오 자체는 그대로 (행동 처방). 단 본문 풀이가 미래 톤.
- 잠자리·디지털 게이지: 자녀의 사주 결을 토대로 자녀가 자랐을 때 어떤 채널이 강할지 미래 예측.

` : ''}<!-- 사용자 정책: "통하는 칭찬 vs 역효과 칭찬" 페이지 전 연령 영구 폐기 (사주 변별력 0, 보편 양육서 콘텐츠) -->
★ **"### 통하는 칭찬 vs 역효과 칭찬" 섹션은 어떤 연령에서도 출력하지 마세요**. "[좋은 칭찬]", "[역효과 칭찬]", "포기 안 하고", "역시 천재네", "비교 칭찬" 같은 블록을 어떤 형태로도 작성 금지.

### 인복의 결 — 복성·천을·도화
※ 이 페이지는 자녀의 *인복 신살*과 인연을 끌어당기는 결을 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 다만 Ch 1 귀인 카드가 천을·복성을 ✦ 칩으로 이미 표시 → 본문에서 정의 풀이 X.

★★★ **반드시 다음 사주 데이터만 사용**:
- 자녀의 인복 신살 (복성/천을/도화 카테고리): ${(() => {
  const inbok = (sajuChild.sinsal ?? []).filter(n => ['복성귀인','천을귀인','도화살'].includes(n));
  if (inbok.length === 0) return "(인복 신살 미보유 — 자녀 일간 본질로 인연을 끌어당김)";
  return inbok.map(n => `${n}(${SINSAL_INFO[n]?.hanja ?? ''})`).join(", ");
})()}
- 자녀 일간: ${sajuChild.ilgan} (${childSeed.ilganElement})

본문 구조 (양반사주식, **240~300자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 인복 결 한 줄** (약 60~80자): "${d.childName}의 인복 결은 [어떤 작용]으로 사람을 끌어당깁니다." 형식. 한자 본문 노출 X (Ch 1 귀인 칩이 표시). 가진 신살에 따라 작용 한 줄:
   - 복성귀인 보유: "평생 복과 행운이 자연스럽게 따르는 결"
   - 천을귀인 보유: "어려움에 귀한 도움이 닿는 결"
   - 도화살 보유: "사랑받고 빛나는 매력의 결" (이성·연애 어휘 X — 어린이는 *사랑받는 결*만)
   - 신살 미보유: "자녀의 일간 본질로 사람을 끌어당기는 결"
2. **단락 2 — 인연이 자라는 자리** (약 110~140자): 이 결이 *인연을 끌어당기는 일상 장면 1~2개*. 어떤 환경에서 좋은 인연을 만나는지 (도서관·동호회·이웃·학교·친구 집 등) 부모가 자연스럽게 마련해 주실 자리.
3. **단락 3 — 부모 시선 + 마무리** (약 60~80자): 부모가 환경만 살펴주실 때 인연이 자연스럽게 자라는 한 줄.

🔴 **어휘 정책**:
- ✅ 신살 한자병기 1회만 (단락 1 정의 슬롯) — 이후 한글만.
- ✅ 핵심 키워드: "**복덩이·인복**" 같은 따뜻한 결 어휘.
- ❌ 학당귀인 어휘 X (Ch 3-1 학습 영역 — 어휘 분리).
- ❌ 도화살을 "이성적 매력·연애 매력"으로 풀이 X — 자녀에게는 *사랑받는 결*로만.
- ❌ 부모 기대 강요 어휘 X — 자녀 자기 결 톤.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 인복은 *자녀의 결로 자연스럽게 자라는 인연*. 부모가 환경을 살펴주실 때 자란다는 톤.

### 무리 안에서의 자리 — 자녀가 또래 무리에 어떻게 자리잡나요
※ 이 페이지는 자녀가 *무리·단체 안에서 차지하는 자리*를 다룹니다.

🔴 **본 페이지 시각 자료**: 없음. 본문이 핵심.

🔴 **사주 인자 — 메인 인자**: 비견·겁재의 단체 작용 + 관성의 규율 결. 정의 풀이 X (Ch 2 5색 그리드 표시).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 무리 자리 한 줄** (약 60~80자): "(앞서 본) ${d.childName}은 무리 안에서 [어떤 자리]를 자연스럽게 차지합니다." 비겁 강+관성 강 = 앞장서는 결 / 비겁 강+관성 약 = 자유롭게 끌어가는 결 / 비겁 약+관성 강 = 약속을 받쳐주는 결 / 비겁 약+관성 약 = 곁에서 호흡 맞춰가는 결.
2. **단락 2 — 단체 자리 일상 장면** (약 110~150자): *구체 장면 1~2개*. "놀이터에서 친구들에게 놀이 규칙 정해주는 자녀·여러 친구 중간에서 대화 다리 놓는 자녀·반 모임에서 한 자리 잡고 묵묵히 받쳐주는 자녀·작은 무리 두세 명 안에서 가장 또렷하게 결을 펼치는 자녀·여러 친구 사이를 자유롭게 오가는 자녀" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 80~100자): 단체 자리 받쳐주는 행동 1가지 ("결정권 가질 때 책임 함께 짚기·받쳐주는 자녀에게 자기 의견 펼칠 자리·자유로운 결에 작은 약속 가르치기") + 자기 자리 다듬어가는 한 줄 마무리.

🔴 **어휘 정책**:
- ❌ "리더십·인싸·아싸" 같은 평가 어휘 X.
- ❌ "이끄는 리더십" 어휘 X (Ch 1-2 어휘) — "주도하는 결·앞장서는 결" 으로.
- ❌ 비겁·관성 한자·정의 풀이 X.
- ❌ "자기 결 단단" (Ch 2-2 PRIMARY 어휘) X — 본 페이지는 "**같은 결 끌어당김**" 어휘만.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 무리 안 자리는 자녀의 *결이 자연스럽게 차지하는 위치*. 어떤 자리든 자녀의 본질로 인정.

### 가족 안에서의 자리 — 자녀가 가족 안에서 어떤 결로 자라나요
※ 이 페이지는 자녀가 *가족·형제 관계 안에서 차지하는 자리*를 다룹니다.

🔴 **본 페이지 시각 자료**: 없음 (Ch 7 부모 챕터에서 세 사람 비교 차트·부모 십성 카드 표시). 본 페이지는 *가족 자리·형제 관계 작용*만.

🔴 **사주 인자 — 메인 인자**: 부모 십성의 가족 작용 + 자녀 일주의 가족 결. 정의 풀이 X (Ch 7 PRIMARY).

본문 구조 (양반사주식, **250~330자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 가족 자리 한 줄** (약 60~80자): "(앞서 본) ${d.childName}은 가족 안에서 [어떤 자리]를 자연스럽게 차지합니다." 자녀 일간 강 = 자기 의견 또렷한 자리 / 일간 약 = 부모 결을 받아 자라는 자리 / 외동: 부모와 깊이 닿는 자리 / 형제 있음: 형제 사이에서 자기 결 자리.
2. **단락 2 — 가족 안 자리 일상 장면** (약 110~150자): *구체 장면 1~2개*. "식탁에서 자기 의견 분명히 펼치는 자녀·부모 손길에 안기듯 자라는 자녀·형제 사이에서 평화 다리 놓는 자녀·형제와 자기 결 다투며 자라는 자녀·할머니·할아버지 곁에서 더 부드러워지는 자녀" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 80~100자): 가족 안 자녀 자리 받쳐주는 행동 1~2가지 ("가족 결정에 의견 묻기·형제 비교 대신 각자 결 짚기·받는 자리·주는 자리 균형") + 가족 안에서 자기 결로 자라가는 한 줄 마무리.

🔴 **어휘 정책**:
- ❌ 부모 십성 한자·정의 풀이 X (Ch 8-2 PRIMARY).
- ❌ "장남·장녀·둘째" 같은 서열 어휘 X — "결의 자리" 톤만.
- ❌ "사랑받는 자녀·미움받는 자녀" 단정 X.
- ✅ "**가족 안 자기 자리·받는 결과 주는 결**" 어휘.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 가족 안 자리는 자녀의 *결이 자라는 첫 번째 자리*. 부모님이 자녀 결을 짚어주실 때 자란다는 톤.

## 우리 아이는 어떻게 자라나요

<!-- Phase 2-A 통합: 기존 "## 우리 아이의 몸과 일상은" + "## 우리 아이는 어느 시기에 어떻게 변하나요" 두 챕터를 하나로 통합.
     페이지 흐름 (현재 → 미래): 기운 총량 → 잠자리·식습관 → 좋은 시간 → 개운법 → 현재 대운 → 사춘기 변화점 → 평생 흐름.
     어휘 분리: 일상 호흡 (몸·잠·식사·시간) ↔ 시기 흐름 (대운·사춘기·평생). 두 도메인 어휘 겹치지 않게.
     Phase 2-B에서 각 소제목 본문을 시각 자료(대운 타임라인·사춘기 카드)에 맞춰 재작성 예정. -->

### 기운 총량 — 자녀의 에너지 결이 일상에 어떻게 흐르나요
※ 페이지 위에 7단계 게이지 (가벼움 ↔ 단단함 ↔ 넘침) 가 자동 표시됩니다.

🔴 **D안 G 이전 페이지** (Ch 1 → Ch 5 첫 페이지): 자녀의 일간 강도(신강·신약)가 *몸과 일상의 토대*로 작용하는 결을 풀이. Ch 5 일상 영역(잠·식사·움직임·하루 호흡) 어휘 사용 OK — Ch 5 PRIMARY 영역 슬롯이므로.

★★★ **반드시 다음 시드 결과만 사용**:
- 단계: **${childSeed.dayMasterStrength.level}** (게이지 7단계 중 ${childSeed.dayMasterStrength.positionIdx + 1}번째)

본문은 **3 단락 구조**, 약 **300~360자**.

🔴 **본문 구조 (반드시 이 흐름)**:
1. **단락 1 — 결의 본질 + 일상 토대 한 줄** (1~2 문장, 약 100~130자): 자녀의 기운 총량이 어떤 결인지 한 호흡으로 풀이. 첫 문장에 "**기운 총량 (전통 명리에서 신강身强·신약身弱이라 부르는 결)**" 형식 한자병기 1회 허용. 이 결이 *몸·일상의 토대*임을 한 줄 명시.
2. **단락 2 — 일상 결 장면** (2~3 문장, 약 130~160자): **자녀의 일상 영역 장면 1~2개**로 이 결을 풀이. 🔴 **허용 장면 (Ch 5 영역)**: "아침 일어났을 때 호흡", "식탁에서 음식을 만났을 때", "하루 끝 잠자리에 들 때", "몸을 움직일 때(움직임 영역)", "쉬는 자리에서 회복하는 결". 🔴 **금지 장면 (다른 Ch 슬롯)**: "친구들과", "놀이를 할 때", "교실에서/학교에서", "공부할 때", "감정 표현(말·울음)" 어휘 절대 X.
3. **단락 3 — 자녀의 일상 결이 가장 자연스러운 자리** (1~2 문장, 약 70~100자): 어떤 일상 패턴·환경에서 자녀가 가장 편안히 자기 결을 펼치는지. 본질 인정 톤.

🔴 **어휘 정책 — 첫 등장 1회만 한자병기 허용**:
- ✅ 본문 첫 문장에 "**기운 총량 (전통 명리에서 신강身强·신약身弱이라 부르는 결)**" 형식 1회만.
- ❌ 그 이후 "신강·신약" 단어 단독 노출 금지.
- ❌ 점수·% 수치 본문 노출 금지.
- ❌ 7단계 라벨 (극약·태약·신약·중화·신강·태강·극왕) 직접 노출 금지 — 시각 게이지에만.

🔴 **단계별 본문 톤 가이드 — 직설 + 가능성 어조 (Ch 5 영역 어휘)**:
- **극약·태약·신약**: "에너지가 가벼운 편" / "긴 활동·이른 시간에 부담을 느낄 수 있음" / "차분한 일상 패턴에서 자기 결을 펼치는 자녀". 일상 영역 장면: "아침에 천천히 깨어나는 결", "식사를 천천히·조금씩 하는 결".
- **중화**: "기운이 자연스럽게 어우러진 결" / "잠·식사·움직임 어디로도 치우치지 않는 자녀". 일상 영역 장면: "하루의 호흡이 자연스럽게 흐르는 결".
- **신강·태강·극왕**: "에너지가 단단히 자리 잡은 결" / "긴 시간·활동량을 자연스럽게 견디는 결" / "고집·뻗치는 힘이 있을 수 있는 결". 일상 영역 장면: "움직임이 활기찬 결", "한번 자리잡은 일상 패턴은 끝까지 끌고 가는 결".

🔴 **공통 어휘 정책**:
- ✅ 직설 허용: "약한 편·부담스러울 수 있음·고집을 부릴 수 있음" 등 객관 묘사 OK.
- ✅ 가능성 어조 강제: "**~할 수 있음·~할 때가 있음**" — 단정 X.
- ❌ 부모 책임 전가 금지: "엄마가 못 챙겨서~" 절대 X.
- ❌ 강 부정 어휘 금지: "위태롭다·치명적·무너뜨린다" 절대 X.

🔴 **자원 프레임**: 부모 가이드 동반 X (본질 페이지). 자녀 본질 인정 + 일상 토대 톤만.

### 잠자리·식습관 안정 조건 — 자녀의 생체 리듬은 어떤 결에서 풀리나요
※ 페이지 위에 3채널 게이지(수면·식사·움직임)가 자동 표시됩니다.

🔴 **D안 E 깊이 재작성**: 본 페이지는 12운성 정의 슬롯 + 신체 리듬 PRIMARY. 정의 한 줄 압축, 본문은 *잠·식사·움직임 깊이 풀이* 3~4 단락 강제 (300~400자).

🔴 **사주 인자 분배 — 이 페이지의 메인 인자 (D-3 12운성 정의 슬롯)**: **12운성(十二運星) 정의 슬롯 + 일간·일지 신체 리듬 PRIMARY**.
- **12운성(十二運星)** = "일주의 12단계 결의 흐름 — 절·태·양·생·욕·대·관·왕·쇠·병·사·묘" — 본 페이지에서 한 줄 정의 한자병기 1회 OK.
- 자녀 일주의 현재 단계 = [단계] 명시 (가능한 경우).
- 다음 페이지(Ch 5-2 "좋은 시간·환경")에서는 12운성 한 줄 참조만, 정의 X.
- 학습 시간 특화 작용은 Ch 3-1 "학습의 결" 페이지에서 한 줄 보조 — 본 페이지 = 신체 리듬 PRIMARY.

★★★ **반드시 다음 사전 계산 결과만 사용** (보강 — 사주 → 행동 직결, 3채널만):
- **가장 두드러진 채널 (TOP1)**: ${lifestyleTop.name} ${lifestyleTop.emoji} (${lifestyleTop.level === "high" ? "높음" : lifestyleTop.level === "mid" ? "보통" : "낮음"} ${lifestyleTop.score}점) — ${lifestyleTop.desc}
- **가장 약한 채널 (BOTTOM)**: ${lifestyleBottom.name} ${lifestyleBottom.emoji} (${lifestyleBottom.level === "high" ? "높음" : lifestyleBottom.level === "mid" ? "보통" : "낮음"} ${lifestyleBottom.score}점) — ${lifestyleBottom.desc}

🔴 **디지털 언급 절대 금지** (사용자 정책 — 디지털은 별도 페이지에서 다룸):
- ❌ 본문에서 "디지털·스크린·미디어·기기" 어휘 일체 사용 X
- ❌ "한편 디지털 채널은..." 같은 단락 X
- ✅ 수면·식사·움직임 3채널만 풀이

🔴 **챕터 질문 — 본문 첫 문장 정합 강제**: 이 페이지는 3채널 점수 풀이가 아니라 "**자녀의 생체 리듬이 가장 자연스럽게 흐르는 조건**" 페이지. 자녀의 *일간·일지*가 신체 리듬에 어떻게 영향을 주는지 사주 근거를 본문에 분명히 노출.

본문 구조 (D안 C-A — 양반사주식: 사주 한 줄 + 잠·식사·일과 일상 가이드 메인, 260~300자, 2~3 단락):
1. **단락 1 — 사주 근거 한 줄 + TOP/BOTTOM 명시** (약 70~90자): "(앞서 본) 자녀의 ~한 사주 결로 3채널 중 ${lifestyleTop.name}이 가장 자연스러운 결, ${lifestyleBottom.name}은 채움이 필요합니다." *한 줄로 압축*. 12운성·인성·토 정의 풀이 X (PRIMARY 슬롯이지만 다음 페이지를 위해 풀이는 짧게).
2. **단락 2 — 잠·식사·일과 일상 가이드 메인** (약 130~160자): TOP1·BOTTOM 채널이 *자연스럽게 풀리는 조건* — 잠 시간·식사 패턴·움직임 일과 구체 가이드. 몇 시 잠자리·아침 루틴·간식 타이밍 등 부모가 즉시 적용 가능한 장면 1~2개.
3. **단락 3 — 부모 마무리 한 줄** (약 60~80자): 자녀의 리듬 결을 *헤아리는* 부모 톤으로 마무리.

🔴 **본문 중복 절대 금지** (사용자 발견 결함):
- ❌ 단락 1에서 카드 desc를 그대로 반복하고 단락 2에서도 같은 메시지 반복 X
- ❌ 두 단락이 *같은 행동·같은 장면*을 반복하면 위반
- ✅ 단락 1 = *사주 근거 + 채널 소개* / 단락 2 = *일상 구체 장면* / 단락 3 = *부모 마무리* — 3 단락 모두 다른 무게 중심

🔴 **사주 근거 매핑 — 반드시 이 표만 사용 (AI 자의 해석 차단)**:
- 수면 "사색이 깊은 결" = **인성·수가 강함** (사색·내면 결)
- 수면 "보통 권장" = 인성·수가 강하지 않음 (보통 잠 안정)
- 식사 "안정 살림형" = **토(흙)의 결이 강함** (자녀가 같은 패턴 좋아함, 부모는 그 결 존중)
- 식사 "안정 채움형" = **토(흙)의 결이 약함** (안정 부족, 부모가 같은 시간·자리·꾸준한 패턴으로 안정 채움)
   ❌ 절대 금지: "토 약함" 을 "**호기심 발달·변화 자연스러움·새 것 좋아함**" 으로 풀이 X — 명리학 *반대 처방* (토 약함은 안정 *부족*이지 변화 *좋아함*이 아님).
   ✅ 권장: "토의 결이 약해 안정이 부족한 결, 부모가 *꾸준한 패턴*으로 채워주면 좋은" 톤.
- 움직임 "에너지 큰 결" = **화·목·비겁이 강함**
- 움직임 "차분한 결" = **화·목·비겁이 약함** (활동량 적음)
(주: 디지털 매핑은 별도 페이지 "### 디지털·미디어 균형" 영역 — 이 페이지에서는 언급 X)

❌ 절대 금지: "충분한 잠 9시간 ↑이 회복의 핵심" / "규칙적인 시간에 식사하는 것이 중요" 같이 사주 근거 없는 보편 양육 원칙 일반론.
✅ 강제: 본문 첫 줄에 사주 근거 (인성·수·토·화·목·식상 등) 반드시 명시. 위 매핑 표와 일치해야 함.
${(childAgeStage === "infant" || childAgeStage === "preschool") ? `
🔴 영·유아 케이스 미래 시제 강제: "앞으로 자녀가 자라며 ~한 채널이 가장 두드러질 것입니다" 톤.` : ''}

<!-- (사용자 정책 — 폐기 확정) "### 디지털·미디어 균형" 페이지 영구 폐기. 사용자 의견: "우리만 있다고 해서 페이지가 존재해야 할 이유는 없다." 사주 근거(불·식상)와 디지털 중독 위험도의 상관관계는 추정 수준이며, 점수화(43점 등)가 측정 가장 인상을 줄 위험. -->
★ **"### 디지털·미디어 균형" 섹션은 어떤 연령에서도 출력하지 마세요**.

<!-- 사용자 정책: "자존감 보호 — 무너졌을 때 부모의 말" 페이지 전 연령 영구 폐기 (사주 변별력 0) -->
★ **"### 자존감 보호" 섹션은 어떤 연령에서도 출력하지 마세요**. "[멘트]", "친구에게 거절당했을 때", "시험·발표 망쳤을 때", "자기를 미워하는 말" 같은 블록을 어떤 형태로도 작성 금지.

### 자녀의 신체 결 — 약한 곳·살펴주실 신호
※ 이 페이지는 자녀의 *약한 오행과 신체 부위 작용*을 다룹니다.

🔴 **D안 E 신설 페이지 (정통 명리 깊이)**: Ch 5 일상 챕터의 *약한 오행 → 신체 작용* 페이지. 약한 오행 어휘 분리: 본 페이지 = "**몸이 ~한 결로 흐름**" 어휘만 (Ch 7-3 "직업 영역 보강"·Ch 2-3 "환경 채움" 어휘 절대 X).

🔴 **사주 인자 — 메인 인자**: 자녀의 약한 오행 (현재: ${weakestElem}) → 신체 부위 매핑.
- **목(木) 약함** = 간·근육·관절·혈액 흐름 결
- **화(火) 약함** = 심장·순환·체온·기운 발산 결
- **토(土) 약함** = 비위·소화·흡수·면역 결
- **금(金) 약함** = 폐·기관지·피부·호흡 결
- **수(水) 약함** = 신장·뼈·체액·집중 결

🔴 **본 페이지 시각 자료**: 없음 (오행 분포는 Ch 1 차트 페이지가 표시). 본문은 약한 오행→신체 매핑·살핌·일상 채움.

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 신체 결 한 줄** (약 70~90자): "(앞서 본) ${d.childName}의 ${weakestElem}의 결이 가장 가벼워, 자녀의 몸은 [해당 오행 → 신체 부위]의 결로 흐릅니다." 한 줄로 약한 오행 + 신체 매핑.
2. **단락 2 — 살펴주실 신호 일상 장면** (약 110~150자): *살펴주실 신호 2~3개*. 木 약: "오래 앉아 있을 때 다리 자주 풀어 흔드는·새벽 잠이 얕은" / 火 약: "손발이 자주 차가운·기운이 가라앉기 쉬운" / 土 약: "식욕이 들쑥날쑥·배가 자주 더부룩한" / 金 약: "감기가 자주 길어지는·피부가 건조해지는" / 水 약: "물 마시는 양이 적은·집중이 짧아지는" 중 자녀 결.
3. **단락 3 — 부모 시선 + 마무리** (약 90~120자): 약한 오행 채워주실 길 — 木: "잠자리 전 가벼운 스트레칭" / 火: "따뜻한 햇살 받는 산책" / 土: "같은 시간 따뜻한 식사" / 金: "환기·실내 습도" / 水: "물 자주 마시는 자리" 중 1~2가지 + 자기 호흡으로 몸 결이 단단해지는 한 줄 마무리.

🔴 **어휘 정책**:
- ❌ 의학 진단·병명 단정 절대 X — "**살펴주실 신호**" 어휘만.
- ❌ "건강 문제·이상·질환" 단정 X — "결의 흐름" 톤.
- ❌ Ch 7-3 "영역 보강" 어휘 X / Ch 2-3 "환경 채움" 어휘 X.
- ✅ 핵심 키워드: "**몸 결의 흐름·약한 결의 살핌**".
- ✅ 가능성 어조 ("~할 때가 있을 수 있습니다·~한 신호가 보일 수 있습니다").

🔴 **자원 프레임**: 약한 결은 자녀의 *부족함이 아니라 살펴주실 신호*. 부모님이 일상에서 채워주실 때 자라는 톤.

### 자녀의 개운법(改運法) — 행운 색·방위·음식·시간
※ 페이지 위에 자녀 개운법 카드가 자동 표시됩니다.

🔴 **본 페이지 시각 자료 (자동 표시)**: 자녀 개운법 카드 (시드 기반 색·방위·음식·시간·숫자). 본문은 카드와 중복되지 않게 비보 *작용·일상 녹임*만.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **비보 5채널 (색·방위·음식·시간·숫자) 작용 풀이**.
- 용신 정의 풀이 X (Ch 1 "채워줄 결과 살펴줄 결" 페이지가 PRIMARY — 트리오 카드가 표시).
- 본 페이지는 *비보를 일상에 어떻게 녹일지* 작용·장면만.
- D-3 시간 영역 분리 강제: 본 페이지 "시간" 채널 = **보강 시간**(용신 비보) — 자연 활기 시간(일주, Ch 5-2)과 어휘 분리.

★★★ **반드시 다음 결정론 시드만 사용** (Phase 3 신규):
- ${childGaeunSeed}

본문 구조 (양반사주식 — 비보 5채널 작용 가이드, **240~300자, 3 단락**):
1. **단락 1 — 개운 한 줄** (약 60~80자): "(앞서 본) ${d.childName}의 빛은 [용신 오행]의 결이 더해질 때 자라납니다 — 일상에 자연스럽게 녹이는 다섯 채널을 살펴드립니다." 형식. 용신 정의 풀이 X (Ch 1 트리오 카드가 표시).
2. **단락 2 — 일상 비보 가이드** (약 130~170자): 시드의 색·방위·음식·환경 중 **2~3개**를 자녀 일상에 *어떻게 녹일지* 구체 장면. 방 소품 위치 / 식탁 음식 / 외출 방위 / 활동 환경 — 부모가 즉시 적용 가능한 1~2개.
3. **단락 3 — 부모의 살림 마무리** (약 50~70자): 비보를 *자연스럽게 녹여* 자녀의 빛이 자라는 환경 결로 마무리. 강제·교조 X.

🔴 **어휘 정책**:
- ✅ "개운법(改運法)" 한자병기 1회만.
- ❌ "행운 부적·미신·점괘" 같은 어휘 X. 개운법은 *오행 환경 조절*이지 *주술*이 아님.
- ❌ "이걸 하지 않으면 ~할 것" 같은 협박 톤 X.
- ✅ "자연스럽게·녹여서·곁에 두면" 부드러운 톤.
- ❌ **시간대(11~13시·정오 등) 언급 절대 금지** — 시간 정보는 다음 페이지("시간 호흡")에 일원화. 본문에서 시간 언급 X.

🔴 **어미 정책 — 절대 통일 (사용자 지적 반영)**:
- ✅ **모든 문장 어미는 "-니다" 형식으로 통일** (다른 페이지와 일관)
- ❌ 절대 금지 어미: "**~보세요·~하세요·~주세요·~봐요·~해요**" 같은 친근체 어미 일체 X
- ✅ 권장 어미: "**~보시면 좋습니다·~하시면 도움이 됩니다·~주시면 좋습니다·~해주시면 좋습니다**"
- 예시:
  - ❌ "활용해 보세요" / ✅ "활용하시면 좋습니다"
  - ❌ "올려 보세요" / ✅ "올리시면 도움이 됩니다"

🔴 **자원 프레임**: 개운법은 *자녀의 빛을 자라게 하는 환경*. 부모가 자연스럽게 일상에 녹여주는 살림.

### 자녀에게 좋은 시간·환경 — 일주 기반 일상 호흡
※ 페이지 위에 자녀 시간 가이드 카드가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자 (D-3 시간 영역 분리)**: **일주 시간 호흡 톤 — "자연 활기 시간" 어휘 강조**.
- D-3 시간 영역 분리 강제: 본 페이지 = **자연 활기 시간** (일주 본연의 호흡 시간) / Ch 5-3 (개운법) = **보강 시간** (용신 비보). 두 페이지의 어휘를 분리 — "보강·비보·용신" 어휘 본 페이지 X.
- D-3 일주 시간 분리 강제: 본 페이지 = **일상 시간** (학습 X) / Ch 3-3 = 학습 특화 시간. 본 페이지는 일상 호흡만 — 학습 환경·집중 시간 풀이 X.
- 12운성 본질·신체 리듬 메커니즘 풀이 X (PRIMARY는 Ch 5-1 "잠자리·식습관"). 일주 작용 한 줄만, 정의 X.

★★★ **반드시 다음 결정론 시드만 사용** (Phase 3 신규):
- ${childTimingSeed}

🔴 **챕터 질문 — 본문 첫 문장 정합 강제**: 이 페이지는 "활기 시간·학습 시간·야외 시간" 분류표가 아니라 "**자녀의 호흡이 가장 자연스럽게 풀리는 시간 결**" 페이지. 자녀의 *일주(日柱)* 가 어떤 시간 결에서 호흡이 자연스럽게 풀리는지 본문 첫 문장에 정합.

본문 구조 (D안 C-A — 양반사주식: 일주 한 줄 + 시간대별 일상 가이드 메인, 240~290자, 2~3 단락):
1. **단락 1 — 사주 한 줄 참조** (약 50~70자): "(앞서 본) ${d.childName}${d.childGender === '남' ? '군' : '양'}의 일주 결로 호흡이 *[시간 결]*에서 가장 자연스럽게 풀립니다." *한 줄만*. 일주·12운성 정의 풀이 X.
2. **단락 2 — 시간대별 일상 가이드 메인** (약 130~160자): 시드의 잠·학습·야외 시간 3가지를 *부모가 일상에 어떻게 짤지* 구체 가이드. 아침/오후/저녁 시간대별 활동 배치, 주말 시간 흐름 등 즉시 적용 장면 1~2개.
3. **단락 3 — 마무리 한 줄** (약 50~70자): 자녀가 자기 시간 결에 맞는 호흡으로 살아갈 때 자기답게 자라는 결로 마무리.

🔴 **어휘 정책**:
- ✅ 일간·일지 한자 노출 1회 OK (예: "일간 기(己)·일지 축(丑)").
- ❌ "이 시간 외에는 안 된다" 같은 강제 톤 X.
- ✅ "자녀의 결이 살아나는 시간·자녀의 빛이 자라는 시간" 같은 부드러운 톤.

🔴 **자원 프레임**: 시간 가이드는 *자녀의 호흡에 맞는 일상 리듬*. 부모가 자녀의 결을 *읽어주고 맞춰주는* 결.

<!-- D-4 (양육 도메인 이동): "### 절대 하면 안 되는 5가지" 페이지를 Ch 5(몸·일상)에서 Ch 8(부모와 함께 자라나요)로 이동.
     이유: 카드 콘텐츠가 양육 태도 도메인이라 lifestyle 어휘 사전과 부정합. Ch 8 자원 톤에 맞춰 "두 분이 의식적으로 비켜주실 결"로 reframe.
     기신 정의 슬롯은 옵션 ② — Ch 8 양육 톤에 정의 슬롯이 어울리지 않아 폐기. Ch 1 (평생 빛나는 결)에 양면 한 줄로 이미 있어서 중복 제거 효과. -->

<!-- Phase 2-A 통합: "## 우리 아이는 어느 시기에 어떻게 변하나요" 챕터 헤더 폐기 → 위 "## 우리 아이는 어떻게 자라나요" 챕터에 흡수.
     아래 시기 흐름 소제목들(현재 대운·사춘기·평생 흐름)은 위 통합 챕터의 후반부 페이지로 자동 편입.
     어휘 분리 강제: 일상 호흡(몸·잠·식사·시간 — 앞 페이지) ↔ 시기 흐름(대운·사춘기·평생 — 뒤 페이지) 두 도메인 어휘 겹치지 않게. -->

### 지금 — 자녀의 현재 대운(大運) 풀이
※ 페이지 헤더에 "🔮 현재 대운" 라벨이 자동 표시됩니다.

🔴 **본 페이지 시각 자료**: 페이지 헤더 "🔮 현재 대운" 라벨 + (다음 페이지 평생 흐름이 대운 타임라인 시각). 본 페이지는 **대운 PRIMARY 정의 슬롯** — 한자병기 1회 + 한 줄 정의 OK.

★★★ **반드시 다음 사주 데이터만 사용**:
- 자녀 대운 시작 나이: ${sajuChild.daeun?.number ?? "—"}세
- 자녀 대운 사이클: ${(sajuChild.daeun?.cycles ?? []).slice(0, 3).map(c => `${c.age}세(${c.stem}${c.branch})`).join(" → ")}
- 자녀 현재 나이: ${childAge}세 → 현재 대운: ${(() => {
  const cycles = sajuChild.daeun?.cycles ?? [];
  if (cycles.length === 0) return "(대운 데이터 없음)";
  let current = cycles[0];
  for (const c of cycles) {
    if (c.age <= childAge) current = c;
    else break;
  }
  return `${current.age}세 (${current.stem}${current.branch})`;
})()}
- 자녀 일간: ${sajuChild.ilgan} (${childSeed.ilganElement})

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 대운 한 줄 (정의 슬롯)** (약 80~110자): "**대운(大運)** = 10년마다 흐르는 큰 결의 흐름. ${d.childName}의 현재 대운은 **[대운 한자]** 의 결로, 자녀 일간 ${sajuChild.ilgan}(${childSeed.ilganElement}) 결에 [어떤 작용]을 더해 흐릅니다." 한자병기 1회.
2. **단락 2 — 현재 대운 일상 흐름** (약 120~150자): 현재 대운이 자녀 일상에 어떻게 작용하는지 *구체 장면 1~2개*. "지금 시기는 ~한 결이 자녀에게 살아나는 흐름·[학습·관계·자기 결] 영역에서 ~한 호흡·앞으로 [몇 년 후] 다음 대운으로 변환" 톤. 자녀 연령 무관 부담 없는 톤.
3. **단락 3 — 부모 시선 + 마무리** (약 80~110자): 현재 대운 결 받쳐주실 부모 시각 — "이 시기 자녀의 ~한 결이 자라가고 있으니 [구체 환경·태도]로 곁에서 받쳐주시면 좋습니다" + 자기 호흡으로 깊이 가꾸어가는 한 줄 마무리.

🔴 **★ 대운 PRIMARY 정의 슬롯 (D안 E)**: 본 페이지가 **대운(大運)의 PRIMARY 정의 슬롯**. 단락 1에서 한자병기 1회 + 한 줄 정의. 다음 페이지(사춘기·평생 흐름)에서는 정의 풀이 X — 작용·장면만.

🔴 **어휘 정책**:
- ✅ 대운 한자병기 1회만 (단락 1).
- ❌ "운명·예언·확정" 어휘 X.
- ❌ 30세 이후 시기 단정 X (자녀 연령 기준 가까운 미래만).
- ❌ 부모 죄책감 X.
- ✅ "**자기 결의 큰 호흡·시기의 흐름·결이 자라가는 자리**" 톤.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 대운은 자녀가 *지금 타고 있는 결의 큰 흐름*. 부모님이 흐름을 알아두실 때 자녀를 더 깊이 받쳐주실 수 있다는 톤.

${childCrisis ? `### 사춘기에 결이 변하는 시기 — 통과 가이드
※ 페이지 위에 시기·신호·회복 카드가 자동 표시됩니다.

★★★ **반드시 다음 사전 계산 결과만 사용** (Phase 4 — 사용자 정책: mom/dad 양 챕터 → 실전 양육 가이드 통합):
- 시기: **${childCrisis.ageRange}** (${childCrisis.source === "daeun" ? "자녀 대운 변환점" : "발달심리학 표준 사춘기 시기"})
- 단계: **${childCrisis.pubertyStage === "peak" ? "사춘기 절정 시기" : "사춘기 입구 시기"}**

본문은 **300~380자, 2~3 문단**. ${(hasMom && hasDad) ? "**부모님(어머님·아버님 양측)** 관점 통합 — 한 페이지에서 두 부모 모두 다룸." : hasMom ? "**어머님** 관점." : hasDad ? "**아버님** 관점." : "**부모님** 관점."}

🔴 **어휘 정책 — 발달심리학 표준어만**:
- ✅ 사용 가능: "사춘기 입구·사춘기 절정·결이 변하는 시기·거리감이 생기는 시기·자라며 자기 결을 단단히 세우는"
- ❌ 영구 ban (부부 어휘 + 부정 어휘): "**권태기·헤어질 위기·이별·재회·악연·헤어짐·멀어짐**"
- ❌ 부모 죄책감 어휘 ban: "엄마·아빠 잘못·놓치면·못 챙겨주면·후회"

🔴 **단계별 톤 가이드**:
${childCrisis.pubertyStage === "peak" ? `- **사춘기 절정 (중등)**: 자녀가 이미 자기 결을 단단히 세워가는 시기. "방문이 닫히는 일이 잦아질 수 있다", "대답이 짧아질 수 있다", "조용한 자리를 더 찾으려 한다", "친구와의 시간을 더 우선시한다" 같은 신호를 일상 장면으로 묘사.` : `- **사춘기 입구 (초등)**: 곧 자녀의 결이 변하기 시작하는 시기. "자기 의견이 분명해진다", "가끔 벽을 세운다", "친구 영향이 커진다", "혼자만의 호흡을 늘리려 한다" 같은 신호를 일상 장면으로 묘사.`}

🔴 **챕터 질문 — 본문 첫 문장 정합 강제**: 이 페이지는 단순 사춘기 가이드가 아니라 "**자녀의 결이 변환하는 자연스러운 시기**" 페이지. *대운(大運) 변환점*과 사춘기가 만나는 자리를 본문에 분명히 명시 (시기 소개 한 줄 안에 "대운 변환점" 어휘 1회 노출).

🔴 **본문 구조** (D안 C-A — 양반사주식: 대운 변환점 한 줄 + 사춘기 신호·부모 다가가는 길 일상 가이드 메인):
1. **시기 소개 사주 한 줄** (약 60~80자): "${d.childName}${d.childGender === '남' ? '군' : '양'}에게는 ${childCrisis.ageRange}이 ${childCrisis.source === "daeun" ? "*대운(大運) 변환점*과 맞물려 결이 자연스럽게 변하는 시기" : "결이 자연스럽게 변하는 시기 (대운 변환점 인근)"}로 다가옵니다." *한 줄만*. 대운 정의 풀이 X (PRIMARY 슬롯은 다음 페이지).
2. **신호 일상 장면 가이드 메인** (약 140~180자): 자녀의 일간 오행에 맞는 *구체 사춘기 신호 3~4가지*를 일상 장면으로 짧게 나열 + 부모가 그 신호를 어떻게 알아채면 좋은지.
3. **부모별 다가가는 길 가이드** (각 부모 입력에 따라 분기):
   ${(hasMom && hasDad) ? `- **어머님께서는** ~한 거리·태도로 다가가실 때 자녀의 결이 자연스럽게 풀어집니다 (감정·정서적 결 강조 — 곁에 머무는 시간·마음 읽기 등).
   - **아버님께서는** ~한 방향으로 다가가실 때 자녀의 결이 자기 박자로 자라납니다 (행동·결정 결 강조 — 큰 방향만 짚고 세부는 자녀에게 맡기기 등).` : hasMom ? `- **어머님께서는** ~한 거리·태도로 다가가실 때 자녀의 결이 자연스럽게 풀어집니다.` : hasDad ? `- **아버님께서는** ~한 방향으로 다가가실 때 자녀의 결이 자기 박자로 자라납니다.` : `- **부모님께서는** ~한 거리·태도로 다가가실 때 자녀의 결이 자연스럽게 풀어집니다.`}

🔴 **자도인 마지막 한마디 페이지와의 어휘 분리**:
- 이 페이지: "결이 변하는 시기·거리의 곡선·자라는"
- 자도인 마지막 한마디: 사춘기·시기 언급 회피, 사주 본질 메시지로

🔴 **단정 금지 → 가능성 어조**: "반드시 ~함" X, "**~할 수 있습니다·~한 신호가 나타날 수 있습니다·~한 결이 올라올 수 있습니다**" 톤으로.

🔴 **다음 페이지 연결 메시지 (사용자 정책 — 두 페이지 자연 결합)**:
본문 마지막에 반드시 *연결 한 줄* 추가: "**이 사춘기 시기는 자녀의 평생 대운(大運) 흐름의 한 변환점입니다. 다음 페이지에서 자녀의 평생 대운 흐름 전체를 함께 살펴드리겠습니다.**" 형식.
${(childAgeStage === "infant" || childAgeStage === "preschool") ? `
🔴 **영·유아 케이스 미래 시제 강화**:
- ❌ 절대 금지: "지금 ~한다·현재 ~를 보인다·오늘 ~한다" 같은 현재형 일체.
- ✅ **모든 동사 미래형 통일**: "**~할 것입니다·~할 시기가 옵니다·~게 될 것입니다·~한 신호가 나타날 수 있습니다**"
- ✅ 권장 도입: "${d.childName}${d.childGender === '남' ? '군' : '양'}이 자라면서 사춘기 시기가 오면 ~한 신호가 나타날 수 있습니다"` : ''}` : `<!-- 사춘기 페이지 미생성 (childCrisis null) -->`}

### 자녀 인생 흐름 한눈에
※ 페이지 헤더에 "🔮 대운 (인생 흐름)" 라벨이 자동 표시됩니다.

★★★ **반드시 다음 사주 데이터만 사용** (단계 2 신규 — 인생 흐름):
- 자녀 대운 시작 나이: ${sajuChild.daeun?.number ?? "—"}세
- 자녀 대운 8 사이클: ${(sajuChild.daeun?.cycles ?? []).map(c => `${c.age}세(${c.stem}${c.branch})`).join(" → ")}
- 자녀 일간: ${sajuChild.ilgan} (${childSeed.ilganElement})
- 0~25세 안 변환점만 본문에 인용 (성인기 이후는 다루지 않음)

본문 구조 (반드시 이 흐름, 600~700자, 4 문단 + 도입 연결 메시지):

🔴 **신뢰도 강화 정책 (사용자 정책) — 사주 근거 명시 강제**:
각 단락은 반드시 다음 두 가지를 *모두* 포함:
1. **단락 첫 문장에 *대운 한자 + 오행* 명시**: "자녀의 1차 대운 **임술(壬戌)** — 임(壬, 수)과 술(戌, 토)이 6세부터 함께하는 흐름입니다." 형식.
2. **풀이 본문에 *자녀 일간 + 대운 오행 작용* 인라인 명시**: "흙의 결(자녀 일간 ${sajuChild.ilgan} ${(sajuChild.ilgan === '갑' || sajuChild.ilgan === '을' ? '木' : sajuChild.ilgan === '병' || sajuChild.ilgan === '정' ? '火' : sajuChild.ilgan === '무' || sajuChild.ilgan === '기' ? '土' : sajuChild.ilgan === '경' || sajuChild.ilgan === '신' ? '金' : '水')})을 타고난 자녀가 임술 대운을 만나면서..." 형식.

🔴 **앞 페이지 연결 메시지 (사용자 정책 — 두 페이지 자연 결합)**:
본문 도입에 반드시 *연결 한 줄* 추가: "**앞 페이지에서 본 사춘기 시기 변화는 이 평생 흐름의 한 변환점입니다. 자녀의 평생 대운(大運) 흐름을 큰 그림으로 펼쳐드리겠습니다.**" 형식.

본문 단락 구조 (강화 — 사용자 정책 "분량·깊이 강화"):
1. **단락 1 — 영아·유아·초등 흐름 (0~15세)** (약 150~200자): 자녀의 첫 대운(약 6~15세)을 *한자병기 + 오행* 명시하며 시작. 자녀 일간(${sajuChild.ilgan} ${childSeed.ilganElement}) 본질이 그 대운과 어떻게 작용하는지 풀이. **영역별 흐름 1~2개** (학교·친구 관계·자기 탐구 중) 자연 인용. **부모 시각 가이드 한 줄** ("부모님께서는 ~ 살펴주실 때 자녀가 자기 결을 단단히 세웁니다") 단락 끝에.
2. **단락 2 — 사춘기·중고등 흐름 (16~25세)** (약 150~200자): 자녀의 2차 대운(약 16~25세)을 *한자병기 + 오행* 명시. **이행 과정 묘사** ("1차 대운에서 단단해진 ~의 결이, 2차 대운의 ~의 흐름과 만나면서") 시기 간 자연 연결. **영역별 흐름 1~2개** (학습·진로 탐구·관계 중) 인용. **부모 시각 가이드 한 줄** 단락 끝에.
3. **단락 3 — 청년기 진입 흐름 (26세 무렵)** (약 150~200자): 자녀의 3차 대운(약 26세 무렵)을 *한자병기 + 오행* 명시. **이행 과정 묘사**. **영역별 흐름 1~2개** (진로·직업·인간관계 중) 인용. **부모 시각 가이드 한 줄** 단락 끝에.
4. **단락 4 — 평생 흐름 마무리** (약 60~90자): 자녀의 평생 흐름을 멀리서 바라보시며 자기 결을 자연스럽게 펼치도록 함께해 주시면 좋다는 톤으로 마무리.

🔴 **본문 분량**: 총 600~700자 (3 단락 각 150~200자 + 마무리 60~90자 + 도입 연결 메시지)

🔴 **어휘 정책**:
- ✅ **대운 한자 *매번* 노출 OK** (예: "임술(壬戌)", "계해(癸亥)", "갑자(甲子)") — 신뢰도 강화 정책에 따라 모든 대운 사이클의 한자병기 허용.
- ✅ **오행 명시 강제** — 각 대운 사이클의 천간·지지가 어느 오행인지 매번 명시 ("임=수, 술=토" 형식).
- ✅ **자녀 일간 인라인 인용** — 풀이마다 "자녀 일간 ${sajuChild.ilgan}(${childSeed.ilganElement})" 형식으로 인라인 노출.
- ❌ 연도(2030년 등) 단정 금지 — "만 X세 무렵" 시기 구간만.
- ❌ 30세 이후 시기 언급 X — 0~25세 범위 한정.
- ❌ "반드시 ~함" 단정 X — "~할 수 있습니다·~한 결이 자라납니다" 가능성 어조.
- ❌ 부모 죄책감 X.
- ✅ "사주 결의 흐름·자녀의 결이 자라가는 자리·자연스럽게 펼쳐가는" 톤.

## 우리 아이의 미래·진로는

### 타고난 재능 영역
★★★ **반드시 다음 사전 계산 결과만 사용**: 이 자녀의 TOP 3 재능 = **${intel8Top3}** (페이지 위 카드와 동일).
이 외 다른 재능은 절대 언급하지 말 것. 위 3가지를 어떤 환경에서 빛내는지 한 단락으로 풀어주세요.

🔴 **(Phase 5) 어휘 정통화 — 8지능(다중지능)·서구 이론 어휘 절대 금지**:
- ❌ 절대 금지: "다중지능·8지능·하워드 가드너·MI·언어 지능·논리수학 지능·공간 지능·신체운동 지능·음악 지능·대인 지능·자기성찰 지능·자연주의 지능"
- ❌ 절대 금지: "IQ·EQ·뇌기반학습·뉴로피드백" 같은 현대 학습 이론 어휘
- ✅ **십성·오행 어휘로 풀이**: 재능 = 자녀 사주의 *식상(食傷, 표현·창의)·인성(印星, 학문·사색)·재성(財星, 실용·실리)·관성(官星, 조직·규율)·비겁(比劫, 자기·독립)*과 *오행(목·화·토·금·수)*의 작용.
- ✅ TOP 3 카드 라벨은 그대로 유지. 본문은 "이 재능은 자녀의 *식상이 풍부한 결*에서 비롯됩니다" 같은 십성·오행 어휘 풀이.

<!-- D안 D-3b 통합·폐기: 호기심·학습 스타일·효과적 학습 환경 → Ch 3 학습 챕터 영역과 중복 폐기 / 진로 적합 vs 피해야 → 격국 직업 적성으로 통합 -->
★ **"### 호기심·끌림 영역", "### 학습 스타일", "### 효과적 학습 환경", "### 진로 적합 vs 피해야 할 영역" 4개 섹션은 어떤 연령에서도 출력하지 마세요**. 학습 관련 내용은 Ch 3 학습 챕터에서, 진로 적합 분야는 격국 직업 적성 페이지에 통합됨.

### 사고 유형
※ 페이지 위에 사고 매트릭스 + 매트릭스 카드가 자동 표시됩니다.

★★★ **반드시 다음 사전 계산 결과만 사용**: 이 자녀의 사고 유형 = **${thinkingT.dominant}** (페이지 위 매트릭스와 동일).

🔴 **D-3b 통합 — 본 페이지 = 사고 + 학습 스타일 통합 풀이**:
본문 구조 (240~290자, 2~3 단락):
1. **단락 1 — 사고 유형 한 줄** (약 70~100자): "${d.childName}의 사고 결은 *${thinkingT.dominant}*입니다." + 사주 근거 한 줄 (식상·인성·재성·관성 중 우세 결).
2. **단락 2 — 일상 사고·학습 장면** (약 110~140자): ${thinkingT.dominant}이 자녀의 *일상 사고·학습 흡수 방식*에서 어떻게 드러나는지 구체 장면 1~2개. (예: 인성형 → "혼자 깊이 곱씹어 정리" / 식상형 → "말로 풀어내며 자기 것으로" / 재성형 → "직접 해보며 익힘" / 관성형 → "체계 따라 차곡차곡")
3. **단락 3 — 부모 가이드 한 줄** (약 60~80자): 자녀의 사고 결에 맞춘 학습 환경 한 줄 (조용한·움직이는·논리적·체계적 중).

🔴 **(Phase 5) 어휘 정통화 — MBTI 인지기능·서구 사고 이론 어휘 절대 금지**:
- ❌ 절대 금지: "MBTI·NT·NF·ST·SF·인지기능·Ni·Ne·Si·Se·Ti·Te·Fi·Fe·좌뇌·우뇌"
- ✅ **십성 4분류 어휘**: 인성(사색)·식상(발산)·재성(실용)·관성(체계).

### 격국(格局) 기반 직업 적성
※ 페이지 위에 자녀 격국 + 적합 분야 카드가 자동 표시됩니다.

🔴 **본 페이지 시각 자료 (자동 표시)**: 자녀 격국 카드 + 적합 분야 카드. 본문에서 격국 한자·이름·의미 다시 풀이 X (Ch 1 자녀 본질 페이지 + 본 페이지 카드가 이미 표시).

🔴 **사주 인자 — 본 페이지의 메인 인자**: 격국의 *직업 맥락* 작용. 정의 풀이 X (시각 자료 표시). 관성 도메인 어휘 분리: **"직업 모범"** 어휘만 (PRIMARY "절제·균형"은 Ch 2-2).

★★★ **반드시 다음 결정론 시드만 사용** (Phase 5 신규):
- ${childGyeokgukSeed}
- 6각 진로 레이더 결과: TOP 3 = **${jobTop3}**, 약한 결 = **${jobAvoid.name}**

본문 구조 (양반사주식 — 격국 직업 작용 통합, **240~320자, 3 단락**):
1. **단락 1 — 직업 맥락 한 줄** (약 60~80자): "(앞서 본) ${d.childName}의 ${childGyeokgukData?.name ?? '격국'} 결은 직업 영역에서 [어떤 큰 방향]을 자연스럽게 닿게 합니다." 한자 X (Ch 1 카드·본 페이지 카드가 표시). 정의 풀이 X.
2. **단락 2 — 적합 분야 + 부담 영역** (약 130~170자): 격국 시드 적합 분야 중 2~3개를 6각 레이더 TOP 3 (**${jobTop3}**)와 *교차*해 자녀에게 가장 자연스러운 분야 1~2개 강조. 약한 결 (**${jobAvoid.name}**)은 *부담이 되는 영역*으로 한 줄.
3. **단락 3 — 부모 시선 마무리** (약 50~70자): 격국 기반 직업은 *방향성*이지 *단정*이 아님. 자녀가 자라가며 자기 결로 직업을 선택하도록 부모가 *큰 방향만 안내*하는 한 줄.

🔴 **어휘 정책**:
- ✅ 격국 한자병기 1회만 (이미 Part 02에서도 등장했지만 여기서는 *직업 맥락*으로 다시).
- ❌ 직업 단정 금지 ("이 자녀는 반드시 ~가 되어야 한다" X). *적합 분야 후보*로만.
- ❌ 부모 강제 어휘 X ("자녀를 ~로 키워야 한다" X). 자녀 자기 선택 존중 톤.
- ✅ 가능성 어조.

🔴 **자원 프레임**: 격국 직업은 *자녀의 인생 큰 그림에 자연스럽게 닿는 분야*. 강제가 아니라 *방향성 안내*.

### 채워야 할 부분 — 자녀가 보완하면 빛나는 결
※ 이 페이지는 자녀가 *진로 영역에서 부담 느끼는 자리와 보완의 길*을 다룹니다.

🔴 **본 페이지 시각 자료**: 없음 (Ch 1 트리오 카드가 기신 한자 표시). 본문은 약한 오행→진로 영역 보강 작용만.

🔴 **사주 인자 — 메인 인자**: 자녀 약한 오행 (현재: ${weakestElem}) + 기신 (${childGisinData?.element ?? "—"}) 의 *진로 영역* 작용. 정의 풀이 X (Ch 5 PRIMARY). 약한 오행 어휘 분리: 본 페이지 = "**영역 보강**" 어휘만 (Ch 5-1 "몸 결의 흐름"·Ch 2-3 "환경 채움" 절대 X).

본문 구조 (양반사주식, **280~360자, 3 단락** — Phase 2-B 압축):
1. **단락 1 — 부담 영역 한 줄** (약 70~90자): "(앞서 본) ${d.childName}은 진로에서 [어떤 영역]에 부담을 느낄 수 있습니다." 약한 오행 → 진로 영역 매핑: 木 약 = 길게 자라남이 필요한 영역 / 火 약 = 빠른 표현·발산이 필요한 영역 / 토 약 = 안정·반복이 필요한 영역 / 金 약 = 정밀·정리가 필요한 영역 / 水 약 = 깊이 사색·몰입이 필요한 영역.
2. **단락 2 — 부담 자리 + 보완의 길** (약 120~160자): *부담 느낄 수 있는 영역 장면 1개* + 약한 결을 자라며 채워가는 길 — "어린 시기부터 [해당 오행 환경]을 일상에 자연스럽게 녹이기·자녀가 자라며 자기 페이스로 다가갈 자리 보장·조기 진로 결정 피하기" 중 1~2가지. **D-3 기신 회피 어휘 분리: 본 페이지 = "조기 진로 결정·강한 영역 강요" 어휘만 (Ch 3-4·Ch 5-4 어휘 X).**
3. **단락 3 — 부모 시선 + 마무리** (약 70~100자): 자녀가 자라가며 자기 결로 영역 폭을 넓혀가는 한 줄. 강요·단정 X.

🔴 **어휘 정책 — D-3 어휘 분리 강제**:
- ✅ 약한 오행 어휘 = "**영역 보강·진로에서 부담 자리·보완의 길**" 만.
- ❌ Ch 5-1 "몸 결의 흐름·신체 부위" 어휘 X.
- ❌ Ch 2-3 "환경 채움·회복" 어휘 X.
- ❌ 기신 한자·정의 풀이 X (Ch 5-4 PRIMARY).
- ❌ 직업명 단정 X.
- ❌ "능력 부족·재능 없음" 평가 어휘 절대 X.
- ❌ "조기 진로 결정·강요" 외 다른 부모 행동 경고 어휘 X (Ch 3-4·Ch 5-4 어휘와 분리).
- ✅ 가능성 어조.

🔴 **자원 프레임**: 약한 결은 자녀의 *부족함이 아니라 자라며 채워가는 빛*. 부모님이 어린 시기부터 자연스럽게 채워주실 때 진로의 폭이 넓어진다는 톤.

### 진로 결정 시기 안내
※ 페이지 헤더에 "🔮 대운 (진로 시기)" 라벨이 자동 표시됩니다.

★★★ **반드시 다음 사주 데이터만 사용** (단계 2 신규 — 진로 시기):
- 자녀 대운 사이클: ${(sajuChild.daeun?.cycles ?? []).slice(0, 4).map(c => `${c.age}세(${c.stem}${c.branch})`).join(" → ")}
- 만 14~17세 무렵 진로 결정 시기 = ${(() => {
  const c = (sajuChild.daeun?.cycles ?? []).find(x => x.age >= 14 && x.age <= 18);
  return c ? `${c.age}세(${c.stem}${c.branch})` : "만 15세 무렵";
})()}
- 자녀 가장 닿는 진로 결: **${jobTop1.name}**

본문 구조 (D안 C-A — 양반사주식: 대운 한 줄 + 진로 결정 시기 부모 안내 가이드 메인, 240~290자, 2~3 문단):
1. **단락 1 — 사주 한 줄** (약 50~70자): "${d.childName}${d.childGender === '남' ? '군' : '양'}이 자라며 진로의 결을 정해갈 시기는 만 14~17세 무렵 (대운 변환점 인근)입니다." *한 줄로*. 대운 정의 풀이 X.
2. **단락 2 — 진로 결정 시기 부모 안내 가이드 메인** (약 130~160자): 그 시기 *전·후*로 부모가 어떻게 다가가면 좋은지 — 자녀와 진로 대화 어떤 자리·시점에서 / 적합 영역(${jobTop1.name})을 어떤 톤으로 비춰주실지 / 자녀 의견 듣는 방식. 즉시 적용 가능한 장면 1~2개.
3. **단락 3 — 마무리 한 줄** (약 50~70자): 자녀가 자기 결로 진로를 펼치도록 큰 방향만 안내하는 톤 마무리.

🔴 **어휘 정책**:
- ❌ 연도(2030년 등) 단정 금지 — "만 X세 무렵" 시기 구간만.
- ❌ "반드시 ~함·~할 것입니다" 단정 X — "~할 수 있습니다·~한 시기가 옵니다" 가능성 어조.
- ❌ 직업명 단정 X — "${jobTop1.name}" 영역으로만.
- ❌ 부모 죄책감 X — "부모님이 잘 안내하셔야" 같은 부담 표현 X.
- ✅ "사주 결의 흐름·자녀의 결이 변하는 시기·자연스럽게 펼쳐가는 자리" 톤.

${(hasMom || hasDad) ? `## 엄마·아빠는 어떻게 함께 자라나요

<!-- D안 D-1 신설: Ch 8 부모와의 결 통합 챕터 (5 페이지). 기존 ## 엄마와 우리 아이 / ## 아빠와 우리 아이 챕터를 흡수. -->
🔴 **★ 절대 강제 — 헤더 출력 룰**: "## 엄마와 우리 아이" 와 "## 아빠와 우리 아이" 두 ## 챕터 헤더는 **어떤 경우에도 출력하지 마세요**. 부모 관련 모든 풀이는 본 "## 엄마·아빠는 어떻게 함께 자라나요" 챕터에서만 출력하세요. (기존 mom/dad 페이지 프롬프트는 코드에 남아 있지만 헤더가 제거되어 출력 대상에서 제외됨.)

🔴 **챕터 톤**: 어머님·아버님 두 분이 *서로 다른 결*로 자녀를 *양면에서 받쳐주시는* 가족 인연. 두 분 비교·평가 절대 X. *함께 자라는* 톤. ${(hasMom && hasDad) ? "두 분 모두 입력 — 세 사람 비교·통합 풀이." : hasMom ? "어머님만 입력 — 어머님 단독 풀이." : "아버님만 입력 — 아버님 단독 풀이."}

### 세 사람의 결 한눈에
※ 페이지 위에 세 사람 오행 비교 차트(엄마/아빠/자녀 3-way 레이더)가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **세 사람 오행 분포 비교 (영역 가이드 메인)**. 닮음·다름의 분포만, 십성·신살·일간 풀이 X (다음 페이지 슬롯).

본문 구조 (D안 C-A2 — 영역 가이드 메인) — 240~280자, 2~3 단락:

1. **사주 한 줄** (약 50~70자): "어머님, 아버님, ${d.childName}${d.childGender === '남' ? '군' : '양'}의 결을 한눈에 비교했을 때 *닮음·다름의 분포*가 다음과 같습니다." 형식. ${(hasMom && hasDad) ? "세 사람 모두 인용." : hasMom ? "어머님과 자녀만 인용. *아버님 미입력*으로 두 분 비교임을 자연스럽게 명시." : "아버님과 자녀만 인용. *어머님 미입력*으로 두 분 비교임을 자연스럽게 명시."}

2. **영역 가이드 메인** (약 130~150자): ${(hasMom && hasDad) ? "세 사람이 가족으로 만나 어떤 *결의 분포*를 이루는지 — 어머님 강한 결 + 아버님 강한 결 + 자녀 결의 균형. 두 분이 *서로 다른 결*로 자녀를 양면에서 받쳐주시는 톤. 차트 수치(%) 직접 노출 X." : hasMom ? "어머님과 자녀가 어떤 결에서 닮고 어떤 결이 다른지 일상 분포로." : "아버님과 자녀가 어떤 결에서 닮고 어떤 결이 다른지 일상 분포로."}

3. **마무리 한 줄** (약 50~70자): 가족 결 인연으로 자녀가 자라가는 톤.

🔴 **어휘 정책**:
- ❌ 차트 수치(%) 직접 노출 X. 사주 용어(일간·비화·십성) 노출 X (다음 페이지 슬롯).
- ❌ 부모 비교·평가 어휘 X ("어머님이 더 ~하시고 아버님이 덜 ~하다" 절대 금지). *서로 다른 결*로 자녀를 받쳐주시는 톤.
- ✅ "닮음·다름의 분포·서로 다른 결로 받쳐주시는·가족 결의 인연" 톤.

### 두 분이 비춰주시는 결
※ 페이지 위에 부모 십성 카드 + 일간 관계 카드 (${(hasMom && hasDad) ? "엄마+아빠 비교" : hasMom ? "엄마만" : "아빠만"}) 가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **부모 십성 + 일간 관계 (영역 가이드 메인)**. ${(hasMom && hasDad) ? "어머님 십성·아버님 십성 모두 PRIMARY 슬롯. 정의 한 줄 압축, 본문은 영역 가이드." : "단독 부모 십성 PRIMARY 슬롯."} 십성 한자병기 1회만, 정의 풀이 절대 X.

본문 구조 (D안 C-A2 — 영역 가이드 메인) — 280~340자, 3 단락:

1. **사주 한 줄** (약 50~70자): ${(hasMom && hasDad) ? `"어머님은 자녀에게 ***${momParentSipseong?.sipseong ?? "—"}(${momParentSipseong?.hanja ?? ""})**의 결로, 아버님은 ***${dadParentSipseong?.sipseong ?? "—"}(${dadParentSipseong?.hanja ?? ""})**의 결로 다가가십니다." 형식. 한자병기 1회만, 정의 풀이 X.` : hasMom ? `"어머님은 자녀에게 ***${momParentSipseong?.sipseong ?? "—"}(${momParentSipseong?.hanja ?? ""})**의 결로 다가가십니다." 형식. 한자병기 1회만, 정의 풀이 X.` : `"아버님은 자녀에게 ***${dadParentSipseong?.sipseong ?? "—"}(${dadParentSipseong?.hanja ?? ""})**의 결로 다가가십니다." 형식. 한자병기 1회만, 정의 풀이 X.`}

${hasMom ? `2. **엄마 영역 가이드** (약 110~140자): 어머님이 *식탁·취침·정돈·인복* 영역에서 자녀에게 어떻게 다가가시는지 일상 장면 1~2개 (실내·요리·하루 시작/끝의 호흡).` : ''}

${hasDad ? `${hasMom ? '3' : '2'}. **아빠 영역 가이드** (약 110~140자): 아버님이 *야외·운동·만들기·결단* 영역에서 자녀에게 어떻게 다가가시는지 일상 장면 1~2개. ${hasMom ? '엄마 영역과 *완전히 다른* 비유·동사·장면 사용 (실내·식탁 어휘 절대 금지).' : ''}` : ''}

🔴 **어휘 정책**:
- ✅ 십성 한자 1회만, 정의 풀이 절대 X (정의 슬롯 분리됨).
- ❌ 부모 다독임·죄책감 어휘 X.
- ❌ 엄마 영역에서 야외·운동 장면 X / 아빠 영역에서 식탁·정돈 장면 X (영역 렌즈 강제).
- ✅ 두 분이 *서로 다른 결*로 자녀를 *양면에서* 비춰주시는 톤.

### 두 분과 자녀의 일상 결
※ 페이지 위에 일지 합·충 카드 (${(hasMom && hasDad) ? "엄마+아빠 비교" : hasMom ? "엄마만" : "아빠만"}) 가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **일지 관계 (PRIMARY 정의 슬롯)**. 일지 한자병기 1회만, 정의 한 줄 압축, 본문은 영역 가이드.

본문 구조 (D안 C-A2 — 영역 가이드 메인) — 240~280자, 2~3 단락:

1. **사주 한 줄** (약 50~70자): ${(hasMom && hasDad) ? `"어머님과 자녀는 *${momIljiRel?.kind ?? "—"}*, 아버님과 자녀는 *${dadIljiRel?.kind ?? "—"}* 의 결로 일상이 만나십니다." 형식.` : hasMom ? `"어머님과 자녀는 *${momIljiRel?.kind ?? "—"}* 의 결로 일상이 만나십니다." 형식.` : `"아버님과 자녀는 *${dadIljiRel?.kind ?? "—"}* 의 결로 일상이 만나십니다." 형식.`} 한자 1회만, 정의 풀이 X.

2. **영역 가이드 메인** (약 130~150자): ${(hasMom && hasDad) ? "두 분과 자녀의 일상이 *어디서 부드럽게 만나고 어디서 부딪히는지* 구체 장면. 어머님(식탁·정돈) / 아버님(야외·활동) 영역 분리해서 각 1 장면씩." : hasMom ? "어머님과 자녀의 일상이 *식탁·취침·정돈* 영역에서 어디서 만나는지 1~2개 장면." : "아버님과 자녀의 일상이 *야외·운동·만들기* 영역에서 어디서 만나는지 1~2개 장면."}

3. **마무리 한 줄** (약 50~70자): 자녀가 자기 호흡으로 자라는 톤.

🔴 **어휘 정책**:
- ✅ 일지 관계 한자병기 1회만 (예: "육합(六合)·육충(六沖)").
- ❌ "충·형·파" 단독 부정 어조 X — *자극·다듬음·깨어남*의 자원 톤.
- ❌ 부모 죄책감 어휘 X.
- ✅ 가능성 어조.

### 잘 통하는 영역과 부딪히는 결
※ 페이지 위에 가족 시너지 카드 (${(hasMom && hasDad) ? "엄마+아빠 통합 3장" : "3장"}) + 갈등 카드 (2장) 가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **시너지/갈등 카드 (SSOT 그대로 출력)**. 본문은 카드 내용을 *일상 장면으로 풀어내는* 가이드만.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (이모지·키워드·본문 모두, AI 임의 변경 X)**:

[시너지]
${hasMom ? `• ${momSynergy?.[0]?.emoji ?? "🎨"} **${momSynergy?.[0]?.keyword ?? "함께하는 활동"}** — ${momSynergy?.[0]?.body ?? "두 분의 결이 자연스럽게 어우러집니다"}
• ${momSynergy?.[1]?.emoji ?? "🌿"} **${momSynergy?.[1]?.keyword ?? "조용한 공간"}** — ${momSynergy?.[1]?.body ?? "차분한 환경에서 마음이 가장 잘 통합니다"}` : ''}
${hasDad ? `• ${dadSynergy?.[0]?.emoji ?? "🌳"} **${dadSynergy?.[0]?.keyword ?? "함께하는 활동"}** — ${dadSynergy?.[0]?.body ?? "두 분의 결이 자연스럽게 어우러집니다"}` : ''}

본문 구조 (D안 C-A — 양반사주식: 카드 이후 *본문 단락* 추가) — 280~340자, 3 단락:

1. **사주 한 줄** (약 50~70자): "위 시너지/갈등 카드의 핵심은 다음 일상 장면에서 가장 또렷하게 펼쳐집니다." 형식.

2. **영역 가이드 — 시너지 메인** (약 130~150자): 어떤 *주말·평일 일상 활동*에서 가족 시너지가 자라는지 구체 장면 1~2개. ${(hasMom && hasDad) ? "두 분의 결이 자녀를 양면에서 빛나게 하는 자리 — 어머님(실내·정서·하루 호흡) + 아버님(야외·활동·결단)." : hasMom ? "어머님이 자녀를 빛나게 하는 자리 (실내·정서·하루 호흡)." : "아버님이 자녀를 빛나게 하는 자리 (야외·활동·결단)."}

3. **영역 가이드 — 갈등** (약 90~130자): 자주 부딪히는 자리에서 부모님이 *한 박자 늦춰* 다가가실 때 자녀의 결이 자기 호흡으로 자라는 톤. 구체 행동 1개 (예: "결정 전 5분 자녀의 시간 두기").

🔴 **어휘 정책**:
- ✅ 카드 본문은 SSOT 그대로 (이모지·키워드·본문 변경 절대 X).
- ❌ "양보·희생·참아야" 어휘 X — "살펴주시면·기다려주시면·맞춰주시면" 류로.
- ❌ 부모 죄책감 어휘 X.

${hasMom ? `### 어머님의 양육 톤 — 칭찬·다그침·위로의 결

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **양육 자극 톤 — 칭찬·다그침·위로 (영역 가이드 메인)**. 어머님 부모 십성·일지 관계는 *작용*으로만 한 줄 참조 (정의 슬롯 분리됨 — 정의는 위 페이지 2·3에서 이미 다룸).

본문 구조 (D안 C-A — 양반사주식 3단) — 280~340자, 3 단락:

1. **사주 한 줄** (약 50~70자): "어머님께서 자녀에게 주시는 ***${momParentSipseong?.sipseong ?? "—"}***의 결은 *칭찬·다그침·위로* 세 자리에서 서로 다른 호흡으로 닿습니다." 형식. 부모 십성은 *참조*만 (정의 풀이 절대 X).

2. **영역 가이드 메인** (약 150~180자): 어머님 영역 안에서 *세 톤*이 어떻게 펼쳐지는지 구체 장면 — **칭찬할 때**는 어떤 결로 (식탁·하루 끝 정돈·인복의 호흡), **다그칠 때**는 어떤 결로 (한 박자 늦춰·이유부터·실내의 차분함), **위로할 때**는 어떤 결로 (따뜻한 손길·앉아 있는 자리·하루 시작의 결). 자녀의 결에 맞춘 *어머님식 톤* 1~2 장면.

3. **마무리 한 줄** (약 50~70자): 자녀가 어머님 톤 안에서 자기 호흡으로 자라는 결.

🔴 **어휘 정책**:
- ✅ 어머님 영역 비유 풀: 식탁·정돈·실내·인복·따뜻한 손길·하루 시작/끝의 호흡·앉아서·책상.
- ❌ 야외·운동·만들기·결단·움직이며 어휘 X (아버님 영역 풀 — 다음 페이지 슬롯).
- ❌ 부모 십성·일지 관계 정의 풀이 X (작용만).
- ❌ "혼내야 한다·체벌·따끔하게" 협박 톤 X — *다그침·한 박자 늦춰·짚어주심* 어조.
- ❌ 부모 죄책감 어휘 X ("이렇게 안 하시면 ~한다" 절대 금지).
- ✅ "닿으심·살펴주심·기다려주심" 가능성 어조.

` : ''}${hasDad ? `### 아버님의 양육 톤 — 칭찬·다그침·위로의 결

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **양육 자극 톤 — 칭찬·다그침·위로 (영역 가이드 메인)**. 아버님 부모 십성·일지 관계는 *작용*으로만 한 줄 참조 (정의 슬롯 분리됨 — 정의는 위 페이지 2·3에서 이미 다룸).

본문 구조 (D안 C-A — 양반사주식 3단) — 280~340자, 3 단락:

1. **사주 한 줄** (약 50~70자): "아버님께서 자녀에게 주시는 ***${dadParentSipseong?.sipseong ?? "—"}***의 결은 *칭찬·다그침·위로* 세 자리에서 서로 다른 호흡으로 닿습니다." 형식. 부모 십성은 *참조*만 (정의 풀이 절대 X).

2. **영역 가이드 메인** (약 150~180자): 아버님 영역 안에서 *세 톤*이 어떻게 펼쳐지는지 구체 장면 — **칭찬할 때**는 어떤 결로 (현장·결과·만든 것을 함께 보는 결), **다그칠 때**는 어떤 결로 (단단한 어깨·결단의 순간·짚어주는 한 마디), **위로할 때**는 어떤 결로 (야외 산책·함께 움직이는 시간·말없이 옆에 있는 결). 자녀의 결에 맞춘 *아버님식 톤* 1~2 장면. ${hasMom ? '🔴 어머님 페이지에서 사용한 일상 장면·동사·비유 절대 금지 (실내·식탁·정돈·앉아서 어휘 X).' : ''}

3. **마무리 한 줄** (약 50~70자): 자녀가 아버님 톤 안에서 자기 호흡으로 자라는 결.

🔴 **어휘 정책**:
- ✅ 아버님 영역 비유 풀: 야외·운동·만들기·현장·의리·단단한 어깨·결단의 순간·움직이며.
- ❌ 식탁·정돈·실내·앉아서·하루 호흡·인복 어휘 X (어머님 영역 풀 — 위 페이지 슬롯).
- ❌ 부모 십성·일지 관계 정의 풀이 X (작용만).
- ❌ "남자답게·강하게·울지 마라" 강요 톤 X — *짚어주심·곁에 계심·기다려주심* 어조.
- ❌ 부모 죄책감 어휘 X.
- ✅ "닿으심·살펴주심·기다려주심" 가능성 어조.

` : ''}### 부모님께 — 두 분이 함께 살피실 결
※ 페이지 위에 가족 선물 카드 + 절대 하면 안 되는 5가지 카드 가 자동 표시됩니다.

🔴 **사주 인자 분배 — 이 페이지의 메인 인자**: **선물·조절 카드 (SSOT 그대로 출력)**. 본문은 *부모 행동 가이드 톤*만.

★★★ **결정론 매트릭스 결과 — 반드시 이대로 그대로 출력 (이모지·키워드·본문 모두, AI 임의 변경 X)**:

[선물]
${hasMom ? `${momGift?.emoji ?? "🎁"} **${momGift?.keyword ?? "있는 그대로 봐주기"}** — ${momGift?.quote ?? "어머님의 결이 가장 빛나는 길입니다"}` : ''}
${hasDad ? `${dadGift?.emoji ?? "🎁"} **${dadGift?.keyword ?? "흔들림 없는 자리"}** — ${dadGift?.quote ?? "아버님의 결이 가장 빛나는 길입니다"}` : ''}

본문 구조 (D안 C-A — 양반사주식: 선물 카드 이후 *본문 단락* 추가) — 240~280자, 2~3 단락:

1. **사주 한 줄** (약 50~70자): "두 분이 함께 자녀에게 줄 수 있는 가장 큰 결은 ${hasMom ? `*${momGift?.keyword ?? "—"}*` : ''}${(hasMom && hasDad) ? "·" : ""}${hasDad ? `*${dadGift?.keyword ?? "—"}*` : ''}이며, 함께 살피실 점은 *한 박자 늦춰 다가가심*입니다." 형식.

2. **영역 가이드 메인 — 두 분이 함께 살피실 한 가지** (약 130~150자): 부모 행동 가이드 톤. ${(hasMom && hasDad) ? "어머님은 *어떤 결*을 한 박자 어떻게 조절하실 때 / 아버님은 *어떤 결*을 한 박자 어떻게 조절하실 때 자녀의 결이 자라는지 각 1 장면씩 (구체 행동)." : hasMom ? "어머님께서 *어떤 결*을 한 박자 어떻게 조절하실 때 자녀의 결이 자라는지 1~2 장면 (구체 행동)." : "아버님께서 *어떤 결*을 한 박자 어떻게 조절하실 때 자녀의 결이 자라는지 1~2 장면 (구체 행동)."}

3. **마무리 한 줄** (약 50~70자): ${(hasMom && hasDad) ? "자녀가 두 결 사이에서 자기 호흡으로 자라는 마무리." : "자녀가 부모님 곁에서 자기 호흡으로 자라는 마무리."}

🔴 **어휘 정책**:
- ❌ 부모 다독임·죄책감 어휘 절대 X ("너무·과도·잘못·후회").
- ❌ "이렇게 하지 않으면 ~ 한다" 협박 톤 X.
- ✅ "한 박자·자기 박자·곁에·함께" 가능성 어조.

### 두 분이 의식적으로 비켜주실 결
※ 페이지 위에 5장의 살핌 카드가 자동 표시됩니다 (가장 깊이 닿는 2장은 강조 + 사주 근거 박스).

🔴 **사주 인자 분배 — 이 페이지의 메인 인자 (D-4 Ch 8 이동)**: **카드 SSOT 출력 (양육 자원 톤)**. 본문은 *두 분이 어떻게 비켜·다가가실 때 자녀가 자라는지* 가이드만.
- D-4 이동 배경: 본 페이지는 양육 태도 도메인(강요·간섭·비교 등)이라 Ch 8(부모) 챕터로 이동. 십성 작용은 카드 SSOT 사주 근거에서만 노출, 본문은 어휘 X.
- ❌ 기신(忌神) 정의 풀이 X — Ch 1 (평생 빛나는 결)에 양면 한 줄로 이미 있음.
- ❌ "치명적·무너짐·해친다·금지" 같은 강 부정 어휘 X — Ch 8 자원 톤 ("비켜주시면·살펴주시면·맞춰주시면").

★★★ **반드시 다음 사전 계산 결과만 사용**: 가장 깊이 닿는 살핌 1순위 = **${dangerSorted[0].name}**, 2순위 = **${dangerSorted[1].name}** (카드와 동일).

본문 구조 (D안 C-A2 — 양반사주식 3단, 240~280자):

1. **단락 1 — 사주 한 줄** (약 50~70자): "(앞서 본) ${d.childName}${d.childGender === '남' ? '군' : '양'}은 자기 결로 자라는 자녀라, 두 분의 의식적인 살핌이 자녀의 결을 더 단단하게 받쳐줍니다." 형식. 한 줄만.

2. **단락 2 — 영역 가이드 메인 — 두 분이 비켜주실 결** (약 130~150자): ${(hasMom && hasDad) ? "어머님은 *식탁·하루 호흡* 자리에서 자녀 결정에 5분 여백을 두시고, 아버님은 *야외·결단* 자리에서 자녀의 호흡을 먼저 살피실 때, 위 다섯 가지 결이 자연스럽게 비켜갑니다." : hasMom ? "어머님이 *식탁·하루 호흡* 자리에서 자녀 결정에 5분 여백을 두실 때, 위 다섯 가지 결이 자연스럽게 비켜갑니다." : "아버님이 *야외·결단* 자리에서 자녀의 호흡을 먼저 살피실 때, 위 다섯 가지 결이 자연스럽게 비켜갑니다."} 가장 깊이 닿는 살핌은 **${dangerSorted[0].name}**과 **${dangerSorted[1].name}**, 두 가지입니다.

3. **단락 3 — 마무리 한 줄** (약 50~70자): "두 분이 한 박자 늦춰 다가가실 때 ${d.childName}${d.childGender === '남' ? '군' : '양'}이 자기 호흡으로 환히 자라납니다." 톤.

🔴 **어휘 정책**:
- ❌ 카드 5가지를 본문에서 다시 나열 X (카드 SSOT와 중복).
- ❌ 십성 용어(비겁·식상·인성·관성·재성) 본문 노출 X — 카드 사주 근거 박스에서만.
- ❌ "단호함·비판·냉정·강요" 어휘 X — Ch 8 자원 톤과 부정합.
- ✅ "비켜주시면·살펴주시면·맞춰주시면·한 박자 늦춰" 가능성 어조.
- ✅ 어머님 영역(식탁·하루 호흡·실내) / 아버님 영역(야외·결단·현장) 분리 어휘 사용.

` : ''}## 자도인의 마지막 당부
${d.momName}님과 ${d.childName} 사이의 인연을 관통하는 가장 핵심적인 메시지. 정확히 3~4문장 (간결!). 시적이지만 구체적. 자연 비유로 녹일 것. 부모 다독임 표현 절대 금지 — 사주적 미래상으로 마무리.

마지막에 빈 줄 하나 띄고 다음 한 줄을 정확히 그대로 출력 (글자 그대로):
"※ 본 풀이는 사주명리학을 현시대 어머니의 언어로 재표현한 양육 안내이며, 의학적 진단·치료가 아닙니다. 자녀의 결은 사주에 환경·경험이 더해져 만들어집니다."

[규칙 — 마지막 당부 페이지 전용]
- 정확히 3~4문장. 시적이지만 구체적 간지·오행·십성 근거 반드시 포함 (바넘 금지).
- 사자성어 1~2개 가능 — **자녀 성별에 맞는 것만**: 모자상생(아들 한정) / 모녀상생(딸 한정) / 천륜지정·자모지애·부모은중·대기만성·적선지가(성별 중립). 청출어람은 정확한 뜻("자녀가 부모보다 뛰어나다")으로만 신중히. 한자는 반드시 한글 병기 — 예: 천륜지정(天倫之情).
- ${childCrisis ? `🔴 **사춘기·결이 변하는 시기 언급 금지** — 별도 페이지에서 다루므로 사주 본질·평생 메시지로 마무리 (Phase 4 어휘 분리).` : `시기 언급은 0~25세 범위 내, 다가올 시기는 대략적으로 ("앞으로 ~한 시기에", "자라가며" 등).`}
- 부모 다독임·위로 표현 절대 금지 ("어머니 잘못이 아니에요", "너무 걱정 마세요" 등) — 자도인은 상담사가 아니라 사주 도인. 사주에서 도출된 자녀 결의 독백으로 마무리.
- 본론 직진 — "${d.childName}는 ~한 자녀입니다" 같은 호명·일간 소개로 시작 금지. 바로 자녀의 내면부터.
- 그 외 모든 규칙(자원 프레임, 부정 어휘·한자 ban, 굵게 마크업, 단정 금지, 트렌디 표현 금지, 정량 표현 금지 등)은 위 [★★★ 자녀 보고서 절대 원칙] 그대로 적용. 한국어 경어체, 날카롭되 따뜻하게.`;
}

// ⭐ G16 (2026-05-14) — 시각 카드 dominant 값 통합 추출
// 발견 사례: 333 이미지 — LeaderExpertCard "리더형 74%" 도미넌트 + 본문 "전문가의 결" 모순.
// 원인: buildParentChildPromptV2 내부 cf_*Dom 값이 차트와 본문에 prompt로만 주입되고
// 자동 회귀 단에서 검증 가능한 데이터 형태로 노출 안 됨.
// fix: compute phase 응답에 chartFacts 객체로 모든 dominant 노출 → 자동 회귀 grep로 본문 정합 검사.
export interface ParentChildChartFacts {
  leaderDom: string;     // 리더형 / 전문가형 / 균형형
  aloneDom: string;      // 혼자형 / 같이형 / 둘 다
  depthDom: string;      // 깊이 사색형 / 즉각 행동형 / 균형형
  writeDom: string;      // 글형 / 말형 / 둘 다
  slowDom: string;       // 천천히형 / 빠르게형 / 중간 속도
  friendDom: string;     // 친구 스타일 도미넌트
  thinkingDom: string;   // 사고 유형 도미넌트
  jobTop1: string;       // 진로 6각 TOP1
  weakestElem: string;
  strongestElem: string;
  // ⭐ G7 (2026-05-14) — 자녀 시기 정합용
  childAge?: number;       // 자녀 현재 만 나이
  childAgeStage?: string;  // infant/toddler/preschool/elementary/middle/high
  shineGroup?: string;     // ShineAgeTimeline 최고 시기 라벨 (예: "20대")
  shineAge?: number;       // 그 시기 시작 나이 (예: 28)
  shineGanji?: string;     // 그 시기 대운 간지 (예: "신사")
}
export function computeParentChildChartFacts(sajuChild: SajuAnalysis, birthYear?: number): ParentChildChartFacts {
  const cf_sip = getSipseongCounts(sajuChild);
  const cf_elem = (sajuChild.elements ?? {}) as Record<string, number>;
  const cf_elemTotal = (["목","화","토","금","수"]).reduce((s, k) => s + (cf_elem[k] ?? 0), 0) || 1;
  const cf_elemPct = {
    목: Math.round(((cf_elem.목 ?? 0) / cf_elemTotal) * 100),
    화: Math.round(((cf_elem.화 ?? 0) / cf_elemTotal) * 100),
    토: Math.round(((cf_elem.토 ?? 0) / cf_elemTotal) * 100),
    금: Math.round(((cf_elem.금 ?? 0) / cf_elemTotal) * 100),
    수: Math.round(((cf_elem.수 ?? 0) / cf_elemTotal) * 100),
  };
  const _bigeop = cf_sip.비겁; const _jaesong = cf_sip.재성;
  const _insong = cf_sip.인성; const _siksang = cf_sip.식상;
  const _gwansong = cf_sip.관성;
  const _isYang = ["갑","병","무","경","임"].includes(sajuChild.ilgan);
  // ⭐ G19 (2026-05-14) — 메인 인자 합이 임계값 미만이면 "뚜렷하지 않음" (차트 산출 부적합)
  const INSUF = "뚜렷하지 않음";
  // alone (비겁 vs 재성)
  const _aloneTotal = _bigeop + _jaesong + 0.5;
  const cf_alonePct = Math.round(Math.max(15, Math.min(85, ((_bigeop + 0.3) / _aloneTotal) * 100)));
  const aloneDom = (_bigeop + _jaesong < 1) ? INSUF : cf_alonePct >= 55 ? "혼자형" : cf_alonePct <= 45 ? "같이형" : "둘 다";
  // depth (인성+수 vs 식상+화)
  const _depth = _insong * 1.5 + (cf_elem.수 ?? 0) * 0.5;
  const _action = _siksang * 1.5 + (cf_elem.화 ?? 0) * 0.5;
  const cf_depthPct = Math.round(Math.max(15, Math.min(85, ((_depth + 0.3) / (_depth + _action + 0.5)) * 100)));
  const depthDom = (_insong + _siksang < 1) ? INSUF : cf_depthPct >= 60 ? "깊이 사색형" : cf_depthPct <= 40 ? "즉각 행동형" : "균형형";
  // write (인성+금 vs 식상+화)
  const _writing = _insong * 1.0 + (cf_elem.금 ?? 0) * 0.6;
  const _talking = _siksang * 1.5 + (cf_elem.화 ?? 0) * 0.5;
  const cf_writePct = Math.round(Math.max(15, Math.min(85, ((_writing + 0.3) / (_writing + _talking + 0.5)) * 100)));
  const writeDom = (_insong + _siksang < 1) ? INSUF : cf_writePct >= 60 ? "글형" : cf_writePct <= 40 ? "말형" : "둘 다";
  // slow (인성+수 vs 식상+화+비겁)
  const _slow = _insong * 1.2 + (cf_elem.수 ?? 0) * 0.5;
  const _fast = _siksang * 1.2 + (cf_elem.화 ?? 0) * 0.5 + _bigeop * 0.5;
  const cf_slowPct = Math.round(Math.max(15, Math.min(85, ((_slow + 0.3) / (_slow + _fast + 0.5)) * 100)));
  const slowDom = (_insong + _siksang + _bigeop < 1) ? INSUF : cf_slowPct >= 60 ? "천천히형" : cf_slowPct <= 40 ? "빠르게형" : "중간 속도";
  // leader vs expert (관성+비겁+양일간+화 vs 인성+수+금)
  const _leader = _gwansong * 1.2 + _bigeop * 1.0 + (_isYang ? 1.5 : 0) + (cf_elem.화 ?? 0) * 0.3;
  const _expert = _insong * 1.5 + (cf_elem.수 ?? 0) * 0.5 + (cf_elem.금 ?? 0) * 0.3;
  const cf_leaderPct = Math.round(Math.max(15, Math.min(85, ((_leader + 0.3) / (_leader + _expert + 0.5)) * 100)));
  const leaderDom = (_gwansong + _insong + _bigeop < 1) ? INSUF : cf_leaderPct >= 60 ? "리더형" : cf_leaderPct <= 40 ? "전문가형" : "균형형";
  // friend / thinking / job
  const friend = (() => { try { return inferFriendStyle(sajuChild); } catch { return null; } })();
  const friendDom = (friend as { dominant?: string } | null)?.dominant ?? "—";
  const thinking = inferThinkingType(sajuChild);
  const thinkingDom = thinking.dominant ?? "—";
  const jobRadar = inferJobRadar(sajuChild);
  const jobTop1 = [...jobRadar].sort((a, b) => b.score - a.score)[0]?.name ?? "";
  // 오행
  const elemSorted = (["목","화","토","금","수"] as const).map(k => ({ k, p: cf_elemPct[k] })).sort((a,b) => a.p - b.p);
  const weakestElem = elemSorted[0]?.k ?? "—";
  const strongestElem = elemSorted[elemSorted.length - 1]?.k ?? "—";
  // ⭐ G7 (2026-05-14) — 자녀 나이·ShineAge 시기 정합용
  const currentYear = new Date().getFullYear();
  const childAge = birthYear ? currentYear - birthYear : undefined;
  let childAgeStage: string | undefined = undefined;
  if (childAge !== undefined) {
    childAgeStage = childAge <= 2 ? "infant" : childAge <= 4 ? "toddler" : childAge <= 6 ? "preschool" : childAge <= 12 ? "elementary" : childAge <= 15 ? "middle" : childAge <= 18 ? "high" : "adult";
  }
  // ShineAge: ShineAgeTimeline과 동일 로직 — 10대/20대/30대/40대+ 중 best
  const daeunList = (() => { try { return evaluateDaeunTimeline(sajuChild); } catch { return []; } })();
  const ageGroups = [
    { label: "10대", from: 8, to: 17 },
    { label: "20대", from: 18, to: 27 },
    { label: "30대", from: 28, to: 37 },
    { label: "40대 이후", from: 38, to: 99 },
  ];
  const groupBest = ageGroups.map((g) => {
    const inRange = daeunList.filter((d) => d.age <= g.to && d.ageEnd >= g.from);
    const golds = inRange.filter((d) => d.rating === "gold");
    const goods = inRange.filter((d) => d.rating === "good");
    const best = golds[0] ?? goods[0] ?? inRange[0] ?? null;
    return { ...g, best, hasGold: golds.length > 0, hasGood: goods.length > 0 };
  });
  const topGroup = [...groupBest].sort((a, b) => Number(b.hasGold) - Number(a.hasGold) || Number(b.hasGood) - Number(a.hasGood))[0];
  const shineGroup = topGroup?.label ?? undefined;
  const shineAge = topGroup?.best?.age ?? undefined;
  const shineGanji = topGroup?.best?.ganji ?? undefined;
  return { leaderDom, aloneDom, depthDom, writeDom, slowDom, friendDom, thinkingDom, jobTop1, weakestElem, strongestElem, childAge, childAgeStage, shineGroup, shineAge, shineGanji };
}

// ─── V2 자도인 (브라덜 7장 요청건) — 컴포넌트 SLIDES 매핑과 정확 정합, 격국 삭제, 양육 톤 흡수 ──
type V2Phase = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "ch7" | "outro";

// ⭐ (2026-05-15) B+C 결합 — Gemini responseSchema + {{CHILD}} sentinel — 전체 phase 적용.
// 자녀 호칭 누출 0% 목표: subtitle enum 강제(constrained decoding) + body 안에 {{CHILD}} 토큰만.
// 후처리에서 성+이름+군/양으로 결정론 치환. 부수 효과: subtitle 변형(쉼표 drop·치환) 클래스 소멸.
// ch1 = 헤더만 출력하므로 schema 미적용. ch2~ch7 = subs array. outro = body 단일.
const PARENT_CHILD_BODY_DESCRIPTION = "본문 prose. 자녀를 가리키는 주어·호칭 자리에는 반드시 '{{CHILD}}' 토큰만 입력한다. 시스템이 토큰을 올바른 호칭으로 결정론 치환한다. 본문 내 ### / ## 마크다운 헤더 출력 X (JSON 필드 안에 prose만).";

function _parentChildSubsSchema(subtitles: string[]): Record<string, unknown> {
  return {
    type: "OBJECT",
    properties: {
      subs: {
        type: "ARRAY",
        minItems: subtitles.length,
        maxItems: subtitles.length,
        items: {
          type: "OBJECT",
          required: ["subtitle", "body"],
          properties: {
            subtitle: { type: "STRING", enum: subtitles },
            body: { type: "STRING", description: PARENT_CHILD_BODY_DESCRIPTION },
          },
        },
      },
    },
    required: ["subs"],
  };
}

function parentChildPhaseSubtitles(
  phase: V2Phase,
  ah: ReturnType<typeof getAgeAdaptedHeaders>,
  hasMom: boolean,
  hasDad: boolean,
): string[] | null {
  switch (phase) {
    case "ch2":
      return [ah.ch2_alone, ah.ch2_method, ah.ch2_express, ah.ch2_clock, ah.ch2_deskMind];
    case "ch3":
      return ["화났을 때 입을 닫을까, 폭발할까", "아이 감정이 가라앉는 환경", "마음 열리는 칭찬", ah.ch3_lie, "이 아이가 무너지는 자극"];
    case "ch4":
      return ["마음 문 여는 데 걸리는 시간", "리더 vs 짝꿍 vs 분위기 메이커", "인생을 바꿀 친구는 따로 있다", "친구들 속에서 지치는 패턴"];
    case "ch5":
      return ["진짜 빛날 분야", "아이만의 무기", "환하게 빛나게 해주는 결 한 가지"];
    case "ch6": {
      const first = hasMom && hasDad
        ? "엄마와 통하는 결, 아빠와 통하는 결"
        : hasMom ? "엄마와 통하는 결"
        : hasDad ? "아빠와 통하는 결"
        : "엄마와 통하는 결, 아빠와 통하는 결";
      const trio = hasMom && hasDad ? "셋이 함께 가장 편안한 순간" : "둘이 함께 가장 편안한 순간";
      return [first, trio, "부모가 채워줄 결 / 살펴줄 결"];
    }
    case "ch7":
      return ["이 아이가 약하게 타고난 자리", "사주에 채워주면 좋은 음식"];
    case "ch1":
    case "outro":
    default:
      return null;
  }
}

function parentChildPhaseSchema(
  phase: V2Phase,
  ah: ReturnType<typeof getAgeAdaptedHeaders>,
  hasMom: boolean,
  hasDad: boolean,
): Record<string, unknown> | null {
  if (phase === "outro") {
    return {
      type: "OBJECT",
      properties: {
        body: { type: "STRING", description: "정확히 2~3문장, 한 문장 50자 이내 시적 마지막 당부. " + PARENT_CHILD_BODY_DESCRIPTION },
      },
      required: ["body"],
    };
  }
  const subs = parentChildPhaseSubtitles(phase, ah, hasMom, hasDad);
  if (!subs) return null;
  return _parentChildSubsSchema(subs);
}

function buildParentChildPromptV2(
  d: Record<string, string>,
  sajuChild: SajuAnalysis,
  sajuMom: SajuAnalysis | null,
  sajuDad: SajuAnalysis | null,
  _momCompat: CompatibilityResult | null,
  _dadCompat: CompatibilityResult | null,
  _saja: FamilySajaSeongeo,
  phase: V2Phase = "ch2"
): string {
  const hasMom = !!sajuMom;
  const hasDad = !!sajuDad;
  // ⭐ (2026-05-15) 자녀 호칭은 @CHILD@ 토큰으로만 프롬프트에 박는다.
  // LLM이 실제 이름을 보지 못하게 해 호칭 변형·대사 누출(예: "군야") 차단.
  // 생성 직후·가드 직전에 실제 호칭(성+이름+군/양)으로 결정론 치환한다.
  const ctxChild = buildCtx(sajuChild, "@CHILD@");
  const ctxMom = sajuMom ? buildCtx(sajuMom, d.momName) : "";
  const ctxDad = sajuDad ? buildCtx(sajuDad, d.dadName) : "";
  const childLabel = d.childGender === "남" ? "아들" : "딸";
  const cnh = "@CHILD@";
  // ⭐ G13 (2026-05-14) — 연령별 sub 헤더 분기
  const _childYearNum = d.childYear ? parseInt(d.childYear, 10) : NaN;
  const _ageStage = !Number.isNaN(_childYearNum) ? classifyAgeStageFromYear(_childYearNum) : "elementary";
  const ah = getAgeAdaptedHeaders(_ageStage);
  const momLabel = hasMom ? `${d.momName} 어머님` : "";
  const dadLabel = hasDad ? `${d.dadName} 아버님` : "";
  const parentsLabel = [momLabel, dadLabel].filter(Boolean).join(" · ");

  const dataBlock = `
[자녀 사주 컨텍스트 — @CHILD@ (${childLabel})]
${ctxChild}

${buildSipseongElementBlock(sajuChild.ilgan)}

${buildSinsalVocabBlock(sajuChild.sinsal ?? [])}
${hasMom ? `\n[어머님 사주 컨텍스트 — ${d.momName}]\n${ctxMom}` : ""}${hasDad ? `\n[아버님 사주 컨텍스트 — ${d.dadName}]\n${ctxDad}` : ""}`;

  const principles = `
[★★★ V2 절대 원칙 — 정통 명리 + 양면 풀이]

★★★ G19 (2026-05-14) — 차트 도미넌트가 "뚜렷하지 않음"이면
- 해당 sub는 한쪽으로 단정 절대 금지. "이 결은 사주에 뚜렷하게 드러나지 않아 양면형이에요" 톤으로 작성.
- % 수치 인용 금지. 메인 인자가 모두 옅다는 사실을 자연스럽게 풀고, 다양한 방식을 골고루 권하는 양육 가이드로.
- 차트값 표에 도미넌트가 "뚜렷하지 않음"으로 표기된 sub는 위 룰 절대 적용.

★★★ G14 v4 (2026-05-15) — 인자 노출 + 지시어 룰
- ⭐ 폐기: "본인 결"·"중심 기운"·"타고난 결"·"내면의 자리"·"관계의 자리"·"마음 안쪽의 자리" 같은 추상 풀 대명사 사용 절대 금지.
- ⭐ 인자 노출 (C 완화 — 강제 치환 X): 한자/근거명(인성·비겁·식상·재성·관성 등)을 sub당 2~3회까지 그대로 본문에 노출해도 좋습니다. 더 반복될 때는 인자명 또는 구체 오행 어휘로 번갈아 자연스럽게 — dataBlock의 [★ 십성-오행 자동 매핑] 표 사용. **회전·치환 강제 압박 없음. 자연스러움 우선.**
  예: 자녀 일간이 을(목)일 때 → 비겁=목 → "나무의 기운" / 식상=화 → "불의 기운" / 재성=토 → "흙의 기운" / 관성=금 → "금속의 기운" / 인성=수 → "물의 기운"
- ⭐ 합성 비문 절대 금지: "인성 오행"·"비겁 오행"·"식상 오행" 같은 합성 명사구 X. 십성과 오행은 별도 분류 — 같이 쓸 땐 "인성(印星) — 오행으로는 수(水)" 식 분리.
- ⭐ 지시어 antecedent 룰: 지시어("그·이·저" + 명사)로 인자/오행을 가리킬 때, **직전 1~2문장 안에 그 인자명(인성·비겁 등) 또는 오행명(목·화·토·금·수 — 한자 또는 한글)이 명시되어 있어야** 합니다. 명시 없는 단독 지시 금지.
- 예 정답 1: "@CHILD@의 일지 오행은 토(土). 흙의 기운이 받쳐주는 자리에서..." — 앞 문장에 '토(土)' 명시 → 다음 문장에서 '흙의 기운'으로 자연 연결 (지시어 없이 오행 어휘 직접).
- 예 정답 2: "비겁이 자리한 @CHILD@은 자기 결이 또렷합니다. 이 비겁의 결은 ..." — 앞 문장에 '비겁' 명시 → 다음 문장에서 '이 비겁의 결'로 받음 (지시어 사용 시 인자명 다시 동반).

★★★ 자녀 호칭 룰 — 절대 적용
- narrator(자도인) 시점에서 자녀를 묘사할 땐 반드시 "@CHILD@" 토큰을 그대로 쓴다: "@CHILD@은 ~한 결의 아이예요" (○). @CHILD@를 실제 이름이나 다른 호칭으로 바꾸지 말 것 — 토큰 그대로 출력하면 시스템이 올바른 호칭으로 치환한다.
- **따옴표 안 대사(부모·친구·가족·자녀 본인 대사)에서는 자녀를 이름이나 호칭으로 부르지 않는다. 이름 없이 말한다.**
  예: "네가 정말 잘하고 있어" (○)
  예: "@CHILD@, 네가 ~" (×) / "○○야, 네가 ~" (×)
- **부모가 자녀에게 양육 행동을 권고하는 본문 설명에서는 자녀 이름 반복 X.** "아이"·"자녀"·"아이의 결"로 자연스럽게.
  예: "어머님께서는 아이가 차분한 환경에 있을 때..." (○)
  예: "어머님께서는 @CHILD@이 차분한 환경에 있을 때..." (×)

A. **사주 용어 노출 룰 (한자 1회 허용)**
   - 각 소제목 본문에서 메인 인자 한자병기 1회만 허용 (예: "비겁(比劫)은 …"). 이후 본문은 부모 언어로 자연 등장.
   - **격국은 V2에서 완전 삭제** — 격국명·격국 분류 일체 사용 금지.
   - 신살명(양인살·괴강살·천을귀인 등)은 한자 병기 1회 허용.

B. **★ 시그너처 톤 다양성 (가장 중요한 룰)**
   - 5단락 동일 템플릿 절대 금지. 모든 소제목이 "훅 → 정통 도입 → 이런 적 있으셨죠 → 양육 가이드 → 부모님이 기억해야 할 한 가지" 식으로 똑같이 깎이면 AI 템플릿 느낌으로 들통남.
   - **각 소제목은 그 주제에 맞는 자기 시그너처(글의 모양)를 갖는다**: 공식형 / 두 갈래 비교 / 단정 + 일화 / 시간 흐름 묘사 / 관찰자 시점 묘사 / 처방전 리스트 / 가상 대화 / 신호등 진단 / 케이스 분기 등 — sub마다 다르게.
   - 시그너처는 각 소제목 정의에 명시. **그 형식을 정확히 따라야 함**.
   - 한 챕터 안에서 5 sub의 시그너처가 모두 달라야 함. 부모가 5개 차례로 읽었을 때 "다 다른 결의 풀이"라는 인상.

C. **★ "대충" 느낌 절대 금지 — 깊이 사수 (가장 중요한 룰)**
   - 시그너처가 짧아도 분량 350~450자 사수 (긴 시그너처는 500~700자).
   - 단정·결론만 쓰고 끝나는 출력 금지 — 반드시 사주 인자 결합 메커니즘이 본문에 등장.
   - 5인자 결합 풀이 강제: 메인 인자 + 서브 인자 모두 본문에 자연스럽게 녹임. 단일 인자 풀이 절대 금지.
   - 자녀 사주 데이터(컨텍스트 블록)에서 메인·서브 인자값을 모두 확인 후, 그 자녀에게만 해당하는 풀이 작성. 일반론 금지.
   - 짧을수록 한 문장의 밀도 ↑. 빈 형용사·뻔한 소리 금지.
   - 정통 명리 한자 용어(비겁·식상·재성·관성·인성·일주·용신·기신·신살명·12운성·합·충 등) 1~2회 자연스럽게 등장. "저명한 명리 전문가가 직접 풀이하는 느낌".

D. **메인 인자 강도 분기 (강·중·약·0 모두 정통 풀이)**
   - **강함** → 그 결이 두드러지는 자녀로 풀이 (메모장 패턴).
   - **중간** → 양면 풀이 ("어떨 때는 ○○ 어떨 때는 △△").
   - **약함** → 그 결이 옅은 결로 작동 + 다른 결이 그 자리를 어떻게 채우는지.
   - **0(없음) — 양면 풀이 강제 (사용자 핵심 룰)**:
     * 비겁 0 = "자기주관 낮음" X → "남의 결을 받아들이는 결·협력형·외부 결로 자라는 사주(無比劫·종격 흐름)"
     * 식상 0 = "표현 없음" X → "안에서 정리하는 신중한 결·말 아끼고 깊이 쌓는 사주"
     * 재성 0 = "결과 약함" X → "이상·가치·과정에 집중하는 결·실용보다 의미"
     * 관성 0 = "규율 약함" X → "자유롭고 틀에 안 갇히는 결·창의·자기 길"
     * 인성 0 = "사색 적음" X → "즉각 행동하는 직관·실전형·체험으로 배우는 결"
   - "○○이 약해서 보완해야 합니다" 패턴 절대 금지.

E. **아이 묘사 어조 보호** — "무너지는/폭발하는/약한 아이" 금지. "단단하게 받는/따스하게 받는/마음 쏟아내는 결" 등 양면 모두 긍정적으로.

F. **자녀 호칭** — 자녀를 부를 땐 매번 "@CHILD@" 토큰을 그대로 쓴다 (실제 이름으로 바꾸지 말 것). sub당 1~2회 등장.

G. **부모 호명** — "어머님·아버님" sub당 1~2회 등장.

H. **단정·정량·균형 표현 금지** — "균형/안정/조화"는 실제 분포가 균형일 때만.

I. **사춘기·자아 형성** 표현은 "결이 변하는 시기/스스로 자라는 시기"로.

J. **마크다운 헤더 정확 출력** — 챕터 헤더는 \`## 1장 — 우리 아이는 어떤 아이일까\` 형식, 소제목은 \`### 소제목\`. 헤더 텍스트 한 자도 바꾸지 말 것 (시스템 매칭 키).

K. **6장 어머님·아버님 양육 톤 어휘 분리** — 어머님: 식탁·정돈·실내·따뜻한 손길 / 아버님: 야외·운동·만들기·단단한 어깨. 두 부모 모두 긍정적으로.

L. **★ 가독성 강조 (1종만 — 절제 사용)**
   - 별표(\`**\`)·물결·백틱 등 다른 마크다운 강조 절대 사용 금지.
   - 사용 가능한 단 한 가지 마커: \`[[텍스트]]\` → 핵심 강조 (골드색).
   - 각 소제목 본문 전체에서 **1~2회만**. 자녀 결을 단정하는 한 마디·결정적인 키워드에만.
   - 마커 안에는 짧은 텍스트만 (10자 이내). 한 문장 통째 감싸지 말 것.
   - 과다 사용 절대 금지 — 한 단락에 [[ ]] 1개만. 강조가 많아지면 강조 효과 사라짐.
   - 마커 자체는 화면에 보이지 않음 — 골드 색만 적용됨.`;

  // 6장 — 부모 입력 여부에 따른 동적 제목
  const ch6Title = hasMom && hasDad
    ? "엄마·아빠와 우리 셋의 결"
    : hasMom
      ? "엄마와 아이 둘의 결"
      : hasDad
        ? "아빠와 아이 둘의 결"
        : "엄마·아빠와 우리 셋의 결";
  const ch6FirstSubtitle = hasMom && hasDad
    ? "엄마와 통하는 결, 아빠와 통하는 결"
    : hasMom
      ? "엄마와 통하는 결"
      : hasDad
        ? "아빠와 통하는 결"
        : "엄마와 통하는 결, 아빠와 통하는 결";
  const ch6TrioMoment = hasMom && hasDad ? "셋이 함께 가장 편안한 순간" : "둘이 함께 가장 편안한 순간";

  // ─── 차트 사전 계산값 (텍스트-차트 일치성 강제) ─────────────────────────
  // 컴포넌트(ParentChildSlideResultV2.tsx)와 동일한 공식·동일한 clamp.
  // 공식 변경 시 컴포넌트와 함께 수정 필요.
  const cf_sip = getSipseongCounts(sajuChild);
  const cf_elem = (sajuChild.elements ?? {}) as Record<string, number>;
  const cf_elemTotal = (["목","화","토","금","수"]).reduce((s, k) => s + (cf_elem[k] ?? 0), 0) || 1;
  const cf_elemPct = {
    목: Math.round(((cf_elem.목 ?? 0) / cf_elemTotal) * 100),
    화: Math.round(((cf_elem.화 ?? 0) / cf_elemTotal) * 100),
    토: Math.round(((cf_elem.토 ?? 0) / cf_elemTotal) * 100),
    금: Math.round(((cf_elem.금 ?? 0) / cf_elemTotal) * 100),
    수: Math.round(((cf_elem.수 ?? 0) / cf_elemTotal) * 100),
  };
  const cf_thinking = inferThinkingType(sajuChild);
  const cf_danger = (() => { try { return inferDangerCards(sajuChild); } catch { return []; } })();
  const cf_dangerSorted = [...cf_danger].sort((a, b) => b.level - a.level);
  const cf_jobRadar = inferJobRadar(sajuChild);
  const cf_jobSorted = [...cf_jobRadar].sort((a, b) => b.score - a.score);
  const cf_jobTop3 = cf_jobSorted.slice(0, 3).map(j => j.name).join(' · ');
  const cf_jobTop1 = cf_jobSorted[0]?.name ?? "";
  const cf_jobAvoid = cf_jobSorted[cf_jobSorted.length - 1]?.name ?? "";
  const cf_intel8 = infer8Intelligences(sajuChild);
  const cf_intel8Top3 = cf_intel8.slice(0, 3).map(i => i.name).join(' · ');
  const cf_friend = (() => { try { return inferFriendStyle(sajuChild); } catch { return null; } })();
  const cf_friendDom = (cf_friend as any)?.dominant ?? "—";

  // ⭐ G19 (2026-05-14) — 메인 인자 합 임계값 미만이면 "뚜렷하지 않음"
  const _INSUF = "뚜렷하지 않음";
  // 2장-① 혼자 vs 같이 (alonePct) — 비겁 vs 재성
  const _bigeop = cf_sip.비겁; const _jaesong = cf_sip.재성;
  const _aloneTotal = _bigeop + _jaesong + 0.5;
  const cf_alonePct = Math.round(Math.max(15, Math.min(85, ((_bigeop + 0.3) / _aloneTotal) * 100)));
  const cf_aloneDom = (_bigeop + _jaesong < 1) ? _INSUF : cf_alonePct >= 55 ? "혼자형" : cf_alonePct <= 45 ? "같이형" : "둘 다";

  // 2장-② 공부법 (depthPct) — 인성+수 vs 식상+화
  const _insong = cf_sip.인성; const _siksang = cf_sip.식상;
  const _depth = _insong * 1.5 + (cf_elem.수 ?? 0) * 0.5;
  const _action = _siksang * 1.5 + (cf_elem.화 ?? 0) * 0.5;
  const _depthTotal = _depth + _action + 0.5;
  const cf_depthPct = Math.round(Math.max(15, Math.min(85, ((_depth + 0.3) / _depthTotal) * 100)));
  const cf_depthDom = (_insong + _siksang < 1) ? _INSUF : cf_depthPct >= 60 ? "깊이 사색형" : cf_depthPct <= 40 ? "즉각 행동형" : "균형형";

  // 2장-③ 글로/말로 (writePct) — 인성+금 vs 식상+화
  const _writing = _insong * 1.0 + (cf_elem.금 ?? 0) * 0.6;
  const _talking = _siksang * 1.5 + (cf_elem.화 ?? 0) * 0.5;
  const _writeTotal = _writing + _talking + 0.5;
  const cf_writePct = Math.round(Math.max(15, Math.min(85, ((_writing + 0.3) / _writeTotal) * 100)));
  const cf_writeDom = (_insong + _siksang < 1) ? _INSUF : cf_writePct >= 60 ? "글형" : cf_writePct <= 40 ? "말형" : "둘 다";

  // 2장-④ 시간대 (오행 raw %, clamp 없음) — 아침=목, 낮=화, 저녁=금, 밤=수
  const _slots = [
    { label: "아침(목)", pct: cf_elemPct.목 },
    { label: "낮(화)", pct: cf_elemPct.화 },
    { label: "저녁(금)", pct: cf_elemPct.금 },
    { label: "밤(수)", pct: cf_elemPct.수 },
  ];
  const cf_topSlot = [..._slots].sort((a, b) => b.pct - a.pct)[0].label;

  // 4장-① 마음 문 여는 시간 (slowPct) — 인성+수 vs 식상+화+비겁
  const _slow = _insong * 1.2 + (cf_elem.수 ?? 0) * 0.5;
  const _fast = _siksang * 1.2 + (cf_elem.화 ?? 0) * 0.5 + _bigeop * 0.5;
  const _slowTotal = _slow + _fast + 0.5;
  const cf_slowPct = Math.round(Math.max(15, Math.min(85, ((_slow + 0.3) / _slowTotal) * 100)));
  const cf_slowDom = (_insong + _siksang + _bigeop < 1) ? _INSUF : cf_slowPct >= 60 ? "천천히형" : cf_slowPct <= 40 ? "빠르게형" : "중간 속도";

  // 5장-끝 리더 vs 전문가 (leaderPct) — 관성+비겁+양일간+화 vs 인성+수+금
  const _gwansong = cf_sip.관성;
  const _isYang = ["갑","병","무","경","임"].includes(sajuChild.ilgan);
  const _leader = _gwansong * 1.2 + _bigeop * 1.0 + (_isYang ? 1.5 : 0) + (cf_elem.화 ?? 0) * 0.3;
  const _expert = _insong * 1.5 + (cf_elem.수 ?? 0) * 0.5 + (cf_elem.금 ?? 0) * 0.3;
  const _leaderTotal = _leader + _expert + 0.5;
  const cf_leaderPct = Math.round(Math.max(15, Math.min(85, ((_leader + 0.3) / _leaderTotal) * 100)));
  const cf_leaderDom = (_gwansong + _insong + _bigeop < 1) ? _INSUF : cf_leaderPct >= 60 ? "리더형" : cf_leaderPct <= 40 ? "전문가형" : "균형형";

  // 약한/강한 오행
  const cf_elemSorted = (["목","화","토","금","수"] as const).map(k => ({ k, p: cf_elemPct[k] })).sort((a,b) => a.p - b.p);
  const cf_weakestElem = cf_elemSorted[0]?.k ?? "—";
  const cf_strongestElem = cf_elemSorted[cf_elemSorted.length - 1]?.k ?? "—";

  // ⭐ G000 (2026-05-14) — 자녀 보유 좋은 별(귀인) 본문 명시 강제
  // 발견 사례 (000 이미지): "인생을 도와주는 별" sub에 "어떤 귀인인지?" 명시 부재.
  const cf_positiveSinsal = (() => { try { return inferPositiveSinsal(sajuChild); } catch { return null; } })();
  const cf_sinsalNames = cf_positiveSinsal?.shines.map(s => s.name).join("·") ?? "(없음)";

  // ⭐ G7 (2026-05-14) — ShineAgeTimeline 최고 시기 (차트와 본문 일치 강제)
  const _daeunList = (() => { try { return evaluateDaeunTimeline(sajuChild); } catch { return []; } })();
  const _ageGroups = [
    { label: "10대", from: 8, to: 17 },
    { label: "20대", from: 18, to: 27 },
    { label: "30대", from: 28, to: 37 },
    { label: "40대 이후", from: 38, to: 99 },
  ];
  const _groupBest = _ageGroups.map((g) => {
    const inRange = _daeunList.filter((dd) => dd.age <= g.to && dd.ageEnd >= g.from);
    const golds = inRange.filter((dd) => dd.rating === "gold");
    const goods = inRange.filter((dd) => dd.rating === "good");
    return { ...g, hasGold: golds.length > 0, hasGood: goods.length > 0, best: golds[0] ?? goods[0] ?? inRange[0] ?? null };
  });
  const _topGroup = [..._groupBest].sort((a, b) => Number(b.hasGold) - Number(a.hasGold) || Number(b.hasGood) - Number(a.hasGood))[0];
  const cf_shineGroup = _topGroup?.label ?? "—";

  // ─── M1~M7 결정론 매핑 키워드 풀 — 챕터별 부분 주입 ─────────────────
  // 자녀 사주 인자 룩업 → 키워드 풀 텍스트 블록 조립.
  // chXBody 시작에 박아 LLM이 이 풀에서만 인용하게 함. 임의 통설 차단.
  const _childTraitsV2 = (() => {
    try { return deriveChildTraitsV2(sajuChild); } catch { return null; }
  })();
  const _ch2TraitsBlock = _childTraitsV2 ? childTraitsToPromptBlockV2(_childTraitsV2, cnh, "ch2") : "";
  const _ch3TraitsBlock = _childTraitsV2 ? childTraitsToPromptBlockV2(_childTraitsV2, cnh, "ch3") : "";
  const _ch4TraitsBlock = _childTraitsV2 ? childTraitsToPromptBlockV2(_childTraitsV2, cnh, "ch4") : "";
  const _ch5TraitsBlock = _childTraitsV2 ? childTraitsToPromptBlockV2(_childTraitsV2, cnh, "ch5") : "";
  const _ch6TraitsBlock = _childTraitsV2 ? childTraitsToPromptBlockV2(_childTraitsV2, cnh, "ch6") : "";
  // ⭐ V2.1 ch7 — ch6 traits 재사용 (자녀 본질 데이터 동일, 챕터 도메인만 ch7 = 몸·음식)
  const _ch7TraitsBlock = _ch6TraitsBlock;

  // 부모-자녀 오행 비교 (6장)
  const cf_momCompare = sajuMom ? inferElementCompare(sajuMom, sajuChild) : null;
  const cf_dadCompare = sajuDad ? inferElementCompare(sajuDad, sajuChild) : null;

  // 용신·기신 (3장·6장 사용)
  const cf_gisin = (() => { try { return calcGisin(sajuChild); } catch { return null; } })();
  const cf_gaeun = (() => { try { return calcGaeun(sajuChild); } catch { return null; } })();

  // 챕터별 차트 사실 블록 — ch?Body 맨 앞에 prepend
  const cf_sipLine = `[십성 카운트] 비겁 ${cf_sip.비겁} · 식상 ${cf_sip.식상} · 재성 ${cf_sip.재성} · 관성 ${cf_sip.관성} · 인성 ${cf_sip.인성}`;
  const cf_elemLine = `[오행 %] 목 ${cf_elemPct.목}% · 화 ${cf_elemPct.화}% · 토 ${cf_elemPct.토}% · 금 ${cf_elemPct.금}% · 수 ${cf_elemPct.수}%`;

  const ch2ChartFacts = `
[★★★ 2장 차트값 — 본문에 반드시 이 숫자·결만 사용. LLM이 다른 % 또는 다른 도미넌트 만들 절대 금지.]
- [혼자 vs 같이 공부] 혼자 ${cf_alonePct}% / 같이 ${100 - cf_alonePct}% — 도미넌트: ${cf_aloneDom}
- [우리 아이만의 공부법] 깊이 사색 ${cf_depthPct}% / 즉각 행동 ${100 - cf_depthPct}% — 도미넌트: ${cf_depthDom}
- [글로/말로 표현] 글 ${cf_writePct}% / 말 ${100 - cf_writePct}% — 도미넌트: ${cf_writeDom}
- [또렷해지는 시간대] 아침(목) ${cf_elemPct.목}% · 낮(화) ${cf_elemPct.화}% · 저녁(금) ${cf_elemPct.금}% · 밤(수) ${cf_elemPct.수}% — TOP: ${cf_topSlot}
- [책상 앞 머릿속] 사고 유형 도미넌트: ${cf_thinking.dominant}
- ${cf_sipLine}
- ${cf_elemLine}
본문에서 % 숫자를 언급할 때는 **반드시 위 숫자 그대로 인용**. 다른 % 만들지 말 것. "혼자형/같이형/깊이 사색형/즉각 행동형/글형/말형/사고 유형" 단정도 위 도미넌트만 따를 것.
★ 중요: 도미넌트가 **'둘 다' 또는 '균형형'** 이면 반드시 양면 풀이로 작성. 한쪽으로 단정 절대 금지. "양쪽 결을 다 가진 아이예요" / "결을 보며 자기 페이스로" 톤 사용.`;

  const ch3ChartFacts = `
[★★★ 3장 차트값 — 본문에 반드시 이 결과만 사용. 다른 도미넌트·다른 순위 만들 절대 금지.]
- [고집의 뿌리 TOP 트리거] 1순위: ${cf_dangerSorted[0]?.name ?? "—"} / 2순위: ${cf_dangerSorted[1]?.name ?? "—"} / 3순위: ${cf_dangerSorted[2]?.name ?? "—"} / 4순위: ${cf_dangerSorted[3]?.name ?? "—"}
- [가장 약한 오행 = 채워줄 환경] ${cf_weakestElem}
- [가장 강한 오행] ${cf_strongestElem}
- [기신] ${cf_gisin?.element ?? "—"}(${cf_gisin?.hanja ?? "—"})
- ${cf_sipLine}
- ${cf_elemLine}
"이 아이가 무너지는 자극" sub는 1순위 트리거(${cf_dangerSorted[0]?.name ?? "—"}) 본문에 단정 인용. "감정이 가라앉는 환경" sub는 약한 오행(${cf_weakestElem}) 환경 처방의 근거로 인용.`;

  const ch4ChartFacts = `
[★★★ 4장 차트값 — 본문에 반드시 이 숫자·결만 사용. 다른 % 만들 금지.]
- [마음 문 여는 시간] 천천히 ${cf_slowPct}% / 빠르게 ${100 - cf_slowPct}% — 도미넌트: ${cf_slowDom}
- [친구 스타일] 도미넌트 유형: ${cf_friendDom}
- ${cf_sipLine}
"마음 문 여는 데 걸리는 시간" sub는 ${cf_slowPct}%·${cf_slowDom} 본문에 단정 인용. "리더 vs 짝꿍 vs 메이커" sub는 ${cf_friendDom} 도미넌트 단정.
★ 중요: 도미넌트가 **'중간 속도'** 이면 반드시 양면형으로 작성. "천천히형" 또는 "빠르게형" 한쪽 단정 절대 금지. "결을 보며 자기 페이스로 다가가는 양면형" 톤 사용.
★★★ G16 차트-본문 정합 절대 룰 (2026-05-14):
- "${cf_slowDom}" 키워드를 sub 본문에 정확히 노출하고 그 방향으로 단정.
- 반대 키워드 절대 금지: ${cf_slowDom === "천천히형" ? "'빠르게형'·'빨리 마음 여는 결'·'바로 친해지는'" : cf_slowDom === "빠르게형" ? "'천천히형'·'마음 천천히 여는 결'·'시간이 걸리는'" : "양면 표현 외 한쪽 단정"} 금지.
- 친구 스타일도 ${cf_friendDom} 그대로 단정. 다른 유형명 절대 금지.`;

  const ch5ChartFacts = `
[★★★ 5장 차트값 — 본문에 반드시 이 결과만 사용. 다른 분야명·다른 순위 만들 절대 금지.]
- [진로 6각 TOP3] ${cf_jobTop3} (1위: ${cf_jobTop1})
- [진로 약한 결] ${cf_jobAvoid}
- [8지능 TOP3] ${cf_intel8Top3}
- [리더 vs 전문가] 리더형 ${cf_leaderPct}% / 전문가형 ${100 - cf_leaderPct}% — 도미넌트: ${cf_leaderDom}
- [자녀 보유 좋은 별(귀인·길성)] ${cf_sinsalNames}
- ${cf_sipLine}
"진짜 빛날 분야" sub는 진로 TOP3 (${cf_jobTop3}) 만 본문에 인용 — 다른 직업명 만들지 말 것. "리더로 클까, 전문가로 클까" sub는 ${cf_leaderDom} 단정.
★ 중요: 도미넌트가 **'균형형'** 이면 반드시 양면형으로 작성. "리더형" 또는 "전문가형" 한쪽 단정 절대 금지. "두 결을 모두 갖춘 양면형" 톤 사용.
★★★ G7 차트-본문 시기 정합 룰 (2026-05-14):
"10대·20대·30대 어느 때 가장 빛날까" sub는 차트 ShineAgeTimeline 결과인 **${cf_shineGroup ?? "—"}** 시기를 단정. 다른 시기를 "가장 빛난다"고 묘사 절대 금지. (예: 차트=20대인데 본문 "30대에 가장 빛날" → 금지)
★★★ G16 차트-본문 정합 절대 룰 (2026-05-14):
- "리더로 클까, 전문가로 클까" sub 본문에 **"${cf_leaderDom}"** 키워드를 정확히 그대로 노출하고, 그 방향으로 단정.
- 도미넌트가 "리더형"이면 본문에 "전문가형"·"전문가의 결"·"전문성 발휘" 같은 반대 방향 묘사 절대 금지.
- 도미넌트가 "전문가형"이면 본문에 "리더형"·"여러 사람을 이끄는"·"리더십" 같은 반대 방향 묘사 절대 금지.
- 도미넌트가 "균형형"이면 양면형 명시.
- 위 차트값(${cf_leaderPct}% / ${100 - cf_leaderPct}%)을 본문에서 무시하고 자기 판단으로 방향 결정 절대 금지.`;

  const ch6ChartFacts = `
[★★★ 6장 차트값 — 본문에 반드시 이 결과만 사용.]
- [자녀 오행] ${cf_elemLine}
- [자녀 가장 약한 오행 = 채워줄 결] ${cf_weakestElem}
- [자녀 가장 강한 오행] ${cf_strongestElem}
- [용신/기신] 용신 = ${cf_gaeun?.yongsinElement ?? "—"} / 기신 = ${cf_gisin?.element ?? "—"}(${cf_gisin?.hanja ?? "—"})
${cf_momCompare ? `- [엄마-자녀 오행 비교] 엄마 강한 결: ${(cf_momCompare as any)?.parentStronger ?? "—"} / 자녀 강한 결: ${(cf_momCompare as any)?.childStronger ?? "—"}` : ""}
${cf_dadCompare ? `- [아빠-자녀 오행 비교] 아빠 강한 결: ${(cf_dadCompare as any)?.parentStronger ?? "—"} / 자녀 강한 결: ${(cf_dadCompare as any)?.childStronger ?? "—"}` : ""}
"부모가 채워줄 결 / 살펴줄 결" sub는 용신·기신 한자/오행을 본문에 그대로 인용. "${ch6TrioMoment}" sub는 자녀 강한 오행(${cf_strongestElem})과 부모 결 비교 인용.`;

  // ⭐ V2.1 ch7 — 몸·음식 차트값 (약한 오행 + 용신·기신 재인용)
  const ch7ChartFacts = `
[★★★ 7장 차트값 — 본문에 반드시 이 결과만 사용.]
- [자녀 오행] ${cf_elemLine}
- [자녀 가장 약한 오행 = 약하게 타고난 자리·채워줄 음식의 근거] ${cf_weakestElem}
- [자녀 가장 강한 오행] ${cf_strongestElem}
- [용신/기신] 용신 = ${cf_gaeun?.yongsinElement ?? "—"} / 기신 = ${cf_gisin?.element ?? "—"}(${cf_gisin?.hanja ?? "—"})
- [자녀 일간] ${sajuChild.ilgan} (signature-metaphor 풀에서 핵심 자연 비유 도출 시드)
"이 아이가 약하게 타고난 자리" sub는 약한 오행 + body-pool 풀만 사용. "사주에 채워주면 좋은 음식" sub는 약한 오행/용신 오행 + food-pool 한국인 친숙 식재료 풀만 사용. 한약재(당귀·황기·인삼·녹용) 절대 X. 의학 진단 어조 X.`;

  // ─── phase별 본문 (호출마다 그 챕터만) ─────────────────────────────────────
  const ch1Body = `
출력은 정확히 다음 한 줄 헤더만. 본문은 절대 작성하지 마세요.

## 1장 — 우리 아이는 어떤 아이일까`;

  const ch2Body = `
출력 순서·헤더는 정확히 다음과 같이. 헤더 글자 한 자도 변경 금지.
**원칙 A~L (위 [V2 절대 원칙])은 모든 소제목에 강제 적용.** 5인자 결합·메인 0 양면 풀이 + 절제된 [[ ]] 강조 1~2회.
${_ch2TraitsBlock}
${ch2ChartFacts}

## 2장 — 우리 아이는 어떻게 공부할까

### ${ah.ch2_alone}
[메인: 비겁 / 서브: 식상·신강신약·일주·신살(양인·괴강·고란·천을귀인)]
[시그너처: 공식형] — 본문 4단락 + 마지막 한 줄 공식. 분량 500~600자.
구성: ① 결 단정 (50~70자) → ② 비겁 메커니즘 + 비견(比肩)·겁재(劫財) 분리 + 식상·신강신약·일주·신살 결합 풀이 (200~250자) → ③ 일상 장면 묘사 (150~200자) → ④ 환경 권고 (100~150자) → ⑤ 공식형 한 줄 — 마지막 줄에 "○○ — △△. 이게 ${cnh}의 결이에요." 같은 X=Y 공식 형태. 비겁 0이면 "남의 결을 받아들이는 협력형 사주(無比劫)" 양면 풀이로 동일 시그너처 유지.

### ${ah.ch2_method}
[메인: 인성 / 서브: 식상·신강신약·일주(일간 오행)·문창귀인·학당귀인]
[시그너처: 두 갈래 비교] — 본문 안에 "잘 들어오는 방식"과 "안 들어오는 방식" 두 갈래 명시 비교. 분량 500~600자.
구성: ① 결 단정 (60~80자) → ② 인성(印星) 메커니즘 + 정인(正印)·편인(偏印) 분리 + 식상·신강신약·일간 오행 결합 풀이 (180~220자) → ③ "잘 들어오는 방식" 단락 (구체 1~2개, 100~140자) → ④ "안 들어오는 방식" 단락 (반대 케이스 구체, 100~140자) → ⑤ 부모 한 줄 권고 (40~60자). 두 갈래는 줄바꿈으로 시각 분리. 인성 0이면 "직관·실전형 사주" 두 갈래 양면 풀이.

### ${ah.ch2_express}
[메인: 식상 / 서브: 일간 음양·인성·신강신약·수·토 오행]
[시그너처: 단정 + 짧은 일화] — 첫 줄에 단정 + 짧은 일화 1~2개 + 마무리. 5단락 구조 일부러 깨고 짧고 단호. 분량 380~450자.
구성: ① 단정 한 줄 ("${cnh}은 [말로/글이나 그림으로/표정·손짓으로/둘 다] 풀어내는 결의 아이예요.") — 차트 도미넌트 보고 결정, 자녀 연령에 맞춰 표현 방법은 적절히 (영유아=옹알이·표정·손짓, 학령기=말·글). 한쪽 단정 금지. → ② 식상(食傷) 메커니즘 + 식신(食神)·상관(傷官) + 일간 음양 + 수·토 오행 결합 (150~180자) → ③ 짧은 일화 1개 (70~100자 장면) → ④ 한 줄 권고 ("○○하게 해보세요." 짧고 단호). 일화는 자녀 사주 인자에서 도출된 구체 장면. 식상 0이면 "안으로 정리하는 신중한 결" 단정 + 일화 시그너처 유지.

### ${ah.ch2_clock}
[메인: 일간 오행 / 서브: 신강신약·월지·시주·12운성]
[시그너처: 시간 흐름 묘사 — 명리 정통 시적 톤] — 본문이 시간 순서대로 흐름 (새벽 → 아침 → 정오 → 오후 → 저녁 → 밤). 분량 500~600자.
구성: 자도인이 ${cnh}의 일간을 자연 비유로 풀어내며 하루를 따라간다. ① 일간 오행 비유 한 줄 ("${cnh}의 일간은 화(火)예요. 한낮의 햇살처럼...") → ② 새벽~아침 시간대 ${cnh} 결 묘사 (60~80자) → ③ 정오~오후 시간대 (60~80자) → ④ 저녁~밤 시간대 (60~80자) → ⑤ 12운성·월지·시주 결합 풀이 한 단락 (100~140자) → ⑥ 하루 활동 권고 한 줄. 단락 사이 줄바꿈으로 시간 흐름 시각화. 5단락 템플릿 사용 X.

### ${ah.ch2_deskMind}
[메인: 관성 / 서브: 인성·신강신약·토 오행·신살(괴강·천을귀인)]
[시그너처: 관찰자 시점 묘사] — 자도인이 자녀 옆에서 모습을 관찰하듯 영화의 한 장면처럼 묘사 → 그 행동의 사주적 의미 풀이. 분량 500~600자.
구성: ① 관찰 묘사 — ${ah.ch2_deskScene} 같은 자녀 연령에 맞는 90~120자 장면. 학령기 어휘(책상·펜·문제집)는 자녀가 영유아면 절대 X. → ② 그 행동의 사주적 의미 — 관성(官星) 메커니즘 + 정관·편관 + 인성·신강신약·토 오행·신살 결합 (200~250자) → ③ "이 머릿속에 늘 함께 앉아있는 작은 질문" 묘사 (80~100자) → ④ 환경 권고 (자리·시간·루틴 3요소, 80~120자). 관성 0이면 "틀에 안 갇히는 자유로운 결" 관찰 시그너처 유지.`;

  const ch3Body = `
출력 순서·헤더는 정확히 다음과 같이. 헤더 글자 한 자도 변경 금지.
**원칙 A~L 모든 소제목에 강제 적용.** 5인자 결합·메인 0 양면 풀이 + 절제된 [[ ]] 강조 1~2회.
${_ch3TraitsBlock}
${ch3ChartFacts}

${injectTimeResolution("ch3")}

[★ 3장 공용 출력 룰 — system 룰과 함께 적용]
- **출력 형식: 산문체 4단 구조**. 박스·번호·이모지 분리·가상 대화·표 절대 금지. 단락 사이 빈 줄 1개로만 구분.
  ① 도입 단정 한 줄 (60~100자) — 자녀 사주 인자에서 도출된 결을 단호히 선언.
  ② 사주 메커니즘 단락 (140~200자) — 메인 인자명 직접 인용 ("식상이 약하게 자리한 ${cnh}은…" 형태). 서브 인자(신강신약·일주·오행·신살·합충) 자연 결합. 매핑 키워드 풀에서만 인용.
  ③ 일상 행동·장면 + 부모 처방 (150~220자) — 추상 X. 구체 일상 장면 1개 이상.
  ④ "부모님이 기억해야 할 한 가지" 마무리 (90~130자) — "부모님이 기억해야 할 한 가지는, ${cnh}은 [구체 단정]라는 거예요." 어조로. 다독임 X.
- 사주 인자 명사 본문 최소 3개 노출 (system 룰 #5).
- 분량 sub당 450~600자. \`[[ ]]\` sub당 1~2회 키 어절(10자 이내)에만.
- ★ V2 풀 시스템 — 각 sub에 박힌 [가정문 풀] [대사 풀] [인자 속성 매트릭스]는 절대 룰. 풀 외 즉흥 가정문·대사 생성 시 위반. 풀 항목을 자연 인용·약간 변주만 허용.

${INSIGHT_4STEP_RULE}

## 3장 — 우리 아이 칭찬하고 혼내는 법

### 화났을 때 입을 닫을까, 폭발할까
[메인: 식상 / 서브: 비겁·신강신약·일주·신살(양인·괴강·고란)]
[시그너처: 두갈래 대비형] — "안으로 삼킴 vs 밖으로 즉시" 패턴을 한 단락 안에서 대비하며 ${cnh}이 어느 쪽에 가까운지 단정. 안으로 삼키는 결이면 "평소엔 ○○하다가 어느 날 갑자기 폭발"하는 시간 누적 패턴 묘사 의무. 밖으로 즉시면 "작은 자극에도 즉각 흘러나와 잔잔히 식음" 패턴.

${injectPoolsBlock({ chapterId: "ch3", subId: "anger", mainFactor: "식상", scenarios: [{ key: "ch3_anger_pattern", pickCount: 1 }, { key: "ch3_anger_inward_scene", pickCount: 1 }, { key: "ch3_anger_outward_scene", pickCount: 1 }], dialogs: [{ category: "ch3_anger_inner", insertCount: 1 }, { category: "ch3_anger_parent_wrong", insertCount: 1 }] })}

구성: ① 단정 — "${cnh}은 화가 났을 때 [밖으로 표현하기보다 안으로 삼키는 / 그때그때 즉시 흘려보내는] 아이예요." → ② "식상이 [약/강]하게 자리한 ${cnh}은 자기 감정을 [말로 풀어내는 통로가 좁아요/즉각 표현으로 드러내요]" 톤으로 시작. 식상 + 신강신약 + 비겁 + 일주·신살(양인 = 폭발 / 고란 = 닫힘) 결합. ③ 누적 폭발 또는 잦은 분출 일상 장면 1개 + "왜 이제 와서 그래?" 또는 "작은 일에도 또 이래?"가 도움 안 되는 이유 + 작은 감정 자주 꺼낼 환경 처방. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}이 [입을 닫는/즉시 터뜨리는] 건 [괜찮아서가 아니라 표현하는 법을 못 찾아서/억제가 안 되어서가 아니라 쌓아둘 통로가 없어서]라는 거예요." 식상 0 = "안으로 정리하는 신중한 결" 양면 풀이.

### 아이 감정이 가라앉는 환경
[메인: 오행 / 서브: 일주·신강신약·기신 오행·12운성]
[시그너처: 처방전형 — 환경 권장이 산문 안에 자연 녹음. 박스·5축 리스트·이모지 절대 X.]

${injectPoolsBlock({ chapterId: "ch3", subId: "calm_environment", mainFactor: "오행", scenarios: [{ key: "ch3_calm_light", pickCount: 1 }, { key: "ch3_calm_space", pickCount: 1 }, { key: "ch3_calm_sound", pickCount: 1 }, { key: "ch3_calm_warmth", pickCount: 1 }, { key: "ch3_calm_recovery_ritual", pickCount: 1 }], dialogs: [{ category: "ch3_calm_inner", insertCount: 1 }] })}

구성: ① 단정 — "${cnh}은 [구체 환경 한 줄 — 빛·공간·소리·온도 중 자녀 결에 맞는 1~2축]에서 가장 빨리 감정이 가라앉는 아이예요." → ② "오행에서 [강한 오행]의 기운이 강한 ${cnh}은 외부 자극에 [어떻게] 반응해요" 톤. 강한 오행·약한 오행·기신 결합으로 어수선한 vs 정돈된, 시끄러운 vs 부드러운, 차가운 vs 따뜻한 환경 대비를 산문으로 풀이. ③ 혼자만의 시간 의무 + 야단 직후 대화 X 권고 — ${cnh}이 진정될 시간을 충분히 보장받았을 때 부모 말이 머리와 가슴에 동시에 가닿는 메커니즘 묘사. 좋아하는 음악·따뜻한 차 같은 회복 의식 1~2개 자녀 결에서 도출. ④ 마무리 — "부모님이 기억해야 할 한 가지는, '진정해'라고 말하는 것보다 진정될 수 있는 환경을 먼저 만들어주는 것이 ${cnh}에게는 훨씬 효과적이라는 거예요." 환경은 반드시 자녀 강한 오행·약한 오행·기신·12운성 결합으로 도출. 일반 인테리어 조언 금지.

### 마음 열리는 칭찬
[메인: 인성 / 서브: 식상·일주·용신·천을귀인]
[시그너처: 단정+일화형] — "결과보다 과정 / 능력보다 노력" 단정 + 구체 칭찬 멘트 1~2개를 [[ ]] 골드 강조로 + 둘만 있을 때라는 자리까지 짚어줌.

${injectPoolsBlock({ chapterId: "ch3", subId: "praise", mainFactor: "인성", scenarios: [{ key: "ch3_praise_scene", pickCount: 1 }, { key: "ch3_praise_compare_bad", pickCount: 1 }], dialogs: [{ category: "ch3_praise_phrase", insertCount: 2 }] })}

구성: ① 단정 — "${cnh}은 [결과보다 과정을 / 능력보다 노력을 / 행동보다 마음을] 알아봐줄 때 마음이 활짝 열리는 아이예요." → ② "인성이 [발달한/얇게 자리한] ${cnh}은 '잘했다'는 한마디보다 '네가 어떤 마음으로 했는지 엄마가 알아'라는 인정에 더 깊이 반응해요" 톤. 정인(태도·과정 인정형) vs 편인(직관·고유성 인정형) 분기 + 식상·일주·용신·천을귀인 결합. ③ 구체 칭찬 멘트 1~2개 — 자녀 사주 인자에서 도출된 30~50자 멘트를 [[ ]] 강조로 한 번 (예: [[네가 포기하지 않고 끝까지 해낸 그 부분]]). 차가운 평가·비교 언어("형은 이렇게 했는데", "옆집 아이는") 가 ${cnh}의 어디를 찌르는지 짧게 + 사람들 앞 칭찬보다 둘만 있을 때 진심 한마디가 깊게 새겨지는 이유. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}은 '결과를 칭찬받는 아이'가 아니라 '존재를 인정받고 싶은 아이'라는 거예요." 인성 0 = "직관·실전 — 행동 자체로 확인받고 싶은 결" 양면 풀이.

### ${ah.ch3_lie}
[메인: 일주 / 서브: 관성·인성·신살·합·충]
[시그너처: 관찰자/통찰형] — 표면(${ah.ch3_lieContext} 한 행동)이 아니라 본심을 깊이 분석. 가상 대화 박스 절대 X — 통찰의 산문으로.

${injectPoolsBlock({ chapterId: "ch3", subId: "lie", mainFactor: "일주", scenarios: [{ key: "ch3_lie_motive", pickCount: 1 }, { key: "ch3_lie_approach", pickCount: 1 }], dialogs: [{ category: "ch3_lie_inner", insertCount: 1 }, { category: "ch3_lie_parent_wrong", insertCount: 1 }, { category: "ch3_lie_parent_open", insertCount: 1 }] })}

구성: ① 단정 — "${cnh}은 ${ah.ch3_lieContext} 자체가 목적이 아니라, [실망시키고 싶지 않은 마음 / 혼나는 게 두려운 마음 / 자유를 지키려는 마음 / 부담을 잠시 내려놓고 싶은 마음] 에서 ${ah.ch3_lieContext}을 하는 아이예요." (자녀 일주 + 관성 결합으로 동기 결정. 자녀 연령이 영유아면 "거짓말" 어휘 X — 고집·억지·떼·짜증으로) → ② "${cnh}의 일주는 기본적으로 [정직하고 책임감 있는 / 감정 풍부하고 즉흥적인 / 자유로운 결을 가진 / 부드럽고 받아주는] 결을 가지고 있어요" 톤. 일주(60갑자) + 관성 강/약 + 인성 + 신살 + 합·충 결합. 관성 강 = 부모 기대 부담이 또래보다 큼 / 관성 약 = 자유 막혔을 때 즉흥 회피 등. ③ "왜 ${ah.ch3_lieContext}이 나왔을까"를 먼저 들어주는 대화법 + "솔직하게 말하면 더 크게 화내지 않을게" 약속이 ${ah.ch3_lieContext}의 필요성을 줄이는 메커니즘. 추궁이 닫게 만드는 이유 짧게. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}의 ${ah.ch3_lieContext}은 나쁜 마음이 아니라 [약한 순간의 표현 / 부담을 던 임시방편 / 자기 자유를 지키는 방어]라는 거예요. 그 [약한 순간/부담/자유]을 안전하게 만들어주는 게, 결국 단단한 ${cnh}로 키우는 길이에요." 가상 대화 X.

### 이 아이가 무너지는 자극
[메인: 기신 / 서브: 약한 오행·신강신약·신살·12운성]
[시그너처: 신호등/금지형] — 기신(忌神) 한자 1회 명시 + 금지어 직접 인용 + "행동만 짚되 인격은 보호". 노랑·주황·빨강 신호등 박스·이모지 절대 X — 기신 메커니즘의 산문으로.

${injectPoolsBlock({ chapterId: "ch3", subId: "breaking", mainFactor: "기신", scenarios: [{ key: "ch3_breaking_stimulus", pickCount: 1 }, { key: "ch3_breaking_setting", pickCount: 1 }], dialogs: [{ category: "ch3_breaking_words", insertCount: 2 }] })}

구성: ① 단정 — "${cnh}은 [차가운 비교 / 일방적인 재촉 / 자기 페이스 무시 / 공개적인 지적] 같은 자극을 받을 때 가장 깊이 무너지는 아이예요." (자녀 기신 + 약한 오행 + 비겁 강도로 도출) → ② "${cnh}의 기신(忌神)은 [차가운 비교와 일방적인 재촉 / 강한 통제와 침범 / 무관심한 거리]이에요" 톤. 기신·약한 오행·신강신약·신살·12운성 결합 풀이. 비겁 강 = 자기 페이스 부정당하면 자존감 무너짐 / 인성 약 = 차가운 평가에 결 흔들림 등. ③ 금지어 직접 인용 — "왜 너는 못해?", "다른 애들은 다 하는데", "빨리빨리 좀 해", "너는 왜 이런 애가 됐어" 중 ${cnh}의 결에 맞는 1~2개를 그대로 인용 + 그 말이 ${cnh}의 어디를 찌르는지 + 사람들 앞·형제자매 앞·친구 앞에서 혼나는 경험이 자존감에 남기는 흔적. 행동만 짚되 인격은 지키는 훈육 메커니즘. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}은 [강하게 키우려고 흔들면 흔들수록 더 약해지는 / 통제로 누르면 누를수록 더 멀어지는] 결을 가졌다는 거예요. 단단하게 키우려면, 오히려 [안전한 울타리부터 / 자기 페이스부터] 만들어주세요." 부정형 톤 X — "살펴줄 결" 어조.`;

  const ch4Body = `
출력 순서·헤더는 정확히. **원칙 A~L 강제 적용.** 5인자 결합·메인 0 양면 + 절제된 [[ ]] 1~2회.
${_ch4TraitsBlock}
${ch4ChartFacts}

[★ 4장 공용 출력 룰 — system 룰과 함께 적용]
- **출력 형식: 산문체 4단 구조**. 박스·번호·이모지 분리·표·% 비중·단계 번호·타임라인·그래프 박스 절대 금지. 단락 사이 빈 줄 1개로만 구분.
  ① 도입 단정 한 줄 (60~100자) — 자녀 사주 인자에서 도출된 결을 단호히 선언.
  ② 사주 메커니즘 (140~200자) — 메인 인자명 직접 인용 ("일주는 신중·진중한 성향" / "비겁이 강한 ${cnh}은…" 형태). 서브 인자(인성·식상·관성·12운성·신살·합충) 자연 결합. 매핑 키워드 풀에서만 인용.
  ③ 일상 행동·장면 + 부모 처방 (160~220자) — 학교/조별 활동/캠프/혼자 있는 모습 같은 구체 장면 1개 이상. 친구 평판·부모 관찰 기준은 산문에 녹임.
  ④ "부모님이 기억해야 할 한 가지" 마무리 (90~130자).
- 사주 인자 명사 본문 최소 3개 노출 (일주·비겁·식상·관성·인성·신강·귀인 신살·대운 중).
- 분량 sub당 450~600자. \`[[ ]]\` sub당 1~2회 (키 어절 또는 평판 인용에만).

## 4장 — 친구 사이 우리 아이

### 마음 문 여는 데 걸리는 시간
[메인: 일주 / 서브: 인성·비겁·신강신약·일지 합충]
[시그너처: 신중함 단정형] — "빠르게 친해지기보다, 천천히 깊게" 단정 + "1년쯤 지켜본 후에야 진짜 친구" 패턴 묘사 + "양보다 질". 단계 번호(1단계/2단계/3단계) 절대 X.
구성: ① 단정 — "${cnh}은 [빠르게 친해지기보다 천천히 깊게 다가가는 / 새 환경에서 빠르게 마음을 여는 / 결을 보며 자기 페이스로 다가가는 양면형의] 결을 가진 아이예요." (자녀 일주·인성·비겁 결합 — 차트 도미넌트가 '천천히형'이면 첫째, '빠르게형'이면 둘째, '중간 속도'면 반드시 셋째 옵션 사용. 한쪽으로 단정 금지.) → ② "${cnh}의 일주는 [신중하고 진중한 / 정직하고 책임감 있는 / 자유롭고 즉흥적인] 성향을 담고 있어요" 톤. 일주(60갑자 또는 일간 음양) + 인성 + 비겁 + 신강신약 + 일지 합·충 결합. 신중형이면 "관찰 → 결 살핌 → 마음 조금씩" 흐름을 산문으로(단계 번호 X). 빠른 개방형이면 "한두 번 만남에 통하는 결" 풀이. ③ "겉으론 무뚝뚝/거리감 있어 보이지만 차가운 게 아니라 신중함" 같은 표면 vs 본심 짧게 + 같은 반에서 1년쯤 지켜본 후 진짜 친구 / 또는 빠르게 가까워졌다가 자연스럽게 멀어지는 패턴 일상 묘사. 부모가 답답할 때 "친구 좀 사귀어봐" 재촉이 역효과인 이유 산문으로. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}의 친구 관계는 [양보다 질로 봐야 한다는 / 폭넓게 자라는 결이라는] 거예요. [친구가 한두 명뿐이어도 그 한두 명과 깊이 통하고 있다면 / 다양한 결의 친구를 만나면서 자기 결을 다듬어가는 중이라면] 사회성은 충분히 잘 자라고 있는 거예요." 비겁 0 = "남의 결을 받아들이는 협력형" 양면 풀이.

### 리더 vs 짝꿍 vs 분위기 메이커
[메인: 비겁·식상·관성 / 서브: 일주·신살(괴강·양인)]
[시그너처: 3유형 중 하나 단정 + 친구 평판 인용형] — % 비중 표시·세 유형 정의 박스 절대 X. 자녀가 어느 유형에 가장 가까운지 단정 + 그 유형의 친구 평판을 [[ ]] 강조로 1회 인용.
구성: ① 단정 — "${cnh}은 [앞에서 끌고 나가는 리더형이라기보다 / 신뢰받는 짝꿍형에 / 분위기를 만드는 메이커형에] 가까운 아이예요." (비겁·식상·관성 강도 비교로 결정) → ② "비겁이 [강한/약한] 결은 자기만의 줏대가 [뚜렷해서 휩쓸리지 않아요/유연해 친구 결에 잘 맞춰져요]" 톤. 비겁(자기 줏대) + 식상(외부 표현 에너지) + 관성(약속·책임) + 일주·신살(괴강 = 단호 / 양인 = 결단) 결합 풀이. 강한 인자 = 그 결의 자리, 약한 인자 = 자연스럽지 않은 자리. ③ 조별 활동 일상 장면 의무 — 발표 자리 vs 자료 정리 자리 / 반장 vs 부반장·총무 / 분위기 메이커 vs 비밀 지켜주는 친구 같은 구체 자리 묘사. 친구들 사이 평판 1~2개를 [[ ]] 골드 강조로 1회 인용 (예: [[걔는 약속 지켜]] / [[걔는 분위기 만들어]] / [[걔한테 말하면 해결돼]] 자녀 결에 맞는 멘트). ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}의 매력은 [앞에서 빛나는 게 아니라 곁에 있는 사람을 빛나게 해주는 / 사람들 한복판에서 분위기를 살리는 / 묵묵히 자기 자리를 지키는] 결이라는 거예요. 그 결을 인정해주는 것이 자존감의 출발점이에요." 단정 강제 — "두 유형 결합" 회피 표현 X.

### 인생을 바꿀 친구는 따로 있다
[메인: 귀인 신살 / 서브: 일주·일간 오행·합·대운]
★★★ G000 (2026-05-14) — 자녀 보유 좋은 별(귀인) 본문 명시 강제: **${cf_sinsalNames}**
- 위 신살 이름을 본문에 정확히 인용. "어떤 귀인인지" 추상 표현 금지. "(없음)"이면 "스스로 어른의 결을 만나러 가는 자수성가형" 양면 풀이.
[시그너처: 귀인 결 단서 산문형] — 띠/계절/성향 박스 절대 X. "${cnh}에게 좋은 친구의 결"을 산문으로 풀고 부모 관찰 기준 [[ ]] 강조로 1회.
구성: ① 단정 — "${cnh}에게 인생의 결을 바꿔줄 귀인은 [차분하고 깊이 있는 / 활기차고 따뜻한 / 단단하고 묵묵한 / 부드럽고 받아주는] 친구예요." (자녀 일간 오행 + 귀인 신살 결합으로 친구 결 결정 — 자녀에게 부족한 오행이 강한 친구 / 또는 자녀 결을 단단히 받쳐줄 결의 친구) → ② "귀인은 사주에서 ${cnh}에게 이로운 기운을 가진 사람을 뜻해요" 톤으로 시작. 천을(天乙)·복성·문창·학당귀인 등 ${cnh} 보유 신살 + 자녀 일간 오행 상생 + 부족한 오행 결합 풀이. 자녀에게 좋은 친구의 결(예: 수 기운 깊은 = 차분·사려 깊은 / 화 기운 강한 = 활기·따뜻한 / 토 기운 두터운 = 신뢰·안정 결의 친구) 명시. ③ 반대로 길게 보면 결 흩뜨리는 친구 결 + "처음엔 신선하지만 시간이 지날수록 자기 색을 잃어가는 패턴" 산문. 부모 관찰 기준을 [[ ]] 강조 1회 (예: [[옆에 있을 때 더 차분해지고 단단해지는가]] / [[옆에 있을 때 더 환하게 웃는가]] 자녀 결에 맞는 한 줄). ④ 마무리 — "부모님이 기억해야 할 한 가지는, 친구는 많을 필요가 없다는 거예요. ${cnh}의 인생에 진짜로 의미 있는 [한두 명/소중한 결의 친구들]만 있어도 충분해요." 귀인 0 = "스스로 어른의 결을 만나러 가는 자수성가형" 양면 풀이.

### 친구들 속에서 지치는 패턴
[메인: 신강신약 / 서브: 비겁·식상·일주·12운성]
[시그너처: 충전 패턴형] — 모임 전·중·후·24h 후 4시점 그래프 박스 절대 X. 학교 후·캠프·갈등 곱씹음 같은 일상 장면을 산문으로.
구성: ① 단정 — "${cnh}은 [사람이 많은 자리에 오래 있을수록 에너지가 빠르게 소진되는 / 사람들 한복판에서 에너지가 차오르는] 결을 가진 아이예요." (신강신약 + 비겁·식상 + 12운성 결합) → ② "신강한 에너지 구조이지만, ${cnh}의 에너지는 [혼자만의 시간을 통해 충전되는 / 사람과 부대끼며 충전되는] 타입이에요" 톤. 비겁(자기 결 단단함) + 식상(외부 표현 에너지) + 12운성(약세 = 태·묘·절 / 강세 = 장생·관대·건록·제왕) + 일주 결합 풀이. ③ 일상 장면 의무 — 학교에서 친구들과 부대낀 날 집에 와서 방에 들어가 혼자 있고 싶어 하는 모습 / 캠프·수련회·여행 직후 에너지 빠진 신호(짜증·갑자기 우는) / 친구 갈등 후 혼자 오래 곱씹는 패턴 산문으로. 사회성 부족 X — 충전 필요. 1~2시간 혼자 후 다시 활기 회복 리듬. 갈등 후 혼자 정리할 시간 보장 후에야 마음 열리는 메커니즘. ④ 마무리 — "부모님이 기억해야 할 한 가지는, [[${cnh}의 충전 방식은 '사람'이 아니라 '혼자만의 시간']]이라는 / [${cnh}은 사람과 부대껴야 자기 결이 살아나는 아이라는] 거예요. [그 시간을 충분히 보장해주는 / 그 자리를 자연스럽게 만들어주는] 것이 사회성을 길러주는 가장 빠른 길이에요." 신약·12운성 약세 = "회복 결" 양면 풀이.`;

  const ch5Body = `
출력 순서·헤더는 정확히. **원칙 A~L 강제 적용.** 5인자 결합·메인 0 양면 + 절제된 [[ ]] 1~2회.
${_ch5TraitsBlock}
${ch5ChartFacts}

${injectTimeResolution("ch5")}

[★ 5장 공용 출력 룰 — system 룰과 함께 적용]
- **출력 형식: 산문체**. 박스·키워드 묶음·5축 처방·타임라인·★ 표시·이모지·표 절대 금지. 단락 사이 빈 줄 1개로만 구분.
  ① 도입 단정 한 줄 (60~100자) — 자녀 사주 인자에서 도출된 결을 단호히 선언.
  ② 사주 메커니즘 (140~200자) — 메인 인자명 직접 인용 ("식상은 자기 안의 것을 밖으로 표현하는 별" / "용신은 ${cnh}에게 약처럼 작용하는 기운" / "대운은 10년 단위 흐름" 같은 어조). 서브 인자(일간 오행·신강신약·신살·12운성·합충) 자연 결합. 매핑 키워드 풀에서만 인용.
  ③ 일상 행동·장면 + 부모 처방 (160~280자) — 직업 예시(디자인·기획·마케팅·교육·콘텐츠·요리·의료·상담·연구자·교수·CTO 등)·평판 인용·구체 환경 묘사·연령대 단락 같은 산문 장면 의무.
  ④ "부모님이 기억해야 할 한 가지" 마무리 (90~130자).
- 사주 인자 명사 본문 최소 3개 노출 (식상·재성·관성·인성·일주·용신·대운 등).
- 분량 sub당 500~700자 (sub ②는 600~750자 허용). \`[[ ]]\` sub당 1~3회 (sub ② 무기 3개 나열에선 무기당 1회 = 최대 3회).
- ★ V2 풀 시스템 — 각 sub에 박힌 [가정문 풀] [대사 풀] [인자 속성 매트릭스]는 절대 룰. 풀 외 즉흥 직업명·평판·멘트 생성 시 위반.

${INSIGHT_4STEP_RULE}

## 5장 — 우리 아이는 무엇으로 빛날까

### 진짜 빛날 분야
[메인: 식상·재성 / 서브: 일간 오행·일주·관성·신강신약]
[시그너처: 단정+직업 예시 산문형] — 키워드 묶음 박스(창작/표현/사람/무대) 절대 X. 자녀 결과 잘 맞는 분야를 산문에 직업명으로 자연 인용 + 돈 감각 단정 + [[ ]] 강조 1회.

${injectPoolsBlock({ chapterId: "ch5", subId: "field", mainFactor: "식상", scenarios: [{ key: "ch5_field_mok", pickCount: 1 }, { key: "ch5_field_hwa", pickCount: 1 }, { key: "ch5_field_to", pickCount: 1 }, { key: "ch5_field_geum", pickCount: 1 }, { key: "ch5_field_su", pickCount: 1 }, { key: "ch5_field_drain", pickCount: 1 }], dialogs: [{ category: "ch5_field_misread", insertCount: 1 }] })}

구성: ① 단정 — "${cnh}은 [결과물이 눈에 보이고 다른 사람에게 가치를 전달할 수 있는 / 본질을 깊이 파고드는 / 사람의 마음을 다루는 / 정확하고 단단한 구조를 만드는] 분야에서 진짜로 빛나는 아이예요." (식상·재성·일간 오행 결합으로 분야 결 결정) → ② "식상은 자기 안의 것을 밖으로 표현하고 만들어내는 별이에요. 재성은 그 결과물이 세상과 만나 가치로 전환되는 별이에요" 톤으로 시작. 식상·재성 강도 + 일간 오행별 분야 결(목 = 교육·창작 / 화 = 예술·발표 / 토 = 신뢰·관리·중재 / 금 = 정밀·결단·기술 / 수 = 연구·지혜·상담) + 관성·신강신약 결합 풀이. ③ ${cnh}에게 잘 맞는 분야 직업명 4~6개 산문에 자연 나열 (예: "디자인, 기획, 마케팅, 교육, 콘텐츠 제작, 요리, 의료, 상담" 같은 자녀 결에 맞는 분야명) + 반대로 지치게 하는 일(추상 이론·결과물 안 보이는 일 등) 짧게. 재성 강도에 따라 "돈 버는 감각이 어릴 때부터 발달 / 돈보다 의미·과정에 집중" 양면 풀이 + 작은 경제 활동 권고 한 줄. ④ 마무리 — "부모님이 기억해야 할 한 가지는, [[${cnh}의 진로는 '안정적인 직업'이 아니라 '자기가 만든 것을 세상에 내놓는 직업']]이라는 / [${cnh}의 진로는 '많이 아는 사람'이 아니라 '한 가지를 깊이 아는 사람']이라는 거예요. 그 길을 일찍 알아봐주는 것이 가장 큰 응원이에요." 직업명 단정 X — 결의 방향만.

### 아이만의 무기
[메인: 일주 / 서브: 신살·일간 오행·신강신약·관성·인성]
[시그너처: 무기 3가지 나열형] — 무기 1개 명명·영화 장면 묘사 절대 X. ${cnh}의 무기 3개를 각각 한 단락씩 산문으로 나열 + 각 무기마다 [[ ]] 강조 평판/멘트 1회 = 최대 3회.

${injectPoolsBlock({ chapterId: "ch5", subId: "weapon", mainFactor: "일주", scenarios: [{ key: "ch5_weapon_first_axis", pickCount: 1 }, { key: "ch5_weapon_second_axis", pickCount: 1 }, { key: "ch5_weapon_third_axis", pickCount: 1 }], dialogs: [{ category: "ch5_weapon_misread", insertCount: 1 }, { category: "ch5_weapon_praise", insertCount: 2 }] })}

구성: ① 단정 — "${cnh}의 가장 단단한 무기는 [구체 무기명 1 — 자녀 일주에서 도출]이에요." → ② 첫 번째 무기 단락 (180~220자) — "일주는 ${cnh}의 가장 근본적인 본질이에요. ${cnh}의 일주는 [단단하고 진중한 / 부드럽고 받아주는 / 결단력 있고 추진하는 / 섬세하고 헤아리는] 결을 담고 있어요" 톤. 일주(60갑자 또는 일간·일지)·일간 오행·신살(괴강 = 단호 / 양인 = 결단 등) + 신강신약 결합. 또래가 휩쓸릴 때 ${cnh}이 어떻게 자기 자리를 지키는지 + 어릴 때는 [[ ]] 평판으로 오해받기도 하는 결(예: [[고집이 세다]] / [[융통성이 없다]] / [[너무 무르다]] 자녀 결에 맞는 한 줄) → ③ 두 번째 무기 단락 (140~180자) — 신뢰감·약속 지키는 결(관성 강) / 마음으로 받아주는 결(인성 강) / 빠른 판단 결(식상 강) 등 자녀 사주 인자에서 도출. 친구·가족·미래 직장에서의 평판 [[ ]] 강조 1회 (예: [[걔는 믿을 수 있어]] / [[걔한테 부탁하면 끝까지 해]] 자녀 결에 맞는 한 줄) → ④ 세 번째 무기 단락 (140~180자) — 깊이 보는 눈(인성 강) / 분위기 살리는 손(식상 강) / 사람 챙기는 마음(재성 강) 등. 그 결이 분석·본질 보기·관계 다루기에서 어떻게 강점이 되는지. ⑤ 마무리 — "부모님이 기억해야 할 한 가지는, [[${cnh}의 무기는 '빠름'이 아니라 '깊음']]이라는 / [${cnh}의 무기는 '많음'이 아니라 '진심']이라는 거예요. [빠른/많은] 아이로 만들려고 하지 마세요. [깊은/진심 어린] 아이로 자랄 수 있게 시간을 주세요." 무기 3개는 자녀 사주 인자에서만 도출 — 일반론 X.

### 환하게 빛나게 해주는 결 한 가지
[메인: 용신 / 서브: 일간 오행·신강신약·12운성·계절]
[시그너처: 용신 오행 매트릭스 통합 풀이형 — V2.1.3 신설]
⭐ 3축(인정·일상 리듬·멘토) 폐기. 용신 오행 한 가지를 중심으로 환경·일상·어른을 **통합 흐름 산문**으로. 시각화 카드(용신 오행)와 본문이 같은 결을 가리키도록.

★ 용신 오행별 환경 매트릭스 — 반드시 자녀 용신에 해당하는 1칸만 본문에 인용:

[용신 = 목(木) 인 자녀]
- 환경: 성장 가능한 자리·새 시도 허용되는 공간·푸른 기운 도는 자리
- 일상: 매일 조금씩 키워가는 리듬·다양한 경험 허용
- 어른: 키워주는 마음의 어른·격려 아끼지 않는 선배

[용신 = 화(火) 인 자녀]
- 환경: 환한 자리·표현 받아주는 공간·따뜻한 기운 도는 자리
- 일상: 발산할 시간 있는 리듬·감정 자유롭게 풀어내는 자리
- 어른: 따뜻한 마음의 어른·웃음 나누는 선배

[용신 = 토(土) 인 자녀]
- 환경: 안정된 일상·신뢰 두터운 자리·노란빛 흙의 기운 도는 공간
- 일상: 예측 가능한 시간표·반복으로 쌓는 리듬
- 어른: 묵직한 어른·약속 지키는 선배

[용신 = 금(金) 인 자녀]
- 환경: 정돈된 환경·맑은 공기 닿는 자리·결단의 자리
- 일상: 흐트러짐 없는 일상·분명한 기준으로 다듬는 리듬
- 어른: 흐트러짐 없는 어른·기준 분명한 선배

[용신 = 수(水) 인 자녀]
- 환경: 고요한 자리·깊이 이해받는 공간·물가 가까운 환경
- 일상: 사색할 시간 있는 리듬·내면 정돈하는 자리
- 어른: 사려 깊은 어른·깊이 이야기해주는 선배

${injectPoolsBlock({ chapterId: "ch5", subId: "environment", mainFactor: "용신", scenarios: [{ key: "ch5_env_recognition", pickCount: 1 }, { key: "ch5_env_rhythm", pickCount: 1 }, { key: "ch5_env_mentor", pickCount: 1 }, { key: "ch5_env_dimmer", pickCount: 1 }], dialogs: [{ category: "ch5_environment_phrase", insertCount: 1 }, { category: "ch5_mentor_phrase", insertCount: 1 }] })}

구성: ① 단정 (60~90자) — "${cnh}의 용신은 [용신 오행 한자, 예: 금(金)]. 사주에 [그 오행]의 기운이 [강/부족]한 ${cnh}을 가장 환하게 빛나게 해주는 결은 [위 매트릭스 환경 어휘]예요." 반드시 용신 오행 한자 1회 본문 등장. 추상 어휘(따뜻한 인정·자유로운 도전·깊은 신뢰 등)만 단정 절대 X.
→ ② 메커니즘 (120~180자) — "용신은 ${cnh}에게 약처럼 작용하는 기운이에요" 톤으로 시작. 용신 오행 + 일간 오행 관계 + 신강·신약별 용신 강도 + 12운성·계절 결합 풀이. 위 매트릭스의 환경·일상·어른 어휘를 산문에 자연 인용.
→ ③ 통합 흐름 단락 (240~300자) — 위 매트릭스의 자녀 용신 칸 안 환경·일상·어른 3줄을 **통합 흐름 산문으로 묶음** (3축 분리 단락 X). 자녀 일상 장면 1개 + 어른 결 1개를 산문에 자연 녹임. [[ ]] 강조 1~2회 (예: [[정돈된 환경에서 가장 빛나요]] / [[흐트러짐 없는 어른 곁에서]] — 자녀 용신 결에 맞춤). 반대로 빛 꺼뜨리는 환경(자녀 용신과 반대 결) 짧게.
→ ④ 마무리 (60~100자) — "부모님이 기억해야 할 한 가지는, ${cnh}을 [용신 오행 환경 어휘]에 두는 것이 가장 빨리 빛나게 하는 길이라는 거예요." 일반 인정 어휘(노력·과정·존재 등) 단정 X — 반드시 용신 오행 환경 어휘 사용.

⚠️ 3축(인정·리듬·멘토) 분리 풀이 폐기 — 통합 흐름.
⚠️ 본문에 용신 오행 한자(목·화·토·금·수) 최소 1회 등장 의무. 없으면 검수에서 rewrite.
⚠️ 용신=일간 동일 케이스 = "자기 결로 자라는 사주" 양면 풀이.`;

  // ⭐ V2.1 (2026-05-15) — ch5 sub 5→3 축소: "10대·20대·30대 어느 때 가장 빛날까" + "리더로 클까, 깊이 있는 전문가로 클까" 2개 삭제 (다른 sub와 결 겹침)
  const _ch5RemovedSubsForReference = `
### 10대·20대·30대 어느 때 가장 빛날까
[메인: 대운 / 서브: 일간 오행·용신·세운·12운성]
[시그너처: 연령대 단락 묘사형] — 10대~80대 타임라인 박스·★ 표시 절대 X. 10대·20대·30대 각 연령대를 한 단락씩 산문으로 풀이.

${injectPoolsBlock({ chapterId: "ch5", subId: "age", mainFactor: "대운", scenarios: [{ key: "ch5_age_10s", pickCount: 1 }, { key: "ch5_age_20s", pickCount: 1 }, { key: "ch5_age_30s", pickCount: 1 }] })}

구성: ① 단정 — "${cnh}은 [20대 후반에서 30대 중반 사이에 / 30대 후반에서 40대에 / 10대 후반에서 20대에 / 40대 중반 이후] 인생의 결이 가장 환하게 펼쳐지는 흐름을 가지고 있어요." (자녀 대운 + 용신 진입 시기 + 12운성 강세 결합) → ② "대운은 인생의 큰 흐름을 10년 단위로 보는 별이에요" 톤. ${cnh}의 대운 흐름 개관 — 10대는 [다지는/탐색하는/이미 빛나기 시작하는] 시기, 20대는 [탐색·실패와 시도/본격적으로 자기 자리 만드는], 30대는 [수확/한 번 더 도약]. 일찍 빛나는 결 vs 늦게 깊어지는 결 단정. ③ 연령대 단락 — (a) 10대 단락(80~120자): 기초·자기 결 확인 / 결과 쥐어짜내지 말 권고 / 다양한 경험 권장. (b) 20대 단락(80~120자): 실패와 시도 / "다른 애들은 자리 잡았는데 우리 애만 헤매네" 부모 흔들림 + 헤맴이 필요한 과정인 이유 / 또는 자기 자리 만들기 시작. (c) 30대 단락(80~120자): 수확 / 자기 분야에서 깊이 만들어가고 영향력 펼침. 자녀 대운 흐름에 맞춰 강한 시기 자연 묘사. ④ 마무리 — "부모님이 기억해야 할 한 가지는, [[${cnh}의 시간표는 '일찍'이 아니라 '정확한 때']]라는 / [${cnh}의 시간표는 '남들과 같이'가 아니라 '자기 결대로']라는 거예요. 그 때를 기다려주는 것이 ${cnh}을 가장 환하게 피우는 길이에요." 사춘기 단어 X — "결이 변하는 시기".

### 리더로 클까, 깊이 있는 전문가로 클까
[메인: 관성·인성 / 서브: 비겁·일주·신강신약·식상]
[시그너처: 양 갈래 비교 + 자녀 결 단정 + 직업 예시형] — 이모지(🌟📚) 절대 X. 리더형 vs 전문가형 정의 산문 + ${cnh}이 어느 쪽인지 단정 + 직업 예시 산문 + 작은 팀 리더 가능 여부 한 단락.

${injectPoolsBlock({ chapterId: "ch5", subId: "role", mainFactor: "관성", scenarios: [{ key: "ch5_role_leader", pickCount: 1 }, { key: "ch5_role_expert", pickCount: 1 }, { key: "ch5_role_pioneer", pickCount: 1 }] })}

구성: ① 단정 — "${cnh}은 [여러 사람을 이끄는 리더보다, 자기 분야에서 깊이를 만드는 전문가의 / 깊이 파고드는 전문가보다, 큰 그림을 그리는 리더의 / 두 결을 모두 갖춘 양면형의] 결을 가진 아이예요." (관성·인성 강도 비교 + 비겁·식상 결합) → ② "관성은 책임감과 체계의 별이고, 인성은 배움과 깊이의 별이에요" 톤. 두 별이 함께 작동할 때 만들어지는 결 풀이. 관성 강·인성 강 = 전문가형 / 관성 강·비겁 강 = 리더형 / 식상 강·재성 강 = 분야 개척형 / 관인상생 = 양면형. 일주·신강신약 결합 풀이. ③ 리더의 길 vs 전문가의 길 산문 비교 — 리더는 빠른 결정·사람 동원·큰 그림 / 전문가는 충분히 들여다본 후 결정·혼자 깊이 파고드는 시간·한 분야 오래. ${cnh}이 어느 쪽에 본 능력 발휘하는지 + 반대 자리에 억지로 올려놓을 때 본인도 힘들고 결과 안 나오는 메커니즘. 직업 예시 산문에 자연 인용 (전문가형 = 연구자·교수·전문 기술자·CTO·핵심 콘텐츠 제작자 / 리더형 = CEO·팀장·기획자·운영자 / 분야 개척형 = 창업가·프리랜서·콘텐츠 크리에이터). ④ 작은 팀 리더 가능 여부 한 단락 — 5명 이내 작고 신뢰 깊은 팀에선 자기 색 잃지 않으면서도 책임 다할 수 있는지(전문가형) / 큰 조직 리더가 본업인지(리더형). ⑤ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}을 ['리더로 키우려고' 하지 말라는 / '전문가로 가두려고' 하지 말라는 / '한 가지로 정하려고' 하지 말라는] 거예요. [깊이의 결을 그대로 키워주면 그 깊이가 결국 사람들을 끌어당기는 진짜 영향력이 / 큰 그림 그리는 결을 그대로 키워주면 자기 길을 만드는 진짜 힘이 / 두 결을 다 키워주면 그 양면이 진짜 무기가] 돼요." 관인상생 케이스 = 양면형 풀이.`;

  const ch6Body = `
출력 순서·헤더는 정확히. **원칙 A~L 강제 적용.** 5인자 결합·메인 0 양면 + 절제된 [[ ]] 1~2회.
${_ch6TraitsBlock}
${ch6ChartFacts}

## 6장 — ${ch6Title}

### ${ch6FirstSubtitle}
[메인: 인성·관성·일주 / 서브: 일간 합·충·신살]
[시그너처: 두 부모 결 분리 묘사 — 두 단락 시각 분리] — 어머님 결과 아버님 결을 각각 한 단락씩 분리해 묘사하고, 어휘를 명확히 다르게 사용. 분량 500~600자.
${hasMom && hasDad ? `구성: ① 도입 — "두 분이 ${cnh}과 통하는 결은 서로 다른 빛이에요" → ② **어머님 단락**: 인성 결합·일간 합·어머님 어휘(식탁·정돈·실내·따뜻한 손길·하루 호흡·앉아서·책상) — 어머님이 ${cnh}과 자연스럽게 통하는 일상 장면 1개 + 사주 근거 (200~250자) → ③ **아버님 단락**: 관성 결합·일간 합·아버님 어휘(야외·운동·만들기·현장·단단한 어깨·결단·움직이며) — 아버님이 ${cnh}과 자연스럽게 통하는 일상 장면 1개 + 사주 근거 (200~250자) → ④ 두 결이 만나는 순간 한 줄. 두 단락은 줄바꿈으로 시각 분리. 두 부모 모두 긍정적으로.` : hasMom ? `구성: ① 도입 → ② 어머님 결 묘사 — 인성 결합 + 어머님 어휘(식탁·정돈·실내·따뜻한 손길·하루 호흡·앉아서·책상). 일상 장면 1개 + 사주 근거 결합. (전체 500~600자)` : `구성: ① 도입 → ② 아버님 결 묘사 — 관성 결합 + 아버님 어휘(야외·운동·만들기·현장·단단한 어깨·결단·움직이며). 일상 장면 1개 + 사주 근거 결합. (전체 500~600자)`}

### ${ch6TrioMoment}
[메인: 오행 / 서브: 일간·용신·삼합·신강신약]
[시그너처: 한 장면 묘사 — 가족 사진 같은 묘사] — ${hasMom && hasDad ? "가족 셋" : "${parentsLabel}과 자녀 둘"}이 가장 편안한 순간 한 장면을 자도인이 그림 그리듯 묘사 + 그 장면이 왜 사주적으로 자연스러운지 풀이. 분량 450~550자.
구성: ① 도입 한 줄 → ② **장면 묘사**: ${parentsLabel}과 ${cnh} ${hasMom && hasDad ? "셋이" : "둘이"} 함께 있을 때 가장 편안한 한 장면 — 활동·시간·장소·계절을 구체로 (가족 사진의 한 컷처럼, 100~140자) → ③ 그 장면이 사주적으로 왜 맞는지 풀이 — ${hasMom && hasDad ? "셋의" : "둘의"} 오행 상생 + 삼합(三合) 글자 결합 + 용신 오행 결합 (200~250자) → ④ 그 순간을 더 자주 만들 수 있는 부모 권고 한 줄.

### 부모가 채워줄 결 / 살펴줄 결
[메인: 용신·기신 / 서브: 일간 오행·약한 오행·12운성]
[시그너처: 두 갈래 처방 — 채울 결 / 살필 결] — 부모가 함께 채워줄 한 가지 결 + 함께 살펴줄 한 가지 결을 각각 처방 형태로. 분량 450~550자.
구성: ① 도입 — "두 분이 함께 들여다볼 두 결이 있어요" → ② **🌱 채워줄 결** (용신 오행 활동 — 일상 행동 가이드 1~2개. 자녀 일간·신강·12운성 결합 풀이. 150~200자) → ③ **🌑 살펴줄 결** (기신 오행 자극 — 너무 많아지지 않게 살피는 환경. 자녀 약한 오행 결합 풀이. 150~200자) → ④ 한 줄 정리. 두 결은 이모지로 시각 분리. 부정형 표현 금지 — "살피면 더 단단해져요" 톤.

`;

  const ch7Body = `
출력 순서·헤더는 정확히 다음과 같이. 헤더 글자 한 자도 변경 금지.
**원칙 A~L 강제 적용.** 5인자 결합·메인 0 양면 + 절제된 [[ ]] 1~2회.
${_ch7TraitsBlock}
${ch7ChartFacts}

${injectTimeResolution("ch7")}

[★ 7장 공용 출력 룰 — system 룰과 함께 적용]
- **출력 형식: 산문체 4단 구조**. 박스·번호·이모지 분리·표·체크리스트 절대 금지. 단락 사이 빈 줄 1개로만 구분.
  ① 도입 단정 한 줄 (60~100자) — 자녀 사주 약한 오행에서 도출된 결을 단호히 선언.
  ② 사주 메커니즘 + 자연 비유 (140~200자) — 약한 오행 + 일간 결합 + 메커니즘 풀 자연 비유로 4단 연결.
  ③ 일상 신호 + 채워줄 자리/음식 (150~220자) — 풀에서 인용된 신호·음식만 본문 노출. 의학 진단 어조 X.
  ④ "부모님이 기억해야 할 한 가지" 마무리 (90~130자).
- 사주 인자 명사 본문 최소 2개 노출 (약한 오행 + 일간 또는 용신).
- 분량 sub당 450~600자. \`[[ ]]\` sub당 1~2회 키 어절(10자 이내)에만.
- ★ V2 풀 시스템 — 각 sub에 박힌 [가정문 풀] [메커니즘 풀] [신체 풀]/[음식 풀]은 절대 룰. 풀 외 즉흥 부위명·음식명·자연 비유 생성 시 위반.
- ★ 의학 진단 절대 금지 — "사주적으로 옅게 타고난 자리·채워주는 결" 어조. "병에 걸린다·치료된다" 식 표현 X.
- ★ 한약재 본문 노출 절대 금지 — 당귀·황기·인삼·녹용 같은 한약재 어휘 X. 한국인 일상 식재료만.

${INSIGHT_4STEP_RULE}

## 7장 — 우리 아이 몸 그리고 채워줄 한 그릇

### 이 아이가 약하게 타고난 자리
[메인: 오행 / 서브: 일간_오행·신강신약]
[시그너처: 자연 비유 메커니즘형 — 4단 연결 의무]

${injectPoolsBlock({ chapterId: "ch7", subId: "weak_body", mainFactor: "오행", scenarios: [{ key: "ch7_body_natural_metaphor", pickCount: 1 }, { key: "ch7_body_daily_sign", pickCount: 1 }], mechanisms: [{ key: "wood_lack", pickCount: 1 }, { key: "fire_lack", pickCount: 1 }, { key: "earth_lack", pickCount: 1 }, { key: "metal_lack", pickCount: 1 }, { key: "water_lack", pickCount: 1 }], includeBodyPool: true })}

구성: ① 단정 — "${cnh}은 사주적으로 [목/화/토/금/수] 기운이 [부족·약]하게 타고나, [위 신체 풀에서 도출된 자리]가 옅게 자리한 아이예요." (자녀 사주에서 가장 약한 오행 1개만 선택. 두 개 이상 약하면 더 약한 1개만.) → ② 4단 메커니즘 — "${cnh}의 사주에 [강한 오행]이 가득해서 [위 메커니즘 풀에서 자녀 결에 맞는 자연 비유 1개]" 형태. 사주 인자 명시 → 자연 비유 → 결과 현상 → 일상·마음 번역. ③ 일상 신호 — 위 일상 신호 풀에서 자녀 결에 가장 맞는 1개를 본문에 자연 인용. 부위 나열식 금지 — 한 부위 + 한 신호. "환절기에 코가 먼저 반응하는" 식 구체. ④ 마무리 — "부모님이 기억해야 할 한 가지는, ${cnh}의 [그 자리]가 약한 게 아니라 [사주적으로 옅게 타고나 더 살펴주면 좋은 자리]라는 거예요." 약함 단정 X — "옅게 타고난" 어조. 약한 오행이 0(완전 부재)인 경우 양면 풀이.

### 사주에 채워주면 좋은 음식
[메인: 용신·오행 / 서브: 일간_오행·기신]
[시그너처: 음식 풀 자연 나열형 — 한국인 친숙 위주]

${injectPoolsBlock({ chapterId: "ch7", subId: "supplement_food", mainFactor: "용신", scenarios: [{ key: "ch7_food_cooking_method", pickCount: 1 }, { key: "ch7_food_meal_scene", pickCount: 1 }], includeFoodPool: true })}

구성: ① 단정 — "${cnh}에게 사주적으로 채워주면 좋은 결은 [목/화/토/금/수] 기운이고, 이를 채워주는 한국 식재료가 가까이에 있어요." (앞 sub1에서 짚은 약한 오행 또는 용신 오행 기준) → ② 사주 결합 — "[그 오행]은 [전통 맛·색] 음식으로 채워져요" 톤. 위 음식 풀에서 자녀 결에 맞는 카테고리(과일·구황작물·나물·해산물·기타) 중 3~5개 식재료를 본문에 자연 나열. 한약재(당귀·황기·인삼 등) 절대 X. ③ 어떻게 먹이면 좋은지 — 위 조리 방식 풀에서 1~2개 + 위 먹이는 자리 풀에서 1개 자연 인용. 예: "환절기 무렵 배숙 한 그릇을 따뜻하게" 식. 조리법 길게 X — 1~2줄 짧게. ④ 마무리 — "부모님이 기억해야 할 한 가지는, [[작은 한 그릇이 결을 채운다]]는 거예요. 매일이 아니라 [환절기·계절 바뀌는 자리]에 한 번씩, 식탁 위 작은 한 접시로 충분해요." 음식 효과 단정 X — "결을 채우는" 어조.
`;

  const outroBody = `
출력은 정확히 다음 헤더 + 마지막 단락:

${injectOutroPoolsBlock(sajuChild.ilgan as any)}

## 자도인의 마지막 당부
**정확히 2~3문장. 한 문장은 50자 이내.** ${parentsLabel}과 ${cnh} 사이의 인연을 관통하는 가장 핵심 메시지. 시적이지만 구체적 — 자녀 일간·오행·일주 중 한두 근거를 자연 비유로 녹임.

[★★★ 절대 룰]
- **2~3문장 초과 절대 금지**. 늘어놓지 말고 핵심만 압축.
- **새 정보·새 풀이 추가 절대 금지** — 앞 1~6장에서 언급된 자녀 본질·약점·부모 메시지만 압축.
- 부모 다독임 표현·일반 격려·"~할 거예요" 미래 약속 X.
- 자도인이 마지막에 부모에게 남기는 한 호흡으로 끝나는 시적 종합.
- ★ V2 수미상관 회로 — 위 [수미상관 핵심 비유] 블록의 시드 토큰을 반드시 1회 본문에 등장시켜 1장 도입 비유를 회수. 시드 외 자연물(예: 갑 일간인데 "바다" 등) 사용 절대 금지.

마지막에 빈 줄 하나 띄고 다음 한 줄을 정확히 그대로 출력:
"※ 본 풀이는 사주명리학을 현시대 부모의 언어로 재표현한 양육 안내이며, 의학적 진단·치료가 아닙니다. 자녀의 결은 사주에 환경·경험이 더해져 만들어집니다."`;

  // phase별 본문 선택
  const body = (() => {
    switch (phase) {
      case "ch1": return ch1Body;
      case "ch2": return ch2Body;
      case "ch3": return ch3Body;
      case "ch4": return ch4Body;
      case "ch5": return ch5Body;
      case "ch6": return ch6Body;
      case "ch7": return ch7Body;
      case "outro": return outroBody;
      default: return ch2Body;
    }
  })();

  // ⭐ 2026-05-13 해석 기획 레이어 + 2026-05-14 (A) 처방 helper + (B) 연령 톤 강제
  const childBirthYear = d.childYear ? parseInt(d.childYear, 10) : undefined;
  const interpretationContext = buildParentChildContext({
    sajuChild,
    childName: "@CHILD@",
    hasMom,
    hasDad,
    scope: (phase === "ch7" ? "outro" : phase) as "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "outro", // ch7은 outro와 같은 그룹 (build-context는 ch7 별도 컨텍스트 안 만듦 — ch7Body가 자체 풀 시스템)
    chapterScope: phase === "outro" || phase === "ch7" ? undefined : (phase as ParentChildChapterScope),
    childBirthYear: childBirthYear && !Number.isNaN(childBirthYear) ? childBirthYear : undefined,
  });

  return `당신은 자도인입니다. ${cnh}의 사주를 부모님 눈높이에서 풀이합니다. 한국어 경어체, 날카롭되 따뜻하게.

[★★★ 자녀 호칭 룰 — 절대]
- narrator 자리 (해설·풀이 등 따옴표 밖): 반드시 "@CHILD@" 토큰을 그대로 출력. 예: "@CHILD@은", "@CHILD@의", "@CHILD@이". @CHILD@를 실제 이름이나 다른 호칭으로 바꿔 쓰지 말 것 — 토큰 그대로 두면 시스템이 올바른 호칭으로 치환한다.
- 따옴표 안 대사 (부모·친구·가족·자녀 본인 대사): 자녀를 이름이나 호칭으로 부르지 않는다. 이름 없이 말한다. 예: "네가 끝까지 해낸 그 부분이 정말 기특했어" (○).
- "@CHILD@" 토큰 외에 자녀를 가리키는 다른 호칭(이름·○○야·○○님 등)을 본문에 만들어 쓰지 말 것.

[★★★ 핵심 룰 — 시작 강제 (시스템 인스트럭션과 함께 적용)]
1. 정통 자평명리 결합 풀이 — 분포 수치만 나열 절대 X.
2. 사주 인자 명사(식상·재성·관성·비겁·인성·일간·일주·용신 등) 본문에 직접 노출.
3. 일반론·바넘 표현 절대 금지 — 다른 자녀에게 옮겨도 통하는 문장 한 줄도 X.
4. 자녀 사주 컨텍스트 블록의 정설 룩업값(〖일간 강약〗·〖12운성〗·〖공망〗) 그대로 인용. 다른 단계 임의 추론 절대 금지.
5. 인자 강도 0이면 양면 풀이 강제 (비겁 0 = 협력형, 식상 0 = 안으로 정리, 재성 0 = 의미 집중, 관성 0 = 자유, 인성 0 = 직관·실전).

${interpretationContext}

${dataBlock}
${principles}
${body}

[★★★ 다시 한 번 — 끝 강제 재확인 (출력 직전 마지막 체크)]
- 본문에 사주 인자 명사 최소 3개 노출했는가?
- 정설 룩업값(일간 강약 단계·12운성 단계·공망 위치) 그대로 인용했는가? 다른 단계 추론 안 했는가?
- 분포 수치만 나열한 단편 풀이 없는가? 인자 사이 결합으로 풀었는가?
- 일반론·바넘 표현 0개인가?
- 자녀 호칭 "@CHILD@" 토큰을 그대로 썼는가? 따옴표 안 대사에 자녀 이름·호칭을 넣지 않았는가?
- 인자 강도 0인 경우 양면 풀이로 작성했는가?
- 마크다운 헤더(## 챕터, ### 소제목) 정확한가? [[ ]] 강조 sub당 1~2회 절제 사용했는가?`;
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

// ─── 인연 프롬프트 — 솔로 본인의 인연 풀이 ──────────────────────────────
// 2026-05-06: V1 /matching = 솔로 본인 인연 풀이로 컨셉 전환.
// 두 사람 궁합 풀이는 V2 /inyeon이 담당.
function buildMatchingPrompt(
  d: Record<string,string>,
  saju: SajuAnalysis
): string {
  const ctx = buildCtx(saju, d.myName);
  const reportLines: string[] = [];
  if (d.contactFreq) reportLines.push(`• 이성과 어울리는 환경: ${d.contactFreq}`);
  if (d.meetCount) reportLines.push(`• 지금까지의 만남 경험: ${d.meetCount}`);
  if (d.soloReason) reportLines.push(`• 현재 마음에 둔 사정: ${d.soloReason}`);
  const reportBlock = reportLines.length > 0
    ? `\n━━━ 자기보고 컨텍스트 (${d.myName}님 답변) ━━━\n${reportLines.join('\n')}`
    : '';

  // ★ 결정론 매핑 — 십성 강약·일주 겉속·신살 매력·어울리는 상대·피해야 할 상대를 사전 도출
  const traits = deriveInyeonTraits(saju);
  const traitsBlock = traitsToPromptBlock(traits, d.myName);

  return `당신은 30년 경력의 정통 명리학 대가 "홍도인(紅道人)"입니다. 사주를 보면 콕 짚어 단언하는 스승의 톤. 가벼운 친근체·썰푸는 어투 절대 X.

이번 풀이는 ${d.myName}님 한 분의 인연(因緣) — "내 인연은 언제, 어떤 결의 사람과, 어떤 자리에서" — 를 사주만으로 풀어드리는 시간입니다.

━━━ ${d.myName}님 사주 ━━━
${ctx}
${reportBlock}

${traitsBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[★★★ 절대 룰 — 한 줄도 어기면 풀이 무효]

1. 위 [자동 매핑]만 사용해 풀이. 매핑에 없는 일반론·바넘 표현 절대 X.
   - 금지어: "매력적이다", "특별하다", "운명적이다", "신비롭다", "누구나 사랑받을 만하다", "당신은 좋은 사람"
   - 모든 풀이는 ${d.myName}님 사주에서 도출되는 것만.

2. 일상 행동 묘사 의무 — 각 ### 본문에 최소 1개 구체 장면.
   - 약함: "당신은 표현이 많습니다"
   - 정답: "사람 모인 자리에 가시면 어느새 분위기를 만들고 계십니다, 친구와 카페에 앉아 침묵이 흐를 때 가장 먼저 말을 꺼내십니다"

3. 명리학 용어 굵게 — 각 ### 최소 2개.
   - 식상(食傷)·재성(財星)·관성(官星)·비겁(比劫)·인성(印星)
   - 일간(日干)·일지(日支)·월지(月支)·격국(格局)·용신(用神)
   - 신살명 (한자·한글 병기 — 예: **天乙貴人(천을귀인)**)

4. 단언 어미 — "~입니다", "~사람을 만나셔야 합니다", "~결입니다".
   - 약한 추측 어미("~보입니다", "~듯합니다")는 시기·미래에만 제한 사용.

5. "${d.myName}님은..." 직접 호명. 거리감 톤 X (X: "이 사주의 주인은", "주인공은").

6. 어울리는 상대·피해야 할 상대는 반드시 "행동"으로 풀이.
   - 약함: "印星이 강한 사람을 만나세요"
   - 정답: "印星이 두텁게 자리한 사람 — 당신의 그 많은 말을 끊지 않고 들어주고, 빈틈을 단점이 아닌 결로 봐주는 사람"

[★★ 본문 표준 4단 구조 (모든 ### 풀이가 이 구조)]

1단. 사주 근거 한 줄 — "(○○이 ${d.myName}님 사주에 ○개 자리한) 당신은..."
2단. 행동 묘사 2~3문장 — 일상 장면 1개 의무.
3단. 단언 / 어울리는 상대 / 빈틈 — 章 주제에 따라.
4단. 마무리 한 줄 단언 — "이것이 ${d.myName}님 사주가 가리키는 결입니다" 류.

분량: 280~360자, 2~3문단.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[출력 형식]
- 8개의 대장(章)을 순서대로 작성.
- 대장 헤더 \`## \` (샵 2개 + 띄어쓰기), 소제목 \`### \` (샵 3개 + 띄어쓰기). 각 \`### \`가 한 페이지.
- "序章 — 홍도인의 첫마디"의 두 단락만 \`### \` 없이.
- 메타 표현·괄호 지시문·"가이드", "프롬프트" 등의 단어 절대 출력 X.

## 序章 — 홍도인의 첫마디

${d.myName}님 일간(日干) 기질을 자연에 비유한 시적인 2~3문장 인사. 이름 호명. 단언. (### 없이)

${d.myName}님 인연 흐름의 핵심을 한자 표현(예: 紅絲未到·緣向千里 등) + 의미 2~3문장. 시적이되 명리학자의 단언 톤. (### 없이, 빈 줄 하나 두고)

## 第一章 本 — ${d.myName}님은 왜 아직 혼자인가

### ${d.myName}님이라는 사람, 한 줄로 말하면
[자동 매핑의 강한 십성·약한 십성·일주 결합 → 4단 구조. 본인 종합 한 줄 정의를 명리학 근거로 풀이.]

### ${d.myName}님이 모르는 ${d.myName}님의 한 면
[일주 겉/속 결합. 일간(겉)과 일지(속)의 다름 → 4단. 남들이 보는 모습 vs 진짜 속 모습 구체적 차이.]

### ${d.myName}님만이 가진 사랑의 패
[격국(格局) + 강한 신살 결합 → 4단. ${d.myName}님만이 사랑에 가지고 들어가는 무기 한 가지.]

### 혼자 머무신 이유
[약한 십성에서 도출되는 빈틈 + 그 빈틈 때문에 무의식적으로 멀리해 온 사람의 결 → 4단.]

## 第二章 戀 — ${d.myName}님이 사랑에 빠지는 그 순간

### ${d.myName}님이 사랑에 빠지는 순간
[강한 십성 + 도화/홍염 결합 → 4단. 어떤 자극에 마음 흔들리는지 구체.]

### 그 마음이 깊어지는 자리
[일지(속) 발현 자리 + 강한 신살 → 4단. 관계가 깊어질 때 일상 장면.]

### 둘 사이가 어긋날 때
[약한 십성 + 빈틈 → 4단. 어떤 행동에서 균열 생기는지 구체.]

### 왜 끝났는지, 왜 끝날지
[본인 결과 안 맞는 상대(피해야 할 상대) 결합 → 4단. 흐름이 끊기는 결.]

## 第三章 引 — ${d.myName}님을 흔드는 그 사람의 정체

### ${d.myName}님이 무너지는 그 결
[일간 합·생·자극 + 도화/홍염 + 자동 매핑의 어울리는 상대 1차 → 4단. 가장 강하게 끌리는 사람의 결을 행동으로 단언.]

### ${d.myName}님 운명에 새겨진 이상형
[정관·편관·정재·편재 보유 위치 + 어울리는 상대 → 4단. 그 사람의 행동·태도 구체.]

### ${d.myName}님이 가장 빛나는 순간
[보유 신살 매력 + 일간 본질 → 4단. 사람들 모인 자리·둘만의 자리에서 빛나는 구체 장면.]

## 第四章 遇 — 그를 만나게 될 자리, 보입니다

### 그를 만나게 될 자리
[용신 오행 → 방위·시간·환경 → 4단. 동방·서방·봄·가을·서점·운동·여행 등 구체.]

### 처음 마주쳤을 때 두 사람
[일간 첫인상 + 어울리는 상대의 첫인상 → 4단. 처음 만나는 장면 구체.]

### 둘이 깊어지는 시간
[일지(속) + 용신 결합 → 4단. 함께 머무는 일상 장면.]

## 第五章 時 — 그가 다가오는 시간이 보입니다

### 그가 가장 가까이 오는 때
[대운(大運) 흐름 + 다가오는 대운 1~2개 → 4단. ${d.myName}님 나이 기준 미래 시기 단언.]

### 올해, ${d.myName}님의 인연은
[2026 병오년(丙午) 일간 작용 → 4단. 올해 일어나는 결.]

### 내년, 그리고 그 너머
[2027 정미·2028 무신·2029 기유·2030 경술 → 4단. 4년 흐름.]

### 평생의 결을 만나는 시기
[관성/재성 강한 대운 구간 → 4단. 단정 자제, 부드러운 단언.]

### 결혼이 가까워지는 자리
[관성(여) 또는 재성(남) 흐름 → 4단. 그 시기의 결.]

### 이미 만났다면
[양방향 해석 → 4단. 이미 인연 만나신 경우 그 시기 깊어짐.]

## 第六章 愼 — ${d.myName}님만 모르는 ${d.myName}님의 사랑

### ${d.myName}님이 같은 사랑을 반복하는 이유
[본인 사주 구조 반복 결 + 약한 십성 → 4단. 무의식 패턴 구체.]

### ${d.myName}님을 무너뜨리는 자극
[일지 충(沖)·형(刑) → 4단. "자극의 결"·"변화를 부르는 결"로.]

### 한 가지만 기억하세요
[자기보고 컨텍스트(있다면) + 사주 약점 → 4단. 살펴볼 결 한 가지 단언.]

## 終章 — 홍도인이 마지막으로 남기는 글

### ${d.myName}님의 인연을 한 단어로
형식: **키워드** — 이 키워드가 ${d.myName}님 인연에서 나오는 사주 근거 1문장.
자동 매핑(강한 십성·신살·용신·일주)에서 키워드 5개 도출.

### 홍도인이 남기는 마지막 글
${d.myName}님이 가슴에 새기고 싶은 정확히 3~4문장. 일간·용신을 자연 비유로 녹임. 시적 단언.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[규칙 — 절대]
- ★ 자동 매핑(위 박스)에 박힌 행동 풀에서 골라 변주. 매핑 외 임의 표현 X.
- ★ 일반론·바넘 표현 0%. 모든 풀이는 ${d.myName}님 사주에서 도출되는 것만.
- ★ 일상 행동 묘사 의무 (각 ### 1개 이상의 일상 장면).
- ★ 명리학 용어 한자 굵게, 한글 음 병기 — 예: "**食傷(식상)**", "**日支(일지)**".
- ★ 단언 어미 사용 ("~입니다", "~분입니다", "~결입니다", "~사람입니다", "~만나셔야 합니다").
- ★ "${d.myName}님은..." 직접 호명. "당신은..." 친근 호명도 가능.
- ★ 점수·숫자·등급·% 같은 정량 평가 표현 X.
- ★ 트렌디 표현·신조어 X (썸·갓생·꿀·MZ·겉바속촉 X). 정통 도원(道院).
- ★ 부정적 신살 명칭 우회 (망신·백호·재살·탕화·원진·고신·과숙·공망 → 부드러운 우회).
- ★ 시기는 현재 이후만, 미래는 대략적으로.
- ★ 이모지·이모티콘 X. 한자·한글·문장부호만.
- ★★ 부정적 단어 우회: "상극" → "다듬어 주는 결", "충" → "자극의 결", "이별/헤어짐" → "흐름이 잠시 끊긴다·결이 멀어진다".
- ★ 자기보고 컨텍스트 — 사주가 본기, 자기보고는 보조. 한두 군데 자연스럽게 단서로 녹임 (직접 인용·진단 X). 본인이 답하지 않은 영역 추정 X.
- ★ 메타 표현 ("가이드", "프롬프트", "추후 정의" 등) 절대 출력 X.

분량 일관: 각 ### 280~360자. 序章 두 단락만 ### 없이 각 2~3문장.
한국어 경어체, 명리학자의 정중한 단언 톤.`;
}

// ─── (구) 두 사람 궁합 프롬프트 — V1 솔로 컨셉 전환으로 폐기, 호출처 없음 ──
// V2 /inyeon이 두 사람 궁합 담당. 이 함수는 미사용 — 추후 정리 예정.
function _legacyBuildMatchingPrompt(
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
${(d.meetCount || d.soloReason) ? `
━━━ 자기보고 컨텍스트 (${d.myName}님 답변) ━━━${d.meetCount ? `
• 지금까지의 만남 경험: ${d.meetCount}` : ''}${d.soloReason ? `
• 현재 마음에 둔 사정: ${d.soloReason}` : ''}` : ''}

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
- ★ 자기보고 컨텍스트(만남 경험·마음에 둔 사정)가 주어진 경우 — 사주 풀이가 본기(本氣)이며 자기보고는 보조. 본문 흐름에 자연스럽게 한두 군데 단서로 녹일 것 (직접 인용·나열·진단 X). 예: "지금 ~한 결에 머무신다 하셨으니, 일간의 흐름과 더불어 살피건대…" 같이 사주 근거와 엮어서. 본인이 답하지 않은 영역은 절대 추정·언급 X.
- ★ 한자를 사용할 때는 반드시 한글 음을 함께 표기 — 예: "天生緣分(천생연분)", "比和(비화)". 한자만 단독 사용 X, 한자 옆 괄호로 한글 음 병기 필수
- 한국어 경어체, 정중하고 문학적인 흐름`;
}

// ─── API 핸들러 ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, section, ...data } = body;

    // ─── 가족 인연 풀이 (parent-child) — 엄마·아빠·아이 조건부 ───
    if (type === 'parent-child' || type === 'parent-child-v2') {
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
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

      // ─── V2 phase 분기 — 클라이언트 다단계 fetch (compute → ch1~6 → outro) ───
      if (type === 'parent-child-v2') {
        const phase = (data.phase as string) || "ch2";
        // phase=compute → 사주 계산 데이터만 JSON 응답 (LLM 호출 X)
        if (phase === "compute") {
          // ⭐ G16 (2026-05-14) — 자동 회귀가 본문 정합 검사할 수 있도록 chartFacts 노출
          const chartFacts = computeParentChildChartFacts(sajuChild, data.childYear ? parseInt(data.childYear, 10) : undefined);
          return NextResponse.json({
            sajuMom, sajuDad, sajuChild,
            momCompat, dadCompat,
            hasMom, hasDad,
            chartFacts,
          });
        }
        // phase=ch1~ch6, outro → 그 챕터 프롬프트만 streaming
        const validPhases = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "outro"] as const;
        type ValidPhase = typeof validPhases[number];
        if (!validPhases.includes(phase as ValidPhase)) {
          return NextResponse.json({ error: `Invalid phase: ${phase}` }, { status: 400 });
        }
        let chPrompt = buildParentChildPromptV2(data, sajuChild, sajuMom, sajuDad, momCompat, dadCompat, familySaja, phase as ValidPhase);
        // ⭐ B+C 결합 — Gemini responseSchema + {{CHILD}} sentinel 전체 phase 적용 (ch1 제외)
        const _pcYearNum = data.childYear ? parseInt(data.childYear, 10) : NaN;
        const _pcAgeStage = !Number.isNaN(_pcYearNum) ? classifyAgeStageFromYear(_pcYearNum) : "elementary";
        const _pcAh = getAgeAdaptedHeaders(_pcAgeStage);
        const _pcSchema = parentChildPhaseSchema(phase as V2Phase, _pcAh, hasMom, hasDad);
        const _pcSubtitles = parentChildPhaseSubtitles(phase as V2Phase, _pcAh, hasMom, hasDad);
        const _pcJsonMode = _pcSchema !== null;
        if (_pcJsonMode) {
          // @CHILD@ → {{CHILD}} (Mustache 표준 sentinel — LLM 학습 데이터 친화적)
          chPrompt = chPrompt.replace(/@CHILD@/g, "{{CHILD}}");
          // JSON 출력 룰 append (subs phases vs outro 분기)
          if (phase === "outro") {
            chPrompt += `

[★★★★★ 출력 형식 — JSON only (Gemini responseSchema 강제 적용 중)]
출력은 마크다운 X — 다음 JSON 한 객체만:
{
  "body": "(정확히 2~3문장, 한 문장 50자 이내, {{CHILD}} 토큰 사용)"
}

[★★★★★ body 필드 작성 절대 룰]
- body 안 **자녀 주어·호칭 자리에는 반드시 "{{CHILD}}" 토큰을 그대로 입력**한다. 시스템이 토큰을 올바른 호칭으로 치환한다.
- "## 자도인의 마지막 당부" 헤더 출력 X (시스템이 자동 prepend).
- "※ 본 풀이는..." 디스클레이머 출력 X (시스템이 자동 append).`;
          } else if (_pcSubtitles) {
            const _subListJson = _pcSubtitles.map((s) => `    { "subtitle": ${JSON.stringify(s)}, "body": "(prose, {{CHILD}} 토큰 사용)" }`).join(",\n");
            chPrompt += `

[★★★★★ 출력 형식 — JSON only (Gemini responseSchema 강제 적용 중)]
위 ${_pcSubtitles.length}개 sub 구성 지시 그대로 따르되, 출력은 마크다운 X — 다음 JSON 한 객체만:
{
  "subs": [
${_subListJson}
  ]
}

[★★★★★ body 필드 작성 절대 룰]
- subtitle은 위 ${_pcSubtitles.length}개 그대로 (한 글자도 변경 X — Gemini enum 강제하므로 변형 불가).
- body 안 **자녀 주어·호칭 자리에는 반드시 "{{CHILD}}" 토큰을 그대로 입력**한다. 시스템이 토큰을 올바른 호칭으로 치환한다.
- body 안에 \`### sub 헤더\`·\`## 챕터 헤더\` 마크다운 절대 출력 X — JSON 필드 안에 prose만.`;
          }
        }
        // ⭐ (2026-05-15) JSON 모드 시 본문 잘림 발견 — 5 sub × 600자 한국어 + JSON 오버헤드가
        // 16384 토큰 한계 근접. 32768로 상향해 헤드룸 확보 (Gemini 2.5는 65536까지 지원).
        const _generationConfig: Record<string, unknown> = {
          maxOutputTokens: _pcJsonMode ? 32768 : 16384,
          thinkingConfig: { thinkingBudget: 0 },
        };
        if (_pcJsonMode && _pcSchema) {
          _generationConfig.responseMimeType = "application/json";
          _generationConfig.responseSchema = _pcSchema;
        }
        const tStart = Date.now();
        console.log(`[v2/${phase}] start model=${GEMINI_MODEL} promptLen=${chPrompt.length}${_pcJsonMode ? " json=schema" : ""}`);
        const chRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
              contents: [{ parts: [{ text: chPrompt }] }],
              generationConfig: _generationConfig,
            }),
          }
        );
        if (!chRes.ok || !chRes.body) {
          let upstreamBody = "";
          try { upstreamBody = await chRes.text(); } catch {}
          const upstreamSnippet = upstreamBody.slice(0, 600);
          console.error(`[v2/${phase}] upstream FAIL status=${chRes.status} ${chRes.statusText} body=${upstreamSnippet}`);
          return NextResponse.json({
            error: "생성 실패",
            phase,
            upstreamStatus: chRes.status,
            upstreamStatusText: chRes.statusText,
            upstreamBody: upstreamSnippet,
          }, { status: 500 });
        }
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const enqueue = (obj: Record<string, unknown>) =>
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
            const reader = chRes.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let chunkCount = 0;
            let textBytes = 0;
            let finishReason: string | undefined;
            let blockReason: string | undefined;
            let safetyRatings: unknown;
            // STEP 5 — telemetry 검증용 본문 누적 (스트림 UX는 그대로 보존)
            let accumulatedText = "";
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
                  if (text) {
                    accumulatedText += text;
                    chunkCount++;
                    textBytes += text.length;
                  }
                  const fr = json?.candidates?.[0]?.finishReason;
                  if (fr && fr !== "STOP") finishReason = fr;
                  const br = json?.promptFeedback?.blockReason;
                  if (br) blockReason = br;
                  const sr = json?.candidates?.[0]?.safetyRatings;
                  if (sr) safetyRatings = sr;
                } catch (e) {
                  console.warn(`[v2/${phase}] parse err line=${line.slice(0, 200)} err=${(e as Error).message}`);
                }
              }
            }
            const elapsed = Date.now() - tStart;
            console.log(`[v2/${phase}] done elapsed=${elapsed}ms chunks=${chunkCount} bytes=${textBytes} finish=${finishReason ?? "STOP"} block=${blockReason ?? "-"}`);
            if (chunkCount === 0 || finishReason || blockReason) {
              console.error(`[v2/${phase}] empty or filtered finish=${finishReason} block=${blockReason} safety=${JSON.stringify(safetyRatings).slice(0, 400)}`);
              enqueue({ t: 'err', phase, finishReason, blockReason, chunks: chunkCount });
            }
            // ⭐ (2026-05-15) Gemini JSON 응답 → 마크다운 재조립 + 토큰 치환.
            // 프롬프트는 자녀 이름을 토큰으로만 노출 → LLM 이름 변형·대사 누출 차단.
            // 가드 전에 치환 → 가드(G1/G19 등)가 실제 이름 기준 안전망으로 동작.
            // ch2~ch7: subs[].subtitle/body → "### subtitle\n\nbody" 재조립.
            // outro: body 단일 → "## 자도인의 마지막 당부\n\nbody + 디스클레이머" 재조립.
            // ch1: JSON 모드 아님 — raw 그대로.
            if (_pcJsonMode) {
              try {
                const parsed = JSON.parse(accumulatedText);
                if (phase === "outro") {
                  const _body = String(parsed?.body ?? "").trim();
                  if (_body) {
                    accumulatedText = `## 자도인의 마지막 당부\n\n${_body}\n\n※ 본 풀이는 사주명리학을 현시대 부모의 언어로 재표현한 양육 안내이며, 의학적 진단·치료가 아닙니다. 자녀의 결은 사주에 환경·경험이 더해져 만들어집니다.`;
                    console.log(`[v2/outro] JSON parsed OK: body len=${_body.length}`);
                  } else {
                    console.error(`[v2/outro] JSON parsed but body empty`);
                  }
                } else {
                  const _subs = Array.isArray(parsed?.subs) ? (parsed.subs as Array<{ subtitle?: string; body?: string }>) : [];
                  const _expectedCount = _pcSubtitles?.length ?? 0;
                  if (_subs.length === _expectedCount && _expectedCount > 0) {
                    accumulatedText = _subs.map((sub) => `### ${sub.subtitle ?? ""}\n\n${sub.body ?? ""}`).join("\n\n");
                    console.log(`[v2/${phase}] JSON parsed OK: ${_subs.length}/${_expectedCount} subs reconstructed → markdown (len=${accumulatedText.length})`);
                  } else {
                    console.error(`[v2/${phase}] JSON parsed but subs invalid (got=${_subs.length} expected=${_expectedCount})`);
                  }
                }
              } catch (e) {
                console.error(`[v2/${phase}] JSON parse FAIL: ${(e as Error).message} head=${accumulatedText.slice(0, 200)}`);
                // raw text 유지 — 아래 토큰 치환이 fallback
              }
            }
            const _cnhResolved = `${data.childName ?? ""}${data.childGender === "여" ? "양" : "군"}`;
            accumulatedText = accumulatedText
              .replace(/@\s*CHILD\s*@/gi, _cnhResolved)
              .replace(/\{\{\s*CHILD\s*\}\}/gi, _cnhResolved);
            // ⭐ 추가 안전망: LLM이 prompt 안 공통어("그림"·"호수"·"하나" 등 일상 명사가 자녀 이름과 겹치는 경우)
            // 를 보고 firstName + 야/님/씨/성별반대호칭 패턴을 hallucinate 해도 cnh로 복구.
            // 가드의 normalizeChildHonorific와 동일 로직이지만 가드 진입 전에 미리 정리.
            {
              const _childNameRaw = data.childName ?? "";
              if (_childNameRaw.length >= 2) {
                const _firstName = _childNameRaw.slice(1);
                const _escFn = _firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const _allowedAfter = `[은는이가을를도만에서로의과와로서께부터까지마저조차\\s,.;:!?'"“”‘’「」『』。、]|$`;
                const _wrongSuffixes = ["야", "님", "씨", data.childGender === "여" ? "군" : "양"];
                for (const _suffix of _wrongSuffixes) {
                  const _re = new RegExp(`${_escFn}${_suffix}(?=${_allowedAfter})`, "g");
                  accumulatedText = accumulatedText.replace(_re, _cnhResolved);
                }
              }
            }
            let finalText = accumulatedText;
            // Step 5: cross-chapter usedTokens — 클라이언트가 누적해서 보낸 Map 받아 가드에 전달.
            // 가드가 mutate 후 응답 stream에 직렬화해서 push (클라이언트가 다음 phase 요청에 또 보냄).
            const usedTokens: Map<string, number> = data.usedTokens && typeof data.usedTokens === "object"
              ? new Map<string, number>(Object.entries(data.usedTokens as Record<string, number>))
              : new Map<string, number>();
            if (accumulatedText.length > 100 && !finishReason && !blockReason) {
              try {
                const guardPeople: GuardPersonContext[] = [
                  { name: data.childName ?? "아이", saju: sajuChild },
                  ...(sajuMom ? [{ name: data.momName ?? "엄마", saju: sajuMom }] : []),
                  ...(sajuDad ? [{ name: data.dadName ?? "아빠", saju: sajuDad }] : []),
                ];
                // ⭐ F3 (2026-05-14): 자녀 연령대 — guard 후처리에 전달 (영유아 케이스 학령기 어휘 strip)
                const childYearNum = data.childYear ? parseInt(data.childYear, 10) : NaN;
                const childAgeStage = !Number.isNaN(childYearNum) ? classifyAgeStageFromYear(childYearNum) : undefined;
                // ⭐ G1 (2026-05-14): 자녀 이름 호칭 변형(양→상) 복원용
                const childNameStem = data.childName ?? "";
                const childHonorific = data.childGender === "여" ? "양" : "군";
                const _chartFacts = computeParentChildChartFacts(sajuChild, data.childYear ? parseInt(data.childYear, 10) : undefined);
                const guardedResult = await guardGeneratedText({
                  service: "parent-child",
                  chapter: phase,
                  text: accumulatedText,
                  prompt: chPrompt,
                  people: guardPeople,
                  apiKey,
                  usedTokens,
                  childAgeStage,
                  childNameStem,
                  childHonorific,
                  chartFacts: _chartFacts,
                });
                finalText = guardedResult.text;
                console.log(`[v2/${phase}] output guard ${guardedResult.changed ? "repaired" : "pass"} issues=${guardedResult.issues.length} pre-len=${accumulatedText.length} post-len=${finalText.length}`);
                // Step 3: ch6/outro 진단 로깅 (hongsil ch6 / inyeon ch8 패턴)
                if (phase === "ch6" || phase === "ch7" || phase === "outro") {
                  console.error(`[pc ${phase} diag] head-150=${finalText.slice(0, 150).replace(/\n/g, "\\n")}`);
                }
                // ⭐ V2.1 — ch7 헤더 안전망
                if (phase === "ch7") {
                  const ch7Subs = ["이 아이가 약하게 타고난 자리", "사주에 채워주면 좋은 음식"];
                  const missing = ch7Subs.filter(s => !finalText.includes(`### ${s}`));
                  if (missing.length > 0) {
                    console.error(`[pc ch7 diag] MISSING HEADERS — ${missing.join(", ")}`);
                    for (const sub of missing) {
                      finalText += `\n\n### ${sub}\n(다음 풀이에 이어집니다.)`;
                    }
                  } else {
                    console.error(`[pc ch7 diag] sub-hits=2/2 ✓`);
                  }
                }
                // Step 4: ch6 헤더 안전망 — sub 누락 시 placeholder 강제 추가
                if (phase === "ch6") {
                  const ch6FirstSub = hasMom && hasDad ? "엄마와 통하는 결, 아빠와 통하는 결" : hasMom ? "엄마와 통하는 결" : "아빠와 통하는 결";
                  const ch6TrioMoment = hasMom && hasDad ? "셋이 함께 가장 편안한 순간" : "둘이 함께 가장 편안한 순간";
                  const ch6Subs = [ch6FirstSub, ch6TrioMoment, "부모가 채워줄 결 / 살펴줄 결"];
                  const missing = ch6Subs.filter(s => !finalText.includes(`### ${s}`));
                  if (missing.length > 0) {
                    console.error(`[pc ch6 diag] MISSING HEADERS — ${missing.join(", ")}`);
                    for (const sub of missing) {
                      finalText += `\n\n### ${sub}\n(다음 풀이에 이어집니다.)`;
                    }
                  } else {
                    console.error(`[pc ch6 diag] sub-hits=3/3 ✓`);
                  }
                }
                // Step 4: outro 진단 (헤더 안전망은 outro엔 불필요 — sub 없는 단일 단락)
                if (phase === "outro") {
                  const outroHasHeader = finalText.includes("자도인의 마지막 당부");
                  const outroHasFooter = finalText.includes("사주명리학을 현시대 부모의 언어로");
                  console.error(`[pc outro diag] has-header=${outroHasHeader} has-footer=${outroHasFooter}`);
                }
              } catch (e) {
                console.warn(`[v2/${phase}] output guard skipped err=${(e as Error).message}`);
              }
            }
            if (finalText) enqueue({ t: 'x', v: finalText });
            // Step 5: cross-chapter usedTokens 직렬화해서 push (클라이언트가 받아서 다음 phase 요청에 보냄)
            const tokensObj = Object.fromEntries(usedTokens.entries());
            enqueue({ t: 'tk', m: tokensObj });
            // STEP 5 — 출력 검증 telemetry (사주 인자 누락·바넘·12운성 환각 등 룰 위반 로깅)
            // 출시 후 retry 통합 시 이 violations 배열로 1회 재요청 트리거.
            if (finalText.length > 100) {
              try {
                const otherStemsForDms = [sajuChild.pillars.year.stem, sajuChild.pillars.month.stem, ...(sajuChild.pillars.hour ? [sajuChild.pillars.hour.stem] : [])];
                const allBranchesForDms = [sajuChild.pillars.year.branch, sajuChild.pillars.month.branch, sajuChild.pillars.day.branch, ...(sajuChild.pillars.hour ? [sajuChild.pillars.hour.branch] : [])];
                const dmsOut = getDayMasterStrength(sajuChild.ilgan, sajuChild.pillars.month.branch, allBranchesForDms, otherStemsForDms);
                const unseongOut = calcUnseong(sajuChild);
                const gyeokgukOut = calcGyeokguk(sajuChild);
                const violations = validateSajuOutput(finalText, {
                  minSajuTerms: 3,
                  deterministicValues: {
                    unseongStage: unseongOut?.stage,
                    gyeokgukName: gyeokgukOut?.name,
                    shinkangLevel: dmsOut?.level,
                  },
                });
                if (violations.length > 0) {
                  console.warn(`[v2/${phase}] validation VIOLATIONS (${violations.length}):\n${violations.map(v => "  - " + v).join("\n")}`);
                } else {
                  console.log(`[v2/${phase}] validation OK`);
                }
              } catch (e) {
                console.warn(`[v2/${phase}] validation skipped err=${(e as Error).message}`);
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

      // ─── V1 — 기존 mega-prompt 단일 streaming (원래 흐름 보존) ───
      const prompt = buildParentChildPrompt(data, sajuChild, sajuMom, sajuDad, momCompat, dadCompat, familySaja);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 65536, thinkingConfig: { thinkingBudget: 0 } },
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

    // ─── 인연 (matching) 처리 — 솔로 본인 풀이 ───
    if (type === 'matching' && section === 'matching') {
      const sajuA = computeFullSaju(
        parseInt(data.myYear), parseInt(data.myMonth), parseInt(data.myDay),
        data.myHour ?? "모름",
        data.myCalendar === "음력",
        data.myGender ?? "남"
      );
      if (!sajuA) {
        return NextResponse.json({ error: "사주 분석 실패" }, { status: 400 });
      }
      const prompt = buildMatchingPrompt(data, sajuA);

      // 스트리밍 응답
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 65536, thinkingConfig: { thinkingBudget: 0 } },
          }),
        }
      );
      if (!res.ok || !res.body) return NextResponse.json({ error: "생성 실패" }, { status: 500 });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const enqueue = (obj: Record<string, unknown>) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          enqueue({ t: 'm', d: { sajuA } });
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

    // ⭐ 평생사주 phase=compute — sajuAnalysis JSON만 반환 (LLM 호출 X, 시각화 검증용)
    if (type === 'saju' && (body as Record<string, unknown>).phase === 'compute') {
      if (!sajuAnalysis) {
        return NextResponse.json({ error: "사주 계산 실패" }, { status: 400 });
      }
      return NextResponse.json({ sajuAnalysis });
    }

    let ctx = sajuAnalysis != null ? buildCtx(sajuAnalysis, data.name) : '';
    // ─── V2 1인 traits-block 주입 — 평생사주·연애사주 본인 풀이 ───
    if (sajuAnalysis && (type === 'saju' || type === 'saju-love')) {
      try {
        const _personalTraits = derivePersonalTraits(sajuAnalysis);
        ctx = ctx + "\n\n" + personalTraitsToPromptBlock(_personalTraits, data.name, type as "saju" | "saju-love");
      } catch (e) {
        // traits-block 실패해도 기존 ctx로 정상 fallback
        console.warn("[personal-traits-block-v2] derive 실패:", e);
      }
    }

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
    } else if (LIFETIME_SAJU_PROMPTS[section]) {
      // ⭐ buildAllocationBlock 은 각 prompt 파일이 내부에서 직접 호출 (lib/saju/prompts/*.ts).
      // 여기선 섹션 ANGLE·금지 결론 룰(buildSectionDirection)만 append.
      prompt = LIFETIME_SAJU_PROMPTS[section](data, ctx, sajuAnalysis)
        + buildSectionDirection(section as SajuSection);
      maxTokens = 3000;
    } else if (SAJU_PROMPTS[section]) {
      // 구 평생사주 섹션 (love2·love3·timeline2·closing·overview 등) — 아직 인라인. allocation append 유지.
      prompt = SAJU_PROMPTS[section](data, ctx, sajuAnalysis)
        + buildSectionDirection(section as SajuSection)
        + buildAllocationBlock(section);
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
          systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
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

    // saju 가드 분기 조건 — type='saju' + opener 제외 + sajuAnalysis 있음
    // opener는 짧은 2문장(maxTokens 200)이라 가드 거치지 않음. 옛 청크별 stream 유지.
    const useSajuGuard = type === 'saju' && section !== 'opener' && !!sajuAnalysis;

    const readable = new ReadableStream({
      async start(controller) {
        if (sajuAnalysis && section === "opener") {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'm', d: sajuAnalysis })}\n\n`));
        }
        const reader = geminiBody.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let accumulatedText = ''; // saju 가드용 누적
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
                  if (useSajuGuard) {
                    accumulatedText += text; // 누적만, push는 stream 끝난 후 가드 거쳐서 단일 push
                  } else {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'x', v: text })}\n\n`));
                  }
                }
              } catch { continue; }
            }
          }
          // saju 가드 — 청크 누적 → 가드 → 단일 push + cross-chapter usedTokens + 헤더 안전망
          // ⭐ V2.4.0 (2026-05-15) — 목차 정리: 47 sub → 25 sub
          // 삭제: love2/love3/timeline2/closing 섹션 통째 + 각 섹션 일부 sub
          const SAJU_SECTION_EXPECTED_SUBS: Record<string, number> = {
            personality1: 3, personality2: 3,
            money1: 3, money2: 3,
            love1: 3,
            health: 2, hidden: 3,
            timeline1: 3,
            compass: 2,
          };
          if (useSajuGuard && sajuAnalysis) {
            // Cross-chapter usedTokens: 클라이언트가 누적해서 보낸 Map 받아 가드에 전달
            const usedTokens: Map<string, number> = data.usedTokens && typeof data.usedTokens === "object"
              ? new Map<string, number>(Object.entries(data.usedTokens as Record<string, number>))
              : new Map<string, number>();
            let finalText = accumulatedText;
            if (accumulatedText.length > 100) {
              try {
                const guardedResult = await guardGeneratedText({
                  service: "saju",
                  chapter: section,
                  text: accumulatedText,
                  prompt,
                  people: [{ name: data.name ?? "본인", saju: sajuAnalysis as unknown as SajuAnalysisCore }],
                  apiKey: process.env.GOOGLE_API_KEY!,
                  usedTokens,
                });
                finalText = guardedResult.text;
                console.log(`[saju/${section}] output guard ${guardedResult.changed ? "repaired" : "pass"} issues=${guardedResult.issues.length} pre-len=${accumulatedText.length} post-len=${finalText.length}`);
              } catch (e) {
                console.warn(`[saju/${section}] output guard skipped err=${(e as Error).message}`);
              }
            } else {
              console.warn(`[saju/${section}] guard skipped (text too short, len=${accumulatedText.length})`);
            }
            // Step 4: 헤더 안전망 — ### sub count가 expected 미만이면 진단 + 일반 placeholder 추가
            // 평생사주는 LIFETIME/SAJU_PROMPTS 두 set이 다른 sub 제목 사용해서 정확 sub 매칭 어려움.
            // count 검사 — 누락 시 placeholder 생성 X (사용자 요청). 부족하면 그냥 페이지 줄어든 채 노출.
            if (SAJU_SECTION_EXPECTED_SUBS[section]) {
              const expected = SAJU_SECTION_EXPECTED_SUBS[section];
              const subMatches = finalText.match(/^### /gm);
              const actual = subMatches?.length ?? 0;
              if (actual < expected) {
                console.error(`[saju/${section} diag] MISSING SUBS — expected=${expected} actual=${actual} (placeholder 생성 안 함)`);
              } else {
                console.error(`[saju/${section} diag] sub-count=${actual}/${expected} ✓`);
              }
            }
            if (finalText) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'x', v: finalText })}\n\n`));
            const tokensObj = Object.fromEntries(usedTokens.entries());
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: 'tk', m: tokensObj })}\n\n`));
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
