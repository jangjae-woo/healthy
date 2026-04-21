"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PaymentModal from "@/components/PaymentModal";
import {
  type SajuAnalysis,
  getSipseong,
  STEM_HANJA, BRANCH_HANJA, SIPSEONG_COLOR, SINSAL_INFO,
} from "@/lib/saju-calculator";

const ACCENT = "#c9960c";
const BG     = "#0d1a0f";

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
  12:{ title:'핵심 요약 아이템', icon:'✦' },
  13:{ title:'당신은 누구',      icon:'✦' },
  15:{ title:'관계·재물·직업·학문', icon:'✦' },
  17:{ title:'인연의 자리',      icon:'✦' },
  20:{ title:'몸과 마음',        icon:'✦' },
  21:{ title:'특수 기운',        icon:'✦' },
  22:{ title:'시기별 흐름',      icon:'✦' },
  24:{ title:'종합 해석',        icon:'✦' },
  25:{ title:'종합 해석',        icon:'✦' },
};

// 슬라이드 → AI 섹션 키 매핑
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

// 섹션별 기본 이미지 (페이지 0 배너)
const SECTION_IMAGE: Record<string, string> = {
  money1:'재물_돈',    money2:'사업_기회',
  love1:'사랑_인연',  love2:'새_인연',     love3:'귀인_도움',
  health:'건강_몸',   hidden:'묵도인_악운경고',
  timeline1:'대운_전환', timeline2:'전환점_변화',
  compass:'때를_기다려라', closing:'묵도인_마무리',
};

// 키워드 → 이미지 (페이지 1+ 트리거)
const KEYWORD_IMAGE: Array<{ m: string[]; img: string }> = [
  { m:['도화살'],                            img:'도화살' },
  { m:['역마살'],                            img:'역마살' },
  { m:['천을귀인'],                          img:'천을귀인' },
  { m:['겁살'],                              img:'겁살' },
  { m:['신장','방광','허리 통증'],            img:'신장_방광_허리' },
  { m:['심장','혈압'],                       img:'심장_혈압' },
  { m:['기관지','호흡기','폐 기능'],          img:'폐_피부_기관지' },
  { m:['위장','소화불량','소화기'],           img:'위장_소화' },
  { m:['수술','입원'],                        img:'수술_조심' },
  { m:['음주','과음'],                        img:'음주_조심' },
  { m:['교통사고','낙상','추락'],             img:'낙상_추락_조심' },
  { m:['횡재','큰 재물'],                    img:'큰돈_들어옴' },
  { m:['재물이 빠져','돈이 빠져나가'],        img:'돈이_새는_시기' },
  { m:['투자 조심','투자에 신중'],            img:'투자_조심' },
  { m:['이별','헤어짐'],                     img:'이별_헤어짐' },
  { m:['새로운 인연','인연이 옵니다'],        img:'새_인연' },
  { m:['배신','소인배'],                     img:'소인배_배신_조심' },
  { m:['구설수','험담'],                     img:'구설수_조심' },
  { m:['이직','전직'],                       img:'이직_전환' },
  { m:['창업','사업 기회'],                  img:'사업_기회' },
  { m:['승진','성취'],                       img:'승진_성취' },
  { m:['직장 갈등','직장 내'],               img:'직장_갈등' },
  { m:['전환점','대운이 바뀌'],              img:'전환점_변화' },
  { m:['봄이 올','좋은 시기가'],             img:'봄이_온다' },
  { m:['인내하','기다려야'],                 img:'겨울_인내' },
  { m:['때를 기다'],                         img:'때를_기다려라' },
  { m:['갈등','충돌'],                       img:'갈등_다툼' },
  { m:['외로움','고독'],                     img:'외로움_고독' },
  { m:['귀인이 나타','귀인을 만나'],         img:'귀인_등장' },
  { m:['법적','소송'],                       img:'법적_분쟁_조심' },
  { m:['도난','사기를'],                     img:'도난_사기_조심' },
  { m:['화재','감전'],                       img:'화재_전기_조심' },
  { m:['조심하시','주의하시'],               img:'조심_경계' },
  { m:['재물운','재성'],                     img:'재물_돈' },
  { m:['사랑','연애'],                       img:'사랑_인연' },
  { m:['건강'],                              img:'건강_몸' },
];

// TOC 섹션 목록
const TOC_ITEMS = [
  { label:'사주팔자 뽑기',     slide:2  },
  { label:'다섯 기운 균형',     slide:4  },
  { label:'핵심 요약 아이템',    slide:12 },
  { label:'당신은 누구',       slide:13 },
  { label:'관계·재물·직업·학문', slide:15 },
  { label:'인연의 자리',       slide:17 },
  { label:'몸과 마음',         slide:20 },
  { label:'특수 기운',         slide:21 },
  { label:'시기별 흐름',       slide:22 },
  { label:'종합 해석',         slide:24 },
];

// 슬라이드 상수
const FREE_END  = 11;  // GUIDE가 마지막 무료 슬라이드
const AI_START  = 12;  // 핵심 요약부터 유료
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
    ? "saju-prose font-bold mt-4 mb-8 text-[22px] leading-snug text-center w-full"
    : "saju-prose font-bold mt-6 mb-8 text-[20px] leading-snug text-center w-full";
  if (sub) {
    return (
      <div key={key} className={`${cls} flex flex-col items-center gap-1`} style={{color:ACCENT}}>
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
        <p key={i} className="saju-prose saju-body text-[17px] leading-[2.1] mb-4">
          {line.split(/(\*\*[^*]+\*\*)/).map((p2,j) =>
            /^\*\*[^*]+\*\*$/.test(p2)
              ? <strong key={j} style={{color:ACCENT}}>{p2.replace(/\*\*/g,"")}</strong>
              : p2
          )}
        </p>
      );
    // 숫자 목록 (1. 2. 3. 형태)
    if (/^\d+\.\s/.test(line))
      return <li key={i} className="saju-prose saju-body text-[17px] leading-[2.1] ml-5 mb-3 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
    // 불릿
    if (line.startsWith("- ")||line.startsWith("• "))
      return <li key={i} className="saju-prose saju-body text-[17px] leading-[2.1] ml-5 mb-3 list-disc">{line.slice(2)}</li>;
    // 빈 줄
    if (line.trim()==="") return <div key={i} className="h-3"/>;
    // 일반 텍스트
    return <p key={i} className="saju-prose saju-body text-[17px] leading-[2.1] mb-4">{line}</p>;
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

// 슬라이드/페이지 이미지 결정
function getPageImage(aiKey:string, pgIdx:number, text:string, data:SajuAnalysis|null):string|null {
  if (pgIdx===0) {
    if (aiKey==='personality1'||aiKey==='personality2') {
      if (data) { const {score}=calcEnergyScore(data.elements); return score>=310?'신강_사주':'신약_사주'; }
      return null;
    }
    return SECTION_IMAGE[aiKey]??null;
  }
  for (const {m,img} of KEYWORD_IMAGE) {
    if (m.some(kw=>text.includes(kw))) return img;
  }
  return null;
}

type SectionState = { status:"idle"|"loading"|"done"|"error"; content:string };

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SajuSlideResult() {
  const params       = useSearchParams();
  const [slide, setSlide]         = useState(0);
  const [sajuData, setSajuData]   = useState<SajuAnalysis|null>(null);
  const [aiContent, setAiContent] = useState<Record<string,SectionState>>(() => {
    const keys = ['opener','overview','personality1','personality2','money1','money2','love1','love2','love3','health','hidden','timeline1','timeline2','compass','closing'];
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
  const [hintDismissed, setHintDismissed] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const tapStartRef = useRef<{x:number; y:number} | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const savedRef = useRef(false);
  const aiContentRef = useRef<Record<string,SectionState>>({});

  const name         = params.get("name")         || "";
  const gender       = params.get("gender")       || "";
  const year         = params.get("year")         || "";
  const month        = params.get("month")        || "";
  const day          = params.get("day")          || "";
  const hour         = params.get("hour")         || "";
  const calendarType = params.get("calendarType") || "양력";
  const isSavedUrl   = params.get("saved") === "1";

  const baseBody = { type:"saju", name, gender, year, month, day, hour, calendarType };
  const cacheKey = name ? `saju_v1_${name}_${year}_${month}_${day}_${hour}_${gender}_${calendarType}` : '';

  // PayApp 결제 완료 감지
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const justPaid = urlParams.get('justpaid') === '1';
    if (urlParams.get('unlocked') === '1') {
      setUnlocked(true);
      urlParams.delete('unlocked');
      urlParams.delete('justpaid');
      const newSearch = urlParams.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
    }
    if (justPaid) {
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
          pages[k] = splitIntoPages(v.content);
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
    const SECS = ['opener','overview','personality1','personality2','money1','money2','love1','love2','love3','health','hidden','timeline1','timeline2','compass','closing'];
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
      body: JSON.stringify({ ...baseBody, section:key, ...extra }),
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
          setAiPages(prev => ({ ...prev, [key]: splitIntoPages(content) }));
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

  // 초기 로드: opener만
  useEffect(()=>{
    fetchSection('opener');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 잠금 해제 시 순차 fetch — 앞 섹션부터 하나씩
  useEffect(()=>{
    if (!unlocked) return;
    const keys = ['overview','personality1','personality2','money1','money2','love1','love2','love3','health','hidden','timeline1','timeline2','compass','closing'];
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
  const curPages   = (curAiKey && curAiKey !== 'opener' && curAiKey !== 'overview') ? (aiPages[curAiKey] || []) : [];
  const curPgIdx   = curAiKey ? (aiPage[curAiKey] || 0) : 0;
  const hasMorePages = curPages.length > 1 && curPgIdx < curPages.length - 1;

  // 섹션별 합산 페이지
  const p1Pages  = aiPages['personality1'] || [];
  const p2Pages  = aiPages['personality2'] || [];
  const m1Pages  = aiPages['money1']       || [];
  const m2Pages  = aiPages['money2']       || [];
  const l1Pages  = aiPages['love1']        || [];
  const l2Pages  = aiPages['love2']        || [];
  const l3Pages  = aiPages['love3']        || [];
  const t1Pages  = aiPages['timeline1']    || [];
  const t2Pages  = aiPages['timeline2']    || [];

  // 헤더 페이지 표시 문자열
  const headerPageText = (() => {
    // 나라는 사람 (personality1+2)
    if (slide === 13 && p1Pages.length > 0) {
      const total = p1Pages.length + p2Pages.length || p1Pages.length;
      return `${curPgIdx + 1} / ${total}`;
    }
    if (slide === 14 && p2Pages.length > 0) {
      return `${p1Pages.length + curPgIdx + 1} / ${p1Pages.length + p2Pages.length}`;
    }
    // 돈과 일 (money1+2)
    if (slide === 15 && m1Pages.length > 0) {
      const total = m1Pages.length + m2Pages.length || m1Pages.length;
      return `${curPgIdx + 1} / ${total}`;
    }
    if (slide === 16 && m2Pages.length > 0) {
      return `${m1Pages.length + curPgIdx + 1} / ${m1Pages.length + m2Pages.length}`;
    }
    // 사람과 사랑 (love1+2+3)
    if (slide === 17 && l1Pages.length > 0) {
      const total = l1Pages.length + l2Pages.length + l3Pages.length || l1Pages.length;
      return `${curPgIdx + 1} / ${total}`;
    }
    if (slide === 18 && l2Pages.length > 0) {
      return `${l1Pages.length + curPgIdx + 1} / ${l1Pages.length + l2Pages.length + l3Pages.length}`;
    }
    if (slide === 19 && l3Pages.length > 0) {
      return `${l1Pages.length + l2Pages.length + curPgIdx + 1} / ${l1Pages.length + l2Pages.length + l3Pages.length}`;
    }
    // 흐르는 시간 (timeline1+2)
    if (slide === 22 && t1Pages.length > 0) {
      const total = t1Pages.length + t2Pages.length || t1Pages.length;
      return `${curPgIdx + 1} / ${total}`;
    }
    if (slide === 23 && t2Pages.length > 0) {
      return `${t1Pages.length + curPgIdx + 1} / ${t1Pages.length + t2Pages.length}`;
    }
    if (curPages.length > 1) return `${curPgIdx + 1} / ${curPages.length}`;
    if (curPages.length === 1) return `1 / 1`;
    return null;
  })();

  async function handlePayment(payerName: string, payerPhone: string) {
    if (paying) return;
    setPaying(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('unlocked', '1');
      const returnUrl = `${window.location.origin}/api/payment/complete?${urlParams.toString()}`;
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: PRICE,
          returnUrl,
          recvphone: payerPhone,
          name: payerName,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || '결제 요청에 실패했습니다.');
        setPaying(false);
        throw new Error(data.error || '결제 요청 실패');
      }
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
    if (slide===FREE_END) {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const alreadyPaid = unlocked || params.get('unlocked') === '1';
      if (alreadyPaid) { setUnlocked(true); setSlide(AI_START); return; }
      setShowPayModal(true);
      return;
    }
    if (slide===2)        { setSlide(4); return; }    // 일간 소개(3) 건너뜀
    if (slide===4)        { setSlide(6); return; }    // 에너지 총량(5) 건너뜀
    if (slide===7)        { setSlide(11); return; }   // 운명의 별자리(8)·대운(9)·세운(10) 건너뜀
    if (slide===12 && ovPage===0) { setOvPage(1); return; }  // 핵심요약 페이지 2
    if (slide===12 && ovPage===1) { setOvPage(0); }          // 다음 슬라이드 전에 리셋
    if (slide===22)       { setSlide(24); return; }   // 세운 timeline2(23) 건너뜀 (API는 호출됨)
    if (slide===25)       { setSlide(27); return; }   // Q&A 슬라이드 숨김
    if (slide<TOTAL-1)    setSlide(s=>s+1);
  }
  function goPrev() {
    // AI 슬라이드에서 이전 페이지가 있으면 페이지 이동
    if (curAiKey && curAiKey !== 'opener' && curPgIdx > 0) {
      setAiPage(prev => ({ ...prev, [curAiKey]: curPgIdx - 1 }));
      return;
    }
    if (slide===4)   { setSlide(2); return; }    // 일간 소개(3) 건너뜀
    if (slide===6)   { setSlide(4); return; }    // 에너지 총량(5) 건너뜀
    if (slide===11)  { setSlide(7); return; }    // 운명의 별자리(8)·대운(9)·세운(10) 건너뜀
    if (slide===12 && ovPage===1) { setOvPage(0); return; }  // 핵심요약 페이지 1로
    if (slide===24)  {                           // 세운(23) 건너뜀 — timeline1 마지막 페이지로 복귀
      const tlPages = aiPages['timeline1'] || [];
      if (tlPages.length > 0) setAiPage(prev => ({ ...prev, timeline1: tlPages.length - 1 }));
      setSlide(22);
      return;
    }
    if (slide===27)  { setSlide(25); return; }   // Q&A 슬라이드 숨김
    if (slide>0) setSlide(s=>s-1);
  }
  function goSlide(n:number) {
    setSlide(n); setShowToc(false);
    // 목차로 이동 시 해당 섹션 첫 페이지로
    const key = SLIDE_AI[n];
    if (key) setAiPage(prev => ({ ...prev, [key]: 0 }));
  }

  const canGoNext  = hasMorePages || slide<TOTAL-1;
  const isLastSlide = slide===TOTAL-1 && !hasMorePages;

  // 현재 섹션 이름
  function currentSection() {
    if (slide<=FREE_END) return null;
    if (slide>=2 && slide<=10) return '사주팔자';
    if (slide===GUIDE) return '풀이 안내';
    const sorted = Object.keys(SECTION_LABELS).map(Number).sort((a,b)=>a-b);
    let label = null;
    for (const s of sorted) {
      if (slide>=s) label = SECTION_LABELS[s].title;
    }
    return label;
  }

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
                        if (v.status === 'done' && v.content && k !== 'opener') pages[k] = splitIntoPages(v.content);
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
    if (slide===0) return (
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
    if (slide===1) {
      const st = aiContent['opener']?.status;
      return (
        <div className="flex-1 flex flex-col text-center">
          <ImageBanner name="묵도인_등장" />
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
    }

    // ─ Slide 2: 사주원국 ─
    if (slide===2) {
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
    }

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
    if (slide===4) {
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

    // ─ Slide 6: 사주팔자 ─
    if (slide===6) {
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
    }

    // ─ Slide 7: 십성 배치도 (레이더) ─
    if (slide===7) {
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
    }

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


    // ─ Slide 11: 핵심 요약 (overview) ─
    if (slide===12) {
      const st = aiContent['overview'];
      const content = st?.content || '';

      const fortuneItems = [
        { key:'💰', label:'재물·직업운', color:'#fbbf24' },
        { key:'🌿', label:'건강운',       color:'#4ade80' },
        { key:'🤝', label:'연애·관계운',  color:'#f472b6' },
      ];
      const allFortuneKeys = fortuneItems.map(i=>i.key);

      const sajuItems = [
        { key:'🐯', label:'수호 동물' },
        { key:'🌸', label:'궁합 식물' },
        { key:'🎨', label:'행운 색깔' },
        { key:'🔢', label:'행운 숫자' },
        { key:'🐾', label:'궁합 동물' },
        { key:'💎', label:'궁합 보석' },
      ];
      const allSajuKeys = sajuItems.map(i=>i.key);
      const allItemKeys = [...allFortuneKeys, ...allSajuKeys];

      function parseItemText(emoji: string): string {
        const escaped = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const others = allItemKeys.filter(k=>k!==emoji).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
        const regex = new RegExp(`${escaped}[^\\n]*\\n?([\\s\\S]*?)(?=---|${others.join('|')}|$)`);
        const match = content.match(regex);
        return match ? match[1].trim() : '';
      }

      function parseSajuItemValue(emoji: string): { name: string; reason: string } {
        const line = content.split('\n').find(l => l.includes(emoji));
        if (!line) return { name:'', reason:'' };
        const dashIdx = line.indexOf('—');
        if (dashIdx === -1) {
          const colonIdx = line.indexOf(':');
          return { name: colonIdx>=0 ? line.slice(colonIdx+1).trim() : '', reason:'' };
        }
        const afterEmoji = line.slice(line.indexOf(emoji)+2);
        const colonIdx = afterEmoji.indexOf(':');
        const rawName = colonIdx>=0 ? afterEmoji.slice(colonIdx+1, afterEmoji.indexOf('—')).trim() : '';
        const name = rawName.replace(/\*\*/g, '');
        const reason = afterEmoji.slice(afterEmoji.indexOf('—')+1).trim().replace(/\*\*/g, '');
        return { name, reason };
      }

      const loading = st?.status==='loading' && !content;
      return (
        <div className="flex-1 flex flex-col py-3">
          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? <AiLoader sajuData={sajuData}/> :
             st?.status==='error' ? <p className="text-base text-red-400 text-center py-8">오류가 발생했습니다</p> :
             ovPage === 0 ? (
               /* 페이지 1: 운세 3카드 */
               <div className="space-y-3">
                 <p className="text-center text-xs mb-1" style={{color:`${ACCENT}99`}}>운세 요약 · 1/2</p>
                 {fortuneItems.map(({ key, label, color }) => {
                   const text = parseItemText(key);
                   return (
                     <div key={label} className="rounded-2xl p-4" style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}22`}}>
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-sm font-bold" style={{color}}>{label}</span>
                       </div>
                       {text
                         ? <p className="saju-body text-[15px] leading-relaxed">{text}</p>
                         : <div className="flex gap-1 items-center h-5">{[0,1,2].map(i=>(
                             <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                               style={{backgroundColor:ACCENT,animationDelay:`${i*150}ms`}}/>
                           ))}</div>
                       }
                     </div>
                   );
                 })}
               </div>
             ) : (
               /* 페이지 2: 나만의 사주 아이템 */
               <div>
                 <p className="text-center text-xs mb-3" style={{color:`${ACCENT}99`}}>나만의 사주 아이템 · 2/2</p>
                 <div className="grid grid-cols-2 gap-2">
                   {sajuItems.map(({ key, label }) => {
                     const { name, reason } = parseSajuItemValue(key);
                     return (
                       <div key={label} className="rounded-xl p-3" style={{backgroundColor:`${ACCENT}0d`,border:`1px solid ${ACCENT}22`}}>
                         <div className="flex items-center gap-1.5 mb-1">
                           <span className="text-[11px] text-white/50">{label}</span>
                         </div>
                         {name
                           ? <>
                               <p className="text-[15px] font-bold text-white">{name}</p>
                               {reason && <p className="text-[11px] text-white/55 mt-0.5 leading-snug">{reason}</p>}
                             </>
                           : <div className="flex gap-1 items-center h-4">{[0,1,2].map(i=>(
                               <div key={i} className="w-1 h-1 rounded-full animate-bounce"
                                 style={{backgroundColor:ACCENT,animationDelay:`${i*150}ms`}}/>
                             ))}</div>
                         }
                       </div>
                     );
                   })}
                 </div>
               </div>
             )
            }
          </div>
        </div>
      );
    }

    // ─ Slide 4: 목차 안내 ─
    if (slide===GUIDE) {
      const features = [
        '핵심 요약 아이템 — 수호동물·보석·색깔 등 6가지',
        '당신은 누구 — 일간의 본질과 기질',
        '관계·재물·직업·학문 — 십성의 배치',
        '인연의 자리 — 사랑·가족·배우자 궁',
        '몸과 마음 — 건강과 정신의 흐름',
        '특수 기운 — 운명의 별자리 19가지',
        '시기별 흐름 — 대운·세운·삼재',
        '종합 해석 — 통변(通變)과 나아갈 방향',
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
        <div className="flex-1 py-5 flex flex-col">
          {pgIdx===0 && (() => { const img = getPageImage(aiKey, pgIdx, pageText, sajuData); return img ? <ImageBanner name={img} /> : null; })()}
          <div className="flex-1 overflow-y-auto">
            {st?.status==='loading' && !st?.content ? <AiLoader sajuData={sajuData}/> :
             st?.status==='error'   ? <p className="text-base text-red-400 text-center py-8">오류가 발생했습니다</p> :
             (() => {
               // [요약: ...] 형식이면 대괄호 제거
               let cleanText = pageText;
               const summaryMatch = pageText.match(/^\s*\[요약:\s*([\s\S]*?)\]\s*$/);
               if (summaryMatch) cleanText = summaryMatch[1].trim();
               const isIntro = pgIdx === 0 && totalPgs > 1;
               if (isIntro) {
                 return (
                   <div className="px-4 py-4 rounded-2xl" style={{
                     background:`linear-gradient(135deg,${ACCENT}22,${ACCENT}0a)`,
                     border:`1px solid ${ACCENT}44`,
                   }}>
                     <p className="text-[11px] mb-2" style={{color:`${ACCENT}88`}}>핵심 요약</p>
                     <TypeWriter key={`${aiKey}-intro`} text={cleanText} />
                   </div>
                 );
               }
               return st?.status === 'loading'
                 ? <>{formatText(cleanText)}</>
                 : <TypeWriter key={`${aiKey}-${pgIdx}`} text={cleanText} />;
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

  // ── 헤더 섹션 라벨 ─────────────────────────────
  const sectionLabel = currentSection();

  return (
    <div className="min-h-screen" style={{background:`linear-gradient(180deg,${BG} 0%,#060d07 100%)`}}>
    <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col relative">

      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{borderBottom:`1px solid ${ACCENT}18`,background:`linear-gradient(180deg,${BG} 0%,#060d07 100%)`}}>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} disabled={slide===0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
            style={{backgroundColor:slide>0?`${ACCENT}18`:'transparent',color:slide>0?ACCENT:`${ACCENT}33`}}>
            ←
          </button>
          <span className="text-lg font-bold text-white">
            {slide<=FREE_END ? `${slide + 1 - [3,5,8,9,10].filter(s=>s<slide).length} / 7` :
             sectionLabel ? sectionLabel :
             `${slide - AI_START + 1} / ${TOTAL - AI_START}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {headerPageText && slide > FREE_END && (
            <span className="text-xs tabular-nums" style={{color:`${ACCENT}77`}}>
              {headerPageText}
            </span>
          )}
          {/* TOC 버튼 */}
          <button onClick={()=>setShowToc(v=>!v)}
            className="text-xs px-3 py-1.5 rounded-xl transition-all"
            style={{backgroundColor:`${ACCENT}18`,color:ACCENT}}>
            목차 ↓
          </button>
        </div>
      </div>

      {/* TOC 드롭다운 */}
      {showToc&&(
        <div className="absolute top-14 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden"
          style={{backgroundColor:'#060d07',border:`1px solid ${ACCENT}33`,minWidth:'180px'}}>
          <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:`1px solid ${ACCENT}18`}}>
            <span className="text-sm font-bold text-white">목차</span>
            <button onClick={()=>setShowToc(false)} style={{color:`${ACCENT}77`}}>✕</button>
          </div>
          {TOC_ITEMS.map(item=>{
            const locked = false;
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
      <div
        ref={slideRef}
        className="flex-1 overflow-hidden flex flex-col relative"
        onTouchStart={e => {
          tapStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={e => {
          if (!tapStartRef.current) return;
          const dx = Math.abs(e.changedTouches[0].clientX - tapStartRef.current.x);
          const dy = Math.abs(e.changedTouches[0].clientY - tapStartRef.current.y);
          if (dx < 12 && dy < 12) {
            const target = e.target as HTMLElement;
            if (target.closest('button,a,input,textarea,select,[role="button"]')) return;
            setHintDismissed(true);
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.changedTouches[0].clientX - rect.left;
            if (x > rect.width / 2) goNext(); else goPrev();
          }
          tapStartRef.current = null;
        }}
        onClick={e => {
          if (showToc) { setShowToc(false); return; }
          if ('ontouchstart' in window) return; // 터치 기기는 onTouchEnd 처리
          const target = e.target as HTMLElement;
          if (target.closest('button,a,input,textarea,select,[role="button"]')) return;
          setHintDismissed(true);
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX - rect.left > rect.width / 2) goNext(); else goPrev();
        }}
      >
        <div key={slide} className="saju-prose slide-enter flex-1 flex flex-col px-4 pt-4 pb-2 overflow-y-auto">
          {renderSlide()}
        </div>

        {/* 좌우 탭존 화살표 — 포인터 이벤트 없이 시각 안내만 */}
        {(
          <>
            {slide > 0 && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
                style={{backgroundColor:`${ACCENT}12`}}>
                <span className="text-xl font-light select-none" style={{color:`${ACCENT}55`}}>‹</span>
              </div>
            )}
            {canGoNext && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
                style={{backgroundColor:`${ACCENT}12`}}>
                <span className="text-xl font-light select-none" style={{color:`${ACCENT}55`}}>›</span>
              </div>
            )}
            {slide===FREE_END && canGoNext && !hintDismissed && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-2 px-2 py-3 rounded-2xl"
                style={{animation:'fadeIn 1s ease 0.5s both', backgroundColor:`${ACCENT}18`, border:`1px solid ${ACCENT}33`}}>
                <span className="text-2xl select-none" style={{color:ACCENT}}>›</span>
                <span className="text-[12px] font-medium select-none" style={{color:`${ACCENT}dd`}}>탭하여</span>
                <span className="text-[12px] font-medium select-none" style={{color:`${ACCENT}dd`}}>다음으로</span>
              </div>
            )}
          </>
        )}
      </div>


    </main>
    <PaymentModal
      open={showPayModal}
      onClose={() => setShowPayModal(false)}
      price={PRICE}
      goodsName="평생 사주 풀이"
      onSubmit={async ({ name, phone }) => {
        await handlePayment(name, phone);
      }}
    />
    </div>
  );
}
