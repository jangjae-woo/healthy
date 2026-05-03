"use client";
// 자도인(慈道人) 엄마-아이 궁합 슬라이드 결과 컴포넌트
// 평생사주(SajuSlideResult) · 남녀궁합(MatchingSlideResult)과 완전 분리.
// 평생사주 코드는 단 한 줄도 건드리지 않음.

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  STEM_HANJA,
  BRANCH_HANJA,
  getDayMasterStrength,
  inferCrisisTiming,
  SINSAL_INFO,
  type SajuAnalysis,
  type CompatibilityResult,
  type DayMasterStrength,
  type CrisisTiming,
} from "@/lib/saju-calculator";
import {
  infer8Intelligences,
  evaluateDaeunTimeline,
  getSipseongCounts,
  SIPSEONG_DESC,
  inferThinkingType,
  inferJobRadar,
  inferFriendStyle,
  inferDisciplineChannels,
  inferDisciplineBasis,
  inferDangerCards,
  inferGuideHighlights,
  inferTantrumTriggers,
  inferFriendDistance,
  inferLifestyle,
  inferDigitalGauge,
  inferElementCompare,
  inferIlganRelation,
  inferFlowGiven,
  type IntelligenceCard,
  type DaeunHighlight,
  type SipseongCount,
  type ThinkingType,
  type JobRadarItem,
  type FriendStyle,
  type DisciplineChannel,
  type DangerCard,
  type GuideHighlight,
  type TantrumTrigger,
  type FriendDistance,
  type LifestyleChannel,
  type DigitalGauge,
  type ElementCompare,
  type IlganRelation,
  type FlowGiven,
} from "@/lib/parent-child-charts";
import {
  getIljuInfo,
  inferYongsinMeaning,
  inferDominantMeaning,
  inferPositiveSinsal,
  pickFamilySajaSeongeo,
  pickFamilyTrioSaja,
  getAnimalCharacter,
  type IljuInfo,
  type YongsinMeaning,
  type DominantMeaning,
  type PositiveSinsalReading,
  type FamilySajaSeongeo,
  type AnimalCharacter,
} from "@/lib/parent-child-traits";
import {
  getObservationGuide,
  type ObservationGuide,
} from "@/lib/parent-child-observation";
import { softenIlganRelation, softenIljiRelation, softenChungList, withChildHonorific, parentChildOneLiner } from "@/lib/wording";
import { ensureChildHonorific, softenNegatives, applyAllPostprocess } from "@/lib/text-postprocess";
import { buildChildSeed, ILGAN_METAPHOR, type ChildSeed } from "@/lib/child-seed";
import { calcGyeokguk, calcGongmang, calcGisin, calcGaeun, calcChildTiming, calcIljiRelation, calcParentSipseong, calcSharedSinsal, calcUnseong, calcCheonganHap, calcShipiShinsal, calcChildBranchHarmony, calcFamilyTrio, type GyeokgukResult, type GongmangResult, type GisinResult, type GaeunResult, type ChildTimingResult, type UnseongResult, type CheonganHapResult, type ShipiShinsalResult, type ChildBranchHarmonyResult, type FamilyTrioResult } from "@/lib/saju-traditional";
import { classifyAgeStage, type AgeStage } from "@/lib/age-stage";
import { M as ELEMENT_PRESCRIPTION_MATRIX, stageToTier, pickWeakestElement, type Element5 } from "@/lib/element-prescription";

const ACCENT = "#f0a8b8";  // 따뜻한 로즈 핑크
const GOLD = "#FFD700";
const BG = "#2a1a1d";
const BRIGHT = "#FFD700";

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

// ── 캐릭터 페어 (매칭 이미지 폴더 재활용) ──
const STEM_TO_ELEM: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};
function pickCharacterImage(ilganA: string, ilganB: string): string {
  const elA = STEM_TO_ELEM[ilganA] ?? "수";
  const elB = STEM_TO_ELEM[ilganB] ?? "수";
  const key = [elA, elB].sort().join("");
  const map: Record<string, string> = {
    목목: "001_캐릭터_목목.png", 목화: "002_캐릭터_목화.png", 목토: "003_캐릭터_목토.png",
    금목: "004_캐릭터_목금.png", 목수: "005_캐릭터_목수.png", 화화: "006_캐릭터_화화.png",
    토화: "007_캐릭터_화토.png", 금화: "008_캐릭터_화금.png", 수화: "009_캐릭터_화수.png",
    토토: "010_캐릭터_토토.png", 금토: "011_캐릭터_토금.png", 수토: "012_캐릭터_토수.png",
    금금: "013_캐릭터_금금.png", 금수: "014_캐릭터_금수.png", 수수: "015_캐릭터_수수.png",
  };
  return map[key] ?? "015_캐릭터_수수.png";
}
function characterPairTheme(ilganA: string, ilganB: string): string {
  const elA = STEM_TO_ELEM[ilganA] ?? "수";
  const elB = STEM_TO_ELEM[ilganB] ?? "수";
  const themes: Record<string, string> = {
    목목: "함께 자라는 두 그루의 나무",
    목화: "나무가 불을 살리는 인연",
    목토: "나무가 대지에 뿌리내리는 인연",
    금목: "도끼와 거목, 다듬어가는 인연",
    목수: "물이 나무를 키우는 인연",
    화화: "두 개의 빛, 마주 비추는 인연",
    토화: "불이 흙을 단단하게 하는 인연",
    금화: "용광로와 강철, 단련되는 인연",
    수화: "물과 불, 서로 다른 본성의 인연",
    토토: "두 산처럼 굳건한 인연",
    금토: "산속의 광맥, 보물 같은 인연",
    수토: "산과 호수, 마주 비추는 인연",
    금금: "두 자루의 검, 닮은 결의 인연",
    금수: "칼이 강물에 비치는 인연",
    수수: "두 강물이 합쳐지는 인연",
  };
  const key = [elA, elB].sort().join("");
  return themes[key] ?? "묘한 인연";
}

// ── 공유 카드 배경 (매칭 이미지 폴더 재활용) ──
function pickShareCardBg(score: number): string {
  if (score >= 90) return "074_공유_무드_황홀.png";
  if (score >= 80) return "068_공유_무드_화려.png";
  if (score >= 75) return "069_공유_무드_따뜻.png";
  if (score >= 70) return "071_공유_무드_시적.png";
  if (score >= 60) return "070_공유_무드_잔잔.png";
  return "075_공유_무드_고요.png";
}

// ── 슬라이드 구성 (13개) ── 친근 톤 + STS 스타일 시각화
// 슬라이드 종류 식별
type SlideKind =
  | "cover" | "intro" | "pillars" | "first-word"
  | "overview" | "heart" | "guide"
  | "mom" | "dad"
  | "talent" | "last-word" | "share";

interface SlideDef {
  kind: SlideKind;
  title: string;
  aiSectionIdx?: number;   // SECTION_HEADERS의 인덱스
  chartPages?: number;
  hue?: string;
  coverPage?: boolean;     // 섹션 시작 표지 페이지 추가 여부
}

// 섹션 표지 데이터 — 이모지 심볼 + 한글 강조 (kind별)
// ── 단계 1: 사주 근거 헤더 라벨 — 페이지마다 어떤 사주 차원인지 명시 (다양성 인지 ↑) ──
function sajuBasisLabel(
  kind: SlideKind | undefined,
  shiftedPage: number,
  isChartPage: boolean,
  aiText: string,
): string {
  if (!kind) return "";
  switch (kind) {
    case "first-word": return "🎴 일간 메타포";
    case "pillars": return "📜 사주 4기둥";
    case "last-word": return "📋 종합";
    case "overview":
      if (isChartPage && shiftedPage === 0) return "🌿 오행 (5원소 균형)";
      if (isChartPage && shiftedPage === 1) return "💠 십성 (10성 분포)";
      if (/###\s*기운\s*총량/.test(aiText)) return "⚖️ 신강·신약 (기운 총량)";
      if (/###\s*기질\s*5각도/.test(aiText)) return "🌿 오행 (분포 풀이)";
      if (/###\s*강점.{0,3}주의점/.test(aiText)) return "📋 종합 (오행+십성)";
      if (/###\s*격국/.test(aiText)) return "📍 격국 (인생 큰 그림)";
      if (/###\s*일주\s*캐릭터/.test(aiText)) return "🎴 일주 60갑자";
      return "";
    case "heart":
      // (폐기) 외향-내향 페이지 영구 폐기 — 음양 단독 풀이 X (전통 명리·시장 표준)
      // (폐기) 6요인 페이지 영구 폐기 — 5요인 모델 풍 비전통 + SSOT 위반 버그
      if (/###\s*다섯\s*색깔/.test(aiText)) return "💠 십성 (5분류)";
      if (/###\s*타고난\s*귀인/.test(aiText)) return "✨ 신살 (귀인·길성)";
      // (폐기) 타고난 신살 페이지 영구 폐기 — 귀인 페이지와 신살 중복 발견
      if (/###\s*회복과\s*환경/.test(aiText)) return "🌿 오행 (약 처방)";
      // (폐기) 살펴주면 좋은 결 페이지 영구 폐기 — 용신·기신·회복 페이지와 구조 중복
      if (/###\s*평생\s*빛나는/.test(aiText)) return "🎯❌ 용신·기신 (채움·살핌)";
      // (폐기) 보조로 빛나는 결 (희신) 페이지 영구 폐기 — 산출 룰 의문 + 본질 동어반복
      // (폐기) 공망 페이지 영구 폐기 — 마음 챕터 부적합 + 부모-자녀 양육 가치 낮음
      // (통합) 기신 페이지 폐기 — 용신 페이지에 흡수됨
      return "";
    case "guide":
      if (/###\s*친구\s*사귀는/.test(aiText)) return "💠 십성+오행 (친구 결)";
      if (/###\s*친구\s*갈등/.test(aiText)) return "🌿 오행+십성 (개입 거리)";
      if (/###\s*잠자리.{0,3}식습관/.test(aiText)) return "🌿 오행+십성 (생활 채널)";
      // (폐기) 디지털·미디어 페이지 영구 폐기 — 사주 근거와 디지털 위험도 상관관계 추정 수준
      if (/###\s*개운법|###\s*자녀의\s*개운/.test(aiText)) return "🌈 용신 (개운 비보)";
      if (/###\s*자녀에게\s*좋은\s*시간|###\s*일주\s*기반\s*일상/.test(aiText)) return "🕰️ 일간·일지 (시간 호흡)";
      if (/###\s*절대\s*하면\s*안/.test(aiText)) return "💠 십성 (약점 위험)";
      if (/###\s*사춘기에\s*결이\s*변하는/.test(aiText)) return "🔮 대운 (사춘기 시기)";
      if (/###\s*자녀\s*인생\s*흐름/.test(aiText)) return "🔮 대운 (인생 흐름)";
      return "";
    case "mom":
    case "dad":
      if (/###\s*(엄마|아빠)\s*vs\s*아이/.test(aiText)) return "🌿 오행 비교";
      if (/###\s*일간\s*관계/.test(aiText)) return "👁️ 일간 관계";
      if (/###\s*(엄마|아빠)와\s*자녀의\s*일지/.test(aiText)) return "🔗 일지 합·충 (일상 결)";
      if (/###\s*(엄마|아빠)가\s*자녀에게\s*주는\s*결/.test(aiText)) return "💠 부모 십성 (가족 명리)";
      if (/###\s*(엄마|아빠)와\s*자녀가\s*공유하는\s*결/.test(aiText)) return "✨ 공통 신살 (가족 별)";
      if (/###\s*(엄마|아빠)가\s*채워주는/.test(aiText)) return "🌿 오행 흐름";
      if (/###\s*(엄마|아빠)와\s*함께\s*채울/.test(aiText)) return "🌿 오행 공통";
      if (/###\s*잘\s*통하는\s*영역/.test(aiText)) return "🪄 결정론 매트릭스 (시너지)";
      if (/###\s*갈등이\s*반복/.test(aiText)) return "💠 십성 비교 (갈등)";
      if (/###\s*(엄마|아빠)가\s*의식적/.test(aiText)) return "🪄 결정론 매트릭스 (선물)";
      return "";
    case "talent":
      if (isChartPage) return "🪄 8지능 매트릭스";
      if (/###\s*타고난\s*재능/.test(aiText)) return "🪄 8지능 (오행+십성)";
      if (/###\s*호기심.{0,3}끌림/.test(aiText)) return "💠 식상+인성";
      if (/###\s*사고\s*유형/.test(aiText)) return "💠 십성 매트릭스";
      if (/###\s*학습\s*스타일/.test(aiText)) return "🌿 오행 (학습)";
      if (/###\s*효과적\s*학습/.test(aiText)) return "🌿 오행 (환경)";
      if (/###\s*진로\s*적합/.test(aiText)) return "🌿 오행 (진로 6각)";
      if (/###\s*격국.*직업|###\s*격국\s*기반/.test(aiText)) return "📍 격국 (직업 적성)";
      if (/###\s*진로\s*결정\s*시기/.test(aiText)) return "🔮 대운 (진로 시기)";
      return "";
    default: return "";
  }
}

const SECTION_COVER: Partial<Record<SlideKind, { partLabel: string; symbol: string; en: string; subtitle: string }>> = {
  overview: { partLabel: "Part 01", symbol: "🌱", en: "Our Child at a Glance", subtitle: "다섯 자연의 결과 마음의 색깔로 그려본 본질" },
  heart: { partLabel: "Part 02", symbol: "💗", en: "Child's Heart", subtitle: "감정과 기질이 흐르는 결의 자리" },
  guide: { partLabel: "Part 03", symbol: "🤝", en: "Parenting Guide", subtitle: "일상에서 함께 빚어가는 양육의 결" },
  mom: { partLabel: "Part 04", symbol: "🌷", en: "Mom & Child", subtitle: "엄마가 아이에게 흘려주는 결" },
  dad: { partLabel: "Part 05", symbol: "🌳", en: "Dad & Child", subtitle: "아빠가 아이에게 세워주는 결" },
  talent: { partLabel: "Part 06", symbol: "⭐", en: "Strength · Talent · Path", subtitle: "타고난 결이 빛나는 자리" },
  "last-word": { partLabel: "Part 07", symbol: "🕯️", en: "Final Words", subtitle: "자도인이 두 분께 드리는 마지막 한 마디" },
};

// 엄마/아빠 입력 여부 + 자녀 발달 단계에 따라 슬라이드 배치 생성
// 영아(infant): 진로·재능 슬라이드 숨김 (talent 슬라이드 제거)
function buildSlideLayout(
  hasMom: boolean,
  hasDad: boolean,
  ageStage?: "infant" | "preschool" | "elementary" | "secondary",
): SlideDef[] {
  const layout: SlideDef[] = [
    { kind: "cover", title: "" },
    { kind: "intro", title: "들어가며 — 사주 입문", hue: "#a8b8d4" },
    { kind: "pillars", title: "사주팔자", hue: "#f5b942" },
    { kind: "first-word", title: "자도인의 첫마디", aiSectionIdx: 0, hue: "#f5b942" },
    { kind: "overview", title: "한눈에 보는 우리 아이", aiSectionIdx: 1, chartPages: 2, hue: "#7dd3c0", coverPage: true },
    { kind: "heart", title: "우리 아이의 마음", aiSectionIdx: 2, hue: "#c89cff", coverPage: true },
    { kind: "guide", title: "실전 양육 가이드", aiSectionIdx: 3, hue: "#ff9d6b", coverPage: true },
  ];
  if (hasMom) layout.push({ kind: "mom", title: "엄마와 우리 아이", aiSectionIdx: 4, hue: "#f0a8b8", coverPage: true });
  if (hasDad) layout.push({ kind: "dad", title: "아빠와 우리 아이", aiSectionIdx: 5, hue: "#7eb6ff", coverPage: true });
  // 영아는 재능·진로 슬라이드 숨김 (또래·학습·진로 어휘가 발달 단계와 안 맞음)
  if (ageStage !== "infant") {
    layout.push({ kind: "talent", title: "강점·재능·진로", aiSectionIdx: 6, chartPages: 1, hue: "#ffd166", coverPage: true });
  }
  layout.push({ kind: "last-word", title: "자도인의 마지막 당부", aiSectionIdx: 7, hue: "#d4a8e8", coverPage: true });
  layout.push({ kind: "share", title: "공유하기" });
  return layout;
}

// AI 섹션 헤더 — 모든 가능한 ## 헤더 (parseSections가 매칭만 하므로 전부 등록)
// 호칭 통일 처방 (엄마→어머님) 으로 AI 가 헤더에도 "어머님" 출력 시 매칭 실패 방지 위해 동의어도 등록
const SECTION_HEADERS = [
  "자도인의 첫마디",          // idx 0
  "한눈에 보는 우리 아이",     // idx 1
  "우리 아이의 마음",          // idx 2
  "실전 양육 가이드",          // idx 3
  "엄마와 우리 아이",          // idx 4 — 표준
  "어머님과 우리 아이",        // idx 4 — 동의어 (호칭 통일 처방 영향)
  "아빠와 우리 아이",          // idx 5 — 표준
  "아버님과 우리 아이",        // idx 5 — 동의어
  "강점·재능·진로",            // idx 6
  "자도인의 마지막 당부",      // idx 7
];

// 헤더 동의어 매핑 — parseSections 에서 동의어를 표준 idx 로 매핑
const HEADER_SYNONYMS: Record<string, number> = {
  "자도인의 첫마디": 0,
  "한눈에 보는 우리 아이": 1,
  "우리 아이의 마음": 2,
  "실전 양육 가이드": 3,
  "엄마와 우리 아이": 4,
  "어머님과 우리 아이": 4,
  "아빠와 우리 아이": 5,
  "아버님과 우리 아이": 5,
  "강점·재능·진로": 6,
  "자도인의 마지막 당부": 7,
};

// (구 SLIDE_TO_AI_SECTION / SLIDE_TITLES → 동적 SlideDef.layout으로 대체됨)

// AI 응답 → 9섹션 파싱
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
    // 대섹션 헤더는 `## ` (정확히 2개) 또는 `### ` 둘 다 허용 — AI가 어느 쪽으로 출력해도 잡음
    const isLevel2 = /^##\s/.test(trimmed) && !/^###\s/.test(trimmed);
    const isLevel3 = trimmed.startsWith("### ") || trimmed.startsWith("#### ");
    if (isLevel2 || isLevel3) {
      const header = trimmed.replace(/^#+\s*/, "");
      // 동의어 매핑 우선 검색 (정확 매칭)
      for (const [syn, idx] of Object.entries(HEADER_SYNONYMS)) {
        if (header === syn || header.startsWith(syn)) {
          matched = idx;
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

// 텍스트 → ###/▶/빈줄 기준 페이지 분할
function splitIntoPages(text: string): string[] {
  const sections = text.split(/(?=^###\s|^▶\s)/m).map((s) => s.trim()).filter((s) => s);
  if (sections.length > 1) {
    const merged: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const contentLines = s.split("\n").map((l) => l.trim()).filter(
        (l) => l && !l.startsWith("###") && !l.startsWith("▶")
      );
      if (contentLines.length === 0 && i < sections.length - 1) {
        sections[i + 1] = s + "\n" + sections[i + 1];
      } else {
        merged.push(s);
      }
    }
    return merged;
  }
  const paragraphs = text.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s);
  if (paragraphs.length > 1) return paragraphs;
  return [text];
}

// 텍스트 포맷터
// 텍스트 안의 한자(한자 + 한자(한글) + 단독 한자 단어)를 자동 골드 강조
function highlightHanja(text: string, key = "h"): ReactNode[] {
  // 한자(한글) 패턴 또는 연속 한자 — 가독성 위해 자동 골드
  // 예: "용신(用神)", "甲木", "天乙貴人(천을귀인)"
  const re = /([一-鿿]+(?:\([가-힣]+\))?|[一-鿿]+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={`${key}-${idx++}`} style={{ color: ACCENT, fontWeight: 600 }}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

function formatText(text: string, hue: string = ACCENT) {
  return text.split("\n").map((line, i) => {
    const l = line.trim();
    if (!l) return <div key={i} className="h-3" />;
    // ### / ▶ 부제목은 페이지 안에서 표시 안 함 (슬라이드 상단 ## 헤더로 충분)
    if (l.startsWith("### ") || l.startsWith("▶ ") || l.startsWith("▶")) return null;

    // ▸ 소제목 — 본문 내 시각 분리 (옵션 F-1)
    if (l.startsWith("▸ ") || l.startsWith("▸")) {
      const subtitle = l.replace(/^▸\s*/, "");
      return (
        <p key={i} className="font-bold text-[14px] mt-4 mb-2 flex items-center gap-1.5" style={{ color: hue }}>
          <span style={{ color: hue }}>▸</span>
          <span>{subtitle.replace(/\*\*/g, "")}</span>
        </p>
      );
    }
    // ─── 구분선 — 단락 분리 시각 강조 (옵션 F)
    if (/^─+$/.test(l) || /^[—-]{3,}$/.test(l)) {
      return (
        <div key={i} className="my-3 flex justify-center">
          <div className="w-12 h-px" style={{ background: `${hue}55` }} />
        </div>
      );
    }
    // 단독 줄 **...** (한 줄 전체가 굵은 글씨)도 부제목 역할이라 숨김
    if (l.startsWith("**") && l.endsWith("**") && l.length < 40) return null;
    // "N단계 — 키워드:" 패턴 → 단계 카드 스타일
    const stepMatch = l.match(/^(\d)단계\s*[—–-]\s*([가-힣]+)\s*:\s*(.+)$/);
    if (stepMatch) {
      const [, num, keyword, body] = stepMatch;
      return (
        <div key={i} className="flex gap-3 mb-3 items-start">
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-[15px]"
            style={{ backgroundColor: `${hue}33`, color: hue, border: `1.5px solid ${hue}` }}>
            {num}
          </div>
          <div className="flex-1">
            <p className="font-bold text-[15px] mb-1" style={{ color: hue }}>{keyword}</p>
            <p className="text-[14px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.88)" }}>
              {body.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
                /^\*\*[^*]+\*\*$/.test(p) ? (
                  <strong key={j} style={{ color: hue }}>{p.replace(/\*\*/g, "")}</strong>
                ) : (
                  <span key={j}>{highlightHanja(p, `s${i}-${j}`)}</span>
                )
              )}
            </p>
          </div>
        </div>
      );
    }
    if (l.startsWith("**") && l.endsWith("**"))
      return (
        <p key={i} className="font-bold mt-3 mb-2 text-[16px]" style={{ color: hue }}>
          {l.slice(2, -2)}
        </p>
      );
    if (/\*\*[^*]+\*\*/.test(l))
      return (
        <p key={i} className="text-[15px] leading-[1.85] mb-3" style={{ color: "rgba(255,255,255,0.92)" }}>
          {l.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
            /^\*\*[^*]+\*\*$/.test(p) ? (
              <strong key={j} style={{ color: hue }}>{highlightHanja(p.replace(/\*\*/g, ""), `b${i}-${j}`)}</strong>
            ) : (
              <span key={j}>{highlightHanja(p, `t${i}-${j}`)}</span>
            )
          )}
        </p>
      );
    if (l.startsWith("✓ "))
      return (
        <p key={i} className="text-[15px] leading-[1.85] mb-3 pl-5 relative" style={{ color: "rgba(255,255,255,0.90)" }}>
          <span className="absolute left-0" style={{ color: hue }}>✓</span>
          {highlightHanja(l.slice(2), `c${i}`)}
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

// ── 강점·주의점 카드 — AI 출력 파서 + 그리드 ─────────────────────────
type TraitItem = { emoji: string; keyword: string; body: string };
type TraitCards = { strengths: TraitItem[]; cautions: TraitItem[] };

// 선두 이모지 추출용 정규식
// 이모지·심볼·확장 픽토그램 등 광범위 매칭. 지원 안 되는 환경 대비 fallback 별도 처리.
const EMOJI_RE = /^([\p{Extended_Pictographic}\p{Emoji_Presentation}](?:️)?(?:‍[\p{Extended_Pictographic}\p{Emoji_Presentation}](?:️)?)*)/u;

// AI가 [강점]/[주의점] 마커로 출력한 텍스트를 파싱.
// 형식 어긋나면 null 반환 → formatText로 fallback.
function parseTraitCards(text: string): TraitCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  const strengths: TraitItem[] = [];
  const cautions: TraitItem[] = [];
  let mode: "none" | "strength" | "caution" = "none";

  // 폴백 이모지 (AI가 이모지 빠뜨린 경우)
  const FB_STRENGTH = ["✦", "✺", "✪", "✧", "★"];
  const FB_CAUTION = ["⚠", "◐", "◎"];

  for (const l of lines) {
    if (!l) continue;
    if (/^\[?\s*강점\s*\]?$/i.test(l) || l.startsWith("[강점]")) { mode = "strength"; continue; }
    if (/^\[?\s*주의점\s*\]?$/i.test(l) || l.startsWith("[주의점]") || l.startsWith("(주의점)")) { mode = "caution"; continue; }
    if (mode === "none") continue;

    // 불릿 제거: "• ..." 또는 "- ..."
    const stripped = l.replace(/^[•\-]\s*/, "");

    // 선두 이모지 추출 (있으면)
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = "";
    let rest = stripped;
    if (emojiMatch) {
      emoji = emojiMatch[1].trim();
      rest = stripped.slice(emojiMatch[0].length).trim();
    }

    // "**키워드** — 본문" 패턴
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;

    // 이모지 비어있으면 폴백 부여
    if (!emoji) {
      const fbList = mode === "strength" ? FB_STRENGTH : FB_CAUTION;
      const idx = mode === "strength" ? strengths.length : cautions.length;
      emoji = fbList[idx % fbList.length];
    }

    const item: TraitItem = { emoji, keyword: m[1].trim(), body: m[2].trim() };
    if (mode === "strength") strengths.push(item);
    else if (mode === "caution") cautions.push(item);
  }
  if (strengths.length === 0 && cautions.length === 0) return null;
  return { strengths, cautions };
}

// 사주 십성 팔레트 — 카드별 고유 색깔
const STRENGTH_PALETTE = [
  { color: "#34d399", glow: "#34d39920" }, // 식신 — 에메랄드
  { color: "#a78bfa", glow: "#a78bfa20" }, // 비견 — 라벤더
  { color: "#f0a8b8", glow: "#f0a8b820" }, // 정인 — 로즈
  { color: "#fbbf24", glow: "#fbbf2420" }, // 정재 — 골드
  { color: "#60a5fa", glow: "#60a5fa20" }, // 정관 — 스카이
];
const CAUTION_PALETTE = [
  { color: "#fb923c", glow: "#fb923c20" }, // 상관 — 오렌지
  { color: "#f87171", glow: "#f8717120" }, // 겁재 — 코랄
  { color: "#c084fc", glow: "#c084fc20" }, // 편인 — 자주
];

function TraitCard({ item, variant, idx }: { item: TraitItem; variant: "strength" | "caution"; idx: number }) {
  const palette = variant === "strength" ? STRENGTH_PALETTE : CAUTION_PALETTE;
  const { color, glow } = palette[idx % palette.length];
  const emoji = item.emoji;
  return (
    <div
      className="rounded-2xl p-4 flex gap-3.5 items-start transition-transform"
      style={{
        background: `linear-gradient(135deg, ${glow}, ${color}08 60%, transparent)`,
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${color}40`,
        boxShadow: `0 2px 12px ${color}15`,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          fontSize: 26,
          background: `${color}25`,
          borderRadius: 12,
          border: `1px solid ${color}50`,
        }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold mb-1.5 leading-tight"
          style={{ color, fontSize: 15, letterSpacing: "-0.01em" }}
        >
          {item.keyword}
        </p>
        <p
          className="leading-[1.65]"
          style={{ color: "rgba(255,255,255,0.86)", fontSize: 13 }}
        >
          {item.body}
        </p>
      </div>
    </div>
  );
}

// ── 회복과 환경 카드 — AI 출력 파서 + 그리드 ─────────────────────────
type RecoveryCardItem = { emoji: string; keyword: string; body: string; why?: string };
type RecoveryCards = { basis: string; child: RecoveryCardItem[]; parent: RecoveryCardItem[]; commonRationale?: string };

function parseRecoveryCards(text: string): RecoveryCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  let basis = "";
  let commonRationale = "";
  const child: RecoveryCardItem[] = [];
  const parent: RecoveryCardItem[] = [];
  let mode: "none" | "basis" | "child" | "parent" | "common" = "none";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (/^\(근거\)\s*$/.test(l)) { mode = "basis"; continue; }
    if (/^\[?\s*자녀\s*\]?$/.test(l) || l.startsWith("[자녀]")) { mode = "child"; continue; }
    if (/^\[?\s*부모\s*\]?$/.test(l) || l.startsWith("[부모]")) { mode = "parent"; continue; }
    if (l.startsWith("[공통 원리]")) { mode = "common"; continue; }
    if (mode === "none") continue;

    if (mode === "basis") {
      if (l.startsWith("###") || l.startsWith("[")) continue;
      if (basis) basis += " ";
      basis += l;
      continue;
    }
    if (mode === "common") {
      if (l.startsWith("###") || l.startsWith("[")) continue;
      if (commonRationale) commonRationale += " ";
      commonRationale += l;
      continue;
    }

    // 💡 왜? 라인 — 직전 카드의 why 로 흡수
    if (l.startsWith("💡")) {
      const why = l.replace(/^💡\s*/, "").trim();
      const list = mode === "child" ? child : parent;
      if (list.length > 0) list[list.length - 1].why = why;
      continue;
    }

    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = "";
    let rest = stripped;
    if (emojiMatch) {
      emoji = emojiMatch[1].trim();
      rest = stripped.slice(emojiMatch[0].length).trim();
    }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    if (!emoji) emoji = mode === "child" ? "🌿" : "🏠";
    const item: RecoveryCardItem = { emoji, keyword: m[1].trim(), body: m[2].trim() };
    if (mode === "child") child.push(item);
    else if (mode === "parent") parent.push(item);
  }
  if (child.length === 0 && parent.length === 0) return null;
  return { basis: basis.trim(), child, parent, commonRationale: commonRationale.trim() || undefined };
}

const CHILD_COLOR = "#7dd3c0";    // 청록 — 자녀
const PARENT_COLOR = "#f0a8b8";   // 로즈 — 부모

function RecoveryItemCard({ item, color }: { item: RecoveryCardItem; color: string }) {
  return (
    <div
      className="rounded-xl p-3 flex gap-2.5 items-start"
      style={{
        background: `linear-gradient(135deg, ${color}18, ${color}06 70%, transparent)`,
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 38,
          height: 38,
          fontSize: 20,
          background: `${color}25`,
          borderRadius: 10,
          border: `1px solid ${color}50`,
        }}
      >
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold mb-1 leading-tight" style={{ color, fontSize: 13 }}>
          {item.keyword}
        </p>
        <p className="leading-[1.6]" style={{ color: "rgba(255,255,255,0.86)", fontSize: 12.5 }}>
          {item.body}
        </p>
        {item.why && (
          <p
            className="mt-1.5 pt-1.5 leading-[1.5] italic"
            style={{
              color: "rgba(255,255,255,0.62)",
              fontSize: 10.5,
              borderTop: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            💡 {item.why}
          </p>
        )}
      </div>
    </div>
  );
}

function RecoveryGrid({ cards }: { cards: RecoveryCards }) {
  return (
    <div className="space-y-4">
      {cards.basis && (
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${ACCENT}30`,
          }}
        >
          <p className="text-[11px] tracking-[0.2em] mb-1.5" style={{ color: ACCENT }}>— 근거 —</p>
          <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.9)" }}>
            {cards.basis}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 자녀 칼럼 */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span style={{ fontSize: 16 }}>🌿</span>
            <p className="font-bold tracking-wide" style={{ color: CHILD_COLOR, fontSize: 12.5 }}>
              자녀의 회복 결
            </p>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${CHILD_COLOR}40, transparent)` }} />
          </div>
          <div className="space-y-2">
            {cards.child.map((c, i) => (
              <RecoveryItemCard key={`c-${i}`} item={c} color={CHILD_COLOR} />
            ))}
          </div>
        </div>

        {/* 부모 칼럼 */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span style={{ fontSize: 16 }}>🏠</span>
            <p className="font-bold tracking-wide" style={{ color: PARENT_COLOR, fontSize: 12.5 }}>
              부모가 깔아주는 환경
            </p>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${PARENT_COLOR}40, transparent)` }} />
          </div>
          <div className="space-y-2">
            {cards.parent.map((p, i) => (
              <RecoveryItemCard key={`p-${i}`} item={p} color={PARENT_COLOR} />
            ))}
          </div>
        </div>
      </div>

      {cards.commonRationale && (
        <div
          className="rounded-xl p-3 mt-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${ACCENT}30`,
          }}
        >
          <p className="text-[10.5px] tracking-[0.2em] mb-1.5" style={{ color: ACCENT }}>— 공통 원리 —</p>
          <p className="text-[12.5px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.85)" }}>
            {cards.commonRationale}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Phase 3: 살펴주면 좋은 결 — 균형 카드 (3장) ────────────────────
type SoftenCardItem = { emoji: string; keyword: string; body: string; why?: string };
type SoftenCards = { basis: string; items: SoftenCardItem[]; commonRationale?: string };

function parseSoftenCards(text: string): SoftenCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  let basis = "";
  let commonRationale = "";
  const items: SoftenCardItem[] = [];
  let mode: "none" | "basis" | "balance" | "common" = "none";

  for (const l of lines) {
    if (!l) continue;
    if (/^\(근거\)\s*$/.test(l)) { mode = "basis"; continue; }
    if (/^\[?\s*균형\s*\]?$/.test(l) || l.startsWith("[균형]")) { mode = "balance"; continue; }
    if (l.startsWith("[공통 원리]")) { mode = "common"; continue; }
    if (mode === "none") continue;

    if (mode === "basis") {
      if (l.startsWith("###") || l.startsWith("[")) continue;
      if (basis) basis += " ";
      basis += l;
      continue;
    }
    if (mode === "common") {
      if (l.startsWith("###") || l.startsWith("[")) continue;
      if (commonRationale) commonRationale += " ";
      commonRationale += l;
      continue;
    }

    // 💡 왜? 라인 — 직전 카드의 why 로 흡수
    if (l.startsWith("💡")) {
      const why = l.replace(/^💡\s*/, "").trim();
      if (items.length > 0) items[items.length - 1].why = why;
      continue;
    }

    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = "";
    let rest = stripped;
    if (emojiMatch) {
      emoji = emojiMatch[1].trim();
      rest = stripped.slice(emojiMatch[0].length).trim();
    }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    if (!emoji) emoji = "🌿";
    items.push({ emoji, keyword: m[1].trim(), body: m[2].trim() });
  }
  if (items.length === 0) return null;
  return { basis: basis.trim(), items, commonRationale: commonRationale.trim() || undefined };
}

const SOFTEN_COLOR = "#c4b5e8"; // 옅은 보라 — 균형/설기 톤 (회복 카드와 시각 구분)

function SoftenGrid({ cards }: { cards: SoftenCards }) {
  return (
    <div className="space-y-4">
      {cards.basis && (
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${ACCENT}30`,
          }}
        >
          <p className="text-[11px] tracking-[0.2em] mb-1.5" style={{ color: ACCENT }}>— 근거 —</p>
          <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.9)" }}>
            {cards.basis}
          </p>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <span style={{ fontSize: 16 }}>🌿</span>
          <p className="font-bold tracking-wide" style={{ color: SOFTEN_COLOR, fontSize: 12.5 }}>
            살펴주면 좋은 결 — 부드러운 균형
          </p>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${SOFTEN_COLOR}40, transparent)` }} />
        </div>
        <div className="space-y-2">
          {cards.items.map((c, i) => (
            <RecoveryItemCard key={`s-${i}`} item={c} color={SOFTEN_COLOR} />
          ))}
        </div>
      </div>
      {cards.commonRationale && (
        <div
          className="rounded-xl p-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${ACCENT}30`,
          }}
        >
          <p className="text-[10.5px] tracking-[0.2em] mb-1.5" style={{ color: ACCENT }}>— 공통 원리 —</p>
          <p className="text-[12.5px] leading-[1.65]" style={{ color: "rgba(255,255,255,0.85)" }}>
            {cards.commonRationale}
          </p>
        </div>
      )}
      <p className="text-[10px] text-center italic" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
        부드럽게 균형 잡으면 자녀의 결이 더 단단해집니다
      </p>
    </div>
  );
}

function TraitGrid({ cards }: { cards: TraitCards }) {
  return (
    <div className="space-y-5">
      {cards.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span style={{ color: "#7dd3c0", fontSize: 16 }}>✦</span>
            <p className="font-bold tracking-wide" style={{ color: "#7dd3c0", fontSize: 13 }}>
              강점 — 이런 면이 빛납니다
            </p>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #7dd3c040, transparent)" }} />
          </div>
          <div className="space-y-2.5">
            {cards.strengths.map((s, i) => (
              <TraitCard key={`s-${i}`} item={s} variant="strength" idx={i} />
            ))}
          </div>
        </div>
      )}
      {cards.cautions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span style={{ color: "#fb923c", fontSize: 16 }}>⚠</span>
            <p className="font-bold tracking-wide" style={{ color: "#fb923c", fontSize: 13 }}>
              주의점 — 이런 결은 살펴주세요
            </p>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #fb923c40, transparent)" }} />
          </div>
          <div className="space-y-2.5">
            {cards.cautions.map((c, i) => (
              <TraitCard key={`c-${i}`} item={c} variant="caution" idx={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 가이드 섹션 핵심 3가지 카드 ────────────────────────────────────
function GuideHighlightCards({ items }: { items: GuideHighlight[] }) {
  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <p className="text-[12px] tracking-[0.2em]" style={{ color: ACCENT }}>
          🎯 사주에서 본 핵심 3가지
        </p>
      </div>
      {items.map((it) => (
        <div
          key={it.num}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${it.color}10, transparent 70%)`,
            border: `1px solid ${it.color}40`,
            borderBottom: `2px solid ${it.color}`,
          }}
        >
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-bold" style={{ color: it.color, fontSize: 22, letterSpacing: "0.05em" }}>
              0{it.num}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <span style={{ fontSize: 18 }}>{it.emoji}</span>
              <p className="font-bold leading-tight" style={{ color: "rgba(255,255,255,0.95)", fontSize: 15 }}>
                {it.title}
              </p>
            </div>
          </div>
          <p
            className="leading-[1.6] pl-1"
            style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
          >
            {it.basis}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── 떼·고집 4가지 트리거 막대 ──────────────────────────────────────
function TantrumTriggerBars({ triggers, basis }: { triggers: TantrumTrigger[]; basis?: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        사주에서 추출한 4가지 트리거 — 동시에 작동하면 떼가 폭발
      </p>
      <div className="space-y-3 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
        {triggers.map((t, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div>
                <p className="font-bold" style={{ color: "rgba(255,255,255,0.92)", fontSize: 13 }}>
                  {t.name}
                </p>
                <p className="italic" style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                  {t.subtitle}
                </p>
              </div>
              <span className="font-bold tabular-nums" style={{ color: t.color, fontSize: 16 }}>
                {t.score}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${t.score}%`,
                  background: `linear-gradient(to right, ${t.color}99, ${t.color})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {basis && (
        <div
          className="rounded-xl p-3.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderLeft: `3px solid ${ACCENT}`,
          }}
        >
          <p className="leading-[1.7]" style={{ color: "rgba(255,255,255,0.88)", fontSize: 13 }}>
            {basis}
          </p>
        </div>
      )}
    </div>
  );
}

// ── 떼·고집 단계 매뉴얼 — 타임라인 + 아이콘 카드 ─────────────────
type StepData = { num: number; emoji: string; title: string; sub: string; time: string; body: string; color: string };
function TantrumStepFlow({ steps }: { steps: StepData[] }) {
  return (
    <div className="space-y-3">
      {/* 타임라인 헤더 */}
      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>0초</span>
          <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>30초</span>
          <span className="text-[10px] tabular-nums" style={{ color: "rgba(255,255,255,0.55)" }}>1분+</span>
        </div>
        <div className="h-px" style={{ background: "linear-gradient(to right, #f87171, #fbbf24, #34d399)" }} />
      </div>

      {steps.map((s, i) => (
        <div key={i}>
          <div
            className="rounded-xl p-3.5 flex gap-3 items-start"
            style={{
              background: `linear-gradient(135deg, ${s.color}12, transparent 70%)`,
              borderLeft: `3px solid ${s.color}`,
              border: `1px solid ${s.color}33`,
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: 38, height: 38, fontSize: 20,
                background: `${s.color}20`, borderRadius: 10,
                border: `1px solid ${s.color}40`,
              }}
            >
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <p className="font-bold" style={{ color: s.color, fontSize: 14 }}>
                  {s.num}단계 — {s.title}
                </p>
              </div>
              <p className="text-[11px] mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                ⏱ {s.time}
              </p>
              <p className="leading-[1.65]" style={{ color: "rgba(255,255,255,0.86)", fontSize: 13 }}>
                {s.body.replace(/\*\*/g, "")}
              </p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="text-center my-1" style={{ color: "rgba(255,255,255,0.35)" }}>↓</div>
          )}
        </div>
      ))}
    </div>
  );
}

// 단계 매뉴얼 AI 텍스트 파서 — "**N단계 — 키워드(영문)**: 본문" 패턴 인식
function parseTantrumSteps(text: string): StepData[] | null {
  const STEP_META = [
    { num: 1, emoji: "⏸", title: "멈춤", sub: "STOP", time: "0-30초", color: "#f87171" },
    { num: 2, emoji: "💬", title: "인정", sub: "NAME", time: "30초-1분", color: "#fbbf24" },
    { num: 3, emoji: "🧭", title: "안내", sub: "GUIDE", time: "1분+", color: "#34d399" },
  ];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const steps: StepData[] = [];
  for (const l of lines) {
    // "**1단계 — 멈춤**: 같이 끓어오르지 않기..."
    const m = l.match(/^\*\*(\d)단계\s*[—–-]\s*([가-힣]+)\*\*\s*[:：]?\s*(.+)$/);
    if (!m) continue;
    const n = parseInt(m[1]);
    const meta = STEP_META.find((s) => s.num === n);
    if (!meta) continue;
    const body = m[3].replace(/\*\*/g, "").trim();
    steps.push({ ...meta, body });
  }
  if (steps.length < 2) return null;
  return steps;
}

// ── 친구 갈등 — 부모 개입 거리 슬라이더 ────────────────────────────
function FriendDistanceSlider({ fd }: { fd: FriendDistance }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        부모가 어디까지 다가갈지 — 자녀 결에 맞춘 거리
      </p>
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${ACCENT}30` }}>
        <div className="flex items-baseline justify-between mb-2 text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>
          <span>가까이 — 함께 풀기</span>
          <span>멀리 — 스스로 풀게</span>
        </div>
        <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(to right, #34d39940, #fbbf2440, #f8717140)" }}>
          <div
            className="absolute -top-1.5 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              left: `${fd.position}%`,
              background: ACCENT,
              boxShadow: `0 0 0 4px ${ACCENT}33, 0 0 12px ${ACCENT}66`,
            }}
          >
            <span className="text-[10px] font-bold" style={{ color: "#fff" }}>●</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="font-bold" style={{ color: ACCENT, fontSize: 14 }}>{fd.label}</p>
        </div>
        <SajuBasisBox basis={fd.basis} />
      </div>
    </div>
  );
}

// ── 통하는 칭찬 vs 역효과 칭찬 좌우 카드 ───────────────────────────
type PraiseCards = { good: TraitItem[]; bad: TraitItem[] };
function parsePraiseCards(text: string): PraiseCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  const good: TraitItem[] = [];
  const bad: TraitItem[] = [];
  let mode: "none" | "good" | "bad" = "none";
  for (const l of lines) {
    if (!l) continue;
    if (l.startsWith("[좋은 칭찬]") || l.startsWith("[통하는 칭찬]")) { mode = "good"; continue; }
    if (l.startsWith("[역효과 칭찬]") || l.startsWith("[피해야 할 칭찬]")) { mode = "bad"; continue; }
    if (mode === "none") continue;
    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = "";
    let rest = stripped;
    if (emojiMatch) { emoji = emojiMatch[1].trim(); rest = stripped.slice(emojiMatch[0].length).trim(); }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    if (!emoji) emoji = mode === "good" ? "👍" : "🚫";
    const item: TraitItem = { emoji, keyword: m[1].trim(), body: m[2].trim() };
    if (mode === "good") good.push(item);
    else bad.push(item);
  }
  if (good.length === 0 && bad.length === 0) return null;
  return { good, bad };
}
function PraiseCompareCards({ cards }: { cards: PraiseCards }) {
  const ROW = (item: TraitItem, color: string) => (
    <div
      className="rounded-xl p-3 mb-2"
      style={{
        background: `linear-gradient(135deg, ${color}15, transparent 70%)`,
        border: `1px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        <span style={{ fontSize: 16 }}>{item.emoji}</span>
        <p className="font-bold" style={{ color, fontSize: 13 }}>"{item.keyword}"</p>
      </div>
      <p className="leading-[1.6]" style={{ color: "rgba(255,255,255,0.78)", fontSize: 12 }}>{item.body}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span style={{ fontSize: 14 }}>✓</span>
          <p className="font-bold" style={{ color: "#34d399", fontSize: 12 }}>통하는 칭찬</p>
        </div>
        {cards.good.map((g, i) => <div key={`g-${i}`}>{ROW(g, "#34d399")}</div>)}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <span style={{ fontSize: 14 }}>✕</span>
          <p className="font-bold" style={{ color: "#f87171", fontSize: 12 }}>역효과 칭찬</p>
        </div>
        {cards.bad.map((b, i) => <div key={`b-${i}`}>{ROW(b, "#f87171")}</div>)}
      </div>
    </div>
  );
}

// ── 잠자리·식습관 4채널 게이지 ─────────────────────────────────────
function LifestyleGauges({ channels }: { channels: LifestyleChannel[] }) {
  const lvlColor = (lv: "low" | "mid" | "high") => (lv === "high" ? "#34d399" : lv === "mid" ? "#fbbf24" : "#94a3b8");
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        4가지 채널 — 자녀 결의 필요도
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {channels.map((c, i) => {
          const col = lvlColor(c.level);
          return (
            <div
              key={i}
              className="rounded-xl p-3"
              style={{
                background: `linear-gradient(135deg, ${col}12, transparent 80%)`,
                border: `1px solid ${col}40`,
              }}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <p className="font-bold" style={{ color: "rgba(255,255,255,0.92)", fontSize: 13 }}>{c.name}</p>
                <span className="ml-auto text-[10px] font-bold" style={{ color: col }}>
                  {c.level === "high" ? "높음" : c.level === "mid" ? "보통" : "낮음"}
                </span>
              </div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: col }} />
              </div>
              <p className="leading-[1.55]" style={{ color: "rgba(255,255,255,0.72)", fontSize: 11 }}>
                {c.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 디지털·미디어 안전·위험 게이지 ─────────────────────────────────
function DigitalGaugeCard({ gauge }: { gauge: DigitalGauge }) {
  const col = gauge.riskLevel >= 70 ? "#f87171" : gauge.riskLevel >= 40 ? "#fbbf24" : "#34d399";
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        디지털 자극 흡수율 — 자녀 결의 위험도
      </p>
      <div
        className="rounded-xl p-4"
        style={{
          background: `linear-gradient(135deg, ${col}12, transparent 80%)`,
          border: `1px solid ${col}40`,
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <p className="font-bold" style={{ color: "rgba(255,255,255,0.9)", fontSize: 13 }}>위험도</p>
          <span className="font-bold tabular-nums" style={{ color: col, fontSize: 18 }}>
            {gauge.riskLabel} ({gauge.riskLevel}점)
          </span>
        </div>
        <div className="h-3 rounded-full mb-3 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${gauge.riskLevel}%`, background: `linear-gradient(to right, #34d399, #fbbf24, #f87171)` }} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>권장 시간</p>
            <p className="font-bold tabular-nums" style={{ color: ACCENT, fontSize: 14 }}>
              {gauge.safeMin}~{gauge.safeMax}분/일
            </p>
          </div>
        </div>
        <SajuBasisBox basis={gauge.basis} />
      </div>
    </div>
  );
}

// ── 자존감 보호 — 무너졌을 때 부모의 한 마디 ───────────────────────
type SelfEsteemMents = { mentList: TraitItem[] };
function parseSelfEsteemMents(text: string): SelfEsteemMents | null {
  const lines = text.split("\n").map((l) => l.trim());
  const mentList: TraitItem[] = [];
  let inList = false;
  for (const l of lines) {
    if (!l) continue;
    if (l.startsWith("[멘트]") || l.startsWith("[부모의 한 마디]")) { inList = true; continue; }
    if (!inList) continue;
    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = ""; let rest = stripped;
    if (emojiMatch) { emoji = emojiMatch[1].trim(); rest = stripped.slice(emojiMatch[0].length).trim(); }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    if (!emoji) emoji = "💌";
    mentList.push({ emoji, keyword: m[1].trim(), body: m[2].trim() });
  }
  if (mentList.length === 0) return null;
  return { mentList };
}
function SelfEsteemMentCards({ ments }: { ments: SelfEsteemMents }) {
  const colors = ["#f0a8b8", "#a78bfa", "#7dd3c0"];
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        자존감이 흔들릴 때 — 자녀에게 닿는 부모의 한 마디
      </p>
      {ments.mentList.map((m, i) => {
        const col = colors[i % colors.length];
        return (
          <div
            key={i}
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${col}15, transparent 70%)`,
              border: `1px solid ${col}40`,
              borderLeft: `3px solid ${col}`,
            }}
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span style={{ fontSize: 16 }}>{m.emoji}</span>
              <p className="font-bold" style={{ color: col, fontSize: 13 }}>{m.keyword}</p>
            </div>
            <p
              className="leading-[1.7] italic"
              style={{ color: "rgba(255,255,255,0.92)", fontSize: 14, paddingLeft: "8px", borderLeft: `2px solid ${col}50` }}
            >
              "{m.body}"
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 부모-자녀 비교 시각화 (PART 4 / PART 5)
// ──────────────────────────────────────────────────────────────────

// ── 외부 보완 가이드 카드 (부모-자녀 둘 다 약한 결의 즉효·매일 행동) ──────
const ELEM_HANJA_BOOST: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_COLORS_BOOST: Record<string, string> = {
  목: "#7dd3c0", 화: "#f0a8b8", 토: "#d4a8e8", 금: "#e0e0e0", 수: "#7eb6ff",
};

function ParentExternalBoostCards({
  bothLackElements,
  childWeakestElement,
  childAgeStage,
  childAge,
  parentLabel,
  parentColor,
}: {
  bothLackElements: Array<{ elem: string; kor: string; emoji: string }>;
  childWeakestElement: string;
  childAgeStage: AgeStage;
  childAge: number;
  parentLabel: string;
  parentColor: string;
}) {
  // 회복카드 element 와 중복 제외 (영아 케이스는 회복카드 hidden 이므로 모두 표시)
  const isInfant = childAgeStage === "infant";
  const elementsToShow = isInfant
    ? bothLackElements
    : bothLackElements.filter((e) => e.elem !== childWeakestElement);

  const tier = stageToTier(childAgeStage, childAge);

  // Fallback: 표시할 element 없음
  if (elementsToShow.length === 0) {
    return (
      <div className="rounded-2xl p-5 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${parentColor}33` }}>
        <p className="text-[12px] mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
          {parentLabel}와 자녀가 함께 약한 결이 도드라지지 않습니다
        </p>
        <p className="text-[11px]" style={{ color: parentColor }}>
          외부 보완 없이도 자연스럽게 어우러지는 결입니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-center mb-2" style={{ color: BRIGHT }}>
        ─ 외부에서 채워주는 결 ─
      </h4>
      <p className="text-[11px] text-center mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
        {parentLabel}-자녀 둘 다 약한 결을 일상 속에서 자연스럽게 보완
      </p>
      {elementsToShow.map((el) => {
        const cells = ELEMENT_PRESCRIPTION_MATRIX[el.elem as Element5]?.[tier];
        if (!cells) return null;
        // 결정적 선택: 자녀 element 해시 기반 (같은 자녀는 같은 카드)
        const idx = (el.elem.charCodeAt(0) + childAge) % 3;
        const immediate = cells.immediate[idx];
        const daily = cells.daily[(idx + 1) % cells.daily.length];
        const elemColor = ELEM_COLORS_BOOST[el.elem] ?? parentColor;

        return (
          <div key={el.elem}
            className="rounded-2xl p-4 space-y-2"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${elemColor}44` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[18px] font-bold" style={{ color: elemColor }}>
                {ELEM_HANJA_BOOST[el.elem] ?? el.emoji}
              </span>
              <span className="text-[13px] font-semibold" style={{ color: elemColor }}>
                {el.kor}
              </span>
            </div>
            <div className="flex items-start gap-2 text-[12px]">
              <span className="text-[15px]" style={{ color: elemColor }}>{immediate.emoji}</span>
              <div>
                <div className="font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                  즉효 처방
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)" }}>{immediate.text}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[12px]">
              <span className="text-[15px]" style={{ color: elemColor }}>{daily.emoji}</span>
              <div>
                <div className="font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                  매일 루틴
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)" }}>{daily.text}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ① 오행 분포 비교 5각 레이더 ─────────────────────────────────
function ElementCompareRadar({
  cmp, parentLabel, parentColor, childLabel,
}: {
  cmp: ElementCompare;
  parentLabel: string;
  parentColor: string;
  childLabel: string;
}) {
  const SIZE = 220;
  const CX = SIZE / 2, CY = SIZE / 2 + 8;
  const R = 78;
  const ELEMS = ["목", "화", "토", "금", "수"] as const;
  const labels = ["나무", "불", "흙", "쇠", "물"];
  const childColor = "#7dd3c0"; // mint teal — 엄마(rose pink)와 보색 가까워 시각 구분 명확

  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const r = (Math.min(value, 50) / 50) * R;
    return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
  };
  const polyline = (vals: number[]) =>
    vals.map((v, i) => point(i, v).join(",")).join(" ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: parentColor }} />
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{parentLabel}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: childColor }} />
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{childLabel}</span>
        </span>
      </div>

      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 16} viewBox={`0 0 ${SIZE} ${SIZE + 16}`}>
          {/* 격자 */}
          {[0.25, 0.5, 0.75, 1].map((f, gi) => (
            <polygon
              key={gi}
              points={ELEMS.map((_, i) => {
                const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                const r = R * f;
                return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`;
              }).join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
          ))}
          {/* 축선 */}
          {ELEMS.map((_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            return (
              <line
                key={i}
                x1={CX} y1={CY}
                x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)}
                stroke="rgba(255,255,255,0.08)" strokeWidth={1}
              />
            );
          })}
          {/* 부모 polygon */}
          <polygon
            points={polyline(ELEMS.map((e) => cmp.parent[e]))}
            fill={`${parentColor}40`}
            stroke={parentColor}
            strokeWidth={2}
          />
          {/* 자녀 polygon */}
          <polygon
            points={polyline(ELEMS.map((e) => cmp.child[e]))}
            fill={`${childColor}40`}
            stroke={childColor}
            strokeWidth={2}
          />
          {/* 라벨 */}
          {ELEMS.map((_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            const lx = CX + (R + 14) * Math.cos(a);
            const ly = CY + (R + 14) * Math.sin(a);
            return (
              <text
                key={i}
                x={lx} y={ly}
                fill="rgba(255,255,255,0.78)"
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {labels[i]}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-xl p-3" style={{ background: "rgba(125,211,192,0.1)", border: "1px solid rgba(125,211,192,0.3)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "#7dd3c0" }}>가장 비슷한 비중의 결</p>
          <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {cmp.similar.kor}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            (두 분 모두 비슷한 비중)
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.3)" }}>
          <p className="text-[10px] mb-0.5" style={{ color: "#7dd3c0" }}>가장 비중이 다른 결</p>
          <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {cmp.different.kor}
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            (한쪽이 강하고 한쪽이 약함)
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ② 일간 관계 카드 ──────────────────────────────────────────────
function IlganRelationCard({ rel, parentLabel, parentColor }: { rel: IlganRelation; parentLabel: string; parentColor: string }) {
  const childColor = "#7dd3c0"; // mint teal — 엄마(rose pink)와 보색 가까워 시각 구분 명확
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        두 분의 본질이 만나는 결
      </p>
      <div className="rounded-2xl p-4" style={{
        background: `linear-gradient(135deg, ${rel.color}10, transparent 70%)`,
        border: `1px solid ${rel.color}40`,
      }}>
        <div className="grid grid-cols-3 items-center gap-2 mb-4">
          {/* 부모 */}
          <div className="text-center">
            <p className="text-[10px] mb-1" style={{ color: parentColor }}>{parentLabel}</p>
            <p className="font-bold" style={{ color: parentColor, fontSize: 28 }}>{rel.parentHanja}</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{rel.parentKor}</p>
          </div>
          {/* 가운데 화살표 */}
          <div className="text-center">
            <p className="font-bold" style={{ color: rel.color, fontSize: 22 }}>{rel.direction}</p>
            <p className="text-[10px] mt-1" style={{ color: rel.color }}>
              {rel.emoji} {rel.type === "생" ? "키우는" : rel.type === "극" ? "다듬는" : "닮은"}
            </p>
          </div>
          {/* 자녀 */}
          <div className="text-center">
            <p className="text-[10px] mb-1" style={{ color: childColor }}>아이</p>
            <p className="font-bold" style={{ color: childColor, fontSize: 28 }}>{rel.childHanja}</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{rel.childKor}</p>
          </div>
        </div>

        {/* 라벨 */}
        <div className="text-center mb-3">
          <p className="font-bold" style={{ color: rel.color, fontSize: 14 }}>
            {rel.label}
          </p>
        </div>

        {/* 한 단락 풀이 */}
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.04)", borderLeft: `3px solid ${rel.color}` }}
        >
          <p className="leading-[1.65]" style={{ color: "rgba(255,255,255,0.86)", fontSize: 12.5 }}>
            {rel.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ③ 채워주는 vs 부족한 기운 흐름 ────────────────────────────────
function ElementFlowChart({ flow, parentLabel, parentColor }: { flow: FlowGiven; parentLabel: string; parentColor: string }) {
  // 임계값: intensity ≥ 25% 인 흐름만 의미있는 보충으로 표시 (그 이하는 본문 AI 와 정합 깨지는 미미한 차이)
  const FLOW_THRESHOLD = 25;
  const meaningfulGives = flow.parentGives.filter((g) => g.intensity >= FLOW_THRESHOLD);
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
        {parentLabel}의 흘려주는 결 → 아이에게 닿는 결
      </p>

      {/* 부모가 채워주는 기운 — 임계값 25% 이상만 */}
      {meaningfulGives.length > 0 ? (
        <div className="rounded-xl p-4" style={{ background: `${parentColor}08`, border: `1px solid ${parentColor}30` }}>
          <p className="text-[11px] mb-3" style={{ color: parentColor }}>
            ✨ {parentLabel}가 자녀에게 채워주는 기운
          </p>
          <div className="space-y-2.5">
            {meaningfulGives.map((g, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {g.emoji} {g.kor}
                  </p>
                  <span className="tabular-nums text-[11px]" style={{ color: parentColor }}>+{g.intensity}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full"
                       style={{ width: `${Math.min(100, g.intensity * 2)}%`, background: parentColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>
            특별히 채워주는 결은 없고, 전반적으로 비슷한 결의 부모입니다.
          </p>
        </div>
      )}

      {/* 둘 다 약한 결 (있을 때만) */}
      {flow.bothLack.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.25)" }}>
          <p className="text-[11px] mb-2" style={{ color: "#fb923c" }}>
            ⚠ 두 분 모두 약한 결 — 외부에서 채워주면 좋습니다
          </p>
          <div className="flex flex-wrap gap-2">
            {flow.bothLack.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)" }}
              >
                {b.emoji} {b.kor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* complementLabel·overlapLabel 박스 제거 — 메인 박스(parentGives)와 데이터 모순 + "다른 부모와 다르게" 라벨 모호 */}
    </div>
  );
}

// ── ④ 시너지 카드 (좌우 비교 X, 단일 톤 stack 3장) ──────────────
type SynergyCards = { cards: TraitItem[] };
function parseSynergyCards(text: string): SynergyCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  const cards: TraitItem[] = [];
  let inList = false;
  for (const l of lines) {
    if (!l) continue;
    if (l.startsWith("[시너지]") || l.startsWith("[잘 통하는]") || l.startsWith("[모델링]")) { inList = true; continue; }
    if (!inList) continue;
    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = ""; let rest = stripped;
    if (emojiMatch) { emoji = emojiMatch[1].trim(); rest = stripped.slice(emojiMatch[0].length).trim(); }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    if (!emoji) emoji = "✨";
    cards.push({ emoji, keyword: m[1].trim(), body: m[2].trim() });
  }
  if (cards.length === 0) return null;
  return { cards };
}
function SynergyGrid({ cards, color }: { cards: SynergyCards; color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span style={{ color, fontSize: 14 }}>✦</span>
        <p className="font-bold tracking-wide" style={{ color, fontSize: 12.5 }}>
          잘 통하는 영역 — 시너지의 결
        </p>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}40, transparent)` }} />
      </div>
      <div className="space-y-2">
        {cards.cards.map((c, i) => (
          <div
            key={i}
            className="rounded-xl p-3 flex gap-2.5 items-start"
            style={{
              background: `linear-gradient(135deg, ${color}12, transparent 70%)`,
              border: `1px solid ${color}33`,
              borderLeft: `3px solid ${color}`,
            }}
          >
            <div className="flex-shrink-0 flex items-center justify-center"
                 style={{ width: 36, height: 36, fontSize: 18, background: `${color}25`, borderRadius: 10 }}>
              {c.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold mb-1" style={{ color, fontSize: 13 }}>{c.keyword}</p>
              <p className="leading-[1.55]" style={{ color: "rgba(255,255,255,0.82)", fontSize: 12 }}>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ⓞ 기운 총량 게이지 (Phase 2 신규 — 신강·신약 7단계) ─────────
// 양면 묘사: 강점 + 살펴볼 자리 (자원 톤 유지하되 객관적 도전 측면 정직 표기)
// ── Part 00 — 입문 챕터 (스크롤 형식) ────────────────────────────
// 7 섹션을 한 화면 세로 스크롤로 배치 + "보고서 시작 →" CTA
function IntroScrollChapter({
  sajuChild,
  childName,
  childGender,
  ilganMetaphor,
  onStart,
}: {
  sajuChild: SajuAnalysis;
  childName: string;
  childGender: "남" | "여";
  ilganMetaphor: string;
  onStart: () => void;
}) {
  const childLabel = `${childName}${childGender === "남" ? "군" : "양"}`;
  const ilgan = sajuChild.ilgan;
  const ilji = sajuChild.pillars.day.branch;
  const ilganHanja = STEM_HANJA[ilgan as keyof typeof STEM_HANJA] ?? ilgan;
  const iljiHanja = BRANCH_HANJA[ilji as keyof typeof BRANCH_HANJA] ?? ilji;
  const sectionDivider = (
    <div className="my-6 flex items-center gap-3 px-2">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }} />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>✦</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }} />
    </div>
  );
  return (
    <div className="flex-1 flex flex-col" style={{ overflowY: "auto", paddingBottom: 100 }}>
      <div className="px-4 py-6 space-y-1">
        {/* 챕터 헤더 */}
        <div className="text-center mb-3">
          <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: "#a8b8d4" }}>
            Part 00 — 들어가며
          </p>
          <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            아래로 스크롤해서 읽어주세요
          </p>
        </div>

        {/* 1. 자도인 인사 */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: ACCENT }}>─ 자도인(慈道人)의 인사 ─</p>
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}30` }}>
            <p className="text-[14px] font-bold mb-3 text-center" style={{ color: BRIGHT }}>안녕하세요, 어머님 / 아버님.</p>
            <p className="text-[12.5px] leading-[1.75]" style={{ color: "rgba(255,255,255,0.85)" }}>
              저는 <strong style={{ color: ACCENT }}>자도인(慈道人)</strong>입니다. 부모님과 자녀의 사주를 함께 들여다보며, 자녀 안에 있는 결을 풀어드리는 일을 합니다.
            </p>
            <p className="text-[12.5px] leading-[1.75] mt-3" style={{ color: "rgba(255,255,255,0.85)" }}>
              <strong style={{ color: BRIGHT }}>{childLabel}</strong>의 사주 안에는 어떤 자녀로 자라갈지에 대한 결이 담겨 있어요. 제가 그 결을 차근차근 풀어드릴 테니, 편안한 마음으로 따라와주세요.
            </p>
          </div>
        </section>

        {sectionDivider}

        {/* 2. 사주란? */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: "#7dd3c0" }}>─ 사주(四柱)란 무엇인가요? ─</p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <strong style={{ color: "#7dd3c0" }}>사주(四柱)</strong>는 한자 그대로 “네 개의 기둥”이라는 뜻이에요.
          </p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            태어난 ① 연(年) ② 월(月) ③ 일(日) ④ 시(時) 네 가지 시간의 기둥을 말합니다.
          </p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            각 기둥은 위아래 두 글자로 이루어집니다. 윗글자 = <strong>천간(天干)</strong> — 하늘의 기운, 아랫글자 = <strong>지지(地支)</strong> — 땅의 기운. 4 기둥 × 2 글자 = 8 글자, 그래서 <strong style={{ color: BRIGHT }}>사주팔자(四柱八字)</strong> 라고 부릅니다.
          </p>
          {/* 자녀 4기둥 미리보기 */}
          <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(125,211,192,0.06)", border: "1px solid rgba(125,211,192,0.25)" }}>
            <p className="text-[10px] text-center mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{childLabel}의 사주 미리보기</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "시주", stem: sajuChild.pillars.hour?.stem ?? "—", branch: sajuChild.pillars.hour?.branch ?? "—" },
                { label: "일주", stem: sajuChild.pillars.day.stem, branch: sajuChild.pillars.day.branch, mark: "★" },
                { label: "월주", stem: sajuChild.pillars.month.stem, branch: sajuChild.pillars.month.branch },
                { label: "년주", stem: sajuChild.pillars.year.stem, branch: sajuChild.pillars.year.branch },
              ].map((p, i) => (
                <div key={i} className={`rounded-lg p-2 ${p.mark ? "ring-1" : ""}`} style={{ background: p.mark ? "rgba(245,185,66,0.08)" : "rgba(255,255,255,0.03)", border: p.mark ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-[9px]" style={{ color: p.mark ? ACCENT : "rgba(255,255,255,0.4)" }}>{p.mark ?? ""} {p.label}</p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: BRIGHT }}>{STEM_HANJA[p.stem as keyof typeof STEM_HANJA] ?? p.stem}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{p.stem}</p>
                  <p className="text-[16px] font-bold mt-2" style={{ color: BRIGHT }}>{BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>{p.branch}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11.5px] leading-[1.7] italic mt-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            사주는 미래를 점치는 게 아니라, 자녀 안에 타고난 결을 읽는 <strong style={{ color: BRIGHT }}>지도(地圖)</strong>입니다.
          </p>
        </section>

        {sectionDivider}

        {/* 3. 사주의 기본 요소 — 천간·지지·오행 */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: "#7dd3c0" }}>─ 사주의 기본 요소 ─</p>

          {/* 천간 표 */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>① 천간(天干) — 하늘의 기운 10가지</p>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="grid grid-cols-5 gap-1 text-center text-[10.5px]">
                {[
                  { e: "목(木)", c: "#7dd3c0", k: "갑·을 (甲乙)", m: "큰 나무·봄풀" },
                  { e: "화(火)", c: "#ff8a8a", k: "병·정 (丙丁)", m: "햇살·등불" },
                  { e: "토(土)", c: "#e8c9a5", k: "무·기 (戊己)", m: "들판·흙" },
                  { e: "금(金)", c: "#cdd9e4", k: "경·신 (庚辛)", m: "강철·보석" },
                  { e: "수(水)", c: "#a8c4e8", k: "임·계 (壬癸)", m: "큰 강물·샘물" },
                ].map((c, i) => (
                  <div key={i} className="space-y-1 py-1">
                    <p className="font-bold" style={{ color: c.c }}>{c.e}</p>
                    <p className="text-[9.5px]" style={{ color: "rgba(255,255,255,0.78)" }}>{c.k}</p>
                    <p className="text-[8.5px] italic" style={{ color: "rgba(255,255,255,0.5)" }}>{c.m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 지지 표 — 5 오행 그룹핑 + 자녀 4지지 매핑 (Phase 5+ 직관 재구성) */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>② 지지(地支) — 땅의 기운 12가지</p>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10.5px] leading-[1.6] mb-3" style={{ color: "rgba(255,255,255,0.78)" }}>
                자녀의 결을 만드는 12지지는 <strong>다섯 오행</strong>으로 묶여요.
              </p>

              {/* 5 오행 그룹 카드 */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { e: "🌿 목", c: "#7dd3c0", h: "(木)", branches: ["인(寅)", "묘(卯)"] },
                  { e: "🔥 화", c: "#ff8a8a", h: "(火)", branches: ["사(巳)", "오(午)"] },
                  { e: "🟫 토", c: "#e8c9a5", h: "(土)", branches: ["진(辰)", "술(戌)", "축(丑)", "미(未)"] },
                  { e: "🤍 금", c: "#cdd9e4", h: "(金)", branches: ["신(申)", "유(酉)"] },
                  { e: "🔵 수", c: "#a8c4e8", h: "(水)", branches: ["해(亥)", "자(子)"] },
                ].map((g, i) => (
                  <div key={i} className="rounded-lg p-2" style={{ background: `${g.c}15`, border: `1px solid ${g.c}40` }}>
                    <p className="text-[10px] font-bold text-center mb-0.5" style={{ color: g.c }}>{g.e}</p>
                    <p className="text-[8px] text-center mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{g.h}</p>
                    <div className="space-y-0.5">
                      {g.branches.map((b, j) => (
                        <p key={j} className="text-[10px] text-center" style={{ color: BRIGHT }}>{b}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 자녀의 4지지 매핑 */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10.5px] mb-2 text-center" style={{ color: ACCENT }}>
                  ─ {childLabel}의 사주에 자리한 4지지 ─
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "시지", branch: sajuChild.pillars.hour?.branch, isStar: false },
                    { label: "★ 일지", branch: sajuChild.pillars.day.branch, isStar: true },
                    { label: "월지", branch: sajuChild.pillars.month.branch, isStar: false },
                    { label: "년지", branch: sajuChild.pillars.year.branch, isStar: false },
                  ].map((p, i) => {
                    const elemMap: Record<string, { e: string; c: string }> = {
                      인: { e: "🌿 목", c: "#7dd3c0" }, 묘: { e: "🌿 목", c: "#7dd3c0" },
                      사: { e: "🔥 화", c: "#ff8a8a" }, 오: { e: "🔥 화", c: "#ff8a8a" },
                      진: { e: "🟫 토", c: "#e8c9a5" }, 술: { e: "🟫 토", c: "#e8c9a5" },
                      축: { e: "🟫 토", c: "#e8c9a5" }, 미: { e: "🟫 토", c: "#e8c9a5" },
                      신: { e: "🤍 금", c: "#cdd9e4" }, 유: { e: "🤍 금", c: "#cdd9e4" },
                      해: { e: "🔵 수", c: "#a8c4e8" }, 자: { e: "🔵 수", c: "#a8c4e8" },
                    };
                    const m = p.branch ? elemMap[p.branch] : null;
                    return (
                      <div key={i} className="rounded-lg p-2 text-center" style={{
                        background: p.isStar ? `${ACCENT}15` : "rgba(255,255,255,0.03)",
                        border: p.isStar ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.1)",
                      }}>
                        <p className="text-[8.5px]" style={{ color: p.isStar ? ACCENT : "rgba(255,255,255,0.5)" }}>{p.label}</p>
                        <p className="text-[14px] font-bold mt-0.5" style={{ color: BRIGHT }}>
                          {p.branch ? `${BRANCH_HANJA[p.branch as keyof typeof BRANCH_HANJA] ?? p.branch}(${p.branch})` : "—"}
                        </p>
                        {m && <p className="text-[8.5px] mt-0.5" style={{ color: m.c }}>{m.e}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-[9.5px] italic mt-2 leading-[1.55] text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                *자녀의 사주 4기둥 아랫글자가 12지지 중 4개로 자리하며, 이 결의 묶음(오행)이 자녀의 일상 호흡을 만듭니다.
              </p>
            </div>
          </div>

          {/* 오행 5각 */}
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-bold" style={{ color: BRIGHT }}>③ 오행(五行) — 다섯 가지 기운</p>
            <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                {[
                  { e: "🌿 목(木)", c: "#7dd3c0", m: "성장·움직임" },
                  { e: "🔥 화(火)", c: "#ff8a8a", m: "활기·표현" },
                  { e: "🟫 토(土)", c: "#e8c9a5", m: "안정·자리잡음" },
                  { e: "🤍 금(金)", c: "#cdd9e4", m: "단단함·결단" },
                  { e: "🔵 수(水)", c: "#a8c4e8", m: "사색·고요" },
                ].map((c, i) => (
                  <div key={i} className="space-y-0.5 py-1">
                    <p className="font-bold" style={{ color: c.c }}>{c.e}</p>
                    <p className="text-[8.5px]" style={{ color: "rgba(255,255,255,0.65)" }}>{c.m}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] space-y-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                <p><strong style={{ color: "#7dd3c0" }}>생(生)</strong>: 수→목→화→토→금→수 (서로 살림)</p>
                <p><strong style={{ color: "#ff8a8a" }}>극(剋)</strong>: 수→화 / 화→금 / 금→목 / 목→토 / 토→수 (다듬음)</p>
              </div>
            </div>
          </div>
        </section>

        {sectionDivider}

        {/* 4. 일주 = 자녀 본질의 핵 */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: "#c89cff" }}>─ 자녀 본질의 핵, 일주(日柱) ─</p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            사주 4 기둥 중 가장 중요한 기둥은 <strong style={{ color: "#c89cff" }}>일주(日柱)</strong>입니다.
          </p>
          <ul className="text-[12.5px] leading-[1.75] space-y-1 ml-3" style={{ color: "rgba(255,255,255,0.85)" }}>
            <li>· 일주의 윗글자 = <strong>일간(日干)</strong> → 자녀 본질의 핵 (성격·기질·자아)</li>
            <li>· 일주의 아랫글자 = <strong>일지(日支)</strong> → 자녀 일상의 결</li>
          </ul>
          <div className="rounded-xl p-4 mt-2 text-center" style={{ background: "rgba(200,156,255,0.08)", border: "1px solid rgba(200,156,255,0.3)" }}>
            <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>{childLabel}의 일주</p>
            <p className="text-[24px] font-bold mb-1" style={{ color: BRIGHT }}>{ilganHanja}{iljiHanja}</p>
            <p className="text-[12px] mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>{ilgan}{ilji}</p>
            {ilganMetaphor && (
              <p className="text-[12.5px] italic" style={{ color: "#c89cff" }}>
                → <strong>{ilganHanja}({ilgan})</strong> — {ilganMetaphor} 같은 자녀
              </p>
            )}
          </div>
        </section>

        {sectionDivider}

        {/* 5. 십성 */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: "#a78bfa" }}>─ 자녀의 10가지 성향, 십성(十星) ─</p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <strong style={{ color: "#a78bfa" }}>십성(十星)</strong>은 자녀의 <strong>일간</strong>을 기준으로, 다른 사주 글자가 어떤 관계인지 10가지로 나눈 분류입니다.
          </p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>
            비슷한 성격끼리 묶어 <strong>5분류</strong>로 보면:
          </p>
          <div className="rounded-xl p-3" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.25)" }}>
            <ul className="text-[12px] leading-[1.8] space-y-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
              <li><strong style={{ color: "#a78bfa" }}>비겁(比劫)</strong> — 자기를 세움 <span style={{ color: "rgba(255,255,255,0.55)" }}>(비견·겁재)</span></li>
              <li><strong style={{ color: "#34d399" }}>식상(食傷)</strong> — 표현·창의 <span style={{ color: "rgba(255,255,255,0.55)" }}>(식신·상관)</span></li>
              <li><strong style={{ color: "#fbbf24" }}>재성(財星)</strong> — 손에 잡으려는 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정재·편재)</span></li>
              <li><strong style={{ color: "#60a5fa" }}>관성(官星)</strong> — 절제·규율 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정관·편관)</span></li>
              <li><strong style={{ color: "#c084fc" }}>인성(印星)</strong> — 받아들임·사색 <span style={{ color: "rgba(255,255,255,0.55)" }}>(정인·편인)</span></li>
            </ul>
          </div>
          <p className="text-[11.5px] leading-[1.7] italic" style={{ color: "rgba(255,255,255,0.65)" }}>
            {childLabel}의 5분류 분포는 본문 「우리 아이의 마음」 챕터에서 자세히 풀어드립니다.
          </p>
        </section>

        {sectionDivider}

        {/* (폐기) 자도인의 약속 섹션 — 시장 표준(양반사주·청월당)과 톤 정렬, 부정형 안심 문구 제거 */}

        {/* 7. 보고서 안내 */}
        <section className="space-y-3 py-4">
          <p className="text-[11px] tracking-[0.25em] text-center" style={{ color: BRIGHT }}>─ 보고서 안내 ─</p>
          <p className="text-[12.5px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.85)" }}>이 보고서는 다음으로 구성되어 있어요:</p>
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ul className="text-[12px] leading-[1.85] space-y-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
              <li className="italic" style={{ color: "rgba(255,255,255,0.6)" }}>· 사주팔자 (4기둥)</li>
              <li className="italic" style={{ color: "rgba(255,255,255,0.6)" }}>· 자도인 첫마디</li>
              <li>1장. 한눈에 보는 우리 아이</li>
              <li>2장. 우리 아이의 마음</li>
              <li>3장. 실전 양육 가이드</li>
              <li>4장. 엄마와 우리 아이</li>
              <li>5장. 아빠와 우리 아이</li>
              <li>6장. 강점·재능·진로</li>
              <li className="pt-1 italic" style={{ color: "rgba(255,255,255,0.6)" }}>+ 자도인의 마지막 당부</li>
            </ul>
          </div>
          {/* (폐기) 사주 근거 라벨 8 카드 — Part 01 사주 도구 카드 페이지와 중복으로 제거 */}
          <p className="text-[12.5px] leading-[1.7] text-center mt-3 italic" style={{ color: "rgba(255,255,255,0.85)" }}>
            그럼 이제, 자도인과 함께 <strong style={{ color: BRIGHT }}>{childLabel}</strong>의 사주를 펼쳐볼까요?
          </p>
        </section>

        {/* CTA — 보고서 시작 */}
        <div className="pt-4 pb-2">
          <button
            onClick={onStart}
            className="w-full rounded-2xl py-4 font-bold text-[14px] transition-all"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #f5b942cc)`,
              color: "#1a1a1a",
              boxShadow: `0 4px 24px ${ACCENT}55`,
            }}
          >
            보고서 시작 →
          </button>
        </div>
      </div>
    </div>
  );
}

function DayMasterGauge({ strength }: { strength: DayMasterStrength }) {
  const STAGES = [
    { label: "주변과 함께",   stageName: "극약", desc: "주변의 도움 속에서 가장 잘 해내는 결",   color: "#a5c4e8" },     // 극약
    { label: "함께가 편함",   stageName: "태약", desc: "혼자보다 함께할 때 마음이 편한 결",       color: "#b8d0e8" },     // 태약
    { label: "유연한 결",     stageName: "신약", desc: "주변 분위기를 잘 받아들이는 부드러운 결", color: "#cdd9e4" },     // 신약
    { label: "균형 잡힘",     stageName: "중화", desc: "혼자서도 함께서도 두루 잘 어울리는 결",   color: "#d8d3c8" },     // 중화 — 따뜻한 베이지
    { label: "주관 분명",     stageName: "신강", desc: "자기 주관이 분명한 결",                   color: "#e8c9a5" },     // 신강
    { label: "이끄는 결",     stageName: "태강", desc: "스스로 결정하고 끌어가는 결",             color: "#e8b890" },     // 태강
    { label: "스스로 끌어감", stageName: "극왕", desc: "혼자서 끝까지 밀고 나가는 결",            color: "#e8a87c" },     // 극왕
  ];
  const idx = Math.max(0, Math.min(6, strength.positionIdx));
  // 좌·우 비교용 대표 단계 (0=극약 / 6=극왕) — 가운데 제거 (사용자 요청)
  const leftRep = STAGES[0];
  const rightRep = STAGES[6];
  return (
    <div className="space-y-3 mb-4">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.25em]" style={{ color: ACCENT }}>─ 기운 총량 ─</p>
      </div>
      {/* 7단계 게이지 막대 */}
      <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {STAGES.map((s, i) => {
            const active = i === idx;
            return (
              <div
                key={i}
                className="rounded-md text-center transition-all"
                style={{
                  background: active ? s.color : `${s.color}30`,
                  border: active ? `1.5px solid ${s.color}` : `1px solid ${s.color}40`,
                  height: active ? 28 : 22,
                  marginTop: active ? 0 : 3,
                  boxShadow: active ? `0 2px 12px ${s.color}80` : "none",
                }}
                aria-label={s.desc}
              />
            );
          })}
        </div>
        {/* 각 칸 아래 명리 7단계 라벨 (사용자 요청 — 사주 표준어 시각 노출) */}
        <div className="grid grid-cols-7 gap-1">
          {STAGES.map((s, i) => {
            const active = i === idx;
            return (
              <p
                key={`name-${i}`}
                className="text-center"
                style={{
                  fontSize: 9.5,
                  fontWeight: active ? 700 : 400,
                  color: active ? s.color : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.02em",
                }}
              >
                {s.stageName}
              </p>
            );
          })}
        </div>
      </div>
      {/* 3단 비교 미니 섹션 — 좌·우만 (가운데 제거) */}
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div>
          <p className="text-[10.5px] font-bold mb-0.5" style={{ color: leftRep.color }}>◀ 왼쪽일수록 (주변과 함께)</p>
          <p className="text-[10px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.72)" }}>
            주변 사람·환경의 도움 속에서 자기 결을 펼치는 자녀 — 부드럽고 협조적이지만 혼자 결정해야 할 때 부담을 느낄 수 있음
          </p>
        </div>
        <div>
          <p className="text-[10.5px] font-bold mb-0.5" style={{ color: rightRep.color }}>▶ 오른쪽일수록 (스스로 끌어감)</p>
          <p className="text-[10px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.72)" }}>
            스스로 결정하고 이끌어가는 자녀 — 추진력이 분명하지만 남의 의견을 받아들이기 어려울 수 있음
          </p>
        </div>
      </div>
    </div>
  );
}

// (Phase 5 폐기) QuadrantMatrix 4분면 매트릭스 — 비전통 프레임으로 롤백 후 dead code 제거됨

// ── Phase 4: 사춘기에 결이 변하는 시기 — 3 단계 박스 시각 카드 (사용자 정책: U곡선 → 3단계로 직관화) ────
function CrisisTimingCard({ timing, parentLabel: _parentLabel }: { timing: CrisisTiming; parentLabel: string }) {
  void _parentLabel;
  const stageColor = timing.pubertyStage === "peak" ? "#e8a87c" : "#c4b5e8"; // 절정=주황 / 입구=보라
  const stageLabel = timing.pubertyStage === "peak" ? "사춘기 절정" : "사춘기 입구";
  const peakAgeShort = timing.ageRange.replace("만 ", "").replace(" 무렵", "");
  return (
    <div className="space-y-3 mb-4">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.25em]" style={{ color: ACCENT }}>─ 결이 변하는 시기 ─</p>
      </div>
      <div
        className="rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${stageColor}18, ${stageColor}06 70%, transparent)`,
          border: `1px solid ${stageColor}40`,
        }}
      >
        {/* 시기·단계 표시 */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>다가오는 시기</p>
            <p className="font-bold leading-tight" style={{ color: stageColor, fontSize: 14 }}>
              {timing.ageRange}
            </p>
          </div>
          <div
            className="rounded-full px-3 py-1.5 text-[10.5px] font-bold whitespace-nowrap"
            style={{
              background: `${stageColor}20`,
              color: stageColor,
              border: `1px solid ${stageColor}55`,
            }}
          >
            {stageLabel}
          </div>
        </div>

        {/* 대운 데이터 명시 (사용자 정책 — 두 페이지 연결성 강화) */}
        {timing.daeunCycle && (
          <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: `1px dashed ${stageColor}55` }}>
            <p className="text-[10.5px]" style={{ color: "rgba(255,255,255,0.7)" }}>
              🔮 자녀의 대운 변환점 — <strong style={{ color: stageColor }}>{timing.daeunCycle.stem}{timing.daeunCycle.branch}</strong> 진입 시점
            </p>
            <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              평생 대운 흐름은 다음 페이지(자녀 인생 흐름)에서 자세히 풀어드립니다
            </p>
          </div>
        )}

        {/* 3 단계 박스 — 현재 → 변화 시기 → 이후 */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 items-stretch">
          {/* 단계 1: 현재 */}
          <div className="rounded-xl p-2.5 text-center flex flex-col" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>현재</p>
            <p className="text-[11px] font-bold leading-tight flex-1 flex items-center justify-center" style={{ color: BRIGHT }}>
              부모 곁에서<br/>자라는 자녀
            </p>
          </div>
          {/* 화살표 + 변화 시기 (강조) */}
          <div className="rounded-xl p-2.5 text-center flex flex-col" style={{ background: `${stageColor}25`, border: `1.5px solid ${stageColor}` }}>
            <p className="text-[9px] mb-1" style={{ color: stageColor, fontWeight: 700 }}>★ {peakAgeShort}</p>
            <p className="text-[11px] font-bold leading-tight flex-1 flex items-center justify-center" style={{ color: BRIGHT }}>
              자기 세계를<br/>깊이 파고드는<br/>시기
            </p>
          </div>
          {/* 단계 3: 이후 */}
          <div className="rounded-xl p-2.5 text-center flex flex-col" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>이후</p>
            <p className="text-[11px] font-bold leading-tight flex-1 flex items-center justify-center" style={{ color: BRIGHT }}>
              자기 결로<br/>단단해진<br/>자녀
            </p>
          </div>
        </div>

        {/* 화살표 (시간 흐름) */}
        <div className="flex items-center justify-between mt-2 px-2 text-[10px]" style={{ color: stageColor }}>
          <span>→</span>
          <span style={{ opacity: 0.5 }}>시간 흐름</span>
          <span>→</span>
        </div>
      </div>
      <p className="text-[10px] text-center italic" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
        결이 변하는 시기는 멀어짐이 아니라 자녀가 자기 결을 단단히 세우는 자리입니다
      </p>
    </div>
  );
}

// ── ⑤ 갈등 카드 (좌·중·우 충돌 카드) ─────────────────────────────
// Phase 1: 화살표 방향성 추가 — 부모/아이 결 강도 차에 따른 자연 흐름 표시
// → (강 → 약), ← (약 ← 강), ⇄ (비슷), ↔/· (legacy fallback → ⇄ 동치 처리)
type ArrowDirection = "→" | "←" | "⇄";
type ConflictItem = { parentSide: string; childSide: string; scene: string; emoji: string; basis?: string; guide?: string; arrow: ArrowDirection };
type ConflictCards = { items: ConflictItem[] };
function parseConflictCards(text: string): ConflictCards | null {
  const lines = text.split("\n").map((l) => l.trim());
  const items: ConflictItem[] = [];
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (l.startsWith("[갈등]") || l.startsWith("[부딪히는]") || l.startsWith("[충돌]")) { inList = true; continue; }
    if (!inList) continue;
    const stripped = l.replace(/^[•\-]\s*/, "");
    const emojiMatch = stripped.match(EMOJI_RE);
    let emoji = "⚡"; let rest = stripped;
    if (emojiMatch) { emoji = emojiMatch[1].trim(); rest = stripped.slice(emojiMatch[0].length).trim(); }
    // 형식: **부모결 [화살표] 아이결** — 일상 장면
    // 화살표: → ← ⇄ (Phase 1) + ↔ · (legacy fallback)
    const m = rest.match(/^\*\*(.+?)\s*([→←⇄↔·])\s*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    const rawArrow = m[2];
    const arrow: ArrowDirection = rawArrow === "→" ? "→" : rawArrow === "←" ? "←" : "⇄";
    // 다음 줄(들)에서 📌 사주 근거 / 💡 가이드 캡처
    let basis: string | undefined;
    let guide: string | undefined;
    let look = i + 1;
    while (look < lines.length) {
      const nl = lines[look];
      if (/^📌/.test(nl)) {
        basis = nl.replace(/^📌\s*/, "").trim();
        look++;
        i = look - 1;
      } else if (/^💡/.test(nl)) {
        guide = nl.replace(/^💡\s*/, "").trim();
        look++;
        i = look - 1;
      } else {
        break;
      }
    }
    items.push({ parentSide: m[1].trim(), childSide: m[3].trim(), scene: m[4].trim(), emoji, basis, guide, arrow });
  }
  if (items.length === 0) return null;
  return { items };
}
function ConflictCardsGrid({ cards, parentColor, parentLabel }: { cards: ConflictCards; parentColor: string; parentLabel: string }) {
  const childColor = "#7dd3c0"; // mint teal — 엄마(rose pink)와 보색 가까워 시각 구분 명확
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span style={{ color: "#f87171", fontSize: 14 }}>⚡</span>
        <p className="font-bold tracking-wide" style={{ color: "#f87171", fontSize: 12.5 }}>
          자주 부딪히는 결
        </p>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #f8717140, transparent)" }} />
      </div>
      <div className="space-y-2.5">
        {cards.items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl p-3"
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.3)",
            }}
          >
            <div className="grid grid-cols-3 items-center gap-2 mb-2">
              <div className="text-right">
                <p className="text-[10px] mb-0.5" style={{ color: parentColor }}>{parentLabel}</p>
                <p className="font-bold" style={{ color: "rgba(255,255,255,0.92)", fontSize: 13 }}>{it.parentSide}</p>
              </div>
              <div className="text-center flex flex-col items-center gap-0.5">
                <span style={{ fontSize: 18 }}>{it.emoji}</span>
                <span
                  className="font-bold leading-none"
                  style={{
                    fontSize: 14,
                    color: "rgba(248,113,113,0.85)",
                    letterSpacing: "0.05em",
                  }}
                  aria-label={
                    it.arrow === "→" ? `${parentLabel} 결이 아이 결을 살피는 자연 흐름`
                    : it.arrow === "←" ? "아이 결이 먼저 흐름을 잡는 자리"
                    : "두 결이 서로 맞물리는 자리"
                  }
                >
                  {it.arrow}
                </span>
              </div>
              <div>
                <p className="text-[10px] mb-0.5" style={{ color: childColor }}>아이</p>
                <p className="font-bold" style={{ color: "rgba(255,255,255,0.92)", fontSize: 13 }}>{it.childSide}</p>
              </div>
            </div>
            <p className="text-[12px] leading-[1.55] pt-2" style={{ color: "rgba(255,255,255,0.78)", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
              {it.scene}
            </p>
            {it.basis && (
              <div
                className="mt-2.5 rounded-md px-2.5 py-1.5"
                style={{
                  background: "rgba(245,185,66,0.06)",
                  border: `1px solid ${ACCENT}40`,
                }}
              >
                <p className="text-[10.5px] leading-[1.5]" style={{ color: ACCENT, fontWeight: 600 }}>
                  📌 <span style={{ color: "rgba(255,255,255,0.82)", fontWeight: 400 }}>{it.basis}</span>
                </p>
              </div>
            )}
            {it.guide && (
              <div
                className="mt-1.5 rounded-md px-2.5 py-1.5"
                style={{
                  background: "rgba(125,211,192,0.07)",
                  border: `1px solid #7dd3c055`,
                }}
              >
                <p className="text-[10.5px] leading-[1.5]" style={{ color: "#7dd3c0", fontWeight: 600 }}>
                  💡 <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 400 }}>{it.guide}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <p
        className="text-[10px] text-center pt-1 italic"
        style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}
      >
        ↑ 화살표는 사주가 가리키는 자연 흐름입니다
      </p>
    </div>
  );
}

// ── ⑥ 한 가지 선물 박스 ──────────────────────────────────────────
type GiftCard = { emoji: string; keyword: string; quote: string };
function parseGiftCard(text: string): GiftCard | null {
  const lines = text.split("\n").map((l) => l.trim());
  let emoji = "🎁", keyword = "", quote = "";
  let foundMarker = false;
  for (const l of lines) {
    if (!l) continue;
    if (l.startsWith("[선물]") || l.startsWith("[한 가지]") || l.startsWith("[조절할 점]")) { foundMarker = true; continue; }
    if (!foundMarker) continue;
    const emojiMatch = l.match(EMOJI_RE);
    let rest = l;
    if (emojiMatch) { emoji = emojiMatch[1].trim(); rest = l.slice(emojiMatch[0].length).trim(); }
    const m = rest.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (m) { keyword = m[1].trim(); quote = m[2].trim(); break; }
  }
  if (!keyword) return null;
  return { emoji, keyword, quote };
}
function GiftBoxCard({ gift, color }: { gift: GiftCard; color: string }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-center tracking-[0.2em]" style={{ color }}>
        🎁 한 가지 선물
      </p>
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}18, ${color}06 60%, transparent)`,
          border: `1px solid ${color}50`,
          boxShadow: `0 4px 20px ${color}20`,
        }}
      >
        <div
          className="mx-auto mb-3 flex items-center justify-center"
          style={{
            width: 64, height: 64,
            fontSize: 32,
            background: `${color}25`,
            borderRadius: 16,
            border: `1px solid ${color}50`,
          }}
        >
          {gift.emoji}
        </div>
        <p className="font-bold mb-3" style={{ color, fontSize: 17, letterSpacing: "-0.01em" }}>
          {gift.keyword}
        </p>
        <p
          className="leading-[1.7] italic mx-auto max-w-md"
          style={{ color: "rgba(255,255,255,0.9)", fontSize: 13.5 }}
        >
          "{(() => {
            // 마크다운 ** 강조 처리
            const parts: ReactNode[] = [];
            const re = /\*\*(.+?)\*\*/g;
            let last = 0;
            let m: RegExpExecArray | null;
            let i = 0;
            while ((m = re.exec(gift.quote)) !== null) {
              if (m.index > last) parts.push(gift.quote.slice(last, m.index));
              parts.push(<strong key={`g-${i++}`} style={{ color, fontWeight: 700, fontStyle: "normal" }}>{m[1]}</strong>);
              last = m.index + m[0].length;
            }
            if (last < gift.quote.length) parts.push(gift.quote.slice(last));
            return parts.length > 0 ? parts : gift.quote;
          })()}"
        </p>
      </div>
    </div>
  );
}

// ── 자녀 6요인 행동 지표 (사주 → 점수화) ──────
// 사주 데이터에서 자녀의 6가지 핵심 행동 결을 점수(0-100)로 도출
type ChildSixFactors = {
  활동성: number;   // 일간 화·목 + 양간
  표현력: number;   // 식상 강도
  감수성: number;   // 인성 강도
  끈기: number;     // 비겁 + 토 강도
  창의성: number;   // 식상 + 일간 양간
  자기조절: number; // 관성 강도
};
function getChildSixFactors(saju: SajuAnalysis, sipseong: { 비겁: number; 식상: number; 재성: number; 관성: number; 인성: number }): ChildSixFactors {
  const elem = saju.elements as Record<string, number>;
  const stem = saju.ilgan;
  const isYang = ["갑", "병", "무", "경", "임"].includes(stem);
  const stemElem: Record<string, string> = {
    갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
    기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
  };
  const myElem = stemElem[stem] ?? "토";
  // 0-100 정규화 (각 결의 강·약 신호를 합산)
  const norm = (v: number, max = 5) => Math.min(100, Math.max(15, Math.round((v / max) * 100)));
  return {
    활동성:   norm((elem.화 ?? 0) + (elem.목 ?? 0) * 0.6 + (isYang ? 1.5 : 0) + (myElem === "화" ? 1.5 : 0), 7),
    표현력:   norm(sipseong.식상 * 1.4 + (elem.화 ?? 0) * 0.4, 6),
    감수성:   norm(sipseong.인성 * 1.4 + (elem.수 ?? 0) * 0.4, 6),
    끈기:     norm(sipseong.비겁 * 1.0 + (elem.토 ?? 0) * 0.8 + (elem.금 ?? 0) * 0.6, 6),
    창의성:   norm(sipseong.식상 * 1.0 + (elem.화 ?? 0) * 0.5 + (elem.목 ?? 0) * 0.4 + (isYang ? 1 : 0), 6),
    자기조절: norm(sipseong.관성 * 1.4 + (elem.금 ?? 0) * 0.4 + (elem.토 ?? 0) * 0.3, 6),
  };
}
// 6요인 막대 그래프 컴포넌트 (STS 스타일)
function SixFactorBars({ factors }: { factors: ChildSixFactors }) {
  const ORDER: Array<{ key: keyof ChildSixFactors; label: string; meaning: string; color: string }> = [
    { key: "활동성",   label: "활동성",   meaning: "에너지·움직임",     color: "#ff8fb3" },
    { key: "표현력",   label: "표현력",   meaning: "마음을 밖으로",     color: "#ffd166" },
    { key: "감수성",   label: "감수성",   meaning: "마음의 떨림",        color: "#c89cff" },
    { key: "끈기",     label: "끈기",     meaning: "꾸준한 결",          color: "#7dd3c0" },
    { key: "창의성",   label: "창의성",   meaning: "새로움을 만드는 결", color: "#ff9d6b" },
    { key: "자기조절", label: "자기조절", meaning: "스스로 멈추는 결",   color: "#7eb6ff" },
  ];
  return (
    <div className="rounded-xl px-4 py-3 mt-3"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="text-[11px] tracking-widest text-center mb-3" style={{ color: BRIGHT }}>
        ─ 6가지 결의 강도 ─
      </p>
      <div className="space-y-2.5">
        {ORDER.map((item) => {
          const val = factors[item.key];
          return (
            <div key={item.key}>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-bold" style={{ color: item.color }}>{item.label}</span>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>{item.meaning}</span>
                </div>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: item.color }}>{val}</span>
              </div>
              <div className="relative h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                <div className="absolute top-0 left-0 h-full rounded-full transition-all"
                  style={{ width: `${val}%`, backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}66` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-center mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
        사주에서 도출된 자녀의 6가지 행동 결 — 100에 가까울수록 그 결이 강합니다
      </p>
    </div>
  );
}

// ── 오행 % 표시용 보정 (7% floor + 강한 결 비례 감산) ──
// 차트 표시값 = raw 데이터 그대로 (floor 제거).
// 이전에는 7% floor 적용 (시각화 보정) 했으나, 본문 (raw 0%) 과 정반대로 보이는 모순 발생.
// 사용자 신뢰도 직격 → floor 제거하여 차트와 본문 정합 (옵션 D 잔존 영역 C-19 해소).
function adjustElementsForDisplay(raw: Record<string, number>): Record<string, number> {
  const ORDER = ["목", "화", "토", "금", "수"];
  const total = ORDER.reduce((s, k) => s + (raw[k] || 0), 0) || 1;
  const pct: Record<string, number> = {};
  for (const k of ORDER) pct[k] = ((raw[k] || 0) / total) * 100;
  return pct;
}

// ── 차트 컴포넌트 ──────────────────────────

const ELEM_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
const ELEM_DESC: Record<string, string> = {
  목: "호기심", 화: "열정", 토: "안정", 금: "결단", 수: "지혜",
};
const ELEM_NAME_FRIENDLY: Record<string, { label: string; meaning: string }> = {
  목: { label: "나무 — 호기심·성장", meaning: "자라남·생명" },
  화: { label: "불 — 열정·표현",     meaning: "빛남·열정" },
  토: { label: "흙 — 안정·신뢰",     meaning: "안정·품" },
  금: { label: "쇠 — 결단·의지",     meaning: "단단함·결단" },
  수: { label: "물 — 지혜·유연",     meaning: "지혜·흐름" },
};

// ── 외향-내향 시각화 (양 기운 vs 음 기운) ──────
function YinYangBar({ saju }: { saju: SajuAnalysis }) {
  // 양 기운 = 목·화 합산, 음 기운 = 금·수 합산, 토는 중성으로 절반씩
  const elem = saju.elements as Record<string, number>;
  const yang = (elem.목 ?? 0) + (elem.화 ?? 0) + (elem.토 ?? 0) * 0.5;
  const yin = (elem.금 ?? 0) + (elem.수 ?? 0) + (elem.토 ?? 0) * 0.5;
  const total = yang + yin || 1;
  const yangPct = Math.round((yang / total) * 100);
  const yinPct = 100 - yangPct;
  const dominant = yangPct >= yinPct ? "외향" : "내향";
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[11px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>
        ─ 외향 vs 내향 ─
      </p>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <span className="text-[13px] font-bold" style={{ color: "#ff9d6b" }}>외향</span>
          <span className="text-[18px] font-bold ml-2" style={{ color: "#ff9d6b" }}>{yangPct}%</span>
        </div>
        <div className="text-right">
          <span className="text-[18px] font-bold mr-2" style={{ color: "#7eb6ff" }}>{yinPct}%</span>
          <span className="text-[13px] font-bold" style={{ color: "#7eb6ff" }}>내향</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div className="h-full" style={{ width: `${yangPct}%`, background: "linear-gradient(90deg, #ff9d6b, #ffb088)" }} />
        <div className="h-full" style={{ width: `${yinPct}%`, background: "linear-gradient(90deg, #7eb6ff, #5e9eff)" }} />
      </div>
      <p className="text-[12px] mt-3 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.7)" }}>
        우리 아이는 <strong style={{ color: dominant === "외향" ? "#ff9d6b" : "#7eb6ff" }}>{dominant}적인 성향</strong>이 {Math.max(yangPct, yinPct)}% — {(() => {
          // 강도별 분기 (3단계 × 2 = 6 변종) — 같은 외향/내향이라도 강도별로 다른 메시지
          const max = Math.max(yangPct, yinPct);
          if (dominant === "외향") {
            if (max >= 70) return "사람·활동 속에서 에너지를 얻는 편 (활기형)";
            if (max >= 60) return "사람·활동을 좋아하면서도 혼자 시간도 챙기는 편 (균형형 외향)";
            return "외향이 살짝 우세 — 사람과 혼자 시간을 비슷하게 좋아하는 편 (양면형)";
          } else {
            if (max >= 70) return "혼자 사색하며 에너지를 충전하는 편 (사색형)";
            if (max >= 60) return "혼자 시간을 선호하면서도 가까운 사람과 어울리는 편 (균형형 내향)";
            return "내향이 살짝 우세 — 혼자와 함께를 비슷하게 좋아하는 편 (양면형)";
          }
        })()}
      </p>
    </div>
  );
}

// ── 오행 통합형 스펙트럼 (라벨과 묘사 통합: 본질 키워드와 우세 모습을 한 줄로) ──────
const ELEM_SPECTRUM: Record<string, { weak: string; strong: string; balanced: string }> = {
  목: {
    weak: "호기심·성장보다 신중함이 두드러짐",
    strong: "호기심·성장이 강해 새 도전을 좋아함",
    balanced: "호기심과 신중함이 고루 있음",
  },
  화: {
    weak: "열정·표현보다 차분함이 두드러짐",
    strong: "열정·표현이 강해 감정이 풍부함",
    balanced: "열정과 차분함이 고루 있음",
  },
  토: {
    weak: "안정·신뢰보다 새로운 자극을 더 끌리게 느낌",
    strong: "안정·신뢰가 강해 끝까지 한결같음",
    balanced: "안정과 변화가 고루 있음",
  },
  금: {
    weak: "결단·의지보다 부드러운 양보가 두드러짐",
    strong: "결단·의지가 강해 결단력이 분명함",
    balanced: "결단과 부드러움이 고루 있음",
  },
  수: {
    weak: "지혜·유연보다 빠른 행동이 앞서는 결",
    strong: "지혜·유연이 강해 적응을 잘함",
    balanced: "고집과 유연이 고루 있음",
  },
};
function SpectrumTable({ elements }: { elements: Record<string, number> }) {
  const ORDER = ["목", "화", "토", "금", "수"];
  const adjusted = adjustElementsForDisplay(elements);
  return (
    <div className="mt-4">
      {/* 안내문 — 부모가 표를 읽는 방법 */}
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3"
        style={{ color: `${ACCENT}cc` }}>
        ※ 우리 아이의 다섯 기운 분포입니다. <strong style={{ color: BRIGHT }}>그 결이 강하면 본질 그대로</strong>,
        <strong style={{ color: BRIGHT }}> 약하면 반대 모습</strong>이 일상에서 두드러집니다.
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
          const phrase =
            dominant === "balanced"
              ? ELEM_SPECTRUM[el].balanced
              : dominant === "strong"
              ? ELEM_SPECTRUM[el].strong
              : ELEM_SPECTRUM[el].weak;
          const arrow = dominant === "strong" ? "↑" : dominant === "weak" ? "↓" : "≈";
          const arrowLabel = dominant === "strong" ? "강함" : dominant === "weak" ? "약함" : "균형";
          return (
            <div key={el} className="px-3 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-xl font-bold" style={{ color }}>{ELEM_HANJA[el]}</span>
                <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {ELEM_NAME_FRIENDLY[el].label.replace(/^.*— /, "")}
                </span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{pct}%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold" style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.5)" : color }}>
                  {arrow} {arrowLabel}
                </span>
                <p className="text-[13px] leading-snug flex-1"
                  style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)" }}>
                  {phrase}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 오행 분포 레이더 (5각형) — 표시용 7% floor 적용
function ElementsRadar({ elements }: { elements: Record<string, number> }) {
  const ELEM_ORDER = ["목", "화", "토", "금", "수"];
  // 표시용 보정 (7% floor + 비례 감산)
  const adjusted = adjustElementsForDisplay(elements);
  const topEl = (Object.entries(adjusted).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? "목";
  const cx = 170, cy = 175, R = 75;
  const MIN_SCALE = 0; // 0% 결은 차트 중심 — 본문 raw 데이터와 완전 일치
  const maxVal = Math.max(...ELEM_ORDER.map((el) => adjusted[el] || 0), 1);
  const angs = ELEM_ORDER.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [
    cx + R * s * Math.cos(angs[i]),
    cy + R * s * Math.sin(angs[i]),
  ];
  const gridPts = (s: number) => ELEM_ORDER.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = ELEM_ORDER.map((el, i) => {
    // 절대 스케일 — 50%가 꼭짓점 (단일 오행의 현실적 최대값 기준)
    // 50% 초과(드문 종왕격 등)는 1.0으로 cap하여 격자 밖 튀어나옴 방지
    const raw = (adjusted[el] || 0) / 50;
    const s = Math.min(1.0, Math.max(MIN_SCALE, raw));
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
        {/* 그리드 내부 % 라벨 제거 — 외곽 오행별 % 가 이미 정확값 표시 (가독성 강화) */}
        {ELEM_ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        <polygon points={dataPts} fill={`${ELEM_COLORS[topEl]}35`}
          stroke={ELEM_COLORS[topEl]} strokeWidth="2.5" strokeLinejoin="round" />
        {ELEM_ORDER.map((el, i) => {
          const [lx, ly] = pt(i, LO);
          const pct = Math.round(adjusted[el] ?? 0);
          const isTop = el === topEl;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          return (
            <g key={i}>
              <text x={lx + dx} y={ly - 10} textAnchor={anchor} fontSize="22" fontWeight="bold" fill={ELEM_COLORS[el]}>
                {ELEM_HANJA[el]}
              </text>
              <text x={lx + dx} y={ly + 12} textAnchor={anchor} fontSize="16" fontWeight={isTop ? "bold" : "normal"} fill={ELEM_COLORS[el]}>
                {pct}%
              </text>
              <text x={lx + dx} y={ly + 26} textAnchor={anchor} fontSize="11" fill="rgba(255,255,255,0.65)">
                {ELEM_DESC[el].split("·")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 십성 통합형 스펙트럼 (오행 표와 동일 패턴 — 멍청이도 이해 가능한 친절 묘사) ──
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

function SipseongSpectrumTable({ counts }: { counts: SipseongCount }) {
  const ORDER: Array<keyof SipseongCount> = ["비겁", "식상", "재성", "관성", "인성"];
  // 평균: 합 / 5
  const total = ORDER.reduce((s, k) => s + counts[k], 0);
  const avg = total / 5; // 보통 1.5~2
  const SIP_COLORS: Record<string, string> = {
    비겁: "#f5b942",  // 골드
    식상: "#ff9d6b",  // 오렌지
    재성: "#7dd3c0",  // 청록
    관성: "#7eb6ff",  // 파랑
    인성: "#c89cff",  // 라벤더
  };
  return (
    <div className="mt-4">
      <p className="text-[11px] leading-relaxed text-center mb-3 px-3"
        style={{ color: `${ACCENT}cc` }}>
        ※ 우리 아이의 다섯 색깔(기질) 분포입니다. <strong style={{ color: BRIGHT }}>그 색이 강하면 본질 그대로</strong>,
        <strong style={{ color: BRIGHT }}> 약하면 반대 모습</strong>이 일상에서 두드러집니다.
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
        {ORDER.map((k) => {
          const v = counts[k];
          const color = SIP_COLORS[k];
          const diff = v - avg;
          let dominant: "weak" | "strong" | "balanced";
          if (v === 0) dominant = "weak";  // 0은 무조건 약함
          else if (Math.abs(diff) <= 0.4) dominant = "balanced";
          else if (diff > 0) dominant = "strong";
          else dominant = "weak";
          const data = SIPSEONG_SPECTRUM[k];
          const phrase =
            dominant === "balanced" ? data.balanced
              : dominant === "strong" ? data.strong
              : data.weak;
          const arrow = dominant === "strong" ? "↑" : dominant === "weak" ? "↓" : "≈";
          const arrowLabel = dominant === "strong" ? "강함" : dominant === "weak" ? "약함" : "균형";
          return (
            <div key={k} className="px-3 py-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[15px] font-bold" style={{ color }}>{k}</span>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {data.label}
                </span>
                <span className="text-[13px] font-bold ml-auto" style={{ color }}>{v}</span>
              </div>
              <p className="text-[10.5px] leading-snug mb-1.5"
                style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
                {data.explain}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-bold flex-shrink-0"
                  style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.5)" : color }}>
                  {arrow} {arrowLabel}
                </span>
                <p className="text-[12.5px] leading-snug flex-1"
                  style={{ color: dominant === "balanced" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)" }}>
                  {phrase}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 십성 5범주 레이더 — 0인 결은 "외부에서 채우는 자리"로 부드럽게 표시
function SipseongRadar({ counts }: { counts: SipseongCount }) {
  const ORDER: (keyof SipseongCount)[] = ["비겁", "식상", "재성", "관성", "인성"];
  const top = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]) as keyof SipseongCount;
  const cx = 170, cy = 200, R = 70;
  const MIN_SCALE = 0.08;
  // 0인 결은 표시용으로 1로 보정 (옅게 칠해짐)
  const displayCounts: Record<string, number> = {};
  ORDER.forEach((k) => { displayCounts[k] = counts[k] === 0 ? 1 : counts[k]; });
  const maxVal = Math.max(...ORDER.map((k) => displayCounts[k]), 1);
  const angs = ORDER.map((_, i) => ((i * 72 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [
    cx + R * s * Math.cos(angs[i]),
    cy + R * s * Math.sin(angs[i]),
  ];
  const gridPts = (s: number) => ORDER.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = ORDER.map((k, i) => {
    // 절대 스케일 — 5 = 단일 십성의 현실적 최대값 (보통 0~4 범위, 종격은 5+)
    // 5 초과(드문 종격)는 1.0으로 cap하여 격자 밖 튀어나옴 방지
    const raw = displayCounts[k] / 5;
    const s = Math.min(1.0, Math.max(MIN_SCALE, raw));
    return pt(i, s).join(",");
  }).join(" ");
  const LO = 1.42;
  return (
    <div className="flex justify-center">
      <svg width="340" height="380" viewBox="0 0 340 380">
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((s, gi) => (
          <polygon key={gi} points={gridPts(s)} fill="none"
            stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
            strokeWidth={s === 1.0 ? 1.2 : 0.8} />
        ))}
        {/* 그리드 내부 카운트 라벨 제거 — 외곽 십성별 카운트 가 이미 정확값 표시 (가독성 강화) */}
        {ORDER.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
        })}
        {/* 방사형 막대 — 0인 결은 그리지 않음 (연결 폴리곤 대신 직관적 막대) */}
        {ORDER.map((k, i) => {
          if (counts[k] === 0) return null;
          // 절대 스케일 — 5 = 단일 십성의 현실적 최대값 (5 초과는 cap)
          const raw = displayCounts[k] / 5;
          const s = Math.min(1.0, Math.max(MIN_SCALE, raw));
          const [x, y] = pt(i, s);
          return (
            <line
              key={`bar-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={ACCENT}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}
        {ORDER.map((k, i) => {
          const [lx, ly] = pt(i, LO);
          const isTop = k === top;
          const isZero = counts[k] === 0;
          const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
          const dx = anchor === "end" ? -4 : anchor === "start" ? 4 : 0;
          const labelColor = isZero
            ? "rgba(255,255,255,0.45)"
            : isTop
            ? BRIGHT
            : "rgba(255,255,255,0.85)";
          const subColor = isZero ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.6)";
          return (
            <g key={i}>
              {/* 1줄: 카테고리명 (0이면 숫자 없이) */}
              <text x={lx + dx} y={ly - 8} textAnchor={anchor} fontSize="14"
                fontWeight={isTop ? "bold" : "normal"} fill={labelColor}>
                {isZero ? k : `${k} ${counts[k]}`}
              </text>
              {/* 2줄: 의미 (학습·사색 같은) */}
              <text x={lx + dx} y={ly + 8} textAnchor={anchor} fontSize="10" fill={subColor}>
                {SIPSEONG_DESC[k]}
              </text>
              {/* 3줄: 0인 경우만 — "약한 부분" 안내 */}
              {isZero && (
                <text x={lx + dx} y={ly + 22} textAnchor={anchor} fontSize="10"
                  fill="rgba(255,255,255,0.45)" fontWeight="600">
                  약한 부분
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 8지능 카드 (top 3)
function IntelligenceCards({ list }: { list: IntelligenceCard[] }) {
  const max = Math.max(...list.map((c) => c.score), 1);
  return (
    <div className="space-y-3">
      {list.map((c, i) => (
        <div key={c.name} className="rounded-2xl p-4"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}1a, rgba(255,255,255,0.04))`,
            border: `1px solid ${ACCENT}55`,
          }}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg"
              style={{
                color: GOLD,
                backgroundColor: `${GOLD}15`,
                fontFamily: "'Ma Shan Zheng', serif",
              }}
            >
              {c.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${BRIGHT}33`, color: BRIGHT }}>
                  TOP {i + 1}
                </span>
                <p className="text-base font-bold" style={{ color: BRIGHT }}>{c.name}</p>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{c.desc}</p>
            </div>
          </div>
          {/* 막대 그래프 */}
          <div className="h-2 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${(c.score / max) * 100}%`,
                background: `linear-gradient(90deg, ${ACCENT}, ${BRIGHT})`,
              }} />
          </div>
          <div className="mt-2.5 rounded-lg p-2.5"
            style={{ backgroundColor: `${ACCENT}10`, borderLeft: `3px solid ${ACCENT}` }}>
            <p className="text-[10px] tracking-wider mb-1" style={{ color: ACCENT, fontWeight: "bold" }}>
              ─ 왜 이 재능이 두드러지나요? (사주 근거) ─
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
              {c.basis}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 사고 유형 2x2 매트릭스 ──────────────
function ThinkingMatrix({ tt }: { tt: ThinkingType }) {
  const SIZE = 240;
  const PAD = 30;
  const inner = SIZE - PAD * 2;
  // x: -1~1 → PAD~SIZE-PAD
  const cx = PAD + (tt.x + 1) / 2 * inner;
  const cy = PAD + (1 - tt.y) / 2 * inner; // y 양수=논리=위쪽
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[11px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>
        ─ 사고 유형 ─
      </p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 30} viewBox={`0 0 ${SIZE} ${SIZE + 30}`}>
          {/* 사분면 배경 */}
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(124,179,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,193,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(196,156,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          {/* 십자축 */}
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          {/* 외곽선 */}
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          {/* 축 라벨 */}
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#7eb6ff">논리</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ff9d6b">감각</text>
          <text x={PAD - 4} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#c89cff">직관</text>
          <text x={SIZE - PAD + 4} y={SIZE / 2 + 4} textAnchor="start" fontSize="13" fontWeight="bold" fill="#ffc16b">관계</text>
          {/* 자녀 위치 점 */}
          <circle cx={cx} cy={cy} r="11" fill={ACCENT} stroke={BRIGHT} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={`${ACCENT}55`} strokeWidth="1.5">
            <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="mt-2 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: `${ACCENT}22`, color: BRIGHT, border: `1px solid ${ACCENT}66` }}>
          {tt.dominant}
        </span>
        <p className="text-[12px] mt-2 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.7)" }}>
          {tt.desc}
        </p>
      </div>
    </div>
  );
}

// ── 진로 6각형 레이더 ──────────────
function JobRadar({ items }: { items: JobRadarItem[] }) {
  const SIZE = 290;
  const cx = SIZE / 2, cy = SIZE / 2 + 4, R = 85;
  const angs = items.map((_, i) => ((i * 60 - 90) * Math.PI) / 180);
  const pt = (i: number, s: number): [number, number] => [
    cx + R * s * Math.cos(angs[i]),
    cy + R * s * Math.sin(angs[i]),
  ];
  const gridPts = (s: number) => items.map((_, i) => pt(i, s).join(",")).join(" ");
  const dataPts = items.map((it, i) => pt(i, Math.max(0.08, it.score / 100)).join(",")).join(" ");
  const top = [...items].sort((a, b) => b.score - a.score)[0];
  const LO = 1.32;
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[11px] tracking-[0.25em] text-center mb-2" style={{ color: ACCENT }}>
        ─ 6가지 진로의 결 ─
      </p>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE + 12} viewBox={`0 0 ${SIZE} ${SIZE + 12}`}>
          {[0.25, 0.5, 0.75, 1.0].map((s, gi) => (
            <polygon key={gi} points={gridPts(s)} fill="none"
              stroke={s === 1.0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}
              strokeWidth={s === 1.0 ? 1.2 : 0.8} />
          ))}
          {items.map((_, i) => {
            const [x, y] = pt(i, 1);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
          })}
          <polygon points={dataPts} fill={`${ACCENT}40`} stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />
          {items.map((it, i) => {
            const [lx, ly] = pt(i, LO);
            const isTop = it.name === top.name;
            const anchor = lx < cx - 8 ? "end" : lx > cx + 8 ? "start" : "middle";
            return (
              <g key={i}>
                <text x={lx} y={ly} textAnchor={anchor} fontSize="13" fontWeight={isTop ? "bold" : "600"}
                  fill={isTop ? BRIGHT : "rgba(255,255,255,0.78)"}>
                  {it.shortName}
                </text>
                <text x={lx} y={ly + 14} textAnchor={anchor} fontSize="11"
                  fill={isTop ? ACCENT : "rgba(255,255,255,0.5)"}>
                  {it.score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[12px] text-center mt-1 leading-relaxed px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
        가장 두드러진 결은 <strong style={{ color: BRIGHT }}>{top.shortName}</strong> — {top.desc}
      </p>
    </div>
  );
}

// ── 친구 사귀는 스타일 2x2 매트릭스 ──────────────
// ── 📌 사주 근거 박스 — 결정론 라벨 (차트 카드 안에서 재사용) ──
function SajuBasisBox({ basis }: { basis: string }) {
  if (!basis) return null;
  return (
    <div
      className="mt-3 rounded-lg px-3 py-2.5"
      style={{
        background: "rgba(245,185,66,0.06)",
        border: `1px solid ${ACCENT}40`,
      }}
    >
      <p
        className="text-[10.5px] tracking-[0.18em] mb-1.5"
        style={{ color: ACCENT, fontWeight: 600 }}
      >
        📌 사주 근거
      </p>
      <p
        className="text-[11.5px] leading-[1.6] whitespace-pre-line"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {basis}
      </p>
    </div>
  );
}

function FriendStyleMatrix({ fs }: { fs: FriendStyle }) {
  const SIZE = 240;
  const PAD = 30;
  const inner = SIZE - PAD * 2;
  const cx = PAD + (fs.x + 1) / 2 * inner;
  const cy = PAD + (1 - fs.y) / 2 * inner;
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[11px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>
        ─ 친구 사귀는 스타일 ─
      </p>
      <div className="flex justify-center">
        <svg width={SIZE + 80} height={SIZE + 30} viewBox={`-40 0 ${SIZE + 80} ${SIZE + 30}`}>
          <rect x={PAD} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(245,185,66,0.06)" />
          <rect x={PAD + inner / 2} y={PAD} width={inner / 2} height={inner / 2} fill="rgba(255,157,107,0.06)" />
          <rect x={PAD} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(124,179,255,0.06)" />
          <rect x={PAD + inner / 2} y={PAD + inner / 2} width={inner / 2} height={inner / 2} fill="rgba(196,156,255,0.06)" />
          <line x1={PAD} y1={SIZE / 2} x2={SIZE - PAD} y2={SIZE / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <line x1={SIZE / 2} y1={PAD} x2={SIZE / 2} y2={SIZE - PAD} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          <rect x={PAD} y={PAD} width={inner} height={inner} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <text x={SIZE / 2} y={PAD - 10} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#ff9d6b">적극적</text>
          <text x={SIZE / 2} y={SIZE - PAD + 18} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#7eb6ff">관찰적</text>
          <text x={PAD - 6} y={SIZE / 2 + 4} textAnchor="end" fontSize="13" fontWeight="bold" fill="#f5b942">이끄는</text>
          <text x={SIZE - PAD + 6} y={SIZE / 2 + 4} textAnchor="start" fontSize="13" fontWeight="bold" fill="#c89cff">함께</text>
          <circle cx={cx} cy={cy} r="11" fill={ACCENT} stroke={BRIGHT} strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={`${ACCENT}55`} strokeWidth="1.5">
            <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="mt-2 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-[13px] font-bold"
          style={{ backgroundColor: `${ACCENT}22`, color: BRIGHT, border: `1px solid ${ACCENT}66` }}>
          {fs.dominant}
        </span>
        {fs.subtitle && (
          <p className="text-[11.5px] mt-1.5 leading-snug px-3" style={{ color: ACCENT }}>
            {fs.subtitle}
          </p>
        )}
        <p className="text-[12px] mt-2 leading-relaxed px-3" style={{ color: "rgba(255,255,255,0.7)" }}>
          {fs.desc}
        </p>
      </div>
      <SajuBasisBox basis={fs.basis} />
    </div>
  );
}

// ── 통하는 훈육 4채널 막대 ──────────────
function DisciplineBars({ list, basis }: { list: DisciplineChannel[]; basis?: string }) {
  const max = Math.max(...list.map((c) => c.score), 1);
  const top = [...list].sort((a, b) => b.score - a.score)[0];
  const bottom = [...list].sort((a, b) => a.score - b.score)[0];
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      <p className="text-[11px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>
        ─ 통하는 훈육 채널 ─
      </p>
      <div className="space-y-2.5">
        {list.map((c) => {
          const isTop = c.name === top.name;
          const isBottom = c.name === bottom.name;
          const barColor = isTop ? ACCENT : isBottom ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)";
          return (
            <div key={c.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[13px] font-bold" style={{ color: isTop ? BRIGHT : isBottom ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)" }}>
                  {c.name} {isTop && "✓ 잘 통함"} {isBottom && "△ 역효과"}
                </span>
                <span className="text-[12px]" style={{ color: isTop ? ACCENT : "rgba(255,255,255,0.5)" }}>
                  {c.score}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${(c.score / max) * 100}%`, backgroundColor: barColor }} />
              </div>
              <p className="text-[11px] mt-1" style={{ color: isTop ? `${ACCENT}cc` : "rgba(255,255,255,0.5)" }}>
                {c.desc}
              </p>
            </div>
          );
        })}
      </div>
      {basis && <SajuBasisBox basis={basis} />}
    </div>
  );
}

// ── 절대 하면 안 되는 5가지 위험도 카드 ──────────────
// 텍스트 밀도 분산: 상위 2개는 풀 카드(사주 근거 포함) / 하위 3개는 콤팩트 미니 카드
function DangerCards({ list }: { list: DangerCard[] }) {
  const sorted = [...list].sort((a, b) => b.level - a.level);
  const topTwo = sorted.slice(0, 2);
  const restThree = sorted.slice(2);
  return (
    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
      {/* 섹션 A — 상위 2개 풀 카드 */}
      <p className="text-[11px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>
        ─ 이 자녀에게 가장 치명적인 2가지 ─
      </p>
      <div className="space-y-2.5">
        {topTwo.map((c, i) => (
          <div key={c.name} className="rounded-xl p-3"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: `1px solid rgba(239,68,68,0.4)`,
            }}>
            <div className="flex items-baseline justify-between mb-1.5 gap-2">
              <span className="text-[13.5px] font-bold leading-snug" style={{ color: "#ff8a8a" }}>
                {c.name}
              </span>
              <span className="text-[12px] flex-shrink-0" style={{ color: "#ef4444", letterSpacing: "1px" }}>
                {"★".repeat(c.level)}{"☆".repeat(5 - c.level)}
              </span>
            </div>
            <p className="text-[12px] leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>
              {c.why}
            </p>
            <div className="mt-2.5 rounded-lg p-2.5"
              style={{ backgroundColor: "rgba(239,68,68,0.06)", borderLeft: `3px solid #ef4444` }}>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "#ff8a8a", fontWeight: "bold" }}>
                ─ 왜 {i === 0 ? "가장" : "특히"} 치명적인가 (사주 근거) ─
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                {c.sajuBasis}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 섹션 B — 하위 3개 콤팩트 미니 카드 */}
      {restThree.length > 0 && (
        <>
          <p className="text-[10px] tracking-[0.25em] text-center mt-4 mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
            ─ 그 외 살펴볼 결 ─
          </p>
          <div className="space-y-1.5">
            {restThree.map((c) => {
              const danger = c.level >= 3 ? "#f5b942" : "rgba(255,255,255,0.4)";
              return (
                <div key={c.name} className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.08)`,
                  }}>
                  <span className="text-[12.5px] leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {c.name}
                  </span>
                  <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: danger, letterSpacing: "1px" }}>
                    {"★".repeat(c.level)}{"☆".repeat(5 - c.level)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// 대운 타임라인 (8개)
function DaeunTimeline({ list, currentAge }: { list: DaeunHighlight[]; currentAge: number }) {
  const ratingColor: Record<DaeunHighlight["rating"], string> = {
    gold: "#FFD700", good: "#22c55e", normal: "#94a3b8", caution: "#ef4444",
  };
  const ratingLabel: Record<DaeunHighlight["rating"], string> = {
    gold: "빛나는 시기", good: "성장의 시기", normal: "평온의 시기", caution: "다듬는 시기",
  };
  return (
    <div className="space-y-2">
      {list.map((d, i) => {
        const isCurrent = currentAge >= d.age && currentAge <= d.ageEnd;
        const color = ratingColor[d.rating];
        return (
          <div key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: isCurrent ? `${color}1a` : "rgba(255,255,255,0.04)",
              border: isCurrent ? `1.5px solid ${color}88` : "1px solid rgba(255,255,255,0.08)",
            }}>
            {/* 나이 범위 */}
            <div className="text-center min-w-[55px]">
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>{d.age}~{d.ageEnd}세</p>
              {isCurrent && <p className="text-[9px] font-bold" style={{ color }}>지금</p>}
            </div>
            {/* 색깔 막대 */}
            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: color }} />
            {/* 간지 + 평가 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold" style={{ color }}>
                  {STEM_HANJA[d.stem as keyof typeof STEM_HANJA] ?? d.stem}
                  {BRANCH_HANJA[d.branch as keyof typeof BRANCH_HANJA] ?? d.branch}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {d.stem}{d.branch}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: `${color}cc` }}>
                {ratingLabel[d.rating]} · {d.stemElem}/{d.branchElem}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 사주 카드
function PillarCard({ name, saju, label }: { name: string; saju: SajuAnalysis; label?: string }) {
  const cols = [
    { label: "연주", p: saju.pillars.year },
    { label: "월주", p: saju.pillars.month },
    { label: "일주", p: saju.pillars.day, isDay: true },
    { label: "시주", p: saju.pillars.hour, isDay: false },
  ];
  return (
    <div className="rounded-xl p-3"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="flex items-baseline gap-2 mb-2 justify-center">
        {label && (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>
            {label}
          </span>
        )}
        <p className="text-xs font-bold" style={{ color: ACCENT }}>{name}</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {cols.map(c => (
          <div key={c.label} className="text-center py-2 rounded-lg"
            style={{
              backgroundColor: c.isDay ? `${ACCENT}1a` : "transparent",
              border: c.isDay ? `1px solid ${ACCENT}66` : "1px solid rgba(255,255,255,0.08)",
            }}>
            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>{c.label}</div>
            {c.p ? (
              <>
                <div className="text-base font-bold leading-tight mt-1"
                  style={{ color: ELEM_COLORS[STEM_EL[c.p.stem] ?? ""] ?? BRIGHT }}>
                  {STEM_HANJA[c.p.stem as keyof typeof STEM_HANJA] ?? c.p.stem}
                </div>
                <div className="text-base font-bold leading-tight"
                  style={{ color: ELEM_COLORS[BRANCH_EL[c.p.branch] ?? ""] ?? "white" }}>
                  {BRANCH_HANJA[c.p.branch as keyof typeof BRANCH_HANJA] ?? c.p.branch}
                </div>
              </>
            ) : (
              <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>─</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 점수 게이지
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? "#ff6b9d" : score >= 75 ? ACCENT : score >= 65 ? BRIGHT : "#94a3b8";
  return (
    <div className="text-center">
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 326.7} 326.7`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color }}>{score}</div>
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>/ 100</div>
        </div>
      </div>
      <p className="text-lg font-bold mt-3" style={{ color }}>{label}</p>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────
export default function ParentChildSlideResult() {
  const params = useSearchParams();
  const [slide, setSlide] = useState(0);
  const [aiPage, setAiPage] = useState(0);
  const [content, setContent] = useState("");
  const [showToc, setShowToc] = useState(false);
  const [sajuMom, setSajuMom] = useState<SajuAnalysis | null>(null);
  const [sajuDad, setSajuDad] = useState<SajuAnalysis | null>(null);
  const [sajuChild, setSajuChild] = useState<SajuAnalysis | null>(null);
  const [momCompat, setMomCompat] = useState<CompatibilityResult | null>(null);
  const [dadCompat, setDadCompat] = useState<CompatibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetchedRef = useRef(false);
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastNavRef = useRef<number>(0); // 페이지 점프 디바운스 — 터치+클릭 이벤트 중복 방지
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [exportState, setExportState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const hasMom = !!params.get("momYear");
  const hasDad = !!params.get("dadYear");
  const momName = params.get("momName") || "엄마";
  const dadName = params.get("dadName") || "아빠";
  const childName = params.get("childName") || "아이";

  // 동적 슬라이드 레이아웃 (엄마/아빠 입력 여부에 따라)
  const childAgeStageMemo = (() => {
    const y = parseInt(params.get("childYear") || "0") || 0;
    const m = parseInt(params.get("childMonth") || "1") || 1;
    const d = parseInt(params.get("childDay") || "1") || 1;
    if (!y) return "elementary" as const;
    const now = new Date();
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0);
    if (months <= 35) return "infant" as const;
    if (months <= 83) return "preschool" as const;
    if (months <= 156) return "elementary" as const;
    return "secondary" as const;
  })();
  const slideLayout = buildSlideLayout(hasMom, hasDad, childAgeStageMemo);
  const TOTAL_SLIDES = slideLayout.length;
  const curLayout = slideLayout[slide];
  // 호환용 — primary compat (모자이면 momCompat, 부자이면 dadCompat)
  const compat = momCompat || dadCompat;

  // ── AI 풀이 로드 ──
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const body: Record<string, string> = {
      type: "parent-child",
      section: "parent-child",
      childName,
      childGender: params.get("childGender") || "",
      childYear: params.get("childYear") || "",
      childMonth: params.get("childMonth") || "",
      childDay: params.get("childDay") || "",
      childHour: params.get("childHour") || "시간 모름",
      childCalendar: params.get("childCalendar") || "양력",
    };
    if (hasMom) {
      body.momName = momName;
      body.momYear = params.get("momYear") || "";
      body.momMonth = params.get("momMonth") || "";
      body.momDay = params.get("momDay") || "";
      body.momHour = params.get("momHour") || "시간 모름";
      body.momCalendar = params.get("momCalendar") || "양력";
    }
    if (hasDad) {
      body.dadName = dadName;
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
          setError(true);
          setLoading(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let full = "";
        let currentSajuChild: SajuAnalysis | null = null;
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
              // Phase 4: 스트림 완료 — 모든 후처리 일괄 적용 (호칭 + 부정 어휘 + 한자 ban + 차트 정합)
              const stageNow = classifyAgeStage(
                parseInt(params.get("childYear") || "0") || 0,
                parseInt(params.get("childMonth") || "1") || 1,
                parseInt(params.get("childDay") || "1") || 1,
              );
              const seedNow: ChildSeed | null = currentSajuChild
                ? buildChildSeed(currentSajuChild, childName, (params.get("childGender") === "여" ? "여" : "남"), stageNow)
                : null;
              setContent(applyAllPostprocess(full, childName, params.get("childGender") || "", seedNow));
              break outer;
            }
            try {
              const msg = JSON.parse(raw);
              if (msg.t === "m" && msg.d) {
                setSajuMom(msg.d.sajuMom);
                setSajuDad(msg.d.sajuDad);
                setSajuChild(msg.d.sajuChild);
                currentSajuChild = msg.d.sajuChild; // 스트림 완료 시 시드 빌드용
                setMomCompat(msg.d.momCompat);
                setDadCompat(msg.d.dadCompat);
                setLoading(false);
              } else if (msg.t === "x" && msg.v) {
                full += msg.v;
                // 스트리밍 중에도 강 부정 단어 즉시 치환 (사용자가 일순간이라도 노출 안 되게)
                setContent(softenNegatives(full));
              }
            } catch {}
          }
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [params, momName, dadName, childName, hasMom, hasDad]);

  // ── 파생값 ──
  const sections = parseSections(content);
  const curAiSectionIdx = curLayout?.aiSectionIdx;
  const curAiText = curAiSectionIdx !== undefined ? sections[curAiSectionIdx] || "" : "";
  // 영아: heart 슬라이드의 "회복과 환경" 처방 페이지 숨김 (보편 육아 상식과 변별 약함)
  // AI가 헤더를 빼먹어도 본문 패턴(자녀/부모 + 처방 키워드)으로 catch
  const isRecoveryPage = (p: string): boolean => {
    if (/###\s*회복과 환경/.test(p)) return true;
    const hasChildBlock = /\[자녀\]/.test(p);
    const hasParentBlock = /\[부모\]/.test(p);
    const hasPrescriptionKw = /즉효 처방|일상 처방|피해야 할 결|깔아주는 환경/.test(p);
    return (hasChildBlock && hasParentBlock) || hasPrescriptionKw;
  };
  // 영아·유아: guide 슬라이드의 "떼·고집" 두 페이지 숨김 (이 시기 떼는 발달적 본능, 사주 트리거 풀이 부적절)
  const isTantrumPage = (p: string): boolean => {
    if (/###\s*떼.{0,3}고집/.test(p)) return true;
    if (/비견.겁재 강도|강한 감정 결|절제 회로/.test(p)) return true;
    if (/STOP.{0,3}NAME.{0,3}GUIDE|\*\*1단계.{0,5}멈춤|\*\*2단계.{0,5}인정|\*\*3단계.{0,5}안내/.test(p)) return true;
    return false;
  };
  // 영아·유아: guide 슬라이드의 "통하는 훈육 vs 역효과 훈육" 페이지 숨김
  // (4채널 분류가 보편 양육서와 겹쳐 변별력 약하고, 영아엔 "논리적 설명" 처방이 발달적 부적합)
  const isDisciplinePage = (p: string): boolean => {
    if (/###\s*통하는 훈육|역효과 훈육/.test(p)) return true;
    if (/잘 통하는 훈육|가장 역효과/.test(p)) return true;
    return false;
  };
  // 영아·유아: 칭찬·잠자리·디지털·자존감 4페이지 — 보편 양육서와 변별 약하고 영아엔 언어 미발달
  const isPraisePage = (p: string): boolean => {
    if (/###\s*통하는 칭찬|역효과 칭찬/.test(p)) return true;
    if (/\[좋은 칭찬\]/.test(p) && /\[역효과 칭찬\]/.test(p)) return true;
    return false;
  };
  const isLifestylePage = (p: string): boolean => {
    if (/###\s*잠자리.{0,3}식습관/.test(p)) return true;
    return false;
  };
  const isDigitalPage = (p: string): boolean => {
    if (/###\s*디지털.{0,3}미디어/.test(p)) return true;
    return false;
  };
  const isSelfEsteemPage = (p: string): boolean => {
    if (/###\s*자존감 보호/.test(p)) return true;
    if (/\[멘트\]/.test(p) && /부모의 한 마디|부모의 말/.test(p)) return true;
    return false;
  };
  // Phase 3: 살펴주면 좋은 결 — 영아 미생성 (회복 페이지와 대칭)
  const isSoftenPage = (p: string): boolean => {
    if (/###\s*살펴주면 좋은 결/.test(p)) return true;
    if (/\[균형\]/.test(p) && /즉시 균형|균형 리듬|균형 환경/.test(p)) return true;
    return false;
  };
  // Phase 4: 사춘기에 결이 변하는 시기 — 영·유아 미생성 (사용자 명시 결정)
  const isCrisisPage = (p: string): boolean => {
    if (/###\s*사춘기에\s*결이\s*변하는/.test(p)) return true;
    return false;
  };
  // 사용자 정책: "결이 만나고 부딪히는 자리" 페이지 전 연령 영구 폐기 (추상성·중복)
  const isMeetClashPage = (p: string): boolean => {
    if (/###\s*결이\s*만나고\s*부딪히는/.test(p)) return true;
    if (/잘 어울리는 만남/.test(p) && /부딪히는 자극/.test(p)) return true;
    return false;
  };
  // 단계 3 통폐합: "기질 5각도" 페이지 폐기 (오행 차트 + 강점·주의점 카드와 중복)
  const isFiveangPage = (p: string): boolean => {
    if (/###\s*기질\s*5각도/.test(p)) return true;
    return false;
  };
  const filterPagesForKind = (pages: string[], kind?: string): string[] => {
    if (kind === "heart") {
      // 사용자 정책: "결이 만나고 부딪히는 자리" 전 연령 폐기 (추상성·중복)
      return pages.filter((p) => !isMeetClashPage(p));
    }
    if (kind === "overview") {
      // 단계 3 통폐합: "기질 5각도" 페이지 폐기 (오행 차트와 중복)
      return pages.filter((p) => !isFiveangPage(p));
    }
    if (kind === "guide") {
      return pages.filter((p) => {
        // 사용자 정책: 떼·고집은 전 연령 영구 폐기 (사주 변별력 부족)
        if (isTantrumPage(p)) return false;
        // 전 연령 — 훈육 4채널 페이지 숨김 (보편 양육서와 변별 약함)
        if (isDisciplinePage(p)) return false;
        // 사용자 정책: 통하는 칭찬·자존감 멘트 전 연령 폐기 (사주 변별력 0, 보편 양육서 콘텐츠)
        if (isPraisePage(p)) return false;
        if (isSelfEsteemPage(p)) return false;
        return true;
      });
    }
    // 사용자 정책: 회복·살펴주면·칭찬·잠자리·디지털·자존감·사춘기 페이지는 영·유아도 미래 시제로 출력 (자녀가 자랄 것)
    return pages;
  };
  const curPages = curAiText ? filterPagesForKind(splitIntoPages(curAiText), curLayout?.kind) : [];
  const chartPagesOf = (s: number): number => slideLayout[s]?.chartPages ?? 0;
  const coverPagesOf = (s: number): number => slideLayout[s]?.coverPage ? 1 : 0;
  const hasChartPage = chartPagesOf(slide) > 0;
  const totalPagesForSlide = coverPagesOf(slide) + chartPagesOf(slide) + Math.max(curPages.length, 1);
  const hasMorePages = totalPagesForSlide > 1 && aiPage < totalPagesForSlide - 1;

  // ── 전체 페이지 카운트 (모든 슬라이드의 페이지 합) ─────────
  function pagesOfSlide(s: number): number {
    const sIdx = slideLayout[s]?.aiSectionIdx;
    if (sIdx === undefined) return 1; // AI 매핑 없는 슬라이드 = 1페이지
    const text = sections[sIdx] ?? "";
    const rawPages = text ? splitIntoPages(text) : [];
    const aiPgs = filterPagesForKind(rawPages, slideLayout[s]?.kind).length || 1;
    return coverPagesOf(s) + chartPagesOf(s) + Math.max(aiPgs, 1);
  }
  let cumPagesBefore = 0;
  for (let s = 0; s < slide; s++) cumPagesBefore += pagesOfSlide(s);
  const currentGlobalPage = cumPagesBefore + aiPage + 1;
  let totalGlobalPages = 0;
  for (let s = 0; s < TOTAL_SLIDES; s++) totalGlobalPages += pagesOfSlide(s);

  // ── PNG 추출 + 공유 ──
  async function captureCanvas(): Promise<HTMLCanvasElement | null> {
    if (!shareCardRef.current) return null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: BG,
        scale: 2,             // 고해상도
        useCORS: true,
        logging: false,
      });
      return canvas;
    } catch (err) {
      console.error("html2canvas 실패", err);
      return null;
    }
  }

  async function downloadPNG() {
    setExportState("loading");
    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error("canvas 생성 실패");
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `자도인_${momName}_${childName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportState("success");
      setTimeout(() => setExportState("idle"), 2000);
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  }

  async function sharePNG() {
    setExportState("loading");
    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error("canvas 생성 실패");
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("blob 변환 실패");
      const file = new File([blob], `자도인_${momName}_${childName}.png`, { type: "image/png" });
      const shareData: ShareData = {
        title: `${momName} · ${childName} 가족 인연 풀이`,
        text: `자도인이 풀어드린 우리 가족의 결 — ${compat?.scoreLabel ?? ""}`,
        files: [file],
      };
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setExportState("success");
      } else {
        // 폴백: 다운로드
        await downloadPNG();
        return;
      }
      setTimeout(() => setExportState("idle"), 2000);
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  }

  // ── 네비게이션 ──
  // 디바운스: 300ms 안에 들어온 두 번째 호출 무시 (touchend + click 중복 차단)
  function navGate(): boolean {
    const now = Date.now();
    if (now - lastNavRef.current < 300) return false;
    lastNavRef.current = now;
    return true;
  }
  // ── 글로벌 페이지 평탄화 — 모든 슬라이드의 페이지를 일직선으로 ──
  // 현재 위치를 글로벌 인덱스로 잡고 정확히 ±1만 이동.
  // hasMorePages·setSlide+1 같은 분기 로직 거치지 않아 점프 원천 차단.
  function buildFlatPages(): Array<{ s: number; p: number }> {
    const flat: Array<{ s: number; p: number }> = [];
    for (let s = 0; s < TOTAL_SLIDES; s++) {
      const total = pagesOfSlide(s);
      for (let p = 0; p < total; p++) flat.push({ s, p });
    }
    return flat;
  }
  function goNext() {
    if (!navGate()) return;
    const flat = buildFlatPages();
    const cur = flat.findIndex((x) => x.s === slide && x.p === aiPage);
    if (cur < 0 || cur >= flat.length - 1) return;
    const next = flat[cur + 1];
    if (next.s !== slide) {
      setSlide(next.s);
      setAiPage(next.p);
    } else {
      setAiPage(next.p);
    }
  }
  function goPrev() {
    if (!navGate()) return;
    const flat = buildFlatPages();
    const cur = flat.findIndex((x) => x.s === slide && x.p === aiPage);
    if (cur <= 0) return;
    const prev = flat[cur - 1];
    if (prev.s !== slide) {
      setSlide(prev.s);
      setAiPage(prev.p);
    } else {
      setAiPage(prev.p);
    }
  }

  // 좌우 탭 / 스와이프 (남녀궁합과 동일 패턴)
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
    } else if (adx > 50 && adx > ady * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
    tapStartRef.current = null;
  }
  function onClickArea(e: React.MouseEvent) {
    if (typeof window !== "undefined" && "ontouchstart" in window) return;
    const target = e.target as HTMLElement;
    if (target.closest('button,a,input,textarea,select,[role="button"]')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - rect.left > rect.width / 2) goNext();
    else goPrev();
  }

  // 미리 계산
  const characterImg = sajuMom && sajuChild ? pickCharacterImage(sajuMom.ilgan, sajuChild.ilgan) : null;
  const characterTheme = sajuMom && sajuChild ? characterPairTheme(sajuMom.ilgan, sajuChild.ilgan) : null;
  const shareCardBg = compat ? pickShareCardBg(compat.score) : null;

  // ── 차트·트레이트 데이터 (아이 중심) ──
  const childIntel = sajuChild ? infer8Intelligences(sajuChild) : null;
  const childThinking: ThinkingType | null = sajuChild ? inferThinkingType(sajuChild) : null;
  const childJobRadar: JobRadarItem[] | null = sajuChild ? inferJobRadar(sajuChild) : null;
  const childFriendStyle: FriendStyle | null = sajuChild ? inferFriendStyle(sajuChild) : null;
  const childDiscipline: DisciplineChannel[] | null = sajuChild ? inferDisciplineChannels(sajuChild) : null;
  const childDisciplineBasis: string = sajuChild ? inferDisciplineBasis(sajuChild) : "";
  const childDanger: DangerCard[] | null = sajuChild ? inferDangerCards(sajuChild) : null;
  const childGuideHighlights: GuideHighlight[] | null = sajuChild ? inferGuideHighlights(sajuChild) : null;
  const childTantrum: TantrumTrigger[] | null = sajuChild ? inferTantrumTriggers(sajuChild, childAgeStageMemo) : null;
  const childFriendDist: FriendDistance | null = sajuChild ? inferFriendDistance(sajuChild) : null;
  const childLifestyle: LifestyleChannel[] | null = sajuChild ? inferLifestyle(sajuChild) : null;
  const childDigitalCap = (() => {
    const y = parseInt(params.get("childYear") || "0") || 0;
    const m = parseInt(params.get("childMonth") || "1") || 1;
    const d = parseInt(params.get("childDay") || "1") || 1;
    if (!y) return undefined;
    const now = new Date();
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0);
    if (months <= 35) return 30;
    if (months <= 83) return 60;
    if (months <= 156) return 120;
    return 180;
  })();
  const childDigital: DigitalGauge | null = sajuChild ? inferDigitalGauge(sajuChild, childDigitalCap) : null;
  // 부모-자녀 비교 데이터 (PART 4·5)
  const momCompare: ElementCompare | null = sajuChild && sajuMom ? inferElementCompare(sajuMom, sajuChild) : null;
  const momIlganRel: IlganRelation | null = sajuChild && sajuMom ? inferIlganRelation(sajuMom, sajuChild, "엄마") : null;
  const momFlow: FlowGiven | null = sajuChild && sajuMom ? inferFlowGiven(sajuMom, sajuChild, sajuDad) : null;
  const dadCompare: ElementCompare | null = sajuChild && sajuDad ? inferElementCompare(sajuDad, sajuChild) : null;
  const dadIlganRel: IlganRelation | null = sajuChild && sajuDad ? inferIlganRelation(sajuDad, sajuChild, "아빠") : null;
  const dadFlow: FlowGiven | null = sajuChild && sajuDad ? inferFlowGiven(sajuDad, sajuChild, sajuMom) : null;
  const childSipseongCounts = sajuChild ? getSipseongCounts(sajuChild) : null;
  // Phase 4 신규 — 사춘기에 결이 변하는 시기 (영·유아 미생성)
  const childCrisisTiming: CrisisTiming | null = sajuChild ? (() => {
    const yearStr = params.get("childYear") || "";
    const y = parseInt(yearStr) || 0;
    const age = y ? Math.max(0, new Date().getFullYear() - y) : 7;
    return inferCrisisTiming(age, sajuChild.daeun, childAgeStageMemo);
  })() : null;
  // Phase 2 신규 — 기운 총량 (신강·신약 7단계)
  const childDayMasterStrength: DayMasterStrength | null = sajuChild ? getDayMasterStrength(
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
  ) : null;
  const childDaeun = sajuChild ? evaluateDaeunTimeline(sajuChild) : null;
  // Phase 2 신규 — 격국·공망·기신 (전통 명리)
  const childGyeokguk: GyeokgukResult | null = sajuChild ? calcGyeokguk(sajuChild) : null;
  const childGongmang: GongmangResult | null = sajuChild ? calcGongmang(sajuChild) : null;
  const childGisin: GisinResult | null = sajuChild ? calcGisin(sajuChild) : null;
  const childGaeun: GaeunResult | null = sajuChild ? calcGaeun(sajuChild) : null;
  const childTiming: ChildTimingResult | null = sajuChild ? calcChildTiming(sajuChild) : null;
  const childUnseong: UnseongResult | null = sajuChild ? calcUnseong(sajuChild) : null;
  const childShipiShinsal: ShipiShinsalResult | null = sajuChild ? calcShipiShinsal(sajuChild) : null;
  const childBranchHarmony: ChildBranchHarmonyResult | null = sajuChild ? calcChildBranchHarmony(sajuChild) : null;
  const momCheonganHap: CheonganHapResult | null = (sajuMom && sajuChild) ? calcCheonganHap(sajuMom.ilgan, sajuChild.ilgan, "엄마") : null;
  const dadCheonganHap: CheonganHapResult | null = (sajuDad && sajuChild) ? calcCheonganHap(sajuDad.ilgan, sajuChild.ilgan, "아빠") : null;
  const familyTrio: FamilyTrioResult | null = (sajuMom && sajuDad && sajuChild) ? calcFamilyTrio(sajuMom, sajuDad, sajuChild) : null;
  // Phase 4 — 가족 명리
  const momIljiRel = (sajuMom && sajuChild) ? calcIljiRelation(sajuMom.pillars.day.branch, sajuChild.pillars.day.branch, "엄마") : null;
  const dadIljiRel = (sajuDad && sajuChild) ? calcIljiRelation(sajuDad.pillars.day.branch, sajuChild.pillars.day.branch, "아빠") : null;
  const momParentSipseong = (sajuMom && sajuChild) ? calcParentSipseong(sajuMom.ilgan, sajuChild.ilgan, "엄마") : null;
  const dadParentSipseong = (sajuDad && sajuChild) ? calcParentSipseong(sajuDad.ilgan, sajuChild.ilgan, "아빠") : null;
  const momSharedSinsal = (sajuMom && sajuChild) ? calcSharedSinsal(sajuMom.sinsal ?? [], sajuChild.sinsal ?? [], "엄마") : null;
  const dadSharedSinsal = (sajuDad && sajuChild) ? calcSharedSinsal(sajuDad.sinsal ?? [], sajuChild.sinsal ?? [], "아빠") : null;
  const childIlju: IljuInfo | null = sajuChild ? getIljuInfo(sajuChild) : null;
  const childYongsin: YongsinMeaning | null = sajuChild ? inferYongsinMeaning(sajuChild) : null;
  const childDominant: DominantMeaning | null = sajuChild ? inferDominantMeaning(sajuChild) : null;
  const childSinsalReading: PositiveSinsalReading | null = sajuChild ? inferPositiveSinsal(sajuChild) : null;
  const childObs: ObservationGuide | null = sajuChild ? getObservationGuide(sajuChild) : null;
  const childGenderParam = params.get("childGender") || "";
  // 가족 인연의 결 — 양친이면 trio, 한 분만이면 dyad (parentRole 분기로 엄마/아빠 어휘 구분)
  const familySaja: FamilySajaSeongeo | null = (() => {
    if (sajuChild && sajuMom && sajuDad) {
      return pickFamilyTrioSaja(sajuMom, sajuDad, sajuChild);
    }
    if (compat) {
      const role: "엄마" | "아빠" = sajuMom ? "엄마" : "아빠";
      const sajuParent = sajuMom ?? sajuDad ?? undefined;
      return pickFamilySajaSeongeo(compat, childGenderParam, sajuParent ?? undefined, sajuChild ?? undefined, role);
    }
    return null;
  })();
  const childAnimal: AnimalCharacter | null = sajuChild ? getAnimalCharacter(sajuChild) : null;
  // 아이 현재 만 나이 계산
  const childYearN = parseInt(params.get("childYear") || "0") || 0;
  const childMonthN = parseInt(params.get("childMonth") || "1") || 1;
  const childDayN = parseInt(params.get("childDay") || "1") || 1;
  const _now = new Date();
  let childAge = _now.getFullYear() - childYearN;
  const _beforeBday =
    _now.getMonth() + 1 < childMonthN ||
    (_now.getMonth() + 1 === childMonthN && _now.getDate() < childDayN);
  if (_beforeBday) childAge -= 1;
  if (childAge < 0) childAge = 0;

  // ── 슬라이드 렌더 ──
  function renderSlide() {
    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <p className="text-white/70">풀이 생성에 실패했습니다.</p>
          <Link href="/parent-child" className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}>← 돌아가기</Link>
        </div>
      );
    }
    if (loading || !compat || !sajuMom || !sajuChild) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
          <p className="text-sm" style={{ color: `${ACCENT}aa` }}>두 분의 인연을 풀이하는 중입니다</p>
        </div>
      );
    }

    // ── Slide 0: 커버 ──
    if (curLayout?.kind === "cover") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-6">
          <div
            className="text-4xl tracking-widest"
            style={{ color: GOLD, filter: `drop-shadow(0 0 12px ${ACCENT}cc)`, fontFamily: "'Ma Shan Zheng', serif" }}
          >
            慈
          </div>
          <h1 className="text-2xl font-bold text-white">
            {[hasMom ? momName : null, hasDad ? dadName : null, childName]
              .filter(Boolean)
              .map((n, i, arr) => (
                <span key={i}>
                  {n}{i < arr.length - 1 && <span style={{ color: ACCENT }}> · </span>}
                </span>
              ))}
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            자도인(慈道人) 가족 인연 풀이
          </p>
          {/* 가족 인연의 결 메인 카드 — 한국어 키워드 + 동적 메타포 부제 */}
          {familySaja && (
            <div
              className="rounded-3xl px-8 py-7 max-w-sm"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}28, rgba(255,255,255,0.04))`,
                border: `1.5px solid ${ACCENT}88`,
                boxShadow: `0 0 28px ${ACCENT}33`,
              }}
            >
              <p className="text-[10px] tracking-[0.3em] mb-3" style={{ color: `${ACCENT}aa` }}>
                ─ 가족 인연의 결 ─
              </p>
              <p className="text-2xl font-bold leading-snug mb-3" style={{ color: GOLD }}>
                {familySaja.keyword}
              </p>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.78)" }}>
                {familySaja.meaning}
              </p>
              {familySaja.subtitle && (
                <p className="text-[13px] leading-[1.7] pt-3" style={{
                  color: ACCENT,
                  borderTop: `1px dashed ${ACCENT}55`,
                }}>
                  {familySaja.subtitle}
                </p>
              )}
            </div>
          )}
          {/* 자도인 첫마디는 슬라이드 3에서 별도 표시 — 커버에서는 제외 */}
        </div>
      );
    }

    // ── Part 00: 입문 챕터 (스크롤 형식) ──
    if (curLayout?.kind === "intro") {
      if (!sajuChild) {
        return (
          <div className="flex-1 flex justify-center items-center py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        );
      }
      return (
        <IntroScrollChapter
          sajuChild={sajuChild}
          childName={childName}
          childGender={childGenderParam === "여" ? "여" : "남"}
          ilganMetaphor={ILGAN_METAPHOR[sajuChild.ilgan] ?? ""}
          onStart={() => setSlide(slide + 1)}
        />
      );
    }

    // ── Slide 1: 사주팔자 ──
    if (curLayout?.kind === "pillars") {
      const familyCount = (hasMom ? 1 : 0) + (hasDad ? 1 : 0) + 1;
      const headTitle = familyCount === 3 ? "세 사람의 사주팔자" : "두 사람의 사주팔자";
      return (
        <div className="flex-1 flex flex-col gap-4 py-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{headTitle}</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
              태어난 연·월·일·시
            </p>
          </div>
          {hasMom && sajuMom && <PillarCard name={momName} saju={sajuMom} label="엄마" />}
          {hasDad && sajuDad && <PillarCard name={dadName} saju={sajuDad} label="아빠" />}
          <PillarCard name={childName} saju={sajuChild} label="아이" />

          {/* 아이의 일주 카드 */}
          {childIlju && (
            <div className="rounded-2xl p-4 mt-1"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}1f, rgba(255,255,255,0.04))`,
                border: `1px solid ${ACCENT}55`,
              }}>
              <div className="flex items-baseline gap-2 mb-2 justify-center">
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${BRIGHT}33`, color: BRIGHT }}>
                  아이 일주(日柱)
                </span>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold tracking-widest" style={{ color: BRIGHT }}>
                  {childIlju.hanja}
                </div>
                <p className="text-xs mt-1" style={{ color: `${ACCENT}cc` }}>
                  {childIlju.fusion}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-lg p-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <div className="text-2xl font-bold" style={{ color: BRIGHT }}>
                    {childIlju.stemHanja}
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {childIlju.stemMeaning}
                  </p>
                </div>
                <div className="rounded-lg p-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <div className="text-2xl font-bold" style={{ color: BRIGHT }}>
                    {childIlju.branchHanja}
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {childIlju.branchMeaning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 가족 3인 트리오 카드 — 양친 모두 입력 시만 */}
          {familyTrio && (
            <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: "rgba(245,185,66,0.07)", border: `1px solid ${ACCENT}55` }}>
              <p className="text-xs font-bold mb-2" style={{ color: ACCENT }}>👨‍👩‍👧 세 분 가족이 공유하는 결</p>
              <div className="space-y-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.78)" }}>
                {familyTrio.sharedSinsal.length > 0 && (
                  <p>· <strong style={{ color: BRIGHT }}>공통 신살</strong>: {familyTrio.sharedSinsal.join(" · ")}</p>
                )}
                {familyTrio.sharedElement && (
                  <p>· <strong style={{ color: BRIGHT }}>가족 강 오행</strong>: {familyTrio.sharedElement}의 결 (세 분 모두 25%↑)</p>
                )}
                {familyTrio.cheonganHapChain && (
                  <p>· {familyTrio.cheonganHapChain}</p>
                )}
                <p className="mt-2 italic" style={{ color: "rgba(255,255,255,0.65)" }}>{familyTrio.oneLiner}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 space-y-2 mt-2"
            style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}33` }}>
            <p className="text-xs font-bold" style={{ color: ACCENT }}>가족 인연의 결</p>
            {hasMom && momCompat && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • 엄마가 아이에게 주는 결: {parentChildOneLiner(
                  momCompat,
                  "mom",
                  sajuChild ? STEM_TO_ELEM[sajuChild.ilgan] : undefined,
                  sajuMom ? STEM_TO_ELEM[sajuMom.ilgan] : undefined,
                  `mom-${childName}-${params.get("childYear") || ""}-${params.get("childMonth") || ""}-${params.get("childDay") || ""}`,
                )}
              </p>
            )}
            {hasDad && dadCompat && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.78)" }}>
                • 아빠가 아이에게 주는 결: {parentChildOneLiner(
                  dadCompat,
                  "dad",
                  sajuChild ? STEM_TO_ELEM[sajuChild.ilgan] : undefined,
                  sajuDad ? STEM_TO_ELEM[sajuDad.ilgan] : undefined,
                  `dad-${childName}-${params.get("childYear") || ""}-${params.get("childMonth") || ""}-${params.get("childDay") || ""}`,
                )}
              </p>
            )}
          </div>
        </div>
      );
    }


    // ── AI 본문 슬라이드 (+ 차트 페이지 일부) — 2~8 ──
    // (slide 9 = 공유 — 별도 render)
    if (curLayout && curLayout.aiSectionIdx !== undefined) {
      const title = curLayout.title;
      const kind = curLayout.kind;

      const hasCover = !!curLayout.coverPage;
      const isCoverPage = hasCover && aiPage === 0;
      const shiftedPage = hasCover ? aiPage - 1 : aiPage;
      const chartPageCount = chartPagesOf(slide);
      const totalPages = (hasCover ? 1 : 0) + chartPageCount + Math.max(curPages.length, 1);
      const isChartPage = !isCoverPage && chartPageCount > 0 && shiftedPage < chartPageCount;
      const aiTextIdx = shiftedPage - chartPageCount;
      const aiText = !isCoverPage ? (curPages[aiTextIdx] || "") : "";
      const partHue = curLayout.hue ?? ACCENT;
      const cover = SECTION_COVER[kind];

      // 섹션 표지 페이지 전용 렌더링 — 이모지 심볼 + 한글 강조
      if (isCoverPage && cover) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <p className="text-[11px] tracking-[0.4em] mb-2" style={{ color: `${partHue}99` }}>
              {cover.partLabel}
            </p>
            <p className="text-[10px] italic mb-10" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'Cormorant Garamond', serif" }}>
              {cover.en}
            </p>
            {/* 큼직한 이모지 — slide hue 글로우로 부드럽게 감싸기 */}
            <div
              className="text-[88px] leading-none mb-10 flex items-center justify-center rounded-full"
              style={{
                width: 160,
                height: 160,
                background: `radial-gradient(circle, ${partHue}33 0%, ${partHue}10 60%, transparent 100%)`,
                filter: `drop-shadow(0 0 24px ${partHue}55)`,
              }}
            >
              {cover.symbol}
            </div>
            {/* 한글 큰 글자 — 자간 넓게, 메인 디자인 요소 */}
            <h2
              className="text-[26px] font-bold text-center mb-6"
              style={{
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "0.22em",
                lineHeight: 1.4,
              }}
            >
              {title}
            </h2>
            {/* 그라디언트 라인 액센트 */}
            <div
              className="w-16 h-px mb-6"
              style={{
                background: `linear-gradient(to right, transparent, ${partHue}, transparent)`,
              }}
            />
            <p className="text-[12.5px] text-center leading-relaxed px-4" style={{ color: "rgba(255,255,255,0.7)" }}>
              {cover.subtitle}
            </p>
            <p className="text-[10px] mt-10" style={{ color: `${partHue}66` }}>
              1 / {totalPages}
            </p>
          </div>
        );
      }

      return (
        <div className="flex-1 flex flex-col py-2">
          <div className="text-center mb-3">
            <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: partHue }}>
              {title}
            </p>
            {totalPages > 1 && (
              <p className="text-[10px] mt-1" style={{ color: `${partHue}99` }}>
                {aiPage + 1} / {totalPages}
              </p>
            )}
            {(() => {
              const badge = sajuBasisLabel(curLayout?.kind, shiftedPage, isChartPage, aiText);
              return badge ? (
                <p
                  className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] tracking-[0.1em]"
                  style={{
                    color: `${partHue}cc`,
                    background: `${partHue}10`,
                    border: `1px solid ${partHue}30`,
                  }}
                >
                  {badge}
                </p>
              ) : null;
            })()}
          </div>
          <div className="flex-1 px-1">
            {/* Slide 3 차트 1: 오행 5각 + 양 끝 스펙트럼 표 */}
            {isChartPage && kind === "overview" && shiftedPage === 0 && sajuChild && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                  다섯 가지 자연의 결
                </h4>
                <p className="text-[11px] text-center mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  나무·불·흙·쇠·물 — 우리 아이가 타고난 다섯 에너지의 균형
                </p>
                <ElementsRadar elements={sajuChild.elements as Record<string, number>} />
                <SpectrumTable elements={sajuChild.elements as Record<string, number>} />
              </div>
            )}
            {/* Slide 3 차트 2: 십성 5각 (10가지 성향의 지도) */}
            {isChartPage && kind === "overview" && shiftedPage === 1 && childSipseongCounts && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                  10가지 성향의 지도
                </h4>
                <p className="text-[11px] text-center mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                  자기를 세움·표현함·끌림·절제함·사색함 — 마음이 흐르는 다섯 색깔
                </p>
                <SipseongRadar counts={childSipseongCounts} />
                <SipseongSpectrumTable counts={childSipseongCounts} />
              </div>
            )}
            {/* 실전 양육 가이드 차트 페이지: 사주에서 본 핵심 3가지 */}
            {isChartPage && kind === "guide" && childGuideHighlights && (
              <GuideHighlightCards items={childGuideHighlights} />
            )}
            {/* Slide 8 차트: 8지능 카드 (재능의 결) */}
            {isChartPage && kind === "talent" && childIntel && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-center mb-1" style={{ color: BRIGHT }}>
                  타고난 재능 3가지
                </h4>
                <p className="text-[11px] text-center mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                  사주에서 도출된 가장 두드러진 재능 결
                </p>
                <IntelligenceCards list={childIntel} />
              </div>
            )}
            {/* (구) Slide 10 대운 타임라인 차트 — 70~80대 평생 그래프가 부모 관심사와 어긋나 제거됨 */}
            {/* AI 본문 텍스트 */}
            {!isChartPage && (
              <>
                {/* (폐기) 외향-내향 페이지 + 6요인 페이지 영구 폐기 — 마음 챕터는 다섯 색깔의 결(십성 5분류)부터 시작 */}
                {/* 실전 양육 가이드 — AI 페이지별 시각화 */}
                {/* 페이지 제거 → 차트 idx 시프트 매핑 */}
                {/* 영아·유아 제거: 0,1 (떼) + 4 (훈육) + 5,6,7,8 (칭찬·잠자리·디지털·자존감) → 남은 원래 idx: 2,3,9 */}
                {/* 초등·중고등 제거: 4 (훈육) → 남은 원래 idx: 0,1,2,3,5,6,7,8,9 */}
                {(() => {
                  // 사용자 정책: 떼·고집(0,1) + 훈육(4) + 칭찬(5) + 자존감(8) 전 연령 폐기.
                  // 잔존 페이지 순서 (필터 후): 친구스타일(0)·친구거리(1)·잠자리(2)·디지털(3)·위험카드(4)
                  const guideIdx = (originalIdx: number): number => {
                    if (originalIdx === 0 || originalIdx === 1) return -1; // 떼·고집 폐기
                    if (originalIdx === 4) return -1;                       // 훈육 폐기
                    if (originalIdx === 5) return -1;                       // 칭찬 폐기
                    if (originalIdx === 8) return -1;                       // 자존감 폐기
                    if (originalIdx === 2) return 0;                        // 친구 사귀는 스타일
                    if (originalIdx === 3) return 1;                        // 친구 갈등 거리
                    if (originalIdx === 6) return 2;                        // 잠자리·식습관
                    if (originalIdx === 7) return 3;                        // 디지털·미디어
                    if (originalIdx === 9) return 4;                        // 절대 하면 안 되는 5가지
                    return -1;
                  };
                  return (
                    <>
                      {/* idx 0: 떼·고집 진짜 이유 → 4가지 트리거 막대 (영아·유아엔 -2 → 매칭 안 됨, 자연 숨김) */}
                      {kind === "guide" && aiTextIdx === guideIdx(0) && childTantrum && (
                        <TantrumTriggerBars triggers={childTantrum} />
                      )}
                      {/* idx 2: 친구 사귀는 스타일 — 2x2 매트릭스 */}
                      {kind === "guide" && aiTextIdx === guideIdx(2) && childFriendStyle && (
                        <FriendStyleMatrix fs={childFriendStyle} />
                      )}
                      {/* idx 3: 친구 갈등 시 부모 개입 거리 → 슬라이더 */}
                      {kind === "guide" && aiTextIdx === guideIdx(3) && childFriendDist && (
                        <FriendDistanceSlider fd={childFriendDist} />
                      )}
                      {/* idx 4: 통하는 훈육 → 4채널 막대 */}
                      {kind === "guide" && aiTextIdx === guideIdx(4) && childDiscipline && (
                        <DisciplineBars list={childDiscipline} basis={childDisciplineBasis} />
                      )}
                      {/* idx 6: 잠자리·식습관 → 4채널 게이지 */}
                      {kind === "guide" && aiTextIdx === guideIdx(6) && childLifestyle && (
                        <LifestyleGauges channels={childLifestyle} />
                      )}
                      {/* (폐기) 디지털·미디어 페이지 영구 폐기 — DigitalGaugeCard 미사용 */}
                      {/* idx 9: 절대 하면 안 되는 5가지 → DangerCards */}
                      {/* (Phase 3) 텍스트 매칭으로 변경 — 개운법·시간 가이드 페이지 추가로 idx 시프트 */}
                      {kind === "guide" && /###\s*절대\s*하면\s*안/.test(aiText) && childDanger && (
                        <DangerCards list={childDanger} />
                      )}
                    </>
                  );
                })()}

                {/* ── 엄마와 우리 아이 (PART 4) ──────────────────── */}
                {kind === "mom" && aiTextIdx === 0 && momCompare && (
                  <ElementCompareRadar cmp={momCompare} parentLabel="엄마" parentColor="#f0a8b8" childLabel="아이" />
                )}
                {kind === "mom" && aiTextIdx === 1 && momIlganRel && (
                  <>
                    <IlganRelationCard rel={momIlganRel} parentLabel="엄마" parentColor="#f0a8b8" />
                    {/* 천간합 보너스 카드 — 합 관계인 경우만 강조 */}
                    {momCheonganHap?.hasHap && (
                      <div className="rounded-2xl p-4 mb-4 mt-3" style={{ background: "rgba(240,168,184,0.10)", border: "1px solid rgba(240,168,184,0.4)" }}>
                        <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#f0a8b8" }}>✨ 천간합(天干合) — 명운이 묶이는 인연 ✨</p>
                        <p className="text-[14px] font-bold text-center" style={{ color: BRIGHT }}>
                          {momCheonganHap.parentIlgan}+{momCheonganHap.childIlgan} = {momCheonganHap.hapName}({momCheonganHap.hapHanja})
                        </p>
                        <p className="text-[10.5px] text-center mt-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                          → 합화 오행: <strong style={{ color: BRIGHT }}>{momCheonganHap.hapElement}</strong> · 두 분의 결이 깊이 묶입니다
                        </p>
                      </div>
                    )}
                  </>
                )}
                {/* (사용자 정책) 외부 보완 카드 폐기 — 마음 챕터 회복 페이지와 3중 중복. 엄마 채워주는 결만 표시. */}
                {kind === "mom" && /###\s*엄마가\s*채워주는/.test(aiText) && momFlow && (
                  <ElementFlowChart flow={momFlow} parentLabel="엄마" parentColor="#f0a8b8" />
                )}
                {/* idx 3 시프트: 시너지·갈등·선물 — formatText 인터셉트 */}

                {/* ── 아빠와 우리 아이 (PART 5) ──────────────────── */}
                {kind === "dad" && aiTextIdx === 0 && dadCompare && (
                  <ElementCompareRadar cmp={dadCompare} parentLabel="아빠" parentColor="#7eb6ff" childLabel="아이" />
                )}
                {kind === "dad" && aiTextIdx === 1 && dadIlganRel && (
                  <>
                    <IlganRelationCard rel={dadIlganRel} parentLabel="아빠" parentColor="#7eb6ff" />
                    {dadCheonganHap?.hasHap && (
                      <div className="rounded-2xl p-4 mb-4 mt-3" style={{ background: "rgba(126,182,255,0.10)", border: "1px solid rgba(126,182,255,0.4)" }}>
                        <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#7eb6ff" }}>✨ 천간합(天干合) — 명운이 묶이는 인연 ✨</p>
                        <p className="text-[14px] font-bold text-center" style={{ color: BRIGHT }}>
                          {dadCheonganHap.parentIlgan}+{dadCheonganHap.childIlgan} = {dadCheonganHap.hapName}({dadCheonganHap.hapHanja})
                        </p>
                        <p className="text-[10.5px] text-center mt-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                          → 합화 오행: <strong style={{ color: BRIGHT }}>{dadCheonganHap.hapElement}</strong> · 두 분의 결이 깊이 묶입니다
                        </p>
                      </div>
                    )}
                  </>
                )}
                {/* (사용자 정책) 외부 보완 카드 폐기 — 마음 챕터 회복 페이지와 3중 중복. 아빠 채워주는 결만 표시. */}
                {kind === "dad" && /###\s*아빠가\s*채워주는/.test(aiText) && dadFlow && (
                  <ElementFlowChart flow={dadFlow} parentLabel="아빠" parentColor="#7eb6ff" />
                )}
                {kind === "talent" && aiTextIdx === 2 && childThinking && (
                  <ThinkingMatrix tt={childThinking} />
                )}
                {kind === "talent" && aiTextIdx === 5 && childJobRadar && (
                  <JobRadar items={childJobRadar} />
                )}
                {/* (Phase 후속) 자도인의 첫마디 — 자녀 일주 중심 + 부모 양옆 가족 트리오 카드 */}
                {kind === "first-word" && sajuChild && (() => {
                  const ilgan = sajuChild.ilgan;
                  const ilji = sajuChild.pillars.day.branch;
                  const ilganHanja = STEM_HANJA[ilgan as keyof typeof STEM_HANJA] ?? ilgan;
                  const iljiHanja = BRANCH_HANJA[ilji as keyof typeof BRANCH_HANJA] ?? ilji;
                  const ilganElem = STEM_TO_ELEM[ilgan] ?? "";
                  const childMetaphor = ILGAN_METAPHOR[ilgan] ?? "";
                  const elemColorMap: Record<string, string> = { 목: "#7dd3c0", 화: "#ff8a8a", 토: "#e8c9a5", 금: "#cdd9e4", 수: "#a8c4e8" };
                  const elemEmojiMap: Record<string, string> = { 목: "🌿", 화: "🔥", 토: "🟫", 금: "🤍", 수: "🔵" };
                  const childColor = elemColorMap[ilganElem] ?? ACCENT;
                  const childEmoji = elemEmojiMap[ilganElem] ?? "✦";

                  const parentCard = (label: string, saju: SajuAnalysis | null, color: string) => {
                    if (!saju) return null;
                    const pIlgan = saju.ilgan;
                    const pHanja = STEM_HANJA[pIlgan as keyof typeof STEM_HANJA] ?? pIlgan;
                    const pElem = STEM_TO_ELEM[pIlgan] ?? "";
                    const pMetaphor = ILGAN_METAPHOR[pIlgan] ?? "";
                    const pEmoji = elemEmojiMap[pElem] ?? "✦";
                    const pElemColor = elemColorMap[pElem] ?? color;
                    return (
                      <div className="rounded-xl p-2.5 text-center flex-1" style={{ background: `${color}10`, border: `1px solid ${color}40` }}>
                        <p className="text-[9px] mb-1" style={{ color: color }}>{label}</p>
                        <p className="text-[20px] font-bold" style={{ color: BRIGHT, lineHeight: 1 }}>{pHanja}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{pIlgan}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: pElemColor, fontWeight: 600 }}>{pEmoji} {pMetaphor.split(" ").slice(-2).join(" ")}</p>
                      </div>
                    );
                  };

                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT}10, rgba(255,255,255,0.02))`, border: `1px solid ${ACCENT}40` }}>
                      <p className="text-[10.5px] tracking-[0.25em] text-center mb-3" style={{ color: ACCENT }}>─ 가족 세 분의 결이 만난 자리 ─</p>

                      {/* 부모-자녀-부모 가로 배치 */}
                      <div className="flex items-stretch gap-2">
                        {/* 엄마 카드 (좌) */}
                        {hasMom && parentCard("엄마", sajuMom, "#f0a8b8")}

                        {/* 자녀 일주 중심 카드 (가운데, 가장 큼) */}
                        <div className="rounded-xl p-3 text-center" style={{
                          background: `linear-gradient(135deg, ${childColor}25, ${childColor}10)`,
                          border: `2px solid ${childColor}`,
                          flex: hasMom && hasDad ? 1.4 : (hasMom || hasDad ? 1.6 : 2),
                          boxShadow: `0 4px 20px ${childColor}30`,
                        }}>
                          <p className="text-[9px] mb-1" style={{ color: BRIGHT }}>★ 자녀 일주(日柱)</p>
                          <p className="text-[26px] font-bold tracking-wider" style={{ color: BRIGHT, lineHeight: 1 }}>{ilganHanja}{iljiHanja}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{ilgan}{ilji}</p>
                          {childMetaphor && (
                            <p className="text-[10.5px] mt-2 italic leading-[1.45]" style={{ color: childColor, fontWeight: 600 }}>
                              {childEmoji} {childMetaphor}
                            </p>
                          )}
                        </div>

                        {/* 아빠 카드 (우) */}
                        {hasDad && parentCard("아빠", sajuDad, "#7eb6ff")}
                      </div>

                      {/* 화살표 안내 */}
                      <p className="text-[10px] text-center mt-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {hasMom && hasDad ? "↘  ↙  세 분의 결이 한자리에 만난 이야기를 풀어드립니다  ↘  ↙" :
                         (hasMom || hasDad) ? "↘  ↙  두 분의 결이 만난 이야기를 풀어드립니다  ↘  ↙" :
                         "✦ 자녀의 결을 풀어드립니다 ✦"}
                      </p>
                    </div>
                  );
                })()}

                {/* Phase 2: 기운 총량 게이지 — 본문 위 시각 (section regex 매칭) */}
                {kind === "overview" && /###\s*기운\s*총량/.test(aiText) && childDayMasterStrength && (
                  <DayMasterGauge strength={childDayMasterStrength} />
                )}
                {/* Phase 2: 격국 카드 — 본문 위 시각 + 양육 팁 (Phase 후속 강화) */}
                {kind === "overview" && /###\s*격국/.test(aiText) && childGyeokguk && (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(168,139,250,0.08)", border: "1px solid rgba(168,139,250,0.35)" }}>
                    <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#a78bfa" }}>─ 자녀의 격국(格局) — 인생의 큰 그림 ─</p>
                    <p className="text-[20px] font-bold text-center" style={{ color: BRIGHT }}>{childGyeokguk.name}</p>
                    <p className="text-[12px] text-center mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>{childGyeokguk.hanja}</p>
                    <p className="text-[11px] text-center mt-2 italic" style={{ color: "rgba(255,255,255,0.7)" }}>{childGyeokguk.meaning}</p>
                    {/* 양육 팁 3개 */}
                    {childGyeokguk.parentingTips && childGyeokguk.parentingTips.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(168,139,250,0.2)" }}>
                        <p className="text-[10px] mb-2" style={{ color: "#a78bfa", fontWeight: 600 }}>📌 이 격국 자녀를 위한 양육 팁</p>
                        <ul className="space-y-1.5">
                          {childGyeokguk.parentingTips.map((tip, i) => (
                            <li key={i} className="text-[10.5px] leading-[1.55]" style={{ color: "rgba(255,255,255,0.78)" }}>
                              <span style={{ color: "#a78bfa" }}>·</span> {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {/* Phase 2: 공망 카드 — 본문 위 시각 */}
                {/* (Phase 후속) 다섯 색깔의 결 — 5 색상 카드 그리드 (십성 5분류 강도 시각화) */}
                {kind === "heart" && /###\s*다섯\s*색깔/.test(aiText) && childSipseongCounts && (() => {
                  const total = (childSipseongCounts.비겁 ?? 0) + (childSipseongCounts.식상 ?? 0) +
                                (childSipseongCounts.재성 ?? 0) + (childSipseongCounts.관성 ?? 0) +
                                (childSipseongCounts.인성 ?? 0);
                  const items = [
                    { key: "비겁", label: "비겁(比劫)", emoji: "🟣", color: "#a78bfa", desc: "자기 세움·추진", count: childSipseongCounts.비겁 ?? 0 },
                    { key: "식상", label: "식상(食傷)", emoji: "💚", color: "#34d399", desc: "표현·창의", count: childSipseongCounts.식상 ?? 0 },
                    { key: "재성", label: "재성(財星)", emoji: "🟡", color: "#fbbf24", desc: "손에 잡음·실리", count: childSipseongCounts.재성 ?? 0 },
                    { key: "관성", label: "관성(官星)", emoji: "🔵", color: "#60a5fa", desc: "절제·규율", count: childSipseongCounts.관성 ?? 0 },
                    { key: "인성", label: "인성(印星)", emoji: "🟪", color: "#c084fc", desc: "받아들임·사색", count: childSipseongCounts.인성 ?? 0 },
                  ];
                  const maxCnt = Math.max(...items.map(i => i.count), 1);
                  const minCnt = Math.min(...items.map(i => i.count));
                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ACCENT}33` }}>
                      <p className="text-[11px] tracking-[0.2em] text-center mb-3" style={{ color: ACCENT }}>─ 다섯 색깔의 결 — 강·약 ─</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {items.map((item, i) => {
                          const isStrong = item.count === maxCnt && item.count > 0;
                          const isWeak = item.count === minCnt && item.count !== maxCnt;
                          const pct = total > 0 ? (item.count / total) * 100 : 0;
                          return (
                            <div key={i} className="rounded-lg p-2 text-center" style={{
                              background: `${item.color}${isStrong ? "20" : "08"}`,
                              border: `1px solid ${item.color}${isStrong ? "70" : "30"}`,
                            }}>
                              <p className="text-[14px] mb-0.5">{item.emoji}</p>
                              <p className="text-[10px] font-bold" style={{ color: item.color }}>{item.label.split('(')[0]}</p>
                              <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</p>
                              {/* 강도 막대 */}
                              <div className="h-1 rounded mt-2 mx-auto" style={{ width: '100%', background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-1 rounded" style={{ width: `${Math.min(pct * 2, 100)}%`, background: item.color }} />
                              </div>
                              <p className="text-[10px] mt-1" style={{ color: BRIGHT, fontWeight: isStrong ? 700 : 400 }}>
                                {isStrong && '★ '}{isWeak && '△ '}{item.count}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9.5px] text-center mt-2.5 italic" style={{ color: "rgba(255,255,255,0.55)" }}>
                        ★ 가장 강한 결 · △ 가장 약한 결
                      </p>
                    </div>
                  );
                })()}

                {/* (Phase 후속) 타고난 귀인 — N 귀인 카드 그리드 */}
                {kind === "heart" && /###\s*타고난\s*귀인/.test(aiText) && sajuChild && (() => {
                  const guin = (sajuChild.sinsal ?? []).filter(n => SINSAL_INFO[n]?.category === '귀인');
                  if (guin.length === 0) return null;
                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(245,185,66,0.06)", border: `1px solid ${ACCENT}55` }}>
                      <p className="text-[11px] tracking-[0.2em] text-center mb-3" style={{ color: ACCENT }}>─ 타고난 귀인(吉星) {guin.length}자리 ─</p>
                      <div className={`grid gap-2 ${guin.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {guin.map((name, i) => {
                          const info = SINSAL_INFO[name];
                          if (!info) return null;
                          return (
                            <div key={i} className="rounded-xl p-3" style={{ background: "rgba(245,185,66,0.08)", border: `1px solid ${ACCENT}40` }}>
                              <div className="flex items-start gap-2">
                                <span className="text-[18px] leading-none mt-0.5">{info.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold leading-tight" style={{ color: BRIGHT }}>{name}</p>
                                  <p className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>{info.hanja}</p>
                                </div>
                              </div>
                              <p className="text-[10.5px] mt-2 leading-[1.45]" style={{ color: ACCENT, fontWeight: 600 }}>
                                {info.subtitle}
                              </p>
                              <p className="text-[10px] mt-1.5 leading-[1.55]" style={{ color: "rgba(255,255,255,0.7)" }}>
                                {info.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* (폐기) 공망 카드 영구 폐기 — 마음 챕터 부적합 + 부모-자녀 양육 가치 낮음 */}
                {/* Phase 3: 개운법 카드 — 본문 위 시각 (guide 챕터) */}
                {kind === "guide" && /###\s*개운법|###\s*자녀의\s*개운/.test(aiText) && childGaeun && (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,200,120,0.06)", border: "1px solid rgba(255,200,120,0.3)" }}>
                    <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#ffc878" }}>─ 개운법(改運法) — 용신 {childGaeun.yongsinElement} 비보 ─</p>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>🎨 행운 색</p>
                        <p style={{ color: BRIGHT, fontWeight: 600 }}>{childGaeun.colors.join(" · ")}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>🧭 방위</p>
                        <p style={{ color: BRIGHT, fontWeight: 600 }}>{childGaeun.direction}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>🍚 음식</p>
                        <p style={{ color: BRIGHT, fontWeight: 600 }}>{childGaeun.foods.slice(0, 3).join(" · ")}</p>
                      </div>
                      <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>🔢 숫자</p>
                        <p style={{ color: BRIGHT, fontWeight: 600 }}>{childGaeun.numbers.join(" · ")}</p>
                      </div>
                      {/* (사용자 정책) 시간 카드 제거 — "시간 호흡" 페이지(7/10)에 일원화. 시간 정보 중복·충돌 방지. */}
                      <div className="rounded-lg p-2.5 col-span-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>🌿 환경</p>
                        <p style={{ color: BRIGHT, fontWeight: 600 }}>{childGaeun.environment.slice(0, 2).join(" · ")}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Phase 5: 격국 직업 카드 (talent) */}
                {kind === "talent" && /###\s*격국.*직업|###\s*격국\s*기반/.test(aiText) && childGyeokguk && (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(168,139,250,0.07)", border: "1px solid rgba(168,139,250,0.35)" }}>
                    <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#a78bfa" }}>─ 격국(格局) 기반 직업 적성 ─</p>
                    <p className="text-[16px] font-bold text-center" style={{ color: BRIGHT }}>{childGyeokguk.name} ({childGyeokguk.hanja})</p>
                    <p className="text-[10.5px] text-center mt-1.5 italic" style={{ color: "rgba(255,255,255,0.65)" }}>{childGyeokguk.meaning}</p>
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {childGyeokguk.career.map((c, i) => (
                        <div key={i} className="rounded-lg p-2 text-center text-[10.5px]" style={{ background: "rgba(168,139,250,0.10)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(168,139,250,0.25)" }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Phase 4: 일지 관계 카드 (mom/dad) */}
                {(kind === "mom" || kind === "dad") && /###\s*(엄마|아빠)와\s*자녀의\s*일지/.test(aiText) && (kind === "mom" ? momIljiRel : dadIljiRel) && (() => {
                  const r = kind === "mom" ? momIljiRel! : dadIljiRel!;
                  const colorMap: Record<string, string> = { "육합": "#7dd3c0", "비화": "#a78bfa", "육충": "#ff8a8a", "형": "#e8a87c", "해": "#ffc878", "파": "#ff9d6b", "기타": "#cdd9e4" };
                  const c = colorMap[r.kind] ?? "#cdd9e4";
                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: `${c}10`, border: `1px solid ${c}55` }}>
                      <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: c }}>─ 일지(日支) 관계 — {kind === "mom" ? "엄마" : "아빠"} & 자녀 ─</p>
                      <div className="flex items-center justify-center gap-3 text-[18px] font-bold" style={{ color: BRIGHT }}>
                        <span>{r.parentBranch}</span>
                        <span className="text-[14px]" style={{ color: c }}>{r.kind}({r.hanja})</span>
                        <span>{r.childBranch}</span>
                      </div>
                      <p className="text-[10.5px] text-center mt-2 italic" style={{ color: "rgba(255,255,255,0.7)" }}>{r.meaning}</p>
                    </div>
                  );
                })()}
                {/* Phase 4: 부모 십성 카드 */}
                {(kind === "mom" || kind === "dad") && /###\s*(엄마|아빠)가\s*자녀에게\s*주는\s*결/.test(aiText) && (kind === "mom" ? momParentSipseong : dadParentSipseong) && (() => {
                  const r = kind === "mom" ? momParentSipseong! : dadParentSipseong!;
                  const catColor: Record<string, string> = { "비겁": "#a78bfa", "식상": "#34d399", "재성": "#fbbf24", "관성": "#60a5fa", "인성": "#c084fc" };
                  const c = catColor[r.category] ?? "#cdd9e4";
                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: `${c}10`, border: `1px solid ${c}55` }}>
                      <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: c }}>─ 부모 십성(十星) — 자녀 일간 기준 ─</p>
                      <p className="text-[18px] font-bold text-center" style={{ color: BRIGHT }}>{r.sipseong}({r.hanja})</p>
                      <p className="text-[11px] text-center mt-1" style={{ color: c }}>{r.category} 카테고리</p>
                      <p className="text-[10.5px] text-center mt-2 italic leading-[1.55]" style={{ color: "rgba(255,255,255,0.72)" }}>{r.meaning}</p>
                    </div>
                  );
                })()}
                {/* Phase 4: 공통 신살 카드 */}
                {(kind === "mom" || kind === "dad") && /###\s*(엄마|아빠)와\s*자녀가\s*공유하는\s*결/.test(aiText) && (kind === "mom" ? momSharedSinsal : dadSharedSinsal) && (() => {
                  const r = kind === "mom" ? momSharedSinsal! : dadSharedSinsal!;
                  return (
                    <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(245,185,66,0.07)", border: `1px solid ${ACCENT}55` }}>
                      <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: ACCENT }}>─ 공통 신살(神煞) — {kind === "mom" ? "엄마" : "아빠"} & 자녀 ─</p>
                      {r.shared.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                          {r.shared.map((s, i) => (
                            <span key={i} className="text-[11px] px-2.5 py-1 rounded-full"
                              style={{ background: "rgba(245,185,66,0.15)", color: BRIGHT, border: `1px solid ${ACCENT}55` }}>
                              ✨ {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10.5px] text-center mt-2 italic" style={{ color: "rgba(255,255,255,0.6)" }}>
                          공유 신살이 없되 — 각자의 결로 서로를 *보완*하는 가족
                        </p>
                      )}
                    </div>
                  );
                })()}
                {/* Phase 3: 시간 가이드 카드 */}
                {kind === "guide" && /###\s*자녀에게\s*좋은\s*시간|###\s*일주\s*기반\s*일상/.test(aiText) && childTiming && (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(180,150,255,0.05)", border: "1px solid rgba(180,150,255,0.25)" }}>
                    <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#b496ff" }}>─ 자녀의 시간 호흡 — 일간 {childTiming.ilganElement}·일지 {childTiming.ilji} ─</p>
                    <div className="space-y-1.5 text-[10.5px]">
                      <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "rgba(255,200,120,0.08)" }}>
                        <span>☀️</span>
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>활기 시간: </span>
                          <span style={{ color: BRIGHT, fontWeight: 600 }}>{childTiming.bestHours}</span>
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span>🌙</span>
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>잠: </span>
                          <span style={{ color: "rgba(255,255,255,0.85)" }}>{childTiming.sleepBest}</span>
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span>📚</span>
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>학습: </span>
                          <span style={{ color: "rgba(255,255,255,0.85)" }}>{childTiming.studyBest}</span>
                        </div>
                      </div>
                      <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span>🏃</span>
                        <div>
                          <span style={{ color: "rgba(255,255,255,0.55)" }}>야외: </span>
                          <span style={{ color: "rgba(255,255,255,0.85)" }}>{childTiming.outdoorBest}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* (통합) 용신·기신 듀얼 카드 — "평생 빛나는 결" 페이지에서 양면 표시 */}
                {kind === "heart" && /###\s*평생\s*빛나는/.test(aiText) && childGisin && (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: `linear-gradient(135deg, rgba(200,156,255,0.07), rgba(232,168,124,0.07))`, border: "1px solid rgba(200,156,255,0.3)" }}>
                    <p className="text-[11px] tracking-[0.2em] text-center mb-2" style={{ color: "#c89cff" }}>─ 평생 빛나는 결 — 채움(用神) · 살핌(忌神) ─</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(200,156,255,0.10)", border: "1px solid rgba(200,156,255,0.35)" }}>
                        <p className="text-[9px]" style={{ color: "#c89cff", fontWeight: 600 }}>🎯 용신 (가까이 둘 결)</p>
                        <p className="text-[16px] font-bold mt-0.5" style={{ color: BRIGHT }}>{childGisin.yongsin}</p>
                        <p className="text-[8.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>채울수록 빛나는</p>
                      </div>
                      <div className="rounded-lg p-2.5 text-center" style={{ background: "rgba(232,168,124,0.10)", border: "1px solid rgba(232,168,124,0.35)" }}>
                        <p className="text-[9px]" style={{ color: "#e8a87c", fontWeight: 600 }}>❌ 기신 (살펴줄 결)</p>
                        <p className="text-[16px] font-bold mt-0.5" style={{ color: BRIGHT }}>{childGisin.element}({childGisin.hanja})</p>
                        <p className="text-[8.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>과하지 않게</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Phase 4: 사춘기에 결이 변하는 시기 — 본문 위 시각 (사용자 정책: 실전 양육 가이드 통합) */}
                {kind === "guide" && /###\s*사춘기에\s*결이\s*변하는/.test(aiText) && childCrisisTiming && (
                  <CrisisTimingCard timing={childCrisisTiming} parentLabel="부모님" />
                )}
                {aiText ? (
                  // 강점·주의점 카드 섹션은 TraitGrid로 렌더 (overview 마지막 페이지)
                  kind === "overview" && /###\s*강점.{0,3}주의점/.test(aiText) && parseTraitCards(aiText) ? (
                    <TraitGrid cards={parseTraitCards(aiText)!} />
                  ) : kind === "heart" && /###\s*회복과 환경/.test(aiText) && parseRecoveryCards(aiText) ? (
                    <RecoveryGrid cards={parseRecoveryCards(aiText)!} />
                  ) : kind === "heart" && /###\s*살펴주면 좋은 결/.test(aiText) && parseSoftenCards(aiText) ? (
                    <SoftenGrid cards={parseSoftenCards(aiText)!} />
                  ) : kind === "guide" && /###\s*떼.{0,3}고집 대처/.test(aiText) && parseTantrumSteps(aiText) ? (
                    <>
                      {(() => {
                        const intro = aiText
                          .split("\n")
                          .map((l) => l.trim())
                          .find(
                            (l) =>
                              l &&
                              !l.startsWith("###") &&
                              !l.startsWith("•") &&
                              !l.startsWith("-") &&
                              !/^\*\*\d단계/.test(l)
                          );
                        const cleanIntro = intro ? intro.replace(/\*\*/g, "") : "";
                        return cleanIntro ? (
                          <p className="leading-[1.7] mb-4" style={{ color: "rgba(255,255,255,0.88)", fontSize: 14 }}>
                            {cleanIntro}
                          </p>
                        ) : null;
                      })()}
                      <TantrumStepFlow steps={parseTantrumSteps(aiText)!} />
                    </>
                  ) : kind === "guide" && /###\s*통하는 칭찬/.test(aiText) && parsePraiseCards(aiText) ? (
                    <PraiseCompareCards cards={parsePraiseCards(aiText)!} />
                  ) : kind === "guide" && /###\s*자존감 보호/.test(aiText) && parseSelfEsteemMents(aiText) ? (
                    <SelfEsteemMentCards ments={parseSelfEsteemMents(aiText)!} />
                  ) : (kind === "mom" || kind === "dad") && /###\s*잘 통하는 영역/.test(aiText) && parseSynergyCards(aiText) ? (
                    <SynergyGrid cards={parseSynergyCards(aiText)!} color={kind === "mom" ? "#f0a8b8" : "#7eb6ff"} />
                  ) : (kind === "mom" || kind === "dad") && /###\s*갈등이 반복/.test(aiText) && parseConflictCards(aiText) ? (
                    <ConflictCardsGrid
                      cards={parseConflictCards(aiText)!}
                      parentColor={kind === "mom" ? "#f0a8b8" : "#7eb6ff"}
                      parentLabel={kind === "mom" ? "엄마" : "아빠"}
                    />
                  ) : (kind === "mom" || kind === "dad") && /###\s*(엄마|아빠)가 의식적으로/.test(aiText) && parseGiftCard(aiText) ? (
                    <GiftBoxCard gift={parseGiftCard(aiText)!} color={kind === "mom" ? "#f0a8b8" : "#7eb6ff"} />
                  ) : kind === "first-word" ? (
                    /* (Phase 후속) 자도인의 첫마디 본문 — 골드 톤 카드로 감싸 가족 트리오 헤더와 톤 통일 */
                    <div className="rounded-2xl p-4" style={{
                      background: `linear-gradient(135deg, ${ACCENT}10, rgba(255,255,255,0.02))`,
                      border: `1px solid ${ACCENT}40`,
                    }}>
                      {formatText(aiText, partHue)}
                    </div>
                  ) : (
                    formatText(aiText, partHue)
                  )
                ) : (
                  <div className="flex gap-1.5 justify-center items-center py-8">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: ACCENT, animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    // ── Slide 9: 공유 카드 + CTA (마지막) ──
    if (curLayout?.kind === "share") {
      return (
        <div className="flex-1 flex flex-col py-4 gap-5">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: ACCENT }}>마무리</p>
          </div>
          {shareCardBg && (
            <div
              ref={shareCardRef}
              className="relative w-full aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-6"
              style={{
                backgroundImage: `url(/matching-image/${encodeURIComponent(shareCardBg)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
              <div className="relative z-10 space-y-4">
                <p className="text-xs tracking-widest" style={{ color: GOLD }}>慈道人</p>
                <h2 className="text-xl font-bold text-white">{momName} · {childName}</h2>
                {familySaja && (
                  <>
                    <p className="text-2xl font-bold leading-snug px-4" style={{ color: GOLD }}>
                      {familySaja.keyword}
                    </p>
                    <p className="text-xs px-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {familySaja.meaning}
                    </p>
                    {familySaja.subtitle && (
                      <p className="text-[11px] px-4 leading-relaxed" style={{ color: BRIGHT }}>
                        {familySaja.subtitle}
                      </p>
                    )}
                  </>
                )}
                {childAnimal && (
                  <p className="text-sm pt-1" style={{ color: GOLD }}>
                    {childAnimal.branchHanja} · {childAnimal.prefix} {childAnimal.animal}
                  </p>
                )}
                {childObs && (
                  <p className="text-[11px]" style={{ color: `${GOLD}cc` }}>
                    {childObs.dominantHanja} 결의 자녀
                  </p>
                )}
              </div>
            </div>
          )}
          {/* 공유 버튼들 */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={downloadPNG}
              disabled={exportState === "loading"}
              className="py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: `${ACCENT}1f`,
                color: ACCENT,
                border: `1px solid ${ACCENT}55`,
              }}
            >
              {exportState === "loading" ? "저장 중..." : "📷 이미지로 저장"}
            </button>
            <button
              onClick={sharePNG}
              disabled={exportState === "loading"}
              className="py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${BRIGHT})`,
                color: BG,
              }}
            >
              {exportState === "loading" ? "준비 중..." : "📲 공유하기"}
            </button>
          </div>
          {exportState === "success" && (
            <p className="text-xs text-center" style={{ color: "#22c55e" }}>
              ✓ 저장되었습니다
            </p>
          )}
          {exportState === "error" && (
            <p className="text-xs text-center" style={{ color: "#ef4444" }}>
              저장에 실패했어요. 스크린샷으로 저장해주세요.
            </p>
          )}
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.55)" }}>
            인스타 스토리·카카오톡으로 가족과 친구께 보여주십시오
          </p>
          <Link href="/parent-child" className="block text-center py-3 rounded-xl text-sm font-bold"
            style={{ backgroundColor: ACCENT, color: BG }}>
            다른 아이의 궁합도 보러 가기
          </Link>
          <Link href="/" className="block text-center py-3 rounded-xl text-sm"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}44` }}>
            처음으로
          </Link>
        </div>
      );
    }

    return null;
  }

  // ── TOC 항목 — 13 슬라이드 중 8개 주요 슬라이드만 ──
  // TOC — 동적 layout에서 자동 생성 (cover·share 제외)
  const TOC_ITEMS: Array<{ label: string; slide: number }> = slideLayout
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.kind !== "cover" && s.kind !== "share")
    .map(({ s, i }) => ({ label: s.title, slide: i }));
  const goToSlide = (s: number) => {
    setSlide(s);
    setAiPage(0);
    setShowToc(false);
  };

  return (
    <div className="min-h-screen relative" style={{ background: `linear-gradient(180deg, ${BG} 0%, #150810 100%)` }}>
      <main className="w-full max-w-[430px] mx-auto min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${ACCENT}18` }}>
          <Link href="/parent-child" className="text-sm" style={{ color: `${ACCENT}88` }}>←</Link>
          <div className="flex-1 text-sm font-bold text-white">자도인의 가족 인연 풀이</div>
          <span className="text-[11px] tabular-nums" style={{ color: `${ACCENT}77` }}>
            {currentGlobalPage} / {totalGlobalPages}
          </span>
          {/* TOC 버튼 */}
          <button
            onClick={() => setShowToc((v) => !v)}
            className="text-xs px-2.5 py-1.5 rounded-xl transition-all"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
          >
            목차 ↓
          </button>
        </div>

        {/* TOC 드롭다운 */}
        {showToc && (
          <div
            className="absolute top-14 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden max-w-[80vw]"
            style={{ backgroundColor: "#0c0510", border: `1px solid ${ACCENT}33`, minWidth: "200px" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: `1px solid ${ACCENT}18` }}
            >
              <span className="text-sm font-bold text-white">목차</span>
              <button onClick={() => setShowToc(false)} style={{ color: `${ACCENT}77` }}>✕</button>
            </div>
            {TOC_ITEMS.map((item) => {
              const isCurrent = slide === item.slide ||
                (slide > item.slide && (() => {
                  const idx = TOC_ITEMS.findIndex((t) => t.slide === item.slide);
                  const next = TOC_ITEMS[idx + 1];
                  return !next || slide < next.slide;
                })());
              return (
                <button
                  key={item.slide}
                  onClick={() => goToSlide(item.slide)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left transition-all"
                  style={{
                    borderBottom: `1px solid ${ACCENT}0d`,
                    backgroundColor: isCurrent ? `${ACCENT}15` : "transparent",
                    color: isCurrent ? ACCENT : "white",
                  }}
                >
                  <span className="text-xs">{item.label}</span>
                  {isCurrent && <span className="text-[10px]" style={{ color: ACCENT }}>●</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* 본문 — 좌우 탭 */}
        <div
          className="flex-1 px-4 flex flex-col relative"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={onClickArea}
        >
          {renderSlide()}

          {/* 좌우 탭존 화살표 — 시각 안내만 */}
          {(slide > 0 || aiPage > 0) && (
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
              style={{ backgroundColor: `${ACCENT}12` }}
            >
              <span className="text-xl font-light select-none" style={{ color: `${ACCENT}66` }}>‹</span>
            </div>
          )}
          {(slide < TOTAL_SLIDES - 1 || hasMorePages) && (
            <div
              className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-8 h-16 rounded-full"
              style={{ backgroundColor: `${ACCENT}12` }}
            >
              <span className="text-xl font-light select-none" style={{ color: `${ACCENT}66` }}>›</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
