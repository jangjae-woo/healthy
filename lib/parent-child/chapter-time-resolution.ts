// 자도인 V2 — 챕터별 시간 해상도 매트릭스
// 청월당 메커니즘 9 (시간 해상도 변주)의 자도인 적용
// 같은 인자가 챕터마다 다른 시간 단위로 작동 → 시점 모순 자체 차단

export type ChapterId = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "ch7" | "outro"

export const CHAPTER_TIME_RESOLUTION: Record<ChapterId, {
  unit: string           // 본문에 노출 가능한 시간 단위
  forbidden: string[]    // 본문에 절대 노출 금지인 시간 단위
  promptInstruction: string  // 프롬프트에 박힐 1줄 룰
}> = {
  ch1: {
    unit: "본질 (시점 없음)",
    forbidden: ["연도", "세운", "대운", "10대·20대·30대", "사춘기 N세"],
    promptInstruction: "본 챕터는 자녀의 본질·정체성 영역. 어떤 시간 단위도 본문에 노출 X — 시점 무관한 본질 묘사만.",
  },
  ch2: {
    unit: "하루 단위 (새벽·아침·정오·오후·저녁·밤)",
    forbidden: ["연도", "세운", "대운", "○○세", "사춘기"],
    promptInstruction: "본 챕터는 학습·집중 영역. 시간 단위는 '하루' 안에 한정. 새벽·아침·정오·오후·저녁·밤 단위로만 본문 노출. 연·월·세운·대운·연령 단언 절대 금지.",
  },
  ch3: {
    unit: "시점 없음 (반복 패턴·일상 누적)",
    forbidden: ["연도", "세운", "대운", "○○세", "사춘기", "○개월 후", "하루 중 시간대"],
    promptInstruction: "본 챕터는 훈육·감정·환경 영역. 어떤 구체 시간 단위도 본문에 노출 X. 반복 패턴·일상 누적·평소·자주 같은 무시점 어휘만.",
  },
  ch4: {
    unit: "시기·학기·1년 단위 (캠프·수련회·1년쯤 지켜본 후 같은 묶음)",
    forbidden: ["○○세 단언", "세운 발동", "대운", "하루 중 시간대"],
    promptInstruction: "본 챕터는 친구 관계 영역. 시간 단위는 '학기·1년·캠프·수련회' 같은 묶음 단위. 일·세운·대운·구체 연령 단언 금지.",
  },
  ch5: {
    unit: "대운 (10년 단위, 연령대 — 10대·20대·30대)",
    forbidden: ["하루 중 시간대", "○개월 후", "구체 연도"],
    promptInstruction: "본 챕터는 진로·빛나는 자리 영역. 시간 단위는 '10년 단위·연령대(10대·20대·30대·40대)'. 하루 시간대·○개월 같은 짧은 단위 노출 X.",
  },
  ch6: {
    unit: "한 장면 (시점 없음 — 가족 사진 같은 정지된 순간)",
    forbidden: ["연도", "세운", "대운", "○○세", "사춘기", "하루 중 시간대 단언"],
    promptInstruction: "본 챕터는 부모-자녀 가족 영역. 한 장면을 정지된 순간처럼 묘사. 연·세운·대운·연령 단언 X. 단 '저녁 식탁·아침 식탁' 같은 일상 의례 어휘는 어머님/아버님 어휘 풀 안에서 허용.",
  },
  ch7: {
    unit: "시점 없음 (체질·음식 — 일상 의례 어휘 허용)",
    forbidden: ["연도", "세운", "대운", "○○세", "사춘기"],
    promptInstruction: "본 챕터는 자녀 몸의 결과 보완 음식 영역. 연도·세운·대운·연령 단언 X. 단 '아침·저녁·환절기·계절' 같은 일상 단위는 허용 (예: '환절기 무렵 배숙 한 그릇'). 의학 진단 어휘 X — '사주적으로 옅게 타고난 자리·채워주는 결' 어조.",
  },
  outro: {
    unit: "시점 없음 (시적 종합)",
    forbidden: ["연도", "세운", "대운", "○○세", "사춘기", "○개월"],
    promptInstruction: "outro는 시적 종합·핵심 비유 회수. 어떤 시간 단위도 본문에 노출 X.",
  },
}

/**
 * 프롬프트에 박힐 시간 해상도 룰 한 블록 생성.
 * route.ts의 ch*Body 안 ${injectTimeResolution("ch3")} 형태로 호출.
 */
export function injectTimeResolution(chapterId: ChapterId): string {
  const cfg = CHAPTER_TIME_RESOLUTION[chapterId]
  return `[시간 해상도 — 본 챕터 시간 단위]
${cfg.promptInstruction}
허용 단위: ${cfg.unit}
금지 단위(본문 노출 절대 X): ${cfg.forbidden.join(", ")}`
}
