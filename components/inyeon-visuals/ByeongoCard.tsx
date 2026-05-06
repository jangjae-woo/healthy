"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveByeongo } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

export default function ByeongoCard({ saju }: { saju: SajuAnalysis }) {
  const b = deriveByeongo(saju);
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] mb-3" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em" }}>
        2026 丙午 — 올해의 결
      </div>
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="text-center">
          <div className="text-[10px] mb-1" style={{ color: `${ACCENT}88` }}>본인</div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] font-bold"
            style={{ background: `${GOLD}1a`, color: GOLD, fontFamily: "'Noto Serif KR', serif", border: `1px solid ${GOLD}55` }}
          >
            {ELEM_HANJA[b.selfElem] || "?"}
          </div>
        </div>
        <div className="text-[16px]" style={{ color: `${ACCENT}aa` }}>↔</div>
        <div className="text-center">
          <div className="text-[10px] mb-1" style={{ color: `${ACCENT}88` }}>2026</div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] font-bold"
            style={{ background: `${GOLD}1a`, color: GOLD, fontFamily: "'Noto Serif KR', serif", border: `1px solid ${GOLD}55` }}
          >
            {ELEM_HANJA[b.yearElem]}
          </div>
        </div>
      </div>
      <div className="text-center text-[12px] font-semibold mb-1" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
        {b.rel}
      </div>
      <div className="text-center text-[12px]" style={{ color: "#e8dfc6" }}>
        {b.meaning}
      </div>
    </div>
  );
}
