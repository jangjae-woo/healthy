"use client";
// 시그니처 모티프: 원형 봉인(封印) — 메인 사자성어 + 보조 4 칩 비대칭
import type { SajuAnalysis } from "@/lib/saju-calculator";
import { deriveFateKeyword } from "@/lib/inyeon-deriver";

const GOLD = "#e4b840";
const ACCENT = "#d4a8e8";
const CRIMSON = "#a63449";
const CRIMSON_BG = "#3a0f1a";

export default function FateKeyword({ saju }: { saju: SajuAnalysis }) {
  const k = deriveFateKeyword(saju);
  return (
    <div className="rounded-2xl p-5 mb-4 flex flex-col items-center" style={{ background: `${ACCENT}0a`, border: `1px solid ${ACCENT}33` }}>
      <div className="text-[11px] tracking-[0.3em] mb-4" style={{ color: `${ACCENT}aa`, fontFamily: "'Noto Serif KR', serif" }}>
        運命之語 · 당신 인연의 한 단어
      </div>
      {/* 원형 봉인(封印) */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 40%, ${CRIMSON_BG} 0%, #0a0508 100%)`,
          border: `3px solid ${CRIMSON}`,
          boxShadow: `0 0 24px ${CRIMSON}55, inset 0 0 16px ${CRIMSON}33`,
        }}
      >
        {/* 외곽 도트 (인장 테두리) */}
        <div
          className="absolute"
          style={{
            inset: 6,
            borderRadius: "50%",
            border: `1px dashed ${GOLD}55`,
          }}
        />
        <div
          style={{
            fontFamily: "'Ma Shan Zheng', serif",
            fontSize: 28,
            color: "#ffe9aa",
            lineHeight: 1.1,
            letterSpacing: "0.05em",
            textAlign: "center",
            textShadow: `0 0 10px ${GOLD}88`,
            padding: "0 12px",
          }}
        >
          {k.mainHanja}
        </div>
      </div>
      <div className="mt-3 mb-4 text-center">
        <div className="text-[12px] tracking-[0.18em]" style={{ color: GOLD, fontFamily: "'Noto Serif KR', serif" }}>
          {k.main}
        </div>
      </div>
      {/* 보조 4 칩 */}
      {k.others.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[300px]">
          {k.others.map((o, i) => (
            <div
              key={i}
              className="px-2.5 py-1 rounded-full text-[10px]"
              style={{
                background: `${GOLD}10`,
                border: `1px solid ${GOLD}33`,
                color: `${GOLD}cc`,
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
