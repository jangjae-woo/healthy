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
interface InyeonComputeData {
  a: PersonData;
  b: PersonData;
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
          <NoticeBubble>
            궁합을 보기 전에, 두 분의 사주를 한 분씩 펼쳐볼게요. 본질·매력·이상형까지 차례로 살펴봐요.
          </NoticeBubble>

          <Section title={`${aName}님의 사주`}>
            <SajuTable name={aName} birthLine={aBirth}
              hour={pA.hour} day={pA.day} month={pA.month} year={pA.year} />
            <SubSection title="기본 사주분석"
              body={`${aName}님의 일간 ${data.a.ilgan}(${data.a.shinkang}) — ${data.a.ohaengTop} 기운이 강하고 ${data.a.ohaengWeak} 기운이 약한 결이에요.`} />
          </Section>

          <Section title={`${aName}님의 오행과 용신`}>
            <OhaengChart name={aName} counts={data.a.elements} ratios={ratioOf(data.a.elements)} />
            <YongsinCards yongsin={data.a.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.a.ilgan} stage={data.a.shinkang} />
            {data.a.sinsal.length > 0 && (
              <SubSection title="신살" body={data.a.sinsal.join(" · ")} />
            )}
          </Section>

          <Section title={`${bName}님의 사주`}>
            <SajuTable name={bName} birthLine={bBirth}
              hour={pB.hour} day={pB.day} month={pB.month} year={pB.year} />
            <SubSection title="기본 사주분석"
              body={`${bName}님의 일간 ${data.b.ilgan}(${data.b.shinkang}) — ${data.b.ohaengTop} 기운이 강하고 ${data.b.ohaengWeak} 기운이 약한 결이에요.`} />
          </Section>

          <Section title={`${bName}님의 오행과 용신`}>
            <OhaengChart name={bName} counts={data.b.elements} ratios={ratioOf(data.b.elements)} />
            <YongsinCards yongsin={data.b.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={data.b.ilgan} stage={data.b.shinkang} />
            {data.b.sinsal.length > 0 && (
              <SubSection title="신살" body={data.b.sinsal.join(" · ")} />
            )}
          </Section>
        </>
      )}

      {chapter === 2 && (
        <>
          <NoticeBubble>
            인연궁합은 두 분의 일지(배우자궁)를 핵심으로 풀어요. 점수는 일간·일지·합·충·신살을 종합해 산출돼요.
          </NoticeBubble>

          <Section title="인연 궁합 점수">
            <ScoreGauge score={data.scores.inyeon} label={data.scores.labels.inyeon} caption="In-yeon Score" />
          </Section>

          <Section title="인연의 붉은 실">
            <ChSub ch={2} title="우리는 인연일까, 악연일까?"
              fallback={`${aName}님과 ${bName}님의 인연 풀이를 불러오고 있어요…`} />
            <ChSub ch={2} title="전생에서 우리는 어떤 관계였을까?"
              fallback="합과 충의 흔적으로 본 전생의 인연을 부드럽게 풀어드려요." />
          </Section>

          <Section title="인연과 관계의 열쇠">
            <ChSub ch={2} title="서로가 느꼈던 첫인상은 어땠을까?" fallback="첫 만남의 결을 풀어드려요." />
            <ChSub ch={2} title="고백은 누가 먼저 하는 게 좋을까?" fallback={`${relLabel} 단계에 맞춰 조언을 드려요.`} />
            <SeasonGrid items={[
              { season: "봄", hanja: "春", place: "갈대밭과 함께 걷는 너른 정원" },
              { season: "여름", hanja: "夏", place: "바닷바람이 시원한 해변 산책로" },
              { season: "가을", hanja: "秋", place: "고즈넉한 단풍길 사찰" },
              { season: "겨울", hanja: "冬", place: "따뜻한 실내 미술관·전시" },
            ]} />
            <ChSub ch={2} title="기념일은 어떻게 챙기는 게 좋을까?"
              fallback={`${aName}님은 실용적 가치, ${bName}님은 정성 어린 분위기에 감동해요.`} />
            <ChSub ch={2} title="서로 어떤 점에서 서운함을 느낄까?" fallback="현실적 태도와 감정 표현의 차이가 핵심이에요." />
            <ChSub ch={2} title="화해는 어떻게 하면 좋을까?" fallback="논리보다 따뜻한 체온을 나누는 스킨십이 빨라요." />
            <ChSub ch={2} title="장기적인 관계 유지를 위한 조언"
              fallback={`${durLabel} 시점에 어울리는 결로 조언을 드려요.`} />
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

          <Section title="우리의 성격, 잘 맞을까?">
            <ChSub ch={3} title="일간을 통해 보는 성격의 조화"
              fallback={`${aName}님과 ${bName}님 일간이 만나는 결을 풀어드려요.`} />
            <ChSub ch={3} title="서로가 연애를 할 때 달라지는 모습은?" fallback="평소와 연애 시의 결이 어떻게 달라지는지 풀어드려요." />
            <ChSub ch={3} title="둘이 함께 있을 때, 자연스럽게 역할이 나눠지는 부분은?" fallback="누가 결정하고 누가 분위기를 맡는지 살펴봐요." />
          </Section>

          <Section title="우리의 끌림 포인트는?">
            <ChSub ch={3} title="서로에게 느끼는 매력 포인트는?" fallback={`${aName}님과 ${bName}님 각자의 매력을 짧게 두 단락으로.`} />
          </Section>

          <Section title="이 커플, 오래 갈 수 있을까?">
            <ChSub ch={3} title="오래 만날 수 있는 성격일까?" fallback="합과 충, 원진과 해의 흔적을 종합해 풀어드려요." />
            <ChSub ch={3} title="더 많이 양보해야 될 사람은?" fallback="신강신약과 일간 강약을 토대로." />
            <ChSub ch={3} title="연애 주도권, 누구에게 있을까?" fallback="일간의 추진력으로 살펴봐요." />
            <ChSub ch={3} title="미래를 그릴 때 두 사람이 상상하는 그림은 비슷할까?" fallback="재성·식상·관성 분포로 본 미래 가치관." />
          </Section>

          <Section title="성격 궁합을 보완하는 방법">
            <ChSub ch={3} title="서로를 더 좋아하게 만들려면?" fallback="구체적 행동 두세 가지를 제안해드려요." />
            <ChSub ch={3} title="어떤 커플 아이템이 좋을까요?" fallback="용신을 보강하는 색·재료·소품 한 가지." />
            <ChSub ch={3} title="같이 즐기면 좋은 취미가 있을까요?" fallback="에너지를 건설적으로 배출할 정적인 취미." />
            <ChSub ch={3} title="상대방을 더 이해하기 위한 대화 질문은?" fallback="서로에게 던질 수 있는 질문 4가지를 드려요." />
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

          <Section title="우리의 감정궁합, 얼마나 잘 맞을까?">
            <ChSub ch={4} title="감정 표현 방식"
              fallback={`${aName}님과 ${bName}님이 감정을 드러내는 결이 얼마나 다른지 풀어드려요.`} />
            <ChSub ch={4} title="대화 스타일" fallback="결론을 빨리 내려는 결과 분위기를 읽는 결의 충돌." />
            <ChSub ch={4} title="공감 방식" fallback="행동으로 보여주는 공감과 함께 느껴주는 공감의 차이." />
            <ChSub ch={4} title="의존 경향" fallback="겉으로 보이는 의존과 실제 정서적 의존의 구조." />
            <ChSub ch={4} title="본능적으로 서로에게 느낀 '이것'" fallback="첫 만남의 끌림과 직감." />
            <ChSub ch={4} title="연애에서 안정감을 주는 포인트" fallback="각자가 안정을 느끼는 구체적 행동·말." />
            <ChSub ch={4} title="감정적인 순간, 어떻게 행동해야 할까?" fallback="물리적 거리두기 등 충돌 시 행동 지침." />
          </Section>

          <Section title="감정 문제의 해결">
            <ChSub ch={4} title="연락 패턴이나, 빈도는 어떻게 하는게 좋을까?"
              fallback={`${durLabel} 단계에 어울리는 연락 빈도와 예측 가능성에 대한 조언이 들어와요.`} />
            <ChSub ch={4} title="권태기를 슬기롭게 넘기는 방법은?" fallback="이 두 분만의 권태기 처방전." />
            <ChSub ch={4} title="서로 상처받지 않고 대화하는 방법" fallback="쿠션어, 주어 바꾸기 등 구체적 대화 기법." />
            <ChSub ch={4} title="헤어질 위기엔 누가 더 매달릴까?" fallback="관계의 무게중심을 솔직하게 짚어드려요." />
            <ChSub ch={4} title="재회를 위해서는 어떤 노력이 필요할까?" fallback="재회 가능성과 전제 조건." />
          </Section>
        </>
      )}

      {chapter === 5 && (
        <>
          <NoticeBubble>
            체질궁합은 두 분의 오행과 신강신약을 토대로 봐요. 건강·운동·활동성을 중심으로 풀어드려요.
          </NoticeBubble>

          <Section title="체질 궁합 점수">
            <ScoreGauge score={data.scores.physical} label={data.scores.labels.physical} caption="Physical Score" />
          </Section>

          <Section title="우리는 잘 맞는 체질일까?">
            <ChSub ch={5} title="두 사람의 체질적 성향과 주의사항"
              fallback={`${aName}님과 ${bName}님의 체질 결을 풀어드려요.`} />
            <ChSub ch={5} title="상대방이 보완해줄 수 있는 건강 요소"
              fallback="서로의 부족한 오행을 어떻게 채워주는지 살펴봐요." />
          </Section>

          <Section title="함께 움직이면 좋은 활동">
            <ChSub ch={5} title="함께하면 좋은 운동"
              fallback="두 분의 오행에 맞는 구체적 운동 한두 가지와 그 이유." />
            <ChSub ch={5} title="주의해야 할 운동"
              fallback="체질상 피하는 게 좋은 활동을 짚어드려요." />
          </Section>
        </>
      )}

      {chapter === 6 && (
        <>
          <NoticeBubble>
            재물궁합은 재성·식신·상관을 중심으로 봐요. 시기별 재산 흐름과 함께 두 분의 재물 결을 풀어드려요.
          </NoticeBubble>

          <Section title="재물 궁합 점수">
            <ScoreGauge score={data.scores.finance} label={data.scores.labels.finance} caption="Wealth Score" />
          </Section>

          <Section title="시기별 재산 흐름">
            <AssetCurve title={`${aName}님 혼자일 때`} points={data.curves.a} />
            <AssetCurve title={`${bName}님 혼자일 때`} points={data.curves.b} />
            <AssetCurve title="함께할 때" points={data.curves.together} color="#d8a8e8" />
          </Section>

          <Section title="두 사람의 재물운, 어떻게 바뀔까?">
            <ChSub ch={6} title={`${aName}님 재물운`} fallback="혼자일 때의 재물 흐름과 약점을 풀어드려요." />
            <ChSub ch={6} title={`${bName}님 재물운`} fallback="혼자일 때의 재물 흐름과 약점을 풀어드려요." />
            <ChSub ch={6} title="두 분이 함께했을 때의 재물운" fallback="시너지·보완 구조." />
            <ChSub ch={6} title="우리는 재물 걱정 없이 살 수 있을까?" fallback="함께할 때의 결론과 경고." />
          </Section>

          <Section title="재물궁합 상세풀이">
            <ChSub ch={6} title="데이트 비용은 어떻게 분담하면 좋을까?" fallback="구체적 비율과 이유." />
            <ChSub ch={6} title="데이트 비용으로 인한 갈등을 줄이려면?" fallback="공용 통장·규칙 등 실용 팁." />
            <ChSub ch={6} title="결혼하면 맞벌이? 외벌이?" fallback="사주 구조에 맞는 결론." />
            <ChSub ch={6} title="사업을 같이 해도 괜찮을까?" fallback="동업 가능성을 솔직하게." />
            <ChSub ch={6} title="돈 관리는 누가 하는 게 좋을까?" fallback="역할 분담을 명확히 짚어드려요." />
          </Section>

          <Section title="돈에 대한 생각">
            <ChSub ch={6} title={`${aName}님의 가치관`} fallback="돈을 어떻게 바라보는지." />
            <ChSub ch={6} title={`${bName}님의 가치관`} fallback="돈을 어떻게 바라보는지." />
          </Section>

          <Section title="우리에게 딱 맞는 재테크 방법">
            <ChSub ch={6} title="장기 자산 운용 방향" fallback="부동산·우량주 같은 큰 방향 한두 가지를 제안해드려요." />
            <ChSub ch={6} title="돈 문제가 생겼을 때, 원활하게 대화하려면?" fallback="데이터 제시·치켜세우기 등 구체적 대화 기법." />
          </Section>
        </>
      )}

      {chapter === 7 && (
        <>
          <NoticeBubble>
            혼인궁합은 결혼 시기·자녀·양가 가족까지 폭넓게 봐요. 인연이 결실을 맺는 결을 살펴봐요.
          </NoticeBubble>

          <Section title="혼인 궁합 점수">
            <ScoreGauge score={data.scores.marriage} label={data.scores.labels.marriage} caption="Marriage Score" />
          </Section>

          <Section title="우리, 결혼할 사주인가요?">
            <ChSub ch={7} title="사주에서 보이는 결혼 시기"
              fallback="가장 강한 결혼운이 들어오는 시기를 풀어드려요." />
            <ChSub ch={7} title="결혼의 장애물" fallback="두 분 사이의 보이지 않는 갈등 결." />
            <ChSub ch={7} title="신혼생활은 어디서 시작하는 게 좋을까?"
              fallback="오행에 맞춘 신혼집 방향과 환경." />
            <ChSub ch={7} title="가사분담은 어떻게 하면 좋을까?"
              fallback={`${aName}님과 ${bName}님 사주 결에 맞는 역할 분담.`} />
          </Section>

          <Section title="이혼 위기 극복 방법">
            <ChSub ch={7} title="우리에게 이혼 위기가 있을까?" fallback="솔직하게 짚어드려요." />
            <ChSub ch={7} title="이혼 위기가 찾아올 시점" fallback="구체적 연도·결혼 후 몇 년차." />
            <ChSub ch={7} title="이혼 위기가 찾아오는 이유" fallback="원진·충 등 사주 결을 비유로." />
            <ChSub ch={7} title="이혼 위기를 슬기롭게 극복하려면?" fallback="실용적 행동 지침." />
          </Section>

          <Section title="자녀운">
            <ChSub ch={7} title="우리 둘의 자녀운" fallback="자녀를 향한 기운과 부부 사이 영향." />
            <ChSub ch={7} title="자녀 계획" fallback="운이 가장 조화로운 시기." />
            <ChSub ch={7} title="자녀운이 부족할 때 보완할 방법" fallback="인테리어·시간대 등 구체 팁." />
            <ChSub ch={7} title="우리에게 잘 맞는 자녀 교육 방법" fallback="훈육·정서적 유대 역할 분담." />
          </Section>

          <Section title="부모궁 및 형제궁 vs 상대방">
            <ChSub ch={7} title="우리의 기존 가족 관계" fallback="각자 자라온 가족 결." />
            <ChSub ch={7} title="결혼 후 서로의 가족과의 궁합" fallback="시댁·처가 적응 결." />
            <ChSub ch={7} title="명절·가족 행사에서 갈등 줄이는 법" fallback="시간 제한·금기 화제." />
            <ChSub ch={7} title="배우자와 내 가족 사이 중재 팁" fallback="서로 방어막 역할." />
            <ChSub ch={7} title="가족 모임에서 신경 써야 할 점" fallback="표정 관리·말의 무게." />
          </Section>
        </>
      )}

      {chapter === 8 && (
        <>
          <NoticeBubble>
            지금까지의 모든 풀이를 한 통의 편지로 묶어드려요. 두 분의 결을 마지막으로 차분히 정리해요.
          </NoticeBubble>

          <Section title="풀이를 마치며 — 홍연의 마지막 편지">
            <ChSub ch={8} title="두 분의 궁합을 한마디로"
              fallback={`${aName}님과 ${bName}님께 드리는 편지를 정리하고 있어요…`} />
            <ChSub ch={8} title="두 분이 놓치지 말아야 할 강점"
              fallback="인연·성격·체질·재물·감정 중 가장 빛나는 결을 따뜻하게 짚어드려요." />
            <ChSub ch={8} title="꼭 기억해두면 좋을 위기 시점"
              fallback="결혼 3~5년차 무렵에 찾아올 수 있는 위기를 미리 준비하는 결로." />
            <ChSub ch={8} title="자녀와 가족에 대한 마무리 조언"
              fallback="혼인·자녀·가족 결을 종합한 한 단락." />
            <ChSub ch={8} title="마지막으로 두 분께"
              fallback="진짜 인연은, 서로를 이해하려는 마음에서 피어나는 거니까요. 두 분의 결, 끝까지 응원할게요." />
          </Section>

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
