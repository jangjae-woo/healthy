// 자도인 V2.1 — 보완 음식 사전
//
// ch7 sub2 "사주에 채워주면 좋은 음식"에서 사용.
// 한국인 친숙 식재료만. 한약재(당귀·황기 등) 제외.
// 자녀 부족 오행 + 약한 신체 부위 → 음식 풀에서 자연 인용.

import type { Element } from "./body-pool"

/**
 * 오행 보강 음식 풀 (전통 색·맛 매칭 + 한국인 일상 식재료).
 */
export const ELEMENT_TO_FOOD: Record<Element, {
  taste: string             // 전통 맛 매칭
  color: string             // 전통 색 매칭
  fruits: string[]          // 과일
  staples: string[]         // 구황작물·곡물
  vegetables: string[]      // 나물·반찬
  seafood: string[]         // 해산물·바다 재료
  others: string[]          // 그 외 친숙 식재료
}> = {
  목: {
    taste: "신맛",
    color: "초록·푸른빛",
    fruits: ["매실", "자두", "키위", "초록 사과", "청포도"],
    staples: ["보리", "녹두"],
    vegetables: ["시금치", "미나리", "부추", "쑥갓", "냉이", "상추"],
    seafood: [],
    others: ["식초 살짝 더한 반찬", "매실청"],
  },
  화: {
    taste: "쓴맛",
    color: "붉은빛",
    fruits: ["딸기", "수박", "체리", "토마토"],
    staples: ["붉은 팥", "수수"],
    vegetables: ["쑥", "여주", "도라지(약간 쓴맛)", "씀바귀"],
    seafood: [],
    others: ["대추차", "연근 조림"],
  },
  토: {
    taste: "단맛 (자연 단맛)",
    color: "노란빛",
    fruits: ["감", "곶감", "참외", "노란 사과"],
    staples: ["단호박", "고구마", "감자", "옥수수", "찹쌀", "조"],
    vegetables: ["당근", "단호박", "양배추"],
    seafood: [],
    others: ["기장밥", "꿀 살짝 곁들임"],
  },
  금: {
    taste: "매운맛 (은은한 매콤)",
    color: "흰빛",
    fruits: ["배", "곶배", "흰 복숭아"],
    staples: ["흰콩", "찹쌀"],
    vegetables: ["무", "도라지", "연근", "양파", "마늘", "생강"],
    seafood: [],
    others: ["배숙", "도라지청", "무국"],
  },
  수: {
    taste: "짠맛 (천연 염분)",
    color: "검은빛",
    fruits: ["블루베리", "검은 포도", "오디"],
    staples: ["검은콩", "검은깨", "검은쌀", "흑임자"],
    vegetables: [],
    seafood: ["멸치", "다시마", "미역", "김", "굴", "고등어"],
    others: ["검은콩물", "흑임자죽"],
  },
}

/**
 * 약한 신체 부위별 한국인 친숙 음식 풀 (전통적으로 그 부위에 좋다고 알려진 일상 식재료).
 */
export const BODY_TO_FOOD: Record<string, string[]> = {
  "기관지·폐": ["배", "도라지", "무", "생강차", "연근", "배숙"],
  "위·소화": ["단호박", "감자", "양배추", "당근", "찹쌀죽", "기장밥"],
  "간·눈": ["시금치", "당근", "블루베리", "결명자차", "키위"],
  "심장·정서": ["대추", "연근", "붉은 팥", "수수밥"],
  "신장·뼈·치아": ["멸치", "다시마", "검은콩", "검은깨", "미역", "흑임자"],
  "피부·소화": ["호박죽", "단호박", "양배추", "당근"],
  "수면·진정": ["대추차", "연근", "검은콩물"],
}

/**
 * 프롬프트에 박힐 음식 풀 룰 생성.
 * route.ts ch7Body sub2에서 ${injectFoodPool()} 형태로 호출.
 */
export function injectFoodPool(): string {
  const allElements: Element[] = ["목", "화", "토", "금", "수"]
  const lines = allElements.map((el) => {
    const f = ELEMENT_TO_FOOD[el]
    const allItems = [
      ...f.fruits.map((x) => `과일: ${x}`),
      ...f.staples.map((x) => `구황·곡물: ${x}`),
      ...f.vegetables.map((x) => `나물·반찬: ${x}`),
      ...f.seafood.map((x) => `해산물: ${x}`),
      ...f.others.map((x) => `기타: ${x}`),
    ]
    return `[${el} 보강 음식 — ${f.taste} · ${f.color}]
${allItems.map((x) => `  - ${x}`).join("\n")}`
  }).join("\n\n")

  const bodyLines = Object.entries(BODY_TO_FOOD).map(([part, items]) => {
    return `  ${part}: ${items.join(" · ")}`
  }).join("\n")

  return `[보완 음식 풀 — 한국인 친숙 식재료만. 한약재(당귀·황기 등) 절대 X]
자녀 부족 오행 + 약한 부위에 해당하는 풀에서 본문에 3~5개 자연 나열. 즉흥 음식 생성 X.

▼ 오행별 풀 ▼
${lines}

▼ 약한 부위별 친숙 음식 풀 ▼
${bodyLines}

⚠️ 본문 노출 룰:
- 3~5개 음식명만. 그 이상 나열 금지.
- "이렇게 먹이면 좋아요" 식의 조리법 추천은 1~2줄로 짧게 (예: "배숙 한 그릇" "고구마를 살짝 쪄서").
- 의학 효과 단정 금지 — "사주적으로 채워주는 결" 어조.
- 한약재(당귀·황기·인삼) 본문 노출 절대 금지. 한국인 일상 식재료만.`
}
