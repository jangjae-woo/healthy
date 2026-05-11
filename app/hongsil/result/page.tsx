"use client";
import { Suspense, useEffect, useRef, useState } from "react";
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
import { renderParagraphs } from "@/lib/inline-emphasis";
import { derivePatternTags } from "@/lib/hongsil/pattern-tags";
import OpeningVideo from "@/components/OpeningVideo";

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
        {renderParagraphs(body, GOLD)}
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
    const text = `난 #${me.name}이래! 운명 짝꿍은 #${destiny.name}\n사주가 읽어주는 내 인연 — paljawon.com/love`;
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
          <div style={{ color: GOLD, fontSize: 12 }}>✦ {destiny.signal}</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, color: GOLD, fontSize: 10, letterSpacing: "0.2em" }}>
          paljawon.com/love
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
          <div className="text-[11px] mt-2" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif", fontWeight: 600 }}>
            ✦ {destiny.signal}
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
function DaeunTimeline({ daeun, birthYear, currentYear }: {
  daeun: { cycles: { age: number; ganji: string }[] };
  birthYear: number;
  currentYear: number;
}) {
  const currentAge = currentYear - birthYear;
  // 60세 이하 대운까지만 표시 (사랑 풀이에서 노년 대운 인용 차단)
  const cycles = daeun.cycles.filter(c => c.age <= 60).slice(0, 7);
  return (
    <div className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
        boxShadow: "0 6px 20px -8px rgba(178,40,71,0.12)",
      }}>
      <div className="text-[14px] font-bold mb-1 text-center" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
        대운(大運) — 10년 단위 큰 흐름
      </div>
      <div className="text-[11px] mb-4 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        ▾ 현재 위치 강조
      </div>
      <div className="space-y-1.5">
        {cycles.map((c, i) => {
          const startYear = birthYear + c.age;
          const endAge = i + 1 < cycles.length ? cycles[i + 1].age - 1 : c.age + 9;
          const endYear = birthYear + endAge;
          const isCurrent = currentAge >= c.age && currentAge <= endAge;
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded"
              style={{
                background: isCurrent ? `${THREAD}12` : "transparent",
                border: isCurrent ? `1.5px solid ${THREAD}66` : "1px solid rgba(212,169,107,0.2)",
              }}>
              <div className="text-[12px] font-bold w-12 flex-shrink-0" style={{ color: isCurrent ? THREAD : INK_SOFT, fontFamily: "'Cormorant Garamond', serif" }}>
                {c.age}~{endAge}세
              </div>
              <div className="text-[16px] font-black w-10 text-center" style={{ color: isCurrent ? THREAD : PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
                {c.ganji}
              </div>
              <div className="text-[11px] flex-1" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
                {startYear}~{endYear}년
              </div>
              {isCurrent && <div className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: THREAD, color: "#fff" }}>지금</div>}
            </div>
          );
        })}
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
      <div className="text-[12px] px-4 py-2 rounded-full inline-block"
        style={{ background: `${destiny.color}1a`, border: `1px solid ${destiny.color}66`, color: destiny.color, fontFamily: "'Gowun Batang', serif", fontWeight: 600 }}>
        ✦ {destiny.signal}
      </div>
    </div>
  );
}

// 4장 — 갈등 패턴 chip 카드 (결정론 태그)
function PatternTagsCard({ tags }: { tags: string[] }) {
  return (
    <div className="rounded-md p-4"
      style={{ background: "rgba(255,235,240,0.6)", border: "1px dashed rgba(200,32,58,0.4)" }}>
      <div className="text-[13px] mb-3 text-center font-bold"
        style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "0.05em" }}>
        반복 패턴 결
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {tags.map((t) => (
          <span key={t} className="text-[12px] px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(200,32,58,0.12)",
              border: "1px solid rgba(200,32,58,0.4)",
              color: PLUM,
              fontFamily: "'Gowun Batang', serif",
            }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// 5장 — 욕구 4분면 BiBar (Q2 욕망 표시)
function DesireBar({ desire }: { desire: LoveDesire }) {
  const items: { label: string; key: LoveDesire; color: string }[] = [
    { label: "단단한 사랑", key: "stable", color: "#7eb6ff" },
    { label: "짜릿한 사랑", key: "intense", color: "#c8203a" },
    { label: "자연스러운", key: "natural", color: "#7dd3c0" },
    { label: "결혼 사랑", key: "marriage", color: "#b88646" },
  ];
  return (
    <div className="rounded-md p-5"
      style={{
        background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
        border: "1px solid rgba(212,169,107,0.4)",
      }}>
      <div className="text-[14px] font-bold mb-1 text-center" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
        본능 욕구 — 4 가지 결
      </div>
      <div className="text-[11px] mb-4 text-center" style={{ color: GOLD, fontFamily: "'Gowun Batang', serif" }}>
        본인 선택: {LOVE_DESIRE_LABEL[desire].split(" — ")[0]}
      </div>
      <div className="space-y-2.5">
        {items.map((it) => {
          const isActive = it.key === desire;
          return (
            <div key={it.key} className="flex items-center gap-2">
              <div className="w-20 text-[12px] font-bold"
                style={{ color: isActive ? it.color : INK_SOFT, fontFamily: "'Nanum Myeongjo', serif" }}>
                {it.label}
              </div>
              <div className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ background: "rgba(212,169,107,0.15)" }}>
                <div style={{
                  width: isActive ? "100%" : "30%",
                  height: "100%",
                  background: isActive ? it.color : `${it.color}66`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              {isActive && <div className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: it.color, color: "#fff" }}>본능</div>}
            </div>
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
          paljawon.com / love
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
  if (!data || !openingDone) {
    return <OpeningVideo
      dataReady={!!data}
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

  return (
    <ChapterShell
      chapterNo={chapter}
      chapterTitle={
        chapter === 1 ? ""
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
          <Section title={`${meName}님의 사주`}>
            <SajuTable name={meName} birthLine={meBirth}
              hour={pillars.hour} day={pillars.day} month={pillars.month} year={pillars.year} />
            <OhaengChart name={meName} counts={me.elements} ratios={ratios} />
            <YongsinCards yongsin={me.yongsin} huisin="" gisin="" />
            <SinKangBar ilgan={me.ilgan} stage={me.shinkang} />
          </Section>
          <Section title="내 매력과 연애 스타일">
            {data.character && <CharacterIntroCard name={meName} character={data.character} />}
            <ChSub ch={1} title="내 매력은?" fallback={`${meName}님의 본질적 매력을 풀어드리고 있어요.`} />
            <ChSub ch={1} title="썸 단계 결정적 매력" fallback="썸 시점에 발휘되는 결정적 매력을 풀어드리고 있어요." />
            <ChSub ch={1} title="사랑하면 변하는 나" fallback="사랑에 빠지면 변하는 결을 풀어드리고 있어요." />
            <ChSub ch={1} title="밀당녀 vs 직진녀" fallback="자가 답과 사주 결과를 비교해드리고 있어요." />
          </Section>
        </>
      )}

      {chapter === 2 && (
        <Section title="사랑이 오는 타이밍">
          {me.daeun && <DaeunTimeline daeun={me.daeun} birthYear={parseInt(sp.get("meYear") || "0", 10)} currentYear={new Date().getFullYear()} />}
          <ChSub ch={2} title="인생 전체, 사랑의 큰 흐름" fallback="일생 연애운 곡선을 풀어드리고 있어요." />
          <ChSub ch={2} title="솔로 탈출은 언제?" fallback="활동 vs 기다림 분류로 솔로 탈출 시기를 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 3 && (
        <>
          {data.character && <DestinyHeroCard destiny={data.character.destiny} name={meName} />}
          <Section title="내 짝꿍 미리 보기">
            <ChSub ch={3} title="내 짝꿍은 누구일까?" fallback={`${meName}님의 운명 짝꿍을 12 캐릭터 중에서 풀어드리고 있어요.`} />
            <ChSub ch={3} title="운명을 알아보는 단서" fallback="짝꿍이 다가올 때 결정적 사인을 풀어드리고 있어요." />
            <ChSub ch={3} title="운명을 잡는 한 수" fallback="적극 어필·매력 발휘 행동을 풀어드리고 있어요." />
          </Section>
        </>
      )}

      {chapter === 4 && (
        <Section title="내 사랑 흑역사 — 반복되는 그 패턴">
          <PatternTagsCard tags={derivePatternTags(me as unknown as Parameters<typeof derivePatternTags>[0], duration)} />
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
          <DesireBar desire={desire} />
          <ChSub ch={5} title="내 본능이 원하는 욕구" fallback="본능이 원하는 사랑·잠자리 욕구를 풀어드리고 있어요." />
          <ChSub ch={5} title="둘이 가장 깊어지는 분위기" fallback="가장 깊어지는 결의 분위기·시기를 풀어드리고 있어요." />
        </Section>
      )}

      {chapter === 6 && (
        <>
          <Section title="홍도인의 마지막 한 마디">
            <ChSub ch={6} title="홍도인의 마지막 편지" fallback="편지를 정리하고 있어요…" />
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
            style={{ background: "rgba(255,235,240,0.7)", border: "1px dashed rgba(200,32,58,0.45)", color: INK, fontFamily: "'Gowun Batang', serif" }}>
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
