// 자도인 V2.1 — 오행 ↔ 신체 부위 사전
//
// ch7 sub1 "이 아이가 약하게 타고난 자리"에서 사용.
// 자녀의 약한 오행을 기준으로 약한 신체 부위 도출 → 본문 자연 인용.
// 의학 진단 아님 — 사주명리학 관점의 신체 결 표현.

export type Element = "목" | "화" | "토" | "금" | "수"

/**
 * 오행별 관련 신체 부위 (사주명리 전통).
 * 약한 오행 = 그 오행 관련 부위가 사주적으로 옅게 타고난 자리.
 */
export const ELEMENT_TO_BODY: Record<Element, {
  organs: string[]      // 장기·기관
  externals: string[]   // 외부·기능
  natureMetaphor: string  // 자연 비유 (4단 연결용)
  dailySigns: string[]    // 일상에 드러나는 신호
}> = {
  목: {
    organs: ["간", "담"],
    externals: ["근육", "신경", "시력·눈"],
    natureMetaphor: "뿌리내릴 자리가 옅으면 자라려는 결도 흔들리기 쉬워요",
    dailySigns: [
      "쉽게 짜증이 나거나 작은 자극에도 신경이 곤두서는 결",
      "장시간 집중 후 눈이 빨리 피곤해지는 결",
      "근육 긴장이 자주 도는 결",
    ],
  },
  화: {
    organs: ["심장", "소장"],
    externals: ["혈관", "정신·정서", "혀"],
    natureMetaphor: "차가운 그릇에 온기가 닿지 않으면 자리가 따뜻해지지 못해요",
    dailySigns: [
      "잠들기 전에 가슴이 두근거리거나 잠이 깊지 않은 결",
      "감정 기복이 가까이서 느껴지는 결",
      "쉽게 흥분하거나 반대로 깊이 가라앉는 결",
    ],
  },
  토: {
    organs: ["비장", "위"],
    externals: ["소화", "피부", "입"],
    natureMetaphor: "뿌리 잡을 흙이 얇으면 음식이 머무를 자리도 옅어져요",
    dailySigns: [
      "체하거나 배앓이를 자주 하는 결",
      "단 음식·차가운 음식에 위가 빨리 반응하는 결",
      "피부가 예민해지기 쉬운 결",
    ],
  },
  금: {
    organs: ["폐", "대장"],
    externals: ["기관지", "뼈", "피부 보호막", "코"],
    natureMetaphor: "다듬어지지 않은 결은 외부 자극에 더 쉽게 흔들려요",
    dailySigns: [
      "환절기에 코나 목이 먼저 반응하는 결",
      "기침이 길게 가는 결",
      "잔병치레가 잦은 결",
    ],
  },
  수: {
    organs: ["신장", "방광"],
    externals: ["뼈·치아", "귀", "수분 균형"],
    natureMetaphor: "마른 자리에는 새 결이 깊이 내려가지 못해요",
    dailySigns: [
      "감기가 들면 귀나 코가 먼저 반응하는 결",
      "잠을 충분히 자도 피로가 깊이 남는 결",
      "찬 기운에 빨리 식어버리는 결",
    ],
  },
}

/**
 * 일간 오행 + 약한 오행 결합으로 자녀 신체 약점 자리 도출 (참고용).
 * 실제 본문에는 본 풀에서 LLM이 자녀 사주 데이터 기반으로 골라 사용.
 */
export function getBodyAreaByElement(weakest: Element) {
  return ELEMENT_TO_BODY[weakest]
}

/**
 * 프롬프트에 박힐 신체 부위 풀 룰 생성.
 * route.ts ch7Body 안 ${injectBodyPool()} 형태로 호출.
 */
export function injectBodyPool(): string {
  const allElements: Element[] = ["목", "화", "토", "금", "수"]
  const lines = allElements.map((el) => {
    const info = ELEMENT_TO_BODY[el]
    return `[${el} 약함 시 자리]
  장기: ${info.organs.join(" · ")}
  외부: ${info.externals.join(" · ")}
  자연 비유: "${info.natureMetaphor}"
  일상 신호 풀:
${info.dailySigns.map((s) => `    - "${s}"`).join("\n")}`
  }).join("\n\n")

  return `[신체 부위 풀 — 자녀 약한 오행에 해당하는 자리]
자녀 사주에서 가장 약한 오행을 기준으로 아래 풀에서 자리·신호 인용. 즉흥 부위 생성 X.
의학 진단 아님 — "사주적으로 옅게 타고난 자리" 어조로.

${lines}

⚠️ 사주에 약한 오행이 2개 이상이면 더 약한 1개만 본문 노출 (중복 회피).
⚠️ 신체 부위 본문 노출 1~2개로 제한 — 부위 나열식 금지. 일상 신호 1개를 자연 비유와 함께.`
}
