import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { SAJU_BASE_PRICE } from '@/lib/pricing';

// 무료 쿠폰 사용 — atomic 사용 카운트 증가 + payments INSERT.
// PortOne 결제 스킵, 바로 unlock.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const codeRaw = typeof body?.code === 'string' ? body.code : '';
    const code = codeRaw.trim();
    if (!code) {
      return NextResponse.json({ success: false, error: '쿠폰 코드를 입력해 주세요' }, { status: 400 });
    }

    // atomic 사용 카운트 증가 (RPC)
    const rpcRes = await sbRest<Array<{ success: boolean; message: string; coupon_id: string | null; influencer_id: string | null }>>(
      `rpc/increment_coupon_use`,
      {
        method: 'POST',
        body: { coupon_code_param: code },
      }
    );
    const result = Array.isArray(rpcRes) ? rpcRes[0] : (rpcRes as any);
    if (!result?.success) {
      return NextResponse.json({ success: false, error: result?.message || '쿠폰 사용 실패' }, { status: 400 });
    }

    // 결제 row INSERT (무료)
    const paymentId = `free${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    try {
      await sbRest('payments', {
        method: 'POST',
        body: {
          portone_payment_id: paymentId,
          influencer_id: result.influencer_id,
          amount: 0,
          status: 'PAID_FREE',
          product_name: '평생 사주 풀이 (쿠폰)',
          customer_name_masked: '',
          customer_phone_last4: '',
          paid_at: new Date().toISOString(),
          coupon_code: code,
          discount_amount: SAJU_BASE_PRICE,
        },
        prefer: 'resolution=ignore-duplicates,return=minimal',
      });
    } catch (e) {
      console.error('[free-unlock] payments insert', e);
      // 적재 실패해도 unlock은 진행 (사용자 영향 차단)
    }

    return NextResponse.json({
      success: true,
      paymentId,
      influencer_id: result.influencer_id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '서버 오류';
    console.error('[coupon/free-unlock]', e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
