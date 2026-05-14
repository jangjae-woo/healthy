// ⭐ V2.1.5 (2026-05-15) — 평생사주 구체 가정문 사전
//
// Session A 범위: personality1 (4 sub) + personality2 (4 sub) = 8 sub.
// 자도인 scenario-pool.ts의 평생사주판.

export type LifetimeScenarioKey =
  // personality1 — 나는 어떤 사람인가
  | "p1_outer_face"           // sub1 겉으로 보이는 나
  | "p1_inner_voice"          // sub2 혼자 있을 때 내면 독백
  | "p1_mind_routine"         // sub3 자주 반복되는 마음의 습관
  | "p1_decision_motive"      // sub4 나를 움직이게 하는 기준

  // personality2 — 타고난 재능의 방향
  | "p2_natural_strength"     // sub1 자연스럽게 잘하는 일
  | "p2_learning_style"       // sub2 배우고 성장하는 방식
  | "p2_stage_environment"    // sub3 일할 때 빛나는 환경
  | "p2_blocking_habit";      // sub4 재능을 막는 습관

export const LIFETIME_SCENARIO_POOL: Record<LifetimeScenarioKey, string[]> = {
  // ─── personality1 ───
  p1_outer_face: [
    "첫 만남에 사람들이 평하는 한 줄",
    "회의·대화 자리에 들어설 때의 표정",
    "낯선 자리에서 자연스럽게 자리잡는 방식",
    "단정한 결로 받아들여지는 사회적 표정",
  ],
  p1_inner_voice: [
    "혼자 방에 들어왔을 때 가장 먼저 드는 생각",
    "잠들기 전 천장을 바라보며 떠올리는 한 마디",
    "사람들 사이에서 멈춰 서서 자기 호흡을 가다듬는 자리",
    "거울 앞에서 자신과 마주하는 순간",
  ],
  p1_mind_routine: [
    "같은 자극에 늘 비슷한 결로 반응하는 패턴",
    "어떤 상황이든 마음속 한 자리에서 반복되는 독백",
    "결정을 미루는 자리에 늘 떠오르는 한 가지 생각",
    "익숙한 자극에 마음이 한 결로 기울어지는 흐름",
  ],
  p1_decision_motive: [
    "선택의 갈림길에서 마지막에 기대는 기준 한 가지",
    "결정을 내릴 때 내면이 살피는 첫 신호",
    "주변 의견과 다른 길을 갈 때 의지하는 결",
    "큰 선택일수록 천천히 짚어가는 자기 기준",
  ],

  // ─── personality2 ───
  p2_natural_strength: [
    "정돈된 자료를 분류하고 묶는 자리",
    "사람의 결을 읽고 자연스럽게 자리를 만드는 결",
    "복잡한 문제를 한 줄로 정리해내는 결",
    "묵묵히 한 분야를 깊이 파고드는 결",
    "분위기를 환하게 바꾸고 흐름을 살리는 결",
  ],
  p2_learning_style: [
    "체계적 텍스트로 차근차근 흡수하는 결 (정인 정통)",
    "직관·실전으로 먼저 부딪쳐 익히는 결 (편인 직관)",
    "한 분야를 오래 머물러 깊이 쌓는 결",
    "다양한 자리를 옮겨가며 폭넓게 배우는 결",
  ],
  p2_stage_environment: [
    "정돈된 책상·정밀이 필요한 자리",
    "사람과 사람 사이를 잇는 자리",
    "새 것을 만들고 발산하는 자리",
    "묵묵히 신뢰를 쌓아가는 자리",
    "큰 그림을 그리고 방향을 잡는 자리",
  ],
  p2_blocking_habit: [
    "한 가지 결에만 매달려 다른 자리를 못 보는 습관",
    "잘하는 결을 너무 자주 써서 결이 무뎌지는 자리",
    "약점을 외면하고 강점만 키우려는 흐름",
    "재능이 환경과 안 맞을 때 결이 굳어지는 자리",
  ],
};

export function injectLifetimeScenario(key: LifetimeScenarioKey, pickCount: number = 1): string {
  const pool = LIFETIME_SCENARIO_POOL[key];
  if (!pool || pool.length === 0) return "";
  const formatted = pool.map((s) => `- "${s}"`).join("\n");
  return `[가정문 풀 — ${key}]
다음 풀 안에서만 ${pickCount}개 골라 본문에 노출. 즉흥 가정문 생성 절대 금지.
풀 외 새 가정문 만들면 톤이 비슷해도 위반.

${formatted}

⚠️ 본인 사주 결에 가장 맞는 항목 선별. 풀 항목 그대로 또는 자연 변주로 인용.`;
}
