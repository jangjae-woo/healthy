# 4. LLM 검수팀 — 결정론 가드 + judge/rewrite + cross-chapter

## 역할
LLM 생성 직후 본문 검수·보정. 결정론 regex 가드(빠름) + LLM judge/rewrite(느림·정확) 2단계 + cross-chapter usedTokens. parent-child 분기는 outro만 rewrite 비활성.

## 주요 파일
- `lib/llm-output-guard.ts` — 모든 가드 통합 (parent-child 분기 L1045~)
- `lib/name-guard.ts` — 이름 오타·중복 음절 보정 (route.ts에서 별도)

## 호출 순서 (parent-child 분기)
1. `applyHongsilLifestyleRepair` — 결핍 변형·비문 치환
2. `stripPartnerHallucination` — 가족 호칭 약화된 환각 strip
3. `stripSipseongScoreLeakage` — 십성 원점수 strip
4. `stripChartScoreLeakage` — "도미넌트 70%" / "아침 시간대(45%)" 차트 수치 strip + G10 orphan % 보강
5. `suppressRepeatedHongsilEvidence(text, input.usedTokens)` — Cross-chapter 한자 토큰 풀 대명사 치환
   - preamble 보존 (2026-05-13 fix)
   - 토큰 해시 슬롯 매핑 (G14, 2026-05-14): 같은 토큰은 항상 같은 phrase, 다른 토큰은 분산
6. `fixJosaAfterPronouns` — G5 풀 phrase 받침 조사 보정 ("자리이"→"자리가")
7. `stripPronounDuplication` — "그 기운 기운" 중복 strip
8. `stripBrokenQuotes` — 미완 인용구 strip
9. `forceSubHeaderNewlines` — F1 줄 중간 ### 박힘 줄바꿈 강제
10. `stripAgeInappropriateWords(text, input.childAgeStage)` — F3 영유아 학령기 어휘 strip (연구자→자기 결로 빛나는 어른 회전, 발표→표현)
11. `fixChildHonorificCorruption` — G1 이름+상 → 이름+양/군 복원
12. `stripUserNameSangSuffix` — 사용자 이름+상 → 님
13. outro만: `strip2ndNaturalSimile` + 헤더 안전망 + judge/rewrite **비활성**
14. ch6: `strip2ndNaturalSimile` 추가 (자연 비유 2개 이상 시 1개만)
15. ch1~ch6: `judgeOutput` → 이슈 있으면 `rewriteOutput` → 1~12번 가드 한 번 더 (이중)

## Cross-chapter usedTokens Map
- V2 phase별 fetch 구조이므로 클라이언트가 누적
- 서버: `data.usedTokens`로 받아 Map 생성 → 가드 mutate → `t: "tk"` 이벤트 stream에 직렬화 push
- 클라이언트(`ParentChildSlideResultV2.tsx`): closure 변수 `usedTokens` 누적, 다음 phase fetch body 포함

## judge prompt 룰 (2026-05-14 G14/G15 추가)
- 14. 의미 충돌 — 같은 phrase가 한 단락 안에서 정반대 의미로 쓰이면 FAIL ("타고난 결의 기운이 강하게" + "타고난 결의 기운은 옅게")
- 15. 일간 = 기신 모순 FAIL ("본인 결은 ${자녀이름}의 기신이기도")
- 16. 풀 대명사 모호 FAIL ("그 결 또한 없기에" 단독 도입)
- 17. 희신 = 기신 동치 FAIL (같은 오행을 채워줄+살펴줄 둘 다로 묘사 — 222 케이스)
- 1~13: hongsil과 공통 (결핍·환각·바넘·자연 상징 직역 등)

## ch6 헤더 안전망
- hasMom·hasDad·trio 동적으로 expected 3 sub 결정
  - 두 분: "엄마와 통하는 결, 아빠와 통하는 결" / "셋이 함께 가장 편안한 순간" / "부모가 채워줄 결 / 살펴줄 결"
  - 한 분: "어머님(또는 아버님)과 통하는 결" 등 분기
- 누락 시 `### {sub}\n(다음 풀이에 이어집니다.)` 강제 추가

## outro 헤더·푸터 안전망
- `## 자도인의 마지막 당부` 누락 시 prepend
- `※ 본 풀이는 사주명리학을 ...` disclaimer 누락 시 append
- F2: 정확히 2~3 문장, 한 문장 50자 이내

## 진단 로깅 (route.ts)
- `[v2/${phase}] start model=gemini-2.5-flash promptLen=${len}`
- `[v2/${phase}] output guard ${changed ? "repaired" : "pass"} issues=${count} pre-len=${X} post-len=${Y}`
- `[pc ch6 diag] sub-hits=3/3 ✓` / `MISSING HEADERS — ...`
- `[pc outro diag] has-header=... has-footer=...`
- non-2xx: `status·statusText·body 600자` 캡처 → `t: "err"` 이벤트
- 빈 응답: `finishReason·blockReason·safetyRatings` 캡처

## 변형 패턴 가드 (Phase 1.5 이후)
- 결핍 변형: "신약한 사주/구조/흐름" → "기운이 얇은 결"
- 짊어 변형: `/혼자\s*[^.!?\n]{0,15}짊어/g` → "자기 리듬을 천천히 세우"
- 사용자 이름+"상" 자동 합성 (CHARACTER_NAMES 제외 — 자도인엔 없음)
- 오행 결핍 표현 → "옅게 자리한 X의 결" 양반사주 톤
- G5 토큰 깨짐: "을(乙)목" atomic 매치 + 받침 조사 보정 + F3 직업명 3-phrase 회전
- G14: poolForHanja/Korean에 토큰 해시 슬롯 매핑

## 알려진 결함 (개선 대상)
- 풀 phrase + 한자 토큰 직접 결합 ("타고난 결 辛(신)") — G14 일부 해결, 본질 fix는 prompt 강화
- G11 시나리오 미래형 미흡 (영유아에 "공부법/책상" 시나리오 본문 잔존) — prompt 룰만 50~70% 보장, 완전 차단은 LLM judge 영역
- A·B 혼동(ch6 부모-자녀 호칭) 가끔 — LLM 자체 오류

## 진행 로그
- 2026-05-14: G14 풀 phrase 충돌 + G15 시각화 정합 + 검수 룰 14~17 + G10 orphan % strip
- 2026-05-14: G5/G8 토큰 깨짐·동사어미 충돌 + F3 발표 정규식 fix + G13 sub 헤더 분기
- 2026-05-14: G1 이름 호칭 corruption 복원 + G6 미래형 강제 prompt
- 2026-05-13: hongsil 패턴 정합 + cross-chapter usedTokens 인프라 + ch6/outro 헤더 안전망
- 2026-05-13: rewriteOutput "마크다운 헤더 구조 보존 절대 룰" 추가
