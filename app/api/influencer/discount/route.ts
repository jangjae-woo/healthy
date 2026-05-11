import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { SAJU_BASE_PRICE } from '@/lib/pricing';

// 현재 방문자의 인플루언서 추적 쿠키(pjw_ref) 기반 자동 할인액 조회.
// 결제 모달이 진입 시 호출하여 빗금 가격 자동 표시.

const COOKIE_NAME = 'pjw_ref';

export async function GET(req: NextRequest) {
  try {
    const slug = req.cookies.get(COOKIE_NAME)?.value;
    if (!slug) {
      return NextResponse.json({
        slug: null,
        discount_amount: 0,
        base_price: SAJU_BASE_PRICE,
        final_price: SAJU_BASE_PRICE,
      });
    }

    const rows = await sbRest<Array<{ slug: string; discount_amount: number }>>(`influencers`, {
      query: `?slug=eq.${encodeURIComponent(slug)}&select=slug,discount_amount&limit=1`,
    });
    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({
        slug: null,
        discount_amount: 0,
        base_price: SAJU_BASE_PRICE,
        final_price: SAJU_BASE_PRICE,
      });
    }

    const discount = Math.max(0, Math.min(row.discount_amount ?? 0, SAJU_BASE_PRICE));
    return NextResponse.json({
      slug: row.slug,
      discount_amount: discount,
      base_price: SAJU_BASE_PRICE,
      final_price: SAJU_BASE_PRICE - discount,
    });
  } catch (e) {
    console.error('[influencer/discount]', e);
    return NextResponse.json({
      slug: null,
      discount_amount: 0,
      base_price: SAJU_BASE_PRICE,
      final_price: SAJU_BASE_PRICE,
    });
  }
}
