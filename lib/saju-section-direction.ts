// 평생사주 섹션별 ANGLE(렌즈) Matrix (2026-05-14)
//
// 문제: 평생사주는 13 섹션이 모두 같은 사주 인자(비겁·재성·식상·관성·인성·일간·강약 등)
//      를 다른 각도로 풀어야 함. 그러나 LLM은 같은 인자 → 같은 결론으로 수렴해서
//      "혼자서 결정하지 마세요" 같은 결론이 여러 섹션에서 반복됨.
//
// 해결: 각 섹션에 명시적 ANGLE(렌즈)를 prompt에 주입.
//      같은 인자라도 ANGLE이 다르면 결론이 다르게 나옴.
//      hongsil의 SLOT 시스템과 같은 패턴 — 평생사주는 1인이라 SLOT 대신 LENS.
//
// 예: 비겁(자기 결) 강함
//   - personality1(관찰 LENS): "자기 색이 진해 외부 시선 덜 신경 씀"
//   - personality2(능력 LENS): "자기 영역에서 발휘 — 자기 길을 끌고 가는 결"
//   - money1(행동 LENS): "수입은 자기 결정 + 책임. 충동 소비 조심"
//   - money2(환경 LENS): "자영업·독립 환경에서 빛남"
//   - love1(거리 LENS): "사람과 거리 두는 결. 자기 시간 필요"
//   - hidden(방어 LENS): "충돌·고집 조심. 양보 어려움"
//   - timeline1(시기 LENS): "30대 자기 결을 시험하는 시기"

export type SajuSection =
  | "personality1" | "personality2"
  | "money1" | "money2"
  | "love1" | "love2" | "love3"
  | "health" | "hidden"
  | "timeline1" | "timeline2"
  | "compass" | "closing"
  | "overview" | "opener";

// 각 섹션의 ANGLE — 같은 인자를 어느 각도로 풀어내는지
const SECTION_ANGLE: Record<SajuSection, { label: string; desc: string; example: string }> = {
  opener: {
    label: "도입",
    desc: "일간 자연 비유 + 본인 본질 한 줄. 결론·처방 X",
    example: "병화(丙火)는 한낮의 태양. 모든 것을 비추되 그늘에서 쉬는 결",
  },
  overview: {
    label: "개요",
    desc: "사주 원국 전체 구조 한 번 — personality 이후 섹션의 토대",
    example: "월지 식상 + 일간 약 + 강한 재성 흐름",
  },
  personality1: {
    label: "관찰 LENS",
    desc: "본인이 자기 자신을 어떻게 인식하는지. 외적/내적 표정·행동 양상. 결론은 '~한 모습입니다' 형태",
    example: "자기 색이 진해 외부 시선 덜 신경 쓰는 모습",
  },
  personality2: {
    label: "능력 LENS",
    desc: "타고난 재능·강점이 발현되는 방식. 어디서 빛나는지. 결론은 '~로 발휘됩니다' 형태",
    example: "자기 영역에서 발휘 — 자기 길 끌고 가는 결",
  },
  money1: {
    label: "행동 LENS",
    desc: "돈을 다루는 구체 행동·수입·지출 패턴. 결론은 '~한 습관입니다' 형태",
    example: "수입은 자기 결정·책임. 충동 소비 조심",
  },
  money2: {
    label: "환경 LENS",
    desc: "일·역할·조직 구조 적합도. 어떤 환경에서 빛나는지. 결론은 '~한 자리가 맞습니다' 형태",
    example: "자영업·독립 환경에서 빛남",
  },
  love1: {
    label: "거리 LENS",
    desc: "사람과의 거리감·태도. 가까이/멀리 두는 결. 결론은 '~한 거리가 편합니다' 형태",
    example: "사람과 거리 두는 결. 자기 시간 필요",
  },
  love2: {
    label: "선택 LENS",
    desc: "가까이 두고 싶은 사람의 특징. 끌리는 타입. 결론은 '~한 분과 잘 맞습니다' 형태",
    example: "차분히 듣는 분 — 본인의 강한 결을 받아주는 결",
  },
  love3: {
    label: "지속 LENS",
    desc: "오래 가는 관계의 조건. 결혼·장기 인연 단정 X. 결론은 '~할 때 관계가 깊어집니다' 형태",
    example: "감정 표현을 천천히 늘려갈 때 관계가 깊어짐",
  },
  health: {
    label: "리듬 LENS",
    desc: "몸·마음의 에너지 흐름. 의료 진단 X. 결론은 '~한 리듬입니다' 형태",
    example: "오전엔 차분 / 오후 강세 / 밤엔 회복 — 한낮 에너지 결",
  },
  hidden: {
    label: "방어 LENS",
    desc: "약점이 반복되는 방식·자기 방어 습관. 결론은 '~한 패턴이 반복됩니다' 형태",
    example: "충돌 회피 후 속으로 쌓아둠. 양보 어려움",
  },
  timeline1: {
    label: "시기 LENS",
    desc: "큰 흐름(대운)의 전환점. 결론은 '~한 시기입니다' 형태",
    example: "30대 후반 자기 색 단단히 하는 결",
  },
  timeline2: {
    label: "5년 LENS",
    desc: "가까운 미래(2026~2030 세운) 흐름·준비 방향. 결론은 '~로 준비하시면 됩니다' 형태",
    example: "2027년 봄 새로운 자리. 2029년 가을 한 단계 무르익는 결",
  },
  compass: {
    label: "종합 선택 LENS",
    desc: "전체 풀이의 결정판 — 선택 기준 + 처방. 결론은 '~을 우선하시면 됩니다' 형태",
    example: "사람보다 자기 리듬 우선. 가을·서쪽 환경에서 결단",
  },
  closing: {
    label: "위로 LENS",
    desc: "마지막 한 마디 — 단정 X, 감정적 마무리",
    example: "한결같이 살아온 결을 믿으세요",
  },
};

// 섹션 간 중복 회피 룰 — prompt에 prepend
export function buildSectionDirection(section: SajuSection): string {
  const angle = SECTION_ANGLE[section];
  if (!angle) return "";

  const otherSections = (Object.keys(SECTION_ANGLE) as SajuSection[])
    .filter((s) => s !== section && s !== "opener" && s !== "overview" && s !== "closing")
    .filter((s) => s !== section);

  return `

[★★★★ 이 섹션의 ANGLE — 같은 사주 인자도 이 각도로만 풀이]
- ANGLE: **${angle.label}** — ${angle.desc}
- 결론 톤 예시: "${angle.example}"

[★★★★ Cross-Section 중복 회피 룰 — 가장 중요]
같은 사주 인자(비겁·식상·재성·관성·인성·일간·강약·신살·용신·기신)를 다른 섹션과 공유하지만, **결론은 이 섹션의 ANGLE에 맞게 다른 방향으로** 풀어내세요.

★ 다른 섹션에서 이미 사용된 결론 톤은 절대 반복 X:
- personality1(관찰): "~한 모습입니다"
- personality2(능력): "~로 발휘됩니다"
- money1(행동): "~한 습관입니다"
- money2(환경): "~한 자리가 맞습니다"
- love1(거리): "~한 거리가 편합니다"
- love2(선택): "~한 분과 잘 맞습니다"
- love3(지속): "~할 때 관계가 깊어집니다"
- health(리듬): "~한 리듬입니다"
- hidden(방어): "~한 패턴이 반복됩니다"
- timeline1(시기): "~한 시기입니다"
- timeline2(5년): "~로 준비하시면 됩니다"
- compass(종합): "~을 우선하시면 됩니다"

★ 절대 금지된 결론(여러 섹션에서 반복되어 LLM 결함):
- "혼자서 결정하지 마세요" (이 표현은 어느 섹션에서도 X)
- "주변과 함께/협력해서/도움을 구하세요" (모든 섹션에서 결론 톤 X)
- "신중하게/차분하게 ~하세요" (이 사주만의 결과 무관)
- "강한 책임감을 가지고 있습니다" (바넘 표현)
- 같은 인자(예: 비겁이 약함)로 두 섹션에서 같은 결론을 도출하면 **자동 회귀 회피** 룰 위반.

★ 같은 인자 다른 ANGLE 예시 (비겁이 옅은 경우):
- personality1(관찰 LENS): "외부 시선에 흔들리는 모습 — 자기 색을 진하게 못 드러내는 결"
- money1(행동 LENS): "혼자 결정한 일에 책임지는 결이 부담스러운 습관"
- money2(환경 LENS): "조직 안에서 받쳐주는 자리가 잘 맞는 환경"
- love1(거리 LENS): "사람과 가까이 두는 결이 편한 거리"
- hidden(방어 LENS): "주장을 미루다 속에 쌓이는 패턴이 반복됩니다"
→ 같은 비겁이지만 결론 톤·방향이 5섹션 모두 다름. 이게 정상.`;
}

export { SECTION_ANGLE };
