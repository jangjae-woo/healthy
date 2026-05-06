"use client";
// 청월당 PDF 스타일 반원 점수 게이지 — 우리 톤(파스텔 핑크)에 맞춤
const ACCENT = "#f0a8b8";
const ACCENT_DEEP = "#d4889a";

interface Props {
  score: number;        // 0~100
  label: string;        // "합이 나쁘지 않아요!" 등
  caption?: string;     // 상단 작은 카피
}

export default function ScoreGauge({ score, label, caption }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 90;
  const cx = 110;
  const cy = 110;
  const startAngle = Math.PI;       // 좌
  const endAngle = 0;               // 우
  const angle = startAngle - (clamped / 100) * Math.PI;
  const x = cx + radius * Math.cos(angle);
  const y = cy - radius * Math.sin(angle);
  const largeArc = 0;
  const arcStartX = cx - radius;
  const arcStartY = cy;

  return (
    <div
      className="rounded-3xl p-6 flex flex-col items-center"
      style={{
        background: "rgba(240,168,184,0.06)",
        border: `1px solid ${ACCENT}33`,
      }}
    >
      {caption && (
        <div
          className="text-[11px] tracking-widest uppercase mb-2"
          style={{ color: `${ACCENT}cc`, fontFamily: "'Cormorant Garamond', serif" }}
        >
          {caption}
        </div>
      )}
      <svg width="220" height="130" viewBox="0 0 220 130">
        <path
          d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`}
          stroke={`${ACCENT}33`}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`}
          stroke={ACCENT}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={7} fill={ACCENT_DEEP} />
        <circle cx={x} cy={y} r={3} fill="#fff" />
      </svg>
      <div
        className="text-4xl font-bold -mt-2"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {clamped}
        <span className="text-base ml-1" style={{ color: `${ACCENT}cc` }}>점</span>
      </div>
      <div
        className="mt-3 px-4 py-1.5 rounded-full text-xs"
        style={{
          background: `${ACCENT}22`,
          border: `1px solid ${ACCENT}55`,
          color: "#fef3c7",
        }}
      >
        {label}
      </div>
      <div className="mt-4 w-full text-[11px] flex justify-between" style={{ color: "#a39068" }}>
        <span>0~39: 개선 여지가 있어요</span>
      </div>
      <div className="w-full text-[11px] flex justify-between" style={{ color: "#a39068" }}>
        <span>40~69: 괜찮은 궁합이에요</span>
      </div>
      <div className="w-full text-[11px] flex justify-between" style={{ color: "#a39068" }}>
        <span>70~100: 운명적인 궁합이에요</span>
      </div>
    </div>
  );
}
