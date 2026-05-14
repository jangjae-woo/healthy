# LLM 출력 검수 50개 시뮬레이션

작성일: 2026-05-11T16:43:57.840Z

## 요약

- 상태: 부분 실행
- 총 목표 샘플: 50
- 실행된 샘플: 2
- Gemini 응답 완료: 0
- 오류: 2
- PASS: 0
- CHECK: 2
- 평균 호출 시간: 0ms
- 평균 압축 비율: 0
- 방식: 원 프롬프트가 아니라 검수/재작성 단계의 의미 클러스터 압축 프롬프트를 Gemini API로 직접 테스트

## 판정 기준

- 같은 사주근거명 최대 1회
- 금지 표현 없음
- 대체어 반복 없음
- 기준 없는 원점수 노출 없음
- "마치" 비유 1회 이하
- 원문에 없던 새 제목/목록/섹션 추가 없음

## 상세

### 1. hongsil / 신약+비겁0 속도/수용 반복

- 결과: ERROR
- 오류: Error: Gemini 429: {
  "error": {
    "code": 429,
    "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota ex

### 2. inyeon / 식상0 표현 반복

- 결과: ERROR
- 오류: Error: Gemini 429: {
  "error": {
    "code": 429,
    "message": "You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota ex

