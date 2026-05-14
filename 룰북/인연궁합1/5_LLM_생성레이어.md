# 5. LLM 생성 레이어 — Gemini 호출

## 역할
해석 기획·캐릭터 매핑·prompt 룰북 합쳐 Gemini에 보내고 본문 스트리밍 받음. 8 챕터 순차 streaming (단일 fetch).

## 주요 파일
- `app/api/inyeon-generate/route.ts` — 8 챕터 순차 생성 + 진단 로깅
- `lib/saju-system-instruction.ts` — `SAJU_SYSTEM_INSTRUCTION`
- `lib/inyeon/build-context.ts` — `buildAllInyeonPrompts` 오케스트레이터
- `lib/inyeon/prompts/ch{1~8}-*.ts` — 8 챕터 prompt 생성기
- `lib/inyeon/prompts/shared-context.ts` — 관계·기간별 톤 가이드
- `lib/inyeon/prompts/v2-principles.ts` — V2 출력 원칙

## 모델·설정
- 모델: `gemini-2.5-flash`
- 호출: `streamGenerateContent?alt=sse`
- `thinkingBudget: 0` (빠른 생성)
- `maxOutputTokens: 8192`
- 챕터 1~8 순차 생성. `phase=chN` 단일 챕터 모드 있음.
- `maxDuration: 300` (Vercel 함수 한도)

## 8 챕터 prompt 파일
- `ch1-basic.ts` — 나는 (사주가 펼치는 나의 결)
- `ch2-inyeon.ts` — 우리는 (인연의 시작)
- `ch3-seonggyeok.ts` — 성격궁합
- `ch4-emotion.ts` — 감정궁합
- `ch5-physical.ts` — 깊은궁합 (체질·시기·본능, 6 관계 분기)
- `ch6-finance.ts` — 관계조언 (6 관계 분기, 재물궁합 SWAP)
- `ch7-marriage.ts` — 결혼·미래궁합 (6 관계 분기)
- `ch8-final-letter.ts` — 홍도인의 마지막 편지 (6 관계 톤 분기)

## SSE 이벤트
- `t: "cs", ch` — chapter start
- `t: "x", ch, v` — text chunk
- `t: "cd", ch, guard` — chapter done (`guard: "pass" | "repaired"`)
- `t: "ce", ch, error` — chapter error
- `t: "tk", m` — usedTokens snapshot (cross-chapter)
- `t: "d"` — all done
- `t: "err", error` — fatal

## prompt 조립 순서 (build-context.ts)
ch1~ch7:
```
SAJU_SYSTEM_INSTRUCTION (systemInstruction)
  + SIPSEONG_STANDARD_DEFINITIONS + PARTNER_MODE_GUARD
  + interpretation-plan 블록 (챕터별)
  + sub-distribution 블록 (관계별 IIFE)
  + traits 블록 (cell framework, ch1만 풀 데이터)
  + relationshipTone + stageGuide
  + 챕터 prompt 본문 (chN-*.ts)
  + crossChapterBlock (이전 챕터 누적 토큰 안내)
```

ch8:
```
PARTNER_MODE_GUARD만 + ch8 prompt 본문
(SIPSEONG_STANDARD_DEFINITIONS · crossChapterBlock 제외 — "한자 금지" 룰과 모순)
```

## V2 핵심 원칙 (v2-principles.ts)
1. 산문체 4단 (단정 → 사주 메커니즘 → 일상·관계 장면 → 부드러운 마무리)
2. 박스·번호·이모지·표·가상 대화 절대 금지
3. 사주 인자 직접 인용 의무 (일간·합·충·원진·강·약 오행·신살·대운 중 최소 3개)
4. 일반론·바넘 표현 절대 금지
5. "~에요" 어미
6. 점수·% 직접 인용 X, 단정 X — 가능성 어조

## 관계 분기 (5장~8장)
- 챕터 정체성 자체가 관계별. sub 제목·구성·톤 모두 다름.
- `relationshipTone(rel)` + `stageGuide(duration)`이 prompt에 자동 주입
- IIFE 기반 — `lib/inyeon/sub-distribution.ts`에서 관계별 plan 매핑

## 본능 sub (5장 / 6장 일부)
- 노골 묘사·19+ 콘텐츠 절대 금지
- 결·기운·온도·리듬·끌림 자연 비유 중심
- Gemini safety filter trip 가능성 — 깨지면 진단 로깅 (route.ts에 박혀있음)

## 진단 로깅
- `[inyeon ch{N}] start model=gemini-2.5-flash promptLen=...`
- non-2xx 시: `status·statusText·body 600자` 캡처해 stream에 `t:"err"` 푸시
- 200 OK인데 빈 응답: `finishReason·blockReason·safetyRatings` 캡처

## 알려진 결함 (개선 대상)
- ch8 마지막 편지에 A·B 혼동 가끔 (LLM 자체 오류)
- 본능 sub safety filter trip — 진단 로깅 박혀있지만 자주 재현 X
- 풀 phrase + 한자 토큰 직접 결합 어색

## 진행 로그
- 2026-05-14: 검수팀 prompt 의미 충돌 룰 14~17 추가
- 2026-05-13: hongsil 패턴 정합, cross-chapter usedTokens 인프라
- 2026-05-13: Phase 0 prompt 슬림화 (어휘 예시·매핑 표현 제거)
- 2026-05-07: 8 챕터 구조 정통화 (사용자 메모장 골든 소스)
