import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 사주 | 운세 풀이",
  description: "AI가 풀어드리는 정통 사주팔자. 평생사주, 신년운세, 연애사주, 정통관상",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
