import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "이용약관 | 팔자원",
  description: "팔자원 이용약관",
};

export default function TermsPage() {
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
          이용약관
        </h1>
        <p className="text-xs mb-8" style={{ color: "#c9960caa" }}>
          시행일: 2026년 4월 21일
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#d6cdb8" }}>
          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제1조 (목적)
            </h2>
            <p>
              본 약관은 드림목공방(이하 &quot;회사&quot;)이 운영하는 팔자원(八字苑)
              사이트(이하 &quot;사이트&quot;)에서 제공하는 AI 명리(사주) 풀이 등 디지털
              콘텐츠 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자의
              권리·의무·책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제2조 (용어의 정의)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>&quot;서비스&quot;란 회사가 제공하는 AI 기반 명리(사주) 풀이, 궁합 풀이 등 디지털 콘텐츠를 말합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
              <li>&quot;결제&quot;란 이용자가 서비스 이용의 대가로 회사에 요금을 지급하는 행위를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제3조 (약관의 효력 및 변경)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>본 약관은 사이트에 게시함으로써 효력을 발생합니다.</li>
              <li>
                회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며,
                변경된 약관은 사이트에 공지한 날로부터 효력이 발생합니다.
              </li>
              <li>
                이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제4조 (서비스의 제공)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>회사는 이용자에게 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc pl-5 mt-1">
                  <li>평생 사주 풀이</li>
                  <li>인연 풀이 (연인·친구·가족·동료 등)</li>
                  <li>기타 회사가 추가로 제공하는 명리 관련 디지털 콘텐츠</li>
                </ul>
              </li>
              <li>서비스는 연중무휴 24시간 제공함을 원칙으로 합니다.</li>
              <li>
                회사는 시스템 점검, 기술적 이유, 기타 불가피한 사유로 서비스 제공을
                일시 중단할 수 있으며, 이 경우 사전 또는 사후에 공지합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제5조 (서비스의 성격 및 면책)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                본 서비스에서 제공하는 사주·명리 풀이는 전통 명리학 이론과 AI 기술에
                기반한 <strong>참고용 해석</strong>이며, 법적·의학적·투자·진로 등의 결정에
                대한 확정적 조언이 아닙니다.
              </li>
              <li>
                이용자는 서비스 결과를 참고 자료로만 활용하여야 하며, 이에 근거한
                모든 판단과 선택의 책임은 이용자 본인에게 있습니다.
              </li>
              <li>
                회사는 이용자가 서비스 결과를 근거로 행한 의사결정의 결과에 대하여
                법적 책임을 지지 않습니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제6조 (이용자의 의무)
            </h2>
            <p>이용자는 다음 각 호의 행위를 하여서는 안 됩니다.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>타인의 정보를 도용하여 서비스를 이용하는 행위</li>
              <li>서비스 결과를 무단으로 복제·배포·판매하는 행위</li>
              <li>회사의 서버에 부하를 주거나 정상 운영을 방해하는 행위</li>
              <li>관련 법령에 위배되는 목적으로 서비스를 이용하는 행위</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제7조 (결제 및 환불)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>유료 서비스의 결제 수단은 사이트에 안내된 방법(신용·체크카드, 간편결제, 계좌이체, 가상계좌, 휴대폰결제 등)에 따릅니다.</li>
              <li>
                환불에 관한 세부 사항은 별도의{" "}
                <a href="/refund" className="underline" style={{ color: "#c9960c" }}>
                  환불 정책
                </a>
                에 따릅니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제8조 (개인정보의 보호)
            </h2>
            <p>
              회사는 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 내용은{" "}
              <a href="/privacy" className="underline" style={{ color: "#c9960c" }}>
                개인정보처리방침
              </a>
              에 규정합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제9조 (지적재산권)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>서비스 내 콘텐츠·UI·디자인·로고 등의 저작권은 회사에 귀속됩니다.</li>
              <li>이용자는 사전 서면 동의 없이 회사의 콘텐츠를 상업적으로 이용할 수 없습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              제10조 (분쟁의 해결 및 관할)
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                서비스 이용과 관련하여 분쟁이 발생한 경우, 이용자와 회사는 상호 협의하여
                원만하게 해결하도록 노력합니다.
              </li>
              <li>
                협의가 이루어지지 않을 경우, 관련 법령 및 상관례에 따라 해결하며,
                관할 법원은 민사소송법상의 관할 법원으로 합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-bold mb-2" style={{ color: "#c9960c" }}>
              부칙
            </h2>
            <p>본 약관은 2026년 4월 21일부터 시행합니다.</p>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
