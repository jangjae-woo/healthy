"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PaymentModal from "@/components/PaymentModal";
import OpeningVideo from "@/components/OpeningVideo";
// ⭐ Step D (2026-05-13) — parent-child 시각화 컴포넌트 평생사주 톤으로 포팅
import {
  SajuElementsRadar,
  SajuElementsSpectrum,
  SajuSipseongRadar,
  SajuSipseongSpectrum,
  SajuYongsinCard,
  SajuKeywordCard,
  SajuTalentTop3,
  SajuMoneyMeter,
  SajuLifeWealthCurve,
  SajuJobRadar,
  SajuHealthMap,
  SajuSinsalCards,
  SajuDaeunTimeline,
  SajuSeunGrid,
  countSipseongFromSaju,
} from "@/components/SajuVisuals";
import {
  type SajuAnalysis,
  getSipseong,
  STEM_HANJA, BRANCH_HANJA, SIPSEONG_COLOR, SINSAL_INFO,
} from "@/lib/saju-calculator";

const ACCENT = "#c9960c";
const BG     = "#0d1a0f";
const SAJU_GREEN = "#12351f";
const SAJU_GREEN_DARK = "#07170d";
const SAJU_GOLD = "#b88646";
const SAJU_GOLD_LIGHT = "#d4a96b";
const SAJU_INK = "#1a0a14";
const SAJU_CREAM = "#fbf3e8";
// ⭐ Step B (2026-05-13) — parent-child/hongsil 패턴 동등: 흰 박스 + 검은 글자
// 짙은 녹색 BG 위에 본문은 흰색 카드. 강조는 ACCENT 금색·SECONDARY 자두.
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_TEXT = "#ffffff";
const CARD_BORDER = "rgba(201,150,12,0.3)";
const CARD_TEXT_MUTED = "rgba(255,255,255,0.7)";
const HIGHLIGHT = "#c8203a"; // 자두 (중요 강조)
const HIGHLIGHT_GOLD = "#b88646"; // 베이지 골드 (서브 강조)

// ── 일간 정보 ────────────────────────────────────────────────
const ILGAN_INFO: Record<string, { hanja:string; name:string; desc:string; tags:string[] }> = {
  갑:{ hanja:'甲', name:'거목(巨木)', desc:'하늘을 향해 곧게 뻗는 큰 나무입니다. 강한 추진력과 리더십으로 새로운 길을 개척합니다.', tags:['#추진력','#리더십','#개척자','#독립심'] },
  을:{ hanja:'乙', name:'초목(草木)', desc:'바람에 유연하게 흔들리는 초목입니다. 뛰어난 적응력과 풍부한 인간관계로 어디서든 꽃을 피웁니다.', tags:['#유연함','#친화력','#재치','#감수성'] },
  병:{ hanja:'丙', name:'태양(太陽)', desc:'온 세상을 환히 비추는 태양입니다. 뜨거운 에너지와 밝은 성격으로 주변을 생기있게 만듭니다.', tags:['#열정','#활동적','#자신감','#표현력'] },
  정:{ hanja:'丁', name:'등촉(燈燭)', desc:'어둠 속에서 빛나는 촛불입니다. 헌신적이고 섬세한 마음으로 가까운 이들을 따뜻하게 비춥니다.', tags:['#헌신','#통찰력','#따뜻함','#집중력'] },
  무:{ hanja:'戊', name:'대산(大山)', desc:'만물을 품는 웅장한 산입니다. 넓은 포용력과 두터운 신뢰감으로 사람들에게 든든한 버팀목이 됩니다.', tags:['#포용력','#신뢰','#안정','#중심'] },
  기:{ hanja:'己', name:'전원(田原)', desc:'온갖 것을 키워내는 기름진 논밭입니다. 성실하고 꼼꼼하게 자신의 자리를 가꾸며 풍요를 만들어냅니다.', tags:['#성실','#꼼꼼함','#현실감각','#배려'] },
  경:{ hanja:'庚', name:'강철(鋼鐵)', desc:'굽히지 않는 단단한 강철입니다. 강인한 의지와 날카로운 결단력으로 불의와 타협하지 않습니다.', tags:['#강인함','#의리','#결단력','#정직'] },
  신:{ hanja:'辛', name:'보석(寶石)', desc:'빛나는 귀한 보석입니다. 예리한 감각과 세련된 심미안으로 아름다움을 창조합니다.', tags:['#예리함','#세련됨','#분석력','#완벽주의'] },
  임:{ hanja:'壬', name:'대해(大海)', desc:'모든 강물을 품는 깊고 넓은 바다입니다. 지혜롭고 자유로운 영혼으로 깊은 통찰을 가집니다.', tags:['#지혜','#창의성','#자유로움','#포용'] },
  계:{ hanja:'癸', name:'이슬비(雨露)', desc:'만물을 조용히 적시는 이슬비입니다. 섬세한 감수성과 깊은 직관으로 남들이 보지 못하는 것을 봅니다.', tags:['#직관','#감수성','#신비로움','#영리함'] },
};

const ELEM_COLORS:Record<string,string> = { 목:'#22c55e', 화:'#ef4444', 토:'#f59e0b', 금:'#94a3b8', 수:'#60a5fa' };
const ELEM_HANJA: Record<string,string>  = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };

// 세운표 2026-2030
const SEUN_YEARS = [
  { year:2026, stem:'병', branch:'오', shanHanja:'丙午' },
  { year:2027, stem:'정', branch:'미', shanHanja:'丁未' },
  { year:2028, stem:'무', branch:'신', shanHanja:'戊申' },
  { year:2029, stem:'기', branch:'유', shanHanja:'己酉' },
  { year:2030, stem:'경', branch:'술', shanHanja:'庚戌' },
];

// 섹션 첫 슬라이드에 표시할 인라인 헤더
const SECTION_LABELS: Record<number,{ title:string; icon:string }> = {
  13:{ title:'나는 어떤 사람인가', icon:'✦' },
  14:{ title:'타고난 재능의 방향', icon:'✦' },
  15:{ title:'돈과 현실 감각', icon:'✦' },
  16:{ title:'일과 직업의 방향', icon:'✦' },
  17:{ title:'사람과 인연', icon:'✦' },
  18:{ title:'사람과 인연', icon:'✦' },
  19:{ title:'사람과 인연', icon:'✦' },
  20:{ title:'몸과 마음의 리듬', icon:'✦' },
  21:{ title:'조심해야 할 반복 패턴', icon:'✦' },
  22:{ title:'시기별 흐름', icon:'✦' },
  23:{ title:'앞으로 5년의 흐름', icon:'✦' },
  24:{ title:'종합 해석과 앞으로의 방향', icon:'✦' },
  25:{ title:'묵도인의 마지막 한 마디', icon:'✦' },
};

// 슬라이드 → AI 섹션 키 매핑 (overview는 백그라운드 fetch — 다른 섹션의 참조용)
const SLIDE_AI: Record<number,string> = {
  1: 'opener',
  12: 'overview',
  13: 'personality1', 14: 'personality2',
  15: 'money1',       16: 'money2',
  17: 'love1',        18: 'love2', 19: 'love3',
  20: 'health',
  21: 'hidden',
  22: 'timeline1',    23: 'timeline2',
  24: 'compass',
  25: 'closing',
};

// TOC 섹션 목록
const TOC_ITEMS = [
  { label:'내 사주의 기본 구조', slide:2  },
  { label:'나는 어떤 사람인가', slide:13 },
  { label:'타고난 재능의 방향', slide:14 },
  { label:'돈과 현실 감각', slide:15 },
  { label:'일과 직업의 방향', slide:16 },
  { label:'사람과 인연', slide:17 },
  { label:'몸과 마음의 리듬', slide:20 },
  { label:'조심해야 할 반복 패턴', slide:21 },
  { label:'시기별 흐름', slide:22 },
  { label:'종합 해석과 앞으로의 방향', slide:24 },
];

// 슬라이드 상수
const FREE_END  = 11;  // GUIDE가 마지막 무료 슬라이드
const AI_START  = 13;  // 당신은 누구부터 유료 (핵심 요약 아이템 슬라이드 12 제거)
const GUIDE     = 11;  // 목차 안내 슬라이드
const TOTAL     = 28;
const PRICE     = 32900;  // 평생사주 소비자가

// 에너지 점수
function calcEnergyScore(elements:Record<string,number>) {
  const vals = Object.values(elements);
  const total = vals.reduce((a,b)=>a+b,0)||1;
  const avg   = total/5;
  const variance = vals.reduce((s,v)=>s+Math.pow(v-avg,2),0)/5;
  const raw   = Math.round(140 + variance*35 + total*12);
  const score = Math.max(50, Math.min(540, raw));
  const label = score<150?'신약(身弱)':score<220?'편약(偏弱)':score<310?'중화(中和)':score<400?'신강(身强)':'신왕(身旺)';
  return { score, label, max:560 };
}

// 운세 점수 계산 (오행·십성 기반 규칙)
function calcFortuneScores(data: SajuAnalysis) {
  const el = data.elements;
  const ss = [
    data.sipseong.year.stem, data.sipseong.year.branch,
    data.sipseong.month.stem, data.sipseong.month.branch,
    data.sipseong.day.branch,
    ...(data.sipseong.hour ? [data.sipseong.hour.stem, data.sipseong.hour.branch] : []),
  ];
  const count = (arr: string[], ...targets: string[]) =>
    arr.filter(s => targets.includes(s)).length;

  const jaesong  = count(ss, '편재','정재');
  const gwansong = count(ss, '편관','정관');
  const siksang  = count(ss, '식신','상관');
  const insong   = count(ss, '편인','정인');
  const bigyeop  = count(ss, '비견','겁재');
  const total    = ss.length || 1;

  // 재물운: 재성 多 = 높음, 비겁 多 = 낮음
  const money = Math.min(95, Math.max(30, 50 + jaesong * 10 - bigyeop * 8 + ((el as Record<string,number>)[data.yongsin] ?? 0) * 5));
  // 연애운: 일지 관성/재성/식상 기준
  const loveBase = ['편관','정관','편재','정재','식신','상관'].includes(data.sipseong.day.branch) ? 72 : 55;
  const love = Math.min(92, Math.max(35, loveBase + siksang * 5 - bigyeop * 4));
  // 건강운: 오행 균형도 (분산 낮을수록 좋음)
  const vals = Object.values(el);
  const avg  = vals.reduce((a,b)=>a+b,0) / 5;
  const variance = vals.reduce((s,v)=>s+Math.pow(v-avg,2),0)/5;
  const health = Math.min(95, Math.max(40, 80 - Math.round(variance * 8)));
  // 직업운: 관성·인성 多 = 높음
  const career = Math.min(93, Math.max(35, 50 + gwansong * 10 + insong * 6 - bigyeop * 4));
  // 대인운: 식상·비겁 균형
  const social = Math.min(90, Math.max(38, 55 + siksang * 8 + Math.min(bigyeop,2)*4 - Math.max(0,bigyeop-2)*6));

  return [
    { label:'재물운', score: money,  icon:'💰' },
    { label:'연애운', score: love,   icon:'💕' },
    { label:'건강운', score: health, icon:'🌿' },
    { label:'직업운', score: career, icon:'💼' },
    { label:'대인운', score: social, icon:'🤝' },
  ];
}

// 십성 범주
function getSipseongCounts(sipseong:SajuAnalysis['sipseong']) {
  const cat:Record<string,number> = { 비겁:0, 식상:0, 재성:0, 관성:0, 인성:0 };
  const cl = (ss:string) => {
    if (['비견','겁재'].includes(ss))   cat.비겁++;
    else if (['식신','상관'].includes(ss)) cat.식상++;
    else if (['편재','정재'].includes(ss)) cat.재성++;
    else if (['편관','정관'].includes(ss)) cat.관성++;
    else if (['편인','정인'].includes(ss)) cat.인성++;
  };
  cl(sipseong.year.stem); cl(sipseong.year.branch);
  cl(sipseong.month.stem); cl(sipseong.month.branch);
  cat.비겁++;
  cl(sipseong.day.branch);
  if (sipseong.hour) { cl(sipseong.hour.stem); cl(sipseong.hour.branch); }
  return cat;
}

// 텍스트 포맷터
function stripBold(s: string) { return s.replace(/\*\*/g, ''); }
function renderHeading(raw: string, size: 'h2'|'h3', key: number) {
  const text = stripBold(raw);
  const parts = text.split(/\s*[—–-]\s*/);
  const main = parts[0].trim();
  const sub  = parts.length > 1 ? parts.slice(1).join(' ').trim() : null;
  const cls  = size==='h2'
    ? "saju-prose font-bold mt-4 mb-6 text-[22px] leading-snug text-left w-full"
    : "saju-prose font-bold mt-6 mb-6 text-[20px] leading-snug text-left w-full";
  if (sub) {
    return (
      <div key={key} className={`${cls} flex flex-col items-start gap-1`} style={{color:ACCENT}}>
        <span>{main}</span>
        <span className="text-[16px] font-medium" style={{color:`${ACCENT}cc`}}>{sub}</span>
      </div>
    );
  }
  return size==='h2'
    ? <h2 key={key} className={cls} style={{color:ACCENT}}>{main}</h2>
    : <h3 key={key} className={cls} style={{color:ACCENT}}>{main}</h3>;
}
function formatText(text:string) {
  return text.split("\n").map((line,i) => {
    // # 단독 제목 (소넷 출력 호환 — ## 로 격상)
    if (line.startsWith("# ") && !line.startsWith("## "))
      return renderHeading(line.replace(/^#\s*/, ''), 'h2', i);
    // ▶ 소제목 (소넷 출력 호환 — ### 로 변환)
    if (line.startsWith("▶ "))
      return renderHeading(line.replace(/^▶\s*/, ''), 'h3', i);
    // ### 부제목
    if (line.startsWith("### "))
      return renderHeading(line.replace(/^###\s*(\d+\.\s*)?/, ''), 'h3', i);
    // ## 제목
    if (line.startsWith("## "))
      return renderHeading(line.replace(/^##\s*/, ''), 'h2', i);
    // --- 구분선 → 스킵
    if (line.trim() === "---")
      return <div key={i} className="h-2"/>;
    // **굵게** 단독 줄
    if (/^\*\*[^*]+\*\*$/.test(line.trim()))
      return <h3 key={i} className="saju-prose font-bold mt-6 mb-8 text-[20px] text-center w-full" style={{color:ACCENT}}>{line.replace(/\*\*/g,"")}</h3>;
    // 인라인 **굵게**
    if (/\*\*[^*]+\*\*/.test(line))
      return (
        <p key={i} className="saju-prose saju-body text-[17px] leading-[2.1] mb-4" style={{ color: CARD_TEXT }}>
          {line.split(/(\*\*[^*]+\*\*)/).map((p2,j) =>
            /^\*\*[^*]+\*\*$/.test(p2)
              ? <strong key={j} style={{color:ACCENT}}>{p2.replace(/\*\*/g,"")}</strong>
              : p2
          )}
        </p>
      );
    // 숫자 목록 (1. 2. 3. 형태)
    if (/^\d+\.\s/.test(line))
      return <li key={i} className="saju-prose saju-body text-[17px] leading-[2.1] ml-5 mb-3 list-decimal" style={{ color: CARD_TEXT }}>{line.replace(/^\d+\.\s/, '')}</li>;
    // 불릿
    if (line.startsWith("- ")||line.startsWith("• "))
      return <li key={i} className="saju-prose saju-body text-[17px] leading-[2.1] ml-5 mb-3 list-disc" style={{ color: CARD_TEXT }}>{line.slice(2)}</li>;
    // 빈 줄
    if (line.trim()==="") return <div key={i} className="h-3"/>;
    // 일반 텍스트
    return <p key={i} className="saju-prose saju-body text-[17px] leading-[2.1] mb-4" style={{ color: CARD_TEXT }}>{line}</p>;
  });
}

// ### 부제목 기준으로 페이지 분할 (부제목 + 내용이 한 페이지)
function splitIntoPages(text: string): string[] {
  // ### 또는 ▶ 기준으로 섹션 분리
  const sections = text.split(/(?=^###\s|^▶\s)/m).map(s => s.trim()).filter(s => s);
  if (sections.length > 1) {
    // 내용 없는 섹션(제목만 있는 경우) 다음 섹션과 합치기
    const merged: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const contentLines = s.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('###') && !l.startsWith('▶'));
      if (contentLines.length === 0 && i < sections.length - 1) {
        sections[i + 1] = s + '\n' + sections[i + 1];
      } else {
        merged.push(s);
      }
    }
    // 2단계: 각 섹션 내부에 단락(\n\n)이 여러 개면 추가 분리
    const result: string[] = [];
    for (const page of merged) {
      const titleMatch = page.match(/^(###\s.*|▶\s.*)\n/);
      const title = titleMatch ? titleMatch[0] : '';
      const body = title ? page.slice(title.length) : page;
      const paras = body.split(/\n{2,}/).map(s => s.trim()).filter(s => s);
      if (paras.length > 1) {
        result.push(title + paras[0]);
        for (const p of paras.slice(1)) result.push(p);
      } else {
        result.push(page);
      }
    }
    return result.length > 0 ? result : [text];
  }
  // ### 없으면 **굵게** 줄 기준으로 분리
  const boldSections = text.split(/(?=^\*\*[^*]+\*\*$)/m).map(s => s.trim()).filter(s => s);
  if (boldSections.length > 1) {
    // 내용 없는 페이지(제목·요약만 있는 경우) 다음 페이지와 합치기
    const merged: string[] = [];
    for (let i = 0; i < boldSections.length; i++) {
      const s = boldSections[i];
      const contentLines = s.split('\n').map(l => l.trim())
        .filter(l => l && !/^\*\*[^*]+\*\*$/.test(l));
      if (contentLines.length === 0 && i < boldSections.length - 1) {
        boldSections[i + 1] = s + '\n' + boldSections[i + 1];
      } else {
        merged.push(s);
      }
    }
    // 페이지 끝에 단독 제목만 남는 경우 → 다음 페이지 앞으로 이동
    const fixed: string[] = [];
    for (let i = 0; i < merged.length; i++) {
      let page = merged[i];
      const lines = page.split('\n');
      const lastNonEmpty = [...lines].reverse().find(l => l.trim());
      if (
        lastNonEmpty &&
        /^\*\*[^*]+\*\*$/.test(lastNonEmpty.trim()) &&
        i < merged.length - 1
      ) {
        const idx = page.lastIndexOf(lastNonEmpty);
        merged[i + 1] = lastNonEmpty.trim() + '\n' + merged[i + 1];
        page = page.slice(0, idx).trimEnd();
      }
      if (page.trim()) fixed.push(page);
    }
    return fixed.length > 0 ? fixed : [text];
  }
  // ### 도 **bold** 도 없으면 빈 줄(\n\n) 기준으로 단락 분할
  const paragraphs = text.split(/\n{2,}/).map(s => s.trim()).filter(s => s);
  if (paragraphs.length > 1) return paragraphs;
  return [text];
}

// 줄 단위 페이드인 (80ms 간격으로 순서대로 등장)
const ONE_PAGE_AI_KEYS = new Set([
  'personality1',
  'personality2',
  'money1',
  'money2',
  'love1',
  'health',
  'hidden',
  'timeline1',
  'compass',
]);

function pagesForAiSection(key: string, content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (ONE_PAGE_AI_KEYS.has(key)) return [trimmed];
  return splitIntoPages(trimmed);
}

function TypeWriter({ text }: { text: string }) {
  const elements = formatText(text);
  return (
    <>
      {elements.map((el, i) => (
        <div key={i} className="line-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          {el}
        </div>
      ))}
    </>
  );
}

// 섹션별 분석 근거 뱃지 생성
function getSectionBadges(key: string, data: SajuAnalysis): string[] {
  const h = (st: string) => STEM_HANJA[st as keyof typeof STEM_HANJA] ?? st;
  const b = (br: string) => BRANCH_HANJA[br as keyof typeof BRANCH_HANJA] ?? br;
  const ilchu  = `일주 ${h(data.pillars.day.stem)}${b(data.pillars.day.branch)}`;
  const yongsin = `용신 ${ELEM_HANJA[data.yongsin] ?? ''}${data.yongsin}`;
  const wolji  = `월지 ${data.sipseong.month.branch}`;
  const baewoo = `배우자궁 ${data.sipseong.day.branch}`;
  const elemTotal = Object.values(data.elements).reduce((a,b)=>a+b,0)||1;
  const weakEl = Object.entries(data.elements).filter(([,n])=>n/elemTotal<0.10).map(([el])=>ELEM_HANJA[el]+el);
  const sinsal  = data.sinsal.length > 0 ? `신살 ${data.sinsal.slice(0,2).join('·')}` : '';
  const allSS   = [
    data.sipseong.year.stem, data.sipseong.year.branch,
    data.sipseong.month.stem, data.sipseong.month.branch,
    data.sipseong.day.branch,
    ...(data.sipseong.hour ? [data.sipseong.hour.stem, data.sipseong.hour.branch] : []),
  ];
  const jaesong = allSS.filter(s => s==='편재'||s==='정재');
  const bigyeop = allSS.filter(s => s==='비견'||s==='겁재');

  const map: Record<string, string[]> = {
    personality1: [ilchu, wolji, yongsin],
    personality2: [ilchu, `일지 ${data.sipseong.day.branch}`, `월간 ${data.sipseong.month.stem}`],
    money1:       [`재성 ${jaesong.length ? jaesong.join('·') : '없음'}`, `비겁 ${bigyeop.length}개`, yongsin],
    money2:       [yongsin, wolji, ilchu],
    love1:        [baewoo, ilchu, sinsal].filter(Boolean) as string[],
    love2:        [baewoo, `식상 ${allSS.filter(s=>s==='식신'||s==='상관').length}개`, ilchu],
    love3:        [baewoo, yongsin, sinsal].filter(Boolean) as string[],
    health:       [`부족 오행 ${weakEl.length ? weakEl.join('·') : '없음'}`, yongsin, ilchu],
    hidden:       [ilchu, sinsal || '신살 없음', yongsin],
    timeline1:    [ilchu, wolji, yongsin],
    timeline2:    [`2026~2030 세운`, ilchu, yongsin],
    compass:      [yongsin, ilchu, wolji],
    closing:      [ilchu, yongsin, sinsal || ''],
  };
  return (map[key] ?? [ilchu, yongsin]).filter(Boolean).slice(0, 3);
}

// AI 섹션 로딩 — 단계별 명리학 분석 시뮬레이션
function AiLoader({ sajuData }: { sajuData: SajuAnalysis | null }) {
  const [step, setStep] = useState(0);
  const h = (st: string) => STEM_HANJA[st as keyof typeof STEM_HANJA] ?? st;
  const b = (br: string) => BRANCH_HANJA[br as keyof typeof BRANCH_HANJA] ?? br;

  const steps = sajuData ? [
    `연주(年柱) ${h(sajuData.pillars.year.stem)}${b(sajuData.pillars.year.branch)} 확인 중...`,
    `월지(月支) ${sajuData.sipseong.month.branch} 강도 계산 중...`,
    `일간(日干) ${sajuData.ilgan}(${h(sajuData.ilgan)}) 분석 중...`,
    `오행 균형 · 용신 ${ELEM_HANJA[sajuData.yongsin] ?? ''}${sajuData.yongsin} 도출 중...`,
    `풀이 생성 완료 ✓`,
  ] : [
    '사주 원국 분석 중...',
    '십성 구조 계산 중...',
    '용신 도출 중...',
    '풀이 생성 중...',
  ];

  useEffect(() => {
    setStep(0);
    const timers = steps.map((_, i) =>
      setTimeout(() => setStep(i), i * 900)
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
      <div className="w-6 h-6 rounded-full border-2 animate-spin flex-shrink-0"
        style={{borderColor:`${ACCENT}33`, borderTopColor:ACCENT}}/>
      <div className="space-y-1.5 text-center">
        {steps.map((s, i) => (
          <p key={i} className="text-xs transition-all duration-500"
            style={{
              color: i < step ? `${ACCENT}44` : i === step ? ACCENT : `${ACCENT}22`,
              fontWeight: i === step ? 600 : 400,
            }}>
            {i < step ? `✓ ${s.replace('중...','완료')}` : s}
          </p>
        ))}
      </div>
    </div>
  );
}

// 이미지 배너 컴포넌트
function ImageBanner({ name }:{ name:string }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden flex-shrink-0 mb-3 aspect-square">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/image/${encodeURIComponent(name)}.jpeg`} alt=""
        className="w-full h-full object-cover" style={{objectPosition:'center center'}} />
      <div className="absolute inset-0"
        style={{background:`linear-gradient(to bottom, transparent 20%, ${BG} 100%)`}} />
    </div>
  );
}

type SectionState = { status:"idle"|"loading"|"done"|"error"; content:string };

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SajuSlideResult() {
  const params       = useSearchParams();
  const [slide, setSlide]         = useState(0);
  const [sajuData, setSajuData]   = useState<SajuAnalysis|null>(null);
  const [aiContent, setAiContent] = useState<Record<string,SectionState>>(() => {
    const keys = ['opener','overview','personality1','personality2','money1','money2','love1','health','hidden','timeline1','compass'];
    return Object.fromEntries(keys.map(k=>[k,{status:'idle',content:''}]));
  });
  const [unlocked, setUnlocked]       = useState(false);
  const [paying, setPaying]           = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [ovPage, setOvPage]           = useState(0);
  const [showToc, setShowToc]         = useState(false);
  const [urlCopied, setUrlCopied]     = useState(false);
  const [serverRetrying, setServerRetrying] = useState(false);
  const [serverFailed, setServerFailed]     = useState(false);
  // AI 콘텐츠 페이지 분할 상태
  const [aiPages, setAiPages]     = useState<Record<string,string[]>>({});
  const [aiPage, setAiPage]       = useState<Record<string,number>>({});
  const [qaInput, setQaInput]         = useState('');
  const [qaLoading, setQaLoading]     = useState(false);
  const [qaHistory, setQaHistory]     = useState<{q:string;a:string}[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [pendingQ, setPendingQ]       = useState('');
  const [qaPayPhone, setQaPayPhone]   = useState('');
  const [qaPayState, setQaPayState]   = useState<'none'|'input'|'paying'>('none');
  const [qaPayProgress, setQaPayProgress] = useState(0);
  // 평생사주 오프닝 영상 — 결제 완료(unlocked=1) 후 노출
  // - saved=1 재방문 시 스킵 (영상 이미 봤음)
  // - 흐름 변경(2026-05-14): 풀이 시작 → 바로 결제창 → 결제 후 영상 + LLM 50% 대기
  const [openingDone, setOpeningDone] = useState(() =>
    params.get("saved") === "1"
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const savedRef = useRef(false);
  const aiContentRef = useRef<Record<string,SectionState>>({});
  // ⭐ Step 3 (2026-05-13) — Cross-chapter usedTokens 누적
  // 14 섹션 cross 한자 토큰 카운트. 매 섹션 fetch body에 보내고 tk 이벤트로 누적 갱신.
  // hongsil/inyeon은 서버 stateful, parent-child/saju는 클라이언트 누적 (다단계 fetch라).
  const usedTokensRef = useRef<Record<string, number>>({});

  const name         = params.get("name")         || "";
  const gender       = params.get("gender")       || "";
  const year         = params.get("year")         || "";
  const month        = params.get("month")        || "";
  const day          = params.get("day")          || "";
  const hour         = params.get("hour")         || "";
  const calendarType = params.get("calendarType") || "양력";
  const isSavedUrl   = params.get("saved") === "1";
  const sajuSummaryLines = [
    `이름: ${name || "미입력"}`,
    `생년월일: ${year || "----"}.${month || "--"}.${day || "--"} (${calendarType})`,
    `성별 · 시간: ${gender || "미입력"} · ${hour || "시간 모름"}`,
  ];

  const baseBody = { type:"saju", name, gender, year, month, day, hour, calendarType };
  const cacheKey = name ? `saju_v1_${name}_${year}_${month}_${day}_${hour}_${gender}_${calendarType}` : '';

  // PayApp/PortOne 결제 완료 감지
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const justPaid = urlParams.get('justpaid') === '1';
    const isUnlocked = urlParams.get('unlocked') === '1';
    if (isUnlocked) {
      setUnlocked(true);
      urlParams.delete('unlocked');
      urlParams.delete('justpaid');
      const newSearch = urlParams.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
    }
    // 결제 완료 직후 (unlocked=1 또는 justpaid=1) → 당신은 누구(AI_START)로 자동 점프
    if (isUnlocked || justPaid) {
      setSlide(AI_START);
      setOvPage(0);
    }
  }, []);

  // localStorage 캐시 로드 → 없으면 서버(Google Sheets) 확인 (마운트 시 1회)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cacheKey) return;
    const applyContent = (aiData: Record<string, SectionState>) => {
      setAiContent(aiData);
      const pages: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(aiData)) {
        if (v.status === 'done' && v.content && k !== 'opener') {
          pages[k] = pagesForAiSection(k, v.content);
        }
      }
      setAiPages(pages);
      setUnlocked(true);
    };
    // 1) localStorage 확인
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as { aiContent: Record<string, SectionState> };
        if (data.aiContent) { applyContent(data.aiContent); return; }
      }
    } catch {}
    // 2) 서버 확인 — saved=1이면 재시도 3회, 실패해도 AI 생성 절대 안 함
    if (isSavedUrl) {
      setServerRetrying(true);
      let attempts = 0;
      const tryLoad = () => {
        fetch(`/api/load-reading?key=${encodeURIComponent(cacheKey)}`)
          .then(r => r.json())
          .then((res: { found: boolean; aiContent?: Record<string, SectionState>; qaHistory?: {q:string;a:string}[] }) => {
            if (res.found && res.aiContent) {
              savedRef.current = true;
              applyContent(res.aiContent);
              if (res.qaHistory?.length) {
                setQaHistory(res.qaHistory);
                setQuestionCount(3);
              }
              setServerRetrying(false);
              try { localStorage.setItem(cacheKey, JSON.stringify({ aiContent: res.aiContent })); } catch {}
            } else {
              attempts++;
              if (attempts < 3) { setTimeout(tryLoad, 2000); }
              else { setServerRetrying(false); setServerFailed(true); }
            }
          })
          .catch(() => {
            attempts++;
            if (attempts < 3) { setTimeout(tryLoad, 2000); }
            else { setServerRetrying(false); setServerFailed(true); }
          });
      };
      tryLoad();
    } else {
      // saved=1 없으면 1회만 확인, 없으면 정상 흐름(신규 사용자)
      fetch(`/api/load-reading?key=${encodeURIComponent(cacheKey)}`)
        .then(r => r.json())
        .then((res: { found: boolean; aiContent?: Record<string, SectionState>; qaHistory?: {q:string;a:string}[] }) => {
          if (!res.found || !res.aiContent) return;
          savedRef.current = true;
          applyContent(res.aiContent);
          if (res.qaHistory?.length) {
            setQaHistory(res.qaHistory);
            setQuestionCount(res.qaHistory.length);
          }
          try { localStorage.setItem(cacheKey, JSON.stringify({ aiContent: res.aiContent })); } catch {}
        })
        .catch(() => {});
    }
  }, []);

  // 모든 섹션 완료 시 Google Sheets에 저장 (1회)
  useEffect(() => {
    if (!cacheKey || !unlocked || savedRef.current) return;
    const SECS = ['opener','overview','personality1','personality2','money1','money2','love1','health','hidden','timeline1','compass'];
    if (!SECS.every(k => aiContent[k]?.status === 'done')) return;
    savedRef.current = true;
    fetch('/api/save-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cacheKey, aiContent, qaHistory }),
    }).then(() => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('saved', '1');
        window.history.replaceState({}, '', url.toString());
      }
    }).catch(() => {});
  }, [aiContent, cacheKey, unlocked]);

  // localStorage 캐시 저장 (완료된 섹션이 생길 때마다 debounce)
  useEffect(() => {
    if (!cacheKey) return;
    const hasDone = Object.values(aiContent).some(s => s.status === 'done');
    if (!hasDone) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(cacheKey, JSON.stringify({ aiContent })); } catch {}
    }, 1500);
  }, [aiContent, cacheKey]);

  // AI 섹션 fetch 헬퍼
  const fetchSection = (key: string): Promise<void> => {
    setAiContent(prev => ({ ...prev, [key]:{ status:'loading', content:'' } }));
    const extra: Record<string,string> = {};
    if (key === 'compass') {
      extra.overviewContent = aiContentRef.current['overview']?.content || '';
    }
    return fetch("/api/generate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...baseBody, section:key, ...extra, usedTokens: usedTokensRef.current }),
    }).then(async res => {
      if (!res.ok) throw new Error();
      const ct = res.headers.get('Content-Type') ?? '';

      if (ct.includes('text/event-stream')) {
        // ── 스트리밍 모드 (API 키) ──
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let full = '';
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break outer;
            let msg: { t: string; d?: unknown; v?: string };
            try { msg = JSON.parse(raw); } catch { continue; }
            if (msg.t === 'm' && msg.d) {
              setSajuData(msg.d as SajuAnalysis);
            } else if (msg.t === 'x' && msg.v) {
              full += msg.v;
              setAiContent(prev => ({ ...prev, [key]:{ status:'loading', content: full } }));
              // 스트리밍 중에도 페이지 분할 — 첫 페이지 즉시 표시
              if (key !== 'opener') {
                const partial = pagesForAiSection(key, full);
                if (partial.length > 1) {
                  setAiPages(prev => ({ ...prev, [key]: partial }));
                  setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
                }
              }
            } else if (msg.t === 'tk' && (msg as unknown as { m?: unknown }).m && typeof (msg as unknown as { m?: unknown }).m === 'object') {
              // Step 3: cross-chapter usedTokens 누적 갱신
              usedTokensRef.current = (msg as unknown as { m: Record<string, number> }).m;
            } else if (msg.t === 'e') {
              throw new Error();
            }
          }
        }
        if (key !== 'opener' && full) {
          setAiPages(prev => ({ ...prev, [key]: pagesForAiSection(key, full) }));
          setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
        }
        setAiContent(prev => {
          const next = { ...prev, [key]:{ status:'done' as const, content: full } };
          aiContentRef.current = next;
          return next;
        });

      } else {
        // ── JSON 모드 (릴레이) ──
        const d = await res.json();
        const content = d.result ?? '';
        setAiContent(prev => ({ ...prev, [key]:{ status: d.error?'error':'done', content } }));
        if (key !== 'opener' && content) {
          setAiPages(prev => ({ ...prev, [key]: pagesForAiSection(key, content) }));
          setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
        }
        if (d.sajuData) setSajuData(d.sajuData);
      }
    }).catch(()=>{
      setAiContent(prev=>({...prev,[key]:{status:'error',content:''}}));
    });
  };

  // Q&A 질문 fetch
  const fetchQA = (question: string): void => {
    const idx = qaHistory.length;
    setQaHistory(prev => [...prev, { q: question, a: '' }]);
    setQaLoading(true);

    // 각 섹션의 인트로(핵심 요약)를 모아 Q&A context 구성
    const KEY_LABELS: Record<string,string> = {
      personality1:'나라는 사람 (강점·성격)',
      personality2:'나라는 사람 (일주·재능)',
      money1:'재물운', money2:'직업운',
      love1:'사랑·궁합', love2:'연애 스타일', love3:'결혼운',
      health:'건강', hidden:'숨겨진 카드',
      timeline1:'대운 흐름', timeline2:'세운 흐름',
      compass:'나침반', closing:'마무리',
    };
    const summaries = Object.entries(KEY_LABELS).map(([key, label]) => {
      const pages = aiPages[key];
      const intro = pages && pages.length > 1
        ? pages[0]
        : aiContent[key]?.content?.split(/^###/m)[0]?.trim();
      return intro ? `[${label}]\n${intro}` : null;
    }).filter(Boolean).join('\n\n');

    fetch("/api/generate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...baseBody, section:'qa', question, summaries }),
    }).then(async res => {
      if (!res.ok) throw new Error();
      const ct = res.headers.get('Content-Type') ?? '';
      let finalAnswer = '';
      if (ct.includes('text/event-stream')) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let full = '';
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            if (raw === '[DONE]') break outer;
            let msg: { t: string; v?: string };
            try { msg = JSON.parse(raw); } catch { continue; }
            if (msg.t === 'x' && msg.v) {
              full += msg.v;
              setQaHistory(prev => prev.map((e,i) => i===idx ? {...e, a:full} : e));
            }
          }
        }
        setQaHistory(prev => prev.map((e,i) => i===idx ? {...e, a:full} : e));
        finalAnswer = full;
      } else {
        const d = await res.json();
        finalAnswer = d.result ?? '';
        setQaHistory(prev => prev.map((e,i) => i===idx ? {...e, a:finalAnswer} : e));
      }
      setQuestionCount(c => c+1);
      setQaLoading(false);
      // Q&A 기록 서버 저장 (savedRef가 true일 때만 — 풀이가 서버에 있을 때)
      if (savedRef.current && cacheKey) {
        const historyForSave = [...qaHistory, { q: question, a: finalAnswer }];
        fetch('/api/save-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: cacheKey, qaHistory: historyForSave }),
        }).catch(() => {});
      }
      // Google Sheets에 질문 로깅 (fire-and-forget)
      fetch('/api/log-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birth: `${year}년 ${month}월 ${day}일 ${hour} (${calendarType}) ${gender}성`,
          question,
          answer: finalAnswer,
        }),
      }).catch(() => {});
    }).catch(() => {
      setQaHistory(prev => prev.map((e,i) => i===idx ? {...e, a:'오류가 발생했습니다. 잠시 후 다시 시도해주세요.'} : e));
      setQaLoading(false);
    });
  };

  // 초기 로드: opener만 — 결제 완료(unlocked) 후에만 (결제 전 LLM 비용 0)
  useEffect(()=>{
    if (!unlocked) return;
    fetchSection('opener');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // 잠금 해제 시 순차 fetch — 앞 섹션부터 하나씩
  useEffect(()=>{
    if (!unlocked) return;
    const keys = ['overview','personality1','personality2','money1','money2','love1','health','hidden','timeline1','compass'];
    (async () => {
      for (const k of keys) {
        if (['idle','error'].includes(aiContent[k]?.status ?? 'idle')) {
          await fetchSection(k);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // Q&A 유료 결제 시뮬레이션
  function handleQAPay() {
    if (qaPayPhone.replace(/\D/g,"").length<10) return;
    setQaPayState('paying');
    let p=0;
    const iv = setInterval(()=>{
      p += Math.random()*7+2;
      if (p>=100) {
        p=100; clearInterval(iv);
        setTimeout(()=>{
          setQaPayState('none');
          setQaPayPhone('');
          setQaPayProgress(0);
          fetchQA(pendingQ);
          setPendingQ('');
        }, 700);
      }
      setQaPayProgress(Math.min(100,Math.round(p)));
    },170);
  }

  // 현재 슬라이드의 AI 페이지 정보
  const curAiKey   = SLIDE_AI[slide];

  // 각 AI 키를 독립 챕터로 표시한다. 목차/프롬프트/렌더 순서가 어긋나지 않도록
  // 여기서 임의 병합하지 않는다.
  const displayPages: Record<string, string[]> = (() => {
    return { ...aiPages };
  })();

  const curPages   = (() => {
    if (curAiKey && curAiKey !== 'opener' && curAiKey !== 'overview') return displayPages[curAiKey] || [];
    return [];
  })();
  const curPgIdx   = curAiKey ? (aiPage[curAiKey] || 0) : 0;
  const hasMorePages = curPages.length > 1 && curPgIdx < curPages.length - 1;

  const headerPageText = (() => {
    if (curPages.length > 1) return `${curPgIdx + 1} / ${curPages.length}`;
    if (curPages.length === 1) return `1 / 1`;
    return null;
  })();

  async function handlePayment(finalPrice: number) {
    if (paying) return;
    setPaying(true);
    try {
      const PortOne = (await import('@portone/browser-sdk/v2')).default;
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
      if (!storeId || !channelKey) {
        alert('결제 설정이 누락됐습니다. 관리자에게 문의해주세요.');
        setPaying(false);
        throw new Error('PortOne env missing');
      }

      const paymentId = `payment${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
      const response = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId,
        orderName: '평생 사주 풀이',
        totalAmount: finalPrice,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
      } as any);

      if (response?.code !== undefined) {
        // 사용자 취소 또는 결제 실패
        if (response.code !== 'USER_CANCEL') {
          alert(response.message || '결제가 취소되었습니다.');
        }
        setPaying(false);
        throw new Error(response.message || '결제 취소');
      }

      // 서버 검증 — 위변조 방어 (서버가 쿠키 기반으로 단독 계산)
      const verifyRes = await fetch('/api/portone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const verify = await verifyRes.json();
      if (!verify.success) {
        alert(verify.error || '결제 검증에 실패했습니다.');
        setPaying(false);
        throw new Error(verify.error || '결제 검증 실패');
      }

      // 검증 통과 — unlocked 쿼리 박고 새로고침
      const url = new URL(window.location.href);
      url.searchParams.set('unlocked', '1');
      url.searchParams.set('paymentId', paymentId);
      window.location.href = url.toString();
    } catch (e) {
      setPaying(false);
      throw e;
    }
  }

  // 무료 쿠폰 — PortOne 스킵, 서버에 unlock 요청 + payments 적재
  async function handleFreeUnlock(couponCode: string) {
    if (paying) return;
    setPaying(true);
    try {
      const res = await fetch('/api/coupon/free-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || '쿠폰 적용에 실패했습니다.');
        setPaying(false);
        throw new Error(data.error || '쿠폰 실패');
      }
      const url = new URL(window.location.href);
      url.searchParams.set('unlocked', '1');
      url.searchParams.set('paymentId', data.paymentId);
      window.location.href = url.toString();
    } catch (e) {
      setPaying(false);
      throw e;
    }
  }

  // 네비게이션
  function goNext() {
    // AI 슬라이드에서 다음 페이지가 있으면 페이지 이동
    if (hasMorePages) {
      setAiPage(prev => ({ ...prev, [curAiKey!]: curPgIdx + 1 }));
      return;
    }
    if (slide===2 || slide===FREE_END) {
      // 무료 영역 2번째 페이지(슬라이드 2 = 사주팔자+오행+십성+안내 머지) → 결제 트리거
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const alreadyPaid = unlocked || params.get('unlocked') === '1';
      if (alreadyPaid) { setUnlocked(true); setSlide(AI_START); return; }
      setShowPayModal(true);
      return;
    }
    if (slide===0)        { setSlide(2); return; }    // 무료 1페이지(커버+오프너) → 2페이지(머지)
    if (slide===1)        { setSlide(2); return; }    // TOC 등 직접 진입 대비
    if (slide===4)        { setSlide(2); return; }    // TOC 다섯 기운 균형 등 직접 진입 대비
    if (slide===6)        { setSlide(2); return; }
    if (slide===7)        { setSlide(2); return; }
    if (slide===12)       { setSlide(13); return; }   // 핵심 요약 슬라이드 제거 — 직접 진입 시 다음으로 점프
    if (slide===17)       { setSlide(20); return; }   // 인연의 자리 머지 → 몸과 마음 (love2·3 건너뜀)
    if (slide===18)       { setSlide(20); return; }   // love2/3 직접 진입 시 다음으로
    if (slide===19)       { setSlide(20); return; }
    if (slide===22)       { setSlide(24); return; }   // 시기별 흐름 머지 → 종합 해석 (timeline2 건너뜀)
    if (slide===23)       { setSlide(24); return; }   // timeline2 직접 진입 시
    if (slide===24)       { setSlide(27); return; }   // 종합 해석 머지 → 마지막 (closing·Q&A 건너뜀)
    if (slide===25)       { setSlide(27); return; }   // closing 직접 진입 시
    if (slide===26)       { setSlide(27); return; }   // Q&A 직접 진입 시
    if (slide<TOTAL-1)    setSlide(s=>s+1);
  }
  function goPrev() {
    // AI 슬라이드에서 이전 페이지가 있으면 페이지 이동
    if (curAiKey && curAiKey !== 'opener' && curPgIdx > 0) {
      setAiPage(prev => ({ ...prev, [curAiKey]: curPgIdx - 1 }));
      return;
    }
    if (slide===2)   { setSlide(0); return; }    // 무료 2페이지 머지 → 1페이지 머지
    if (slide===4)   { setSlide(0); return; }
    if (slide===6)   { setSlide(0); return; }
    if (slide===7)   { setSlide(0); return; }
    if (slide===11)  { setSlide(0); return; }    // GUIDE → 무료 1페이지
    if (slide===1)   { setSlide(0); return; }    // 직접 진입 대비
    if (slide===13)  { setSlide(2); return; }    // 첫 유료 페이지 → 무료 머지 페이지 B
    if (slide===12)  { setSlide(2); return; }    // 핵심 요약 슬라이드 제거 — 무료로 복귀
    if (slide===14)  { setSlide(13); return; }   // 타고난 재능의 방향 → 나는 어떤 사람인가
    if (slide===15)  { setSlide(14); return; }   // 돈과 현실 감각 → 타고난 재능의 방향
    if (slide===16)  { setSlide(15); return; }   // 일과 직업의 방향 → 돈과 현실 감각
    if (slide===17)  { setSlide(16); return; }   // 사람과 인연 → 일과 직업의 방향
    if (slide===20)  { setSlide(17); return; }   // 몸과 마음 → 인연의 자리 (love2·3 건너뜀)
    if (slide===18)  { setSlide(17); return; }   // 직접 진입 대비
    if (slide===19)  { setSlide(17); return; }
    if (slide===21)  { setSlide(20); return; }   // 특수 기운 → 몸과 마음
    if (slide===22)  { setSlide(21); return; }   // 시기별 흐름 → 특수 기운
    if (slide===24)  { setSlide(22); return; }   // 종합 해석 → 시기별 흐름 (timeline2 건너뜀)
    if (slide===25)  { setSlide(24); return; }   // closing 직접 진입 시
    if (slide===26)  { setSlide(24); return; }   // Q&A 직접 진입 시
    if (slide===27)  { setSlide(24); return; }   // 마지막 → 종합 해석 (Q&A·closing 건너뜀)
    if (slide>0) setSlide(s=>s-1);
  }
  function goSlide(n:number) {
    setSlide(n); setShowToc(false);
    // 목차로 이동 시 해당 섹션 첫 페이지로
    const key = SLIDE_AI[n];
    if (key) setAiPage(prev => ({ ...prev, [key]: 0 }));
  }

  const canGoPrev  = Boolean((curAiKey && curAiKey !== 'opener' && curPgIdx > 0) || slide > 0);
  const canGoNext  = hasMorePages || slide<TOTAL-1;
  const isLastSlide = slide===TOTAL-1 && !hasMorePages;

  // 전체 풀이 공유
  function handleShareFull() {
    const aiKeys = [
      { title:'나라는 사람',   keys:['personality1','personality2'] },
      { title:'돈과 일',       keys:['money1','money2'] },
      { title:'사람과 사랑',   keys:['love1','love2','love3'] },
      { title:'몸과 마음',     keys:['health'] },
      { title:'숨겨진 카드',   keys:['hidden'] },
      { title:'흐르는 시간',   keys:['timeline1','timeline2'] },
      { title:'나침반',        keys:['compass'] },
      { title:'결',            keys:['closing'] },
    ];
    const opener = aiContent['opener']?.content || '';
    const body = aiKeys.map(sec => {
      const content = sec.keys.map(k => aiContent[k]?.content || '').filter(Boolean).join('\n\n');
      return `[ ${sec.title} ]\n${content}`;
    }).join('\n\n──────────\n\n');
    const text = `✨ ${name}님의 평생 사주 풀이\n\n${opener}\n\n──────────\n\n${body}\n\n묵도인 평생 사주 · https://saju-kappa-hazel.vercel.app/saju`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title:`${name}님의 평생 사주 풀이`, text }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text).then(()=>alert('풀이 전체가 복사되었습니다!')).catch(()=>{});
    }
  }

  // 사주 아이템 6가지 공유
  function handleShareItems() {
    const overviewContent = aiContent['overview']?.content || '';
    function extractItem(emoji: string): string {
      const line = overviewContent.split('\n').find(l => l.includes(emoji));
      if (!line) return '';
      const dashIdx = line.indexOf('—');
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) return '';
      const raw = dashIdx >= 0 ? line.slice(colonIdx + 1, dashIdx) : line.slice(colonIdx + 1);
      return raw.replace(/\*\*/g, '').trim();
    }
    const items = [
      { emoji:'🐯', label:'수호 동물' },
      { emoji:'🌸', label:'궁합 식물' },
      { emoji:'🎨', label:'행운 색깔' },
      { emoji:'🔢', label:'행운 숫자' },
      { emoji:'🐾', label:'궁합 동물' },
      { emoji:'💎', label:'궁합 보석' },
    ];
    const lines = items.map(({ emoji, label }) => `${emoji} ${label}: ${extractItem(emoji) || '?'}`).join('\n');
    const text = `✨ 내 사주 아이템 6가지\n\n${lines}\n\n나도 알아보기 → https://saju-kappa-hazel.vercel.app/saju`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title:'내 사주 아이템 6가지', text }).catch(()=>{});
    } else {
      navigator.clipboard?.writeText(text).then(()=>alert('복사되었습니다!')).catch(()=>{});
    }
  }

  function handleCopyUrl() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard?.writeText(url).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }).catch(() => {});
  }

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.origin + '/saju' : 'https://saju.vercel.app';
    const text = 'AI 명리학 대가 묵도인의 평생 사주 풀이 — 소름 돋는 정확도를 경험해보세요';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: '묵도인 평생 사주', text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => alert('링크가 복사되었습니다!')).catch(() => alert(url));
    }
  }

  // ── 슬라이드 렌더 ────────────────────────────────────────────
  function renderSlide() {

    // saved=1 URL: 서버 불러오기 중 / 실패
    if (serverRetrying) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-8 h-8 rounded-full border-2 animate-spin flex-shrink-0"
            style={{borderColor:`${ACCENT}33`,borderTopColor:ACCENT}}/>
          <p className="text-sm text-white/70">이전 풀이를 불러오는 중...</p>
          <p className="text-xs" style={{color:`${ACCENT}44`}}>잠시만 기다려주세요</p>
        </div>
      );
    }
    if (serverFailed) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
          <p className="text-sm text-white/70">풀이를 불러오지 못했습니다</p>
          <p className="text-xs" style={{color:`${ACCENT}55`}}>서버가 잠시 혼잡합니다. 다시 시도해주세요.</p>
          <button
            onClick={() => {
              setServerFailed(false);
              setServerRetrying(true);
              let attempts = 0;
              const tryLoad = () => {
                fetch(`/api/load-reading?key=${encodeURIComponent(cacheKey)}`)
                  .then(r => r.json())
                  .then((res: { found: boolean; aiContent?: Record<string, SectionState> }) => {
                    if (res.found && res.aiContent) {
                      savedRef.current = true;
                      setAiContent(res.aiContent);
                      const pages: Record<string, string[]> = {};
                      for (const [k, v] of Object.entries(res.aiContent)) {
                        if (v.status === 'done' && v.content && k !== 'opener') pages[k] = pagesForAiSection(k, v.content);
                      }
                      setAiPages(pages);
                      setUnlocked(true);
                      setServerRetrying(false);
                      setSlide(AI_START);
                      try { localStorage.setItem(cacheKey, JSON.stringify({ aiContent: res.aiContent })); } catch {}
                    } else {
                      attempts++;
                      if (attempts < 3) setTimeout(tryLoad, 2000);
                      else { setServerRetrying(false); setServerFailed(true); }
                    }
                  })
                  .catch(() => {
                    attempts++;
                    if (attempts < 3) setTimeout(tryLoad, 2000);
                    else { setServerRetrying(false); setServerFailed(true); }
                  });
              };
              tryLoad();
            }}
            className="px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
            style={{backgroundColor:ACCENT,color:BG}}>
            다시 시도하기
          </button>
        </div>
      );
    }

    // 로딩 (saju 계산 대기) — opener(slide 0-1)는 sajuData 없어도 렌더 가능
    if (!sajuData && slide >= 2) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{borderColor:`${ACCENT}33`,borderTopColor:ACCENT}}/>
          <p className="text-xs" style={{color:`${ACCENT}66`}}>사주 풀이 준비 중...</p>
        </div>
      );
    }

    // ─ Slide 0: 커버 ─
    const renderSlide0 = () => (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold"
          style={{backgroundColor:`${ACCENT}20`,border:`2px solid ${ACCENT}88`,color:'#f0c040'}}>
          命
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{name}님의</h2>
          <h2 className="text-2xl font-bold" style={{color:'#f0c040'}}>평생 사주 풀이</h2>
        </div>
        <div className="space-y-1">
          <p className="text-sm" style={{color:'rgba(255,255,255,0.80)'}}>{year}년 {month}월 {day}일 ({calendarType})</p>
          <p className="text-sm" style={{color:'rgba(255,255,255,0.80)'}}>{gender}성 · {hour}</p>
        </div>
        <p className="text-sm mt-2" style={{color:'rgba(255,255,255,0.60)'}}>묵도인이 풀어드립니다</p>
      </div>
    );

    // ─ Slide 1: 선인의 첫마디 (AI opener) ─
    const renderSlide1 = () => {
      const st = aiContent['opener']?.status;
      return (
        <div className="flex-1 flex flex-col text-center">
          <div className="flex flex-col items-center gap-6 py-6 px-4">
            <div className="text-3xl" style={{color:'#f0c040'}}>☽</div>
            <div>
              <p className="text-sm font-semibold mb-3" style={{color:'rgba(255,255,255,0.85)'}}>선인의 첫마디</p>
              {st==='loading' && !aiContent['opener']?.content ? (
                <div className="flex gap-1.5 justify-center items-center h-12">
                  {[0,1,2].map(i=>(
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{backgroundColor:'#f0c040',animationDelay:`${i*150}ms`}}/>
                  ))}
                </div>
              ) : (
                <p className="saju-body text-base leading-relaxed whitespace-pre-line max-w-xs mx-auto" style={{color:'rgba(255,255,255,0.90)'}}>
                  {aiContent['opener']?.content||'...'}
                </p>
              )}
            </div>
            {sajuData && (
              <div className="flex gap-2 flex-wrap justify-center mt-2">
                {ILGAN_INFO[sajuData.ilgan]?.tags.map(t=>(
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                    style={{backgroundColor:`${ACCENT}25`,color:'#f0c040'}}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    // ─ Slide 2: 사주원국 ─
    const renderSlide2 = () => {
      const { pillars, sipseong, isHourUnknown } = sajuData!;
      const BRIGHT = "#f0c040";
      const cols = [
        { label:'시주(時柱)', sub:'노년·자녀', p:pillars.hour,  ss:sipseong.hour,  empty:isHourUnknown, isDay:false },
        { label:'일주(日柱)', sub:'나·중년',   p:pillars.day,   ss:sipseong.day,   empty:false,          isDay:true  },
        { label:'월주(月柱)', sub:'사회·청년', p:pillars.month, ss:sipseong.month, empty:false,          isDay:false },
        { label:'연주(年柱)', sub:'뿌리·유년', p:pillars.year,  ss:sipseong.year,  empty:false,          isDay:false },
      ];
      return (
        <div className="flex-1 py-3 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">사주원국 (四柱原局)</h2>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.70)'}}>태어난 연·월·일·시로 본 당신의 타고난 운명 설계도</p>
          </div>
          <div className="flex gap-1.5">
            {cols.map(c=>(
              <div key={c.label} className="flex-1 flex flex-col items-center rounded-xl py-3 px-1 gap-1"
                style={{
                  backgroundColor: c.isDay?`${ACCENT}1a`:'rgba(255,255,255,0.07)',
                  border: c.isDay?`1.5px solid ${ACCENT}cc`:'1px solid rgba(255,255,255,0.18)',
                }}>
                <div className="text-[11px] font-bold text-center leading-tight" style={{color:c.isDay?BRIGHT:'rgba(255,255,255,0.90)'}}>{c.label}</div>
                <div className="text-[10px] text-center" style={{color:'rgba(255,255,255,0.60)'}}>{c.sub}</div>
                {c.empty||!c.p?(
                  <div className="flex-1 flex items-center justify-center text-lg" style={{color:'rgba(255,255,255,0.25)'}}>─</div>
                ):(
                  <>
                    <div className="mt-2 text-center">
                      <div className="text-3xl font-bold leading-none" style={{color:BRIGHT}}>{STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA]??c.p.stem}</div>
                      <div className="text-[18px] mt-1 font-medium leading-none" style={{color:'rgba(255,220,100,0.90)'}}>{c.p.stem}</div>
                    </div>
                    <div className="w-full my-2" style={{height:'1px',backgroundColor:'rgba(255,255,255,0.18)'}}/>
                    <div className="text-center">
                      <div className="text-3xl font-bold leading-none text-white">{BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA]??c.p.branch}</div>
                      <div className="text-[18px] mt-1 font-medium leading-none" style={{color:'rgba(255,255,255,0.80)'}}>{c.p.branch}</div>
                    </div>
                    {c.ss&&(
                      <div className="mt-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor:c.isDay?`${ACCENT}28`:'rgba(255,255,255,0.12)',
                            color:c.isDay?BRIGHT:(SIPSEONG_COLOR[c.ss.stem]??'rgba(255,255,255,0.80)'),
                          }}>
                          {c.isDay?'일간':c.ss.stem}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 space-y-2" style={{backgroundColor:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.14)'}}>
            <p className="text-xs font-semibold mb-2" style={{color:BRIGHT}}>각 기둥이 말하는 것</p>
            {([
              { k:'연주(年柱)', color:'rgba(255,255,255,0.90)', desc:'태어난 해의 기운. 조상에게 물려받은 기질과 어린 시절 환경을 담고 있습니다.' },
              { k:'월주(月柱)', color:'rgba(255,255,255,0.90)', desc:'태어난 달의 기운. 청년기의 성장 환경과 사회에서의 역할·직업운을 나타냅니다.' },
              { k:'일주(日柱)', color:BRIGHT,                   desc:'태어난 날의 기운. 나 자신의 본질과 배우자 자리. 사주에서 가장 핵심 기둥입니다.' },
              { k:'시주(時柱)', color:'rgba(255,255,255,0.90)', desc:'태어난 시의 기운. 노년의 삶과 자녀와의 인연, 말년 복을 나타냅니다.' },
            ] as const).map(({k,color,desc})=>(
              <div key={k}>
                <span className="text-xs font-bold" style={{color}}>{k}</span>
                <p className="text-[11px] leading-relaxed mt-0.5" style={{color:'rgba(255,255,255,0.75)'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // ─ Slide 3: 일간 소개 ─
    if (slide===3) {
      const info = ILGAN_INFO[sajuData!.ilgan];
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-6">
          <p className="text-sm font-semibold" style={{color:'rgba(255,255,255,0.85)'}}>일간(日干) 소개</p>
          <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold"
            style={{backgroundColor:`${ACCENT}20`,border:`2px solid ${ACCENT}99`,color:'#f0c040'}}>
            {info?.hanja||'?'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{info?.name}</h3>
            <p className="text-sm mt-2 leading-relaxed max-w-[260px]" style={{color:'rgba(255,255,255,0.82)'}}>{info?.desc}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {info?.tags.map(t=>(
              <span key={t} className="text-xs px-3 py-1 rounded-full"
                style={{backgroundColor:`${ACCENT}25`,color:'#f0c040'}}>{t}</span>
            ))}
          </div>
        </div>
      );
    }

    // ─ Slide 4: 오행 분포 (거미줄 레이더) ─
    const renderSlide4 = () => {
      const { elements, yongsin } = sajuData!;
      const total = Object.values(elements).reduce((a,b)=>a+b,0)||1;
      const ELEM_DESC: Record<string,string> = {
        목:'창의·성장', 화:'열정·표현', 토:'안정·신뢰', 금:'결단·의지', 수:'지혜·직관',
      };
      const TYPE_DESC: Record<string,string> = {
        목:'성장 지향적이고 창의적인 사람', 화:'열정적이고 표현력이 넘치는 사람',
        토:'믿음직하고 안정감을 주는 사람', 금:'논리적이고 결단력 있는 사람',
        수:'직관이 강하고 유연한 사람',
      };
      const ELEM_ORDER = ['목','화','토','금','수'];
      const topEl = (Object.entries(elements).sort((a,b)=>b[1]-a[1])[0]?.[0]) ?? '목';
      const cx=170, cy=175, R=88;
      const MIN_SCALE = 0.05;
      const maxVal = Math.max(...ELEM_ORDER.map(el=>((elements as Record<string,number>)[el]||0)), 1);
      const angs = ELEM_ORDER.map((_,i)=>(i*72-90)*Math.PI/180);
      const pt = (i:number, s:number):[number,number] => [
        cx + R*s*Math.cos(angs[i]),
        cy + R*s*Math.sin(angs[i]),
      ];
      const gridPts = (s:number) => ELEM_ORDER.map((_,i)=>pt(i,s).join(',')).join(' ');
      const dataPts = ELEM_ORDER.map((el,i)=>{
        const raw = ((elements as Record<string,number>)[el]||0)/maxVal;
        const s = Math.max(MIN_SCALE, raw);
        return pt(i,s).join(',');
      }).join(' ');
      const LO = 1.48;
      return (
        <div className="flex-1 py-2 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">오행 분포</h2>
            <p className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.70)'}}>타고난 다섯 에너지의 균형</p>
          </div>
          {/* 거미줄 SVG */}
          <div className="flex justify-center">
            <svg width="340" height="330" viewBox="0 0 340 330">
              {/* 그리드 거미줄 */}
              {[0.25,0.5,0.75,1.0].map((s,gi)=>(
                <polygon key={gi} points={gridPts(s)}
                  fill="none"
                  stroke={s===1.0?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.10)'}
                  strokeWidth={s===1.0?1.2:0.8}/>
              ))}
              {/* 축선 (중심 → 꼭짓점) */}
              {ELEM_ORDER.map((_,i)=>{
                const [x,y]=pt(i,1);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>;
              })}
              {/* 데이터 폴리곤 */}
              <polygon points={dataPts}
                fill={`${ELEM_COLORS[topEl]}35`}
                stroke={ELEM_COLORS[topEl]}
                strokeWidth="2.5"
                strokeLinejoin="round"/>
              {/* 외부 레이블 */}
              {ELEM_ORDER.map((el,i)=>{
                const [lx,ly]=pt(i,LO);
                const pct=Math.round(((elements as Record<string,number>)[el]||0)/total*100);
                const isTop=el===topEl;
                const anchor = lx<cx-10?'end':lx>cx+10?'start':'middle';
                const dx = anchor==='end'?-4:anchor==='start'?4:0;
                return (
                  <g key={i}>
                    <text x={lx+dx} y={ly-12} textAnchor={anchor} fontSize="24" fontWeight="bold"
                      fill={ELEM_COLORS[el]}>
                      {ELEM_HANJA[el]}
                    </text>
                    <text x={lx+dx} y={ly+12} textAnchor={anchor} fontSize="18" fontWeight={isTop?'bold':'normal'}
                      fill={ELEM_COLORS[el]}>
                      {pct}%
                    </text>
                    <text x={lx+dx} y={ly+28} textAnchor={anchor} fontSize="13"
                      fill="rgba(255,255,255,0.65)">
                      {ELEM_DESC[el].split('·')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          {/* 용신 */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{backgroundColor:`${ELEM_COLORS[yongsin]}22`,border:`1.5px solid ${ELEM_COLORS[yongsin]}77`}}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:`${ELEM_COLORS[yongsin]}33`,border:`1.5px solid ${ELEM_COLORS[yongsin]}`}}>
              <span style={{fontSize:18,fontWeight:'bold',color:ELEM_COLORS[yongsin]}}>{ELEM_HANJA[yongsin]}</span>
            </div>
            <div>
              <p className="text-sm" style={{color:'rgba(255,255,255,0.65)'}}>나에게 필요한 에너지 (용신)</p>
              <p className="text-base font-bold" style={{color:ELEM_COLORS[yongsin]}}>{yongsin} — {ELEM_DESC[yongsin]}</p>
            </div>
          </div>
          {/* 정체성 */}
          <div className="rounded-xl px-4 py-3 text-center"
            style={{backgroundColor:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.14)'}}>
            <p className="text-sm" style={{color:'rgba(255,255,255,0.60)'}}>당신은</p>
            <p className="text-base font-bold text-white mt-1">{ELEM_HANJA[topEl]}{topEl}형 — {TYPE_DESC[topEl]}</p>
          </div>
        </div>
      );
    };

    // ─ Slide 5: 신강신약 (에너지 총량) — 무료 영역에 복원 (2026-05-14) ─
    const renderSlide5 = () => {
      const { score, label, max } = calcEnergyScore(sajuData!.elements);
      const pct = Math.round((score/max)*100);
      return (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">신강신약 (身强身弱)</h2>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.60)'}}>일간의 힘이 강한지 약한지 — 용신 결정의 출발점</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold" style={{color:ACCENT}}>{score}</div>
            <div className="text-sm text-white/40 mt-1">/ {max}</div>
          </div>
          <div className="w-full">
            <div className="h-3 rounded-full overflow-hidden" style={{backgroundColor:`${ACCENT}15`}}>
              <div className="h-full rounded-full" style={{width:`${pct}%`,background:`linear-gradient(90deg,${ACCENT}88,${ACCENT})`}}/>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/30">신약</span>
              <span className="text-[10px] text-white/30">신왕</span>
            </div>
          </div>
          <div className="text-center py-3 px-6 rounded-2xl" style={{backgroundColor:`${ACCENT}15`}}>
            <p className="text-base font-bold" style={{color:ACCENT}}>{label}</p>
            <p className="text-xs text-white/50 mt-1">
              {label==='신약(身弱)'?'에너지를 아끼고 기를 보충하는 것이 중요합니다':
               label==='편약(偏弱)'?'특정 오행이 치우쳐 균형이 필요합니다':
               label==='중화(中和)'?'오행이 균형 잡혀 안정적인 기운입니다':
               label==='신강(身强)'?'강한 기운을 발산할 출구가 필요합니다':
               '넘치는 에너지를 잘 다스리는 것이 핵심입니다'}
            </p>
          </div>
        </div>
      );
    };

    // ─ Slide 6: 사주팔자 ─
    const renderSlide6 = () => {
      const { pillars, sipseong, isHourUnknown } = sajuData!;
      const BRIGHT = "#f0c040";
      const STEM_EL: Record<string,string> = {
        갑:'목',을:'목',병:'화',정:'화',무:'토',기:'토',경:'금',신:'금',임:'수',계:'수',
      };
      const BRANCH_EL: Record<string,string> = {
        자:'수',축:'토',인:'목',묘:'목',진:'토',사:'화',오:'화',미:'토',신:'금',유:'금',술:'토',해:'수',
      };
      const SS_DESC: Record<string,string> = {
        비견:'형제·독립', 겁재:'경쟁·재물변동',
        식신:'재능·먹을복', 상관:'예술·자유',
        편재:'사업·투자', 정재:'성실·고정수입',
        편관:'권력·도전', 정관:'명예·안정',
        편인:'전문기술·고독', 정인:'학문·인덕',
      };
      const sc = (s:string) => ELEM_COLORS[STEM_EL[s]??''] ?? BRIGHT;
      const bc = (b:string) => ELEM_COLORS[BRANCH_EL[b]??''] ?? 'rgba(255,255,255,0.90)';
      const rows = [
        { label:'연주(年柱)', sub:'유년·가족', p:pillars.year,  ss:sipseong.year,  isDay:false },
        { label:'월주(月柱)', sub:'청년·사회', p:pillars.month, ss:sipseong.month, isDay:false },
        { label:'일주(日柱)', sub:'중년·본인', p:pillars.day,   ss:sipseong.day,   isDay:true  },
        { label:'시주(時柱)', sub:'노년·자녀', p:isHourUnknown?null:pillars.hour, ss:isHourUnknown?null:sipseong.hour, isDay:false },
      ];
      return (
        <div className="flex-1 py-3 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">사주팔자 (四柱八字)</h2>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.60)'}}>여덟 글자에 담긴 나의 운명 코드</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {rows.map(r=>(
              <div key={r.label} className="rounded-xl p-3 flex flex-col gap-1.5"
                style={{
                  backgroundColor: r.isDay?`${ACCENT}1a`:'rgba(255,255,255,0.05)',
                  border: r.isDay?`1.5px solid ${ACCENT}cc`:'1px solid rgba(255,255,255,0.14)',
                }}>
                {/* 헤더 */}
                <div>
                  <div className="text-xs font-bold" style={{color:r.isDay?BRIGHT:'rgba(255,255,255,0.90)'}}>{r.label}</div>
                  <div className="text-[10px] mt-0.5" style={{color:r.isDay?`${ACCENT}cc`:'rgba(255,255,255,0.50)'}}>{r.sub}</div>
                </div>
                {r.p?(
                  <>
                    {/* 한자 */}
                    <div className="flex items-center justify-center gap-3 py-1">
                      <div className="text-center">
                        <div className="text-3xl font-bold leading-none" style={{color:sc(r.p.stem)}}>
                          {STEM_HANJA[r.p.stem as keyof typeof STEM_HANJA]}
                        </div>
                        <div className="text-[10px] mt-1" style={{color:'rgba(255,255,255,0.55)'}}>{r.p.stem}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold leading-none" style={{color:bc(r.p.branch)}}>
                          {BRANCH_HANJA[r.p.branch as keyof typeof BRANCH_HANJA]}
                        </div>
                        <div className="text-[10px] mt-1" style={{color:'rgba(255,255,255,0.55)'}}>{r.p.branch}</div>
                      </div>
                    </div>
                    {/* 십성 */}
                    {r.ss&&(
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{backgroundColor:`${SIPSEONG_COLOR[r.ss.stem]??ACCENT}25`,color:SIPSEONG_COLOR[r.ss.stem]??ACCENT}}>
                            {r.ss.stem}
                          </span>
                          <span className="text-[10px] text-right" style={{color:'rgba(255,255,255,0.55)'}}>{SS_DESC[r.ss.stem]}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{backgroundColor:`${SIPSEONG_COLOR[r.ss.branch]??ACCENT}25`,color:SIPSEONG_COLOR[r.ss.branch]??ACCENT}}>
                            {r.ss.branch}
                          </span>
                          <span className="text-[10px] text-right" style={{color:'rgba(255,255,255,0.55)'}}>{SS_DESC[r.ss.branch]}</span>
                        </div>
                      </div>
                    )}
                  </>
                ):(
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-xs" style={{color:'rgba(255,255,255,0.35)'}}>시간 미상</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    // ─ Slide 7: 십성 배치도 (레이더) ─
    const renderSlide7 = () => {
      const counts = getSipseongCounts(sajuData!.sipseong);
      const catColors: Record<string,string> = {
        비겁:'#60a5fa', 식상:'#34d399', 재성:'#fbbf24', 관성:'#f87171', 인성:'#a78bfa'
      };
      const SS_DESC_LONG: Record<string,string> = {
        비겁:'독립적이고 자주적인 성향이 강합니다',
        식상:'창의성과 표현력이 뛰어납니다',
        재성:'현실 감각과 재물 복이 있습니다',
        관성:'조직과 명예를 중시합니다',
        인성:'학문과 배움을 좋아합니다',
      };
      const SS_LIST: { key:string; desc:string }[] = [
        { key:'비겁', desc:'자립심·경쟁심·의리가 강하고 동료 복이 있습니다' },
        { key:'식상', desc:'말솜씨·예술 감각·자유로움이 뛰어납니다' },
        { key:'재성', desc:'돈을 잘 벌고 관리하며 현실적입니다' },
        { key:'관성', desc:'책임감·명예욕·조직 적응력이 강합니다' },
        { key:'인성', desc:'공부 운·어머니 덕·배움의 욕구가 있습니다' },
      ];
      const SS_ORDER = ['비겁','식상','재성','관성','인성'];
      const maxCount = Math.max(...Object.values(counts),1);
      const topCat = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '비겁';
      const cx=170, cy=175, R=88;
      const MIN_SCALE = 0.05;
      const angs = SS_ORDER.map((_,i)=>(i*72-90)*Math.PI/180);
      const pt = (i:number, s:number):[number,number] => [
        cx + R*s*Math.cos(angs[i]),
        cy + R*s*Math.sin(angs[i]),
      ];
      const gridPts = (s:number) => SS_ORDER.map((_,i)=>pt(i,s).join(',')).join(' ');
      const dataPts = SS_ORDER.map((cat,i)=>{
        const raw = (counts[cat]||0)/maxCount;
        const s = Math.max(MIN_SCALE, raw);
        return pt(i,s).join(',');
      }).join(' ');
      const LO = 1.48;
      return (
        <div className="flex-1 py-3 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">십성 배치도</h2>
            <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.70)'}}>나를 구성하는 다섯 가지 관계 에너지</p>
          </div>
          <div className="flex justify-center">
            <svg width="360" height="300" viewBox="-10 10 360 300">
              {[0.25,0.5,0.75,1.0].map((s,gi)=>(
                <polygon key={gi} points={gridPts(s)}
                  fill="none"
                  stroke={s===1.0?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.10)'}
                  strokeWidth={s===1.0?1.2:0.8}/>
              ))}
              {SS_ORDER.map((_,i)=>{
                const [x,y]=pt(i,1);
                return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>;
              })}
              <polygon points={dataPts}
                fill={`${catColors[topCat]}35`}
                stroke={catColors[topCat]}
                strokeWidth="2.5"
                strokeLinejoin="round"/>
              {SS_ORDER.map((cat,i)=>{
                const [lx,ly]=pt(i,LO);
                const n = counts[cat]||0;
                const isTop = cat===topCat;
                const anchor = lx<cx-10?'end':lx>cx+10?'start':'middle';
                const dx = anchor==='end'?-4:anchor==='start'?4:0;
                return (
                  <g key={i}>
                    <text x={lx+dx} y={ly-6} textAnchor={anchor} fontSize="18" fontWeight="bold"
                      fill={catColors[cat]}>
                      {cat}
                    </text>
                    <text x={lx+dx} y={ly+14} textAnchor={anchor} fontSize="16" fontWeight={isTop?'bold':'normal'}
                      fill={catColors[cat]}>
                      {n}개
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          {/* 기운 설명 리스트 */}
          <div className="rounded-xl px-4 py-3 space-y-2"
            style={{backgroundColor:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.12)'}}>
            {SS_LIST.map(({key,desc})=>(
              <div key={key} className="flex items-start gap-2">
                <span className="text-xs font-bold flex-shrink-0 w-10" style={{color:catColors[key]}}>{key}</span>
                <span className="text-[11px] leading-relaxed" style={{color:'rgba(255,255,255,0.75)'}}>{desc}</span>
              </div>
            ))}
          </div>
          {/* 가장 많은 기운 */}
          <div className="rounded-xl px-4 py-3 text-center"
            style={{backgroundColor:`${catColors[topCat]}22`,border:`1.5px solid ${catColors[topCat]}66`}}>
            <p className="text-sm" style={{color:'rgba(255,255,255,0.65)'}}>가장 많은 기운</p>
            <p className="text-base font-bold mt-1" style={{color:catColors[topCat]}}>
              {topCat} — {SS_DESC_LONG[topCat]}
            </p>
          </div>
        </div>
      );
    };

    // ─ Slide 8: 운명의 별자리 ─
    if (slide===8) {
      const sinsal = sajuData!.sinsal;
      type SinsalInfo = { icon:string; hanja:string; subtitle:string; desc:string; category:string };
      const CAT_ORDER = ['귀인','12신살','흉살','특수'];
      const CAT_COLOR: Record<string,string> = {
        귀인:'#fbbf24', '12신살':'#a78bfa', 흉살:'#f87171', 특수:'#60a5fa',
      };
      const grouped: Record<string,string[]> = {};
      for (const ss of sinsal) {
        const info = (SINSAL_INFO as Record<string,SinsalInfo>)[ss];
        const cat = info?.category || '특수';
        (grouped[cat] = grouped[cat] || []).push(ss);
      }
      return (
        <div className="flex-1 py-3 flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">운명의 별자리</h2>
            <p className="text-xs mt-1 leading-relaxed" style={{color:'rgba(255,255,255,0.65)'}}>
              사주 속에 숨어있는 특별한 기운들.<br/>
              태어날 때부터 가지고 있는 재능과 약점, 삶의 방향을 알려주는 별들입니다.
            </p>
          </div>
          {sinsal.length===0?(
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-white/40 text-center">특별한 별자리가 없습니다<br/>평범하지만 안정된 기운입니다</p>
            </div>
          ):(
            <div className="space-y-4">
              {CAT_ORDER.filter(cat => grouped[cat]?.length).map(cat => (
                <div key={cat}>
                  <p className="text-xs font-bold mb-2" style={{color:CAT_COLOR[cat]}}>{cat} · {grouped[cat].length}</p>
                  <div className="space-y-2">
                    {grouped[cat].map(ss => {
                      const info = (SINSAL_INFO as Record<string,SinsalInfo>)[ss];
                      return (
                        <div key={ss} className="flex items-start gap-3 p-3 rounded-xl"
                          style={{backgroundColor:`${CAT_COLOR[cat]}12`,border:`1px solid ${CAT_COLOR[cat]}33`}}>
                          <span className="text-xl flex-shrink-0">{info?.icon||'⭐'}</span>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {ss}
                              {info?.hanja && (
                                <span className="ml-1 font-normal" style={{color:'rgba(255,255,255,0.45)'}}>
                                  ({info.hanja})
                                </span>
                              )}
                            </div>
                            {info?.subtitle && (
                              <div className="text-[11px] italic mt-0.5" style={{color:`${CAT_COLOR[cat]}cc`}}>
                                — {info.subtitle}
                              </div>
                            )}
                            <div className="text-[11px] mt-1" style={{color:'rgba(255,255,255,0.70)'}}>{info?.desc||''}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ─ Slide 9: 대운 타임라인 ─
    if (slide===9) {
      const { daeun } = sajuData!;
      const _now = new Date();
      const _bm = parseInt(month), _bd = parseInt(day);
      const currentAge = _now.getFullYear() - parseInt(year) -
        (_now.getMonth() + 1 < _bm || (_now.getMonth() + 1 === _bm && _now.getDate() < _bd) ? 1 : 0);
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-2">대운 타임라인</h2>
          <p className="text-center text-xs mb-4" style={{color:`${ACCENT}55`}}>
            {daeun.direction}행 · {daeun.number}세 시작
          </p>
          <div className="space-y-2">
            {daeun.cycles.slice(0,8).map((c,i)=>{
              const endAge = daeun.cycles[i+1]?.age ?? c.age+10;
              const isCurrent = currentAge>=c.age && currentAge<endAge;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{
                    backgroundColor:isCurrent?`${ACCENT}20`:`${ACCENT}08`,
                    border:`1px solid ${isCurrent?ACCENT:`${ACCENT}15`}`,
                  }}>
                  <div className="text-xs text-white/40 w-16 flex-shrink-0">{c.age}~{endAge-1}세</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold" style={{color:isCurrent?ACCENT:'white'}}>
                      {STEM_HANJA[c.stem as keyof typeof STEM_HANJA]??c.stem}
                      {BRANCH_HANJA[c.branch as keyof typeof BRANCH_HANJA]??c.branch}
                    </span>
                    <span className="text-xs" style={{color:`${ACCENT}66`}}>{c.stem}{c.branch}운</span>
                  </div>
                  {isCurrent&&<span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:ACCENT,color:BG}}>현재</span>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ─ Slide 10: 세운표 2026-2030 ─
    if (slide===10) {
      const ilgan = sajuData!.ilgan;
      const currentYear = new Date().getFullYear();
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-4">세운 타임라인 (2026~2030)</h2>
          <div className="space-y-2.5">
            {SEUN_YEARS.map(sy=>{
              const isCurrent = sy.year===currentYear;
              const stemSS  = getSipseong(ilgan, sy.stem,  false);
              const branchSS= getSipseong(ilgan, sy.branch, true);
              return (
                <div key={sy.year} className="p-3 rounded-xl"
                  style={{
                    backgroundColor:isCurrent?`${ACCENT}20`:`${ACCENT}0a`,
                    border:`1px solid ${isCurrent?ACCENT:`${ACCENT}20`}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{color:isCurrent?ACCENT:'white'}}>{sy.year}년</span>
                      <span className="text-base font-bold text-white/80">{sy.shanHanja}</span>
                      <span className="text-xs" style={{color:`${ACCENT}77`}}>{sy.stem}{sy.branch}년</span>
                    </div>
                    {isCurrent&&<span className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor:ACCENT,color:BG}}>올해</span>}
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{backgroundColor:`${ACCENT}18`,color:SIPSEONG_COLOR[stemSS]??ACCENT}}>{stemSS}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{backgroundColor:`${ACCENT}10`,color:SIPSEONG_COLOR[branchSS]??`${ACCENT}77`}}>{branchSS}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }


    // ─ Slide 12 (핵심 요약) — 사용자 요청으로 완전 제거. navigation에서 슬라이드 13으로 자동 점프.
    //   아래 옛 렌더 블록은 모두 삭제됨. ─
    if (slide===12) return <div className="flex-1"/>;

    // ─ Slide 4: 목차 안내 ─
    const renderGuide = () => {
      const features = [
        '내 사주의 기본 구조 - 오행·십성·용신 이해',
        '나는 어떤 사람인가 - 기질과 마음의 기준',
        '타고난 재능의 방향 - 강점·성장 방식',
        '돈과 현실 감각 - 돈이 들어오고 새는 패턴',
        '일과 직업의 방향 - 잘 맞는 일의 환경',
        '사람과 인연 - 가까워지는 방식과 거리감',
        '몸과 마음의 리듬 - 지치고 회복되는 패턴',
        '조심해야 할 반복 패턴 - 운이 막힐 때의 습관',
        '시기별 흐름 - 지금과 앞으로의 흐름',
        '종합 해석과 앞으로의 방향 - 선택 기준 정리',
      ];
      return (
        <div className="flex-1 flex flex-col overflow-y-auto py-3 gap-4">
          {/* 목차 안내 — 맨 위 */}
          <div className="flex items-center gap-2 px-3 py-3 rounded-xl flex-shrink-0"
            style={{backgroundColor:`${ACCENT}15`, border:`1px solid ${ACCENT}30`}}>
            <span className="text-base">💡</span>
            <p className="text-sm font-medium" style={{color:`${ACCENT}ee`}}>
              우측 상단 <span className="font-bold">목차 ↓</span> 버튼으로 원하는 항목에 바로 이동할 수 있습니다
            </p>
          </div>
          {/* 신뢰 문구 */}
          <p className="text-sm leading-relaxed px-1" style={{color:`${ACCENT}bb`}}>
            수천 년간 동아시아에서 전승된 사주팔자(四柱八字) 해석 체계와 만세력의 천간·지지 원리를 기반으로 풀이합니다.
          </p>
          {/* 풀이 내용 */}
          <div className="rounded-2xl p-4" style={{backgroundColor:`${ACCENT}11`, border:`1px solid ${ACCENT}22`}}>
            <p className="text-xs font-bold mb-3 tracking-wider" style={{color:`${ACCENT}99`}}>풀이 내용</p>
            <ul className="space-y-2">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-white">
                  <span style={{color:ACCENT}}>✦</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    };

    // ─ Merged free pages dispatch ─
    // 선인의 첫마디(renderSlide1) 제거 — 사용자 요청
    if (slide===0) return (
      <div className="flex-1 flex flex-col overflow-y-auto gap-6 py-2">
        {renderSlide0()}
      </div>
    );
    if (slide===2) return (
      <div className="flex-1 flex flex-col overflow-y-auto gap-6 py-2">
        {renderSlide2()}
        {renderSlide4()}
        {renderSlide5()}
        {renderSlide6()}
        {renderSlide7()}
        {renderGuide()}
      </div>
    );
    if (slide===1) return renderSlide1();
    if (slide===4) return renderSlide4();
    if (slide===6) return renderSlide6();
    if (slide===7) return renderSlide7();
    if (slide===GUIDE) return renderGuide();

    // ─ AI 풀이 슬라이드 ─
    const aiKey = SLIDE_AI[slide];
    if (aiKey && aiKey!=='opener') {
      const st = aiContent[aiKey];
      const secLabel = SECTION_LABELS[slide];
      const pages    = displayPages[aiKey] || [];
      const pgIdx    = aiPage[aiKey] || 0;
      const pageText = pages[pgIdx] || st?.content || '';
      const totalPgs = pages.length;
      const badges = sajuData ? getSectionBadges(aiKey, sajuData) : [];
      // sub별 시각 컴포넌트 매핑 (섹션 주제에 맞춰 재배치 — 2026-05-14)
      // 의미 매핑:
      //   personality1(나는 누구) = 오행 펜타곤 — 기본 결
      //   personality2(타고난 재능) = 십성 펜타곤 — 식상·재성·관성·인성으로 본 재능 결
      //   money1(돈) = 십성 막대 — 재성/식상 강조
      //   money2(일·직업) = 일간 키워드 — 직업 성향 캐릭터
      //   love1(사람과 인연) = 십성 펜타곤 — 비겁·관성으로 본 관계 결
      //   love2 = 오행 막대 — 짝이 되는 결 강·약
      //   love3 = 일간 키워드
      //   health(몸과 마음) = 오행 막대 — 약점 오행 부각
      //   hidden(조심 패턴) = 일간 키워드 (조심 결)
      //   timeline1(시기별 흐름) = 오행 펜타곤 — 흐르는 결
      //   timeline2(앞으로 5년) = 십성 막대 — 5년 운 톤
      //   compass(종합) = 용신 카드
      //   closing(마지막 한 마디) = 일간 키워드
      // ⭐ V2.1.10 (2026-05-15) Session H — sub별 시각화 매핑 확장
      // 기존: pgIdx===0 (첫 sub)만 시각화 / 나머지 sub는 텍스트만 (사용자 "볼맛 떨어짐" 피드백)
      // 신: 14개 saju-visuals 풀을 13섹션 × sub들에 골고루 분배
      const renderSectionVisual = () => {
        if (!sajuData) return null;
        const ilganTags = ILGAN_INFO[sajuData.ilgan]?.tags ?? [];
        const counts = countSipseongFromSaju(sajuData);
        const byInt = parseInt(year, 10);
        const ageNow = isFinite(byInt) ? (new Date().getFullYear() - byInt) : 30;
        const filteredLoveSinsal = (sajuData.sinsal || []).filter(s => ['도화살','홍염살','천을귀인','금여'].includes(s));
        // 섹션·sub별 시각화 매트릭스
        const key = `${aiKey}-${pgIdx}`;
        switch (key) {
          // personality1 — 나는 어떤 사람인가 (4 sub)
          case 'personality1-0': return <SajuElementsRadar elements={sajuData.elements} />;
          case 'personality1-1': return <SajuElementsSpectrum elements={sajuData.elements} />;
          case 'personality1-2': return <SajuSipseongRadar counts={counts} />;
          case 'personality1-3': return <SajuYongsinCard yongsin={sajuData.yongsin} />;

          // personality2 — 타고난 재능의 방향 (4 sub)
          case 'personality2-0': return <SajuTalentTop3 counts={counts} />;
          case 'personality2-1': return <SajuSipseongSpectrum counts={counts} />;
          case 'personality2-2': return <SajuKeywordCard keywords={ilganTags} />;
          case 'personality2-3': return <SajuElementsRadar elements={sajuData.elements} />;

          // money1 — 돈과 현실 감각 (4 sub)
          case 'money1-0': return <SajuLifeWealthCurve saju={sajuData} />;
          case 'money1-1': return <SajuMoneyMeter counts={counts} />;
          case 'money1-2': return <SajuSinsalCards sinsal={sajuData.sinsal || []} />;
          case 'money1-3': return <SajuYongsinCard yongsin={sajuData.yongsin} />;

          // money2 — 일과 직업의 방향 (4 sub)
          case 'money2-0': return <SajuJobRadar counts={counts} elements={sajuData.elements} />;
          case 'money2-1': return <SajuSipseongRadar counts={counts} />;
          case 'money2-2': return <SajuElementsSpectrum elements={sajuData.elements} />;
          case 'money2-3': return <SajuDaeunTimeline cycles={sajuData.daeun?.cycles ?? []} currentAge={ageNow} />;

          // love1 — 사람과 인연 (4 sub)
          case 'love1-0': return <SajuSipseongRadar counts={counts} />;
          case 'love1-1': return <SajuKeywordCard keywords={ilganTags} />;
          case 'love1-2': return <SajuYongsinCard yongsin={sajuData.yongsin} />;
          case 'love1-3': return <SajuSinsalCards sinsal={filteredLoveSinsal} />;

          // love2 — 인연의 결 세부 (5 sub)
          case 'love2-0': return <SajuKeywordCard keywords={ilganTags} />;
          case 'love2-1': return <SajuSipseongSpectrum counts={counts} />;
          case 'love2-2': return <SajuElementsRadar elements={sajuData.elements} />;
          case 'love2-3': return <SajuSinsalCards sinsal={filteredLoveSinsal} />;
          case 'love2-4': return <SajuYongsinCard yongsin={sajuData.yongsin} />;

          // love3 — 인연의 시기와 귀인 (4 sub)
          case 'love3-0': return <SajuSinsalCards sinsal={filteredLoveSinsal} />;
          case 'love3-1': return <SajuSipseongRadar counts={counts} />;
          case 'love3-2': return <SajuDaeunTimeline cycles={sajuData.daeun?.cycles ?? []} currentAge={ageNow} />;
          case 'love3-3': return <SajuSinsalCards sinsal={(sajuData.sinsal || []).filter(s => ['천을귀인','천덕귀인','월덕귀인','금여'].includes(s))} />;

          // health — 몸과 마음의 리듬 (4 sub)
          case 'health-0': return <SajuHealthMap elements={sajuData.elements} />;
          case 'health-1': return <SajuElementsSpectrum elements={sajuData.elements} />;
          case 'health-2': return <SajuYongsinCard yongsin={sajuData.yongsin} />;
          case 'health-3': return <SajuSipseongSpectrum counts={counts} />;

          // hidden — 조심해야 할 반복 패턴 (4 sub)
          case 'hidden-0': return <SajuSinsalCards sinsal={sajuData.sinsal || []} />;
          case 'hidden-1': return <SajuElementsRadar elements={sajuData.elements} />;
          case 'hidden-2': return <SajuSinsalCards sinsal={(sajuData.sinsal || []).filter(s => ['괴강살','백호대살','양인살','현침살'].includes(s))} />;
          case 'hidden-3': return <SajuSinsalCards sinsal={(sajuData.sinsal || []).filter(s => ['월덕귀인','문창귀인','학당귀인','복성귀인'].includes(s))} />;

          // timeline1 — 시기별 흐름 (3 sub)
          case 'timeline1-0': return <SajuDaeunTimeline cycles={sajuData.daeun?.cycles ?? []} currentAge={ageNow} />;
          case 'timeline1-1': return <SajuSeunGrid thisYear={new Date().getFullYear()} />;
          case 'timeline1-2': return <SajuLifeWealthCurve saju={sajuData} />;

          // timeline2 — 앞으로 5년의 흐름 (5 sub)
          case 'timeline2-0': return <SajuSeunGrid thisYear={new Date().getFullYear()} />;
          case 'timeline2-1': return <SajuSeunGrid thisYear={new Date().getFullYear() + 1} />;
          case 'timeline2-2': return <SajuSeunGrid thisYear={new Date().getFullYear() + 2} />;
          case 'timeline2-3': return <SajuDaeunTimeline cycles={sajuData.daeun?.cycles ?? []} currentAge={ageNow} />;
          case 'timeline2-4': return <SajuKeywordCard keywords={ilganTags} />;

          // compass — 종합 해석 (3 sub)
          case 'compass-0': return <SajuKeywordCard keywords={ilganTags} />;
          case 'compass-1': return <SajuYongsinCard yongsin={sajuData.yongsin} />;
          case 'compass-2': return <SajuElementsRadar elements={sajuData.elements} />;

          // closing — 묵도인의 마지막 한 마디 (2 sub)
          case 'closing-0': return <SajuKeywordCard keywords={ilganTags} />;
          case 'closing-1': return <SajuYongsinCard yongsin={sajuData.yongsin} />;

          default:
            return null;
        }
      };
      return (
        <div className="flex-1 py-1 flex flex-col">
          {/* 배너 이미지 제거 (사용자 요청) */}
          <div className="flex-1">
            {renderSectionVisual()}
            {st?.status==='loading' && !st?.content ? <AiLoader sajuData={sajuData}/> :
             st?.status==='error'   ? <p className="text-base text-red-400 text-center py-8">오류가 발생했습니다</p> :
             (() => {
               // [요약: ...] 블록 통째 제거 (사용자 요청 — 본문 어디에 있든 strip)
               let cleanText = pageText.replace(/\[\s*요약\s*:[^\]]*\]\s*\n*/g, '');
               // "다음 풀이에 이어집니다" / "일부 소제목이 누락" 류 자리표시자 통째 제거
               cleanText = cleanText
                 .replace(/^.*다음\s*풀이에\s*이어집니다.*$\n?/gm, '')
                 .replace(/^.*일부\s*소제목이?\s*누락.*$\n?/gm, '');
               cleanText = cleanText.trim();
               // 모든 소제목(###/##/▶/#/**bold**)을 흰박스 밖으로 빼냄. 각 소제목마다 본문 카드 분리
               const lines = cleanText.split('\n');
               const matchHeading = (t: string): string | null => {
                 let m: RegExpMatchArray | null = null;
                 if ((m = t.match(/^###\s*(?:\d+\.\s*)?(.+)$/))) return stripBold(m[1].trim());
                 if ((m = t.match(/^##\s*(.+)$/)))                 return stripBold(m[1].trim());
                 if ((m = t.match(/^▶\s*(.+)$/)))                  return stripBold(m[1].trim());
                 if (t.startsWith('# ') && !t.startsWith('## ') && (m = t.match(/^#\s*(.+)$/))) return stripBold(m[1].trim());
                 if ((m = t.match(/^\*\*([^*]+)\*\*$/)))           return m[1].trim();
                 return null;
               };
               type Seg = { heading: string | null; body: string };
               const segments: Seg[] = [];
               let curH: string | null = null;
               let curBody: string[] = [];
               const flush = () => {
                 const bodyJoined = curBody.join('\n').trim();
                 // 빈 본문의 소제목은 통째 스킵 (자리표시자 strip 후 남은 고아 헤딩 정리)
                 if (bodyJoined) segments.push({ heading: curH, body: bodyJoined });
                 curH = null;
                 curBody = [];
               };
               for (const raw of lines) {
                 const h = matchHeading(raw.trim());
                 if (h !== null) {
                   flush();
                   curH = h;
                 } else {
                   curBody.push(raw);
                 }
               }
               flush();
               if (segments.length === 0) segments.push({ heading: null, body: cleanText });
               return (
                 <>
                   {segments.map((seg, sIdx) => (
                     <div key={sIdx}>
                       {seg.heading && (
                         <div className={`${sIdx === 0 ? 'mt-1' : 'mt-7'} mb-4 pt-2 pb-1`}>
                           <div
                             className="h-px w-full mb-3"
                             style={{
                               background: `linear-gradient(90deg, transparent, ${SAJU_GOLD_LIGHT}88, transparent)`,
                             }}
                           />
                           <h3
                             className="text-[18px] font-bold leading-snug text-left"
                             style={{
                               color: SAJU_GOLD_LIGHT,
                               fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
                               letterSpacing: "-0.01em",
                             }}
                           >
                             {seg.heading}
                           </h3>
                         </div>
                       )}
                       {seg.body && (
                         <div
                           className="rounded-md p-4"
                           style={{
                             background: "rgba(255,255,255,0.08)",
                             border: "1px solid rgba(201,150,12,0.32)",
                             boxShadow: "0 16px 42px -28px rgba(0,0,0,0.5)",
                           }}
                         >
                           {st?.status === 'loading'
                             ? <>{formatText(seg.body)}</>
                             : <TypeWriter key={`${aiKey}-${pgIdx}-${sIdx}`} text={seg.body} />}
                         </div>
                       )}
                     </div>
                   ))}
                 </>
               );
             })()
            }
          </div>
        </div>
      );
    }

    // ─ Slide 26: 선인에게 묻다 (Q&A) ─
    if (slide===26) {
      const MAX_Q = 3;
      const remaining = MAX_Q - questionCount;
      const handleSubmit = () => {
        if (!qaInput.trim() || qaLoading || questionCount >= MAX_Q) return;
        fetchQA(qaInput.trim());
        setQaInput('');
      };
      return (
        <div className="flex-1 flex flex-col py-3 gap-3">
          {/* 헤더 */}
          <div className="text-center flex-shrink-0">
            <span className="text-2xl">🔮</span>
            <h2 className="text-base font-bold text-white mt-1">선인에게 묻다</h2>
            <p className="text-[11px] mt-0.5" style={{color:`${ACCENT}55`}}>
              {isSavedUrl
                ? '이미 완료된 질문 기록입니다'
                : questionCount < MAX_Q
                  ? `${remaining}번 질문할 수 있습니다`
                  : '질문 횟수를 모두 사용했습니다'}
            </p>
          </div>

          {/* 빈 상태 */}
          {qaHistory.length===0&&(
            <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-xs text-white/30">평생 사주 풀이를 바탕으로</p>
              <p className="text-xs text-white/30">궁금한 것을 무엇이든 물어보세요</p>
            </div>
          )}

          {/* Q&A 기록 */}
          {qaHistory.length>0&&(
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {qaHistory.map((item,i)=>(
                <div key={i} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm text-sm text-white/90"
                      style={{backgroundColor:`${ACCENT}22`}}>
                      {item.q}
                    </div>
                  </div>
                  {item.a?(
                    <div className="flex justify-start">
                      <div className="max-w-[90%] px-3 py-2.5 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed text-white/80"
                        style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}20`}}>
                        {formatText(item.a)}
                      </div>
                    </div>
                  ):qaLoading&&i===qaHistory.length-1?(
                    <div className="flex gap-1.5 items-center pl-1 py-1">
                      {[0,1,2].map(j=>(
                        <div key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{backgroundColor:ACCENT,animationDelay:`${j*150}ms`}}/>
                      ))}
                    </div>
                  ):null}
                </div>
              ))}
            </div>
          )}

          {/* 입력 영역 — URL 공유 받은 경우 숨김 */}
          {!isSavedUrl && questionCount < MAX_Q && (
            <div className="flex gap-2 flex-shrink-0">
              <input
                value={qaInput}
                onChange={e=>setQaInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSubmit()}
                placeholder="무엇이든 물어보세요"
                className="flex-1 px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{backgroundColor:`${ACCENT}0f`,border:`1px solid ${ACCENT}33`}}
                disabled={qaLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={!qaInput.trim()||qaLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{backgroundColor:qaInput.trim()&&!qaLoading?ACCENT:`${ACCENT}33`,color:BG}}>
                묻기
              </button>
            </div>
          )}

          {/* 질문 소진 메시지 */}
          {questionCount >= MAX_Q && !qaLoading && (
            <div className="flex-shrink-0 text-center py-3">
              <p className="text-xs" style={{color:`${ACCENT}44`}}>
                선인과의 문답이 마무리되었습니다
              </p>
            </div>
          )}
        </div>
      );
    }

    // ─ Slide 27: 마지막 ─
    if (slide===27) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-6">
          <div>
            <div className="text-4xl mb-4">🌙</div>
            <p className="text-lg font-bold text-white">命은 흐름이지,</p>
            <p className="text-lg font-bold text-white">정해진 것이 아닙니다.</p>
            <p className="text-sm mt-3" style={{color:`${ACCENT}77`}}>— 묵도인</p>
          </div>
          <div className="w-full space-y-3 max-w-xs">
            <button
              onClick={handleShareFull}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{backgroundColor:ACCENT,color:BG}}>
              💬 &nbsp;풀이 전체 공유하기
            </button>
            <button
              onClick={handleShareItems}
              className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{backgroundColor:`${ACCENT}22`,color:ACCENT,border:`1px solid ${ACCENT}44`}}>
              🐾 &nbsp;사주 아이템 6가지 공유하기
            </button>
            <button
              onClick={handleCopyUrl}
              className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{backgroundColor:urlCopied?`#4ade8022`:`${ACCENT}22`,color:urlCopied?'#4ade80':ACCENT,border:`1px solid ${urlCopied?'#4ade8044':ACCENT+'44'}`}}>
              {urlCopied ? '✓ 복사 완료!' : '🔗 내 사주 URL 복사하기'}
            </button>
            <Link href="/saju"
              className="block w-full py-3 rounded-2xl text-sm font-medium text-center transition-all"
              style={{backgroundColor:`${ACCENT}15`,color:ACCENT}}>
              처음으로 돌아가기
            </Link>
          </div>
        </div>
      );
    }

    return null;
  }

  // ── 결제 게이트 ── 결제 완료(unlocked=1) 전엔 PaymentModal만 ──
  // 흐름(2026-05-14): "사주 풀이 시작" → result 진입 → 결제창 → 영상 + LLM 50% 대기 → 본문
  // saved=1 재방문은 이미 본 풀이라 게이트 스킵.
  if (!unlocked && params.get("saved") !== "1") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0d1a0f" }}>
        <PaymentModal
          open={true}
          onClose={() => { window.location.href = "/saju/form"; }}
          price={PRICE}
          goodsName="평생 사주 풀이"
          onSubmit={handlePayment}
          onFreeUnlock={handleFreeUnlock}
        />
      </div>
    );
  }

  // ── 평생사주 오프닝 영상 ─────────────────────────
  // 결제 완료 후 노출. 영상 재생 동안 LLM 백그라운드 로딩, 50% 미만이면 영상 끝나도 대기.
  // 저장된 풀이(saved=1) 재방문 시 스킵 (openingDone init=true)
  if (!openingDone) {
    const sectionsDone = Object.values(aiContent).filter(s => s.status === "done").length;
    return (
      <OpeningVideo
        src="/평생사주.mp4"
        theme="saju"
        dataReady={!!sajuData && sectionsDone >= 5}
        loadProgress={sectionsDone / 5}
        onComplete={() => setOpeningDone(true)}
        loadingMessage={`${name || '당신'}님의 평생 사주를 펼치는 중…`}
      />
    );
  }

  const chapterItems = TOC_ITEMS.map((item, idx) => ({ no: idx + 1, label: item.label, slide: item.slide }));
  const currentChapter = (() => {
    if (slide <= FREE_END) return chapterItems[0];
    const found = [...chapterItems].reverse().find((item) => slide >= item.slide);
    return found ?? chapterItems[0];
  })();

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)",
        backgroundAttachment: "fixed",
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
    {/* 별빛 배경 (랜딩 페이지 톤 통일) */}
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(1px 1px at 20% 30%, rgba(228, 184, 64, 0.5), transparent),
          radial-gradient(1px 1px at 70% 60%, rgba(228, 184, 64, 0.4), transparent),
          radial-gradient(1px 1px at 40% 80%, rgba(228, 184, 64, 0.3), transparent),
          radial-gradient(1px 1px at 85% 20%, rgba(228, 184, 64, 0.4), transparent),
          radial-gradient(1px 1px at 15% 70%, rgba(228, 184, 64, 0.3), transparent),
          radial-gradient(1px 1px at 60% 15%, rgba(228, 184, 64, 0.4), transparent),
          radial-gradient(1px 1px at 90% 85%, rgba(228, 184, 64, 0.3), transparent)
        `,
        backgroundSize: "100% 100%",
        zIndex: 0,
      }}
    />
    <main className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col relative" style={{zIndex:1}}>

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 sticky top-0 z-20"
        style={{borderBottom:`1px solid rgba(212,169,107,0.34)`,background:"rgba(7,23,13,0.92)",backdropFilter:"blur(10px)"}}>
        <span className="w-4" aria-hidden="true" />
        <div className="flex-1 text-center min-w-0">
          <div className="text-[13px] font-bold truncate" style={{color:SAJU_CREAM}}>
            제{currentChapter.no}장 · {currentChapter.label}
          </div>
        </div>
        <span className="text-[11px] tabular-nums" style={{color:SAJU_GOLD_LIGHT,fontFamily:"'Cormorant Garamond', serif"}}>
          {currentChapter.no} / {chapterItems.length}
        </span>
        <button onClick={()=>setShowToc(v=>!v)}
          className="text-xs px-2.5 py-1.5 rounded-full transition-all"
          style={{background:"rgba(212,169,107,0.12)",border:"1px solid rgba(212,169,107,0.55)",color:SAJU_GOLD_LIGHT}}>
          목차
        </button>
      </div>

      {/* TOC 드롭다운 */}
      {showToc&&(
        <>
        <div className="fixed inset-0 z-30" style={{background:"rgba(7,23,13,0.58)"}} onClick={()=>setShowToc(false)} />
        <div className="fixed top-[58px] left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[464px] z-40 rounded-lg shadow-2xl overflow-y-auto max-h-[70vh]"
          style={{
            background:"linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(253,243,232,0.96) 100%)",
            border:"1px solid rgba(212,169,107,0.45)",
            boxShadow:"0 24px 60px -16px rgba(0,0,0,0.42)",
          }}>
          <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid rgba(212,169,107,0.25)"}}>
            <span className="text-sm font-bold" style={{color:SAJU_INK,fontFamily:"'Nanum Myeongjo', serif"}}>목차</span>
            <button onClick={()=>setShowToc(false)} style={{color:SAJU_GOLD,fontSize:18,lineHeight:1}}>✕</button>
          </div>
          {chapterItems.map(item=>{
            const locked = !unlocked && item.slide >= AI_START;
            const isCurrent = currentChapter.no === item.no;
            return (
              <button key={item.no}
                onClick={()=>{
                  if (locked) {
                    setShowToc(false);
                    setShowPayModal(true);
                    return;
                  }
                  goSlide(item.slide);
                  if (typeof window !== "undefined") window.scrollTo({top:0,behavior:"smooth"});
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                style={{
                  borderBottom:"1px solid rgba(212,169,107,0.15)",
                  background:isCurrent?"rgba(18,53,31,0.09)":"transparent",
                  color:locked?"rgba(26,10,20,0.38)":isCurrent?SAJU_GREEN:SAJU_INK,
                }}>
                <span className="text-[13px]" style={{fontFamily:"'Gowun Batang', serif"}}>제{item.no}장 · {item.label}</span>
                {locked ? <span className="text-[10px]" style={{color:SAJU_GOLD}}>잠김</span> : isCurrent ? <span className="text-[10px]" style={{color:SAJU_GREEN}}>●</span> : null}
              </button>
            );
          })}
        </div>
        </>
      )}

      {/* 슬라이드 영역 */}
      <div className="px-4 pt-7 pb-3 text-center">
        <div
          className="inline-block text-[12px] tracking-[0.32em] uppercase mb-3 font-bold px-4 py-1.5 rounded-full"
          style={{
            color: SAJU_GOLD_LIGHT,
            fontFamily: "'Cormorant Garamond', serif",
            textShadow: "0 1px 0 rgba(0,0,0,0.35)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(212,169,107,0.48)",
            boxShadow: "0 8px 22px -14px rgba(0,0,0,0.8)",
          }}
        >
          Chapter {String(currentChapter.no).padStart(2,"0")}
        </div>
        <h1 className="text-[19px] font-bold leading-snug" style={{color:SAJU_CREAM,fontFamily:"'Nanum Myeongjo', 'Noto Serif KR', serif",letterSpacing:"-0.01em"}}>
          {currentChapter.label}
        </h1>
        {currentChapter.no === 1 && (
          <div
            className="mt-5 mx-auto w-full rounded-md px-5 py-4 text-left"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: `1px dashed ${SAJU_GOLD_LIGHT}66`,
            }}
          >
            {sajuSummaryLines.map((line) => (
              <div
                key={line}
                className="text-[13px] leading-[1.7]"
                style={{
                  color: SAJU_CREAM,
                  fontFamily: "'Gowun Batang', serif",
                }}
              >
                ▸ {line}
              </div>
            ))}
          </div>
        )}
        {headerPageText && slide > FREE_END && (
          <div className="text-[11px] mt-1 tabular-nums" style={{color:"rgba(251,243,232,0.62)",fontFamily:"'Cormorant Garamond', serif"}}>
            {headerPageText}
          </div>
        )}
        <div className="mt-3 h-px mx-auto" style={{maxWidth:80,background:`linear-gradient(90deg, transparent, ${SAJU_GOLD_LIGHT}, transparent)`}} />
      </div>

      <div className="flex-1 px-4 flex flex-col pb-24">
        <div key={slide} className="saju-prose slide-enter flex-1 flex flex-col">
          {renderSlide()}
        </div>
      </div>

      <div
        className="flex-shrink-0 px-4 py-3 sticky bottom-0 z-20"
        style={{
          borderTop: `1px solid rgba(212,169,107,0.34)`,
          background: "rgba(7,23,13,0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex gap-2">
          <button
            onClick={()=>{
              goPrev();
              if (typeof window !== "undefined") window.scrollTo({top:0,behavior:"smooth"});
            }}
            disabled={!canGoPrev}
            className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "rgba(212,169,107,0.12)",
              border: "1px solid rgba(212,169,107,0.55)",
              color: SAJU_GOLD_LIGHT,
              fontFamily: "'Gowun Batang', serif",
              letterSpacing: "0.05em",
            }}
          >
            ‹  이전 챕터
          </button>
          <button
            onClick={()=>{
              goNext();
              if (typeof window !== "undefined") window.scrollTo({top:0,behavior:"smooth"});
            }}
            disabled={!canGoNext}
            className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "rgba(212,169,107,0.12)",
              border: "1px solid rgba(212,169,107,0.55)",
              color: SAJU_GOLD_LIGHT,
              fontFamily: "'Gowun Batang', serif",
              letterSpacing: "0.05em",
            }}
          >
            다음 챕터  ›
          </button>
        </div>
      </div>

    </main>
    <PaymentModal
      open={showPayModal}
      onClose={() => setShowPayModal(false)}
      price={PRICE}
      goodsName="평생 사주 풀이"
      onSubmit={async (finalPrice) => {
        await handlePayment(finalPrice);
      }}
      onFreeUnlock={async (code) => {
        await handleFreeUnlock(code);
      }}
    />
    </div>
  );
}
