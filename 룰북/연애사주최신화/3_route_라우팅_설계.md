# route.ts 라우팅 설계 — 메인 + 구체화 호출 흐름

## 현재 (BEFORE)

```typescript
// app/api/hongsil-generate/route.ts

for (const { ch, prompt: basePrompt } of chapterPrompts) {
  enqueue({ t: "cs", ch });
  const finalPrompt = basePrompt + crossChapterBlock;
  const res = await fetchGeminiWithRetry(url, { ..., contents: [{ parts: [{ text: finalPrompt }] }] });
  let generated = "";
  await consumeGeminiStream(res, (text) => { generated += text; });
  const guarded = await guardGeneratedText({ ..., text: generated, usedTokens });
  enqueue({ t: "x", ch, v: guarded.text });
  enqueue({ t: "cd", ch });
}
```

문제: 메인 prompt가 비대해 새어듦 / 솔로 탈출·올해 흐름이 일반 가이드로 폴백.

---

## 새 (AFTER)

```typescript
for (const { ch, prompt: basePrompt } of chapterPrompts) {
  enqueue({ t: "cs", ch });
  
  // 1차: 메인 LLM 호출 (깨끗한 prompt)
  const finalPrompt = basePrompt + crossChapterBlock;
  let generated = "";
  // ... fetchGeminiWithRetry + consumeGeminiStream ...
  
  // 2차: ch2 일 때만 구체화 호출
  if (ch === 2) {
    const prescription = derivePrescription(saju);
    
    // sub 단위로 본문 분리
    const subs = splitBySubHeader(generated);  // { '사랑이 들어오는 시기': ..., '솔로 탈출 가이드': ..., '올해 연애에서 조심할 흐름': ... }
    
    // 솔로 탈출 구체화 (실패 시 메인 본문 유지)
    try {
      const refinedSolo = await callRefinement('solo-escape', {
        mainBody: subs['솔로 탈출 가이드'],
        prescription,
        name: body.me.name,
        choice: body.choice,
        apiKey,
      });
      if (refinedSolo.trim()) subs['솔로 탈출 가이드'] = refinedSolo;
    } catch (e) {
      console.error(`[hongsil ch2 solo-escape] failed: ${e}`);
      // fallback: 메인 본문 유지
    }
    
    // 올해 흐름 구체화
    try {
      const refinedYearly = await callRefinement('yearly-flow', {
        mainBody: subs['올해 연애에서 조심할 흐름'],
        prescription,
        name: body.me.name,
        choice: body.choice,
        apiKey,
      });
      if (refinedYearly.trim()) subs['올해 연애에서 조심할 흐름'] = refinedYearly;
    } catch (e) {
      console.error(`[hongsil ch2 yearly-flow] failed: ${e}`);
    }
    
    // sub 합쳐 generated 재구성
    generated = joinSubs(subs);
  }
  
  // 3차: 검수팀 (rewrite는 repetition-tone 통합 포함)
  const guarded = await guardGeneratedText({ ..., text: generated, usedTokens });
  enqueue({ t: "x", ch, v: guarded.text });
  enqueue({ t: "cd", ch });
}
```

---

## 필요한 새 헬퍼 함수

### `splitBySubHeader(text)` — sub 단위 분리
```typescript
function splitBySubHeader(text: string): Record<string, string> {
  const headings = [...text.matchAll(/^###\s+(.+)$/gm)];
  const result: Record<string, string> = {};
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index!;
    const end = i + 1 < headings.length ? headings[i + 1].index! : text.length;
    const title = headings[i][1].trim();
    result[title] = text.slice(start, end);
  }
  return result;
}
```

### `joinSubs(subs)` — sub 합치기 (순서 유지)
원본 순서를 알아야 함. `splitBySubHeader` 결과의 Object.keys 순서 사용.

### `callRefinement(type, ...)` — 구체화 LLM 호출
```typescript
async function callRefinement(
  type: 'solo-escape' | 'yearly-flow',
  args: { mainBody: string; prescription: YongsinPrescription; name: string; choice: HongsilEntryChoice; apiKey: string }
): Promise<string> {
  const promptFn = type === 'solo-escape' ? buildSoloEscapePrompt : buildYearlyFlowPrompt;
  const prompt = promptFn(args);
  return callGeminiText(args.apiKey, prompt, 4096);  // 8192보다 작음 (sub 1개라)
}
```

---

## 안전 장치

1. **try-catch로 실패 격리** — 구체화 호출 실패해도 메인 본문 사용
2. **빈 응답 fallback** — `refinedSolo.trim()` 비어있으면 메인 본문 유지
3. **타임아웃 짧게** — 메인 8192 토큰, 구체화 4096 토큰 (sub 1개라 충분)
4. **진단 로깅** — vercel logs에서 실패 추적 가능
5. **순서 보존** — `splitBySubHeader` 후 `joinSubs`에서 원본 순서 유지

---

## 비용 (시간 추가)

| 호출 | 시간 |
|---|---|
| ch1~ch6 메인 LLM (지금까지) | ~30~40초 |
| ch2 solo-escape 구체화 | +3~5초 |
| ch2 yearly-flow 구체화 | +3~5초 |
| ch1~ch6 rewrite (repetition-tone 포함) | ~18~30초 (지금까지와 비슷) |
| **합계** | ~54~80초 |

ch2 처리에 +6~10초 추가. 풀이 전체로는 65~85초.

---

## rewrite 통합 (`llm-output-guard.ts`)

```typescript
import { REPETITION_TONE_GUIDE } from "@/lib/hongsil/prompts/refinement/repetition-tone";

async function rewriteOutput(input, issues, repeatedEvidence) {
  const prompt = `
... 기존 절대 조건들 ...

${REPETITION_TONE_GUIDE}

[원문]
${input.text}
`;
  return callGeminiText(input.apiKey, prompt, 8192);
}
```

→ repetition-tone.ts의 안내 어휘는 rewrite 호출 시점에만 LLM에 노출. 메인 LLM은 깨끗.
