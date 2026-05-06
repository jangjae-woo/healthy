"use client";
// 시그니처 모티프: 빨간 사각 인장(印章) — 한자 단독 임팩트
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveHeavenSinsal } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const CRIMSON = "#a63449";
const CRIMSON_BG = "#3a0f1a";

export default function HeavenSinsal({ saju }: { saju: SajuAnalysis }) {
  const s = deriveHeavenSinsal(saju);
  return (
    <div className="rounded-2xl p-5 mb-4 flex flex-col items-center" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-[11px] tracking-[0.3em] mb-4" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        天賜貴緣 · 사주에 살아있는 인연 표식
      </div>
      {/* 빨간 사각 인장 */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 140,
          height: 140,
          background: `linear-gradient(135deg, ${CRIMSON_BG} 0%, #1a0510 100%)`,
          border: `3px solid ${CRIMSON}`,
          boxShadow: `0 0 20px ${CRIMSON}44, inset 0 0 12px ${CRIMSON}22`,
        }}
      >
        {/* 모서리 장식 */}
        {[
          { top: 6, left: 6 },
          { top: 6, right: 6 },
          { bottom: 6, left: 6 },
          { bottom: 6, right: 6 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2"
            style={{ background: GOLD, ...pos }}
          />
        ))}
        <div
          style={{
            fontFamily: "'Ma Shan Zheng', serif",
            fontSize: s.hanja.length >= 4 ? 24 : 36,
            color: "#ffe9aa",
            lineHeight: 1.05,
            letterSpacing: "0.05em",
            textAlign: "center",
            textShadow: `0 0 8px ${GOLD}66`,
            whiteSpace: "pre-wrap",
            padding: "0 8px",
          }}
        >
          {s.hanja}
        </div>
      </div>
      <div className="mt-4 text-center">
        <div className="text-[13px] font-bold mb-1.5" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
          {s.name}
        </div>
        <div className="text-[12px] leading-snug max-w-[280px]" style={{ color: "#e8dfc6" }}>
          {s.tone}
        </div>
      </div>
    </div>
  );
}
