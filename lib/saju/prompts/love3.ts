// 평생사주 — love3 "인연의 시기와 귀인" (섹션 ANGLE: 지속)
import { buildHeader, buildPrescriptionContext, sortedWeakest, sortedStrongest, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.8 (2026-05-15) — Session D 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const love3: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}
${s ? buildPrescriptionContext(s.yongsin, sortedWeakest(s.elements), sortedStrongest(s.elements)) : ""}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "인연의 시기와 귀인"입니다. 인연의 기운이 흐르는 시기·귀인을 만나는 자리·관계를 지키는 한 수를 다루세요.
★ 결혼 시기 단정 절대 금지 — "가장 좋습니다 / 이때 결혼해야 합니다" 류 확정 단언 X. "이 시기에 인연의 기운이 강하게 흐릅니다" 같은 가능성 어조. "이미 인연을 만나셨다면 이 시기는 관계가 깊어지는 흐름" 같이 미혼·기혼 양방향 해석 1줄 포함.
★★★★★ 신살 이름 직접 노출 의무: 천을귀인(天乙貴人)·천덕귀인(天德貴人)·도화살(桃花殺)·금여(金輿) 등 인연 관련 신살이 사주에 등록돼 있으면 본문에 이름 직접 인용. "이 신살의 결" 같은 추상 표현 절대 X.
- ⭐ V2.1.4 신살 어휘 룰과 호환: 1회 한자병기 → 2회 한자 빼고 이름만 → 3회+ buildHeader의 [신살 어휘 매핑] 표 어휘로 치환.

${injectLifetimePoolsBlock({
  sectionId: "love3",
  mainFactor: "일지",
  scenarios: [
    { key: "l3_spouse_trait", pickCount: 1 },
    { key: "l3_marriage_dynamics", pickCount: 1 },
    { key: "l3_marriage_timing", pickCount: 1 },
    { key: "l3_gwiin_meeting", pickCount: 1 },
  ],
})}

${buildAllocationBlock("love3")}`;
