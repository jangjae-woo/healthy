// 자도인 — 오행으로 보는 자녀의 결
// 사주의 강한 오행이 자녀에게 드러나는 모습을 풀이. 양육 가이드가 아니라 사주 풀이.
// 평생사주 코드는 0줄 건드리지 않음.

import type { SajuAnalysis } from "./saju-calculator";

export interface ObservationGuide {
  dominantElement: string;        // "목"
  dominantHanja: string;          // "木"
  catchphrase: string;            // 한 줄 요약
  emoji: string;                  // 🌳
  signals: string[];              // 5가지 관찰 시그널
  oppositeNote: string;           // 반대 행동을 보여도 자연스러운 이유
  safetyFrame: string;            // 안전장치 프레임 텍스트
}

const OBSERVATION_DATA: Record<string, {
  hanja: string;
  emoji: string;
  catchphrase: string;
  signals: string[];
  oppositeNote: string;
}> = {
  목: {
    hanja: "木",
    emoji: "🌳",
    catchphrase: "이 아이는 '나무 결'을 가장 강하게 타고났습니다 — 성장과 도전의 기운",
    signals: [
      "식물·나무 장난감, 자연 속 활동을 유난히 좋아합니다",
      "새로운 환경에 거리낌 없이 들어가 적응합니다",
      "'왜?'라는 질문이 끊이지 않고 호기심이 깊습니다",
      "키 큰 것·올라가는 것·자라나는 것에 매료됩니다",
      "책·이야기·언어를 또래보다 빠르게 받아들입니다",
    ],
    oppositeNote: "가끔은 조심스럽고 소극적인 모습도 보입니다. 약한 오행이 표면에 나오는 자연스러운 순간입니다.",
  },
  화: {
    hanja: "火",
    emoji: "🔥",
    catchphrase: "이 아이는 '불꽃 결'을 가장 강하게 타고났습니다 — 표현과 열정의 기운",
    signals: [
      "사람 앞에서 활발하게 자기 표현을 합니다",
      "음악·춤·연기·노래에 자연스럽게 반응합니다",
      "감정이 얼굴에 빨리 드러납니다 (잘 웃고 잘 토라지는)",
      "빨강·주황·노랑 같은 따뜻한 색을 즐겨 고릅니다",
      "친구들과 어울리는 자리에서 가장 빛이 납니다",
    ],
    oppositeNote: "혼자 조용히 있고 싶은 날도 있습니다. 빛나는 별도 가끔은 구름 뒤에서 쉽니다.",
  },
  토: {
    hanja: "土",
    emoji: "🏔",
    catchphrase: "이 아이는 '대지 결'을 가장 강하게 타고났습니다 — 안정과 신뢰의 기운",
    signals: [
      "같은 장난감·놀이를 오래 반복하며 즐깁니다",
      "친구들 사이의 다툼에 자연스럽게 중재 역할을 합니다",
      "한번 시작한 일을 끝까지 마무리하는 끈기가 있습니다",
      "익숙한 환경·익숙한 사람에게서 마음의 안정을 찾습니다",
      "음식·요리·식물 가꾸기 같은 일상의 일에 관심을 보입니다",
    ],
    oppositeNote: "어떤 날은 갑자기 새로운 것에 끌리기도 합니다. 견고한 산도 봄이 오면 살짝 흔들립니다.",
  },
  금: {
    hanja: "金",
    emoji: "⚔",
    catchphrase: "이 아이는 '금속 결'을 가장 강하게 타고났습니다 — 정밀과 결단의 기운",
    signals: [
      "블록·퍼즐·분류 놀이에 깊이 빠져듭니다",
      "규칙을 또렷이 이해하고 스스로 지키려 합니다",
      "손재주가 섬세합니다 (그림·종이접기·만들기에 정확함)",
      "옳고 그름에 민감하게 반응합니다",
      "흐트러진 것을 보면 정리하고 싶어 합니다",
    ],
    oppositeNote: "가끔은 충동적으로 흐트러뜨리는 날도 있습니다. 잘 다듬어진 칼도 잠시 칼집 밖에서 쉽니다.",
  },
  수: {
    hanja: "水",
    emoji: "🌊",
    catchphrase: "이 아이는 '물 결'을 가장 강하게 타고났습니다 — 사색과 지혜의 기운",
    signals: [
      "혼자 상상놀이·책 읽기·끄적이기를 좋아합니다",
      "물·바다·달·하늘 같은 것에 깊이 매료됩니다",
      "조용히 생각하다가 어른스러운 질문을 던집니다",
      "친한 사람과의 깊은 관계를 새로운 만남보다 좋아합니다",
      "잠을 깊이 자거나 꿈 이야기를 자주 합니다",
    ],
    oppositeNote: "어떤 날은 누구보다 활발하기도 합니다. 잔잔한 강물도 비가 오면 출렁입니다.",
  },
};

const SAFETY_FRAME =
  "사주는 오행 다섯을 모두 품으며, 그중 어느 기운이 더 강하게 드러나는가의 결입니다. 본기운이 강하다 하여 다른 모습이 없는 것은 아니며, 시기와 환경에 따라 다른 결이 표면에 떠오르기도 합니다. 자녀가 어릴수록 본성이 아직 충분히 자리잡기 전이며, 자라면서 점차 자기 결을 또렷이 드러냅니다. 풀이의 다섯 결이 모두 들어맞아야 하는 것이 아니라, 자녀의 본기운을 짚어 깊이 이해하기 위한 정통 사주 풀이입니다.";

export function getObservationGuide(saju: SajuAnalysis): ObservationGuide {
  const elements = saju.elements as Record<string, number>;
  // 가장 강한 오행
  const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] ?? "토";
  const data = OBSERVATION_DATA[dominant] ?? OBSERVATION_DATA["토"];
  return {
    dominantElement: dominant,
    dominantHanja: data.hanja,
    catchphrase: data.catchphrase,
    emoji: data.emoji,
    signals: data.signals,
    oppositeNote: data.oppositeNote,
    safetyFrame: SAFETY_FRAME,
  };
}
