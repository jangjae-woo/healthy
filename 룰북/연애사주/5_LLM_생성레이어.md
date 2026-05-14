# 5. LLM 생성 레이어 — Gemini 호출

## 역할
해석 기획·캐릭터 매핑·prompt 룰북 모두 합쳐 Gemini에 보내고 본문 스트리밍 받음.

## 주요 파일
- `app/api/hongsil-generate/route.ts` — 6 챕터 순차 생성 + 진단 로깅
- `lib/saju-system-instruction.ts` — SAJU_SYSTEM_INSTRUCTION
- `lib/hongsil/prompts/v5-report.ts` — V5 챕터별 prompt 생성기
- `lib/hongsil/prompts/v2-principles.ts` — V2 원칙 (V5에서도 일부 재사용)
- `lib/hongsil/prompts/shared-context.ts` — 입력 선택지 → 프롬프트 컨텍스트

## 모델·설정
- 모델: `gemini-2.5-flash`
- 호출: `streamGenerateContent?alt=sse`
- `thinkingBudget: 0` (사고 단계 없이 빠른 생성)
- `maxOutputTokens: 8192`
- 챕터 1~6 순차 생성. `phase=ch1` 등으로 단일 챕터만 생성 모드도 있음.

## prompt 조립 순서 (build-context.ts L259~)
ch1~ch5:
```
_common (SIPSEONG_STANDARD_DEFINITIONS + SOLO_MODE_GUARD)
  + _planBlock(ch)              (interpretation-plan.ts)
  + _dist(ch)                   (sub-distribution.ts)
  + _block(ch)                  (traits-block.ts — ch1만 풀 데이터)
  + _chN ChartFacts             (시각 카드 사실 강제)
  + chN prompt 본문             (v5-report.ts buildHongsilChapterNPromptV5)
  + crossChapterBlock           (route.ts에서 추가 — 이전 챕터 누적 토큰 안내)
```

ch6:
```
_ch6Common (SOLO_MODE_GUARD만)
  + _planBlock + _dist + _block + _ch6ChartFacts + ch6 prompt 본문
  (crossChapterBlock 제외)
```

→ ch6는 "한자 금지" 룰과 한자 정의 블록의 모순을 피하기 위해 _common·crossChapter 둘 다 제외 (2026-05-13 ch6 빈 응답 사건 후 적용).

## Cross-chapter 누적
- route.ts에서 `usedTokens = new Map<string, number>()` 선언
- 챕터마다 prompt 추가 + guardGeneratedText 호출 시 같은 Map 인스턴스 전달
- 가드가 mutate → 다음 챕터 호출 시 누적 데이터 사용

## 진단 로깅
- ch6 generated.length === 0 시 `console.error('[hongsil ch6] EMPTY RESPONSE ...')` 캡처
- result.ok / reason / prompt 길이 vercel logs로 확인 가능

## V5 챕터 prompt 구조
모든 챕터 공통:
- 첫 줄: 챕터 톤 ("당신은 홍도인입니다 ...")
- 입력 선택지 컨텍스트 (Q1 솔로 기간 / Q2 원하는 사랑 / Q3 스타일)
- dataBlock (사주 데이터)
- v5Principles (V5 출력 원칙)
- 챕터 헤더 (## 1장 — 내 사주를 알고...)
- sub별 지시 (### sub 이름 + 페이지 타입 + 구조)
- finalCheck (출력 직전 체크)

## V5 핵심 원칙 (v5-report.ts L31~85 v5Principles)
1. 근거 제시 공식 — "감각적 결론 → 한문 사주 근거 → 자리 설명 → 쉬운 번역 → 연애 장면 → 이면"
2. 전문용어 노출 단계 — ch1 매력은? 풀 노출, ch1 후속 1~2개, ch2~3 1~2개, ch4~6 거의 0
3. 초보자 친절함 — 어려운 단어는 같은 문단에 쉬운 뜻
4. 중복 회피 — "내 매력은?" 이후 같은 한문 재출력 금지. 의미 풀이 일상 문장으로
5. 문장 품질 — "~에요" 어미, "다만" 남발 금지, 동물 비유 금지
6. 개인화 — ${name}님 호칭, 일반론 금지
7. 형식 — ### 헤더 보존, 5~6단락, 430~680자, [[강조]] sub당 1~2회

## 알려진 결함 (개선 대상)
- ch2 "솔로 탈출 가이드" — 사주 처방(약한 오행 → 행동·장소) 미명시 → 일반 가이드로 폴백
- ch2 "올해 연애 흐름" — "전문용어 금지" 강제로 사주 인자 못 박음 → 일반 조언으로 폴백
- 사용자 요청: 사주 기반 개운법(改運法) 처방 도입 필요
