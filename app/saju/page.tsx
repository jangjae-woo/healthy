import ServiceLanding from "@/components/ServiceLanding";

export default function SajuPage() {
  return (
    <ServiceLanding
      character="운학선인"
      title="평생 사주"
      tagline="단 한 번의 풀이, 평생을 간직할 나의 사주"
      emoji="🌙"
      bg="#1a0a2e"
      accent="#c9b4ff"
      formHref="/saju/form"
      features={[
        "나라는 사람 — 강점·약점·일주 DNA",
        "돈과 일 — 재물운과 커리어 타이밍",
        "사람과 사랑 — 연애 스타일과 인연 시기",
        "몸과 마음 — 건강 취약 부위와 관리법",
        "숨겨진 카드 — 잠재력과 신살 풀이",
        "흐르는 시간 — 향후 5년 대운 분석",
        "나침반 — 용신과 오늘부터 할 것",
        "결 — 운학선인의 인생 당부",
      ]}
    />
  );
}
