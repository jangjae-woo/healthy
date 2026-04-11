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
        "사주원국 (팔자 전체 구조)",
        "오행 분석 (목·화·토·금·수)",
        "십성 분석 (나의 성격과 대인관계)",
        "대운 흐름 (10년 단위 운의 흐름)",
        "2026년 세운 분석",
        "총평 및 조언",
      ]}
    />
  );
}
