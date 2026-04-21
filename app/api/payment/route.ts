import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { amount, goodsName, returnUrl } = await req.json();

  const clientKey = process.env.NICEPAY_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json({ error: 'NICEPAY_CLIENT_KEY missing' }, { status: 500 });
  }

  const orderId = `saju-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  return NextResponse.json({
    clientKey,
    orderId,
    amount: Number(amount) || 23900,
    goodsName: goodsName || '평생 사주 풀이 (공동구매가)',
    returnUrl,
  });
}
