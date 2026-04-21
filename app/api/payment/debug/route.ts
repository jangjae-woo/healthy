import { NextResponse } from 'next/server';

// 디버그 전용 — 환경변수가 제대로 로드됐는지 확인
// 실제 키는 노출하지 않고, 마스킹된 메타 정보만 반환
export async function GET() {
  const mask = (v: string | undefined) => {
    if (!v) return 'EMPTY/UNDEFINED';
    return `${v.slice(0, 4)}...${v.slice(-4)} (len=${v.length}, hasSpace=${/\s/.test(v)})`;
  };

  return NextResponse.json({
    clientKey: mask(process.env.NICEPAY_CLIENT_KEY),
    tokenKey: mask(process.env.NICEPAY_TOKEN_KEY),
    secretKey: mask(process.env.NICEPAY_SECRET_KEY),
    basicAuth: mask(process.env.NICEPAY_BASIC_AUTH),
    mode: process.env.NICEPAY_MODE || 'undefined',
  });
}
