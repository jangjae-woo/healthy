"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveAttraction } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

const ELEM_COLOR: Record<string, string> = {
  목: "#7dd87d",
  화: "#ff8a6b",
  토: "#d4b06b",
  금: "#cfd4dc",
  수: "#7da7d4",
};

export default function IlganAttractionMatrix({ saju }: { saju: SajuAnalysis }) {
  const rows = deriveAttraction(saju);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] py-2" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em", borderBottom: `1px solid ${ACCENT}1f` }}>
        본인 일간이 만나는 5 결
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5"
            style={{ borderBottom: i < rows.length - 1 ? `1px solid ${ACCENT}14` : undefined }}
          >
            <div
              className="text-[16px] font-bold leading-none flex-shrink-0 w-7 text-center"
              style={{ color: ELEM_COLOR[r.elem] || GOLD, fontFamily: "'Noto Serif KR', serif" }}
            >
              {r.hanja}
            </div>
            <div className="flex-shrink-0 w-[64px] text-[11px]" style={{ color: `${ACCENT}cc` }}>
              {r.rel}
            </div>
            <div className="text-[12px]" style={{ color: "#e8dfc6" }}>
              {r.meaning}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
