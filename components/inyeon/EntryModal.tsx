"use client";
import { useState } from "react";
import {
  RelationshipKind, MeetDuration,
  RELATIONSHIP_LABEL, DURATION_LABEL,
  InyeonEntryChoice,
} from "@/lib/inyeon/types";

// 홍실 팔레트
const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const GOLD_LIGHT = "#d4a96b";
const INK = "#2a1722";
const INK_SOFT = "#2a1a20";
const CREAM = "#fbf3e8";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (choice: InyeonEntryChoice) => void;
}

const REL_OPTIONS: RelationshipKind[] = [
  "crush", "talking", "dating_short", "dating_long",
  "married", "exboyfriend",
];
const DUR_OPTIONS: MeetDuration[] = ["lt_1m", "1to3m", "3to6m", "6mto1y", "1to3y", "gt_3y"];

export default function EntryModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rel, setRel] = useState<RelationshipKind | null>(null);
  const [dur, setDur] = useState<MeetDuration | null>(null);

  if (!open) return null;

  const canNext = (step === 1 && rel) || (step === 2 && dur);

  const handleNext = () => {
    if (step === 1 && rel) setStep(2);
    else if (step === 2 && rel && dur) {
      onSubmit({ relationship: rel, duration: dur });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3"
      style={{ background: "rgba(106,30,58,0.55)" }}
      onClick={onClose}
    >
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
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-1 rounded-full transition-all"
                style={{
                  width: step === n ? 28 : 14,
                  background: step >= n ? THREAD : "rgba(212,169,107,0.35)",
                }}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: GOLD }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {step === 1 && (
            <>
              <div
                className="text-[10px] tracking-[0.4em] mb-2"
                style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
              >
                STEP 01 · 紅 絲
              </div>
              <h3
                className="text-[18px] font-bold mb-2"
                style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "-0.01em" }}
              >
                두 분은 어떤 관계이신가요?
              </h3>
              <p className="text-[13px] mb-4" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
                관계에 맞춰 풀이의 결이 바뀌어요
              </p>
              <div className="flex flex-col gap-2.5">
                {REL_OPTIONS.map((r) => {
                  const active = rel === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRel(r)}
                      className="w-full text-left px-4 py-3.5 rounded-md text-[14px] transition-all active:scale-[0.99]"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)`
                          : "rgba(255,255,255,0.7)",
                        border: `1.5px solid ${active ? THREAD : "rgba(212,169,107,0.35)"}`,
                        color: active ? PLUM : INK,
                        fontFamily: "'Gowun Batang', serif",
                        fontWeight: active ? 700 : 400,
                        boxShadow: active ? `0 4px 12px -4px ${THREAD}33` : "none",
                      }}
                    >
                      {RELATIONSHIP_LABEL[r]}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div
                className="text-[10px] tracking-[0.4em] mb-2"
                style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
              >
                STEP 02 · 紅 絲
              </div>
              <h3
                className="text-[18px] font-bold mb-2"
                style={{ color: INK, fontFamily: "'Nanum Myeongjo', serif", letterSpacing: "-0.01em" }}
              >
                두 분이 알고 지낸 기간은요?
              </h3>
              <p className="text-[13px] mb-4" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
                기간에 따라 드러나는 결이 달라요
              </p>
              <div className="flex flex-col gap-2.5">
                {DUR_OPTIONS.map((d) => {
                  const active = dur === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setDur(d)}
                      className="w-full text-left px-4 py-3.5 rounded-md text-[14px] transition-all active:scale-[0.99]"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${THREAD}1a, ${PLUM}10)`
                          : "rgba(255,255,255,0.7)",
                        border: `1.5px solid ${active ? THREAD : "rgba(212,169,107,0.35)"}`,
                        color: active ? PLUM : INK,
                        fontFamily: "'Gowun Batang', serif",
                        fontWeight: active ? 700 : 400,
                        boxShadow: active ? `0 4px 12px -4px ${THREAD}33` : "none",
                      }}
                    >
                      {DURATION_LABEL[d]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 pb-5 pt-3 flex gap-2"
          style={{ borderTop: `1px solid rgba(212,169,107,0.25)` }}
        >
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2)}
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
            className="flex-1 py-3 rounded-md text-[14px] font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canNext ? `linear-gradient(135deg, ${THREAD}, ${PLUM})` : "rgba(212,169,107,0.2)",
              color: canNext ? CREAM : GOLD,
              fontFamily: "'Gowun Batang', serif",
              letterSpacing: "0.05em",
              boxShadow: canNext ? `0 6px 16px -4px ${THREAD}66` : "none",
            }}
          >
            {step === 2 ? "다음으로 ›" : "다음 ›"}
          </button>
        </div>
      </div>
    </div>
  );
}
