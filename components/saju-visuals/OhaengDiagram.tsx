// ── 오행 5원소 생·극 도식 (Phase 1) ──
// 양반사주 채택+변형: 자녀 오행 분포 + 생/극 화살표 동시 시각화
// paljawon 차별점: 자녀 오행 분포 비율을 동그라미 크기·강조로 반영 (양반사주는 균등 동그라미)
import { ELEMENT_COLOR, ELEMENT_BG, ELEMENT_MEANING, type ElementKey } from "@/lib/saju-symbols";

interface Props {
  // 자녀 오행 분포 (count) — 강조할 오행 결정
  distribution: Record<ElementKey, number>;
  showLegend?: boolean;
  size?: number;  // 전체 가로 px
}

const HANJA: Record<ElementKey, string> = {
  목: "木", 화: "火", 토: "土", 금: "金", 수: "水",
};

// 5원소 위치 (정오각형 — 위 / 우상 / 우하 / 좌하 / 좌상)
// 순서: 목(상) → 화(우상) → 토(우하) → 금(좌하) → 수(좌상)
function positions(size: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;
  // 정오각형 angle: 90, 90-72=18, 18-72=-54, -54-72=-126, -126-72=-198 (=162)
  // 위에서 시계방향
  const angles: Record<ElementKey, number> = {
    목: 90,    // 상
    화: 18,    // 우상
    토: -54,   // 우하
    금: -126,  // 좌하
    수: 162,   // 좌상
  };
  const out: Record<ElementKey, { x: number; y: number }> = {} as never;
  for (const k of Object.keys(angles) as ElementKey[]) {
    const rad = (angles[k] * Math.PI) / 180;
    out[k] = { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }
  return out;
}

export default function OhaengDiagram({ distribution, showLegend = true, size = 280 }: Props) {
  const pos = positions(size);
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...Object.values(distribution));

  // 동그라미 크기 — 분포 비율에 따라 ±25%
  const radiusOf = (count: number) => {
    const base = size * 0.07;
    const ratio = count / Math.max(max, 1);
    return base * (0.85 + ratio * 0.5);
  };

  // 생(生) 화살표 — 시계방향 순환: 목→화→토→금→수→목
  const saengEdges: [ElementKey, ElementKey][] = [
    ["목", "화"], ["화", "토"], ["토", "금"], ["금", "수"], ["수", "목"],
  ];
  // 극(剋) 화살표 — 별 모양: 목→토, 토→수, 수→화, 화→금, 금→목
  const geukEdges: [ElementKey, ElementKey][] = [
    ["목", "토"], ["토", "수"], ["수", "화"], ["화", "금"], ["금", "목"],
  ];

  const elements: ElementKey[] = ["목", "화", "토", "금", "수"];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 극(剋) — 별 모양, 점선 회색 (보조 정보) */}
        <g opacity={0.35}>
          {geukEdges.map(([a, b]) => (
            <line
              key={`g-${a}-${b}`}
              x1={pos[a].x} y1={pos[a].y}
              x2={pos[b].x} y2={pos[b].y}
              stroke="#8b3a3a"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ))}
        </g>
        {/* 생(生) — 시계방향 곡선, 실선 푸른빛 (주 정보) */}
        <g>
          <defs>
            <marker id="saengArrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#3c4a6e" />
            </marker>
          </defs>
          {saengEdges.map(([a, b]) => {
            // 약간 안쪽으로 들어가는 직선 (동그라미 가장자리에 닿게)
            const r = radiusOf(distribution[b]);
            const dx = pos[b].x - pos[a].x;
            const dy = pos[b].y - pos[a].y;
            const len = Math.hypot(dx, dy);
            const ux = dx / len;
            const uy = dy / len;
            const x2 = pos[b].x - ux * (r + 4);
            const y2 = pos[b].y - uy * (r + 4);
            const x1 = pos[a].x + ux * (radiusOf(distribution[a]) + 2);
            const y1 = pos[a].y + uy * (radiusOf(distribution[a]) + 2);
            return (
              <line
                key={`s-${a}-${b}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#3c4a6e"
                strokeWidth={1.5}
                markerEnd="url(#saengArrow)"
                opacity={0.7}
              />
            );
          })}
        </g>
        {/* 5원소 동그라미 */}
        {elements.map((k) => {
          const r = radiusOf(distribution[k]);
          const isStrong = distribution[k] === max && max > 0;
          const isAbsent = distribution[k] === 0;
          return (
            <g key={k}>
              <circle
                cx={pos[k].x} cy={pos[k].y} r={r}
                fill={ELEMENT_BG[k]}
                stroke={ELEMENT_COLOR[k]}
                strokeWidth={isStrong ? 2.5 : 1.5}
                opacity={isAbsent ? 0.35 : 1}
              />
              <text
                x={pos[k].x} y={pos[k].y - 3}
                textAnchor="middle"
                fontSize={r * 0.85}
                fontWeight="bold"
                fill={ELEMENT_COLOR[k]}
                style={{ fontFamily: "serif" }}
              >
                {HANJA[k]}
              </text>
              <text
                x={pos[k].x} y={pos[k].y + r * 0.55}
                textAnchor="middle"
                fontSize={9}
                fill={ELEMENT_COLOR[k]}
                opacity={0.85}
              >
                {distribution[k]}개
              </text>
            </g>
          );
        })}
      </svg>
      {showLegend && (
        <div className="flex items-center gap-3 mt-2 text-[10.5px]" style={{ color: "#5a5246" }}>
          <span className="flex items-center gap-1">
            <span style={{ display: "inline-block", width: 14, height: 1.5, background: "#3c4a6e" }} />
            생(生) — 길러줌
          </span>
          <span className="flex items-center gap-1">
            <span style={{ display: "inline-block", width: 14, height: 1, borderTop: "1.5px dashed #8b3a3a" }} />
            극(剋) — 다스림
          </span>
        </div>
      )}
      {showLegend && (
        <p className="mt-1.5 text-[10px] text-center" style={{ color: "#7a6f5a" }}>
          {(() => {
            const top = Object.entries(distribution)
              .sort(([, a], [, b]) => b - a)[0];
            if (!top || top[1] === 0) return "";
            return `가장 강한 결: ${top[0]}(${HANJA[top[0] as ElementKey]}) — ${ELEMENT_MEANING[top[0] as ElementKey]}`;
          })()}
        </p>
      )}
    </div>
  );
}
