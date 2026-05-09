import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/affiliate-auth';

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
  influencer_id: string | null;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(cookie))) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // YYYY-MM 형식, 없으면 전체
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 1000);

  let query = `?select=*&order=paid_at.desc&limit=${limit}`;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
    const to = new Date(Date.UTC(y, m, 1)).toISOString();
    query = `?select=*&paid_at=gte.${from}&paid_at=lt.${to}&order=paid_at.desc&limit=${limit}`;
  }

  try {
    const rows = await sbRest<PaymentRow[]>('payments', { query });
    const summary = aggregateStats(rows ?? []);
    return NextResponse.json({ ok: true, summary, rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function aggregateStats(rows: PaymentRow[]) {
  let paidCount = 0;
  let refundCount = 0;
  let grossSales = 0;
  let refundAmount = 0;
  for (const r of rows) {
    if (r.status === 'PAID') {
      paidCount++;
      grossSales += r.amount;
    } else if (r.status === 'REFUNDED') {
      refundCount++;
      refundAmount += r.refund_amount ?? r.amount;
    } else if (r.status === 'PARTIAL_REFUND') {
      paidCount++;
      grossSales += r.amount;
      refundAmount += r.refund_amount ?? 0;
    }
  }
  const netSales = grossSales - refundAmount;
  const refundRate = paidCount + refundCount > 0
    ? refundCount / (paidCount + refundCount)
    : 0;
  return {
    paidCount,
    refundCount,
    refundRate,
    grossSales,
    refundAmount,
    netSales,
  };
}
