// ════════════════════════════════════════════════════════════════
// 전통 자평명리 계산 라이브러리
// 격국(格局) · 공망(空亡) · 기신(忌神) · 십이운성(十二運星) 등
// Phase 2 신규
// ════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

// ─── 천간 / 지지 / 오행 매핑 ───────────────────────
const STEMS = ["갑","을","병","정","무","기","경","신","임","계"] as const;
const BRANCHES = ["자","축","인","묘","진","사","오","미","신","유","술","해"] as const;

const STEM_TO_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const STEM_POLARITY: Record<string, "양" | "음"> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양",
  기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};

// 지지 정기(主氣) — 지지 본기 천간
const BRANCH_MAIN_STEM: Record<string, string> = {
  자: "계", 축: "기", 인: "갑", 묘: "을", 진: "무", 사: "병",
  오: "정", 미: "기", 신: "경", 유: "신", 술: "무", 해: "임",
};

// ─── 십성(十星) 산출 — 일간 vs 다른 천간 ───────────────────────
// 십성 관계: 비겁(같은 오행) / 식상(일간이 생함) / 재성(일간이 극함) / 관성(일간을 극함) / 인성(일간을 생함)
// 음양 같으면 偏(편), 다르면 正(정)
const ELEM_GENERATE: Record<string, string> = { // 생: A → B
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};
const ELEM_OVERCOME: Record<string, string> = { // 극: A → B
  목: "토", 토: "수", 수: "화", 화: "금", 금: "목",
};

export function getSipseong(ilgan: string, otherStem: string): string {
  if (!ilgan || !otherStem) return "";
  const ilElem = STEM_TO_ELEM[ilgan];
  const otElem = STEM_TO_ELEM[otherStem];
  if (!ilElem || !otElem) return "";
  const samePol = STEM_POLARITY[ilgan] === STEM_POLARITY[otherStem];
  if (ilElem === otElem) return samePol ? "비견" : "겁재";
  if (ELEM_GENERATE[ilElem] === otElem) return samePol ? "식신" : "상관";
  if (ELEM_OVERCOME[ilElem] === otElem) return samePol ? "편재" : "정재";
  if (ELEM_OVERCOME[otElem] === ilElem) return samePol ? "편관" : "정관";
  if (ELEM_GENERATE[otElem] === ilElem) return samePol ? "편인" : "정인";
  return "";
}

// ════════════════════════════════════════════════════════════════
// 격국(格局) — 자녀 인생 큰 그림
// 정통: 월지(月支) 정기(主氣)의 십성으로 격국을 정함
// 비겁이면 "건록격(建祿格)" 또는 "양인격(羊刃格)"
// ════════════════════════════════════════════════════════════════

export interface GyeokgukResult {
  name: string;        // 정관격 / 편관격 / 정인격 등
  hanja: string;       // 正官格
  sipseong: string;    // 정관 / 편관 / ...
  meaning: string;     // 결의 본질 한 줄
  oneLiner: string;    // 자녀 인생 큰 그림 한 줄
  career: string[];    // 적합 분야 후보
  parentingTips: string[]; // 격국별 부모 양육 팁 3개 (Phase 2 후속)
}

const GYEOKGUK_INFO: Record<string, { hanja: string; meaning: string; oneLiner: string; career: string[]; parentingTips: string[] }> = {
  "비견격": { hanja: "比肩格", meaning: "자기를 세우는 결",
    oneLiner: "자기 색이 또렷하고 독립적인 결을 타고난 자녀입니다. 스스로 결정하고 자기 길을 가는 인생입니다.",
    career: ["창업·1인 사업", "프리랜서·전문직", "운동·체육", "스스로 이끄는 직업"],
    parentingTips: ["자녀의 *결정권*을 존중하세요 — 큰 방향만 짚고 세부는 자녀에게", "*비교 양육 금지* — 다른 아이와 비교하면 자기 색을 잃습니다", "혼자 시간을 충분히 — 자기 결을 다듬는 자리가 필요해요"] },
  "건록격": { hanja: "建祿格", meaning: "스스로 자리를 세우는 결",
    oneLiner: "타고난 힘이 단단하고 자립심이 강한 자녀입니다. 자기 자리를 스스로 만들어가는 인생입니다.",
    career: ["창업·자영업", "전문직(의사·변호사)", "관리직·임원", "운동선수·체육"],
    parentingTips: ["자녀의 *자립*을 응원하세요 — 도와주려 하기보다 *지켜봐 주는* 결", "지나친 통제 X — 자녀가 자기 박자로 자라도록", "*책임 있는 선택*을 함께 연습 — 결정 후 결과까지 자녀가 안기"] },
  "양인격": { hanja: "羊刃格", meaning: "강한 추진력의 결",
    oneLiner: "강한 에너지와 결단력을 타고난 자녀입니다. 큰 일을 추진하거나 위기를 돌파하는 인생입니다.",
    career: ["군·경찰·소방", "운동선수", "외과의사", "기업가·CEO"],
    parentingTips: ["*신체 활동·운동*으로 에너지 흘려보낼 통로 만들기 — 막으면 분노로", "감정 폭발 시 *즉각 결정 보류* — 시간 두고 다시 대화", "*도전 과제*를 자주 — 작은 목표 달성 경험이 결을 다듬어요"] },
  "식신격": { hanja: "食神格", meaning: "표현·창의의 결",
    oneLiner: "따뜻하게 표현하고 즐기며 만드는 결을 타고난 자녀입니다. 창의·예술·요식·교육 영역에서 빛나는 인생입니다.",
    career: ["요식·요리·F&B", "교육·아동 관련", "예술·디자인", "방송·연예·콘텐츠"],
    parentingTips: ["자녀의 *즐거움·놀이*를 막지 마세요 — 표현이 자녀의 빛", "*요리·만들기·예술* 활동을 함께 — 손으로 만드는 경험이 결을 키워요", "*친구·사람*과 어울리는 시간을 충분히 — 표현이 발산되는 자리"] },
  "상관격": { hanja: "傷官格", meaning: "발산·표현의 결",
    oneLiner: "기존 틀을 넘어 자기 색으로 표현하는 자녀입니다. 창의적이고 독창적인 영역에서 빛나는 인생입니다.",
    career: ["예술·디자인·영상", "작가·기자·평론", "공연·연예", "IT·기획·마케팅"],
    parentingTips: ["자녀의 *기존 틀에 대한 거부*를 인정하세요 — '왜 그렇게 해야 해?'는 자녀의 본질", "*자유로운 창작 환경* 중요 — 정답 없는 활동(미술·음악·글) 함께", "*비판보다 인정* — 자녀의 독특함을 다른 아이와 비교 X"] },
  "정재격": { hanja: "正財格", meaning: "성실·실용의 결",
    oneLiner: "꾸준히 모으고 안정되게 가꾸는 결을 타고난 자녀입니다. 신뢰와 책임으로 자리잡는 인생입니다.",
    career: ["재무·회계", "은행·금융", "사무·관리", "유통·서비스업"],
    parentingTips: ["*꾸준한 일과·약속*이 자녀를 안정시켜요 — 갑작스런 변화 X", "*용돈·저축·계획* 같은 실용 경험을 일찍 — 자녀가 좋아함", "*결과 칭찬*보다 *과정 칭찬* — 꾸준함을 인정"] },
  "편재격": { hanja: "偏財格", meaning: "활발한 실리의 결",
    oneLiner: "큰 흐름과 기회를 잡는 감각을 타고난 자녀입니다. 사업·영업·투자 영역에서 빛나는 인생입니다.",
    career: ["사업·영업", "무역·해외", "부동산·투자", "기획·중개"],
    parentingTips: ["*다양한 경험*을 충분히 — 좁은 환경에 가두면 결이 시들어요", "*새로운 사람·환경*과 자주 만남 — 외부 자극이 자녀를 키움", "*자녀의 흥미 분산*을 너무 걱정 마세요 — 큰 그림 그리는 결"] },
  "정관격": { hanja: "正官格", meaning: "절제·규율의 결",
    oneLiner: "원칙과 책임을 지키는 단정한 결을 타고난 자녀입니다. 공직·교육·조직에서 신뢰받는 인생입니다.",
    career: ["공무원·공직", "교사·교육", "법조·행정", "대기업 정직"],
    parentingTips: ["*규칙·약속*을 함께 정하고 지키세요 — 자녀가 안정감을 얻음", "*강제보다 모범* — 부모가 먼저 보여주는 결이 자녀를 키움", "*완벽주의 부담* 살피기 — 자녀가 자기를 너무 다그칠 수 있음"] },
  "편관격": { hanja: "偏官格", meaning: "강한 의지·규율의 결",
    oneLiner: "강한 의지로 책임을 짊어지는 결을 타고난 자녀입니다. 위험·도전 영역에서 빛나는 인생입니다.",
    career: ["군·경찰·검찰", "외과·응급의학", "스포츠 감독", "기업 임원"],
    parentingTips: ["*도전·운동·경쟁* 환경에서 빛나요 — 자녀의 강한 결을 발산할 통로", "*과한 압박 X* — 이미 자기를 다그치는 자녀, 부모까지 압박하면 무너짐", "*큰 책임을 일찍 맡기기* — 자녀가 자기 결을 펼치는 경험"] },
  "정인격": { hanja: "正印格", meaning: "사색·학문의 결",
    oneLiner: "받아들이고 깊이 사색하는 결을 타고난 자녀입니다. 학문·교육·연구 영역에서 빛나는 인생입니다.",
    career: ["교육·교수·연구", "학자·작가", "의료·상담", "공직 학예직"],
    parentingTips: ["*독서·사색* 시간을 충분히 — 혼자 깊이 들어가는 자리가 자녀를 키움", "*조용한 학습 환경*이 핵심 — 산만한 곳에서는 자기 결을 못 펼침", "*결과보다 깊이* — 빠른 답보다 *깊은 이해*를 인정"] },
  "편인격": { hanja: "偏印格", meaning: "독특한 사색의 결",
    oneLiner: "남다른 시각과 깊은 사유를 타고난 자녀입니다. 전문·예술·종교·기술 영역에서 빛나는 인생입니다.",
    career: ["전문직(약사·치과의 등)", "예술·디자인", "기술·연구", "종교·철학·심리"],
    parentingTips: ["자녀의 *남다른 시각*을 인정하세요 — '왜 그렇게 봐?' 보다 '아 그렇게 보는구나'", "*깊이 파고드는 분야 1~2개*를 함께 찾아주기 — 다재다능보다 한 우물", "*고독을 즐기는 결* — 친구가 적어도 걱정 X, 자녀의 본질"] },
};

// 지지 지장간(支藏干) — 본기·중기·여기 (단순화 버전: 본기 + 중요 부기)
const BRANCH_HIDDEN_STEMS: Record<string, string[]> = {
  자: ["계"],
  축: ["기", "계", "신"],   // 본기 기, 여기 계, 중기 신
  인: ["갑", "병", "무"],   // 본기 갑, 여기 무, 중기 병
  묘: ["을"],
  진: ["무", "을", "계"],   // 본기 무, 여기 을, 중기 계
  사: ["병", "무", "경"],   // 본기 병, 여기 무, 중기 경
  오: ["정", "기"],          // 본기 정, 중기 기
  미: ["기", "정", "을"],   // 본기 기, 여기 정, 중기 을
  신: ["경", "임", "무"],   // 본기 경, 여기 무, 중기 임
  유: ["신"],
  술: ["무", "신", "정"],   // 본기 무, 여기 신, 중기 정
  해: ["임", "갑"],          // 본기 임, 중기 갑
};

export function calcGyeokguk(saju: SajuAnalysis): GyeokgukResult | null {
  if (!saju?.pillars?.month?.branch || !saju.ilgan) return null;
  const monthBranch = saju.pillars.month.branch;

  // 1차: 월지 본기(主氣) 기준
  const mainStem = BRANCH_MAIN_STEM[monthBranch];
  if (!mainStem) return null;
  let sipseong = getSipseong(saju.ilgan, mainStem);
  let viaTugan = false;  // 투간(透干) 보정 여부

  // 2차: 투간 보정 — 월지 지장간이 천간(년주·월주·시주 천간)에 투출(透出)되어 있으면 그 격이 더 정확
  // 투간된 십성 중 가장 중요한 것 (정관·정인·정재·식신·편관·상관·편재·편인 우선) 격으로 채택
  const hiddenStems = BRANCH_HIDDEN_STEMS[monthBranch] ?? [mainStem];
  const otherStems = [
    saju.pillars.year?.stem,
    saju.pillars.month?.stem,
    saju.pillars.hour?.stem,
  ].filter(Boolean) as string[];

  // 정격 우선 순위 (정관 > 정인 > 정재 > 식신 > 편관 > 상관 > 편재 > 편인)
  const PREFERRED = ["정관","정인","정재","식신","편관","상관","편재","편인"];
  let bestTuganSipseong: string | null = null;
  let bestPriority = 999;
  for (const hs of hiddenStems) {
    if (!otherStems.includes(hs)) continue; // 투간 안됨
    const ts = getSipseong(saju.ilgan, hs);
    if (!ts) continue;
    if (ts === "비견" || ts === "겁재") continue; // 비겁은 일반 격으로 안 잡음 (건록·양인 별도)
    const pri = PREFERRED.indexOf(ts);
    if (pri >= 0 && pri < bestPriority) {
      bestPriority = pri;
      bestTuganSipseong = ts;
    }
  }
  if (bestTuganSipseong) {
    sipseong = bestTuganSipseong;
    viaTugan = true;
  }

  if (!sipseong) return null;

  // 비견·겁재 → 월지가 일간과 같은 오행이면 건록격(같은 음양) 또는 양인격(다른 음양)
  let name: string;
  if (sipseong === "비견") name = "건록격";
  else if (sipseong === "겁재") name = "양인격";
  else name = `${sipseong}격`;

  const info = GYEOKGUK_INFO[name];
  if (!info) return null;
  return {
    name,
    hanja: info.hanja,
    sipseong,
    meaning: viaTugan
      ? `${info.meaning} (자녀에게 이 결이 특히 또렷하게 자리합니다)`
      : info.meaning,
    oneLiner: info.oneLiner,
    career: info.career,
    parentingTips: info.parentingTips,
  };
}

// ════════════════════════════════════════════════════════════════
// 공망(空亡) — 비어 있는 자리
// 일주 60갑자가 속한 순(旬)에 따라 공망 지지 2개 결정
// ════════════════════════════════════════════════════════════════

// 갑자순부터 6개 순, 각 순마다 공망 지지 2개
const SUN_GONGMANG: Array<{ start: string; gongmang: [string, string] }> = [
  { start: "갑자", gongmang: ["술", "해"] }, // 甲子旬: 戌亥 공망
  { start: "갑술", gongmang: ["신", "유"] }, // 甲戌旬: 申酉 공망
  { start: "갑신", gongmang: ["오", "미"] }, // 甲申旬: 午未 공망
  { start: "갑오", gongmang: ["진", "사"] }, // 甲午旬: 辰巳 공망
  { start: "갑진", gongmang: ["인", "묘"] }, // 甲辰旬: 寅卯 공망
  { start: "갑인", gongmang: ["자", "축"] }, // 甲寅旬: 子丑 공망
];

// 60갑자 순서 생성
function gabjaIndex(stem: string, branch: string): number {
  const si = STEMS.indexOf(stem as typeof STEMS[number]);
  const bi = BRANCHES.indexOf(branch as typeof BRANCHES[number]);
  if (si < 0 || bi < 0) return -1;
  // 60갑자: 양간(0,2,4,6,8) + 양지(0,2,4,6,8,10), 음간 + 음지
  for (let i = 0; i < 60; i++) {
    if (i % 10 === si && i % 12 === bi) return i;
  }
  return -1;
}

export interface GongmangResult {
  branches: [string, string];     // 공망 지지 2개 (한글)
  hanja: [string, string];        // 한자
  positions: string[];            // 자녀 사주에 공망 위치 (예: "년주", "시주")
  meaning: string;                 // 한 줄 의미
  oneLiner: string;                // 자녀에게 적용된 풀이
}

const BRANCH_HANJA_MAP: Record<string, string> = {
  자:"子", 축:"丑", 인:"寅", 묘:"卯", 진:"辰", 사:"巳",
  오:"午", 미:"未", 신:"申", 유:"酉", 술:"戌", 해:"亥",
};

const GONGMANG_POSITION_MEANING: Record<string, string> = {
  년주: "조부모·조상·고향과의 인연이 옅은 결",
  월주: "부모·형제·청소년기 환경과의 거리가 있는 결",
  일지: "배우자 자리·평생 동반자 관계의 비어 있음",
  시주: "자녀·말년·후세와의 인연이 가벼운 결",
};

export function calcGongmang(saju: SajuAnalysis): GongmangResult | null {
  if (!saju?.pillars?.day) return null;
  const dayStem = saju.pillars.day.stem;
  const dayBranch = saju.pillars.day.branch;
  const gabjaIdx = gabjaIndex(dayStem, dayBranch);
  if (gabjaIdx < 0) return null;
  const sunIdx = Math.floor(gabjaIdx / 10);
  const sun = SUN_GONGMANG[sunIdx];
  if (!sun) return null;

  // 자녀 사주 4지지 중 공망 위치 찾기
  const pillars = [
    { name: "년주", branch: saju.pillars.year?.branch },
    { name: "월주", branch: saju.pillars.month?.branch },
    { name: "일지", branch: saju.pillars.day?.branch },
    { name: "시주", branch: saju.pillars.hour?.branch },
  ];
  const positions: string[] = [];
  pillars.forEach(p => {
    if (p.branch && (p.branch === sun.gongmang[0] || p.branch === sun.gongmang[1])) {
      positions.push(p.name);
    }
  });

  let oneLiner: string;
  if (positions.length === 0) {
    oneLiner = `자녀의 사주에 공망이 직접 자리하지는 않지만, ${sun.gongmang[0]}(${BRANCH_HANJA_MAP[sun.gongmang[0]]})·${sun.gongmang[1]}(${BRANCH_HANJA_MAP[sun.gongmang[1]]})의 결은 자녀 인생에서 *비어 있는 자리*로 살짝 흐릿하게 느껴질 수 있습니다.`;
  } else {
    const meanings = positions.map(p => GONGMANG_POSITION_MEANING[p]).filter(Boolean);
    oneLiner = `자녀 사주에서 ${positions.join("·")}에 공망이 자리합니다 — ${meanings.join("·")}.`;
  }

  return {
    branches: sun.gongmang,
    hanja: [BRANCH_HANJA_MAP[sun.gongmang[0]], BRANCH_HANJA_MAP[sun.gongmang[1]]],
    positions,
    meaning: "공망(空亡)은 사주에서 *비어 있는 자리* — 채워도 채워지지 않는 결의 빈 공간",
    oneLiner,
  };
}

// ════════════════════════════════════════════════════════════════
// 기신(忌神) — 자녀가 피해야 하는 결
// 정통: 용신(用神)을 극(剋)하는 오행
// ════════════════════════════════════════════════════════════════

export interface GisinResult {
  element: string;              // 기신 오행 (목·화·토·금·수)
  hanja: string;                // 木 · 火 등
  yongsin: string;              // 용신 (참고)
  meaning: string;              // 한 줄 의미
  caution: string;              // 주의해야 할 결
  avoid: string[];              // 피하는 게 좋은 환경·습관
}

const ELEM_HANJA: Record<string, string> = { 목:"木", 화:"火", 토:"土", 금:"金", 수:"水" };

const GISIN_INFO: Record<string, { caution: string; avoid: string[] }> = {
  목: { caution: "충동적 도전·과한 호기심에 휘말려 자기 결을 잃을 수 있음",
        avoid: ["새로운 자극을 한꺼번에 늘리는 것", "결정 없이 시작만 반복", "산만한 환경"] },
  화: { caution: "감정 폭발·과한 표현으로 인간관계를 흔들 수 있음",
        avoid: ["자극적 콘텐츠 과다 노출", "분노 폭발 시 즉각 결정", "지나친 흥분 환경"] },
  토: { caution: "지나친 안주·고집·변화 거부로 성장이 멈출 수 있음",
        avoid: ["같은 자리에 계속 머무는 것", "변화 거부", "한 가지 의견에 고집"] },
  금: { caution: "지나친 단호함·비판·차가움으로 관계가 굳어질 수 있음",
        avoid: ["원칙 강제 적용", "감정 차단·냉정만 유지", "관계 단절"] },
  수: { caution: "과한 사색·우유부단·결정 회피로 행동이 늦어질 수 있음",
        avoid: ["혼자만의 시간 과다", "결정 미루기", "감정 침잠"] },
};

const ELEM_OVERCOMING_REVERSE: Record<string, string> = { // A를 극하는 오행 (X → A)
  목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
};

export function calcGisin(saju: SajuAnalysis): GisinResult | null {
  if (!saju?.yongsin) return null;
  // 용신은 "목"·"화"·"토"·"금"·"수" 한 글자 또는 2개일 수 있음 — 첫 글자만 사용
  const ys = saju.yongsin.trim();
  let yongsinElem = "";
  for (const e of ["목","화","토","금","수"]) {
    if (ys.includes(e)) { yongsinElem = e; break; }
  }
  if (!yongsinElem) return null;

  const gisinElem = ELEM_OVERCOMING_REVERSE[yongsinElem];
  if (!gisinElem) return null;

  const info = GISIN_INFO[gisinElem];
  if (!info) return null;

  return {
    element: gisinElem,
    hanja: ELEM_HANJA[gisinElem],
    yongsin: yongsinElem,
    meaning: `자녀의 용신(用神)이 ${yongsinElem}(${ELEM_HANJA[yongsinElem]})이므로, ${yongsinElem}을 극(剋)하는 ${gisinElem}(${ELEM_HANJA[gisinElem]})이 자녀의 기신(忌神)입니다.`,
    caution: info.caution,
    avoid: info.avoid,
  };
}

// ════════════════════════════════════════════════════════════════
// 개운법(改運法) — 행운 색·방위·음식·숫자·시간
// 정통: 용신 오행에 맞는 비보(裨補)
// ════════════════════════════════════════════════════════════════

export interface GaeunResult {
  yongsinElement: string;     // 용신 오행
  colors: string[];           // 행운 색
  direction: string;          // 행운 방위
  foods: string[];            // 행운 음식
  numbers: number[];          // 행운 숫자
  timeRange: string;          // 행운 시간대
  environment: string[];      // 행운 환경
  oneLiner: string;           // 한 줄 안내
}

const GAEUN_INFO: Record<string, Omit<GaeunResult, "yongsinElement" | "oneLiner">> = {
  목: {
    colors: ["청록", "초록", "남색"],
    direction: "동(東)쪽",
    foods: ["채소", "과일", "신선한 잎채류", "신맛 음식"],
    numbers: [3, 8],
    timeRange: "새벽~아침 (3시~7시)",
    environment: ["식물 가까이", "공원·숲", "푸른빛 인테리어", "햇살 드는 창가"],
  },
  화: {
    colors: ["빨강", "주황", "분홍"],
    direction: "남(南)쪽",
    foods: ["붉은 과일·채소", "토마토·딸기", "쓴맛 음식", "구이류"],
    numbers: [2, 7],
    timeRange: "정오 전후 (11시~13시)",
    environment: ["햇볕 드는 곳", "따뜻한 색 인테리어", "사람들과 함께", "활동·놀이 공간"],
  },
  토: {
    colors: ["황색", "베이지", "갈색"],
    direction: "중앙·남서·북동",
    foods: ["곡물·뿌리채소", "단맛 음식", "콩류", "꿀"],
    numbers: [5, 10],
    timeRange: "오후 (13시~17시 사이 한 자리)",
    environment: ["흙 만지기", "텃밭·정원", "황색·갈색 인테리어", "꾸준한 일과 자리"],
  },
  금: {
    colors: ["흰색", "은색", "회색"],
    direction: "서(西)쪽",
    foods: ["흰 음식 (쌀·두부)", "매운맛", "견과류", "맑은 국물"],
    numbers: [4, 9],
    timeRange: "저녁 (17시~21시)",
    environment: ["정돈된 공간", "맑은 공기·환기", "흰빛 인테리어", "조용한 서재"],
  },
  수: {
    colors: ["검정", "짙은 남색", "보라"],
    direction: "북(北)쪽",
    foods: ["검은 음식 (검은콩·김)", "짠맛", "해산물·생선", "차·물"],
    numbers: [1, 6],
    timeRange: "밤 (21시~새벽 1시)",
    environment: ["깊은 잠 자리", "물 가까이", "어둑한 사색 공간", "도서관·조용한 카페"],
  },
};

export function calcGaeun(saju: SajuAnalysis): GaeunResult | null {
  if (!saju?.yongsin) return null;
  const ys = saju.yongsin.trim();
  let yongsinElem = "";
  for (const e of ["목","화","토","금","수"]) {
    if (ys.includes(e)) { yongsinElem = e; break; }
  }
  if (!yongsinElem) return null;
  const info = GAEUN_INFO[yongsinElem];
  if (!info) return null;
  return {
    yongsinElement: yongsinElem,
    ...info,
    oneLiner: `자녀의 용신이 ${yongsinElem}(${ELEM_HANJA[yongsinElem]})이므로, ${yongsinElem}의 결을 곁에 두면 자녀의 빛이 자랍니다.`,
  };
}

// ════════════════════════════════════════════════════════════════
// 자녀 시간 가이드 — 일주 + 일지 기반 좋은 시간·환경
// 정통: 일지(日支)의 시지(時支) 호응, 십이운성 양력 등
// 단순화: 일지·일간 오행에서 가장 활기 있는 시간대 추정
// ════════════════════════════════════════════════════════════════

export interface ChildTimingResult {
  ilganElement: string;
  ilji: string;
  bestHours: string;          // 가장 활기 있는 시간대
  worstHours: string;         // 컨디션 가벼워지는 시간대
  sleepBest: string;          // 잠자기 좋은 시간
  studyBest: string;          // 집중 학습 시간
  outdoorBest: string;        // 야외 활동 시간
  oneLiner: string;
}

// 오행별 활기 시간대
const ELEM_TIMING: Record<string, { peak: string; low: string }> = {
  목: { peak: "아침 (5~9시) — 새싹의 결이 살아나는 시간", low: "늦은 밤 (21시 이후)" },
  화: { peak: "정오 전후 (11~15시) — 햇살의 결이 가장 강한 시간", low: "한밤중 (23시 이후)" },
  토: { peak: "오후 (13~17시) — 땅이 가장 따뜻한 시간", low: "새벽 (3~5시)" },
  금: { peak: "저녁 (17~21시) — 맑은 공기의 결이 깊어지는 시간", low: "정오 (11~13시)" },
  수: { peak: "밤 (21시~새벽 1시) — 사색의 결이 깊어지는 시간", low: "정오 (11~13시)" },
};

export function calcChildTiming(saju: SajuAnalysis): ChildTimingResult | null {
  if (!saju?.ilgan) return null;
  const ilElem = STEM_TO_ELEM[saju.ilgan];
  const ilji = saju.pillars.day.branch;
  const t = ELEM_TIMING[ilElem];
  if (!t) return null;
  return {
    ilganElement: ilElem,
    ilji,
    bestHours: t.peak,
    worstHours: t.low,
    sleepBest: ilElem === "수" ? "밤 9시~10시 사이 잠들기 (수의 결이 깊어지는 시간)" :
                ilElem === "화" ? "밤 10~11시 잠들기 (낮 활기 후 충분한 수면 필요)" :
                ilElem === "목" ? "밤 10~11시 잠들기 (아침 일찍 일어나기 좋은 결)" :
                ilElem === "토" ? "밤 10~11시 일정한 시간 (꾸준한 잠자리 의식이 핵심)" :
                "밤 10~11시 (정돈된 환경에서)",
    studyBest: ilElem === "수" ? "저녁~밤 (사색의 결이 살아나는 시간)" :
                ilElem === "금" ? "저녁 (정돈된 환경에서)" :
                ilElem === "목" || ilElem === "화" ? "오전 (활기 있는 시간)" :
                "오후 (안정된 시간)",
    outdoorBest: ilElem === "화" || ilElem === "목" ? "오전~정오 (햇살을 충분히)" :
                  ilElem === "수" ? "저녁 산책 또는 물 가까이" :
                  "오후 산책 (햇살이 부드러운 시간)",
    oneLiner: `자녀의 일간이 ${saju.ilgan}(${ilElem})·일지가 ${ilji}이므로, ${ilElem}의 결이 살아나는 시간에 자녀의 빛이 자랍니다.`,
  };
}

// ════════════════════════════════════════════════════════════════
// 가족 명리 — 부모-자녀 관계 풀이 (Phase 4 신규)
// ════════════════════════════════════════════════════════════════

// ─── 일지(日支) 관계: 합·충·형·해·파 ───────────────────────
// 정통 명리에서 일지는 *배우자궁(配偶宮)*. 부모-자녀에서는 *일상의 결이 만나는 자리*
const BRANCH_HAP_6: Record<string, string> = { // 육합
  자: "축", 축: "자", 인: "해", 해: "인", 묘: "술", 술: "묘",
  진: "유", 유: "진", 사: "신", 신: "사", 오: "미", 미: "오",
};
const BRANCH_CHUNG_6: Record<string, string> = { // 육충
  자: "오", 오: "자", 축: "미", 미: "축", 인: "신", 신: "인",
  묘: "유", 유: "묘", 진: "술", 술: "진", 사: "해", 해: "사",
};
const BRANCH_HYEONG: Record<string, string[]> = { // 형 (단순화: 양인형·자형 위주)
  인: ["사", "신"], 사: ["인", "신"], 신: ["인", "사"],
  축: ["술", "미"], 술: ["축", "미"], 미: ["축", "술"],
  자: ["묘"], 묘: ["자"],
  진: ["진"], 오: ["오"], 유: ["유"], 해: ["해"],
};
const BRANCH_HAE: Record<string, string> = { // 해 (穿)
  자: "미", 미: "자", 축: "오", 오: "축", 인: "사", 사: "인",
  묘: "진", 진: "묘", 신: "해", 해: "신", 유: "술", 술: "유",
};
const BRANCH_PA: Record<string, string> = { // 파
  자: "유", 유: "자", 축: "진", 진: "축", 인: "해", 해: "인",
  묘: "오", 오: "묘", 사: "신", 신: "사", 미: "술", 술: "미",
};

export type IljiRelationKind = "육합" | "육충" | "형" | "해" | "파" | "비화" | "기타";
export interface IljiRelationResult {
  kind: IljiRelationKind;
  hanja: string;
  parentBranch: string;
  childBranch: string;
  meaning: string;     // 한 줄 의미
  oneLiner: string;    // 부모-자녀 관계 풀이
}

const ILJI_REL_INFO: Record<IljiRelationKind, { hanja: string; meaning: string }> = {
  "육합": { hanja: "六合", meaning: "두 일지가 자연스럽게 결합하는 결 — 일상에서 호흡이 잘 맞는 자리" },
  "육충": { hanja: "六沖", meaning: "두 일지가 정면으로 부딪히는 결 — 흔들림이 있되 *깨어남과 변화*의 자극" },
  "형": { hanja: "刑", meaning: "두 일지가 다듬어지는 결 — 단련과 깊어짐의 자리" },
  "해": { hanja: "害", meaning: "두 일지가 살짝 어긋나는 결 — 미묘한 거리·서운함의 자리" },
  "파": { hanja: "破", meaning: "두 일지가 깨지는 결 — 흩어졌다 다시 모이는 자리" },
  "비화": { hanja: "比和", meaning: "두 일지가 같거나 닮은 결 — 깊이 닮은 동반자의 자리" },
  "기타": { hanja: "—", meaning: "두 일지가 무특수 관계 — 평이하되 안정된 자리" },
};

export function calcIljiRelation(parentBranch: string, childBranch: string, parentLabel: "엄마" | "아빠"): IljiRelationResult | null {
  if (!parentBranch || !childBranch) return null;
  let kind: IljiRelationKind = "기타";
  if (parentBranch === childBranch) kind = "비화";
  else if (BRANCH_HAP_6[parentBranch] === childBranch) kind = "육합";
  else if (BRANCH_CHUNG_6[parentBranch] === childBranch) kind = "육충";
  else if (BRANCH_HYEONG[parentBranch]?.includes(childBranch)) kind = "형";
  else if (BRANCH_HAE[parentBranch] === childBranch) kind = "해";
  else if (BRANCH_PA[parentBranch] === childBranch) kind = "파";

  const info = ILJI_REL_INFO[kind];
  let oneLiner: string;
  if (kind === "육합") oneLiner = `${parentLabel}와 자녀의 일상 결이 자연스럽게 결합합니다 — 일상의 호흡이 잘 맞는 자리.`;
  else if (kind === "육충") oneLiner = `${parentLabel}와 자녀의 일상 결이 부딪히는 자리 — 흔들림이 있되 자녀를 *깨우고 자라게* 하는 자극.`;
  else if (kind === "형") oneLiner = `${parentLabel}와 자녀가 서로 *다듬어지는* 자리 — 단련을 통해 깊어지는 관계.`;
  else if (kind === "해") oneLiner = `${parentLabel}와 자녀가 살짝 어긋나는 자리 — 미묘한 거리·서운함이 있을 수 있되, 알아주면 풀리는 결.`;
  else if (kind === "파") oneLiner = `${parentLabel}와 자녀가 깨졌다 다시 모이는 자리 — 갈등 후 더 깊어지는 결.`;
  else if (kind === "비화") oneLiner = `${parentLabel}와 자녀의 일상 결이 깊이 닮은 자리 — 서로를 가장 잘 아는 동반자.`;
  else oneLiner = `${parentLabel}와 자녀의 일상 결은 무특수 관계 — 평이하되 안정된 자리.`;

  return {
    kind,
    hanja: info.hanja,
    parentBranch,
    childBranch,
    meaning: info.meaning,
    oneLiner,
  };
}

// ─── 부모↔자녀 십성 관계: 자녀 일간 기준 부모 일간이 어느 십성 ───────────────────────
export interface ParentSipseongResult {
  parentLabel: "엄마" | "아빠";
  sipseong: string;        // 자녀 일간 → 부모 일간의 십성
  hanja: string;
  category: string;        // 비겁 / 식상 / 재성 / 관성 / 인성
  meaning: string;
  oneLiner: string;
}

const SIPSEONG_TO_CATEGORY: Record<string, string> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성",
  편인: "인성", 정인: "인성",
};
const SIPSEONG_HANJA: Record<string, string> = {
  비견: "比肩", 겁재: "劫財",
  식신: "食神", 상관: "傷官",
  편재: "偏財", 정재: "正財",
  편관: "偏官", 정관: "正官",
  편인: "偏印", 정인: "正印",
};

const PARENT_SIPSEONG_MEANING: Record<string, { meaning: string; oneLiner: (label: string) => string }> = {
  비겁: {
    meaning: "자녀에게 *함께 가는 동지·경쟁자*의 결",
    oneLiner: (l) => `자녀에게 ${l}는 *함께 가는 동지·경쟁자*의 결입니다. 비슷한 결을 가진 친구처럼 가까우면서도 자기 색을 지키려는 긴장이 함께 흐를 수 있어요.`,
  },
  식상: {
    meaning: "자녀에게 *표현·창의를 끌어내주는* 결",
    oneLiner: (l) => `자녀에게 ${l}는 *자기 표현과 창의를 자연스럽게 끌어내주는* 결입니다. 자녀가 ${l} 곁에서 자기 결을 맘껏 펼치는 자리.`,
  },
  재성: {
    meaning: "자녀에게 *현실 감각·실용을 가르쳐주는* 결",
    oneLiner: (l) => `자녀에게 ${l}는 *현실 감각과 실용을 자연스럽게 전해주는* 결입니다. 자녀가 ${l}로부터 *세상을 다루는 힘*을 배워가는 자리.`,
  },
  관성: {
    meaning: "자녀에게 *규율·책임의 모범*이 되는 결",
    oneLiner: (l) => `자녀에게 ${l}는 *규율과 책임의 모범*이 되는 결입니다. ${l}의 단정함이 자녀를 *바로 세워주는* 자리이지만, 과하면 자녀가 부담을 느낄 수 있어요.`,
  },
  인성: {
    meaning: "자녀에게 *받아주고 가르치는 어른*의 결",
    oneLiner: (l) => `자녀에게 ${l}는 *받아주고 길러주는 어른*의 결입니다. 자녀가 ${l} 품에서 *마음의 양식을 자연스럽게 받아가는* 자리 — 가장 모성적/가르침의 결.`,
  },
};

export function calcParentSipseong(parentIlgan: string, childIlgan: string, parentLabel: "엄마" | "아빠"): ParentSipseongResult | null {
  if (!parentIlgan || !childIlgan) return null;
  // 자녀 일간 기준 → 부모 일간이 무슨 십성?
  const sipseong = getSipseong(childIlgan, parentIlgan);
  if (!sipseong) return null;
  const category = SIPSEONG_TO_CATEGORY[sipseong];
  if (!category) return null;
  const info = PARENT_SIPSEONG_MEANING[category];
  return {
    parentLabel,
    sipseong,
    hanja: SIPSEONG_HANJA[sipseong] ?? "",
    category,
    meaning: info.meaning,
    oneLiner: info.oneLiner(parentLabel),
  };
}

// ─── 공통 신살 — 가족이 공유하는 결 ───────────────────────
export interface SharedSinsalResult {
  parentLabel: "엄마" | "아빠";
  shared: string[];       // 공유 신살 이름 목록
  oneLiner: string;
}

// ════════════════════════════════════════════════════════════════
// 자녀 사주 내부 합·충 — 4지지 안에서 발생하는 결의 흐름
// 삼합·방합·육합 = 결의 결합 / 육충·형 = 결의 흔들림
// ════════════════════════════════════════════════════════════════

const SAMHAP_GROUPS: Array<{ members: [string, string, string]; element: string; name: string }> = [
  { members: ["신", "자", "진"], element: "수", name: "신자진(申子辰) 삼합 → 수국" },
  { members: ["해", "묘", "미"], element: "목", name: "해묘미(亥卯未) 삼합 → 목국" },
  { members: ["인", "오", "술"], element: "화", name: "인오술(寅午戌) 삼합 → 화국" },
  { members: ["사", "유", "축"], element: "금", name: "사유축(巳酉丑) 삼합 → 금국" },
];
const BANGHAP_GROUPS: Array<{ members: [string, string, string]; element: string; name: string }> = [
  { members: ["인", "묘", "진"], element: "목", name: "인묘진(寅卯辰) 동방 방합 → 목국" },
  { members: ["사", "오", "미"], element: "화", name: "사오미(巳午未) 남방 방합 → 화국" },
  { members: ["신", "유", "술"], element: "금", name: "신유술(申酉戌) 서방 방합 → 금국" },
  { members: ["해", "자", "축"], element: "수", name: "해자축(亥子丑) 북방 방합 → 수국" },
];
const YUKHAP_PAIRS: Array<[string, string, string]> = [ // [a, b, name]
  ["자", "축", "자축(子丑) 육합"],
  ["인", "해", "인해(寅亥) 육합"],
  ["묘", "술", "묘술(卯戌) 육합"],
  ["진", "유", "진유(辰酉) 육합"],
  ["사", "신", "사신(巳申) 육합"],
  ["오", "미", "오미(午未) 육합"],
];
const YUKCHUNG_PAIRS: Array<[string, string, string]> = [
  ["자", "오", "자오(子午) 충"],
  ["축", "미", "축미(丑未) 충"],
  ["인", "신", "인신(寅申) 충"],
  ["묘", "유", "묘유(卯酉) 충"],
  ["진", "술", "진술(辰戌) 충"],
  ["사", "해", "사해(巳亥) 충"],
];

export interface ChildBranchHarmonyResult {
  hap: string[];        // 결합의 결 (삼합·방합·육합)
  chung: string[];      // 흔들림의 결 (육충)
  hyeong: string[];     // 다듬음의 결 (형)
  hasAny: boolean;
  oneLiner: string;
}

export function calcChildBranchHarmony(saju: SajuAnalysis): ChildBranchHarmonyResult | null {
  if (!saju?.pillars) return null;
  const branches = [
    saju.pillars.year?.branch,
    saju.pillars.month?.branch,
    saju.pillars.day?.branch,
    saju.pillars.hour?.branch,
  ].filter(Boolean) as string[];
  if (branches.length === 0) return null;
  const set = new Set(branches);

  const hap: string[] = [];
  const chung: string[] = [];
  const hyeong: string[] = [];

  // 완전 삼합 (3개 모두)
  SAMHAP_GROUPS.forEach(g => {
    const present = g.members.filter(m => set.has(m));
    if (present.length === 3) hap.push(g.name);
    else if (present.length === 2 && (present.includes(g.members[1]))) {
      // 반합 (가운데 글자 포함 시) — 약화 표기
      hap.push(`${present.join("")} 반합 → ${g.element}국 (약화)`);
    }
  });

  // 완전 방합 (3개 모두)
  BANGHAP_GROUPS.forEach(g => {
    const present = g.members.filter(m => set.has(m));
    if (present.length === 3) hap.push(g.name);
  });

  // 육합
  YUKHAP_PAIRS.forEach(([a, b, name]) => {
    if (set.has(a) && set.has(b)) hap.push(name);
  });

  // 육충
  YUKCHUNG_PAIRS.forEach(([a, b, name]) => {
    if (set.has(a) && set.has(b)) chung.push(name);
  });

  // 형 — 인사신 / 축술미 / 자묘 / 자형(辰辰·午午·酉酉·亥亥)
  if (["인","사","신"].every(b => set.has(b))) hyeong.push("인사신(寅巳申) 삼형");
  if (["축","술","미"].every(b => set.has(b))) hyeong.push("축술미(丑戌未) 삼형");
  if (set.has("자") && set.has("묘")) hyeong.push("자묘(子卯) 형");
  ["진","오","유","해"].forEach(b => {
    const cnt = branches.filter(x => x === b).length;
    if (cnt >= 2) hyeong.push(`${b}${b}(${b}${b}) 자형(自刑)`);
  });

  const hasAny = hap.length > 0 || chung.length > 0 || hyeong.length > 0;
  let oneLiner = "";
  if (hap.length > 0 && chung.length === 0) oneLiner = "자녀 사주 안에 *결합의 결*이 자리합니다 — 결이 모이고 어우러지는 자녀.";
  else if (chung.length > 0 && hap.length === 0) oneLiner = "자녀 사주 안에 *흔들림의 결*이 자리합니다 — 흔들리며 깨어나고 자라는 자녀.";
  else if (hap.length > 0 && chung.length > 0) oneLiner = "자녀 사주 안에 *결합과 흔들림이 함께* 자리합니다 — 모이고 흔들리며 깊어지는 자녀.";
  else if (hyeong.length > 0) oneLiner = "자녀 사주 안에 *다듬음의 결(형)*이 자리합니다 — 단련되며 자라는 자녀.";
  else oneLiner = "자녀 사주의 4지지가 평이하게 자리합니다 — 안정된 결의 자녀.";

  return { hap, chung, hyeong, hasAny, oneLiner };
}

// ════════════════════════════════════════════════════════════════
// 천간합(天干合) — 두 천간이 합쳐 새 오행을 만드는 결
// 갑+기=토(중정지합) / 을+경=금(인의지합) / 병+신=수(위엄지합) / 정+임=목(인수지합) / 무+계=화(무정지합)
// 부모-자녀 일간이 천간합이면 *명운이 깊이 묶이는 결*
// ════════════════════════════════════════════════════════════════

const CHEONGAN_HAP: Record<string, { partner: string; element: string; name: string; hanja: string }> = {
  갑: { partner: "기", element: "토", name: "중정지합", hanja: "中正之合" },
  기: { partner: "갑", element: "토", name: "중정지합", hanja: "中正之合" },
  을: { partner: "경", element: "금", name: "인의지합", hanja: "仁義之合" },
  경: { partner: "을", element: "금", name: "인의지합", hanja: "仁義之合" },
  병: { partner: "신", element: "수", name: "위엄지합", hanja: "威嚴之合" },
  신: { partner: "병", element: "수", name: "위엄지합", hanja: "威嚴之合" },
  정: { partner: "임", element: "목", name: "인수지합", hanja: "仁壽之合" },
  임: { partner: "정", element: "목", name: "인수지합", hanja: "仁壽之合" },
  무: { partner: "계", element: "화", name: "무정지합", hanja: "無情之合" },
  계: { partner: "무", element: "화", name: "무정지합", hanja: "無情之合" },
};

export interface CheonganHapResult {
  parentLabel: "엄마" | "아빠";
  hasHap: boolean;          // 천간합인지
  parentIlgan: string;
  childIlgan: string;
  hapName?: string;         // 합 이름 (예: 중정지합)
  hapHanja?: string;        // 한자
  hapElement?: string;      // 합화 오행 (예: 토)
  oneLiner: string;
}

export function calcCheonganHap(parentIlgan: string, childIlgan: string, parentLabel: "엄마" | "아빠"): CheonganHapResult {
  const info = CHEONGAN_HAP[parentIlgan];
  const hasHap = !!info && info.partner === childIlgan;
  if (hasHap && info) {
    return {
      parentLabel,
      hasHap: true,
      parentIlgan,
      childIlgan,
      hapName: info.name,
      hapHanja: info.hanja,
      hapElement: info.element,
      oneLiner: `${parentLabel}와 자녀의 일간이 **${info.name}(${info.hanja})** — *${info.element}의 결*로 합하는 깊은 인연. 두 분의 명운이 한 결로 묶이는 자리입니다.`,
    };
  }
  return {
    parentLabel,
    hasHap: false,
    parentIlgan,
    childIlgan,
    oneLiner: `${parentLabel}와 자녀의 일간은 천간합 관계는 아니지만, 각자의 결이 자기 색을 지키며 만나는 자리입니다.`,
  };
}

// ════════════════════════════════════════════════════════════════
// 십이신살(十二神煞) — 년지(年支) 기준 12단계 신살
// 三合 그룹별로 검살 시작점이 다름 — 양반사주 p4 표준 도구
// ════════════════════════════════════════════════════════════════

const SAMHAP_GROUP: Record<string, "水" | "木" | "火" | "金"> = {
  신: "水", 자: "水", 진: "水",  // 申子辰 水局
  해: "木", 묘: "木", 미: "木",  // 亥卯未 木局
  인: "火", 오: "火", 술: "火",  // 寅午戌 火局
  사: "金", 유: "金", 축: "金",  // 巳酉丑 金局
};
// 각 그룹별 검살(劫煞) 시작 지지
const GEOPSAL_START: Record<string, string> = {
  "水": "사",  // 신자진 → 검살 사
  "木": "신",  // 해묘미 → 검살 신
  "火": "해",  // 인오술 → 검살 해
  "金": "인",  // 사유축 → 검살 인
};
const SHIPISHINSAL = ["검살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"] as const;
const SHIPISHINSAL_HANJA: Record<string, string> = {
  "검살": "劫煞", "재살": "災煞", "천살": "天煞", "지살": "地煞", "년살": "年煞(桃花)", "월살": "月煞",
  "망신살": "亡神煞", "장성살": "將星煞", "반안살": "攀鞍煞", "역마살": "驛馬煞", "육해살": "六害煞", "화개살": "華蓋煞",
};
const SHIPISHINSAL_MEANING: Record<string, string> = {
  "검살": "위태로운 자리 — 신중·방어가 필요한 결",
  "재살": "어려움의 자리 — 인내·기다림의 결",
  "천살": "하늘의 자리 — 큰 흐름에 맡기는 결",
  "지살": "땅의 자리 — 이동·여행·새 환경의 결",
  "년살": "도화의 자리 — 사람을 끌어당기는 매력의 결",
  "월살": "음기의 자리 — 사색·내면이 깊은 결",
  "망신살": "명예의 자리 — 자기 색이 드러나는 결",
  "장성살": "통솔의 자리 — 리더십·이끄는 결",
  "반안살": "안정의 자리 — 자리잡고 번영하는 결",
  "역마살": "역마의 자리 — 변화·이동·외부 활동의 결",
  "육해살": "방해의 자리 — 작은 장애를 다듬는 결",
  "화개살": "화개의 자리 — 예술·학문·종교가 깊은 결",
};

export interface ShipiShinsalResult {
  yearBranch: string;       // 년지
  group: string;            // 三合 그룹 (水·木·火·金)
  branchToShinsal: Record<string, string>;  // 자녀 4지지별 신살 (있는 것만)
  oneLiner: string;
}

export function calcShipiShinsal(saju: SajuAnalysis): ShipiShinsalResult | null {
  if (!saju?.pillars?.year?.branch) return null;
  const yearBranch = saju.pillars.year.branch;
  const group = SAMHAP_GROUP[yearBranch];
  if (!group) return null;
  const startBranch = GEOPSAL_START[group];
  const startIdx = BRANCHES.indexOf(startBranch as typeof BRANCHES[number]);
  if (startIdx < 0) return null;

  // 자녀 4지지 → 12신살 매핑
  const fourBranches = [
    { name: "년지", branch: saju.pillars.year?.branch },
    { name: "월지", branch: saju.pillars.month?.branch },
    { name: "일지", branch: saju.pillars.day?.branch },
    { name: "시지", branch: saju.pillars.hour?.branch },
  ];
  const branchToShinsal: Record<string, string> = {};
  fourBranches.forEach(p => {
    if (!p.branch) return;
    const bIdx = BRANCHES.indexOf(p.branch as typeof BRANCHES[number]);
    if (bIdx < 0) return;
    const offset = (bIdx - startIdx + 12) % 12;
    const shinsal = SHIPISHINSAL[offset];
    branchToShinsal[p.name] = shinsal;
  });

  // 가장 두드러진 신살 (일지 기준 우선)
  const dominant = branchToShinsal["일지"] ?? branchToShinsal["월지"] ?? "";
  const oneLiner = dominant
    ? `자녀의 년지 ${yearBranch}(${group}局) 기준 — 일지에 **${dominant}(${SHIPISHINSAL_HANJA[dominant] ?? ""})**의 자리. ${SHIPISHINSAL_MEANING[dominant] ?? ""}.`
    : `자녀의 년지 ${yearBranch}(${group}局) 기준 12신살 분포가 평이한 결입니다.`;

  return {
    yearBranch,
    group,
    branchToShinsal,
    oneLiner,
  };
}

// ════════════════════════════════════════════════════════════════
// 십이운성(十二運星) — 일간 vs 12지지의 12단계 생장사멸
// 정통: 일간 양음에 따라 順行/逆行
// ════════════════════════════════════════════════════════════════

const UNSEONG_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
const UNSEONG_HANJA: Record<string, string> = {
  "장생": "長生", "목욕": "沐浴", "관대": "冠帶", "건록": "建祿", "제왕": "帝旺", "쇠": "衰",
  "병": "病", "사": "死", "묘": "墓", "절": "絶", "태": "胎", "양": "養",
};
// 일간별 장생 시작 지지
const UNSEONG_START_BRANCH: Record<string, string> = {
  갑: "해", 을: "오", 병: "인", 정: "유", 무: "인", 기: "유",
  경: "사", 신: "자", 임: "신", 계: "묘",
};
// 단계 의미 (자녀 본질 풀이용)
const UNSEONG_MEANING: Record<string, string> = {
  "장생": "새 시작·생명력의 결",
  "목욕": "씻기는·부드러운 변화의 결",
  "관대": "옷을 갖추는·자라가는 결",
  "건록": "스스로 자리를 세우는 결",
  "제왕": "최고로 빛나는·강한 결",
  "쇠": "한 박자 차분해지는 결",
  "병": "잠시 쉬어가는 결",
  "사": "마무리·정리의 결",
  "묘": "잠겨 있는·잠재의 결",
  "절": "끊기는·새로운 길의 시작 결",
  "태": "씨앗을 품는·잉태의 결",
  "양": "키워지는·자라남의 결",
};

export interface UnseongResult {
  ilji: string;            // 일지
  stage: string;           // 12운성 단계 한글
  hanja: string;           // 12운성 한자
  meaning: string;         // 단계 의미
  oneLiner: string;        // 자녀 일주 풀이 한 줄
}

export function calcUnseong(saju: SajuAnalysis): UnseongResult | null {
  if (!saju?.ilgan || !saju?.pillars?.day?.branch) return null;
  const ilgan = saju.ilgan;
  const ilji = saju.pillars.day.branch;
  const startBranch = UNSEONG_START_BRANCH[ilgan];
  if (!startBranch) return null;
  const isYang = STEM_POLARITY[ilgan] === "양";
  const startIdx = BRANCHES.indexOf(startBranch as typeof BRANCHES[number]);
  const targetIdx = BRANCHES.indexOf(ilji as typeof BRANCHES[number]);
  if (startIdx < 0 || targetIdx < 0) return null;
  // 양간: 順行 (지지 인덱스 증가 방향), 음간: 逆行
  const offset = isYang
    ? (targetIdx - startIdx + 12) % 12
    : (startIdx - targetIdx + 12) % 12;
  const stage = UNSEONG_STAGES[offset];
  const meaning = UNSEONG_MEANING[stage];
  return {
    ilji,
    stage,
    hanja: UNSEONG_HANJA[stage] ?? stage,
    meaning,
    oneLiner: `자녀의 일간 ${ilgan}이 일지 ${ilji}에 앉아 **${stage}(${UNSEONG_HANJA[stage] ?? stage})**의 자리 — ${meaning}.`,
  };
}

// ════════════════════════════════════════════════════════════════
// 가족 3인 공통 결 — 엄마·아빠·자녀 모두에게 있는 결
// 양친 모두 입력된 경우에만 의미 있음
// ════════════════════════════════════════════════════════════════

export interface FamilyTrioResult {
  hasMom: boolean;
  hasDad: boolean;
  sharedSinsal: string[];     // 3인 모두 공유 신살
  sharedElement: string | null; // 3인 모두 강한 오행
  cheonganHapChain: string;    // 천간합 체인 (예: "엄마-자녀 갑기합 + 아빠 별도")
  oneLiner: string;
}

export function calcFamilyTrio(
  sajuMom: SajuAnalysis | null | undefined,
  sajuDad: SajuAnalysis | null | undefined,
  sajuChild: SajuAnalysis,
): FamilyTrioResult | null {
  if (!sajuMom || !sajuDad) return null;
  const ms = new Set(sajuMom.sinsal ?? []);
  const ds = new Set(sajuDad.sinsal ?? []);
  const cs = new Set(sajuChild.sinsal ?? []);
  const sharedSinsal: string[] = [];
  cs.forEach(s => { if (ms.has(s) && ds.has(s)) sharedSinsal.push(s); });

  // 3인 모두 강한 오행 (각자 25% 이상)
  const sharedElement = (() => {
    const elements = ["목", "화", "토", "금", "수"];
    for (const el of elements) {
      const me = (sajuMom.elements as Record<string, number>)[el] ?? 0;
      const de = (sajuDad.elements as Record<string, number>)[el] ?? 0;
      const ce = (sajuChild.elements as Record<string, number>)[el] ?? 0;
      if (me >= 25 && de >= 25 && ce >= 25) return el;
    }
    return null;
  })();

  // 천간합 체인
  const momHap = calcCheonganHap(sajuMom.ilgan, sajuChild.ilgan, "엄마");
  const dadHap = calcCheonganHap(sajuDad.ilgan, sajuChild.ilgan, "아빠");
  let cheonganHapChain = "";
  if (momHap.hasHap && dadHap.hasHap) cheonganHapChain = "✨ 엄마·아빠 모두 자녀와 천간합 — 가족 명운이 한 결로 묶이는 깊은 인연";
  else if (momHap.hasHap) cheonganHapChain = `엄마-자녀 천간합 (${momHap.hapName}) — 모성의 결이 자녀와 깊이 묶임`;
  else if (dadHap.hasHap) cheonganHapChain = `아빠-자녀 천간합 (${dadHap.hapName}) — 부성의 결이 자녀와 깊이 묶임`;

  // 종합 한 줄
  let oneLiner = "";
  const features: string[] = [];
  if (sharedSinsal.length > 0) features.push(`*${sharedSinsal.join("·")}* 신살 공유`);
  if (sharedElement) features.push(`*${sharedElement}*의 결 공유`);
  if (cheonganHapChain) features.push("천간합 인연");
  if (features.length === 0) {
    oneLiner = "세 분 각자의 결이 *서로 다른 자리에서 빛나며 보완*하는 가족입니다.";
  } else {
    oneLiner = `세 분 가족이 ${features.join(", ")}로 묶인 가족 — *함께 자라가는 깊은 결의 가족*입니다.`;
  }

  return {
    hasMom: true,
    hasDad: true,
    sharedSinsal,
    sharedElement,
    cheonganHapChain,
    oneLiner,
  };
}

export function calcSharedSinsal(parentSinsal: string[], childSinsal: string[], parentLabel: "엄마" | "아빠"): SharedSinsalResult {
  const ps = new Set(parentSinsal ?? []);
  const cs = new Set(childSinsal ?? []);
  const shared: string[] = [];
  cs.forEach(s => { if (ps.has(s)) shared.push(s); });
  let oneLiner: string;
  if (shared.length === 0) {
    oneLiner = `${parentLabel}와 자녀가 직접 공유하는 신살은 없지만, 각자의 결이 서로를 보완하며 자라는 자리입니다.`;
  } else if (shared.length === 1) {
    oneLiner = `${parentLabel}와 자녀가 함께 가진 결은 **${shared[0]}** — 두 분의 사주에 공통으로 자리한 *가족이 공유하는 별의 결*입니다.`;
  } else {
    oneLiner = `${parentLabel}와 자녀가 함께 가진 결은 **${shared.join("·")}** — 가족이 *공유하는 별의 결*이 ${shared.length}개나 되는 깊은 인연.`;
  }
  return { parentLabel, shared, oneLiner };
}


