// 올해 연애에서 조심할 흐름 — 구체화 prompt
// 메인 LLM 1차 본문을 받아 세운(올해) 처방 데이터로 재작성.

import type { YongsinPrescription } from "../../yongsin-prescription";
import type { HongsilEntryChoice } from "../../types";
import { buildHongsilChoiceContext } from "../shared-context";

export interface YearlyFlowArgs {
  mainBody: string;
  prescription: YongsinPrescription;
  name: string;
  choice: HongsilEntryChoice;
}

export function buildYearlyFlowPrompt(args: YearlyFlowArgs): string {
  const { mainBody, prescription, name, choice } = args;
  const s = prescription.seun;
  const currentYear = new Date().getFullYear();

  return `당신은 홍도인입니다. ${name}님의 "올해 연애에서 조심할 흐름" 본문을 ${currentYear}년 세운 처방 데이터에 근거해 다시 작성하세요.

${buildHongsilChoiceContext(choice)}

[원본 본문 — 메인 LLM 1차 출력]
${mainBody}

[★★★★★ ${currentYear}년 세운 처방 데이터 — 이 안에서만 골라 쓸 것]
올해 강해지는 오행: ${s.strongElement}
좋은 흐름: ${s.goodFlow.join(" / ")}
피할 행동: ${s.avoidAction.join(" / ")}
피할 장소·환경: ${s.avoidPlace.join(" / ")}
${s.chungBranches.length > 0 ? `★ 충(沖) 걸린 지지: ${s.chungBranches.join(", ")} — 이 시기 큰 결정 자제, 충돌 가능성 주의` : ""}
${s.hapBranches.length > 0 ? `★ 합(合) 들어온 지지: ${s.hapBranches.join(", ")} — 만남 기회 활발, 결단 시기 좋음` : ""}

[★★★★★ 출력 룰]
- 원본 본문의 톤·말투·분량 그대로 유지. ### 헤더("### 올해 연애에서 조심할 흐름") 그대로.
- 일반 조언(솔직해져라 / 속도 조절) 표현을 위 세운 데이터로 구체화.
- 상반기/하반기 또는 계절감으로 흐름 표현 가능. 단 "운명 만남" 같은 사건 확정 금지.
- 위 처방 데이터에 없는 사건·장소·행동 절대 만들지 말 것.
- 충(沖) 걸린 시기는 본문에 명시 — "이 시기엔 큰 결정 자제" 권장. 단 데이터에 충 있을 때만.
- 합(合)이 있으면 "이 시기 만남 활발" 분위기 본문에 자연스럽게.
- 충·합 데이터가 비어 있으면 그 문장 만들지 말 것 (지어내기 금지).
- 결핍 낙인 금지.
- 한자·전문용어 추가 금지.
- "~에요" 어미. ${name}님 호칭 정확히.
- 이 prompt에 인용된 안내 어휘를 본문에 그대로 박지 말 것.
- 결과는 본문만. 헤더 "### 올해 연애에서 조심할 흐름"부터 시작.

[금지 표현]
- "반드시 만남", "이번 봄 운명", "큰 사건" 등 사건 확정
- 동물·자연 상징 직역
- 결핍 낙인
`;
}
