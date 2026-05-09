"use client";

const ACCENT = "#f0a8b8";
const BG_INNER = "#1a0d10";

export interface AssetPoint {
  phase: "초년기" | "청년기" | "중년기" | "말년기";
  value: number;
}

interface Props {
  title: string;
  points: AssetPoint[];
  unit?: string;
  color?: string;
}

export default function AssetCurve({ title, points, unit = "억", color = ACCENT }: Props) {
  const max = Math.max(...points.map(p => p.value), 1);
  const W = 320, H = 160, PADX = 32, PADY = 28;
  const stepX = (W - PADX * 2) / (points.length - 1);
  const norm = (v: number) => H - PADY - (v / max) * (H - PADY * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${PADX + i * stepX} ${norm(p.value)}`)
    .join(" ");

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${color}10, ${color}03)`, border: `1px solid ${color}33`, boxShadow: `0 4px 20px ${color}11` }}
    >
      <div
        className="text-sm font-bold mb-3"
        style={{ color: "#2a1722", fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.phase}>
            <circle
              cx={PADX + i * stepX}
              cy={norm(p.value)}
              r={4}
              fill={color}
            />
            <text
              x={PADX + i * stepX}
              y={norm(p.value) - 10}
              textAnchor="middle"
              fontSize={11}
              fill="#2a1722"
              fontWeight={600}
            >
              +{p.value}{unit}
            </text>
            <text
              x={PADX + i * stepX}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill={`${color}aa`}
            >
              {p.phase}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
