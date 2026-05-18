"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChapterShell from "@/components/hongsil/ChapterShell";
import YongsinCards from "@/components/hongsil/YongsinCards";
import SipseongRow from "@/components/hongsil/SipseongRow";
import {
  SOLO_DURATION_LABEL, LOVE_DESIRE_LABEL, LOVE_STYLE_LABEL,
  SoloDuration, LoveDesire, LoveStyle,
} from "@/lib/hongsil/types";
import { renderParagraphs } from "@/lib/inline-emphasis";
import { derivePatternTags } from "@/lib/hongsil/pattern-tags";
import OpeningVideo from "@/components/OpeningVideo";
import PaymentModal from "@/components/PaymentModal";

// 연애사주 소비자가 (다르면 이 값만 수정)
const HONGSIL_PRICE = 32900;

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK = "#1a0a14";
const INK_SOFT = "#3a2530";

interface PersonData {
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  ilgan: string;
  sipseong: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  elements: { 목: number; 화: number; 토: number; 금: number; 수: number };
  yongsin: string;
  sinsal: string[];
  shinkang: "극약" | "태약" | "신약" | "중화" | "신강" | "태강" | "극왕";
  ohaengTop: string;
  ohaengWeak: string;
  daeun?: { cycles: { age: number; ganji: string }[] };
}

interface CharData {
  name: string;
  innerImage: string;
  signal: string;
  color: string;
  enLabel: string;
}

interface ComputeData {
  me: PersonData;
  character: { me: CharData; destiny: CharData };
}

const JIJANGGAN_MAP: Record<string, string[]> = {
  자: ["임", "계"], 축: ["계", "신", "기"], 인: ["무", "병", "갑"], 묘: ["갑", "을"],
  진: ["을", "계", "무"], 사: ["무", "경", "병"], 오: ["병", "기", "정"], 미: ["정", "을", "기"],
  신: ["무", "임", "경"], 유: ["경", "신"], 술: ["신", "정", "무"], 해: ["무", "갑", "임"],
};
const ELEM_GENERATES: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const ELEM_CONTROLS: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

function huisinOf(yongsin: string) {
  return Object.keys(ELEM_GENERATES).find((k) => ELEM_GENERATES[k] === yongsin) ?? "";
}

function gisinOf(yongsin: string) {
  return Object.keys(ELEM_CONTROLS).find((k) => ELEM_CONTROLS[k] === yongsin) ?? "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-bold mb-3 pl-3"
        style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif", borderLeft: `3px solid ${THREAD}` }}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SubSection({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md p-6"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 8px 24px -12px rgba(178,40,71,0.14)",
      }}>
      <div className="text-[14px] font-bold mb-3 leading-relaxed"
        style={{ color: "#8a4d16", fontFamily: "'Nanum Myeongjo', serif", paddingTop: 2 }}>
        {title}
      </div>
      <div className="text-[13.5px] leading-[1.95]"
        style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
        {renderParagraphs(body, GOLD)}
      </div>
    </div>
  );
}

function EducationPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-8 first:pt-2" style={{ borderBottom: "1px solid rgba(184,134,70,0.16)" }}>
      <div className="text-center mb-7">
        <div className="text-[21px] font-black" style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif" }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] mt-2" style={{ color: "#9b717d", fontFamily: "'Gowun Batang', serif" }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function SoftStatement({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md px-5 py-5 text-center text-[17px] leading-[1.75] font-bold"
      style={{ background: "rgba(126,55,59,0.055)", color: INK, fontFamily: "'Nanum Myeongjo', serif" }}
    >
      {children}
    </div>
  );
}

function BodyCopy({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[17px] leading-[2.08] mt-7" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
      {children}
    </div>
  );
}

function QuoteLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-7 pl-5 text-[16px] leading-[2] italic"
      style={{ borderLeft: "2px solid rgba(200,32,58,0.22)", color: "#6d515a", fontFamily: "'Gowun Batang', serif" }}
    >
      {children}
    </div>
  );
}

function WordMark({ children }: { children: React.ReactNode }) {
  return <b style={{ color: THREAD, fontWeight: 800 }}>{children}</b>;
}

function MiniPillar({
  label,
  sub,
  stem,
  branch,
  stemSub,
  branchSub,
  active,
  accent = "thread",
}: {
  label: string;
  sub: string;
  stem: string;
  branch: string;
  stemSub?: string;
  branchSub?: string;
  active?: boolean;
  accent?: "thread" | "gold";
}) {
  const activeColor = accent === "gold" ? GOLD : THREAD;
  // 골드 강조: 옅은 황금 배경 + 골드 보더 / 분홍 강조: 옅은 자두 배경 + 자두 보더
  const activeBg = accent === "gold" ? "rgba(184,134,70,0.08)" : "rgba(200,32,58,0.05)";
  const activeBorder = accent === "gold" ? `1.5px solid ${GOLD}` : "1.5px solid rgba(200,32,58,0.75)";
  return (
    <div className="text-center">
      <div className="text-[12px] font-bold mb-2" style={{ color: active ? activeColor : "#9b717d", fontFamily: "'Gowun Batang', serif" }}>
        {label}
      </div>
      <div
        className="rounded-md px-2 py-4"
        style={{
          background: active ? activeBg : "rgba(255,255,255,0.72)",
          border: active ? activeBorder : "1px solid rgba(184,134,70,0.24)",
        }}
      >
        <div className="text-[26px] font-black leading-none" style={{ color: colorForLetter(stem), fontFamily: "'Nanum Myeongjo', serif" }}>
          {hanjaForStem(stem)}
        </div>
        <div className="text-[10px] mt-1" style={{ color: "#8a6a73", fontFamily: "'Gowun Batang', serif" }}>{stemSub || stem}</div>
        <div className="my-3 h-px" style={{ background: "rgba(184,134,70,0.2)" }} />
        <div className="text-[26px] font-black leading-none" style={{ color: colorForBranch(branch), fontFamily: "'Nanum Myeongjo', serif" }}>
          {hanjaForBranch(branch)}
        </div>
        <div className="text-[10px] mt-1" style={{ color: active ? activeColor : "#8a6a73", fontFamily: "'Gowun Batang', serif" }}>
          {branchSub || branch}
        </div>
      </div>
      <div className="text-[10px] mt-2" style={{ color: active ? activeColor : "#9b717d", fontFamily: "'Gowun Batang', serif" }}>{sub}</div>
    </div>
  );
}

function FourPillarsDiagram({ pillars, accent = "thread" }: {
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string } | null;
  };
  accent?: "thread" | "gold";
}) {
  const cols = [
    { label: "시주", sub: "깊은 습관", p: pillars.hour, stemSub: "시간", branchSub: "속마음" },
    { label: "일주", sub: "나와 배우자", p: pillars.day, stemSub: "나", branchSub: "배우자", active: true },
    { label: "월주", sub: "사회적 모습", p: pillars.month, stemSub: "환경", branchSub: "관계권" },
    { label: "년주", sub: "타고난 바탕", p: pillars.year, stemSub: "바탕", branchSub: "초기 환경" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3 my-7">
      {cols.map((c) => (
        <MiniPillar
          key={c.label}
          label={c.label}
          sub={c.sub}
          stem={c.p?.stem ?? "-"}
          branch={c.p?.branch ?? "-"}
          stemSub={c.p ? c.stemSub : "시간 미상"}
          branchSub={c.p ? c.branchSub : "시간 미상"}
          active={c.active}
          accent={accent}
        />
      ))}
    </div>
  );
}

const STEM_HANJA_LOCAL: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

const STEM_ELEMENT_LABEL: Record<string, string> = {
  갑: "갑목", 을: "을목", 병: "병화", 정: "정화", 무: "무토", 기: "기토", 경: "경금", 신: "신금", 임: "임수", 계: "계수",
};

const STEM_EASY: Record<string, string> = {
  갑: "곧게 자라려는 큰 나무의 기운",
  을: "부드럽게 뻗어가는 풀과 덩굴의 기운",
  병: "밝게 드러나는 태양의 기운",
  정: "은근히 오래 밝히는 촛불의 기운",
  무: "중심을 잡아주는 큰 산의 기운",
  기: "받아들이고 길러내는 흙의 기운",
  경: "분명하게 다듬는 쇠의 기운",
  신: "섬세하게 빛나는 보석의 기운",
  임: "크게 흐르는 물의 기운",
  계: "조용히 스며드는 빗방울의 기운",
};

// 일간 10 천간 본질 묘사 — "일주" sub 본문 동적 생성용.
// fullName: 한글 (예: "임수") / hanja: 한자 1글자 / headline: 큰 결 한 줄 / nature: 자연 비유 / essence: 본질 두 결.
const STEM_DEEP: Record<string, { fullName: string; hanja: string; headline: string; nature: string; essence: string }> = {
  갑: { fullName: "갑목", hanja: "甲", headline: "가장 곧게 뻗는 결", nature: "큰 나무의 기운", essence: "한번 정한 길을 흔들림 없이 나아가는 결, 위로 향하는 결" },
  을: { fullName: "을목", hanja: "乙", headline: "가장 유연하게 휘는 결", nature: "풀과 덩굴의 기운", essence: "부드럽게 적응하며 자기 자리를 지키는 결, 끈기로 뿌리내리는 결" },
  병: { fullName: "병화", hanja: "丙", headline: "가장 밝게 드러나는 결", nature: "한낮 태양의 기운", essence: "밝고 솔직하게 자신을 드러내는 결, 주변을 환하게 비추는 결" },
  정: { fullName: "정화", hanja: "丁", headline: "가장 은은한 결", nature: "촛불과 등불의 기운", essence: "은근히 오래 밝히는 결, 가까운 사람만 그 온기를 깊이 느끼는 결" },
  무: { fullName: "무토", hanja: "戊", headline: "가장 묵직한 결", nature: "너른 대지의 기운", essence: "중심을 잡아주는 결, 흔들림 없이 받쳐주는 결" },
  기: { fullName: "기토", hanja: "己", headline: "가장 부드럽게 품는 결", nature: "곡식을 길러내는 옥토의 기운", essence: "받아들이고 길러내는 결, 조용히 다듬는 결" },
  경: { fullName: "경금", hanja: "庚", headline: "가장 분명하게 끊는 결", nature: "단단하게 벼려진 강철의 기운", essence: "결단력 있게 다듬는 결, 옳고 그름이 분명한 결" },
  신: { fullName: "신금", hanja: "辛", headline: "가장 섬세하게 빛나는 결", nature: "보석과 칼날의 기운", essence: "은은하게 빛나는 결, 디테일을 놓치지 않는 예리한 결" },
  임: { fullName: "임수", hanja: "壬", headline: "가장 큰 흐름의 결", nature: "너른 강물·바다의 기운", essence: "곧게 흐르되 모든 것을 품는 결, 깊이를 가늠하기 어려운 결" },
  계: { fullName: "계수", hanja: "癸", headline: "가장 섬세한 흐름의 결", nature: "이슬과 빗방울의 기운", essence: "조용히 스며드는 결, 부드럽게 차오르는 결" },
};

const BRANCH_HANJA_LOCAL: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

const STEM_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const BRANCH_ELEMENT: Record<string, string> = {
  인: "목", 묘: "목", 사: "화", 오: "화", 진: "토", 술: "토", 축: "토", 미: "토", 신: "금", 유: "금", 자: "수", 해: "수",
};

const ELEMENT_COLORS: Record<string, string> = {
  목: "#168450",
  화: "#d83b31",
  토: "#b88342",
  금: "#707070",
  수: "#4b7fd0",
};

const BRANCH_ANIMAL: Record<string, string> = {
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼", 진: "용", 사: "뱀", 오: "말", 미: "양", 신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
};

function hanjaForStem(stem: string) {
  return STEM_HANJA_LOCAL[stem] ?? stem;
}

function hanjaForBranch(branch: string) {
  return BRANCH_HANJA_LOCAL[branch] ?? branch;
}

function colorForLetter(letter: string) {
  const elem = STEM_ELEMENT[letter] ?? BRANCH_ELEMENT[letter];
  return elem ? ELEMENT_COLORS[elem] : GOLD;
}

function colorForBranch(branch: string) {
  return colorForLetter(branch);
}

function elementLabelOf(letter: string) {
  return STEM_ELEMENT[letter] ?? BRANCH_ELEMENT[letter] ?? "";
}

function HeavenlyStemTable({ highlightStem, accent = "thread" }: { highlightStem?: string; accent?: "thread" | "gold" } = {}) {
  const groups = [
    { elem: "목", stems: ["갑", "을"], easy: ["큰나무", "풀꽃"] },
    { elem: "화", stems: ["병", "정"], easy: ["태양", "촛불"] },
    { elem: "토", stems: ["무", "기"], easy: ["산", "논밭"] },
    { elem: "금", stems: ["경", "신"], easy: ["바위", "보석"] },
    { elem: "수", stems: ["임", "계"], easy: ["바다", "시냇물"] },
  ];
  const highlightColor = accent === "gold" ? GOLD : THREAD;
  const highlightBg = accent === "gold" ? "rgba(184,134,70,0.08)" : "rgba(200,32,58,0.05)";
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-md my-7" style={{ border: "1px solid rgba(184,134,70,0.24)" }}>
      {groups.map((g) => {
        const isActive = highlightStem ? g.stems.includes(highlightStem) : false;
        return (
          <div
            key={g.elem}
            className="text-center py-4 px-1"
            style={{
              borderRight: "1px solid rgba(184,134,70,0.18)",
              background: isActive ? highlightBg : "transparent",
              boxShadow: isActive ? `inset 0 0 0 1.5px ${highlightColor}` : undefined,
            }}
          >
            <div className="text-[15px] font-black" style={{ color: isActive ? highlightColor : ELEMENT_COLORS[g.elem], fontFamily: "'Nanum Myeongjo', serif" }}>
              {g.elem}
            </div>
            <div className="text-[19px] font-black mt-3 tracking-wider" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {g.stems.map((s, i) => (
                <span key={s} style={{ color: s === highlightStem ? highlightColor : ELEMENT_COLORS[g.elem] }}>
                  {hanjaForStem(s)}{i < g.stems.length - 1 ? " " : ""}
                </span>
              ))}
            </div>
            <div className="text-[11px] mt-2 leading-[1.6]" style={{ color: isActive ? highlightColor : "#6d515a", fontFamily: "'Gowun Batang', serif" }}>
              {g.stems.join(" ")}
              <br />
              {g.easy.join(" / ")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BranchGrid({ active, accent = "thread" }: { active?: string; accent?: "thread" | "gold" }) {
  const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  const activeColor = accent === "gold" ? GOLD : THREAD;
  const activeBg = accent === "gold" ? "rgba(184,134,70,0.08)" : `${THREAD}0f`;
  return (
    <div className="grid grid-cols-4 gap-2 my-7">
      {branches.map((b) => {
        const selected = b === active;
        const color = colorForBranch(b);
        return (
          <div
            key={b}
            className="rounded-md py-3 text-center"
            style={{
              background: selected ? activeBg : "rgba(255,255,255,0.68)",
              border: selected ? `1.5px solid ${activeColor}` : "1px solid rgba(184,134,70,0.24)",
            }}
          >
            <div className="text-[22px] font-black" style={{ color: selected ? activeColor : color, fontFamily: "'Nanum Myeongjo', serif" }}>{hanjaForBranch(b)}</div>
            <div className="text-[11px] mt-1" style={{ color: selected ? activeColor : "#6d515a", fontFamily: "'Gowun Batang', serif" }}>
              {b} · {BRANCH_ANIMAL[b]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 12지지 배우자궁 결 매핑 — "배우자 자리" sub 본문 동적 생성용.
const BRANCH_DEEP: Record<string, { tone: string; relation: string }> = {
  자: { tone: "깊고 조용한", relation: "차분하게 정서를 교감하는 결" },
  축: { tone: "묵직하고 안정적인", relation: "꾸준한 신뢰로 함께 머무는 결" },
  인: { tone: "활기차고 새로운", relation: "함께 새 길을 열어가는 결" },
  묘: { tone: "부드럽고 섬세한", relation: "다정한 일상으로 교감하는 결" },
  진: { tone: "깊고 포용하는", relation: "두 사람만의 우주를 함께 키우는 결" },
  사: { tone: "빠르고 직관적인", relation: "강한 끌림으로 시작되는 결" },
  오: { tone: "환하고 솔직한", relation: "감정을 풍부하게 나누는 결" },
  미: { tone: "따뜻하고 보살피는", relation: "한결같은 다정으로 곁을 지키는 결" },
  신: { tone: "예리하고 정돈된", relation: "영민한 대화로 결을 맞추는 결" },
  유: { tone: "섬세하고 정밀한", relation: "미감과 디테일을 함께 나누는 결" },
  술: { tone: "신뢰와 의리의", relation: "한 사람에게 깊이 응답하는 결" },
  해: { tone: "풍부하고 너른", relation: "깊은 정서와 흐름을 함께 흘리는 결" },
};

const ELEMENT_HANJA: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

// 오행 다이어그램 색 톤
const SAENG_COLOR = "#d44066"; // 상생 — 옅은 자두 핑크 실선
const GEUK_COLOR = "#1a1a1a";  // 상극 — 차콜 점선
const SAENG_COLOR_FAINT = "rgba(212,64,102,0.85)";
const GEUK_COLOR_FAINT = "rgba(26,26,26,0.6)";

// 소수점 1자리로 반올림 + 정수면 정수 그대로
function fmtCount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

// 펜타곤 좌표 (viewBox 400x400, 중심 200,200, 반지름 130)
// 화 top → 시계방향: 토, 금, 수, 목
const PENTAGON_POS: Record<string, { x: number; y: number }> = {
  화: { x: 200, y: 70 },
  토: { x: 323.6, y: 159.8 },
  금: { x: 276.4, y: 305.2 },
  수: { x: 123.6, y: 305.2 },
  목: { x: 76.4, y: 159.8 },
};

function OhaengDiagram({ counts }: { counts: PersonData["elements"] }) {
  const elements: Array<keyof PersonData["elements"]> = ["목", "화", "토", "금", "수"];
  // 상생: 목→화→토→금→수→목 (실선)
  const saengEdges: Array<[string, string]> = [
    ["목", "화"], ["화", "토"], ["토", "금"], ["금", "수"], ["수", "목"],
  ];
  // 상극: 목→토→수→화→금→목 (점선)
  const geukEdges: Array<[string, string]> = [
    ["목", "토"], ["토", "수"], ["수", "화"], ["화", "금"], ["금", "목"],
  ];
  // 본인 사주의 최대 오행 — 골드 보더로 강조
  const maxElem = elements.slice().sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];

  // 원 반지름 (글자 들어갈 공간) — 자음 제거로 컴팩트했던 거 키움
  const R_CIRCLE = 56;

  // 엣지 라인 짧게 — 원 가장자리에서 시작·끝나도록 보정
  const shortenLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist, uy = dy / dist;
    return {
      x1: from.x + ux * R_CIRCLE,
      y1: from.y + uy * R_CIRCLE,
      x2: to.x - ux * R_CIRCLE,
      y2: to.y - uy * R_CIRCLE,
    };
  };

  // 컨테이너 크기 키움 — 원 커진 만큼 펜타곤 면적도 같이 넓힘
  const CANVAS = 400;

  return (
    <div className="my-7">
      <div className="relative mx-auto" style={{ width: CANVAS, height: CANVAS, maxWidth: "100%" }}>
        <svg viewBox="0 0 400 400" className="absolute inset-0" style={{ width: "100%", height: "100%" }}>
          <defs>
            <marker id="arrow-saeng" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={SAENG_COLOR_FAINT} />
            </marker>
            <marker id="arrow-geuk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={GEUK_COLOR_FAINT} />
            </marker>
          </defs>
          {/* 상생 — 핑크 실선 */}
          {saengEdges.map(([f, t], i) => {
            const seg = shortenLine(PENTAGON_POS[f], PENTAGON_POS[t]);
            return (
              <line
                key={`s${i}`}
                x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                stroke={SAENG_COLOR_FAINT} strokeWidth="1.8"
                markerEnd="url(#arrow-saeng)"
              />
            );
          })}
          {/* 상극 — 차콜 진한 점선 (펜타그램 안쪽) */}
          {geukEdges.map(([f, t], i) => {
            const seg = shortenLine(PENTAGON_POS[f], PENTAGON_POS[t]);
            return (
              <line
                key={`g${i}`}
                x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                stroke={GEUK_COLOR_FAINT} strokeWidth="1.3" strokeDasharray="5 3"
                markerEnd="url(#arrow-geuk)"
              />
            );
          })}
        </svg>

        {/* 5 오행 원 (absolute positioned overlay) */}
        {elements.map((e) => {
          const pos = PENTAGON_POS[e];
          const color = ELEMENT_COLORS[e];
          const count = counts[e] ?? 0;
          const isMax = e === maxElem && count > 0;
          const left = pos.x - R_CIRCLE;
          const top = pos.y - R_CIRCLE;
          return (
            <div
              key={e}
              className="absolute rounded-full flex flex-col items-center justify-center text-center"
              style={{
                width: R_CIRCLE * 2,
                height: R_CIRCLE * 2,
                left: `${(left / CANVAS) * 100}%`,
                top: `${(top / CANVAS) * 100}%`,
                background: `${color}10`,
                border: isMax ? `2.5px solid ${THREAD}` : `1.5px solid ${color}`,
                boxShadow: isMax ? `0 0 0 4px ${THREAD}22` : undefined,
              }}
            >
              <div className="text-[18px] font-black leading-none" style={{ color: isMax ? THREAD : color, fontFamily: "'Nanum Myeongjo', serif" }}>
                {e}({ELEMENT_HANJA[e]})
              </div>
              <div className="text-[11px] mt-2" style={{ color: isMax ? THREAD : color, fontWeight: 700 }}>
                내 사주 {fmtCount(count)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-5 mt-4 text-[11px]" style={{ color: "#6d515a", fontFamily: "'Gowun Batang', serif" }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 22, height: 2, background: SAENG_COLOR_FAINT, borderRadius: 1 }} />
          상생
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 22, height: 0, borderTop: `2px dashed ${GEUK_COLOR_FAINT}` }} />
          상극
        </span>
      </div>

      <div className="rounded-md px-4 py-3 mt-5 text-[13px] leading-[1.8]" style={{ background: "rgba(126,55,59,0.045)", color: INK, fontFamily: "'Gowun Batang', serif" }}>
        <WordMark>상생</WordMark>은 서로 힘을 보태는 흐름, <WordMark>상극</WordMark>은 서로 조절하는 흐름이에요.
        연애에서는 이 균형이 편안함과 피로감을 가르는 기준이 됩니다.
      </div>
    </div>
  );
}

function IljuFocusCard({ name, day }: { name: string; day: { stem: string; branch: string } }) {
  return (
    <div className="rounded-md p-5 my-7" style={{ border: "1px solid rgba(200,32,58,0.28)", background: "rgba(255,255,255,0.68)" }}>
      <div className="grid grid-cols-[1fr_1fr] gap-3 items-stretch">
        <div className="rounded-md p-4 text-center" style={{ background: "rgba(200,32,58,0.05)", border: "1px solid rgba(200,32,58,0.28)" }}>
          <div className="text-[11px] font-bold" style={{ color: THREAD, fontFamily: "'Gowun Batang', serif" }}>일간 · 나</div>
          <div className="text-[36px] font-black my-3" style={{ color: colorForLetter(day.stem), fontFamily: "'Nanum Myeongjo', serif" }}>
            {hanjaForStem(day.stem)}
          </div>
          <div className="text-[12px]" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
            {STEM_ELEMENT_LABEL[day.stem] ?? day.stem}
            <br />
            {STEM_EASY[day.stem] ?? "나를 상징하는 기운"}
          </div>
        </div>
        <div className="rounded-md p-4 text-center" style={{ background: "rgba(184,134,70,0.06)", border: "1px solid rgba(184,134,70,0.28)" }}>
          <div className="text-[11px] font-bold" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>일지 · 배우자 자리</div>
          <div className="text-[36px] font-black my-3" style={{ color: colorForBranch(day.branch), fontFamily: "'Nanum Myeongjo', serif" }}>
            {hanjaForBranch(day.branch)}
          </div>
          <div className="text-[12px]" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
            {day.branch} · {BRANCH_ANIMAL[day.branch] ?? "관계의 자리"}
            <br />
            마음 깊은 곳의 관계 습관
          </div>
        </div>
      </div>
      <div className="text-center text-[13px] leading-[1.8] mt-4" style={{ color: "#6d515a", fontFamily: "'Gowun Batang', serif" }}>
        그래서 {name}님의 연애 해석은 이 두 자리에서 먼저 출발해요.
      </div>
    </div>
  );
}

// ── 신강신약 7단계 매핑 ─────────────────────────────────
// 사용자 미감 결핍 낙인 회피 — "옅음·얇음·균형·단단함" 톤으로 양반사주식 긍정 묘사.
const SHINKANG_LEVELS = ["극약", "태약", "신약", "중화", "신강", "태강", "극왕"] as const;
type ShinkangLevel = typeof SHINKANG_LEVELS[number];

const SHINKANG_DEEP: Record<ShinkangLevel, { label: string; depth: string; tone: string; close: string }> = {
  극약: {
    label: "극약(極弱)",
    depth: "가장 깊이 옅게",
    tone: "곁의 사람의 결에 깊이 응답하시는 분이지요. 한 사람의 결에 마음을 다 내어주는, 함께 빛나야 비로소 완성되는 결이에요.",
    close: "그래서 본인 결을 살려주는 단 한 사람이 무엇보다 중요해요.",
  },
  태약: {
    label: "태약(太弱)",
    depth: "매우 옅게",
    tone: "주변의 지지와 받침이 핵심이 되시는 분이지요. 곁의 따뜻한 결 속에서 본인의 깊이가 천천히 드러나는 결이에요.",
    close: "본인을 단단히 받쳐주는 결이 가까이 있을 때 가장 빛나세요.",
  },
  신약: {
    label: "신약(身弱)",
    depth: "옅게",
    tone: "주변의 지지와 응원을 받을 때 더 단단해지시는 분이지요. 한 사람의 결에 깊이 응답하는, 곁의 사람과 함께 빛나는 결이에요.",
    close: "본인 결을 살려주는 곁의 결을 알아보는 게 핵심이에요.",
  },
  중화: {
    label: "중화(中和)",
    depth: "균형 있게",
    tone: "상황에 따라 유연하게 대처하시는 분이지요. 한쪽으로 치우치지 않고 자기 페이스와 상대 결을 함께 살피는 결이에요.",
    close: "유연한 결의 장점을 살리되 본인이 진짜 원하는 방향은 분명히 잡으세요.",
  },
  신강: {
    label: "신강(身强)",
    depth: "두텁게",
    tone: "외부에 흔들리지 않는 본인 페이스를 가지신 분이지요. 한 번 정한 방향은 좀처럼 바꾸지 않으시는 결, 본인 결이 분명한 분이에요.",
    close: "분명한 본인 결을 부드럽게 풀어줄 방향을 짚어드릴게요.",
  },
  태강: {
    label: "태강(太强)",
    depth: "매우 두텁게",
    tone: "본인 색이 매우 분명하신 분이지요. 한 번 잡은 방향에 흔들림이 없고, 자기 기준이 또렷한 결이에요.",
    close: "강한 본인 결을 어떻게 부드럽게 풀어내는지가 관계의 열쇠예요.",
  },
  극왕: {
    label: "극왕(極旺)",
    depth: "가장 깊이 두텁게",
    tone: "외부의 어떤 흐름에도 흔들리지 않는, 가장 단단한 결을 가지신 분이지요. 본인의 결이 곧 중심이 되는 결이에요.",
    close: "본인 결을 부드럽게 흘려보낼 방향을 알아두면 관계가 한결 편안해져요.",
  },
};

function bucketShinkang(raw: string): ShinkangLevel {
  if (/극왕|극강/.test(raw)) return "극왕";
  if (/태강/.test(raw)) return "태강";
  if (/신강/.test(raw)) return "신강";
  if (/중화/.test(raw)) return "중화";
  if (/극약/.test(raw)) return "극약";
  if (/태약/.test(raw)) return "태약";
  return "신약";
}

// ── 7단계 신강신약 게이지 — 999 K 형태 ────────────────────
// 상단: 7 점 가로 게이지 (본인 위치 골드 강조)
// 중단: 본인 결 단언 박스 (자두 분홍 테두리)
// 하단: 7단계 한 줄 설명 표 (본인 행 골드 강조)
const SHINKANG_SHORT: Record<ShinkangLevel, string> = {
  극약: "외부 결을 받아 자라는 사주",
  태약: "의지할 결을 찾는 협력형",
  신약: "신중하게 받아들이는 결",
  중화: "균형 잡힌 결",
  신강: "자기 결이 단단한 사주",
  태강: "강한 자기 색을 가진 결",
  극왕: "독자적으로 길을 만드는 결",
};
function ShinkangGauge({ level }: { level: ShinkangLevel }) {
  const activeIdx = SHINKANG_LEVELS.indexOf(level);
  return (
    <div className="my-7">
      {/* 상단 7 점 가로 게이지 */}
      <div className="relative my-5">
        <div className="absolute left-0 right-0 h-px" style={{ top: 6, background: "rgba(184,134,70,0.3)" }} />
        <div className="relative grid grid-cols-7 gap-0">
          {SHINKANG_LEVELS.map((lv, i) => {
            const isActive = i === activeIdx;
            return (
              <div key={lv} className="flex flex-col items-center">
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: isActive ? 13 : 9,
                    height: isActive ? 13 : 9,
                    background: isActive ? GOLD : "rgba(184,134,70,0.45)",
                    boxShadow: isActive ? `0 0 0 3px ${GOLD}33` : undefined,
                  }}
                />
                <div
                  className="text-[11px] mt-2"
                  style={{
                    color: isActive ? GOLD : "#9b717d",
                    fontWeight: isActive ? 800 : 500,
                    fontFamily: "'Gowun Batang', serif",
                  }}
                >
                  {lv}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 본인 결 단언 박스 */}
      <div
        className="mx-auto my-5 px-5 py-3 rounded-md text-center"
        style={{
          maxWidth: 320,
          border: `1px solid ${THREAD}55`,
          background: "rgba(200,32,58,0.04)",
        }}
      >
        <div className="text-[13px] font-bold" style={{ color: THREAD, fontFamily: "'Gowun Batang', serif" }}>
          일간 깊은 {SHINKANG_DEEP[level].label} 사주
        </div>
        <div className="text-[11px] mt-1" style={{ color: "#8a6a73", fontFamily: "'Gowun Batang', serif" }}>
          · {SHINKANG_SHORT[level]} ·
        </div>
      </div>

      {/* 하단 7단계 한 줄 설명 표 */}
      <div className="mt-5">
        <div className="text-[11px] mb-2 text-center" style={{ color: "#9b717d", fontFamily: "'Gowun Batang', serif" }}>
          7단계가 뭔가요?
        </div>
        <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(184,134,70,0.22)" }}>
          {SHINKANG_LEVELS.map((lv, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={lv}
                className="grid grid-cols-[80px_1fr] items-center py-2 px-3"
                style={{
                  background: isActive ? "rgba(184,134,70,0.10)" : i % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)",
                  borderTop: i > 0 ? "1px solid rgba(184,134,70,0.12)" : undefined,
                }}
              >
                <div
                  className="text-[12px] font-bold"
                  style={{ color: isActive ? GOLD : "#6d515a", fontFamily: "'Gowun Batang', serif" }}
                >
                  {lv}
                </div>
                <div
                  className="text-[11.5px]"
                  style={{ color: isActive ? GOLD : "#6d515a", fontWeight: isActive ? 700 : 400, fontFamily: "'Gowun Batang', serif" }}
                >
                  {SHINKANG_SHORT[lv]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CharacterIntroCard({ name, character }: { name: string; character: NonNullable<ComputeData["character"]> }) {
  const me = character.me;
  const destiny = character.destiny;
  const [revealed, setRevealed] = useState<0 | 1 | 2 | 3>(0);
  const captureRef = useRef<HTMLDivElement>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // 빅 리빌 — 단계별 페이드 인
  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(1), 200);  // 본인 카드
    const t2 = setTimeout(() => setRevealed(2), 1000); // 운명 짝꿍 카드
    const t3 = setTimeout(() => setRevealed(3), 1700); // 공유 버튼
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  async function handleShare() {
    const text = `난 #${me.name}이래! 운명 짝꿍은 #${destiny.name}\n사주가 읽어주는 내 인연`;
    try {
      if (typeof window !== "undefined" && (navigator as any).share) {
        try {
          const html2canvas = (await import("html2canvas-pro")).default;
          if (captureRef.current) {
            const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true, backgroundColor: null });
            const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/png"));
            if (blob && (navigator as any).canShare?.({ files: [new File([blob], "hongsil.png", { type: "image/png" })] })) {
              await (navigator as any).share({
                files: [new File([blob], "hongsil.png", { type: "image/png" })],
                text,
              });
              setShareMsg("✓ 공유했어요");
              setTimeout(() => setShareMsg(null), 2000);
              return;
            }
          }
        } catch { /* fallback */ }
        await (navigator as any).share({ text, url: "https://paljawon.com/love" });
        setShareMsg("✓ 공유했어요");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg("✓ 복사됐어요!");
      }
      setTimeout(() => setShareMsg(null), 2000);
    } catch {
      setShareMsg("× 공유 실패");
      setTimeout(() => setShareMsg(null), 2000);
    }
  }

  return (
    <>
      {/* 캡처용 hidden 카드 (SNS 공유) */}
      <div
        ref={captureRef}
        style={{
          position: "fixed", left: "-9999px", top: 0,
          width: 540, padding: 32,
          background: `
            radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 55%),
            radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
            linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
          `,
          fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ color: GOLD, fontSize: 11, letterSpacing: "0.4em", fontFamily: "'Cormorant Garamond', serif" }}>
            紅 絲 · MY HONGSIL
          </div>
          <div style={{ color: THREAD, fontSize: 13, letterSpacing: "0.3em", marginTop: 6 }}>
            연애사주
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "24px 16px", borderTop: `1px solid #c9a871`, borderBottom: `1px solid #c9a871`, marginBottom: 20 }}>
          <div style={{ color: INK_SOFT, fontSize: 14, marginBottom: 8 }}>{name}님은</div>
          <div style={{ color: me.color, fontSize: 64, fontWeight: 900, lineHeight: 1, marginBottom: 6, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}>
            {me.name}
          </div>
          <div style={{ color: PLUM, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 10 }}>스타일</div>
          <div style={{ color: INK, fontSize: 14 }}>{me.innerImage}</div>
        </div>
        <div style={{ textAlign: "center", padding: "16px" }}>
          <div style={{ color: GOLD, fontSize: 11, letterSpacing: "0.4em", marginBottom: 8 }}>DESTINY</div>
          <div style={{ color: INK_SOFT, fontSize: 13, marginBottom: 4 }}>운명의 짝꿍</div>
          <div style={{ color: destiny.color, fontSize: 44, fontWeight: 900, lineHeight: 1, marginBottom: 8, fontFamily: "'Nanum Myeongjo', serif" }}>
            {destiny.name}
          </div>
          <div style={{ color: INK, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{destiny.innerImage}</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, color: GOLD, fontSize: 10, letterSpacing: "0.2em" }}>
          &nbsp;
        </div>
      </div>

      {/* 표시용 카드 — 일반 흰 박스 + 빅 리빌 단계별 페이드 */}
      <div className="mb-8">
      <div className="rounded-lg overflow-hidden relative"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 4px 12px -4px rgba(0,0,0,0.08)",
        }}>

        {/* 본인 카드 — Stage 1 페이드 */}
        <div className="px-5 py-6 text-center"
          style={{
            borderBottom: "1px solid rgba(201,168,113,0.4)",
            opacity: revealed >= 1 ? 1 : 0,
            transform: revealed >= 1 ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
          <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            紅 絲 · MY HONGSIL
          </div>
          <div className="text-[13px] mb-2" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            {name}님은
          </div>
          <div className="text-[48px] font-black leading-none mt-1 mb-2"
            style={{
              color: me.color,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: "0.05em",
              textShadow: `0 2px 12px ${me.color}33`,
            }}>
            {me.name}
          </div>
          <div className="text-[11px] font-bold tracking-[0.2em]" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
            스타일
          </div>
          <div className="text-[12px] mt-2" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            {me.innerImage}
          </div>
        </div>

        {/* 운명 짝꿍 — Stage 2 페이드 */}
        <div className="px-5 py-5 text-center"
          style={{
            opacity: revealed >= 2 ? 1 : 0,
            transform: revealed >= 2 ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}>
          <div className="text-[11px] tracking-[0.45em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            DESTINY · 운명의 짝꿍
          </div>
          <div className="text-[13px]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            {name}님의 운명 짝꿍은
          </div>
          <div className="text-[36px] font-black leading-none mt-1 mb-1"
            style={{
              color: destiny.color,
              fontFamily: "'Nanum Myeongjo', serif",
              letterSpacing: "0.05em",
              textShadow: `0 2px 8px ${destiny.color}33`,
            }}>
            {destiny.name}
          </div>
          <div className="text-[12px] mt-1" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            {destiny.innerImage}
          </div>
        </div>

        {/* 공유 버튼 — 숨김 (나중에 살릴 수 있도록 코드 보존) */}
        <div className="hidden px-5 pb-5"
          style={{
            opacity: revealed >= 3 ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}>
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-md text-[13px] font-bold transition-all active:scale-95"
            style={{
              background: `${THREAD}22`,
              color: THREAD,
              fontFamily: "'Gowun Batang', serif",
              letterSpacing: "0.1em",
              border: `1.5px solid ${THREAD}55`,
            }}
          >
            {shareMsg ?? "♡ 친구에게 결과 공유하기"}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}

// 2장 — 대운 10년 단위 타임라인 (현재 위치 강조)
// 천간 → 오행 매핑 (대운 강 색 그라데이션용)
const STEM_TO_ELEMENT: Record<string, string> = {
  갑: "목", 을: "목",
  병: "화", 정: "화",
  무: "토", 기: "토",
  경: "금", 신: "금",
  임: "수", 계: "수",
};

// 운명의 강 — S자 곡선 SVG 타임라인
// 강 색 = 대운 천간 오행 그라데이션 / 현재 위치 = 핑크 빛나는 점 + 글로우
// 과거 구간 = 진한 실선 / 미래 구간 = 흐릿한 점선
function DaeunTimeline({ daeun, birthYear, currentYear }: {
  daeun: { cycles: { age: number; ganji: string }[] };
  birthYear: number;
  currentYear: number;
}) {
  const currentAge = currentYear - birthYear;
  // 60세 이하 대운까지만 표시 (노년 시기 인용 차단)
  const cycles = daeun.cycles.filter(c => c.age <= 60).slice(0, 7);
  const n = cycles.length;
  if (n === 0) return null;

  // 현재 위치 인덱스
  const currentIdx = cycles.findIndex((c, i) => {
    const endAge = i + 1 < n ? cycles[i + 1].age - 1 : c.age + 9;
    return currentAge >= c.age && currentAge <= endAge;
  });

  // SVG 좌표 — S자 사인파
  const W = 760, H = 220;
  const padX = 40, midY = H / 2;
  const amp = 38; // 곡선 진폭
  const points = cycles.map((c, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = padX + (W - 2 * padX) * t;
    // 사인파로 S자 흐름 (전체 1.5 cycle)
    const y = midY + Math.sin(t * Math.PI * 1.5) * amp;
    return { x, y };
  });

  // 부드러운 path (catmull-rom 풍 — 각 점 사이 quadratic bezier)
  const pathFor = (pts: typeof points) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], cur = pts[i];
      const midX = (prev.x + cur.x) / 2;
      d += ` Q ${midX} ${prev.y} ${midX} ${(prev.y + cur.y) / 2} T ${cur.x} ${cur.y}`;
    }
    return d;
  };

  // 과거 + 현재까지 path / 현재 이후 path (점선)
  const pastEnd = currentIdx >= 0 ? Math.min(currentIdx + 1, n) : n;
  const pastPts = points.slice(0, pastEnd);
  const futurePts = currentIdx >= 0 && currentIdx < n - 1 ? points.slice(currentIdx) : [];

  return (
    <div className="rounded-md px-3 py-5"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 6px 20px -8px rgba(178,40,71,0.12)",
      }}>
      <div className="text-[14px] font-bold mb-1 text-center" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
        대운(大運) — 인생의 강이 흐르는 결
      </div>
      <div className="text-[11px] mb-3 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        10년 단위 큰 흐름 — 지금 위치는 빛나는 점
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
        <defs>
          <linearGradient id="river-grad" x1="0" y1="0" x2="1" y2="0">
            {cycles.map((c, i) => {
              const stem = c.ganji.charAt(0);
              const elem = STEM_TO_ELEMENT[stem];
              const color = ELEMENT_COLORS[elem] ?? PLUM;
              const offset = n === 1 ? 50 : (i / (n - 1)) * 100;
              return <stop key={i} offset={`${offset}%`} stopColor={color} />;
            })}
          </linearGradient>
          <filter id="river-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 강 본체 — 과거+현재 진한 실선 */}
        <path d={pathFor(pastPts)} fill="none" stroke="url(#river-grad)" strokeWidth="7" strokeLinecap="round" opacity="0.92" />
        {/* 강 본체 — 미래 흐릿한 점선 */}
        {futurePts.length > 1 && (
          <path d={pathFor(futurePts)} fill="none" stroke="url(#river-grad)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 5" opacity="0.4" />
        )}

        {/* 각 대운 마커 */}
        {points.map((p, i) => {
          const c = cycles[i];
          const isCurrent = i === currentIdx;
          const isPast = currentIdx >= 0 && i < currentIdx;
          const stem = c.ganji.charAt(0);
          const elem = STEM_TO_ELEMENT[stem];
          const color = ELEMENT_COLORS[elem] ?? PLUM;
          return (
            <g key={i}>
              {isCurrent && (
                <>
                  <circle cx={p.x} cy={p.y} r="18" fill={THREAD} opacity="0.15" filter="url(#river-glow)" />
                  <circle cx={p.x} cy={p.y} r="12" fill="none" stroke={THREAD} strokeWidth="1.3" opacity="0.6" />
                </>
              )}
              <circle
                cx={p.x} cy={p.y} r={isCurrent ? 8 : 5}
                fill={isCurrent ? THREAD : color}
                opacity={isCurrent ? 1 : isPast ? 0.85 : 0.5}
                stroke="#fff" strokeWidth={isCurrent ? 2 : 1}
              />
              {/* 나이 (점 위) */}
              <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="11" fill={isCurrent ? THREAD : INK_SOFT}
                fontFamily="'Cormorant Garamond', serif" fontWeight={isCurrent ? 800 : 500}>
                {c.age}세
              </text>
              {/* 대운 한자 (점 아래) */}
              <text x={p.x} y={p.y + 24} textAnchor="middle" fontSize="15" fontWeight="800"
                fill={isCurrent ? THREAD : color} fontFamily="'Nanum Myeongjo', serif">
                {c.ganji}
              </text>
              {/* "지금" 라벨 */}
              {isCurrent && (
                <g>
                  <rect x={p.x - 18} y={p.y + 32} width="36" height="16" rx="8" fill={THREAD} />
                  <text x={p.x} y={p.y + 44} textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="'Gowun Batang', sans-serif">
                    지금
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* 범례 — 오행 색 안내 */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] flex-wrap" style={{ color: "#6d515a", fontFamily: "'Gowun Batang', serif" }}>
        {(["목", "화", "토", "금", "수"] as const).map(e => (
          <span key={e} className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: ELEMENT_COLORS[e] }} />
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

// 3장 — 운명 짝꿍 큰 카드 (CharacterIntroCard보다 임팩트 ↑)
function DestinyHeroCard({ destiny, name }: { destiny: CharData; name: string }) {
  return (
    <div className="rounded-md p-6 text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(253,243,232,0.92) 100%)",
        border: `2px solid #c9a871`,
        boxShadow: `0 12px 32px -10px rgba(184,134,70,0.30), 0 4px 12px -4px rgba(178,40,71,0.10), inset 0 0 0 1px rgba(255,255,255,0.5)`,
      }}>
      {/* 상단 베이지 액센트 */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, transparent, #d4a96b, #b88646, #d4a96b, transparent)",
      }} />
      <div className="text-[10px] tracking-[0.45em] mb-3 mt-1" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
        DESTINY · 운명의 짝꿍
      </div>
      <div className="text-[14px] mb-2" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
        {name}님의 운명 짝꿍은
      </div>
      <div className="text-[56px] font-black leading-none mb-3"
        style={{
          color: destiny.color,
          fontFamily: "'Nanum Myeongjo', serif",
          letterSpacing: "0.05em",
          textShadow: `0 4px 16px ${destiny.color}33`,
        }}>
        {destiny.name}
      </div>
      <div className="text-[13px] mb-3" style={{ color: INK, fontFamily: "'Gowun Batang', serif", fontWeight: 600 }}>
        {destiny.innerImage}
      </div>
    </div>
  );
}

// 4장 — 갈등 패턴 chip 카드 (결정론 태그)
// 반복 패턴 — 무한대 ∞ 루프 시각화
// 패턴이 두 루프 위에 박혀 "돌고 도는 반복"을 직관적으로 보여줌.
// 패턴 1개: 한 루프 중앙 / 2개: 좌·우 루프 / 3개+: 두 루프 + 교차점
function PatternTagsCard({ tags }: { tags: string[] }) {
  const W = 400, H = 200;
  const cx = W / 2, cy = H / 2;
  const loopRx = 70, loopRy = 50;
  // 두 루프: 왼쪽 (cx - loopRx, cy), 오른쪽 (cx + loopRx, cy)
  // 무한대 path — 두 타원이 중앙 교차
  const infinityPath =
    `M ${cx - loopRx * 2} ${cy} ` +
    `C ${cx - loopRx * 2} ${cy - loopRy * 1.4}, ${cx - loopRx * 0.2} ${cy - loopRy * 1.4}, ${cx} ${cy} ` +
    `C ${cx + loopRx * 0.2} ${cy + loopRy * 1.4}, ${cx + loopRx * 2} ${cy + loopRy * 1.4}, ${cx + loopRx * 2} ${cy} ` +
    `C ${cx + loopRx * 2} ${cy - loopRy * 1.4}, ${cx + loopRx * 0.2} ${cy - loopRy * 1.4}, ${cx} ${cy} ` +
    `C ${cx - loopRx * 0.2} ${cy + loopRy * 1.4}, ${cx - loopRx * 2} ${cy + loopRy * 1.4}, ${cx - loopRx * 2} ${cy} Z`;

  // 패턴 위치 — 두 루프 위 / 중앙 교차점 사용
  const positions = (() => {
    const n = tags.length;
    if (n === 0) return [];
    if (n === 1) return [{ x: cx, y: cy }];
    if (n === 2) return [{ x: cx - loopRx * 1.3, y: cy }, { x: cx + loopRx * 1.3, y: cy }];
    if (n === 3) return [{ x: cx - loopRx * 1.3, y: cy }, { x: cx, y: cy }, { x: cx + loopRx * 1.3, y: cy }];
    // 4개+ 분산
    return tags.map((_, i) => {
      const angle = (i / n) * Math.PI * 2;
      const isLeft = i % 2 === 0;
      const baseX = isLeft ? cx - loopRx : cx + loopRx;
      return {
        x: baseX + Math.cos(angle) * loopRx * 0.6,
        y: cy + Math.sin(angle) * loopRy * 0.6,
      };
    });
  })();

  return (
    <div className="rounded-md p-4"
      style={{ background: "#ffffff", border: "1px solid rgba(200,32,58,0.25)" }}>
      <div className="text-[13px] mb-1 text-center font-bold"
        style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}>
        반복되는 패턴 결
      </div>
      <div className="text-[10px] mb-3 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        ∞ 돌고 돌아 다시 만나는 자리
      </div>

      <div className="relative mx-auto" style={{ width: "100%", maxWidth: 400 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
          <defs>
            <linearGradient id="infinity-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={THREAD} stopOpacity="0.55" />
              <stop offset="50%" stopColor={GOLD} stopOpacity="0.75" />
              <stop offset="100%" stopColor={THREAD} stopOpacity="0.55" />
            </linearGradient>
            <filter id="pattern-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>

          {/* 무한대 ∞ 곡선 */}
          <path d={infinityPath} fill="none" stroke="url(#infinity-grad)" strokeWidth="2.2" strokeLinecap="round" />
          {/* 미세한 반복 흐름 점선 — 외곽 */}
          <path d={infinityPath} fill="none" stroke={THREAD} strokeWidth="1" strokeDasharray="2 5" opacity="0.3" />

          {/* 패턴 마커 */}
          {positions.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="10" fill={THREAD} opacity="0.18" filter="url(#pattern-glow)" />
              <circle cx={p.x} cy={p.y} r="6" fill={THREAD} stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}
        </svg>

        {/* 패턴 라벨 — SVG 아래 또는 점 옆에 absolute */}
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {tags.map((t) => (
            <span key={t} className="text-[12px] px-3 py-1 rounded-full"
              style={{
                background: `${THREAD}12`,
                border: `1px solid ${THREAD}66`,
                color: PLUM,
                fontFamily: "'Gowun Batang', serif",
                fontWeight: 600,
              }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5장 — 욕구 4분면 BiBar (Q2 욕망 표시)
// 본능 욕구 4 결 — 꽃잎 4장 시각화
// 4 욕구 = 한 꽃의 4잎. 본인 선택 잎만 진하게 핀 모양 + 다른 3잎은 봉우리.
function DesireBar({ desire }: { desire: LoveDesire }) {
  const items: { label: string; key: LoveDesire; color: string; angle: number }[] = [
    { label: "단단한 사랑", key: "stable", color: "#7eb6ff", angle: -90 },     // 위
    { label: "짜릿한 사랑", key: "intense", color: "#c8203a", angle: 0 },      // 오른쪽
    { label: "결혼 사랑", key: "marriage", color: "#b88646", angle: 90 },      // 아래
    { label: "자연스러운", key: "natural", color: "#7dd3c0", angle: 180 },     // 왼쪽
  ];
  const W = 320, H = 320;
  const cx = W / 2, cy = H / 2;
  const petalLen = 95;    // 활짝 핀 잎 길이
  const budLen = 55;      // 봉우리 길이
  const petalW = 50;      // 잎 폭

  return (
    <div className="rounded-md p-5"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(212,169,107,0.4)",
      }}>
      <div className="text-[14px] font-bold mb-1 text-center" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
        본능 욕구 — 4 가지 결
      </div>
      <div className="text-[11px] mb-3 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        본인 선택 잎이 활짝 피어 있어요
      </div>

      <div className="relative mx-auto" style={{ width: W, maxWidth: "100%" }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            {items.map((it) => (
              <radialGradient key={it.key} id={`petal-${it.key}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={it.color} stopOpacity="0.7" />
                <stop offset="100%" stopColor={it.color} stopOpacity="0.25" />
              </radialGradient>
            ))}
          </defs>

          {/* 4 꽃잎 */}
          {items.map((it) => {
            const isActive = it.key === desire;
            const len = isActive ? petalLen : budLen;
            const w = isActive ? petalW : petalW * 0.55;
            // 잎 path — 중심에서 시작해 끝까지 (대칭 곡선)
            const petalPath = `M 0 0 Q ${w / 2} ${-len * 0.45} 0 ${-len} Q ${-w / 2} ${-len * 0.45} 0 0 Z`;
            return (
              <g key={it.key} transform={`translate(${cx} ${cy}) rotate(${it.angle + 90})`}>
                <path d={petalPath}
                  fill={`url(#petal-${it.key})`}
                  stroke={it.color}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isActive ? 1 : 0.55}
                />
              </g>
            );
          })}

          {/* 중심 원 (꽃술) */}
          <circle cx={cx} cy={cy} r="14" fill={GOLD} opacity="0.9" />
          <circle cx={cx} cy={cy} r="9" fill="#fff" />
          <circle cx={cx} cy={cy} r="4" fill={GOLD} />

          {/* 라벨 — 4 방위 */}
          {items.map((it) => {
            const isActive = it.key === desire;
            // 라벨 위치 = 잎 끝 약간 바깥
            const labelDist = (isActive ? petalLen : budLen) + 18;
            const rad = (it.angle * Math.PI) / 180;
            const lx = cx + Math.cos(rad) * labelDist;
            const ly = cy + Math.sin(rad) * labelDist;
            return (
              <text key={`label-${it.key}`}
                x={lx} y={ly + 4}
                textAnchor="middle"
                fontSize={isActive ? "13" : "11"}
                fontWeight={isActive ? 800 : 500}
                fill={isActive ? it.color : "#9b717d"}
                fontFamily="'Nanum Myeongjo', serif"
              >
                {it.label}
              </text>
            );
          })}
        </svg>

        {/* 본인 선택 단언 */}
        <div className="text-center mt-2">
          <span className="text-[12px] font-bold px-3 py-1 rounded-full"
            style={{
              background: items.find(it => it.key === desire)?.color ?? THREAD,
              color: "#fff",
              fontFamily: "'Gowun Batang', serif",
            }}>
            본인 선택 · {LOVE_DESIRE_LABEL[desire].split(" — ")[0]}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 5장 — 본인 결의 사랑 온도 (단일 큰 핑크 온도계, 사주 자동 도출)
// Q2 사용자 선택 무시 — 본인 사주에서 가장 강한 욕구 결 자동 추출.
// 차오름 비율도 그 욕구의 사주 강도로 동적.
const LOVE_THERMOMETER_INFO: Record<LoveDesire, { name: string; tone: string; tag: string; pillarHint: string }> = {
  intense:  { name: "짜릿한 사랑",     tone: "뜨겁게 끓어오르는 결",  tag: "뜨거움",       pillarHint: "화의 결과 식상이 풍부해 자극과 표현을 추구하는 흐름" },
  marriage: { name: "결혼 사랑",       tone: "단단하게 데워지는 결",  tag: "깊은 따뜻함",  pillarHint: "정관·정재가 짙어 약속과 미래를 향해 차오르는 흐름" },
  stable:   { name: "단단한 사랑",     tone: "한결같이 데워지는 결",  tag: "따뜻함",       pillarHint: "토의 결과 인성이 두터워 한결같은 안정을 추구하는 흐름" },
  natural:  { name: "자연스러운 사랑", tone: "잔잔하게 차오르는 결",  tag: "잔잔함",       pillarHint: "오행이 균형 잡혀 흐름에 맡기는 자연스러운 결" },
};

// 사주에서 4 욕구 점수 계산 → 가장 강한 욕구 도출
function deriveDominantDesire(me: PersonData): { desire: LoveDesire; fill: number } {
  const elem = me.elements as Record<string, number>;
  // 십성 카운트
  const sipFlat = [
    me.sipseong.year?.stem, me.sipseong.year?.branch,
    me.sipseong.month?.stem, me.sipseong.month?.branch,
    me.sipseong.day?.branch,
    me.sipseong.hour?.stem, me.sipseong.hour?.branch,
  ].filter((s): s is string => Boolean(s));
  const sipCount = (terms: string[]) => sipFlat.filter(s => terms.some(t => s.includes(t))).length;

  const intense  = (elem.화 ?? 0) * 1.0 + sipCount(["식신", "상관"]) * 1.2;
  const marriage = sipCount(["정관", "편관"]) * 1.5 + sipCount(["정재", "편재"]) * 1.2;
  const stable   = (elem.토 ?? 0) * 1.0 + sipCount(["정인", "편인"]) * 1.2;
  // 자연스러움 = 오행 균형도 (표준편차 낮을수록 ↑)
  const vals = [elem.목, elem.화, elem.토, elem.금, elem.수].map(v => v ?? 0);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / vals.length;
  const natural  = Math.max(0, 8 - variance);

  const scores: Array<[LoveDesire, number]> = [
    ["intense", intense],
    ["marriage", marriage],
    ["stable", stable],
    ["natural", natural],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const [topDesire, topScore] = scores[0];
  // fill 비율 — top score를 (다른 욕구 평균 + top) 대비 표시 (40~100 범위)
  const otherAvg = (scores[1][1] + scores[2][1] + scores[3][1]) / 3;
  const ratio = topScore / Math.max(1, topScore + otherAvg);
  const fill = Math.max(45, Math.min(100, Math.round(ratio * 130)));
  return { desire: topDesire, fill };
}

function LoveThermometer({ me, name }: { me: PersonData; name: string }) {
  const { desire, fill } = deriveDominantDesire(me);
  const meta = LOVE_THERMOMETER_INFO[desire];
  // 핑크 톤 (홍실 컬러) — 사용자 요청
  const PINK = "#e64a7c";
  const PINK_DEEP = "#c8203a";
  const info = { ...meta, fill, color: PINK };
  // SVG 온도계 — 튜브 + 구체
  const W = 280, H = 360;
  const tubeX = 110, tubeW = 36, tubeYTop = 30, tubeYBottom = 270;
  const bulbCx = tubeX + tubeW / 2, bulbCy = 308, bulbR = 32;
  const fillHeight = (tubeYBottom - tubeYTop - 6) * (info.fill / 100);
  const fillY = tubeYBottom - 3 - fillHeight;
  // 눈금
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const y = tubeYTop + 8 + ((tubeYBottom - tubeYTop - 16) * i) / (tickCount - 1);
    const isMajor = i === 0 || i === tickCount - 1 || i === Math.floor(tickCount / 2);
    return { y, isMajor };
  });

  return (
    <div className="rounded-md p-5"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(212,169,107,0.4)",
      }}>
      <div className="text-[14px] font-bold mb-1 text-center" style={{ color: PINK_DEEP, fontFamily: "'Nanum Myeongjo', serif" }}>
        본인 결의 사랑 온도
      </div>
      <div className="text-[11px] mb-3 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        {name}님 사주에서 가장 짙게 차오르는 사랑의 결
      </div>

      <div className="flex items-stretch gap-5 mx-auto" style={{ maxWidth: 520 }}>
        {/* 온도계 SVG */}
        <div style={{ flex: "0 0 auto" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 160, height: "auto" }}>
            <defs>
              <linearGradient id="therm-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={info.color} stopOpacity="0.95" />
                <stop offset="100%" stopColor={info.color} stopOpacity="1" />
              </linearGradient>
              <filter id="therm-shine" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" />
              </filter>
            </defs>

            {/* 튜브 외곽 */}
            <rect x={tubeX} y={tubeYTop} width={tubeW} height={tubeYBottom - tubeYTop + 20}
              rx={tubeW / 2}
              fill="rgba(255,255,255,0.9)"
              stroke="rgba(126,55,59,0.4)" strokeWidth="2" />

            {/* 차오름 (튜브 내부) */}
            <rect x={tubeX + 5} y={fillY} width={tubeW - 10} height={tubeYBottom - 3 - fillY}
              rx={(tubeW - 10) / 2}
              fill="url(#therm-fill)" />

            {/* 구체 (밑부분) */}
            <circle cx={bulbCx} cy={bulbCy} r={bulbR + 2}
              fill="rgba(255,255,255,0.9)"
              stroke="rgba(126,55,59,0.4)" strokeWidth="2" />
            <circle cx={bulbCx} cy={bulbCy} r={bulbR}
              fill="url(#therm-fill)" />

            {/* 구체 광택 */}
            <ellipse cx={bulbCx - 10} cy={bulbCy - 10} rx="9" ry="6"
              fill="rgba(255,255,255,0.45)" filter="url(#therm-shine)" />

            {/* 눈금 */}
            {ticks.map((t, i) => (
              <line key={i}
                x1={tubeX - (t.isMajor ? 10 : 6)} y1={t.y}
                x2={tubeX - 2} y2={t.y}
                stroke="rgba(126,55,59,0.55)" strokeWidth={t.isMajor ? 1.5 : 1} />
            ))}

            {/* °C 라벨 */}
            <text x={tubeX + tubeW + 6} y={tubeYTop + 14}
              fontSize="16" fontWeight="700"
              fill={INK_SOFT} fontFamily="'Cormorant Garamond', serif">
              °C
            </text>
          </svg>
        </div>

        {/* 본인 결 정보 */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-[11px] mb-1" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif", letterSpacing: "0.1em" }}>
            사주가 가리키는 결
          </div>
          <div className="text-[19px] font-black mb-2" style={{ color: PINK_DEEP, fontFamily: "'Nanum Myeongjo', serif" }}>
            {info.name}
          </div>
          <div className="inline-block w-fit px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-3"
            style={{ background: PINK_DEEP, color: "#fff" }}>
            {info.tag} · {info.fill}°
          </div>
          <div className="text-[12.5px] leading-[1.6] mb-2" style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
            {info.tone}
          </div>
          <div className="text-[11.5px] leading-[1.55]" style={{ color: "#7a5a64", fontFamily: "'Gowun Batang', serif" }}>
            사주가 보여주는 까닭: {info.pillarHint}.
          </div>
        </div>
      </div>

      {/* 4 욕구 라벨 — 참조용. 본인 결만 강조 */}
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {(Object.entries(LOVE_THERMOMETER_INFO) as [LoveDesire, { name: string; tone: string; tag: string; pillarHint: string }][]).map(([key, val]) => {
          const isMine = key === desire;
          return (
            <span key={key}
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={{
                background: isMine ? `${PINK_DEEP}18` : "transparent",
                border: `1px solid ${isMine ? PINK_DEEP : "rgba(126,55,59,0.2)"}`,
                color: isMine ? PINK_DEEP : "#9b717d",
                fontWeight: isMine ? 700 : 500,
                fontFamily: "'Gowun Batang', serif",
              }}>
              {val.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// 6장 — 편지 마무리 캡처 카드
function LetterQuoteCard({ name, meChar, destinyChar, meColor, destinyColor }: {
  name: string;
  meChar: string;
  destinyChar: string;
  meColor: string;
  destinyColor: string;
}) {
  return (
    <div className="my-6 rounded-md overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(255,225,234,0.95) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 100%, rgba(255,240,214,0.95) 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 50%, #fce4d6 100%)
        `,
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 16px 40px -16px rgba(178,40,71,0.18)",
      }}>
      <div className="px-6 pt-7 text-center">
        <div className="text-[10px] tracking-[0.45em] mb-2 font-bold"
          style={{ color: GOLD, fontFamily: "'Nanum Myeongjo', serif" }}>
          紅 絲 · MY HONGSIL
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 py-5">
        <div className="text-center">
          <div className="text-[10px]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            {name}님
          </div>
          <div className="text-[28px] font-black leading-none mt-1" style={{ color: meColor, fontFamily: "'Nanum Myeongjo', serif" }}>
            {meChar}
          </div>
        </div>
        <div className="text-[18px]" style={{ color: THREAD, letterSpacing: "0.3em" }}>
          ✦
        </div>
        <div className="text-center">
          <div className="text-[10px]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            짝꿍
          </div>
          <div className="text-[28px] font-black leading-none mt-1" style={{ color: destinyColor, fontFamily: "'Nanum Myeongjo', serif" }}>
            {destinyChar}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 text-center">
        <div className="text-[14px] leading-[1.9]" style={{ color: INK, fontFamily: "'Gowun Batang', serif", fontWeight: 500 }}>
          &quot;운명의 두 사람은 보이지 않는 붉은 실로 묶여 있어요.<br />
          시간이 흘러도, 거리가 멀어도, 그 매듭은 끊어지지 않아요.&quot;
        </div>
      </div>
      <div className="px-6 py-4 text-center" style={{ borderTop: "1px solid rgba(212,169,107,0.3)" }}>
        <div className="text-[12px] font-bold" style={{ color: THREAD, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.1em" }}>
          &nbsp;
        </div>
      </div>
    </div>
  );
}

function HongsilResultInner() {
  const sp = useSearchParams();
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const TOTAL = 6;

  const meName = sp.get("meName") || "본인";
  const meBirth = `${sp.get("meYear")}년 ${sp.get("meMonth")}월 ${sp.get("meDay")}일`;
  const duration = (sp.get("duration") || "1y_to_3y") as SoloDuration;
  const desire = (sp.get("desire") || "stable") as LoveDesire;
  const style = (sp.get("style") || "balance") as LoveStyle;

  const [data, setData] = useState<ComputeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<Record<number, string>>({});
  const [openingDone, setOpeningDone] = useState(false);
  // ⭐ LLM 진행률 — 챕터 완료(cd 이벤트) 카운트. 영상 짧아도 50%까진 대기.
  const [chaptersDone, setChaptersDone] = useState(0);
  const HALF_CHAPTERS = 3; // 전체 6챕터 중 절반

  // ─── 결제 게이트 ─── 결제 완료(unlocked=1) 전엔 PaymentModal만 노출 ───
  const unlocked = sp.get("unlocked") === "1";
  const [paying, setPaying] = useState(false);

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
        orderName: "연애 사주 풀이",
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
    if (!unlocked) return; // 결제 전엔 사주 계산 안 함
    const meYear = parseInt(sp.get("meYear") || "0", 10);
    const meMonth = parseInt(sp.get("meMonth") || "0", 10);
    const meDay = parseInt(sp.get("meDay") || "0", 10);
    if (!meYear) return;
    fetch("/api/hongsil-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        me: {
          name: meName,
          year: meYear, month: meMonth, day: meDay,
          hour: sp.get("meHour") || "모름",
          isLunar: (sp.get("meCalendar") || "양력") === "음력",
          gender: sp.get("meGender") || "여",
        },
      }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [sp, meName, unlocked]);

  useEffect(() => {
    if (!data) return;
    const reqBody = {
      me: {
        name: meName,
        year: sp.get("meYear"), month: sp.get("meMonth"), day: sp.get("meDay"),
        hour: sp.get("meHour") || "모름",
        calendar: (sp.get("meCalendar") || "양력") as "양력" | "음력",
        gender: (sp.get("meGender") || "여") as "남" | "여",
      },
      choice: { duration, desire, style },
    };
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/hongsil-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
          signal: ac.signal,
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw) as { t: string; ch?: number; v?: string };
              if (evt.t === "x" && evt.ch && evt.v) {
                setAiText((prev) => ({ ...prev, [evt.ch!]: (prev[evt.ch!] ?? "") + evt.v }));
              } else if (evt.t === "cd") {
                setChaptersDone((n) => n + 1); // 챕터 완료
              }
            } catch {}
          }
        }
      } catch {}
    })();
    return () => ac.abort();
  }, [data, sp, meName, duration, desire, style]);

  const aiBodies = (() => {
    const out: Record<number, Record<string, string>> = {};
    for (const [chStr, md] of Object.entries(aiText)) {
      const ch = parseInt(chStr, 10);
      const lines = md.split("\n");
      const map: Record<string, string> = {};
      let cur: string | null = null;
      let buf: string[] = [];
      const flush = () => { if (cur) map[cur] = buf.join("\n").trim(); };
      for (const ln of lines) {
        if (ln.startsWith("### ")) {
          flush();
          cur = ln.slice(4).trim();
          buf = [];
        } else if (cur) buf.push(ln);
      }
      flush();
      out[ch] = map;
    }
    return out;
  })();

  const bodyOf = (ch: number, title: string, fb: string): string =>
    aiBodies[ch]?.[title] || fb;

  const ChSub = ({ ch, title, fallback }: { ch: number; title: string; fallback: string }) => (
    <SubSection title={title} body={bodyOf(ch, title, fallback)} />
  );

  if (error) {
    return <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fff7f9" }}>
      <div className="text-sm text-center" style={{ color: PLUM }}>
        사주 계산 중 문제가 생겼어요.<br />
        <span className="text-xs opacity-60">{error}</span>
      </div>
    </div>;
  }
  // ─── 결제 게이트 — 결제 완료(unlocked=1) 전엔 PaymentModal만 ───
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fff7f9" }}>
        <PaymentModal
          open={true}
          onClose={() => { window.location.href = "/hongsil/form"; }}
          price={HONGSIL_PRICE}
          goodsName="연애 사주 풀이"
          onSubmit={handlePayment}
          onFreeUnlock={handleFreeUnlock}
        />
      </div>
    );
  }

  if (!data || !openingDone) {
    return <OpeningVideo
      dataReady={!!data && chaptersDone >= HALF_CHAPTERS}
      loadProgress={chaptersDone / HALF_CHAPTERS}
      onComplete={() => setOpeningDone(true)}
      loadingMessage={`${meName}님의 사주를 펼치는 중…`}
      src="/opening-hongsil.mp4"
    />;
  }

  const me = data.me;
  const toPillar = (p: { stem: string; branch: string } | null, sip: { stem: string; branch: string } | null) =>
    p && sip ? { stem: p.stem, branch: p.branch, stemSipseong: sip.stem, branchSipseong: sip.branch } : null;
  const pillars = {
    year: toPillar(me.pillars.year, me.sipseong.year)!,
    month: toPillar(me.pillars.month, me.sipseong.month)!,
    day: { stem: me.pillars.day.stem, branch: me.pillars.day.branch, stemSipseong: "일간", branchSipseong: me.sipseong.day.branch },
    hour: toPillar(me.pillars.hour, me.sipseong.hour),
  };
  const elem = me.elements;
  const total = elem.목 + elem.화 + elem.토 + elem.금 + elem.수;
  const ratios = {
    목: total ? (elem.목 / total) * 100 : 0,
    화: total ? (elem.화 / total) * 100 : 0,
    토: total ? (elem.토 / total) * 100 : 0,
    금: total ? (elem.금 / total) * 100 : 0,
    수: total ? (elem.수 / total) * 100 : 0,
  };
  const jj = JIJANGGAN_MAP[me.pillars.day.branch] || [];
  const sipHour = pillars.hour ?? pillars.day;
  const ilganLabel = STEM_ELEMENT_LABEL[me.ilgan] ?? me.ilgan;
  const ilganHanja = STEM_HANJA_LOCAL[me.ilgan] ?? me.ilgan;
  const ilganEasy = STEM_EASY[me.ilgan] ?? "고유한 기운";

  return (
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? "내 매력"
        : chapter === 2 ? "사랑 타이밍"
        : chapter === 3 ? "내 짝꿍"
        : chapter === 4 ? "반복 패턴"
        : chapter === 5 ? "사랑 온도"
        : "홍도인 편지"
      }
      totalChapters={TOTAL}
      chapters={[
        { no: 1, label: "내 매력" },
        { no: 2, label: "사랑 타이밍" },
        { no: 3, label: "내 짝꿍" },
        { no: 4, label: "반복 패턴" },
        { no: 5, label: "사랑 온도" },
        { no: 6, label: "홍도인 편지" },
      ]}
      onPrev={chapter > 1 ? () => setChapter((chapter - 1) as 1 | 2 | 3 | 4 | 5 | 6) : undefined}
      onNext={chapter < TOTAL ? () => setChapter((chapter + 1) as 1 | 2 | 3 | 4 | 5 | 6) : undefined}
      onSelect={(no) => setChapter(no as 1 | 2 | 3 | 4 | 5 | 6)}
      backHref="/hongsil/form"
    >
      <div className="rounded-md px-4 py-3 mb-4 text-[12px]"
        style={{ background: "#ffffff", border: "1px dashed rgba(200,32,58,0.4)", color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
        ▸ 솔로 기간: {SOLO_DURATION_LABEL[duration]}<br />
        ▸ 원하는 사랑: {LOVE_DESIRE_LABEL[desire]}<br />
        ▸ 사랑 스타일: {LOVE_STYLE_LABEL[style]}
      </div>

      {chapter === 1 && (
        <>
          <div className="mb-8">
            <EducationPage title="사주 펼치기" subtitle="네 기둥, 여덟 글자">
              <BodyCopy>
                사주(四柱)는 <WordMark>네 개의 기둥</WordMark>, 팔자(八字)란 <WordMark>여덟 글자</WordMark>를 뜻해요.
              </BodyCopy>
              <BodyCopy>
                그 중에서도 가장 중요한 가운데 기둥이 <WordMark>일주(日柱)</WordMark> —
                {" "}{meName}님이라는 사람의 본질이 담긴 자리이지요.
                그 양옆의 년주·월주·시주는 본질을 둘러싼 환경의 결을 보여주는 자리예요.
              </BodyCopy>
              <FourPillarsDiagram pillars={me.pillars} accent="gold" />
            </EducationPage>

            {(() => {
              const ilganChar = me.pillars.day.stem;
              const deep = STEM_DEEP[ilganChar] ?? { fullName: ilganChar, hanja: ilganChar, headline: "고유한 결", nature: "고유한 기운", essence: "고유한 결" };
              return (
                <EducationPage title="일주" subtitle="사주의 중심, 본인의 본질">
                  <BodyCopy>
                    일주란 태어난 날을 뜻해요.
                    {" "}{meName}님의 본질은 일간 <WordMark>{deep.fullName}({deep.hanja})</WordMark>에 담겨 있어요.
                  </BodyCopy>
                  <BodyCopy>
                    {deep.fullName}은 천간 열 글자 중에서도 {deep.headline} — {deep.nature}이지요.
                    {" "}{deep.essence}이 {meName}님의 본 모습이에요.
                  </BodyCopy>
                  <HeavenlyStemTable highlightStem={ilganChar} accent="gold" />
                </EducationPage>
              );
            })()}

            {/* sub 4 — 배우자 자리 (구 "지지" + "연애의 열쇠 일주" 통합 / 본인 일지 골드 강조) */}
            {(() => {
              const iljiChar = me.pillars.day.branch;
              const branchInfo = BRANCH_DEEP[iljiChar] ?? { tone: "고유한", relation: "고유한 결" };
              return (
                <EducationPage title="배우자 자리" subtitle="내 곁에 어울리는 결">
                  <BodyCopy>
                    일주의 아랫글자, <WordMark>일지(日支)</WordMark>는 마음 안쪽 가장 깊은 자리예요.
                    옛부터 이 자리를 <WordMark>배우자궁(配偶者宮)</WordMark>이라 불렀어요.
                  </BodyCopy>
                  <BodyCopy>
                    {meName}님의 일지는 <WordMark>{hanjaForBranch(iljiChar)}({iljiChar})</WordMark> —
                    {" "}{branchInfo.tone} 결의 자리예요. {branchInfo.relation}을 본능적으로 알아보세요.
                  </BodyCopy>
                  <BranchGrid active={iljiChar} accent="gold" />
                </EducationPage>
              );
            })()}

            {/* sub 5 — 다섯 결, 오행 (본인 사주 강·약 단언) */}
            {(() => {
              const elemEntries = Object.entries(me.elements as Record<string, number>);
              const sortedDesc = [...elemEntries].sort((a, b) => b[1] - a[1]);
              const strongest = sortedDesc[0]?.[0] ?? "";
              const weakest = sortedDesc[sortedDesc.length - 1]?.[0] ?? "";
              return (
                <EducationPage title="다섯 결, 오행" subtitle="목·화·토·금·수의 분포">
                  <BodyCopy>
                    사주의 여덟 글자는 결국 <WordMark>목·화·토·금·수</WordMark> 다섯 결로 나뉘어요.
                    이 다섯 결이 어떻게 분포해 있는지가 성격과 연애 스타일의 바탕이 되지요.
                  </BodyCopy>
                  <OhaengDiagram counts={me.elements} />
                  <BodyCopy>
                    {meName}님 사주는 <WordMark>{strongest}</WordMark>의 결이 넘치고 <WordMark>{weakest}</WordMark>의 결이 옅게 자리한 분포예요.
                    이 결의 균형이 어떻게 자리하는지에 따라 본인 페이스가 결정됩니다.
                  </BodyCopy>
                </EducationPage>
              );
            })()}

            {/* sub 6 — 신강신약 (NEW) */}
            {(() => {
              const ilganChar = me.pillars.day.stem;
              const deep = STEM_DEEP[ilganChar] ?? { fullName: ilganChar, hanja: ilganChar, headline: "", nature: "", essence: "" };
              const rawShinkang = (me as unknown as { shinkang?: string }).shinkang ?? "중화";
              const bucket = bucketShinkang(rawShinkang);
              const info = SHINKANG_DEEP[bucket];
              return (
                <EducationPage title="신강신약" subtitle="본인 결의 두께">
                  <BodyCopy>
                    다섯 결의 분포를 살펴보니, {meName}님 사주는 <WordMark>{info.label}</WordMark> 사주에 가까운 결이에요.
                  </BodyCopy>
                  <BodyCopy>
                    일간 <WordMark>{deep.fullName}({deep.hanja})</WordMark>의 힘이 사주 안에서 <WordMark>{info.depth}</WordMark> 자리하고 있어,
                    {" "}{info.tone}
                  </BodyCopy>
                  <ShinkangGauge level={bucket} />
                </EducationPage>
              );
            })()}

            {/* sub 7 — 관계의 방향표 (용신·희신·기신) */}
            <EducationPage title="관계의 방향표" subtitle="용신·희신·기신">
              <BodyCopy>
                마지막으로 {meName}님 사주가 가장 편안해지는 방향을 봐요.
                <WordMark>용신</WordMark>은 본인 결을 살리는 핵심 기운, <WordMark>희신</WordMark>은 그 곁에서 받쳐주는 기운,
                <WordMark>기신</WordMark>은 과해지면 흐름을 흔드는 기운이에요.
              </BodyCopy>
              <YongsinCards yongsin={me.yongsin} huisin={huisinOf(me.yongsin)} gisin={gisinOf(me.yongsin)} />
            </EducationPage>
          </div>
          <Section title="내 매력과 연애 스타일">
            {data.character && <CharacterIntroCard name={meName} character={data.character} />}
            <ChSub ch={1} title="내 매력은?" fallback={`${meName}님의 본질적 매력을 풀어드리고 있어요.`} />
            <ChSub ch={1} title="첫인상에서 생기는 오해" fallback="처음 만난 사람이 오해하기 쉬운 인상을 풀어드리고 있어요." />
            <ChSub ch={1} title="호감이 생기면 내가 보내는 신호" fallback="호감이 생길 때 달라지는 신호를 풀어드리고 있어요." />
            <ChSub ch={1} title="사랑하면 달라지는 태도" fallback="사랑에 들어가면 달라지는 태도를 풀어드리고 있어요." />
            <ChSub ch={1} title="내가 다가가는 방식" fallback="가까워질 때 쓰는 방식과 속도를 풀어드리고 있어요." />
            <ChSub ch={1} title="끌리는 사람과 잘 맞는 사람" fallback="끌리는 사람과 잘 맞는 사람의 차이를 풀어드리고 있어요." />
          </Section>
        </>
      )}

      {chapter === 2 && (
        <Section title="사랑이 오는 타이밍">
          <ChSub ch={2} title="사랑이 들어오는 시기" fallback="사랑이 들어오는 시기와 준비감을 풀어드리고 있어요." />
          <ChSub ch={2} title="솔로 탈출 가이드" fallback="솔로에서 벗어나는 행동 가이드를 풀어드리고 있어요." />
          <ChSub ch={2} title="올해 연애에서 조심할 흐름" fallback="2026년 연애에서 조심할 흐름을 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 3 && (
        <>
          {data.character && <DestinyHeroCard destiny={data.character.destiny} name={meName} />}
          <Section title="내 짝꿍 미리 보기">
            <ChSub ch={3} title="내게 맞는 만남 방식" fallback="내게 맞는 만남 방식을 풀어드리고 있어요." />
            <ChSub ch={3} title="내 짝꿍 미리 보기" fallback={`${meName}님의 운명 짝꿍을 12 캐릭터 중에서 풀어드리고 있어요.`} />
            <ChSub ch={3} title="좋은 사람을 알아보는 신호" fallback="좋은 사람을 알아보는 생활 신호를 풀어드리고 있어요." />
            <ChSub ch={3} title="그 사람과 가까워지는 한 수" fallback="가까워지는 행동 가이드를 풀어드리고 있어요." />
            <ChSub ch={3} title="결혼까지 이어지는 관계의 조건" fallback="결혼까지 이어지는 관계 조건을 풀어드리고 있어요." />
          </Section>
        </>
      )}

      {chapter === 4 && (
        <Section title="내 사랑 흑역사 — 반복되는 그 패턴">
          <ChSub ch={4} title="자꾸 끌리는 위험한 유형" fallback="자꾸 끌리는 위험한 유형을 진단하고 있어요." />
          {duration === "never" ? (
            <ChSub ch={4} title="첫 연애에서 조심할 신호" fallback="첫 연애에서 조심할 신호를 풀어드리고 있어요." />
          ) : (
            <ChSub ch={4} title="반복되는 연애 패턴" fallback="반복되는 연애 패턴을 분석하고 있어요." />
          )}
          <ChSub ch={4} title="그 패턴에서 벗어나는 방법" fallback="반복을 끊는 행동을 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 5 && (
        <Section title="끌림과 사랑의 온도">
          <LoveThermometer me={me} name={meName} />
          <ChSub ch={5} title="나도 모르게 풍기는 매력" fallback={`${meName}님의 자연스러운 매력을 풀어드리고 있어요.`} />
          <ChSub ch={5} title="내가 원하는 사랑의 온도" fallback="내가 원하는 사랑의 온도를 풀어드리고 있어요." />
          <ChSub ch={5} title="둘 사이가 깊어지는 순간" fallback="둘 사이가 깊어지는 순간을 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 6 && (
        <>
          <Section title="홍도인의 마지막 편지">
            <ChSub ch={6} title="마지막 편지" fallback="편지를 정리하고 있어요…" />
          </Section>
          {data.character && (
            <LetterQuoteCard
              name={meName}
              meChar={data.character.me.name}
              destinyChar={data.character.destiny.name}
              meColor={data.character.me.color}
              destinyColor={data.character.destiny.color}
            />
          )}
          <div className="rounded-md px-5 py-4 text-[13px] leading-[1.85] mt-4"
            style={{ background: "#ffffff", border: "1px dashed rgba(200,32,58,0.45)", color: INK, fontFamily: "'Gowun Batang', serif" }}>
            <strong style={{ color: THREAD }}>마지막까지 함께해 주세요</strong> 🙏<br />
            사주는 단지 방향을 알려주는 나침반이에요. 결국 인연은 본인이 만들어가는 결이에요.
          </div>
        </>
      )}
      <div className="text-center mt-6 text-[10px] tracking-[0.05em] leading-[1.6]"
        style={{ color: `${INK_SOFT}88`, fontFamily: "'Cormorant Garamond', 'Gowun Batang', serif" }}>
        본 풀이는 청나라 자평명리 <strong style={{ color: GOLD }}>자평진전(子平眞詮)</strong>·적천수(滴天髓)·명리정종(命理正宗) 정통 framework 기준입니다.
        <br />격국·공망·십이운성·신살×십성 결합·천간 합화 결정론 적용.
      </div>
    </ChapterShell>
  );
}

export default function HongsilResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fff7f9" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${THREAD}33`, borderTopColor: THREAD }} />
      </div>
    }>
      <HongsilResultInner />
    </Suspense>
  );
}
