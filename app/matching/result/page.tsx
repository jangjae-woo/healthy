"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResultContent() {
  const params = useSearchParams();
  const myName = params.get('myName') || '';
  const partnerName = params.get('partnerName') || '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(180deg, #1a0f20 0%, #0a0510 100%)' }}>
      <div className="w-full max-w-[430px] text-center">
        <div className="text-5xl mb-4" style={{ color: '#d4a8e8', filter: 'drop-shadow(0 0 18px #d4a8e8cc)' }}>🌹</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {myName} · {partnerName}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#d4a8e8aa' }}>두 분의 인연을 풀이하는 중입니다</p>

        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#d4a8e815', border: '1px solid #d4a8e844' }}>
          <p className="text-sm text-white/80 leading-relaxed">
            궁합 풀이 결과 페이지는 현재 준비 중입니다.<br/>
            곧 두 분의 사주 궁합을 세세히 풀어드리겠습니다.
          </p>
        </div>

        <Link href="/matching" className="inline-block px-6 py-2 rounded-lg text-sm"
          style={{ backgroundColor: '#d4a8e822', color: '#d4a8e8', border: '1px solid #d4a8e844' }}>
          ← 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function MatchingResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a0f20' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#d4a8e833', borderTopColor: '#d4a8e8' }} />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
