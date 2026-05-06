@AGENTS.md

## 사용자 맥락 (brain 위키) ⭐
세션 시작 시 다음을 먼저 읽어 사용자·프로젝트 맥락 확보:
- `C:\Users\new\Documents\peanut\wiki\me\identity.md` — 장재우 정체성
- `C:\Users\new\Documents\peanut\wiki\me\working-style.md` — 일하는 방식
- `C:\Users\new\Documents\peanut\wiki\me\principles.md` — 근본 원칙 ("계산 먼저, 해석은 Claude" 포함)
- `C:\Users\new\Documents\peanut\wiki\프로젝트\사주\README.md` — 이 프로젝트 허브

세션 끝낼 때 "종료할게 정리해줘" 트리거 인식 — brain CLAUDE.md의 "종료 정리" 워크플로우 수행.

> **다른 컴퓨터에서 클론받아 작업하는 Claude에게**: 위 brain 위키 경로는 장재우 본인 PC 전용이라 너 환경엔 없음. 무시하고 아래 V2 가이드부터 읽어.

---

## V2 프롬프트 2차 수정 가이드 ⭐

이 레포는 **V2가 정본**이다. V1과 V2가 같은 lib 폴더에 공존하므로 **반드시 -v2 접미사 또는 inyeon 폴더 안의 파일만** 수정한다.

### V2 정본 파일 (수정 대상)

**인연궁합 V2 — `/inyeon` 라우트**
- `lib/inyeon/prompts/ch1-basic.ts` ~ `ch8-final-letter.ts` (8개 챕터 프롬프트)
- `lib/inyeon/prompts/shared-context.ts` (공용 컨텍스트)
- `lib/inyeon/build-context.ts` / `scoring.ts` / `types.ts`
- `app/api/inyeon-generate/route.ts` (스트리밍 API)
- `app/inyeon/` (페이지·결과 UI)
- `components/inyeon/` (UI 컴포넌트)

**자도인 V2 — `/parent-child-v2` 라우트 (38슬라이드 7장)**
- `lib/parent-child-charts-v2.ts`
- `lib/parent-child-compat-v2.ts`
- `lib/parent-child-observation-v2.ts`
- `lib/parent-child-traits-v2.ts`
- `app/api/generate/route.ts` (V2 분기 포함)
- `app/parent-child-v2/` (페이지·결과 UI)

### 봉인 영역 (절대 수정 금지)
- `lib/parent-child-charts.ts`, `parent-child-compat.ts`, `parent-child-observation.ts`, `parent-child-traits.ts` — V1 자도인 (production 운영 중)
- `lib/saju-calculator.ts` 등 계산 로직 — 손대면 V1·V2 둘 다 깨짐
- `app/parent-child/` (V1 라우트)
- `app/zh-TW/`, `app/api/generate-tw/`, `lib/*-tw.ts` — 대만판 분리 자산

V2가 production에서 숨김 + preview 배포에서만 노출되는 상태(`process.env.VERCEL_ENV !== "production"` 분기). 이 분기 로직 건드리지 말 것.

### 핵심 원칙
**"계산 먼저, 해석은 Claude에게"** — 사주 계산 로직(`saju-calculator.ts` 등)은 결정론적, 프롬프트는 LLM에게 위임. 차트값 사전계산 → AI 프롬프트 주입 → 텍스트-차트 일치성 강제.

### 운영
- 개발: `npm install && npm run dev -- --port 3456` → http://localhost:3456
- preview 배포: `npx vercel --yes`
- prod 배포: `npx vercel --prod --yes` — **사용자(장재우) 명시 승인 후에만**
- API 키: `.env.local` 필요 (별도 전달)

### Vercel 함수 한도
Hobby 플랜 60초 캡. `maxDuration = 300` 선언해도 자동 60초로 캡됨. 인연궁합·자도인 V2는 스트리밍이라 60초 안에 첫 청크 시작되면 OK.

### LLM 호출 안전망 (참고)
대만판 `app/api/generate-tw/route.ts` 에 5중 방어 헬퍼(`fetchGeminiWithRetry`, `consumeGeminiStream`) 적용 완료. 한국 라우트(`generate`, `inyeon-generate`)는 동일 패턴 미적용 — 사용자 결정 대기 중.
