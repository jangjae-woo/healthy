// ── 한지 도화지 카드 (Phase 1a — 검정 배경 위 한지 톤 카드) ──
// Phase 1b에서 전체 라이트 모드 전환 시 톤만 미세 조정 가능 (props variant 활용)
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;          // 카드 상단 제목 (운형 장식 좌우)
  variant?: "light" | "soft";  // light = 한지 베이지, soft = 회색 한지
  className?: string;
}

const PALETTE = {
  light: {
    bg: "linear-gradient(180deg, #f5efdf 0%, #ede4cd 100%)",  // 한지 베이지 톤
    border: "#3c4a6e",   // 청월당 풍 네이비
    text: "#2a2622",     // 먹 톤
    accent: "#8b6f3a",   // 황토 (운형 장식)
  },
  soft: {
    bg: "linear-gradient(180deg, #ece6d8 0%, #ddd5c2 100%)",  // 살짝 회색 도는 한지
    border: "#4a4a4a",
    text: "#2a2622",
    accent: "#5a5a5a",
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
