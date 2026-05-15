// ════════════════════════════════════════════════════════════════════
// 평생사주 Factor Allocation Matrix (2026-05-14)
// ────────────────────────────────────────────────────────────────────
// 연애사주 lib/hongsil/sub-distribution.ts:DISTRIBUTIONS + ch*-*.ts 의 평생사주판.
//
// 각 sub에 7요소 명시 — 인자 배분 + 글 모양 + 단락 구성 + 장면 + cadence + 분량.
//   primaryFactors  : PRIMARY 인자 조합 (결론은 여기서만)
//   conclusionAngle : 결론 각도 (다른 sub와 차별화의 핵심)
//   pattern         : 글 모양 (관찰 단언형 / 처방형 / 경고형 / 시기형 / 대비형 …)
//   cadence         : 첫 줄 시작 방식 (한 섹션 안에서 모두 달라야 함)
//   sceneSlot       : 일상 장면 소재 (sub마다 다르게 — 반복 금지)
//   composition     : 단락 구성 (기본 5단락 표준, 특수 패턴만 override)
//   lengthRange     : 분량 (기본 400~550자)
//
// 프롬프트도 검수도 이 테이블 하나를 소스로 삼는다.
// ════════════════════════════════════════════════════════════════════

// ⭐ V2.4.0 (2026-05-15) — 목차 정리: 47 sub → 25 sub, 11 챕터 → 10 챕터
// love2/love3/timeline2/closing 통째 삭제, compass에 closing 통합.
export type SajuSectionKey =
  | "opener" | "personality1" | "personality2"
  | "money1" | "money2" | "love1"
  | "health" | "hidden" | "timeline1"
  | "compass";

export interface SubAllocation {
  subId: string;
  title: string;
  primaryFactors: string[];
  conclusionAngle: string;
  pattern: string;
  cadence: string;
  sceneSlot: string[];
  composition?: string;   // 기본 5단락 표준 — 특수 패턴만 override
  lengthRange?: string;   // 기본 "400~550자"
  note?: string;
}

export interface SectionAllocation {
  key: SajuSectionKey;
  title: string;
  sectionAngle: string;
  subs: SubAllocation[];
}

// 기본 단락 구성 (산문체 5단락) — 대부분 sub 공통
const STD_COMP = "① Lead(결론 단언) → ② 사주 메커니즘(PRIMARY 인자로 왜 그런지) → ③ 일상 장면(구체 상황 1~2개) → ④ 이면(반대 측면·주의점·\"다만\" 대신 \"반대로/주의할 점은\") → ⑤ Close(다음 결로 자연스럽게 잇거나 정리)";
const WARN_COMP = "① 위험 결 단언 → ② 사주 메커니즘(어떤 인자가 만드는지) → ③ 일상에서 새는 신호 → ④ 벗어나는 한 수(구체 행동·습관 — '처방'·'개운법' 단어 본문에 쓰지 말 것) → ⑤ Close";
const TIME_COMP = "① 시기 단언 → ② 사주 메커니즘(대운·세운 근거) → ③ 그 시기 일상 변화 장면 → ④ 준비 방향 → ⑤ Close";
const STD_LEN = "400~550자, 5단락";

// ─── 마스터 배분표 ──────────────────────────────────────────────────
export const SAJU_ALLOCATION: SectionAllocation[] = [
  {
    key: "opener", title: "선인의 첫마디", sectionAngle: "본질",
    subs: [
      { subId: "opener-1", title: "첫마디", primaryFactors: ["일간"], conclusionAngle: "본질 한 줄",
        pattern: "자연 비유형", cadence: "장면", sceneSlot: ["자연 한 컷"], note: "자연 비유 1회. 결론·처방 X. 인자 배분 가벼움" },
    ],
  },
  {
    key: "personality1", title: "나는 어떤 사람인가", sectionAngle: "관찰 — 자기 자신을 어떻게 인식하는가",
    subs: [
      { subId: "personality1-1", title: "겉으로 보이는 나", primaryFactors: ["일간", "월지"], conclusionAngle: "첫인상·사회적 표정",
        pattern: "관찰 단언형", cadence: "결론 단언", sceneSlot: ["첫 만남", "여러 사람 모인 자리", "낯선 환경"] },
      { subId: "personality1-2", title: "혼자 있을 때의 나", primaryFactors: ["일지", "인성"], conclusionAngle: "내면 독백",
        pattern: "관찰 단언형", cadence: "일상 한 컷", sceneSlot: ["퇴근 후 혼자", "주말 오전", "잠들기 전"] },
      { subId: "personality1-3", title: "자주 반복되는 마음의 습관", primaryFactors: ["강한 십성"], conclusionAngle: "마음 루틴",
        pattern: "신호 포착형", cadence: "짧은 단정+호명", sceneSlot: ["결정 직전", "거절해야 할 때", "기다리는 시간"] },
      // V2.4.0: personality1-4 "나를 움직이게 하는 기준" 삭제 (compass-2와 결정 동기 중복)
    ],
  },
  {
    key: "personality2", title: "타고난 재능의 방향", sectionAngle: "능력 — 재능이 발현되는 방식",
    subs: [
      { subId: "personality2-1", title: "자연스럽게 잘하는 일", primaryFactors: ["식상", "일간"], conclusionAngle: "발현되는 강점",
        pattern: "능력 발현형", cadence: "결론 단언", sceneSlot: ["몰입하는 순간", "남이 어려워하는 일", "시간 가는 줄 모를 때"] },
      { subId: "personality2-2", title: "배우고 성장하는 방식", primaryFactors: ["인성"], conclusionAngle: "흡수·학습 결",
        pattern: "능력 발현형", cadence: "일상 한 컷", sceneSlot: ["새 걸 배울 때", "혼자 정리하는 시간", "조언을 들을 때"] },
      // V2.4.0: personality2-3 "일할 때 빛나는 환경" 삭제 (money2-1·money2-3과 환경 중복)
      { subId: "personality2-4", title: "재능을 막는 습관", primaryFactors: ["기신", "과다 오행"], conclusionAngle: "막힘 패턴",
        pattern: "경고형", cadence: "짧은 단정+호명", sceneSlot: ["일이 안 풀릴 때", "미루게 될 때", "스스로 막히는 순간"],
        composition: WARN_COMP },
    ],
  },
  {
    key: "money1", title: "돈과 현실 감각", sectionAngle: "행동 — 돈을 다루는 구체 행동·습관",
    subs: [
      // ⭐ V2.4.0 — money1-1 title 변경: "시기별 돈이 들어오는 흐름" → "인생 4단계 재산 흐름 (초년·청년·중년·말년)"
      // 4단계별 1단락씩 풀이 강제로 구조 명확화 (차트와 일치)
      { subId: "money1-1", title: "인생 4단계 재산 흐름 (초년·청년·중년·말년)", primaryFactors: ["대운", "재성"], conclusionAngle: "4단계별 강약 (그래프 해설)",
        pattern: "시기형", cadence: "시간 묘사", sceneSlot: ["초년기 10~20대", "청년기 30~40대", "중년기 50대", "말년기 60대+"],
        composition: "① 4단계 곡선 한 줄 단언 → ② 초년기(10~20대) 점수·결 1단락 → ③ 청년기(30~40대) 점수·결 1단락 → ④ 중년기(50대) 점수·결 1단락 → ⑤ 말년기(60대+) 점수·결 1단락 + 마무리",
        lengthRange: "550~700자, 5단락",
        note: "SajuLifeWealthCurve 차트와 정확 일치 의무. 4단계 점수는 dataBlock 〖4단계 재산 곡선〗 그대로 인용 (액수 단정 X). 각 단계별 1단락씩 별도 풀이." },
      { subId: "money1-2", title: "돈을 붙잡는 방식", primaryFactors: ["비겁", "관성"], conclusionAngle: "관리 습관",
        pattern: "관찰 단언형", cadence: "결론 단언", sceneSlot: ["돈 들어왔을 때", "지출 결정 순간", "저축·계획 세울 때"] },
      { subId: "money1-3", title: "돈이 새는 패턴", primaryFactors: ["겁재", "충", "공망"], conclusionAngle: "누수 리스크",
        pattern: "경고형", cadence: "짧은 단정+호명", sceneSlot: ["충동 구매 순간", "남에게 빌려줄 때", "큰 결정 앞"],
        composition: WARN_COMP },
      // V2.4.0: money1-4 "현실 감각을 키우는 선택" 삭제 (compass-2와 행동 처방 중복)
    ],
  },
  {
    key: "money2", title: "일과 직업의 방향", sectionAngle: "환경 — 어떤 일·역할·구조에서 빛나는가",
    subs: [
      { subId: "money2-1", title: "잘 맞는 일의 성향", primaryFactors: ["월지", "관성"], conclusionAngle: "일 성향",
        pattern: "관찰 단언형", cadence: "결론 단언", sceneSlot: ["일을 막 시작할 때", "방식을 정할 때", "몰입하는 업무"] },
      // ⭐ V2.4.0 — money2-2 title 변경: "조직과 독립 중 편한 자리" → "직장 vs 사업 — 어디가 더 맞는가" (사업운 분기 명확화)
      { subId: "money2-2", title: "직장 vs 사업 — 어디가 더 맞는가", primaryFactors: ["비겁", "12운성"], conclusionAngle: "직장형/사업형 분기",
        pattern: "대비형", cadence: "질문 던지기", sceneSlot: ["팀에서 일할 때", "혼자 맡을 때", "결정권이 주어질 때"],
        composition: "① 직장형/사업형 중 어디가 편한지 단언 → ② 사주 메커니즘(비겁·12운성으로) → ③ 두 환경에서 각각 보이는 장면 대비 → ④ 반대 환경에서 흔들리는 이면 → ⑤ Close" },
      { subId: "money2-3", title: "피해야 할 일의 환경", primaryFactors: ["기신", "약한 오행"], conclusionAngle: "부적합 환경",
        pattern: "경고형", cadence: "짧은 단정+호명", sceneSlot: ["맞지 않는 자리", "소모되는 환경", "버티기 힘든 순간"],
        composition: WARN_COMP },
      // V2.4.0: money2-4 "2026~2030 일의 흐름" 삭제 (timeline1과 시기 중복)
    ],
  },
  {
    key: "love1", title: "인연과 결혼", sectionAngle: "관계 — 끌리는 사람·거리·결혼",
    subs: [
      { subId: "love1-1", title: "가까워지는 사람의 결", primaryFactors: ["일지", "재성"], conclusionAngle: "끌리는 타입",
        pattern: "관찰 단언형", cadence: "질문 던지기", sceneSlot: ["새 사람을 만날 때", "편해지는 순간", "마음이 가는 자리"] },
      { subId: "love1-2", title: "관계에서 편한 거리", primaryFactors: ["비겁", "식상"], conclusionAngle: "거리감",
        pattern: "관찰 단언형", cadence: "일상 한 컷", sceneSlot: ["가까운 사람과 보낼 때", "혼자 시간이 필요할 때", "연락 주고받을 때"] },
      // ⭐ V2.4.0 — love1-3 title 변경: "사랑과 가족의 자리" → "결혼과 배우자의 결" (결혼운 명확화)
      { subId: "love1-3", title: "결혼과 배우자의 결", primaryFactors: ["배우자궁(일지 십성)", "통근"], conclusionAngle: "결혼운 — 배우자 결·결혼 생활",
        pattern: "관찰 단언형", cadence: "결론 단언", sceneSlot: ["함께 살아가는 일상", "신뢰가 쌓이는 순간", "곁을 지키는 자리"],
        note: "결혼 단정 X — 미혼·이혼·사별·결혼 유지 모든 케이스 가능. 배우자 결 + 결혼 인연 시기 + 결혼 생활 결 3축." },
      // V2.4.0: love1-4 "반복되는 관계 패턴" 삭제 (hidden과 결론 중복)
      // V2.4.0: love2 (3 sub) 통째 삭제 — love1과 결론 중복
      // V2.4.0: love3 (3 sub) 통째 삭제 — 시기는 timeline1·결혼 시기는 love1-3·귀인은 hidden-3에 흡수
    ],
  },
  {
    key: "health", title: "몸과 마음의 리듬", sectionAngle: "리듬 — 몸·마음의 에너지 흐름",
    subs: [
      { subId: "health-1", title: "몸이 약해지는 신호", primaryFactors: ["약한 오행"], conclusionAngle: "신체 신호 (오행→몸 부위)",
        pattern: "신호 포착형", cadence: "일상 한 컷", sceneSlot: ["몸이 무거운 날", "피로가 쌓일 때", "환절기"] },
      // V2.4.0: health-2 "마음이 지치는 패턴" 삭제 (hidden과 결론 중복)
      { subId: "health-3", title: "회복이 빠른 생활 리듬", primaryFactors: ["용신", "12운성"], conclusionAngle: "회복 리듬",
        pattern: "처방형", cadence: "결론 단언", sceneSlot: ["하루 리듬", "재충전하는 시간", "기운이 도는 순간"],
        composition: "① 어떤 리듬이 회복에 맞는지 단언 → ② 사주 메커니즘(용신·12운성으로) → ③ 위 처방 데이터의 방향·색·음식·행동 중 1~3개를 일상 장면으로 → ④ 무리하기 쉬운 이면 → ⑤ Close" },
      // V2.4.0: health-4 "피해야 할 과로 방식" 삭제 (hidden-1 과해지면 흔들리는 기운과 결론 중복)
    ],
  },
  {
    key: "hidden", title: "사주의 그늘 — 신살과 조심할 흐름", sectionAngle: "방어 — 약점이 반복되는 방식 + 도움받는 결",
    subs: [
      { subId: "hidden-1", title: "과해지면 흔들리는 기운", primaryFactors: ["과다 오행", "격국 변화"], conclusionAngle: "과잉 흔들림",
        pattern: "경고형", cadence: "짧은 단정+호명", sceneSlot: ["기운이 넘칠 때", "한쪽으로 쏠리는 순간"],
        composition: WARN_COMP },
      // V2.4.0: hidden-2 "운이 막힐 때 나오는 습관" 삭제 (love1·health와 결론 중복)
      { subId: "hidden-3", title: "조심해야 할 신살", primaryFactors: ["흉살(괴강·백호·현침·양인)"], conclusionAngle: "신살 경고",
        pattern: "경고형", cadence: "결론 단언", sceneSlot: ["충돌이 생기는 자리", "예리함이 과해지는 순간"],
        composition: WARN_COMP },
      // ⭐ V2.4.0 — hidden-4 title 변경: "내 결을 살리는 안전장치" → "어려울 때 도와주는 귀인과 복" (일반인 즉시 이해)
      { subId: "hidden-4", title: "어려울 때 도와주는 귀인과 복", primaryFactors: ["길성(천을·월덕·문창·태극·학당·금여)"], conclusionAngle: "귀인·복록 — 어려운 시기에 받쳐주는 결",
        pattern: "처방형", cadence: "질문 던지기", sceneSlot: ["위기를 넘기는 순간", "복록이 따라오는 자리"],
        note: "천을귀인 포함 모든 길성 통합 (love3 귀인 흡수)" },
    ],
  },
  {
    key: "timeline1", title: "시기별 흐름", sectionAngle: "시기 — 큰 흐름의 전환점 (돈 제외, money1 담당)",
    subs: [
      { subId: "timeline1-1", title: "지금 대운의 핵심", primaryFactors: ["현재 대운", "일간 상호작용"], conclusionAngle: "현재 흐름 (일·관계·심리)",
        pattern: "시기형", cadence: "결론 단언", sceneSlot: ["요즘 자주 겪는 변화", "지금 마주한 자리"],
        composition: TIME_COMP },
      { subId: "timeline1-2", title: "2026년 흐름", primaryFactors: ["2026 세운"], conclusionAngle: "올해 변화",
        pattern: "시기형", cadence: "시간 묘사", sceneSlot: ["올해 상반기", "올해 하반기", "계절 전환점"],
        composition: TIME_COMP, note: "위 처방 데이터의 방향·계절·시간대 중 올해 흐름과 맞는 1~2개만 자연스럽게 녹임. 돈 영역 X" },
      { subId: "timeline1-3", title: "2027년부터 2030년까지의 흐름", primaryFactors: ["향후 대운 전환"], conclusionAngle: "가까운 미래",
        pattern: "시기형", cadence: "질문 던지기", sceneSlot: ["다가올 전환점", "준비할 몇 년"],
        composition: TIME_COMP },
    ],
  },
  // V2.4.0: timeline2 (3 sub) 통째 삭제 — timeline1과 시기 100% 중복
  {
    key: "compass", title: "종합 — 평생 가져갈 방향", sectionAngle: "종합 선택 + 시적 마무리",
    subs: [
      { subId: "compass-1", title: "평생 가져갈 핵심 키워드", primaryFactors: ["격국", "일간"], conclusionAngle: "본질 한 방향 (종합)",
        pattern: "종합형", cadence: "짧은 단정+호명", sceneSlot: ["평생 반복되는 자리", "변하지 않는 결"] },
      // ⭐ V2.4.0 — compass-2 + compass-3 + closing-1 통합: "잘 풀리는 선택과 마지막 방향" 한 sub
      { subId: "compass-2", title: "잘 풀리는 선택과 마지막 방향", primaryFactors: ["용신", "일간"], conclusionAngle: "선택 기준 + 시적 마무리",
        pattern: "처방+위로 통합형", cadence: "결론 단언", sceneSlot: ["선택의 갈림길", "살아온 결", "앞으로의 자리"],
        composition: "① 어떤 선택이 잘 풀리는지 단언 → ② 사주 메커니즘(용신으로) → ③ 위 처방 데이터(방향·색·행동·시간대·계절·음식) 중 가장 와닿는 2~4개를 일상 장면으로 → ④ 일간 본질을 따뜻하게 회상하며 시적 마무리 (한 단락)",
        lengthRange: "550~700자, 5단락",
        note: "기존 compass-2(선택 기준) + compass-3(마지막 방향) + closing(묵도인의 한 마디) 3개를 한 sub에 통합. 전반부는 처방, 후반부는 위로." },
      // V2.4.0: compass-3 삭제 (compass-2에 시적 마무리 통합)
      // V2.4.0: closing 섹션 삭제 (compass-2에 통합)
    ],
  },
];

// ─── 헬퍼 ───────────────────────────────────────────────────────────
export function getSectionAllocation(key: string): SectionAllocation | undefined {
  return SAJU_ALLOCATION.find((s) => s.key === key);
}

export function getSubAllocation(subId: string): SubAllocation | undefined {
  for (const sec of SAJU_ALLOCATION) {
    const sub = sec.subs.find((s) => s.subId === subId);
    if (sub) return sub;
  }
  return undefined;
}

// ─── 검증: 같은 (PRIMARY 조합 + ANGLE) / cadence 중복 / 인자 과다 ─────
export function validateAllocation(): string[] {
  const violations: string[] = [];
  const seen = new Map<string, string>();
  for (const sec of SAJU_ALLOCATION) {
    for (const sub of sec.subs) {
      const comboKey = [...sub.primaryFactors].sort().join("+") + "|" + sub.conclusionAngle;
      const prev = seen.get(comboKey);
      if (prev) {
        violations.push(`중복: ${sub.subId} ↔ ${prev} — 같은 PRIMARY 조합+ANGLE (${comboKey})`);
      } else {
        seen.set(comboKey, sub.subId);
      }
    }
    // 섹션 내 cadence 중복 검사
    const cadences = sec.subs.map((s) => s.cadence);
    const dupCadence = cadences.filter((c, i) => cadences.indexOf(c) !== i);
    if (dupCadence.length > 0) {
      violations.push(`cadence 중복: ${sec.key} — ${[...new Set(dupCadence)].join(", ")} 가 한 섹션에 2회+`);
    }
  }
  // 인자별 PRIMARY 등장 횟수
  const factorCount = new Map<string, string[]>();
  for (const sec of SAJU_ALLOCATION) {
    for (const sub of sec.subs) {
      for (const f of sub.primaryFactors) {
        if (!factorCount.has(f)) factorCount.set(f, []);
        factorCount.get(f)!.push(sub.subId);
      }
    }
  }
  for (const [f, subs] of factorCount.entries()) {
    if (subs.length > 5) {
      violations.push(`과다 배분 경고: "${f}" — ${subs.length}회 PRIMARY (${subs.join(", ")})`);
    }
  }
  return violations;
}

// ─── 프롬프트 블록 생성 ─────────────────────────────────────────────
// 섹션의 배분표를 prompt 텍스트로. 각 sub의 7요소(인자·각도·패턴·cadence·장면·구성·분량) 출력.
export function buildAllocationBlock(key: string): string {
  const sec = getSectionAllocation(key);
  if (!sec || sec.subs.length === 0) return "";
  if (key === "opener" || key === "closing") {
    return `\n[인자 배분] 이 섹션은 ${sec.subs[0].primaryFactors.join("·")}만 가볍게 — 결론·처방 X. ${sec.subs[0].lengthRange ?? "짧게"}.`;
  }

  const allPrimaryInSection = new Set<string>();
  for (const sub of sec.subs) for (const f of sub.primaryFactors) allPrimaryInSection.add(f);

  const lines: string[] = [];
  lines.push(`\n[★★★★★ 인자 배분표 — 아래 ${sec.subs.length}개 소제목을 정확히 이 순서·이 제목 그대로 작성]`);
  lines.push(`이 섹션 ANGLE: ${sec.sectionAngle}`);
  lines.push(`각 소제목은 (1) 배정된 PRIMARY 인자로만 결론 도출 (2) 지정된 글 패턴·단락 구성 따름 (3) 지정 cadence로 첫 줄 시작 (4) 지정 장면 소재 사용.`);
  for (const sub of sec.subs) {
    const others = [...allPrimaryInSection].filter((f) => !sub.primaryFactors.includes(f));
    lines.push(`### ${sub.title}`);
    lines.push(`  · PRIMARY (결론은 이것만): ${sub.primaryFactors.join(" + ")}`);
    lines.push(`  · 결론 각도: ${sub.conclusionAngle}`);
    lines.push(`  · 글 패턴: ${sub.pattern}`);
    lines.push(`  · 첫 줄 cadence: ${sub.cadence} (이 섹션 내 다른 소제목과 겹치지 않음)`);
    lines.push(`  · 단락 구성: ${sub.composition ?? STD_COMP}`);
    lines.push(`  · 분량: ${sub.lengthRange ?? STD_LEN}`);
    lines.push(`  · 장면 소재(이것만, 다른 소제목과 반복 X): ${sub.sceneSlot.join(" / ")}`);
    if (others.length > 0) {
      lines.push(`  · 결론 근거 금지(보조 언급만 OK): ${others.join(", ")}`);
    }
    if (sub.note) lines.push(`  · 메모: ${sub.note}`);
  }
  lines.push(`★ 규칙: 배정된 PRIMARY 인자로만 그 소제목의 결론을 내세요. 다른 소제목의 PRIMARY를 끌어다 결론 내면 중복입니다.`);
  lines.push(`★ 같은 인자라도 소제목마다 결론 각도·글 패턴이 다릅니다 — 각도에 맞는 결론, 패턴에 맞는 글 모양.`);
  lines.push(`★ ### 소제목은 위 제목 그대로, 위 순서대로. 임의 추가·삭제·변경 금지.`);
  lines.push(`★ 단락 구성을 정확히 따르되, 각 단락은 줄바꿈으로 분리. 한 덩어리 장문 금지. ④ 이면 단락 — "다만"으로 억지로 꺾지 말고 "반대로 / 주의할 점은 / 이럴 때는" 으로 전환.`);
  lines.push(`★★★ 인용 의무: 각 소제목 본문에 그 소제목의 PRIMARY 인자 이름을 **최소 1회 명사로 직접 인용** (예: "재성(財星)이…", "용신인 화 기운이…"). 인자 근거 없이 일반 조언만 쓰면 바넘 표현으로 실패. 처방·선택·마무리 성격 소제목도 PRIMARY 인자에서 근거를 끌어와 시작.`);
  return lines.join("\n");
}
