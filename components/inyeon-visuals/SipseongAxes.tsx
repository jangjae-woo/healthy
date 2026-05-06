"use client";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveSipseongAxes } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";

const AXIS_LABELS: { key: keyof ReturnType<typeof deriveSipseongAxes>; hanja: string; meaning: string }[] = [
  { key: "비겁", hanja: "比劫", meaning: "스스로 나서는 결" },
  { key: "식상", hanja: "食傷", meaning: "표현하고 펼치는 결" },
  { key: "재성", hanja: "財星", meaning: "끌어당기고 가지는 결" },
  { key: "관성", hanja: "官星", meaning: "다듬고 단련되는 결" },
  { key: "인성", hanja: "印星", meaning: "받아들이고 품는 결" },
];

export default function SipseongAxes({ saju }: { saju: SajuAnalysis }) {
  const counts = deriveSipseongAxes(saju);
  const max = Math.max(1, ...AXIS_LABELS.map((a) => counts[a.key]));
  return (
    <div className="rounded-xl p-3 mb-4" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center text-[10px] mb-3" style={{ color: `${ACCENT}aa`, letterSpacing: "0.18em" }}>
        十星 — 사랑의 다섯 동력
      </div>
      <div className="flex flex-col gap-2">
        {AXIS_LABELS.map((a) => {
          const v = counts[a.key];
          const pct = (v / max) * 100;
          return (
            <div key={a.key} className="flex items-center gap-2">
              <div className="text-[12px] font-semibold w-9 flex-shrink-0" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
                {a.hanja}
              </div>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: `${ACCENT}10` }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, pct)}%`, background: `linear-gradient(90deg, ${GOLD}aa 0%, ${GOLD} 100%)` }}
                />
              </div>
              <div className="text-[10px] w-8 text-right" style={{ color: `${ACCENT}99` }}>
                {v}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
