// ════════════════════════════════════════════════════════════════════
// 8 변형 패턴 dispatcher
// sub 번호 → 변형 패턴 → 슬롯 순서 가이드
// B.txt 룰북 v2 IX 페이지 매핑 기반
// ════════════════════════════════════════════════════════════════════

export type VariantPattern =
  | "hooking"              // 후킹형 (sub01·08)
  | "standard"             // 표준형 (sub02·03·09·10·11·20)
  | "metaphor-emphasis"    // 비유 강조형 (sub19·21)
  | "timing"               // 시기형 (sub12·16·17·18)
  | "twist"                // 반전형 (sub04)
  | "contrast"             // 대비형 (sub05·06·07)
  | "warning"              // 경고형 (sub13·14·15)
  | "letter-with-hooking"; // 편지형 + 후킹 종합 (sub22)

export const SUB_VARIANT_MAP: Record<number, VariantPattern> = {
  1:  "hooking",
  2:  "standard",
  3:  "standard",
  4:  "twist",
  5:  "contrast",
  6:  "contrast",            // 매트릭스 백그라운드
  7:  "contrast",
  8:  "hooking",
  9:  "standard",
  10: "standard",
  11: "standard",            // 매트릭스 백그라운드
  12: "timing",              // 매트릭스 백그라운드
  13: "warning",
  14: "warning",
  15: "warning",
  16: "timing",
  17: "timing",
  18: "timing",
  19: "metaphor-emphasis",
  20: "standard",
  21: "metaphor-emphasis",   // 매트릭스 백그라운드
  22: "letter-with-hooking",
};

export const MATRIX_ACTIVE_SUBS = new Set([6, 11, 12, 21]);
export const CHARACTER_DIRECT_EXPOSURE_SUBS = new Set([1, 8, 22]);

export function getVariantInstruction(p: VariantPattern): string {
  switch (p) {
    case "hooking":
      return `[변형 패턴: 후킹형]
슬롯 순서:
  ① Lead — 캐릭터 매칭 단언 ("${"${name}"}님은 ○○상의 결을 가진 분이에요") + 캐릭터 내적 이미지 한 줄 부연
  ② 근거 — 캐릭터 매칭 1차 사주 인자(룰 10 캐스케이드 신호) + 보강 인자 자연 인용
  ③ 비유 — 캐릭터 내적 이미지에 어울리는 자연 비유 1개
  ④ 실생활 — 그 결이 일상에 켜지는 자리 2~3장면
  ⑤ 이면 — "다만 ~" 짧은 반전 (캐릭터의 다른 면)
  ⑥ Close — 캐릭터 결 재단언 + 다음 sub 미끼

※ 룰 10 적용 — Lead에 캐릭터 이름 직접 노출 (옥순/현숙/.../상철 중 1개).
※ 본문 그 외 위치엔 캐릭터 이름 반복 노출 X.`;

    case "standard":
      return `[변형 패턴: 표준형]
슬롯 순서:
  ① Lead → ② 근거 → ③ 비유 → ④ 실생활 → ⑤ 이면 → ⑥ Close

※ 룰 10 적용 — 캐릭터 이름 0회 노출.
※ 사주 인자(일간·식상·재성·관성·신살 등) 중심으로 풀이.`;

    case "metaphor-emphasis":
      return `[변형 패턴: 비유 강조형]
슬롯 순서:
  ① Lead → ③ 비유 (앞으로 끌어옴) → ② 근거 → ④ 실생활 → ⑥ Close

※ 비유를 앞으로 빼서 임팩트 강화.
※ ⑤ 이면 슬롯 생략 또는 ④에 짧게 흡수.
※ 캐릭터 이름 0회 노출.`;

    case "timing":
      return `[변형 패턴: 시기형]
슬롯 순서:
  ① Lead → ② 근거 → ②-b 시기 단언 → ④ 실생활 → ⑥ Close

※ ②-b 시기 단언 슬롯이 핵심 — 구체 月·세운·대운 인용.
※ ③ 비유는 약화하거나 ②-b 안에 짧게 흡수.
※ 시기 표현 예: "올해 5월", "내년 봄", "30대 초반 대운에", "다가오는 병오년에"
※ 60대 이후 대운 시기 인용 절대 X (사용자 정서 보호).
※ 캐릭터 이름 0회 노출.`;

    case "twist":
      return `[변형 패턴: 반전형]
슬롯 순서:
  ① Lead → ② 근거 (표면 결) → ②-c 이면 (반전 메인 격상) → ④ 두 결 대비 → ⑥ Close

※ ⑤ 이면 슬롯이 메인으로 격상 — 본문 비중 ④와 동등.
※ 두 갈래 대비 (예: "사랑 전 ${"${name}"}님" vs "사랑 후 ${"${name}"}님").
※ 캐릭터 이름 0회 노출.`;

    case "contrast":
      return `[변형 패턴: 대비형]
슬롯 순서:
  ① Lead → ②-A (A 결) → ②-B (B 결) → ④ 본인 어디 (단언) → ⑥ Close

※ A/B 대비, 또는 A/B/C 3분류 (sub07 자만추·인만추·결정사).
※ 두(세) 갈래 설명 후 본인 위치 단언이 핵심.
※ ③ 비유는 ②-A·②-B 안에 짧게 흡수 가능.
※ 캐릭터 이름 0회 노출.`;

    case "warning":
      return `[변형 패턴: 경고형]
슬롯 순서:
  ① Lead (위험 단언) → ② 근거 (위험 사주 메커니즘) → ④ 일상 함정 장면 → ⑤ 어떻게 벗어나나 (해법 슬롯) → ⑥ Close

※ ⑤ 해법 슬롯이 본문 비중 — ④와 동등.
※ ③ 비유 짧게 또는 흡수.
※ 톤 — 경고지만 차분. 겁주는 톤 X.
※ 캐릭터 이름 0회 노출.`;

    case "letter-with-hooking":
      return `[변형 패턴: 편지형 + 후킹 종합]
슬롯 순서 (두괄식 X):
  ① 시적 회상 도입 → ② 1~5장 결 회고 → ③ 두 캐릭터 종합 한 줄 → ④ 가슴에 새길 한 마디 → ⑤ 축복

※ 본인 캐릭터 + 짝꿍 캐릭터 두 이름 결합 한 줄 노출 (룰 10 종합 후킹).
※ 편지 톤 산문체. 박스·구분선 X.
※ 분량 500~600자.
※ 마지막 한 줄 = 처방 또는 예언으로 마무리.`;
  }
}

export function getVariantForSub(subId: number): VariantPattern {
  return SUB_VARIANT_MAP[subId] ?? "standard";
}
