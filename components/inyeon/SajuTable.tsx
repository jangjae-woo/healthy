"use client";
// 사주 8글자 + 십성 표
const ACCENT = "#f0a8b8";

interface Pillar {
  stem: string;
  branch: string;
  stemHanja?: string;
  branchHanja?: string;
  stemSipseong?: string;
  branchSipseong?: string;
  yinyang?: "양" | "음";
  element?: string; // 木·火·土·金·水
}

interface Props {
  name: string;
  birthLine: string; // "1994년 5월 18일"
  hour: Pillar | null;
  day: Pillar;
  month: Pillar;
  year: Pillar;
}

const ELEM_COLOR: Record<string, string> = {
  木: "#7fbf7f", 火: "#e88a8a", 土: "#d4b074",
  金: "#bfbfbf", 水: "#7a9bbf",
};

function Cell({ p }: { p: Pillar | null }) {
  if (!p) {
    return (
      <div className="text-center py-3 px-1 text-xs" style={{ color: "#a39068" }}>
        모름
      </div>
    );
  }
  const stemColor = p.element ? ELEM_COLOR[p.element] || "#fff" : "#fff";
  return (
    <div className="flex flex-col items-center py-2">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-1"
        style={{
          background: `${stemColor}22`,
          border: `1px solid ${stemColor}66`,
          color: "#fef3c7",
          fontFamily: "'Noto Serif KR', serif",
        }}
      >
        {p.stemHanja || p.stem}
      </div>
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold"
        style={{
          background: `${stemColor}11`,
          border: `1px solid ${stemColor}44`,
          color: "#fef3c7",
          fontFamily: "'Noto Serif KR', serif",
        }}
      >
        {p.branchHanja || p.branch}
      </div>
    </div>
  );
}

export default function SajuTable({ name, birthLine, hour, day, month, year }: Props) {
  const cols: Array<{ label: string; sub: string; p: Pillar | null }> = [
    { label: "時", sub: "시", p: hour },
    { label: "日", sub: "일", p: day },
    { label: "月", sub: "월", p: month },
    { label: "年", sub: "년", p: year },
  ];

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}10, ${ACCENT}03)`,
        border: `1px solid ${ACCENT}33`,
        boxShadow: `0 4px 20px ${ACCENT}08`,
      }}
    >
      <div
        className="text-sm font-bold mb-1 text-center"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {name}님의 사주
      </div>
      <div
        className="text-xs text-center mb-4"
        style={{ color: `${ACCENT}cc` }}
      >
        {birthLine}
      </div>

      <div className="grid grid-cols-5 gap-1 items-center">
        <div className="text-[10px] text-center" style={{ color: "#a39068" }}>
          十星<br />(십성)
        </div>
        {cols.map((c, i) => (
          <div key={`top-${i}`} className="text-center text-[10px]" style={{ color: "#a39068" }}>
            {c.p?.stemSipseong || "-"}
          </div>
        ))}

        <div className="text-[10px] text-center" style={{ color: "#a39068" }}>
          天干<br />(천간)
        </div>
        {cols.map((c, i) => (
          <div key={`mid-${i}`} className="flex justify-center">
            <Cell p={c.p} />
          </div>
        ))}

        <div className="text-[10px] text-center" style={{ color: "#a39068" }}>
          十星<br />(십성)
        </div>
        {cols.map((c, i) => (
          <div key={`bot-${i}`} className="text-center text-[10px]" style={{ color: "#a39068" }}>
            {c.p?.branchSipseong || "-"}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1 mt-2 text-center">
        <div />
        {cols.map((c, i) => (
          <div key={`label-${i}`} className="text-xs" style={{ color: `${ACCENT}cc` }}>
            <span style={{ fontFamily: "'Noto Serif KR', serif" }}>{c.label}</span>
            <span className="text-[10px]" style={{ color: "#a39068" }}> · {c.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
