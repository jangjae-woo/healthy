"use client";
// OpeningGreeting — V2 자도인 오프닝 인사 페이지
// 보고서의 첫 페이지. 단순 텍스트 오프닝 멘트만.

// 홍실 라이트 톤 통일 (2026-05-10)
const ACCENT = "#c8203a";   // THREAD 자두 — 강조 단어
const GOLD = "#c8203a";      // 같은 자두 — 노란 골드 폐기 (가독성)
const PLUM = "#6b1e3a";      // 자두 진함 — 버튼·헤더

export default function OpeningGreeting({
  childName,
  childGender,
  hasMom = true,
  hasDad = true,
  onStart,
}: {
  childName: string;
  childGender: "남" | "여";
  hasMom?: boolean;
  hasDad?: boolean;
  onStart: () => void;
}) {
  const childLabel = `${childName}${childGender === "남" ? "군" : "양"}`;
  // 단일 부모 입력 시 해당 부모 호칭만 노출. 양친 없을 시(자녀만) 보호자님으로 fallback.
  const parentSalutation = hasMom && hasDad ? "어머님 · 아버님" : hasMom ? "어머님" : hasDad ? "아버님" : "보호자님";
  const parentLabel = hasMom && hasDad ? "부모님" : hasMom ? "어머님" : hasDad ? "아버님" : "보호자님";

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-6">
        {/* 챕터 헤더 */}
        <div className="text-center mb-4">
          <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: "#6b1e3a" }}>
            Opening — 자도인의 인사
          </p>
        </div>

        {/* 본문 — 단순 텍스트 */}
        <div className="space-y-5">
          <p className="text-[16px] font-bold leading-[1.7]" style={{ color: GOLD }}>
            안녕하세요, {parentSalutation}.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            저는 <strong style={{ color: GOLD }}>자도인(慈道人)</strong>이에요.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: ACCENT }}>사주</strong>는 아이가 타고난 기질이에요.
            <br />
            쉽게 바꿀 수 없는, 그 아이만의 고유한 결이죠.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            하지만 <strong style={{ color: GOLD }}>팔자</strong>는 달라요.
            <br />
            어떤 환경에서, 누구와 함께 자라느냐에 따라 살아가면서 충분히 빚어갈 수 있어요.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            <strong style={{ color: GOLD }}>{childLabel}</strong>의 사주 안에는, 타고난 기질과 앞으로 펼쳐질 가능성이 함께 담겨 있어요.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            그리고 한 가지 더—
            <br />
            {parentLabel}과 <strong style={{ color: GOLD }}>{childLabel}</strong> 사이엔 어떤 <strong style={{ color: ACCENT }}>궁합의 결</strong>이 흐르고 있는지, 그 연결의 지도도 함께 펼쳐드릴게요.
          </p>

          <p className="text-[13.5px] leading-[1.95]" style={{ color: "#1a0a14" }}>
            사주는 미래를 점치는 게 아니에요.
            <br />
            아이가 어떤 결로 빛나고, {parentLabel}이 어떻게 곁에 있어주면 좋을지 보여주는 <strong style={{ color: GOLD }}>지도(地圖)</strong>입니다.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-6 pb-2">
          <button
            onClick={onStart}
            className="w-full rounded-2xl py-4 font-bold text-[14px] transition-all active:scale-95"
            style={{
              background: `${ACCENT}22`,
              color: ACCENT,
              border: `1.5px solid ${ACCENT}55`,
              letterSpacing: "0.05em",
            }}
          >
            사주 첫걸음으로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
