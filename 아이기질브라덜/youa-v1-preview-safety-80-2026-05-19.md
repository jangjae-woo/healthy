# 아이기질+부모양육 v1 미리보기/문장 안전성 80% 보고

작성일: 2026-05-19  
진행률: 72% → 80%

## 결론

형에게 문장 피드백을 받을 단계 바로 전까지 준비했다.

현재 상태:

- 최신 block 기준 미리보기 생성 완료
- parentPalaceSummary 반영 확인
- 샘플 4개 구조 QA 통과
- 문장 안전성 hard error 0개
- 형 검수 전 내부 확인 가능

## 생성된 미리보기

```text
아이기질브라덜/v1-block-preview/index.html
```

샘플:

- sample-001
- sample-002
- sample-003
- sample-004

이 미리보기는 기존 `output/sample-*.json`이 아니라 최신 `output-blocks/sample-*`를 기준으로 만든다.

## 구조 QA

```text
OK sample-001 factors=6 missing=5 fallback=0 allowed=5 errors=0 warnings=5
OK sample-002 factors=6 missing=5 fallback=0 allowed=5 errors=0 warnings=5
OK sample-003 factors=6 missing=5 fallback=0 allowed=6 errors=0 warnings=6
OK sample-004 factors=6 missing=5 fallback=0 allowed=6 errors=0 warnings=6
YOUA_SAMPLE_BLOCKS ok=true errors=0 warnings=22 productFallbacks=0 allowedMissing=22
```

## 문장 안전성 QA

```text
OK sample-001 texts=78 errors=0 warnings=11
OK sample-002 texts=78 errors=0 warnings=14
OK sample-003 texts=78 errors=0 warnings=11
OK sample-004 texts=78 errors=0 warnings=13
YOUA_TEXT_SAFETY ok=true errors=0 warnings=49
```

## safety hard error 기준

아래는 0개여야 한다.

- undefined
- null
- NaN
- [object Object]
- child placeholder
- 진단/질병 단정
- 부모 비난
- 아이 낙인
- 결정론/공포 표현

현재 hard error는 0개다.

## warning 해석

warning 49개는 형 검수 전에 볼 참고값이다.

주로 아래 후보를 잡는다.

- 제목이 짧은 문장
- “무조건/반드시/절대로”처럼 강한 표현
- 본문 흐름상 더 부드럽게 만들 수 있는 표현

현재 warning은 상품 출시 전 문장 다듬기 후보이지, 구조 오류는 아니다.

## 아직 형 피드백 단계가 아닌 이유

아직 형에게 문장 피드백을 받을 단계는 아니다.

형에게 넘기기 전 남은 준비:

1. 형 검수용 guide/checklist 작성
2. 수정 반영용 override 구조 작성
3. 형이 볼 대표 샘플 우선순위 지정

이 3개를 만들면 형 검수 단계로 넘어갈 수 있다.

## 생성/수정 파일

- `scripts/build-youa-v1-block-preview.mjs`
- `scripts/validate-youa-v1-text-safety.mjs`
- `아이기질브라덜/v1-block-preview/index.html`
- `아이기질브라덜/v1-block-preview/sample-001.html`
- `아이기질브라덜/v1-block-preview/sample-002.html`
- `아이기질브라덜/v1-block-preview/sample-003.html`
- `아이기질브라덜/v1-block-preview/sample-004.html`
- `아이기질브라덜/cache-schema/youa-v1-text-safety-audit.v1.json`

## 다음 단계

다음 단계는 형 검수 준비 세트다.

평생사주 때와 같은 구성으로 간다.

- 형 검수 안내서
- 형 검수 체크리스트
- override 반영 루틴
- 최종 readiness QA
