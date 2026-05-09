"use client";

const ACCENT = "#f0a8b8";
const BG_INNER = "#1a0d10";

interface Pillar {
  stem: string;
  branch: string;
  stemSipseong: string;
  branchSipseong: string;
}

interface Props {
  name: string;
  hour: Pillar;
  day: Pillar;
  month: Pillar;
  year: Pillar;
  jijanggan: string[];
}

export default function SipseongRow({ name, hour, day, month, year, jijanggan }: Props) {
  const cols = [
    { label: "時", p: hour },
    { label: "日", p: day, mark: true },
    { label: "月", p: month },
    { label: "年", p: year },
  ];

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: `linear-gradient(135deg, ${ACCENT}10, ${ACCENT}03)`, border: `1px solid ${ACCENT}33`, boxShadow: `0 4px 20px ${ACCENT}08` }}
    >
      <div
        className="text-sm font-bold mb-3"
        style={{ color: "#2a1722", fontFamily: "'Noto Serif KR', serif" }}
      >
        {name}님의 십성과 지장간
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cols.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-1.5">
            <div className="text-[10px]" style={{ color: `${ACCENT}88` }}>{c.label}</div>
            <div
              className="w-full text-center text-[10px] py-0.5 rounded"
              style={{
                background: c.mark ? `${ACCENT}33` : "transparent",
                color: c.mark ? "#2a1722" : `${ACCENT}cc`,
              }}
            >
              {c.mark ? "일간" : c.p.stemSipseong}
            </div>
            <div
              className="w-full aspect-square rounded-md flex items-center justify-center text-base font-bold"
              style={{
                background: c.mark ? ACCENT : "rgba(212,169,107,0.08)",
                color: c.mark ? "#fff" : "#2a1722",
                fontFamily: "'Noto Serif KR', serif",
                border: `1px solid ${ACCENT}33`,
              }}
            >
              {c.p.stem}
            </div>
            <div className="text-[10px]" style={{ color: `${ACCENT}aa` }}>
              {c.p.branchSipseong}
            </div>
          </div>
        ))}
      </div>

      {jijanggan.length > 0 && (
        <div
          className="mt-3 pt-3 text-[11px]"
          style={{
            borderTop: `1px dashed ${ACCENT}33`,
            color: "#5a3c4a",
          }}
        >
          <span style={{ color: ACCENT }}>지장간</span> · {jijanggan.join(" · ")}
        </div>
      )}
    </div>
  );
}
