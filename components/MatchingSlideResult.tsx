"use client";
// 홍도인(紅道人) 궁합 슬라이드 결과 컴포넌트
// 평생사주 SajuSlideResult.tsx와 완전 분리됨. 평생사주 코드는 절대 건드리지 않음.

import { useState, useEffect, useRef } from "react";
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
  splitIntoPages,
  type SajaSeongeoResult,
  type InyeonItem,
} from "@/lib/matching-images";

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

// ── 슬라이드 구성 (12개) ──────────────────────
// 0: 커버 (이름·점수·사자성어)
// 1: 사주팔자 (두 사람 PillarCard)
// 2: 캐릭터 페어
// 3: 두 사람의 본질 (essence) — AI section 0,2
// 4: 우리 둘의 기운 (ohaeng) — AI section 3
// 5: 관계의 언어 (language) — AI section 4
// 6: 침실의 기운 (bedroom) — AI section 5
// 7: 인연의 깊이 (depth) — AI section 6
// 8: 함께하는 시간 (time) — AI section 7
// 9: 관계의 그림자와 빛 (shadow) — AI section 8
// 10: 인연 아이템 (꽃·돌·해시태그)
// 11: 공유 카드 + CTA
const TOTAL_SLIDES = 12;

// AI 섹션 헤더 → slide 그룹 매핑
// AI는 9섹션을 단일 텍스트로 출력 ("### 선인의 첫마디", "### 한 줄 궁합", "### 두 사람의 본질" ...)
const SECTION_HEADERS = [
  "선인의 첫마디",
  "한 줄 궁합",
  "두 사람의 본질",
  "우리 둘의 기운",
  "관계의 언어",
  "침실의 기운",
  "인연의 깊이",
  "함께하는 시간",
  "관계의 그림자와 빛",
];

// 슬라이드 → AI 섹션 인덱스 (3~9 슬라이드가 본문)
const SLIDE_TO_AI_SECTION: Record<number, number> = {
  3: 2, // 두 사람의 본질
  4: 3, // 우리 둘의 기운
  5: 4, // 관계의 언어
  6: 5, // 침실의 기운
  7: 6, // 인연의 깊이
  8: 7, // 함께하는 시간
  9: 8, // 관계의 그림자와 빛
};

// 슬라이드 → 배너 키 매핑
const SLIDE_TO_BANNER_KEY: Record<number, string> = {
  3: "essence",
  4: "ohaeng",
  5: "language",
  6: "bedroom",
  7: "depth",
  8: "time",
  9: "shadow",
};

// 슬라이드 제목
const SLIDE_TITLES: Record<number, string> = {
  0: "",
  1: "사주팔자",
  2: "두 분의 자연",
  3: "두 사람의 본질",
  4: "우리 둘의 기운",
  5: "관계의 언어",
  6: "침실의 기운",
  7: "인연의 깊이",
  8: "함께하는 시간",
  9: "관계의 그림자와 빛",
  10: "인연 아이템",
  11: "공유하기",
};

// AI 단일 응답을 9섹션으로 파싱
function parseSections(text: string): Record<number, string> {
  const result: Record<number, string> = {};
  if (!text) return result;
  // "### 선인의 첫마디", "### 한 줄 궁합" 등으로 분리
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
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      const header = trimmed.replace(/^#+\s*/, "");
      for (let i = 0; i < SECTION_HEADERS.length; i++) {
        if (header === SECTION_HEADERS[i] || header.startsWith(SECTION_HEADERS[i])) {
          matched = i;
          break;
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
                {p.replace(/\*\*/g, "")}
              </strong>
            ) : (
              p
            )
          )}
        </p>
      );
    if (l.startsWith("- ") || l.startsWith("• "))
      return (
        <li key={i} className="text-[15px] leading-[1.85] ml-5 mb-2 list-disc" style={{ color: "rgba(255,255,255,0.88)" }}>
          {l.slice(2)}
        </li>
      );
    return (
      <p key={i} className="text-[15px] leading-[1.85] mb-3" style={{ color: "rgba(255,255,255,0.90)" }}>
          {l}
        </p>
    );
  });
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

  // ── AI 풀이 로드 ──
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: "matching",
      section: "matching",
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
  }, [params, myName, partnerName]);

  // ── 파생값 ──
  const sections = parseSections(content);
  const curAiSectionIdx = SLIDE_TO_AI_SECTION[slide];
  const curAiText = curAiSectionIdx !== undefined ? sections[curAiSectionIdx] || "" : "";
  const curPages = curAiText ? splitIntoPages(curAiText) : [];
  const curPage = curPages[aiPage] || "";
  const hasMorePages = curPages.length > 1 && aiPage < curPages.length - 1;

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
            className="text-4xl"
            style={{ color: ACCENT, filter: `drop-shadow(0 0 12px ${ACCENT}cc)` }}
          >
            🌹
          </div>
          <h1 className="text-2xl font-bold text-white">
            {myName} <span style={{ color: ACCENT }}>·</span> {partnerName}
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            홍도인(紅道人) 궁합 풀이
          </p>
          <ScoreGauge score={compat.score} label={compat.scoreLabel} />
          {sajaResult && (
            <div
              className="mt-4 rounded-2xl px-6 py-4 max-w-xs"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}22, ${ROUGE}22)`,
                border: `1px solid ${ACCENT}55`,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: GOLD }}>
                {sajaResult.hanja}
              </p>
              <p className="text-sm mt-1" style={{ color: ACCENT }}>
                {sajaResult.hangul}
              </p>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.78)" }}>
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
              궁합 지표
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
              • 일간 관계: {compat.ilganRelation}
            </p>
            {compat.branchRelations.ilji !== "특별한 관계 없음" && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • 일지 관계: {compat.branchRelations.ilji}
              </p>
            )}
            {compat.elementBalance.aHelpsB.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • {myName}님이 보충하는 기운: {compat.elementBalance.aHelpsB.join("·")}
              </p>
            )}
            {compat.elementBalance.bHelpsA.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • {partnerName}님이 보충하는 기운: {compat.elementBalance.bHelpsA.join("·")}
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

    // ── Slide 3-9: AI 본문 (배너 + 페이지 분할 텍스트) ──
    if (slide >= 3 && slide <= 9) {
      const bannerKey = SLIDE_TO_BANNER_KEY[slide];
      const bannerImg = bannerKey ? pickBannerForSection(bannerKey, compat) : null;
      const title = SLIDE_TITLES[slide];

      // 페이지 본문 키워드 매칭 → 추가 이미지
      const keywordImg = aiPage > 0 && curPage ? pickKeywordImage(curPage) : null;

      return (
        <div className="flex-1 flex flex-col py-2">
          <div className="text-center mb-3">
            <p className="text-xs font-semibold tracking-widest" style={{ color: ACCENT }}>
              ✦ {title}
            </p>
            {curPages.length > 1 && (
              <p className="text-[10px] mt-1" style={{ color: `${ACCENT}77` }}>
                {aiPage + 1} / {curPages.length}
              </p>
            )}
          </div>
          {/* 첫 페이지면 배너, 이후 페이지면 키워드 이미지 (있을 때만) */}
          {aiPage === 0 && bannerImg && <BannerImage name={bannerImg} />}
          {aiPage > 0 && keywordImg && <BannerImage name={keywordImg} />}
          <div className="flex-1 px-1">
            {curPage ? (
              formatText(curPage)
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
        </div>
      );
    }

    // ── Slide 10: 인연 아이템 ──
    if (slide === 10) {
      const tags = [
        characterLabel?.theme && `#${characterLabel.theme.replace(/\s/g, "")}`,
        sajaResult?.hangul && `#${sajaResult.hangul}`,
        inyeonKkot?.name && `#인연꽃_${inyeonKkot.name}`,
        inyeonSeok?.name && `#인연석_${inyeonSeok.name}`,
      ].filter(Boolean) as string[];

      return (
        <div className="flex-1 flex flex-col py-4 gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest" style={{ color: ACCENT }}>
              ✦ 두 분의 인연 아이템
            </p>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
              홍도인이 두 분께 드리는 상징
            </p>
          </div>
          {/* 인연꽃 */}
          {inyeonKkot && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="relative w-full aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${MATCHING_IMG_BASE}/${encodeURIComponent(inyeonKkot.image)}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-xs" style={{ color: ACCENT }}>
                  🌸 인연꽃
                </p>
                <p className="text-base font-bold mt-1" style={{ color: BRIGHT }}>
                  {inyeonKkot.name}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }}>
                  {inyeonKkot.meaning}
                </p>
              </div>
            </div>
          )}
          {/* 인연석 */}
          {inyeonSeok && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="relative w-full aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${MATCHING_IMG_BASE}/${encodeURIComponent(inyeonSeok.image)}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-xs" style={{ color: ACCENT }}>
                  💎 인연석
                </p>
                <p className="text-base font-bold mt-1" style={{ color: BRIGHT }}>
                  {inyeonSeok.name}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }}>
                  {inyeonSeok.meaning}
                </p>
              </div>
            </div>
          )}
          {/* 해시태그 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${ACCENT}25`, color: ACCENT }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── Slide 11: 공유 + CTA ──
    if (slide === 11) {
      return (
        <div className="flex-1 flex flex-col py-4 gap-5">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest" style={{ color: ACCENT }}>
              ✦ 마무리
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
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} />
              <div className="relative z-10 space-y-3">
                <p className="text-xs tracking-widest" style={{ color: GOLD }}>
                  紅道人
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {myName} · {partnerName}
                </h2>
                <p className="text-5xl font-bold" style={{ color: BRIGHT }}>
                  {compat.score}
                </p>
                {sajaResult && (
                  <>
                    <p className="text-3xl font-bold" style={{ color: GOLD }}>
                      {sajaResult.hanja}
                    </p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {sajaResult.hangul}
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
            친구의 궁합도 보러 가기
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
          <div className="flex-1 text-sm font-bold text-white">홍도인의 궁합 풀이</div>
          <div className="text-[11px]" style={{ color: `${ACCENT}88` }}>
            {slide + 1} / {TOTAL_SLIDES}
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
