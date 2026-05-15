// ════════════════════════════════════════════════════════════════════
// 평생사주 프롬프트 — 섹션별 파일 조립
// ⭐ V2.4.0 (2026-05-15) — 목차 정리: 13 섹션 → 9 섹션
// 삭제: love2 / love3 / timeline2 / closing
// ════════════════════════════════════════════════════════════════════

import type { PromptFn } from "./_shared";
import { personality1 } from "./personality1";
import { personality2 } from "./personality2";
import { money1 } from "./money1";
import { money2 } from "./money2";
import { love1 } from "./love1";
import { health } from "./health";
import { hidden } from "./hidden";
import { timeline1 } from "./timeline1";
import { compass } from "./compass";

export const LIFETIME_SAJU_PROMPTS: Record<string, PromptFn> = {
  personality1,
  personality2,
  money1,
  money2,
  love1,
  health,
  hidden,
  timeline1,
  compass,
};

export type { PromptFn } from "./_shared";
export { buildHeader, sortedWeakest, sortedStrongest } from "./_shared";
