"use client";
import { useState } from "react";
import {
  RelationshipKind, MeetDuration, Depth,
  RELATIONSHIP_LABEL, DURATION_LABEL, DEPTH_LABEL,
  InyeonEntryChoice,
} from "@/lib/inyeon/types";

const ACCENT = "#f0a8b8";
const GOLD = "#FFD700";
const BG = "#2a1a1d";
const BG_INNER = "#1a0d10";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (choice: InyeonEntryChoice) => void;
}

const REL_OPTIONS: RelationshipKind[] = [
  "crush", "talking", "dating_short", "dating_long",
  "engaged", "married", "exboyfriend",
];
const DUR_OPTIONS: MeetDuration[] = ["lt_1m", "1to3m", "3to6m", "6mto1y", "1to3y", "gt_3y"];
const DEPTH_OPTIONS: Depth[] = ["basic", "detail", "deep"];

export default function EntryModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rel, setRel] = useState<RelationshipKind | null>(null);
  const [dur, setDur] = useState<MeetDuration | null>(null);
  const [depth, setDepth] = useState<Depth | null>(null);

  if (!open) return null;

  const canNext =
    (step === 1 && rel) || (step === 2 && dur) || (step === 3 && depth);

  const handleNext = () => {
    if (step === 1 && rel) setStep(2);
    else if (step === 2 && dur) setStep(3);
    else if (step === 3 && rel && dur && depth) {
      onSubmit({ relationship: rel, duration: dur, depth });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: BG, border: `1px solid ${ACCENT}33` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-1 rounded-full transition-all"
                style={{
                  width: step === n ? 24 : 12,
                  background: step >= n ? ACCENT : `${ACCENT}33`,
                }}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: `${ACCENT}aa` }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {step === 1 && (
            <>
              <h3
                className="text-base font-bold mb-1"
                style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
              >
                두 분은 어떤 관계이신가요?
              </h3>
              <p className="text-xs mb-4" style={{ color: `${ACCENT}aa` }}>
                관계에 맞춰 풀이의 결이 바뀌어요
              </p>
              <div className="flex flex-col gap-2">
                {REL_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRel(r)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: rel === r ? `${ACCENT}22` : BG_INNER,
                      border: `1px solid ${rel === r ? ACCENT : `${ACCENT}22`}`,
                      color: rel === r ? "#fef3c7" : "#d6cdb8",
                    }}
                  >
                    {RELATIONSHIP_LABEL[r]}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3
                className="text-base font-bold mb-1"
                style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
              >
                두 분이 알고 지낸 기간은요?
              </h3>
              <p className="text-xs mb-4" style={{ color: `${ACCENT}aa` }}>
                기간에 따라 드러나는 결이 달라요
              </p>
              <div className="flex flex-col gap-2">
                {DUR_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDur(d)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: dur === d ? `${ACCENT}22` : BG_INNER,
                      border: `1px solid ${dur === d ? ACCENT : `${ACCENT}22`}`,
                      color: dur === d ? "#fef3c7" : "#d6cdb8",
                    }}
                  >
                    {DURATION_LABEL[d]}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3
                className="text-base font-bold mb-1"
                style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
              >
                얼마나 자세히 알려드릴까요?
              </h3>
              <p className="text-xs mb-4" style={{ color: `${ACCENT}aa` }}>
                풀이의 깊이를 골라주세요
              </p>
              <div className="flex flex-col gap-2">
                {DEPTH_OPTIONS.map((dp) => (
                  <button
                    key={dp}
                    onClick={() => setDepth(dp)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: depth === dp ? `${ACCENT}22` : BG_INNER,
                      border: `1px solid ${depth === dp ? ACCENT : `${ACCENT}22`}`,
                      color: depth === dp ? "#fef3c7" : "#d6cdb8",
                    }}
                  >
                    {DEPTH_LABEL[dp]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{
                background: BG_INNER,
                border: `1px solid ${ACCENT}33`,
                color: "#d6cdb8",
              }}
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: canNext ? ACCENT : `${ACCENT}33`,
              color: canNext ? BG : `${ACCENT}88`,
              opacity: canNext ? 1 : 0.6,
            }}
          >
            {step === 3 ? "다음으로" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
