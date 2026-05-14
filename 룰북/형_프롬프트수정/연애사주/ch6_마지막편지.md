# 연애사주 ch6 — 6장 홍도인의 마지막 편지 (소제목 1개)

⚠️ 수정 전 `0_연애사주_읽어주세요.md` 먼저.

- **파일**: `lib/hongsil/prompts/v5-report.ts`
- **함수**: `buildHongsilChapter6PromptV5(choice, c)`
- **편집 구역**: 반환 백틱 템플릿 안 — 페르소나 첫 줄 / `## 6장` 헤더 / `### 마지막 편지` 블록

## 변수 (보존)
`${c.name}` `${c.meCharacter}` `${c.destinyCharacter}` `${buildHongsilChoiceContext(choice)}` `${dataBlock(c)}` `${v5Principles(String(c.name))}` `${finalCheck(String(c.name))}`

## 고정 헤더 (변경 금지)
- `## 6장 — 홍도인의 마지막 편지`
- `### 마지막 편지`

## 소제목 구성
| 소제목 | 페이지 타입 | 핵심 |
|---|---|---|
| 마지막 편지 | 마지막 편지형 | 첫 줄 "${c.name}님께," 고정. **사주 전문용어·한자 금지**. 1~5장 내용을 근거 나열 없이 회상. 구성: 호명·도입 → 매력·타이밍 회상 → 맞는 사람·반복 패턴 회상 → 끌림·온도 회상 → ${c.meCharacter}상과 ${c.destinyCharacter}상 결 한 문장 종합 → [[짧은 명언]] + "— 홍도인 드림" |

## ch6 특이사항
- ch6은 build-context에서 `_common`(십성 한자 정의 블록) 대신 `_ch6Common`(단독 풀이 환각 방지만)을 씀. 이유: ch6 "한자 금지" 룰과 한자 정의 블록이 모순돼서 Gemini 빈 응답 사건이 있었음. → ch6 프롬프트에 한자 관련 룰 넣을 때 주의.
- 검수팀에서 ch6은 rewrite 비활성 가능성 — 이 프롬프트가 톤 거의 그대로 결정.

분량 5~6단락 430~680자.
