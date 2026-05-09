import { NextRequest, NextResponse } from 'next/server';
import { sbRest, maskName, lastFourPhone } from '@/lib/supabase-admin';

// PortOne V2 결제 검증 + 인플루언서 attribution + payments 적재.
// 흐름:
//   1. paymentId 받아 PortOne API 조회
//   2. status === 'PAID' && amount.total === expectedAmount 검증
//   3. 쿠키 pjw_ref → influencer_id 조회 (있으면 attribution)
//   4. payments 테이블에 INSERT (마스킹된 고객 정보 + influencer_id)

const COOKIE_NAME = 'pjw_ref';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, expectedAmount } = await req.json();
    if (!paymentId || !expectedAmount) {
      return NextResponse.json({ error: 'paymentId·expectedAmount 누락' }, { status: 400 });
    }

    const apiSecret = process.env.PORTONE_V2_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: 'PortOne API Secret 미설정' }, { status: 500 });
    }

    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${apiSecret}` },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: `PortOne API ${res.status}: ${t.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const payment = await res.json();
    const status = payment.status as string | undefined;
    const totalAmount = payment.amount?.total as number | undefined;

    if (status !== 'PAID') {
      return NextResponse.json(
        { success: false, status, error: `결제 상태: ${status ?? '알 수 없음'}` },
        { status: 400 }
      );
    }
    if (typeof totalAmount !== 'number' || totalAmount !== Number(expectedAmount)) {
      return NextResponse.json(
        { success: false, error: `결제 금액 불일치 (서버: ${totalAmount} / 기대: ${expectedAmount})` },
        { status: 400 }
      );
    }

    // 쿠키 → influencer_id
    const refSlug = req.cookies.get(COOKIE_NAME)?.value;
    let influencerId: string | null = null;
    if (refSlug) {
      try {
        const rows = await sbRest<Array<{ id: string }>>(`influencers`, {
          query: `?slug=eq.${encodeURIComponent(refSlug)}&select=id&limit=1`,
        });
        influencerId = rows?.[0]?.id ?? null;
      } catch (e) {
        console.error('[verify] influencer lookup', e);
      }
    }

    // payments INSERT (idempotent — portone_payment_id unique)
    try {
      await sbRest('payments', {
        method: 'POST',
        body: {
          portone_payment_id: paymentId,
          influencer_id: influencerId,
          amount: totalAmount,
          status: 'PAID',
          product_name: payment.orderName ?? null,
          customer_name_masked: maskName(payment.customer?.name ?? payment.customer?.fullName),
          customer_phone_last4: lastFourPhone(payment.customer?.phoneNumber),
          paid_at: payment.paidAt ?? new Date().toISOString(),
        },
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
    } catch (e) {
      console.error('[verify] payments insert', e);
      // 검증은 통과 — DB 적재 실패는 풀이 노출엔 영향 없게
    }

    return NextResponse.json({
      success: true,
      paymentId,
      amount: totalAmount,
      method: payment.method,
      orderName: payment.orderName,
      paidAt: payment.paidAt,
      influencerId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
