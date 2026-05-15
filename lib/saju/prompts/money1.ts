// 평생사주 — money1 "돈과 현실 감각" (섹션 ANGLE: 행동)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.6 (2026-05-15) — Session B 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const money1: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "돈과 현실 감각"입니다. 재성만 단독으로 보지 말고 식상, 비겁, 관성, 전체 강약과 함께 판단하세요. 시기별 재산 흐름은 이 섹션의 첫 sub에서만 다루고, timeline 섹션은 일·관계·인생 흐름 중심으로 다루므로 시기 영역 중복을 피하세요.

[★★★ V2.3.0 재테크운 강조 (2026-05-15)]
이 챕터는 사실상 "재테크운"입니다. 본문에 "재테크" 단어를 적어도 1회 자연스럽게 노출하고, 다음 핵심 3축을 모두 다루세요:
- 재물 관리 성향(안정형/공격형) — 비겁·인성·관성 강도로 판단
- 투자 결단력(보수적 vs 적극적) — 식상·재성 강도로 판단
- 위험 회피 vs 도전 — 일간 강약 + 비겁·관성 결합으로 판단

[★★★ V2.1.9 시기별 재산 흐름 강화 (money1-1 sub 의무 룰)]
시기별 재산 흐름 풀이는 다음 3구간으로 명확 분리:
- **재산 도약 시기** (한 번 크게 자리잡는 대운·연령대)
- **다지는 시기** (꾸준히 쌓는 안정 구간)
- **흔들리는 시기** (재물이 새거나 위축되는 구간 — 30대·50대·60대 등 사주 결에 따라)

[★★★ V2.1.9 말년 재물 팩트+가이드 (사용자 강조)]
SajuLifeWealthCurve 차트에서 말년(60대 이후) 재물 점수가 낮게 나오면 본문에서 우회·미화 절대 금지. 다음 3단 의무:
1. **팩트 단정** — "60대 이후 재물 흐름이 약하게 잡힙니다" 같이 직설적으로
2. **사주적 원인** — "관성이 강하고 재성이 약해 노년에는 ~한 결" / "겁재가 노년 대운에 자리해 ~"
3. **대응 가이드 직접 제시 (이게 핵심)**:
   - "그래서 50대까지 ○○을 준비해두는 것이 안전합니다"
   - "부동산보다 ○○이 안전합니다"
   - "자녀에게 ○○까지는 의지하지 않게 미리 ~"
   - "○○에 큰 자리를 묶지 마세요"
가이드는 사주 결에 맞게 구체적으로. 일반 노후 준비 조언 X — 이 사주에서만 나오는 결의 대응.

[★★★ V2.2.0 시기 숫자 일관성 (버그 수정)]
- 한 sub 안에서 연령대·시기 숫자가 서로 모순되지 않게 — "60대까지 안정적인 흐름"이라 해놓고 "50대까지 자산을 구축하라"고 하면 어긋남(독자 혼란).
- 시기 표현은 한 흐름으로만: "지금부터 ○○세까지 [구간1] → ○○세 이후 [구간2]" 식 시간 순서대로.
- 같은 sub 안에 연령대가 3개 이상 나오면 반드시 작은 수→큰 수 순서로 정렬. 구간이 겹치거나 역순이면 위반.
- "안정 흐름이 이어지는 시기"와 "대응을 준비해야 하는 시기"는 서로 다른 연령으로 명확히 구분.

${injectLifetimePoolsBlock({
  sectionId: "money1",
  mainFactor: "재성",
  scenarios: [
    { key: "m1_wealth_flow", pickCount: 1 },
    { key: "m1_hold_money", pickCount: 1 },
    { key: "m1_leak_pattern", pickCount: 1 },
    { key: "m1_reality_choice", pickCount: 1 },
  ],
})}

${buildAllocationBlock("money1")}

[중복 방지]
돈을 "좋다/나쁘다"로 단정하지 말고, 시기·관리·새는 패턴·선택 기준으로 역할을 분리하세요. timeline1·timeline2 섹션의 시기 영역과 결론이 겹치지 않게 — money1은 "재산 흐름" / timeline1은 "일·관계·인생 흐름" 분리.`;
