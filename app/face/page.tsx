import ServiceLanding from "@/components/ServiceLanding";

export default function FacePage() {
  return (
    <ServiceLanding
      character="관상가 양반"
      title="정통 관상"
      tagline="사진 한 장이면 AI가 성격, 연애운, 재물운, 직업운까지"
      emoji="🪬"
      bg="#1a1a0a"
      accent="#ffd700"
      formHref="/face/form"
      features={[
        "얼굴형과 이목구비 관상 분석",
        "성격과 기질",
        "연애운 및 배우자운",
        "재물운과 사업운",
        "직업운과 적성",
        "건강 관련 관상",
      ]}
    />
  );
}
