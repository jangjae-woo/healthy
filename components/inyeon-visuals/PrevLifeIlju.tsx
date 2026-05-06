"use client";
// 시그니처 모티프: 두루마리(古卷) — 양 끝 끈 + 흑백 톤
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { derivePrevLifeIlju } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const PARCHMENT = "#1a1410";
const PARCHMENT_BORDER = "#5a4a30";

export default function PrevLifeIlju({ saju }: { saju: SajuAnalysis }) {
  const p = derivePrevLifeIlju(saju);
  return (
    <div className="mb-4">
      <div className="text-center text-[10px] tracking-[0.3em] mb-2" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        前生日柱 · 전생의 결
      </div>
      {/* 두루마리 — 양 끝 끈 + 본체 */}
      <div className="relative flex items-stretch">
        {/* 왼쪽 두루마리 끈 */}
        <div
          className="flex-shrink-0 w-3"
          style={{
            background: `linear-gradient(90deg, ${PARCHMENT_BORDER} 0%, ${PARCHMENT} 50%, ${PARCHMENT_BORDER} 100%)`,
            borderRadius: "3px 0 0 3px",
            border: `1px solid ${GOLD}44`,
          }}
        />
        {/* 본체 */}
        <div
          className="flex-1 px-5 py-5 text-center"
          style={{
            background: `linear-gradient(180deg, ${PARCHMENT} 0%, #0a0608 100%)`,
            borderTop: `1px solid ${GOLD}44`,
            borderBottom: `1px solid ${GOLD}44`,
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: "'Ma Shan Zheng', serif",
              fontSize: 56,
              color: "#cfc4a8",
              lineHeight: 1.1,
              letterSpacing: "0.1em",
              filter: "grayscale(0.5)",
              textShadow: `0 0 12px ${GOLD}33`,
            }}
          >
            {p.iljuHanja}
          </div>
          <div className="text-[11px] mt-1 mb-3" style={{ color: `${ACCENT}99`, fontFamily: "'Noto Serif KR', serif", letterSpacing: "0.15em" }}>
            {p.iljuHangul} 일주
          </div>
          <div
            className="text-[12px] leading-snug italic max-w-[300px] mx-auto"
            style={{ color: "#bfb39a", fontFamily: "'Noto Serif KR', serif" }}
          >
            {p.detail} · {p.tone}
          </div>
        </div>
        {/* 오른쪽 두루마리 끈 */}
        <div
          className="flex-shrink-0 w-3"
          style={{
            background: `linear-gradient(90deg, ${PARCHMENT_BORDER} 0%, ${PARCHMENT} 50%, ${PARCHMENT_BORDER} 100%)`,
            borderRadius: "0 3px 3px 0",
            border: `1px solid ${GOLD}44`,
          }}
        />
      </div>
    </div>
  );
}
