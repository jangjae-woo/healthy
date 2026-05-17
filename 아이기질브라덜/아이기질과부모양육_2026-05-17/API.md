# 아이기질과부모양육 조회 API

## 엔드포인트

```text
POST /api/youa-family-report
```

## 역할

아이/어머님/아버님 입력값을 받아 캐시에서 각 사주 fixture를 조회하고, LLM 호출 없이 최종 가족 보고서 HTML을 조립합니다.

## 요청 예시

```json
{
  "child": {
    "name": "child",
    "birthDate": "2021-08-17",
    "gender": "female",
    "hour": "시간 모름"
  },
  "mother": {
    "name": "mother",
    "birthDate": "1988-01-01",
    "hour": "시간 모름"
  },
  "father": {
    "name": "father",
    "birthDate": "1985-10-03",
    "hour": "시간 모름"
  }
}
```

## 응답 구조

```json
{
  "ok": true,
  "validation": {
    "valid": true,
    "violations": []
  },
  "cacheKeys": {
    "child": "2021-08-17_female_unknown-hour",
    "mother": "mother_1988-01-01_unknown-hour",
    "father": "father_1985-10-03_unknown-hour"
  },
  "summary": {
    "child": {
      "ilgan": "정",
      "animal": "용",
      "animalCase": "C"
    },
    "pageCount": 17
  },
  "html": "<div class=...>"
}
```

## 옵션

`facts` 원본까지 함께 받고 싶으면 요청 body에 아래 값을 추가합니다.

```json
{
  "includeFacts": true
}
```

기본값은 `false`입니다. 운영 화면에서는 `html`만 있으면 충분하므로 기본 응답에는 `facts`를 제외합니다.

## 캐시 위치

기본 캐시 위치는 다음 폴더입니다.

```text
C:\Users\new\Desktop\saju\아이기질브라덜\아이기질과부모양육_2026-05-17\cache
```

환경변수로 위치를 바꿀 수 있습니다.

- `YOUA_CHILD_CACHE_DIR`
- `YOUA_PARENT_CACHE_DIR`

## 현재 구현 방식

1. `child_reports` SQLite가 아니라 JSONL + `index.json`으로 조회합니다.
2. 아이/어머님/아버님 fixture 3개를 꺼냅니다.
3. `buildFacts -> mockLLMResponse -> renderReport`로 HTML을 만듭니다.

SQLite DB는 이미 생성되어 있지만, 현재 Next 프로젝트에는 SQLite Node 드라이버가 없으므로 1차 API는 JSONL 조회 방식으로 구현했습니다.

## Cloudflare R2

R2 버킷:

```text
paljawon-youa-cache
```

로컬 환경변수 파일:

```text
C:\Users\new\Desktop\saju\.env.r2.local
```

주의: `.env.r2.local`에는 R2 접근 키가 들어 있으므로 GitHub에 올리면 안 됩니다. 현재 `.gitignore` 대상입니다.

연결 확인:

```bash
node scripts/r2-smoke-test.mjs
```

R2 샘플 업로드:

```bash
node scripts/upload-youa-cache-to-r2.mjs
```

기본값은 샘플 20건만 업로드합니다. 전체 업로드를 진행할 때는 아래처럼 실행합니다.

```bash
UPLOAD_ALL=1 node scripts/upload-youa-cache-to-r2.mjs
```

R2 객체 구조:

```text
youa-cache/v1/child/YYYY/MM/{encoded-cache-key}.json
youa-cache/v1/parent/mother/YYYY/MM/{encoded-cache-key}.json
youa-cache/v1/parent/father/YYYY/MM/{encoded-cache-key}.json
```

현재 R2 샘플 업로드 검증:

- smoke test: 통과
- 샘플 업로드: 아이 10건, 부모 10건, 총 20건 통과

## R2 조회 모드

API가 로컬 JSONL 대신 R2에서 캐시를 읽게 하려면 아래 환경변수를 설정합니다.

```text
YOUA_CACHE_SOURCE=r2
R2_BUCKET=paljawon-youa-cache
R2_ENDPOINT=https://898dbaa34ae32a999234590700bddb12.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PREFIX=youa-cache/v1
```

Vercel 배포 테스트 때는 위 값을 Vercel Project Settings의 Environment Variables에 넣습니다.

R2 샘플 조회 테스트에 사용 가능한 입력값:

```json
{
  "child": {
    "name": "child",
    "birthDate": "2020-01-01",
    "gender": "female",
    "hour": "시간 모름"
  },
  "mother": {
    "name": "mother",
    "birthDate": "1950-01-01",
    "hour": "시간 모름"
  },
  "father": {
    "name": "father",
    "birthDate": "1950-01-01",
    "hour": "시간 모름"
  }
}
```

R2 모드 조립 검증:

- child: `2020-01-01_female_unknown-hour`
- mother: `mother_1950-01-01_unknown-hour`
- father: `father_1950-01-01_unknown-hour`
- 결과: `ok=true`, 17페이지 HTML 생성 통과
