# 새 prompt 파일 3개 — 설계 메모

위치: `saju/lib/hongsil/prompts/refinement/`

---

## 1. `solo-escape.ts` — 솔로 탈출 가이드 (구체화)

### 입력
- 메인 LLM이 생성한 1차 본문 (솔로 탈출 가이드 sub)
- helper `derivePrescription(saju)` 결과 (사주 처방 데이터)
- 사용자 Q1 솔로 기간
- 사용자 이름

### prompt 구조
```
당신은 홍도인입니다. ${name}님의 솔로 탈출 가이드를 사주 처방 데이터에 근거해 다시 작성하세요.

[원본 본문 — 메인 LLM 1차 출력]
${mainBody}

[사주 처방 데이터 (이 안에서만 골라 쓸 것, 새 처방 추가 절대 금지)]
- 부족 오행: ${weakElement}
- 행동 처방: ${prescription.action.join(' / ')}
- 장소 처방: ${prescription.place.join(' / ')}
- 사물 처방: ${prescription.object.join(' / ')}
- 색상: ${prescription.color.join(' / ')}
- 피할 것: ${prescription.avoid.join(' / ')}
- 활용 신살: ${prescription.sinsalActivation.join(' / ')}

[★★★★★ 출력 룰]
- 원본 본문의 톤·문장 흐름·분량 유지.
- 일반 가이드(모임 나가라 / 메시지 X / 애매한 관계 X) → 위 처방 데이터에서 골라 구체화.
- 한 sub에 처방 데이터 중 2~3개만 자연스럽게 녹임. 한꺼번에 다 박지 말 것.
- 처방 데이터에 없는 행동·장소·사물 절대 만들지 말 것. (예: "북쪽으로 이사" 같은 단정 금지)
- 결핍 낙인 금지. 처방을 부족 보완이 아니라 "${weakElement}의 결을 풍성하게 하는 자연스러운 흐름"으로.
- 한자·전문용어 추가 금지.
- 이 prompt에 인용된 안내 어휘를 본문에 그대로 박지 말 것.
- 결과 본문만 반환.

[안내 어휘 풀 (반복 회피 시 일상 어휘로)]
- "곧게 뻗는 결", "스스로 다듬는 자리"  (사주 인자 재호출 시)
- "본인 결", "마음 안쪽의 자리", "시기 흐름"  (대명사 풀)
※ 이 어휘들은 안내일 뿐 본문에 그대로 박지 말 것.
```

### 출력
- 처방 데이터 녹인 새 본문 (sub 1개)
- 실패 시 빈 string 반환 → fallback으로 메인 본문 사용

---

## 2. `yearly-flow.ts` — 올해 연애에서 조심할 흐름 (구체화)

### 입력
- 메인 LLM 1차 본문
- helper `derivePrescription(saju)` 중 세운(올해) 흐름 데이터
- 사주 정보 (충·합 걸린 지지 확인용)
- 사용자 이름

### prompt 구조
```
당신은 홍도인입니다. ${name}님의 올해 연애 흐름을 세운 처방 데이터에 근거해 다시 작성하세요.

[원본 본문 — 메인 LLM 1차 출력]
${mainBody}

[세운 처방 데이터 (이 안에서만 골라 쓸 것)]
- 올해 강해지는 오행: ${seun.strongElement}
- 좋은 흐름: ${seun.goodFlow.join(' / ')}
- 피할 것 (행동): ${seun.avoidAction.join(' / ')}
- 피할 것 (장소): ${seun.avoidPlace.join(' / ')}
- 충(沖) 걸린 지지: ${seun.chungBranches.join(', ') || '없음'}
- 합(合) 들어온 지지: ${seun.hapBranches.join(', ') || '없음'}

[★★★★★ 출력 룰]
- 원본 본문의 톤·문장 흐름·분량 유지.
- 일반 조언(솔직해져라 / 속도 조절) → 위 세운 데이터로 구체화.
- 상반기/하반기 또는 계절감으로 흐름 표현 (이미 메인 prompt 룰).
- 처방 데이터에 없는 사건 단정 금지 (예: "이번 봄에 운명 만남" 같은 X).
- 충(沖) 걸린 시기 강조 — "이 시기엔 큰 결정 자제" 권장. 단 사주 데이터에 충 있을 때만.
- 결핍 낙인 금지.
- 이 prompt에 인용된 안내 어휘를 본문에 그대로 박지 말 것.
- 결과 본문만 반환.
```

### 출력
- 세운 처방 녹인 새 본문 (sub 1개)
- 실패 시 빈 string

---

## 3. `repetition-tone.ts` — 한자 반복·결핍 낙인·동물 직역 톤 (rewrite에서 import)

### 역할
이전 메인 prompt·rewrite prompt에 있던 안내 어휘를 한 곳으로 모음. rewrite 단계에서만 LLM에 노출.

### 내용 (rewrite prompt에 import할 블록)
```
[★★★★★ 톤 다듬기 안내 — 이 안내 어휘는 본문에 그대로 박지 말 것]

1. 한자 반복 회피
   - "내 매력은?" 이후 같은 한문 병기 다시 출력 금지
   - 같은 근거를 다시 짚어야 하면 그 근거가 만드는 행동·말투·반응을 일상 장면으로
   - 짧은 대명사("그 결", "이 흐름", "본인 결", "마음 안쪽의 자리") 반복 사용 X

2. 결핍 낙인 회피
   - "신약한 사주", "비겁이 없어", "식상이 약해", "부족해서 보완", "혼자 짊어짐", "감정을 삭임", "벽처럼 느껴짐" 표현 금지
   - "약한 ○○" 변형 표현도 회피 — "옅게 자리한 결" / "얇게 잡힌 결" / "천천히 풀리는 편" 톤으로
   - 결핍을 보완 대상으로 단정하지 말고, 사용자 결의 자연스러운 특성으로 풀어쓰기

3. 동물·자연 상징 직역 회피
   - 동물 직역 금지 (닭처럼·용처럼·쥐처럼 등)
   - 자연 비유는 1장 첫 sub만 허용, 후속 sub은 행동·말투·속도 어휘로

4. 합성 어색 회피
   - "본인 결(日干: 나를 상징하는 기운)" 식 풀 단어 + 한자 괄호 결합 금지
   - "관계의 자리이" 같은 조사 결함 회피
```

### 사용 위치
`llm-output-guard.ts`의 `rewriteOutput` 함수에서 import 후 prompt에 합침.

```typescript
import { REPETITION_TONE_GUIDE } from "./prompts/refinement/repetition-tone";

async function rewriteOutput(...) {
  const prompt = `
... 기존 rewrite prompt ...

${REPETITION_TONE_GUIDE}

[원문]
${input.text}
`;
}
```

---

## helper: `lib/hongsil/yongsin-prescription.ts`

### 인터페이스
```typescript
export interface YongsinPrescription {
  weakElement: '목' | '화' | '토' | '금' | '수' | '없음';
  action: string[];        // 행동 처방 2~3개
  place: string[];         // 장소 처방 2~3개
  object: string[];        // 사물 처방 1~2개
  color: string[];         // 색상 1~2개
  avoid: string[];         // 피할 것 1~2개
  sinsalActivation: string[]; // 보유 신살 기반 처방 1~2개
  seun: {
    strongElement: string;
    goodFlow: string[];
    avoidAction: string[];
    avoidPlace: string[];
    chungBranches: string[];
    hapBranches: string[];
  };
}

export function derivePrescription(saju: SajuAnalysis): YongsinPrescription;
```

### 매핑 데이터 출처
`1_사주처방_매핑_초안.md` 확정본을 코드 상수로 박음.
