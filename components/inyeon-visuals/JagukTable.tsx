"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveJaguk } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

export default function JagukTable({ saju }: { saju: SajuAnalysis }) {
  const items = deriveJaguk(saju);
  return (
    <div className="rounded-xl p-3 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] mb-3" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em" }}>
        刺戟 — 변화를 부르는 결
      </div>
      {items.length === 0 ? (
        <div className="text-center text-[12px] py-2" style={{ color: `${ACCENT}77` }}>
          본인 사주 안에 두드러진 자극의 결은 없습니다
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}33` }}
            >
              <div className="text-[14px] font-bold flex-shrink-0" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
                {it.pair}
              </div>
              <div className="text-[10px] flex-shrink-0" style={{ color: `${ACCENT}99` }}>{it.hangul}</div>
              <div className="text-[12px]" style={{ color: "#e8dfc6" }}>{it.meaning}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
