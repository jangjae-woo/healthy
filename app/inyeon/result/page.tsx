"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChapterShell from "@/components/inyeon/ChapterShell";
import SajuTable from "@/components/inyeon/SajuTable";
import OhaengChart from "@/components/inyeon/OhaengChart";
import YongsinCards from "@/components/inyeon/YongsinCards";
import SinKangBar from "@/components/inyeon/SinKangBar";
import ScoreGauge from "@/components/inyeon/ScoreGauge";
import SeasonGrid from "@/components/inyeon/SeasonGrid";
import SipseongRow from "@/components/inyeon/SipseongRow";
import AssetCurve from "@/components/inyeon/AssetCurve";
import {
  RELATIONSHIP_LABEL, DURATION_LABEL,
  RelationshipKind, MeetDuration,
} from "@/lib/inyeon/types";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

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
}
interface CharacterMatchData {
  name: string;
  innerImage: string;
  signal: string;
  color: string;
  enLabel: string;
}
interface InyeonComputeData {
  a: PersonData;
  b: PersonData;
  character?: {
    a: CharacterMatchData;
    b: CharacterMatchData;
    pair: { label: string; tone: string } | null;
  };
  compat: {
    score: number; scoreLabel: string;
    ilganRelation: string; ilganDetail: string;
    sharedSinsal: string[];
    strengths: string[]; weaknesses: string[];
  };
  scores: {
    inyeon: number; seonggyeok: number; emotion: number;
    physical: number; finance: number; marriage: number;
    labels: Record<"inyeon" | "seonggyeok" | "emotion" | "physical" | "finance" | "marriage", string>;
  };
  curves: {
    a: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    b: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
    together: { phase: "초년기" | "청년기" | "중년기" | "말년기"; value: number }[];
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-base font-bold mb-3 pl-3"
        style={{
          color: "#fef3c7",
          fontFamily: "'Noto Serif KR', serif",
          borderLeft: `3px solid ${ACCENT}`,
        }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function SubSection({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(240,168,184,0.04)",
        border: `1px solid ${ACCENT}22`,
      }}
    >
      <div
        className="text-sm font-bold mb-2"
        style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </div>
      <div className="text-[13px] leading-7" style={{ color: "#d6cdb8" }}>
        {body}
      </div>
    </div>
  );
}

// 캐릭터 스타일 — 2~3줄 풀 설명 (성격 카드용)
const CHARACTER_DETAIL: Record<string, string> = {
  옥순: "솔직하고 직진하는 결의 사람이에요. 마음에 들면 망설임이 없고, 표현이 풍부해서 함께 있을 때 분위기가 환해져요. 자기 결이 분명해 한 번 정한 마음은 잘 흔들리지 않아요.",
  현숙: "쿨하고 시크한 도시적 매력이 있는 사람이에요. 겉은 차분해 보이지만 속은 단단하고, 자기 기준이 분명해요. 가까워질수록 그 안의 다정함이 보이는 결이에요.",
  정숙: "성숙하고 강단 있는 결의 사람이에요. 흔들림 없이 자기 길을 가는 차분함이 매력이에요. 가벼운 만남보다는 깊고 안정된 관계를 자연스럽게 만들어가는 결이에요.",
  순자: "발랄하고 애교 있는 감수성의 사람이에요. 표현이 풍부하고 활기찬 매력이 있어요. 함께 있으면 일상이 즐거워지는 결이에요.",
  영숙: "참하고 다정한 결의 사람이에요. 상대를 자연스럽게 챙기고 분위기를 부드럽게 만드는 매력이 있어요. 따뜻하고 받아주는 결이에요.",
  영자: "무난하고 따스한 일상의 결을 가진 사람이에요. 균형 잡힌 사주로 어떤 자리에서도 편안한 매력이 있어요. 평범함 속의 깊이가 매력 포인트예요.",
  영철: "자연스러운 자신감과 매력이 있는 사람이에요. 솔직하고 활기차며, 표현에 거침이 없어요. 함께 있으면 분위기가 환해지는 결이에요.",
  영호: "포용력 있고 외향적인 인싸형이에요. 사람을 자연스럽게 끌어당기는 사교 매력이 있고, 모임 안에서 가장 빛나는 결이에요. 점잖은 면도 함께 가지고 있어요.",
  광수: "이지적이고 진중한 깊이의 사람이에요. 신중하게 마음을 여는 결이라 처음엔 조용해 보이지만, 가까워질수록 그 안의 깊이가 매력으로 다가와요.",
  영수: "중후하고 든든한 결의 사람이에요. 흔들림 없는 안정감이 매력이에요. 함께 있으면 마음이 편해지고, 오래 기댈 수 있는 결이에요.",
  상철: "편안하고 부담 없는 균형의 결을 가진 사람이에요. 어떤 자리에서도 자연스럽게 어우러지는 매력이 있어요. 일상을 함께 가꾸기 좋은 결이에요.",
};

function CharacterIntroCard({
  aName, bName, character,
}: {
  aName: string;
  bName: string;
  character: NonNullable<InyeonComputeData["character"]>;
}) {
  const { a, b, pair } = character;
  const aDetail = CHARACTER_DETAIL[a.name] ?? a.innerImage;
  const bDetail = CHARACTER_DETAIL[b.name] ?? b.innerImage;
  return (
    <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: `1px solid ${ACCENT}33` }}>
      {/* 짝꿍 라벨 헤드 */}
      {pair && (
        <div className="px-5 py-5 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}1a, ${ACCENT}05)`, borderBottom: `1px solid ${ACCENT}22` }}>
          <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: ACCENT }}>두 분의 인연</div>
          <h3 className="text-lg font-bold leading-tight" style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}>
            "{pair.label}"
          </h3>
          {pair.tone && (
            <div className="text-[11px] mt-2 leading-relaxed" style={{ color: "#d6cdb8" }}>{pair.tone}</div>
          )}
        </div>
      )}
      {/* 캐릭터 카드 — 세로 스택 (모바일 가독성) */}
      <div className="p-4 space-y-3">
        {/* A 카드 */}
        <div className="rounded-xl p-4" style={{ background: `${a.color}0d`, border: `1px solid ${a.color}44` }}>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-base font-bold" style={{ color: "#fef3c7" }}>{aName}님은</span>
            <span className="text-xl font-black" style={{ color: a.color }}>{a.name}</span>
            <span className="text-[12px]" style={{ color: "#d6cdb8" }}>스타일</span>
          </div>
          <div className="text-[12px] leading-6" style={{ color: "#d6cdb8" }}>{aDetail}</div>
        </div>
        {/* B 카드 */}
        <div className="rounded-xl p-4" style={{ background: `${b.color}0d`, border: `1px solid ${b.color}44` }}>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-base font-bold" style={{ color: "#fef3c7" }}>{bName}님은</span>
            <span className="text-xl font-black" style={{ color: b.color }}>{b.name}</span>
            <span className="text-[12px]" style={{ color: "#d6cdb8" }}>스타일</span>
          </div>
          <div className="text-[12px] leading-6" style={{ color: "#d6cdb8" }}>{bDetail}</div>
        </div>
      </div>
    </div>
  );
}

function NoticeBubble({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl px-5 py-3 text-[12px] leading-6 mb-4"
      style={{
        background: `${ACCENT}11`,
        border: `1px dashed ${ACCENT}55`,
        color: "#d6cdb8",
      }}
    >
      {children}
    </div>
  );
}

function InyeonResultInner() {
  const sp = useSearchParams();
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const TOTAL = 8;

  const aName = sp.get("aName") || "A";
  const bName = sp.get("bName") || "B";
  const aBirth = `${sp.get("aYear")}년 ${sp.get("aMonth")}월 ${sp.get("aDay")}일`;
  const bBirth = `${sp.get("bYear")}년 ${sp.get("bMonth")}월 ${sp.get("bDay")}일`;
  const rel = (sp.get("relationship") || "talking") as RelationshipKind;
  const dur = (sp.get("duration") || "1to3m") as MeetDuration;

  const relLabel = RELATIONSHIP_LABEL[rel];
  const durLabel = DURATION_LABEL[dur];

  const [data, setData] = useState<InyeonComputeData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<Record<number, string>>({});

  // 스트리밍 마크다운 → ### 소제목별 본문 맵
  const aiBodies = (() => {
    const out: Record<number, Record<string, string>> = {};
    for (const [chStr, md] of Object.entries(aiText)) {
      const ch = Number(chStr);
      const map: Record<string, string> = {};
      // ### Title\n...body... 형식 파싱. 다음 ### 또는 ## 까지 (스트리밍 중 미완 마지막 섹션도 캡처되도록 sentinel 추가).
      const sentineled = md + "\n## __END__\n";
      const re = /^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s|^##\s)/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(sentineled)) !== null) {
        const title = m[1].trim();
        const body = m[2].trim();
        if (title && body) map[title] = body;
      }
      out[ch] = map;
    }
    return out;
  })();
  const bodyOf = (ch: number, title: string, fallback: string): string =>
    aiBodies[ch]?.[title] || fallback;

  // AI 풀이가 들어오면 자동 교체. 일치하는 ### 소제목이 없으면 fallback 그대로.
  // 사용법: <ChSub ch={2} title="우리는 인연일까, 악연일까?" fallback="..." />
  const ChSub = ({ ch, title, fallback }: { ch: number; title: string; fallback: string }) => (
    <SubSection title={title} body={bodyOf(ch, title, fallback)} />
  );

  // AI 풀이 스트림 — compute 끝난 뒤 1회 호출
  useEffect(() => {
    if (!data) return;
    const aYear = parseInt(sp.get("aYear") || "0", 10);
    const aMonth = parseInt(sp.get("aMonth") || "0", 10);
    const aDay = parseInt(sp.get("aDay") || "0", 10);
    const bYear = parseInt(sp.get("bYear") || "0", 10);
    const bMonth = parseInt(sp.get("bMonth") || "0", 10);
    const bDay = parseInt(sp.get("bDay") || "0", 10);
    if (!aYear || !bYear) return;
    const reqBody = {
      a: { name: aName, year: String(aYear), month: String(aMonth), day: String(aDay),
        hour: sp.get("aHour") || "모름",
        calendar: (sp.get("aCalendar") || "양력") as "양력" | "음력",
        gender: (sp.get("aGender") || "여") as "남" | "여" },
      b: { name: bName, year: String(bYear), month: String(bMonth), day: String(bDay),
        hour: sp.get("bHour") || "모름",
        calendar: (sp.get("bCalendar") || "양력") as "양력" | "음력",
        gender: (sp.get("bGender") || "남") as "남" | "여" },
      choice: { relationship: rel, duration: dur },
    };
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/inyeon-generate", {
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
                setAiText(prev => ({
                  ...prev,
                  [evt.ch!]: (prev[evt.ch!] ?? "") + evt.v,
                }));
              }
            } catch {}
          }
        }
      } catch {/* aborted or network */}
    })();
    return () => ac.abort();
  }, [data, sp, aName, bName, rel, dur]);

  useEffect(() => {
    const aYear = parseInt(sp.get("aYear") || "0", 10);
    const aMonth = parseInt(sp.get("aMonth") || "0", 10);
    const aDay = parseInt(sp.get("aDay") || "0", 10);
    const bYear = parseInt(sp.get("bYear") || "0", 10);
    const bMonth = parseInt(sp.get("bMonth") || "0", 10);
    const bDay = parseInt(sp.get("bDay") || "0", 10);
    if (!aYear || !bYear) return;
    const body = {
      a: { name: aName, year: aYear, month: aMonth, day: aDay,
        hour: sp.get("aHour") || "모름",
        isLunar: (sp.get("aCalendar") || "양력") === "음력",
        gender: sp.get("aGender") || "여" },
      b: { name: bName, year: bYear, month: bMonth, day: bDay,
        hour: sp.get("bHour") || "모름",
        isLunar: (sp.get("bCalendar") || "양력") === "음력",
        gender: sp.get("bGender") || "남" },
    };
    fetch("/api/inyeon-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(setData)
      .catch(e => setLoadError(String(e)));
  }, [sp, aName, bName]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="text-sm text-center" style={{ color: ACCENT }}>
          사주 계산 중 문제가 생겼어요.<br />
          <span className="text-xs opacity-60">{loadError}</span>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
      </div>
    );
  }

  // SajuAnalysis pillars → SajuTable Pillar shape
  const toPillar = (p: { stem: string; branch: string } | null, sip: { stem: string; branch: string } | null) =>
    p && sip ? { stem: p.stem, branch: p.branch, stemSipseong: sip.stem, branchSipseong: sip.branch } : null;
  const pA = {
    year: toPillar(data.a.pillars.year, data.a.sipseong.year)!,
    month: toPillar(data.a.pillars.month, data.a.sipseong.month)!,
    day: { stem: data.a.pillars.day.stem, branch: data.a.pillars.day.branch,
      stemSipseong: "일간", branchSipseong: data.a.sipseong.day.branch },
    hour: toPillar(data.a.pillars.hour, data.a.sipseong.hour),
  };
  const pB = {
    year: toPillar(data.b.pillars.year, data.b.sipseong.year)!,
    month: toPillar(data.b.pillars.month, data.b.sipseong.month)!,
    day: { stem: data.b.pillars.day.stem, branch: data.b.pillars.day.branch,
      stemSipseong: "일간", branchSipseong: data.b.sipseong.day.branch },
    hour: toPillar(data.b.pillars.hour, data.b.sipseong.hour),
  };

  const ratioOf = (e: typeof data.a.elements) => {
    const total = e.목 + e.화 + e.토 + e.금 + e.수;
    const f = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
    return { 목: f(e.목), 화: f(e.화), 토: f(e.토), 금: f(e.금), 수: f(e.수) };
  };

  const JIJANGGAN_MAP: Record<string, string[]> = {
    자: ["壬", "癸"], 축: ["癸", "辛", "己"], 인: ["戊", "丙", "甲"],
    묘: ["甲", "乙"], 진: ["乙", "癸", "戊"], 사: ["戊", "庚", "丙"],
    오: ["丙", "己", "丁"], 미: ["丁", "乙", "己"], 신: ["戊", "壬", "庚"],
    유: ["庚", "辛"], 술: ["辛", "丁", "戊"], 해: ["戊", "甲", "壬"],
  };
  const jjA = JIJANGGAN_MAP[data.a.pillars.day.branch] || [];
  const jjB = JIJANGGAN_MAP[data.b.pillars.day.branch] || [];

  // SipseongRow는 hour pillar 필수 — 모름이면 day로 대체 (시각 자리 채움용)
  const sipHourA = pA.hour ?? pA.day;
  const sipHourB = pB.hour ?? pB.day;

  return (
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? "기본 사주분석 - 우린 어떤 사람일까?"
        : chapter === 2 ? "인연궁합 - 사주에 적힌 우리의 인연"
        : chapter === 3 ? "성격궁합 - 사주로 보는 성격의 조화"
        : chapter === 4 ? "감정궁합 - 우리의 감정·심리 궁합"
        : chapter === 5 ? "체질궁합 - 건강과 활동성의 결"
        : chapter === 6 ? "재물궁합 - 재물운과 재테크"
        : chapter === 7 ? "혼인궁합 - 혼인·가족·자녀운"
        : "풀이를 마치며 - 홍연의 마지막 편지"
      }
      totalChapters={TOTAL}
      chapters={[
        { no: 1, label: "기본 사주분석" },
        { no: 2, label: "인연궁합" },
        { no: 3, label: "성격궁합" },
        { no: 4, label: "감정궁합" },
        { no: 5, label: "체질궁합" },
        { no: 6, label: "재물궁합" },
        { no: 7, label: "혼인궁합" },
        { no: 8, label: "홍연의 마지막 편지" },
      ]}
      onPrev={chapter > 1 ? () => setChapter((chapter - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : undefined}
      onNext={chapter < TOTAL ? () => setChapter((chapter + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : undefined}
      onSelect={(no) => setChapter(no as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)}
      backHref="/inyeon/form"
    >
      {/* 진입 선택값 표시 */}
      <NoticeBubble>
        <strong style={{ color: ACCENT }}>이번 풀이</strong> · {relLabel} · {durLabel}<br />
        선택하신 관계와 기간에 맞춰 풀이의 결을 조정했어요
      </NoticeBubble>

      {chapter === 1 && (
        <>
          {data.character && (
            <CharacterIntroCard aName={aName} bName={bName} character={data.character} />
          )}
          <NoticeBubble>
            궁합을 보기 전에, 두 분의 사주를 한 분씩 펼쳐볼게요. 타고난 성격·연애할 때의 결·이상형, 그리고 우리의 첫인상까지 차례로 살펴봐요.
          </NoticeBubble>

          <Section title={`${aName}님의 사주 — "나"`}>
            <SajuTable name={aName} birthLine={aBirth}
              hour={pA.hour} day={pA.day} month={pA.month} year={pA.year} />
            <OhaengChart name={aName} counts={data.a.elements} ratios={ratioOf(data.a.elements)} />
            <YongsinCards yongsin={data.a.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.a.ilgan} stage={data.a.shinkang} />
            {data.a.sinsal.length > 0 && (
              <SubSection title="신살" body={data.a.sinsal.join(" · ")} />
            )}
            <ChSub ch={1} title="나의 타고난 성격"
              fallback={`${aName}님의 일간 ${data.a.ilgan}(${data.a.shinkang}) — ${data.a.ohaengTop} 기운이 강한 결을 풀어드려요.`} />
            <ChSub ch={1} title="연애할 때 드러나는 나의 매력"
              fallback={`${aName}님이 연애 자리에서 자연스럽게 드러내는 매력의 결을 풀어드려요.`} />
            <ChSub ch={1} title="내가 끌리는 이상형"
              fallback={`${aName}님이 마음을 흔드는 결을 풀어드려요.`} />
          </Section>

          <Section title={`${bName}님의 사주 — "그 사람"`}>
            <SajuTable name={bName} birthLine={bBirth}
              hour={pB.hour} day={pB.day} month={pB.month} year={pB.year} />
            <OhaengChart name={bName} counts={data.b.elements} ratios={ratioOf(data.b.elements)} />
            <YongsinCards yongsin={data.b.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.b.ilgan} stage={data.b.shinkang} />
            {data.b.sinsal.length > 0 && (
              <SubSection title="신살" body={data.b.sinsal.join(" · ")} />
            )}
            <ChSub ch={1} title="그 사람의 타고난 성격"
              fallback={`${bName}님의 일간 ${data.b.ilgan}(${data.b.shinkang}) — ${data.b.ohaengTop} 기운이 강한 결을 풀어드려요.`} />
            <ChSub ch={1} title="그 사람이 연애할 때 보이는 모습"
              fallback={`${bName}님이 연애 자리에서 어떻게 다가가는지 풀어드려요.`} />
            <ChSub ch={1} title="그 사람이 끌리는 이상형"
              fallback={`${bName}님이 어떤 결의 사람에게 끌리는지 풀어드려요.`} />
          </Section>

          <Section title="우리의 첫인상">
            <ChSub ch={1} title="그 사람이 나에게 받은 첫인상"
              fallback={`${bName}님이 ${aName}님을 처음 마주했을 때의 결을 풀어드려요.`} />
            <ChSub ch={1} title="내가 그 사람에게 받은 첫인상"
              fallback={`${aName}님이 ${bName}님을 처음 만났을 때 마음에 남은 결을 풀어드려요.`} />
          </Section>
        </>
      )}

      {chapter === 2 && (
        <>
          <NoticeBubble>
            두 분이 어떤 인연으로 만났는지, 무엇이 두 분을 끌어당겼는지 사주의 결로 풀어드려요.
          </NoticeBubble>

          <Section title="인연 궁합 점수">
            <ScoreGauge score={data.scores.inyeon} label={data.scores.labels.inyeon} caption="In-yeon Score" />
          </Section>

          <Section title="우리 인연의 결">
            <ChSub ch={2} title="우리 인연을 한 줄로 정의하면"
              fallback={`${aName}님과 ${bName}님 인연의 본질을 한 줄로 정리해 드려요.`} />
            <ChSub ch={2} title="우리는 어떤 결로 만난 인연일까"
              fallback="두 분이 만나서 자라가는 결을 풀어드려요." />
          </Section>

          <Section title="끌림의 정체">
            <ChSub ch={2} title="우리가 끌린 진짜 이유"
              fallback={`${aName}님과 ${bName}님이 서로에게 끌린 사주의 깊은 결을 풀어드려요.`} />
            <ChSub ch={2} title="이 인연이 우리에게 주는 의미"
              fallback="이 인연이 두 분에게 어떤 결을 더해주는지 풀어드려요." />
          </Section>
        </>
      )}

      {chapter === 3 && (
        <>
          <NoticeBubble>
            성격궁합은 두 분의 일간(日干)을 중심으로 봐요. 일간이 어떻게 만나는지가 일상의 결을 결정해요.
          </NoticeBubble>

          <Section title="성격 궁합 점수">
            <ScoreGauge score={data.scores.seonggyeok} label={data.scores.labels.seonggyeok} caption="Personality Score" />
          </Section>

          <Section title="우리의 성격 케미">
            <ChSub ch={3} title="우리 성격이 만났을 때의 큰 그림"
              fallback={`${aName}님과 ${bName}님 일간이 만나는 큰 그림을 풀어드려요.`} />
            <ChSub ch={3} title="함께 있을 때 자연스럽게 나뉘는 역할"
              fallback="두 분이 함께 있을 때 자연스럽게 자리잡는 역할 분담을 풀어드려요." />
          </Section>

          <Section title="우리의 끌림 포인트">
            <ChSub ch={3} title="그 사람이 나에게 느끼는 매력"
              fallback={`${bName}님이 ${aName}님에게서 느끼는 매력의 결을 풀어드려요.`} />
            <ChSub ch={3} title="내가 그 사람에게 느끼는 매력"
              fallback={`${aName}님이 ${bName}님에게서 느끼는 매력의 결을 풀어드려요.`} />
          </Section>

          <Section title="함께 오래갈 수 있을까">
            <ChSub ch={3} title="시간이 지나도 단단할 수 있을까"
              fallback="합과 충, 원진과 해의 흔적을 종합해 풀어드려요." />
            <ChSub ch={3} title="누가 주도하고 누가 양보하는가"
              fallback="신강신약과 일간 강약을 토대로 풀어드려요." />
          </Section>

          <Section title="성격 궁합을 보완하는 법">
            <ChSub ch={3} title="그 사람이 나를 더 좋아하게 만드는 법"
              fallback={`${aName}님이 ${bName}님 사주를 어떻게 채워줄 수 있는지 풀어드려요.`} />
            <ChSub ch={3} title="우리가 함께할 때 가장 잘 맞는 활동"
              fallback="두 분의 결이 가장 잘 살아나는 활동을 풀어드려요." />
          </Section>
        </>
      )}

      {chapter === 4 && (
        <>
          <NoticeBubble>
            감정궁합은 일간 기준 천간 3개와 일지 지장간을 봐요. 십성을 통해 두 분의 내면 심리·감정 결을 살펴봐요.
          </NoticeBubble>

          <Section title="감정·심리 궁합 점수">
            <ScoreGauge score={data.scores.emotion} label={data.scores.labels.emotion} caption="Emotion Score" />
          </Section>

          <Section title={`${aName}님의 십성과 지장간`}>
            <SipseongRow
              name={aName}
              hour={sipHourA}
              day={pA.day}
              month={pA.month}
              year={pA.year}
              jijanggan={jjA}
            />
          </Section>

          <Section title={`${bName}님의 십성과 지장간`}>
            <SipseongRow
              name={bName}
              hour={sipHourB}
              day={pB.day}
              month={pB.month}
              year={pB.year}
              jijanggan={jjB}
            />
          </Section>

          <Section title="우리의 감정 표현">
            <ChSub ch={4} title="우리가 마음을 주고받는 방식"
              fallback={`${aName}님과 ${bName}님이 감정을 어떻게 표현하고 받아들이는지 풀어드려요.`} />
            <ChSub ch={4} title="서로에게 안정감을 주는 포인트"
              fallback="두 분이 서로에게서 어떤 결로 안정감을 받는지 풀어드려요." />
          </Section>

          <Section title="갈등과 화해의 결">
            <ChSub ch={4} title="우리가 자주 부딪히는 갈등 패턴"
              fallback={`${aName}님과 ${bName}님 사이에 반복될 결의 갈등을 풀어드려요.`} />
            <ChSub ch={4} title="화해의 길을 여는 한 마디"
              fallback="두 분이 다툰 후 마음을 푸는 한 마디의 결을 풀어드려요." />
            <ChSub ch={4} title="권태기를 슬기롭게 넘기는 법"
              fallback="두 분만의 권태기 처방을 풀어드려요." />
          </Section>
        </>
      )}

      {chapter === 5 && (
        <>
          <NoticeBubble>
            두 분의 깊은 결을 오행 체질·시기 흐름·본능으로 살펴드려요. 본능궁합은 {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          <Section title="체질 궁합 점수">
            <ScoreGauge score={data.scores.physical} label={data.scores.labels.physical} caption="Physical Score" />
          </Section>

          <Section title="우리의 체질궁합">
            <ChSub ch={5} title="두 사람의 오행 체질"
              fallback={`${aName}님과 ${bName}님 각자의 오행 체질을 풀어드려요.`} />
            <ChSub ch={5} title="함께할 때 건강의 보완과 주의점"
              fallback="두 분이 함께할 때 서로의 결을 어떻게 보완하는지 풀어드려요." />
          </Section>

          <Section title="우리의 시기궁합">
            <ChSub ch={5} title="가장 가까워질 시기"
              fallback="두 분 결이 가장 가까워질 시기를 대운 흐름으로 풀어드려요." />
            <ChSub ch={5} title="흔들릴 수 있는 시기"
              fallback="결이 흔들릴 수 있는 시기와 함께 통과할 결을 풀어드려요." />
            <ChSub ch={5} title="향후 1년의 흐름"
              fallback="이번 한 해 두 분 인연의 흐름을 짚어드려요." />
          </Section>

          <Section title="우리의 본능궁합">
            {rel === "crush" && (
              <>
                <ChSub ch={5} title="그 사람의 숨겨진 이성적 매력"
                  fallback={`${bName}님 사주 깊은 곳에 숨겨진 이성적 매력의 결을 풀어드려요.`} />
                <ChSub ch={5} title="가까워진다면 어떤 스킨십이 잘 맞을까"
                  fallback="두 분이 가까워졌을 때 자연스럽게 흐를 결을 풀어드려요." />
              </>
            )}
            {rel === "talking" && (
              <>
                <ChSub ch={5} title="우리 사이에 흐르는 이성적 끌림"
                  fallback="아직 표면화되지 않았지만 흐르는 결의 끌림을 풀어드려요." />
                <ChSub ch={5} title="스킨십이 시작될 때 잘 맞는 결"
                  fallback="첫 스킨십이 시작될 때 자연스럽게 흐를 결을 풀어드려요." />
              </>
            )}
            {rel === "dating_short" && (
              <>
                <ChSub ch={5} title="우리 둘의 잠자리 케미"
                  fallback="처음 함께하는 자리에서 만들어지는 결의 케미를 풀어드려요." />
                <ChSub ch={5} title="우리에게 잘 맞는 스킨십의 결"
                  fallback="두 분 사주에 잘 맞는 스킨십의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 주도하는 쪽은 누구일까"
                  fallback="자연스러운 주도·받음의 결을 풀어드려요." />
              </>
            )}
            {rel === "dating_long" && (
              <>
                <ChSub ch={5} title="안정된 관계에서 깊어지는 잠자리 케미"
                  fallback="안정기 두 분의 깊어지는 결을 풀어드려요." />
                <ChSub ch={5} title="우리에게 잘 맞는 스킨십의 결"
                  fallback="안정기 두 분에게 잘 맞는 스킨십의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 주도하는 쪽은 누구일까"
                  fallback="자연스러운 주도·받음의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 부딪힐 수 있는 지점"
                  fallback="친밀의 자리에서 부딪힐 수 있는 결과 풀어가는 한 가지를 풀어드려요." />
              </>
            )}
            {rel === "married" && (
              <>
                <ChSub ch={5} title="오랜 부부의 잠자리 케미"
                  fallback="오래 함께한 두 분의 친밀의 결을 풀어드려요." />
                <ChSub ch={5} title="노년까지 이어지는 부부의 친밀"
                  fallback="노년기로 가면서 변하는 친밀의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리 주도권의 변화"
                  fallback="시간이 흐르며 변하는 주도·받음의 결을 풀어드려요." />
              </>
            )}
            {rel === "exboyfriend" && (
              <>
                <ChSub ch={5} title="다시 만났을 때의 이성적 끌림"
                  fallback="재회 후 다시 마주했을 때 흐르는 결의 끌림을 풀어드려요." />
                <ChSub ch={5} title="재회 후 깊어질 잠자리 케미"
                  fallback="다시 만난 두 분이 친밀해질 때의 결을 풀어드려요." />
                <ChSub ch={5} title="잠자리에서 다시 부딪힐 수 있는 지점"
                  fallback="다시 만난 두 분이 친밀의 자리에서 다시 부딪힐 수 있는 결을 풀어드려요." />
              </>
            )}
          </Section>
        </>
      )}

      {chapter === 6 && (
        <>
          <NoticeBubble>
            지금 두 분에게 가장 필요한 결을 풀어드려요. {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          {(() => {
            const ch6Map: Record<RelationshipKind, { sectionTitle: string; subs: string[] }> = {
              crush: {
                sectionTitle: "그 마음을 풀어가는 길",
                subs: ["그 사람의 마음을 여는 열쇠", "다가갈 때 피해야 할 행동", "고백의 타이밍과 방법", "이 마음, 정리해야 할 신호"],
              },
              talking: {
                sectionTitle: "관계가 깊어지는 길",
                subs: ["호감을 키우는 우리만의 방법", "관계가 진전될 결정적 순간", "잘 안 될 신호와 조기 판단법"],
              },
              dating_short: {
                sectionTitle: "초반을 단단히 다지는 길",
                subs: ["초반에 단단해질 우리만의 방법", "콩깍지 너머의 진짜 모습", "지금 가장 조심해야 할 갈등"],
              },
              dating_long: {
                sectionTitle: "더 깊어지는 길",
                subs: ["권태기를 넘고 더 깊어지는 법", "다음 단계로 가야 할 신호"],
              },
              married: {
                sectionTitle: "평생 함께 가는 길",
                subs: ["평생 함께 깊어지는 우리만의 결", "가장 흔들릴 수 있는 시기"],
              },
              exboyfriend: {
                sectionTitle: "어긋난 인연을 다시 보다",
                subs: ["우리가 어긋난 진짜 이유", "다시 이어질 가능성과 조건", "결정의 골든타임", "반복되지 않을 방법"],
              },
            };
            const plan = ch6Map[rel];
            return (
              <Section title={plan.sectionTitle}>
                {plan.subs.map(title => (
                  <ChSub key={title} ch={6} title={title}
                    fallback={`${relLabel} 단계에 맞춰 두 분에게 지금 필요한 결을 풀어드리고 있어요.`} />
                ))}
              </Section>
            );
          })()}
        </>
      )}

      {chapter === 7 && (
        <>
          <NoticeBubble>
            결혼·미래의 결을 풀어드려요. {relLabel} 단계에 맞춰 풀이의 결을 조정했어요.
          </NoticeBubble>

          {(() => {
            const ch7Map: Record<RelationshipKind, { sectionTitle: string; subs: string[] }> = {
              crush: {
                sectionTitle: "만약 함께한다면",
                subs: ["이 사람과 결혼까지 갈 가능성", "함께한다면 펼쳐질 미래의 모습"],
              },
              talking: {
                sectionTitle: "이 인연이 닿을 수 있는 곳",
                subs: ["이 사람과 미래까지 갈 가능성", "멀리 봤을 때 우리 인연이 닿을 수 있는 곳"],
              },
              dating_short: {
                sectionTitle: "멀리 봤을 때 우리의 미래",
                subs: ["이 사람과 결혼까지 갈 가능성", "함께한다면 펼쳐질 미래의 모습", "길게 가기 위해 지금 챙겨야 할 것"],
              },
              dating_long: {
                sectionTitle: "결혼·미래궁합",
                subs: [
                  "결혼까지 이어질 결인지",
                  "결혼의 장애물",
                  "좋은 결혼 시기",
                  "신혼생활을 시작하기 좋은 자리",
                  "우리 둘의 자녀운",
                ],
              },
              married: {
                sectionTitle: "가정과 함께 가는 길",
                subs: [
                  "우리 둘의 자녀운 — 사주에 담긴 자녀 인연",
                  "자녀운이 부족할 때 보완하는 길",
                  "우리의 노년기 결 — 60대 이후 우리는 어떤 모습일까",
                  "평생 흔들리지 않는 우리만의 결",
                  "가정의 재물·생활의 큰 흐름",
                ],
              },
              exboyfriend: {
                sectionTitle: "다시 함께한다면",
                subs: [
                  "다시 만나서 결혼까지 갈 결인지",
                  "다시 함께한다면 펼쳐질 미래의 모습",
                  "재회 후 길게 함께 가기 위한 한 가지",
                ],
              },
            };
            const plan = ch7Map[rel];
            return (
              <Section title={plan.sectionTitle}>
                {plan.subs.map(title => (
                  <ChSub key={title} ch={7} title={title}
                    fallback={`${relLabel} 단계에 맞춰 결혼·미래의 결을 풀어드리고 있어요.`} />
                ))}
              </Section>
            );
          })()}
        </>
      )}

      {chapter === 8 && (
        <>
          <NoticeBubble>
            홍도인이 두 분께 드리는 마지막 편지예요. {relLabel} 단계에 맞춰 톤을 조정했어요.
          </NoticeBubble>

          {(() => {
            const ch8SectionTitleMap: Record<RelationshipKind, string> = {
              crush: "다가갈 용기 또는 정리의 지혜를 전하는 편지",
              talking: "이 시작이 가는 길을 비춰주는 편지",
              dating_short: "초반의 단단함을 만들어가는 편지",
              dating_long: "더 깊은 사랑으로 가는 편지",
              married: "평생 함께 가는 동반자에게 보내는 편지",
              exboyfriend: "어긋난 인연 앞에서 길을 찾는 편지",
            };
            return (
              <Section title={ch8SectionTitleMap[rel]}>
                <ChSub ch={8} title="이렇게 만나주신 두 분께"
                  fallback={`${aName}님과 ${bName}님께 드리는 편지를 정리하고 있어요…`} />
                <ChSub ch={8} title="두 분의 결, 잊지 마세요"
                  fallback="1~7장의 결을 한 흐름으로 묶어드려요." />
                <ChSub ch={8} title="마지막으로 드리는 한 마디"
                  fallback="두 분께 보내는 진심 어린 짧은 응원의 한 마디." />
              </Section>
            );
          })()}

          <NoticeBubble>
            <strong style={{ color: ACCENT }}>마지막까지 함께해 주세요</strong> 🙏<br />
            궁합은 단지 방향을 알려주는 나침반일 뿐이에요. 결국 인연은 두 분이 함께 만들어가는 거예요.
          </NoticeBubble>
        </>
      )}
    </ChapterShell>
  );
}

export default function InyeonResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
          />
        </div>
      }
    >
      <InyeonResultInner />
    </Suspense>
  );
}
