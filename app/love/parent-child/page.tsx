"use client";
import Link from "next/link";

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK_SOFT = "#1a0a14";

export default function LoveParentChildLanding() {
  return (
    <div className="min-h-screen px-4 py-8" style={{
      background: `
        radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
        radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
        linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
      `,
      fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
    }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <span className="w-5" aria-hidden="true" />
          <div className="text-[10px] tracking-[0.4em]" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            紅 絲
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="text-[10px] tracking-[0.45em] mb-3" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
            FAMILY · 부모와 자녀의 결
          </div>
          <h1 className="text-[28px] font-bold leading-tight" style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}>
            부모와 자녀궁합
          </h1>
          <p className="text-[13px] mt-3 leading-[1.7]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            부모 언어로 다시 쓴 자도인 풀이<br />
            엄마아빠와 자녀의 결을 6장으로 풀어드려요
          </p>
        </div>

        <div className="rounded-md p-6 mb-6" style={{
          background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
          border: "1px solid rgba(212,169,107,0.4)",
          boxShadow: "0 8px 24px -8px rgba(178,40,71,0.12)",
        }}>
          <ul className="space-y-3 text-[13px] leading-[1.65]" style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>우리 아이는 어떤 아이일까</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>우리 아이는 어떻게 공부할까</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>우리 아이 칭찬하고 혼내는 법</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>친구 사이 우리 아이</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>우리 아이는 무엇으로 빛날까</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
              <span>엄마아빠와 우리 셋의 결</span>
            </li>
          </ul>
        </div>

        <Link href="/love/parent-child/form"
          className="block w-full py-4 rounded-md text-[15px] font-bold transition-all active:scale-95 text-center"
          style={{
            background: `${THREAD}22`,
            color: THREAD,
            fontFamily: "'Gowun Batang', serif",
            letterSpacing: "0.05em",
            border: `1.5px solid ${THREAD}55`,
          }}>
          시작하기 ›
        </Link>

        <div className="text-[11px] text-center mt-6" style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>
          ─ 紅 絲 · 부모와 자녀 사이의 결 ─
        </div>
      </div>
    </div>
  );
}
