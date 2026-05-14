// ⭐ V2.1.5 (2026-05-15) — 평생사주 인자 속성 회전 매트릭스
//
// 자도인 factor-attributes.ts의 평생사주판.
// 같은 인자가 15섹션마다 다른 도메인 속성으로만 작동.

import type { LifetimeSectionId } from "./lifetime-time-resolution";

export type LifetimeFactorId =
  | "비겁" | "식상" | "재성" | "관성" | "인성"
  | "일간" | "월지" | "일지" | "일주"
  | "신살_귀인" | "신살_흉" | "신강신약"
  | "대운" | "용신" | "기신" | "격국" | "공망" | "충" | "원진"
  | "과다_오행" | "약한_오행";

// Session A 범위: personality1·2만 매핑. 나머지 섹션은 후속 Session에서 확장.
export const LIFETIME_FACTOR_ATTRIBUTES: Partial<Record<LifetimeFactorId, Partial<Record<LifetimeSectionId, string>>>> = {
  비겁: {
    personality1: "자기 줏대·강한 십성의 마음 루틴 (메인 sub: personality1-3)",
    personality2: "독립형 추진력 — 휩쓸리지 않는 자기 결",
    money1: "돈을 붙잡는 자기 페이스·줏대 (메인 sub: money1-2)",
    money2: "조직과 독립 중 편한 자리 결정 (메인 sub: money2-2)",
    love1: "관계에서 편한 거리 — 자기 페이스 (메인 sub: love1-2)",
  },
  식상: {
    personality1: "표현·발산 마음 습관 (강한 십성 영역)",
    personality2: "자연스럽게 잘하는 일 — 안에서 밖으로 풀어내는 결 (메인 sub: personality2-1)",
    money1: "",
    money2: "발산형 일 환경 — 새 것 만드는 자리 (서브)",
    love1: "관계 표현 방식·거리감 형성 (메인 sub: love1-2)",
  },
  재성: {
    personality1: "현실 감각의 마음 루틴 (강한 십성 영역)",
    personality2: "결과를 가치로 전환하는 손길 (보조)",
    money1: "시기별 재산 흐름의 메인 근거 (메인 sub: money1-1, 대운+재성)",
    money2: "결과로 가치 전환되는 일 자리 (서브)",
    love1: "가까워지는 사람의 결 — 끌리는 타입 (메인 sub: love1-1, 일지+재성)",
  },
  관성: {
    personality1: "책임·기준의 마음 습관",
    personality2: "체계·약속 지키는 결 (서브)",
    money1: "돈 관리 책임·기준 (메인 sub: money1-2, 비겁+관성)",
    money2: "잘 맞는 일의 성향 — 체계·책임 자리 (메인 sub: money2-1, 월지+관성)",
    love1: "관계 약속·책임의 자리 (보조)",
  },
  인성: {
    personality1: "혼자 있을 때 받쳐주는 내면 독백 (메인 sub: personality1-2)",
    personality2: "배우고 흡수하는 결 — 정인 정통/편인 직관 갈래 (메인 sub: personality2-2)",
    money1: "",
    money2: "체계적 학습이 빛나는 일 환경 (보조)",
    love1: "관계에서 받아주는 결 — 따뜻함의 자리 (서브)",
  },
  일간: {
    personality1: "겉으로 보이는 나 — 첫인상·사회적 표정 (메인 sub: personality1-1, 일간+월지)",
    personality2: "자기 본질로 잘하는 자리 (서브, 식상+일간)",
    money1: "돈을 다루는 본질 결 (서브)",
    money2: "일 자리에서의 본질 결 (서브)",
    love1: "관계의 본질 결 (서브)",
  },
  월지: {
    personality1: "사회적 표정의 배경 — 환경 결 (메인 sub: personality1-1)",
    personality2: "",
    money1: "",
    money2: "잘 맞는 일의 환경 결 (메인 sub: money2-1, 월지+관성)",
    love1: "",
  },
  일지: {
    personality1: "혼자 있을 때 내면 독백의 배경 (메인 sub: personality1-2)",
    personality2: "",
    money1: "",
    money2: "",
    love1: "배우자궁 — 가까워지는 사람·오래가는 자리 (메인 sub: love1-1, love1-3)",
  },
  일주: {
    personality1: "기질·성향의 근본",
    personality2: "재능의 본질 결 (보조)",
    money1: "",
    money2: "",
    love1: "관계에서 보이는 본질 결 (보조)",
  },
  신살_귀인: {
    personality1: "",
    personality2: "",
    money1: "",
    money2: "",
    love1: "관계에 받쳐주는 길성 자리 (서브)",
  },
  신살_흉: {
    personality1: "",
    personality2: "",
    money1: "돈이 새는 자리 — 충·겁재 결합 (메인 sub: money1-3)",
    money2: "피해야 할 환경 — 결을 깎는 자극 (서브)",
    love1: "반복되는 관계 패턴 — 원진·충 (메인 sub: love1-4)",
  },
  신강신약: {
    personality1: "나를 움직이게 하는 기준 강도 (메인 sub: personality1-4, 신강신약+용신)",
    personality2: "재능 발현의 추진력 (서브)",
    money1: "돈 관리의 추진력·신중도 (서브)",
    money2: "일 추진력의 강도 (서브)",
    love1: "관계 거리감의 추진력 (서브)",
  },
  대운: {
    personality1: "",
    personality2: "",
    money1: "시기별 재산 흐름의 시간축 (메인 sub: money1-1)",
    money2: "직업으로 빛나는 시기 (메인 sub: money2-4, 대운+격국)",
    love1: "",
  },
  용신: {
    personality1: "결정 동기 — 약처럼 작용하는 기운 (메인 sub: personality1-4)",
    personality2: "재능 발현의 보조 기운 (서브)",
    money1: "현실 감각을 키우는 선택 — 행동 처방 (메인 sub: money1-4)",
    money2: "잘 맞는 일 자리의 보조 기운 (서브)",
    love1: "관계에서 받쳐주는 기운 (서브)",
  },
  기신: {
    personality1: "",
    personality2: "재능을 막는 습관 — 과다 오행과 결합 (메인 sub: personality2-4)",
    money1: "",
    money2: "피해야 할 일의 환경 — 결을 깎는 자극 (메인 sub: money2-3, 기신+약한 오행)",
    love1: "",
  },
  격국: {
    personality1: "",
    personality2: "일할 때 빛나는 환경 — 활약 무대 (메인 sub: personality2-3)",
    money1: "",
    money2: "직업으로 빛나는 시기의 결 (메인 sub: money2-4)",
    love1: "",
  },
  공망: {
    personality1: "",
    personality2: "",
    money1: "돈이 새는 빈자리 — 충+겁재와 결합 (메인 sub: money1-3)",
    money2: "",
    love1: "",
  },
  충: {
    personality1: "",
    personality2: "",
    money1: "돈이 새는 자극 — 겁재+충 (메인 sub: money1-3)",
    money2: "",
    love1: "관계 자극·흔들림 자리 (메인 sub: love1-4)",
  },
  원진: {
    personality1: "",
    personality2: "",
    money1: "",
    money2: "",
    love1: "반복되는 관계 오해 (메인 sub: love1-4, 원진+충)",
  },
  과다_오행: {
    personality1: "",
    personality2: "막힘 패턴의 근거 (메인 sub: personality2-4)",
    money1: "",
    money2: "",
    love1: "",
  },
  약한_오행: {
    personality1: "",
    personality2: "",
    money1: "",
    money2: "피해야 할 환경의 근거 (기신+약한 오행)",
    love1: "",
  },
};

export function injectLifetimeFactorAttribute(factor: LifetimeFactorId, section: LifetimeSectionId): string {
  const attr = LIFETIME_FACTOR_ATTRIBUTES[factor]?.[section];
  if (!attr) {
    return `[인자 속성 매트릭스] ${factor}은(는) 본 섹션(${section})에서 직접 노출 금지 인자. 다른 인자 사용.`;
  }
  return `[인자 속성 매트릭스 — ${factor}의 ${section} 영역 작동 속성]
${attr}

→ 위 속성만 본문에 표현. 다른 섹션 영역 속성으로 풀이 침범 절대 X.`;
}
