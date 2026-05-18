// LLM 출력 검증 (Phase 5)
//
// 검증 항목:
//   1. 헤더 매칭 키 누락
//   2. 금지 톤 (양육 행동 단정·V2 시그너처·일상 호칭)
//   3. 자녀 호칭 위반 (수민이는·엄마가)
//   4. 분량 위반 (±20% 허용)
//
// 위반 시 retry 트리거 (Phase 6에서 호출)
//
// 작성: 2026-05-17

// ─── 금지 표현 정규식 ───
const FORBIDDEN_PATTERNS = [
  { regex: /어머님은\s+[^.]*분입니다/, label: '양육 행동 단정 (어머님은 ~분입니다)' },
  { regex: /아버님은\s+[^.]*분입니다/, label: '양육 행동 단정 (아버님은 ~분입니다)' },
  { regex: /기억해야\s*할\s*한\s*가지/, label: 'V2 시그너처 (기억해야 할 한 가지)' },
  { regex: /자도인이\s*바라보매/, label: 'V2 시그너처 (자도인이 바라보매)' },
  { regex: /결이\s*변하는\s*시기/, label: 'V2 표현 (결이 변하는 시기)' },
  { regex: /엄마가\s/, label: '일상 호칭 (엄마가)' },
  { regex: /아빠가\s/, label: '일상 호칭 (아빠가)' },
  { regex: /\*\*[^*]+\*\*/, label: '강조 마크다운 (**굵게**)' },
  { regex: /\*[가-힣][^*]*\*/, label: '강조 마크다운 (*기울임*)' },
  // 부모 6축 점수 노출 X (룰)
  { regex: /온기\s*\d+점/, label: '부모 6축 점수 노출 (온기 ~점)' },
  { regex: /중심\s*\d+점/, label: '부모 6축 점수 노출 (중심 ~점)' },
  { regex: /일관\s*\d+점/, label: '부모 6축 점수 노출 (일관 ~점)' },
  { regex: /자율\s*\d+점/, label: '부모 6축 점수 노출 (자율 ~점)' },
  { regex: /표현\s*\d+점/, label: '부모 6축 점수 노출 (표현 ~점)' },
  { regex: /바람\s*\d+점/, label: '부모 6축 점수 노출 (바람 ~점)' },
];

// ─── 자녀 호칭 검증 ───
function checkChildTitle(text, childName, childTitle) {
  const violations = [];
  // 자녀 이름 단독 사용 (호칭 빠짐) 검출
  // 예: "수민이는" "수민은" — 호칭 양/군 없이 일상 호칭
  const ilsangPattern = new RegExp(`${childName}이?(는|가|를|을|이|와|과|에게|한테)\\s`, 'g');
  const ilsangMatches = [...text.matchAll(ilsangPattern)];
  for (const m of ilsangMatches) {
    violations.push({ type: 'child_title_ilsang', match: m[0], position: m.index });
  }
  return violations;
}

// ─── 분량 검증 ───
const SECTION_LENGTH_RULES = {
  '1장 — 본질결/일간이 알려주는 결':     { min: 160, max: 360 },  // 200~300자 ±20%
  '1장 — 본질결/일주 60갑자':            { min: 160, max: 360 },
  '2장 — 활기/결 한눈에':                { min: 60,  max: 180 },  // 80~120자
  '2장 — 활기/왜 이런 결인가':           { min: 80,  max: 180 },
  '2장 — 활기/양육 Tip':                 { min: 360, max: 900 },
  '3장 — 조심/결 한눈에':                { min: 60,  max: 180 },
  '3장 — 조심/왜 이런 결인가':           { min: 80,  max: 180 },
  '3장 — 조심/양육 Tip':                 { min: 360, max: 900 },
  '4장 — 만족/결 한눈에':                { min: 60,  max: 180 },
  '4장 — 만족/왜 이런 결인가':           { min: 80,  max: 180 },
  '4장 — 만족/양육 Tip':                 { min: 360, max: 900 },
  '5장 — 흔들림/결 한눈에':              { min: 60,  max: 180 },
  '5장 — 흔들림/왜 이런 결인가':         { min: 80,  max: 180 },
  '5장 — 흔들림/양육 Tip':               { min: 360, max: 900 },
  '6장 — 어울림/결 한눈에':              { min: 60,  max: 180 },
  '6장 — 어울림/왜 이런 결인가':         { min: 80,  max: 180 },
  '6장 — 어울림/양육 Tip':               { min: 360, max: 900 },
  '7장 — 끈기/결 한눈에':                { min: 60,  max: 180 },
  '7장 — 끈기/왜 이런 결인가':           { min: 80,  max: 180 },
  '7장 — 끈기/양육 Tip':                 { min: 360, max: 900 },
  '9장 — 어머님 사주의 결':              { min: 160, max: 300 },
  '10장 — 아버님 사주의 결':             { min: 160, max: 300 },
  '자도인의 마지막 당부':                { min: 320, max: 600 },
};

function checkLength(sections) {
  const violations = [];
  for (const [key, rule] of Object.entries(SECTION_LENGTH_RULES)) {
    const text = sections[key];
    if (!text) continue;  // 누락은 헤더 검증에서 처리
    const len = text.length;
    if (len < rule.min) violations.push({ key, len, expected: `>= ${rule.min}`, type: 'too_short' });
    if (len > rule.max) violations.push({ key, len, expected: `<= ${rule.max}`, type: 'too_long' });
  }
  return violations;
}

// ─── 메인 검증 함수 ───
export function validateLLMOutput(parsed, facts) {
  const violations = [];

  // 1. 헤더 누락 검증
  for (const missing of parsed.missingHeaders) {
    // 부모 1명만 입력 시 누락 가능한 헤더 화이트리스트
    if (!facts.meta.hasMother && missing.includes('어머님')) continue;
    if (!facts.meta.hasFather && missing.includes('아버님')) continue;
    violations.push({ category: 'missing_header', detail: missing });
  }

  // 2. 금지 표현 검증
  for (const f of FORBIDDEN_PATTERNS) {
    const m = parsed.raw.match(f.regex);
    if (m) violations.push({ category: 'forbidden_phrase', detail: f.label, match: m[0] });
  }

  // 3. 자녀 호칭 검증
  const titleViolations = checkChildTitle(parsed.raw, facts.child.name, facts.child.title);
  for (const v of titleViolations) {
    violations.push({ category: 'child_title', detail: '자녀 이름 단독 사용 (호칭 누락)', match: v.match });
  }

  // 4. 분량 검증
  const lenViolations = checkLength(parsed.sections);
  for (const v of lenViolations) {
    violations.push({ category: 'length', detail: `${v.key}: ${v.len}자 (${v.expected})`, type: v.type });
  }

  return {
    valid: violations.length === 0,
    violations,
    summary: {
      missingHeaderCount: violations.filter(v => v.category === 'missing_header').length,
      forbiddenCount: violations.filter(v => v.category === 'forbidden_phrase').length,
      titleViolationCount: violations.filter(v => v.category === 'child_title').length,
      lengthViolationCount: violations.filter(v => v.category === 'length').length,
    },
  };
}
