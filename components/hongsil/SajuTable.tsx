"use client";

const ACCENT = "#c8203a";
const GOLD = "#b88646";
const INK = "#24131c";
const MUTED = "#7b5f68";

interface Pillar {
  stem: string;
  branch: string;
  stemHanja?: string;
  branchHanja?: string;
  stemSipseong?: string;
  branchSipseong?: string;
  yinyang?: "음" | "양";
  element?: string;
}

interface Props {
  name: string;
  birthLine: string;
  hour: Pillar | null;
  day: Pillar;
  month: Pillar;
  year: Pillar;
}

const ELEM_COLOR: Record<string, string> = {
  목: "#5e9f64",
  화: "#d85e5e",
  토: "#b88646",
  금: "#8c8c8c",
  수: "#4f7fa8",
};

const STEM_ELEMENT: Record<string, keyof typeof ELEM_COLOR> = {
  갑: "목",
  을: "목",
  병: "화",
  정: "화",
  무: "토",
  기: "토",
  경: "금",
  신: "금",
  임: "수",
  계: "수",
};

const BRANCH_ELEMENT: Record<string, keyof typeof ELEM_COLOR> = {
  인: "목",
  묘: "목",
  사: "화",
  오: "화",
  진: "토",
  술: "토",
  축: "토",
  미: "토",
  신: "금",
  유: "금",
  자: "수",
  해: "수",
};

const STEM_GUIDE: Record<string, string> = {
  갑: "큰 나무",
  을: "풀과 덩굴",
  병: "태양",
  정: "촛불",
  무: "큰 산",
  기: "부드러운 흙",
  경: "강한 쇠",
  신: "보석",
  임: "큰 물",
  계: "빗방울",
};

const BRANCH_GUIDE: Record<string, string> = {
  자: "겨울 물",
  축: "차가운 흙",
  인: "봄의 시작",
  묘: "봄나무",
  진: "젖은 흙",
  사: "초여름 불",
  오: "한여름 불",
  미: "여름 흙",
  신: "가을 쇠",
  유: "가을 쇠",
  술: "마른 흙",
  해: "겨울 물",
};

const ROLE_GROUPS = [
  { pair: ["비견", "겁재"], group: "비겁", meaning: "내 편, 친구, 경쟁심처럼 나와 같은 방향의 힘", color: "#c8203a" },
  { pair: ["식신", "상관"], group: "식상", meaning: "표현하고 끌어내는 힘", color: "#d1842b" },
  { pair: ["정재", "편재"], group: "재성", meaning: "현실감과 선택의 힘", color: "#8b7c2f" },
  { pair: ["정관", "편관"], group: "관성", meaning: "관계의 기준과 책임감", color: "#3e7a69" },
  { pair: ["정인", "편인"], group: "인성", meaning: "생각, 보호, 받아들이는 힘", color: "#5c6fa8" },
];

const ELEMENT_LEGEND = [
  { name: "목", desc: "자람", color: ELEM_COLOR.목 },
  { name: "화", desc: "열기", color: ELEM_COLOR.화 },
  { name: "토", desc: "중심", color: ELEM_COLOR.토 },
  { name: "금", desc: "정리", color: ELEM_COLOR.금 },
  { name: "수", desc: "흐름", color: ELEM_COLOR.수 },
];

function meaningForStem(p: Pillar | null) {
  if (!p) return "시간 미상";
  return STEM_GUIDE[p.stem] ?? "고유한 기운";
}

function meaningForBranch(p: Pillar | null) {
  if (!p) return "시간 미상";
  return BRANCH_GUIDE[p.branch] ?? "고유한 자리";
}

function elementForLetter(p: Pillar | null, type: "stem" | "branch") {
  if (!p) return null;
  return type === "stem" ? STEM_ELEMENT[p.stem] ?? null : BRANCH_ELEMENT[p.branch] ?? null;
}

function BigLetter({ p, type, active }: { p: Pillar | null; type: "stem" | "branch"; active?: boolean }) {
  const element = elementForLetter(p, type);
  const color = element ? ELEM_COLOR[element] : GOLD;
  const value = type === "stem" ? p?.stemHanja || p?.stem : p?.branchHanja || p?.branch;
  const meaning = type === "stem" ? meaningForStem(p) : meaningForBranch(p);

  return (
    <div
      className="min-h-[70px] rounded-md px-1.5 py-2 flex flex-col items-center justify-center text-center"
      style={{
        background: `linear-gradient(180deg, ${color}17, rgba(255,255,255,0.74))`,
        border: active ? `1.5px solid ${ACCENT}66` : `1px solid ${color}48`,
        boxShadow: active ? `0 6px 18px ${ACCENT}12` : `0 4px 10px ${color}0d`,
      }}
    >
      {active && (
        <div className="mb-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ color: ACCENT, background: `${ACCENT}12`, fontFamily: "'Gowun Batang', serif" }}>
          나의 중심
        </div>
      )}
      <div
        className="text-[25px] font-black leading-none"
        style={{ color, fontFamily: "'Nanum Myeongjo', serif", textShadow: `0 2px 10px ${color}22` }}
      >
        {value ?? "-"}
      </div>
      <div className="mt-1 text-[10.5px] leading-tight" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>
        {element ? `${element} · ${meaning}` : meaning}
      </div>
    </div>
  );
}

function RoleChip({ value, active }: { value?: string; active?: boolean }) {
  return (
    <div
      className="min-h-[34px] rounded-full px-1.5 flex items-center justify-center text-center text-[10.5px] font-bold leading-tight"
      style={{
        color: active ? ACCENT : "#5b3b47",
        background: active ? `${ACCENT}12` : "rgba(255,255,255,0.48)",
        border: active ? `1px solid ${ACCENT}55` : "1px solid rgba(184,134,70,0.18)",
        fontFamily: "'Gowun Batang', serif",
      }}
    >
      {value || "-"}
    </div>
  );
}

function RowLabel({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="pr-1 text-right flex flex-col justify-center">
      <div className="text-[11px] font-bold leading-tight" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
        {title}
      </div>
      <div className="text-[9.5px] leading-tight mt-0.5" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>
        {sub}
      </div>
    </div>
  );
}

export default function SajuTable({ name, birthLine, hour, day, month, year }: Props) {
  const cols: Array<{ label: string; sub: string; p: Pillar | null; active?: boolean }> = [
    { label: "시", sub: "시간", p: hour },
    { label: "일", sub: "나", p: day, active: true },
    { label: "월", sub: "환경", p: month },
    { label: "년", sub: "바탕", p: year },
  ];

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: `linear-gradient(135deg, ${ACCENT}0f, #fffaf6)`,
        border: `1px solid ${ACCENT}30`,
        boxShadow: `0 4px 20px ${ACCENT}08`,
      }}
    >
      <div className="text-center">
        <div className="text-[15px] font-bold" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
          {name}님의 사주 기본 지도
        </div>
        <div className="text-[12px] mt-1" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>
          {birthLine}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[54px_repeat(4,minmax(0,1fr))] gap-1.5 items-stretch">
        <div />
        {cols.map((c) => (
          <div
            key={c.label}
            className="rounded-full py-1.5 text-center"
            style={{
              background: c.active ? `${ACCENT}14` : "rgba(255,255,255,0.55)",
              border: c.active ? `1px solid ${ACCENT}55` : "1px solid rgba(184,134,70,0.2)",
            }}
          >
            <span className="text-[13px] font-black" style={{ color: c.active ? ACCENT : "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
              {c.label}
            </span>
            <span className="ml-0.5 text-[9.5px]" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>
              {c.sub}
            </span>
          </div>
        ))}

        <RowLabel title="위 역할" sub="천간 십성" />
        {cols.map((c) => <RoleChip key={`${c.label}-stem-role`} value={c.p?.stemSipseong} active={c.active} />)}

        <RowLabel title="윗글자" sub="천간" />
        {cols.map((c) => <BigLetter key={`${c.label}-stem`} p={c.p} type="stem" active={c.active} />)}

        <RowLabel title="아랫글자" sub="지지" />
        {cols.map((c) => <BigLetter key={`${c.label}-branch`} p={c.p} type="branch" active={c.active} />)}

        <RowLabel title="아래 역할" sub="지지 십성" />
        {cols.map((c) => <RoleChip key={`${c.label}-branch-role`} value={c.p?.branchSipseong} active={c.active} />)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(184,134,70,0.22)" }}>
          <div className="text-[11px] font-bold mb-2" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
            표시 읽는 법
          </div>
          <div className="space-y-1.5 text-[11px]" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
            <div><b style={{ color: ACCENT }}>붉은 테두리</b>는 나를 보는 중심 자리</div>
            <div><b>윗글자</b>는 겉으로 드러나는 기운</div>
            <div><b>아랫글자</b>는 안쪽에 깔린 자리</div>
          </div>
        </div>
        <div className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(184,134,70,0.22)" }}>
          <div className="text-[11px] font-bold mb-2" style={{ color: "#6b1e3a", fontFamily: "'Nanum Myeongjo', serif" }}>
            글자 색상
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ELEMENT_LEGEND.map((e) => (
              <div key={e.name} className="rounded-md py-1.5 text-center" style={{ background: `${e.color}12`, border: `1px solid ${e.color}35` }}>
                <div className="text-[11px] font-black" style={{ color: e.color, fontFamily: "'Nanum Myeongjo', serif" }}>{e.name}</div>
                <div className="text-[9px] leading-tight" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-md px-3 py-2 text-[11px] leading-[1.55]" style={{ background: "rgba(255,255,255,0.58)", border: "1px solid rgba(184,134,70,0.2)", color: INK, fontFamily: "'Gowun Batang', serif" }}>
        {name}님의 중심은 <b style={{ color: ACCENT }}>{day.stem}</b>({meaningForStem(day)})이고,
        마음의 바닥에는 <b style={{ color: ACCENT }}>{day.branch}</b>({meaningForBranch(day)})의 결이 깔려 있어요.
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(184,134,70,0.28)" }}>
        <div className="text-center text-[12px] font-bold mb-1" style={{ color: GOLD, fontFamily: "'Nanum Myeongjo', serif" }}>
          십성은 두 개씩 묶어서 보면 쉬워요
        </div>
        <div className="text-center text-[10.8px] mb-3" style={{ color: MUTED, fontFamily: "'Gowun Batang', serif" }}>
          예: 비견과 겁재를 각각 따로 읽고, 둘을 합친 큰 묶음을 비겁이라고 불러요.
        </div>

        <div className="grid grid-cols-1 gap-2">
          {ROLE_GROUPS.map((g) => (
            <div
              key={g.group}
              className="grid grid-cols-[1fr_22px_58px_1fr] items-center gap-1.5 rounded-md px-2 py-2"
              style={{ background: "rgba(255,255,255,0.56)", border: "1px solid rgba(184,134,70,0.18)" }}
            >
              <div className="flex gap-1 min-w-0">
                {g.pair.map((p) => (
                  <span
                    key={p}
                    className="flex-1 rounded-full px-1.5 py-1 text-center text-[10.5px] font-bold"
                    style={{ color: g.color, background: `${g.color}10`, border: `1px solid ${g.color}35`, fontFamily: "'Gowun Batang', serif" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="text-center text-[13px] font-bold" style={{ color: GOLD }}>→</div>
              <div
                className="rounded-full py-1 text-center text-[11px] font-black"
                style={{ color: "#fff", background: g.color, fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {g.group}
              </div>
              <div className="text-[10.8px] leading-tight" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
                {g.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
