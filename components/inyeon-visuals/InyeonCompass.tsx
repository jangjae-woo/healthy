"use client";
// 시그니처 모티프: 나침반 — 8방위 + 강조 방위 + 화살표
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveInyeonCompass } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const CRIMSON = "#c83a4f";

// 화면 위쪽이 북, 시계방향
const DIR_POSITIONS: { name: string; hanja: string; angle: number }[] = [
  { name: "북방", hanja: "北", angle: 0 },
  { name: "동북", hanja: "艮", angle: 45 },
  { name: "동방", hanja: "東", angle: 90 },
  { name: "동남", hanja: "巽", angle: 135 },
  { name: "남방", hanja: "南", angle: 180 },
  { name: "서남", hanja: "坤", angle: 225 },
  { name: "서방", hanja: "西", angle: 270 },
  { name: "서북", hanja: "乾", angle: 315 },
];

export default function InyeonCompass({ saju }: { saju: SajuAnalysis }) {
  const data = deriveInyeonCompass(saju);
  if (!data) return null;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 82;
  // 강조 방위는 hanja 매칭
  const mainHanja = data.dirHanja;

  return (
    <div className="rounded-2xl p-5 mb-4 flex flex-col items-center" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-[11px] tracking-[0.3em] mb-3" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        緣方位圖 · 인연이 다가오는 자리
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 외곽 원 */}
        <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke={`${GOLD}33`} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${GOLD}55`} strokeWidth={1.5} />
        {/* 8방위 분할선 */}
        {DIR_POSITIONS.map((d, i) => {
          const ang = (d.angle - 90) * (Math.PI / 180);
          const x1 = cx + Math.cos(ang) * 18;
          const y1 = cy + Math.sin(ang) * 18;
          const x2 = cx + Math.cos(ang) * r;
          const y2 = cy + Math.sin(ang) * r;
          const isMain = d.hanja === mainHanja;
          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isMain ? GOLD : `${GOLD}22`}
                strokeWidth={isMain ? 1.5 : 0.8}
              />
              <text
                x={cx + Math.cos(ang) * (r + 22)}
                y={cy + Math.sin(ang) * (r + 22) + 5}
                textAnchor="middle"
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontSize: isMain ? 16 : 11,
                  fontWeight: isMain ? "bold" : "normal",
                  fill: isMain ? GOLD : `${ACCENT}77`,
                }}
              >
                {d.hanja}
              </text>
            </g>
          );
        })}
        {/* 강조 방위 화살표 */}
        {(() => {
          const main = DIR_POSITIONS.find((d) => d.hanja === mainHanja);
          if (!main) return null;
          const ang = (main.angle - 90) * (Math.PI / 180);
          const tipX = cx + Math.cos(ang) * (r - 6);
          const tipY = cy + Math.sin(ang) * (r - 6);
          const baseX = cx + Math.cos(ang) * 18;
          const baseY = cy + Math.sin(ang) * 18;
          // 화살표 머리
          const headAng1 = ang + Math.PI - 0.4;
          const headAng2 = ang + Math.PI + 0.4;
          const h1x = tipX + Math.cos(headAng1) * 14;
          const h1y = tipY + Math.sin(headAng1) * 14;
          const h2x = tipX + Math.cos(headAng2) * 14;
          const h2y = tipY + Math.sin(headAng2) * 14;
          return (
            <g>
              <line x1={baseX} y1={baseY} x2={tipX} y2={tipY} stroke={CRIMSON} strokeWidth={3} strokeLinecap="round" />
              <polygon points={`${tipX},${tipY} ${h1x},${h1y} ${h2x},${h2y}`} fill={CRIMSON} />
            </g>
          );
        })()}
        {/* 중앙 한자 向 */}
        <circle cx={cx} cy={cy} r={16} fill="#0a0510" stroke={`${GOLD}66`} strokeWidth={1} />
        <text
          x={cx} y={cy + 6}
          textAnchor="middle"
          style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: "bold", fill: GOLD }}
        >
          向
        </text>
      </svg>
      <div className="mt-3 text-center max-w-[300px]">
        <div className="text-[14px] font-bold mb-1" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
          {data.dirHanja}方 · {data.season} · {data.time}
        </div>
        <div className="text-[12px] leading-snug" style={{ color: "#e8dfc6" }}>
          {data.tone}
        </div>
      </div>
    </div>
  );
}
