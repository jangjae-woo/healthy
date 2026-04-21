import { NextRequest, NextResponse } from 'next/server';

// PayApp이 결제 완료 후 returnurl로 POST 호출 → 결과 페이지(GET)로 303 리다이렉트
function redirectToResult(req: NextRequest) {
  const url = new URL(req.url);
  const target = new URL('/saju/result', url.origin);
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
  target.searchParams.set('justpaid', '1');
  return NextResponse.redirect(target, 303);
}

export async function POST(req: NextRequest) {
  return redirectToResult(req);
}

export async function GET(req: NextRequest) {
  return redirectToResult(req);
}
