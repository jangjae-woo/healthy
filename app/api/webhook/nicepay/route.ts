import { NextRequest, NextResponse } from 'next/server';

// 나이스페이먼츠 웹훅 수신 (가상계좌 입금, 비동기 결제 알림 등)
// 콘솔에 등록할 URL: https://paljawon.com/api/webhook/nicepay
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[NicePay Webhook]', JSON.stringify(body));
    // TODO: DB에 결제 상태 업데이트 (vbank 입금 완료 등)
    return NextResponse.json({ resultCode: '0000', resultMsg: 'OK' });
  } catch (e: any) {
    console.error('[NicePay Webhook Error]', e?.message);
    return NextResponse.json({ resultCode: '9999', resultMsg: 'fail' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
