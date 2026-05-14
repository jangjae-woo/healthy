"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { STEM_HANJA, BRANCH_HANJA, SINSAL_INFO } from "@/lib/saju-calculator";
import { getSipseongCounts, SIPSEONG_DESC, inferDangerCards, type SipseongCount, type DangerCard } from "@/lib/parent-child-charts-v2";
import { getIljuInfo, inferYongsinMeaning, type IljuInfo } from "@/lib/parent-child-traits-v2";
import PrecisionPillarTable from "@/components/saju-visuals/PrecisionPillarTable";
import OpeningGreeting from "@/components/parent-child-shared/OpeningGreeting";
import OpeningVideo from "@/components/OpeningVideo";
import PaymentModal from "@/components/PaymentModal";

// 부모자녀궁합 소비자가 (다르면 이 값만 수정)
const PARENT_CHILD_PRICE = 32900;
import { ILGAN_METAPHOR } from "@/lib/child-seed";
import { calcGisin, type GisinResult } from "@/lib/saju-traditional";
import { deriveChildKeywords } from "@/components/saju-visuals/KeywordChips";
import { getDayMasterStrength } from "@/lib/saju-calculator";
import { inferThinkingType, type ThinkingType, inferTantrumTriggers, type TantrumTrigger, inferFriendStyle, type FriendStyle, evaluateDaeunTimeline, type DaeunHighlight } from "@/lib/parent-child-charts-v2";
import { inferPositiveSinsal, type PositiveSinsalReading, inferDominantMeaning, type DominantMeaning } from "@/lib/parent-child-traits-v2";
import { inferJobRadar, type JobRadarItem, inferElementCompare, type ElementCompare, inferIlganRelation, type IlganRelation, inferFlowGiven, type FlowGiven } from "@/lib/parent-child-charts-v2";
import { enforceParentVoice, stripAgeInappropriate, stripParentTakeaway } from "@/lib/text-postprocess";
import { classifyAgeStage } from "@/lib/age-stage";
import { renderInlineEmphasis as renderInlineEmphasisShared, renderParagraphs as renderParagraphsShared } from "@/lib/inline-emphasis";

// 홍실 라이트 테마 (2026-05-10) — /love/parent-child 합류
const ACCENT = "#c8203a";    // THREAD 자두 (라이트 액센트)
const GOLD = "#b88646";       // 베이지 골드
const BG = "#fff7f9";         // 핑크 라이트
const BG_END = "#fce4d6";     // 크림

// ─── 7장 슬라이드 명세 (브라덜 요청건 100% 반영) ──────────────────────────────
type SlideKind =
  | "opening"
  | "intro"
  | "scroll-chapter"
  | "card-strength"
  | "card-caution"
  | "text"
  | "parent-compare"
  | "outro";

interface SubSection {
  subtitle: string;      // 소제목
  indicator?: string;    // [인자: ...] 표시
  visualKey?: string;    // 시각 컴포넌트 분기 (없으면 본문만 노출)
}

interface SlideSpec {
  chapter: string;       // "1장" / "2장" / 오프닝·마지막은 라벨
  chapterTitle: string;  // 챕터 제목 (목차용)
  subtitle?: string;     // 소제목 (없으면 챕터 본문 통째)
  indicator?: string;    // [인자: ...] 표시
  kind: SlideKind;
  visualKey?: string;    // 단일 시각 컴포넌트 분기 (scroll-chapter 미사용)
  subs?: SubSection[];   // scroll-chapter일 때 sub 배열
}

const SLIDES: SlideSpec[] = [
  // 오프닝 — 자도인 인사
  { chapter: "오프닝", chapterTitle: "자도인의 인사", kind: "opening" },
  // 1장 — 우리 아이는 어떤 아이일까 (단일 스크롤 IntroSummaryV2)
  { chapter: "1장", chapterTitle: "우리 아이는 어떤 아이일까", kind: "intro" },
  // 2장 — 공부 (5 sub → 1 슬라이드)
  { chapter: "2장", chapterTitle: "우리 아이는 어떻게 공부할까", kind: "scroll-chapter", subs: [
    { subtitle: "혼자 vs 같이", indicator: "비겁", visualKey: "ch3-bigeop" },
    { subtitle: "우리 아이만의 공부법", indicator: "인성", visualKey: "ch3-insong" },
    { subtitle: "글로 정리할까, 말로 표현할까", indicator: "식상", visualKey: "ch3-siksang" },
    { subtitle: "아침·낮·밤 어느 때 가장 또렷할까", indicator: "오행 + 신강/신약", visualKey: "ch3-timeslot" },
    { subtitle: "책상 앞 머릿속", indicator: "관성" },
  ]},
  // 3장 — 칭찬·혼 (5 sub → 1 슬라이드)
  { chapter: "3장", chapterTitle: "우리 아이 칭찬하고 혼내는 법", kind: "scroll-chapter", subs: [
    { subtitle: "화났을 때 입을 닫을까, 폭발할까", indicator: "식상 + 신강/신약", visualKey: "ch4-tantrum" },
    { subtitle: "아이 감정이 가라앉는 환경", indicator: "오행", visualKey: "ch4-calm-env" },
    { subtitle: "마음 열리는 칭찬", indicator: "인성 + 용신", visualKey: "ch4-praise" },
    { subtitle: "거짓말 했을 때", indicator: "일주 + 관성" },
    { subtitle: "이 아이가 무너지는 자극", indicator: "기신", visualKey: "ch4-breakdown" },
  ]},
  // 4장 — 친구 (4 sub → 1 슬라이드, 시각화 모두 숨김)
  { chapter: "4장", chapterTitle: "친구 사이 우리 아이", kind: "scroll-chapter", subs: [
    { subtitle: "마음 문 여는 데 걸리는 시간", indicator: "일주 + 인성" },
    { subtitle: "리더 vs 짝꿍 vs 분위기 메이커", indicator: "비겁 + 식상 + 관성" },
    { subtitle: "인생을 바꿀 친구는 따로 있다", indicator: "귀인 신살" },
    { subtitle: "친구들 속에서 지치는 패턴", indicator: "신강/신약" },
  ]},
  // 5장 — 빛날 (5 sub → 1 슬라이드)
  { chapter: "5장", chapterTitle: "우리 아이는 무엇으로 빛날까", kind: "scroll-chapter", subs: [
    { subtitle: "진짜 빛날 분야", indicator: "식상 + 재성" },
    { subtitle: "아이만의 무기", indicator: "일주", visualKey: "ch6-weapon" },
    { subtitle: "환하게 빛나게 해주는 결 한 가지", indicator: "용신", visualKey: "ch6-shine-key" },
    { subtitle: "10대·20대·30대 어느 때 가장 빛날까", indicator: "대운", visualKey: "ch6-shine-age" },
    { subtitle: "리더로 클까, 깊이 있는 전문가로 클까", indicator: "관성 + 인성", visualKey: "ch6-leader-expert" },
  ]},
  // 6장 — 셋의 결 (3 sub → 1 슬라이드)
  { chapter: "6장", chapterTitle: "엄마아빠와 우리 셋의 결", kind: "scroll-chapter", subs: [
    { subtitle: "엄마와 통하는 결, 아빠와 통하는 결", indicator: "인성 + 관성 + 일주", visualKey: "ch7-ilgan-rel" },
    { subtitle: "셋이 함께 가장 편안한 순간", indicator: "오행", visualKey: "ch7-trio-radar" },
    { subtitle: "부모가 채워줄 결 / 살펴줄 결", indicator: "용신 + 기신", visualKey: "ch7-flow" },
  ]},
  // ⭐ V2.1 (2026-05-15) — 7장 신설: 몸 그리고 채워줄 한 그릇 (sub 2)
  { chapter: "7장", chapterTitle: "우리 아이 몸 그리고 채워줄 한 그릇", kind: "scroll-chapter", subs: [
    { subtitle: "이 아이가 약하게 타고난 자리", indicator: "약한 오행" },
    { subtitle: "사주에 채워주면 좋은 음식", indicator: "용신 + 한국 식재료" },
  ]},
  // 마지막 당부
  { chapter: "마지막", chapterTitle: "자도인의 마지막 당부", kind: "outro" },
];

// 부모 입력 여부에 따라 6장 제목·sub 동적 분기
function slidesForMeta(hasMom: boolean, hasDad: boolean): SlideSpec[] {
  const ch6Title = "엄마아빠와 우리 셋의 결";
  const firstSubTitle = hasMom && hasDad
    ? "엄마와 통하는 결, 아빠와 통하는 결"
    : hasMom
      ? "엄마와 통하는 결"
      : hasDad
        ? "아빠와 통하는 결"
        : "엄마와 통하는 결, 아빠와 통하는 결";
  const trioMomentTitle = hasMom && hasDad ? "셋이 함께 가장 편안한 순간" : "둘이 함께 가장 편안한 순간";
  return SLIDES.map((s) => {
    if (s.chapter !== "6장") return s;
    const newSubs = (s.subs ?? []).map((sub, i) => {
      if (i === 0) return { ...sub, subtitle: firstSubTitle };
      if (i === 1) return { ...sub, subtitle: trioMomentTitle };
      return sub;
    });
    return { ...s, chapterTitle: ch6Title, subs: newSubs };
  });
}

// 챕터별 그룹 (목차 표시용) — scroll-chapter는 1 항목으로만 표시 (sub은 스크롤로 보기)
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

// ─── AI 본문 헤더 → 슬라이드 idx + sub subtitle 매핑 ───────────────────────
// 결과 구조:
//   result[slideIdx]["__chapter__"] = 챕터 본문 (sub 없는 슬라이드: intro/outro 등)
//   result[slideIdx][subSubtitle] = sub 본문 (scroll-chapter의 각 sub)
type SlideTextMap = Record<number, Record<string, string>>;
const CHAPTER_KEY = "__chapter__";

// ⭐ Step 2 (2026-05-13) — phase 마커 기반 매핑
// 기존 ## 챕터 헤더 강제 매칭이 가드 부작용(특히 suppressRepeatedHongsilEvidence의
// preamble 잘림)에 노출됐던 회귀 해결. fetch 루프에서 박은 `<<<PARENT_CHILD_PHASE:ch1>>>`
// 마커로 phase 분기 → phase → 챕터 매핑 → ### sub 헤더만 매칭.
// hongsil/inyeon은 cs/cd 이벤트 패턴, 부모자녀 V2는 phase별 단일 fetch라 마커 방식 채택.
const PHASE_TO_CHAPTER: Record<string, string> = {
  ch1: "1장", ch2: "2장", ch3: "3장", ch4: "4장", ch5: "5장", ch6: "6장", ch7: "7장", outro: "마지막",
};

function buildSlideTextMap(full: string): SlideTextMap {
  const result: SlideTextMap = {};
  if (!full) return result;

  // phase 마커로 본문 분기
  const markerRegex = /<<<PARENT_CHILD_PHASE:(ch[1-7]|outro)>>>/g;
  const markers = [...full.matchAll(markerRegex)];

  // 마커 없으면 옛 패턴 fallback (회귀 안전망 — 다만 신규 fetch 루프 후엔 안 들어옴)
  if (markers.length === 0) return buildSlideTextMapLegacy(full);

  for (let i = 0; i < markers.length; i++) {
    const phase = markers[i][1];
    const blockStart = (markers[i].index ?? 0) + markers[i][0].length;
    const blockEnd = i + 1 < markers.length ? (markers[i + 1].index ?? full.length) : full.length;
    const phaseText = full.slice(blockStart, blockEnd);

    const chapter = PHASE_TO_CHAPTER[phase];
    if (!chapter) continue;
    const slideIdx = SLIDES.findIndex((s) => s.chapter === chapter);
    if (slideIdx < 0) continue;

    // 그 phase 본문 안에서 ### sub 헤더만 매칭. ## 헤더는 무시.
    const lines = phaseText.split("\n");
    let currentSubtitle = "";
    let buf: string[] = [];
    const flush = () => {
      const body = buf.join("\n").trim();
      if (body) {
        const key = currentSubtitle || CHAPTER_KEY;
        if (!result[slideIdx]) result[slideIdx] = {};
        result[slideIdx][key] = (result[slideIdx][key] ?? "") + (result[slideIdx][key] ? "\n\n" : "") + body;
      }
      buf = [];
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      // ## 헤더 무시 (phase로 챕터 분기됨, ## 잘려도 영향 없음)
      if (/^##\s+/.test(line)) { flush(); currentSubtitle = ""; continue; }
      // ### sub 헤더 매칭
      const h3 = line.match(/^###\s+(.+)$/);
      if (h3) { flush(); currentSubtitle = h3[1].trim(); continue; }
      // prompt 안내 라인 (인자 등) skip
      if (/^\[인자[::]/.test(line)) continue;
      buf.push(line);
    }
    flush();
  }
  return result;
}

// ── 옛 매핑 함수 (회귀 안전망) ───────────────────────────
// phase 마커 없는 streamText에 대해 옛 동작 그대로 — ## N장 헤더 강제 매칭.
// 신규 fetch 루프는 마커를 항상 박으므로 이 경로는 안 들어와야 정상.
function buildSlideTextMapLegacy(full: string): SlideTextMap {
  const result: SlideTextMap = {};
  if (!full) return result;
  const lines = full.split("\n");
  let currentChapter = "";
  let currentSubtitle = "";
  let buf: string[] = [];
  const flush = () => {
    if (!currentChapter) return;
    const slideIdx = SLIDES.findIndex((s) => s.chapter === currentChapter);
    if (slideIdx < 0) { buf = []; return; }
    const text = buf.join("\n").trim();
    if (text) {
      const key = currentSubtitle || CHAPTER_KEY;
      if (!result[slideIdx]) result[slideIdx] = {};
      result[slideIdx][key] = (result[slideIdx][key] ?? "") + (result[slideIdx][key] ? "\n\n" : "") + text;
    }
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flush();
      const title = h2[1].trim();
      if (title.startsWith("들어가며")) currentChapter = "1장";
      else if (title.startsWith("자도인의 마지막")) currentChapter = "마지막";
      else {
        const m = title.match(/^(\d+)장/);
        currentChapter = m ? `${m[1]}장` : "";
      }
      currentSubtitle = "";
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flush();
      currentSubtitle = h3[1].trim();
      continue;
    }
    if (/^\[인자[::]/.test(line)) continue;
    buf.push(line);
  }
  flush();
  return result;
}

// 단일 sub용 헬퍼 — chapter-level 본문만 꺼내기 (intro/outro 등)
function getChapterText(map: SlideTextMap, slideIdx: number): string {
  return map[slideIdx]?.[CHAPTER_KEY] ?? "";
}
// scroll-chapter sub 본문 꺼내기
// ⭐ G13 (2026-05-14) — 연령별 sub 헤더 alias 양방향 매핑
// 서버가 ageStage에 따라 sub 헤더를 분기 출력하므로, SLIDES의 canonical subtitle과
// LLM 출력의 실제 subtitle이 다를 수 있음. 양방향 alias로 매칭.
const SUB_HEADER_ALIASES: Record<string, string[]> = {
  "혼자 vs 같이": ["혼자 놀까 함께 놀까"],
  "우리 아이만의 공부법": ["이 아이는 어떻게 배워갈까"],
  "글로 정리할까, 말로 표현할까": ["입으로 보여줄까 손으로 보여줄까"],
  "책상 앞 머릿속": ["혼자 놀이할 때 머릿속", "놀이매트 위 머릿속"],
  "거짓말 했을 때": ["고집부릴 때", "거짓말이나 고집이 시작될 때"],
};
function getSubText(map: SlideTextMap, slideIdx: number, subtitle: string): string {
  const direct = map[slideIdx]?.[subtitle];
  if (direct) return direct;
  const aliases = SUB_HEADER_ALIASES[subtitle] ?? [];
  for (const a of aliases) {
    const t = map[slideIdx]?.[a];
    if (t) return t;
  }
  // 역방향: subtitle이 alias라면 canonical로 찾기
  for (const [canonical, alts] of Object.entries(SUB_HEADER_ALIASES)) {
    if (alts.includes(subtitle)) {
      const t = map[slideIdx]?.[canonical];
      if (t) return t;
    }
  }
  return "";
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
  // ─── 결제 게이트 ─── unlocked=1이면 mount 시 자동 영상 재생 ───
  const unlocked = params.get("unlocked") === "1";
  const [videoPlaying, setVideoPlaying] = useState(unlocked);
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);
  // ⭐ LLM 진행률 — phase 완료 카운트. 영상 짧아도 50%(7 phase 중 4)까진 대기.
  const [phasesDone, setPhasesDone] = useState(0);
  const HALF_PHASES = 4;

  const childName = params.get("childName") || "";
  const childGender = params.get("childGender") || "";
  const honorific = childGender === "여" ? "양" : "군";

  async function handlePayment(finalPrice: number) {
    if (paying) return;
    setPaying(true);
    try {
      const PortOne = (await import("@portone/browser-sdk/v2")).default;
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
      if (!storeId || !channelKey) {
        alert("결제 설정이 누락됐습니다. 관리자에게 문의해주세요.");
        setPaying(false);
        throw new Error("PortOne env missing");
      }
      const paymentId = `payment${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
      const response = await PortOne.requestPayment({
        storeId, channelKey, paymentId,
        orderName: "부모와 자녀 궁합 풀이",
        totalAmount: finalPrice,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
      } as Parameters<typeof PortOne.requestPayment>[0]);
      if (response?.code !== undefined) {
        if (response.code !== "USER_CANCEL") alert(response.message || "결제가 취소되었습니다.");
        setPaying(false);
        throw new Error(response.message || "결제 취소");
      }
      const verifyRes = await fetch("/api/portone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const verify = await verifyRes.json();
      if (!verify.success) {
        alert(verify.error || "결제 검증에 실패했습니다.");
        setPaying(false);
        throw new Error(verify.error || "결제 검증 실패");
      }
      const url = new URL(window.location.href);
      url.searchParams.set("unlocked", "1");
      url.searchParams.set("paymentId", paymentId);
      window.location.href = url.toString();
    } catch (e) {
      setPaying(false);
      throw e;
    }
  }

  async function handleFreeUnlock(couponCode: string) {
    if (paying) return;
    setPaying(true);
    try {
      const res = await fetch("/api/coupon/free-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const cdata = await res.json();
      if (!cdata.success) {
        alert(cdata.error || "쿠폰 적용에 실패했습니다.");
        setPaying(false);
        throw new Error(cdata.error || "쿠폰 실패");
      }
      const url = new URL(window.location.href);
      url.searchParams.set("unlocked", "1");
      url.searchParams.set("paymentId", cdata.paymentId);
      window.location.href = url.toString();
    } catch (e) {
      setPaying(false);
      throw e;
    }
  }

  useEffect(() => {
    const id = "hongsil-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!unlocked) return; // 결제 전엔 사주 계산·LLM 호출 안 함
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

    // ─── 다단계 fetch — Stage 0 사주 계산(JSON) → Stage 1~7 챕터 streaming ───
    (async () => {
      try {
        // Stage 0 — 사주 계산 (LLM 호출 X, 즉시 응답)
        const computeRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, phase: "compute" }),
        });
        if (!computeRes.ok) {
          const t = await computeRes.text().catch(() => "");
          setErrMsg(`HTTP ${computeRes.status} ${t.slice(0, 200)}`);
          setLoading(false);
          return;
        }
        const computeJson = await computeRes.json();
        setMeta(computeJson as MetaEvent);

        // Stage 1~7 — 챕터별 streaming 순차 호출
        const phases: Array<"ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6" | "ch7" | "outro"> =
          ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "outro"];
        let full = "";
        // ⭐ Step 5 (2026-05-13) — cross-chapter usedTokens 누적
        // 매 phase 응답에서 가드가 mutate한 token 카운트 받아 누적, 다음 phase 요청에 보냄.
        // hongsil/inyeon은 서버 stateful (단일 fetch), V2는 phase별 fetch라 클라이언트 누적.
        let usedTokens: Record<string, number> = {};
        for (const phase of phases) {
          // ⭐ phase 마커 — buildSlideTextMap이 phase로 챕터 분기하기 위한 식별자
          // hongsil/inyeon은 cs/cd 이벤트 패턴이지만 V2는 phase별 단일 fetch라
          // 클라이언트 단에서 마커 박는 게 더 단순. ## 챕터 헤더 매칭 강제 제거.
          full += `\n\n<<<PARENT_CHILD_PHASE:${phase}>>>\n\n`;
          setStreamText(full);

          const chRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, phase, usedTokens }),
          });
          if (!chRes.ok || !chRes.body) {
            const t = await chRes.text().catch(() => "");
            setErrMsg(prev => prev ?? `${phase} HTTP ${chRes.status} ${t.slice(0, 200)}`);
            continue;
          }
          const reader = chRes.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let chDone = false;
          while (!chDone) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6);
              if (raw === "[DONE]") {
                chDone = true;
                break;
              }
              try {
                const msg = JSON.parse(raw);
                if (msg.t === "x" && typeof msg.v === "string") {
                  full += msg.v;
                  setStreamText(full);
                } else if (msg.t === "tk" && msg.m && typeof msg.m === "object") {
                  // Step 5: 가드가 mutate한 cross-chapter usedTokens 누적
                  usedTokens = msg.m as Record<string, number>;
                } else if (msg.t === "err") {
                  setErrMsg(prev => prev ?? `${phase} empty finish=${msg.finishReason ?? "-"} block=${msg.blockReason ?? "-"} chunks=${msg.chunks ?? 0}`);
                }
              } catch {}
            }
          }
          // 챕터 사이 줄바꿈 보정
          full += "\n\n";
          setStreamText(full);
          setPhasesDone(n => n + 1); // ⭐ phase 완료 — 영상 50% 대기용
        }
        setLoading(false);
      } catch (e) {
        setErrMsg(String(e));
        setLoading(false);
      }
    })();
  }, [childName, childGender, params, unlocked]);

  const ageStage = useMemo(() => {
    const y = parseInt(params.get("childYear") || "", 10);
    const m = parseInt(params.get("childMonth") || "", 10) || 1;
    const d = parseInt(params.get("childDay") || "", 10) || 1;
    if (!y) return "elementary" as const;
    return classifyAgeStage(y, m, d);
  }, [params]);

  const slideText = useMemo(() => {
    // 1) 단일 부모 입력 시 본문의 양친 호명("어머님, 아버님" / "두 분이" / "부모님" 등) → 단일 부모 호칭 자동 치환
    let cleaned = enforceParentVoice(streamText, meta?.hasMom ?? true, meta?.hasDad ?? true);
    // 2) 영유아 자녀 입력 시 "학습 스케줄 권고" 같은 학령기 부적합 문장 통째 제거
    cleaned = stripAgeInappropriate(cleaned, ageStage);
    // 3) 매 sub 끝 "기억해야 할 한 가지는, ..." 마무리 문장 제거 — 반복감 제거
    cleaned = stripParentTakeaway(cleaned);
    return buildSlideTextMap(cleaned);
  }, [streamText, meta?.hasMom, meta?.hasDad, ageStage]);
  const dynamicSlides = useMemo(
    () => slidesForMeta(meta?.hasMom ?? true, meta?.hasDad ?? true),
    [meta?.hasMom, meta?.hasDad],
  );
  const total = dynamicSlides.length;
  const slide = dynamicSlides[slideIdx];
  const grouped = useMemo(() => groupByChapter(dynamicSlides), [dynamicSlides]);
  const familyLabel =
    meta?.hasMom && meta?.hasDad ? "엄마 · 아빠와 아이"
    : meta?.hasMom ? "엄마와 아이"
    : meta?.hasDad ? "아빠와 아이"
    : "부모와 아이";
  const childBirthLine = [
    params.get("childYear"),
    params.get("childMonth"),
    params.get("childDay"),
  ].filter(Boolean).join(".");
  const parentChildSummaryLines = [
    `자녀: ${childName}${honorific}`,
    `구성: ${familyLabel}`,
    `생년월일: ${childBirthLine || "미입력"} (${params.get("childCalendar") || "양력"}) · ${params.get("childHour") || "시간 모름"}`,
  ];

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
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, #ffe1ea 0%, transparent 50%),
          radial-gradient(ellipse at 80% 30%, #ffd9e3 0%, transparent 55%),
          radial-gradient(ellipse at 50% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 40%, #fce4d6 100%)
        `,
        backgroundAttachment: "fixed",
        color: "#1a0a14",
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <main className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col relative">
        {/* 헤더 — 인연/연애 ChapterShell 포맷 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 sticky top-0 z-20"
          style={{ borderBottom: `1px solid rgba(212,169,107,0.3)`, background: "rgba(255,247,249,0.92)", backdropFilter: "blur(10px)" }}>
          <span className="w-4" aria-hidden="true" />
          <div className="flex-1 text-center min-w-0">
            <div className="text-[13px] font-bold truncate" style={{ color: "#1a0a14" }}>
              {slide.chapter === '오프닝' || slide.chapter === '마지막'
                ? slide.chapterTitle
                : `${slide.chapter} · ${slide.chapterTitle}`}
            </div>
          </div>
          <div className="text-[11px] tabular-nums" style={{ color: "#6b1e3a", fontFamily: "'Cormorant Garamond', serif" }}>
            {slideIdx + 1} / {total}
          </div>
          <button onClick={() => setTocOpen((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-full transition-all"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}55`, color: ACCENT }}>
            목차
          </button>
        </div>

        {/* 목차 드롭다운 — 인연/연애 패턴 (라이트 핑크 BG + 검은 글자) */}
        {tocOpen && (
          <>
            <div className="fixed inset-0 z-20" style={{ background: "rgba(106,30,58,0.35)" }} onClick={() => setTocOpen(false)} />
            <div
              className="fixed top-[58px] left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[464px] z-30 rounded-lg shadow-2xl overflow-y-auto max-h-[70vh]"
              style={{
                background: "linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(253,243,232,0.96) 100%)",
                border: `1px solid rgba(212,169,107,0.4)`,
                boxShadow: `0 24px 60px -16px rgba(178,40,71,0.25)`,
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid rgba(212,169,107,0.25)` }}
              >
                <span className="text-sm font-bold" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', serif" }}>목차</span>
                <button onClick={() => setTocOpen(false)} style={{ color: "#b88646", fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>
              {grouped.map(([ch, group]) => {
                const firstIdx = group.items[0]?.idx;
                const isCurrent = firstIdx === slideIdx;
                return (
                  <button
                    key={ch}
                    onClick={() => firstIdx !== undefined && jumpTo(firstIdx)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                    style={{
                      borderBottom: `1px solid rgba(212,169,107,0.15)`,
                      background: isCurrent ? `${ACCENT}0d` : "transparent",
                      color: isCurrent ? ACCENT : "#1a0a14",
                    }}
                  >
                    <span className="text-[13px]" style={{ fontFamily: "'Gowun Batang', serif" }}>{ch} · {group.title}</span>
                    {isCurrent && <span className="text-[10px]" style={{ color: ACCENT }}>●</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 챕터 타이틀 영역 */}
        <div className="px-4 pt-7 pb-3 text-center">
          {slide.kind !== "opening" && (
            <div
              className="inline-block text-[12px] tracking-[0.32em] uppercase mb-3 font-bold px-4 py-1.5 rounded-full"
              style={{
                color: "#8a4d16",
                fontFamily: "'Cormorant Garamond', serif",
                textShadow: "0 1px 0 rgba(255,255,255,0.9)",
                background: "rgba(255,255,255,0.68)",
                border: "1px solid rgba(184,134,70,0.38)",
                boxShadow: "0 6px 18px -12px rgba(106,30,58,0.35)",
              }}
            >
              Chapter {String(Math.max(1, slideIdx)).padStart(2, "0")}
            </div>
          )}
          <h1
            className="text-[19px] font-bold leading-snug"
            style={{
              color: "#2a1722",
              fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif",
              letterSpacing: "-0.01em",
            }}
          >
            {slide.chapter === "오프닝" || slide.chapter === "마지막" ? slide.chapterTitle : slide.chapterTitle}
          </h1>
          {slideIdx === 1 && (
            <div
              className="mt-5 mx-auto w-full rounded-md px-5 py-4 text-left"
              style={{
                background: "#ffffff",
                border: `1px dashed ${ACCENT}55`,
              }}
            >
              {parentChildSummaryLines.map((line) => (
                <div
                  key={line}
                  className="text-[13px] leading-[1.7]"
                  style={{
                    color: "#2a1a20",
                    fontFamily: "'Gowun Batang', serif",
                  }}
                >
                  ▸ {line}
                </div>
              ))}
            </div>
          )}
          <div
            className="mt-3 h-px mx-auto"
            style={{
              maxWidth: 80,
              background: `linear-gradient(90deg, transparent, #d4a96b, transparent)`,
            }}
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 px-4 flex flex-col pb-24">
          <div className="flex-1 space-y-4">
          {errMsg && (
            <div className="rounded-xl p-4 my-3" style={{ backgroundColor: "rgba(255,138,138,0.1)", border: "1px solid rgba(255,138,138,0.3)" }}>
              <p className="text-sm font-bold text-[#c8203a] mb-1">풀이 생성 실패</p>
              <pre className="text-[11px] text-white/70 whitespace-pre-wrap break-all">{errMsg}</pre>
              <Link href="/love/parent-child/form" className="inline-block mt-3 px-4 py-2 rounded-lg text-sm"
                style={{ backgroundColor: `${ACCENT}33`, color: ACCENT }}>← 돌아가기</Link>
            </div>
          )}

          {!errMsg && slide.kind === "opening" && (
            <OpeningGreeting
              childName={childName}
              childGender={(childGender === "여" ? "여" : "남") as "남" | "여"}
              hasMom={meta?.hasMom ?? true}
              hasDad={meta?.hasDad ?? true}
              onStart={() => { if (unlocked) setVideoPlaying(true); else setShowPay(true); }}
            />
          )}

          {showPay && !unlocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)" }}>
              <PaymentModal
                open={true}
                onClose={() => setShowPay(false)}
                price={PARENT_CHILD_PRICE}
                goodsName="부모와 자녀 궁합 풀이"
                onSubmit={handlePayment}
                onFreeUnlock={handleFreeUnlock}
              />
            </div>
          )}

          {videoPlaying && (
            <OpeningVideo
              src="/opening-jadoin.mp4"
              dataReady={phasesDone >= HALF_PHASES}
              loadProgress={phasesDone / HALF_PHASES}
              onComplete={() => { setVideoPlaying(false); go(1); }}
              loadingMessage="자녀 사주를 펼치는 중…"
            />
          )}

          {!errMsg && slide.kind === "intro" && meta && (
            <IntroSummaryV2
              sajuChild={meta.sajuChild}
              childName={childName}
              honorific={honorific}
              onStart={() => go(1)}
              hasMom={meta.hasMom}
              hasDad={meta.hasDad}
            />
          )}

          {!errMsg && (slide.kind === "intro" || slide.kind === "scroll-chapter") && !meta && (
            <div className="flex items-center gap-3 py-3">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${ACCENT}44`, borderTopColor: ACCENT }} />
              <span className="text-[12px]" style={{ color: `${ACCENT}aa` }}>사주 계산 중…</span>
            </div>
          )}

          {!errMsg && slide.kind === "scroll-chapter" && meta && (
            <ScrollChapterPage
              spec={slide}
              meta={meta}
              slideTextMap={slideText}
              slideIdx={slideIdx}
              loading={loading}
              childName={childName}
              honorific={honorific}
            />
          )}

          {!errMsg && slide.kind !== "opening" && slide.kind !== "intro" && slide.kind !== "scroll-chapter" && (
            <SlideView
              spec={slide}
              meta={meta}
              text={getChapterText(slideText, slideIdx)}
              loading={loading && !getChapterText(slideText, slideIdx)}
              childName={childName}
              honorific={honorific}
            />
          )}
          </div>
        </div>

        {/* 하단 nav — opening 페이지에선 숨김 (CTA 버튼만으로 진행) */}
        {slide.kind !== "opening" && (
        <div className="flex-shrink-0 px-4 py-3 sticky bottom-0 z-20"
          style={{ borderTop: `1px solid rgba(212,169,107,0.3)`, background: "rgba(255,247,249,0.92)", backdropFilter: "blur(10px)" }}>
          <div className="flex gap-2">
            <button onClick={() => go(-1)} disabled={slideIdx === 0}
              className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `${ACCENT}1f`, color: ACCENT, border: `1px solid ${ACCENT}55`, fontFamily: "'Gowun Batang', serif", letterSpacing: "0.05em" }}>
              ‹  이전 챕터
            </button>
            <button onClick={() => go(1)} disabled={slideIdx === total - 1}
              className="flex-1 py-3 rounded-md text-sm transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: `${ACCENT}1f`, color: ACCENT, border: `1px solid ${ACCENT}55`, fontFamily: "'Gowun Batang', serif", letterSpacing: "0.05em" }}>
              다음 챕터  ›
            </button>
          </div>
          {slideIdx === total - 1 && !loading && (
            <div className="mt-2 flex gap-2">
              <Link href="/love/parent-child/form" className="flex-1 text-center py-2 rounded-lg text-[12px]"
                style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>다른 가족 풀이</Link>
            </div>
          )}
        </div>
        )}
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
      <h2 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14" }}>
        {spec.subtitle ?? spec.chapterTitle}
      </h2>

      {/* 시각 컴포넌트 */}
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
      {meta && spec.kind === "outro" && <OutroCard text={text} childName={childName} honorific={honorific} hasMom={meta.hasMom} hasDad={meta.hasDad} />}

      {/* 본문 — outro는 OutroCard 박스 1 안에 LLM 본문 통합 (외부 본문 영역 차단해서 중복 방지) */}
      {spec.kind !== "outro" && (
        <div className="text-[14px] leading-7" style={{ color: "#1a0a14" }}>
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
      )}
    </article>
  );
}

// 본문 강조 마커: [[텍스트]] → 골드 bold (핵심 단어만)
// V2.5 (2026-05-10): 공용 helper 사용 — `[메인:`·`[시그너처:`·`구성:`·`[★`·`※` 라인 echo 방어 포함
function renderInlineEmphasis(text: string): React.ReactNode[] {
  return renderInlineEmphasisShared(text, GOLD);
}

function renderParagraphs(text: string) {
  return renderParagraphsShared(text, GOLD);
}

// ─── 시각 컴포넌트 ─────────────────────────────────────────────────────────

function IljuCard({ saju }: { saju: SajuAnalysis }) {
  const ilju = `${saju.pillars.day.stem}${saju.pillars.day.branch}`;
  let info: ReturnType<typeof getIljuInfo> | null = null;
  try { info = getIljuInfo(saju); } catch { info = null; }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: `1px solid ${ACCENT}33` }}>
      <div className="text-center mb-3">
        <div className="text-[11px]" style={{ color: `${ACCENT}aa` }}>일주(日柱)</div>
        <div className="text-[28px] font-bold" style={{ color: GOLD }}>{info?.hanja ?? ilju}</div>
        <div className="text-[12px] mt-0.5" style={{ color: `${ACCENT}cc` }}>{info?.hangul ?? ilju}</div>
      </div>
      {info && (
        <div className="space-y-2 text-[12px]">
          <div className="text-center font-bold" style={{ color: GOLD }}>{info.fusion}</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded p-2" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
              <div className="text-[10px]" style={{ color: `${ACCENT}aa` }}>천간 ({info.stemHanja})</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#2a1722" }}>{info.stemMeaning}</div>
            </div>
            <div className="rounded p-2" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
              <div className="text-[10px]" style={{ color: `${ACCENT}aa` }}>지지 ({info.branchHanja})</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#2a1722" }}>{info.branchMeaning}</div>
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
      <div className="rounded-xl p-3 text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}22`, color: `${ACCENT}99` }}>
        용신 정보 분석 중…
      </div>
    );
  }
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(21,128,61,0.28)" }}>
      <div className="flex items-baseline gap-2">
        <div className="text-[11px]" style={{ color: "#15803d" }}>채워줄 결 (用神)</div>
        <div className="text-[18px] font-bold" style={{ color: "#15803d" }}>{meaning.element ?? "—"} ({meaning.hanja})</div>
      </div>
      <div className="text-[12px] leading-6" style={{ color: "#2a1722" }}>{meaning.meaning}</div>
      <div className="text-[12px] leading-6 pt-2 mt-2" style={{ color: "#2a1722", borderTop: "1px solid rgba(126,218,126,0.2)" }}>
        <span className="text-[10px] mr-1" style={{ color: "#15803d" }}>길</span>
        {meaning.guidance}
      </div>
    </div>
  );
}

// ─── STEP 2 — V1 시각 컴포넌트 이식 ─────────────────────────────────────────
const ELEM_COLORS: Record<string, string> = {
  목: "#15803d", 화: "#dc2626", 토: "#a16207", 금: "#475569", 수: "#2563eb",
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
  비겁: "#a16207", 식상: "#c2410c", 재성: "#087f6f", 관성: "#2563eb", 인성: "#7e22ce",
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
  { color: "#087f6f", glow: "rgba(125,211,192,0.15)" },
  { color: "#a16207", glow: "rgba(251,191,36,0.15)" },
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
            stroke={s === 1.0 ? "rgba(184,134,70,0.4)" : "rgba(184,134,70,0.18)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ELEM_ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(184,134,70,0.25)" strokeWidth="1" />;
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
              <text x={lx + dx} y={ly + 26} textAnchor={anchor} fontSize="11" fill="#5a3c4a">{ELEM_DESC[el].split("·")[0]}</text>
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
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(184,134,70,0.3)" }}>
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
            <div key={el} className="px-3 py-3" style={{ borderTop: "1px solid rgba(184,134,70,0.18)" }}>
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-xl font-bold" style={{ color }}>{ELEM_HANJA[el]}</span>
                <span className="text-[13px]" style={{ color: "#6b1e3a" }}>{ELEM_NAME_FRIENDLY[el].label.replace(/^.*— /, "")}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold" style={{ color: dominant === "balanced" ? "#6b1e3a" : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[13px] leading-snug flex-1" style={{ color: dominant === "balanced" ? "#5a3c4a" : "#1a0a14" }}>{phrase}</p>
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
            stroke={s === 1.0 ? "rgba(184,134,70,0.4)" : "rgba(184,134,70,0.18)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(184,134,70,0.25)" strokeWidth="1" />;
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
          const labelColor = isZero ? "#8a6878" : isTop ? GOLD : "#2a1722";
          const subColor = isZero ? "#b88646" : "#5a3c4a";
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 8} textAnchor={anchor} fontSize="14" fontWeight={isTop ? "bold" : "normal"} fill={labelColor}>
                {isZero ? k : `${k} ${counts[k]}`}
              </text>
              <text x={lx + dx} y={ly + 8} textAnchor={anchor} fontSize="10" fill={subColor}>{SIPSEONG_DESC[k]}</text>
              {isZero && (
                <text x={lx + dx} y={ly + 22} textAnchor={anchor} fontSize="10" fill="#8a6878" fontWeight="600">약한 부분</text>
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
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(184,134,70,0.3)" }}>
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
            <div key={k} className="px-3 py-3" style={{ borderTop: "1px solid rgba(184,134,70,0.18)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[15px] font-bold" style={{ color }}>{k}</span>
                <span className="text-[12px]" style={{ color: "#6b1e3a" }}>{data.label}</span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{v}</span>
              </div>
              <p className="text-[10.5px] leading-snug mb-1.5" style={{ color: "#8a6878", fontStyle: "italic" }}>{data.explain}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold flex-shrink-0" style={{ color: dominant === "balanced" ? "#6b1e3a" : color }}>{arrow} {arrowLabel}</span>
                <p className="text-[12.5px] leading-snug flex-1" style={{ color: dominant === "balanced" ? "#5a3c4a" : "#1a0a14" }}>{phrase}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IljuSubsectionBanner({ childIlju }: { childIlju: IljuInfo | null }) {
  const HUE = "#7e22ce";
  return (
    <div className="mb-2">
      <h4 className="text-sm font-bold text-center mb-1" style={{ color: GOLD }}>일주(日柱) 기반 풀이</h4>
      <p className="text-center text-[10.5px] mb-3 italic" style={{ color: "#3a2530" }}>
        자녀의 자기 결 — 십성 5분류와는 다른 본질 인자
      </p>
      {childIlju && (
        <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: `1px solid ${HUE}40` }}>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-[28px] font-bold tracking-widest leading-none" style={{ color: HUE }}>{childIlju.hanja}</div>
              <p className="text-[10px] mt-1.5" style={{ color: `${HUE}cc` }}>{childIlju.fusion}</p>
            </div>
            <div className="w-px h-12" style={{ background: `${HUE}30` }} />
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[64px]" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                <div className="text-[18px] font-bold leading-none" style={{ color: HUE }}>{childIlju.stemHanja}</div>
                <p className="text-[9px] mt-1" style={{ color: "#5a3c4a" }}>{childIlju.stemMeaning}</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5 text-center min-w-[64px]" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                <div className="text-[18px] font-bold leading-none" style={{ color: HUE }}>{childIlju.branchHanja}</div>
                <p className="text-[9px] mt-1" style={{ color: "#5a3c4a" }}>{childIlju.branchMeaning}</p>
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
    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.92)", border: "1px solid rgba(200,32,58,0.32)" }}>
      <div className="flex items-baseline gap-2">
        <div className="text-[11px]" style={{ color: "#c8203a" }}>살펴줄 결 (忌神)</div>
        <div className="text-[18px] font-bold" style={{ color: "#c8203a" }}>{g.element} ({g.hanja})</div>
      </div>
      <div className="text-[12px] leading-6" style={{ color: "#2a1722" }}>{g.meaning}</div>
      <div className="text-[12px] leading-6" style={{ color: "#2a1722" }}>
        <span className="text-[10px] mr-1" style={{ color: "#c8203a" }}>주의</span>
        {g.caution}
      </div>
      {g.avoid.length > 0 && (
        <div className="pt-1.5 mt-1.5" style={{ borderTop: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-[10.5px] mb-1 tracking-[0.05em]" style={{ color: "#c8203a" }}>이런 양육이 누적되면</p>
          <ul className="text-[11.5px] leading-6 pl-2" style={{ color: "#3a2530" }}>

            {g.avoid.map((a, i) => <li key={i}>· {a}</li>)}
          </ul>
        </div>
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
            style={{ background: "#ffffff", borderLeft: `3px solid ${color}`, border: `1px solid ${color}40`, boxShadow: `0 2px 12px ${color}15` }}>
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 48, height: 48, fontSize: 26, background: `${color}25`, borderRadius: 12, border: `1px solid ${color}50` }}>{c.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold mb-1.5 leading-tight" style={{ color, fontSize: 15, letterSpacing: "-0.01em" }}>{c.keyword}</p>
              <p className="leading-[1.65]" style={{ color: "#1a0a14", fontSize: 13 }}>{c.body}</p>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}40` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 이 자녀에게 가장 깊이 닿는 살핌 2가지 ─</p>
      <div className="space-y-2.5">
        {topTwo.map((c, i) => (
          <div key={c.name} className="rounded-xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.94)", border: "1px solid rgba(200,32,58,0.36)" }}>
            <div className="flex items-baseline justify-between mb-1.5 gap-2">
              <span className="text-[13.5px] font-bold leading-snug" style={{ color: "#c8203a" }}>{c.name}</span>
              <span className="text-[12px] flex-shrink-0" style={{ color: "#ef4444", letterSpacing: "1px" }}>{"★".repeat(c.level)}{"☆".repeat(5 - c.level)}</span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: "#3a2530" }}>{c.why}</p>
            <div className="mt-2.5 rounded-lg p-2.5" style={{ backgroundColor: "rgba(200,32,58,0.05)", borderLeft: "3px solid #c8203a" }}>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "#c8203a", fontWeight: "bold" }}>─ 왜 {i === 0 ? "가장" : "특히"} 깊이 닿는가 (사주 근거) ─</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{c.sajuBasis}</p>
            </div>
          </div>
        ))}
      </div>
      {restThree.length > 0 && (
        <>
          <p className="text-[14px] tracking-[0.15em] text-center font-semibold mt-4 mb-2" style={{ color: "#8a6878" }}>─ 그 외 살펴볼 결 ─</p>
          <div className="space-y-1.5">
            {restThree.map((c) => {
              const danger = c.level >= 3 ? "#a16207" : "#8a6878";
              return (
                <div key={c.name} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(184,134,70,0.18)" }}>
                  <span className="text-[12.5px] leading-snug" style={{ color: "#2a1722" }}>{c.name}</span>
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
      <div className="relative h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(184,134,70,0.15)" }}>
        <div className="h-full" style={{ width: `${lp}%`, background: `linear-gradient(90deg, ${leftColor}, ${leftColor}cc)` }} />
        <div className="h-full" style={{ width: `${100 - lp}%`, background: `linear-gradient(90deg, ${rightColor}cc, ${rightColor})` }} />
      </div>
      {hint && <p className="text-[11.5px] mt-2 leading-relaxed text-center" style={{ color: "#3a2530" }}>{hint}</p>}
    </div>
  );
}

// ⭐ G19 (2026-05-14) — 메인 인자 0일 때 차트 대신 "뚜렷하지 않음" 보류 카드
// 발견 사례 (999 이미지): 인성 0 + 식상 0인데 깊이 사색 85% 단정 — 명리적으로 어색.
// 메인 인자 합이 임계값 미만이면 % 차트 대신 양면형 안내 카드.
function InsufficientChartCard({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ {title} ─</p>
      <div className="rounded-xl p-3 text-center" style={{ background: "#ffffff", border: `1px dashed ${ACCENT}55` }}>
        <p className="text-[13px] font-bold mb-1.5" style={{ color: ACCENT }}>이 결은 사주에 뚜렷하게 드러나지 않아요</p>
        <p className="text-[12px] leading-relaxed" style={{ color: "#3a2530" }}>{reason}</p>
      </div>
    </div>
  );
}

function BigeopFocusCard({ saju }: { saju: SajuAnalysis }) {
  const counts = getSipseongCounts(saju);
  const bigeop = counts.비겁;
  const jaesong = counts.재성;
  // ⭐ G19 — 메인 인자(비겁·재성) 모두 옅으면 보류 카드
  if (bigeop + jaesong < 1) {
    return <InsufficientChartCard title="혼자 vs 같이 공부" reason="비겁·재성이 모두 옅어, 혼자와 함께를 자유롭게 오가는 양면형이에요. 다양한 방식을 골고루 경험하게 해주세요." />;
  }
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 혼자 vs 같이 공부 ─</p>
      <DualGauge
        leftLabel="혼자" leftPct={alonePct} leftColor="#2563eb"
        rightLabel="같이" rightColor="#c2410c"
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
  // ⭐ G19 — 메인 인자(인성·식상) 모두 옅으면 보류 카드
  if (insong + siksang < 1) {
    return <InsufficientChartCard title="우리 아이만의 공부법" reason="인성·식상이 모두 옅어, 사색과 행동을 한쪽으로 단정하기 어려운 양면형이에요. 책·체험·대화를 골고루 경험하게 해주세요." />;
  }
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 우리 아이만의 공부법 ─</p>
      <DualGauge
        leftLabel="깊이 사색" leftPct={depthPct} leftColor="#7e22ce"
        rightLabel="즉각 행동" rightColor="#c2410c"
        hint={tone}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="rounded-lg p-2" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#7e22ce" }}>인성(印) {insong}</div>
          <div style={{ color: "#3a2530" }}>받아들임·사색의 결</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "#ffffff", border: "1px solid rgba(194,65,12,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#c2410c" }}>식상(食) {siksang}</div>
          <div style={{ color: "#3a2530" }}>표현·창의의 결</div>
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
  // ⭐ G19 — 메인 인자(인성·식상) 모두 옅으면 보류 카드
  if (insong + siksang < 1) {
    return <InsufficientChartCard title="글로 정리할까, 말로 표현할까" reason="인성·식상이 모두 옅어, 글과 말 표현을 한쪽으로 단정하기 어려운 양면형이에요. 두 방식을 함께 권해주세요." />;
  }
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 글로 정리할까, 말로 표현할까 ─</p>
      <DualGauge
        leftLabel="글" leftPct={writePct} leftColor="#94a3b8"
        rightLabel="말" rightColor="#c2410c"
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 또렷해지는 시간대 ─</p>
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-[11.5px] mb-0.5">
              <span style={{ color: s.color, fontWeight: 600 }}>{s.label} <span style={{ color: "#6b1e3a" }}>· {s.time}</span> <span style={{ color: "#8a6878", fontSize: 10 }}>({s.el})</span></span>
              <span style={{ color: "#3a2530" }}>{Math.round(s.pct)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(184,134,70,0.15)" }}>
              <div style={{ width: `${(s.pct / max) * 100}%`, height: "100%", backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "#3a2530" }}>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 책상 앞 머릿속 (사고 유형) ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 30} viewBox={`0 0 ${SIZE} ${SIZE + 30}`}>
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(124,179,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,193,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(196,156,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(184,134,70,0.4)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(184,134,70,0.4)" strokeWidth="1" />
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(184,134,70,0.3)" strokeWidth="1" />
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#2563eb">논리</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#c2410c">감각</text>
          <text x={PAD - 4} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#7e22ce">직관</text>
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
        <p className="text-[12px] mt-2 leading-relaxed px-3" style={{ color: "#3a2530" }}>{tt.desc}</p>
      </div>
    </div>
  );
}

// ─── STEP 4 — 4장(칭찬·혼) 시각 컴포넌트 ────────────────────────────────────
function TantrumBars({ triggers }: { triggers: TantrumTrigger[] }) {
  const max = Math.max(...triggers.map((t) => t.score), 1);
  const top = [...triggers].sort((a, b) => b.score - a.score)[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 고집의 뿌리 4가지 ─</p>
      <div className="space-y-2.5">
        {triggers.map((t) => (
          <div key={t.name}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[12.5px] font-bold" style={{ color: t.color }}>{t.name}</span>
              <span className="text-[11px]" style={{ color: "#5a3c4a" }}>{Math.round(t.score)}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(184,134,70,0.15)" }}>
              <div style={{ width: `${(t.score / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)` }} />
            </div>
            <p className="text-[10.5px] mt-1 leading-snug" style={{ color: "#5a3c4a" }}>{t.subtitle}</p>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "#3a2530" }}>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 감정이 가라앉는 환경 ─</p>
      <div className="rounded-xl p-3 mb-3" style={{ background: "#ffffff", border: `1px solid ${ELEM_COLORS[weakest]}40` }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[20px] font-bold" style={{ color: ELEM_COLORS[weakest] }}>{ELEM_HANJA[weakest]}</span>
          <span className="text-[12.5px] font-bold" style={{ color: ELEM_COLORS[weakest] }}>{env.name}</span>
          <span className="text-[10px] ml-auto" style={{ color: "#6b1e3a" }}>가장 약함 {Math.round(pct[weakest])}%</span>
        </div>
        <p className="text-[11.5px]" style={{ color: "#3a2530" }}>키워드 → <strong style={{ color: ELEM_COLORS[weakest] }}>{env.tag}</strong></p>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-2" style={{ color: "#2a1722" }}>이 결을 채워줄 환경 3가지:</p>
      <ul className="space-y-1.5">
        {env.rec.map((r, i) => (
          <li key={i} className="rounded-lg px-3 py-2 text-[12px] leading-snug"
            style={{ background: "#ffffff", borderLeft: `3px solid ${ELEM_COLORS[weakest]}`, color: "#2a1722" }}>
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
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(8,127,111,0.36)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#087f6f", fontSize: 16 }}>✦</span>
          <p className="text-[13px] font-bold" style={{ color: "#087f6f" }}>마음 열리는 칭찬</p>
        </div>
        <p className="text-[13px] font-bold mb-1.5" style={{ color: GOLD }}>{goodTone}</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{goodBody}</p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(200,32,58,0.36)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "#c8203a", fontSize: 16 }}>⚠</span>
          <p className="text-[13px] font-bold" style={{ color: "#c8203a" }}>마음 닫히는 톤</p>
        </div>
        <p className="text-[13px] font-bold mb-1.5" style={{ color: "#c8203a" }}>{badTone}</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{badBody}</p>
      </div>
      <div className="text-center text-[10.5px] mt-2" style={{ color: "#6b1e3a" }}>
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
      <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.28)" }}>
        <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-2" style={{ color: "#7e22ce" }}>─ 일주에서 본 자녀 결 ─</p>
        <p className="text-[13px] font-bold text-center mb-1" style={{ color: GOLD }}>{tone.kind} ({ilgan})</p>
        <p className="text-[12.5px] leading-relaxed text-center" style={{ color: "#2a1722" }}>다가가실 때 → <strong style={{ color: "#7e22ce" }}>{tone.voice}</strong></p>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "rgba(126,182,255,0.08)", border: "1px solid rgba(126,182,255,0.35)" }}>
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-[13px] font-bold" style={{ color: "#2563eb" }}>관성(절제 회로)</p>
          <span className="text-[11px]" style={{ color: "#2563eb" }}>{gwansong} · {restraintLevel}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{restraintTip}</p>
      </div>
    </div>
  );
}

function BreakdownTriggerCard({ saju }: { saju: SajuAnalysis }) {
  let g: GisinResult | null = null;
  try { g = calcGisin(saju); } catch { g = null; }
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(200,32,58,0.36)" }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: "#c8203a" }}>─ 무너지는 자극 (기신 忌神) ─</p>
      {g ? (
        <>
          <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(200,32,58,0.05)", border: "1px solid rgba(200,32,58,0.34)" }}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[11px]" style={{ color: "#c8203a" }}>기신</span>
              <span className="text-[20px] font-bold" style={{ color: "#c8203a" }}>{g.element} ({g.hanja})</span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{g.caution}</p>
          </div>
          {g.avoid.length > 0 && (
            <>
              <p className="text-[11.5px] mb-2 font-bold" style={{ color: "#c8203a" }}>피하는 게 좋은 자극</p>
              <ul className="space-y-1.5">
                {g.avoid.map((a, i) => (
                  <li key={i} className="rounded-lg px-3 py-2 text-[12px] leading-snug"
                    style={{ background: "rgba(255,255,255,0.88)", borderLeft: "3px solid #c8203a", color: "#2a1722" }}>
                    · {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p className="text-[12px] text-center" style={{ color: "#6b1e3a" }}>용신 정보가 없어 기신을 산출할 수 없습니다.</p>
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
  // ⭐ G19 — 메인 인자(인성·식상·비겁) 모두 옅으면 보류 카드
  if (insong + siksang + bigeop < 1) {
    return <InsufficientChartCard title="마음 문 여는 시간" reason="관련 기운이 모두 옅어, 마음 여는 속도를 한쪽으로 단정하기 어려운 양면형이에요. 아이의 그날그날 결을 따라가 주세요." />;
  }
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 마음 문 여는 시간 ─</p>
      <DualGauge
        leftLabel="천천히" leftPct={slowPct} leftColor="#2563eb"
        rightLabel="빠르게" rightColor="#c2410c"
        hint={tone}
      />
      <div className="text-center text-[10.5px] mt-2" style={{ color: "#6b1e3a" }}>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구 사이 결의 자리 ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 30} viewBox={`0 0 ${SIZE} ${SIZE + 30}`}>
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(245,185,66,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(126,182,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(125,211,192,0.06)" />
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(184,134,70,0.4)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(184,134,70,0.4)" strokeWidth="1" />
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(184,134,70,0.3)" strokeWidth="1" />
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#c2410c">적극</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#2563eb">관찰</text>
          <text x={PAD - 4} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#a16207">이끄는</text>
          <text x={SIZE - PAD + 4} y={SIZE / 2 + 4} textAnchor="start" fontSize="13" fontWeight="bold" fill="#087f6f">함께</text>
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
        <p className="text-[12px] leading-relaxed px-3" style={{ color: "#2a1722" }}>{fs.subtitle}</p>
        <p className="text-[11.5px] leading-relaxed px-3" style={{ color: "#5a3c4a" }}>{fs.desc}</p>
        <pre className="text-[10.5px] mt-1 leading-snug whitespace-pre-wrap font-sans" style={{ color: `${ACCENT}99` }}>{fs.basis}</pre>
      </div>
    </div>
  );
}

function LifeFriendSinsalCard({ reading }: { reading: PositiveSinsalReading }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
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
              <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{s.meaning}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-center px-3" style={{ color: "#2a1722" }}>
          {reading.fallback}
        </p>
      )}
    </div>
  );
}

function FriendShiftTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#a16207", good: "#087f6f", normal: "#94a3b8", caution: "#ef4444",
  };
  const LABEL: Record<DaeunHighlight["rating"], string> = {
    gold: "빛나는", good: "좋은", normal: "보통", caution: "주의",
  };
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구 결이 바뀌는 시기 (대운) ─</p>
      <div className="grid grid-cols-4 gap-1.5">
        {list.slice(0, 8).map((d) => (
          <div key={d.age} className="rounded-lg p-2 text-center"
            style={{ background: `${COLOR[d.rating]}15`, border: `1px solid ${COLOR[d.rating]}50` }}>
            <div className="text-[10px]" style={{ color: "#5a3c4a" }}>{d.age}–{d.ageEnd}세</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: COLOR[d.rating] }}>{d.ganji}</div>
            <div className="text-[9px] mt-1" style={{ color: COLOR[d.rating] }}>{LABEL[d.rating]}</div>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] mt-3 leading-relaxed text-center" style={{ color: "#3a2530" }}>
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
    신강: { tag: "단단한 결", pattern: "친구를 이끌다 무거운 짐을 떠안고 지치는 결", recovery: "혼자 사색하는 시간으로 결이 회복", color: "#a16207" },
    중화: { tag: "균형의 결", pattern: "친구·자기 시간을 번갈아 가는 결 — 잘 지치지 않음", recovery: "평소 호흡 그대로가 회복", color: "#087f6f" },
    신약: { tag: "섬세한 결", pattern: "사람과의 결을 깊이 흡수해 짧은 시간에도 지치는 결", recovery: "조용한 자리·다정한 한 사람과의 시간으로 회복", color: "#a78bfa" },
    태약: { tag: "여린 결", pattern: "친구 결의 영향을 깊이 받아 자주 지치는 결", recovery: "안전한 가족 자리·짧은 휴식으로 결이 충전", color: "#7e22ce" },
    극약: { tag: "고요한 결", pattern: "사람의 결을 매우 깊이 흡수해 빠르게 지치는 결", recovery: "혼자 머무는 자리·따뜻한 음식·푹 자기로 회복", color: "#2563eb" },
  };
  const level = dms?.level ?? "중화";
  const p = PATTERN[level] ?? PATTERN.중화;
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 친구들 속에서 지치는 패턴 ─</p>
      <div className="rounded-xl p-3 mb-3" style={{ background: "#ffffff", border: `1px solid ${p.color}40` }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[11px]" style={{ color: p.color }}>신강·신약</span>
          <span className="text-[16px] font-bold" style={{ color: p.color }}>{level} — {p.tag}</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{p.pattern}</p>
      </div>
      <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(8,127,111,0.28)" }}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[11px]" style={{ color: "#087f6f" }}>회복 결</span>
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{p.recovery}</p>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-2" style={{ color: ACCENT }}>─ 진짜 빛날 분야 ─</p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 20} viewBox={`0 0 ${SIZE} ${SIZE + 20}`}>
          {[0.25, 0.5, 0.75, 1.0].map((s, gi) => (
            <polygon key={gi} points={gridPts(s)} fill="none"
              stroke={s === 1.0 ? "rgba(184,134,70,0.4)" : "rgba(184,134,70,0.18)"}
              strokeWidth={s === 1.0 ? 1.2 : 0.8} />
          ))}
          {items.map((_, i) => {
            const [x, y] = pt(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(184,134,70,0.25)" strokeWidth="1" />;
          })}
          <polygon points={dataPts} fill={`${ACCENT}30`} stroke={ACCENT} strokeWidth="2.2" strokeLinejoin="round" />
          {items.map((it, i) => {
            const [lx, ly] = pt(i, LO);
            const isTop = it.name === top?.name;
            const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
            return (
              <g key={i}>
                <text x={lx} y={ly - 4} textAnchor={anchor} fontSize="12" fontWeight={isTop ? "bold" : "normal"} fill={isTop ? GOLD : "#2a1722"}>{it.shortName}</text>
                <text x={lx} y={ly + 10} textAnchor={anchor} fontSize="10" fill="#5a3c4a">{it.score}%</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 rounded-xl p-3" style={{ background: "#ffffff", border: `1px solid ${GOLD}40` }}>
        <p className="text-[11px]" style={{ color: GOLD }}>가장 빛나는 결</p>
        <p className="text-[14px] font-bold mt-0.5" style={{ color: GOLD }}>{top?.name}</p>
        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "#2a1722" }}>{top?.desc}</p>
      </div>
    </div>
  );
}

function WeaponCard({ saju, dom }: { saju: SajuAnalysis; dom: DominantMeaning }) {
  const ilju = (() => { try { return getIljuInfo(saju); } catch { return null; } })();
  const HUE = ELEM_COLORS[dom.element] ?? GOLD;
  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl p-4 text-center" style={{ background: "#ffffff", border: `1px solid ${HUE}40` }}>
        <p className="text-[11px]" style={{ color: HUE }}>{dom.title}</p>
        <p className="text-[28px] font-bold mt-1" style={{ color: HUE }}>{dom.element} ({dom.hanja})</p>
        <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: "#2a1722" }}>{dom.meaning}</p>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${HUE}30` }}>
          <p className="text-[11px] mb-1" style={{ color: HUE }}>자녀의 무기로 작용하는 이유</p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{dom.asset}</p>
        </div>
      </div>
      {ilju && (
        <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.28)" }}>
          <p className="text-[11px] text-center mb-2" style={{ color: "#7e22ce" }}>일주(日柱)에 새겨진 자녀의 핵</p>
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <div className="text-[28px] font-bold leading-none" style={{ color: "#7e22ce" }}>{ilju.hanja}</div>
              <p className="text-[10px] mt-1.5" style={{ color: "#7e22cecc" }}>{ilju.fusion}</p>
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
      <div className="rounded-xl p-3 text-[12px]" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}22`, color: `${ACCENT}99` }}>
        용신 정보 분석 중…
      </div>
    );
  }
  const HUE = ELEM_COLORS[m.element ?? "토"] ?? "#15803d";
  return (
    <div className="rounded-2xl p-4" style={{ background: "#ffffff", border: `1px solid ${HUE}40` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: HUE }}>─ 환하게 빛나게 해주는 결 한 가지 ─</p>
      <div className="text-center mb-3">
        <p className="text-[11px]" style={{ color: HUE }}>용신(用神) — 자녀를 살리는 결</p>
        <p className="text-[28px] font-bold mt-1" style={{ color: HUE }}>{m.element} ({m.hanja})</p>
      </div>
      <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: "#2a1722" }}>{m.meaning}</p>
      <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.92)", borderLeft: `3px solid ${HUE}` }}>
        <p className="text-[10.5px] mb-1" style={{ color: HUE }}>두 분이 자녀를 빛나게 해주실 길</p>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "#2a1722" }}>{m.guidance}</p>
      </div>
    </div>
  );
}

function ShineAgeTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#a16207", good: "#087f6f", normal: "#94a3b8", caution: "#94a3b8",
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 10·20·30대 어느 때 빛날까 ─</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {groupBest.map((g) => {
          const hue = g.hasGold ? COLOR.gold : g.hasGood ? COLOR.good : COLOR.normal;
          return (
            <div key={g.label} className="rounded-lg p-2 text-center" style={{ background: "#ffffff", border: `1px solid ${hue}50` }}>
              <div className="text-[11px] font-bold" style={{ color: hue }}>{g.label}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "#6b1e3a" }}>{g.from}–{g.to === 99 ? "" : g.to}세</div>
              <div className="text-[14px] font-bold mt-1" style={{ color: hue }}>{g.hasGold ? "★" : g.hasGood ? "✦" : "·"}</div>
              {g.best && <div className="text-[9px] mt-0.5" style={{ color: "#5a3c4a" }}>{g.best.ganji}</div>}
            </div>
          );
        })}
      </div>
      <p className="text-[11.5px] leading-relaxed text-center" style={{ color: "#3a2530" }}>
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
  // ⭐ G19 — 메인 인자(관성·인성·비겁) 모두 옅으면 보류 카드
  if (gwansong + insong + bigeop < 1) {
    return <InsufficientChartCard title="리더로 클까, 전문가로 클까" reason="관성·인성·비겁이 모두 옅어, 리더와 전문가를 한쪽으로 단정하기 어려운 양면형이에요. 자라면서 두 결을 다 경험하게 해주세요." />;
  }
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 리더 vs 전문가 ─</p>
      <DualGauge
        leftLabel="리더형" leftPct={leaderPct} leftColor="#a16207"
        rightLabel="전문가형" rightColor="#7e22ce"
        hint={hint}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
        <div className="rounded-lg p-2" style={{ background: "#ffffff", border: "1px solid rgba(161,98,7,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#a16207" }}>리더형 키</div>
          <div style={{ color: "#3a2530" }}>방향·결단·사람 끌기</div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.25)" }}>
          <div className="font-bold mb-1" style={{ color: "#7e22ce" }}>전문가형 키</div>
          <div style={{ color: "#3a2530" }}>탐구·깊이·정밀함</div>
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
      <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.92)" }}>
        <p className="text-[11.5px] font-bold mb-1" style={{ color: rel.color }}>{rel.label}</p>
        <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{rel.detail}</p>
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
          parentColor="#2563eb"
        />
      )}
      {!meta.hasMom && !meta.hasDad && (
        <p className="text-[12px] text-center" style={{ color: "#6b1e3a" }}>부모 정보가 입력되지 않았습니다.</p>
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
          stroke={s === 1.0 ? "rgba(184,134,70,0.4)" : "rgba(184,134,70,0.18)"}
          strokeWidth={s === 1.0 ? 1.2 : 0.8} />
      ))}
      {ELEM_ORDER.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(184,134,70,0.25)" strokeWidth="1" />;
      })}
      {mN && <polygon points={dataPts(mN)} fill={`${ACCENT}25`} stroke={ACCENT} strokeWidth="1.8" strokeLinejoin="round" strokeDasharray="3,3" />}
      {dN && <polygon points={dataPts(dN)} fill="rgba(126,182,255,0.20)" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round" strokeDasharray="3,3" />}
      <polygon points={dataPts(cN)} fill={`${GOLD}30`} stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
      {ELEM_ORDER.map((el, i) => {
        const [lx, ly] = pt(i, LO);
        const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
        return (
          <g key={i}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize="20" fontWeight="bold" fill={ELEM_COLORS[el]}>{ELEM_HANJA[el]}</text>
            <text x={lx} y={ly + 12} textAnchor={anchor} fontSize="10" fill="#5a3c4a">{ELEM_DESC[el]}</text>
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
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
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
        {meta.hasDad && <span style={{ color: "#2563eb" }}>┄┄ 아빠</span>}
      </div>
      {cmp && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ background: "rgba(125,211,192,0.08)", border: "1px solid rgba(125,211,192,0.3)" }}>
            <div className="text-[10px]" style={{ color: "#087f6f" }}>가장 닮은 결</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: "#087f6f" }}>{cmp.similar.emoji} {cmp.similar.kor}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "#5a3c4a" }}>평균 {cmp.similar.avgPct}%</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.3)" }}>
            <div className="text-[10px]" style={{ color: "#fb923c" }}>가장 다른 결</div>
            <div className="text-[14px] font-bold mt-0.5" style={{ color: "#fb923c" }}>{cmp.different.emoji} {cmp.different.kor}</div>
            <div className="text-[10px] mt-0.5" style={{ color: "#5a3c4a" }}>{cmp.different.parentPct}% vs {cmp.different.childPct}%</div>
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
          <p className="text-[12px] font-bold mb-1" style={{ color: "#15803d" }}>채워줄 결 (用神) — {y.element} ({y.hanja})</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{y.guidance}</p>
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
            <p className="text-[11.5px]" style={{ color: "#5a3c4a" }}>두 결의 흐름이 비슷해 채워주기보단 같은 결을 함께 가는 사이입니다.</p>
          )}
        </div>
      )}
      {flowDad && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(126,182,255,0.10)", border: "1px solid rgba(126,182,255,0.4)" }}>
          <p className="text-[12px] font-bold mb-2" style={{ color: "#2563eb" }}>아빠가 채워주는 결</p>
          {flowDad.parentGives.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {flowDad.parentGives.map((pg) => (
                <span key={pg.elem} className="px-2 py-1 rounded-full text-[11px]" style={{ background: `${ELEM_COLORS[pg.elem]}20`, color: ELEM_COLORS[pg.elem], border: `1px solid ${ELEM_COLORS[pg.elem]}50` }}>
                  {pg.emoji} {pg.kor} +{pg.intensity}%
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px]" style={{ color: "#5a3c4a" }}>두 결의 흐름이 비슷해 채워주기보단 같은 결을 함께 가는 사이입니다.</p>
          )}
        </div>
      )}
      {flowMom?.overlapLabel && (
        <div className="rounded-lg px-3 py-2 text-[11.5px]" style={{ background: "rgba(251,191,36,0.08)", borderLeft: "3px solid #a16207", color: "#2a1722" }}>
          ✦ {flowMom.overlapLabel}
        </div>
      )}
      {(flowMom?.bothLack && flowMom.bothLack.length > 0) && (
        <div className="rounded-2xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-[12px] font-bold mb-1.5" style={{ color: "#c8203a" }}>두 분과 자녀 모두 약한 결 — 외부 자원으로 채울 결</p>
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
          <p className="text-[12px] font-bold mb-1" style={{ color: "#c8203a" }}>살펴줄 결 (忌神) — {g.element} ({g.hanja})</p>
          <p className="text-[12px] leading-relaxed" style={{ color: "#2a1722" }}>{g.caution}</p>
        </div>
      )}
    </div>
  );
}

function ExternalBoostCard({ saju }: { saju: SajuAnalysis }) {
  const reading = inferPositiveSinsal(saju);
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 부모 외 인생에 큰 힘이 되어줄 어른 ─</p>
      <p className="text-[11.5px] leading-relaxed text-center mb-3 px-2" style={{ color: "#3a2530" }}>
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
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#2a1722" }}>{s.meaning}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-center px-3" style={{ color: "#2a1722" }}>{reading.fallback}</p>
      )}
      <div className="mt-3 rounded-lg p-3" style={{ background: "rgba(255,235,228,0.5)", borderLeft: `3px solid ${ACCENT}` }}>
        <p className="text-[11.5px] leading-relaxed" style={{ color: "#2a1722" }}>
          학교 선생님 · 동네 어른 · 친척 중 자녀와 결이 잘 통하는 분이 있다면, 그 인연이 자녀의 평생 자산이 됩니다. 부모는 그 길을 막지 않고 열어주실 때 자녀의 결이 가장 풍부해집니다.
        </p>
      </div>
    </div>
  );
}

function BondAgeTimeline({ list }: { list: DaeunHighlight[] }) {
  const COLOR: Record<DaeunHighlight["rating"], string> = {
    gold: "#a16207", good: "#087f6f", normal: "#94a3b8", caution: "#ef4444",
  };
  // 부모-자녀 결이 가장 통하는 시기 = good/gold 대운, 단 0~30세 안 (부모 양육 활성기)
  const bondCandidates = list.filter((d) => d.age <= 30 && (d.rating === "gold" || d.rating === "good"));
  const top = bondCandidates[0] ?? list[0];
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[14px] tracking-[0.15em] text-center font-semibold mb-3" style={{ color: ACCENT }}>─ 부모와 마음이 가장 통하는 나이 ─</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {list.slice(0, 4).map((d) => (
          <div key={d.age} className="rounded-lg p-2 text-center"
            style={{ background: `${COLOR[d.rating]}15`, border: `1px solid ${COLOR[d.rating]}50` }}>
            <div className="text-[10px]" style={{ color: "#5a3c4a" }}>{d.age}–{d.ageEnd}세</div>
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
          <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "#2a1722" }}>
            이 시기에 자녀가 부모 결을 가장 따뜻하게 받아들입니다 — 결정·진로·관계 이야기를 깊이 나누기 좋은 때입니다.
          </p>
        </div>
      )}
    </div>
  );
}

function OutroCard({ text, childName, honorific, hasMom = true, hasDad = true }: { text?: string; childName: string; honorific: string; hasMom?: boolean; hasDad?: boolean }) {
  const childLabel = `${childName}${honorific}`;
  // 단일 부모 입력 시 해당 부모 호칭만 노출
  const parentSalutation = hasMom && hasDad ? "어머님, 아버님" : hasMom ? "어머님" : hasDad ? "아버님" : "보호자님";
  const parentNominative = hasMom && hasDad ? "두 분이" : hasMom ? "어머님이" : hasDad ? "아버님이" : "보호자님이";
  const parentGenitive = hasMom && hasDad ? "두 분의" : hasMom ? "어머님의" : hasDad ? "아버님의" : "보호자님의";

  // LLM 당부 본문 — ## 헤더(자도인의 마지막 당부) + ※ 푸터 strip → 본문만 남김
  const cleanedLLMText = (text ?? "")
    .replace(/^##\s*자도인의\s*마지막\s*당부\s*\n+/m, "")
    .replace(/※\s*본\s*풀이는[^\n]*/g, "")
    .trim();

  return (
    <div className="space-y-3">
      {/* 박스 1: 자도인 인사 + LLM 당부 본문 (정적 환영 인사 → LLM 본문으로 교체) */}
      <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: `1px solid ${ACCENT}40` }}>
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-[22px] font-bold mb-3"
          style={{ background: `${ACCENT}22`, color: ACCENT, border: `1px solid ${ACCENT}66` }}>慈</div>
        <p className="text-[13px] font-bold mb-3 text-center" style={{ color: GOLD }}>자도인(慈道人)의 마지막 당부</p>
        <div className="text-[13px] leading-[1.95]" style={{ color: "#2a1722", fontFamily: "'Noto Serif KR', 'Gowun Batang', serif" }}>
          {cleanedLLMText
            ? renderParagraphs(cleanedLLMText)
            : (
              <p className="text-center text-[12.5px] leading-[1.85]">
                {parentSalutation} — <strong style={{ color: GOLD }}>{childLabel}</strong>의 사주를 함께 들여다봐주셔서 감사합니다.
              </p>
            )}
        </div>
      </div>
      {/* 박스 2: 의도 설명 — 정적 */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${ACCENT}22` }}>
        <p className="text-[12.5px] leading-[1.85]" style={{ color: "#2a1722" }}>
          이 풀이는 자녀를 <strong style={{ color: GOLD }}>틀에 가두기 위한 지도</strong>가 아닙니다.<br />
          오히려 자녀 안에 이미 있는 결을 {parentNominative} 더 잘 알아봐주시고, 자녀의 호흡에 맞춰 다가가시기 위한 <strong style={{ color: GOLD }}>가이드</strong>입니다.
        </p>
      </div>
      {/* 박스 3: 마무리 인사 — 정적 */}
      <div className="rounded-2xl p-4 text-center" style={{ background: "#ffffff", border: `1px solid ${GOLD}40` }}>
        <p className="text-[12.5px] leading-[1.85] italic" style={{ color: GOLD }}>
          <strong>{childLabel}</strong>의 결이 {parentGenitive} 따뜻한 시선 속에서 활짝 펼쳐지길 바랍니다.
        </p>
        <p className="text-[11px] mt-3" style={{ color: `${GOLD}aa` }}>— 자도인 慈道人 —</p>
      </div>
    </div>
  );
}

// (제거됨) ParentCompareCard — 7장 visualKey가 ch7-ilgan-rel(IlganRelationCard 풀카드)로 교체되어 미사용

// ─── IntroSummaryV2 — Part 00 들어가며 단일 스크롤 (설계도 7가지 요약) ────────
// 자도인 도입 텍스트 + ①~⑦ 7섹션 시각 + 8장 목차 카드.
// 자세한 풀이는 2장 이후 챕터에서. 들어가며는 미리보기·요약만.
function IntroSummaryV2({
  sajuChild,
  childName,
  honorific,
  onStart,
  hasMom,
  hasDad,
}: {
  sajuChild: SajuAnalysis;
  childName: string;
  honorific: string;
  onStart: () => void;
  hasMom: boolean;
  hasDad: boolean;
}) {
  const ch6Title = "엄마아빠와 우리 셋의 결";
  const childLabel = `${childName}${honorific}`;
  const ilgan = sajuChild.ilgan;
  const ilji = sajuChild.pillars.day.branch;
  const ilganHanja = STEM_HANJA[ilgan as keyof typeof STEM_HANJA] ?? ilgan;
  const iljiHanja = BRANCH_HANJA[ilji as keyof typeof BRANCH_HANJA] ?? ilji;
  const childIlju = (() => { try { return getIljuInfo(sajuChild); } catch { return null; } })();
  const sipCounts = (() => { try { return getSipseongCounts(sajuChild); } catch { return null; } })();
  const dms = (() => {
    try {
      return getDayMasterStrength(
        sajuChild.ilgan,
        sajuChild.pillars.month.branch,
        [
          sajuChild.pillars.year.branch,
          sajuChild.pillars.month.branch,
          sajuChild.pillars.day.branch,
          ...(sajuChild.pillars.hour ? [sajuChild.pillars.hour.branch] : []),
        ],
        [
          sajuChild.pillars.year.stem,
          sajuChild.pillars.month.stem,
          ...(sajuChild.pillars.hour ? [sajuChild.pillars.hour.stem] : []),
        ],
      );
    } catch { return null; }
  })();
  const guardianSinsals = (sajuChild.sinsal || []).filter(
    (n) => SINSAL_INFO[n]?.category === "귀인",
  );
  const daeunList = sajuChild.daeun?.cycles ?? [];

  const sectionDivider = (
    <div className="my-6 flex items-center gap-3 px-2">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(184,134,70,0.4), transparent)" }} />
      <span style={{ fontSize: 10, color: "#b88646" }}>✦</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(184,134,70,0.4), transparent)" }} />
    </div>
  );

  const STRENGTH_LABELS = ['극약', '태약', '신약', '중화', '신강', '태강', '극왕'] as const;

  // 7가지 인자 도입 멘트 (요약용)
  const FACTORS = [
    { num: "①", name: "오행", subtitle: "어떤 기운으로 채워진 아이인가" },
    { num: "②", name: "십성", subtitle: "세상을 어떻게 받아들이는 아이인가" },
    { num: "③", name: "신강·신약", subtitle: "에너지의 방향과 균형" },
    { num: "④", name: "용신·기신", subtitle: "이 아이에게 맞는 것과 맞지 않는 것" },
    { num: "⑤", name: "대운", subtitle: "앞으로 어떤 흐름이 펼쳐지는가" },
    { num: "⑥", name: "귀인", subtitle: "어떤 인연이 이 아이를 돕는가" },
    { num: "⑦", name: "일주", subtitle: "이 아이의 가장 근본적인 결" },
  ];

  return (
    <div className="space-y-1 py-4">
      {/* 자도인 도입 — 설계도 7가지 */}
      <section className="space-y-4 py-4">
        <p className="text-[17px] leading-[2.1]" style={{ color: "#1a0a14" }}>
          아이를 제대로 이해하려면, 먼저 <strong style={{ color: GOLD }}>원국</strong>부터 봐야 해요.
        </p>
        <p className="text-[17px] leading-[2.1]" style={{ color: "#1a0a14" }}>
          원국은 <strong style={{ color: GOLD }}>{childLabel}</strong>이 태어날 때부터 가지고 온 <strong style={{ color: ACCENT }}>설계도</strong>예요.
        </p>
        <p className="text-[17px] leading-[2.1]" style={{ color: "#1a0a14" }}>
          저는 이 설계도를 <strong style={{ color: GOLD }}>7가지</strong>로 나눠 읽어요.
        </p>
        <div className="rounded-xl p-4 space-y-2.5" style={{ background: "#ffffff", border: `1px solid ${GOLD}33` }}>
          {FACTORS.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[14px] font-bold" style={{ color: GOLD, minWidth: 20 }}>{f.num}</span>
              <div className="flex-1">
                <span className="text-[13.5px] font-bold" style={{ color: GOLD }}>{f.name}</span>
                <span className="text-[12.5px]" style={{ color: "#3a2530" }}> — {f.subtitle}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[17px] leading-[2.1] italic" style={{ color: "#1a0a14" }}>
          이 일곱 가지를 먼저 이해하면, 이후 모든 챕터가 하나의 이야기로 연결돼요.
        </p>
      </section>

      {sectionDivider}

      {/* ① 오행 */}
      <section className="space-y-3 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>①</span>
          <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>오행 — 다섯 가지 자연의 결</h3>
        </div>
        <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>어떤 기운으로 채워진 아이인가</p>
        <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(212,169,107,0.3)" }}>
          <ElementsRadar elements={sajuChild.elements as Record<string, number>} />
        </div>
        <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(212,169,107,0.3)" }}>
          <SpectrumTable elements={sajuChild.elements as Record<string, number>} />
        </div>
        <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(8,127,111,0.28)" }}>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
            <span className="text-[10px] mr-1" style={{ color: "#087f6f" }}>요약</span>
            가장 강한 기운은 <strong>{childLabel}</strong>의 일상에서 가장 두드러지는 결이고, 약한 기운은 부모가 채워주면 좋은 결이에요.
          </p>
        </div>
      </section>

      {sectionDivider}

      {/* ② 십성 */}
      {sipCounts && (
        <>
          <section className="space-y-3 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>②</span>
              <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>십성 — 10가지 성향의 지도</h3>
            </div>
            <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>세상을 어떻게 받아들이는 아이인가</p>
            <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(212,169,107,0.3)" }}>
              <SipseongRadar counts={sipCounts} />
            </div>
            <div className="rounded-2xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(212,169,107,0.3)" }}>
              <SipseongSpectrumTable counts={sipCounts} />
            </div>
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.28)" }}>
              <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
                <span className="text-[10px] mr-1" style={{ color: "#a78bfa" }}>요약</span>
                강한 결은 자녀가 자연스럽게 드러내는 성향이고, 약한 결은 부모가 살짝 보태주면 좋은 자리예요.
              </p>
            </div>
          </section>

          {sectionDivider}
        </>
      )}

      {/* ③ 신강·신약 */}
      {dms && (
        <>
          <section className="space-y-3 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>③</span>
              <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>신강·신약 — 에너지의 균형</h3>
            </div>
            <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>에너지의 방향과 균형</p>
            <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid rgba(161,98,7,0.28)" }}>
              <p className="text-[11px] mb-2 text-center" style={{ color: "#5a3c4a" }}>일간 기운 총량</p>
              <div className="relative h-8 rounded-full overflow-hidden" style={{
                background: "linear-gradient(to right, #ef4444, #a16207, #34d399, #34d399, #a16207, #ef4444)",
              }}>
                <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${(dms.positionIdx / 6) * 100}%`, transform: "translateX(-50%)" }}>
                  <div className="w-3 h-10 rounded-sm border-2" style={{ background: "white", borderColor: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
                </div>
              </div>
              <div className="flex justify-between text-[9px] mt-2" style={{ color: "#6b1e3a" }}>
                {STRENGTH_LABELS.map((label, i) => (
                  <span key={i} style={{ color: i === dms.positionIdx ? GOLD : "#8a6878", fontWeight: i === dms.positionIdx ? "bold" : "normal" }}>
                    {label}
                  </span>
                ))}
              </div>
              <p className="text-[12.5px] mt-3 text-center" style={{ color: "#2a1722" }}>
                <strong style={{ color: GOLD }}>{childLabel}</strong>은(는) <strong style={{ color: GOLD }}>{dms.level}</strong> 사주예요.
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(161,98,7,0.28)" }}>
              <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
                <span className="text-[10px] mr-1" style={{ color: "#a16207" }}>요약</span>
                기운이 강한 아이는 자기 의지로 끌고 가는 결, 약한 아이는 받아들이고 적응하는 결이에요.
              </p>
            </div>
          </section>

          {sectionDivider}
        </>
      )}

      {/* ④ 용신·기신 */}
      <section className="space-y-3 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>④</span>
          <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>용신·기신 — 채워줄 결, 살펴줄 결</h3>
        </div>
        <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>이 아이에게 맞는 것과 맞지 않는 것</p>
        <YongsinCard saju={sajuChild} />
        <GisinCard saju={sajuChild} />
        <div className="rounded-xl p-3 space-y-2" style={{ background: "#ffffff", border: "1px solid rgba(21,128,61,0.28)" }}>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: "#15803d" }}>용신(用神)</strong>은 자녀에게 <em>약처럼 작용하는 결</em>이에요. 부족한 자리를 채워주는 기운.
          </p>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: "#c8203a" }}>기신(忌神)</strong>은 자녀를 <em>지치게 하는 결</em>이에요. 너무 많아지면 결이 흔들리는 기운.
          </p>
          <p className="text-[12px] leading-[1.75] pt-1" style={{ color: "#2a1722", borderTop: "1px solid rgba(126,218,126,0.2)" }}>
            <span className="text-[10px] mr-1" style={{ color: "#15803d" }}>요약</span>
            <strong style={{ color: "#15803d" }}>채워줄 결</strong>은 부모가 양육에서 보태주면 자녀가 가장 빛나는 결, <strong style={{ color: "#c8203a" }}>살펴줄 결</strong>은 너무 많아지지 않게 살펴주면 좋은 결이에요.
          </p>
        </div>
      </section>

      {sectionDivider}

      {/* ⑤ 대운 */}
      {daeunList.length > 0 && (
        <>
          <section className="space-y-3 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>⑤</span>
              <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>대운 — 시간의 흐름</h3>
            </div>
            <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>앞으로 어떤 흐름이 펼쳐지는가</p>
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(37,99,235,0.28)" }}>
              <div className="grid grid-cols-4 gap-2">
                {daeunList.slice(0, 8).map((c, i) => {
                  const stemH = STEM_HANJA[c.stem as keyof typeof STEM_HANJA] ?? c.stem;
                  const branchH = BRANCH_HANJA[c.branch as keyof typeof BRANCH_HANJA] ?? c.branch;
                  return (
                    <div key={i} className="rounded-lg p-2 text-center" style={{
                      background: "#ffffff",
                      border: "1px solid rgba(96,165,250,0.2)",
                    }}>
                      <p className="text-[9px]" style={{ color: "#60a5fa" }}>{c.age}세~</p>
                      <p className="text-[16px] font-bold mt-1" style={{ color: GOLD, fontFamily: "serif" }}>{stemH}</p>
                      <p className="text-[16px] font-bold" style={{ color: GOLD, fontFamily: "serif" }}>{branchH}</p>
                      <p className="text-[8.5px] mt-1" style={{ color: "#6b1e3a" }}>{c.stem}{c.branch}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(37,99,235,0.28)" }}>
              <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
                <span className="text-[10px] mr-1" style={{ color: "#60a5fa" }}>요약</span>
                10년마다 자녀의 결이 어떻게 바뀌는지 미리 알면, 양육의 호흡을 맞춰가기 좋아요.
              </p>
            </div>
          </section>

          {sectionDivider}
        </>
      )}

      {/* ⑥ 귀인 */}
      <section className="space-y-3 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>⑥</span>
          <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>귀인 — 인생을 도와주는 별</h3>
        </div>
        <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>어떤 인연이 이 아이를 돕는가</p>
        {guardianSinsals.length > 0 ? (
          <div className="space-y-2">
            {guardianSinsals.map((name, i) => {
              const info = SINSAL_INFO[name];
              if (!info) return null;
              return (
                <div key={i} className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(161,98,7,0.28)" }}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[16px]">{info.icon}</span>
                    <p className="text-[14px] font-bold" style={{ color: "#a16207" }}>{name}</p>
                    <p className="text-[10px]" style={{ color: "#6b1e3a" }}>({info.hanja})</p>
                  </div>
                  <p className="text-[11.5px] mb-1" style={{ color: "#5a3c4a", fontStyle: "italic" }}>{info.subtitle}</p>
                  <p className="text-[12px] leading-[1.7]" style={{ color: "#2a1722" }}>{info.desc}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(184,134,70,0.2)" }}>
            <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
              <strong>{childLabel}</strong>의 사주에는 특별한 귀인 신살은 없어요. 대신 <strong>스스로 일으키는 자수성가형</strong>의 결이 강합니다.
            </p>
          </div>
        )}
        <div className="rounded-xl p-3" style={{ background: "#ffffff", border: "1px solid rgba(161,98,7,0.28)" }}>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#2a1722" }}>
            <span className="text-[10px] mr-1" style={{ color: "#a16207" }}>요약</span>
            귀인은 살아가면서 자녀에게 손을 내밀어주는 인연들이에요.
          </p>
        </div>
      </section>

      {sectionDivider}

      {/* ⑦ 일주 */}
      <section className="space-y-3 py-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px] font-bold" style={{ color: "#1a0a14" }}>⑦</span>
          <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>일주 — 가장 근본적인 결</h3>
        </div>
        <p className="text-[12px] italic" style={{ color: "#5a3c4a" }}>이 아이의 가장 근본적인 결</p>
        <div className="text-center py-2">
          <div className="text-[48px] font-bold leading-none" style={{ color: GOLD, fontFamily: "serif", textShadow: `0 0 16px ${GOLD}40` }}>
            {ilganHanja}{iljiHanja}
          </div>
          <p className="text-[12px] mt-2" style={{ color: `${ACCENT}cc` }}>{ilgan}{ilji}</p>
        </div>
        <IljuSubsectionBanner childIlju={childIlju} />
        <IljuCard saju={sajuChild} />
        <div className="rounded-xl p-3 space-y-2" style={{ background: "#ffffff", border: "1px solid rgba(126,34,206,0.28)" }}>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: "#7e22ce" }}>일주(日柱)</strong>는 사주 네 기둥 중 자녀 본인을 나타내는 가장 핵심 기둥이에요. <strong>{childLabel}</strong>의 성격·기질이 가장 진하게 드러나는 자리.
          </p>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: "#7e22ce" }}>일간(日干)</strong>은 일주의 위 글자 — 자녀의 <em>타고난 본질·바탕 기운</em>이에요. 변하지 않는 결.
          </p>
          <p className="text-[12px] leading-[1.75]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: "#7e22ce" }}>일지(日支)</strong>는 일주의 아래 글자 — 자녀가 <em>일상에서 살아내는 호흡·마음 속 자리</em>예요. 매일의 결.
          </p>
          <p className="text-[12px] leading-[1.75] pt-1" style={{ color: "#2a1722", borderTop: "1px solid rgba(200,156,255,0.2)" }}>
            <span className="text-[10px] mr-1" style={{ color: "#7e22ce" }}>요약</span>
            일간은 <strong>{childLabel}</strong>이 어떤 결로 태어났는가, 일지는 그 결이 매일 어떻게 펼쳐지는가를 말해줘요.
          </p>
        </div>
      </section>

      {sectionDivider}

      {/* 보고서 안내 — 7장 목차 */}
      <section className="space-y-3 py-4">
        <p className="text-[14px] tracking-[0.15em] text-center font-semibold" style={{ color: GOLD }}>─ 보고서 안내 ─</p>
        <p className="text-[12.5px] leading-[1.7] text-center" style={{ color: "#2a1722" }}>
          이 보고서는 총 <strong style={{ color: GOLD }}>7장</strong>으로 구성되어 있어요.
        </p>
        <div className="rounded-xl p-4 mt-2 space-y-2" style={{ background: "#ffffff", border: `1px solid ${GOLD}33` }}>
          {[
            { num: "1장", title: "우리 아이는 어떤 아이일까" },
            { num: "2장", title: "우리 아이는 어떻게 공부할까" },
            { num: "3장", title: "우리 아이 칭찬하고 혼내는 법" },
            { num: "4장", title: "친구 사이 우리 아이" },
            { num: "5장", title: "우리 아이는 무엇으로 빛날까" },
            { num: "6장", title: ch6Title },
            { num: "마지막", title: "자도인의 마지막 당부" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 px-1">
              <span className="text-[11px] font-bold w-12 text-center rounded px-1.5 py-0.5" style={{ color: GOLD, background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>{c.num}</span>
              <span className="text-[12.5px]" style={{ color: "#2a1722" }}>{c.title}</span>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] leading-[1.7] text-center italic mt-3" style={{ color: "#2a1722" }}>
          그럼 이제, 자도인과 함께 <strong style={{ color: GOLD }}>{childLabel}</strong>의 사주를 펼쳐볼까요?
        </p>
      </section>
    </div>
  );
}

// ─── renderVisualByKey — visualKey → 시각 컴포넌트 매핑 (단일 라우터) ─────────
function renderVisualByKey(visualKey: string | undefined, meta: MetaEvent | null) {
  if (!meta || !visualKey) return null;
  switch (visualKey) {
    case "elements":
      return (
        <div className="space-y-2">
          <ElementsRadar elements={meta.sajuChild.elements as Record<string, number>} />
          <SpectrumTable elements={meta.sajuChild.elements as Record<string, number>} />
        </div>
      );
    case "sipseong":
      return (
        <div className="space-y-2">
          <SipseongRadar counts={getSipseongCounts(meta.sajuChild)} />
          <SipseongSpectrumTable counts={getSipseongCounts(meta.sajuChild)} />
        </div>
      );
    case "ilju":
      return (
        <div className="space-y-3">
          <IljuSubsectionBanner childIlju={(() => { try { return getIljuInfo(meta.sajuChild); } catch { return null; } })()} />
          <IljuCard saju={meta.sajuChild} />
        </div>
      );
    case "yongsin":
      return (
        <div className="space-y-3">
          <YongsinCard saju={meta.sajuChild} />
          <GisinCard saju={meta.sajuChild} />
        </div>
      );
    case "ch3-bigeop": return <BigeopFocusCard saju={meta.sajuChild} />;
    case "ch3-insong": return <InsongLearnCard saju={meta.sajuChild} />;
    case "ch3-siksang": return <SiksangExpressionCard saju={meta.sajuChild} />;
    case "ch3-timeslot": return <TimeSlotGauge saju={meta.sajuChild} />;
    case "ch3-thinking": return <ThinkingMatrix tt={inferThinkingType(meta.sajuChild)} />;
    case "ch4-tantrum": return <TantrumBars triggers={inferTantrumTriggers(meta.sajuChild)} />;
    case "ch4-calm-env": return <EmotionCalmEnvCard saju={meta.sajuChild} />;
    case "ch4-praise": return <PraiseCompareCard saju={meta.sajuChild} />;
    case "ch4-lie": return <LieResponseCard saju={meta.sajuChild} />;
    case "ch4-breakdown": return <BreakdownTriggerCard saju={meta.sajuChild} />;
    case "ch5-heart-door": return <HeartDoorCard saju={meta.sajuChild} />;
    case "ch5-style": return <FriendStyleQuadrant fs={inferFriendStyle(meta.sajuChild)} />;
    case "ch5-life-friend": return <LifeFriendSinsalCard reading={inferPositiveSinsal(meta.sajuChild)} />;
    case "ch5-friend-shift": return <FriendShiftTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />;
    case "ch5-fatigue": return <FatiguePatternCard saju={meta.sajuChild} />;
    case "ch6-job-radar": return <JobRadarCard items={inferJobRadar(meta.sajuChild)} />;
    case "ch6-weapon": return <WeaponCard saju={meta.sajuChild} dom={inferDominantMeaning(meta.sajuChild)} />;
    case "ch6-shine-key": return <ShineKeyCard saju={meta.sajuChild} />;
    case "ch6-shine-age": return <ShineAgeTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />;
    case "ch6-leader-expert": return <LeaderExpertCard saju={meta.sajuChild} />;
    case "ch7-ilgan-rel": return <FamilyIlganRelations meta={meta} />;
    case "ch7-trio-radar": return <TrioRadarCard meta={meta} />;
    case "ch7-flow": return <FlowFillCard meta={meta} />;
    case "ch7-external-boost": return <ExternalBoostCard saju={meta.sajuChild} />;
    case "ch7-bond-age": return <BondAgeTimeline list={evaluateDaeunTimeline(meta.sajuChild)} />;
    default: return null;
  }
}

// ─── ScrollChapterPage — 한 챕터의 sub들을 단일 스크롤로 렌더 ──────────────────
function ScrollChapterPage({
  spec,
  meta,
  slideTextMap,
  slideIdx,
  loading,
  childName,
  honorific,
}: {
  spec: SlideSpec;
  meta: MetaEvent;
  slideTextMap: SlideTextMap;
  slideIdx: number;
  loading: boolean;
  childName: string;
  honorific: string;
}) {
  const subs = spec.subs ?? [];
  return (
    <article className="space-y-5 py-1">
      {/* sub 섹션 반복 */}
      {subs.map((sub, i) => {
        const subText = getSubText(slideTextMap, slideIdx, sub.subtitle);
        return (
          <section key={i} className="space-y-3 pt-6 pb-2" style={{ borderTop: i === 0 ? "none" : `1px solid rgba(212,169,107,0.26)` }}>
            {/* 소제목 */}
            <div className="flex items-baseline">
              <h3 className="text-[20px] font-bold leading-tight" style={{ color: "#1a0a14", fontFamily: "'Nanum Myeongjo', 'Noto Serif KR', serif" }}>
                {sub.subtitle}
              </h3>
            </div>

            {/* 시각 */}
            {renderVisualByKey(sub.visualKey, meta)}

            {/* LLM 본문 */}
            <div
              className="text-[17px] leading-[2.1] rounded-md px-5 py-5"
              style={{
                color: "#1a0a14",
                fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
                background: "#ffffff",
                border: "1px solid rgba(212,169,107,0.34)",
                boxShadow: "0 18px 44px -30px rgba(106,30,58,0.38)",
              }}
            >
              {subText ? (
                renderParagraphs(subText)
              ) : loading ? (
                <div className="flex items-center gap-3 py-3">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: `${ACCENT}44`, borderTopColor: ACCENT }} />
                  <span className="text-[12px]" style={{ color: `${ACCENT}aa` }}>풀이 생성 중…</span>
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: `${ACCENT}88` }}>(이 소제목 본문이 아직 없어요)</p>
              )}
            </div>
          </section>
        );
      })}
    </article>
  );
}


