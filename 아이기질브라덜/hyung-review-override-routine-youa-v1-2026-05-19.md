# 아이기질+부모양육 v1 문장 수정 반영 루틴

## 원칙

형이 보는 문장은 바로 원본 생성 파일을 고치지 않는다. 먼저 샘플별 `overrides.json`에 수정 문장을 넣고, 반영 스크립트로 결과물에 입힌다.

이렇게 해두면 형의 문장 피드백이 다시 덮어써지지 않고, 어떤 문장을 왜 바꿨는지도 추적할 수 있다.

## 1. 템플릿 만들기

이미 생성되어 있다.

```powershell
node scripts\write-youa-v1-override-templates.mjs
```

결과 위치:

```text
아이기질브라덜\overrides\v1\sample-001\overrides.template.json
아이기질브라덜\overrides\v1\sample-002\overrides.template.json
아이기질브라덜\overrides\v1\sample-003\overrides.template.json
아이기질브라덜\overrides\v1\sample-004\overrides.template.json
```

## 2. 수정 파일 만들기

고칠 샘플 폴더에서 `overrides.template.json`을 복사해서 `overrides.json`으로 만든다.

예:

```text
아이기질브라덜\overrides\v1\sample-001\overrides.json
```

각 항목의 `text`에 새 문장을 넣는다. 고치지 않는 항목은 `text`를 빈 문자열로 둔다.

## 3. 수정 반영하기

```powershell
node scripts\apply-youa-v1-overrides.mjs
```

이 스크립트는 `overrides.json`이 있는 샘플만 읽는다. 아직 수정 파일이 없으면 `applied=0`이 정상이다.

## 4. 다시 검수판 만들기

```powershell
node scripts\qa-youa-v1-sample-blocks.mjs
node scripts\validate-youa-v1-text-safety.mjs
node scripts\build-youa-v1-block-preview.mjs
node scripts\qa-youa-v1-final-readiness.mjs
```

## 5. 주의할 점

- 원본 JSON을 직접 고치기 전에 override로 먼저 반영한다.
- 사주 판단 자체가 틀린 경우는 문장만 바꾸지 말고 판단표 규칙으로 분리한다.
- 표현만 아쉬운 경우는 override 문장으로 처리한다.
- 검수 후 hard error가 생기면 먼저 QA 결과를 보고 원인을 좁힌다.
