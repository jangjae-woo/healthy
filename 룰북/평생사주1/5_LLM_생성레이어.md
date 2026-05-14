# 5. LLM 생성 레이어 — Gemini 호출

## 역할
해석 기획·캐릭터 매핑·prompt 룰북 합쳐 Gemini에 보내고 본문 받음. 섹션별 단일 fetch (14 섹션 + opener + overview + qa). saju 가드 분기일 때 청크 누적 → 가드 → 단일 push, opener는 옛 청크별 stream 유지.

## 주요 파일
- `app/api/generate/route.ts` L4279~ `type='saju'` 분기 + L4350~ readable
- `lib/saju-system-instruction.ts` — `SAJU_SYSTEM_INSTRUCTION`
- L652~ `buildHeader` — 공통 시스템 prompt
- L714~ `SAJU_PROMPTS` — 신규 14 섹션 prompt 생성기
- L481~ `LIFETIME_SAJU_PROMPTS` — 옛 9 섹션 prompt (호환 보존)

## stream 흐름 (saju 분기)
1. 클라이언트 fetch `/api/generate {type:'saju', section, ...}`
2. 서버: prompt 빌드 + Gemini stream 받음
3. saju 가드 분기:
   - opener: 청크별 push (글자 떠오름 효과)
   - 그 외: 청크 누적 → `guardGeneratedText({service:"saju", chapter:section, ...})` → 단일 push + `tk` 이벤트
4. 클라이언트: `usedTokensRef` 누적, 다음 섹션 fetch body에 포함

## SSE 이벤트
- `t: 'm'` — opener 응답에 sajuAnalysis 동봉
- `t: 'x'` — text chunk
- `t: 'tk'` — usedTokens 갱신 (saju 가드 분기만)
- `[DONE]`

## maxOutputTokens
- opener: 200
- LIFETIME_SAJU_PROMPTS: 3000
- SAJU_PROMPTS: section === 'qa' ? 3000 : section === 'overview' ? 2500 : 3000

## thinkingBudget
- `thinkingConfig: { thinkingBudget: 0 }` (빠른 응답)

## 진행 로그
(작업 시 기록)
