"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveIdealType } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function IdealTypeCards({ saju }: { saju: SajuAnalysis }) {
  const items = deriveIdealType(saju);
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {items.map((it, i) => {
        const has = it.count > 0;
        return (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{
              background: has ? `${GOLD}15` : `${ACCENT}08`,
              border: `1px solid ${has ? `${GOLD}55` : `${ACCENT}22`}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div
                className="text-[14px] font-bold leading-none"
                style={{ color: has ? GOLD : `${ACCENT}66`, fontFamily: "'Noto Serif KR', serif" }}
              >
                {it.hanja}
              </div>
              <div className="text-[10px]" style={{ color: has ? `${GOLD}aa` : `${ACCENT}55` }}>
                {has ? `${it.count}개` : "—"}
              </div>
            </div>
            <div className="text-[11px] font-semibold mb-1" style={{ color: has ? GOLD : `${ACCENT}66` }}>
              {it.name}
            </div>
            <div className="text-[10px] leading-snug" style={{ color: has ? "#e8dfc6" : `${ACCENT}44` }}>
              {it.meaning}
            </div>
          </div>
        );
      })}
    </div>
  );
}
