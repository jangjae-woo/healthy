# 아이기질+부모양육 v1 상품 계약 초안

작성일: 2026-05-19  
현재 진행률: 60%

## 상품 정의

상품명 임시:

```text
아이기질+부모양육 보고서 v1
```

핵심 약속:

```text
아이를 평가하거나 단정하는 보고서가 아니라,
아이의 기질 흐름과 부모의 양육 결이 만나는 방식을 설명하고,
부모가 일상에서 바로 적용할 수 있는 양육 힌트를 주는 보고서.
```

## 보고서의 독자

주 독자:

- 아이의 엄마
- 아이의 아빠
- 아이를 함께 돌보는 보호자

따라서 문장은 부모를 비난하면 안 된다.

특히 금지:

- 부모 때문에 아이가 이렇게 됐다
- 아이가 문제다
- 부모가 잘못 키웠다
- 이 아이는 원래 어렵다
- 이 부모와는 맞지 않는다

권장:

- 이 아이는 이런 조건에서 더 편안해진다
- 이 부모의 결은 이런 방식으로 아이에게 닿는다
- 속도/말투/환경을 이렇게 조정하면 부담이 줄어든다
- 충돌은 나쁜 것이 아니라 맞추어야 할 박자다

## 필수 구조

### 1. 아이 단독 기질

6요인:

- 활기
- 조심
- 만족
- 흔들림
- 어울림
- 끈기

각 요인 필수 블록:

- whyIntro
- dailyBody
- parentingTipTime
- parentingTipCommunication
- parentingTipEnvironment

### 2. 부모 단독 사주/양육 결

부모:

- mother
- father

각 부모 필수 블록:

- parentSajuBody
- parentSajuBridge

부모 6축:

- 온기
- 중심
- 일관
- 자율
- 표현
- 바람

주의:

부모 6축 이름은 최종 본문에 과하게 노출하지 않는다. 내부 판단표/매트릭스에는 쓰되, 고객 문장에서는 “받쳐주는 결”, “기준을 세우는 결”처럼 부드럽게 풀어 쓴다.

### 3. 부모-아이 궁합

필수 블록:

- motherChildCompatibility
- fatherChildCompatibility
- parentPalaceSummary

정상 결측 가능성:

- 일부 샘플에서 parentPalaceSummary가 null일 수 있다.
- 이 경우 상품상 허용할지, fallback 문장을 넣을지 결정해야 한다.

### 4. 함께 살펴줄 결

부모별 블록:

- motherSynergyBody
- motherSynergyDaily
- motherConflictBody
- motherConflictDaily
- motherConflictResolution
- fatherSynergyBody
- fatherSynergyDaily
- fatherConflictBody
- fatherConflictDaily
- fatherConflictResolution

규칙:

- synergy 카드에는 resolution을 강제로 넣지 않는다.
- conflict 카드에만 “이렇게 풀어보세요” 성격의 문장을 넣는다.
- synergy/conflict가 모두 없는 경우는 fallback 카드가 필요하다.

## 계산 고정 원칙

고객 보고서 문장에서는 아래 값을 새로 만들면 안 된다.

- 아이 6요인 점수
- 아이 6요인 등급
- 부모 6축 점수
- 부모 6축 등급
- 일간
- 일주
- 부모-아이 십성 관계
- 매트릭스 synergy/conflict 판정
- 시간 모름 처리 여부

문장은 이 값을 받아서 표현만 한다.

## 금지 표현

아이 관련:

- 병명/진단명
- 발달장애 단정
- 문제아/예민한 아이/어려운 아이
- 고쳐야 한다
- 부모가 반드시 통제해야 한다

부모 관련:

- 부모 탓
- 양육 실패
- 아이에게 해롭다
- 엄마/아빠가 문제다
- 무조건 이렇게 해야 한다

사주 관련:

- 100% 맞다
- 반드시 그렇게 된다
- 타고나서 못 바꾼다
- 사주상 안 좋다
- 궁합이 나쁘다

## 형 검수 단위

형 검수는 페이지 전체가 아니라 블록 단위로 받는다.

우선순위:

1. 아이 6요인 본문
2. 부모 단독 사주/양육 결
3. 부모-아이 궁합 본문
4. conflict resolution
5. intro/outro

형이 바꿀 수 있는 것:

- 문장 톤
- 예시
- 강도
- 연결 문장
- 부모가 받아들이기 편한 표현

형이 바꾸면 안 되는 것:

- 점수
- 등급
- 요인명
- 부모-아이 관계 판정
- synergy/conflict 판정

## 1차 QA 기준

샘플 4개 기준으로 다음을 통과해야 한다.

- 필수 JSON 존재
- 필수 블록 존재
- 점수와 등급 불일치 0개
- undefined/null/NaN 본문 노출 0개
- 시간 모름 케이스에서 시주 근거 사용 0개
- conflict 카드에만 resolution 노출
- synergy 카드에는 resolution 미노출
- 부모 비난/아이 낙인 표현 0개

## 다음 단계

다음 단계는 이 상품 계약을 기준으로 샘플 4개 산출물을 다시 감사하는 QA 스크립트를 만든다.

그 결과가 통과하면 진행률을 **65%**로 올린다.
