"use client";
// 점수 게이지 — 홍실 톤 (반원 게이지 + 큰 점수 + 단계 표시)
const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK = "#2a1722";
const INK_SOFT = "#5a3c4a";

interface Props {
  score: number;        // 0~100
  label: string;        // "합이 나쁘지 않아요!" 등
  caption?: string;     // 상단 작은 카피
}

export default function ScoreGauge({ score, label, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 100;
  const cx = 125;
  const cy = 125;
  const startAngle = Math.PI;       // 좌
  const angle = startAngle - (clamped / 100) * Math.PI;
  const x = cx + radius * Math.cos(angle);
  const y = cy - radius * Math.sin(angle);
  const arcStartX = cx - radius;
  const arcStartY = cy;
  const tier =
    clamped < 40 ? "개선 여지가 있는 결" :
    clamped < 70 ? "괜찮은 결의 인연" :
    "운명적인 결의 인연";

  return (
    <div
      className="rounded-md p-6 flex flex-col items-center"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95) 0%, rgba(253,243,232,0.88) 100%)",
        border: `1px solid rgba(212,169,107,0.35)`,
        boxShadow: `0 8px 24px -12px rgba(178,40,71,0.14)`,
      }}
    >
      {caption && (
        <div
          className="text-[11px] tracking-[0.4em] mb-3"
          style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
        >
          {caption}
        </div>
      )}

      <svg width="250" height="150" viewBox="0 0 250 150">
        {/* 배경 호 */}
        <path
          d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`}
          stroke="rgba(212,169,107,0.3)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {/* 진행 호 — 그라데이션 */}
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={PLUM} />
            <stop offset="100%" stopColor={THREAD} />
          </linearGradient>
        </defs>
        <path
          d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 0 1 ${x} ${y}`}
          stroke="url(#scoreGrad)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={9} fill={THREAD} stroke="#fff" strokeWidth={3} />
      </svg>

      {/* 큰 점수 */}
      <div className="-mt-6 flex items-baseline">
        <span
          className="text-[56px] font-black leading-none"
          style={{
            fontFamily: "'Nanum Myeongjo', serif",
            backgroundImage: `linear-gradient(180deg, ${PLUM} 0%, ${THREAD} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          {clamped}
        </span>
        <span className="text-[18px] ml-1.5 font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>점</span>
      </div>

      {/* 등급 라벨 */}
      <div
        className="mt-4 px-5 py-2 rounded-full text-[13px] font-bold"
        style={{
          background: `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)`,
          border: `1px solid ${THREAD}55`,
          color: PLUM,
          fontFamily: "'Gowun Batang', serif",
        }}
      >
        {tier}
      </div>

      {/* AI 풀이 한 줄 */}
      <div
        className="mt-3 text-[13px] text-center px-4"
        style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif", lineHeight: 1.7 }}
      >
        {label}
      </div>

      {/* 점수 구간 표시 */}
      <div
        className="mt-5 w-full pt-4"
        style={{ borderTop: `1px solid rgba(212,169,107,0.25)` }}
      >
        {[
          { range: "0~39", text: "개선 여지가 있어요", active: clamped < 40 },
          { range: "40~69", text: "괜찮은 궁합이에요", active: clamped >= 40 && clamped < 70 },
          { range: "70~100", text: "운명적인 궁합이에요", active: clamped >= 70 },
        ].map((tier) => (
          <div
            key={tier.range}
            className="flex items-center justify-between text-[12px] py-1.5"
            style={{
              color: tier.active ? THREAD : INK_SOFT,
              fontWeight: tier.active ? 700 : 400,
              fontFamily: "'Gowun Batang', serif",
              opacity: tier.active ? 1 : 0.55,
            }}
          >
            <span style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.05em" }}>{tier.range}</span>
            <span>{tier.text}</span>
            {tier.active && <span style={{ color: THREAD }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
