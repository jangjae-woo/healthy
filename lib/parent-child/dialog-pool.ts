// 자도인 V2 — 가상 대사 풀
// 청월당 메커니즘 6 (가상 대사 삽입)의 자도인 적용
//
// 청월당 패턴: "왜 갑자기 화를 내지?" "에이, 기분이다!" 같은 한 줄 대사가 거의 모든 sub에 1개씩 박힘.
// 인자 풀이를 시나리오·드라마로 변환하는 가장 강력한 장치.
//
// 자도인 적용: ch3 훈육·ch5 빛남에 시그너처별 대사 풀 박음.
// LLM은 풀 안에서만 골라 씀. 즉흥 대사 생성 금지.

export type DialogCategory =
  // ch3 훈육 영역
  | "ch3_anger_inner"          // 화날 때 아이 내면 한 줄
  | "ch3_anger_parent_wrong"   // 도움 안 되는 부모 한 마디
  | "ch3_calm_inner"           // 가라앉을 때 아이 내면
  | "ch3_praise_phrase"        // 마음 열리는 칭찬 멘트
  | "ch3_lie_inner"            // 거짓말/고집 동기 아이 내면
  | "ch3_lie_parent_wrong"     // 추궁/막는 부모 한 마디
  | "ch3_lie_parent_open"      // 마음 여는 부모 한 마디
  | "ch3_breaking_words"       // 무너지는 자극 부모 멘트
  // ch5 빛남 영역
  | "ch5_field_misread"        // 진로 분야 어릴 때 오해 평판
  | "ch5_weapon_misread"       // 무기 어릴 때 오해 평판
  | "ch5_weapon_praise"        // 무기 친구/가족 평판
  | "ch5_environment_phrase"   // 빛나게 하는 인정 멘트
  | "ch5_mentor_phrase"        // 멘토가 해주는 한 마디

export const DIALOG_POOL: Record<DialogCategory, string[]> = {
  // ─────────────────────────── ch3 ───────────────────────────
  ch3_anger_inner: [
    "지금 표현하면 더 큰일 날 것 같아",
    "어떻게 말해야 할지 모르겠어",
    "말해도 어차피 안 들어줄 거야",
    "내가 잘못한 건가 싶어 헷갈려",
  ],
  ch3_anger_parent_wrong: [
    "왜 이제 와서 그래?",
    "작은 일에도 또 이래?",
    "그게 그렇게 화낼 일이야?",
    "엄마(아빠) 앞에서 그러는 거 아니야",
  ],
  ch3_calm_inner: [
    "혼자 있고 싶어",
    "지금은 아무 말도 듣고 싶지 않아",
    "잠깐만 시간을 줘",
  ],
  ch3_praise_phrase: [
    "네가 포기하지 않고 끝까지 해낸 그 부분",
    "네가 어떤 마음으로 했는지 엄마가 알아",
    "결과보다 그 과정을 본 게 더 기뻐",
    "오늘 네 마음이 어땠는지 듣고 싶어",
  ],
  ch3_lie_inner: [
    "혼나면 어떡하지",
    "엄마(아빠)가 실망하실까 봐",
    "지금은 그냥 넘어가고 싶어",
    "내 자유를 지키고 싶어",
  ],
  ch3_lie_parent_wrong: [
    "왜 거짓말해?",
    "솔직히 말 안 하면 더 혼나",
    "엄마(아빠)가 다 알고 있어",
  ],
  ch3_lie_parent_open: [
    "솔직하게 말하면 더 화 안 낼게",
    "왜 그랬는지 먼저 듣고 싶어",
    "엄마(아빠)도 어릴 때 그런 마음 든 적 있어",
  ],
  ch3_breaking_words: [
    "왜 너는 못해?",
    "다른 애들은 다 하는데",
    "빨리빨리 좀 해",
    "너는 왜 이런 애가 됐어",
    "형(언니)은 이렇게 했는데",
    "엄마(아빠)가 부끄러워",
  ],

  // ─────────────────────────── ch5 ───────────────────────────
  ch5_field_misread: [
    "걘 가만히 못 있어",
    "걘 한 가지에 너무 빠져",
    "걘 쓸데없는 데 시간을 써",
    "현실 감각이 좀 부족한 거 아니야",
  ],
  ch5_weapon_misread: [
    "고집이 세다",
    "융통성이 없다",
    "너무 무르다",
    "너무 느리다",
    "너무 진지하다",
  ],
  ch5_weapon_praise: [
    "걔는 약속 지켜",
    "걔는 분위기 만들어",
    "걔한테 말하면 해결돼",
    "걔는 끝까지 해",
    "걔는 마음을 알아줘",
  ],
  ch5_environment_phrase: [
    "네가 얼마나 애쓰는지 알고 있어",
    "네가 그 자리에 있어줘서 든든해",
    "오늘 네가 한 그 한 가지가 기억에 남아",
    "너만의 방식이 보기 좋아",
  ],
  ch5_mentor_phrase: [
    "네 결대로 가도 괜찮아",
    "너만 갈 수 있는 길이 있어",
    "지금은 헤매도 돼",
  ],
}

/**
 * 프롬프트에 박힐 대사 풀 룰 생성.
 * route.ts ch*Body 안 ${injectDialogPool("ch3_breaking_words", 1)} 형태로 호출.
 * @param category 대사 카테고리
 * @param insertCount 본문에 의무 삽입할 대사 수 (보통 1~2)
 */
export function injectDialogPool(category: DialogCategory, insertCount: number = 1): string {
  const pool = DIALOG_POOL[category]
  if (!pool || pool.length === 0) return ""
  const formatted = pool.map((d) => `- "${d}"`).join("\n")
  return `[가상 대사 풀 — ${category}]
다음 풀 안에서만 ${insertCount}개 골라 본문에 인용. 즉흥 대사 생성 절대 금지.
풀 외 새 대사 만들면 풀 안 항목과 톤·맥락이 일치하더라도 위반.

${formatted}

⚠️ 인용 시 따옴표("...") 그대로. 자녀에게 맞도록 약간 변주 가능하되 핵심 어휘는 보존.`
}
