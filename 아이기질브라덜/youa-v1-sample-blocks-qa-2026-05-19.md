# 아이기질+부모양육 v1 샘플 블록 QA

작성일: 2026-05-19  
현재 진행률: 65%

## 결론

샘플 4개 기준 block 산출물 QA는 통과했다.

```text
OK sample-001 factors=6 missing=6 fallback=1 allowed=5 errors=0 warnings=6
OK sample-002 factors=6 missing=6 fallback=1 allowed=5 errors=0 warnings=6
OK sample-003 factors=6 missing=6 fallback=1 allowed=6 errors=0 warnings=7
OK sample-004 factors=6 missing=6 fallback=1 allowed=6 errors=0 warnings=7
YOUA_SAMPLE_BLOCKS ok=true errors=0 warnings=26 productFallbacks=4 allowedMissing=22
```

## 확인한 파일

각 샘플마다 아래 파일을 확인했다.

- `block-manifest.json`
- `standalone-blocks.json`
- `pair-generation-input.json`
- `pair-generation-output.json`

## 확인한 기준

### 아이 단독 기질

- 6요인 존재
- 각 요인별 필수 블록 존재
  - whyIntro
  - dailyBody
  - parentingTipTime
  - parentingTipCommunication
  - parentingTipEnvironment

### 부모 단독 사주/양육 결

- mother parentSajuBody 존재
- mother parentSajuBridge 존재
- father parentSajuBody 존재
- father parentSajuBridge 존재

### 부모-아이 조합

- motherChildCompatibility 확인
- fatherChildCompatibility 확인
- parentPalaceSummary 확인
- 함께 살펴줄 결 matrix 확인

### 안전성

본문에 아래 금지 문자열이 노출되지 않는지 확인했다.

- undefined
- NaN
- [object Object]
- child0

## warning 해석

warning은 현재 hard error가 아니다.

주요 원인:

1. `parentPalaceSummary` fallback 필요: 4개
2. synergy 또는 conflict 카드가 선택되지 않은 정상 결측: 20개
3. sample-003, sample-004의 시간 모름 안전 경고: 2개

이제 warning은 정책 파일 기준으로 분류된다.

- `productFallbacks=4`: 유료 상품 전 보완 필요
- `allowedMissing=22`: 정상 결측 또는 안전 경고

## 생성된 감사 파일

`아이기질브라덜/cache-schema/youa-v1-sample-blocks-audit.v1.json`

## 진행률 변경

이 QA와 허용 결측 정책 통과로 진행률은 **62% → 65%**로 올린다.

## 다음 단계

다음은 `parentPalaceSummary`를 실제 block cache에서 연결하거나 fallback 문장으로 채우는 작업이다.
