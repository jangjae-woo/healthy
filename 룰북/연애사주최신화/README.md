# 연애사주최신화 — 옵션 B 적용 작업 메모

## 폴더 안 파일
- **0_구조변경_BEFORE_AFTER.md** — 6 레이어 → 새 7 레이어 비교
- **1_사주처방_매핑_초안.md** — 풍수 통설 기반 처방 매핑. **사용자 검토 필요**
- **2_prompt파일3개_설계.md** — solo-escape / yearly-flow / repetition-tone 설계
- **3_route_라우팅_설계.md** — 메인 + 구체화 호출 흐름

## 작업 진행 순서

1. **[지금] 사용자가 `1_사주처방_매핑_초안.md` 검토 → OK/수정 표시**
2. 매핑 확정 후 `lib/hongsil/yongsin-prescription.ts` helper 코드 작성
3. `lib/hongsil/prompts/refinement/` 폴더 생성 + 3 파일 작성
   - `solo-escape.ts`
   - `yearly-flow.ts`
   - `repetition-tone.ts`
4. `app/api/hongsil-generate/route.ts` 라우팅 수정 (메인 + 구체화 호출)
5. `lib/llm-output-guard.ts` rewriteOutput에 repetition-tone import
6. 빌드 → 프리뷰 배포
7. 사용자 테스트 → 완성본9 검수

## 의사결정 (확정된 것)
- 옵션 B (메인 + 구체화 prompt 분리) 채택
- 구체화 대상: ch2 솔로 탈출 가이드 + 올해 연애에서 조심할 흐름
- repetition-tone은 rewrite 단계에서만 LLM 노출
- 사주 처방 데이터는 결정론 helper로 미리 추출 → 구체화 LLM에 주입
- LLM 자유 작문(처방 데이터 외 처방 만들기) 금지 강제 룰

## 안전 장치
- 구체화 호출 실패 → fallback으로 메인 본문 사용
- 새 prompt에 한자 정의 + 한자 금지 같은 모순 룰 안 박음 (ch6 빈 응답 회피)
- 처방 데이터 매핑은 사용자 검토 후 박음

## 점수 추정
- 현재 (완성본8) = 86~91%
- 옵션 B 적용 후 = 91~94%
- 100% = LLM 확률성으로 원리적 불가
