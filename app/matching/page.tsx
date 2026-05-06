import ServiceLanding from "@/components/ServiceLanding";

export default function MatchingPage() {
  return (
    <ServiceLanding
      character="홍도인"
      title="인연"
      tagline="당신에게 다가올 인연의 결을 사주로 풀어드립니다"
      emoji="🌹"
      bg="#1a0f20"
      accent="#d4a8e8"
      formHref="/matching/form"
      features={[
        "당신의 본질과 연애 스타일",
        "끌리는 사람의 결 — 어떤 결의 사람인가",
        "다가오는 인연의 자리 — 어떤 환경에서 만나는가",
        "인연이 오는 시기 — 대운과 올해·내년의 흐름",
        "결혼·인연의 기운이 흐르는 시기",
        "주의할 연애 패턴과 홍도인의 마지막 당부",
      ]}
    />
  );
}
