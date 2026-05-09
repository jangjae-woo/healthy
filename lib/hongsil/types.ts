// 나의 홍실 (인연사주 V3) — 1인 솔로 본인 풀이 전용
// 인연궁합과 격리 — 별도 lib/hongsil

// ─── Q1 솔로 기간 (5 옵션) ──────────────────────
export type SoloDuration =
  | "lt_6m"
  | "6m_to_1y"
  | "1y_to_3y"
  | "gt_3y"
  | "never";

export const SOLO_DURATION_LABEL: Record<SoloDuration, string> = {
  lt_6m: "6개월 미만 (이별 회복 중)",
  "6m_to_1y": "6개월~1년",
  "1y_to_3y": "1년~3년",
  gt_3y: "3년 이상",
  never: "모태솔로 (한 번도 연애 X)",
};

// ─── Q2 어떤 사랑을 원하는가 (4 옵션) ──────────────
export type LoveDesire =
  | "stable"
  | "intense"
  | "natural"
  | "marriage";

export const LOVE_DESIRE_LABEL: Record<LoveDesire, string> = {
  stable: "단단한 사랑 — 안정과 깊이",
  intense: "짜릿한 사랑 — 강렬과 자극",
  natural: "자연스러운 사랑 — 편안과 흐름",
  marriage: "결혼을 향한 사랑 — 약속과 미래",
};

// ─── Q3 본인 사랑 스타일 (6 옵션) ──────────────────
export type LoveStyle =
  | "direct"
  | "careful"
  | "miyldang"
  | "distant"
  | "passive"
  | "balance";

export const LOVE_STYLE_LABEL: Record<LoveStyle, string> = {
  direct: "직진형 — 마음 들면 바로 다가가요",
  careful: "신중형 — 천천히 관찰해요",
  miyldang: "밀당형 — 밀고 당기는 결",
  distant: "거리 두는 편 — 다가오기를 기다려요",
  passive: "수동형 — 상대가 이끌어주는 게 좋아요",
  balance: "균형형 — 상황 따라 바뀌어요",
};

// ─── 본인 사주 입력 ──────────────────────────────
export interface SoloPersonInput {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  calendar: "양력" | "음력";
  gender: "남" | "여";
}

// ─── V3 선입력 + 사주 ──────────────────────────
export interface HongsilEntryChoice {
  duration: SoloDuration;
  desire: LoveDesire;
  style: LoveStyle;
}

export interface HongsilRequest {
  me: SoloPersonInput;
  choice: HongsilEntryChoice;
}

// ─── 호환을 위한 인연궁합 V2 타입 (기존 코드가 import 중) ───
// hongsil 폴더 안의 prompts·build-context는 인연궁합 V2 코드 복사본
// 점진 교체 예정. 우선 호환 타입 유지.
export type RelationshipKind =
  | "crush"
  | "talking"
  | "dating_short"
  | "dating_long"
  | "married"
  | "exboyfriend";

export type MeetDuration =
  | "lt_1m" | "1to3m" | "3to6m" | "6mto1y" | "1to3y" | "gt_3y";

export interface InyeonEntryChoice {
  relationship: RelationshipKind;
  duration: MeetDuration;
}

export interface InyeonPersonInput {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  calendar: "양력" | "음력";
  gender: "남" | "여";
}

export interface InyeonRequest {
  a: InyeonPersonInput;
  b: InyeonPersonInput;
  choice: InyeonEntryChoice;
}

export const RELATIONSHIP_LABEL: Record<RelationshipKind, string> = {
  crush: "짝사랑",
  talking: "썸·소개팅",
  dating_short: "연인 (3개월 미만)",
  dating_long: "연인 (3개월 이상)",
  married: "부부",
  exboyfriend: "재회·헤어진 사람",
};

export const DURATION_LABEL: Record<MeetDuration, string> = {
  lt_1m: "1개월 미만",
  "1to3m": "1~3개월",
  "3to6m": "3~6개월",
  "6mto1y": "6개월~1년",
  "1to3y": "1~3년",
  gt_3y: "3년 이상",
};
