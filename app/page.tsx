import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

const GOLD = "#c9960c";
const GOLD_LIGHT = "#e4b840";
const FOREST = "#0d1a0f";

const services = [
  {
    id: "saju",
    hanja: "命",
    en: "Lifetime Reading",
    title: "평생 사주",
    desc: "단 한 번의 풀이, 평생을 간직할 나의 사주",
    price: null,
    bonus: false,
    href: "/saju",
  },
  // 인연·인연궁합·엄마와 아이는 paljawon.com/love 산하로 이동 (2026-05-10)
  // matching·inyeon·parent-child·parent-child-v2 항목 메인 랜딩에서 숨김
  {
    id: "moving",
    hanja: "擇",
    en: "Auspicious Day",
    title: "이사날짜 운세",
    desc: "손없는 날과 사주로 찾는 최적의 이사 날짜",
    price: null,
    bonus: true,
    href: "/moving",
  },
  {
    id: "naming",
    hanja: "名",
    en: "Naming",
    title: "이름 짓기 · 개명",
    desc: "사주 오행을 보완하는 이름 추천",
    price: null,
    bonus: true,
    href: "/naming",
  },
];

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-10 relative"
      style={{
        background: "linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)",
        fontFamily: "'Gowun Batang', 'Noto Serif KR', serif",
      }}
    >
      {/* 별빛 배경 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(228, 184, 64, 0.5), transparent),
            radial-gradient(1px 1px at 70% 60%, rgba(228, 184, 64, 0.4), transparent),
            radial-gradient(1px 1px at 40% 80%, rgba(228, 184, 64, 0.3), transparent),
            radial-gradient(1px 1px at 85% 20%, rgba(228, 184, 64, 0.4), transparent),
            radial-gradient(1px 1px at 15% 70%, rgba(228, 184, 64, 0.3), transparent),
            radial-gradient(1px 1px at 60% 15%, rgba(228, 184, 64, 0.4), transparent),
            radial-gradient(1px 1px at 90% 85%, rgba(228, 184, 64, 0.3), transparent)
          `,
          backgroundSize: "100% 100%",
          zIndex: 0,
        }}
      />

      {/* ─── 히어로 ─── */}
      <section className="relative z-10 w-full max-w-md mx-auto pt-8 pb-12 text-center">
        <div
          className="text-[10px] tracking-[0.4em] uppercase mb-5"
          style={{
            color: GOLD,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
          }}
        >
          Since 千年 · Saju Divination
        </div>

        <h1
          className="text-3xl mb-2"
          style={{
            color: "#fef3c7",
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: "0.05em",
          }}
        >
          천 년의 지혜,
          <br />
          당신의{" "}
          <strong style={{ color: GOLD_LIGHT }}>팔자</strong>를
          <br />
          읽습니다.
        </h1>

        <div
          className="my-6"
          style={{
            fontFamily: "'Ma Shan Zheng', serif",
            fontSize: "64px",
            color: GOLD,
            lineHeight: 1,
            textShadow: `0 0 24px ${GOLD}55`,
          }}
        >
          八字苑
        </div>

        <p
          className="text-sm leading-relaxed px-4"
          style={{ color: "#d6cdb8" }}
        >
          정통 명리학에 뿌리를 둔 사주 풀이.
          <br />
          생년월일시에 담긴 당신의 길을 세밀하게 해석하여,
          <br />
          흘러갈 시간 위에 당신만의 나침반을 세웁니다.
        </p>

      </section>

      {/* ─── 서비스 카드 ─── */}
      <section id="services" className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-4 px-2 pt-6">
        {services.map((s) => (
          <Link key={s.id} href={s.href}>
            <div
              className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, #0f1d12 0%, #0a1408 100%)`,
                border: `1px solid ${GOLD}33`,
                boxShadow: s.bonus
                  ? `0 0 16px ${GOLD}22`
                  : `0 0 28px ${GOLD}33, 0 4px 24px ${GOLD}22`,
              }}
            >
              {/* 한자 배경 */}
              <div
                className="absolute -right-2 top-0 pointer-events-none select-none"
                style={{
                  fontFamily: "'Ma Shan Zheng', serif",
                  fontSize: "120px",
                  color: `${GOLD}11`,
                  lineHeight: 1,
                  fontWeight: 400,
                }}
              >
                {s.hanja}
              </div>

              <div className="relative z-10 p-5">
                {/* 상단 한자 + 영문 */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    style={{
                      fontFamily: "'Ma Shan Zheng', serif",
                      fontSize: "32px",
                      color: GOLD,
                      lineHeight: 1,
                    }}
                  >
                    {s.hanja}
                  </div>
                  {s.bonus && (
                    <span
                      className="text-[9px] px-2 py-1 rounded-full tracking-widest font-bold"
                      style={{
                        background: `${GOLD}22`,
                        color: GOLD_LIGHT,
                        border: `1px solid ${GOLD}44`,
                        fontFamily: "'Cormorant Garamond', serif",
                      }}
                    >
                      BONUS
                    </span>
                  )}
                </div>

                {/* 영문 라벨 */}
                <div
                  className="text-[10px] tracking-[0.25em] uppercase mb-1"
                  style={{
                    color: `${GOLD}99`,
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {s.en}
                </div>

                {/* 한글 제목 */}
                <div
                  className="text-lg font-bold mb-1"
                  style={{
                    color: "#fef3c7",
                    fontFamily: "'Noto Serif KR', serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  {s.title}
                </div>

                {/* 설명 */}
                <div className="text-xs leading-relaxed mb-3" style={{ color: "#a39068" }}>
                  {s.desc}
                </div>

                {/* 가격 또는 보너스 안내 */}
                <div
                  className="pt-3 flex items-center justify-between"
                  style={{ borderTop: `1px solid ${GOLD}22` }}
                >
                  {s.price ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-xl font-bold"
                          style={{ color: GOLD_LIGHT, fontFamily: "'Noto Serif KR', serif" }}
                        >
                          {s.price}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: `${GOLD}aa` }}>
                        시작하기 →
                      </span>
                    </>
                  ) : s.bonus ? (
                    <>
                      <span className="text-[11px]" style={{ color: `${GOLD_LIGHT}cc` }}>
                        평생 사주 또는 궁합 구매 시 무료
                      </span>
                      <span className="text-[10px]" style={{ color: `${GOLD}aa` }}>
                        보러가기 →
                      </span>
                    </>
                  ) : (
                    <>
                      <span />
                      <span className="text-[11px]" style={{ color: `${GOLD}cc` }}>
                        시작하기 →
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ─── 보너스 안내 박스 ─── */}
      <section className="relative z-10 w-full max-w-md mx-auto px-2 mt-8">
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: `linear-gradient(135deg, ${GOLD}0a 0%, ${GOLD}05 100%)`,
            border: `1px dashed ${GOLD}44`,
          }}
        >
          <div
            className="text-2xl mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', serif", color: GOLD_LIGHT }}
          >
            禮
          </div>
          <p
            className="text-sm font-bold mb-1"
            style={{ color: "#fef3c7", fontFamily: "'Noto Serif KR', serif" }}
          >
            구매자 특별 혜택
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#a39068" }}>
            평생 사주 또는 궁합을 받으시면
            <br />
            이사날짜·이름짓기 서비스를 무료로 이용하실 수 있습니다.
          </p>
        </div>
      </section>

      <div className="relative z-10 w-full mt-12">
        <SiteFooter />
      </div>
    </main>
  );
}
