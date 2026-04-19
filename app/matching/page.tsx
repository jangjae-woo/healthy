import ServiceLanding from "@/components/ServiceLanding";

export default function MatchingPage() {
  return (
    <ServiceLanding
      character="월하도인"
      title="연인과의 궁합"
      tagline="두 사람의 사주로 풀어보는 인연의 깊이"
      emoji="🌹"
      bg="#1a0f20"
      accent="#d4a8e8"
      formHref="/matching/form"
      features={[
        "두 사람의 본질과 기질 비교",
        "오행 궁합 — 서로 보완하는 기운",
        "일지 궁합 — 배우자궁 분석",
        "관계의 언어 — 십성으로 본 역학",
        "인연의 깊이 — 합·충 종합",
        "함께하는 시간의 흐름",
      ]}
    />
  );
}
