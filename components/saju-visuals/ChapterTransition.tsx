// ── 챕터 전환 연결 문구 박스 (Phase 4-A) ──
// 청월당 패턴 차용 + paljawon 진지 톤 변형:
//   - 캐릭터·말풍선 X (사용자 정책)
//   - 검정 다크 톤 + 골드 ACCENT + 운형 ✦ 장식
//   - 자도인 톤 한 줄 — 다음 챕터 자연 진입 안내
// 표시 위치: 각 챕터의 마지막 본문 페이지 끝.

interface Props {
  message: string;        // 다음 챕터로 넘어가는 한 줄 안내
  accentColor?: string;   // 챕터 hue (전환 박스 색감)
}

export default function ChapterTransition({ message, accentColor = "#f5b942" }: Props) {
  return (
    <div className="my-8 px-4">
      {/* 운형 장식 + 가로선 + ✦ + 가로선 + 운형 장식 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accentColor}55)` }}
        />
        <span style={{ color: accentColor, fontSize: 12, letterSpacing: "0.3em" }}>
          ✦
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to left, transparent, ${accentColor}55)` }}
        />
      </div>
      {/* 안내 문구 — 자도인 톤 */}
      <p
        className="text-center italic"
        style={{
          color: "rgba(255,255,255,0.78)",
          fontSize: 12.5,
          lineHeight: 1.7,
          letterSpacing: "0.04em",
        }}
      >
        {message}
      </p>
      {/* 하단 운형 장식 */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accentColor}55)` }}
        />
        <span style={{ color: accentColor, fontSize: 10, letterSpacing: "0.4em" }}>
          ───
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: `linear-gradient(to left, transparent, ${accentColor}55)` }}
        />
      </div>
    </div>
  );
}

// ── 챕터별 다음 챕터 안내 문구 매핑 (자도인 톤) ──
// 각 챕터의 마지막 페이지에 표시. 다음 챕터의 도메인을 자연스럽게 안내.
export const CHAPTER_TRANSITION_MESSAGES: Record<string, string> = {
  "first-word":
    "이제 자녀가 타고난 본질부터 결을 따라 살펴드리겠습니다.",
  "overview":
    "본질을 살폈으니, 이제 그 결이 마음 안에서 어떻게 움직이는지 들여다보겠습니다.",
  "heart":
    "마음의 결을 보았으니, 자녀가 배움의 자리에서 어떻게 깨어나는지 살피겠습니다.",
  "learning":
    "배움의 결을 살폈으니, 사람과 만나는 자리에서 어떻게 펼쳐지는지 보겠습니다.",
  "relations":
    "관계의 결을 살폈으니, 자녀의 일상과 시기의 흐름이 어떻게 자라가는지 들여다보겠습니다.",
  "lifestyle":
    "자라는 결을 살폈으니, 이제 자녀의 미래와 진로의 방향을 살펴드리겠습니다.",
  "talent":
    "진로의 결을 살폈으니, 부모님과 함께 자라가는 가족의 결을 짚어드리겠습니다.",
  "parents":
    "이 모든 결을 자도인의 마지막 당부로 마무리하겠습니다.",
};
