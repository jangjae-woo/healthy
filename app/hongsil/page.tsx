"use client";
import Link from "next/link";

const THREAD = "#c8203a";
const PLUM = "#6b1e3a";
const GOLD = "#b88646";
const GOLD_LIGHT = "#d4a96b";
const INK = "#1a0a14";
const INK_SOFT = "#5a3c4a";

export default function HongsilLanding() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px 16px 60px",
        background: `
          radial-gradient(ellipse at 30% 0%, #ffe1ea 0%, transparent 60%),
          radial-gradient(ellipse at 70% 100%, #fff0d6 0%, transparent 60%),
          linear-gradient(180deg, #fff7f9 0%, #ffeef3 60%, #fce4d6 100%)
        `,
        fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* 상단 바 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ width: 20 }} aria-hidden="true" />
          <div
            style={{
              fontFamily: "'Italiana', serif",
              fontSize: 11,
              letterSpacing: "0.4em",
              color: GOLD,
            }}
          >
            紅 絲
          </div>
        </div>

        {/* 두루마리 본문 */}
        <section
          style={{
            position: "relative",
            padding: "44px 26px 40px",
            background: "linear-gradient(180deg, rgba(255,251,247,0.94) 0%, rgba(253,243,232,0.9) 100%)",
            borderRadius: 4,
            boxShadow: "0 16px 40px -16px rgba(178,40,71,0.2), 0 0 0 1px rgba(212,169,107,0.28) inset",
            overflow: "hidden",
          }}
        >
          {/* 코너 실 장식 */}
          <svg
            viewBox="0 0 240 200"
            style={{ position: "absolute", top: -10, left: -20, width: 120, opacity: 0.85, transform: "rotate(-12deg)", pointerEvents: "none", zIndex: 0 }}
          >
            <path
              d="M 10,20 C 60,40 100,10 130,50 C 160,90 90,110 130,140 C 170,170 220,140 230,180"
              fill="none"
              stroke={THREAD}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85}
            />
            <circle cx={10} cy={20} r={4} fill={THREAD} />
            <circle cx={230} cy={180} r={3} fill={THREAD} opacity={0.6} />
          </svg>
          <svg
            viewBox="0 0 240 200"
            style={{ position: "absolute", bottom: -15, right: -22, width: 140, opacity: 0.85, transform: "rotate(195deg)", pointerEvents: "none", zIndex: 0 }}
          >
            <path
              d="M 10,20 C 60,40 100,10 130,50 C 160,90 90,110 130,140 C 170,170 220,140 230,180"
              fill="none"
              stroke={THREAD}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85}
            />
            <circle cx={10} cy={20} r={4} fill={THREAD} />
            <circle cx={230} cy={180} r={3} fill={THREAD} opacity={0.6} />
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
                letterSpacing: "0.4em",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "'Nanum Myeongjo', serif",
                  fontStyle: "normal",
                  color: THREAD,
                  marginRight: 10,
                  letterSpacing: "0.25em",
                }}
              >
                傳 說
              </span>
              THE LEGEND
            </div>

            {/* 헤드 */}
            <h1
              style={{
                fontFamily: "'Nanum Myeongjo', serif",
                fontWeight: 800,
                fontSize: 22,
                lineHeight: 1.45,
                textAlign: "center",
                color: INK,
                marginBottom: 28,
                letterSpacing: "-0.01em",
              }}
            >
              운명의 두 사람은,<br />
              <span style={{ color: THREAD, fontWeight: 800 }}>붉은 실</span>로 묶여 있다.
            </h1>

            {/* 본문 */}
            <div
              style={{
                fontFamily: "'Gowun Batang', serif",
                fontSize: 14,
                lineHeight: 2.05,
                color: INK,
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <p style={{ marginBottom: 16 }}>
                오래전부터 동아시아에 전해지는 이야기.<br />
                태어날 때부터 <span style={{ color: THREAD, fontWeight: 700 }}>운명의 두 사람</span>은<br />
                새끼손가락이 보이지 않는 붉은 실로 이어져 있어,
              </p>
              <p style={{ marginBottom: 16 }}>
                <span style={{ color: INK_SOFT }}>시간이 흘러도, 거리가 멀어도,</span><br />
                <span style={{ color: INK_SOFT }}>때로는 엉키고 늘어질지라도</span><br />
                그 매듭은 결코 끊어지지 않는다.
              </p>
              <p>
                <span style={{ color: THREAD, fontWeight: 700 }}>사주(四柱)</span>는 그 실의 결을 읽는 일.<br />
                당신의 실이 어디서 시작해,<br />
                누구에게로 이어져 있는지를.
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
                borderTop: `1px solid ${GOLD_LIGHT}55`,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              <span style={{ fontFamily: "'Nanum Myeongjo', serif", color: THREAD, fontSize: 15, letterSpacing: "0.25em" }}>
                月下老人
              </span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: INK_SOFT, fontSize: 11, letterSpacing: "0.15em" }}>
                Yue Lao · The Old Man Under the Moon
              </span>
            </div>

            {/* 시작 버튼 — 분홍 옅음 + 분홍 글자 */}
            <Link href="/hongsil/form" style={{ textDecoration: "none" }}>
              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  fontFamily: "'Gowun Batang', serif",
                  background: `${THREAD}22`,
                  color: THREAD,
                  border: `1.5px solid ${THREAD}55`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${THREAD}33`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${THREAD}22`; }}
              >
                시작하기 ›
              </button>
            </Link>
            <p style={{ textAlign: "center", fontSize: 11, color: `${GOLD}cc`, marginTop: 12, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
              결과 확인 시 소정의 이용료가 발생합니다
            </p>
          </div>
        </section>

        <div style={{ textAlign: "center", marginTop: 18, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: GOLD, fontSize: 11, letterSpacing: "0.3em" }}>
          ─ 八字苑 · 紅 絲 ─
        </div>
      </div>
    </main>
  );
}
