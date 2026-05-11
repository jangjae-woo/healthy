import { NextRequest, NextResponse } from 'next/server';
import { sbRest } from '@/lib/supabase-admin';
import { SAJU_BASE_PRICE } from '@/lib/pricing';

// 쿠폰 코드 검증 — 사용 카운트는 증가하지 않음 (free-unlock에서 atomic 증가).
// 단순 조회로 결제 모달의 UI(빗금·무료 표시)에만 사용.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const codeRaw = typeof body?.code === 'string' ? body.code : '';
    const code = codeRaw.trim();
    if (!code) {
      return NextResponse.json({ valid: false, reason: '쿠폰 코드를 입력해 주세요' });
    }

    const rows = await sbRest<Array<{
      code: string;
      discount_type: string;
      max_uses: number;
      used_count: number;
      active: boolean;
      expires_at: string | null;
    }>>(`coupons`, {
      query: `?code=eq.${encodeURIComponent(code)}&select=code,discount_type,max_uses,used_count,active,expires_at&limit=1`,
    });
    const row = rows?.[0];
    if (!row) {
      return NextResponse.json({ valid: false, reason: '존재하지 않는 쿠폰입니다' });
    }
    if (!row.active) {
      return NextResponse.json({ valid: false, reason: '비활성화된 쿠폰입니다' });
    }
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ valid: false, reason: '만료된 쿠폰입니다' });
    }
    if (row.used_count >= row.max_uses) {
      return NextResponse.json({ valid: false, reason: '사용 한도를 초과했습니다' });
    }

    // 현재는 'free' 타입만 지원
    return NextResponse.json({
      valid: true,
      code: row.code,
      discount_type: row.discount_type,
      base_price: SAJU_BASE_PRICE,
      final_price: 0,
      remaining: row.max_uses - row.used_count,
    });
  } catch (e) {
    console.error('[coupon/validate]', e);
    return NextResponse.json({ valid: false, reason: '검증 중 오류가 발생했습니다' }, { status: 500 });
  }
}
