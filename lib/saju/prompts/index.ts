// ════════════════════════════════════════════════════════════════════
// 평생사주 프롬프트 — 섹션별 파일 조립 (2026-05-14)
// 연애사주 lib/hongsil/prompts/ 형식 차용. route.ts 인라인 거대 객체에서 분리.
// 섹션 추가/수정 시 해당 파일만 열면 됨 — 다른 섹션 영향 0.
// ════════════════════════════════════════════════════════════════════

import type { PromptFn } from "./_shared";
import { personality1 } from "./personality1";
import { personality2 } from "./personality2";
import { money1 } from "./money1";
import { money2 } from "./money2";
import { love1 } from "./love1";
import { love2 } from "./love2";
import { love3 } from "./love3";
import { health } from "./health";
import { hidden } from "./hidden";
import { timeline1 } from "./timeline1";
import { timeline2 } from "./timeline2";
import { compass } from "./compass";
import { closing } from "./closing";

export const LIFETIME_SAJU_PROMPTS: Record<string, PromptFn> = {
  personality1,
  personality2,
  money1,
  money2,
  love1,
  love2,
  love3,
  health,
  hidden,
  timeline1,
  timeline2,
  compass,
  closing,
};

export type { PromptFn } from "./_shared";
export { buildHeader, sortedWeakest, sortedStrongest } from "./_shared";
