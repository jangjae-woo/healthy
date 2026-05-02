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
];

/**
 * 십성·합충 한자 자동 제거.
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
 * 모든 후처리 한 번에 적용 — 호출 순서:
 * 1. ensureChildHonorific (자녀 호칭)
 * 2. softenNegatives (부정 어휘)
 * 3. enforceHanjaBan (십성·합충 한자)
 * 4. enforceChartConsistency (차트-본문 정합) — seed 있을 때만
 */
export function applyAllPostprocess(
  text: string,
  childName: string,
  childGender: string,
  seed: ChildSeed | null,
): string {
  if (!text) return text;
  let result = ensureChildHonorific(text, childName, childGender);
  result = softenNegatives(result);
  result = enforceHanjaBan(result);
  if (seed) result = enforceChartConsistency(result, seed);
  return result;
}
