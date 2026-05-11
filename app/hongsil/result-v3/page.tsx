"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { renderParagraphs } from "@/lib/inline-emphasis";
import {
  SoloDuration, LoveDesire, LoveStyle,
  SOLO_DURATION_LABEL, LOVE_DESIRE_LABEL, LOVE_STYLE_LABEL,
} from "@/lib/hongsil/types";

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK = "#1a0a14";
const INK_SOFT = "#3a2530";

interface SubState {
  subId: number;
  chapter: string;
  title: string;
  body: string;
  done: boolean;
  error?: string;
  diagnostic?: { finishReason?: string; blockReason?: string };
}

function ResultV3Inner() {
  const sp = useSearchParams();
  const name = sp.get("meName") ?? "";
  const year = sp.get("meYear") ?? "";
  const month = sp.get("meMonth") ?? "";
  const day = sp.get("meDay") ?? "";
  const hour = sp.get("meHour") ?? "시간 모름";
  const calendar = (sp.get("meCalendar") ?? "양력") as "양력" | "음력";
  const gender = (sp.get("meGender") ?? "여") as "남" | "여";
  const duration = (sp.get("duration") ?? "1y_to_3y") as SoloDuration;
  const desire = (sp.get("desire") ?? "natural") as LoveDesire;
  const style = (sp.get("style") ?? "balance") as LoveStyle;
  const subIdParam = sp.get("subId");
  const phaseParam = sp.get("phase");
  const requestedSubId = subIdParam ? parseInt(subIdParam, 10) : undefined;
  const requestedPhase = phaseParam ?? undefined;
  // subId 없고 phase 없으면 전체 22 sub

  const [subs, setSubs] = useState<Record<number, SubState>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (!name || !year || !month || !day) return;
    started.current = true;
    setStatus("loading");

    (async () => {
      try {
        const res = await fetch("/api/hongsil-v3-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            me: { name, year, month, day, hour, calendar, gender },
            choice: { duration, desire, style },
            ...(requestedSubId ? { subId: requestedSubId } : {}),
            ...(requestedPhase ? { phase: requestedPhase } : {}),
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          setGlobalError(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
          setStatus("error");
          return;
        }
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const ev = JSON.parse(payload);
              if (ev.t === "ss") {
                setSubs((p) => ({
                  ...p,
                  [ev.sub]: { subId: ev.sub, chapter: ev.chapter, title: ev.title, body: "", done: false },
                }));
              } else if (ev.t === "x") {
                setSubs((p) => {
                  const cur = p[ev.sub] ?? { subId: ev.sub, chapter: "", title: "", body: "", done: false };
                  return { ...p, [ev.sub]: { ...cur, body: cur.body + ev.v } };
                });
              } else if (ev.t === "sd") {
                setSubs((p) => {
                  const cur = p[ev.sub];
                  return cur ? { ...p, [ev.sub]: { ...cur, done: true } } : p;
                });
              } else if (ev.t === "se") {
                setSubs((p) => {
                  const cur = p[ev.sub] ?? { subId: ev.sub, chapter: "", title: "", body: "", done: false };
                  return { ...p, [ev.sub]: { ...cur, error: ev.error, diagnostic: ev.diagnostic, done: true } };
                });
              } else if (ev.t === "d") {
                setStatus("done");
              } else if (ev.t === "err") {
                setGlobalError(ev.error);
                setStatus("error");
              }
            } catch {}
          }
        }
      } catch (e) {
        setGlobalError(String(e));
        setStatus("error");
      }
    })();
  }, [name, year, month, day, hour, calendar, gender, duration, desire, style, requestedSubId, requestedPhase]);

  if (!name || !year || !month || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#fff7f9" }}>
        <div className="text-center" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
          <div className="text-[16px] font-bold mb-2">사주 정보가 누락되었어요</div>
          <Link href="/hongsil" className="text-[13px] underline" style={{ color: GOLD }}>← 입력 페이지로</Link>
        </div>
      </div>
    );
  }

  const subList = Object.values(subs).sort((a, b) => a.subId - b.subId);

  return (
    <div className="min-h-screen px-4 py-6" style={{
      background: `
        radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
        radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
        linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
      `,
      fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
    }}>
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/hongsil/form" className="text-[13px]" style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}>
            ← 다시 입력
          </Link>
          <div className="text-[10px] tracking-[0.4em]" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            紅 絲 · V3 검수
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            연애사주 V3 — {requestedSubId ? `sub${String(requestedSubId).padStart(2, "0")} 단독` : requestedPhase ? `${requestedPhase} 챕터` : "전체 22 sub"} 검증
          </div>
          <h1 className="text-[20px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
            {name}님의 연애사주
          </h1>
        </div>

        {/* 자가답 노출 */}
        <div className="rounded-md p-3 mb-4 text-[12px]" style={{
          background: "rgba(255,251,247,0.7)",
          border: "1px solid rgba(212,169,107,0.3)",
          color: INK_SOFT,
        }}>
          <div>솔로 기간: {SOLO_DURATION_LABEL[duration]}</div>
          <div>어떤 사랑: {LOVE_DESIRE_LABEL[desire]}</div>
          <div>사랑 스타일: {LOVE_STYLE_LABEL[style]}</div>
        </div>

        {/* 상태 */}
        {status === "loading" && subList.length === 0 && (
          <div className="rounded-md p-8 text-center" style={{
            background: "rgba(255,251,247,0.85)",
            border: "1px solid rgba(212,169,107,0.4)",
          }}>
            <div className="text-[14px] animate-pulse" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
              홍도인이 ${name}님의 사주를 펼치고 있어요…
            </div>
          </div>
        )}

        {globalError && (
          <div className="rounded-md p-4 mb-4 text-[12px]" style={{
            background: "#fff0f0",
            border: "1px solid #e88",
            color: "#a22",
          }}>
            <div className="font-bold mb-1">오류</div>
            <div>{globalError}</div>
          </div>
        )}

        {/* sub 본문 */}
        {subList.map((sub) => (
          <section key={sub.subId} className="mb-8">
            <div className="text-[11px] tracking-[0.3em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
              {sub.chapter} · {String(sub.subId).padStart(2, "0")}/22
            </div>
            <h2 className="text-[18px] font-bold mb-3 pl-3"
              style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif", borderLeft: `3px solid ${THREAD}` }}>
              {sub.title}
            </h2>
            <div className="rounded-md p-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.88))",
                border: "1px solid rgba(212,169,107,0.4)",
                boxShadow: "0 8px 24px -12px rgba(178,40,71,0.14)",
              }}>
              <div className="text-[15px] leading-[2.0]"
                style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
                {sub.body
                  ? renderParagraphs(sub.body, GOLD)
                  : <span className="animate-pulse" style={{ color: GOLD }}>풀이 작성 중…</span>}
              </div>
              {sub.error && (
                <div className="mt-4 p-3 rounded text-[12px]" style={{ background: "#fff0f0", border: "1px solid #e88", color: "#a22" }}>
                  <div className="font-bold mb-1">오류: {sub.error}</div>
                  {sub.diagnostic && (
                    <div className="text-[11px] mt-1" style={{ color: "#a44" }}>
                      finishReason: {sub.diagnostic.finishReason ?? "-"} / blockReason: {sub.diagnostic.blockReason ?? "-"}
                    </div>
                  )}
                </div>
              )}
              {sub.done && !sub.error && (
                <div className="mt-4 text-[11px] text-right" style={{ color: GOLD }}>
                  ✓ 완성 · {sub.body.length}자
                </div>
              )}
            </div>
          </section>
        ))}

        {status === "done" && (
          <div className="text-[11px] text-center mt-8" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            ─ V3 검수 결과 · {subList.length}개 sub ─
          </div>
        )}
      </div>
    </div>
  );
}

export default function HongsilResultV3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#fff7f9", color: "#6b1e3a" }}>로딩 중…</div>}>
      <ResultV3Inner />
    </Suspense>
  );
}
