# 아이기질과부모양육 정리본

작업일: 2026-05-17
원본 작업 폴더: C:\Users\new\Desktop\saju\형과함께NEW\시작
리뷰 HTML: review\youa-review-samples-5.html

## 포함 파일

- lib/youa/render.mjs
- lib/youa/render-utils.mjs
- lib/youa/mock-llm.mjs
- lib/youa/output-parser.mjs
- lib/youa/output-validator.mjs
- lib/youa/prompt-builder.mjs
- scripts/build-review-html.mjs
- components/report.html
- components/result.html
- review/youa-review-samples-5.html

## 주요 반영 내용

- 보고서 장 구성 8~12장 재정렬
- 3페이지 아코디언 클릭 중복 핸들러 제거
- 13~16페이지 부모 사주/궁합/함께 살펴줄 결 구조와 문장 풍부도 정리
- 15페이지 삼각 구도, 합/생/극/동 표기, 흐름 요약 문구 조정
- 16페이지 충돌 카드에만 '이렇게 풀어보세요' 노출

## 검증

- npm run review-html 통과
- npx tsc --noEmit 통과
- npm run edge-cases 통과: 7/7 PASS

## 캐시 보관 위치

현재 생성된 운영용 백데이터는 이 폴더 아래에 모아두었습니다.

```text
C:\Users\new\Desktop\saju\아이기질브라덜\아이기질과부모양육_2026-05-17\cache
```

구성은 다음과 같습니다.

- `cache\youa-child-report-cache-full`: 아이 기본 보고서 JSONL 캐시
- `cache\youa-parent-saju-cache-full`: 어머님/아버님 사주 결 JSONL 캐시
- `cache\youa-family-report-assembled`: 캐시 조립 샘플 HTML
- `cache\sqlite\youa-cache.sqlite`: 아이/부모 캐시를 합친 SQLite DB

## 생성된 데이터 현황

- 아이 캐시: 37,986건
- 부모 캐시: 579,254건
- SQLite 합계: 617,240행
- SQLite DB 용량: 약 8.32GB

## 운영 조립 흐름

1. 아이 입력값으로 `child_reports`에서 1건 조회
2. 어머님 입력값으로 `parent_saju`에서 1건 조회
3. 아버님 입력값으로 `parent_saju`에서 1건 조회
4. 조회한 3개 `record_json`을 파싱
5. `buildFacts -> mockLLMResponse -> renderReport` 순서로 최종 가족 보고서 HTML 조립

## GitHub 주의

`cache` 안의 `.jsonl`, `.sqlite`, `index.json`은 용량이 매우 커서 GitHub에 직접 올리면 안 됩니다.
레포에는 코드와 설명 파일만 올리고, 대용량 캐시는 서버 배포 시 별도 스토리지나 서버 디스크에 배치하는 방식이 맞습니다.
