// "좋은 사람을 알아보는 신호" (ch3 sub3) — 구체화 prompt
// 5단 구조: Lead → 근거 → 핵심 신호 → 위험 신호 → Close
// 톤 강도 "중" — 강한 단언 + 위험 경고 (단정 X)
// 처방 환각 차단 — helper 데이터에서만 단정 허용.

import type { SajuAnalysis } from "../../../saju-calculator";
import type { YongsinPrescription } from "../../yongsin-prescription";
import type { HongsilEntryChoice } from "../../types";
import { buildHongsilChoiceContext } from "../shared-context";

export interface GoodPartnerSignalArgs {
  mainBody: string;
  saju: SajuAnalysis;
  prescription: YongsinPrescription;
  destinyCharacter: string;
  name: string;
  choice: HongsilEntryChoice;
}

export function buildGoodPartnerSignalPrompt(args: GoodPartnerSignalArgs): string {
  const { mainBody, saju, prescription, destinyCharacter, name, choice } = args;
  const ilgan = saju.ilgan ?? "";
  const ilji = saju.pillars.day?.branch ?? "";
  const p = prescription;
  const weak = p.weakElement === "없음" ? "균형" : p.weakElement;
  const chungHasSeun = p.seun.chungBranches.length > 0;

  return `당신은 홍도인입니다. ${name}님의 "좋은 사람을 알아보는 신호" sub를 5단 구조로 강렬하게 다시 작성하세요.

${buildHongsilChoiceContext(choice)}

[원본 본문 — 메인 LLM 1차 출력]
${mainBody}

[★★★ 사주 인자 데이터 — 강한 단언의 근거로만 사용]
일간: ${ilgan}
일지(日支, 배우자궁): ${ilji}
부족 오행: ${weak} ${weak !== "균형" ? "(짝의 결에서 가장 중요)" : ""}
운명 짝꿍 캐릭터: ${destinyCharacter}
${chungHasSeun ? `★ 올해 충(沖) 걸린 지지: ${p.seun.chungBranches.join(", ")} — 위험 시기 처방 가능` : "★ 올해 충 없음 — 일반 위험 신호로"}

[★★★★★ 5단 구조 강제 — 각 단 사이 빈 줄로 구분, 헤더 ### 그대로]

① Lead — 강한 단언
  - "${name}님이 만날 좋은 사람은 결국 한 종류예요" 식 단호한 첫 문장.
  - "다른 매력에 흔들려도 결국 머무는 자리는 ○○" 류 표현.
  - 무난 평이("좋은 인연은 사소한 일상에서 드러나는 법" 같은) 절대 금지.

② 근거 — 사주 인자 + 짝꿍 결 단정
  - 일지(日支) 또는 부족 오행 1~2개 직접 호출.
  - "${name}님의 ${weak !== "균형" ? `${weak}이 옅게 자리한 사주라, 그 빈 자리를 정확히 채워주는 결` : "일지의 결"}을 가진 사람을 만났을 때 비로소 흔들림이 멈춰요" 류 강한 단정.
  - 짝꿍 캐릭터(${destinyCharacter}상) 이름 명시 가능 (1회).
  - 한자 병기 1~2개 허용 (이 단에만).

③ 핵심 신호 — 구체 자리 + 강한 단정 (3개)
  - 첫 번째 신호: 구체 행동 + 자리 명시 (약속 시간·연락 주기·식당 자리·메시지 답장 톤 등 중 1개).
    "이런 자리에서 이런 반응 보이면 그 사람이 맞아요" 식 단언.
  - 두 번째 신호: 다른 자리·다른 행동.
  - 세 번째 신호: 또 다른 자리·다른 행동.
  - 평이한 "약속을 잘 지킨다" 류 X. 구체 시각화 필수.

④ 위험 신호 — 강한 경고 (톤 "중")
  - "반대로 이런 행동 보이면 ${name}님의 결과 정면으로 부딪혀요" 류.
  - "처음엔 끌리더라도 결국 마음 소진/자기 기준 흔들림/관계 흔들림 중 하나" 류 단언.
  - "이 유형은 ${name}님 사주의 인자와 충돌하는 결" 명시 가능.
  ${chungHasSeun ? `- 충(沖) 활용 가능: "특히 올해는 충 시기라 ${p.seun.avoidPlace.join(' / ')} 같은 자리에서 만난 사람은 더 신중히" 류 강한 톤.` : ""}
  - 단정 강도 "중": "절대 X" 같은 극단 어휘는 자제. "결국 마음이 소진돼요" 정도까지.

⑤ Close — 강한 단언 + 잠금
  - "${name}님은 한 가지 결의 사람이에요" 한 줄 단언.
  - "그 결을 알아보는 한 사람만이 진짜 인연이고, 나머지는 흔들리다 결국 돌아오는 자리는 정해져 있어요" 류 잠금 표현.

[톤 룰]
- 무난·평이·일반 가이드 금지. 강렬·직설·구체.
- 위험 신호 톤은 "중" — 경고는 분명하되 극단 단정("절대 X", "반드시 헤어짐") 금지.
- 한자 병기는 ② 단에만 1~2개. 다른 단엔 한자 자제.
- "~에요" 어미. ${name}님 호칭 정확히.
- 자연 비유 금지 (3장 sub는 비유 X 룰).
- 결핍 낙인 금지 — "부족한 결" 대신 "옅게 자리한 결".
- 처방 데이터에 없는 행동·장소·사건 단정 금지. 위 helper 데이터에서만 처방 어휘 사용.
- 이 prompt에 인용된 안내 어휘를 본문에 그대로 박지 말 것.
- 결과는 본문만. 헤더 "### 좋은 사람을 알아보는 신호"부터 시작.
`;
}
