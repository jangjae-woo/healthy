"use client";
import { Suspense } from "react";
import ParentChildSlideResult from "@/components/ParentChildSlideResultV2";

export default function LoveParentChildResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{
          background: `
            radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
            radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
            linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
          `,
        }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(200,32,58,0.2)", borderTopColor: "#c8203a" }} />
        </div>
      }
    >
      <ParentChildSlideResult />
    </Suspense>
  );
}
