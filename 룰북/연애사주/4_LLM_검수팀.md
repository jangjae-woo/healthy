# 4. LLM 검수팀 — 결정론 가드 + judge + rewrite

## 역할
LLM 생성 직후 본문을 검수·보정. 결정론 regex 가드(빠름)와 LLM judge/rewrite(느림·정확) 두 단계.

## 주요 파일
- `lib/llm-output-guard.ts` — 모든 가드 통합
- `lib/name-guard.ts` — 이름 오타·중복 음절 보정 (route.ts에서 별도 호출)

## 호출 순서 (guardGeneratedText hongsil 분기)
1. **applyDeterministicRepair** — SOFT_REPLACEMENTS 적용
2. **applyHongsilLifestyleRepair** — hongsil 전용 비문·결핍 표현 치환
3. **stripPartnerHallucination** — "상대의 ○○ 기운" 환각 strip
4. **stripSipseongScoreLeakage** — 십성 원점수("비겁 5.6개") strip + SOFT_REPLACEMENTS_SCORE_VARIANTS
5. **stripChapter5Hanja** — chapter === "5"일 때만 한자 괄호 strip
6. **suppressRepeatedHongsilEvidence(text, usedTokens)** — cross-chapter 한자 토큰 카운트 (2회 허용, 3회째부터 풀 대명사 치환)
7. **judgeOutput** — LLM이 본문 재검수 (issue 리포트)
8. **rewriteOutput** — issue 있으면 LLM이 본문 재작성
9. rewrite 결과에 1~5번 가드 한 번 더 (이중 안전망). 6번은 카운트 누적 우회 위험으로 제외.

## 결정론 가드 (regex)
### HARD_BAN_PATTERNS
- "혼자 짊어" / "벽처럼 느[껴낄낀끼지꼈겠]" (활용형 포함) / "감정 ... 삭이" / "사랑을 못 하" / "관계가 무너" / "부족해서 보완" / "약해서 채워" / "반드시 헤어·무너·불행·실패" / 십성 원점수 (`(비겁|식상|...)\s*\d+\.\d`) / 동물 비유 / 자연 상징 직역

### SOFT_REPLACEMENTS (자동 치환)
- "신약(身弱)한 사주에 비겁(比劫)이 없어 혼자 모든 것을 짊어지려는 경향" → 협력형 표현
- "신약한 사주/구조/흐름" → "기운이 얇은 결"
- "관계의 모든 짐을/부담을 짊어" → "한쪽이 너무 많은 짐을 지"
- "관성이 부족한 경향" → "기준감이 천천히 단단해지는 결"
- "(십성) 기운을 보완" → "그 결을 관계 안에서 천천히 키워"
- "식상이 약한 편" → "표현이 천천히 풀리는 편"
- "(십성) 약하게 드러나기" → "그 결이 천천히 풀리는 편으로 드러나"
- "(십성) 다소 부족하기 때문" → "그 결이 천천히 단단해지기 때문"
- "(오행) 부족한 X의 기운" → "옅게 자리한 X의 결" (양반사주 톤)
- "(오행) 약한 X 기운" → "얇게 잡힌 X의 결"
- "감정을 삭이" → "감정을 한 번 정리하"
- "혼자 짊어" 활용형 → "혼자 많이 떠안"

### Cross-chapter 한자 카운터 (usedTokens Map)
- key = 정규화된 토큰 (예: "재성(財星)" — 한글 설명 빼고 한자만)
- value = 풀이 전체 등장 횟수
- character class에 포함된 한자: 甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極
- "내 매력은?" sub은 등록 모드 (sub 내 다중 등장 1회로 압축)
- 그 외 sub은 등장마다 카운트. count ≤ 2 그대로, count ≥ 3 풀 대명사로 치환
- 풀 (`poolForHanja` / `poolForKorean`):
  - 일간/일주 → ["중심 기운", "본인 결", "타고난 결"]
  - 일지/월지/배우자궁 → ["관계의 자리", "마음 안쪽의 자리", "내면의 자리"]
  - 대운/세운 → ["시기 흐름", "운의 흐름", "그 시기"]
  - 십성 → ["그 결", "앞서 본 결", "그 흐름"]
  - 신살 → ["타고난 신살", "그 신살의 결", "앞서 본 신살"]
  - 신강신약·용신류 → ["그 결의 흐름", "사주의 결", "그 균형"]

### 5장 한자 strip (chapter === "5")
- 한자 괄호 모두 strip ("갑목(甲木)" → "갑목")
- 한글 + 한글 설명 괄호도 strip ("정관(규칙과 책임감)" → "정관")
- 5장 prompt 본문 "전문용어 금지" 강제

## judgeOutput (LLM 검수)
- Gemini로 본문에 의미 중복 / 결핍 낙인 / 사주 인자 반복 / 환각 등 detect
- output: `{ pass: bool, issues: [{type, sentence, reason}] }`
- findStyleIssues가 자연 비유 패턴 detect해 issue 추가

## rewriteOutput (LLM 재작성)
- 본문 + issue 리스트 받아 본문 재작성
- 절대 룰:
  - 마크다운 제목·섹션 순서·전체 분량·말투 유지
  - 새 사주 해석 추가 X
  - 원문 정보량 유지하되 반복 근거명·반복 의미 병합
  - 1.1, 2.2 같은 원점수 제거
  - 동물·자연 상징 직역 → 행동·반응·관찰력·말투·속도 언어
- **캐릭터 이름 보존 절대 룰** (2026-05-13 추가)
  - 12 캐릭터 이름(상철상·정숙상·옥순상…) strip 금지
  - ch1 첫 문장 / ch3 짝꿍 첫 문장 / ch6 편지 마무리 캐릭터 노출 보존

## 알려진 결함
- **rewrite prompt 안내문이 본문에 새어듦** (완성본6 L116·L123: "바로 말하기보다 정리 후 전하는 편")
  → rewrite prompt L647의 예시 표현이 LLM에 의해 본문에 박힘. 추가 추상화 필요.
- 변형 결핍 표현 일부 우회 ("약한 자리로 드러나기" 등)
- 풀 대명사 본문 박힘 ("관계의 자리이" 조사 결함 등) — prompt 노출 줄였지만 가드 치환 자체가 본문에 남음
