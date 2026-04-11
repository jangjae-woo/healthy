"use client";
import Link from "next/link";
import SajuForm from "@/components/SajuForm";

export default function LoveFormPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(180deg, #2a0a1a 0%, #1a0d00 100%)" }}
    >
      <div className="w-full max-w-sm mb-6">
        <Link href="/saju-love" className="flex items-center gap-1 text-sm" style={{ color: "#ffb4c888" }}>
          ← 뒤로
        </Link>
      </div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🌸</div>
        <h1 className="text-xl font-bold text-white mb-1">연애 사주</h1>
        <p className="text-xs" style={{ color: "#ffb4c877" }}>정보를 입력하면 AI가 분석해드립니다</p>
      </div>
      <SajuForm
        type="saju-love"
        accent="#ffb4c8"
        bg="#2a0a1a"
        resultPath="/saju-love/result"
      />
    </main>
  );
}
