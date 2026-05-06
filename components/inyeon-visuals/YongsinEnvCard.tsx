"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveYongsinEnv } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

export default function YongsinEnvCard({ saju }: { saju: SajuAnalysis }) {
  const env = deriveYongsinEnv(saju);
  if (!env) return null;
  return (
    <div className="rounded-xl p-4 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[22px] font-bold flex-shrink-0"
          style={{ background: `${GOLD}1a`, color: GOLD, fontFamily: "'Noto Serif KR', serif", border: `1px solid ${GOLD}55` }}
        >
          {ELEM_HANJA[env.elem]}
        </div>
        <div>
          <div className="text-[10px]" style={{ color: `${ACCENT}99`, letterSpacing: "0.15em" }}>用神 환경</div>
          <div className="text-[14px] font-bold" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
            {env.elem} 기운이 가까운 자리
          </div>
        </div>
      </div>
      <div className="space-y-1.5 text-[12px]" style={{ color: "#e8dfc6" }}>
        <div><span style={{ color: `${ACCENT}aa` }}>· 시간 — </span>{env.time}</div>
        <div><span style={{ color: `${ACCENT}aa` }}>· 공간 — </span>{env.space}</div>
        <div><span style={{ color: `${ACCENT}aa` }}>· 활동 — </span>{env.activity}</div>
      </div>
    </div>
  );
}
