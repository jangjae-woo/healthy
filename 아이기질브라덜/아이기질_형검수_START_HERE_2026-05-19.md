# 아이기질+부모양육 v1 형 검수 START HERE

## 현재 진행률

현재 진행률은 92%입니다.

계산/샘플/미리보기/조합 인덱스/수정 루틴은 준비되어 있고, 다음 단계는 형 검수 의견을 받아 95%까지 올리는 단계입니다.

## 먼저 볼 파일 3개

1. 샘플 보고서 미리보기
   - `C:\Users\new\Desktop\saju\아이기질브라덜\v1-block-preview\index.html`

2. 조합 인덱스
   - `C:\Users\new\Desktop\saju\아이기질브라덜\v1-combo-index\index.html`

3. 검수 체크리스트
   - `C:\Users\new\Desktop\saju\아이기질브라덜\hyung-review-checklist-youa-v1-2026-05-19.md`

## 검수 순서

1. `v1-block-preview/index.html`을 열고 sample-001부터 sample-004까지 봅니다.
2. 각 샘플에서 2~7장 아이 6요소를 먼저 봅니다.
3. 특히 `왜 이런 결인가` 아래의 만드는 기운, 누르는 기운, 근거 상세문을 확인합니다.
4. 그다음 `일상에서는`, `양육 Tip`, 부모 단독 사주, 부모-아이 궁합, 함께 살펴볼 결을 봅니다.
5. 구조가 이해되지 않거나 조합이 궁금하면 `v1-combo-index/index.html`을 봅니다.

## 형에게 가장 먼저 확인받을 것

1. 아이 6요소의 만드는 기운/누르는 기운 분류가 사주적으로 말이 되는가.
2. 근거 상세문이 점수와 결론을 충분히 설명하는가.
3. `일상에서는` 문장이 앞의 사주 근거와 자연스럽게 이어지는가.
4. 부모 단독 사주 설명이 아이 양육 조언으로 억지 없이 연결되는가.
5. 부모-아이 궁합과 함께 살펴볼 결이 유료 보고서로 볼 만큼 깊은가.

## 고칠 때 분류 기준

문장만 어색한 경우:
- `overrides.json`으로 수정합니다.
- 예: 표현이 밋밋함, 흐름이 끊김, 말투가 너무 일반론임.

사주 판단이 틀린 경우:
- 문장만 고치면 안 됩니다.
- 판단표나 계산 규칙으로 분리해야 합니다.
- 예: 만드는 기운/누르는 기운 분류가 틀림, 점수와 결론이 충돌함, 부모궁 해석이 맞지 않음.

상품 구조가 아쉬운 경우:
- 섹션 순서나 카드 구조 문제로 분리합니다.
- 예: 좋은 내용이지만 읽는 순서가 불편함, 같은 말이 반복됨.

## 수정 루틴

수정 방식은 아래 문서를 따릅니다.

`C:\Users\new\Desktop\saju\아이기질브라덜\hyung-review-override-routine-youa-v1-2026-05-19.md`

현재 샘플별 수정 템플릿은 여기에 있습니다.

```text
C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-001\overrides.template.json
C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-002\overrides.template.json
C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-003\overrides.template.json
C:\Users\new\Desktop\saju\아이기질브라덜\overrides\v1\sample-004\overrides.template.json
```

형이 고친 문장은 템플릿을 `overrides.json`으로 복사한 뒤 `text`에 넣습니다.

## 95% 통과 조건

1. 샘플 4명 모두 큰 사주 오류가 없습니다.
2. 아이 6요소 근거문과 일상문이 서로 이어집니다.
3. 부모 사주와 부모-아이 궁합이 상품 문장으로 어색하지 않습니다.
4. 형 수정 의견이 `overrides.json`으로 반영됩니다.
5. 아래 QA가 모두 통과합니다.

```powershell
node scripts\apply-youa-v1-overrides.mjs
node scripts\qa-youa-v1-sample-blocks.mjs
node scripts\validate-youa-v1-text-safety.mjs
node scripts\build-youa-v1-block-preview.mjs
node scripts\qa-youa-v1-final-readiness.mjs
```

## 다음 목표

형 검수 반영 후 목표는 95%입니다.

95%가 되면 그다음은 샘플 4명 확정판을 기준으로 대량 캐시 확장, API 연결, 상품 화면 연결 중 어느 것을 먼저 할지 결정합니다.
