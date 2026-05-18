# 아이기질과 부모양육: 번호 지정 구간 조합인자 기반 캐싱 지침

작성일: 2026-05-18

## 원칙

전체 보고서 구조, 페이지 순서, CSS, 형이 만든 폼의 시각 구조는 유지한다.

새로 바꾸는 대상은 사용자가 번호로 지정한 가변 본문 구간뿐이다. 문장을 조각으로 이어 붙이지 않고, 각 번호 위치에 들어갈 완성 블록 1개를 조합인자 key로 선택한다.

점수는 카드/블록 선택과 정렬에만 사용한다. 본문 key의 핵심은 점수가 아니라 실제 사주 조합인자다.

## 변경 대상

변경 대상:

- 4~9페이지 아이 6요인: 1, 4, 5, 6
- 13~14페이지 부모 사주: 7, 8
- 15페이지 부모-자녀 궁합: 9, 10
- 16페이지 함께 살펴줄 결: 11~21

변경 제외:

- 1~3페이지
- 10~12페이지
- 점수 차트, 사주표, 목차, 페이지 이동 UI
- 사주 계산 엔진
- R2 아이/부모 원자료 캐시 구조

## 공통 블록 구조

각 블록은 아래 형태를 기본으로 한다.

```json
{
  "key": "slotKey",
  "slot": 11,
  "form": "fixed",
  "tags": ["조합인자1", "조합인자2"],
  "title": "폼 안에 들어갈 제목",
  "subtitle": "폼 안에 들어갈 보조 문장",
  "body": ["완성 문단 1", "완성 문단 2"],
  "daily": ["일상 문단 1", "일상 문단 2"],
  "tips": [
    { "title": "팁 제목", "body": "팁 본문" }
  ],
  "resolution": "충돌일 때만 사용하는 해결 문장"
}
```

해당 slot에서 쓰지 않는 필드는 생략한다.

## 조합인자 추출 규칙

### 아이 6요인 trace 그룹

아이 요인 trace에서 본문 key로 쓸 대표 인자는 최대 2개만 고른다.

우선순위:

1. 본기 가산/감산
2. 강한 조합 인자
3. 상조
4. 여기
5. 정액 없음/무존재

대표 key 예시:

- `johu-imbalance`: 조후 불균형
- `johu-balance`: 조후 균형
- `chilsal-sinyak`: 칠살/관성 강 + 신약
- `gwanseong`: 관성
- `inseong`: 인성
- `siksang`: 식상
- `jaeseong`: 재성
- `bigyeop`: 비겁
- `yangin`: 양인
- `munchang`: 문창
- `cheoneul`: 천을귀인
- `unseong-weak`: 12운성 약세
- `unseong-strong`: 12운성 강세
- `oghaeng-mok`, `oghaeng-hwa`, `oghaeng-to`, `oghaeng-geum`, `oghaeng-su`
- `gwanin-sangsaeng`: 관인상생
- `none-inseong`, `none-gwanseong`, `none-jaeseong`

### 부모 6축 trace 그룹

부모 축 trace도 대표 인자는 최대 2개만 고른다.

대표 key 예시:

- `gwanseong`
- `inseong`
- `siksang`
- `jaeseong`
- `bigyeop`
- `yangin`
- `johu-balance`
- `johu-imbalance`
- `sinyak`
- `singang`
- `neutral-strength`
- `yang-daymaster`
- `eum-daymaster`
- `unseong-strong`
- `unseong-weak`
- `oghaeng-mok`, `oghaeng-hwa`, `oghaeng-to`, `oghaeng-geum`, `oghaeng-su`

## 번호별 key 설계

### 1번: 왜 이런 결인가 짧은 요약

위치: 4~9페이지 `왜 이런 결인가` 첫 문단.

폼:

```text
{childName}의 {factor} {score}점은 사주에서 {factor}을 만드는 기운과 누르는 기운이 함께 결합되어 나온 결과입니다.
```

조합형 key:

```text
slot01|factor={factor}|level={fiveLevel}|maker={makerTop1}+{makerTop2}|suppressor={suppressorTop1}+{suppressorTop2}
```

본문은 1문단, 120~180자. 깊게 쓰지 않는다.

### 4~5번: 일상에서는

위치: 4~9페이지 `일상에서는...`.

조합형 key:

```text
slot04_05|factor={factor}|level={fiveLevel}|maker={makerTop1}+{makerTop2}|suppressor={suppressorTop1}+{suppressorTop2}|confidence={hourConfidence}
```

폼:

- `일상에서는...` 제목 유지
- 2문단 유지
- 첫 문단: 실제 생활 장면
- 둘째 문단: 부모가 관찰할 포인트

### 6번: 양육 Tip

위치: 4~9페이지 `양육 Tip`.

조합형 key:

```text
slot06|factor={factor}|level={fiveLevel}|maker={makerTop1}|suppressor={suppressorTop1}|tipAxis={time|communication|environment}
```

폼:

- 시간 1개
- 소통 1개
- 환경 1개
- 각 tip은 제목 + 본문 1개

### 7번: 부모 사주 큰 흐름

위치: 13~14페이지 부모 사주 설명 첫 본문.

조합형 key:

```text
slot07|role={mother|father}|ilgan={ilgan}|strongAxis={axis1}+{axis2}|cause={cause1}+{cause2}|johu={johuState}
```

폼:

- 일간 비유 1문장
- 부모축의 큰 흐름 2~3문장
- 실제 양육에서 보이는 분위기 1문장

### 8번: 부모 사주 브릿지

위치: 13~14페이지 말미 브릿지.

조합형 key:

```text
slot08|role={mother|father}|strongAxis={axis1}+{axis2}|childTopFactor={childFactor1}+{childFactor2}
```

폼:

- 1문단
- "이 결이 아이의 결과 만나는 자리는..." 같은 중복 문구를 남발하지 않는다.
- 다음 장으로 자연스럽게 연결한다.

### 9~10번: 부모-자녀 궁합

위치: 15페이지 어머님/아버님과 자녀 관계.

조합형 key:

```text
slot09_10|role={mother|father}|childIlgan={childIlgan}|parentIlgan={parentIlgan}|relation={relationType}|sipseong={sipseongTong}|childBranch={childBranch}|parentBranch={parentBranch}
```

폼:

- 제목 유지
- 부모 일간 + 자녀 일간 설명
- 명리 관계 풀이
- 일상에서는 박스
- 관계 정리 문단

### 11~13번: 16페이지 시너지 카드 본문

위치: 16페이지 `함께 살펴줄 결` 시너지 카드.

조합형 key:

```text
slot11_13|role={mother|father}|parentAxis={axis}|childFactor={factor}|pattern={synergy|strong_synergy|complement}|parentCause={parentCause1}+{parentCause2}|childCause={childCause1}+{childCause2}
```

폼:

- 제목
- 서브: `{시너지 라벨} - 부모님의 {parentAxis} 흐름 × 자녀 {childFactor} 결`
- 본문 3문단
  - 11번: 부모 축 설명
  - 12번: 아이 결 설명
  - 13번: 두 결이 만나는 방식

### 14~18번: 16페이지 추가 시너지/보완 카드

위치: 16페이지 두 번째 이후 카드.

조합형 key:

```text
slot14_18|role={mother|father}|parentAxis={axis}|childFactor={factor}|pattern={synergy|strong_synergy|complement|ambivalent}|parentCause={parentCause1}+{parentCause2}|childCause={childCause1}+{childCause2}
```

폼은 11~13번과 같되, ambivalent는 장점과 주의점을 함께 담는다.

### 19~21번: 16페이지 충돌 카드

위치: 16페이지 충돌/충돌위험 카드.

조합형 key:

```text
slot19_21|role={mother|father}|parentAxis={axis}|childFactor={factor}|pattern={conflict_risk|strong_conflict}|parentCause={parentCause1}+{parentCause2}|childCause={childCause1}+{childCause2}
```

폼:

- 19번: 충돌이 생기는 이유
- 20번: 일상에서 보이는 장면 2문단
- 21번: `이렇게 풀어보세요`

중요: 충돌 카드가 아닐 때는 `이렇게 풀어보세요`를 출력하지 않는다.

## 우선 적용 순서

1. 16페이지 11~21번
2. 4~9페이지 1, 4, 5, 6번
3. 15페이지 9~10번
4. 13~14페이지 7~8번

## 기존 캐시와의 관계

기존 캐시는 버리지 않는다.

조회 우선순위:

1. 조합인자 완성 블록 캐시
2. 기존 factor/matrix/compatibility 캐시
3. 기존 정적 fallback

이렇게 해야 일부 조합 블록이 아직 없어도 보고서가 깨지지 않는다.

