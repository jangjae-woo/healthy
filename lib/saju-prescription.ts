// 평생사주 처방 helper (2026-05-14)
// 약한 오행·용신 기반 구체 행동·장소·음식·색·시간 처방 데이터 생성.
// LLM에 RULE이 아니라 DATA로 주입 — 모델이 자연스럽게 본문에 녹임.
//
// 사용처:
//   - compass (종합 해석) — 용신 풀이 결정판
//   - health (몸과 마음) — 약한 오행 → 몸 부위 + 처방
//   - timeline1/2 (시기별 흐름) — 시기별 처방 힌트
//
// ⚠ 의료·법률 영역 처방 절대 X. 행동·환경·식습관 정도만.

type Prescription = {
  direction: string;     // 동·서·남·북·중앙
  colors: string[];      // 색깔
  flavors: string[];     // 맛
  foods: string[];       // 음식 카테고리 (구체 메뉴 X — 약사·영양사 영역 회피)
  activities: string[];  // 행동·습관
  places: string[];      // 장소·환경
  timeOfDay: string;     // 하루 시간대
  season: string;        // 계절·달
  bodyArea: string;      // 살펴줄 몸 부위 (의료 진단 X — 생활 케어 톤)
  avoidActions: string;  // 약화시키는 패턴
};

const ELEMENT_PRESCRIPTION: Record<string, Prescription> = {
  목: {
    direction: '동쪽',
    colors: ['녹색', '연두', '파랑'],
    flavors: ['신맛'],
    foods: ['잎채소', '나물', '과일', '식초·레몬류'],
    activities: ['아침 산책', '스트레칭', '새 일 시작하기', '식물 가꾸기', '걷기 운동'],
    places: ['공원·숲', '강가·천변', '식물 많은 카페', '여행지'],
    timeOfDay: '새벽~오전',
    season: '봄 (2~4월)',
    bodyArea: '간·근육·인대·눈',
    avoidActions: '늦은 밤 야식·과로·분노 누적',
  },
  화: {
    direction: '남쪽',
    colors: ['빨강', '주황', '자주'],
    flavors: ['쓴맛'],
    foods: ['차·커피', '잡곡', '구운 음식', '쓴 나물'],
    activities: ['사람 만남·모임', '발표·강의', '햇볕 쬐기', '유산소 운동'],
    places: ['햇볕 잘 드는 카페', '광장·도심', '공연장', '밝은 사무 공간'],
    timeOfDay: '정오~오후',
    season: '여름 (5~7월)',
    bodyArea: '심장·혈관·소장·혈압',
    avoidActions: '늦은 밤 자극·과음·고립',
  },
  토: {
    direction: '중앙·황토 지역',
    colors: ['노랑', '황토', '베이지'],
    flavors: ['단맛'],
    foods: ['곡물·잡곡밥', '뿌리채소', '단호박·고구마', '꿀'],
    activities: ['정리·루틴 유지', '집밥 챙기기', '깊은 잠', '명상'],
    places: ['안정된 집', '단골 식당', '내 공간', '도서관'],
    timeOfDay: '점심 직후~이른 오후',
    season: '늦여름·환절기 (7~8월·환절기)',
    bodyArea: '위장·비장·소화기·복부',
    avoidActions: '폭식·자극적 음식·잦은 이동',
  },
  금: {
    direction: '서쪽',
    colors: ['흰색', '은색', '회색'],
    flavors: ['매운맛'],
    foods: ['생선·해산물', '흰 살코기', '마늘·생강', '맑은 국'],
    activities: ['결단·정리', '저녁 운동', '가벼운 단식', '글 정리'],
    places: ['물 가까운 곳', '미니멀 공간', '서쪽 창가', '운동 시설'],
    timeOfDay: '저녁',
    season: '가을 (8~10월)',
    bodyArea: '폐·기관지·대장·피부',
    avoidActions: '환절기 무방비·미세먼지 노출·미루는 결단',
  },
  수: {
    direction: '북쪽',
    colors: ['검정', '짙은 파랑', '남색'],
    flavors: ['짠맛'],
    foods: ['해조·미역·다시마', '검은콩·검은깨', '맑은 국', '굴·조개'],
    activities: ['휴식·독서', '깊은 잠', '수영·반신욕', '혼자 생각 정리'],
    places: ['물 있는 곳·강·바다', '조용한 서재', '북쪽 방'],
    timeOfDay: '밤',
    season: '겨울 (11~1월)',
    bodyArea: '신장·방광·허리·무릎·귀',
    avoidActions: '찬 기운 노출·수분 부족·과로',
  },
};

// 오행 한자 매핑
const ELEM_HANJA: Record<string, string> = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

/**
 * 처방 데이터 블록 — prompt에 prepend해서 LLM이 본문에 자연스럽게 녹임.
 * 룰이 아니라 데이터. 모델이 형식 정해서 쓰도록.
 */
export function buildPrescriptionContext(yongsin: string, weakest: string, strongest: string): string {
  const yong = ELEMENT_PRESCRIPTION[yongsin];
  const weak = ELEMENT_PRESCRIPTION[weakest];
  if (!yong || !weak) return '';

  const yongHanja = ELEM_HANJA[yongsin] ?? '';
  const weakHanja = ELEM_HANJA[weakest] ?? '';
  const strongHanja = ELEM_HANJA[strongest] ?? '';

  // 용신과 약한 오행이 같으면 같은 처방 — 약한 자리 보강 = 용신 보강
  const same = yongsin === weakest;

  return `
[★ 사주 처방 데이터 — 본문에 자연스럽게 녹이세요. 데이터 나열 금지. 룰북·표 형식 절대 X. "처방"·"가이드"·"개운법" 단어 X]
- 채울 결: ${yongsin}(${yongHanja}) — 용신
- 살펴줄 결: ${weakest}(${weakHanja})${same ? ' (용신과 동일 — 같은 결 보강)' : ''}
- 과한 결: ${strongest}(${strongHanja}) — 너무 강해서 빼줄 영역

[용신 보강 — ${yongsin} 결 채우기]
- 방향·환경: ${yong.direction}, ${yong.places.join(' · ')}
- 색깔: ${yong.colors.join(' · ')}
- 맛·음식: ${yong.flavors.join(' · ')} 중심. ${yong.foods.join(' · ')}
- 행동·습관: ${yong.activities.join(' · ')}
- 시간대: ${yong.timeOfDay} / 계절: ${yong.season}
- 몸으로는: ${yong.bodyArea} (의료 진단 X — 생활 케어 톤)
- 피할 것: ${yong.avoidActions}
${!same ? `
[약한 결 케어 — ${weakest}]
- 살펴줄 부위: ${weak.bodyArea}
- 도움 음식: ${weak.foods.slice(0, 2).join(' · ')}
- 도움 행동: ${weak.activities.slice(0, 2).join(' · ')}` : ''}

[작성 원칙]
- 위 데이터는 본문에 직접 나열하지 말고, 일상 장면 안에 자연스럽게 녹임. "월요일 아침 동쪽 산책길에 녹색 셔츠를 입고 산책하는 결" 같은 일상화.
- 데이터 중 본문 sub 주제와 맞는 1~3개만 골라 씀. 전부 다 박지 말 것.
- "처방·가이드·개운법" 류 메타 단어 출력 절대 X. 결·자리·습관 같은 자연스러운 어휘로.
- 의학적 진단·약·치료법 절대 X. 운동·식습관·환경·시간 정도만.`;
}

// 사주 처방 데이터를 외부에서 직접 참조할 때 (시각화 등)
export { ELEMENT_PRESCRIPTION };
export type { Prescription };
