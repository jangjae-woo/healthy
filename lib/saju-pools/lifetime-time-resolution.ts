// ⭐ V2.1.5 (2026-05-15) — 평생사주 섹션별 시간 해상도 매트릭스
//
// 자도인 chapter-time-resolution.ts의 평생사주판.
// 평생사주는 시간이 4층(나이대·대운·세운·일운). 섹션마다 어느 단위를 본문에 노출할지 분배.

export type LifetimeSectionId =
  | "personality1" | "personality2"
  | "money1" | "money2"
  | "love1" | "love2" | "love3"
  | "health" | "hidden"
  | "timeline1" | "timeline2"
  | "compass" | "closing";

export const LIFETIME_TIME_RESOLUTION: Record<LifetimeSectionId, {
  unit: string;
  forbidden: string[];
  promptInstruction: string;
}> = {
  personality1: {
    unit: "본질·기질 (시점 없음 — 인생 무관 본인 결)",
    forbidden: ["연도", "세운", "대운", "○○세", "올해", "내년"],
    promptInstruction: "본 섹션은 본인 기질·정체성. 시간 단위 본문 노출 X. 시점 무관한 본질 묘사만.",
  },
  personality2: {
    unit: "재능 발현 자리 (시점 없음 — 어디서든 통하는 결)",
    forbidden: ["연도", "세운", "대운", "○○세", "올해", "내년"],
    promptInstruction: "본 섹션은 재능 방향. 시간 단위 본문 노출 X. 어디서·언제든 통하는 본인 결만.",
  },
  money1: {
    unit: "재산 시기 흐름 (대운 단위만 — 1번 sub 한정)",
    forbidden: ["○○년 ○월", "구체 일자"],
    promptInstruction: "본 섹션은 돈·현실. 시기 흐름은 sub 1(시기별 재산 흐름)에서만 대운 단위로 본문 노출. 나머지 sub는 시점 무관.",
  },
  money2: {
    unit: "커리어 대운 (10년 단위)",
    forbidden: ["○○년 ○월", "구체 일자"],
    promptInstruction: "본 섹션은 일·직업. 커리어 시기는 sub 4(직업으로 빛나는 시기)에서만 대운 단위. 나머지 sub는 시점 무관.",
  },
  love1: {
    unit: "관계 거리·일상 패턴 (시점 없음 — 단정 X)",
    forbidden: ["○○세 결혼", "결혼 단정", "이혼 단정"],
    promptInstruction: "본 섹션은 사람·인연. 결혼·이혼 단정 X. 시점 무관한 거리감·태도 묘사. 미혼·이혼·사별·결혼 유지 모든 케이스 가능 조건 어조.",
  },
  love2: {
    unit: "연애 일상 (시점 무관)",
    forbidden: ["○○년 결혼", "결혼 단정"],
    promptInstruction: "본 섹션은 연애 결 세부. 결혼 단정 X. 시점 무관한 연애 패턴만. 곁의 사람 있는 경우도 조건 어조.",
  },
  love3: {
    unit: "결혼 인연 시기 (대운 단위, 단정 X)",
    forbidden: ["○○년 ○월 결혼", "이때 결혼해야", "가장 좋습니다"],
    promptInstruction: "본 섹션은 인연 시기·귀인. 결혼 시기는 부드러운 표현, 단정 X. 이미 결혼한 분에게도 어색하지 않게 양방향 해석.",
  },
  health: {
    unit: "회복 리듬 (시점 무관 — 일상 단위)",
    forbidden: ["연도", "세운", "○○세 병", "구체 일자"],
    promptInstruction: "본 섹션은 몸·마음 리듬. 시간 단위 본문 노출 X. 일상 회복 리듬·생활 패턴만. 의료 진단 어조 절대 X.",
  },
  hidden: {
    unit: "반복 패턴 (시점 없음 — 누적 무드)",
    forbidden: ["연도", "세운", "○○세"],
    promptInstruction: "본 섹션은 반복 패턴·신살. 시간 단위 본문 노출 X. 누적 무드·반복 습관만. 공포 조장 어조 X.",
  },
  timeline1: {
    unit: "대운(10년) + 세운(올해) + 향후 3~4년",
    forbidden: ["○○년 ○월 ○일"],
    promptInstruction: "본 섹션은 시기 흐름. 대운·세운·향후 3~4년 본문 노출 OK. 단 날짜 확정 예언 X — 흐름·준비 방향으로.",
  },
  timeline2: {
    unit: "5년 세운 (연도 단위)",
    forbidden: ["○○년 ○월 ○일 확정"],
    promptInstruction: "본 섹션은 5년 흐름. 연도별 세운 본문 노출 OK. 상반기/하반기 구분 가능. 단 사건 확정 X.",
  },
  compass: {
    unit: "종합 (시점 없음 — 평생 선택 기준)",
    forbidden: ["연도", "세운", "○○세"],
    promptInstruction: "본 섹션은 평생 가져갈 선택 기준 종합. 시간 단위 본문 노출 X. 평생 무관 본인 결만.",
  },
  closing: {
    unit: "시점 없음 (시적 마무리)",
    forbidden: ["연도", "세운", "○○세"],
    promptInstruction: "본 섹션은 묵도인 마지막 당부. 시간 단위 본문 노출 X. 시적 종합·자연 비유로 마무리.",
  },
};

export function injectLifetimeTimeResolution(section: LifetimeSectionId): string {
  const cfg = LIFETIME_TIME_RESOLUTION[section];
  if (!cfg) return "";
  return `[시간 해상도 — 본 섹션 시간 단위]
${cfg.promptInstruction}
허용 단위: ${cfg.unit}
금지 단위(본문 노출 절대 X): ${cfg.forbidden.join(", ")}`;
}
