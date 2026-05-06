"use client";
import { STEM_HANJA, BRANCH_HANJA, type SajuAnalysis } from "@/lib/saju-calculator";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function PillarTable({ saju }: { saju: SajuAnalysis }) {
  const { pillars, sipseong } = saju;
  const cols: { label: string; pillar: { stem: string; branch: string } | null; sip: { stem: string; branch: string } | null }[] = [
    { label: "時 시", pillar: pillars.hour, sip: sipseong.hour },
    { label: "日 일", pillar: pillars.day, sip: sipseong.day },
    { label: "月 월", pillar: pillars.month, sip: sipseong.month },
    { label: "年 년", pillar: pillars.year, sip: sipseong.year },
  ];

  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="grid grid-cols-4">
        {cols.map((c, i) => (
          <div
            key={i}
            className="p-3 text-center"
            style={{
              borderRight: i < cols.length - 1 ? `1px solid ${ACCENT}1f` : undefined,
            }}
          >
            <div className="text-[10px] mb-2" style={{ color: `${ACCENT}aa`, letterSpacing: "0.15em" }}>{c.label}</div>
            <div className="text-[20px] font-bold leading-none mb-0.5" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
              {c.pillar ? STEM_HANJA[c.pillar.stem as keyof typeof STEM_HANJA] || c.pillar.stem : "—"}
            </div>
            <div className="text-[10px] mb-2.5" style={{ color: `${ACCENT}88` }}>
              {c.sip?.stem || ""}
            </div>
            <div className="text-[20px] font-bold leading-none mb-0.5" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
              {c.pillar ? BRANCH_HANJA[c.pillar.branch as keyof typeof BRANCH_HANJA] || c.pillar.branch : "—"}
            </div>
            <div className="text-[10px]" style={{ color: `${ACCENT}88` }}>
              {c.sip?.branch || ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
