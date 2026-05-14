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
  },
  식상: {
    personality1: "표현·발산 마음 습관 (강한 십성 영역)",
    personality2: "자연스럽게 잘하는 일 — 안에서 밖으로 풀어내는 결 (메인 sub: personality2-1)",
  },
  재성: {
    personality1: "현실 감각의 마음 루틴 (강한 십성 영역)",
    personality2: "결과를 가치로 전환하는 손길 (보조)",
  },
  관성: {
    personality1: "책임·기준의 마음 습관",
    personality2: "체계·약속 지키는 결 (서브)",
  },
  인성: {
    personality1: "혼자 있을 때 받쳐주는 내면 독백 (메인 sub: personality1-2)",
    personality2: "배우고 흡수하는 결 — 정인 정통/편인 직관 갈래 (메인 sub: personality2-2)",
  },
  일간: {
    personality1: "겉으로 보이는 나 — 첫인상·사회적 표정 (메인 sub: personality1-1, 일간+월지)",
    personality2: "자기 본질로 잘하는 자리 (서브, 식상+일간)",
  },
  월지: {
    personality1: "사회적 표정의 배경 — 환경 결 (메인 sub: personality1-1)",
    personality2: "",
  },
  일지: {
    personality1: "혼자 있을 때 내면 독백의 배경 (메인 sub: personality1-2)",
    personality2: "",
  },
  일주: {
    personality1: "기질·성향의 근본",
    personality2: "재능의 본질 결 (보조)",
  },
  신강신약: {
    personality1: "나를 움직이게 하는 기준 강도 (메인 sub: personality1-4, 신강신약+용신)",
    personality2: "재능 발현의 추진력 (서브)",
  },
  용신: {
    personality1: "결정 동기 — 약처럼 작용하는 기운 (메인 sub: personality1-4)",
    personality2: "재능 발현의 보조 기운 (서브)",
  },
  격국: {
    personality1: "",
    personality2: "일할 때 빛나는 환경 — 활약 무대 (메인 sub: personality2-3)",
  },
  기신: {
    personality1: "",
    personality2: "재능을 막는 습관 — 과다 오행과 결합 (메인 sub: personality2-4)",
  },
  과다_오행: {
    personality1: "",
    personality2: "막힘 패턴의 근거 (메인 sub: personality2-4)",
  },
  // 나머지 인자(약한_오행·신살_*·대운·공망·충·원진)는 Session B 이후 확장
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
