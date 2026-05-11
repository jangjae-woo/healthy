import { NextRequest, NextResponse } from 'next/server';
import { sbRest, maskName, lastFourPhone } from '@/lib/supabase-admin';
import { SAJU_BASE_PRICE } from '@/lib/pricing';

// PortOne V2 결제 검증 + 인플루언서 attribution + 자동 할인 검증 + payments 적재.
//
// 흐름:
//   1. paymentId 받아 PortOne API 조회
//   2. status === 'PAID' 확인
//   3. 쿠키 pjw_ref → 인플루언서 + discount_amount 조회 (서버 단독 계산)
//   4. 서버 expected = SAJU_BASE_PRICE - discount_amount
//   5. PortOne 실제 결제액 === 서버 expected 검증 (클라 expectedAmount 무시 — 위변조 방어)
//   6. payments 테이블에 INSERT (할인액 기록)

const COOKIE_NAME = 'pjw_ref';

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId 누락' }, { status: 400 });
    }

    const apiSecret = process.env.PORTONE_V2_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json({ error: 'PortOne API Secret 미설정' }, { status: 500 });
    }

    // PortOne 결제 정보 조회
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
    if (typeof totalAmount !== 'number') {
      return NextResponse.json({ success: false, error: '결제 금액 정보 누락' }, { status: 400 });
    }

    // 쿠키 → 인플루언서 + 자동 할인
    const refSlug = req.cookies.get(COOKIE_NAME)?.value;
    let influencerId: string | null = null;
    let influencerDiscount = 0;
    if (refSlug) {
      try {
        const rows = await sbRest<Array<{ id: string; discount_amount: number }>>(`influencers`, {
          query: `?slug=eq.${encodeURIComponent(refSlug)}&select=id,discount_amount&limit=1`,
        });
        const row = rows?.[0];
        if (row) {
          influencerId = row.id;
          influencerDiscount = Math.max(0, Math.min(row.discount_amount ?? 0, SAJU_BASE_PRICE));
        }
      } catch (e) {
        console.error('[verify] influencer lookup', e);
      }
    }

    // 서버 단독 계산 — 클라이언트 expectedAmount 무시
    const expected = SAJU_BASE_PRICE - influencerDiscount;
    if (totalAmount !== expected) {
      return NextResponse.json(
        {
          success: false,
          error: `결제 금액 불일치 (실결제: ${totalAmount}원 / 서버 계산: ${expected}원 = 정가 ${SAJU_BASE_PRICE} - 할인 ${influencerDiscount})`,
        },
        { status: 400 }
      );
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
          discount_amount: influencerDiscount,
        },
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
    } catch (e) {
      console.error('[verify] payments insert', e);
      // 검증 통과 — DB 적재 실패가 풀이 노출 막진 않음
    }

    return NextResponse.json({
      success: true,
      paymentId,
      amount: totalAmount,
      method: payment.method,
      orderName: payment.orderName,
      paidAt: payment.paidAt,
      influencerId,
      discountAmount: influencerDiscount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
