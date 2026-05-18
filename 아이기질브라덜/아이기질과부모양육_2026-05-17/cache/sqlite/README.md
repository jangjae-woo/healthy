# 아이기질과부모양육 SQLite 캐시

생성일: 2026-05-17T08:56:14.917Z

## 파일

- DB: `C:\tmp\youa-sqlite-cache\youa-cache.sqlite`
- 요약: `C:\tmp\youa-sqlite-cache\summary.json`

## 테이블

- `child_reports`: 아이 기본 보고서 캐시
- `parent_saju`: 어머님/아버님 사주 결 캐시

## 행 수

- 아이: 37,986건
- 부모: 579,254건
- 합계: 617,240건

## 조회 key

- 아이: `YYYY-MM-DD_gender_hour`
- 부모: `role_YYYY-MM-DD_hour`

## 운영 조회

각 테이블의 `cache_key`는 PRIMARY KEY입니다.
최종 가족 보고서 조립 시에는 아이 1건, 어머님 1건, 아버님 1건을 조회한 뒤 `record_json`을 파싱해서 사용하면 됩니다.
