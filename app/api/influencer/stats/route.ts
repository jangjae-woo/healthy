import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { verifyInfluencerSession, INFLUENCER_COOKIE_NAME } from '@/lib/affiliate-auth';

interface PaymentRow {
  amount: number;
  status: string;
  refund_amount: number | null;
  paid_at: string;
  refunded_at: string | null;
  product_name: string | null;
  customer_name_masked: string | null;
  customer_phone_last4: string | null;
  portone_payment_id: string;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(INFLUENCER_COOKIE_NAME)?.value;
  const slug = await verifyInfluencerSession(cookie);
  if (!slug) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }

  try {
    // 인플루언서 ID + 표시명 조회
    const infRows = await sbRest<Array<{ id: string; name: string; slug: string }>>(
      'influencers',
      { query: `?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug&limit=1` }
    );
    const inf = infRows?.[0];
    if (!inf) return NextResponse.json({ error: '인플루언서 미존재' }, { status: 404 });

    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000);

    let payQuery = `?select=*&influencer_id=eq.${inf.id}&order=paid_at.desc&limit=${limit}`;
    let visitQuery = `?select=ts&influencer_id=eq.${inf.id}`;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const to = new Date(Date.UTC(y, m, 1)).toISOString();
      payQuery = `?select=*&influencer_id=eq.${inf.id}&paid_at=gte.${from}&paid_at=lt.${to}&order=paid_at.desc&limit=${limit}`;
      visitQuery = `?select=ts&influencer_id=eq.${inf.id}&ts=gte.${from}&ts=lt.${to}`;
    }

    const [payments, visits] = await Promise.all([
      sbRest<PaymentRow[]>('payments', { query: payQuery }),
      sbRest<Array<{ ts: string }>>('visits', { query: `${visitQuery}&limit=10000` }),
    ]);

    const visitCount = visits?.length ?? 0;
    let paidCount = 0, refundCount = 0, gross = 0, refundAmount = 0;
    for (const r of payments ?? []) {
      if (r.status === 'PAID') { paidCount++; gross += r.amount; }
      else if (r.status === 'REFUNDED') { refundCount++; refundAmount += r.refund_amount ?? r.amount; }
      else if (r.status === 'PARTIAL_REFUND') { paidCount++; gross += r.amount; refundAmount += r.refund_amount ?? 0; }
    }
    const conversionRate = visitCount > 0 ? paidCount / visitCount : 0;

    return NextResponse.json({
      ok: true,
      influencer: { name: inf.name, slug: inf.slug },
      summary: {
        visitCount,
        paidCount,
        refundCount,
        refundRate: paidCount + refundCount > 0 ? refundCount / (paidCount + refundCount) : 0,
        conversionRate,
        grossSales: gross,
        refundAmount,
        netSales: gross - refundAmount,
      },
      rows: payments ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
