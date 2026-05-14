"use client";
import Link from "next/link";
import { useEffect } from "react";

// 평생사주 두루마리 랜딩 — 인연사주 LEGEND 패턴 차용, 다크+골드 테마 (2026-05-14)
// 묵도인 캐릭터 폐기 → 2안 "태어난 순간의 하늘" 스토리텔링 카피.
const GOLD = "#c9960c";
const GOLD_LIGHT = "#d4a96b";
const CREAM = "#fbf3e8";
const INK_SOFT = "rgba(251,243,232,0.62)";

export default function SajuPage() {
  // 추적 ref → localStorage (어필리에이트)
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("saju_ref", ref);
    } catch {}
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px 60px",
        background: "linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)",
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* 상단 바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <Link href="/" style={{ fontSize: 13, color: `${GOLD}88`, textDecoration: "none" }}>← 홈으로</Link>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, letterSpacing: "0.4em", color: GOLD }}>
            八 字 苑
          </div>
        </div>

        {/* 두루마리 본문 — 다크 + 골드 */}
        <section
          style={{
            position: "relative",
            padding: "44px 26px 40px",
            background: "rgba(255,255,255,0.045)",
            borderRadius: 4,
            boxShadow: "0 16px 44px -18px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,12,0.32) inset",
            overflow: "hidden",
          }}
        >
          {/* 코너 별빛 장식 */}
          <svg viewBox="0 0 200 200" style={{ position: "absolute", top: -8, left: -16, width: 110, opacity: 0.7, pointerEvents: "none", zIndex: 0 }}>
            <circle cx={40} cy={30} r={1.6} fill={GOLD_LIGHT} />
            <circle cx={80} cy={55} r={1.1} fill={GOLD_LIGHT} opacity={0.7} />
            <circle cx={25} cy={75} r={1.3} fill={GOLD_LIGHT} opacity={0.6} />
            <circle cx={110} cy={28} r={1} fill={GOLD_LIGHT} opacity={0.5} />
            <circle cx={60} cy={100} r={1} fill={GOLD_LIGHT} opacity={0.45} />
            <path d="M 40,30 L 80,55 L 25,75" fill="none" stroke={GOLD} strokeWidth={0.6} opacity={0.35} />
          </svg>
          <svg viewBox="0 0 200 200" style={{ position: "absolute", bottom: -12, right: -16, width: 130, opacity: 0.7, pointerEvents: "none", zIndex: 0 }}>
            <circle cx={150} cy={160} r={1.6} fill={GOLD_LIGHT} />
            <circle cx={110} cy={135} r={1.1} fill={GOLD_LIGHT} opacity={0.7} />
            <circle cx={170} cy={115} r={1.3} fill={GOLD_LIGHT} opacity={0.6} />
            <circle cx={90} cy={165} r={1} fill={GOLD_LIGHT} opacity={0.5} />
            <circle cx={135} cy={95} r={1} fill={GOLD_LIGHT} opacity={0.45} />
            <path d="M 150,160 L 110,135 L 170,115" fill="none" stroke={GOLD} strokeWidth={0.6} opacity={0.35} />
          </svg>

          <div style={{ position: "relative", zIndex: 2 }}>
            {/* 라벨 */}
            <div
              style={{
                textAlign: "center",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                color: GOLD,
                fontSize: 11,
                letterSpacing: "0.32em",
                marginBottom: 16,
              }}
            >
              <span style={{ fontFamily: "'Nanum Myeongjo', serif", fontStyle: "normal", color: GOLD_LIGHT, marginRight: 10, letterSpacing: "0.25em" }}>
                命 書
              </span>
              THE MOMENT OF BIRTH
            </div>

            {/* 헤드 */}
            <h1
              style={{
                fontFamily: "'Nanum Myeongjo', serif",
                fontWeight: 800,
                fontSize: 22,
                lineHeight: 1.5,
                textAlign: "center",
                color: CREAM,
                marginBottom: 28,
                letterSpacing: "-0.01em",
              }}
            >
              당신이 태어난 그 순간,<br />
              하늘은 <span style={{ color: GOLD_LIGHT, fontWeight: 800 }}>한 번뿐인 모양</span>이었습니다.
            </h1>

            {/* 본문 */}
            <div
              style={{
                fontFamily: "'Gowun Batang', serif",
                fontSize: 14,
                lineHeight: 2.05,
                color: CREAM,
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <p style={{ marginBottom: 16 }}>
                같은 해, 같은 날에 태어난 사람은 많아도<br />
                같은 연·월·일·시를 가진 사람은 드뭅니다.<br />
                그 여덟 글자는 두 번 오지 않는 <span style={{ color: GOLD_LIGHT, fontWeight: 700 }}>하늘의 무늬</span>입니다.
              </p>
              <p style={{ marginBottom: 16, color: INK_SOFT }}>
                별이 자리를 바꾸듯, 그 무늬는<br />
                한 사람의 기질과 시기와 인연을 품고 있습니다.
              </p>
              <p>
                <span style={{ color: GOLD_LIGHT, fontWeight: 700 }}>평생사주(平生四柱)</span>는 그 하늘을 다시 읽는 일입니다.<br />
                태어난 순간에 새겨진 당신의 결을요.
              </p>
            </div>

            {/* attribution */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: 28,
                paddingTop: 24,
                borderTop: `1px solid ${GOLD_LIGHT}44`,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              <span style={{ fontFamily: "'Nanum Myeongjo', serif", color: GOLD_LIGHT, fontSize: 15, letterSpacing: "0.25em" }}>
                子平命理
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: INK_SOFT, fontSize: 11, letterSpacing: "0.15em" }}>
                Born Under One Sky
              </span>
            </div>

            {/* 시작 버튼 — 골드 */}
            <Link href="/saju/form" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  fontFamily: "'Gowun Batang', serif",
                  background: `${GOLD}1f`,
                  color: GOLD_LIGHT,
                  border: `1.5px solid ${GOLD}66`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: `0 0 24px ${GOLD}14`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${GOLD}30`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${GOLD}1f`; }}
              >
                시작하기 ›
              </button>
            </Link>
            <p style={{ textAlign: "center", fontSize: 11, color: `${GOLD}aa`, marginTop: 12, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
              결과 확인 시 소정의 이용료가 발생합니다
            </p>
          </div>
        </section>

        <div style={{ textAlign: "center", marginTop: 18, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: GOLD, fontSize: 11, letterSpacing: "0.3em" }}>
          ─ 八字苑 · 平生四柱 ─
        </div>
      </div>
    </main>
  );
}
