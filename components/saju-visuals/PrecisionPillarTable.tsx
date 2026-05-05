// ── 4기둥 정밀표 (Phase 1 — 양반사주 채택+변형) ──
// 양반사주 7행 풀 표 → paljawon: 6행 표 (12신살은 후속, 우선 핵심 정보만 압축)
// paljawon 차별점: 한지 톤 + 일주(자녀 본인) 강조 + 자원 톤
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { STEM_HANJA, BRANCH_HANJA } from "@/lib/saju-calculator";
import { CHEONGAN, JIJI, ELEMENT_COLOR, type ElementKey } from "@/lib/saju-symbols";

// ── 12운성 계산 (lib/saju-traditional의 calcUnseong을 4기둥 모두에 적용) ──
const UNSEONG_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
const UNSEONG_HANJA: Record<string, string> = {
  "장생": "長生", "목욕": "沐浴", "관대": "冠帶", "건록": "建祿", "제왕": "帝旺", "쇠": "衰",
  "병": "病", "사": "死", "묘": "墓", "절": "絶", "태": "胎", "양": "養",
};
const UNSEONG_START: Record<string, string> = {
  갑: "해", 을: "오", 병: "인", 정: "유", 무: "인", 기: "유",
  경: "사", 신: "자", 임: "신", 계: "묘",
};
const STEM_YIN_YANG: Record<string, "양" | "음"> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양", 기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};
const BRANCHES_ORDER = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

function calcUnseongForBranch(ilgan: string, branch: string): { stage: string; hanja: string } | null {
  const start = UNSEONG_START[ilgan];
  if (!start) return null;
  const isYang = STEM_YIN_YANG[ilgan] === "양";
  const sIdx = BRANCHES_ORDER.indexOf(start as typeof BRANCHES_ORDER[number]);
  const tIdx = BRANCHES_ORDER.indexOf(branch as typeof BRANCHES_ORDER[number]);
  if (sIdx < 0 || tIdx < 0) return null;
  const offset = isYang ? (tIdx - sIdx + 12) % 12 : (sIdx - tIdx + 12) % 12;
  const stage = UNSEONG_STAGES[offset];
  return { stage, hanja: UNSEONG_HANJA[stage] ?? stage };
}

// ── 신살 자동 분류 (귀인계 / 살계) — UI 컬러 분리용 ──
const GUIIN_NAMES = new Set([
  "천을귀인", "천덕귀인", "월덕귀인", "태극귀인", "문창귀인", "학당귀인", "복성귀인", "금여",
]);

interface Props {
  saju: SajuAnalysis;
  variant?: "dark" | "light";
}

export default function PrecisionPillarTable({ saju, variant = "dark" }: Props) {
  const isDark = variant === "dark";
  const pal = isDark
    ? {
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.12)",
      headerBg: "rgba(255,255,255,0.06)",
      text: "rgba(255,255,255,0.88)",
      sub: "rgba(255,255,255,0.55)",
      label: "rgba(255,255,255,0.6)",
      dayBg: "rgba(255,215,0,0.08)",
      dayBorder: "rgba(255,215,0,0.5)",
    }
    : {
      bg: "#e8ddc4",
      border: "#5a4a2e55",
      headerBg: "#d8cba8",
      text: "#1f1a14",
      sub: "#5a4a2e",
      label: "#7a6442",
      dayBg: "#c8a85c33",
      dayBorder: "#8a6a2a",
    };

  // 4기둥 (시 · 일 · 월 · 년) — 양반사주 정통 우→좌 순서
  const cols = [
    { key: "hour",  label: "시(時)", p: saju.pillars.hour, sip: saju.sipseong.hour, isDay: false },
    { key: "day",   label: "일(日)", p: saju.pillars.day,  sip: saju.sipseong.day,  isDay: true },
    { key: "month", label: "월(月)", p: saju.pillars.month, sip: saju.sipseong.month, isDay: false },
    { key: "year",  label: "년(年)", p: saju.pillars.year, sip: saju.sipseong.year, isDay: false },
  ];

  // 천간 색상 (오행 기반)
  const stemColor = (stem: string): string => {
    const info = CHEONGAN[STEM_HANJA[stem as keyof typeof STEM_HANJA] ?? ""];
    if (!info) return pal.text;
    return ELEMENT_COLOR[info.element];
  };
  const branchColor = (branch: string): string => {
    const info = JIJI[BRANCH_HANJA[branch as keyof typeof BRANCH_HANJA] ?? ""];
    if (!info) return pal.text;
    return ELEMENT_COLOR[info.element];
  };

  // 신살 가운데 일주 본인 신살 (전체 sinsal 중 자녀에게 의미 있는 것 한두 개)
  const guiinList = saju.sinsal.filter(s => GUIIN_NAMES.has(s));
  const salList = saju.sinsal.filter(s => !GUIIN_NAMES.has(s));

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: pal.bg, border: `1px solid ${pal.border}` }}
    >
      <div className="grid grid-cols-5 text-[10.5px]" style={{ color: pal.label }}>
        {/* 헤더: 빈칸 + 4기둥 */}
        <div
          className="text-center py-2 px-1"
          style={{ background: pal.headerBg, fontSize: 10, color: pal.label }}
        >
          구분
        </div>
        {cols.map(c => (
          <div
            key={`h-${c.key}`}
            className="text-center py-2 px-1 font-bold"
            style={{
              background: c.isDay ? pal.dayBg : pal.headerBg,
              color: c.isDay ? (isDark ? "#FFD700" : "#5a4a2e") : pal.sub,
              fontSize: 11,
            }}
          >
            {c.label}
            {c.isDay && <span className="block text-[9px] mt-0.5">★ 본인</span>}
          </div>
        ))}

        {/* 1행: 십성 (천간) */}
        <RowLabel pal={pal}>십성<br /><span style={{ fontSize: 9 }}>(천간)</span></RowLabel>
        {cols.map(c => (
          <Cell key={`sst-${c.key}`} pal={pal} isDay={c.isDay}>
            <span style={{ fontSize: 11, color: pal.sub }}>
              {c.sip?.stem ?? "—"}
            </span>
          </Cell>
        ))}

        {/* 2행: 천간 */}
        <RowLabel pal={pal}>천간<br /><span style={{ fontSize: 9 }}>(天干)</span></RowLabel>
        {cols.map(c => (
          <Cell key={`st-${c.key}`} pal={pal} isDay={c.isDay}>
            {c.p ? (
              <div className="text-center">
                <div className="text-[20px] font-bold leading-none" style={{ color: stemColor(c.p.stem), fontFamily: "serif" }}>
                  {STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA] ?? c.p.stem}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: pal.sub }}>{c.p.stem}</div>
              </div>
            ) : <span style={{ color: pal.sub }}>—</span>}
          </Cell>
        ))}

        {/* 3행: 지지 */}
        <RowLabel pal={pal}>지지<br /><span style={{ fontSize: 9 }}>(地支)</span></RowLabel>
        {cols.map(c => (
          <Cell key={`bt-${c.key}`} pal={pal} isDay={c.isDay}>
            {c.p ? (
              <div className="text-center">
                <div className="text-[20px] font-bold leading-none" style={{ color: branchColor(c.p.branch), fontFamily: "serif" }}>
                  {BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA] ?? c.p.branch}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: pal.sub }}>{c.p.branch}</div>
              </div>
            ) : <span style={{ color: pal.sub }}>—</span>}
          </Cell>
        ))}

        {/* 4행: 십성 (지지) */}
        <RowLabel pal={pal}>십성<br /><span style={{ fontSize: 9 }}>(지지)</span></RowLabel>
        {cols.map(c => (
          <Cell key={`ssb-${c.key}`} pal={pal} isDay={c.isDay}>
            <span style={{ fontSize: 11, color: pal.sub }}>
              {c.sip?.branch ?? "—"}
            </span>
          </Cell>
        ))}

        {/* 5행: 12운성 */}
        <RowLabel pal={pal}>12운성<br /><span style={{ fontSize: 9 }}>(運星)</span></RowLabel>
        {cols.map(c => {
          const u = c.p ? calcUnseongForBranch(saju.ilgan, c.p.branch) : null;
          return (
            <Cell key={`u-${c.key}`} pal={pal} isDay={c.isDay}>
              {u ? (
                <span style={{ fontSize: 11, color: pal.text }}>
                  {u.stage}
                </span>
              ) : <span style={{ color: pal.sub }}>—</span>}
            </Cell>
          );
        })}
      </div>

      {/* 신살·귀인 — 표 하단에 통합 표시 */}
      {(guiinList.length > 0 || salList.length > 0) && (
        <div
          className="px-3 py-2.5 border-t"
          style={{ borderColor: pal.border, background: pal.headerBg }}
        >
          {guiinList.length > 0 && (
            <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px]" style={{ color: pal.label, minWidth: 36 }}>귀인</span>
              {guiinList.map((g) => (
                <span
                  key={g}
                  className="text-[10.5px] px-1.5 py-0.5 rounded"
                  style={{
                    background: isDark ? "rgba(255,215,0,0.12)" : "#c8a85c33",
                    color: isDark ? "#FFD700" : "#7a5c1a",
                    border: `1px solid ${isDark ? "rgba(255,215,0,0.3)" : "#8a6a2a55"}`,
                  }}
                >
                  ✦ {g}
                </span>
              ))}
            </div>
          )}
          {salList.length > 0 && (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px]" style={{ color: pal.label, minWidth: 36 }}>신살</span>
              {salList.map((s) => (
                <span
                  key={s}
                  className="text-[10.5px] px-1.5 py-0.5 rounded"
                  style={{
                    background: isDark ? "rgba(196,60,60,0.1)" : "#c43c3c1a",
                    color: isDark ? "#e88a8a" : "#8a3a3a",
                    border: `1px solid ${isDark ? "rgba(196,60,60,0.25)" : "#c43c3c44"}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 헬퍼 셀 ──
type Pal = ReturnType<typeof palStub>;
function palStub() { return { bg: "", border: "", headerBg: "", text: "", sub: "", label: "", dayBg: "", dayBorder: "" }; }

function RowLabel({ children, pal }: { children: React.ReactNode; pal: Pal }) {
  return (
    <div
      className="text-center py-2.5 px-1 flex items-center justify-center"
      style={{ background: pal.headerBg, color: pal.label, borderTop: `1px solid ${pal.border}`, fontSize: 10, lineHeight: 1.25 }}
    >
      {children}
    </div>
  );
}

function Cell({ children, pal, isDay }: { children: React.ReactNode; pal: Pal; isDay: boolean }) {
  return (
    <div
      className="text-center py-2.5 px-1 flex items-center justify-center"
      style={{
        background: isDay ? pal.dayBg : "transparent",
        borderTop: `1px solid ${pal.border}`,
        borderLeft: `1px solid ${pal.border}33`,
      }}
    >
      {children}
    </div>
  );
}
