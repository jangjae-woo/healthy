# 인연궁합 ch7 — 7장 결혼·미래궁합 (관계별 완전 분기) ⭐

⚠️ 수정 전 `0_인연궁합_읽어주세요.md` 필독. **이 챕터는 소제목 전부가 큰따옴표 문자열 안에 있음.**

- **파일**: `lib/inyeon/prompts/ch7-marriage.ts`
- **함수**: `buildInyeonChapter7Prompt(req, c)` — `c`는 Ch7Ctx

## 편집 구역 — `const CH7_BY_RELATIONSHIP` 레코드 ⭐
ch6과 동일 구조. 6 관계별 섹션 제목·소제목·구성이 통째로 다름. 파일 상단 `const CH7_BY_RELATIONSHIP: Record<...>` 안 **큰따옴표 JS 문자열**.
**`\n`·`\"` 보존 + placeholder 보존**: `__MARRIAGE_YEAR__`(좋은 결혼 시기), `__CRISIS_YEAR__`, `__CHILD_PLAN_YEAR__` — 나중에 실제 시기로 치환됨. 그대로 둘 것.

## 관계별 섹션 + sub 수
| 관계 | sectionTitle | sub 수 |
|---|---|---|
| crush 짝사랑 | 만약 함께한다면 | 2 (결혼 갈 가능성 / 펼쳐질 미래 모습) |
| talking 썸 | 이 인연이 닿을 수 있는 곳 | 2 (미래까지 갈 가능성 / 닿을 수 있는 곳) |
| dating_short 연인3M미만 | 멀리 봤을 때 우리의 미래 | 3 (결혼 가능성 / 펼쳐질 미래 / 길게 가려면 챙길 것) |
| dating_long 연인3M이상 | 결혼·미래궁합 | 5 (결혼 이어질지 / 결혼 장애물 / 좋은 결혼 시기 / 신혼 시작 자리 / 자녀운) |
| married 부부 | 가정과 함께 가는 길 | 5 (자녀운 / 자녀운 보완 / 노년기 결 / 평생 흔들리지 않는 결 / 가정 재물 흐름) |
| exboyfriend 재회 | 다시 함께한다면 | 3 (다시 결혼 갈지 / 펼쳐질 미래 / 길게 가려면 한 가지) |

## 변수 (보존)
`${c.aName}` `${c.bName}` 등 두 사람 지표 + `${c.marriageYear}` `${c.crisisYearRange}` `${c.childPlanYearRange}` `${c.aParentPalace}` (미래 시기 지표 블록). `${plan.sectionTitle}` `${subsBlock}` `${choiceCtx}`

## 고정 (변경 금지)
모든 `sectionTitle:` 값 + 모든 `title:` 값.

## 출력 룰 특이
운명·반드시·평생 단정 X. 의료·법률·이혼·재산 분할 자문 X. 점수·% 금지.
