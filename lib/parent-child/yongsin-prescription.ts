// 부모자녀 사주 처방 helper (2026-05-14)
// hongsil의 yongsin-prescription 패턴을 부모자녀 양육 톤으로 변형.
// LLM 자유 작문 차단용 — interpretation-plan에 이 데이터만 노출.
//
// 핵심:
// - 부족 오행 처방 → 자녀 양육 환경·놀이·생활 톤
// - 신살 활용 → 자녀 인연·친구 톤
// - 세운 흐름 → 자녀 시기 톤
// - 일간 팁 → 자녀 본질 톤
// - 신강신약 → 정확한 용신 보충 권장 (LLM 자유 작문으로 잘못된 용신 박는 거 차단)

import type { SajuAnalysis } from "../saju-calculator";

export type Element = "목" | "화" | "토" | "금" | "수";

export interface ParentChildPrescription {
  weakElement: Element | "없음";
  strongElement: Element | "없음";
  yongsinCorrection: string;  // 신강신약 기반 용신 보충 권장 (saju.yongsin 잘못 추론 보정)
  action: string[];
  place: string[];
  object: string[];
  color: string[];
  avoid: string[];
  sinsalActivation: string[];
  seun: {
    strongElement: string;
    goodFlow: string[];
    avoidAction: string[];
  };
  ilganTip: string;
}

// ── 부족 오행 5종 양육 처방 (부모자녀 톤) ─────────────────
const WEAK_ELEMENT_PRESCRIPTION: Record<Element, Omit<ParentChildPrescription, "weakElement" | "strongElement" | "yongsinCorrection" | "sinsalActivation" | "seun" | "ilganTip">> = {
  수: {
    action: ["물놀이·목욕 시간 충분히", "책 읽어주기·자기 전 대화", "차분한 음악 들으며 잠들기"],
    place: ["바닷가·강가·호수 산책", "수족관·아쿠아리움", "조용한 도서관"],
    object: ["어항·수경식물", "푸른 잎 화분", "물그릇·작은 분수"],
    color: ["짙은 파랑·검정 옷·이불"],
    avoid: ["땀 많이 흘리는 격렬 놀이만", "건조한 환경 장시간"],
  },
  화: {
    action: ["햇볕 산책·야외 놀이 자주", "친구와 어울리는 자리", "신나는 음악·춤"],
    place: ["햇볕 잘 드는 놀이방·창가", "낮은 산·공원 등산", "캠프장·바비큐 자리"],
    object: ["따뜻한 색 침구·쿠션", "작은 캔들·간접 조명"],
    color: ["빨강·주황·노랑 포인트"],
    avoid: ["어두운 지하 공간 장시간", "차가운 음료만 자주"],
  },
  목: {
    action: ["식물 함께 키우기", "새 책·새 놀이 자주 접하기", "공원·숲 산책"],
    place: ["수목원·식물원", "공원·숲길", "도서관·서점"],
    object: ["화분·관엽식물", "나무 소재 가구·장난감"],
    color: ["녹색·연두·진초록"],
    avoid: ["금속 가득한 공간 장시간", "콘크리트만 있는 환경"],
  },
  금: {
    action: ["정리정돈 함께 연습", "맨손 운동·줄넘기", "약속·규칙 명확히 정하기"],
    place: ["깔끔한 카페·서점·미술관", "정돈된 도서관", "헬스장·체육관"],
    object: ["금속 소품·시계", "흰 도자기·식기", "깔끔한 책상"],
    color: ["흰색·은색·회색·하늘색"],
    avoid: ["어수선한 환경 장시간", "결정·약속 자꾸 미루기"],
  },
  토: {
    action: ["흙·모래·찰흙 놀이", "도자기·공예 체험", "고요한 명상·요가"],
    place: ["정원·텃밭", "도예 공방", "산속 펜션·황톳길"],
    object: ["도자기·자기", "흙·돌 소품", "황토 침구"],
    color: ["황색·갈색·베이지·카키"],
    avoid: ["자주 이사·이동", "약속·계획 자꾸 바꾸기"],
  },
};

// ── 신살 활용 처방 (부모자녀 톤) ──────────────────────────
const SINSAL_ACTIVATION: Record<string, string> = {
  도화살: "사람 많은 자리·공연·모임 좋아하는 결 — 자연스러운 친화력",
  홍염살: "외모·표현에 작은 디테일이 있는 결 — 자연스럽게 눈에 띔",
  천을귀인: "좋은 친구·선생·인연이 자주 다가오는 결 — 인덕 흐름",
  월덕귀인: "남을 돕는 결이 자연스러움 — 봉사·공감 활동 권장",
  천덕귀인: "약속·신뢰 결이 강함 — 작은 약속 지키는 습관 키우기",
  양인살: "결단력·집중력이 강함 — 운동·악기 등 에너지 발산 통로 필요",
  역마살: "변화·새 환경 잘 받아들이는 결 — 여행·체험 활동 권장",
  화개살: "책·예술·종교 결이 깊음 — 사색 시간 보장",
  귀문관살: "직감·예민함 강함 — 거리 두기 연습·차분한 환경",
  금여: "자연스러운 흐름·여유 — 무리한 학습 강요 X",
  현침살: "정밀·세밀 결이 강함 — 미술·공예·실험 활동 적합",
  장성살: "리더 결이 강함 — 작은 역할 책임 맡기기",
  태극귀인: "신비로운 영감·음양 조화 결 — 깊은 대화 자리",
  복성귀인: "복 많은 결 — 여유로운 환경에서 빛남",
  문창귀인: "학문·글 결이 깊음 — 책·교재 가까이 두기",
};

// ── 세운(올해) 흐름 양육 처방 ─────────────────────────────
const SEUN_FLOW: Record<Element, { goodFlow: string[]; avoidAction: string[] }> = {
  화: {
    goodFlow: ["표현·활동·만남 활발한 시기", "새 친구·새 활동에 적극 권장"],
    avoidAction: ["너무 흥분되는 자극 자제 — 감정 격해질 수 있음"],
  },
  수: {
    goodFlow: ["깊은 대화·정서 교감 좋은 시기", "차분한 학습·독서 적기"],
    avoidAction: ["감정 과몰입 주의 — 차분한 환경 유지"],
  },
  목: {
    goodFlow: ["새 시작·새 도전 좋은 시기", "새 학기·이사·전학 적기"],
    avoidAction: ["너무 많이 벌리지 말고 한두 가지 집중"],
  },
  금: {
    goodFlow: ["판단·결단·정리 좋은 시기", "약속·규칙 다시 세우기 적기"],
    avoidAction: ["너무 단호해서 관계 끊지 말 것"],
  },
  토: {
    goodFlow: ["안정·정착 시기", "일상 리듬 다잡기 적기"],
    avoidAction: ["너무 머물러 새 기회 놓치지 말 것"],
  },
};

// ── 일간별 양육 팁 ───────────────────────────────────────
const ILGAN_TIP: Record<string, string> = {
  갑: "곧고 큰 결 — 자기 페이스 존중. 음악·시·이야기 가까이 두면 결이 부드러워짐",
  을: "유연한 결 — 자기 기준 세우는 작은 결단 매일 연습",
  병: "밝은 결 — 표현 자유롭게, 듣기 연습도 균형",
  정: "따뜻한 결 — 감정 조절·차분한 산책이 도움",
  무: "넉넉한 결 — 마음 부드럽게, 미술·전시 자주",
  기: "포근한 결 — 자기 표현 권장, 노래·춤·운동",
  경: "단단한 결 — 부드러운 감정 표현, 음악·시 가까이",
  신: "섬세한 결 — 사소한 다정·작은 선물 자주",
  임: "넓은 결 — 한 가지 집중·정착 연습",
  계: "고요한 결 — 자기 신뢰·자기 칭찬 일기 권장",
};

// ── 신강신약 기반 용신 보충 권장 (정통 명리 기반) ────────
// saju-calculator의 yongsin이 잘못 결정된 경우 보정용.
// 신강·태강·극왕에 인성(생하는 기운)을 용신으로 잡으면 균형 더 깸 → 잘못된 풀이.
// 통설: 신약 = 비겁·인성 / 신강 = 식상·재성·관성 / 종강·종왕 = 비겁·인성 가능 (외격)
function deriveYongsinCorrection(saju: SajuAnalysis, strongEl: string, weakEl: string): string {
  const shinkang = (saju as SajuAnalysis & { shinkang?: string }).shinkang ?? "중화";
  const ilgan = saju.ilgan ?? "";
  const ilganElement = getElementOfStem(ilgan);

  if (shinkang.includes("극왕") || shinkang.includes("종강") || shinkang.includes("종왕")) {
    return `자녀 사주는 ${shinkang}(외격 가능성) — 본인 결 흐름을 따르는 결이라 본인 오행(${ilganElement})과 인성을 보충하는 결이 도움될 수 있음. 본인 기운 거스르는 극제 기운은 오히려 균형 깨질 위험.`;
  }
  if (shinkang.includes("태강") || shinkang.includes("신강")) {
    return `자녀 사주는 ${shinkang} — 본인 결(${ilganElement})이 강하므로, 식상·재성·관성 기운으로 빼주거나 다스리는 결이 도움. 본인 결 더 강하게 하는 인성·비겁은 균형 깰 위험. 가장 강한 결 "${strongEl}"이고 가장 약한 결 "${weakEl}"이니, 약한 결을 가볍게 보충하되 본인 결을 더 키우는 처방은 피한다.`;
  }
  if (shinkang.includes("극약") || shinkang.includes("태약") || shinkang.includes("신약")) {
    return `자녀 사주는 ${shinkang} — 본인 결(${ilganElement})이 약하므로, 인성·비겁 기운으로 도와주는 결이 자연스러움. 가장 약한 결 "${weakEl}"을 적극 보충하고, 본인 결을 극하는 관성은 무리하지 않게.`;
  }
  return `자녀 사주는 ${shinkang} — 본인 결(${ilganElement})이 균형 잡힘. 약한 결 "${weakEl}"을 가볍게 보충하는 정도로 충분.`;
}

function getElementOfStem(stem: string): string {
  const map: Record<string, string> = {
    갑: "목", 을: "목", 병: "화", 정: "화",
    무: "토", 기: "토", 경: "금", 신: "금",
    임: "수", 계: "수",
  };
  return map[stem.charAt(0)] ?? "?";
}

// ── 세운 지지 결정 ────────────────────────────────────────
function getCurrentSeunBranch(): string {
  const branches = ["신", "유", "술", "해", "자", "축", "인", "묘", "진", "사", "오", "미"];
  const year = new Date().getFullYear();
  const idx = (year - 1900) % 12;
  return branches[(idx + 12) % 12];
}

function elementOfBranch(branch: string): Element {
  const map: Record<string, Element> = {
    자: "수", 해: "수",
    인: "목", 묘: "목",
    사: "화", 오: "화",
    신: "금", 유: "금",
    축: "토", 진: "토", 미: "토", 술: "토",
  };
  return map[branch] ?? "토";
}

// ── 메인 derive 함수 ──────────────────────────────────────
export function deriveParentChildPrescription(saju: SajuAnalysis): ParentChildPrescription {
  const elements = saju.elements as Record<string, number>;
  const sorted = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => a[1] - b[1]);
  const firstWeak = sorted[0]?.[0];
  const lastStrong = sorted[sorted.length - 1]?.[0];
  const weakElement: Element | "없음" = firstWeak ?? "없음";
  const strongElement: Element | "없음" = lastStrong ?? "없음";

  // 부족 오행 처방
  const wePresc = firstWeak ? WEAK_ELEMENT_PRESCRIPTION[firstWeak] : null;

  // 신살 활용
  const sinsalActivation: string[] = [];
  for (const sinsal of saju.sinsal ?? []) {
    const matched = Object.keys(SINSAL_ACTIVATION).find(key => sinsal.includes(key));
    if (matched && sinsalActivation.length < 3) {
      sinsalActivation.push(`${matched}: ${SINSAL_ACTIVATION[matched]}`);
    }
  }

  // 세운 흐름
  const seunBranch = getCurrentSeunBranch();
  const seunElement = elementOfBranch(seunBranch);
  const seunFlow = SEUN_FLOW[seunElement] ?? SEUN_FLOW.토;

  // 일간 팁
  const ilganChar = saju.ilgan?.charAt(0) ?? "";
  const ilganTip = ILGAN_TIP[ilganChar] ?? "";

  // 용신 보충 권장 (신강신약 기반 정통 명리 보정)
  const yongsinCorrection = deriveYongsinCorrection(saju, strongElement, weakElement);

  return {
    weakElement,
    strongElement,
    yongsinCorrection,
    action: wePresc?.action.slice(0, 3) ?? [],
    place: wePresc?.place.slice(0, 3) ?? [],
    object: wePresc?.object.slice(0, 2) ?? [],
    color: wePresc?.color.slice(0, 1) ?? [],
    avoid: wePresc?.avoid.slice(0, 2) ?? [],
    sinsalActivation,
    seun: {
      strongElement: seunElement,
      goodFlow: seunFlow.goodFlow,
      avoidAction: seunFlow.avoidAction,
    },
    ilganTip,
  };
}

// ── prompt 블록 생성 (interpretation-plan에 prepend용) ──
export function parentChildPrescriptionBlock(p: ParentChildPrescription): string {
  return `
[★★★★★ 자도인 결정론 처방 — 본문에 이 데이터만 노출. LLM 자유 작문 금지]

[용신 보정 (정통 명리 기반)]
${p.yongsinCorrection}

[가장 강한 결 / 약한 결]
- 강한 결: ${p.strongElement}
- 약한 결: ${p.weakElement}

[부족 오행 양육 처방 — 약한 결 보충]
- 행동: ${p.action.join(" / ") || "없음"}
- 장소: ${p.place.join(" / ") || "없음"}
- 사물: ${p.object.join(" / ") || "없음"}
- 색: ${p.color.join(" / ") || "없음"}
- 피할 것: ${p.avoid.join(" / ") || "없음"}

[자녀 신살 활용]
${p.sinsalActivation.length ? p.sinsalActivation.map(s => `- ${s}`).join("\n") : "- (특별 활용 신살 없음)"}

[올해 세운 흐름 (${p.seun.strongElement} 결)]
- 좋은 흐름: ${p.seun.goodFlow.join(" / ")}
- 주의 행동: ${p.seun.avoidAction.join(" / ")}

[일간별 양육 팁]
${p.ilganTip}

[출력 룰]
- 위 처방 데이터를 본문에 자연스럽게 녹임. 데이터 이름(예: "도화살", "건록")은 자녀 양육 톤 일상 어휘로 번역.
- 용신 보정 사실을 무시하지 말 것. 신강·태강에 인성(생하는 기운)을 용신으로 박는 잘못된 풀이 절대 금지.
- 강한 결을 더 강화하는 처방 금지. 약한 결 보충 또는 강한 결 빼주는 방향.
`;
}
