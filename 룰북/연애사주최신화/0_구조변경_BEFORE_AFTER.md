# 옵션 B 적용 — 이전 vs 새 구조 비교

## BEFORE (지금까지의 그림 — 6 레이어)

```
[1] 입력 (Q1·Q2·Q3 + 사주 데이터)
         ↓
[2] 엔진 레이어 — 사주 원국·오행·십성·신살·대운 결정론 계산
         ↓
[3] 해석 기획 레이어 — 챕터별 인자 분배·중복 방지·톤
         ↓
[4] 캐릭터 매핑 레이어 — 본인·짝꿍 캐릭터 결정
         ↓
[5] LLM 생성 (Gemini 1회 호출) — 챕터별 prompt → 6 챕터 본문 한 번에
         ↓
[6] LLM 검수팀 — 결정론 가드 → judge → rewrite → 결정론 가드
         ↓
[7] 렌더 레이어 — SSE 스트림 → 챕터별 본문 표시
```

문제점:
- 메인 prompt에 모든 안내 어휘·예시 표현 다 박혀 있어 LLM이 본문에 새어들게 함
- ch6 빈 응답 같은 모순 사건 (한자 정의 + 한자 금지 룰 충돌)
- 솔로 탈출·올해 흐름이 일반 가이드로 폴백 (사주 처방 데이터 없음)
- 메인 prompt 수정할 때마다 다른 sub에 사이드 이펙트


## AFTER (옵션 B 적용 — 새 7 레이어)

```
[1] 입력 (Q1·Q2·Q3 + 사주 데이터)
         ↓
[2] 엔진 레이어 — (그대로)
         ↓
[3] 해석 기획 레이어 — (메인 prompt만 슬림. 안내 어휘는 구체화 영역으로 이동)
         ↓
[4] 캐릭터 매핑 레이어 — (그대로)
         ↓
[5a] 메인 LLM 생성 (Gemini 1차 호출) — 깨끗한 메인 prompt로 6 챕터 본문
         ↓
[5b] 구체화 LLM 생성 (Gemini 2차 호출 — ★★★ 새로 추가) — 솔로 탈출·올해 흐름만 별도
         ↓
[6] LLM 검수팀 — 결정론 가드 → judge → rewrite + repetition-tone → 결정론 가드
         ↓
[7] 렌더 레이어 — (그대로)
```

핵심 변화:
- **[5a] 메인 LLM은 깨끗한 prompt 받음** (안내 어휘·예시 표현 0)
- **[5b] 구체화 LLM 새로 추가** — 솔로 탈출·올해 흐름 sub만 별도 호출. 사주 처방 데이터 + 안내 어휘 포함
- **[6] rewrite에 repetition-tone 통합** — 한자 반복·결핍 낙인·동물 직역 톤 안내가 rewrite 단계에서만 LLM에 노출
- 결과: 메인 LLM은 새어듦 0 / 구체화·rewrite의 새어듦은 영역 좁아 1~2곳 수준


## 새 prompt 파일 3개 위치

```
saju/lib/hongsil/prompts/refinement/
├── solo-escape.ts        ← 솔로 탈출 가이드 (사주 처방 + 안내 어휘)
├── yearly-flow.ts        ← 올해 연애 흐름 (사주 처방 + 안내 어휘)
└── repetition-tone.ts    ← 한자 반복·결핍 낙인·동물 직역 톤 (rewrite에서 import)
```

## 새 helper 파일

```
saju/lib/hongsil/yongsin-prescription.ts
```

부족 오행 5종 + 신살 활용 + 세운 흐름 매핑. 결정론 데이터.


## LLM 호출 흐름 (route.ts)

```typescript
for (const { ch } of chapterPrompts) {
  // 1차: 메인 LLM 호출 (지금까지의 동작)
  const mainBody = await callMain(ch);
  
  // 2차: ch2 이면 솔로 탈출·올해 흐름만 구체화 호출
  let finalBody = mainBody;
  if (ch === 2) {
    const prescription = derivePrescription(saju);  // helper
    const soloRefined = await callRefinement('solo-escape', prescription, mainBody.subs['솔로 탈출 가이드']);
    const yearlyRefined = await callRefinement('yearly-flow', prescription, mainBody.subs['올해 연애에서 조심할 흐름']);
    
    // fallback: 호출 실패 시 메인 본문 사용
    finalBody = mergeSubs(mainBody, {
      '솔로 탈출 가이드': soloRefined || mainBody.subs['솔로 탈출 가이드'],
      '올해 연애에서 조심할 흐름': yearlyRefined || mainBody.subs['올해 연애에서 조심할 흐름'],
    });
  }
  
  // 3차: 검수팀 (rewrite는 repetition-tone 포함)
  const guarded = await guardGeneratedText({ ..., text: finalBody });
  stream(guarded.text);
}
```

추가 시간: ch2 처리에 LLM 호출 +2 (solo-escape, yearly-flow) → 풀이 전체 +6~10초


## 안전 장치

1. **fallback** — solo-escape·yearly-flow 호출 실패 시 메인 본문 사용. 빈 본문 위험 0.
2. **새 prompt 모순 회피** — ch6 빈 응답 사건 교훈. 새 prompt에 한자 정의 + 한자 금지 같은 모순 룰 안 박음.
3. **진단 로깅** — 별도 호출 실패 시 `[hongsil ch2 refinement] failed: ...` vercel logs.
4. **처방 데이터 검증** — 매핑은 사용자 검토 후 박음.
5. **rewrite 강제 룰** — "안내 어휘를 본문에 박지 말 것" 명시.


## 점수 추정 (현재 vs 적용 후)

| 단계 | 점수 |
|---|---|
| Phase 1 (완성본8) | 86~91% |
| 옵션 B 적용 | 91~94% |
| 100% | LLM 확률성으로 원리적 불가 |


## 잔존 결함 (옵션 B로 해결 안 됨 — 별개 작업)

- 결핍 표현 변형 우회 (Fix E·E2 미커버 패턴)
- 자연 비유 후속 sub 등장 (character class 확장 필요)
- 한자/한글 혼합 오타 (LLM 자체 오류)
- 캐릭터 호칭 변형 ("정숙님" vs "정숙상" 일관성)

→ 이 결함들은 별개 fix. 옵션 B 후 측정해서 결정.
