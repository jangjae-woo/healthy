import ServiceLanding from "@/components/ServiceLanding";

export default function MovingPage() {
  return (
    <ServiceLanding
      character="정도인"
      title="이사날짜 운세"
      tagline="손없는 날과 나의 사주로 찾는 최적의 이사 날짜"
      emoji="🏠"
      bg="#0a1e14"
      accent="#5ec98e"
      formHref="/moving/form"
      features={[
        "이사 희망 월의 손없는 날 전체 목록",
        "내 사주와 날짜별 궁합 분석",
        "최적 이사 날짜 TOP 3 추천",
        "유리한 이사 방향과 시간대",
      ]}
    />
  );
}
