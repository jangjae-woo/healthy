"use client";
import { SEUN_4 } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function SeunGrid() {
  return (
    <div className="rounded-xl p-3 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] mb-3" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em" }}>
        歲運 — 다가오는 네 해의 결
      </div>
      <div className="grid grid-cols-4 gap-2">
        {SEUN_4.map((s) => (
          <div
            key={s.year}
            className="p-2.5 rounded-lg text-center"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}22` }}
          >
            <div className="text-[10px] mb-1" style={{ color: `${ACCENT}88` }}>{s.year}</div>
            <div
              className="text-[18px] font-bold leading-none"
              style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}
            >
              {s.hanja}
            </div>
            <div className="text-[9px] mt-1" style={{ color: `${ACCENT}66` }}>{s.ganji}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
