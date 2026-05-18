"use client";

import Link from "next/link";

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const INK_SOFT = "#1a0a14";

export default function YouaLandingPage() {
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
          radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
        `,
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <span className="w-5" aria-hidden="true" />
          <div
            className="text-[10px] tracking-[0.4em]"
            style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
          >
            PALJAWON
          </div>
        </div>

        <div className="mb-10 text-center">
          <div
            className="mb-3 text-[10px] tracking-[0.45em]"
            style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
          >
            CHILD · TEMPERAMENT · PARENTING
          </div>
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{ color: PLUM, fontFamily: "'Nanum Myeongjo', serif" }}
          >
            사주로 풀어보는
            <br />
            우리 아이 마음
          </h1>
          <p
            className="mt-3 text-[13px] leading-[1.7]"
            style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}
          >
            아이의 타고난 기질과 부모님의 양육 흐름을
            <br />
            사주의 결로 함께 읽어드립니다
          </p>
        </div>

        <div
          className="mb-6 rounded-md p-6"
          style={{
            background: "linear-gradient(180deg, rgba(255,251,247,0.95), rgba(253,243,232,0.85))",
            border: "1px solid rgba(212,169,107,0.4)",
            boxShadow: "0 8px 24px -8px rgba(178,40,71,0.12)",
          }}
        >
          <ul
            className="space-y-3 text-[13px] leading-[1.65]"
            style={{ color: INK_SOFT, fontFamily: "'Gowun Batang', serif" }}
          >
            {[
              "우리 아이의 여섯 가지 기질 흐름",
              "아이의 동물 유형과 일상 반응",
              "어머님과 아버님의 사주 결",
              "부모와 아이가 만날 때의 시너지와 충돌",
              "일상에서 바로 적용할 수 있는 양육 방향",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span style={{ color: THREAD, fontWeight: 800 }}>·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/love/youa/form"
          className="block w-full rounded-md py-4 text-center text-[15px] font-bold transition-all active:scale-95"
          style={{
            background: `${THREAD}22`,
            color: THREAD,
            fontFamily: "'Gowun Batang', serif",
            letterSpacing: "0.05em",
            border: `1.5px solid ${THREAD}55`,
          }}
        >
          시작하기 →
        </Link>

        <div
          className="mt-6 text-center text-[11px]"
          style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}
        >
          PALJAWON · CHILD TEMPERAMENT REPORT
        </div>
      </div>
    </div>
  );
}
