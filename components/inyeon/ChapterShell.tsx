"use client";
import { ReactNode } from "react";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

interface Props {
  chapterNo: number;
  chapterTitle: string;
  totalChapters: number;
  onPrev?: () => void;
  onNext?: () => void;
  onTOC?: () => void;
  children: ReactNode;
}

export default function ChapterShell({
  chapterNo, chapterTitle, totalChapters, onPrev, onNext, onTOC, children,
}: Props) {
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Top header band */}
      <div
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "rgba(42,26,29,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${ACCENT}22`,
        }}
      >
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center text-[10px] leading-tight text-center"
          style={{
            background: ACCENT,
            color: BG,
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
          }}
        >
          青月<br/>堂印
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[13px] font-bold truncate"
            style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
          >
            제{chapterNo}장: {chapterTitle}
          </div>
          <div className="text-[10px]" style={{ color: `${ACCENT}cc` }}>
            홍연아씨 사주궁합
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="max-w-md mx-auto px-4 py-6 pb-32">
        {children}
      </main>

      {/* Bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{
          background: "rgba(42,26,29,0.92)",
          backdropFilter: "blur(8px)",
          borderTop: `1px solid ${ACCENT}22`,
        }}
      >
        <button
          onClick={onTOC}
          className="flex flex-col items-center text-[10px]"
          style={{ color: `${ACCENT}cc` }}
        >
          <div className="text-lg leading-none mb-0.5">📖</div>
          목차
        </button>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={!onPrev || chapterNo <= 1}
            className="w-10 h-10 rounded-full text-sm transition-all"
            style={{
              background: onPrev && chapterNo > 1 ? `${ACCENT}22` : `${ACCENT}11`,
              border: `1px solid ${ACCENT}55`,
              color: onPrev && chapterNo > 1 ? "#fef3c7" : `${ACCENT}55`,
            }}
          >
            ‹
          </button>
          <button
            onClick={onNext}
            disabled={!onNext || chapterNo >= totalChapters}
            className="w-10 h-10 rounded-full text-sm transition-all"
            style={{
              background: onNext && chapterNo < totalChapters ? `${ACCENT}22` : `${ACCENT}11`,
              border: `1px solid ${ACCENT}55`,
              color: onNext && chapterNo < totalChapters ? "#fef3c7" : `${ACCENT}55`,
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
