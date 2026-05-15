// 평생사주 — compass "종합 — 평생 가져갈 방향" (섹션 ANGLE: 종합 선택 + 시적 마무리)
// ⭐ V2.4.0 (2026-05-15) — closing 섹션 통합. compass-2가 처방+위로 통합형.
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const compass: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어 — V2.4.0]
이 챕터 제목은 "종합 — 평생 가져갈 방향"입니다. 정확히 2 sub:

### 평생 가져갈 핵심 키워드
${d.name}님 사주를 관통하는 한 방향을 한 단어·한 문장으로. 격국 + 일간 본질 종합. 220~320자.

### 잘 풀리는 선택과 마지막 방향
[5단락 구성]
1. 어떤 선택이 잘 풀리는지 단언 (한 줄)
2. 사주 메커니즘 — 용신으로 왜 이 방향인지
3. 처방 데이터(위 방향·색·행동·시간대·계절·음식) 중 가장 와닿는 2~4개를 일상 장면으로 자연스럽게 (표·리스트 X)
4. 흔들리기 쉬운 이면 한 줄
5. **시적 마무리** — ${d.name}님의 일간 본질을 따뜻하게 회상하며 앞으로의 모습 한 장면. 단정·과장 없이 시적·감정적. (이 단락이 옛 closing "묵도인의 한 마디"를 흡수)

총 550~700자, 5단락. 위로·마무리는 마지막 단락에만 — 앞 4단락은 처방 중심.

${injectLifetimePoolsBlock({
  sectionId: "compass",
  mainFactor: "용신",
  scenarios: [
    { key: "c_core_keyword", pickCount: 1 },
    { key: "c_lucky_choice", pickCount: 1 },
    { key: "c_final_direction", pickCount: 1 },
  ],
})}

${buildAllocationBlock("compass")}

[중복 방지]
앞 장의 문장을 그대로 되풀이하지 말고, 결론·우선순위·선택 기준으로만 압축하세요.`;
