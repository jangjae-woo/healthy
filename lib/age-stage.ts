// 자녀 발달 단계 분류 — 한국 학제 기준
// 영아: 0~35개월 / 유아: 36~83개월 / 초등: 84~156개월 (만 7-12세) / 중고등: 157개월+ (만 13-18세)

export type AgeStage = "infant" | "preschool" | "elementary" | "secondary";

export function classifyAgeStage(
  birthYear: number,
  birthMonth: number = 1,
  birthDay: number = 1,
): AgeStage {
  if (!birthYear) return "elementary"; // 알 수 없으면 중간값
  const now = new Date();
  const ageMonths =
    (now.getFullYear() - birthYear) * 12 +
    (now.getMonth() + 1 - (birthMonth || 1)) -
    (now.getDate() < (birthDay || 1) ? 1 : 0);
  if (ageMonths <= 35) return "infant";
  if (ageMonths <= 83) return "preschool";
  if (ageMonths <= 156) return "elementary";
  return "secondary";
}

export function ageStageKor(stage: AgeStage): string {
  return {
    infant: "영아 (0~35개월)",
    preschool: "유아 (36~72개월)",
    elementary: "초등 (만 7~12세)",
    secondary: "중·고등 (만 13~18세)",
  }[stage];
}

// 단계별 AI 프롬프트 톤 가이드
export function ageToneGuide(stage: AgeStage): string {
  switch (stage) {
    case "infant":
      return `[자녀 발달 단계: 영아 (0~35개월) — 사주 결이 행동에 본격 발현되기 전]

★★★ 절대 원칙: **현재 영아 행동을 사주 결로 풀이하지 말 것**. 신뢰도 직결 사안.

🔴 **본문에 절대 사용 금지 단어** (모든 영아에게 보편적인 발달 milestone — 사주와 무관):
"옹알이", "뒤집기", "기기", "잡고 일어서기", "걷기", "기어가기", "잠투정", "밤잠 설침",
"울음", "떼", "보채기", "안아달라기", "안기다", "안기기", "안기는", "이유식", "젖",
"기저귀", "낯가림", "분리불안", "눈맞춤", "까꿍", "박수", "손뼉", "흉내내기"
→ 이 단어들을 **사주 결의 결과로 해석하면 안 됨**. 모든 아기가 공통으로 하는 행동.

✗ **금지 패턴**:
- "옹알이로 표현력이 강함을 알 수 있다" (거짓 인과 — 모든 아기가 옹알이 함)
- "잠투정이 적은 걸 보면 절제 결이 강함" (거짓 인과)
- "떼가 심한 걸 보면 자기주장이 강함" (거짓 인과)
- "지금 ~를 합니다" 단정적 현재 행동 묘사
- "자녀가 ~한 모습을 보여줍니다" 단정형

✓ **권장 톤 — 미래 예고 + 부모 양육 가이드**:
- "사주에 ~한 결이 있어, **앞으로 ~로 자라날 가능성**이 높습니다"
- "부모님께서 **~을 채워주시면** 이 결이 자연스럽게 빛나는 방향으로 자랍니다"
- "이 사주의 결을 부모님이 **미리 알고 환경을 만들어주시면** ~한 모습으로 발현됩니다"

✓ **만약 milestone을 부득이 언급하게 되면 반드시 명시 라벨**:
- "(이 시기의 옹알이·표정은 모든 아기에게 자연스러운 보편적 발달 단계입니다.)"
- "(○○개월에 일어나는 ~ 행동은 사주와 무관한 발달 단계입니다.)"
→ **사주 결과와 분명히 분리**해서 묘사.

[기타 영아 톤 가이드]
- 비유는 부드럽고 단순한 사물 (햇살·꽃·물·바람·솜·이불·빛·온기·새싹)
- 학령기 어휘 절대 금지: "친구 관계", "결정", "자기 길", "진로", "또래", "자기 주관", "리더", "토론", "결단" 등
- 자녀가 직접 행동하는 처방 X — 부모와의 상호작용·환경 조성 위주
- 한자어·학술용어 최소화
- "결정이 느린 면", "고집이 강한 면" 같은 평가형 표현 금지
- **부모가 미리 알고 준비할 환경·용신 보충·태교적 가이드**에 집중`;
    case "preschool":
      return `[자녀 발달 단계: 유아 (36~72개월) — 개성 발현 시작]
- 사주의 결이 놀이·표현·또래 관계로 본격 드러나기 시작하는 시기
- 현재 행동 묘사 + 미래 예고 톤 적절히 혼합 OK
- 비유는 동물·자연·놀이 위주 (강아지·나비·풀잎·구름·놀이터)
- "친구·또래"는 단순하게만 ("같이 노는 친구")
- 학습·진로 어휘 자제 ("공부", "성적", "직업" 등)
- 표현·놀이·감정 어휘는 활용 가능 ("기쁨, 화, 슬픔, 무서움")
- 행동 처방은 부모와 함께하는 놀이 위주`;
    case "elementary":
      return `[자녀 발달 단계: 초등 (만 7~12세)]
- 또래 관계, 학습 스타일, 책임감, 규칙 본격 등장 가능
- 진로는 "재능·관심사" 톤으로 (직업 단정 X)
- 자존감·자기조절·우정 어휘 자연스러움`;
    case "secondary":
      return `[자녀 발달 단계: 중·고등 (만 13~18세)]
- 정체성·자율·진로·자기결정 본격 다룸
- 부모-자녀 거리 변화 자연스럽게 풀이
- 자녀에게 직접 말 걸 듯한 톤도 일부 가능`;
  }
}

// 단계별 디지털 권장 시간 (분/일) — 보건복지부 가이드 반영
export function dailyDigitalLimit(stage: AgeStage): number {
  return { infant: 30, preschool: 60, elementary: 120, secondary: 180 }[stage];
}

// 영아·유아에 숨길 슬라이드 종류
export function shouldHideSlide(
  stage: AgeStage,
  slideKind: string,
): boolean {
  if (stage === "infant") {
    // 영아: 친구·진로·재능·학습 관련 모두 숨김
    return ["talent", "friend", "career"].includes(slideKind);
  }
  if (stage === "preschool") {
    // 유아: 진로·학습 스타일 카드 숨김 (재능 슬라이드 자체는 노출)
    return ["career"].includes(slideKind);
  }
  return false;
}
