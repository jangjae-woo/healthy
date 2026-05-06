import ServiceLanding from "@/components/ServiceLanding";

export default function ParentChildPage() {
  return (
    <ServiceLanding
      character="자도인"
      title="엄마와 아이 궁합 (V2)"
      tagline="새 7장 구조 — 부모 언어로 다시 쓴 자도인 풀이"
      emoji="🌸"
      bg="#2a1a1d"
      bgEnd="#1a0d10"
      accent="#f0a8b8"
      formHref="/parent-child-v2/form"
      features={[
        "엄마와 아이의 본질·기질 비교",
        "오행 궁합 — 엄마가 채워주는 기운",
        "아이의 타고난 재능과 성향",
        "양육 시 주의해야 할 점",
        "갈등이 생기는 시기와 푸는 법",
        "함께 성장하는 시간의 흐름",
      ]}
    />
  );
}
