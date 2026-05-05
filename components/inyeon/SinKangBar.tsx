"use client";
const ACCENT = "#f0a8b8";

const STAGES = ["극약", "태약", "신약", "중화", "신강", "태강", "극왕"] as const;
type Stage = typeof STAGES[number];

interface Props {
  ilgan: string;
  stage: Stage;
}

export default function SinKangBar({ ilgan, stage }: Props) {
  const idx = STAGES.indexOf(stage);
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(240,168,184,0.06)",
        border: `1px solid ${ACCENT}33`,
      }}
    >
      <div
        className="text-sm font-bold mb-4"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        신강신약
      </div>

      <div className="flex justify-between items-center mb-2 px-1">
        {STAGES.map((s, i) => {
          const opacity = 0.25 + (i / 6) * 0.75;
          const isActive = i === idx;
          return (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: isActive ? 18 : 12,
                height: isActive ? 18 : 12,
                background: ACCENT,
                opacity: isActive ? 1 : opacity,
                boxShadow: isActive ? `0 0 12px ${ACCENT}aa` : "none",
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] px-1" style={{ color: "#a39068" }}>
        {STAGES.map((s) => (
          <div key={s} style={{ color: s === stage ? ACCENT : "#a39068", fontWeight: s === stage ? 700 : 400 }}>
            {s}
          </div>
        ))}
      </div>

      <div
        className="mt-4 mx-auto px-4 py-2 rounded-lg text-center text-xs inline-flex w-full justify-center"
        style={{
          background: `${ACCENT}22`,
          border: `1px solid ${ACCENT}55`,
          color: "#fef3c7",
        }}
      >
        일간 <strong style={{ color: ACCENT }}>{ilgan}</strong>, <strong style={{ color: ACCENT }}>{stage}</strong>한 사주에요
      </div>
    </div>
  );
}
