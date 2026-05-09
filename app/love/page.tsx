"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ════════════════════════════════════════════════════════════════════
// /love — "나는 솔로" 톤 랜딩 (모바일 우선, max-w-md)
// 두 서비스 진입: 인연사주(/saju-love) + 인연궁합(/inyeon)
// ════════════════════════════════════════════════════════════════════
export default function LoveLandingPage() {
  const [season, setSeason] = useState(28);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const start = new Date(2024, 0, 1).getTime();
    const weeks = Math.floor((Date.now() - start) / (7 * 24 * 60 * 60 * 1000));
    setSeason(28 + weeks);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ─── 상단 시즌 바 ─── */}
      <div className="border-b border-red-600/40 bg-black/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="text-[10px] text-white/60 tracking-widest hover:text-white transition">
            ← paljawon
          </Link>
          <div className="text-[10px] text-red-500 tracking-[0.25em] font-bold">
            SEASON {mounted ? season : "—"}
          </div>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative max-w-md mx-auto px-5 pt-14 pb-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-black to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(220,38,38,0.18),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* 작은 한글 라벨 */}
          <div className="text-[10px] text-red-500 tracking-[0.3em] mb-6 font-light leading-relaxed">
            진심으로 결혼하고 싶은<br />솔로들의 매칭
          </div>

          {/* 메인 로고 */}
          <h1 className="font-black tracking-tight leading-none">
            <span className="block text-6xl">
              나는 <span className="text-red-600">솔로</span>
            </span>
            <span className="block text-[11px] text-white/40 tracking-[0.35em] mt-5 font-light">
              I &nbsp; A M &nbsp; S O L O · 사주
            </span>
          </h1>

          {/* 서브 카피 */}
          <p className="mt-10 text-white/70 text-[13px] leading-relaxed">
            진짜 인연은 어디 있을까.<br />
            나의 사주가 말해주는<br />솔로 탈출의 단서.
          </p>

          <div className="mt-10 text-white/40 text-[10px] tracking-widest animate-pulse">
            ↓ &nbsp; 입장하기
          </div>
        </div>
      </section>

      {/* ─── 출연자 박스 (= 두 서비스 카드) ─── */}
      <section className="max-w-md mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-[10px] text-red-500 tracking-[0.3em] mb-2.5">CHOOSE YOUR PATH</div>
          <h2 className="text-2xl font-black leading-tight">
            지금 당신은<br /><span className="text-red-600">어느 쪽</span>인가요
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {/* 카드 1 — 인연사주 (혼자) */}
          <Link
            href="/saju-love"
            className="group relative bg-zinc-950 border border-zinc-800 active:border-red-600 transition-all duration-200 active:scale-[0.99] p-6 overflow-hidden block"
          >
            <div className="absolute top-3 right-3 text-[9px] text-red-500 tracking-widest border border-red-600/50 px-1.5 py-0.5">
              SOLO
            </div>
            <div className="text-[9px] text-white/40 tracking-widest mb-2">FOR ONE</div>
            <h3 className="text-2xl font-black mb-1.5 leading-tight">
              나의 <span className="text-red-600">인연사주</span>
            </h3>
            <div className="text-[12px] text-white/50 mb-5">
              "내 사주가 보여주는 사랑의 패턴"
            </div>
            <ul className="space-y-1.5 text-[12px] text-white/70 mb-6">
              <li>· 나의 연애 스타일</li>
              <li>· 끌리는 이상형의 결</li>
              <li>· 인연이 오는 시기</li>
              <li>· 반복되는 연애 약점</li>
            </ul>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-[10px] text-white/40 tracking-widest">REVEAL ME</span>
              <span className="text-xl text-red-600 group-active:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* 카드 2 — 인연궁합 (둘이) */}
          <Link
            href="/inyeon"
            className="group relative bg-zinc-950 border border-zinc-800 active:border-red-600 transition-all duration-200 active:scale-[0.99] p-6 overflow-hidden block"
          >
            <div className="absolute top-3 right-3 text-[9px] text-red-500 tracking-widest border border-red-600/50 px-1.5 py-0.5">
              MATCH
            </div>
            <div className="text-[9px] text-white/40 tracking-widest mb-2">FOR TWO</div>
            <h3 className="text-2xl font-black mb-1.5 leading-tight">
              둘의 <span className="text-red-600">인연궁합</span>
            </h3>
            <div className="text-[12px] text-white/50 mb-5">
              "이 사람, 정말 맞는 사람일까?"
            </div>
            <ul className="space-y-1.5 text-[12px] text-white/70 mb-6">
              <li>· 짝사랑·썸·연인·부부·재회 분기</li>
              <li>· 두 사주의 깊은 결</li>
              <li>· 결혼·미래 궁합</li>
              <li>· 홍도인의 마지막 편지</li>
            </ul>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-[10px] text-white/40 tracking-widest">CHECK US</span>
              <span className="text-xl text-red-600 group-active:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 출연 규칙 ─── */}
      <section className="border-t border-zinc-900 py-12">
        <div className="max-w-md mx-auto px-5">
          <div className="text-center mb-8">
            <div className="text-[10px] text-red-500 tracking-[0.3em] mb-2">THE RULES</div>
            <h2 className="text-xl font-black">출연 규칙</h2>
          </div>

          <ol className="space-y-4">
            {[
              ["01", "진짜 결혼하고 싶은 솔로만 출연합니다."],
              ["02", "본명은 묻지 않습니다 — 자기 사주만 가져오세요."],
              ["03", "결과는 만세력 + AI 명리학의 정통 풀이입니다."],
              ["04", "인연은 정해진 결과 아닌 선택의 가능성입니다."],
            ].map(([n, t]) => (
              <li key={n} className="flex items-start gap-4">
                <span className="text-2xl font-black text-red-600 leading-none w-9 shrink-0">{n}</span>
                <span className="text-[13px] text-white/80 leading-relaxed pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-900 py-6 text-center px-5">
        <div className="text-[9px] text-white/30 tracking-widest leading-relaxed">
          © PALJAWON · 사주 기반 인연 매칭<br />만 18세 이상
        </div>
        <div className="mt-2 text-[9px] text-white/20 leading-relaxed">
          ※ "나는 솔로"는 SBS Plus의 등록 상표입니다.<br />본 사이트는 별개의 사주 풀이 서비스입니다.
        </div>
      </footer>
    </main>
  );
}
