"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  type SajuAnalysis,
  getSipseong,
  STEM_HANJA, BRANCH_HANJA, SIPSEONG_COLOR, SINSAL_INFO,
} from "@/lib/saju-calculator";

const ACCENT = "#c9b4ff";
const BG     = "#1a0a2e";

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

// 섹션 첫 슬라이드에 표시할 인라인 헤더 (인트로 별도 슬라이드 없음)
const SECTION_LABELS: Record<number,{ title:string; icon:string }> = {
  13:{ title:'나라는 사람', icon:'🪞' },
  15:{ title:'돈과 일',    icon:'💰' },
  17:{ title:'사람과 사랑',icon:'🤝' },
  20:{ title:'몸과 마음',  icon:'🌿' },
  21:{ title:'숨겨진 카드',icon:'✨' },
  22:{ title:'흐르는 시간',icon:'🌊' },
  24:{ title:'나침반',     icon:'🧭' },
  25:{ title:'결',         icon:'🌙' },
};

// 슬라이드 → AI 섹션 키 매핑
const SLIDE_AI: Record<number,string> = {
  1: 'opener',
  13:'personality1', 14:'personality2',
  15:'money1',       16:'money2',
  17:'love1',        18:'love2', 19:'love3',
  20:'health',
  21:'hidden',
  22:'timeline1',    23:'timeline2',
  24:'compass',
  25:'closing',
};

// TOC 섹션 목록
const TOC_ITEMS = [
  { label:'사주 원국',  slide:2  },
  { label:'나라는 사람',slide:13 },
  { label:'돈과 일',    slide:15 },
  { label:'사람과 사랑',slide:17 },
  { label:'몸과 마음',  slide:20 },
  { label:'숨겨진 카드',slide:21 },
  { label:'흐르는 시간',slide:22 },
  { label:'나침반',     slide:24 },
  { label:'결',         slide:25 },
];

// 슬라이드 상수
const FREE_END  = 11;   // 마지막 무료 슬라이드 (풀이 목차)
const PAYWALL   = 12;   // 결제 슬라이드
const AI_START  = 13;   // 첫 AI 풀이 슬라이드
const TOTAL     = 27;   // 전체 (슬라이드 0~26)

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
function formatText(text:string) {
  return text.split("\n").map((line,i) => {
    // # 단독 제목 (소넷 출력 호환 — ## 로 격상)
    if (line.startsWith("# ") && !line.startsWith("## "))
      return <h2 key={i} className="font-bold mt-3 mb-3 text-[26px]" style={{color:ACCENT}}>{line.replace(/^#\s*/, '')}</h2>;
    // ▶ 소제목 (소넷 출력 호환 — ### 로 변환)
    if (line.startsWith("▶ "))
      return <h3 key={i} className="font-bold mt-4 mb-3 text-[22px] leading-snug" style={{color:ACCENT}}>{line.replace(/^▶\s*/, '')}</h3>;
    // ### 부제목
    if (line.startsWith("### "))
      return <h3 key={i} className="font-bold mt-4 mb-3 text-[22px] leading-snug" style={{color:ACCENT}}>{line.replace(/^###\s*\d*\.?\s*/, '')}</h3>;
    // ## 제목
    if (line.startsWith("## "))
      return <h2 key={i} className="font-bold mt-3 mb-3 text-[26px]" style={{color:ACCENT}}>{line.replace(/^##\s*/, '')}</h2>;
    // --- 구분선 → 스킵
    if (line.trim() === "---")
      return <div key={i} className="h-1"/>;
    // **굵게** 단독 줄
    if (/^\*\*[^*]+\*\*$/.test(line.trim()))
      return <h3 key={i} className="font-bold mt-5 mb-3 text-[20px]" style={{color:ACCENT}}>{line.replace(/\*\*/g,"")}</h3>;
    // 인라인 **굵게**
    if (/\*\*[^*]+\*\*/.test(line))
      return (
        <p key={i} className="text-[17px] leading-[1.85] text-white/90 mb-3">
          {line.split(/(\*\*[^*]+\*\*)/).map((p2,j) =>
            /^\*\*[^*]+\*\*$/.test(p2)
              ? <strong key={j} style={{color:ACCENT}}>{p2.replace(/\*\*/g,"")}</strong>
              : p2
          )}
        </p>
      );
    // 숫자 목록 (1. 2. 3. 형태)
    if (/^\d+\.\s/.test(line))
      return <li key={i} className="text-[17px] leading-[1.85] text-white/80 ml-5 mb-2 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
    // 불릿
    if (line.startsWith("- ")||line.startsWith("• "))
      return <li key={i} className="text-[17px] leading-[1.85] text-white/80 ml-5 mb-2 list-disc">{line.slice(2)}</li>;
    // 빈 줄
    if (line.trim()==="") return <div key={i} className="h-2"/>;
    // 일반 텍스트
    return <p key={i} className="text-[17px] leading-[1.85] text-white/85 mb-3">{line}</p>;
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
    return merged.length > 0 ? merged : [text];
  }
  // ### 없으면 **굵게** 줄 기준으로 분리
  const boldSections = text.split(/(?=^\*\*[^*]+\*\*$)/m).map(s => s.trim()).filter(s => s);
  if (boldSections.length > 1) {
    // 내용 없는 페이지(제목·요약만 있는 경우) 다음 페이지와 합치기
    const merged: string[] = [];
    for (let i = 0; i < boldSections.length; i++) {
      const s = boldSections[i];
      const contentLines = s.split('\n').map(l => l.trim())
        .filter(l => l && !/^\*\*[^*]+\*\*$/.test(l) && !l.startsWith('[요약:'));
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
  return [text];
}

// 줄 단위 페이드인 (80ms 간격으로 순서대로 등장)
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
  const weakEl = Object.entries(data.elements).filter(([,n])=>n===0).map(([el])=>ELEM_HANJA[el]+el);
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

type SectionState = { status:"idle"|"loading"|"done"|"error"; content:string };

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SajuSlideResult() {
  const params       = useSearchParams();
  const [slide, setSlide]         = useState(0);
  const [sajuData, setSajuData]   = useState<SajuAnalysis|null>(null);
  const [aiContent, setAiContent] = useState<Record<string,SectionState>>(() => {
    const keys = ['opener','personality1','personality2','money1','money2','love1','love2','love3','health','hidden','timeline1','timeline2','compass','closing'];
    return Object.fromEntries(keys.map(k=>[k,{status:'idle',content:''}]));
  });
  const [unlocked, setUnlocked]   = useState(false);
  const [phone, setPhone]         = useState("");
  const [paying, setPaying]       = useState(false);
  const [payProgress, setPayProgress] = useState(0);
  const [showToc, setShowToc]     = useState(false);
  // AI 콘텐츠 페이지 분할 상태
  const [aiPages, setAiPages]     = useState<Record<string,string[]>>({});
  const [aiPage, setAiPage]       = useState<Record<string,number>>({});
  const slideRef = useRef<HTMLDivElement>(null);

  const name         = params.get("name")         || "";
  const gender       = params.get("gender")       || "";
  const year         = params.get("year")         || "";
  const month        = params.get("month")        || "";
  const day          = params.get("day")          || "";
  const hour         = params.get("hour")         || "";
  const calendarType = params.get("calendarType") || "양력";

  const baseBody = { type:"saju", name, gender, year, month, day, hour, calendarType };

  // AI 섹션 fetch 헬퍼
  const fetchSection = (key: string): Promise<void> => {
    setAiContent(prev => ({ ...prev, [key]:{ status:'loading', content:'' } }));
    return fetch("/api/generate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...baseBody, section:key }),
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
                const partial = splitIntoPages(full);
                if (partial.length > 1) {
                  setAiPages(prev => ({ ...prev, [key]: partial }));
                  setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
                }
              }
            } else if (msg.t === 'e') {
              throw new Error();
            }
          }
        }
        if (key !== 'opener' && full) {
          setAiPages(prev => ({ ...prev, [key]: splitIntoPages(full) }));
          setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
        }
        setAiContent(prev => ({ ...prev, [key]:{ status:'done', content: full } }));

      } else {
        // ── JSON 모드 (릴레이) ──
        const d = await res.json();
        const content = d.result ?? '';
        setAiContent(prev => ({ ...prev, [key]:{ status: d.error?'error':'done', content } }));
        if (key !== 'opener' && content) {
          setAiPages(prev => ({ ...prev, [key]: splitIntoPages(content) }));
          setAiPage(prev => ({ ...prev, [key]: prev[key] ?? 0 }));
        }
        if (d.sajuData) setSajuData(d.sajuData);
      }
    }).catch(()=>{
      setAiContent(prev=>({...prev,[key]:{status:'error',content:''}}));
    });
  };

  // 초기 로드: opener만
  useEffect(()=>{
    fetchSection('opener');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 잠금 해제 시 병렬 fetch (릴레이: 멀티스레드 서버 / API키: Claude 동시 요청 지원)
  useEffect(()=>{
    if (!unlocked) return;
    const keys = ['personality1','personality2','money1','money2','love1','love2','love3','health','hidden','timeline1','timeline2','compass','closing'];
    keys.forEach(k => fetchSection(k));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  // 결제 시뮬레이션
  function handlePay() {
    if (phone.replace(/\D/g,"").length<10) return;
    setPaying(true);
    let p=0;
    const iv = setInterval(()=>{
      p += Math.random()*7+2;
      if (p>=100) {
        p=100; clearInterval(iv);
        setTimeout(()=>{ setUnlocked(true); setSlide(AI_START); },700);
      }
      setPayProgress(Math.min(100,Math.round(p)));
    },170);
  }

  // 현재 슬라이드의 AI 페이지 정보
  const curAiKey   = SLIDE_AI[slide];
  const curPages   = (curAiKey && curAiKey !== 'opener') ? (aiPages[curAiKey] || []) : [];
  const curPgIdx   = curAiKey ? (aiPage[curAiKey] || 0) : 0;
  const hasMorePages = curPages.length > 1 && curPgIdx < curPages.length - 1;

  // 네비게이션
  function goNext() {
    // AI 슬라이드에서 다음 페이지가 있으면 페이지 이동
    if (hasMorePages) {
      setAiPage(prev => ({ ...prev, [curAiKey!]: curPgIdx + 1 }));
      return;
    }
    if (slide===FREE_END) { setSlide(unlocked?AI_START:PAYWALL); return; }
    if (slide===PAYWALL)  return;
    if (slide<TOTAL-1)    setSlide(s=>s+1);
  }
  function goPrev() {
    // AI 슬라이드에서 이전 페이지가 있으면 페이지 이동
    if (curAiKey && curAiKey !== 'opener' && curPgIdx > 0) {
      setAiPage(prev => ({ ...prev, [curAiKey]: curPgIdx - 1 }));
      return;
    }
    if (slide>0) setSlide(s=>s-1);
  }
  function goSlide(n:number) {
    if (n>=AI_START && !unlocked) { setSlide(PAYWALL); return; }
    setSlide(n); setShowToc(false);
    // 목차로 이동 시 해당 섹션 첫 페이지로
    const key = SLIDE_AI[n];
    if (key) setAiPage(prev => ({ ...prev, [key]: 0 }));
  }

  const canGoNext  = hasMorePages || (slide!==PAYWALL && slide<TOTAL-1);
  const isLastSlide = slide===TOTAL-1 && !hasMorePages;

  // 현재 섹션 이름
  function currentSection() {
    if (slide<=FREE_END||slide===PAYWALL) return null;
    const sorted = Object.keys(SECTION_LABELS).map(Number).sort((a,b)=>a-b);
    let label = null;
    for (const s of sorted) {
      if (slide>=s) label = SECTION_LABELS[s].title;
    }
    return label;
  }

  // PDF 다운로드
  function handleDownloadPDF() {
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

    const sectionsHtml = aiKeys.map(sec=>{
      const content = sec.keys
        .map(k=>aiContent[k]?.content||'')
        .filter(Boolean)
        .join('\n\n')
        .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
        .replace(/\n/g,'<br>');
      return `<div class="section">
        <h2>${sec.title}</h2>
        <div class="content">${content||'<span style="color:#999">준비 중...</span>'}</div>
      </div>`;
    }).join('');

    const openerText = (aiContent['opener']?.content||'').replace(/\n/g,'<br>');
    const ilganInfo = sajuData ? ILGAN_INFO[sajuData.ilgan] : null;

    const win = window.open('','_blank');
    if (!win) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.'); return; }
    win.document.write(`<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8">
<title>${name}님의 평생 사주 풀이</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family:'Noto Sans KR',sans-serif; padding:48px; max-width:720px; margin:0 auto; color:#1a0a2e; line-height:1.85; font-size:14px; }
  .cover { text-align:center; padding:60px 0 40px; border-bottom:2px solid #7c3aed; margin-bottom:40px; }
  .cover h1 { font-size:28px; font-weight:700; color:#1a0a2e; }
  .cover .sub { color:#7c3aed; font-size:16px; margin-top:8px; }
  .cover .meta { color:#666; font-size:13px; margin-top:6px; }
  .opener { background:#f5f0ff; border-left:4px solid #7c3aed; padding:20px 24px; margin:24px 0; border-radius:0 8px 8px 0; font-style:italic; color:#4a1d96; }
  .section { margin:48px 0; page-break-before:always; }
  .section:first-child { page-break-before:avoid; }
  .section h2 { font-size:20px; font-weight:700; color:#7c3aed; border-bottom:2px solid #ede9fe; padding-bottom:10px; margin-bottom:20px; }
  .content { color:#333; line-height:1.9; }
  strong { color:#7c3aed; font-weight:700; }
  .footer { text-align:center; margin-top:80px; padding-top:24px; border-top:1px solid #eee; color:#999; font-size:12px; }
  @media print {
    body { padding:32px; }
    .section { page-break-before:always; }
    .section:first-of-type { page-break-before:avoid; }
  }
</style></head><body>
<div class="cover">
  <h1>${name}님의 평생 사주 풀이</h1>
  <div class="sub">${ilganInfo?`${ilganInfo.hanja} ${ilganInfo.name}`:''}</div>
  <div class="meta">${year}년 ${month}월 ${day}일 (${calendarType}) · ${gender}성 · ${hour}</div>
</div>
${openerText ? `<div class="opener">${openerText}</div>` : ''}
${sectionsHtml}
<div class="footer">운학선인 평생 사주 풀이 · AI 명리학 · ${new Date().getFullYear()}년</div>
<script>setTimeout(()=>{ window.print(); },800);</script>
</body></html>`);
    win.document.close();
  }

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.origin + '/saju' : 'https://saju.vercel.app';
    const text = 'AI 명리학 대가 운학선인의 평생 사주 풀이 — 소름 돋는 정확도를 경험해보세요';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: '운학선인 평생 사주', text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => alert('링크가 복사되었습니다!')).catch(() => alert(url));
    }
  }

  // ── 슬라이드 렌더 ────────────────────────────────────────────
  function renderSlide() {

    // 로딩 (saju 계산 대기) — opener(slide 1)는 sajuData 없어도 렌더 가능
    if (!sajuData && slide>=2 && slide<=FREE_END) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{borderColor:`${ACCENT}33`,borderTopColor:ACCENT}}/>
          <p className="text-xs" style={{color:`${ACCENT}66`}}>사주 계산 중...</p>
        </div>
      );
    }

    // ─ Slide 0: 커버 ─
    if (slide===0) return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl font-bold"
          style={{backgroundColor:`${ACCENT}15`,border:`2px solid ${ACCENT}44`,color:ACCENT}}>
          命
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{name}님의</h2>
          <h2 className="text-2xl font-bold" style={{color:ACCENT}}>평생 사주 풀이</h2>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-white/60">{year}년 {month}월 {day}일 ({calendarType})</p>
          <p className="text-sm text-white/60">{gender}성 · {hour}</p>
        </div>
        <p className="text-xs mt-2" style={{color:`${ACCENT}55`}}>운학선인이 풀어드립니다</p>
      </div>
    );

    // ─ Slide 1: 선인의 첫마디 (AI opener) ─
    if (slide===1) {
      const st = aiContent['opener']?.status;
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-6">
          <div className="text-3xl" style={{color:ACCENT}}>☽</div>
          <div>
            <p className="text-xs mb-2" style={{color:`${ACCENT}66`}}>선인의 첫마디</p>
            {st==='loading' && !aiContent['opener']?.content ? (
              <div className="flex gap-1.5 justify-center items-center h-12">
                {[0,1,2].map(i=>(
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{backgroundColor:ACCENT,animationDelay:`${i*150}ms`}}/>
                ))}
              </div>
            ) : (
              <p className="text-base leading-relaxed text-white/90 whitespace-pre-line max-w-xs mx-auto">
                {aiContent['opener']?.content||'...'}
              </p>
            )}
          </div>
          {sajuData && (
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {ILGAN_INFO[sajuData.ilgan]?.tags.map(t=>(
                <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                  style={{backgroundColor:`${ACCENT}18`,color:ACCENT}}>{t}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ─ Slide 2: 사주원국 ─
    if (slide===2) {
      const { pillars, sipseong, isHourUnknown } = sajuData!;
      const cols = [
        { label:'시(時)', p:pillars.hour,  ss:sipseong.hour,  empty:isHourUnknown },
        { label:'일(日)', p:pillars.day,   ss:sipseong.day,   empty:false },
        { label:'월(月)', p:pillars.month, ss:sipseong.month, empty:false },
        { label:'연(年)', p:pillars.year,  ss:sipseong.year,  empty:false },
      ];
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-4">사주원국 (四柱原局)</h2>
          <div className="rounded-2xl overflow-hidden" style={{border:`1px solid ${ACCENT}33`,backgroundColor:`${ACCENT}08`}}>
            <table className="w-full text-center text-xs">
              <thead><tr>{cols.map(c=>(
                <th key={c.label} className="py-2 font-normal" style={{color:`${ACCENT}77`,width:'25%',borderBottom:`1px solid ${ACCENT}22`}}>{c.label}</th>
              ))}</tr></thead>
              <tbody>
                <tr style={{borderTop:`1px solid ${ACCENT}15`}}>
                  {cols.map(c=>(
                    <td key={c.label} className="py-3">
                      {c.empty||!c.p?<span style={{color:`${ACCENT}44`}}>─</span>:(
                        <div>
                          <div className="text-xl font-bold" style={{color:ACCENT}}>{STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA]??c.p.stem}</div>
                          <div className="text-[10px] mt-0.5" style={{color:`${ACCENT}77`}}>{c.p.stem}</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr style={{backgroundColor:`${ACCENT}06`}}>
                  {cols.map((c,i)=>(
                    <td key={c.label} className="py-1">
                      {c.empty||!c.ss?<span style={{color:`${ACCENT}33`}}>─</span>:(
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{color:i===1?ACCENT:(SIPSEONG_COLOR[c.ss.stem]??`${ACCENT}99`),backgroundColor:i===1?`${ACCENT}22`:'transparent'}}>
                          {i===1?'일간':c.ss.stem}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr style={{borderTop:`1px solid ${ACCENT}20`}}>
                  {cols.map(c=>(
                    <td key={c.label} className="py-3">
                      {c.empty||!c.p?<span style={{color:`${ACCENT}44`}}>─</span>:(
                        <div>
                          <div className="text-xl font-bold text-white">{BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA]??c.p.branch}</div>
                          <div className="text-[10px] mt-0.5" style={{color:`${ACCENT}77`}}>{c.p.branch}</div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr style={{backgroundColor:`${ACCENT}06`}}>
                  {cols.map(c=>(
                    <td key={c.label} className="py-1">
                      {c.empty||!c.ss?<span style={{color:`${ACCENT}33`}}>─</span>:(
                        <span className="text-[10px] font-medium" style={{color:SIPSEONG_COLOR[c.ss.branch]??`${ACCENT}77`}}>
                          {c.ss.branch}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs mt-3" style={{color:`${ACCENT}55`}}>
            일주: {sajuData!.ilgan}{pillars.day.branch} · 일간 {STEM_HANJA[sajuData!.ilgan as keyof typeof STEM_HANJA]??sajuData!.ilgan}({sajuData!.ilgan})
          </p>
        </div>
      );
    }

    // ─ Slide 3: 일간 소개 ─
    if (slide===3) {
      const info = ILGAN_INFO[sajuData!.ilgan];
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-6">
          <p className="text-xs" style={{color:`${ACCENT}66`}}>일간(日干) 소개</p>
          <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-bold"
            style={{backgroundColor:`${ACCENT}15`,border:`2px solid ${ACCENT}55`,color:ACCENT}}>
            {info?.hanja||'?'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{info?.name}</h3>
            <p className="text-sm text-white/70 mt-2 leading-relaxed max-w-[260px]">{info?.desc}</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {info?.tags.map(t=>(
              <span key={t} className="text-xs px-3 py-1 rounded-full"
                style={{backgroundColor:`${ACCENT}18`,color:ACCENT}}>{t}</span>
            ))}
          </div>
        </div>
      );
    }

    // ─ Slide 4: 오행 분포 ─
    if (slide===4) {
      const { elements, yongsin } = sajuData!;
      const total = Object.values(elements).reduce((a,b)=>a+b,0)||1;
      const strong = Object.entries(elements).filter(([,n])=>n>=2).map(([el])=>el);
      const weak   = Object.entries(elements).filter(([,n])=>n===0).map(([el])=>el);
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-5">오행 분포</h2>
          <div className="space-y-3">
            {Object.entries(elements).map(([el,n])=>{
              const pct = Math.round((n/total)*100);
              return (
                <div key={el}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{color:ELEM_COLORS[el]}}>{ELEM_HANJA[el]}</span>
                      <span className="text-xs text-white/60">{el}</span>
                      {el===yongsin&&<span className="text-[10px] px-1.5 py-0.5 rounded" style={{backgroundColor:`${ELEM_COLORS[el]}33`,color:ELEM_COLORS[el]}}>용신</span>}
                    </div>
                    <span className="text-xs text-white/50">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:`${ACCENT}15`}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,backgroundColor:ELEM_COLORS[el]}}/>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 rounded-xl space-y-1" style={{backgroundColor:`${ACCENT}10`}}>
            {strong.length>0&&<p className="text-xs" style={{color:ACCENT}}>강한 오행: {strong.map(e=>ELEM_HANJA[e]+e).join(' · ')}</p>}
            {weak.length>0&&<p className="text-xs text-white/50">부족한 오행: {weak.map(e=>ELEM_HANJA[e]+e).join(' · ')}</p>}
            <p className="text-xs" style={{color:ELEM_COLORS[yongsin]||ACCENT}}>용신: {ELEM_HANJA[yongsin]}{yongsin}</p>
          </div>
        </div>
      );
    }

    // ─ Slide 5: 에너지 총량 ─
    if (slide===5) {
      const { score, label, max } = calcEnergyScore(sajuData!.elements);
      const pct = Math.round((score/max)*100);
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6">
          <p className="text-xs" style={{color:`${ACCENT}66`}}>에너지 총량</p>
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
    }

    // ─ Slide 6: 내 기둥 ─
    if (slide===6) {
      const { pillars, sipseong, isHourUnknown } = sajuData!;
      const rows = [
        { label:'연주(年柱)', sub:'유년·가족', p:pillars.year,  ss:sipseong.year },
        { label:'월주(月柱)', sub:'청년·사회', p:pillars.month, ss:sipseong.month },
        { label:'일주(日柱)', sub:'중년·본인', p:pillars.day,   ss:sipseong.day },
        { label:'시주(時柱)', sub:'노년·자녀', p:isHourUnknown?null:pillars.hour, ss:isHourUnknown?null:sipseong.hour },
      ];
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-4">내 기둥</h2>
          <div className="space-y-2">
            {rows.map(r=>(
              <div key={r.label} className="flex items-center p-3 rounded-xl gap-3"
                style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}20`}}>
                <div className="text-center w-16 flex-shrink-0">
                  <div className="text-[10px] font-bold text-white/80">{r.label}</div>
                  <div className="text-[9px]" style={{color:`${ACCENT}55`}}>{r.sub}</div>
                </div>
                {r.p?(
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-xl font-bold" style={{color:ACCENT}}>{STEM_HANJA[r.p.stem as keyof typeof STEM_HANJA]}</div>
                      <div className="text-xl font-bold text-white">{BRANCH_HANJA[r.p.branch as keyof typeof BRANCH_HANJA]}</div>
                    </div>
                    <div className="text-[10px] space-y-0.5">
                      <div style={{color:SIPSEONG_COLOR[r.ss!.stem]??`${ACCENT}99`}}>{r.ss!.stem}</div>
                      <div style={{color:SIPSEONG_COLOR[r.ss!.branch]??`${ACCENT}77`}}>{r.ss!.branch}</div>
                    </div>
                  </div>
                ):(
                  <span className="text-xs" style={{color:`${ACCENT}44`}}>시간 미상</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ─ Slide 7: 십성 배치도 ─
    if (slide===7) {
      const counts = getSipseongCounts(sajuData!.sipseong);
      const maxCount = Math.max(...Object.values(counts),1);
      const catColors: Record<string,string> = {
        비겁:'#60a5fa', 식상:'#34d399', 재성:'#fbbf24', 관성:'#f87171', 인성:'#a78bfa'
      };
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-5">십성 배치도</h2>
          <div className="space-y-4">
            {Object.entries(counts).map(([cat,n])=>(
              <div key={cat}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium" style={{color:catColors[cat]}}>{cat}</span>
                  <span className="text-xs text-white/40">{n}개</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{backgroundColor:`${ACCENT}15`}}>
                  <div className="h-full rounded-full" style={{
                    width:`${(n/maxCount)*100}%`,
                    backgroundColor:catColors[cat],
                    minWidth:n>0?'8px':'0'
                  }}/>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 rounded-xl" style={{backgroundColor:`${ACCENT}10`}}>
            {(() => {
              const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
              const desc: Record<string,string> = {
                비겁:'독립적이고 자주적인 성향이 강합니다',
                식상:'창의성과 표현력이 뛰어납니다',
                재성:'현실 감각과 재물 복이 있습니다',
                관성:'조직과 명예를 중시합니다',
                인성:'학문과 배움을 좋아합니다',
              };
              return <p className="text-xs text-white/70">{top[0]} 비중이 높습니다 — {desc[top[0]]}</p>;
            })()}
          </div>
        </div>
      );
    }

    // ─ Slide 8: 신살 지도 ─
    if (slide===8) {
      const sinsal = sajuData!.sinsal;
      return (
        <div className="flex-1 py-4">
          <h2 className="text-center text-base font-bold text-white mb-4">신살 지도</h2>
          {sinsal.length===0?(
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-white/40 text-center">특별한 신살이 없습니다<br/>평범하지만 안정된 기운입니다</p>
            </div>
          ):(
            <div className="space-y-3">
              {sinsal.map(ss=>{
                const info = (SINSAL_INFO as Record<string,{icon:string;desc:string}>)[ss];
                return (
                  <div key={ss} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}20`}}>
                    <span className="text-2xl flex-shrink-0">{info?.icon||'⭐'}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{ss}</div>
                      <div className="text-xs text-white/60 mt-0.5">{info?.desc||'특별한 기운을 가진 신살입니다'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // ─ Slide 9: 대운 타임라인 ─
    if (slide===9) {
      const { daeun } = sajuData!;
      const currentAge = new Date().getFullYear() - parseInt(year) + 1;
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

    // ─ Slide 11: 풀이 목차 ─
    if (slide===11) {
      const sections = [
        { icon:'🪞', label:'나라는 사람', items:['강점과 약점','겉모습 VS 속마음','일주 DNA'] },
        { icon:'💰', label:'돈과 일', items:['재물과 나의 관계','돈이 새는 이유','커리어 타이밍'] },
        { icon:'🤝', label:'사람과 사랑', items:['맞는 사람','사랑법','결혼과 귀인'] },
        { icon:'🌿', label:'몸과 마음', items:['건강 분석','건강 지키는 법'] },
        { icon:'✨', label:'숨겨진 카드', items:['잠재력','신살 풀이'] },
        { icon:'🌊', label:'흐르는 시간', items:['과거·현재 대운','향후 5년 세운'] },
        { icon:'🧭', label:'나침반', items:['용신','오늘부터 할 수 있는 것'] },
        { icon:'🌙', label:'결', items:['인생 키워드','운학선인의 당부'] },
      ];
      const scores = sajuData ? calcFortuneScores(sajuData) : [];
      return (
        <div className="flex-1 py-4 overflow-y-auto">
          <h2 className="text-center text-base font-bold text-white mb-1">풀이 목차</h2>
          <p className="text-center text-xs mb-3" style={{color:`${ACCENT}55`}}>아래 내용이 준비되어 있습니다</p>
          <div className="space-y-1.5 mb-4">
            {sections.map(s=>(
              <div key={s.label} className="flex items-center gap-3 p-2 rounded-xl"
                style={{backgroundColor:`${ACCENT}0a`,border:`1px solid ${ACCENT}18`}}>
                <span className="text-sm flex-shrink-0">{s.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">{s.label}</div>
                  <div className="text-[10px] text-white/40">{s.items.join(' · ')}</div>
                </div>
              </div>
            ))}
          </div>
          {scores.length > 0 && (
            <div className="rounded-2xl p-4 relative overflow-hidden"
              style={{backgroundColor:`${ACCENT}0d`, border:`1px solid ${ACCENT}25`}}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white">운세 미리보기</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{backgroundColor:ACCENT,color:BG}}>🔒 잠금</span>
              </div>
              <div className="space-y-2">
                {scores.map(({ label, score, icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm w-4">{icon}</span>
                    <span className="text-xs text-white/70 w-14 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{backgroundColor:`${ACCENT}20`}}>
                      <div className="h-full rounded-full blur-[2px]"
                        style={{width:`${score}%`, background:`linear-gradient(90deg,${ACCENT}88,${ACCENT})`}}/>
                    </div>
                    <span className="text-xs w-8 text-right blur-[4px] select-none"
                      style={{color:ACCENT}}>{score}점</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] mt-3" style={{color:`${ACCENT}55`}}>
                잠금 해제 시 상세 풀이 제공
              </p>
            </div>
          )}
        </div>
      );
    }

    // ─ Slide 12: 결제/인증 ─
    if (slide===12) {
      const ilganReviews: Record<string, string> = {
        갑:'거목 일간이라 그런지 재물 파트가 소름이었어요',
        을:'연애 섹션에서 제 연애 패턴을 딱 집었어요',
        병:'성격 분석이 저를 오래 알던 사람이 쓴 것 같았어요',
        정:'일주 DNA 파트에서 눈물 날 뻔했어요',
        무:'대운 흐름이 지나온 제 인생과 너무 맞아서 놀랐어요',
        기:'재물 섹션이 왜 돈이 안 모이는지 정확히 짚었어요',
        경:'강점·약점 분석이 이렇게 구체적일 수가 있나요',
        신:'숨겨진 재능 파트에서 제가 몰랐던 저를 발견했어요',
        임:'처음으로 사주가 설득력 있게 느껴진 경험이었어요',
        계:'직업운 섹션이 제 커리어 고민을 정확히 풀어줬어요',
      };
      const ilgan = sajuData?.ilgan ?? '';
      const review = ilganReviews[ilgan] ?? '이렇게 구체적인 풀이는 처음이었어요';
      const ilganHanja = sajuData ? (STEM_HANJA[ilgan as keyof typeof STEM_HANJA] ?? ilgan) : '';
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-4 text-center">
          {/* 소셜 프루프 */}
          <div className="w-full rounded-2xl p-4" style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}20`}}>
            <p className="text-[11px] mb-3" style={{color:`${ACCENT}77`}}>
              이번 달 <span className="font-bold" style={{color:ACCENT}}>1,247명</span>이 풀이를 받았습니다
            </p>
            <div className="text-left space-y-2">
              {[
                { text: review, tag: `${ilganHanja || '甲'} 일간` },
                { text: '재물 섹션에서 제 돈 패턴을 정확히 짚었어요', tag: '壬 일간' },
                { text: '일주 분석이 소름 돋을 만큼 맞았어요', tag: '丁 일간' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{backgroundColor:`${ACCENT}22`, color:ACCENT}}>{r.tag}</span>
                  <p className="text-[11px] text-white/70 leading-snug text-left">"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-4xl">🔮</div>
          <div>
            <h2 className="text-lg font-bold text-white">풀이를 잠금 해제하세요</h2>
            <p className="text-xs mt-2 text-white/50">연락처를 입력하시면<br/>전체 풀이를 무료로 보실 수 있습니다</p>
          </div>
          {!paying?(
            <div className="w-full max-w-xs space-y-3">
              <input
                value={phone}
                onChange={e=>setPhone(e.target.value)}
                placeholder="010-0000-0000"
                inputMode="tel"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none text-center"
                style={{backgroundColor:`${ACCENT}0f`,border:`1px solid ${ACCENT}33`}}
              />
              <button
                onClick={handlePay}
                disabled={phone.replace(/\D/g,"").length<10}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: phone.replace(/\D/g,"").length>=10?ACCENT:`${ACCENT}33`,
                  color: BG,
                }}>
                🌙 &nbsp;전체 풀이 보기
              </button>
            </div>
          ):(
            <div className="w-full max-w-xs space-y-3">
              <p className="text-xs" style={{color:ACCENT}}>풀이 준비 중... {payProgress}%</p>
              <div className="h-2 rounded-full overflow-hidden" style={{backgroundColor:`${ACCENT}20`}}>
                <div className="h-full rounded-full transition-all"
                  style={{width:`${payProgress}%`,background:`linear-gradient(90deg,${ACCENT}88,${ACCENT})`}}/>
              </div>
            </div>
          )}
        </div>
      );
    }

    // ─ AI 풀이 슬라이드 ─
    const aiKey = SLIDE_AI[slide];
    if (aiKey && aiKey!=='opener') {
      const st = aiContent[aiKey];
      const secLabel = SECTION_LABELS[slide];
      const pages    = aiPages[aiKey] || [];
      const pgIdx    = aiPage[aiKey] || 0;
      const pageText = pages[pgIdx] || st?.content || '';
      const totalPgs = pages.length;
      const badges = sajuData ? getSectionBadges(aiKey, sajuData) : [];
      return (
        <div className="flex-1 py-3 flex flex-col">
          <div className="flex items-center justify-between mb-2 pb-2" style={{borderBottom:`1px solid ${ACCENT}20`}}>
            {secLabel ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{secLabel.icon}</span>
                <h2 className="text-lg font-bold text-white">{secLabel.title}</h2>
              </div>
            ) : <div/>}
            {totalPgs > 1 && (
              <span className="text-sm tabular-nums" style={{color:`${ACCENT}66`}}>
                {pgIdx+1} / {totalPgs}
              </span>
            )}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {badges.map((badge, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{backgroundColor:`${ACCENT}18`, color:`${ACCENT}bb`, border:`1px solid ${ACCENT}30`}}>
                  {badge}
                </span>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {st?.status==='loading' && !st?.content ? <AiLoader sajuData={sajuData}/> :
             st?.status==='error'   ? <p className="text-base text-red-400 text-center py-8">오류가 발생했습니다</p> :
             (() => {
               const summaryMatch = pageText.match(/^\[요약:\s*(.+?)\]/);
               const bodyText = summaryMatch ? pageText.replace(/^\[요약:\s*.+?\]\n?/, '') : pageText;
               return (
                 <>
                   {summaryMatch && pgIdx === 0 && (
                     <div className="mb-4 px-4 py-3 rounded-2xl" style={{
                       background:`linear-gradient(135deg,${ACCENT}22,${ACCENT}0a)`,
                       border:`1px solid ${ACCENT}44`,
                     }}>
                       <p className="text-[11px] mb-1" style={{color:`${ACCENT}88`}}>💡 핵심</p>
                       <p className="text-[15px] font-semibold leading-snug" style={{color:ACCENT}}>
                         {summaryMatch[1]}
                       </p>
                     </div>
                   )}
                   {st?.status === 'loading'
                     ? <>{formatText(bodyText)}</>
                     : <TypeWriter key={`${aiKey}-${pgIdx}`} text={bodyText} />
                   }
                 </>
               );
             })()
            }
          </div>
        </div>
      );
    }

    // ─ Slide 26: 마지막 + PDF ─
    if (slide===26) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-8 py-6">
          <div>
            <div className="text-4xl mb-4">🌙</div>
            <p className="text-lg font-bold text-white">命은 흐름이지,</p>
            <p className="text-lg font-bold text-white">정해진 것이 아닙니다.</p>
            <p className="text-sm mt-3" style={{color:`${ACCENT}77`}}>— 운학선인</p>
          </div>
          <div className="w-full space-y-3 max-w-xs">
            <button
              onClick={handleDownloadPDF}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{backgroundColor:ACCENT,color:BG}}>
              📄 &nbsp;풀이 전체 PDF 다운로드
            </button>
            <button
              onClick={handleShare}
              className="w-full py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{backgroundColor:`${ACCENT}22`,color:ACCENT,border:`1px solid ${ACCENT}44`}}>
              🔗 &nbsp;친구에게 공유하기
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

  // ── 헤더 섹션 라벨 ─────────────────────────────
  const sectionLabel = currentSection();

  return (
    <div className="min-h-screen" style={{background:`linear-gradient(180deg,${BG} 0%,#0d0019 100%)`}}>
    <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col relative">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{borderBottom:`1px solid ${ACCENT}18`,background:`linear-gradient(180deg,${BG} 0%,#0d0019 100%)`}}>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={slide===0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
            style={{backgroundColor:slide>0?`${ACCENT}18`:'transparent',color:slide>0?ACCENT:`${ACCENT}33`}}>
            ←
          </button>
          <span className="text-xs" style={{color:`${ACCENT}55`}}>
            {slide<=FREE_END||slide===PAYWALL ? `${Math.min(slide+1,FREE_END+1)} / ${FREE_END+1}` :
             sectionLabel ? sectionLabel :
             `${slide - AI_START + 1} / ${TOTAL - AI_START}`}
          </span>
        </div>

        {/* TOC 버튼 */}
        <button onClick={()=>setShowToc(v=>!v)}
          className="text-xs px-3 py-1.5 rounded-xl transition-all"
          style={{backgroundColor:`${ACCENT}18`,color:ACCENT}}>
          목차 ↓
        </button>
      </div>

      {/* TOC 드롭다운 */}
      {showToc&&(
        <div className="absolute top-14 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden"
          style={{backgroundColor:'#0d0019',border:`1px solid ${ACCENT}33`,minWidth:'180px'}}>
          <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${ACCENT}18`}}>
            <span className="text-sm font-bold text-white">목차</span>
            <button onClick={()=>setShowToc(false)} style={{color:`${ACCENT}77`}}>✕</button>
          </div>
          {TOC_ITEMS.map(item=>{
            const locked = item.slide>=AI_START && !unlocked;
            const isCurrent = slide===item.slide ||
              (slide>item.slide && (()=>{
                const idx = TOC_ITEMS.findIndex(t=>t.slide===item.slide);
                const next = TOC_ITEMS[idx+1];
                return !next || slide < next.slide;
              })());
            return (
              <button key={item.label}
                onClick={()=>goSlide(item.slide)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                style={{
                  borderBottom:`1px solid ${ACCENT}0d`,
                  backgroundColor:isCurrent?`${ACCENT}15`:'transparent',
                  color: locked?`${ACCENT}44`:isCurrent?ACCENT:'white',
                }}>
                <span className="text-xs">{item.label}</span>
                {locked&&<span className="text-[10px]" style={{color:`${ACCENT}44`}}>🔒</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* 슬라이드 영역 */}
      <div ref={slideRef} className="flex-1 overflow-hidden flex flex-col" onClick={()=>showToc&&setShowToc(false)}>
        <div key={slide} className="slide-enter flex-1 flex flex-col px-4 pt-4 pb-2 overflow-y-auto">
          {renderSlide()}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      {slide!==PAYWALL&&(
        <div className="flex-shrink-0 px-4 pb-8 pt-2">
          {isLastSlide ? null : (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="w-full py-4 rounded-2xl text-sm font-bold tracking-widest transition-all active:scale-95"
              style={{
                backgroundColor: canGoNext?ACCENT:`${ACCENT}33`,
                color: BG,
              }}>
              {slide===FREE_END?(unlocked?'풀이 보기 →':'🔮 풀이 열기'):
               slide===AI_START-1?'풀이 시작 →':
               '다음 →'}
            </button>
          )}
        </div>
      )}

    </main>
    </div>
  );
}
