// 평생사주 — personality1 "나는 어떤 사람인가" (섹션 ANGLE: 관찰)
// sub 구조는 factor-allocation.ts 가 single source of truth — buildAllocationBlock 으로 주입.
import { buildHeader, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";

export const personality1: PromptFn = (d, ctx) => `${buildHeader(d, ctx)}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "나는 어떤 사람인가"입니다. 첫 무료 파트에서 기본 구조를 이미 봤다고 가정하고, 전문용어 설명을 반복하지 마세요.
사주 인자는 근거로만 쓰고, 본문은 생활어 중심으로 풀어주세요. 한문 표기는 꼭 필요할 때만 1~2회 이하로 제한합니다.
${buildAllocationBlock("personality1")}

[중복 방지]
같은 사주 근거를 여러 소제목에서 반복하지 말고, 이미 말한 근거는 "이 흐름은", "그래서 실제로는"처럼 이어 말하세요.`;
