// 나의 홍실 V3 — 1인 솔로 6장 16풀이 streaming 생성
import { NextRequest, NextResponse } from "next/server";
import { computeFullSajuCore } from "@/lib/saju-core";
import { buildAllHongsilPrompts } from "@/lib/hongsil/build-context";
import type { HongsilRequest } from "@/lib/hongsil/types";
import { SAJU_SYSTEM_INSTRUCTION } from "@/lib/saju-system-instruction";
import { createNameGuard } from "@/lib/name-guard";
import { guardGeneratedText } from "@/lib/llm-output-guard";
import { derivePrescription } from "@/lib/hongsil/yongsin-prescription";
import { buildSoloEscapePrompt } from "@/lib/hongsil/prompts/refinement/solo-escape";
import { buildYearlyFlowPrompt } from "@/lib/hongsil/prompts/refinement/yearly-flow";
import { buildInnerCharmPrompt } from "@/lib/hongsil/prompts/refinement/inner-charm";
import { buildGoodPartnerSignalPrompt } from "@/lib/hongsil/prompts/refinement/good-partner-signal";
import { buildHongsilCharacter } from "@/lib/hongsil/build-context";

export const maxDuration = 300;
const GEMINI_MODEL = "gemini-2.5-flash";

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
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
      return await attempt();
    }
    return res;
  } catch (e) {
    return Promise.reject(e);
  }
}

async function consumeGeminiStream(res: Response, onChunk: (text: string) => void): Promise<{ ok: boolean; reason?: string }> {
  if (!res.body) return { ok: false, reason: "no body" };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let lastActivity = Date.now();
  const idleCheck = setInterval(() => {
    if (Date.now() - lastActivity > GEMINI_IDLE_TIMEOUT_MS) {
      try { reader.cancel(); } catch {}
    }
  }, 5000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lastActivity = Date.now();
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          const t = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) onChunk(t);
        } catch {}
      }
    }
    clearInterval(idleCheck);
    return { ok: true };
  } catch (e) {
    clearInterval(idleCheck);
    return { ok: false, reason: String(e) };
  }
}

// ── sub 분리/합치기 헬퍼 ───────────────────────────────────
// LLM 본문에서 ### 헤더 단위로 sub 본문을 분리. 순서 유지.
function splitBySubHeader(text: string): { titles: string[]; bodies: Record<string, string> } {
  const headings = [...text.matchAll(/^###\s+(.+)$/gm)];
  const titles: string[] = [];
  const bodies: Record<string, string> = {};
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index ?? 0;
    const end = i + 1 < headings.length ? headings[i + 1].index ?? text.length : text.length;
    const title = headings[i][1].trim();
    titles.push(title);
    bodies[title] = text.slice(start, end);
  }
  return { titles, bodies };
}

function joinSubs(prefix: string, titles: string[], bodies: Record<string, string>): string {
  return prefix + titles.map(t => bodies[t] ?? "").join("\n\n");
}

// ── 구체화 LLM 단일 호출 (non-stream, 본문만 받음) ──────────
async function callRefinement(url: string, prompt: string): Promise<string> {
  const res = await fetchGeminiWithRetry(url, {
    systemInstruction: { parts: [{ text: SAJU_SYSTEM_INSTRUCTION }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
  });
  if (!res.ok || !res.body) return "";
  let out = "";
  await consumeGeminiStream(res, (text) => { out += text; });
  return out.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HongsilRequest & { phase?: string };
    const me = computeFullSajuCore(body.me);
    if (!me) return NextResponse.json({ error: "사주 계산 실패" }, { status: 400 });

    const prompts = buildAllHongsilPrompts(body, me);
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const allChapters = [
      { ch: 1, prompt: prompts.ch1 },
      { ch: 2, prompt: prompts.ch2 },
      { ch: 3, prompt: prompts.ch3 },
      { ch: 4, prompt: prompts.ch4 },
      { ch: 5, prompt: prompts.ch5 },
      { ch: 6, prompt: prompts.ch6 },
    ];
    const phaseMatch = body.phase?.match(/^ch([1-6])$/);
    const chapterPrompts = phaseMatch
      ? [allChapters[parseInt(phaseMatch[1]) - 1]]
      : allChapters;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const enqueue = (obj: Record<string, unknown>) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        // Fix #1 cross-chapter 누적 Map — guard가 mutate한다.
        // key = 정규화된 토큰 (예: "재성(財星)") / value = 풀이 전체 등장 횟수.
        // 카운트 ≤ 2: 본문 그대로. 3회째부터 가드가 풀 대명사로 치환.
        // phase=chN 단일 호출에선 매번 새로 시작 (단일 챕터 미리보기는 cross-chapter 컨텍스트 없이).
        const usedTokens = new Map<string, number>();
        try {
          for (const { ch, prompt: basePrompt } of chapterPrompts) {
            enqueue({ t: "cs", ch });
            const nameGuard = createNameGuard([body.me.name]);
            // 이전 챕터에서 이미 2회 도달한 한자 병기 토큰 안내 — LLM이 처음부터 덜 출력하도록.
            // 한자 병기(`갑목(甲木)`)만 골라 보여줌. 한글 단독 용어는 너무 흔해 prompt 노이즈.
            const saturatedTokens = [...usedTokens.entries()]
              .filter(([t, c]) => c >= 2 && /\([甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水食傷神官財印比劫肩正偏殺桃花紅艶天乙貴人日柱干支大運歲運身弱強喜忌用中和太鬼門關陽刃將星金輿太極德福懸針驛馬華蓋羊]+\)/.test(t))
              .map(([t]) => t);
            // ch6 "마지막 편지"는 prompt 본문에 "한자 금지" 강제 룰이 박혀있어
            // 한자 토큰 리스트를 다시 prepend하면 모순 → Gemini 빈 응답 위험.
            // ch6는 한자 자체를 안 쓰는 챕터라 cross-chapter 가드 불필요.
            const crossChapterBlock = (ch !== 1 && ch !== 6 && saturatedTokens.length > 0) ? `
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
              // ch6 빈 응답 진단 — 사용자 보고 "마지막 편지 로딩만 계속" 증상의 원인 추적용.
              // 단계별 길이 로깅: 메인 응답 + 가드 후 + final stream 시점 비교해서 어디서 사라지는지 즉시 확인.
              if (ch === 6) {
                console.error(`[hongsil ch6 diag] main-response-length=${generated.length} result.ok=${result.ok} reason=${result.reason ?? "n/a"} prompt-length=${prompt.length}`);
                console.error(`[hongsil ch6 diag] head-150=${generated.slice(0, 150).replace(/\n/g, "\\n")}`);
                // 헤더 누락 안전망 — ### 마지막 편지 헤더 없으면 강제 prefix.
                // 클라이언트 page.tsx의 splitBySubHeader가 ### 시작만 인식하므로 누락 시 fallback 무한 표시.
                if (!generated.includes("### 마지막 편지")) {
                  console.error(`[hongsil ch6 diag] HEADER MISSING — auto-prepending "### 마지막 편지"`);
                  // 만약 본문이 다른 헤더(### 편지 등)로 시작하면 그 헤더를 교체. 아니면 prefix 추가.
                  const otherHeader = generated.match(/^###\s+[^\n]+/m);
                  if (otherHeader) {
                    generated = generated.replace(otherHeader[0], "### 마지막 편지");
                  } else {
                    generated = `### 마지막 편지\n${generated.trimStart()}`;
                  }
                }
              }

              // ── ch3 구체화 호출 — 좋은 사람을 알아보는 신호 강화 ───────
              if (ch === 3 && result.ok && generated.length > 0) {
                try {
                  const prescription = derivePrescription(me);
                  const { destinyMatch } = buildHongsilCharacter(body, me);
                  const { titles, bodies } = splitBySubHeader(generated);
                  const prefix = generated.slice(0, (generated.match(/^###\s+/m)?.index ?? generated.length));

                  const signalKey = titles.find(t => t.includes("좋은 사람을 알아보는"));
                  if (signalKey && bodies[signalKey]) {
                    try {
                      const signalPrompt = buildGoodPartnerSignalPrompt({
                        mainBody: bodies[signalKey],
                        saju: me,
                        prescription,
                        destinyCharacter: destinyMatch.name,
                        name: body.me.name,
                        choice: body.choice,
                      });
                      const refined = await callRefinement(url, signalPrompt);
                      if (refined && refined.includes("###")) bodies[signalKey] = refined;
                    } catch (e) {
                      console.error(`[hongsil ch3 good-partner-signal] failed: ${String(e)}`);
                    }
                  }

                  generated = joinSubs(prefix, titles, bodies);
                } catch (e) {
                  console.error(`[hongsil ch3 refinement orchestration] failed: ${String(e)}`);
                }
              }

              // ── ch5 구체화 호출 — 나도 모르게 풍기는 매력 강화 ─────────
              if (ch === 5 && result.ok && generated.length > 0) {
                try {
                  const { titles, bodies } = splitBySubHeader(generated);
                  const prefix = generated.slice(0, (generated.match(/^###\s+/m)?.index ?? generated.length));

                  const charmKey = titles.find(t => t.includes("나도 모르게 풍기는 매력"));
                  if (charmKey && bodies[charmKey]) {
                    try {
                      const charmPrompt = buildInnerCharmPrompt({
                        mainBody: bodies[charmKey],
                        saju: me,
                        name: body.me.name,
                        choice: body.choice,
                      });
                      const refined = await callRefinement(url, charmPrompt);
                      if (refined && refined.includes("###")) bodies[charmKey] = refined;
                    } catch (e) {
                      console.error(`[hongsil ch5 inner-charm] failed: ${String(e)}`);
                    }
                  }

                  generated = joinSubs(prefix, titles, bodies);
                } catch (e) {
                  console.error(`[hongsil ch5 refinement orchestration] failed: ${String(e)}`);
                }
              }

              // ── ch2 구체화 호출 (옵션 B) ─────────────────────────
              // 솔로 탈출 가이드 + 올해 연애 흐름 sub만 별도 LLM 호출.
              // 사주 처방 데이터 주입해 일반 가이드 → 구체 처방으로 정교화.
              // 실패 시 메인 본문 그대로 유지 (fallback).
              if (ch === 2 && result.ok && generated.length > 0) {
                try {
                  const prescription = derivePrescription(me);
                  const { titles, bodies } = splitBySubHeader(generated);
                  const prefix = generated.slice(0, (generated.match(/^###\s+/m)?.index ?? generated.length));

                  // 솔로 탈출 구체화
                  const soloKey = titles.find(t => t.includes("솔로 탈출"));
                  if (soloKey && bodies[soloKey]) {
                    try {
                      const soloPrompt = buildSoloEscapePrompt({
                        mainBody: bodies[soloKey],
                        prescription,
                        name: body.me.name,
                        choice: body.choice,
                      });
                      const refined = await callRefinement(url, soloPrompt);
                      if (refined && refined.includes("###")) bodies[soloKey] = refined;
                    } catch (e) {
                      console.error(`[hongsil ch2 solo-escape] failed: ${String(e)}`);
                    }
                  }

                  // 올해 흐름 구체화
                  const yearlyKey = titles.find(t => t.includes("올해 연애") || t.includes("조심할 흐름"));
                  if (yearlyKey && bodies[yearlyKey]) {
                    try {
                      const yearlyPrompt = buildYearlyFlowPrompt({
                        mainBody: bodies[yearlyKey],
                        prescription,
                        name: body.me.name,
                        choice: body.choice,
                      });
                      const refined = await callRefinement(url, yearlyPrompt);
                      if (refined && refined.includes("###")) bodies[yearlyKey] = refined;
                    } catch (e) {
                      console.error(`[hongsil ch2 yearly-flow] failed: ${String(e)}`);
                    }
                  }

                  generated = joinSubs(prefix, titles, bodies);
                } catch (e) {
                  console.error(`[hongsil ch2 refinement orchestration] failed: ${String(e)}`);
                  // fallback: generated 그대로 유지
                }
              }

              if (!result.ok) enqueue({ t: "ce", ch, error: result.reason });
              else {
                const guardedResult = await guardGeneratedText({
                  service: "hongsil",
                  chapter: ch,
                  text: generated,
                  prompt,
                  people: [{ name: body.me.name, saju: me }],
                  apiKey,
                  usedTokens,
                });
                if (ch === 6) {
                  console.error(`[hongsil ch6 diag] post-guard-length=${guardedResult.text.length} changed=${guardedResult.changed} issues=${guardedResult.issues.length}`);
                }
                const guarded = nameGuard.push(guardedResult.text);
                if (ch === 6) {
                  console.error(`[hongsil ch6 diag] post-nameGuard-push-length=${(guarded ?? "").length}`);
                }
                if (guarded) enqueue({ t: "x", ch, v: guarded });
                const rest = nameGuard.flush();
                if (ch === 6) {
                  console.error(`[hongsil ch6 diag] nameGuard-flush-length=${(rest ?? "").length}`);
                }
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

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("hongsil-generate error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
