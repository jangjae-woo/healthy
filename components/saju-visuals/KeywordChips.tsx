// ── 자녀 본질 키워드 칩 (Phase 1 — 양반사주 채택+변형) ──
// 양반사주 #성장 #확장 #도전 → paljawon 자원 톤 (#탐구 #끈기 #포용)
// 격국·신강신약·일간 오행 기반 자동 매핑 (결정론, AI 출력 X)

import type { ElementKey } from "@/lib/saju-symbols";

interface Props {
  keywords: string[];      // 외부에서 자동 도출된 자녀 키워드 (3~5개)
  variant?: "dark" | "light";
  size?: "sm" | "md";
}

export default function KeywordChips({ keywords, variant = "dark", size = "md" }: Props) {
  if (!keywords || keywords.length === 0) return null;
  const isDark = variant === "dark";
  const fontSize = size === "sm" ? 10.5 : 12;
  const padX = size === "sm" ? 8 : 10;
  const padY = size === "sm" ? 3 : 4;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keywords.map((kw, i) => {
        const palette = chipPalette(i, isDark);
        return (
          <span
            key={`${kw}-${i}`}
            className="rounded-full font-medium"
            style={{
              fontSize,
              padding: `${padY}px ${padX}px`,
              background: palette.bg,
              color: palette.fg,
              border: `1px solid ${palette.border}`,
              letterSpacing: "0.02em",
            }}
          >
            #{kw}
          </span>
        );
      })}
    </div>
  );
}

// 칩 팔레트 — 5색 순환 (자녀 색다양성 표현)
function chipPalette(idx: number, isDark: boolean): { bg: string; fg: string; border: string } {
  const dark = [
    { bg: "rgba(125,211,192,0.12)", fg: "#7dd3c0", border: "rgba(125,211,192,0.35)" },  // 탐구·차분 (청록)
    { bg: "rgba(245,185,66,0.12)",  fg: "#f5b942", border: "rgba(245,185,66,0.35)" },   // 끈기·온기 (골드)
    { bg: "rgba(168,139,250,0.12)", fg: "#a78bfa", border: "rgba(168,139,250,0.35)" },  // 포용·창의 (보라)
    { bg: "rgba(255,154,103,0.12)", fg: "#ff9a67", border: "rgba(255,154,103,0.35)" },  // 활발·열정 (오렌지)
    { bg: "rgba(126,182,255,0.12)", fg: "#7eb6ff", border: "rgba(126,182,255,0.35)" },  // 표현·소통 (파랑)
  ];
  const light = [
    { bg: "#dcefe9", fg: "#2c6e5e", border: "#7dd3c055" },
    { bg: "#f6e6c0", fg: "#7a5618", border: "#c8a85c66" },
    { bg: "#e5dcfa", fg: "#5a3aa0", border: "#a78bfa55" },
    { bg: "#fae0d0", fg: "#8a3e16", border: "#ff9a6755" },
    { bg: "#dceaf8", fg: "#1f4a7d", border: "#7eb6ff55" },
  ];
  const list = isDark ? dark : light;
  return list[idx % list.length];
}

// ── 자녀 키워드 자동 매핑 (격국·일간 오행·신강신약 기반) ──
// 결정론 룰. AI 토큰 0 소모.
export function deriveChildKeywords(args: {
  ilganElement?: ElementKey | string;
  gyeokgukName?: string;
  dayMasterLevel?: string;
  topSipseong?: string;       // 가장 강한 십성 (편관·정관·식신·...)
  hasGuiin?: boolean;         // 귀인 있는지
}): string[] {
  const out: string[] = [];

  // 1) 일간 오행 → 본질 키워드
  switch (args.ilganElement) {
    case "목": out.push("성장", "곧음"); break;
    case "화": out.push("열정", "표현"); break;
    case "토": out.push("안정", "포용"); break;
    case "금": out.push("결단", "다듬음"); break;
    case "수": out.push("지혜", "흐름"); break;
  }

  // 2) 신강신약 → 펼침 결
  switch (args.dayMasterLevel) {
    case "극왕":
    case "태강":
    case "신강":
      out.push("주도");
      break;
    case "신약":
    case "태약":
    case "극약":
      out.push("섬세");
      break;
    case "중화":
      out.push("균형");
      break;
  }

  // 3) 가장 강한 십성 → 사회적 결
  switch (args.topSipseong) {
    case "비견":
    case "겁재":
      out.push("자기결");
      break;
    case "식신":
    case "상관":
      out.push("창의");
      break;
    case "편재":
    case "정재":
      out.push("실리");
      break;
    case "편관":
    case "정관":
      out.push("책임");
      break;
    case "편인":
    case "정인":
      out.push("탐구");
      break;
  }

  // 4) 귀인 보유 → 빛나는 결
  if (args.hasGuiin) out.push("귀인복");

  // 중복 제거 + 최대 5개
  return [...new Set(out)].slice(0, 5);
}
