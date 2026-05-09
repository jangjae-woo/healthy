import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';

// PortOne V2 웹훅 수신 — 결제 완료 / 환불 / 부분환불 / 가상계좌 입금 등.
// PortOne 콘솔 등록 URL: https://www.paljawon.com/api/portone/webhook
//
// PortOne webhook payload (V2):
//   { type: 'Transaction.Paid' | 'Transaction.Cancelled' | 'Transaction.PartialCancelled' | ...,
//     timestamp, data: { paymentId, ... } }

interface WebhookBody {
  type?: string;
  data?: { paymentId?: string };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WebhookBody;
    console.log('[PortOne Webhook]', JSON.stringify(body));

    const eventType = body.type;
    const paymentId = body.data?.paymentId;
    if (!eventType || !paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 환불 / 부분 환불
    if (eventType === 'Transaction.Cancelled' || eventType === 'Transaction.PartialCancelled') {
      const apiSecret = process.env.PORTONE_V2_API_SECRET;
      if (!apiSecret) {
        return NextResponse.json({ ok: false, error: 'API Secret 미설정' }, { status: 500 });
      }

      // PortOne API로 실제 결제 상태 재조회 (위변조 방어)
      const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `PortOne ${apiSecret}` },
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: `PortOne API ${res.status}` }, { status: 502 });
      }
      const payment = await res.json();
      const status = payment.status as string | undefined;
      const cancelledAmount = payment.cancelledAmount?.total ?? payment.cancelAmount ?? 0;

      const newStatus =
        status === 'CANCELLED' || status === 'FULLY_CANCELLED' ? 'REFUNDED'
        : status === 'PARTIAL_CANCELLED' ? 'PARTIAL_REFUND'
        : 'PAID';

      await sbRest('payments', {
        method: 'PATCH',
        query: `?portone_payment_id=eq.${encodeURIComponent(paymentId)}`,
        body: {
          status: newStatus,
          refunded_at: new Date().toISOString(),
          refund_amount: cancelledAmount,
        },
        prefer: 'return=minimal',
      });
    }

    // 결제 완료 (verify 라우트 안 거친 케이스 백필 — 가상계좌 입금 등)
    if (eventType === 'Transaction.Paid') {
      // 이미 INSERT 됐으면 unique constraint로 무시됨
      // (verify 라우트에서 ignore-duplicates 사용)
      // 별도 처리 필요 시 여기서 재조회하여 INSERT
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fail';
    console.error('[PortOne Webhook Error]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
