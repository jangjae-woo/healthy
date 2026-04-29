"use client";
import Link from "next/link";
import SajuForm from "@/components/SajuForm";

export default function NewYearFormPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(180deg, #0a2a0a 0%, #1a0d00 100%)" }}
    >
      <div className="w-full max-w-sm mb-6">
        <Link href="/new-year" className="flex items-center gap-1 text-sm" style={{ color: "#90ee9088" }}>
          ← 뒤로
        </Link>
      </div>
      <div className="text-center mb-8">
        <div className="text-3xl mb-2 font-bold" style={{ color: "#90ee90" }}>歲</div>
        <h1 className="text-xl font-bold text-white mb-1">신년 운세</h1>
        <p className="text-xs" style={{ color: "#90ee9099" }}>세도인(歲道人)이 2026년 병오년(丙午)의 결을 풀이해드립니다</p>
      </div>
      <SajuForm
        type="new-year"
        accent="#90ee90"
        bg="#0a2a0a"
        resultPath="/new-year/result"
      />
    </main>
  );
}
