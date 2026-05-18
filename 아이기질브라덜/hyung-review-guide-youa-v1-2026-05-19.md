# 아이기질+부모양육 v1 형 검수 가이드

## 현재 목적

이번 검수의 목적은 새 문장을 대량으로 쓰는 것이 아니라, 이미 생성된 아이기질+부모양육 샘플 4명의 흐름이 유료 보고서로 볼 만한지 판단하는 것이다.

검수 기준은 세 가지다.

1. 사주 판단이 억지로 느껴지지 않는가.
2. 아이 기질 설명과 부모 양육 조언이 서로 이어지는가.
3. 부모가 읽었을 때 실제 양육 행동으로 옮길 수 있는가.

## 볼 파일

1. 미리보기 시작 파일
   - `C:\Users\new\Desktop\saju\아이기질브라덜\v1-block-preview\index.html`

2. 문장 수정 템플릿
   - `C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-001\overrides.template.json`
   - `C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-002\overrides.template.json`
   - `C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-003\overrides.template.json`
   - `C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-004\overrides.template.json`

## 검수 순서

1. 먼저 미리보기 HTML에서 전체 흐름을 본다.
2. 각 샘플마다 아이 6요소 설명이 서로 너무 비슷하지 않은지 본다.
3. 엄마/아빠 문장이 실제 부모의 사주 결을 반영하는지 본다.
4. 아이-부모 궁합 문장이 단순 좋은 말이 아니라 관계의 긴장과 보완을 같이 말하는지 본다.
5. 고칠 문장은 `overrides.template.json`에서 해당 항목을 찾아 `text`에 새 문장을 넣는다.

## 형에게 특히 물어볼 것

1. 아이 6요소 명칭과 본문 연결이 사주적으로 무리 없는가.
2. 부모궁 요약이 아이-부모 관계 설명으로 충분히 쓸 만한가.
3. 궁합 문장이 너무 일반론으로 보이는 구간은 어디인가.
4. 유료 상품 기준으로 반드시 더 깊어져야 하는 구간은 어디인가.
5. 지금 구조가 유지되어도 되는가, 아니면 섹션 순서를 바꿔야 하는가.

## 현재 판정

현재 단계는 문장 피드백 직전이다. 형이 문장을 직접 고치거나 방향을 주면, 그 내용을 `overrides.json`으로 반영해서 다시 미리보기와 QA를 돌릴 수 있다.
