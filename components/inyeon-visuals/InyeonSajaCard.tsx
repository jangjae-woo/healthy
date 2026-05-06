"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveSaja } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function InyeonSajaCard({ saju }: { saju: SajuAnalysis }) {
  const s = deriveSaja(saju);
  return (
    <div
      className="rounded-2xl p-6 mb-4 text-center"
      style={{
        background: `linear-gradient(135deg, ${GOLD}1a 0%, ${GOLD}08 100%)`,
        border: `1px solid ${GOLD}55`,
      }}
    >
      <div
        style={{
          fontFamily: "'Ma Shan Zheng', serif",
          fontSize: 48,
          color: GOLD,
          lineHeight: 1.1,
          textShadow: `0 0 16px ${GOLD}44`,
          letterSpacing: "0.08em",
        }}
      >
        {s.saja}
      </div>
      <div
        className="mt-2 text-[12px] tracking-[0.18em]"
        style={{ color: `${ACCENT}cc`, fontFamily: "'Noto Serif KR', serif" }}
      >
        {s.hangul}
      </div>
      <div
        className="mt-3 text-[13px] leading-snug"
        style={{ color: "#e8dfc6", fontFamily: "'Noto Serif KR', serif" }}
      >
        {s.meaning}
      </div>
    </div>
  );
}
