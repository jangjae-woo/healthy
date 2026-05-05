import ServiceLanding from "@/components/ServiceLanding";

export default function InyeonPage() {
  return (
    <ServiceLanding
      character="홍연"
      title="인연궁합 — 紅蓮의 풀이"
      tagline="청월당 인연지기 홍연이 두 분의 사주를 펼쳐 인연의 결을 풀어드려요"
      emoji="🌺"
      bg="#2a1a1d"
      bgEnd="#1a0d10"
      accent="#f0a8b8"
      formHref="/inyeon/form"
      features={[
        "두 분 각자의 본질·매력·이상형 (제1장)",
        "인연의 붉은 실 — 전생부터 이번 생까지 (제2장)",
        "성격궁합 — 함께 있을 때의 결 (제3장)",
        "관계 유형·만난 기간에 따라 풀이가 달라져요",
        "사주 8글자 표·오행 분포·용신 카드 시각 자료",
        "계절별 데이트 · 화해법 · 장기 조언",
      ]}
    />
  );
}
