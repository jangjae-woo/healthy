import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key');
    if (!key) return NextResponse.json({ found: false });

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL!;
    const res = await fetch(`${scriptUrl}?key=${encodeURIComponent(key)}`);
    const data = await res.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ found: false });
  }
}
