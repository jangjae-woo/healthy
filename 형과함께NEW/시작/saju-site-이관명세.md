# saju-site 이관 명세서 (Phase 6)

> **작성**: 2026-05-17
> **목적**: 시작 폴더 코드를 saju-site repo로 이관할 때 필요한 변경·추가 사항 정리
> **이관 시점**: Phase 4·5 검증 통과 후 (현재 단계)

---

## 1. 파일 이관 매핑

| 시작 폴더 (.mjs) | saju-site (.ts) | 비고 |
|---|---|---|
| `lib/youa/types.mjs` | `lib/youa/types.ts` | JSDoc → TypeScript interface 변환 |
| `lib/youa/factors.mjs` | `lib/youa/factors.ts` | TS 변환, `import` saju-core 추가 |
| `lib/youa/parent-axes.mjs` | `lib/youa/parent-axes.ts` | TS 변환 |
| `lib/youa/matrix.mjs` | `lib/youa/matrix.ts` | TS 변환 |
| `lib/youa/animal.mjs` | `lib/youa/animal.ts` | TS 변환 |
| `lib/youa/ilgan-relation.mjs` | `lib/youa/ilgan-relation.ts` | TS 변환 |
| `lib/youa/facts-builder.mjs` | `lib/youa/facts-builder.ts` | TS 변환 + saju-core 통합 |
| `lib/youa/prompt-builder.mjs` | `lib/youa/prompt-builder.ts` | TS 변환 |
| `lib/youa/output-parser.mjs` | `lib/youa/output-parser.ts` | TS 변환 |
| `lib/youa/output-validator.mjs` | `lib/youa/output-validator.ts` | TS 변환 |
| `lib/youa/input-validator.mjs` | `lib/youa/input-validator.ts` | TS 변환 |
| `lib/youa/render-utils.mjs` | `components/youa/*.tsx` | React 컴포넌트로 분리 |
| `lib/youa/render.mjs` | `components/youa/Report.tsx` | React 컴포넌트 |
| `fixtures/*.mjs` | `lib/youa/__tests__/fixtures/*.ts` | 테스트용 fixture |
| `components/form.html` | `app/youa/form/page.tsx` | Next.js 페이지 |
| `components/result.html` | `app/youa/result/page.tsx` | Next.js 페이지 |
| — | `app/youa/page.tsx` (랜딩, 신규) | `<ServiceLanding>` 1줄 |
| — | `app/api/youa/generate/route.ts` (신규) | SSE 엔드포인트 |

---

## 2. 사주 8자 변환 통합

시작 폴더의 `saju-converter.mjs` (stub)을 **실제 변환**으로 교체:

```typescript
// lib/youa/saju-converter.ts
import { computeFullSajuCore } from "@/lib/saju-core";

export function convertToSaju(formInput, role) {
  const sajuCore = computeFullSajuCore({
    year: formInput.birthDate.slice(0, 4),
    month: formInput.birthDate.slice(5, 7),
    day: formInput.birthDate.slice(8, 10),
    hour: formInput.hour,
    calendar: formInput.calendar === 'lunar' ? '음력' : '양력',
    gender: role === 'child' ? (formInput.gender === 'female' ? '여' : '남') : undefined,
  });

  if (!sajuCore) throw new Error('사주 변환 실패');

  // sajuCore (SajuAnalysisCore) → fixture 형식 변환
  return convertSajuCoreToFixture(sajuCore, formInput, role);
}
```

### `convertSajuCoreToFixture()` 신규 구현 필요

`saju-core.ts`의 `SajuAnalysisCore`는 다음 필드 제공:
- `pillars` (4기둥)
- `ilgan`
- `sipseong`
- `elements`
- `sinsal`
- `shinkang`
- `daeun`

→ fixture 스키마(`factorStrength`·`unseong`·`branchInteractions` 등)로 변환 필요. 본 변환 함수가 핵심 작업.

**계산 헬퍼 추가 필요**:
- 12운성 (saju-traditional `calcUnseong` 활용)
- 지지장간 매핑 (saju-calculator JIJANGAN 활용)
- 통근·투출·왕상휴수사 자동 산출 → factorStrength 위치별 강도 자동 계산
- 일지 합·충 (saju-traditional `calcIljiRelation` 활용)

---

## 3. API Route — `/api/youa/generate/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { buildFacts } from '@/lib/youa/facts-builder';
import { convertToSaju } from '@/lib/youa/saju-converter';
import { buildPrompt } from '@/lib/youa/prompt-builder';
import { parseLLMOutput, attachLLMTextToFacts } from '@/lib/youa/output-parser';
import { validateLLMOutput } from '@/lib/youa/output-validator';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. 입력 → 사주 변환
  const childSaju = convertToSaju(body.child, 'child');
  const motherSaju = body.mother ? convertToSaju(body.mother, 'mother') : null;
  const fatherSaju = body.father ? convertToSaju(body.father, 'father') : null;

  // 2. facts 빌드
  const facts = buildFacts({ childSaju, motherSaju, fatherSaju, testDate: new Date().toISOString().slice(0, 10) });

  // 3. SSE 스트림 시작
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // 결정론 facts 즉시 전송
      send('facts', facts);

      // 4. 프롬프트 빌드
      const prompt = buildPrompt(facts);
      send('prompt-ready', { length: prompt.full.length });

      // 5. Gemini API 호출 (스트림)
      let llmText = '';
      let retried = false;

      while (true) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt.full }] }],
                generationConfig: { maxOutputTokens: 65536, temperature: 0.7 },
              }),
            }
          );

          // SSE 스트림 파싱
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Gemini SSE parsing ...
            const text = extractGeminiText(chunk);
            llmText += text;
            send('llm-chunk', { text });
          }

          // 6. 검증
          const parsed = parseLLMOutput(llmText);
          const validation = validateLLMOutput(parsed, facts);

          if (!validation.valid && !retried) {
            send('retry', { violations: validation.violations });
            retried = true;
            llmText = '';
            continue;
          }

          // 7. 최종 결과 전송
          const factsWithLLM = attachLLMTextToFacts(facts, parsed);
          send('done', { facts: factsWithLLM, validation });
          break;
        } catch (e) {
          send('error', { message: (e as Error).message });
          break;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### 환경변수
```
GEMINI_API_KEY=<key>
```

---

## 4. 클라이언트 SSE 수신 (`result/page.tsx`)

```typescript
'use client';
import { useEffect, useState } from 'react';

export default function ResultPage() {
  const [facts, setFacts] = useState(null);
  const [llmText, setLLMText] = useState('');
  const [stage, setStage] = useState('factors');

  useEffect(() => {
    const input = JSON.parse(localStorage.getItem('youa-input') || '{}');

    fetch('/api/youa/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const [eventLine, dataLine] = evt.split('\n');
          const eventName = eventLine.replace('event: ', '');
          const data = JSON.parse(dataLine.replace('data: ', ''));

          if (eventName === 'facts') { setFacts(data); setStage('llm'); }
          if (eventName === 'llm-chunk') setLLMText(prev => prev + data.text);
          if (eventName === 'done') { setFacts(data.facts); setStage('done'); }
          if (eventName === 'retry') setStage('retrying');
        }
      }
    });
  }, []);

  if (!facts) return <Loading />;
  return <Report facts={facts} />;
}
```

---

## 5. V2 자도인 코드 import 금지 (룰)

다음 V2 모듈은 절대 import 금지:
- `lib/parent-child-charts-v2.ts`
- `lib/parent-child-compat-v2.ts`
- `lib/parent-child-observation-v2.ts`
- `lib/parent-child-traits-block-v2.ts`
- `lib/parent-child-traits-v2.ts`
- `lib/inyeon-traits-block-v2.ts`

재사용 OK (사주 표준 계산):
- `lib/saju-calculator.ts`
- `lib/saju-traditional.ts`
- `lib/saju-core.ts`
- `lib/saju-symbols.ts`
- `lib/samhap.ts`

---

## 6. 배포

```bash
cd C:/Users/new/Desktop/saju
git checkout -b feature/youa
# 파일 이관
git add app/youa lib/youa components/youa app/api/youa
git -c user.email="tooxx3@gmail.com" -c user.name="woo" commit -m "feat: 유아용 부모-자녀 궁합 SKU"
git push origin feature/youa
npx vercel --prod --yes
```

paljawon.com에 `/youa` 라우트로 추가.

---

## 7. 캘리브레이션 (Phase 7 동시 진행)

`scripts/calibrate-youa-factors.ts` 신규 작성:
```typescript
import { computeFullSajuCore } from '@/lib/saju-core';
import { calcAll6Factors } from '@/lib/youa/factors';
import { convertSajuCoreToFixture } from '@/lib/youa/saju-converter';

// 무작위 사주 100개 생성 (2020-01-01 ~ 2023-12-31 + 12시지)
const samples = generateRandomChildSajus(100);

const distributions = { hwalgi: [], josim: [], manjok: [], heundeullim: [], eoullim: [], kkeungi: [] };

for (const saju of samples) {
  const factors = calcAll6Factors(saju);
  for (const [k, v] of Object.entries(factors)) {
    distributions[k].push(v.score);
  }
}

// 분포 분석
for (const [k, scores] of Object.entries(distributions)) {
  const low  = scores.filter(s => s <= 40).length;
  const mid  = scores.filter(s => s >= 41 && s <= 65).length;
  const high = scores.filter(s => s >= 66).length;
  console.log(`${k}: 낮음 ${low}% / 중간 ${mid}% / 높음 ${high}%`);
}
```

이상적 분포: 각 요인이 낮음 25~30% / 중간 40~50% / 높음 25~30%.

쏠림 발견 시:
- 정규화 ÷6 → ÷5 또는 ÷7 조정
- 신강 점수 매핑 (`SHINKANG_SCORE`) 미세 조정
- 본기/상조/여기 가중치 조정

---

## 8. 이관 체크리스트

- [ ] `lib/youa/*.mjs` → `*.ts` 변환 (10개 파일)
- [ ] `saju-converter.ts` 실제 구현 (saju-core 통합)
- [ ] `app/youa/page.tsx`, `form/page.tsx`, `result/page.tsx` 작성
- [ ] `app/api/youa/generate/route.ts` SSE 구현
- [ ] React 컴포넌트 (`components/youa/*.tsx`) — render-utils → 컴포넌트 분리
- [ ] 환경변수 `GEMINI_API_KEY` 설정
- [ ] 김수민 양 fixture E2E 테스트 (입력 폼 → SSE → 최종 렌더)
- [ ] 7개 edge case fixture (Phase 8)
- [ ] 100개 캘리브레이션 (Phase 7)
- [ ] 결제·랜딩 페이지 (기존 paljawon 인프라 재활용)
- [ ] Vercel 배포 + paljawon.com `/youa` 라우트 등록

---

## 변경 이력
- 2026-05-17 v1 — Phase 6 이관 명세 초안
