# 아이기질+부모양육 v1 현재 자산 감사

작성일: 2026-05-19  
현재 진행률: 60%

## 결론

아이기질+부모양육은 이미 상당히 진행된 상태다.

평생사주와 비교하면, 아이기질 쪽은 아래 3개가 이미 있다.

- 계산/판단 엔진
- 블록 캐시 설계와 일부 대량 캐시
- 미리보기/샘플/QA 흔적

다만 유료 상품으로 안정화하려면 “현재 있는 것”을 그대로 믿고 넘어가면 안 되고, 평생사주처럼 계약/감사/검수/override를 붙여야 한다.

## 확인한 핵심 파일

### 엔진

- `lib/youa-engine/youa/factors.mjs`
- `lib/youa-engine/youa/parent-axes.mjs`
- `lib/youa-engine/youa/matrix.mjs`
- `lib/youa-engine/youa/facts-builder.mjs`
- `lib/youa-engine/youa/render.mjs`
- `lib/youa-engine/youa/block-cache.mjs`
- `lib/youa-engine/youa/output-validator.mjs`

역할:

```text
아이/부모 사주 fixture
-> 아이 6요인 계산
-> 부모 6축 계산
-> 부모-아이 관계/매트릭스 계산
-> facts 생성
-> 문장 블록 주입
-> HTML 렌더
```

### API

- `app/api/youa-family-report/route.ts`
- `lib/youa-cache/family-report.ts`

역할:

```text
child/mother/father 입력
-> 캐시 조회
-> buildFacts
-> mockLLMResponse
-> parse/validate
-> renderReport
-> html 반환
```

현재 API는 배포 모드에서 R2 캐시를 전제로 한다.

### 규칙 문서

- `형과함께NEW/2_child_6factors.md`
- `형과함께NEW/3_parent_6axes.md`
- `아이기질브라덜/YOUA_JUDGMENT_TYPE_STANDARD.md`
- `아이기질브라덜/YOUA_BLOCK_CACHE_PLAN.md`
- `아이기질브라덜/YOUA_CACHE_SCHEMA.json`

역할:

```text
아이 6요인 규칙
부모 6축 규칙
판단 타입 표준
블록 캐시 설계
캐시 스키마
```

### 샘플/미리보기

- `아이기질브라덜/claude-code-sample10-package/output/sample-001.json` ~ `sample-004.json`
- `아이기질브라덜/claude-code-sample10-package/output-blocks/sample-001`
- `아이기질브라덜/review/youa-full-review-preview.html`
- `아이기질브라덜/아이기질과부모양육_2026-05-17/review/youa-review-samples-5.html`

역할:

```text
샘플 4개 원본 JSON
standalone-blocks
pair-generation-input
pair-generation-output
block-manifest
검수용 HTML
```

### 대량 캐시

- `아이기질브라덜/아이기질과부모양육_2026-05-17/cache/youa-child-report-cache-full`
- `아이기질브라덜/아이기질과부모양육_2026-05-17/cache/youa-parent-saju-cache-full`
- `아이기질브라덜/아이기질과부모양육_2026-05-17/cache/sqlite/youa-cache.sqlite`

기록상 규모:

- 아이 캐시: 37,986건
- 부모 캐시: 579,254건
- SQLite 합계: 617,240행
- SQLite DB: 약 8.32GB

주의:

이 파일들은 GitHub에 직접 올리면 안 된다. 운영에서는 R2나 서버 디스크/DB로 분리해야 한다.

## 현재 강점

1. 계산 엔진이 이미 분리되어 있다.
2. 아이 6요인과 부모 6축이 명확하다.
3. 샘플 4개가 이미 block 단위로 쪼개져 있다.
4. 부모-아이 조합을 전체 사전생성하지 않고 필요한 조합만 생성하려는 방향이 맞다.
5. API와 R2 운영 방향이 이미 잡혀 있다.
6. 미리보기 HTML이 있어 형 검수로 바로 이어갈 수 있다.

## 현재 위험

1. 문서/코드/캐시가 여러 폴더에 흩어져 있다.
2. 실제 운영 기준 원본이 `lib/youa-engine`인지, `아이기질브라덜`인지, `형과함께NEW`인지 명확히 고정해야 한다.
3. 샘플 4개는 통과했지만, 현재 상품 계약 기준으로 다시 QA한 것은 아니다.
4. block-manifest에는 일부 missing block이 있다. 이게 정상 결측인지 상품상 빈칸인지 구분해야 한다.
5. 부모 양육 문장은 특히 부모에게 죄책감/비난처럼 읽힐 위험이 있어 safety 기준이 평생사주보다 더 엄격해야 한다.
6. API는 R2 전제라 로컬/배포 환경 분기가 운영 중 혼란을 만들 수 있다.

## 평생사주 방식으로 가져갈 구조

평생사주:

```text
calculated
-> area-scores
-> report-data
-> render-blocks
-> polished-blocks
-> preview
-> override
-> final QA
```

아이기질+부모양육:

```text
childSaju / motherSaju / fatherSaju
-> facts
-> judgement-data
-> standalone-blocks + pair-blocks
-> polished-family-blocks
-> preview
-> override
-> final QA
```

## 우선 고정할 기준

### 계산 원본

`lib/youa-engine/youa`를 기준 엔진으로 본다.

이유:

- API가 이 엔진을 사용한다.
- facts-builder/render/output-validator가 한 묶음으로 있다.
- 현재 서비스 코드와 가장 가깝다.

### 참고 원본

`아이기질브라덜`과 `형과함께NEW`는 참고/기획/샘플 원본으로 본다.

단, 계산 로직을 여기저기서 섞지 않는다.

### 문장 원본

문장 블록은 현재 `block-cache-v1`과 `lib/youa-engine/youa/block-cache-data`를 비교해 하나의 기준을 정해야 한다.

## 1차 다음 작업

다음 단계는 상품 계약 초안이다.

고정할 것:

- 최종 보고서 페이지 구성
- 필수 블록
- 정상 결측 허용 기준
- 아이/부모 문장 금지 표현
- 형 검수 단위
- override 적용 단위
- QA 통과 기준

이 작업이 끝나면 진행률을 **62%**로 올릴 수 있다.
