"use client";
import { Suspense } from "react";
import ParentChildSlideResult from "@/components/ParentChildSlideResultV2";

const ACCENT = "#f0a8b8";
const BG = "#2a1a1d";

export default function ParentChildResultPage() {
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
      <ParentChildSlideResult />
    </Suspense>
  );
}
