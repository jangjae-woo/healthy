import { NextRequest, NextResponse } from 'next/server';

// ⭐ V2.2.3 (2026-05-15) — service 파라미터 추가, 시트 탭 분기 로드
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key');
    const service = req.nextUrl.searchParams.get('service') ?? 'saju';
    if (!key) return NextResponse.json({ found: false });

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL!;
    const res = await fetch(
      `${scriptUrl}?key=${encodeURIComponent(key)}&service=${encodeURIComponent(service)}`
    );
    const data = await res.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ found: false });
  }
}
