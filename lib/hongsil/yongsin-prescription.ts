// 사주 처방 결정론 helper
// 출처: 룰북/연애사주최신화/1_사주처방_매핑_초안.md (풍수 통설 + 명리 신살 정통)
// LLM 자유 작문 차단용 — solo-escape·yearly-flow prompt에 이 데이터만 노출

import type { SajuAnalysis } from "../saju-calculator";

export type Element = "목" | "화" | "토" | "금" | "수";

export interface YongsinPrescription {
  weakElement: Element | "없음";
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
    avoidPlace: string[];
    chungBranches: string[];
    hapBranches: string[];
  };
  ilganTip: string;
}

// ── 부족 오행 5종 처방 ─────────────────────────────────────
const WEAK_ELEMENT_PRESCRIPTION: Record<Element, Omit<YongsinPrescription, "weakElement" | "sinsalActivation" | "seun" | "ilganTip">> = {
  수: {
    action: ["물·차·음료 자주 마시기", "반신욕·샤워 자주", "수영·아쿠아 운동", "명상·일기 쓰기"],
    place: ["바닷가·강가·호수 산책", "수족관·아쿠아리움 방문", "비 오는 날 카페"],
    object: ["어항·물고기 기르기", "푸른 잎 수경식물", "작은 분수·물그릇"],
    color: ["검은색·남색", "짙은 파랑"],
    avoid: ["사막·건조 환경 장기 체류", "땀 많이 흘리는 격렬 운동 매일"],
  },
  화: {
    action: ["햇볕 산책 자주", "가벼운 유산소 운동", "모임에 적극 참여", "의견 한 줄로 짧게 말하기 연습"],
    place: ["햇볕 잘 드는 카페·테라스", "낮은 산 등산", "캠프파이어·바비큐 자리"],
    object: ["따뜻한 색 인테리어 (조명·쿠션)", "빨간 꽃·작은 캔들"],
    color: ["빨강·주황", "핫핑크·노랑 포인트"],
    avoid: ["어두운 지하 공간 장기 체류", "차가운 음료만 마시기"],
  },
  목: {
    action: ["식물 키우기", "새 취미 시작", "공원·숲 산책", "책 읽기"],
    place: ["수목원·식물원", "공원·숲길", "도서관·서점"],
    object: ["화분·관엽식물", "나무 소재 가구·소품", "정돈된 책장"],
    color: ["녹색·연두", "진초록"],
    avoid: ["금속 가득한 공간 장기 체류", "콘크리트 밀집 지역만 머물기"],
  },
  금: {
    action: ["정리정돈 자주", "근력 운동", "매일 한 가지 결정 명확히 내리기"],
    place: ["도서관·서점·미술관", "깔끔한 카페", "헬스장"],
    object: ["금속 장신구 (시계·반지)", "흰 도자기·식기", "깔끔한 책상"],
    color: ["흰색·은색", "회색·하늘색"],
    avoid: ["어수선한 공간 장기 체류", "결정 미루기 습관"],
  },
  토: {
    action: ["흙·정원 가꾸기", "도자기·공예 체험", "명상·요가", "단 음식 적절히"],
    place: ["정원·텃밭", "도예 공방", "산속 펜션·황톳길"],
    object: ["도자기·자기", "흙·돌 소품", "황토 침구"],
    color: ["황색·갈색", "베이지·카키"],
    avoid: ["자주 이사·이동", "약속 자꾸 바꾸기"],
  },
};

// ── 신살 활용 처방 ─────────────────────────────────────────
const SINSAL_ACTIVATION: Record<string, string> = {
  도화살: "사람 많은 모임·전시·공연 자주 참여 — 자연스러운 끌림 발휘",
  홍염살: "외모 정돈에 작은 디테일 투자 — 끌림 발휘",
  천을귀인: "지인 소개·주선 자리에 열린 마음으로 응하기 — 인덕 흐름",
  월덕귀인: "봉사·기부 활동 — 덕 쌓는 흐름 강화",
  천덕귀인: "약속 한 가지 절대 안 어기기 — 덕의 시작",
  양인살: "결단 필요 시기에 활용 (관계 정리·고백) — 운동으로 에너지 발산",
  역마살: "여행·이사·새 환경에서 인연 만날 가능성 — 변화 받아들이는 사람과 매칭",
  화개살: "책방·전시·강의·종교 모임에서 인연 — 깊은 대화 자리 선호",
  귀문관살: "직감 신뢰 — 단 예민함이 부담 안 되도록 거리 두기 연습",
  금여: "자연스러운 만남 흐름 — 무리한 노력보다 여유 유지",
  현침살: "의료·정밀 분야 인연 가능성 — 말투 부드럽게 다듬기",
  장성살: "큰 결단 시기 — 리더 역할 받아들이기",
  태극귀인: "신비로운 영감·음양 조화 — 깊은 대화로 인연",
};

// ── 세운(올해) 흐름 처방 ───────────────────────────────────
const SEUN_FLOW: Record<Element, { goodFlow: string[]; avoidAction: string[]; avoidPlace: string[] }> = {
  화: {
    goodFlow: ["표현·만남 활발", "적극 추진해도 OK"],
    avoidAction: ["너무 뜨거운 자리 자제 — 감정 격해짐"],
    avoidPlace: ["한낮 땡볕 장시간", "매운 음식 모임 매일"],
  },
  수: {
    goodFlow: ["깊은 대화·정서 교감", "결혼 결단 시기로 좋음"],
    avoidAction: ["감정 과몰입 주의", "물가 야간 운전 자제"],
    avoidPlace: ["음주 모임 잦음", "폐쇄 공간 장시간"],
  },
  목: {
    goodFlow: ["새 시작·새 사람 만남", "도전·이사·이직 좋음"],
    avoidAction: ["너무 많이 벌리지 말고 한두 가지에 집중"],
    avoidPlace: ["산행 위험 시기엔 자중"],
  },
  금: {
    goodFlow: ["판단력·결단", "정리·고백·이별 결정 시기"],
    avoidAction: ["너무 단호해서 관계 끊지 말 것"],
    avoidPlace: ["칼·금속 다루는 위험 활동 자중"],
  },
  토: {
    goodFlow: ["안정·정착", "결혼·집·계약 결정 시기"],
    avoidAction: ["너무 머물러 새 기회 놓치지 말 것"],
    avoidPlace: ["토지 분쟁·이사 갈등 가능성"],
  },
};

// ── 일간별 추가 처방 ──────────────────────────────────────
const ILGAN_TIP: Record<string, string> = {
  갑: "곧음을 부드러움으로 다듬기 — 음악·시·소설 가까이",
  을: "자기 기준 세우기 — 작은 결단 매일",
  병: "표현 → 듣기 — 일기·명상",
  정: "감정 조절 — 차분한 산책",
  무: "마음 부드럽게 — 미술·전시 자주",
  기: "자기 표현 — 노래·춤·운동",
  경: "부드러움·감정 표현 — 음악·시",
  신: "사소한 다정 — 작은 선물 자주",
  임: "정착·집중 — 한 사람에게 집중",
  계: "자기 신뢰 — 자기 칭찬 일기",
};

// ── 충·합 결정론 매핑 ──────────────────────────────────────
const CHUNG_PAIRS: Record<string, string> = {
  자: "오", 축: "미", 인: "신", 묘: "유", 진: "술", 사: "해",
  오: "자", 미: "축", 신: "인", 유: "묘", 술: "진", 해: "사",
};
const HAP_PAIRS: Record<string, string> = {
  자: "축", 축: "자", 인: "해", 해: "인", 묘: "술", 술: "묘",
  진: "유", 유: "진", 사: "신", 신: "사", 오: "미", 미: "오",
};

function getCurrentSeunBranch(): string {
  // 올해 세운 지지 — 간단히 현재 연도 기준 12지지 순환
  // 갑자(甲子)년 = 4년, 갑술(甲戌)년 = 1934년처럼 60갑자 기반
  // 단순화: 연도 % 12 (자/축/인/묘/진/사/오/미/신/유/술/해)
  const branches = ["신", "유", "술", "해", "자", "축", "인", "묘", "진", "사", "오", "미"];
  // 1900 = 자년 기준 (사실은 더 정확한 만세력 필요하나 처방 용도엔 충분)
  // 2024 = 갑진, 2025 = 을사, 2026 = 병오, 2027 = 정미
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
export function derivePrescription(saju: SajuAnalysis): YongsinPrescription {
  // 가장 약한 오행 찾기
  const elements = saju.elements as Record<string, number>;
  const sorted = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => a[1] - b[1]);
  const firstWeak = sorted[0]?.[0];
  const weakElement: Element | "없음" = firstWeak ?? "없음";

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

  // 충·합 — 본인 사주 지지와 올해 세운 지지 충/합 확인
  const myBranches = [
    saju.pillars.year?.branch,
    saju.pillars.month?.branch,
    saju.pillars.day?.branch,
    saju.pillars.hour?.branch,
  ].filter((b): b is string => Boolean(b));

  const chungBranches = myBranches.filter(b => CHUNG_PAIRS[b] === seunBranch);
  const hapBranches = myBranches.filter(b => HAP_PAIRS[b] === seunBranch);

  // 일간 팁
  const ilganChar = saju.ilgan?.charAt(0) ?? "";
  const ilganTip = ILGAN_TIP[ilganChar] ?? "";

  return {
    weakElement,
    action: wePresc?.action.slice(0, 3) ?? [],
    place: wePresc?.place.slice(0, 3) ?? [],
    object: wePresc?.object.slice(0, 2) ?? [],
    color: wePresc?.color.slice(0, 2) ?? [],
    avoid: wePresc?.avoid.slice(0, 2) ?? [],
    sinsalActivation,
    seun: {
      strongElement: seunElement,
      goodFlow: seunFlow.goodFlow,
      avoidAction: seunFlow.avoidAction,
      avoidPlace: seunFlow.avoidPlace,
      chungBranches,
      hapBranches,
    },
    ilganTip,
  };
}
