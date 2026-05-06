"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { SajuAnalysis } from "@/lib/saju-calculator";

const ACCENT = "#d4a8e8";
const GOLD = "#e4b840";
const BG = "#1a0f20";

const CHAPTER_TITLES = [
  "홍도인의 첫마디",
  "당신은 어떤 결의 사람인가",
  "사랑할 때 당신의 결",
  "끌리는 사람의 결",
  "다가오는 인연의 자리",
  "인연이 흐르는 시기",
  "사랑에서 살펴볼 결",
  "홍도인의 마지막 당부",
];

const CHAPTER_HANJA = ["序", "本", "戀", "引", "遇", "時", "愼", "終"];

const CHAPTER_LABELS = [
  "序章",
  "第一章",
  "第二章",
  "第三章",
  "第四章",
  "第五章",
  "第六章",
  "終章",
];

interface Page { sub: string; body: string; }
interface Section { title: string; pages: Page[]; }

function parseSections(md: string): Section[] {
  if (!md) return [];
  const sections: Section[] = [];
  const parts = md.split(/\n##\s+/);
  for (let idx = 0; idx < parts.length; idx++) {
    const part = idx === 0 ? parts[0].replace(/^##\s+/, "") : parts[idx];
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const title = lines[0].trim();
    const rest = lines.slice(1).join("\n").trim();
    const subParts = rest.split(/\n###\s+/);
    const pages: Page[] = [];
    if (subParts.length === 1) {
      if (rest) pages.push({ sub: "", body: rest });
    } else {
      const intro = subParts[0].trim();
      if (intro) pages.push({ sub: "", body: intro });
      for (let i = 1; i < subParts.length; i++) {
        const subLines = subParts[i].split("\n");
        const sub = subLines[0].trim();
        const body = subLines.slice(1).join("\n").trim();
        if (sub || body) pages.push({ sub, body });
      }
    }
    sections.push({ title, pages });
  }
  return sections;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={key++} style={{ color: GOLD }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function SoloMatchingSlideResult() {
  const params = useSearchParams();
  const [content, setContent] = useState("");
  const [, setSaju] = useState<SajuAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);
  const fetchedRef = useRef(false);

  const myName = params.get("myName") || "당신";

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: "matching",
      section: "matching",
      myName,
      myGender: params.get("myGender") || "",
      myYear: params.get("myYear") || "",
      myMonth: params.get("myMonth") || "",
      myDay: params.get("myDay") || "",
      myHour: params.get("myHour") || "시간 모름",
      myCalendar: params.get("myCalendar") || "양력",
      contactFreq: params.get("contactFreq") || "",
      meetCount: params.get("meetCount") || "",
      soloReason: params.get("soloReason") || "",
    };

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) { setError(true); setLoading(false); return; }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (raw === "[DONE]") break outer;
            try {
              const msg = JSON.parse(raw);
              if (msg.t === "m" && msg.d) {
                setSaju(msg.d.sajuA);
                setLoading(false);
              } else if (msg.t === "x" && msg.v) {
                full += msg.v;
                setContent(full);
              }
            } catch {}
          }
        }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [params, myName]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapterIdx]);

  const sections = parseSections(content);
  const totalChapters = CHAPTER_TITLES.length;
  const cur = sections[chapterIdx];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
          <div className="text-sm" style={{ color: `${ACCENT}cc` }}>홍도인이 사주를 살피는 중입니다…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: BG }}>
        <div className="text-center">
          <div className="text-base mb-3" style={{ color: ACCENT }}>풀이를 가져오지 못했습니다.</div>
          <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-lg text-sm font-bold" style={{ background: GOLD, color: "#1a0d00" }}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)`, fontFamily: "'Gowun Batang', 'Noto Serif KR', serif" }}>
      <main className="w-full max-w-[480px] mx-auto px-5 py-8">
        {/* 상단 진행 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[11px] tracking-[0.18em]" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
            {chapterIdx + 1} / {totalChapters}
          </div>
          <div className="text-[10px]" style={{ color: `${ACCENT}66` }}>{myName}님의 인연</div>
        </div>

        {/* 챕터 cover */}
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.4em] mb-3" style={{ color: `${GOLD}cc`, fontFamily: "'Noto Serif KR', serif" }}>
            {CHAPTER_LABELS[chapterIdx]}
          </div>
          <div style={{ fontFamily: "'Ma Shan Zheng', serif", fontSize: 80, color: GOLD, lineHeight: 1, textShadow: `0 0 24px ${GOLD}55` }}>
            {CHAPTER_HANJA[chapterIdx]}
          </div>
          <h2 className="mt-4 text-lg font-bold" style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif", letterSpacing: "0.04em" }}>
            {CHAPTER_TITLES[chapterIdx]}
          </h2>
        </div>

        {/* 본문 */}
        {cur ? (
          <div className="flex flex-col gap-7 mb-10">
            {cur.pages.map((p, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}1f` }}>
                {p.sub && (
                  <div className="text-[14px] font-semibold mb-3" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
                    {p.sub}
                  </div>
                )}
                <div className="text-[14px] leading-[1.85]" style={{ color: "#e8dfc6" }}>
                  {p.body.split("\n\n").map((para, j) => (
                    <p key={j} className="mb-3 last:mb-0 whitespace-pre-wrap">{renderInline(para)}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm py-12" style={{ color: `${ACCENT}88` }}>
            이 장의 풀이를 받아오는 중입니다…
          </div>
        )}

        {/* 하단 nav */}
        <div className="flex items-center justify-between gap-3 mt-6 pb-6">
          <button onClick={() => setChapterIdx(Math.max(0, chapterIdx - 1))} disabled={chapterIdx === 0}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: chapterIdx === 0 ? `${ACCENT}0d` : `${ACCENT}1f`,
              color: chapterIdx === 0 ? `${ACCENT}55` : "white",
              border: `1px solid ${ACCENT}33`,
            }}>
            ‹ 이전 장
          </button>
          <button onClick={() => setChapterIdx(Math.min(totalChapters - 1, chapterIdx + 1))} disabled={chapterIdx === totalChapters - 1}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: chapterIdx === totalChapters - 1 ? `${ACCENT}0d` : "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)",
              color: chapterIdx === totalChapters - 1 ? `${ACCENT}55` : "#1a0d00",
              border: `1px solid ${ACCENT}33`,
            }}>
            다음 장 ›
          </button>
        </div>
      </main>
    </div>
  );
}
