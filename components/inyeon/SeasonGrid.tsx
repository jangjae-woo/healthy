"use client";
const ACCENT = "#f0a8b8";

interface Item {
  season: "봄" | "여름" | "가을" | "겨울";
  hanja: string;
  place: string;
}

interface Props {
  items: Item[];
}

const SEASON_BG: Record<string, string> = {
  봄: "linear-gradient(135deg, rgba(240,168,184,0.18), rgba(240,168,184,0.05))",
  여름: "linear-gradient(135deg, rgba(122,155,191,0.18), rgba(122,155,191,0.05))",
  가을: "linear-gradient(135deg, rgba(212,176,116,0.18), rgba(212,176,116,0.05))",
  겨울: "linear-gradient(135deg, rgba(191,191,191,0.18), rgba(191,191,191,0.05))",
};

export default function SeasonGrid({ items }: Props) {
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
        className="text-sm font-bold mb-1 text-center"
        style={{ color: "#2a1722", fontFamily: "'Noto Serif KR', serif" }}
      >
        계절별 여행 & 데이트 코스
      </div>
      <div className="text-[11px] text-center mb-4" style={{ color: "#8a6b4d" }}>
        두 분의 결을 보강하는 자리예요
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-col items-center text-center"
            style={{
              background: SEASON_BG[it.season],
              border: `1px solid ${ACCENT}33`,
              minHeight: 120,
            }}
          >
            <div
              className="text-xl mb-1"
              style={{
                fontFamily: "'Ma Shan Zheng', 'Noto Serif KR', serif",
                color: "#2a1722",
              }}
            >
              {it.hanja} <span className="text-xs">/ {it.season}</span>
            </div>
            <div className="text-xs leading-relaxed mt-2" style={{ color: "#5a3c4a" }}>
              {it.place}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
