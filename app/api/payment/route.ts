import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { price, returnUrl, recvphone, name } = await req.json();

  const params = new URLSearchParams({
    cmd:         'payrequest',
    userid:      'pinkepank',
    shopname:    '팔자원',
    goodname:    '평생 사주 풀이',
    price:       String(price),
    returnurl:   returnUrl,
  });
  if (recvphone) params.set('recvphone', String(recvphone).replace(/\D/g, ''));
  if (name) params.set('recvname', name);
  params.set('skip_cstpage', 'y');
  const body = `${params.toString()}&openpaytype=card,phone,applepay,naverpay,kakaopay,payco,rbank,vbank`;

  try {
    const res = await fetch('https://api.payapp.kr/oapi/apiLoad.html', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body,
    });
    const text = await res.text();
    const parsed = new URLSearchParams(text);
    const state  = parsed.get('state');
    const payurl = parsed.get('payurl');
    const errorMessage = parsed.get('errorMessage');

    if (state !== '1' || !payurl) {
      return NextResponse.json({ error: errorMessage || '결제 요청 실패' }, { status: 500 });
    }
    return NextResponse.json({ url: payurl });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
