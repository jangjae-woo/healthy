"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveEssenceKeywords } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";

export default function EssenceKeywords({ saju }: { saju: SajuAnalysis }) {
  const keywords = deriveEssenceKeywords(saju);
  if (keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {keywords.map((k, i) => (
        <div
          key={i}
          className="px-3 py-1.5 rounded-full text-[12px] font-medium"
          style={{
            background: `${GOLD}15`,
            border: `1px solid ${GOLD}55`,
            color: GOLD,
          }}
        >
          {k}
        </div>
      ))}
    </div>
  );
}
