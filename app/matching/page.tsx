import ServiceLanding from "@/components/ServiceLanding";

export default function MatchingPage() {
  return (
    <ServiceLanding
      character="홍도인"
      title="인연"
      tagline="연인·친구·가족·동료 — 모든 인연의 결을 사주로 풀어드립니다"
      emoji="🌹"
      bg="#1a0f20"
      accent="#d4a8e8"
      formHref="/matching/form"
      features={[
        "12가지 관계 유형별 맞춤 풀이",
        "두 사람의 본질·기운·언어 비교",
        "관계의 시선 — 서로를 보는 진짜 마음",
        "함께하는 시간 — 대운이 맞물리는 흐름",
        "다가오는 시기 — 올해·내년·그 너머",
        "두 분의 길과 홍도인의 마지막 당부",
      ]}
    />
  );
}
