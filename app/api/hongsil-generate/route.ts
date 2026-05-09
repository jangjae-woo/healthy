// 나의 홍실 V3 — 1인 솔로 6장 16풀이 streaming 생성
import { NextRequest, NextResponse } from "next/server";
import { calculateFourPillars } from "manseryeok";
import {
  getSipseong, calcDaeun, calcSinsal, calcElements, getYongsin,
  calcMonthPillar, calcYearPillar, getDayMasterStrength,
  type SajuAnalysis,
} from "@/lib/saju-calculator";
import { buildAllHongsilPrompts } from "@/lib/hongsil/build-context";
import type { HongsilRequest } from "@/lib/hongsil/types";
import { SAJU_SYSTEM_INSTRUCTION } from "@/lib/saju-system-instruction";

export const maxDuration = 300;
const GEMINI_MODEL = "gemini-2.5-flash";

const HOUR_MAP: Record<string, number> = {
  "시간 모름": 12, "모름": 12,
  "자시 (23:30~01:29)": 0, "축시 (01:30~03:29)": 2, "인시 (03:30~05:29)": 4,
  "묘시 (05:30~07:29)": 6, "진시 (07:30~09:29)": 8, "사시 (09:30~11:29)": 10,
  "오시 (11:30~13:29)": 12, "미시 (13:30~15:29)": 14, "신시 (15:30~17:29)": 16,
  "유시 (17:30~19:29)": 18, "술시 (19:30~21:29)": 20, "해시 (21:30~23:29)": 22,
};

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

function computeFullSaju(p: { name: string; year: string; month: string; day: string; hour: string; calendar: "양력" | "음력"; gender: "남" | "여" }): SajuAnalysis | null {
  try {
    const year = parseInt(p.year, 10), month = parseInt(p.month, 10), day = parseInt(p.day, 10);
    const hour = HOUR_MAP[p.hour] ?? 12;
    const isHourUnknown = p.hour === "모름" || p.hour === "시간 모름";
    const fp = calculateFourPillars({ year, month, day, hour, minute: 0, isLunar: p.calendar === "음력" });
    const correctedYear = calcYearPillar(year, month, day);
    const correctedMonth = calcMonthPillar(year, month, day);
    const pillars: SajuAnalysis["pillars"] = {
      year: correctedYear, month: correctedMonth,
      day: { stem: fp.day.heavenlyStem, branch: fp.day.earthlyBranch },
      hour: isHourUnknown ? null : { stem: fp.hour.heavenlyStem, branch: fp.hour.earthlyBranch },
    };
    const ilgan = pillars.day.stem;
    const ss = (stem: string, branch: string) => ({ stem: getSipseong(ilgan, stem, false), branch: getSipseong(ilgan, branch, true) });
    const sipseong: SajuAnalysis["sipseong"] = {
      year: ss(pillars.year.stem, pillars.year.branch),
      month: ss(pillars.month.stem, pillars.month.branch),
      day: ss(pillars.day.stem, pillars.day.branch),
      hour: isHourUnknown || !pillars.hour ? null : ss(pillars.hour.stem, pillars.hour.branch),
    };
    const allStems = [pillars.year.stem, pillars.month.stem, pillars.day.stem, ...(pillars.hour ? [pillars.hour.stem] : [])];
    const allBranches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, ...(pillars.hour ? [pillars.hour.branch] : [])];
    const elements = calcElements(allStems, allBranches);
    const yongsin = getYongsin(ilgan, elements);
    const daeun = calcDaeun(year, month, day, pillars.year.stem, pillars.month, p.gender);
    const sinsal = calcSinsal(pillars.year.branch, pillars.day.branch, ilgan, allBranches, allStems, pillars.month.branch, pillars.day.stem);
    let shinkang: string | undefined;
    try {
      shinkang = getDayMasterStrength(ilgan, pillars.month.branch, allBranches, allStems).level;
    } catch {}
    return { pillars, ilgan, sipseong, elements, yongsin, daeun, sinsal, isHourUnknown, ...(shinkang ? { shinkang } : {}) } as SajuAnalysis & { shinkang?: string };
  } catch (e) {
    console.error("hongsil-generate saju error:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HongsilRequest & { phase?: string };
    const me = computeFullSaju(body.me);
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
        try {
          for (const { ch, prompt } of chapterPrompts) {
            enqueue({ t: "cs", ch });
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
              const result = await consumeGeminiStream(res, (text) => enqueue({ t: "x", ch, v: text }));
              if (!result.ok) enqueue({ t: "ce", ch, error: result.reason });
              else enqueue({ t: "cd", ch });
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
