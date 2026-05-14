// 평생사주 — timeline2 "앞으로 5년의 흐름" (섹션 ANGLE: 5년)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.8 (2026-05-15) — Session D 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const timeline2: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "앞으로 5년의 흐름"입니다. 2026~2030년 세운(年運)을 원국·대운에 연결해 흐름과 준비 방향으로 설명하세요.
세운 간지: 2026 병오(丙午) / 2027 정미(丁未) / 2028 무신(戊申) / 2029 기유(己酉) / 2030 경술(庚戌).
★ 날짜 확정 예언 금지 — "○○년에 반드시" 류 X. "○○년 무렵 ~한 흐름" 가능성 어조. 돈·재산 흐름은 money1에서 다뤘으니 여기선 일·관계·전환점 중심.

${injectLifetimePoolsBlock({
  sectionId: "timeline2",
  mainFactor: "대운",
  scenarios: [
    { key: "t2_year_2026", pickCount: 1 },
    { key: "t2_year_2027", pickCount: 1 },
    { key: "t2_year_2028", pickCount: 1 },
    { key: "t2_year_2029_2030", pickCount: 1 },
    { key: "t2_5y_keyword", pickCount: 1 },
  ],
})}

${buildAllocationBlock("timeline2")}`;
