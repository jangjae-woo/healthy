import ServiceLanding from "@/components/ServiceLanding";

export default function NewYearPage() {
  return (
    <ServiceLanding
      character="세도인(歲道人)"
      title="신년 운세"
      tagline="한 해의 결을 풀이하는 길 — 2026년 병오년(丙午)의 흐름"
      emoji="歲"
      bg="#0a2a0a"
      accent="#90ee90"
      formHref="/new-year/form"
      features={[
        "총운 — 올 한 해 전체 흐름",
        "재물운 — 돈과 기회의 결",
        "연애운 — 인연과 관계의 변화",
        "건강운 — 몸과 마음의 결",
        "직업운 — 일과 커리어의 결",
        "월별 운세 하이라이트",
      ]}
    />
  );
}
