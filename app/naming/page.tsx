import ServiceLanding from "@/components/ServiceLanding";

export default function NamingPage() {
  return (
    <ServiceLanding
      character="황도인"
      title="이름 짓기 · 개명"
      tagline="사주 오행을 보완하고 원하는 느낌을 담은 이름 추천"
      emoji="✍️"
      bg="#1e1408"
      accent="#e8b84b"
      formHref="/naming/form"
      features={[
        "사주 부족 오행을 채우는 발음오행 분석",
        "원하는 이름 느낌 반영",
        "수리사격(획수) 길흉 확인",
        "한자 뜻과 이름 3가지 추천",
      ]}
    />
  );
}
