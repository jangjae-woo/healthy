// ── 신강신약 게이지 (Phase 1) ──
// 양반사주 채택+변형: 7단계 (극약·태약·신약·중화·신강·태강·극왕)
// paljawon 차별점: 한지 톤 + 자녀 양육 가이드 한 줄 자동 표시
import type { ReactNode } from "react";

const STAGES = ["극약", "태약", "신약", "중화", "신강", "태강", "극왕"] as const;
type Stage = typeof STAGES[number];

// 양육 가이드 한 줄 — 단계별 톤
const GUIDE: Record<Stage, string> = {
  극약: "기운이 매우 약한 결 — 부모님이 든든히 받쳐주실 때 자랍니다",
  태약: "기운이 적은 결 — 살펴주시는 환경에서 결이 자라납니다",
  신약: "기운이 약한 결 — 부드러운 받쳐줌이 자녀의 결을 키웁니다",
  중화: "기운이 균형 잡힌 결 — 자녀의 자기 호흡을 존중해주세요",
  신강: "기운이 강한 결 — 자녀가 자기 결을 펼치도록 공간을 주세요",
  태강: "기운이 단단한 결 — 한 박자 늦춰 다가가실 때 결이 자랍니다",
  극왕: "기운이 매우 강한 결 — 자녀의 자기 결을 인정해주실 때 단단해집니다",
};

interface Props {
  current: Stage;
  ilgan?: string;     // 자녀 일간 한자 (있으면 라벨에 표시)
  variant?: "dark" | "light";  // dark = 검정 배경 위, light = 한지 카드 안
}

export default function SinGangGauge({ current, ilgan, variant = "dark" }: Props) {
  const idx = STAGES.indexOf(current);
  const isDark = variant === "dark";

  const palette = isDark
    ? { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.12)", text: "rgba(255,255,255,0.85)", sub: "rgba(255,255,255,0.55)", dotInactive: "rgba(255,255,255,0.18)" }
    : { bg: "transparent", border: "transparent", text: "#2a2622", sub: "#5a5246", dotInactive: "#bcb3a0" };

  // 단계별 색 (왼쪽 약한 적 → 오른쪽 강한 적)
  const dotColor = (i: number) => {
    if (i < idx) return "#e8a8a8";  // 지나온 단계 — 옅은 적
    if (i === idx) return "#c43c3c";  // 현재 — 짙은 적
    return palette.dotInactive;
  };

  return (
    <div
      className="rounded-md p-3"
      style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.text }}
    >
      <p className="text-center text-[11px] mb-2.5" style={{ color: palette.sub, letterSpacing: "0.15em" }}>
        신강신약(身强身弱)
      </p>
      {/* 도트 7개 */}
      <div className="flex items-center justify-between px-1 mb-1">
        {STAGES.map((s, i) => (
          <div key={s} className="flex flex-col items-center" style={{ flex: 1 }}>
            <div
              className="rounded-full"
              style={{
                width: i === idx ? 14 : 10,
                height: i === idx ? 14 : 10,
                background: dotColor(i),
                boxShadow: i === idx ? `0 0 0 3px ${dotColor(i)}33` : undefined,
              }}
            />
          </div>
        ))}
      </div>
      {/* 라벨 */}
      <div className="flex items-center justify-between px-0.5">
        {STAGES.map((s, i) => (
          <p
            key={s}
            className="text-center"
            style={{
              flex: 1,
              fontSize: 9.5,
              color: i === idx ? "#c43c3c" : palette.sub,
              fontWeight: i === idx ? 700 : 400,
            }}
          >
            {s}
          </p>
        ))}
      </div>
      {/* 현재 상태 한 줄 */}
      <div
        className="mt-3 rounded text-center py-2 px-2"
        style={{
          background: isDark ? "rgba(196,60,60,0.08)" : "rgba(196,60,60,0.06)",
          border: "1px solid rgba(196,60,60,0.25)",
          fontSize: 11.5,
          color: palette.text,
          lineHeight: 1.55,
        }}
      >
        {ilgan && (
          <span style={{ color: "#c43c3c", fontWeight: 700 }}>
            일간 {ilgan} ·{" "}
          </span>
        )}
        <span style={{ fontWeight: 700 }}>{current}</span>한 사주입니다
      </div>
      <p className="text-[10.5px] mt-2 text-center italic" style={{ color: palette.sub, lineHeight: 1.5 }}>
        {GUIDE[current]}
      </p>
    </div>
  );
}

// 외부에서 stage 문자열을 안전 캐스팅하는 헬퍼
export function asStage(s: string | undefined | null): Stage {
  if (!s) return "중화";
  if ((STAGES as readonly string[]).includes(s)) return s as Stage;
  return "중화";
}
