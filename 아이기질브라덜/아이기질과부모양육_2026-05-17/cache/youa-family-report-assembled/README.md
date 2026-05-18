# 아이기질과부모양육 가족 보고서 조립 샘플

생성일: 2026-05-17T08:57:47.152Z

## 목적

아이 입력값과 부모 사주 결 캐시를 이용해서 최종 가족 보고서 HTML 1개를 조립한 결과입니다.
이 단계가 팔자원 운영에서 사용할 조회/조립 방식의 원형입니다.

## 출력

- HTML: `C:\Users\new\Desktop\saju\아이기질브라덜\아이기질과부모양육_2026-05-17\cache\youa-family-report-assembled\family-report-sample.html`
- validator: 통과

## 사용한 부모 캐시 key

- 어머님: `mother_1988-01-01_unknown-hour`
- 아버님: `father_1985-10-03_unknown-hour`
- 아이: `2021-08-17_female_unknown-hour`

## 현재 구조

1. 아이는 `C:\Users\new\Desktop\saju\아이기질브라덜\아이기질과부모양육_2026-05-17\cache\youa-child-report-cache-full`의 캐시에서 읽습니다.
2. 어머님/아버님은 `C:\Users\new\Desktop\saju\아이기질브라덜\아이기질과부모양육_2026-05-17\cache\youa-parent-saju-cache-full`의 캐시에서 읽습니다.
3. `buildFacts`, `mockLLMResponse`, `renderReport`로 최종 HTML을 조립합니다.
