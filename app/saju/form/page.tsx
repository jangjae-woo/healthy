"use client";
import Link from "next/link";
import SajuForm from "@/components/SajuForm";

export default function SajuFormPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(180deg, #1a0a2e 0%, #1a0d00 100%)" }}
    >
      <div className="w-full max-w-sm mb-6">
        <Link href="/saju" className="flex items-center gap-1 text-sm" style={{ color: "#c9b4ff88" }}>
          ← 뒤로
        </Link>
      </div>
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🌙</div>
        <h1 className="text-xl font-bold text-white mb-1">평생 사주</h1>
        <p className="text-xs" style={{ color: "#c9b4ff77" }}>정보를 입력하면 AI가 분석해드립니다</p>
      </div>
      <SajuForm
        type="saju"
        accent="#c9b4ff"
        bg="#1a0a2e"
        resultPath="/saju/result"
      />
    </main>
  );
}
