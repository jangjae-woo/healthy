# 4. LLM 검수팀 — 결정론 가드 + judge/rewrite + cross-chapter

## 역할
LLM 생성 직후 본문 검수·보정. 결정론 regex 가드(빠름) + LLM judge/rewrite(느림·정확) 2단계 + cross-chapter usedTokens + 헤더 안전망.

## 주요 파일
- `lib/llm-output-guard.ts` — 모든 가드 통합 (saju 분기 신규, 2026-05-13)

## 호출 순서 (saju 분기, route.ts L4350~ readable 안)
1. `applyHongsilLifestyleRepair` — 결핍 변형·비문 치환
2. `stripPartnerHallucination` — "상대의 ○○" 환각 (단독 풀이라 강하게 적용)
3. `stripSipseongScoreLeakage` — 십성 원점수 strip
4. `suppressRepeatedHongsilEvidence(text, input.usedTokens)` — Cross-chapter 한자 토큰 풀 대명사 치환 (preamble 보존 fix)
5. `stripUserNameSangSuffix` — 사용자 이름+"상" → "님" (CHARACTER_NAMES 제외, 묵도인은 캐릭터 아님)
6. `judgeOutput` + `rewriteOutput` (모든 섹션) — 헤더 보존 절대 룰
7. rewrite 후 결정론 가드 한 번 더 (이중 안전망)

## Cross-chapter usedTokens Map
- 서버: `data.usedTokens` 받아 Map 생성 → 가드 mutate → 직렬화해서 `tk` 이벤트 push
- 클라이언트(`SajuSlideResult.tsx`): `usedTokensRef` closure 변수 누적, 매 섹션 fetch body 포함

## 헤더 안전망 (각 섹션 expected ### sub 개수)
- `SAJU_SECTION_EXPECTED_SUBS` 매핑 (personality1: 5, personality2: 4 등)
- count < expected 시 진단 + `### 다음 풀이에 이어집니다 (N/M)\n(일부 소제목이 누락되어 다음 풀이에 이어집니다.)` placeholder
- 평생사주는 LIFETIME/SAJU_PROMPTS 두 set이 다른 sub 제목 사용 → 정확 sub 매칭 어려움 → count 기반 안전망

## 진단 로깅
- `[saju/${section}] output guard ${pass|repaired} pre-len=... post-len=...`
- `[saju/${section} diag] sub-count=N/M ✓` / `MISSING SUBS — expected=M actual=N`

## REPETITION_TONE_GUIDE
rewriteOutput prompt L752 조건에 saju 포함.

## opener 섹션 가드 비활성
- `useSajuGuard = type === 'saju' && section !== 'opener' && sajuAnalysis`
- opener는 짧은 2문장이라 가드 거치지 않음 (옛 청크별 stream 유지, UX 효과)

## 진행 로그
(작업 시 기록)
