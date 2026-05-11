// ════════════════════════════════════════════════════════════════════
// 자평진전(子平眞詮) 격국·공망 시스템 (2026-05-10)
// — 청나라 沈孝瞻 著, 자평명리의 정통 framework
//
// 4 사이트 공통: 평생사주 / 나의 홍실 / 둘의 홍실 / 자도인 V2
// 사용:
//   1) deriveGyeokGuk(saju) → 격국 판별 + 풀이 cell
//   2) deriveGongmang(saju) → 일주 旬 → 공망 2지지 + 위치별 풀이
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

const STEM_ELEM_LOC: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};
const YANG_STEMS_LOC = new Set(["갑", "병", "무", "경", "임"]);

// ─── 월지 지장간 (자평진전 정설 — 본기·중기·여기) ─────
// key: 월지, value: { 본기, 중기?, 여기? }
const BRANCH_JIJANGGAN: Record<string, { 본기: string; 중기?: string; 여기?: string }> = {
  자: { 본기: "계" },
  축: { 본기: "기", 중기: "계", 여기: "신" },
  인: { 본기: "갑", 중기: "병", 여기: "무" },
  묘: { 본기: "을" },
  진: { 본기: "무", 중기: "을", 여기: "계" },
  사: { 본기: "병", 중기: "무", 여기: "경" },
  오: { 본기: "정", 중기: "기" },
  미: { 본기: "기", 중기: "정", 여기: "을" },
  신: { 본기: "경", 중기: "임", 여기: "무" },
  유: { 본기: "신" },
  술: { 본기: "무", 중기: "신", 여기: "정" },
  해: { 본기: "임", 중기: "갑" },
};

// 일간 → 십성 (천간 기준)
function sipseongOf(ilgan: string, otherStem: string): string {
  const ilElem = STEM_ELEM_LOC[ilgan];
  const otherElem = STEM_ELEM_LOC[otherStem];
  if (!ilElem || !otherElem) return "비견";
  const sameYinYang = YANG_STEMS_LOC.has(ilgan) === YANG_STEMS_LOC.has(otherStem);
  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  if (otherElem === ilElem) return sameYinYang ? "비견" : "겁재";
  if (generates[ilElem] === otherElem) return sameYinYang ? "식신" : "상관";
  if (controls[ilElem] === otherElem) return sameYinYang ? "편재" : "정재";
  if (controls[otherElem] === ilElem) return sameYinYang ? "편관" : "정관";
  return sameYinYang ? "편인" : "정인";
}

// ─── 8 정격 풀이 cell (자평진전 표준) ─────
const GYEOKGUK_CELL: Record<string, {
  hanja: string;
  label: string;
  meaning: string;
  stage: string;
  keywords: string[];
}> = {
  정관격: {
    hanja: "正官格",
    label: "정관격(正官格)",
    meaning: "정도(正道)의 권력·명예·체계의 별이 격을 이루는 사주",
    stage: "조직·기관·공직·체계 안에서 빛남",
    keywords: ["책임감 단단", "단정·신중", "약속과 규율", "체계 안에서 자라남", "조직형 명예"],
  },
  편관격: {
    hanja: "偏官格",
    label: "편관격(偏官格·七殺)",
    meaning: "강한 권력·결단의 별. 칠살(七殺)이라 부르며 통제력이 강함",
    stage: "군인·검사·경영·강한 결단이 필요한 자리",
    keywords: ["강한 결단력", "권위·카리스마", "위기에 빛남", "엄정함", "통솔력"],
  },
  정재격: {
    hanja: "正財格",
    label: "정재격(正財格)",
    meaning: "정도(正道)의 재물·근면의 별이 격을 이루는 사주",
    stage: "안정 직업·꾸준한 재물·실용 분야",
    keywords: ["근면 성실", "안정적 재물", "실용 감각", "절약·계획", "꾸준한 결과"],
  },
  편재격: {
    hanja: "偏財格",
    label: "편재격(偏財格)",
    meaning: "큰 재물·동적 흐름의 별. 이재 감각이 발달",
    stage: "사업·투자·세일즈·이재 활용",
    keywords: ["큰 돈 감각", "사업·이재", "활달함", "사람 끌어당김", "기회 포착"],
  },
  식신격: {
    hanja: "食神格",
    label: "식신격(食神格)",
    meaning: "자기 표현·창작의 별. 여유와 따뜻함의 결",
    stage: "예술·교육·작가·콘텐츠",
    keywords: ["여유로운 표현", "창작·예술", "따뜻한 감정", "사람을 살리는 결", "낙천적 결"],
  },
  상관격: {
    hanja: "傷官格",
    label: "상관격(傷官格)",
    meaning: "정관을 상하는 별. 천재성·자유·반항의 결",
    stage: "예술·발명·자유 직업·이단의 길",
    keywords: ["천재성", "자유로운 표현", "체계 깨기", "비범한 재능", "자기 길 만듦"],
  },
  정인격: {
    hanja: "正印格",
    label: "정인격(正印格)",
    meaning: "정통 학문의 별. 사색과 받침의 결",
    stage: "학자·교수·연구자·전통 분야",
    keywords: ["깊은 사색", "정통 학문", "전통 가치", "받쳐주는 결", "고요한 깊이"],
  },
  편인격: {
    hanja: "偏印格",
    label: "편인격(偏印格)",
    meaning: "비전통 학문·직관·영감의 별",
    stage: "예술·종교·창의·이단 학문",
    keywords: ["직관·영감", "비전통 사고", "창의·통찰", "독자 학문", "신비한 매력"],
  },
};

// ─── 외격 cell ─────
const OE_GYEOK_CELL: Record<string, {
  hanja: string;
  label: string;
  meaning: string;
  stage: string;
  keywords: string[];
}> = {
  종아격: {
    hanja: "從兒格",
    label: "종아격(從兒格)",
    meaning: "일간 너무 약해 식상으로 종속. 식상에 따르는 결",
    stage: "예술·창작·콘텐츠·표현 분야",
    keywords: ["압도적 표현력", "창작 천재", "사람 끌어당김", "여유와 창의", "외향형 결"],
  },
  종재격: {
    hanja: "從財格",
    label: "종재격(從財格)",
    meaning: "일간 약 + 재성 압도. 재성에 따르는 결",
    stage: "사업·재물·투자·실용 분야",
    keywords: ["큰 재물", "이재 천재", "현실 감각 강함", "사람·돈 결합", "활달한 결"],
  },
  종관격: {
    hanja: "從官格",
    label: "종관격(從官格)",
    meaning: "일간 약 + 관성 압도. 관성에 따르는 결",
    stage: "권력·체계·정치·군경",
    keywords: ["강한 권위", "체계 정점", "통솔·관리", "엄정한 결", "큰 무대"],
  },
  종세격: {
    hanja: "從勢格",
    label: "종세격(從勢格)",
    meaning: "일간 약 + 인성 압도. 인성에 따르는 결",
    stage: "학문·정신 세계·종교·연구",
    keywords: ["깊은 학문", "정신 세계", "직관 풍부", "사색의 대가", "고요한 깊이"],
  },
  양인격: {
    hanja: "羊刃格",
    label: "양인격(羊刃格)",
    meaning: "월지에 양인(羊刃) — 일간 강 + 결단의 결",
    stage: "강한 결단이 필요한 자리·격렬한 분야",
    keywords: ["결단력 두 겹", "위기 돌파", "강한 의지", "격렬한 추진", "흔들림 없는 결"],
  },
  건록격: {
    hanja: "建祿格",
    label: "건록격(建祿格)",
    meaning: "월지 = 일간 비견. 자수성가의 결",
    stage: "독립·자수성가·자기 길",
    keywords: ["자수성가", "독립적 결", "혼자 일으킴", "자존감 단단", "자기 페이스"],
  },
  월겁격: {
    hanja: "月劫格",
    label: "월겁격(月劫格)",
    meaning: "월지에 겁재 — 강한 자존감·경쟁 의식",
    stage: "경쟁·도전이 필요한 자리",
    keywords: ["강한 경쟁심", "자존감 강", "추진력", "자기 결 분명", "전투적 결"],
  },
};

// ─── 격국 판별 알고리즘 (자평진전 정설) ─────
// 1. 월지 본기 천간이 천간(년·월·시)에 투출되었으면 그 십성 격
// 2. 안 되면 중기 → 여기 순서로
// 3. 모두 안 되면 월령 본기 십성으로 격 (투출 X 격)
// 4. 외격 판별 (종격·양인격·건록격·월겁격) 우선
export interface GyeokgukResult {
  type: "정격" | "외격" | "투출X";
  name: string;     // "정관격" 등
  hanja: string;    // "正官格"
  label: string;    // "정관격(正官格)"
  meaning: string;
  stage: string;
  keywords: string[];
  detail: string;   // "월지 인의 본기 갑이 년간에 투출 → 갑이 일간 기에게 정관"
  rawSip: string;   // 격에 해당하는 십성
}

export function deriveGyeokGuk(saju: SajuAnalysis, shinkangLevel: string, weightedSipCounts: Record<string, number>): GyeokgukResult {
  const ilgan = saju.ilgan;
  const monthBranch = saju.pillars.month.branch;
  const ilElem = STEM_ELEM_LOC[ilgan] ?? "토";

  // 1. 외격 우선 판별
  // 1-a. 종격 (일간 신약·태약·극약 + 한 십성 압도적)
  const isWeakIlgan = ["극약", "태약", "신약"].includes(shinkangLevel);
  if (isWeakIlgan) {
    const total = (weightedSipCounts.식상 ?? 0) + (weightedSipCounts.재성 ?? 0) +
                  (weightedSipCounts.관성 ?? 0) + (weightedSipCounts.인성 ?? 0) +
                  (weightedSipCounts.비겁 ?? 0);
    const sikRatio = (weightedSipCounts.식상 ?? 0) / Math.max(total, 1);
    const jaeRatio = (weightedSipCounts.재성 ?? 0) / Math.max(total, 1);
    const gwanRatio = (weightedSipCounts.관성 ?? 0) / Math.max(total, 1);
    const inRatio = (weightedSipCounts.인성 ?? 0) / Math.max(total, 1);
    const bigRatio = (weightedSipCounts.비겁 ?? 0) / Math.max(total, 1);

    // 종격 조건: 한 십성이 50%+ + 비겁·인성 거의 없음
    if (bigRatio < 0.15 && inRatio < 0.15) {
      if (sikRatio >= 0.45) return { type: "외격", name: "종아격", ...OE_GYEOK_CELL.종아격, detail: `일간 ${ilgan}(${ilElem}) ${shinkangLevel} + 식상 압도(${(sikRatio * 100).toFixed(0)}%)`, rawSip: "식상" };
      if (jaeRatio >= 0.45) return { type: "외격", name: "종재격", ...OE_GYEOK_CELL.종재격, detail: `일간 ${ilgan}(${ilElem}) ${shinkangLevel} + 재성 압도(${(jaeRatio * 100).toFixed(0)}%)`, rawSip: "재성" };
      if (gwanRatio >= 0.45) return { type: "외격", name: "종관격", ...OE_GYEOK_CELL.종관격, detail: `일간 ${ilgan}(${ilElem}) ${shinkangLevel} + 관성 압도(${(gwanRatio * 100).toFixed(0)}%)`, rawSip: "관성" };
    }
    if (inRatio >= 0.45 && bigRatio < 0.20) {
      return { type: "외격", name: "종세격", ...OE_GYEOK_CELL.종세격, detail: `일간 ${ilgan}(${ilElem}) ${shinkangLevel} + 인성 압도(${(inRatio * 100).toFixed(0)}%)`, rawSip: "인성" };
    }
  }

  // 1-b. 양인격 (월지 양인 — 갑일간 묘월 / 병일간 오월 / 무일간 오월 / 경일간 유월 / 임일간 자월)
  const YANGIN_MAP: Record<string, string> = { 갑: "묘", 병: "오", 무: "오", 경: "유", 임: "자" };
  if (YANGIN_MAP[ilgan] === monthBranch) {
    return { type: "외격", name: "양인격", ...OE_GYEOK_CELL.양인격, detail: `일간 ${ilgan} + 월지 ${monthBranch} 양인(羊刃)`, rawSip: "비겁(양인)" };
  }

  // 1-c. 건록격 (월지 = 일간 정확한 비견)
  // 갑→인 / 을→묘 / 병→사 / 정→오 / 무→사 / 기→오 / 경→신 / 신→유 / 임→해 / 계→자
  const GEONROK_MAP: Record<string, string> = {
    갑: "인", 을: "묘", 병: "사", 정: "오", 무: "사",
    기: "오", 경: "신", 신: "유", 임: "해", 계: "자",
  };
  if (GEONROK_MAP[ilgan] === monthBranch) {
    return { type: "외격", name: "건록격", ...OE_GYEOK_CELL.건록격, detail: `일간 ${ilgan} + 월지 ${monthBranch} 비견(建祿)`, rawSip: "비겁(건록)" };
  }

  // 1-d. 월겁격 (월지 겁재 — 양일간 양지·음일간 음지의 비겁)
  const WOLGEOP_MAP: Record<string, string> = {
    갑: "묘", 을: "인", 병: "오", 정: "사", 무: "오",
    기: "사", 경: "유", 신: "신", 임: "자", 계: "해",
  };
  if (WOLGEOP_MAP[ilgan] === monthBranch) {
    return { type: "외격", name: "월겁격", ...OE_GYEOK_CELL.월겁격, detail: `일간 ${ilgan} + 월지 ${monthBranch} 겁재`, rawSip: "비겁(겁재)" };
  }

  // 2. 정격 판별 — 월지 본기·중기·여기 순서로 천간 투출 확인
  const jijang = BRANCH_JIJANGGAN[monthBranch];
  if (!jijang) {
    return { type: "투출X", name: "일반격", hanja: "—", label: "일반격", meaning: "격국 판별 어려움 — 월지 분석 부족", stage: "—", keywords: [], detail: "월지 정보 부족", rawSip: "—" };
  }

  // 사주 천간 (년·월·시 — 일간은 제외)
  const otherStems = [
    saju.pillars.year.stem,
    saju.pillars.month.stem,
    ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
  ].filter(Boolean);

  // 본기·중기·여기 순서로 투출 확인
  const candidates = [
    { tier: "본기", stem: jijang.본기 },
    ...(jijang.중기 ? [{ tier: "중기", stem: jijang.중기 }] : []),
    ...(jijang.여기 ? [{ tier: "여기", stem: jijang.여기 }] : []),
  ];

  for (const c of candidates) {
    if (otherStems.includes(c.stem)) {
      // 그 천간이 일간에게 무슨 십성인지
      const sip = sipseongOf(ilgan, c.stem);
      const cat = sipCatToGyeok(sip);
      if (cat && GYEOKGUK_CELL[cat]) {
        return {
          type: "정격",
          name: cat,
          ...GYEOKGUK_CELL[cat],
          detail: `월지 ${monthBranch}의 ${c.tier} ${c.stem}이 천간 투출 → 일간 ${ilgan}에게 ${sip} → ${cat}`,
          rawSip: sip,
        };
      }
    }
  }

  // 3. 투출 X — 월지 본기 십성으로 격 (자평진전: 본기 격으로 처리)
  const benkiSip = sipseongOf(ilgan, jijang.본기);
  const benkiCat = sipCatToGyeok(benkiSip);
  if (benkiCat && GYEOKGUK_CELL[benkiCat]) {
    return {
      type: "투출X",
      name: benkiCat,
      ...GYEOKGUK_CELL[benkiCat],
      detail: `월지 ${monthBranch} 본기 ${jijang.본기}이 천간 투출 X — 본기 십성 ${benkiSip}으로 격 추정`,
      rawSip: benkiSip,
    };
  }

  return { type: "투출X", name: "일반격", hanja: "—", label: "일반격", meaning: "격국 판별 어려움", stage: "—", keywords: [], detail: "월지 천간 투출 X + 본기 매핑 X", rawSip: "—" };
}

// 십성 → 격국 카테고리 매핑
function sipCatToGyeok(sip: string): string | null {
  if (sip === "정관") return "정관격";
  if (sip === "편관") return "편관격";
  if (sip === "정재") return "정재격";
  if (sip === "편재") return "편재격";
  if (sip === "식신") return "식신격";
  if (sip === "상관") return "상관격";
  if (sip === "정인") return "정인격";
  if (sip === "편인") return "편인격";
  return null; // 비견·겁재는 외격(건록·월겁)에서 다룸
}

// ════════════════════════════════════════════════════════════════════
// 격국 변화·진가(眞假) 판별 (자평진전 후반)
// — 격국 천간이 합·충 받으면 가격(假格), 격이 흔들림·변화
// — 합거: 격이 합으로 묶여 약화 또는 다른 격으로 변화
// — 충거: 격이 충으로 깨짐
// ════════════════════════════════════════════════════════════════════
const STEM_CHUNG_JP: Record<string, string> = {
  갑: "경", 경: "갑", 을: "신", 신: "을",
  병: "임", 임: "병", 정: "계", 계: "정",
};
const STEM_HAP_JP: Record<string, { partner: string; element: string }> = {
  갑: { partner: "기", element: "토" },
  기: { partner: "갑", element: "토" },
  을: { partner: "경", element: "금" },
  경: { partner: "을", element: "금" },
  병: { partner: "신", element: "수" },
  신: { partner: "병", element: "수" },
  정: { partner: "임", element: "목" },
  임: { partner: "정", element: "목" },
  무: { partner: "계", element: "화" },
  계: { partner: "무", element: "화" },
};

export interface GyeokChangeResult {
  isChanged: boolean;          // 격이 합·충으로 변했는지
  changeType: "진격" | "합거" | "충거" | "변격" | "외격";
  detail: string;
  recommendation: string;      // 격 보호·보완 방법
}

// 격국 천간(투출 천간)이 다른 천간과 합·충 있는지 확인
export function deriveGyeokChange(saju: SajuAnalysis, gyeokGuk: GyeokgukResult): GyeokChangeResult {
  if (gyeokGuk.type === "외격") {
    return {
      isChanged: false,
      changeType: "외격",
      detail: `${gyeokGuk.label}은 외격이라 정격 변화 룰 미적용 — 외격 자체로 풀이`,
      recommendation: "외격은 격 자체가 안정 — 강한 십성 따르는 결",
    };
  }

  // detail에서 투출 천간 추출 (없으면 본기 추정)
  const detailMatch = gyeokGuk.detail.match(/([갑을병정무기경신임계])이?(?:\s*천간\s*투출|\s*투출)?/);
  const transparentStem = detailMatch ? detailMatch[1] : null;

  if (!transparentStem) {
    return {
      isChanged: false,
      changeType: "진격",
      detail: `${gyeokGuk.label} — 투출 천간 X (월령 본기 격) → 변화 없음`,
      recommendation: "월령 본기 격 — 안정적",
    };
  }

  // 사주 천간 (일간 제외)
  const otherStems = [
    saju.pillars.year.stem,
    saju.pillars.month.stem,
    ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
  ].filter(Boolean);

  // 1. 격국 천간 충 받았는지
  const chungPartner = STEM_CHUNG_JP[transparentStem];
  if (chungPartner && otherStems.includes(chungPartner)) {
    return {
      isChanged: true,
      changeType: "충거",
      detail: `${gyeokGuk.label} — 격국 천간 ${transparentStem}이 ${chungPartner}과 천간 충 → 충거(沖去)·격 깨짐 — 가격(假格)`,
      recommendation: "격이 충으로 흔들림 — 통관(通關) 또는 합으로 보호. 일관성 유지가 핵심",
    };
  }

  // 2. 격국 천간 합 받았는지
  const hap = STEM_HAP_JP[transparentStem];
  if (hap && otherStems.includes(hap.partner)) {
    // 합화 오행이 격을 그대로 유지하는지 / 다른 격으로 변하는지
    const ilElem = STEM_ELEM_LOC[saju.ilgan] ?? "토";
    const hapElem = hap.element;
    // 합화 오행이 일간에게 다른 십성이면 → 변격
    if (hapElem !== STEM_ELEM_LOC[transparentStem]) {
      return {
        isChanged: true,
        changeType: "변격",
        detail: `${gyeokGuk.label} — 격국 천간 ${transparentStem}이 ${hap.partner}과 합 → ${hapElem} 합화 → 격 변화 가능 (변격)`,
        recommendation: "격이 합화로 변하는 결 — 변격 후 새 격의 무대 함께 인용",
      };
    }
    return {
      isChanged: true,
      changeType: "합거",
      detail: `${gyeokGuk.label} — 격국 천간 ${transparentStem}이 ${hap.partner}과 합 → 합거(合去)·격 약화 — 가격(假格)`,
      recommendation: "격이 합으로 묶임 — 격 본래 무대보다 합 상대 영향 큼",
    };
  }

  return {
    isChanged: false,
    changeType: "진격",
    detail: `${gyeokGuk.label} — 격국 천간 ${transparentStem}이 충·합 받지 않음 → 진격(眞格)·단단한 격`,
    recommendation: "진격 — 격 본래 무대 그대로 빛남. 흔들림 없는 결",
  };
}

// ════════════════════════════════════════════════════════════════════
// 공망(空亡) — 일주 旬 → 빠진 2지지
// ════════════════════════════════════════════════════════════════════

// 60갑자 → 旬 (10갑자 단위) → 공망 2지지
const GAPJA_LIST = [
  "갑자","을축","병인","정묘","무진","기사","경오","신미","임신","계유",  // 갑자旬: 공망 술해
  "갑술","을해","병자","정축","무인","기묘","경진","신사","임오","계미",  // 갑술旬: 공망 신유
  "갑신","을유","병술","정해","무자","기축","경인","신묘","임진","계사",  // 갑신旬: 공망 오미
  "갑오","을미","병신","정유","무술","기해","경자","신축","임인","계묘",  // 갑오旬: 공망 진사
  "갑진","을사","병오","정미","무신","기유","경술","신해","임자","계축",  // 갑진旬: 공망 인묘
  "갑인","을묘","병진","정사","무오","기미","경신","신유","임술","계해",  // 갑인旬: 공망 자축
];
const GONGMANG_BY_SUN: string[][] = [
  ["술", "해"],
  ["신", "유"],
  ["오", "미"],
  ["진", "사"],
  ["인", "묘"],
  ["자", "축"],
];

export interface GongmangResult {
  branches: string[];        // ["술", "해"]
  detail: string;            // "갑자旬 — 공망 술해"
  positions: { pillar: "year" | "month" | "day" | "hour"; branch: string; effect: string }[];
  hasGongmang: boolean;      // 사주 안에 공망 있음 여부
}

const GONGMANG_POSITION_EFFECT: Record<string, string> = {
  year: "年支(부모·조상자리) 공망 — 부모·조상 인연 옅음·고향 떠나 자기 길·외향 적응 어려움",
  month: "月支(형제·직업자리) 공망 — 형제 인연 옅음·직업 변동 잦음·환경 변화 많음",
  day: "日支(배우자자리) 공망 — 배우자 인연 옅음·결혼 늦음 또는 정신적 사랑 추구·재혼 가능성",
  hour: "時支(자녀자리) 공망 — 자녀 인연 옅음·말년 자기 길·정신 세계 깊어짐",
};

export function deriveGongmang(saju: SajuAnalysis): GongmangResult {
  const ilju = `${saju.ilgan}${saju.pillars.day.branch}`;
  const idx = GAPJA_LIST.indexOf(ilju);
  if (idx < 0) {
    return { branches: [], detail: "공망 판별 불가", positions: [], hasGongmang: false };
  }
  const sunIdx = Math.floor(idx / 10);
  const branches = GONGMANG_BY_SUN[sunIdx];
  const sunNames = ["갑자旬", "갑술旬", "갑신旬", "갑오旬", "갑진旬", "갑인旬"];
  const detail = `${sunNames[sunIdx]} (일주 ${ilju}) — 공망 ${branches.join("·")}`;

  // 사주 각 위치에서 공망 들었는지
  const positions: { pillar: "year" | "month" | "day" | "hour"; branch: string; effect: string }[] = [];
  const checkPos = (pillar: "year" | "month" | "day" | "hour", branch: string | undefined) => {
    if (!branch) return;
    if (branches.includes(branch)) {
      positions.push({ pillar, branch, effect: GONGMANG_POSITION_EFFECT[pillar] });
    }
  };
  checkPos("year", saju.pillars.year.branch);
  checkPos("month", saju.pillars.month.branch);
  // day 자리는 일주이므로 공망 자기 자신 — 포함 X (일주 자체는 공망 들 수 없음)
  checkPos("hour", saju.pillars.hour?.branch);

  return {
    branches,
    detail,
    positions,
    hasGongmang: positions.length > 0,
  };
}
