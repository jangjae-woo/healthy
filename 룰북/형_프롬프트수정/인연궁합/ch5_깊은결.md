# 인연궁합 ch5 — 5장 두 사람의 깊은 결 (체질 2 + 시기 3 + 본능 관계별 분기) ⭐

⚠️ 수정 전 `0_인연궁합_읽어주세요.md` 필독. **이 챕터는 본능 sub가 큰따옴표 문자열 안에 있음.**

- **파일**: `lib/inyeon/prompts/ch5-physical.ts`
- **함수**: `buildInyeonChapter5Prompt(req, c)` — `c`는 PhysicalCtx

## 편집 구역 2종 — 서로 다름 ⭐

### A. 체질·시기 sub 5개 — 템플릿 리터럴 직접 (편하게 고침)
반환 백틱 템플릿 안 `## 우리의 체질궁합` / `## 우리의 시기궁합` 아래:
| # | 소제목 | 메인 | 시그너처 |
|---|---|---|---|
| 1 | 두 사람의 오행 체질 | 강·약 오행·신강신약 | 양방향 분리 묘사형 |
| 2 | 함께할 때 건강의 보완과 주의점 | 약한 오행 보완·강한 오행 | 처방전 산문형 |
| 3 | 가장 가까워질 시기 | 두 사람 대운·합·세운 | 시간 흐름 묘사형 |
| 4 | 흔들릴 수 있는 시기 | 충·원진·약한 오행 | 신호등/예방형 |
| 5 | 향후 1년의 흐름 | 세운·두 사람 대운·일간 관계 | 시기 흐름 묘사형 (상·하반기) |

### B. 본능 sub — `const BONNEUNG_BY_RELATIONSHIP` 레코드 (큰따옴표 문자열!) ⭐
파일 상단 `const BONNEUNG_BY_RELATIONSHIP: Record<...>` 안. 6 관계별로 2~3개 sub.
**여기 `guide` 값은 큰따옴표 JS 문자열** — `\n`(줄바꿈)·`\"`(따옴표)·`__A__`·`__B__` 보존 필수.
```ts
{ title: "그 사람의 숨겨진 이성적 매력",
  guide: "[메인: ...]\n[시그너처: ...]\n구성: ① 단정 한 줄 — \"...\" → ② ..." }
```
- crush(짝사랑) 2 / talking(썸) 2 / dating_short(연인3M미만) 3 / dating_long(연인3M이상) 4 / married(부부) 3 / exboyfriend(재회) 3

## 변수 (보존)
`${c.aName}` `${c.bName}` `${c.aOhaengTop}` `${c.aOhaengWeak}` `${c.aShinKang}` `${c.aSinsalLine}` `${c.aDaeunLine}` `${c.aBirthYear}` `${c.currentYear}` `${c.physicalScore}` `${choiceCtx}` `${bonneungSection}`

## 고정 헤더 (변경 금지)
`## 우리의 체질궁합` `## 우리의 시기궁합` `## 우리의 본능궁합` + 위 체질·시기 `### 소제목` 5개 + 본능 레코드의 모든 `title:` 값

## 본능 sub 톤 (절대)
노골 묘사·19+ 절대 금지. 결·기운·온도·리듬·끌림·케미 자연 비유 중심. 관계 단계 톤 충실 — 짝사랑·썸은 가능성 어조, 연인·부부는 깊어지는 결.
