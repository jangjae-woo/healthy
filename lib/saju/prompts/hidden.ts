// 평생사주 — hidden "조심해야 할 반복 패턴" (섹션 ANGLE: 방어)
import { buildHeader, type PromptFn } from "./_shared";
import { buildAllocationBlock } from "../factor-allocation";
// ⭐ V2.1.7 (2026-05-15) — Session C 청월당 풀 시스템
import { injectLifetimePoolsBlock } from "@/lib/saju-pools/lifetime-pool-injector";

export const hidden: PromptFn = (d, ctx, s) => `${buildHeader(d, ctx, s)}

[평생사주 해석 기획 레이어]
이 챕터 제목은 "조심해야 할 반복 패턴"입니다. 신살이나 특수 기운은 공포 조장이 아니라 반복 습관을 읽는 보조 근거로만 사용하세요.

★★★★★ **신살 이름 직접 노출 의무**: 본문에 신살(神煞)이 등장할 때 반드시 이름을 한자 병기로 직접 노출하세요.
- ✓ 좋은 예: "도화살(桃花殺)의 결이 강하게 자리하여…" / "천을귀인(天乙貴人)이 어려울 때 도움 주는 자리"
- ✗ 절대 금지 표현: "이 신살의 결이…" / "특수 기운이…" / "그 신살의 영향으로…" / "타고난 신살과…" / "어려운 신살이…" / "큰 길신으로…" 같이 **이름 없이 신살을 가리키는 모든 추상 표현**
- 신살을 언급할 거면 첫 등장에서 반드시 이름(한자 병기)을 쓰고, 그 뒤로는 "그 자리", "그 기운"처럼 받되 "신살"이라는 단어 자체를 추상적으로 다시 쓰지 마세요.
- 사주 데이터에 명시된 신살 이름 그대로 본문에 1~2회 직접 인용. 그 자리 의미·결을 생활어로 짧게 풀이.
- ⭐ V2.1.4 신살 어휘 룰과 호환: 1회 한자병기 → 2회 한자 빼고 이름만 → 3회+ buildHeader의 [신살 어휘 매핑] 표 어휘로 치환.

${injectLifetimePoolsBlock({
  sectionId: "hidden",
  mainFactor: "신살_흉",
  scenarios: [
    { key: "hd_excess_factor", pickCount: 1 },
    { key: "hd_blocked_habit", pickCount: 1 },
    { key: "hd_warning_sinsal_scene", pickCount: 1 },
    { key: "hd_safety_sinsal_scene", pickCount: 1 },
  ],
})}

${buildAllocationBlock("hidden")}`;
