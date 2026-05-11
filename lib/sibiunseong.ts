// ════════════════════════════════════════════════════════════════════
// 십이운성(十二運星) — 일간 vs 사주 4지지 운기 단계
// 자평진전·적천수 정통 framework
//
// 12 단계 (양일간 순행 / 음일간 역행):
//   장생(長生) → 목욕(沐浴) → 관대(冠帶) → 건록(建祿) → 제왕(帝旺) →
//   쇠(衰) → 병(病) → 사(死) → 묘(墓) → 절(絶) → 태(胎) → 양(養)
//
// 사주 4기둥(年·月·日·時) 지지 각각의 운성으로 일간 강도·기복 파악.
// 약한 운성(쇠·병·사·묘·절·태)에 들어간 십성은 효과 -20% (가중 카운트 보정).
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "./saju-calculator";

// 양일간(順行) — 갑·병·무·경·임
// 음일간(逆行) — 을·정·기·신·계
const YANG_STEMS_SI = new Set(["갑", "병", "무", "경", "임"]);

// 양일간 12 운성 시작 지지
// 갑(목): 장생 = 해(수) — 수가 목을 생
// 병(화) / 무(토): 장생 = 인(목) — 목이 화를 생, 무는 화고에 같이 따름
// 경(금): 장생 = 사(화의 자리) — 정통 자평진전: 사의 戊가 庚 생
// 임(수): 장생 = 신(금) — 금이 수를 생
const YANG_JANGSAENG: Record<string, string> = {
  갑: "해", 병: "인", 무: "인", 경: "사", 임: "신",
};
const YIN_JANGSAENG: Record<string, string> = {
  을: "오", 정: "유", 기: "유", 신: "자", 계: "묘",
};

// 12 지지 순서 (지지 인덱스)
const BRANCHES_ORDER = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const UNSEONG_ORDER = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];

// 일간 + 지지 → 운성 (단일 cell 룩업)
export function getUnseong(ilgan: string, branch: string): string {
  const isYang = YANG_STEMS_SI.has(ilgan);
  const startBranch = isYang ? YANG_JANGSAENG[ilgan] : YIN_JANGSAENG[ilgan];
  if (!startBranch) return "—";
  const startIdx = BRANCHES_ORDER.indexOf(startBranch);
  const branchIdx = BRANCHES_ORDER.indexOf(branch);
  if (startIdx < 0 || branchIdx < 0) return "—";

  // 양일간 순행, 음일간 역행
  const direction = isYang ? 1 : -1;
  const offset = ((branchIdx - startIdx) * direction + 12) % 12;
  return UNSEONG_ORDER[offset];
}

// 12 운성 풀이 cell
export const UNSEONG_TRAITS: Record<string, { hanja: string; label: string; keywords: string[]; strength: "강" | "중" | "약" }> = {
  장생: { hanja: "長生", label: "장생(長生)", keywords: ["새 시작", "성장 의지", "맑은 시작의 결", "탐구심"], strength: "강" },
  목욕: { hanja: "沐浴", label: "목욕(沐浴)", keywords: ["변화·도화", "예술적 감수성", "자유로운 결", "유혹 받기 쉬움"], strength: "중" },
  관대: { hanja: "冠帶", label: "관대(冠帶)", keywords: ["자리잡음", "청년기 활기", "자기 영역 만듦", "도전 의지"], strength: "강" },
  건록: { hanja: "建祿", label: "건록(建祿)", keywords: ["자기 자리 단단", "성년의 결", "독립·자수성가", "체계 완성"], strength: "강" },
  제왕: { hanja: "帝旺", label: "제왕(帝旺)", keywords: ["정점·최강", "자존감 최고", "흔들림 없는 결", "통솔력"], strength: "강" },
  쇠: { hanja: "衰", label: "쇠(衰)", keywords: ["약해지기 시작", "신중함", "사색 깊어짐", "절제"], strength: "중" },
  병: { hanja: "病", label: "병(病)", keywords: ["민감·예민", "감수성 풍부", "공감 능력", "약해 보이나 깊은 결"], strength: "약" },
  사: { hanja: "死", label: "사(死)", keywords: ["정지·사색", "내면 깊이", "조용한 결", "철학적"], strength: "약" },
  묘: { hanja: "墓", label: "묘(墓)", keywords: ["갈무리·창고", "축적·은닉", "저장하는 결", "신중·은밀"], strength: "약" },
  절: { hanja: "絶", label: "절(絶)", keywords: ["단절·고립", "끝과 시작의 자리", "독자 길", "변화의 결"], strength: "약" },
  태: { hanja: "胎", label: "태(胎)", keywords: ["태동·은밀", "잠재력", "조용히 자라는 결", "준비기"], strength: "약" },
  양: { hanja: "養", label: "양(養)", keywords: ["보호·받쳐줌", "자라남의 자리", "받침이 풍부", "안정"], strength: "중" },
};

// 4기둥 운성 산출
export interface SibiUnseongResult {
  year: { branch: string; unseong: string; strength: "강" | "중" | "약" };
  month: { branch: string; unseong: string; strength: "강" | "중" | "약" };
  day: { branch: string; unseong: string; strength: "강" | "중" | "약" };
  hour: { branch: string; unseong: string; strength: "강" | "중" | "약" } | null;
  // 강·중·약 분포
  strongCount: number;
  midCount: number;
  weakCount: number;
  // 일지 운성 (배우자궁의 운기)
  iljiUnseong: string;
  iljiStrength: "강" | "중" | "약";
}

export function deriveSibiUnseong(saju: SajuAnalysis): SibiUnseongResult {
  const ilgan = saju.ilgan;
  const yearU = getUnseong(ilgan, saju.pillars.year.branch);
  const monthU = getUnseong(ilgan, saju.pillars.month.branch);
  const dayU = getUnseong(ilgan, saju.pillars.day.branch);
  const hourU = saju.pillars.hour ? getUnseong(ilgan, saju.pillars.hour.branch) : null;

  const strengthOf = (u: string): "강" | "중" | "약" => UNSEONG_TRAITS[u]?.strength ?? "중";

  let strongCount = 0, midCount = 0, weakCount = 0;
  const tally = (s: "강" | "중" | "약") => {
    if (s === "강") strongCount++;
    else if (s === "중") midCount++;
    else weakCount++;
  };
  tally(strengthOf(yearU));
  tally(strengthOf(monthU));
  tally(strengthOf(dayU));
  if (hourU) tally(strengthOf(hourU));

  return {
    year: { branch: saju.pillars.year.branch, unseong: yearU, strength: strengthOf(yearU) },
    month: { branch: saju.pillars.month.branch, unseong: monthU, strength: strengthOf(monthU) },
    day: { branch: saju.pillars.day.branch, unseong: dayU, strength: strengthOf(dayU) },
    hour: saju.pillars.hour ? {
      branch: saju.pillars.hour.branch,
      unseong: hourU!,
      strength: strengthOf(hourU!),
    } : null,
    strongCount, midCount, weakCount,
    iljiUnseong: dayU,
    iljiStrength: strengthOf(dayU),
  };
}

// 약한 운성 (병·사·묘·절·태) 자리에 들어간 십성 약화 보정 — 가중 카운트에 -20%
export function isWeakUnseong(unseong: string): boolean {
  return ["병", "사", "묘", "절", "태"].includes(unseong);
}
