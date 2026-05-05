// 인연(궁합) 전용 타입 — 평생사주·엄마와아이와 격리
export type RelationshipKind =
  | "crush"        // 짝사랑
  | "talking"      // 썸·소개팅
  | "dating_short" // 연인 (3개월 미만)
  | "dating_long"  // 연인 (3개월 이상)
  | "engaged"      // 결혼 준비
  | "married"      // 부부
  | "exboyfriend"; // 재회·헤어진 사람

export type MeetDuration =
  | "lt_1m" | "1to3m" | "3to6m" | "6mto1y" | "1to3y" | "gt_3y";

export type Depth = "basic" | "detail" | "deep";

export interface InyeonEntryChoice {
  relationship: RelationshipKind;
  duration: MeetDuration;
  depth: Depth;
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
  engaged: "결혼 준비",
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

export const DEPTH_LABEL: Record<Depth, string> = {
  basic: "기본",
  detail: "자세히",
  deep: "매우 자세히",
};
