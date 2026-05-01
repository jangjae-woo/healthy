// 자도인 — 일주 / 건강 / 친구 / 습관 / 가족 사자성어 추론
// 평생사주 코드는 0줄 건드리지 않음.

import type { SajuAnalysis, CompatibilityResult } from "./saju-calculator";

// ── 가족 인연의 결 (옵션 α 강화 — 한자 X, 메타포 동적) ──
// 표지의 큰 키워드 + 한 줄 의미 + 일간 메타포 동적 부제
// 기존 hanja/hangul 필드는 호환 위해 optional 로 유지 (matching 슬라이드 등 다른 곳 영향 X)
export interface FamilySajaSeongeo {
  keyword: string;       // 큰 키워드 (한국어, 6~12자) — "두 햇살이 키우는 가족"
  meaning: string;       // 한 줄 의미 (정적, 카테고리 의미)
  subtitle: string;      // 동적 부제 (일간 메타포 조합) — "환한 햇살과 큰 나무가 너른 산을 함께 키우는 자리"
  hanja?: string;        // legacy (호환용 — 사용 X)
  hangul?: string;       // legacy
}

// ── 한 가지 선물 매트릭스 — 자녀 일간 오행 × 부모 역할 (5×2 = 10가지) ──
// 사주 변별력 + 마크다운 ** 강조 처리
export interface GiftCardData {
  emoji: string;
  keyword: string;
  quote: string;        // 마크다운 ** 가능
}

const STEM_TO_ELEM_LOCAL: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const GIFT_MATRIX: Record<string, Record<"엄마" | "아빠", { emoji: string; keyword: string; quote: string }>> = {
  목: {
    엄마: {
      emoji: "🌱",
      keyword: "자라날 시간 지켜주기",
      quote: "자녀가 자기 속도로 뻗어나가도록, 어머님께서 **따뜻한 햇살처럼 비춰주시기만** 해도 충분합니다. 어머님의 **기다림이 자녀의 결을 키우는 가장 큰 자양분**이 됩니다.",
    },
    아빠: {
      emoji: "🌳",
      keyword: "뻗어나갈 길 비워두기",
      quote: "자녀가 자기 길을 만들어 갈 수 있도록, 아버님께서 **든든한 뿌리처럼 자리를 지켜주시기**만 해도 충분합니다. 아버님의 **흔들림 없는 자리가 자녀의 결을 단단하게** 만듭니다.",
    },
  },
  화: {
    엄마: {
      emoji: "💛",
      keyword: "자유로운 표현 지지",
      quote: "자녀가 자기만의 방식으로 세상을 보고 표현하려 할 때, **있는 그대로를 존중하고 곁에서 응원**해주는 것. 어머님의 **사랑의 결**이 가장 빛나는 길입니다.",
    },
    아빠: {
      emoji: "✨",
      keyword: "자녀의 빛을 환히 인정해주기",
      quote: "자녀가 자기 빛을 펼치려 할 때, **있는 그대로의 빛을 환히 인정**해주시는 것. 아버님의 **든든한 인정이 자녀의 빛을 더욱 환하게** 만듭니다.",
    },
  },
  토: {
    엄마: {
      emoji: "🤲",
      keyword: "일관된 안정 지키기",
      quote: "자녀가 흔들림 없이 자라도록, **같은 시간·같은 자리에서 보내는 일상의 의식**을 지켜주시는 것. 어머님의 **꾸준한 일관성이 자녀의 결**을 단단히 다져줍니다.",
    },
    아빠: {
      emoji: "🛡️",
      keyword: "흔들림 없는 든든함",
      quote: "자녀가 어떤 상황에도 돌아갈 자리를 갖도록, **흔들림 없는 든든함을 보여주시는 것**. 아버님의 **변하지 않는 자리가 자녀의 안정**을 만듭니다.",
    },
  },
  금: {
    엄마: {
      emoji: "🪟",
      keyword: "맑은 환경과 분명한 선",
      quote: "자녀가 결단의 결을 키우도록, **정돈된 공간과 분명한 한계선**을 지켜주시는 것. 어머님의 **맑은 환경이 자녀의 결**을 정밀하게 다듬어 줍니다.",
    },
    아빠: {
      emoji: "🧭",
      keyword: "방향을 짚어주되 결정은 자녀에게",
      quote: "자녀가 스스로 결단을 내리도록, **큰 방향만 짚어주시고 결정은 자녀에게 맡기시는 것**. 아버님의 **신뢰가 자녀의 결단력**을 자라게 합니다.",
    },
  },
  수: {
    엄마: {
      emoji: "🌙",
      keyword: "깊은 휴식의 여백",
      quote: "자녀가 사색의 결을 깊이 가꾸도록, **충분한 잠과 조용한 시간의 여백**을 지켜주시는 것. 어머님의 **고요한 곁이 자녀의 깊이**를 키워줍니다.",
    },
    아빠: {
      emoji: "📚",
      keyword: "깊이 사색할 시간 보호",
      quote: "자녀가 자기 안에서 답을 찾아갈 수 있도록, **사색의 시간을 방해 없이 보호**해주시는 것. 아버님의 **차분한 보호가 자녀의 지혜**를 깊게 합니다.",
    },
  },
};

export function inferGiftCard(sajuChild: SajuAnalysis, parentRole: "엄마" | "아빠"): GiftCardData {
  const elem = STEM_TO_ELEM_LOCAL[sajuChild.ilgan] ?? "토";
  const data = GIFT_MATRIX[elem]?.[parentRole] ?? GIFT_MATRIX["토"][parentRole];
  return data;
}

// ── 일간별 메타포 사전 (10간) — 부제 동적 생성용 ──
// 표지에서만 사용 (시적·메타포). 본문(자도인의 첫마디 등)은 명리 용어 사용.
const STEM_METAPHOR: Record<string, string> = {
  갑: "큰 나무", 을: "부드러운 풀",
  병: "환한 햇살", 정: "다정한 촛불",
  무: "큰 산", 기: "기름진 들판",
  경: "강철", 신: "보석",
  임: "큰 바다", 계: "이슬비",
};

function metaphorOf(ilgan: string): string {
  return STEM_METAPHOR[ilgan] ?? "흐르는 결";
}

// 두 부모 메타포 자연 연결 ("환한 햇살과 큰 나무" / "환한 햇살과 다정한 촛불의 두 빛")
function joinParentMetaphors(momIlgan: string, dadIlgan: string): string {
  const mm = metaphorOf(momIlgan);
  const dm = metaphorOf(dadIlgan);
  return mm === dm ? `두 ${mm}` : `${mm}과 ${dm}`;
}

// ── 양친+자녀 매트릭스 (12 카테고리) ──
export function pickFamilyTrioSaja(
  sajuMom: SajuAnalysis,
  sajuDad: SajuAnalysis,
  sajuChild: SajuAnalysis
): FamilySajaSeongeo {
  const elemMom = STEM_ELEM[sajuMom.ilgan] ?? "수";
  const elemDad = STEM_ELEM[sajuDad.ilgan] ?? "수";
  const elemChild = STEM_ELEM[sajuChild.ilgan] ?? "수";

  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
  const momGen = generates[elemMom] === elemChild;
  const dadGen = generates[elemDad] === elemChild;
  const momCtl = controls[elemMom] === elemChild;
  const dadCtl = controls[elemDad] === elemChild;
  const childGenMom = generates[elemChild] === elemMom;
  const childGenDad = generates[elemChild] === elemDad;
  const allSame = elemMom === elemDad && elemDad === elemChild;
  const momDadSame = elemMom === elemDad;
  const momChildSame = elemMom === elemChild;
  const dadChildSame = elemDad === elemChild;

  const parents = joinParentMetaphors(sajuMom.ilgan, sajuDad.ilgan);
  const childM = metaphorOf(sajuChild.ilgan);

  // 1. 셋 다 같은 오행
  if (allSame)
    return {
      keyword: "한 결로 흐르는 가족",
      meaning: "세 분이 같은 본질을 지닌, 깊은 동행의 가족",
      subtitle: `${parents}과 ${childM}이 같은 결로 흐르는 자리입니다`,
    };

  // 2. 부모 둘 다 자녀를 살림 (生)
  if (momGen && dadGen)
    return {
      keyword: "두 햇살이 키우는 가족",
      meaning: "부모님 두 분이 함께 자녀를 키워가는 가족",
      subtitle: `${parents}이 ${childM}을 함께 키워주는 자리입니다`,
    };

  // 3. 부모 둘 다 자녀를 다듬음 (剋)
  if (momCtl && dadCtl)
    return {
      keyword: "두 손길이 받쳐주는 가족",
      meaning: "부모님 두 분이 자녀에게 단단한 뿌리가 되어주는 가족",
      subtitle: `${parents}이 ${childM}을 단단히 받쳐주는 자리입니다`,
    };

  // 4. 엄마 살림 + 아빠 다듬음
  if (momGen && dadCtl)
    return {
      keyword: "자애와 엄정의 만남",
      meaning: "어머니의 자애와 아버지의 엄정이 함께 닿는 가족",
      subtitle: `${metaphorOf(sajuMom.ilgan)}이 ${childM}을 키우고, ${metaphorOf(sajuDad.ilgan)}이 받쳐주는 자리입니다`,
    };

  // 5. 엄마 다듬음 + 아빠 살림
  if (momCtl && dadGen)
    return {
      keyword: "엄정과 자애의 만남",
      meaning: "어머니의 엄정과 아버지의 자애가 함께 닿는 가족",
      subtitle: `${metaphorOf(sajuMom.ilgan)}이 ${childM}을 받쳐주고, ${metaphorOf(sajuDad.ilgan)}이 키우는 자리입니다`,
    };

  // 6. 한 분 살림 + 부모 같은 오행
  if ((momGen || dadGen) && momDadSame)
    return {
      keyword: "별과 달이 비추는 가족",
      meaning: "두 분이 같은 결로 자녀에게 빛을 비추는 가족",
      subtitle: `${parents}이 ${childM}에게 같은 결의 빛을 비추는 자리입니다`,
    };

  // 7. 자녀가 부모 둘 다 살림 (자녀가 부모를 키움)
  if (childGenMom && childGenDad)
    return {
      keyword: "자녀가 활력을 주는 가족",
      meaning: "자녀의 결이 부모님께 새 활력을 채워주는 가족",
      subtitle: `${childM}이 ${parents}에게 새 활력을 채워주는 자리입니다`,
    };

  // 8. 한 분만 살림 (다른 분은 비화·보완)
  if (momGen || dadGen)
    return {
      keyword: "셋이 어우러지는 가족",
      meaning: "세 분이 자연스럽게 어우러져 함께 이루는 가족",
      subtitle: `${parents}이 ${childM}을 함께 어우러져 키우는 자리입니다`,
    };

  // 9. 부모 같은 오행 (자녀와 다름)
  if (momDadSame)
    return {
      keyword: "두 결이 어울리는 가족",
      meaning: "부모님 두 분의 결이 같은 노래로 어울리는 가족",
      subtitle: `${parents}이 ${childM}을 함께 둘러주는 자리입니다`,
    };

  // 10. 자녀가 부모 한 분 살림
  if (childGenMom || childGenDad)
    return {
      keyword: "서로 채워주는 가족",
      meaning: "부모와 자녀가 서로 활력을 주고받는 가족",
      subtitle: `${parents}과 ${childM}이 서로의 결을 채워주는 자리입니다`,
    };

  // 11. 한쪽 부모만 자녀와 비화
  if (momChildSame || dadChildSame)
    return {
      keyword: "닮은 결과 다른 결의 만남",
      meaning: "한 분과는 닮은 결, 한 분과는 다른 결로 만나는 가족",
      subtitle: `${parents}과 ${childM}이 닮음과 다름으로 만나는 자리입니다`,
    };

  // 12. 그 외 — 다섯 결이 흐름
  return {
    keyword: "다섯 결이 흐르는 가족",
    meaning: "다섯 가지 결이 자연스럽게 흐르며 어우러지는 가족",
    subtitle: `${parents}과 ${childM}이 다섯 결로 함께 흐르는 자리입니다`,
  };
}

// ── 한 부모+자녀 매트릭스 (엄마/아빠 공통, parentRole 분기) ──
export function pickFamilySajaSeongeo(
  compat: CompatibilityResult,
  childGender?: string,
  sajuParent?: SajuAnalysis,
  sajuChild?: SajuAnalysis,
  parentRole: "엄마" | "아빠" = "엄마",
): FamilySajaSeongeo {
  const ilgan = compat.ilganRelation;
  const isSangsaeng = ilgan.includes("상생");
  const isSanggeuk = ilgan.includes("상극");
  const isBihwa = ilgan.includes("비화");
  const chungs = compat.branchRelations.chung.length;
  const samhap = compat.branchRelations.samhap.length;
  const yukhap = compat.branchRelations.yukhap.length;
  const totalHap = samhap + yukhap;
  const parentHelps = compat.elementBalance.aHelpsB.length;
  const childHelps = compat.elementBalance.bHelpsA.length;
  const isDaughter = childGender === "여";
  const isMom = parentRole === "엄마";

  // 메타포 부제 — 사주 데이터 있으면 동적, 없으면 기본
  const parentM = sajuParent ? metaphorOf(sajuParent.ilgan) : (isMom ? "어머님의 결" : "아버님의 결");
  const childM = sajuChild ? metaphorOf(sajuChild.ilgan) : "자녀의 결";

  // 자녀 성별 호칭 (모녀/모자/부녀/부자)
  const childCall = isDaughter ? "딸" : "아들";
  const parentChildPair = isMom
    ? (isDaughter ? "모녀" : "모자")
    : (isDaughter ? "부녀" : "부자");
  const parentCall = isMom ? "어머님" : "아버님";

  // 1. 상생 + 삼합 + 충 X — 가장 깊은 인연
  if (isSangsaeng && samhap >= 1 && chungs === 0)
    return {
      keyword: `하늘이 맺어준 ${parentChildPair} 인연`,
      meaning: "깊고 자연스러운 흐름으로 이어진 인연",
      subtitle: `${parentM}과 ${childM}이 자연스럽게 흐르는 자리입니다`,
    };

  // 2. 상생 + 육합
  if (isSangsaeng && yukhap >= 1)
    return {
      keyword: `서로를 살리는 ${parentChildPair} 결`,
      meaning: "두 결이 서로에게 빛이 되는 인연",
      subtitle: `${parentM}과 ${childM}이 서로를 살려주는 자리입니다`,
    };

  // 3. 상생 + 부모가 채워줌
  if (isSangsaeng && parentHelps >= 1)
    return {
      keyword: isMom ? "자애가 닿는 결" : "든든함이 닿는 결",
      meaning: isMom
        ? "어머니의 따뜻한 사랑이 자녀에게 닿는 인연"
        : "아버지의 든든한 사랑이 자녀에게 닿는 인연",
      subtitle: `${parentM}이 ${childM}을 따뜻하게 키우는 자리입니다`,
    };

  // 4. 자녀가 부모를 채워줌
  if (childHelps >= 1)
    return {
      keyword: "자녀가 활력을 주는 결",
      meaning: "자녀의 결이 부모에게 새 활력을 채워주는 인연",
      subtitle: `${childM}이 ${parentCall}의 ${parentM}에 새 활력을 채워주는 자리입니다`,
    };

  // 5. 화목 (삼합 또는 비화+합)
  if (samhap >= 1 || (isBihwa && totalHap >= 1))
    return {
      keyword: "화목한 결의 가족",
      meaning: "두 결이 자연스럽게 어우러지는 화목한 인연",
      subtitle: `${parentM}과 ${childM}이 자연스럽게 어우러지는 자리입니다`,
    };

  // 6. 상생 (그 외)
  if (isSangsaeng)
    return {
      keyword: isMom
        ? `자애로운 어머니와 효심 깊은 ${childCall}`
        : `든든한 아버지와 효심 깊은 ${childCall}`,
      meaning: isMom
        ? `어머니의 자애와 ${childCall}의 마음이 만나는 인연`
        : `아버지의 든든함과 ${childCall}의 마음이 만나는 인연`,
      subtitle: `${parentM}이 ${childM}을 키우고, ${childM}이 ${parentM}에게 닿는 자리입니다`,
    };

  // 7. 비화
  if (isBihwa)
    return {
      keyword: "닮은 듯 다른 결의 만남",
      meaning: "닮은 본질을 다른 길로 풀어내는 인연",
      subtitle: `${parentM}과 ${childM}이 닮음 속의 다름으로 만나는 자리입니다`,
    };

  // 8. 상극 + 합
  if (isSanggeuk && totalHap >= 1)
    return {
      keyword: isMom
        ? `지혜로운 어머니와 마음 따라가는 ${childCall}`
        : `엄정한 아버지와 마음 따라가는 ${childCall}`,
      meaning: isMom
        ? `어머니의 지혜로 다듬고 ${childCall}이 마음으로 따르는 인연`
        : `아버지의 엄정함으로 다듬고 ${childCall}이 마음으로 따르는 인연`,
      subtitle: `${parentM}이 ${childM}을 단단히 받쳐주는 자리입니다`,
    };

  // 9. 상극 + 충
  if (isSanggeuk && chungs >= 1)
    return {
      keyword: "다듬어 빛나는 결",
      meaning: "단련을 통해 빛나는 그릇이 되는 인연",
      subtitle: `${parentM}이 ${childM}을 두드려 빛나게 하는 자리입니다`,
    };

  // 10. 충
  if (chungs >= 1)
    return {
      keyword: "쓴맛 끝에 단맛이 오는 결",
      meaning: "어려움 뒤에 깊은 결실이 오는 인연",
      subtitle: `${parentM}과 ${childM}이 부딪히며 자라나는 자리입니다`,
    };

  // 11. 기본
  return {
    keyword: `끊을 수 없는 ${parentChildPair} 인연`,
    meaning: "어떤 결이든 깊이 이어지는 인연",
    subtitle: `${parentM}과 ${childM}이 깊이 이어지는 자리입니다`,
  };
}

const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const BRANCH_ELEM: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};

// ── 동물 기질 카드 (12지 + 일간 오행) ──────────────────────────────
export interface AnimalCharacter {
  animal: string;       // "호랑이"
  emoji: string;        // 🐯
  branchHanja: string;  // 寅
  prefix: string;       // 일간 오행으로 만든 형용사 ("초록빛", "단단한", "흐르는")
  prefixMeaning: string; // "쇠(金)의 결이 강해 — 단단함과 결단의 빛깔" (색깔의 사주적 근거)
  catchphrase: string;  // 큰 한 줄 ("호기심 가득한 초록빛 호랑이")
  traits: string[];     // 3가지 키워드
  description: string;  // 짧은 성격 설명
  empathy: string;      // 부모 공감 한 줄 ("이런 결의 자녀는 ~한 모습이 자주 보이실 겁니다")
  shareable: string;    // 인스타 공유용 짧은 한 줄
}

const BRANCH_ANIMAL: Record<string, {
  animal: string;
  emoji: string;
  hanja: string;
  baseTraits: string[];
  base: string;
}> = {
  자: {
    animal: "쥐", emoji: "🐭", hanja: "子",
    baseTraits: ["영리함", "적응력", "기억력"],
    base: "재빠르고 영리한 두뇌, 어디서든 살아남는 적응력을 타고났습니다",
  },
  축: {
    animal: "소", emoji: "🐮", hanja: "丑",
    baseTraits: ["우직함", "끈기", "신뢰"],
    base: "묵묵히 자기 길을 가는 끈기와 듬직한 신뢰감을 주는 결입니다",
  },
  인: {
    animal: "호랑이", emoji: "🐯", hanja: "寅",
    baseTraits: ["용감함", "리더십", "도전"],
    base: "자기 길을 당당히 걷는 카리스마, 새로운 도전을 두려워하지 않습니다",
  },
  묘: {
    animal: "토끼", emoji: "🐰", hanja: "卯",
    baseTraits: ["부드러움", "민첩함", "감수성"],
    base: "유연하고 섬세한 감각, 사람들 마음을 잘 읽는 따뜻한 결입니다",
  },
  진: {
    animal: "용", emoji: "🐲", hanja: "辰",
    baseTraits: ["비범함", "스케일", "신비"],
    base: "남다른 그릇과 큰 꿈을 품은, 평범한 길에 머물지 않는 결입니다",
  },
  사: {
    animal: "뱀", emoji: "🐍", hanja: "巳",
    baseTraits: ["직관", "현명함", "관찰력"],
    base: "겉으로는 조용해도 깊이 보고 깊이 생각하는 현명한 결입니다",
  },
  오: {
    animal: "말", emoji: "🐴", hanja: "午",
    baseTraits: ["자유로움", "활기", "추진력"],
    base: "한 자리에 머물기보다 넓은 들판을 달리고 싶어하는 자유로운 결입니다",
  },
  미: {
    animal: "양", emoji: "🐑", hanja: "未",
    baseTraits: ["온화함", "예술성", "평화"],
    base: "조용히 자기 세계를 가꾸는 예술적인 감성, 평화로운 결입니다",
  },
  신: {
    animal: "원숭이", emoji: "🐵", hanja: "申",
    baseTraits: ["재치", "창의성", "유머"],
    base: "번뜩이는 재치와 창의력, 사람들을 웃게 하는 매력을 가졌습니다",
  },
  유: {
    animal: "닭", emoji: "🐓", hanja: "酉",
    baseTraits: ["정확함", "성실", "감각"],
    base: "꼼꼼하고 정확한 감각, 자기 일을 야무지게 해내는 결입니다",
  },
  술: {
    animal: "개", emoji: "🐕", hanja: "戌",
    baseTraits: ["충직", "의리", "정의감"],
    base: "사랑하는 사람을 끝까지 지키는 충직함과 의리를 타고났습니다",
  },
  해: {
    animal: "돼지", emoji: "🐷", hanja: "亥",
    baseTraits: ["풍요", "포용", "낙천"],
    base: "마음이 넓고 복을 부르는 결, 주변에 풍요를 가져다주는 결입니다",
  },
};

const STEM_ELEM_ANIMAL: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const ELEM_PREFIX: Record<string, string> = {
  목: "초록빛",
  화: "불꽃 같은",
  토: "단단한",
  금: "은빛",
  수: "물 흐르는",
};

// 색깔의 사주적 근거 — 왜 이 색깔인지 어머니에게 설명
const ELEM_PREFIX_MEANING: Record<string, string> = {
  목: "**나무의 결**이 강해 — 자라남과 생명의 푸른 기운이 깃든 빛깔입니다",
  화: "**불의 결**이 강해 — 빛남과 열정이 솟구치는 빛깔입니다",
  토: "**흙의 결**이 강해 — 흔들리지 않는 안정의 빛깔입니다",
  금: "**쇠의 결**이 강해 — 단단함과 결단의 은빛입니다",
  수: "**물의 결**이 강해 — 지혜와 흐름이 깊어지는 빛깔입니다",
};

// 12지 동물별 부모 공감 포인트 ("이런 결의 자녀는 ~한 모습이 자주 보이실 겁니다")
const BRANCH_ANIMAL_EMPATHY: Record<string, string> = {
  자: "조용한 곳에서 혼자 책을 보거나 골똘히 생각에 잠겨 있는 모습이 자주 보이실 겁니다",
  축: "한 번 시작한 일은 시간이 걸려도 끝까지 해내는 끈기가 자주 보이실 겁니다",
  인: "낯선 환경에서도 먼저 앞으로 나서서 살펴보는 호기심 어린 모습이 자주 보이실 겁니다",
  묘: "친구의 마음을 살피고 분위기를 부드럽게 만드는 다정함이 자주 보이실 겁니다",
  진: "갑자기 한 가지에 깊이 빠져 어른도 놀랄 만한 집중을 보이는 순간이 자주 있을 겁니다",
  사: "조용히 관찰하다가 핵심을 한 줄로 짚어내는 영민함이 자주 보이실 겁니다",
  오: "친구들 사이에서 분위기를 이끌고 한 번 빠지면 끝까지 가는 열정이 자주 보이실 겁니다",
  미: "친구가 힘들어할 때 가장 먼저 다가가서 곁에 있어주는 따뜻함이 자주 보이실 겁니다",
  신: "예상치 못한 재치 있는 말로 어른들을 웃게 만드는 모습이 자주 보이실 겁니다",
  유: "정리정돈을 좋아하고 자기 물건을 소중히 다루는 결이 자주 보이실 겁니다",
  술: "친구·가족을 지키려는 의리와 책임감 있는 모습이 자주 보이실 겁니다",
  해: "주변 사람들에게 푸근한 분위기를 만들어주는 넉넉한 결이 자주 보이실 겁니다",
};

export function getAnimalCharacter(saju: SajuAnalysis): AnimalCharacter {
  const branch = saju.pillars.day.branch;
  const stem = saju.pillars.day.stem;
  const data = BRANCH_ANIMAL[branch] ?? BRANCH_ANIMAL["미"];
  const elem = STEM_ELEM_ANIMAL[stem] ?? "토";
  const prefix = ELEM_PREFIX[elem] ?? "고요한";
  const prefixMeaning = ELEM_PREFIX_MEANING[elem] ?? "";
  const catchphrase = `${prefix} ${data.animal}`;
  const empathy = BRANCH_ANIMAL_EMPATHY[branch] ?? "";
  const shareable = `우리 자녀는 ${prefix} ${data.animal} 결을 타고났습니다`;
  return {
    animal: data.animal,
    emoji: data.emoji,
    branchHanja: data.hanja,
    prefix,
    prefixMeaning,
    catchphrase,
    traits: data.baseTraits,
    description: data.base,
    empathy,
    shareable,
  };
}

// ── 일주 카드 ──────────────────────────────
export interface IljuInfo {
  hanja: string;        // "甲子"
  hangul: string;       // "갑자"
  stemHanja: string;    // "甲"
  branchHanja: string;  // "子"
  stemMeaning: string;  // "곧고 큰 나무"
  branchMeaning: string; // "깊은 새벽의 지혜"
  fusion: string;       // 일간+일지가 만드는 캐치프레이즈
}

const STEM_INFO: Record<string, { hanja: string; theme: string }> = {
  갑: { hanja: "甲", theme: "곧고 큰 나무 — 추진력과 리더십" },
  을: { hanja: "乙", theme: "유연한 초목 — 적응력과 친화력" },
  병: { hanja: "丙", theme: "환한 태양 — 열정과 표현력" },
  정: { hanja: "丁", theme: "다정한 촛불 — 헌신과 섬세함" },
  무: { hanja: "戊", theme: "큰 산 — 포용력과 신뢰" },
  기: { hanja: "己", theme: "기름진 들판 — 성실함과 배려" },
  경: { hanja: "庚", theme: "강철 — 의지와 정직함" },
  신: { hanja: "辛", theme: "보석 — 예리함과 세련됨" },
  임: { hanja: "壬", theme: "큰 바다 — 지혜와 자유로움" },
  계: { hanja: "癸", theme: "이슬비 — 직관과 감수성" },
};
const BRANCH_INFO: Record<string, { hanja: string; theme: string }> = {
  자: { hanja: "子", theme: "고요한 새벽의 깊은 지혜" },
  축: { hanja: "丑", theme: "묵묵히 다지는 인내의 결" },
  인: { hanja: "寅", theme: "떠오르는 첫 빛의 용기" },
  묘: { hanja: "卯", theme: "봄의 부드러운 기운" },
  진: { hanja: "辰", theme: "변화를 품은 신비한 기운" },
  사: { hanja: "巳", theme: "예리하고 영민한 결단" },
  오: { hanja: "午", theme: "한낮의 뜨거운 열정" },
  미: { hanja: "未", theme: "여름이 영그는 정성" },
  신: { hanja: "申", theme: "재치 있고 영리한 기운" },
  유: { hanja: "酉", theme: "맑고 깨끗한 결정의 결" },
  술: { hanja: "戌", theme: "충직하고 의리 있는 기운" },
  해: { hanja: "亥", theme: "깊고 잔잔한 사색의 물결" },
};

// 일간별 이미지 + 핵심 결 (일간 = 타고난 본질의 그림)
const STEM_FUSION_CORE: Record<string, string> = {
  갑: "곧게 뻗는 큰 나무의 추진력",
  을: "유연하게 자라는 초목의 생명력",
  병: "환하게 빛나는 태양의 열정",
  정: "다정하게 밝히는 촛불의 섬세함",
  무: "묵직하게 자리한 큰 산의 포용력",
  기: "기름진 들판의 너른 품",
  경: "벼린 강철의 곧은 의지",
  신: "맑게 빛나는 보석의 예리함",
  임: "흔들림 없이 단단한 큰 바다의 자유로움",
  계: "맑게 스미는 이슬비의 깊은 감수성",
};

export function getIljuInfo(saju: SajuAnalysis): IljuInfo {
  const stem = saju.pillars.day.stem;
  const branch = saju.pillars.day.branch;
  const sInfo = STEM_INFO[stem];
  const bInfo = BRANCH_INFO[branch];
  // 일간 이미지 + 일간·일지 관계 형용사
  const sElem = STEM_ELEM[stem];
  const bElem = BRANCH_ELEM[branch];
  const core = STEM_FUSION_CORE[stem] ?? "타고난 본질의 결";
  let prefix: string;
  if (sElem === bElem) {
    prefix = "그 자체로 단단한";
  } else if (
    (sElem === "목" && bElem === "수") || (sElem === "화" && bElem === "목") ||
    (sElem === "토" && bElem === "화") || (sElem === "금" && bElem === "토") ||
    (sElem === "수" && bElem === "금")
  ) {
    prefix = "뿌리 깊이 자라나는";
  } else if (
    (sElem === "목" && bElem === "화") || (sElem === "화" && bElem === "토") ||
    (sElem === "토" && bElem === "금") || (sElem === "금" && bElem === "수") ||
    (sElem === "수" && bElem === "목")
  ) {
    prefix = "바깥으로 펼쳐내는";
  } else if (
    (sElem === "목" && bElem === "토") || (sElem === "토" && bElem === "수") ||
    (sElem === "수" && bElem === "화") || (sElem === "화" && bElem === "금") ||
    (sElem === "금" && bElem === "목")
  ) {
    prefix = "스스로 다듬어 빛나는";
  } else {
    prefix = "단련되어 깊어지는";
  }
  const fusion = `${prefix} ${core}`;
  return {
    hanja: `${sInfo?.hanja ?? stem}${bInfo?.hanja ?? branch}`,
    hangul: `${stem}${branch}`,
    stemHanja: sInfo?.hanja ?? stem,
    branchHanja: bInfo?.hanja ?? branch,
    stemMeaning: sInfo?.theme ?? "",
    branchMeaning: bInfo?.theme ?? "",
    fusion,
  };
}

// ── 사주 본질 카드 1: 부족한 기운 (用神 — 平生의 課題) ──────────────────────────────
export interface YongsinMeaning {
  element: string | null;       // "수" — 부족 오행
  hanja: string;                // "水"
  title: string;                // "用神 — 채워야 할 기운"
  meaning: string;              // 사주적 의미 (장부·기질·길)
  guidance: string;             // 사주적 길 (양육 팁 X)
}

const ELEM_HANJA_LOCAL: Record<string, string> = {
  목: "木", 화: "火", 토: "土", 금: "金", 수: "水",
};

const YONGSIN_DATA: Record<string, { meaning: string; guidance: string }> = {
  목: {
    meaning: "사주에 木의 기운이 부족하면, 새로움을 시작하는 추진력과 자라나는 생명력이 약할 수 있습니다. 명리학에서 木은 仁(인)의 덕을 다스리고, 간(肝)·근육·눈을 주관하는 기운입니다.",
    guidance: "자녀의 사주에 부족한 木을 채우는 길은 ─ 자라나는 것을 가까이하고, 시작과 도전의 기운을 일상에 들여놓는 것입니다. 푸름·동쪽·아침의 시간이 자녀의 기운을 살립니다.",
  },
  화: {
    meaning: "사주에 火의 기운이 부족하면, 자기 표현과 밝게 빛나는 활기가 약할 수 있습니다. 명리학에서 火는 禮(예)의 덕을 다스리고, 심장(心)·혈맥·말의 기운을 주관합니다.",
    guidance: "자녀의 사주에 부족한 火를 채우는 길은 ─ 따뜻한 빛과 사람들의 온기를 자주 만나게 하는 것입니다. 붉은빛·남쪽·한낮의 시간이 자녀의 기운을 살립니다.",
  },
  토: {
    meaning: "사주에 土의 기운이 부족하면, 안정감과 신뢰의 뿌리가 약할 수 있습니다. 명리학에서 土는 信(신)의 덕을 다스리고, 비위(脾胃)·살·중심을 주관하는 기운입니다.",
    guidance: "자녀의 사주에 부족한 土를 채우는 길은 ─ 같은 자리에서 머무는 시간, 흙과 가까운 환경을 가까이하는 것입니다. 황색·중앙·환절기가 자녀의 기운을 살립니다.",
  },
  금: {
    meaning: "사주에 金의 기운이 부족하면, 결단과 정돈의 기운이 약할 수 있습니다. 명리학에서 金은 義(의)의 덕을 다스리고, 폐(肺)·기관지·피부를 주관하는 기운입니다.",
    guidance: "자녀의 사주에 부족한 金을 채우는 길은 ─ 정돈된 환경, 맑은 공기, 결을 다듬는 활동을 가까이하는 것입니다. 백색·서쪽·가을 저녁의 시간이 자녀의 기운을 살립니다.",
  },
  수: {
    meaning: "사주에 水의 기운이 부족하면, 깊이 사색하는 지혜와 흐르는 유연함이 약할 수 있습니다. 명리학에서 水는 智(지)의 덕을 다스리고, 신장(腎)·뼈·골수를 주관하는 기운입니다.",
    guidance: "자녀의 사주에 부족한 水를 채우는 길은 ─ 깊은 휴식, 물과 가까운 환경, 사색의 시간을 가까이하는 것입니다. 흑색·북쪽·깊은 밤의 시간이 자녀의 기운을 살립니다.",
  },
};

export function inferYongsinMeaning(saju: SajuAnalysis): YongsinMeaning {
  const elements = saju.elements as Record<string, number>;
  const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  // 가장 부족한 오행 (15% 미만)
  let weakest: string | null = null;
  let minPct = 1;
  for (const el of ["목", "화", "토", "금", "수"]) {
    const pct = (elements[el] || 0) / total;
    if (pct < minPct) {
      minPct = pct;
      weakest = el;
    }
  }
  const target = weakest || "토";
  const data = YONGSIN_DATA[target];
  return {
    element: weakest,
    hanja: ELEM_HANJA_LOCAL[target] ?? "",
    title: "用神 — 채워야 할 기운",
    meaning: data.meaning,
    guidance: data.guidance,
  };
}

// ── 사주 본질 카드 2: 타고난 본기운 (本氣 — 평생의 무기) ──────────────────────────────
export interface DominantMeaning {
  element: string;
  hanja: string;
  title: string;
  meaning: string;
  asset: string;  // 이 본기운이 자녀의 무기인 이유
}

const DOMINANT_DATA: Record<string, { meaning: string; asset: string }> = {
  목: {
    meaning: "자녀의 사주에서 木의 기운이 가장 두드러집니다. 명리학에서 木은 仁(인)의 덕이며, 자라남·뻗어 나감·시작의 기운입니다.",
    asset: "이 본기운은 자녀가 새로운 길을 만들어내는 추진력으로 평생 작용합니다. 어떤 환경에서도 다시 자라나는 회복력이 자녀의 무기입니다.",
  },
  화: {
    meaning: "자녀의 사주에서 火의 기운이 가장 두드러집니다. 명리학에서 火는 禮(예)의 덕이며, 빛·표현·열정의 기운입니다.",
    asset: "이 본기운은 자녀가 자신의 마음을 세상에 드러내는 표현력으로 평생 작용합니다. 사람들 사이에서 환히 빛나는 매력이 자녀의 무기입니다.",
  },
  토: {
    meaning: "자녀의 사주에서 土의 기운이 가장 두드러집니다. 명리학에서 土는 信(신)의 덕이며, 안정·신뢰·중심의 기운입니다.",
    asset: "이 본기운은 자녀가 사람들에게 신뢰를 주는 무게감으로 평생 작용합니다. 흔들림 없이 자기 자리를 지키는 단단함이 자녀의 무기입니다.",
  },
  금: {
    meaning: "자녀의 사주에서 金의 기운이 가장 두드러집니다. 명리학에서 金은 義(의)의 덕이며, 결단·정의·정돈의 기운입니다.",
    asset: "이 본기운은 자녀가 옳고 그름을 분별하는 결단력으로 평생 작용합니다. 흐트러진 것을 바르게 다듬는 정밀함이 자녀의 무기입니다.",
  },
  수: {
    meaning: "자녀의 사주에서 水의 기운이 가장 두드러집니다. 명리학에서 水는 智(지)의 덕이며, 지혜·유연·깊이의 기운입니다.",
    asset: "이 본기운은 자녀가 깊이 사유하는 지혜로 평생 작용합니다. 어떤 그릇에도 자신을 맞춰 흐르는 유연함이 자녀의 무기입니다.",
  },
};

export function inferDominantMeaning(saju: SajuAnalysis): DominantMeaning {
  const elements = saju.elements as Record<string, number>;
  // 가장 강한 오행
  const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] ?? "토";
  const data = DOMINANT_DATA[dominant] ?? DOMINANT_DATA["토"];
  return {
    element: dominant,
    hanja: ELEM_HANJA_LOCAL[dominant] ?? "",
    title: "本氣 — 타고난 무기",
    meaning: data.meaning,
    asset: data.asset,
  };
}

// ── 사주 본질 카드 3: 자녀 사주의 빛나는 신살 ──────────────────────────────
export interface PositiveSinsalReading {
  hasAny: boolean;
  shines: { name: string; meaning: string }[];   // 사주에 있는 긍정 신살들
  fallback: string;  // 신살이 없을 때 대체 메시지
}

// 자녀 사주에 있을 때 의미가 좋은 신살 풀이
// 형식: "한자(한글) — 의미"
const POSITIVE_SINSAL_MEANING: Record<string, string> = {
  천을귀인: "天乙貴人(천을귀인) — 어려움이 닥치면 귀한 사람의 도움을 받는, 가장 으뜸가는 길성(吉星)입니다. 자녀의 평생에 결정적 인연이 따르는 결입니다.",
  천덕귀인: "天德貴人(천덕귀인) — 하늘의 덕을 입는 신살. 자녀가 어려운 시기를 만나도 자연스럽게 풀려나가는 결을 가졌습니다.",
  월덕귀인: "月德貴人(월덕귀인) — 달의 덕을 입어 사람들에게 사랑받는 신살. 자녀가 곁에 있는 이들에게 따뜻한 존재로 기억되는 결입니다.",
  태극귀인: "太極貴人(태극귀인) — 시작과 끝을 다스리는 큰 그릇의 신살. 자녀가 큰 일을 맡거나 한 분야의 처음과 끝을 짓는 결입니다.",
  문창귀인: "文昌貴人(문창귀인) — 학문과 문장의 신살. 자녀가 배움을 통해 빛나는 결, 글과 말로 이름을 알리는 결을 가졌습니다.",
  학당귀인: "學堂貴人(학당귀인) — 평생 배움이 끊이지 않는 신살. 자녀가 배움 속에서 자기 자리를 찾는 결입니다.",
  복성귀인: "福星貴人(복성귀인) — 복덕을 끌어오는 신살. 자녀의 평생에 알 수 없는 복이 따라오는 결입니다.",
  금여: "金輿(금여) — 귀한 수레를 탄다는 신살. 자녀가 인생의 고비마다 필요한 도움이 따라오는 결입니다.",
  장성살: "將星(장성) — 우두머리의 별. 자녀가 어떤 자리에 있든 중심이 되는 결을 가졌습니다.",
  반안살: "攀鞍(반안) — 안장에 오른다는 신살. 자녀가 자신의 자리를 잡고 흔들림 없이 나아가는 결입니다.",
  역마살: "驛馬(역마) — 움직임의 별. 자녀가 한 자리에 머물지 않고 넓은 세상을 만나는 결을 가졌습니다.",
  화개살: "華蓋(화개) — 예술과 학문의 별. 자녀가 자신만의 세계를 깊이 가꾸는 결을 가졌습니다.",
  도화살: "桃花(도화) — 사람을 끌어당기는 매력의 별. 자녀가 사람들에게 자연스럽게 사랑받는 결입니다.",
  양인살: "羊刃(양인) — 강한 의지의 별. 자녀가 결단의 순간에 망설임 없이 나아가는 힘을 가졌습니다.",
  괴강살: "魁罡(괴강) — 우두머리의 카리스마. 자녀가 결정적 순간에 빛나는 결을 가졌습니다.",
  현침살: "懸針(현침) — 예리한 통찰의 별. 자녀가 남들이 보지 못하는 것을 보는 눈을 가졌습니다.",
  귀문관살: "鬼門關(귀문관) — 직관과 영감의 별. 자녀가 평범하지 않은 감각으로 세상을 읽는 결입니다.",
  홍염살: "紅艶(홍염) — 매력과 예술 감각의 별. 자녀가 아름다움에 민감한 결을 타고났습니다.",
};

export function inferPositiveSinsal(saju: SajuAnalysis): PositiveSinsalReading {
  const myShines: { name: string; meaning: string }[] = [];
  for (const sName of saju.sinsal) {
    const meaning = POSITIVE_SINSAL_MEANING[sName];
    if (meaning) {
      myShines.push({ name: sName, meaning });
    }
  }
  // 최대 3개만
  const top = myShines.slice(0, 3);
  return {
    hasAny: top.length > 0,
    shines: top,
    fallback: "자녀의 사주에는 두드러지는 신살(神煞)이 따로 보이지 않습니다. 신살이 없다는 것은 평탄하고 굴곡 적은 사주의 결을 뜻하며, 자녀 본연의 일주(日柱)와 격국이 인생을 이끄는 주된 동력이 됩니다.",
  };
}

// ── 건강 주의 (부족 오행 → 신체 부위) ──────────────────────────────
export interface HealthFocus {
  weakElement: string | null;  // "목" 등
  bodyArea: string;             // 약한 부위
  detail: string;               // 짧은 설명
  food: string;                 // 추천 식습관
}

const ELEM_HEALTH: Record<string, { area: string; detail: string; food: string }> = {
  목: {
    area: "간·근육·눈",
    detail: "스트레스를 받으면 쉽게 피로해지고, 눈이 침침해질 수 있습니다",
    food: "녹색 채소·신선한 과일·견과류로 간 기운을 채워주세요",
  },
  화: {
    area: "심장·혈관·소장",
    detail: "감정 기복이 클 수 있고, 심장이 빨리 뛰는 경우가 있습니다",
    food: "붉은 식품(토마토·당근·대추), 따뜻한 차로 화 기운을 보강하세요",
  },
  토: {
    area: "위장·소화기·근육",
    detail: "소화가 쉽게 안 되고 식욕 변동이 잦을 수 있습니다",
    food: "꾸준한 식사 시간, 호박·고구마 같은 노란 곡류·뿌리 채소가 좋습니다",
  },
  금: {
    area: "폐·기관지·피부",
    detail: "환절기에 호흡기가 약해지고 피부가 건조해지기 쉽습니다",
    food: "흰색 식품(배·도라지·무·연근)과 충분한 수분이 도움이 됩니다",
  },
  수: {
    area: "신장·방광·뼈",
    detail: "체력이 쉽게 떨어지고, 차가운 곳에서 컨디션이 흔들릴 수 있습니다",
    food: "검은콩·검은깨·해조류로 신장 기운을, 따뜻한 음식과 충분한 수면이 핵심입니다",
  },
};

export function inferHealthFocus(saju: SajuAnalysis): HealthFocus {
  const elements = saju.elements as Record<string, number>;
  const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  // 가장 부족한 오행 (10% 미만)
  let weakest: string | null = null;
  let minPct = 1;
  for (const el of ["목", "화", "토", "금", "수"]) {
    const pct = (elements[el] || 0) / total;
    if (pct < minPct && pct < 0.15) {
      minPct = pct;
      weakest = el;
    }
  }
  // 부족 오행이 없으면 일간 오행 기준 (균형형이면 일간이 가장 활발하니 그 부분 신경)
  const target = weakest || STEM_ELEM[saju.ilgan] || "토";
  const info = ELEM_HEALTH[target];
  return {
    weakElement: weakest,
    bodyArea: info.area,
    detail: info.detail,
    food: info.food,
  };
}

// ── 잘 맞는 친구 유형 ──────────────────────────────
export interface FriendType {
  bestType: string;       // 가장 잘 맞는 친구 (예: "차분한 사색형")
  bestReason: string;     // 사주 근거
  tipType: string;        // 시너지 나는 친구 (보완형)
  tipReason: string;
}

const ELEM_FRIEND_BEST: Record<string, string> = {
  목: "활기차고 따뜻한 친구",
  화: "차분히 들어주는 친구",
  토: "맑고 솔직한 친구",
  금: "유연하고 부드러운 친구",
  수: "성장 욕구가 강한 친구",
};
const ELEM_FRIEND_REASON: Record<string, string> = {
  목: "당신의 에너지를 함께 키워줄 친구",
  화: "당신의 빛을 단단히 받쳐줄 친구",
  토: "당신의 깊이를 환히 비춰줄 친구",
  금: "당신의 단단함을 부드럽게 풀어줄 친구",
  수: "당신의 지혜를 활기로 이어줄 친구",
};

export function inferFriendType(saju: SajuAnalysis): FriendType {
  const elem = STEM_ELEM[saju.ilgan] ?? "토";
  // 일지 오행에 따른 보완형
  const branchElem = BRANCH_ELEM[saju.pillars.day.branch] ?? "토";

  return {
    bestType: ELEM_FRIEND_BEST[elem] ?? "조화로운 친구",
    bestReason: `일간 ${saju.ilgan}(${elem}) — ${ELEM_FRIEND_REASON[elem] ?? ""}`,
    tipType: branchElem !== elem
      ? `${ELEM_FRIEND_BEST[branchElem] ?? "다른 결의 친구"}와도 깊은 인연이 됩니다`
      : "비슷한 결의 친구와 오래갑니다",
    tipReason: `일지 ${saju.pillars.day.branch}(${branchElem})의 영향`,
  };
}

// ── 일상 습관 가이드 ──────────────────────────────
export interface HabitGuide {
  sleep: string;
  morning: string;
  environment: string;
}

export function inferHabitGuide(saju: SajuAnalysis): HabitGuide {
  const elem = STEM_ELEM[saju.ilgan] ?? "토";
  const elements = saju.elements as Record<string, number>;
  const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const fireWeak = ((elements["화"] || 0) / total) < 0.15;
  const waterWeak = ((elements["수"] || 0) / total) < 0.15;

  let sleep: string;
  if (waterWeak) sleep = "충분한 수면이 핵심 — 규칙적인 잠자리 시간이 체력을 만들어줍니다";
  else if (fireWeak) sleep = "아침 햇살을 충분히 받는 게 좋아요 — 늦잠보다 일찍 일어나는 습관";
  else sleep = "일정한 시간의 수면 리듬이 가장 중요합니다";

  let morning: string;
  if (elem === "목" || elem === "화") morning = "아침에 햇볕을 받으며 활동하는 시간이 에너지를 키웁니다";
  else if (elem === "토" || elem === "금") morning = "조용한 아침 루틴(독서·정리)이 마음을 단단하게 합니다";
  else morning = "물 한 잔으로 시작하는 차분한 아침이 좋습니다";

  let environment: string;
  if (elem === "목") environment = "초록 식물·자연이 가까운 환경에서 잘 자랍니다";
  else if (elem === "화") environment = "밝고 환한 공간, 사람들과 어울리는 시간을 좋아합니다";
  else if (elem === "토") environment = "안정되고 정돈된 환경에서 마음이 편안합니다";
  else if (elem === "금") environment = "깔끔하고 절제된 공간, 자기만의 코너가 필요합니다";
  else environment = "조용히 사색할 수 있는 공간, 깊이 있는 책이 친구입니다";

  return { sleep, morning, environment };
}
