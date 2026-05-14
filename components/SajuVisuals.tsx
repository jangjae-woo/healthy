// 평생사주 (paljawon.com/saju) 시각화 모듈
// parent-child 시각화 컴포넌트를 짙은 녹색 BG 톤으로 포팅 (2026-05-13)
//
// 색 톤 정책:
// - 카드 BG: rgba(255,255,255,0.06) — 짙은 녹색 BG 위 옅은 흰 카드
// - border: rgba(201,150,12,0.3) — 금색 옅음
// - 본문 글자: #ffffff (흰색), 보조: rgba(255,255,255,0.7)
// - 강조: #c9960c (ACCENT 금색) + #f0c040 (밝은 금색)
// - 오행 색·십성 색: 명리 통설 그대로 유지

import { type SajuAnalysis, getSipseong } from "@/lib/saju-calculator";

const ACCENT = "#c9960c";
const ACCENT_BRIGHT = "#f0c040";
const CARD_BG = "rgba(255,255,255,0.06)";
const CARD_BORDER = "rgba(201,150,12,0.3)";
const TEXT_MAIN = "#ffffff";
const TEXT_MUTED = "rgba(255,255,255,0.7)";
const TEXT_SOFT = "rgba(255,255,255,0.5)";

// ─── 상수 ────────────────────────────────────────────────
const ELEM_ORDER = ["목", "화", "토", "금", "수"] as const;
const ELEM_COLORS: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#94a3b8", 수: "#60a5fa",
};
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_DESC: Record<string, string> = {
  목: "호기심·성장", 화: "열정·표현", 토: "안정·신뢰", 금: "결단·의지", 수: "지혜·유연",
};
const ELEM_NAME_FRIENDLY: Record<string, { label: string }> = {
  목: { label: "나무 — 호기심·성장" },
  화: { label: "불 — 열정·표현" },
  토: { label: "흙 — 안정·신뢰" },
  금: { label: "쇠 — 결단·의지" },
  수: { label: "물 — 지혜·유연" },
};
const ELEM_SPECTRUM: Record<string, { weak: string; strong: string; balanced: string }> = {
  목: { weak: "호기심·성장보다 신중함이 두드러지는 결", strong: "호기심·성장이 강해 새 도전을 좋아하는 결", balanced: "호기심과 신중함이 고루 있는 결" },
  화: { weak: "열정·표현보다 차분함이 두드러지는 결", strong: "열정·표현이 강해 감정이 풍부한 결", balanced: "열정과 차분함이 고루 있는 결" },
  토: { weak: "안정·신뢰보다 새로운 자극에 끌리는 결", strong: "안정·신뢰가 강해 한결같은 결", balanced: "안정과 변화가 고루 있는 결" },
  금: { weak: "결단·의지보다 부드러운 양보가 두드러지는 결", strong: "결단·의지가 강해 결단력이 분명한 결", balanced: "결단과 부드러움이 고루 있는 결" },
  수: { weak: "지혜·유연보다 빠른 행동이 앞서는 결", strong: "지혜·유연이 강해 적응을 잘하는 결", balanced: "고집과 유연이 고루 있는 결" },
};

const SIP_COLORS: Record<string, string> = {
  비겁: "#f5b942", 식상: "#ff9d6b", 재성: "#7dd3c0", 관성: "#7eb6ff", 인성: "#c89cff",
};
const SIPSEONG_DESC: Record<string, string> = {
  비겁: "자기 결", 식상: "표현 결", 재성: "결과 결", 관성: "절제 결", 인성: "사색 결",
};
const SIPSEONG_SPECTRUM: Record<string, { label: string; weak: string; strong: string; balanced: string; explain: string }> = {
  비겁: {
    label: "자기를 세우는 결",
    weak: "남에게 잘 맞춰주고 따라가는 편 — 함께하는 걸 좋아하지만 자기 의견은 늦게 드러내는 결",
    strong: "자기 주관이 분명하고 끌어가는 편 — 친구·동료 사이에서 리더가 되는 모습이 자주 보이는 결",
    balanced: "자기 주관과 어울림이 고루 — 혼자서도 함께서도 잘 지내는 결",
    explain: "사회·관계에서 자기 자리를 어떻게 잡는지의 결",
  },
  식상: {
    label: "표현하는 결",
    weak: "마음을 안에서 정리하고 겉으로 잘 드러내지 않는 편 — 말보다 행동이나 글로 표현하는 결",
    strong: "말·창작·표현이 풍부하고 활발한 결 — 손과 입이 먼저 움직이는 결",
    balanced: "표현과 침착함이 고루 — 상황에 맞춰 드러내고 거두는 결",
    explain: "마음과 생각을 바깥으로 어떻게 풀어내는지의 결",
  },
  재성: {
    label: "손에 잡히는 결",
    weak: "손에 잡히는 결과보다 머릿속 이상에 끌리는 결 — 결과 챙김이 늦은 편",
    strong: "돈·물건·결과를 챙기는 감각이 좋고 실용적인 결",
    balanced: "이상과 결과가 고루 — 꿈도 꾸고 실리도 챙기는 결",
    explain: "돈·물건·구체적 결과에 어떻게 끌리는지의 결",
  },
  관성: {
    label: "절제하는 결",
    weak: "자유롭고 틀에 얽매이는 걸 싫어하는 결 — 규칙보다 자기 길로 가고 싶어하는 결",
    strong: "규칙·책임감이 강하고 절제가 잘되는 결 — 어른스럽고 약속을 잘 지키는 결",
    balanced: "자유와 절제가 고루 — 필요할 때는 따르고 필요할 때는 자기 길",
    explain: "규칙·약속·틀을 어떻게 받아들이는지의 결",
  },
  인성: {
    label: "사색하는 결",
    weak: "직관·즉각 반응이 빠르고 깊이 파지는 않는 결 — 느낀 대로 빠르게 움직이는 결",
    strong: "깊이 사색하고 받아들이는 결이 큰 결 — 책·생각·혼자 시간을 좋아하는 결",
    balanced: "직관과 사색이 고루 — 빠르게 느끼고 깊이 곱씹는 결",
    explain: "정보·감정을 어떻게 흡수하고 곱씹는지의 결",
  },
};

// ─── helper ───────────────────────────────────────────────
export function adjustElementsForDisplay(raw: Record<string, number>): Record<string, number> {
  const total = ELEM_ORDER.reduce((s, k) => s + (raw[k] || 0), 0) || 1;
  const pct: Record<string, number> = {};
  for (const k of ELEM_ORDER) pct[k] = ((raw[k] || 0) / total) * 100;
  return pct;
}

export type SipseongCount = {
  비겁: number; 식상: number; 재성: number; 관성: number; 인성: number;
};

// SajuAnalysis.sipseong (구체 십성 매핑) → SipseongCount (5개 그룹 카운트)
// 비견·겁재 → 비겁 / 식신·상관 → 식상 / 정재·편재 → 재성 / 정관·편관·칠살 → 관성 / 정인·편인·효신 → 인성
export function countSipseongFromSaju(saju: SajuAnalysis): SipseongCount {
  const counts: SipseongCount = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const pillars = saju.sipseong;
  const tokens: string[] = [];
  for (const pos of ["year", "month", "day", "hour"] as const) {
    const p = pillars[pos];
    if (!p) continue;
    tokens.push(p.stem, p.branch);
  }
  for (const t of tokens) {
    if (t === "비견" || t === "겁재") counts.비겁++;
    else if (t === "식신" || t === "상관") counts.식상++;
    else if (t === "정재" || t === "편재") counts.재성++;
    else if (t === "정관" || t === "편관" || t === "칠살") counts.관성++;
    else if (t === "정인" || t === "편인" || t === "효신") counts.인성++;
  }
  return counts;
}

// ─── 컴포넌트 ─────────────────────────────────────────────

// 오행 분포 펜타곤 — 짙은 녹색 BG 위 금색 grid + 오행별 색 점
export function SajuElementsRadar({ elements }: { elements: Record<string, number> }) {
  const adjusted = adjustElementsForDisplay(elements);
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
    <div className="flex justify-center my-4 rounded-2xl py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <svg width="340" height="320" viewBox="0 0 340 320">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(201,150,12,0.5)" : "rgba(201,150,12,0.2)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ELEM_ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(201,150,12,0.3)" strokeWidth="1" />;
        })}
        <polygon points={dataPts} fill={`${ELEM_COLORS[topEl]}45`} stroke={ELEM_COLORS[topEl]} strokeWidth="2.5" strokeLinejoin="round" />
        {ELEM_ORDER.map((el, i) => {
          const [lx, ly] = pt(i, LO);
          const pct = Math.round(adjusted[el] ?? 0);
          const isTop = el === topEl;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 10} textAnchor={anchor} fontSize="22" fontWeight="bold" fill={ELEM_COLORS[el]}>{ELEM_HANJA[el]}</text>
              <text x={lx + dx} y={ly + 12} textAnchor={anchor} fontSize="16" fontWeight={isTop ? "bold" : "normal"} fill={isTop ? ACCENT_BRIGHT : ELEM_COLORS[el]}>{pct}%</text>
              <text x={lx + dx} y={ly + 26} textAnchor={anchor} fontSize="11" fill={TEXT_MUTED}>{ELEM_DESC[el].split("·")[0]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 오행 강·약 스펙트럼 (각 오행마다 ↑↓≈ + 해설 한 줄)
export function SajuElementsSpectrum({ elements }: { elements: Record<string, number> }) {
  const adjusted = adjustElementsForDisplay(elements);
  return (
    <div className="mt-4">
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3" style={{ color: TEXT_MUTED }}>
        ※ 다섯 기운 분포입니다. <strong style={{ color: ACCENT_BRIGHT }}>강하면 본질 그대로</strong>, <strong style={{ color: ACCENT_BRIGHT }}>약하면 반대 모습</strong>이 두드러집니다.
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}`, backgroundColor: CARD_BG }}>
        {ELEM_ORDER.map((el, idx) => {
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
            <div key={el} className="px-3 py-3" style={{ borderTop: idx === 0 ? "none" : "1px solid rgba(201,150,12,0.18)" }}>
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-xl font-bold" style={{ color }}>{ELEM_HANJA[el]}</span>
                <span className="text-[13px]" style={{ color: TEXT_MAIN }}>{ELEM_NAME_FRIENDLY[el].label.replace(/^.*— /, "")}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold" style={{ color: dominant === "balanced" ? ACCENT_BRIGHT : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[13px] leading-snug flex-1" style={{ color: TEXT_MAIN }}>{phrase}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 십성 분포 펜타곤
export function SajuSipseongRadar({ counts }: { counts: SipseongCount }) {
  const ORDER: (keyof SipseongCount)[] = ["비겁", "식상", "재성", "관성", "인성"];
  const top = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]) as keyof SipseongCount;
  const cx = 170, cy = 200, R = 70;
  const MIN_SCALE = 0.08;
  const displayCounts: Record<string, number> = {};
  ORDER.forEach((k) => { displayCounts[k] = counts[k] === 0 ? 1 : counts[k]; });
  const angs = ORDER.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [cx + R * s * Math.cos(angs[i]), cy + R * s * Math.sin(angs[i])];
  const gridPts = (s: number) => ORDER.map((_, i) => pt(i, s).join(",")).join(" ");
  const LO = 1.42;
  return (
    <div className="flex justify-center my-4 rounded-2xl py-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <svg width="340" height="380" viewBox="0 0 340 380">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(201,150,12,0.5)" : "rgba(201,150,12,0.2)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(201,150,12,0.3)" strokeWidth="1" />;
        })}
        {ORDER.map((k, i) => {
          if (counts[k] === 0) return null;
          const raw = displayCounts[k] / 5;
          const s = Math.min(1.0, Math.max(MIN_SCALE, raw));
          const [x, y] = pt(i, s);
          return <line key={`bar-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={ACCENT_BRIGHT} strokeWidth="6" strokeLinecap="round" opacity={0.85} />;
        })}
        {ORDER.map((k, i) => {
          const [lx, ly] = pt(i, LO);
          const isTop = k === top;
          const isZero = counts[k] === 0;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          const labelColor = isZero ? "rgba(255,255,255,0.4)" : isTop ? ACCENT_BRIGHT : TEXT_MAIN;
          const subColor = isZero ? "rgba(255,255,255,0.3)" : TEXT_MUTED;
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 8} textAnchor={anchor} fontSize="14" fontWeight={isTop ? "bold" : "normal"} fill={labelColor}>
                {isZero ? k : `${k} ${counts[k]}`}
              </text>
              <text x={lx + dx} y={ly + 8} textAnchor={anchor} fontSize="10" fill={subColor}>{SIPSEONG_DESC[k]}</text>
              {isZero && (
                <text x={lx + dx} y={ly + 22} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.3)" fontWeight="600">약한 부분</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 십성 강·약 스펙트럼
export function SajuSipseongSpectrum({ counts }: { counts: SipseongCount }) {
  const ORDER: Array<keyof SipseongCount> = ["비겁", "식상", "재성", "관성", "인성"];
  const total = ORDER.reduce((s, k) => s + counts[k], 0);
  const avg = total / 5;
  return (
    <div className="mt-4">
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3" style={{ color: TEXT_MUTED }}>
        ※ 다섯 기질 분포입니다. <strong style={{ color: ACCENT_BRIGHT }}>강하면 본질 그대로</strong>, <strong style={{ color: ACCENT_BRIGHT }}>약하면 반대 모습</strong>이 두드러집니다.
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}`, backgroundColor: CARD_BG }}>
        {ORDER.map((k, idx) => {
          const v = counts[k];
          const color = SIP_COLORS[k];
          const diff = v - avg;
          let dominant: "weak" | "strong" | "balanced";
          if (v === 0) dominant = "weak";
          else if (Math.abs(diff) <= 0.4) dominant = "balanced";
          else if (diff > 0) dominant = "strong";
          else dominant = "weak";
          const data = SIPSEONG_SPECTRUM[k];
          const phrase = dominant === "balanced" ? data.balanced : dominant === "strong" ? data.strong : data.weak;
          const arrow = dominant === "strong" ? "↑" : dominant === "weak" ? "↓" : "≈";
          const arrowLabel = dominant === "strong" ? "강함" : dominant === "weak" ? "약함" : "균형";
          return (
            <div key={k} className="px-3 py-3" style={{ borderTop: idx === 0 ? "none" : "1px solid rgba(201,150,12,0.18)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[15px] font-bold" style={{ color }}>{k}</span>
                <span className="text-[12px]" style={{ color: TEXT_MAIN }}>{data.label}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{v}</span>
              </div>
              <p className="text-[10.5px] leading-snug mb-1.5" style={{ color: TEXT_SOFT, fontStyle: "italic" }}>{data.explain}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold flex-shrink-0" style={{ color: dominant === "balanced" ? ACCENT_BRIGHT : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[12.5px] leading-snug flex-1" style={{ color: TEXT_MAIN }}>{phrase}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 용신을 극(剋)하는 오행 = 기신(忌神). 용신과 절대 같을 수 없음.
const GISIN_OF: Record<string, string> = { 목: "금", 화: "수", 토: "목", 금: "화", 수: "토" };

// 용신·기신 카드 (compass·closing 섹션용)
// ⭐ 2026-05-14 fix: 살펴줄 결 = "가장 약한 오행"(weakest) → "기신"(용신을 극하는 오행)으로 정정.
// 이전엔 신약 사주에서 용신==weakest 빈발 → 채워줄 결·살펴줄 결 같은 오행 표시 버그.
export function SajuYongsinCard({ yongsin }: { yongsin: string }) {
  const gisin = GISIN_OF[yongsin] ?? "토";
  const yongsinColor = ELEM_COLORS[yongsin] ?? ACCENT;
  const gisinColor = ELEM_COLORS[gisin] ?? "#ef4444";
  return (
    <div className="my-4 rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
          style={{ backgroundColor: `${yongsinColor}33`, color: yongsinColor, border: `2px solid ${yongsinColor}88` }}>
          {ELEM_HANJA[yongsin] ?? "?"}
        </div>
        <div className="flex-1">
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>채워줄 결 (용신)</div>
          <div className="text-[16px] font-bold" style={{ color: yongsinColor }}>{yongsin} — {ELEM_DESC[yongsin]}</div>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed mb-3" style={{ color: TEXT_MAIN }}>
        평생 가져가면 좋은 기운. <strong style={{ color: yongsinColor }}>{ELEM_DESC[yongsin]}</strong>의 결을 일상에 들이면 빛나기 쉬워요.
      </p>
      <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: `1px dashed ${CARD_BORDER}` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
          style={{ backgroundColor: `${gisinColor}33`, color: gisinColor, border: `2px solid ${gisinColor}66` }}>
          {ELEM_HANJA[gisin] ?? "?"}
        </div>
        <div className="flex-1">
          <div className="text-[11px]" style={{ color: TEXT_MUTED }}>살펴줄 결 (기신 — 과하면 흔들리는 기운)</div>
          <div className="text-[14px] font-bold" style={{ color: gisinColor }}>{gisin} — {ELEM_DESC[gisin]}</div>
        </div>
      </div>
    </div>
  );
}

// 인생 키워드 카드 (closing 섹션용)
export function SajuKeywordCard({ keywords }: { keywords: string[] }) {
  return (
    <div className="my-4 rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[11px] mb-3 text-center" style={{ color: TEXT_MUTED }}>평생 가져갈 인생 키워드</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {keywords.map((kw, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full text-[13px] font-bold"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT_BRIGHT, border: `1px solid ${ACCENT}44` }}>
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 목차별 전용 시각화 (2026-05-14)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─ 재능 TOP 3 카드 (personality2 = 타고난 재능의 방향) ─
const TALENT_LABEL: Record<string, { title: string; phrase: string }> = {
  비겁: { title: "주도하는 재능", phrase: "내 자리를 만들고 이끄는 결" },
  식상: { title: "표현하는 재능", phrase: "말·글·창작으로 풀어내는 결" },
  재성: { title: "결과 만드는 재능", phrase: "돈·기회·실리를 챙기는 결" },
  관성: { title: "관리하는 재능", phrase: "조직·규율·책임을 다잡는 결" },
  인성: { title: "사색하는 재능", phrase: "공부·전문성·깊이를 쌓는 결" },
};
export function SajuTalentTop3({ counts }: { counts: SipseongCount }) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]) as [keyof SipseongCount, number][];
  const top3 = sorted.slice(0, 3);
  const total = sorted.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <div className="my-4 rounded-2xl p-4 space-y-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[12px] mb-1 text-center" style={{ color: TEXT_MUTED }}>당신을 빛나게 하는 결 TOP 3</div>
      {top3.map(([k, n], i) => {
        const pct = Math.round((n / total) * 100);
        const color = SIP_COLORS[k];
        const meta = TALENT_LABEL[k];
        return (
          <div key={k} className="rounded-xl p-3" style={{ backgroundColor: `${color}14`, border: `1px solid ${color}44` }}>
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-bold flex-shrink-0" style={{ color }}>{i + 1}.</span>
              <span className="text-[14px] font-bold" style={{ color }}>{meta?.title ?? k}</span>
              <span className="text-[11px] ml-auto tabular-nums" style={{ color: TEXT_MUTED }}>{pct}%</span>
            </div>
            <p className="text-[12px] leading-snug mt-1" style={{ color: TEXT_MAIN }}>{meta?.phrase ?? ''}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─ 재물 결 + 점수 (money1 = 돈과 현실 감각) ─
export function SajuMoneyMeter({ counts }: { counts: SipseongCount }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const jaeseong = counts.재성;
  const siksang = counts.식상;
  const insang = counts.인성;
  // 재물 결 점수: 재성 + 식상*0.6 - 인성*0.3 정규화
  const raw = jaeseong * 1.0 + siksang * 0.6 - insang * 0.3;
  const score = Math.max(0, Math.min(100, Math.round((raw / Math.max(total * 0.6, 3)) * 100 + 30)));
  const tone = score >= 70 ? "강한 재물 결" : score >= 45 ? "고른 재물 결" : "사색·이상이 앞서는 결";
  const toneColor = score >= 70 ? "#7dd3c0" : score >= 45 ? ACCENT_BRIGHT : "#c89cff";
  const order: (keyof SipseongCount)[] = ["재성", "식상", "비겁", "관성", "인성"];
  return (
    <div className="my-4 rounded-2xl p-4 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-center">
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>재물 결 점수</div>
        <div className="text-[34px] font-bold tabular-nums leading-tight" style={{ color: toneColor }}>{score}</div>
        <div className="text-[12px]" style={{ color: TEXT_MAIN }}>{tone}</div>
      </div>
      <div className="space-y-2">
        {order.map((k) => {
          const n = counts[k];
          const pct = Math.round((n / total) * 100);
          const color = SIP_COLORS[k];
          const isMain = k === "재성";
          return (
            <div key={k}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[12px] font-bold" style={{ color }}>{k}</span>
                {isMain && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${ACCENT}30`, color: ACCENT_BRIGHT }}>돈 결 핵심</span>}
                <span className="text-[11px] ml-auto tabular-nums" style={{ color: TEXT_MUTED }}>{n}개 · {pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}22` }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: isMain ? 1 : 0.6 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ 직업 적성 6각 레이더 (money2 = 일과 직업의 방향) ─
// 6 dimensions: 리더형 / 전문형 / 창작형 / 영업형 / 기술형 / 돌봄형
const JOB_AXES = ["리더", "전문", "창작", "영업", "기술", "돌봄"] as const;
const JOB_PHRASES: Record<string, string> = {
  리더: "조직 끌고 결정 내리는 결",
  전문: "한 분야 파고드는 결",
  창작: "말·글·디자인으로 푸는 결",
  영업: "사람 만나고 거래 트는 결",
  기술: "손으로 만들고 다듬는 결",
  돌봄: "타인 살피고 가르치는 결",
};
function jobScores(counts: SipseongCount, elements: Record<string, number>): Record<string, number> {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const elemTotal = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const sNorm = (k: keyof SipseongCount) => counts[k] / total;
  const eNorm = (k: string) => (elements[k] || 0) / elemTotal;
  return {
    리더: Math.min(1, sNorm("관성") * 1.2 + sNorm("비겁") * 0.6),
    전문: Math.min(1, sNorm("인성") * 1.3 + eNorm("수") * 0.4),
    창작: Math.min(1, sNorm("식상") * 1.1 + eNorm("화") * 0.5),
    영업: Math.min(1, sNorm("식상") * 0.7 + sNorm("재성") * 0.8 + eNorm("화") * 0.3),
    기술: Math.min(1, eNorm("금") * 0.9 + eNorm("토") * 0.6 + sNorm("재성") * 0.3),
    돌봄: Math.min(1, eNorm("토") * 0.8 + sNorm("인성") * 0.6),
  };
}
export function SajuJobRadar({ counts, elements }: { counts: SipseongCount; elements: Record<string, number> }) {
  const scores = jobScores(counts, elements);
  const cx = 170, cy = 165, R = 75;
  const angs = JOB_AXES.map((_, i) => ((i * 60 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [cx + R * s * Math.cos(angs[i]), cy + R * s * Math.sin(angs[i])];
  const gridPts = (s: number) => JOB_AXES.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = JOB_AXES.map((a, i) => pt(i, Math.max(0.08, scores[a])).join(",")).join(" ");
  const topJob = JOB_AXES.map((a) => ({ a, s: scores[a] })).sort((x, y) => y.s - x.s)[0]?.a ?? "리더";
  return (
    <div className="my-4 rounded-2xl p-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="flex justify-center">
        <svg width="340" height="300" viewBox="0 0 340 300">
          {[0.33, 0.66, 1.0].map((s, idx) => (
            <polygon key={idx} points={gridPts(s)} fill="none" stroke={`${ACCENT}33`} strokeWidth={1} />
          ))}
          <polygon points={dataPts} fill={`${ACCENT}55`} stroke={ACCENT_BRIGHT} strokeWidth={2} />
          {JOB_AXES.map((a, i) => {
            const [x, y] = pt(i, 1.3);
            const isTop = a === topJob;
            return (
              <text key={a} x={x} y={y} textAnchor="middle" alignmentBaseline="middle"
                fontSize={isTop ? 14 : 12} fontWeight={isTop ? 700 : 500} fill={isTop ? ACCENT_BRIGHT : TEXT_MAIN}>
                {a}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="rounded-xl p-3 mt-2" style={{ backgroundColor: `${ACCENT}11`, border: `1px solid ${ACCENT}30` }}>
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>가장 빛나는 결</div>
        <div className="text-[15px] font-bold" style={{ color: ACCENT_BRIGHT }}>{topJob}형</div>
        <div className="text-[12px] mt-1" style={{ color: TEXT_MAIN }}>{JOB_PHRASES[topJob]}</div>
      </div>
    </div>
  );
}

// ─ 건강 부위 체크 (health = 몸과 마음의 리듬) ─
const BODY_BY_ELEM: Record<string, { parts: string[]; care: string }> = {
  목: { parts: ["간", "근육·인대", "눈"], care: "스트레칭·과로 조심" },
  화: { parts: ["심장", "혈관·혈압", "소장"], care: "스트레스·과음 조심" },
  토: { parts: ["위장·비장", "소화기", "복부"], care: "폭식·자극적 음식 조심" },
  금: { parts: ["폐·기관지", "대장", "피부"], care: "환절기·미세먼지 조심" },
  수: { parts: ["신장·방광", "허리·무릎", "귀"], care: "찬 기운·수분 부족 조심" },
};
export function SajuHealthMap({ elements }: { elements: Record<string, number> }) {
  const total = Object.values(elements).reduce((a, b) => a + b, 0) || 1;
  const order: { el: string; pct: number; status: "약" | "보통" | "강" }[] = ELEM_ORDER.map((el) => {
    const pct = Math.round(((elements[el] || 0) / total) * 100);
    const status: "약" | "보통" | "강" = pct < 12 ? "약" : pct > 28 ? "강" : "보통";
    return { el, pct, status };
  });
  return (
    <div className="my-4 rounded-2xl p-4 space-y-2" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[11px] text-center mb-2" style={{ color: TEXT_MUTED }}>오행 → 몸 부위 매핑 (약한 결은 살펴주세요)</div>
      {order.map(({ el, pct, status }) => {
        const meta = BODY_BY_ELEM[el];
        const color = ELEM_COLORS[el];
        const isWeak = status === "약";
        return (
          <div key={el} className="rounded-xl p-3"
            style={{
              backgroundColor: isWeak ? `${color}22` : `${color}0c`,
              border: `1px solid ${isWeak ? `${color}77` : `${color}33`}`,
            }}>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold" style={{ color }}>{ELEM_HANJA[el]}</span>
              <span className="text-[13px] font-bold" style={{ color }}>{el}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ backgroundColor: isWeak ? "#ef4444aa" : status === "강" ? `${color}55` : `${color}33`, color: "#fff" }}>
                {status}
              </span>
              <span className="text-[11px] ml-auto tabular-nums" style={{ color: TEXT_MUTED }}>{pct}%</span>
            </div>
            <div className="text-[12px] mt-1" style={{ color: TEXT_MAIN }}>
              {meta?.parts.join(" · ")}
            </div>
            {isWeak && (
              <div className="text-[11px] mt-1 italic" style={{ color: "#fca5a5" }}>※ {meta?.care}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─ 신살 경고·복록 카드 (hidden = 조심해야 할 반복 패턴) ─
const SINSAL_META: Record<string, { tone: "흉" | "길"; desc: string }> = {
  도화살: { tone: "흉", desc: "이성·인기·구설이 많은 결" },
  역마살: { tone: "흉", desc: "이동·변동·해외가 많은 결" },
  화개살: { tone: "길", desc: "예술·종교·고독 속 깊이의 결" },
  장성살: { tone: "길", desc: "권위·리더십이 자리잡는 결" },
  반안살: { tone: "길", desc: "안정·승진·자리가 보장되는 결" },
  양인살: { tone: "흉", desc: "강한 의지 + 충돌 위험 결" },
  괴강살: { tone: "흉", desc: "강한 카리스마 + 극단의 결" },
  현침살: { tone: "흉", desc: "예리함 + 다툼·사고 조심" },
  백호살: { tone: "흉", desc: "큰 변고·사건 조심" },
  공망: { tone: "흉", desc: "허무·결과 빠짐 조심" },
  천을귀인: { tone: "길", desc: "위기 때 도와주는 귀인 결" },
  천덕귀인: { tone: "길", desc: "하늘의 덕·보호 받는 결" },
  월덕귀인: { tone: "길", desc: "달의 덕·복록 받는 결" },
  태극귀인: { tone: "길", desc: "근본 운이 단단한 결" },
  문창귀인: { tone: "길", desc: "공부·문서·시험 운이 좋은 결" },
  학당귀인: { tone: "길", desc: "학문·지혜의 자리에 닿는 결" },
  복성귀인: { tone: "길", desc: "복록이 자연히 따라오는 결" },
  금여: { tone: "길", desc: "재물·결혼 운이 좋은 결" },
};
export function SajuSinsalCards({ sinsal }: { sinsal: string[] }) {
  if (!sinsal || sinsal.length === 0) {
    return (
      <div className="my-4 rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
        <div className="text-[13px] text-center" style={{ color: TEXT_MUTED }}>특별히 두드러진 신살은 보이지 않습니다.</div>
      </div>
    );
  }
  const hyung = sinsal.filter((s) => SINSAL_META[s]?.tone === "흉");
  const gil = sinsal.filter((s) => SINSAL_META[s]?.tone === "길");
  return (
    <div className="my-4 rounded-2xl p-3 space-y-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      {hyung.length > 0 && (
        <div>
          <div className="text-[11px] mb-2" style={{ color: "#fca5a5" }}>※ 조심해야 할 결</div>
          <div className="space-y-1.5">
            {hyung.map((s) => (
              <div key={s} className="rounded-lg p-2.5" style={{ backgroundColor: "#ef444418", border: "1px solid #ef444455" }}>
                <div className="text-[13px] font-bold" style={{ color: "#fca5a5" }}>{s}</div>
                <div className="text-[12px] mt-0.5" style={{ color: TEXT_MAIN }}>{SINSAL_META[s]?.desc ?? "결을 살펴보세요"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {gil.length > 0 && (
        <div>
          <div className="text-[11px] mb-2" style={{ color: ACCENT_BRIGHT }}>★ 복록·귀인 결</div>
          <div className="space-y-1.5">
            {gil.map((s) => (
              <div key={s} className="rounded-lg p-2.5" style={{ backgroundColor: `${ACCENT}1a`, border: `1px solid ${ACCENT}55` }}>
                <div className="text-[13px] font-bold" style={{ color: ACCENT_BRIGHT }}>{s}</div>
                <div className="text-[12px] mt-0.5" style={{ color: TEXT_MAIN }}>{SINSAL_META[s]?.desc ?? "결이 받쳐주고 있습니다"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─ 대운 타임라인 (timeline1 = 시기별 흐름) ─
const BRANCH_ELEM: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
const STEM_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
export function SajuDaeunTimeline({
  cycles,
  currentAge,
}: {
  cycles: { age: number; stem: string; branch: string; ganji: string }[];
  currentAge: number;
}) {
  return (
    <div className="my-4 rounded-2xl p-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[11px] text-center mb-3" style={{ color: TEXT_MUTED }}>대운 (10년 단위 흐름)</div>
      <div className="space-y-1.5">
        {cycles.slice(0, 8).map((c) => {
          const isCur = currentAge >= c.age && currentAge < c.age + 10;
          const stemEl = STEM_ELEM[c.stem];
          const branchEl = BRANCH_ELEM[c.branch];
          const stemColor = ELEM_COLORS[stemEl] ?? ACCENT;
          const branchColor = ELEM_COLORS[branchEl] ?? ACCENT;
          return (
            <div key={c.age} className="flex items-center gap-2 rounded-lg p-2"
              style={{
                backgroundColor: isCur ? `${ACCENT}22` : "rgba(255,255,255,0.04)",
                border: isCur ? `1.5px solid ${ACCENT}aa` : `1px solid rgba(255,255,255,0.10)`,
              }}>
              <div className="text-[12px] tabular-nums font-bold flex-shrink-0 w-14"
                style={{ color: isCur ? ACCENT_BRIGHT : TEXT_MUTED }}>{c.age}~{c.age + 9}</div>
              <span className="text-[18px] font-bold" style={{ color: stemColor }}>{c.stem}</span>
              <span className="text-[18px] font-bold" style={{ color: branchColor }}>{c.branch}</span>
              <span className="text-[11px] ml-auto" style={{ color: TEXT_MUTED }}>
                {stemEl}·{branchEl}
              </span>
              {isCur && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: ACCENT, color: "#0d1a0f" }}>현재</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ 5년 세운 그리드 (timeline2 = 앞으로 5년의 흐름) ─
const SEUN_5: { year: number; stem: string; branch: string }[] = [
  { year: 2026, stem: "병", branch: "오" },
  { year: 2027, stem: "정", branch: "미" },
  { year: 2028, stem: "무", branch: "신" },
  { year: 2029, stem: "기", branch: "유" },
  { year: 2030, stem: "경", branch: "술" },
];
export function SajuSeunGrid({ thisYear }: { thisYear: number }) {
  return (
    <div className="my-4 rounded-2xl p-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[11px] text-center mb-3" style={{ color: TEXT_MUTED }}>앞으로 5년의 세운 (年運)</div>
      <div className="grid grid-cols-5 gap-1.5">
        {SEUN_5.map((s) => {
          const stemEl = STEM_ELEM[s.stem];
          const branchEl = BRANCH_ELEM[s.branch];
          const stemColor = ELEM_COLORS[stemEl] ?? ACCENT;
          const branchColor = ELEM_COLORS[branchEl] ?? ACCENT;
          const isCur = s.year === thisYear;
          return (
            <div key={s.year} className="rounded-lg p-2 flex flex-col items-center gap-0.5"
              style={{
                backgroundColor: isCur ? `${ACCENT}22` : "rgba(255,255,255,0.05)",
                border: isCur ? `1.5px solid ${ACCENT}aa` : `1px solid rgba(255,255,255,0.10)`,
              }}>
              <div className="text-[11px] tabular-nums font-bold" style={{ color: isCur ? ACCENT_BRIGHT : TEXT_MUTED }}>{s.year}</div>
              <div className="text-[20px] font-bold leading-none" style={{ color: stemColor }}>{s.stem}</div>
              <div className="text-[20px] font-bold leading-none" style={{ color: branchColor }}>{s.branch}</div>
              <div className="text-[9px] mt-0.5" style={{ color: TEXT_MUTED }}>{stemEl}·{branchEl}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─ 시기별 재산 곡선 (money1 — 인생 4단계 돈 흐름) ─
// 사용자 999 요청: 초년기·청년기·중년기·말년기 4단계 누적 재산 곡선.
// 단정 액수 X — "재산 운 강도 점수 0~100" 곡선으로 표시.
// 산출: 원국 재성·식상 baseline + 각 단계 대운 2개 십성 가중 점수.
export function SajuLifeWealthCurve({ saju }: { saju: SajuAnalysis }) {
  const cycles = saju.daeun?.cycles ?? [];
  const baseSip = countSipseongFromSaju(saju);
  const baseline = (baseSip.재성 ?? 0) * 8 + (baseSip.식상 ?? 0) * 5 + 20;
  const stages = [
    { label: "초년기", ages: "10~20대", idx: [0, 1] },
    { label: "청년기", ages: "30~40대", idx: [2, 3] },
    { label: "중년기", ages: "50대", idx: [4, 5] },
    { label: "말년기", ages: "60대+", idx: [6, 7] },
  ];
  const calc = (idxList: number[]) => {
    let score = baseline;
    for (const i of idxList) {
      const c = cycles[i];
      if (!c) continue;
      const ssStem = getSipseong(saju.ilgan, c.stem, false);
      const ssBranch = getSipseong(saju.ilgan, c.branch, true);
      if (ssStem === "정재" || ssStem === "편재") score += 18;
      else if (ssBranch === "정재" || ssBranch === "편재") score += 15;
      if (ssStem === "식신" || ssStem === "상관") score += 8;
      else if (ssBranch === "식신" || ssBranch === "상관") score += 6;
      if (ssStem === "겁재") score -= 4;
      if (ssStem === "편관" || ssStem === "칠살") score -= 3;
    }
    return Math.max(10, Math.min(100, Math.round(score)));
  };
  const data = stages.map((s) => ({ ...s, score: calc(s.idx) }));
  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const W = 340, H = 220, padL = 40, padR = 30, padT = 30, padB = 40;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const xs = data.map((_, i) => padL + (i * plotW) / (data.length - 1));
  const ys = data.map((d) => padT + plotH - (d.score / 100) * plotH);
  const pathSegs = ys.map((y, i) => {
    if (i === 0) return `M ${xs[i]} ${y}`;
    const xPrev = xs[i - 1], yPrev = ys[i - 1];
    const cx1 = xPrev + (xs[i] - xPrev) * 0.4;
    const cx2 = xs[i] - (xs[i] - xPrev) * 0.4;
    return `C ${cx1} ${yPrev} ${cx2} ${y} ${xs[i]} ${y}`;
  });
  const linePath = pathSegs.join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${padT + plotH} L ${xs[0]} ${padT + plotH} Z`;
  const peakIdx = data.findIndex((d) => d.score === maxScore);
  return (
    <div className="my-4 rounded-2xl p-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div className="text-[12px] text-center mb-1" style={{ color: TEXT_MUTED }}>인생 4단계 재산 운 흐름</div>
      <div className="text-[10px] text-center mb-2" style={{ color: TEXT_SOFT }}>※ 액수가 아닌 재성·식상 가중 점수(0~100) — 단정 X, 흐름 강도</div>
      <div className="flex justify-center">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {[0, 25, 50, 75, 100].map((v) => {
            const y = padT + plotH - (v / 100) * plotH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke={`${ACCENT}22`} strokeWidth={1} />
                <text x={padL - 6} y={y + 3} fontSize={9} fill={TEXT_SOFT} textAnchor="end">{v}</text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_BRIGHT} stopOpacity="0.45" />
              <stop offset="100%" stopColor={ACCENT_BRIGHT} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#wealthGrad)" />
          <path d={linePath} fill="none" stroke={ACCENT_BRIGHT} strokeWidth={2.5} />
          {data.map((d, i) => {
            const isPeak = i === peakIdx;
            return (
              <g key={d.label}>
                <circle cx={xs[i]} cy={ys[i]} r={isPeak ? 6 : 4} fill={isPeak ? ACCENT_BRIGHT : ACCENT} stroke="rgba(255,255,255,0.55)" strokeWidth={isPeak ? 1.5 : 1} />
                <rect x={xs[i] - 16} y={ys[i] - 26} width={32} height={16} rx={4} fill="rgba(255,255,255,0.08)" stroke={`${ACCENT}66`} strokeWidth={0.5} />
                <text x={xs[i]} y={ys[i] - 14} fontSize={10} fontWeight={isPeak ? 700 : 500} fill={isPeak ? ACCENT_BRIGHT : "#fff"} textAnchor="middle">{d.score}</text>
                <text x={xs[i]} y={padT + plotH + 16} fontSize={11} fill={isPeak ? ACCENT_BRIGHT : TEXT_MUTED} textAnchor="middle" fontWeight={isPeak ? 700 : 500}>{d.label}</text>
                <text x={xs[i]} y={padT + plotH + 28} fontSize={9} fill={TEXT_SOFT} textAnchor="middle">{d.ages}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="rounded-xl p-3 mt-2 space-y-1" style={{ backgroundColor: `${ACCENT}11`, border: `1px solid ${ACCENT}30` }}>
        <div className="text-[11px]" style={{ color: TEXT_MUTED }}>가장 강한 시기</div>
        <div className="text-[14px] font-bold" style={{ color: ACCENT_BRIGHT }}>{data[peakIdx].label} ({data[peakIdx].ages})</div>
        <div className="text-[11px]" style={{ color: TEXT_MAIN }}>피크 점수 {maxScore} / 최저 {minScore} — 시기별 재산 운 격차 {maxScore - minScore}p</div>
      </div>
    </div>
  );
}
