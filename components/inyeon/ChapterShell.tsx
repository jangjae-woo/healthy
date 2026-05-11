"use client";
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";

// 홍실(紅絲) 팔레트 — /love 랜딩과 통일
const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const GOLD_LIGHT = "#d4a96b";
const INK = "#2a1722";
const INK_SOFT = "#2a1a20";
const CREAM = "#fbf3e8";

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

  // 홍실 폰트 로드
  useEffect(() => {
    const id = "hongsil-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, #ffe1ea 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, #ffd9e3 0%, transparent 55%),
          radial-gradient(ellipse at 50% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 40%, #fce4d6 100%)
        `,
        backgroundAttachment: "fixed",
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <main className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col relative">
        {/* 헤더 — 홍실 톤 sticky */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0 sticky top-0 z-20"
          style={{
            borderBottom: `1px solid rgba(212,169,107,0.3)`,
            background: "rgba(255,247,249,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Link
            href={backHref}
            className="text-[13px]"
            style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}
          >
            ← paljawon
          </Link>
          <div className="flex-1 text-center">
            <div
              className="text-[10px] tracking-[0.4em]"
              style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
            >
              紅 絲
            </div>
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: PLUM, fontFamily: "'Cormorant Garamond', serif" }}>
            {chapterNo} / {totalChapters}
          </span>
          <button
            onClick={() => setShowToc((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-full transition-all"
            style={{
              background: `${THREAD}10`,
              border: `1px solid ${THREAD}55`,
              color: THREAD,
            }}
          >
            목차
          </button>
        </div>

        {/* TOC 드롭다운 — fixed */}
        {showToc && chapters && (
          <>
            <div className="fixed inset-0 z-30" style={{ background: "rgba(106,30,58,0.35)" }} onClick={() => setShowToc(false)} />
            <div
              className="fixed top-[58px] left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[464px] z-40 rounded-lg shadow-2xl overflow-y-auto max-h-[70vh]"
              style={{
                background: "linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(253,243,232,0.96) 100%)",
                border: `1px solid rgba(212,169,107,0.4)`,
                boxShadow: `0 24px 60px -16px rgba(178,40,71,0.25)`,
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid rgba(212,169,107,0.25)` }}
              >
                <span className="text-sm font-bold" style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif" }}>
                  목차
                </span>
                <button
                  onClick={() => setShowToc(false)}
                  style={{ color: GOLD, fontSize: 18, lineHeight: 1 }}
                >
                  ✕
                </button>
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
                      borderBottom: `1px solid rgba(212,169,107,0.15)`,
                      background: isCurrent ? `${THREAD}0d` : "transparent",
                      color: isCurrent ? THREAD : INK,
                    }}
                  >
                    <span className="text-[13px]" style={{ fontFamily: "'Gowun Batang', serif" }}>
                      제{c.no}장 · {c.label}
                    </span>
                    {isCurrent && <span className="text-[10px]" style={{ color: THREAD }}>●</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 챕터 타이틀 영역 */}
        <div className="px-4 pt-7 pb-3 text-center">
          <div
            className="text-[10px] tracking-[0.4em] uppercase mb-2"
            style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
          >
            Chapter {String(chapterNo).padStart(2, "0")}
          </div>
          <h1
            className="text-[19px] font-bold leading-snug"
            style={{
              color: INK,
              fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
              letterSpacing: "-0.01em",
            }}
          >
            {chapterTitle}
          </h1>
          <div
            className="mt-3 h-px mx-auto"
            style={{
              maxWidth: 80,
              background: `linear-gradient(90deg, transparent, ${GOLD_LIGHT}, transparent)`,
            }}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-4 flex flex-col pb-24">
          <div>{children}</div>
        </div>

        {/* sticky bottom nav */}
        <div
          className="flex-shrink-0 px-4 py-3 sticky bottom-0 z-20"
          style={{
            borderTop: `1px solid rgba(212,169,107,0.3)`,
            background: "rgba(255,247,249,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex gap-2">
            <button
              onClick={() => {
                onPrev?.();
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={!onPrev || chapterNo <= 1}
              className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: `${THREAD}1f`,
                border: `1px solid ${THREAD}55`,
                color: THREAD,
                fontFamily: "'Gowun Batang', serif",
                letterSpacing: "0.05em",
              }}
            >
              ‹  이전 챕터
            </button>
            <button
              onClick={() => {
                onNext?.();
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={!onNext || chapterNo >= totalChapters}
              className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: `${THREAD}1f`,
                border: `1px solid ${THREAD}55`,
                color: THREAD,
                fontFamily: "'Gowun Batang', serif",
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
