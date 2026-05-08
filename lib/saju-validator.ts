// ════════════════════════════════════════════════════════════════════
// 사주 풀이 출력 검증기
// LLM 출력이 룰 따랐는지 코드로 체크 → 룰 위반 시 1회 retry로 재요청.
// 환각률 5% → 1%대로 낮추는 안전망. 평균 비용 5~10% 케이스만 retry라 거의 안 늘음.
// ════════════════════════════════════════════════════════════════════

export interface SajuValidationOptions {
  /** 사주 인자 명사 최소 노출 개수 (식상·재성·관성·비겁·인성·일간·일주·용신·기신·격국·신살명 등) */
  minSajuTerms?: number;
  /** 본문 글자수 [최소, 최대] (공백 제외). 0이면 검증 X */
  charLength?: [number, number] | null;
  /** 본문에 반드시 포함돼야 할 도미넌트 키워드 (자녀 사주 산출값) */
  mustInclude?: string[];
  /** 본문에 절대 등장 금지 (바넘 표현·금지어) */
  mustNotInclude?: string[];
  /** 본인 코드 산출 정설 룩업값 — 그대로 인용 의무. 임의 다른 값 등장 시 위반 */
  deterministicValues?: {
    /** 12운성 산출값 (예: "쇠"). 본문에 다른 12운성 단계 등장 시 환각 */
    unseongStage?: string;
    /** 격국명 (예: "정관격") */
    gyeokgukName?: string;
    /** 일간 강약 단계 (예: "신강") */
    shinkangLevel?: string;
  };
}

const DEFAULT_SAJU_TERMS = [
  "식상", "재성", "관성", "비겁", "인성",
  "일간", "일주", "월지", "일지",
  "용신", "기신", "격국",
  "식신", "상관", "정재", "편재", "정관", "편관", "정인", "편인", "비견", "겁재",
];

const DEFAULT_BAREUM_PATTERNS = [
  "특별한 사람", "특별한 아이",
  "감수성이 풍부", "감수성 풍부",
  "사랑받을 만한",
  "누구나 ", "누구든지",
  "당신은 좋은 사람",
  "매력적이다", "매력적인",
  "신비로운", "신비롭다",
  "운명적이다",
];

const ALL_UNSEONG_STAGES = [
  "장생", "목욕", "관대", "건록", "제왕",
  "쇠", "병", "사", "묘", "절", "태", "양",
];

const ALL_GYEOKGUK_NAMES = [
  "비견격", "건록격", "양인격",
  "식신격", "상관격",
  "정재격", "편재격",
  "정관격", "편관격",
  "정인격", "편인격",
];

const ALL_SHINKANG_LEVELS = [
  "극약", "태약", "신약", "중화", "신강", "태강", "극왕",
];

/**
 * 출력 본문 검증. 위반 항목 배열 반환. 빈 배열이면 통과.
 */
export function validateSajuOutput(
  text: string,
  opts: SajuValidationOptions = {}
): string[] {
  const violations: string[] = [];
  if (!text || typeof text !== "string") {
    violations.push("출력 비어있음");
    return violations;
  }

  // 1. 사주 인자 명사 최소 노출
  if (opts.minSajuTerms && opts.minSajuTerms > 0) {
    const matched = DEFAULT_SAJU_TERMS.filter(t => text.includes(t)).length;
    if (matched < opts.minSajuTerms) {
      violations.push(`사주 인자 명사 ${matched}/${opts.minSajuTerms}개 노출 (최소 ${opts.minSajuTerms}개 필요)`);
    }
  }

  // 2. 분량
  if (opts.charLength) {
    const len = text.replace(/\s/g, "").length;
    const [min, max] = opts.charLength;
    if (len < min) violations.push(`분량 ${len}자 (최소 ${min}자 필요)`);
    if (len > max) violations.push(`분량 ${len}자 (최대 ${max}자 초과)`);
  }

  // 3. 도미넌트 키워드 필수 포함
  if (opts.mustInclude && opts.mustInclude.length > 0) {
    for (const kw of opts.mustInclude) {
      if (!text.includes(kw)) {
        violations.push(`필수 키워드 "${kw}" 본문 누락`);
      }
    }
  }

  // 4. 금지어 (바넘 표현 등)
  const banList = [...DEFAULT_BAREUM_PATTERNS, ...(opts.mustNotInclude ?? [])];
  for (const banned of banList) {
    if (text.includes(banned)) {
      violations.push(`바넘·금지 표현 "${banned}" 사용`);
    }
  }

  // 5. 정설 룩업값 일관성 — 본문에 다른 단계가 등장하면 환각
  const det = opts.deterministicValues;
  if (det) {
    if (det.unseongStage) {
      const wrongStages = ALL_UNSEONG_STAGES.filter(
        s => s !== det.unseongStage && text.includes(s),
      );
      if (wrongStages.length > 0) {
        violations.push(`12운성 환각 — 산출값 "${det.unseongStage}" 외에 "${wrongStages.join("·")}" 본문 등장`);
      }
    }
    if (det.gyeokgukName) {
      const wrongGyeok = ALL_GYEOKGUK_NAMES.filter(
        n => n !== det.gyeokgukName && text.includes(n),
      );
      if (wrongGyeok.length > 0) {
        violations.push(`격국 환각 — 산출값 "${det.gyeokgukName}" 외에 "${wrongGyeok.join("·")}" 본문 등장`);
      }
    }
    if (det.shinkangLevel) {
      const wrongLevels = ALL_SHINKANG_LEVELS.filter(
        l => l !== det.shinkangLevel && text.includes(l),
      );
      if (wrongLevels.length > 0) {
        violations.push(`신강신약 환각 — 산출값 "${det.shinkangLevel}" 외에 "${wrongLevels.join("·")}" 본문 등장`);
      }
    }
  }

  return violations;
}

/**
 * 위반 항목 배열을 LLM 재요청용 prompt 추가 텍스트로 변환.
 */
export function violationsToRetryPrompt(violations: string[]): string {
  if (violations.length === 0) return "";
  return `\n\n[★ 이전 출력이 다음 룰을 위반함. 반드시 수정해서 다시 작성:]\n${violations.map(v => `- ${v}`).join("\n")}\n\n위 위반 항목을 모두 고쳐서 본문 전체 재작성하세요. 헤더(## ### )는 그대로 유지.`;
}
