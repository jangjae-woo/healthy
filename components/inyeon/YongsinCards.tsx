"use client";
const ACCENT = "#f0a8b8";
const ELEM_COLOR: Record<string, string> = {
  목: "#7fbf7f", 화: "#e88a8a", 토: "#d4b074", 금: "#bfbfbf", 수: "#7a9bbf",
  木: "#7fbf7f", 火: "#e88a8a", 土: "#d4b074", 金: "#bfbfbf", 水: "#7a9bbf",
};
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

interface Props {
  yongsin: string;
  huisin: string;
  gisin: string;
}

function Card({ kind, elem }: { kind: string; elem: string }) {
  const e = elem.replace(/[()水木火土金]/g, (m) => m); // pass through
  const display = ELEM_HANJA[elem] || elem;
  const color = ELEM_COLOR[elem] || "#fff";
  return (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col items-center"
      style={{
        background: `${color}11`,
        border: `1px solid ${color}66`,
      }}
    >
      <div className="text-[11px] mb-2" style={{ color: `${ACCENT}cc` }}>
        {kind}
      </div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1"
        style={{
          background: `${color}22`,
          border: `1px solid ${color}88`,
          color: "#fef3c7",
          fontFamily: "'Noto Serif KR', serif",
        }}
      >
        {display}
      </div>
      <div className="text-xs" style={{ color: "#d6cdb8" }}>
        {elem}
      </div>
    </div>
  );
}

export default function YongsinCards({ yongsin, huisin, gisin }: Props) {
  return (
    <div className="flex gap-2">
      <Card kind="용신" elem={yongsin} />
      <Card kind="희신" elem={huisin} />
      <Card kind="기신" elem={gisin} />
    </div>
  );
}
