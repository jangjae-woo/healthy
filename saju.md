# 사주 프로젝트 개발 문서

> 최종 업데이트: 2026-04-15  
> 프로젝트: yangban.ai 수준 유료 사주 서비스  
> 로컬 주소: http://localhost:3456

---

## 1. 프로젝트 개요

- 명리학 AI 풀이 서비스 (평생사주 / 신년운세 / 연애사주 / 정통관상)
- **현재 집중 개발 대상: 평생사주만**
- 나머지 3개(신년운세/연애사주/관상)는 추후 개발 예정
- AI 캐릭터: **묵도인** (명리학 임상 경험 30년의 대가) ← ~~운학선인에서 변경~~

---

## 2. 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| AI | Google Gemini 2.5 Flash API (SSE 스트리밍) |
| 만세력 계산 | `manseryeok` npm 패키지 + `lib/saju-calculator.ts` |
| 배포 | Vercel |

---

## 3. 주요 파일 구조

```
saju/
├── app/
│   ├── api/generate/route.ts       ← AI 프롬프트 + 만세력 계산 API
│   ├── saju/
│   │   ├── page.tsx                ← 서비스 랜딩페이지
│   │   ├── form/page.tsx           ← 채팅형 정보입력 폼 (묵도인 채팅)
│   │   └── result/page.tsx         ← 결과 페이지 (SajuSlideResult 래핑)
│   └── globals.css                 ← 전역 스타일 + 슬라이드 애니메이션
├── components/
│   └── SajuSlideResult.tsx         ← 핵심 슬라이드 결과 컴포넌트
├── lib/
│   └── saju-calculator.ts          ← 십성/대운/신살/오행/용신 계산 함수
└── .env.local                      ← GOOGLE_API_KEY 등
```

---

## 4. 슬라이드 구조 (현재 기준)

### 무료 슬라이드 (0~11, 총 12개)

| 슬라이드 | 내용 |
|----------|------|
| 0 | 커버 (이름/생년월일 표시) |
| 1 | **묵도인의 첫마디** (AI opener — 첫 로드 시 fetch) |
| 2 | 사주원국 (四柱原局) 표 |
| 3 | 일간 소개 (甲~癸 특성) |
| 4 | 오행 분포 (막대그래프) |
| 5 | 에너지 총량 (신약/신강 판별) |
| 6 | 내 기둥 (연주/월주/일주/시주) |
| 7 | 십성 배치도 (막대그래프) |
| 8 | 신살 지도 |
| 9 | 대운 타임라인 |
| 10 | 세운 타임라인 (2026~2030) |
| 11 | 풀이 목차 (FREE_END) |

### 결제 슬라이드

| 슬라이드 | 내용 |
|----------|------|
| 12 | 전화번호 입력 → 잠금 해제 (PAYWALL) |

### AI 풀이 슬라이드 (13~25, 총 13개 섹션)

> 각 슬라이드는 AI 응답 길이에 따라 **자동으로 여러 페이지로 분할됨** (~320자/페이지)

| 슬라이드 | AI 키 | 섹션 |
|----------|--------|------|
| 13 | personality1 | 🪞 나라는 사람 (1) |
| 14 | personality2 | 나라는 사람 (2) |
| 15 | money1 | 💰 돈과 일 (1) |
| 16 | money2 | 돈과 일 (2) |
| 17 | love1 | 🤝 사람과 사랑 (1) |
| 18 | love2 | 사람과 사랑 (2) |
| 19 | love3 | 사람과 사랑 (3) |
| 20 | health | 🌿 몸과 마음 |
| 21 | hidden | ✨ 숨겨진 카드 |
| 22 | timeline1 | 🌊 흐르는 시간 (1) |
| 23 | timeline2 | 흐르는 시간 (2) |
| 24 | compass | 🧭 나침반 |
| 25 | closing | 🌙 결 |

### Q&A 슬라이드 (신규 추가)

| 슬라이드 | 내용 |
|----------|------|
| 26 | **묵도인에게 질문하기** — 첫 질문 무료, 추가 질문 1,000원/건 |

### 마지막 슬라이드

| 슬라이드 | 내용 |
|----------|------|
| 27 | 마무리 인용구 + PDF 다운로드 + 처음으로 버튼 |

**총 슬라이드 수: 28개 (0~27)**  
**실제 페이지 수 (AI 페이지 분할 포함): 약 50~60페이지**

---

## 5. 상수 (SajuSlideResult.tsx)

```typescript
const FREE_END  = 11;   // 마지막 무료 슬라이드
const PAYWALL   = 12;   // 결제 슬라이드
const AI_START  = 13;   // 첫 AI 풀이 슬라이드
const TOTAL     = 28;   // 전체 슬라이드 수 (0~27)
```

---

## 6. Q&A 슬라이드 구조 (슬라이드 26)

### 상태 변수

```typescript
const [qaInput, setQaInput]           = useState('');
const [qaLoading, setQaLoading]       = useState(false);
const [qaHistory, setQaHistory]       = useState<{q:string;a:string}[]>([]);
const [questionCount, setQuestionCount] = useState(0);
const [pendingQ, setPendingQ]         = useState('');
const [qaPayPhone, setQaPayPhone]     = useState('');
const [qaPayState, setQaPayState]     = useState<'none'|'input'|'paying'>('none');
const [qaPayProgress, setQaPayProgress] = useState(0);
```

### 동작 흐름

```
첫 질문 → 무료 → fetchQA() → 답변 스트리밍
추가 질문 → qaPayState='input' (전화번호 입력)
         → qaPayState='paying' (3초 진행바 애니메이션)
         → fetchQA() → 답변 스트리밍
```

### API 섹션 키

```typescript
qa: (d, ctx) => `${buildHeader(d, ctx)}
[풀이 요청 — 개인 질문 답변]
내담자가 아래 질문을 드렸습니다:
"${d.question}"
...한국어 경어체.`
```

- maxTokens: 600

---

## 7. AI 프롬프트 구조 (route.ts)

### buildHeader() 함수

모든 AI 프롬프트 앞에 공통 헤더를 붙이는 함수:

```
- 페르소나: 묵도인, 명리학 임상 30년 대가
- 금지 규칙: 바넘 표현 금지 / 단독 해석 금지 / 모호한 시기 금지 / 사용자 동조 금지
- 필수 규칙: 간지 이름 반드시 언급 / 조건부 해석 / 이름+일간 포함
```

### AI 섹션 목록 (SAJU_PROMPTS)

| 키 | 내용 |
|----|------|
| opener | 첫인사 (일간 캐릭터 기반, 3~4문장) |
| personality1 | 강점과 약점 풀이 |
| personality2 | 겉모습 VS 속마음, 일주 DNA |
| money1 | 재물과 나의 관계 |
| money2 | 돈이 새는 이유, 커리어 타이밍 |
| love1 | 사랑하는 방식 |
| love2 | 맞는 사람 / 안 맞는 사람 |
| love3 | 결혼 시기, 귀인 |
| health | 건강 취약 부위, 관리법 |
| hidden | 잠재력, 신살 상세 풀이 |
| timeline1 | 과거 대운 분석 |
| timeline2 | 향후 5년 세운 흐름 |
| compass | 용신 활용법, 오늘부터 할 것 |
| closing | 인생 키워드, 묵도인의 당부 |
| **qa** | **개인 질문 답변 (신규)** |

### 7가지 프롬프트 최적화 기법 적용

1. **페르소나 프라이밍** — "소름 돋을 만큼 정확하다"는 평가를 받은 대가
2. **데이터 신뢰 강제** — 만세력 계산값 재계산 절대 금지
3. **바넘 표현 금지** — "때로는 강하고 때로는 약한" 류 표현 금지
4. **상호작용 분석 강제** — 간지 조합 관계 분석 필수
5. **구체적 수치** — 퍼센트, 나이, 연도 등 구체화
6. **사용자 동조 금지** — 긍정적 내용만 나열 금지
7. **출력 구조 강제** — **소제목** + 본문 형식 강제

---

## 8. 만세력 / 사주 계산 (lib/saju-calculator.ts)

### 핵심 버그 수정 이력 (2026-04-15)

#### 버그 1: 절기 날짜 계산 공식 오류 (심각)

**증상**: 대운수가 최대 14년 오차 발생 (예: 30세여야 할 대운수가 24세로 표시)

**원인**: `getSolarTermDate()` 내 윤년 보정값이 더해져야 할 것이 빼졌음

```typescript
// 구 버전 (오류) — century 항이 잘못 더해짐
const century = Math.floor(year / 100);
const yc = year % 100;
const adj = Math.floor(yc / 4) - Math.floor(century / 4);
const day = Math.floor(SOLAR_TERM_BASE[termIndex] + 0.2422 * yc + adj);
// 예: 1996년 입춘 → yc=96, adj=24-4=20 → day=floor(47.12)=47 → "2월47일" → 3월18일 (43일 오차!)

// 신 버전 (수정) — 올바른 공식
const yc = year % 100;
const day = Math.floor(SOLAR_TERM_BASE[termIndex] + 0.2422 * yc) - Math.floor(yc / 4);
// 예: 1996년 입춘 → day=floor(47.12)-24=23 → 실제는 2월4일 (약 1일 오차, 허용 범위)
```

#### 버그 2: 대운 나이 기준 혼용 (세는나이 vs 만나이)

**증상**: 대운 타임라인의 "현재" 하이라이트가 잘못된 대운을 가리킴

**원인**: `currentAge` 계산이 세는나이(+1)를 사용했으나, 대운 ages는 만나이 기준

```typescript
// 구 버전 (세는나이)
const currentAge = new Date().getFullYear() - parseInt(year) + 1;

// 신 버전 (만나이)
const _now = new Date();
const _bm = parseInt(month), _bd = parseInt(day);
const currentAge = _now.getFullYear() - parseInt(year) -
  (_now.getMonth() + 1 < _bm || (_now.getMonth() + 1 === _bm && _now.getDate() < _bd) ? 1 : 0);
```

### manseryeok 라이브러리 평가

- 버전: v1.0.1
- 연주/월주/일주/시주 간지 계산: **정확** (음력 변환 포함)
- 절기 날짜: 라이브러리가 아닌 `saju-calculator.ts`의 자체 공식 사용
- 한계: 절기 시각(時刻)까지는 계산 안 됨 → KASI 데이터 연동 시 완전 해소 가능 (현재 미구현)

---

## 9. 주요 컴포넌트 동작

### SajuSlideResult.tsx 핵심 로직

```
1. 페이지 진입 → opener fetch 시작 (백그라운드)
2. 슬라이드 0 (커버) 표시
3. 슬라이드 1: opener 로딩 중이면 스피너, 완료 시 타이핑 효과로 표시
4. 슬라이드 11 → "풀이 열기" 버튼
5. 슬라이드 12: 전화번호 입력 → 결제 시뮬레이션 → 잠금 해제
6. 잠금 해제 시: 나머지 13개 섹션 동시에 fetch 시작
7. 슬라이드 13~25: 각 AI 풀이 표시 (타이핑 효과)
8. 슬라이드 26: Q&A (첫 질문 무료, 추가 1,000원)
9. 슬라이드 27: PDF 다운로드 + 처음으로
```

### 페이지 자동 분할

```typescript
// AI 응답 도착 시 320자 기준으로 페이지 분할
splitIntoPages(content, 320) → string[]

// 네비게이션: 같은 섹션 내 페이지 → 다음 슬라이드 순서
goNext() → hasMorePages ? 다음 페이지 : 다음 슬라이드
goPrev() → curPgIdx > 0 ? 이전 페이지 : 이전 슬라이드
```

### 타이핑 효과

```typescript
// 1자/8ms = 125자/초
TypeWriter({ text }) → 한 글자씩 순차 렌더
```

### PDF 다운로드

- 새 창 열기 → HTML 생성 → Noto Sans KR 폰트 → `window.print()`
- 전체 AI 풀이 내용 포함 (섹션별 정리)

---

## 10. UI/UX 설계

### 레이아웃

- **모바일 우선**: `max-w-[430px] mx-auto` — PC에서도 폰 크기로 중앙 표시
- 배경: `#1a0a2e` → `#0d0019` 그라디언트 (다크 퍼플)
- 강조색: `#c9b4ff` (라벤더 퍼플)

### 슬라이드 애니메이션

```css
/* globals.css */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.slide-enter { animation: slideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both; }
```

- 슬라이드 변경 시 `key={slide}` → React 리마운트 → 애니메이션 자동 발동

### 채팅 폼 (form/page.tsx)

묵도인과의 5단계 채팅:
1. 이름 입력
2. 성별 선택
3. 생년월일 입력 (양력/음력 선택)
4. 시간 선택 (12지시 + 모름)
5. "사주 풀이 시작" 버튼

### 목차 (TOC)

우측 상단 "목차 ↓" 버튼 → 드롭다운  
미결제 섹션은 🔒 표시

---

## 11. 개발 히스토리 요약

| 단계 | 날짜 | 작업 내용 |
|------|------|-----------|
| 1 | - | yangban.ai 참고 → 53슬라이드 구조 파악 |
| 2 | - | SajuSlideResult.tsx 15슬라이드 → 35슬라이드 리라이트 |
| 3 | - | route.ts에 13개 AI 섹션 프롬프트 추가 |
| 4 | - | PDF 다운로드 기능 추가 |
| 5 | - | 7가지 프롬프트 최적화 기법 적용 |
| 6 | - | 모바일 너비 제한 (max-w-[430px]) 적용 |
| 7 | - | 슬라이드 전환 애니메이션 추가 |
| 8 | - | 슬라이드 순서 수정 (opener 먼저, 사주원국 두 번째) |
| 9 | - | 섹션 인트로 슬라이드 8개 제거 → 35개에서 27개로 축소 |
| 10 | - | 타이핑 효과 추가 (TypeWriter 컴포넌트) |
| 11 | - | AI 텍스트 320자 기준 자동 페이지 분할 |
| 12 | - | 타이핑 속도 3배 느리게 조정 (125자/초) |
| 13 | 2026-04-15 | **AI 캐릭터 운학선인 → 묵도인 전체 변경** |
| 14 | 2026-04-15 | **Q&A 슬라이드 추가 (26번, 첫 질문 무료 + 1,000원 추가)** |
| 15 | 2026-04-15 | **절기 날짜 공식 버그 수정 (최대 43일 → ~1일 오차로 개선)** |
| 16 | 2026-04-15 | **대운 나이 만나이 기준으로 수정** |

---

## 12. 남은 작업 (TODO)

### 높은 우선순위
- [ ] 실제 결제 연동 (카카오페이 / 토스페이) — Q&A 1,000원 포함
- [ ] Vercel 배포 최신화

### 중간 우선순위
- [ ] 과거 악운 훅 (기신운 추적 — 결제 전 강렬한 체험 유도)
- [ ] 궁합 서비스 개발

### 낮은 우선순위
- [ ] KASI 절기 시각 데이터 연동 (절기 ±1일 오차 완전 제거)
- [ ] 신년운세 완성
- [ ] 연애사주 완성
- [ ] 정통관상 완성

---

## 13. 환경 변수 (.env.local)

```
GOOGLE_API_KEY=...    ← Gemini 2.5 Flash API
```

---

## 14. 로컬 실행

```bash
cd C:\Users\new\Desktop\saju
npm run dev
# → http://localhost:3456
```
