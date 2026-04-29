// 사주 보충 처방 매트릭스
// 5오행 × 3 발달 단계 × 6 카드 × 3 변형 = 270 처방
// 사주 명리 통설(오행 색·방향·계절·감각) 기반. AI는 키워드를 받아 한 줄 정제만.

export type Element5 = "목" | "화" | "토" | "금" | "수";
export type AgeTier = "infant" | "child" | "teen"; // 0-3 / 4-9 / 10+
export type CardKind =
  | "immediate" // 즉효 처방 — 자녀 본인이 10분 안 회복
  | "daily" // 일상 처방 — 매일·매주 루틴
  | "avoid" // 피해야 할 결 — 회복 방해
  | "space" // 공간 — 부모가 깔아주는 자리
  | "sense" // 감각 — 부모가 조절할 자극
  | "rhythm"; // 리듬 — 시간·반복 환경

export interface Prescription {
  emoji: string;
  text: string;
}

// ── 단계 분류 ──────────────────────────────
export function classifyAgeTier(ageInYears: number): AgeTier {
  if (ageInYears <= 3) return "infant";
  if (ageInYears <= 9) return "child";
  return "teen";
}

// ── 매트릭스 (5 × 3 × 6 × 3 = 270) ─────────────
const M: Record<Element5, Record<AgeTier, Record<CardKind, Prescription[]>>> = {
  목: {
    infant: {
      immediate: [
        { emoji: "🌱", text: "화분에 물 한 모금 함께 주기" },
        { emoji: "🍃", text: "창가에서 잎사귀 만져보기 1분" },
        { emoji: "🚶", text: "엄마 손 잡고 짧은 산책 한 바퀴" },
      ],
      daily: [
        { emoji: "🌳", text: "매일 식물 한 가지를 함께 돌보기" },
        { emoji: "☀️", text: "아침 햇살 드는 창가에서 10분 놀기" },
        { emoji: "🧺", text: "정해진 산책길을 매일 걷기" },
      ],
      avoid: [
        { emoji: "🚪", text: "창문 없는 답답한 방에 오래 두기" },
        { emoji: "🛋️", text: "바닥에서만 종일 머무르게 두기" },
        { emoji: "⏰", text: "하루 내내 같은 장난감만 쥐고 있게 두기" },
      ],
      space: [
        { emoji: "🪴", text: "침대 옆에 작은 화분 한 개 두기" },
        { emoji: "🪟", text: "햇살 드는 창문 가까이 놀이 자리" },
        { emoji: "🌿", text: "나무 무늬·초록색 매트 깔아주기" },
      ],
      sense: [
        { emoji: "🎵", text: "새소리·잎 흔들리는 자연 소리" },
        { emoji: "🟢", text: "푸른 계열 모빌을 천천히 흔들어 보여주기" },
        { emoji: "🌸", text: "옅은 잎 향·꽃 향으로 환기" },
      ],
      rhythm: [
        { emoji: "🌅", text: "아침 햇살 받으며 깨우기" },
        { emoji: "🌱", text: "매일 같은 시간 짧은 산책" },
        { emoji: "🌷", text: "봄·새해 같은 시작 시기에 새 자극 주기" },
      ],
    },
    child: {
      immediate: [
        { emoji: "🚴", text: "자전거·킥보드로 동네 짧은 한 바퀴" },
        { emoji: "🪴", text: "식물에 물 주고 잎 닦기" },
        { emoji: "🧗", text: "놀이터에서 자유롭게 뛰기 5분" },
      ],
      daily: [
        { emoji: "🌿", text: "매주 한 번 자연 산책 또는 텃밭 활동" },
        { emoji: "📚", text: "식물·동물 책 함께 읽고 관찰일지 쓰기" },
        { emoji: "🏞️", text: "매일 30분 야외 활동 시간" },
      ],
      avoid: [
        { emoji: "📺", text: "어두운 실내에서 영상만 장시간 보기" },
        { emoji: "🥱", text: "같은 자세로 오래 앉아 있게 두기" },
        { emoji: "🚫", text: "호기심에서 나온 질문을 잘라버리기" },
      ],
      space: [
        { emoji: "🪟", text: "창문 가까이 책상과 식물 한 두 개 두기" },
        { emoji: "🌳", text: "초록·나무결 가구 위주의 자리" },
        { emoji: "🗂️", text: "새 도전을 위한 빈 공간 한 구석 비워두기" },
      ],
      sense: [
        { emoji: "🟢", text: "푸른·초록 계열 옷·소품" },
        { emoji: "🐦", text: "새소리·바람 소리 BGM" },
        { emoji: "🍃", text: "풀·나무 향 디퓨저" },
      ],
      rhythm: [
        { emoji: "🌅", text: "아침 햇볕 30분 쬐기" },
        { emoji: "📅", text: "봄·새 학기에 새 활동 시작하기" },
        { emoji: "🌱", text: "매주 작은 새 도전 한 가지 권하기" },
      ],
    },
    teen: {
      immediate: [
        { emoji: "🌳", text: "공원·산책로에서 음악 들으며 10분 걷기" },
        { emoji: "📔", text: "종이에 떠오르는 생각 자유롭게 쓰기" },
        { emoji: "🧘", text: "가벼운 스트레칭이나 요가 5분" },
      ],
      daily: [
        { emoji: "🪴", text: "자기만의 반려 식물 돌보기" },
        { emoji: "📖", text: "매일 새 분야 책 한 챕터씩 읽기" },
        { emoji: "🚲", text: "매일 30분 야외 활동 시간" },
      ],
      avoid: [
        { emoji: "📱", text: "실내에서 스크린만 종일 보게 두기" },
        { emoji: "🚷", text: "새 시도를 막는 환경에 오래 두기" },
        { emoji: "🌑", text: "햇볕 없는 방에서만 공부하게 두기" },
      ],
      space: [
        { emoji: "🌿", text: "책상 위 식물 한 개·창가 자리 만들기" },
        { emoji: "🪟", text: "자연광이 들어오는 공부 자리" },
        { emoji: "🖼️", text: "자연 풍경 사진·푸른 톤 인테리어" },
      ],
      sense: [
        { emoji: "🎶", text: "자연 소리 BGM 플레이리스트" },
        { emoji: "🟢", text: "초록·푸른 톤 옷·필기구" },
        { emoji: "🌬️", text: "자주 환기해 바람 통하게 하기" },
      ],
      rhythm: [
        { emoji: "🌅", text: "아침에 일어나 햇볕 먼저 보기" },
        { emoji: "📆", text: "봄·새 학기에 새 도전 한 가지" },
        { emoji: "🌱", text: "매주 새 분야 한 가지 탐색해보기" },
      ],
    },
  },
  화: {
    infant: {
      immediate: [
        { emoji: "🌞", text: "햇볕 자리에서 까꿍·간지럽히기 1분" },
        { emoji: "🎵", text: "엄마와 동요 한 곡 박수치며 부르기" },
        { emoji: "🤲", text: "거울 보고 함께 환하게 웃어주기" },
      ],
      daily: [
        { emoji: "🎈", text: "매일 따뜻한 색 풍선·공으로 놀이" },
        { emoji: "🎶", text: "매일 같은 노래로 춤추는 시간 10분" },
        { emoji: "👨‍👩‍👧", text: "가족과 즐거운 식사·웃음의 시간" },
      ],
      avoid: [
        { emoji: "🌑", text: "어둡고 조용한 방에 혼자 두기" },
        { emoji: "😶", text: "표정 없이 무뚝뚝하게 응대하기" },
        { emoji: "🚪", text: "창문 닫고 햇볕 차단된 환경" },
      ],
      space: [
        { emoji: "☀️", text: "햇살 잘 드는 놀이 매트 자리" },
        { emoji: "🟧", text: "주홍·노랑 포인트 쿠션·소품" },
        { emoji: "🕯️", text: "은은한 따뜻한 조명" },
      ],
      sense: [
        { emoji: "🎵", text: "밝고 경쾌한 동요·박수 소리" },
        { emoji: "🟡", text: "따뜻한 색 그림책·모빌" },
        { emoji: "👏", text: "엄마의 환한 표정과 박수" },
      ],
      rhythm: [
        { emoji: "🌞", text: "정오 무렵 활동량 ↑" },
        { emoji: "☀️", text: "여름·맑은 날 외부 활동 늘리기" },
        { emoji: "🥁", text: "매일 같은 시간 신나는 음악 한 곡" },
      ],
    },
    child: {
      immediate: [
        { emoji: "🌞", text: "햇볕 자리에서 좋아하는 노래 한 곡 부르기" },
        { emoji: "💃", text: "음악 틀고 1분 신나게 춤추기" },
        { emoji: "🤝", text: "가족과 손바닥 마주치며 환하게 인사" },
      ],
      daily: [
        { emoji: "🎨", text: "매일 30분 활동적 놀이(춤·뛰기·그림)" },
        { emoji: "💬", text: "매일 좋아하는 사람과 즐거운 대화 시간" },
        { emoji: "🎭", text: "매주 한 번 표현 활동(역할놀이·노래방)" },
      ],
      avoid: [
        { emoji: "🌑", text: "어둡고 고요한 곳에 혼자 오래 머무르기" },
        { emoji: "😐", text: "감정 표현을 억누르게 하는 분위기" },
        { emoji: "🚷", text: "활동·웃음을 자꾸 제지하기" },
      ],
      space: [
        { emoji: "☀️", text: "햇살 잘 드는 책상·놀이 자리" },
        { emoji: "🟧", text: "주홍·노랑 포인트 인테리어" },
        { emoji: "🎈", text: "가족 사진·웃는 그림 걸어두기" },
      ],
      sense: [
        { emoji: "🌈", text: "밝고 따뜻한 색 옷·소품" },
        { emoji: "🎵", text: "리듬감 있는 음악·박수 소리" },
        { emoji: "🍊", text: "상큼한 시트러스 향" },
      ],
      rhythm: [
        { emoji: "🌞", text: "정오 무렵 가장 활기찬 활동 배치" },
        { emoji: "🏖️", text: "여름·축제 시기에 외부 활동 ↑" },
        { emoji: "🎤", text: "매일 한 번 큰 소리로 웃거나 노래하기" },
      ],
    },
    teen: {
      immediate: [
        { emoji: "🎧", text: "좋아하는 곡 따라 헤드폰으로 노래·춤 1곡" },
        { emoji: "💬", text: "친한 친구와 짧게 즐거운 대화" },
        { emoji: "🌞", text: "햇볕 자리에 5분 머무르기" },
      ],
      daily: [
        { emoji: "🎨", text: "매일 30분 좋아하는 표현 활동(악기·그림·운동)" },
        { emoji: "🤝", text: "매일 한 명과 의미 있는 대화" },
        { emoji: "🎭", text: "매주 한 번 좋아하는 사람들과 모임" },
      ],
      avoid: [
        { emoji: "🌑", text: "어두운 방에서 혼자 종일 머무르기" },
        { emoji: "📱", text: "감정 표현 없이 스크린만 보기" },
        { emoji: "🚪", text: "타인과의 즐거운 접점이 줄어드는 환경" },
      ],
      space: [
        { emoji: "☀️", text: "자연광 드는 자리·따뜻한 색 포인트" },
        { emoji: "🖼️", text: "좋아하는 사람·풍경 사진 걸어두기" },
        { emoji: "🟧", text: "주홍·노랑 책상 소품" },
      ],
      sense: [
        { emoji: "🎶", text: "신나는 플레이리스트" },
        { emoji: "🌈", text: "밝은 색 옷·필기구" },
        { emoji: "☀️", text: "따뜻한 조명·시트러스 향" },
      ],
      rhythm: [
        { emoji: "🌞", text: "낮 시간대 활동·외출 늘리기" },
        { emoji: "🏖️", text: "여름·방학에 친구·가족 모임 ↑" },
        { emoji: "🎤", text: "매일 한 번 큰 소리로 표현하기" },
      ],
    },
  },
  토: {
    infant: {
      immediate: [
        { emoji: "🤱", text: "엄마 무릎에 앉혀 가만히 안아주기" },
        { emoji: "🍯", text: "따뜻한 간식·차 한 모금 함께 먹기" },
        { emoji: "🛏️", text: "익숙한 이불·인형 곁에 두기" },
      ],
      daily: [
        { emoji: "🕰️", text: "매일 같은 시간 같은 자리에서 식사" },
        { emoji: "📚", text: "매일 같은 책 한 권 반복해 읽어주기" },
        { emoji: "🛁", text: "정해진 시간 목욕·잠자리 의식" },
      ],
      avoid: [
        { emoji: "🔄", text: "잦은 일정 변경·환경 바꾸기" },
        { emoji: "🆕", text: "낯선 장소·낯선 사람 연속 노출" },
        { emoji: "⚡", text: "예측 불가한 변화·갑작스런 자극" },
      ],
      space: [
        { emoji: "🪵", text: "도자기·나무 결 가구 톤" },
        { emoji: "🟫", text: "베이지·황토 톤 침구·매트" },
        { emoji: "🏠", text: "한 구석 늘 같은 자리에 놀이 코너" },
      ],
      sense: [
        { emoji: "🎵", text: "엄마의 낮은 톤 자장가" },
        { emoji: "🟤", text: "갈색·황색 차분한 색감" },
        { emoji: "🌾", text: "흙·우디 향 디퓨저" },
      ],
      rhythm: [
        { emoji: "🕰️", text: "매일 같은 시간 잠자리·식사" },
        { emoji: "🍂", text: "환절기에 안정 활동·실내 시간 ↑" },
        { emoji: "📅", text: "주간 루틴 표를 함께 만들어 따라가기" },
      ],
    },
    child: {
      immediate: [
        { emoji: "🤗", text: "엄마 옆에 앉아 따뜻한 음료 함께 마시기" },
        { emoji: "🧸", text: "익숙한 인형·이불에 안기기" },
        { emoji: "🍞", text: "좋아하는 따뜻한 간식 한 입 같이 먹기" },
      ],
      daily: [
        { emoji: "🕰️", text: "매일 같은 시간 같은 자리에서 식사·공부" },
        { emoji: "📋", text: "주간 루틴 표 만들어 따라가기" },
        { emoji: "👨‍👩‍👧", text: "매주 같은 날 가족 시간 정해두기" },
      ],
      avoid: [
        { emoji: "🔄", text: "갑작스런 일정 변경·예고 없는 외출" },
        { emoji: "🆕", text: "낯선 환경에 자주 연속 노출" },
        { emoji: "⏰", text: "변덕스러운 잠자리·식사 시간" },
      ],
      space: [
        { emoji: "🪵", text: "나무·도자기 소재 책상·소품" },
        { emoji: "🟫", text: "베이지·황토 톤 인테리어" },
        { emoji: "🏠", text: "늘 같은 자리에 자기만의 코너" },
      ],
      sense: [
        { emoji: "🟤", text: "갈색·황색 차분한 색감 옷·물건" },
        { emoji: "🎵", text: "차분한 톤 음악·낮은 목소리" },
        { emoji: "🌾", text: "흙·우디 향 디퓨저" },
      ],
      rhythm: [
        { emoji: "🕰️", text: "매일 같은 시간 잠자리·식사" },
        { emoji: "🍂", text: "환절기에 평소 루틴 더 단단히" },
        { emoji: "📅", text: "큰 변화 전 미리 예고하고 적응 시간 주기" },
      ],
    },
    teen: {
      immediate: [
        { emoji: "🤲", text: "익숙한 자기 방·자기 자리로 돌아가 쉬기" },
        { emoji: "☕", text: "따뜻한 차 한 잔 천천히 마시기" },
        { emoji: "📖", text: "오래 본 책·익숙한 콘텐츠 한 페이지" },
      ],
      daily: [
        { emoji: "📋", text: "고정된 주간 계획표 만들고 따라가기" },
        { emoji: "🕰️", text: "매일 같은 시간 잠자리·기상" },
        { emoji: "🥘", text: "매일 한 끼는 정해진 자리에서 식사" },
      ],
      avoid: [
        { emoji: "🔄", text: "잦은 환경·계획 변경" },
        { emoji: "⚡", text: "예측 불가한 자극이 많은 환경" },
        { emoji: "🆕", text: "낯선 장소 연속 외출" },
      ],
      space: [
        { emoji: "🪵", text: "나무·도자기 소재 책상" },
        { emoji: "🟫", text: "베이지·황토 톤 침구·인테리어" },
        { emoji: "🏠", text: "안정된 자기만의 자리 유지" },
      ],
      sense: [
        { emoji: "🟤", text: "갈색·황색 차분한 톤 옷·소품" },
        { emoji: "🎵", text: "차분한 어쿠스틱·로파이 음악" },
        { emoji: "🌾", text: "우디·흙 계열 향" },
      ],
      rhythm: [
        { emoji: "🕰️", text: "매일 같은 시간 잠·식사 유지" },
        { emoji: "🍂", text: "환절기에 평소 루틴 단단히" },
        { emoji: "📅", text: "큰 변화는 미리 예고하고 천천히 옮기기" },
      ],
    },
  },
  금: {
    infant: {
      immediate: [
        { emoji: "🪟", text: "장난감 한 칸 정리하고 박수 받기" },
        { emoji: "🔔", text: "맑은 종소리 함께 듣기" },
        { emoji: "👏", text: "한 가지 일 끝까지 마무리한 뒤 칭찬" },
      ],
      daily: [
        { emoji: "🧺", text: "매일 잠자기 전 한 가지 정리 의식" },
        { emoji: "🎶", text: "매일 같은 시간 짧은 음악 의식" },
        { emoji: "✅", text: "오늘 한 일 한 가지를 손가락으로 짚어주기" },
      ],
      avoid: [
        { emoji: "🌪️", text: "어수선한 자리·정리되지 않은 환경" },
        { emoji: "🔀", text: "한 가지를 끝내기 전 다른 것으로 넘어가게" },
        { emoji: "🤐", text: "끝맺음에 대한 인정 없이 넘어가기" },
      ],
      space: [
        { emoji: "🤍", text: "흰색·은색 포인트 소품" },
        { emoji: "🪞", text: "정돈된 책장·서랍 한 칸" },
        { emoji: "💡", text: "단정한 라인의 스탠드·조명" },
      ],
      sense: [
        { emoji: "🔔", text: "맑은 종소리·풍경 소리" },
        { emoji: "⚪", text: "흰·은빛 인형·천" },
        { emoji: "🌿", text: "정갈한 라벤더·민트 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "저녁 같은 시간에 정리·잠자리" },
        { emoji: "🍁", text: "가을·환절기에 정리 활동 ↑" },
        { emoji: "📦", text: "매주 한 번 장난감 정리 의식" },
      ],
    },
    child: {
      immediate: [
        { emoji: "🗂️", text: "책상 한 칸·서랍 한 칸 끝까지 정리" },
        { emoji: "✏️", text: "오늘 한 일 한 줄 적어 끝맺음 짓기" },
        { emoji: "🔔", text: "맑은 종소리·풍경 소리 듣기 1분" },
      ],
      daily: [
        { emoji: "📋", text: "매일 자기 전 오늘 일 한 줄 일기" },
        { emoji: "🧹", text: "매주 한 번 함께 물건 정리하기" },
        { emoji: "✅", text: "한 번에 한 가지 일을 끝까지" },
      ],
      avoid: [
        { emoji: "🌪️", text: "어수선한 책상에서 공부하기" },
        { emoji: "🔀", text: "여러 일을 동시에 시켜 못 끝내게 두기" },
        { emoji: "🤐", text: "끝맺음을 칭찬 없이 그냥 넘기기" },
      ],
      space: [
        { emoji: "🗂️", text: "정돈된 책상·라벨 붙인 서랍" },
        { emoji: "🤍", text: "흰 벽 한 면 깔끔하게 비우기" },
        { emoji: "💡", text: "금속 소재 스탠드·정갈한 조명" },
      ],
      sense: [
        { emoji: "⚪", text: "흰·은빛 옷·문구류" },
        { emoji: "🔔", text: "맑은 풍경 소리·차임 BGM" },
        { emoji: "🌿", text: "민트·라벤더 정갈한 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "저녁마다 정리·끝맺음 의식 시간" },
        { emoji: "🍁", text: "가을·환절기에 한 가지 마무리 프로젝트" },
        { emoji: "✅", text: "주간 미션 1개 완수 후 함께 체크" },
      ],
    },
    teen: {
      immediate: [
        { emoji: "🗂️", text: "책상 한 칸 정리·끝까지 마무리" },
        { emoji: "📔", text: "오늘 한 일 한 줄 일지로 정리" },
        { emoji: "🔔", text: "조용한 자리에서 맑은 소리 듣기 1분" },
      ],
      daily: [
        { emoji: "📋", text: "매일 짧은 회고·일지 쓰기" },
        { emoji: "🎯", text: "한 번에 한 과제 끝까지 집중" },
        { emoji: "🧹", text: "매주 한 번 자기 공간 정리" },
      ],
      avoid: [
        { emoji: "🌪️", text: "어수선한 환경·동시 다발 과제" },
        { emoji: "🔀", text: "끝내지 못한 일이 쌓이게 두기" },
        { emoji: "🤐", text: "성취·끝맺음을 인정받지 못하는 분위기" },
      ],
      space: [
        { emoji: "🗂️", text: "정돈된 책상·미니멀 인테리어" },
        { emoji: "🤍", text: "흰·은 톤 책상 소품" },
        { emoji: "💡", text: "금속 라인 스탠드 조명" },
      ],
      sense: [
        { emoji: "⚪", text: "흰·은빛 옷·문구" },
        { emoji: "🔔", text: "맑은 BGM·차임 사운드" },
        { emoji: "🌿", text: "민트·라벤더 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "매일 저녁 끝맺음·회고 시간" },
        { emoji: "🍁", text: "가을·환절기에 한 프로젝트 마무리" },
        { emoji: "🎯", text: "주간 목표 1개 완수 의식" },
      ],
    },
  },
  수: {
    infant: {
      immediate: [
        { emoji: "🛁", text: "따뜻한 물에 손·발 잠깐 담그기" },
        { emoji: "🌙", text: "조명 낮추고 가만히 안아주기" },
        { emoji: "💧", text: "물 한 모금 천천히 마시게 하기" },
      ],
      daily: [
        { emoji: "📖", text: "매일 잠자기 전 30분 차분한 그림책" },
        { emoji: "🛀", text: "매일 정해진 시간 따뜻한 목욕" },
        { emoji: "🎵", text: "잔잔한 자장가 매일 같은 시간" },
      ],
      avoid: [
        { emoji: "📺", text: "시끄러운 영상·연속 자극 장시간" },
        { emoji: "🔊", text: "큰 소리·강한 빛이 많은 환경" },
        { emoji: "⚡", text: "급격한 자극 변화" },
      ],
      space: [
        { emoji: "🌙", text: "은은한 무드등 자리" },
        { emoji: "🟦", text: "푸른 계열 침구·이불" },
        { emoji: "💧", text: "물·작은 분수 같은 차분한 소품" },
      ],
      sense: [
        { emoji: "🎵", text: "잔잔한 자연 소리·물소리 BGM" },
        { emoji: "🔵", text: "푸른빛 모빌·천" },
        { emoji: "🌬️", text: "은은한 우디·라벤더 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "자기 1시간 전부터 자극 줄이기" },
        { emoji: "❄️", text: "겨울·자정 시기 정적 활동 ↑" },
        { emoji: "📵", text: "잠자리에서 디지털 기기 멀리하기" },
      ],
    },
    child: {
      immediate: [
        { emoji: "🛁", text: "따뜻한 물에 손 담그거나 짧은 목욕" },
        { emoji: "📖", text: "조용한 자리에서 좋아하는 책 한 페이지" },
        { emoji: "🌙", text: "조명 낮추고 5분 멍 때리기" },
      ],
      daily: [
        { emoji: "📚", text: "매일 잠 전 30분 조용한 독서" },
        { emoji: "🛀", text: "매일 정해진 시간 따뜻한 목욕" },
        { emoji: "🧘", text: "매일 자기 전 10분 차분한 시간" },
      ],
      avoid: [
        { emoji: "📺", text: "시끄러운 게임·연속 영상 시청" },
        { emoji: "🔊", text: "강한 자극이 끊이지 않는 환경" },
        { emoji: "⚡", text: "잠 직전 자극적 콘텐츠" },
      ],
      space: [
        { emoji: "🌙", text: "은은한 무드등 침대 자리" },
        { emoji: "🟦", text: "푸른 계열 침구·커튼" },
        { emoji: "💧", text: "물 한 컵 곁에·작은 분수 소품" },
      ],
      sense: [
        { emoji: "🎵", text: "잔잔한 자연 소리·클래식 음악" },
        { emoji: "🔵", text: "푸른·남색 톤 옷·물건" },
        { emoji: "🌬️", text: "라벤더·시더우드 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "자기 1시간 전 디지털 OFF" },
        { emoji: "❄️", text: "겨울·저녁 시간 정적 활동 ↑" },
        { emoji: "📵", text: "매일 같은 시간 차분한 마무리 의식" },
      ],
    },
    teen: {
      immediate: [
        { emoji: "🛁", text: "따뜻한 물에 손 담그기 또는 짧은 샤워" },
        { emoji: "📔", text: "노트에 떠오르는 생각 자유롭게 쓰기" },
        { emoji: "🧘", text: "5분 호흡 명상·눈 감고 쉬기" },
      ],
      daily: [
        { emoji: "📚", text: "매일 잠 전 30분 책 또는 글쓰기" },
        { emoji: "🧘", text: "매일 10분 명상·요가" },
        { emoji: "🛀", text: "매일 정해진 시간 차분한 자기 시간" },
      ],
      avoid: [
        { emoji: "📱", text: "잠 직전까지 스크린·SNS 보기" },
        { emoji: "🔊", text: "시끄럽고 자극적인 환경에 종일" },
        { emoji: "⚡", text: "연속 자극 콘텐츠로 휴식 시간 채우기" },
      ],
      space: [
        { emoji: "🌙", text: "은은한 무드등 책상·침대 자리" },
        { emoji: "🟦", text: "푸른·남색 침구·커튼" },
        { emoji: "💧", text: "물 한 컵·식물 곁에 두기" },
      ],
      sense: [
        { emoji: "🎵", text: "로파이·자연 소리 BGM" },
        { emoji: "🔵", text: "푸른 톤 옷·필기구" },
        { emoji: "🌬️", text: "라벤더·시더우드 향" },
      ],
      rhythm: [
        { emoji: "🌙", text: "자기 1시간 전 디지털 OFF" },
        { emoji: "❄️", text: "겨울·저녁에 정적 활동 시간 ↑" },
        { emoji: "📵", text: "매일 같은 시간 차분한 마무리 의식" },
      ],
    },
  },
};

// 사주 해시(생년월일+이름) → 변형 인덱스 0~2
function hashIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

export interface PrescriptionSet {
  weakElement: Element5;
  ageTier: AgeTier;
  immediate: Prescription;
  daily: Prescription;
  avoid: Prescription;
  space: Prescription;
  sense: Prescription;
  rhythm: Prescription;
  source: string; // "사주 보충 처방 매트릭스 (오행 보충 원칙 기반)"
}

// 약한 오행 + 발달 단계 + 사주 해시로 6카드 처방 결정
export function buildPrescriptionSet(
  weakElement: Element5,
  ageInYears: number,
  seedString: string,
): PrescriptionSet {
  const tier = classifyAgeTier(ageInYears);
  const cells = M[weakElement][tier];
  const idx = hashIndex(seedString, 3);
  return {
    weakElement,
    ageTier: tier,
    immediate: cells.immediate[idx % cells.immediate.length],
    daily: cells.daily[(idx + 1) % cells.daily.length],
    avoid: cells.avoid[(idx + 2) % cells.avoid.length],
    space: cells.space[idx % cells.space.length],
    sense: cells.sense[(idx + 1) % cells.sense.length],
    rhythm: cells.rhythm[(idx + 2) % cells.rhythm.length],
    source: "사주 보충 처방 매트릭스 (오행 보충 원칙 기반)",
  };
}

// 약한 오행 결정 (가장 비율 낮은 1개)
export function pickWeakestElement(elements: Record<string, number>): Element5 {
  const order: Element5[] = ["목", "화", "토", "금", "수"];
  let weakest: Element5 = "수";
  let min = Infinity;
  for (const el of order) {
    const v = elements[el] ?? 0;
    if (v < min) {
      min = v;
      weakest = el;
    }
  }
  return weakest;
}
