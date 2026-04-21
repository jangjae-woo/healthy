import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "팔자원 八字苑 · 천 년의 지혜, 당신의 사주",
  description: "팔자원(八字苑) — 정통 명리학에 기반한 사주 풀이. 평생사주, 궁합, 이사날짜, 이름짓기.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+KR:wght@300;400;500;700;900&family=Gowun+Batang:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
