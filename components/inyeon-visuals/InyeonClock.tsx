"use client";
// 시그니처 모티프: 원형 시계 (12분할 마커 + 중앙 한자 + 카운트다운)
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveInyeonClock } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const CRIMSON = "#c83a4f";

export default function InyeonClock({ saju, currentAge }: { saju: SajuAnalysis; currentAge: number }) {
  const data = deriveInyeonClock(saju, currentAge);
  if (!data) return null;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 88;
  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="rounded-2xl p-5 mb-4 flex flex-col items-center" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-[11px] tracking-[0.3em] mb-3" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        運命時計 · 다가오는 인연 시기
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 외곽 원 */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${GOLD}55`} strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke={`${GOLD}22`} strokeWidth={0.8} />
        {/* 12 분할 마커 */}
        {ticks.map((i) => {
          const ang = (i * 30 - 90) * (Math.PI / 180);
          const isQuarter = i % 3 === 0;
          const x1 = cx + Math.cos(ang) * (r - (isQuarter ? 12 : 6));
          const y1 = cy + Math.sin(ang) * (r - (isQuarter ? 12 : 6));
          const x2 = cx + Math.cos(ang) * r;
          const y2 = cy + Math.sin(ang) * r;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isQuarter ? GOLD : `${GOLD}66`}
              strokeWidth={isQuarter ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {/* 12시 위치 빨간 강조 마커 (=인연 침) */}
        <circle cx={cx} cy={cy - r + 4} r={4} fill={CRIMSON} />
        {/* 중앙 한자 */}
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          style={{ fontFamily: "'Ma Shan Zheng', serif", fontSize: 56, fill: GOLD }}
        >
          時
        </text>
      </svg>
      <div className="mt-4 text-center">
        <div className="text-[14px] font-bold mb-1" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
          {data.age}세 무렵 · <span style={{ color: CRIMSON }}>{data.yearsFromNow}년 후</span>
        </div>
        <div className="text-[12px]" style={{ color: `${ACCENT}cc` }}>
          {data.hanja} 대운 — {data.tone}
        </div>
      </div>
    </div>
  );
}
