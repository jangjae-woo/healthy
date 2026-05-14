// 인연(홍연) AI 풀이 생성 — 8장 순차 스트리밍
// 격리: 한국 generate / 대만 generate-tw 와 분리, 인연 전용 라우트
import { NextRequest, NextResponse } from "next/server";
import { calcCompatibility } from "@/lib/saju-calculator";
import { computeFullSajuCore } from "@/lib/saju-core";
import { computeInyeonScores, estimateAssetCurve, estimateTogetherCurve } from "@/lib/inyeon/scoring";
import { buildAllInyeonPrompts } from "@/lib/inyeon/build-context";
import type { InyeonRequest, InyeonPersonInput } from "@/lib/inyeon/types";
import { SAJU_SYSTEM_INSTRUCTION } from "@/lib/saju-system-instruction";
import { createNameGuard } from "@/lib/name-guard";
import { guardGeneratedText } from "@/lib/llm-output-guard";

export const maxDuration = 300;

const GEMINI_MODEL = "gemini-2.5-flash";

// ─── Gemini 5중 안전망 (대만판 패턴 그대로) ─────────────────────────
const GEMINI_TOTAL_TIMEOUT_MS = 180_000;
const GEMINI_IDLE_TIMEOUT_MS  = 30_000;

async function fetchGeminiWithRetry(url: string, body: object): Promise<Response> {
  const attempt = (): Promise<Response> => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(GEMINI_TOTAL_TIMEOUT_MS),
  });
  try {
    const res = await attempt();
    if (!res.ok && res.status >= 500 && res.status < 600) {
      try { await res.body?.cancel(); } catch {}
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 100));
      return await attempt();
    }
    return res;
  } catch {
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 100));
    return await attempt();
  }
}

async function consumeGeminiStream(
  res: Response,
  onChunk: (text: string) => void,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let cancelReason: string | null = null;
  let idleTimerId: ReturnType<typeof setTimeout> | null = null;

  const resetIdle = () => {
    if (idleTimerId) clearTimeout(idleTimerId);
    idleTimerId = setTimeout(() => {
      cancelReason = `idle-timeout-${GEMINI_IDLE_TIMEOUT_MS}ms`;
      reader.cancel().catch(() => {});
    }, GEMINI_IDLE_TIMEOUT_MS);
  };
  resetIdle();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetIdle();
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const json = JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {}
      }
    }
  } finally {
    if (idleTimerId) clearTimeout(idleTimerId);
    try { await res.body?.cancel(); } catch {}
  }
  return cancelReason ? { ok: false, reason: cancelReason } : { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InyeonRequest & { phase?: string };
    const a = computeFullSajuCore(body.a);
    const b = computeFullSajuCore(body.b);
    if (!a || !b) {
      return NextResponse.json({ error: "사주 계산 실패" }, { status: 400 });
    }
    const compat = calcCompatibility(a, b);
    const scores = computeInyeonScores(a, b, compat);
    const aCurve = estimateAssetCurve(a);
    const bCurve = estimateAssetCurve(b);
    const togetherCurve = estimateTogetherCurve(aCurve, bCurve, scores.finance);

    const prompts = buildAllInyeonPrompts(body, a, b, compat, scores, {
      a: aCurve, b: bCurve, together: togetherCurve,
    });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const allChapters: Array<{ ch: number; prompt: string }> = [
      { ch: 1, prompt: prompts.ch1 }, { ch: 2, prompt: prompts.ch2 },
      { ch: 3, prompt: prompts.ch3 }, { ch: 4, prompt: prompts.ch4 },
      { ch: 5, prompt: prompts.ch5 }, { ch: 6, prompt: prompts.ch6 },
      { ch: 7, prompt: prompts.ch7 }, { ch: 8, prompt: prompts.ch8 },
    ];
    // ─── Phase 분기 — 단일 챕터만 streaming (Vercel 60초 한도 회피) ───
    const phaseMatch = body.phase?.match(/^ch([1-8])$/);
    const chapterPrompts: Array<{ ch: number; prompt: string }> = phaseMatch
      ? [allChapters[parseInt(phaseMatch[1]) - 1]]
      : allChapters;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (obj: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        // Phase 1 — cross-chapter 한자 카운터 누적 (hongsil 패턴)
        const usedTokens = new Map<string, number>();
        try {
          // 첫 청크: 메타 (계산값 — 클라이언트가 inyeon-compute 결과와 합칠 필요 없음)
          enqueue({ t: "m", scores });

          for (const { ch, prompt: basePrompt } of chapterPrompts) {
            enqueue({ t: "cs", ch }); // chapter start
            const nameGuard = createNameGuard([body.a.name, body.b.name]);
            // 이전 챕터에서 2회 등장한 한자 병기 토큰 안내 (ch2~ch7만, ch1·ch8 제외)
            const saturatedTokens = [...usedTokens.entries()]
              .filter(([t, c]) => c >= 2 && /\([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極德福懸針驛馬華蓋羊]+\)/.test(t))
              .map(([t]) => t);
            const crossChapterBlock = (ch !== 1 && ch !== 8 && saturatedTokens.length > 0) ? `
[★★★★★ 이미 풀이 전체에서 2회 등장한 한자 병기 — 본문 재사용 금지]
${saturatedTokens.join(", ")}
→ 위 한자 병기는 다시 출력하지 말 것. 같은 근거를 다시 짚어야 하면 그 근거가 만드는 행동·말투·반응을 일상 장면으로 바로 보여줄 것. 이 안내문에 인용된 예시 어휘를 그대로 본문에 박지 말 것.
` : "";
            const prompt = basePrompt + crossChapterBlock;
            try {
              const res = await fetchGeminiWithRetry(url, {
                systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 } },
              });
              if (!res.ok || !res.body) {
                enqueue({ t: "ce", ch, error: `HTTP ${res.status}` });
                continue;
              }
              let generated = "";
              const result = await consumeGeminiStream(res, (text) => {
                generated += text;
              });
              // ch8 진단 로깅 + 헤더 안전망 — inyeon ch8은 sub 3개
              // sub 헤더가 다 있어야 클라이언트 ChSub이 본문 매칭. 누락 sub에 빈 본문 박아 fallback 무한 표시 차단.
              if (ch === 8) {
                const reasonStr = result.ok ? "n/a" : result.reason;
                console.error(`[inyeon ch8 diag] main-response-length=${generated.length} result.ok=${result.ok} reason=${reasonStr} prompt-length=${prompt.length}`);
                console.error(`[inyeon ch8 diag] head-150=${generated.slice(0, 150).replace(/\n/g, "\\n")}`);

                const ch8Subs = ["이렇게 만나주신 두 분께", "두 분의 결, 잊지 마세요", "마지막으로 드리는 한 마디"];
                const missing = ch8Subs.filter(s => !generated.includes(`### ${s}`));
                if (missing.length > 0) {
                  console.error(`[inyeon ch8 diag] MISSING HEADERS — ${missing.join(", ")}`);
                  // 누락된 각 sub을 본문 끝에 빈 placeholder로 추가 (클라이언트 ChSub이 매칭만 되면 다음 본문은 LLM 출력 그대로)
                  // 단 부분 출력된 본문이 있으면 그건 보존
                  for (const sub of missing) {
                    generated += `\n\n### ${sub}\n(다음 풀이에 이어집니다.)`;
                  }
                }
              }
              if (!result.ok) enqueue({ t: "ce", ch, error: result.reason });
              else {
                const guardedResult = await guardGeneratedText({
                  service: "inyeon",
                  chapter: ch,
                  text: generated,
                  prompt,
                  people: [
                    { name: body.a.name, saju: a },
                    { name: body.b.name, saju: b },
                  ],
                  apiKey,
                  usedTokens,
                });
                if (ch === 8) {
                  console.error(`[inyeon ch8 diag] post-guard-length=${guardedResult.text.length} changed=${guardedResult.changed} issues=${guardedResult.issues.length}`);
                }
                const guarded = nameGuard.push(guardedResult.text);
                if (guarded) enqueue({ t: "x", ch, v: guarded });
                const rest = nameGuard.flush();
                if (rest) enqueue({ t: "x", ch, v: rest });
                enqueue({ t: "cd", ch, guard: guardedResult.changed ? "repaired" : "pass" });
              }
            } catch (e) {
              enqueue({ t: "ce", ch, error: String(e) });
            }
          }
          enqueue({ t: "d" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          enqueue({ t: "err", error: String(e) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("inyeon-generate error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
