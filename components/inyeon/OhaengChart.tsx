"use client";
// 오행 분포 — 원형 노드 + 막대 비율
const ACCENT = "#f0a8b8";
const ELEM = ["목", "화", "토", "금", "수"] as const;
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_COLOR: Record<string, string> = {
  목: "#7fbf7f", 화: "#e88a8a", 토: "#d4b074", 금: "#bfbfbf", 수: "#7a9bbf",
};

interface Props {
  name: string;
  counts: Record<string, number>;     // {목:2, 화:1, 토:3, 금:1, 수:1}
  ratios: Record<string, number>;     // {목:18.2, ...}
}

function ratioLabel(r: number): string {
  if (r === 0) return "결핍";
  if (r < 10) return "부족";
  if (r < 20) return "적정";
  if (r < 30) return "발달";
  return "과다";
}

// 5각 레이더 좌표 — 정오각형, top 시작 (12시), 시계방향
function pentagonPoint(idx: number, r: number, cx = 100, cy = 100): { x: number; y: number } {
  const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 5;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

export default function OhaengChart({ name, counts, ratios }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  // 레이더 좌표 — 비율(0~50%)을 반경(0~80)으로
  const RADAR_MAX = 50; // 50% = 만점
  const RADAR_R = 80;
  const radarPoints = ELEM.map((e, i) => {
    const r = Math.min(RADAR_MAX, ratios[e] ?? 0) / RADAR_MAX * RADAR_R;
    return pentagonPoint(i, r);
  });
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
  const gridR = [20, 40, 60, 80];

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}10, ${ACCENT}03)`,
        border: `1px solid ${ACCENT}33`,
        boxShadow: `0 4px 20px ${ACCENT}08`,
      }}
    >
      <div
        className="text-sm font-bold mb-4"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {name}님의 오행 분포
      </div>

      {/* 5각 레이더 차트 */}
      <div className="flex justify-center mb-4">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* 격자 */}
          {gridR.map((r) => {
            const pts = ELEM.map((_, i) => pentagonPoint(i, r));
            return (
              <polygon
                key={r}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={`${ACCENT}22`}
                strokeWidth="1"
              />
            );
          })}
          {/* 축선 */}
          {ELEM.map((_, i) => {
            const p = pentagonPoint(i, RADAR_R);
            return (
              <line key={i} x1="100" y1="100" x2={p.x} y2={p.y} stroke={`${ACCENT}22`} strokeWidth="1" />
            );
          })}
          {/* 데이터 영역 */}
          <path
            d={radarPath}
            fill={`${ACCENT}33`}
            stroke={ACCENT}
            strokeWidth="2"
          />
          {/* 데이터 노드 */}
          {radarPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={ELEM_COLOR[ELEM[i]]} stroke="#fef3c7" strokeWidth="1" />
          ))}
          {/* 라벨 (한자) */}
          {ELEM.map((e, i) => {
            const lp = pentagonPoint(i, RADAR_R + 16);
            return (
              <g key={e}>
                <text
                  x={lp.x} y={lp.y + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="'Noto Serif KR', serif"
                  fontWeight="bold"
                  fill={ELEM_COLOR[e]}
                >
                  {ELEM_HANJA[e]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-end justify-around mb-5">
        {ELEM.map((e) => (
          <div key={e} className="flex flex-col items-center">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg"
              style={{
                background: `linear-gradient(135deg, ${ELEM_COLOR[e]}33, ${ELEM_COLOR[e]}11)`,
                border: `1px solid ${ELEM_COLOR[e]}88`,
                color: "#fef3c7",
                fontFamily: "'Noto Serif KR', serif",
                boxShadow: `0 2px 8px ${ELEM_COLOR[e]}22`,
              }}
            >
              {ELEM_HANJA[e]}
            </div>
            <div className="text-[11px] mt-1.5 font-bold" style={{ color: ELEM_COLOR[e] }}>
              {counts[e] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] mb-2" style={{ color: "#a39068" }}>
        오행 비율 (총 {total})
      </div>
      <div className="flex flex-col gap-2">
        {ELEM.map((e) => {
          const r = ratios[e] ?? 0;
          return (
            <div key={e} className="flex items-center gap-2">
              <div className="w-8 text-xs" style={{ color: ELEM_COLOR[e] }}>
                {e} {ELEM_HANJA[e]}
              </div>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: `${ACCENT}22` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, r)}%`,
                    background: ELEM_COLOR[e],
                  }}
                />
              </div>
              <div className="w-20 text-right text-[11px]" style={{ color: "#d6cdb8" }}>
                {Math.round(r)}% · {ratioLabel(r)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
