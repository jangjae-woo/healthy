"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { SajuAnalysis } from "@/lib/saju-calculator";
// 기존 시각화 (유지)
import PillarTable from "@/components/inyeon-visuals/PillarTable";
import EssenceKeywords from "@/components/inyeon-visuals/EssenceKeywords";
import IdealTypeCards from "@/components/inyeon-visuals/IdealTypeCards";
import SeunGrid from "@/components/inyeon-visuals/SeunGrid";
import SipseongAxes from "@/components/inyeon-visuals/SipseongAxes";
import JagukTable from "@/components/inyeon-visuals/JagukTable";
import ByeongoCard from "@/components/inyeon-visuals/ByeongoCard";
import InyeonSajaCard from "@/components/inyeon-visuals/InyeonSajaCard";
// 시그니처 격상 — 각자 고유 모티프 (시계·인장·두루마리·방사별·나침반·봉인)
import InyeonClock from "@/components/inyeon-visuals/InyeonClock";
import HeavenSinsal from "@/components/inyeon-visuals/HeavenSinsal";
import PrevLifeIlju from "@/components/inyeon-visuals/PrevLifeIlju";
import InyeonCoordinate from "@/components/inyeon-visuals/InyeonCoordinate";
import InyeonCompass from "@/components/inyeon-visuals/InyeonCompass";
import FateKeyword from "@/components/inyeon-visuals/FateKeyword";

type VisualKey =
  | "pillar" | "essence" | "saja"
  | "idealType" | "seun"
  | "sipseongAxes" | "jaguk" | "byeongo"
  // 시그니처 격상
  | "clock" | "heavenSinsal" | "prevIlju" | "coord" | "compass" | "fateKeyword";

// page.sub + 챕터/페이지 위치 → 시각화 컴포넌트 매핑
// 새 소제목명에 맞춘 부분 매칭 (사용자 이름 변동 대응)
function pickVisual(sub: string, chapterIdx: number, pageIdx: number): VisualKey | null {
  // 序章: 두 번째 단락(한 줄 인연)에 사자성어 카드
  if (chapterIdx === 0) {
    if (pageIdx === 1) return "saja";
    return null;
  }
  if (!sub) return null;
  // 第一章 本 — 당신은 왜 아직 혼자인가
  if (sub.includes("한 줄로 말하면")) return "pillar";          // 4기둥 정밀표
  if (sub.includes("모르는") && sub.includes("한 면")) return "prevIlju"; // 두루마리
  if (sub.includes("사랑의 패")) return "essence";              // 키워드 칩
  // 第二章 戀 — 당신이 사랑에 빠지는 그 순간
  if (sub.includes("사랑에 빠지는 순간")) return "sipseongAxes"; // 5축 막대
  if (sub.includes("둘 사이가 어긋날 때")) return "jaguk";       // 충 검출
  // 第三章 引 — 당신을 흔드는 그 사람의 정체
  if (sub.includes("무너지는 그 결")) return "coord";            // 방사별
  if (sub.includes("운명에 새겨진 이상형")) return "idealType";   // 4 이상형 카드
  if (sub.includes("가장 빛나는 순간")) return "heavenSinsal";    // 빨간 사각 인장
  // 第四章 遇 — 그를 만나게 될 자리
  if (sub.includes("만나게 될 자리")) return "compass";          // 나침반
  // 第五章 時 — 그가 다가오는 시간이 보입니다
  if (sub.includes("가장 가까이 오는 때")) return "clock";        // 원형 시계
  if (sub.startsWith("올해") || sub.includes("병오년")) return "byeongo";
  if (sub.includes("내년") && sub.includes("그 너머")) return "seun";
  // 終章 — 홍도인이 마지막으로 남기는 글
  if (sub.includes("한 단어로")) return "fateKeyword";           // 원형 봉인
  if (sub.includes("마지막으로 남기는 글")) return "saja";
  return null;
}

const ACCENT = "#d4a8e8";
const GOLD = "#e4b840";
const BG = "#1a0f20";

const CHAPTER_TITLES = [
  "홍도인의 첫마디",
  "당신은 왜 아직 혼자인가",
  "당신이 사랑에 빠지는 그 순간",
  "당신을 흔드는 그 사람의 정체",
  "그를 만나게 될 자리, 보입니다",
  "그가 다가오는 시간이 보입니다",
  "당신만 모르는 당신의 사랑",
  "홍도인이 마지막으로 남기는 글",
];

const CHAPTER_HANJA = ["序", "本", "戀", "引", "遇", "時", "愼", "終"];

const CHAPTER_LABELS = [
  "序章",
  "第一章",
  "第二章",
  "第三章",
  "第四章",
  "第五章",
  "第六章",
  "終章",
];

interface Page { sub: string; body: string; }
interface Section { title: string; pages: Page[]; }

function parseSections(md: string): Section[] {
  if (!md) return [];
  const sections: Section[] = [];
  const parts = md.split(/\n##\s+/);
  for (let idx = 0; idx < parts.length; idx++) {
    const part = idx === 0 ? parts[0].replace(/^##\s+/, "") : parts[idx];
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const title = lines[0].trim();
    const rest = lines.slice(1).join("\n").trim();
    const subParts = rest.split(/\n###\s+/);
    const pages: Page[] = [];
    if (subParts.length === 1) {
      if (rest) pages.push({ sub: "", body: rest });
    } else {
      const intro = subParts[0].trim();
      if (intro) pages.push({ sub: "", body: intro });
      for (let i = 1; i < subParts.length; i++) {
        const subLines = subParts[i].split("\n");
        const sub = subLines[0].trim();
        const body = subLines.slice(1).join("\n").trim();
        if (sub || body) pages.push({ sub, body });
      }
    }
    sections.push({ title, pages });
  }
  return sections;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={key++} style={{ color: GOLD }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function SoloMatchingSlideResult() {
  const params = useSearchParams();
  const [content, setContent] = useState("");
  const [saju, setSaju] = useState<SajuAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chapterIdx, setChapterIdx] = useState(0);
  const fetchedRef = useRef(false);

  const myName = params.get("myName") || "당신";
  const myYear = parseInt(params.get("myYear") || "0", 10);
  const currentAge = myYear > 0 ? Math.max(1, 2026 - myYear + 1) : 30;

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
      contactFreq: params.get("contactFreq") || "",
      meetCount: params.get("meetCount") || "",
      soloReason: params.get("soloReason") || "",
    };

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) { setError(true); setLoading(false); return; }
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
                setSaju(msg.d.sajuA);
                setLoading(false);
              } else if (msg.t === "x" && msg.v) {
                full += msg.v;
                setContent(full);
              }
            } catch {}
          }
        }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [params, myName]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [chapterIdx]);

  const sections = parseSections(content);
  const totalChapters = CHAPTER_TITLES.length;
  const cur = sections[chapterIdx];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
          <div className="text-sm" style={{ color: `${ACCENT}cc` }}>홍도인이 사주를 살피는 중입니다…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: BG }}>
        <div className="text-center">
          <div className="text-base mb-3" style={{ color: ACCENT }}>풀이를 가져오지 못했습니다.</div>
          <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-lg text-sm font-bold" style={{ background: GOLD, color: "#1a0d00" }}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BG} 0%, #0a0510 100%)`, fontFamily: "'Gowun Batang', 'Noto Serif KR', serif" }}>
      <main className="w-full max-w-[480px] mx-auto px-5 py-8">
        {/* 상단 진행 */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[11px] tracking-[0.18em]" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
            {chapterIdx + 1} / {totalChapters}
          </div>
          <div className="text-[10px]" style={{ color: `${ACCENT}66` }}>{myName}님의 인연</div>
        </div>

        {/* 챕터 cover */}
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.4em] mb-3" style={{ color: `${GOLD}cc`, fontFamily: "'Noto Serif KR', serif" }}>
            {CHAPTER_LABELS[chapterIdx]}
          </div>
          <div style={{ fontFamily: "'Ma Shan Zheng', serif", fontSize: 80, color: GOLD, lineHeight: 1, textShadow: `0 0 24px ${GOLD}55` }}>
            {CHAPTER_HANJA[chapterIdx]}
          </div>
          <h2 className="mt-4 text-lg font-bold" style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif", letterSpacing: "0.04em" }}>
            {CHAPTER_TITLES[chapterIdx]}
          </h2>
        </div>

        {/* 본문 */}
        {cur ? (
          <div className="flex flex-col gap-7 mb-10">
            {cur.pages.map((p, i) => {
              const visual = pickVisual(p.sub, chapterIdx, i);
              return (
                <div key={i} className="rounded-2xl p-5" style={{ background: `${ACCENT}0d`, border: `1px solid ${ACCENT}1f` }}>
                  {p.sub && (
                    <div className="text-[14px] font-semibold mb-3" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
                      {p.sub}
                    </div>
                  )}
                  {/* 시각화 — 각자 시그니처 모티프 */}
                  {saju && visual === "pillar" && <PillarTable saju={saju} />}
                  {saju && visual === "prevIlju" && <PrevLifeIlju saju={saju} />}
                  {saju && visual === "essence" && <EssenceKeywords saju={saju} />}
                  {saju && visual === "sipseongAxes" && <SipseongAxes saju={saju} />}
                  {saju && visual === "jaguk" && <JagukTable saju={saju} />}
                  {saju && visual === "coord" && <InyeonCoordinate saju={saju} />}
                  {saju && visual === "idealType" && <IdealTypeCards saju={saju} />}
                  {saju && visual === "heavenSinsal" && <HeavenSinsal saju={saju} />}
                  {saju && visual === "compass" && <InyeonCompass saju={saju} />}
                  {saju && visual === "clock" && <InyeonClock saju={saju} currentAge={currentAge} />}
                  {saju && visual === "byeongo" && <ByeongoCard saju={saju} />}
                  {visual === "seun" && <SeunGrid />}
                  {saju && visual === "fateKeyword" && <FateKeyword saju={saju} />}
                  {saju && visual === "saja" && <InyeonSajaCard saju={saju} />}
                  <div className="text-[14px] leading-[1.85]" style={{ color: "#e8dfc6" }}>
                    {p.body.split("\n\n").map((para, j) => (
                      <p key={j} className="mb-3 last:mb-0 whitespace-pre-wrap">{renderInline(para)}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-sm py-12" style={{ color: `${ACCENT}88` }}>
            이 장의 풀이를 받아오는 중입니다…
          </div>
        )}

        {/* 하단 nav */}
        <div className="flex items-center justify-between gap-3 mt-6 pb-6">
          <button onClick={() => setChapterIdx(Math.max(0, chapterIdx - 1))} disabled={chapterIdx === 0}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: chapterIdx === 0 ? `${ACCENT}0d` : `${ACCENT}1f`,
              color: chapterIdx === 0 ? `${ACCENT}55` : "white",
              border: `1px solid ${ACCENT}33`,
            }}>
            ‹ 이전 장
          </button>
          <button onClick={() => setChapterIdx(Math.min(totalChapters - 1, chapterIdx + 1))} disabled={chapterIdx === totalChapters - 1}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: chapterIdx === totalChapters - 1 ? `${ACCENT}0d` : "linear-gradient(135deg, #FFE066 0%, #FFD700 40%, #FFA800 100%)",
              color: chapterIdx === totalChapters - 1 ? `${ACCENT}55` : "#1a0d00",
              border: `1px solid ${ACCENT}33`,
            }}>
            다음 장 ›
          </button>
        </div>
      </main>
    </div>
  );
}
