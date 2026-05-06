"use client";
// 홍도인(紅道人) 궁합 슬라이드 결과 컴포넌트
// 평생사주 SajuSlideResult.tsx와 완전 분리됨. 평생사주 코드는 절대 건드리지 않음.

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { STEM_HANJA, BRANCH_HANJA, type SajuAnalysis, type CompatibilityResult } from "@/lib/saju-calculator";
import {
  MATCHING_IMG_BASE,
  pickCharacterImage,
  characterPairLabel,
  pickSajaSeongeo,
  pickBannerForSection,
  pickInyeonKkot,
  pickInyeonSeok,
  pickShareCardBg,
  pickKeywordImage,
  pickInyeonCard,
  splitIntoPages,
  type SajaSeongeoResult,
  type InyeonItem,
  type InyeonCardResult,
} from "@/lib/matching-images";
import { softenIlganRelation, softenIljiRelation, softenChungList } from "@/lib/wording";

const ACCENT = "#d4a8e8";
const ROUGE = "#c83a5e";
const GOLD = "#d4af37";
const BG = "#1a0f20";
const BRIGHT = "#f0c040";

const STEM_EL: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
const BRANCH_EL: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};
const ELEM_COLORS: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#94a3b8", 수: "#60a5fa",
};

// ── 슬라이드 구성 (21개) ──────────────────────
// 0: 커버
// 1: 사주팔자
// 2: 두 분의 자연
// 3: 선인의 첫마디 — AI #0
// 4: 한 줄 궁합 — AI #1
// 5: ⭐ 전생 인연 (도교·민간 명리) — AI #2
// 6: 두 사람의 본질 — AI #3
// 7: ⭐ 이 인연을 만난 이유 — AI #4
// 8: 우리 둘의 기운 (오행 차트) — AI #5
// 9: 관계의 언어 (십성 차트) — AI #6
// 10: 두 사람의 시선 — AI #7
// 11: 친밀의 결 — AI #8
// 12: ⭐ 누가 더 끌리는가 (끌림 차트) — AI #9
// 13: 인연이 흘러갈 결 — AI #10
// 14: 함께하는 시간 — AI #11
// 15: 다가오는 시기 — AI #12
// 16: 두 분의 길 (+ 음악 ###) — AI #13
// 17: 관계의 그림자와 빛 (+ 다시만남 ###) — AI #14
// 18: ⭐ 두 분만의 인연 카드 (정적)
// 19: 홍도인의 마지막 당부 — AI #15
// 20: 공유 카드 + CTA
const TOTAL_SLIDES = 21;

// AI 16섹션 헤더 — 프롬프트의 ## 대섹션 헤더와 일치
const SECTION_HEADER_ALTERNATIVES: string[][] = [
  ["선인의 첫마디"],
  ["한 줄 궁합"],
  ["전생 인연"],
  ["두 사람의 본질"],
  ["이 인연을 만난 이유"],
  ["우리 둘의 기운"],
  ["관계의 언어"],
  ["두 사람의 시선"],
  // 섹션 8 (관계 유형별 친밀의 결)
  ["둘만의 시간의 결", "침실의 기운", "함께 있을 때의 결", "함께 있는 자리의 결", "교감의 결"],
  ["누가 더 깊이 끌리고 있는가"],
  // 섹션 10 (관계 유형별 인연이 흘러갈 결)
  ["인연의 깊이", "이 인연이 흘러갈 결", "함께 갈 길의 결", "오래 갈 인연인지"],
  ["함께하는 시간"],
  ["다가오는 시기"],
  ["두 분의 길"],
  ["관계의 그림자와 빛"],
  ["홍도인의 마지막 당부"],
];

// 슬라이드 → AI 섹션 인덱스
const SLIDE_TO_AI_SECTION: Record<number, number> = {
  3: 0,   // 선인의 첫마디
  4: 1,   // 한 줄 궁합
  5: 2,   // 전생 인연
  6: 3,   // 두 사람의 본질
  7: 4,   // 이 인연을 만난 이유
  8: 5,   // 우리 둘의 기운 (+ 차트)
  9: 6,   // 관계의 언어 (+ 차트)
  10: 7,  // 두 사람의 시선
  11: 8,  // 친밀의 결
  12: 9,  // 누가 더 끌리는가 (+ 차트)
  13: 10, // 인연이 흘러갈 결
  14: 11, // 함께하는 시간
  15: 12, // 다가오는 시기
  16: 13, // 두 분의 길
  17: 14, // 관계의 그림자와 빛
  19: 15, // 홍도인의 마지막 당부
  // 18 인연 카드 / 20 공유 = 정적
};

// 슬라이드 → 배너 키 매핑
const SLIDE_TO_BANNER_KEY: Record<number, string> = {
  6: "essence",
  8: "ohaeng",
  9: "language",
  10: "language",
  11: "bedroom",
  13: "depth",
  14: "time",
  17: "shadow",
};

// 관계 유형 → 카테고리 분류 (펫은 정통 사주명리학 영역 밖이라 제외)
type RelCategory = "romantic" | "social" | "family" | "fan" | "custom";
function relCategoryOf(relType: string): RelCategory {
  if (["썸남썸녀", "연인", "배우자", "전연인", "전배우자"].includes(relType)) return "romantic";
  if (["친구", "직장동료", "사업파트너"].includes(relType)) return "social";
  if (["형제자매"].includes(relType)) return "family";
  if (["아이돌과팬", "아이돌과아이돌"].includes(relType)) return "fan";
  return "custom"; // 직접 입력 또는 미지정
}

// 슬라이드 제목 — 관계 유형별 동적 (슬라이드 7·8만 치환)
function getSlideTitles(relType: string): Record<number, string> {
  const cat = relCategoryOf(relType);
  const titles: Record<RelCategory, { s7: string; s8: string }> = {
    romantic: { s7: "둘만의 시간의 결",     s8: "인연의 깊이" },
    social:   { s7: "함께 있을 때의 결",    s8: "이 인연이 흘러갈 결" },
    family:   { s7: "함께 있는 자리의 결",  s8: "함께 갈 길의 결" },
    fan:      { s7: "교감의 결",            s8: "오래 갈 인연인지" },
    custom:   { s7: "함께 있을 때의 결",    s8: "이 인연이 흘러갈 결" },
  };
  return {
    0: "",
    1: "사주팔자",
    2: "두 분의 자연",
    3: "선인의 첫마디",
    4: "한 줄 궁합",
    5: "전생 인연",
    6: "두 사람의 본질",
    7: "이 인연을 만난 이유",
    8: "우리 둘의 기운",
    9: "관계의 언어",
    10: "두 사람의 시선",
    11: titles[cat].s7,
    12: "누가 더 끌리는가",
    13: titles[cat].s8,
    14: "함께하는 시간",
    15: "다가오는 시기",
    16: "두 분의 길",
    17: "관계의 그림자와 빛",
    18: "두 분만의 인연 카드",
    19: "홍도인의 마지막 당부",
    20: "공유하기",
  };
}

// AI 단일 응답을 10섹션으로 파싱 (관계 유형별 헤더 alternatives 지원)
function parseSections(text: string): Record<number, string> {
  const result: Record<number, string> = {};
  if (!text) return result;
  const lines = text.split("\n");
  let currentIdx = -1;
  let currentBuf: string[] = [];
  const flush = () => {
    if (currentIdx >= 0 && currentBuf.length) {
      result[currentIdx] = currentBuf.join("\n").trim();
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    let matched = -1;
    // 대섹션 헤더는 `## ` (정확히 2개) 또는 `### ` 둘 다 허용
    const isLevel2 = /^##\s/.test(trimmed) && !/^###\s/.test(trimmed);
    const isLevel3 = trimmed.startsWith("### ") || trimmed.startsWith("#### ");
    if (isLevel2 || isLevel3) {
      const header = trimmed.replace(/^#+\s*/, "");
      outer: for (let i = 0; i < SECTION_HEADER_ALTERNATIVES.length; i++) {
        for (const candidate of SECTION_HEADER_ALTERNATIVES[i]) {
          if (header === candidate || header.startsWith(candidate)) {
            matched = i;
            break outer;
          }
        }
      }
    }
    if (matched >= 0) {
      flush();
      currentIdx = matched;
      currentBuf = [];
    } else if (currentIdx >= 0) {
      currentBuf.push(line);
    }
  }
  flush();
  return result;
}

// 텍스트 포맷터
// 한자(한글) 자동 골드 강조
function highlightHanja(text: string, key = "h"): ReactNode[] {
  const re = /([一-鿿]+(?:\([가-힣]+\))?|[一-鿿]+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={`${key}-${idx++}`} style={{ color: GOLD, fontWeight: 600 }}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function formatText(text: string) {
  return text.split("\n").map((line, i) => {
    const l = line.trim();
    if (!l) return <div key={i} className="h-3" />;
    if (l.startsWith("### "))
      return (
        <h3 key={i} className="font-bold mt-5 mb-3 text-[18px] leading-snug" style={{ color: BRIGHT }}>
          {l.slice(4).replace(/\*\*/g, "")}
        </h3>
      );
    if (l.startsWith("**") && l.endsWith("**"))
      return (
        <p key={i} className="font-bold mt-3 mb-2 text-[16px]" style={{ color: BRIGHT }}>
          {l.slice(2, -2)}
        </p>
      );
    if (/\*\*[^*]+\*\*/.test(l))
      return (
        <p key={i} className="text-[15px] leading-[1.85] mb-3" style={{ color: "rgba(255,255,255,0.92)" }}>
          {l.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
            /^\*\*[^*]+\*\*$/.test(p) ? (
              <strong key={j} style={{ color: ACCENT }}>
                {highlightHanja(p.replace(/\*\*/g, ""), `b${i}-${j}`)}
              </strong>
            ) : (
              <span key={j}>{highlightHanja(p, `t${i}-${j}`)}</span>
            )
          )}
        </p>
      );
    if (l.startsWith("- ") || l.startsWith("• "))
      return (
        <li key={i} className="text-[15px] leading-[1.85] ml-5 mb-2 list-disc" style={{ color: "rgba(255,255,255,0.88)" }}>
          {highlightHanja(l.slice(2), `l${i}`)}
        </li>
      );
    return (
      <p key={i} className="text-[15px] leading-[1.85] mb-3" style={{ color: "rgba(255,255,255,0.90)" }}>
          {highlightHanja(l, `p${i}`)}
        </p>
    );
  });
}

// ── 비교 차트 컴포넌트 (두 사람 겹쳐서 표시) ──
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const COLOR_A = "#ff8fb3"; // myName — pink
const COLOR_B = "#7dd3c0"; // partnerName — teal

// 십성 5범주 카운트
type SipseongCount5 = { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number };
const SIPSEONG_DESC5: Record<keyof SipseongCount5, string> = {
  비겁: "자립·경쟁", 식상: "표현·창의", 재성: "현실·관리", 관성: "절제·규율", 인성: "학습·사색",
};
function getSipseongCounts(saju: SajuAnalysis): SipseongCount5 {
  const cat: SipseongCount5 = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const cl = (ss: string) => {
    if (["비견", "겁재"].includes(ss)) cat.비겁++;
    else if (["식신", "상관"].includes(ss)) cat.식상++;
    else if (["편재", "정재"].includes(ss)) cat.재성++;
    else if (["편관", "정관"].includes(ss)) cat.관성++;
    else if (["편인", "정인"].includes(ss)) cat.인성++;
  };
  const ss = saju.sipseong;
  cl(ss.year.stem); cl(ss.year.branch);
  cl(ss.month.stem); cl(ss.month.branch);
  cat.비겁++;
  cl(ss.day.branch);
  if (ss.hour) { cl(ss.hour.stem); cl(ss.hour.branch); }
  return cat;
}

// 5각형 비교 레이더 (두 사람 오행 또는 십성 겹쳐서)
function CompareRadar({
  labelsA, dataA, dataB, nameA, nameB, type,
}: {
  labelsA: string[];
  dataA: number[];
  dataB: number[];
  nameA: string;
  nameB: string;
  type: "ohaeng" | "sipseong";
}) {
  const N = labelsA.length;
  const cx = 170, cy = 175, R = 75;
  const MIN_SCALE = 0.05;
  const maxVal = Math.max(...dataA, ...dataB, 1);
  const angs = labelsA.map((_, i) => ((i * (360 / N) - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [
    cx + R * s * Math.cos(angs[i]),
    cy + R * s * Math.sin(angs[i]),
  ];
  const gridPts = (s: number) => labelsA.map((_, i) => pt(i, s).join(",")).join(" ");
  const ptsOf = (data: number[]) => data.map((v, i) => {
    const raw = v / maxVal;
    return pt(i, Math.max(MIN_SCALE, raw)).join(",");
  }).join(" ");
  const LO = 1.5;
  return (
    <div className="flex flex-col items-center">
      <svg width="340" height="320" viewBox="0 0 340 320">
        {[0.25, 0.5, 0.75, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {labelsA.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        {/* B 먼저 그리고 A를 위에 */}
        <polygon points={ptsOf(dataB)} fill={`${COLOR_B}26`} stroke={COLOR_B} strokeWidth="2" strokeLinejoin="round" />
        <polygon points={ptsOf(dataA)} fill={`${COLOR_A}33`} stroke={COLOR_A} strokeWidth="2.5" strokeLinejoin="round" />
        {labelsA.map((label, i) => {
          const [lx, ly] = pt(i, LO);
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          if (type === "ohaeng") {
            return (
              <g key={i}>
                <text x={lx + dx} y={ly - 4} textAnchor={anchor} fontSize="22" fontWeight="bold"
                  fill={ELEM_COLORS[label] ?? "white"}>
                  {ELEM_HANJA[label] ?? label}
                </text>
                <text x={lx + dx} y={ly + 14} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.55)">
                  {label}
                </text>
              </g>
            );
          }
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 4} textAnchor={anchor} fontSize="13" fontWeight="bold" fill={BRIGHT}>
                {label}
              </text>
              <text x={lx + dx} y={ly + 12} textAnchor={anchor} fontSize="9" fill="rgba(255,255,255,0.55)">
                {SIPSEONG_DESC5[label as keyof SipseongCount5] ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_A }} />
          <span className="text-[12px] text-white">{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_B }} />
          <span className="text-[12px] text-white">{nameB}</span>
        </div>
      </div>
    </div>
  );
}

// ── 작은 컴포넌트들 ──────────────────────
function PillarCard({ name, saju }: { name: string; saju: SajuAnalysis }) {
  const cols = [
    { label: "연주", p: saju.pillars.year },
    { label: "월주", p: saju.pillars.month },
    { label: "일주", p: saju.pillars.day, isDay: true },
    { label: "시주", p: saju.pillars.hour, isDay: false },
  ];
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <p className="text-xs font-bold mb-2 text-center" style={{ color: ACCENT }}>
        {name}
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {cols.map((c) => (
          <div
            key={c.label}
            className="text-center py-2 rounded-lg"
            style={{
              backgroundColor: c.isDay ? `${ACCENT}1a` : "transparent",
              border: c.isDay ? `1px solid ${ACCENT}66` : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              {c.label}
            </div>
            {c.p ? (
              <>
                <div
                  className="text-base font-bold leading-tight mt-1"
                  style={{ color: ELEM_COLORS[STEM_EL[c.p.stem] ?? ""] ?? BRIGHT }}
                >
                  {STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA] ?? c.p.stem}
                </div>
                <div
                  className="text-base font-bold leading-tight"
                  style={{ color: ELEM_COLORS[BRANCH_EL[c.p.branch] ?? ""] ?? "white" }}
                >
                  {BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA] ?? c.p.branch}
                </div>
              </>
            ) : (
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>
                ─
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? "#ff6b9d" : score >= 70 ? ACCENT : score >= 55 ? BRIGHT : "#94a3b8";
  return (
    <div className="text-center">
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 326.7} 326.7`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color }}>
            {score}
          </div>
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            / 100
          </div>
        </div>
      </div>
      <p className="text-lg font-bold mt-3" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function BannerImage({ name }: { name: string }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden flex-shrink-0 mb-3 aspect-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${MATCHING_IMG_BASE}/${encodeURIComponent(name)}`}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: "center" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, transparent 30%, ${BG} 100%)` }}
      />
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────
export default function MatchingSlideResult() {
  const params = useSearchParams();
  const [slide, setSlide] = useState(0);
  const [aiPage, setAiPage] = useState(0);
  const [content, setContent] = useState("");
  const [sajuA, setSajuA] = useState<SajuAnalysis | null>(null);
  const [sajuB, setSajuB] = useState<SajuAnalysis | null>(null);
  const [compat, setCompat] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);

  const myName = params.get("myName") || "당신";
  const partnerName = params.get("partnerName") || "상대";
  const relationshipType = params.get("relationshipType") || "";
  const relationshipLabel = params.get("relationshipLabel") || "";
  const SLIDE_TITLES = getSlideTitles(relationshipType);

  // ── AI 풀이 로드 ──
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: "matching",
      section: "matching",
      relationshipType,
      relationshipLabel,
      myName,
      myGender: params.get("myGender") || "",
      myYear: params.get("myYear") || "",
      myMonth: params.get("myMonth") || "",
      myDay: params.get("myDay") || "",
      myHour: params.get("myHour") || "시간 모름",
      myCalendar: params.get("myCalendar") || "양력",
      partnerName,
      partnerGender: params.get("partnerGender") || "",
      partnerYear: params.get("partnerYear") || "",
      partnerMonth: params.get("partnerMonth") || "",
      partnerDay: params.get("partnerDay") || "",
      partnerHour: params.get("partnerHour") || "시간 모름",
      partnerCalendar: params.get("partnerCalendar") || "양력",
      meetCount: params.get("meetCount") || "",
      soloReason: params.get("soloReason") || "",
    };

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          setError(true);
          setLoading(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            if (raw === "[DONE]") break outer;
            try {
              const msg = JSON.parse(raw);
              if (msg.t === "m" && msg.d) {
                setSajuA(msg.d.sajuA);
                setSajuB(msg.d.sajuB);
                setCompat(msg.d.compat);
                setLoading(false);
              } else if (msg.t === "x" && msg.v) {
                full += msg.v;
                setContent(full);
              }
            } catch {}
          }
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [params, myName, partnerName, relationshipType, relationshipLabel]);

  // ── 파생값 ──
  const sections = parseSections(content);
  const curAiSectionIdx = SLIDE_TO_AI_SECTION[slide];
  const curAiText = curAiSectionIdx !== undefined ? sections[curAiSectionIdx] || "" : "";
  const curPages = curAiText ? splitIntoPages(curAiText) : [];
  // 차트 페이지 수: 슬라이드 8 (오행) / 9 (십성) / 12 (끌림) — 각 1장
  const chartPagesOf = (s: number): number => (s === 8 || s === 9 || s === 12 ? 1 : 0);
  const totalPagesForSlide = chartPagesOf(slide) + Math.max(curPages.length, 1);
  const hasMorePages = totalPagesForSlide > 1 && aiPage < totalPagesForSlide - 1;

  // ── 전체 페이지 카운트 (모든 슬라이드 합산) ──
  function pagesOfSlide(s: number): number {
    const sIdx = SLIDE_TO_AI_SECTION[s];
    if (sIdx === undefined) return 1;
    const text = sections[sIdx] ?? "";
    const aiPgs = text ? splitIntoPages(text).length : 1;
    return chartPagesOf(s) + Math.max(aiPgs, 1);
  }
  let cumPagesBefore = 0;
  for (let s = 0; s < slide; s++) cumPagesBefore += pagesOfSlide(s);
  const currentGlobalPage = cumPagesBefore + aiPage + 1;
  let totalGlobalPages = 0;
  for (let s = 0; s < TOTAL_SLIDES; s++) totalGlobalPages += pagesOfSlide(s);

  // ── 네비게이션 ──
  function goNext() {
    if (hasMorePages) {
      setAiPage((p) => p + 1);
      return;
    }
    if (slide < TOTAL_SLIDES - 1) {
      setSlide(slide + 1);
      setAiPage(0);
    }
  }
  function goPrev() {
    if (curAiSectionIdx !== undefined && aiPage > 0) {
      setAiPage((p) => p - 1);
      return;
    }
    if (slide > 0) {
      setSlide(slide - 1);
      setAiPage(0);
    }
  }

  // 좌우 탭 / 스와이프 (평생사주 동일 패턴)
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    tapStartRef.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!tapStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tapStartRef.current.x;
    const dy = t.clientY - tapStartRef.current.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    // 1) 탭(거의 안 움직임) — X좌표로 좌/우 결정
    if (adx < 12 && ady < 12) {
      const target = e.target as HTMLElement;
      if (target.closest('button,a,input,textarea,select,[role="button"]')) {
        tapStartRef.current = null;
        return;
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = t.clientX - rect.left;
      if (x > rect.width / 2) goNext();
      else goPrev();
    }
    // 2) 스와이프 (가로 우세)
    else if (adx > 50 && adx > ady * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
    tapStartRef.current = null;
  }
  // 데스크탑 마우스 클릭 (터치 기기는 onTouchEnd 처리)
  function onClickArea(e: React.MouseEvent) {
    if (typeof window !== "undefined" && "ontouchstart" in window) return;
    const target = e.target as HTMLElement;
    if (target.closest('button,a,input,textarea,select,[role="button"]')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) goNext();
    else goPrev();
  }

  // ── 사자성어/캐릭터 등 미리 계산 ──
  const sajaResult: SajaSeongeoResult | null = compat ? pickSajaSeongeo(compat) : null;
  const characterImg = sajuA && sajuB ? pickCharacterImage(sajuA.ilgan, sajuB.ilgan) : null;
  const characterLabel = sajuA && sajuB ? characterPairLabel(sajuA.ilgan, sajuB.ilgan) : null;
  const inyeonKkot: InyeonItem | null = compat
    ? pickInyeonKkot(compat, sajuA?.pillars.month.branch)
    : null;
  const inyeonSeok: InyeonItem | null = compat ? pickInyeonSeok(compat) : null;
  const shareCardBg = compat ? pickShareCardBg(compat.score) : null;

  // ── 본문 렌더 ──
  function renderSlide() {
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <p className="text-white/70">풀이 생성에 실패했습니다.</p>
          <Link
            href="/matching"
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
          >
            ← 돌아가기
          </Link>
        </div>
      );
    }

    if (loading || !compat || !sajuA || !sajuB) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
          />
          <p className="text-sm" style={{ color: `${ACCENT}aa` }}>
            두 분의 인연을 풀이하는 중입니다
          </p>
        </div>
      );
    }

    // ── Slide 0: 커버 ──
    if (slide === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-6">
          <div
            className="text-4xl tracking-widest"
            style={{ color: GOLD, filter: `drop-shadow(0 0 12px ${ACCENT}cc)`, fontFamily: "'Ma Shan Zheng', serif" }}
          >
            紅
          </div>
          <h1 className="text-2xl font-bold text-white">
            {myName} <span style={{ color: ACCENT }}>·</span> {partnerName}
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            홍도인(紅道人) 궁합 풀이
          </p>
          {/* 사자성어 메인 카드 — 점수 게이지 자리에 */}
          {sajaResult && (
            <div
              className="rounded-3xl px-8 py-7 max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}28, ${ROUGE}28)`,
                border: `1.5px solid ${ACCENT}99`,
                boxShadow: `0 0 32px ${ACCENT}33`,
              }}
            >
              <p className="text-[10px] tracking-[0.3em] mb-2" style={{ color: `${ACCENT}aa` }}>
                ─ 인연의 결 ─
              </p>
              <p className="text-5xl font-bold tracking-wider mb-3" style={{ color: GOLD }}>
                {sajaResult.hanja}
              </p>
              <p className="text-lg font-bold" style={{ color: ACCENT }}>
                {sajaResult.hangul}
              </p>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                {sajaResult.meaning}
              </p>
            </div>
          )}
          {/* 인트로 텍스트 (선인의 첫마디 + 한 줄 궁합) */}
          {(sections[0] || sections[1]) && (
            <div className="mt-2 space-y-2 text-center max-w-sm px-3">
              {sections[0] && (
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {sections[0].split("\n").join(" ")}
                </p>
              )}
              {sections[1] && (
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {sections[1].split("\n").join(" ")}
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    // ── Slide 1: 사주팔자 ──
    if (slide === 1) {
      return (
        <div className="flex-1 flex flex-col gap-4 py-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">두 사람의 사주팔자</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
              태어난 연·월·일·시
            </p>
          </div>
          <PillarCard name={myName} saju={sajuA} />
          <PillarCard name={partnerName} saju={sajuB} />
          {/* 자동 지표 요약 */}
          <div
            className="rounded-xl p-4 space-y-2 mt-2"
            style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}33` }}
          >
            <p className="text-xs font-bold" style={{ color: ACCENT }}>
              인연의 결
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
              • 일간(日干)의 결: {softenIlganRelation(compat.ilganRelation, myName, partnerName)}
            </p>
            {compat.branchRelations.ilji !== "특별한 관계 없음" && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • 일지(日支)의 결: {softenIljiRelation(compat.branchRelations.ilji)}
              </p>
            )}
            {compat.elementBalance.aHelpsB.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • {myName}님이 채워주는 기운: {compat.elementBalance.aHelpsB.join("·")}
              </p>
            )}
            {compat.elementBalance.bHelpsA.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • {partnerName}님이 채워주는 기운: {compat.elementBalance.bHelpsA.join("·")}
              </p>
            )}
            {compat.branchRelations.chung.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • 자극의 결: {softenChungList(compat.branchRelations.chung)}
              </p>
            )}
          </div>
        </div>
      );
    }

    // ── Slide 2: 캐릭터 페어 ──
    if (slide === 2) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-4">
          <p className="text-xs font-semibold" style={{ color: ACCENT }}>
            두 분의 자연
          </p>
          {characterImg && (
            <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${MATCHING_IMG_BASE}/${encodeURIComponent(characterImg)}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {characterLabel && (
            <div className="space-y-2 max-w-xs px-2">
              <h3 className="text-lg font-bold" style={{ color: BRIGHT }}>
                {characterLabel.theme}
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                <span style={{ color: ACCENT }}>{myName}</span>님은 {characterLabel.a},{" "}
                <span style={{ color: ACCENT }}>{partnerName}</span>님은 {characterLabel.b}
              </p>
            </div>
          )}
        </div>
      );
    }

    // ── Slide 18: 두 분만의 인연 카드 (정적, AI 매핑 X) ──
    if (slide === 18 && sajuA && sajuB && compat) {
      const card = pickInyeonCard(sajuA.ilgan, sajuB.ilgan, compat, compat.sharedSinsal?.length ?? 0);
      return (
        <div className="flex-1 flex flex-col py-3 gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: ACCENT }}>
              두 분만의 인연 카드
            </p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              홍도인이 두 분의 사주에서 뽑아드린 한 장
            </p>
          </div>
          <div
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-6"
            style={{
              background: `linear-gradient(135deg, ${card.hueA}55 0%, ${card.hueB}55 100%), radial-gradient(circle at 30% 20%, rgba(255,215,0,0.15), transparent 60%)`,
              border: `1px solid ${card.hueA}66`,
              boxShadow: `0 8px 40px ${card.hueA}33`,
            }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />
            <div className="relative z-10 space-y-5">
              <p className="text-[10px] tracking-[0.4em]" style={{ color: GOLD }}>
                紅 道 人
              </p>
              <p className="text-5xl font-bold tracking-wider leading-tight" style={{ color: GOLD }}>
                {card.hanja}
              </p>
              <p className="text-base font-bold" style={{ color: BRIGHT }}>
                {card.hangul}
              </p>
              <p className="text-[13px] px-4" style={{ color: "rgba(255,255,255,0.92)" }}>
                {card.short}
              </p>
              <div className="h-px w-12 mx-auto" style={{ backgroundColor: `${GOLD}66` }} />
              <p className="text-[12px] leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                {card.meaning}
              </p>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: `${ACCENT}aa` }}>
            스크린샷으로 간직하실 수 있습니다.
          </p>
        </div>
      );
    }

    // ── Slide 3-17, 19: AI 본문 (배너 + 차트 페이지 + ### 분할 텍스트) ──
    if ((slide >= 3 && slide <= 17) || slide === 19) {
      const bannerKey = SLIDE_TO_BANNER_KEY[slide];
      const bannerImg = bannerKey ? pickBannerForSection(bannerKey, compat) : null;
      const title = SLIDE_TITLES[slide];
      const chartCount = chartPagesOf(slide);
      const isChartPage = chartCount > 0 && aiPage < chartCount;
      const aiTextIdx = aiPage - chartCount;
      const aiText = curPages[aiTextIdx] || "";
      const totalPages = chartCount + Math.max(curPages.length, 1);
      const keywordImg = !isChartPage && aiTextIdx > 0 && aiText ? pickKeywordImage(aiText) : null;

      return (
        <div className="flex-1 flex flex-col py-2">
          <div className="text-center mb-3">
            <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: ACCENT }}>
              {title}
            </p>
            {totalPages > 1 && (
              <p className="text-[10px] mt-1" style={{ color: `${ACCENT}77` }}>
                {aiPage + 1} / {totalPages}
              </p>
            )}
          </div>

          {/* Slide 8 차트 페이지: 두 사람 오행 비교 */}
          {isChartPage && slide === 8 && sajuA && sajuB && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                두 분의 오행(五行) 비교
              </h4>
              <p className="text-[11px] text-center mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                木·火·土·金·水 — 어디가 닿고 어디가 비어 있는지
              </p>
              <CompareRadar
                labelsA={["목", "화", "토", "금", "수"]}
                dataA={["목", "화", "토", "금", "수"].map((el) => (sajuA.elements as Record<string, number>)[el] || 0)}
                dataB={["목", "화", "토", "금", "수"].map((el) => (sajuB.elements as Record<string, number>)[el] || 0)}
                nameA={myName}
                nameB={partnerName}
                type="ohaeng"
              />
              <p className="text-[11px] text-center mt-3 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                꼭짓점이 바깥일수록 그 기운이 강합니다. 한쪽이 비어있을 때 다른 쪽이 채워주는 결을 봅니다.
              </p>
              <p className="text-xs text-center mt-2" style={{ color: `${ACCENT}aa` }}>→ 우측 탭하여 풀이 보기</p>
            </div>
          )}

          {/* Slide 9 차트 페이지: 두 사람 십성 비교 */}
          {isChartPage && slide === 9 && sajuA && sajuB && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                두 분의 십성(十星) 비교
              </h4>
              <p className="text-[11px] text-center mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                比劫·食傷·財星·官星·印星 — 두 분이 자주 끄집어 쓰는 결
              </p>
              {(() => {
                const cA = getSipseongCounts(sajuA);
                const cB = getSipseongCounts(sajuB);
                const ORDER: (keyof SipseongCount5)[] = ["비겁", "식상", "재성", "관성", "인성"];
                return (
                  <CompareRadar
                    labelsA={ORDER}
                    dataA={ORDER.map((k) => cA[k])}
                    dataB={ORDER.map((k) => cB[k])}
                    nameA={myName}
                    nameB={partnerName}
                    type="sipseong"
                  />
                );
              })()}
              <p className="text-[11px] text-center mt-3 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                두 분 모양이 닮은 곳은 같은 결, 다른 곳은 서로 채워주는 결입니다.
              </p>
              <p className="text-xs text-center mt-2" style={{ color: `${ACCENT}aa` }}>→ 우측 탭하여 풀이 보기</p>
            </div>
          )}

          {/* Slide 12 차트 페이지: 끌림 5축 비교 (십성 5범주를 끌림 컨텍스트로 라벨링) */}
          {isChartPage && slide === 12 && sajuA && sajuB && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                두 분의 끌림 비교
              </h4>
              <p className="text-[11px] text-center mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                자존·표현·끌림·헌신·사색 — 마음을 흐르는 다섯 결
              </p>
              {(() => {
                const cA = getSipseongCounts(sajuA);
                const cB = getSipseongCounts(sajuB);
                // 십성 5범주 그대로 — 라벨만 끌림 컨텍스트로 재해석
                // 자존(비겁) / 표현(식상) / 끌림(재성) / 헌신(관성) / 사색(인성)
                const fiveOf = (c: SipseongCount5) => [c.비겁, c.식상, c.재성, c.관성, c.인성];
                const LABELS = ["자존", "표현", "끌림", "헌신", "사색"];
                return (
                  <CompareRadar
                    labelsA={LABELS}
                    dataA={fiveOf(cA)}
                    dataB={fiveOf(cB)}
                    nameA={myName}
                    nameB={partnerName}
                    type="sipseong"
                  />
                );
              })()}
              <p className="text-[11px] text-center mt-3 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                자존(自尊)·표현(食傷)·끌림(財星)·헌신(官星)·사색(印星) — 십성에서 도출한 다섯 결입니다. 어느 결이 더 강한지로 끌림의 패턴을 봅니다.
              </p>
              <p className="text-xs text-center mt-2" style={{ color: `${ACCENT}aa` }}>→ 우측 탭하여 풀이 보기</p>
            </div>
          )}

          {/* AI 본문 텍스트 */}
          {!isChartPage && (
            <>
              {aiTextIdx === 0 && bannerImg && <BannerImage name={bannerImg} />}
              {aiTextIdx > 0 && keywordImg && <BannerImage name={keywordImg} />}
              <div className="flex-1 px-1">
                {aiText ? (
                  formatText(aiText)
                ) : (
                  <div className="flex gap-1.5 justify-center items-center py-8">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Slide 20: 공유 + CTA (마지막) ──
    if (slide === 20) {
      return (
        <div className="flex-1 flex flex-col py-4 gap-5">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest" style={{ color: ACCENT }}>
              마무리
            </p>
          </div>
          {/* 공유 카드 미리보기 */}
          {shareCardBg && (
            <div
              className="relative w-full aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-6"
              style={{
                backgroundImage: `url(${MATCHING_IMG_BASE}/${encodeURIComponent(shareCardBg)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
              <div className="relative z-10 space-y-4">
                <p className="text-xs tracking-widest" style={{ color: GOLD }}>
                  紅道人
                </p>
                <h2 className="text-xl font-bold text-white">
                  {myName} · {partnerName}
                </h2>
                {sajaResult && (
                  <>
                    <p className="text-6xl font-bold tracking-wider" style={{ color: GOLD }}>
                      {sajaResult.hanja}
                    </p>
                    <p className="text-base font-bold" style={{ color: BRIGHT }}>
                      {sajaResult.hangul}
                    </p>
                    <p className="text-xs px-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {sajaResult.meaning}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
            스크린샷으로 친구에게 공유해보세요
          </p>
          <Link
            href="/matching"
            className="block text-center py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: ACCENT, color: BG }}
          >
            또 다른 인연도 보러 가기
          </Link>
          <Link
            href="/"
            className="block text-center py-3 rounded-xl text-sm"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}44` }}
          >
            처음으로
          </Link>
        </div>
      );
    }

    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)` }}
    >
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${ACCENT}18` }}
        >
          <Link href="/matching" className="text-sm" style={{ color: `${ACCENT}88` }}>
            ←
          </Link>
          <div className="flex-1 text-sm font-bold text-white">홍도인의 인연 풀이</div>
          <div className="text-[11px]" style={{ color: `${ACCENT}88` }}>
            {currentGlobalPage} / {totalGlobalPages}
          </div>
        </div>

        {/* 본문 — 좌우 탭 영역 */}
        <div
          className="flex-1 px-4 flex flex-col relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={onClickArea}
        >
          {renderSlide()}

          {/* 좌우 탭존 화살표 — 시각 안내만 (포인터 이벤트 없음) */}
          {(slide > 0 || aiPage > 0) && (
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
              style={{ backgroundColor: `${ACCENT}12` }}
            >
              <span className="text-xl font-light select-none" style={{ color: `${ACCENT}66` }}>
                ‹
              </span>
            </div>
          )}
          {(slide < TOTAL_SLIDES - 1 || hasMorePages) && (
            <div
              className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
              style={{ backgroundColor: `${ACCENT}12` }}
            >
              <span className="text-xl font-light select-none" style={{ color: `${ACCENT}66` }}>
                ›
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
