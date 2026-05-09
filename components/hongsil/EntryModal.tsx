"use client";
import { useState } from "react";
import {
  HongsilEntryChoice,
  SoloDuration, LoveDesire, LoveStyle,
  SOLO_DURATION_LABEL, LOVE_DESIRE_LABEL, LOVE_STYLE_LABEL,
} from "@/lib/hongsil/types";

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK = "#2a1722";
const INK_SOFT = "#5a3c4a";
const CREAM = "#fbf3e8";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (choice: HongsilEntryChoice) => void;
}

const Q1_OPTIONS: SoloDuration[] = ["lt_6m", "6m_to_1y", "1y_to_3y", "gt_3y", "never"];
const Q2_OPTIONS: LoveDesire[] = ["stable", "intense", "natural", "marriage"];
const Q3_OPTIONS: LoveStyle[] = ["direct", "careful", "miyldang", "distant", "passive", "balance"];

export default function EntryModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [duration, setDuration] = useState<SoloDuration | null>(null);
  const [desire, setDesire] = useState<LoveDesire | null>(null);
  const [style, setStyle] = useState<LoveStyle | null>(null);

  if (!open) return null;

  const canNext = (step === 1 && duration) || (step === 2 && desire) || (step === 3 && style);

  const handleNext = () => {
    if (step === 1 && duration) setStep(2);
    else if (step === 2 && desire) setStep(3);
    else if (step === 3 && duration && desire && style) {
      onSubmit({ duration, desire, style });
    }
  };

  const renderStep = (
    titleEn: string,
    titleKo: string,
    sub: string,
    options: string[],
    selected: string | null,
    setter: (v: string) => void,
    label: Record<string, string>,
  ) => (
    <>
      <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
        {titleEn} · 紅 絲
      </div>
      <h3 className="text-[18px] font-bold mb-2" style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "-0.01em" }}>
        {titleKo}
      </h3>
      <p className="text-[13px] mb-4" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
        {sub}
      </p>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => setter(opt)}
              className="w-full text-left px-4 py-3.5 rounded-md text-[14px] transition-all active:scale-[0.99]"
              style={{
                background: active ? `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)` : "rgba(255,255,255,0.7)",
                border: `1.5px solid ${active ? THREAD : "rgba(212,169,107,0.35)"}`,
                color: active ? PLUM : INK,
                fontFamily: "'Gowun Batang', serif",
                fontWeight: active ? 700 : 400,
                boxShadow: active ? `0 4px 12px -4px ${THREAD}33` : "none",
              }}
            >
              {label[opt]}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3" style={{ background: "rgba(106,30,58,0.55)" }} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
            radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
            linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
          `,
          border: `1px solid rgba(212,169,107,0.4)`,
          boxShadow: `0 24px 60px -16px rgba(178,40,71,0.25)`,
          fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-1 rounded-full transition-all"
                style={{ width: step === n ? 28 : 14, background: step >= n ? THREAD : "rgba(212,169,107,0.35)" }} />
            ))}
          </div>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: GOLD }}>✕</button>
        </div>

        <div className="px-5 pb-5">
          {step === 1 && renderStep(
            "STEP 01", "솔로 기간이 얼마나 됐나요?", "기간에 맞춰 풀이의 결이 바뀌어요",
            Q1_OPTIONS, duration, (v) => setDuration(v as SoloDuration), SOLO_DURATION_LABEL as Record<string, string>,
          )}
          {step === 2 && renderStep(
            "STEP 02", "어떤 사랑을 원하시나요?", "원하는 사랑의 결을 알려주세요",
            Q2_OPTIONS, desire, (v) => setDesire(v as LoveDesire), LOVE_DESIRE_LABEL as Record<string, string>,
          )}
          {step === 3 && renderStep(
            "STEP 03", "본인의 사랑 스타일은요?", "자가 답과 사주 결과를 비교해드려요",
            Q3_OPTIONS, style, (v) => setStyle(v as LoveStyle), LOVE_STYLE_LABEL as Record<string, string>,
          )}
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-2" style={{ borderTop: `1px solid rgba(212,169,107,0.25)` }}>
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="flex-1 py-3 rounded-md text-[14px] active:scale-95 transition-all"
              style={{
                background: "rgba(255,255,255,0.7)",
                border: `1px solid rgba(212,169,107,0.5)`,
                color: PLUM,
                fontFamily: "'Gowun Batang', serif",
              }}
            >
              ‹ 이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="flex-1 py-3 rounded-md text-[14px] font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: canNext ? `linear-gradient(135deg, ${THREAD}, ${PLUM})` : "rgba(212,169,107,0.2)",
              color: canNext ? CREAM : GOLD,
              fontFamily: "'Gowun Batang', serif",
              letterSpacing: "0.05em",
              boxShadow: canNext ? `0 6px 16px -4px ${THREAD}66` : "none",
            }}
          >
            {step === 3 ? "풀이 시작 ›" : "다음 ›"}
          </button>
        </div>
      </div>
    </div>
  );
}
