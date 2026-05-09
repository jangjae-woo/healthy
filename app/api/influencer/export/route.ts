import { NextRequest } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { verifyInfluencerSession, INFLUENCER_COOKIE_NAME } from '@/lib/affiliate-auth';

// 인플루언서 결제 내역 CSV 다운로드 — Excel에서 열림 (UTF-8 BOM 포함).
// 쿼리: ?month=YYYY-MM (없으면 전체)

interface PaymentRow {
  paid_at: string;
  status: string;
  amount: number;
  refund_amount: number | null;
  refunded_at: string | null;
  product_name: string | null;
  customer_name_masked: string | null;
  customer_phone_last4: string | null;
  portone_payment_id: string;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(INFLUENCER_COOKIE_NAME)?.value;
  const slug = await verifyInfluencerSession(cookie);
  if (!slug) return new Response('인증 필요', { status: 401 });

  try {
    const infRows = await sbRest<Array<{ id: string; slug: string }>>(
      'influencers',
      { query: `?slug=eq.${encodeURIComponent(slug)}&select=id,slug&limit=1` }
    );
    const inf = infRows?.[0];
    if (!inf) return new Response('인플루언서 미존재', { status: 404 });

    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    let query = `?select=paid_at,status,amount,refund_amount,refunded_at,product_name,customer_name_masked,customer_phone_last4,portone_payment_id&influencer_id=eq.${inf.id}&order=paid_at.desc&limit=10000`;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const to = new Date(Date.UTC(y, m, 1)).toISOString();
      query = `?select=paid_at,status,amount,refund_amount,refunded_at,product_name,customer_name_masked,customer_phone_last4,portone_payment_id&influencer_id=eq.${inf.id}&paid_at=gte.${from}&paid_at=lt.${to}&order=paid_at.desc&limit=10000`;
    }

    const rows = await sbRest<PaymentRow[]>('payments', { query });

    const headers = ['결제일시', '상태', '금액', '환불액', '환불일시', '상품명', '고객명(마스킹)', '전화번호 끝4', '결제ID'];
    const csvLines = [headers.join(',')];
    for (const r of rows ?? []) {
      const line = [
        r.paid_at ? new Date(r.paid_at).toLocaleString('ko-KR') : '',
        statusLabel(r.status),
        String(r.amount ?? ''),
        String(r.refund_amount ?? ''),
        r.refunded_at ? new Date(r.refunded_at).toLocaleString('ko-KR') : '',
        csvEscape(r.product_name),
        csvEscape(r.customer_name_masked),
        csvEscape(r.customer_phone_last4),
        csvEscape(r.portone_payment_id),
      ].join(',');
      csvLines.push(line);
    }
    const csv = csvLines.join('\n');
    const bom = '﻿'; // Excel 한글 호환
    const filename = `paljawon-${slug}-${month ?? 'all'}.csv`;
    return new Response(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return new Response(msg, { status: 500 });
  }
}

function csvEscape(v: string | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function statusLabel(s: string): string {
  if (s === 'PAID') return '완료';
  if (s === 'REFUNDED') return '환불';
  if (s === 'PARTIAL_REFUND') return '부분환불';
  return s;
}
