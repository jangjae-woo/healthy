// ════════════════════════════════════════════════════════════════════
// V2 자도인 — 결정론 매핑 키워드 풀 (M1~M7 통합)
// 사용자 메모장 권고: 본인 명리 깊이를 LLM에 키워드 풀로 직접 주입.
// V1 inyeon-traits.ts 패턴(5층 구조)을 V2 자도인용으로 확장.
//
// V2 추가:
//   M2 신강신약 7단계 매핑 — V1에 없음
//   M5 부족 오행 끌림 — V1에 없음
//   M7 일간 오행 매력 결 — V1 1층 간략판 → 별도 매핑
//
// V1과 차이:
//   V1 4·5층 (어울리는 상대·피해야 할 상대) = 인연 전용 → 자도인에서 제거
//   대신 자도인은 "자녀의 자기 결" + "부모가 받쳐줄 결" 중심
//
// 사용:
//   1) deriveChildTraits(sajuChild) → 자녀 사주 인자 룩업 결과
//   2) childTraitsToPromptBlock(traits, name, chapterScope?) → 프롬프트 텍스트 블록
//      chapterScope = "ch2" | "ch3" | "ch4" | "ch5" | "ch6" — 챕터별 부분 주입
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";
import { getDayMasterStrength } from "./saju-calculator";

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화",
  무: "토", 기: "토", 경: "금", 신: "금",
  임: "수", 계: "수",
};

const BRANCH_ELEM: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목",
  진: "토", 사: "화", 오: "화", 미: "토",
  신: "금", 유: "금", 술: "토", 해: "수",
};

// ─── M1 — 일간 10간 본질 매핑 (V1 1층 확장) ─────────────────────
const ILGAN_NATURE: Record<string, { name: string; nature: string; keywords: string[] }> = {
  갑: { name: "갑(甲)", nature: "곧게 뻗는 큰 나무", keywords: ["솔직함", "추진력", "리더의 결", "한 번 정하면 흔들리지 않음", "직진하는 자존심"] },
  을: { name: "을(乙)", nature: "유연하게 휘는 풀과 덩굴", keywords: ["적응력", "유연함", "사람을 살리는 결", "조용히 자라는 끈기", "굽힐 줄 아는 강함"] },
  병: { name: "병(丙)", nature: "온 세상을 비추는 한낮의 태양", keywords: ["환한 표현", "열정", "마음 숨기지 않음", "사람을 끌어당김", "강렬한 에너지"] },
  정: { name: "정(丁)", nature: "어둠을 밝히는 따뜻한 등불", keywords: ["섬세함", "헌신적 사랑", "다정한 결", "가까운 사람부터 챙김", "조용히 빛나는 결"] },
  무: { name: "무(戊)", nature: "광활한 큰 산", keywords: ["포용력", "묵직함", "중심 잡는 결", "흔들림 없는 신뢰", "느리지만 깊음"] },
  기: { name: "기(己)", nature: "곡식을 품은 옥토(沃土)", keywords: ["성실함", "꾸준함", "배려하는 결", "조용히 키우는 사람", "신중한 안정"] },
  경: { name: "경(庚)", nature: "단단하게 벼려진 강철", keywords: ["의리", "결단력", "고집·자존심", "한 번 정하면 흔들리지 않음", "무게감 있는 결"] },
  신: { name: "신(辛)", nature: "은은하게 빛나는 보석과 칼날", keywords: ["예리함", "세련됨", "결백한 결", "맺고 끊음 분명", "차가워 보이는 깊이"] },
  임: { name: "임(壬)", nature: "끝없이 흐르는 큰 강과 바다", keywords: ["지혜", "유연한 자유로움", "큰 그림 보는 결", "받아들임이 깊음", "흐름을 타는 사람"] },
  계: { name: "계(癸)", nature: "조용히 스미는 이슬과 비", keywords: ["직관", "감수성", "조용히 적시는 결", "마음 깊이 들어감", "부드러운 침투력"] },
};

// ─── M2 — 신강신약 7단계 매핑 (V2 신규) ─────────────────────
const SHINKANG_TRAITS: Record<string, { label: string; keywords: string[]; advice: string }> = {
  극약: { label: "극약(極弱)", keywords: ["스스로 결정 어려움", "외부 결로 자라는 사주", "받쳐주는 자리 풍부 시 회복", "고립 환경 X"], advice: "받아주는 사람·환경에서 빛나는 결" },
  태약: { label: "태약(太弱)", keywords: ["의지할 결 찾음", "혼자 짊어지면 무거움", "협력형 사주", "외로움 잘 탐"], advice: "함께 가는 결의 사람들 곁이 안식" },
  신약: { label: "신약(身弱)", keywords: ["신중함", "남의 결을 받아들이는 사주", "혼자 결정 부담", "받쳐주는 자리에서 빛남"], advice: "재촉 X·기다림이 자녀를 자라게 함" },
  중화: { label: "중화(中和)", keywords: ["균형 결", "양면 모두 가능", "상황 따라 변하는 결", "유연함이 무기"], advice: "어느 한쪽 단정 X·결을 보며 자기 페이스로" },
  신강: { label: "신강(身强)", keywords: ["자기 페이스 우선", "결정 빠름", "고독 잘 견딤", "자기 색 단단", "흔들리지 않는 결"], advice: "통제·간섭 X·자기 결대로 자라게 두기" },
  태강: { label: "태강(太强)", keywords: ["강한 자기 결", "남에게 휘둘리지 않음", "고집·자존심 강함", "한 번 정하면 흔들림 X"], advice: "맞부딪힘 X·돌아가는 길이 더 빠름" },
  극왕: { label: "극왕(極旺)", keywords: ["압도적 자기 결", "타인과 결합 어려움", "혼자 길 만드는 결", "독자성 강함"], advice: "큰 그림·독립 활동에서 빛나는 결" },
};

// ─── M3 — 일주 겉/속 결합 (V1 2층 그대로 — 25 조합) ─────────────────────
const ILJU_INNER_OUTER: Record<string, { outer: string; inner: string; combo: string }> = {
  "목-목": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "또 자라고 또 자라려는 의지", combo: "한결같은 사람, 다만 변화가 어려움" },
  "목-화": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "안에 빛이 있어 표현이 많음", combo: "활발하고 표현이 많은 사람" },
  "목-토": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "안은 안정을 원함", combo: "야망과 안정 사이에서 균형 찾는 사람" },
  "목-금": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "속은 단단해 결단력 있음", combo: "솔직하지만 한 번 결정하면 흔들리지 않는 사람" },
  "목-수": { outer: "곧고 자라는 결, 솔직하게 다가감", inner: "속은 흐르고 깊음", combo: "곧지만 유연한, 받아들임이 있는 사람" },
  "화-목": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안에서 또 자라고 싶음", combo: "끊임없이 새로움을 찾는 빛나는 사람" },
  "화-화": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안도 빛이 강함", combo: "강렬한 사람, 다만 휴식이 필요" },
  "화-토": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "안은 따뜻하고 안정", combo: "사람의 안식처가 되는 따뜻한 사람" },
  "화-금": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "속은 단단하고 절제", combo: "카리스마와 절제를 함께 가진 사람" },
  "화-수": { outer: "빛나고 펼치는 결, 마음을 숨기지 않음", inner: "속은 차분하고 깊음", combo: "표현은 화려하나 속은 깊은 사람" },
  "토-목": { outer: "안정시키고 품는 결, 묵직함", inner: "안은 자라고 싶은 결", combo: "겉은 차분하나 속에 야망이 있는 사람" },
  "토-화": { outer: "안정시키고 품는 결, 묵직함", inner: "안은 빛나고 싶음", combo: "겉은 무겁지만 속은 표현하고 싶은 사람" },
  "토-토": { outer: "안정시키고 품는 결, 묵직함", inner: "안도 안정", combo: "한결같은 안식처 같은 사람" },
  "토-금": { outer: "안정시키고 품는 결, 묵직함", inner: "속은 단단하고 결단", combo: "묵직한데 결정은 빠른 사람" },
  "토-수": { outer: "안정시키고 품는 결, 묵직함", inner: "속은 흐르고 받아들임", combo: "묵직하지만 마음은 깊고 유연한 사람" },
  "금-목": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 자라고 싶음", combo: "단단해 보이지만 속은 자라고 싶은 사람" },
  "금-화": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 빛나고 싶음", combo: "겉은 차갑지만 속은 뜨거운 사람" },
  "금-토": { outer: "다듬고 단단해지는 결, 결단력", inner: "안은 따뜻함", combo: "겉은 단단한데 속은 따뜻한 사람" },
  "금-금": { outer: "다듬고 단단해지는 결, 결단력", inner: "안도 단단", combo: "강한 결의 사람, 다만 부드러움이 필요" },
  "금-수": { outer: "다듬고 단단해지는 결, 결단력", inner: "속은 흐르고 깊음", combo: "단단한 결단력에 깊은 통찰을 가진 사람" },
  "수-목": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 자라려는 의지", combo: "유연하지만 안에 단단한 의지가 있는 사람" },
  "수-화": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 빛나고 싶음", combo: "차분해 보이지만 속은 표현하고 싶은 사람" },
  "수-토": { outer: "흐르고 받아들이는 결, 유연함", inner: "안은 안정", combo: "유연하고 안정된 사람" },
  "수-금": { outer: "흐르고 받아들이는 결, 유연함", inner: "속은 단단하고 결단", combo: "부드러운데 결정은 단호한 사람" },
  "수-수": { outer: "흐르고 받아들이는 결, 유연함", inner: "안도 깊음", combo: "끝없이 깊은 사람, 다만 표현이 적음" },
};

// ════════════════════════════════════════════════════════════════════
// ILJU_60GAPJA_OVERRIDE — 일주 60갑자 정밀 매핑 framework
// ────────────────────────────────────────────────────────────────────
// V1 패턴(25 조합 — 오행 × 오행)이 default. 60갑자별 정밀 데이터는 cell 단위로 override.
// 빈 cell = 25 조합 default 사용. 채워진 cell = 사용자 정밀 데이터.
// 한 갑자씩 추가 가능.
//
// 60갑자 list (참조용):
//   갑자·을축·병인·정묘·무진·기사·경오·신미·임신·계유 (10)
//   갑술·을해·병자·정축·무인·기묘·경진·신사·임오·계미 (20)
//   갑신·을유·병술·정해·무자·기축·경인·신묘·임진·계사 (30)
//   갑오·을미·병신·정유·무술·기해·경자·신축·임인·계묘 (40)
//   갑진·을사·병오·정미·무신·기유·경술·신해·임자·계축 (50)
//   갑인·을묘·병진·정사·무오·기미·경신·신유·임술·계해 (60)
//
// 사용 — 사용자가 한 갑자씩 추가:
//   ILJU_60GAPJA_OVERRIDE["경술"] = {
//     outer: "묵직·차분·강직",
//     inner: "외고집·자존심 강함·속에 화 품음",
//     combo: "한 번 마음 주면 깊고 길게 — 변심 X·표현 어려움",
//     keywords: ["굳건한 의지", "위기에 무너지지 않음", "겉은 차분 속은 단단"],
//   };
//
// 채워지는 갑자가 늘수록 풀이 깊이 ↑.
// ════════════════════════════════════════════════════════════════════
const ILJU_60GAPJA_OVERRIDE: Record<string, {
  outer?: string;
  inner?: string;
  combo?: string;
  keywords?: string[];
}> = {
  // 한 갑자씩 추가하면 됨. 빈 상태에서 시작.
  // 예시:
  // "경술": {
  //   outer: "묵직·차분·강직",
  //   inner: "외고집·자존심 강함·속에 화 품음",
  //   combo: "한 번 마음 주면 깊고 길게",
  //   keywords: ["굳건한 의지", "위기에 무너지지 않음"],
  // },
};

// 일주 룩업 — override > 25 조합 default
function getIljuTraitsV2(stem: string, branch: string): {
  outer: string;
  inner: string;
  combo: string;
  keywords: string[];
  isOverride: boolean;
} {
  const gapja = `${stem}${branch}`;
  const override = ILJU_60GAPJA_OVERRIDE[gapja];
  const stemElem = STEM_ELEM[stem] ?? "토";
  const branchElem = BRANCH_ELEM[branch] ?? "토";
  const default25 = ILJU_INNER_OUTER[`${stemElem}-${branchElem}`] ?? {
    outer: "고유한 결", inner: "깊은 결", combo: "단단한 결을 가진 자녀",
  };
  return {
    outer: override?.outer ?? default25.outer,
    inner: override?.inner ?? default25.inner,
    combo: override?.combo ?? default25.combo,
    keywords: override?.keywords ?? [],
    isOverride: !!override,
  };
}

// ════════════════════════════════════════════════════════════════════
// COMBINATION_KEYWORDS — 결합 매핑 framework (옵션 A — 250 cell)
// 일간 10 × 강한 오행 5 × 약한 오행 5 = 250 cell.
// key 형식: `${ilgan}-${strongElem}-${weakElem}` (예: "갑-화-수")
// 빈 cell = 사용자 메모 미작성. AI가 systemInstruction 결합 원칙 룰로 추론.
// 채워진 cell = 사용자 명리 깊이로 풀이.
//
// 사용 — 사용자가 한 cell씩 추가:
//   COMBINATION_KEYWORDS["갑-화-수"] = ["표현은 강한데 받침 부족", "발산하다 지치는 결", ...]
//   COMBINATION_KEYWORDS["경-토-목"] = ["받침은 두텁고 도전 자리 부족", "안정 안에 갇힌 결", ...]
// 채워지는 cell이 늘수록 풀이 깊이 ↑. 채워지지 않은 cell은 AI 룰 fallback.
//
// V1 결합 원칙 룰 fallback (systemInstruction에 박혀있음):
//   - 일간 약 + 인성·비겁 강 = 본인 결 회복
//   - 일간 강 + 인성·비겁 더 강 = 과잉 → 식상으로 풀어야
//   - 일간 약 + 관성·재성 강 = 무너지기 쉬움
//   - 강한 오행이 일간 극하는 오행을 생함 = 간접 극·우회 압박
// ════════════════════════════════════════════════════════════════════
const COMBINATION_KEYWORDS: Record<string, string[]> = {
  // 한 cell씩 추가하면 됨. 빈 상태에서 시작.
  // 예시:
  // "갑-화-수": ["표현은 강한데 받침 부족한 결", "발산하다 결국 지치는 흐름", "책 한 권 끝까지 읽기 어려움", "부모가 받쳐주면 비로소 깊어지는 결"],
  // "경-토-목": ["받침은 두텁고 도전 자리 부족한 결", "안정 안에 갇혀 자라남 막힌 흐름", "큰 변화는 조심스러우나 작은 시도는 안전"],
};

// 결합 cell 룩업 — 자녀 사주에서 일간·강한오행·약한오행 결합 키워드 풀 추출
function lookupCombinationKeywords(
  ilgan: string,
  strongElem: string | null,
  weakElem: string | null,
): string[] | null {
  if (!strongElem || !weakElem) return null;
  const key = `${ilgan}-${strongElem}-${weakElem}`;
  return COMBINATION_KEYWORDS[key] ?? null;
}

// ─── M4 — 신살 매력 (V1 3층 + 자도인 관점 추가) ─────────────────────
const SINSAL_CHARM: Record<string, { hanja: string; name: string; charm: string }> = {
  도화: { hanja: "桃花", name: "도화살", charm: "사람 모이는 자리에 자연스럽게 시선을 받는 결" },
  홍염: { hanja: "紅艶", name: "홍염살", charm: "은은한 매력, 말 안 해도 사람을 끌어당기는 결" },
  천을: { hanja: "天乙", name: "천을귀인", charm: "어려울 때 누군가 먼저 손을 내밀어 주는 인덕" },
  문창: { hanja: "文昌", name: "문창귀인", charm: "지식과 학문이 매력으로 작용하는 결" },
  학당: { hanja: "學堂", name: "학당귀인", charm: "평생 배움이 끊이지 않는 결" },
  화개: { hanja: "華蓋", name: "화개살", charm: "예술적 깊이, 고독을 잘 견디는 결" },
  역마: { hanja: "驛馬", name: "역마살", charm: "움직임 많은 자리에서 인연을 만나는 결" },
  장성: { hanja: "將星", name: "장성살", charm: "강한 카리스마, 사람을 이끄는 결" },
  반안: { hanja: "攀鞍", name: "반안살", charm: "안장에 오른다·자기 자리 흔들림 없이 잡는 결" },
  월덕: { hanja: "月德", name: "월덕귀인", charm: "따뜻한 인덕, 사람들이 의지하는 결" },
  태극: { hanja: "太極", name: "태극귀인", charm: "음양 조화·신비로운 영감의 결" },
  복성: { hanja: "福星", name: "복성귀인", charm: "평생 복덕이 따라오는 결" },
  금여: { hanja: "金輿", name: "금여", charm: "재물·배우자 복의 황금 수레" },
  양인: { hanja: "羊刃", name: "양인살", charm: "강한 추진력, 결단의 순간 빛나는 결" },
  괴강: { hanja: "魁罡", name: "괴강살", charm: "굳건한 신념, 위기에 무너지지 않는 결" },
  현침: { hanja: "懸針", name: "현침살", charm: "예리한 통찰, 정밀한 손재주의 결" },
  귀문: { hanja: "鬼門", name: "귀문관살", charm: "남이 못 보는 것을 보는 직관의 결" },
};

// ─── M5 — 부족 오행 끌림 (V2 신규) ─────────────────────
const WEAK_ELEM_ATTRACT: Record<string, { label: string; lacking: string; attractKey: string[] }> = {
  목: { label: "목(木) 부족", lacking: "자라남·진취·시작의 기운 부족", attractKey: ["부드럽게 뻗는 결", "새로움 시도하는 사람", "푸른빛·동쪽·아침"] },
  화: { label: "화(火) 부족", lacking: "표현·열정·환한 활기 부족", attractKey: ["환한 사람·따뜻한 분위기", "표현 자연스러운 결", "붉은빛·남쪽·한낮"] },
  토: { label: "토(土) 부족", lacking: "안정·신뢰·중심의 결 부족", attractKey: ["흔들림 없는 사람", "꾸준한 결의 동반자", "황색·중앙·환절기"] },
  금: { label: "금(金) 부족", lacking: "결단·정돈·맺고 끊음 부족", attractKey: ["맑고 단단한 결의 사람", "분명한 기준", "흰빛·서쪽·가을"] },
  수: { label: "수(水) 부족", lacking: "사색·지혜·깊이의 결 부족", attractKey: ["깊이 듣는 사람", "고요한 결의 동반자", "검은빛·북쪽·밤"] },
};

// ─── M6 — 부족 십성 끌림 (V1 4층 빈틈 채움 응용) ─────────────────────
const WEAK_SIP_ATTRACT: Record<string, { label: string; meaning: string; needs: string[] }> = {
  비겁: { label: "비겁 0", meaning: "자기 줏대 자리 옅음·협력형 사주(無比劫·종격 흐름)", needs: ["함께 가는 결의 친구", "친구처럼 옆에 동등한 사람"] },
  식상: { label: "식상 0", meaning: "안으로 정리하는 신중한 결·말 아끼고 깊이 쌓는 사주", needs: ["속을 끌어내주는 사람", "표현을 자연스럽게 만들어주는 결"] },
  재성: { label: "재성 0", meaning: "이상·가치·과정에 집중하는 결·실용보다 의미", needs: ["현실로 끌어내 주는 사람", "바깥 세상 안내자"] },
  관성: { label: "관성 0", meaning: "자유롭고 틀에 안 갇히는 결·창의·자기 길", needs: ["자주 드러나는 빈틈을 따뜻하게 봐주는 결", "단정 짓지 않는 사람"] },
  인성: { label: "인성 0", meaning: "즉각 행동하는 직관·실전형·체험으로 배우는 결", needs: ["받아주고 품어주는 어른", "혼자 짊어지지 않게 해주는 사람"] },
};

// ─── M7 — 일간 오행 매력 결 (V2 신규) ─────────────────────
const ILGAN_CHARM_BY_ELEM: Record<string, { label: string; charmKeys: string[] }> = {
  목: { label: "목 일간", charmKeys: ["곧게 자라는 결의 매력", "솔직함·진취적 모습", "새 시작에 빛남"] },
  화: { label: "화 일간", charmKeys: ["환한 표현의 매력", "사람들을 끌어당기는 결", "활기·열정"] },
  토: { label: "토 일간", charmKeys: ["묵직한 신뢰의 매력", "흔들림 없는 결", "포용력"] },
  금: { label: "금 일간", charmKeys: ["단단한 결단의 매력", "맑고 정돈된 결", "예리함·세련됨"] },
  수: { label: "수 일간", charmKeys: ["깊이 사색하는 매력", "흐르는 지혜", "조용한 깊이"] },
};

// ─── 십성 강약 행동 풀 (V1 1층 그대로 — 자도인에도 동일 유효) ─────────
const SIP_TRAITS: Record<string, { 강: string[]; 약: string[] }> = {
  식상: {
    강: ["말이 끊이지 않음", "표현이 풍부", "분위기 메이커", "사람 시선 모음", "감정 그대로 드러남"],
    약: ["속이 깊음", "말이 적음", "행동으로 보여줌", "조용한 자리 선호", "마음 표현이 어려움"],
  },
  재성: {
    강: ["현실 감각이 좋음", "활달", "사람을 끌어당김", "물질 감각이 있음", "사람을 챙김"],
    약: ["마음이 우선", "물질에 무심", "계산이 약함", "받기보다 줌"],
  },
  관성: {
    강: ["책임감이 강함", "단정함", "절제하는 결", "약속을 잘 지킴", "규칙을 따름"],
    약: ["빈틈이 자주 노출", "자유로움", "계획대로 안 따름", "즉흥적", "자기 통제가 약함"],
  },
  비겁: {
    강: ["자존심이 강함", "독립적", "스스로 결정함", "친구가 많음", "지지 않음"],
    약: ["혼자 결정이 어려움", "의지할 사람을 찾음", "외로움을 잘 탐"],
  },
  인성: {
    강: ["생각이 깊음", "잘 받아들임", "배움이 많음", "품이 넓음"],
    약: ["자수성가형", "혼자 일으킴", "받기 어색함", "마음이 닫힘"],
  },
};

// ────────────────────────────────────────────────────────────────────
// 자녀 사주 인자 룩업 — derive
// ────────────────────────────────────────────────────────────────────
function deriveSipCounts(saju: SajuAnalysis): Record<string, number> {
  const counts: Record<string, number> = { 식상: 0, 재성: 0, 관성: 0, 비겁: 0, 인성: 0 };
  const sip = saju.sipseong;
  const all = [
    sip.year.stem, sip.year.branch,
    sip.month.stem, sip.month.branch,
    sip.day.branch,
    sip.hour?.stem, sip.hour?.branch,
  ].filter(Boolean) as string[];
  for (const s of all) {
    if (s.includes("식신") || s.includes("상관")) counts.식상++;
    else if (s.includes("정재") || s.includes("편재")) counts.재성++;
    else if (s.includes("정관") || s.includes("편관") || s.includes("칠살")) counts.관성++;
    else if (s.includes("비견") || s.includes("겁재")) counts.비겁++;
    else if (s.includes("정인") || s.includes("편인") || s.includes("효신")) counts.인성++;
  }
  return counts;
}

function topElement(saju: SajuAnalysis): string {
  return (Object.entries(saju.elements) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];
}
function weakElement(saju: SajuAnalysis): string | null {
  const total = Object.values(saju.elements).reduce((a, b) => a + b, 0) || 1;
  const sorted = (Object.entries(saju.elements) as [string, number][]).sort((a, b) => a[1] - b[1]);
  const [el, val] = sorted[0];
  return val / total < 0.10 ? el : null;
}
function strongElement(saju: SajuAnalysis): string {
  return topElement(saju);
}

export interface ChildTraitsV2 {
  ilgan: { name: string; nature: string; keywords: string[] };
  ilganElem: string;
  iljiElem: string;
  shinkang: { label: string; keywords: string[]; advice: string };
  iljuInnerOuter: { outer: string; inner: string; combo: string; keywords: string[]; isOverride: boolean; gapja: string };
  charms: { hanja: string; name: string; charm: string }[];
  sipStrong: { sip: string; count: number; keywords: string[] }[];
  sipWeak: { sip: string; meaning: string; needs: string[] }[];
  weakElem: { label: string; lacking: string; attractKey: string[] } | null;
  ilganCharm: { label: string; charmKeys: string[] };
  // 결합 매핑 — 일간 + 강한 오행 + 약한 오행 cell. 사용자 채워졌으면 keywords 배열, 미채움이면 null.
  combinationKeywords: string[] | null;
  combinationKey: string;  // "갑-화-수" 형태 — 메모 작성 참조용
}

export function deriveChildTraitsV2(saju: SajuAnalysis): ChildTraitsV2 {
  const ilgan = ILGAN_NATURE[saju.ilgan] ?? { name: saju.ilgan, nature: "고유한 결", keywords: ["고유한 결의 사주"] };
  const ilganElem = STEM_ELEM[saju.ilgan] ?? "토";
  const iljiElem = BRANCH_ELEM[saju.pillars.day.branch] ?? "토";

  // 신강 — 자평명리 정통 산출
  const allBranches = [
    saju.pillars.year.branch, saju.pillars.month.branch, saju.pillars.day.branch,
    ...(saju.pillars.hour ? [saju.pillars.hour.branch] : []),
  ];
  const otherStems = [
    saju.pillars.year.stem, saju.pillars.month.stem,
    ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
  ];
  const dms = (() => {
    try { return getDayMasterStrength(saju.ilgan, saju.pillars.month.branch, allBranches, otherStems); }
    catch { return null; }
  })();
  const shinkangKey = dms?.level ?? "중화";
  const shinkang = SHINKANG_TRAITS[shinkangKey] ?? SHINKANG_TRAITS["중화"];

  // 일주 겉/속 — 60갑자 override > 25 조합 default
  const iljuRaw = getIljuTraitsV2(saju.ilgan, saju.pillars.day.branch);
  const iljuInnerOuter = {
    ...iljuRaw,
    gapja: `${saju.ilgan}${saju.pillars.day.branch}`,
  };

  // 신살 매력 — 자녀 보유 신살 매핑
  const charms: { hanja: string; name: string; charm: string }[] = [];
  for (const sName of saju.sinsal) {
    for (const [key, data] of Object.entries(SINSAL_CHARM)) {
      if (sName.includes(key)) {
        charms.push(data);
        break;
      }
    }
  }

  // 십성 강약
  const counts = deriveSipCounts(saju);
  const sipStrong: { sip: string; count: number; keywords: string[] }[] = [];
  const sipWeak: { sip: string; meaning: string; needs: string[] }[] = [];
  for (const s of ["식상", "재성", "관성", "비겁", "인성"]) {
    const c = counts[s];
    if (c >= 3) sipStrong.push({ sip: s, count: c, keywords: SIP_TRAITS[s].강 });
    else if (c === 0) {
      const wsa = WEAK_SIP_ATTRACT[s];
      sipWeak.push({ sip: s, meaning: wsa.meaning, needs: wsa.needs });
    }
  }

  // 부족 오행 끌림
  const weakEl = weakElement(saju);
  const weakElem = weakEl ? WEAK_ELEM_ATTRACT[weakEl] ?? null : null;

  // 일간 오행 매력 결
  const ilganCharm = ILGAN_CHARM_BY_ELEM[ilganElem] ?? ILGAN_CHARM_BY_ELEM["토"];

  // 결합 매핑 cell 룩업 (옵션 A — 일간 × 강한 오행 × 약한 오행)
  const strongEl = strongElement(saju);
  const combinationKey = `${saju.ilgan}-${strongEl}-${weakEl ?? "—"}`;
  const combinationKeywords = lookupCombinationKeywords(saju.ilgan, strongEl, weakEl);

  return {
    ilgan, ilganElem, iljiElem,
    shinkang, iljuInnerOuter, charms,
    sipStrong, sipWeak,
    weakElem, ilganCharm,
    combinationKeywords, combinationKey,
  };
}

// ────────────────────────────────────────────────────────────────────
// 프롬프트 텍스트 블록 조립 — chapterScope으로 챕터별 부분 주입
// ch2 (공부): 일간·신강·인성/식상 강약
// ch3 (칭찬·혼냄): 일간·신강·일주·인성/식상·신살
// ch4 (친구): 일주·신살·비겁/식상 강약
// ch5 (진로): 부족 오행·일간 매력·재성/관성·신살
// ch6 (부모-자녀 결): 일간·부족 오행
// 챕터 미지정 시 전체 출력
// ────────────────────────────────────────────────────────────────────
export type V2ChapterScope = "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "all";

export function childTraitsToPromptBlockV2(
  t: ChildTraitsV2,
  childName: string,
  scope: V2ChapterScope = "all",
): string {
  const lines: string[] = [];
  const cnh = childName;

  lines.push(`━━━ ${cnh} 자동 매핑 키워드 풀 (이 풀에서만 본문 인용 — 임의 통설 추가 금지) ━━━`);

  // 일간 본질 (모든 챕터 공통)
  lines.push("");
  lines.push(`[일간 본질]`);
  lines.push(`- ${t.ilgan.name}: ${t.ilgan.nature}`);
  lines.push(`- 키워드 풀: ${t.ilgan.keywords.join(" / ")}`);

  // 신강 (ch2·ch3·ch4 강조 — 자녀 회복·충전·자기 결)
  if (scope === "all" || scope === "ch2" || scope === "ch3" || scope === "ch4") {
    lines.push("");
    lines.push(`[신강신약]`);
    lines.push(`- ${t.shinkang.label}: ${t.shinkang.keywords.join(" / ")}`);
    lines.push(`- 양육 가이드: ${t.shinkang.advice}`);
  }

  // 일주 겉/속 (ch3·ch4 강조 — 거짓말·친구 사이)
  if (scope === "all" || scope === "ch3" || scope === "ch4") {
    lines.push("");
    lines.push(`[일주 ${t.iljuInnerOuter.gapja} — 겉과 속의 차이${t.iljuInnerOuter.isOverride ? " (60갑자 정밀)" : ""}]`);
    lines.push(`- 겉(보여지는 결): ${t.iljuInnerOuter.outer}`);
    lines.push(`- 속(진짜 결): ${t.iljuInnerOuter.inner}`);
    lines.push(`- 결합: "${t.iljuInnerOuter.combo}"`);
    if (t.iljuInnerOuter.keywords.length > 0) {
      lines.push(`- 키워드 풀: ${t.iljuInnerOuter.keywords.join(" / ")}`);
    }
  }

  // 십성 강약 (ch2·ch3·ch4 강조)
  if (scope === "all" || scope === "ch2" || scope === "ch3" || scope === "ch4") {
    if (t.sipStrong.length > 0) {
      lines.push("");
      lines.push(`[강한 십성 + 행동 풀]`);
      for (const s of t.sipStrong) {
        lines.push(`- ${s.sip}(${s.count}개): ${s.keywords.join(" / ")}`);
      }
    }
    if (t.sipWeak.length > 0) {
      lines.push("");
      lines.push(`[비어 있는 십성 — 양면 풀이 필수]`);
      for (const w of t.sipWeak) {
        lines.push(`- ${w.sip}(0개): ${w.meaning}`);
        lines.push(`  필요한 결: ${w.needs.join(" / ")}`);
      }
    }
  }

  // 신살 매력 (ch3·ch4·ch5 강조 — 칭찬·친구·진로)
  if (scope === "all" || scope === "ch3" || scope === "ch4" || scope === "ch5") {
    if (t.charms.length > 0) {
      lines.push("");
      lines.push(`[보유 신살 + 결의 매력]`);
      for (const c of t.charms.slice(0, 5)) {
        lines.push(`- ${c.hanja}(${c.name}): ${c.charm}`);
      }
    }
  }

  // 부족 오행 (ch5·ch6 강조 — 진로·부모 결)
  if (scope === "all" || scope === "ch5" || scope === "ch6") {
    if (t.weakElem) {
      lines.push("");
      lines.push(`[부족 오행 — 채워줄 결]`);
      lines.push(`- ${t.weakElem.label}: ${t.weakElem.lacking}`);
      lines.push(`- 끌리는 결: ${t.weakElem.attractKey.join(" / ")}`);
    }
  }

  // 일간 매력 결 (ch5 강조 — 빛날 분야)
  if (scope === "all" || scope === "ch5") {
    lines.push("");
    lines.push(`[일간 오행 매력 결]`);
    lines.push(`- ${t.ilganCharm.label}: ${t.ilganCharm.charmKeys.join(" / ")}`);
  }

  // 결합 매핑 cell — 사용자 메모로 채워진 cell만 박힘. 빈 cell이면 출력 X (AI는 결합 원칙 룰 fallback).
  // 모든 챕터에 등장 — 자녀 결합 의미가 모든 풀이의 토대.
  if (t.combinationKeywords && t.combinationKeywords.length > 0) {
    lines.push("");
    lines.push(`[결합 매핑 — 일간 + 강한 오행 + 약한 오행]`);
    lines.push(`- ${t.combinationKey}: ${t.combinationKeywords.join(" / ")}`);
  }

  return lines.join("\n");
}
