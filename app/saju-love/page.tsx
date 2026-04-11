import ServiceLanding from "@/components/ServiceLanding";

export default function SajuLovePage() {
  return (
    <ServiceLanding
      character="색동낭자"
      title="연애 사주"
      tagline="당신의 인연을 풀어드려요"
      emoji="🌸"
      bg="#2a0a1a"
      accent="#ffb4c8"
      formHref="/saju-love/form"
      features={[
        "나의 연애 스타일 분석",
        "이상형과 궁합 보는 법",
        "올해 인연이 오는 시기",
        "현재 연애 중이라면 미래는?",
        "결혼운과 시기",
        "연애에서 조심할 것",
      ]}
    />
  );
}
