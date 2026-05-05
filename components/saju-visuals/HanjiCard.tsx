// ── 한지 도화지 카드 (Phase 1a — 검정 배경 위 한지 톤 카드) ──
// Phase 1b에서 전체 라이트 모드 전환 시 톤만 미세 조정 가능 (props variant 활용)
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;          // 카드 상단 제목 (운형 장식 좌우)
  variant?: "light" | "soft";  // light = 한지 베이지, soft = 회색 한지
  className?: string;
}

// Phase 1a — 검정 배경 위 한지 톤 (어두운 옅은 노랑 베이스, 빛바랜 종이 느낌)
// Phase 1b 전체 라이트 모드 전환 시 PALETTE.light를 밝은 한지로 swap 예정
const PALETTE = {
  light: {
    bg: "linear-gradient(180deg, #b5a88a 0%, #a09474 100%)",  // 빛바랜 한지 — 어두운 황토 톤
    border: "#5a4a2e",   // 깊은 갈색 테두리
    text: "#1f1a14",     // 진한 먹 톤
    accent: "#3a2c14",   // 짙은 황토 (운형 장식)
  },
  soft: {
    bg: "linear-gradient(180deg, #9e927a 0%, #87795f 100%)",  // 회색 도는 빛바랜 한지
    border: "#3a342a",
    text: "#1f1a14",
    accent: "#2c2620",
  },
} as const;

export default function HanjiCard({ children, title, variant = "light", className = "" }: Props) {
  const p = PALETTE[variant];
  return (
    <div
      className={`relative rounded-md p-5 ${className}`}
      style={{
        background: p.bg,
        border: `1px solid ${p.border}55`,
        boxShadow: `inset 0 0 0 1px ${p.border}22, 0 2px 12px rgba(0,0,0,0.25)`,
        color: p.text,
      }}
    >
      {/* 운형 장식 — 좌상·우상 코너 (양반사주·청월당 도화지 카드 모티프) */}
      <span
        aria-hidden="true"
        className="absolute"
        style={{
          top: 6, left: 8, fontSize: 13, color: p.accent, lineHeight: 1, opacity: 0.7,
          letterSpacing: "0.05em",
        }}
      >
        ︵︵
      </span>
      <span
        aria-hidden="true"
        className="absolute"
        style={{
          top: 6, right: 8, fontSize: 13, color: p.accent, lineHeight: 1, opacity: 0.7,
          letterSpacing: "0.05em",
        }}
      >
        ︵︵
      </span>
      {title && (
        <h3
          className="text-center font-bold mb-3"
          style={{ color: p.text, fontSize: 15, letterSpacing: "0.08em" }}
        >
          {title}
        </h3>
      )}
      <div style={{ color: p.text }}>{children}</div>
    </div>
  );
}

// 본문용 작은 인용/안내 박스 (도화지 안에 들어가는 강조 한 줄)
export function HanjiQuote({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded p-3 my-3 text-center"
      style={{
        background: "rgba(60,74,110,0.05)",
        border: "1px dashed #3c4a6e55",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: "#2a2622",
      }}
    >
      {children}
    </div>
  );
}
