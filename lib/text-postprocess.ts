// AI 출력 텍스트 후처리 — 자녀 호칭(양/군) 일관성 보정 + ban 어휘 100% 강제
// 프롬프트 강제(옵션 A)에서 새는 케이스를 100% 보장하기 위한 정규식 안전망(옵션 B).
// Phase 4 (옵션 D) 확장: 십성·합충 한자 자동 제거 + 차트-본문 정합 검증.

import type { ChildSeed } from "./child-seed";

/**
 * 강 부정 한자/동사 자동 치환 — AI가 ban 단어를 출력해도 화면 노출 100% 차단
 * 명리 용어(상극·충 등) + 일반 한국어 부정 동사(억누르다·압박 등)
 */
// 보수형(옵션 2) — 명사형 + 한자 단독 치환만. 동사형은 프롬프트(2단계)에서 차단.
// 한국어 인플렉션(동사 활용) 후처리는 비문 위험이 있어 후처리 X.
const NEGATIVE_REPLACEMENTS: Array<[RegExp, string]> = [
  // ─── 명리 강 부정 한자 (단독 치환, grammar 위험 0) ───
  [/상극\s*\(\s*相剋\s*\)/g, "결의 다름"],
  [/\(\s*相剋\s*\)/g, ""],
  [/상극/g, "결의 다름"],
  [/충\s*\(\s*[沖冲]\s*\)/g, "변화의 결"],
  [/\(\s*[沖冲]\s*\)/g, ""],
  [/양인살/g, "격렬한 감정 결"],
  [/괴강살/g, "단단한 결"],
  [/공망/g, "비어있는 결"],
  [/칠살/g, "강한 자극 결"],
  [/형\s*\(\s*刑\s*\)/g, "다듬는 자극"],
  [/흉\s*\(\s*凶\s*\)/g, "조심할 결"],

  // ─── Phase 3 신규: 자원 프레임 위배 어휘 ban (살펴주면 좋은 결 페이지 도입) ───
  [/기신\s*\(\s*忌神\s*\)/g, "살펴주면 좋은 결"],
  [/\(\s*忌神\s*\)/g, ""],
  [/치명적(인|이)/g, "조심할 결$1"],

  // ─── 비표준 어법 보정 — AI 자체 활용 오류 (사용자 발견) ───
  [/깊여가/g, "깊어가"],     // "깊여가는" → "깊어가는" (표준 어미)
  [/깊여지/g, "깊어지"],     // "깊여지는" → "깊어지는"
  // 자녀(주어) 에 존대 -시- 부적절 → 제거. "자라는 주체 = 자녀"이므로 높임 X.
  [/자라가시며/g, "자라가며"],
  [/자라나시며/g, "자라나며"],
  // 타동사 자리 자동사 비문법 보정 — "결/길/호흡을 깊어/깊여" = 비문 (목적어 + 자동사)
  [/(결|길|호흡)을\s*깊어가/g, "$1을 깊이 가꾸어가"],
  [/(결|길|호흡)을\s*깊여가/g, "$1을 깊이 가꾸어가"],
  [/(결|길|호흡)을\s*깊어지/g, "$1을 깊이 다듬어가"],
  [/(결|길|호흡)을\s*깊여지/g, "$1을 깊이 다듬어가"],
  // 십성 5분류 페이지 "기운이 차분한 편" 우회 표현 ban (동어반복 + 약함 우회) — 사용자 발견
  [/(절제하는|표현하는|사색하는|챙기는|자기를?\s*세우는)\s*기운(은|이)\s*다른\s*기운에\s*비해\s*비교적\s*차분한\s*편/g, "$1 기운$2 다른 기운에 비해 약한 편"],
  [/(절제하는|표현하는|사색하는|챙기는|자기를?\s*세우는)\s*기운(은|이)\s*다른\s*기운에\s*비해\s*차분한\s*편/g, "$1 기운$2 다른 기운에 비해 약한 편"],
  [/(절제하는|표현하는|사색하는|챙기는|자기를?\s*세우는)\s*기운(은|이)\s*비교적\s*차분한\s*편/g, "$1 기운$2 비교적 약한 편"],
  [/(절제하는|표현하는|사색하는|챙기는|자기를?\s*세우는)\s*기운(은|이)\s*잔잔한\s*편/g, "$1 기운$2 약한 편"],

  // ─── 부정 명사 + 조사 (동사형 후처리 X — 인플렉션 위험) ───
  [/위축(을|이|은|의|에|에서)/g, "조심스러움$1"],
  [/압박(을|이|은|의|에|에서)/g, "강한 영향$1"],
  [/위협(을|이|은|의|에|에서)/g, "강한 자극$1"],
  [/짜증(을|이|은|의|에|에서)/g, "답답함$1"],

  // ─── 호칭 통일 ("엄마" → "어머님", "아빠" → "아버님") ───
  // 단어 경계 보존 — "엄마" 가 다른 단어 일부면 안 건드림 ("엄마이름" 같은 케이스)
  [/(?<![가-힣])아빠가(?![가-힣])/g, "아버님께서"],
  [/(?<![가-힣])아빠는(?![가-힣])/g, "아버님은"],
  [/(?<![가-힣])아빠의(?![가-힣])/g, "아버님의"],
  [/(?<![가-힣])아빠와(?![가-힣])/g, "아버님과"],
  [/(?<![가-힣])아빠께(?![가-힣])/g, "아버님께"],
  [/(?<![가-힣])아빠도(?![가-힣])/g, "아버님도"],
  [/(?<![가-힣])아빠를(?![가-힣])/g, "아버님을"],
  [/(?<![가-힣])아빠에게(?![가-힣])/g, "아버님께"],
  [/(?<![가-힣])아빠(?=,|\.|!|\?|—|—|\s|$)/g, "아버님"],
  [/(?<![가-힣])엄마가(?![가-힣])/g, "어머님께서"],
  [/(?<![가-힣])엄마는(?![가-힣])/g, "어머님은"],
  [/(?<![가-힣])엄마의(?![가-힣])/g, "어머님의"],
  [/(?<![가-힣])엄마와(?![가-힣])/g, "어머님과"],
  [/(?<![가-힣])엄마께(?![가-힣])/g, "어머님께"],
  [/(?<![가-힣])엄마도(?![가-힣])/g, "어머님도"],
  [/(?<![가-힣])엄마를(?![가-힣])/g, "어머님을"],
  [/(?<![가-힣])엄마에게(?![가-힣])/g, "어머님께"],
  [/(?<![가-힣])엄마(?=,|\.|!|\?|—|—|\s|$)/g, "어머님"],
];

/**
 * 강 부정 한자/명사 자동 치환 (보수형).
 * 동사형(억누르다·위축되다 등)은 프롬프트(route.ts) 자원 프레임 절대 원칙으로 차단.
 * 후처리는 grammar 안전한 한자 단독·명사+조사 형태만 처리.
 *
 * ⚠ 중요: 마크다운 헤더 라인 (## / ### / #### 으로 시작) 은 건드리지 않음.
 * parseSections 가 SECTION_HEADERS ("엄마와 우리 아이" 등) 매칭에 의존하므로,
 * 헤더 라인의 "엄마"·"아빠" 가 "어머님"·"아버님" 으로 치환되면 섹션 매칭 실패 → mom·dad 슬라이드 콘텐츠가 이전 섹션에 흡수되는 버그 발생.
 */
export function softenNegatives(text: string): string {
  if (!text) return text;
  return text.split('\n').map(line => {
    // 마크다운 헤더 라인 (## ### #### 등) 은 치환 스킵
    if (/^#{1,4}\s/.test(line)) return line;
    let result = line;
    for (const [pattern, replacement] of NEGATIVE_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }).join('\n');
}

/**
 * 본문 안의 자녀 단독 이름을 호칭 부착형으로 강제 변환.
 * - "김자인" → "김자인양" (이미 "김자인양/군/님/씨"인 곳은 건드리지 않음)
 * - 이름이 다른 단어의 부분 문자열로 우연히 등장해도 lookahead 로 보호
 * - 호칭 부착 후 잘못된 조사(양/군 받침 있음)도 함께 보정: 를→을, 는→은, 가→이, 와→과
 */
export function ensureChildHonorific(
  text: string,
  childName: string,
  childGender?: string,
): string {
  if (!text || !childName) return text;
  const honor = childGender === "남" ? "군" : childGender === "여" ? "양" : null;
  if (!honor) return text;

  const escaped = childName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const honored = childName + honor;

  // 1) 호칭 부착 — 다음 글자가 양/군/님/씨가 아닐 때만 (이중 호칭·기존 호칭 보호)
  const re = new RegExp(`${escaped}(?![양군님씨])`, "g");
  let result = text.replace(re, honored);

  // 2) 호칭 부착 후 잘못된 조사 보정 (양/군 모두 받침 있음 → 을·은·이·과)
  result = result.replace(new RegExp(`${escaped}${honor}를`, "g"), `${honored}을`);
  result = result.replace(new RegExp(`${escaped}${honor}는`, "g"), `${honored}은`);
  // "가" 단독 — 다음 글자가 한글이면 일반 단어일 수 있으니 어절 경계만 보정
  result = result.replace(
    new RegExp(`${escaped}${honor}가(?=[\\s,.\\u3001\\u3002!?:;)\\]\\}"'\\u201D\\u2019]|$)`, "g"),
    `${honored}이`,
  );
  result = result.replace(new RegExp(`${escaped}${honor}와`, "g"), `${honored}과`);
  return result;
}

/**
 * 한국어 조사 자동 선택 — 받침 여부에 따라 적절한 조사 반환.
 *
 * @param word 조사를 붙일 단어 (예: "환한 햇살", "큰 나무", "그 결을 닮은 자녀")
 * @param withFinal 받침 있을 때 사용 (예: "이", "은", "을", "과", "으로")
 * @param withoutFinal 받침 없을 때 사용 (예: "가", "는", "를", "와", "로")
 * @returns word + 적절한 조사
 *
 * 사용 예:
 *   josa("환한 햇살", "이", "가") → "환한 햇살이"   (받침 ㄹ)
 *   josa("큰 나무", "이", "가")   → "큰 나무가"     (받침 X)
 *   josa("그 결을 닮은 자녀", "이", "가") → "그 결을 닮은 자녀가"  (받침 X)
 *   josa("강철", "은", "는")      → "강철은"        (받침 ㄹ)
 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  if (!word) return word;
  const last = word.charCodeAt(word.length - 1);
  // 한글 음절 범위 (가 = 0xAC00, 힣 = 0xD7A3)
  if (last >= 0xAC00 && last <= 0xD7A3) {
    const finalIdx = (last - 0xAC00) % 28;
    // finalIdx === 0 이면 받침 없음
    return word + (finalIdx === 0 ? withoutFinal : withFinal);
  }
  // 한글 아니면 안전하게 받침 있는 것으로 가정
  return word + withFinal;
}

// ─── Phase 4: 십성·합충 한자 ban 자동 강제 ────────────────────────
// 프롬프트 ban 이 새는 케이스 (14/39 "(인성)" 노출, 16/39 "(天干 丙辛合)" 노출 등) 100% 차단.

const SIPSEONG_HANJA_NAMES = [
  "비견", "겁재", "비겁",
  "식신", "상관", "식상",
  "정재", "편재", "재성",
  "정관", "편관", "관성",
  "정인", "편인", "인성",
];

const STEMS_HANJA = "[甲乙丙丁戊己庚辛壬癸]";
const BRANCHES_HANJA = "[子丑寅卯辰巳午未申酉戌亥]";

// ─── Phase 4 확장: ★ 권고 수준 ban 어휘 자동 변환 ──────────────────
// 프롬프트에 ★ 수준 ban 으로 명시되었지만 AI 가 무시하는 어휘를 후처리에서 강제 변환.
// 안전한 단어 치환만 (의미 왜곡 위험 0).

const SOFT_BAN_REPLACEMENTS: Array<[RegExp, string]> = [
  // ─── 재성 수동 표현 → 능동 표현 (route.ts:1399 ban 강화) ───
  // "끌리는 기운" → "손에 잡으려는 기운"
  [/끌리는\s+기운/g, "손에 잡으려는 기운"],
  // "끌리는 결" → "손에 잡으려는 결"
  [/끌리는\s+결/g, "손에 잡으려는 결"],

  // ─── 본문 % 수치 직접 노출 ban (route.ts:1318 "차트 수치 직접 언급 X" 강화) ───
  // "43%로 가장 강하게" → "가장 강하게" (route.ts:1318 차트 수치 ban)
  // "0%로 가장 약하게" → "가장 약하게"
  // 패턴: 숫자%로/은/이/가 → 조사 보존하면서 % 부분만 제거
  [/\b\d+%로\s+/g, ""],
  [/\b\d+%(은|는|이|가|을|를)\s+/g, "$1 "],
  // "(\d+%)" 괄호 안 % 노출
  [/\s*\(\s*\d+%\s*\)/g, ""],
  // "약 \d+%" 도 부드럽게 제거
  [/\b약\s+\d+%/g, ""],
];

const HANJA_BAN_PATTERNS: Array<[RegExp, string]> = [
  // ─── 십성 한자: "기운(인성)이" → "기운이", "결(재성)이" → "결이" ───
  // 한국어 단어 + 괄호( 십성한자 ) 형태
  [new RegExp(`\\s*\\(\\s*(?:${SIPSEONG_HANJA_NAMES.join("|")})\\s*\\)`, "g"), ""],

  // ─── 합·충 한자: "병신합(天干 丙辛合)" → "병신합" ───
  [new RegExp(`\\s*\\(\\s*天干\\s+${STEMS_HANJA}{2,}\\s*合\\s*\\)`, "g"), ""],
  [new RegExp(`\\s*\\(\\s*地支\\s+${BRANCHES_HANJA}{2,}\\s*合\\s*\\)`, "g"), ""],
  // 단순 천간 합/충: "(丙辛合)" "(子午沖)"
  [new RegExp(`\\s*\\(\\s*${STEMS_HANJA}{2,}\\s*合\\s*\\)`, "g"), ""],
  [new RegExp(`\\s*\\(\\s*${BRANCHES_HANJA}{2,}\\s*[合沖冲]\\s*\\)`, "g"), ""],

  // ─── 본문에 직접 노출된 한자 라벨: "天干 丙辛合으로" → "병신합으로" (한국어 음만) ───
  // 한자만 단독 노출은 한국어 음으로 변환. 일단 보수적: 제거만 (한국어 풀이는 이미 본문에 있음 가정).
  [new RegExp(`天干\\s+${STEMS_HANJA}{2,}\\s*合`, "g"), "천간 합"],
  [new RegExp(`地支\\s+${BRANCHES_HANJA}{2,}\\s*合`, "g"), "지지 합"],

  // ─── 음양 한자 ban (사용자 발견 — 외향/내향 페이지) ───
  // "음 기운(陰氣運)" → "음 기운", "양 기운(陽氣運)" → "양 기운"
  [/\s*\(\s*[陰陽][氣運]+\s*\)/g, ""],
  // "(陰)", "(陽)" 단독 한자
  [/\s*\(\s*[陰陽]\s*\)/g, ""],

  // ─── 단독 한자 한 글자 ban (이전 C-34 — 합·충·기타 명리 한자) ───
  // "(合)", "(沖)", "(刑)", "(剋)", "(冲)" 등
  [/\s*\(\s*[合沖冲剋刑生比]\s*\)/g, ""],

  // ─── 기타 명리 한자 ban (잠재 케이스) ───
  // "(用神)", "(本氣)", "(格局)", "(印綬)", "(羊刃)" 등
  [/\s*\(\s*(用神|本氣|格局|印綬|羊刃|太極貴人|現針|文昌|天乙貴人|華蓋|桃花|傷官)\s*\)/g, ""],
];

/**
 * 십성·합충 한자 자동 제거 + ★ 수준 ban 어휘 자동 변환.
 * 마크다운 헤더 라인은 보호.
 */
export function enforceHanjaBan(text: string): string {
  if (!text) return text;
  return text.split('\n').map(line => {
    // 마크다운 헤더 라인 (## ### 등) 은 치환 스킵
    if (/^#{1,4}\s/.test(line)) return line;
    let result = line;
    for (const [pattern, replacement] of HANJA_BAN_PATTERNS) {
      result = result.replace(pattern, replacement);
    }
    // ★ 수준 ban 어휘 자동 변환 (재성 수동 표현 등)
    for (const [pattern, replacement] of SOFT_BAN_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }).join('\n');
}

// ─── Phase 4: 차트-본문 정합 검증 (모니터링 + 안전한 자동 교정) ─────
// 시드의 약/강 결과 본문이 정반대로 묘사되면 자동 부드럽게.

const ELEM_KOR_SIMPLE: Record<string, string> = {
  목: "나무", 화: "불", 토: "흙", 금: "쇠", 수: "물",
};

/**
 * 차트-본문 정합 검증.
 * 시드의 약한 결을 본문에서 "강하게 솟구치는" 같이 묘사하면 자동 부드럽게.
 * 잘못된 강 양상 묘사를 부드러운 톤으로 변환 — 의미 왜곡 위험은 낮은 안전 패턴만 처리.
 */
export function enforceChartConsistency(text: string, seed: ChildSeed | null): string {
  if (!text || !seed) return text;

  const weakElement = seed.weakElement;
  const weakElemKor = ELEM_KOR_SIMPLE[weakElement];
  if (!weakElemKor) return text;

  // 약한 결 (예: 수 12%) 인데 "물의 결이 강하게 솟구치는" 묘사 → "부드럽게 흐르는"
  const strongTriggers = [
    `${weakElemKor}의 결이 강하게 솟구치`,
    `${weakElemKor}의 결이 강하게 자리 잡`,
    `${weakElemKor}의 결이 강하게 흐르`,
    `${weakElemKor}의 결\\([木火土金水]\\)이 강하게 솟구치`,
    `${weakElemKor}의 결\\([木火土金水]\\)이 강하게 자리 잡`,
  ];

  let result = text;
  for (const trigger of strongTriggers) {
    const re = new RegExp(trigger, "g");
    result = result.replace(re, (match) => {
      // 차트와 본문 정반대 → 부드러운 표현으로 교정
      return match.replace(/강하게 솟구치/, "부드럽게 흐르")
                  .replace(/강하게 자리 잡/, "섬세히 자리 잡")
                  .replace(/강하게 흐르/, "부드럽게 흐르");
    });
  }

  return result;
}

/**
 * 6요인 TOP3 본문 자동 교정 (옵션 C — 사실 데이터 변형 차단).
 * AI 가 시드의 sixFactorTop3 와 다른 TOP3 출력 시 자동 교체.
 * 패턴: "가장 두드러진 행동 결은 **A·B·C** 입니다" 형태만 매칭 (안전).
 */
export function enforceSixFactorTop3(text: string, seed: ChildSeed | null): string {
  if (!text || !seed) return text;
  const correctTop3 = seed.sixFactorTop3.join("·");
  // "가장 두드러진 행동 결은 **A·B·C** 입니다" 패턴 매칭
  const pattern = /(가장 두드러진 행동 결은\s*\*\*)([^*]+)(\*\*)/;
  return text.replace(pattern, (_match, prefix, current, suffix) => {
    if (current.trim() !== correctTop3) {
      // AI 가 swap 했다면 시드 TOP3 로 자동 교체
      return `${prefix}${correctTop3}${suffix}`;
    }
    return _match;
  });
}

// ─── 매 sub 끝 "기억해야 할 한 가지" 마무리 문장 제거 ─────────────────
// V2 자도인 prompt가 ch3·ch4·ch5의 모든 sub 마지막 단락에 동일 표준 고정구를 박음:
// "{P}이 기억해야 할 한 가지는, [child]은 [단정]라는 거예요."
// → 결과 끝까지 읽으면 같은 어구 15회+ 반복 노출 → AI 템플릿 느낌 직격.
// 후처리에서 그 문장 통째 제거. ageStage·부모 입력 케이스 무관. 모든 출력에 적용.
//
// 헤더 라인 보호. 본문 문장만 제거 (정규식: 트리거 포함 문장을 sentence boundary 까지).
const TAKEAWAY_PATTERNS: RegExp[] = [
  // "{P}이 기억해야 할 한 가지는, …" — 표준 prompt 템플릿
  /[^.!?\n]*?기억해야\s*할\s*한\s*가지[^.!?\n]*?(?:[.!?]|다\.|요\.|니다\.)\s*/g,
  // 회전 변주 케이스 — LLM이 자연스럽게 변형 출력
  /[^.!?\n]*?잊지\s*말아야\s*할\s*한\s*가지[^.!?\n]*?(?:[.!?]|다\.|요\.|니다\.)\s*/g,
  /[^.!?\n]*?마음에\s*새기[실시]?\s*한\s*가지[^.!?\n]*?(?:[.!?]|다\.|요\.|니다\.)\s*/g,
];

export function stripParentTakeaway(text: string): string {
  if (!text) return text;
  return text.split('\n').map(line => {
    if (/^#{1,4}\s/.test(line)) return line; // 헤더 보호
    let r = line;
    for (const re of TAKEAWAY_PATTERNS) {
      r = r.replace(re, "");
    }
    return r;
  }).join('\n');
}

// ─── 영유아 자녀 부적합 문장 제거 ─────────────────────────────────
// 1세 자녀에게 "밤 시간대에 깊이 있는 학습 배치" 같은 학령기 권고가 등장 시
// 그 문장만 통째 제거. 프롬프트에 "쓰지 마" 룰 추가 X — 후처리로만 처리.
// AgeStage가 infant·preschool일 때만 적용. 학령기 이상은 유지.

// 영유아·preschool에 부적합한 트리거 단어. 문장에 포함되면 그 문장 통째 제거.
// 패턴: [구두점·줄바꿈 아닌 문자]* + 트리거 + [구두점·줄바꿈 아닌 문자]* + 종결.
// 헤더 라인은 별도 보호.
const INFANT_INAPPROPRIATE_TRIGGERS = [
  // ── ch2 공부법·학습 시간대 권고 (학령기 권고)
  "학습\\s*스케[줄쥴]",
  "학습\\s*시간(대|에|이|은|을)",
  "공부\\s*시간(대|에|이|은|을)",
  "공부할\\s*시간",
  "집중력이?\\s*가장\\s*[좋잘]",
  "집중력이?\\s*[좋잘]아지",
  "공부\\s*환경",
  "학습\\s*환경",
  // ── ch3 칭찬·혼냄 (영유아 무관)
  "거짓말(을|이|은|의|에)",
  "친구와?\\s*비교",
  // ── ch4 친구 (영유아 친구 개념 X)
  "친구\\s*평판",
  "또래\\s*(사이|관계|평판)",
  "친구\\s*[관사][계이][에를을의]",
  "마음\\s*문[을이]\\s*여(는|시)",
  // ── ch5 진로·시기 추정 (영유아 무관)
  "(10|십|20|이십|30|삼십|40|사십)대[에후중]",
  "(10|20|30)대\\s*(후반|중반|초반)",
  "(중학|고등|대학|취업|결혼)\\s*(시기|무렵|때)",
  "직업\\s*추천",
  "직업\\s*분야",
  // ── ch3·5 사춘기 톤 (프롬프트 rule로 변환했지만 새는 케이스)
  "사춘기(가|에|의|를|는)",
];

const INFANT_INAPPROPRIATE_PATTERNS: RegExp[] = INFANT_INAPPROPRIATE_TRIGGERS.map(
  trigger => new RegExp(`[^.!?\\n]*?${trigger}[^.!?\\n]*?(?:[.!?]|다\\.|요\\.|니다\\.)\\s*`, "g"),
);

export function stripAgeInappropriate(
  text: string,
  ageStage: "infant" | "preschool" | "elementary" | "secondary",
): string {
  if (!text) return text;
  if (ageStage !== "infant" && ageStage !== "preschool") return text;
  return text.split('\n').map(line => {
    if (/^#{1,4}\s/.test(line)) return line; // 헤더 보호
    let r = line;
    for (const re of INFANT_INAPPROPRIATE_PATTERNS) {
      r = r.replace(re, "");
    }
    return r;
  }).join('\n');
}

// ─── 단일 부모 입력 시 부모 호칭 후처리 ─────────────────────────────
// 사용자가 엄마만 (또는 아빠만) 입력했는데 본문에 "어머님, 아버님" / "두 분이" /
// "부모님이 기억해야 할 한 가지" 같은 양친 호명이 등장하면 단일 부모 호칭으로 자동 치환.
// 프롬프트로 잡으면 룰 폭증·LLM 룰 위반 → 후처리에서 정규식으로 안전하게 처리.
// "부모님"·"어머님"·"아버님" 모두 받침 ㅁ 동일 → 조사 그대로 보존 가능. 비문 위험 0.
//
// "학부모님"·"조부모님" 같은 합성어는 lookbehind `(?<![가-힣])` 로 보호.
/**
 * @param hasMom 어머님 사주 입력 여부
 * @param hasDad 아버님 사주 입력 여부
 */
export function enforceParentVoice(text: string, hasMom: boolean, hasDad: boolean): string {
  if (!text) return text;
  // 양친 모두 입력 / 양친 모두 미입력 — 처리 X
  if (hasMom === hasDad) return text;
  const present = hasMom ? "어머님" : "아버님";  // 셋 다 받침 ㅁ → 조사 동일

  return text.split('\n').map(line => {
    // 마크다운 헤더 라인 보호
    if (/^#{1,4}\s/.test(line)) return line;
    let r = line;
    // ── "어머님, 아버님" / "아버님, 어머님" — 쉼표·중점·공백 변형 ──
    r = r.replace(/어머님\s*[,·]\s*아버님/g, present);
    r = r.replace(/아버님\s*[,·]\s*어머님/g, present);
    // ── "어머님과 아버님" / "아버님과 어머님" ──
    r = r.replace(/어머님과\s+아버님/g, present);
    r = r.replace(/아버님과\s+어머님/g, present);
    // ── "어머님 아버님" (공백만) — 같은 조사 뒤따를 때만 안전 ──
    r = r.replace(/어머님\s+아버님(께서는|께서|께|이|은|의|을|를|과|와|도)/g, present + "$1");
    r = r.replace(/아버님\s+어머님(께서는|께서|께|이|은|의|을|를|과|와|도)/g, present + "$1");
    // ── "두 분이" / "두 분께서" / "두 분의" 등 ──
    // 받침 있는 호칭으로 치환되므로 가→이, 는→은, 와→과 보정
    r = r.replace(/두\s*분(께서는|께서|께|이|은|의|을|를|과|와|도|에게|에서|만)/g, present + "$1");
    r = r.replace(/두\s*분\s*가/g, present + "이");
    r = r.replace(/두\s*분\s*는/g, present + "은");
    r = r.replace(/두\s*분\s*와/g, present + "과");
    // ── "두 분" 단독 (어절 경계) ──
    r = r.replace(/(?<![가-힣])두\s*분(?![가-힣께이은의을를과와도])/g, present);
    // ── "부모님" → 단일 부모 호칭 (받침 ㅁ 동일 → 조사 그대로 보존) ──
    // V2 자도인 prompt가 매 sub 마무리에 "부모님이 기억해야 할 한 가지는, …" 표준 고정구로 박혀 있음.
    // 양친 다 입력 시 보존(가드 if hasMom===hasDad 위에서 return). 단일 부모 시 그 부모 호칭으로 치환.
    // "학부모님"·"조부모님" 같은 합성어는 lookbehind 로 보호.
    r = r.replace(/(?<![가-힣])부모님/g, present);
    return r;
  }).join('\n');
}

/**
 * 모든 후처리 한 번에 적용 — 호출 순서:
 * 1. ensureChildHonorific (자녀 호칭)
 * 2. softenNegatives (부정 어휘)
 * 3. enforceHanjaBan (십성·합충 한자)
 * 4. enforceParentVoice (단일 부모 호칭) — hasMom·hasDad 제공 시
 * 5. enforceChartConsistency (차트-본문 정합) — seed 있을 때만
 * 6. enforceSixFactorTop3 (6요인 TOP3 swap 차단) — seed 있을 때만 (옵션 C)
 */
export function applyAllPostprocess(
  text: string,
  childName: string,
  childGender: string,
  seed: ChildSeed | null,
  parentFlags?: { hasMom: boolean; hasDad: boolean },
): string {
  if (!text) return text;
  let result = ensureChildHonorific(text, childName, childGender);
  result = softenNegatives(result);
  result = enforceHanjaBan(result);
  if (parentFlags) {
    result = enforceParentVoice(result, parentFlags.hasMom, parentFlags.hasDad);
  }
  if (seed) {
    result = enforceChartConsistency(result, seed);
    result = enforceSixFactorTop3(result, seed);
  }
  return result;
}
