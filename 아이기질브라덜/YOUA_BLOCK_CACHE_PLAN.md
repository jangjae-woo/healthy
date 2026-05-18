# 아이기질 문장 블록 캐시 계획 v1

작성일: 2026-05-18

## 목표

기존 아이기질 보고서 렌더와 지금까지 만든 자료는 그대로 살린다. LLM이 작성하기로 했던 문장 영역만 `문장 블록 캐시`로 바꿔서, 최종적으로 LLM 호출 없이 보고서를 조립한다.

중요한 판단:

```text
문장 1개씩 캐싱하지 않는다.
화면에서 의미가 끊기는 블록 단위로 캐싱한다.
```

이유:

```text
문장 단위 캐시는 앞뒤 연결이 어색해질 수 있다.
블록 단위 캐시는 본문 2~3문장, 일상, 해결책이 한 흐름으로 저장되어 자연스럽다.
```

## 캐시 대상

### 1. 4~9페이지 아이 6요인 단독 블록

대상 요인:

```text
활기, 조심, 만족, 흔들림, 어울림, 끈기
```

등급:

```text
매우낮음, 낮음, 중간, 높음, 매우높음
```

수량:

```text
6요인 × 5등급 = 30블록
```

각 블록 필드:

```text
whyIntro
dailyBody
parentingTipTime
parentingTipCommunication
parentingTipEnvironment
```

### 2. 13~14페이지 부모 단독 사주 블록

일간:

```text
갑목, 을목, 병화, 정화, 무토, 기토, 경금, 신금, 임수, 계수
```

부모 역할:

```text
어머님, 아버님
```

수량:

```text
10일간 × 2역할 = 20블록
```

각 블록 필드:

```text
parentSajuBody
parentSajuBridge
```

### 3. 15페이지 부모-자녀 일간 궁합 블록

아이 일간 10개와 부모 일간 10개의 관계를 캐싱한다.

수량:

```text
아이 일간 10 × 부모 일간 10 × 부모 역할 2 = 200블록
```

각 블록 필드:

```text
compatibilityTitle
compatibilityBody
compatibilityDaily
```

### 4. 15페이지 부모궁/십성 요약 블록

아이 사주 안에서 어머님 자리와 아버님 자리가 어떤 흐름인지 요약한다.

기본 축:

```text
받쳐주는 기운
표현하는 기운
절제하는 기운
결과를 기대하는 기운
같은 결의 기운
```

수량:

```text
5 × 5 = 25블록
```

### 5. 16페이지 함께 살펴줄 결 매트릭스 카드

부모 축 6개와 아이 요인 6개를 시너지/충돌/강도별로 캐싱한다.

수량:

```text
부모 역할 2 × 부모 축 6 × 아이 요인 6 × 타입 2 × 강도 3 = 432블록
```

각 블록 필드:

```text
header
subTemplate
body
daily
resolution
```

규칙:

```text
synergy 타입은 resolution 없음
conflict 타입만 resolution 있음
```

## 총량

```text
아이 6요인 블록: 30
부모 단독 블록: 20
일간 궁합 블록: 200
부모궁 요약 블록: 25
매트릭스 카드 블록: 432

총 707블록
```

707블록이면 사람이 검수 가능한 규모이고, 저장량도 매우 작다.

## 운영 흐름

```text
사주 엔진 계산
→ factor/level/dayMaster/relation/matrix key 생성
→ block-cache에서 key 조회
→ {childName}, {parentTitle}, {score} 등 변수 치환
→ 기존 렌더에 삽입
→ 완성 리포트 출력
```

## 변수 치환 원칙

블록 안에서는 이름과 점수를 직접 쓰지 않는다.

예:

```text
{childName}
{parentName}
{parentTitle}
{childDayMaster}
{parentDayMaster}
{childFactor}
{childScore}
{childLevel}
{parentAxis}
{parentAxisScore}
```

실제 출력 시 렌더러가 치환한다.

## 생성 파일

캐시는 아래 폴더에 생성한다.

```text
C:\Users\new\Desktop\saju\아이기질브라덜\block-cache-v1\cache\
```

예상 파일:

```text
factor-blocks.json
parent-saju-blocks.json
compatibility-blocks.json
parent-palace-blocks.json
matrix-card-blocks.json
index.json
```

