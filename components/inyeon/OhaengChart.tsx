"use client";
// 오행 분포 — 자도인 V2 ElementsRadar 차용 (홍실 cream 톤)
const ELEM_ORDER = ["목", "화", "토", "금", "수"] as const;
const ELEM_COLORS: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#94a3b8", 수: "#60a5fa",
};
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_DESC: Record<string, string> = { 목: "호기심", 화: "열정", 토: "안정", 금: "결단", 수: "지혜" };
const ELEM_LABEL: Record<string, string> = {
  목: "나무 — 호기심·성장",
  화: "불 — 열정·표현",
  토: "흙 — 안정·신뢰",
  금: "쇠 — 결단·의지",
  수: "물 — 지혜·유연",
};
const ELEM_SPECTRUM: Record<string, { weak: string; strong: string; balanced: string }> = {
  목: { weak: "호기심·성장보다 신중함이 두드러짐", strong: "호기심·성장이 강해 새 도전을 좋아함", balanced: "호기심과 신중함이 고루" },
  화: { weak: "열정·표현보다 차분함이 두드러짐", strong: "열정·표현이 강해 감정이 풍부함", balanced: "열정과 차분함이 고루" },
  토: { weak: "안정보다 새로운 자극에 끌리는 결", strong: "안정·신뢰가 강해 끝까지 한결같음", balanced: "안정과 변화가 고루" },
  금: { weak: "결단·의지보다 부드러운 양보가 두드러짐", strong: "결단·의지가 강해 분명한 결", balanced: "결단과 부드러움이 고루" },
  수: { weak: "지혜·유연보다 빠른 행동이 앞서는 결", strong: "지혜·유연이 강해 적응을 잘함", balanced: "행동과 사색이 고루" },
};

interface Props {
  name: string;
  counts: Record<string, number>;
  ratios: Record<string, number>;
}

function adjustElementsForDisplay(raw: Record<string, number>): Record<string, number> {
  const total = ELEM_ORDER.reduce((s, k) => s + (raw[k] || 0), 0) || 1;
  const pct: Record<string, number> = {};
  for (const k of ELEM_ORDER) pct[k] = ((raw[k] || 0) / total) * 100;
  return pct;
}

export default function OhaengChart({ name, counts }: Props) {
  const adjusted = adjustElementsForDisplay(counts);
  const topEl = (Object.entries(adjusted).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? "목";
  const cx = 170, cy = 175, R = 75;
  const angs = ELEM_ORDER.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [cx + R * s * Math.cos(angs[i]), cy + R * s * Math.sin(angs[i])];
  const gridPts = (s: number) => ELEM_ORDER.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = ELEM_ORDER.map((el, i) => {
    const raw = (adjusted[el] || 0) / 50;
    const s = Math.min(1.0, Math.max(0, raw));
    return pt(i, s).join(",");
  }).join(" ");
  const LO = 1.5;
  return (
    <div
      className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 6px 20px -8px rgba(178,40,71,0.12)",
      }}
    >
      <div
        className="text-[15px] font-bold mb-3 text-center"
        style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}
      >
        {name}님의 다섯 기운 분포
      </div>

      <div className="flex justify-center">
        <svg width="340" height="320" viewBox="0 0 340 320">
          {/* 격자 */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
            <polygon
              key={gi}
              points={gridPts(s)}
              fill="none"
              stroke={s === 1.0 ? "rgba(106,30,58,0.25)" : "rgba(106,30,58,0.10)"}
              strokeWidth={s === 1.0 ? 1.2 : 0.8}
            />
          ))}
          {/* 축선 */}
          {ELEM_ORDER.map((_, i) => {
            const [x, y] = pt(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(106,30,58,0.15)" strokeWidth="1" />;
          })}
          {/* 데이터 영역 */}
          <polygon
            points={dataPts}
            fill={`${ELEM_COLORS[topEl]}40`}
            stroke={ELEM_COLORS[topEl]}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* 라벨 */}
          {ELEM_ORDER.map((el, i) => {
            const [lx, ly] = pt(i, LO);
            const pct = Math.round(adjusted[el] ?? 0);
            const isTop = el === topEl;
            const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
            const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
            return (
              <g key={i}>
                <text x={lx + dx} y={ly - 10} textAnchor={anchor} fontSize="22" fontWeight="bold" fill={ELEM_COLORS[el]}>
                  {ELEM_HANJA[el]}
                </text>
                <text x={lx + dx} y={ly + 12} textAnchor={anchor} fontSize="16" fontWeight={isTop ? "bold" : "normal"} fill={ELEM_COLORS[el]}>
                  {pct}%
                </text>
                <text x={lx + dx} y={ly + 26} textAnchor={anchor} fontSize="11" fill="#5a3c4a" fontFamily="'Gowun Batang', serif">
                  {ELEM_DESC[el]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 강약 스펙트럼 표 */}
      <div className="mt-4">
        <p className="text-[12px] leading-relaxed text-center mb-3 px-3" style={{ color: "#5a3c4a", fontFamily: "'Gowun Batang', serif" }}>
          ※ 다섯 기운 분포예요. <strong style={{ color: "#c8203a" }}>그 결이 강하면 본질 그대로</strong>, <strong style={{ color: "#c8203a" }}>약하면 반대 모습</strong>이 두드러져요.
        </p>
        <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(212,169,107,0.4)" }}>
          {ELEM_ORDER.map((el) => {
            const pct = Math.round(adjusted[el] ?? 0);
            const color = ELEM_COLORS[el];
            const diff = pct - 20;
            let dominant: "weak" | "strong" | "balanced";
            if (Math.abs(diff) <= 2) dominant = "balanced";
            else if (diff > 0) dominant = "strong";
            else dominant = "weak";
            const phrase = dominant === "balanced" ? ELEM_SPECTRUM[el].balanced : dominant === "strong" ? ELEM_SPECTRUM[el].strong : ELEM_SPECTRUM[el].weak;
            const arrow = dominant === "strong" ? "↑" : dominant === "weak" ? "↓" : "≈";
            const arrowLabel = dominant === "strong" ? "강함" : dominant === "weak" ? "약함" : "균형";
            return (
              <div
                key={el}
                className="px-4 py-3"
                style={{
                  borderTop: "1px solid rgba(212,169,107,0.25)",
                  background: dominant === "strong" ? `${color}10` : dominant === "weak" ? "rgba(212,169,107,0.06)" : "transparent",
                }}
              >
                <div className="flex items-baseline gap-2.5 mb-1.5">
                  <span className="text-[20px] font-bold" style={{ color, fontFamily: "'Nanum Myeongjo', serif" }}>
                    {ELEM_HANJA[el]}
                  </span>
                  <span className="text-[13px]" style={{ color: "#3a2530", fontFamily: "'Gowun Batang', serif" }}>
                    {ELEM_LABEL[el].replace(/^.*— /, "")}
                  </span>
                  <span className="text-[14px] font-bold ml-auto" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[12px] font-bold flex-shrink-0"
                    style={{ color: dominant === "balanced" ? "#8a6b4d" : color }}
                  >
                    {arrow} {arrowLabel}
                  </span>
                  <p
                    className="text-[13px] leading-snug flex-1"
                    style={{ color: dominant === "balanced" ? "#5a3c4a" : "#1a0a14", fontFamily: "'Gowun Batang', serif" }}
                  >
                    {phrase}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
