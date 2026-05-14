// "나도 모르게 풍기는 매력" (ch5 sub1) — 구체화 prompt
// 6단 구조: Lead → 근거 → 비유(1줄) → 실생활 → 이면 → Close
// 사용자 시안 기반. 강렬·직설·구체·이성 인용·자리 명시.

import type { SajuAnalysis } from "../../../saju-calculator";
import type { HongsilEntryChoice } from "../../types";
import { buildHongsilChoiceContext } from "../shared-context";

export interface InnerCharmArgs {
  mainBody: string;
  saju: SajuAnalysis;
  name: string;
  choice: HongsilEntryChoice;
}

// 매력 신살 풀 — 본인 사주에서 추출
function extractCharmSinsal(saju: SajuAnalysis): string[] {
  const charmKeys = ["홍염살", "도화살", "천을귀인", "월덕귀인", "천덕귀인", "금여", "태극귀인", "화개살", "장성살"];
  const found: string[] = [];
  for (const sinsal of saju.sinsal ?? []) {
    const matched = charmKeys.find(k => sinsal.includes(k));
    if (matched && !found.includes(matched)) found.push(matched);
  }
  return found.slice(0, 3);
}

// 음양 일간 판정 — 천간 짝수번째(을·정·기·신·계)는 음
const YIN_ILGAN = new Set(["을", "정", "기", "신", "계"]);

export function buildInnerCharmPrompt(args: InnerCharmArgs): string {
  const { mainBody, saju, name, choice } = args;
  const ilgan = saju.ilgan ?? "";
  const ilji = saju.pillars.day?.branch ?? "";
  const ilju = `${ilgan}${ilji}`;
  const isYin = YIN_ILGAN.has(ilgan.charAt(0));
  const charmSinsal = extractCharmSinsal(saju);

  return `당신은 홍도인입니다. ${name}님의 "나도 모르게 풍기는 매력" sub를 6단 구조로 강렬하게 다시 작성하세요.

${buildHongsilChoiceContext(choice)}

[원본 본문 — 메인 LLM 1차 출력]
${mainBody}

[★★★ 사주 인자 데이터 — 강한 단언의 근거로 사용]
일간: ${ilgan} (${isYin ? "음일간" : "양일간"})
일지(日支, 매력·배우자궁 자리): ${ilji}
일주(日柱): ${ilju}
${charmSinsal.length > 0 ? `매력 신살: ${charmSinsal.join(" / ")}` : "매력 신살: (해당 없음 — 일주·일지 결로만 매혹 풀이)"}

[★★★★★ 6단 구조 강제 — 각 단 사이 빈 줄로 구분, 헤더 ### 그대로]

① Lead — 강한 단언 + 정도
  - "${name}님이 풍기는 매력은 ○○이에요" 식 한 줄 단언.
  - "중독성 있는 깊이", "곁에 머문 사람만 빠져나올 수 없는", "한 번 빠지면 헤어 나올 수 없는" 류 강한 표현 1회 사용.
  - 평이한 표현("차분하고 따뜻한 인상" 같은) 절대 금지.

② 근거 — 사주 인자 직접 인용 + 이성 인용
  - 일지(日支)·일주(日柱)·신살·음양일간 중 2~3개 직접 호출.
  - 이성 입장의 인용 1회 ("이 사람, 알면 알수록 빠져드네" / "이 자리 떠나기 싫네" 류).
  - 한자 병기 1~2개 허용 (이 단에만).

③ 비유 — 짧게 한 줄만
  - "달빛 같은", "해 진 뒤 켜지는", "한낮의 빛 X" 류 자연 비유 1줄.
  - 1줄 초과 금지.

④ 실생활 — 직설 + 이성 반응 + 자리 명시
  - 구체 자리 1~2곳 명시 (회식·새벽·옆자리·차 안·서점·전시 등).
  - 이성의 반응 구체 묘사 ("자기도 모르게 자리 못 떠나요", "한 마디 건네고 싶지만 입이 안 떨어져요" 류).
  - 평이 표현 금지 — 직설·이성 시선·구체 시각화.

⑤ 이면 — 본인 내면 인용
  - ${name}님 본인의 속말 1회 ("내가 뭘 했다고 저 사람이 빠지지?" 류).
  - 본인은 의식 못하는 매혹의 결임을 명시.

⑥ Close — 강한 단언 + 잠금
  - "${name}님은 ○○의 결을 가진 분이에요" 한 줄 단언.
  - "첫인상으로 끌리는 분이 아니라 곁에 머문 사람만 헤어 나올 수 없는" 류 잠금 표현.

[톤 룰]
- 무난·평이·일반 금지. 강렬·직설·구체.
- 한자 병기는 ② 단에만 1~2개 (일지·일주·신살). 다른 단엔 한자 자제.
- "~에요" 어미. ${name}님 호칭 정확히.
- 자연 비유는 ③ 단 1줄만 허용. 다른 단에선 행동·반응·시선·온도 어휘.
- 결핍 낙인 금지. 매혹 톤만.
- 이 prompt에 인용된 안내 어휘를 본문에 그대로 박지 말 것.
- 결과는 본문만. 헤더 "### 나도 모르게 풍기는 매력"부터 시작.
`;
}
