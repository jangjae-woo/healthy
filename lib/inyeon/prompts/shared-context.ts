// 인연 전용 — 모달 선택값을 톤 가이드로 변환
// 평생사주·엄마와아이 모듈에서 import 금지 (격리)
import {
  InyeonEntryChoice, RELATIONSHIP_LABEL, DURATION_LABEL,
} from "../types";

export function buildChoiceContext(c: InyeonEntryChoice): string {
  const tone = relationshipTone(c.relationship);
  const stage = stageGuide(c);
  return `[관계 유형] ${RELATIONSHIP_LABEL[c.relationship]}
[만난 기간] ${DURATION_LABEL[c.duration]}
[관계 톤 가이드] ${tone}
[관계 단계 톤] ${stage}`;
}

function relationshipTone(r: InyeonEntryChoice["relationship"]): string {
  switch (r) {
    case "crush":
      return "한쪽의 마음이 더 깊은 단계. '상대방이 어떤 사람인지', '내 마음이 닿을 가능성', '먼저 다가가는 것이 좋은지'에 초점. 결혼·동거 같은 장기 가정사 표현은 피하고 끌림과 첫 다가감의 결로.";
    case "talking":
      return "관계가 막 시작되는 탐색 단계. 첫인상·서로의 매력·고백 타이밍 중심. 단정적 미래 표현 자제, 가능성과 흐름의 결로.";
    case "dating_short":
      return "연애 초기. 끌림과 적응이 동시에 일어나는 시기. 갈등의 전조·서로 맞춰가는 법·이 시기를 잘 넘기는 조언 중심.";
    case "dating_long":
      return "안정기에 들어선 연인. 권태·미래 설계·서운함이 쌓이는 결을 풀이. 결혼 가능성도 자연스럽게 다룰 수 있음.";
    case "married":
      return "이미 부부. 자녀·재정·집안일·권태기 같은 현실 결혼생활의 결을 풀이. 끌림보다 관계 유지·회복의 결로.";
    case "exboyfriend":
      return "이미 한 번 어긋난 인연. 왜 어긋났는지·재회 가능성·다시 만났을 때의 흐름 중심. '재회가 무조건 좋다'는 단정 금지, 양쪽 가능성 모두 짚기.";
  }
}

function stageGuide(c: InyeonEntryChoice): string {
  const short = c.duration === "lt_1m" || c.duration === "1to3m";
  const long = c.duration === "1to3y" || c.duration === "gt_3y";
  if (short) {
    return "아직 짧은 시간이라 깊은 갈등은 드러나지 않은 단계. 표면적 끌림과 첫 결을 중심으로, 앞으로 드러날 결을 미리 짚어주는 톤.";
  }
  if (long) {
    return "시간이 충분히 쌓여 두 사람의 결이 이미 드러난 단계. 누적된 갈등·서운함·익숙함을 구체적으로 풀어내는 톤.";
  }
  return "관계가 한창 깊어지는 중간 단계. 끌림과 갈등이 같이 보이는 결로 균형있게.";
}
