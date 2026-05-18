# 아이기질과부모양육 아이별 완성 보고서 캐시

생성일: 2026-05-17T08:41:14.840Z

## 목적

LLM 호출을 최소화하기 위해 아이의 생년월일, 성별, 출생시간 조합별 완성 보고서를 미리 생성해 둔 캐시입니다.

## 입력 범위

- 자녀 생년월일: 2020-01-01 ~ 2023-12-31
- 성별: 여자아이, 남자아이
- 시간: 12지시 + 시간 모름
- 전체 조합: 37,986개

## 출력 파일

- `index.json`: 캐시 key별 연도 파일/라인 위치
- `summary.json`: 생성 통계 원본 JSON
- `child-report-cache-2020.jsonl`: 9,516건, 833.11MB
- `child-report-cache-2021.jsonl`: 9,490건, 831.85MB
- `child-report-cache-2022.jsonl`: 9,490건, 832.38MB
- `child-report-cache-2023.jsonl`: 9,490건, 830.79MB

## 캐시 key 형식

```
YYYY-MM-DD_gender_hour
```

예:

```
2021-08-17_female_unknown-hour
2021-08-17_female_인시-03-30-05-29-
```

## 레코드 구조

각 JSONL 줄은 하나의 완성 보고서입니다.

```json
{
  "key": "...",
  "input": {
    "birthDate": "2021-08-17",
    "gender": "female",
    "hour": "시간 모름",
    "calendar": "solar"
  },
  "summary": {
    "ilgan": "정",
    "animal": "용",
    "animalCase": "C",
    "animalConfidence": "date-only",
    "pageCount": 14,
    "valid": true
  },
  "facts": {},
  "html": "<div class=...>"
}
```

## 생성 결과

- 생성 성공: 37,986건
- 실패: 0건
- validator 실패: 0건
- 소요 시간: 52.51초
- 평균 속도: 723.41건/초
- 총 용량: 3328.14MB

## 주의

- 현재 파일은 전체 HTML까지 포함하므로 용량이 큽니다.
- 운영 연결 시에는 index로 key를 찾고, 해당 연도 JSONL의 line을 읽어 사용하는 방식이 좋습니다.
- 부모 정보까지 완성본으로 전부 저장하면 조합 수가 크게 늘어나므로, 아이 기본 보고서 캐시와 부모/궁합 조합 캐시는 분리하는 편이 안전합니다.
