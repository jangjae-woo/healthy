# 아이기질+부모양육 v1 허용 결측/fallback 정책

작성일: 2026-05-19  
현재 진행률: 72%

## 결론

샘플 QA warning 26개는 hard error가 아니다.

다만 전부 같은 의미는 아니다.

```text
정상 결측: synergy/conflict 카드가 선택되지 않아 해당 블록이 없는 경우
상품 전 fallback 필요: 해결 완료
정상 안전 경고: 시간 모름으로 시주 근거를 제외한 경우
```

## 분류표

| 항목 | 분류 | 유료 상품 전 조치 |
|---|---|---|
| `compatibility.parentPalaceSummary` | 해결 완료 | 완료 |
| `motherSynergyBody/Daily` 없음 | 정상 결측 | 불필요 |
| `fatherSynergyBody/Daily` 없음 | 정상 결측 | 불필요 |
| `motherConflictBody/Daily/Resolution` 없음 | 정상 결측 | 불필요 |
| `fatherConflictBody/Daily/Resolution` 없음 | 정상 결측 | 불필요 |
| 시간 모름 manifest warning | 정상 안전 경고 | 불필요 |

## parentPalaceSummary 판단

`parentPalaceSummary`는 현재 샘플 원본에 별도 필드가 없어서 null이다.

하지만 실제 캐시에는 아래 파일이 있다.

- `lib/youa-engine/youa/block-cache-data/parent-palace-blocks.json`
- `아이기질브라덜/block-cache-v1/cache/parent-palace-blocks.json`

따라서 이것은 “없어도 되는 항목”이라기보다, **샘플 원본이 구버전이라 비어 있는 항목**으로 보는 것이 맞다.

유료 상품 전에는 아래 둘 중 하나를 해야 했다.

1. 현재 엔진의 parent-palace block cache를 연결한다.
2. 연결이 늦어지면 계산 기반 fallback 문장을 넣는다.

적용:

```text
1번. parent-palace block cache 연결 완료
```

이유:

- 이미 25개 조합 블록이 존재한다.
- 부모 자리 요약은 상품상 깊이감을 주는 구간이다.
- null로 두면 “빈 보고서” 느낌이 생긴다.

## synergy/conflict 결측 판단

함께 살펴줄 결에서는 부모별로 시너지 또는 충돌 카드가 선택된다.

따라서 아래는 정상이다.

```text
시너지 카드가 선택됨 -> synergyBody/Daily 있음, conflictBody/Daily/Resolution 없음
충돌 카드가 선택됨 -> conflictBody/Daily/Resolution 있음, synergyBody/Daily 없음
```

중요 규칙:

- synergy 카드에는 resolution이 없어야 한다.
- conflict 카드에는 resolution이 있어야 한다.
- conflictBody 없이 conflictResolution만 있으면 오류다.
- 둘 다 없는 경우는 fallback 후보로 봐야 한다.

## 시간 모름 경고 판단

sample-003:

- 아이 출생 시간 모름
- 시주 인자를 본문 근거에서 제외

sample-004:

- 아버님 출생 시간 모름
- 아버님 시주 인자를 본문 근거에서 제외

이건 오류가 아니라 안전장치다.

유료 상품에서는 아래처럼 표시하면 된다.

```text
출생 시간을 모르는 경우, 시간 기둥에서 나오는 세부 근거는 제외하고 해석했습니다.
```

## QA 정책

앞으로 QA는 결측을 3단계로 본다.

1. error
   - 반드시 있어야 하는데 없음
   - 충돌 카드인데 resolution 없음
   - 금지 문자열 노출
   - 시간 모름인데 시주 근거 사용

2. productFallback
   - 지금은 통과 가능하지만 유료 상품 전 보완 필요
   - 현재는 `parentPalaceSummary`

3. allowed
   - 정상 결측
   - 카드가 선택되지 않은 경우
   - 시간 모름 안전 경고

## 다음 단계

QA 스크립트가 이 정책 JSON을 읽도록 바꾸고, 샘플 4개를 다시 검사했다.

그 결과 `productFallbacks=0`으로 통과했으므로 진행률을 **72%**로 올린다.
