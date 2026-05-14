# 인연궁합 ch6 — 6장 지금 우리에게 필요한 것 (관계별 완전 분기) ⭐

⚠️ 수정 전 `0_인연궁합_읽어주세요.md` 필독. **이 챕터는 소제목 전부가 큰따옴표 문자열 안에 있음.**

- **파일**: `lib/inyeon/prompts/ch6-finance.ts`
- **함수**: `buildInyeonChapter6Prompt(req, c)` — `c`는 Ch6Ctx

## 편집 구역 — `const CH6_BY_RELATIONSHIP` 레코드 ⭐
이 챕터는 **6 관계별로 섹션 제목·소제목·구성이 통째로 다름**. 모든 sub가 파일 상단 `const CH6_BY_RELATIONSHIP: Record<...>` 안의 **큰따옴표 JS 문자열**.
```ts
crush: {
  sectionTitle: "그 마음을 풀어가는 길",
  subs: [
    { title: "그 사람의 마음을 여는 열쇠",
      guide: "[메인: ...]\n[시그너처: ...]\n구성: ① 단정 한 줄 — \"...\" → ② ..." },
    ...
  ]
}
```
**`\n`·`\"`·`__A__`·`__B__` 보존 필수.** 반환 템플릿 본문(`buildInyeonChapter6Prompt` 안 백틱)은 거의 변수뿐 — 고칠 거 없음. **형이 고치는 건 레코드.**

## 관계별 섹션 (sectionTitle) + sub 수
| 관계 | sectionTitle | sub 수 |
|---|---|---|
| crush 짝사랑 | 그 마음을 풀어가는 길 | 4 (마음 여는 열쇠 / 피해야 할 행동 / 고백 타이밍·방법 / 정리해야 할 신호) |
| talking 썸 | 관계가 깊어지는 길 | 3 (호감 키우는 법 / 진전될 결정적 순간 / 잘 안 될 신호) |
| dating_short 연인3M미만 | 초반을 단단히 다지는 길 | 3 (초반에 단단해질 법 / 콩깍지 너머 진짜 모습 / 조심해야 할 갈등) |
| dating_long 연인3M이상 | 더 깊어지는 길 | 2 (권태기 넘는 법 / 다음 단계 갈 신호) |
| married 부부 | 평생 함께 가는 길 | 2 (평생 깊어지는 결 / 흔들릴 수 있는 시기) |
| exboyfriend 재회 | 어긋난 인연을 다시 보다 | 4 (어긋난 진짜 이유 / 다시 이어질 가능성 / 결정의 골든타임 / 반복 안 될 방법) |

## 변수 (보존)
`${c.aName}` `${c.bName}` `${c.aIlgan}` 등 두 사람 지표 — 반환 템플릿 데이터 블록. `${plan.sectionTitle}` `${subsBlock}` `${choiceCtx}`

## 고정 (변경 금지)
모든 `sectionTitle:` 값 + 모든 `title:` 값. 출력 룰 안 `관계 단계 톤(${plan.sectionTitle})` 표현.
