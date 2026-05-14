// 평생사주 나이대 분기 (2026-05-14)
// 본인 나이를 5단계로 분류 → 각 단계별 톤·금지 표현 prompt에 prepend.
// 직업·결혼·자녀 단정 회피 + 나이별 와닿는 시기·역할 강조.
//
// 사용처: app/api/generate/route.ts buildHeader() — 모든 LIFETIME_SAJU_PROMPTS 자동 적용
//
// 인연사주(hongsil)의 6 관계 분기 / 부모자녀(parent-child)의 자녀 6 연령대 분기와 비슷한 패턴.

export type LifeStage = "youth" | "thirties" | "midlife" | "fifties" | "senior";

export function classifyLifeStage(age: number): LifeStage {
  if (age < 30) return "youth";
  if (age < 40) return "thirties";
  if (age < 50) return "midlife";
  if (age < 60) return "fifties";
  return "senior";
}

const STAGE_LABEL: Record<LifeStage, string> = {
  youth: "청년기 (만 20대)",
  thirties: "30대",
  midlife: "중년 초입 (40대)",
  fifties: "성숙기 (50대)",
  senior: "은퇴기 (60대 이상)",
};

const STAGE_GUIDE: Record<LifeStage, string> = {
  youth: `
[★★ 나이대 톤 가이드 — 청년기 (20대)]
- 강조 영역: 진로 탐색·연애 경험·자기 발견·첫 직장·독립
- 결혼·자녀·부동산·은퇴 단정 절대 X — "아직 가지 않은 길" 톤
- "20대 끝에서…", "30대 초반에 만나는 흐름" 같이 가까운 미래 톤
- 절대 X: "이미 결혼하셨다면…", "자녀가 있다면…", "은퇴 후"
- 좋은 톤: "지금 막 시작하는 결", "처음 만나는 자리", "한참 쌓아갈 시기"
`,
  thirties: `
[★★ 나이대 톤 가이드 — 30대]
- 강조 영역: 커리어 안정·중요 인연·결혼 전후·정착·자기 색 확립
- 결혼 여부 단정 X — 싱글 30대도 많음. "함께 살아가는 사람" 정도로 중립
- "30대 중반의 전환점", "40대 초반에 자리 잡는 결" 같이 시기 명시
- 절대 X: "이미 결혼생활이 X년차라면", "자녀가 있다면"
- 좋은 톤: "쌓아온 결이 모이는 시기", "가까운 사람을 정하는 결"
`,
  midlife: `
[★★ 나이대 톤 가이드 — 중년 초입 (40대)]
- 강조 영역: 커리어 정점·중년 전환·자녀 양육 또는 자기 재발견·건강
- 자녀 유무 단정 X — "가까운 다음 세대" 정도로 중립
- "40대 후반의 전환", "50대 초반에 정리되는 흐름" 같이 시기 명시
- 절대 X: "자녀가 사춘기라면", "막내가 독립하면", "이미 부모님이 안 계시면"
- 좋은 톤: "한 번 더 다듬는 결", "내 색을 단단히 하는 시기", "쌓아온 것을 정리하는 결"
`,
  fifties: `
[★★ 나이대 톤 가이드 — 성숙기 (50대)]
- 강조 영역: 자녀 독립·은퇴 준비·건강 관리·관계 재정의·인생 2막 준비
- 직장 단정 X — 자영업·은퇴 준비·재취업·전업 모두 가능
- "50대 후반의 전환점", "60대 초반에 정리되는 결" 같이 시기 명시
- 절대 X: "직장에서 승진", "젊은 후배와의 갈등", "결혼할 사람을 만날 시기"
- 인연·결혼 영역(love1·love2·love3 섹션) 톤: 현재 결혼 상태·미혼 여부 단정 절대 X. "결혼 생활에서 ○○님은…" / "배우자와 함께…" 같은 결혼 기정사실 톤 금지. "있다면", "곁에 있는 사람이라면" 같은 조건 어조만.
- 좋은 톤: "정리하고 거두는 시기", "한결같이 지켜온 결을 다시 보는 결", "내일을 준비하는 자리"
`,
  senior: `
[★★ 나이대 톤 가이드 — 은퇴기 (60대 이상)]
- 강조 영역: 건강·말년 복·자녀·손주·관계 정리·삶의 의미·평온
- 연애·결혼 단정 절대 X — 새 인연 가능성은 부드럽게 (단정 X)
- 직업 단정 X — 은퇴자·자영업·계속 일하는 분 모두 가능
- "60대 후반의 안정", "70대 초반의 평온" 같이 시기 명시 가능. 단 죽음·말년 음울 어조 X
- 절대 X: "20대 후반의 큰 인연", "결혼 적령기", "직장 갈등"
- 인연·결혼 영역(love1·love2·love3 섹션) 톤: **현재 결혼 상태 단정 절대 금지**. 미혼·이혼·사별·결혼 유지 모든 케이스 가능. **"결혼 생활에서 ○○님은…" / "배우자와 함께…" / "남편·아내가" 같은 결혼 기정사실 톤 절대 출력 X**. 대신 "곁의 사람이 있다면", "함께 살아가는 분이 계신다면" 같은 조건 어조만 허용.
- 자녀·손주 단정도 X — "자녀가 있다면", "손주를 보살핀다면" 같이 조건 어조.
- 좋은 톤: "지금까지 쌓은 결이 모이는 시기", "한결같이 살아온 결", "곁의 사람과 함께 가는 자리"
- 건강 영역은 "의료 진단 X"는 그대로 유지하되, 보살핌·여유 톤 강조
`,
};

/**
 * buildHeader 내부 또는 LIFETIME_SAJU_PROMPTS 직전에 prepend.
 * 빈 stage(나이 정보 없음) 케이스는 빈 문자열 반환 — fallback 안전.
 */
export function buildStageGuide(year: string | undefined): string {
  if (!year) return "";
  const y = parseInt(year, 10);
  if (!isFinite(y)) return "";
  const age = new Date().getFullYear() - y;
  if (age < 0 || age > 120) return ""; // 비현실적 나이 fallback
  const stage = classifyLifeStage(age);
  return `

[현재 만 ${age}세 — ${STAGE_LABEL[stage]}]
${STAGE_GUIDE[stage]}`;
}

export { STAGE_LABEL, STAGE_GUIDE };
