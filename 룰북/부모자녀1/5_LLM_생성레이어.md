# 5. LLM 생성 레이어 — Gemini 호출 (V2 phase 구조)

## 역할
해석 기획·캐릭터 매핑·prompt 룰북 모두 합쳐 Gemini에 보내고 본문 스트리밍 받음. V2 phase별 fetch (compute → ch1~ch6 → outro). 7회 fetch.

## 주요 파일
- `app/api/generate/route.ts` — `type='parent-child-v2'` 분기 (L3987~)
- `lib/saju-system-instruction.ts` — `SAJU_SYSTEM_INSTRUCTION`
- prompt 빌더: `buildParentChildPromptV2(d, sajuChild, sajuMom, sajuDad, momCompat, dadCompat, familySaja, phase)` (L2931)

## 모델·설정
- 모델: `gemini-2.5-flash`
- 호출: `streamGenerateContent?alt=sse`
- `thinkingBudget: 0`
- `maxOutputTokens: 8192`
- `maxDuration: 300` (Vercel 함수 한도)

## V2 phase 구조
- `compute` — 사주 계산값 JSON 응답 (LLM 호출 X)
- `ch1` — intro (자도인 도입 + 7가지 설계도)
- `ch2` — 우리 아이는 어떻게 공부할까 (5 sub, G13 sub 헤더 연령별)
- `ch3` — 우리 아이 칭찬하고 혼내는 법 (5 sub, G13 ch3_lie 연령별)
- `ch4` — 친구 사이 우리 아이 (4 sub)
- `ch5` — 우리 아이는 무엇으로 빛날까 (5 sub, 미래형)
- `ch6` — 엄마아빠와 우리 셋의 결 (3 sub, hasMom/hasDad 동적)
- `outro` — 자도인의 마지막 당부 (2~3문장, F2)

## phase 마커
- 서버는 직접 안 박음
- 클라이언트(`ParentChildSlideResultV2.tsx`)가 fetch 루프에서 `<<<PARENT_CHILD_PHASE:chN>>>` 마커를 streamText에 prepend
- `buildSlideTextMap`이 마커로 phase 분기 → ### sub만 매칭, ## 헤더 무시
- `buildSlideTextMapLegacy` 보존 (회귀 안전망 — 마커 없으면 옛 매칭)

## buildParentChildPromptV2 조립 순서
```
이름·성별·호칭 정보 (cnh, parentsLabel)
  + ageStage + ah (getAgeAdaptedHeaders)
  + childTraitsBlock (cell framework)
  + childSeed + opener seed
  + familySaja + giftCard + synergyCards
  + dataBlock (사주 데이터)
  + principles (V2 절대 원칙 A~L)
  + parentChildAgeToneBlock(ageStage) — G6 미래형 강제 (영유아)
  + interpretationContext (build-context.ts 결과)
  + 챕터 prompt 본문 (ch1Body / ch2Body / ... / outroBody)
```

## SSE 이벤트
- `t: "x", v` — text chunk (응답에 ch 명시 X — phase별 fetch라 클라이언트가 phase로 매핑)
- `t: "tk", m` — usedTokens snapshot 직렬화 (cross-chapter)
- `t: "err", finishReason, blockReason, chunks` — 빈 응답·차단 진단
- `[DONE]`

## 가드 진입
- `accumulatedText.length > 100 && !finishReason && !blockReason` 조건에서 `guardGeneratedText({service: "parent-child", chapter: phase, ...})` 호출
- `usedTokens` Map 전달 (가드가 mutate)
- 가드 끝나면 `usedTokens` 직렬화해서 `t: "tk"` 이벤트 push → 클라이언트가 누적

## V2 절대 원칙 A~L (route.ts principles)
- A. 사주 용어 노출 룰 (한자 병기 1회 허용)
- B. 시그너처 톤 다양성 (sub마다 다른 글의 모양)
- C. 한자 cross-chapter 2회 룰
- D. 격국 V2에서 완전 삭제
- E. 5단락 동일 템플릿 절대 금지
- F. 사주 인자 직접 인용 의무 (최소 3개)
- G. 일반론·바넘 표현 절대 금지
- H. 점수·% 직접 인용 X
- I. 단정 X — 가능성 어조
- J. "~에요" 어미
- K. 산문체 4단 (단정 → 메커니즘 → 일상 → 권고)
- L. 박스·번호·이모지·표·가상 대화 절대 금지

## ch6 prompt 동적 분기
- `ch6Title`: hasMom && hasDad ? "엄마아빠와 우리 셋의 결" : hasMom ? "어머님과 우리의 결" : "아버님과 우리의 결"
- `ch6FirstSubtitle`: trio면 "엄마와 통하는 결, 아빠와 통하는 결" / dyad면 단일 부모 결
- `ch6TrioMoment`: trio면 "셋이 함께 가장 편안한 순간" / dyad면 둘 결
- 자녀 강한 오행(`cf_strongestElem`) + 부모 결 비교 인용

## outro 정확 룰 (F2, 2026-05-14)
- `## 자도인의 마지막 당부` 헤더 정확히
- 본문 정확히 2~3 문장, 한 문장 50자 이내
- 미래형 약속·일반 격려 금지
- 자도인 시적 종합으로 끝
- disclaimer 한 줄 정확히 그대로 출력

## 진단 로깅
- `[v2/${phase}] start model=gemini-2.5-flash promptLen=${len}`
- non-2xx 시: `status·statusText·body 600자` 캡처해 stream에 `t:"err"` 푸시
- 200 OK인데 빈 응답: `finishReason·blockReason·safetyRatings` 캡처

## 알려진 결함 (개선 대상)
- G11 시나리오 미래형 부분 미흡 — 영유아에 책상·문제집 시나리오 가끔 잔존 (prompt 룰만 70% 보장)
- 풀 phrase + 한자 토큰 합성 어색 ("타고난 결 辛(신)") — G14 일부 해결, 본질 fix는 prompt 강화

## 진행 로그
- 2026-05-14: G13 ch2·ch3 sub 헤더 + 시나리오 힌트 (ch2_deskScene) 분기
- 2026-05-14: F2 outro 2~3문장 강제 + 한 문장 50자 이내
- 2026-05-13: V2 phase 분기 fetch 인프라 + cross-chapter usedTokens
- 2026-05-13: rewriteOutput 안내문이 본문에 새어드는 결함 → 헤더 보존 절대 룰 추가
- 2026-05-07: V2 prompt 사용자 메모장 골든 소스 적용 (3장·4장)
