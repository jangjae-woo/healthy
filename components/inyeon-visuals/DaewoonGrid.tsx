"use client";
import { STEM_HANJA, BRANCH_HANJA, type SajuAnalysis } from "@/lib/saju-calculator";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function DaewoonGrid({ saju }: { saju: SajuAnalysis }) {
  const cycles = saju.daeun?.cycles ?? [];
  if (cycles.length === 0) return null;

  return (
    <div className="rounded-xl p-3 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] mb-3" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em" }}>
        大運 — 십 년 단위 흐름
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {cycles.map((c, i) => {
          const stemHanja = STEM_HANJA[c.stem as keyof typeof STEM_HANJA] || c.stem;
          const branchHanja = BRANCH_HANJA[c.branch as keyof typeof BRANCH_HANJA] || c.branch;
          return (
            <div
              key={i}
              className="p-2 rounded-lg text-center"
              style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}22` }}
            >
              <div className="text-[9px] mb-1" style={{ color: `${ACCENT}88` }}>{c.age}세</div>
              <div
                className="text-[16px] font-bold"
                style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif", lineHeight: 1.2 }}
              >
                {stemHanja}{branchHanja}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
