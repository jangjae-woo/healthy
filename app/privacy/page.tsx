import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "개인정보처리방침 | 팔자원",
  description: "팔자원 개인정보처리방침",
};

export default function PrivacyPage() {
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
          개인정보처리방침
        </h1>
        <p className="text-xs mb-8" style={{ color: "#c9960caa" }}>
          시행일: 2026년 4월 21일
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#d6cdb8" }}>
          <section>
            <p>
              드림목공방(이하 &quot;회사&quot;)은 팔자원(八字苑) 사이트에서 이용자의
              개인정보를 중요시하며,「개인정보 보호법」및 관련 법령을 준수합니다. 회사는
              개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로
              이용되며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              1. 수집하는 개인정보 항목
            </h2>
            <p>회사는 서비스 제공을 위하여 다음의 개인정보를 수집합니다.</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>필수항목</strong>: 이름, 생년월일, 출생시간, 성별</li>
              <li><strong>선택항목</strong>: 휴대폰 번호 (결제 알림 및 결과 전송용)</li>
              <li><strong>결제 시</strong>: 결제수단 정보(카드사명, 결제승인번호 등) — 결제대행사(토스페이먼츠)를 통해 처리되며 회사는 카드번호 등의 민감한 결제정보를 직접 수집·저장하지 않습니다.</li>
              <li><strong>자동 수집</strong>: 접속 IP, 쿠키, 접속 로그, 이용 기록, 기기 정보(브라우저 종류, OS)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              2. 개인정보의 수집 및 이용 목적
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>사주·궁합 등 명리 풀이 결과 생성 및 제공</li>
              <li>유료 서비스 결제 처리 및 결제 결과 안내</li>
              <li>서비스 관련 문의 응대 및 고객 지원</li>
              <li>서비스 품질 개선 및 통계 분석 (개인 식별 불가한 형태로 가공)</li>
              <li>법령상 의무 이행 및 분쟁 해결</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                회사는 원칙적으로 서비스 제공이 완료된 후 지체 없이 개인정보를 파기합니다.
              </li>
              <li>다만, 다음과 같은 경우 명시한 기간 동안 보관합니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>전자상거래법에 의한 계약 또는 청약철회 기록: 5년</li>
                  <li>전자상거래법에 의한 대금결제 및 재화 공급 기록: 5년</li>
                  <li>전자상거래법에 의한 소비자 불만 또는 분쟁 처리 기록: 3년</li>
                  <li>통신비밀보호법에 의한 접속 로그 기록: 3개월</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              4. 개인정보의 제3자 제공
            </h2>
            <p>
              회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만,
              다음의 경우 예외로 합니다.
            </p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차에 따라 수사기관의 요구가 있는 경우</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              5. 개인정보 처리의 위탁
            </h2>
            <p>회사는 원활한 서비스 제공을 위하여 다음과 같이 업무를 위탁하고 있습니다.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="text-xs border-collapse w-full" style={{ color: "#d6cdb8" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #c9960c44" }}>
                    <th className="text-left py-2 pr-3" style={{ color: "#c9960c" }}>수탁자</th>
                    <th className="text-left py-2 pr-3" style={{ color: "#c9960c" }}>위탁 업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #c9960c22" }}>
                    <td className="py-2 pr-3">Vercel Inc.</td>
                    <td className="py-2 pr-3">웹사이트 호스팅 및 인프라 운영</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #c9960c22" }}>
                    <td className="py-2 pr-3">Google LLC</td>
                    <td className="py-2 pr-3">AI 모델(Gemini) 호출 — 사주 풀이 텍스트 생성</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #c9960c22" }}>
                    <td className="py-2 pr-3">토스페이먼츠 주식회사</td>
                    <td className="py-2 pr-3">결제 처리 및 결제 정보 관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              6. 이용자의 권리와 행사 방법
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.</li>
              <li>요청은 아래 개인정보 보호책임자의 이메일·전화로 신청 가능합니다.</li>
              <li>회사는 정당한 사유가 없는 한 지체 없이 조치를 완료합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              7. 개인정보의 안전성 확보 조치
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>전송 구간 암호화 (HTTPS / SSL)</li>
              <li>개인정보 처리 시스템에 대한 접근 권한 관리</li>
              <li>개인정보 취급자의 최소화 및 정기 교육</li>
              <li>접근 통제 및 침입 방지 시스템 운영</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              8. 쿠키(Cookie)의 운영
            </h2>
            <p>
              회사는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다.
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부
              서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              9. 개인정보 보호책임자
            </h2>
            <div className="space-y-1">
              <p>이름: 장재우</p>
              <p>
                이메일:{" "}
                <a href="mailto:pinkepank@naver.com" className="underline" style={{ color: "#c9960c" }}>
                  pinkepank@naver.com
                </a>
              </p>
              <p>연락처: 010-7479-5698</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              10. 개인정보처리방침의 변경
            </h2>
            <p>
              본 개인정보처리방침은 법령·정책 또는 회사 내부 정책 변경 시 개정될 수
              있으며, 변경이 있는 경우 사이트에 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              부칙
            </h2>
            <p>본 방침은 2026년 4월 21일부터 시행합니다.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
