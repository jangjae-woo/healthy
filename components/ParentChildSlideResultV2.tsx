"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { getSipseongCounts, SIPSEONG_DESC, inferDangerCards, type SipseongCount, type DangerCard } from "@/lib/parent-child-charts-v2";
import { getIljuInfo, inferYongsinMeaning, type IljuInfo } from "@/lib/parent-child-traits-v2";
import PrecisionPillarTable from "@/components/saju-visuals/PrecisionPillarTable";
import IntroScrollChapter from "@/components/parent-child-shared/IntroScrollChapter";
import { ILGAN_METAPHOR } from "@/lib/child-seed";
import { calcGisin, type GisinResult } from "@/lib/saju-traditional";
import { deriveChildKeywords } from "@/components/saju-visuals/KeywordChips";
import { getDayMasterStrength } from "@/lib/saju-calculator";
import { inferThinkingType, type ThinkingType, inferTantrumTriggers, type TantrumTrigger, inferFriendStyle, type FriendStyle, evaluateDaeunTimeline, type DaeunHighlight } from "@/lib/parent-child-charts-v2";
import { inferPositiveSinsal, type PositiveSinsalReading, inferDominantMeaning, type DominantMeaning } from "@/lib/parent-child-traits-v2";
import { inferJobRadar, type JobRadarItem, inferElementCompare, type ElementCompare, inferIlganRelation, type IlganRelation, inferFlowGiven, type FlowGiven } from "@/lib/parent-child-charts-v2";

const ACCENT = "#f0a8b8";
const GOLD = "#FFD700";
const BG = "#2a1a1d";
const BG_END = "#150810";

// ─── 7장 슬라이드 명세 (브라덜 요청건 100% 반영) ──────────────────────────────
type SlideKind =
  | "intro"
  | "saju-table"
  | "elements"
  | "sipseong"
  | "ilju"
  | "yongsin"
  | "card-strength"
  | "card-caution"
  | "text"
  | "parent-compare"
  | "outro";

interface SlideSpec {
  chapter: string;       // "1장" / "2장" / 들어가며·마지막은 라벨
  chapterTitle: string;  // 챕터 제목 (목차용)
  subtitle?: string;     // 소제목 (없으면 챕터 본문 통째)
  indicator?: string;    // [인자: ...] 표시
  kind: SlideKind;
  visualKey?: string;    // 시각 컴포넌트 분기
}

const SLIDES: SlideSpec[] = [
  // 들어가며
  { chapter: "들어가며", chapterTitle: "들어가며 — 사주 입문", kind: "intro" },
  // 1장
  { chapter: "1장", chapterTitle: "세 사람의 사주팔자", kind: "saju-table", visualKey: "saju-table" },
  // 2장 (6 sub)
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "다섯 가지 자연의 결", indicator: "오행 분포", kind: "elements", visualKey: "elements" },
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "10가지 성향의 지도", indicator: "십성 5분류", kind: "sipseong", visualKey: "sipseong" },
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "일주 기반 풀이", indicator: "일주(日柱)", kind: "ilju", visualKey: "ilju" },
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "채워줄 결, 살펴줄 결", indicator: "용신 / 기신", kind: "yongsin", visualKey: "yongsin" },
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "강점 — 이런 면이 빛납니다", indicator: "강한 오행·일주 강점", kind: "card-strength" },
  { chapter: "2장", chapterTitle: "우리 아이는 어떤 아이일까", subtitle: "주의점 — 이런 결은 살펴주세요", indicator: "약한 오행·기신", kind: "card-caution" },
  // 3장 — 공부 (5 sub)
  { chapter: "3장", chapterTitle: "우리 아이는 어떻게 공부할까", subtitle: "혼자 vs 같이", indicator: "비겁", kind: "text", visualKey: "ch3-bigeop" },
  { chapter: "3장", chapterTitle: "우리 아이는 어떻게 공부할까", subtitle: "우리 아이만의 공부법", indicator: "인성", kind: "text", visualKey: "ch3-insong" },
  { chapter: "3장", chapterTitle: "우리 아이는 어떻게 공부할까", subtitle: "글로 정리할까, 말로 표현할까", indicator: "식상", kind: "text", visualKey: "ch3-siksang" },
  { chapter: "3장", chapterTitle: "우리 아이는 어떻게 공부할까", subtitle: "아침·낮·밤 어느 때 가장 또렷할까", indicator: "오행 + 신강/신약", kind: "text", visualKey: "ch3-timeslot" },
  { chapter: "3장", chapterTitle: "우리 아이는 어떻게 공부할까", subtitle: "책상 앞 머릿속", indicator: "관성", kind: "text", visualKey: "ch3-thinking" },
  // 4장 — 칭찬·혼 (5 sub)
  { chapter: "4장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", subtitle: "화났을 때 입을 닫을까, 폭발할까", indicator: "식상 + 신강/신약", kind: "text", visualKey: "ch4-tantrum" },
  { chapter: "4장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", subtitle: "아이 감정이 가라앉는 환경", indicator: "오행", kind: "text", visualKey: "ch4-calm-env" },
  { chapter: "4장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", subtitle: "마음 열리는 칭찬", indicator: "인성 + 용신", kind: "text", visualKey: "ch4-praise" },
  { chapter: "4장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", subtitle: "거짓말 했을 때", indicator: "일주 + 관성", kind: "text", visualKey: "ch4-lie" },
  { chapter: "4장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", subtitle: "이 아이가 무너지는 자극", indicator: "기신", kind: "text", visualKey: "ch4-breakdown" },
  // 5장 — 친구 (5 sub)
  { chapter: "5장", chapterTitle: "친구 사이 우리 아이", subtitle: "마음 문 여는 데 걸리는 시간", indicator: "일주 + 인성", kind: "text", visualKey: "ch5-heart-door" },
  { chapter: "5장", chapterTitle: "친구 사이 우리 아이", subtitle: "리더 vs 짝꿍 vs 분위기 메이커", indicator: "비겁 + 식상 + 관성", kind: "text", visualKey: "ch5-style" },
  { chapter: "5장", chapterTitle: "친구 사이 우리 아이", subtitle: "인생을 바꿀 친구는 따로 있다", indicator: "귀인 신살", kind: "text", visualKey: "ch5-life-friend" },
  { chapter: "5장", chapterTitle: "친구 사이 우리 아이", subtitle: "친구의 결이 바뀌는 시기", indicator: "대운", kind: "text", visualKey: "ch5-friend-shift" },
  { chapter: "5장", chapterTitle: "친구 사이 우리 아이", subtitle: "친구들 속에서 지치는 패턴", indicator: "신강/신약", kind: "text", visualKey: "ch5-fatigue" },
  // 6장 — 빛날 (5 sub)
  { chapter: "6장", chapterTitle: "우리 아이는 무엇으로 빛날까", subtitle: "진짜 빛날 분야", indicator: "식상 + 재성", kind: "text", visualKey: "ch6-job-radar" },
  { chapter: "6장", chapterTitle: "우리 아이는 무엇으로 빛날까", subtitle: "아이만의 무기", indicator: "일주", kind: "text", visualKey: "ch6-weapon" },
  { chapter: "6장", chapterTitle: "우리 아이는 무엇으로 빛날까", subtitle: "환하게 빛나게 해주는 결 한 가지", indicator: "용신", kind: "text", visualKey: "ch6-shine-key" },
  { chapter: "6장", chapterTitle: "우리 아이는 무엇으로 빛날까", subtitle: "10대·20대·30대 어느 때 가장 빛날까", indicator: "대운", kind: "text", visualKey: "ch6-shine-age" },
  { chapter: "6장", chapterTitle: "우리 아이는 무엇으로 빛날까", subtitle: "리더로 클까, 깊이 있는 전문가로 클까", indicator: "관성 + 인성", kind: "text", visualKey: "ch6-leader-expert" },
  // 7장 — 셋의 결 (5 sub) — 어머님/아버님 양육 톤은 첫 소제목으로 흡수
  { chapter: "7장", chapterTitle: "엄마·아빠와 우리 셋의 결", subtitle: "엄마와 통하는 결, 아빠와 통하는 결", indicator: "인성 + 관성 + 일주 (양 부모 양육 톤 흡수)", kind: "parent-compare", visualKey: "ch7-ilgan-rel" },
  { chapter: "7장", chapterTitle: "엄마·아빠와 우리 셋의 결", subtitle: "셋이 함께 가장 편안한 순간", indicator: "오행", kind: "text", visualKey: "ch7-trio-radar" },
  { chapter: "7장", chapterTitle: "엄마·아빠와 우리 셋의 결", subtitle: "부모가 채워줄 결 / 살펴줄 결", indicator: "용신 + 기신", kind: "text", visualKey: "ch7-flow" },
  { chapter: "7장", chapterTitle: "엄마·아빠와 우리 셋의 결", subtitle: "부모 외에 인생에 큰 힘이 되어줄 어른", indicator: "귀인 신살", kind: "text", visualKey: "ch7-external-boost" },
  { chapter: "7장", chapterTitle: "엄마·아빠와 우리 셋의 결", subtitle: "부모와 마음이 가장 통하는 나이", indicator: "대운", kind: "text", visualKey: "ch7-bond-age" },
  // 마지막 당부
  { chapter: "마지막", chapterTitle: "자도인의 마지막 당부", kind: "outro" },
];

// 챕터별 그룹 (목차 표시용)
function groupByChapter(slides: SlideSpec[]) {
  const map = new Map<string, { title: string; items: { idx: number; subtitle: string }[] }>();
  slides.forEach((s, idx) => {
    if (!map.has(s.chapter)) map.set(s.chapter, { title: s.chapterTitle, items: [] });
    map.get(s.chapter)!.items.push({ idx, subtitle: s.subtitle ?? s.chapterTitle });
  });
  return Array.from(map.entries());
}

// ─── 메타 이벤트 페이로드 타입 ──────────────────────────────────────────────
interface MetaEvent {
  sajuMom: SajuAnalysis | null;
  sajuDad: SajuAnalysis | null;
  sajuChild: SajuAnalysis;
  hasMom: boolean;
  hasDad: boolean;
}

// ─── AI 본문 헤더 → 슬라이드 idx 매핑 ──────────────────────────────────────
function buildSlideTextMap(full: string): Record<number, string> {
  const result: Record<number, string> = {};
  if (!full) return result;
  // ## 챕터 — 제목   /   ### 소제목 단위로 파싱
  const lines = full.split("\n");
  let currentChapter = ""; // ex: "들어가며", "1장", "2장", ...
  let currentSubtitle = ""; // 소제목 (없으면 빈 문자열)
  let buf: string[] = [];
  const flush = () => {
    if (!currentChapter) return;
    const slideIdx = SLIDES.findIndex((s) => {
      if (s.chapter !== currentChapter) return false;
      if (!currentSubtitle) return !s.subtitle; // 챕터 본문 매핑 (들어가며·1장·마지막)
      return s.subtitle === currentSubtitle;
    });
    if (slideIdx >= 0) {
      const text = buf.join("\n").trim();
      if (text) result[slideIdx] = (result[slideIdx] ?? "") + (result[slideIdx] ? "\n\n" : "") + text;
    }
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    // ## 헤더 (챕터 시작)
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      const title = h2[1].trim();
      // "들어가며 — 사주 입문" → 챕터 키 "들어가며"
      // "1장 — 세 사람의 사주팔자" → 챕터 키 "1장"
      // "자도인의 마지막 당부" → 챕터 키 "마지막"
      if (title.startsWith("들어가며")) currentChapter = "들어가며";
      else if (title.startsWith("자도인의 마지막")) currentChapter = "마지막";
      else {
        const m = title.match(/^(\d+)장/);
        currentChapter = m ? `${m[1]}장` : "";
      }
      currentSubtitle = "";
      continue;
    }
    // ### 헤더 (소제목)
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      currentSubtitle = h3[1].trim();
      continue;
    }
    // [인자: …] 행 — 본문 아님
    if (/^\[인자[::]/.test(line)) continue;
    // 본문
    buf.push(line);
  }
  flush();
  return result;
}

// ─── 컴포넌트 본체 ──────────────────────────────────────────────────────────
export default function ParentChildSlideResultV2() {
  const params = useSearchParams();
  const fetchedRef = useRef(false);
  const [meta, setMeta] = useState<MetaEvent | null>(null);
  const [streamText, setStreamText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const childName = params.get("childName") || "";
  const childGender = params.get("childGender") || "";
  const honorific = childGender === "여" ? "양" : "군";

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: "parent-child-v2",
      section: "parent-child",
      childName,
      childGender,
      childYear: params.get("childYear") || "",
      childMonth: params.get("childMonth") || "",
      childDay: params.get("childDay") || "",
      childHour: params.get("childHour") || "시간 모름",
      childCalendar: params.get("childCalendar") || "양력",
    };
    if (params.get("momName")) {
      body.momName = params.get("momName")!;
      body.momYear = params.get("momYear") || "";
      body.momMonth = params.get("momMonth") || "";
      body.momDay = params.get("momDay") || "";
      body.momHour = params.get("momHour") || "시간 모름";
      body.momCalendar = params.get("momCalendar") || "양력";
    }
    if (params.get("dadName")) {
      body.dadName = params.get("dadName")!;
      body.dadYear = params.get("dadYear") || "";
      body.dadMonth = params.get("dadMonth") || "";
      body.dadDay = params.get("dadDay") || "";
      body.dadHour = params.get("dadHour") || "시간 모름";
      body.dadCalendar = params.get("dadCalendar") || "양력";
    }

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          setErrMsg(`HTTP ${res.status} ${t.slice(0, 200)}`);
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
            if (raw === "[DONE]") {
              setStreamText(full);
              setLoading(false);
              break outer;
            }
            try {
              const msg = JSON.parse(raw);
              if (msg.t === "m" && msg.d) {
                setMeta(msg.d as MetaEvent);
              } else if (msg.t === "x" && typeof msg.v === "string") {
                full += msg.v;
                setStreamText(full);
              }
            } catch {
              // ignore
            }
          }
        }
      })
      .catch((e) => {
        setErrMsg(String(e));
        setLoading(false);
      });
  }, [childName, childGender, params]);

  const slideText = useMemo(() => buildSlideTextMap(streamText), [streamText]);
  const total = SLIDES.length;
  const slide = SLIDES[slideIdx];
  const grouped = useMemo(() => groupByChapter(SLIDES), []);

  function go(delta: number) {
    setSlideIdx((i) => Math.max(0, Math.min(total - 1, i + delta)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function jumpTo(i: number) {
    setSlideIdx(i);
    setTocOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, ${BG_END} 100%)`, color: "white" }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col relative">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 sticky top-0 z-10"
          style={{ borderBottom: `1px solid ${ACCENT}22`, background: `${BG}ee`, backdropFilter: "blur(10px)" }}>
          <Link href="/parent-child-v2" className="text-sm" style={{ color: `${ACCENT}88` }}>←</Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>慈</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white truncate">자도인의 가족 인연 풀이</div>
            <div className="text-[10px]" style={{ color: `${ACCENT}77` }}>V2 · {childName}{honorific}</div>
          </div>
          <div className="text-[11px]" style={{ color: `${ACCENT}99` }}>{slideIdx + 1}/{total}</div>
          <button onClick={() => setTocOpen((v) => !v)}
            className="px-2 py-1 rounded text-[11px]"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
            목차 ↓
          </button>
        </div>

        {/* 목차 드롭다운 */}
        {tocOpen && (
          <div className="absolute top-[58px] right-2 left-2 z-20 rounded-xl p-3 max-h-[70vh] overflow-y-auto"
            style={{ background: "#1a0d10", border: `1px solid ${ACCENT}44` }}>
            {grouped.map(([ch, group]) => (
              <div key={ch} className="mb-2">
                <div className="text-[12px] font-bold mb-1" style={{ color: GOLD }}>{ch} — {group.title}</div>
                <ul className="ml-2">
                  {group.items.map((it) => (
                    <li key={it.idx}>
                      <button onClick={() => jumpTo(it.idx)}
                        className="w-full text-left text-[11px] py-1 px-2 rounded hover:bg-white/5"
                        style={{ color: it.idx === slideIdx ? ACCENT : "rgba(255,255,255,0.7)" }}>
                        {it.subtitle}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* 본문 */}
        <div className="flex-1 px-5 py-6 space-y-4">
          {errMsg && (
            <div className="rounded-xl p-4 my-3" style={{ backgroundColor: "rgba(255,138,138,0.1)", border: "1px solid rgba(255,138,138,0.3)" }}>
              <p className="text-sm font-bold text-[#ff8a8a] mb-1">풀이 생성 실패</p>
              <pre className="text-[11px] text-white/70 whitespace-pre-wrap break-all">{errMsg}</pre>
              <Link href="/parent-child-v2/form" className="inline-block mt-3 px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: `${ACCENT}33`, color: ACCENT }}>← 돌아가기</Link>
            </div>
          )}

          {!errMsg && slide.kind === "intro" && meta && (
            <IntroScrollChapter
              sajuChild={meta.sajuChild}
              childName={childName}
              childGender={(childGender === "여" ? "여" : "남") as "남" | "여"}
              ilganMetaphor={ILGAN_METAPHOR[meta.sajuChild.ilgan] ?? ""}
              onStart={() => go(1)}
            />
          )}

          {!errMsg && slide.kind === "intro" && !meta && (
            <div className="flex items-center gap-3 py-3">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${ACCENT}44`, borderTopColor: ACCENT }} />
              <span className="text-[12px]" style={{ color: `${ACCENT}aa` }}>사주 계산 중…</span>
            </div>
          )}

          {!errMsg && slide.kind !== "intro" && (
            <SlideView
              spec={slide}
              meta={meta}
              text={slideText[slideIdx] ?? ""}
              loading={loading && !slideText[slideIdx]}
              childName={childName}
              honorific={honorific}
            />
          )}
        </div>

        {/* 하단 nav */}
        <div className="flex-shrink-0 px-4 py-3 sticky bottom-0 z-10"
          style={{ borderTop: `1px solid ${ACCENT}22`, background: `${BG}ee`, backdropFilter: "blur(10px)" }}>
          <div className="flex gap-2">
            <button onClick={() => go(-1)} disabled={slideIdx === 0}
              className="flex-1 py-3 rounded-xl text-sm font-medium disabled:opacity-30"
              style={{ backgroundColor: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}44` }}>
              ‹ 이전
            </button>
            <button onClick={() => go(1)} disabled={slideIdx === total - 1}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-30"
              style={{ backgroundColor: GOLD, color: "#1a0d00" }}>
              다음 ›
            </button>
          </div>
          {slideIdx === total - 1 && !loading && (
            <div className="mt-2 flex gap-2">
              <Link href="/parent-child-v2/form" className="flex-1 text-center py-2 rounded-lg text-[12px]"
                style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>다른 가족 풀이</Link>
              <Link href="/parent-child" className="flex-1 text-center py-2 rounded-lg text-[12px]"
                style={{ backgroundColor: `${GOLD}22`, color: GOLD }}>V1과 비교</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── 슬라이드 뷰 ────────────────────────────────────────────────────────────
function SlideView({
  spec, meta, text, loading, childName, honorific,
}: {
  spec: SlideSpec;
  meta: MetaEvent | null;
  text: string;
  loading: boolean;
  childName: string;
  honorific: string;
}) {
  return (
    <article className="space-y-4">
      {/* 챕터 라벨 */}
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{ backgroundColor: `${GOLD}22`, color: GOLD }}>
          {spec.chapter}
        </span>
        <span className="text-[12px]" style={{ color: `${ACCENT}99` }}>{spec.chapterTitle}</span>
      </div>

      {/* 소제목 */}
      <h2 className="text-[20px] font-bold leading-tight" style={{ color: "white" }}>
        {spec.subtitle ?? spec.chapterTitle}
      </h2>

      {/* 인자 매핑 (디버그 톤) */}
      {spec.indicator && (
        <div className="text-[10px] inline-block px-2 py-0.5 rounded"
          style={{ backgroundColor: `${ACCENT}15`, color: `${ACCENT}cc` }}>
          [인자: {spec.indicator}]
        </div>
      )}

      {/* 시각 컴포넌트 */}
      {meta && spec.visualKey === "saju-table" && (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold mb-2" style={{ color: ACCENT }}>자녀 — {childName}{honorific}</div>
            <PrecisionPillarTable saju={meta.sajuChild} />
          </div>
          {meta.hasMom && meta.sajuMom && (
            <div>
              <div className="text-[11px] font-bold mb-2" style={{ color: ACCENT }}>어머님</div>
              <PrecisionPillarTable saju={meta.sajuMom} />
            </div>
          )}
          {meta.hasDad && meta.sajuDad && (
            <div>
              <div className="text-[11px] font-bold mb-2" style={{ color: "#7eb6ff" }}>아버님</div>
              <PrecisionPillarTable saju={meta.sajuDad} />
            </div>
          )}
        </div>
      )}
      {meta && spec.visualKey === "elements" && (
        <div className="space-y-2">
          <ElementsRadar elements={meta.sajuChild.elements as Record<string, number>} />
          <SpectrumTable elements={meta.sajuChild.elements as Record<string, number>} />
        </div>
      )}
      {meta && spec.visualKey === "sipseong" && (
        <div className="space-y-2">
          <SipseongRadar counts={getSipseongCounts(meta.sajuChild)} />
          <SipseongSpectrumTable counts={getSipseongCounts(meta.sajuChild)} />
        </div>
      )}
      {meta && spec.visualKey === "ilju" && (
        <div className="space-y-3">
          <IljuSubsectionBanner childIlju={(() => { try { return getIljuInfo(meta.sajuChild); } catch { return null; } })()} />
          <IljuCard saju={meta.sajuChild} />
        </div>
      )}
      {meta && spec.visualKey === "yongsin" && (
        <div className="space-y-3">
          <YongsinCard saju={meta.sajuChild} />
          <GisinCard saju={meta.sajuChild} />
        </div>
      )}
      {meta && spec.kind === "card-strength" && <StrengthGrid saju={meta.sajuChild} />}
      {meta && spec.kind === "card-caution" && <DangerCardsView list={inferDangerCards(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch3-bigeop" && <BigeopFocusCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch3-insong" && <InsongLearnCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch3-siksang" && <SiksangExpressionCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch3-timeslot" && <TimeSlotGauge saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch3-thinking" && <ThinkingMatrix tt={inferThinkingType(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch4-tantrum" && <TantrumBars triggers={inferTantrumTriggers(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch4-calm-env" && <EmotionCalmEnvCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch4-praise" && <PraiseCompareCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch4-lie" && <LieResponseCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch4-breakdown" && <BreakdownTriggerCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch5-heart-door" && <HeartDoorCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch5-style" && <FriendStyleQuadrant fs={inferFriendStyle(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch5-life-friend" && <LifeFriendSinsalCard reading={inferPositiveSinsal(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch5-friend-shift" && <FriendShiftTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch5-fatigue" && <FatiguePatternCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch6-job-radar" && <JobRadarCard items={inferJobRadar(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch6-weapon" && <WeaponCard saju={meta.sajuChild} dom={inferDominantMeaning(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch6-shine-key" && <ShineKeyCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch6-shine-age" && <ShineAgeTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />}
      {meta && spec.visualKey === "ch6-leader-expert" && <LeaderExpertCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch7-ilgan-rel" && <FamilyIlganRelations meta={meta} />}
      {meta && spec.visualKey === "ch7-trio-radar" && <TrioRadarCard meta={meta} />}
      {meta && spec.visualKey === "ch7-flow" && <FlowFillCard meta={meta} />}
      {meta && spec.visualKey === "ch7-external-boost" && <ExternalBoostCard saju={meta.sajuChild} />}
      {meta && spec.visualKey === "ch7-bond-age" && <BondAgeTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />}
      {meta && spec.kind === "outro" && <OutroCard childName={childName} honorific={honorific} />}

      {/* 본문 */}
      <div className="text-[14px] leading-7" style={{ color: "rgba(255,255,255,0.92)" }}>
        {text ? (
          renderParagraphs(text)
        ) : loading ? (
          <div className="flex items-center gap-3 py-3">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${ACCENT}44`, borderTopColor: ACCENT }} />
            <span className="text-[12px]" style={{ color: `${ACCENT}aa` }}>풀이 생성 중…</span>
          </div>
        ) : (
          <p className="text-[12px]" style={{ color: `${ACCENT}88` }}>(이 페이지의 본문을 찾지 못했어요. 다음 페이지로 넘어가시거나 다시 시도해주세요.)</p>
        )}
      </div>
    </article>
  );
}

function renderParagraphs(text: string) {
  return text.split(/\n\n+/).map((p, i) => (
    <p key={i} className="my-2 whitespace-pre-wrap">{p}</p>
  ));
}

// ─── 시각 컴포넌트 ─────────────────────────────────────────────────────────

function IljuCard({ saju }: { saju: SajuAnalysis }) {
  const ilju = `${saju.pillars.day.stem}${saju.pillars.day.branch}`;
  let info: ReturnType<typeof getIljuInfo> | null = null;
  try { info = getIljuInfo(saju); } catch { info = null; }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-center mb-3">
        <div className="text-[11px]" style={{ color: `${ACCENT}aa` }}>일주(日柱)</div>
        <div className="text-[28px] font-bold" style={{ color: GOLD }}>{info?.hanja ?? ilju}</div>
        <div className="text-[12px] mt-0.5" style={{ color: `${ACCENT}cc` }}>{info?.hangul ?? ilju}</div>
      </div>
      {info && (
        <div className="space-y-2 text-[12px]">
          <div className="text-center font-bold" style={{ color: GOLD }}>{info.fusion}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded p-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <div className="text-[10px]" style={{ color: `${ACCENT}aa` }}>천간 ({info.stemHanja})</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{info.stemMeaning}</div>
            </div>
            <div className="rounded p-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
              <div className="text-[10px]" style={{ color: `${ACCENT}aa` }}>지지 ({info.branchHanja})</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{info.branchMeaning}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function YongsinCard({ saju }: { saju: SajuAnalysis }) {
  let meaning: ReturnType<typeof inferYongsinMeaning> | null = null;
  try { meaning = inferYongsinMeaning(saju); } catch { meaning = null; }
  if (!meaning) {
    return (
      <div className="rounded-xl p-3 text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}22`, color: `${ACCENT}99` }}>
        용신 정보 분석 중…
      </div>
    );
  }
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(126, 218, 126, 0.08)", border: "1px solid rgba(126,218,126,0.3)" }}>
      <div className="flex items-baseline gap-2">
        <div className="text-[11px]" style={{ color: "#7eda7e" }}>채워줄 결 (用神)</div>
        <div className="text-[18px] font-bold" style={{ color: "#7eda7e" }}>{meaning.element ?? "—"} ({meaning.hanja})</div>
      </div>
      <div className="text-[12px] leading-6" style={{ color: "rgba(255,255,255,0.88)" }}>{meaning.meaning}</div>
      <div className="text-[12px] leading-6 pt-2 mt-2" style={{ color: "rgba(255,255,255,0.78)", borderTop: "1px solid rgba(126,218,126,0.2)" }}>
        <span className="text-[10px] mr-1" style={{ color: "#7eda7e" }}>길</span>
        {meaning.guidance}
      </div>
    </div>
  );
}

// ─── STEP 2 — V1 시각 컴포넌트 이식 ─────────────────────────────────────────
const ELEM_COLORS: Record<string, string> = {
  목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#94a3b8", 수: "#60a5fa",
};
const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_DESC: Record<string, string> = {
  목: "호기심", 화: "열정", 토: "안정", 금: "결단", 수: "지혜",
};
const ELEM_NAME_FRIENDLY: Record<string, { label: string }> = {
  목: { label: "나무 — 호기심·성장" },
  화: { label: "불 — 열정·표현" },
  토: { label: "흙 — 안정·신뢰" },
  금: { label: "쇠 — 결단·의지" },
  수: { label: "물 — 지혜·유연" },
};
const ELEM_SPECTRUM: Record<string, { weak: string; strong: string; balanced: string }> = {
  목: { weak: "호기심·성장보다 신중함이 두드러짐", strong: "호기심·성장이 강해 새 도전을 좋아함", balanced: "호기심과 신중함이 고루 있음" },
  화: { weak: "열정·표현보다 차분함이 두드러짐", strong: "열정·표현이 강해 감정이 풍부함", balanced: "열정과 차분함이 고루 있음" },
  토: { weak: "안정·신뢰보다 새로운 자극을 더 끌리게 느낌", strong: "안정·신뢰가 강해 끝까지 한결같음", balanced: "안정과 변화가 고루 있음" },
  금: { weak: "결단·의지보다 부드러운 양보가 두드러짐", strong: "결단·의지가 강해 결단력이 분명함", balanced: "결단과 부드러움이 고루 있음" },
  수: { weak: "지혜·유연보다 빠른 행동이 앞서는 결", strong: "지혜·유연이 강해 적응을 잘함", balanced: "고집과 유연이 고루 있음" },
};
const SIP_COLORS: Record<string, string> = {
  비겁: "#f5b942", 식상: "#ff9d6b", 재성: "#7dd3c0", 관성: "#7eb6ff", 인성: "#c89cff",
};
const SIPSEONG_SPECTRUM: Record<string, { label: string; weak: string; strong: string; balanced: string; explain: string }> = {
  비겁: {
    label: "자기를 세우는 결",
    weak: "남에게 잘 맞춰주고 따라가는 편 — 함께하는 걸 좋아하지만 자기 의견은 늦게 드러냄",
    strong: "자기 주관이 분명하고 끌어가는 편 — 친구 사이에서 리더가 되는 모습이 자주 보임",
    balanced: "자기 주관과 어울림이 고루 — 혼자서도 함께서도 잘 지냄",
    explain: "자녀가 친구·가족 사이에서 자기 자리를 어떻게 잡는지의 결",
  },
  식상: {
    label: "표현하는 결",
    weak: "마음을 안에서 정리하고 겉으로 잘 드러내지 않는 편 — 말보다 행동이나 글로 표현",
    strong: "말·창작·표현이 풍부하고 활발함 — 손과 입이 먼저 움직이는 자녀",
    balanced: "표현과 침착함이 고루 — 상황에 맞춰 드러내고 거두는 결",
    explain: "자녀가 마음과 생각을 바깥으로 어떻게 풀어내는지의 결",
  },
  재성: {
    label: "손에 잡히는 결",
    weak: "손에 잡히는 결과보다 머릿속 이상에 끌림 — 결과 챙김이 늦은 편",
    strong: "돈·물건·결과를 챙기는 감각이 좋고 실용적임",
    balanced: "이상과 결과가 고루 — 꿈도 꾸고 실리도 챙김",
    explain: "자녀가 돈·물건·구체적 결과에 어떻게 끌리는지의 결",
  },
  관성: {
    label: "절제하는 결",
    weak: "자유롭고 틀에 얽매이는 걸 싫어함 — 규칙보다 자기 길로 가고 싶어함",
    strong: "규칙·책임감이 강하고 절제가 잘됨 — 어른스럽고 약속을 잘 지킴",
    balanced: "자유와 절제가 고루 — 필요할 때는 따르고 필요할 때는 자기 길",
    explain: "자녀가 규칙·약속·틀을 어떻게 받아들이는지의 결",
  },
  인성: {
    label: "사색하는 결",
    weak: "직관·즉각 반응이 빠르고 깊이 파지는 않음 — 느낀 대로 빠르게 움직임",
    strong: "깊이 사색하고 받아들이는 결이 큼 — 책·생각·혼자 시간을 좋아함",
    balanced: "직관과 사색이 고루 — 빠르게 느끼고 깊이 곱씹는 결",
    explain: "자녀가 정보·감정을 어떻게 흡수하고 곱씹는지의 결",
  },
};
const STRENGTH_PALETTE = [
  { color: "#7dd3c0", glow: "rgba(125,211,192,0.15)" },
  { color: "#fbbf24", glow: "rgba(251,191,36,0.15)" },
  { color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
  { color: "#f472b6", glow: "rgba(244,114,182,0.15)" },
  { color: "#60a5fa", glow: "rgba(96,165,250,0.15)" },
];

function adjustElementsForDisplay(raw: Record<string, number>): Record<string, number> {
  const ORDER = ["목", "화", "토", "금", "수"];
  const total = ORDER.reduce((s, k) => s + (raw[k] || 0), 0) || 1;
  const pct: Record<string, number> = {};
  for (const k of ORDER) pct[k] = ((raw[k] || 0) / total) * 100;
  return pct;
}

function ElementsRadar({ elements }: { elements: Record<string, number> }) {
  const ELEM_ORDER = ["목", "화", "토", "금", "수"];
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
    <div className="flex justify-center">
      <svg width="340" height="320" viewBox="0 0 340 320">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ELEM_ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        <polygon points={dataPts} fill={`${ELEM_COLORS[topEl]}35`} stroke={ELEM_COLORS[topEl]} strokeWidth="2.5" strokeLinejoin="round" />
        {ELEM_ORDER.map((el, i) => {
          const [lx, ly] = pt(i, LO);
          const pct = Math.round(adjusted[el] ?? 0);
          const isTop = el === topEl;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 10} textAnchor={anchor} fontSize="22" fontWeight="bold" fill={ELEM_COLORS[el]}>{ELEM_HANJA[el]}</text>
              <text x={lx + dx} y={ly + 12} textAnchor={anchor} fontSize="16" fontWeight={isTop ? "bold" : "normal"} fill={ELEM_COLORS[el]}>{pct}%</text>
              <text x={lx + dx} y={ly + 26} textAnchor={anchor} fontSize="11" fill="rgba(255,255,255,0.65)">{ELEM_DESC[el].split("·")[0]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SpectrumTable({ elements }: { elements: Record<string, number> }) {
  const ORDER = ["목", "화", "토", "금", "수"];
  const adjusted = adjustElementsForDisplay(elements);
  return (
    <div className="mt-4">
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3" style={{ color: `${ACCENT}cc` }}>
        ※ 우리 아이의 다섯 기운 분포입니다. <strong style={{ color: GOLD }}>그 결이 강하면 본질 그대로</strong>, <strong style={{ color: GOLD }}>약하면 반대 모습</strong>이 일상에서 두드러집니다.
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
        {ORDER.map((el) => {
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
            <div key={el} className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-xl font-bold" style={{ color }}>{ELEM_HANJA[el]}</span>
                <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>{ELEM_NAME_FRIENDLY[el].label.replace(/^.*— /, "")}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold" style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.5)" : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[13px] leading-snug flex-1" style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)" }}>{phrase}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SipseongRadar({ counts }: { counts: SipseongCount }) {
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
    <div className="flex justify-center">
      <svg width="340" height="380" viewBox="0 0 340 380">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        {ORDER.map((k, i) => {
          if (counts[k] === 0) return null;
          const raw = displayCounts[k] / 5;
          const s = Math.min(1.0, Math.max(MIN_SCALE, raw));
          const [x, y] = pt(i, s);
          return <line key={`bar-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={ACCENT} strokeWidth="6" strokeLinecap="round" opacity={0.85} />;
        })}
        {ORDER.map((k, i) => {
          const [lx, ly] = pt(i, LO);
          const isTop = k === top;
          const isZero = counts[k] === 0;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          const labelColor = isZero ? "rgba(255,255,255,0.45)" : isTop ? GOLD : "rgba(255,255,255,0.85)";
          const subColor = isZero ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)";
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 8} textAnchor={anchor} fontSize="14" fontWeight={isTop ? "bold" : "normal"} fill={labelColor}>
                {isZero ? k : `${k} ${counts[k]}`}
              </text>
              <text x={lx + dx} y={ly + 8} textAnchor={anchor} fontSize="10" fill={subColor}>{SIPSEONG_DESC[k]}</text>
              {isZero && (
                <text x={lx + dx} y={ly + 22} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.45)" fontWeight="600">약한 부분</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SipseongSpectrumTable({ counts }: { counts: SipseongCount }) {
  const ORDER: Array<keyof SipseongCount> = ["비겁", "식상", "재성", "관성", "인성"];
  const total = ORDER.reduce((s, k) => s + counts[k], 0);
  const avg = total / 5;
  return (
    <div className="mt-4">
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3" style={{ color: `${ACCENT}cc` }}>
        ※ 우리 아이의 다섯 색깔(기질) 분포입니다. <strong style={{ color: GOLD }}>그 색이 강하면 본질 그대로</strong>, <strong style={{ color: GOLD }}>약하면 반대 모습</strong>이 일상에서 두드러집니다.
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
        {ORDER.map((k) => {
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
            <div key={k} className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[15px] font-bold" style={{ color }}>{k}</span>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{data.label}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{v}</span>
              </div>
              <p className="text-[10.5px] leading-snug mb-1.5" style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>{data.explain}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold flex-shrink-0" style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.5)" : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[12.5px] leading-snug flex-1" style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)" }}>{phrase}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IljuSubsectionBanner({ childIlju }: { childIlju: IljuInfo | null }) {
  const HUE = "#c89cff";
  return (
    <div className="mb-2">
      <h4 className="text-sm font-bold text-center mb-1" style={{ color: GOLD }}>일주(日柱) 기반 풀이</h4>
      <p className="text-center text-[10.5px] mb-3 italic" style={{ color: "rgba(255,255,255,0.7)" }}>
        자녀의 자기 결 — 십성 5분류와는 다른 본질 인자
      </p>
      {childIlju && (
        <div className="rounded-2xl p-3" style={{ background: `linear-gradient(135deg, ${HUE}1a, rgba(255,255,255,0.03))`, border: `1px solid ${HUE}40` }}>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-[28px] font-bold tracking-widest leading-none" style={{ color: HUE }}>{childIlju.hanja}</div>
              <p className="text-[10px] mt-1.5" style={{ color: `${HUE}cc` }}>{childIlju.fusion}</p>
            </div>
            <div className="w-px h-12" style={{ background: `${HUE}30` }} />
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[64px]" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="text-[18px] font-bold leading-none" style={{ color: HUE }}>{childIlju.stemHanja}</div>
                <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{childIlju.stemMeaning}</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[64px]" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <div className="text-[18px] font-bold leading-none" style={{ color: HUE }}>{childIlju.branchHanja}</div>
                <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{childIlju.branchMeaning}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GisinCard({ saju }: { saju: SajuAnalysis }) {
  let g: GisinResult | null = null;
  try { g = calcGisin(saju); } catch { g = null; }
  if (!g) return null;
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
      <div className="flex items-baseline gap-2">
        <div className="text-[11px]" style={{ color: "#ff8a8a" }}>살펴줄 결 (忌神)</div>
        <div className="text-[18px] font-bold" style={{ color: "#ff8a8a" }}>{g.element} ({g.hanja})</div>
      </div>
      <div className="text-[12px] leading-6" style={{ color: "rgba(255,255,255,0.85)" }}>{g.meaning}</div>
      <div className="text-[12px] leading-6" style={{ color: "rgba(255,255,255,0.78)" }}>
        <span className="text-[10px] mr-1" style={{ color: "#ff8a8a" }}>주의</span>
        {g.caution}
      </div>
      {g.avoid.length > 0 && (
        <ul className="text-[11.5px] leading-6 pt-1 mt-1" style={{ color: "rgba(255,255,255,0.7)", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
          {g.avoid.map((a, i) => <li key={i}>· {a}</li>)}
        </ul>
      )}
    </div>
  );
}

function StrengthGrid({ saju }: { saju: SajuAnalysis }) {
  const dms = (() => {
    try {
      return getDayMasterStrength(
        saju.ilgan,
        saju.pillars.month.branch,
        [
          saju.pillars.year.branch,
          saju.pillars.month.branch,
          saju.pillars.day.branch,
          ...(saju.pillars.hour ? [saju.pillars.hour.branch] : []),
        ],
        [
          saju.pillars.year.stem,
          saju.pillars.month.stem,
          ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
        ],
      );
    } catch { return null; }
  })();
  const counts = getSipseongCounts(saju);
  const sipsList: { name: string; v: number }[] = [
    { name: "비겁", v: counts.비겁 }, { name: "식상", v: counts.식상 },
    { name: "재성", v: counts.재성 }, { name: "관성", v: counts.관성 }, { name: "인성", v: counts.인성 },
  ];
  const topSip = [...sipsList].sort((a, b) => b.v - a.v)[0]?.name as keyof typeof SIPSEONG_SPECTRUM;
  const ilganElem = (() => {
    const map: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
    return map[saju.ilgan] ?? "목";
  })();
  const keywords = deriveChildKeywords({
    ilganElement: ilganElem,
    dayMasterLevel: dms?.level,
    topSipseong: topSip,
    hasGuiin: false,
  });
  const cards: { emoji: string; keyword: string; body: string }[] = [
    { emoji: "🌱", keyword: `${ilganElem}(${ELEM_HANJA[ilganElem]})의 본질 — ${ELEM_DESC[ilganElem]}`, body: ELEM_SPECTRUM[ilganElem].strong },
    { emoji: "✨", keyword: `${topSip} 우세 — ${SIPSEONG_SPECTRUM[topSip]?.label ?? ""}`, body: SIPSEONG_SPECTRUM[topSip]?.strong ?? "" },
  ];
  if (dms) {
    cards.push({ emoji: "🔆", keyword: `신강·신약 — ${dms.level}`, body: `자녀의 일간 기운 위치(0~6단계 중 ${dms.positionIdx}단계). 자기 결을 펼쳐가는 출발 지점입니다.` });
  }
  if (keywords.length > 0) {
    cards.push({ emoji: "🎯", keyword: "본질 키워드", body: keywords.join(" · ") });
  }
  return (
    <div className="space-y-2.5">
      {cards.map((c, i) => {
        const { color, glow } = STRENGTH_PALETTE[i % STRENGTH_PALETTE.length];
        return (
          <div key={i} className="rounded-2xl p-4 flex gap-3.5 items-start"
            style={{ background: `linear-gradient(135deg, ${glow}, ${color}08 60%, transparent)`, borderLeft: `3px solid ${color}`, border: `1px solid ${color}40`, boxShadow: `0 2px 12px ${color}15` }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 48, height: 48, fontSize: 26, background: `${color}25`, borderRadius: 12, border: `1px solid ${color}50` }}>{c.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold mb-1.5 leading-tight" style={{ color, fontSize: 15, letterSpacing: "-0.01em" }}>{c.keyword}</p>
              <p className="leading-[1.65]" style={{ color: "rgba(255,255,255,0.86)", fontSize: 13 }}>{c.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DangerCardsView({ list }: { list: DangerCard[] }) {
  const sorted = [...list].sort((a, b) => b.level - a.level);
  const topTwo = sorted.slice(0, 2);
  const restThree = sorted.slice(2);
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 이 자녀에게 가장 깊이 닿는 살핌 2가지 ─</p>
      <div className="space-y-2.5">
        {topTwo.map((c, i) => (
          <div key={c.name} className="rounded-xl p-3" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}>
            <div className="flex items-baseline justify-between mb-1.5 gap-2">
              <span className="text-[13.5px] font-bold leading-snug" style={{ color: "#ff8a8a" }}>{c.name}</span>
              <span className="text-[12px] flex-shrink-0" style={{ color: "#ef4444", letterSpacing: "1px" }}>{"★".repeat(c.level)}{"☆".repeat(5 - c.level)}</span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{c.why}</p>
            <div className="mt-2.5 rounded-lg p-2.5" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderLeft: "3px solid #ef4444" }}>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "#ff8a8a", fontWeight: "bold" }}>─ 왜 {i === 0 ? "가장" : "특히"} 깊이 닿는가 (사주 근거) ─</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{c.sajuBasis}</p>
            </div>
          </div>
        ))}
      </div>
      {restThree.length > 0 && (
        <>
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold mt-4 mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>─ 그 외 살펴볼 결 ─</p>
          <div className="space-y-1.5">
            {restThree.map((c) => {
              const danger = c.level >= 3 ? "#f5b942" : "rgba(255,255,255,0.4)";
              return (
                <div key={c.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-[12.5px] leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>{c.name}</span>
                  <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: danger, letterSpacing: "1px" }}>{"★".repeat(c.level)}{"☆".repeat(5 - c.level)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── STEP 3 — 3장(공부) 시각 컴포넌트 ────────────────────────────────────────
function DualGauge({ leftLabel, rightLabel, leftPct, leftColor, rightColor, hint }: {
  leftLabel: string; rightLabel: string; leftPct: number; leftColor: string; rightColor: string; hint?: string;
}) {
  const lp = Math.max(0, Math.min(100, leftPct));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <span className="text-[13px] font-bold" style={{ color: leftColor }}>{leftLabel}</span>
          <span className="text-[18px] font-bold ml-2" style={{ color: leftColor }}>{Math.round(lp)}%</span>
        </div>
        <div className="text-right">
          <span className="text-[18px] font-bold mr-2" style={{ color: rightColor }}>{Math.round(100 - lp)}%</span>
          <span className="text-[13px] font-bold" style={{ color: rightColor }}>{rightLabel}</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full" style={{ width: `${lp}%`, background: `linear-gradient(90deg, ${leftColor}, ${leftColor}cc)` }} />
        <div className="h-full" style={{ width: `${100 - lp}%`, background: `linear-gradient(90deg, ${rightColor}cc, ${rightColor})` }} />
      </div>
      {hint && <p className="text-[11.5px] mt-2 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>{hint}</p>}
    </div>
  );
}

function BigeopFocusCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const bigeop = counts.비겁;
  const jaesong = counts.재성;
  // alone vs together: 비겁(자기결) 강하면 alone-mode 학습 잘 통함
  const total = bigeop + jaesong + 0.5;
  const alonePct = Math.max(15, Math.min(85, ((bigeop + 0.3) / total) * 100));
  const dominant = alonePct >= 55 ? "혼자" : alonePct <= 45 ? "같이" : "둘 다";
  const hint = dominant === "혼자"
    ? `비겁(자기 주관) ${bigeop} — 자기 페이스로 혼자 공부할 때 결이 단단하게 잡히는 자녀입니다.`
    : dominant === "같이"
      ? `재성(연결의 결) ${jaesong} — 친구·부모와 함께 풀어볼 때 흡수가 잘 되는 자녀입니다.`
      : `비겁 ${bigeop} · 재성 ${jaesong} — 혼자와 함께를 번갈아 가는 결의 자녀입니다.`;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 혼자 vs 같이 공부 ─</p>
      <DualGauge
        leftLabel="혼자" leftPct={alonePct} leftColor="#7eb6ff"
        rightLabel="같이" rightColor="#ff9d6b"
        hint={hint}
      />
    </div>
  );
}

function InsongLearnCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const insong = counts.인성;
  const siksang = counts.식상;
  const elem = saju.elements as Record<string, number>;
  // 깊이 사색(인성·수) vs 즉각 행동(식상·화)
  const depth = insong * 1.5 + (elem.수 ?? 0) * 0.5;
  const action = siksang * 1.5 + (elem.화 ?? 0) * 0.5;
  const total = depth + action + 0.5;
  const depthPct = Math.max(15, Math.min(85, ((depth + 0.3) / total) * 100));
  const tone = depthPct >= 60
    ? "깊이 들여다보고 곱씹는 결 — 책·생각으로 흡수하는 학습이 닿습니다"
    : depthPct <= 40
      ? "보고 듣고 따라 하는 결 — 손으로·몸으로·말로 익히는 학습이 닿습니다"
      : "사색과 행동을 번갈아 가는 결 — 보고 익힌 뒤 곱씹는 흐름이 잘 맞습니다";
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 우리 아이만의 공부법 ─</p>
      <DualGauge
        leftLabel="깊이 사색" leftPct={depthPct} leftColor="#c89cff"
        rightLabel="즉각 행동" rightColor="#ff9d6b"
        hint={tone}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="rounded-lg p-2" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#c89cff" }}>인성(印) {insong}</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>받아들임·사색의 결</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "rgba(255,157,107,0.08)", border: "1px solid rgba(255,157,107,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#ff9d6b" }}>식상(食) {siksang}</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>표현·창의의 결</div>
        </div>
      </div>
    </div>
  );
}

function SiksangExpressionCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const siksang = counts.식상;
  const insong = counts.인성;
  const elem = saju.elements as Record<string, number>;
  // 글(인성·금) vs 말(식상·화) 표현 채널
  const writing = insong * 1.0 + (elem.금 ?? 0) * 0.6;
  const talking = siksang * 1.5 + (elem.화 ?? 0) * 0.5;
  const total = writing + talking + 0.5;
  const writePct = Math.max(15, Math.min(85, ((writing + 0.3) / total) * 100));
  const tip = writePct >= 60
    ? "마음을 글·도식으로 정리할 때 단단해집니다 — 노트·요약·일기"
    : writePct <= 40
      ? "마음을 말·소리로 풀 때 단단해집니다 — 친구에게 설명·발표·녹음"
      : "글과 말 둘 다 통하는 결 — 정리한 뒤 말로 다시 설명하는 흐름이 좋습니다";
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 글로 정리할까, 말로 표현할까 ─</p>
      <DualGauge
        leftLabel="글" leftPct={writePct} leftColor="#94a3b8"
        rightLabel="말" rightColor="#ff9d6b"
        hint={tip}
      />
    </div>
  );
}

function TimeSlotGauge({ saju }: { saju: SajuAnalysis }) {
  const elem = saju.elements as Record<string, number>;
  const total = (elem.목 ?? 0) + (elem.화 ?? 0) + (elem.금 ?? 0) + (elem.수 ?? 0) + (elem.토 ?? 0) || 1;
  // 시간대 매핑: 아침=목(움트는), 낮=화(활기), 저녁=금(가다듬), 밤=수(고요)
  const slots = [
    { label: "아침", time: "5–10시", el: "목", color: "#22c55e", pct: ((elem.목 ?? 0) / total) * 100 },
    { label: "낮", time: "10–15시", el: "화", color: "#ef4444", pct: ((elem.화 ?? 0) / total) * 100 },
    { label: "저녁", time: "15–20시", el: "금", color: "#94a3b8", pct: ((elem.금 ?? 0) / total) * 100 },
    { label: "밤", time: "20–24시", el: "수", color: "#60a5fa", pct: ((elem.수 ?? 0) / total) * 100 },
  ];
  const max = Math.max(...slots.map((s) => s.pct), 1);
  const top = [...slots].sort((a, b) => b.pct - a.pct)[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 또렷해지는 시간대 ─</p>
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-[11.5px] mb-0.5">
              <span style={{ color: s.color, fontWeight: 600 }}>{s.label} <span style={{ color: "rgba(255,255,255,0.5)" }}>· {s.time}</span> <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>({s.el})</span></span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>{Math.round(s.pct)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${(s.pct / max) * 100}%`, height: "100%", backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        가장 또렷한 시간 → <strong style={{ color: top.color }}>{top.label} ({top.time})</strong> — 이 시간대에 가장 어려운 과목·집중이 필요한 일을 배치하시면 결이 잘 잡힙니다.
      </p>
    </div>
  );
}

function ThinkingMatrix({ tt }: { tt: ThinkingType }) {
  const SIZE = 240;
  const PAD = 30;
  const inner = SIZE - PAD * 2;
  const cx = PAD + (tt.x + 1) / 2 * inner;
  const cy = PAD + (1 - tt.y) / 2 * inner;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 책상 앞 머릿속 (사고 유형) ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 30} viewBox={`0 0 ${SIZE} ${SIZE + 30}`}>
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(124,179,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,193,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(196,156,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#7eb6ff">논리</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ff9d6b">감각</text>
          <text x={PAD - 4} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#c89cff">직관</text>
          <text x={SIZE - PAD + 4} y={SIZE / 2 + 4} textAnchor="start" fontSize="13" fontWeight="bold" fill="#ffc16b">관계</text>
          <circle cx={cx} cy={cy} r="11" fill={ACCENT} stroke={GOLD} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={`${ACCENT}55`} strokeWidth="1.5">
            <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="mt-2 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: `${ACCENT}22`, color: GOLD, border: `1px solid ${ACCENT}66` }}>
          {tt.dominant}
        </span>
        <p className="text-[12px] mt-2 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.7)" }}>{tt.desc}</p>
      </div>
    </div>
  );
}

// ─── STEP 4 — 4장(칭찬·혼) 시각 컴포넌트 ────────────────────────────────────
function TantrumBars({ triggers }: { triggers: TantrumTrigger[] }) {
  const max = Math.max(...triggers.map((t) => t.score), 1);
  const top = [...triggers].sort((a, b) => b.score - a.score)[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 떼·고집의 뿌리 4가지 ─</p>
      <div className="space-y-2.5">
        {triggers.map((t) => (
          <div key={t.name}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[12.5px] font-bold" style={{ color: t.color }}>{t.name}</span>
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{Math.round(t.score)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div style={{ width: `${(t.score / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)` }} />
            </div>
            <p className="text-[10.5px] mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>{t.subtitle}</p>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        가장 큰 뿌리 → <strong style={{ color: top.color }}>{top.name}</strong> · 두 분이 이 결을 알아봐주실 때 자녀의 마음이 자기 결로 가라앉습니다.
      </p>
    </div>
  );
}

function EmotionCalmEnvCard({ saju }: { saju: SajuAnalysis }) {
  const elem = saju.elements as Record<string, number>;
  const total = ["목","화","토","금","수"].reduce((s, k) => s + (elem[k] ?? 0), 0) || 1;
  const pct: Record<string, number> = {};
  ["목","화","토","금","수"].forEach((k) => { pct[k] = ((elem[k] ?? 0) / total) * 100; });
  // 가장 약한 오행 = 채워줄 환경
  const sorted = Object.entries(pct).sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0][0];
  const ENV: Record<string, { name: string; tag: string; rec: string[] }> = {
    목: { name: "나무 — 자라남·움직임", tag: "기지개·바람", rec: ["창문 열고 바람 쐬기", "산책·작은 화분 키우기", "아침 햇살 받으며 5분 멍"] },
    화: { name: "불 — 빛·표현", tag: "따뜻한 빛·말", rec: ["주황·노랑 조명으로 분위기 바꾸기", "감정에 이름 붙여 말로 풀기", "함께 노래·춤"] },
    토: { name: "흙 — 안정·품", tag: "포근한 자리", rec: ["식탁에 함께 앉기", "이불·쿠션 푹신한 자리", "규칙적 식사·취침 시간"] },
    금: { name: "쇠 — 단단함·경계", tag: "분명한 선·정리", rec: ["방 정돈·간소화", "짧고 분명한 말로 선 긋기", "조용한 음악(클래식·가을 톤)"] },
    수: { name: "물 — 고요·흐름", tag: "조용한 결", rec: ["조명 낮추기", "목욕·물소리·조용한 책", "혼자 머무는 시간 보장"] },
  };
  const env = ENV[weakest];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 감정이 가라앉는 환경 ─</p>
      <div className="rounded-xl p-3 mb-3" style={{ background: `${ELEM_COLORS[weakest]}10`, border: `1px solid ${ELEM_COLORS[weakest]}40` }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[20px] font-bold" style={{ color: ELEM_COLORS[weakest] }}>{ELEM_HANJA[weakest]}</span>
          <span className="text-[12.5px] font-bold" style={{ color: ELEM_COLORS[weakest] }}>{env.name}</span>
          <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>가장 약함 {Math.round(pct[weakest])}%</span>
        </div>
        <p className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.7)" }}>키워드 → <strong style={{ color: ELEM_COLORS[weakest] }}>{env.tag}</strong></p>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.78)" }}>이 결을 채워줄 환경 3가지:</p>
      <ul className="space-y-1.5">
        {env.rec.map((r, i) => (
          <li key={i} className="rounded-lg px-3 py-2 text-[12px] leading-snug"
            style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${ELEM_COLORS[weakest]}`, color: "rgba(255,255,255,0.85)" }}>
            · {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PraiseCompareCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const insong = counts.인성;
  const siksang = counts.식상;
  const bigeop = counts.비겁;
  const elem = saju.elements as Record<string, number>;
  // 인성 강 → 과정·노력 칭찬, 식상 강 → 결과·표현 칭찬, 비겁 강 → 자기결 인정
  let goodTone = "노력의 과정"; let goodBody = "결과보다 결을 다해 가는 모습을 짚어주실 때 마음이 열립니다";
  let badTone = "결과만 짚는 칭찬"; let badBody = "\"○○해서 잘했어\" 결과만 평가하면 다음에 부담으로 닿습니다";
  if (siksang > insong && siksang > bigeop) {
    goodTone = "표현·창의를 본 칭찬";
    goodBody = "자녀가 만든 것·풀어낸 표현을 구체적으로 짚어주실 때 표현 결이 활짝 펼쳐집니다";
    badTone = "비교·등수 칭찬";
    badBody = "\"○○보다 잘했어\" 다른 자녀와 비교하는 말은 자기 결을 흐리게 만듭니다";
  } else if (bigeop > insong && bigeop > siksang) {
    goodTone = "자기결을 인정하는 칭찬";
    goodBody = "자녀가 스스로 결정한 길을 한 번 더 인정해주실 때 자기 결이 단단해집니다";
    badTone = "지시·강제 톤";
    badBody = "\"이렇게 해야지\" 결정 시점을 앞서가는 손길은 정반대로 작동합니다";
  } else {
    // 인성 우세
    goodTone = "받아들임의 결을 살핀 칭찬";
    goodBody = `인성(印) ${insong}로 깊이 사색하는 자녀 — 자녀의 곱씹음과 노력 과정을 짚어주실 때 마음이 열립니다`;
    badTone = "표면적 결과 평가";
    badBody = "겉으로 드러난 점수·등수만 보면 자녀의 깊이 있는 결이 묻혀버립니다";
  }
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl p-4" style={{ background: "rgba(125,211,192,0.08)", border: "1px solid rgba(125,211,192,0.4)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#7dd3c0", fontSize: 16 }}>✦</span>
          <p className="text-[13px] font-bold" style={{ color: "#7dd3c0" }}>마음 열리는 칭찬</p>
        </div>
        <p className="text-[13px] font-bold mb-1.5" style={{ color: GOLD }}>{goodTone}</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{goodBody}</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.35)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#ff8a8a", fontSize: 16 }}>⚠</span>
          <p className="text-[13px] font-bold" style={{ color: "#ff8a8a" }}>마음 닫히는 톤</p>
        </div>
        <p className="text-[13px] font-bold mb-1.5" style={{ color: "#ff8a8a" }}>{badTone}</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{badBody}</p>
      </div>
      <div className="text-center text-[10.5px] mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
        근거 → 인성 {insong} · 식상 {siksang} · 비겁 {bigeop}
      </div>
    </div>
  );
}

function LieResponseCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const gwansong = counts.관성;
  const ilgan = saju.ilgan;
  const STEM_TONE: Record<string, { kind: string; voice: string }> = {
    갑: { kind: "곧은 결의 자녀", voice: "정면으로 \"무엇이 진짜였니\" 한 번 짧게" },
    을: { kind: "유연한 결의 자녀", voice: "비난 없이 \"왜 그렇게 됐는지\" 차분히" },
    병: { kind: "환한 결의 자녀", voice: "감정에 먼저 닿아 \"많이 힘들었구나\" 한 번" },
    정: { kind: "다정한 결의 자녀", voice: "조용히 곁에서 \"지금 마음은 어때\"" },
    무: { kind: "묵직한 결의 자녀", voice: "기다림 위에 \"천천히 말해도 돼\"" },
    기: { kind: "너른 결의 자녀", voice: "포근한 자리에서 \"숨 한 번 쉬고 들려줘\"" },
    경: { kind: "단단한 결의 자녀", voice: "분명한 선과 짧은 말 \"무엇이 진짜인지 한 번만\"" },
    신: { kind: "맑은 결의 자녀", voice: "차분한 톤으로 \"진짜 마음을 지키자\"" },
    임: { kind: "넉넉한 결의 자녀", voice: "긴 호흡으로 \"천천히 모두 들을게\"" },
    계: { kind: "섬세한 결의 자녀", voice: "낮은 톤으로 \"숨기지 않아도 돼\"" },
  };
  const tone = STEM_TONE[ilgan] ?? STEM_TONE.갑;
  const restraintLevel = gwansong >= 3 ? "강" : gwansong >= 1.5 ? "중" : "약";
  const restraintTip = gwansong >= 3
    ? "관성(절제)이 강한 자녀라 거짓말 자체에 죄책감이 큽니다 — 길게 다그치면 안으로 더 닫힙니다"
    : gwansong >= 1.5
      ? "관성이 적당해 짧은 한 마디면 충분히 닿습니다 — 결을 짚되 길게 끌지 마세요"
      : "관성(절제 회로)이 약해 거짓말이 즉흥에서 나오는 결입니다 — 결과보다 진실을 말한 용기를 짚어주세요";
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl p-4" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.35)" }}>
        <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-2" style={{ color: "#c89cff" }}>─ 일주에서 본 자녀 결 ─</p>
        <p className="text-[13px] font-bold text-center mb-1" style={{ color: GOLD }}>{tone.kind} ({ilgan})</p>
        <p className="text-[12.5px] leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.85)" }}>다가가실 때 → <strong style={{ color: "#c89cff" }}>{tone.voice}</strong></p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(126,182,255,0.08)", border: "1px solid rgba(126,182,255,0.35)" }}>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-[13px] font-bold" style={{ color: "#7eb6ff" }}>관성(절제 회로)</p>
          <span className="text-[11px]" style={{ color: "#7eb6ff" }}>{gwansong} · {restraintLevel}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{restraintTip}</p>
      </div>
    </div>
  );
}

function BreakdownTriggerCard({ saju }: { saju: SajuAnalysis }) {
  let g: GisinResult | null = null;
  try { g = calcGisin(saju); } catch { g = null; }
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.35)" }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: "#ff8a8a" }}>─ 무너지는 자극 (기신 忌神) ─</p>
      {g ? (
        <>
          <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)" }}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[11px]" style={{ color: "#ff8a8a" }}>기신</span>
              <span className="text-[20px] font-bold" style={{ color: "#ff8a8a" }}>{g.element} ({g.hanja})</span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{g.caution}</p>
          </div>
          {g.avoid.length > 0 && (
            <>
              <p className="text-[11.5px] mb-2 font-bold" style={{ color: "#ff8a8a" }}>피하는 게 좋은 자극</p>
              <ul className="space-y-1.5">
                {g.avoid.map((a, i) => (
                  <li key={i} className="rounded-lg px-3 py-2 text-[12px] leading-snug"
                    style={{ background: "rgba(255,255,255,0.03)", borderLeft: "3px solid #ef4444", color: "rgba(255,255,255,0.85)" }}>
                    · {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.55)" }}>용신 정보가 없어 기신을 산출할 수 없습니다.</p>
      )}
    </div>
  );
}

// ─── STEP 5 — 5장(친구 사이) 시각 컴포넌트 ──────────────────────────────────
function HeartDoorCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const insong = counts.인성;
  const siksang = counts.식상;
  const bigeop = counts.비겁;
  const elem = saju.elements as Record<string, number>;
  // 마음 문 여는 시간 = 인성·수 강하면 천천히, 식상·화 강하면 빠르게
  const slow = insong * 1.2 + (elem.수 ?? 0) * 0.5;
  const fast = siksang * 1.2 + (elem.화 ?? 0) * 0.5 + bigeop * 0.5;
  const total = slow + fast + 0.5;
  const slowPct = Math.max(15, Math.min(85, ((slow + 0.3) / total) * 100));
  const tone = slowPct >= 60
    ? `천천히 — 첫 만남에선 살피며 거리를 지키는 결. 한 번 마음을 열면 깊고 오래 갑니다.`
    : slowPct <= 40
      ? `빠르게 — 새로운 친구에게 먼저 다가가는 결. 친해지는 데 시간이 짧습니다.`
      : `중간 속도 — 상대 결을 보며 자기 페이스로 다가가는 자녀입니다.`;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 마음 문 여는 시간 ─</p>
      <DualGauge
        leftLabel="천천히" leftPct={slowPct} leftColor="#7eb6ff"
        rightLabel="빠르게" rightColor="#ff9d6b"
        hint={tone}
      />
      <div className="text-center text-[10.5px] mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
        근거 → 인성 {insong} · 식상 {siksang} · 비겁 {bigeop}
      </div>
    </div>
  );
}

function FriendStyleQuadrant({ fs }: { fs: FriendStyle }) {
  const SIZE = 240;
  const PAD = 30;
  const inner = SIZE - PAD * 2;
  const cx = PAD + (fs.x + 1) / 2 * inner;
  const cy = PAD + (1 - fs.y) / 2 * inner;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구 사이 결의 자리 ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 30} viewBox={`0 0 ${SIZE} ${SIZE + 30}`}>
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(245,185,66,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(126,182,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(125,211,192,0.06)" />
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ff9d6b">적극</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#7eb6ff">관찰</text>
          <text x={PAD - 4} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#f5b942">이끄는</text>
          <text x={SIZE - PAD + 4} y={SIZE / 2 + 4} textAnchor="start" fontSize="13" fontWeight="bold" fill="#7dd3c0">함께</text>
          <circle cx={cx} cy={cy} r="11" fill={ACCENT} stroke={GOLD} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={`${ACCENT}55`} strokeWidth="1.5">
            <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="text-center mt-2 space-y-1.5">
        <span className="inline-block px-3 py-1 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: `${ACCENT}22`, color: GOLD, border: `1px solid ${ACCENT}66` }}>
          {fs.dominant}
        </span>
        <p className="text-[12px] leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.78)" }}>{fs.subtitle}</p>
        <p className="text-[11.5px] leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.65)" }}>{fs.desc}</p>
        <pre className="text-[10.5px] mt-1 leading-snug whitespace-pre-wrap font-sans" style={{ color: `${ACCENT}99` }}>{fs.basis}</pre>
      </div>
    </div>
  );
}

function LifeFriendSinsalCard({ reading }: { reading: PositiveSinsalReading }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 인생을 바꿀 친구 (귀인 신살) ─</p>
      {reading.hasAny ? (
        <div className="space-y-2.5">
          {reading.shines.map((s) => (
            <div key={s.name} className="rounded-xl p-3"
              style={{ background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.4)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span style={{ color: GOLD, fontSize: 14 }}>★</span>
                <span className="text-[13.5px] font-bold" style={{ color: GOLD }}>{s.name}</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{s.meaning}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-center px-3" style={{ color: "rgba(255,255,255,0.78)" }}>
          {reading.fallback}
        </p>
      )}
    </div>
  );
}

function FriendShiftTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#fbbf24", good: "#7dd3c0", normal: "#94a3b8", caution: "#ef4444",
  };
  const LABEL: Record<DaeunHighlight["rating"], string> = {
    gold: "빛나는", good: "좋은", normal: "보통", caution: "주의",
  };
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구 결이 바뀌는 시기 (대운) ─</p>
      <div className="grid grid-cols-4 gap-1.5">
        {list.slice(0, 8).map((d) => (
          <div key={d.age} className="rounded-lg p-2 text-center"
            style={{ background: `${COLOR[d.rating]}15`, border: `1px solid ${COLOR[d.rating]}50` }}>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{d.age}–{d.ageEnd}세</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: COLOR[d.rating] }}>{d.ganji}</div>
            <div className="text-[9px] mt-1" style={{ color: COLOR[d.rating] }}>{LABEL[d.rating]}</div>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        <strong style={{ color: COLOR.gold }}>★ 빛나는</strong> 시기에 자녀의 친구 결이 한 번 크게 바뀝니다 — 그 결이 평생 인연이 되기 쉬운 시기입니다.
      </p>
    </div>
  );
}

function FatiguePatternCard({ saju }: { saju: SajuAnalysis }) {
  const dms = (() => {
    try {
      return getDayMasterStrength(
        saju.ilgan,
        saju.pillars.month.branch,
        [
          saju.pillars.year.branch,
          saju.pillars.month.branch,
          saju.pillars.day.branch,
          ...(saju.pillars.hour ? [saju.pillars.hour.branch] : []),
        ],
        [
          saju.pillars.year.stem,
          saju.pillars.month.stem,
          ...(saju.pillars.hour ? [saju.pillars.hour.stem] : []),
        ],
      );
    } catch { return null; }
  })();
  const PATTERN: Record<string, { tag: string; pattern: string; recovery: string; color: string }> = {
    극왕: { tag: "넘치는 결", pattern: "기운이 넘쳐 끝까지 밀어붙이다 한 번에 무너지는 결", recovery: "고요한 자리·물·혼자 시간으로 결이 가라앉음", color: "#ef4444" },
    태강: { tag: "강한 결", pattern: "오래 끌고 가다 갑자기 지치는 결", recovery: "혼자 차 한 잔·산책으로 회복", color: "#f97316" },
    신강: { tag: "단단한 결", pattern: "친구를 이끌다 무거운 짐을 떠안고 지치는 결", recovery: "혼자 사색하는 시간으로 결이 회복", color: "#fbbf24" },
    중화: { tag: "균형의 결", pattern: "친구·자기 시간을 번갈아 가는 결 — 잘 지치지 않음", recovery: "평소 호흡 그대로가 회복", color: "#7dd3c0" },
    신약: { tag: "섬세한 결", pattern: "사람과의 결을 깊이 흡수해 짧은 시간에도 지치는 결", recovery: "조용한 자리·다정한 한 사람과의 시간으로 회복", color: "#a78bfa" },
    태약: { tag: "여린 결", pattern: "친구 결의 영향을 깊이 받아 자주 지치는 결", recovery: "안전한 가족 자리·짧은 휴식으로 결이 충전", color: "#c89cff" },
    극약: { tag: "고요한 결", pattern: "사람의 결을 매우 깊이 흡수해 빠르게 지치는 결", recovery: "혼자 머무는 자리·따뜻한 음식·푹 자기로 회복", color: "#7eb6ff" },
  };
  const level = dms?.level ?? "중화";
  const p = PATTERN[level] ?? PATTERN.중화;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구들 속에서 지치는 패턴 ─</p>
      <div className="rounded-xl p-3 mb-3" style={{ background: `${p.color}10`, border: `1px solid ${p.color}40` }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[11px]" style={{ color: p.color }}>신강·신약</span>
          <span className="text-[16px] font-bold" style={{ color: p.color }}>{level} — {p.tag}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{p.pattern}</p>
      </div>
      <div className="rounded-xl p-3" style={{ background: "rgba(125,211,192,0.06)", border: "1px solid rgba(125,211,192,0.3)" }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[11px]" style={{ color: "#7dd3c0" }}>회복 결</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{p.recovery}</p>
      </div>
    </div>
  );
}

// ─── STEP 6 — 6장(빛날) 시각 컴포넌트 ───────────────────────────────────────
function JobRadarCard({ items }: { items: JobRadarItem[] }) {
  const SIZE = 290;
  const cx = SIZE / 2, cy = SIZE / 2 + 4, R = 85;
  const angs = items.map((_, i) => ((i * 60 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [cx + R * s * Math.cos(angs[i]), cy + R * s * Math.sin(angs[i])];
  const gridPts = (s: number) => items.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = items.map((it, i) => {
    const s = Math.max(0.05, it.score / 100);
    return pt(i, s).join(",");
  }).join(" ");
  const top = [...items].sort((a, b) => b.score - a.score)[0];
  const LO = 1.3;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-2" style={{ color: ACCENT }}>─ 진짜 빛날 분야 ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 20} viewBox={`0 0 ${SIZE} ${SIZE + 20}`}>
          {[0.25, 0.5, 0.75, 1.0].map((s, gi) => (
            <polygon key={gi} points={gridPts(s)} fill="none"
              stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
              strokeWidth={s === 1.0 ? 1.2 : 0.8} />
          ))}
          {items.map((_, i) => {
            const [x, y] = pt(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
          })}
          <polygon points={dataPts} fill={`${ACCENT}30`} stroke={ACCENT} strokeWidth="2.2" strokeLinejoin="round" />
          {items.map((it, i) => {
            const [lx, ly] = pt(i, LO);
            const isTop = it.name === top?.name;
            const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
            return (
              <g key={i}>
                <text x={lx} y={ly - 4} textAnchor={anchor} fontSize="12" fontWeight={isTop ? "bold" : "normal"} fill={isTop ? GOLD : "rgba(255,255,255,0.85)"}>{it.shortName}</text>
                <text x={lx} y={ly + 10} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.55)">{it.score}%</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 rounded-xl p-3" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}40` }}>
        <p className="text-[11px]" style={{ color: GOLD }}>가장 빛나는 결</p>
        <p className="text-[14px] font-bold mt-0.5" style={{ color: GOLD }}>{top?.name}</p>
        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{top?.desc}</p>
      </div>
    </div>
  );
}

function WeaponCard({ saju, dom }: { saju: SajuAnalysis; dom: DominantMeaning }) {
  const ilju = (() => { try { return getIljuInfo(saju); } catch { return null; } })();
  const HUE = ELEM_COLORS[dom.element] ?? GOLD;
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl p-4 text-center" style={{ background: `${HUE}10`, border: `1px solid ${HUE}40` }}>
        <p className="text-[11px]" style={{ color: HUE }}>{dom.title}</p>
        <p className="text-[28px] font-bold mt-1" style={{ color: HUE }}>{dom.element} ({dom.hanja})</p>
        <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: "rgba(255,255,255,0.88)" }}>{dom.meaning}</p>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${HUE}30` }}>
          <p className="text-[11px] mb-1" style={{ color: HUE }}>자녀의 무기로 작용하는 이유</p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{dom.asset}</p>
        </div>
      </div>
      {ilju && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.3)" }}>
          <p className="text-[11px] text-center mb-2" style={{ color: "#c89cff" }}>일주(日柱)에 새겨진 자녀의 핵</p>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-[28px] font-bold leading-none" style={{ color: "#c89cff" }}>{ilju.hanja}</div>
              <p className="text-[10px] mt-1.5" style={{ color: "#c89cffcc" }}>{ilju.fusion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShineKeyCard({ saju }: { saju: SajuAnalysis }) {
  let m: ReturnType<typeof inferYongsinMeaning> | null = null;
  try { m = inferYongsinMeaning(saju); } catch { m = null; }
  if (!m) {
    return (
      <div className="rounded-xl p-3 text-[12px]" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}22`, color: `${ACCENT}99` }}>
        용신 정보 분석 중…
      </div>
    );
  }
  const HUE = ELEM_COLORS[m.element ?? "토"] ?? "#7eda7e";
  return (
    <div className="rounded-2xl p-4" style={{ background: `${HUE}10`, border: `1px solid ${HUE}40` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: HUE }}>─ 환하게 빛나게 해주는 결 한 가지 ─</p>
      <div className="text-center mb-3">
        <p className="text-[11px]" style={{ color: HUE }}>용신(用神) — 자녀를 살리는 결</p>
        <p className="text-[28px] font-bold mt-1" style={{ color: HUE }}>{m.element} ({m.hanja})</p>
      </div>
      <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>{m.meaning}</p>
      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${HUE}` }}>
        <p className="text-[10.5px] mb-1" style={{ color: HUE }}>두 분이 자녀를 빛나게 해주실 길</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>{m.guidance}</p>
      </div>
    </div>
  );
}

function ShineAgeTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#fbbf24", good: "#7dd3c0", normal: "#94a3b8", caution: "#94a3b8",
  };
  // 10대(8-17)·20대(18-27)·30대(28-37) 매핑
  const ageGroups = [
    { label: "10대", from: 8, to: 17 },
    { label: "20대", from: 18, to: 27 },
    { label: "30대", from: 28, to: 37 },
    { label: "40대 이후", from: 38, to: 99 },
  ];
  const groupBest = ageGroups.map((g) => {
    const inRange = list.filter((d) => d.age <= g.to && d.ageEnd >= g.from);
    const golds = inRange.filter((d) => d.rating === "gold");
    const goods = inRange.filter((d) => d.rating === "good");
    const best = golds[0] ?? goods[0] ?? inRange[0] ?? null;
    return { ...g, best, hasGold: golds.length > 0, hasGood: goods.length > 0 };
  });
  const topGroup = [...groupBest].sort((a, b) => Number(b.hasGold) - Number(a.hasGold) || Number(b.hasGood) - Number(a.hasGood))[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 10·20·30대 어느 때 빛날까 ─</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {groupBest.map((g) => {
          const hue = g.hasGold ? COLOR.gold : g.hasGood ? COLOR.good : COLOR.normal;
          return (
            <div key={g.label} className="rounded-lg p-2 text-center" style={{ background: `${hue}15`, border: `1px solid ${hue}50` }}>
              <div className="text-[11px] font-bold" style={{ color: hue }}>{g.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{g.from}–{g.to === 99 ? "" : g.to}세</div>
              <div className="text-[14px] font-bold mt-1" style={{ color: hue }}>{g.hasGold ? "★" : g.hasGood ? "✦" : "·"}</div>
              {g.best && <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{g.best.ganji}</div>}
            </div>
          );
        })}
      </div>
      <p className="text-[11.5px] leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        가장 환히 빛날 시기 → <strong style={{ color: topGroup.hasGold ? COLOR.gold : COLOR.good }}>{topGroup.label}</strong>
        {topGroup.best ? ` (${topGroup.best.age}세부터 ${topGroup.best.ganji} 대운)` : ""}
        에 자녀의 결이 활짝 펼쳐집니다.
      </p>
    </div>
  );
}

function LeaderExpertCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const gwansong = counts.관성;
  const insong = counts.인성;
  const bigeop = counts.비겁;
  const elem = saju.elements as Record<string, number>;
  // 리더(관성+비겁+양일간) vs 전문가(인성+수)
  const isYang = ["갑", "병", "무", "경", "임"].includes(saju.ilgan);
  const leader = gwansong * 1.2 + bigeop * 1.0 + (isYang ? 1.5 : 0) + (elem.화 ?? 0) * 0.3;
  const expert = insong * 1.5 + (elem.수 ?? 0) * 0.5 + (elem.금 ?? 0) * 0.3;
  const total = leader + expert + 0.5;
  const leaderPct = Math.max(15, Math.min(85, ((leader + 0.3) / total) * 100));
  const dominant = leaderPct >= 60 ? "리더형" : leaderPct <= 40 ? "전문가형" : "균형형";
  const hint = dominant === "리더형"
    ? `관성(官) ${gwansong} · 비겁(比劫) ${bigeop} — 사람을 끌고 방향을 세우는 자리에서 자녀의 결이 활짝 펼쳐집니다.`
    : dominant === "전문가형"
      ? `인성(印) ${insong} — 한 분야를 깊이 파고드는 자리에서 자녀의 결이 단단해집니다.`
      : `관성 ${gwansong} · 인성 ${insong} — 이끌면서도 깊이를 가진 자녀 — 두 길을 번갈아 가며 결이 자라납니다.`;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 리더 vs 전문가 ─</p>
      <DualGauge
        leftLabel="리더형" leftPct={leaderPct} leftColor="#fbbf24"
        rightLabel="전문가형" rightColor="#c89cff"
        hint={hint}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="rounded-lg p-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#fbbf24" }}>리더형 키</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>방향·결단·사람 끌기</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#c89cff" }}>전문가형 키</div>
          <div style={{ color: "rgba(255,255,255,0.75)" }}>탐구·깊이·정밀함</div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 7 — 7장(셋의 결) 시각 컴포넌트 ────────────────────────────────────
function IlganRelationCard({ rel, parentLabel, parentColor }: { rel: IlganRelation; parentLabel: string; parentColor: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: `${rel.color}10`, border: `1px solid ${rel.color}40` }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-center flex-1">
          <div className="text-[10px]" style={{ color: parentColor }}>{parentLabel}</div>
          <div className="text-[20px] font-bold mt-0.5" style={{ color: parentColor }}>{rel.parentHanja}</div>
          <div className="text-[10px] mt-0.5" style={{ color: `${parentColor}cc` }}>{rel.parentKor}</div>
        </div>
        <div className="text-center" style={{ color: rel.color }}>
          <div className="text-[20px]">{rel.emoji}</div>
          <div className="text-[10px] mt-0.5">{rel.direction}</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-[10px]" style={{ color: GOLD }}>자녀</div>
          <div className="text-[20px] font-bold mt-0.5" style={{ color: GOLD }}>{rel.childHanja}</div>
          <div className="text-[10px] mt-0.5" style={{ color: `${GOLD}cc` }}>{rel.childKor}</div>
        </div>
      </div>
      <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
        <p className="text-[11.5px] font-bold mb-1" style={{ color: rel.color }}>{rel.label}</p>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{rel.detail}</p>
      </div>
    </div>
  );
}

function FamilyIlganRelations({ meta }: { meta: MetaEvent }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: ACCENT }}>─ 일간으로 본 셋의 결 ─</p>
      {meta.hasMom && meta.sajuMom && (
        <IlganRelationCard
          rel={inferIlganRelation(meta.sajuMom, meta.sajuChild, "엄마")}
          parentLabel="엄마"
          parentColor={ACCENT}
        />
      )}
      {meta.hasDad && meta.sajuDad && (
        <IlganRelationCard
          rel={inferIlganRelation(meta.sajuDad, meta.sajuChild, "아빠")}
          parentLabel="아빠"
          parentColor="#7eb6ff"
        />
      )}
      {!meta.hasMom && !meta.hasDad && (
        <p className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.55)" }}>부모 정보가 입력되지 않았습니다.</p>
      )}
    </div>
  );
}

function TrioRadar({ child, mom, dad }: { child: Record<string, number>; mom?: Record<string, number> | null; dad?: Record<string, number> | null }) {
  const ELEM_ORDER = ["목", "화", "토", "금", "수"];
  const norm = (e: Record<string, number>) => {
    const total = ELEM_ORDER.reduce((s, k) => s + (e[k] ?? 0), 0) || 1;
    const r: Record<string, number> = {};
    ELEM_ORDER.forEach((k) => { r[k] = ((e[k] ?? 0) / total) * 100; });
    return r;
  };
  const cN = norm(child);
  const mN = mom ? norm(mom) : null;
  const dN = dad ? norm(dad) : null;
  const cx = 170, cy = 175, R = 75;
  const angs = ELEM_ORDER.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [cx + R * s * Math.cos(angs[i]), cy + R * s * Math.sin(angs[i])];
  const gridPts = (s: number) => ELEM_ORDER.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = (n: Record<string, number>) => ELEM_ORDER.map((el, i) => {
    const raw = (n[el] || 0) / 50;
    const s = Math.min(1.0, Math.max(0, raw));
    return pt(i, s).join(",");
  }).join(" ");
  const LO = 1.5;
  return (
    <svg width="340" height="320" viewBox="0 0 340 320">
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
        <polygon key={gi} points={gridPts(s)} fill="none"
          stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
          strokeWidth={s === 1.0 ? 1.2 : 0.8} />
      ))}
      {ELEM_ORDER.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
      })}
      {mN && <polygon points={dataPts(mN)} fill={`${ACCENT}25`} stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" strokeDasharray="3,3" />}
      {dN && <polygon points={dataPts(dN)} fill="rgba(126,182,255,0.20)" stroke="#7eb6ff" strokeWidth="1.8" strokeLinejoin="round" strokeDasharray="3,3" />}
      <polygon points={dataPts(cN)} fill={`${GOLD}30`} stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
      {ELEM_ORDER.map((el, i) => {
        const [lx, ly] = pt(i, LO);
        const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
        return (
          <g key={i}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize="20" fontWeight="bold" fill={ELEM_COLORS[el]}>{ELEM_HANJA[el]}</text>
            <text x={lx} y={ly + 12} textAnchor={anchor} fontSize="10" fill="rgba(255,255,255,0.55)">{ELEM_DESC[el]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TrioRadarCard({ meta }: { meta: MetaEvent }) {
  const cmpMom = meta.hasMom && meta.sajuMom ? inferElementCompare(meta.sajuMom, meta.sajuChild) : null;
  const cmpDad = meta.hasDad && meta.sajuDad ? inferElementCompare(meta.sajuDad, meta.sajuChild) : null;
  const cmp: ElementCompare | null = cmpMom ?? cmpDad;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 셋이 함께 편안한 순간 (오행 3겹) ─</p>
      <div className="flex justify-center">
        <TrioRadar
          child={meta.sajuChild.elements as Record<string, number>}
          mom={meta.hasMom && meta.sajuMom ? (meta.sajuMom.elements as Record<string, number>) : null}
          dad={meta.hasDad && meta.sajuDad ? (meta.sajuDad.elements as Record<string, number>) : null}
        />
      </div>
      <div className="flex justify-center gap-4 mt-1 text-[11px]">
        <span style={{ color: GOLD }}>━ 자녀</span>
        {meta.hasMom && <span style={{ color: ACCENT }}>┄┄ 엄마</span>}
        {meta.hasDad && <span style={{ color: "#7eb6ff" }}>┄┄ 아빠</span>}
      </div>
      {cmp && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: "rgba(125,211,192,0.08)", border: "1px solid rgba(125,211,192,0.3)" }}>
            <div className="text-[10px]" style={{ color: "#7dd3c0" }}>가장 닮은 결</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: "#7dd3c0" }}>{cmp.similar.emoji} {cmp.similar.kor}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>평균 {cmp.similar.avgPct}%</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.3)" }}>
            <div className="text-[10px]" style={{ color: "#fb923c" }}>가장 다른 결</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: "#fb923c" }}>{cmp.different.emoji} {cmp.different.kor}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{cmp.different.parentPct}% vs {cmp.different.childPct}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlowFillCard({ meta }: { meta: MetaEvent }) {
  const child = meta.sajuChild;
  const mom = meta.hasMom ? meta.sajuMom : null;
  const dad = meta.hasDad ? meta.sajuDad : null;
  const flowMom = mom ? inferFlowGiven(mom, child, dad) : null;
  const flowDad = dad ? inferFlowGiven(dad, child, mom) : null;
  let g: GisinResult | null = null;
  try { g = calcGisin(child); } catch { g = null; }
  let y: ReturnType<typeof inferYongsinMeaning> | null = null;
  try { y = inferYongsinMeaning(child); } catch { y = null; }
  return (
    <div className="space-y-2.5">
      {y && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(126,218,126,0.08)", border: "1px solid rgba(126,218,126,0.3)" }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: "#7eda7e" }}>채워줄 결 (用神) — {y.element} ({y.hanja})</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{y.guidance}</p>
        </div>
      )}
      {flowMom && (
        <div className="rounded-2xl p-3" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}40` }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: ACCENT }}>엄마가 채워주는 결</p>
          {flowMom.parentGives.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {flowMom.parentGives.map((pg) => (
                <span key={pg.elem} className="px-2 py-1 rounded-full text-[11px]" style={{ background: `${ELEM_COLORS[pg.elem]}20`, color: ELEM_COLORS[pg.elem], border: `1px solid ${ELEM_COLORS[pg.elem]}50` }}>
                  {pg.emoji} {pg.kor} +{pg.intensity}%
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>두 결의 흐름이 비슷해 채워주기보단 같은 결을 함께 가는 사이입니다.</p>
          )}
        </div>
      )}
      {flowDad && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(126,182,255,0.10)", border: "1px solid rgba(126,182,255,0.4)" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: "#7eb6ff" }}>아빠가 채워주는 결</p>
          {flowDad.parentGives.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {flowDad.parentGives.map((pg) => (
                <span key={pg.elem} className="px-2 py-1 rounded-full text-[11px]" style={{ background: `${ELEM_COLORS[pg.elem]}20`, color: ELEM_COLORS[pg.elem], border: `1px solid ${ELEM_COLORS[pg.elem]}50` }}>
                  {pg.emoji} {pg.kor} +{pg.intensity}%
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.6)" }}>두 결의 흐름이 비슷해 채워주기보단 같은 결을 함께 가는 사이입니다.</p>
          )}
        </div>
      )}
      {flowMom?.overlapLabel && (
        <div className="rounded-lg px-3 py-2 text-[11.5px]" style={{ background: "rgba(251,191,36,0.08)", borderLeft: "3px solid #fbbf24", color: "rgba(255,255,255,0.85)" }}>
          ✦ {flowMom.overlapLabel}
        </div>
      )}
      {(flowMom?.bothLack && flowMom.bothLack.length > 0) && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-[12px] font-bold mb-1.5" style={{ color: "#ff8a8a" }}>두 분과 자녀 모두 약한 결 — 외부 자원으로 채울 결</p>
          <div className="flex flex-wrap gap-1.5">
            {flowMom.bothLack.map((b) => (
              <span key={b.elem} className="px-2 py-1 rounded-full text-[11px]" style={{ background: `${ELEM_COLORS[b.elem]}15`, color: ELEM_COLORS[b.elem], border: `1px solid ${ELEM_COLORS[b.elem]}40` }}>
                {b.emoji} {b.kor}
              </span>
            ))}
          </div>
        </div>
      )}
      {g && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.35)" }}>
          <p className="text-[12px] font-bold mb-1" style={{ color: "#ff8a8a" }}>살펴줄 결 (忌神) — {g.element} ({g.hanja})</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{g.caution}</p>
        </div>
      )}
    </div>
  );
}

function ExternalBoostCard({ saju }: { saju: SajuAnalysis }) {
  const reading = inferPositiveSinsal(saju);
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 부모 외 인생에 큰 힘이 되어줄 어른 ─</p>
      <p className="text-[11.5px] leading-relaxed text-center mb-3 px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
        부모 외에도 자녀의 결을 단단하게 받쳐줄 외부 어른의 결입니다.
      </p>
      {reading.hasAny ? (
        <div className="space-y-2">
          {reading.shines.map((s) => (
            <div key={s.name} className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.4)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span style={{ color: GOLD, fontSize: 14 }}>★</span>
                <span className="text-[13px] font-bold" style={{ color: GOLD }}>{s.name}</span>
              </div>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{s.meaning}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-center px-3" style={{ color: "rgba(255,255,255,0.78)" }}>{reading.fallback}</p>
      )}
      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${ACCENT}` }}>
        <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
          학교 선생님 · 동네 어른 · 친척 중 자녀와 결이 잘 통하는 분이 있다면, 그 인연이 자녀의 평생 자산이 됩니다. 부모는 그 길을 막지 않고 열어주실 때 자녀의 결이 가장 풍부해집니다.
        </p>
      </div>
    </div>
  );
}

function BondAgeTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#fbbf24", good: "#7dd3c0", normal: "#94a3b8", caution: "#ef4444",
  };
  // 부모-자녀 결이 가장 통하는 시기 = good/gold 대운, 단 0~30세 안 (부모 양육 활성기)
  const bondCandidates = list.filter((d) => d.age <= 30 && (d.rating === "gold" || d.rating === "good"));
  const top = bondCandidates[0] ?? list[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 부모와 마음이 가장 통하는 나이 ─</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {list.slice(0, 4).map((d) => (
          <div key={d.age} className="rounded-lg p-2 text-center"
            style={{ background: `${COLOR[d.rating]}15`, border: `1px solid ${COLOR[d.rating]}50` }}>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{d.age}–{d.ageEnd}세</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: COLOR[d.rating] }}>{d.ganji}</div>
            <div className="text-[9px] mt-1" style={{ color: COLOR[d.rating] }}>
              {d.rating === "gold" ? "★ 빛남" : d.rating === "good" ? "✦ 좋음" : d.rating === "caution" ? "주의" : "보통"}
            </div>
          </div>
        ))}
      </div>
      {top && (
        <div className="rounded-lg p-3" style={{ background: `${COLOR[top.rating]}10`, borderLeft: `3px solid ${COLOR[top.rating]}` }}>
          <p className="text-[11px]" style={{ color: COLOR[top.rating] }}>가장 통하는 시기</p>
          <p className="text-[14px] font-bold mt-0.5" style={{ color: COLOR[top.rating] }}>{top.age}–{top.ageEnd}세 ({top.ganji} 대운)</p>
          <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
            이 시기에 자녀가 부모 결을 가장 따뜻하게 받아들입니다 — 결정·진로·관계 이야기를 깊이 나누기 좋은 때입니다.
          </p>
        </div>
      )}
    </div>
  );
}

function OutroCard({ childName, honorific }: { childName: string; honorific: string }) {
  const childLabel = `${childName}${honorific}`;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}1a, rgba(255,215,0,0.08))`, border: `1px solid ${ACCENT}40` }}>
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-[22px] font-bold mb-3"
          style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}66` }}>慈</div>
        <p className="text-[13px] font-bold mb-2" style={{ color: GOLD }}>자도인(慈道人)의 마지막 당부</p>
        <p className="text-[12.5px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.88)" }}>
          어머님, 아버님 — <strong style={{ color: GOLD }}>{childLabel}</strong>의 사주를 함께 들여다봐주셔서 감사합니다.
        </p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}22` }}>
        <p className="text-[12.5px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.85)" }}>
          이 풀이는 자녀를 <strong style={{ color: GOLD }}>틀에 가두기 위한 지도</strong>가 아닙니다.<br />
          오히려 자녀 안에 이미 있는 결을 두 분이 더 잘 알아봐주시고, 자녀의 호흡에 맞춰 다가가시기 위한 <strong style={{ color: GOLD }}>가이드</strong>입니다.
        </p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(125,211,192,0.08)", border: "1px solid rgba(125,211,192,0.3)" }}>
        <p className="text-[11.5px] mb-2 font-bold" style={{ color: "#7dd3c0" }}>기억해주실 세 가지</p>
        <ul className="text-[12px] leading-[1.85] space-y-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
          <li>· 사주는 미래를 점치는 게 아니라, 자녀 안의 결을 읽는 <strong>지도(地圖)</strong>입니다.</li>
          <li>· 강한 결은 본질 그대로, 약한 결은 외부 자원으로 채울 수 있습니다.</li>
          <li>· 두 분이 자녀의 결을 한 박자 늦춰 다가가실 때, 자녀가 자기 호흡으로 자라납니다.</li>
        </ul>
      </div>
      <div className="rounded-2xl p-4 text-center" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}40` }}>
        <p className="text-[12.5px] leading-[1.85] italic" style={{ color: GOLD }}>
          <strong>{childLabel}</strong>의 결이 두 분의 따뜻한 시선 속에서 활짝 펼쳐지길 바랍니다.
        </p>
        <p className="text-[11px] mt-3" style={{ color: `${GOLD}aa` }}>— 자도인 慈道人 —</p>
      </div>
    </div>
  );
}

// (제거됨) ParentCompareCard — 7장 visualKey가 ch7-ilgan-rel(IlganRelationCard 풀카드)로 교체되어 미사용
