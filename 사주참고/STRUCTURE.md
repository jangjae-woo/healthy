# 프로젝트 구조

## 📁 디렉토리 트리

```
사주 개발개발/
├── README.md                                   # 프로젝트 상위 개요
├── package.json                                # 의존성 정의
├── package-lock.json                           # 의존성 잠금
├── tsconfig.json                               # TypeScript 설정 (@/* 경로 매핑)
├── next.config.mjs                             # Next.js 설정
├── next-env.d.ts                               # Next.js 타입 선언 (자동 생성)
├── 대화로그.md                                  # 초기 개발 대화 로그
├── 인싸이트. Insight of psychology, INPSYT.pdf  # STS 기질검사 참고 PDF
│
├── .claude/
│   └── launch.json                             # Claude Preview 실행 설정 (선택)
│
├── docs/                                       # 📚 문서 (이 폴더)
│   ├── SETUP.md                                # 마이그레이션·셋업
│   ├── STRUCTURE.md                            # 파일 구조 (이 파일)
│   ├── DESIGN.md                               # 콘텐츠 설계
│   ├── DECISIONS.md                            # 의사결정 연대기
│   └── ROADMAP.md                              # 진행 현황
│
├── app/                                        # 🌐 Next.js App Router
│   ├── layout.tsx                              # 루트 레이아웃 (lang=ko)
│   ├── page.tsx                                # 메인 페이지 (탭 + 결과 컴포넌트 전체)
│   ├── globals.css                             # 전역 스타일 (모든 컴포넌트 CSS)
│   └── api/
│       ├── generate/route.ts                   # 사주풀이 API (단일)
│       └── compatibility/route.ts              # 부모-자녀 궁합 API
│
└── lib/                                        # 🔧 핵심 라이브러리 (재사용 모듈)
    ├── saju-calculator.ts                      # 사주 엔진 (계산·합·충·신살·신강·궁합)
    ├── animal-data.ts                          # 일간×신강신약 → 20동물 매핑 + 트레이트
    ├── animal-icons.tsx                        # 손그린 SVG 동물 컴포넌트 20개
    ├── radar-charts.tsx                        # 오행 펜타곤 + 십성 데카곤
    ├── age-categories.ts                       # 만 나이 자동 매칭 (8단계)
    ├── trait-cards.ts                          # 강점·주의점 카드 도출 로직
    ├── heart-analysis.ts                       # PART 2 9페이지 사주 도출 함수
    └── heart-visualizations.tsx                # PART 2 9개 비주얼 컴포넌트 (잡지 레이아웃)
```

---

## 📦 모듈 의존성 다이어그램

```
                    ┌──────────────────┐
                    │  app/page.tsx    │
                    │  (UI 메인)       │
                    └─────┬─────┬──────┘
                          │     │
              ┌───────────┘     └───────────┐
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ app/api/generate │          │ app/api/         │
    │   /route.ts      │          │ compatibility    │
    │                  │          │   /route.ts      │
    └──────┬───────────┘          └──────┬───────────┘
           │                             │
           └─────────┬───────────────────┘
                     ▼
           ┌─────────────────────┐
           │ lib/saju-calculator │  ← 코어 (다른 모듈이 의존)
           └─────────┬───────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        ▼            ▼            ▼             ▼
   animal-data   trait-cards  radar-charts  heart-analysis
   animal-icons                              heart-visualizations
                                             age-categories
```

---

## 📜 파일별 역할 상세

### 🔧 `lib/saju-calculator.ts` — 사주 엔진 (가장 중요)
- **상수**: 천간(10) · 지지(12) · 한자 매핑 · 오행 매핑 · 음양 · 60갑자
- **계산 함수**:
  - `calcYearPillar(year, month, day)` — 연주 (입춘 보정)
  - `calcMonthPillar(...)` — 월주 (절기 기반)
  - `calcDayPillar(...)` — 일주 (JDN 기반, 2000-01-01 戊午 기준)
  - `calcHourPillar(dayStem, h, m)` — 시주
  - `calcElements(stems, branches)` — 오행 분포 (지장간·합·충 가중치)
  - `calcDaeun(...)` — 대운 8개
  - `calcSinsal(...)` — 신살 17종
  - `getYongsin(ilgan, elements)` — 용신
  - `calcSinkang(ilgan, elements)` — 신강·신약 점수
  - `calcCompatibility(a, b)` — 두 사주 궁합 (점수·관계·강점/약점)
  - `getSipseong(ilgan, target, isBranch)` — 십성 변환

- **타입**: `SajuAnalysis`, `CompatibilityResult`, `SinkangResult`, `Elements`, `DaeunResult` 등

> 외부 라이브러리 의존성 0. 완전 자급자족.

---

### 🐯 `lib/animal-data.ts` — 동물 매핑
- `ANIMAL_MAP[일간][신강|신약]` → `AnimalProfile`
- 10일간 × 신강/신약 = 20동물:
  - 갑/신강 → 호랑이, 갑/신약 → 사슴
  - 을/신강 → 공작, 을/신약 → 토끼
  - ... (총 20)
- 각 프로필: `name`, `hanja`, `tagline`, `element`, `primary/secondary/accent` 색
- `ILGAN_TRAITS[일간]` — 일간별 ■ traits 5개씩
- `STRENGTH_CAUTIONS / STRENGTH_TIPS` — 신강·신약별 양육 주의점·팁

---

### 🎨 `lib/animal-icons.tsx` — SVG 일러스트
- 20개 동물 컴포넌트 (`TigerIcon`, `DeerIcon`, ...)
- 손으로 그린 미니멀 스타일 (~30 SVG path/circle/polygon per 동물)
- `<AnimalIcon animal="tiger" primary="..." />` 디스패처

---

### 📊 `lib/radar-charts.tsx` — 레이더 차트
- `<ElementRadar elements={...} />` — 오행 5각형 (40% 가득참 정규화)
- `<SipseongRadar sipseong={...} />` — 십성 10각형 (자동 카운트)
- 둘 다 SVG 기반, 외부 차트 라이브러리 의존성 없음

---

### 👶 `lib/age-categories.ts` — 연령 자동 매칭
- 만 나이 계산: `calcKoreanAge(year, month, day)` → `{ years, months, totalMonths, formatted }`
- 8개 카테고리: 영아 미만(0–11개월) / 영아 / 유아 / 초저 / 초고 / 중 / 고 / 성인
- 각 카테고리: `developmentalFocus`, `primaryKeywords`, `parentingPriorities`, `reportToneInstruction` (AI 프롬프트 주입용)
- 전환 임박 안내 (`monthsUntilNextCategory`, `showTransitionNotice`)

---

### 🎴 `lib/trait-cards.ts` — 강점·주의점 카드
- `deriveTraits(saju)` → `Trait[]`
- 도출 규칙:
  - 강한 오행 (≥22%) 상위 2개 → ✅ 강점
  - 강한 십성 (2회 이상) 상위 3개 → ✅ 강점 (3회+ 일부는 ⚠️ 주의로 전환)
  - 약한 오행 (<10%) 하위 2개 → ⚠️ 주의
- 최대 6장, AI 호출 없이 결정적

---

### 💗 `lib/heart-analysis.ts` — PART 2 도출 함수
9개 함수, 각각 사주 데이터에서 PART 2의 페이지별 데이터 도출:

| 함수 | 출력 | 페이지 |
|---|---|---|
| `calcExtroversion(saju)` | 외향/내향 % + 이유 | p1 |
| `calc9Dimensions(saju)` | 토마스-체스 9차원 점수 | p2 |
| `calc6Behaviors(saju)` | 6 행동 결 점수 (0-100) | p3 |
| `calcLikesDislikes(saju)` | 끌리는/답답한 결 카드 | p4 |
| `calcEmotionExpression(saju)` | 4감정 표출 강도 | p5 |
| `calcStressSignals(saju)` | 5개 스트레스 신호 | p6 |
| `calcRecoveryRecipe(saju)` | 회복 처방 (즉효/일상/회피) | p7 |
| `calcStableEnvironment(saju)` | 4채널 (공간·빛·소리·리듬) 필요도 | p8 |
| `calcSelfEsteemCore(saju)` | 코어 + 보호/위협 요인 | p9 |

---

### 🎨 `lib/heart-visualizations.tsx` — PART 2 비주얼
9개 페이지 컴포넌트 + `<HeartSection saju={saju} />` 통합 래퍼.

각 페이지 구조:
```
1. <Lead>      도입 단락 (1-3문장)
2. [비주얼]    페이지마다 다른 시각화
3. <Insight>  데이터 기반 인사이트 (2단락)
```

---

### 🌐 `app/page.tsx` — UI 메인
주요 컴포넌트 (한 파일에 모음):

| 컴포넌트 | 역할 |
|---|---|
| `Page` | 최상위 — 탭 + API키 카드 |
| `SajuTab` | 사주풀이 탭 (단일) |
| `CompatTab` | 궁합 탭 (부모-자녀) |
| `SajuResultView` | 사주 결과 화면 |
| `CompatResultView` | 궁합 결과 화면 |
| `AnimalCard` | 동물 카드 (full / compact) |
| `TraitGrid` | 강점·주의점 카드 그리드 |
| `AgeBadge` | 연령 카테고리 뱃지 |
| `PillarRow` | 4기둥 카드 |
| `ElementsBar` | 오행 막대 (이전 버전, 사용 안 함) |
| `LoadingCard`, `PersonForm` | 보조 UI |

`renderMarkdown()` — AI 응답 마크다운 → HTML 변환 (h1·h2·h3·blockquote·list 지원).

---

### 🔌 API Routes

#### `app/api/generate/route.ts` (POST /api/generate)
**입력**: `{ name, year, month, day, hour, gender, apiKey }`
**처리**:
1. 사주 계산 (`computeFullSaju`)
2. 연령 매칭 (`computeAgeResult`)
3. 컨텍스트 빌드 (`buildCtx` — 사주 4기둥·오행%·십성·대운·신살·합충형)
4. 프롬프트 생성 (`buildPrompt` — 7섹션 구조 + 연령 지침)
5. Gemini 호출 (`callGemini` — 사용자 키)
**출력**: `{ saju, ageResult, context, interpretation }`

#### `app/api/compatibility/route.ts` (POST /api/compatibility)
**입력**: `{ personA, personB, apiKey }`
**처리**:
1. 두 사주 각각 계산
2. 양쪽 연령 매칭
3. `calcCompatibility(a, b)` — 점수·관계·강약점
4. 자녀 사주 풍부 요약 + 부모 사주 풍부 요약
5. 12장 + 가족 인연의 결 + 연령 맞춤 프롬프트 (`buildCompatPrompt`)
6. Gemini 호출 (max 16384 tokens)
**출력**: `{ aSaju, bSaju, compat, childAge, parentAge, interpretation }`

---

## 🌊 데이터 흐름 (사주풀이 예시)

```
[사용자]
  └ 폼 입력: 이름·생년월일·성별·시간 + API키
       │
       ▼
[브라우저 fetch POST /api/generate]
       │
       ▼
[server: route.ts]
  1. computeFullSaju() → SajuAnalysis
       └ calcYearPillar / calcMonthPillar / calcDayPillar / calcHourPillar
       └ getSipseong / calcElements / calcSinsal / calcDaeun / calcSinkang
  2. computeAgeResult() → AgeResult (8 카테고리 매칭)
  3. buildCtx() → 사주 컨텍스트 텍스트
  4. buildPrompt() → 7섹션 + 연령 지침 결합
  5. callGemini() → AI 해석 텍스트
       │
       ▼
[response: { saju, ageResult, context, interpretation }]
       │
       ▼
[browser: setResult() → SajuResultView]
  - <AgeBadge>
  - <AnimalCard saju={saju} />          (lib/animal-data + lib/animal-icons)
  - <TraitGrid saju={saju} />            (lib/trait-cards)
  - <HeartSection saju={saju} />         (lib/heart-analysis + lib/heart-visualizations)
  - <PillarRow>, 대운, 신살
  - <renderMarkdown> AI 해석 본문
```

---

## 🔑 핵심 디자인 원칙

1. **외부 사주 라이브러리 0** — 모든 계산 자체 구현 (`saju-calculator.ts`)
2. **AI 호출 결과는 본문에만** — 비주얼 카드/차트 데이터는 모두 결정적 도출 (재현 가능)
3. **프롬프트 = 코드** — AI 출력 품질이 곧 코드 품질. 프롬프트는 [`route.ts`](../app/api/compatibility/route.ts) 의 `buildCompatPrompt`/`buildPrompt`에 정확히 정의
4. **컴포넌트 단위 자급자족** — 각 `lib/*` 모듈은 독립 모듈. 운영 사이트 옮기기 쉽게
5. **사용자 키 기반** — 서버에 API 키 저장 X, 사용자가 매 호출 시 입력
