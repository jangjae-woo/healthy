# 4. LLM 검수팀 — 결정론 가드 + judge/rewrite + cross-chapter

## 역할
LLM 생성 직후 본문 검수·보정. 결정론 regex 가드(빠름) + LLM judge/rewrite(느림·정확) 2단계 + cross-chapter usedTokens.

## 주요 파일
- `lib/llm-output-guard.ts` — 모든 가드 통합 (inyeon 분기 L820~)
- `lib/name-guard.ts` — 이름 오타·중복 음절 보정 (route.ts에서 별도 호출)

## 호출 순서 (inyeon 분기)
1. `applyDeterministicRepair` — SOFT_REPLACEMENTS 적용
2. `applyHongsilLifestyleRepair` — 결핍 변형·비문 치환 (hongsil과 공유)
3. `stripPartnerHallucination` — "당신의 배우자는 ○○ 기운" 류 한쪽 단정 strip
4. `stripSipseongScoreLeakage` — 십성 원점수("비겁 5.6개") strip
5. `suppressRepeatedHongsilEvidence(text, input.usedTokens)` — Cross-chapter 한자 토큰 풀 대명사 치환
   - preamble(첫 ### 헤더 이전) 보존 (2026-05-13 fix)
   - 토큰 해시 슬롯 매핑 (2026-05-14 G14): 같은 토큰은 항상 같은 phrase, 다른 토큰은 분산
6. `fixJosaAfterPronouns` — 풀 phrase 받침 조사 보정 (G5, 2026-05-14)
7. `stripPronounDuplication` — "그 기운 기운" 중복 strip
8. `stripBrokenQuotes` — 미완 인용구 strip
9. `forceSubHeaderNewlines` — ### 줄바꿈 강제
10. `stripUserNameSangSuffix` — 사용자 이름+"상" → "님" (CHARACTER_NAMES 제외)
11. ch8: judge/rewrite **비활성** + `normalizeCharacterName` + `strip2ndNaturalSimile` + 헤더 안전망
12. ch1~ch7: `judgeOutput` (LLM judge) → 이슈 있으면 `rewriteOutput` (LLM rewrite) → 1~10번 가드 한번 더

## Cross-chapter usedTokens Map
- 서버(`/api/inyeon-generate`): 라우트 안 stateful Map (8 챕터 순차 streaming, 단일 fetch)
- key = 정규화된 한자 토큰 (예: `재성(財星)`)
- value = 풀이 전체 등장 횟수
- 가드가 mutate → 다음 챕터 호출 시 saturatedTokens prompt 안내문 prepend (`crossChapterBlock`)
- ch1·ch8 제외 (ch8은 "한자 금지" 룰과 모순)

## judge prompt 룰 (2026-05-14 G14/G15 추가)
- 14. 의미 충돌 — 같은 phrase가 한 단락 안에서 정반대 의미로 쓰이면 FAIL
- 15. 일간 = 기신 모순 FAIL (본인 결이 기신이라는 표현)
- 16. 풀 대명사 모호 FAIL ("그 결 또한 없기에" 단독 도입)
- 17. 희신 = 기신 동치 FAIL (같은 오행을 채워줄+살펴줄 둘 다로)
- 1~13: hongsil과 공통 (결핍·환각·바넘·자연 상징 직역 등)

## ch8 헤더 안전망 (마지막 편지)
- expected 3 sub ("이렇게 만나주신 두 분께" / "두 분의 결, 잊지 마세요" / "마지막으로 드리는 한 마디")
- 누락 시 `### {sub}\n(다음 풀이에 이어집니다.)` 강제 추가
- judge/rewrite 비활성 — 짧고 시적이라 rewrite가 톤 망가뜨릴 위험

## 진단 로깅 (route.ts)
- `[inyeon ch{N}] guard ${changed ? "repaired" : "pass"} issues=${count} pre-len=${X} post-len=${Y}`
- ch8 진단: `head-150=...` / `MISSING HEADERS — ...` / `post-guard-length=...`
- `t: "err"` 이벤트 푸시 시: `finishReason` + `blockReason` + `chunks` 로깅

## 결정론 가드 — 변형 패턴 (Phase 1.5 fix, 2026-05-13)
- 결핍 변형: "신약한 사주/구조/흐름" → "기운이 얇은 결"
- 짊어 변형: `/혼자\s*[^.!?\n]{0,15}짊어/g` → "자기 리듬을 천천히 세우"
- 사용자 이름+"상" 자동 합성 차단 (CHARACTER_NAMES 제외)
- 오행 결핍 표현 → "옅게 자리한 X의 결" 양반사주 톤

## 알려진 결함
- A·B 혼동 (ch8에서 가끔 같은 사람 2번 묘사) — LLM 자체 오류, regex 잡기 어려움
- 풀 phrase + 한자 토큰 합성 어색 ("타고난 결 辛(신)") — G14 토큰 해시로 일부 해결, 본질 fix는 prompt 강화

## 진행 로그
- 2026-05-14: G14·G15 의미 충돌 fix + judge prompt 룰 14~17 추가
- 2026-05-13: hongsil 패턴 정합 (cross-chapter usedTokens, ch8 헤더 안전망, 진단 로깅)
- 2026-05-13: Phase 1.5 변형 패턴 가드 강화
