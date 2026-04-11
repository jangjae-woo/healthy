import ServiceLanding from "@/components/ServiceLanding";

export default function NewYearPage() {
  return (
    <ServiceLanding
      character="까치도령"
      title="신년 운세"
      tagline="2026년 병오년, 당신의 한 해를 풀어드립니다"
      emoji="🎋"
      bg="#0a2a0a"
      accent="#90ee90"
      formHref="/new-year/form"
      features={[
        "총운 (올 한해 전체 흐름)",
        "재물운 (돈과 기회의 흐름)",
        "연애운 (인연과 관계의 변화)",
        "건강운 (몸과 마음의 상태)",
        "직업운 (일과 커리어)",
        "월별 운세 하이라이트",
      ]}
    />
  );
}
