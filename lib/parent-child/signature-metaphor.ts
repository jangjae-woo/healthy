// 자도인 V2 — 수미상관 핵심 비유 회로
// 청월당 메커니즘 10 (핵심 비유 회수 + 일회성 분리)의 자도인 적용
//
// 청월당 패턴: 1장에서 "큰 나무 + 맑은 물" 박음 → 8장 편지에서 "평생 푸르게 자라는 나무"로 회수
// 자도인 적용: 자녀 일간에서 결정론적으로 비유 1쌍 도출 → outro에서 의무 회수

export type Ilgan = "갑" | "을" | "병" | "정" | "무" | "기" | "경" | "신" | "임" | "계"

export const ILGAN_METAPHOR: Record<Ilgan, {
  intro: string   // ch1 IntroSummaryV2 컴포넌트가 도출하는 비유 (참고용 — 실제 도출은 컴포넌트)
  outroSeed: string  // outro 프롬프트에서 회수할 핵심 비유 토큰
  closingPhrase: string  // outro 마지막에 자연스럽게 박힐 비유 종결 어구
}> = {
  갑: {
    intro: "넓은 들판에 곧게 뻗은 큰 나무",
    outroSeed: "큰 나무",
    closingPhrase: "넓은 들판에 곧게 뻗어 평생 푸르게 자라는 큰 나무처럼",
  },
  을: {
    intro: "산기슭의 부드러운 풀잎",
    outroSeed: "풀잎",
    closingPhrase: "바람에 흔들려도 자리를 지키는 부드러운 풀잎처럼",
  },
  병: {
    intro: "한낮의 환한 햇살",
    outroSeed: "햇살",
    closingPhrase: "온 자리를 환히 비추는 한낮의 햇살처럼",
  },
  정: {
    intro: "어둠 속의 따뜻한 등불",
    outroSeed: "등불",
    closingPhrase: "어둠 속에서도 자기 빛을 잃지 않는 따뜻한 등불처럼",
  },
  무: {
    intro: "넓고 단단한 큰 산",
    outroSeed: "큰 산",
    closingPhrase: "흔들리지 않고 자기 자리를 지키는 큰 산처럼",
  },
  기: {
    intro: "씨앗을 품는 비옥한 텃밭",
    outroSeed: "텃밭",
    closingPhrase: "씨앗을 받아 품어 길러내는 비옥한 텃밭처럼",
  },
  경: {
    intro: "두드릴수록 단단해지는 무쇠",
    outroSeed: "무쇠",
    closingPhrase: "두드릴수록 단단해지는 무쇠처럼",
  },
  신: {
    intro: "한 점 흠 없이 다듬어진 보석",
    outroSeed: "보석",
    closingPhrase: "정성으로 다듬을수록 빛나는 한 점의 보석처럼",
  },
  임: {
    intro: "큰 바다처럼 깊은 물결",
    outroSeed: "큰 바다",
    closingPhrase: "어떤 그릇이든 받아 담는 큰 바다의 깊이처럼",
  },
  계: {
    intro: "세상 모든 자리에 스며드는 맑은 물",
    outroSeed: "맑은 물",
    closingPhrase: "자기 자리를 찾아 스며들어 자라게 하는 맑은 물처럼",
  },
}

/**
 * 일간에서 핵심 비유 1쌍 결정론 도출.
 * route.ts outroBody 안 ${injectCoreMetaphor(saju.ilgan)} 형태로 호출.
 */
export function injectCoreMetaphor(ilgan: Ilgan): string {
  const m = ILGAN_METAPHOR[ilgan]
  if (!m) {
    // 일간 미상 시 fallback
    return `[수미상관 핵심 비유] 자녀 일간에서 자연 비유 1쌍을 한 문장에 회수하여 마무리.`
  }
  return `[수미상관 핵심 비유 — outro 회수 의무]
1장 도입에서 자녀의 일간을 "${m.intro}" 류 자연물로 박았어요.
outro 마무리에 이 비유를 반드시 1회 회수하여 보고서 전체를 묶을 것.

회수 시드 토큰: "${m.outroSeed}"
권장 종결 어구 형태: "${m.closingPhrase} ${'${cnh}'}이 자라기를 바라요." 식으로 자연 변주.

⚠️ 시드 토큰("${m.outroSeed}")이 outro 본문에 최소 1회 등장 의무.
⚠️ 다른 자연물(예: 갑 일간인데 "바다"·"보석" 등) 사용 절대 금지 — 1장 비유와 톤 불일치 모순 발생.`
}

/**
 * 검수용: outro 본문 string이 핵심 비유 시드를 포함하는지 검사.
 * llm-output-guard에서 호출 (Session C에서 추가될 검수 회로).
 */
export function verifyMetaphorRecovery(ilgan: Ilgan, outroText: string): boolean {
  const seed = ILGAN_METAPHOR[ilgan]?.outroSeed
  if (!seed) return true // 일간 미상 fallback은 통과
  return outroText.includes(seed)
}
