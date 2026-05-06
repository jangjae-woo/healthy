"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveCharmSinsal } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function CharmSinsalCards({ saju }: { saju: SajuAnalysis }) {
  const items = deriveCharmSinsal(saju);
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {items.map((it, i) => (
        <div
          key={i}
          className="rounded-lg p-3 text-center"
          style={{
            background: it.has ? `${GOLD}1a` : `${ACCENT}08`,
            border: `1px solid ${it.has ? `${GOLD}66` : `${ACCENT}22`}`,
          }}
        >
          <div
            className="text-[14px] font-bold leading-none mb-1"
            style={{ color: it.has ? GOLD : `${ACCENT}55`, fontFamily: "'Noto Serif KR', serif" }}
          >
            {it.hanja}
          </div>
          <div
            className="text-[11px] font-semibold mb-1"
            style={{ color: it.has ? GOLD : `${ACCENT}66` }}
          >
            {it.name}
          </div>
          <div className="text-[9px] leading-snug" style={{ color: it.has ? `${GOLD}cc` : `${ACCENT}44` }}>
            {it.has ? it.meaning : "보유 없음"}
          </div>
        </div>
      ))}
    </div>
  );
}
