"use client";
// 용신·희신·기신 카드 — 홍실 톤 + 단어 풀이
const ELEM_COLOR: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#94a3b8", 수: "#60a5fa",
  木: "#22c55e", 火: "#ef4444", 土: "#f59e0b", 金: "#94a3b8", 水: "#60a5fa",
};
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

const KIND_INFO: Record<string, { full: string; sub: string; desc: string }> = {
  용신: { full: "용신(用神)", sub: "내 결을 살리는 기운", desc: "사주에서 가장 도움이 되는 오행" },
  희신: { full: "희신(喜神)", sub: "용신을 받쳐주는 결", desc: "용신과 어울려 결을 더 살리는 오행" },
  기신: { full: "기신(忌神)", sub: "결을 흩트리는 기운", desc: "사주의 흐름을 깨뜨릴 수 있는 오행" },
};

interface Props {
  yongsin: string;
  huisin: string;
  gisin: string;
}

function Card({ kind, elem }: { kind: keyof typeof KIND_INFO; elem: string }) {
  const display = ELEM_HANJA[elem] || elem;
  const color = ELEM_COLOR[elem] || "#b88646";
  const info = KIND_INFO[kind];
  if (!elem || elem === "—" || elem === "" || elem === "-") return null;
  return (
    <div
      className="flex-1 rounded-md p-3 flex flex-col items-center text-center"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}05)`,
        border: `1px solid ${color}66`,
        boxShadow: `0 4px 14px -6px ${color}33`,
      }}
    >
      <div className="text-[11px] mb-2 font-bold" style={{ color, fontFamily: "'Nanum Myeongjo', serif" }}>
        {info.full}
      </div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-[26px] mb-1"
        style={{
          background: `${color}22`,
          border: `1.5px solid ${color}99`,
          color,
          fontFamily: "'Nanum Myeongjo', serif",
          fontWeight: 800,
        }}
      >
        {display}
      </div>
      <div className="text-[12px] font-bold mt-1" style={{ color: "#1a0a14", fontFamily: "'Gowun Batang', serif" }}>
        {info.sub}
      </div>
      <div className="text-[10px] mt-1 leading-snug" style={{ color: "#5a3c4a", fontFamily: "'Gowun Batang', serif" }}>
        {info.desc}
      </div>
    </div>
  );
}

export default function YongsinCards({ yongsin, huisin, gisin }: Props) {
  return (
    <div
      className="rounded-md p-4"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
      }}
    >
      <div className="text-[14px] mb-3 text-center font-bold" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
        용신(用神) 카드
      </div>
      <div className="flex gap-2">
        <Card kind="용신" elem={yongsin} />
        {huisin && <Card kind="희신" elem={huisin} />}
        {gisin && <Card kind="기신" elem={gisin} />}
      </div>
    </div>
  );
}
