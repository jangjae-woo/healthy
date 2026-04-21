import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "환불 정책 | 팔자원",
  description: "팔자원 환불 정책 및 청약철회 안내",
};

export default function RefundPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0d1a0f 0%, #060d07 100%)",
        color: "#e7e2d8",
      }}
    >
      <div className="flex-1 max-w-3xl w-full mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#fef3c7" }}>
          환불 정책
        </h1>
        <p className="text-xs mb-8" style={{ color: "#c9960caa" }}>
          시행일: 2026년 4월 21일
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#d6cdb8" }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              1. 환불 원칙
            </h2>
            <p>
              팔자원(八字苑)에서 제공하는 사주·궁합 풀이는 디지털 콘텐츠의 특성상,
              결과 콘텐츠가 제공된 이후에는 「전자상거래 등에서의 소비자보호에 관한 법률」
              제17조 제2항 제5호에 따라 청약철회가 제한됩니다. 다만, 이용자 보호를 위해
              아래의 기준에 따라 환불을 진행합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              2. 환불 가능 / 불가능 기준
            </h2>

            <div
              className="rounded-lg p-4 mt-2 mb-3"
              style={{ background: "#0a1e1488", border: "1px solid #5ec98e44" }}
            >
              <div className="font-bold mb-1" style={{ color: "#5ec98e" }}>
                ✅ 100% 환불 가능
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>결제 완료 직후 사주 풀이 결과(슬라이드)가 단 한 페이지도 표시되지 않은 상태</li>
                <li>시스템 오류로 인해 결제는 완료되었으나 결과를 받지 못한 경우</li>
                <li>이중 결제 등 명백한 결제 시스템 오류</li>
              </ul>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: "#1e0a0a88", border: "1px solid #c97a5e44" }}
            >
              <div className="font-bold mb-1" style={{ color: "#e89a8a" }}>
                ❌ 환불 불가능
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>결제 후 사주 풀이 결과 페이지(유료 슬라이드)를 1개 이상 열람한 경우</li>
                <li>풀이 결과를 다운로드·캡쳐·복사·공유한 경우</li>
                <li>결제 후 7일이 경과한 경우</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              3. 환불 신청 방법
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>아래 연락처로 이메일 또는 문자 메시지를 통해 환불을 신청합니다.</li>
              <li>
                신청 시 다음 정보를 함께 보내주세요.
                <ul className="list-disc pl-5 mt-1">
                  <li>결제자 성함 / 결제 일시</li>
                  <li>결제 수단 (카드사명, 결제 승인번호 등)</li>
                  <li>환불 사유</li>
                </ul>
              </li>
              <li>회사는 신청을 접수한 후 영업일 기준 3일 이내에 환불 가능 여부를 회신합니다.</li>
              <li>
                환불이 승인되면 영업일 기준 7일 이내에 결제 수단을 통해 환불됩니다. 단,
                결제 수단의 정책에 따라 카드사 환불은 최대 7~14일이 소요될 수 있습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              4. 환불 문의처
            </h2>
            <div
              className="rounded-lg p-4 space-y-1"
              style={{ background: "#0d1a0fcc", border: "1px solid #c9960c44" }}
            >
              <p>
                <span style={{ color: "#c9960caa" }}>이메일: </span>
                <a href="mailto:pinkepank@naver.com" className="underline" style={{ color: "#c9960c" }}>
                  pinkepank@naver.com
                </a>
              </p>
              <p>
                <span style={{ color: "#c9960caa" }}>연락처: </span>010-7479-5698
              </p>
              <p style={{ color: "#a39068", fontSize: "11px" }}>
                상담 가능 시간: 평일 10:00 ~ 18:00 (주말·공휴일 제외)
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              5. 분쟁 해결
            </h2>
            <p>
              환불 처리에 대해 분쟁이 발생할 경우, 회사와 이용자는 상호 협의하여 원만하게
              해결하도록 노력합니다. 협의가 이루어지지 않을 경우 공정거래위원회 또는
              소비자분쟁조정위원회 등 관련 기관의 조정을 받거나, 관할 법원의 판결에
              따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              부칙
            </h2>
            <p>본 환불 정책은 2026년 4월 21일부터 시행합니다.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
