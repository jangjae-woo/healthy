// ════════════════════════════════════════════════════════════════════
// V3 22 sub 프롬프트 통합 빌더
// build-context → 22 sub 프롬프트 배열
// ════════════════════════════════════════════════════════════════════

import type { SajuAnalysis } from "../../saju-calculator";
import type { HongsilRequest } from "../types";
import { buildHongsilV3Context, type HongsilV3Context } from "./shared-context";
import { buildSub01Prompt } from "./sub/sub01-attractiveness";
import { buildSub02Prompt } from "./sub/sub02-first-impression";
import { buildSub03Prompt } from "./sub/sub03-thumb-charm";
import { buildSub04Prompt } from "./sub/sub04-change-in-love";
import { buildSub05Prompt } from "./sub/sub05-mildang-vs-jikjin";
import { buildSub06Prompt } from "./sub/sub06-attraction-vs-fit";
import { buildSub07Prompt } from "./sub/sub07-meeting-method";
import { buildSub08Prompt } from "./sub/sub08-partner-preview";
import { buildSub09Prompt } from "./sub/sub09-partner-impression";
import { buildSub10Prompt } from "./sub/sub10-destiny-signal";
import { buildSub11Prompt } from "./sub/sub11-key-move";
import { buildSub12Prompt } from "./sub/sub12-marriage-timing";
import { buildSub13Prompt } from "./sub/sub13-fake-attraction";
import { buildSub14Prompt } from "./sub/sub14-same-ending";
import { buildSub15Prompt } from "./sub/sub15-break-the-loop";
import { buildSub16Prompt } from "./sub/sub16-life-flow";
import { buildSub17Prompt } from "./sub/sub17-solo-escape";
import { buildSub18Prompt } from "./sub/sub18-2026-year";
import { buildSub19Prompt } from "./sub/sub19-hidden-charm";
import { buildSub20Prompt } from "./sub/sub20-instinct-desire";
import { buildSub21Prompt } from "./sub/sub21-deep-mood";
import { buildSub22Prompt } from "./sub/sub22-letter";

export interface SubPrompt {
  subId: number;
  chapterLabel: string;
  subTitle: string;
  prompt: string;
}

// C.txt 재정렬 순서: 1장 → 3장 → 4장 → 2장 → 5장 → 6장
const CHAPTER_LABEL: Record<number, string> = {
  1: "1장 — 내 매력",   2: "1장 — 내 매력",   3: "1장 — 내 매력",
  4: "1장 — 내 매력",   5: "1장 — 내 매력",   6: "1장 — 내 매력",
  7: "3장 — 내 짝꿍",   8: "3장 — 내 짝꿍",   9: "3장 — 내 짝꿍",
  10: "3장 — 내 짝꿍",  11: "3장 — 내 짝꿍",  12: "3장 — 내 짝꿍",
  13: "4장 — 반복 패턴", 14: "4장 — 반복 패턴", 15: "4장 — 반복 패턴",
  16: "2장 — 사랑타이밍", 17: "2장 — 사랑타이밍", 18: "2장 — 사랑타이밍",
  19: "5장 — 19금 사주", 20: "5장 — 19금 사주", 21: "5장 — 19금 사주",
  22: "6장 — 홍도인의 마지막 편지",
};

const SUB_TITLE: Record<number, string> = {
  1: "내 매력은?",
  2: "이성이 처음 보는 나의 결",
  3: "썸 단계 결정적 매력",
  4: "사랑하면 변하는 나",
  5: "밀당녀 vs 직진녀",
  6: "내가 끌리는 사람 vs 나에게 잘 맞는 사람",
  7: "내게 맞는 만남 방식 — 자만추 vs 인만추 vs 결정사",
  8: "내 짝꿍 미리 보기",
  9: "짝꿍의 첫인상과 분위기",
  10: "운명을 알아보는 단서",
  11: "운명을 잡는 한 수",
  12: "그 짝꿍과 결혼이 가까워지는 자리",
  13: "자꾸 끌리는 가짜 인연",
  14: "매번 같은 결말의 이유",
  15: "이 굴레, 어떻게 벗어날까?",
  16: "인생 전체, 사랑의 큰 흐름",
  17: "솔로 탈출은 언제?",
  18: "올해 인연의 결 (2026)",
  19: "감춰진 야한 매력",
  20: "내 본능이 원하는 결",
  21: "둘이 가장 깊어지는 분위기",
  22: "마지막 편지",
};

type SubBuilder = (ctx: HongsilV3Context) => string;

const SUB_BUILDERS: Record<number, SubBuilder> = {
  1: buildSub01Prompt,
  2: buildSub02Prompt,
  3: buildSub03Prompt,
  4: buildSub04Prompt,
  5: buildSub05Prompt,
  6: buildSub06Prompt,
  7: buildSub07Prompt,
  8: buildSub08Prompt,
  9: buildSub09Prompt,
  10: buildSub10Prompt,
  11: buildSub11Prompt,
  12: buildSub12Prompt,
  13: buildSub13Prompt,
  14: buildSub14Prompt,
  15: buildSub15Prompt,
  16: buildSub16Prompt,
  17: buildSub17Prompt,
  18: buildSub18Prompt,
  19: buildSub19Prompt,
  20: buildSub20Prompt,
  21: buildSub21Prompt,
  22: buildSub22Prompt,
};

export function getSubMeta(subId: number) {
  return {
    chapterLabel: CHAPTER_LABEL[subId] ?? "",
    subTitle: SUB_TITLE[subId] ?? "",
  };
}

export function buildAllV3SubPrompts(req: HongsilRequest, saju: SajuAnalysis): SubPrompt[] {
  const ctx = buildHongsilV3Context(req, saju);
  const result: SubPrompt[] = [];
  for (let i = 1; i <= 22; i++) {
    const builder = SUB_BUILDERS[i];
    if (!builder) continue;
    result.push({
      subId: i,
      chapterLabel: CHAPTER_LABEL[i],
      subTitle: SUB_TITLE[i],
      prompt: builder(ctx),
    });
  }
  return result;
}

export function buildV3SubPrompt(subId: number, req: HongsilRequest, saju: SajuAnalysis): SubPrompt | null {
  const builder = SUB_BUILDERS[subId];
  if (!builder) return null;
  const ctx = buildHongsilV3Context(req, saju);
  return {
    subId,
    chapterLabel: CHAPTER_LABEL[subId],
    subTitle: SUB_TITLE[subId],
    prompt: builder(ctx),
  };
}

// 단일 sub vs 챕터 단위 phase vs 전체
export function buildV3SubsByPhase(
  phase: string | undefined,
  req: HongsilRequest,
  saju: SajuAnalysis,
): SubPrompt[] {
  if (!phase || phase === "all") return buildAllV3SubPrompts(req, saju);
  // phase 형식: "ch1" "ch2" ... "ch6"
  const phaseMap: Record<string, number[]> = {
    ch1: [1, 2, 3, 4, 5, 6],
    ch3: [7, 8, 9, 10, 11, 12],
    ch4: [13, 14, 15],
    ch2: [16, 17, 18],
    ch5: [19, 20, 21],
    ch6: [22],
  };
  const ids = phaseMap[phase];
  if (!ids) return [];
  const ctx = buildHongsilV3Context(req, saju);
  return ids.map((id) => ({
    subId: id,
    chapterLabel: CHAPTER_LABEL[id],
    subTitle: SUB_TITLE[id],
    prompt: SUB_BUILDERS[id](ctx),
  }));
}

export { CHAPTER_LABEL, SUB_TITLE };
