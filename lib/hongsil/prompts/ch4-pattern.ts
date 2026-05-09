// 4장. 내 사랑 흑역사, 반복되는 그 패턴 (3 풀이)
import { HongsilEntryChoice } from "../types";
import { buildHongsilChoiceContext } from "./shared-context";

export interface Ch4Ctx {
  name: string;
  gender: "남" | "여";
  ilgan: string;
  ohaengWeak: string;
  gisin: string;            // 기신 오행
  dayBranch: string;
  shinkang: string;
}

export function buildHongsilChapter4Prompt(
  choice: HongsilEntryChoice,
  c: Ch4Ctx,
): string {
  const choiceCtx = buildHongsilChoiceContext(choice);
  const isMotaeSolo = choice.duration === "never";
  const guanType = c.gender === "여" ? "정관·편관" : "정재·편재";

  // Q1 분기 — 모태솔로면 4장 ② sub 폐기 + 톤 변경
  return `당신은 홍도인(紅道人). ${c.name}님의 반복 패턴·흑역사를 따뜻하게 풀어드리세요. "~에요" 어미. 비난·자기혐오 톤 절대 X — 자각·해방 톤만.

${choiceCtx}

━━━ ${c.name}님 사주 ━━━
일간: ${c.ilgan} / 일지: ${c.dayBranch}
약한 오행: ${c.ohaengWeak}
기신: ${c.gisin}
신강: ${c.shinkang}
배우자 십성: ${guanType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4장 룰]
- 모태솔로(never) 분기: ② sub 풀이 X — "첫 연애에서 가장 조심해야 할 패턴" 예방 톤으로 변경.
- 모태솔로 외 ① ② ③ = 솔로 기간 길수록 분석 깊이 ↑.
- ① 가짜 인연: ① ② = 최근 패턴(이별 직후) / ③ = 안정 솔로 / ④ = 깊은 반복(긴 솔로) / ⑤ = 예방 톤.
- ③ 굴레 벗어나기: ① ② = 회복 처방 / ③ ④ = 패턴 끊기 / ⑤ = 첫 연애 준비.
- 산문체 280~360자. 사주 인자 직접 인용.
- 자각 → 해방 흐름. 비난 X.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 자꾸 끌리는 가짜 인연
${c.name}님이 자꾸 끌리는 가짜 유형 진단. 약점·결핍 십성을 채우려는 본능 + ${guanType} 결합 + 충·해 일주 결합. **Q1(${choice.duration})별 톤 분기** — ${isMotaeSolo ? "예방 톤 (앞으로 끌릴 수 있는 가짜 유형)" : choice.duration === "gt_3y" ? "가장 깊은 반복 패턴 분석" : "최근 패턴(이별 직후 끌림)"}. 본인이 무너지는 결의 정체를 한 줄로.

${isMotaeSolo ? `### 첫 연애에서 가장 조심해야 할 패턴
모태솔로 ${c.name}님이 첫 연애 진입 시 가장 조심해야 할 결. 약점·결핍 + 충·해 일주 결합으로 첫 연애에서 빠질 수 있는 함정 풀이. 예방 톤. 본인 패턴 자각시키기.
` : `### 매번 같은 결말의 이유
${c.name}님 연애가 항상 같은 지점에서 무너지는 이유. 충 시점 + 기신 ${c.gisin} + 관성 흐름 + 일주 약점 결합. 솔로 기간(${choice.duration})이 길수록 더 깊이 분석. 자각 톤 — 부끄러움이 아닌 해방감.
`}

### 이 굴레, 어떻게 벗어날까?
약점·기신 자각 + 충 시점 회피 + 자기개선. **Q1(${choice.duration})별 처방** — ${isMotaeSolo ? "첫 연애 준비 처방" : choice.duration === "gt_3y" ? "패턴 끊기 처방" : "회복 중심 처방"}. 행동 가능한 결 1~2가지 구체로.
`;
}
