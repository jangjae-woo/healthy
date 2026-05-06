"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

export interface ChapterEntry {
  no: number;
  label: string;
}

interface Props {
  chapterNo: number;
  chapterTitle: string;
  totalChapters: number;
  chapters?: ChapterEntry[];
  onPrev?: () => void;
  onNext?: () => void;
  onSelect?: (no: number) => void;
  backHref?: string;
  children: ReactNode;
}

export default function ChapterShell({
  chapterNo, chapterTitle, totalChapters, chapters, onPrev, onNext, onSelect,
  backHref = "/inyeon/form", children,
}: Props) {
  const [showToc, setShowToc] = useState(false);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #150810 100%)` }}
    >
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* 헤더 — 자도인 톤 */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${ACCENT}18` }}
        >
          <Link href={backHref} className="text-sm" style={{ color: `${ACCENT}88` }}>←</Link>
          <div className="flex-1 text-sm font-bold text-white">홍연(紅蓮) 인연궁합</div>
          <span className="text-[11px] tabular-nums" style={{ color: `${ACCENT}77` }}>
            {chapterNo} / {totalChapters}
          </span>
          <button
            onClick={() => setShowToc((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-xl transition-all"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
          >
            목차 ↓
          </button>
        </div>

        {/* TOC 드롭다운 */}
        {showToc && chapters && (
          <div
            className="absolute top-14 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden max-w-[80vw]"
            style={{ backgroundColor: "#0c0510", border: `1px solid ${ACCENT}33`, minWidth: "220px" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${ACCENT}18` }}
            >
              <span className="text-sm font-bold text-white">목차</span>
              <button onClick={() => setShowToc(false)} style={{ color: `${ACCENT}77` }}>✕</button>
            </div>
            {chapters.map((c) => {
              const isCurrent = chapterNo === c.no;
              return (
                <button
                  key={c.no}
                  onClick={() => {
                    onSelect?.(c.no);
                    setShowToc(false);
                    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                  style={{
                    borderBottom: `1px solid ${ACCENT}0d`,
                    backgroundColor: isCurrent ? `${ACCENT}15` : "transparent",
                    color: isCurrent ? ACCENT : "white",
                  }}
                >
                  <span className="text-xs">제{c.no}장 · {c.label}</span>
                  {isCurrent && <span className="text-[10px]" style={{ color: ACCENT }}>●</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* 챕터 타이틀 영역 (자도인 톤의 가운데 정렬 부제) */}
        <div className="px-4 pt-6 pb-2 text-center">
          <div
            className="text-[10px] tracking-[0.4em] uppercase mb-2"
            style={{ color: `${ACCENT}aa`, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Chapter {String(chapterNo).padStart(2, "0")}
          </div>
          <h1
            className="text-lg font-bold"
            style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif", letterSpacing: "0.05em" }}
          >
            {chapterTitle}
          </h1>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-4 flex flex-col">
          <div>{children}</div>

          {/* 인라인 챕터 nav (자도인 동일 톤) */}
          <div className="mt-8 mb-8 flex items-center gap-3 px-2">
            <button
              onClick={onPrev}
              disabled={!onPrev || chapterNo <= 1}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: !onPrev || chapterNo <= 1 ? "rgba(255,255,255,0.04)" : `${ACCENT}18`,
                border: `1px solid ${!onPrev || chapterNo <= 1 ? "rgba(255,255,255,0.08)" : `${ACCENT}55`}`,
                color: !onPrev || chapterNo <= 1 ? "rgba(255,255,255,0.3)" : ACCENT,
                letterSpacing: "0.05em",
              }}
            >
              ‹  이전 챕터
            </button>
            <button
              onClick={onNext}
              disabled={!onNext || chapterNo >= totalChapters}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: !onNext || chapterNo >= totalChapters
                  ? "rgba(255,255,255,0.04)"
                  : `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                border: `1px solid ${!onNext || chapterNo >= totalChapters ? "rgba(255,255,255,0.08)" : ACCENT}`,
                color: !onNext || chapterNo >= totalChapters ? "rgba(255,255,255,0.3)" : BG,
                letterSpacing: "0.05em",
              }}
            >
              다음 챕터  ›
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
