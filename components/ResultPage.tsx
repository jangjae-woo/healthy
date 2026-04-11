"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { type SajuAnalysis } from "@/lib/saju-calculator";

const SajuChart = dynamic(() => import("@/components/SajuChart"), { ssr: false });

const SECTION_META: Record<string, { title: string; emoji: string }[]> = {
  saju: [
    { title: "사주 기본 분석",  emoji: "📖" },
    { title: "운세 흐름",       emoji: "🌊" },
    { title: "인연 & 미래",     emoji: "💕" },
  ],
  "new-year": [
    { title: "2026년 총운 & 재물", emoji: "🌟" },
    { title: "관계 & 건강 & 직업", emoji: "💪" },
    { title: "월별운 & 행운 키워드", emoji: "📅" },
  ],
  "saju-love": [
    { title: "나의 연애 스타일", emoji: "💘" },
    { title: "인연 & 시기",      emoji: "🌸" },
    { title: "결혼 & 조언",      emoji: "💍" },
  ],
  face: [
    { title: "관상 & 기질",   emoji: "👁" },
    { title: "재물 & 직업운", emoji: "💰" },
    { title: "건강 & 종합",   emoji: "🌿" },
  ],
};

type SectionState = { status: "loading" | "done" | "error"; content: string };

interface Props {
  type: string; accent: string; bg: string;
  backHref: string; emoji: string; title: string;
}

function formatText(text: string, accent: string) {
  return text.split("\n").map((line, i) => {
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      return (
        <h3 key={i} className="text-sm font-bold mt-5 mb-2" style={{ color: accent }}>
          {line.replace(/\*\*/g, "")}
        </h3>
      );
    }
    if (/\*\*[^*]+\*\*/.test(line)) {
      return (
        <p key={i} className="text-sm leading-relaxed text-white/90 mb-1">
          {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
            /^\*\*[^*]+\*\*$/.test(part)
              ? <strong key={j} style={{ color: accent }}>{part.replace(/\*\*/g, "")}</strong>
              : part
          )}
        </p>
      );
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="text-sm leading-relaxed text-white/80 ml-4 mb-1 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i} className="text-sm leading-relaxed text-white/85 mb-1">{line}</p>;
  });
}

function Spinner({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <div
        className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${accent}44`, borderTopColor: accent }}
      />
      <p className="text-xs" style={{ color: `${accent}77` }}>분석 중...</p>
    </div>
  );
}

export default function ResultPage({ type, accent, bg, backHref, emoji, title }: Props) {
  const params = useSearchParams();
  const [sections, setSections] = useState<SectionState[]>([
    { status: "loading", content: "" },
    { status: "loading", content: "" },
    { status: "loading", content: "" },
  ]);
  const [sajuData, setSajuData]   = useState<SajuAnalysis | null>(null);
  const [step, setStep]           = useState(0); // 현재 보여주는 마지막 섹션 인덱스

  const name         = params.get("name")         || "";
  const gender       = params.get("gender")       || "";
  const year         = params.get("year")         || "";
  const month        = params.get("month")        || "";
  const day          = params.get("day")          || "";
  const hour         = params.get("hour")         || "";
  const calendarType = params.get("calendarType") || "양력";

  useEffect(() => {
    const body = { type, name, gender, year, month, day, hour, calendarType };
    // 3개 동시 호출 (백그라운드 준비)
    [1, 2, 3].forEach((sec) => {
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, section: sec }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setSections((prev) => {
            const next = [...prev];
            next[sec - 1] = { status: "done", content: data.result };
            return next;
          });
          if (sec === 1 && data.sajuData) setSajuData(data.sajuData);
        })
        .catch(() => {
          setSections((prev) => {
            const next = [...prev];
            next[sec - 1] = { status: "error", content: "" };
            return next;
          });
        });
    });
  }, []);

  const metas    = SECTION_META[type] || SECTION_META.saju;
  const cur      = sections[step];          // 현재 섹션 상태
  const hasNext  = step < 2;               // 다음 섹션 있음
  const nextMeta = hasNext ? metas[step + 1] : null;
  const isLast   = step === 2;

  // 다음 버튼 클릭
  const goNext = () => {
    if (hasNext) setStep((s) => s + 1);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: `linear-gradient(180deg, ${bg} 0%, #1a0d00 100%)` }}
    >
      {/* 뒤로 */}
      <div className="w-full max-w-sm mb-6">
        <Link href={backHref} className="flex items-center gap-1 text-sm" style={{ color: `${accent}88` }}>
          ← 뒤로
        </Link>
      </div>

      {/* 헤더 */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{emoji}</div>
        <h1 className="text-xl font-bold text-white">{name}님의 {title}</h1>
        <p className="text-xs mt-1" style={{ color: `${accent}77` }}>
          {year}.{month}.{day} ({calendarType}) · {gender} · {hour}
        </p>
        {/* 단계 표시 */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {metas.map((m, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i <= step ? accent : `${accent}33`,
                  transform: i === step ? "scale(1.3)" : "scale(1)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 사주원국 시각화 (step 0에만 표시) */}
      {sajuData && step === 0 && (
        <div className="w-full max-w-sm mb-6">
          <SajuChart data={sajuData} accent={accent} />
        </div>
      )}

      {/* 현재 섹션 카드 */}
      <div className="w-full max-w-sm mb-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${accent}22`, backgroundColor: `${accent}08` }}
        >
          {/* 섹션 헤더 */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: `1px solid ${accent}15`, backgroundColor: `${accent}12` }}
          >
            <span className="text-lg">{metas[step].emoji}</span>
            <span className="text-sm font-bold" style={{ color: accent }}>
              {metas[step].title}
            </span>
            <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${accent}22`, color: `${accent}cc` }}>
              {step + 1} / 3
            </span>
          </div>

          {/* 섹션 내용 */}
          <div className="px-4 py-4">
            {cur.status === "loading" && <Spinner accent={accent} />}
            {cur.status === "error" && (
              <p className="text-red-400 text-xs py-6 text-center">
                풀이 생성에 실패했습니다. 새로고침 해주세요.
              </p>
            )}
            {cur.status === "done" && (
              <div className="space-y-0">{formatText(cur.content, accent)}</div>
            )}
          </div>
        </div>
      </div>

      {/* 다음 버튼 / 다시 보기 */}
      <div className="w-full max-w-sm space-y-3">
        {cur.status === "done" && hasNext && (
          <button
            onClick={goNext}
            className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: accent, color: bg }}
          >
            <span>{nextMeta?.emoji}</span>
            <span>{nextMeta?.title} 보기</span>
            <span>→</span>
          </button>
        )}

        {/* 다음 섹션이 아직 로딩 중일 때 버튼 비활성 */}
        {cur.status === "done" && hasNext && sections[step + 1].status === "loading" && (
          <p className="text-center text-xs" style={{ color: `${accent}55` }}>
            다음 풀이 준비 중...
          </p>
        )}

        {isLast && cur.status === "done" && (
          <Link href={backHref}>
            <button
              className="w-full py-4 rounded-2xl text-sm font-bold tracking-wider"
              style={{ backgroundColor: `${accent}22`, color: accent, border: `1px solid ${accent}33` }}
            >
              다른 사주 보기
            </button>
          </Link>
        )}
      </div>
    </main>
  );
}
