import ServiceLanding from "@/components/ServiceLanding";

export default function HongsilPage() {
  return (
    <ServiceLanding
      character="홍도인"
      title="나의 홍실 — 紅絲의 풀이"
      tagline="홍도인이 당신의 사주를 펼쳐 매력·인연 시기·짝꿍을 풀어드려요"
      emoji="🌹"
      bg="#fff7f9"
      bgEnd="#fce4d6"
      accent="#c8203a"
      formHref="/hongsil/form"
      features={[
        "내 매력과 연애 스타일 (1장 4풀이)",
        "사랑이 오는 타이밍 — 솔로 탈출은 언제? (2장)",
        "내 짝꿍 미리 보기 — 12 캐릭터 중 운명 (3장)",
        "반복되는 흑역사 패턴 진단·해방 (4장)",
        "솔직한 19금 사주 — 본능과 욕구 (5장)",
        "홍도인의 마지막 편지 (6장)",
      ]}
    />
  );
}
