"use client";
// 오행 분포 — 원형 노드 + 막대 비율
const ACCENT = "#f0a8b8";
const ELEM = ["목", "화", "토", "금", "수"] as const;
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_COLOR: Record<string, string> = {
  목: "#7fbf7f", 화: "#e88a8a", 토: "#d4b074", 금: "#bfbfbf", 수: "#7a9bbf",
};

interface Props {
  name: string;
  counts: Record<string, number>;     // {목:2, 화:1, 토:3, 금:1, 수:1}
  ratios: Record<string, number>;     // {목:18.2, ...}
}

function ratioLabel(r: number): string {
  if (r === 0) return "결핍";
  if (r < 10) return "부족";
  if (r < 20) return "적정";
  if (r < 30) return "발달";
  return "과다";
}

export default function OhaengChart({ name, counts, ratios }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(240,168,184,0.06)",
        border: `1px solid ${ACCENT}33`,
      }}
    >
      <div
        className="text-sm font-bold mb-3"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {name}님의 오행 분포
      </div>

      <div className="flex items-end justify-around mb-5">
        {ELEM.map((e) => (
          <div key={e} className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{
                background: `${ELEM_COLOR[e]}22`,
                border: `1px solid ${ELEM_COLOR[e]}88`,
                color: "#fef3c7",
                fontFamily: "'Noto Serif KR', serif",
              }}
            >
              {ELEM_HANJA[e]}
            </div>
            <div className="text-[11px] mt-1" style={{ color: `${ACCENT}cc` }}>
              {counts[e] ?? 0}개
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] mb-2" style={{ color: "#a39068" }}>
        오행 비율 (총 {total})
      </div>
      <div className="flex flex-col gap-2">
        {ELEM.map((e) => {
          const r = ratios[e] ?? 0;
          return (
            <div key={e} className="flex items-center gap-2">
              <div className="w-8 text-xs" style={{ color: ELEM_COLOR[e] }}>
                {e} {ELEM_HANJA[e]}
              </div>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: `${ACCENT}22` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, r)}%`,
                    background: ELEM_COLOR[e],
                  }}
                />
              </div>
              <div className="w-20 text-right text-[11px]" style={{ color: "#d6cdb8" }}>
                {r.toFixed(1)}% · {ratioLabel(r)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
