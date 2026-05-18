# Claude Code 전달용 - 샘플 10건 생성

이 폴더 전체를 Claude Code에게 전달하면 된다.

목표:

`사주로 풀어보는 우리 아이 마음` 보고서의 샘플 10건을 생성한다. 단순 HTML 복제가 아니라, `index.html`의 문체와 구조를 기준으로 다양한 사주 조합에 대응할 수 있는 JSON 보고서 샘플을 만든다.

## 읽는 순서

1. `TASK_FOR_CLAUDE_CODE.md`
2. `YOUA_MASS_GENERATION_GUIDE.md`
3. `CLAUDE_CODE_BATCH_PROMPT.md`
4. `YOUA_EXPRESSION_POOL_V1.json`
5. `YOUA_CACHE_SCHEMA.json`
6. `YOUA_VALIDATOR_RULES.md`

## 산출물

Claude Code는 아래 폴더를 만들고 결과를 저장한다.

```text
output/
  sample-001.json
  sample-002.json
  sample-003.json
  sample-004.json
  sample-005.json
  sample-006.json
  sample-007.json
  sample-008.json
  sample-009.json
  sample-010.json
  QA_REPORT.md
```

## 중요

- 점수와 등급은 반드시 5단계 기준을 지킨다.
- `28점 중간`, `70점 중간` 같은 결과는 실패다.
- 사주 인자, 점수, 관계는 입력값 안에서만 사용한다.
- 본문에는 `undefined`, `null`, `child0`, `mother`, `father`가 나오면 안 된다.
- 샘플 10건은 서로 다른 느낌이어야 한다.

