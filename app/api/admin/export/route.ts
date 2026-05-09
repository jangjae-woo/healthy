import { NextRequest } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { verifyAdminSession, ADMIN_COOKIE_NAME } from '@/lib/affiliate-auth';

// 운영자 — 전체 결제 내역 CSV 다운로드
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
  influencer_id: string | null;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!(await verifyAdminSession(cookie))) return new Response('인증 필요', { status: 401 });

  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    let query = `?select=*&order=paid_at.desc&limit=10000`;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const to = new Date(Date.UTC(y, m, 1)).toISOString();
      query = `?select=*&paid_at=gte.${from}&paid_at=lt.${to}&order=paid_at.desc&limit=10000`;
    }
    const [rows, infs] = await Promise.all([
      sbRest<PaymentRow[]>('payments', { query }),
      sbRest<Array<{ id: string; slug: string; name: string }>>('influencers', { query: '?select=id,slug,name' }),
    ]);
    const infMap = new Map((infs ?? []).map(i => [i.id, i]));

    const headers = ['결제일시', '상태', '금액', '환불액', '환불일시', '상품명', '고객명', '전화끝4', '결제ID', '인플루언서slug', '인플루언서명'];
    const csvLines = [headers.join(',')];
    for (const r of rows ?? []) {
      const inf = r.influencer_id ? infMap.get(r.influencer_id) : null;
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
        csvEscape(inf?.slug ?? '직접유입'),
        csvEscape(inf?.name ?? ''),
      ].join(',');
      csvLines.push(line);
    }
    const csv = csvLines.join('\n');
    const bom = '﻿';
    const filename = `paljawon-admin-${month ?? 'all'}.csv`;
    return new Response(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : '서버 오류', { status: 500 });
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
