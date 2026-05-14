# 인연궁합 ch8 — 8장 홍연의 마지막 편지 (소제목 3개 + 관계별 톤·제목 분기)

⚠️ 수정 전 `0_인연궁합_읽어주세요.md` 먼저.

- **파일**: `lib/inyeon/prompts/ch8-final-letter.ts`
- **함수**: `buildInyeonChapter8Prompt(req, c)` — `c`는 FinalCtx

## 편집 구역 2종

### A. 관계별 제목·톤 — `const` 레코드 (큰따옴표 문자열) ⭐
- `const SECTION_TITLE_BY_RELATIONSHIP` — 6 관계별 편지 제목 (큰따옴표)
- `const LETTER_TONE_BY_RELATIONSHIP` — 6 관계별 편지 톤 (큰따옴표, `__A__`·`__B__` placeholder 포함 — 보존)

### B. 소제목 3개 — 템플릿 리터럴 직접 (편하게 고침)
반환 백틱 템플릿 안:
| # | 소제목 | 시그너처 | 분량 |
|---|---|---|---|
| 1 | 이렇게 만나주신 두 분께 | 편지 도입 — 인사+회상 | 280~360자 |
| 2 | 두 분의 결, 잊지 마세요 | 편지 본론 — 강점+살펴줄 결 양면 (두 단락) | 550~750자 |
| 3 | 마지막으로 드리는 한 마디 | 편지 마무리 — 호명+짧은 응원+명언 | 200~280자 |

## 변수 (보존)
`${c.aName}` `${c.bName}` `${c.inyeonScore}` 등 종합 점수 / `${c.marriageYear}` `${c.crisisYearRange}` `${c.topStrength}` `${c.topWarning}` / `${sectionTitle}` `${toneGuide}` `${choiceCtx}`

## 고정 헤더 (변경 금지)
- `## ${sectionTitle}` (변수 헤더 — 레코드 값이 들어감)
- `### 이렇게 만나주신 두 분께` `### 두 분의 결, 잊지 마세요` `### 마지막으로 드리는 한 마디`

## 출력 룰 특이
편지체 산문. 박스·리스트·이모지·표·번호 절대 금지. 전체 1100~1500자(3 sub 합산). 사주 인자 1~2개만 자연 인용 (명리 강의 톤 X). ch8은 검수팀 rewrite 비활성 — 이 프롬프트가 톤을 거의 그대로 결정함.
