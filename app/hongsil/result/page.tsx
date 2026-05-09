"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChapterShell from "@/components/hongsil/ChapterShell";
import SajuTable from "@/components/hongsil/SajuTable";
import OhaengChart from "@/components/hongsil/OhaengChart";
import YongsinCards from "@/components/hongsil/YongsinCards";
import SinKangBar from "@/components/hongsil/SinKangBar";
import SipseongRow from "@/components/hongsil/SipseongRow";
import {
  SOLO_DURATION_LABEL, LOVE_DESIRE_LABEL, LOVE_STYLE_LABEL,
  SoloDuration, LoveDesire, LoveStyle,
} from "@/lib/hongsil/types";

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
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.88))",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 8px 24px -12px rgba(178,40,71,0.14)",
      }}>
      <div className="text-[17px] font-bold mb-3 leading-relaxed"
        style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif", paddingTop: 2 }}>
        {title}
      </div>
      <div className="text-[15px] leading-[2.0]"
        style={{ color: INK, fontFamily: "'Gowun Batang', serif" }}>
        {body}
      </div>
    </div>
  );
}

function CharacterIntroCard({ name, character }: { name: string; character: NonNullable<ComputeData["character"]> }) {
  const me = character.me;
  const destiny = character.destiny;
  return (
    <div className="mb-8 rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.92))",
        border: "1px solid rgba(212,169,107,0.35)",
        boxShadow: "0 16px 40px -16px rgba(178,40,71,0.18)",
      }}>
      <div className="px-5 py-5 text-center" style={{ borderBottom: "1px solid rgba(212,169,107,0.25)" }}>
        <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          紅 絲 · MY HONGSIL
        </div>
        <div className="text-[13px]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
          {name}님은
        </div>
        <div className="text-[44px] font-black leading-none mt-1 mb-1"
          style={{ color: me.color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}>
          {me.name}
        </div>
        <div className="text-[12px] font-bold" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.1em" }}>
          스타일
        </div>
        <div className="text-[12px] mt-2" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
          {me.innerImage}
        </div>
      </div>
      <div className="px-5 py-4 text-center">
        <div className="text-[11px] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          DESTINY · 운명의 짝꿍
        </div>
        <div className="text-[13px]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
          {name}님의 운명 짝꿍은
        </div>
        <div className="text-[32px] font-black leading-none mt-1 mb-1"
          style={{ color: destiny.color, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}>
          {destiny.name}
        </div>
        <div className="text-[12px] mt-1" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
          {destiny.innerImage}
        </div>
        <div className="text-[11px] mt-2" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
          {destiny.signal}
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

  useEffect(() => {
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
  }, [sp, meName]);

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
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#fff7f9" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${THREAD}33`, borderTopColor: THREAD }} />
    </div>;
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

  return (
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? "내 매력과 연애 스타일"
        : chapter === 2 ? "사랑이 오는 타이밍"
        : chapter === 3 ? "내 짝꿍 미리 보기"
        : chapter === 4 ? "내 사랑 흑역사 — 반복 패턴"
        : chapter === 5 ? "솔직한 19금 사주"
        : "홍도인의 마지막 한 마디"
      }
      totalChapters={TOTAL}
      chapters={[
        { no: 1, label: "내 매력" },
        { no: 2, label: "사랑 타이밍" },
        { no: 3, label: "내 짝꿍" },
        { no: 4, label: "반복 패턴" },
        { no: 5, label: "19금 사주" },
        { no: 6, label: "홍도인 편지" },
      ]}
      onPrev={chapter > 1 ? () => setChapter((chapter - 1) as 1 | 2 | 3 | 4 | 5 | 6) : undefined}
      onNext={chapter < TOTAL ? () => setChapter((chapter + 1) as 1 | 2 | 3 | 4 | 5 | 6) : undefined}
      onSelect={(no) => setChapter(no as 1 | 2 | 3 | 4 | 5 | 6)}
      backHref="/hongsil/form"
    >
      <div className="rounded-md px-4 py-3 mb-4 text-[12px]"
        style={{ background: "rgba(255,235,240,0.6)", border: "1px dashed rgba(200,32,58,0.4)", color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
        ▸ 솔로 기간: {SOLO_DURATION_LABEL[duration]}<br />
        ▸ 원하는 사랑: {LOVE_DESIRE_LABEL[desire]}<br />
        ▸ 사랑 스타일: {LOVE_STYLE_LABEL[style]}
      </div>

      {chapter === 1 && (
        <>
          {data.character && <CharacterIntroCard name={meName} character={data.character} />}
          <Section title={`${meName}님의 사주`}>
            <SajuTable name={meName} birthLine={meBirth}
              hour={pillars.hour} day={pillars.day} month={pillars.month} year={pillars.year} />
            <OhaengChart name={meName} counts={me.elements} ratios={ratios} />
            <YongsinCards yongsin={me.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={me.ilgan} stage={me.shinkang} />
          </Section>
          <Section title="내 매력과 연애 스타일">
            <ChSub ch={1} title="내 매력은?" fallback={`${meName}님의 본질적 매력을 풀어드리고 있어요.`} />
            <ChSub ch={1} title="썸 단계 결정적 매력" fallback="썸 시점에 발휘되는 결정적 매력을 풀어드리고 있어요." />
            <ChSub ch={1} title="사랑하면 변하는 나" fallback="사랑에 빠지면 변하는 결을 풀어드리고 있어요." />
            <ChSub ch={1} title="밀당녀 vs 직진녀" fallback="자가 답과 사주 결과를 비교해드리고 있어요." />
          </Section>
        </>
      )}

      {chapter === 2 && (
        <Section title="사랑이 오는 타이밍">
          <ChSub ch={2} title="인생 전체, 사랑의 큰 흐름" fallback="일생 연애운 곡선을 풀어드리고 있어요." />
          <ChSub ch={2} title="솔로 탈출은 언제?" fallback="활동 vs 기다림 분류로 솔로 탈출 시기를 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 3 && (
        <Section title="내 짝꿍 미리 보기">
          <ChSub ch={3} title="내 짝꿍은 누구일까?" fallback={`${meName}님의 운명 짝꿍을 12 캐릭터 중에서 풀어드리고 있어요.`} />
          <ChSub ch={3} title="운명을 알아보는 단서" fallback="짝꿍이 다가올 때 결정적 사인을 풀어드리고 있어요." />
          <ChSub ch={3} title="운명을 잡는 한 수" fallback="적극 어필·매력 발휘 행동을 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 4 && (
        <Section title="내 사랑 흑역사 — 반복되는 그 패턴">
          <ChSub ch={4} title="자꾸 끌리는 가짜 인연" fallback="자꾸 끌리는 가짜 유형을 진단하고 있어요." />
          {duration === "never" ? (
            <ChSub ch={4} title="첫 연애에서 가장 조심해야 할 패턴" fallback="첫 연애에서 빠질 수 있는 함정을 풀어드리고 있어요." />
          ) : (
            <ChSub ch={4} title="매번 같은 결말의 이유" fallback="반복 패턴을 분석하고 있어요." />
          )}
          <ChSub ch={4} title="이 굴레, 어떻게 벗어날까?" fallback="자각·자기개선·반복 끊기 행동을 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 5 && (
        <Section title="솔직한 19금 사주">
          <SipseongRow name={meName} hour={sipHour} day={pillars.day} month={pillars.month} year={pillars.year} jijanggan={jj} />
          <ChSub ch={5} title="감춰진 야한 매력" fallback={`${meName}님의 본능적 매력을 풀어드리고 있어요.`} />
          <ChSub ch={5} title="내 본능이 원하는 욕구" fallback="본능이 원하는 사랑·잠자리 욕구를 풀어드리고 있어요." />
          <ChSub ch={5} title="둘이 가장 깊어지는 분위기" fallback="가장 깊어지는 결의 분위기·시기를 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 6 && (
        <>
          <Section title="홍도인의 마지막 한 마디">
            <ChSub ch={6} title="홍도인의 마지막 편지" fallback="편지를 정리하고 있어요…" />
          </Section>
          <div className="rounded-md px-5 py-4 text-[13px] leading-[1.85] mt-4"
            style={{ background: "rgba(255,235,240,0.7)", border: "1px dashed rgba(200,32,58,0.45)", color: INK, fontFamily: "'Gowun Batang', serif" }}>
            <strong style={{ color: THREAD }}>마지막까지 함께해 주세요</strong> 🙏<br />
            사주는 단지 방향을 알려주는 나침반이에요. 결국 인연은 본인이 만들어가는 결이에요.
          </div>
        </>
      )}
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
