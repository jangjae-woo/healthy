"use client";
import { Suspense } from "react";
import MatchingSlideResult from "@/components/SoloMatchingSlideResult";

const ACCENT = "#d4a8e8";
const BG = "#1a0f20";

export default function MatchingResultPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: BG }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
          />
        </div>
      }
    >
      <MatchingSlideResult />
    </Suspense>
  );
}
