"use client";
// 시그니처 모티프: 5각 별/오망성 — 5 오행 방사 + 메인 1 강조
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveInyeonCoord } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const CRIMSON = "#c83a4f";

const ELEM_COLOR: Record<string, string> = {
  목: "#7dd87d",
  화: "#ff8a6b",
  토: "#d4b06b",
  금: "#cfd4dc",
  수: "#7da7d4",
};

const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

export default function InyeonCoordinate({ saju }: { saju: SajuAnalysis }) {
  const data = deriveInyeonCoord(saju);
  if (!data.main) return null;
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;

  // 5 오행 방사 위치 (오각 별)
  const elems = ["목", "화", "토", "금", "수"];
  const positions = elems.map((elem, i) => {
    const ang = (i * 72 - 90) * (Math.PI / 180);
    return {
      elem,
      x: cx + Math.cos(ang) * r,
      y: cy + Math.sin(ang) * r,
      isMain: elem === data.main!.elem,
    };
  });

  return (
    <div className="rounded-2xl p-5 mb-4 flex flex-col items-center" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-[11px] tracking-[0.3em] mb-3" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        緣分坐標 · 가장 강하게 흔드는 결
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 별 폴리곤 (5각 연결) */}
        <polygon
          points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={`${GOLD}33`}
          strokeWidth={1}
        />
        {/* 별 내부 5각 (오망성) */}
        <polygon
          points={positions.map((_, i) => positions[(i * 2) % 5]).map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={`${GOLD}22`}
          strokeWidth={0.8}
        />
        {/* 메인 위치에 글로우 */}
        {positions.map((p) =>
          p.isMain ? (
            <circle
              key={`glow-${p.elem}`}
              cx={p.x} cy={p.y} r={28}
              fill={ELEM_COLOR[p.elem] || GOLD}
              opacity={0.18}
            />
          ) : null
        )}
        {/* 5 오행 마커 */}
        {positions.map((p) => (
          <g key={p.elem}>
            <circle
              cx={p.x} cy={p.y}
              r={p.isMain ? 22 : 14}
              fill={p.isMain ? ELEM_COLOR[p.elem] : "#0a0510"}
              stroke={p.isMain ? GOLD : `${ELEM_COLOR[p.elem]}88`}
              strokeWidth={p.isMain ? 2 : 1}
            />
            <text
              x={p.x} y={p.y + (p.isMain ? 7 : 5)}
              textAnchor="middle"
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: p.isMain ? 22 : 13,
                fontWeight: "bold",
                fill: p.isMain ? "#1a0f0a" : ELEM_COLOR[p.elem],
              }}
            >
              {ELEM_HANJA[p.elem]}
            </text>
          </g>
        ))}
        {/* 중앙 본인 일간 */}
        <circle cx={cx} cy={cy} r={8} fill={CRIMSON} />
        <text
          x={cx} y={cy + 24}
          textAnchor="middle"
          style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 9, fill: `${ACCENT}99`, letterSpacing: "0.15em" }}
        >
          나
        </text>
      </svg>
      <div className="mt-3 text-center max-w-[280px]">
        <div className="text-[14px] font-bold mb-1" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
          {data.main.elem}({data.main.hanja})의 결
        </div>
        <div className="text-[10px] mb-1.5" style={{ color: `${ACCENT}aa` }}>{data.main.rel}</div>
        <div className="text-[12px] leading-snug" style={{ color: "#e8dfc6" }}>
          {data.main.tone}
        </div>
      </div>
    </div>
  );
}
