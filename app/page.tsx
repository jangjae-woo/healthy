import Link from "next/link";

const services = [
  {
    id: "saju",
    character: "묵도인",
    title: "평생 사주",
    desc: "단 한 번의 풀이, 평생을 간직할 나의 사주",
    bg: "#0d1a0f",
    accent: "#c9960c",
    charImg: "/char-saju.png",
    href: "/saju",
  },
  {
    id: "moving",
    character: "정도인",
    title: "이사날짜 운세",
    desc: "손없는 날과 내 사주로 찾는 최적의 이사 날짜",
    bg: "#0a1e14",
    accent: "#5ec98e",
    charImg: "/char-moving.png",
    href: "/moving",
  },
  {
    id: "naming",
    character: "황도인",
    title: "이름 짓기 · 개명",
    desc: "사주 오행을 보완하고 원하는 느낌을 담은 이름 추천",
    bg: "#1e1408",
    accent: "#e8b84b",
    charImg: "/char-naming.png",
    href: "/naming",
  },
];

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{
        background: "linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)",
      }}
    >
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3" style={{ color: "#d97706", filter: "drop-shadow(0 0 18px #d97706cc) drop-shadow(0 0 6px #fbbf24aa)" }}>☯</div>
        <h1 className="text-3xl font-bold tracking-widest mb-1" style={{ color: "#fef3c7" }}>
          팔자원
        </h1>
        <p className="text-sm tracking-widest" style={{ color: "#d97706aa" }}>
          八字苑 · 명리풀이
        </p>
      </div>

      {/* 서비스 카드 */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {services.map((s) => (
          <Link key={s.id} href={s.href}>
            <div
              className="relative overflow-hidden rounded-2xl cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, #0d0d0d 0%, #111008 100%)`,
                border: `1.5px solid #5ec98e`,
                boxShadow: `0 0 28px #5ec98e88, 0 0 8px #5ec98e66, 0 4px 24px #5ec98e44`,
                minHeight: "100px",
              }}
            >
              {/* 캐릭터 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.charImg}
                alt={s.character}
                className="absolute bottom-0 right-0 pointer-events-none select-none"
                style={{
                  height: "120%",
                  width: "auto",
                  maxWidth: "48%",
                  objectFit: "contain",
                  objectPosition: "bottom right",
                }}
              />

              {/* 오른쪽 끝 그라데이션 페이드 */}
              <div
                className="absolute top-0 right-0 h-full w-12 pointer-events-none"
                style={{
                  background: `linear-gradient(to left, ${s.bg}cc 0%, transparent 100%)`,
                }}
              />

              {/* 텍스트 */}
              <div className="relative z-10 py-6 pl-5" style={{ paddingRight: "46%" }}>
                <div className="text-xs mb-1 font-medium tracking-wider" style={{ color: `${s.accent}aa` }}>
                  {s.character}
                </div>
                <div className="text-xl font-bold text-white mb-1 leading-tight">
                  {s.title}
                </div>
                <div className="text-xs leading-relaxed line-clamp-2" style={{ color: `${s.accent}88` }}>
                  {s.desc}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 푸터 */}
      <div className="mt-16 text-center text-xs space-y-2" style={{ color: "#78350f77" }}>
        <p>© 2025 팔자원. All Rights Reserved.</p>
        <div className="flex gap-4 justify-center">
          <a href="/terms" className="hover:underline">이용약관</a>
          <a href="/privacy" className="hover:underline">개인정보처리방침</a>
          <a href="/refund" className="hover:underline">환불정책</a>
        </div>
      </div>
    </main>
  );
}
