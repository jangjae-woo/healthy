// 부모자녀 해석 기획 레이어 (2026-05-13)
// hongsil의 interpretation-plan 패턴을 자도인 톤으로 변형.
// 자녀 사주 기반 5 lens + 챕터별 정책.

import type { SajuAnalysis } from "../saju-calculator";

export type ParentChildPlanScope = "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "outro";

// ⭐ Step B (2026-05-14) — 연령 톤 강제 룰
// 영유아(0~2)에게 책상·도서관·연구자 같은 학령기 어휘 노출 차단
export type AgeStage = "infant" | "toddler" | "preschool" | "elementary" | "middle" | "high" | "adult";

export function classifyAgeStageFromYear(birthYear: number): AgeStage {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 2) return "infant";       // 0~2 영아
  if (age <= 4) return "toddler";      // 3~4 유아
  if (age <= 6) return "preschool";    // 5~6 학령 전기
  if (age <= 12) return "elementary";  // 7~12 초등
  if (age <= 15) return "middle";      // 13~15 중등
  if (age <= 18) return "high";        // 16~18 고등
  return "adult";                       // 19+ (이론상 사용 안 됨, 부모자녀 풀이는 자녀 만 19세 이하)
}

const AGE_TONE_RULES: Record<AgeStage, { allow: string; forbid: string; tone: string }> = {
  infant: {
    allow: "기어다니기·옹알이·작은 손짓·시선·옹알대는 표현·낮잠·이유식·낯가림·웃음·울음·껴안기·놀이매트·자장가·동요·그림책·만지고 듣고 보는 자극.",
    forbid: "책상·도서관·연구자·콘텐츠 제작자·기획자·교수·교육자·학교 운동장·조별 활동·발표·5명 팀·끝맺음·자기 학습 계획·메시지 창·노트 정리·전공·진로·이성 친구·연애·결혼·취업·시험·논문·도서·실험실·서재.",
    tone: "현재 무엇을 할 수 있는지(영유아 행동) + '자라면서 ~할 결' 미래형 혼합. 학령기·청소년·성인 어휘 절대 X. 결혼·취업 같은 먼 미래는 '훗날' 1~2회만.",
  },
  toddler: {
    allow: "걷기·뛰기·말 시작·놀이방·블록·동화책·낯선 사람 반응·낮잠·반항기·고집·웃음·울음·소꿉놀이·바깥 놀이·물놀이·자기 표현 시작.",
    forbid: "책상에 앉아 공부·도서관·노트 정리·발표·조별 활동·연구자·콘텐츠 제작자·기획자·교수·5명 팀·끝맺음·진로·연애.",
    tone: "현재(유아 행동) + '자라면서 ~할 결' 미래형. 학령기 어휘 X. 학습은 '놀이 속에서 배우는 결'로.",
  },
  preschool: {
    allow: "유치원·또래 친구·소꿉놀이·역할 놀이·간단한 그리기·블록·동화책·낯선 환경 적응·자기 의견 표현 시작·줄 서기·차례 지키기.",
    forbid: "도서관에서 혼자 책·노트 정리·발표·조별 활동·연구자·기획자·5명 팀·진로·연애.",
    tone: "유치원 일상 + '자라면서' 미래형 일부. 학령기 직접 어휘 자제.",
  },
  elementary: {
    allow: "학교·교실·운동장·도서관·친구·과제·일기·시간표·동아리·조별 활동·발표·여행·취미·악기·운동.",
    forbid: "전공·진로·취업·연구자·교수 같은 직업명 직접 나열 (대신 '자라면서 ~할 결' 미래형).",
    tone: "초등 일상 어휘 OK. 직업·진로는 미래형으로만.",
  },
  middle: {
    allow: "학교·시험·동아리·친구·진로 탐색·자기 정체성·이성 친구·취미 심화·운동·예술.",
    forbid: "성인 직업·결혼 직접 묘사 (미래형으로만).",
    tone: "사춘기 톤. 정체성 형성 시기 강조.",
  },
  high: {
    allow: "고등·진학·진로·시험·동아리·인간관계 깊이·정체성·미래 계획.",
    forbid: "결혼·취업 직접 묘사는 미래형으로만.",
    tone: "고등 톤. 진로 탐색·정체성 확립 중심.",
  },
  adult: {
    allow: "(부모자녀 풀이는 자녀 만 19세 이하 전제 — 이 케이스 거의 없음)",
    forbid: "—",
    tone: "성인 톤.",
  },
};

// ⭐ G13 (2026-05-14) — 연령별 sub 헤더 분기
// 발견 사례: 5살(preschool) 풀이에 "우리 아이만의 공부법" / "책상 앞 머릿속" / "글로 정리할까, 말로 표현할까" 같은
// 학령기 sub 헤더가 그대로 노출됨. 5살은 공부·책상·문제집 시나리오 부적합.
// AgeStage별 대안 헤더 + 본문 시나리오 힌트 제공.
export interface AgeAdaptedHeaders {
  ch2_alone: string;
  ch2_method: string;
  ch2_express: string;
  ch2_clock: string;
  ch2_deskMind: string;
  ch2_deskScene: string; // 본문 안에 들어갈 장면 묘사 (펜·책상 → 놀이매트·블록)
  ch3_lie: string;
  ch3_lieContext: string; // "거짓말" 또는 "고집·억지" 같은 문맥 단어
}

export function getAgeAdaptedHeaders(ageStage: AgeStage): AgeAdaptedHeaders {
  const young = ageStage === "infant" || ageStage === "toddler" || ageStage === "preschool";
  if (young) {
    return {
      ch2_alone: "혼자 놀까 함께 놀까",
      ch2_method: "이 아이는 어떻게 배워갈까",
      ch2_express: "입으로 보여줄까 손으로 보여줄까",
      ch2_clock: "아침·낮·밤 어느 때 가장 또렷할까",
      ch2_deskMind: ageStage === "infant" ? "놀이매트 위 머릿속" : "혼자 놀이할 때 머릿속",
      ch2_deskScene: ageStage === "infant"
        ? "놀이매트 위에서 장난감을 만지고 들었다 놓았다 하는 모습, 작은 손으로 그림책 모서리를 만지작거리는 모습"
        : ageStage === "toddler"
        ? "블록을 쌓다가 무너뜨리고 다시 쌓는 모습, 그림책을 손가락으로 짚어보는 모습"
        : "퍼즐 조각을 만지작거리다 한참 들여다보는 모습, 색연필로 종이 위에 동그라미를 그리다 멈추는 모습",
      ch3_lie: ageStage === "infant" || ageStage === "toddler" ? "고집부릴 때" : "거짓말이나 고집이 시작될 때",
      ch3_lieContext: ageStage === "infant" || ageStage === "toddler" ? "고집·억지" : "작은 거짓말·고집",
    };
  }
  return {
    ch2_alone: "혼자 vs 같이",
    ch2_method: "우리 아이만의 공부법",
    ch2_express: "글로 정리할까, 말로 표현할까",
    ch2_clock: "아침·낮·밤 어느 때 가장 또렷할까",
    ch2_deskMind: "책상 앞 머릿속",
    ch2_deskScene: "책상 앞에서 펜을 잡기 전 한 번 들었다 놨다 하는 모습, 문제 하나 풀고 답을 다시 확인하는 모습",
    ch3_lie: "거짓말 했을 때",
    ch3_lieContext: "거짓말",
  };
}

export function parentChildAgeToneBlock(ageStage: AgeStage): string {
  const rule = AGE_TONE_RULES[ageStage];
  const stageKor: Record<AgeStage, string> = {
    infant: "영아 (0~2세)",
    toddler: "유아 (3~4세)",
    preschool: "학령 전기 (5~6세)",
    elementary: "초등 (7~12세)",
    middle: "중등 (13~15세)",
    high: "고등 (16~18세)",
    adult: "성인",
  };

  // ⭐ G6 (2026-05-14) — 영유아·유아·학령전 케이스에 미래형 강제 절대 룰 추가
  // 발견 사례: 부모와자녀3.txt L43 "책상 앞에 앉아 펜을 잡기" / L113 "디자인, 콘텐츠 제작, 연극, 그림, 요리" / L143 "기술 전문가처럼 깊이 탐구"
  // → 가드 strip 대신 prompt 단계에서 미래형으로 자연 생성하도록 강제.
  const futureFormBlock = (ageStage === "infant" || ageStage === "toddler" || ageStage === "preschool") ? `

[★★★★★ 미래형 활용 절대 룰 — 자녀가 어립니다 (${stageKor[ageStage]})]
자녀가 현재 직접 못 하는 행동·분야는 반드시 미래형 prefix로 표현. 현재형 직접 묘사 절대 금지.

★ 미래형 prefix 패턴 (필수 사용):
- "자라면서 ~한 결로 발전할 가능성"
- "커가면서 ~를 좋아하게 될 결"
- "초등 무렵엔 ~할 결"
- "사춘기 즈음 ~한 면모가 드러날 결"
- "훗날 ~한 자리에서 빛날 결"
- "자라면서 책상에 앉아 ~할 때면"
- "커가면서 ~한 분야에 끌릴 결"

★ 잘못된 현재형 묘사 (절대 금지):
- ✗ "이금희양은 책상 앞에 앉아 펜을 잡기 전" (영유아엔 부적합)
- ✗ "이금희양은 연구자처럼 깊이 탐구하는 결" (영유아엔 부적합)
- ✗ "디자인, 콘텐츠 제작, 연극, 그림, 또는 요리" (직업 나열 영유아엔 부적합)
- ✗ "기술 전문가처럼 한 가지를 깊이 탐구" (영유아엔 부적합)
- ✗ "5명 이내의 작고 긴밀한 관계 속에서 리더십" (영유아엔 부적합)

★ 정답 (미래형 변환):
- ✓ "자라면서 책상에 앉아 무언가에 몰두할 때면"
- ✓ "커가면서 연구자처럼 깊이 탐구하는 결로 발전할 가능성"
- ✓ "자라면서 디자인이나 콘텐츠 제작 같은 창의 활동에 끌릴 결"
- ✓ "초등 무렵엔 한 가지를 깊이 탐구하는 면모가 드러날 결"
- ✓ "훗날 작은 자리에서 책임감을 발휘할 결"

★ 현재 영유아·유아가 할 수 있는 일은 현재형 OK:
- ✓ "이금희양은 블록을 쌓다가"
- ✓ "동화책을 보다가"
- ✓ "옹알이를 하다가"
- ✓ "놀이방에서 친구와 어울리다가"

★ 본문 검증 룰:
- 자녀 연령이 0~6세인데 본문에 "책상·도서관·연구자·교수·콘텐츠 제작자·5명 팀·조별 활동·발표·전문가·디자인·연극·요리" 같은 학령기·성인 어휘가 현재형으로 등장하면 그 문장 자체를 미래형으로 다시 쓰기.
- 직업·진로·학문 분야 언급은 100% 미래형 prefix 사용.
` : "";

  return `
[★★★★★ 연령 톤 강제 룰 — 자녀 ${stageKor[ageStage]}]
- 허용 어휘: ${rule.allow}
- 금지 어휘: ${rule.forbid}
- 톤 가이드: ${rule.tone}
- 본문 전체에서 자녀 연령에 맞지 않는 어휘 등장 시 그 단락 전체를 무효 처리 — LLM 자체 검증 강제.
- 학습·관계·빛나는 자리·미래 모두 연령에 맞춰. 0~2세 자녀에게 "책상 앞에 앉아"·"5명 팀에서 리더"·"콘텐츠 제작자"·"조별 활동" 같은 어휘 절대 X. '자라면서 ~할 결' 미래형 표현으로.
${futureFormBlock}`;
}

type Category = "self" | "expression" | "reality" | "standard" | "support";
type PlanCategory = Category | "balanced";

export interface ParentChildInterpretationPlan {
  childName: string;
  topElement: string;
  weakElement: string;
  shinkang: string;
  primaryCategory: PlanCategory;
  secondaryCategory: PlanCategory;
  natureLens: string;       // 본질 — 어떤 결의 아이인가
  learningLens: string;     // 학습 — 어떻게 공부할까
  emotionLens: string;      // 감정 — 칭찬·훈육 받아들이는 방식
  friendLens: string;       // 친구 — 또래와 어떻게 어울리는가
  shineLens: string;        // 빛나는 자리 — 어떤 환경에서 빛나는가
}

const CATEGORY_TERMS: Record<Category, string[]> = {
  self: ["비견", "겁재"],
  expression: ["식신", "상관"],
  reality: ["정재", "편재"],
  standard: ["정관", "편관", "칠살"],
  support: ["정인", "편인", "효신"],
};

const CATEGORY_SCENE: Record<PlanCategory, string> = {
  self: "자기 결을 세우고 또래 안에서 자기 자리를 찾는 감각",
  expression: "마음을 표현하고 풀어내는 결",
  reality: "현실 감각과 손에 잡히는 결과를 챙기는 감각",
  standard: "약속·기준·책임을 받아들이는 결",
  support: "받아들이고 사색하고 깊이 곱씹는 결",
  balanced: "전체 균형에서 드러나는 본질의 결",
};

function elementRank(saju: SajuAnalysis, direction: "top" | "weak"): string {
  const entries = Object.entries(saju.elements as Record<string, number>)
    .filter(([, value]) => Number.isFinite(value));
  if (!entries.length) return "전체";
  entries.sort((a, b) => direction === "top" ? b[1] - a[1] : a[1] - b[1]);
  return entries[0]?.[0] ?? "전체";
}

function sipseongValues(saju: SajuAnalysis): string[] {
  const raw = saju.sipseong as unknown as Record<string, Record<string, string | undefined>>;
  return Object.values(raw)
    .flatMap((v) => Object.values(v ?? {}))
    .filter((v): v is string => typeof v === "string" && v.length > 0);
}

function categoryRank(saju: SajuAnalysis): Array<[Category, number]> {
  const values = sipseongValues(saju);
  return (Object.keys(CATEGORY_TERMS) as Category[])
    .map((category) => {
      const count = values.reduce((sum, value) => (
        sum + CATEGORY_TERMS[category].filter((term) => value.includes(term)).length
      ), 0);
      return [category, count] as [Category, number];
    })
    .sort((a, b) => b[1] - a[1]);
}

function hasWeakSelf(shinkang: string): boolean {
  return ["신약", "태약", "극약"].some((word) => shinkang.includes(word));
}

function hasStrongSelf(shinkang: string): boolean {
  return ["신강", "태강", "극왕", "극강"].some((word) => shinkang.includes(word));
}

function natureLens(primary: PlanCategory, shinkang: string): string {
  if (hasWeakSelf(shinkang)) return "주변 흐름과 분위기를 먼저 받아들이고 자기 결을 천천히 세우는 아이.";
  if (hasStrongSelf(shinkang)) return "자기 의지로 끌고 가려는 결이 분명한 아이.";
  if (primary === "expression") return "마음과 생각을 바깥으로 풀어내며 자기 결을 표현하는 아이.";
  if (primary === "support") return "오래 사색하고 받아들이며 깊이 곱씹는 아이.";
  if (primary === "reality") return "손에 잡히는 결과와 실용을 챙기는 감각이 발달한 아이.";
  if (primary === "standard") return "약속과 기준 안에서 안정감을 찾는 아이.";
  return "여러 결이 고루 자리한 균형 잡힌 아이.";
}

function learningLens(primary: PlanCategory, shinkang: string): string {
  if (hasWeakSelf(shinkang)) return "혼자보다 함께 배우는 환경에서 안정감을 얻으며, 따라가는 페이스가 자연스럽다.";
  if (hasStrongSelf(shinkang)) return "자기 페이스로 끌고 가는 학습 — 주도권이 있을 때 집중력이 살아난다.";
  if (primary === "expression") return "말·글·창작으로 풀어내는 학습이 효율적. 토론·발표에서 빛난다.";
  if (primary === "support") return "혼자 책·자료를 깊이 파는 학습이 맞음. 숙성 시간이 필요한 결.";
  if (primary === "reality") return "결과·정답·구체적 실용에 끌리는 학습. 실험·실습이 효과 큼.";
  if (primary === "standard") return "구조와 룰이 명확할 때 집중력 발휘. 시간표·계획표가 안정감을 준다.";
  return "다양한 학습 방식이 고루 통하는 결.";
}

function emotionLens(primary: PlanCategory, weakElement: string): string {
  if (primary === "self") return "자기 결이 강해 자기 의견을 먼저 내세움. 칭찬은 자율과 인정 중심, 훈육은 이유 설명이 필수.";
  if (primary === "expression") return "감정을 바로 표현 — 즉각 반응. 칭찬은 표현 자체를 인정해주고, 훈육은 차분한 자리에서.";
  if (primary === "reality") return "구체적 결과·실용 칭찬에 강하게 반응. 추상적 칭찬보다 손에 잡히는 인정.";
  if (primary === "standard") return "기준과 약속을 중시하는 결. 칭찬은 신뢰감, 훈육은 일관된 룰이 핵심.";
  if (primary === "support") return "깊이 받아들이고 오래 곱씹는 결. 직접 훈육보다 환경·분위기로 안내하는 게 효과.";
  return `${weakElement}의 결이 약하게 드러나는 자리에선 반응이 늦거나 과해질 수 있어 차분한 대화가 필요하다.`;
}

function friendLens(primary: PlanCategory): string {
  if (primary === "self") return "또래 안에서 리더 위치를 잡으려는 결. 동등한 친구가 잘 맞음.";
  if (primary === "expression") return "활발한 표현으로 친구를 끌어당기는 결. 다인 그룹·동아리에서 빛난다.";
  if (primary === "reality") return "실용적 활동·취미로 친구와 연결되는 결. 함께 무언가를 만드는 사이.";
  if (primary === "standard") return "약속과 신뢰로 친구 관계를 유지. 소수의 깊은 친구.";
  if (primary === "support") return "오래 관찰하고 깊어지는 우정. 사적·내면적 대화를 좋아함.";
  return "친구 관계가 고루 — 상황에 따라 다양한 결.";
}

function shineLens(primary: PlanCategory, topElement: string): string {
  if (primary === "self") return `${topElement}의 결이 강하게 작용하며, 자기 주도권이 있는 환경에서 가장 빛난다.`;
  if (primary === "expression") return `${topElement}의 결로 표현하는 자리 — 무대·창작·소통 환경.`;
  if (primary === "reality") return `${topElement}의 결로 손에 잡히는 결과를 만드는 자리 — 실험·실습·실제 환경.`;
  if (primary === "standard") return `${topElement}의 결로 책임감 있게 일하는 자리 — 규율·전문성·신뢰가 중요한 환경.`;
  if (primary === "support") return `${topElement}의 결로 깊이 사색하는 자리 — 연구·기획·내면 작업.`;
  return `${topElement}의 결이 가장 두드러지며, 균형 잡힌 환경에서 본질이 발휘된다.`;
}

export function deriveParentChildInterpretationPlan(
  saju: SajuAnalysis,
  childName: string,
): ParentChildInterpretationPlan {
  const shinkang = (saju as SajuAnalysis & { shinkang?: string }).shinkang ?? "중화";
  const ranked = categoryRank(saju);
  const primaryCategory: PlanCategory = ranked[0]?.[1] ? ranked[0][0] : "balanced";
  const secondaryCategory: PlanCategory = ranked[1]?.[1] ? ranked[1][0] : "balanced";
  const topElement = elementRank(saju, "top");
  const weakElement = elementRank(saju, "weak");

  return {
    childName,
    topElement,
    weakElement,
    shinkang,
    primaryCategory,
    secondaryCategory,
    natureLens: natureLens(primaryCategory, shinkang),
    learningLens: learningLens(primaryCategory, shinkang),
    emotionLens: emotionLens(primaryCategory, weakElement),
    friendLens: friendLens(primaryCategory),
    shineLens: shineLens(primaryCategory, topElement),
  };
}

const CHAPTER_POLICY: Record<ParentChildPlanScope, string> = {
  ch1: "1장은 자녀 본질 도입 페이지. 자도인이 자녀를 처음 소개하는 자리. 한문 병기 근거 3~6개까지 허용, 모든 한문은 자리 설명과 쉬운 해석을 같이 붙임. 7가지 설계도(오행·십성·신강신약·용신기신·대운·귀인·일주) 미리보기 + 요약.",
  ch2: "2장은 학습 페이지. 한문 1~2개만 허용, 학습 환경·집중력·페이스로 즉시 번역. 직업명·정답 나열 금지.",
  ch3: "3장은 칭찬·훈육 페이지. 한문 1~3개 허용, 감정·반응·대화 장면으로 번역. 5 sub: 화났을 때·칭찬법·거짓말 반응·붕괴 자극·마음 문.",
  ch4: "4장은 친구 사이 페이지. 한문 0~2개만 허용, 또래 관계 장면으로 풀어쓴다. 결핍 낙인 금지.",
  ch5: "5장은 빛나는 자리 페이지. 한문 0~2개, 적성·환경·대운 시기로 번역. 직업명 나열 금지 — 성향·요구 역량으로.",
  ch6: "6장은 가족 결 페이지. 한문 0~2개, 부모-자녀 합 결·통하는 결로 풀어쓴다. 3 sub: 통하는 결·편안한 순간·채워줄 결.",
  outro: "outro는 자도인의 마지막 당부. **정확히 2~3문장**. 한문 직접 노출 X. 1~6장 풀이의 핵심을 압축한 시적 단락. **새 정보·새 풀이 추가 절대 금지** — 앞 챕터에서 언급된 자녀 본질·약점·부모 메시지만 압축. 부모 다독임·일반 격려 X.",
};

export function parentChildInterpretationPlanBlock(
  plan: ParentChildInterpretationPlan,
  scope: ParentChildPlanScope,
): string {
  return `
[★★★★★ 자도인 해석 기획 레이어 - 기존 챕터 지시보다 우선]
목표: 자도인이 ${plan.childName}을(를) 따뜻하게 관찰하며, 자녀의 일상·학습·관계 장면으로 사주를 번역한다.

현재 챕터 정책:
- ${CHAPTER_POLICY[scope]}

전체 판단 요약 (자녀 ${plan.childName} 기준):
- 중심 렌즈: ${CATEGORY_SCENE[plan.primaryCategory]}
- 보조 렌즈: ${CATEGORY_SCENE[plan.secondaryCategory]}
- 강하게 보이는 오행은 "${plan.topElement}", 약하게 드러나는 오행은 "${plan.weakElement}"로 보고 내부 근거로만 사용.
- 본질: ${plan.natureLens}
- 학습: ${plan.learningLens}
- 감정·훈육: ${plan.emotionLens}
- 친구 관계: ${plan.friendLens}
- 빛나는 자리: ${plan.shineLens}

생활어 슬롯 운영:
- 1장(설계도 7가지)에서 사주 근거를 충분히 공개한 뒤, 이후 챕터는 소제목마다 한문/사주근거 1~3개만 짧게 회상하고 자녀의 일상 장면(학습·놀이·친구·가족·취미)으로 번역.
- 1장은 예외 — 7가지 설계도를 풀이.
- 챕터가 달라도 한 번 나온 한문 병기/사주근거명은 재사용 금지. 새 근거가 필요하면 아직 쓰지 않은 근거만 1~3개.
- 같은 생활어 핵심 단어는 한 소제목 안에서 2회 이상 반복 X.
- "앞에서 본", "이 흐름", "이 결", "이 리듬" 같은 연결어 반복 X.
- 슬롯 예시: 학습=집중력·페이스·환경 / 감정=반응·표현·삭임 / 친구=리더·따라가는·관찰 / 빛=환경·역량·시기 / 가족=통하는·편안한·채울

출력 제어:
- 한자 병기는 "근거감 형성용으로 제한 허용". 챕터별 정책에 따라.
- 한문 썼다면 반드시 같은 문단에서 자리 설명과 쉬운 해석.
- 결핍 낙인 금지: "신약한 사주", "비겁이 없어", "식상이 약해", "부족해서 보완", "혼자 짊어짐".
- 자연 비유는 최소화. 1장만 허용, 나머지는 자녀 일상 장면으로.
- 직업명 직접 나열 X (예: "변호사", "회계사" 금지). 성향·요구 역량으로 (예: "정확성 요구하는 분야", "사람을 다루는 일").
- 자녀 호칭은 \${childName}\${honorific} 형식. "아이"·"자녀" 단어 남발 X.

상징어 생활어 번역 룰:
- 동물 상징 직접 출력 금지: 쥐·소·호랑이·토끼·용·뱀·말·양·원숭이·닭·개·돼지.
- 자연 상징도 ch2~ch6에서 최소화. 일상 장면·반응·말투로 번역.

[★★★★★ 마크다운 헤더 줄바꿈 절대 룰 — 클라이언트 매핑 생명선]
- ### sub 헤더는 반드시 줄 시작에 위치. 앞 본문과 줄바꿈 두 번(\\n\\n)으로 분리.
- 한 줄 안에 본문 + ### 헤더 같이 박지 말 것. 예시:
  - 잘못: "...자기 자리를 만들어가는 결입니다. ### 책임감과 뚝심으로 약속을 지키는 아이"
  - 정답: "...자기 자리를 만들어가는 결입니다.\\n\\n### 책임감과 뚝심으로 약속을 지키는 아이"
- 헤더 직전·직후엔 빈 줄 1개씩. 본문과 헤더가 같은 줄에 섞이면 클라이언트 매핑이 실패해서 본문 통째 흡수됨.
`;
}
