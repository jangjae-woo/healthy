# Claude Code 작업 지시서

너는 팔자원 `사주로 풀어보는 우리 아이 마음` 보고서의 샘플 10건을 생성한다.

## 최종 목표

`index.html`에 들어있는 형 버전 보고서의 문체, 구조, 풍부함을 기준으로 삼되, 그 HTML을 그대로 복사하지 않는다.

우리가 원하는 것은 실제 고객별 사주 조합을 미리 많이 만들어 Cloudflare R2에 저장할 수 있는 JSON 보고서 샘플이다.

## 반드시 지킬 것

1. 출력은 JSON 파일 10개다.
2. 각 JSON은 `YOUA_CACHE_SCHEMA.json` 구조를 최대한 따른다.
3. 6요인 점수는 0~100이고 등급은 아래 기준을 지킨다.

```text
0-20 매우낮음
21-40 낮음
41-60 중간
61-80 높음
81-100 매우높음
```

4. 각 샘플은 서로 다른 점수 조합, 동물 유형, 부모 궁합 흐름을 가져야 한다.
5. 본문은 형 버전처럼 구체적인 일상 장면이 있어야 한다.
6. 낮은 점수는 결핍처럼 쓰지 말고 반대 결이 드러나는 방식으로 쓴다.
7. 사주 용어는 그대로 던지지 말고 `정화(丁)`, `큰 쇠`, `받쳐주는 기운(정인)`처럼 풀어쓴다.
8. `이렇게 풀어보세요`는 충돌 카드에만 넣는다.
9. 부모 사주는 각각 400자 이하로 쓴다.
10. 시간 모름 샘플도 최소 2건 포함한다.

## 샘플 10건 구성

아래 분포를 맞춰라.

```text
sample-001: 시간 있음, 활기 낮음, 조심 높음, 양/토끼 계열 느낌
sample-002: 시간 있음, 활기 높음, 끈기 낮음, 원숭이/강아지 계열 느낌
sample-003: 아이 시간 모름, 전체 점수 중간권, 균형형
sample-004: 부모 1명 시간 모름, 흔들림 매우높음, 어울림 높음
sample-005: 아이와 부모 1명 시간 모름, 조심 매우높음
sample-006: 아이/부모 모두 시간 모름, 극단값 완화
sample-007: 만족 매우높음, 활기 높음
sample-008: 어울림 매우낮음, 끈기 높음
sample-009: 활기 매우높음, 흔들림 낮음
sample-010: 6요인이 비슷한 균형형, 동물 유형 C 케이스
```

## 작성 방식

1. 먼저 10개의 입력 facts를 내부적으로 설계한다.
2. 그 facts를 바탕으로 JSON 보고서를 생성한다.
3. 생성 후 `YOUA_VALIDATOR_RULES.md` 기준으로 자체 검수한다.
4. 검수 결과를 `output/QA_REPORT.md`에 쓴다.

## 금지

본문에 아래 문자열이 나오면 실패다.

```text
undefined
null
NaN
child0
child1
mother
father
[object Object]
```

JSON 키 이름으로 `mother`, `father`를 쓰는 것은 허용한다. 사용자에게 보이는 본문 문자열에는 나오면 안 된다.

## 산출 파일

```text
output/sample-001.json
output/sample-002.json
output/sample-003.json
output/sample-004.json
output/sample-005.json
output/sample-006.json
output/sample-007.json
output/sample-008.json
output/sample-009.json
output/sample-010.json
output/QA_REPORT.md
```

## 최종 답변

작업 완료 후에는 다음만 보고한다.

```text
완료했습니다.
생성 파일:
- output/sample-001.json
...
- output/QA_REPORT.md
검수 요약:
- 점수-등급 불일치: 0건
- 금지 문자열: 0건
- 시간 모름 시주 근거 사용: 0건
```

