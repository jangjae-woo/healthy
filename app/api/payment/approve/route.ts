import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { tid, amount } = await req.json();

  if (!tid || !amount) {
    return NextResponse.json({ error: 'tid/amount 누락' }, { status: 400 });
  }

  const clientKey = process.env.NICEPAY_CLIENT_KEY;
  const secretKey = process.env.NICEPAY_SECRET_KEY;
  if (!clientKey || !secretKey) {
    return NextResponse.json({ error: '나이스페이먼츠 키 미설정' }, { status: 500 });
  }

  const basicAuth = Buffer.from(`${clientKey}:${secretKey}`).toString('base64');

  const apiBase =
    process.env.NICEPAY_MODE === 'production'
      ? 'https://api.nicepay.co.kr'
      : 'https://api.nicepay.co.kr';

  try {
    const res = await fetch(`${apiBase}/v1/payments/${encodeURIComponent(tid)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({ amount: Number(amount) }),
    });

    const data = await res.json();

    if (data.resultCode === '0000') {
      return NextResponse.json({ success: true, payment: data });
    }
    return NextResponse.json(
      { success: false, error: data.resultMsg || '결제 승인 실패', raw: data },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || '서버 오류' },
      { status: 500 }
    );
  }
}
