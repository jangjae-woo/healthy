import Link from "next/link";

const services = [
  {
    id: "saju",
    character: "운학선인",
    title: "평생 사주",
    desc: "단 한 번의 풀이, 평생을 간직할 나의 사주",
    emoji: "🌙",
    bg: "#1a0a2e",
    accent: "#c9b4ff",
    href: "/saju",
  },
  {
    id: "new-year",
    character: "까치도령",
    title: "신년 운세",
    desc: "2026년 병오년, 당신의 한 해를 풀어드립니다",
    emoji: "🎋",
    bg: "#0a2a0a",
    accent: "#90ee90",
    href: "/new-year",
  },
  {
    id: "saju-love",
    character: "색동낭자",
    title: "연애 사주",
    desc: "당신의 인연을 풀어드려요",
    emoji: "🌸",
    bg: "#2a0a1a",
    accent: "#ffb4c8",
    href: "/saju-love",
  },
  {
    id: "face",
    character: "관상가 양반",
    title: "정통 관상",
    desc: "사진 한 장이면 AI가 성격, 연애운, 재물운, 직업운까지",
    emoji: "🪬",
    bg: "#1a1a0a",
    accent: "#ffd700",
    href: "/face",
  },
];

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{
        background: "linear-gradient(180deg, #1a0d00 0%, #2d1b0e 50%, #3d2510 100%)",
      }}
    >
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">☯️</div>
        <h1 className="text-3xl font-bold tracking-widest mb-1" style={{ color: "#fef3c7" }}>
          AI 양반가
        </h1>
        <p className="text-sm tracking-wider" style={{ color: "#d97706aa" }}>
          정통 사주 · 관상 · 운세
        </p>
      </div>

      {/* 서비스 카드 */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {services.map((s) => (
          <Link key={s.id} href={s.href}>
            <div
              className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: s.bg,
                border: `1px solid ${s.accent}33`,
              }}
            >
              <div
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: `${s.accent}18` }}
              >
                {s.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs mb-0.5" style={{ color: `${s.accent}88` }}>
                  {s.character}
                </div>
                <div className="text-lg font-bold text-white mb-1">{s.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: `${s.accent}77` }}>
                  {s.desc}
                </div>
              </div>
              <span className="text-xl flex-shrink-0" style={{ color: `${s.accent}55` }}>
                ›
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* 푸터 */}
      <div className="mt-16 text-center text-xs space-y-2" style={{ color: "#78350f88" }}>
        <p>© 2025 AI 양반가. All Rights Reserved.</p>
        <div className="flex gap-4 justify-center">
          <a href="/terms" className="hover:underline">이용약관</a>
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>
          <a href="/refund" className="hover:underline">환불정책</a>
        </div>
      </div>
    </main>
  );
}
