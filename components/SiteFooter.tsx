'use client';

import Link from "next/link";
import { useState } from "react";

export default function SiteFooter() {
  const [open, setOpen] = useState(false);

  return (
    <footer
      className="w-full mt-16 px-4 py-8 text-xs"
      style={{
        background: "linear-gradient(180deg, #060d07 0%, #030604 100%)",
        color: "#a39068",
        borderTop: "1px solid #c9960c33",
      }}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {/* 사업자 정보 — 드롭다운 펼친 영역 */}
        {open && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[11px] leading-relaxed pb-3" style={{ borderBottom: "1px solid #c9960c22" }}>
            <div
              className="grid gap-x-4 gap-y-1"
              style={{ color: "#a3906899", gridTemplateColumns: "auto 1fr" }}
            >
              <span style={{ color: "#a3906899" }}>상호</span>
              <span style={{ color: "#a3906899" }}>드림목공방</span>

              <span style={{ color: "#a3906899" }}>대표자</span>
              <span>장재우</span>

              <span style={{ color: "#a3906899" }}>사업자등록번호</span>
              <span>822-21-00477</span>

              <span style={{ color: "#a3906899" }}>통신판매업 신고</span>
              <span>제2017-경기김포-1113호</span>
            </div>

            <div
              className="grid gap-x-4 gap-y-1"
              style={{ color: "#a3906899", gridTemplateColumns: "auto 1fr" }}
            >
              <span style={{ color: "#a3906899" }}>이메일</span>
              <span>
                <a href="mailto:pinkepank@naver.com" className="hover:underline">
                  pinkepank@naver.com
                </a>
              </span>

              <span style={{ color: "#a3906899" }}>주소</span>
              <span>경기도 김포시 대곶면 오니산로 52, 나동</span>

              <span style={{ color: "#a3906899" }}>연락처</span>
              <span>010-7479-5698</span>

              <span style={{ color: "#a3906899" }}>호스팅</span>
              <span>Vercel Inc.</span>

              <span style={{ color: "#a3906899" }}>결제대행</span>
              <span>토스페이먼츠</span>
            </div>
          </div>
        )}

        {/* 약관 + 사업자 정보 토글 링크 */}
        <div
          className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-3"
          style={{ borderTop: open ? "none" : "1px solid #c9960c22" }}
        >
          <Link href="/terms" className="hover:underline" style={{ color: "#c9960c" }}>
            이용약관
          </Link>
          <Link href="/privacy" className="hover:underline" style={{ color: "#c9960c" }}>
            개인정보처리방침
          </Link>
          <Link href="/refund" className="hover:underline" style={{ color: "#c9960c" }}>
            환불정책
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="hover:underline cursor-pointer"
            style={{ color: "#c9960c", background: "none", border: "none", padding: 0, fontSize: "inherit" }}
          >
            사업자 정보 {open ? "▲" : "▼"}
          </button>
        </div>

        <div className="text-center text-[11px]" style={{ color: "#78350f99" }}>
          © 2026 All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
