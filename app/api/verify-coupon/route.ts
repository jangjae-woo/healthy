import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ valid: false });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const normalized = code.trim().toUpperCase();

    const res = await fetch(
      `${supabaseUrl}/rest/v1/saju_coupons?code=eq.${encodeURIComponent(normalized)}&is_active=eq.true&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ valid: false });
    }

    const coupon = data[0];
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, type: coupon.channel_name, discount: coupon.discount_amount });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
