"use client";
// 점수 카드 — 홍련(紅蓮) 연꽃잎 스타일
const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const GOLD_LIGHT = "#d4a96b";
const INK = "#1a0a14";
const INK_SOFT = "#2a1a20";

interface Props {
  score: number;
  label: string;
  caption?: string;
}

// 연꽃잎 SVG path (한 장)
function Petal({
  cx, cy, angle, size = 56, fill, stroke, strokeWidth = 1.5, opacity = 1,
}: {
  cx: number; cy: number; angle: number; size?: number;
  fill: string; stroke: string; strokeWidth?: number; opacity?: number;
}) {
  const half = size / 2;
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`} opacity={opacity}>
      <path
        d={`M ${cx} ${cy - size}
            C ${cx - half} ${cy - size + half * 0.6}, ${cx - half * 0.5} ${cy - half * 0.2}, ${cx} ${cy}
            C ${cx + half * 0.5} ${cy - half * 0.2}, ${cx + half} ${cy - size + half * 0.6}, ${cx} ${cy - size}
            Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function ScoreGauge({ score, label, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const tier =
    clamped < 40 ? "개선 여지가 있는 결" :
    clamped < 70 ? "괜찮은 결의 인연" :
    "운명적인 결의 인연";
  const tierColor = clamped < 40 ? "#8a5e2e" : clamped < 70 ? "#c8203a" : "#6b1e3a";
  const filledLevel = clamped / 100;
  const petals = [0, 1, 2, 3, 4].map((i) => {
    const start = i * 0.2;
    const end = (i + 1) * 0.2;
    if (filledLevel >= end) return 1;
    if (filledLevel <= start) return 0;
    return (filledLevel - start) / 0.2;
  });

  const cx = 130, cy = 145;
  const petalAngles = [0, 72, 144, 216, 288];
  const PETAL_FILLS = ["#ffd2dd", "#ff95b1", "#f06b8e", "#c2406a", "#b22847"];

  return (
    <div
      className="rounded-md p-6 flex flex-col items-center"
      style={{
        background: `
          radial-gradient(ellipse at 50% 100%, rgba(255,225,234,0.6) 0%, transparent 60%),
          linear-gradient(180deg, rgba(255,251,247,0.95) 0%, rgba(253,243,232,0.88) 100%)
        `,
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 8px 24px -12px rgba(178,40,71,0.18)",
      }}
    >
      {caption && (
        <div
          className="text-[12px] tracking-[0.3em] mb-3 font-bold"
          style={{ color: GOLD, fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {caption}
        </div>
      )}

      <svg width="260" height="240" viewBox="0 0 260 240">
        <defs>
          <radialGradient id="lotusCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7f9" />
            <stop offset="100%" stopColor="#ffe1ea" />
          </radialGradient>
          {petals.map((fillRatio, i) => (
            <linearGradient key={i} id={`petal${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={PETAL_FILLS[Math.min(4, Math.floor(filledLevel * 5))]} stopOpacity={0.4 + fillRatio * 0.6} />
              <stop offset="100%" stopColor={fillRatio > 0.5 ? THREAD : "#ffd2dd"} stopOpacity={0.3 + fillRatio * 0.6} />
            </linearGradient>
          ))}
        </defs>

        {/* 외곽 잎 5장 */}
        {petalAngles.map((ang, i) => (
          <Petal
            key={`out-${i}`}
            cx={cx} cy={cy}
            angle={ang}
            size={92}
            fill={petals[i] > 0 ? `url(#petal${i})` : "rgba(255,210,221,0.3)"}
            stroke={petals[i] > 0.3 ? `${THREAD}aa` : "rgba(212,169,107,0.4)"}
            strokeWidth={petals[i] > 0.5 ? 1.8 : 1}
          />
        ))}
        {/* 안쪽 잎 5장 (회전 36) */}
        {petalAngles.map((ang, i) => (
          <Petal
            key={`in-${i}`}
            cx={cx} cy={cy}
            angle={ang + 36}
            size={62}
            fill={petals[i] > 0.5 ? "#ff95b170" : "rgba(255,210,221,0.4)"}
            stroke={petals[i] > 0.5 ? `${PLUM}88` : "rgba(212,169,107,0.3)"}
            strokeWidth={1}
          />
        ))}

        {/* 가운데 원 */}
        <circle cx={cx} cy={cy} r="44" fill="url(#lotusCenter)" stroke={GOLD_LIGHT} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="38" fill="rgba(255,255,255,0.92)" />

        {/* 큰 점수 */}
        <text
          x={cx} y={cy + 4}
          textAnchor="middle"
          fontSize="44"
          fontWeight="900"
          fill={PLUM}
          fontFamily="'Nanum Myeongjo', serif"
          dominantBaseline="middle"
        >
          {clamped}
        </text>
        <text
          x={cx} y={cy + 32}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={THREAD}
          fontFamily="'Nanum Myeongjo', serif"
        >
          점
        </text>
      </svg>

      {/* 등급 라벨 */}
      <div
        className="mt-2 px-5 py-2 rounded-full text-[14px] font-bold"
        style={{
          background: `linear-gradient(135deg, ${tierColor}1a, ${tierColor}10)`,
          border: `1.5px solid ${tierColor}88`,
          color: tierColor,
          fontFamily: "'Nanum Myeongjo', serif",
        }}
      >
        {tier}
      </div>

      {/* AI 풀이 한 줄 */}
      <div
        className="mt-3 text-[14px] text-center px-4 leading-[1.7]"
        style={{ color: INK, fontFamily: "'Gowun Batang', serif", fontWeight: 500 }}
      >
        {label}
      </div>

      {/* 점수 구간 표시 */}
      <div
        className="mt-5 w-full pt-4"
        style={{ borderTop: "1px solid rgba(212,169,107,0.3)" }}
      >
        {[
          { range: "0~39", text: "개선 여지가 있어요", active: clamped < 40 },
          { range: "40~69", text: "괜찮은 궁합이에요", active: clamped >= 40 && clamped < 70 },
          { range: "70~100", text: "운명적인 궁합이에요", active: clamped >= 70 },
        ].map((t) => (
          <div
            key={t.range}
            className="flex items-center justify-between text-[13px] py-1.5 px-2 rounded"
            style={{
              color: t.active ? THREAD : INK_SOFT,
              fontWeight: t.active ? 700 : 500,
              fontFamily: "'Gowun Batang', serif",
              background: t.active ? `${THREAD}12` : "transparent",
              border: t.active ? `1px solid ${THREAD}55` : "1px solid transparent",
              marginBottom: 2,
            }}
          >
            <span style={{ fontFamily: "'Nanum Myeongjo', serif", fontWeight: t.active ? 800 : 600, fontSize: "13px" }}>
              {t.range}
            </span>
            <span>{t.text}</span>
            {t.active && <span style={{ color: THREAD, fontSize: "12px" }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
